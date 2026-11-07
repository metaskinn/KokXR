// Pure text calculations for the VR menu and info card. Run: node tests/model-xr-text.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { menuItems, wrapLine, menuHit, ILLUSTRATIVE_LABEL, MENU_TITLE_RATIO } from '../src/shared/xr/xrText.ts'

assert.equal(ILLUSTRATIVE_LABEL, 'Temsilî maket · Gerçek bir 3B tarama değildir')
assert.equal(MENU_TITLE_RATIO, 0.2)

// Menu items
const identity = (l) => l.map((o) => o.id)
const stops = Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, ad: `Durak ${i}` }))
let m = menuItems({ inside: false, fragmented: false, stops })
assert.deepEqual(identity(m), ['inside', 'shatter', 'assemble', 'exit'])
assert.deepEqual(m.map((o) => o.ad), ['İçeri gir', 'Parçala', 'Maketi birleştir', "VR'dan çık"])
m = menuItems({ inside: false, fragmented: true, stops })
assert.deepEqual(m.map((o) => o.ad), ['İçeri gir', 'Birleştir', "VR'dan çık"])
m = menuItems({ inside: false, fragmented: false, inAssembly: true, stops })
assert.deepEqual(identity(m), ['assembleFromStart', 'assembleRelease', 'exit'])
assert.deepEqual(m.map((o) => o.ad), ['Yeniden başlat', 'Birleştirmeyi bırak', "VR'dan çık"])
m = menuItems({ inside: true, fragmented: false, stops })
assert.equal(m.length, 10)
assert.deepEqual(m[0], { id: 'outside', ad: 'Dışarı çık' })
assert.deepEqual(m[1], { id: 'stop:d0', ad: 'Durak 0' })
assert.deepEqual(m[9], { id: 'exit', ad: "VR'dan çık" })

// Line wrapping: words are not split, words that do not fit are hard-split, no letter is lost
const lengthVal = (s) => s.length
assert.deepEqual(wrapLine('bir iki üç', lengthVal, 7), ['bir iki', 'üç'])
assert.deepEqual(wrapLine('', lengthVal, 10), [])
assert.deepEqual(wrapLine('  bir   iki  ', lengthVal, 40), ['bir iki'])
const long = wrapLine('ş'.repeat(100), lengthVal, 30)
assert.equal(long.join(''), 'ş'.repeat(100))
assert(long.every((s) => s.length <= 30))
assert.deepEqual(wrapLine('ab ' + 'c'.repeat(12) + ' de', lengthVal, 5), ['ab', 'ccccc', 'ccccc', 'cc de'])
// Works in browsers without Intl.Segmenter; not required when the module loads
const segmenter = Intl.Segmenter
delete Intl.Segmenter
assert.deepEqual(wrapLine('ş'.repeat(7), lengthVal, 3), ['şşş', 'şşş', 'ş'])
await import(`../src/shared/xr/xrText.ts?noSegmenter`)
Intl.Segmenter = segmenter
assert.deepEqual(wrapLine('abc', lengthVal, 0), ['a', 'b', 'c']) // No infinite loop even if the width is insufficient
assert.deepEqual(wrapLine('İ̇ş', lengthVal, 1), ['İ̇', 'ş']) // A combining mark is not separated from its letter

// All info cards fit; 900 px width, 0.55 × 34 px per character
const artifact = JSON.parse(readFileSync(new URL('../src/content/artifacts/ulu-mosque.json', import.meta.url), 'utf8'))
const measure = (s) => s.length * 0.55 * 34
let maxLines = 0
assert(artifact.model.interiorInfos.length > 0)
for (const info of artifact.model.interiorInfos) {
  const source = artifact.sources.find((k) => k.id === info.sourceId)
  assert(source, `${info.id}: no source`)
  const line = `Kaynak: ${source.text}${source.page ? `, s. ${source.page}` : ''}`
  const textLines = wrapLine(info.text, measure, 900)
  const sourceLines = wrapLine(line, measure, 900)
  assert.equal(textLines.join(' '), info.text, `${info.id}: text corrupted`)
  assert.equal(sourceLines.join(' '), line, `${info.id}: source corrupted`)
  const total = textLines.length + sourceLines.length
  maxLines = Math.max(maxLines, total)
  assert(total <= 13, `${info.id}: ${total} lines`)
}

// Panel hit: v = 1 is the top edge
assert.equal(menuHit(0.95, 3, 0.2), null)
assert.equal(menuHit(0.75, 3, 0.2), 0)
assert.equal(menuHit(0.05, 3, 0.2), 2)
assert.equal(menuHit(0, 3, 0.2), 2)
assert.equal(menuHit(0.5, 0, 0.2), null)
assert.equal(menuHit(1.2, 3, 0.2), null)
assert.equal(menuHit(-0.1, 3, 0.2), null)
for (let i = 0; i < 10; i++) assert.equal(menuHit(0.8 - (i + 0.5) * 0.08, 10, 0.2), i)

console.log(`VR text: menu items, line wrapping, hit test and fit of ${artifact.model.interiorInfos.length} cards passed (longest ${maxLines} lines).`)
