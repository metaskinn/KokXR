// Ulu Camii maketinin iç mekânı: klavyeyle yürüme, çarpışma, yaklaşınca açılan bilgi kartı, işaretler, temizlik.
// Çalıştırma: npm run build && npm run preview -- --port 4173, sonra node tests/maket-ic.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (kosul, mesaj) => { if (!kosul) throw new Error(mesaj) }

async function ac(genislik, yukseklik) {
  const sayfa = await tarayici.newPage({ viewport: { width: genislik, height: yukseklik } })
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  sayfa.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) hatalar.push(m.text()) })
  sayfa.on('response', (r) => { if (r.url().includes('/gorseller/ulu-camii/maket/') && r.status() !== 200) hatalar.push(`doku yüklenmedi: ${r.url()}`) })
  await sayfa.goto(`${url}/eser/ulu-camii`)
  await sayfa.getByRole('button', { name: /maketini eline al/ }).click()
  await sayfa.locator('.maket-alan canvas').waitFor({ timeout: 30000 })
  await sayfa.locator('.maket-kutu').scrollIntoViewIfNeeded()
  await sayfa.getByRole('button', { name: 'İçeri gir' }).click({ timeout: 30000 })
  return { sayfa, hatalar }
}
const kart = (sayfa) => sayfa.locator('.maket-bilgi-kart')
const kartBasligi = (sayfa, baslik) => kart(sayfa).getByRole('heading', { name: baslik }).waitFor({ timeout: 60000 })
const konum = async (sayfa) => {
  const k = await sayfa.locator('.maket-alan').getAttribute('data-konum')
  return k ? k.split(',').map(Number) : null
}
const kare = async (sayfa) => Number(await sayfa.locator('.maket-alan').getAttribute('data-kare'))
/** Tuşu, konum art arda 8 kare boyunca değişmeyene dek basılı tutar (çarpışma varsa bir yerde durmalı).
 *  Süre değil kare sayılır: yazılımsal çizimde kare hızı çok düşüktür. */
async function duvaraKadar(sayfa, tus, enFazlaMs = 200000) {
  await sayfa.keyboard.down(tus)
  const bas = Date.now()
  let onceki = await konum(sayfa), sabitKare = await kare(sayfa), durdu = false
  while (Date.now() - bas < enFazlaMs && !durdu) {
    await sayfa.waitForTimeout(400)
    const simdi = await konum(sayfa), k = await kare(sayfa)
    if (!simdi || !onceki || simdi[0] !== onceki[0] || simdi[1] !== onceki[1]) { onceki = simdi; sabitKare = k }
    else durdu = k - sabitKare >= 8
  }
  await sayfa.keyboard.up(tus)
  sart(durdu, `${tus} ile yürürken durulmadı: ${onceki}`)
  return onceki
}

// --- Masaüstü: klavye ---
{
  const { sayfa, hatalar } = await ac(1000, 700)
  await kartBasligi(sayfa, 'Giriş kapısı')
  sart(await kart(sayfa).getByText(/^Kaynak:/).count(), 'kartta kaynak satırı yok')
  sart(await sayfa.evaluate(() => document.activeElement?.classList.contains('maket-alan')), 'içeri girince odak sahnede değil')

  // Kuzey girişten güneye yürü: korkuluk aralığından geçip havuzda durmalı (r 3.75 + 0.45, merkez z ≈ -6.9).
  const [x1, z1] = await duvaraKadar(sayfa, 'w')
  sart(Math.abs(x1) < 0.5, `yürürken yana kayıldı: x=${x1}`)
  sart(z1 > -12 && z1 < -10.8, `havuzda durulmadı: z=${z1}`)
  await kartBasligi(sayfa, 'Şadırvan')
  await sayfa.screenshot({ path: 'test-sonuclari/maket-ic-sadirvan.png' })

  // Kapat: aynı alanda kaldıkça yeniden açılmamalı.
  await sayfa.getByRole('button', { name: 'Bilgiyi kapat' }).click()
  await kart(sayfa).waitFor({ state: 'detached' })
  await sayfa.waitForTimeout(1500)
  sart(!(await kart(sayfa).count()), 'kapatılan kart kendiliğinden açıldı')

  // Geri yürü ve yan yürü: duvar sınırını aşmamalı (iç duvar z = -25.5, oyuncu 0.45).
  const [, z2] = await duvaraKadar(sayfa, 's')
  sart(z2 < z1 - 5, `geri yürünmedi: z=${z2}`)
  sart(z2 >= -25.06, `kuzey duvarı aşıldı: z=${z2}`)
  const [x3] = await duvaraKadar(sayfa, 'd')
  sart(Math.abs(x3) > 5, `yana yürünmedi: x=${x3}`)
  sart(Math.abs(x3) <= 32.06, `yan duvar aşıldı: x=${x3}`)

  // Dönüş konumu değiştirmez, sonra ileri yürüyünce yön değişmiş olmalı.
  const [xd, zd] = await konum(sayfa)
  await sayfa.keyboard.down('ArrowLeft')
  await sayfa.waitForTimeout(1500)
  await sayfa.keyboard.up('ArrowLeft')
  const [xd2, zd2] = await konum(sayfa)
  sart(xd === xd2 && zd === zd2, 'dönerken konum değişti')

  // Duraklar: her biri kendi kartını açar.
  for (const [durak, baslik] of [['Şadırvan', 'Şadırvan'], ['Mihrap', 'Mihrap'], ['Minber', 'Minber'], ['Doğu kapısı', 'Doğu kapısı'], ['Kâbe örtüsü', 'Kâbe kapısının örtüsü'], ['Levha', 'Hat levhaları'], ['Kubbe', 'Kubbeler'], ['Giriş', 'Giriş kapısı']]) {
    await sayfa.getByRole('button', { name: durak, exact: true }).click()
    await kartBasligi(sayfa, baslik)
  }

  // Arkada kalan yapının işareti görünmemeli: doğu kapısına bakarken mihrap arkada kalır.
  await sayfa.getByRole('button', { name: 'Doğu kapısı', exact: true }).click()
  await kartBasligi(sayfa, 'Doğu kapısı')
  await sayfa.waitForFunction(() => {
    const k = document.querySelector('.maket-alan')?.dataset.kare
    return k && Number(k) > 0
  })
  await sayfa.waitForTimeout(6000)
  sart(await sayfa.locator('.maket-isaret[data-bilgi="mihrap"]').isHidden(), 'arkadaki mihrap işareti görünüyor')

  // İşarete tıklayınca kart açılır; görünür bir işaret bulunmalı.
  await sayfa.getByRole('button', { name: 'Şadırvan', exact: true }).click()
  const isaret = sayfa.locator('.maket-isaret[data-bilgi="sadirvan"]')
  await isaret.waitFor({ state: 'visible', timeout: 60000 })
  await kartBasligi(sayfa, 'Şadırvan')
  await sayfa.getByRole('button', { name: 'Bilgiyi kapat' }).click()
  await kart(sayfa).waitFor({ state: 'detached', timeout: 30000 })
  await isaret.dispatchEvent('click')
  await kartBasligi(sayfa, 'Şadırvan')
  await sayfa.screenshot({ path: 'test-sonuclari/maket-ic-isaret.png' })

  // Dışarı çıkınca işaret ve kart kalmaz.
  await sayfa.getByRole('button', { name: /Dışarı çık/ }).click()
  await kart(sayfa).waitFor({ state: 'detached', timeout: 30000 })
  sart(await sayfa.locator('.maket-isaretler').isHidden(), 'dışarıda işaretler görünüyor')

  // Rota değişince sahne temizlenir.
  await sayfa.getByRole('link', { name: /Ana sayfaya dön/ }).first().click()
  await sayfa.waitForURL(`${url}/`)
  await sayfa.locator('.maket-alan').waitFor({ state: 'detached', timeout: 30000 })
  sart(!(await sayfa.locator('.maket-isaretler').count()), 'işaret katmanı temizlenmedi')
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('1000px: yürüme, çarpışma, yaklaşınca kart, kapatma, duraklar, işaret, çıkış ve temizlik geçti.')
}

// --- Telefon: dokunarak işaret, taşma yok ---
{
  const { sayfa, hatalar } = await ac(360, 760)
  await kartBasligi(sayfa, 'Giriş kapısı')
  await sayfa.getByRole('button', { name: 'Şadırvan', exact: true }).click()
  await kartBasligi(sayfa, 'Şadırvan')
  const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  sart(tasma <= 0, `yatay taşma: ${tasma}px`)
  const k = await kart(sayfa).boundingBox(), a = await sayfa.locator('.maket-alan').boundingBox()
  sart(k.x >= a.x && k.x + k.width <= a.x + a.width + 1, 'kart sahneden taşıyor')
  await sayfa.locator('.maket-kutu').screenshot({ path: 'test-sonuclari/maket-ic-360.png' })
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('360px: duraktan kart, taşma yok, kart sahneye sığıyor.')
}

await tarayici.close()
