// Sword workshop VR panels: drawn on a canvas and mapped onto a plane. Text comes from the caller; no historical text is written here.
// draw re-uploads the texture; call it only when the content changes.
import * as T from 'three'
import { wrapLine } from '../../../../shared/xr/xrText'
import { PANEL_G, PANEL_Y, panelFrame, panelLayout } from './xrCalc'
import type { Frame, PanelButton, PanelState, infoState } from './xrCalc'

// Workshop page colors (sword/sword.css).
const FLOOR = '#141b1c', SURFACE = '#283232', EDGE = '#5e655f', TEXT_ = '#ede9e0', SECONDARY = '#adb6ae', GOLD = '#d6b183', GOLD_DARK = '#3a2d1c', GREEN = '#a3c3ae', WARNING = '#f0a860'
const TEXT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const SIDE = 32, GEN = PANEL_G - 2 * SIDE
export const PANEL_METER = .8

function canvas(y: number) {
  const el = document.createElement('canvas'); el.width = PANEL_G; el.height = y
  const c = el.getContext('2d'); if (!c) throw new Error('Canvas unavailable')
  const texture = new T.CanvasTexture(el); texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4
  const geometry = new T.PlaneGeometry(PANEL_METER, PANEL_METER * y / PANEL_G)
  // Panels skip depth testing: readable even in front of the forge or workbench.
  const material = new T.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, depthTest: false, depthWrite: false, fog: false })
  const obj = new T.Mesh(geometry, material)
  return { c, texture, obj, dispose: () => { texture.dispose(); material.dispose(); geometry.dispose() } }
}

function lines(c: CanvasRenderingContext2D, text: string, font: string, gen = GEN) {
  c.font = font
  return wrapLine(text, s => c.measureText(s).width, gen)
}

function bar(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, ratio: number, color: string) {
  c.fillStyle = SURFACE; c.fillRect(x, y, g, h)
  c.fillStyle = color; c.fillRect(x, y, g * Math.max(0, Math.min(1, ratio)), h)
}

function button(c: CanvasRenderingContext2D, k: Frame, ratio?: number) {
  const b: PanelButton = k.button
  c.beginPath(); c.roundRect(k.x, k.y, k.g, k.y2 - k.y, 8)
  c.fillStyle = b.selected ? GOLD_DARK : SURFACE; c.globalAlpha = b.passive ? .45 : 1; c.fill()
  c.lineWidth = b.selected ? 4 : 2; c.strokeStyle = b.selected ? GOLD : EDGE; c.stroke()
  if (ratio !== undefined) { c.fillStyle = GREEN; c.fillRect(k.x + 4, k.y2 - 12, (k.g - 8) * Math.min(1, ratio), 7) }
  c.fillStyle = TEXT_; c.font = `600 ${k.region ? 24 : 27}px ${TEXT}`; c.textAlign = 'center'; c.textBaseline = 'middle'
  c.fillText(b.ad, k.x + k.g / 2, (k.y + k.y2) / 2 - (ratio !== undefined ? 3 : 0), k.g - 16)
  c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'top'
}

export function controlPanel() {
  const { c, texture, obj, dispose } = canvas(PANEL_Y)
  let squares: Frame[] = []

  const draw = (p: PanelState) => {
    const place = panelLayout(p); squares = place.squares
    c.fillStyle = FLOOR; c.fillRect(0, 0, PANEL_G, PANEL_Y)
    c.fillStyle = GOLD; c.fillRect(0, 0, PANEL_G, 6)
    c.textAlign = 'left'; c.textBaseline = 'top'
    c.fillStyle = GOLD; c.font = `600 22px ${TEXT}`; c.fillText(p.step, SIDE, 22)
    c.fillStyle = TEXT_; c.font = `700 46px ${TEXT}`; c.fillText(p.title, SIDE, 52)
    let y = 112
    c.fillStyle = TEXT_
    for (const s of lines(c, p.instruction, `400 30px ${TEXT}`).slice(0, 3)) { c.fillText(s, SIDE, y); y += 37 }
    y += 6
    c.fillStyle = GOLD
    for (const s of lines(c, p.message, `400 26px ${TEXT}`).slice(0, 2)) { c.fillText(s, SIDE, y); y += 32 }
    y += 8
    if (p.heat) {
      c.fillStyle = SECONDARY; c.font = `400 22px ${TEXT}`; c.fillText(`Çelik sıcaklığı · Oyun ölçeği · ${p.heat.interval}`, SIDE, y)
      c.fillStyle = TEXT_; c.font = `700 26px ${TEXT}`; c.textAlign = 'right'; c.fillText(`${p.heat.value}°`, PANEL_G - SIDE, y - 2); c.textAlign = 'left'
      bar(c, SIDE, y + 30, GEN, 14, (p.heat.value - 20) / 1180, p.heat.value > 1150 ? WARNING : GOLD); y += 58
    }
    if (p.progress) {
      c.fillStyle = SECONDARY; c.font = `400 22px ${TEXT}`; c.fillText(p.progress.text, SIDE, y)
      bar(c, SIDE, y + 28, GEN, 8, p.progress.ratio, GREEN); y += 44
    }
    if (p.quality) {
      c.fillStyle = SECONDARY; c.font = `600 22px ${TEXT}`; c.fillText('ESERİNİN KALİTESİ', SIDE, y)
      c.fillStyle = TEXT_; c.font = `700 36px ${TEXT}`; c.textAlign = 'right'; c.fillText(`${p.quality.score}/100`, PANEL_G - SIDE, y - 8); c.textAlign = 'left'
      const g = (GEN - 2 * 20) / 3
      p.quality.measurement.forEach(([ad, v], i) => {
        const x = SIDE + i * (g + 20)
        c.fillStyle = SECONDARY; c.font = `400 20px ${TEXT}`; c.fillText(ad, x, y + 34); bar(c, x, y + 60, g, 8, v, GOLD)
      })
      c.fillStyle = p.quality.notes.some(n => n.includes('çatlak')) ? WARNING : GOLD; c.font = `400 22px ${TEXT}`; c.fillText(p.quality.notes.join(' · '), SIDE, y + 76, GEN)
      y += 116
    }
    for (const k of squares) {
      const i = k.region ? Number(k.id.slice(6)) : -1
      if (p.regions && i >= 0) k.button = { ...k.button, selected: p.regions.selected === i }
      button(c, k, p.regions && i >= 0 ? p.regions.ratio[i] : undefined)
    }
    texture.needsUpdate = true
  }

  return { obj, draw, frame: (u: number, v: number) => panelFrame(squares, u, v), squares: () => squares, dispose }
}

export const INFO_Y = 490

export function infoPanel() {
  const { c, texture, obj, dispose } = canvas(INFO_Y)
  const draw = (b: ReturnType<typeof infoState>) => {
    c.fillStyle = FLOOR; c.fillRect(0, 0, PANEL_G, INFO_Y)
    c.textAlign = 'left'; c.textBaseline = 'top'
    // The honesty note is bottom-aligned and fixed at every size; the sourced note fits in the space above, text is not truncated.
    const nFont = `400 25px ${TEXT}`, nLine = lines(c, b.honesty, nFont), nTop = INFO_Y - 18 - nLine.length * 31
    c.fillStyle = GOLD; c.fillRect(SIDE, nTop - 46, GEN, 2)
    c.font = `600 21px ${TEXT}`; c.fillText(b.honestyTitle, SIDE, nTop - 34)
    c.fillStyle = TEXT_; c.font = nFont; nLine.forEach((s, i) => c.fillText(s, SIDE, nTop + i * 31))

    c.fillStyle = GOLD; c.font = `600 24px ${TEXT}`; c.fillText(b.title.toLocaleUpperCase('tr'), SIDE, 18)
    const top = 54, alt = nTop - 56
    let size = 30, text: string[] = [], source: string[] = []
    for (; size >= 20; size -= 2) {
      text = lines(c, b.text, `400 ${size}px ${TEXT}`)
      source = lines(c, b.source, `400 ${size - 6}px ${TEXT}`)
      if (text.length * size * 1.28 + source.length * (size - 6) * 1.28 + 8 <= alt - top) break
    }
    if (size < 20) size = 20
    let y = top
    c.fillStyle = TEXT_; c.font = `400 ${size}px ${TEXT}`
    for (const s of text) { c.fillText(s, SIDE, y); y += size * 1.28 }
    y += 8
    c.fillStyle = SECONDARY; c.font = `400 ${size - 6}px ${TEXT}`
    for (const s of source) { c.fillText(s, SIDE, y); y += (size - 6) * 1.28 }
    texture.needsUpdate = true
  }
  return { obj, draw, dispose }
}
