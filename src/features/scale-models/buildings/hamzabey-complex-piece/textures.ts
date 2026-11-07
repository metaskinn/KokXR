// Textures for the Hamzabey Complex model. Generated on canvas; colors and layout interpreted from the Drive archive photos.
// Calligraphy is not imitated. There are only two photo textures (inscription, dome center); not used in the public build.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../../shared/config/publicBuild'
import { random } from '../../uluMosqueFloor'

type Draw = (c: CanvasRenderingContext2D, g: number, y: number) => void

function canvas(g: number, y: number, draw: Draw) {
  const el = document.createElement('canvas')
  el.width = g
  el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  draw(c, g, y)
  return el
}

/** `gx`, `gy` in meters: the texture repeats every this many meters (UVs in meters). */
function texture(el: HTMLCanvasElement, gx = 1, gy = gx, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / gx, 1 / gy)
  t.anisotropy = 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

const select = <T,>(r: () => number, l: T[]) => l[Math.floor(r() * l.length)]
const BRICK = ['#8d4a31', '#975238', '#9f5a3f', '#864429', '#a56247', '#914f36']
const STONE = ['#a5957a', '#94866c', '#ae9f85', '#9a8c72', '#8a7c64', '#a99a80']

/** Three courses of brick, one course of rubble stone; vertical bricks between stones (inventory, pp. 180-182). */
function weave() {
  const G = 1024, Y = 512, STONE_H = 146, BRK_H = 37
  const r = random(11)
  const pieces: { x: number; y: number; g: number; h: number; color: string; burden: number }[] = []
  let y = 0
  for (let p = 0; p < 2; p++) {
    let x = -r() * 60
    while (x < G) {
      const g = 170 + r() * 150
      pieces.push({ x, y, g: g - 5, h: STONE_H - 5, color: select(r, STONE), burden: 150 + r() * 70 })
      x += g
      const count = 1 + Math.floor(r() * 2)
      for (let i = 0; i < count; i++) {
        pieces.push({ x, y, g: 21, h: STONE_H - 5, color: select(r, BRICK), burden: 210 })
        x += 26
      }
    }
    y += STONE_H
    for (let s = 0; s < 3; s++) {
      let xb = -r() * 130
      while (xb < G) {
        const g = 110 + r() * 40
        pieces.push({ x: xb, y, g: g - 5, h: BRK_H - 5, color: select(r, BRICK), burden: 215 })
        xb += g
      }
      y += BRK_H
    }
  }
  const color = canvas(G, Y, (c) => {
    c.fillStyle = '#bcae98'
    c.fillRect(0, 0, G, Y)
    for (const p of pieces) { c.fillStyle = p.color; c.fillRect(p.x, p.y, p.g, p.h) }
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'
      const b = 1 + r() * 4
      c.fillRect(r() * G, r() * Y, b, b)
    }
  })
  const relief = canvas(G / 2, Y / 2, (c) => {
    c.fillStyle = '#303030'
    c.fillRect(0, 0, G, Y)
    c.scale(0.5, 0.5)
    for (const p of pieces) { c.fillStyle = `rgb(${p.burden},${p.burden},${p.burden})`; c.fillRect(p.x, p.y, p.g, p.h) }
  })
  return { color: texture(color, 2.1, 1.05), relief: texture(relief, 2.1, 1.05, false) }
}

/** Brick only: drum, minaret shaft and arch rings. */
function brickTexture() {
  const G = 512, Y = 256, H = 64
  const r = random(23)
  return texture(canvas(G, Y, (c) => {
    c.fillStyle = '#b5a791'
    c.fillRect(0, 0, G, Y)
    for (let s = 0; s < 4; s++) {
      let x = s % 2 ? -110 : 0
      while (x < G) {
        c.fillStyle = select(r, BRICK)
        c.fillRect(x + 3, s * H + 4, 212, H - 8)
        x += 218
      }
    }
    for (let i = 0; i < 1200; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'
      c.fillRect(r() * G, r() * Y, 3, 3)
    }
  }), 0.6, 0.3)
}

/** Zigzag brick pattern on the upper facade of the Aile Türbesi (interpreted from the photo). */
function zigzagTexture() {
  const G = 768, Y = 576, A = 64, B = 96
  const r = random(7)
  return texture(canvas(G, Y, (c) => {
    c.fillStyle = '#c4b59e'
    c.fillRect(0, 0, G, Y)
    for (let s = 0; s < Y / B; s++) {
      const yt = s * B
      // Thin brick course between bands
      c.fillStyle = select(r, BRICK)
      c.fillRect(0, yt, G, 12)
      for (let i = -1; i <= G / (A * 2); i++) {
        const x = i * A * 2 + (s % 2 ? A : 0)
        c.fillStyle = select(r, BRICK)
        c.beginPath(); c.moveTo(x + 5, yt + B - 6); c.lineTo(x + A, yt + 20); c.lineTo(x + A * 2 - 5, yt + B - 6); c.closePath(); c.fill()
        c.fillStyle = '#efe4cd'
        c.beginPath(); c.moveTo(x + A - 18, yt + B - 8); c.lineTo(x + A, yt + 52); c.lineTo(x + A + 18, yt + B - 8); c.closePath(); c.fill()
      }
    }
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.07)'
      c.fillRect(r() * G, r() * Y, 3, 3)
    }
  }), 1.2, 0.9)
}

/** Ribbed lead dome: segment seams and horizontal joints; UV wraps the dome once. */
function leadDome(slice: number) {
  const G = 2048, Y = 512
  const r = random(31)
  return texture(canvas(G, Y, (c) => {
    c.fillStyle = '#8d989e'
    c.fillRect(0, 0, G, Y)
    const d = G / slice
    for (let i = 0; i < slice; i++) {
      const t = 132 + r() * 22
      c.fillStyle = `rgb(${t - 6},${t + 6},${t + 12})`
      c.fillRect(i * d, 0, d, Y)
      for (let j = 1; j < 5; j++) {
        c.fillStyle = 'rgba(60,70,76,.35)'
        c.fillRect(i * d, j * 100 + (i % 2) * 40, d, 2)
      }
      c.fillStyle = 'rgba(48,56,62,.75)'
      c.fillRect(i * d, 0, 3, Y)
      c.fillStyle = 'rgba(240,245,248,.45)'
      c.fillRect(i * d + 3, 0, 3, Y)
    }
  }))
}

/** Stained-glass window: white circles and red-blue fill (based on the photo). */
function stainedGlassTexture() {
  return texture(canvas(256, 384, (c, g, y) => {
    c.fillStyle = '#f7f2e6'
    c.fillRect(0, 0, g, y)
    const s = 56
    for (let j = -1; j < y / s + 1; j++) for (let i = -1; i < g / s + 1; i++) {
      const x = i * s + s / 2 + (j % 2 ? s / 2 : 0), yy = j * s + s / 2
      c.fillStyle = (i + j) % 3 === 0 ? '#c9352b' : (i + j) % 3 === 1 ? '#e5683c' : '#3a66b5'
      c.beginPath(); c.moveTo(x, yy - 27); c.lineTo(x + 27, yy); c.lineTo(x, yy + 27); c.lineTo(x - 27, yy); c.closePath(); c.fill()
      c.fillStyle = '#fbf8ee'
      c.beginPath(); c.arc(x + s / 2, yy, 18, 0, Math.PI * 2); c.fill()
      c.strokeStyle = '#8c8880'; c.lineWidth = 2.5; c.stroke()
    }
  }))
}

/** Window with wooden leaves and bright glass, seen from inside. */
function windowTexture() {
  return texture(canvas(256, 320, (c, g, y) => {
    c.fillStyle = '#eef4f6'
    c.fillRect(0, 0, g, y)
    const gr = c.createLinearGradient(0, 0, 0, y)
    gr.addColorStop(0, 'rgba(190,215,235,.75)'); gr.addColorStop(0.65, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(150,175,120,.55)')
    c.fillStyle = gr
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#8a4b26'
    c.fillRect(0, 0, g, 22); c.fillRect(0, y - 22, g, 22); c.fillRect(0, 0, 22, y); c.fillRect(g - 22, 0, 22, y)
    c.fillRect(g / 2 - 11, 0, 22, y); c.fillRect(0, y * 0.32, g, 14)
    c.fillStyle = '#5b5a58'
    for (let i = 1; i < 6; i++) c.fillRect((i * g) / 6 - 2, y * 0.34, 4, y)
    for (let j = 0; j < 4; j++) c.fillRect(0, y * (0.45 + j * 0.15), g, 3)
  }))
}

/** Window with iron grille, seen from outside. */
function balustradeTexture() {
  return texture(canvas(256, 320, (c, g, y) => {
    c.fillStyle = '#17120e'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#2d2f33'
    for (let i = 1; i < 7; i++) c.fillRect((i * g) / 7 - 4, 0, 8, y)
    for (let j = 1; j < 8; j++) c.fillRect(0, (j * y) / 8 - 3, g, 6)
    c.strokeStyle = '#55351f'; c.lineWidth = 16; c.strokeRect(0, 0, g, y)
  }))
}

/** Plaster grille from outside: lattice of rows of circles. */
function latticeTexture() {
  return texture(canvas(256, 384, (c, g, y) => {
    c.fillStyle = '#ece3d0'
    c.fillRect(0, 0, g, y)
    const s = 62
    for (let j = 0; j < y / s + 1; j++) for (let i = 0; i < g / s + 1; i++) {
      c.fillStyle = '#2d3137'
      c.beginPath(); c.arc(i * s + (j % 2 ? s / 2 : 0), j * s, s * 0.39, 0, Math.PI * 2); c.fill()
    }
  }))
}

function flower(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, boss: string, leaf = 6) {
  c.fillStyle = color
  for (let i = 0; i < leaf; i++) {
    const a = (i / leaf) * Math.PI * 2
    c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.42, r * 0.28, a, 0, Math.PI * 2); c.fill()
  }
  c.fillStyle = boss
  c.beginPath(); c.arc(x, y, r * 0.3, 0, Math.PI * 2); c.fill()
}

/** Honey-colored carpet: a prayer-row band every 1.2 m and a row of flowers (based on the photo). */
function carpetTexture() {
  const G = 1024
  const r = random(5)
  return texture(canvas(G, G, (c) => {
    c.fillStyle = '#b89f78'
    c.fillRect(0, 0, G, G)
    for (let i = 0; i < 26000; i++) {
      const t = r()
      c.fillStyle = t > 0.5 ? 'rgba(255,240,205,.07)' : 'rgba(88,62,30,.07)'
      c.fillRect(r() * G, r() * G, 2, 2)
    }
    for (let s = 0; s < 2; s++) {
      const y = s * (G / 2) + 60
      c.fillStyle = '#cdbc9c'
      c.fillRect(0, y - 40, G, 80)
      c.fillStyle = '#6a4a35'
      c.fillRect(0, y - 40, G, 4); c.fillRect(0, y + 36, G, 4)
      for (let i = 0; i < 8; i++) {
        const x = (i + 0.5) * (G / 8)
        flower(c, x, y, 28, i % 2 ? '#2a2b52' : '#74303a', '#d8b56a', 8)
        c.fillStyle = '#6a4a35'
        c.beginPath(); c.arc(x + G / 16, y, 5, 0, Math.PI * 2); c.fill()
      }
    }
  }), 2.4, 2.4)
}

/** Medallion carpet in the central hall: large flowers in nested rings; transparent edge. */
function roseCarpetTexture() {
  const G = 1024, m = G / 2
  return texture(canvas(G, G, (c) => {
    c.clearRect(0, 0, G, G)
    c.beginPath()
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2, rr = 498 - 14 * Math.abs(Math.sin(a * 6))
      const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr
      if (i) c.lineTo(x, y); else c.moveTo(x, y)
    }
    c.closePath()
    c.fillStyle = '#e9dfca'; c.fill()
    c.lineWidth = 8; c.strokeStyle = '#7a5a3c'; c.stroke()
    const ring = (rr: number, n: number, length: number, r1: string, r2: string) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr
        c.fillStyle = '#f7f1e2'
        c.beginPath(); c.arc(x, y, length * 1.05, 0, Math.PI * 2); c.fill()
        c.strokeStyle = '#b08a55'; c.lineWidth = 3; c.stroke()
        flower(c, x, y, length, i % 2 ? r1 : r2, '#d9a53f', 8)
      }
    }
    ring(390, 12, 66, '#1e3f78', '#8f2a2f')
    ring(235, 8, 74, '#8f2a2f', '#1e3f78')
    flower(c, m, m, 110, '#6d4720', '#d9a53f', 10)
    flower(c, m, m, 58, '#1e3f78', '#f0d68a', 8)
  }))
}

/** Inner dome: u around, v base to apex. Green-brown leaf band at its skirt. */
function domeInnerTexture() {
  return texture(canvas(2048, 512, (c, g, y) => {
    c.fillStyle = '#efece4'
    c.fillRect(0, 0, g, y)
    const yb = y - 34
    c.fillStyle = '#5a3a28'
    c.fillRect(0, y - 8, g, 8)
    c.fillStyle = '#3f5a48'
    c.fillRect(0, yb - 34, g, 4)
    const n = 48
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * g
      c.fillStyle = i % 2 ? '#3f6650' : '#6c4630'
      c.beginPath(); c.ellipse(x - 9, yb, 15, 9, -0.7, 0, Math.PI * 2); c.ellipse(x + 9, yb, 15, 9, 0.7, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#b7863f'
      c.beginPath(); c.arc(x, yb, 5, 0, Math.PI * 2); c.fill()
    }
  }))
}

/** Dome center fallback (public build or no photo): ringed rosette. */
function bossTexture() {
  const G = 512, m = G / 2
  return texture(canvas(G, G, (c) => {
    c.fillStyle = '#efece4'
    c.fillRect(0, 0, G, G)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      c.fillStyle = i % 2 ? '#3f6650' : '#2c5484'
      c.beginPath(); c.ellipse(m + Math.cos(a) * 160, m + Math.sin(a) * 160, 26, 13, a, 0, Math.PI * 2); c.fill()
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      c.strokeStyle = '#2b2622'; c.lineWidth = 10
      c.beginPath(); c.ellipse(m + Math.cos(a) * 55, m + Math.sin(a) * 55, 58, 22, a, 0, Math.PI * 2); c.stroke()
    }
  }))
}

/** Turkish triangle face: striped outline on each triangle (the painted lines in the photo). */
function triangleTexture() {
  return texture(canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#efece4'
    c.fillRect(0, 0, g, y)
    const path = (p: number) => {
      c.beginPath()
      c.moveTo(p, y - p * 0.6); c.lineTo(g - p, y - p * 0.6); c.lineTo(g / 2, p * 1.5); c.closePath()
    }
    c.strokeStyle = '#3a3836'
    c.lineWidth = 6; path(10); c.stroke()
    c.lineWidth = 2.5; path(46); c.stroke()
  }))
}

/** Mihrab frame strip: green interlace on cream. */
function mihrabBandTexture() {
  return texture(canvas(128, 128, (c, g, y) => {
    c.fillStyle = '#e7e6da'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#2e5642'; c.lineWidth = 11
    c.beginPath(); c.arc(g / 2, 0, 44, 0, Math.PI); c.stroke()
    c.beginPath(); c.arc(g / 2, y, 44, Math.PI, Math.PI * 2); c.stroke()
    c.beginPath(); c.arc(0, y / 2, 44, -Math.PI / 2, Math.PI / 2); c.stroke()
    c.beginPath(); c.arc(g, y / 2, 44, Math.PI / 2, Math.PI * 1.5); c.stroke()
    c.fillStyle = '#25382f'
    c.beginPath(); c.arc(g / 2, y / 2, 12, 0, Math.PI * 2); c.fill()
  }), 0.26)
}

/** Octagonal panel: no inscription, star interlace. The calligraphy panels in the photo are not imitated. */
function medallionTexture() {
  const G = 256, m = G / 2
  return texture(canvas(G, G, (c) => {
    c.fillStyle = '#1f2b24'
    c.fillRect(0, 0, G, G)
    c.strokeStyle = '#cda44f'; c.lineWidth = 7
    c.beginPath(); c.arc(m, m, 104, 0, Math.PI * 2); c.stroke()
    c.lineWidth = 4
    for (let k = 0; k < 2; k++) {
      c.beginPath()
      for (let i = 0; i <= 4; i++) {
        const a = (i / 4) * Math.PI * 2 + (k * Math.PI) / 4
        const x = m + Math.cos(a) * 80, y = m + Math.sin(a) * 80
        if (i) c.lineTo(x, y); else c.moveTo(x, y)
      }
      c.stroke()
    }
  }))
}

/** Sarcophagus cover: gold zigzag on black (Hamza Bey Türbesi photo). */
function cenotaphTexture() {
  return texture(canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#14161a'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#b89650'; c.lineWidth = 7
    for (let j = 0; j < 5; j++) {
      c.beginPath()
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * g, yy = j * 52 + 26 + (i % 2 ? -18 : 18)
        if (i) c.lineTo(x, yy); else c.moveTo(x, yy)
      }
      c.stroke()
    }
  }), 0.32)
}

/** Aile Türbesi sarcophagus cover: red brocade. */
function brocadeTexture() {
  return texture(canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#7d1f1c'
    c.fillRect(0, 0, g, y)
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) flower(c, (i + 0.5) * 64 + (j % 2 ? 32 : 0), (j + 0.5) * 64, 22, '#a8483a', '#c98f4d', 6)
  }), 0.5)
}

/** Depiction of a draped curtain in a plastered niche (representative, for the west iwan mihrab). */
function curtainTexture() {
  return texture(canvas(256, 512, (c, g, y) => {
    for (let x = 0; x < g; x++) {
      const t = 220 + 26 * Math.sin((x / g) * Math.PI * 12)
      c.fillStyle = `rgb(${t},${t - 6},${t - 18})`
      c.fillRect(x, 0, 1, y)
    }
    c.fillStyle = 'rgba(115,84,50,.6)'
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.ellipse(g * (0.1 + i * 0.2), y * 0.12, g * 0.12, y * 0.06, 0, 0, Math.PI); c.fill()
    }
  }))
}

/** Brown scroll ornament on plaster; transparent ground. */
function malakariTexture() {
  const G = 512, Y = 256, m = G / 2
  return texture(canvas(G, Y, (c) => {
    c.clearRect(0, 0, G, Y)
    c.strokeStyle = '#5b3a2a'; c.lineWidth = 9; c.lineCap = 'round'
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(m, 190); c.bezierCurveTo(m + s * 70, 230, m + s * 180, 200, m + s * 170, 110); c.bezierCurveTo(m + s * 165, 70, m + s * 100, 80, m + s * 110, 125); c.stroke()
      c.beginPath(); c.moveTo(m, 150); c.bezierCurveTo(m + s * 30, 120, m + s * 60, 130, m + s * 55, 165); c.stroke()
      c.fillStyle = '#5b3a2a'
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.ellipse(m + s * (70 + i * 30), 205 - i * 12, 15, 7, s * 0.4, 0, Math.PI * 2); c.fill()
      }
    }
    c.fillStyle = '#5b3a2a'
    c.beginPath(); c.moveTo(m, 40); c.quadraticCurveTo(m + 34, 90, m, 130); c.quadraticCurveTo(m - 34, 90, m, 40); c.fill()
  }))
}

/** Brick paving: red-brown square bricks in the tombs. */
function pavingBrickTexture() {
  const r = random(41)
  return texture(canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#8a7461'
    c.fillRect(0, 0, g, y)
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      c.fillStyle = select(r, ['#b3684f', '#a65c46', '#bd735a', '#9f5541'])
      c.fillRect(i * 128 + 3, j * 128 + 3, 122, 122)
    }
  }), 1)
}

function speckled(seed: number, base: string, colors: string[], gx: number) {
  const r = random(seed)
  return texture(canvas(256, 256, (c, g, y) => {
    c.fillStyle = base
    c.fillRect(0, 0, g, y)
    for (let i = 0; i < 2200; i++) {
      c.fillStyle = select(r, colors)
      const b = 2 + r() * 7
      c.fillRect(r() * g, r() * y, b, b)
    }
  }), gx)
}

export function hamzabeyMaterials() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const shine = (map: THREE.Texture, k: number) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k * 0.97) })
  const o = weave()
  const loader = new THREE.TextureLoader()
  const photoTexture = (name: string) => {
    if (PUBLIC_BUILD) return null
    const f = loader.load(`/images/hamzabey-complex/model/${name}.jpg`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const bossPhoto = photoTexture('dome-boss')
  const inscriptionPhoto = photoTexture('inscription')
  return {
    weave: pbr({ map: o.color, bumpMap: o.relief, bumpScale: 0.9, roughness: 0.92 }),
    brick: pbr({ map: brickTexture(), roughness: 0.9 }),
    zigzagOf: pbr({ map: zigzagTexture(), roughness: 0.9 }),
    domeOuter: pbr({ map: leadDome(36), roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide }),
    plaster: pbr({ color: '#e9e8e4', roughness: 0.92, side: THREE.DoubleSide }),
    plasterBright: pbr({ color: '#e9e8e4', roughness: 0.92, side: THREE.DoubleSide, emissive: '#8c8a84', emissiveIntensity: 0.55 }),
    niche: pbr({ color: '#c9c7c0', roughness: 0.92 }),
    stroke: pbr({ color: '#3c3a38', roughness: 0.8 }),
    carpet: pbr({ map: carpetTexture(), roughness: 0.97 }),
    roseCarpet: pbr({ map: roseCarpetTexture(), roughness: 0.96, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    stainedGlass: shine(stainedGlassTexture(), 1.5),
    window: new THREE.MeshBasicMaterial({ map: windowTexture(), color: new THREE.Color(1.15, 1.15, 1.12) }),
    balustrade: pbr({ map: balustradeTexture(), roughness: 0.7 }),
    lattice: pbr({ map: latticeTexture(), roughness: 0.85 }),
    domeInner: pbr({ map: domeInnerTexture(), roughness: 0.92, side: THREE.DoubleSide }),
    domeInnerBright: pbr({ map: domeInnerTexture(), roughness: 0.92, side: THREE.DoubleSide, emissive: '#8c8a84', emissiveIntensity: 0.55 }),
    boss: pbr({ map: bossPhoto ?? bossTexture(), roughness: 0.92, side: THREE.DoubleSide }),
    triangle: pbr({ map: triangleTexture(), roughness: 0.92, side: THREE.DoubleSide }),
    mihrabBandOf: pbr({ map: mihrabBandTexture(), roughness: 0.75 }),
    medallion: pbr({ map: medallionTexture(), roughness: 0.5, metalness: 0.15 }),
    cenotaph: pbr({ map: cenotaphTexture(), roughness: 0.75, side: THREE.DoubleSide }),
    brocade: pbr({ map: brocadeTexture(), roughness: 0.82, side: THREE.DoubleSide }),
    curtain: pbr({ map: curtainTexture(), roughness: 0.9 }),
    malakari: pbr({ map: malakariTexture(), transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    pavingBrick: pbr({ map: pavingBrickTexture(), roughness: 0.85 }),
    inscription: pbr({ map: inscriptionPhoto, color: inscriptionPhoto ? '#ffffff' : '#d9d2bf', roughness: 0.7 }),
    walnut: pbr({ color: '#5a3219', roughness: 0.5 }),
    walnutLight: pbr({ color: '#7d4a25', roughness: 0.5 }),
    red: pbr({ color: '#8e1f24', roughness: 0.7 }),
    tile: pbr({ color: '#2f7f86', roughness: 0.35, metalness: 0.05 }),
    leafYellow: pbr({ map: speckled(3, '#9c7a2a', ['#b0892f', '#8b6420', '#7c7c2c', '#b8953a', '#6e5220', '#5f6a28'], 1.2), roughness: 1 }),
    leafGreen: pbr({ map: speckled(4, '#4d6629', ['#5d7a30', '#3f5522', '#6d8535', '#34491d', '#7c8a35'], 1.2), roughness: 1 }),
    grass: pbr({ map: speckled(8, '#5a7a33', ['#688b3b', '#4c6b2a', '#79963f', '#507031'], 3), roughness: 1 }),
    body: pbr({ color: '#4c3a2b', roughness: 1 }),
  }
}
