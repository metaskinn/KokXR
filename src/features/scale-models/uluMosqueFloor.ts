// Ulu Camii interior floor: carpet and marble textures are generated pixel by pixel; no external images are used.
// Color and layout are interpreted from archive photos (ic-mekan, sadirvan); the pattern of the real carpet or
// paving is not copied. Textures tile seamlessly; the shader adds large-scale variation.
import * as THREE from 'three'

export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Touch devices and Quest: textures at half size, materials run without extra surface computation. */
export const lightDevice = () => matchMedia('(hover: none)').matches || /OculusBrowser|Quest/i.test(navigator.userAgent)

export function repeated(el: HTMLCanvasElement, meter: number, colored: boolean) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / meter, 1 / meter)
  t.anisotropy = lightDevice() ? 4 : 16
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function canvas(size: number) {
  const el = document.createElement('canvas')
  el.width = el.height = size
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Canvas is not available')
  return { el, c }
}

/** Seamless noise: repeats itself every `per` cells. */
export function makeNoise(seed: number) {
  const N = 256, r = random(seed), t = new Float32Array(N * N)
  for (let i = 0; i < t.length; i++) t[i] = r()
  const n = (x: number, y: number, per: number, ext: number) => {
    const ix = Math.floor(x), iy = Math.floor(y)
    let fx = x - ix, fy = y - iy
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    const x0 = ((ix % per) + per) % per, y0 = ((iy % per) + per) % per
    const x1 = (x0 + 1) % per, y1 = (y0 + 1) % per
    const d = (a: number, b: number) => t[(((b + ext) & 255) << 8) | ((a + ext) & 255)]
    const u = d(x0, y0) + (d(x1, y0) - d(x0, y0)) * fx
    const v = d(x0, y1) + (d(x1, y1) - d(x0, y1)) * fx
    return u + (v - u) * fy
  }
  /** fbm with a period of `per` cells; x and y are given in cell units. */
  return (x: number, y: number, per: number, octave: number) => {
    let s = 0, a = 0.5, topV = 0
    for (let i = 0; i < octave; i++) {
      s += a * n(x, y, per, i * 37); topV += a
      x *= 2; y *= 2; per *= 2; a *= 0.5
    }
    return s / topV
  }
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function drop(c: CanvasRenderingContext2D, x: number, y: number, b: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a)
  c.beginPath()
  c.moveTo(0, -b); c.bezierCurveTo(b * 0.62, -b * 0.3, b * 0.5, b * 0.72, 0, b)
  c.bezierCurveTo(-b * 0.5, b * 0.72, -b * 0.62, -b * 0.3, 0, -b)
  c.closePath(); c.fill(); c.restore()
}

/**
 * Carpet: transverse saf (prayer row) bands, staggered small drop motifs in between, and pile texture.
 * The texture is neutral; with the material color the same texture becomes a dusty-rose or olive-green carpet.
 * Two safs (2.4 m) form one repeat. Pile knots are about 5 mm.
 */
export function carpetTextures() {
  const B = lightDevice() ? 1024 : 2048
  const { el, c } = canvas(B)
  const r = random(83), PURE = B / 2, measure = B / 2048
  c.fillStyle = '#f3ebe3'
  c.fillRect(0, 0, B, B)

  for (let s = 0; s < 2; s++) {
    const y0 = s * PURE
    // Saf band: dark ground, thin double line and braided chain (about 12 cm).
    const band = 104 * measure
    c.fillStyle = '#94695c'
    c.fillRect(0, y0, B, band)
    c.fillStyle = '#5f3a30'
    c.fillRect(0, y0, B, 7 * measure); c.fillRect(0, y0 + band - 7 * measure, B, 7 * measure)
    c.fillStyle = '#dfcfc3'
    c.fillRect(0, y0 + 14 * measure, B, 4 * measure); c.fillRect(0, y0 + band - 18 * measure, B, 4 * measure)
    const count = 24, stepW = B / count, mid = y0 + band / 2
    c.lineWidth = 7 * measure
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5) * stepW
      c.strokeStyle = i % 2 ? '#ecdccd' : '#54322a'
      c.beginPath(); c.ellipse(x, mid, stepW * 0.62, 25 * measure, 0, 0, Math.PI * 2); c.stroke()
    }
    // Thin accompanying lines outside the band.
    c.fillStyle = '#a98a7d'
    c.fillRect(0, y0 + band + 22 * measure, B, 5 * measure)
    c.fillRect(0, y0 - 27 * measure + (s === 0 ? B : 0), B, 5 * measure)

    // Field: staggered pairs of drops (about 30 cm spacing).
    const column = 8, row = 3, area = PURE - band - 60 * measure
    c.fillStyle = '#7d4a3d'
    for (let j = 0; j < row; j++) for (let i = 0; i < column; i++) {
      const x = ((i + (j % 2) * 0.5 + (s % 2) * 0.25) * B) / column
      const y = y0 + band + 40 * measure + ((j + 0.5) * area) / row
      const a = (r() - 0.5) * 0.12
      drop(c, x, y - 30 * measure, 42 * measure, a)
      drop(c, x - 32 * measure, y + 26 * measure, 26 * measure, -0.95 + a)
      drop(c, x + 32 * measure, y + 26 * measure, 26 * measure, 0.95 + a)
    }
  }

  // Pile: knot-by-knot tone variation, row marks and soft blotches on top of the canvas pattern.
  const fbm = makeNoise(19), D = B >> 2
  const knot = new Float32Array(D * D)
  for (let i = 0; i < knot.length; i++) knot[i] = r()
  const data = c.getImageData(0, 0, B, B), px = data.data
  for (let y = 0; y < B; y++) {
    const row = (y >> 2) & 1 ? 0.975 : 1.02
    for (let x = 0; x < B; x++) {
      const i = (y * B + x) * 4, k = knot[(y >> 2) * D + (x >> 2)]
      const t = (0.86 + k * 0.24) * row
      px[i] = Math.min(255, px[i] * t); px[i + 1] = Math.min(255, px[i + 1] * t); px[i + 2] = Math.min(255, px[i + 2] * t)
    }
  }
  // Motif relief for the normal map is read here, since it is close to the brightness before the pile multiplier.
  const N = B >> 1, burden = new Float32Array(N * N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = ((y * 2) * B + x * 2) * 4
    const glossy = (px[i] + px[i + 1] + px[i + 2]) / 765
    burden[y * N + x] = knot[(y >> 1) * D + (x >> 1)] * 0.8 + glossy * 0.9 + fbm((x / N) * 64, (y / N) * 64, 64, 2) * 0.35
  }
  c.putImageData(data, 0, 0)

  const nt = canvas(N), nv = nt.c.createImageData(N, N), nd = nv.data, g = 2.2
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const right = burden[y * N + ((x + 1) % N)], left = burden[y * N + ((x + N - 1) % N)]
    const below = burden[((y + 1) % N) * N + x], top = burden[((y + N - 1) % N) * N + x]
    const dx = (left - right) * g, dy = (below - top) * g, u = 1 / Math.hypot(dx, dy, 1), i = (y * N + x) * 4
    nd[i] = (dx * u * 0.5 + 0.5) * 255; nd[i + 1] = (dy * u * 0.5 + 0.5) * 255; nd[i + 2] = (u * 0.5 + 0.5) * 255; nd[i + 3] = 255
  }
  nt.c.putImageData(nv, 0, 0)
  return { color: repeated(el, 2.4, true), normal: repeated(nt.el, 2.4, false) }
}

type Fbm = ReturnType<typeof makeNoise>

/** Veined grey-white marble: cloudy ground, main veins and fine cracks. `a`,`b` are integers: vein direction, stays seamless. */
function marblePixel(fbm: Fbm, u: number, v: number, a: number, b: number, ox: number, oy: number, tone: number, output: number[]) {
  const w1 = fbm(u * 6 + ox, v * 6 + oy, 6, 4), w2 = fbm(u * 6 + ox + 3, v * 6 + oy + 5, 6, 4)
  const ana = Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * a + v * b + (w1 - 0.5) * 3))), 16)
  const thin = Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * a * 3 - v * b * 2 + (w2 - 0.5) * 6))), 34)
  const cloud = smooth(0.42, 0.68, w2)
  const mix = Math.min(1, ana * (0.35 + w1 * 0.9) + thin * 0.28)
  for (let k = 0; k < 3; k++) {
    const open = [238, 238, 233][k], dark = [176, 181, 184][k], vein = [86, 92, 100][k]
    const z = open + (dark - open) * cloud * 0.72
    output[k] = (z + (vein - z) * mix) * tone
  }
}

/** Paving around the şadırvan: rows of large slabs, each slab with its own vein direction. Repeats every 4.2 m. */
export function marblePavingTextures() {
  const B = lightDevice() ? 512 : 1024, measure = B / 1024
  const { el, c } = canvas(B)
  const reliefCanvas = canvas(B)
  const r = random(29), fbm = makeNoise(47)
  const data = c.createImageData(B, B), px = data.data, color = [0, 0, 0]
  const dirs: [number, number][] = [[3, 1], [1, 3], [2, -2], [4, 1], [-1, 4], [3, 2]]
  reliefCanvas.c.fillStyle = '#d0d0d0'
  reliefCanvas.c.fillRect(0, 0, B, B)
  const joint = Math.max(1, Math.round(3 * measure))
  const rows = 4, glazeH = Math.floor(B / rows)
  for (let s = 0; s < rows; s++) {
    const y0 = s * glazeH, y1 = s === rows - 1 ? B : y0 + glazeH
    const count = 2 + Math.floor(r() * 2), slip = Math.floor(r() * B)
    for (let n = 0; n < count; n++) {
      const x0 = slip + Math.floor((n * B) / count), x1 = slip + Math.floor(((n + 1) * B) / count)
      const [a, b] = dirs[Math.floor(r() * dirs.length)]
      const ox = Math.floor(r() * 6), oy = Math.floor(r() * 6), tone = 0.93 + r() * 0.1
      for (let y = y0; y < y1; y++) for (let xh = x0; xh < x1; xh++) {
        const x = xh % B, i = (y * B + x) * 4
        const edge = y - y0 < joint || xh - x0 < joint
        marblePixel(fbm, x / B, y / B, a, b, ox, oy, edge ? tone * 0.45 : tone, color)
        px[i] = color[0]; px[i + 1] = color[1]; px[i + 2] = color[2]; px[i + 3] = 255
      }
      reliefCanvas.c.fillStyle = '#202020'
      reliefCanvas.c.fillRect(x0 % B, y0, joint, y1 - y0)
    }
    reliefCanvas.c.fillStyle = '#202020'
    reliefCanvas.c.fillRect(0, y0, B, joint)
  }
  c.putImageData(data, 0, 0)
  return { color: repeated(el, 4.2, true), relief: repeated(reliefCanvas.el, 4.2, false) }
}

/** Jointless veined marble for the pool body, base and pedestal. Repeats every 3 m. */
export function marbleBodyTexture() {
  const B = lightDevice() ? 512 : 1024
  const { el, c } = canvas(B)
  const fbm = makeNoise(61), data = c.createImageData(B, B), px = data.data, color = [0, 0, 0]
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const i = (y * B + x) * 4
    marblePixel(fbm, x / B, y / B, 2, 3, 0, 0, 1, color)
    px[i] = color[0]; px[i + 1] = color[1]; px[i + 2] = color[2]; px[i + 3] = 255
  }
  c.putImageData(data, 0, 0)
  return repeated(el, 3, true)
}

/** Seamless fine wave normal for the pool water. Repeats every 3 m. */
export function waterNormal() {
  const B = 512, nt = canvas(B), fbm = makeNoise(73), burden = new Float32Array(B * B)
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) burden[y * B + x] = fbm((x / B) * 10, (y / B) * 10, 10, 3)
  const nv = nt.c.createImageData(B, B), nd = nv.data, g = 7
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const dx = (burden[y * B + ((x + B - 1) % B)] - burden[y * B + ((x + 1) % B)]) * g
    const dy = (burden[((y + 1) % B) * B + x] - burden[((y + B - 1) % B) * B + x]) * g
    const u = 1 / Math.hypot(dx, dy, 1), i = (y * B + x) * 4
    nd[i] = (dx * u * 0.5 + 0.5) * 255; nd[i + 1] = (dy * u * 0.5 + 0.5) * 255; nd[i + 2] = (u * 0.5 + 0.5) * 255; nd[i + 3] = 255
  }
  nt.c.putImageData(nv, 0, 0)
  return repeated(nt.el, 3, false)
}
