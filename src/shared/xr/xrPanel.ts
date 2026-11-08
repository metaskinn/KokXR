// VR menu and info card: drawn on a canvas and applied to a plane. Plane sizes are in metres.
// Visual language matches the web card (model.css, .model-info-card): dark glass, rounded corners, thin gold accent.
// Card text comes from the caller; no historical text is written here.
import * as THREE from 'three'
import { MENU_TITLE_RATIO, ILLUSTRATIVE_LABEL, menuHit, wrapLine, type MenuItem } from './xrText'

// Panels meant for reading are high resolution; the many small pills in the scene stay low for Quest memory.
const SHARP_W = 2048, PILL_W = 1024
export const MENU_G = 0.7, CARD_G = 0.66
const TITLE_W = 0.85, TITLE_H = 130
const MENU_H = 1680, CARD_H = 1520

const GLASS_FLOOR = 'rgba(18,30,26,0.92)', GLASS_ROW = 'rgba(247,245,239,0.1)', GLASS_EDGE = 'rgba(247,245,239,0.22)'
const TEXT_COLOR = '#f7f5ef', SECONDARY = '#d6dcd5', GOLD = '#f2c14e'
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Canvas, its texture and plane: `meter` is the panel width; height follows the canvas aspect ratio. */
function panel(meter: number, canvasW: number, canvasH: number) {
  const el = document.createElement('canvas')
  el.width = canvasW
  el.height = canvasH
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  const texture = new THREE.CanvasTexture(el)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  // Premultiplied alpha: avoids dark fringes at corners and mipmap transitions.
  texture.premultiplyAlpha = true
  const geometry = new THREE.PlaneGeometry(meter, (meter * canvasH) / canvasW)
  // alphaTest: keeps the empty corners of scene pills from writing depth and erasing what is behind.
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, premultipliedAlpha: true, alphaTest: 0.01 })
  const obj = new THREE.Mesh(geometry, material)
  const dispose = () => {
    texture.dispose()
    material.dispose()
    geometry.dispose()
  }
  return { c, texture, obj, dispose }
}

/** Dark glass surface: rounded corners and a thin light edge. */
function glassSurface(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, r: number, edge: number, fill = GLASS_FLOOR) {
  c.beginPath()
  c.roundRect(x + edge / 2, y + edge / 2, g - edge, h - edge, r)
  c.fillStyle = fill
  c.fill()
  c.lineWidth = edge
  c.strokeStyle = GLASS_EDGE
  c.stroke()
}

/** Centred single line: squeezes horizontally if it does not fit, never overflows. */
function centered(c: CanvasRenderingContext2D, writing: string, x: number, y: number, size: number, weight: number, color: string, maxVal: number) {
  c.fillStyle = color
  c.font = `${weight} ${size}px ${FONT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(writing, x, y, maxVal)
}

/** Illustrative label: visible for the whole session, even with menu and card closed. `hint` is the controls line. */
export function labelPanel(hint = 'Menü: Y / B · Sol çubuk: yürü · Sağ çubuk: dön') {
  const height = 130
  const { c, texture, obj, dispose } = panel(0.72, PILL_W, height)
  glassSurface(c, 0, 0, PILL_W, height, 36, 3)
  centered(c, ILLUSTRATIVE_LABEL, PILL_W / 2, 39, 32, 600, GOLD, PILL_W - 80)
  centered(c, hint, PILL_W / 2, 91, 30, 500, TEXT_COLOR, PILL_W - 60)
  texture.needsUpdate = true
  return { obj, dispose }
}

/** Short instruction attached to the head (e.g. AR placement): one or two lines, wrapped at word boundaries. */
export function hintPanel(text: string) {
  const height = 150
  const { c, texture, obj, dispose } = panel(0.6, PILL_W, height)
  glassSurface(c, 0, 0, PILL_W, height, 32, 3)
  c.font = `600 36px ${FONT}`
  const lines = wrapLine(text, (t) => c.measureText(t).width, PILL_W - 80).slice(0, 2)
  lines.forEach((line, i) => centered(c, line, PILL_W / 2, height / 2 + (i - (lines.length - 1) / 2) * 46, 36, 600, TEXT_COLOR, PILL_W - 60))
  texture.needsUpdate = true
  return { obj, dispose }
}

/** Info title: shows only the name; the text opens in the card. The pill fits the text width. */
export function titlePanel(title: string) {
  const { c, texture, obj, dispose } = panel(TITLE_W, PILL_W, TITLE_H)
  c.font = `700 68px ${FONT}`
  const g = Math.min(PILL_W - 8, c.measureText(title).width + 120)
  glassSurface(c, (PILL_W - g) / 2, 4, g, TITLE_H - 8, (TITLE_H - 8) / 2, 4)
  centered(c, title, PILL_W / 2, TITLE_H / 2, 68, 700, TEXT_COLOR, g - 72)
  texture.needsUpdate = true
  return { obj, dispose }
}

/** Assembly status: attached to the head, redrawn only when the status changes. */
export function assemblyPanel() {
  const height = 190
  const { c, texture, obj, dispose } = panel(0.6, PILL_W, height)
  const draw = ({ top, message, note }: { top: string; message: string; note: string }) => {
    c.clearRect(0, 0, PILL_W, height)
    glassSurface(c, 0, 0, PILL_W, height, 28, 3)
    centered(c, top, PILL_W / 2, 42, 38, 700, GOLD, PILL_W - 60)
    centered(c, message, PILL_W / 2, 102, 40, 600, TEXT_COLOR, PILL_W - 60)
    centered(c, note, PILL_W / 2, 154, 30, 400, SECONDARY, PILL_W - 60)
    texture.needsUpdate = true
  }
  return { obj, draw, dispose }
}

export function xrPanel() {
  const G = SHARP_W
  const { c, texture, obj, dispose } = panel(MENU_G, G, MENU_H)
  const bandY = MENU_H * MENU_TITLE_RATIO
  let list: MenuItem[] = []

  const draw = (items: MenuItem[]) => {
    list = items
    c.clearRect(0, 0, G, MENU_H)
    glassSurface(c, 0, 0, G, MENU_H, 56, 6)
    centered(c, ILLUSTRATIVE_LABEL, G / 2, bandY / 2, 72, 600, GOLD, G - 160)
    c.fillStyle = GOLD
    c.fillRect(80, bandY - 4, G - 160, 4)
    // Rows split the body evenly; hit testing (menuHit) uses the same split.
    const line = (MENU_H - bandY) / Math.max(1, items.length)
    const gap = Math.min(24, line * 0.14)
    const size = Math.round(Math.max(68, Math.min(100, line * 0.5)))
    items.forEach((item, i) => {
      const y = bandY + i * line
      c.beginPath()
      c.roundRect(80, y + gap / 2, G - 160, line - gap, 28)
      c.fillStyle = GLASS_ROW
      c.fill()
      centered(c, item.name, G / 2, y + line / 2, size, 600, TEXT_COLOR, G - 288)
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
  const G = SHARP_W
  const { c, texture, obj, dispose } = panel(CARD_G, G, CARD_H)
  const SIDE = 104, CONTENT_W = G - 2 * SIDE
  const TITLE = 92, TITLE_TOP = 72, STROKE = TITLE_TOP + TITLE + 32
  const UPPER = STROKE + 44, BOTTOM = CARD_H - 64, BETWEEN = 56

  const show = (k: { title: string; text: string; source: string }) => {
    c.clearRect(0, 0, G, CARD_H)
    c.textAlign = 'left'
    c.textBaseline = 'top'

    // Body is 84 px; if the real font renders wider than estimated and overflows the card, it shrinks rather than truncating text.
    let size = 84
    let lines: string[] = [], sources: string[] = [], interval = 0, sourceRange = 0
    for (; size >= 44; size -= 2) {
      c.font = `400 ${size}px ${FONT}`
      lines = wrapLine(k.text, (s) => c.measureText(s).width, CONTENT_W)
      c.font = `400 ${Math.round(size * 0.78)}px ${FONT}`
      sources = wrapLine(k.source, (s) => c.measureText(s).width, CONTENT_W)
      interval = Math.round(size * 1.32)
      sourceRange = Math.round(size * 0.78 * 1.28)
      if (lines.length * interval + BETWEEN + sources.length * sourceRange <= BOTTOM - UPPER) break
    }
    if (size < 44) size = 44

    // The glass shrinks to fit content so short text leaves no empty space. The plane stays the same, top-aligned.
    const sourceTop = Math.min(BOTTOM, UPPER + lines.length * interval + BETWEEN + sources.length * sourceRange) - sources.length * sourceRange
    // The info card is more see-through than the other panels so the artwork stays visible behind it; the corner cross shows it can be closed.
    glassSurface(c, 0, 0, G, Math.min(CARD_H, sourceTop + sources.length * sourceRange + 64), 56, 6, 'rgba(18,30,26,0.76)')
    c.font = `700 ${TITLE}px ${FONT}`
    c.fillStyle = TEXT_COLOR
    c.fillText(k.title, SIDE, TITLE_TOP, CONTENT_W - 80) // Squeezes horizontally if it does not fit, never overflows
    c.textAlign = 'right'
    c.font = `400 ${TITLE}px ${FONT}`
    c.fillStyle = SECONDARY
    c.fillText('×', G - 56, TITLE_TOP - 6)
    c.textAlign = 'left'
    c.fillStyle = GOLD
    c.fillRect(SIDE, STROKE, 168, 6)

    c.font = `400 ${size}px ${FONT}`
    c.fillStyle = TEXT_COLOR
    lines.forEach((s, i) => c.fillText(s, SIDE, UPPER + i * interval))

    // Source sits below the text, with a thin rule above it.
    c.fillStyle = GLASS_EDGE
    c.fillRect(SIDE, sourceTop - BETWEEN / 2, CONTENT_W, 3)
    c.font = `400 ${Math.round(size * 0.78)}px ${FONT}`
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
