// Representative model of the Mevlâna Complex (Konya, Karatay). Units in meters; north -z, east +x. Exterior only for now.
// Sourced (Vakıf Eserleri Envanteri – Konya, Cilt 1): the türbe is a domed baldachin on four piers with a 16-segment body and a
// conical cap in green tile (pp. 32-33); the semahane north of the türbe, square, under a 12 m dome (p. 38); the square domed
// mescit west of the semahane with a three-domed narthex and a 19th-century minaret on its west side (pp. 40-41); the matbah
// (p. 44); eighteen domed dervish cells enclosing the front courtyard in an L on the west and north (p. 48); the şadırvan on eight
// small columns with a 16-segment roof centre (pp. 50-51); six tombs in the garden (p. 29).
// Plan layout proportioned from the vertical aerial photo on p. 32 (top = north: semahane above the green cone, mescit to its
// west). Heights, window positions, the matbah massing, tomb positions, the selsebil and the Şeb-i Arus pool are representative.
import * as THREE from 'three'
import type { Model } from '../uluMosqueModel'
import { Bucket, boxG, cylinderG, rotateG, flatShadow, place, type Mat } from '../uluMosquePiece'
import { mevlanaMaterials } from './konya-karatay-mevlana-tomb-museum-pieces/materials'

const PEDESTAL_R = 42
const T = 1 // wall thickness
const HALL_H = 8, MASJID_H = 11, SEMA_H = 12
const MASJID = { x: 7.5, z: -12.75 }, SEMA = { x: 20.75, z: -12.75 }
const TURBE = { x: 17.44, z: 3.5 }
const SADIRVAN = { x: -10.8, z: -5.2 }
const MINARET = { x: -2, z: -5.2 }

export const building = (): Model => {
  const m = mevlanaMaterials()
  const u = m.u
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()

  const B = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat, kv = k) =>
    kv.add(place(boxG(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mat)
  const flatUV = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
    return g
  }
  /** Lead dome with a gold finial. */
  const dome = (cx: number, cz: number, y0: number, R: number, H: number, kv = kDome, finial = 1) => {
    const p: [number, number][] = [[R + 0.25, -0.1], [R + 0.2, 0.05]]
    for (let t = 0; t <= 12; t++) {
      const a = (t / 12) * Math.PI / 2
      p.push([R * Math.cos(a), 0.05 + H * Math.sin(a)])
    }
    kv.add(place(rotateG(p, 32, [1, 1]), cx, y0, cz), u.dome)
    const s = finial
    const q: [number, number][] = [[0.12 * s, 0], [0.05 * s, 0.15 * s], [0.12 * s, 0.32 * s], [0.03 * s, 0.6 * s], [0, 0.9 * s]]
    kv.add(place(rotateG(q, 8), cx, y0 + H, cz), u.gold)
  }
  /** Polygonal stone drum with a lead cap ring. */
  const drum = (cx: number, cz: number, y0: number, h: number, R: number, sides: number, kv = kDrum) => {
    kv.add(place(flatShadow(cylinderG(R, R, h, sides).rotateY(Math.PI / sides)), cx, y0 + h / 2, cz), m.ashlar)
    kv.add(place(flatShadow(cylinderG(R + 0.15, R + 0.2, 0.2, sides).rotateY(Math.PI / sides)), cx, y0 + h - 0.1, cz), u.lead)
  }
  /** Dark window or door panel on a wall: `along` is the wall direction. */
  const opening = (x: number, z: number, y0: number, w: number, h: number, along: 'x' | 'z', depth = T + 0.08) =>
    along === 'x' ? B(x - w / 2, x + w / 2, y0, y0 + h, z - depth / 2, z + depth / 2, m.window) : B(x - depth / 2, x + depth / 2, y0, y0 + h, z - w / 2, z + w / 2, m.window)

  // ---------------------------------------------------------------- GROUND
  k.add(flatUV(new THREE.CircleGeometry(PEDESTAL_R, 80).rotateX(-Math.PI / 2).translate(0, 0.01, 0)), u.paving)
  const grass = (x0: number, z0: number, x1: number, z1: number) => B(x0, x1, 0, 0.06, z0, z1, m.grass)
  grass(3, 9.5, 25, 21) // south garden with graves (p. 32 photo)
  grass(-11, 2, -7, 9) // small grave plot in the courtyard (p. 32 photo)
  grass(32, -16, 38, -4)
  // Gravestones: representative rows
  for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) {
    const x = 5 + i * 2.2, z = 12 + j * 3
    if ((i + j) % 3 === 2) continue
    B(x - 0.25, x + 0.25, 0.06, 0.4, z - 0.6, z + 0.6, u.marble)
    B(x - 0.15, x + 0.15, 0.06, 1.0, z - 0.75, z - 0.6, u.marble)
  }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) B(-10.2 + i * 1.6 - 0.2, -10.2 + i * 1.6 + 0.2, 0.06, 0.35, 3.5 + j * 2 - 0.5, 3.5 + j * 2 + 0.5, u.marble)
  const tree = (x: number, z: number, h: number) => {
    k.add(cylinderG(0.2, 0.28, h * 0.45, 6).translate(x, h * 0.225, z), u.walnut)
    k.add(new THREE.IcosahedronGeometry(h * 0.33, 1).scale(1, 1.15, 1).translate(x, h * 0.66, z), m.leaf)
  }
  tree(9, 17.5, 8); tree(20, 16.5, 9); tree(35, -10, 8); tree(35.5, 4, 7)

  // ---------------------------------------------------------------- MAIN BLOCK: hall (Huzur-ı Pîr + türbe), mescit, semahane
  // Floors (visible when "Parçala" lifts the roofs)
  B(1.5, 27, 0, 0.08, -5.5, 6.5, u.marble)
  B(1.5, 13.5, 0, 0.08, -19, -6.5, m.floor)
  B(14.5, 27, 0, 0.08, -19, -6.5, u.wood)
  // Walls along x
  B(0.5, 14, 0, MASJID_H, -20, -19, m.ashlar); B(14, 28, 0, SEMA_H, -20, -19, m.ashlar)
  B(0.5, 14, 0, MASJID_H, -6.5, -5.5, m.ashlar); B(14, 28, 0, SEMA_H, -6.5, -5.5, m.ashlar)
  B(0.5, 28, 0, HALL_H, 6.5, 7.5, m.ashlar)
  // Walls along z (between the x walls)
  B(0.5, 1.5, 0, MASJID_H, -19, -6.5, m.ashlar); B(0.5, 1.5, 0, HALL_H, -5.5, 6.5, m.ashlar)
  B(27, 28, 0, SEMA_H, -19, -6.5, m.ashlar); B(27, 28, 0, HALL_H, -5.5, 6.5, m.ashlar)
  B(13.5, 14.5, 0, SEMA_H, -19, -6.5, m.ashlar)
  // Windows and doors (representative positions)
  for (const x of [4, 7.5, 11, 17.5, 20.75, 24]) { opening(x, -19.5, 2, 1.1, 1.8, 'x'); opening(x, -19.5, 6.6, 0.9, 1.6, 'x') }
  for (const z of [-16, -12.75, -9.5]) { opening(27.5, z, 2, 1.1, 1.8, 'z'); opening(27.5, z, 6.6, 0.9, 1.6, 'z') }
  for (const x of [4.69, 11.06, 23.81]) opening(x, 7, 2, 1.1, 1.8, 'x')
  for (const z of [-2.5, 3.5]) opening(27.5, z, 2, 1.1, 1.8, 'z')
  opening(1, 0.5, 0, 2, 3.2, 'z') // hall entrance from the courtyard (representative)
  opening(1, -12.75, 0.3, 1.8, 3, 'z') // Çerağ Kapısı on the mescit's west side (p. 40)
  for (const z of [-16, -9.5]) opening(1, z, 2.4, 0.9, 1.6, 'z')
  // Hall interior seen from above: piers between the bays; the türbe bay has the two-tier marble sanduka (pp. 32, 36)
  for (const x of [7.875, 14.25, 20.625]) B(x - 0.6, x + 0.6, 0, HALL_H, 0, 1, m.ashlar)
  B(TURBE.x - 1.5, TURBE.x + 1.5, 0.08, 0.7, TURBE.z - 0.8, TURBE.z + 0.8, u.marble)
  B(TURBE.x - 1.1, TURBE.x + 1.1, 0.7, 1.25, TURBE.z - 0.5, TURBE.z + 0.5, u.marble)
  B(TURBE.x - 1.12, TURBE.x + 1.12, 1.25, 1.3, TURBE.z - 0.52, TURBE.z + 0.52, m.cloth)
  // Mescit mihrab (south wall, p. 40) and semahane wooden railing (photo p. 39)
  B(6.6, 8.4, 0, 3.4, -6.6, -6.5, u.marbleDark)
  for (const [x0, x1, z0, z1] of [[16, 25.5, -17.6, -17.45], [16, 25.5, -8, -7.85], [16, 16.15, -17.6, -7.85], [25.35, 25.5, -17.6, -7.85]] as const) B(x0, x1, 0.08, 1, z0, z1, m.railing)

  // Roofs (lead) — layer "Çatılar"
  B(0.3, 14, MASJID_H, MASJID_H + 0.45, -20.2, -6.3, u.lead, kRoof)
  B(14, 28.2, SEMA_H, SEMA_H + 0.45, -20.2, -6.3, u.lead, kRoof)
  B(0.3, 28.2, HALL_H, HALL_H + 0.45, -6.3, 7.7, u.lead, kRoof)
  // Drums and domes
  drum(MASJID.x, MASJID.z, MASJID_H + 0.45, 1.4, 6.1, 12)
  dome(MASJID.x, MASJID.z, MASJID_H + 1.85, 5.9, 4.4, kDome, 1.4)
  drum(SEMA.x, SEMA.z, SEMA_H + 0.45, 2, 6.5, 12) // 12 m dome, "yüksek bir kubbe" (p. 38)
  dome(SEMA.x, SEMA.z, SEMA_H + 2.45, 6.3, 5, kDome, 1.5)
  for (const x of [4.69, 11.06, 17.44, 23.81]) for (const z of [-2.5, 3.5]) {
    if (x === TURBE.x && z === TURBE.z) continue
    drum(x, z, HALL_H + 0.45, 0.7, 2.6, 8)
    dome(x, z, HALL_H + 1.15, 2.45, 2)
  }

  // ---------------------------------------------------------------- KUBBE-İ HADRA
  // Square base above the hall roof, then the 16-segment body and the conical cap in green tile (p. 32).
  const TB = HALL_H + 0.45, TT = 10.6, BODY = 7, R = 3
  B(TURBE.x - 3, TURBE.x + 3, TB, TT, TURBE.z - 3, TURBE.z + 3, m.ashlar, kDrum)
  B(TURBE.x - 3.15, TURBE.x + 3.15, TT - 0.2, TT, TURBE.z - 3.15, TURBE.z + 3.15, u.lead, kDrum)
  const lobeR = R * Math.sin(Math.PI / 16), lobeC = R * Math.cos(Math.PI / 16)
  kDrum.add(place(cylinderG(lobeC, lobeC, BODY, 32), TURBE.x, TT + BODY / 2, TURBE.z), m.tile)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    kDrum.add(place(cylinderG(lobeR, lobeR, BODY, 10), TURBE.x + lobeC * Math.cos(a), TT + BODY / 2, TURBE.z + lobeC * Math.sin(a)), m.tile)
  }
  kDrum.add(place(cylinderG(R + 0.3, R + 0.3, 0.35, 32), TURBE.x, TT + BODY + 0.17, TURBE.z), m.tile)
  const CONE = 7.6, cy = TT + BODY + 0.35
  const cone: [number, number][] = [[R + 0.55, 0], [R + 0.4, 0.25], [0.15, CONE], [0, CONE + 0.05]]
  kDome.add(place(flatShadow(rotateG(cone, 16, [1, 1])), TURBE.x, cy, TURBE.z), m.tile)
  const alem: [number, number][] = [[0.14, 0], [0.06, 0.25], [0.18, 0.55], [0.05, 0.9], [0.12, 1.2], [0.02, 1.7], [0, 1.9]]
  kDome.add(place(rotateG(alem, 10), TURBE.x, cy + CONE, TURBE.z), u.gold)

  // ---------------------------------------------------------------- ANNEXES (masses from the aerial photo, function representative)
  B(2.5, 8.5, 0, 6, 7.5, 12.5, m.ashlar); B(2.3, 8.7, 6, 6.4, 7.3, 12.7, u.lead, kRoof)
  drum(5.5, 10, 6.4, 0.5, 2.5, 8); dome(5.5, 10, 6.9, 2.35, 1.8)
  B(9, 27.5, 0, 6, -22.5, -20, m.ashlar); B(8.8, 27.7, 6, 6.4, -22.7, -20, u.lead, kRoof)

  // ---------------------------------------------------------------- NARTHEX AND MINARET (mescit west side, p. 41)
  const NX0 = -5, NX1 = 0.5, NZ0 = -18.5, NZ1 = -7.5, NH = 5.6
  B(NX0, NX1, 0, 0.3, NZ0, NZ1, u.marble)
  B(NX0, NX1, 0, NH, NZ0, NZ0 + 0.6, m.ashlar); B(NX0, NX1, 0, NH, NZ1 - 0.6, NZ1, m.ashlar)
  for (const z of [-17.9, -14.3, -11.0, -8.1]) {
    k.add(cylinderG(0.28, 0.3, 4.2, 12).translate(NX0 + 0.45, 0.3 + 2.1, z), u.marble)
    B(NX0 + 0.1, NX0 + 0.8, 4.5, 4.8, z - 0.35, z + 0.35, u.marble)
  }
  B(NX0, NX0 + 0.9, 4.8, NH, NZ0, NZ1, m.ashlar)
  B(NX0 - 0.2, NX1, NH, NH + 0.35, NZ0 - 0.2, NZ1 + 0.2, u.lead, kRoof)
  for (const z of [-16.1, -12.65, -9.55]) { drum(-2.25, z, NH + 0.35, 0.4, 1.7, 8); dome(-2.25, z, NH + 0.75, 1.6, 1.3, kDome, 0.7) }
  // Minaret: built in the 19th century on the mescit's west side (p. 41); height and form representative
  B(MINARET.x - 1.2, MINARET.x + 1.2, 0, 6.5, MINARET.z - 1.2, MINARET.z + 1.2, m.ashlar)
  k.add(place(flatShadow(cylinderG(1.2, 1.5, 1.2, 12)), MINARET.x, 7.1, MINARET.z), m.ashlar)
  k.add(place(flatShadow(cylinderG(1.0, 1.05, 15, 12)), MINARET.x, 7.7 + 7.5, MINARET.z), m.ashlar)
  k.add(place(cylinderG(1.65, 1.1, 0.7, 16), MINARET.x, 22.4, MINARET.z), m.ashlar)
  k.add(place(cylinderG(1.65, 1.65, 0.9, 16, true), MINARET.x, 23.2, MINARET.z), m.railing)
  k.add(place(flatShadow(cylinderG(0.8, 0.85, 3.6, 12)), MINARET.x, 22.7 + 1.8, MINARET.z), m.ashlar)
  k.add(place(flatShadow(rotateG([[1.0, 0], [0.9, 0.2], [0.05, 4], [0, 4.05]], 12, [1, 1])), MINARET.x, 26.3, MINARET.z), u.lead)
  k.add(place(rotateG([[0.08, 0], [0.12, 0.3], [0.03, 0.7], [0, 0.9]], 8), MINARET.x, 30.3, MINARET.z), u.gold)

  // ---------------------------------------------------------------- DERVISH CELLS: 18 domed rooms in an L on the west and north (p. 48)
  // Rubble stone (p. 48); each door opens to the courtyard (p. 48). Count from the book, pitch from the aerial photo.
  const CELL_H = 4, PITCH = 2.9
  const cell = (x0: number, x1: number, z0: number, z1: number, door: { x: number; z: number; along: 'x' | 'z' }) => {
    B(x0, x1, 0, CELL_H, z0, z1, m.rubble)
    B(x0 - 0.1, x1 + 0.1, CELL_H, CELL_H + 0.3, z0 - 0.1, z1 + 0.1, u.lead, kRoof)
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    drum(cx, cz, CELL_H + 0.3, 0.35, 1.25, 8)
    dome(cx, cz, CELL_H + 0.65, 1.15, 0.95, kDome, 0.5)
    opening(door.x, door.z, 0, 0.9, 2.1, door.along, 0.1)
  }
  for (let i = 0; i < 7; i++) {
    const x0 = -28 + i * PITCH
    cell(x0 + 0.04, x0 + PITCH - 0.04, -24, -19, { x: x0 + PITCH / 2, z: -19, along: 'x' })
  }
  for (let i = 0; i < 11; i++) {
    const z0 = -19 + i * PITCH
    cell(-28, -23, z0 + 0.04, z0 + PITCH - 0.04, { x: -23, z: z0 + PITCH / 2, along: 'z' })
  }

  // ---------------------------------------------------------------- MATBAH (massing from the aerial photo; entrance on the north, p. 44)
  B(-30, -17, 0, 6.5, 13.2, 24, m.ashlar)
  kRoof.add(place(flatShadow(new THREE.CylinderGeometry(0, 1, 2.4, 4, 1).rotateY(Math.PI / 4).scale(13.8 / Math.SQRT2, 1, 11.6 / Math.SQRT2)), -23.5, 6.5 + 1.2, 18.6), u.lead)
  for (const [x, z] of [[-29, 16], [-25, 13.8]] as const) B(x - 0.45, x + 0.45, 6.5, 9.4, z - 0.45, z + 0.45, m.ashlar, kRoof)
  opening(-22, 13.2, 0, 2, 3, 'x', 0.12)
  B(-17, -9, 0, 5.5, 13.2, 24, m.ashlar); B(-17.2, -8.8, 5.5, 5.9, 13, 24.2, u.lead, kRoof)
  for (const z of [15.9, 21.3]) { drum(-13, z, 5.9, 0.4, 2.2, 8); dome(-13, z, 6.3, 2.05, 1.6) }

  // ---------------------------------------------------------------- ŞADIRVAN: eight small columns, roof with a 16-segment centre, two-tier bowl (pp. 50-51)
  {
    const { x, z } = SADIRVAN
    k.add(place(flatShadow(cylinderG(4, 4, 0.25, 8).rotateY(Math.PI / 8)), x, 0.125, z), u.marble)
    k.add(place(flatShadow(cylinderG(3, 3, 0.7, 8).rotateY(Math.PI / 8)), x, 0.6, z), u.marble)
    k.add(place(cylinderG(2.8, 2.8, 0.02, 8).rotateY(Math.PI / 8), x, 0.92, z), u.water)
    k.add(place(cylinderG(0.25, 0.3, 1.4, 10), x, 1.3, z), u.marble)
    k.add(place(rotateG([[0, 0], [1.1, 0.05], [1.2, 0.35], [0, 0.3]], 20), x, 1.6, z), u.marble)
    k.add(place(rotateG([[0, 0], [0.6, 0.05], [0.65, 0.3], [0, 0.25]], 20), x, 2.2, z), u.marble)
    k.add(place(cylinderG(0.08, 0.1, 0.6, 8), x, 1.9, z), u.marble)
    for (let n = 0; n < 8; n++) {
      const a = Math.PI / 8 + n * Math.PI / 4
      k.add(place(cylinderG(0.15, 0.17, 2.9, 10), x + 3.3 * Math.sin(a), 0.25 + 1.45, z + 3.3 * Math.cos(a)), u.marble)
    }
    k.add(place(flatShadow(cylinderG(3.7, 3.6, 0.35, 8).rotateY(Math.PI / 8)), x, 3.3, z), u.wood)
    kRoof.add(place(flatShadow(cylinderG(1.7, 4.4, 1.2, 8, true).rotateY(Math.PI / 8)), x, 4.05, z), u.lead)
    kDrum.add(place(flatShadow(cylinderG(1.7, 1.7, 0.6, 16)), x, 4.95, z), u.wood)
    const p: [number, number][] = [[1.8, 0]]
    for (let t = 0; t <= 8; t++) { const a = (t / 8) * Math.PI / 2; p.push([1.7 * Math.cos(a), 0.05 + 1.3 * Math.sin(a)]) }
    kDome.add(place(flatShadow(rotateG(p, 16, [1, 1])), x, 5.25, z), u.dome)
    kDome.add(place(rotateG([[0.1, 0], [0.04, 0.2], [0.1, 0.4], [0, 0.7]], 8), x, 6.6, z), u.gold)
  }

  // ---------------------------------------------------------------- SELSEBİL AND ŞEB-İ ARUS POOL (named in the book, form and position representative)
  k.add(place(flatShadow(cylinderG(1.1, 1.2, 0.9, 6)), -16.8, 0.45, 6), u.marble)
  k.add(place(cylinderG(0.95, 0.95, 0.02, 6), -16.8, 0.91, 6), u.water)
  B(-7.5, -3.5, 0, 0.5, 1.5, 4, u.marble); B(-7.3, -3.7, 0.5, 0.51, 1.7, 3.8, u.water)

  // ---------------------------------------------------------------- SIX TOMBS IN THE GARDEN (count from p. 29; positions and form representative)
  for (const [x, z] of [[-2.4, 9.6], [-1.6, 16], [31, 10], [30.5, -1], [29, 20], [-5.5, 22]] as const) {
    B(x - 2.5, x + 2.5, 0, 0.4, z - 2.5, z + 2.5, m.ashlar)
    k.add(place(flatShadow(cylinderG(2.1, 2.1, 4, 8).rotateY(Math.PI / 8)), x, 2.4, z), m.ashlar)
    opening(x, z - 2.0, 0.4, 0.9, 2, 'x', 0.15)
    kRoof.add(place(flatShadow(cylinderG(2.05, 2.3, 0.3, 8).rotateY(Math.PI / 8)), x, 4.55, z), u.lead)
    dome(x, z, 4.7, 1.95, 1.6, kDome, 0.6)
  }

  // ---------------------------------------------------------------- LAYERS
  const root = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)

  return {
    root,
    layers: [
      { group: roofGroup, height: 18, name: 'Çatılar' },
      { group: drumGroup, height: 30, name: 'Kasnaklar' },
      { group: domeGroup, height: 44, name: 'Kubbeler' },
    ],
    // Exterior-only model: no interior stops, so "İçeri gir" stays disabled.
    stops: [],
    walking: {
      limit: { x0: -PEDESTAL_R, x1: PEDESTAL_R, z0: -PEDESTAL_R, z1: PEDESTAL_R },
      boxes: [], circles: [], floors: [], viewBlockers: [],
      eyeY: 1.7, baseY: 0,
    },
    camera: { position: [-58, 46, 66], target: [2, 7, -2] },
    pedestalRadius: PEDESTAL_R + 1,
    innerLights: [[SEMA.x, 8, SEMA.z], [MASJID.x, 7.5, MASJID.z], [TURBE.x, 6, TURBE.z]],
  }
}
