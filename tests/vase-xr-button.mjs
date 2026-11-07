// Vazo atölyesinin `VR'da aç` düğmesi: sahte navigator.xr ile destek ve reddedilme akışı.
// Çalıştırma: npm run build && npm run preview -- --port 4178 --strictPort, sonra TEST_URL=http://127.0.0.1:4178 node tests/vazo-xr-dugme.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }
// Yazılımsal çizimde yüklü makinede ana iş parçacığı uzun süre meşgul kalır; 30 sn yetmez.
const SURE = 180000
const REJECT_TEXT = 'VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Atölyeyi bu ekranda kullanmaya devam edebilirsin.'

async function ac(xrEmulation) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.setDefaultTimeout(SURE)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.addInitScript(xrEmulation)
  await page.goto(`${url}/workshop/vase`)
  const start = page.getByRole('button', { name: 'Vazoyu parçala ve onar' })
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { timeout: SURE })
  return { page, errors, start, vrButton: page.getByRole('button', { name: "VR'da aç" }) }
}
/** Ekrandaki atölye sürüyor: onarım başlar, tutamaçlar görünür, tuval hâlâ yerinde. */
async function workshopWorks(page, start) {
  await start.click()
  await page.waitForFunction(() => [...document.querySelectorAll('.vase-handle')].filter((e) => !e.hidden).length === 6, null, { timeout: SURE })
  condition(await page.locator('.vase-scene canvas').count() === 1, 'tuval yok')
}

{
  const { page, errors, start, vrButton } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  })
  condition(!(await vrButton.count()), "xr yokken VR'da aç görünüyor")
  await workshopWorks(page, start)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('xr_yok: düğme yok, atölye çalışıyor, konsol temiz.')
}

{
  const { page, errors, start, vrButton } = await ac(() => {
    window.__xrAsked = 0
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => { window.__xrAsked++; return false },
        requestSession: async () => { throw new Error('çağrılmamalıydı') },
      },
      configurable: true,
    })
  })
  condition(await page.evaluate(() => window.__xrAsked > 0), 'isSessionSupported sorulmadı')
  condition(!(await vrButton.count()), "destek yokken VR'da aç görünüyor")
  await workshopWorks(page, start)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('destek_yok: düğme yok, atölye çalışıyor, konsol temiz.')
}

{
  const { page, errors, start, vrButton } = await ac(() => {
    window.__xrRequest = []
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => true,
        requestSession: (kip) => {
          window.__xrRequest.push({ kip, gesture: navigator.userActivation.isActive })
          return Promise.reject(new DOMException('İzin verilmedi', 'NotAllowedError'))
        },
      },
      configurable: true,
    })
  })
  await vrButton.waitFor({ timeout: SURE })
  condition(await vrButton.isEnabled(), "VR'da aç etkin değil")
  await vrButton.click()
  const message = page.getByRole('alert')
  await message.waitFor({ state: 'visible', timeout: SURE })
  condition((await message.textContent()).trim() === REJECT_TEXT, `hata metni birebir değil: ${await message.textContent()}`)
  const request = await page.evaluate(() => window.__xrRequest)
  condition(request.length === 1, `requestSession ${request.length} kez çağrıldı`)
  condition(request[0].kip === 'immersive-vr', `yanlış kip: ${request[0].kip}`)
  condition(request[0].gesture, 'requestSession kullanıcı jesti dışında çağrıldı')
  condition(await vrButton.isEnabled(), "ret sonrası VR'da aç etkin değil")
  await workshopWorks(page, start)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('reddedildi: Türkçe mesaj görünür, jest korunur, atölye sürer, konsol temiz.')
}

await browser.close()
