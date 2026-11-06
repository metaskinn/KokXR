// VR menüsü ve bilgi kartı: tuvale çizilip düzleme giydirilir. Düzlem ölçüleri metredir.
// Görsel dil web kartıyla aynıdır (maket.css, .maket-bilgi-kart): koyu cam, yuvarlak köşe, ince altın vurgu.
// Kart metni çağırandan gelir; burada tarihsel metin yazılmaz.
import * as THREE from 'three'
import { MENU_BASLIK_ORANI, TEMSILI_ETIKET, menuIsabet, satirKir, type MenuOgesi } from './xrMetin'

// Okunan paneller yüksek çözünürlüktedir; sahnede çok sayıda duran küçük piller Quest belleği için düşük kalır.
const KESKIN_G = 2048, PIL_G = 1024
export const MENU_G = 0.7, KART_G = 0.66
const BASLIK_G = 0.85, BASLIK_Y = 130
const MENU_Y = 1680, KART_Y = 1520

const CAM_ZEMIN = 'rgba(18,30,26,0.92)', CAM_SATIR = 'rgba(247,245,239,0.1)', CAM_KENAR = 'rgba(247,245,239,0.22)'
const METIN = '#f7f5ef', IKINCIL = '#d6dcd5', ALTIN = '#f2c14e'
const YAZI = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Tuval, dokusu ve düzlemi: `metre` panelin genişliği, yükseklik tuval oranından gelir. */
function panel(metre: number, tuvalG: number, tuvalY: number) {
  const el = document.createElement('canvas')
  el.width = tuvalG
  el.height = tuvalY
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  const doku = new THREE.CanvasTexture(el)
  doku.colorSpace = THREE.SRGBColorSpace
  doku.anisotropy = 16
  doku.minFilter = THREE.LinearMipmapLinearFilter
  doku.generateMipmaps = true
  // Önceden çarpılmış alfa: köşe ve mipmap geçişlerinde koyu saçak oluşmaz.
  doku.premultiplyAlpha = true
  const geometri = new THREE.PlaneGeometry(metre, (metre * tuvalY) / tuvalG)
  // alphaTest: sahnedeki pillerin boş köşeleri derinliğe yazıp arkasını silmesin.
  const malzeme = new THREE.MeshBasicMaterial({ map: doku, toneMapped: false, transparent: true, premultipliedAlpha: true, alphaTest: 0.01 })
  const nesne = new THREE.Mesh(geometri, malzeme)
  const dispose = () => {
    doku.dispose()
    malzeme.dispose()
    geometri.dispose()
  }
  return { c, doku, nesne, dispose }
}

/** Koyu cam yüzey: yuvarlak köşe ve ince açık kenar. */
function camYuzey(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, r: number, kenar: number) {
  c.beginPath()
  c.roundRect(x + kenar / 2, y + kenar / 2, g - kenar, h - kenar, r)
  c.fillStyle = CAM_ZEMIN
  c.fill()
  c.lineWidth = kenar
  c.strokeStyle = CAM_KENAR
  c.stroke()
}

/** Ortalanmış tek satır: sığmazsa yatayda sıkışır, taşmaz. */
function ortali(c: CanvasRenderingContext2D, yazi: string, x: number, y: number, boyut: number, agirlik: number, renk: string, enFazla: number) {
  c.fillStyle = renk
  c.font = `${agirlik} ${boyut}px ${YAZI}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(yazi, x, y, enFazla)
}

/** Temsilî etiketi: oturum boyunca görünür, menü ve kart kapalıyken de kalır. */
export function etiketPaneli() {
  const yukseklik = 130
  const { c, doku, nesne, dispose } = panel(0.72, PIL_G, yukseklik)
  camYuzey(c, 0, 0, PIL_G, yukseklik, 36, 3)
  ortali(c, TEMSILI_ETIKET, PIL_G / 2, 39, 32, 600, ALTIN, PIL_G - 80)
  ortali(c, 'Menü: Y / B · Sol çubuk: yürü · Sağ çubuk: dön', PIL_G / 2, 91, 30, 500, METIN, PIL_G - 60)
  doku.needsUpdate = true
  return { nesne, dispose }
}

/** Bilgi başlığı: yalnız ad yazar, metin kartta açılır. Pil, yazının genişliğine oturur. */
export function baslikPaneli(baslik: string) {
  const { c, doku, nesne, dispose } = panel(BASLIK_G, PIL_G, BASLIK_Y)
  c.font = `700 68px ${YAZI}`
  const g = Math.min(PIL_G - 8, c.measureText(baslik).width + 120)
  camYuzey(c, (PIL_G - g) / 2, 4, g, BASLIK_Y - 8, (BASLIK_Y - 8) / 2, 4)
  ortali(c, baslik, PIL_G / 2, BASLIK_Y / 2, 68, 700, METIN, g - 72)
  doku.needsUpdate = true
  return { nesne, dispose }
}

/** Birleştirme durumu: başa bağlıdır, yalnız durum değişince çizilir. */
export function birlesimPaneli() {
  const yukseklik = 190
  const { c, doku, nesne, dispose } = panel(0.6, PIL_G, yukseklik)
  const ciz = ({ ust, mesaj, not }: { ust: string; mesaj: string; not: string }) => {
    c.clearRect(0, 0, PIL_G, yukseklik)
    camYuzey(c, 0, 0, PIL_G, yukseklik, 28, 3)
    ortali(c, ust, PIL_G / 2, 42, 38, 700, ALTIN, PIL_G - 60)
    ortali(c, mesaj, PIL_G / 2, 102, 40, 600, METIN, PIL_G - 60)
    ortali(c, not, PIL_G / 2, 154, 30, 400, IKINCIL, PIL_G - 60)
    doku.needsUpdate = true
  }
  return { nesne, ciz, dispose }
}

export function xrPaneli() {
  const G = KESKIN_G
  const { c, doku, nesne, dispose } = panel(MENU_G, G, MENU_Y)
  const bandY = MENU_Y * MENU_BASLIK_ORANI
  let liste: MenuOgesi[] = []

  const ciz = (ogeler: MenuOgesi[]) => {
    liste = ogeler
    c.clearRect(0, 0, G, MENU_Y)
    camYuzey(c, 0, 0, G, MENU_Y, 56, 6)
    ortali(c, TEMSILI_ETIKET, G / 2, bandY / 2, 72, 600, ALTIN, G - 160)
    c.fillStyle = ALTIN
    c.fillRect(80, bandY - 4, G - 160, 4)
    // Satırlar gövdeyi eşit böler; isabet hesabı (menuIsabet) aynı bölmeyi kullanır.
    const satir = (MENU_Y - bandY) / Math.max(1, ogeler.length)
    const bosluk = Math.min(24, satir * 0.14)
    const boyut = Math.round(Math.max(68, Math.min(100, satir * 0.5)))
    ogeler.forEach((oge, i) => {
      const y = bandY + i * satir
      c.beginPath()
      c.roundRect(80, y + bosluk / 2, G - 160, satir - bosluk, 28)
      c.fillStyle = CAM_SATIR
      c.fill()
      ortali(c, oge.ad, G / 2, y + satir / 2, boyut, 600, METIN, G - 288)
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
  const G = KESKIN_G
  const { c, doku, nesne, dispose } = panel(KART_G, G, KART_Y)
  const YAN = 104, GEN = G - 2 * YAN
  const BASLIK = 92, BASLIK_UST = 72, CIZGI = BASLIK_UST + BASLIK + 32
  const UST = CIZGI + 44, ALT = KART_Y - 64, ARA = 56

  const goster = (k: { baslik: string; metin: string; kaynak: string }) => {
    c.clearRect(0, 0, G, KART_Y)
    c.textAlign = 'left'
    c.textBaseline = 'top'

    // Gövde 84 px; gerçek yazı tipi tahminden geniş çıkıp karta sığmazsa küçültülür, metin kesilmez.
    let boyut = 84
    let satirlar: string[] = [], kaynaklar: string[] = [], aralik = 0, kaynakAralik = 0
    for (; boyut >= 44; boyut -= 2) {
      c.font = `400 ${boyut}px ${YAZI}`
      satirlar = satirKir(k.metin, (s) => c.measureText(s).width, GEN)
      c.font = `400 ${Math.round(boyut * 0.78)}px ${YAZI}`
      kaynaklar = satirKir(k.kaynak, (s) => c.measureText(s).width, GEN)
      aralik = Math.round(boyut * 1.32)
      kaynakAralik = Math.round(boyut * 0.78 * 1.28)
      if (satirlar.length * aralik + ARA + kaynaklar.length * kaynakAralik <= ALT - UST) break
    }
    if (boyut < 44) boyut = 44

    // Cam, içeriğe göre kısalır: kısa metinde boş alan kalmaz. Düzlem aynı kalır, üstü hizalıdır.
    const kaynakUst = Math.min(ALT, UST + satirlar.length * aralik + ARA + kaynaklar.length * kaynakAralik) - kaynaklar.length * kaynakAralik
    camYuzey(c, 0, 0, G, Math.min(KART_Y, kaynakUst + kaynaklar.length * kaynakAralik + 64), 56, 6)
    c.font = `700 ${BASLIK}px ${YAZI}`
    c.fillStyle = METIN
    c.fillText(k.baslik, YAN, BASLIK_UST, GEN) // Sığmazsa yatayda sıkışır, taşmaz
    c.fillStyle = ALTIN
    c.fillRect(YAN, CIZGI, 168, 6)

    c.font = `400 ${boyut}px ${YAZI}`
    c.fillStyle = METIN
    satirlar.forEach((s, i) => c.fillText(s, YAN, UST + i * aralik))

    // Kaynak metnin altındadır; üstünde ince çizgi.
    c.fillStyle = CAM_KENAR
    c.fillRect(YAN, kaynakUst - ARA / 2, GEN, 3)
    c.font = `400 ${Math.round(boyut * 0.78)}px ${YAZI}`
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
