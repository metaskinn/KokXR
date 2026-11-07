// Durak animasyonunu tuş/fareyle kesmek güvenli hedefte yürümeyi sürdürmeli.
// TEST_URL=http://127.0.0.1:5187 TEST_BROWSER_CHANNEL=chromium node tests/maket-gecis.mjs
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 720, height: 640 }, reducedMotion: 'no-preference' })
  page.setDefaultTimeout(120000)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  // Tek kareyi 170ms ilerletmek geçişi gerçekten ortasında keser. Yazılımsal
  // çizimin duvar saati testin girişten önce animasyonu bitirmesine yol açmaz.
  await page.addInitScript(() => {
    const raf = requestAnimationFrame.bind(window), cancel = cancelAnimationFrame.bind(window)
    const now = performance.now.bind(performance), waiting = new Map()
    let paused = false, forced = null, last = now()
    Object.defineProperty(performance, 'now', { value: () => forced ?? now() })
    window.requestAnimationFrame = (cb) => {
      const id = raf((t) => {
        if (paused) waiting.set(id, cb)
        else { last = now(); cb(t) }
      })
      return id
    }
    window.cancelAnimationFrame = (id) => { waiting.delete(id); cancel(id) }
    window.__transitionTest = {
      pause: () => { paused = true },
      ready: () => waiting.size > 0,
      step: (ms) => {
        const callbacks = [...waiting.values()]; waiting.clear()
        forced = last + ms; last = forced
        try { for (const cb of callbacks) cb(forced) } finally { forced = null }
      },
    }
  })
  await page.goto(`${process.env.TEST_URL ?? 'http://127.0.0.1:4173'}/vr/ulu-mosque`)
  const area = page.locator('.model-area')
  const click = (name) => page.getByRole('button', { name, exact: true }).evaluate((e) => e.click())
  await page.getByRole('button', { name: 'İçeri gir', exact: true }).waitFor()
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'İçeri gir')?.disabled, null, { polling: 50 })
  await click('İçeri gir')
  await page.waitForFunction(() => Number(document.querySelector('.model-area')?.dataset.frame) >= 2, null, { polling: 50 })
  const targets = await page.evaluate(async () => {
    const { interiorStops } = await import('/src/features/scale-models/uluMosqueInterior.ts')
    return Object.fromEntries(interiorStops.map((d) => [d.ad, d.position]))
  })
  const step = async (ms = 50) => {
    await page.waitForFunction(() => window.__transitionTest.ready(), null, { polling: 50 })
    await page.evaluate((dt) => window.__transitionTest.step(dt), ms)
  }
  const pos = async () => (await area.getAttribute('data-position'))?.split(',').map(Number)
  const key = (type, name = 'w') => area.evaluate((el, [event, key]) => el.dispatchEvent(new KeyboardEvent(event, { key, bubbles: true })), [type, name])
  await page.evaluate(() => window.__transitionTest.pause())
  for (const [name, input] of [['Mahfile çık', 'tuş'], ['Mahfile çık', 'mouse'], ['Mihrap', 'tuş']]) {
    if (input !== 'tuş' || name !== 'Mahfile çık') {
      await click('← Dışarı çık'); await click('İçeri gir')
    }
    await click(name)
    await step(170)
    if (input === 'mouse') {
      await area.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      const box = await page.locator('.model-area canvas').boundingBox()
      await page.mouse.move(box.x + box.width * .75, box.y + box.height * .65)
      await page.mouse.down(); await page.mouse.up()
    }
    await key('keydown')
    await step()
    const first = await pos()
    await step()
    const second = await pos()
    await key('keyup')
    const [x, , z] = targets[name]
    assert(first && second, `${name}/${input}: yürüyüş konumu yazılmadı`)
    assert(Math.hypot(first[0] - x, first[1] - z) < 1.5, `${name}/${input}: güvenli hedefe ulaşılmadı: ${first}`)
    assert(Math.hypot(second[0] - first[0], second[1] - first[1]) > .02, `${name}/${input}: geçişten sonra yürüme kilitlendi: ${second}`)
    console.log(`${name}/${input}: geçiş ortasında kesildi, hedefte yürüyüş sürdü.`)
  }
  assert.deepEqual(errors, [], 'Tarayıcı çalışma zamanı hatası')
  console.log('Durak geçişi: mahfil tuş/fare kesintisi ve mihrap havuz geçişi başarılı.')
} finally { await browser.close() }
