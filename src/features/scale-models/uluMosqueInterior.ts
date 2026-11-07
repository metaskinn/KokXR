// Ulu Camii maketinin iç mekânı. Paye düzeni ve şadırvanın yeri envanterden; kemer, kubbe içi, mihrap,
// minber, şadırvan ve avize biçimleri arşiv fotoğraflarına bakılarak temsilî yorumlanmıştır.
// Hat yazısı taklit edilmez: panolar ve süslemeler yalnız bitkisel ve geometrik motif taşır.
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
/** İç döşemenin (halının) üst yüzü: ulucamiMaket'teki halı y 0.65, kalınlık 0.1. */
export const FLOOR_Y = FLOOR

export interface InteriorStop { id: string; ad: string; position: [number, number, number]; look: [number, number, number] }

const sx = px(FOUNTAIN_COLUMN + 0.5), sz = pz(FOUNTAIN_ROW + 0.5)
// Minber, batıdaki kemerin doğu yüzüne yaslanır: köşkün üstü kemerde kaybolmaz, alem açıkta kalır (fotoğraflardaki gibi).
const MIHRAB_Z = YZ - WALL, MINBAR_X = -5.4
const MINBAR_LEN = 7.2, MINBAR_W = 1.9, MINBAR_TOP = 4.7, MINBAR_Z0 = MIHRAB_Z - 1.05 - MINBAR_LEN
/** Minber merdiveni: kapı eşiğinden köşk önüne yükselen eğim. */
const MINBAR_RAMP = { s0: 0.75, s1: 6.05, h1: 5.1 }
const MAHFIL_H = 3.8
const minbarH = (s: number) => ((s - MINBAR_RAMP.s0) / (MINBAR_RAMP.s1 - MINBAR_RAMP.s0)) * MINBAR_RAMP.h1
const BAY_Y = 2.7

export const interiorStops: InteriorStop[] = [
  { id: 'entrance', ad: 'Giriş', position: [0, 2.7, -24.6], look: [0, 4.4, 10] },
  { id: 'fountain', ad: 'Şadırvan', position: [3, 3.1, -13.6], look: [0, 1.4, -6.9] },
  { id: 'mihrab', ad: 'Mihrap', position: [0, 2.8, 14.5], look: [0, 6.4, MIHRAB_Z] },
  { id: 'minbar', ad: 'Minber', position: [0.4, 2.8, 16], look: [MINBAR_X, 5.6, 21] },
  { id: 'door', ad: 'Doğu kapısı', position: [23.5, 2.7, DOOR_Z], look: [YX, 3.8, DOOR_Z] },
  { id: 'kaaba', ad: 'Kâbe örtüsü', position: [26.5, 2.8, pz(0.5) + 2.2], look: [YX, 2.5, pz(0.5) + 2.2] },
  { id: 'plaque', ad: 'Levha', position: [13.8, 2.8, 13], look: [13.8, 7, 24.5] },
  { id: 'dome', ad: 'Kubbe', position: [-13.8, 2.4, 3.2], look: [-13.8, 21, 7.6] },
  // Yapıların üstü: yürüyerek de çıkılır, bu duraklar kısa yoldur.
  { id: 'minbar-top', ad: 'Minbere çık', position: [MINBAR_X, BAY_Y + minbarH(4.6), MINBAR_Z0 + 4.6], look: [8, 4, 3] },
  { id: 'kursu-top', ad: 'Kürsüye çık', position: [KURSU.x - 0.1, BAY_Y + 2.2, KURSU.z], look: [-4, 5, 2] },
  { id: 'mahfil-top', ad: 'Mahfile çık', position: [MAHFIL.x, BAY_Y + MAHFIL_H, MAHFIL.z], look: [0, 6.4, MIHRAB_Z] },
]

/** `ust`: oyuncu bu yüksekliğin üstündeyse kutu engellemez (ör. platformun altındaki sütun). */
export interface Box { x0: number; x1: number; z0: number; z1: number; top?: number }
/** Üstünde yürünen alan: yükseklik z boyunca h0'dan h1'e değişir. `altGecilir` değilse aşağıdan duvar gibi davranır. */
export interface FloorArea { x0: number; x1: number; z0: number; z1: number; h0: number; h1: number; underPassable?: boolean }
export interface InteriorWalk { limit: Box & { /** Dairesel kaidenin dünya koordinatlarındaki sınırı. */ circle?: { x: number; z: number; r: number } }; boxes: Box[]; circles: { x: number; z: number; r: number; top?: number }[]; floors: FloorArea[]; viewBlockers: Box[]; eyeY: number; /** İç döşemenin üst yüzü; verilmezse ZEMIN_Y. */ baseY?: number }

/** İçeride yürürken çarpılan yapılar (kuşbakışı). Payeler bakışı da keser. */
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
      { x0: -MIHRAB.G / 2 - 0.05, x1: MIHRAB.G / 2 + 0.05, z0: MIHRAB_Z - MIHRAB.DER - 0.05, z1: MIHRAB_Z }, // mihrap
      // Minber: yan duvarlar, kapı sövesi ve köşk engeldir; aradaki merdivenden yürünür.
      minbarBox(-MY - 0.07, -MY + 0.07, 0.7, MINBAR_LEN), minbarBox(MY - 0.07, MY + 0.07, 0.7, MINBAR_LEN),
      minbarBox(-MY - 0.1, -0.65, 0, 0.7), minbarBox(0.65, MY + 0.1, 0, 0.7),
      minbarBox(-MY, MY, 6.05, MIHRAB_Z - MINBAR_Z0), // köşk duvara dayanır
      { x0: MINBAR_X + 1.6, x1: MINBAR_X + 1.8, z0: MIHRAB_Z - 9.4, z1: MIHRAB_Z }, // minber korkuluğu
      box(WOOD_KURSU.x, WOOD_KURSU.z + 0.2, 1.8, 2.2), // ahşap vaaz kürsüsü
      // Mahfilin alt korkuluğu: platformda yürürken engellemez
      ...MAHFIL_LOWER_RAILING.map(([a, b, c, d]) => ({ x0: MAHFIL.x + Math.min(a, c) - 0.08, x1: MAHFIL.x + Math.max(a, c) + 0.08, z0: MAHFIL.z + Math.min(b, d) - 0.08, z1: MAHFIL.z + Math.max(b, d) + 0.08, top: 3 })),
      // Ön korkuluğun batısı açıktır: kapının karşısı paye olduğu için minbere bu yandan gelinir.
      { x0: MINBAR_X + 0.8, x1: MINBAR_X + 1.7, z0: MIHRAB_Z - 9.5, z1: MIHRAB_Z - 9.3 },
    ],
    circles: [{ x: sx, z: sz, r: 3.75 }, { x: kx, z: kz, r: kr + 0.05, top: 1.2 }, ...[-1, 1].map((s) => ({ x: s * CANDLESTICK.x, z: MIHRAB_Z - CANDLESTICK.z, r: CANDLESTICK.r }))],
    floors: [
      // Mahfil: alttan geçilir, merdiven kuzeydoğudan çıkar.
      { x0: mx - 3.35, x1: mx + 3.35, z0: mz - 2.35, z1: mz + 2.3, h0: MAHFIL_H, h1: MAHFIL_H, underPassable: true },
      { x0: mx + 2.05, x1: mx + 3.25, z0: mz - 6.8, z1: mz - 2.35, h0: 0, h1: 3.62 },
      // Minber merdiveni
      { x0: MINBAR_X - MY, x1: MINBAR_X + MY, z0: MINBAR_Z0 + MINBAR_RAMP.s0, z1: MINBAR_Z0 + MINBAR_RAMP.s1, h0: 0, h1: MINBAR_RAMP.h1 },
      // Kürsü: basamaklar, giriş ve iç zemin
      { x0: kx - 0.42, x1: kx + 0.42, z0: kz - kr - 1.7, z1: kz - kr, h0: 0, h1: 2.1 },
      { x0: kx - 0.42, x1: kx + 0.42, z0: kz - kr, z1: kz - 0.7, h0: 2.2, h1: 2.2 },
      { x0: kx - 0.72, x1: kx + 0.72, z0: kz - 0.72, z1: kz + 0.72, h0: 2.2, h1: 2.2 },
    ],
    viewBlockers: piers,
    eyeY: BAY_Y,
  }
}

/** Kare gözden dairesel kasnağa geçen pandantif yüzey (kare taban → daire ağız). */
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

  // --- Payeler ve sivri kemerler: ulucami/payeler.ts ---
  setupPiers(m, k)
  setupArches(m, k)

  // --- Tavan: pandantif, iç kasnak ve ışık alan pencereler, boyalı iç kubbe, avize ---
  for (let i = 0; i < COLUMN; i++) for (let j = 0; j < LINE; j++) {
    const x = px(i + 0.5), z = pz(j + 0.5)
    const open = i === FOUNTAIN_COLUMN && j === FOUNTAIN_ROW
    const { drumH, domeH } = baySize(i)
    const { x0, x1, z0, z1 } = bayOpening(i, j)
    kRoof.add(pendentiveG(x, z, x0, x1, z0, z1, H - 0.05, DRUM_BASE, IN_DOME_R), m.pendentive)
    addInnerDome(m, kDrum, kDome, x, z, drumH, domeH, open, i, j)
    if (open) continue
    // Mihrabın ve Kâbe örtüsünün önü boş kalır
    if ((i === 2 && j === LINE - 1) || (i === COLUMN - 1 && j === 0)) continue
    addChandelier(k, m, x, z, DRUM_BASE + drumH + domeH - 0.5)
  }

  // --- Mihrap: arşiv fotoğrafından cephe, kabartma kademeleri, mukarnas (ulucami/mihrap.ts) ---
  uluMosqueMihrab(k, MIHRAB_Z, FLOOR, m)

  // --- Minber ve alçak korkuluğu: ulucami/minber.ts ---
  buildMinbar(m, k, { x: MINBAR_X, z0: MINBAR_Z0, length: MINBAR_LEN, en: MINBAR_W, apex: MINBAR_TOP, wallZ: MIHRAB_Z, floor: FLOOR })
  balustrade(m, k, MINBAR_X + 1.7, MIHRAB_Z - 9.4, MINBAR_X + 1.7, MIHRAB_Z - 1, FLOOR)
  balustrade(m, k, MINBAR_X + 0.8, MIHRAB_Z - 9.4, MINBAR_X + 1.7, MIHRAB_Z - 9.4, FLOOR)

  // --- Şadırvan: halı ve mermer döşeme ulucami/zemin.ts'te; havuz, fıskiye ve çevresi ulucami/sadirvan.ts'te ---
  fountain(m, k, { sx, sz, floor: FLOOR, skyY: DRUM_BASE + baySize(FOUNTAIN_COLUMN).drumH + 3.6 })
}
