// The complex's other surviving buildings and surroundings: exterior mass only.
// Plan dimensions of Emir Hanı and Orhan Hamamı from the inventory; positions are representative, with the distance between them shortened.
import * as THREE from 'three'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import { type Mat, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, place } from '../../uluMosquePiece'
import type { orhanMaterials } from './textures'
import { LocalBucket, tree, outerDrum, wall, archStones, dentilEave, leadDome, triangleG, orient } from './common'

type O = ReturnType<typeof orhanMaterials>

export function surroundings(k: LocalBucket, u: UluMosqueMaterials, o: O) {
  k.x = 0; k.z = 0
  const floor = new THREE.CircleGeometry(64, 96).rotateX(-Math.PI / 2).translate(0, 0.012, 0)
  const p = floor.attributes.position, uv = floor.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.add(floor, o.plaza)
  // Şadırvan garden and the grass south of the mosque
  const patch = (x: number, z: number, g: number, d: number) => {
    const b = boxG(g, 0.14, d)
    k.add(place(b, x, 0.07, z), o.grass)
    k.add(place(boxG(g + 0.3, 0.2, 0.25), x, 0.1, z - d / 2), u.marbleDark)
    k.add(place(boxG(g + 0.3, 0.2, 0.25), x, 0.1, z + d / 2), u.marbleDark)
    k.add(place(boxG(0.25, 0.2, d), x - g / 2, 0.1, z), u.marbleDark)
    k.add(place(boxG(0.25, 0.2, d), x + g / 2, 0.1, z), u.marbleDark)
  }
  patch(38, -19, 22, 13.5)
  patch(54, 5, 6, 20)
  patch(21, 26, 12, 8)
  // Representative trees: evoke the plane trees in the photos; positions are not exact
  tree(k, o.body, o.leaf, 56, -29, 14, 4)
  tree(k, o.body, o.leafYellow, 20, -30, 14, 4.2)
  tree(k, o.body, o.leaf, 56, 14, 12, 3.6)
  tree(k, o.body, o.leafYellow, 21, 27, 13, 4)
  tree(k, o.body, o.leaf, 58, -6, 11, 3.2)
}

/** Emir Hanı: ~45 × 45 m, ~650 m² courtyard, two-storey portico (inventory pp. 214-215). */
export function emirInn(k: LocalBucket, kRoof: LocalBucket, u: UluMosqueMaterials, o: O) {
  const X = -34, Z = 2
  for (const kv of [k, kRoof]) { kv.x = X; kv.z = Z }
  const YAR = 22.5, AV = 12.75, H = 9.8, t = 1.1
  const dentil = (dir: 'K' | 'G' | 'D' | 'B', s: number, a: number, b: number) => dentilEave(k, dir, s, a, b, H, u.brick, u.dark)
  for (const [dir, s] of [['K', -YAR], ['G', YAR], ['D', YAR], ['B', -YAR]] as const) {
    const pen = [-16, -11, -6, 6, 11, 16].flatMap((p) => [{ p, y0: 1.6, g: 0.9, flat: 1.35, kh: 0.01 }, { p, y0: 6, g: 0.9, flat: 1.35, kh: 0.01 }])
    const door = dir === 'K' ? [{ p: 0, y0: 0, g: 3.6, flat: 3, kh: 1.8 }] : []
    wall(k, dir, s, -YAR, YAR, 0, H, t, u.stone, [...pen, ...door])
    for (const ac of pen) {
      const uyg = new THREE.PlaneGeometry(0.9, 1.35).translate(0, ac.y0 + 0.67, -0.4)
      k.add(orient(uyg, dir, s, ac.p), u.dark)
    }
    dentil(dir, s, -YAR, YAR)
  }
  archStones(k, 'K', -YAR, { p: 0, y0: 0, g: 3.6, flat: 3, kh: 1.8 }, 0.42, 0.1, u.marbleDark, u.brick, 8)
  // Scale benches beside the gate (mentioned in the source; form is representative)
  for (const s of [-1, 1]) k.add(place(boxG(2.4, 0.7, 1), s * 3.3, 0.35, -YAR - 0.4), u.marbleDark)

  // Two-storey pointed-arch portico facing the courtyard. On the south wing the lower arches are close to semicircular.
  const COUNT = 7, step = (AV * 2) / COUNT
  for (const [dir, s] of [['G', -AV], ['K', AV], ['B', AV], ['D', -AV]] as const) {
    const ar: { p: number; y0: number; g: number; flat: number; kh: number }[] = []
    for (let i = 0; i < COUNT; i++) {
      const p = -AV + (i + 0.5) * step
      const round = dir === 'G' && s === -AV
      ar.push({ p, y0: 0, g: step - 0.9, flat: 2.2, kh: round ? 1.2 : 1.6 })
      ar.push({ p, y0: 5.1, g: step - 1.1, flat: 1.8, kh: 1.4 })
    }
    wall(k, dir, s, -AV - 0.8, AV + 0.8, 0, H - 0.1, 0.9, u.brick, ar)
    dentilEave(k, dir, s, -AV - 0.8, AV + 0.8, H - 0.05, u.brick, u.dark)
    // Stone and brick intermediate band
    k.add(orient(boxG(AV * 2 + 1.6, 0.16, 0.08).translate(0, 4.8, 0.02), dir, s, 0), u.marbleDark)
    // Behind the portico: room wall and floor slab
    k.add(orient(boxG(AV * 2 + 1.6, H - 0.2, 0.2).translate(0, (H - 0.2) / 2, -3.6), dir, s, 0), u.plaster)
    k.add(orient(boxG(AV * 2 + 1.6, 0.25, 3.5).translate(0, 4.6, -1.75), dir, s, 0), u.dark)
    for (let i = 0; i < COUNT; i++) {
      const p = -AV + (i + 0.5) * step
      k.add(orient(new THREE.PlaneGeometry(1.5, 2.3).translate(0, 1.3, -3.48), dir, s, p), u.walnut)
      k.add(orient(new THREE.PlaneGeometry(1.2, 2).translate(0, 6.1, -3.48), dir, s, p), u.dark)
    }
  }
  // Courtyard: stone paving, marble şadırvan in the middle, trees
  k.add(place(boxG(AV * 2 + 1.6, 0.06, AV * 2 + 1.6), 0, 0.03, 0), u.marbleDark)
  k.add(place(flatShadow(cylinderG(2.6, 2.75, 0.7, 12)), 0, 0.4, 0), u.marble)
  k.add(place(cylinderG(2.4, 2.4, 0.03, 18), 0, 0.73, 0), u.water)
  k.add(place(rotateG([[0.45, 0], [0.12, 0.5], [0.5, 0.8], [0.08, 1], [0, 1.2]], 12), 0, 0.72, 0), u.marble)
  for (const [ax, az] of [[-7, -7], [7, -6.5], [-6.5, 7.5], [7.5, 7]] as const) tree(k, o.body, o.leaf, ax, az, 11, 3.4)

  // Banded lead roof: outer eave, ridge and courtyard eave
  const yD = H + 0.1, yM = H + 2.5, R1 = YAR + 0.45, R2 = (YAR + AV) / 2, R3 = AV - 0.15
  const face = (a: number[], b: number[], c: number[], d: number[]) => kRoof.add(triangleG(a, b, c, d), u.lead)
  for (let n = 0; n < 4; n++) {
    const dir = (r: number, y: number, s: number): number[] => {
      const c = [[s * r, -r], [r, s * r], [-s * r, r], [-r, -s * r]][n]
      return [c[0], y, c[1]]
    }
    face(dir(R1, yD, -1), dir(R1, yD, 1), dir(R2, yM, 1), dir(R2, yM, -1))
    face(dir(R2, yM, -1), dir(R2, yM, 1), dir(R3, yD, 1), dir(R3, yD, -1))
  }
  // Chimneys on the ridge (visible in rows in the aerial photo)
  for (const [ax, az] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) for (let i = -2; i <= 2; i++) {
    const bx = ax ? ax * R2 : i * 6.5, bz = az ? az * R2 : i * 6.5
    kRoof.add(place(boxG(0.8, 1.5, 0.8), bx, yM + 0.5, bz), u.brick)
    kRoof.add(place(boxG(1.05, 0.14, 1.05), bx, yM + 1.3, bz), u.dark)
  }
}

/** Orhan Hamamı: double bath, men's to the west, women's to the east; cold rooms to the north (inventory pp. 207-213). */
export function orhanBath(k: LocalBucket, kRoof: LocalBucket, kDrum: LocalBucket, kDome: LocalBucket, u: UluMosqueMaterials, o: O) {
  const X = 2, Z = -10
  for (const kv of [k, kRoof, kDrum, kDome]) { kv.x = X; kv.z = Z }
  const H = 6.2, al = u.gold
  const domeMat = u.dome.clone()
  domeMat.color.set('#a4adb6')
  // Mass: men's section 14 m wide to the west, women's section 12.4 m wide to the east
  const W0 = -13.5, W1 = 0.5, E1 = 12.9, N = -15, S1 = 11, S2 = 3
  const settle = (x0: number, x1: number, z0: number, z1: number, mat: Mat) =>
    k.add(place(boxG(x1 - x0, H, z1 - z0), (x0 + x1) / 2, H / 2, (z0 + z1) / 2), mat)
  settle(W0, W1, N, S1, u.stone)
  settle(W1, E1, N, S2, u.stone)
  const facade = (dir: 'K' | 'G' | 'D' | 'B', s: number, a: number, b: number) => dentilEave(k, dir, s, a, b, H + 0.05, u.brick, u.dark)
  facade('D', W1, S2, S1); facade('G', S1, W0, W1); facade('B', W0, N, S1); facade('K', N, W0, E1); facade('D', E1, N, S2); facade('G', S2, W1, E1)
  // Small windows: square on the east and west faces
  for (const z of [-11, -6, -1, 4, 8]) {
    k.add(orient(new THREE.PlaneGeometry(0.9, 1.1).translate(0, 3.1, 0.02), 'B', W0, z), u.dark)
  }
  for (const z of [-11, -6, -1]) k.add(orient(new THREE.PlaneGeometry(0.9, 1.1).translate(0, 3.1, 0.02), 'D', E1, z), u.dark)
  // Flat lead ceiling
  const roof = new THREE.Shape()
  roof.moveTo(W0, -N); roof.lineTo(E1, -N); roof.lineTo(E1, -S2); roof.lineTo(W1, -S2); roof.lineTo(W1, -S1); roof.lineTo(W0, -S1); roof.closePath()
  kRoof.add(new THREE.ShapeGeometry(roof).rotateX(-Math.PI / 2).translate(0, H + 0.03, 0), u.lead)

  /** Lead dome, octagonal or round drum of three brick courses + one stone course, lantern. */
  const dome = (x: number, z: number, Rk: number, h: number, kh: number, round = false) => {
    if (kh > 0) {
      if (round) kDrum.add(place(cylinderG(Rk, Rk, kh, 24), x, H + kh / 2, z), o.alternating)
      else outerDrum(kDrum, o.alternating, u.dark, x, z, H, H + kh, Rk)
    }
    leadDome(kDome, domeMat, al, x, z, H + kh - 0.02, Rk * 0.88, h, 20)
    // Skylight lantern
    kDome.add(place(cylinderG(Rk * 0.1, Rk * 0.14, 0.42, 8), x, H + kh + h + 0.04, z), u.dark)
  }
  const mx = (W0 + W1) / 2, kx = (W1 + E1) / 2
  dome(mx, -8, 7.3, 4.1, 2.6) // men's cold room, 11.95 × 11.86
  dome(kx, -8.8, 6.3, 3.6, 2.2) // women's cold room, 10.35 × 10.35
  dome(mx, 1.1, 4, 2.3, 1, true) // men's warm room, round drum
  dome(mx, 7.5, 3.6, 2.2, 0.7) // hot room
  for (const [dx, dz] of [[-4.7, -2.7], [4.7, -2.7], [-4.7, 2.5], [4.7, 2.5]] as const) dome(mx + dx, 7.5 + dz, 1.9, 1.15, 0) // four private cells (halvet)
  dome(kx - 2.6, 1.3, 1.9, 1.15, 0) // women's hot room
  dome(kx + 2.6, 1.3, 1.9, 1.15, 0) // women's private cell (halvet)

  // Original entrance on the north: pedimented projection, brick bands, round arch; based on the photo
  const G = mx, EN = 8.6, DER = 3, UPPER = 7.4
  const gov = rect(-EN / 2, 0, EN / 2, UPPER - 0.8)
  gov.holes.push(arch(new THREE.Path(), 0, 0, 4.1, 2.4, 2))
  const ond = subtract(gov, DER, -DER)
  k.add(orient(ond, 'K', N - DER, G), o.alternating)
  archStones(k, 'K', N - DER, { p: G, y0: 0, g: 4.2, flat: 2.4, kh: 2 }, 0.48, 0.1, u.marbleDark, u.brick, 9)
  // Dark behind the door opening
  k.add(orient(new THREE.PlaneGeometry(4.2, 4.6).translate(0, 2.3, -DER + 0.1), 'K', N - DER, G), u.dark)
  const tip = new THREE.Shape()
  tip.moveTo(-EN / 2 - 0.3, UPPER - 0.8); tip.lineTo(EN / 2 + 0.3, UPPER - 0.8); tip.lineTo(0, UPPER + 0.95); tip.closePath()
  k.add(orient(subtract(tip, DER, -DER), 'K', N - DER, G), o.alternating)
  // Round vertical brick window instead of a lantern (in the source it is above the door)
  k.add(orient(new THREE.CircleGeometry(0.5, 16).translate(0, UPPER - 0.4, 0.04), 'K', N - DER, G), u.brick)
  // Pediment tile
  for (const s of [-1, 1]) {
    const x0 = G - s * (EN / 2 + 0.3), x1 = G
    kRoof.add(triangleG([x0, UPPER - 0.82, N - DER - 0.2], [x1, UPPER + 0.96, N - DER - 0.2], [x1, UPPER + 0.96, N + 0.05], [x0, UPPER - 0.82, N + 0.05]), u.lead)
  }
}
