// Yedek demo videosu: uygulamayı gerçek fare hareketleriyle gezer ve kaydeder.
// Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: node scripts/demo_video.mjs <cikti.webm>   (ekran kartı yoksa GPU=0 ile)
// İmleç ve altyazı yalnızca videoya eklenir; uygulamanın parçası değildir.
import { chromium } from 'playwright'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PerspectiveCamera, Vector3 } from 'three'

const output = process.argv[2] ?? 'test-results/kokxr-fallback-demo.webm'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const size = { width: 1600, height: 900 }
const temp = mkdtempSync(join(tmpdir(), 'kokxr-video-'))

const browser = await chromium.launch({
  channel: 'chromium',
  args: process.env.GPU === '0'
    ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
})
const context = await browser.newContext({ viewport: size, recordVideo: { dir: temp, size: size } })
await context.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const cursor = document.createElement('div')
    cursor.id = 'demo-cursor'
    cursor.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transition:scale .12s'
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 5z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    const writing = document.createElement('div')
    writing.id = 'demo-writing'
    writing.style.cssText = 'position:fixed;left:50%;bottom:26px;translate:-50% 0;z-index:2147483646;pointer-events:none;max-width:80%;padding:12px 24px;border-radius:10px;background:rgb(20 32 28/.9);color:#fff;font:600 22px system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .3s'
    document.documentElement.append(cursor, writing)
    const k = sessionStorage.getItem('demo-cursor')
    if (k) cursor.style.transform = k
  })
})
const page = await context.newPage()
page.on('dialog', (d) => d.accept())
const errors = []
page.on('pageerror', (e) => { if (!e.message.includes('krpano')) errors.push(e.message) })

let fx = 800, fy = 450
const wait = (ms) => page.waitForTimeout(ms)
const writing = (text) => page.evaluate((m) => {
  const y = document.getElementById('demo-writing')
  if (!y) return
  if (m) y.textContent = m
  y.style.opacity = m ? '1' : '0'
}, text)
async function mouse(x, y, step = 22) {
  const bx = fx, by = fy
  for (let i = 1; i <= step; i++) {
    const t = i / step, e = t * t * (3 - 2 * t)
    fx = bx + (x - bx) * e; fy = by + (y - by) * e
    await page.mouse.move(fx, fy)
    await page.evaluate(([a, b]) => {
      const c = document.getElementById('demo-cursor')
      if (!c) return
      c.style.transform = `translate(${a}px,${b}px)`
      sessionStorage.setItem('demo-cursor', c.style.transform)
    }, [fx, fy])
  }
}
const pressEffect = (s) => page.evaluate((v) => { const c = document.getElementById('demo-cursor'); if (c) c.style.scale = v }, s)
async function scrollShouldEnd() {
  let previous = -1
  for (let i = 0; i < 60; i++) {
    const y = await page.evaluate(() => scrollY)
    if (y === previous) return
    previous = y
    await wait(120)
  }
}
async function see(locator) {
  // Çok uzun formlarda (yönetim) yumuşak kaydırma videoyu boşa uzatır.
  await locator.first().evaluate((e) => {
    const far = Math.abs(e.getBoundingClientRect().top) > 2500
    e.scrollIntoView({ block: 'center', behavior: far ? 'instant' : 'smooth' })
  })
  await scrollShouldEnd()
}
async function click(locator, step = 22) {
  const target = locator.first()
  await target.waitFor({ state: 'visible', timeout: 30000 })
  await scrollShouldEnd()
  let b = await target.boundingBox()
  if (!b || b.y < 70 || b.y + b.height > size.height - 110) { await see(target); b = await target.boundingBox() }
  await mouse(b.x + b.width / 2, b.y + b.height / 2, step)
  await pressEffect('.8'); await page.mouse.down(); await wait(70); await page.mouse.up(); await pressEffect('1')
}
async function drag(x1, y1, x2, y2, step = 30) {
  await mouse(x1, y1, 14)
  await pressEffect('.8'); await page.mouse.down()
  await mouse(x2, y2, step)
  await page.mouse.up(); await pressEffect('1')
}
async function scroll(y) {
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'smooth' }), y)
  await wait(1500)
}
async function goToPage(path) {
  await page.goto(url + path)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await wait(600)
}

async function section(ad, fn) {
  const t = Date.now()
  try { await fn(); console.log(`✅ ${ad} (${Math.round((Date.now() - t) / 1000)} sn)`) }
  catch (e) { console.log(`❌ ${ad}: ${String(e.message).split('\n')[0].slice(0, 200)}`); errors.push(ad) }
}

await section('Eserler', async () => {
  await goToPage('/artifacts')
  await writing('KökXR — Bursa\'nın vakıf eserlerini keşfet, incele, onar')
  await mouse(500, 400, 30); await wait(2200)
  await scroll(620); await wait(1800)
  await scroll(1250); await wait(1600)
  await scroll(0)
})

await section('Ulu Camii galeri', async () => {
  await writing('Bursa Ulu Camii: envanterden kaynaklı bilgi ve fotoğraflar')
  await click(page.locator('.artifact-card', { hasText: 'Ulu Camii' }))
  await page.getByRole('heading', { level: 1 }).waitFor(); await wait(1800)
  const photo = page.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ })
  await see(photo); await wait(500)
  await click(photo); await wait(1400)
  await writing('Fotoğraf üzerindeki keşif noktaları ve kaynak bilgisi')
  await click(page.locator('.info-point')); await wait(3000)
})

await section('Ulu Camii maket', async () => {
  await writing('Eseri eline al: kitaptaki ölçülerden oluşturulan temsili 3B maket')
  const button = page.getByRole('button', { name: /maketini eline al/ })
  await see(button); await wait(1000)
  await click(button)
  await page.locator('.model-area canvas').waitFor({ timeout: 30000 })
  await page.waitForFunction(() => !document.querySelector('.model-state'), null, { timeout: 30000 })
  await see(page.locator('.model-box')); await wait(1200)
  const a = await page.locator('.model-area').boundingBox()
  const ox = a.x + a.width / 2, oy = a.y + a.height / 2
  await drag(ox - 180, oy, ox + 220, oy - 40, 45); await wait(700)
  await drag(ox + 180, oy, ox - 220, oy + 30, 45); await wait(700)
  await writing('Parçala: çatı kalkar, 12 paye ve şadırvan görünür')
  await click(page.getByRole('button', { name: /Parçala/ })); await wait(3500)
  await drag(ox - 150, oy + 40, ox + 170, oy + 40, 45); await wait(1500)
  await click(page.getByRole('button', { name: /Birleştir/ })); await wait(2200)
})

await section('Vazo atölyesi', async () => {
  await goToPage('/workshop/vase')
  await writing('Vazo atölyesi: temsili 3B model, tarihî eser değildir')
  const start = page.getByRole('button', { name: 'Vazoyu parçala ve onar' })
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((d) => d.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { timeout: 60000 })
  const stage = page.locator('.vase-scene')
  await see(stage); await wait(1200)
  let s = await stage.boundingBox()
  const cx = s.x + s.width / 2, cy = s.y + s.height / 2
  await writing('Elinde tutar gibi çevir ve incele')
  await drag(cx - 200, cy + 150, cx + 200, cy + 110, 50); await wait(700)
  await drag(cx + 200, cy + 150, cx - 200, cy + 190, 50); await wait(900)
  await writing('Parçala, sonra parçaları tutup doğru yere sürükle')
  await click(start); await wait(800)
  await see(stage); await wait(1000)
  await page.waitForFunction(() => [...document.querySelectorAll('.vase-handle')].filter((e) => !e.hidden).length === 6)
  await wait(800)
  const glb = await (await page.request.get(`${url}/models/vase.glb`)).body()
  const model = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString())
  const targets = model.nodes.filter((n) => Number.isInteger(n.extras?.pieceId)).sort((a, b) => a.extras.pieceId - b.extras.pieceId)
  // Uygulama hedef ipucu yayımlamaz; konum GLB ve varsayılan kameradan hesaplanır (tests/vazo.mjs ile aynı).
  const targetPoint_ = async (id) => {
    s = await stage.boundingBox()
    const cam = new PerspectiveCamera(s.width / s.height < 1 ? 62 : 42, s.width / s.height, .1, 500)
    cam.position.set(0, 31, 156); cam.lookAt(0, 23, 0); cam.updateMatrixWorld()
    const p = new Vector3(...targets[id].translation).project(cam)
    return { x: s.x + (p.x + 1) * s.width / 2, y: s.y + (1 - p.y) * s.height / 2 }
  }
  for (let id = 0; id < 6; id++) {
    const t = await page.locator(`.vase-handle[data-piece-id="${id}"]`).boundingBox()
    const h = await targetPoint_(id)
    await drag(t.x + t.width / 2, t.y + t.height / 2, h.x, h.y, 34)
    await page.waitForFunction((n) => document.querySelector('progress')?.value === n, id + 1, { timeout: 8000 })
    await wait(450)
  }
  await writing('Vazo onarıldı: birleşim izleri kalıcı olarak görünür')
  await wait(1500)
  await click(page.getByRole('button', { name: 'İncelemeye dön' }))
  await see(stage); await wait(800)
  await click(page.getByRole('button', { name: 'Görünümü sıfırla' })); await wait(800)
  await see(stage)
  s = await stage.boundingBox()
  await drag(s.x + s.width / 2 - 200, s.y + s.height - 130, s.x + s.width / 2 + 200, s.y + s.height - 130, 70); await wait(2200)
})

await section('Yönetim', async () => {
  await writing('Yönetim ekranı: içerik ekleme ve düzenleme')
  await click(page.getByRole('link', { name: 'Yönetim', exact: true })); await wait(1800)
  await click(page.getByRole('link', { name: /Düzenle\s*: Bursa Ulu Camii/ })); await wait(1300)
  const summary = page.locator('#summary')
  await see(summary); await wait(600)
  await click(summary, 14)
  await summary.fill('Demo: yönetim ekranından değiştirilen özet.'); await wait(1100)
  await click(page.getByRole('button', { name: 'Kaydet' })); await wait(1500)
  await writing('Değişiklik anında eserler sayfasına yansır')
  await click(page.getByRole('link', { name: 'KökXR ana sayfa' })); await wait(800)
  const card = page.locator('.artifact-card', { hasText: 'Demo: yönetim' })
  await see(card); await wait(2800)
  await writing('')
  await click(page.getByRole('link', { name: 'Yönetim', exact: true })); await wait(800)
  await click(page.getByRole('button', { name: /Varsayılana döndür\s*: Bursa Ulu Camii/ })); await wait(800)
  await click(page.getByRole('link', { name: 'KökXR ana sayfa' })); await wait(1800)
  await writing('KökXR — Dokunamadığın tarihe dokun.')
  await wait(2800)
})

const video = page.video()
await context.close()
await video.saveAs(output)
await browser.close()
rmSync(temp, { recursive: true, force: true })
console.log(errors.length ? `HATALAR: ${JSON.stringify(errors)}` : 'Hatasız bitti.', '→', output)
