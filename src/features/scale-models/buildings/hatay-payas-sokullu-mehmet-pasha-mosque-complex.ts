// Representative exterior model of the Sokullu Mehmet Paşa Complex in Payas (Hatay). Not a real 3D scan; no interior yet.
// Source: Hatay Vakıf Eserleri, pp. 98–119 (PDF pp. 50–60). The book has no plan and gives no dimensions, so every size here is representative.
// From the text: north–south arasta with 24 + 24 shops, a dua kubbesi in the middle with east and west gates,
// north and south portals with fountains (p. 102); the han to the east with 9 + 9 + 12 porticoes, tabhanes west of its courtyard
// two on each side of the entrance (pp. 104–106); the imaret south of the han courtyard, the hamam west of the northern half
// of the arasta, the sıbyan mektebi west of the hamam's warm room (pp. 108–110); the mosque with a garden courtyard and hanikah
// rooms in the south-west, its minaret at the north-west corner and the şadırvan on the courtyard axis (pp. 112–118).
// North is −z, east is +x.
import * as THREE from 'three'
import { Bucket, cylinderG, place } from '../uluMosquePiece'
import type { Model } from '../uluMosqueModel'
import type { InteriorWalk } from '../uluMosqueInterior'
import { sokulluMaterials, blockG, panelG, archWall, dome, drum, vaultCover, tree, type SM } from './hatay-payas-sokullu-mehmet-pasha-mosque-complex-pieces/common'

/** Plan is drawn around the arasta axis; everything is shifted onto the pedestal centre. */
const OX = -10.5, OZ = -5.5
const PEDESTAL = 72

// Arasta: corridor x ±2.8, shops 2.8..7 deep on each side; 6 bays of 5.6 m (two shops each) per half, dua kubbesi bay in the middle.
const CW = 2.8, SHOP_OUT = 7, BAY = 5.6, HALF = 2.8 + 6 * BAY, SHOP_H = 4.7, CORR_H = 8.4

export const building = (): Model => {
  const m = sokulluMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kVault = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()
  const box = (kv: Bucket, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => kv.add(blockG(x0, x1, y0, y1, z0, z1), mat)
  /** Flat roof slab with a small overhang. */
  const slab = (x0: number, x1: number, z0: number, z1: number, y: number) => box(kRoof, m.roof, x0 - 0.2, x1 + 0.2, y, y + 0.35, z0 - 0.2, z1 + 0.2)

  site(k, m)
  arasta(k, kVault, kDrum, kDome, m, box, slab)
  han(k, m, box, slab)
  hamam(k, kRoof, kVault, kDrum, kDome, m, box, slab)
  mosque(k, kRoof, kDrum, kDome, m, box, slab)

  const root = k.group()
  const groups = [kRoof, kVault, kDrum, kDome].map((b) => b.group())
  root.add(...groups)
  for (const g of [root, ...groups]) g.children.forEach((c) => { if (c instanceof THREE.Mesh) c.geometry.translate(OX, 0, OZ) })

  // Exterior only for now: no interior stops, so "İçeri gir" stays disabled. The walk area is a minimal valid placeholder.
  const walking: InteriorWalk = { limit: { x0: -1, x1: 1, z0: -1, z1: 1 }, boxes: [], circles: [], floors: [], viewBlockers: [], eyeY: 1.6, baseY: 0.05 }

  return {
    root,
    layers: [
      { group: groups[0], height: 16, name: 'Damlar' },
      { group: groups[1], height: 26, name: 'Tonoz örtüleri' },
      { group: groups[2], height: 36, name: 'Kasnaklar' },
      { group: groups[3], height: 48, name: 'Kubbeler' },
    ],
    stops: [],
    walking,
    camera: { position: [72, 62, -96], target: [0, 4, 0] },
    pedestalRadius: PEDESTAL,
  }
}

type BoxFn = (kv: Bucket, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => void
type SlabFn = (x0: number, x1: number, z0: number, z1: number, y: number) => void

/** Ground, paved streets around the complex and a few representative trees. */
function site(k: Bucket, m: SM) {
  const flatUv = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
    return g
  }
  k.add(flatUv(new THREE.CircleGeometry(PEDESTAL - 0.6, 80).rotateX(-Math.PI / 2).translate(-OX, 0.01, -OZ)), m.grass)
  k.add(flatUv(blockG(-42, 63, 0, 0.05, -40, 50)), m.paving)
  const trees: [number, number, number][] = [[-26, 14, 6], [-20, 20, 5], [-28, 22, 5], [-24, -14, 5], [-28, -11, 4], [36, 0, 6], [28, -8, 5], [40, 10, 5], [-46, -20, 8], [68, -20, 8], [62, 36, 7], [-40, 56, 7]]
  trees.forEach(([x, z, s], i) => tree(k, m, x, z, s, 50 + i))
}

/** Arasta-bedesten: shops on both sides of a cross-vaulted street, central dua kubbesi, north and south portals, two fountains. */
function arasta(k: Bucket, kVault: Bucket, kDrum: Bucket, kDome: Bucket, m: SM, box: BoxFn, slab: SlabFn) {
  for (const s of [-1, 1]) {
    // Shop blocks (24 per side) and the corridor walls rising above the shop roofs
    for (const h of [-1, 1]) {
      const z0 = h < 0 ? -HALF : 2.8, z1 = h < 0 ? -2.8 : HALF
      const xa = s * CW, xb = s * SHOP_OUT
      box(k, m.stone, Math.min(xa, xb), Math.max(xa, xb), 0, SHOP_H, z0, z1)
      slab(Math.min(xa, xb), Math.max(xa, xb), z0, z1, SHOP_H)
      box(k, m.stone, s < 0 ? -CW - 0.6 : CW, s < 0 ? -CW : CW + 0.6, SHOP_H, CORR_H, z0, z1)
      for (let i = 0; i < 12; i++) {
        const zc = z0 + (i + 0.5) * 2.8
        // Shop fronts face the corridor: flat wooden lintel and door, a pointed arch above (p. 102)
        const n = s < 0 ? 'x+' : 'x-'
        k.add(panelG(n, s * (CW - 0.01), zc, 1.25, 1.8, 2.4), m.wood)
        k.add(panelG(n, s * (CW - 0.01), zc, 3.3, 2.2, 1.4, true), m.dark)
        // Upper windows on the east and west faces above the shop roofs (p. 102)
        if (i % 2 === 0) k.add(panelG(s < 0 ? 'x-' : 'x+', s * (CW + 0.61), zc + 1.4, 6.5, 0.7, 1.1, true), m.dark)
      }
      // Cross vaults seen from outside: a low cover per bay with a skylight on top (p. 102)
      for (let b = 0; b < 6; b++) {
        const zc = z0 + (b + 0.5) * BAY
        if (s < 0) {
          vaultCover(kVault, m, 0, zc, CORR_H, 2 * CW + 1.2, BAY, 1.2)
          box(kVault, m.roof, -0.35, 0.35, CORR_H + 0.9, CORR_H + 1.5, zc - 0.35, zc + 0.35)
        }
      }
    }
    // Middle bay: east and west gates in three-colour stone (p. 102); the east one is the han portal (p. 104)
    const gx = s * (CW + 0.3)
    box(k, m.stone, Math.min(gx, s * SHOP_OUT), Math.max(gx, s * SHOP_OUT), 0, 6, -2.8, -1.8)
    box(k, m.stone, Math.min(gx, s * SHOP_OUT), Math.max(gx, s * SHOP_OUT), 0, 6, 1.8, 2.8)
    box(k, m.stone, Math.min(gx, s * SHOP_OUT), Math.max(gx, s * SHOP_OUT), 4.2, 6, -1.8, 1.8)
    k.add(archWall('z', s * (CW + 0.3), -2.8, 2.8, 0, CORR_H, 0.6, [{ at: 0, w: 3.2, h: 5.2 }]), m.striped)
    k.add(archWall('z', s * SHOP_OUT + s * 0.3, -2.8, 2.8, 0, 7.5, 0.6, [{ at: 0, w: 3.2, h: 5.2 }]), m.striped)
    slab(Math.min(gx, s * SHOP_OUT), Math.max(gx, s * SHOP_OUT), -2.8, 2.8, 6)
  }
  // Dua kubbesi: octagonal drum and lead dome over the middle bay
  box(k, m.stone, -CW - 0.6, CW + 0.6, CORR_H - 0.4, CORR_H, -3.1, 3.1)
  slab(-CW - 0.6, CW + 0.6, -3.1, 3.1, CORR_H)
  drum(kDrum, m, 0, 0, CORR_H + 0.3, 1.4, 3.1)
  dome(kDome, m, 0, 0, CORR_H + 1.7, 3.2, 2.9)
  // North and south portals with pointed openings; a fountain beside each, at the north-west and south-east corners (pp. 102, 110)
  for (const s of [-1, 1]) {
    const z = s * (HALF + 0.6)
    k.add(archWall('x', z, -5, 5, 0, 10, 1.2, [{ at: 0, w: 4, h: 7 }]), m.stone)
    k.add(archWall('x', z + s * 0.75, -3, 3, 0, 8.6, 0.3, [{ at: 0, w: 4, h: 7 }]), m.striped)
    box(k, m.roof, -5.2, 5.2, 10, 10.4, z - 0.8, z + 0.8)
    const fx = s < 0 ? -6.2 : 6.2
    box(k, m.stone, fx - 1.2, fx + 1.2, 0, 3.4, z - 0.6, z + 0.6)
    k.add(panelG(s < 0 ? 'z-' : 'z+', z + s * 0.61, fx, 1.6, 1.4, 2.4, true), m.dark)
    box(k, m.stone, fx - 0.9, fx + 0.9, 0, 0.6, z + s * 0.6, z + s * 1.4)
    box(k, m.water, fx - 0.75, fx + 0.75, 0.6, 0.62, z + s * 0.65, z + s * 1.3)
  }
}

/** Han: courtyard with porticoes of 9 (north), 9 (south) and 12 (east) bays, rooms behind; tabhanes to the west; imaret to the south. */
function han(k: Bucket, m: SM, box: BoxFn, slab: SlabFn) {
  const P = 3.6, X0 = 19, X1 = X0 + 9 * P, ZC = 6 * P // courtyard x 19..51.4, east portico spans z ±21.6
  const ROOM = 5, DEPTH = 4, ROOM_H = 6, POR_H = 4.6
  // Rooms behind the porticoes, each opening to the portico with a door and a window (p. 104)
  for (const s of [-1, 1]) {
    const zIn = s * ZC, zOut = s * (ZC + ROOM)
    box(k, m.stone, SHOP_OUT, X1 + DEPTH + ROOM, 0, ROOM_H, Math.min(zIn, zOut), Math.max(zIn, zOut))
    slab(SHOP_OUT, X1 + DEPTH + ROOM, Math.min(zIn, zOut), Math.max(zIn, zOut), ROOM_H)
    for (let i = 0; i < 9; i++) {
      const x = X0 + (i + 0.5) * P
      k.add(panelG(s < 0 ? 'z+' : 'z-', zIn - s * 0.01, x - 0.7, 1.1, 1, 2.2), m.wood)
      k.add(panelG(s < 0 ? 'z+' : 'z-', zIn - s * 0.01, x + 0.8, 1.6, 0.8, 1), m.dark)
    }
    // North / south portico: 9 pointed arches
    const zA = s * (ZC - DEPTH)
    k.add(archWall('x', zA, X0, X1, 0, POR_H, 0.7, Array.from({ length: 9 }, (_, i) => ({ at: X0 + (i + 0.5) * P, w: 2.7, h: 3.6 }))), m.stone)
    slab(X0, X1 + DEPTH, Math.min(zA, zIn), Math.max(zA, zIn), POR_H)
  }
  box(k, m.stone, X1 + DEPTH, X1 + DEPTH + ROOM, 0, ROOM_H, -ZC, ZC)
  slab(X1 + DEPTH, X1 + DEPTH + ROOM, -ZC, ZC, ROOM_H)
  for (let j = 0; j < 12; j++) {
    const z = -ZC + (j + 0.5) * P
    k.add(panelG('x-', X1 + DEPTH - 0.01, z - 0.7, 1.1, 1, 2.2), m.wood)
    k.add(panelG('x-', X1 + DEPTH - 0.01, z + 0.8, 1.6, 0.8, 1), m.dark)
  }
  // East portico: 12 arches
  k.add(archWall('z', X1, -ZC, ZC, 0, POR_H, 0.7, Array.from({ length: 12 }, (_, j) => ({ at: -ZC + (j + 0.5) * P, w: 2.7, h: 3.6 }))), m.stone)
  slab(X1, X1 + DEPTH, -ZC + DEPTH, ZC - DEPTH, POR_H)
  // Courtyard paving
  box(k, m.paving, X0, X1, 0.05, 0.08, -ZC + DEPTH, ZC - DEPTH)

  // Tabhanes: two on each side of the entrance passage, each with its own small courtyard (p. 106)
  const T0 = SHOP_OUT, T1 = X0
  box(k, m.stone, T0, T1, 0, 5, -1.8, -1.6)
  box(k, m.stone, T0, T1, 0, 5, 1.6, 1.8)
  slab(T0, T1, -1.8, 1.8, 5)
  for (const s of [-1, 1]) for (const u of [0, 1]) {
    const za = s * (1.8 + u * 9.9), zb = s * (1.8 + (u + 1) * 9.9)
    const z0 = Math.min(za, zb), z1 = Math.max(za, zb)
    box(k, m.stone, T0, T0 + 5, 0, 5, z0, z1) // rooms
    slab(T0, T0 + 5, z0, z1, 5)
    box(k, m.stone, T0 + 5, T1, 0, 3.4, z0, z0 + 0.6) // courtyard walls
    box(k, m.stone, T0 + 5, T1, 0, 3.4, z1 - 0.6, z1)
    box(k, m.stone, T1 - 0.6, T1, 0, 5, z0, z1)
    box(k, m.stone, T0 + 5, T0 + 7, 0, 3.6, z0 + 0.6, z1 - 0.6) // small portico
    slab(T0 + 5, T0 + 7, z0 + 0.6, z1 - 0.6, 3.6)
    box(k, m.stone, T0 + 9, T0 + 10.2, 0.05, 0.5, (z0 + z1) / 2 - 0.6, (z0 + z1) / 2 + 0.6) // water basin
    box(k, m.water, T0 + 9.1, T0 + 10.1, 0.5, 0.52, (z0 + z1) / 2 - 0.5, (z0 + z1) / 2 + 0.5)
  }

  // Imaret south of the han courtyard: walled court, kitchen-bakery block in the middle and rooms along the south (p. 108)
  const I0 = ZC + ROOM, I1 = I0 + 13, IX1 = X1 + DEPTH + ROOM
  box(k, m.stone, T0, IX1, 0, 4.2, I0, I0 + 0.6)
  box(k, m.stone, T0, T0 + 0.6, 0, 4.2, I0, I1)
  box(k, m.stone, IX1 - 0.6, IX1, 0, 4.2, I0, I1)
  box(k, m.stone, T0, IX1, 0, 5.2, I1 - 5, I1)
  slab(T0, IX1, I1 - 5, I1, 5.2)
  box(k, m.stone, 28, 46, 0, 5.6, I0 + 2.4, I1 - 7.2)
  slab(28, 46, I0 + 2.4, I1 - 7.2, 5.6)
  for (const x of [31, 35, 39, 43]) box(k, m.stone, x - 0.4, x + 0.4, 5.9, 7, I0 + 3.4, I0 + 4.2) // chimneys of kitchen and oven
}

/** Hamam west of the northern half of the arasta and the sıbyan mektebi west of its warm room. */
function hamam(k: Bucket, kRoof: Bucket, kVault: Bucket, kDrum: Bucket, kDome: Bucket, m: SM, box: BoxFn, slab: SlabFn) {
  const X0 = -21, X1 = -SHOP_OUT
  // Soğukluk (south, high and wide dome), ılıklık, sıcaklık with a central dome, külhan to the north (p. 108)
  const rooms: { z0: number; z1: number; h: number; R: number }[] = [
    { z0: -16, z1: -4, h: 7.5, R: 5.4 },
    { z0: -24, z1: -16, h: 6, R: 3.4 },
    { z0: -33, z1: -24, h: 6, R: 3.4 },
  ]
  for (const r of rooms) {
    const cz = (r.z0 + r.z1) / 2, cx = (X0 + X1) / 2
    box(k, m.stone, X0, X1, 0, r.h, r.z0, r.z1)
    slab(X0, X1, r.z0, r.z1, r.h)
    drum(kDrum, m, cx, cz, r.h + 0.35, 1.2, r.R + 0.2)
    dome(kDome, m, cx, cz, r.h + 1.55, r.R + 0.25, r.R * 0.85)
  }
  // Small domes of the private rooms around the hot room
  for (const [x, z] of [[X0 + 2.2, -31], [X1 - 2.2, -31], [X0 + 2.2, -26], [X1 - 2.2, -26]]) dome(kDome, m, x, z, 6.35, 1.4, 1.1, 14)
  box(k, m.stone, X0 + 3, X1 - 3, 0, 4, -37, -33)
  slab(X0 + 3, X1 - 3, -37, -33, 4)
  box(kRoof, m.stone, X1 - 6, X1 - 5, 4.35, 8, -36, -35) // furnace chimney
  // Portal with coloured stones opening to the arasta: drawn on the corridor face of the west shops (p. 108)
  k.add(panelG('x+', -CW + 0.02, -9.8, 2.4, 2, 4.4, true), m.striped)

  // Sıbyan mektebi: two square cross-vaulted rooms, a corridor, and a walled garden to the south (p. 110)
  const M0 = -31, M1 = X0
  box(k, m.stone, M0, M1, 0, 4.2, -24, -21)
  slab(M0, M1, -24, -21, 4.2)
  for (const x of [M0 + 2.5, M1 - 2.5]) {
    box(k, m.stone, x - 2.5, x + 2.5, 0, 4.2, -29, -24)
    vaultCover(kVault, m, x, -26.5, 4.2, 5, 5, 1)
  }
  box(k, m.stone, M0, M1, 0, 2.2, -12, -11.6)
  box(k, m.stone, M0, M0 + 0.4, 0, 2.2, -21, -11.6)
}

/** Mosque with its last-congregation portico, minaret and the hanikah courtyard to the north (pp. 112–118). */
function mosque(k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket, m: SM, box: BoxFn, slab: SlabFn) {
  const X0 = -40, X1 = -9, Z0 = 0, ZM = 26, ROOM = 4.5, POR = 3, H = 4.8
  const cx = (X0 + X1) / 2
  // Hanikah rooms on the east, west and north sides of the garden courtyard, behind porticoes
  const rows: [number, number, number, number][] = [
    [X0, X1, Z0, Z0 + ROOM], [X0, X0 + ROOM, Z0 + ROOM, ZM], [X1 - ROOM, X1, Z0 + ROOM, ZM],
  ]
  for (const [a, b, c, d] of rows) {
    box(k, m.stone, a, b, 0, H, c, d)
    slab(a, b, c, d, H)
  }
  // North entrance gap on the courtyard axis
  k.add(panelG('z-', Z0 - 0.01, cx, 1.5, 1.6, 3, true), m.dark)
  const iA = X0 + ROOM + POR, iB = X1 - ROOM - POR
  const bays = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => ({ at: a + (i + 0.5) * (b - a) / n, w: (b - a) / n * 0.7, h: 3 }))
  k.add(archWall('x', Z0 + ROOM + POR, iA - POR, iB + POR, 0, 3.8, 0.5, bays(iA - POR, iB + POR, 7)), m.stone)
  slab(iA - POR, iB + POR, Z0 + ROOM, Z0 + ROOM + POR, 3.8)
  for (const [x, s] of [[iA, -1], [iB, 1]] as const) {
    k.add(archWall('z', x, Z0 + ROOM + POR, ZM, 0, 3.8, 0.5, bays(Z0 + ROOM + POR, ZM, 6)), m.stone)
    slab(Math.min(x, x + s * POR), Math.max(x, x + s * POR), Z0 + ROOM + POR, ZM, 3.8)
  }
  // Şadırvan on the axis between the north entrance and the mosque door
  k.add(place(cylinderG(1.6, 1.7, 0.7, 8), cx, 0.35, 16), m.stone)
  k.add(place(cylinderG(1.4, 1.4, 0.04, 8), cx, 0.7, 16), m.water)
  k.add(place(cylinderG(0.25, 0.3, 1.4, 8), cx, 1.2, 16), m.stone)

  // Mosque: last-congregation portico, square hall, cross arms, polygonal drum with buttresses, lead dome
  const W = 17, mx0 = cx - W / 2, mx1 = cx + W / 2, P0 = ZM, P1 = ZM + 4, H0 = P1, H1 = P1 + W
  k.add(archWall('x', P0 + 0.3, mx0, mx1, 0, 5, 0.6, bays(mx0, mx1, 5).map((o) => ({ ...o, h: 4 }))), m.stone)
  slab(mx0, mx1, P0, P1, 5)
  k.add(panelG('z-', H0 - 0.01, cx, 1.6, 1.8, 3.2, true), m.wood)
  box(k, m.stone, mx0, mx1, 0, 8, H0, H1)
  slab(mx0, mx1, H0, H1, 8)
  const mz = (H0 + H1) / 2
  box(kRoof, m.stone, cx - 4, cx + 4, 8.35, 10.5, H0 + 0.3, H1 - 0.3)
  box(kRoof, m.stone, mx0 + 0.3, mx1 - 0.3, 8.35, 10.5, mz - 4, mz + 4)
  box(kRoof, m.roof, cx - 4.2, cx + 4.2, 10.5, 10.8, H0 + 0.1, H1 - 0.1)
  box(kRoof, m.roof, mx0 + 0.1, mx1 - 0.1, 10.5, 10.8, mz - 4.2, mz + 4.2)
  // Windows in two rows on the hall walls (p. 115)
  for (const y of [2.2, 5.6]) for (const t of [-5, 0, 5]) {
    k.add(panelG('x-', mx0 - 0.01, mz + t, y, 1, 1.6, y > 3), m.dark)
    k.add(panelG('x+', mx1 + 0.01, mz + t, y, 1, 1.6, y > 3), m.dark)
    if (t !== 0) k.add(panelG('z+', H1 + 0.01, cx + t, y, 1, 1.6, y > 3), m.dark)
  }
  // Mihrab block projecting on the qibla wall
  box(k, m.stone, cx - 1.6, cx + 1.6, 0, 6.5, H1, H1 + 1)
  drum(kDrum, m, cx, mz, 10.8, 2.6, 4.6)
  // Flying buttresses at the drum corners
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    const g = blockG(-0.35, 0.35, 0, 2.4, -0.6, 0.6)
    g.rotateY(-a + Math.PI / 2)
    kDrum.add(place(g, cx + Math.cos(a) * 5.2, 10.8, mz + Math.sin(a) * 5.2), m.stone)
  }
  dome(kDome, m, cx, mz, 13.4, 4.9, 4.3, 32)
  // Minaret at the north-west corner: square base, round shaft, open şerefe, lead cone
  const nx = mx0 - 1.5, nz = P0 + 1.5
  box(k, m.stone, nx - 1.4, nx + 1.4, 0, 9, nz - 1.4, nz + 1.4)
  k.add(place(cylinderG(1, 1.05, 14, 16), nx, 16, nz), m.stone)
  k.add(place(cylinderG(1.6, 1.1, 0.8, 16), nx, 23.4, nz), m.stone)
  k.add(place(cylinderG(0.85, 0.9, 3, 16), nx, 25.3, nz), m.stone)
  kDome.add(place(new THREE.ConeGeometry(1, 4.2, 16), nx, 28.9, nz), m.lead)
  kDome.add(place(cylinderG(0.05, 0.05, 1.2, 4), nx, 31.5, nz), m.gold)
}
