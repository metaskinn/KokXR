// Sword workshop video: plays with real mouse events; draws cuts on the targets with the mouse in the test area.
// First: npm run build && npm run preview -- --port 4173
// Run: node scripts/sword_video.mjs <output.webm>   (with GPU=0 if there is no graphics card)
// The cursor and captions are added only to the video; they are not part of the app.
import { chromium } from 'playwright'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const output = process.argv[2] ?? 'test-results/kokxr-sword-workshop.webm'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const size = { width: 1600, height: 1000 }
const temp = mkdtempSync(join(tmpdir(), 'kokxr-sword-video-'))
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
    cursor.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transition:scale .1s'
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 5z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    const writing = document.createElement('div')
    writing.id = 'demo-writing'
    writing.style.cssText = 'position:fixed;left:32%;bottom:26px;translate:-50% 0;z-index:2147483646;pointer-events:none;max-width:56%;padding:11px 22px;border-radius:10px;background:rgb(12 20 18/.88);color:#fff;font:600 21px system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .3s'
    document.documentElement.append(cursor, writing)
  })
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => { errors.push(e.message) })

let fx = 500, fy = 400
const wait = (ms) => page.waitForTimeout(ms)
const writing = (m) => page.evaluate((v) => { const y = document.getElementById('demo-writing'); if (!y) return; if (v) y.textContent = v; y.style.opacity = v ? '1' : '0' }, m)
const cursorPress = (s) => page.evaluate((v) => { const c = document.getElementById('demo-cursor'); if (c) c.style.scale = v }, s)
async function mouse(x, y, step = 20) {
  const bx = fx, by = fy
  for (let i = 1; i <= step; i++) {
    const t = i / step, e = t * t * (3 - 2 * t)
    fx = bx + (x - bx) * e; fy = by + (y - by) * e
    await page.mouse.move(fx, fy)
    await page.evaluate(([a, b]) => { const c = document.getElementById('demo-cursor'); if (c) c.style.transform = `translate(${a}px,${b}px)` }, [fx, fy])
  }
}
async function click(locator, step = 18) {
  const h = locator.first(); await h.waitFor({ state: 'visible', timeout: 30000 })
  await h.scrollIntoViewIfNeeded(); await wait(120)
  const b = await h.boundingBox()
  await mouse(b.x + b.width / 2, b.y + b.height / 2, step)
  await cursorPress('.8'); await page.mouse.down(); await wait(70); await page.mouse.up(); await cursorPress('1')
}
async function pressHold(locator, cond, mostOf = 20000) {
  await locator.first().scrollIntoViewIfNeeded(); await wait(120)
  const b = await locator.first().boundingBox()
  await mouse(b.x + b.width / 2, b.y + b.height / 2, 16)
  await cursorPress('.8'); await page.mouse.down()
  await cond().catch(() => {})
  void mostOf
  await page.mouse.up(); await cursorPress('1')
}
const stageEl = page.locator('.sword-scene')
const stage = () => stageEl.getAttribute('data-stage')
const waitStage = (n, t = 30000) => page.waitForFunction((v) => document.querySelector('.sword-scene')?.dataset.stage === String(v), n, { timeout: t })
const temperature = () => page.locator('#sword-temperature').getAttribute('value').then(Number)
const button = (name) => page.getByRole('button', { name })
const data = async (k) => stageEl.getAttribute(`data-${k}`)

async function section(name, fn) {
  const t = Date.now()
  try { await fn(); console.log(`✅ ${name} (${Math.round((Date.now() - t) / 1000)} s)`) }
  catch (e) { console.log(`❌ ${name}: ${String(e.message).split('\n')[0].slice(0, 200)}`); errors.push(name) }
}

await page.goto(`${url}/workshops/sword`)
await stageEl.locator('canvas').waitFor(); await waitStage(0, 60000)
await stageEl.evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 40))
await wait(900)

await section('Ingot', async () => {
  await writing('Kılıç yumurtası: çelik külçesi tezgâhta bekliyor')
  await mouse(560, 420, 30); await wait(1500)
  await click(page.locator('.sword-scene-marker')); await waitStage(1); await wait(2400)
})
await section('Heating', async () => {
  await writing('Körüğü bas: çelik koyu kırmızıdan sarıya döner')
  await pressHold(button('Körüğü basılı tut'), () => page.waitForFunction(() => +document.querySelector('#sword-temperature')?.value >= 1020, null, { timeout: 25000 }))
  await wait(600); await click(button('Örse geç →')); await waitStage(2); await wait(2200)
})
await section('Forging', async () => {
  await writing('Her darbe çeliği uzatır: külçe adım adım namluya dönüşür')
  for (const b of [6, 7, 5, 8, 4, 9]) {
    await click(button(new RegExp(`^Bölge ${b}$`)), 8); await wait(250)
    for (let k = 0; k < 3; k++) {
      await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.hammer === '1', null, { timeout: 8000 })
      const s = await stageEl.boundingBox(), x = +(await data('strike-x')), y = +(await data('strike-y'))
      await mouse(s.x + x, s.y + y, 8); await cursorPress('.8'); await page.mouse.down(); await page.mouse.up(); await cursorPress('1')
    }
    if ((await temperature()) < 800) break
  }
  await wait(800)
  await writing('Ustaya bırak: jüri demosu için kalan bölgeleri tamamlar')
  await click(page.getByRole('button', { name: /^Ustaya bırak/ })); await waitStage(3); await wait(2400)
})
await section('Quenching', async () => {
  await writing('Su verme: doğru sıcaklıkta daldır, buhar yükselir')
  await page.waitForFunction(() => { const v = +document.querySelector('#sword-temperature')?.value; return v >= 790 && v <= 870 }, null, { timeout: 15000 }).catch(() => {})
  await pressHold(button(/Suya daldır/), () => waitStage(4, 15000)); await wait(2600)
})
await section('Sharpening', async () => {
  await writing('Bileme: namluyu taşa bastır, fareyle boydan boya sürükle')
  const s = await stageEl.boundingBox()
  const y = s.y + s.height * .45, right = s.x + s.width * .58, left = s.x + s.width * .1
  await mouse(right, y, 18); await cursorPress('.8'); await page.mouse.down(); await wait(900)
  for (let tour = 0; tour < 8 && await stage() === '4'; tour++) {
    const target = tour % 2 === 0 ? left : right
    await mouse(target, y + Math.sin(tour) * 8, 95)
  }
  await page.mouse.up(); await cursorPress('1')
  if (await stage() === '4') { await click(page.getByRole('button', { name: /^Ustaya bırak/ })) }
  await waitStage(5); await wait(2400)
})
await section('Assembly', async () => {
  await writing('Balçak, mors dişi plakalar, dört perçin; sonunda altın bant belirir')
  for (let i = 0; i < 7; i++) { await click(page.locator('.sword-scene-marker'), 12); await wait(780) }
  await waitStage(6); await wait(2600)
})
await section('Inspection', async () => {
  await writing('Temsilî model: ölçüler kaynaktan, her parça notu kaynaklı')
  const s = await stageEl.boundingBox(), x = s.x + s.width * .3, y = s.y + s.height * .5
  await mouse(x - 160, y, 18); await cursorPress('.8'); await page.mouse.down(); await mouse(x + 200, y - 40, 70); await page.mouse.up(); await cursorPress('1'); await wait(1100)
  await click(page.getByRole('button', { name: '4. Balçak' })); await wait(3000)
  await click(page.getByRole('button', { name: 'Parça notunu kapat' })); await wait(600)
  await click(button('Test alanına geç →')); await waitStage(7); await wait(2600)
})

// Cut line relative to the target in the scene (in meters): really drawn with the mouse, damage lands where it is drawn.
async function drawCut(ax, ay, bx, by, step = 7) {
  const s = await stageEl.boundingBox(), x = s.x + +(await data('target-x')), y = s.y + +(await data('target-y')), o = +(await data('target-scale'))
  await mouse(x + ax * o, y - ay * o, 16); await wait(180)
  await cursorPress('.8'); await page.mouse.down()
  await mouse(x + bx * o, y - by * o, step)
  await page.mouse.up(); await cursorPress('1')
  await wait(1000)
  console.log('   damage', await data('damage'), '·', (await page.locator('.sword-message').textContent()).slice(0, 80))
}
await section('Test: straw roll', async () => {
  await writing('Test alanı: fareyle kesim çiz. Hasır çizdiğin açıda kesilir')
  await click(button(/^Hasır rulo/)); await wait(1600)
  await drawCut(-.42, .34, .42, .18)
  await wait(800)
  await writing('Her vuruş kalıcı: kalan gövdeyi yeniden kes')
  await drawCut(.4, .02, -.4, -.14)
  await wait(1000)
})
await section('Test: log', async () => {
  await writing('Kütük: aynı yere vurdukça kama kesik derinleşir')
  await click(button(/^Kütük/)); await wait(1900)
  for (let i = 0; i < 5; i++) {
    if ((await data('damage')).split(',')[1] === '1.00') break
    await drawCut(-.05, .42, .05, -.3); await wait(350)
  }
  await wait(1400)
})
await section('Test: cloth', async () => {
  await writing('Kumaş: gevşek hedef savrulur, keskin ağız boydan boya keser')
  await click(button(/^Asılı kumaş/)); await wait(1900)
  await drawCut(-.62, .34, .62, -.16, 8)
  await wait(2600)
  await writing('KökXR — Dokunamadığın tarihe dokun.')
  await wait(2600)
})

const video = page.video()
await context.close()
await video.saveAs(output)
await browser.close()
rmSync(temp, { recursive: true, force: true })
console.log(errors.length ? `ERRORS: ${JSON.stringify(errors)}` : 'Finished without errors.', '→', output)
