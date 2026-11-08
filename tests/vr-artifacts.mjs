// Maketler (/places): Leaflet map, 10 model markers in Bursa, list hover highlights the marker, marker opens the model page.
// Konya has no models: empty box plus map. No horizontal overflow on phones. Does not wait for OSM tiles (may be offline).
// Run: with the dev server up, TEST_URL=http://127.0.0.1:5173 node tests/vr-artifacts.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const view = process.env.TEST_SCREENSHOT ?? 'test-results'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (k, m) => { if (!k) throw new Error(m) }
const MODEL_COUNT = 10

async function open(width, xr, option = {}) {
  const context = await browser.newContext({ viewport: { width: width, height: 800 }, ...option })
  if (xr) await context.addInitScript(() => { Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async () => true }, configurable: true }) })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  return { page, errors, context }
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

async function check(width) {
  const { page, errors } = await open(width, false)
  await page.goto(`${url}/places`)
  await page.getByRole('heading', { name: 'Maketler', exact: true }).waitFor()
  await page.locator('.leaflet-container').waitFor()
  await page.locator('.hm-model').first().waitFor()
  condition(await page.locator('.hm-model').count() === MODEL_COUNT, `${width}: Bursa must show ${MODEL_COUNT} model markers`)
  await page.locator('.hm-legend').waitFor()
  condition(await page.locator('.vr-map-empty').count() === 0, `${width}: empty box visible in Bursa`)
  condition(await page.locator('.vr-buildings li').count() === MODEL_COUNT, `${width}: list must have ${MODEL_COUNT} rows`)

  // Row hover -> marker highlight
  await page.locator('.vr-buildings').getByRole('link', { name: 'Bursa Ulu Camii', exact: true }).hover()
  await page.locator('.hm-model[data-highlight]').waitFor()
  condition(await page.locator('.hm-model[data-highlight]').count() === 1, `${width}: exactly one marker must be highlighted`)
  condition((await page.locator('.hm-model[data-highlight]').getAttribute('title')).includes('Ulu Camii'), `${width}: wrong marker highlighted`)
  await page.mouse.move(0, 0)
  await page.locator('.hm-model[data-highlight]').waitFor({ state: 'detached' })

  condition(await overflow(page) <= 0, `${width}: horizontal overflow in Bursa`)
  await page.screenshot({ path: `${view}/maketler-bursa-${width}.png` })

  // Marker click -> model page
  await page.locator('.hm-model[title*="Ulu Camii"]').dispatchEvent('click')
  await page.waitForURL(/\/places\/ulu-mosque$/)
  await page.goBack()
  await page.locator('.hm-model').first().waitFor()

  // Konya: no models, empty box, map still there
  await page.goto(`${url}/places?city=Konya`)
  await page.locator('.vr-map-empty').waitFor()
  await page.locator('.leaflet-container').waitFor()
  await page.locator('.hm-legend').waitFor()
  condition(await page.locator('.hm-model').count() === 0, `${width}: Konya must have no model markers`)
  condition(await overflow(page) <= 0, `${width}: horizontal overflow in Konya`)
  await page.screenshot({ path: `${view}/maketler-konya-${width}.png` })
  condition(!errors.length, errors.join(' | '))
  await page.close()
}

await check(1280)
await check(375)

await browser.close()
console.log('Maketler: Leaflet map, 10 model markers, legend, row hover highlight, marker click, Konya empty box and phone overflow passed.')
