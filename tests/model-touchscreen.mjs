// Dokunmatik telefon görünümü: iç mekânda yürüme kolu görünür, itince yürünür, bırakınca durulur; masaüstünde kol yoktur.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/maket-dokunmatik.mjs [eser-id]
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173', id = process.argv[2] ?? 'ulu-mosque'
const b = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (k, m) => { if (!k) throw new Error(m) }
const ac = async (ops) => {
  const s = await (await b.newContext(ops)).newPage()
  s.setDefaultTimeout(240000)
  await s.goto(`${url}/vr/${id}`)
  await s.getByRole('button', { name: 'İçeri gir' }).click()
  await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
  return s
}
const position = (s) => s.locator('.model-area').getAttribute('data-position')
const frame = async (s) => Number(await s.locator('.model-area').getAttribute('data-frame'))

const s = await ac({ viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true })
const arm = s.locator('.model-walking-pad')
await arm.waitFor()
await arm.scrollIntoViewIfNeeded()
const k = await arm.boundingBox()
const a = await s.locator('.model-area').boundingBox()
condition(k.x >= a.x && k.x + k.width <= a.x + a.width && k.y + k.height <= a.y + a.height, 'kol sahne dışında')
const firstFrame = await frame(s)
await s.waitForFunction((n) => Number(document.querySelector('.model-area')?.dataset.frame) > n + 3, firstFrame)
const once = await position(s)
const ox = k.x + k.width / 2, oy = k.y + k.height / 2
await s.mouse.move(ox, oy)
await s.mouse.down()
await s.mouse.move(ox, oy - 36)
await s.waitForFunction((o) => document.querySelector('.model-area')?.dataset.position !== o, once)
await s.mouse.up()
const k1 = await frame(s)
await s.waitForFunction((n) => Number(document.querySelector('.model-area')?.dataset.frame) > n + 3, k1)
const stopped = await position(s)
const k2 = await frame(s)
await s.waitForFunction((n) => Number(document.querySelector('.model-area')?.dataset.frame) > n + 5, k2)
condition(await position(s) === stopped, 'kol bırakılınca yürüme durmadı')
await s.locator('.model-box').screenshot({ path: `test-results/${id}-touchscreen.png` })
await s.context().close()

const m = await ac({ viewport: { width: 1000, height: 640 } })
condition(await m.locator('.model-walking-pad').count() === 0, 'masaüstünde kol görünüyor')
await m.context().close()
await b.close()
console.log(`${id}: dokunmatik kolla yürüme, durma ve masaüstünde gizleme geçti.`)
