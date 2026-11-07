// The complex's other buildings: Yeşil Türbe, madrasa, imaret and courtyard şadırvan. Dimensions from the inventory (pp. 119, 125, 127, 138);
// distances between buildings are shortened to fit the model; their directions follow the source.
import * as THREE from 'three'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, place, type Mat } from '../../uluMosquePiece'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { GreenMaterials } from './textures'
import { domeOuter } from './outer'
import { polygon, align, hipRoof, plaque, prism } from './help'

/** Yeşil Türbe: octagonal, side 8.20 m; eave 13.83 m; total 25.5 m (p. 138). */
export function greenTomb(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, kDrum: Bucket, kDome: Bucket, cx: number, cz: number) {
  const EDGE = 8.2, R = EDGE / (2 * Math.sin(Math.PI / 8)), APOT = EDGE / (2 * Math.tan(Math.PI / 8))
  const EAVE = 13.83, BASE_H = 1.6
  // Elevation: small hill and terrace (p. 137)
  k.add(place(flatShadow(rotateG([[R + 7, 0], [R + 5.6, 0.8], [R + 2.2, 1], [0.01, 1]], 8)).rotateY(Math.PI / 8), cx, 0, cz), m.marbleDark)
  const Y0 = 1
  k.add(prism(polygon(8, R + 0.55, cx, cz), Y0, Y0 + BASE_H), m.marble)
  k.add(prism(polygon(8, R + 0.8, cx, cz), Y0, Y0 + 0.5), m.marbleDark)
  k.add(prism(polygon(8, R, cx, cz), Y0 + BASE_H, EAVE + Y0), ym.tombTile)
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 4 * n
    const ext = (g: THREE.BufferGeometry, mat: Mat) => {
      g.translate(0, 0, APOT).rotateY(a).translate(cx, 0, cz)
      k.add(g, mat)
    }
    const north = n === 4 // clockwise from +z: the fourth face looks north
    const Y = Y0
    // Rectangular marble frame and pointed-arch surface (p. 138)
    const G = 6.9, top = Y + 12.9, alt = Y + 2
    const cer = rect(-G / 2, alt, G / 2, top)
    cer.holes.push(rect(-G / 2 + 0.26, alt + 0.26, G / 2 - 0.26, top - 0.26) as unknown as THREE.Path)
    ext(subtract(cer, 0.08), m.marble)
    const archShape = arch(new THREE.Shape(), 0, Y + 5.7, G - 0.75, 1, 3.8)
    archShape.holes.push(arch(new THREE.Path(), 0, Y + 5.7, G - 1.45, 1, 3.3))
    ext(subtract(archShape, 0.06), m.marble)
    for (const s of [-1, 1]) ext(boxG(0.35, 3.72, 0.06).translate(s * (G - 1.1) / 2, Y + 3.86, 0.03), m.marble)
    if (north) {
      // Crown portal: deep niche, muqarnas impression, wooden leaf (p. 140)
      ext(boxG(3.6, 7.2, 0.12).translate(0, Y + 5.6, 0.04), m.marble)
      ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, Y + 2.1, 2.5, 3.3, 1.6), 8).translate(0, 0, 0.11), ym.mahfilTile)
      ext(boxG(1.71, 2.37, 0.1).translate(0, Y + 3.3, 0.14), ym.walnut)
      for (const s of [-1, 1]) ext(boxG(0.05, 2.37, 0.04).translate(s * 0.02, Y + 3.3, 0.2), ym.walnutDark)
      for (let j = 0; j < 4; j++) ext(boxG(2.6 - j * 0.5, 0.28, 0.14 + j * 0.05).translate(0, Y + 6.6 + j * 0.28, 0.11), ym.turquoiseTile)
      continue
    }
    // Lower window: marble frame, navy lunette; upper window: arched lattice (pp. 138, 140)
    ext(subtract(rect(-1.25, Y + 2.8, 1.25, Y + 5.8), 0.1), m.marble)
    ext(new THREE.PlaneGeometry(1.5, 2).translate(0, Y + 4.3, 0.12), ym.iron)
    ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, Y + 5.9, 2.4, 0.3, 1.25), 8).translate(0, 0, 0.1), ym.mahfilTile)
    ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, Y + 8.6, 1.3, 0.75, 0.85), 8).translate(0, 0, 0.09), m.cage)
    const add = arch(new THREE.Shape(), 0, Y + 8.5, 1.75, 0.85, 1.05)
    add.holes.push(arch(new THREE.Path(), 0, Y + 8.6, 1.3, 0.75, 0.85))
    ext(subtract(add, 0.05), m.marble)
  }
  // Eave molding, light-blue tall drum (8 windows), slightly pointed lead dome; total 25.5 m
  k.add(prism(polygon(8, R + 0.22, cx, cz), Y0 + EAVE - 0.1, Y0 + EAVE + 0.42), m.marble)
  k.add(new THREE.CircleGeometry(R + 0.2, 8, Math.PI / 8).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate(cx, Y0 + EAVE + 0.42, cz), m.marble)
  const KY = Y0 + 19.3
  const drumR = R * 0.93
  kDrum.add(prism(polygon(8, drumR, cx, cz), Y0 + EAVE + 0.4, KY), ym.cream)
  kDrum.add(prism(polygon(8, drumR + 0.1, cx, cz), KY - 0.3, KY), m.marble)
  for (let n = 0; n < 8; n++) {
    const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, Y0 + 15.3, 1, 1.2, 0.8), 8).translate(0, 0, drumR * Math.cos(Math.PI / 8) + 0.02)
    kDrum.add(g.rotateY(n * Math.PI / 4).translate(cx, 0, cz), m.cage)
  }
  kDrum.add(new THREE.CircleGeometry(drumR, 8, Math.PI / 8).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate(cx, KY, cz), ym.cream)
  domeOuter(kDome, m, cx, cz, drumR - 0.25, KY, 25.2 - KY, 1.2)
}

/** Madrasa: 36.00 × 38.50 m, open courtyard with three iwans, vaulted portico; domed classroom projecting to the south (pp. 125-127). */
export function greenMadrasa(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket, cx: number, cz: number) {
  const GX = 18, GZ = 19.25, H = 5.6, ICX = 10.2, ICZ = 11.5
  const wall = (ax: number, az: number, bx: number, bz: number, y1: number, mat: Mat) => {
    const L = Math.hypot(bx - ax, bz - az)
    k.add(align(subtract(rect(0, 0, L, y1), 0.8), ax, az, bx, bz), mat)
  }
  const [x0, x1, z0, z1] = [cx - GX, cx + GX, cz - GZ, cz + GZ]
  wall(x0, z0, x0, z1, H, ym.alternatingKind)  // west... normal inward
  wall(x1, z1, x1, z0, H, ym.alternatingKind)
  wall(x1, z0, x0, z0, H, ym.alternatingKind)
  wall(x0, z1, x1, z1, H, ym.alternatingKind)
  // Courtyard inner walls
  const [ax0, ax1, az0, az1] = [cx - ICX, cx + ICX, cz - ICZ, cz + ICZ]
  wall(ax0, az1, ax0, az0, H - 0.2, ym.alternatingKind)
  wall(ax1, az0, ax1, az1, H - 0.2, ym.alternatingKind)
  wall(ax0, az0, ax1, az0, H - 0.2, ym.alternatingKind)
  wall(ax1, az1, ax0, az1, H - 0.2, ym.alternatingKind)
  // Courtyard floor
  k.add(new THREE.PlaneGeometry(ICX * 2, ICZ * 2).rotateX(-Math.PI / 2).translate(cx, 0.03, cz), ym.goggles)
  // Şadırvan: 12-sided, 2.60 m diameter; greenery around it (p. 127)
  k.add(flatShadow(cylinderG(4.6, 4.8, 0.22, 24)).translate(cx, 0.14, cz), ym.grass)
  k.add(flatShadow(cylinderG(1.3, 1.36, 0.55, 12)).translate(cx, 0.5, cz), m.marble)
  k.add(cylinderG(1.2, 1.2, 0.02, 12).translate(cx, 0.78, cz), m.water)
  // Portico: columns, pointed-arch band and tile cover
  const portico = (ax: number, az: number, bx: number, bz: number, count: number) => {
    const L = Math.hypot(bx - ax, bz - az), step = L / count
    for (let i = 0; i <= count; i++) {
      const t = i / count
      k.add(place(cylinderG(0.26, 0.3, 3.3, 10), ax + (bx - ax) * t, 1.65, az + (bz - az) * t), m.marble)
    }
    for (let i = 0; i < count; i++) {
      const s = rect(i * step, 3.1, (i + 1) * step, 4.8)
      s.holes.push(arch(new THREE.Path(), (i + 0.5) * step, 3.2, step - 0.5, 0.1, 1.3))
      k.add(align(subtract(s, 0.45), ax, az, bx, bz), ym.alternatingKind)
    }
  }
  const R = 2.8
  portico(ax0 + R, az0 + R, ax0 + R, az1 - R + 0, 5)
  portico(ax1 - R, az1 - R, ax1 - R, az0 + R, 5)
  portico(ax1 - R, az0 + R, ax0 + R, az0 + R, 5)
  portico(ax0 + R, az1 - R, ax1 - R, az1 - R, 5)
  // Portico cover: sloped tiles facing the courtyard
  const slope = (a: number[], b: number[], c: number[], d: number[]) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
    const uvx = (p: number[]) => [p[0] + p[2], p[1] * 2 + (p[0] - p[2]) * 0.2]
    g.setAttribute('uv', new THREE.Float32BufferAttribute([...uvx(a), ...uvx(b), ...uvx(c), ...uvx(a), ...uvx(c), ...uvx(d)], 2))
    g.computeVertexNormals()
    kRoof.add(g, ym.roofTile)
  }
  const low = 4.9, tall = 6
  slope([ax0 + R, low, az1 - R], [ax1 - R, low, az1 - R], [ax1, tall, az1], [ax0, tall, az1])
  slope([ax1 - R, low, az0 + R], [ax0 + R, low, az0 + R], [ax0, tall, az0], [ax1, tall, az0])
  slope([ax0 + R, low, az0 + R], [ax0 + R, low, az1 - R], [ax0, tall, az1], [ax0, tall, az0])
  slope([ax1 - R, low, az1 - R], [ax1 - R, low, az0 + R], [ax1, tall, az0], [ax1, tall, az1])
  // Hipped roofs of the cell wings
  const P = 0.45
  kRoof.add(hipRoof(x0 - P, x1 + P, z0 - P, az0, H - 0.05, 2.6), ym.roofTile)
  kRoof.add(hipRoof(x0 - P, x1 + P, az1, z1 + P, H - 0.05, 2.6), ym.roofTile)
  kRoof.add(hipRoof(x0 - P, ax0, az0 - 0.2, az1 + 0.2, H - 0.05, 2.6), ym.roofTile)
  kRoof.add(hipRoof(ax1, x1 + P, az0 - 0.2, az1 + 0.2, H - 0.05, 2.6), ym.roofTile)
  // Cap: hide the void under the roof
  for (const [a, b, c, d] of [[x0, x1, z0, az0], [x0, x1, az1, z1], [x0, ax0, az0, az1], [ax1, x1, az0, az1]]) {
    k.add(new THREE.PlaneGeometry(b - a, d - c).rotateX(-Math.PI / 2).translate((a + b) / 2, H - 0.06, (c + d) / 2), ym.goggles)
  }
  // Exterior facade windows: rectangular stone frame, pointed arch, turquoise lunette (p. 130)
  const windowFace = (ax: number, az: number, bx: number, bz: number, u: number) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(align(g, ax, az, bx, bz), mat)
    ext(subtract(rect(u - 0.95, 0.9, u + 0.95, 3.1), 0.12), m.marble)
    ext(new THREE.PlaneGeometry(1.15, 1.65).translate(u, 1.95, 0.14), ym.iron)
    const ring = arch(new THREE.Shape(), u, 3.1, 2.3, 0.04, 1.65)
    ring.holes.push(arch(new THREE.Path(), u, 3.1, 1.75, 0.04, 1.3))
    ext(subtract(ring, 0.14), m.marble)
    plaque(k, arch(new THREE.Shape(), u, 3.1, 1.75, 0.04, 1.3), ax, az, bx, bz, ym.turquoiseTile, 0, 0.1, false)
  }
  const countX = 7, countZ = 7
  for (let i = 0; i < countX; i++) {
    const u = (i + 0.5) * (2 * GX) / countX
    if (i !== 3) windowFace(x1, z0, x0, z0, u)
    windowFace(x0, z1, x1, z1, u)
  }
  for (let i = 0; i < countZ; i++) {
    const u = (i + 0.5) * (2 * GZ) / countZ
    windowFace(x0, z0, x0, z1, u)
    windowFace(x1, z1, x1, z0, u)
  }
  // North entrance: tall pointed-arch opening, marble door, turquoise lunette (p. 127)
  const entrance = (g: THREE.BufferGeometry, mat: Mat) => k.add(align(g, x1, z0, x0, z0), mat)
  const uK = GX
  entrance(subtract(rect(uK - 2.5, 0, uK + 2.5, H + 1.4), 0.5), m.stone)
  entrance(new THREE.ShapeGeometry(arch(new THREE.Shape(), uK, 0, 3.5, 3.2, 1.9), 10).translate(0, 0, 0.51), m.dark)
  entrance(boxG(1.7, 2.6, 0.08).translate(uK, 1.3, 0.54), ym.walnut)
  entrance(new THREE.ShapeGeometry(arch(new THREE.Shape(), uK, 2.7, 2.1, 0.1, 1.1), 8).translate(0, 0, 0.54), ym.turquoiseTile)
  kRoof.add(hipRoof(cx - 3, cx + 3, z0 - 1.5, z0 + 3, H + 1.3, 1.4), ym.roofTile)
  // Chimneys (as in the photo)
  for (const [ux, uz] of [[-12, -15], [12, -15], [-14, 8], [14, 8], [-15, -4], [15, -4]]) {
    k.add(place(boxG(0.7, 2.6, 0.7), cx + ux, H + 1.9, cz + uz), ym.alternatingKind)
    k.add(place(flatShadow(cylinderG(0.05, 0.62, 0.5, 4).rotateY(Math.PI / 4)), cx + ux, H + 3.4, cz + uz), ym.roofTile)
  }
  // Classroom: square, projecting south on the north-south axis; 10 m diameter lead dome, octagonal drum (pp. 125, 127)
  const DG = 6.9, DZ0 = z1 - 0.8, DZ1 = z1 + 12.5, DH = 8.5
  const [dx0, dx1] = [cx - DG, cx + DG]
  wall(dx0, DZ0, dx0, DZ1, DH, m.stone)
  wall(dx1, DZ1, dx1, DZ0, DH, m.stone)
  wall(dx0, DZ1, dx1, DZ1, DH, m.stone)
  for (const s of [-1, 1]) windowFace(s > 0 ? dx1 : dx0, s > 0 ? DZ1 : DZ0, s > 0 ? dx1 : dx0, s > 0 ? DZ0 : DZ1, (DZ1 - DZ0) / 2)
  windowFace(dx0, DZ1, dx1, DZ1, DG)
  k.add(new THREE.PlaneGeometry(DG * 2 + 0.6, DZ1 - DZ0 + 0.6).rotateX(-Math.PI / 2).translate(cx, DH + 0.02, (DZ0 + DZ1) / 2), m.marble)
  kDrum.add(prism(polygon(8, 6.8, cx, (DZ0 + DZ1) / 2), DH, DH + 2.2), ym.alternatingKind)
  kDrum.add(prism(polygon(8, 6.9, cx, (DZ0 + DZ1) / 2), DH + 2, DH + 2.3), m.marble)
  for (let n = 0; n < 8; n++) {
    const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, DH + 0.3, 1, 0.5, 0.65), 8).translate(0, 0, 6.3)
    kDrum.add(g.rotateY(n * Math.PI / 4).translate(cx, 0, (DZ0 + DZ1) / 2), m.cage)
  }
  domeOuter(kDome, m, cx, (DZ0 + DZ1) / 2, 5.5, DH + 2.25, 4.8, 1.05)
}

/** İmaret: 26 × 10 m kitchen + 16.30 × 10 m dining hall, hipped tile roof, tile-clad double dome (p. 119). */
export function greenImaret(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, kRoof: Bucket, kDome: Bucket, x0: number, z0: number) {
  const D = 10, H = 5.2, L1 = 26, L2 = 16.3
  const wall = (ax: number, az: number, bx: number, bz: number) => {
    const L = Math.hypot(bx - ax, bz - az)
    k.add(align(subtract(rect(0, 0, L, H), 0.7), ax, az, bx, bz), ym.alternating)
  }
  const x1 = x0 + L1 + L2, z1 = z0 + D
  wall(x0, z1, x1, z1); wall(x1, z0, x0, z0); wall(x0, z0, x0, z1); wall(x1, z1, x1, z0)
  k.add(new THREE.PlaneGeometry(L1 + L2, D).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, H - 0.02, (z0 + z1) / 2), ym.goggles)
  kRoof.add(hipRoof(x0 - 0.5, x0 + L1 + 0.1, z0 - 0.5, z1 + 0.5, H, 2.5), ym.roofTile)
  kRoof.add(hipRoof(x0 + L1 - 0.1, x1 + 0.5, z0 - 0.5, z1 + 0.5, H - 0.2, 2.5), ym.roofTile)
  // Tile-clad double dome: rises from the kitchen roof
  for (const x of [x0 + 8, x0 + 16]) {
    kDome.add(place(cylinderG(2.6, 2.75, 1.4, 12), x, H + 2.3, (z0 + z1) / 2), ym.alternating)
    kDome.add(place(rotateG([[2.95, 0], [2.6, 0.3], [2.2, 0.95], [1.3, 1.65], [0.3, 2.1], [0, 2.15]], 18, [1, 1]), x, H + 3, (z0 + z1) / 2), ym.roofTile)
  }
  // North-facing facade: four pointed-arch openings and round-arched windows (pp. 119-120)
  const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(align(g, x1, z0, x0, z0), mat)
  for (let i = 0; i < 4; i++) {
    const u = L2 + 4 + i * 5.8
    ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), u, 0, 2.4, 1.8, 1.3), 8).translate(0, 0, 0.02), m.dark)
    const hk = arch(new THREE.Shape(), u, 0, 3, 1.8, 1.65)
    hk.holes.push(arch(new THREE.Path(), u, 0.01, 2.4, 1.8, 1.3))
    ext(subtract(hk, 0.1), m.brick)
  }
  for (let i = 0; i < 3; i++) {
    const u = 3.5 + i * 4.5
    ext(new THREE.CircleGeometry(0.7, 12, 0, Math.PI).translate(u, 3, 0.02), m.dark)
    ext(new THREE.PlaneGeometry(1.4, 1.5).translate(u, 2.25, 0.02), m.dark)
    ext(boxG(1.7, 0.14, 0.1).translate(u, 1.45, 0.05), m.marble)
  }
  // Monumental entrance and fountain niche with marble trough
  ext(subtract(rect(L2 - 0.4, 0, L2 + 1.8, H + 0.2), 0.3), m.stone)
}

/** Courtyard şadırvan: octagonal, eight wooden columns, lead-covered pointed dome, pool with fountain jet (p. 110). */
export function courtyardFountain(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, kDome: Bucket, cx: number, cz: number) {
  const R = 3.7, H = 4.2
  k.add(flatShadow(cylinderG(R + 0.65, R + 0.75, 0.25, 8)).rotateY(Math.PI / 8).translate(cx, 0.14, cz), m.marble)
  k.add(flatShadow(cylinderG(2.1, 2.15, 0.8, 8)).rotateY(Math.PI / 8).translate(cx, 0.65, cz), m.marble)
  k.add(cylinderG(1.9, 1.9, 0.02, 16).translate(cx, 1.06, cz), m.water)
  k.add(place(rotateG([[0.28, 0], [0.12, 0.3], [0.36, 0.5], [0.1, 0.78], [0, 0.9]], 10), cx, 1.05, cz), m.marble)
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + n * Math.PI / 4
    k.add(place(cylinderG(0.17, 0.2, H, 10), cx + Math.sin(a) * R, H / 2 + 0.25, cz + Math.cos(a) * R), ym.walnut)
  }
  k.add(flatShadow(cylinderG(R + 0.5, R + 0.5, 0.45, 8)).rotateY(Math.PI / 8).translate(cx, H + 0.45, cz), ym.walnut)
  k.add(new THREE.CircleGeometry(R + 0.45, 8, Math.PI / 8).rotateX(Math.PI / 2).rotateY(Math.PI / 2).translate(cx, H + 0.22, cz), ym.walnutDark)
  kDome.add(place(rotateG([[R + 1.1, -0.3], [R + 0.7, 0.05], [3.5, 0.5], [2.6, 1.4], [1.4, 2.6], [0.45, 3.7], [0.05, 4.2]], 32, [1, 1]), cx, H + 0.7, cz), m.dome)
  kDome.add(place(rotateG([[0.1, 0], [0.05, 0.2], [0.14, 0.42], [0.03, 0.75], [0, 0.8]], 8), cx, H + 4.85, cz), m.gold)
}

/** Plane-tree-like tree: a few low-poly spheres. */
export function tree(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, x: number, z: number, length: number, seed: number) {
  k.add(place(cylinderG(0.32, 0.5, length * 0.55, 8), x, length * 0.28, z), m.wood)
  const r = (n: number) => {
    const v = Math.sin(seed * 12.9 + n * 78.2) * 43758.5
    return v - Math.floor(v)
  }
  for (let i = 0; i < 7; i++) {
    const R = length * (0.2 + r(i) * 0.14)
    const a = r(i + 10) * Math.PI * 2, d = length * (0.08 + r(i + 20) * 0.26)
    const g = new THREE.IcosahedronGeometry(R, 1)
    k.add(g.translate(x + Math.sin(a) * d, length * (0.58 + r(i + 30) * 0.32), z + Math.cos(a) * d), i % 2 ? ym.leaf : ym.leafDark)
  }
}
