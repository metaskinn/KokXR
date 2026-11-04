// Ulu Camii maketi tanıtım videosu: dışarıdan başlar, maketi ayırır, içeri girip gezer.
// Gerçek fare ve klavye olaylarıyla oynar. İmleç ve altyazı yalnızca videoya eklenir.
// Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: node scripts/ulu_video.mjs <cikti.webm>   (ekran kartı yoksa GPU=0 ile)
// Videonun başındaki sayfa yükleme bölümü için atlanacak süre konsola yazılır (kirp=... sn).
import { chromium } from 'playwright'
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const cikti = process.argv[2] ?? 'test-sonuclari/kokxr-ulu-camii.webm'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const boyut = { width: 1280, height: 800 }
const gecici = mkdtempSync(join(tmpdir(), 'kokxr-ulu-video-'))
const tarayici = await chromium.launch({
  channel: 'chromium',
  args: process.env.GPU === '0'
    ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
})
const baglam = await tarayici.newContext({ viewport: boyut, recordVideo: { dir: gecici, size: boyut } })
const kayitBasi = Date.now()
const sayfa = await baglam.newPage()
const hatalar = []
sayfa.on('pageerror', (e) => hatalar.push(e.message))
sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()) })

const bekle = (ms) => sayfa.waitForTimeout(ms)
const yazi = (m) => sayfa.evaluate((v) => {
  const y = document.getElementById('demo-yazi')
  if (v) y.textContent = v
  y.style.opacity = v ? '1' : '0'
}, m)

let fx = 640, fy = 400
async function imlecGit(x, y, ms = 450) {
  const adim = Math.max(1, Math.round(ms / 16))
  const x0 = fx, y0 = fy
  for (let i = 1; i <= adim; i++) {
    const t = i / adim, e = t * t * (3 - 2 * t)
    const ax = x0 + (x - x0) * e, ay = y0 + (y - y0) * e
    await sayfa.mouse.move(ax, ay)
    await sayfa.evaluate(([a, b]) => { document.getElementById('demo-imlec').style.translate = `${a}px ${b}px` }, [ax, ay])
    await bekle(16)
  }
  fx = x; fy = y
}
async function dugme(ad) {
  const d = sayfa.getByRole('button', ad)
  const k = await d.boundingBox()
  await imlecGit(k.x + k.width / 2, k.y + k.height / 2)
  await bekle(120)
  await d.click()
}

await sayfa.goto(`${url}/eser/ulu-camii?kalite=yuksek`)
await sayfa.addStyleTag({ content: `
  .maket-kutu { position: fixed !important; inset: 0; z-index: 9000; margin: 0 !important; border-radius: 0 !important; }
  .maket-alan { height: 100vh !important; }
  #demo-imlec { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 9999; pointer-events: none; }
  #demo-yazi { position: fixed; left: 50%; bottom: 78px; translate: -50% 0; z-index: 9998; pointer-events: none; max-width: 62%; padding: 10px 20px; border-radius: 10px; background: rgb(14 24 20 / .86); color: #f7f5ef; font: 600 19px system-ui, sans-serif; text-align: center; transition: opacity .35s; opacity: 0; }
` })
await sayfa.evaluate(() => {
  const i = document.createElement('div')
  i.id = 'demo-imlec'
  i.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 5z" fill="#fff" stroke="#111" stroke-width="1.5"/></svg>'
  const y = document.createElement('div')
  y.id = 'demo-yazi'
  document.documentElement.append(i, y)
})
await sayfa.getByRole('button', { name: /maketini eline al/ }).click()
await sayfa.getByRole('button', { name: 'İçeri gir' }).waitFor({ timeout: 60000 })
// En dış konum: tekerlekle sonuna kadar uzaklaş, kare hızı ve dokular otursun.
await sayfa.mouse.move(640, 400)
for (let i = 0; i < 14; i++) { await sayfa.mouse.wheel(0, 600); await bekle(60) }
await bekle(2200)
const kirp = (Date.now() - kayitBasi) / 1000

// 1) Dışarıdan yaklaş
await yazi('Bursa Ulu Camii · temsilî 3B maket, gerçek bir tarama değildir')
for (let i = 0; i < 70; i++) { await sayfa.mouse.wheel(0, -34); await bekle(95) }
await bekle(500)
await yazi('Yirmi kubbe, iki minare, taç kapı')
await bekle(1800)

// 2) Maketi ayır
await yazi('Maketi ayır: çatı, kasnaklar ve kubbeler')
await dugme({ name: /Parçala/ })
await bekle(5200)
await yazi('Altında payeler, kemerler ve şadırvan')
await bekle(2000)
await dugme({ name: /Birleştir/ })
await bekle(2600)

// 3) İçeri gir ve klavyeyle yürü
await yazi('İçeri gir: klavyeyle yürü, yapıya yaklaşınca bilgisi açılır')
await dugme({ name: 'İçeri gir' })
await bekle(1600)
await sayfa.keyboard.down('w')
await bekle(2100)
await sayfa.keyboard.up('w')
await yazi('Şadırvan: on altı köşeli havuz, üç çanaklı fıskiye')
await bekle(1500)
await sayfa.keyboard.down('ArrowRight')
await bekle(700)
await sayfa.keyboard.up('ArrowRight')
await sayfa.keyboard.down('ArrowLeft')
await bekle(1400)
await sayfa.keyboard.up('ArrowLeft')
await sayfa.keyboard.down('ArrowRight')
await bekle(700)
await sayfa.keyboard.up('ArrowRight')

// 4) Duraklar
for (const [ad, metin, sure] of [
  ['Doğu kapısı', 'Üç kapının ve mihrabın ekseni şadırvanda birleşir', 2400],
  ['Kâbe örtüsü', 'Kâbe kapısının örtüsü, görünümü temsilî', 2400],
  ['Levha', 'Levha ve paye yazıları arşiv fotoğraflarından', 2000],
  ['Mihrap', 'Mihrap ve çevresindeki levhalar', 3000],
  ['Minber', 'Minber: kündekâri, H. 802 / M. 1399-1400', 2400],
  ['Kubbe', 'Kubbelerin içi', 2400],
]) {
  await yazi('')
  await dugme({ name: ad, exact: true })
  await bekle(1300)
  await yazi(metin)
  await bekle(sure)
}
await yazi('KökXR · Dokunamadığın tarihe dokun.')
await bekle(2200)

const video = sayfa.video()
await baglam.close()
await tarayici.close()
copyFileSync(await video.path(), cikti)
rmSync(gecici, { recursive: true, force: true })
console.log(`kirp=${kirp.toFixed(2)} hatalar=${JSON.stringify(hatalar)}`)
