// Dokunmatik telefon görünümü: iç mekânda yürüme kolu görünür, itince yürünür, bırakınca durulur; masaüstünde kol yoktur.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/maket-dokunmatik.mjs [eser-id]
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173', id = process.argv[2] ?? 'ulu-camii'
const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (k, m) => { if (!k) throw new Error(m) }
const ac = async (ops) => {
  const s = await (await b.newContext(ops)).newPage()
  s.setDefaultTimeout(240000)
  await s.goto(`${url}/vr/${id}`)
  await s.getByRole('button', { name: 'İçeri gir' }).click()
  await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
  return s
}
const konum = (s) => s.locator('.maket-alan').getAttribute('data-konum')
const kare = async (s) => Number(await s.locator('.maket-alan').getAttribute('data-kare'))

const s = await ac({ viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true })
const kol = s.locator('.maket-yurume-kolu')
await kol.waitFor()
await kol.scrollIntoViewIfNeeded()
const k = await kol.boundingBox()
const a = await s.locator('.maket-alan').boundingBox()
sart(k.x >= a.x && k.x + k.width <= a.x + a.width && k.y + k.height <= a.y + a.height, 'kol sahne dışında')
const ilkKare = await kare(s)
await s.waitForFunction((n) => Number(document.querySelector('.maket-alan')?.dataset.kare) > n + 3, ilkKare)
const once = await konum(s)
const ox = k.x + k.width / 2, oy = k.y + k.height / 2
await s.mouse.move(ox, oy)
await s.mouse.down()
await s.mouse.move(ox, oy - 36)
await s.waitForFunction((o) => document.querySelector('.maket-alan')?.dataset.konum !== o, once)
await s.mouse.up()
const k1 = await kare(s)
await s.waitForFunction((n) => Number(document.querySelector('.maket-alan')?.dataset.kare) > n + 3, k1)
const durdu = await konum(s)
const k2 = await kare(s)
await s.waitForFunction((n) => Number(document.querySelector('.maket-alan')?.dataset.kare) > n + 5, k2)
sart(await konum(s) === durdu, 'kol bırakılınca yürüme durmadı')
await s.locator('.maket-kutu').screenshot({ path: `test-sonuclari/${id}-dokunmatik.png` })
await s.context().close()

const m = await ac({ viewport: { width: 1000, height: 640 } })
sart(await m.locator('.maket-yurume-kolu').count() === 0, 'masaüstünde kol görünüyor')
await m.context().close()
await b.close()
console.log(`${id}: dokunmatik kolla yürüme, durma ve masaüstünde gizleme geçti.`)
