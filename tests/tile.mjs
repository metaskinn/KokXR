// Çini atölyesini gerçek fare olaylarıyla baştan sona oynar. Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: node tests/cini.mjs [ekran-görüntüsü-klasörü]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173', folder = process.argv[2]
const b = await chromium.launch({ channel: 'chromium', args: ['--use-gl=angle', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-gpu'] })
const s = await b.newPage({ viewport: { width: 1600, height: 1000 } }), errors = []
s.on('pageerror', (e) => errors.push(e.message)); s.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await s.goto(`${url}/workshops/tile`); const area = s.locator('.tile-scene'); await area.locator('canvas').waitFor()
await s.waitForFunction(() => document.querySelector('.tile-scene')?.dataset.stage === '0'); await area.scrollIntoViewIfNeeded()
const data = (k) => area.getAttribute(`data-${k}`), stage = async () => +(await data('stage'))
const awaitStage = (n, t = 30000) => s.waitForFunction((v) => document.querySelector('.tile-scene')?.dataset.stage === String(v), n, { timeout: t })
const see = (ad) => folder ? s.screenshot({ path: `${folder}/${ad}.png` }) : null
async function window() {
  const k = await area.boundingBox(), p = async (a) => (await data(a)).split(',').map(Number)
  const m = await p('plate-center'), x = await p('plate-x'), z = await p('plate-z')
  return (ux, uz) => [k.x + m[0] + (x[0] - m[0]) * ux + (z[0] - m[0]) * uz, k.y + m[1] + (x[1] - m[1]) * ux + (z[1] - m[1]) * uz]
}
const button = (ad) => s.getByRole('button', { name: ad })
async function pressHold(ad, cond) { const h = await button(ad).boundingBox(); await s.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await s.mouse.down(); await cond(); await s.mouse.up() }
async function manageKiln(subStage) {
  const h = await button(/Ateşi körükle/).boundingBox(); await s.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  const [en] = subStage; let flattened = false, n = 0, seen = false
  while ((await s.locator('#tile-heat').count()) && n++ < 900) {
    const heat = +(await data('heat')), ask = heat < en + 18
    if (ask !== flattened) { if (ask) await s.mouse.down(); else await s.mouse.up(); flattened = ask }
    if (!seen && heat > en) { seen = true; await see(`kiln-${en}`) }
    await s.waitForTimeout(30)
  }
  if (flattened) await s.mouse.up()
}
await s.waitForTimeout(1200); await see('0-shape-start')
// 0 Şekil: çamurun üstünde yavaşça sürükle
let n = await window(); await s.mouse.move(...n(0, 0)); await s.mouse.down()
for (let t = 0; t < 400 && (await stage()) === 0; t++) { const a = t * .2; await s.mouse.move(...n(Math.sin(a) * .35, Math.cos(a) * .35)); if (t === 40) await see('0-shape-mid'); await s.waitForTimeout(16) }
await s.mouse.up(); assert.equal(await stage(), 1); console.log('✅ Şekil')
// 1 Astar ve bisküvi
await s.waitForTimeout(800); await pressHold(/Astar sür/, () => s.waitForFunction(() => document.querySelector('.tile-scene')?.dataset.alt === '1')); await see('1-primer'); await s.waitForTimeout(1500)
await manageKiln([850]); await awaitStage(2); console.log('✅ Bisküvi'); await s.waitForTimeout(2500); await see('2-paper')
// 2 Kömürleme: kâğıdın üstünde gezdir
n = await window(); await s.mouse.move(...n(-.9, -.9)); await s.mouse.down()
for (let y = -.9; y <= .95 && (await stage()) === 2; y += .22) { for (let x = -.9; x <= .95; x += .18) { await s.mouse.move(...n(x, y)); await s.waitForTimeout(8) } if (y > 0 && y < .22) await see('2-coal') }
await s.mouse.up(); await awaitStage(3); console.log('✅ Kömürleme'); await s.waitForTimeout(600); await see('3-points')
// 3 Tahrir: izleri gerçekten izle
const { traces } = await import('../src/features/workshops/tile/engine/pattern.ts')
await s.waitForTimeout(1800); n = await window()
for (const [i, iz] of traces.entries()) { await s.mouse.move(...n(...iz[0])); await s.mouse.down(); for (const p of iz) { await s.mouse.move(...n(...p)); await s.waitForTimeout(12) } await s.mouse.up(); await s.waitForTimeout(200); if (i === 0) await see('3-outline') }
await awaitStage(4); console.log('✅ Tahrir'); await s.waitForTimeout(400); await see('4-paint-start')
// 4 Boyama
const { regions } = await import('../src/features/workshops/tile/engine/pattern.ts'); const color = { tulip: 'Kırmızı', leaf: 'Yeşil', center: 'Turkuaz', ring: 'Kobalt mavisi' }
assert(await button('Sırlamaya geç →').isDisabled())
for (const t of ['tulip', 'leaf', 'center', 'ring']) {
  await button(color[t]).click()
  for (const b of regions.filter((q) => q.tour === t)) { const c = t === 'ring' ? [.91, 0] : t === 'center' ? [0, 0] : (() => { const g = b.outer, m = g.reduce((a, p) => [a[0] + p[0] / g.length, a[1] + p[1] / g.length], [0, 0]); return m })(); await s.mouse.click(...n(...c)); await s.waitForTimeout(40) }
}
await s.waitForTimeout(300); await see('4-painted'); await button('Sırlamaya geç →').click(); await awaitStage(5); console.log('✅ Boyama')
// 5 Sır ve fırın
await s.waitForTimeout(1000); await pressHold(/Sır dök/, () => s.waitForFunction(() => document.querySelector('.tile-scene')?.dataset.alt === '1')); await see('5-glaze'); await s.waitForTimeout(1600)
await see('5-kiln-before'); await manageKiln([900]); await see('5-from-kiln'); await awaitStage(6, 20000); console.log('✅ Sır ve fırın')
await s.waitForTimeout(2000); await see('6-inspection')
const quality = +(await data('quality')); assert(quality >= 60, `kalite ${quality}`); console.log('Kalite', quality)
// Baştan
await button('Yeni çini yap').click(); await awaitStage(0)
// Usta tüm adımları tamamlayabilir
for (let i = 0; i < 6; i++) { await button(/Ustaya bırak/).click(); if (i === 5) break; await s.waitForTimeout(150) }
await awaitStage(6, 15000); console.log('✅ Usta')
assert.deepEqual(errors, [], `Konsol hataları: ${errors.join(' | ')}`)
await b.close(); console.log('Çini atölyesi testi geçti.')
