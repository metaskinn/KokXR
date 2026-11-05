// Kılıç atölyesi VR panelleri: tuvale çizilip düzleme giydirilir. Metin çağırandan gelir, burada tarihsel metin yazılmaz.
// ciz dokuyu yeniden yükler; yalnız içerik değişince çağrılır.
import * as T from 'three'
import { satirKir } from '../maket/xrMetin'
import { PANEL_G, PANEL_Y, panelKare, panelYerlesim } from './xrHesap'
import type { Kare, PanelDugme, PanelDurumu, bilgiDurumu } from './xrHesap'

// Atölye sayfasının renkleri (pages/kilic.css).
const ZEMIN = '#141b1c', YUZEY = '#283232', KENAR = '#5e655f', METIN = '#ede9e0', IKINCIL = '#adb6ae', ALTIN = '#d6b183', ALTIN_KOYU = '#3a2d1c', YESIL = '#a3c3ae', UYARI = '#f0a860'
const YAZI = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const YAN = 32, GEN = PANEL_G - 2 * YAN
export const PANEL_METRE = .8

function tuval(y: number) {
  const el = document.createElement('canvas'); el.width = PANEL_G; el.height = y
  const c = el.getContext('2d'); if (!c) throw new Error('Tuval kullanılamıyor')
  const doku = new T.CanvasTexture(el); doku.colorSpace = T.SRGBColorSpace; doku.anisotropy = 4
  const geometri = new T.PlaneGeometry(PANEL_METRE, PANEL_METRE * y / PANEL_G)
  // Paneller derinlik sınamasına girmez: ocağın veya tezgâhın önünde de okunur.
  const malzeme = new T.MeshBasicMaterial({ map: doku, toneMapped: false, transparent: true, depthTest: false, depthWrite: false, fog: false })
  const nesne = new T.Mesh(geometri, malzeme)
  return { c, doku, nesne, dispose: () => { doku.dispose(); malzeme.dispose(); geometri.dispose() } }
}

function satirlar(c: CanvasRenderingContext2D, metin: string, font: string, gen = GEN) {
  c.font = font
  return satirKir(metin, s => c.measureText(s).width, gen)
}

function cubuk(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, oran: number, renk: string) {
  c.fillStyle = YUZEY; c.fillRect(x, y, g, h)
  c.fillStyle = renk; c.fillRect(x, y, g * Math.max(0, Math.min(1, oran)), h)
}

function dugme(c: CanvasRenderingContext2D, k: Kare, oran?: number) {
  const b: PanelDugme = k.dugme
  c.beginPath(); c.roundRect(k.x, k.y, k.g, k.y2 - k.y, 8)
  c.fillStyle = b.secili ? ALTIN_KOYU : YUZEY; c.globalAlpha = b.pasif ? .45 : 1; c.fill()
  c.lineWidth = b.secili ? 4 : 2; c.strokeStyle = b.secili ? ALTIN : KENAR; c.stroke()
  if (oran !== undefined) { c.fillStyle = YESIL; c.fillRect(k.x + 4, k.y2 - 12, (k.g - 8) * Math.min(1, oran), 7) }
  c.fillStyle = METIN; c.font = `600 ${k.bolge ? 24 : 27}px ${YAZI}`; c.textAlign = 'center'; c.textBaseline = 'middle'
  c.fillText(b.ad, k.x + k.g / 2, (k.y + k.y2) / 2 - (oran !== undefined ? 3 : 0), k.g - 16)
  c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'top'
}

export function kontrolPaneli() {
  const { c, doku, nesne, dispose } = tuval(PANEL_Y)
  let kareler: Kare[] = []

  const ciz = (p: PanelDurumu) => {
    const yer = panelYerlesim(p); kareler = yer.kareler
    c.fillStyle = ZEMIN; c.fillRect(0, 0, PANEL_G, PANEL_Y)
    c.fillStyle = ALTIN; c.fillRect(0, 0, PANEL_G, 6)
    c.textAlign = 'left'; c.textBaseline = 'top'
    c.fillStyle = ALTIN; c.font = `600 22px ${YAZI}`; c.fillText(p.adim, YAN, 22)
    c.fillStyle = METIN; c.font = `700 46px ${YAZI}`; c.fillText(p.baslik, YAN, 52)
    let y = 112
    c.fillStyle = METIN
    for (const s of satirlar(c, p.yonerge, `400 30px ${YAZI}`).slice(0, 3)) { c.fillText(s, YAN, y); y += 37 }
    y += 6
    c.fillStyle = ALTIN
    for (const s of satirlar(c, p.mesaj, `400 26px ${YAZI}`).slice(0, 2)) { c.fillText(s, YAN, y); y += 32 }
    y += 8
    if (p.isi) {
      c.fillStyle = IKINCIL; c.font = `400 22px ${YAZI}`; c.fillText(`Çelik sıcaklığı · Oyun ölçeği · ${p.isi.aralik}`, YAN, y)
      c.fillStyle = METIN; c.font = `700 26px ${YAZI}`; c.textAlign = 'right'; c.fillText(`${p.isi.deger}°`, PANEL_G - YAN, y - 2); c.textAlign = 'left'
      cubuk(c, YAN, y + 30, GEN, 14, (p.isi.deger - 20) / 1180, p.isi.deger > 1150 ? UYARI : ALTIN); y += 58
    }
    if (p.ilerleme) {
      c.fillStyle = IKINCIL; c.font = `400 22px ${YAZI}`; c.fillText(p.ilerleme.metin, YAN, y)
      cubuk(c, YAN, y + 28, GEN, 8, p.ilerleme.oran, YESIL); y += 44
    }
    if (p.kalite) {
      c.fillStyle = IKINCIL; c.font = `600 22px ${YAZI}`; c.fillText('ESERİNİN KALİTESİ', YAN, y)
      c.fillStyle = METIN; c.font = `700 36px ${YAZI}`; c.textAlign = 'right'; c.fillText(`${p.kalite.puan}/100`, PANEL_G - YAN, y - 8); c.textAlign = 'left'
      const g = (GEN - 2 * 20) / 3
      p.kalite.olcu.forEach(([ad, v], i) => {
        const x = YAN + i * (g + 20)
        c.fillStyle = IKINCIL; c.font = `400 20px ${YAZI}`; c.fillText(ad, x, y + 34); cubuk(c, x, y + 60, g, 8, v, ALTIN)
      })
      c.fillStyle = p.kalite.notlar.some(n => n.includes('çatlak')) ? UYARI : ALTIN; c.font = `400 22px ${YAZI}`; c.fillText(p.kalite.notlar.join(' · '), YAN, y + 76, GEN)
      y += 116
    }
    for (const k of kareler) {
      const i = k.bolge ? Number(k.id.slice(6)) : -1
      if (p.bolgeler && i >= 0) k.dugme = { ...k.dugme, secili: p.bolgeler.secili === i }
      dugme(c, k, p.bolgeler && i >= 0 ? p.bolgeler.oran[i] : undefined)
    }
    doku.needsUpdate = true
  }

  return { nesne, ciz, kare: (u: number, v: number) => panelKare(kareler, u, v), kareler: () => kareler, dispose }
}

export const BILGI_Y = 490

export function bilgiPaneli() {
  const { c, doku, nesne, dispose } = tuval(BILGI_Y)
  const ciz = (b: ReturnType<typeof bilgiDurumu>) => {
    c.fillStyle = ZEMIN; c.fillRect(0, 0, PANEL_G, BILGI_Y)
    c.textAlign = 'left'; c.textBaseline = 'top'
    // Dürüstlük notu alta yaslıdır, her boyutta sabit; üstte kalan yere kaynaklı not sığdırılır, metin kesilmez.
    const nFont = `400 25px ${YAZI}`, nSatir = satirlar(c, b.durustluk, nFont), nUst = BILGI_Y - 18 - nSatir.length * 31
    c.fillStyle = ALTIN; c.fillRect(YAN, nUst - 46, GEN, 2)
    c.font = `600 21px ${YAZI}`; c.fillText(b.durustlukBaslik, YAN, nUst - 34)
    c.fillStyle = METIN; c.font = nFont; nSatir.forEach((s, i) => c.fillText(s, YAN, nUst + i * 31))

    c.fillStyle = ALTIN; c.font = `600 24px ${YAZI}`; c.fillText(b.baslik.toLocaleUpperCase('tr'), YAN, 18)
    const ust = 54, alt = nUst - 56
    let boyut = 30, metin: string[] = [], kaynak: string[] = []
    for (; boyut >= 20; boyut -= 2) {
      metin = satirlar(c, b.metin, `400 ${boyut}px ${YAZI}`)
      kaynak = satirlar(c, b.kaynak, `400 ${boyut - 6}px ${YAZI}`)
      if (metin.length * boyut * 1.28 + kaynak.length * (boyut - 6) * 1.28 + 8 <= alt - ust) break
    }
    if (boyut < 20) boyut = 20
    let y = ust
    c.fillStyle = METIN; c.font = `400 ${boyut}px ${YAZI}`
    for (const s of metin) { c.fillText(s, YAN, y); y += boyut * 1.28 }
    y += 8
    c.fillStyle = IKINCIL; c.font = `400 ${boyut - 6}px ${YAZI}`
    for (const s of kaynak) { c.fillText(s, YAN, y); y += (boyut - 6) * 1.28 }
    doku.needsUpdate = true
  }
  return { nesne, ciz, dispose }
}
