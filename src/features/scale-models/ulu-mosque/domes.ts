// Ulu Camii dome zone: lead domes, inner domes, pendentives, chandeliers and the upper part of the minarets.
// Forms are interpreted from archive photos: lead seams, skirt and finial DJI_0315; top view DJI_0228;
// minaret shaft, balcony and cap DJI_0417 and DJI_0085; inner dome decoration ERD05149 (texture directly from this photo).
// Dimensions are representative. The same lead texture is rotated for each dome; all are merged with Bucket.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'
import type { UluMosqueMaterials } from '../uluMosqueTextures'
import { lightDevice, random } from '../uluMosqueFloor'
import { DRUM_BASE, type Bucket, OCTA, rotateG, arch, boxG, cylinderG, place } from '../uluMosquePiece'

type Draw = (c: CanvasRenderingContext2D, g: number, y: number) => void

/** Top strip of the lead dome texture: the finials' copper green is read from here, so no separate draw call is needed. */
const PATCH_V = 0.94
/** Lead sheet rows (v) and the column count of each row: towards the top every second seam ends (DJI_0315). */
const ROWS: [number, number, number][] = [[0, 0.15, 40], [0.15, 0.33, 40], [0.33, 0.53, 40], [0.53, 0.74, 20], [0.74, PATCH_V, 20]]
const DOME_SEAM = 40

export const domeTexLen = () => (lightDevice() ? 1024 : 2048)

export const drawLeadDome = (relief: boolean): Draw => (c, g, y) => {
  const r = random(61), oy = (v: number) => (1 - v) * y
  c.fillStyle = relief ? '#808080' : '#9db0bd'
  c.fillRect(0, 0, g, y)
  const unit = g / 2048
  for (const [v0, v1, count] of ROWS) {
    const d = g / count
    for (let i = 0; i < count; i++) {
      const s = r(), x = i * d, u = oy(v1), h = oy(v0) - oy(v1)
      if (relief) {
        c.fillStyle = `rgba(${s > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.1})`
        c.fillRect(x, u, d, h)
        continue
      }
      // Sheet tone: mostly light blue-grey, occasionally a renewed or brown-oxidized sheet.
      c.fillStyle = s < 0.035 && count === DOME_SEAM ? `rgba(138,116,94,${0.35 + r() * 0.3})`
        : s < 0.14 ? `rgba(214,226,233,${0.3 + r() * 0.3})`
          : s < 0.42 ? `rgba(120,138,150,${0.08 + r() * 0.16})` : `rgba(235,242,246,${r() * 0.16})`
      c.fillRect(x, u, d, h)
      const iz = c.createLinearGradient(0, u, 0, u + h)
      iz.addColorStop(0, 'rgba(255,255,255,0.1)'); iz.addColorStop(1, 'rgba(66,76,84,0.14)')
      c.fillStyle = iz
      c.fillRect(x, u, d, h)
      // Thin streaks running down from the overlap
      for (let n = 0; n < 7; n++) {
        c.fillStyle = `rgba(${r() > 0.35 ? '70,76,80' : '255,255,255'},${0.03 + r() * 0.07})`
        c.fillRect(x + r() * d, u, (1 + r() * 3) * unit, h * (0.3 + r() * 0.7))
      }
      // Shadow on both sides of the seam and light on top of it
      c.fillStyle = 'rgba(42,50,56,0.34)'
      c.fillRect(x + 3 * unit, u, 3 * unit, h); c.fillRect(x - 6 * unit, u, 3 * unit, h)
      c.fillStyle = 'rgba(244,248,250,0.26)'
      c.fillRect(x - 2 * unit, u, 4 * unit, h)
    }
    // Horizontal overlap
    c.fillStyle = relief ? '#2a2a2a' : 'rgba(44,52,58,0.62)'
    c.fillRect(0, oy(v1), g, 3 * unit)
    c.fillStyle = relief ? '#e8e8e8' : 'rgba(246,249,250,0.4)'
    c.fillRect(0, oy(v1) + 3 * unit, g, 3 * unit)
  }
  if (relief) {
    c.fillStyle = '#808080'
    c.fillRect(0, 0, g, oy(PATCH_V))
    return
  }
  // Dirt on the skirt and the dark eave edge
  const skirt = c.createLinearGradient(0, oy(0.13), 0, y)
  skirt.addColorStop(0, 'rgba(84,86,84,0)'); skirt.addColorStop(0.42, 'rgba(84,86,84,0.3)'); skirt.addColorStop(0.47, 'rgba(38,40,42,0.92)'); skirt.addColorStop(1, 'rgba(30,32,34,0.95)')
  c.fillStyle = skirt
  c.fillRect(0, oy(0.13), g, y - oy(0.13))
  // Copper-green patch
  c.fillStyle = '#56685c'
  c.fillRect(0, 0, g, oy(PATCH_V))
  for (let i = 0; i < 900; i++) {
    c.fillStyle = `rgba(${r() > 0.5 ? '120,158,136' : '36,34,28'},${r() * 0.35})`
    c.fillRect(r() * g, r() * oy(PATCH_V), (1 + r() * 8) * unit, (1 + r() * 4) * unit)
  }
}

/** Flat lead: sheets running down the slope, seams, oxide and dust. */
export const drawLeadFlat: Draw = (c, g, y) => {
  const r = random(53), count = 8, length = 2, d = g / count, h = y / length
  c.fillStyle = '#9ea7ab'
  c.fillRect(0, 0, g, y)
  for (let i = 0; i < count; i++) for (let j = 0; j < length; j++) {
    const s = r()
    c.fillStyle = s < 0.2 ? `rgba(122,106,88,${0.14 + r() * 0.26})` : s < 0.55 ? `rgba(70,78,84,${0.05 + r() * 0.15})` : `rgba(226,232,236,${r() * 0.24})`
    c.fillRect(i * d, j * h, d, h)
    for (let n = 0; n < 16; n++) {
      c.fillStyle = `rgba(${r() > 0.4 ? '58,58,54' : '238,240,240'},${0.02 + r() * 0.06})`
      c.fillRect(i * d + r() * d, j * h, 1 + r() * 3, h * (0.3 + r() * 0.7))
    }
  }
  for (let i = 0; i < count; i++) {
    c.fillStyle = 'rgba(36,40,44,0.55)'; c.fillRect(i * d + 3, 0, 3, y); c.fillRect(i * d - 5, 0, 2, y)
    c.fillStyle = 'rgba(238,242,244,0.6)'; c.fillRect(i * d - 3, 0, 6, y)
  }
  for (let j = 0; j < length; j++) { c.fillStyle = 'rgba(36,40,44,0.5)'; c.fillRect(0, j * h, g, 2) }
}

/** Pendentive: plain plaster, double lines at the edges, a small floral motif facing the arch apexes (ERD05124). */
export const drawPendentive: Draw = (c, g, y) => {
  c.fillStyle = '#f2ead9'
  c.fillRect(0, 0, g, y)
  const tone = c.createLinearGradient(0, 0, 0, y)
  tone.addColorStop(0, 'rgba(176,146,108,0.26)'); tone.addColorStop(0.5, 'rgba(176,146,108,0.06)'); tone.addColorStop(1, 'rgba(176,146,108,0)')
  c.fillStyle = tone
  c.fillRect(0, 0, g, y)
  c.fillStyle = '#2e2a26'
  c.fillRect(0, 3, g, 5); c.fillRect(0, y - 9, g, 6)
  c.fillStyle = '#8a6a35'
  c.fillRect(0, 12, g, 3); c.fillRect(0, y - 17, g, 3)
  c.fillStyle = '#5b4730'
  for (let n = 0; n < 4; n++) {
    const x = (n / 4) * g, v = y - 46
    for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
      const px = x + side * (6 + k * 6)
      c.beginPath(); c.ellipse(px, v - k * 2 + 8, 7 - k, 3.4, side * (0.5 + k * 0.25), 0, Math.PI * 2); c.fill()
      if (n === 0) { c.beginPath(); c.ellipse(g + px, v - k * 2 + 8, 7 - k, 3.4, side * (0.5 + k * 0.25), 0, Math.PI * 2); c.fill() }
    }
  }
}

/** Without the inner dome atlas (public build), the same layout drawn in code: band, eight crowns, medallion. */
const drawInnerDomeFallback: Draw = (c, g, y) => {
  c.fillStyle = '#efe3cd'
  c.fillRect(0, 0, g, y)
  const leaf = (x: number, v: number, b: number, a: number) => {
    c.save(); c.translate(x, v); c.rotate(a)
    c.beginPath(); c.moveTo(0, -b); c.quadraticCurveTo(b * 0.7, 0, 0, b); c.quadraticCurveTo(-b * 0.7, 0, 0, -b)
    c.fill(); c.restore()
  }
  for (let t = 0; t < 2; t++) {
    const cx = g / 4 + (t * g) / 2, cy = y / 2, R = 0.48 * y
    c.strokeStyle = '#2e2a26'; c.lineWidth = R * 0.012
    for (const o of [0.995, 0.905]) { c.beginPath(); c.arc(cx, cy, R * o, 0, Math.PI * 2); c.stroke() }
    c.fillStyle = '#54402c'
    for (let n = 0; n < 72; n++) {
      const a = (n / 72) * Math.PI * 2
      leaf(cx + Math.sin(a) * R * 0.95, cy - Math.cos(a) * R * 0.95, R * 0.022, a + (n % 2 ? 0.9 : -0.9))
    }
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      for (let k = -2; k <= 2; k++) leaf(cx + Math.sin(a + k * 0.03) * R * 0.71, cy - Math.cos(a + k * 0.03) * R * 0.71, R * 0.036, a + k * 0.4)
    }
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2 + t * 0.13
      c.fillStyle = n % 2 ? '#54402c' : '#8a6a35'
      leaf(cx + Math.sin(a) * R * 0.19, cy - Math.cos(a) * R * 0.19, R * 0.13, a)
    }
    c.fillStyle = '#3a2d1f'
    c.beginPath(); c.arc(cx, cy, R * 0.05, 0, Math.PI * 2); c.fill()
  }
}

/** Inner dome map: the photo atlas; in the public build, its code-drawn counterpart. */
function innerDomeMap() {
  if (PUBLIC_BUILD) {
    const el = document.createElement('canvas')
    el.width = 2048; el.height = 1024
    const c = el.getContext('2d')
    if (!c) throw new Error('Canvas is not available')
    drawInnerDomeFallback(c, el.width, el.height)
    const t = new THREE.CanvasTexture(el)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  const t = new THREE.TextureLoader().load(`/images/ulu-mosque/model/dome-interior-${domeTexLen()}.jpg`)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Inner dome material settings: since the image carries its own light, a little emission lifts the shadows. */
export function innerDomeSetting() {
  const map = innerDomeMap()
  return { map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.3, roughness: 0.9, side: THREE.DoubleSide }
}

const smooth = THREE.MathUtils.smoothstep

/** Lead dome whose seams are truly raised and whose skirt flares to an octagon (DJI_0315). */
function leadDomeG(domeH: number, openR: number, turn: number) {
  // Eave underside, mouth, concave skirt, then the convex body
  const profile: [number, number][] = [[6.12, -0.24], [6.86, -0.17], [6.92, -0.08], [6.64, 0.08], [6.3, 0.26], [6.0, 0.5], [5.76, 0.8]]
  const a0 = Math.asin(Math.pow(0.83 / domeH, 1 / 1.08))
  for (let t = 0; t <= 13; t++) {
    const a = a0 + (t / 13) * (Math.PI / 2 - a0)
    const r = 5.65 * Math.pow(Math.max(Math.cos(a), 0), 0.86)
    if (openR && r < openR) break
    profile.push([Math.max(r, 0.001), 0.32 + domeH * Math.pow(Math.sin(a), 1.08)])
  }
  let length = 0
  const bowV = profile.map((p, i) => (length += i ? Math.hypot(p[0] - profile[i - 1][0], p[1] - profile[i - 1][1]) : 0))
  const ratios = [0, 0.07, 0.5, 0.93]
  const position: number[] = [], uv: number[] = [], index: number[] = []
  const milk = DOME_SEAM * ratios.length
  profile.forEach(([r0, y], s) => {
    const b = 1 - smooth(y, 0, domeH * 0.34), v = (bowV[s] / length) * PATCH_V
    for (let a = 0; a <= milk; a++) {
      const panel = Math.floor(a / ratios.length), ratio = ratios[a % ratios.length]
      const uyuk = (panel + ratio) / DOME_SEAM, theta = uyuk * Math.PI * 2
      const piece = Math.PI / 4, diff = ((theta + piece / 2) % piece) - piece / 2
      const octagon = THREE.MathUtils.lerp(1, (OCTA / Math.cos(diff)) * 1.04, b)
      const weak = smooth(r0, 0.5, 1.8) * (panel % 2 ? 1 - smooth(v, 0.5, 0.56) : 1)
      const bump = (a % ratios.length === 0 ? 0.06 : a % ratios.length === 2 ? -0.035 : 0) * weak
      const r = r0 * octagon + bump
      position.push(Math.sin(theta) * r, y, Math.cos(theta) * r)
      uv.push(uyuk + turn, v)
    }
  })
  for (let s = 0; s < profile.length - 1; s++) for (let a = 0; a < milk; a++) {
    const p = s * (milk + 1) + a, q = p + milk + 1
    index.push(p, p + 1, q, p + 1, q + 1, q)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  // Don't let normals break at the texture seam
  const n = g.attributes.normal
  for (let s = 0; s < profile.length; s++) {
    const a = s * (milk + 1), z = a + milk
    const v = new THREE.Vector3(n.getX(a) + n.getX(z), n.getY(a) + n.getY(z), n.getZ(a) + n.getZ(z)).normalize()
    n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(z, v.x, v.y, v.z)
  }
  return { g, last: profile[profile.length - 1] }
}

/** The drum's lead base sloping four ways: sheets run straight down the slope. */
export function leadPedestalG(topR: number, bottomR: number, h: number) {
  const g = new THREE.CylinderGeometry(topR, bottomR, h, 4, 1, true).rotateY(Math.PI / 4).toNonIndexed()
  g.computeVertexNormals()
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, Math.abs(n.getX(i)) > Math.abs(n.getZ(i)) ? p.getZ(i) : p.getX(i), p.getY(i))
  return g
}

/** Moves the UVs to the copper-green strip of the lead texture. */
function patchUV<G extends THREE.BufferGeometry>(g: G) {
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), PATCH_V + 0.012 + (uv.getY(i) % 1) * 0.04)
  return g
}

/** Dome finial: wide base plate, tiers and crescent (DJI_0315). */
function addFinial(kv: Bucket, m: UluMosqueMaterials, x: number, y: number, z: number) {
  const P: [number, number][] = [[0.44, 0], [0.44, 0.05], [0.22, 0.12], [0.17, 0.3], [0.24, 0.42], [0.14, 0.56], [0.2, 0.68], [0.11, 0.78], [0.15, 0.86], [0.05, 0.96], [0.09, 1.03], [0.025, 1.18], [0.02, 1.32]]
  kv.add(place(patchUV(rotateG(P, 8, [1, 1])), x, y, z), m.dome)
  const crescent = new THREE.TorusGeometry(0.13, 0.026, 4, 10, Math.PI * 1.45).rotateZ((Math.PI * 3) / 4)
  kv.add(place(patchUV(crescent), x, y + 1.44, z), m.dome)
}

/** Outer dome: lead body; over the şadırvan bay a wide glazed opening on top (DJI_0228), a finial on the others. */
export function addLeadDome(kv: Bucket, m: UluMosqueMaterials, x: number, kY: number, z: number, domeH: number, open: boolean, i: number, j: number) {
  const { g, last } = leadDomeG(domeH, open ? 3.5 : 0, ((i * 7 + j * 13) % DOME_SEAM) / DOME_SEAM)
  kv.add(place(g, x, kY, z), m.dome)
  if (!open) { addFinial(kv, m, x, kY + 0.32 + domeH - 0.05, z); return }
  const [lastR, lastY] = last
  kv.add(place(new THREE.TorusGeometry(lastR, 0.14, 8, 32).rotateX(Math.PI / 2), x, kY + lastY, z), m.dark)
  kv.add(place(rotateG([[lastR, 0], [lastR * 0.93, 0.55], [lastR * 0.72, 1.15], [lastR * 0.4, 1.6], [0.01, 1.8]], 32, [1, 1]), x, kY + lastY, z), m.glass)
  kv.add(place(rotateG([[0.1, 0], [0.04, 0.5], [0, 0.55]], 8), x, kY + lastY + 1.8, z), m.bronze)
}

/** Mouth radius of the pendentive: stays inside the outer lead ring. */
export const IN_DOME_R = 5.38
const OPEN_IN_R = 3.1

/** Mapping between texture radius (apex 0, mouth 1) and elevation angle: close to the photo when seen from below, no stretching at the mouth. */
const texQ = (t: number) => 0.62 * Math.cos(t) + 0.38 * (1 - t / (Math.PI / 2))
function texTheta(q: number) {
  let a = 0, b = Math.PI / 2
  for (let n = 0; n < 24; n++) { const o = (a + b) / 2; if (texQ(o) > q) a = o; else b = o }
  return (a + b) / 2
}

/** Inner dome: a single surface from the pendentive to the apex. Up to the drum height goes to the drum layer, above it to the dome layer. */
export function addInnerDome(m: UluMosqueMaterials, kDrum: Bucket, kDome: Bucket, x: number, z: number, drumH: number, domeH: number, open: boolean, i: number, j: number) {
  const H2 = drumH + domeH - 0.35, R = IN_DOME_R
  const apex = open ? Math.acos(OPEN_IN_R / R) : Math.PI / 2
  const mid = Math.asin(drumH / H2)
  const variant = (i + j) % 2, quarter = (i * 3 + j) % 4
  const SEG = 64
  const piece = (t0: number, t1: number, row: number) => {
    const position: number[] = [], uv: number[] = [], index: number[] = []
    for (let s = 0; s <= row; s++) {
      const t = t0 + ((t1 - t0) * s) / row, rho = Math.max(Math.cos(t), 0.001), y = H2 * Math.sin(t), q = texQ(t)
      for (let a = 0; a <= SEG; a++) {
        const f = (a / SEG) * Math.PI * 2, fd = f + (quarter * Math.PI) / 2
        position.push(Math.sin(f) * R * rho, y, Math.cos(f) * R * rho)
        uv.push((variant + 0.5 + 0.48 * Math.sin(fd) * q) / 2, 0.5 + 0.48 * Math.cos(fd) * q)
      }
    }
    for (let s = 0; s < row; s++) for (let a = 0; a < SEG; a++) {
      const p = s * (SEG + 1) + a, q = p + SEG + 1
      index.push(p, q, p + 1, p + 1, q, q + 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(index)
    g.computeVertexNormals()
    return place(g, x, DRUM_BASE, z)
  }
  kDrum.add(piece(0, Math.min(mid, apex), 6), m.innerDome)
  if (apex > mid) kDome.add(piece(mid, apex, open ? 5 : 10), m.innerDome)

  // The lattice of the eight windows in the photo sits in its place in the texture and lets light in.
  for (let n = 0; n < 8; n++) {
    const f = (n * Math.PI) / 4
    const s = arch(new THREE.Shape(), 0, 0, 2, 0.62, 0.38)
    const g = new THREE.ShapeGeometry(s, 5)
    const p = g.attributes.position, uv = g.attributes.uv
    for (let v = 0; v < p.count; v++) {
      const nx = p.getX(v), ny = p.getY(v), t = texTheta(0.885 - ny * 0.1), fa = f + nx * 0.08
      const rInner = R * Math.cos(t) - 0.02
      uv.setXY(v, nx * 0.42, ny * 0.75)
      p.setXYZ(v, Math.sin(fa) * rInner, H2 * Math.sin(t) - 0.03, Math.cos(fa) * rInner)
    }
    kDome.add(place(g, x, DRUM_BASE, z), m.glassCage)
  }

  if (open) {
    // The sky behind the glass: visible only from below, ignored when seen from outside.
    const sky = new THREE.CircleGeometry(OPEN_IN_R + 0.4, 32).rotateX(Math.PI / 2).translate(x, DRUM_BASE + H2 * Math.sin(apex) + 0.55, z)
    kDome.add(sky, m.sky)
  }
}

/** DJI_0312/0339: thin dark ring, star arms, long hangers and small bulbs. */
export function addChandelier(k: Bucket, m: UluMosqueMaterials, x: number, z: number, apex: number) {
  const ay = 4.5, R = 1.4, bossY = ay + 2.3, N = 12
  const dir = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), delta = new THREE.Vector3()
  const tel = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    delta.subVectors(b, a)
    const geo = new THREE.CylinderGeometry(r, r, delta.length(), 4)
    geo.applyQuaternion(q.setFromUnitVectors(dir, delta.normalize()))
    k.add(geo.translate((a.x + b.x) / 2 + x, (a.y + b.y) / 2, (a.z + b.z) / 2 + z), m.bronze)
  }
  const point = (n: number, r = R, y = ay) => new THREE.Vector3(Math.sin(n * Math.PI * 2 / N) * r, y, Math.cos(n * Math.PI * 2 / N) * r)
  k.add(new THREE.TorusGeometry(R, 0.012, 4, 48).rotateX(Math.PI / 2).translate(x, ay, z), m.bronze)
  k.add(new THREE.TorusGeometry(R * 0.52, 0.009, 4, 32).rotateX(Math.PI / 2).translate(x, ay + 0.3, z), m.bronze)
  tel(new THREE.Vector3(0, bossY, 0), new THREE.Vector3(0, apex, 0), 0.007)
  for (let n = 0; n < N; n++) {
    // Two nested triangle frames form the star skeleton; there is no thick disc.
    tel(point(n), point(n + 5), 0.007)
    if (n % 2 === 0) tel(point(n), new THREE.Vector3(0, bossY, 0), 0.005)
    for (const inner of [false, true]) {
      const p = point(n + (inner ? 0.5 : 0), inner ? R * 0.52 : R, inner ? ay + 0.3 : ay)
      tel(p, p.clone().add(new THREE.Vector3(0, -0.17, 0)), 0.009)
      k.add(new THREE.SphereGeometry(0.04, 6, 4).scale(0.8, 1.2, 0.8).translate(x + p.x, p.y - 0.2, z + p.z), m.lamp)
      for (const ry of [0, Math.PI / 2])
        k.add(new THREE.PlaneGeometry(0.2, 0.2).rotateY(ry).translate(x + p.x, p.y - 0.2, z + p.z), m.lampHalo)
    }
  }
}

/** The minaret above the base: brick shaft, stepped brick corbel, marble balcony, slender shaft, knobbed cap (DJI_0417, DJI_0085). */
export function minaretTop(ext: (g: THREE.BufferGeometry, mat: THREE.Material) => void, m: UluMosqueMaterials, bodyBase: number) {
  ext(rotateG([[2.35, bodyBase], [2.05, 26.5]], 32), m.brick)
  for (const [y, h] of [[bodyBase + 0.4, 0.28], [18.5, 0.12], [25.95, 0.42]]) {
    const r = THREE.MathUtils.lerp(2.35, 2.05, (y - bodyBase) / (26.5 - bodyBase)) + 0.05
    ext(cylinderG(r, r, h, 32).translate(0, y, 0), m.stone)
  }
  // Narrow light slits in the shaft (DJI_0315)
  for (const [y, a] of [[15.5, 1.1], [20.5, 3.3], [24, 5.2]]) {
    const r = THREE.MathUtils.lerp(2.35, 2.05, (y - bodyBase) / (26.5 - bodyBase))
    ext(boxG(0.15, 0.72, 0.06).translate(0, y, r).rotateY(a), m.dark)
  }
  // Below the balcony: tiers flaring upwards and rows of projecting bricks
  const TIER = 6, UPPER = 29.75
  for (let t = 0; t < TIER; t++) {
    const h = (UPPER - 26.2) / TIER, y = 26.2 + t * h, r = 2.05 + t * 0.125
    ext(cylinderG(r + 0.05, r, h, 28, true).translate(0, y + h / 2, 0), m.brick)
    const COUNT = 26
    for (let a = 0; a < COUNT; a++) {
      const theta = ((a + (t % 2) * 0.5) * Math.PI * 2) / COUNT
      ext(boxG(0.27, h * 0.56, 0.2).translate(0, y + h * 0.5, r + 0.08).rotateY(theta), m.brick)
    }
  }
  // Balcony: marble balustrade with posts
  ext(cylinderG(2.86, 2.72, 0.25, 32).translate(0, UPPER + 0.1, 0), m.marble)
  ext(cylinderG(2.84, 2.84, 1.35, 32, true).translate(0, UPPER + 0.85, 0), m.marble)
  ext(cylinderG(2.96, 2.96, 0.16, 32).translate(0, UPPER + 1.58, 0), m.marble)
  for (let a = 0; a < 32; a++) {
    ext(boxG(0.05, 1.12, 0.03).translate(0, UPPER + 0.85, 2.85).rotateY((a * Math.PI * 2) / 32), m.marbleDark)
  }
  // Slender shaft, corniced top finish and two-knobbed cap
  ext(rotateG([[1.78, UPPER + 1.6], [1.68, 37.65]], 28), m.brick)
  ext(rotateG([[1.7, 37.6], [2.02, 37.88], [2.02, 38.08], [1.72, 38.22]], 28), m.marble)
  const Y = 38.2
  const cone: [number, number][] = [[1.48, 0], [1.42, 0.55], [1.5, 0.6], [1.3, 1.1], [1.36, 1.17], [1.36, 1.3], [1.14, 1.38], [1.5, 1.78], [1.56, 2.17], [1.42, 2.62], [1.05, 3], [1.08, 3.1], [1.08, 3.3], [0.9, 3.4], [1.02, 3.72], [1.06, 4.06], [0.9, 4.5], [0.46, 4.85], [0.4, 5.2], [0.62, 5.55], [0.6, 5.7], [0.3, 5.95], [0.1, 6.1]]
  ext(rotateG(cone.map(([r, y]) => [r, Y + y] as [number, number]), 22), m.cell)
  const tip: [number, number][] = [[0.1, 0], [0.04, 0.2], [0.11, 0.35], [0.04, 0.5], [0.1, 0.65], [0.04, 0.8], [0.08, 0.95], [0.02, 1.3], [0, 1.35]]
  ext(rotateG(tip.map(([r, y]) => [r, Y + 6.1 + y] as [number, number]), 8), m.dark)
  ext(new THREE.TorusGeometry(0.2, 0.04, 4, 10, Math.PI * 1.45).rotateZ((Math.PI * 3) / 4).translate(0, Y + 7.68, 0), m.dark)
}
