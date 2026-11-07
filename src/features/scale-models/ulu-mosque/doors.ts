// Ulu Camii doors, facade stone and the courtyard şadırvan kiosks.
// The crown gate is a planar projection of the archive's frontal photo: geometry only adds depth (frame tiers,
// niche, muqarnas tiers), and each piece's texture comes from its place in the photo. The left edge hidden by the tree is mirrored from the right.
// Kiosk dimensions and form from the archive photo; "eight wooden posts, trefoil arch, onion dome" from the inventory book.
// The outer form of the side doors is interpreted from the marble-framed opening on the north facade, the leaf colors from the side doors
// seen in the archive; the archive has no close-up photo of the east and west outer doors, so they are representative.
// Textures: scripts/doors_texture.py
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'
import type { UluMosqueMaterials } from '../uluMosqueTextures'
import { Bucket, type Mat, subtract, rotateG, boxG, cylinderG, place } from '../uluMosquePiece'
import { lightDevice, random } from '../uluMosqueFloor'

type Add = (g: THREE.BufferGeometry, m: Mat) => void

// --- Atlas layout (2048 pixels, see scripts/doors_texture.py) ---
const ATLAS = 2048
const PLACE = {
  top: [1340, 0, 240, 400], alt: [1590, 0, 240, 400], pool: [1340, 410, 400, 230],
  pedestal: [1340, 650, 700, 120], dome: [1340, 780, 300, 700], eave: [1340, 1490, 300, 60], door: [1650, 790, 390, 1056],
} as const
type Place = keyof typeof PLACE
const groundUV = (name: Place, s: number, t: number): [number, number] => {
  const [x, y, g, h] = PLACE[name]
  return [(x + s * g) / ATLAS, 1 - (y + (1 - t) * h) / ATLAS]
}
// Photo coordinates: the 859-pixel preview of the crown gate.
const PX0 = 25, PY0 = 165, A = ATLAS / 1245
const photoUV = (px: number, py: number): [number, number] => [(px - PX0) * A / ATLAS, 1 - (py - PY0) * A / ATLAS]

/** Flat color samples inside the atlas: wood, plaster and water need no separate material (same order as scripts/doors_texture.py). */
const PAINT = { post: '#2f1c12', cream: '#d9cdb0', creamWing: '#d8cfb6', creamDark: '#a79d84', green: '#27442f', water: '#55796f' } as const
type PaintName = keyof typeof PAINT
type Painted = Mat | PaintName
const paintUV = (name: PaintName): [number, number] => {
  const i = Object.keys(PAINT).indexOf(name)
  return [(1780 + i * 44) / ATLAS, 1 - 440 / ATLAS]
}
function paint<G extends THREE.BufferGeometry>(g: G, name: PaintName) {
  const [u, v] = paintUV(name), t = g.attributes.uv
  for (let i = 0; i < t.count; i++) t.setXY(i, u, v)
  return g
}

export interface DoorsMaterials { atlas: Mat; facadeStone: Mat }

const cache = new WeakMap<UluMosqueMaterials, DoorsMaterials>()

/** Built once per model: when leaving the scene the textures are disposed together with the material. */
export function doorsMaterials(m: UluMosqueMaterials): DoorsMaterials {
  const var_ = cache.get(m)
  if (var_) return var_
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...p })
  const ext = lightDevice() ? '-1024' : ''
  const load = (name: string) => {
    const t = new THREE.TextureLoader().load(`/images/ulu-mosque/model/${name}.jpg`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  let atlas: Mat, facadeStone: Mat
  if (PUBLIC_BUILD) {
    // No photo in the public build: paint samples and a flat marble color with the same UVs.
    const el = document.createElement('canvas')
    el.width = el.height = 512
    const c = el.getContext('2d')
    if (c) {
      c.fillStyle = '#cfccc6'
      c.fillRect(0, 0, 512, 512)
      Object.values(PAINT).forEach((color, i) => { c.fillStyle = color; c.fillRect((1760 + i * 44) / 4, 420 / 4, 10, 10) })
    }
    const map = new THREE.CanvasTexture(el)
    map.colorSpace = THREE.SRGBColorSpace
    atlas = std({ map: map, roughness: 0.6, side: THREE.DoubleSide })
    facadeStone = m.stone
  } else {
    // The photo has its own shading: slight emission keeps the niches from going dark under scene lighting.
    const map = load(`doors-atlas${ext}`)
    atlas = std({ map: map, roughness: 0.68, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.2 })
    const stone = load('facade-stone')
    stone.wrapS = stone.wrapT = THREE.RepeatWrapping
    stone.repeat.set(1 / STONE_M, 1 / STONE_M)
    facadeStone = std({ map: stone, roughness: 0.94 })
  }
  const K: DoorsMaterials = { atlas, facadeStone }
  cache.set(m, K)
  return K
}
/** Meter equivalent of the facade stone texture. */
const STONE_M = 8

// --- Geometry helpers ---
/** Accumulates quads for the atlas material: each vertex is [x, y, z, u, v]. */
class Faces {
  private p: number[] = []
  private uv: number[] = []
  quad(a: number[], b: number[], c: number[], d: number[]) {
    for (const v of [a, b, c, a, c, d]) { this.p.push(v[0], v[1], v[2]); this.uv.push(v[3], v[4]) }
  }
  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.computeVertexNormals()
    return g
  }
}

/** Turns the geometry's UVs into a planar photo projection. */
function projection<G extends THREE.BufferGeometry>(g: G, uv: (x: number, y: number) => [number, number]) {
  const p = g.attributes.position, t = g.attributes.uv
  for (let i = 0; i < p.count; i++) { const [u, v] = uv(p.getX(i), p.getY(i)); t.setXY(i, u, v) }
  return g
}

/** Fits a flat surface such as a window onto its crop in the atlas. */
export function fitToAtlas<G extends THREE.BufferGeometry>(g: G, name: Place) {
  g.computeBoundingBox()
  const b = g.boundingBox as THREE.Box3
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  return projection(g, (x, y) => groundUV(name, (x - b.min.x) / w, (y - b.min.y) / h))
}

/** Control points of the arch curve: niche arches are pointed, window tops round (north facade photo). */
const archCurve = (g: number) => g > 2.5 ? [0.56, 0.42, 0.8] : [0.72, 0.56, 0.97]

export function facadeArch<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, flat: number, archH: number): P {
  const o = g / 2, b = y0 + flat, t = b + archH, [k1, kx, k2] = archCurve(g)
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, b)
  p.bezierCurveTo(cx - o, b + archH * k1, cx - o * kx, b + archH * k2, cx, t)
  p.bezierCurveTo(cx + o * kx, b + archH * k2, cx + o, b + archH * k1, cx + o, b)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

/** Stone voussoirs framing the arch: facade stone, not brick, with joints (according to the photos). */
export function archSlices(ext: (g: THREE.BufferGeometry) => void, cx: number, y0: number, gOuter: number, flat: number, kOuter: number, gInner: number, kInner: number) {
  const point = (g: number, kh: number, t: number): [number, number] => {
    // Parametric walk from the bottom left to the apex and the bottom right (t: -1..1)
    const o = g / 2, b = y0 + flat, a = 1 - Math.abs(t), [k1, kx, k2] = archCurve(g)
    const rag = (p0: number, p1: number, p2: number, p3: number, s: number) => (1 - s) ** 3 * p0 + 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3 * p3
    const x = rag(-o, -o, -o * kx, 0, a), y = rag(b, b + kh * k1, b + kh * k2, b + kh, a)
    return [cx + (t < 0 ? x : -x), y]
  }
  const r = random(Math.round((cx + 50) * 97 + y0 * 13))
  const N = 11
  for (let i = 0; i < N; i++) {
    const t0 = -1 + (2 * i) / N, t1 = -1 + (2 * (i + 1)) / N
    const step = 5
    const s = new THREE.Shape()
    const outer: [number, number][] = [], inner: [number, number][] = []
    for (let n = 0; n <= step; n++) {
      const t = t0 + ((t1 - t0) * n) / step
      outer.push(point(gOuter, kOuter, t)); inner.push(point(gInner, kInner, t))
    }
    s.moveTo(outer[0][0], outer[0][1])
    for (const d of outer.slice(1)) s.lineTo(d[0], d[1])
    for (const d of inner.reverse()) s.lineTo(d[0], d[1])
    s.closePath()
    // For the joints the voussoirs project to slightly different depths.
    ext(subtract(s, 0.06 + r() * 0.05, 0))
  }
  // Jambs: from the bottom to the arch springing
  for (const sg of [-1, 1]) {
    const x0 = cx + (sg * (gInner + gOuter)) / 4, gen = (gOuter - gInner) / 2
    if (flat > 0.05) ext(boxG(gen, flat, 0.08).translate(x0, y0 + flat / 2, 0.04))
  }
}

/** A box that takes a random patch, at the face's real size, from a flat marble region of the atlas. */
function marbleBlock(y: Faces, r: () => number, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const P = 76 // pixels/meter
  const face = (a: number[], b: number[], c: number[], d: number[], g: number, h: number) => {
    const pg = Math.min(120, g * P), ph = Math.min(240, h * P)
    const px = 664 + r() * Math.max(0, 786 - 664 - pg), py = 884 + r() * Math.max(0, 1300 - 884 - ph)
    y.quad([...a, ...photoUV(px, py + ph)], [...b, ...photoUV(px + pg, py + ph)], [...c, ...photoUV(px + pg, py)], [...d, ...photoUV(px, py)])
  }
  const G = x1 - x0, H = y1 - y0, D = z1 - z0
  face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], G, H) // front
  face([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], G, D) // top
  face([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], D, H) // right
  face([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], D, H) // left
}

// --- Crown gate ---
/** Dimensions taken from the photo (preview pixels). Door axis at 433. */
const CX = 433
const SX = 0.01315, SY = 0.01158 // meters/pixel: slightly squashed because the wall height is shorter than in the photo
const SILL = 1.4, BASE_PY = 1326
const yPy = (py: number) => SILL + (BASE_PY - py) * SY
const pyY = (y: number) => BASE_PY - (y - SILL) / SY
const taUV = (x: number, y: number) => photoUV(CX + x / SX, pyY(y))

export const CROWN_G = 365 * 2 * SX

export function crownDoor(k: Bucket, m: UluMosqueMaterials, K: DoorsMaterials, yz: number) {
  const piece = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, -yz, Math.PI), mat)
  const r = random(4021)
  const y = new Faces()
  const ZO = 2.6 // block front
  const H0 = 365 * SX, TOP = yPy(228), BASE = 0.9
  // Frame tiers, outer to inner: [outer half-width, outer top py, inner half-width, inner top py, depth]
  const tier: [number, number, number, number, number][] = [
    [365, 228, 311, 287, 0],
    [311, 287, 283, 317, 0.12],
    [283, 317, 244, 353, 0.25],
    [244, 353, 226, 374, 0.35],
  ]
  for (const [hd, td, hi, ti, dz] of tier) {
    const xd = hd * SX, xi = hi * SX, yd = yPy(td), yi = yPy(ti)
    // Inverted U shape: built by hand so the bottom edge stays open.
    const u = new THREE.Shape()
    u.moveTo(-xd, BASE); u.lineTo(-xi, BASE); u.lineTo(-xi, yi); u.lineTo(xi, yi); u.lineTo(xi, BASE); u.lineTo(xd, BASE); u.lineTo(xd, yd); u.lineTo(-xd, yd); u.closePath()
    piece(projection(subtract(u, 0.13, ZO - dz - 0.13), taUV), K.atlas)
  }
  // Panel: a plane pierced by the arch mouth from the photo
  const ZP = ZO - 0.45
  const MOUTH: [number, number][] = [[858, 153], [700, 155], [650, 148], [600, 124], [575, 94], [550, 60], [538, 32], [527, 0]]
  const board = new THREE.Shape()
  const xp = 226 * SX
  board.moveTo(-xp, BASE); board.lineTo(-153 * SX, BASE)
  for (const [py, h] of MOUTH) board.lineTo(-h * SX, yPy(py))
  for (const [py, h] of [...MOUTH].reverse().slice(1)) board.lineTo(h * SX, yPy(py))
  board.lineTo(153 * SX, BASE); board.lineTo(xp, BASE); board.lineTo(xp, yPy(374)); board.lineTo(-xp, yPy(374)); board.closePath()
  piece(projection(subtract(board, 0.13, ZP - 0.13), taUV), K.atlas)

  // Niche back wall and muqarnas: tiers project forward from top to bottom (side view: photo 0291)
  const ZG = ZP - 1.25 // niche back wall
  const TIERS: [number, number][] = [[858, 153], [800, 146], [771, 133], [750, 114], [725, 100], [701, 86], [686, 72], [650, 66], [620, 52], [600, 42], [583, 34], [552, 22], [530, 2]]
  const mouthH = (py: number) => {
    for (let i = 0; i < MOUTH.length - 1; i++) {
      const [p0, h0] = MOUTH[i], [p1, h1] = MOUTH[i + 1]
      if (py <= p0 && py >= p1) return h0 + ((h1 - h0) * (p0 - py)) / (p0 - p1)
    }
    return 0
  }
  const zTier = (py: number) => ZG + 0.08 + (ZP - 0.1 - ZG - 0.08) * THREE.MathUtils.clamp((py - 530) / (858 - 530), 0, 1) ** 0.85
  // Back wall: the inner part is extended with marble so the area behind the muqarnas is cleared of texture
  const lines = [...TIERS.map((a) => a[0]), ...MOUTH.map((a) => a[0])].filter((v, i, d) => d.indexOf(v) === i).sort((a, b) => b - a)
  const tierH = (py: number) => {
    for (let i = 0; i < TIERS.length - 1; i++) {
      const [p0, h0] = TIERS[i], [p1, h1] = TIERS[i + 1]
      if (py <= p0 && py >= p1) return h0 + ((h1 - h0) * (p0 - py)) / (p0 - p1)
    }
    return 0
  }
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i], b = lines[i + 1]
    const ya = yPy(a), yb = yPy(b)
    for (const s of [-1, 1]) {
      const mouthA = mouthH(a), mouthB = mouthH(b)
      const sa = Math.min(mouthA, tierH(a) + 6), sb = Math.min(mouthB, tierH(b) + 6)
      const points = (h: number, py: number, zz: number) => [s * h * SX, yPy(py), zz, ...photoUV(CX + s * h, py)]
      // Real marble between the mouth edge and the outside of the muqarnas silhouette
      y.quad(points(sa, a, ZG), points(mouthA, a, ZG), points(mouthB, b, ZG), points(sb, b, ZG))
      // Inside the silhouette: the color outside the silhouette is extended inward
      y.quad([0, ya, ZG, ...photoUV(CX + s * sa, a)], [s * sa * SX, ya, ZG, ...photoUV(CX + s * sa, a)], [s * sb * SX, yb, ZG, ...photoUV(CX + s * sb, b)], [0, yb, ZG, ...photoUV(CX + s * sb, b)])
      // Mouth thickness: from the panel to the back wall
      y.quad([s * mouthA * SX, ya, ZP, ...photoUV(CX + s * mouthA, a)], [s * mouthA * SX, ya, ZG, ...photoUV(CX + s * (mouthA - 3), a)], [s * mouthB * SX, yb, ZG, ...photoUV(CX + s * (mouthB - 3), b)], [s * mouthB * SX, yb, ZP, ...photoUV(CX + s * mouthB, b)])
    }
  }
  const COLUMN = 26
  const tier2 = (py0: number, h0: number, py1: number, h1: number, zigzag: number) => {
    const ym = py0 - (py0 - py1) * 0.42
    const z0 = zTier(py0), z1 = zTier(py1)
    const inner = (t: number, zFront: number) => ZG + (zFront - ZG) * Math.sqrt(Math.max(0, 1 - t * t))
    for (let j = 0; j < COLUMN; j++) {
      const t0 = -1 + (2 * j) / COLUMN, t1 = -1 + (2 * (j + 1)) / COLUMN
      const v = (t: number, py: number, h: number, zFront: number, zg: number) => {
        const x = t * h * SX
        return [x, yPy(py), inner(t, zFront) + zg, ...photoUV(CX + t * h, py)]
      }
      const zg0 = j % 2 ? 0 : zigzag, zg1 = j % 2 ? zigzag : 0
      // Vertical cell face
      y.quad(v(t0, py0, h0, z0, zg0), v(t1, py0, h0, z0, zg1), v(t1, ym, h0, z0, zg1), v(t0, ym, h0, z0, zg0))
      // Face sloping upward
      y.quad(v(t0, ym, h0, z0, zg0), v(t1, ym, h0, z0, zg1), v(t1, py1, h1, z1, 0), v(t0, py1, h1, z1, 0))
    }
  }
  for (let i = 0; i < TIERS.length - 1; i++) tier2(TIERS[i][0], TIERS[i][1], TIERS[i + 1][0], TIERS[i + 1][1], i < TIERS.length - 3 ? 0.07 : 0.02)
  // Underside of the muqarnas (ceiling): from the front edge to the door wall
  const YT = yPy(858), ZK = ZP - 2.1
  const CEILING = 128
  y.quad([-153 * SX, YT, zTier(858), ...photoUV(CX - 150, 858)], [-CEILING * SX, YT, ZK, ...photoUV(CX - 125, 870)], [CEILING * SX, YT, ZK, ...photoUV(CX + 125, 870)], [153 * SX, YT, zTier(858), ...photoUV(CX + 150, 858)])
  // Door wall: the curtained entrance, the photo itself
  y.quad([-CEILING * SX, SILL, ZK, ...photoUV(CX - 126, 1240)], [CEILING * SX, SILL, ZK, ...photoUV(CX + 126, 1240)], [CEILING * SX, YT, ZK, ...photoUV(CX + 126, 862)], [-CEILING * SX, YT, ZK, ...photoUV(CX - 126, 862)])
  // Side faces: the jamb narrowing from the mouth to the door
  for (const s of [-1, 1]) {
    y.quad([s * 153 * SX, SILL, ZP, ...photoUV(CX + s * 150, 1322)], [s * CEILING * SX, SILL, ZK, ...photoUV(CX + s * 126, 1240)], [s * CEILING * SX, YT, ZK, ...photoUV(CX + s * 126, 862)], [s * 153 * SX, YT, ZP, ...photoUV(CX + s * 150, 858)])
  }
  // Threshold: carpet, from the photo
  y.quad([-153 * SX, SILL, ZP, ...photoUV(CX - 150, 1322)], [153 * SX, SILL, ZP, ...photoUV(CX + 150, 1322)], [CEILING * SX, SILL, ZK, ...photoUV(CX + 126, 1240)], [-CEILING * SX, SILL, ZK, ...photoUV(CX - 126, 1240)])
  y.quad([-226 * SX, SILL, ZO, ...photoUV(CX - 150, 1400)], [226 * SX, SILL, ZO, ...photoUV(CX + 150, 1400)], [226 * SX, SILL, ZP, ...photoUV(CX + 150, 1330)], [-226 * SX, SILL, ZP, ...photoUV(CX - 150, 1330)])

  // Block sides: marble pieces at real depth
  const ROW = 11
  for (const s of [-1, 1]) for (let i = 0; i < ROW; i++) {
    const y0 = (i * TOP) / ROW, y1 = ((i + 1) * TOP) / ROW
    let z = 0.0
    let count = 0
    while (z < ZO - 0.02) {
      const z2 = Math.min(ZO, z + 0.7 + r() * 0.9 + (count++ % 2 ? 0.3 : 0))
      const x0 = s * H0
      const [u0, u1, u2, u3] = (() => {
        const pg = 28 + r() * 24, ph = 16 + r() * 8
        const px = 662 + r() * (786 - 662 - pg), py = 884 + r() * (1130 - 884 - ph)
        return [photoUV(px, py + ph), photoUV(px + pg, py + ph), photoUV(px + pg, py), photoUV(px, py)]
      })()
      y.quad([x0, y0, z2, ...u0], [x0, y0, z, ...u1], [x0, y1, z, ...u2], [x0, y1, z2, ...u3])
      z = z2
    }
  }

  // Eave: from the photo, projecting forward and to the sides
  const SH = 400 * SX, SY0 = yPy(228), SY1 = yPy(183), SZ = ZO + 0.5
  const eaveUV = (x: number, py: number) => photoUV(CX + (x / SX), py)
  y.quad([-SH, SY0, SZ, ...eaveUV(-SH, 228)], [SH, SY0, SZ, ...eaveUV(SH, 228)], [SH, SY1, SZ, ...eaveUV(SH, 183)], [-SH, SY1, SZ, ...eaveUV(-SH, 183)])
  y.quad([-SH, SY0, 0, ...eaveUV(-SH, 228)], [SH, SY0, 0, ...eaveUV(SH, 228)], [SH, SY0, SZ, ...eaveUV(SH, 228)], [-SH, SY0, SZ, ...eaveUV(-SH, 228)])
  for (const s of [-1, 1]) y.quad([s * SH, SY0, SZ, ...eaveUV(s * SH * 0.8, 228)], [s * SH, SY0, 0, ...eaveUV(s * SH * 0.6, 228)], [s * SH, SY1, 0, ...eaveUV(s * SH * 0.6, 183)], [s * SH, SY1, SZ, ...eaveUV(s * SH * 0.8, 183)])
  piece(boxG(SH * 2 + 0.3, 0.14, SZ + 0.15).translate(0, SY1 + 0.07, SZ / 2 - 0.02), m.dark)
  piece(boxG(SH * 2 - 0.6, 0.5, SZ - 0.25).translate(0, SY1 + 0.32, SZ / 2 - 0.15), m.lead)

  // Marble lower band on the sides: in the photo between the block and the first window, up to the intermediate molding
  const AP0 = 1.2, AP1 = 6.2, APX = 6.75
  for (const s of [-1, 1]) {
    const pa = s > 0 ? 668 : 788, pb = s > 0 ? 788 : 668
    const a0 = s > 0 ? H0 : -APX, a1 = s > 0 ? APX : -H0
    const u0 = s > 0 ? pa : pb, u1 = s > 0 ? pb : pa
    y.quad([a0, AP0, 0.12, ...photoUV(u0, 1310)], [a1, AP0, 0.12, ...photoUV(u1, 1310)], [a1, AP1, 0.12, ...photoUV(u1, 884)], [a0, AP1, 0.12, ...photoUV(u0, 884)])
    marbleBlock(y, r, a0 - 0.02, a1 + 0.02, AP1, AP1 + 0.16, 0, 0.2)
    y.quad([s > 0 ? a1 : a0, AP0, 0, ...photoUV(700, 1300)], [s > 0 ? a1 : a0, AP0, 0.12, ...photoUV(708, 1300)], [s > 0 ? a1 : a0, AP1, 0.12, ...photoUV(708, 900)], [s > 0 ? a1 : a0, AP1, 0, ...photoUV(700, 900)])
  }

  // Steps: marble blocks at the front and on both sides (climbable from three sides, as in the photo)
  const STEP = 5, TREAD = 1.05
  for (let i = 0; i < STEP; i++) {
    const y0 = i * 0.28, y1 = y0 + 0.28
    const gen = 9.2 - i * 0.7, z1 = ZO + (STEP - i) * TREAD, z0 = z1 - TREAD
    let xx = -gen
    while (xx < gen - 0.02) {
      const x2 = Math.min(gen, xx + 1.3 + r() * 1.2)
      marbleBlock(y, r, xx, x2, y0, y1, z0, z1)
      xx = x2
    }
    for (const s of [-1, 1]) {
      let zz = 0
      while (zz < z0 - 0.02) {
        const z2 = Math.min(z0, zz + 1 + r())
        marbleBlock(y, r, s > 0 ? gen - 0.7 : -gen, s > 0 ? gen : -gen + 0.7, y0, y1, zz, z2)
        zz = z2
      }
    }
  }
  // The upper landing filled by the steps
  for (let i = 0; i < 5; i++) marbleBlock(y, r, -H0 + i * (2 * H0) / 5, -H0 + (i + 1) * (2 * H0) / 5, 0, SILL - 0.001, ZO, ZO + TREAD)
  piece(y.geometry(), K.atlas)
}

// --- Side doors ---
/** Marble-framed door with a pointed pediment. The +z face is the viewed side. Size: same as the old door in the wall (3.9 m). */
export function sideDoor(ext0: Add, m: UluMosqueMaterials, K: DoorsMaterials, y0: number, inner: boolean) {
  const ext = (g: THREE.BufferGeometry, mat: Painted) => typeof mat === 'string' ? ext0(paint(g, mat), K.atlas) : ext0(g, mat)
  const G = 3.9, OPEN = 2.2, DER = 0.55, DOOR_H = inner ? 3.7 : 3.0, ARCH = 1.17, UPPER = y0 + (inner ? DOOR_H + 2.1 : 5.4)
  // Outside: marble voussoir frame; inside: painted wooden casing (in the archive photo the west door is painted cream on the inside).
  if (inner) {
    const s = new THREE.Shape()
    s.moveTo(-G / 2, y0); s.lineTo(-OPEN / 2, y0); s.lineTo(-OPEN / 2, y0 + DOOR_H + 0.9); s.lineTo(OPEN / 2, y0 + DOOR_H + 0.9); s.lineTo(OPEN / 2, y0); s.lineTo(G / 2, y0); s.lineTo(G / 2, UPPER); s.lineTo(-G / 2, UPPER); s.closePath()
    ext(subtract(s, 0.3), 'creamWing')
    // Stepped moldings
    for (const [g, top, dz] of [[G + 0.2, UPPER + 0.1, 0.16], [G - 0.5, UPPER - 0.25, 0.3]] as const) {
      const c = new THREE.Shape(), t = 0.12
      c.moveTo(-g / 2, y0); c.lineTo(-g / 2 + t, y0); c.lineTo(-g / 2 + t, top - t); c.lineTo(g / 2 - t, top - t); c.lineTo(g / 2 - t, y0); c.lineTo(g / 2, y0); c.lineTo(g / 2, top); c.lineTo(-g / 2, top); c.closePath()
      ext(subtract(c, 0.06, dz), 'creamWing')
    }
    ext(boxG(OPEN, DOOR_H + 1, 0.1).translate(0, y0 + (DOOR_H + 1) / 2, 0.05), 'creamWing')
    wings(ext, 'creamWing', 'creamDark', m.bronze, OPEN - 0.08, y0 + 0.02, DOOR_H, 0.14, 2)
    ext(boxG(OPEN, 0.16, 0.26).translate(0, y0 + DOOR_H + 0.1, 0.18), 'creamDark')
    ext(boxG(G + 0.2, 0.1, DER).translate(0, y0 + 0.05, DER / 2), m.innerMarble)
    return
  }
  // Outer face: photo of the marble-framed opening on the north facade, mirrored about the axis
  const doorUV = (x: number, yy: number) => groundUV('door', 1 - Math.abs(x) / (G / 2), (yy - y0) / (UPPER - y0))
  const outer = new THREE.Shape()
  outer.moveTo(-G / 2, y0); outer.lineTo(G / 2, y0); outer.lineTo(G / 2, UPPER); outer.lineTo(-G / 2, UPPER); outer.closePath()
  outer.holes.push(facadeArch(new THREE.Path(), 0, y0, OPEN, DOOR_H, ARCH))
  ext(projection(subtract(outer, 0.5, 0), doorUV), K.atlas)
  // Top molding projecting like an eave
  ext(projection(boxG(G + 0.24, 0.14, 0.62).translate(0, UPPER + 0.05, 0.31), (x, yy) => doorUV(x * 0.9, Math.min(yy, UPPER - 0.06))), K.atlas)
  // Pediment stone, door back, leaves
  ext(new THREE.ShapeGeometry(facadeArch(new THREE.Shape(), 0, y0 + DOOR_H, OPEN, 0.01, ARCH), 10).translate(0, 0, 0.28), K.facadeStone)
  // The leaves stand in front of the wall's base molding.
  ext(boxG(OPEN, DOOR_H, 0.06).translate(0, y0 + DOOR_H / 2, 0.29), m.dark)
  ext(projection(boxG(OPEN + 0.1, 0.18, 0.3).translate(0, y0 + DOOR_H, 0.38), (x, yy) => doorUV(x, yy - 1)), K.atlas)
  wings(ext, 'green', m.dark, m.bronze, OPEN - 0.05, y0 + 0.02, DOOR_H - 0.1, 0.36, 3)
  // Side colonnettes (as in the marble-framed opening on the north facade)
  for (const s of [-1, 1]) {
    ext(rotateG([[0.19, 0], [0.16, 0.2], [0.125, 0.34], [0.125, 2.52], [0.15, 2.64], [0.12, 2.74], [0.2, 2.98], [0.13, 3]], 12).translate(s * (OPEN / 2 + 0.03), y0, 0.56), m.innerMarble)
  }
  ext(boxG(OPEN + 0.5, 0.12, DER + 0.25).translate(0, y0 + 0.06, DER / 2 + 0.1), m.innerMarble)
}

/** Two painted wooden leaves with raised panels. */
function wings(ext: (g: THREE.BufferGeometry, m: Painted) => void, ana: Painted, dark: Painted, bronze: Mat, w: number, y0: number, h: number, z: number, ROW: number) {
  for (const s of [-1, 1]) {
    const kw = w / 2 - 0.02, kx = s * (w / 4)
    ext(boxG(kw, h, 0.09).translate(kx, y0 + h / 2, z), ana)
    const pw = kw - 0.34, ara = 0.2, ph = (h - ara * (ROW + 1)) / ROW
    for (let i = 0; i < ROW; i++) {
      const py = y0 + ara + ph / 2 + i * (ph + ara)
      // Raised panel with rounded edges: its shading is read from the edges
      ext(boxG(pw, ph, 0.03).translate(kx, py, z + 0.055), ana)
      for (const u of [-1, 1]) {
        ext(boxG(pw + 0.08, 0.035, 0.03).translate(kx, py + u * (ph / 2 + 0.018), z + 0.05), dark)
        ext(boxG(0.035, ph, 0.03).translate(kx + u * (pw / 2 + 0.018), py, z + 0.05), dark)
      }
    }
    ext(new THREE.TorusGeometry(0.075, 0.014, 6, 14).translate(s * 0.15, y0 + h * 0.47, z + 0.06), bronze)
  }
  ext(boxG(0.03, h, 0.02).translate(0, y0 + h / 2, z + 0.05), dark)
}

// --- Şadırvan kiosk ---
const KIOSK_OCTA = Math.cos(Math.PI / 8)

/** Edge of the trefoil arch opening: from the post base to the apex (left half). u -1..0, v 0..1 */
function trefoilEdge(): [number, number][] {
  const n: [number, number][] = []
  const rag = (p: [number, number], q: [number, number], r: [number, number], s: [number, number], step: number) => {
    for (let i = n.length ? 1 : 0; i <= step; i++) {
      const t = i / step, a = 1 - t
      n.push([a * a * a * p[0] + 3 * a * a * t * q[0] + 3 * a * t * t * r[0] + t * t * t * s[0], a * a * a * p[1] + 3 * a * a * t * q[1] + 3 * a * t * t * r[1] + t * t * t * s[1]])
    }
  }
  // Side lobe: a small lobe curling inward from beside the post
  rag([-1, 0], [-0.98, 0.16], [-0.86, 0.3], [-0.68, 0.3], 5)
  // Top lobe: wide lobe, pointed apex
  rag([-0.68, 0.3], [-0.84, 0.56], [-0.72, 0.8], [-0.38, 0.8], 6)
  rag([-0.38, 0.8], [-0.24, 0.82], [-0.08, 0.9], [0, 1], 4)
  return n
}

export function kiosk(k: Bucket, m: UluMosqueMaterials, K: DoorsMaterials, x: number, z: number) {
  const ext = (g: THREE.BufferGeometry, mat: Painted) => typeof mat === 'string' ? k.add(place(paint(g, mat), x, 0, z), K.atlas) : k.add(place(g, x, 0, z), mat)
  const octagon = (g: THREE.BufferGeometry) => { const d = g.index ? g.toNonIndexed() : g; d.computeVertexNormals(); return d }
  const faces = new Faces()
  // Proportions from the photo: post 3.45, arch band 1.87, frieze 1.33, eave 0.45, dome 4.7
  const R = 3.7, BASE = 0.28, TITLE = 3.7, FRIEZE_BOTTOM = 5.45, FRIEZE_TOP = 6.85, EAVE_TOP = 7.3, DOME_H = 4.75
  // Floor: stepped marble octagon and strip paving
  const floorUV = <G extends THREE.BufferGeometry>(g: G) => {
    const p = g.attributes.position, t = g.attributes.uv
    for (let i = 0; i < p.count; i++) { const [u, v] = photoUV(725 + p.getX(i) * 13, 1000 + p.getZ(i) * 13 + p.getY(i) * 13); t.setXY(i, u, v) }
    return g
  }
  ext(floorUV(octagon(cylinderG(4.25, 4.35, BASE, 8).rotateY(Math.PI / 8).translate(0, BASE / 2, 0))), K.atlas)
  // Basin: eight-sided, a paneled tap on each face (from the photo)
  const HV_R = 2.05, HV_H = 1.0, HV_Y = 0.42
  ext(floorUV(octagon(cylinderG(2.4, 2.55, HV_Y - BASE + 0.1, 8).rotateY(Math.PI / 8).translate(0, (HV_Y + BASE) / 2, 0))), K.atlas)
  for (let n = 0; n < 8; n++) {
    const a0 = (n / 8) * Math.PI * 2 + Math.PI / 8, a1 = ((n + 1) / 8) * Math.PI * 2 + Math.PI / 8
    const p = (a: number, r: number, yy: number, s: number, t: number) => [Math.sin(a) * r, yy, Math.cos(a) * r, ...groundUV('pool', s, t)]
    faces.quad(p(a0, HV_R, HV_Y, 0, 0), p(a1, HV_R, HV_Y, 1, 0), p(a1, HV_R, HV_Y + HV_H, 1, 1), p(a0, HV_R, HV_Y + HV_H, 0, 1))
  }
  ext(floorUV(octagon(cylinderG(HV_R + 0.1, HV_R + 0.1, 0.1, 8).rotateY(Math.PI / 8).translate(0, HV_Y + HV_H + 0.05, 0))), K.atlas)
  ext(cylinderG(HV_R - 0.08, HV_R - 0.08, 0.04, 8).rotateY(Math.PI / 8).translate(0, HV_Y + HV_H + 0.09, 0), 'water')
  // Central jet: stand and a tulip-shaped bowl
  ext(rotateG([[0.2, 0], [0.13, 0.1], [0.11, 0.45], [0.18, 0.55], [0.42, 0.72], [0.48, 0.82], [0.1, 0.72], [0, 0.72]], 16).translate(0, HV_Y + HV_H + 0.1, 0), m.marble)
  // Seats
  for (let n = 0; n < 8; n++) {
    const a = (n / 8) * Math.PI * 2
    ext(rotateG([[0.17, 0], [0.15, 0.3], [0.17, 0.32]], 8).translate(Math.sin(a) * 2.95, BASE, Math.cos(a) * 2.95), m.marble)
    ext(rotateG([[0.18, 0.32], [0.2, 0.42], [0.15, 0.5], [0, 0.52]], 8).translate(Math.sin(a) * 2.95, BASE, Math.cos(a) * 2.95), 'post')
  }

  // Posts: dark wood, octagonal, with capitals
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + (n * Math.PI) / 4, dx = R * Math.sin(a), dz = R * Math.cos(a)
    ext(rotateG([[0.2, BASE], [0.19, BASE + 0.1], [0.14, BASE + 0.18], [0.14, TITLE - 0.22], [0.2, TITLE - 0.12], [0.2, TITLE - 0.08], [0.26, TITLE], [0.14, TITLE + 0.05], [0.14, FRIEZE_BOTTOM]], 8).translate(dx, 0, dz), 'post')
  }
  // Railing: bottom and top bands, diagonals and posts (the cross pattern in the photo)
  const gen = 2 * R * Math.sin(Math.PI / 8), face = R * KIOSK_OCTA
  for (let n = 0; n < 8; n++) {
    const a = (n * Math.PI) / 4
    const piece = (g: THREE.BufferGeometry, mat: Painted) => ext(g.translate(0, 0, face).rotateY(a), mat)
    const g2 = gen - 0.3
    piece(boxG(g2, 0.08, 0.07).translate(0, BASE + 0.28, 0), 'post')
    piece(boxG(g2, 0.08, 0.07).translate(0, BASE + 1.02, 0), 'post')
    const b = g2 / 2 - 0.02, yk = 0.66
    for (const c of [-1, 1]) {
      piece(boxG(0.08, yk + 0.1, 0.07).translate((c * g2) / 6, BASE + 0.65, 0), 'post')
      for (const d of [-1, 1]) {
        const long = Math.hypot((b - g2 / 6), yk)
        const angle = Math.atan2(b - g2 / 6, yk)
        piece(boxG(0.05, long, 0.05).rotateZ(d * angle).translate((c * (b + g2 / 6)) / 2, BASE + 0.65, 0), 'post')
      }
    }
    // Trefoil-arched band: cream panel, dark edge
    const edge = trefoilEdge()
    const B0 = TITLE - 0.1, H = FRIEZE_BOTTOM - B0, O = gen / 2 - 0.17
    const point = (p: [number, number]): [number, number] => [p[0] * O, B0 + p[1] * H * 0.96]
    const right = edge.map(([u, v]) => point([-u, v])).reverse()
    const left = edge.map(point)
    const creamS = new THREE.Shape()
    creamS.moveTo(-O, FRIEZE_BOTTOM); creamS.lineTo(-O, left[0][1])
    for (const p of left) creamS.lineTo(p[0], p[1])
    for (const p of right.slice(1)) creamS.lineTo(p[0], p[1])
    creamS.lineTo(O, FRIEZE_BOTTOM); creamS.closePath()
    piece(subtract(creamS, 0.09, -0.05), 'cream')
    // Dark edge: a thickened strip along the trefoil line
    const all = [...left, ...right.slice(1)]
    const strip = new THREE.Shape()
    const KAL = 0.085
    const offset = all.map((p, i) => {
      const o = all[Math.max(0, i - 1)], s = all[Math.min(all.length - 1, i + 1)]
      const dx = s[0] - o[0], dy = s[1] - o[1], l = Math.hypot(dx, dy) || 1
      return [p[0] + (-dy / l) * KAL, p[1] + (dx / l) * KAL] as [number, number]
    })
    strip.moveTo(all[0][0], all[0][1])
    for (const p of all.slice(1)) strip.lineTo(p[0], p[1])
    for (const p of [...offset].reverse()) strip.lineTo(p[0], p[1])
    strip.closePath()
    piece(subtract(strip, 0.14, -0.08), 'post')
    // The band's top beam and frieze
    piece(boxG(gen + 0.06, 0.13, 0.2).translate(0, FRIEZE_BOTTOM, 0), 'post')
  }
  const oct = (top: number, bottom: number, h: number, yy: number, open = false) => octagon(cylinderG(top, bottom, h, 8, open).rotateY(Math.PI / 8).translate(0, yy + h / 2, 0))
  ext(oct(R + 0.08, R + 0.08, FRIEZE_TOP - FRIEZE_BOTTOM, FRIEZE_BOTTOM), 'cream')
  ext(oct(R + 0.11, R + 0.11, 0.17, FRIEZE_BOTTOM + 0.58), 'post')
  ext(oct(R + 0.34, R + 0.08, 0.32, FRIEZE_TOP - 0.1), 'cream')
  // Eave: wide, thin, lead-clad; sloping to the dome base
  ext(oct(R + 0.72, R + 0.72, 0.08, FRIEZE_TOP + 0.22), m.dark)
  ext(oct(3.15, R + 0.74, EAVE_TOP - FRIEZE_TOP - 0.3, FRIEZE_TOP + 0.3), m.lead)
  // Onion dome: 16 gores, full gores, thin seams, pointed at the top (from the photo)
  const PROF: [number, number][] = [[2.96, 0], [3.06, 0.32], [3.06, 0.95], [2.98, 1.32], [2.65, 1.85], [2.12, 2.25], [1.55, 2.62], [1.02, 3.05], [0.62, 3.5], [0.28, 4.05], [0.08, 4.6], [0.02, DOME_H]]
  const SLICE = 16, BOTTOM = 8
  const LINE = 26
  const points: [number, number][] = []
  for (let i = 0; i <= LINE; i++) {
    const t = (i / LINE) * (PROF.length - 1), a = Math.min(PROF.length - 2, Math.floor(t)), f = t - a
    points.push([PROF[a][0] + (PROF[a + 1][0] - PROF[a][0]) * f, PROF[a][1] + (PROF[a + 1][1] - PROF[a][1]) * f])
  }
  const dome = new Faces()
  const total = SLICE * BOTTOM
  const v = (i: number, j: number) => {
    const [r0, h] = points[i]
    const th = (j / total) * Math.PI * 2
    const dl = (j % BOTTOM) / BOTTOM // within-gore 0..1
    const swell = Math.sin(dl * Math.PI) ** 0.6
    const intensity = 0.035 + 0.05 * (1 - i / LINE) // the bulge decreases at the top but the seam continues
    const r2 = r0 * (1 - intensity * 0.55 + intensity * swell * 0.55)
    // Atlas: a two-gore middle crop, mirrored from gore to gore
    const two = (j / BOTTOM) % 2
    const s = two <= 1 ? two : 2 - two
    return [Math.sin(th) * r2, h + EAVE_TOP - 0.05, Math.cos(th) * r2, ...groundUV('dome', 0.02 + s * 0.96, Math.min(0.995, 0.02 + (i / LINE) * 0.97))]
  }
  for (let i = 0; i < LINE; i++) for (let j = 0; j < total; j++) dome.quad(v(i, j), v(i, j + 1), v(i + 1, j + 1), v(i + 1, j))
  const domeG = dome.geometry()
  soften(domeG)
  ext(domeG, K.atlas)
  ext(rotateG([[0.1, 0], [0.18, 0.1], [0.05, 0.22], [0.13, 0.38], [0.04, 0.5], [0.02, 0.86], [0, 0.9]], 8).translate(0, EAVE_TOP + DOME_H - 0.12, 0), m.bronze)
  ext(faces.geometry(), K.atlas)
}

/** Averages the normals of vertices at the same position: gores look smooth, seams stay sharp. */
function soften(g: THREE.BufferGeometry) {
  const p = g.attributes.position, n = g.attributes.normal
  const map = new Map<string, THREE.Vector3>()
  const a = new THREE.Vector3()
  const keyStr = (i: number) => `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
  for (let i = 0; i < p.count; i++) {
    const s = keyStr(i)
    const t = map.get(s) ?? new THREE.Vector3()
    t.add(a.set(n.getX(i), n.getY(i), n.getZ(i)))
    map.set(s, t)
  }
  for (let i = 0; i < p.count; i++) {
    const t = map.get(keyStr(i))
    if (t) { a.copy(t).normalize(); n.setXYZ(i, a.x, a.y, a.z) }
  }
}

/** A photo strip running along the wall (rough stone base, eave molding): pieces continue mirrored. */
export function strip(ext: (g: THREE.BufferGeometry) => void, name: 'pedestal' | 'eave', L: number, y0: number, h: number, d: number) {
  const n = Math.ceil(L / (name === 'pedestal' ? 4.5 : 10)), g = L / n
  const y = new Faces()
  for (let i = 0; i < n; i++) {
    const x0 = -L / 2 + i * g, x1 = x0 + g
    const s0 = i % 2 ? 1 : 0, s1 = 1 - s0
    y.quad([x0, y0, d, ...groundUV(name, s0, 0)], [x1, y0, d, ...groundUV(name, s1, 0)], [x1, y0 + h, d, ...groundUV(name, s1, 1)], [x0, y0 + h, d, ...groundUV(name, s0, 1)])
    y.quad([x0, y0 + h, d, ...groundUV(name, s0, 0.97)], [x1, y0 + h, d, ...groundUV(name, s1, 0.97)], [x1, y0 + h, -0.05, ...groundUV(name, s1, 1)], [x0, y0 + h, -0.05, ...groundUV(name, s0, 1)])
    y.quad([x0, y0, -0.05, ...groundUV(name, s0, 0)], [x1, y0, -0.05, ...groundUV(name, s1, 0)], [x1, y0, d, ...groundUV(name, s1, 0.03)], [x0, y0, d, ...groundUV(name, s0, 0.03)])
  }
  ext(y.geometry())
}
