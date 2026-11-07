// Exterior masses of the complex: madrasa, imaret, hamam, thirteen tombs, hazîre (graveyard), trees. Visited from outside only.
// Buildings with source dimensions: imaret 13 × 40 m, madrasa courtyard 17 × 17 m, hamam cold room 10 × 10 m, II. Murad Türbesi
// 13.45 × 13.45 m, Alâaddin Türbesi 7.25 × 7.80 m, Saraylılar 6.65 m side, Ebe Hatun 4.46 m side (inventory pp. 120-146).
// Layout: read from the bird's-eye photo on p. 113; buildings not in the photo and the hamam are positioned representatively.
import * as THREE from 'three'
import { Bucket, subtract, rect, rotateG, flatShadow, boxG, cylinderG, place } from '../../uluMosquePiece'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { MuradiyeMaterials } from './textures'
import { WEST, EAST, SOUTH, NORTH, type Mat, finial, perforatedPaving, outerDome, drum, archRing, archFace, hipRoof } from './common'

export function complex(m: UluMosqueMaterials, d: MuradiyeMaterials, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {
  const box = (g: number, h: number, dd: number, mat: Mat, x: number, y: number, z: number, kv = k) => kv.add(place(boxG(g, h, dd), x, y, z), mat)
  /** Row of windows on the four faces of a rectangular building. */
  const windowRow = (x: number, z: number, ry: number, L: number, count: number, y: number, g: number, flat: number, hkalin: number, ring: Mat, face: Mat) => {
    for (let i = 0; i < count; i++) {
      const u = -L / 2 + (i + 0.5) * (L / count)
      archFace(k, x, z, ry, u, y, g, flat, g * 0.5, 0.02, face)
      archRing(k, x, z, ry, u, y, g, flat, g * 0.5, hkalin, 0, ring)
    }
  }

  // --- Madrasa: at the west end; the porticoed courtyard is now covered in steel and glass, sixteen cells, classroom iwan to the south (pp. 120-122) ---
  const madrasa = () => {
    const X = -67.6, Z = 0.7, HALF_W = 18, HALF_D = 13.5 // half dimensions: from the photo
    const Y = 6.4
    box(HALF_W * 2, Y, HALF_D * 2, d.alternatingMosque, X, Y / 2, Z)
    box(HALF_W * 2 + 0.5, 0.3, HALF_D * 2 + 0.5, m.brick, X, Y, Z)
    windowRow(X, Z - HALF_D, NORTH, HALF_W * 2, 8, 1.4, 1, 1.5, 0.2, m.brick, m.dark)
    windowRow(X, Z + HALF_D, SOUTH, HALF_W * 2, 6, 1.4, 1, 1.5, 0.2, m.brick, m.dark)
    windowRow(X + HALF_W, Z, EAST, HALF_D * 2, 7, 1.4, 1, 1.5, 0.2, m.brick, m.dark)
    windowRow(X - HALF_W, Z, WEST, HALF_D * 2, 7, 1.4, 1, 1.5, 0.2, m.brick, m.dark)
    // Lead perimeter roof and glass cover
    perforatedPaving(kRoof, X - HALF_W - 0.2, X + HALF_W + 0.2, Z - HALF_D - 0.2, Z + HALF_D + 0.2, 6.56, [], m.lead)
    hipRoof(kRoof, X - HALF_W - 0.2, X + HALF_W + 0.2, Z - HALF_D - 0.2, Z - 8.7, 6.56, 1.1, m.lead)
    hipRoof(kRoof, X - HALF_W - 0.2, X + HALF_W + 0.2, Z + 8.7, Z + HALF_D + 0.2, 6.56, 1.1, m.lead)
    // Glass cover: two tiers (courtyard 17 × 17 m)
    for (const [dx, h, burden] of [[-4.3, 2.2, 1.1], [4.3, 2.6, 1.3]] as const) {
      box(8.6, h, 17, d.glassRoof, X + dx, 6.6 + h / 2, Z, kRoof)
      hipRoof(kRoof, X + dx - 4.6, X + dx + 4.6, Z - 8.9, Z + 8.9, 6.6 + h, burden * 0.55, m.lead)
      for (let i = 0; i <= 8; i++) box(0.08, h, 17.05, d.steel, X + dx - 4.3 + i * 1.075, 6.6 + h / 2, Z, kRoof)
    }
    // Portico domes and chimneys: east and west rows
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      const z = Z - 8 + i * 4
      const x = X + s * 12.6
      outerDome(kDome, x, 6.7, z, 1.6, 1.4, d.leadDome, 18)
      if (i % 2 === 0) {
        box(0.8, 2.6, 0.8, m.brick, x + s * 2.9, 7.6, z + 1.5, kRoof)
        box(1, 0.2, 1, m.marble, x + s * 2.9, 8.95, z + 1.5, kRoof)
      }
    }
    // Crown portal: pointed-arch iwan on the north, dome on squinches
    box(7.6, 8.8, 3, d.brickPattern, X, 4.4, Z - HALF_D - 0.4)
    archFace(k, X, Z - HALF_D - 1.9, NORTH, 0, 0.05, 3.6, 3, 2, 0.02, m.dark)
    archRing(k, X, Z - HALF_D - 1.9, NORTH, 0, 0.05, 3.6, 3, 2, 0.32, 0, m.brick)
    for (let i = 0; i < 16; i++) k.add(place(boxG(0.32, 0.32, 0.32).rotateY(Math.PI / 4), X - 3.6 + i * 0.48, 8.65, Z - HALF_D - 1.9), m.brick)
    drum(kDrum, X, 8.8, 9.6, Z - HALF_D - 0.4, 2.7, 8, d.alternatingMosque, m.brick)
    outerDome(kDome, X, 9.6, Z - HALF_D - 0.4, 2.4, 2.1, d.leadDome, 24)
    // Classroom: domed iwan to the south
    box(10.6, 8.4, 10.6, d.alternatingMosque, X, 4.2, Z + HALF_D + 5.2)
    windowRow(X, Z + HALF_D + 10.5, SOUTH, 10.6, 2, 1.6, 1.3, 1.9, 0.22, m.brick, m.dark)
    windowRow(X + 5.3, Z + HALF_D + 5.2, EAST, 10.6, 2, 1.6, 1.3, 1.9, 0.22, m.brick, m.dark)
    windowRow(X - 5.3, Z + HALF_D + 5.2, WEST, 10.6, 2, 1.6, 1.3, 1.9, 0.22, m.brick, m.dark)
    drum(kDrum, X, 8.3, 9.7, Z + HALF_D + 5.2, 5.6, 8, d.alternatingMosque, m.brick)
    outerDome(kDome, X, 9.7, Z + HALF_D + 5.2, 5.1, 4.2, d.leadDome, 40)
    finial(kDome, X, 13.8, Z + HALF_D + 5.2, m.bronze)
  }
  madrasa()

  // --- İmaret: northeast of the mosque, 13 × 40 m, hipped wooden roof, alaturka tiles (p. 124) ---
  const imaret = () => {
    const X = 35, Z = -21, RY = -0.658 // long axis skewed as in the photo
    const local = new Bucket(), localRoof = new Bucket()
    const G = 13, L = 40, Y = 5.6
    local.add(place(boxG(G, Y, L), 0, Y / 2, 0), d.alternatingMosque)
    local.add(place(boxG(G + 0.4, 0.3, L + 0.4), 0, Y, 0), m.brick)
    hipRoof(localRoof, -G / 2 - 0.5, G / 2 + 0.5, -L / 2 - 0.5, L / 2 + 0.5, Y + 0.1, 3.4, d.roofTile)
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
      const z = -L / 2 + (i + 0.5) * (L / 9)
      const ry = s > 0 ? EAST : WEST
      archFace(local, s * G / 2, z, ry, 0, 1.1, 1, 1.4, 0.5, 0.02, m.dark)
      archRing(local, s * G / 2, z, ry, 0, 1.1, 1, 1.4, 0.5, 0.2, 0, m.brick)
      // Brick ornament with hexagon and star motifs in the pediment
      local.add(place(boxG(1.5, 0.7, 0.04), s * (G / 2 + 0.03), 3.9, z), d.brickPattern)
    }
    // Entrance iwan
    local.add(place(boxG(4.5, 5.8, 1), G / 2 + 0.3, 2.9, 2), d.brickPattern)
    archFace(local, G / 2 + 0.8, 2, EAST, 0, 0.05, 2.2, 2.2, 1.3, 0.02, m.dark)
    archRing(local, G / 2 + 0.8, 2, EAST, 0, 0.05, 2.2, 2.2, 1.3, 0.25, 0, m.brick)
    // Move the local body to its plan position: Bucket accumulates by material, so it is rotated directly here.
    const transfer = (group: THREE.Group, kv: Bucket) => {
      for (const c of group.children) {
        const mesh = c as THREE.Mesh
        const g = mesh.geometry.clone().rotateY(RY).translate(X, 0, Z)
        kv.add(g, mesh.material as Mat)
        mesh.geometry.dispose()
      }
    }
    transfer(local.group(), k)
    transfer(localRoof.group(), kRoof)
  }
  imaret()

  // --- Hamam: west of the madrasa; cold room, octagonal drum, tile dome and skylight lantern (p. 126). Position representative ---
  const bath = () => {
    const X = -98, Z = -6
    box(14, 7.6, 14, d.alternatingRough, X, 3.8, Z)
    box(14.4, 0.25, 14.4, m.brick, X, 7.6, Z)
    for (const [ry, xx, zz] of [[NORTH, X, Z - 7], [EAST, X + 7, Z], [WEST, X - 7, Z]] as const) {
      windowRow(xx, zz, ry, 14, 3, 1.4, 1, 1.7, 0.2, m.brick, m.dark)
      windowRow(xx, zz, ry, 14, 3, 4.8, 0.8, 1, 0.14, m.brick, m.dark)
    }
    // Eight steps and door canopy on the north
    for (let i = 0; i < 8; i++) box(4.4, 0.2 * (8 - i), 0.42, m.marble, X, 0.1 * (8 - i), Z - 7.2 - i * 0.42)
    hipRoof(kRoof, X - 2.6, X + 2.6, Z - 9.4, Z - 7, 4.4, 1, d.roofTile)
    hipRoof(kRoof, X - 7.5, X + 7.5, Z - 7.5, Z + 7.5, 7.7, 2.4, d.roofTile)
    kDrum.add(place(flatShadow(cylinderG(5.8, 5.8, 2.1, 8).rotateY(Math.PI / 8)), X, 10.2, Z), m.cream)
    outerDome(kDome, X, 11.2, Z, 5.8, 2.5, d.roofTile, 8)
    // Lantern
    kDome.add(place(flatShadow(cylinderG(1, 1.1, 1.4, 8)), X, 14.2, Z), m.brick)
    outerDome(kDome, X, 14.9, Z, 1.15, 0.8, d.roofTile, 8)
    // Hot section: long body to the south, small domes
    box(11, 5.6, 19, d.alternatingRough, X, 2.8, Z + 16.5)
    hipRoof(kRoof, X - 5.8, X + 5.8, Z + 7, Z + 26.3, 5.6, 1.5, d.roofTile)
    for (const dz of [13, 21]) {
      kDrum.add(place(flatShadow(cylinderG(2.3, 2.3, 1.1, 8).rotateY(Math.PI / 8)), X, 7.4, Z + dz), m.brick)
      outerDome(kDome, X, 8, Z + dz, 2.2, 1.6, d.roofTile, 12)
    }
  }
  bath()

  // --- Tombs ---
  type Plan = { x: number; z: number; a: number; n: 4 | 6 | 8; h: number; drumH?: number; R?: number; domeH?: number; mat?: Mat; open?: boolean }
  const dome = (p: Plan, y: number, R: number) => {
    const H = p.domeH ?? R * 0.85
    outerDome(kDome, p.x, y, p.z, R, H, d.leadDome, 36)
    finial(kDome, p.x, y + H - 0.05, p.z, m.bronze, 0.8)
  }
  /** Tomb with polygonal or square body: body, molding, windows, drum, lead dome. */
  const tomb = (p: Plan) => {
    const mat = p.mat ?? d.alternatingTomb
    const y0 = 0.5
    box(p.a + 0.6, y0, p.a + 0.6, m.marble, p.x, y0 / 2, p.z)
    const apo = p.a / 2
    if (p.n === 4) {
      box(p.a, p.h, p.a, mat, p.x, y0 + p.h / 2, p.z)
      for (const [ry, xx, zz] of [[NORTH, p.x, p.z - apo], [SOUTH, p.x, p.z + apo], [EAST, p.x + apo, p.z], [WEST, p.x - apo, p.z]] as const) {
        windowRow(xx, zz, ry, p.a, 2, 1.1, 0.8, 1.2, 0.16, m.brick, m.dark)
        archFace(k, xx, zz, ry, 0, p.h - 1.7, 0.7, 0.7, 0.4, 0.02, d.lattice)
      }
      hipRoof(kRoof, p.x - apo - 0.3, p.x + apo + 0.3, p.z - apo - 0.3, p.z + apo + 0.3, y0 + p.h, 0.5, m.lead)
    } else {
      const R = apo / Math.cos(Math.PI / p.n)
      k.add(place(flatShadow(cylinderG(R, R, p.h, p.n).rotateY(Math.PI / p.n)), p.x, y0 + p.h / 2, p.z), mat)
      for (let n = 0; n < p.n; n++) {
        const a = (n * Math.PI * 2) / p.n
        archFace(k, p.x, p.z, a, 0, 1.2, 0.7, 1.1, 0.4, apo + 0.02, m.dark)
        archRing(k, p.x, p.z, a, 0, 1.2, 0.7, 1.1, 0.4, 0.15, apo, m.brick)
        archFace(k, p.x, p.z, a, 0, p.h - 1.7, 0.6, 0.6, 0.35, apo + 0.02, d.lattice)
      }
    }
    const kH = p.drumH ?? 1.6
    const kR = p.R ?? apo * 0.9
    const top = y0 + p.h
    drum(kDrum, p.x, top, top + kH, p.z, kR / Math.cos(Math.PI / 8), p.n === 6 ? 6 : 8, mat, m.brick)
    dome(p, top + kH, kR * 0.96)
  }
  /** Four-pillared baldachin tomb with arches on top, open on all sides (Ebe Hatun). */
  const baldachin = (x: number, z: number, a: number, h: number, pedestal: number) => {
    box(a + 0.8, pedestal, a + 0.8, m.stoneDark, x, pedestal / 2, z)
    const c = a / 2 - 0.39
    for (const s of [-1, 1]) for (const t of [-1, 1]) box(0.78, h, 0.78, d.alternatingTomb, x + s * c, pedestal + h / 2, z + t * c)
    for (const [ry, xx, zz] of [[NORTH, x, z - a / 2], [SOUTH, x, z + a / 2], [EAST, x + a / 2, z], [WEST, x - a / 2, z]] as const) {
      const s = rect(-a / 2, pedestal + h * 0.55, a / 2, pedestal + h)
      const o = a / 2 - 0.78
      s.moveTo(-a / 2, pedestal + h * 0.55)
      const hole = new THREE.Path()
      hole.moveTo(-o, pedestal + h * 0.55 + 0.01); hole.quadraticCurveTo(-o, pedestal + h * 0.8, 0, pedestal + h - 0.15); hole.quadraticCurveTo(o, pedestal + h * 0.8, o, pedestal + h * 0.55 + 0.01); hole.closePath()
      s.holes.push(hole)
      k.add(place(subtract(s, 0.5, -0.5), xx, 0, zz, ry), d.alternatingTomb)
    }
    box(a + 0.3, 0.2, a + 0.3, m.brick, x, pedestal + h + 0.05, z, kRoof)
    outerDome(kDome, x, pedestal + h + 0.15, z, a * 0.42, a * 0.36, d.leadDome, 24)
  }

  // II. Murad Türbesi: two nested squares, octagonal drum, open dome; marble crown portal and wide wooden eave on the north (pp. 130-133)
  const muradTomb = () => {
    const X = -29.5, Z = 31.6, A = 13.45, IC = 6.9
    box(A + 0.8, 0.8, A + 0.8, m.marble, X, 0.4, Z)
    box(A, 6.2, A, d.alternatingTomb, X, 3.9, Z)
    box(A + 0.5, 0.25, A + 0.5, m.brick, X, 7, Z)
    hipRoof(kRoof, X - A / 2 - 0.3, X + A / 2 + 0.3, Z - A / 2 - 0.3, Z + A / 2 + 0.3, 7.1, 0.6, m.lead)
    // Window layout: two each on the door wall and the one opposite, three on the others.
    windowRow(X, Z - A / 2, NORTH, A, 2, 1.8, 1.3, 1.8, 0.22, m.marble, m.dark)
    windowRow(X, Z + A / 2, SOUTH, A, 2, 1.8, 1.3, 1.8, 0.22, m.marble, m.dark)
    windowRow(X + A / 2, Z, EAST, A, 3, 1.8, 1.3, 1.8, 0.22, m.marble, m.dark)
    windowRow(X - A / 2, Z, WEST, A, 3, 1.8, 1.3, 1.8, 0.22, m.marble, m.dark)
    box(IC + 1.6, 3, IC + 1.6, d.alternatingTomb, X, 8.6, Z, kDrum)
    drum(kDrum, X, 10, 11.6, Z, (IC / 2 + 0.8) / Math.cos(Math.PI / 8), 8, d.alternatingTomb, m.brick)
    for (let n = 0; n < 8; n++) archFace(kDrum, X, Z, n * Math.PI / 4, 0, 10.3, 0.8, 0.5, 0.4, IC / 2 + 0.82, d.lattice)
    // Dome open in the middle (p. 131: "üstü açık")
    outerDome(kDome, X, 11.7, Z, IC / 2 + 0.4, 3.4, d.leadDome, 40, 0.75)
    kDome.add(new THREE.TorusGeometry(0.75, 0.1, 6, 20).rotateX(Math.PI / 2).translate(X, 14.96, Z), m.dark)
    // Crown portal and eave
    const pz = Z - A / 2 - 2
    box(5.6, 5.4, 4, m.marble, X, 3.5, pz)
    archFace(k, X, pz - 2, NORTH, 0, 0.82, 2.8, 2, 1.4, 0.02, m.dark)
    archRing(k, X, pz - 2, NORTH, 0, 0.82, 2.8, 2, 1.4, 0.26, 0, m.marbleDark)
    // Wooden eave with rounded corners: underside dark red, top lead
    const S = new THREE.Shape()
    const w = 6.5, f0 = pz - 5, f1 = pz + 1.2
    S.moveTo(-w, -f1); S.lineTo(w, -f1); S.quadraticCurveTo(w + 1.5, -f1, w + 1.5, -(f1 + f0) / 2 - 1.4)
    S.quadraticCurveTo(w + 1.5, -f0, w - 1.5, -f0); S.lineTo(-w + 1.5, -f0); S.quadraticCurveTo(-w - 1.5, -f0, -w - 1.5, -(f1 + f0) / 2 - 1.4)
    S.quadraticCurveTo(-w - 1.5, -f1, -w, -f1); S.closePath()
    const sheet = (y: number, stay: number, mat: Mat) => k.add(new THREE.ExtrudeGeometry(S, { depth: stay, bevelEnabled: false, curveSegments: 8 }).rotateX(-Math.PI / 2).translate(X, y, 0), mat)
    sheet(6, 0.28, d.eaveBottom)
    sheet(6.28, 0.14, m.lead)
    for (let i = -6; i <= 6; i++) box(0.1, 0.1, 5.8, m.goldDark, X + i, 5.98, pz - 1.8)
  }
  muradTomb()

  // Şehzade Alâaddin: adjoining II. Murad, 7.25 × 7.80 m (p. 134)
  tomb({ x: -36.8, z: 44, a: 7.5, n: 4, h: 5.8, R: 3.1, drumH: 1.8, domeH: 2.8 })
  // Cem Sultan: hexagonal, lead dome, small hexagonal opening at the top; marble portico (pp. 141-143)
  tomb({ x: -48, z: 45, a: 8.4, n: 6, h: 6.2, R: 3.6, drumH: 1.8, domeH: 3 })
  box(4.2, 4, 2.4, m.marble, -48, 2.5, 45 - 5.2)
  hipRoof(kRoof, -48 - 2.5, -48 + 2.5, 45 - 6.8, 45 - 3.8, 4.5, 0.8, m.lead)
  archFace(k, -48, 45 - 6.4, NORTH, 0, 0.5, 2, 1.5, 1, 0.02, m.dark)
  // Large octagonal tomb read from the photo; which building it is, is representative.
  tomb({ x: -83, z: 38, a: 11, n: 8, h: 6.4, R: 4.7, drumH: 1.6, domeH: 3.7 })
  // Small tombs in the east row; form and position representative
  tomb({ x: 32.6, z: 27.9, a: 7, n: 8, h: 5, R: 3 })
  tomb({ x: 32, z: 16.5, a: 6, n: 8, h: 4.6, R: 2.5 })
  // Saraylılar (Cariyeler): open dome on eight pillars, 6.65 m side (p. 138)
  tomb({ x: -60, z: 46, a: 8, n: 8, h: 5.2, R: 3.4 })
  baldachin(-21, 48, 4.46, 4.6, 1) // Ebe Hatun: 4.46 m side, 1 m base (p. 146)
  // The rest: from among Gülruh, Gülşah, Hüma, Mükrime, Ahmed, Mahmud, Mustafa, Şirin; position representative
  tomb({ x: -12, z: 57, a: 8.5, n: 8, h: 5.6, R: 3.6 })
  tomb({ x: -28, z: 60, a: 7, n: 8, h: 5, R: 3 })
  tomb({ x: -46, z: 60, a: 9, n: 4, h: 5.6, R: 3.6, drumH: 1.8 })
  tomb({ x: -66, z: 60, a: 8.6, n: 8, h: 5.6, R: 3.6 })
  tomb({ x: 4, z: 61, a: 7.6, n: 8, h: 5.2, R: 3.2 })

  // --- Hazîre: grass plots and stones (based on the photo; grave positions representative) ---
  const r = (() => { let t = 11; return () => { t = (t * 16807) % 2147483647; return t / 2147483647 } })()
  const parcel = (x0: number, x1: number, z0: number, z1: number, stony: boolean) => {
    box(x1 - x0, 0.04, z1 - z0, d.lawn, (x0 + x1) / 2, 0.03, (z0 + z1) / 2)
    if (!stony) return
    for (let x = x0 + 1.5; x < x1 - 1; x += 2.2) for (let z = z0 + 1.5; z < z1 - 1; z += 3.4) {
      if (r() < 0.25) continue
      const h = 0.7 + r() * 0.9
      box(0.42, h, 0.14, m.marble, x + r() * 0.3, h / 2, z + r() * 0.3)
      box(0.3, 0.1, 1.6, m.marbleDark, x, 0.06, z + 0.85)
    }
  }
  parcel(-4, 44, 37, 53, true)
  parcel(-23, -6, 37, 53, true)

  // Roads and squares: stone paving (roughly per the photo; on top of the grass)
  const path = (x0: number, x1: number, z0: number, z1: number) => box(x1 - x0, 0.03, z1 - z0, m.paving, (x0 + x1) / 2, 0.035, (z0 + z1) / 2)
  path(-118, 62, -33, -22) // street to the north
  path(-18, 18, -22, -17) // front of the mosque
  path(-21, -17, -22, 30) // from west of the mosque to the tombs
  path(-44, -17, 18, 38) // II. Murad square
  path(-44, -32, 38, 66)
  path(-90, -44, 28, 34) // between the tombs
  path(-70, -66, 17, 28)
  path(-17, 40, 34, 37)
  path(-90, -48, -20, -14) // north of the madrasa
  path(-108, -90, -22, 24) // around the hamam

  // --- Trees: cypresses and deciduous trees. Positions representative, following density in the photo ---
  const cypress = (x: number, z: number, length: number) => {
    const p: [number, number][] = [[0.12, 0.8], [0.9, 1.5], [1.25, length * 0.25], [1.35, length * 0.4], [1.2, length * 0.58], [0.9, length * 0.75], [0.45, length * 0.9], [0, length]]
    k.add(place(rotateG(p, 12), x, 0, z), m.cypress)
  }
  const tree = (x: number, z: number, R: number, mat: Mat) => {
    const lump = (ox: number, oy: number, oz: number, r0: number) => {
      const g = new THREE.IcosahedronGeometry(r0, 3)
      const pose = g.attributes.position, nor = g.attributes.normal
      for (let i = 0; i < pose.count; i++) {
        const a = pose.getX(i), b = pose.getY(i), c = pose.getZ(i)
        const o = 1 + 0.1 * Math.sin(a * 3.1 + x) * Math.sin(c * 2.3 + z) + 0.07 * Math.sin(b * 4.7 + x + z) + 0.05 * Math.sin(a * 7 + b * 6 + c * 5)
        const l = Math.hypot(a, b, c) || 1
        nor.setXYZ(i, a / l, b / l, c / l)
        pose.setXYZ(i, a * o, b * o * 0.9, c * o)
      }
      k.add(g.translate(x + ox, oy, z + oz), mat)
    }
    const y = R * 1.35
    lump(0, y, 0, R * 0.8)
    lump(R * 0.55, y - R * 0.25, R * 0.2, R * 0.55)
    lump(-R * 0.5, y - R * 0.2, -R * 0.3, R * 0.58)
    lump(R * 0.05, y - R * 0.3, -R * 0.6, R * 0.5)
    lump(-R * 0.15, y - R * 0.3, R * 0.6, R * 0.5)
    k.add(place(cylinderG(0.22, 0.38, R * 1.1, 7), x, R * 0.55, z), m.wood)
  }
  for (const [x, z, b] of [[24, -30, 15], [28, 16, 14], [20, 22, 16], [36, 8, 15], [40, 22, 17], [-24, -14, 14], [-18, 22, 15], [-20, 14, 13], [14, 30, 15], [6, 30, 17], [-6, 34, 14], [44, 35, 14], [-40, 24, 15], [-52, 22, 14], [-88, 18, 16], [-92, 44, 15], [-106, -22, 15], [12, -32, 14], [-40, -20, 15], [-8, -28, 13]] as const) cypress(x, z, b)
  for (const [x, z, R, mat] of [
    [-26, -12, 4.4, d.treeOrange], [-30, -2, 4.6, d.treeYellow], [-46, -10, 5, d.treeOrange], [-42, 4, 4.4, d.treeGreen],
    [-40, 12, 5, d.treeOrange], [-10, -26, 5, d.treeYellow], [26, -2, 5, d.treeGreen], [22, 10, 4.5, d.treeYellow],
    [-34, 18, 4.4, d.treeGreen], [-54, 34, 6, d.treeYellow], [-74, 26, 5, d.treeGreen], [-92, -26, 6, d.treeOrange],
    [-58, -20, 5.4, d.treeOrange], [-76, -26, 5, d.treeYellow], [8, -26, 5, d.treeOrange], [52, 2, 6, d.treeYellow],
  ] as const) tree(x, z, R, mat)
}
