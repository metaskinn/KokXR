// Kılıç atölyesi videosu: gerçek fare olaylarıyla oynar; test alanında hedeflere fareyle kesim çizer.
// Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: node scripts/kilic_video.mjs <cikti.webm>   (ekran kartı yoksa GPU=0 ile)
// İmleç ve altyazı yalnızca videoya eklenir; uygulamanın parçası değildir.
import { chromium } from 'playwright'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const cikti = process.argv[2] ?? 'test-sonuclari/kokxr-kilic-atolyesi.webm'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const boyut = { width: 1600, height: 900 }
const gecici = mkdtempSync(join(tmpdir(), 'kokxr-kilic-video-'))
const browser = await chromium.launch({
  channel: 'chromium',
  args: process.env.GPU === '0'
    ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
})
const context = await browser.newContext({ viewport: boyut, recordVideo: { dir: gecici, size: boyut } })
await context.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const imlec = document.createElement('div')
    imlec.id = 'demo-imlec'
    imlec.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transition:scale .1s'
    imlec.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 5z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    const yazi = document.createElement('div')
    yazi.id = 'demo-yazi'
    yazi.style.cssText = 'position:fixed;left:32%;bottom:26px;translate:-50% 0;z-index:2147483646;pointer-events:none;max-width:56%;padding:11px 22px;border-radius:10px;background:rgb(12 20 18/.88);color:#fff;font:600 21px system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .3s'
    document.documentElement.append(imlec, yazi)
  })
})
const page = await context.newPage()
const hatalar = []
page.on('pageerror', (e) => { hatalar.push(e.message) })

let fx = 500, fy = 400
const bekle = (ms) => page.waitForTimeout(ms)
const yazi = (m) => page.evaluate((v) => { const y = document.getElementById('demo-yazi'); if (!y) return; if (v) y.textContent = v; y.style.opacity = v ? '1' : '0' }, m)
const imlecBas = (s) => page.evaluate((v) => { const c = document.getElementById('demo-imlec'); if (c) c.style.scale = v }, s)
async function fare(x, y, adim = 20) {
  const bx = fx, by = fy
  for (let i = 1; i <= adim; i++) {
    const t = i / adim, e = t * t * (3 - 2 * t)
    fx = bx + (x - bx) * e; fy = by + (y - by) * e
    await page.mouse.move(fx, fy)
    await page.evaluate(([a, b]) => { const c = document.getElementById('demo-imlec'); if (c) c.style.transform = `translate(${a}px,${b}px)` }, [fx, fy])
  }
}
async function tikla(locator, adim = 18) {
  const h = locator.first(); await h.waitFor({ state: 'visible', timeout: 30000 })
  const b = await h.boundingBox()
  await fare(b.x + b.width / 2, b.y + b.height / 2, adim)
  await imlecBas('.8'); await page.mouse.down(); await bekle(70); await page.mouse.up(); await imlecBas('1')
}
async function basiliTut(locator, kosul, enCok = 20000) {
  const b = await locator.first().boundingBox()
  await fare(b.x + b.width / 2, b.y + b.height / 2, 16)
  await imlecBas('.8'); await page.mouse.down()
  await kosul().catch(() => {})
  void enCok
  await page.mouse.up(); await imlecBas('1')
}
const stage = page.locator('.kilic-sahne')
const asama = () => stage.getAttribute('data-asama')
const asamaBekle = (n, t = 30000) => page.waitForFunction((v) => document.querySelector('.kilic-sahne')?.dataset.asama === String(v), n, { timeout: t })
const sicaklik = () => page.locator('#kilic-sicaklik').getAttribute('value').then(Number)
const dugme = (ad) => page.getByRole('button', { name: ad })
const veri = async (k) => stage.getAttribute(`data-${k}`)

async function bolum(ad, fn) {
  const t = Date.now()
  try { await fn(); console.log(`✅ ${ad} (${Math.round((Date.now() - t) / 1000)} sn)`) }
  catch (e) { console.log(`❌ ${ad}: ${String(e.message).split('\n')[0].slice(0, 200)}`); hatalar.push(ad) }
}

await page.goto(`${url}/atolye/kilic`)
await stage.locator('canvas').waitFor(); await asamaBekle(0, 60000)
await stage.evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 118))
await bekle(900)

await bolum('Külçe', async () => {
  await yazi('Kılıç yumurtası: çelik külçesi tezgâhta bekliyor')
  await fare(560, 420, 30); await bekle(1500)
  await tikla(page.locator('.kilic-sahne-isaret')); await asamaBekle(1); await bekle(2400)
})
await bolum('Isıtma', async () => {
  await yazi('Körüğü bas: çelik koyu kırmızıdan sarıya döner')
  await basiliTut(dugme('Körüğü basılı tut'), () => page.waitForFunction(() => +document.querySelector('#kilic-sicaklik')?.value >= 1020, null, { timeout: 25000 }))
  await bekle(600); await tikla(dugme('Örse geç →')); await asamaBekle(2); await bekle(2200)
})
await bolum('Dövme', async () => {
  await yazi('Her darbe çeliği uzatır: külçe adım adım namluya dönüşür')
  for (const b of [6, 7, 5, 8, 4, 9]) {
    await tikla(dugme(new RegExp(`^Bölge ${b}$`)), 8); await bekle(250)
    for (let k = 0; k < 3; k++) {
      await page.waitForFunction(() => document.querySelector('.kilic-sahne')?.dataset.cekic === '1', null, { timeout: 8000 })
      const s = await stage.boundingBox(), x = +(await veri('vurus-x')), y = +(await veri('vurus-y'))
      await fare(s.x + x, s.y + y, 8); await imlecBas('.8'); await page.mouse.down(); await page.mouse.up(); await imlecBas('1')
    }
    if ((await sicaklik()) < 800) break
  }
  await bekle(800)
  await yazi('Ustaya bırak: jüri demosu için kalan bölgeleri tamamlar')
  await tikla(page.getByRole('button', { name: /^Ustaya bırak/ })); await asamaBekle(3); await bekle(2400)
})
await bolum('Su verme', async () => {
  await yazi('Su verme: doğru sıcaklıkta daldır, buhar yükselir')
  await page.waitForFunction(() => { const v = +document.querySelector('#kilic-sicaklik')?.value; return v >= 790 && v <= 870 }, null, { timeout: 15000 }).catch(() => {})
  await basiliTut(dugme(/Suya daldır/), () => asamaBekle(4, 15000)); await bekle(2600)
})
await bolum('Bileme', async () => {
  await yazi('Bileme: namluyu taşa bastır, fareyle boydan boya sürükle')
  const s = await stage.boundingBox()
  const y = s.y + s.height * .45, sag = s.x + s.width * .58, sol = s.x + s.width * .1
  await fare(sag, y, 18); await imlecBas('.8'); await page.mouse.down(); await bekle(900)
  for (let tur = 0; tur < 8 && await asama() === '4'; tur++) {
    const hedef = tur % 2 === 0 ? sol : sag
    await fare(hedef, y + Math.sin(tur) * 8, 95)
  }
  await page.mouse.up(); await imlecBas('1')
  if (await asama() === '4') { await tikla(page.getByRole('button', { name: /^Ustaya bırak/ })) }
  await asamaBekle(5); await bekle(2400)
})
await bolum('Kuşanma', async () => {
  await yazi('Balçak, mors dişi plakalar, dört perçin; sonunda altın bant belirir')
  for (let i = 0; i < 7; i++) { await tikla(page.locator('.kilic-sahne-isaret'), 12); await bekle(780) }
  await asamaBekle(6); await bekle(2600)
})
await bolum('İnceleme', async () => {
  await yazi('Temsilî model: ölçüler kaynaktan, her parça notu kaynaklı')
  const s = await stage.boundingBox(), x = s.x + s.width * .3, y = s.y + s.height * .5
  await fare(x - 160, y, 18); await imlecBas('.8'); await page.mouse.down(); await fare(x + 200, y - 40, 70); await page.mouse.up(); await imlecBas('1'); await bekle(1100)
  await tikla(page.getByRole('button', { name: '4. Balçak' })); await bekle(3000)
  await tikla(page.getByRole('button', { name: 'Parça notunu kapat' })); await bekle(600)
  await tikla(dugme('Test alanına geç →')); await asamaBekle(7); await bekle(2600)
})

// Sahnedeki hedefe göre kesim çizgisi (metre cinsinden): fareyle gerçekten çizilir, hasar çizilen yerde olur.
async function kesimCiz(ax, ay, bx, by, adim = 7) {
  const s = await stage.boundingBox(), x = s.x + +(await veri('hedef-x')), y = s.y + +(await veri('hedef-y')), o = +(await veri('hedef-olcek'))
  await fare(x + ax * o, y - ay * o, 16); await bekle(180)
  await imlecBas('.8'); await page.mouse.down()
  await fare(x + bx * o, y - by * o, adim)
  await page.mouse.up(); await imlecBas('1')
  await bekle(1000)
  console.log('   hasar', await veri('hasar'), '·', (await page.locator('.kilic-mesaj').textContent()).slice(0, 80))
}
await bolum('Test: hasır', async () => {
  await yazi('Test alanı: fareyle kesim çiz. Hasır çizdiğin açıda kesilir')
  await tikla(dugme(/^Hasır rulo/)); await bekle(1600)
  await kesimCiz(-.42, .34, .42, .18)
  await bekle(800)
  await yazi('Her vuruş kalıcı: kalan gövdeyi yeniden kes')
  await kesimCiz(.4, .02, -.4, -.14)
  await bekle(1000)
})
await bolum('Test: kütük', async () => {
  await yazi('Kütük: aynı yere vurdukça kama kesik derinleşir')
  await tikla(dugme(/^Kütük/)); await bekle(1900)
  for (let i = 0; i < 5; i++) {
    if ((await veri('hasar')).split(',')[1] === '1.00') break
    await kesimCiz(-.05, .42, .05, -.3); await bekle(350)
  }
  await bekle(1400)
})
await bolum('Test: kumaş', async () => {
  await yazi('Kumaş: gevşek hedef savrulur, keskin ağız boydan boya keser')
  await tikla(dugme(/^Asılı kumaş/)); await bekle(1900)
  await kesimCiz(-.62, .34, .62, -.16, 8)
  await bekle(2600)
  await yazi('KökXR — Dokunamadığın tarihe dokun.')
  await bekle(2600)
})

const video = page.video()
await context.close()
await video.saveAs(cikti)
await browser.close()
rmSync(gecici, { recursive: true, force: true })
console.log(hatalar.length ? `HATALAR: ${JSON.stringify(hatalar)}` : 'Hatasız bitti.', '→', cikti)
