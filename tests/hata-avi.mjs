// Tüm rotaları 1280 ve 360 pikselde açar: konsol hatası, kırık görsel, yatay taşma, sayfa isteği hatası listeler.
// Kullanım: önce npm run build, sonra node scripts/test-tarayici.mjs hata-avi
import { chromium } from 'playwright'
import { readdirSync } from 'node:fs'

const URL_KOK = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const eserIdleri = readdirSync('src/data/eserler').map((d) => d.replace('.json', ''))
const rotalar = ['/', '/yolculuk', '/ogretmen', '/vizyon', '/kutuphane', '/onay', '/vr', '/atolye/vazo', '/atolye/kilic', '/atolye/cini', '/yonetim', '/yonetim/yeni',
  ...eserIdleri.flatMap((id) => [`/eser/${id}`, `/vr/${id}`]), '/olmayan-sayfa']
const tarayici = await chromium.launch()
const sorunlar = []
for (const genislik of [1280, 360]) {
  const sayfa = await (await tarayici.newContext({ viewport: { width: genislik, height: 800 } })).newPage()
  let rota = ''
  const not = (tur, ayrinti) => sorunlar.push(`${genislik}px ${rota}: ${tur}: ${ayrinti}`)
  sayfa.on('console', (m) => { if (m.type() === 'error' && !/krpano|360tr/.test(m.text())) not('konsol', m.text().slice(0, 140)) })
  sayfa.on('pageerror', (e) => not('js hatası', e.message.slice(0, 140)))
  sayfa.on('response', (y) => { if (y.status() >= 400 && y.url().startsWith(URL_KOK)) not('http ' + y.status(), y.url()) })
  for (rota of rotalar) {
    await sayfa.goto(URL_KOK + rota)
    await sayfa.waitForTimeout(rota.startsWith('/vr/') || rota.startsWith('/atolye') ? 2500 : 700)
    await sayfa.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sayfa.waitForTimeout(300)
    const bilgi = await sayfa.evaluate(() => ({
      tasma: document.documentElement.scrollWidth > innerWidth,
      kirik: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      h1: document.querySelectorAll('h1').length,
    }))
    if (bilgi.tasma) not('yatay taşma', '')
    for (const k of bilgi.kirik) not('kırık görsel', k)
    if (bilgi.h1 !== 1) not('h1 sayısı', String(bilgi.h1))
  }
}
await tarayici.close()
if (sorunlar.length) { console.log(sorunlar.join('\n')); process.exit(1) }
console.log(`Hata avı: ${rotalar.length} rota, 1280 ve 360 pikselde temiz.`)
