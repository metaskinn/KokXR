// Kılıç atölyesinin `VR'da aç` düğmesi: sahte navigator.xr ile destek ve reddedilme akışı.
// Çalıştırma: npm run build && npm run preview -- --port 4177 --strictPort, sonra TEST_URL=http://127.0.0.1:4177 node tests/kilic-xr-dugme.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }
const REJECT_TEXT = 'VR oturumu başlatılamadı. Atölyeyi ekranda kullanmaya devam edebilirsin.'
const SURE = 180000

async function ac(xrEmulation) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.addInitScript(xrEmulation)
  await page.goto(`${url}/workshops/sword`)
  await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.stage === '0', null, { timeout: SURE })
  await page.locator('.sword-loading').waitFor({ state: 'detached', timeout: SURE })
  return { page, errors, vr: page.getByRole('button', { name: "VR'da aç" }) }
}
// Ekrandaki oyun hâlâ oynanıyor: külçe alınır, aşama ilerler, kalan kare hatası olmaz.
async function gameRunning(page) {
  await page.getByRole('button', { name: /^Külçeyi al/ }).click()
  await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.stage === '1', null, { timeout: SURE })
}

// --- navigator.xr yok ---
{
  const { page, errors, vr } = await ac(() => { Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true }) })
  condition(!(await vr.count()), "xr yokken VR'da aç görünüyor")
  await gameRunning(page)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('xr_yok: düğme yok, ekrandaki oyun sürüyor, konsol temiz.')
}

// --- Tarayıcı immersive-vr desteklemiyor ---
{
  const { page, errors, vr } = await ac(() => {
    window.__xrAsked = []
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async k => { window.__xrAsked.push(k); return false }, requestSession: async () => { throw new Error('çağrılmamalıydı') } }, configurable: true })
  })
  condition((await page.evaluate(() => window.__xrAsked)).includes('immersive-vr'), 'isSessionSupported sorulmadı')
  condition(!(await vr.count()), "destek yokken VR'da aç görünüyor")
  await gameRunning(page)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('destek_yok: düğme yok, ekrandaki oyun sürüyor, konsol temiz.')
}

// --- isSessionSupported reddediyor (ör. izin politikası) ---
{
  const { page, errors, vr } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: () => Promise.reject(new DOMException('forbidden', 'SecurityError')) }, configurable: true })
  })
  condition(!(await vr.count()), "denetim reddedilince VR'da aç görünüyor")
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('denetim_reddi: düğme yok, konsol temiz.')
}

// --- Destek var, oturum isteği reddediliyor ---
{
  const { page, errors, vr } = await ac(() => {
    window.__xrRequest = []
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => true,
        requestSession: (kip, option) => { window.__xrRequest.push({ kip, option, gesture: navigator.userActivation.isActive }); return Promise.reject(new DOMException('İzin verilmedi', 'NotAllowedError')) },
      },
      configurable: true,
    })
  })
  await vr.waitFor({ timeout: SURE })
  condition(await vr.isEnabled(), "VR'da aç etkin değil")
  await vr.click()
  const message = page.locator('.sword-xr-error')
  await message.waitFor({ state: 'visible', timeout: SURE })
  condition((await message.textContent()).trim() === REJECT_TEXT, 'hata metni farklı')
  condition((await message.getAttribute('role')) === 'alert', 'hata mesajı duyurulmuyor')
  const request = await page.evaluate(() => window.__xrRequest)
  condition(request.length === 1, `requestSession ${request.length} kez çağrıldı`)
  condition(request[0].kip === 'immersive-vr', `yanlış kip: ${request[0].kip}`)
  condition(request[0].option.optionalFeatures.includes('local-floor'), 'local-floor istenmedi')
  condition(request[0].gesture, 'requestSession kullanıcı jesti dışında çağrıldı')
  condition(await vr.isEnabled(), "ret sonrası VR'da aç etkin değil")
  condition(await page.locator('.sword-scene').getAttribute('data-xr') === null, 'ret sonrası sahne VR kipinde kaldı')
  await gameRunning(page)
  // Yeniden denenebilir; yeni deneme eski mesajı kaldırır.
  await vr.click()
  await page.waitForFunction(() => window.__xrRequest.length === 2)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('reddedildi: Türkçe mesaj görünür, jest korunur, local-floor istenir, oyun sürer, yeniden denenir, konsol temiz.')
}

await browser.close()
