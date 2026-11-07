// Ulu Camii interior şadırvan. Form and colors are interpreted from archive photos (ERD05081, sadirvan.jpg);
// dimensions are representative. Textures are generated in code: marble veining, stains and paving layout follow the photo's character
// and are not a stone-by-stone copy. The pool's sixteen corners are kept from the previous model.
import * as THREE from 'three'
import { Bucket, flatShadow, place } from '../uluMosquePiece'
import { lightDevice, random } from '../uluMosqueFloor'
import type { UluMosqueMaterials } from '../uluMosqueTextures'

type Region = [number, number, number, number]

const CORNER = 16
const R_BODY = 3.8, R_WATER = 3.69, BODY_H = 1.06, PEDESTAL_H = 0.14
const FLOOR_G = 10.6, FLOOR_D = 10.55
const STOOL = 14, R_STOOL = 4.3

// --- Atlas layout (2048 x 1024 logical pixels): water on the left, marble regions on the right ---
const region = (x: number, y: number, g: number, h: number): Region => {
  const p = 6
  return [(x + p) / 2048, 1 - (y + h - p) / 1024, (x + g - p) / 2048, 1 - (y + p) / 1024]
}
const FACES = [region(1024, 0, 512, 512), region(1536, 0, 512, 512), region(1024, 512, 512, 512)]
const JET = region(1536, 512, 512, 256)
const PEDESTAL = region(1536, 768, 512, 128)
const IVORY = region(1536, 896, 384, 128)
const PLANK = region(1920, 896, 128, 128)

/** Fits the UVs into the given atlas region. */
function uvRegion<G extends THREE.BufferGeometry>(g: G, b: Region, inverse = false) {
  const uv = g.attributes.uv
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
  for (let i = 0; i < uv.count; i++) {
    u0 = Math.min(u0, uv.getX(i)); u1 = Math.max(u1, uv.getX(i))
    v0 = Math.min(v0, uv.getY(i)); v1 = Math.max(v1, uv.getY(i))
  }
  for (let i = 0; i < uv.count; i++) {
    const u = (uv.getX(i) - u0) / (u1 - u0 || 1), v = (uv.getY(i) - v0) / (v1 - v0 || 1)
    uv.setXY(i, b[0] + (inverse ? 1 - u : u) * (b[2] - b[0]), b[1] + v * (b[3] - b[1]))
  }
  return g
}

const rotate = (points: [number, number][], piece: number) =>
  new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), piece)

function canvas(g: number, h: number, scale: number) {
  const el = document.createElement('canvas')
  el.width = g * scale; el.height = h * scale
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas is not available')
  c.scale(scale, scale)
  return { el, c }
}

function makeTexture(el: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Marble veining: draws long parallel strips at the given angle inside the selected area. The canvas must be clipped beforehand. */
function veins(c: CanvasRenderingContext2D, r: () => number, x: number, y: number, length: number, angle: number, count: number, dark: number, spreadCloth = 1) {
  c.save()
  c.translate(x, y); c.rotate(angle)
  // Bands cluster: in the stones in the photo the dark veins gather in the same strip.
  const cluster = (r() - 0.5) * length * 0.8
  for (let n = 0; n < count; n++) {
    const inCluster = r() < 0.6
    const v = inCluster ? cluster + (r() - 0.5) * length * 0.42 * spreadCloth : (r() - 0.5) * length * 1.1
    const thin = r() < 0.62
    const h = thin ? 0.6 + r() * 1.8 : 3 + r() * length * 0.05
    const a = (thin ? 0.2 + r() * 0.42 : 0.05 + r() * 0.13) * dark
    c.fillStyle = r() < 0.86 ? `rgba(66,64,78,${a})` : `rgba(255,253,250,${a * 1.4})`
    const u0 = -length * (0.3 + r() * 0.7), u1 = length * (0.3 + r() * 0.7)
    c.fillRect(u0, v, u1 - u0, h)
  }
  c.restore()
}

function stain(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, a: number) {
  c.save()
  c.translate(x, y); c.scale(rx, ry)
  const d = c.createRadialGradient(0, 0, 0.1, 0, 0, 1)
  d.addColorStop(0, `rgba(${color},${a})`); d.addColorStop(0.65, `rgba(${color},${a * 0.72})`); d.addColorStop(1, `rgba(${color},0)`)
  c.fillStyle = d
  c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill()
  c.restore()
}

/** Water and marble atlas: in a single texture, so the pool, jet and stools merge into one material. */
function atlasTexture(scale: number) {
  const { el, c } = canvas(2048, 1024, scale), r = random(4217)
  const area = (x: number, y: number, g: number, h: number, draw: () => void) => {
    c.save(); c.beginPath(); c.rect(x, y, g, h); c.clip(); draw(); c.restore()
  }

  // Water: milky turquoise; dark patches are the reflected dome and jet shadow, light patches the reflected cream walls.
  area(0, 0, 1024, 1024, () => {
    const t = c.createRadialGradient(512, 512, 60, 512, 512, 512)
    t.addColorStop(0, '#3f8592'); t.addColorStop(0.4, '#4f97a3'); t.addColorStop(1, '#6aabb0')
    c.fillStyle = t
    c.fillRect(0, 0, 1024, 1024)
    for (let n = 0; n < 34; n++) {
      const a = r() * Math.PI * 2, u = 120 + r() * 380
      const dark = r() < 0.45
      stain(c, 512 + Math.sin(a) * u, 512 + Math.cos(a) * u, 40 + r() * 110, 40 + r() * 110, dark ? '50,112,130' : '176,206,204', dark ? 0.42 : 0.4)
    }
    stain(c, 512, 512, 215, 215, '40,96,112', 0.6)
    // Reflection of distant piers: extends towards the viewer, so it is drawn radially from the center
    c.save(); c.translate(512, 512); c.filter = `blur(${9 * scale}px)`
    for (let n = 0; n < 22; n++) {
      c.save(); c.rotate(r() * Math.PI * 2)
      const stripW = 16 + r() * 60, dark = r() < 0.5
      const d = c.createLinearGradient(0, 130, 0, 505)
      const color = dark ? '46,100,114' : '206,216,204'
      d.addColorStop(0, `rgba(${color},0)`); d.addColorStop(0.45, `rgba(${color},${dark ? 0.36 : 0.2})`); d.addColorStop(1, `rgba(${color},${dark ? 0.16 : 0.08})`)
      c.fillStyle = d
      c.fillRect(-stripW / 2, 130, stripW, 375)
      c.restore()
    }
    c.restore()
    // Thin rings on the still surface
    c.lineWidth = 1.4
    for (let n = 0; n < 90; n++) {
      c.strokeStyle = `rgba(240,248,244,${0.04 + r() * 0.1})`
      const u = 90 + r() * 410, a0 = r() * Math.PI * 2
      c.beginPath(); c.arc(512, 512, u, a0, a0 + 0.2 + r() * 0.9); c.stroke()
    }
  })

  // Pool faces: grey-veined white marble, yellow rust stains, dirt at the frame bases
  const face = (x: number, y: number, base: string, draw: () => void) => area(x, y, 512, 512, () => {
    c.fillStyle = base
    c.fillRect(x, y, 512, 512)
    draw()
    const a = c.createLinearGradient(0, y, 0, y + 512)
    a.addColorStop(0, 'rgba(70,60,50,0.26)'); a.addColorStop(0.1, 'rgba(70,60,50,0)'); a.addColorStop(0.82, 'rgba(70,60,50,0)'); a.addColorStop(1, 'rgba(70,55,40,0.3)')
    c.fillStyle = a
    c.fillRect(x, y, 512, 512)
  })
  face(1024, 0, '#d8d4d4', () => {
    veins(c, r, 1280, 256, 760, 1.05, 58, 1.1, 0.7)
    stain(c, 1400, 380, 150, 220, '112,108,120', 0.3)
    stain(c, 1120, 110, 50, 90, '208,160,92', 0.3)
  })
  face(1536, 0, '#e4ded6', () => {
    veins(c, r, 1792, 256, 760, 2.0, 30, 0.42)
    stain(c, 1680, 130, 46, 42, '214,160,60', 0.62)
    stain(c, 1690, 330, 62, 50, '206,150,48', 0.66)
    stain(c, 1930, 90, 34, 60, '216,172,110', 0.38)
  })
  face(1024, 512, '#c6c2c6', () => {
    veins(c, r, 1280, 768, 760, 0.04, 62, 0.95, 1.1)
    stain(c, 1400, 860, 170, 80, '98,96,106', 0.34)
    stain(c, 1120, 620, 110, 200, '120,116,126', 0.32)
  })

  // Jet: grey-white marble with horizontal bands
  area(1536, 512, 512, 256, () => {
    c.fillStyle = '#d6d5d8'
    c.fillRect(1536, 512, 512, 256)
    veins(c, r, 1792, 640, 620, 0.02, 90, 1.6, 2)
  })

  // Base: soiled rough stone in brown and earth tones
  area(1536, 768, 512, 128, () => {
    c.fillStyle = '#7c7366'
    c.fillRect(1536, 768, 512, 128)
    const colors = ['#5f574c', '#a39a88', '#4f483e', '#bcb3a0', '#6e6455', '#8d7654']
    for (let n = 0; n < 700; n++) {
      c.fillStyle = colors[Math.floor(r() * colors.length)]
      c.globalAlpha = 0.25 + r() * 0.45
      c.fillRect(1536 + r() * 512, 768 + r() * 128, 2 + r() * 18, 1.5 + r() * 9)
    }
    c.globalAlpha = 1
  })

  // Ivory marble: frame, relief, rim and stool body
  area(1536, 896, 384, 128, () => {
    c.fillStyle = '#ebe9e6'
    c.fillRect(1536, 896, 384, 128)
    for (let n = 0; n < 16; n++) stain(c, 1536 + r() * 384, 896 + r() * 128, 14 + r() * 42, 10 + r() * 24, r() < 0.25 ? '206,164,104' : '176,170,160', 0.16)
  })

  // Stool top: polished walnut with an orange tinge
  area(1920, 896, 128, 128, () => {
    c.fillStyle = '#9e5d2a'
    c.fillRect(1920, 896, 128, 128)
    for (let n = 0; n < 46; n++) {
      c.fillStyle = r() < 0.7 ? `rgba(84,42,14,${0.04 + r() * 0.1})` : `rgba(226,160,90,${0.04 + r() * 0.08})`
      c.fillRect(1920, 896 + r() * 128, 128, 0.6 + r() * 2.6)
    }
  })
  return makeTexture(el)
}

/** Pool paving: irregular marble slabs arranged in radial rings from the center. */
function floorTexture(scale: number) {
  const { el, c } = canvas(2048, 2048, scale), r = random(90211)
  const pm = 2048 / FLOOR_G, m = 1024
  const point = (a: number, u: number): [number, number] => [m + Math.sin(a) * u * pm, m + Math.cos(a) * u * pm]
  c.fillStyle = '#6d6a68'
  c.fillRect(0, 0, 2048, 2048)
  const tones = ['#e2e0dd', '#d6d5d5', '#c4c3c7', '#b1b0b6', '#d9d0c2', '#c8bdb0', '#9e9da4', '#85848c']

  const plate = (corner: [number, number][], tone: string, veinAngle: number, dark: number) => {
    c.save()
    c.beginPath()
    corner.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
    c.closePath()
    c.save(); c.clip()
    c.fillStyle = tone
    c.fillRect(0, 0, 2048, 2048)
    const ox = corner.reduce((t, p) => t + p[0], 0) / corner.length, oy = corner.reduce((t, p) => t + p[1], 0) / corner.length
    veins(c, r, ox, oy, 460, veinAngle, 46, dark * 0.62, 0.7)
    c.restore()
    c.lineWidth = 3.4; c.strokeStyle = 'rgba(46,42,40,0.82)'; c.stroke()
    c.restore()
  }

  // Inner ring: narrow light stones surrounding the pool
  const piece = (Math.PI * 2) / CORNER
  for (let n = 0; n < CORNER; n++) {
    const a0 = n * piece, a1 = a0 + piece
    plate([point(a0, 3.8), point(a1, 3.8), point(a1, 4.42), point(a0, 4.42)], tones[Math.floor(r() * 3)], a0 + piece / 2 + (r() < 0.5 ? Math.PI / 2 : 0), 0.55)
  }
  // Outer rings: wide slabs with irregular angles
  const rings: [number, number, number][] = [[4.42, 5.95, 0.3], [5.95, 7.7, 1.1]]
  for (const [inner, outer, slip] of rings) {
    let a = slip
    const last = slip + Math.PI * 2
    let previous = 0
    while (a < last - 0.02) {
      const step = Math.min(0.32 + r() * 0.5, last - a), b = a + step
      const deviation = (r() - 0.5) * 0.34
      const corners: [number, number][] = [point(a + previous, inner), point(b + deviation, inner), point(b - deviation * 0.5, outer), point(a + previous * 0.5, outer)]
      const tone = tones[Math.floor(r() * tones.length)]
      plate(corners, tone, (a + b) / 2 + (r() < 0.5 ? 0 : Math.PI / 2) + (r() - 0.5) * 0.6, 0.7 + r() * 0.6)
      previous = deviation
      a = b
    }
  }
  // The dark speckled stone and the drain slots on both sides, as in the photo
  const [bx, by] = point(Math.PI, 4.82)
  c.fillStyle = '#4a4a4c'
  c.fillRect(bx - 66, by - 48, 132, 96)
  for (let n = 0; n < 1100; n++) {
    c.fillStyle = r() < 0.5 ? 'rgba(180,178,176,0.5)' : 'rgba(22,22,24,0.6)'
    c.fillRect(bx - 66 + r() * 132, by - 48 + r() * 96, 1 + r() * 3.4, 1 + r() * 3.4)
  }
  c.lineWidth = 2.6; c.strokeStyle = 'rgba(40,36,34,0.8)'; c.strokeRect(bx - 66, by - 48, 132, 96)
  for (const s of [-1, 1]) {
    const [x0, y0] = point(Math.PI / 2 * s + 0.42, 4.24), [x1, y1] = point(Math.PI / 2 * s - 0.42, 4.24)
    c.lineCap = 'round'
    c.lineWidth = 9; c.strokeStyle = '#2f2c2a'
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
    c.lineCap = 'butt'
  }

  // Contact shadows: pool base and stool feet
  const ao = c.createRadialGradient(m, m, 3.72 * pm, m, m, 4.45 * pm)
  ao.addColorStop(0, 'rgba(34,28,24,0.62)'); ao.addColorStop(0.35, 'rgba(34,28,24,0.2)'); ao.addColorStop(1, 'rgba(34,28,24,0)')
  c.fillStyle = ao
  c.fillRect(0, 0, 2048, 2048)
  for (let n = 0; n < STOOL; n++) {
    const a = (n / STOOL) * Math.PI * 2, x = m + Math.sin(a) * R_STOOL * pm, y = m + Math.cos(a) * R_STOOL * pm
    stain(c, x, y, 0.34 * pm, 0.34 * pm, '30,25,22', 0.55)
  }
  // Slight darkening towards the corners: the light difference between the piers
  const k = c.createRadialGradient(m, m, 4.4 * pm, m, m, 7.6 * pm)
  k.addColorStop(0, 'rgba(50,42,34,0)'); k.addColorStop(1, 'rgba(50,42,34,0.3)')
  c.fillStyle = k
  c.fillRect(0, 0, 2048, 2048)
  return makeTexture(el)
}

/** The water takes its reflection from the painted texture: no lighting math, only a blend reflecting the cream walls at grazing angles. */
function waterMaterial(map: THREE.Texture) {
  const water = new THREE.MeshBasicMaterial({ map, color: new THREE.Color(0.8, 0.86, 0.8) })
  water.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWaterView;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaterView = cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWaterView;')
      .replace('#include <map_fragment>', `#include <map_fragment>
      { float f = 1.0 - clamp(normalize(vWaterView).y, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.62, 0.56), f * f * f * 0.42); }`)
  }
  water.customProgramCacheKey = () => 'fountain-water'
  return water
}

export interface FountainSize { sx: number; sz: number; floor: number; skyY: number }

/** Adds the whole şadırvan to bucket `k`. The collision circle (r 3.75) and railing boxes stay the same in uluMosqueInterior. */
export function fountain(m: UluMosqueMaterials, k: Bucket, { sx, sz, floor, skyY }: FountainSize) {
  const scale = lightDevice() ? 0.5 : 1
  const atlas = atlasTexture(scale), floorTex = floorTexture(scale)
  // The lamp sphere in the environment map falls above the pool: the marble must stay low-reflective, or it glows white.
  const stone = new THREE.MeshStandardMaterial({ map: atlas, color: '#dcdde2', roughness: 0.46, metalness: 0, envMapIntensity: 0.5 })
  const paving = new THREE.MeshStandardMaterial({ map: floorTex, color: '#d2d3d9', roughness: 0.38, metalness: 0, envMapIntensity: 0.55 })
  const water = waterMaterial(atlas)

  const base = floor + 0.1, yBody = base + PEDESTAL_H, yTop = yBody + BODY_H, yWater = yTop + 0.005

  // --- Paving ---
  const dg = new THREE.BoxGeometry(FLOOR_G, 0.1, FLOOR_D)
  for (let i = 0, p = dg.attributes.position, uv = dg.attributes.uv; i < p.count; i++) uv.setXY(i, p.getX(i) / FLOOR_G + 0.5, 0.5 - p.getZ(i) / FLOOR_D)
  k.add(place(dg, sx, floor + 0.05, sz), paving)

  // --- Base and rim: sixteen-sided, flat-shaded ---
  k.add(place(uvRegion(flatShadow(rotate([[3.97, 0], [3.95, 0.09], [3.86, PEDESTAL_H + 0.01], [3.8, PEDESTAL_H + 0.01]], CORNER)), PEDESTAL), sx, base, sz), stone)
  k.add(place(uvRegion(flatShadow(rotate([
    [3.82, 0], [3.835, 0.02], [3.815, 0.045], [3.8, 0.06], [3.8, 0.085], [3.77, 0.115], [3.72, 0.115], [3.695, 0.09], [3.68, 0.0], [3.68, -0.3],
  ], CORNER)), IVORY), sx, yTop - 0.05, sz), stone)

  // --- Water ---
  const sg = new THREE.CylinderGeometry(R_WATER, R_WATER, 0.02, CORNER)
  for (let i = 0, p = sg.attributes.position, uv = sg.attributes.uv; i < p.count; i++) uv.setXY(i, 0.25 + (p.getX(i) / R_WATER) * 0.247, 0.5 - (p.getZ(i) / R_WATER) * 0.494)
  k.add(place(sg, sx, yWater, sz), water)

  // --- The ornament of one face is built in local coordinates, then rotated onto the sixteen faces ---
  const apothem = R_BODY * Math.cos(Math.PI / CORNER), beam = 2 * R_BODY * Math.sin(Math.PI / CORNER), H = BODY_H
  const yY = (t: number) => yBody + t * H
  const leaf = new THREE.SphereGeometry(1, 6, 4)
  const curl = (s: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.075, yY(0.67), 0), new THREE.Vector3(s * 0.25, yY(0.66), 0), new THREE.Vector3(s * 0.31, yY(0.55), 0),
    new THREE.Vector3(s * 0.21, yY(0.37), 0), new THREE.Vector3(s * 0.2, yY(0.2), 0), new THREE.Vector3(s * 0.3, yY(0.1), 0),
    new THREE.Vector3(s * 0.36, yY(0.15), 0), new THREE.Vector3(s * 0.31, yY(0.2), 0),
  ]), 16, 0.017, 4, false)
  const cornerPier = rotate([[0.062, 0], [0.062, 0.05], [0.038, 0.1], [0.038, H - 0.14], [0.054, H - 0.1], [0.04, H - 0.07], [0.06, H - 0.03], [0, H]], 6)

  for (let n = 0; n < CORNER; n++) {
    const a = (n + 0.5) * (Math.PI * 2) / CORNER
    const add = (g: THREE.BufferGeometry, mat: THREE.Material, z = apothem) => k.add(place(g.translate(0, 0, z), sx, 0, sz, a), mat)

    // Face plate
    const pl = uvRegion(new THREE.PlaneGeometry(beam, H), FACES[n % 3], n % 2 === 1)
    add(pl.translate(0, yBody + H / 2, 0), stone)

    // Frame: thick relief on top, thin at the bottom and sides
    const bar = (g: number, h: number, x: number, y: number, d = 0.016) => add(uvRegion(new THREE.BoxGeometry(g, h, d), IVORY).translate(x, y, 0), stone)
    bar(beam - 0.1, 0.035, 0, yY(0.915))
    bar(beam - 0.1, 0.016, 0, yY(0.875), 0.01)
    bar(beam - 0.1, 0.03, 0, yY(0.06))
    for (const s of [-1, 1]) bar(0.02, H * 0.86, s * (beam / 2 - 0.085), yY(0.487), 0.01)

    // Palmette: nine leaves, the middle one the longest
    for (let y = -4; y <= 4; y++) {
      const t = y / 4, angle = t * 1.2, length = 0.17 - 0.06 * t * t, leafW = 0.03
      const g = leaf.clone().scale(leafW, length, 0.016).translate(0, length, 0).rotateZ(-angle).translate(0, yY(0.67), 0)
      add(uvRegion(g, IVORY), stone, apothem + 0.016)
    }
    add(uvRegion(leaf.clone().scale(0.06, 0.038, 0.02).translate(0, yY(0.665), 0), IVORY), stone, apothem + 0.016)
    // Two S-curves framing the tap
    for (const s of [-1, 1]) add(uvRegion(curl(s), IVORY), stone, apothem + 0.012)

    // Bronze tap: body, downturned spout, knob on top
    const yM = yY(0.53)
    add(new THREE.CylinderGeometry(0.019, 0.026, 0.1, 7).rotateX(Math.PI / 2).translate(0, yM, 0.05), m.bronze)
    add(new THREE.CylinderGeometry(0.018, 0.021, 0.08, 7).translate(0, yM - 0.035, 0.092), m.bronze)
    add(new THREE.CylinderGeometry(0.009, 0.012, 0.04, 6).translate(0, yM + 0.035, 0.05), m.bronze)
    add(new THREE.BoxGeometry(0.055, 0.012, 0.016).translate(0, yM + 0.058, 0.05), m.bronze)

    // Corner post and the bronze pipe over the rim (visible on the inner edge in the photo)
    const cornerAngle = n * (Math.PI * 2) / CORNER
    k.add(place(uvRegion(cornerPier.clone(), IVORY).translate(0, yBody, R_BODY + 0.012), sx, 0, sz, cornerAngle), stone)
    if (n % 2 === 0) k.add(place(new THREE.CylinderGeometry(0.011, 0.011, 0.17, 6).rotateZ(Math.PI / 2).translate(0, yTop + 0.09, 3.71), sx, 0, sz, a), m.bronze)
  }
  leaf.dispose(); cornerPier.dispose()

  // --- Jet: banded stand, three-tiered basin, pinecone on top ---
  const f0 = yWater - 0.02
  const leg: [number, number][] = [[0.46, 0], [0.42, 0.1], [0.34, 0.14], [0.31, 0.3], [0.36, 0.42], [0.34, 0.5]]
  k.add(place(uvRegion(rotate(leg, 24), JET), sx, f0, sz), stone)
  const stone1: [number, number][] = [[0.34, 0.5], [0.52, 0.58], [0.86, 0.68], [1.0, 0.8], [1.03, 0.9], [1.0, 0.96], [0.93, 0.95], [0.88, 0.84], [0.42, 0.8], [0.24, 0.8]]
  k.add(place(uvRegion(rotate(stone1, 32), JET), sx, f0, sz), stone)
  const mid: [number, number][] = [[0.3, 0.8], [0.19, 0.95], [0.16, 1.2], [0.24, 1.36], [0.27, 1.42], [0.42, 1.48], [0.6, 1.62], [0.66, 1.72], [0.62, 1.76], [0.56, 1.7], [0.2, 1.66]]
  k.add(place(uvRegion(rotate(mid, 28), JET), sx, f0, sz), stone)
  const top: [number, number][] = [[0.15, 1.66], [0.1, 1.82], [0.09, 2.02], [0.2, 2.1], [0.34, 2.2], [0.38, 2.27], [0.34, 2.3], [0.26, 2.26], [0.09, 2.27], [0.075, 2.36], [0.12, 2.46], [0.14, 2.56], [0.09, 2.68], [0.02, 2.76], [0, 2.78]]
  k.add(place(uvRegion(rotate(top, 18), IVORY), sx, f0, sz), stone)
  // Bronze spouts on the basins: on the outer face of the lower and middle basin, elbowed
  const spouts = (count: number, r: number, y: number, o: number) => {
    for (let n = 0; n < count; n++) {
      const a = ((n + o) / count) * Math.PI * 2
      k.add(place(new THREE.CylinderGeometry(0.03, 0.035, 0.13, 6).rotateX(Math.PI / 2).translate(0, f0 + y, r + 0.05), sx, 0, sz, a), m.bronze)
      k.add(place(new THREE.CylinderGeometry(0.024, 0.03, 0.09, 6).translate(0, f0 + y - 0.05, r + 0.1), sx, 0, sz, a), m.bronze)
    }
  }
  spouts(8, 0.98, 0.84, 0)
  spouts(8, 0.62, 1.67, 0.5)

  // --- Stools: waisted marble body, polished wooden top ---
  const stoolBody = rotate([[0.17, 0], [0.18, 0.025], [0.15, 0.05], [0.125, 0.07], [0.115, 0.2], [0.14, 0.34], [0.175, 0.44], [0.17, 0.47], [0, 0.47]], 12)
  const stoolTop = rotate([[0, 0], [0.2, 0], [0.225, 0.016], [0.228, 0.036], [0.21, 0.056], [0, 0.058]], 14)
  uvRegion(stoolBody, IVORY)
  for (let i = 0, p = stoolTop.attributes.position, uv = stoolTop.attributes.uv; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  uvRegion(stoolTop, PLANK)
  for (let n = 0; n < STOOL; n++) {
    const a = (n / STOOL) * Math.PI * 2, x = sx + Math.sin(a) * R_STOOL, z = sz + Math.cos(a) * R_STOOL
    k.add(place(stoolBody.clone(), x, base, z, n * 1.3), stone)
    k.add(place(stoolTop.clone(), x, base + 0.47, z, n * 1.3), stone)
  }
  stoolBody.dispose(); stoolTop.dispose()

  // --- Railing: dark wood, panels with cut slats, thick handrail ---
  const slice = new THREE.Shape()
  const halfway: [number, number][] = [[0.026, 0], [0.05, 0.07], [0.022, 0.14], [0.05, 0.25], [0.022, 0.36], [0.05, 0.43], [0.026, 0.5]]
  halfway.forEach(([x, y], i) => (i ? slice.lineTo(x, y) : slice.moveTo(x, y)))
  ;[...halfway].reverse().forEach(([x, y]) => slice.lineTo(-x, y))
  slice.closePath()
  const sliceG = new THREE.ExtrudeGeometry(slice, { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015)
  const boss = new THREE.SphereGeometry(0.03, 4, 3).scale(1, 1, 0.75)
  const y0 = base
  const addPiece = (g: THREE.BufferGeometry, x: number, y: number, z: number, alongX: boolean, mat: THREE.Material) =>
    k.add(place(g, x, y, z, alongX ? 0 : Math.PI / 2), mat)
  const railing = (x0: number, z0: number, x1: number, z1: number) => {
    const length = Math.hypot(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, xB = Math.abs(x1 - x0) > Math.abs(z1 - z0)
    addPiece(new THREE.BoxGeometry(length, 0.07, 0.13), mx, y0 + 0.035, mz, xB, m.wood)
    addPiece(new THREE.BoxGeometry(length, 0.04, 0.09), mx, y0 + 0.09, mz, xB, m.wood)
    addPiece(new THREE.BoxGeometry(length, 0.04, 0.09), mx, y0 + 0.63, mz, xB, m.wood)
    addPiece(new THREE.BoxGeometry(length, 0.03, 0.13), mx, y0 + 0.665, mz, xB, m.wood)
    addPiece(new THREE.BoxGeometry(length, 0.05, 0.17), mx, y0 + 0.705, mz, xB, m.walnut)
    const count = Math.round(length / 0.15)
    for (let n = 0; n < count; n++) {
      const t = (n + 0.5) / count - 0.5
      const x = mx + (xB ? t * length : 0), z = mz + (xB ? 0 : t * length)
      addPiece(sliceG.clone(), x, y0 + 0.11, z, xB, m.wood)
      addPiece(boss.clone(), x, y0 + 0.36, z, xB, m.walnut)
    }
  }
  for (const s of [-1, 1]) for (const c of [-1, 1]) {
    railing(sx + s * 5.15, sz + c * 1.2, sx + s * 5.15, sz + c * 5.24)
    railing(sx + s * 1.05, sz + c * 5.15, sx + s * 5.06, sz + c * 5.15)
  }
  sliceG.dispose(); boss.dispose()

  // --- Lantern: the brass ship's lantern from the photo, with its side hoops, ribbed glass and pointed base ---
  const fY = 4.95
  k.add(place(new THREE.CylinderGeometry(0.013, 0.013, skyY - fY - 1.5, 5), sx, (skyY + fY + 1.5) / 2, sz), m.dark)
  // Bottom plate and pointed tip
  k.add(place(rotate([[0, -0.14], [0.05, -0.08], [0.24, 0], [0.34, 0.04], [0.35, 0.08], [0.3, 0.1]], 12), sx, fY, sz), m.gold)
  // Pale glass body with ribs in front (the lamp material glowed and washed out the jet)
  k.add(place(uvRegion(new THREE.CylinderGeometry(0.25, 0.25, 0.46, 12), IVORY), sx, fY + 0.33, sz), stone)
  for (const y of [0.13, 0.25, 0.37, 0.49]) k.add(place(new THREE.TorusGeometry(0.27, 0.012, 4, 14).rotateX(Math.PI / 2), sx, fY + y, sz), m.goldDark)
  // Top plate, dome, chimney and ring
  k.add(place(rotate([[0.3, 0.55], [0.35, 0.58], [0.34, 0.63], [0.3, 0.68], [0.25, 0.8], [0.15, 0.9], [0.1, 0.94], [0.1, 1.08], [0.14, 1.11], [0.13, 1.15], [0, 1.2]], 12), sx, fY, sz), m.gold)
  k.add(place(new THREE.TorusGeometry(0.06, 0.012, 4, 10), sx, fY + 1.25, sz), m.goldDark)
  // Four posts and two side hoops
  for (let n = 0; n < 4; n++) {
    const a = (n + 0.5) * Math.PI / 2
    k.add(place(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 5).translate(0, fY + 0.36, 0.33), sx, 0, sz, a), m.goldDark)
    k.add(place(new THREE.BoxGeometry(0.1, 0.018, 0.018).rotateY(Math.PI / 2).translate(0, fY + 0.06, 0.38), sx, 0, sz, a), m.goldDark)
  }
  for (const a of [0, Math.PI / 2]) k.add(place(new THREE.TorusGeometry(0.42, 0.011, 4, 14, Math.PI).translate(0, fY + 0.72, 0), sx, 0, sz, a), m.goldDark)
}
