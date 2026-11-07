// Mekanlar sekmesi: harita → şehir → yapı → VR sayfası; içeriği olmayan yapı açılmaz, telefonda taşma olmaz.
// Gerçek harita: işaret eser sayfasını açar, liste ve işaret birbirini vurgular, harita internetsiz çalışır.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/vr-eserler.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const view = process.env.TEST_SCREENSHOT ?? 'test-results'
const browser = await chromium.launch({ channel: 'chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (k, m) => { if (!k) throw new Error(m) }
const ARTIFACT_COUNT = 10

async function ac(width, xr, option = {}) {
  const context = await browser.newContext({ viewport: { width: width, height: 800 }, ...option })
  if (xr) await context.addInitScript(() => { Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async () => true }, configurable: true }) })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  return { page, errors, context }
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const targetSize = async (page) => {
  for (const k of await page.locator('.vr-marker, .vr-proximity button').all()) {
    const b = await k.boundingBox()
    condition(b && b.width >= 44 && b.height >= 44, `dokunma hedefi küçük: ${JSON.stringify(b)}`)
  }
}
/** Her işaret kendi merkezinde en üstte olmalı: başka işaret veya düğme altında kalıp tıklanamaz olmasın. */
const clickable = (page) => page.evaluate(() => [...document.querySelectorAll('.vr-marker')].filter((el) => {
  const r = el.getBoundingClientRect()
  return !el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))
}).map((el) => el.getAttribute('aria-label')))

// Masaüstü, VR'sız: uyarı görünür, akış çalışır.
{
  const { page, errors } = await ac(1280, false)
  await page.goto(url)
  await page.getByRole('navigation', { name: 'Ana gezinme' }).getByRole('link', { name: 'Mekanlar' }).click()
  await page.getByRole('heading', { name: 'Mekanlar' }).waitFor()
  await page.getByText(/Bu tarayıcı VR açamıyor/).waitFor()
  await page.getByRole('img', { name: 'Türkiye haritası' }).waitFor()
  await page.locator('.vr-city', { hasText: 'Konya' }).waitFor()
  await page.locator('.vr-city', { hasText: 'Henüz VR yok' }).first().waitFor()
  await page.locator('.vr-map image').waitFor({ state: 'attached' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${view}/vr-turkey-1280.png` })
  await page.locator('.vr-city', { hasText: 'Bursa' }).click()
  await page.getByRole('heading', { name: 'Bursa' }).waitFor()
  await page.getByRole('img', { name: 'Bursa haritası' }).waitFor()
  condition(await page.locator('.vr-building-closed-state a').count() === 0, 'VR\'sız yapı bağlantı olmuş')
  await page.getByText(/OpenStreetMap katkıda bulunanlar/).waitFor()
  condition(await page.locator('a.vr-marker').count() === ARTIFACT_COUNT, 'her eserin işareti yok')
  await targetSize(page)
  const cloak = await clickable(page)
  condition(!cloak.length, `üstü örtülü işaret: ${cloak.join(', ')}`)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${view}/vr-bursa-1280.png` })

  // Liste → işaret vurgusu
  await page.locator('.vr-buildings a', { hasText: 'Emir Sultan' }).hover()
  await page.locator('a.vr-marker[data-highlight][href="/artifact/emir-sultan"]').waitFor()
  await page.screenshot({ path: `${view}/vr-bursa-highlight-1280.png` })
  // İşaret → liste vurgusu
  await page.locator('a.vr-marker[href="/artifact/ulu-mosque"]').hover()
  await page.locator('.vr-buildings a[data-highlight]', { hasText: 'Ulu Camii' }).waitFor()

  // Yakınlaşınca da işaret tıklanır, sürükleme harita kaydırır.
  await page.getByRole('button', { name: 'Yakınlaştır' }).click()
  await page.getByRole('button', { name: 'Yakınlaştır' }).click()
  await page.getByRole('button', { name: 'Yakınlaştır' }).click()
  const once = await page.locator('.vr-map > svg').first().getAttribute('viewBox')
  const box = await page.locator('.vr-map').boundingBox()
  await page.mouse.move(box.x + 40, box.y + box.height - 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 140, box.y + box.height - 90, { steps: 4 })
  await page.mouse.up()
  condition(once !== await page.locator('.vr-map > svg').first().getAttribute('viewBox'), 'sürükleme haritayı kaydırmadı')
  await page.screenshot({ path: `${view}/vr-bursa-near-1280.png` })

  // Gerçek tıklama: işaret → eser sayfası
  await page.locator('a.vr-marker[href="/artifact/yesil-complex"]').click()
  await page.waitForURL(/\/eser\/yesil-kulliyesi$/)
  await page.goBack()
  await page.locator('a.vr-marker').first().waitFor()

  // Klavye: odaklan, Enter ile aç
  await page.locator('a.vr-marker[href="/artifact/ulu-mosque"]').focus()
  await page.locator('.vr-buildings a[data-highlight]', { hasText: 'Ulu Camii' }).waitFor()
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/eser\/ulu-camii$/)
  await page.goBack()

  // Liste akışı: VR sayfası
  await page.locator('.vr-buildings').getByRole('link', { name: /^Ulu Camii/ }).click()
  await page.waitForURL(/\/vr\/ulu-camii$/)
  await page.locator('.model-area canvas').waitFor({ timeout: 120000 })
  condition(await page.getByRole('button', { name: "VR'da aç" }).count() === 0, 'VR\'sız tarayıcıda VR düğmesi görünüyor')
  await page.getByRole('link', { name: /Bursa yapıları/ }).click()
  await page.getByRole('heading', { name: 'Bursa' }).waitFor()
  await page.getByRole('button', { name: /Haritaya dön/ }).click()
  await page.locator('.vr-city', { hasText: 'Konya' }).click()
  await page.getByText(/henüz VR içeriği yok/).waitFor()
  await page.getByRole('img', { name: 'Konya haritası' }).waitFor()
  condition(await page.locator('a.vr-marker').count() === 0, 'Konya\'da olmayan yapı işaretlenmiş')
  await page.locator('.vr-map-not', { hasText: 'Henüz VR yok' }).waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${view}/vr-konya-1280.png` })
  await page.goto(`${url}/vr?city=Hatay`)
  await page.getByRole('img', { name: 'Hatay haritası' }).waitFor()
  condition(await page.locator('a.vr-marker').count() === 0, 'Hatay\'da olmayan yapı işaretlenmiş')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${view}/vr-hatay-1280.png` })
  condition(await overflow(page) <= 0, '1280 yatay taşma')
  condition(!errors.length, errors.join(' | '))
  await page.close()
}

// VR destekli tarayıcı: maket ve çini düğmeleri görünür.
{
  const { page, errors } = await ac(1280, true)
  await page.goto(`${url}/vr/ulu-mosque`)
  await page.getByRole('button', { name: "VR'da aç" }).waitFor({ timeout: 120000 })
  await page.goto(`${url}/vr/muradiye-complex`)
  await page.getByRole('button', { name: "VR'da onar" }).waitFor({ timeout: 30000 })
  condition(!errors.length, errors.join(' | '))
  await page.close()
}

// Telefon: dokunma, 44 px hedef, yatay taşma yok.
{
  const { page } = await ac(360, false, { hasTouch: true, isMobile: true })
  await page.goto(`${url}/vr`)
  await page.getByRole('img', { name: 'Türkiye haritası' }).waitFor()
  await page.waitForTimeout(500)
  condition(await overflow(page) <= 0, 'Türkiye 360 yatay taşma')
  await page.screenshot({ path: `${view}/vr-turkey-360.png` })
  await page.locator('.vr-city', { hasText: 'Bursa' }).tap()
  await page.getByRole('heading', { name: 'Bursa' }).waitFor()
  await page.locator('a.vr-marker').first().waitFor()
  await page.waitForTimeout(600)
  const diff = await overflow(page)
  condition(diff <= 0, `yatay taşma: ${diff}px`)
  await targetSize(page)
  const cloak = await clickable(page)
  condition(!cloak.length, `360 üstü örtülü işaret: ${cloak.join(', ')}`)
  await page.screenshot({ path: `${view}/vr-bursa-360.png`, fullPage: true })
  await page.locator('a.vr-marker[href="/artifact/orhan-bey-complex"]').tap()
  await page.waitForURL(/\/eser\/orhan-bey-kulliyesi$/)
  await page.close()
}

// İnternetsiz: yalnız sitenin kendi adresine istek gider, harita yine açılır.
{
  const { page, context } = await ac(1280, false)
  const outer = []
  await context.route('**/*', (r) => {
    if (new URL(r.request().url()).origin === new URL(url).origin) return r.continue()
    outer.push(r.request().url())
    return r.abort()
  })
  await page.goto(`${url}/vr?city=Bursa`)
  await page.getByRole('img', { name: 'Bursa haritası' }).waitFor()
  await page.locator('a.vr-marker').first().waitFor()
  condition(!outer.filter((a) => /tile|openstreetmap|amazonaws/.test(a)).length, `harita dış istek yaptı: ${outer.join(', ')}`)
  await page.close()
}

// Tembel yükleme: harita verisi yalnız Mekanlar açılınca iner.
{
  const { page } = await ac(1280, false)
  const request = []
  page.on('request', (r) => request.push(r.url()))
  await page.goto(url)
  await page.getByRole('heading').first().waitFor()
  await page.waitForLoadState('networkidle')
  condition(!request.some((a) => /kabartma|\/(turkiye|bursa|konya|hatay)-[^/]*\.js/.test(a)), `ana sayfa harita verisi indirdi: ${request.filter((a) => /kabartma/.test(a)).join(', ')}`)
  await page.close()
}

await browser.close()
console.log('Mekanlar: harita, işaret, liste vurgusu, klavye, dokunma, kapalı şehir, internetsiz ve telefon görünümü geçti.')
