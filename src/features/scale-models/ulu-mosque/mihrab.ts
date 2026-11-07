// Ulu Camii mihrab and qibla wall: surfaces carry the front-view texture extracted from archive photos
// (inscriptions included); the code generates no writing. Relief depths are representative, judged from the photos.
// Proportions from DJI_0325 (frontal view): frame height/width 1.52.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'
import { Bucket, rotateG, cylinderG, place } from '../uluMosquePiece'
import { lightDevice } from '../uluMosqueFloor'

type Mat = THREE.Material

/** Outer dimensions of the frame (m); texture space T: 1600 x 2432 px. */
export const MIHRAB = { G: 5.26, TOP: 8.75, DER: 0.95 }
const TG = 1600, TH = 2432
/** Position of the candlesticks: distance from the wall and offset from the axis (DJI_0325). */
export const CANDLESTICK = { x: 3.4, z: 0.85, r: 0.3 }

const loadTexture = (name: string) => {
  if (PUBLIC_BUILD) return null
  const t = new THREE.TextureLoader().load(`/images/ulu-mosque/model/${name}${lightDevice() ? '-1k' : ''}.jpg`)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Shows the texture like a photo without distorting it: part of the base color is independent of lighting. */
const photoMaterial = (map: THREE.Texture | null, color: string, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({
  map, color: map ? '#ffffff' : color, roughness: 0.62, metalness: 0,
  emissive: map ? '#ffffff' : '#000000', emissiveMap: map, emissiveIntensity: map ? 0.14 : 0, side: THREE.DoubleSide, ...p,
})

/** Local: x to the right, y up (world), z towards the room (wall face 0). */
export function uluMosqueMihrab(k: Bucket, wallZ: number, floor: number, m: { goldDark: Mat; cream: Mat; bronze: Mat; dark: Mat }) {
  const { G, TOP, DER } = MIHRAB
  const texFront = loadTexture('mihrab-full')
  const on = photoMaterial(texFront, '#b8924e')
  const gold = photoMaterial(texFront, '#c89a3c', { roughness: 0.42, metalness: 0.3, emissiveIntensity: texFront ? 0.12 : 0 })
  const tx = (t: number) => (t / TG - 0.5) * G
  const ty = (t: number) => TOP - (t / TH) * (TOP - floor)
  /** Planar projection: matches the photo exactly when seen head-on; the relief separates as you walk. */
  const projOf = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position, uv = g.attributes.uv ?? new THREE.BufferAttribute(new Float32Array(p.count * 2), 2)
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / G + 0.5, (p.getY(i) - floor) / (TOP - floor))
    g.setAttribute('uv', uv)
    return g
  }
  const ext = (g: THREE.BufferGeometry, mat: Mat = on) => k.add(place(g, 0, 0, wallZ, Math.PI), mat)
  const extD = (g: THREE.BufferGeometry, mat: Mat = on) => ext(projOf(g), mat)
  /** Quad (a,b,c,d counterclockwise, seen from the front). */
  const quad = (a: number[], b: number[], c: number[], d: number[]) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
    g.computeVertexNormals()
    return g
  }
  const shape = (s: THREE.Shape, z: number) => new THREE.ShapeGeometry(s, 14).translate(0, 0, z)
  const upright = (x0: number, y0: number, x1: number, y1: number) => {
    const s = new THREE.Shape()
    s.moveTo(tx(x0), ty(y0)); s.lineTo(tx(x0), ty(y1)); s.lineTo(tx(x1), ty(y1)); s.lineTo(tx(x1), ty(y0)); s.closePath()
    return s
  }

  /** A tier wrapping over the top and sides (open at the bottom): from the outer to the inner bound, with a face recessed at the inner edge. */
  const tier = (dx0: number, dy: number, dx1: number, ix0: number, iy: number, ix1: number, z: number, zInner: number) => {
    const s = new THREE.Shape()
    s.moveTo(tx(dx0), floor); s.lineTo(tx(dx0), ty(dy)); s.lineTo(tx(dx1), ty(dy)); s.lineTo(tx(dx1), floor)
    s.lineTo(tx(ix1), floor); s.lineTo(tx(ix1), ty(iy)); s.lineTo(tx(ix0), ty(iy)); s.lineTo(tx(ix0), floor); s.closePath()
    extD(shape(s, z))
    const i0 = tx(ix0), i1 = tx(ix1), iu = ty(iy)
    extD(quad([i0, floor, zInner], [i0, floor, z], [i0, iu, z], [i0, iu, zInner]))
    extD(quad([i1, floor, z], [i1, floor, zInner], [i1, iu, zInner], [i1, iu, z]))
    extD(quad([i0, iu, zInner], [i0, iu, z], [i1, iu, z], [i1, iu, zInner]))
  }
  const Z1 = DER, Z2 = DER - 0.03, Z3 = DER - 0.07, ZA = DER - 0.17, ZB = DER - 0.22, ZT = DER - 0.42
  tier(0, 8, 1600, 172, 198, 1430, Z1, Z2)
  tier(172, 198, 1430, 235, 267, 1365, Z2, Z3)

  // Blue band and the inscription plaque above it: the plaque projects slightly
  const LX0 = 290, LX1 = 1320, LY0 = 325, LY1 = 605
  const blue = new THREE.Shape()
  blue.moveTo(tx(235), floor); blue.lineTo(tx(235), ty(267)); blue.lineTo(tx(1365), ty(267)); blue.lineTo(tx(1365), floor)
  blue.lineTo(tx(1275), floor); blue.lineTo(tx(1275), ty(716)); blue.lineTo(tx(330), ty(716)); blue.lineTo(tx(330), floor); blue.closePath()
  extD(shape(blue, Z3))
  const ZL = Z3 + 0.05
  extD(shape(upright(LX0, LY0, LX1, LY1), ZL))
  for (const [a, b] of [[[LX0, LY1], [LX1, LY1]], [[LX1, LY1], [LX1, LY0]], [[LX1, LY0], [LX0, LY0]], [[LX0, LY0], [LX0, LY1]]]) {
    extD(quad([tx(a[0]), ty(a[1]), Z3], [tx(b[0]), ty(b[1]), Z3], [tx(b[0]), ty(b[1]), ZL], [tx(a[0]), ty(a[1]), ZL]))
  }
  // Step down from the blue band to the spandrel surface
  for (const [x, y0, x1] of [[330, 716, 1275]]) {
    extD(quad([tx(x), ty(y0), ZA], [tx(x), ty(y0), Z3], [tx(x1), ty(y0), Z3], [tx(x1), ty(y0), ZA]))
    extD(quad([tx(x), floor, ZA], [tx(x), floor, Z3], [tx(x), ty(y0), Z3], [tx(x), ty(y0), ZA]))
    extD(quad([tx(x1), floor, Z3], [tx(x1), floor, ZA], [tx(x1), ty(y0), ZA], [tx(x1), ty(y0), Z3]))
  }

  // Outer side faces and top
  extD(quad([tx(0), floor, 0], [tx(0), floor, Z1], [tx(0), ty(0), Z1], [tx(0), ty(0), 0]))
  extD(quad([tx(TG), floor, Z1], [tx(TG), floor, 0], [tx(TG), ty(0), 0], [tx(TG), ty(0), Z1]))
  extD(quad([tx(0), ty(0), Z1], [tx(TG), ty(0), Z1], [tx(TG), ty(0), 0], [tx(0), ty(0), 0]), m.goldDark)
  // Side buttress: the tier gap dropping behind the column
  for (const x of [330, 1275]) extD(quad([tx(x), floor, DER - 0.22], [tx(x), floor, ZA], [tx(x), ty(1511), ZA], [tx(x), ty(1511), DER - 0.22]))

  // Pointed arch: spandrel, inscribed band, tympanum. Arch curve from frame 0247.
  const AY0 = 1511, MID = 810
  const outerArch = (p: THREE.Path, inverse: boolean) => {
    const a: [number, number] = [340, AY0], t: [number, number] = [MID, 751], b: [number, number] = [1272, AY0]
    const k1: [number, number] = [430, 1085], k2: [number, number] = [1182, 1085]
    if (!inverse) { p.lineTo(tx(a[0]), ty(a[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(b[0]), ty(b[1])) }
    else { p.lineTo(tx(b[0]), ty(b[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(a[0]), ty(a[1])) }
  }
  const IY0 = 1471
  const innerArch = (p: THREE.Path, inverse: boolean) => {
    const a: [number, number] = [425, IY0], t: [number, number] = [MID, 841], b: [number, number] = [1192, IY0]
    const k1: [number, number] = [505, 1120], k2: [number, number] = [1112, 1120]
    if (!inverse) { p.lineTo(tx(a[0]), ty(a[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(b[0]), ty(b[1])) }
    else { p.lineTo(tx(b[0]), ty(b[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(a[0]), ty(a[1])) }
  }
  // Spandrel: outside the outer arch
  const cornerPiece = new THREE.Shape()
  cornerPiece.moveTo(tx(330), ty(AY0)); cornerPiece.lineTo(tx(330), ty(716)); cornerPiece.lineTo(tx(1275), ty(716)); cornerPiece.lineTo(tx(1275), ty(AY0))
  outerArch(cornerPiece, true); cornerPiece.closePath()
  extD(shape(cornerPiece, ZA))
  // Inscribed band
  const belt = new THREE.Shape()
  belt.moveTo(tx(340), ty(AY0))
  { const p = belt; p.quadraticCurveTo(tx(430), ty(1085), tx(MID), ty(751)); p.quadraticCurveTo(tx(1182), ty(1085), tx(1272), ty(AY0)) }
  belt.lineTo(tx(1192), ty(IY0)); innerArch(belt, true); belt.closePath()
  extD(shape(belt, ZB))
  // Tympanum
  const pediment = new THREE.Shape()
  pediment.moveTo(tx(425), ty(IY0)); innerArch(pediment, false); pediment.closePath()
  extD(shape(pediment, ZT))
  // Arch face tier: from spandrel to band, from band to tympanum
  const curve = (a: [number, number], c: [number, number], b: [number, number], n: number) => {
    const v = new THREE.QuadraticBezierCurve(new THREE.Vector2(tx(a[0]), ty(a[1])), new THREE.Vector2(tx(c[0]), ty(c[1])), new THREE.Vector2(tx(b[0]), ty(b[1])))
    return v.getPoints(n)
  }
  const strip = (points: THREE.Vector2[], z0: number, z1: number) => {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1]
      extD(quad([a.x, a.y, z0], [b.x, b.y, z0], [b.x, b.y, z1], [a.x, a.y, z1]))
    }
  }
  strip([...curve([340, AY0], [430, 1085], [MID, 751], 12), ...curve([MID, 751], [1182, 1085], [1272, AY0], 12)], ZB, ZA)
  strip([...curve([425, IY0], [505, 1120], [MID, 841], 12), ...curve([MID, 841], [1112, 1120], [1192, IY0], 12)], ZT, ZB)

  // Muqarnas: the tiers in frame 0247 (T space). Each tier consists of forward-bulging slices.
  const OFS = 586
  const tiers: [number, number, number, number, number][] = [
    // x0, x1, yTop, yBottom, slices
    [745, 870, 295, 395, 3],
    [695, 920, 396, 486, 4],
    [650, 965, 487, 553, 5],
    [555, 1060, 554, 618, 7],
    [540, 1075, 619, 680, 7],
    [490, 1122, 681, 735, 8],
    [465, 1148, 736, 838, 8],
  ]
  const zTier = (i: number) => ZT + 0.09 + (i / (tiers.length - 1)) * (DER - 0.04 - ZT - 0.09)
  tiers.forEach(([x0, x1, yu, ya, n], i) => {
    const X = n * 6, Y = 4, z = zTier(i), zOnce = i ? zTier(i - 1) : ZT
    const position: number[] = [], index: number[] = []
    for (let a = 0; a <= Y; a++) {
      const t = a / Y // 0 bottom, 1 top
      const y = ty(OFS + ya - (ya - yu) * t)
      const profile = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38 * (1 - 0.15)
      for (let b = 0; b <= X; b++) {
        const s = b / X
        const slice = Math.abs(Math.sin(s * n * Math.PI))
        const edge = Math.min(1, Math.min(s, 1 - s) * n * 2.5)
        const zz = zOnce + (z - zOnce) * profile + 0.055 * Math.pow(slice, 0.6) * profile
        position.push(tx(x0 + (x1 - x0) * s), y, ZT + (zz - ZT) * Math.pow(edge, 0.5))
      }
    }
    for (let a = 0; a < Y; a++) for (let b = 0; b < X; b++) {
      const p = a * (X + 1) + b, q = p + X + 1
      index.push(p, p + 1, q, q, p + 1, q + 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    g.setIndex(index)
    g.computeVertexNormals()
    extD(g, gold)
  })

  // Below the muqarnas: projecting gold ledge, niche ceiling
  const LIP_U = OFS + 838, LIP_A = OFS + 888, ZF = DER - 0.04
  extD(shape(upright(525, LIP_U, 1100, LIP_A), ZF), gold)
  extD(quad([tx(525), ty(LIP_U), ZT], [tx(525), ty(LIP_U), ZF], [tx(1100), ty(LIP_U), ZF], [tx(1100), ty(LIP_U), ZT]))
  extD(quad([tx(455), ty(LIP_A), ZF], [tx(1155), ty(LIP_A), ZF], [tx(1155), ty(LIP_A), 0.12], [tx(455), ty(LIP_A), 0.12]), m.goldDark)

  // Niche: back wall, side faces, columns
  const ZG = 0.12, ZO = DER - 0.22
  extD(shape(upright(525, LIP_A - 50, 1100, TH), ZG))
  for (const [xd, xi] of [[455, 525], [1155, 1100]]) {
    const a = [tx(xd), floor, ZO], b = [tx(xi), floor, ZG], c = [tx(xi), ty(LIP_A - 50), ZG], d = [tx(xd), ty(LIP_A - 50), ZO]
    extD(xd < xi ? quad(a, b, c, d) : quad(b, a, d, c))
  }
  // Flat face behind the columns and corner cladding
  for (const [x0, x1] of [[330, 455], [1155, 1275]]) extD(shape(upright(x0, AY0, x1, TH), ZO))
  // Band above the capitals
  for (const [x0, x1] of [[335, 460], [1150, 1270]]) {
    const y0 = OFS + 930, y1 = OFS + 1010
    extD(shape(upright(x0, y0, x1, y1), ZO + 0.17))
    extD(quad([tx(x0), ty(y1), ZO], [tx(x0), ty(y1), ZO + 0.17], [tx(x1), ty(y1), ZO + 0.17], [tx(x1), ty(y1), ZO]), m.goldDark)
    extD(quad([tx(x0), ty(y0), ZO + 0.17], [tx(x0), ty(y0), ZO], [tx(x1), ty(y0), ZO], [tx(x1), ty(y0), ZO + 0.17]))
  }
  // Columns: marble shaft, gold ring and base
  for (const s of [-1, 1]) {
    const x = s * (tx(1205) - tx(810)), r = 0.16, top = ty(OFS + 1012)
    ext(cylinderG(r, r, top - floor, 14).translate(x, (top + floor) / 2, ZO + 0.06), m.cream)
    ext(rotateG([[r + 0.05, 0], [r + 0.05, 0.2], [r + 0.02, 0.3], [r, 0.34]], 14).translate(x, floor, ZO + 0.06), m.goldDark)
    ext(new THREE.TorusGeometry(r + 0.012, 0.022, 6, 16).rotateX(Math.PI / 2).translate(x, top - 0.03, ZO + 0.06), m.goldDark)
  }

  // Candlesticks: copper stand and bowl, thick white candle (ERD05161, DJI_0325)
  for (const s of [-1, 1]) {
    const x = s * CANDLESTICK.x, z = CANDLESTICK.z, y0 = floor
    ext(rotateG([[0.27, 0], [0.26, 0.12], [0.1, 0.34], [0.07, 0.72], [0.12, 0.84], [0.05, 0.98], [0.07, 1.12], [0.24, 1.24], [0.26, 1.56]], 14).translate(x, y0, z), m.bronze)
    ext(cylinderG(0.21, 0.21, 1.95, 14).translate(x, y0 + 1.52 + 0.98, z), m.cream)
  }
}

/** The qibla wall around the mihrab: banner, two medallions, the wall panel to the east. Inscriptions from photos (ERD05161, DJI_0276, DJI_0325). */
export function qiblaWall(k: Bucket, wallZ: number, m: { dark: Mat; goldDark: Mat }) {
  const texture = loadTexture('mihrab-qibla')
  const mat = photoMaterial(texture, '#c8b48a', { roughness: 0.74, emissiveIntensity: texture ? 0.1 : 0 })
  const AW = 2048, AH = 1450
  const ext = (g: THREE.BufferGeometry, x: number, m2: Mat = mat) => k.add(place(g, x, 0, wallZ, Math.PI), m2)
  /** Planar mapping onto an atlas cell: g's x,y in meters; cell px = (x-x0)*scale. */
  const atlas = (g: THREE.BufferGeometry, hx: number, hy: number, xScale: number, yScale: number, xLeft: number, yTop: number) => {
    const p = g.attributes.position, uv = g.attributes.uv ?? new THREE.BufferAttribute(new Float32Array(p.count * 2), 2)
    for (let i = 0; i < p.count; i++) uv.setXY(i, (hx + (p.getX(i) - xLeft) * xScale) / AW, 1 - (hy + (yTop - p.getY(i)) * yScale) / AH)
    g.setAttribute('uv', uv)
    return g
  }
  /** Face + edges: a plaque standing off the wall; edges are dark. */
  const plaque = (s: THREE.Shape, z: number, setup: (g: THREE.BufferGeometry) => THREE.BufferGeometry, x: number) => {
    ext(setup(new THREE.ShapeGeometry(s, 16).translate(0, 0, z)), x)
    ext(new THREE.ExtrudeGeometry(s, { depth: z - 0.02, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, 0.005), x, m.dark)
  }

  // --- Banner: green plaque whose top follows the arch (cell 800x1430; S space 700x1250) ---
  const SG = 2.36, SH = SG * (1250 / 700), SY0 = MIHRAB.TOP - 0.04, WATER = SY0 + SH
  const flag = new THREE.Shape()
  flag.moveTo(-SG / 2, SY0); flag.lineTo(SG / 2, SY0); flag.lineTo(SG / 2, WATER - SH * (110 / 1250))
  flag.quadraticCurveTo(SG * 0.27, WATER - SH * 0.012, 0, WATER)
  flag.quadraticCurveTo(-SG * 0.27, WATER - SH * 0.012, -SG / 2, WATER - SH * (110 / 1250)); flag.closePath()
  const sScale = 800 / SG
  plaque(flag, 0.06, (g) => atlas(g, 0, 0, sScale, sScale, -SG / 2, WATER), 0)

  // --- Medallions (cell 500x500, oval 30..470 x 170..480) ---
  const MG = 1.39, MH = MG * (310 / 440), mScale = 440 / MG, MY = 7.16
  const medallion = (x: number, hy: number) => {
    const s = new THREE.Shape()
    s.absellipse(0, MY, MG / 2, MH / 2, 0, Math.PI * 2, false, 0)
    plaque(s, 0.06, (g) => atlas(g, 1540 + 30, hy + 170, mScale, mScale, -MG / 2, MY + MH / 2), x)
    // Bow: a small cut-out piece on top
    const top = MY + MH / 2
    const f = new THREE.Shape()
    const q = (px: number, py: number): [number, number] => [(px - 250) / mScale, top + (170 - py) / mScale]
    const point = [[172, 175], [205, 110], [190, 60], [215, 30], [250, 45], [285, 30], [310, 60], [295, 110], [328, 175]].map(([a, b]) => q(a, b))
    f.moveTo(...point[0]); point.slice(1).forEach((n) => f.lineTo(...n)); f.closePath()
    ext(atlas(new THREE.ShapeGeometry(f).translate(0, 0, 0.03), 1540 + 30, hy + 170, mScale, mScale, -MG / 2, top), x)
  }
  medallion(-3.45, 520)
  medallion(3.45, 0)

  // --- Wall panel: on the east side, with its crest (ERD05161, cell 700x1440) ---
  const PG = 2.55, pScale = 700 / PG, PY0 = 2.15, PU = PY0 + 1440 / pScale, PX = 6.55
  const py = (d: number) => PU - d * 1.575 / pScale
  const px = (d: number) => -PG / 2 + (d - 520) * 1.575 / pScale
  const board = new THREE.Shape()
  const outer: [number, number][] = [[522, 910], [965, 910], [965, 145], [940, 130], [912, 122], [905, 80], [880, 60], [835, 20], [800, 0], [730, 8], [665, 40], [652, 82], [595, 100], [578, 130], [522, 140]]
  board.moveTo(px(outer[0][0]), py(outer[0][1])); outer.slice(1).forEach(([a, b]) => board.lineTo(px(a), py(b))); board.closePath()
  ext(atlas(new THREE.ShapeGeometry(board).translate(0, 0, 0.012), 820, 0, pScale, pScale, -PG / 2, PU), PX)
}
