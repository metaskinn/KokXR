// Çini atölyesini gerçek fare olaylarıyla baştan sona oynar. Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: node tests/cini.mjs [ekran-görüntüsü-klasörü]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173', klasor = process.argv[2]
const b = await chromium.launch({ channel: 'chromium', args: ['--use-gl=angle', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-gpu'] })
const s = await b.newPage({ viewport: { width: 1600, height: 1000 } }), hatalar = []
s.on('pageerror', (e) => hatalar.push(e.message)); s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()) })
await s.goto(`${url}/atolye/cini`); const alan = s.locator('.cini-sahne'); await alan.locator('canvas').waitFor()
await s.waitForFunction(() => document.querySelector('.cini-sahne')?.dataset.asama === '0'); await alan.scrollIntoViewIfNeeded()
const veri = (k) => alan.getAttribute(`data-${k}`), asama = async () => +(await veri('asama'))
const bekleAsama = (n, t = 30000) => s.waitForFunction((v) => document.querySelector('.cini-sahne')?.dataset.asama === String(v), n, { timeout: t })
const gor = (ad) => klasor ? s.screenshot({ path: `${klasor}/${ad}.png` }) : null
async function pencere() {
  const k = await alan.boundingBox(), p = async (a) => (await veri(a)).split(',').map(Number)
  const m = await p('plaka-merkez'), x = await p('plaka-x'), z = await p('plaka-z')
  return (ux, uz) => [k.x + m[0] + (x[0] - m[0]) * ux + (z[0] - m[0]) * uz, k.y + m[1] + (x[1] - m[1]) * ux + (z[1] - m[1]) * uz]
}
const dugme = (ad) => s.getByRole('button', { name: ad })
async function basiliTut(ad, kosul) { const h = await dugme(ad).boundingBox(); await s.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await s.mouse.down(); await kosul(); await s.mouse.up() }
async function firinYonet(alt) {
  const h = await dugme(/Ateşi körükle/).boundingBox(); await s.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  const [en] = alt; let basik = false, n = 0, gorduk = false
  while ((await s.locator('#cini-isi').count()) && n++ < 900) {
    const isi = +(await veri('isi')), iste = isi < en + 18
    if (iste !== basik) { if (iste) await s.mouse.down(); else await s.mouse.up(); basik = iste }
    if (!gorduk && isi > en) { gorduk = true; await gor(`firin-${en}`) }
    await s.waitForTimeout(30)
  }
  if (basik) await s.mouse.up()
}
await s.waitForTimeout(1200); await gor('0-sekil-basi')
// 0 Şekil: çamurun üstünde yavaşça sürükle
let n = await pencere(); await s.mouse.move(...n(0, 0)); await s.mouse.down()
for (let t = 0; t < 400 && (await asama()) === 0; t++) { const a = t * .2; await s.mouse.move(...n(Math.sin(a) * .35, Math.cos(a) * .35)); if (t === 40) await gor('0-sekil-orta'); await s.waitForTimeout(16) }
await s.mouse.up(); assert.equal(await asama(), 1); console.log('✅ Şekil')
// 1 Astar ve bisküvi
await s.waitForTimeout(800); await basiliTut(/Astar sür/, () => s.waitForFunction(() => document.querySelector('.cini-sahne')?.dataset.alt === '1')); await gor('1-astar'); await s.waitForTimeout(1500)
await firinYonet([850]); await bekleAsama(2); console.log('✅ Bisküvi'); await s.waitForTimeout(2500); await gor('2-kagit')
// 2 Kömürleme: kâğıdın üstünde gezdir
n = await pencere(); await s.mouse.move(...n(-.9, -.9)); await s.mouse.down()
for (let y = -.9; y <= .95 && (await asama()) === 2; y += .22) { for (let x = -.9; x <= .95; x += .18) { await s.mouse.move(...n(x, y)); await s.waitForTimeout(8) } if (y > 0 && y < .22) await gor('2-komur') }
await s.mouse.up(); await bekleAsama(3); console.log('✅ Kömürleme'); await s.waitForTimeout(600); await gor('3-noktalar')
// 3 Tahrir: izleri gerçekten izle
const { izler } = await import('../src/components/cini/desen.ts')
await s.waitForTimeout(1800); n = await pencere()
for (const [i, iz] of izler.entries()) { await s.mouse.move(...n(...iz[0])); await s.mouse.down(); for (const p of iz) { await s.mouse.move(...n(...p)); await s.waitForTimeout(12) } await s.mouse.up(); await s.waitForTimeout(200); if (i === 0) await gor('3-tahrir') }
await bekleAsama(4); console.log('✅ Tahrir'); await s.waitForTimeout(400); await gor('4-boya-basi')
// 4 Boyama
const { bolgeler } = await import('../src/components/cini/desen.ts'); const renk = { lale: 'Kırmızı', yaprak: 'Yeşil', merkez: 'Turkuaz', halka: 'Kobalt mavisi' }
assert(await dugme('Sırlamaya geç →').isDisabled())
for (const t of ['lale', 'yaprak', 'merkez', 'halka']) {
  await dugme(renk[t]).click()
  for (const b of bolgeler.filter((q) => q.tur === t)) { const c = t === 'halka' ? [.91, 0] : t === 'merkez' ? [0, 0] : (() => { const g = b.dis, m = g.reduce((a, p) => [a[0] + p[0] / g.length, a[1] + p[1] / g.length], [0, 0]); return m })(); await s.mouse.click(...n(...c)); await s.waitForTimeout(40) }
}
await s.waitForTimeout(300); await gor('4-boyali'); await dugme('Sırlamaya geç →').click(); await bekleAsama(5); console.log('✅ Boyama')
// 5 Sır ve fırın
await s.waitForTimeout(1000); await basiliTut(/Sır dök/, () => s.waitForFunction(() => document.querySelector('.cini-sahne')?.dataset.alt === '1')); await gor('5-sir'); await s.waitForTimeout(1600)
await gor('5-firin-oncesi'); await firinYonet([900]); await gor('5-firindan'); await bekleAsama(6, 20000); console.log('✅ Sır ve fırın')
await s.waitForTimeout(2000); await gor('6-inceleme')
const kalite = +(await veri('kalite')); assert(kalite >= 60, `kalite ${kalite}`); console.log('Kalite', kalite)
// Baştan
await dugme('Yeni çini yap').click(); await bekleAsama(0)
// Usta tüm adımları tamamlayabilir
for (let i = 0; i < 6; i++) { await dugme(/Ustaya bırak/).click(); if (i === 5) break; await s.waitForTimeout(150) }
await bekleAsama(6, 15000); console.log('✅ Usta')
assert.deepEqual(hatalar, [], `Konsol hataları: ${hatalar.join(' | ')}`)
await b.close(); console.log('Çini atölyesi testi geçti.')
