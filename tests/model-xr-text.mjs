// VR menüsü ve bilgi kartının saf metin hesapları. Çalıştırma: node tests/maket-xr-metin.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { menuItems, wrapLine, menuHit, ILLUSTRATIVE_LABEL, MENU_TITLE_RATIO } from '../src/components/model/xrText.ts'

assert.equal(ILLUSTRATIVE_LABEL, 'Temsilî maket · Gerçek bir 3B tarama değildir')
assert.equal(MENU_TITLE_RATIO, 0.2)

// Menü öğeleri
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

// Satır kırma: sözcük bölünmez, sığmayan sözcük sert bölünür, hiçbir harf kaybolmaz
const lengthVal = (s) => s.length
assert.deepEqual(wrapLine('bir iki üç', lengthVal, 7), ['bir iki', 'üç'])
assert.deepEqual(wrapLine('', lengthVal, 10), [])
assert.deepEqual(wrapLine('  bir   iki  ', lengthVal, 40), ['bir iki'])
const dev = wrapLine('ş'.repeat(100), lengthVal, 30)
assert.equal(dev.join(''), 'ş'.repeat(100))
assert(dev.every((s) => s.length <= 30))
assert.deepEqual(wrapLine('ab ' + 'c'.repeat(12) + ' de', lengthVal, 5), ['ab', 'ccccc', 'ccccc', 'cc de'])
// Intl.Segmenter olmayan tarayıcıda da çalışır; modül yüklenirken gerekmez
const segmenter = Intl.Segmenter
delete Intl.Segmenter
assert.deepEqual(wrapLine('ş'.repeat(7), lengthVal, 3), ['şşş', 'şşş', 'ş'])
await import(`../src/components/model/xrText.ts?noSegmenter`)
Intl.Segmenter = segmenter
assert.deepEqual(wrapLine('abc', lengthVal, 0), ['a', 'b', 'c']) // Genişlik yetmese de sonsuz döngü olmaz
assert.deepEqual(wrapLine('İ̇ş', lengthVal, 1), ['İ̇', 'ş']) // Birleşen işaret harfinden ayrılmaz

// Tüm bilgi kartları sığar; 900 px genişlik, karakter başına 0,55 × 34 px
const artifact = JSON.parse(readFileSync(new URL('../src/data/artifacts/ulu-mosque.json', import.meta.url), 'utf8'))
const measure = (s) => s.length * 0.55 * 34
let mostOf = 0
assert(artifact.model.interiorInfos.length > 0)
for (const info of artifact.model.interiorInfos) {
  const source = artifact.sources.find((k) => k.id === info.sourceId)
  assert(source, `${info.id}: kaynak yok`)
  const line = `Kaynak: ${source.text}${source.page ? `, s. ${source.page}` : ''}`
  const textLines = wrapLine(info.text, measure, 900)
  const sourceLines = wrapLine(line, measure, 900)
  assert.equal(textLines.join(' '), info.text, `${info.id}: metin bozuldu`)
  assert.equal(sourceLines.join(' '), line, `${info.id}: kaynak bozuldu`)
  const total = textLines.length + sourceLines.length
  mostOf = Math.max(mostOf, total)
  assert(total <= 13, `${info.id}: ${total} satır`)
}

// Panel isabeti: v = 1 üst kenar
assert.equal(menuHit(0.95, 3, 0.2), null)
assert.equal(menuHit(0.75, 3, 0.2), 0)
assert.equal(menuHit(0.05, 3, 0.2), 2)
assert.equal(menuHit(0, 3, 0.2), 2)
assert.equal(menuHit(0.5, 0, 0.2), null)
assert.equal(menuHit(1.2, 3, 0.2), null)
assert.equal(menuHit(-0.1, 3, 0.2), null)
for (let i = 0; i < 10; i++) assert.equal(menuHit(0.8 - (i + 0.5) * 0.08, 10, 0.2), i)

console.log(`VR metin: menü öğeleri, satır kırma, isabet ve ${artifact.model.interiorInfos.length} kartın sığması başarılı (en uzun ${mostOf} satır).`)
