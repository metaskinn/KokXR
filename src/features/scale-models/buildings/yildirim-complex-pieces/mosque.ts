// Yıldırım Bayezid Mosque. Dimensions from the inventory (Bursa Vol. 2, pp. 166, 170, 172, 176): late-comers' portico 33.60 × 7.10 m,
// middle dome 14 m above the floor; central space of the prayer hall 12.20 × 12.20 m; mihrab dome 11.50 m; iwans ~8.5 × 6.75 m;
// tabhane rooms ~6.3 × 6.5 m; the side iwans and the mihrab section are reached by two steps.
// Wall thicknesses, heights and exterior window positions are proportioned from photos; they are representative.
// Units in meters. North -z, qibla +z, east +x. Suffixes: _N north, _S south. z values in this file are before the site offset.
import * as THREE from 'three'
import { subtract, rotateG, flatShadow, arch, boxG, Bucket, cylinderG, place } from '../../uluMosquePiece'
import type { InteriorWalk, Box, FloorArea } from '../../uluMosqueInterior'
import { chandelier, bursaArch, roof, outerDrum, outerDome, wallX, wallZ, boxK, pendentiveG, molding, type Mat, type YM } from './common'


export const BASE = 0.6
export const BAY_Y = BASE + 1.6
const HIGH = 0.4 // the two steps of the iwans and the mihrab section
const SOFA = 0.5 // side platforms (sofa) of the late-comers' portico

// Plan constants
const W = 16.8, N0 = -21, N1 = -13.9, N_IN = -19.6
const LOBBY_N = -8, LOBBY_S = 4.2, LOBBY_X = 6.1, GAP_S = 5.8
const SIDE_X = 7.55, IW_S = -1.25, TAB_N = -0.2, TAB_S = 6.5, TAB_D = 14
const MIH_X = 5.75, MIH_S = 17.3, OUT_S = 19.1, BODY_S = 7.6
const IW_OUT = 15.9
const BODY_H = 12.8, ROOF_TOP = 13.7, PORTICO_H = 11
const POLE = [3.3, 9.75, 16.05]

export function mosque(m: YM, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket): InteriorWalk {
  const K = (g: THREE.BufferGeometry, mat: Mat) => k.add(g, mat)
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat) => K(boxK(x0, x1, y0, y1, z0, z1), mat)
  const double = (f: (s: number) => void) => { f(1); f(-1) }
  const mirror = (s: number, a: number, b: number): [number, number] => s > 0 ? [a, b] : [-b, -a]
  const ext3 = (kv: Bucket, g: THREE.BufferGeometry, mat: Mat) => kv.add(g, mat)

  // --- Base and exterior steps ---
  box(-W - 0.4, W + 0.4, 0, BASE - 0.02, N0 - 0.4, BODY_S + 0.4, m.ashlar)
  box(-MIH_X - 2.2, MIH_X + 2.2, 0, BASE - 0.02, BODY_S, OUT_S + 0.4, m.ashlar)
  for (let i = 0; i < 3; i++) box(-3.4 - i * 0.5 + 0.8, 3.4 + i * 0.5 - 0.8, 0, BASE * (3 - i) / 3, N0 - 0.4 - i * 0.42 - 0.42, N0 - 0.4 - i * 0.42, m.ashlarLight)

  // --- Late-comers' portico: floor, side platforms ---
  box(-W, W, BASE - 0.05, BASE, N0, N1, m.ashlarLight)
  double((s) => {
    for (const [a, b] of [[POLE[0], POLE[1]], [POLE[1], IW_OUT]]) {
      const [x0, x1] = mirror(s, a, b)
      box(x0, x1, BASE, BASE + SOFA, N0, N1, m.ashlarLight)
    }
    // Three steps up to the platform: on both sides of the middle bay
    for (let i = 0; i < 2; i++) {
      const [x0, x1] = mirror(s, POLE[0] - 0.56 - i * 0.28 + 0.28, POLE[0])
      box(x0, x1, BASE, BASE + SOFA * (2 - i) / 3, N_IN + 0.4, N1 - 0.4, m.ashlarLight)
    }
  })

  // --- Late-comers' portico front facade: five Bursa arches, cylindrical moldings ---
  const mid = bursaArch(new THREE.Path(), 0, 0.02 + BASE, 4.7, 5.4, 3.5)
  const armTop = (x: number) => bursaArch(new THREE.Path(), x, BASE + SOFA, 4.55, 4.9, 2.7)
  const koler = [(POLE[0] + POLE[1]) / 2, (POLE[1] + POLE[2]) / 2]
  const hole = [mid, ...koler.flatMap((x) => [armTop(x), armTop(-x)])]
  K(wallX(-W, W, N0, N_IN, BASE, PORTICO_H, hole), m.ashlarLight)
  // Rough lower piece: the railing stone of the side bays is level with the platform at the arch mouth.
  for (const x of [...koler, ...koler.map((v) => -v)]) box(x - 2.28, x + 2.28, BASE, BASE + SOFA, N0 - 0.02, N_IN, m.ashlarLight)
  // Vertical cylindrical moldings and rectangular frames
  for (const x of [-POLE[2] - 0.75, -POLE[1] - 0.95, -POLE[1] + 0.95, -POLE[0] - 0.95, -POLE[0] + 0.95, POLE[0] - 0.95, POLE[0] + 0.95, POLE[1] - 0.95, POLE[1] + 0.95, POLE[2] + 0.75]) {
    K(cylinderG(0.13, 0.13, PORTICO_H - BASE - 0.3, 8).translate(x, (PORTICO_H + BASE - 0.3) / 2, N0 - 0.04), m.ashlarLight)
  }
  for (const [x, g, u] of [[0, 5.5, 10.15], ...koler.flatMap((v) => [[v, 5.3, 9.45], [-v, 5.3, 9.45]])]) {
    box(x - g / 2, x + g / 2, u, u + 0.2, N0 - 0.16, N0 + 0.02, m.ashlarLight)
    K(cylinderG(0.09, 0.09, g, 8).rotateZ(Math.PI / 2).translate(x, u - 0.02, N0 - 0.16), m.ashlarLight)
  }
  molding(K, m.ashlarLight, -W - 0.3, W + 0.3, PORTICO_H - 0.28, PORTICO_H, N0 - 0.3, N1, 0.5)
  // Horizontal impost at the arch springing, muqarnas pendant and iron tie rod below it
  const cushion = (x: number, y: number, s: number) => {
    K(cylinderG(0.22, 0.22, 1.5, 8).rotateX(Math.PI / 2).translate(x, y, N0 + 0.7), m.ashlarLight)
    for (let i = 0; i < 5; i++) {
      const g = 0.5 - i * 0.07
      K(boxG(g, 0.16, 0.9 - i * 0.08).translate(x - s * (i * 0.012), y - 0.27 - i * 0.16, N0 + 0.7), m.ashlarLight)
    }
  }
  const tension = (x: number, g: number, y: number) => {
    K(boxG(g + 0.5, 0.05, 0.05).translate(x, y, N0 + 0.28), m.dark)
    K(boxG(g + 0.5, 0.05, 0.05).translate(x, y, N_IN - 0.28), m.dark)
  }
  cushion(-2.35, BASE + 5.25, 1); cushion(2.35, BASE + 5.25, -1); tension(0, 4.7, BASE + 5.25)
  for (const x of [...koler, ...koler.map((v) => -v)]) {
    const y = BASE + SOFA + 4.75
    cushion(x - 2.27, y, 1); cushion(x + 2.27, y, -1); tension(x, 4.55, y)
  }

  // Side facades: twin Bursa arches within a rectangular frame
  double((s) => {
    const [x0, x1] = mirror(s, IW_OUT, W)
    const inner = [N0 + 2.45, N1 - 2.05].map((z) => bursaArch(new THREE.Path(), z, BASE + SOFA, 2.2, 3.2, 1.55))
    K(wallZ(x0, x1, N0, N1, BASE, PORTICO_H, inner), m.ashlarLight)
    const fx = s > 0 ? W : -W - 0.12
    box(fx, fx + 0.12, 7.4, 7.6, N_IN + 0.3, N1 - 0.2, m.ashlarLight)
    box(fx, fx + 0.12, BASE + SOFA, 7.6, N_IN + 0.3, N_IN + 0.46, m.ashlarLight)
    box(fx, fx + 0.12, BASE + SOFA, 7.6, N1 - 0.36, N1 - 0.2, m.ashlarLight)
    // Between posts: dividing arches
    for (const d of [POLE[0], POLE[1]]) {
      const x = s * d
      K(wallZ(x - 0.6, x + 0.6, N_IN, N1, BASE, PORTICO_H - 1.1, [bursaArch(new THREE.Path(), (N_IN + N1) / 2, BASE + (d === POLE[0] ? 0 : SOFA), 3.55, 3.6, 2.2)]), m.ashlarLight)
    }
  })

  // Late-comers' portico domes: small dome with pendentives inside, lead outside; middle dome 14 m above the floor
  const porticoBay = [[-POLE[2] + 0.6, -POLE[1] - 0.6], [-POLE[1] + 0.6, -POLE[0] - 0.6], [-POLE[0] + 0.6, POLE[0] - 0.6], [POLE[0] + 0.6, POLE[1] - 0.6], [POLE[1] + 0.6, POLE[2] - 0.6]]
  const porticoHole: { x: number; z: number; r: number }[] = []
  const nzMid = (N_IN + N1) / 2
  porticoBay.forEach(([a, b], i) => {
    const cx = (a + b) / 2, envOf = i === 2
    const R = Math.min((b - a) / 2, (N1 - N_IN) / 2) - 0.2
    kRoof.add(pendentiveG(cx, nzMid, a, b, N_IN, N1, PORTICO_H - 1.3, PORTICO_H - 0.15, R), m.plasterInner)
    kDome.add(place(innerDomeG(R, envOf ? 2.1 : 1.7), cx, PORTICO_H - 0.15, nzMid), m.plasterInner)
    kDome.add(new THREE.CircleGeometry(0.75, 20).rotateX(Math.PI / 2).translate(cx, PORTICO_H - 0.15 + (envOf ? 2.1 : 1.7) - 0.05, nzMid), m.boss)
    porticoHole.push({ x: cx, z: nzMid, r: R + 0.05 })
    if (envOf) {
      outerDrum(ext3, kDrum, m, cx, nzMid, PORTICO_H, 0.55, 3, 8, 0)
      outerDome(ext3, kDome, m, cx, nzMid, PORTICO_H + 0.5, 2.75, 2.4, 0.6)
    } else {
      outerDrum(ext3, kDrum, m, cx, nzMid, PORTICO_H, 0.3, R + 0.25, 8, 0)
      outerDome(ext3, kDome, m, cx, nzMid, PORTICO_H + 0.25, R + 0.15, 2.1, 0.5)
    }
  })
  roof((g) => kRoof.add(g, m.lead), -W, W, N0, N1, PORTICO_H + 0.02, PORTICO_H + 0.08, 0.2, 0.2, porticoHole)

  // --- Main entrance: marble crown portal, deep niche, black-and-white arch ---
  const niche = arch(new THREE.Path(), 0, BASE, 3.4, 4.6, 2.2)
  K(wallX(-W, W, N1, -9.2, 0, BODY_H, [niche]), m.ashlar)
  box(-W, W, 0, BASE, N1, LOBBY_N, m.ashlar)
  // Niche face and arch: black-and-white alternation
  const blackWhite = (i: number) => (i % 2 ? m.dark : m.whiteStone)
  const ringS = 13
  for (let i = 0; i < ringS; i++) {
    const a0 = Math.PI * (i / ringS), a1 = Math.PI * ((i + 1) / ringS)
    const nok = (a: number, r: number) => new THREE.Vector2(Math.cos(a) * r, BASE + 4.6 + Math.sin(a) * r * 1.29)
    const s = new THREE.Shape([nok(a0, 1.7), nok(a1, 1.7), nok(a1, 2.05), nok(a0, 2.05)])
    K(subtract(s, 0.12, N1 - 0.12), blackWhite(i))
  }
  // Entrance door: door wall, pointed-arch opening and open wooden leaf
  const doorPath = () => arch(new THREE.Path(), 0, BASE, 2, 2.9, 1.1)
  K(wallX(-LOBBY_X - 0.5, LOBBY_X + 0.5, -9.2, LOBBY_N, 0, ROOF_TOP, [doorPath()]), m.ashlarInner)
  K(new THREE.BoxGeometry(0.1, 3.4, 1).translate(-1.18, BASE + 1.7, LOBBY_N - 0.5), m.woodDark)
  K(new THREE.BoxGeometry(0.1, 3.4, 1).translate(1.18, BASE + 1.7, -9.7), m.woodDark)
  // Inner niche windows in front of the door and a small vent
  K(new THREE.PlaneGeometry(0.6, 0.6).translate(0, BASE + 5.4, -9.19).rotateY(0).translate(0, 0, -0.02), m.lattice)

  // Portico wall: symmetric mihrab niche with a rectangular window above and a pointed-lunette window below
  const porticoWindows = (x: number) => {
    const z = N1 - 0.02
    box(x - 0.95, x + 0.95, BASE + SOFA + 0.2, BASE + SOFA + 3.55, z - 0.06, z, m.ashlar)
    box(x - 0.62, x + 0.62, BASE + SOFA + 0.55, BASE + SOFA + 1.95, z - 0.08, z - 0.02, m.ironDark)
    const forehead = arch(new THREE.Shape(), x, BASE + SOFA + 2.1, 1.5, 0.05, 0.8)
    forehead.holes.push(arch(new THREE.Path(), x, BASE + SOFA + 2.2, 1.1, 0.03, 0.55))
    K(subtract(forehead, 0.08, z - 0.09), m.brickArch)
    K(new THREE.ShapeGeometry(arch(new THREE.Shape(), x, BASE + SOFA + 2.2, 1.1, 0.03, 0.55), 6).translate(0, 0, z - 0.05), m.plasterDark)
    box(x - 0.75, x + 0.75, BASE + SOFA + 4.1, BASE + SOFA + 5.7, z - 0.06, z, m.ashlar)
    box(x - 0.5, x + 0.5, BASE + SOFA + 4.3, BASE + SOFA + 5.5, z - 0.08, z - 0.02, m.ironDark)
  }
  for (const x of [...koler, ...koler.map((v) => -v)]) porticoWindows(x)

  // --- Body walls (exterior stone) ---
  double((s) => {
    const [x0, x1] = mirror(s, IW_OUT, W)
    box(x0, x1, 0, BODY_H, N1, BODY_S, m.ashlar)
    // Iwan north infill (the rooms to the north are left closed)
    const [yx0, yx1] = mirror(s, LOBBY_X, IW_OUT)
    box(yx0, yx1, 0, BODY_H, -9.2, LOBBY_N, m.ashlar)
    // Tabhane infill and south wall
    const [dx0, dx1] = mirror(s, TAB_D, IW_OUT)
    box(dx0, dx1, 0, BODY_H, TAB_N, BODY_S, m.ashlar)
    const [gx0, gx1] = mirror(s, SIDE_X, IW_OUT)
    box(gx0, gx1, 0, BODY_H, TAB_S, BODY_S, m.ashlar)
    // Iwan south wall / tabhane north wall
    box(gx0, gx1, 0, BODY_H, IW_S, TAB_N, m.ashlar)
    // Prayer hall side wall: iwan arch and tabhane door
    const [hx0, hx1] = mirror(s, LOBBY_X, SIDE_X)
    const iwanArch = bursaArch(new THREE.Path(), (LOBBY_N + IW_S) / 2 - 0.2, BASE, 5.95, 4.6, 4.0)
    const door = arch(new THREE.Path(), 1.8, BASE, 1.6, 2.4, 0.5)
    K(wallZ(hx0, hx1, LOBBY_N, GAP_S, 0, ROOF_TOP, [iwanArch, door]), m.ashlarInner)
    // Side wall of the mihrab section
    const [mx0, mx1] = mirror(s, MIH_X, SIDE_X)
    box(mx0, mx1, 0, BODY_H + 1, GAP_S, OUT_S, m.ashlar)
  })
  box(-SIDE_X, SIDE_X, 0, BODY_H + 1, MIH_S, OUT_S, m.ashlar)

  // Wide arch separating the hall from the mihrab section
  const bigArch = bursaArch(new THREE.Path(), 0, BASE, 9.8, 6.2, 5.2)
  K(wallX(-SIDE_X, SIDE_X, LOBBY_S, GAP_S, 0, ROOF_TOP, [bigArch]), m.ashlarInner)
  // Muqarnas niches and imposts at the arch piers
  double((s) => {
    for (let i = 0; i < 11; i++) {
      const g = 1.1 - i * 0.05
      K(boxG(g, 0.2, 1.2).translate(s * (5.55 - i * 0.04), BASE + 4.7 + i * 0.2, (LOBBY_S + GAP_S) / 2), m.ashlarLight)
    }
    const nicheS = arch(new THREE.Shape(), s * 5.55, BASE + 0.1, 0.9, 2.5, 1)
    K(subtract(nicheS, 0.04, LOBBY_S - 0.04), m.plasterDark)
  })

  // --- Exterior: body windows and eave moldings ---
  const outerBay = (cx: number, y: number, cz: number, ry: number, g: number, h: number, pointed: boolean) => {
    const ext = (a: THREE.BufferGeometry, mat: Mat) => K(place(a, cx, 0, cz, ry), mat)
    ext(boxK(-g / 2 - 0.18, g / 2 + 0.18, y - 0.16, y + h + 0.16, -0.02, 0.08), m.ashlarLight)
    ext(new THREE.PlaneGeometry(g, h).translate(0, y + h / 2, 0.09), m.ironDark)
    if (pointed) {
      const s = arch(new THREE.Shape(), 0, y + h + 0.2, g + 0.3, 0.02, g * 0.55)
      s.holes.push(arch(new THREE.Path(), 0, y + h + 0.3, g - 0.15, 0.02, g * 0.36))
      ext(subtract(s, 0.08), m.ashlarLight)
    }
  }
  double((s) => {
    // Side facade: seven windows above, two below (inventory p. 178)
    for (let i = 0; i < 7; i++) outerBay(s * (W + 0.0), 8.6, -11.5 + i * 3, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.85, 1.3, false)
    for (const z of [-4.6, 3.3]) outerBay(s * W, 2.9, z, s > 0 ? Math.PI / 2 : -Math.PI / 2, 1, 1.6, true)
    // Southeast and southwest corners
    for (const x of [10.4, 13.9]) outerBay(s * x, 8.6, BODY_S, 0, 0.85, 1.3, false)
    // Mihrab section
    for (const z of [10, 14.5]) {
      outerBay(s * SIDE_X, 8.6, z, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.85, 1.3, false)
      outerBay(s * SIDE_X, 2.9, z, s > 0 ? Math.PI / 2 : -Math.PI / 2, 1, 1.6, true)
    }
    outerBay(s * 3.2, 8.6, OUT_S, 0, 0.85, 1.3, false)
    outerBay(s * 3.2, 2.9, OUT_S, 0, 1, 1.6, true)
  })
  // Stone eave molding
  molding(K, m.ashlarLight, -W - 0.1, W + 0.1, BODY_H - 0.3, BODY_H, N1, BODY_S + 0.1, 0.5)
  molding(K, m.ashlarLight, -SIDE_X - 0.1, SIDE_X + 0.1, BODY_H + 0.7, BODY_H + 1, BODY_S, OUT_S + 0.1, 0.5)

  // --- Roof: hipped roofs of the two bodies ---
  const midDome = { x: 0, z: (LOBBY_N + LOBBY_S) / 2, r: 6.4 }
  const iwanX = (SIDE_X + IW_OUT) / 2, iwanZ = (LOBBY_N + IW_S) / 2
  const mihZ = (GAP_S + MIH_S) / 2
  roof((g) => kRoof.add(g, m.lead), -W, W, N1, BODY_S, BODY_H, ROOF_TOP, 0.5, 2.3, [
    midDome, { x: iwanX, z: iwanZ, r: 3.45 }, { x: -iwanX, z: iwanZ, r: 3.45 },
  ])
  roof((g) => kRoof.add(g, m.lead), -SIDE_X, SIDE_X, BODY_S - 0.5, OUT_S, BODY_H + 1, ROOF_TOP + 0.1, 0.5, 0.8, [{ x: 0, z: mihZ, r: 5.9 }])

  // --- Drums and domes ---
  const room = (cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, yWall: number, yRing: number, R: number, drumH: number, domeH: number, edge: number, window: number) => {
    kRoof.add(pendentiveG(cx, cz, x0, x1, z0, z1, yWall, yRing, R), m.plasterInner)
    // Inner drum, band and windows
    kDrum.add(place(flatShadow(cylinderG(R, R, drumH, edge, true).rotateY(Math.PI / edge)), cx, yRing + drumH / 2, cz), m.plasterInner)
    kDrum.add(place(cylinderG(R - 0.03, R - 0.03, 0.3, 32, true), cx, yRing + 0.12, cz), m.band)
    const face = R * Math.cos(Math.PI / edge) - 0.05
    for (let n = 0; n < window; n++) {
      const a = (n / window) * Math.PI * 2
      const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, yRing + 0.42, drumH * 0.5, drumH * 0.28, drumH * 0.26), 8).translate(0, 0, face).rotateY(a)
      kDrum.add(place(g, cx, 0, cz), m.transom)
    }
    // Inner dome and center
    kDome.add(place(innerDomeG(R, domeH), cx, yRing + drumH, cz), m.plasterInner)
    kDome.add(place(cylinderG(R - 0.02, R - 0.02, 0.26, 32, true), cx, yRing + drumH + 0.14, cz), m.band)
    const gr = R * 0.42
    const boss = new THREE.CircleGeometry(gr, 32).rotateX(Math.PI / 2)
    kDome.add(boss.translate(cx, yRing + drumH + domeH * Math.sin(Math.acos(Math.min(1, gr / R))) - 0.02, cz), m.boss)
  }
  // Central space of the prayer hall: octagonal drum with four windows (p. 172)
  room(0, midDome.z, -LOBBY_X, LOBBY_X, LOBBY_N, LOBBY_S, 10.9, 14.6, 6.05, 1.7, 5.4, 8, 4)
  outerDrum(ext3, kDrum, m, 0, midDome.z, ROOF_TOP - 0.3, 3.2, 7.45, 8, 4)
  outerDome(ext3, kDome, m, 0, midDome.z, ROOF_TOP + 2.85, 7.5, 6.1, 1.2)
  // Mihrab section: 11.50 m diameter dome, drum with four windows (p. 176)
  room(0, mihZ, -MIH_X, MIH_X, GAP_S, MIH_S, 11.2, 14.4, MIH_X - 0.02, 1.5, 5, 16, 4)
  outerDrum(ext3, kDrum, m, 0, mihZ, BODY_H + 0.8, 3.1, 7.05, 24, 4)
  outerDome(ext3, kDome, m, 0, mihZ, BODY_H + 3.65, 7.2, 5.7, 1.2)
  // Side iwans: small domes with three windows (p. 172)
  double((s) => {
    const [x0, x1] = mirror(s, SIDE_X, IW_OUT)
    room(s * iwanX, iwanZ, x0, x1, LOBBY_N, IW_S, 8.7, 11, 3.3, 1.2, 2.5, 8, 3)
    outerDrum(ext3, kDrum, m, s * iwanX, iwanZ, ROOF_TOP - 0.25, 1.1, 3.95, 8, 0)
    outerDome(ext3, kDome, m, s * iwanX, iwanZ, ROOF_TOP + 0.8, 4.05, 2.7, 0.8)
  })

  // --- Minarets: stone base, cylindrical brick shaft, two rings, single balcony, lead cone (p. 180) ---
  double((s) => {
    const x = s * (W + 1.85), z = -12
    const e = (g: THREE.BufferGeometry, mat: Mat) => K(place(g, x, 0, z), mat)
    e(boxG(3.6, 8.6, 3.6).translate(0, 4.3, 0), m.ashlar)
    e(flatShadow(cylinderG(1.5, 2.1, 1.6, 12)).translate(0, 9.4, 0), m.ashlar)
    e(cylinderG(1.42, 1.5, 22, 20).translate(0, 21, 0), m.brick)
    for (const y of [13.5, 24.5]) e(cylinderG(1.62, 1.62, 0.5, 20).translate(0, y, 0), m.ashlarLight)
    for (let i = 0; i < 4; i++) e(cylinderG(1.5 + (i + 1) * 0.22, 1.5 + i * 0.22, 0.42, 20).translate(0, 32.2 + i * 0.42, 0), m.ashlarLight)
    e(cylinderG(2.6, 2.6, 0.2, 20).translate(0, 33.95, 0), m.ashlarLight)
    e(cylinderG(2.42, 2.42, 0.95, 20, true).translate(0, 34.5, 0), m.ashlarLight)
    e(cylinderG(1.15, 1.25, 4.4, 16).translate(0, 36.2, 0), m.brick)
    e(cylinderG(1.42, 1.25, 0.28, 16).translate(0, 38.5, 0), m.ashlarLight)
    e(rotateG([[1.34, 38.6], [0.06, 45.2], [0, 45.5]], 12, [1, 1]), m.lead)
    e(rotateG([[0.08, 45.3], [0.16, 45.55], [0.04, 45.8], [0.1, 46], [0.01, 46.4], [0, 46.45]], 8), m.gold)
  })

  // ===== INTERIOR =====
  // Carpeted floors
  box(-LOBBY_X - 0.01, LOBBY_X + 0.01, BASE - 0.03, BASE + 0.02, LOBBY_N, LOBBY_S, m.carpetT)
  double((s) => {
    const [x0, x1] = mirror(s, LOBBY_X, IW_OUT)
    box(x0, x1, BASE, BASE + HIGH, LOBBY_N, IW_S, m.plasterInner)
    box(x0, x1, BASE + HIGH, BASE + HIGH + 0.02, LOBBY_N, IW_S, m.carpetT)
    const [tx0, tx1] = mirror(s, SIDE_X - 1.5, TAB_D)
    box(tx0, tx1, BASE - 0.03, BASE + 0.02, TAB_N, TAB_S, m.carpetT)
  })
  box(-MIH_X, MIH_X, BASE, BASE + HIGH, LOBBY_S, MIH_S, m.plasterInner)
  box(-MIH_X, MIH_X, BASE + HIGH, BASE + HIGH + 0.02, LOBBY_S, MIH_S, m.carpetT)
  // Steps: two steps on the central axis, wooden handrail
  const stairs = (x0: number, x1: number, z0: number, z1: number, xAxis: boolean) => {
    for (let i = 0; i < 2; i++) {
      if (xAxis) box(x0 - 0.3 * (2 - i), x1 + 0.0, BASE, BASE + 0.2 * (i + 1), z0, z1, m.carpetT)
      else box(x0, x1, BASE, BASE + 0.2 * (i + 1), z0 - 0.3 * (2 - i), z1, m.carpetT)
    }
  }
  stairs(-1.1, 1.1, LOBBY_S, LOBBY_S + 0.02, false)
  for (const x of [-1.15, 1.15]) {
    K(boxG(0.08, 0.9, 0.08).translate(x, BASE + 0.65, LOBBY_S - 0.6), m.woodDark)
    K(boxG(0.06, 0.06, 1.3).translate(x, BASE + 1.05, LOBBY_S).rotateX(0), m.woodDark)
  }
  double((s) => {
    const gX = s > 0 ? LOBBY_X : -LOBBY_X
    for (let i = 0; i < 2; i++) {
      const d = 0.3 * (2 - i)
      const [ax, bx] = s > 0 ? [gX - d, gX + 0.02] : [gX - 0.02, gX + d]
      box(ax, bx, BASE, BASE + 0.2 * (i + 1), iwanZ - 1, iwanZ + 1, m.carpetT)
    }
    for (const dz of [-1.05, 1.05]) K(boxG(1.3, 0.06, 0.06).translate(gX, BASE + 1.05, iwanZ + dz), m.woodDark)
    // Shoe niches
    for (const dz of [-2.4, 2.1]) K(boxG(0.03, 0.22, 0.7).translate(gX - s * 0.01, BASE + 0.2, iwanZ + dz), m.plasterDark)
  })
  for (const dx of [-3.2, 3.2]) K(boxG(0.7, 0.22, 0.03).translate(dx, BASE + 0.2, LOBBY_S - 0.01), m.plasterDark)
  // Stone-plaster band above the prayer hall walls and iwan plaster
  const innerPanel = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => box(x0, x1, y0, y1, z0, z1, m.plasterInner)
  double((s) => {
    const [ix0, ix1] = mirror(s, SIDE_X, IW_OUT)
    innerPanel(ix0, ix1, BASE, 8.8, LOBBY_N - 0.0, LOBBY_N + 0.04)
    innerPanel(ix0, ix1, BASE, 8.8, IW_S - 0.04, IW_S)
    const [dx0, dx1] = s > 0 ? [IW_OUT - 0.04, IW_OUT] : [-IW_OUT, -IW_OUT + 0.04]
    innerPanel(dx0, dx1, BASE, 8.8, LOBBY_N, IW_S)
    // Iwan window: pointed lunette below, rectangular above on the outer wall
    const pc = s > 0 ? -Math.PI / 2 : Math.PI / 2
    const window = (x: number, y: number, z: number, ry: number, g: number, h: number, mat: Mat) => K(place(new THREE.PlaneGeometry(g, h).translate(0, y + h / 2, 0), x, 0, z, ry), mat)
    window(s * (IW_OUT - 0.05), BASE + HIGH + 1.05, iwanZ, pc, 1.15, 1.45, m.iron)
    window(s * (IW_OUT - 0.05), BASE + HIGH + 3.85, iwanZ, pc, 0.75, 1.05, m.transom)
    K(place(subtract(archFrame(1.9, 2.6), 0.04, 0), s * (IW_OUT - 0.06), BASE + HIGH + 0.85, iwanZ, pc), m.band)
    // Tabhane: wall plaster, upper hearth and shelf niches, cross vault
    const [tx0, tx1] = mirror(s, SIDE_X, TAB_D)
    innerPanel(tx0, tx1, BASE, 7, TAB_N, TAB_N + 0.04)
    const rafZ = TAB_S - 0.03
    innerPanel(tx0, tx1, BASE, 7, TAB_S - 0.04, TAB_S)
    const [px0, px1] = s > 0 ? [SIDE_X, SIDE_X + 0.04] : [-SIDE_X - 0.04, -SIDE_X]
    innerPanel(px0, px1, BASE, 7, TAB_N, TAB_S)
    const [qx0, qx1] = s > 0 ? [TAB_D - 0.04, TAB_D] : [-TAB_D, -TAB_D + 0.04]
    innerPanel(qx0, qx1, BASE, 7, TAB_N, TAB_S)
    const tc = s * (SIDE_X + TAB_D) / 2, tz = (TAB_N + TAB_S) / 2
    // Hearth and two rows of arched shelf niches (based on photo ERD02013)
    for (let j = 0; j < 2; j++) for (let i = -2; i <= 2; i++) {
      if (j === 0 && i === 0) continue
      const nx = tc + i * 1.05, ny = BASE + 1.5 + j * 1.5
      const n = arch(new THREE.Shape(), nx, ny, 0.72, 0.5, 0.4)
      K(new THREE.ShapeGeometry(n, 6).rotateY(Math.PI).translate(2 * nx, 0, rafZ - 0.02), m.plasterDark)
    }
    K(boxG(1.5, 2.3, 0.3).translate(tc, BASE + 1.15, TAB_S - 0.18), m.plasterInner)
    K(boxG(0.9, 1.5, 0.04).translate(tc, BASE + 0.8, TAB_S - 0.35), m.dark)
    // Vault: four triangular faces
    const apex = BASE + 8.6, yk = BASE + 6.6
    const corners = [[tx0, TAB_N], [tx1, TAB_N], [tx1, TAB_S], [tx0, TAB_S]]
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4]
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], yk, a[1], b[0], yk, b[1], tc, apex, tz], 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2))
      g.computeVertexNormals()
      K(g, m.plasterInner)
    }
    K(place(new THREE.PlaneGeometry(1.1, 1.5), s * (TAB_D - 0.05), BASE + 2.2, tz, pc), m.iron)
  })

  // Plaster, band and windows of the mihrab section
  const mihPanel = (x0: number, x1: number, z0: number, z1: number) => box(x0, x1, BASE, 11.25, z0, z1, m.plasterInner)
  mihPanel(-MIH_X, MIH_X, MIH_S - 0.05, MIH_S)
  double((s) => {
    const [a, b] = s > 0 ? [MIH_X - 0.05, MIH_X] : [-MIH_X, -MIH_X + 0.05]
    mihPanel(a, b, GAP_S, MIH_S)
    // Side wall: lower window, upper arched windows with grilles
    const ry = s > 0 ? -Math.PI / 2 : Math.PI / 2, x = s * (MIH_X - 0.06)
    const windows = [8, 14.5]
    for (const z of windows) {
      K(place(new THREE.PlaneGeometry(1.1, 1.75).translate(0, BASE + HIGH + 1.4, 0), x, 0, z, ry), m.iron)
      K(place(boxK(-0.75, 0.75, BASE + HIGH + 0.42, BASE + HIGH + 0.5, 0, 0.08), x, 0, z, ry), m.ashlarLight)
      K(place(subtract(archFrame(1.5, 1.5), 0.03, 0), x, BASE + HIGH + 2.5, z, ry), m.band)
      K(place(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, BASE + HIGH + 2.8, 1, 0.1, 0.5), 6).translate(0, 0, 0.02), x, 0, z, ry), m.latticeLight)
      K(place(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 8.1, 0.8, 0.6, 0.45), 6).translate(0, 0, 0.02), x, 0, z, ry), m.transom)
    }
    // Qibla wall: lower window beside the mihrab and arched window with revzen above
    const dz = MIH_S - 0.07
    K(new THREE.PlaneGeometry(1.1, 1.8).rotateY(Math.PI).translate(s * 3.85, BASE + HIGH + 1.45, dz), m.iron)
    K(boxK(s * 3.85 - 0.75, s * 3.85 + 0.75, BASE + HIGH + 0.48, BASE + HIGH + 0.56, dz - 0.1, dz), m.ashlarLight)
    K(new THREE.PlaneGeometry(1.25, 0.05).translate(0, 0, 0).rotateY(Math.PI).translate(s * 3.85, BASE + HIGH + 2.42, dz), m.ashlarLight)
    K(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, BASE + HIGH + 2.65, 1.15, 0.1, 0.5), 6).rotateY(Math.PI).translate(s * 3.85, 0, dz), m.latticeLight)
    K(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 7.6, 0.95, 1.2, 0.5), 6).rotateY(Math.PI).translate(s * 3.95, 0, dz), m.transom)
  })
  // Mihrab wall: the Drive photo used directly as the wall (plain panel in PUBLIC_BUILD)
  const mihW = 5.08, mihH = 10.03
  K(new THREE.PlaneGeometry(mihW, mihH).rotateY(Math.PI).translate(0, BASE + HIGH + mihH / 2 + 0.02, MIH_S - 0.075), m.mihrabWall)
  box(-MIH_X, MIH_X, 11.05, 11.28, MIH_S - 0.12, MIH_S - 0.05, m.band)
  double((s) => {
    const [a, b] = s > 0 ? [MIH_X - 0.12, MIH_X - 0.05] : [-MIH_X + 0.05, -MIH_X + 0.12]
    box(a, b, 11.05, 11.28, GAP_S, MIH_S, m.band)
  })
  // Prayer hall stone band
  for (const [x0, x1, z0, z1] of [[-LOBBY_X, LOBBY_X, LOBBY_N, LOBBY_N + 0.06], [-LOBBY_X, LOBBY_X, LOBBY_S - 0.06, LOBBY_S], [-LOBBY_X, -LOBBY_X + 0.06, LOBBY_N, LOBBY_S], [LOBBY_X - 0.06, LOBBY_X, LOBBY_N, LOBBY_S]]) box(x0, x1, 10.78, 11, z0, z1, m.band)
  // Panels: from Drive images (absent in PUBLIC_BUILD)
  if (m.medallion) {
    K(new THREE.CircleGeometry(1.2, 28).rotateY(Math.PI).translate(3.95, 6.3, MIH_S - 0.08), m.medallion)
    K(place(new THREE.CircleGeometry(1.25, 28), -MIH_X + 0.07, 5.7, 11.3, Math.PI / 2), m.medallion)
  }
  if (m.plaque) {
    K(new THREE.CircleGeometry(1.2, 28).rotateY(Math.PI).translate(-3.95, 6.3, MIH_S - 0.08), m.plaque)
    K(place(new THREE.CircleGeometry(1.25, 28), MIH_X - 0.07, 5.7, 11.3, -Math.PI / 2), m.plaque)
  }

  // Prayer hall north wall: two arched windows and a vent in the middle
  for (const x of [-2.9, 2.9]) {
    K(new THREE.ShapeGeometry(arch(new THREE.Shape(), x, 7, 1.05, 1.2, 0.7), 6).translate(0, 0, LOBBY_N + 0.03), m.latticeLight)
  }
  K(new THREE.PlaneGeometry(1.2, 0.8).translate(0, 8.1, LOBBY_N + 0.03), m.latticeLight)
  // Above the tabhane door: niche windows with large lokma iron on both sides (b31)
  double((s) => {
    const ry = s > 0 ? -Math.PI / 2 : Math.PI / 2
    K(place(new THREE.PlaneGeometry(1.5, 2.3).translate(0, 7.2, 0), s * (LOBBY_X + 0.02), 0, 1.8, ry), m.ironDark)
    K(place(boxK(-1.0, 1.0, 5.75, 8.6, -0.02, 0.0), s * (LOBBY_X + 0.01), 0, 1.8, ry), m.ashlarLight)
    K(new THREE.BoxGeometry(0.12, 2.9, 0.08).translate(s * (LOBBY_X + 0.02), BASE + 1.45, 1.0), m.woodDark)
    K(new THREE.BoxGeometry(0.12, 2.9, 0.08).translate(s * (LOBBY_X + 0.02), BASE + 1.45, 2.6), m.woodDark)
  })

  // Minbar: wooden, plain, pointed cone; the stair rises toward the qibla (photo ERD01977)
  const MINBAR_X = -4.75, MINBAR_W = 1, RZ0 = 12.2, RZ1 = 15.7, TOP = 2.4
  const ZM = BASE + HIGH
  const step = 12
  for (let i = 0; i < step; i++) {
    const z0 = RZ0 + (RZ1 - RZ0) * (i / step), z1 = RZ0 + (RZ1 - RZ0) * ((i + 1) / step)
    const h = TOP * ((i + 0.5) / step)
    box(MINBAR_X - MINBAR_W / 2, MINBAR_X + MINBAR_W / 2, ZM, ZM + h, z0, z1, m.carpetT)
  }
  const edgeSide = (s: number) => {
    const ks = new THREE.Shape()
    ks.moveTo(RZ0, 0); ks.lineTo(RZ1 + 0.2, TOP); ks.lineTo(RZ1 + 1.4, TOP); ks.lineTo(RZ1 + 1.4, 0); ks.closePath()
    const x = MINBAR_X + s * (MINBAR_W / 2 + 0.04)
    K(subtract(ks, 0.07, 0).rotateY(-Math.PI / 2).translate(x + 0.035, ZM, 0), m.woodLight)
    const kk = new THREE.Shape()
    kk.moveTo(RZ0, 0.2); kk.lineTo(RZ1 + 0.05, TOP + 0.85); kk.lineTo(RZ1 + 0.05, TOP + 0.75); kk.lineTo(RZ0, 0.08); kk.closePath()
    K(subtract(kk, 0.05, 0).rotateY(-Math.PI / 2).translate(x + 0.025, ZM + 0.2, 0), m.woodLight)
  }
  edgeSide(1); edgeSide(-1)
  box(MINBAR_X - MINBAR_W / 2, MINBAR_X + MINBAR_W / 2, ZM, ZM + TOP, RZ1, RZ1 + 1.4, m.woodDark)
  for (const [dx, dz] of [[-0.55, RZ1 + 0.05], [0.55, RZ1 + 0.05], [-0.55, RZ1 + 1.35], [0.55, RZ1 + 1.35]]) K(boxG(0.1, 1.9, 0.1).translate(MINBAR_X + dx, ZM + TOP + 0.95, dz), m.woodLight)
  K(place(flatShadow(cylinderG(0.05, 0.86, 2.5, 8).rotateY(Math.PI / 8)), MINBAR_X, ZM + TOP + 3.2, RZ1 + 0.7), m.goldDark)
  K(place(rotateG([[0.08, 0], [0.15, 0.1], [0.03, 0.28], [0, 0.4]], 8), MINBAR_X, ZM + TOP + 4.43, RZ1 + 0.7), m.gold)
  // Minbar door
  box(MINBAR_X - 0.62, MINBAR_X - 0.5, ZM, ZM + 2.25, RZ0 - 0.35, RZ0 - 0.25, m.woodLight)
  box(MINBAR_X + 0.5, MINBAR_X + 0.62, ZM, ZM + 2.25, RZ0 - 0.35, RZ0 - 0.25, m.woodLight)
  box(MINBAR_X - 0.62, MINBAR_X + 0.62, ZM + 2.25, ZM + 2.55, RZ0 - 0.35, RZ0 - 0.25, m.woodLight)

  // Preaching pulpit (kürsü): plain wood (p. 178)
  box(3.55, 4.75, ZM, ZM + 1, 15.3, 16.5, m.woodDark)
  box(3.5, 4.8, ZM + 1, ZM + 1.12, 15.25, 16.55, m.woodLight)
  box(3.55, 4.75, ZM + 1.12, ZM + 2.2, 16.42, 16.5, m.woodDark)

  // Muezzin's gallery: northwest corner of the prayer hall, four posts and railing; reached by stairs (photo ERD01991)
  const MAH = { x0: -5.95, x1: -2.3, z0: LOBBY_N, z1: -5.9, h: 2.9 }
  const MY = BASE + MAH.h
  box(MAH.x0, MAH.x1, MY - 0.18, MY, MAH.z0, MAH.z1, m.woodDark)
  box(MAH.x0, MAH.x1, MY - 0.42, MY - 0.18, MAH.z1 - 0.1, MAH.z1, m.woodLight)
  for (const x of [MAH.x0 + 0.1, -4.1, MAH.x1 - 0.1]) K(boxG(0.2, MAH.h - 0.2, 0.2).translate(x, BASE + (MAH.h - 0.2) / 2, MAH.z1 - 0.12), m.woodDark)
  for (const [x0, x1, z0, z1] of [[MAH.x0, -4.72, MAH.z1 - 0.06, MAH.z1], [-3.8, MAH.x1, MAH.z1 - 0.06, MAH.z1], [MAH.x1 - 0.06, MAH.x1, MAH.z0, MAH.z1]]) {
    box(x0, x1, MY + 0.94, MY + 1.02, z0, z1, m.woodLight)
    const count = Math.floor(Math.max(x1 - x0, z1 - z0) / 0.16)
    for (let i = 0; i <= count; i++) {
      const t = i / count
      K(boxG(0.04, 0.94, 0.04).translate(x0 + (x1 - x0) * t, MY + 0.47, z0 + (z1 - z0) * t), m.woodDark)
    }
  }
  // Gallery stairs: straight run, from the floor to the platform
  const MRZ0 = MAH.z1, MRZ1 = -2.3
  const madim = 14
  for (let i = 0; i < madim; i++) {
    const h = MAH.h * (1 - (i + 0.5) / madim)
    box(-4.72, -3.8, BASE, BASE + h, MRZ0 + (MRZ1 - MRZ0) * (i / madim), MRZ0 + (MRZ1 - MRZ0) * ((i + 1) / madim), m.carpetT)
  }
  for (const x of [-4.76, -3.76]) {
    const ks = new THREE.Shape()
    ks.moveTo(MRZ1, 0.9); ks.lineTo(MRZ0, MAH.h + 1); ks.lineTo(MRZ0, MAH.h + 0.9); ks.lineTo(MRZ1, 0.8); ks.closePath()
    K(subtract(ks, 0.05, 0).rotateY(-Math.PI / 2).translate(x + 0.025, BASE, 0), m.woodLight)
  }
  // Shoe racks: on both sides of the door (photo)
  for (const [x0, x1] of [[1.4, 5.8], [-2.1, -1.3]] as const) {
    box(x0, x1, BASE, BASE + 0.85, LOBBY_N, LOBBY_N + 0.4, m.woodLight)
  }
  // Chandeliers
  chandelier(k, m, 0, 5.4, midDome.z, 3.2, 21, 22)
  chandelier(k, m, 0, 5.8, mihZ, 3, 20.6, 20)
  double((s) => chandelier(k, m, s * iwanX, 5.2, iwanZ, 1.15, 12.5, 8))

  // ===== WALKING =====
  const K0 = (x0: number, x1: number, z0: number, z1: number, top?: number): Box => ({ x0, x1, z0, z1, ...(top === undefined ? {} : { top }) })
  const boxes: Box[] = []
  const all = (x0: number, x1: number, z0: number, z1: number, top?: number) => { boxes.push(K0(x0, x1, z0, z1, top), K0(-x1, -x0, z0, z1, top)) }
  // Late-comers' portico: dividing arch piers; front facade and side wall are the limit
  for (const d of [POLE[0], POLE[1]]) { all(d - 0.6, d + 0.6, N_IN, nzMid - 1.75); all(d - 0.6, d + 0.6, nzMid + 1.75, N1) }
  // Portico wall: only the middle niche is open
  all(1.7, IW_OUT + 1, N1, -9.2)
  all(1, IW_OUT + 1, -9.2, LOBBY_N)
  // Prayer hall side walls: iwan arch and tabhane door
  all(LOBBY_X, SIDE_X, LOBBY_N, -7.6)
  all(LOBBY_X, SIDE_X, -1.65, 1)
  all(LOBBY_X, SIDE_X, 2.6, LOBBY_S)
  // Between iwan and tabhane, and tabhane outer infill
  all(SIDE_X, IW_OUT + 1, IW_S, TAB_N)
  all(TAB_D, IW_OUT + 1, TAB_N, TAB_S)
  all(SIDE_X, IW_OUT + 1, TAB_S, MIH_S)
  // Intermediate arch and side walls of the mihrab section
  all(4.9, SIDE_X + 1, LOBBY_S, GAP_S)
  all(MIH_X, SIDE_X + 1, GAP_S, MIH_S)
  // From the prayer hall, the iwans/mihrab section are reached only via the steps
  all(LOBBY_X - 0.06, LOBBY_X, -7.6, iwanZ - 1.1, HIGH)
  all(LOBBY_X - 0.06, LOBBY_X, iwanZ + 1.1, -1.65, HIGH)
  all(1.15, 4.9, LOBBY_S - 0.06, LOBBY_S, HIGH)
  // Furnishings
  boxes.push(
    K0(MINBAR_X - MINBAR_W / 2 - 0.07, MINBAR_X + MINBAR_W / 2 + 0.07, RZ1 + 1.42, MIH_S), // behind the minbar
    K0(3.55, 4.75, 15.3, MIH_S), // kürsü
    K0(1.4, 5.8, LOBBY_N, LOBBY_N + 0.4), K0(-2.1, -1.3, LOBBY_N, LOBBY_N + 0.4), // shelves
    K0(MAH.x0 + 0, MAH.x0 + 0.2, MAH.z1 - 0.22, MAH.z1 - 0.02), K0(-4.2, -4, MAH.z1 - 0.22, MAH.z1 - 0.02), K0(MAH.x1 - 0.2, MAH.x1, MAH.z1 - 0.22, MAH.z1 - 0.02),
    K0(-MIH_X, MIH_X, MIH_S - 0.1, MIH_S),
  )
  const floors: FloorArea[] = [
    // Side iwans and mihrab section: two steps higher
    { x0: LOBBY_X, x1: IW_OUT, z0: LOBBY_N, z1: IW_S, h0: HIGH, h1: HIGH },
    { x0: -IW_OUT, x1: -LOBBY_X, z0: LOBBY_N, z1: IW_S, h0: HIGH, h1: HIGH },
    { x0: -MIH_X - 1, x1: MIH_X + 1, z0: LOBBY_S, z1: MIH_S, h0: HIGH, h1: HIGH },
    // Late-comers' portico side platforms
    { x0: POLE[0], x1: IW_OUT, z0: N_IN, z1: N1, h0: SOFA, h1: SOFA },
    { x0: -IW_OUT, x1: -POLE[0], z0: N_IN, z1: N1, h0: SOFA, h1: SOFA },
    // Minbar stairs and kiosk
    { x0: MINBAR_X - MINBAR_W / 2, x1: MINBAR_X + MINBAR_W / 2, z0: RZ0, z1: RZ1, h0: HIGH, h1: HIGH + TOP },
    { x0: MINBAR_X - MINBAR_W / 2, x1: MINBAR_X + MINBAR_W / 2, z0: RZ1, z1: RZ1 + 1.4, h0: HIGH + TOP, h1: HIGH + TOP },
    // Gallery: passable underneath, reached by stairs
    { x0: MAH.x0, x1: MAH.x1, z0: MAH.z0, z1: MAH.z1, h0: MAH.h, h1: MAH.h, underPassable: true },
    { x0: -4.72, x1: -3.8, z0: MRZ0, z1: MRZ1, h0: MAH.h, h1: 0 },
  ]
  const viewBlockers: Box[] = [
    K0(-W, -1.7, N1, LOBBY_N), K0(1.7, W, N1, LOBBY_N),
    K0(LOBBY_X, SIDE_X, -1.65, LOBBY_S), K0(-SIDE_X, -LOBBY_X, -1.65, LOBBY_S),
    K0(4.9, SIDE_X, LOBBY_S, GAP_S), K0(-SIDE_X, -4.9, LOBBY_S, GAP_S),
    K0(SIDE_X, W, IW_S, TAB_N), K0(-W, -SIDE_X, IW_S, TAB_N),
    K0(MIH_X, W, TAB_S, OUT_S), K0(-W, -MIH_X, TAB_S, OUT_S),
  ]
  return {
    limit: { x0: -IW_OUT, x1: IW_OUT, z0: N_IN, z1: MIH_S },
    boxes: boxes.filter((b) => b.x1 > b.x0 && b.z1 > b.z0),
    circles: [],
    floors,
    viewBlockers,
    eyeY: BAY_Y,
    baseY: BASE,
  }
}

/** Small dome inside: single-piece surface. */
function innerDomeG(R: number, H: number) {
  const p: [number, number][] = []
  for (let t = 0; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    p.push([R * Math.cos(a), H * Math.sin(a)])
  }
  return rotateG(p, 40, [1, 1])
}

function archFrame(g: number, h: number) {
  const s = arch(new THREE.Shape(), 0, 0, g, h * 0.55, h * 0.45)
  s.holes.push(arch(new THREE.Path(), 0, 0, g - 0.24, h * 0.55, h * 0.45 - 0.18))
  return s
}
