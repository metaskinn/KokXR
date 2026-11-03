// Yedek demo videosu: uygulamayı gerçek fare hareketleriyle gezer ve kaydeder.
// Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: node scripts/demo_video.mjs <cikti.webm>   (ekran kartı yoksa GPU=0 ile)
// İmleç ve altyazı yalnızca videoya eklenir; uygulamanın parçası değildir.
import { chromium } from 'playwright'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PerspectiveCamera, Vector3 } from 'three'

const cikti = process.argv[2] ?? 'test-sonuclari/kokxr-yedek-demo.webm'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const boyut = { width: 1600, height: 900 }
const gecici = mkdtempSync(join(tmpdir(), 'kokxr-video-'))

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
    imlec.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transition:scale .12s'
    imlec.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 5z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    const yazi = document.createElement('div')
    yazi.id = 'demo-yazi'
    yazi.style.cssText = 'position:fixed;left:50%;bottom:26px;translate:-50% 0;z-index:2147483646;pointer-events:none;max-width:80%;padding:12px 24px;border-radius:10px;background:rgb(20 32 28/.9);color:#fff;font:600 22px system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .3s'
    document.documentElement.append(imlec, yazi)
    const k = sessionStorage.getItem('demo-imlec')
    if (k) imlec.style.transform = k
  })
})
const page = await context.newPage()
page.on('dialog', (d) => d.accept())
const hatalar = []
page.on('pageerror', (e) => { if (!e.message.includes('krpano')) hatalar.push(e.message) })

let fx = 800, fy = 450
const bekle = (ms) => page.waitForTimeout(ms)
const yazi = (metin) => page.evaluate((m) => {
  const y = document.getElementById('demo-yazi')
  if (!y) return
  if (m) y.textContent = m
  y.style.opacity = m ? '1' : '0'
}, metin)
async function fare(x, y, adim = 22) {
  const bx = fx, by = fy
  for (let i = 1; i <= adim; i++) {
    const t = i / adim, e = t * t * (3 - 2 * t)
    fx = bx + (x - bx) * e; fy = by + (y - by) * e
    await page.mouse.move(fx, fy)
    await page.evaluate(([a, b]) => {
      const c = document.getElementById('demo-imlec')
      if (!c) return
      c.style.transform = `translate(${a}px,${b}px)`
      sessionStorage.setItem('demo-imlec', c.style.transform)
    }, [fx, fy])
  }
}
const basisEfekti = (s) => page.evaluate((v) => { const c = document.getElementById('demo-imlec'); if (c) c.style.scale = v }, s)
async function kaydirmaBitsin() {
  let onceki = -1
  for (let i = 0; i < 60; i++) {
    const y = await page.evaluate(() => scrollY)
    if (y === onceki) return
    onceki = y
    await bekle(120)
  }
}
async function gor(locator) {
  // Çok uzun formlarda (yönetim) yumuşak kaydırma videoyu boşa uzatır.
  await locator.first().evaluate((e) => {
    const uzak = Math.abs(e.getBoundingClientRect().top) > 2500
    e.scrollIntoView({ block: 'center', behavior: uzak ? 'instant' : 'smooth' })
  })
  await kaydirmaBitsin()
}
async function tikla(locator, adim = 22) {
  const hedef = locator.first()
  await hedef.waitFor({ state: 'visible', timeout: 30000 })
  await kaydirmaBitsin()
  let b = await hedef.boundingBox()
  if (!b || b.y < 70 || b.y + b.height > boyut.height - 110) { await gor(hedef); b = await hedef.boundingBox() }
  await fare(b.x + b.width / 2, b.y + b.height / 2, adim)
  await basisEfekti('.8'); await page.mouse.down(); await bekle(70); await page.mouse.up(); await basisEfekti('1')
}
async function surukle(x1, y1, x2, y2, adim = 30) {
  await fare(x1, y1, 14)
  await basisEfekti('.8'); await page.mouse.down()
  await fare(x2, y2, adim)
  await page.mouse.up(); await basisEfekti('1')
}
async function kaydir(y) {
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'smooth' }), y)
  await bekle(1500)
}
async function sayfayaGit(yol) {
  await page.goto(url + yol)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await bekle(600)
}

async function bolum(ad, fn) {
  const t = Date.now()
  try { await fn(); console.log(`✅ ${ad} (${Math.round((Date.now() - t) / 1000)} sn)`) }
  catch (e) { console.log(`❌ ${ad}: ${String(e.message).split('\n')[0].slice(0, 200)}`); hatalar.push(ad) }
}

await bolum('Ana sayfa', async () => {
  await sayfayaGit('/')
  await yazi('KökXR — Bursa\'nın vakıf eserlerini keşfet, incele, onar')
  await fare(500, 400, 30); await bekle(2200)
  await kaydir(620); await bekle(1800)
  await kaydir(1250); await bekle(1600)
  await kaydir(0)
})

await bolum('Ulu Camii galeri', async () => {
  await yazi('Bursa Ulu Camii: envanterden kaynaklı bilgi ve fotoğraflar')
  await tikla(page.locator('.eser-karti', { hasText: 'Ulu Camii' }))
  await page.getByRole('heading', { level: 1 }).waitFor(); await bekle(1800)
  const foto = page.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ })
  await gor(foto); await bekle(500)
  await tikla(foto); await bekle(1400)
  await yazi('Fotoğraf üzerindeki keşif noktaları ve kaynak bilgisi')
  await tikla(page.locator('.bilgi-noktasi')); await bekle(3000)
})

await bolum('Ulu Camii maket', async () => {
  await yazi('Eseri eline al: kitaptaki ölçülerden oluşturulan temsili 3B maket')
  const dugme = page.getByRole('button', { name: /maketini eline al/ })
  await gor(dugme); await bekle(1000)
  await tikla(dugme)
  await page.locator('.maket-alan canvas').waitFor({ timeout: 30000 })
  await page.waitForFunction(() => !document.querySelector('.maket-durum'), null, { timeout: 30000 })
  await gor(page.locator('.maket-kutu')); await bekle(1200)
  const a = await page.locator('.maket-alan').boundingBox()
  const ox = a.x + a.width / 2, oy = a.y + a.height / 2
  await surukle(ox - 180, oy, ox + 220, oy - 40, 45); await bekle(700)
  await surukle(ox + 180, oy, ox - 220, oy + 30, 45); await bekle(700)
  await yazi('Parçala: çatı kalkar, 12 paye ve şadırvan görünür')
  await tikla(page.getByRole('button', { name: /Parçala/ })); await bekle(3500)
  await surukle(ox - 150, oy + 40, ox + 170, oy + 40, 45); await bekle(1500)
  await tikla(page.getByRole('button', { name: /Birleştir/ })); await bekle(2200)
})

await bolum('Ulu Camii 360', async () => {
  await yazi('Gerçek 360° tur: 360TR resmî oynatıcısı (görüntüler 360TR\'ye aittir)')
  const dugme = page.getByRole('button', { name: '360° turu başlat' })
  await gor(dugme); await bekle(900)
  await tikla(dugme)
  await page.locator('.tur360-cerceve').waitFor()
  await gor(page.locator('.tur360-cerceve')); await bekle(6500)
  const c = await page.locator('.tur360-cerceve').boundingBox()
  const ox = c.x + c.width / 2, oy = c.y + c.height / 2
  await surukle(ox + 260, oy, ox - 260, oy, 55); await bekle(1000)
  await surukle(ox + 260, oy - 20, ox - 260, oy + 20, 55); await bekle(1000)
  await surukle(ox - 260, oy, ox + 260, oy, 55); await bekle(2000)
})

await bolum('Ulu Camii test ve rozet', async () => {
  await yazi('Bilgini sına: her cevap kaynağıyla birlikte, 3/3 yapana rozet')
  await gor(page.locator('#test-basligi')); await bekle(1200)
  for (const dogru of ['20', 'Kündekâri', "Bursa'nın Ayasofyası"]) {
    await tikla(page.getByRole('radio', { name: dogru, exact: true }).locator('xpath=..'), 16); await bekle(500)
    await tikla(page.getByRole('button', { name: 'Cevabı kontrol et' }), 14); await bekle(2000)
    await tikla(page.getByRole('button', { name: /Sonraki soru|Sonucu gör/ }), 14); await bekle(700)
  }
  await gor(page.locator('#test-basligi')); await bekle(2500)
})

await bolum('Muradiye gezinti', async () => {
  await sayfayaGit('/eser/muradiye-kulliyesi')
  await yazi('II. Murad (Muradiye) Külliyesi: fotoğraflarla sanal gezinti')
  await bekle(1800)
  const b = page.getByRole('button', { name: /Gezintiye başla/ })
  await gor(b); await bekle(800); await tikla(b)
  await page.locator('.gezinti-canvas.hazir').waitFor({ timeout: 30000 })
  await gor(page.locator('.gezinti-sahne')); await bekle(1000)
  const sallan = async () => {
    const s = await page.locator('.gezinti-sahne').boundingBox()
    const cx = s.x + s.width / 2, cy = s.y + s.height / 2
    await fare(cx - s.width * .3, cy - 60, 26); await fare(cx + s.width * .3, cy + 60, 34); await fare(cx, cy, 18)
  }
  const git = async (ad) => {
    await tikla(page.getByRole('group', { name: 'Bağlı duraklara git' }).getByRole('button', { name: ad }), 16)
    await bekle(1500); await sallan()
  }
  await sallan()
  await yazi('Derinlik yapay zekâ ile tahmin edildi; temsilîdir, 360° çekim değildir')
  await git(/Türbeler bahçesi/); await git(/Cem Sultan/)
  await git(/Bahçeye dön/); await git(/Avluya dön/)
  await git(/Caminin kapısına/); await git(/İçeri gir/)
})

await bolum('Muradiye restorasyon', async () => {
  await yazi('Restorasyon görevi: gerçek çini fotoğrafından bulmaca')
  const b = page.getByRole('button', { name: 'Panoyu parçala ve onar' })
  await gor(b); await bekle(1200); await tikla(b); await bekle(1200)
  const sec = page.locator('.restorasyon')
  await gor(page.locator('.restorasyon-tahta')); await bekle(800)
  const parca = (id) => sec.getByRole('button', { name: new RegExp(`^Parça ${id},`) })
  for (let id = 1; id <= 8; id++) {
    await tikla(parca(id), 10)
    for (let k = 0; k < 4 && !(await parca(id).getAttribute('aria-label')).includes(', düz,'); k++) {
      await tikla(sec.getByRole('button', { name: /Döndür/ }), 8); await bekle(120)
    }
    await tikla(sec.getByRole('button', { name: `Boş yuva ${id}`, exact: true }), 10); await bekle(120)
  }
  await yazi('Pano onarıldı: rozet ve envanterden kaynaklı bilgi')
  await gor(sec.getByText('Pano onarıldı!')); await bekle(3200)
})

await bolum('Vazo atölyesi', async () => {
  await sayfayaGit('/atolye/vazo')
  await yazi('Vazo atölyesi: temsili 3B model, tarihî eser değildir')
  const baslat = page.getByRole('button', { name: 'Vazoyu parçala ve onar' })
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((d) => d.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { timeout: 60000 })
  const stage = page.locator('.vazo-sahne')
  await gor(stage); await bekle(1200)
  let s = await stage.boundingBox()
  const cx = s.x + s.width / 2, cy = s.y + s.height / 2
  await yazi('Elinde tutar gibi çevir ve incele')
  await surukle(cx - 200, cy + 150, cx + 200, cy + 110, 50); await bekle(700)
  await surukle(cx + 200, cy + 150, cx - 200, cy + 190, 50); await bekle(900)
  await yazi('Parçala, sonra parçaları tutup doğru yere sürükle')
  await tikla(baslat); await bekle(800)
  await gor(stage); await bekle(1000)
  await page.waitForFunction(() => [...document.querySelectorAll('.vazo-tutamac')].filter((e) => !e.hidden).length === 6)
  await bekle(800)
  const glb = await (await page.request.get(`${url}/modeller/vazo.glb`)).body()
  const model = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString())
  const hedefler = model.nodes.filter((n) => Number.isInteger(n.extras?.pieceId)).sort((a, b) => a.extras.pieceId - b.extras.pieceId)
  // Uygulama hedef ipucu yayımlamaz; konum GLB ve varsayılan kameradan hesaplanır (tests/vazo.mjs ile aynı).
  const hedefNokta = async (id) => {
    s = await stage.boundingBox()
    const cam = new PerspectiveCamera(s.width / s.height < 1 ? 62 : 42, s.width / s.height, .1, 500)
    cam.position.set(0, 31, 156); cam.lookAt(0, 23, 0); cam.updateMatrixWorld()
    const p = new Vector3(...hedefler[id].translation).project(cam)
    return { x: s.x + (p.x + 1) * s.width / 2, y: s.y + (1 - p.y) * s.height / 2 }
  }
  for (let id = 0; id < 6; id++) {
    const t = await page.locator(`.vazo-tutamac[data-parca-id="${id}"]`).boundingBox()
    const h = await hedefNokta(id)
    await surukle(t.x + t.width / 2, t.y + t.height / 2, h.x, h.y, 34)
    await page.waitForFunction((n) => document.querySelector('progress')?.value === n, id + 1, { timeout: 8000 })
    await bekle(450)
  }
  await yazi('Vazo onarıldı: birleşim izleri kalıcı olarak görünür')
  await bekle(1500)
  await tikla(page.getByRole('button', { name: 'İncelemeye dön' }))
  await gor(stage); await bekle(800)
  await tikla(page.getByRole('button', { name: 'Görünümü sıfırla' })); await bekle(800)
  await gor(stage)
  s = await stage.boundingBox()
  await surukle(s.x + s.width / 2 - 200, s.y + s.height - 130, s.x + s.width / 2 + 200, s.y + s.height - 130, 70); await bekle(2200)
})

await bolum('Yönetim', async () => {
  await yazi('Yönetim ekranı: içerik ekleme ve düzenleme')
  await tikla(page.getByRole('link', { name: 'Yönetim', exact: true })); await bekle(1800)
  await tikla(page.getByRole('link', { name: /Düzenle\s*: Bursa Ulu Camii/ })); await bekle(1300)
  const ozet = page.locator('#ozet')
  await gor(ozet); await bekle(600)
  await tikla(ozet, 14)
  await ozet.fill('Demo: yönetim ekranından değiştirilen özet.'); await bekle(1100)
  await tikla(page.getByRole('button', { name: 'Kaydet' })); await bekle(1500)
  await yazi('Değişiklik anında ana sayfaya yansır')
  await tikla(page.getByRole('link', { name: 'KökXR ana sayfa' })); await bekle(800)
  const kart = page.locator('.eser-karti', { hasText: 'Demo: yönetim' })
  await gor(kart); await bekle(2800)
  await yazi('Testi 3/3 tamamlayınca kazanılan rozet de kartta görünür')
  await bekle(2200)
  await yazi('')
  await tikla(page.getByRole('link', { name: 'Yönetim', exact: true })); await bekle(800)
  await tikla(page.getByRole('button', { name: /Varsayılana döndür\s*: Bursa Ulu Camii/ })); await bekle(800)
  await tikla(page.getByRole('link', { name: 'KökXR ana sayfa' })); await bekle(1800)
  await yazi('KökXR — Dokunamadığın tarihe dokun.')
  await bekle(2800)
})

const video = page.video()
await context.close()
await video.saveAs(cikti)
await browser.close()
rmSync(gecici, { recursive: true, force: true })
console.log(hatalar.length ? `HATALAR: ${JSON.stringify(hatalar)}` : 'Hatasız bitti.', '→', cikti)
