// Umur Bey Complex textures: alternating masonry, roof tiles, brick, carpet and windows generated pixel by pixel.
// Colors and layout interpreted from the photos in the Drive archive; only the stone endowment deeds are real photos.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../../shared/config/publicBuild'
import { lightDevice, random } from '../../uluMosqueFloor'

type C = CanvasRenderingContext2D
const scale = () => (lightDevice() ? 0.5 : 1)

function canvas(g: number, h = g) {
  const el = document.createElement('canvas')
  el.width = Math.round(g * scale()); el.height = Math.round(h * scale())
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  c.scale(scale(), scale())
  return { el, c }
}

/** Repeating texture on surfaces with meter UVs: `g` and `h` are the real size of the texture. */
function repeat(el: HTMLCanvasElement, g: number, h: number, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / g, 1 / h)
  t.anisotropy = 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}
/** Texture fitted in one piece (window, panel): UV 0-1. */
function single(el: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function speck(c: C, g: number, h: number, count: number, r: () => number, colors: string[], alpha: number, length = 2) {
  for (let i = 0; i < count; i++) {
    c.globalAlpha = alpha * r()
    c.fillStyle = colors[Math.floor(r() * colors.length)]
    c.fillRect(r() * g, r() * h, 1 + r() * length, 1 + r() * length)
  }
  c.globalAlpha = 1
}

/** One course of cut stone, vertical bricks between stones, then three courses of brick (the alternating pattern in the inventory). */
function alternatingTexture(seed: number, option: { stoneColor: string[]; mortar: string; stoneWidth: number; stoneLen: number; brickRow: number }) {
  const P = 1024, METER = 2.08, ppm = P / METER
  const { el, c } = canvas(P), kab = canvas(P)
  const r = random(seed)
  const { stoneColor, mortar, stoneWidth, stoneLen, brickRow } = option
  const brickH = 0.052, joint = 0.018
  const cycle = METER / Math.round(METER / (stoneLen + joint + brickRow * (brickH + joint)))
  c.fillStyle = mortar; c.fillRect(0, 0, P, P)
  kab.c.fillStyle = '#404040'; kab.c.fillRect(0, 0, P, P)
  const infill = (x: number, y: number, g: number, h: number, color: string, height: string) => {
    c.fillStyle = color; c.fillRect(x * ppm, y * ppm, g * ppm, h * ppm)
    kab.c.fillStyle = height; kab.c.fillRect(x * ppm, y * ppm, g * ppm, h * ppm)
  }
  const brickColor = () => {
    const t = r(), a = 116 + t * 38, b = 62 + t * 26, d = 40 + t * 18
    return `rgb(${a | 0},${b | 0},${d | 0})`
  }
  const rowCount = Math.round(METER / cycle)
  for (let s = 0; s < rowCount; s++) {
    let y = s * cycle
    // Stone course: two vertical bricks between blocks
    const count = Math.round(METER / (stoneWidth + 0.09))
    const step = METER / count
    for (let i = 0; i < count; i++) {
      const x = i * step + (s % 2 ? step / 2 : 0)
      const gx = x % METER
      infill(gx, y, step - 0.09, stoneLen, stoneColor[Math.floor(r() * stoneColor.length)], '#e8e8e8')
      if (gx + step - 0.09 > METER) infill(gx - METER, y, step - 0.09, stoneLen, stoneColor[0], '#e8e8e8')
      const dx = (gx + step - 0.082) % METER
      infill(dx, y, 0.034, stoneLen, brickColor(), '#c8c8c8')
      infill((dx + 0.04) % METER, y, 0.034, stoneLen, brickColor(), '#c8c8c8')
    }
    y += stoneLen + joint
    for (let t = 0; t < brickRow; t++) {
      let x = (t % 2) * -0.13
      while (x < METER) {
        const g = 0.22 + r() * 0.08
        infill(x, y, g - 0.014, brickH, brickColor(), '#b8b8b8')
        x += g
      }
      y += brickH + joint
    }
  }
  speck(c, P, P, 9000, r, ['#3a2a18', '#e9d9b8', '#5a4028'], 0.22, 3)
  return { color: repeat(el, METER, METER), relief: repeat(kab.el, METER, METER, false) }
}

function roofTileTexture() {
  const G = 512, H = 256, METERG = 1.2, METERH = 0.66
  const { el, c } = canvas(G, H)
  const r = random(44)
  c.fillStyle = '#5e2c18'; c.fillRect(0, 0, G, H)
  const column = 6, row = 2, tg = G / column, th = H / row
  for (let s = 0; s < row; s++) for (let i = -1; i <= column; i++) {
    const x = i * tg + (s % 2 ? tg / 2 : 0), y = s * th
    const t = r()
    const color = `rgb(${(172 + t * 40) | 0},${(88 + t * 28) | 0},${(52 + t * 18) | 0})`
    const d = c.createLinearGradient(x, 0, x + tg, 0)
    d.addColorStop(0, 'rgba(50,20,8,.55)'); d.addColorStop(0.28, 'rgba(255,220,180,.12)'); d.addColorStop(0.72, 'rgba(255,220,180,.06)'); d.addColorStop(1, 'rgba(50,20,8,.55)')
    c.fillStyle = color; c.fillRect(x + 1, y, tg - 2, th - 2)
    c.fillStyle = d; c.fillRect(x + 1, y, tg - 2, th - 2)
    const alt = c.createLinearGradient(0, y + th - 16, 0, y + th)
    alt.addColorStop(0, 'rgba(40,16,6,0)'); alt.addColorStop(1, 'rgba(40,16,6,.6)')
    c.fillStyle = alt; c.fillRect(x + 1, y + th - 16, tg - 2, 16)
  }
  speck(c, G, H, 2500, r, ['#3a1c0c', '#e2b08a'], 0.16)
  return repeat(el, METERG, METERH)
}

function brickTexture() {
  const P = 512, METER = 1.3, ppm = P / METER
  const { el, c } = canvas(P), kab = canvas(P)
  const r = random(7)
  c.fillStyle = '#a3957e'; c.fillRect(0, 0, P, P)
  kab.c.fillStyle = '#404040'; kab.c.fillRect(0, 0, P, P)
  const ROW = 16, h = METER / ROW
  for (let s = 0; s < ROW; s++) {
    let x = s % 2 ? -0.12 : 0
    while (x < METER) {
      const g = 0.25, t = r()
      c.fillStyle = `rgb(${(128 + t * 34) | 0},${(72 + t * 24) | 0},${(50 + t * 16) | 0})`
      c.fillRect(x * ppm, s * h * ppm + 2, (g - 0.016) * ppm, (h - 0.018) * ppm)
      kab.c.fillStyle = '#d0d0d0'
      kab.c.fillRect(x * ppm, s * h * ppm + 2, (g - 0.016) * ppm, (h - 0.018) * ppm)
      x += g
    }
  }
  speck(c, P, P, 3000, r, ['#3a2214', '#efd9bd'], 0.18)
  return { color: repeat(el, METER, METER), relief: repeat(kab.el, METER, METER, false) }
}

/** Carpet with beige speckles and red prayer-row lines as in the photo: lines parallel to the qibla, 1.25 m apart. */
function carpetTexture() {
  const P = 512, METER = 1.25
  const { el, c } = canvas(P)
  const r = random(3)
  c.fillStyle = '#b5a483'; c.fillRect(0, 0, P, P)
  speck(c, P, P, 5000, r, ['#9d8c6c', '#c6b797', '#a89877'], 0.5, 3)
  c.fillStyle = '#4a4034'
  for (let y = 18; y < P - 50; y += 18) for (let x = (y % 36 ? 9 : 0); x < P; x += 18) c.fillRect(x, y, 3, 3)
  c.fillStyle = '#92222a'; c.fillRect(0, P - 46, P, 34)
  c.fillStyle = '#b8434a'; for (let x = 0; x < P; x += 16) c.fillRect(x, P - 34, 8, 8)
  c.fillStyle = '#dcc8a0'; c.fillRect(0, P - 46, P, 2); c.fillRect(0, P - 13, P, 2)
  return repeat(el, METER, METER)
}

function redCarpet() {
  const { el, c } = canvas(256)
  c.fillStyle = '#a4152a'; c.fillRect(0, 0, 256, 256)
  speck(c, 256, 256, 2500, random(8), ['#7e0e1f', '#c33043'], 0.45, 3)
  return repeat(el, 0.8, 0.8)
}

function stonePavingTexture() {
  const P = 512
  const { el, c } = canvas(P)
  const r = random(12)
  c.fillStyle = '#6b6a60'; c.fillRect(0, 0, P, P)
  const ROW = 4
  for (let s = 0; s < ROW; s++) {
    let x = s % 2 ? -64 : 0
    while (x < P) {
      const g = 96 + r() * 90, t = r()
      const v = 128 + t * 46
      c.fillStyle = `rgb(${v | 0},${(v - 4) | 0},${(v - 14) | 0})`
      c.fillRect(x + 2, (s * P) / ROW + 2, g - 4, P / ROW - 4)
      x += g
    }
  }
  speck(c, P, P, 5000, r, ['#55524a', '#cac5b5'], 0.2, 3)
  return repeat(el, 2.4, 2.4)
}

function grassTexture() {
  const P = 512
  const { el, c } = canvas(P)
  const r = random(21)
  c.fillStyle = '#5b6c33'; c.fillRect(0, 0, P, P)
  speck(c, P, P, 16000, r, ['#46582a', '#73853f', '#8b8f4e', '#3a4a26'], 0.55, 5)
  return repeat(el, 5, 5)
}

function woodTexture(seed: number, base: string, dark: string) {
  const { el, c } = canvas(256)
  const r = random(seed)
  c.fillStyle = base; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = dark
  for (let i = 0; i < 70; i++) {
    const y = r() * 256
    c.globalAlpha = 0.06 + r() * 0.14
    c.lineWidth = 1 + r() * 2
    c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(90, y + r() * 8 - 4, 170, y + r() * 8 - 4, 256, y); c.stroke()
  }
  c.globalAlpha = 1
  return repeat(el, 1, 1)
}

/** Kündekâri impression: lozenge interlocking on dark wood (minbar side face). */
function interlockTexture() {
  const { el, c } = canvas(256)
  c.fillStyle = '#3a2214'; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = '#7a5230'; c.lineWidth = 7
  for (let i = -256; i < 512; i += 64) {
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 256, 256); c.stroke()
    c.beginPath(); c.moveTo(i + 256, 0); c.lineTo(i, 256); c.stroke()
  }
  return repeat(el, 0.5, 0.5)
}

/** Stained glass: lozenge panes, yellow in the top and bottom rows (the interior windows in the photo). */
function stainedGlass() {
  const G = 256, H = 512
  const { el, c } = canvas(G, H)
  c.fillStyle = '#f5f2e6'; c.fillRect(0, 0, G, H)
  const r = random(5)
  const n = 42
  for (let y = 60; y < H - 40; y += n) for (let x = 0; x < G + n; x += n * 1.25) {
    const ox = ((y - 60) / n) % 2 ? n * 0.625 : 0
    c.fillStyle = r() > 0.45 ? '#7fbf7a' : '#d9efdb'
    c.beginPath(); c.moveTo(x + ox, y - n * 0.46); c.lineTo(x + ox + n * 0.56, y); c.lineTo(x + ox, y + n * 0.46); c.lineTo(x + ox - n * 0.56, y); c.closePath(); c.fill()
    c.strokeStyle = '#7d7b70'; c.lineWidth = 3; c.stroke()
  }
  c.fillStyle = '#f4be2a'; c.fillRect(0, H - 46, G, 46); c.fillRect(0, 0, G, 58)
  c.strokeStyle = '#7d7b70'; c.lineWidth = 3; c.strokeRect(2, H - 46, G - 4, 44)
  c.beginPath(); c.moveTo(G / 2, 0); c.lineTo(G / 2, 58); c.moveTo(0, 58); c.lineTo(G, 58); c.stroke()
  return single(el)
}

/** White plaster revzen seen from outside: dark hexagonal holes. */
function transom() {
  const G = 256, H = 512
  const { el, c } = canvas(G, H)
  c.fillStyle = '#ece6d6'; c.fillRect(0, 0, G, H)
  c.fillStyle = '#2b3338'
  const d = 19
  for (let y = 8, s = 0; y < H + d; y += d * 1.28, s++) for (let x = s % 2 ? d : 0; x < G + d; x += d * 2) {
    c.beginPath(); c.ellipse(x, y, d * 0.62, d * 0.46, 0, 0, Math.PI * 2); c.fill()
  }
  return single(el)
}

/** Lower window: iron grille from outside, dark void behind it. */
function balustrade() {
  const { el, c } = canvas(256, 340)
  c.fillStyle = '#23272a'; c.fillRect(0, 0, 256, 340)
  c.strokeStyle = '#0b0c0d'; c.lineWidth = 10
  for (let x = 32; x < 256; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 340); c.stroke() }
  for (let y = 38; y < 340; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke() }
  return single(el)
}

/** Lower window from inside: outdoor light behind the open leaves. */
function daylight() {
  const { el, c } = canvas(128, 170)
  const d = c.createLinearGradient(0, 0, 0, 170)
  d.addColorStop(0, '#fbf8ee'); d.addColorStop(0.6, '#f0ead9'); d.addColorStop(1, '#d9cba9')
  c.fillStyle = d; c.fillRect(0, 0, 128, 170)
  c.strokeStyle = '#6a4427'; c.lineWidth = 5
  c.strokeRect(0, 0, 128, 170)
  c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 170); c.moveTo(0, 85); c.lineTo(128, 85); c.stroke()
  return single(el)
}

/** Round panel on the wall: no inscription, floral wreath on gold ground. Calligraphy is not imitated. */
function medallion() {
  const { el, c } = canvas(256)
  c.fillStyle = '#e8ded0'; c.fillRect(0, 0, 256, 256)
  const r = c.createRadialGradient(128, 128, 20, 128, 128, 125)
  r.addColorStop(0, '#c9a862'); r.addColorStop(1, '#a4823f')
  c.fillStyle = r; c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill()
  c.strokeStyle = '#3b2a12'; c.lineWidth = 4; c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.stroke()
  c.fillStyle = '#d7c088'; c.beginPath(); c.arc(128, 128, 76, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#3f6b3b'
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    c.save(); c.translate(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); c.rotate(a + 0.6)
    c.beginPath(); c.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2); c.fill(); c.restore()
  }
  c.strokeStyle = '#6d5526'; c.lineWidth = 3
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    c.beginPath(); c.moveTo(128, 128); c.quadraticCurveTo(128 + Math.cos(a + 0.5) * 44, 128 + Math.sin(a + 0.5) * 44, 128 + Math.cos(a) * 62, 128 + Math.sin(a) * 62); c.stroke()
  }
  return single(el)
}

/** Mihrab frame band: interlaced ornament on cream ground and blue flowers in the lower part. Motifs only, instead of inscription. */
function mihrabBand() {
  const { el, c } = canvas(96, 768)
  c.fillStyle = '#efe7d3'; c.fillRect(0, 0, 96, 768)
  c.fillStyle = '#3a342a'; c.fillRect(0, 0, 8, 768); c.fillRect(88, 0, 8, 768)
  c.strokeStyle = '#3a342a'; c.lineWidth = 6
  for (let y = 0; y < 400; y += 48) {
    c.beginPath(); c.moveTo(14, y); c.bezierCurveTo(60, y + 12, 34, y + 36, 82, y + 48); c.stroke()
    c.beginPath(); c.moveTo(82, y); c.bezierCurveTo(36, y + 12, 62, y + 36, 14, y + 48); c.stroke()
  }
  for (let y = 430; y < 760; y += 72) {
    c.fillStyle = '#2f6fb0'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      c.beginPath(); c.ellipse(48 + Math.cos(a) * 15, y + Math.sin(a) * 15, 13, 9, a, 0, Math.PI * 2); c.fill()
    }
    c.fillStyle = '#82b37a'; c.fillRect(46, y + 18, 4, 36)
    c.beginPath(); c.ellipse(30, y + 40, 12, 6, -0.6, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(66, y + 40, 12, 6, 0.6, 0, Math.PI * 2); c.fill()
  }
  return single(el)
}

/** Lower half of the mihrab: green ground, gray curtain painting opening to both sides and a dark pendant in the middle (based on the photo). */
function mihrabPaint() {
  const { el, c } = canvas(256, 384)
  c.fillStyle = '#a9c79a'; c.fillRect(0, 0, 256, 384)
  c.fillStyle = '#4c5866'; c.strokeStyle = '#d7dce0'; c.lineWidth = 3
  for (const s of [0, 1]) {
    c.save()
    if (s) { c.translate(256, 0); c.scale(-1, 1) }
    c.beginPath(); c.moveTo(0, 0); c.lineTo(112, 0); c.bezierCurveTo(100, 120, 40, 150, 28, 300); c.lineTo(0, 310); c.closePath(); c.fill(); c.stroke()
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(i * 22, 0); c.bezierCurveTo(i * 20, 100, i * 8, 180, 8 + i * 4, 300); c.stroke() }
    c.restore()
  }
  c.fillStyle = '#6b5a3b'
  c.beginPath(); c.moveTo(128, 30); c.lineTo(160, 90); c.lineTo(128, 160); c.lineTo(96, 90); c.closePath(); c.fill()
  c.fillStyle = '#31506b'
  c.beginPath(); c.moveTo(128, 56); c.lineTo(146, 92); c.lineTo(128, 130); c.lineTo(110, 92); c.closePath(); c.fill()
  return single(el)
}

/** Minaret transition band: striped brick and dark stone between white marble triangles (based on the photo). */
function turkishTriangle() {
  const { el, c } = canvas(256, 128)
  c.fillStyle = '#7a4a34'; c.fillRect(0, 0, 256, 128)
  c.fillStyle = '#5d6168'
  for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(i * 128, 128); c.lineTo(i * 128 + 64, 0); c.lineTo(i * 128 + 128, 128); c.closePath(); c.fill() }
  c.fillStyle = '#e3ddd0'
  c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 128); c.lineTo(128, 0); c.closePath(); c.fill()
  c.beginPath(); c.moveTo(128, 0); c.lineTo(192, 128); c.lineTo(256, 0); c.closePath(); c.fill()
  return single(el)
}

function goldHeadstone() {
  const { el, c } = canvas(160, 340)
  c.fillStyle = '#2d2316'; c.fillRect(0, 0, 160, 340)
  c.fillStyle = '#c49a3c'; c.fillRect(6, 6, 148, 328)
  c.fillStyle = '#433219'
  const r = random(31)
  // Evenly spaced ornament lines giving a relief impression instead of imitating inscription
  for (let y = 22; y < 330; y += 22) for (let x = 14; x < 146; x += 12 + r() * 6) c.fillRect(x, y, 5, 10)
  return single(el)
}

function cypressTexture() {
  const { el, c } = canvas(256)
  const r = random(66)
  c.fillStyle = '#20381f'; c.fillRect(0, 0, 256, 256)
  speck(c, 256, 256, 9000, r, ['#16291a', '#2f5230', '#3c6538'], 0.7, 5)
  return repeat(el, 3, 3)
}

function leafTexture() {
  const { el, c } = canvas(256)
  const r = random(67)
  c.fillStyle = '#4a6230'; c.fillRect(0, 0, 256, 256)
  speck(c, 256, 256, 9000, r, ['#34482a', '#6f8540', '#90994d'], 0.7, 6)
  return repeat(el, 4, 4)
}

export function umurbeyMaterials() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const loader = new THREE.TextureLoader()
  const photo = (ad: string) => {
    if (PUBLIC_BUILD) return null
    const f = loader.load(`/images/umurbey-complex/model/${ad}.jpg`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const alternating = alternatingTexture(11, { stoneColor: ['#8f7f58', '#998862', '#85764f', '#93835c'], mortar: '#a0937b', stoneWidth: 0.36, stoneLen: 0.24, brickRow: 3 })
  const open = alternatingTexture(23, { stoneColor: ['#c5bba2', '#ccc3ac', '#bcb196', '#c3b99f'], mortar: '#a99d86', stoneWidth: 0.42, stoneLen: 0.26, brickRow: 3 })
  const brick = brickTexture()
  const bg = (color: THREE.Texture, kab: THREE.Texture, measure: number, p: THREE.MeshStandardMaterialParameters = {}) => pbr({ map: color, bumpMap: kab, bumpScale: measure, roughness: 0.92, ...p })
  return {
    alternating: bg(alternating.color, alternating.relief, 1.1),
    alternatingLight: bg(open.color, open.relief, 1.1),
    brick: bg(brick.color, brick.relief, 0.8),
    roofTile: pbr({ map: roofTileTexture(), roughness: 0.72, side: THREE.DoubleSide }),
    plaster: pbr({ color: '#c6cacb', roughness: 0.92, side: THREE.DoubleSide }),
    plasterOuter: pbr({ color: '#d8d2c2', roughness: 0.92, side: THREE.DoubleSide }),
    muqarnas: pbr({ color: '#c9cbc8', roughness: 0.85, side: THREE.DoubleSide }),
    marble: pbr({ color: '#d7d3c9', roughness: 0.42 }),
    terraceMarble: pbr({ color: '#c9c5ba', roughness: 0.4 }),
    cream: pbr({ color: '#c4b897', roughness: 0.82 })
    ,plaque: pbr({ color: '#6d5a2c', roughness: 0.5, metalness: 0.2 }),
    darkStone: pbr({ color: '#6c6f72', roughness: 0.8 }),
    leadCover: pbr({ color: '#a8acb0', roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide }),
    carpet: pbr({ map: carpetTexture(), roughness: 0.96 }),
    redCarpet: pbr({ map: redCarpet(), roughness: 0.95 }),
    stonePaving: pbr({ map: stonePavingTexture(), roughness: 0.88 }),
    grass: pbr({ map: grassTexture(), roughness: 1 }),
    wood: pbr({ map: woodTexture(1, '#7a4a28', '#3f2412'), roughness: 0.55 }),
    woodDark: pbr({ map: woodTexture(2, '#3f2616', '#1d1009'), roughness: 0.5 }),
    interlock: pbr({ map: interlockTexture(), roughness: 0.5 }),
    brownTileBottom: pbr({ map: woodTexture(4, '#6a3a1f', '#2f1809'), roughness: 0.7, side: THREE.DoubleSide }),
    brass: pbr({ color: '#c98a45', metalness: 0.8, roughness: 0.32 }),
    bronze: pbr({ color: '#6a5a3a', metalness: 0.7, roughness: 0.45 }),
    dark: pbr({ color: '#23262a', roughness: 0.7, side: THREE.DoubleSide }),
    cypress: pbr({ map: cypressTexture(), roughness: 1 }),
    leaf: pbr({ map: leafTexture(), roughness: 1 }),
    bodyB: pbr({ color: '#4a3b2e', roughness: 1 }),
    green: pbr({ color: '#2f7a53', roughness: 0.55 }),
    graveInner: pbr({ color: '#4e6030', roughness: 1 }),
    curtain: pbr({ color: '#8c1522', roughness: 0.9, side: THREE.DoubleSide }),
    stainedGlass: new THREE.MeshBasicMaterial({ map: stainedGlass(), color: new THREE.Color(1.2, 1.2, 1.15) }),
    transom: pbr({ map: transom(), roughness: 0.9 }),
    balustrade: pbr({ map: balustrade(), roughness: 0.7 }),
    daylight: new THREE.MeshBasicMaterial({ map: daylight(), color: new THREE.Color(1.15, 1.15, 1.1) }),
    medallion: pbr({ map: medallion(), roughness: 0.55, metalness: 0.25, transparent: false }),
    mihrabBand: pbr({ map: mihrabBand(), roughness: 0.55 }),
    mihrabPaint: pbr({ map: mihrabPaint(), roughness: 0.75 }),
    turkishTriangle: pbr({ map: turkishTriangle(), roughness: 0.6 }),
    headstone: pbr({ map: goldHeadstone(), roughness: 0.45, metalness: 0.45 }),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.6) }),
    water: pbr({ color: '#65878a', roughness: 0.2, metalness: 0.2 }),
    // Stone endowment deeds: real photos from the Drive archive; in the public build, a plain dark panel without photos.
    deed1: pbr({ map: photo('deed-1'), color: PUBLIC_BUILD ? '#3a3020' : '#a8a8a8', roughness: 0.6 }),
    deed2: pbr({ map: photo('deed-2'), color: PUBLIC_BUILD ? '#3a3020' : '#a8a8a8', roughness: 0.6 }),
    fountainInscription: pbr({ map: photo('fountain-tap-inscription'), color: PUBLIC_BUILD ? '#3a3020' : '#ffffff', roughness: 0.5 }),
  }
}
export type UmurbeyMaterials = ReturnType<typeof umurbeyMaterials>
