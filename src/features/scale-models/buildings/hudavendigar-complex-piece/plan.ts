// Hudâvendigâr Mosque plan dimensions. Room dimensions from the inventory (pp. 84, 88, 89, 92, 93); layout proportioned from the published
// plan drawing (Goodwin / Kuran). Wall thicknesses and heights are representative.
// Units in meters. North = -z, qibla (south) = +z, east = +x.
import type { InteriorStop, InteriorWalk, Box, FloorArea } from '../../uluMosqueInterior'

export interface Upright { x0: number; x1: number; z0: number; z1: number }
export const upright = (x0: number, x1: number, z0: number, z1: number): Upright => ({ x0, x1, z0, z1 })
const avg = (e: number, z0: number, z1: number) => upright(-e, e, z0, z1)
const two = (x0: number, x1: number, z0: number, z1: number) => [upright(x0, x1, z0, z1), upright(-x1, -x0, z0, z1)]

// --- Vertical dimensions ---
export const BASE = 1 // floor of the şadırvan hall
export const MADRASA_Y = 7.8 // upper floor slab: 38 steps x ~0.18 m
export const EAVE_Y = 14
export const BAY_Y = BASE + 1.75
export const HALL_H = 1 // height difference of the prayer hall floor from the şadırvan hall
export const IWAN_H = 0.25
export const SOFA_H = 0.5 // side platforms (sofa) of the late-comers' portico
export const PORTICO_H = MADRASA_Y - BASE

// --- Exterior mass ---
export const HALF_X = 15.1 // half width of the front mass; inner length of the portico 28.65 m
export const FRONT_Z = -24 // north facade
export const PORTICO_Z = -22.5, PORTICO_BACK = -18.9 // portico depth 3.6 m
export const BACK_X = 7.75, BODY_Z = 9.9, BACK_Z = 21.2 // prayer hall mass
export const APSE_Z = 24.7, APSE_X = 4.4

// --- Facade bays: six supports, five bays ---
export const LEG_G = 2.1, TIP_LEG = 1.6, OPENING = 3.72, SECTION = 5.82
export const SECTIONS = [-2, -1, 0, 1, 2].map((i) => i * SECTION)
export const LEGS = [-1.5, -0.5, 0.5, 1.5].map((i) => i * SECTION)

// --- Rooms ---
export const SAD = avg(5.5, -6.9, 5.77) // 11.00 x 12.67 m
export const SAD_Z = (SAD.z0 + SAD.z1) / 2
export const HALL = avg(4.75, 5.77, 18.4) // 9.50 x 12.50 m (including steps)
export const NICHE = avg(2.11, 18.4, 20.9) // 4.22 x 2.50 m
export const YESIK = { z0: -3.2, z1: 2.09, x0: 5.5, x1: 13 } // iwan 5.29 x 7.49 m
export const ENTRY_HALL = avg(2.55, -16.9, -10.9)
export const CORRIDOR = avg(1.7, -10.9, -6.9)
export const DOOR = avg(1, PORTICO_BACK, -16.9)
export const STAIRS = { x0: 3.4, x1: 5.2, zTop: PORTICO_BACK, zBottom: -11.7, zLast: -10.9 }
export const STAIRS_DOOR = { x0: 2.55, x1: 3.4, z0: -12.3, z1: -10.9 }
export const STAIR_STEP = { x: 3, z0: 5.77, z1: 7.2 } // prayer hall steps
export const MAHFIL = { x0: -12.9, x1: -8.1, z0: -0.4, z1: 2, h: 1.7, stairX0: -9.1, stairX1: -8.1, stairZ0: -3.1 }
export const MINBAR = { x: -3.2, en: 1.5, z0: 11.6, z1: 16.6, h1: 3.3, zLast: 18.4 }

/** Walkable ground-floor areas; everything outside them is wall. */
const walkAreas: Upright[] = [
  avg(14.3, -23, PORTICO_BACK), DOOR, ENTRY_HALL, CORRIDOR, SAD, HALL, avg(2.11, 18.4, 19.6),
  ...two(YESIK.x0, YESIK.x1, YESIK.z0, YESIK.z1),
  ...two(STAIRS_DOOR.x0, STAIRS_DOOR.x1, STAIRS_DOOR.z0, STAIRS_DOOR.z1),
  ...two(STAIRS.x0, STAIRS.x1, STAIRS.zTop, STAIRS.zLast),
]

/** Closed-door tabhane rooms: shown as spaces only in the "Parçala" view, cannot be entered. */
const rooms: Upright[] = [
  ...two(7.2, 13, 3.5, 7.5), // south: teaching rooms
  ...two(7.2, 13, -10.7, -4.4), // north: zaviye compartments
  ...two(6.3, 13, -16.7, -12.3),
]

/** Gaps in the ground-floor wall mass computation. */
export const lowerGaps: Upright[] = [
  DOOR, ENTRY_HALL, CORRIDOR, SAD, HALL, NICHE,
  ...two(YESIK.x0, YESIK.x1, YESIK.z0, YESIK.z1),
  ...two(STAIRS_DOOR.x0, STAIRS_DOOR.x1, STAIRS_DOOR.z0, STAIRS_DOOR.z1),
  ...two(STAIRS.x0, STAIRS.x1, STAIRS.zTop, STAIRS.zLast),
  ...rooms,
]

/** Madrasa floor: n-shaped corridor (3.5 m), six cells on each side, large rooms at the front, narrow passage around the prayer hall. */
const cells: Upright[] = []
for (let i = 0; i < 6; i++) {
  const z = -11 + i * 3
  cells.push(...two(11, 14.3, z, z + 2.4), ...two(10.3, 11, z + 0.75, z + 1.65))
}
export const upperGaps: Upright[] = [
  SAD, HALL,
  ...two(STAIRS.x0, STAIRS.x1, PORTICO_BACK, -15),
  avg(2.55, -17.4, -12.4), avg(1, -12.4, -11.9),
  avg(10.3, -11.9, -8.4), // north arm of the n
  ...two(6.8, 10.3, -11.9, 9.4), // side arms
  ...cells,
  ...two(5.9, 6.9, 9.4, 19.8), avg(6.9, 19.3, 20.1), // 80 cm passage around the prayer hall
  ...two(6, 8, -17.8, -12.6), ...two(8, 14.3, -17.8, -15.4), ...two(8, 14.3, -15, -12.6), ...two(7, 8, -12.6, -11.9),
]

/** Floor gaps: domed hall, vaulted prayer hall, stairs. */
export const pavingGaps: Upright[] = [SAD, HALL, ...two(STAIRS.x0, STAIRS.x1, PORTICO_BACK, -13.5)]

/** Complement of the gaps: split into rectangular masses, neighbors merged. */
export function complement(area: Upright, gaps: Upright[]): Upright[] {
  const xs = [...new Set([area.x0, area.x1, ...gaps.flatMap((b) => [b.x0, b.x1]).filter((v) => v > area.x0 && v < area.x1)])].sort((a, b) => a - b)
  const zs = [...new Set([area.z0, area.z1, ...gaps.flatMap((b) => [b.z0, b.z1]).filter((v) => v > area.z0 && v < area.z1)])].sort((a, b) => a - b)
  const empty = (x: number, z: number) => gaps.some((b) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1)
  const result: Upright[] = []
  const open = new Map<string, Upright>()
  for (let j = 0; j < zs.length - 1; j++) {
    const fresh = new Map<string, Upright>()
    let i = 0
    while (i < xs.length - 1) {
      if (empty((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) { i++; continue }
      let s = i + 1
      while (s < xs.length - 1 && !empty((xs[s] + xs[s + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) s++
      const k = `${xs[i]}:${xs[s]}`
      const previous = open.get(k)
      if (previous) { previous.z1 = zs[j + 1]; fresh.set(k, previous); open.delete(k) }
      else fresh.set(k, upright(xs[i], xs[s], zs[j], zs[j + 1]))
      i = s
    }
    result.push(...open.values())
    open.clear()
    for (const [k, v] of fresh) open.set(k, v)
  }
  result.push(...open.values())
  return result
}

export const lowerMasses = () => [
  ...complement(upright(-HALF_X, HALF_X, PORTICO_BACK, BODY_Z), lowerGaps),
  ...complement(upright(-BACK_X, BACK_X, BODY_Z, BACK_Z), lowerGaps),
]
export const upperMasses = () => [
  ...complement(upright(-HALF_X, HALF_X, PORTICO_BACK, BODY_Z), upperGaps),
  ...complement(upright(-BACK_X, BACK_X, BODY_Z, BACK_Z), upperGaps),
]
export const pavings = () => [
  ...complement(upright(-HALF_X, HALF_X, PORTICO_BACK, BODY_Z), pavingGaps),
  ...complement(upright(-BACK_X, BACK_X, BODY_Z, BACK_Z), pavingGaps),
]

export function walkArea(): InteriorWalk {
  const limit: Box = { x0: -14.3, x1: 14.3, z0: -23, z1: 19.6 }
  const walls: Box[] = complement(limit, walkAreas)
  const legs: Box[] = LEGS.map((x) => upright(x - LEG_G / 2, x + LEG_G / 2, -23, PORTICO_Z))
  const obstacles: Box[] = [
    ...legs,
    upright(-14.3, -13.5, -23, PORTICO_Z), upright(13.5, 14.3, -23, PORTICO_Z),
    // Marble railing and shoe rack beside the steps
    upright(STAIR_STEP.x, 4.75, STAIR_STEP.z0, 7.25), upright(-4.75, -STAIR_STEP.x, STAIR_STEP.z0, 7.25),
    // Cupboards
    upright(3.35, 4.75, 7.25, 8.2), upright(-4.75, -3.35, 7.25, 8.2),
    // Minbar: kiosk and door frame; pulpit (kürsü)
    upright(MINBAR.x - MINBAR.en / 2 - 0.1, MINBAR.x + MINBAR.en / 2 + 0.1, MINBAR.z1, MINBAR.zLast),
    upright(MINBAR.x - MINBAR.en / 2 - 0.1, MINBAR.x - MINBAR.en / 2 + 0.03, MINBAR.z0 - 0.5, MINBAR.z0),
    upright(MINBAR.x + MINBAR.en / 2 - 0.03, MINBAR.x + MINBAR.en / 2 + 0.1, MINBAR.z0 - 0.5, MINBAR.z0),
    upright(2.6, 3.8, 15.2, 16.4),
  ]
  const floors: FloorArea[] = [
    { x0: -STAIR_STEP.x, x1: STAIR_STEP.x, z0: STAIR_STEP.z0, z1: STAIR_STEP.z1, h0: 0, h1: HALL_H },
    { x0: -4.75, x1: 4.75, z0: STAIR_STEP.z1, z1: 19.6, h0: HALL_H, h1: HALL_H },
    { x0: YESIK.x0, x1: YESIK.x1, z0: YESIK.z0, z1: YESIK.z1, h0: IWAN_H, h1: IWAN_H },
    { x0: -YESIK.x1, x1: -YESIK.x0, z0: YESIK.z0, z1: YESIK.z1, h0: IWAN_H, h1: IWAN_H },
    // Side platforms (sofa) of the late-comers' portico
    { x0: 2.91, x1: 14.3, z0: -23, z1: PORTICO_BACK, h0: SOFA_H, h1: SOFA_H },
    { x0: -14.3, x1: -2.91, z0: -23, z1: PORTICO_BACK, h0: SOFA_H, h1: SOFA_H },
    // Madrasa portico: passable underneath
    { x0: -14.3, x1: 14.3, z0: -23, z1: PORTICO_BACK, h0: PORTICO_H, h1: PORTICO_H, underPassable: true },
    // Stairs within the wall thickness: rise from south to north
    { x0: STAIRS.x0, x1: STAIRS.x1, z0: STAIRS.zTop, z1: STAIRS.zBottom, h0: PORTICO_H, h1: 0 },
    { x0: -STAIRS.x1, x1: -STAIRS.x0, z0: STAIRS.zTop, z1: STAIRS.zBottom, h0: PORTICO_H, h1: 0 },
    // Muezzin's gallery
    { x0: MAHFIL.stairX0, x1: MAHFIL.stairX1, z0: MAHFIL.stairZ0, z1: MAHFIL.z0, h0: IWAN_H, h1: MAHFIL.h },
    { x0: MAHFIL.x0, x1: MAHFIL.x1, z0: MAHFIL.z0, z1: MAHFIL.z1, h0: MAHFIL.h, h1: MAHFIL.h },
    // Minbar stairs
    { x0: MINBAR.x - MINBAR.en / 2, x1: MINBAR.x + MINBAR.en / 2, z0: MINBAR.z0, z1: MINBAR.z1, h0: HALL_H, h1: MINBAR.h1 },
  ]
  return {
    limit, boxes: [...walls, ...obstacles],
    circles: [{ x: 0, z: SAD_Z, r: 1.75 }],
    floors, viewBlockers: walls, eyeY: BAY_Y, baseY: BASE,
  }
}

const minbarH = (z: number) => HALL_H + (MINBAR.h1 - HALL_H) * ((z - MINBAR.z0) / (MINBAR.z1 - MINBAR.z0))
export const stops: InteriorStop[] = [
  { id: 'portico', ad: 'Son cemaat yeri', position: [0, BAY_Y, -21.2], look: [11, 3.4, -20.8] },
  { id: 'entrance', ad: 'Giriş', position: [0, BAY_Y, -14], look: [0, 3.2, 8] },
  { id: 'fountain', ad: 'Şadırvan', position: [3.4, BAY_Y, -5], look: [0, 1.8, SAD_Z] },
  { id: 'dome', ad: 'Kubbe', position: [-2.6, BAY_Y, SAD_Z - 2], look: [0, 16, SAD_Z] },
  { id: 'iwan', ad: 'Doğu eyvanı', position: [7, BAY_Y + IWAN_H, -2.1], look: [12, 3.6, 1.6] },
  { id: 'hall', ad: 'Harim', position: [0, BAY_Y + HALL_H, 8.6], look: [0, 5.6, 20] },
  { id: 'mihrab', ad: 'Mihrap', position: [0, BAY_Y + HALL_H, 15], look: [0, 5.4, 20.5] },
  { id: 'mahfil-top', ad: 'Mahfile çık', position: [-10.4, BAY_Y + MAHFIL.h, 0.9], look: [0, 4.4, 0] },
  { id: 'minbar-top', ad: 'Minbere çık', position: [MINBAR.x, BAY_Y + minbarH(15.4), 15.4], look: [3, 4.6, 8] },
  { id: 'madrasa', ad: 'Medrese revağı', position: [0, BAY_Y + PORTICO_H, -20.3], look: [-13, 9.6, -23.8] },
]
