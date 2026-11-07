// Külliyenin diğer yapıları: dış kütle olarak. Yerleşim kitaptaki yönlere (s. 97, 100, 103) göre temsilîdir:
// imaret caminin batısında, hamam doğusunda, türbe kuzeybatıda yolun karşısında, şadırvan karşıdaki bahçede.
import * as THREE from 'three'
import { Bucket, type Mat, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, place } from '../../uluMosquePiece'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { ComplexMaterials } from './textures'
import { wallUV, hipRoof } from './mosque'

export const PEDESTAL_R = 74

export function setupSurroundings(m: UluMosqueMaterials, x: ComplexMaterials, k: Bucket) {
  const boxUpright = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat) =>
    k.add(wallUV(place(boxG(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)), mat)

  // --- Zemin ---
  const R = PEDESTAL_R - 0.5
  const courtyard = new THREE.CircleGeometry(R, 96).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const ap = courtyard.attributes.position, au = courtyard.attributes.uv
  for (let i = 0; i < au.count; i++) au.setXY(i, ap.getX(i), ap.getZ(i))
  k.add(courtyard, m.paving)
  // Daireye sığan düz yüzey parçaları
  const piece = (z0: number, z1: number, xMin: number, xMax: number, y: number, mat: Mat) => {
    const s = new THREE.Shape(), N = 10
    const right: [number, number][] = [], left: [number, number][] = []
    for (let i = 0; i <= N; i++) {
      const z = z0 + ((z1 - z0) * i) / N, h = Math.sqrt(Math.max(0, R * R - z * z))
      right.push([Math.min(h, xMax), z]); left.push([Math.max(-h, xMin), z])
    }
    const point = [...right, ...left.reverse()]
    point.forEach(([a, b], i) => { if (i) s.lineTo(a, -b); else s.moveTo(a, -b) })
    s.closePath()
    const g = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2).translate(0, y, 0)
    const p = g.attributes.position, u = g.attributes.uv
    for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i), p.getZ(i))
    k.add(g, mat)
  }
  piece(-38, -29, -999, 999, 0.03, x.path) // caminin önündeki yol
  piece(-R + 1, -38.2, -999, 999, 0.03, x.grass) // ovaya bakan bahçe ve türbe seti
  piece(-29, -24.5, -999, -18, 0.03, x.grass)
  piece(-29, -24.5, 18, 999, 0.03, x.grass)
  piece(27, R - 1, -999, 999, 0.03, x.grass)
  piece(-20, 27, 34, 999, 0.03, x.grass)

  // --- Ağaçlar: kitaptaki fotoğraflarda yapıları çevreleyen yeşillik (konumlar temsilî) ---
  const tree = (px: number, pz: number, length: number, r: number, dark = false) => {
    k.add(place(cylinderG(0.28, 0.42, length * 0.45, 7), px, length * 0.22, pz), x.tension)
    let t = px * 7.1 + pz * 3.3
    const rs = () => { t += 1; return Math.abs(Math.sin(t * 12.9898) * 43758.5453) % 1 }
    for (let i = 0; i < 3; i++) {
      const g = new THREE.IcosahedronGeometry(r * (0.62 + rs() * 0.25), 3)
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const o = 1 + 0.12 * Math.sin(p.getX(v) * 1.7 + t) * Math.cos(p.getZ(v) * 1.5) + 0.05 * Math.sin(p.getY(v) * 3.2 + p.getX(v) * 3 + t)
        p.setXYZ(v, p.getX(v) * o, p.getY(v) * o * 0.86, p.getZ(v) * o)
      }
      g.computeVertexNormals()
      k.add(place(g, px + (rs() - 0.5) * r, length * (0.55 + rs() * 0.2), pz + (rs() - 0.5) * r), dark ? x.leafDark : x.leaf)
    }
  }
  for (const [a, b, c, d, e] of [
    [10, -62, 12, 6, 0], [28, -56, 13, 7, 1], [44, -50, 10, 6, 0], [-8, -60, 11, 6, 1], [-56, -38, 10, 5.5, 0],
    [44, -14, 11, 6, 1], [52, 10, 10, 6, 0], [42, 34, 12, 6.5, 1], [-20, 46, 11, 6, 0], [6, 50, 10, 5.5, 1], [24, 44, 9, 5, 0],
    [-58, 44, 9, 5, 1], [60, -26, 9, 5, 0], [-14, -33 - 12, 8, 4, 0],
  ] as const) tree(a, b, c, d, e === 1)
  const cypress = (px: number, pz: number, length: number) => {
    const p: [number, number][] = [[0.12, 1], [0.95, 1.6], [1.3, length * 0.25], [1.4, length * 0.4], [1.2, length * 0.6], [0.8, length * 0.8], [0.3, length * 0.95], [0, length]]
    k.add(place(rotateG(p, 12), px, 0, pz), m.cypress)
  }
  cypress(-12, -43, 13); cypress(-46, -30.5 - 8, 12); cypress(19, 14, 12)

  // --- Şadırvan: altı ahşap direk, kurşun kaplı ahşap çatı (s. 95) ---
  {
    const cx = 13, cz = -47, ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, cx, 0, cz), mat)
    ext(flatShadow(cylinderG(3.2, 3.3, 0.25, 6)).translate(0, 0.13, 0), m.marble)
    ext(flatShadow(cylinderG(1.7, 1.75, 0.8, 6)).translate(0, 0.65, 0), m.marble)
    ext(cylinderG(1.55, 1.55, 0.03, 18).translate(0, 1.04, 0), m.water)
    ext(rotateG([[0.2, 0], [0.06, 0.5], [0.2, 0.75], [0.03, 1.15], [0, 1.2]], 10).translate(0, 1, 0), m.marble)
    for (let n = 0; n < 6; n++) {
      const a = (n * Math.PI) / 3
      ext(cylinderG(0.13, 0.15, 3.2, 8).translate(2.9 * Math.sin(a), 1.85, 2.9 * Math.cos(a)), x.tension)
    }
    ext(flatShadow(cylinderG(3.4, 3.4, 0.28, 6)).translate(0, 3.55, 0), x.door)
    ext(flatShadow(cylinderG(0.28, 4.1, 2, 6)).translate(0, 4.7, 0), m.lead)
    ext(rotateG([[0.1, 0], [0.05, 0.3], [0.13, 0.5], [0.02, 0.9], [0, 0.95]], 8).translate(0, 5.7, 0), m.bronze)
  }

  // --- Cıkcık (Girçık, Bekârlar) Hamamı: kare plan, 6 m çaplı fenerli kubbe (s. 100) ---
  {
    const cx = 25, cz = -4, Y = 11.6, H = 5.2
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, cx, 0, cz), mat)
    k.add(wallUV(place(boxG(Y, H, Y), cx, H / 2, cz)), x.sideFacade)
    for (const [a, b, ry] of [[Y / 2, 0, Math.PI / 2], [-Y / 2, 0, -Math.PI / 2], [0, Y / 2, 0]] as const) {
      k.add(place(boxG(1.1, 1.5, 0.05).translate(0, 3.4, 0), cx + a, 0, cz + b, ry), m.stone)
      k.add(place(boxG(0.7, 1.1, 0.03).translate(0, 3.4, 0.02), cx + a, 0, cz + b, ry), x.darkGlass)
    }
    k.add(place(hipRoof(-Y / 2 - 0.3, Y / 2 + 0.3, -Y / 2 - 0.3, Y / 2 + 0.3, H, H + 1.2, 'x'), cx, 0, cz), m.lead)
    const DR = 3.7
    ext(flatShadow(cylinderG(DR, DR + 0.1, 1.6, 8).rotateY(Math.PI / 8)).translate(0, H + 1.5, 0), x.alternating)
    ext(flatShadow(cylinderG(DR + 0.2, DR + 0.1, 0.18, 8).rotateY(Math.PI / 8)).translate(0, H + 2.35, 0), m.marble)
    const p: [number, number][] = []
    for (let t = 0; t <= 10; t++) { const a = (t / 10) * Math.PI / 2; const r = (DR - 0.1) * Math.cos(a); if (r < 0.38) break; p.push([r, 2.3 * Math.sin(a)]) }
    ext(rotateG(p, 48, [1, 1]).translate(0, H + 2.42, 0), m.dome)
    const last = p[p.length - 1]
    ext(cylinderG(0.38, 0.4, 0.4, 8).translate(0, H + 2.42 + last[1] + 0.2, 0), m.marble)
    ext(rotateG([[0.46, 0], [0.04, 0.3], [0, 0.32]], 8, [1, 1]).translate(0, H + 2.42 + last[1] + 0.4, 0), m.lead)
    // Kapı ve dış merdiven
    k.add(place(boxG(1.3, 2.4, 0.08).translate(0, 1.2, 0), cx, 0, cz - Y / 2, Math.PI), x.door)
  }

  // --- İmaret: "L" biçimli, 40 m'lik uzun kolu camiye paralel; moloz taş, kiremitli ahşap çatı (s. 97-99) ---
  {
    const X0 = -33, X1 = -24, Z0 = -14, Z1 = 26, H = 6.3, K0 = -56, KZ0 = 17
    boxUpright(X0, X1, 0, H, Z0, Z1, x.rubble)
    boxUpright(K0, X0, 0, H, KZ0, Z1, x.rubble)
    const saca = 1.2
    k.add(hipRoof(X0 - saca, X1 + saca, Z0 - saca, Z1 + saca, H, H + 2.8, 'z'), x.roofTile)
    k.add(hipRoof(K0 - saca, X0 + 1, KZ0 - saca, Z1 + saca, H, H + 2.6, 'x'), x.roofTile)
    // Saçak altı ahşap
    boxUpright(X0 - saca, X1 + saca, H - 0.1, H, Z0 - saca, Z1 + saca, x.tension)
    boxUpright(K0 - saca, X0, H - 0.1, H, KZ0 - saca, Z1 + saca, x.tension)
    // Kesme taş köşeler
    for (const [a, b] of [[X0, Z0], [X1, Z0], [X1, Z1], [K0, Z1], [K0, KZ0]]) boxUpright(a - 0.05, a + 0.05, 0, H, b - 0.6, b + 0.6, m.stone)
    // Doğu duvarında kesme taş söveli beş pencere (s. 99)
    const window = (px: number, pz: number, ry: number, y = 2) => {
      k.add(place(boxG(1.5, 2.1, 0.08).translate(0, y + 1.05, 0), px, 0, pz, ry), m.marble)
      k.add(place(boxG(0.95, 1.55, 0.03).translate(0, y + 1.05, 0.05), px, 0, pz, ry), x.darkGlass)
    }
    for (let i = 0; i < 5; i++) window(X1, Z0 + 5 + i * 7.5, Math.PI / 2)
    for (let i = 0; i < 5; i++) window(X0, Z0 + 5 + i * 5.5, -Math.PI / 2)
    for (let i = 0; i < 4; i++) window(K0 + 4 + i * 5.5, KZ0, Math.PI)
    for (let i = 0; i < 5; i++) window(K0 + 3 + i * 6, Z1, 0)
    window((X0 + X1) / 2, Z0, Math.PI)
    // Avlu duvarı ve kuzeydeki kemerli büyük kapı (s. 99)
    const wallH = 3.6
    boxUpright(K0, K0 + 0.7, 0, wallH, Z0, KZ0, x.rubble)
    const on = rect(K0, 0, X0, wallH)
    on.holes.push(arch(new THREE.Path(), (K0 + X0) / 2, 0.02, 3.2, 1.9, 1.3))
    k.add(wallUV(subtract(on, 0.7, Z0)), x.rubble)
    boxUpright(K0, X0, wallH, wallH + 0.14, Z0 - 0.08, Z0 + 0.78, m.stone)
    boxUpright(K0, K0 + 0.78, wallH, wallH + 0.14, Z0, KZ0, m.stone)
    // Çınar: avludaki büyük ağaç (fotoğrafa göre, temsilî)
    tree(-44, 1, 12, 6, true)
    k.add(place(cylinderG(1.4, 1.5, 0.5, 16), -21, 0.25, -16), m.marble)
    tree(-21, -16, 11, 5, false)
  }

  // --- Türbe: 17.60 x 17.60 m kare plan, kasnaksız basık kubbe, doğu duvarında sundurma (s. 103, 105; TDV) ---
  {
    const cx = -31, cz = -54, O = 8.8, H = 7.6
    const add = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, cx, 0, cz), mat)
    // Set
    boxUpright(cx - O - 2.2, cx + O + 2.2, 0, 0.9, cz - O - 2.2, cz + O + 2.2, m.stone)
    add(boxG(O * 2, H, O * 2).translate(0, H / 2 + 0.9, 0), x.cream)
    add(boxG(O * 2 + 0.4, 0.3, O * 2 + 0.4).translate(0, H + 0.8, 0), m.marble)
    // Kuzey duvarında masif payandalar (TDV; yönleri temsilî)
    for (const a of [-5, 0, 5]) add(flatShadow(boxG(1.5, H - 0.8, 1.3)).translate(a, (H - 0.8) / 2 + 0.9, -O - 0.65), x.cream)
    // Her cephede demir parmaklıklı kemerli pencereler
    for (const [a, b, ry] of [[O, 0, Math.PI / 2], [-O, 0, -Math.PI / 2], [0, O, 0], [0, -O, Math.PI]] as const) for (const u of [-4.6, 4.6]) {
      const px = cx + a, pz = cz + b
      k.add(place(new THREE.ShapeGeometry(arch(new THREE.Shape(), u, 2.8, 1.7, 1.9, 0.95), 8).translate(0, 0, 0.03), px, 0, pz, ry), x.darkGlass)
      const hal = arch(new THREE.Shape(), u, 2.7, 2.15, 2, 1.25)
      hal.holes.push(arch(new THREE.Path(), u, 2.8, 1.7, 1.9, 0.95))
      k.add(place(subtract(hal, 0.08, 0.01), px, 0, pz, ry), m.marble)
    }
    k.add(place(hipRoof(-O - 0.4, O + 0.4, -O - 0.4, O + 0.4, H + 0.95, H + 2.6, 'x'), cx, 0, cz), m.lead)
    // Kasnaksız basık kubbe (TDV)
    const p: [number, number][] = []
    for (let t = 0; t <= 12; t++) { const a = (t / 12) * Math.PI / 2; p.push([Math.max(5.6 * Math.cos(a), 0.001), 3.1 * Math.sin(a)]) }
    add(rotateG(p, 64, [1, 1]).translate(0, H + 1.8, 0), m.dome)
    add(rotateG([[0.14, 0], [0.06, 0.3], [0.16, 0.5], [0.03, 0.9], [0, 1]], 8).translate(0, H + 4.85, 0), m.bronze)
    // Doğu duvarında dışa taşan sundurma, iki kanatlı ahşap kapı (s. 105)
    const sx = cx + O
    boxUpright(sx, sx + 2.8, 0.9, 1.05, cz - 1.8, cz + 1.8, m.marble)
    for (const a of [-1.55, 1.55]) k.add(place(boxG(0.3, 3, 0.3), sx + 2.4, 2.5, cz + a), m.marble)
    k.add(place(boxG(0.06, 3, 2.3).translate(0, 2.5, 0), sx + 0.04, 0, cz), x.door)
    k.add(place(flatShadow(cylinderG(0.05, 2.6, 1.3, 4).rotateY(Math.PI / 4).scale(0.72, 1, 1)), sx + 1.5, 4.65, cz), m.lead)
    k.add(place(boxG(3.2, 0.2, 3.9), sx + 1.5, 4, cz), m.marble)
    for (let i = 0; i < 3; i++) boxUpright(sx + 2.8 + i * 0.32, sx + 3.12 + i * 0.32, 0, 0.9 - i * 0.3, cz - 1.5, cz + 1.5, m.marble)
  }
}
