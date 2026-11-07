// Ulu Mosque model promo video: starts outside, takes the model apart, goes inside and tours it.
// Plays with real mouse and keyboard events. The cursor and captions are added only to the video.
// First: npm run build && npm run preview -- --port 4173
// Run: node scripts/ulu_video.mjs <output.webm>   (with GPU=0 if there is no graphics card)
// The time to trim for the page-loading part at the start of the video is printed to the console (crop=... s).
import { chromium } from 'playwright'
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const output = process.argv[2] ?? 'test-results/kokxr-ulu-mosque.webm'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const size = { width: 1280, height: 800 }
const temp = mkdtempSync(join(tmpdir(), 'kokxr-ulu-video-'))
const browser = await chromium.launch({
  channel: 'chromium',
  args: process.env.GPU === '0'
    ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
})
const context = await browser.newContext({ viewport: size, recordVideo: { dir: temp, size: size } })
const recordStart = Date.now()
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

const wait = (ms) => page.waitForTimeout(ms)
const writing = (m) => page.evaluate((v) => {
  const y = document.getElementById('demo-writing')
  if (v) y.textContent = v
  y.style.opacity = v ? '1' : '0'
}, m)

let fx = 640, fy = 400
async function moveCursor(x, y, ms = 450) {
  const step = Math.max(1, Math.round(ms / 16))
  const x0 = fx, y0 = fy
  for (let i = 1; i <= step; i++) {
    const t = i / step, e = t * t * (3 - 2 * t)
    const ax = x0 + (x - x0) * e, ay = y0 + (y - y0) * e
    await page.mouse.move(ax, ay)
    await page.evaluate(([a, b]) => { document.getElementById('demo-cursor').style.translate = `${a}px ${b}px` }, [ax, ay])
    await wait(16)
  }
  fx = x; fy = y
}
async function button(options) {
  const d = page.getByRole('button', options)
  const k = await d.boundingBox()
  await moveCursor(k.x + k.width / 2, k.y + k.height / 2)
  await wait(120)
  await d.click()
}

await page.goto(`${url}/artifact/ulu-mosque?quality=tall`)
await page.addStyleTag({ content: `
  .model-box { position: fixed !important; inset: 0; z-index: 9000; margin: 0 !important; border-radius: 0 !important; }
  .model-area { height: 100vh !important; }
  #demo-cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 9999; pointer-events: none; }
  #demo-writing { position: fixed; left: 50%; bottom: 78px; translate: -50% 0; z-index: 9998; pointer-events: none; max-width: 62%; padding: 10px 20px; border-radius: 10px; background: rgb(14 24 20 / .86); color: #f7f5ef; font: 600 19px system-ui, sans-serif; text-align: center; transition: opacity .35s; opacity: 0; }
` })
await page.evaluate(() => {
  const i = document.createElement('div')
  i.id = 'demo-cursor'
  i.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 5z" fill="#fff" stroke="#111" stroke-width="1.5"/></svg>'
  const y = document.createElement('div')
  y.id = 'demo-writing'
  document.documentElement.append(i, y)
})
await page.getByRole('button', { name: /maketini eline al/ }).click()
await page.getByRole('button', { name: 'İçeri gir' }).waitFor({ timeout: 60000 })
// Farthest position: zoom all the way out with the wheel, let frame rate and textures settle.
await page.mouse.move(640, 400)
for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 600); await wait(60) }
await wait(2200)
const crop = (Date.now() - recordStart) / 1000

// 1) Approach from outside
await writing('Bursa Ulu Camii · temsilî 3B maket, gerçek bir tarama değildir')
for (let i = 0; i < 70; i++) { await page.mouse.wheel(0, -34); await wait(95) }
await wait(500)
await writing('Yirmi kubbe, iki minare, taç kapı')
await wait(1800)

// 2) Take the model apart
await writing('Maketi ayır: çatı, kasnaklar ve kubbeler')
await button({ name: /Parçala/ })
await wait(5200)
await writing('Altında payeler, kemerler ve şadırvan')
await wait(2000)
await button({ name: /Birleştir/ })
await wait(2600)

// 3) Go inside and walk with the keyboard
await writing('İçeri gir: klavyeyle yürü, yapıya yaklaşınca bilgisi açılır')
await button({ name: 'İçeri gir' })
await wait(1600)
await page.keyboard.down('w')
await wait(2100)
await page.keyboard.up('w')
await writing('Şadırvan: on altı köşeli havuz, üç çanaklı fıskiye')
await wait(1500)
await page.keyboard.down('ArrowRight')
await wait(700)
await page.keyboard.up('ArrowRight')
await page.keyboard.down('ArrowLeft')
await wait(1400)
await page.keyboard.up('ArrowLeft')
await page.keyboard.down('ArrowRight')
await wait(700)
await page.keyboard.up('ArrowRight')

// 4) Stops
for (const [stop, text, duration] of [
  ['Doğu kapısı', 'Üç kapının ve mihrabın ekseni şadırvanda birleşir', 2400],
  ['Kâbe örtüsü', 'Kâbe kapısının örtüsü, görünümü temsilî', 2400],
  ['Levha', 'Levha ve paye yazıları arşiv fotoğraflarından', 2000],
  ['Mihrap', 'Mihrap ve çevresindeki levhalar', 3000],
  ['Minber', 'Minber: kündekâri, H. 802 / M. 1399-1400', 2400],
  ['Kubbe', 'Kubbelerin içi', 2400],
]) {
  await writing('')
  await button({ name: stop, exact: true })
  await wait(1300)
  await writing(text)
  await wait(duration)
}
await writing('KökXR · Dokunamadığın tarihe dokun.')
await wait(2200)

const video = page.video()
await context.close()
await browser.close()
copyFileSync(await video.path(), output)
rmSync(temp, { recursive: true, force: true })
console.log(`crop=${crop.toFixed(2)} errors=${JSON.stringify(errors)}`)
