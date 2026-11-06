// VR menüsü ve bilgi kartı: tuvale çizilip düzleme giydirilir. Düzlem ölçüleri metredir.
// Kart metni çağırandan gelir; burada tarihsel metin yazılmaz.
import * as THREE from 'three'
import { MENU_BASLIK_ORANI, TEMSILI_ETIKET, menuIsabet, satirKir, type MenuOgesi } from './xrMetin'

const TUVAL_G = 1024
export const MENU_G = 0.7, KART_G = 0.66
const BASLIK_G = 0.85, BASLIK_Y = 130
const MENU_Y = 840, KART_Y = 760

// docs/ui-tasarim.md paletinden
const ZEMIN = '#f8f5ef', YUZEY = '#ecefe7', CAM = '#244e40', METIN = '#253a34', IKINCIL = '#5c6358', BRONZ = '#8e6236', BEYAZ = '#ffffff'
const YAZI = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Tuval, dokusu ve düzlemi: `metre` panelin genişliği, yükseklik tuval oranından gelir. */
function panel(metre: number, tuvalY: number) {
  const el = document.createElement('canvas')
  el.width = TUVAL_G
  el.height = tuvalY
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  const doku = new THREE.CanvasTexture(el)
  doku.colorSpace = THREE.SRGBColorSpace
  doku.anisotropy = 8
  const geometri = new THREE.PlaneGeometry(metre, (metre * tuvalY) / TUVAL_G)
  const malzeme = new THREE.MeshBasicMaterial({ map: doku, toneMapped: false })
  const nesne = new THREE.Mesh(geometri, malzeme)
  const dispose = () => {
    doku.dispose()
    malzeme.dispose()
    geometri.dispose()
  }
  return { c, doku, nesne, dispose }
}

function band(c: CanvasRenderingContext2D, yukseklik: number, yazi: string, boyut: number) {
  c.fillStyle = BRONZ
  c.fillRect(0, 0, TUVAL_G, yukseklik)
  c.fillStyle = BEYAZ
  c.font = `700 ${boyut}px ${YAZI}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(yazi, TUVAL_G / 2, yukseklik / 2, TUVAL_G - 2 * 40) // Sığmazsa yatayda sıkışır, taşmaz
}

/** Temsilî etiketi: oturum boyunca görünür, menü ve kart kapalıyken de kalır. */
export function etiketPaneli() {
  const yukseklik = 72
  const { c, doku, nesne, dispose } = panel(0.6, yukseklik)
  band(c, yukseklik, TEMSILI_ETIKET, 40)
  doku.needsUpdate = true
  return { nesne, dispose }
}

/** Bilgi başlığı: yalnız ad yazar, metin kartta açılır. */
export function baslikPaneli(baslik: string) {
  const { c, doku, nesne, dispose } = panel(BASLIK_G, BASLIK_Y)
  c.fillStyle = CAM
  c.fillRect(0, 0, TUVAL_G, BASLIK_Y)
  c.fillStyle = BEYAZ
  c.font = `700 72px ${YAZI}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(baslik, TUVAL_G / 2, BASLIK_Y / 2, TUVAL_G - 2 * 40)
  doku.needsUpdate = true
  return { nesne, dispose }
}

/** Birleştirme durumu: başa bağlıdır, yalnız durum değişince çizilir. */
export function birlesimPaneli() {
  const yukseklik = 190
  const { c, doku, nesne, dispose } = panel(0.6, yukseklik)
  const ciz = ({ ust, mesaj, not }: { ust: string; mesaj: string; not: string }) => {
    c.fillStyle = ZEMIN
    c.fillRect(0, 0, TUVAL_G, yukseklik)
    band(c, 72, ust, 42)
    c.fillStyle = METIN
    c.font = `600 40px ${YAZI}`
    c.fillText(mesaj, TUVAL_G / 2, 106, TUVAL_G - 2 * 30)
    c.fillStyle = IKINCIL
    c.font = `400 30px ${YAZI}`
    c.fillText(not, TUVAL_G / 2, 160, TUVAL_G - 2 * 30)
    doku.needsUpdate = true
  }
  return { nesne, ciz, dispose }
}

export function xrPaneli() {
  const { c, doku, nesne, dispose } = panel(MENU_G, MENU_Y)
  const bandY = MENU_Y * MENU_BASLIK_ORANI
  let liste: MenuOgesi[] = []

  const ciz = (ogeler: MenuOgesi[]) => {
    liste = ogeler
    c.fillStyle = ZEMIN
    c.fillRect(0, 0, TUVAL_G, MENU_Y)
    band(c, bandY, TEMSILI_ETIKET, 36)
    // Satırlar gövdeyi eşit böler; isabet hesabı (menuIsabet) aynı bölmeyi kullanır.
    const satir = (MENU_Y - bandY) / Math.max(1, ogeler.length)
    const bosluk = Math.min(12, satir * 0.14)
    const boyut = Math.round(Math.max(34, Math.min(50, satir * 0.5)))
    c.font = `600 ${boyut}px ${YAZI}`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    ogeler.forEach((oge, i) => {
      const y = bandY + i * satir
      c.beginPath()
      c.roundRect(40, y + bosluk / 2, TUVAL_G - 80, satir - bosluk, 14)
      c.fillStyle = YUZEY
      c.fill()
      c.lineWidth = 3
      c.strokeStyle = CAM
      c.stroke()
      c.fillStyle = CAM
      c.fillText(oge.ad, TUVAL_G / 2, y + satir / 2, TUVAL_G - 2 * 72)
    })
    doku.needsUpdate = true
  }

  const isabet = (v: number) => {
    const i = menuIsabet(v, liste.length, MENU_BASLIK_ORANI)
    return i === null ? null : liste[i].id
  }

  ciz([])
  return { nesne, ciz, isabet, dispose }
}

export function bilgiPaneli() {
  const { c, doku, nesne, dispose } = panel(KART_G, KART_Y)
  const YAN = (TUVAL_G - 900) / 2 // 900 px satır genişliği
  const BANT = 104, UST = BANT + 28, ALT = KART_Y - 28, ARA = 24

  const goster = (k: { baslik: string; metin: string; kaynak: string }) => {
    c.fillStyle = ZEMIN
    c.fillRect(0, 0, TUVAL_G, KART_Y)
    band(c, BANT, k.baslik, 46)

    // Gövde 42 px (kart küçük olduğu için tuvalde iri yazılır); gerçek yazı tipi tahminden geniş çıkıp karta sığmazsa küçültülür, metin kesilmez.
    let boyut = 42
    let satirlar: string[] = [], kaynaklar: string[] = [], aralik = 0, kaynakAralik = 0
    for (; boyut >= 22; boyut -= 2) {
      c.font = `400 ${boyut}px ${YAZI}`
      satirlar = satirKir(k.metin, (s) => c.measureText(s).width, 900)
      c.font = `400 ${boyut - 4}px ${YAZI}`
      kaynaklar = satirKir(k.kaynak, (s) => c.measureText(s).width, 900)
      aralik = Math.round(boyut * 1.3)
      kaynakAralik = Math.round((boyut - 4) * 1.3)
      if (satirlar.length * aralik + ARA + kaynaklar.length * kaynakAralik <= ALT - UST) break
    }
    if (boyut < 22) boyut = 22

    c.textAlign = 'left'
    c.textBaseline = 'top'
    c.font = `400 ${boyut}px ${YAZI}`
    c.fillStyle = METIN
    satirlar.forEach((s, i) => c.fillText(s, YAN, UST + i * aralik))

    // Kaynak kartın altına yaslıdır; üstünde ince çizgi.
    const kaynakUst = ALT - kaynaklar.length * kaynakAralik
    c.fillStyle = BRONZ
    c.fillRect(YAN, kaynakUst - ARA / 2, 900, 2)
    c.font = `400 ${boyut - 4}px ${YAZI}`
    c.fillStyle = IKINCIL
    kaynaklar.forEach((s, i) => c.fillText(s, YAN, kaynakUst + i * kaynakAralik))

    doku.needsUpdate = true
    nesne.visible = true
  }

  const gizle = () => {
    nesne.visible = false
  }

  gizle()
  return { nesne, goster, gizle, dispose }
}
