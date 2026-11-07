// Orhan Bey Külliyesi temsilî maketi. Plan ölçüleri Vakıf Eserleri Envanteri'nden (Bursa 1, s. 191-204, 207-215):
// son cemaat yeri 25,80 × 6,30 m, harim orta mekânı 8,90 × 9,90 m, tabhaneler 6,05 × 9,10 m, mihraplı bölüm 9,64 × 8,83 m.
// Duvar, kubbe ve minare yükseklikleri ile yerleşim fotoğraflara bakılarak oranlanmıştır; gerçek 3B tarama değildir.
// Birim metre. Kuzey -z, kıble +z, doğu +x. Cami yerel koordinatta çizilir, YER ile kaideye yerleşir.
import * as THREE from 'three'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import type { InteriorStop, InteriorWalk, Box, FloorArea } from '../uluMosqueInterior'
import type { Model } from '../uluMosqueModel'
import { type Mat, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, place } from '../uluMosquePiece'
import { emirInn, orhanBath, surroundings } from './orhan-bey-complex-pieces/otherBuildings'
import { orhanMaterials } from './orhan-bey-complex-pieces/textures'
import {
  type Open, type Dir, LocalBucket, outerDrum, wall, transitionG, innerDome, archPlane, archStones, dentilEave, leadDome, orient,
} from './orhan-bey-complex-pieces/common'

const PLACE = { x: 38, z: 6 }

// Plan aksları: kaynaktaki iç ölçüler korunur, duvar ve paye kalınlıkları fotoğraftan oranlanmıştır.
const N0 = -17.2, N1 = -16.1, N2 = -9.8, R0 = -8.8, G1 = -4.8, C0 = -3.8, C1 = 6.1, M0 = 7.3, M1 = 16.13, S1 = 17.3, T0 = -3.2, T1 = 5.9, TS = 6.9
const CX = 4.45, PX = 5.35, TX = 11.4, BX = 12.4, NX = 12.9, MX = 4.82, MB = 6.1
const H = 9.5, NH = 8.6, BASE = 0.4, TABHANE = 0.5, MIHRAB = 0.8
const BAY_Y = BASE + 1.65
const MINBAR = { x0: -4.75, x1: -3.05, z0: 11, z1: 14.8, apex: 2.4 }

const dur = (id: string, ad: string, k: [number, number, number], b: [number, number, number]): InteriorStop =>
  ({ id, ad, position: [k[0] + PLACE.x, k[1], k[2] + PLACE.z], look: [b[0] + PLACE.x, b[1], b[2] + PLACE.z] })

const minbarSlope = (z: number) => MIHRAB + ((z - MINBAR.z0) / (MINBAR.z1 - MINBAR.z0)) * MINBAR.apex

const stops: InteriorStop[] = [
  dur('portico', 'Son cemaat yeri', [0, BAY_Y, -14.6], [0, 3.4, -9.8]),
  dur('entrance', 'Giriş holü', [0, BAY_Y, -6.9], [0, 3, 2]),
  dur('mid', 'Orta mekân', [0, BAY_Y, -1.6], [0, 6.2, 12]),
  dur('tabhane', 'Doğu tabhanesi', [7.6, BAY_Y + TABHANE, 1.3], [TX, 3.1, 1.3]),
  dur('dome', 'Kubbe', [0, BAY_Y, 1.2], [0, 16, 1.5]),
  dur('mihrab', 'Mihrap', [0, BAY_Y + MIHRAB, 9.4], [0, 4.2, M1]),
  dur('minbar', 'Minber', [-1.4, BAY_Y + MIHRAB, 9.2], [-3.9, 3.2, 13.5]),
  dur('minbar-top', 'Minbere çık', [-3.9, BAY_Y + minbarSlope(13.4), 13.4], [1.5, 4, 9]),
]

function walkArea(): InteriorWalk {
  const k = (x0: number, x1: number, z0: number, z1: number, top?: number): Box =>
    ({ x0: x0 + PLACE.x, x1: x1 + PLACE.x, z0: z0 + PLACE.z, z1: z1 + PLACE.z, top })
  const mirror = (x0: number, x1: number, z0: number, z1: number) => [k(x0, x1, z0, z1), k(-x1, -x0, z0, z1)]
  const boxes: Box[] = [
    // Son cemaat yerinin 90 cm yüksek, parmaklıklı yan sofaları
    ...mirror(2.2, TX, N1, N2),
    // Revakla hol arasındaki duvar; kapı ortada
    ...mirror(0.9, TX, N2, R0),
    // Hol yanındaki odalar ve kuzey kütlesi
    ...mirror(1.9, TX, R0, G1),
    ...mirror(1, TX, G1, C0),
    ...mirror(CX, TX, C0, T0),
    // Doğu-batı kemerlerinin ayakları
    ...mirror(CX, PX, T0, -2.4),
    ...mirror(CX, PX, 4.9, C1),
    // Tabhane güneyi ve mihraplı bölüm yan kütleleri
    ...mirror(PX, TX, T1, C1),
    ...mirror(3.9, TX, C1, M0),
    ...mirror(MX, TX, M0, M1),
    // Sakıflar
    ...mirror(1.25, CX, C0, -2.4),
    // Minber: yan korkuluklar ve köşk; aradaki merdivenden yürünür
    k(MINBAR.x0, MINBAR.x0 + 0.12, MINBAR.z0, M1), k(MINBAR.x1 - 0.12, MINBAR.x1, MINBAR.z0, M1),
    k(MINBAR.x0, MINBAR.x1, MINBAR.z1, M1),
    // Kürsü
    k(-MX, -3.75, 7.6, 9.2),
    // Mihrap ve şamdanlar
    k(-2, 2, M1 - 0.5, M1),
  ]
  const floors: FloorArea[] = [
    // Tabhaneler: birer basamakla çıkılır
    { x0: PLACE.x + PX - 0.3, x1: PLACE.x + TX, z0: PLACE.z - 2.4, z1: PLACE.z + T1, h0: TABHANE, h1: TABHANE },
    { x0: PLACE.x - TX, x1: PLACE.x - PX + 0.3, z0: PLACE.z - 2.4, z1: PLACE.z + T1, h0: TABHANE, h1: TABHANE },
    // Dört basamaklı mermer merdiven ve mihraplı bölüm
    { x0: PLACE.x - CX, x1: PLACE.x + CX, z0: PLACE.z + 4.9, z1: PLACE.z + C1, h0: 0, h1: MIHRAB },
    { x0: PLACE.x - MX, x1: PLACE.x + MX, z0: PLACE.z + C1, z1: PLACE.z + M1, h0: MIHRAB, h1: MIHRAB },
    // Minber merdiveni
    { x0: PLACE.x + MINBAR.x0 + 0.12, x1: PLACE.x + MINBAR.x1 - 0.12, z0: PLACE.z + MINBAR.z0, z1: PLACE.z + MINBAR.z1, h0: MIHRAB, h1: MIHRAB + MINBAR.apex },
  ]
  return {
    limit: { x0: PLACE.x - TX, x1: PLACE.x + TX, z0: PLACE.z + N1, z1: PLACE.z + M1 },
    boxes,
    circles: [],
    floors,
    viewBlockers: [k(1, TX, R0, C0), k(-TX, -1, R0, C0), k(CX, PX, T0, -2.4), k(CX, PX, 4.9, C1), k(-PX, -CX, T0, -2.4), k(-PX, -CX, 4.9, C1)],
    eyeY: BAY_Y,
    baseY: BASE,
  }
}

export const building = (): Model => {
  const u = uluMosqueMaterials()
  const o = orhanMaterials()
  // Kurşun bugünkü fotoğraflarda gri-mavidir; Ulu Camii dokusu daha açık tonda kalır.
  const domeMat = u.dome.clone(), leadMat = u.lead.clone()
  domeMat.color.set('#a4adb6'); leadMat.color.set('#a0a8ae')
  const k = new LocalBucket(), kRoof = new LocalBucket(), kDrum = new LocalBucket(), kDome = new LocalBucket()

  // --- Zemin ve komşu yapılar ---
  surroundings(k, u, o)
  emirInn(k, kRoof, u, o)
  orhanBath(k, kRoof, kDrum, kDome, u, o)
  for (const kv of [k, kRoof, kDrum, kDome]) { kv.x = PLACE.x; kv.z = PLACE.z }

  const box = (g: number, h: number, d: number, mat: Mat, x: number, y: number, z: number, kv = k) => kv.add(place(boxG(g, h, d), x, y, z), mat)

  // --- Oturtma ve döşemeler ---
  box(NX * 2 + 0.6, BASE, S1 - N0 + 0.6, u.marbleDark, 0, BASE / 2, (S1 + N0) / 2)
  const carpet = (x0: number, x1: number, z0: number, z1: number, y: number, inverse = false) => {
    const g = inverse ? boxG(z1 - z0, 0.04, x1 - x0).rotateY(Math.PI / 2) : boxG(x1 - x0, 0.04, z1 - z0)
    k.add(place(g, (x0 + x1) / 2, y - 0.02, (z0 + z1) / 2), o.carpet)
  }
  box(4.4, 0.02, N2 - N1, u.marblePaving, 0, BASE + 0.005, (N1 + N2) / 2)
  box(3.8, 0.02, G1 - R0, u.marblePaving, 0, BASE + 0.005, (R0 + G1) / 2)
  box(2, 0.02, 1, u.marblePaving, 0, BASE + 0.005, (R0 + N2) / 2)
  box(2, 0.02, 1, u.marblePaving, 0, BASE + 0.005, (G1 + C0) / 2)
  carpet(-CX, CX, C0, 4.9, BASE + 0.03)
  box(1.8, 0.02, 0.05, u.marblePaving, 0, BASE + 0.01, C0)
  for (const s of [-1, 1]) {
    // Tabhane sekisi: bir basamak yüksek, turkuaz halılı, ahşap kenarlı
    box(TX - PX + 1, TABHANE, T1 - T0, u.marbleDark, s * (TX + PX - 1) / 2, BASE + TABHANE / 2, (T0 + T1) / 2)
    carpet(s > 0 ? PX - 0.6 : -TX, s > 0 ? TX : -PX + 0.6, T0, T1, BASE + TABHANE + 0.03, true)
    box(0.08, 0.16, 7.3, u.wood, s * (PX - 0.6), BASE + TABHANE - 0.08, 1.25)
  }
  // Dört basamak ve mihrap döşemesi
  for (let i = 0; i < 4; i++) {
    const y = ((i + 1) / 4) * MIHRAB
    box(CX * 2, y, C1 - 4.9 - i * 0.3, u.innerMarble, 0, BASE + y / 2, C1 - (C1 - 4.9 - i * 0.3) / 2)
  }
  box(MX * 2, MIHRAB, M1 - C1, u.marbleDark, 0, BASE + MIHRAB / 2, (C1 + M1) / 2)
  carpet(-MX, MX, C1 + 0.02, M1, BASE + MIHRAB + 0.03)

  // --- Duvarlar ---
  const a = o.alternating
  const stoneArch = (dir: Dir, fixed: number, ac: Open, en = 0.34, exit = 0.1) => archStones(k, dir, fixed, ac, en, exit, u.marbleDark, u.brick, 9)
  /** Sivri kemerli silme: zeminden saçağa yükselir, içindeki pencereler taşıyıcı duvardadır. */
  const molding = (dir: Dir, fixed: number, p: number, g: number) => stoneArch(dir, fixed, { p, y0: 0.2, g, flat: H - 3.2, kh: 2.1 }, 0.2, 0.09)

  /** Pencere çifti: dış duvar + iç sıva boşluğu, dış ve iç düzlem. */
  const lowerWindow = (dir: Dir, fixed: number, p: number, y0: number, t: number, g = 1.05): Open => {
    const ac = { p, y0, g, flat: 1.25, kh: 0.72 }
    archPlane(k, dir, fixed, ac, 0.3, o.windowOuter)
    archPlane(k, dir, fixed, ac, t - 0.1, o.windowInner)
    return ac
  }
  const upperWindow = (dir: Dir, fixed: number, p: number, y0: number, t: number, g = 0.95): Open => {
    const ac = { p, y0, g, flat: 1.25, kh: 0.52 }
    archPlane(k, dir, fixed, ac, 0.3, o.latticeOuter)
    archPlane(k, dir, fixed, ac, t - 0.1, o.latticeInner)
    return ac
  }
  /** Yalnız dıştan görülen pencere: arkası dolu odaya bakar. */
  const closedWindow = (dir: Dir, fixed: number, p: number, y0: number, top: boolean) => {
    const ac = { p, y0, g: top ? 0.95 : 1.05, flat: 1.25, kh: top ? 0.52 : 0.72 }
    archPlane(k, dir, fixed, ac, -0.02, top ? o.latticeOuter : o.windowOuter)
    stoneArch(dir, fixed, { ...ac, g: ac.g + 0.12 }, 0.16, 0.05)
  }

  // Doğu ve batı beden duvarları: iki silme tabhaneye, biri kuzey odaya
  for (const [dir, s] of [['D', 1], ['B', -1]] as const) {
    const x = s * BX
    const pS = 1.35 + 2.3, pK = 1.35 - 2.3
    const ac: Open[] = [lowerWindow(dir, x, pS, BASE + 1.3, 1), lowerWindow(dir, x, pK, BASE + 1.3, 1), upperWindow(dir, x, 1.35, 4.8, 1)]
    wall(k, dir, x, R0, TS, 0, H, 1, a, ac)
    wall(k, dir, s * (TX + 0.02), T0, T1, BASE, H, 0.05, o.plaster, ac.map((b) => ({ ...b })))
    molding(dir, x, pS, 3.7)
    molding(dir, x, pK, 3.7)
    molding(dir, x, -6.1, 3.7)
    closedWindow(dir, x, -6.1, BASE + 1.3, false)
    closedWindow(dir, x, -6.1, 4.8, true)
    dentilEave(k, dir, x, R0, TS, H, u.brick, u.dark)

    // Tabhane güney duvarı
    const pT = s * (BX + MB) / 2
    const acT = [lowerWindow('G', TS, pT - 1.3, BASE + 1.3, 1), lowerWindow('G', TS, pT + 1.3, BASE + 1.3, 1)]
    wall(k, 'G', TS, Math.min(s * MB, s * BX), Math.max(s * MB, s * BX), 0, H, 1, a, acT)
    wall(k, 'G', T1 + 0.02, Math.min(s * PX, s * TX), Math.max(s * PX, s * TX), BASE, H, 0.05, o.plaster, acT)
    molding('G', TS, pT - 1.5, 2.9)
    molding('G', TS, pT + 1.5, 2.9)
    dentilEave(k, 'G', TS, Math.min(s * MB, s * BX), Math.max(s * MB, s * BX), H, u.brick, u.dark)

    // Kuzey kütlesi: yan odalar dıştan görünür, içi modellenmez. Holü ve tabhane kuzey yüzünü sıva kaplar.
    box(BX - 0.8 - PX, H - 0.05, T0 - R0, o.plaster, s * (BX - 0.8 + PX) / 2, (H - 0.05) / 2, (R0 + T0) / 2)
    box(PX - 1.9, H - 0.05, G1 - R0, o.plaster, s * (PX + 1.9) / 2, (H - 0.05) / 2, (R0 + G1) / 2)

    // Mihraplı bölüm yan duvarı: kaynakta altlı üstlü ikişer pencere
    const xM = s * MB, mp = [(M0 + M1) / 2 - 2.1, (M0 + M1) / 2 + 2.1]
    const acM = mp.flatMap((p) => [lowerWindow(dir, xM, p, BASE + MIHRAB + 0.45, 1.28), upperWindow(dir, xM, p, 4.75, 1.28)])
    wall(k, dir, xM, TS, S1, 0, H, 1.2, a, acM)
    wall(k, dir, s * (MX + 0.03), M0, M1, BASE + MIHRAB, H, 0.05, o.plaster, acM)
    for (const p of mp) molding(dir, xM, p, 3.5)
    dentilEave(k, dir, xM, TS, S1, H, u.brick, u.dark)

    // Doğu-batı kemerleri: orta mekânla tabhaneyi ayıran payeler
    const archOpen = { p: 1.25, y0: BASE, g: 7.3, flat: 4.2, kh: 2.8 }
    wall(k, dir, s * PX, C0, C1, 0, H, 0.9, o.plaster, [archOpen])
    for (const [z0, z1] of [[C0, -2.4], [4.9, C1]]) {
      k.add(place(boxG(PX - CX + 0.06, 4.1, z1 - z0 + 0.02), s * (PX + CX) / 2, BASE + 2.05, (z0 + z1) / 2), u.stone)
      box(PX - CX + 0.14, 0.18, z1 - z0 + 0.1, o.plaster, s * (PX + CX) / 2, BASE + 4.17, (z0 + z1) / 2)
    }
  }

  // Son cemaat yerinin ön yüzü ve mihrap duvarı; ortak yardımcı dışında kalanlar
  const SEFE = 4.8, OPENING = 3.84
  const frontAc: Open[] = [-2, -1, 0, 1, 2].map((n) => ({ p: n * SEFE, y0: 0, g: OPENING, flat: 3.6, kh: 2.5 }))
  wall(k, 'K', N0, -NX, NX, 0, NH, N1 - N0, a, frontAc)
  for (const ac of frontAc) stoneArch('K', N0, { ...ac, g: OPENING + 0.1 }, 0.46, 0.08)
  for (let n = -2; n <= 2; n++) if (n) {
    // Yan gözlerde alçak taş set ve demir parmaklık (fotoğrafa göre)
    box(OPENING, BASE + 0.9, 0.5, u.marbleDark, n * SEFE, (BASE + 0.9) / 2, N0 + 0.4)
    box(OPENING, 0.05, 0.05, o.iron, n * SEFE, BASE + 1.8, N0 + 0.4)
    for (let c = 0; c < 22; c++) box(0.03, 0.75, 0.03, o.iron, n * SEFE - OPENING / 2 + (c + 0.5) * (OPENING / 22), BASE + 1.4, N0 + 0.4)
  }
  // Ön ayaklar: kesme taş kaplama
  for (const x of [-12.2, -7.2, -2.4, 2.4, 7.2, 12.2]) {
    const g = Math.abs(x) > 12 ? 1.38 : 0.96
    box(g + 0.06, 3.6, 1.14, u.stone, x, 1.8, (N0 + N1) / 2)
    box(g + 0.22, 0.2, 1.3, u.marbleDark, x, 3.68, (N0 + N1) / 2)
  }
  dentilEave(k, 'K', N0, -NX, NX, NH, u.brick, u.dark)
  // Basamaklar
  for (let i = 0; i < 2; i++) box(OPENING + 0.6 - i * 0.2, 0.2, 1.2 - i * 0.4, u.marbleDark, 0, 0.1 + i * 0.2, N0 - 0.3 + i * 0.2)

  // Son cemaat yan yüzleri: devşirme başlıklı sütuna oturan ikiz sivri kemer
  for (const [dir, s] of [['D', 1], ['B', -1]] as const) {
    const x = s * NX, zm = (N0 + R0) / 2 + 0.3
    const twin: Open[] = [-1, 1].map((n) => ({ p: zm + n * 1.45, y0: BASE + 0.9, g: 2.55, flat: 2.3, kh: 1.65 }))
    wall(k, dir, x, N0, R0, 0, NH, 1, a, twin)
    for (const ac of twin) stoneArch(dir, x, ac, 0.26, 0.07)
    // Üstte büyük boşaltma kemeri ve dama dolgu
    const big = { p: zm, y0: 3.1, g: 6.5, flat: 0.2, kh: 3.45 }
    stoneArch(dir, x, big, 0.34, 0.09)
    const infill = new THREE.Shape()
    arch(infill, 0, big.y0 + 0.5, big.g - 0.45, 0.1, big.kh - 0.5)
    const dg = new THREE.ShapeGeometry(infill, 12).translate(0, 0, 0.012)
    const p = dg.attributes.position, uvd = dg.attributes.uv
    for (let i = 0; i < p.count; i++) uvd.setXY(i, p.getX(i) / 3 + 0.5, p.getY(i) / 3)
    k.add(orient(dg, dir, x, zm), o.checker)
    // Sütun
    const sx = x - s * 0.5
    k.add(place(cylinderG(0.2, 0.23, 2.5, 16), sx, BASE + 0.9 + 1.4, zm), u.marble)
    k.add(place(boxG(0.56, 0.3, 0.56), sx, BASE + 0.9 + 0.15, zm), u.stone)
    k.add(place(rotateG([[0.2, 0], [0.26, 0.14], [0.3, 0.28], [0.38, 0.42], [0.42, 0.5]], 12), sx, BASE + 3.55, zm), u.marble)
    box(0.9, 0.12, 0.9, u.marble, sx, BASE + 4.1, zm)
    // Yan parmaklık ve sofa
    box(0.05, 0.05, 2.5, o.iron, sx, BASE + 1.8, zm - 1.45)
    box(0.05, 0.05, 2.5, o.iron, sx, BASE + 1.8, zm + 1.45)
    dentilEave(k, dir, x, N0, R0, NH, u.brick, u.dark)
    // Yan sofa: tuğla döşemeli, 90 cm yüksek
    const xk = s * (2.2 + NX - 1) / 2
    box(NX - 1 - 2.2, 0.9, N2 - N1, o.brickFloor, xk, BASE + 0.45, (N1 + N2) / 2)
    box(0.05, 0.05, N2 - N1, o.iron, s * 2.22, BASE + 1.8, (N1 + N2) / 2)
    for (let c = 0; c < 26; c++) box(0.03, 0.9, 0.03, o.iron, s * 2.22, BASE + 1.35, N1 + (c + 0.5) * ((N2 - N1) / 26))
  }

  // Revakın iç duvarı: kapı ve iki yanda 19. yüzyılda açılan pencereler
  const openDoor = { p: 0, y0: BASE, g: 1.8, flat: 2.5, kh: 0.55 }
  const porticoWindow = [-5.9, -3.2, 3.2, 5.9].map((p) => ({ p, y0: BASE + 1.5, g: 1, flat: 1.5, kh: 0.5 }))
  wall(k, 'K', N2, -NX + 0.8, NX - 0.8, 0, NH + 0.05, R0 - N2, a, [openDoor, ...porticoWindow])
  for (const ac of porticoWindow) {
    archPlane(k, 'K', N2, ac, 0.35, o.windowOuter)
    box(1, 0.1, 0.5, u.marbleDark, ac.p, ac.y0 + 0.02, N2 + 0.15)
    stoneArch('K', N2, { ...ac, g: 1.3, flat: 1.5, kh: 0.8 }, 0.2, 0.06)
  }
  // Mermer söveli kapı ve yuvarlak alınlık
  archStones(k, 'K', N2, { ...openDoor, g: 1.92 }, 0.32, 0.1, u.marble, u.marbleDark, 7)
  const pedimentOuter = new THREE.Shape()
  arch(pedimentOuter, 0, BASE + 3.5, 2.8, 0.05, 1.5)
  k.add(orient(subtract(pedimentOuter, 0.08, 0), 'K', N2, 0), u.marble)
  for (const s of [-1, 1]) {
    box(0.3, 3.0, 0.5, u.marble, s * 1.04, BASE + 1.5, N2 + 0.22)
    // Açık duran kanatlar içte kalır
    k.add(place(boxG(0.08, 2.9, 0.9).translate(s * 0.86, BASE + 1.45, -7.9 - 0.42), 0, 0, 0), u.walnut)
  }

  // Revak tavanı: enine sivri kemerler ve bezemesiz kubbe içleri
  for (let n = -2; n <= 2; n++) {
    const p = n * SEFE, Rx = n === 0 ? 2.25 : 2, zm = (N1 + N2) / 2
    kRoof.add(transitionG(p, zm, p - SEFE / 2, p + SEFE / 2, N1, N2, 5.4, 7.2, Rx, Rx), o.plasterLight)
    k.add(place(new THREE.CircleGeometry(Rx + 0.1, 40).rotateX(Math.PI / 2), p, 7.2, zm), o.plasterLight)
  }
  for (const n of [-2, -1, 1, 2, 3]) {
    const xk = (n - 0.5) * SEFE
    if (Math.abs(xk) > NX - 1) continue
    const ac = { p: (N1 + N2) / 2, y0: BASE, g: N2 - N1 - 0.5, flat: 3.5, kh: 2.4 }
    wall(k, 'D', xk + 0.25, N1, N2, BASE, 7.3, 0.5, o.plasterLight, [ac])
  }
  // Revak iç yüzleri: yan odaların sıvalı tavan altı
  for (const s of [-1, 1]) box(0.05, NH - 0.4, N2 - N1, o.plaster, s * (NX - 1.02), 3.9 + 0.3, (N1 + N2) / 2)

  // Hol: küçük kubbe ve iki yanda sıvalı duvar
  kRoof.add(transitionG(0, (R0 + G1) / 2, -1.9, 1.9, R0, G1, 4.7, 6.2, 1.8, 1.8), o.plaster)
  k.add(place(new THREE.CircleGeometry(1.9, 32).rotateX(Math.PI / 2), 0, 7.2, (R0 + G1) / 2), o.domePlain)
  // Holden orta mekâna geçilen kapı duvarı
  const innerDoor = { p: 0, y0: BASE, g: 2, flat: 2.6, kh: 0.6 }
  wall(k, 'G', C0, -CX, CX, 0, H, C0 - G1, o.plaster, [innerDoor])
  archStones(k, 'G', C0, { ...innerDoor, g: 2.1 }, 0.24, 0.05, u.marble, u.marbleDark, 7)
  // Holün kuzey duvarı sıvalı
  wall(k, 'G', R0 + 0.03, -1.9, 1.9, BASE, H, 0.03, o.plaster, [{ ...openDoor }])

  // Mihrap duvarı ve mihrap
  const southP = [-2.6, 2.6]
  const acG = southP.flatMap((p) => [lowerWindow('G', S1, p, BASE + MIHRAB + 0.5, S1 - M1), upperWindow('G', S1, p, 4.75, S1 - M1)])
  wall(k, 'G', S1, -MB, MB, 0, H, S1 - M1, a, acG)
  wall(k, 'G', M1 + 0.03, -MX - 0.03, MX + 0.03, BASE + MIHRAB, H, 0.04, o.plaster, acG)
  for (const p of southP) molding('G', S1, p, 4.4)
  dentilEave(k, 'G', S1, -MB, MB, H, u.brick, u.dark)
  // Orta mekân ile mihraplı bölümü ayıran geniş kemer
  const mihrabArch = { p: 0, y0: BASE, g: 7.8, flat: 3.9, kh: 2.6 }
  wall(k, 'G', M0, -MX, MX, 0, H, M0 - C1, o.plaster, [mihrabArch])
  for (const s of [-1, 1]) box(MX - 3.9 + 0.06, 3.6 + BASE, M0 - C1 + 0.06, u.stone, s * (MX + 3.9) / 2, 2, (M0 + C1) / 2)

  // Mihrap: fotoğraf yüzeyi (açık yayında tuval), üstte taç, yanlarda şamdanlar
  const MG = 4, MY = MG * (985 / 725), MALT = BASE + MIHRAB + 0.05
  box(MG + 0.14, MY + 0.1, 0.16, u.dark, 0, MALT + MY / 2, M1 - 0.08)
  k.add(new THREE.PlaneGeometry(MG, MY).rotateY(Math.PI).translate(0, MALT + MY / 2, M1 - 0.17), o.mihrab)
  const crown = new THREE.Shape()
  crown.moveTo(-MG / 2 - 0.2, 0); crown.quadraticCurveTo(-1, 0.25, -0.75, 0.62); crown.quadraticCurveTo(-0.3, 0.7, 0, 1.25)
  crown.quadraticCurveTo(0.3, 0.7, 0.75, 0.62); crown.quadraticCurveTo(1, 0.25, MG / 2 + 0.2, 0); crown.closePath()
  k.add(place(subtract(crown, 0.1, 0).translate(0, MALT + MY + 0.08, 0).rotateY(Math.PI), 0, 0, M1 - 0.04), u.ornament)
  // Sekizgen köşe panelleri ve ölçek için alçak sıra
  for (const s of [-1, 1]) {
    // Şamdan: pirinç ayak, kalın mum
    const sx = s * 1.69, sz = M1 - 0.5
    const leg: [number, number][] = [[0.42, 0], [0.42, 0.06], [0.28, 0.42], [0.12, 0.62], [0.1, 1.05], [0.26, 1.15], [0.26, 1.2]]
    k.add(place(rotateG(leg, 20), sx, BASE + MIHRAB, sz), o.brass)
    k.add(place(cylinderG(0.2, 0.2, 1.05, 18), sx, BASE + MIHRAB + 1.72, sz), o.brass)
    k.add(place(rotateG([[0.18, 0], [0.18, 1.5], [0.12, 1.85], [0, 1.95]], 18), sx, BASE + MIHRAB + 2.2, sz), o.candle)
    // Alt pencere tacı
    const px = s * 2.6
    const crownS = arch(new THREE.Shape(), 0, BASE + MIHRAB + 2.1, 1.75, 0.15, 1.15)
    crownS.holes.push(arch(new THREE.Path(), 0, BASE + MIHRAB + 2.1, 1.3, 0.1, 0.8))
    k.add(place(new THREE.ShapeGeometry(crownS, 10).rotateY(Math.PI), px, 0, M1 - 0.03), u.ornament)
    // Mermer sekiler
    box(MX - 2 + 0.04, 0.22, 0.75, u.innerMarble, s * (MX + 2) / 2, BASE + MIHRAB + 0.11, M1 - 0.37)
  }
  // Mihrap önü basamak halısı
  box(1.3, 0.1, 0.6, o.carpet, 0, BASE + MIHRAB + 0.05, M1 - 0.8)

  // Tabhane pencereleri üstü taçları, sakıflar ve mahfil
  for (const s of [-1, 1]) {
    box(CX - 1.25, BASE + 2.7, -2.4 - C0, o.plaster, s * (CX + 1.25) / 2, (BASE + 2.7) / 2, (C0 - 2.4) / 2)
    box(CX - 1.25 + 0.06, 0.1, -2.4 - C0 + 0.3, u.wood, s * (CX + 1.25) / 2, BASE + 2.72, (C0 - 2.4) / 2 + 0.1)
    box(CX - 1.25, 0.08, 0.08, u.walnut, s * (CX + 1.25) / 2, BASE + 3.72, -2.3)
    for (let c = 0; c < 11; c++) {
      const bx = s * (1.25 + (c + 0.5) * ((CX - 1.25) / 11))
      k.add(place(cylinderG(0.03, 0.03, 0.95, 6), bx, BASE + 3.24, -2.3), u.walnut)
    }
    box(0.08, 0.9, 1.3, u.walnut, s * 1.25, BASE + 3.2, (C0 - 2.4) / 2)
    // Mahfil altı ahşap kaplama
    box(CX - 1.25, BASE + 2.2, 0.06, o.carving, s * (CX + 1.25) / 2, 1.3, -2.38)
  }

  // Minber: üçgen gövde, korkuluklar, köşk ve sivri külah
  const createMinbar = () => {
    const { x0, x1, z0, z1, apex } = MINBAR
    const base = BASE + MIHRAB, xm = (x0 + x1) / 2, en = x1 - x0
    const side = new THREE.Shape()
    side.moveTo(z0, base); side.lineTo(M1, base); side.lineTo(M1, base + apex + 0.9); side.lineTo(z1, base + apex + 0.9); side.lineTo(z0, base + 0.9); side.closePath()
    for (const x of [x0, x1 - 0.12]) k.add(subtract(side, 0.12, 0).rotateY(-Math.PI / 2).translate(x + 0.12, 0, 0), o.carving)
    const STEP = 12
    for (let i = 0; i < STEP; i++) {
      const t = i / STEP, z = z0 + t * (z1 - z0), y = base + ((i + 1) / STEP) * apex
      box(en - 0.24, y - base, (z1 - z0) / STEP + 0.01, i % 2 ? u.mihrabRed : o.carpet, xm, (y + base) / 2, z + (z1 - z0) / STEP / 2)
    }
    // Köşk ve külah
    const kzm = (z1 + M1) / 2, kd = M1 - z1
    box(en, apex, kd, o.carving, xm, base + apex / 2, kzm)
    box(en, 2.1, kd, o.carving, xm, base + apex + 1.05, kzm)
    box(en + 0.1, 0.1, kd + 0.08, u.goldDark, xm, base + apex + 2.15, kzm)
    k.add(place(flatShadow(cylinderG(0.03, en * 0.62, 2.3, 8).rotateY(Math.PI / 8)), xm, base + apex + 3.3, kzm), o.carving)
    k.add(place(rotateG([[0.07, 0], [0.03, 0.14], [0.08, 0.28], [0, 0.55]], 8), xm, base + apex + 4.45, kzm), u.gold)
    // Kapı: iki söve ve taç
    for (const x of [x0 + 0.06, x1 - 0.06]) box(0.12, 2.3, 0.2, o.carving, x, base + 1.15, z0)
    box(en, 0.25, 0.2, o.carving, xm, base + 2.42, z0)
  }
  createMinbar()
  // Vaaz kürsüsü: minberin batısında sade ahşap, turkuaz panolu
  box(1.05, 3.2, 1.6, o.carving, -MX + 0.55, BASE + MIHRAB + 1.6, 8.4)
  box(0.04, 1.2, 0.9, o.tile, -MX + 1.09, BASE + MIHRAB + 1.5, 8.4)

  // Avize: kristal halkası lamba ve halelerle gösterilir
  const chandelier = (x: number, y: number, z: number, apex: number, R: number, count: number) => {
    k.add(new THREE.TorusGeometry(R, 0.03, 6, 28).rotateX(Math.PI / 2).translate(x, y, z), u.gold)
    k.add(new THREE.TorusGeometry(R * 0.55, 0.025, 6, 20).rotateX(Math.PI / 2).translate(x, y + 0.5, z), u.gold)
    k.add(place(cylinderG(0.012, 0.012, apex - y, 5), x, (apex + y) / 2, z), u.dark)
    for (let n = 0; n < count; n++) {
      const c = (n / count) * Math.PI * 2, lx = x + Math.sin(c) * R, lz = z + Math.cos(c) * R
      k.add(new THREE.SphereGeometry(0.07, 8, 6).translate(lx, y - 0.14, lz), u.lamp)
      for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) {
        k.add(new THREE.PlaneGeometry(0.42, 0.42).rotateX(rx).rotateY(ry).translate(lx, y - 0.14, lz), u.lampHalo)
      }
    }
  }
  chandelier(0, 5.4, 1.15, 16, 0.85, 10)
  chandelier(0, 5.9, 11.7, 15.5, 0.95, 12)
  chandelier(8.375, 4.4, 1.35, 11, 0.5, 6)
  chandelier(-8.375, 4.4, 1.35, 11, 0.5, 6)

  // --- Çatı: kurşun döşeme, kasnak halkası ---
  const ana = new THREE.Shape()
  const path: [number, number][] = [[-BX, R0], [BX, R0], [BX, TS], [MB, TS], [MB, S1], [-MB, S1], [-MB, TS], [-BX, TS]]
  path.forEach(([x, z], i) => { if (i) ana.lineTo(x, -z); else ana.moveTo(x, -z) })
  ana.closePath()
  const CE = 1.15, ME = 11.71
  ana.holes.push(new THREE.Path().absellipse(0, -CE, 4.72, 5.05, 0, Math.PI * 2, true))
  ana.holes.push(new THREE.Path().absellipse(0, -ME, 4.92, 4.5, 0, Math.PI * 2, true))
  for (const s of [-1, 1]) ana.holes.push(new THREE.Path().absarc(s * 8.375, -1.35, 3.05, 0, Math.PI * 2, true))
  kRoof.add(new THREE.ShapeGeometry(ana, 28).rotateX(-Math.PI / 2).translate(0, H + 0.02, 0), leadMat)
  // Hafif eğimli kurşun etekler
  const porticoRoof = rect(-NX, -R0, NX, -N0)
  kRoof.add(new THREE.ShapeGeometry(porticoRoof).rotateX(-Math.PI / 2).translate(0, NH + 0.04, 0), leadMat)
  for (const [dir, x, a0, b0] of [['D', BX, R0, TS], ['B', -BX, R0, TS], ['G', TS, MB, BX], ['G', TS, -BX, -MB], ['D', MB, TS, S1], ['B', -MB, TS, S1], ['G', S1, -MB, MB]] as const) {
    const L = b0 - a0, m = (a0 + b0) / 2
    kRoof.add(orient(boxG(L + 0.5, 0.1, 0.5).translate(0, H + 0.06, 0.1), dir, x, m), u.dark)
  }
  for (const [dir, x, a0, b0] of [['K', N0, -NX, NX], ['D', NX, N0, R0], ['B', -NX, N0, R0]] as const) {
    const L = b0 - a0, m = (a0 + b0) / 2
    kRoof.add(orient(boxG(L + 0.5, 0.1, 0.5).translate(0, NH + 0.06, 0.1), dir, x, m), u.dark)
  }

  // İç geçiş bölgeleri
  kRoof.add(transitionG(0, CE, -CX, CX, C0, C1, 7.5, 9.4, 4.45, 4.85), o.transitionMid)
  kRoof.add(transitionG(0, ME, -MX, MX, M0, M1, 7, 9.4, 4.8, 4.4), o.transitionMihrab)
  for (const s of [-1, 1]) kRoof.add(transitionG(s * 8.375, 1.35, s * 8.375 - 3.03, s * 8.375 + 3.03, T0, T1, 5.9, 8.75, 2.95, 2.95), o.transitionPlain)

  // --- Kasnaklar ---
  const innerDrum = (cx: number, cz: number, y0: number, y1: number, Rx: number, Rz: number, angles: number[], solid: Mat) => {
    const g = flatShadow(cylinderG(1, 1, y1 - y0, 16, true)).scale(Rx, 1, Rz)
    kDrum.add(place(g, cx, (y0 + y1) / 2, cz), o.plaster)
    for (const a of angles) {
      const y = y0 + (y1 - y0) * 0.16, length = (y1 - y0) * 0.54
      const pen = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y, 0.82, length, 0.42), 8)
      const uv = pen.attributes.uv, p = pen.attributes.position
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.82 + 0.5, (p.getY(i) - y) / (length + 0.42))
      const nx = Math.sin(a), nz = Math.cos(a), Rd = 1 / Math.hypot(nx / Rx, nz / Rz)
      kDrum.add(place(pen.translate(0, 0, Rd - 0.06), cx, 0, cz, a), solid)
      void nx; void nz
    }
    // Dış sekizgen yüzünde karşılık gelen pencereler
    return angles
  }
  const outerWindows = (cx: number, cz: number, y0: number, y1: number, R: number, angles: number[], zScale = 1) => {
    for (const a of angles) {
      const y = y0 + 0.5, length = y1 - y0 - 1.6
      const rz = R * Math.cos(Math.PI / 8)
      const pen = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y, 1, length, 0.55), 8)
      const uv = pen.attributes.uv, p = pen.attributes.position
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + 0.5, (p.getY(i) - y) / (length + 0.55))
      pen.translate(0, 0, rz + 0.04).rotateY(a).scale(1, 1, zScale)
      kDrum.add(pen.translate(cx, 0, cz), o.latticeOuter)
    }
  }
  const FACE = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
  // Orta mekân: sekizgen kasnak; kaynakta kasnak ve etekte pencereler
  innerDrum(0, CE, 9.4, 11.4, 4.45, 4.85, [FACE[1], FACE[3], FACE[0]], o.latticeInner)
  outerDrum(kDrum, a, u.dark, 0, CE, H, 12.7, 5.8)
  outerWindows(0, CE, H, 12.7, 5.8, [FACE[1], FACE[3]])
  // Mihraplı bölüm: oval kubbe, kubbede üç pencere
  innerDrum(0, ME, 9.4, 10.6, 4.8, 4.4, [FACE[0], FACE[1], FACE[3]], o.latticeInner)
  outerDrum(kDrum, a, u.dark, 0, ME, H, 12, 6.6, 0.885)
  outerWindows(0, ME, H, 12, 6.6, [FACE[1], FACE[3]], 0.885)
  outerWindows(0, ME, H, 12, 6.6, [FACE[0]], 0.885)
  // Tabhanelerin alçak kasnağı
  for (const s of [-1, 1]) outerDrum(kDrum, a, u.dark, s * 8.375, 1.35, H, H + 0.55, 4.05)

  // --- Kubbeler ---
  const al = u.gold
  leadDome(kDome, domeMat, al, 0, CE, 12.68, 5.2, 4.4, 28)
  leadDome(kDome, domeMat, al, 0, ME, 11.98, 5.6, 4.3, 28, true, 0.885)
  for (const s of [-1, 1]) leadDome(kDome, domeMat, al, s * 8.375, 1.35, H + 0.52, 3.55, 2.4, 22)
  // Son cemaat yeri: beş göz, ortası büyük
  leadDome(kDome, domeMat, al, 0, -12.95, NH + 0.05, 2.75, 2.15, 22)
  for (const s of [-1, 1]) {
    leadDome(kDome, domeMat, al, s * SEFE, -12.95, NH + 0.05, 1.95, 1.5, 18)
    leadDome(kDome, domeMat, al, s * SEFE * 2, -12.95, NH + 0.05, 1.8, 1.35, 18)
  }
  innerDome(kDome, o.domeMedallion, 0, CE, 11.4, 4.45, 4.85, 4.6)
  innerDome(kDome, o.domeRose, 0, ME, 10.6, 4.8, 4.4, 5)
  for (const s of [-1, 1]) innerDome(kDome, o.domePlain, s * 8.375, 1.35, 8.75, 2.95, 2.95, 2.45)
  // Hol kubbesi dışarıdan görünmez; revak iç kubbeleri tavanla kapalıdır.

  // --- Minare: kuzeydoğu köşesi, çokgen tuğla gövde, tek şerefe, kurşun külah ---
  const minaret = (x: number, z: number) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z), mat)
    ext(flatShadow(cylinderG(1.48, 1.62, 13.5, 12).translate(0, 14.25, 0)), u.brick)
    ext(flatShadow(cylinderG(1.75, 1.75, 2.2, 12).translate(0, 9.2, 0)), a)
    for (const y of [12, 15, 18]) ext(flatShadow(cylinderG(1.6, 1.6, 0.14, 12).translate(0, y, 0)), u.marbleDark)
    // Şerefe altında iki sıra stalaktit
    for (let t = 0; t < 2; t++) {
      const r = 1.55 + t * 0.32, y = 21.05 + t * 0.42
      ext(cylinderG(r + 0.3, r, 0.42, 20).translate(0, y, 0), u.marbleDark)
      for (let a2 = 0; a2 < 16; a2++) {
        const c = ((a2 + (t % 2) * 0.5) / 16) * Math.PI * 2
        ext(new THREE.SphereGeometry(0.2, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.15, 0.5).translate(0, y - 0.2, r + 0.12).rotateY(c), u.stoneDark)
      }
    }
    ext(cylinderG(2.34, 2.34, 0.22, 24).translate(0, 22, 0), u.marble)
    for (let c = 0; c < 22; c++) ext(boxG(0.56, 0.86, 0.05).translate(0, 22.52, 2.26).rotateY((c / 22) * Math.PI * 2), u.marble)
    ext(cylinderG(1.12, 1.22, 2.9, 12).translate(0, 23.5, 0), u.brick)
    ext(cylinderG(1.34, 1.1, 0.26, 12).translate(0, 25, 0), u.marbleDark)
    ext(flatShadow(cylinderG(0.04, 1.3, 6.3, 12).translate(0, 28.2, 0)), leadMat)
    ext(rotateG([[0.08, 31.2], [0.03, 31.5], [0.13, 31.8], [0.03, 32.1], [0.1, 32.35], [0.01, 32.9], [0, 33]], 8), u.bronze)
  }
  minaret(BX - 1.5, -8.9)

  // --- Şadırvan: geniş saçaklı kurşun örtü, sekiz direk, bezemeli kubbe ---
  const fountain = (x: number, z: number) => {
    k.add(place(flatShadow(cylinderG(4.7, 4.7, 0.28, 8).rotateY(Math.PI / 8)), x, 0.14, z), u.marbleDark)
    k.add(place(flatShadow(cylinderG(1.7, 1.85, 1, 12)), x, 0.78, z), u.marble)
    k.add(place(cylinderG(1.55, 1.55, 0.04, 16), x, 1.27, z), u.water)
    k.add(place(rotateG([[0.55, 0], [0.18, 0.5], [0.7, 0.75], [0.15, 0.95], [0.1, 1.5], [0.02, 1.7], [0, 1.72]], 14), x, 1.25, z), u.marble)
    const R = 3.7
    for (let n = 0; n < 8; n++) {
      const a2 = Math.PI / 8 + n * Math.PI / 4
      const px = x + R * Math.sin(a2), pz = z + R * Math.cos(a2)
      k.add(place(cylinderG(0.13, 0.16, 3.6, 10), px, 2.08, pz), u.walnut)
      k.add(place(boxG(0.28, 0.3, 0.28), px, 3.75, pz), u.walnut)
      // Direkleri bağlayan kemerli ahşap kuşak
      const gen = 2 * R * Math.sin(Math.PI / 8), face = R * Math.cos(Math.PI / 8)
      const s = rect(-gen / 2, 2.85, gen / 2, 3.95)
      s.holes.push(arch(new THREE.Path(), 0, 2.86, gen - 0.42, 0.2, 0.75))
      k.add(place(subtract(s, 0.08, face - 0.04), x, 0, z, n * Math.PI / 4), u.walnut)
    }
    // Kuşağın üstünde geniş saçak
    kRoof.add(place(flatShadow(cylinderG(3.5, 5.3, 0.75, 8, false).rotateY(Math.PI / 8)), x, 4.3, z), leadMat)
    kRoof.add(place(flatShadow(cylinderG(5.32, 5.32, 0.14, 8, false).rotateY(Math.PI / 8)), x, 3.9, z), u.dark)
    outerDrum(kDrum, u.cream, u.dark, x, z, 4.65, 5.65, 3.45)
    leadDome(kDome, domeMat, al, x, z, 5.62, 3.05, 2.9, 22)
  }
  fountain(0, -25)

  // Evliya Çelebi Çeşmesi: kare çinili gövde, dört yanda mermer tekne ve saçak (fotoğrafa göre)
  const fountainTap = (x: number, z: number) => {
    box(4.2, 0.2, 4.2, u.marbleDark, x, 0.1, z)
    box(2.2, 2.4, 2.2, o.tile, x, 1.9, z)
    for (const s of [-1, 1]) {
      box(1.4, 0.8, 0.8, u.marble, x + s * 0.55, 0.65, z - 1.5)
      box(1.4, 0.8, 0.8, u.marble, x + s * 0.55, 0.65, z + 1.5)
    }
    k.add(place(flatShadow(cylinderG(0.9, 3, 0.45, 4).rotateY(Math.PI / 4)), x, 3.25, z), u.walnut)
    leadDome(k, domeMat, al, x, z, 3.45, 1, 0.7, 12)
  }
  fountainTap(-19, -20)

  const rootGroup = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  rootGroup.add(roofGroup, drumGroup, domeGroup)
  const gx = PLACE.x, gz = PLACE.z
  return {
    root: rootGroup,
    layers: [
      { group: roofGroup, height: 12, ad: 'Çatı' },
      { group: drumGroup, height: 20, ad: 'Kasnaklar' },
      { group: domeGroup, height: 28, ad: 'Kubbeler' },
    ],
    stops,
    walking: walkArea(),
    camera: { position: [gx + 30, 38, gz - 78], target: [6, 7, 0] },
    pedestalRadius: 64,
    innerLights: [[gx, 8.2, gz + 1], [gx, 8.2, gz + 11.7], [gx + 8.4, 6, gz + 1.3], [gx - 8.4, 6, gz + 1.3]],
  }
}
