// The Ulu Mosque model's `VR'da aç` button: support and rejection flow with a fake navigator.xr.
// Run: npm run build && npm run preview -- --port 4173, then node tests/model-xr-button.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }
const REJECT_TEXT = "VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin."
// Under software rendering, scene setup blocks the main thread for long; 30 s is not enough on a loaded machine.
const TIMEOUT = 180000

async function open(xrEmulation, argument, openNow = false) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
  await page.addInitScript(xrEmulation, argument)
  await page.goto(`${url}/${openNow ? 'places' : 'artifact'}/ulu-mosque`)
  if (!openNow) await page.getByRole('button', { name: /maketini eline al/ }).click({ timeout: TIMEOUT })
  await page.locator('.model-area canvas').waitFor({ timeout: TIMEOUT })
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  const goInside = page.getByRole('button', { name: 'İçeri gir' })
  await page.waitForFunction(() => [...document.querySelectorAll('.model-control button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled), null, { timeout: TIMEOUT })
  return { page, errors, goInside, vrButton: page.getByRole('button', { name: "VR'da aç" }) }
}

/** Shows the scene is still drawing: enters inside, the frame counter advances. */
async function insideWorks(page, goInside) {
  await goInside.click()
  await page.getByRole('button', { name: /Dışarı çık/ }).waitFor({ timeout: TIMEOUT })
  const area = page.locator('.model-area')
  await page.waitForFunction(() => Number(document.querySelector('.model-area')?.dataset.frame) > 0, null, { timeout: TIMEOUT })
  const before = Number(await area.getAttribute('data-frame'))
  await page.waitForFunction((n) => Number(document.querySelector('.model-area')?.dataset.frame) > n, before, { timeout: TIMEOUT })
}

// --- no navigator.xr ---
{
  const { page, errors, goInside, vrButton } = await open(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  })
  condition(!(await vrButton.count()), '"VR\'da aç" visible without xr')
  await insideWorks(page, goInside)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('no_xr: no button, entered inside, scene drawing.')
}

// --- Browser does not support immersive-vr ---
{
  const { page, errors, vrButton } = await open(() => {
    window.__xrAsked = 0
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => { window.__xrAsked++; return false },
        requestSession: async () => { throw new Error('should not have been called') },
      },
      configurable: true,
    })
  })
  condition(await page.evaluate(() => window.__xrAsked > 0), 'isSessionSupported not queried')
  condition(!(await vrButton.count()), '"VR\'da aç" visible without support')
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('no_support: no button.')
}

// --- Supported, but the session request is rejected ---
{
  const { page, errors, goInside, vrButton } = await open(() => {
    window.__xrRequest = []
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => true,
        requestSession: (mode) => {
          window.__xrRequest.push({ mode, gesture: navigator.userActivation.isActive })
          return Promise.reject(new DOMException('İzin verilmedi', 'NotAllowedError'))
        },
      },
      configurable: true,
    })
  })
  await vrButton.waitFor({ timeout: TIMEOUT })
  condition(await vrButton.isEnabled(), '"VR\'da aç" not enabled')
  await vrButton.click()
  const message = page.locator('.model-state', { hasText: REJECT_TEXT })
  await message.waitFor({ state: 'visible', timeout: TIMEOUT })
  condition(await message.getAttribute('aria-live'), 'error message is not aria-live')
  condition((await message.textContent()).trim() === REJECT_TEXT, 'error text does not match exactly')

  const request = await page.evaluate(() => window.__xrRequest)
  condition(request.length === 1, `requestSession called ${request.length} times`)
  condition(request[0].mode === 'immersive-vr', `wrong mode: ${request[0].mode}`)
  condition(request[0].gesture, 'requestSession called outside a user gesture')

  // The message must not block dragging the scene.
  const middleOne = await page.evaluate(() => {
    const k = document.querySelector('.model-area').getBoundingClientRect()
    return document.elementFromPoint(k.x + k.width / 2, k.y + k.height / 2)?.closest('.model-state') !== null
  })
  condition(!middleOne, 'error message covers the scene')

  condition(await goInside.isEnabled(), '"İçeri gir" not enabled after rejection')
  condition(await vrButton.isEnabled(), '"VR\'da aç" not enabled after rejection')
  await insideWorks(page, goInside)
  condition(!(await page.locator('.model-state', { hasText: REJECT_TEXT }).count()), 'error message not cleared after entering')
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('rejected: Turkish message visible, gesture kept, can enter inside, console clean.')
}

// On the direct /places route the scene is prepared without pressing a button and can be entered.
{
  const { page, errors, goInside } = await open(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  }, undefined, true)
  await insideWorks(page, goInside)
  condition(!errors.length, `error on direct VR route: ${errors.join(' | ')}`)
  await page.close()
  console.log('/places/ulu-mosque: scene opens by itself, interior keeps drawing.')
}

await browser.close()
