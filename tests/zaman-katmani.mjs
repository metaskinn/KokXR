// Zaman Katmanı: slider, klavye, metin ve kaynak değişimi, 360 px, kaynaksız kayıtta gizlenme.
// Çalıştırma: npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
//             node tests/zaman-katmani.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (kosul, mesaj) => { if (!kosul) throw new Error(mesaj) }
const eserOku = (id) => JSON.parse(readFileSync(new URL(`../src/data/eserler/${id}.json`, import.meta.url), 'utf8'))
const kaynakMetni = (k) => `${k.metin}${k.sayfa ? `, s. ${k.sayfa}` : ''}`

async function sayfaAc(genislik, id, baslangic, arguman) {
  const sayfa = await tarayici.newPage({ viewport: { width: genislik, height: 800 } })
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  sayfa.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) hatalar.push(m.text()) })
  if (baslangic) await sayfa.addInitScript(baslangic, arguman)
  await sayfa.goto(`${url}/eser/${id}`)
  await sayfa.getByRole('heading', { level: 1 }).waitFor()
  return { sayfa, hatalar }
}

async function kartDenetle(sayfa, eser, sira) {
  const kayit = eser.zamanKatmani[sira]
  const kaynak = eser.kaynaklar.find((k) => k.id === kayit.kaynakId)
  sart(kaynak, `${kayit.id}: kaynak yok`)
  const kart = sayfa.locator('.zaman-kart')
  const metin = await kart.textContent()
  sart(metin.includes(kayit.metin), `${kayit.id}: metin görünmüyor`)
  sart(metin.includes(kayit.donem), `${kayit.id}: dönem görünmüyor`)
  const kaynakSatiri = await kart.locator('.kaynak').textContent()
  sart(kaynakSatiri === `Kaynak: ${kaynakMetni(kaynak)}`, `${kayit.id}: kaynak satırı yanlış: ${kaynakSatiri}`)
  const degerMetni = await sayfa.getByRole('slider', { name: 'Dönem seç' }).getAttribute('aria-valuetext')
  sart(degerMetni.includes(kayit.donem) && degerMetni.includes(kayit.baslik), `${kayit.id}: değer metni yanlış: ${degerMetni}`)
}

for (const id of ['ulu-camii', 'muradiye-kulliyesi']) {
  for (const genislik of [1280, 360]) {
    const eser = eserOku(id)
    const son = eser.zamanKatmani.length - 1
    const { sayfa, hatalar } = await sayfaAc(genislik, id)
    const kaydirici = sayfa.getByRole('slider', { name: 'Dönem seç' })
    await kaydirici.scrollIntoViewIfNeeded()
    sart(await kaydirici.isVisible(), `${id}/${genislik}: slider görünmüyor`)
    sart(await kaydirici.getAttribute('type') === 'range', `${id}: native range değil`)
    sart(await kaydirici.getAttribute('max') === String(son), `${id}: max yanlış`)
    await kartDenetle(sayfa, eser, 0)

    // Klavye: ok tuşları dönemler arasında bir adım gezer, uçlarda durur.
    const ilkKaynak = await sayfa.locator('.zaman-kart .kaynak').textContent()
    const ilkMetin = await sayfa.locator('.zaman-metin').textContent()
    await kaydirici.focus()
    await sayfa.keyboard.press('ArrowLeft')
    sart(await kaydirici.inputValue() === '0', `${id}: başta sola gidince değer değişti`)
    for (let sira = 1; sira <= son; sira++) {
      await sayfa.keyboard.press('ArrowRight')
      sart(await kaydirici.inputValue() === String(sira), `${id}: sağ ok ${sira}. adımda çalışmadı`)
      await kartDenetle(sayfa, eser, sira)
    }
    sart(await sayfa.locator('.zaman-metin').textContent() !== ilkMetin, `${id}: metin değişmedi`)
    await sayfa.keyboard.press('ArrowLeft')
    sart(await kaydirici.inputValue() === String(son - 1), `${id}: sol ok çalışmadı`)
    await kartDenetle(sayfa, eser, son - 1)

    // Kaynak değişimi: en az bir geçişte kaynak satırı ilk kayıttan farklı olmalı.
    const kaynakIdler = new Set(eser.zamanKatmani.map((k) => k.kaynakId))
    sart(kaynakIdler.size > 1, `${id}: tüm kayıtlar aynı kaynakta, kaynak değişimi sınanamaz`)
    const farkli = eser.zamanKatmani.findIndex((k) => k.kaynakId !== eser.zamanKatmani[0].kaynakId)
    await kaydirici.fill(String(farkli))
    await kartDenetle(sayfa, eser, farkli)
    sart(await sayfa.locator('.zaman-kart .kaynak').textContent() !== ilkKaynak, `${id}: kaynak satırı değişmedi`)

    sart(!(await sayfa.locator('.zaman-katmani .demo-etiketi').count()), `${id}: kaynaklı veride Demo etiketi var`)
    const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    sart(tasma <= 0, `${id}/${genislik}: yatay taşma ${tasma} px`)
    sart(!hatalar.length, `${id}/${genislik}: konsol hatası: ${hatalar.join(' | ')}`)
    await sayfa.close()
    console.log(`${id} ${genislik}px: ${son + 1} dönem, klavye, metin, kaynak, taşma ve konsol tamam.`)
  }
}

// İki kayıttan biri kaynağa bağlanmıyorsa kaynaklı dönem sayısı 1'e düşer, bileşen görünmez.
{
  const eser = eserOku('ulu-camii')
  eser.zamanKatmani = [eser.zamanKatmani[0], { ...eser.zamanKatmani[1], kaynakId: 'olmayan-kaynak' }]
  const { sayfa, hatalar } = await sayfaAc(1280, 'ulu-camii', (e) => {
    localStorage.setItem('kokxr-icerik', JSON.stringify({ [e.id]: e }))
  }, eser)
  sart(await sayfa.locator('.eser-baslik .etiket').count(), 'sayfa açılmadı')
  sart(!(await sayfa.locator('.zaman-katmani').count()), '1 kaynaklı dönemle bileşen görünüyor')
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('kaynaklı dönem < 2: bileşen görünmüyor.')
}

await tarayici.close()
console.log('zaman-katmani: tüm denetimler geçti.')
