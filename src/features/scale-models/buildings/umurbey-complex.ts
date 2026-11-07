// Representative model of the Umur Bey Complex (Bursa, Yıldırım). Units in meters. North = -z, qibla (south) = +z, east = +x.
// Sourced dimensions: two spaces 8.18 × 8.10 m and 6.34 × 6.60 m, passage between them 2.20 m (Yıldırım Municipality, inventory);
// tomb 4.60 × 4.60 m; stone endowment deed 1.35 × 2.15 m; five-bay late-comers' portico (inventory).
// Layout, heights, wall thickness, window and furniture forms are interpreted from the photos in the Drive archive.
// Calligraphy is not imitated: only the stone endowment deed and the fountain inscription are shown with real photos.
import * as THREE from 'three'
import type { Model } from '../uluMosqueModel'
import type { Box, InteriorStop, FloorArea } from '../uluMosqueInterior'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, uvFit, place } from '../uluMosquePiece'
import { random } from '../uluMosqueFloor'
import { umurbeyMaterials } from './umurbey-complex-piece/textures'

type Mat = THREE.Material

// --- Plan ---
const WALL = 1.05
/** Interior faces of the main space (8.18 × 8.10 m). */
const A = { x0: -7.785, x1: 0.395, z0: -1.9, z1: 6.2 }
/** Interior faces of the small space (6.34 × 6.60 m). North wall aligned with the main space (aerial photo). */
const B = { x0: 1.445, x1: 7.785, z0: -1.9, z1: 4.7 }
const AX = (A.x0 + A.x1) / 2, AZ = (A.z0 + A.z1) / 2
const BX = (B.x0 + B.x1) / 2, BZ = (B.z0 + B.z1) / 2
const XB = A.x0 - WALL, XD = B.x1 + WALL
const ZK = A.z0 - WALL, ZG_A = A.z1 + WALL, ZG_B = B.z1 + WALL
/** Late-comers' portico: 4.3 m deep, per the proportion in the aerial photo. */
const ZSC = ZK - 4.3
const END_WALL = 0.85
const BAY = (XD - XB - 2 * END_WALL) / 5
const BAY_CENTER = (i: number) => XB + END_WALL + BAY * (i + 0.5)
const PAVING = 0.35
const BAY_Y = 1.6
const H = 7.6, CORNICE = 7.05
const PASSAGE = { z0: BZ - 1.1, z1: BZ + 1.1 }
const MAHFIL = { z1: 0.5, y: PAVING + 3.1, stair: { x0: -1.35, x1: -0.55, z1: 4.1 } }
const MINBAR = { x: AX - 2.75, en: 1, z0: A.z1 - 3.9, rz0: A.z1 - 3.6, rz1: A.z1 - 1, apex: PAVING + 2.1 }
const TOMB = { x: AX, z: ZG_A + 2.9 + 2.3, y: 4.6 }
const MINARET = { x: XB - 1.35, z: ZK - 0.25 }
const FOUNTAIN = { x: 8, z: ZSC - 3 }

const upright = (x0: number, y0: number, x1: number, y1: number) => rect(x0, y0, x1, y1) as unknown as THREE.Path

/** Shaded geometry from a flat triangle list (UV in meters). */
function surface(triangles: { p: number[]; uv: number[] }[]) {
  const pos: number[] = [], uv: number[] = []
  triangles.forEach((u) => { pos.push(...u.p); uv.push(...u.uv) })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Roof sloping to four sides: from the lower rectangle to the upper rectangle (top may be a point). UV: u along the eave, v along the slope. */
function fourSlope(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, ix: number, iz: number) {
  const X0 = x0 + ix, X1 = x1 - ix, Z0 = z0 + iz, Z1 = z1 - iz
  const a: { p: number[]; uv: number[] }[] = []
  const trapezoid = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number) => {
    // a-b eave, c-d ridge (c above b)
    const L = Math.hypot(bx - ax, bz - az)
    const mid = (L - Math.hypot(cx - dx, cz - dz)) / 2
    const slope = Math.hypot(Math.hypot((ax + bx) / 2 - (cx + dx) / 2, (az + bz) / 2 - (cz + dz) / 2), y1 - y0)
    a.push({ p: [ax, y0, az, bx, y0, bz, cx, y1, cz], uv: [0, 0, L, 0, L - mid, slope] })
    a.push({ p: [ax, y0, az, cx, y1, cz, dx, y1, dz], uv: [0, 0, L - mid, slope, mid, slope] })
  }
  trapezoid(x0, z1, x1, z1, X1, Z1, X0, Z1)
  trapezoid(x1, z1, x1, z0, X1, Z0, X1, Z1)
  trapezoid(x1, z0, x0, z0, X0, Z0, X1, Z0)
  trapezoid(x0, z0, x0, z1, X0, Z1, X0, Z0)
  return surface(a)
}

/** Tile dome in overlapping rows; the profile is stepped, UV v fits the rows. */
function roofTileDome(r: number, h: number, row: number, piece: number) {
  const points: [number, number][] = []
  const v: number[] = []
  for (let i = 0; i < row; i++) {
    const a0 = (i / row) * Math.PI / 2, a1 = ((i + 1) / row) * Math.PI / 2
    points.push([r * Math.cos(a0) + 0.05, h * Math.sin(a0) - 0.03], [r * Math.cos(a1), h * Math.sin(a1)])
    v.push(i * 0.33 + 0.01, (i + 1) * 0.33)
  }
  points[points.length - 1][0] = 0.001
  const g = rotateG(points, piece, [2 * Math.PI * r, 1])
  const uv = g.attributes.uv
  for (let s = 0; s <= piece; s++) for (let j = 0; j < points.length; j++) uv.setY(s * points.length + j, v[j])
  return g
}

/** Belt of "Turkish triangles" from a square mouth to a sixteen-sided mouth (the faceted faces in the interior photo). */
function triangleBeltOf(cx: number, cz: number, ax: number, az: number, y0: number, y1: number, R: number) {
  const N = 16, alt: [number, number][] = []
  for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) {
    const t = i / 4
    if (k === 0) alt.push([cx - ax + 2 * ax * t, cz + az])
    if (k === 1) alt.push([cx + ax, cz + az - 2 * az * t])
    if (k === 2) alt.push([cx + ax - 2 * ax * t, cz - az])
    if (k === 3) alt.push([cx - ax, cz - az + 2 * az * t])
  }
  const a0 = Math.atan2(-ax, az)
  const top = (i: number): [number, number] => {
    const a = a0 + ((i + 0.5) / N) * Math.PI * 2
    return [cx + Math.sin(a) * R, cz + Math.cos(a) * R]
  }
  const a: { p: number[]; uv: number[] }[] = []
  for (let i = 0; i < N; i++) {
    const b0 = alt[i], b1 = alt[(i + 1) % N], t0 = top(i), t1 = top((i + 1) % N)
    a.push({ p: [b0[0], y0, b0[1], b1[0], y0, b1[1], t0[0], y1, t0[1]], uv: [0, 0, 1, 0, 0.5, 1] })
    a.push({ p: [t0[0], y1, t0[1], b1[0], y0, b1[1], t1[0], y1, t1[1]], uv: [0, 1, 1, 0, 1, 1] })
  }
  return surface(a)
}

export const building = (): Model => {
  const m = umurbeyMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()
  const box = (g: number, h: number, d: number, mat: Mat, x: number, y: number, z: number, kv = k) =>
    kv.add(place(boxG(g, h, d), x, y, z), mat)
  const r = random(865)

  // --- Collision lists ---
  const obstacles: Box[] = []
  const walls: Box[] = []
  const circles: { x: number; z: number; r: number; top?: number }[] = []
  const floors: FloorArea[] = []
  const obstacle = (x0: number, x1: number, z0: number, z1: number, wall = false, top?: number) => {
    const b: Box = { x0, x1, z0, z1, ...(top === undefined ? {} : { top }) }
    obstacles.push(b)
    if (wall) walls.push(b)
  }

  // --- Ground: grass, courtyard stone, benches ---
  const floorCircle = new THREE.CircleGeometry(23.8, 64).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const zp = floorCircle.attributes.position, zuv = floorCircle.attributes.uv
  for (let i = 0; i < zuv.count; i++) zuv.setXY(i, zp.getX(i), zp.getZ(i))
  k.add(floorCircle, m.grass)
  // North courtyard and the road to the east (aerial and northeast photos)
  box(XD - XB + 1, 0.04, 8.2, m.stonePaving, 0, 0.02, ZSC - 4.1)
  box(1.5, 0.04, ZG_B - ZSC + 1, m.stonePaving, XD + 0.75, 0.02, (ZG_B + ZSC) / 2)
  // Building platform
  box(XD - XB, PAVING, ZK - ZSC + 0.25, m.stonePaving, 0, PAVING / 2, (ZK + ZSC) / 2)
  box(A.x1 - XB + 0.5, PAVING, ZG_A - ZK, m.cream, (XB + A.x1 + 0.5) / 2, PAVING / 2, (ZK + ZG_A) / 2)
  box(XD - A.x1 - 0.5, PAVING, ZG_B - ZK, m.cream, (XD + A.x1 + 0.5) / 2, PAVING / 2, (ZK + ZG_B) / 2)
  floors.push(
    { x0: XB, x1: XD, z0: ZSC, z1: A.z0, h0: PAVING, h1: PAVING },
    { x0: A.x0, x1: A.x1 + 0.5, z0: A.z0, z1: A.z1, h0: PAVING, h1: PAVING },
    { x0: A.x1, x1: B.x1, z0: B.z0, z1: B.z1, h0: PAVING, h1: PAVING },
  )
  // Carpet: red prayer-row lines parallel to the qibla
  box(A.x1 - A.x0, 0.02, A.z1 - A.z0, m.carpet, AX, PAVING + 0.01, AZ)
  box(B.x1 - B.x0, 0.02, B.z1 - B.z0, m.carpet, BX, PAVING + 0.01, BZ)
  box(WALL, 0.02, PASSAGE.z1 - PASSAGE.z0, m.stonePaving, (A.x1 + B.x0) / 2, PAVING + 0.01, BZ)
  // Baseboard (wood)
  for (const [g, x, z] of [[A.x1 - A.x0, AX, A.z0 + 0.02], [A.x1 - A.x0, AX, A.z1 - 0.02], [B.x1 - B.x0, BX, B.z0 + 0.02], [B.x1 - B.x0, BX, B.z1 - 0.02]] as const)
    box(g, 0.16, 0.04, m.wood, x, PAVING + 0.08, z)

  // --- Walls: outer masonry + inner plaster; openings really pass through the wall ---
  type Opening = { tip: 'top' | 'alt' | 'door' | 'passage' | 'smallDoor'; u: number }
  const TOPY = { y0: 3.75, g: 0.82, d: 0.95, k: 0.62 }, BOTTOMY = { y0: 0.95, g: 1.05, h: 1.45 }
  const DOOR = { g: 1.5, h: 2.5, k: 0.42 }, KDOOR = { g: 1.15, h: 2.25, k: 0.38 }

  const facade = (L: number, x: number, z: number, ry: number, t: number, open: Opening[], outerMat: Mat, innerMat: Mat, outerRing = true) => {
    const local = (g: THREE.BufferGeometry, mat: Mat, kv = k) => kv.add(place(g, x, 0, z, ry), mat)
    const holes = (s: THREE.Shape) => {
      for (const a of open) {
        if (a.tip === 'top') s.holes.push(arch(new THREE.Path(), a.u, TOPY.y0, TOPY.g, TOPY.d, TOPY.k))
        if (a.tip === 'alt') s.holes.push(upright(a.u - BOTTOMY.g / 2, BOTTOMY.y0, a.u + BOTTOMY.g / 2, BOTTOMY.y0 + BOTTOMY.h))
        if (a.tip === 'door') s.holes.push(arch(new THREE.Path(), a.u, 0.02, DOOR.g, DOOR.h, DOOR.k))
        if (a.tip === 'smallDoor') s.holes.push(arch(new THREE.Path(), a.u, 0.02, KDOOR.g, KDOOR.h, KDOOR.k))
        if (a.tip === 'passage') s.holes.push(arch(new THREE.Path(), a.u, 0.02, PASSAGE.z1 - PASSAGE.z0, 2.6, 0.9))
      }
      return s
    }
    local(subtract(holes(rect(-L / 2, 0, L / 2, H)), t - 0.04, -t + 0.04), outerMat)
    local(subtract(holes(rect(-L / 2, 0, L / 2, CORNICE + 0.02)), 0.04, -t), innerMat)
    for (const a of open) {
      if (a.tip === 'top') {
        // Plastered window opening inside, plaster revzen in the middle, stained glass inside
        const ring = arch(new THREE.Shape(), a.u, TOPY.y0 - 0.04, TOPY.g + 0.08, TOPY.d, TOPY.k + 0.06)
        ring.holes.push(arch(new THREE.Path(), a.u, TOPY.y0, TOPY.g - 0.06, TOPY.d, TOPY.k))
        local(subtract(ring, 0.14, -t - 0.01), innerMat)
        const cam = () => uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), a.u, TOPY.y0, TOPY.g, TOPY.d, TOPY.k), 8))
        local(cam().translate(0, 0, -0.14), m.transom)
        local(cam().rotateY(Math.PI).translate(2 * a.u, 0, -t + 0.12), m.stainedGlass)
        if (outerRing) {
          const dh = arch(new THREE.Shape(), a.u, TOPY.y0 - 0.1, TOPY.g + 0.34, TOPY.d + 0.1, TOPY.k + 0.2)
          dh.holes.push(arch(new THREE.Path(), a.u, TOPY.y0 - 0.1, TOPY.g, TOPY.d + 0.1, TOPY.k))
          local(subtract(dh, 0.05, 0), m.brick)
          local(boxG(TOPY.g + 0.3, 0.08, 0.1).translate(a.u, TOPY.y0 - 0.06, -0.03), m.marble)
        }
      }
      if (a.tip === 'alt') {
        const { g, h, y0 } = BOTTOMY
        // Wooden frame, inner light, outer grille
        for (const s of [-1, 1]) local(boxG(0.09, h, t - 0.12).translate(a.u + s * (g / 2 - 0.045), y0 + h / 2, -t / 2 - 0.08), m.wood)
        for (const yy of [y0 + 0.045, y0 + h - 0.045]) local(boxG(g, 0.09, t - 0.12).translate(a.u, yy, -t / 2 - 0.08), m.wood)
        local(new THREE.PlaneGeometry(g, h).translate(a.u, y0 + h / 2, -0.08), m.balustrade)
        local(new THREE.PlaneGeometry(g, h).rotateY(Math.PI).translate(a.u, y0 + h / 2, -t + 0.2), m.daylight)
        // Window leaves from inside
        for (const s of [-1, 1]) local(boxG(0.05, h - 0.12, g * 0.42).rotateY(0).translate(a.u + s * (g / 2 + 0.02), y0 + h / 2, -t - 0.2), m.wood)
        if (outerRing) {
          // Cream lintel outside with a brick relieving arch above it (based on the photo)
          local(boxG(g + 0.26, 0.2, 0.08).translate(a.u, y0 + h + 0.1, -0.02), m.cream)
          for (const s of [-1, 1]) local(boxG(0.13, h, 0.08).translate(a.u + s * (g / 2 + 0.065), y0 + h / 2, -0.02), m.cream)
          local(boxG(g + 0.26, 0.1, 0.1).translate(a.u, y0 - 0.05, -0.01), m.cream)
          const b = arch(new THREE.Shape(), a.u, y0 + h + 0.2, g + 0.6, 0.02, 0.62)
          b.holes.push(arch(new THREE.Path(), a.u, y0 + h + 0.2, g + 0.24, 0.02, 0.44))
          local(subtract(b, 0.05, 0), m.brick)
          const infill = new THREE.ShapeGeometry(arch(new THREE.Shape(), a.u, y0 + h + 0.2, g + 0.24, 0.02, 0.44), 8)
          local(infill.translate(0, 0, 0.02), m.cream)
        }
      }
    }
  }

  // North wall: faces the late-comers' portico, both faces plastered (photo). Since ry=π, u = -x.
  facade(XD - XB - 0.1, 0, ZK, Math.PI, WALL, [
    { tip: 'door', u: -AX },
    { tip: 'alt', u: -(AX - 2.6) }, { tip: 'alt', u: -(AX + 2.6) },
    { tip: 'top', u: -(AX - 2.6) }, { tip: 'top', u: -(AX + 2.6) },
    { tip: 'smallDoor', u: -BX },
    { tip: 'alt', u: -(BX + 2) }, { tip: 'alt', u: -(BX - 2) },
  ], m.plasterOuter, m.plaster, false)
  // West wall: two upper, two lower windows (interior photo). For ry=-π/2, u = z - center.
  const ZO_A = (ZK + ZG_A) / 2
  facade(ZG_A - ZK, XB, ZO_A, -Math.PI / 2, WALL, [
    { tip: 'top', u: AZ - 2.05 - ZO_A }, { tip: 'top', u: AZ + 2.05 - ZO_A },
    { tip: 'alt', u: AZ - 2.05 - ZO_A }, { tip: 'alt', u: AZ + 2.05 - ZO_A },
  ], m.alternating, m.plaster)
  // Main space south wall: lower and upper windows on both sides of the mihrab
  const XO_A = (XB + B.x0) / 2
  facade(B.x0 - XB, XO_A, ZG_A, 0, WALL, [
    { tip: 'top', u: AX - XO_A - 2.45 }, { tip: 'top', u: AX - XO_A + 2.45 }, { tip: 'alt', u: AX - XO_A - 2.45 }, { tip: 'alt', u: AX - XO_A + 2.45 },
  ], m.alternating, m.plaster)
  // South and east walls of the small space
  const XO_B = (XD + B.x0) / 2
  facade(XD - B.x0, XO_B, ZG_B, 0, WALL, [
    { tip: 'top', u: BX - XO_B - 1.6 }, { tip: 'top', u: BX - XO_B + 1.6 }, { tip: 'alt', u: BX - XO_B + 1.6 },
  ], m.alternating, m.plaster)
  const ZO_B = (ZK + ZG_B) / 2
  facade(ZG_B - ZK, XD, ZO_B, Math.PI / 2, WALL, [
    { tip: 'top', u: -(BZ - 1.6 - ZO_B) }, { tip: 'top', u: -(BZ + 1.6 - ZO_B) }, { tip: 'alt', u: -(BZ - 1.6 - ZO_B) },
  ], m.alternating, m.plaster)
  // Wall between the two spaces and the 2.20 m passage. Outer face at x = B.x0.
  const ZO_MID = (ZK + ZG_B) / 2
  facade(ZG_B - ZK, B.x0, ZO_MID, Math.PI / 2, WALL, [{ tip: 'passage', u: -(BZ - ZO_MID) }], m.plaster, m.plaster, false)
  // Upper windows should be on this wall too: not visible in the photo, left empty.
  // Part of the shared wall extending south: stays outside, behind the small space
  const overhang = rect(-(ZG_A - ZG_B) / 2, 0, (ZG_A - ZG_B) / 2, H)
  k.add(place(subtract(overhang, WALL - 0.04, -WALL + 0.04), B.x0, 0, (ZG_A + ZG_B) / 2, Math.PI / 2), m.alternating)
  box(0.04, CORNICE, ZG_A - ZG_B, m.plaster, A.x1 + 0.02, CORNICE / 2, (ZG_A + ZG_B) / 2)

  // Collision: exterior walls
  obstacle(XB, A.x0, ZK, ZG_A, true)
  obstacle(A.x0, A.x1 + WALL, A.z1, ZG_A, true)
  obstacle(B.x0, XD, B.z1, ZG_B, true)
  obstacle(B.x1, XD, ZK, ZG_B, true)
  obstacle(XB, AX - DOOR.g / 2, ZK, A.z0, true)
  obstacle(AX + DOOR.g / 2, BX - KDOOR.g / 2, ZK, A.z0, true)
  obstacle(BX + KDOOR.g / 2, XD, ZK, A.z0, true)
  obstacle(A.x1, B.x0, A.z0, PASSAGE.z0, true)
  obstacle(A.x1, B.x0, PASSAGE.z1, A.z1 + WALL, true)

  // Doors: red-brown leaf open, a small domelet on top (Yıldırım Municipality text) and a plain hood instead of the leaf ornament
  const doorLeaf = (cx: number, g: number, h: number) => {
    for (const s of [-1, 1]) {
      box(0.07, h, g / 2, m.woodDark, cx + s * (g / 2 + 0.04), PAVING + h / 2 - 0.2, A.z0 + g / 4)
    }
  }
  doorLeaf(AX, DOOR.g, DOOR.h)
  doorLeaf(BX, KDOOR.g, KDOOR.h)
  const hood = rotateG([[0.5, 0], [0.46, 0.08], [0.28, 0.26], [0.001, 0.36]], 14, [2, 1])
  k.add(place(hood.scale(1, 1, 0.35), AX, DOOR.h + DOOR.k + 0.34, ZK - 0.02), m.muqarnas)
  // Marble frame around the door (from the late-comers' portico)
  for (const [cx, g, hh, kk] of [[AX, DOOR.g, DOOR.h, DOOR.k], [BX, KDOOR.g, KDOOR.h, KDOOR.k]] as const) {
    const s = arch(new THREE.Shape(), -cx, 0.02, g + 0.36, hh + 0.05, kk + 0.1)
    s.holes.push(arch(new THREE.Path(), -cx, 0.02, g, hh, kk))
    k.add(place(subtract(s, 0.08, -0.02), 0, 0, ZK, Math.PI), m.marble)
  }

  // --- Stone endowment deeds: on both side walls of the late-comers' portico, high above the floor with plastered surrounds (inventory). 2.15 × 1.35 m ---
  const plaque = (x: number, ry: number, mat: Mat) => {
    const G = 2.15, Y = 1.35, cy = 4.55, zc = (ZSC + ZK) / 2
    const g = new THREE.PlaneGeometry(G, Y)
    k.add(place(g.translate(0, cy, 0.04), x, 0, zc, ry), mat)
    k.add(place(boxG(G + 0.3, Y + 0.3, 0.05).translate(0, cy, 0), x, 0, zc, ry), m.muqarnas)
  }

  // --- Late-comers' portico ---
  const ZSC_I = ZSC + 0.55
  const BOW = 3.72, TOP = 5.72
  // Side walls
  facade(ZK - ZSC, XD - 0.0, (ZSC + ZK) / 2, Math.PI / 2, END_WALL, [], m.alternating, m.plasterOuter)
  facade(ZK - ZSC, XB + 0.0, (ZSC + ZK) / 2, -Math.PI / 2, END_WALL, [], m.alternating, m.plasterOuter)
  plaque(XD - END_WALL - 0.01, -Math.PI / 2, m.deed1)
  plaque(XB + END_WALL + 0.01, Math.PI / 2, m.deed2)
  obstacle(XB, XB + END_WALL, ZSC, ZK, true)
  obstacle(XD - END_WALL, XD, ZSC, ZK, true)
  // Door to the minaret (on the west wall of the late-comers' portico)
  box(0.06, 2.2, 0.95, m.woodDark, XB + END_WALL + 0.03, PAVING + 1.1, ZK - 1.2)

  // Front wall: five arches. u = -x. Open below, resting on columns.
  const FRONT_L = XD - XB
  const on = new THREE.Shape()
  on.moveTo(-FRONT_L / 2, 0); on.lineTo(-FRONT_L / 2 + END_WALL, 0); on.lineTo(-FRONT_L / 2 + END_WALL, BOW)
  for (let i = 0; i < 5; i++) {
    const a = -FRONT_L / 2 + END_WALL + BAY * i, b = a + BAY, o = (a + b) / 2
    on.quadraticCurveTo(a + 0.02, BOW + (TOP - BOW) * 0.72, o, TOP)
    on.quadraticCurveTo(b - 0.02, BOW + (TOP - BOW) * 0.72, b, BOW)
  }
  on.lineTo(FRONT_L / 2 - END_WALL, 0); on.lineTo(FRONT_L / 2, 0); on.lineTo(FRONT_L / 2, H); on.lineTo(-FRONT_L / 2, H); on.closePath()
  k.add(place(subtract(on, 0.55, -0.55), 0, 0, ZSC, Math.PI), m.alternatingLight)
  // Arch ring: cream stone and brick
  for (let i = 0; i < 5; i++) {
    const a = -FRONT_L / 2 + END_WALL + BAY * i, b = a + BAY, o = (a + b) / 2
    const ring = new THREE.Shape()
    ring.moveTo(a, BOW)
    ring.quadraticCurveTo(a + 0.02, BOW + (TOP - BOW) * 0.72, o, TOP)
    ring.quadraticCurveTo(b - 0.02, BOW + (TOP - BOW) * 0.72, b, BOW)
    ring.lineTo(b + 0.14, BOW)
    ring.quadraticCurveTo(b + 0.1, BOW + (TOP + 0.5 - BOW) * 0.78, o, TOP + 0.5)
    ring.quadraticCurveTo(a - 0.1, BOW + (TOP + 0.5 - BOW) * 0.78, a - 0.14, BOW)
    ring.closePath()
    k.add(place(subtract(ring, 0.05, 0), 0, 0, ZSC, Math.PI), i % 2 ? m.cream : m.cream)
    const inner = new THREE.Shape()
    inner.moveTo(a + 0.02, BOW)
    inner.quadraticCurveTo(a + 0.04, BOW + (TOP - BOW) * 0.72, o, TOP - 0.02)
    inner.quadraticCurveTo(b - 0.04, BOW + (TOP - BOW) * 0.72, b - 0.02, BOW)
    inner.lineTo(a + 0.02, BOW); inner.closePath()
    // Arch soffit: the inner face of the outer masonry is visible; thin wooden tie rod as in the photo
    box(BAY - 0.1, 0.14, 0.14, m.woodDark, (b + a) / -2, BOW + 0.02, ZSC + 0.27)
  }
  // Ceiling and inner dividing arches
  k.add(new THREE.PlaneGeometry(FRONT_L - 2 * END_WALL, ZK - ZSC_I).rotateX(Math.PI / 2).translate(0, 6.9, (ZK + ZSC_I) / 2), m.plaster)
  for (let i = 1; i < 5; i++) {
    const x = XB + END_WALL + BAY * i
    const s = rect(-(ZK - ZSC_I) / 2, BOW, (ZK - ZSC_I) / 2, 6.9)
    const ac = (ZK - ZSC_I) / 2
    s.holes.push(arch(new THREE.Path(), 0, BOW, ac * 2 - 0.5, 0.05, 2.5))
    k.add(place(subtract(s, 0.3, -0.15), x, 0, (ZK + ZSC_I) / 2, Math.PI / 2), m.plaster)
    box(0.12, 0.14, ZK - ZSC_I, m.woodDark, x, BOW + 0.02, (ZK + ZSC_I) / 2)
  }
  // Supports: per the photo, from east to west: column, masonry pier, column, column. Marble with Corinthian capitals.
  const COLUMN_Z = ZSC + 0.27
  const column = (x: number) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, COLUMN_Z), mat)
    ext(boxG(0.56, 0.22, 0.56).translate(0, PAVING + 0.11, 0), m.marble)
    ext(rotateG([[0.27, PAVING + 0.22], [0.2, PAVING + 0.34], [0.18, 3.0], [0.21, 3.06]], 16), m.marble)
    // Corinthian capital: bell tapering downward, two rows of leaves, square abacus on top
    ext(rotateG([[0.2, 3.06], [0.26, 3.3], [0.36, 3.56]], 16), m.marble)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      for (const [ry, y, rr] of [[0.21, 3.2, 0], [0.28, 3.42, 0.39]] as const) {
        const leaf = new THREE.SphereGeometry(0.09, 5, 4).scale(0.9, 1.3, 0.45).translate(0, y, ry + 0.05)
        ext(leaf.rotateY(a + rr), m.marble)
      }
    }
    ext(boxG(0.78, 0.15, 0.78).translate(0, BOW - 0.09, 0), m.marble)
    circles.push({ x, z: COLUMN_Z, r: 0.26 })
  }
  const support = (i: number) => XB + END_WALL + BAY * i
  column(support(1)); column(support(2)); column(support(4))
  box(0.8, BOW - PAVING, 0.72, m.alternatingLight, support(3), (BOW + PAVING) / 2, COLUMN_Z)
  box(0.9, 0.14, 0.84, m.marble, support(3), BOW - 0.04, COLUMN_Z)
  obstacle(support(3) - 0.4, support(3) + 0.4, COLUMN_Z - 0.36, COLUMN_Z + 0.36)
  obstacle(XB, XB + END_WALL, ZSC, ZSC + 0.55)

  // --- Eave molding: saw-tooth brick ---
  const dentil = (x0: number, z0: number, x1: number, z1: number, y: number, kv: { add(g: THREE.BufferGeometry, mat: Mat): void }, outerX: number, outerZ: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.floor(L / 0.24))
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const d = new THREE.BoxGeometry(0.14, 0.09, 0.14).rotateY(Math.PI / 4)
      kv.add(d.translate(x0 + (x1 - x0) * t + outerX, y, z0 + (z1 - z0) * t + outerZ), m.brick)
    }
  }
  const eaveB = (x0: number, x1: number, z0: number, z1: number, y: number, kv: Bucket) => {
    const b = 0.05
    const ring = (ext: number, yy: number, inner = 0.5) => {
      const g = x1 - x0 + ext, dd = z1 - z0 + ext, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
      kv.add(place(boxG(g, 0.09, inner), cx, yy, z0 - ext / 2 + inner / 2), m.brick)
      kv.add(place(boxG(g, 0.09, inner), cx, yy, z1 + ext / 2 - inner / 2), m.brick)
      kv.add(place(boxG(inner, 0.09, dd), x0 - ext / 2 + inner / 2, yy, cz), m.brick)
      kv.add(place(boxG(inner, 0.09, dd), x1 + ext / 2 - inner / 2, yy, cz), m.brick)
    }
    ring(0.1, y)
    dentil(x0, z0 - b, x1, z0 - b, y + 0.1, kv, 0, 0); dentil(x0, z1 + b, x1, z1 + b, y + 0.1, kv, 0, 0)
    dentil(x0 - b, z0, x0 - b, z1, y + 0.1, kv, 0, 0); dentil(x1 + b, z0, x1 + b, z1, y + 0.1, kv, 0, 0)
    ring(0.34, y + 0.2)
  }

  // --- Roof: tiled late-comers' portico and square shoulders of the spaces ---
  eaveB(XB, XD, ZSC, ZK, H + 0.04, kRoof)
  eaveB(XB, A.x1 + WALL, ZK, ZG_A, H + 0.04, kRoof)
  eaveB(A.x1 + 0.1, XD, ZK, ZG_B, H + 0.04, kRoof)
  const ROOF_Y = H + 0.3
  // Late-comers' portico: base slope, a pyramid above each bay; the bay opposite the door has a small dome
  kRoof.add(fourSlope(XB - 0.35, XD + 0.35, ZSC - 0.35, ZK + 0.4, ROOF_Y, ROOF_Y + 0.55, 0.9, 0.9), m.roofTile)
  kRoof.add(new THREE.PlaneGeometry(XD - XB - 1, ZK - ZSC - 1).rotateX(-Math.PI / 2).translate(0, ROOF_Y + 0.55, (ZSC + ZK) / 2), m.roofTile)
  const SC_MID = (ZSC + ZK) / 2
  for (let i = 0; i < 5; i++) {
    const cx = BAY_CENTER(i)
    if (i === 1) {
      kRoof.add(place(flatShadow(cylinderG(1.45, 1.5, 0.55, 8, true).rotateY(Math.PI / 8)), cx, ROOF_Y + 0.8, SC_MID), m.alternatingLight)
      kRoof.add(place(flatShadow(cylinderG(1.25, 1.7, 0.16, 8, true).rotateY(Math.PI / 8)), cx, ROOF_Y + 1.12, SC_MID), m.roofTile)
      kDome.add(place(roofTileDome(1.28, 0.95, 5, 24), cx, ROOF_Y + 1.2, SC_MID), m.roofTile)
    } else {
      const g = BAY / 2 - 0.12, d = (ZK - ZSC) / 2 - 0.42
      kRoof.add(fourSlope(cx - g, cx + g, SC_MID - d, SC_MID + d, ROOF_Y + 0.5, ROOF_Y + 1.55, g, d), m.roofTile)
    }
  }

  // --- Space cover: square shoulder → octagonal drum → eave → tile dome; inside triangle belt, sixteen-sided drum, dome ---
  const OCT = Math.cos(Math.PI / 8)
  const cloak = (o: {
    cx: number; cz: number; xa: number; za: number; innerX: number; innerZ: number
    drum: number; drumTop: number; eaveBR: number; domeR: number; domeH: number; innerR: number; innerBelt: number; innerDrum: number; innerDomeH: number
  }) => {
    // Square shoulder: sloping to four sides, empty in the middle for the drum
    kRoof.add(fourSlope(o.cx - o.xa - 0.3, o.cx + o.xa + 0.3, o.cz - o.za - 0.3, o.cz + o.za + 0.3, ROOF_Y, ROOF_Y + 0.9, 0.5, 0.5), m.roofTile)
    const cover = rect(o.cx - o.xa + 0.2, -o.cz - o.za + 0.2, o.cx + o.xa - 0.2, -o.cz + o.za - 0.2)
    cover.holes.push(new THREE.Path().absarc(o.cx, -o.cz, o.innerR + 0.55, 0, Math.PI * 2, true))
    kRoof.add(new THREE.ShapeGeometry(cover, 20).rotateX(-Math.PI / 2).translate(0, ROOF_Y + 0.9, 0), m.roofTile)

    // Outer drum: octagonal, alternating masonry with light stones, brick molding, small windows in four directions
    const H0 = o.drum, H1 = o.drumTop, RK = o.eaveBR - 0.42
    const dk = flatShadow(cylinderG(RK / OCT, RK / OCT, H1 - H0, 8, true).rotateY(Math.PI / 8))
    kDrum.add(place(dk, o.cx, (H0 + H1) / 2, o.cz), m.alternatingLight)
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4, gen = 2 * RK * Math.tan(Math.PI / 8)
      kDrum.add(place(boxG(gen + 0.14, 0.1, 0.14).translate(0, H1 - 0.12, RK + 0.03), o.cx, 0, o.cz, a), m.brick)
      dentil(-gen / 2, 0, gen / 2, 0, H1 - 0.02, { add: (g, mm) => kDrum.add(place(g.translate(0, 0, RK + 0.09), o.cx, 0, o.cz, a), mm) }, 0, 0)
      kDrum.add(place(boxG(gen + 0.26, 0.1, 0.26).translate(0, H1 + 0.09, RK + 0.06), o.cx, 0, o.cz, a), m.brick)
      if (n % 2 === 0) {
        const y0 = H0 + 0.5
        kDrum.add(place(uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y0, 0.46, 0.35, 0.28), 6)).translate(0, 0, RK + 0.015), o.cx, 0, o.cz, a), m.transom)
        const h = arch(new THREE.Shape(), 0, y0 - 0.04, 0.68, 0.38, 0.4)
        h.holes.push(arch(new THREE.Path(), 0, y0 - 0.04, 0.46, 0.38, 0.3))
        kDrum.add(place(subtract(h, 0.05, RK).translate(0, 0, 0), o.cx, 0, o.cz, a), m.brick)
      }
    }

    // Octagonal eave and dome
    const sheet = flatShadow(cylinderG(o.domeR + 0.02, o.eaveBR / OCT, 0.34, 8, true).rotateY(Math.PI / 8))
    const uvs = sheet.attributes.uv
    for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * 0.7, uvs.getY(i) * 3)
    kDome.add(place(sheet, o.cx, H1 + 0.32, o.cz), m.roofTile)
    kDome.add(place(roofTileDome(o.domeR, o.domeH, 10, 56), o.cx, H1 + 0.48, o.cz), m.roofTile)
    const finial: [number, number][] = [[0.08, 0], [0.05, 0.12], [0.1, 0.2], [0.03, 0.34], [0.07, 0.42], [0.001, 0.62]]
    kDome.add(place(rotateG(finial, 8), o.cx, H1 + 0.48 + o.domeH, o.cz), m.bronze)

    // Interior: molding, triangle belt, sixteen-sided drum and plain white dome (the interior photo shows only a white surface)
    for (const [gx, gz, x, z] of [[o.innerX * 2, 0.12, o.cx, o.cz - o.innerZ + 0.05], [o.innerX * 2, 0.12, o.cx, o.cz + o.innerZ - 0.05], [0.12, o.innerZ * 2, o.cx - o.innerX + 0.05, o.cz], [0.12, o.innerZ * 2, o.cx + o.innerX - 0.05, o.cz]] as const)
      box(gx, 0.14, gz, m.plaster, x, CORNICE, z, kRoof)
    kDrum.add(triangleBeltOf(o.cx, o.cz, o.innerX, o.innerZ, CORNICE + 0.05, o.innerBelt, o.innerR), m.muqarnas)
    const ik = flatShadow(cylinderG(o.innerR, o.innerR, o.innerDrum - o.innerBelt, 16, true).rotateY(Math.PI / 16))
    kDrum.add(place(ik, o.cx, (o.innerBelt + o.innerDrum) / 2, o.cz), m.plaster)
    for (let n = 0; n < 4; n++) {
      const a = n * Math.PI / 2, face = o.innerR * Math.cos(Math.PI / 16) - 0.02, y0 = o.innerBelt + 0.14
      kDrum.add(place(uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y0, 0.46, 0.3, 0.26), 6)).rotateY(Math.PI).translate(0, 0, face), o.cx, 0, o.cz, a), m.stainedGlass)
    }
    const profile: [number, number][] = [[o.innerR + 0.06, -0.03]]
    for (let t = 0; t <= 14; t++) {
      const a = (t / 14) * Math.PI / 2
      profile.push([Math.max(o.innerR * Math.cos(a), 0.001), o.innerDomeH * Math.sin(a)])
    }
    kDome.add(place(rotateG(profile, 48, [1, 1]), o.cx, o.innerDrum, o.cz), m.plaster)
  }
  cloak({ cx: AX, cz: AZ, xa: (A.x1 - A.x0) / 2 + WALL, za: (A.z1 - A.z0) / 2 + WALL, innerX: (A.x1 - A.x0) / 2, innerZ: (A.z1 - A.z0) / 2, drum: 8.7, drumTop: 10.5, eaveBR: 5.0, domeR: 4.4, domeH: 2.95, innerR: 3.98, innerBelt: 9.25, innerDrum: 10.5, innerDomeH: 2.85 })
  cloak({ cx: BX, cz: BZ, xa: (B.x1 - B.x0) / 2 + WALL, za: (B.z1 - B.z0) / 2 + WALL, innerX: (B.x1 - B.x0) / 2, innerZ: (B.z1 - B.z0) / 2, drum: 8.7, drumTop: 10.0, eaveBR: 4.1, domeR: 3.55, domeH: 2.5, innerR: 3.18, innerBelt: 8.9, innerDrum: 10, innerDomeH: 2.4 })

  // --- Mihrab wall (based on the photo): niche with cream edges, decorated band, wooden crown and panel above, red benches on both sides ---
  const ZM = A.z1
  const face = (g: THREE.BufferGeometry, mat: Mat) => k.add(g, mat)
  const FRAME_G = 2.1, FRAME_Y = PAVING + 4
  for (const s of [-1, 1]) {
    const band = uvFit(new THREE.PlaneGeometry(0.26, FRAME_Y - PAVING)).rotateY(Math.PI)
    face(band.translate(AX + s * (FRAME_G / 2 - 0.13), PAVING + (FRAME_Y - PAVING) / 2, ZM - 0.015), m.mihrabBand)
  }
  const topBand = uvFit(new THREE.PlaneGeometry(FRAME_G, 0.24)).rotateY(Math.PI)
  face(topBand.translate(AX, FRAME_Y - 0.12, ZM - 0.015), m.mihrabBand)
  // Niche: projecting white body, tiered plaster muqarnas, green-painted lower half
  const NICHE_G = 1.05, NICHE_Y = 3.3
  for (const s of [-1, 1]) box(0.2, NICHE_Y - 0.02, 0.32, m.muqarnas, AX + s * (NICHE_G / 2 + 0.1), PAVING + NICHE_Y / 2, ZM - 0.16)
  const paint = uvFit(new THREE.PlaneGeometry(NICHE_G, 1.62)).rotateY(Math.PI)
  face(paint.translate(AX, PAVING + 0.81, ZM - 0.02), m.mihrabPaint)
  const TIER = 6
  for (let i = 0; i < TIER; i++) {
    const t = i / TIER, g = NICHE_G * (1 - t * 0.78), y = PAVING + 1.62 + i * 0.28, dr = 0.28 * (1 - t) + 0.04
    box(g, 0.26, dr, m.muqarnas, AX, y + 0.13, ZM - dr / 2)
    const n = Math.max(1, Math.floor(g / 0.26))
    for (let j = 0; j < n; j++) {
      const hc = new THREE.SphereGeometry((g / n) * 0.46, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5)
      k.add(hc.translate(AX - g / 2 + (j + 0.5) * (g / n), y + 0.02, ZM - dr), m.muqarnas)
    }
  }
  // Step in front of the niche and marble benches with red carpets on both sides
  box(FRAME_G + 0.1, 0.1, 0.62, m.cream, AX, PAVING + 0.05, ZM - 0.31)
  box(FRAME_G - 0.2, 0.03, 0.6, m.carpet, AX, PAVING + 0.115, ZM - 0.3)
  floors.push({ x0: AX - FRAME_G / 2, x1: AX + FRAME_G / 2, z0: ZM - 0.62, z1: ZM, h0: PAVING + 0.1, h1: PAVING + 0.1 })
  obstacle(AX - NICHE_G / 2 - 0.2, AX + NICHE_G / 2 + 0.2, ZM - 0.2, ZM)
  const TERRACE_H = 0.24
  for (const [a, b] of [[AX - 2.75, AX - FRAME_G / 2], [AX + FRAME_G / 2, AX + 3.1]] as const) {
    box(b - a, TERRACE_H, 0.85, m.terraceMarble, (a + b) / 2, PAVING + TERRACE_H / 2, ZM - 0.425)
    box(b - a - 0.02, 0.03, 0.83, m.redCarpet, (a + b) / 2, PAVING + TERRACE_H + 0.015, ZM - 0.425)
    floors.push({ x0: a, x1: b, z0: ZM - 0.85, z1: ZM, h0: PAVING + TERRACE_H, h1: PAVING + TERRACE_H })
  }
  // Wooden crown (pediment) above the mihrab and a blank panel
  const crown = new THREE.Shape()
  crown.moveTo(-0.76, 0); crown.lineTo(0.76, 0); crown.lineTo(0.76, 0.3); crown.lineTo(0, 0.78); crown.lineTo(-0.76, 0.3); crown.closePath()
  k.add(place(subtract(crown, 0.07, 0).rotateY(Math.PI), AX, FRAME_Y + 0.46, ZM - 0.01), m.wood)
  box(1.45, 0.42, 0.05, m.woodDark, AX, FRAME_Y + 0.24, ZM - 0.03)
  box(1.28, 0.3, 0.02, m.plaque, AX, FRAME_Y + 0.24, ZM - 0.06)
  box(1.1, 0.5, 0.02, m.woodDark, AX, FRAME_Y + 0.78, ZM - 0.09)

  // Medallions: blank, in their positions in the photo
  const medallion = (x: number, y: number, z: number, ry: number, R = 0.42) => {
    const g = new THREE.CircleGeometry(R, 24)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i))
    k.add(place(g, x, y, z, ry), m.medallion)
  }
  medallion(AX - 1.3, PAVING + 4.7, ZM - 0.025, Math.PI); medallion(AX + 1.3, PAVING + 4.7, ZM - 0.025, Math.PI)
  medallion(A.x0 + 0.025, PAVING + 5.05, AZ - 0.05, Math.PI / 2); medallion(A.x0 + 0.025, PAVING + 5.05, AZ + 4 - 0.05, Math.PI / 2)
  medallion(A.x0 + 0.025, PAVING + 5.05, AZ - 4 + 0.05, Math.PI / 2)
  medallion(A.x1 - 0.025, PAVING + 5.05, AZ - 2.05, -Math.PI / 2); medallion(A.x1 - 0.025, PAVING + 5.05, AZ + 2.05, -Math.PI / 2)

  // Candlesticks: brass body, spherical top
  const candlestick = (x: number, z: number) => {
    k.add(place(rotateG([[0.18, 0], [0.08, 0.07], [0.04, 0.25], [0.12, 0.34], [0.04, 0.45], [0.09, 0.56], [0.03, 0.72], [0.1, 0.86], [0.03, 1.0], [0.06, 1.08]], 12), x, PAVING + TERRACE_H + 0.03, z), m.brass)
    k.add(new THREE.SphereGeometry(0.11, 12, 8).translate(x, PAVING + TERRACE_H + 1.23, z), m.marble)
  }
  candlestick(AX - 1.6, ZM - 0.42); candlestick(AX + 1.6, ZM - 0.42)

  // Wall lamps
  const lamp = (x: number, y: number, z: number, dx: number, dz: number) => {
    k.add(new THREE.BoxGeometry(0.03 + Math.abs(dz) * 0.04, 0.05, 0.03 + Math.abs(dx) * 0.04).translate(x - dx * 0.1, y + 0.1, z - dz * 0.1), m.dark)
    k.add(new THREE.SphereGeometry(0.05, 8, 6).translate(x, y, z), m.lamp)
  }
  lamp(AX - 1.45, 3.4, ZM - 0.16, 0, 1); lamp(AX + 1.45, 3.4, ZM - 0.16, 0, 1)
  lamp(A.x0 + 0.16, 3.4, AZ, -1, 0); lamp(A.x1 - 0.16, 3.4, AZ + 3, 1, 0)
  lamp(B.x1 - 0.16, 3.4, BZ, 1, 0); lamp(B.x0 + 0.16, 3.4, BZ - 2.2, -1, 0)

  // --- Minbar: dark wood, kiosk at the qibla wall; the stair rises from north to south (photo) ---
  const mb = MINBAR
  const side = new THREE.Shape()
  side.moveTo(0, PAVING); side.lineTo(mb.z0 + 3.9 - mb.z0, PAVING); side.lineTo(3.9, mb.apex + 0.08); side.lineTo(2.9, mb.apex + 0.08)
  side.lineTo(0.3, PAVING + 0.08); side.lineTo(0, PAVING + 0.08); side.closePath()
  for (const s of [-1, 1]) k.add(place(subtract(side, 0.06, -0.03).rotateY(-Math.PI / 2), mb.x + s * (mb.en / 2), 0, mb.z0), m.interlock)
  const STEP = 9
  for (let i = 0; i < STEP; i++) {
    const t = (i + 0.5) / STEP, y = PAVING + (mb.apex - PAVING) * t
    const zc = mb.rz0 + (mb.rz1 - mb.rz0) * t
    box(mb.en - 0.1, y - PAVING, (mb.rz1 - mb.rz0) / STEP + 0.01, m.redCarpet, mb.x, (y + PAVING) / 2, zc)
  }
  // Railing: sloped rail and dense balusters
  const armL = Math.hypot(mb.rz1 - mb.rz0, mb.apex - PAVING), slope = Math.atan2(mb.apex - PAVING, mb.rz1 - mb.rz0)
  for (const s of [-1, 1]) {
    const arm = new THREE.BoxGeometry(0.07, 0.07, armL + 0.3).rotateX(-slope)
    k.add(arm.translate(mb.x + s * (mb.en / 2), (PAVING + mb.apex) / 2 + 0.92, (mb.rz0 + mb.rz1) / 2), m.woodDark)
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, y = PAVING + (mb.apex - PAVING) * t, z = mb.rz0 + (mb.rz1 - mb.rz0) * t
      k.add(new THREE.BoxGeometry(0.03, 0.9, 0.03).translate(mb.x + s * (mb.en / 2), y + 0.45, z), m.woodDark)
    }
  }
  // Kiosk: four posts, arched openings, tiered cone and crescent finial
  const KZ = (mb.rz1 + A.z1) / 2, KY = mb.apex + 0.08
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.1, 1.5, 0.1, m.woodDark, mb.x + sx * (mb.en / 2 - 0.05), KY + 0.75, KZ + sz * 0.42)
  box(mb.en + 0.06, 0.22, 1, m.interlock, mb.x, KY + 1.56, KZ)
  box(mb.en + 0.2, 0.07, 1.14, m.woodDark, mb.x, KY + 1.7, KZ)
  k.add(place(flatShadow(cylinderG(0.08, 0.62, 0.72, 8).rotateY(Math.PI / 8)), mb.x, KY + 2.09, KZ), m.woodDark)
  k.add(place(rotateG([[0.05, 0], [0.03, 0.2], [0.06, 0.3], [0.015, 0.5]], 8), mb.x, KY + 2.42, KZ), m.brass)
  k.add(new THREE.TorusGeometry(0.075, 0.015, 6, 14, Math.PI * 1.5).rotateZ(-Math.PI * 0.25).translate(mb.x, KY + 3, KZ), m.brass)
  // Door: jambs, crest, red curtain gathered to one side
  for (const s of [-1, 1]) box(0.1, 2.5, 0.2, m.woodDark, mb.x + s * (mb.en / 2 - 0.02), PAVING + 1.25, mb.z0 + 0.1)
  box(mb.en + 0.1, 0.22, 0.22, m.woodDark, mb.x, PAVING + 2.45, mb.z0 + 0.1)
  const crest = new THREE.Shape()
  crest.moveTo(-0.52, 0); crest.quadraticCurveTo(-0.3, 0.1, 0, 0.42); crest.quadraticCurveTo(0.3, 0.1, 0.52, 0); crest.closePath()
  k.add(place(subtract(crest, 0.08, -0.04), mb.x, PAVING + 2.56, mb.z0 + 0.1), m.wood)
  box(0.42, 2.3, 0.03, m.curtain, mb.x - 0.27, PAVING + 1.17, mb.z0 + 0.03)
  floors.push({ x0: mb.x - mb.en / 2 + 0.05, x1: mb.x + mb.en / 2 - 0.05, z0: mb.rz0, z1: mb.rz1, h0: PAVING, h1: mb.apex })
  obstacle(mb.x - mb.en / 2, mb.x + mb.en / 2, mb.rz1, A.z1)

  // Wooden kürsü on the east (photo)
  const KRX = AX + 3.55
  box(0.82, 0.7, 0.7, m.woodDark, KRX, PAVING + 0.5, ZM - 0.4)
  box(0.82, 0.08, 0.7, m.wood, KRX, PAVING + 0.9, ZM - 0.4)
  for (const s of [-1, 1]) box(0.82, 0.4, 0.05, m.interlock, KRX, PAVING + 1.15, ZM - 0.4 + s * 0.34)
  box(0.05, 0.4, 0.7, m.interlock, KRX - 0.39, PAVING + 1.15, ZM - 0.4)
  obstacle(KRX - 0.42, KRX + 0.42, ZM - 0.78, ZM)

  // --- Gallery: wooden raised floor on the north wall, four posts, turned railing ---
  const MH = MAHFIL.y
  box(A.x1 - A.x0, 0.2, MAHFIL.z1 - A.z0, m.wood, AX, MH - 0.1, (MAHFIL.z1 + A.z0) / 2)
  box(A.x1 - A.x0, 0.14, 0.14, m.woodDark, AX, MH - 0.26, MAHFIL.z1 - 0.1)
  for (const x of [A.x0 + 1.4, AX - 1.1, AX + 1.1, A.x1 - 1.05]) {
    box(0.2, MH - PAVING - 0.2, 0.2, m.wood, x, (MH - 0.2 + PAVING) / 2, MAHFIL.z1 - 0.1)
    obstacle(x - 0.1, x + 0.1, MAHFIL.z1 - 0.2, MAHFIL.z1, false, 2.8)
    // Brackets
    const d = new THREE.BoxGeometry(0.1, 0.1, 0.9).rotateX(0.65)
    k.add(d.translate(x, MH - 0.55, MAHFIL.z1 - 0.45), m.wood)
  }
  const railingX = (x0: number, x1: number) => {
    box(x1 - x0, 0.07, 0.12, m.wood, (x0 + x1) / 2, MH + 0.95, MAHFIL.z1 - 0.05)
    const n = Math.floor((x1 - x0) / 0.32)
    for (let i = 0; i <= n; i++) k.add(place(rotateG([[0.03, 0], [0.05, 0.25], [0.025, 0.45], [0.05, 0.7], [0.03, 0.93]], 7), x0 + ((x1 - x0) * i) / n, MH, MAHFIL.z1 - 0.05), m.woodDark)
  }
  railingX(A.x0, MAHFIL.stair.x0 - 0.02); railingX(MAHFIL.stair.x1 + 0.02, A.x1)
  floors.push({ x0: A.x0, x1: A.x1, z0: A.z0, z1: MAHFIL.z1, h0: MH, h1: MH, underPassable: true })
  // Gallery stairs: position not in the source, representative
  const md = MAHFIL.stair
  floors.push({ x0: md.x0, x1: md.x1, z0: MAHFIL.z1, z1: md.z1, h0: MH, h1: PAVING })
  const STAIR_STEP = 14
  for (let i = 0; i < STAIR_STEP; i++) {
    const t = (i + 0.5) / STAIR_STEP, y = MH + (PAVING - MH) * t, z = MAHFIL.z1 + (md.z1 - MAHFIL.z1) * t
    box(md.x1 - md.x0, 0.05, (md.z1 - MAHFIL.z1) / STAIR_STEP + 0.03, m.wood, (md.x0 + md.x1) / 2, y, z)
  }
  const mL = Math.hypot(md.z1 - MAHFIL.z1, MH - PAVING), mE = Math.atan2(MH - PAVING, md.z1 - MAHFIL.z1)
  for (const x of [md.x0, md.x1]) {
    k.add(new THREE.BoxGeometry(0.05, 0.2, mL).rotateX(mE).translate(x, (MH + PAVING) / 2 - 0.05, (MAHFIL.z1 + md.z1) / 2), m.woodDark)
    k.add(new THREE.BoxGeometry(0.06, 0.06, mL).rotateX(mE).translate(x, (MH + PAVING) / 2 + 0.85, (MAHFIL.z1 + md.z1) / 2), m.wood)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      k.add(new THREE.BoxGeometry(0.03, 0.9, 0.03).translate(x, MH + (PAVING - MH) * t + 0.42, MAHFIL.z1 + (md.z1 - MAHFIL.z1) * t), m.woodDark)
    }
  }
  // Cupboard and low railing under the gallery (photo)
  box(1.2, 2.2, 0.5, m.woodDark, AX - 2.45, PAVING + 1.1, A.z0 + 0.25)
  obstacle(AX - 3.05, AX - 1.85, A.z0, A.z0 + 0.5)

  // --- Minaret: octagonal base, eight niches, Turkish triangles, brick shaft, brick saw-tooth under the balcony, marble railing, pointed lead cone ---
  const MN = MINARET
  const extMin = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, MN.x, 0, MN.z), mat)
  const PEDESTAL_R = 1.75, PEDESTAL_Y = 9.6
  const oct8 = (rd: number, h: number, y: number) => flatShadow(cylinderG(rd / OCT, rd / OCT, h, 8).rotateY(Math.PI / 8)).translate(0, y + h / 2, 0)
  extMin(oct8(PEDESTAL_R, PEDESTAL_Y, 0), m.alternating)
  extMin(oct8(PEDESTAL_R + 0.06, 0.16, PEDESTAL_Y - 0.1), m.brick)
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4
    const s = arch(new THREE.Shape(), 0, PEDESTAL_Y - 2.4, 0.86, 1.1, 0.5)
    k.add(place(new THREE.ShapeGeometry(s, 6).translate(0, 0, PEDESTAL_R + 0.015).rotateY(a), MN.x, 0, MN.z), m.darkStone)
    const h = arch(new THREE.Shape(), 0, PEDESTAL_Y - 2.44, 1.08, 1.12, 0.62)
    h.holes.push(arch(new THREE.Path(), 0, PEDESTAL_Y - 2.44, 0.86, 1.12, 0.5))
    k.add(place(subtract(h, 0.04, PEDESTAL_R).rotateY(a), MN.x, 0, MN.z), m.brick)
  }
  // Transition band
  const SR = 1.12, TRANSITION = 1.5, GY = PEDESTAL_Y + 0.06
  const transition = cylinderG(SR + 0.04, PEDESTAL_R / OCT, TRANSITION, 16, true).rotateY(Math.PI / 8)
  const guv = transition.attributes.uv
  for (let i = 0; i < guv.count; i++) guv.setXY(i, (guv.getX(i) / (Math.PI * 2 * (PEDESTAL_R / OCT))) * 8, guv.getY(i) / TRANSITION)
  const gd = flatShadow(transition)
  const gm = (m.turkishTriangle as THREE.MeshStandardMaterial).map
  if (gm) gm.wrapS = THREE.RepeatWrapping
  extMin(gd.translate(0, GY + TRANSITION / 2, 0), m.turkishTriangle)
  extMin(cylinderG(SR + 0.12, SR + 0.12, 0.1, 28).translate(0, GY + TRANSITION + 0.03, 0), m.marble)
  const BODY0 = GY + TRANSITION, BODY1 = BODY0 + 5.9
  extMin(rotateG([[SR, BODY0], [SR - 0.05, BODY1]], 28), m.brick)
  // Under the balcony: seven tiers of brick saw-tooth (inventory), opening upward
  const FLOOR_LEVEL = 7
  for (let t = 0; t < FLOOR_LEVEL; t++) {
    const rr = SR - 0.03 + t * 0.075, y = BODY1 + t * 0.27
    extMin(cylinderG(rr + 0.07, rr, 0.27, 28).translate(0, y + 0.135, 0), m.brick)
    for (let a = 0; a < 26; a++) {
      const te = ((a + (t % 2) * 0.5) * Math.PI * 2) / 26
      extMin(new THREE.BoxGeometry(0.12, 0.09, 0.1).translate(0, y + 0.05, rr + 0.04).rotateY(te), m.brick)
    }
  }
  const SY = BODY1 + FLOOR_LEVEL * 0.27
  const SERR = SR - 0.03 + FLOOR_LEVEL * 0.075 + 0.1
  extMin(flatShadow(cylinderG(SERR, SERR, 1.2, 16)).translate(0, SY + 0.6, 0), m.marble)
  extMin(cylinderG(SERR + 0.03, SERR + 0.03, 0.06, 16).translate(0, SY + 1.2, 0), m.darkStone)
  const PTK = 0.83, PY = SY + 1.2, PH = 3
  extMin(rotateG([[PTK, PY], [PTK, PY + PH]], 24), m.brick)
  // Above the upper shaft: toothed band and small openings
  for (let a = 0; a < 16; a++) {
    const te = (a * Math.PI * 2) / 16
    extMin(new THREE.BoxGeometry(0.2, 0.3, 0.1).translate(0, PY + PH - 0.28, PTK).rotateY(te), a % 2 ? m.brick : m.darkStone)
  }
  extMin(cylinderG(PTK + 0.08, PTK + 0.08, 0.12, 24).translate(0, PY + PH + 0.06, 0), m.darkStone)
  extMin(rotateG([[0.86, 0], [0.87, 0.3], [0.72, 0.72], [0.42, 1.12], [0.14, 1.5], [0.03, 1.9], [0.001, 1.95]], 20).translate(0, PY + PH + 0.12, 0), m.leadCover)
  extMin(rotateG([[0.04, 0], [0.02, 0.2], [0.05, 0.3], [0.01, 0.6], [0.001, 0.62]], 8).translate(0, PY + PH + 2, 0), m.bronze)
  circles.push({ x: MN.x, z: MN.z, r: PEDESTAL_R + 0.08 })

  // --- Fountain: embedded in the west wall, pointed-arched, with the real inscription photo above it (photo and inventory) ---
  const CZ = AZ
  const fountainTap = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, XB, 0, CZ, -Math.PI / 2), mat)
  const cg = arch(new THREE.Shape(), 0, 0.1, 2, 0.95, 1)
  cg.holes.push(arch(new THREE.Path(), 0, 0.1, 1.2, 0.95, 0.7))
  fountainTap(subtract(cg, 0.07, 0), m.cream)
  fountainTap(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 0.1, 1.2, 0.95, 0.7), 8).translate(0, 0, 0.02), m.muqarnas)
  fountainTap(boxG(0.95, 0.09, 0.5).translate(0, 0.72, 0.22), m.marble)
  fountainTap(rotateG([[0.42, 0], [0.35, 0.3], [0.1, 0.6]], 14).scale(1, -1, 0.65).translate(0, 0.7, 0.2), m.marble)
  fountainTap(boxG(0.55, 0.45, 0.16).translate(0, 0.25, 0.1), m.cream)
  fountainTap(new THREE.PlaneGeometry(1.1, 0.62).translate(0, 2.62, 0.09), m.fountainInscription)
  fountainTap(boxG(1.26, 0.76, 0.05).translate(0, 2.62, 0.06), m.cream)

  // --- Tomb: 4.60 × 4.60 m, baldachin on four piers, all brick, saw-tooth eave, tile-covered dome, wooden tie rods ---
  const T = TOMB, TY = 4.05, TA = T.y / 2
  const tk = (g: THREE.BufferGeometry, mat: Mat, kv = k) => kv.add(place(g, T.x, 0, T.z), mat)
  tk(boxG(T.y + 0.3, 0.3, T.y + 0.3).translate(0, 0.15, 0), m.brick)
  tk(boxG(T.y - 1, 0.04, T.y - 1).translate(0, 0.32, 0), m.marble)
  const TARCH = { g: 2.9, d: 1.55, k: 1.1, y0: 0.3 }
  for (let n = 0; n < 4; n++) {
    const s = rect(-TA, 0.3, TA, TY)
    s.holes.push(arch(new THREE.Path(), 0, TARCH.y0, TARCH.g, TARCH.d, TARCH.k))
    const ry = (n * Math.PI) / 2
    k.add(place(subtract(s, 0.72, TA - 0.72).rotateY(ry), T.x, 0, T.z), m.brick)
    // Interior plaster and arch soffit white
    const inner = arch(new THREE.Shape(), 0, TARCH.y0, TARCH.g + 0.02, TARCH.d, TARCH.k + 0.01)
    inner.holes.push(arch(new THREE.Path(), 0, TARCH.y0, TARCH.g - 0.1, TARCH.d, TARCH.k - 0.05))
    k.add(place(subtract(inner, 0.74, TA - 0.73).rotateY(ry), T.x, 0, T.z), m.plasterOuter)
    const ring = arch(new THREE.Shape(), 0, TARCH.y0 + 1.1, TARCH.g + 0.72, TARCH.d - 1.05, TARCH.k + 0.36)
    ring.holes.push(arch(new THREE.Path(), 0, TARCH.y0 + 1.1, TARCH.g + 0.02, TARCH.d - 1.05, TARCH.k + 0.01))
    k.add(place(subtract(ring, 0.04, TA).rotateY(ry), T.x, 0, T.z), m.brick)
    // Wooden tie rods
    tk(boxG(T.y - 1.2, 0.12, 0.12).translate(0, TARCH.y0 + TARCH.d - 0.1, TA - 0.36).rotateY(ry), m.woodDark)
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) obstacle(T.x + sx * (TA - 0.36) - 0.36, T.x + sx * (TA - 0.36) + 0.36, T.z + sz * (TA - 0.36) - 0.36, T.z + sz * (TA - 0.36) + 0.36)
  floors.push({ x0: T.x - TA - 0.15, x1: T.x + TA + 0.15, z0: T.z - TA - 0.15, z1: T.z + TA + 0.15, h0: 0.32, h1: 0.32 })
  eaveB(T.x - TA, T.x + TA, T.z - TA, T.z + TA, TY + 0.04, kRoof)
  // Inner pendentive dome
  const tp: [number, number][] = [[1.62, 0]]
  for (let t = 1; t <= 10; t++) { const a = (t / 10) * Math.PI / 2; tp.push([Math.max(1.62 * Math.cos(a), 0.001), 1.5 * Math.sin(a)]) }
  kDome.add(place(rotateG(tp, 28, [1, 1]), T.x, TY - 0.28, T.z), m.plaster)
  kRoof.add(place(fourSlope(-TA - 0.25, TA + 0.25, -TA - 0.25, TA + 0.25, TY + 0.3, TY + 0.55, 0.25, 0.25), 0, 0, 0).translate(T.x, 0, T.z), m.roofTile)
  const tCover = rect(-TA, -TA, TA, TA)
  tCover.holes.push(new THREE.Path().absarc(0, 0, 1.68, 0, Math.PI * 2, true))
  k.add(new THREE.ShapeGeometry(tCover, 16).rotateX(Math.PI / 2).translate(T.x, TY - 0.28, T.z), m.plaster)
  kRoof.add(new THREE.ShapeGeometry(rect(-TA, -TA, TA, TA), 1).rotateX(-Math.PI / 2).translate(T.x, TY + 0.55, T.z), m.roofTile)
  kDome.add(place(roofTileDome(2.08, 1.45, 7, 36), T.x, TY + 0.55, T.z), m.roofTile)
  kDome.add(place(rotateG([[0.06, 0], [0.03, 0.14], [0.06, 0.22], [0.001, 0.42]], 8), T.x, TY + 2, T.z), m.bronze)
  // Sarcophagus and headstones: green body, gold-colored head and foot stones. Blank relief impression.
  tk(boxG(1, 0.42, 2).translate(0, 0.53, 0), m.green)
  tk(boxG(1.2, 0.08, 2.2).translate(0, 0.36, 0), m.marble)
  const headstone = (z: number, y: number) => {
    const s = arch(new THREE.Shape(), 0, 0, 0.8, y - 0.35, 0.35)
    const on = uvFit(subtract(s, 0.1, 0))
    k.add(place(on, T.x, 0.72, T.z + z - 0.05), m.headstone)
  }
  headstone(-0.85, 1.55); headstone(0.85, 1.25)
  obstacle(T.x - 0.6, T.x + 0.6, T.z - 1.1, T.z + 1.1)

  // --- Şadırvan (north courtyard): eight wooden posts, arched band, tile cone; marble body in the middle (photo) ---
  const SD = FOUNTAIN
  const extSd = (g: THREE.BufferGeometry, mat: Mat, kv = k) => kv.add(place(g, SD.x, 0, SD.z), mat)
  extSd(flatShadow(cylinderG(2.1, 2.1, 0.2, 8).rotateY(Math.PI / 8)).translate(0, 0.14, 0), m.marble)
  extSd(flatShadow(cylinderG(0.75, 0.82, 1.15, 8).rotateY(Math.PI / 8)).translate(0, 0.8, 0), m.marble)
  extSd(new THREE.CylinderGeometry(0.62, 0.62, 0.02, 16).translate(0, 1.38, 0), m.water)
  extSd(rotateG([[0.22, 0], [0.12, 0.12], [0.1, 0.3], [0.001, 0.36]], 10).translate(0, 1.38, 0), m.marble)
  circles.push({ x: SD.x, z: SD.z, r: 0.9 })
  const SR_D = 1.72
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + n * Math.PI / 4
    const px = Math.sin(a) * SR_D, pz = Math.cos(a) * SR_D
    extSd(boxG(0.16, 2.6, 0.16).translate(px, 1.5, pz), m.wood)
    circles.push({ x: SD.x + px, z: SD.z + pz, r: 0.1 })
    const dir = n * Math.PI / 4, gen = 2 * SR_D * Math.sin(Math.PI / 8)
    const ks = rect(-gen / 2, 2.1, gen / 2, 2.85)
    ks.holes.push(arch(new THREE.Path(), 0, 2.1, gen - 0.12, 0.05, 0.56))
    extSd(subtract(ks, 0.08, SR_D * OCT - 0.04).rotateY(dir), m.wood)
    // Small stools
    if (n % 2 === 0) extSd(boxG(0.32, 0.36, 0.32).translate(Math.sin(dir) * 1.28, 0.42, Math.cos(dir) * 1.28), m.wood)
  }
  extSd(flatShadow(cylinderG(SR_D + 0.1, SR_D + 0.1, 0.15, 8).rotateY(Math.PI / 8)).translate(0, 2.92, 0), m.woodDark)
  extSd(flatShadow(cylinderG(0.08, 2.42, 1.15, 8, true).rotateY(Math.PI / 8)).translate(0, 3.52, 0), m.roofTile, kDome)
  extSd(rotateG([[0.08, 0], [0.04, 0.16], [0.07, 0.24], [0.001, 0.46]], 8).translate(0, 4.08, 0), m.bronze, kDome)

  // --- Hazire: about eighty stones; to the south and north, framed graves (photo). Positions are representative. ---
  const graveArea = (x: number, z: number) => {
    if (Math.hypot(x, z) > 21.5) return false
    if (x > XB - 1.4 && x < XD + 1.8 && z > ZSC - 8.6 && z < ZG_A + 0.9) return false
    if (x > XB - 3.6 && x < XB - 0.5 && z > ZSC - 1 && z < ZK + 4) return false
    if (Math.abs(x - T.x) < 3.6 && Math.abs(z - T.z) < 4) return false
    if (x > T.x - 1.8 && x < T.x + 1.8 && z > ZG_A && z < T.z) return false
    return true
  }
  const title = (tip: number, x: number, z: number, y0: number) => {
    const base = 0.18 + r() * 0.04
    if (tip === 0) {
      // Flat headstone with pointed top
      const s = new THREE.Shape()
      s.moveTo(-base, 0); s.lineTo(base, 0); s.lineTo(base, 0.72); s.lineTo(0, 0.98); s.lineTo(-base, 0.72); s.closePath()
      k.add(place(subtract(s, 0.09, -0.045).rotateY(Math.PI / 2), x, y0, z), m.marble)
    } else if (tip === 1) {
      // Cylindrical body and turban (kavuk)
      k.add(place(rotateG([[0.13, 0], [0.13, 0.78]], 8), x, y0, z), m.marble)
      k.add(place(new THREE.SphereGeometry(0.17, 8, 5).scale(1, 0.72, 1), x, y0 + 0.86, z), m.marble)
    } else {
      // Winged (bow) headstone
      const s = new THREE.Shape()
      s.moveTo(-0.1, 0); s.lineTo(0.1, 0); s.lineTo(0.1, 0.5); s.lineTo(0.28, 0.82); s.lineTo(0.05, 0.7); s.lineTo(0, 0.95); s.lineTo(-0.05, 0.7); s.lineTo(-0.28, 0.82); s.lineTo(-0.1, 0.5); s.closePath()
      k.add(place(subtract(s, 0.08, -0.04).rotateY(Math.PI / 2), x, y0, z), m.marble)
    }
  }
  let graveCount = 0
  for (let z = -21; z < 21 && graveCount < 74; z += 2.35) {
    for (let x = -21; x < 21 && graveCount < 74; x += 2.75) {
      const mx = x + r() * 0.5, mz = z + r() * 0.4
      const dur = r() > 0.35
      if (!dur || !graveArea(mx, mz)) continue
      graveCount++
      const gen = 1.5, der = 0.68, h = 0.22
      for (const s of [-1, 1]) {
        box(gen, h, 0.08, m.terraceMarble, mx, h / 2, mz + (s * der) / 2)
        box(0.08, h, der, m.terraceMarble, mx + (s * gen) / 2, h / 2, mz)
      }
      box(gen - 0.08, 0.02, der - 0.08, m.graveInner, mx, h - 0.04, mz)
      const tip = Math.floor(r() * 3)
      title(tip, mx - gen / 2 + 0.1, mz, h - 0.05)
      if (r() > 0.45) title(0, mx + gen / 2 - 0.1, mz, h - 0.1)
      obstacle(mx - gen / 2, mx + gen / 2, mz - der / 2, mz + der / 2)
    }
  }
  // Monumental sarcophagi: stones dated H. 1208 / M. 1794 (based on the photo; positions are representative)
  for (const [x, z] of [[T.x - 4.4, T.z + 2.2], [T.x + 4.3, T.z + 2.5]] as const) {
    box(2.1, 0.62, 0.92, m.marble, x, 0.31, z)
    box(2.14, 0.06, 0.96, m.terraceMarble, x, 0.65, z)
    box(2.03, 0.02, 0.84, m.graveInner, x, 0.69, z)
    for (const s of [-1, 1]) {
      box(0.1, 1.8, 0.42, m.marble, x + s * 0.98, 1.3, z)
      k.add(place(new THREE.SphereGeometry(0.21, 8, 6).scale(1, 0.8, 1), x + s * 0.98, 2.35, z), m.marble)
    }
    obstacle(x - 1.05, x + 1.05, z - 0.46, z + 0.46)
  }

  // --- Trees: cypresses and a large leafy tree (photo). Positions are representative ---
  const cypress = (x: number, z: number, length: number) => {
    const p: [number, number][] = [[0.1, 1], [0.8, 1.4], [1.2, length * 0.22], [1.32, length * 0.38], [1.2, length * 0.55], [0.9, length * 0.72], [0.5, length * 0.88], [0.001, length]]
    const g = rotateG(p, 14)
    const pose = g.attributes.position, seed = x * 0.4 + z * 0.7
    for (let v = 0; v < pose.count; v++) {
      const vx = pose.getX(v), vy = pose.getY(v), vz = pose.getZ(v), a = Math.atan2(vx, vz)
      const o = 1 + 0.11 * Math.sin(a * 3 + vy * 0.8 + seed) + 0.06 * Math.sin(a * 7 - vy * 1.7 + seed)
      pose.setX(v, vx * o); pose.setZ(v, vz * o)
    }
    g.computeVertexNormals()
    k.add(place(g, x, 0, z), m.cypress)
    k.add(place(cylinderG(0.14, 0.24, 1.6, 8), x, 0.8, z), m.bodyB)
    circles.push({ x, z, r: 0.35 })
  }
  cypress(-13, 14.5, 15); cypress(-10.2, 17.6, 13.5); cypress(16.4, 7.5, 14.5); cypress(18, 2.5, 13)
  const bigTree = (x: number, z: number, R: number, length: number) => {
    k.add(place(cylinderG(0.32, 0.48, length * 0.55, 8), x, length * 0.27, z), m.bodyB)
    circles.push({ x, z, r: 0.55 })
    for (const [dx, dy, dz, rr] of [[0, 0.72, 0, 1], [R * 0.45, 0.6, R * 0.2, 0.7], [-R * 0.4, 0.62, R * 0.32, 0.72], [R * 0.1, 0.62, -R * 0.45, 0.72]] as const) {
      const g = new THREE.IcosahedronGeometry(R * rr, 2)
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const o = 1 + 0.12 * Math.sin(p.getX(v) * 1.7 + p.getY(v)) + 0.08 * Math.cos(p.getZ(v) * 2.3)
        p.setXYZ(v, p.getX(v) * o, p.getY(v) * o, p.getZ(v) * o)
      }
      g.computeVertexNormals()
      const uv = g.attributes.uv
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10, uv.getY(i) * 6)
      k.add(place(g, x + dx, length * dy, z + dz), m.leaf)
    }
  }
  bigTree(-16.5, -9.5, 4, 12)

  // --- Stops ---
  const stop = (id: string, ad: string, position: [number, number, number], look: [number, number, number]): InteriorStop => ({ id, ad, position, look })
  const ICY = BAY_Y + PAVING
  const SC_CENTER = (ZSC + ZK) / 2
  const stops: InteriorStop[] = [
    stop('narthex', 'Son cemaat yeri', [AX + 0.6, ICY, SC_CENTER - 0.3], [AX, 2.3, A.z0]),
    stop('deed', 'Taş vakfiye', [XD - END_WALL - 5.2, ICY, SC_CENTER], [XD - END_WALL, 4.1, SC_CENTER]),
    stop('mihrab', 'Mihrap', [AX, ICY, 1.15], [AX, 2.75, A.z1]),
    stop('minbar', 'Minber', [AX + 0.7, ICY, 1.6], [MINBAR.x, 2.5, MINBAR.z0 + 1.8]),
    stop('mahfil', 'Mahfil', [AX - 0.2, MAHFIL.y + BAY_Y, A.z0 + 1.1], [AX, 3, A.z1]),
    stop('passage', 'Geçit', [(A.x1 + B.x0) / 2, ICY, BZ], [BX + 3, 2.4, BZ]),
    stop('small-space', 'Küçük mekân', [BX + 0.9, ICY, BZ - 1.6], [BX - 0.8, 5.2, B.z1]),
    stop('fountainTap', 'Çeşme', [XB - 3.1, BAY_Y, CZ], [XB, 1.5, CZ]),
    stop('tomb', 'Umur Bey Türbesi', [T.x + 0.1, BAY_Y, T.z - 4.6], [T.x, 1.9, T.z]),
    stop('fountain', 'Şadırvan', [SD.x - 4.2, BAY_Y, SD.z - 1.2], [SD.x, 2, SD.z]),
  ]

  // --- Layers ---
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  const root = k.group()
  root.add(roofGroup, drumGroup, domeGroup)

  return {
    root,
    layers: [
      { group: roofGroup, height: 18, ad: 'Çatı' },
      { group: drumGroup, height: 30, ad: 'Kasnaklar' },
      { group: domeGroup, height: 42, ad: 'Kubbeler' },
    ],
    stops,
    walking: {
      // Inner circle of the polygonal base: corners cannot be walked into the void.
      limit: { x0: -20, x1: 20, z0: -20, z1: 20, circle: { x: 0, z: 0, r: 23.8 * Math.cos(Math.PI / 64) } },
      boxes: obstacles,
      circles,
      floors,
      viewBlockers: walls,
      eyeY: BAY_Y,
      baseY: 0,
    },
    // From the northeast as in the photo: late-comers' portico in front, minaret behind.
    camera: { position: [31, 24, -40], target: [0, 7.2, 0] },
    pedestalRadius: 24.5,
    innerLights: [[AX, 9.4, AZ], [BX, 8.6, BZ], [0, 6.2, SC_CENTER]],
  }
}
