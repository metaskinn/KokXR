// Yolculuk: tek giriş, adımlar, klavye, odak, geri tuşu, dar ekran.
// Çalıştırma: node scripts/test-tarayici.mjs yolculuk (önce npm run build)
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const SURE = 120000
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (kosul, mesaj) => { if (!kosul) throw new Error(mesaj) }

for (const genislik of [1280, 360, 320]) {
  const sayfa = await tarayici.newPage({ viewport: { width: genislik, height: 800 } })
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  sayfa.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) hatalar.push(m.text()) })
  const tasmaYok = async (ad) => {
    const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    sart(tasma <= 0, `${genislik}px ${ad}: ${tasma}px yatay taşma`)
  }
  const odakBaslikta = async (metin) => {
    await sayfa.waitForFunction((m) => document.activeElement?.tagName === 'H2' && document.activeElement.textContent.includes(m), metin, { timeout: SURE })
  }

  // Ana sayfadan tek giriş
  await sayfa.goto(url)
  await sayfa.getByRole('link', { name: /Yolculuğa başla/ }).click()
  await sayfa.getByRole('heading', { level: 1, name: /yolculuğu/ }).waitFor({ timeout: SURE })
  sart(await sayfa.getByRole('link', { name: 'Yolculuk', exact: true }).getAttribute('aria-current') === 'page', 'menüde Yolculuk etkin değil')
  const adimlar = sayfa.getByRole('navigation', { name: 'Yolculuk adımları' }).getByRole('link')
  sart(await adimlar.count() === 4, 'dört adım yok')
  sart(await adimlar.nth(0).getAttribute('aria-current') === 'step', 'ilk adım etkin değil')
  for (const y of await adimlar.evaluateAll((l) => l.map((a) => a.getBoundingClientRect().height))) sart(y >= 44, `adım hedefi ${y}px`)
  await sayfa.getByRole('button', { name: /maketini eline al/ }).waitFor({ timeout: SURE })
  await tasmaYok('adım 1')

  // İleri düğmesi klavyeyle; odak yeni başlığa geçer
  await sayfa.getByRole('link', { name: /Sonraki: Zamanda yürü/ }).focus()
  await sayfa.keyboard.press('Enter')
  await odakBaslikta('Adım 2 / 4')
  sart(await sayfa.title() === 'Zamanda yürü · Yolculuk · KökXR', 'sekme başlığı değişmedi')
  sart(await sayfa.getByText('Kaynak', { exact: false }).count(), 'adım 2 kaynak göstermiyor')
  sart(await sayfa.getByRole('slider').count() === 1, 'adım 2 zaman kaydırıcısı yok')
  await tasmaYok('adım 2')

  // Atlamak serbest: 4. adıma doğrudan gidilir
  await adimlar.nth(3).click()
  await odakBaslikta('Adım 4 / 4')
  await sayfa.getByRole('heading', { name: 'Bilgini sına' }).waitFor({ timeout: SURE })
  await tasmaYok('adım 4')

  // Tarayıcının geri tuşu önceki adıma döner
  await sayfa.goBack()
  await odakBaslikta('Adım 2 / 4')

  // Onar: vazo sayfanın içinde, kendi h1'i ve geri bağlantısı yok, temsilî notu var
  await adimlar.nth(2).click()
  await odakBaslikta('Adım 3 / 4')
  await sayfa.locator('.vazo-atolyesi').waitFor({ timeout: SURE })
  sart(await sayfa.locator('h1').count() === 1, 'birden çok h1')
  sart(await sayfa.getByRole('link', { name: /Ana sayfaya dön/ }).count() === 1, 'yinelenen geri bağlantısı')
  sart(await sayfa.getByText('belirli bir tarihî eseri temsil etmez').count(), 'temsilî not yok')
  await tasmaYok('adım 3')

  // Geçersiz adım ilk adıma düşer, hata vermez
  await sayfa.goto(`${url}/yolculuk?adim=99`)
  await sayfa.getByRole('heading', { name: /Adım 1 \/ 4/ }).waitFor({ timeout: SURE })

  // Menü dar ekranda sığar, hedefler yeterli
  for (const y of await sayfa.getByRole('navigation', { name: 'Ana gezinme' }).getByRole('link').evaluateAll((l) => l.map((a) => a.getBoundingClientRect().height))) sart(y >= 44, `menü hedefi ${y}px`)
  await tasmaYok('menü')

  // Tüm ekranlara menüden gidilir; mokaplar etiketlidir, odak ana içeriğe geçer
  for (const [menu, baglanti, etiket] of [
    ['Ana gezinme', 'Öğretmen', 'Demo · örnek veri'],
    ['Diğer sayfalar', 'Kütüphane', null],
    ['Diğer sayfalar', 'Vizyon', 'Vizyon · henüz uygulanmadı'],
    ['Diğer sayfalar', 'Onay akışı', null],
  ]) {
    await sayfa.getByRole('navigation', { name: menu }).getByRole('link', { name: baglanti, exact: true }).click()
    await sayfa.waitForFunction(() => document.activeElement?.id === 'ana-icerik', null, { timeout: SURE })
    sart(await sayfa.locator('h1').count() === 1, `${baglanti}: h1 sayısı`)
    if (etiket) sart((await sayfa.locator('.demo-etiketi').first().textContent()) === etiket, `${baglanti}: etiket yok`)
    await tasmaYok(baglanti)
  }

  sart(!hatalar.length, `${genislik}px konsol hatası: ${hatalar.join(' | ')}`)
  if (process.env.EKRAN) await sayfa.screenshot({ path: `${process.env.EKRAN}/yolculuk-${genislik}.png` })
  await sayfa.close()
  console.log(`${genislik}px: giriş, adımlar, klavye, odak, geri tuşu, taşma ve hedef boyutu geçti.`)
}
await tarayici.close()
