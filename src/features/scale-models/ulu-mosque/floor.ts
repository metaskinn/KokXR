// Ulu Camii interior floor: carpet, şadırvan marble, door-front stones and skirting. Textures are generated in code.
// The form is interpreted from archive photos: a single-strip spiral saf band, a three-lobed motif facing the qibla,
// faded and dark blotches; veined slabs fanning out around the pool. The pattern is not an exact copy;
// dimensions (saf spacing 2.2 m, band 30 cm, motif 20 cm) are estimated from the photo, not measured.
// Dimensions of the skirting and door-front stones are representative.
//
// Large-scale tone (contact shadow, light pool, fading) lives in vertex colors: on Quest there is no shader
// noise or normal map; sharp-edged blotches are computed per pixel only on desktop.
import * as THREE from 'three'
import { WALL, BAY_X, BAY_Z, Bucket, FOUNTAIN_ROW, FOUNTAIN_COLUMN, YX, YZ, boxG, px, pz, place } from '../uluMosquePiece'
import { makeNoise, lightDevice, random, repeated, canvas, smooth } from '../uluMosqueFloor'
import type { UluMosqueMaterials } from '../uluMosqueTextures'

const FLOOR = 0.7
const sx = px(FOUNTAIN_COLUMN + 0.5), sz = pz(FOUNTAIN_ROW + 0.5)
const DOOR_Z = sz
/** Edge of the marble area: the railing feet stand on this area, the stools are on the top face. */
const MARBLE_G = BAY_X - 3.2, MARBLE_D = BAY_Z - 3.2, MARBLE_TOP = FLOOR + 0.1
const CARPET_REPEAT = 4.4
const MARBLE_METER = 10.6

const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Carpet motif: a pointed leaf in the middle, curled wings to both sides, a stem below. Its tip points up on the canvas, i.e. towards the qibla. */
function carpetMotif(c: CanvasRenderingContext2D, x: number, y: number, o: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(o, o)
  c.beginPath()
  c.moveTo(0, -1)
  c.bezierCurveTo(0.3, -0.7, 0.4, -0.38, 0.15, -0.1)
  c.bezierCurveTo(0.32, -0.2, 0.52, -0.3, 0.76, -0.24)
  c.bezierCurveTo(0.62, -0.12, 0.62, 0.02, 0.5, 0.12)
  c.lineTo(0.56, 0.28)
  c.bezierCurveTo(0.38, 0.3, 0.24, 0.22, 0.1, 0.14)
  c.lineTo(0.07, 0.42)
  c.lineTo(0.26, 0.54); c.lineTo(0.06, 0.56)
  c.lineTo(0, 0.86)
  c.lineTo(-0.06, 0.56); c.lineTo(-0.26, 0.54)
  c.lineTo(-0.07, 0.42)
  c.lineTo(-0.1, 0.14)
  c.bezierCurveTo(-0.24, 0.22, -0.38, 0.3, -0.56, 0.28)
  c.lineTo(-0.5, 0.12)
  c.bezierCurveTo(-0.62, 0.02, -0.62, -0.12, -0.76, -0.24)
  c.bezierCurveTo(-0.52, -0.3, -0.32, -0.2, -0.15, -0.1)
  c.bezierCurveTo(-0.4, -0.38, -0.3, -0.7, 0, -1)
  c.closePath(); c.fill(); c.restore()
}

function leaflet(c: CanvasRenderingContext2D, x: number, y: number, b: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a)
  c.beginPath(); c.moveTo(0, -b)
  c.quadraticCurveTo(b * 0.55, -b * 0.1, 0, b)
  c.quadraticCurveTo(-b * 0.55, -b * 0.1, 0, -b)
  c.fill(); c.restore()
}

/** Saf band: two intertwining branches form rings, with spiral shoots and leaves inside the rings. */
function rowBand(c: CanvasRenderingContext2D, y: number, B: number, s: number) {
  const count = 8, L = B / count, burden = 0.128 * s
  const branch = (amplitude: number, slip: number, thick: number) => {
    c.lineWidth = thick * s
    c.beginPath()
    for (let x = -L, first = true; x <= B + L; x += L / 32, first = false) {
      // The top of the sine is flattened: it becomes a round ring, not pointed like a leaf.
      const wave = Math.sin((2 * Math.PI * (x + slip)) / L)
      const yy = y + amplitude * Math.sign(wave) * Math.pow(Math.abs(wave), 0.62)
      if (first) c.moveTo(x, yy)
      else c.lineTo(x, yy)
    }
    c.stroke()
  }
  c.lineCap = 'round'
  branch(burden, 0, 0.026); branch(-burden, 0, 0.026)
  for (let i = -1; i <= count * 2; i++) {
    const cx = ((i + 0.5) * L) / 2, dir = i & 1 ? 1 : -1
    // Inside the ring a thick one-turn spiral with a leaf at its tip
    c.lineWidth = 0.019 * s
    c.beginPath()
    let ux = 0, uy = 0
    for (let t = 0; t <= 1; t += 0.05) {
      const angle = dir * (t * 5 - 1.6), r = burden * 0.76 * (1 - t * 0.74)
      ux = cx + Math.cos(angle) * r; uy = y + Math.sin(angle) * r * dir
      if (t === 0) c.moveTo(ux, uy)
      else c.lineTo(ux, uy)
    }
    c.stroke()
    leaflet(c, ux, uy, 0.03 * s, dir * 2.2)
    leaflet(c, cx - dir * burden * 0.5, y + dir * burden * 0.5, 0.036 * s, dir * 0.8)
    leaflet(c, cx + dir * burden * 0.56, y - dir * burden * 0.4, 0.032 * s, -dir * 1.1)
    // S-curve connecting the rings: runs from the branch knot to the next ring.
    const nx = cx + (L / 4), ny = y
    c.lineWidth = 0.012 * s
    c.beginPath(); c.moveTo(nx - burden * 0.5, ny - dir * burden * 0.62)
    c.bezierCurveTo(nx - burden * 0.1, ny - dir * burden * 0.1, nx + burden * 0.1, ny + dir * burden * 0.1, nx + burden * 0.5, ny + dir * burden * 0.62)
    c.stroke()
    leaflet(c, nx, ny, 0.024 * s, dir * 0.7)
    // Leaves spilling from the branch's outer curve
    for (const k of [-1, -0.2, 0.6]) leaflet(c, cx + k * burden * 0.62, y + dir * burden * 1.12, 0.028 * s, k * 1.3)
  }
}

/**
 * Carpet: two saf bands and staggered motif rows on a light ground, pile grain and brush marks. The texture is neutral;
 * vertex color and material color make it dusty rose or olive green. Repeat: 4.4 m (two safs).
 */
function carpetTexture(lite: boolean) {
  const B = lite ? 1024 : 2048, s = B / CARPET_REPEAT
  const { el, c } = canvas(B)
  const r = random(211)
  c.fillStyle = '#fbf8f4'
  c.fillRect(0, 0, B, B)
  const MOTIF = '#aa9156'
  c.fillStyle = MOTIF; c.strokeStyle = MOTIF
  const rowGap = B / 2
  for (const y of [rowGap * 0.5, rowGap * 1.5]) rowBand(c, y, B, s)
  // Three rows of motifs in each saf interval; the rows are staggered.
  const column = 6, row = 3
  for (let k = 0; k < 2; k++) for (let j = 0; j < row; j++) {
    const y = rowGap * (k + 0.5) + (rowGap * (j + 1)) / (row + 1)
    for (let i = 0; i < column; i++) {
      const x = ((i + (j % 2) * 0.5 + 0.25) * B) / column
      const a = (r() - 0.5) * 0.14
      for (const oy of y > B - 0.2 * s ? [y, y - B] : [y]) carpetMotif(c, x, oy, 0.1 * s, a)
    }
  }
  // Joint: a thin, darkish seam line at one edge of the band.
  c.fillStyle = 'rgba(92,70,58,0.2)'
  for (const y of [rowGap * 0.5, rowGap * 1.5]) c.fillRect(0, y + 0.172 * s, B, Math.max(1, 0.006 * s))

  // Pile: knot grain, row marks, brush marks along the saf direction and soft tone variation.
  const fbm = makeNoise(37), M = 256, stain = new Float32Array(M * M)
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
    const u = x / M, v = y / M
    const wide = fbm(u * 6, v * 6, 6, 3), brush = fbm(u * 6, v * 42, 6, 2)
    stain[y * M + x] = (wide - 0.5) * 0.11 + (brush - 0.5) * 0.09
  }
  const data = c.getImageData(0, 0, B, B), px_ = data.data
  const step = lite ? 1 : 2, D = B / step, knot = new Float32Array(D * D)
  for (let i = 0; i < knot.length; i++) knot[i] = r()
  for (let y = 0; y < B; y++) {
    const rowAlt = ((y / step) | 0) & 1 ? 0.985 : 1.012, ly = (y * M) / B, ly0 = ly | 0, fy = ly - ly0
    for (let x = 0; x < B; x++) {
      const lx = (x * M) / B, lx0 = lx | 0, fx = lx - lx0, x1 = (lx0 + 1) % M, y1 = (ly0 + 1) % M
      const a = stain[ly0 * M + lx0], b = stain[ly0 * M + x1], e = stain[y1 * M + lx0], f = stain[y1 * M + x1]
      const l = a + (b - a) * fx + (e - a + (a - b - e + f) * fx) * fy
      const t = (0.9 + knot[((y / step) | 0) * D + ((x / step) | 0)] * 0.15) * rowAlt * (0.985 + l)
      const i = (y * B + x) * 4
      px_[i] = Math.min(255, px_[i] * t); px_[i + 1] = Math.min(255, px_[i + 1] * t); px_[i + 2] = Math.min(255, px_[i + 2] * t)
    }
  }
  c.putImageData(data, 0, 0)
  const color = repeated(el, CARPET_REPEAT, true)
  if (lite) return { color, normal: null }

  // Normal map only on desktop: pile grain and the motif's cut pile.
  const N = B >> 1, height = new Float32Array(N * N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = ((y * 2) * B + x * 2) * 4
    height[y * N + x] = ((px_[i] + px_[i + 1] + px_[i + 2]) / 765) * 1.1 + knot[y * D + x] * 0.55
  }
  const nt = canvas(N), nv = nt.c.createImageData(N, N), nd = nv.data, g = 2
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (height[y * N + ((x + N - 1) % N)] - height[y * N + ((x + 1) % N)]) * g
    const dy = (height[((y + 1) % N) * N + x] - height[((y + N - 1) % N) * N + x]) * g
    const u = 1 / Math.hypot(dx, dy, 1), i = (y * N + x) * 4
    nd[i] = (dx * u * 0.5 + 0.5) * 255; nd[i + 1] = (dy * u * 0.5 + 0.5) * 255; nd[i + 2] = (u * 0.5 + 0.5) * 255; nd[i + 3] = 255
  }
  nt.c.putImageData(nv, 0, 0)
  return { color, normal: repeated(nt.el, CARPET_REPEAT, false) }
}

/** A piece of Marmara marble: grey-blue vein bands flowing in one direction on a white ground. */
function marblePiece(seed: number, dark: number) {
  const B = 512, { el, c } = canvas(B), fbm = makeNoise(seed), data = c.createImageData(B, B), d = data.data
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const u = x / B, v = y / B
    const distort = fbm(u * 3, v * 3, 3, 3) - 0.5
    const belt = fbm(u * 3, v * 22 + distort * 2.2, 22, 3)
    const thin = fbm(u * 5, v * 70 + distort * 7, 35, 2)
    const t = Math.min(1, smooth(0.48, 0.72, belt) * 0.58 + smooth(0.6, 0.74, thin) * 0.34)
    const i = (y * B + x) * 4
    d[i] = mix(238, 142 - dark, t); d[i + 1] = mix(238, 148 - dark, t); d[i + 2] = mix(234, 154 - dark, t); d[i + 3] = 255
  }
  c.putImageData(data, 0, 0)
  return el
}

/**
 * Şadırvan paving: a single (non-repeating) 10.6 m texture. Slabs fan out from the pool's sixteen corners,
 * with slanted joints; a few dark green patches and dirt at the stool bases and pool edge are as in the photo.
 */
function marbleTexture(lite: boolean) {
  const B = lite ? 1024 : 2048, s = B / MARBLE_METER, o = B / 2
  const { el, c } = canvas(B)
  const reliefCanvas = lite ? null : canvas(1024)
  const r = random(97)
  const pieces = [marblePiece(131, 0), marblePiece(149, 18)]
  c.fillStyle = '#4a4744'
  c.fillRect(0, 0, B, B)
  if (reliefCanvas) { reliefCanvas.c.fillStyle = '#d0d0d0'; reliefCanvas.c.fillRect(0, 0, 1024, 1024) }

  const CORNER = Math.PI / 8
  const cornerR = (rad: number, t: number) => {
    const m = ((t % CORNER) + CORNER) % CORNER
    return (rad * Math.cos(CORNER / 2)) / Math.cos(m - CORNER / 2)
  }
  // World: x = sin(t), z = cos(t). Up on the canvas is +z (qibla).
  const point = (rad: number, t: number): [number, number] => { const q = cornerR(rad, t); return [o + Math.sin(t) * q * s, o - Math.cos(t) * q * s] }
  const rings = [3.55, 4.5, 5.6, 7.1, 8.4], numbers = [12, 13, 16, 13]
  const plaques: [number, number][][] = []
  const darkPlaque = new Set<number>()
  rings.slice(0, -1).forEach((inner, h) => {
    const outer = rings[h + 1], n = numbers[h], slip = r() * 2, slope = (h % 2 ? -1 : 1) * (0.12 + r() * 0.1)
    const truncated: number[] = []
    for (let i = 0; i < n; i++) truncated.push(((i + slip + (r() - 0.5) * 0.5) / n) * Math.PI * 2)
    for (let i = 0; i < n; i++) {
      const a = truncated[i], b = i === n - 1 ? truncated[0] + Math.PI * 2 : truncated[i + 1]
      const pol: [number, number][] = []
      // Inner edge: runs straight from corner to corner.
      pol.push(point(inner, a))
      for (let k = Math.ceil(a / CORNER); k * CORNER < b; k++) pol.push(point(inner, k * CORNER))
      pol.push(point(inner, b))
      const a2 = a + slope, b2 = b + slope
      pol.push(point(outer, b2))
      for (let k = Math.floor(b2 / CORNER); k * CORNER > a2; k--) pol.push(point(outer, k * CORNER))
      pol.push(point(outer, a2))
      plaques.push(pol)
      if (h <= 1 && r() < 0.11) darkPlaque.add(plaques.length - 1)
    }
  })
  plaques.forEach((pol, n) => {
    let mx = 0, my = 0
    for (const [x, y] of pol) { mx += x; my += y }
    mx /= pol.length; my /= pol.length
    c.save()
    c.beginPath(); pol.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip()
    c.translate(mx, my)
    c.rotate(Math.atan2(my - o, mx - o) + (r() - 0.5) * 1.1 + (r() < 0.3 ? Math.PI / 2 : 0))
    const length = 3.6 * s
    c.drawImage(pieces[n % 2], -length / 2 - r() * 0.3 * s, -length / 2 - r() * 0.3 * s, length * 1.1, length * 1.1)
    c.setTransform(1, 0, 0, 1, 0, 0)
    // Tone per slab: grey, warm beige or a dark green patch.
    c.globalCompositeOperation = 'multiply'
    if (darkPlaque.has(n)) c.fillStyle = '#4c5a50'
    else { const t = r(), a = 216 + r() * 39 | 0; c.fillStyle = t < 0.3 ? `rgb(${a},${a - 12},${a - 34})` : `rgb(${a},${a},${a - 3})` }
    c.fillRect(0, 0, B, B)
    c.restore()
  })
  // Joints
  c.lineJoin = 'round'
  c.strokeStyle = 'rgba(58,54,50,0.8)'; c.lineWidth = Math.max(1.2, 0.012 * s)
  for (const pol of plaques) { c.beginPath(); pol.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke() }
  if (reliefCanvas) {
    const k = 1024 / B
    reliefCanvas.c.strokeStyle = '#1c1c1c'; reliefCanvas.c.lineWidth = Math.max(1, 0.014 * s * k)
    for (const pol of plaques) { reliefCanvas.c.beginPath(); pol.forEach(([x, y], i) => (i ? reliefCanvas.c.lineTo(x * k, y * k) : reliefCanvas.c.moveTo(x * k, y * k))); reliefCanvas.c.closePath(); reliefCanvas.c.stroke() }
  }

  c.globalCompositeOperation = 'multiply'
  // Pool base: water and soap marks, warm brown.
  const dip = c.createRadialGradient(o, o, 3.55 * s, o, o, 4.75 * s)
  dip.addColorStop(0, 'rgb(150,126,98)'); dip.addColorStop(0.35, 'rgb(208,192,170)'); dip.addColorStop(1, 'rgb(255,255,255)')
  c.fillStyle = dip; c.fillRect(0, 0, B, B)
  // Stool bases
  for (let n = 0; n < 14; n++) {
    const a = (n / 14) * Math.PI * 2, x = o + Math.sin(a) * 4.25 * s, y = o - Math.cos(a) * 4.25 * s
    const g = c.createRadialGradient(x, y, 0.1 * s, x, y, 0.42 * s)
    g.addColorStop(0, 'rgb(112,104,94)'); g.addColorStop(1, 'rgb(255,255,255)')
    c.fillStyle = g; c.fillRect(x - 0.45 * s, y - 0.45 * s, 0.9 * s, 0.9 * s)
  }
  // Railing bases
  const strips: [number, number, number, number][] = []
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    strips.push([a * 5.15, b * 3, 0.5, 3.8], [a * 2.95, b * 5.15, 4, 0.5])
  }
  c.fillStyle = 'rgb(186,178,168)'
  for (const [x, z, g, d] of strips) c.fillRect(o + (x - g / 2) * s, o - (z + d / 2) * s, g * s, d * s)
  // Broad blotches where people step: large-scale grey dirt.
  c.globalAlpha = 0.16
  c.drawImage(pieces[1], 0, 0, B, B)
  c.globalAlpha = 1
  c.globalCompositeOperation = 'source-over'
  // The drain cover to the north in the photo: a dark stone slab.
  const drainAngle = (7.5 / 14) * Math.PI * 2, kx = o + Math.sin(drainAngle) * 4.75 * s, ky = o - Math.cos(drainAngle) * 4.75 * s
  c.save(); c.translate(kx, ky); c.rotate(-drainAngle)
  c.fillStyle = '#6c665a'; c.fillRect(-0.36 * s, -0.27 * s, 0.72 * s, 0.54 * s)
  c.strokeStyle = '#2d2a26'; c.lineWidth = Math.max(1, 0.014 * s); c.strokeRect(-0.36 * s, -0.27 * s, 0.72 * s, 0.54 * s)
  c.fillStyle = '#26231f'; c.beginPath(); c.ellipse(0, 0, 0.05 * s, 0.025 * s, 0, 0, Math.PI * 2); c.fill()
  c.restore()

  return { color: repeated(el, MARBLE_METER, true), relief: reliefCanvas ? repeated(reliefCanvas.el, MARBLE_METER, false) : null }
}

/** Desktop: sharp-edged damp blotches and fine fading. Vertex color carries the large scale; this only sharpens the edges. */
function stainedCarpet<M extends THREE.MeshStandardMaterial>(m: M) {
  m.onBeforeCompile = (g) => {
    g.vertexShader = g.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorPos = position.xz;')
    g.fragmentShader = g.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec2 vFloorPos;
float floorHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1137)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float floorNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(floorHash(i), floorHash(i + vec2(1, 0)), f.x), mix(floorHash(i + vec2(0, 1)), floorHash(i + vec2(1, 1)), f.x), f.y); }
float floorFbm(vec2 p) { float t = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { t += a * floorNoise(p); p = p * 2.03 + 17.0; a *= 0.5; } return t; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ float damp = smoothstep(0.615, 0.635, floorFbm(vFloorPos * 0.34 + 41.0));
  float dry = smoothstep(0.56, 0.585, floorFbm(vFloorPos * vec2(0.5, 0.26) + 7.0));
  float fine = floorFbm(vFloorPos * 2.3);
  vec3 c = diffuseColor.rgb;
  c = mix(c, vec3(dot(c, vec3(0.33))) * 1.12, dry * 0.42);
  c *= mix(1.0, 0.72, damp) * (0.93 + 0.14 * fine);
  diffuseColor.rgb = c; }`)
  }
  m.customProgramCacheKey = () => 'ulu-floor-carpet'
  return m
}

/** Upward-facing grid; the tone function gives each vertex its color, `skip` removes cells that lie under the paving. */
function grid(x0: number, x1: number, z0: number, z1: number, y: number, step: number, tone: (x: number, z: number, c: number[]) => void, skip?: (x: number, z: number) => boolean) {
  const nx = Math.round((x1 - x0) / step), nz = Math.round((z1 - z0) / step), dx = (x1 - x0) / nx, dz = (z1 - z0) / nz
  const positions: number[] = [], nor: number[] = [], uv: number[] = [], color: number[] = [], c = [1, 1, 1]
  const add = (x: number, z: number) => {
    positions.push(x, y, z); nor.push(0, 1, 0); uv.push(x, z)
    tone(x, z, c); color.push(c[0], c[1], c[2])
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = x0 + i * dx, b = a + dx, e = z0 + j * dz, f = e + dz
    if (skip?.((a + b) / 2, (e + f) / 2)) continue
    add(a, e); add(a, f); add(b, e)
    add(b, e); add(a, f); add(b, f)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(color, 3))
  return g
}

/** Large-scale carpet tone: shadow at pier and wall bases, warm light under the chandelier, large faded and dirty blotches. */
function carpetTone() {
  const fbm = makeNoise(53), GX = BAY_X, GZ = BAY_Z
  return (x: number, z: number, c: number[]) => {
    const kx = Math.round((x + YX) / GX) * GX - YX, kz = Math.round((z + YZ) / GZ) * GZ - YZ
    const pier = Math.hypot(Math.max(Math.abs(x - kx) - 1.62, 0), Math.max(Math.abs(z - kz) - 1.62, 0))
    const mx = (Math.floor((x + YX) / GX) + 0.5) * GX - YX, mz = (Math.floor((z + YZ) / GZ) + 0.5) * GZ - YZ
    const pool = Math.exp(-((x - mx) ** 2 + (z - mz) ** 2) / 26)
    const wall = Math.min(YX - WALL - Math.abs(x), YZ - WALL - Math.abs(z))
    const shadow = mix(0.62, 1, smooth(0, 2.3, pier)) * mix(0.68, 1, smooth(0, 2, wall))
    const n1 = fbm((x + 70) * 0.19, (z + 70) * 0.26, 256, 3)
    const n2 = fbm((x + 90) * 0.42, (z + 40) * 0.42, 256, 3)
    const faded = smooth(0.5, 0.6, n1), dirty = smooth(0.56, 0.66, n2)
    const t = shadow * (0.86 + 0.2 * faded) * mix(1, 0.8, dirty)
    // Where faded the color shifts to grey (blue increases); where dirty all three drop together.
    c[0] = t * (0.9 + 0.3 * pool)
    c[1] = t * (0.9 + 0.27 * pool) * (1 + 0.035 * faded)
    c[2] = t * (0.9 + 0.2 * pool) * (1 + 0.09 * faded)
  }
}

/** Carpet, marble, door-front stones and skirting. The surfaces don't change the walk area: they are very thin. */
export function interiorFloor(k: Bucket, m: UluMosqueMaterials) {
  const lite = lightDevice()
  const carpet = carpetTexture(lite), marble = marbleTexture(lite)
  const carpetMat = (color: string, glow: string) => lite
    ? new THREE.MeshStandardMaterial({ map: carpet.color, color: color, roughness: 0.97, metalness: 0, vertexColors: true })
    : stainedCarpet(new THREE.MeshPhysicalMaterial({
      map: carpet.color, normalMap: carpet.normal, normalScale: new THREE.Vector2(0.55, 0.55), color: color, roughness: 0.97, metalness: 0,
      vertexColors: true, sheen: 0.32, sheenRoughness: 0.75, sheenColor: new THREE.Color(glow),
    }))
  // RGB medians of the light carpet samples in ERD05018: (197,155,136), (226,190,174).
  // These include the photo's lighting; they are interpreted as a mid-tone albedo + scene lighting.
  const rose = carpetMat('#cfb09f', '#e6cfb9')
  const olive = carpetMat('#a89e79', '#cdc6a0')
  const marbleMat = lite
    ? new THREE.MeshStandardMaterial({ map: marble.color, roughness: 0.3, metalness: 0, vertexColors: true })
    : new THREE.MeshPhysicalMaterial({ map: marble.color, bumpMap: marble.relief, bumpScale: 0.35, roughness: 0.32, metalness: 0, vertexColors: true, clearcoat: 0.5, clearcoatRoughness: 0.16 })

  const tone = carpetTone()
  const bx = BAY_X / 2, bz = BAY_Z / 2
  // The rose carpet of the şadırvan bay lies under the olive carpet: those cells are not drawn.
  k.add(grid(-YX + WALL, YX - WALL, -YZ + WALL, YZ - WALL, FLOOR, 0.65, tone, (x, z) => Math.abs(x - sx) < bx - 0.7 && Math.abs(z - sz) < bz - 0.7), rose)
  const mg = MARBLE_G / 2, md = MARBLE_D / 2
  k.add(grid(sx - bx, sx + bx, sz - bz, sz + bz, FLOOR + 0.012, 0.65, tone, (x, z) => Math.abs(x - sx) < mg - 0.7 && Math.abs(z - sz) < md - 0.7), olive)

  // Marble: single-piece texture on the top face, dirty stone border on the side edge.
  const uvMarble = (g: THREE.BufferGeometry, ux: number, uz: number) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) - ux, p.getZ(i) - uz)
    return g
  }
  const white = (_x: number, _z: number, c: number[]) => { c[0] = c[1] = c[2] = 1 }
  const ux = sx - MARBLE_METER / 2, uz = sz - MARBLE_METER / 2
  k.add(uvMarble(grid(sx - mg, sx + mg, sz - md, sz + md, MARBLE_TOP, MARBLE_G, white), ux, uz), marbleMat)
  k.add(place(boxG(MARBLE_G, 0.095, MARBLE_D), sx, FLOOR + 0.05, sz), m.marbleDark)
  // Marble passage running from the north railing gap to the carpet (seen towards the north in the photo).
  const passageZ0 = sz - bz + 0.35, passageZ1 = sz - md
  // Taken from a texture corner: the dark patches are only at the pool edge.
  k.add(uvMarble(grid(sx - 1.05, sx + 1.05, passageZ0, passageZ1, MARBLE_TOP, 2.1, white), sx - 1.55, passageZ0 - 0.2), marbleMat)
  k.add(place(boxG(2.1, 0.095, passageZ1 - passageZ0), sx, FLOOR + 0.05, (passageZ0 + passageZ1) / 2), m.marbleDark)

  // Door fronts: thin grey stone one meter in from the wall (the strip in front of the door niche in the photo).
  const wallFoot = (wallFar: (x: number, z: number) => number) => (x: number, z: number, c: number[]) => {
    const t = mix(0.5, 0.74, smooth(0, 0.95, wallFar(x, z)))
    c[0] = t; c[1] = t; c[2] = t * 1.02
  }
  const IX = YX - WALL, IZ = YZ - WALL, KG = 2.1, KD = 1.05
  k.add(uvMarble(grid(-KG, KG, -IZ, -IZ + KD, FLOOR + 0.014, 2.1, wallFoot((_x, z) => z + IZ)), ux - 1.4, uz + 20.2), marbleMat)
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? IX - KD : -IX, x1 = x0 + KD
    k.add(uvMarble(grid(x0, x1, DOOR_Z - KG, DOOR_Z + KG, FLOOR + 0.014, 2.1, wallFoot((x) => IX - Math.abs(x))), ux + s * 27, uz + 2), marbleMat)
  }

  // Skirting: low stone at the wall base, interrupted in front of the doors and the mihrab.
  const LOAD = 0.11, KAL = 0.035, y = FLOOR + LOAD / 2
  const piece = (a: number, b: number, fixed: number, alongX: boolean) => {
    const L = b - a, mid = (a + b) / 2
    k.add(alongX ? place(boxG(L, LOAD, KAL), mid, y, fixed) : place(boxG(KAL, LOAD, L), fixed, y, mid), m.marbleDark)
  }
  for (const s of [-1, 1]) {
    const side = s * (IX - KAL / 2)
    piece(-IZ, DOOR_Z - KG, side, false); piece(DOOR_Z + KG, IZ, side, false)
    piece(s > 0 ? KG : -IX, s > 0 ? IX : -KG, -IZ + KAL / 2, true)
    piece(s > 0 ? 3.7 : -IX, s > 0 ? IX : -3.7, IZ - KAL / 2, true)
  }
}
