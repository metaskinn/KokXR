// Representative model of the Emir Sultan Complex. Source: Vakıf Eserleri Envanteri – Bursa, Yıldırım (pp. 273-313) and the
// photos on Drive. Dimension given in the source: prayer hall 15.20 × 15.20 m. Courtyard, portico, tomb, hamam and towers are proportioned
// from the bird's-eye photo; heights are representative. Units in meters. North -z, qibla (south) +z, east +x.
// Code is written in local coordinates: local z=0 is the courtyard center; OZ is added when moving to world (to center the base).
import * as THREE from 'three'
import type { Model } from '../uluMosqueModel'
import type { InteriorStop, InteriorWalk, Box, FloorArea } from '../uluMosqueInterior'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import { Bucket, type Mat, subtract, rect, rotateG, flatShadow, boxG, cylinderG, uvFit, place } from '../uluMosquePiece'
import { emirTextures, skyMaterial } from './emir-sultan-help/textures'

const OZ = -16
/** Levels: the tomb floor is the lowest (source: about one meter below the courtyard). Walking height is measured from this level. */
const TOMB_Y = 0.2, COURT_Y = 1.2, HALL_Y = 1.35
const BAY = TOMB_Y + 1.7
const hCourt = COURT_Y - TOMB_Y, hHall = HALL_Y - TOMB_Y

/** Prayer hall: 15.20 × 15.20 m per the source. */
const HALL_HALF = 7.6, WALL = 1.7
const HALL_Z0 = 12.9, HALL_Z1 = HALL_Z0 + 2 * HALL_HALF, HALL_MID = HALL_Z0 + HALL_HALF
const MOSQUE_OUT_X = HALL_HALF + WALL, MOSQUE_Z0 = HALL_Z0 - WALL, MOSQUE_Z1 = HALL_Z1 + WALL, MOSQUE_L = MOSQUE_Z1 - MOSQUE_Z0

/** Vertical layout inside the prayer hall (proportioned from the photo). */
const BAND1 = HALL_Y + 4.4, CORNICE = HALL_Y + 8.8, VAULT_TOP = HALL_Y + 14
const ARCH_RISE = VAULT_TOP - CORNICE
const DRUM_BOTTOM = VAULT_TOP, DRUM_H = 2.3, DOME_IN_R = 7.3, DOME_IN_H = 6.1
const EAVE = 14.2, EAVE_MID = 16.5

/** Courtyard and portico: from the bird's-eye photo. */
const COURT_X = 11, COURT_Z0 = 6.5, PORTICO_OUT_X = 15, PORTICO_K_Z = -10, PILLAR_H = 3.25, PORTICO_TOP = COURT_Y + 4.35

/** Tomb: octagonal. Outer apothem and center. */
const TOMB_Z = -19.2, TOMB_OUT = 7, TOMB_IN = 6.2, TOMB_H = 8.9, TOMB_EDGE = 2 * TOMB_OUT * Math.tan(Math.PI / 8)
/** The tomb entrance is on the southeast face; the corridor descends northward to it (representative; source: entrance from the east). */
const ENTRY_X0 = 3.3, ENTRY_X1 = 5.5, ENTRY_Z = -15.4

/** Minbar: slightly wider than real for a one-cell walkable stair. */
const MINBAR_X = -4.7, MINBAR_W = 1.7, MINBAR_Z0 = HALL_Z1 - 7.3, MINBAR_RAMP = { z0: MINBAR_Z0 + 0.8, z1: MINBAR_Z0 + 5.2, h: 3 }

function roundArch<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, flat: number): P {
  const o = g / 2
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, y0 + flat)
  p.absarc(cx, y0 + flat, o, Math.PI, 0, true)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

/** Ogee (kaş) arch: rising concave from the column top and pointed in the middle, the portico arc in the photo. */
function ogeeArch<P extends THREE.Path>(p: P, a: number, b: number, y0: number, h: number): P {
  const o = (b - a) / 2, m = (a + b) / 2
  p.moveTo(a, y0)
  p.bezierCurveTo(a + o * 0.02, y0 + h * 0.72, m - o * 0.42, y0 + h * 0.62, m, y0 + h)
  p.bezierCurveTo(m + o * 0.42, y0 + h * 0.62, b - o * 0.02, y0 + h * 0.72, b, y0)
  p.closePath()
  return p
}

/** Band: single surface, flat on top, ogee-arched below. */
function beltShape(a: number, b: number, y0: number, h: number, top: number) {
  const o = (b - a) / 2, m = (a + b) / 2, s = new THREE.Shape()
  s.moveTo(a, y0)
  s.bezierCurveTo(a + o * 0.02, y0 + h * 0.72, m - o * 0.42, y0 + h * 0.62, m, y0 + h)
  s.bezierCurveTo(m + o * 0.42, y0 + h * 0.62, b - o * 0.02, y0 + h * 0.72, b, y0)
  s.lineTo(b, top); s.lineTo(a, top); s.closePath()
  return s
}

/** Strip around the ogee arch: outer arc, then inner arc in the reverse direction. */
function ogeeStrip(a: number, b: number, y0: number, h: number, t: number) {
  const o = (b - a) / 2, m = (a + b) / 2, s = new THREE.Shape()
  const h2 = h + t
  s.moveTo(a, y0)
  s.bezierCurveTo(a + o * 0.02, y0 + h2 * 0.72, m - o * 0.42, y0 + h2 * 0.62, m, y0 + h2)
  s.bezierCurveTo(m + o * 0.42, y0 + h2 * 0.62, b - o * 0.02, y0 + h2 * 0.72, b, y0)
  const a2 = a + t, b2 = b - t, o2 = (b2 - a2) / 2
  s.lineTo(b2, y0)
  s.bezierCurveTo(b2 - o2 * 0.02, y0 + h * 0.72, m + o2 * 0.42, y0 + h * 0.62, m, y0 + h)
  s.bezierCurveTo(m - o2 * 0.42, y0 + h * 0.62, a2 + o2 * 0.02, y0 + h * 0.72, a2, y0)
  s.closePath()
  return s
}

/** U-shaped frame around the arch: outer and inner arcs start from the same base. */
function archFrame(cx: number, y0: number, gOuter: number, gInner: number, flat: number) {
  const ro = gOuter / 2, ri = gInner / 2, s = new THREE.Shape()
  s.moveTo(cx - ro, y0)
  s.lineTo(cx - ro, y0 + flat)
  s.absarc(cx, y0 + flat, ro, Math.PI, 0, true)
  s.lineTo(cx + ro, y0)
  s.lineTo(cx + ri, y0)
  s.lineTo(cx + ri, y0 + flat)
  s.absarc(cx, y0 + flat, ri, 0, Math.PI, false)
  s.lineTo(cx - ri, y0)
  s.closePath()
  return s
}

/** Lead roof sloping to four sides. */
function hipRoof(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, inner: number) {
  const a: number[][] = [[x0, y0, z1], [x1, y0, z1], [x1 - inner, y1, z1 - inner], [x0 + inner, y1, z1 - inner]]
  const b: number[][] = [[x1, y0, z0], [x0, y0, z0], [x0 + inner, y1, z0 + inner], [x1 - inner, y1, z0 + inner]]
  const c: number[][] = [[x1, y0, z1], [x1, y0, z0], [x1 - inner, y1, z0 + inner], [x1 - inner, y1, z1 - inner]]
  const d: number[][] = [[x0, y0, z0], [x0, y0, z1], [x0 + inner, y1, z1 - inner], [x0 + inner, y1, z0 + inner]]
  const top: number[][] = [[x0 + inner, y1, z1 - inner], [x1 - inner, y1, z1 - inner], [x1 - inner, y1, z0 + inner], [x0 + inner, y1, z0 + inner]]
  const position: number[] = [], uv: number[] = []
  for (const q of [a, b, c, d, top]) {
    const L = Math.hypot(q[1][0] - q[0][0], q[1][2] - q[0][2]), E = Math.hypot(q[3][1] - q[0][1], q[3][2] - q[0][2], q[3][0] - q[0][0])
    const u = [[0, 0], [L, 0], [L, E], [0, E]]
    for (const i of [0, 1, 2, 0, 2, 3]) { position.push(...q[i]); uv.push(u[i][0], u[i][1]) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Ribbed lead dome: slight seam relief along the segments. */
function ribbedDome(R: number, h: number, slice: number, skirt = 0.25) {
  const profile: [number, number][] = [[R + 0.3, -skirt], [R, 0]]
  for (let t = 1; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    profile.push([Math.max(R * Math.pow(Math.cos(a), 0.85), 0.001), h * Math.pow(Math.sin(a), 1.05)])
  }
  const P = 4, g = rotateG(profile, slice * P, [1, 1])
  const pose = g.attributes.position, uv = g.attributes.uv
  for (let v = 0; v < pose.count; v++) {
    const r = Math.hypot(pose.getX(v), pose.getZ(v))
    if (r > 0.2 && Math.round(uv.getX(v) * slice * P) % P === 0) {
      const k = 1 + 0.06 / r
      pose.setX(v, pose.getX(v) * k); pose.setZ(v, pose.getZ(v) * k)
    }
  }
  g.computeVertexNormals()
  return g
}

/** Transition from square piers to a circular mouth. Where `isOpen` is true, the surface is not built: arch openings face the wall. */
function pendentiveG(R: number, half: number, y0: number, y1: number, isOpen: (dx: number, dz: number, y: number, far: number) => boolean) {
  const SEG = 96, ROW = 14
  const position: number[] = [], uv: number[] = [], index: number[] = [], ac: boolean[] = []
  for (let s = 0; s <= ROW; s++) {
    const t = s / ROW, e = Math.pow(t, 0.8)
    for (let a = 0; a <= SEG; a++) {
      const theta = (a / SEG) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
      const far = half / Math.max(Math.abs(dx), Math.abs(dz))
      const r = THREE.MathUtils.lerp(far, R, e), y = THREE.MathUtils.lerp(y0, y1, t)
      position.push(dx * r, y, dz * r)
      uv.push((a / SEG) * 4, t)
      ac.push(isOpen(dx * r, dz * r, y, far))
    }
  }
  for (let s = 0; s < ROW; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    if (ac[p] && ac[q] && ac[p + 1] && ac[q + 1]) continue
    index.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

export const building = (): Model => {
  const m = uluMosqueMaterials()
  const d = emirTextures()
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  // Shared ground materials carry the Ulu Camii pier shadow; here the same textures are used without shadow.
  const courtyardMarble = pbr({ map: m.marblePaving.map, bumpMap: m.marblePaving.bumpMap, bumpScale: 0.3, color: '#d5d8db', roughness: 0.3 })
  const carpet = m.carpetPlain.clone(); carpet.color.set('#d9452a')
  const alternating = pbr({ map: d.alternating.color, bumpMap: d.alternating.relief, bumpScale: 0.8, color: '#d9d0c4', roughness: 0.92 })
  const plaster = pbr({ color: '#efe4cf', roughness: 0.88, side: THREE.DoubleSide })
  // Slight emissive: so the portico ceiling does not turn brown in the inner shadow.
  const whitePaint = pbr({ color: '#f5f0e4', emissive: '#4a453a', roughness: 0.82, side: THREE.DoubleSide })
  const innerWall = pbr({ color: '#f1d6c4', roughness: 0.84, side: THREE.DoubleSide })
  const grayMolding = pbr({ color: '#a7a095', roughness: 0.65 })
  const grayBand = pbr({ color: '#bdb7ad', roughness: 0.6 })
  const darkWood = pbr({ color: '#33231a', roughness: 0.62, side: THREE.DoubleSide })
  const redWood = pbr({ color: '#7c3a22', roughness: 0.5, side: THREE.DoubleSide })
  const columnWhite = m.innerMarble
  const columnBrown = pbr({ map: m.innerMarble.map, color: '#c9a585', roughness: 0.36 })
  const columnGreen = pbr({ map: m.innerMarble.map, color: '#7f9a8b', roughness: 0.36 })
  const floorBrick = pbr({ color: '#a44f35', roughness: 0.82 })
  const glassOuter = pbr({ map: d.windowOuter, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide })
  const lit = (map: THREE.Texture, k = 1.4) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k * 0.98), side: THREE.DoubleSide })
  const glassTop = lit(d.transom), camAlt = lit(d.lowerWindow, 1.25)
  const iron = pbr({ map: d.iron, roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide })
  const ironInner = lit(d.ironLight, 1.35)
  const innerDome = pbr({ map: d.innerDome, roughness: 0.9, side: THREE.DoubleSide })
  const pendentive = pbr({ map: d.pendentive, roughness: 0.9, side: THREE.DoubleSide })
  const niche = pbr({ map: d.niche, roughness: 0.75, side: THREE.DoubleSide })
  const cloak = pbr({ map: d.cloak, roughness: 0.75 })
  const railingM = pbr({ map: d.railing, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide })
  const tombWall = pbr({ map: d.tombWall, roughness: 0.55, side: THREE.DoubleSide })
  const medallion = pbr({ color: '#17140f', roughness: 0.4 })
  const plaque = pbr({ color: '#17140f', roughness: 0.45 })
  const plaqueGreen = pbr({ color: '#1c5a3c', roughness: 0.5, side: THREE.DoubleSide })
  const planeTree = pbr({ color: '#6c7a34', roughness: 1 })
  const glassLamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.4, 1.15) })
  const grave = pbr({ color: '#d9d5ca', roughness: 0.7 })
  const glassYellow = pbr({ color: '#c8a557', roughness: 0.55 })

  class Local extends Bucket {
    add(g: THREE.BufferGeometry, mat: Mat) { g.translate(0, 0, OZ); super.add(g, mat) }
  }
  const k = new Local(), kRoof = new Local(), kDrum = new Local(), kDome = new Local()
  const box = (g: number, h: number, dd: number, mat: Mat, x: number, y: number, z: number, kv: Bucket = k) => kv.add(place(boxG(g, h, dd), x, y, z), mat)
  /** Box by its bounds: x0-x1, y0-y1, z0-z1. */
  const block = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat, kv: Bucket = k) =>
    box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, kv)

  // --- Ground: stone-paved base and the complex's raised platform (tomb pit open) ---
  const floor = new THREE.CircleGeometry(54, 96).rotateX(-Math.PI / 2).translate(0, 0.01, -OZ)
  const zp = floor.attributes.position, zu = floor.attributes.uv
  for (let i = 0; i < zu.count; i++) zu.setXY(i, zp.getX(i), zp.getZ(i))
  k.add(floor, m.paving)
  const terrace = rect(-21, -MOSQUE_Z1 - 3, 21, 29)
  // The tomb pit and descending corridor are a single polygon; shape y is -z.
  const A = 6.45, S = A * Math.tan(Math.PI / 8), CX0 = ENTRY_X0 - 0.1, CX1 = ENTRY_X1 + 0.1
  const edgeZ = (x: number) => TOMB_Z + A - (x - S)
  const terraceHole = new THREE.Path()
  const hole: [number, number][] = [[-S, TOMB_Z + A], [S, TOMB_Z + A], [CX0, edgeZ(CX0)], [CX0, -9.9], [CX1, -9.9], [CX1, edgeZ(CX1)], [A, TOMB_Z + S], [A, TOMB_Z - S], [S, TOMB_Z - A], [-S, TOMB_Z - A], [-A, TOMB_Z - S], [-A, TOMB_Z + S]]
  hole.forEach(([x, z], i) => { if (i) terraceHole.lineTo(x, -z); else terraceHole.moveTo(x, -z) })
  terraceHole.closePath()
  terrace.holes.push(terraceHole)
  k.add(subtract(terrace, COURT_Y).rotateX(-Math.PI / 2), m.stone)
  // Marble strip on the qibla side of the platform and the tomb floor
  k.add(flatShadow(cylinderG(6.9, 6.9, 0.1, 8).rotateY(Math.PI / 8)).translate(0, TOMB_Y - 0.05, TOMB_Z), carpet)
  block(ENTRY_X0 - 0.1, ENTRY_X1 + 0.1, 0.1, TOMB_Y, -16, -10, m.marble)

  // --- Courtyard: marble paving and octagonal şadırvan ---
  block(-COURT_X, COURT_X, COURT_Y, COURT_Y + 0.03, -COURT_Z0, COURT_Z0, courtyardMarble)
  fountain()

  // --- Porticoes: sixteen columns, ogee arches ---
  // Six each in the north and south rows, two each between the four corners on the east and west: sixteen in total (source). Arrangement is representative.
  const PILLAR_X = [-COURT_X, -6.6, -2.2, 2.2, 6.6, COURT_X], PILLAR_Z = [-2.2, 2.2]
  const pillarM = [columnWhite, columnBrown, columnGreen, columnWhite, columnGreen, columnBrown]
  const pillar = (x: number, z: number, mat: Mat, base = HALL_Y) => {
    const h = base + PILLAR_H
    k.add(place(rotateG([[0.27, 0], [0.27, 0.16], [0.21, 0.28], [0.17, 0.55], [0.15, h - base - 0.4], [0.17, h - base - 0.33]], 14), x, base, z), mat)
    k.add(place(flatShadow(cylinderG(0.32, 0.18, 0.28, 8).rotateY(Math.PI / 8)), x, h - 0.17, z), columnWhite)
    box(0.66, 0.1, 0.66, columnWhite, x, h - 0.0, z)
  }
  PILLAR_X.forEach((x, i) => { pillar(x, COURT_Z0, pillarM[i]); pillar(x, -COURT_Z0, pillarM[(i + 3) % 6]) })
  for (const x of [-COURT_X, COURT_X]) PILLAR_Z.forEach((z, i) => pillar(x, z, pillarM[i + 1], COURT_Y + 0.15))

  /** Band between columns: white-painted surface, dark wood around the ogee arc. `ry` for the east-west row. */
  const belt = (a: number, b: number, fixed: number, ry: number, yArch: number, top: number, archH: number) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(ry ? place(g, fixed, 0, 0, ry) : place(g, 0, 0, fixed), mat)
    ext(subtract(beltShape(a + 0.02, b - 0.02, yArch, archH, top), 0.2, -0.1), whitePaint)
    ext(subtract(ogeeStrip(a, b, yArch, archH - 0.03, 0.1), 0.28, -0.14), darkWood)
    // Post above the column
    for (const x of [a, b]) ext(boxG(0.2, top - yArch, 0.3).translate(x, (top + yArch) / 2, 0), darkWood)
  }
  const ARCH_Y = HALL_Y + PILLAR_H + 0.05
  for (let i = 0; i < 5; i++) {
    const a = PILLAR_X[i], b = PILLAR_X[i + 1]
    const mid = i === 2
    // The arches in front of the mosque and tomb entrances are taller (source).
    belt(a, b, COURT_Z0, 0, ARCH_Y, mid ? PORTICO_TOP + 2.2 : PORTICO_TOP, mid ? 3.35 : 1.05)
    belt(a, b, -COURT_Z0, 0, ARCH_Y, mid ? PORTICO_TOP + 2.2 : PORTICO_TOP, mid ? 3.35 : 1.05)
  }
  const zRow = [-COURT_Z0, -2.2, 2.2, COURT_Z0]
  for (let i = 0; i < 3; i++) for (const x of [-COURT_X, COURT_X]) belt(zRow[i], zRow[i + 1], x, Math.PI / 2, ARCH_Y - 0.05, PORTICO_TOP, 0.95)

  // Portico floors, ceilings and eave beams
  block(-PORTICO_OUT_X, PORTICO_OUT_X, COURT_Y, HALL_Y, COURT_Z0 - 0.35, MOSQUE_Z0, carpet)
  block(-PORTICO_OUT_X, PORTICO_OUT_X, COURT_Y, HALL_Y, PORTICO_K_Z, -COURT_Z0 + 0.35, floorBrick)
  for (const s of [-1, 1]) {
    block(s > 0 ? COURT_X - 0.35 : -PORTICO_OUT_X, s > 0 ? PORTICO_OUT_X : -COURT_X + 0.35, COURT_Y, HALL_Y, -COURT_Z0, COURT_Z0, floorBrick)
    block(s > 0 ? COURT_X : -PORTICO_OUT_X, s > 0 ? PORTICO_OUT_X : -COURT_X, PORTICO_TOP - 0.1, PORTICO_TOP, -COURT_Z0 - 0.2, COURT_Z0 + 0.2, whitePaint)
    // East-west eave and roof
    block(s > 0 ? COURT_X - 0.45 : -COURT_X - 0.12, s > 0 ? COURT_X + 0.12 : -COURT_X + 0.45, PORTICO_TOP, PORTICO_TOP + 0.3, -COURT_Z0, COURT_Z0, darkWood)
    kRoof.add(s > 0 ? hipRoof(COURT_X - 0.5, PORTICO_OUT_X + 0.4, -COURT_Z0, COURT_Z0, PORTICO_TOP + 0.28, PORTICO_TOP + 1.2, 0.4) : hipRoof(-PORTICO_OUT_X - 0.4, -COURT_X + 0.5, -COURT_Z0, COURT_Z0, PORTICO_TOP + 0.28, PORTICO_TOP + 1.2, 0.4), m.lead)
  }

  southBlock()
  northBlock()
  eastWestWalls()
  mosqueBody()
  mosqueInterior()
  minaret(-MOSQUE_OUT_X - 0.6, MOSQUE_Z0 + 0.6)
  minaret(MOSQUE_OUT_X + 0.6, MOSQUE_Z0 + 0.6)
  tomb()
  outerMasses()
  surroundings()

  const root = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)
  // Sky seen from the courtyard: drawn only while walking.
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 32, 16), skyMaterial(0, OZ + 1.5, 33))
  sky.frustumCulled = false
  root.add(sky)

  return {
    root,
    layers: [
      { group: roofGroup, height: 16, ad: 'Çatılar' },
      { group: drumGroup, height: 26, ad: 'Kasnaklar' },
      { group: domeGroup, height: 36, ad: 'Kubbeler' },
    ],
    stops: stops(),
    walking: walking(),
    camera: { position: [-88, 62, -34], target: [0, 8, -8] },
    pedestalRadius: 56,
    innerLights: [
      [0, HALL_Y + 12, HALL_MID + OZ],
      [0, HALL_Y + 5.5, HALL_MID - 3 + OZ],
      [0, COURT_Y + 3.4, 3 + OZ],
      [0, TOMB_Y + 6.5, TOMB_Z + OZ],
    ],
  }

  // ---------------------------------------------------------------------------------------------------------------

  function fountain() {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, COURT_Y + 0.03, 0), mat)
    ext(flatShadow(cylinderG(3.95, 4.15, 0.22, 8).rotateY(Math.PI / 8).translate(0, 0.11, 0)), columnWhite)
    ext(flatShadow(cylinderG(2.75, 2.9, 1.0, 8).rotateY(Math.PI / 8).translate(0, 0.72, 0)), m.marble)
    ext(flatShadow(cylinderG(2.9, 2.9, 0.12, 8).rotateY(Math.PI / 8).translate(0, 1.24, 0)), columnWhite)
    ext(new THREE.CylinderGeometry(2.55, 2.55, 0.03, 32).translate(0, 1.18, 0), m.water)
    // Corner posts and spouts on the faces
    for (let n = 0; n < 8; n++) {
      const a = Math.PI / 8 + (n * Math.PI) / 4
      k.add(place(boxG(0.2, 1.15, 0.2).translate(0, COURT_Y + 0.8, 2.92), 0, 0, 0, a), columnWhite)
      const face = (n * Math.PI) / 4
      k.add(place(boxG(1.1, 0.5, 0.05).translate(0, COURT_Y + 0.72, 2.68), 0, 0, 0, face), columnWhite)
      k.add(place(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8).rotateX(Math.PI / 2).translate(0, COURT_Y + 0.92, 2.8), 0, 0, 0, face), m.bronze)
      // Stools
      const r = 3.45
      k.add(place(rotateG([[0.17, 0], [0.09, 0.17], [0.2, 0.34], [0, 0.36]], 10), Math.sin(face + 0.2) * r, COURT_Y + 0.24, Math.cos(face + 0.2) * r), m.marbleDark)
    }
    // Fountain basins
    ext(rotateG([[0.45, 0.95], [0.16, 1.32], [0.55, 1.6], [0.6, 1.68], [0.12, 1.76], [0.09, 2.15], [0.34, 2.32], [0.36, 2.38], [0.07, 2.45], [0.05, 2.75], [0.12, 2.86], [0.02, 3.02], [0, 3.04]], 16), columnWhite)
  }

  /** Mosque front: two-storey portico; above it the white wall and windows of the women's gallery. */
  function southBlock() {
    const pocket = COURT_Z0, inner = MOSQUE_Z0
    // Portico ceiling and upper-floor wall
    block(-PORTICO_OUT_X, PORTICO_OUT_X, PORTICO_TOP - 0.05, PORTICO_TOP + 0.05, pocket, inner, whitePaint)
    const UPPER = PORTICO_TOP + 4
    const wall = rect(-PORTICO_OUT_X, PORTICO_TOP, PORTICO_OUT_X, UPPER)
    const windowX = [-12.6, -9.4, -6.2, 6.2, 9.4, 12.6]
    for (const x of windowX) wall.holes.push(rect(x - 0.62, PORTICO_TOP + 1.05, x + 0.62, PORTICO_TOP + 3.05) as unknown as THREE.Path)
    k.add(subtract(wall, 0.25, pocket - 0.05), whitePaint)
    for (const x of windowX) {
      block(x - 0.72, x + 0.72, PORTICO_TOP + 0.95, PORTICO_TOP + 3.15, pocket - 0.02, pocket + 0.02, darkWood)
      k.add(uvFit(new THREE.PlaneGeometry(1.24, 2).translate(x, PORTICO_TOP + 2.05, pocket - 0.04)), glassOuter)
      k.add(uvFit(new THREE.PlaneGeometry(1.24, 2).rotateY(Math.PI).translate(x, PORTICO_TOP + 2.05, pocket + 0.2)), iron)
    }
    // Window posts and horizontal beams
    for (const x of [-15, -11, -4.4, -2.2, 2.2, 4.4, 11, 15]) block(x - 0.1, x + 0.1, PORTICO_TOP, UPPER, pocket - 0.1, pocket + 0.05, darkWood)
    block(-PORTICO_OUT_X - 0.5, -2.2, PORTICO_TOP - 0.02, PORTICO_TOP + 0.28, pocket - 0.7, pocket + 0.2, darkWood)
    block(2.2, PORTICO_OUT_X + 0.5, PORTICO_TOP - 0.02, PORTICO_TOP + 0.28, pocket - 0.7, pocket + 0.2, darkWood)
    // Circular medallion in the middle section (based on the photo)
    const ring = new THREE.Shape(); ring.absarc(0, UPPER - 1.05, 0.72, 0, Math.PI * 2, false)
    const ringD = new THREE.Path(); ringD.absarc(0, UPPER - 1.05, 0.6, 0, Math.PI * 2, true); ring.holes.push(ringD)
    k.add(subtract(ring, 0.1, pocket - 0.1), darkWood)
    // Eave and hipped roof
    block(-PORTICO_OUT_X - 0.6, PORTICO_OUT_X + 0.6, UPPER, UPPER + 0.34, pocket - 0.8, inner + 0.2, darkWood)
    block(-PORTICO_OUT_X - 0.8, PORTICO_OUT_X + 0.8, UPPER + 0.2, UPPER + 0.3, pocket - 1, inner + 0.3, darkWood)
    kRoof.add(hipRoof(-PORTICO_OUT_X - 0.9, PORTICO_OUT_X + 0.9, pocket - 1.1, inner + 0.5, UPPER + 0.3, UPPER + 2.05, 2), m.lead)
    // Outer side wall and back
    for (const s of [-1, 1]) {
      block(s > 0 ? PORTICO_OUT_X - 0.35 : -PORTICO_OUT_X, s > 0 ? PORTICO_OUT_X : -PORTICO_OUT_X + 0.35, COURT_Y, UPPER, pocket, inner + 0.1, alternating)
      block(s > 0 ? MOSQUE_OUT_X : -PORTICO_OUT_X, s > 0 ? PORTICO_OUT_X : -MOSQUE_OUT_X, COURT_Y, UPPER, inner - 0.3, inner, alternating)
    }
    // Two small rooms in the portico (imam and muezzin): wooden front, door and window.
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? COURT_X : -PORTICO_OUT_X, x1 = s > 0 ? PORTICO_OUT_X : -COURT_X
      block(x0, x1, HALL_Y, PORTICO_TOP - 0.05, pocket + 0.45, inner, darkWood)
      block(s * 12.2 - 0.5, s * 12.2 + 0.5, HALL_Y, HALL_Y + 2.2, pocket + 0.42, pocket + 0.46, redWood)
      // Eight steps up to the gallery (source). The steps are for appearance; the upper floor is not walkable.
      for (let i = 0; i < 8; i++) {
        const u = i / 8, z0 = inner - 3.6 + u * 3.3
        const xa = s > 0 ? 8.7 : -COURT_X + 0.05, xb = s > 0 ? COURT_X - 0.05 : -8.7
        block(xa, xb, HALL_Y, HALL_Y + 0.2 * (i + 1), z0, inner - 0.1, redWood)
      }
    }
    // Back wall: prayer hall door, mihrab niches on both sides and cut-stone facade
    const frontY = HALL_Y
    block(-1.55, -1.15, frontY, frontY + 3.75, inner - 0.08, inner, m.marble)
    block(1.15, 1.55, frontY, frontY + 3.75, inner - 0.08, inner, m.marble)
    block(-1.55, 1.55, frontY + 3.35, frontY + 3.75, inner - 0.08, inner, m.marble)
    // Inscription panel: 0.50 × 1.50 m (source). No inscription is shown.
    block(-0.75, 0.75, frontY + 3.82, frontY + 4.32, inner - 0.08, inner, columnWhite)
    for (const s of [-1, 1]) {
      const n = roundArch(new THREE.Shape(), 0, frontY + 0.1, 1.1, 1.9)
      k.add(place(subtract(n, 0.04, inner - 0.05), s * 5.5, 0, 0), columnWhite)
      k.add(place(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, frontY + 0.25, 0.8, 1.75), 10).translate(0, 0, inner - 0.06), s * 5.5, 0, 0), m.cream)
    }
  }

  /** Tomb front: north portico, niyaz window, wooden kiosk. */
  function northBlock() {
    const z = PORTICO_K_Z, y0 = COURT_Y, top = PORTICO_TOP
    const wall = rect(-PORTICO_OUT_X, y0, PORTICO_OUT_X, top)
    const holes = [-11.4, -8, -4.5, 8, 11.4]
    for (const x of holes) wall.holes.push(roundArch(new THREE.Path(), x, HALL_Y + 0.5, 1.5, 1.8))
    wall.holes.push(roundArch(new THREE.Path(), 4.4, HALL_Y, 1.8, 2.15))
    wall.holes.push(roundArch(new THREE.Path(), 0, HALL_Y + 0.25, 2.6, 2))
    // Outside-inside: stone and brick facade, not plaster
    const s = subtract(wall, 0.7, z - 0.7)
    k.add(s, alternating)
    block(-PORTICO_OUT_X, PORTICO_OUT_X, PORTICO_TOP - 0.05, PORTICO_TOP + 0.05, z, -COURT_Z0, whitePaint)
    // Framed windows
    for (const x of holes) {
      k.add(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), x, HALL_Y + 0.5, 1.5, 1.8), 10)).translate(0, 0, z - 0.3), iron)
      k.add(subtract(archFrame(x, HALL_Y + 0.5, 1.8, 1.5, 1.8), 0.1, z), darkWood)
    }
    // Niyaz Window: large iron grille, marble frame (source: in front of the portico, with a 0.50 × 1.50 m inscription). No text is shown on the inscription.
    k.add(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, HALL_Y + 0.25, 2.6, 2), 12)).translate(0, 0, z - 0.3), iron)
    k.add(subtract(archFrame(0, HALL_Y + 0.25, 3.4, 2.6, 2), 0.14, z), m.marble)
    block(-0.75, 0.75, PORTICO_TOP - 0.62, PORTICO_TOP - 0.12, z, z + 0.05, columnWhite)
    for (const x of [-2.1, 2.1]) block(x - 0.22, x + 0.22, HALL_Y, HALL_Y + 3.9, z, z + 0.25, grayMolding)
    // Entrance door frame
    k.add(subtract(archFrame(4.4, HALL_Y, 2.3, 1.8, 2.15), 0.12, z), m.marble)
    // Corridor: descends from the entrance hall to the space with the sarcophagi (source: two and two steps)
    for (const x of [ENTRY_X0 - 0.15, ENTRY_X1 + 0.15]) block(x - 0.15, x + 0.15, TOMB_Y, PORTICO_TOP, x > 4 ? -16.6 : -14.2, z - 0.7, plaster)
    block(ENTRY_X0 - 0.3, ENTRY_X1 + 0.3, PORTICO_TOP - 0.6, PORTICO_TOP - 0.45, -16.6, z, plaster)
    const tread: [number, number, number][] = [[hCourt, -11.3, z], [0.72, -12.7, -11.3], [0.43, -14, -12.7], [0.14, ENTRY_Z, -14]]
    for (const [h, z0, z1] of tread) block(ENTRY_X0, ENTRY_X1, TOMB_Y - 0.1, TOMB_Y + h, z0, z1, m.marble)

    // Eave, hipped roof and wooden kiosk: the middle section rises
    block(-PORTICO_OUT_X - 0.5, PORTICO_OUT_X + 0.5, top, top + 0.3, -COURT_Z0 - 0.2, z - 0.2, darkWood)
    block(-PORTICO_OUT_X - 0.7, PORTICO_OUT_X + 0.7, top + 0.2, top + 0.3, -COURT_Z0 + 0.5, z - 0.6, darkWood)
    kRoof.add(hipRoof(-PORTICO_OUT_X - 0.8, PORTICO_OUT_X + 0.8, -13.6, -COURT_Z0 + 0.6, top + 0.3, top + 1.5, 1.2), m.lead)

    // Kiosk: "ahşap revak" (wooden portico) in the source; in the photo, a dark wooden box above the middle arch with a four-sided curved lead cover
    const kY0 = top + 0.05, kY1 = kY0 + 3.1, kx = 3, z0 = -COURT_Z0 - 3.8, z1 = -COURT_Z0 + 0.25
    block(-kx, kx, kY0, kY1, z0, z1, darkWood)
    block(-kx - 0.25, kx + 0.25, kY1, kY1 + 0.28, z0 - 0.25, z1 + 0.25, darkWood)
    block(-kx - 0.45, kx + 0.45, kY1 + 0.26, kY1 + 0.36, z0 - 0.45, z1 + 0.45, darkWood)
    for (const x of [-1.8, 1.8]) block(x - 0.08, x + 0.08, kY0, kY1, z1, z1 + 0.04, m.walnut)
    const hk = new THREE.Shape(); hk.absarc(0, kY0 + 2.15, 0.38, 0, Math.PI * 2, false)
    const hkD = new THREE.Path(); hkD.absarc(0, kY0 + 2.15, 0.28, 0, Math.PI * 2, true); hk.holes.push(hkD)
    k.add(subtract(hk, 0.06, z1), m.walnut)
    const zm = (z0 + z1) / 2
    const cover4 = rotateG([[1.02, 0], [1, 0.1], [0.82, 0.45], [0.58, 0.72], [0.28, 0.92], [0.01, 1.02]], 4, [6, 3]).rotateY(Math.PI / 4)
    cover4.scale((kx + 0.5) * Math.SQRT2, 2.35, (z1 - z0 + 1) / 2 * Math.SQRT2)
    cover4.computeVertexNormals()
    kRoof.add(place(cover4, 0, kY1 + 0.34, zm), m.lead)
    kRoof.add(place(rotateG([[0.1, 0], [0.04, 0.22], [0.14, 0.4], [0.05, 0.62], [0.11, 0.8], [0.02, 1.25], [0, 1.28]], 10), 0, kY1 + 2.6, zm), m.gold)

    // Rectangular rooms on both sides of the tomb (source), exterior mass with lead roof
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? 7.05 : -13.5, x1 = s > 0 ? 13.5 : -7.05
      block(x0, x1, COURT_Y, COURT_Y + 4.2, -24, -13.4, alternating)
      kRoof.add(hipRoof(s > 0 ? x0 : x0 - 0.5, s > 0 ? x1 + 0.5 : x1, -24.5, -13, COURT_Y + 4.2, COURT_Y + 5.5, 1.5), m.lead)
    }
  }

  /** East and west entrances of the courtyard: entrance space with two marble columns and a lead dome (source). */
  function eastWestWalls() {
    for (const s of [-1, 1]) {
      const ry = s > 0 ? Math.PI / 2 : -Math.PI / 2
      const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, s * PORTICO_OUT_X, 0, 0, ry), mat)
      // Local: +z faces outward. Wall thickness 0.4.
      const dv = rect(-COURT_Z0 - 3.5, COURT_Y, COURT_Z0 + 3.5, PORTICO_TOP)
      const window = [-4.6, 4.6]
      for (const x of window) dv.holes.push(roundArch(new THREE.Path(), x, HALL_Y + 0.6, 1.3, 1.6))
      dv.holes.push(roundArch(new THREE.Path(), 0, HALL_Y, 1.8, 2.1))
      ext(subtract(dv, 0.4, 0), alternating)
      const inner = rect(-COURT_Z0, COURT_Y, COURT_Z0, PORTICO_TOP)
      for (const x of window) inner.holes.push(roundArch(new THREE.Path(), x, HALL_Y + 0.6, 1.3, 1.6))
      inner.holes.push(roundArch(new THREE.Path(), 0, HALL_Y, 1.8, 2.1))
      ext(subtract(inner, 0.03, -0.03), plaster)
      for (const x of window) {
        ext(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), x, HALL_Y + 0.6, 1.3, 1.6), 10)).translate(0, 0, 0.2), iron)
      }
      block2(ext, -COURT_Z0, COURT_Z0, HALL_Y + 1.1, HALL_Y + 1.2, -0.05, -0.02, darkWood)
      // Entrance door: closed wooden leaves. The door cannot be exited; walking stays inside the courtyard.
      ext(boxG(1.9, 3, 0.1).translate(0, HALL_Y + 1.5, 0.22), m.wood)
      ext(boxG(0.05, 3, 0.12).translate(0, HALL_Y + 1.5, 0.21), darkWood)
      // Inscription panel: dark ground, no text.
      ext(boxG(2.4, 0.5, 0.05).translate(0, HALL_Y + 2.95, -0.05), plaque)

      // Entrance kiosk: rectangular space projecting outward, columned front, octagonal base and lead dome
      const dx = s * (PORTICO_OUT_X + 2.3)
      const head = s > 0 ? PORTICO_OUT_X + 0.3 : -PORTICO_OUT_X - 4.3
      block(head, head + 4, COURT_Y, PORTICO_TOP, -3, -2.5, alternating)
      block(head, head + 4, COURT_Y, PORTICO_TOP, 2.5, 3, alternating)
      block(head, head + 4, PORTICO_TOP, PORTICO_TOP + 0.35, -3.1, 3.1, m.stone)
      for (const z of [-1.3, 1.3]) {
        k.add(place(rotateG([[0.22, 0], [0.15, 0.25], [0.13, 3.2], [0.2, 3.5]], 12), s * (PORTICO_OUT_X + 4), COURT_Y, z), columnWhite)
      }
      block(s * (PORTICO_OUT_X + 4) - 0.25, s * (PORTICO_OUT_X + 4) + 0.25, COURT_Y + 3.5, PORTICO_TOP + 0.05, -3, 3, m.stone)
      kDrum.add(place(flatShadow(cylinderG(3.15, 3.2, 1.1, 8).rotateY(Math.PI / 8)), dx, PORTICO_TOP + 0.85, 0), m.stone)
      kDome.add(place(ribbedDome(2.95, 2.1, 20), dx, PORTICO_TOP + 1.4, 0), m.dome)
      kDome.add(place(rotateG([[0.1, 0], [0.05, 0.2], [0.12, 0.38], [0.02, 0.8], [0, 0.82]], 8), dx, PORTICO_TOP + 3.42, 0), m.gold)
    }
  }
  function block2(ext: (g: THREE.BufferGeometry, mat: Mat) => void, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat) {
    ext(boxG(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mat)
  }

  /** One mosque facade. Source: cut stone up to the top of the lower windows, above that küfeki stone and three courses of brick. */
  function mosqueBody() {
    const G_BOTTOM = 1.5, G_MID = 1.6, G_TOP = 1.25
    const bottomY0 = HALL_Y + 0.95, bottomY1 = HALL_Y + 3.25, midY0 = HALL_Y + 4.75, midD = 1.65, topY0 = HALL_Y + 9.35, topD = 1.05
    const STONE_TOP = HALL_Y + 4.25
    type Face = 'east' | 'west' | 'south' | 'north'
    const faces: { ad: Face; x: number; z: number; ry: number; alt: number[]; avg: number[]; top: number[] }[] = [
      { ad: 'east', x: MOSQUE_OUT_X, z: HALL_MID, ry: Math.PI / 2, alt: [-5.6, -2, 2, 5.6], avg: [-5.6, -2, 2, 5.6], top: [-3, 0, 3] },
      { ad: 'west', x: -MOSQUE_OUT_X, z: HALL_MID, ry: -Math.PI / 2, alt: [-5.6, -2, 2, 5.6], avg: [-5.6, -2, 2, 5.6], top: [-3, 0, 3] },
      { ad: 'south', x: 0, z: MOSQUE_Z1, ry: 0, alt: [-4.1, 4.1], avg: [-4.1, 4.1], top: [-3, 0, 3] },
      { ad: 'north', x: 0, z: MOSQUE_Z0, ry: Math.PI, alt: [-4.1, 4.1], avg: [-4.1, 4.1], top: [-3, 0, 3] },
    ]
    for (const y of faces) {
      const ext = (g: THREE.BufferGeometry, mat: Mat, kv: Bucket = k) => kv.add(place(g, y.x, 0, y.z, y.ry), mat)
      const L = MOSQUE_L / 2
      // Wall silhouette rising toward the middle arch on top
      const apex: [number, number][] = [[L, EAVE]]
      for (let i = 0; i <= 28; i++) {
        const x = 7.8 - (15.6 * i) / 28
        apex.push([x, Math.max(EAVE, 9.6 + (EAVE_MID - 9.6) * Math.sqrt(Math.max(0, 1 - (x / 7.7) ** 2)))])
      }
      apex.push([-L, EAVE])
      const silhouetteOf = () => {
        const s = new THREE.Shape()
        s.moveTo(-L, 0); s.lineTo(L, 0)
        for (const [x, yy] of apex) s.lineTo(x, yy)
        s.closePath()
        return s
      }
      const hole = (s: THREE.Shape) => {
        for (const x of y.alt) s.holes.push(rect(x - G_BOTTOM / 2, bottomY0, x + G_BOTTOM / 2, bottomY1) as unknown as THREE.Path)
        for (const x of y.avg) s.holes.push(roundArch(new THREE.Path(), x, midY0, G_MID, midD))
        for (const x of y.top) s.holes.push(roundArch(new THREE.Path(), x, topY0, G_TOP, topD))
        if (y.ad === 'north') s.holes.push(rect(-1.15, COURT_Y, 1.15, HALL_Y + 3.3) as unknown as THREE.Path)
      }
      const s = silhouetteOf(); hole(s)
      ext(subtract(s, WALL, -WALL), alternating)
      // Cut-stone lower zone and cornices (the mosque front is inside the portico)
      const alt = rect(-L - 0.05, 0, L + 0.05, STONE_TOP)
      for (const x of y.alt) alt.holes.push(rect(x - G_BOTTOM / 2 - 0.15, bottomY0 - 0.15, x + G_BOTTOM / 2 + 0.15, bottomY1 + 0.15) as unknown as THREE.Path)
      if (y.ad === 'north') alt.holes.push(rect(-1.15, COURT_Y, 1.15, HALL_Y + 3.3) as unknown as THREE.Path)
      ext(subtract(alt, 0.08, 0), m.stone)
      ext(boxG(MOSQUE_L + 0.3, 0.26, 0.3).translate(0, STONE_TOP + 0.13, 0.1), m.marble)
      ext(boxG(MOSQUE_L + 0.2, 0.3, 0.2).translate(0, 0.65, 0.1), m.stone)

      // Large middle arch and small arches on the sides (source)
      if (y.ad !== 'north') {
        const ring = (cx: number, y0: number, rx: number, ry2: number, t: number, kvm: Mat, piece: number) => {
          const outer = new THREE.Shape(), inner = new THREE.Path()
          outer.absellipse(cx, y0, rx + t, ry2 + t, 0, Math.PI, false)
          inner.absellipse(cx, y0, rx, ry2, 0, Math.PI, false)
          outer.lineTo(cx - rx - t, y0)
          outer.lineTo(cx - rx, y0)
          const pts = inner.getPoints(24).reverse()
          for (const p of pts) outer.lineTo(p.x, p.y)
          outer.closePath()
          ext(subtract(outer, 0.1, 0), kvm)
          // Sparse küfeki keystones on top of the brick arch
          for (let i = 1; i < piece; i++) {
            const a = (i / piece) * Math.PI
            const r = t / 2
            const b = boxG(0.42, t * 0.86, 0.14)
            const nx = Math.cos(a) * (rx + r), ny = Math.sin(a) * (ry2 + r)
            b.rotateZ(Math.atan2(ny / (ry2 * ry2), nx / (rx * rx)) - Math.PI / 2)
            ext(b.translate(cx + nx, y0 + ny, 0.05), m.stone)
          }
        }
        ring(0, 9.6, 6.35, 6.25, 0.62, m.brick, 11)
        for (const s2 of [-1, 1]) ring(s2 * 7.6, 9.2, 0.95, 1.05, 0.34, m.brick, 3)
      }
      // Window from outside: frame and arch lunette
      for (const x of y.alt) {
        ext(uvFit(new THREE.PlaneGeometry(G_BOTTOM, bottomY1 - bottomY0)).translate(x, (bottomY0 + bottomY1) / 2, -0.55), iron)
        ext(boxG(G_BOTTOM + 0.3, 0.1, 0.3).translate(x, bottomY0 - 0.15, 0.03), m.marble)
      }
      for (const x of [...y.avg]) {
        ext(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), x, midY0, G_MID, midD), 10)).translate(0, 0, -0.5), glassOuter)
        ext(subtract(archFrame(x, midY0 + midD, G_MID + 0.5, G_MID, 0), 0.08, 0), m.brick)
      }
      for (const x of y.top) {
        ext(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), x, topY0, G_TOP, topD), 10)).translate(0, 0, -0.5), glassOuter)
        ext(subtract(archFrame(x, topY0 + topD, G_TOP + 0.42, G_TOP, 0), 0.08, 0), m.brick)
      }
      // Curved lead eave and stone molding (goes to the roof with "Parçala")
      const c1 = new THREE.Shape()
      apex.forEach(([x, yy], i) => { if (i) c1.lineTo(x, yy + 0.28); else c1.moveTo(x, yy + 0.28) })
      for (const [x, yy] of [...apex].reverse()) c1.lineTo(x, yy - 0.02)
      c1.closePath()
      ext(subtract(c1, 1.5, -1.25), m.lead, kRoof)
      if (y.ad === 'south') {
        // Birdhouse on the outer face of the mihrab (source)
        ext(boxG(0.7, 0.55, 0.28).translate(0, 7.4, 0.12), m.marble)
        ext(flatShadow(cylinderG(0.01, 0.6, 0.4, 4).rotateY(Math.PI / 4)).scale(0.9, 1, 0.4).translate(0, 7.88, 0.14), m.lead)
        ext(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, 7.2, 0.2, 0.15), 6).translate(0, 0, 0.27), m.dark)
      }

      // Prayer hall interior: painted surface, moldings, inner faces of windows
      const innerThick = 0.03
      const innerS = rect(-HALL_HALF, COURT_Y - 0.1, HALL_HALF, VAULT_TOP)
      for (const x of y.alt) innerS.holes.push(rect(x - G_BOTTOM / 2, bottomY0, x + G_BOTTOM / 2, bottomY1) as unknown as THREE.Path)
      for (const x of y.avg) innerS.holes.push(roundArch(new THREE.Path(), x, midY0, G_MID, midD))
      for (const x of y.top) innerS.holes.push(roundArch(new THREE.Path(), x, topY0, G_TOP, topD))
      if (y.ad === 'north') innerS.holes.push(rect(-1.15, COURT_Y, 1.15, HALL_Y + 3.3) as unknown as THREE.Path)
      ext(subtract(innerS, innerThick, -WALL - innerThick), innerWall)
      // Two band belts and vertical corner pilasters
      ext(boxG(2 * HALL_HALF, 0.22, 0.07).translate(0, BAND1, -WALL - 0.04), grayBand)
      ext(boxG(2 * HALL_HALF, 0.34, 0.14).translate(0, CORNICE + 0.1, -WALL - 0.07), grayMolding)
      ext(boxG(2 * HALL_HALF, 0.1, 0.2).translate(0, CORNICE + 0.32, -WALL - 0.1), grayBand)
      ext(boxG(2 * HALL_HALF, 0.08, 0.05).translate(0, HALL_Y + 0.42, -WALL - 0.025), darkWood)
      for (const px of [-HALL_HALF + 0.55, HALL_HALF - 0.55]) {
        ext(boxG(1.1, CORNICE - HALL_Y, 0.08).translate(px, (CORNICE + HALL_Y) / 2, -WALL - 0.04), innerWall)
        for (const ds of [-0.47, 0.47]) ext(boxG(0.16, CORNICE - HALL_Y, 0.09).translate(px + ds, (CORNICE + HALL_Y) / 2, -WALL - 0.045), grayBand)
      }
      // Lower row: thick yellowish frame, wooden shutter, bright window
      for (const x of y.alt) {
        const dz = -WALL - 0.03
        ext(uvFit(new THREE.PlaneGeometry(G_BOTTOM, bottomY1 - bottomY0)).rotateY(Math.PI).translate(x, (bottomY0 + bottomY1) / 2, -1.1), camAlt)
        const f = rect(x - G_BOTTOM / 2 - 0.28, bottomY0 - 0.28, x + G_BOTTOM / 2 + 0.28, bottomY1 + 0.28)
        f.holes.push(rect(x - G_BOTTOM / 2, bottomY0, x + G_BOTTOM / 2, bottomY1) as unknown as THREE.Path)
        ext(subtract(f, 0.05, dz - 0.05), glassYellow)
        // Shutters standing open inside the wall
        for (const sd of [-1, 1]) ext(boxG(0.05, bottomY1 - bottomY0 - 0.1, 0.55).translate(x + sd * (G_BOTTOM / 2 - 0.05), (bottomY0 + bottomY1) / 2, -1.42), m.walnut)
      }
      // Middle and upper rows: revzen, painted (kalem işi) lunette
      for (const [x, y0, g, flat] of [...y.avg.map((x) => [x, midY0, G_MID, midD]), ...y.top.map((x) => [x, topY0, G_TOP, topD])]) {
        ext(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), x, y0, g, flat), 12)).translate(0, 0, -WALL + 0.25), glassTop)
        ext(subtract(archFrame(x, y0 + flat, g + 0.42, g + 0.04, 0), 0.05, -WALL - 0.06), grayMolding)
        for (const sd of [-1, 1]) ext(boxG(0.08, flat + 0.06, 0.04).translate(x + sd * (g / 2 + 0.05), y0 + flat / 2 - 0.03, -WALL - 0.05), grayMolding)
        ext(boxG(g + 0.18, 0.06, 0.04).translate(x, y0 - 0.03, -WALL - 0.05), grayMolding)
      }
    }

    // Roof: lead skirt rising to the drum
    const LOAD = EAVE - 0.15
    const skirt = flatShadow(cylinderG(8.3 * Math.SQRT2, MOSQUE_OUT_X * Math.SQRT2 + 0.6, 2.2, 4, true).rotateY(Math.PI / 4))
    kRoof.add(place(skirt, 0, LOAD + 1.1, HALL_MID), m.lead)

    // Drum: twelve windows (source), brick-stone, round
    const KY0 = LOAD + 1.35, KH = 3.15, KR = 8.25
    const kas = cylinderG(KR, KR, KH, 64, true)
    const ku = kas.attributes.uv
    for (let i = 0; i < ku.count; i++) ku.setXY(i, ku.getX(i), ku.getY(i))
    kDrum.add(place(kas, 0, KY0 + KH / 2, HALL_MID), alternating)
    kDrum.add(place(cylinderG(KR + 0.12, KR + 0.12, 0.2, 48, true), 0, KY0 + KH - 0.05, HALL_MID), m.marble)
    kDrum.add(place(cylinderG(KR + 0.1, KR + 0.1, 0.3, 48, true), 0, KY0 + 0.12, HALL_MID), m.stone)
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2 + Math.PI / 12
      const pen = (): THREE.Shape => roundArch(new THREE.Shape(), 0, KY0 + 0.65, 0.95, 0.95)
      const g = uvFit(new THREE.ShapeGeometry(pen(), 8)).translate(0, 0, KR + 0.03)
      kDrum.add(place(g, 0, 0, HALL_MID, a), glassOuter)
      kDrum.add(place(subtract(archFrame(0, KY0 + 0.65 + 0.95, 1.3, 0.95, 0), 0.06, KR), 0, 0, HALL_MID, a), m.brick)
    }
    // Outer dome
    const DKY = KY0 + KH
    kDome.add(place(ribbedDome(8.05, 6.5, 40), 0, DKY, HALL_MID), m.dome)
    kDome.add(place(rotateG([[0.28, 0], [0.12, 0.25], [0.32, 0.55], [0.1, 0.9], [0.26, 1.2], [0.03, 1.9], [0, 1.95]], 12), 0, DKY + 6.35, HALL_MID), m.gold)
  }

  function mosqueInterior() {
    const y0 = HALL_Y
    // Carpet and the raised area in front of the mihrab
    block(-HALL_HALF, HALL_HALF, COURT_Y, y0, HALL_Z0, HALL_Z1, carpet)
    block(-1.9, 1.9, y0, y0 + 0.2, HALL_Z1 - 1.25, HALL_Z1, carpet)
    // Inside the door
    block(-1.15, 1.15, COURT_Y, y0, MOSQUE_Z0, HALL_Z0, floorBrick)
    for (const s of [-1, 1]) {
      box(0.1, 3.2, 0.55, m.wood, s * 1.4, y0 + 1.6, HALL_Z0 + 0.28)
      block(s * 1.15 - 0.13, s * 1.15 + 0.13, y0, y0 + 3.4, HALL_Z0, HALL_Z0 + 0.04, grayMolding)
    }
    block(-1.3, 1.3, y0 + 3.3, y0 + 3.58, HALL_Z0, HALL_Z0 + 0.05, grayMolding)

    // Four large arch strips and pendentives
    const archStrip = (ry: number, x: number, z: number) => {
      const outer = new THREE.Shape(), inner = new THREE.Path()
      outer.absellipse(0, CORNICE + 0.35, HALL_HALF - 0.05, ARCH_RISE - 0.35 - 0.05, 0, Math.PI, false)
      outer.lineTo(-HALL_HALF + 0.55, CORNICE + 0.35)
      inner.absellipse(0, CORNICE + 0.35, HALL_HALF - 0.55, ARCH_RISE - 0.35 - 0.55, 0, Math.PI, false)
      const n = inner.getPoints(32).reverse()
      for (const p of n) outer.lineTo(p.x, p.y)
      outer.closePath()
      kRoof.add(place(subtract(outer, 0.28, -0.28), x, 0, z, ry), grayMolding)
    }
    const SY = HALL_HALF - 0.01
    archStrip(Math.PI / 2, SY, HALL_MID); archStrip(-Math.PI / 2, -SY, HALL_MID)
    archStrip(0, 0, HALL_MID + SY); archStrip(Math.PI, 0, HALL_MID - SY)
    const isOpen = (dx: number, dz: number, y: number, far: number) => {
      // If the surface near the wall falls inside an arch, it is not built so the tympanum shows.
      const dy = (y - CORNICE - 0.35) / (ARCH_RISE - 0.35 - 0.3)
      // The point is projected from the center to the wall: directions toward the corners fall outside the arch, no hole is opened.
      const side = (Math.min(Math.abs(dx), Math.abs(dz)) / Math.max(Math.abs(dx), Math.abs(dz), 0.001)) * HALL_HALF
      const arch = (HALL_HALF - 0.3) * Math.sqrt(Math.max(0, 1 - dy * dy))
      return side < arch && far > 0
    }
    kRoof.add(pendentiveG(DOME_IN_R, HALL_HALF - 0.02, CORNICE + 0.35, VAULT_TOP - 0.05, isOpen).translate(0, 0, HALL_MID), pendentive)
    // Inner drum ring and twelve windows
    const ringY = DRUM_BOTTOM
    kRoof.add(place(new THREE.TorusGeometry(DOME_IN_R + 0.02, 0.22, 8, 64).rotateX(Math.PI / 2), 0, ringY - 0.05, HALL_MID), grayMolding)
    kDrum.add(place(cylinderG(DOME_IN_R, DOME_IN_R, DRUM_H, 64, true), 0, DRUM_BOTTOM + DRUM_H / 2, HALL_MID), innerWall)
    const pk = (): THREE.Shape => roundArch(new THREE.Shape(), 0, DRUM_BOTTOM + 0.45, 1.1, 0.75)
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2 + Math.PI / 12
      kDrum.add(place(uvFit(new THREE.ShapeGeometry(pk(), 8)).rotateY(Math.PI).translate(0, 0, DOME_IN_R - 0.04), 0, 0, HALL_MID, a), glassTop)
    }
    // Painted (kalem işi) eight-segment inner dome: bird's-eye UV
    const profile: [number, number][] = []
    for (let t = 0; t <= 18; t++) {
      const a = (t / 18) * Math.PI / 2
      profile.push([Math.max(DOME_IN_R * Math.pow(Math.cos(a), 0.86), 0.001), DOME_IN_H * Math.pow(Math.sin(a), 1.06)])
    }
    const kub = rotateG(profile, 64, [1, 1])
    const kp = kub.attributes.position, kuu = kub.attributes.uv
    for (let i = 0; i < kuu.count; i++) kuu.setXY(i, kp.getX(i) / (2 * DOME_IN_R) + 0.5, kp.getZ(i) / (2 * DOME_IN_R) + 0.5)
    kDome.add(place(kub, 0, DRUM_BOTTOM + DRUM_H, HALL_MID), innerDome)

    // Corner medallions: dark ground, gold ring. Calligraphy is not imitated.
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = sx * 5.2, z = HALL_MID + sz * 5.2, y = CORNICE + 3.2
      const a = Math.atan2(-sx, -sz)
      kRoof.add(place(new THREE.CircleGeometry(0.62, 28).translate(0, y, 0.06), x, 0, z, a), medallion)
      kRoof.add(place(new THREE.TorusGeometry(0.64, 0.07, 6, 28).translate(0, y, 0.05), x, 0, z, a), m.gold)
    }
    // Blank framed panels on the walls and a historic clock, candlesticks, kürsü
    for (const s of [-1, 1]) {
      const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, s * (HALL_HALF - 0.05), 0, HALL_MID, s * -Math.PI / 2), mat)
      for (const z of [-3.8, 3.8]) {
        ext(boxG(2.1, 1.2, 0.08).translate(z, BAND1 + 0.9, 0), plaque)
        ext(boxG(2.3, 1.4, 0.05).translate(z, BAND1 + 0.9, -0.02), m.goldDark)
      }
    }
    // Candlesticks on both sides of the mihrab (source)
    for (const s of [-1, 1]) {
      const x = s * 2.65, z = HALL_Z1 - 0.65
      k.add(place(rotateG([[0.28, 0], [0.08, 0.14], [0.07, 0.5], [0.15, 0.6], [0.08, 0.72], [0.1, 1.6], [0.22, 1.7], [0.13, 1.82], [0.13, 2.75], [0.03, 2.8], [0, 2.8]], 12), x, y0, z), m.goldDark)
      k.add(place(rotateG([[0.13, 0], [0.13, 0.5], [0.04, 0.55], [0, 0.56]], 10), x, y0 + 2.75, z), m.cream)
    }
    // Clock
    box(0.55, 2.2, 0.32, m.walnut, 6.3, y0 + 1.1, HALL_Z1 - 0.2)
    k.add(place(new THREE.CircleGeometry(0.2, 18).rotateY(Math.PI).translate(0, y0 + 1.75, 0), 6.3, 0, HALL_Z1 - 0.37), m.cream)
    // Kürsü: plain wood east of the mihrab
    const krX = 5.6, krZ = HALL_Z1 - 3.6
    block(krX - 0.65, krX + 0.65, y0, y0 + 1.1, krZ - 0.65, krZ + 0.65, m.walnut)
    block(krX - 0.72, krX + 0.72, y0 + 1.1, y0 + 1.22, krZ - 0.72, krZ + 0.72, m.wood)
    block(krX - 0.65, krX + 0.65, y0 + 1.22, y0 + 1.72, krZ - 0.05, krZ + 0.65, m.walnut)

    mihrab()
    minbar()
    chandelier()
  }

  function mihrab() {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, HALL_Z1, Math.PI), mat)
    const y0 = HALL_Y, G = 5.2, TOP = y0 + 8, DER = 0.8, NG = 2.5
    const mihrabBody = pbr({ color: '#f3e4d6', roughness: 0.7, side: THREE.DoubleSide })
    const fauxMarble = pbr({ color: '#a97b52', roughness: 0.5 })
    // Local +z faces the prayer hall. Jambs, upper band and crest
    const s = rect(-G / 2, y0, G / 2, TOP)
    s.holes.push(roundArch(new THREE.Path(), 0, y0, NG, 3.5))
    ext(subtract(s, DER, 0), mihrabBody)
    // Faux-marble corner surfaces
    for (const x of [-1, 1]) {
      const side = rect(x * (NG / 2 + 0.34) - 0.28, y0 + 4.4, x * (NG / 2 + 0.34) + 0.28, y0 + 5.36)
      ext(subtract(side, 0.02, DER), fauxMarble)
    }
    // Niche: half-cylinder opening inward and half dome, fluted painted work
    const R = NG / 2
    const surface = new THREE.CylinderGeometry(R, R, 3.5, 24, 1, true, Math.PI / 2, Math.PI)
    surface.scale(1, 1, (DER - 0.02) / R)
    const uv = surface.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i))
    ext(surface.translate(0, y0 + 1.75, DER), niche)
    const kav = new THREE.SphereGeometry(R, 24, 10, Math.PI, Math.PI, 0, Math.PI / 2).scale(1, 1, (DER - 0.02) / R)
    ext(kav.translate(0, y0 + 3.5, DER), niche)
    // Colonnettes and gold Ionic capitals (source)
    for (const x of [-1, 1]) {
      ext(place(rotateG([[0.16, 0], [0.09, 0.2], [0.08, 3.1], [0.14, 3.2]], 10), x * 1.4, y0, DER + 0.09), m.inner)
      ext(place(cylinderG(0.22, 0.13, 0.26, 10), x * 1.4, y0 + 3.3, DER + 0.09), m.gold)
    }
    // Green cartouche: blank plain ground, gold frame
    ext(boxG(2.5, 0.8, 0.06).translate(0, y0 + 5.95, DER + 0.03), plaqueGreen)
    ext(boxG(2.72, 1.02, 0.04).translate(0, y0 + 5.95, DER + 0.01), m.gold)
    ext(boxG(G + 0.15, 0.1, DER + 0.12).translate(0, y0 + 5.42, DER / 2 + 0.02), m.gold)
    ext(boxG(G + 0.15, 0.1, DER + 0.12).translate(0, TOP - 0.05, DER / 2 + 0.02), m.gold)
    // Crest: gilded curved pointed pediment
    const t = new THREE.Shape()
    t.moveTo(-G / 2 - 0.1, TOP)
    t.bezierCurveTo(-1.8, TOP + 0.5, -1.3, TOP + 0.3, -1, TOP + 0.72)
    t.bezierCurveTo(-0.7, TOP + 0.98, -0.42, TOP + 0.86, 0, TOP + 1.5)
    t.bezierCurveTo(0.42, TOP + 0.86, 0.7, TOP + 0.98, 1, TOP + 0.72)
    t.bezierCurveTo(1.3, TOP + 0.3, 1.8, TOP + 0.5, G / 2 + 0.1, TOP)
    t.closePath()
    t.holes.push(ogeeArch(new THREE.Path(), -1.5, 1.5, TOP + 0.08, 0.7))
    ext(subtract(t, 0.1, DER - 0.04), m.gold)
    ext(new THREE.CircleGeometry(0.22, 16).translate(0, TOP + 0.45, DER), medallion)
    // Palmette and rose motifs
    for (const [x, y] of [[-1.85, 6.9], [1.85, 6.9], [-1.85, 5], [1.85, 5], [-1.85, 3.6], [1.85, 3.6]]) {
      ext(new THREE.TorusGeometry(0.14, 0.04, 6, 14).translate(x, y0 + y - 1, DER + 0.03), m.gold)
      ext(new THREE.SphereGeometry(0.07, 8, 6).translate(x, y0 + y - 1, DER + 0.04), m.goldDark)
    }
    // Hanging oil lamp
    ext(new THREE.CylinderGeometry(0.01, 0.01, 2.2, 4).translate(0, y0 + 3.75, 1.5), m.dark)
    ext(place(rotateG([[0.02, 0], [0.2, 0.16], [0.17, 0.3], [0.02, 0.42]], 10), 0, y0 + 2.26, 1.5), m.goldDark)
  }

  /** Minbar: plain wood, door and kiosk with cone; its stair is walkable. West of the mihrab (photo). */
  function minbar() {
    const y0 = HALL_Y, x = MINBAR_X, EN = MINBAR_W, z0 = MINBAR_Z0
    const LENGTH = HALL_Z1 - z0
    const TOP = MINBAR_RAMP.h + 0.8
    const sideS = new THREE.Shape()
    sideS.moveTo(0.7, y0); sideS.lineTo(LENGTH, y0); sideS.lineTo(LENGTH, y0 + TOP)
    sideS.lineTo(LENGTH - 2, y0 + TOP); sideS.lineTo(0.8, y0 + 1.2); sideS.lineTo(0.7, y0 + 0.9); sideS.closePath()
    const ext = (g: THREE.BufferGeometry, mat: Mat) => {
      g.rotateY(-Math.PI / 2)
      g.translate(x, 0, z0)
      k.add(g, mat)
    }
    for (const s of [-1, 1]) ext(subtract(sideS, 0.12, s * EN / 2 - 0.06), redWood)
    // Edge band
    const edge = new THREE.Shape()
    edge.moveTo(0.8, y0 + 1.2); edge.lineTo(LENGTH - 2, y0 + TOP); edge.lineTo(LENGTH - 2, y0 + TOP + 0.14); edge.lineTo(0.8, y0 + 1.36); edge.closePath()
    for (const s of [-1, 1]) ext(subtract(edge, 0.16, s * EN / 2 - 0.08), m.walnut)
    // Small arched panels in the lower band
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
      const s0 = 1.15 + i * 0.86
      ext(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), s0, y0 + 0.14, 0.56, 0.42), 6).translate(0, 0, sd * (EN / 2 + (sd > 0 ? 0.065 : 0.065))), darkWood)
    }
    // Steps: same slope as the walking ramp
    const STEP = 12
    const r = MINBAR_RAMP
    for (let i = 0; i < STEP; i++) {
      const t = (i + 1) / STEP, s0 = r.z0 - z0 + (i / STEP) * (r.z1 - r.z0), s1 = r.z0 - z0 + t * (r.z1 - r.z0)
      ext(boxG(s1 - s0, t * r.h, EN - 0.24).translate((s0 + s1) / 2, y0 + (t * r.h) / 2, 0), m.wood)
    }
    ext(boxG(LENGTH - (r.z1 - z0), r.h, EN - 0.24).translate((r.z1 - z0 + LENGTH) / 2, y0 + r.h / 2, 0), m.wood)
    // Door: open, two jambs and a crowned lintel
    for (const s of [-1, 1]) ext(boxG(0.75, 3, 0.26).translate(0.38, y0 + 1.5, s * (EN / 2 - 0.02)), redWood)
    ext(boxG(0.75, 0.55, EN + 0.26).translate(0.38, y0 + 2.75, 0), redWood)
    const crown = new THREE.Shape()
    crown.moveTo(-EN / 2 - 0.1, 0); crown.quadraticCurveTo(-0.3, 0.1, 0, 0.6); crown.quadraticCurveTo(0.3, 0.1, EN / 2 + 0.1, 0); crown.closePath()
    const crownG = subtract(crown, 0.22, -0.11); crownG.rotateY(Math.PI / 2)
    ext(crownG.translate(0.38, y0 + 3.02, 0), redWood)
    // Kiosk and cone: above the top walking level
    const kskS = LENGTH - 0.75
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ext(boxG(0.14, 2.2, 0.14).translate(kskS + a * 0.55, y0 + r.h + 1.1, b * (EN / 2 - 0.05)), redWood)
    }
    ext(boxG(1.4, 0.2, EN + 0.1).translate(kskS, y0 + r.h + 2.3, 0), redWood)
    ext(flatShadow(cylinderG(0.05, EN * 0.72, 1.7, 4).rotateY(Math.PI / 4)).translate(kskS, y0 + r.h + 3.25, 0), redWood)
    ext(new THREE.SphereGeometry(0.1, 8, 6).translate(kskS, y0 + r.h + 4.15, 0), m.gold)
  }

  /** Ring chandelier and small hanging lamps: pear-shaped glass lamps as in the photo. */
  function chandelier() {
    const cy = HALL_Y + 5.3, cz = HALL_MID
    const apex = DRUM_BOTTOM + DRUM_H + DOME_IN_H - 0.4
    const RS = [4.5, 3.3]
    RS.forEach((R, i) => {
      const y = cy + i * 0.55
      k.add(new THREE.TorusGeometry(R, 0.08, 8, 56).rotateX(Math.PI / 2).translate(0, y, cz), m.bronze)
      const n = i === 0 ? 20 : 14
      for (let a = 0; a < n; a++) {
        const t = (a / n) * Math.PI * 2, x = Math.sin(t) * R, z = cz + Math.cos(t) * R
        k.add(place(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 3), x, y - 0.14, z), m.dark)
        k.add(place(rotateG([[0.02, 0.34], [0.11, 0.24], [0.13, 0.13], [0.03, 0]], 10), x, y - 0.56, z), glassLamp)
        if (a % 3 === 0) for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) {
          k.add(new THREE.PlaneGeometry(0.55, 0.55).rotateX(rx).rotateY(ry).translate(x, y - 0.42, z), m.lampHalo)
        }
      }
    })
    for (let n = 0; n < 8; n++) {
      const t = (n / 8) * Math.PI * 2, x = Math.sin(t) * RS[0], z = cz + Math.cos(t) * RS[0]
      const len = Math.hypot(x, apex - cy, z - cz)
      const ip = new THREE.CylinderGeometry(0.012, 0.012, len, 4)
      ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-x, apex - cy, cz - z).normalize()))
      k.add(ip.translate(x / 2, (cy + apex) / 2, (z + cz) / 2), m.dark)
    }
    // Iron tie rods and small hangers between the wall arches
    for (const [ax, az, bx, bz] of [[-HALL_HALF, HALL_Z0 + 1, HALL_HALF, HALL_Z0 + 1], [-HALL_HALF, HALL_Z1 - 1, HALL_HALF, HALL_Z1 - 1], [-HALL_HALF + 1, HALL_Z0, -HALL_HALF + 1, HALL_Z1], [HALL_HALF - 1, HALL_Z0, HALL_HALF - 1, HALL_Z1]]) {
      const len = Math.hypot(bx - ax, bz - az)
      const c = new THREE.CylinderGeometry(0.035, 0.035, len, 5).rotateZ(Math.PI / 2)
      if (ax === bx) c.rotateY(Math.PI / 2)
      k.add(c.translate((ax + bx) / 2, CORNICE + 0.3, (az + bz) / 2), m.dark)
      const x = (ax + bx) / 2, z = (az + bz) / 2
      k.add(place(new THREE.CylinderGeometry(0.008, 0.008, 3.4, 3), x, CORNICE + 0.3 - 1.7, z), m.dark)
      k.add(place(rotateG([[0.03, 0], [0.22, 0.14], [0.18, 0.3], [0.03, 0.42]], 8), x, CORNICE - 3.6, z), glassLamp)
    }
  }

  function minaret(x: number, z: number) {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z), mat)
    const BASE = 3.6
    // Square cut-stone base up to the eave level (source)
    ext(boxG(BASE, EAVE + 0.4, BASE).translate(0, (EAVE + 0.4) / 2, 0), m.stone)
    for (const y of [1.5, HALL_Y + 4.3]) ext(boxG(BASE + 0.2, 0.2, BASE + 0.2).translate(0, y, 0), m.marble)
    ext(boxG(BASE + 0.25, 0.28, BASE + 0.25).translate(0, EAVE + 0.5, 0), m.marble)
    ext(flatShadow(cylinderG(1.25, BASE / 2 * Math.SQRT2, 1.8, 8).rotateY(Math.PI / 8)).translate(0, EAVE + 1.55, 0), m.stone)
    const G0 = EAVE + 2.45, G1 = 31.5
    ext(rotateG([[1.28, G0], [1.15, G1]], 28), m.stone)
    for (const y of [G0 + 0.3, 21, 26]) ext(cylinderG(1.28, 1.28, 0.2, 28).translate(0, y, 0), m.marble)
    // Under the balcony: stalactite-shaped tiers (source)
    for (let t = 0; t < 4; t++) {
      const r = 1.15 + t * 0.2, y = G1 + t * 0.42
      ext(cylinderG(r + 0.14, r, 0.42, 20).translate(0, y + 0.21, 0), m.stone)
      for (let a = 0; a < 16; a++) {
        const theta = ((a + (t % 2) * 0.5) * Math.PI * 2) / 16
        const h = new THREE.SphereGeometry(0.22, 5, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.1, 0.5)
        ext(h.translate(0, y + 0.01, r + 0.05).rotateY(theta), m.stoneDark)
      }
    }
    const SY = G1 + 1.7
    ext(cylinderG(2.05, 2.05, 0.22, 28).translate(0, SY, 0), m.marble)
    for (let a = 0; a < 20; a++) {
      const t = (a * Math.PI * 2) / 20
      ext(boxG(0.58, 0.95, 0.09).translate(0, SY + 0.57, 1.95).rotateY(t), m.stone)
    }
    ext(cylinderG(2.05, 2.05, 0.1, 28, true).translate(0, SY + 1.08, 0), m.marble)
    // Upper shaft, three stone rings, pointed cone on a hexagonal base (source)
    ext(rotateG([[1.02, SY], [0.95, SY + 5]], 22), m.stone)
    for (const y of [SY + 4.1, SY + 4.5, SY + 4.9]) ext(cylinderG(1.1, 1.1, 0.14, 22).translate(0, y, 0), m.marble)
    ext(flatShadow(cylinderG(0.06, 1.12, 4.2, 6)).translate(0, SY + 7.15, 0), m.lead)
    ext(rotateG([[0.1, 0], [0.04, 0.2], [0.12, 0.42], [0.04, 0.62], [0.09, 0.82], [0.01, 1.35], [0, 1.4]], 8).translate(0, SY + 9.2, 0), m.gold)
  }

  function tomb() {
    const cz = TOMB_Z
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, cz, a), mat)
      const entranceFace = n === 1 // Southeast face: entrance
      const southFace = n === 0 // South face: niyaz window side
      const W = TOMB_EDGE / 2 + 0.02
      const s = rect(-W, 0, W, TOMB_H)
      const pG = 2.2, pY0 = TOMB_Y + 2.1, pD = 3.05
      if (entranceFace) s.holes.push(rect(-1.25, TOMB_Y + 0.12, 1.25, TOMB_Y + 3.85) as unknown as THREE.Path)
      else if (!southFace) s.holes.push(roundArch(new THREE.Path(), 0, pY0, pG, pD))
      ext(subtract(s, TOMB_OUT - TOMB_IN, TOMB_IN), alternating)
      // Stone post at the outer corner, brick arch lunette (source), window with iron grille
      ext(boxG(0.3, TOMB_H, 0.1).translate(W - 0.1, TOMB_H / 2, TOMB_OUT + 0.03), m.stone)
      if (!entranceFace && !southFace) {
        ext(subtract(archFrame(0, pY0 + pD, pG + 0.58, pG, 0), 0.1, TOMB_OUT), m.brick)
        ext(boxG(pG + 0.5, 0.12, 0.35).translate(0, pY0 - 0.06, TOMB_OUT + 0.02), m.marble)
        const c = uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, pY0, pG, pD), 12))
        ext(c.clone().translate(0, 0, TOMB_OUT - 0.3), iron)
        ext(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, pY0, pG, pD), 12)).translate(0, 0, TOMB_IN + 0.15), ironInner)
      }
      // Inner face: light green faux marble, dark frame
      const innerS = rect(-TOMB_EDGE * (TOMB_IN / TOMB_OUT) / 2 - 0.02, TOMB_Y, TOMB_EDGE * (TOMB_IN / TOMB_OUT) / 2 + 0.02, TOMB_H)
      if (entranceFace) innerS.holes.push(rect(-1.25, TOMB_Y + 0.12, 1.25, TOMB_Y + 3.85) as unknown as THREE.Path)
      else if (!southFace) innerS.holes.push(roundArch(new THREE.Path(), 0, pY0, pG, pD))
      ext(subtract(innerS, 0.02, TOMB_IN - 0.02), tombWall)
      if (southFace) {
        // Niyaz window from inside: bright grille
        ext(uvFit(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, TOMB_Y + 2, 2.4, 2.8), 12)).translate(0, 0, TOMB_IN - 0.05), ironInner)
      }
      // Band, cornice and green panel band inside
      ext(boxG(TOMB_EDGE * (TOMB_IN / TOMB_OUT), 0.18, 0.05).translate(0, TOMB_Y + 1.35, TOMB_IN - 0.04), m.walnut)
      ext(boxG(TOMB_EDGE * (TOMB_IN / TOMB_OUT), 0.2, 0.08).translate(0, TOMB_H - 0.1, TOMB_IN - 0.05), m.goldDark)
      ext(boxG(TOMB_EDGE + 0.35, 0.35, 0.4).translate(0, TOMB_H + 0.05, TOMB_OUT), m.marble)
    }
    // Drum: cream-colored octagon, stepped molding and medallions
    const KY0 = TOMB_H + 0.2, KH = 2.6, RK = 7.5
    const ky = (g: THREE.BufferGeometry, mat: Mat) => kDrum.add(place(g, 0, 0, cz), mat)
    ky(flatShadow(cylinderG(RK, RK, KH, 8, true).rotateY(Math.PI / 8)).translate(0, KY0 + KH / 2, 0), plaster)
    ky(flatShadow(cylinderG(RK + 0.25, RK + 0.25, 0.28, 8, true).rotateY(Math.PI / 8)).translate(0, KY0 + 0.12, 0), plaster)
    ky(flatShadow(cylinderG(RK + 0.4, RK + 0.05, 0.45, 8, true).rotateY(Math.PI / 8)).translate(0, KY0 + KH + 0.05, 0), plaster)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4, face = RK * Math.cos(Math.PI / 8)
      const h = new THREE.Shape(); h.absarc(0, KY0 + KH / 2, 0.52, 0, Math.PI * 2, false)
      const hd = new THREE.Path(); hd.absarc(0, KY0 + KH / 2, 0.38, 0, Math.PI * 2, true); h.holes.push(hd)
      kDrum.add(place(subtract(h, 0.08, face), 0, 0, cz, a), m.cream)
      kDrum.add(place(boxG(0.22, KH, 0.14).translate(RK * Math.sin(Math.PI / 8), KY0 + KH / 2, face), 0, 0, cz, a), m.cream)
    }
    // Inner ceiling: octagonal vault plane and dome
    kDrum.add(place(flatShadow(cylinderG(6.2 / Math.cos(Math.PI / 8) - 0.05, 6.2 / Math.cos(Math.PI / 8) - 0.05, KH + 0.2, 8, true).rotateY(Math.PI / 8)), 0, KY0 + KH / 2 - 0.05, cz), tombWall)
    const DKY = KY0 + KH + 0.25
    const inner: [number, number][] = []
    for (let t = 0; t <= 14; t++) {
      const b = (t / 14) * Math.PI / 2
      inner.push([Math.max(6.5 * Math.pow(Math.cos(b), 0.88), 0.001), 4.4 * Math.pow(Math.sin(b), 1.05)])
    }
    const innerK = rotateG(inner, 48, [1, 1])
    const ip = innerK.attributes.position, iu = innerK.attributes.uv
    for (let i = 0; i < iu.count; i++) iu.setXY(i, ip.getX(i) / 13 + 0.5, ip.getZ(i) / 13 + 0.5)
    kDome.add(place(innerK, 0, DKY - 0.2, cz), innerDome)
    kDome.add(place(ribbedDome(7.05, 4.9, 32, 0.15), 0, DKY, cz), m.dome)
    kDome.add(place(rotateG([[0.22, 0], [0.09, 0.22], [0.24, 0.48], [0.08, 0.78], [0.19, 1], [0.03, 1.8], [0, 1.85]], 12), 0, DKY + 4.75, cz), m.gold)

    // Chandelier: large one in the center (source)
    const ay = TOMB_Y + 4.6
    k.add(new THREE.TorusGeometry(1.3, 0.05, 6, 28).rotateX(Math.PI / 2).translate(0, ay, cz), m.gold)
    k.add(new THREE.TorusGeometry(0.75, 0.04, 6, 22).rotateX(Math.PI / 2).translate(0, ay + 0.7, cz), m.gold)
    k.add(place(cylinderG(0.015, 0.015, DKY + 4 - ay, 4), 0, (ay + DKY + 4) / 2, cz), m.dark)
    for (let n = 0; n < 12; n++) {
      const t = (n / 12) * Math.PI * 2, x = Math.sin(t) * 1.3, z = cz + Math.cos(t) * 1.3
      k.add(place(new THREE.SphereGeometry(0.08, 8, 6), x, ay - 0.15, z), glassLamp)
      if (n % 2 === 0) for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) k.add(new THREE.PlaneGeometry(0.7, 0.7).rotateX(rx).rotateY(ry).translate(x, ay - 0.15, z), m.lampHalo)
    }
    // Sarcophagi: Emir Sultan's is larger (source); surrounded by a railing. Fabric pattern is representative.
    const cenotaph = (x: number, z: number, g: number, length: number, h: number) => {
      const s = new THREE.Shape()
      s.moveTo(-g / 2, 0); s.lineTo(g / 2, 0); s.lineTo(g / 2, h * 0.55); s.quadraticCurveTo(g / 2 - 0.03, h, 0, h); s.quadraticCurveTo(-g / 2 + 0.03, h, -g / 2, h * 0.55); s.closePath()
      const c = subtract(s, length, -length / 2)
      const cu = c.attributes.uv
      for (let i = 0; i < cu.count; i++) cu.setXY(i, cu.getX(i) * 0.8, cu.getY(i) * 0.8)
      k.add(place(c, x, TOMB_Y, z), cloak)
      k.add(place(new THREE.SphereGeometry(g * 0.22, 10, 8).scale(1, 0.72, 1), x, TOMB_Y + h + g * 0.1, z - length / 2 + g * 0.26), plaqueGreen)
    }
    cenotaph(0, cz + 0.3, 1.25, 3.1, 1.3)
    cenotaph(-1.55, cz + 0.2, 0.85, 2.2, 0.95)
    cenotaph(1.55, cz + 0.2, 0.85, 2.2, 0.95)
    cenotaph(-1.5, cz - 2.2, 0.7, 1.7, 0.82)
    cenotaph(1.5, cz - 2.2, 0.7, 1.7, 0.82)
    const KX = 2.7, KZ = 3.75
    for (const s of [-1, 1]) {
      const rx = boxG(0.08, 1.15, 2 * KZ); const ux = rx.attributes.uv
      for (let i = 0; i < ux.count; i++) ux.setXY(i, ux.getX(i) / 0.95, ux.getY(i) / 1.15)
      k.add(rx.translate(s * KX, TOMB_Y + 0.58, cz), railingM)
      const rz = boxG(2 * KX, 1.15, 0.08); const uvAttr = rz.attributes.uv
      for (let i = 0; i < uvAttr.count; i++) uvAttr.setXY(i, uvAttr.getX(i) / 0.95, uvAttr.getY(i) / 1.15)
      k.add(rz.translate(0, TOMB_Y + 0.58, cz + s * KZ), railingM)
      for (const t of [-1, 1]) k.add(place(rotateG([[0.11, 0], [0.05, 0.1], [0.05, 1.25], [0.12, 1.32], [0, 1.5]], 8), s * KX, TOMB_Y, cz + t * KZ), m.gold)
    }
  }

  /** Hamam, tekke, Beşir Ağa Çeşmesi and outer courtyard wall: exterior mass. */
  function outerMasses() {
    // Outer courtyard wall and fountain: on the qibla side of the mosque, at the southeast corner (source)
    const DZ = MOSQUE_Z1 + 3.2
    block(-21, 21, 0, 2.7, DZ - 0.3, DZ + 0.3, alternating)
    block(-21.2, 21.2, 2.7, 2.9, DZ - 0.4, DZ + 0.4, m.marble)
    block(-21, -20.5, 0, 2.7, -18, DZ, alternating); block(20.5, 21, 0, 2.7, -18, DZ, alternating)
    // Fountain: 1.20 × 2.80 m (source), marble face, benches on both sides
    const cx = 15.5, cz = DZ + 0.3
    block(cx - 1.4, cx + 1.4, 0, 2.6, cz, cz + 0.22, m.marble)
    block(cx - 0.5, cx + 0.5, 0.2, 1.5, cz + 0.22, cz + 0.24, columnWhite)
    k.add(place(new THREE.CircleGeometry(0.5, 16, 0, Math.PI).translate(0, 1.5, 0), cx, 0, cz + 0.24), columnBrown)
    block(cx - 0.6, cx + 0.6, 0, 0.42, cz + 0.22, cz + 0.72, m.marble)
    for (const s of [-1, 1]) block(cx + s * 1.3 - 0.35, cx + s * 1.3 + 0.35, 0, 0.45, cz + 0.22, cz + 0.72, m.marble)

    // Hamam: in the square south of the mosque (source), north-south orientation, with lead domes and lantern
    const hx = -12.5, hz0 = DZ + 5
    const base = (x0: number, x1: number, z0: number, z1: number, y: number) => {
      block(x0, x1, 0, y, z0, z1, alternating)
      block(x0 - 0.2, x1 + 0.2, y, y + 0.28, z0 - 0.2, z1 + 0.2, m.brick)
    }
    const lantern = (x: number, z: number, y: number, r: number) => {
      kRoof.add(place(flatShadow(cylinderG(0.03, r, r * 1.3, 4).rotateY(Math.PI / 4)), x, y + r * 0.65, z), m.lead)
    }
    const kub = (x: number, z: number, y: number, R: number, H: number, octagon = true) => {
      if (octagon) kDrum.add(place(flatShadow(cylinderG(R + 0.5, R + 0.75, 1.15, 8).rotateY(Math.PI / 8)), x, y + 0.57, z), alternating)
      kDome.add(place(ribbedDome(R, H, 16, 0.1), x, y + 1.15, z), m.dome)
    }
    base(hx - 6.2, hx + 6.2, hz0, hz0 + 12.6, 6.6)
    kub(hx, hz0 + 6.3, 6.7, 5.05, 3.7)
    lantern(hx, hz0 + 6.3, 11.3, 0.8)
    // Main portal: on the north facade (source), flattened arch, marble jambs, brick lunette
    block(hx - 0.85, hx + 0.85, 0, 2.5, hz0 - 0.03, hz0, m.marble)
    block(hx - 0.6, hx + 0.6, 0, 2.2, hz0 - 0.05, hz0 - 0.03, m.wood)
    k.add(place(new THREE.ShapeGeometry(roundArch(new THREE.Shape(), 0, 2.5, 1.8, 0.01), 8), hx, 0, hz0 - 0.03), m.brick)
    for (const s of [-1, 1]) {
      block(hx + s * 3.4 - 0.65, hx + s * 3.4 + 0.65, 2.5, 4.4, hz0 - 0.02, hz0, darkWood)
      block(hx + s * 3.4 - 0.75, hx + s * 3.4 + 0.75, 2.3, 2.4, hz0 - 0.2, hz0, m.marble)
    }
    // Warm and hot rooms: small domes, octagonal drum
    const hz1 = hz0 + 12.6
    base(hx - 4.3, hx + 4.3, hz1, hz1 + 9, 4.6)
    kub(hx, hz1 + 5, 4.7, 3.85, 3)
    lantern(hx, hz1 + 5, 8.5, 0.6)
    for (const [dx, dz] of [[-4.9, 4.7], [4.9, 4.7]]) {
      base(hx + dx - 1.6, hx + dx + 1.6, hz1 + dz - 1.8, hz1 + dz + 1.8, 3.8)
      kub(hx + dx, hz1 + dz, 3.9, 1.35, 1.3, false)
      lantern(hx + dx, hz1 + dz, 6.1, 0.34)
    }
    // Water tank: rectangular, vaulted (source)
    block(hx - 3.8, hx + 3.8, 0, 3.2, hz1 + 9, hz1 + 11.8, alternating)
    kRoof.add(place(new THREE.CylinderGeometry(1.4, 1.4, 7.6, 16, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2), hx, 3.2, hz1 + 10.4), m.lead)

    // Tekke: exterior mass east of the square (rebuilt in 2008-2010; position and form are representative).
    const tx = 14
    block(tx - 6, tx + 6, 0, 5.4, hz0 + 0.5, hz0 + 11, alternating)
    block(tx - 6.3, tx + 6.3, 5.4, 5.6, hz0 + 0.2, hz0 + 11.3, m.stone)
    kRoof.add(hipRoof(tx - 6.6, tx + 6.6, hz0, hz0 + 11.5, 5.6, 7.5, 3), m.lead)
    for (const x of [-3.5, 0, 3.5]) {
      block(tx + x - 0.55, tx + x + 0.55, 1.6, 3.5, hz0 + 0.48, hz0 + 0.5, darkWood)
    }
  }

  function cypress(x: number, z: number, length: number) {
    const R = 2 + length * 0.02
    const p: [number, number][] = [[0.15, 1.5], [R * 0.6, 2.1], [R * 0.9, length * 0.2], [R, length * 0.33], [R * 0.95, length * 0.47], [R * 0.8, length * 0.61], [R * 0.6, length * 0.75], [R * 0.38, length * 0.87], [R * 0.16, length * 0.96], [0, length]]
    const g = rotateG(p, 22)
    const pose = g.attributes.position, seed = x * 0.37 + z * 0.61
    for (let v = 0; v < pose.count; v++) {
      const vx = pose.getX(v), vy = pose.getY(v), vz = pose.getZ(v), a = Math.atan2(vx, vz)
      const o = 1 + 0.1 * Math.sin(a * 3 + vy * 0.9 + seed) + 0.07 * Math.sin(a * 7 - vy * 1.9 + seed * 2)
      pose.setX(v, vx * o); pose.setZ(v, vz * o)
    }
    g.computeVertexNormals()
    k.add(place(g, x, 0, z), m.cypress)
    k.add(place(cylinderG(0.2, 0.32, 2.2, 8), x, 1.1, z), m.wood)
  }

  function surroundings() {
    // Cemetery and cypresses: on the west and east sides (bird's-eye photo); positions are representative.
    const random = (t: number) => () => { t = (t * 16807) % 2147483647; return (t - 1) / 2147483646 }
    const r = random(4177)
    const areas = [[-34, -22, -30, 3], [22, 34, -30, 3], [-33, -22, 6, 30], [22, 33, 6, 30]]
    for (const [x0, x1, z0, z1] of areas) {
      block(x0, x1, 0, 0.1, z0, z1, pbr({ color: '#4d5a39', roughness: 1 }))
      for (let i = 0; i < 26; i++) {
        const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0)
        block(x - 0.05, x + 0.05, 0.1, 0.9 + r() * 0.5, z - 0.22, z + 0.22, grave)
        block(x - 0.4, x + 0.4, 0.1, 0.22, z - 0.22, z + 0.22, grave)
      }
    }
    for (const [x, z, h] of [[-22, -32, 22], [-17, -34, 25], [-36, -24, 20], [-37, 16, 21], [26, -24, 24], [30, -8, 21], [25, 8, 20], [29, 22, 24], [12, -34, 22], [33, 28, 19]]) cypress(x, z, h)
    // Plane tree: in front of the tekke; today the great tree in the square (photo). Crown made of merged spheres.
    const ax = 0, az = MOSQUE_Z1 + 11
    k.add(place(cylinderG(0.55, 0.9, 7, 10), ax, 3.5, az), m.wood)
    const c = (dx: number, y: number, dz: number, R: number) => {
      const g = new THREE.IcosahedronGeometry(R, 3)
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const o = 1 + 0.12 * Math.sin(p.getX(v) * 1.1 + p.getY(v) * 1.4 + dx) + 0.08 * Math.sin(p.getZ(v) * 2.3 + dz)
        p.setXYZ(v, p.getX(v) * o, p.getY(v) * o, p.getZ(v) * o)
      }
      // Sphere normals give a soft crown; since Icosahedron is non-indexed, computed normals came out faceted.
      const nrm = g.attributes.normal
      for (let v = 0; v < p.count; v++) { const l = Math.hypot(p.getX(v), p.getY(v), p.getZ(v)) || 1; nrm.setXYZ(v, p.getX(v) / l, p.getY(v) / l, p.getZ(v) / l) }
      k.add(place(g, ax + dx, y, az + dz), planeTree)
    }
    c(0, 11, 0, 6.2); c(-4.6, 9.5, 2, 4.4); c(4.4, 9.8, -2, 4.6); c(1, 9.2, 4.6, 4); c(-1, 13.2, -2, 4.2)
  }

  function walking(): InteriorWalk {
    const scroll = <T extends { z0: number; z1: number }>(a: T): T => ({ ...a, z0: a.z0 + OZ, z1: a.z1 + OZ })
    const boxes: Box[] = [
      // Mosque mass: side walls and north wall (door open)
      { x0: -PORTICO_OUT_X, x1: -HALL_HALF, z0: MOSQUE_Z0, z1: MOSQUE_Z1 },
      { x0: HALL_HALF, x1: PORTICO_OUT_X, z0: MOSQUE_Z0, z1: MOSQUE_Z1 },
      { x0: -HALL_HALF, x1: -1.15, z0: MOSQUE_Z0, z1: HALL_Z0 },
      { x0: 1.15, x1: HALL_HALF, z0: MOSQUE_Z0, z1: HALL_Z0 },
      // Imam and muezzin rooms in the portico, stairs
      { x0: COURT_X, x1: PORTICO_OUT_X, z0: COURT_Z0 + 0.45, z1: MOSQUE_Z0 },
      { x0: -PORTICO_OUT_X, x1: -COURT_X, z0: COURT_Z0 + 0.45, z1: MOSQUE_Z0 },
      { x0: 8.1, x1: COURT_X, z0: MOSQUE_Z0 - 3.6, z1: MOSQUE_Z0 },
      { x0: -COURT_X, x1: -8.1, z0: MOSQUE_Z0 - 3.6, z1: MOSQUE_Z0 },
      // Wall in front of the tomb and descending corridor
      { x0: -PORTICO_OUT_X, x1: ENTRY_X0, z0: -14, z1: PORTICO_K_Z },
      { x0: ENTRY_X1, x1: PORTICO_OUT_X, z0: -16.6, z1: PORTICO_K_Z },
      { x0: 6.2, x1: PORTICO_OUT_X, z0: -30, z1: -10 },
      { x0: -PORTICO_OUT_X, x1: -6.2, z0: -30, z1: -10 },
      // Sarcophagus railing
      { x0: -2.75, x1: 2.75, z0: TOMB_Z - 3.8, z1: TOMB_Z + 3.8 },
      // Mihrab and minbar
      { x0: -2.6, x1: 2.6, z0: HALL_Z1 - 0.85, z1: HALL_Z1 },
      { x0: MINBAR_X - MINBAR_W / 2 - 0.06, x1: MINBAR_X - MINBAR_W / 2 + 0.06, z0: MINBAR_Z0 + 0.7, z1: HALL_Z1 },
      { x0: MINBAR_X + MINBAR_W / 2 - 0.06, x1: MINBAR_X + MINBAR_W / 2 + 0.06, z0: MINBAR_Z0 + 0.7, z1: HALL_Z1 },
      { x0: MINBAR_X - MINBAR_W / 2 - 0.15, x1: MINBAR_X - 0.74, z0: MINBAR_Z0, z1: MINBAR_Z0 + 0.76 },
      { x0: MINBAR_X + 0.74, x1: MINBAR_X + MINBAR_W / 2 + 0.15, z0: MINBAR_Z0, z1: MINBAR_Z0 + 0.76 },
      { x0: MINBAR_X - MINBAR_W / 2, x1: MINBAR_X + MINBAR_W / 2, z0: MINBAR_RAMP.z1 + 0.8, z1: HALL_Z1 },
      // Kürsü and clock
      { x0: 4.9, x1: 6.3, z0: HALL_Z1 - 4.3, z1: HALL_Z1 - 2.9 },
      { x0: 6, x1: 6.6, z0: HALL_Z1 - 0.4, z1: HALL_Z1 },
    ]
    // Tomb corners: closes the octagon with four-step boxes. The corridor stays open on the southeast face.
    const IC = TOMB_IN, CARP = IC * Math.SQRT2 + 0.02
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      for (const x of [IC - 3.65, IC - 2.65, IC - 1.65, IC - 0.65]) {
        const z = CARP - x
        const a = Math.min(sx * x, sx * IC), b = Math.max(sx * x, sx * IC)
        let x0 = a, x1 = b
        // Leave the corridor x range empty
        if (sx > 0 && sz > 0) {
          if (x1 <= ENTRY_X1 && x0 >= ENTRY_X0) continue
          if (x0 < ENTRY_X1 && x1 > ENTRY_X1) x0 = ENTRY_X1
          if (x0 < ENTRY_X0) x1 = ENTRY_X0
        }
        const za = TOMB_Z + Math.min(sz * z, sz * IC), zb = TOMB_Z + Math.max(sz * z, sz * IC)
        boxes.push({ x0, x1, z0: za, z1: zb })
      }
    }
    const circles: { x: number; z: number; r: number }[] = [
      { x: 0, z: 0 + OZ, r: 3.3 },
      { x: 2.65, z: HALL_Z1 - 0.65 + OZ, r: 0.28 }, { x: -2.65, z: HALL_Z1 - 0.65 + OZ, r: 0.28 },
    ]
    for (const x of [-COURT_X, -6.6, -2.2, 2.2, 6.6, COURT_X]) for (const z of [-COURT_Z0, COURT_Z0]) circles.push({ x, z: z + OZ, r: 0.3 })
    for (const x of [-COURT_X, COURT_X]) for (const z of [-2.2, 2.2]) circles.push({ x, z: z + OZ, r: 0.3 })
    const floors: FloorArea[] = [
      // Courtyard, porticoes and prayer hall. The portico is 15 cm higher; the prayer hall is at the same level as the portico.
      { x0: -PORTICO_OUT_X, x1: PORTICO_OUT_X, z0: PORTICO_K_Z, z1: COURT_Z0, h0: hCourt, h1: hCourt },
      { x0: -PORTICO_OUT_X, x1: PORTICO_OUT_X, z0: COURT_Z0 - 0.35, z1: MOSQUE_Z0, h0: hHall, h1: hHall },
      { x0: -PORTICO_OUT_X, x1: PORTICO_OUT_X, z0: PORTICO_K_Z, z1: -COURT_Z0 + 0.35, h0: hHall, h1: hHall },
      { x0: -PORTICO_OUT_X, x1: -COURT_X + 0.35, z0: -COURT_Z0, z1: COURT_Z0, h0: hHall, h1: hHall },
      { x0: COURT_X - 0.35, x1: PORTICO_OUT_X, z0: -COURT_Z0, z1: COURT_Z0, h0: hHall, h1: hHall },
      { x0: -HALL_HALF, x1: HALL_HALF, z0: MOSQUE_Z0 - 0.01, z1: HALL_Z1 + 0.01, h0: hHall, h1: hHall },
      // Descent to the tomb: from portico level to the sarcophagus floor
      { x0: ENTRY_X0, x1: ENTRY_X1, z0: ENTRY_Z, z1: PORTICO_K_Z, h0: 0, h1: hHall },
      // Minbar stairs and upper landing
      { x0: MINBAR_X - MINBAR_W / 2, x1: MINBAR_X + MINBAR_W / 2, z0: MINBAR_RAMP.z0, z1: MINBAR_RAMP.z1, h0: hHall, h1: hHall + MINBAR_RAMP.h },
      { x0: MINBAR_X - MINBAR_W / 2, x1: MINBAR_X + MINBAR_W / 2, z0: MINBAR_RAMP.z1 - 0.01, z1: MINBAR_RAMP.z1 + 0.9, h0: hHall + MINBAR_RAMP.h, h1: hHall + MINBAR_RAMP.h },
    ]
    const vision: Box[] = [
      { x0: -9.3, x1: -1.15, z0: MOSQUE_Z0, z1: HALL_Z0 }, { x0: 1.15, x1: 9.3, z0: MOSQUE_Z0, z1: HALL_Z0 },
      { x0: -9.3, x1: -7.6, z0: MOSQUE_Z0, z1: MOSQUE_Z1 }, { x0: 7.6, x1: 9.3, z0: MOSQUE_Z0, z1: MOSQUE_Z1 },
      { x0: -PORTICO_OUT_X, x1: ENTRY_X0, z0: -13, z1: PORTICO_K_Z }, { x0: ENTRY_X1, x1: PORTICO_OUT_X, z0: -16, z1: PORTICO_K_Z },
    ]
    return {
      limit: { x0: -14.5, x1: 14.5, z0: TOMB_Z - TOMB_IN + OZ, z1: HALL_Z1 + OZ },
      boxes: boxes.map(scroll),
      circles,
      floors: floors.map(scroll),
      viewBlockers: vision.map(scroll),
      eyeY: BAY,
      baseY: TOMB_Y,
    }
  }

  function stops(): InteriorStop[] {
    const d = (id: string, ad: string, x: number, h: number, z: number, bx: number, by: number, bz: number): InteriorStop =>
      ({ id, ad, position: [x, BAY + h, z + OZ], look: [bx, by, bz + OZ] })
    const rp = MINBAR_RAMP
    return [
      d('courtyard', 'Avlu', -9.8, hCourt, 4.6, 1, 3.8, -8),
      d('fountain', 'Şadırvan', 7.2, hCourt, 3.6, 0, 3, -1),
      d('portico', 'Cami revakı', -4.4, hHall, 8.6, 0, 3.6, MOSQUE_Z0),
      d('hall', 'Harim', 1.6, hHall, 13.9, -0.3, 7.6, HALL_Z1),
      d('mihrab', 'Mihrap', 0, hHall, 20.6, 0, 5.4, HALL_Z1),
      d('dome', 'Kubbe', 0.2, hHall, HALL_MID + 0.6, 0, 23, HALL_MID),
      d('minbar', 'Minber', 2.2, hHall, HALL_Z1 - 9.6, MINBAR_X, 4.2, HALL_Z1 - 3.4),
      d('minbar-top', 'Minbere çık', MINBAR_X, hHall + rp.h, rp.z1 + 0.3, 2, 4, HALL_MID - 2),
      d('niyaz', 'Niyaz Penceresi', 0, hCourt, -4.1, 0, 3.7, PORTICO_K_Z),
      d('tomb', 'Türbe', 4.4, 0, -16, 0, TOMB_Y + 1.8, TOMB_Z),
      d('cenotaph', 'Sandukalar', -4.2, 0, TOMB_Z + 1.6, 0, TOMB_Y + 1.1, TOMB_Z),
    ]
  }
}
