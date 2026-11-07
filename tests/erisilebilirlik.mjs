// Bağımlılıksız erişilebilirlik denetimi (axe/Lighthouse yerine): ana rotalarda normal, yüksek kontrast ve %150 yazı modunda
// görsel alt metni, adlandırılmış kontroller, etiketli form alanları, sayfa dili, başlık sırası, kontrast (WCAG 1.4.3) ve klavye odağı.
// Kullanım: önce npm run build, sonra node scripts/test-tarayici.mjs erisilebilirlik   (ayrıntı: ERISILEBILIRLIK_AYRINTI=1)
import { chromium } from 'playwright'

const URL_KOK = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const rotalar = ['/', '/harita', '/yolculuk', '/eser/ulu-camii', '/eser/koza-han', '/yonetim', '/yonetim/yeni', '/onay', '/ogretmen', '/vr']
const tarayici = await chromium.launch()
const sorunlar = []

const denetim = () => {
  const bul = []
  const ad = (e) => (e.getAttribute('aria-label') || [...(e.getAttribute('aria-labelledby') || '').split(' ')].map((i) => document.getElementById(i)?.textContent).join(' ') || e.textContent || e.getAttribute('title') || e.querySelector('img[alt]')?.getAttribute('alt') || '').trim()
  if (!document.documentElement.lang) bul.push('html lang yok')
  for (const i of document.images) if (!i.hasAttribute('alt')) bul.push(`görselde alt yok: ${i.getAttribute('src')}`)
  for (const e of document.querySelectorAll('button, a[href], [role=button]')) if (!ad(e)) bul.push(`adsız kontrol: ${e.outerHTML.slice(0, 80)}`)
  for (const e of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    const etiketli = e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby')
    if (!etiketli) bul.push(`etiketsiz alan: ${e.outerHTML.slice(0, 80)}`)
  }
  let onceki = 0
  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) { const s = +h.tagName[1]; if (onceki && s > onceki + 1) bul.push(`başlık atlaması h${onceki}→h${s}: ${h.textContent.trim().slice(0, 40)}`); onceki = s }
  const sayi = (c) => c.match(/[\d.]+/g).map(Number)
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const zemin = (e) => { for (let n = e; n; n = n.parentElement) { const c = sayi(getComputedStyle(n).backgroundColor); if (c.length < 4 || c[3] > 0.5) { if (c.length >= 3 && (c.length < 4 || c[3] > 0.5)) return c.slice(0, 3) } } return [255, 255, 255] }
  const dusuk = new Set()
  for (const e of document.querySelectorAll('main p, main li, main h1, main h2, main h3, main a, main button, main label, main span, nav a, footer a, footer p')) {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
    const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none' || e.closest('[aria-hidden=true]') || e.closest('canvas')) continue
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue
    if (st.backgroundImage !== 'none' || [...e.ancestors ?? []].length) { /* gradyan/görsel zeminler elle denetlenir */ }
    let ata = e, gorsel = false; while (ata) { if (getComputedStyle(ata).backgroundImage !== 'none') { gorsel = true; break } ata = ata.parentElement }
    if (gorsel) continue
    const f = sayi(st.color).slice(0, 3), b = zemin(e)
    const [a, k] = [lum(f), lum(b)].sort((x, y) => y - x)
    const oran = (a + 0.05) / (k + 0.05)
    const buyuk = parseFloat(st.fontSize) >= 24 || (parseFloat(st.fontSize) >= 18.66 && +st.fontWeight >= 700)
    if (oran < (buyuk ? 3 : 4.5)) dusuk.add(`${oran.toFixed(2)}:1 "${e.textContent.trim().slice(0, 30)}"`)
  }
  for (const d of dusuk) bul.push(`düşük kontrast ${d}`)
  return bul
}

for (const mod of ['normal', 'kontrast', 'yazi150']) {
  const baglam = await tarayici.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await baglam.newPage()
  await p.addInitScript((m) => {
    if (m === 'kontrast') localStorage.setItem('kokxr-erisilebilirlik', JSON.stringify({ boyut: 100, kontrast: true }))
    if (m === 'yazi150') localStorage.setItem('kokxr-erisilebilirlik', JSON.stringify({ boyut: 150, kontrast: false }))
  }, mod)
  for (const rota of rotalar) {
    await p.goto(URL_KOK + rota); await p.waitForTimeout(rota === '/harita' ? 1200 : 500)
    for (const b of await p.evaluate(denetim)) sorunlar.push(`[${mod}] ${rota}: ${b}`)
    if (mod === 'yazi150' && await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) sorunlar.push(`[${mod}] ${rota}: yatay taşma`)
    // Klavye: Tab ile ilerlerken odak göstergesi (outline veya box-shadow) olmalı.
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab')
    const odak = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'odak yok'; const s = getComputedStyle(e); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none' ? '' : 'odak göstergesi yok' })
    if (odak) sorunlar.push(`[${mod}] ${rota}: ${odak}`)
  }
  await baglam.close()
}
await tarayici.close()
if (sorunlar.length) { console.log(sorunlar.join('\n')); process.exit(1) }
console.log(`Erişilebilirlik: ${rotalar.length} rota × 3 mod (normal, yüksek kontrast, %150 yazı) temiz.`)
