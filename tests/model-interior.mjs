// Ulu Camii maketinin iç mekânı: klavyeyle yürüme, çarpışma, yaklaşınca açılan bilgi kartı, işaretler, temizlik.
// Çalıştırma: npm run build && npm run preview -- --port 4173, sonra node tests/maket-ic.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }

async function ac(width, height) {
  const page = await browser.newPage({ viewport: { width: width, height: height } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
  page.on('response', (r) => { if (r.url().includes('/images/ulu-mosque/model/') && r.status() !== 200) errors.push(`doku yüklenmedi: ${r.url()}`) })
  await page.goto(`${url}/artifact/ulu-mosque`)
  await page.getByRole('button', { name: /maketini eline al/ }).click()
  await page.locator('.model-area canvas').waitFor({ timeout: 30000 })
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'İçeri gir' }).click({ timeout: 30000 })
  return { page, errors }
}
const card = (page) => page.locator('.model-info-card')
const cardTitle = (page, title) => card(page).getByRole('heading', { name: title }).waitFor({ timeout: 60000 })
const position = async (page) => {
  const k = await page.locator('.model-area').getAttribute('data-position')
  return k ? k.split(',').map(Number) : null
}
const frame = async (page) => Number(await page.locator('.model-area').getAttribute('data-frame'))
/** Tuşu, konum art arda 8 kare boyunca değişmeyene dek basılı tutar (çarpışma varsa bir yerde durmalı).
 *  Süre değil kare sayılır: yazılımsal çizimde kare hızı çok düşüktür. */
async function toWall(page, keyBtn, maxMs = 200000) {
  await page.keyboard.down(keyBtn)
  const head = Date.now()
  let previous = await position(page), fixedFrame = await frame(page), stopped = false
  while (Date.now() - head < maxMs && !stopped) {
    await page.waitForTimeout(400)
    const now = await position(page), k = await frame(page)
    if (!now || !previous || now[0] !== previous[0] || now[1] !== previous[1]) { previous = now; fixedFrame = k }
    else stopped = k - fixedFrame >= 8
  }
  await page.keyboard.up(keyBtn)
  condition(stopped, `${keyBtn} ile yürürken durulmadı: ${previous}`)
  return previous
}

// --- Masaüstü: klavye ---
{
  const { page, errors } = await ac(1000, 700)
  await cardTitle(page, 'Giriş kapısı')
  condition(await card(page).getByText(/^Kaynak:/).count(), 'kartta kaynak satırı yok')
  condition(await page.evaluate(() => document.activeElement?.classList.contains('model-area')), 'içeri girince odak sahnede değil')

  // Kuzey girişten güneye yürü: korkuluk aralığından geçip havuzda durmalı (r 3.75 + 0.45, merkez z ≈ -6.9).
  const [x1, z1] = await toWall(page, 'w')
  condition(Math.abs(x1) < 0.5, `yürürken yana kayıldı: x=${x1}`)
  condition(z1 > -12 && z1 < -10.8, `havuzda durulmadı: z=${z1}`)
  await cardTitle(page, 'Şadırvan')
  await page.screenshot({ path: 'test-results/model-interior-fountain.png' })

  // Kapat: aynı alanda kaldıkça yeniden açılmamalı.
  await page.getByRole('button', { name: 'Bilgiyi kapat' }).click()
  await card(page).waitFor({ state: 'detached' })
  await page.waitForTimeout(1500)
  condition(!(await card(page).count()), 'kapatılan kart kendiliğinden açıldı')

  // Geri yürü ve yan yürü: duvar sınırını aşmamalı (iç duvar z = -25.5, oyuncu 0.45).
  const [, z2] = await toWall(page, 's')
  condition(z2 < z1 - 5, `geri yürünmedi: z=${z2}`)
  condition(z2 >= -25.06, `kuzey duvarı aşıldı: z=${z2}`)
  const [x3] = await toWall(page, 'd')
  condition(Math.abs(x3) > 5, `yana yürünmedi: x=${x3}`)
  condition(Math.abs(x3) <= 32.06, `yan duvar aşıldı: x=${x3}`)

  // Dönüş konumu değiştirmez, sonra ileri yürüyünce yön değişmiş olmalı.
  const [xd, zd] = await position(page)
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(1500)
  await page.keyboard.up('ArrowLeft')
  const [xd2, zd2] = await position(page)
  condition(xd === xd2 && zd === zd2, 'dönerken konum değişti')

  // Duraklar: her biri kendi kartını açar.
  for (const [stop, title] of [['Şadırvan', 'Şadırvan'], ['Mihrap', 'Mihrap'], ['Minber', 'Minber'], ['Doğu kapısı', 'Doğu kapısı'], ['Kâbe örtüsü', 'Kâbe kapısının örtüsü'], ['Levha', 'Hat levhaları'], ['Kubbe', 'Kubbeler'], ['Giriş', 'Giriş kapısı']]) {
    await page.getByRole('button', { name: stop, exact: true }).click()
    await cardTitle(page, title)
  }

  // Arkada kalan yapının işareti görünmemeli: doğu kapısına bakarken mihrap arkada kalır.
  await page.getByRole('button', { name: 'Doğu kapısı', exact: true }).click()
  await cardTitle(page, 'Doğu kapısı')
  await page.waitForFunction(() => {
    const k = document.querySelector('.model-area')?.dataset.frame
    return k && Number(k) > 0
  })
  await page.waitForTimeout(6000)
  condition(await page.locator('.model-marker[data-info="mihrab"]').isHidden(), 'arkadaki mihrap işareti görünüyor')

  // İşarete tıklayınca kart açılır; görünür bir işaret bulunmalı.
  await page.getByRole('button', { name: 'Şadırvan', exact: true }).click()
  const marker = page.locator('.model-marker[data-info="fountain"]')
  await marker.waitFor({ state: 'visible', timeout: 60000 })
  await cardTitle(page, 'Şadırvan')
  await page.getByRole('button', { name: 'Bilgiyi kapat' }).click()
  await card(page).waitFor({ state: 'detached', timeout: 30000 })
  await marker.dispatchEvent('click')
  await cardTitle(page, 'Şadırvan')
  await page.screenshot({ path: 'test-results/model-interior-marker.png' })

  // Dışarı çıkınca işaret ve kart kalmaz.
  await page.getByRole('button', { name: /Dışarı çık/ }).click()
  await card(page).waitFor({ state: 'detached', timeout: 30000 })
  condition(await page.locator('.model-markers').isHidden(), 'dışarıda işaretler görünüyor')

  // Rota değişince sahne temizlenir.
  await page.getByRole('link', { name: /Eserlere dön/ }).first().click()
  await page.waitForURL(`${url}/artifacts`)
  await page.locator('.model-area').waitFor({ state: 'detached', timeout: 30000 })
  condition(!(await page.locator('.model-markers').count()), 'işaret katmanı temizlenmedi')
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('1000px: yürüme, çarpışma, yaklaşınca kart, kapatma, duraklar, işaret, çıkış ve temizlik geçti.')
}

// --- Telefon: dokunarak işaret, taşma yok ---
{
  const { page, errors } = await ac(360, 760)
  await cardTitle(page, 'Giriş kapısı')
  await page.getByRole('button', { name: 'Şadırvan', exact: true }).click()
  await cardTitle(page, 'Şadırvan')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  condition(overflow <= 0, `yatay taşma: ${overflow}px`)
  const k = await card(page).boundingBox(), a = await page.locator('.model-area').boundingBox()
  condition(k.x >= a.x && k.x + k.width <= a.x + a.width + 1, 'kart sahneden taşıyor')
  await page.locator('.model-box').screenshot({ path: 'test-results/model-interior-360.png' })
  condition(!errors.length, `konsol hatası: ${errors.join(' | ')}`)
  await page.close()
  console.log('360px: duraktan kart, taşma yok, kart sahneye sığıyor.')
}

await browser.close()
