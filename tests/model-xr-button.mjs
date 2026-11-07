// Ulu Camii maketinin `VR'da aç` düğmesi: sahte navigator.xr ile destek ve reddedilme akışı.
// Çalıştırma: npm run build && npm run preview -- --port 4173, sonra node tests/maket-xr-dugme.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }
const REJECT_TEXT = "VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin."
// Yazılımsal çizimde sahne kurulumu ana iş parçacığını uzun süre tutar; yüklü makinede 30 sn yetmez.
const SURE = 180000

async function ac(xrEmulation, argument, openNow = false) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
  await page.addInitScript(xrEmulation, argument)
  await page.goto(`${url}/${openNow ? 'places' : 'artifact'}/ulu-mosque`)
  if (!openNow) await page.getByRole('button', { name: /maketini eline al/ }).click({ timeout: SURE })
  await page.locator('.model-area canvas').waitFor({ timeout: SURE })
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  const goInside = page.getByRole('button', { name: 'İçeri gir' })
  await page.waitForFunction(() => [...document.querySelectorAll('.model-control button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled), null, { timeout: SURE })
  return { page, errors, goInside, vrButton: page.getByRole('button', { name: "VR'da aç" }) }
}

/** Sahnenin hâlâ çizdiğini gösterir: içeri girilir, kare sayacı ilerler. */
async function insideWorks(page, goInside) {
  await goInside.click()
  await page.getByRole('button', { name: /Dışarı çık/ }).waitFor({ timeout: SURE })
  const area = page.locator('.model-area')
  await page.waitForFunction(() => Number(document.querySelector('.model-area')?.dataset.frame) > 0, null, { timeout: SURE })
  const once = Number(await area.getAttribute('data-frame'))
  await page.waitForFunction((n) => Number(document.querySelector('.model-area')?.dataset.frame) > n, once, { timeout: SURE })
}

// --- navigator.xr yok ---
{
  const { page, errors, goInside, vrButton } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  })
  condition(!(await vrButton.count()), "xr yokken VR'da aç görünüyor")
  await insideWorks(page, goInside)
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('xr_yok: düğme yok, içeri girildi, sahne çiziyor.')
}

// --- Tarayıcı immersive-vr desteklemiyor ---
{
  const { page, errors, vrButton } = await ac(() => {
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
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('destek_yok: düğme yok.')
}

// --- Destek var, oturum isteği reddediliyor ---
{
  const { page, errors, goInside, vrButton } = await ac(() => {
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
  const message = page.locator('.model-state', { hasText: REJECT_TEXT })
  await message.waitFor({ state: 'visible', timeout: SURE })
  condition(await message.getAttribute('aria-live'), 'hata mesajı aria-live değil')
  condition((await message.textContent()).trim() === REJECT_TEXT, 'hata metni birebir değil')

  const request = await page.evaluate(() => window.__xrRequest)
  condition(request.length === 1, `requestSession ${request.length} kez çağrıldı`)
  condition(request[0].kip === 'immersive-vr', `yanlış kip: ${request[0].kip}`)
  condition(request[0].gesture, 'requestSession kullanıcı jesti dışında çağrıldı')

  // Mesaj sahneyi sürüklemeyi engellememeli.
  const middleOne = await page.evaluate(() => {
    const k = document.querySelector('.model-area').getBoundingClientRect()
    return document.elementFromPoint(k.x + k.width / 2, k.y + k.height / 2)?.closest('.model-state') !== null
  })
  condition(!middleOne, 'hata mesajı sahnenin üstünü kapatıyor')

  condition(await goInside.isEnabled(), 'ret sonrası İçeri gir etkin değil')
  condition(await vrButton.isEnabled(), "ret sonrası VR'da aç etkin değil")
  await insideWorks(page, goInside)
  condition(!(await page.locator('.model-state', { hasText: REJECT_TEXT }).count()), 'hata mesajı içeri girince kalkmadı')
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('reddedildi: Türkçe mesaj görünür, jest korunur, içeri girilir, konsol temiz.')
}

// Doğrudan /vr rotasında sahne düğmeye basmadan hazırlanır ve içeri girilebilir.
{
  const { page, errors, goInside } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  }, undefined, true)
  await insideWorks(page, goInside)
  condition(!errors.length, `doğrudan VR rotasında hata: ${errors.join(' | ')}`)
  await page.close()
  console.log('/places/ulu-camii: sahne kendiliğinden açılır, iç mekân çizimi sürer.')
}

await browser.close()
