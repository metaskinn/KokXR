// The sword workshop's `VR'da aç` button: support and rejection flow with a fake navigator.xr.
// Run: npm run build && npm run preview -- --port 4177 --strictPort, then TEST_URL=http://127.0.0.1:4177 node tests/sword-xr-button.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }
const REJECT_TEXT = 'VR oturumu başlatılamadı. Atölyeyi ekranda kullanmaya devam edebilirsin.'
const TIMEOUT = 180000

async function open(xrEmulation) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.addInitScript(xrEmulation)
  await page.goto(`${url}/workshops/sword`)
  await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.stage === '0', null, { timeout: TIMEOUT })
  await page.locator('.sword-loading').waitFor({ state: 'detached', timeout: TIMEOUT })
  return { page, errors, vr: page.getByRole('button', { name: "VR'da aç" }) }
}
// The on-screen game is still playable: the ingot is taken, the stage advances, no leftover frame errors.
async function gameRunning(page) {
  await page.getByRole('button', { name: /^Külçeyi al/ }).click()
  await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.stage === '1', null, { timeout: TIMEOUT })
}

// --- no navigator.xr ---
{
  const { page, errors, vr } = await open(() => { Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true }) })
  condition(!(await vr.count()), '"VR\'da aç" visible without xr')
  await gameRunning(page)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('no_xr: no button, on-screen game continues, console clean.')
}

// --- Browser does not support immersive-vr ---
{
  const { page, errors, vr } = await open(() => {
    window.__xrAsked = []
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async k => { window.__xrAsked.push(k); return false }, requestSession: async () => { throw new Error('should not have been called') } }, configurable: true })
  })
  condition((await page.evaluate(() => window.__xrAsked)).includes('immersive-vr'), 'isSessionSupported not queried')
  condition(!(await vr.count()), '"VR\'da aç" visible without support')
  await gameRunning(page)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('no_support: no button, on-screen game continues, console clean.')
}

// --- isSessionSupported rejects (e.g. permissions policy) ---
{
  const { page, errors, vr } = await open(() => {
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: () => Promise.reject(new DOMException('forbidden', 'SecurityError')) }, configurable: true })
  })
  condition(!(await vr.count()), '"VR\'da aç" visible when the support check rejects')
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('check_rejected: no button, console clean.')
}

// --- Supported, but the session request is rejected ---
{
  const { page, errors, vr } = await open(() => {
    window.__xrRequest = []
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => true,
        requestSession: (mode, option) => { window.__xrRequest.push({ mode, option, gesture: navigator.userActivation.isActive }); return Promise.reject(new DOMException('İzin verilmedi', 'NotAllowedError')) },
      },
      configurable: true,
    })
  })
  await vr.waitFor({ timeout: TIMEOUT })
  condition(await vr.isEnabled(), '"VR\'da aç" not enabled')
  await vr.click()
  const message = page.locator('.sword-xr-error')
  await message.waitFor({ state: 'visible', timeout: TIMEOUT })
  condition((await message.textContent()).trim() === REJECT_TEXT, 'error text differs')
  condition((await message.getAttribute('role')) === 'alert', 'error message not announced')
  const request = await page.evaluate(() => window.__xrRequest)
  condition(request.length === 1, `requestSession called ${request.length} times`)
  condition(request[0].mode === 'immersive-vr', `wrong mode: ${request[0].mode}`)
  condition(request[0].option.optionalFeatures.includes('local-floor'), 'local-floor not requested')
  condition(request[0].gesture, 'requestSession called outside a user gesture')
  condition(await vr.isEnabled(), '"VR\'da aç" not enabled after rejection')
  condition(await page.locator('.sword-scene').getAttribute('data-xr') === null, 'scene stayed in VR mode after rejection')
  await gameRunning(page)
  // Can be retried; a new attempt clears the old message.
  await vr.click()
  await page.waitForFunction(() => window.__xrRequest.length === 2)
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('rejected: Turkish message visible, gesture kept, local-floor requested, game continues, can retry, console clean.')
}

await browser.close()
