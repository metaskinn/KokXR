// The vase workshop's `VR'da aç` button: support and rejection flow with a fake navigator.xr.
// Run: npm run build && npm run preview -- --port 4178 --strictPort, then TEST_URL=http://127.0.0.1:4178 node tests/vase-xr-button.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }
// Under software rendering on a loaded machine the main thread stays busy for long; 30 s is not enough.
const TIMEOUT = 180000
const REJECT_TEXT = 'VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Atölyeyi bu ekranda kullanmaya devam edebilirsin.'

async function open(xrEmulation) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.setDefaultTimeout(TIMEOUT)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.addInitScript(xrEmulation)
  await page.goto(`${url}/workshops/vase`)
  const start = page.getByRole('button', { name: 'Vazoyu parçala ve onar' })
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { timeout: TIMEOUT })
  return { page, errors, start, vrButton: page.getByRole('button', { name: "VR'da aç" }) }
}
/** The on-screen workshop continues: repair starts, handles appear, the canvas is still there. */
async function workshopWorks(page, start) {
  await start.click()
  await page.waitForFunction(() => [...document.querySelectorAll('.vase-handle')].filter((e) => !e.hidden).length === 6, null, { timeout: TIMEOUT })
  condition(await page.locator('.vase-scene canvas').count() === 1, 'no canvas')
}

{
  const { page, errors, start, vrButton } = await open(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  })
  condition(!(await vrButton.count()), '"VR\'da aç" visible without xr')
  await workshopWorks(page, start)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('no_xr: no button, workshop works, console clean.')
}

{
  const { page, errors, start, vrButton } = await open(() => {
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
  await workshopWorks(page, start)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('no_support: no button, workshop works, console clean.')
}

{
  const { page, errors, start, vrButton } = await open(() => {
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
  const message = page.getByRole('alert')
  await message.waitFor({ state: 'visible', timeout: TIMEOUT })
  condition((await message.textContent()).trim() === REJECT_TEXT, `error text does not match exactly: ${await message.textContent()}`)
  const request = await page.evaluate(() => window.__xrRequest)
  condition(request.length === 1, `requestSession called ${request.length} times`)
  condition(request[0].mode === 'immersive-vr', `wrong mode: ${request[0].mode}`)
  condition(request[0].gesture, 'requestSession called outside a user gesture')
  condition(await vrButton.isEnabled(), '"VR\'da aç" not enabled after rejection')
  await workshopWorks(page, start)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('rejected: Turkish message visible, gesture kept, workshop continues, console clean.')
}

await browser.close()
