// Interior of the Mevlâna Complex main block: Huzur-ı Pîr hall with the türbe bay, the semahane and the mescit.
// Sourced (Vakıf Eserleri Envanteri – Konya, Cilt 1): the türbe is a domed baldachin on four piers (p. 32); Kanuni's two-tier
// marble sanduka over Mevlâna and Sultan Veled, the earlier walnut kündekâri sanduka placed on his father's grave (p. 36); the
// silver cage on the sanduka's north side (p. 37); the semahane square under a 12 m dome, with the raised mutrip on the north,
// men's mahfil beside and east of it, the women's mahfil above with a wooden cage front, the wooden Naat Kürsüsü on the south
// (p. 38); the mescit floor two steps up, the grey marble mihrab, the Çerağ Kapısı on the west, passages to the semahane and the
// Huzur-ı Pîr, the naat kürsüsü beside the Çerağ Kapısı and the müezzin mahfili on the north (p. 41).
// Representative: door positions and sizes, pier and gallery dimensions, inner dome heights and their painted pattern, the
// number and position of the other sandukas in the Huzur-ı Pîr (seen in the photo on p. 36), the walnut sanduka's position.
import * as THREE from 'three'
import type { Bucket, Mat } from '../../uluMosquePiece'
import { rotateG } from '../../uluMosquePiece'
import type { Box, FloorArea, InteriorStop } from '../../uluMosqueInterior'
import type { MM } from './materials'

export const FLOOR = 0.08 // top of the hall and semahane floors
export const MESCIT_FLOOR = 0.36 // "zemini yerden iki basamak yükseltilmiştir" (p. 41)
export const HALL = { x0: 1.5, x1: 27, z0: -5.5, z1: 6.5, ceil: 6.2 }
export const MESCIT = { x0: 1.5, x1: 13.5, z0: -19, z1: -6.5, ceil: 8.4, cx: 7.5, cz: -12.75 }
export const SEMA = { x0: 14.5, x1: 27, z0: -19, z1: -6.5, ceil: 8, cx: 20.75, cz: -12.75 }
export const TURBE = { x: 17.44, z: 3.5 }
const PIER_X = [7.875, 14.25, 20.625], PIER_Z = 0.5
const BAY_X = [4.69, 11.06, 17.44, 23.81], BAY_Z = [-2.5, 3.5]

export interface Door { at: number; w: number; h: number }
/** Doors through the walls. */
export const DOORS = {
  hallWest: { at: 0.5, w: 2, h: 3.2 }, // from the courtyard (representative)
  cerag: { at: -12.75, w: 1.8, h: 3.3 }, // Çerağ Kapısı, mescit west (p. 41)
  mescitSema: { at: -12.75, w: 2, h: 3.2 }, // passage to the semahane (p. 41)
  mescitHall: { at: 11.5, w: 1.8, h: 3 }, // passage to the Huzur-ı Pîr (p. 41)
  semaHall: { at: 20.75, w: 2.4, h: 3.5 }, // semahane's south side faces the türbe (p. 38)
}

type BoxFn = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat, kv?: Bucket) => void

/** Wall or lining along `along`, from a0 to a1, thickness c0..c1, with door gaps and lintels. Returns the full-height pieces. */
export function pierced(B: BoxFn, along: 'x' | 'z', a0: number, a1: number, c0: number, c1: number, y0: number, y1: number, doors: Door[], mat: Mat): Box[] {
  const out: Box[] = []
  const box = (p0: number, p1: number, q0: number, q1: number) => {
    if (along === 'x') B(p0, p1, q0, q1, c0, c1, mat); else B(c0, c1, q0, q1, p0, p1, mat)
    if (q0 === y0) out.push(along === 'x' ? { x0: p0, x1: p1, z0: c0, z1: c1 } : { x0: c0, x1: c1, z0: p0, z1: p1 })
  }
  let a = a0
  for (const d of [...doors].sort((p, q) => p.at - q.at)) {
    const d0 = d.at - d.w / 2, d1 = d.at + d.w / 2
    if (d0 > a) box(a, d0, y0, y1)
    if (d.h < y1) box(d0, d1, d.h, y1)
    a = d1
  }
  if (a < a1) box(a, a1, y0, y1)
  return out
}

export function interior(m: MM, B: BoxFn, k: Bucket, kRoof: Bucket, solids: Box[]) {
  const u = m.u
  const add = (x0: number, x1: number, z0: number, z1: number) => solids.push({ x0, x1, z0, z1 })

  // ---------------------------------------------------------------- PLASTER LINING (inside faces, cut at the doors)
  const L0 = 0.02, L1 = 0.06
  const line = (along: 'x' | 'z', a0: number, a1: number, face: number, dir: 1 | -1, y0: number, y1: number, doors: Door[] = []) =>
    pierced(B, along, a0, a1, Math.min(face + dir * L0, face + dir * L1), Math.max(face + dir * L0, face + dir * L1), y0, y1, doors, m.plaster)
  const { hallWest, cerag, mescitSema, mescitHall, semaHall } = DOORS
  line('x', HALL.x0, HALL.x1, HALL.z0, 1, FLOOR, HALL.ceil, [mescitHall, semaHall])
  line('x', HALL.x0, HALL.x1, HALL.z1, -1, FLOOR, HALL.ceil)
  line('z', HALL.z0, HALL.z1, HALL.x0, 1, FLOOR, HALL.ceil, [hallWest])
  line('z', HALL.z0, HALL.z1, HALL.x1, -1, FLOOR, HALL.ceil)
  line('x', MESCIT.x0, MESCIT.x1, MESCIT.z0, 1, MESCIT_FLOOR, MESCIT.ceil)
  line('x', MESCIT.x0, MESCIT.x1, MESCIT.z1, -1, MESCIT_FLOOR, MESCIT.ceil, [mescitHall])
  line('z', MESCIT.z0, MESCIT.z1, MESCIT.x0, 1, MESCIT_FLOOR, MESCIT.ceil, [cerag])
  line('z', MESCIT.z0, MESCIT.z1, MESCIT.x1, -1, MESCIT_FLOOR, MESCIT.ceil, [mescitSema])
  line('x', SEMA.x0, SEMA.x1, SEMA.z0, 1, FLOOR, SEMA.ceil)
  line('x', SEMA.x0, SEMA.x1, SEMA.z1, -1, FLOOR, SEMA.ceil, [semaHall])
  line('z', SEMA.z0, SEMA.z1, SEMA.x0, 1, FLOOR, SEMA.ceil, [mescitSema])
  line('z', SEMA.z0, SEMA.z1, SEMA.x1, -1, FLOOR, SEMA.ceil)

  // ---------------------------------------------------------------- CEILINGS AND INNER DOMES (roof layer: "Parçala" lifts them with the roofs)
  const plate = (x0: number, x1: number, z0: number, z1: number, y: number, holes: [number, number, number][]) => {
    const s = new THREE.Shape([new THREE.Vector2(x0, -z0), new THREE.Vector2(x1, -z0), new THREE.Vector2(x1, -z1), new THREE.Vector2(x0, -z1)])
    for (const [cx, cz, r] of holes) { const h = new THREE.Path(); h.absarc(cx, -cz, r, 0, Math.PI * 2, true); s.holes.push(h) }
    const g = new THREE.ShapeGeometry(s, 32).rotateX(-Math.PI / 2).translate(0, y, 0)
    kRoof.add(g, m.plaster)
  }
  const innerDome = (cx: number, cz: number, y0: number, R: number, H: number) => {
    const p: [number, number][] = []
    for (let t = 0; t <= 14; t++) { const a = (t / 14) * Math.PI / 2; p.push([R * Math.cos(a), H * Math.sin(a)]) }
    const g = rotateG(p, 40, [1, 1]); g.translate(cx, y0, cz)
    kRoof.add(g, m.domeInner)
  }
  const TR = 2.95
  plate(HALL.x0, HALL.x1, HALL.z0, HALL.z1, HALL.ceil, BAY_X.flatMap((x) => BAY_Z.map((z): [number, number, number] => [x, z, x === TURBE.x && z === TURBE.z ? TR : 2.85])))
  for (const x of BAY_X) for (const z of BAY_Z) if (!(x === TURBE.x && z === TURBE.z)) innerDome(x, z, HALL.ceil, 2.85, 1.65)
  // Türbe: the tall inner dome rises through the opening in the hall roof into the hollow square base of the Kubbe-i Hadra.
  innerDome(TURBE.x, TURBE.z, HALL.ceil, TR, 3.95)
  plate(MESCIT.x0, MESCIT.x1, MESCIT.z0, MESCIT.z1, MESCIT.ceil, [[MESCIT.cx, MESCIT.cz, 5.8]])
  innerDome(MESCIT.cx, MESCIT.cz, MESCIT.ceil, 5.8, 2.45)
  plate(SEMA.x0, SEMA.x1, SEMA.z0, SEMA.z1, SEMA.ceil, [[SEMA.cx, SEMA.cz, 6]]) // 12 m dome (p. 38)
  innerDome(SEMA.cx, SEMA.cz, SEMA.ceil, 6, 3.85)

  // ---------------------------------------------------------------- HUZUR-I PÎR AND TÜRBE
  B(PIER_X[0] - 0.6, PIER_X[0] + 0.6, 0, HALL.ceil, PIER_Z - 0.6, PIER_Z + 0.6, m.plaster)
  // Four piers of the baldachin (p. 32); the two on the south are engaged in the south wall
  const P = 0.8
  for (const x of [PIER_X[1], PIER_X[2]]) {
    B(x - P, x + P, 0, HALL.ceil, PIER_Z - P, PIER_Z + P, m.plaster)
    B(x - P, x + P, 0, HALL.ceil, HALL.z1 - 0.7, HALL.z1, m.plaster)
    B(x - 0.4, x + 0.4, 5.3, HALL.ceil, PIER_Z + P, HALL.z1 - 0.7, u.archBand)
  }
  B(PIER_X[1] + P, PIER_X[2] - P, 5.3, HALL.ceil, PIER_Z - 0.4, PIER_Z + 0.4, u.archBand)
  // Kanuni's two-tier marble sanduka (p. 36)
  B(TURBE.x - 1.5, TURBE.x + 1.5, FLOOR, 0.7, TURBE.z - 0.8, TURBE.z + 0.8, u.marble)
  B(TURBE.x - 1.1, TURBE.x + 1.1, 0.7, 1.25, TURBE.z - 0.5, TURBE.z + 0.5, u.marble)
  B(TURBE.x - 1.12, TURBE.x + 1.12, 1.25, 1.3, TURBE.z - 0.52, TURBE.z + 0.52, m.cloth)
  add(TURBE.x - 1.5, TURBE.x + 1.5, TURBE.z - 0.8, TURBE.z + 0.8)
  // Tall walnut kündekâri sanduka (p. 36); position representative
  B(TURBE.x - 1.2, TURBE.x + 1.2, FLOOR, 1.9, 4.9, 5.7, u.kundekari)
  add(TURBE.x - 1.2, TURBE.x + 1.2, 4.9, 5.7)
  // Silver cage on the north side of the sanduka (p. 37): rails and a frame, form representative
  const CZ = TURBE.z - 1.35
  B(TURBE.x - 2, TURBE.x + 2, FLOOR, 0.25, CZ - 0.06, CZ + 0.06, m.silver)
  B(TURBE.x - 2, TURBE.x + 2, 1.85, 2.05, CZ - 0.06, CZ + 0.06, m.silver)
  for (let i = 0; i <= 20; i++) { const x = TURBE.x - 2 + i * 0.2; B(x - 0.025, x + 0.025, 0.25, 1.85, CZ - 0.025, CZ + 0.025, m.silver) }
  add(TURBE.x - 2, TURBE.x + 2, CZ - 0.06, CZ + 0.06)
  // Other sandukas in the Huzur-ı Pîr: seen in the photo on p. 36, number and position representative
  for (const x of [8.9, 10.1, 11.3, 12.5]) {
    const z0 = 4.2, z1 = 6.2
    B(x - 0.4, x + 0.4, FLOOR, 0.3, z0, z1, u.marble)
    B(x - 0.32, x + 0.32, 0.3, 0.95, z0 + 0.08, z1 - 0.08, m.cloth)
    B(x - 0.18, x + 0.18, 0.95, 1.3, z0 + 0.15, z0 + 0.5, u.marble)
    add(x - 0.4, x + 0.4, z0, z1)
  }

  // ---------------------------------------------------------------- SEMAHANE: mutrip, mahfils, Naat Kürsüsü (p. 38)
  const GY = 3.6, NZ = -17.7, EX = 25.75
  B(16, EX, FLOOR, 0.53, SEMA.z0 + L1, NZ, u.wood) // mutrip: raised platform on the north
  B(SEMA.x0 + L1, SEMA.x1 - L1, GY, GY + 0.2, SEMA.z0 + L1, NZ, u.wood) // upper (women's) mahfil, north
  B(EX, SEMA.x1 - L1, GY, GY + 0.2, NZ, SEMA.z1 - L1, u.wood) // men's mahfil east, women's above
  B(SEMA.x0 + L1, EX, GY + 0.2, GY + 1.3, NZ - 0.05, NZ, u.woodLattice) // wooden cage front
  B(EX, EX + 0.05, GY + 0.2, GY + 1.3, NZ, SEMA.z1 - L1, u.woodLattice)
  for (const x of [16.6, 19.2, 21.8, 24.4]) { B(x - 0.1, x + 0.1, FLOOR, GY, NZ - 0.2, NZ, m.railing) }
  for (const z of [-15.2, -12.4, -9.6]) { B(EX, EX + 0.2, FLOOR, GY, z - 0.1, z + 0.1, m.railing) }
  B(EX, EX + 0.2, FLOOR, GY, NZ - 0.2, NZ, m.railing)
  B(25.9, 26.8, FLOOR, 1.6, -8.4, -7.3, u.wood) // Naat Kürsüsü
  // Sema floor railing (photo p. 39)
  for (const [x0, x1, z0, z1] of [[16, 25.5, -17.6, -17.45], [16, 25.5, -8, -7.85], [16, 16.15, -17.6, -7.85], [25.35, 25.5, -17.6, -7.85]] as const) B(x0, x1, FLOOR, 1, z0, z1, m.railing)

  // ---------------------------------------------------------------- MESCİT: mihrab, naat kürsüsü, müezzin mahfili (p. 41)
  const MZ = MESCIT.z1 - L1 // inner face of the south wall
  B(6.3, 6.9, MESCIT_FLOOR, 4.3, MZ - 0.3, MZ, u.marbleDark)
  B(8.1, 8.7, MESCIT_FLOOR, 4.3, MZ - 0.3, MZ, u.marbleDark)
  B(6.3, 8.7, 3.4, 4.3, MZ - 0.3, MZ, u.marbleDark)
  B(6.9, 8.1, MESCIT_FLOOR, 3.4, MZ - 0.04, MZ, m.niche)
  k.add(new THREE.ConeGeometry(0.62, 0.9, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.3).translate(7.5, 3.4 + 0.45, MZ - 0.3), m.niche)
  B(1.6, 2.4, MESCIT_FLOOR, 1.7, -15.4, -14.6, u.wood) // naat kürsüsü beside the Çerağ Kapısı
  B(3, 12, 2.9, 3.1, MESCIT.z0 + L1, -17.2, u.wood) // müezzin mahfili
  B(3, 12, 3.1, 3.9, -17.25, -17.2, m.railing)
  for (const x of [3.2, 7.5, 11.8]) B(x - 0.1, x + 0.1, MESCIT_FLOOR, 2.9, -17.4, -17.2, m.railing)

  // ---------------------------------------------------------------- WALKING
  const floors: FloorArea[] = [
    { x0: MESCIT.x0, x1: MESCIT.x1, z0: MESCIT.z0, z1: MESCIT.z1, h0: MESCIT_FLOOR - FLOOR, h1: MESCIT_FLOOR - FLOOR },
    { x0: 16, x1: EX, z0: SEMA.z0, z1: NZ, h0: 0.53 - FLOOR, h1: 0.53 - FLOOR },
  ]
  const stops: InteriorStop[] = [
    { id: 'avlu', name: 'Avlu', position: [-3.5, FLOOR + 1.7, 0.5], look: [8, 3.4, 0.5] },
    { id: 'huzur', name: 'Huzur-ı Pîr', position: [3.6, FLOOR + 1.7, -2.5], look: [22, 3, 2.5] },
    { id: 'turbe', name: 'Türbe', position: [TURBE.x, FLOOR + 1.7, -3.6], look: [TURBE.x, 4.2, TURBE.z + 1] },
    { id: 'semahane', name: 'Semahane', position: [SEMA.cx, FLOOR + 1.7, -7.1], look: [SEMA.cx, 6.5, -16] },
    { id: 'mescit', name: 'Mescit', position: [MESCIT.cx, MESCIT_FLOOR + 1.7, -16.2], look: [MESCIT.cx, 2.6, MESCIT.z1] },
  ]
  return { floors, stops }
}
