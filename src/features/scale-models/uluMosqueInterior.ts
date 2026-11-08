// Interior of the Ulu Camii model. The pier layout and the şadırvan's location are from the inventory; arch, dome interior, mihrab,
// minbar, şadırvan and chandelier forms are representative interpretations of archive photos.
// Calligraphy is not imitated: panels and ornaments carry only floral and geometric motifs.
import * as THREE from 'three'
import {
  WALL, H, DRUM_BASE, Bucket, FOUNTAIN_ROW, FOUNTAIN_COLUMN, LINE, COLUMN, YX, YZ,
  bayOpening, baySize, px, pz, 
} from './uluMosquePiece'
import { KAABA_SHOWCASE, COVER_SIDE_KIOSK } from './ulu-mosque/inner-wall'
import { DOOR_Z, KURSU, MAHFIL } from './uluMosqueDetail'
import { fountain } from './ulu-mosque/fountain'
import { WOOD_KURSU, MAHFIL_LOWER_RAILING, buildMinbar, balustrade } from './ulu-mosque/minbar'
import type { UluMosqueMaterials } from './uluMosqueTextures'
import { MIHRAB, CANDLESTICK, uluMosqueMihrab } from './ulu-mosque/mihrab'
import { setupArches, setupPiers } from './ulu-mosque/piers'
import { IN_DOME_R, addChandelier, addInnerDome } from './ulu-mosque/domes'

const FLOOR = 0.7
/** Top face of the interior flooring (the carpet): the carpet in uluMosqueModel is at y 0.65, thickness 0.1. */
export const FLOOR_Y = FLOOR

export interface InteriorStop { id: string; name: string; position: [number, number, number]; look: [number, number, number] }

const sx = px(FOUNTAIN_COLUMN + 0.5), sz = pz(FOUNTAIN_ROW + 0.5)
// The minbar leans against the east face of the western arch: the top of the kiosk isn't lost in the arch, the finial stays exposed (as in the photos).
const MIHRAB_Z = YZ - WALL, MINBAR_X = -5.4
const MINBAR_LEN = 7.2, MINBAR_W = 1.9, MINBAR_TOP = 4.7, MINBAR_Z0 = MIHRAB_Z - 1.05 - MINBAR_LEN
/** Minbar stair: the slope rising from the door sill to the front of the kiosk. */
const MINBAR_RAMP = { s0: 0.75, s1: 6.05, h1: 5.1 }
const MAHFIL_H = 3.8
const minbarH = (s: number) => ((s - MINBAR_RAMP.s0) / (MINBAR_RAMP.s1 - MINBAR_RAMP.s0)) * MINBAR_RAMP.h1
const BAY_Y = 2.7

export const interiorStops: InteriorStop[] = [
  { id: 'entrance', name: 'Giriş', position: [0, 2.7, -24.6], look: [0, 4.4, 10] },
  { id: 'fountain', name: 'Şadırvan', position: [3, 3.1, -13.6], look: [0, 1.4, -6.9] },
  { id: 'mihrab', name: 'Mihrap', position: [0, 2.8, 14.5], look: [0, 6.4, MIHRAB_Z] },
  { id: 'minbar', name: 'Minber', position: [0.4, 2.8, 16], look: [MINBAR_X, 5.6, 21] },
  { id: 'door', name: 'Doğu kapısı', position: [23.5, 2.7, DOOR_Z], look: [YX, 3.8, DOOR_Z] },
  { id: 'kaaba', name: 'Kâbe örtüsü', position: [26.5, 2.8, pz(0.5) + 2.2], look: [YX, 2.5, pz(0.5) + 2.2] },
  { id: 'plaque', name: 'Levha', position: [13.8, 2.8, 13], look: [13.8, 7, 24.5] },
  { id: 'dome', name: 'Kubbe', position: [-13.8, 2.4, 3.2], look: [-13.8, 21, 7.6] },
  // On top of structures: reachable on foot too; these stops are shortcuts.
  { id: 'minbar-top', name: 'Minbere çık', position: [MINBAR_X, BAY_Y + minbarH(4.6), MINBAR_Z0 + 4.6], look: [8, 4, 3] },
  { id: 'mahfil-top', name: 'Mahfile çık', position: [MAHFIL.x, BAY_Y + MAHFIL_H, MAHFIL.z], look: [0, 6.4, MIHRAB_Z] },
]

/** `top`: if the player is above this height the box doesn't block (e.g. a column under a platform). */
export interface Box { x0: number; x1: number; z0: number; z1: number; top?: number }
/** Walkable area: height changes from h0 to h1 along z. Unless `underPassable`, it behaves like a wall from below. */
export interface FloorArea { x0: number; x1: number; z0: number; z1: number; h0: number; h1: number; underPassable?: boolean }
export interface InteriorWalk { limit: Box & { /** Bounds of the circular base in world coordinates. */ circle?: { x: number; z: number; r: number } }; boxes: Box[]; circles: { x: number; z: number; r: number; top?: number }[]; floors: FloorArea[]; viewBlockers: Box[]; eyeY: number; /** Top face of the interior flooring; FLOOR_Y if not given. */ baseY?: number }

/** Structures collided with while walking inside (top-down). Piers also block the view. */
export function interiorWalkArea(): InteriorWalk {
  const box = (x: number, z: number, g: number, d: number): Box => ({ x0: x - g / 2, x1: x + g / 2, z0: z - d / 2, z1: z + d / 2 })
  const piers: Box[] = []
  for (let i = 1; i < COLUMN; i++) for (let j = 1; j < LINE; j++) piers.push(box(px(i), pz(j), 3.3, 3.3))
  const cabineted = piers.map((p) => ({ ...p, z0: p.z0 - 0.42, z1: p.z1 + 0.42 }))
  const railings: Box[] = []
  for (const s of [-1, 1]) for (const k of [-1, 1]) {
    railings.push(box(sx + s * 5.15, sz + k * 3, 0.2, 3.6))
    railings.push(box(sx + s * 2.95, sz + k * 5.15, 3.8, 0.2))
  }
  const mahfil: Box[] = []
  for (const a of [-3.1, -1.03, 1.03, 3.1]) for (const b of [-MAHFIL.wZ, MAHFIL.wZ]) mahfil.push({ ...box(MAHFIL.x + a, MAHFIL.z + b, 0.25, 0.25), top: 3 })
  const mx = MAHFIL.x, mz = MAHFIL.z, kx = KURSU.x, kz = KURSU.z, kr = KURSU.r
  const minbarBox = (x0: number, x1: number, z0: number, z1: number): Box => ({ x0: MINBAR_X + x0, x1: MINBAR_X + x1, z0: MINBAR_Z0 + z0, z1: MINBAR_Z0 + z1 })
  const MY = MINBAR_W / 2
  return {
    limit: { x0: -YX + WALL, x1: YX - WALL, z0: -YZ + WALL, z1: YZ - WALL },
    boxes: [
      ...cabineted, ...railings, ...mahfil, KAABA_SHOWCASE, COVER_SIDE_KIOSK,
      ...[[sx - 4.3, sz - 4.3], [sx + 4.3, sz - 4.3], [sx - 4.3, sz + 4.3], [sx + 4.3, sz + 4.3]].map(([x, z]) => box(x, z, 0.85, 0.55)),
      { x0: -MIHRAB.G / 2 - 0.05, x1: MIHRAB.G / 2 + 0.05, z0: MIHRAB_Z - MIHRAB.DER - 0.05, z1: MIHRAB_Z }, // mihrab
      // Minbar: side walls, door jamb and kiosk are obstacles; you walk up the stair between them.
      minbarBox(-MY - 0.07, -MY + 0.07, 0.7, MINBAR_LEN), minbarBox(MY - 0.07, MY + 0.07, 0.7, MINBAR_LEN),
      minbarBox(-MY - 0.1, -0.65, 0, 0.7), minbarBox(0.65, MY + 0.1, 0, 0.7),
      minbarBox(-MY, MY, 6.05, MIHRAB_Z - MINBAR_Z0), // the kiosk rests against the wall
      { x0: MINBAR_X + 1.6, x1: MINBAR_X + 1.8, z0: MIHRAB_Z - 9.4, z1: MIHRAB_Z }, // minbar railing
      box(WOOD_KURSU.x, WOOD_KURSU.z + 0.2, 1.8, 2.2), // wooden preaching kürsü
      // The mahfil's lower railing: doesn't block while walking on the platform
      ...MAHFIL_LOWER_RAILING.map(([a, b, c, d]) => ({ x0: MAHFIL.x + Math.min(a, c) - 0.08, x1: MAHFIL.x + Math.max(a, c) + 0.08, z0: MAHFIL.z + Math.min(b, d) - 0.08, z1: MAHFIL.z + Math.max(b, d) + 0.08, top: 3 })),
      // The west side of the front railing is open: since a pier faces the door, the minbar is approached from this side.
      { x0: MINBAR_X + 0.8, x1: MINBAR_X + 1.7, z0: MIHRAB_Z - 9.5, z1: MIHRAB_Z - 9.3 },
    ],
    circles: [{ x: sx, z: sz, r: 3.75 }, { x: kx, z: kz, r: kr + 0.05 }, ...[-1, 1].map((s) => ({ x: s * CANDLESTICK.x, z: MIHRAB_Z - CANDLESTICK.z, r: CANDLESTICK.r }))],
    floors: [
      // Mahfil: passable underneath, the stair rises from the northeast.
      { x0: mx - 3.35, x1: mx + 3.35, z0: mz - 2.35, z1: mz + 2.3, h0: MAHFIL_H, h1: MAHFIL_H, underPassable: true },
      { x0: mx + 2.05, x1: mx + 3.25, z0: mz - 6.8, z1: mz - 2.35, h0: 0, h1: 3.62 },
      // Minbar stair
      { x0: MINBAR_X - MY, x1: MINBAR_X + MY, z0: MINBAR_Z0 + MINBAR_RAMP.s0, z1: MINBAR_Z0 + MINBAR_RAMP.s1, h0: 0, h1: MINBAR_RAMP.h1 },
    ],
    viewBlockers: piers,
    eyeY: BAY_Y,
  }
}

/** Pendentive surface transitioning from the square bay to the circular drum (square base → circular mouth). */
function pendentiveG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, R: number) {
  const SEG = 64, ROW = 7
  const position: number[] = [], uv: number[] = [], index: number[] = []
  for (let s = 0; s <= ROW; s++) {
    const t = s / ROW, e = Math.pow(t, 0.72)
    for (let a = 0; a <= SEG; a++) {
      const theta = (a / SEG) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
      const far = Math.min(dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity, dz > 0 ? (z1 - cz) / dz : dz < 0 ? (z0 - cz) / dz : Infinity)
      const r = THREE.MathUtils.lerp(far, R, e)
      position.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / SEG, t)
    }
  }
  for (let s = 0; s < ROW; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    index.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

export function uluMosqueInterior(m: UluMosqueMaterials, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {

  // --- Piers and pointed arches: ulu-mosque/piers.ts ---
  setupPiers(m, k)
  setupArches(m, k)

  // --- Ceiling: pendentives, inner drum with light-admitting windows, painted inner dome, chandelier ---
  for (let i = 0; i < COLUMN; i++) for (let j = 0; j < LINE; j++) {
    const x = px(i + 0.5), z = pz(j + 0.5)
    const open = i === FOUNTAIN_COLUMN && j === FOUNTAIN_ROW
    const { drumH, domeH } = baySize(i)
    const { x0, x1, z0, z1 } = bayOpening(i, j)
    kRoof.add(pendentiveG(x, z, x0, x1, z0, z1, H - 0.05, DRUM_BASE, IN_DOME_R), m.pendentive)
    addInnerDome(m, kDrum, kDome, x, z, drumH, domeH, open, i, j)
    if (open) continue
    // The space in front of the mihrab and the Kaaba cover stays empty
    if ((i === 2 && j === LINE - 1) || (i === COLUMN - 1 && j === 0)) continue
    // Over the müezzin mahfil the ring hangs higher, otherwise it nearly touches the mahfil's railing (platform top 3.8 m).
    const overMahfil = Math.abs(x - MAHFIL.x) < MAHFIL.wX + 1 && Math.abs(z - MAHFIL.z) < MAHFIL.wZ + 2
    addChandelier(k, m, x, z, DRUM_BASE + drumH + domeH - 0.5, overMahfil ? 6.3 : 4.5)
  }

  // --- Mihrab: facade from an archive photo, relief tiers, muqarnas (ulu-mosque/mihrab.ts) ---
  uluMosqueMihrab(k, MIHRAB_Z, FLOOR, m)

  // --- Minbar and its low railing: ulu-mosque/minbar.ts ---
  buildMinbar(m, k, { x: MINBAR_X, z0: MINBAR_Z0, length: MINBAR_LEN, width: MINBAR_W, apex: MINBAR_TOP, wallZ: MIHRAB_Z, floor: FLOOR })
  balustrade(m, k, MINBAR_X + 1.7, MIHRAB_Z - 9.4, MINBAR_X + 1.7, MIHRAB_Z - 1, FLOOR)
  balustrade(m, k, MINBAR_X + 0.8, MIHRAB_Z - 9.4, MINBAR_X + 1.7, MIHRAB_Z - 9.4, FLOOR)

  // --- Şadırvan: carpet and marble paving in ulu-mosque/floor.ts; pool, jet and surroundings in ulu-mosque/fountain.ts ---
  fountain(m, k, { sx, sz, floor: FLOOR, skyY: DRUM_BASE + baySize(FOUNTAIN_COLUMN).drumH + 3.6 })
}
