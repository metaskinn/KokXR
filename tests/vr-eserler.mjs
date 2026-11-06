// VR Eserler sekmesi: harita → şehir → yapı → VR sayfası; içeriği olmayan yapı açılmaz, telefonda taşma olmaz.
// Gerçek harita: işaret eser sayfasını açar, liste ve işaret birbirini vurgular, harita internetsiz çalışır.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/vr-eserler.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const goruntu = process.env.TEST_GORUNTU ?? 'test-sonuclari'
const tarayici = await chromium.launch({ channel: 'chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (k, m) => { if (!k) throw new Error(m) }
const ESER_SAYISI = 10

async function ac(genislik, xr, secenek = {}) {
  const baglam = await tarayici.newContext({ viewport: { width: genislik, height: 800 }, ...secenek })
  if (xr) await baglam.addInitScript(() => { Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async () => true }, configurable: true }) })
  const sayfa = await baglam.newPage()
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  return { sayfa, hatalar, baglam }
}
const tasma = (sayfa) => sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const hedefOlcusu = async (sayfa) => {
  for (const k of await sayfa.locator('.vr-isaret, .vr-yakinlik button').all()) {
    const b = await k.boundingBox()
    sart(b && b.width >= 44 && b.height >= 44, `dokunma hedefi küçük: ${JSON.stringify(b)}`)
  }
}
/** Her işaret kendi merkezinde en üstte olmalı: başka işaret veya düğme altında kalıp tıklanamaz olmasın. */
const tiklanabilir = (sayfa) => sayfa.evaluate(() => [...document.querySelectorAll('.vr-isaret')].filter((el) => {
  const r = el.getBoundingClientRect()
  return !el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))
}).map((el) => el.getAttribute('aria-label')))

// Masaüstü, VR'sız: uyarı görünür, akış çalışır.
{
  const { sayfa, hatalar } = await ac(1280, false)
  await sayfa.goto(url)
  await sayfa.getByRole('link', { name: 'VR Eserler' }).click()
  await sayfa.getByRole('heading', { name: 'VR Eserler' }).waitFor()
  await sayfa.getByText(/Bu tarayıcı VR açamıyor/).waitFor()
  await sayfa.getByRole('img', { name: 'Türkiye haritası' }).waitFor()
  await sayfa.locator('.vr-sehir', { hasText: 'Konya' }).waitFor()
  await sayfa.locator('.vr-sehir', { hasText: 'Henüz VR yok' }).first().waitFor()
  await sayfa.locator('.vr-harita image').waitFor({ state: 'attached' })
  await sayfa.waitForTimeout(500)
  await sayfa.screenshot({ path: `${goruntu}/vr-turkiye-1280.png` })
  await sayfa.locator('.vr-sehir', { hasText: 'Bursa' }).click()
  await sayfa.getByRole('heading', { name: 'Bursa' }).waitFor()
  await sayfa.getByRole('img', { name: 'Bursa haritası' }).waitFor()
  sart(await sayfa.locator('.vr-yapi-kapali a').count() === 0, 'VR\'sız yapı bağlantı olmuş')
  await sayfa.getByText(/OpenStreetMap katkıda bulunanlar/).waitFor()
  sart(await sayfa.locator('a.vr-isaret').count() === ESER_SAYISI, 'her eserin işareti yok')
  await hedefOlcusu(sayfa)
  const ortu = await tiklanabilir(sayfa)
  sart(!ortu.length, `üstü örtülü işaret: ${ortu.join(', ')}`)
  await sayfa.waitForTimeout(500)
  await sayfa.screenshot({ path: `${goruntu}/vr-bursa-1280.png` })

  // Liste → işaret vurgusu
  await sayfa.locator('.vr-yapilar a', { hasText: 'Emir Sultan' }).hover()
  await sayfa.locator('a.vr-isaret[data-vurgu][href="/eser/emir-sultan"]').waitFor()
  await sayfa.screenshot({ path: `${goruntu}/vr-bursa-vurgu-1280.png` })
  // İşaret → liste vurgusu
  await sayfa.locator('a.vr-isaret[href="/eser/ulu-camii"]').hover()
  await sayfa.locator('.vr-yapilar a[data-vurgu]', { hasText: 'Ulu Camii' }).waitFor()

  // Yakınlaşınca da işaret tıklanır, sürükleme harita kaydırır.
  await sayfa.getByRole('button', { name: 'Yakınlaştır' }).click()
  await sayfa.getByRole('button', { name: 'Yakınlaştır' }).click()
  await sayfa.getByRole('button', { name: 'Yakınlaştır' }).click()
  const once = await sayfa.locator('.vr-harita > svg').first().getAttribute('viewBox')
  const kutu = await sayfa.locator('.vr-harita').boundingBox()
  await sayfa.mouse.move(kutu.x + 40, kutu.y + kutu.height - 40)
  await sayfa.mouse.down()
  await sayfa.mouse.move(kutu.x + 140, kutu.y + kutu.height - 90, { steps: 4 })
  await sayfa.mouse.up()
  sart(once !== await sayfa.locator('.vr-harita > svg').first().getAttribute('viewBox'), 'sürükleme haritayı kaydırmadı')
  await sayfa.screenshot({ path: `${goruntu}/vr-bursa-yakin-1280.png` })

  // Gerçek tıklama: işaret → eser sayfası
  await sayfa.locator('a.vr-isaret[href="/eser/yesil-kulliyesi"]').click()
  await sayfa.waitForURL(/\/eser\/yesil-kulliyesi$/)
  await sayfa.goBack()
  await sayfa.locator('a.vr-isaret').first().waitFor()

  // Klavye: odaklan, Enter ile aç
  await sayfa.locator('a.vr-isaret[href="/eser/ulu-camii"]').focus()
  await sayfa.locator('.vr-yapilar a[data-vurgu]', { hasText: 'Ulu Camii' }).waitFor()
  await sayfa.keyboard.press('Enter')
  await sayfa.waitForURL(/\/eser\/ulu-camii$/)
  await sayfa.goBack()

  // Liste akışı: VR sayfası
  await sayfa.locator('.vr-yapilar').getByRole('link', { name: /^Ulu Camii/ }).click()
  await sayfa.waitForURL(/\/vr\/ulu-camii$/)
  await sayfa.locator('.maket-alan canvas').waitFor({ timeout: 120000 })
  sart(await sayfa.getByRole('button', { name: "VR'da aç" }).count() === 0, 'VR\'sız tarayıcıda VR düğmesi görünüyor')
  await sayfa.getByRole('link', { name: /Bursa yapıları/ }).click()
  await sayfa.getByRole('heading', { name: 'Bursa' }).waitFor()
  await sayfa.getByRole('button', { name: /Haritaya dön/ }).click()
  await sayfa.locator('.vr-sehir', { hasText: 'Konya' }).click()
  await sayfa.getByText(/henüz VR içeriği yok/).waitFor()
  await sayfa.getByRole('img', { name: 'Konya haritası' }).waitFor()
  sart(await sayfa.locator('a.vr-isaret').count() === 0, 'Konya\'da olmayan yapı işaretlenmiş')
  await sayfa.locator('.vr-harita-not', { hasText: 'Henüz VR yok' }).waitFor()
  await sayfa.waitForTimeout(400)
  await sayfa.screenshot({ path: `${goruntu}/vr-konya-1280.png` })
  await sayfa.goto(`${url}/vr?sehir=Hatay`)
  await sayfa.getByRole('img', { name: 'Hatay haritası' }).waitFor()
  sart(await sayfa.locator('a.vr-isaret').count() === 0, 'Hatay\'da olmayan yapı işaretlenmiş')
  await sayfa.waitForTimeout(400)
  await sayfa.screenshot({ path: `${goruntu}/vr-hatay-1280.png` })
  sart(await tasma(sayfa) <= 0, '1280 yatay taşma')
  sart(!hatalar.length, hatalar.join(' | '))
  await sayfa.close()
}

// VR destekli tarayıcı: maket ve çini düğmeleri görünür.
{
  const { sayfa, hatalar } = await ac(1280, true)
  await sayfa.goto(`${url}/vr/ulu-camii`)
  await sayfa.getByRole('button', { name: "VR'da aç" }).waitFor({ timeout: 120000 })
  await sayfa.goto(`${url}/vr/muradiye-kulliyesi`)
  await sayfa.getByRole('button', { name: "VR'da onar" }).waitFor({ timeout: 30000 })
  sart(!hatalar.length, hatalar.join(' | '))
  await sayfa.close()
}

// Telefon: dokunma, 44 px hedef, yatay taşma yok.
{
  const { sayfa } = await ac(360, false, { hasTouch: true, isMobile: true })
  await sayfa.goto(`${url}/vr`)
  await sayfa.getByRole('img', { name: 'Türkiye haritası' }).waitFor()
  await sayfa.waitForTimeout(500)
  sart(await tasma(sayfa) <= 0, 'Türkiye 360 yatay taşma')
  await sayfa.screenshot({ path: `${goruntu}/vr-turkiye-360.png` })
  await sayfa.locator('.vr-sehir', { hasText: 'Bursa' }).tap()
  await sayfa.getByRole('heading', { name: 'Bursa' }).waitFor()
  await sayfa.locator('a.vr-isaret').first().waitFor()
  await sayfa.waitForTimeout(600)
  const fark = await tasma(sayfa)
  sart(fark <= 0, `yatay taşma: ${fark}px`)
  await hedefOlcusu(sayfa)
  const ortu = await tiklanabilir(sayfa)
  sart(!ortu.length, `360 üstü örtülü işaret: ${ortu.join(', ')}`)
  await sayfa.screenshot({ path: `${goruntu}/vr-bursa-360.png`, fullPage: true })
  await sayfa.locator('a.vr-isaret[href="/eser/orhan-bey-kulliyesi"]').tap()
  await sayfa.waitForURL(/\/eser\/orhan-bey-kulliyesi$/)
  await sayfa.close()
}

// İnternetsiz: yalnız sitenin kendi adresine istek gider, harita yine açılır.
{
  const { sayfa, baglam } = await ac(1280, false)
  const dis = []
  await baglam.route('**/*', (r) => {
    if (new URL(r.request().url()).origin === new URL(url).origin) return r.continue()
    dis.push(r.request().url())
    return r.abort()
  })
  await sayfa.goto(`${url}/vr?sehir=Bursa`)
  await sayfa.getByRole('img', { name: 'Bursa haritası' }).waitFor()
  await sayfa.locator('a.vr-isaret').first().waitFor()
  sart(!dis.filter((a) => /tile|openstreetmap|amazonaws/.test(a)).length, `harita dış istek yaptı: ${dis.join(', ')}`)
  await sayfa.close()
}

// Tembel yükleme: harita verisi yalnız VR Eserler açılınca iner.
{
  const { sayfa } = await ac(1280, false)
  const istek = []
  sayfa.on('request', (r) => istek.push(r.url()))
  await sayfa.goto(url)
  await sayfa.getByRole('heading').first().waitFor()
  await sayfa.waitForLoadState('networkidle')
  sart(!istek.some((a) => /kabartma|\/(turkiye|bursa|konya|hatay)-[^/]*\.js/.test(a)), `ana sayfa harita verisi indirdi: ${istek.filter((a) => /kabartma/.test(a)).join(', ')}`)
  await sayfa.close()
}

await tarayici.close()
console.log('VR Eserler: harita, işaret, liste vurgusu, klavye, dokunma, kapalı şehir, internetsiz ve telefon görünümü geçti.')
