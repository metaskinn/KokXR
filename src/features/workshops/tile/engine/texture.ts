// Tabağın yüzeyi tek bir tuvaldir: çamur, astar, kömür noktaları, tahrir, boya ve sır sırayla üst üste çizilir.
// Tuvalin (x, y) noktası tabağın (ux, uz) birim koordinatıdır: merkez 0, kenar 1.
import * as THREE from 'three'
import { regions, traces, contours, type N } from './pattern'
import { COAL_CELL, traceHead, colors, type Game } from './state'

const S = 1280
const px = (u: number) => ((u + 1) / 2) * S
const SLIP = '#f5f0e2', INK = '#17202f', GLAZE = '#ece9df'

function shuffle(a: string, b: string, t: number) {
  const h = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16)
  const k = (i: number) => Math.round(h(a, i) + (h(b, i) - h(a, i)) * t).toString(16).padStart(2, '0')
  return `#${k(1)}${k(3)}${k(5)}`
}
/** Tohumlu gürültü: el yapımı yüzeyin küçük lekeleri her açılışta aynı olur. */
function stains(c: CanvasRenderingContext2D, count: number, color: string, wB: number, alpha: number) {
  let s = 12345
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  c.fillStyle = color
  for (let i = 0; i < count; i++) {
    c.globalAlpha = alpha * r()
    c.beginPath(); c.arc(r() * S, r() * S, 1 + r() * wB, 0, 7); c.fill()
  }
  c.globalAlpha = 1
}
function layer(draw: (c: CanvasRenderingContext2D) => void) {
  const e = document.createElement('canvas'); e.width = e.height = S
  const c = e.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  draw(c)
  return e
}
const path = (c: CanvasRenderingContext2D, p: N[], closedState = true) => {
  c.moveTo(px(p[0][0]), px(p[0][1]))
  for (let i = 1; i < p.length; i++) c.lineTo(px(p[i][0]), px(p[i][1]))
  if (closedState) c.closePath()
}

// Kontur boyunca eşit aralıklı kömür noktaları ve düştükleri hücre.
const points: { x: number; y: number; h: number }[] = contours.flatMap((k) => {
  const o: { x: number; y: number; h: number }[] = []
  let remaining = 0
  for (let i = 1; i < k.length; i++) {
    const [ax, ay] = k[i - 1], [bx, by] = k[i], u = Math.hypot(bx - ax, by - ay)
    for (let t = remaining; t < u; t += .018) {
      const x = ax + ((bx - ax) * t) / u, y = ay + ((by - ay) * t) / u
      o.push({ x, y, h: Math.floor(((y + 1) / 2) * COAL_CELL) * COAL_CELL + Math.floor(((x + 1) / 2) * COAL_CELL) })
      remaining = t + .018 - u
    }
  }
  return o
})

/** Kömürleme kâğıdı: delikli desen, yarı saydam parşömen. */
export function paperTexture() {
  const e = layer((c) => {
    c.fillStyle = 'rgba(232,222,196,.86)'; c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, 7); c.fill()
    c.fillStyle = '#5a5145'
    for (const n of points) { c.beginPath(); c.arc(px(n.x), px(n.y), 2.4, 0, 7); c.fill() }
  })
  const d = new THREE.CanvasTexture(e); d.colorSpace = THREE.SRGBColorSpace; d.flipY = false; d.anisotropy = 8
  return d
}

export function createSurface(anisotropy: number) {
  const clay = layer((c) => { c.fillStyle = '#a87b5a'; c.fillRect(0, 0, S, S); stains(c, 5000, '#6f4c34', 5, .35); stains(c, 3000, '#c9a07e', 4, .3) })
  const primer = layer((c) => { c.fillStyle = SLIP; c.fillRect(0, 0, S, S); stains(c, 2500, '#d9d0b9', 3, .22) })
  const glaze = layer((c) => { c.fillStyle = GLAZE; c.fillRect(0, 0, S, S); stains(c, 4000, '#fbfaf5', 5, .5); stains(c, 1500, '#cfcabb', 3, .3) })
  const el = document.createElement('canvas'); el.width = el.height = S
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  const texture = new THREE.CanvasTexture(el)
  texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false; texture.anisotropy = anisotropy; texture.generateMipmaps = true
  let keyStr = ''

  const draw = (d: Game) => {
    const fresh = [d.primer.toFixed(2), d.glaze.toFixed(2), d.live.toFixed(2), d.stage, d.iz, d.traceIndex, d.coalRatio.toFixed(2), d.paints.join()].join('|')
    if (fresh === keyStr) return
    keyStr = fresh
    c.globalAlpha = 1
    c.drawImage(clay, 0, 0)
    if (d.primer > 0) {
      c.save(); c.beginPath(); c.arc(S / 2, S / 2, (d.primer * 1.5 * S) / 2, 0, 7); c.clip(); c.drawImage(primer, 0, 0); c.restore()
    }
    // Boya: fırına kadar mat, sır pişince canlı.
    d.paints.forEach((r, i) => {
      if (!r) return
      const b = regions[i], color = colors.find((x) => x.id === r)
      if (!color) return
      c.fillStyle = shuffle(color.mat, color.live, d.live)
      c.beginPath(); path(c, b.outer); if (b.inner) path(c, b.inner); c.fill('evenodd')
    })
    // Kömür noktaları, tahrirden sonra da altta kalır.
    if (d.stage >= 2 && d.stage <= 4) {
      c.fillStyle = 'rgba(40,36,34,.75)'
      for (const n of points) if (d.coal[n.h]) { c.beginPath(); c.arc(px(n.x), px(n.y), 2.1, 0, 7); c.fill() }
    }
    // Tahrir.
    c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 4.2
    if (d.stage > 3) { c.beginPath(); contours.forEach((k) => path(c, k, false)); c.stroke() }
    if (d.stage === 3) {
      c.beginPath()
      traces.forEach((iz, i) => { if (i < d.iz) path(c, iz, false); else if (i === d.iz && d.traceIndex > 0) path(c, iz.slice(0, d.traceIndex + 1), false) })
      c.stroke()
      const n = traceHead(d)
      if (n) { c.strokeStyle = '#e5902f'; c.lineWidth = 6; c.beginPath(); c.arc(px(n[0]), px(n[1]), 15, 0, 7); c.stroke() }
    }
    // Pişmemiş sır deseni örter; piştikçe saydamlaşır.
    if (d.glaze > 0 && d.live < 1) {
      c.save(); c.globalAlpha = .96 * (1 - d.live)
      c.beginPath(); c.arc(S / 2, S / 2, (d.glaze * 1.5 * S) / 2, 0, 7); c.clip(); c.drawImage(glaze, 0, 0); c.restore()
    }
    texture.needsUpdate = true
  }
  return { texture, draw, dispose: () => texture.dispose() }
}
