// Muradiye Camii: dış kütle ve yürünebilir iç mekân. Tabhaneli/zaviyeli (ters T) şema, beş gözlü son cemaat yeri,
// art arda iki kubbe, iki yan eyvan, iki tuğla minare envanterden (s. 114-118). Plan ölçüleri kaynakta yoktur;
// envanter s. 113'teki kuşbakışı fotoğraftan, medresenin 17 × 17 m avlusuyla ölçeklenerek okunmuştur.
// Plan koordinatı: caminin ortası (0, 0), kuzey -z, doğu +x. Hat yazısı taklit edilmez: levha ve kitabe yüzeyleri yazısızdır.
import * as THREE from 'three'
import { Bucket, subtract, rect, rotateG, flatShadow, boxG, cylinderG, place } from '../../uluMosquePiece'
import type { InteriorStop, InteriorWalk, Box } from '../../uluMosqueInterior'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { MuradiyeMaterials } from './textures'
import { WEST, EAST, SOUTH, NORTH, type Mat, finial, perforatedPaving, outerDome, wall, transitionShell, innerDomeG, drum, archRing, archFace, hipRoof } from './common'

export const BASE = 1
const PLATFORM = 1.1, BAY = 2.7
const COURT_Z = -1.6, HALL_Z = 11, A = 5.2
const IWAN_X = 10, IWAN_AX = 3.8, IWAN_AZ = 4.6
const MINBAR = { x0: -3.75, x1: -2.45, z0: 12, ramp0: 12.5, ramp1: 15, z1: 16.1, h: 2.2 }

export function mosqueStops(ox: number, oz: number): InteriorStop[] {
  const d = (id: string, ad: string, k: [number, number, number], b: [number, number, number]): InteriorStop =>
    ({ id, ad, position: [k[0] + ox, k[1], k[2] + oz], look: [b[0] + ox, b[1], b[2] + oz] })
  const minbarZ = 14.2
  const minbarH = PLATFORM + ((minbarZ - MINBAR.ramp0) / (MINBAR.ramp1 - MINBAR.ramp0)) * MINBAR.h
  return [
    d('narthex', 'Son cemaat yeri', [0, BAY, -13.2], [0, 4.4, -9.6]),
    d('courtyard', 'Kubbeli iç avlu', [0, BAY, -5], [0, 5.4, 16]),
    d('mihrab', 'Mihrap', [0, BAY + PLATFORM, 8.2], [0, 5.2, 16.2]),
    d('minbar', 'Minber', [1, BAY + PLATFORM, 11], [-3.1, 4.6, 14.5]),
    d('tile', 'Çiniler', [2.2, BAY + PLATFORM, 10], [5.2, 4, 12]),
    d('dome', 'Kubbe', [0, BAY + PLATFORM, 8.4], [0, 19, 11]),
    d('east-iwan', 'Doğu eyvanı', [7.6, BAY, -1.6], [13.2, 4.6, -1.6]),
    d('west-iwan', 'Batı eyvanı', [-7.6, BAY, -1.6], [-13.2, 4.6, -1.6]),
    d('minbar-top', 'Minbere çık', [(MINBAR.x0 + MINBAR.x1) / 2, BAY + minbarH, minbarZ], [4, 4.2, 4]),
  ]
}

export function mosqueWalk(ox: number, oz: number): InteriorWalk {
  const K = (x0: number, x1: number, z0: number, z1: number): Box => ({ x0: x0 + ox, x1: x1 + ox, z0: z0 + oz, z1: z1 + oz })
  const bothSides = (x0: number, x1: number, z0: number, z1: number) => [K(x0, x1, z0, z1), K(-x1, -x0, z0, z1)]
  // Duvar kitleleri: bakışı da keser.
  const masses = [
    ...bothSides(1.3, 15, -9.6, -6.8), // giriş duvarı
    ...bothSides(6.2, 15, -6.8, -6.2), // eyvan kuzeyi
    ...bothSides(5.2, 6.2, -6.8, -6), ...bothSides(5.2, 6.2, 2.8, 3.6), // eyvan kemer ayakları
    ...bothSides(6.2, 15, 3, 5.9), // eyvan güneyi
    ...bothSides(4.8, 6.9, 3.6, 5.8), // ana kemer ayakları
    ...bothSides(5.2, 15, 5.8, 18), // harim yan duvarları
  ]
  const my = (MINBAR.x0 + MINBAR.x1) / 2
  return {
    limit: K(-13.8, 13.8, -16.1, 16.2),
    boxes: [
      ...masses,
      K(-1.5, 1.5, 15.8, 16.2), // mihrap
      // Son cemaat yeri ayakları (iç sırada çarpılmaz, cephe sınırın dışındadır); minber:
      K(MINBAR.x0 - 0.1, MINBAR.x0, MINBAR.z0, MINBAR.z1), K(MINBAR.x1, MINBAR.x1 + 0.1, MINBAR.z0, MINBAR.z1),
      K(MINBAR.x0, MINBAR.x1, MINBAR.ramp1 + 0.1, MINBAR.z1),
      K(my - 0.75, my - 0.62, MINBAR.z0 - 0.1, MINBAR.z0 + 0.3), K(my + 0.62, my + 0.75, MINBAR.z0 - 0.1, MINBAR.z0 + 0.3),
    ],
    circles: [],
    floors: [
      // Harime birkaç basamakla çıkılır.
      { x0: -2.3 + ox, x1: 2.3 + ox, z0: 1.8 + oz, z1: 3.6 + oz, h0: 0, h1: PLATFORM },
      { x0: -A + ox, x1: A + ox, z0: 3.6 + oz, z1: 16.2 + oz, h0: PLATFORM, h1: PLATFORM },
      // Minber merdiveni
      { x0: MINBAR.x0 + ox, x1: MINBAR.x1 + ox, z0: MINBAR.ramp0 + oz, z1: MINBAR.ramp1 + oz, h0: PLATFORM, h1: PLATFORM + MINBAR.h },
    ],
    viewBlockers: masses,
    eyeY: BAY,
    baseY: BASE,
  }
}

export function mosque(m: UluMosqueMaterials, d: MuradiyeMaterials, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {
  const box = (g: number, h: number, dd: number, mat: Mat, x: number, y: number, z: number, kv = k) => kv.add(place(boxG(g, h, dd), x, y, z), mat)
  const bothSides = (f: (s: number) => void) => { f(1); f(-1) }
  const carpet = m.carpetPlain.clone()
  carpet.color.set('#c9483c')

  // --- Kaide ve döşemeler ---
  box(31.6, 0.95, 8.8, m.marble, 0, 0.475, -13.3)
  box(31, 0.95, 16, m.marble, 0, 0.475, -1.8)
  box(14.4, 0.95, 12.6, m.marble, 0, 0.475, 12)
  box(30, 0.05, 7.4, d.hexBrick, 0, BASE - 0.025, -13.3)
  box(10.4, 0.05, 10.4, carpet, 0, BASE - 0.025, COURT_Z)
  bothSides((s) => box(IWAN_AX * 2 + 1, 0.05, 9.2, carpet, s * 9.7, BASE - 0.025, COURT_Z))
  // Basamaklar: son cemaat yerine dört basamak
  for (let i = 0; i < 4; i++) box(7.4 - i * 0.3, 0.25, (4 - i) * 0.42, m.marble, 0, 0.125 + i * 0.25, -17.8 - (4 - i) * 0.21)
  // Harim sekisi: önü firuze çinili, ortada halilı basamaklar
  box(A * 2, PLATFORM, 12.6, carpet, 0, BASE + PLATFORM / 2, 9.9)
  box(A * 2, PLATFORM - 0.12, 0.05, d.tileTurquoise, 0, BASE + PLATFORM / 2 - 0.05, 3.58)
  box(A * 2 + 0.02, 0.12, 0.2, d.border, 0, BASE + PLATFORM - 0.06, 3.6)
  const STEP = 7
  for (let i = 0; i < STEP; i++) {
    const h = PLATFORM * (i + 1) / STEP
    box(4.6, h, 1.8 / STEP, carpet, 0, BASE + h / 2, 1.8 + (i + 0.5) * 1.8 / STEP)
  }

  // --- Son cemaat yeri: beş kemerli cephe, dört mermer paye, iki granit sütun ---
  const BOW_Y = 4.6, O = 2.55, KH = 2.5, UPPER = 9
  const arcadeShape = (L: number, bays: number[], o: number) => {
    const s = new THREE.Shape()
    s.moveTo(-L / 2, BOW_Y)
    for (const c of bays) {
      s.lineTo(c - o, BOW_Y)
      s.quadraticCurveTo(c - o, BOW_Y + KH * 0.55, c, BOW_Y + KH)
      s.quadraticCurveTo(c + o, BOW_Y + KH * 0.55, c + o, BOW_Y)
    }
    s.lineTo(L / 2, BOW_Y); s.lineTo(L / 2, UPPER); s.lineTo(-L / 2, UPPER); s.closePath()
    return s
  }
  const bays = [-12, -6, 0, 6, 12]
  const archStripOf = (cx: number, z: number, ry: number) => {
    // Tuğla ve taş dilimli kemer: fotoğraftaki gibi cepheden hafif çıkıntılı
    const s = new THREE.Shape()
    const outer = O + 0.38, h = KH + 0.42
    s.moveTo(cx - outer, BOW_Y); s.quadraticCurveTo(cx - outer, BOW_Y + h * 0.55, cx, BOW_Y + h); s.quadraticCurveTo(cx + outer, BOW_Y + h * 0.55, cx + outer, BOW_Y)
    s.lineTo(cx + O, BOW_Y); s.quadraticCurveTo(cx + O, BOW_Y + KH * 0.55, cx, BOW_Y + KH); s.quadraticCurveTo(cx - O, BOW_Y + KH * 0.55, cx - O, BOW_Y); s.closePath()
    return place(subtract(s, 0.08, 0), 0, 0, z, ry)
  }
  // Ön cephe
  k.add(place(subtract(arcadeShape(30, bays, O), 0.55, -0.55), 0, 0, -17, NORTH), d.brickPattern)
  k.add(place(subtract(arcadeShape(30, bays, O), 0.35, -0.9), 0, 0, -17, NORTH), m.inner)
  for (const c of bays) k.add(archStripOf(c, -17, NORTH), m.brick)
  // Yan cepheler: birer kemer
  bothSides((s) => {
    const ry = s > 0 ? EAST : WEST
    k.add(place(subtract(arcadeShape(7.4, [0], 2.3), 0.55, -0.55), s * 15, 0, -13.3, ry), d.brickPattern)
    k.add(place(subtract(arcadeShape(7.4, [0], 2.3), 0.35, -0.9), s * 15, 0, -13.3, ry), m.inner)
  })
  // Paye ve sütunlar
  for (const u of [-15, -3, 3, 15]) {
    const x = Math.sign(u) * (Math.abs(u) === 15 ? 14.55 : 3)
    box(0.95, BOW_Y - BASE, 0.95, m.marble, x, (BOW_Y + BASE) / 2, -16.55)
    box(1.2, 0.28, 1.2, m.marble, x, BASE + 0.14, -16.55)
    box(1.1, 0.2, 1.1, m.marble, x, BOW_Y - 0.1, -16.55)
  }
  for (const u of [-9, 9]) {
    k.add(place(cylinderG(0.3, 0.34, BOW_Y - BASE - 0.5, 16), u, (BOW_Y + BASE) / 2 + 0.05, -16.55), d.granite)
    k.add(place(cylinderG(0.42, 0.34, 0.3, 12), u, BOW_Y - 0.15, -16.55), m.marble)
    k.add(place(cylinderG(0.42, 0.42, 0.25, 12), u, BASE + 0.12, -16.55), m.marble)
  }
  bothSides((s) => {
    box(0.9, BOW_Y - BASE, 1.6, m.marble, s * 14.55, (BOW_Y + BASE) / 2, -10.6)
  })
  // Korkuluk: orta göz açık
  for (const c of [-12, -6, 6, 12]) {
    box(4.9, 0.08, 0.1, m.wood, c, BASE + 0.95, -16.55)
    box(4.9, 0.08, 0.1, m.wood, c, BASE + 0.45, -16.55)
    for (let i = -2; i <= 2; i++) box(0.08, 0.9, 0.08, m.wood, c + i * 1.15, BASE + 0.5, -16.55)
  }
  // Saçak: firuze şerit ve testere dişli tuğla
  box(30.2, 0.62, 0.08, d.turquoiseBand, 0, 8.1, -17.04)
  bothSides((s) => box(0.08, 0.62, 7.6, d.turquoiseBand, s * 15.04, 8.1, -13.3))
  for (let i = 0; i < 60; i++) k.add(place(boxG(0.3, 0.3, 0.3).rotateY(Math.PI / 4), -14.75 + i * 0.5, 8.65, -17), m.brick)
  for (let s of [-1, 1]) for (let i = 0; i < 15; i++) k.add(place(boxG(0.3, 0.3, 0.3).rotateY(Math.PI / 4), s * 15, 8.65, -16.8 + i * 0.5), m.brick)
  box(30.8, 0.2, 8.3, m.dark, 0, 9.05, -13.3, kRoof)
  // Son cemaat yeri örtüsü: tavan, göz kubbeleri ve kurşun kırma çatı
  perforatedPaving(kRoof, -14.2, 14.2, -16.1, -9.6, 7.3, bays.map((c) => [c, -13.3, 2.6] as [number, number, number]), m.inner)
  for (const c of bays) {
    const R = 2.62
    kRoof.add(place(innerDomeG(R, 1.6), c, 7.3, -13.3), c === 0 ? d.squinch : d.innerDome)
  }
  hipRoof(kRoof, -15.7, 15.7, -17.8, -8.8, 9.15, 2.9, m.lead)
  outerDome(kRoof, 0, 10.8, -13.3, 2.6, 2, d.leadDome, 32)

  // Giriş duvarı: mermer taç, kündekâri kanatlar, alınlıkta çini
  const DOOR = { u: 0, g: 2.6, y: BASE + 0.02, flat: 3.2, k: 1.1 }
  wall(k, 0, -9.6, 30, BASE, 9.6, 2.8, NORTH, m.inner, m.inner, [DOOR])
  const crown0 = rect(-3.4, BASE, 3.4, 8.1)
  crown0.holes.push(new THREE.Path().moveTo(-2, BASE + 0.02).lineTo(-2, 4.8).quadraticCurveTo(-2, 5.8, 0, 6.6).quadraticCurveTo(2, 5.8, 2, 4.8).lineTo(2, BASE + 0.02).closePath() as THREE.Path)
  k.add(place(subtract(crown0, 0.3, 0), 0, 0, -9.6, NORTH), m.marble)
  box(5.6, 0.82, 0.05, d.tileNavy, 0, 7.45, -9.92)
  box(6.8, 0.18, 0.5, m.marble, 0, 8.18, -9.8)
  box(2.2, 0.56, 0.06, m.gold, 0, 5.72, -9.64) // kitabe yeri: yazısız
  bothSides((s) => {
    k.add(place(boxG(0.14, 3.7, 1.35), s * 1.22, BASE + 1.85, -8.95), m.kundekari)
    // Yan kapı ve pencereler: alınlıkları geometrik çini
    archFace(k, s * 9, -9.6, NORTH, 0, BASE, 2, 2.2, 0.9, 0.02, m.dark)
    archRing(k, s * 9, -9.6, NORTH, 0, BASE, 2, 2.2, 0.9, 0.2, 0, m.marble)
    box(2.8, 1.2, 0.05, d.tileNavy, s * 9, 6, -9.63)
    box(3.2, 0.14, 0.14, m.marble, s * 9, 5.35, -9.64)
    box(3.2, 0.14, 0.14, m.marble, s * 9, 6.66, -9.64)
  })

  // --- Beden duvarları (üç sıra tuğla + bir sıra moloz taş) ---
  bothSides((s) => {
    const east = s > 0
    const ry = east ? EAST : WEST
    wall(k, s * 15, -1.85, 15.5, BASE, 9.6, 1.2, ry, d.alternatingMosque, m.inner)
    wall(k, s * 10.95, 5.9, 8.1, BASE, 9.6, 2.9, SOUTH, d.alternatingMosque, m.inner, [], 0.9)
    // Eyvanın kuzey yüzü
    box(IWAN_AX * 2, 8.6, 0.6, m.inner, s * IWAN_X, BASE + 4.3, -6.5)
    // Avlu kemerleri
    wall(k, s * 6.2, COURT_Z, 10.4, BASE, 12.4, 1, ry, m.inner, m.inner, [{ u: 0, g: 8.8, y: BASE + 0.02, flat: 4.6, k: 3.1 }])
    // Harim yan duvarı
    wall(k, s * 6.9, 11.9, 12.2, BASE, 14.6, 1.7, ry, d.alternatingMosque, m.inner)
    // Beden pencereleri (dıştan şebeke)
    for (const z of [-5.8, -1.6, 2.6]) {
      archFace(k, s * 15, z, ry, 0, 2.2, 1.3, 2.4, 0.8, 0.02, d.lattice)
      archRing(k, s * 15, z, ry, 0, 2.2, 1.3, 2.4, 0.8, 0.22, 0, m.brick)
      archFace(k, s * 15, z, ry, 0, 6.4, 0.9, 1, 0.5, 0.02, d.lattice)
    }
    for (const z of [8.5, 15]) {
      archFace(k, s * 6.9, z, ry, 0, 3.2, 1.2, 2.2, 0.8, 0.02, d.lattice)
      archRing(k, s * 6.9, z, ry, 0, 3.2, 1.2, 2.2, 0.8, 0.22, 0, m.brick)
      archFace(k, s * 6.9, z, ry, 0, 8, 1, 1.3, 0.6, 0.02, d.lattice)
    }
  })
  wall(k, 0, 5.8, 13.8, BASE, 12.4, 2.2, SOUTH, m.inner, m.inner, [{ u: 0, g: 9.6, y: BASE + 0.02, flat: 5.5, k: 4.5 }], 0.5)
  wall(k, 0, 18, 13.8, BASE, 14.6, 1.8, SOUTH, d.alternatingMosque, m.inner, [], 0.7)
  for (const u of [-3.6, 3.6]) {
    archFace(k, 0, 18, SOUTH, u, 3.2, 1.2, 2.2, 0.8, 0.02, d.lattice)
    archRing(k, 0, 18, SOUTH, u, 3.2, 1.2, 2.2, 0.8, 0.22, 0, m.brick)
    archFace(k, 0, 18, SOUTH, u, 8.2, 1, 1.3, 0.6, 0.02, d.lattice)
  }
  // Saçak silmeleri
  bothSides((s) => {
    box(0.5, 0.3, 16, m.brick, s * 15.1, 9.55, -1.85)
    box(8.6, 0.3, 0.5, m.brick, s * 11, 9.55, 6)
  })
  box(14.6, 0.3, 0.5, m.brick, 0, 14.55, 18.1)
  bothSides((s) => box(0.5, 0.3, 12.4, m.brick, s * 7, 14.55, 11.9))

  // --- Çatı: kurşun güverte, sekizgen tuğla kasnaklar, kurşun kubbeler ---
  const OUT_R = 6.9 / Math.cos(Math.PI / 8)
  // Güverte ana kemerin üstünü kesmesin diye ortada yalnız giriş duvarını örter.
  bothSides((s) => perforatedPaving(kRoof, s > 0 ? 6.25 : -15.4, s > 0 ? 15.4 : -6.25, -9.6, 6.2, 9.8, [[s * IWAN_X, COURT_Z, 3.9]], m.lead))
  perforatedPaving(kRoof, -6.25, 6.25, -9.6, -6.8, 9.8, [], m.lead)
  perforatedPaving(kRoof, -7.3, 7.3, 6.2, 18.4, 14.62, [[0, HALL_Z, 5.2]], m.lead)
  drum(kDrum, 0, 9.7, 14.7, COURT_Z, OUT_R, 8, d.alternatingMosque, m.brick)
  drum(kDrum, 0, 14.4, 15.3, HALL_Z, OUT_R, 8, d.alternatingMosque, m.brick)
  bothSides((s) => drum(kDrum, s * IWAN_X, 9.7, 10.9, COURT_Z, 4.95, 8, d.alternatingMosque, m.brick))
  // Kasnak şebekeleri
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4
    archFace(kDrum, 0, COURT_Z, a, 0, 11.6, 1.1, 1, 0.6, 6.92, d.lattice)
    archRing(kDrum, 0, COURT_Z, a, 0, 11.6, 1.1, 1, 0.6, 0.18, 6.9, m.brick)
  }
  // Kubbeler
  outerDome(kDome, 0, 14.75, COURT_Z, 6.6, 5.6, d.leadDome, 56)
  outerDome(kDome, 0, 15.3, HALL_Z, 6.6, 5.6, d.leadDome, 56)
  bothSides((s) => outerDome(kDome, s * IWAN_X, 10.95, COURT_Z, 4.6, 3.8, d.leadDome, 44))
  finial(kDome, 0, 20.3, COURT_Z, m.bronze, 1.1)
  finial(kDome, 0, 20.85, HALL_Z, m.bronze, 1.1)
  bothSides((s) => finial(kDome, s * IWAN_X, 14.7, COURT_Z, m.bronze, 0.9))

  // --- İç: kubbeye geçiş, kasnak, kubbe ---
  const innerTop = (cz: number) => {
    kDrum.add(transitionShell(0, cz, A, A, 11.1, 12.6, A - 0.06, 32, 3), d.squinch)
    kDrum.add(place(cylinderG(A - 0.06, A - 0.06, 1.2, 40, true), 0, 13.2, cz), d.drumInner)
    for (let n = 0; n < 8; n++) {
      const a = (n + 0.5) * Math.PI / 4
      const r = A - 0.1
      archFace(kDrum, 0, cz, a + Math.PI, 0, 12.8, 0.55, 0.45, 0.32, -r, d.stainedGlass)
    }
    kDome.add(place(innerDomeG(A - 0.06, 5), 0, 13.8, cz), d.innerDome)
    // Köşelerde büyük prizmatik üçgenler (avlu) ve damlalı tromp (harim)
  }
  innerTop(COURT_Z); innerTop(HALL_Z)
  bothSides((s) => {
    kDrum.add(transitionShell(s * IWAN_X, COURT_Z, IWAN_AX, IWAN_AZ, 8.8, 9.9, 3.72, 28, 2), d.squinch)
    kDome.add(place(innerDomeG(3.72, 3.1), s * IWAN_X, 9.9, COURT_Z), d.innerDome)
  })

  /** Avlu köşesi: aşağı sivrilen prizmatik üçgen. */
  const triangleCorner = (cx: number, cz: number, sx: number, sz: number, y0: number, y1: number, g: number) => {
    const u1 = [cx + sx * (A - g), y1, cz + sz * A], u2 = [cx + sx * A, y1, cz + sz * (A - g)]
    const tip = [cx + sx * A, y0, cz + sz * A]
    const on = [cx + sx * (A - g * 0.34), y1, cz + sz * (A - g * 0.34)]
    const single = (a: number[], b: number[], c: number[]) => {
      const t = new THREE.BufferGeometry()
      t.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3))
      t.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0.25, 1, 0.12, 0], 2))
      t.computeVertexNormals()
      kDrum.add(t, d.squinch)
    }
    single(u1, on, tip); single(on, u2, tip)
  }
  /** Harim köşesi: duvarın ortasına inen damlalı, mukarnaslı tromp. */
  const drop = (sx: number, sz: number) => {
    const cx = sx * A, cz = HALL_Z + sz * A
    const N = 11, y0 = 6.4, y1 = 11.3
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const r0 = 0.1 + Math.pow(t, 1.2) * 2.9, r1 = 0.24 + Math.pow((i + 1) / N, 1.2) * 2.9
      const h = (y1 - y0) / N, y = y0 + i * h + h / 2
      const zig = i % 2 ? 1.14 : 1
      const g = flatShadow(cylinderG(r1 * zig, r0, h, 12, false).rotateY(i % 2 ? Math.PI / 12 : 0))
      kDrum.add(place(g, cx - sx * r0 * 0.12, y, cz - sz * r0 * 0.12), i % 3 === 2 ? d.archBand : m.cream)
    }
  }
  bothSides((sx) => bothSides((sz) => {
    triangleCorner(0, COURT_Z, sx, sz, 8.2, 11.15, 3.4)
    drop(sx, sz)
  }))

  // Kemer bantları: ana kemer ve eyvan kemerleri
  archRing(k, 0, 3.6, NORTH, 0, BASE + 0.02, 9.6, 5.5, 4.5, 0.35, -0.02, d.archBand, 0.06)
  bothSides((s) => archRing(k, s * 5.2, COURT_Z, s > 0 ? WEST : EAST, 0, BASE + 0.02, 8.8, 4.6, 3.1, 0.3, -0.02, d.archBand, 0.06))
  // Kemerin üstünde kalem işi şerit
  box(10.3, 0.5, 0.05, d.archBand, 0, 11.02, 3.58)

  // --- Çini panolar ---
  const boardX = (x: number, z0: number, z1: number, y0: number, y1: number, mat: Mat) => {
    const zo = (z0 + z1) / 2, L = z1 - z0, h = y1 - y0
    box(0.05, h, L, mat, x, y0 + h / 2, zo)
    for (const y of [y0 + 0.06, y1 - 0.06]) box(0.07, 0.12, L + 0.06, d.border, x, y, zo)
    for (const z of [z0 + 0.06, z1 - 0.06]) box(0.07, h, 0.12, d.border, x, y0 + h / 2, z)
  }
  const boardZ = (z: number, x0: number, x1: number, y0: number, y1: number, mat: Mat) => {
    const xo = (x0 + x1) / 2, L = x1 - x0, h = y1 - y0
    box(L, h, 0.05, mat, xo, y0 + h / 2, z)
    for (const y of [y0 + 0.06, y1 - 0.06]) box(L + 0.06, 0.12, 0.07, d.border, xo, y, z)
    for (const x of [x0 + 0.06, x1 - 0.06]) box(0.12, h, 0.07, d.border, x, y0 + h / 2, z)
  }
  const ZEM = BASE + PLATFORM
  // Mihrap önü duvarları: altıgen zümrüt yeşili; pencere altları ve köşeler firuze (envanter s. 116-117).
  bothSides((s) => {
    const x = s * (A - 0.03)
    boardX(x, 9.2, 12.8, ZEM, ZEM + 3.1, d.tileEmerald)
    boardX(x, 14.7, 16.15, ZEM, ZEM + 3.1, d.tileTurquoise)
    boardX(x, 5.85, 7.1, ZEM, ZEM + 3.1, d.tileTurquoise)
    // Beyaz sivri nişler
    const ry = s > 0 ? WEST : EAST
    for (const z of [8.15, 13.75]) {
      archFace(k, x, z, ry, 0, ZEM, 1.3, 2.4, 1.1, 0.03, m.cream)
      archRing(k, x, z, ry, 0, ZEM, 1.3, 2.4, 1.1, 0.14, 0.02, d.archBand)
      archFace(k, x, z, ry, 0, ZEM + 0.9, 0.8, 1.3, 0.7, 0.05, d.stainedGlass)
    }
    // Üst pencereler
    for (const z of [8.2, 11, 13.8]) {
      archFace(k, x, z, ry, 0, 7.2, 0.95, 1.5, 0.65, 0.03, d.stainedGlass)
      archRing(k, x, z, ry, 0, 7.2, 0.95, 1.5, 0.65, 0.1, 0.02, m.goldDark, 0.04)
    }
    // Giriş duvarında firuze, eyvan uçlarında pencere ve kapı
    boardZ(-6.77, s * 1.6, s * 5.15 + (s > 0 ? 0 : 0), BASE, BASE + 2.6, d.tileTurquoise)
    const ex = s * 13.77
    archFace(k, ex, COURT_Z, ry, 0, BASE, 2, 2.6, 1, 0.03, m.kundekari)
    archRing(k, ex, COURT_Z, ry, 0, BASE, 2, 2.6, 1, 0.16, 0.02, d.archBand)
    for (const z of [COURT_Z - 2.9, COURT_Z + 2.9]) {
      archFace(k, ex, z, ry, 0, BASE + 0.9, 1.1, 2, 0.8, 0.03, d.stainedGlass)
      archRing(k, ex, z, ry, 0, BASE + 0.9, 1.1, 2, 0.8, 0.16, 0.02, d.archBand)
    }
    for (const z of [COURT_Z - 2, COURT_Z, COURT_Z + 2]) archFace(k, ex, z, ry, 0, 6.2, 0.7, 1, 0.45, 0.03, d.stainedGlass)
  })
  // Kıble duvarı
  boardZ(16.17, 3.1, 5.15, ZEM, ZEM + 3.1, d.tileTurquoise)
  boardZ(16.17, -5.15, -3.1, ZEM, ZEM + 3.1, d.tileNavy) // minber arkası köşe
  for (const u of [-2.25, 2.25]) {
    archFace(k, 0, 16.17, NORTH, -u, ZEM + 0.3, 1.2, 1.9, 0.8, 0.03, d.stainedGlass)
    archRing(k, 0, 16.17, NORTH, -u, ZEM + 0.3, 1.2, 1.9, 0.8, 0.14, 0.02, m.cream)
    archFace(k, 0, 16.17, NORTH, -u, 7.4, 1.1, 1.3, 0.7, 0.03, d.stainedGlass)
    archRing(k, 0, 16.17, NORTH, -u, 7.4, 1.1, 1.3, 0.7, 0.14, 0.02, m.goldDark, 0.04)
    // Pencere üstü boş madalyon: hat taklit edilmez
    k.add(place(cylinderG(0.34, 0.34, 0.05, 16).rotateX(Math.PI / 2), u, 10.1, 16.17), m.dark)
    k.add(new THREE.TorusGeometry(0.36, 0.03, 6, 20).translate(u, 10.1, 16.13), m.gold)
  }
  // Levha ve Kâbe örtüsü yerleri: yazısız pano. Levha mihrabın batısındaki duvarda, örtü tam karşısında (s. 116-117).
  box(0.06, 1.3, 2.6, d.plaque, -A + 0.04, 6.1, 11)
  box(0.06, 1.3, 2.6, d.kaaba, A - 0.04, 6.1, 11)

  // --- Mihrap: 1790 onarımından kalan, alçı Rokoko; biçim temsilî ---
  const mihrab = () => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, 16.17, NORTH), mat)
    const G = 2.9, TOP = ZEM + 5.2
    const block = rect(-G / 2, ZEM, G / 2, TOP)
    block.holes.push(new THREE.Path().moveTo(-0.7, ZEM + 0.02).lineTo(-0.7, ZEM + 2.2).quadraticCurveTo(-0.7, ZEM + 2.9, 0, ZEM + 3.3).quadraticCurveTo(0.7, ZEM + 2.9, 0.7, ZEM + 2.2).lineTo(0.7, ZEM + 0.02).closePath() as THREE.Path)
    ext(subtract(block, 0.34), d.rococo)
    ext(boxG(1.5, 3.4, 0.08).translate(0, ZEM + 1.7, 0.03), m.goldDark)
    for (let i = 0; i < 6; i++) {
      const y = ZEM + 2.25 + i * 0.17, g = 1.36 - i * 0.2
      ext(boxG(g, 0.15, 0.2).translate(0, y, 0.14), m.gold)
    }
    // Çerçeve bantları
    for (const s of [-1, 1]) {
      ext(boxG(0.14, 5.2, 0.42).translate(s * (G / 2 - 0.07), ZEM + 2.6, 0.2), m.goldDark)
      ext(cylinderG(0.08, 0.08, 3, 12).translate(s * 0.9, ZEM + 1.6, 0.38), m.gold)
    }
    ext(boxG(G + 0.3, 0.16, 0.5).translate(0, TOP, 0.2), m.goldDark)
    // Tepelik: kıvrımlı alçı taç
    const crown = new THREE.Shape()
    crown.moveTo(-1.5, TOP + 0.05); crown.bezierCurveTo(-1.25, TOP + 0.5, -0.7, TOP + 0.45, -0.55, TOP + 0.85)
    crown.quadraticCurveTo(-0.25, TOP + 0.9, 0, TOP + 1.45); crown.quadraticCurveTo(0.25, TOP + 0.9, 0.55, TOP + 0.85)
    crown.bezierCurveTo(0.7, TOP + 0.45, 1.25, TOP + 0.5, 1.5, TOP + 0.05); crown.closePath()
    ext(subtract(crown, 0.16, 0.08), m.goldDark)
    // Basamak benzeri kaide
    ext(boxG(G + 0.2, 0.2, 0.7).translate(0, ZEM + 0.1, 0.3), m.marble)
  }
  mihrab()

  // --- Minber: 2014'te yerine konulan ahşap minber; biçim temsilî ---
  const minbar = () => {
    const my = (MINBAR.x0 + MINBAR.x1) / 2, en = MINBAR.x1 - MINBAR.x0
    const dark = m.mihrabRed
    const side = new THREE.Shape()
    const L = MINBAR.ramp1 - MINBAR.z0
    side.moveTo(0, ZEM); side.lineTo(MINBAR.z1 - MINBAR.z0, ZEM); side.lineTo(MINBAR.z1 - MINBAR.z0, ZEM + MINBAR.h + 1); side.lineTo(L, ZEM + MINBAR.h + 1)
    side.lineTo(MINBAR.ramp0 - MINBAR.z0, ZEM + 1); side.lineTo(0, ZEM + 1); side.closePath()
    for (const s of [-1, 1]) {
      k.add(place(subtract(side, 0.1, 0).rotateY(-Math.PI / 2), my + s * (en / 2 + 0.05) + 0.05, 0, MINBAR.z0), dark)
    }
    // Basamaklar
    const N = 9
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N, h = t * MINBAR.h, dz = (MINBAR.ramp1 - MINBAR.ramp0) / N
      box(en, h, dz + 0.01, dark, my, ZEM + h / 2, MINBAR.ramp0 + (i + 0.5) * dz)
    }
    // Köşk: kırmızı gövde, sivri külah
    box(en + 0.2, MINBAR.h + 2.5, MINBAR.z1 - MINBAR.ramp1, dark, my, ZEM + (MINBAR.h + 2.5) / 2, (MINBAR.z1 + MINBAR.ramp1) / 2)
    box(en + 0.3, 0.1, MINBAR.z1 - MINBAR.ramp1 + 0.1, m.gold, my, ZEM + MINBAR.h + 2.5, (MINBAR.z1 + MINBAR.ramp1) / 2)
    k.add(place(flatShadow(cylinderG(0.05, 0.85, 1.6, 8)), my, ZEM + MINBAR.h + 3.3, (MINBAR.z1 + MINBAR.ramp1) / 2), dark)
    finial(k, my, ZEM + MINBAR.h + 4.1, (MINBAR.z1 + MINBAR.ramp1) / 2, m.gold, 0.8)
    // Kapı: iki söve ve lento, içinden geçilir
    for (const s of [-1, 1]) box(0.13, 2.2, 0.4, m.kundekari, my + s * 0.685, ZEM + 1.1, MINBAR.z0 + 0.1)
    box(en + 0.25, 0.22, 0.42, m.goldDark, my, ZEM + 2.25, MINBAR.z0 + 0.1)
  }
  minbar()

  // --- Duvar aplikleri: sıcak ışık noktaları ---
  const sconce = (x: number, y: number, z: number) => {
    k.add(new THREE.SphereGeometry(0.12, 8, 6).translate(x, y, z), m.lamp)
    k.add(place(boxG(0.05, 0.05, 0.3), x, y + 0.2, z), m.bronze)
    for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]])
      k.add(new THREE.PlaneGeometry(0.9, 0.9).rotateX(rx).rotateY(ry).translate(x, y, z), m.lampHalo)
  }
  bothSides((s) => {
    for (const z of [8.2, 13.8]) sconce(s * (A - 0.3), 6.2, z)
    sconce(s * 13.4, 5, COURT_Z - 4)
    sconce(s * 13.4, 5, COURT_Z + 4)
    sconce(s * 4.8, 5, -6.4)
    sconce(s * 4, 5.4, -10)
  })

  // --- Minareler: batıdaki 1904 tarihli (s. 117); ikisi de tuğla gövde, tek şerefe ---
  const minaret = (x: number, z: number, leadCone: boolean) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z), mat)
    ext(boxG(3.1, 9.2, 3.1).translate(0, 4.6, 0), d.alternatingMosque)
    ext(flatShadow(cylinderG(1.5, 2.1, 1.8, 8).rotateY(Math.PI / 8).translate(0, 10.1, 0)), m.brick)
    ext(cylinderG(1.32, 1.42, 13.4, 24).translate(0, 17.7, 0), m.brick)
    for (const y of [11.2, 15, 19.5]) ext(cylinderG(1.46, 1.46, 0.24, 24).translate(0, y, 0), m.marble)
    ext(cylinderG(1.45, 1.45, 0.42, 24).translate(0, 23.6, 0), d.tileTurquoise)
    // Şerefe: taş kuşak ve dolu korkuluk (fotoğrafa göre)
    ext(rotateG([[1.34, 23.8], [1.9, 24.5], [1.95, 24.8], [1.95, 26], [1.75, 26.1]], 24), m.marble)
    ext(cylinderG(1.05, 1.15, 5, 24).translate(0, 28.4, 0), m.brick)
    ext(cylinderG(1.2, 1.2, 0.2, 24).translate(0, 30.9, 0), m.marble)
    if (leadCone) ext(rotateG([[1.25, 31], [0.95, 31.5], [0.1, 35], [0, 35.4]], 12), m.lead)
    else ext(rotateG([[1.1, 31], [0.9, 31.7], [0.75, 32.5], [0.55, 33.6], [0.2, 34.8], [0, 35.2]], 16), m.marble)
    finial(k, x, 35.2, z, m.bronze, 0.9)
  }
  minaret(15.6, -9.6, true)
  minaret(-15.6, -9.6, false)
}
