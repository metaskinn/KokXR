// VR menüsü ve bilgi kartı: tuvale çizilip düzleme giydirilir. Düzlem ölçüleri metredir.
// Görsel dil web kartıyla aynıdır (maket.css, .model-info-card): koyu cam, yuvarlak köşe, ince altın vurgu.
// Kart metni çağırandan gelir; burada tarihsel metin yazılmaz.
import * as THREE from 'three'
import { MENU_TITLE_RATIO, ILLUSTRATIVE_LABEL, menuHit, wrapLine, type MenuItem } from './xrText'

// Okunan paneller yüksek çözünürlüktedir; sahnede çok sayıda duran küçük piller Quest belleği için düşük kalır.
const SHARP_G = 2048, PIL_G = 1024
export const MENU_G = 0.7, CARD_G = 0.66
const TITLE_G = 0.85, TITLE_Y = 130
const MENU_Y = 1680, CARD_Y = 1520

const GLASS_FLOOR = 'rgba(18,30,26,0.92)', GLASS_ROW = 'rgba(247,245,239,0.1)', GLASS_EDGE = 'rgba(247,245,239,0.22)'
const TEXT_ = '#f7f5ef', SECONDARY = '#d6dcd5', GOLD = '#f2c14e'
const TEXT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Tuval, dokusu ve düzlemi: `metre` panelin genişliği, yükseklik tuval oranından gelir. */
function panel(meter: number, canvasG: number, canvasY: number) {
  const el = document.createElement('canvas')
  el.width = canvasG
  el.height = canvasY
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  const texture = new THREE.CanvasTexture(el)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  // Önceden çarpılmış alfa: köşe ve mipmap geçişlerinde koyu saçak oluşmaz.
  texture.premultiplyAlpha = true
  const geometry = new THREE.PlaneGeometry(meter, (meter * canvasY) / canvasG)
  // alphaTest: sahnedeki pillerin boş köşeleri derinliğe yazıp arkasını silmesin.
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, premultipliedAlpha: true, alphaTest: 0.01 })
  const obj = new THREE.Mesh(geometry, material)
  const dispose = () => {
    texture.dispose()
    material.dispose()
    geometry.dispose()
  }
  return { c, texture, obj, dispose }
}

/** Koyu cam yüzey: yuvarlak köşe ve ince açık kenar. */
function glassSurface(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, r: number, edge: number) {
  c.beginPath()
  c.roundRect(x + edge / 2, y + edge / 2, g - edge, h - edge, r)
  c.fillStyle = GLASS_FLOOR
  c.fill()
  c.lineWidth = edge
  c.strokeStyle = GLASS_EDGE
  c.stroke()
}

/** Ortalanmış tek satır: sığmazsa yatayda sıkışır, taşmaz. */
function centered(c: CanvasRenderingContext2D, writing: string, x: number, y: number, size: number, weight: number, color: string, maxVal: number) {
  c.fillStyle = color
  c.font = `${weight} ${size}px ${TEXT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(writing, x, y, maxVal)
}

/** Temsilî etiketi: oturum boyunca görünür, menü ve kart kapalıyken de kalır. */
export function labelPanel() {
  const height = 130
  const { c, texture, obj, dispose } = panel(0.72, PIL_G, height)
  glassSurface(c, 0, 0, PIL_G, height, 36, 3)
  centered(c, ILLUSTRATIVE_LABEL, PIL_G / 2, 39, 32, 600, GOLD, PIL_G - 80)
  centered(c, 'Menü: Y / B · Sol çubuk: yürü · Sağ çubuk: dön', PIL_G / 2, 91, 30, 500, TEXT_, PIL_G - 60)
  texture.needsUpdate = true
  return { obj, dispose }
}

/** Bilgi başlığı: yalnız ad yazar, metin kartta açılır. Pil, yazının genişliğine oturur. */
export function titlePanel(title: string) {
  const { c, texture, obj, dispose } = panel(TITLE_G, PIL_G, TITLE_Y)
  c.font = `700 68px ${TEXT}`
  const g = Math.min(PIL_G - 8, c.measureText(title).width + 120)
  glassSurface(c, (PIL_G - g) / 2, 4, g, TITLE_Y - 8, (TITLE_Y - 8) / 2, 4)
  centered(c, title, PIL_G / 2, TITLE_Y / 2, 68, 700, TEXT_, g - 72)
  texture.needsUpdate = true
  return { obj, dispose }
}

/** Birleştirme durumu: başa bağlıdır, yalnız durum değişince çizilir. */
export function assemblyPanel() {
  const height = 190
  const { c, texture, obj, dispose } = panel(0.6, PIL_G, height)
  const draw = ({ top, message, not }: { top: string; message: string; not: string }) => {
    c.clearRect(0, 0, PIL_G, height)
    glassSurface(c, 0, 0, PIL_G, height, 28, 3)
    centered(c, top, PIL_G / 2, 42, 38, 700, GOLD, PIL_G - 60)
    centered(c, message, PIL_G / 2, 102, 40, 600, TEXT_, PIL_G - 60)
    centered(c, not, PIL_G / 2, 154, 30, 400, SECONDARY, PIL_G - 60)
    texture.needsUpdate = true
  }
  return { obj, draw, dispose }
}

export function xrPanel() {
  const G = SHARP_G
  const { c, texture, obj, dispose } = panel(MENU_G, G, MENU_Y)
  const bandY = MENU_Y * MENU_TITLE_RATIO
  let list: MenuItem[] = []

  const draw = (items: MenuItem[]) => {
    list = items
    c.clearRect(0, 0, G, MENU_Y)
    glassSurface(c, 0, 0, G, MENU_Y, 56, 6)
    centered(c, ILLUSTRATIVE_LABEL, G / 2, bandY / 2, 72, 600, GOLD, G - 160)
    c.fillStyle = GOLD
    c.fillRect(80, bandY - 4, G - 160, 4)
    // Satırlar gövdeyi eşit böler; isabet hesabı (menuIsabet) aynı bölmeyi kullanır.
    const line = (MENU_Y - bandY) / Math.max(1, items.length)
    const gap = Math.min(24, line * 0.14)
    const size = Math.round(Math.max(68, Math.min(100, line * 0.5)))
    items.forEach((item, i) => {
      const y = bandY + i * line
      c.beginPath()
      c.roundRect(80, y + gap / 2, G - 160, line - gap, 28)
      c.fillStyle = GLASS_ROW
      c.fill()
      centered(c, item.ad, G / 2, y + line / 2, size, 600, TEXT_, G - 288)
    })
    texture.needsUpdate = true
  }

  const hit = (v: number) => {
    const i = menuHit(v, list.length, MENU_TITLE_RATIO)
    return i === null ? null : list[i].id
  }

  draw([])
  return { obj, draw, hit, dispose }
}

export function infoPanel() {
  const G = SHARP_G
  const { c, texture, obj, dispose } = panel(CARD_G, G, CARD_Y)
  const SIDE = 104, GEN = G - 2 * SIDE
  const TITLE = 92, TITLE_TOP = 72, STROKE = TITLE_TOP + TITLE + 32
  const UPPER = STROKE + 44, BOTTOM = CARD_Y - 64, BETWEEN = 56

  const show = (k: { title: string; text: string; source: string }) => {
    c.clearRect(0, 0, G, CARD_Y)
    c.textAlign = 'left'
    c.textBaseline = 'top'

    // Gövde 84 px; gerçek yazı tipi tahminden geniş çıkıp karta sığmazsa küçültülür, metin kesilmez.
    let size = 84
    let lines: string[] = [], sources: string[] = [], interval = 0, sourceRange = 0
    for (; size >= 44; size -= 2) {
      c.font = `400 ${size}px ${TEXT}`
      lines = wrapLine(k.text, (s) => c.measureText(s).width, GEN)
      c.font = `400 ${Math.round(size * 0.78)}px ${TEXT}`
      sources = wrapLine(k.source, (s) => c.measureText(s).width, GEN)
      interval = Math.round(size * 1.32)
      sourceRange = Math.round(size * 0.78 * 1.28)
      if (lines.length * interval + BETWEEN + sources.length * sourceRange <= BOTTOM - UPPER) break
    }
    if (size < 44) size = 44

    // Cam, içeriğe göre kısalır: kısa metinde boş alan kalmaz. Düzlem aynı kalır, üstü hizalıdır.
    const sourceTop = Math.min(BOTTOM, UPPER + lines.length * interval + BETWEEN + sources.length * sourceRange) - sources.length * sourceRange
    glassSurface(c, 0, 0, G, Math.min(CARD_Y, sourceTop + sources.length * sourceRange + 64), 56, 6)
    c.font = `700 ${TITLE}px ${TEXT}`
    c.fillStyle = TEXT_
    c.fillText(k.title, SIDE, TITLE_TOP, GEN) // Sığmazsa yatayda sıkışır, taşmaz
    c.fillStyle = GOLD
    c.fillRect(SIDE, STROKE, 168, 6)

    c.font = `400 ${size}px ${TEXT}`
    c.fillStyle = TEXT_
    lines.forEach((s, i) => c.fillText(s, SIDE, UPPER + i * interval))

    // Kaynak metnin altındadır; üstünde ince çizgi.
    c.fillStyle = GLASS_EDGE
    c.fillRect(SIDE, sourceTop - BETWEEN / 2, GEN, 3)
    c.font = `400 ${Math.round(size * 0.78)}px ${TEXT}`
    c.fillStyle = SECONDARY
    sources.forEach((s, i) => c.fillText(s, SIDE, sourceTop + i * sourceRange))

    texture.needsUpdate = true
    obj.visible = true
  }

  const hide = () => {
    obj.visible = false
  }

  hide()
  return { obj, show, hide, dispose }
}
