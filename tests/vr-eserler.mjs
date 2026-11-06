// VR Eserler sekmesi: harita → şehir → yapı → VR sayfası; içeriği olmayan yapı açılmaz, telefonda taşma olmaz.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/vr-eserler.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (k, m) => { if (!k) throw new Error(m) }

async function ac(genislik, xr) {
  const baglam = await tarayici.newContext({ viewport: { width: genislik, height: 800 } })
  if (xr) await baglam.addInitScript(() => { Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async () => true }, configurable: true }) })
  const sayfa = await baglam.newPage()
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  return { sayfa, hatalar }
}

// Masaüstü, VR'sız: uyarı görünür, akış çalışır.
{
  const { sayfa, hatalar } = await ac(1280, false)
  await sayfa.goto(url)
  await sayfa.getByRole('link', { name: 'VR Eserler' }).click()
  await sayfa.getByRole('heading', { name: 'VR Eserler' }).waitFor()
  await sayfa.getByText(/Bu tarayıcı VR açamıyor/).waitFor()
  await sayfa.getByRole('img', { name: 'Türkiye haritası' }).waitFor()
  await sayfa.locator('.vr-sehir', { hasText: 'Bursa' }).click()
  await sayfa.getByRole('heading', { name: 'Bursa' }).waitFor()
  sart(await sayfa.locator('.vr-yapi-kapali', { hasText: 'Orhan Bey Külliyesi' }).count() === 1, 'VR\'sız yapı kapalı görünmüyor')
  sart(await sayfa.getByRole('link', { name: /Orhan Bey/ }).count() === 0, 'VR\'sız yapı bağlantı olmuş')
  await sayfa.waitForTimeout(900)
  await sayfa.screenshot({ path: 'test-sonuclari/vr-bursa-1280.png' })
  await sayfa.getByRole('link', { name: /^Ulu Camii/ }).click()
  await sayfa.waitForURL(/\/vr\/ulu-camii$/)
  await sayfa.locator('.maket-alan canvas').waitFor({ timeout: 120000 })
  sart(await sayfa.getByRole('button', { name: "VR'da aç" }).count() === 0, 'VR\'sız tarayıcıda VR düğmesi görünüyor')
  await sayfa.getByRole('link', { name: /Bursa yapıları/ }).click()
  await sayfa.getByRole('heading', { name: 'Bursa' }).waitFor()
  await sayfa.getByRole('button', { name: /Haritaya dön/ }).click()
  await sayfa.locator('.vr-sehir', { hasText: 'Konya' }).click()
  await sayfa.getByText(/henüz VR içeriği yok/).waitFor()
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

// Telefon: yatay taşma yok.
{
  const { sayfa } = await ac(360, false)
  await sayfa.goto(`${url}/vr?sehir=Bursa`)
  await sayfa.getByRole('heading', { name: 'Bursa' }).waitFor()
  await sayfa.waitForTimeout(900)
  const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  sart(tasma <= 0, `yatay taşma: ${tasma}px`)
  await sayfa.screenshot({ path: 'test-sonuclari/vr-bursa-360.png' })
  await sayfa.close()
}

await tarayici.close()
console.log('VR Eserler: harita, şehir, yapı, VR sayfası, kapalı yapı ve telefon görünümü geçti.')
