// Külliyenin diğer yapıları: dış kütle olarak. Yerleşim kitaptaki yönlere (s. 97, 100, 103) göre temsilîdir:
// imaret caminin batısında, hamam doğusunda, türbe kuzeybatıda yolun karşısında, şadırvan karşıdaki bahçede.
import * as THREE from 'three'
import { Kova, type Mal, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, yer } from '../../ulucamiParca'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { KulliyeMalzemeleri } from './dokular'
import { duvarUV, kirmaCati } from './cami'

export const KAIDE_R = 74

export function cevreKur(m: UlucamiMalzemeleri, x: KulliyeMalzemeleri, k: Kova) {
  const kutuDik = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal) =>
    k.ekle(duvarUV(yer(kutuG(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)), mal)

  // --- Zemin ---
  const R = KAIDE_R - 0.5
  const avlu = new THREE.CircleGeometry(R, 96).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const ap = avlu.attributes.position, au = avlu.attributes.uv
  for (let i = 0; i < au.count; i++) au.setXY(i, ap.getX(i), ap.getZ(i))
  k.ekle(avlu, m.doseme)
  // Daireye sığan düz yüzey parçaları
  const parca = (z0: number, z1: number, xMin: number, xMax: number, y: number, mal: Mal) => {
    const s = new THREE.Shape(), N = 10
    const sag: [number, number][] = [], sol: [number, number][] = []
    for (let i = 0; i <= N; i++) {
      const z = z0 + ((z1 - z0) * i) / N, h = Math.sqrt(Math.max(0, R * R - z * z))
      sag.push([Math.min(h, xMax), z]); sol.push([Math.max(-h, xMin), z])
    }
    const nokta = [...sag, ...sol.reverse()]
    nokta.forEach(([a, b], i) => { if (i) s.lineTo(a, -b); else s.moveTo(a, -b) })
    s.closePath()
    const g = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2).translate(0, y, 0)
    const p = g.attributes.position, u = g.attributes.uv
    for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i), p.getZ(i))
    k.ekle(g, mal)
  }
  parca(-38, -29, -999, 999, 0.03, x.yol) // caminin önündeki yol
  parca(-R + 1, -38.2, -999, 999, 0.03, x.cim) // ovaya bakan bahçe ve türbe seti
  parca(-29, -24.5, -999, -18, 0.03, x.cim)
  parca(-29, -24.5, 18, 999, 0.03, x.cim)
  parca(27, R - 1, -999, 999, 0.03, x.cim)
  parca(-20, 27, 34, 999, 0.03, x.cim)

  // --- Ağaçlar: kitaptaki fotoğraflarda yapıları çevreleyen yeşillik (konumlar temsilî) ---
  const agac = (px: number, pz: number, boy: number, r: number, koyu = false) => {
    k.ekle(yer(silindirG(0.28, 0.42, boy * 0.45, 7), px, boy * 0.22, pz), x.gergi)
    let t = px * 7.1 + pz * 3.3
    const rs = () => { t += 1; return Math.abs(Math.sin(t * 12.9898) * 43758.5453) % 1 }
    for (let i = 0; i < 3; i++) {
      const g = new THREE.IcosahedronGeometry(r * (0.62 + rs() * 0.25), 1)
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const o = 1 + 0.14 * Math.sin(p.getX(v) * 2.4 + t) * Math.cos(p.getZ(v) * 2.1)
        p.setXYZ(v, p.getX(v) * o, p.getY(v) * o * 0.86, p.getZ(v) * o)
      }
      g.computeVertexNormals()
      k.ekle(yer(g, px + (rs() - 0.5) * r, boy * (0.55 + rs() * 0.2), pz + (rs() - 0.5) * r), koyu ? x.yaprakKoyu : x.yaprak)
    }
  }
  for (const [a, b, c, d, e] of [
    [10, -62, 12, 6, 0], [28, -56, 13, 7, 1], [44, -50, 10, 6, 0], [-8, -60, 11, 6, 1], [-56, -38, 10, 5.5, 0],
    [44, -14, 11, 6, 1], [52, 10, 10, 6, 0], [42, 34, 12, 6.5, 1], [-20, 46, 11, 6, 0], [6, 50, 10, 5.5, 1], [24, 44, 9, 5, 0],
    [-58, 44, 9, 5, 1], [60, -26, 9, 5, 0], [-14, -33 - 12, 8, 4, 0],
  ] as const) agac(a, b, c, d, e === 1)
  const selvi = (px: number, pz: number, boy: number) => {
    const p: [number, number][] = [[0.12, 1], [0.95, 1.6], [1.3, boy * 0.25], [1.4, boy * 0.4], [1.2, boy * 0.6], [0.8, boy * 0.8], [0.3, boy * 0.95], [0, boy]]
    k.ekle(yer(dondurG(p, 12), px, 0, pz), m.selvi)
  }
  selvi(-12, -43, 13); selvi(-46, -30.5 - 8, 12); selvi(19, 14, 12)

  // --- Şadırvan: altı ahşap direk, kurşun kaplı ahşap çatı (s. 95) ---
  {
    const cx = 13, cz = -47, ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, cx, 0, cz), mal)
    ek(duzGolge(silindirG(3.2, 3.3, 0.25, 6)).translate(0, 0.13, 0), m.mermer)
    ek(duzGolge(silindirG(1.7, 1.75, 0.8, 6)).translate(0, 0.65, 0), m.mermer)
    ek(silindirG(1.55, 1.55, 0.03, 18).translate(0, 1.04, 0), m.su)
    ek(dondurG([[0.2, 0], [0.06, 0.5], [0.2, 0.75], [0.03, 1.15], [0, 1.2]], 10).translate(0, 1, 0), m.mermer)
    for (let n = 0; n < 6; n++) {
      const a = (n * Math.PI) / 3
      ek(silindirG(0.13, 0.15, 3.2, 8).translate(2.9 * Math.sin(a), 1.85, 2.9 * Math.cos(a)), x.gergi)
    }
    ek(duzGolge(silindirG(3.4, 3.4, 0.28, 6)).translate(0, 3.55, 0), x.kapi)
    ek(duzGolge(silindirG(0.28, 4.1, 2, 6)).translate(0, 4.7, 0), m.kursun)
    ek(dondurG([[0.1, 0], [0.05, 0.3], [0.13, 0.5], [0.02, 0.9], [0, 0.95]], 8).translate(0, 5.7, 0), m.bronz)
  }

  // --- Cıkcık (Girçık, Bekârlar) Hamamı: kare plan, 6 m çaplı fenerli kubbe (s. 100) ---
  {
    const cx = 25, cz = -4, Y = 11.6, H = 5.2
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, cx, 0, cz), mal)
    k.ekle(duvarUV(yer(kutuG(Y, H, Y), cx, H / 2, cz)), x.yanCephe)
    for (const [a, b, ry] of [[Y / 2, 0, Math.PI / 2], [-Y / 2, 0, -Math.PI / 2], [0, Y / 2, 0]] as const) {
      k.ekle(yer(kutuG(1.1, 1.5, 0.05).translate(0, 3.4, 0), cx + a, 0, cz + b, ry), m.tas)
      k.ekle(yer(kutuG(0.7, 1.1, 0.03).translate(0, 3.4, 0.02), cx + a, 0, cz + b, ry), x.koyuCam)
    }
    k.ekle(yer(kirmaCati(-Y / 2 - 0.3, Y / 2 + 0.3, -Y / 2 - 0.3, Y / 2 + 0.3, H, H + 1.2, 'x'), cx, 0, cz), m.kursun)
    const DR = 3.7
    ek(duzGolge(silindirG(DR, DR + 0.1, 1.6, 8).rotateY(Math.PI / 8)).translate(0, H + 1.5, 0), x.almasik)
    ek(duzGolge(silindirG(DR + 0.2, DR + 0.1, 0.18, 8).rotateY(Math.PI / 8)).translate(0, H + 2.35, 0), m.mermer)
    const p: [number, number][] = []
    for (let t = 0; t <= 10; t++) { const a = (t / 10) * Math.PI / 2; const r = (DR - 0.1) * Math.cos(a); if (r < 0.38) break; p.push([r, 2.3 * Math.sin(a)]) }
    ek(dondurG(p, 48, [1, 1]).translate(0, H + 2.42, 0), m.kubbe)
    const son = p[p.length - 1]
    ek(silindirG(0.38, 0.4, 0.4, 8).translate(0, H + 2.42 + son[1] + 0.2, 0), m.mermer)
    ek(dondurG([[0.46, 0], [0.04, 0.3], [0, 0.32]], 8, [1, 1]).translate(0, H + 2.42 + son[1] + 0.4, 0), m.kursun)
    // Kapı ve dış merdiven
    k.ekle(yer(kutuG(1.3, 2.4, 0.08).translate(0, 1.2, 0), cx, 0, cz - Y / 2, Math.PI), x.kapi)
  }

  // --- İmaret: "L" biçimli, 40 m'lik uzun kolu camiye paralel; moloz taş, kiremitli ahşap çatı (s. 97-99) ---
  {
    const X0 = -33, X1 = -24, Z0 = -14, Z1 = 26, H = 6.3, K0 = -56, KZ0 = 17
    kutuDik(X0, X1, 0, H, Z0, Z1, x.moloz)
    kutuDik(K0, X0, 0, H, KZ0, Z1, x.moloz)
    const saca = 1.2
    k.ekle(kirmaCati(X0 - saca, X1 + saca, Z0 - saca, Z1 + saca, H, H + 2.8, 'z'), x.kiremit)
    k.ekle(kirmaCati(K0 - saca, X0 + 1, KZ0 - saca, Z1 + saca, H, H + 2.6, 'x'), x.kiremit)
    // Saçak altı ahşap
    kutuDik(X0 - saca, X1 + saca, H - 0.1, H, Z0 - saca, Z1 + saca, x.gergi)
    kutuDik(K0 - saca, X0, H - 0.1, H, KZ0 - saca, Z1 + saca, x.gergi)
    // Kesme taş köşeler
    for (const [a, b] of [[X0, Z0], [X1, Z0], [X1, Z1], [K0, Z1], [K0, KZ0]]) kutuDik(a - 0.05, a + 0.05, 0, H, b - 0.6, b + 0.6, m.tas)
    // Doğu duvarında kesme taş söveli beş pencere (s. 99)
    const pencere = (px: number, pz: number, ry: number, y = 2) => {
      k.ekle(yer(kutuG(1.5, 2.1, 0.08).translate(0, y + 1.05, 0), px, 0, pz, ry), m.mermer)
      k.ekle(yer(kutuG(0.95, 1.55, 0.03).translate(0, y + 1.05, 0.05), px, 0, pz, ry), x.koyuCam)
    }
    for (let i = 0; i < 5; i++) pencere(X1, Z0 + 5 + i * 7.5, Math.PI / 2)
    for (let i = 0; i < 5; i++) pencere(X0, Z0 + 5 + i * 5.5, -Math.PI / 2)
    for (let i = 0; i < 4; i++) pencere(K0 + 4 + i * 5.5, KZ0, Math.PI)
    for (let i = 0; i < 5; i++) pencere(K0 + 3 + i * 6, Z1, 0)
    pencere((X0 + X1) / 2, Z0, Math.PI)
    // Avlu duvarı ve kuzeydeki kemerli büyük kapı (s. 99)
    const duvarH = 3.6
    kutuDik(K0, K0 + 0.7, 0, duvarH, Z0, KZ0, x.moloz)
    const on = dikdortgen(K0, 0, X0, duvarH)
    on.holes.push(kemer(new THREE.Path(), (K0 + X0) / 2, 0.02, 3.2, 1.9, 1.3))
    k.ekle(duvarUV(cikar(on, 0.7, Z0)), x.moloz)
    kutuDik(K0, X0, duvarH, duvarH + 0.14, Z0 - 0.08, Z0 + 0.78, m.tas)
    kutuDik(K0, K0 + 0.78, duvarH, duvarH + 0.14, Z0, KZ0, m.tas)
    // Çınar: avludaki büyük ağaç (fotoğrafa göre, temsilî)
    agac(-44, 1, 12, 6, true)
    k.ekle(yer(silindirG(1.4, 1.5, 0.5, 16), -21, 0.25, -16), m.mermer)
    agac(-21, -16, 11, 5, false)
  }

  // --- Türbe: 17.60 x 17.60 m kare plan, kasnaksız basık kubbe, doğu duvarında sundurma (s. 103, 105; TDV) ---
  {
    const cx = -31, cz = -54, O = 8.8, H = 7.6
    const ekle = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, cx, 0, cz), mal)
    // Set
    kutuDik(cx - O - 2.2, cx + O + 2.2, 0, 0.9, cz - O - 2.2, cz + O + 2.2, m.tas)
    ekle(kutuG(O * 2, H, O * 2).translate(0, H / 2 + 0.9, 0), x.krem)
    ekle(kutuG(O * 2 + 0.4, 0.3, O * 2 + 0.4).translate(0, H + 0.8, 0), m.mermer)
    // Kuzey duvarında masif payandalar (TDV; yönleri temsilî)
    for (const a of [-5, 0, 5]) ekle(duzGolge(kutuG(1.5, H - 0.8, 1.3)).translate(a, (H - 0.8) / 2 + 0.9, -O - 0.65), x.krem)
    // Her cephede demir parmaklıklı kemerli pencereler
    for (const [a, b, ry] of [[O, 0, Math.PI / 2], [-O, 0, -Math.PI / 2], [0, O, 0], [0, -O, Math.PI]] as const) for (const u of [-4.6, 4.6]) {
      const px = cx + a, pz = cz + b
      k.ekle(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), u, 2.8, 1.7, 1.9, 0.95), 8).translate(0, 0, 0.03), px, 0, pz, ry), x.koyuCam)
      const hal = kemer(new THREE.Shape(), u, 2.7, 2.15, 2, 1.25)
      hal.holes.push(kemer(new THREE.Path(), u, 2.8, 1.7, 1.9, 0.95))
      k.ekle(yer(cikar(hal, 0.08, 0.01), px, 0, pz, ry), m.mermer)
    }
    k.ekle(yer(kirmaCati(-O - 0.4, O + 0.4, -O - 0.4, O + 0.4, H + 0.95, H + 2.6, 'x'), cx, 0, cz), m.kursun)
    // Kasnaksız basık kubbe (TDV)
    const p: [number, number][] = []
    for (let t = 0; t <= 12; t++) { const a = (t / 12) * Math.PI / 2; p.push([Math.max(5.6 * Math.cos(a), 0.001), 3.1 * Math.sin(a)]) }
    ekle(dondurG(p, 64, [1, 1]).translate(0, H + 1.8, 0), m.kubbe)
    ekle(dondurG([[0.14, 0], [0.06, 0.3], [0.16, 0.5], [0.03, 0.9], [0, 1]], 8).translate(0, H + 4.85, 0), m.bronz)
    // Doğu duvarında dışa taşan sundurma, iki kanatlı ahşap kapı (s. 105)
    const sx = cx + O
    kutuDik(sx, sx + 2.8, 0.9, 1.05, cz - 1.8, cz + 1.8, m.mermer)
    for (const a of [-1.55, 1.55]) k.ekle(yer(kutuG(0.3, 3, 0.3), sx + 2.4, 2.5, cz + a), m.mermer)
    k.ekle(yer(kutuG(0.06, 3, 2.3).translate(0, 2.5, 0), sx + 0.04, 0, cz), x.kapi)
    k.ekle(yer(duzGolge(silindirG(0.05, 2.6, 1.3, 4).rotateY(Math.PI / 4).scale(0.72, 1, 1)), sx + 1.5, 4.65, cz), m.kursun)
    k.ekle(yer(kutuG(3.2, 0.2, 3.9), sx + 1.5, 4, cz), m.mermer)
    for (let i = 0; i < 3; i++) kutuDik(sx + 2.8 + i * 0.32, sx + 3.12 + i * 0.32, 0, 0.9 - i * 0.3, cz - 1.5, cz + 1.5, m.mermer)
  }
  void Math
}
