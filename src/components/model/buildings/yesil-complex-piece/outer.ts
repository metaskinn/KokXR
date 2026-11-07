// Yeşil Camii dış kütlesi: ters T plan, mermer kuzey cephesi, kesme taş yanlar, kurşun çatı, pembe kasnaklar,
// kurşun kubbeler ve iki tuğla minare. Kubbe ölçüleri envanterden (s. 101, 103), oranlar drone fotoğrafından (s. 85).
import * as THREE from 'three'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, place, type Mat } from '../../uluMosquePiece'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { GreenMaterials } from './textures'
import { IWAN_X, IWAN_Z, MIHRAB_Z, MID_Z, BASE, muqarnas } from './interior'
import { polygon, align, plaque, chamferedSquare, prism } from './help'

export const XD = 16.3, ZK = -19, ZG = 9.5, ZS = 19.4, XE = 8.4, H_OUT = 12.5

type Ext = (g: THREE.BufferGeometry, mat: Mat) => void

/** Kurşun kubbe: eteği açılan, dikişli. `acik` varsa tepede fener boşluğu kalır. */
export function domeOuter(kv: Bucket, m: UluMosqueMaterials, cx: number, cz: number, R: number, y: number, H: number, pointed = 1, open = 0, finial = true) {
  const p: [number, number][] = [[R + 0.95, -0.22], [R + 0.72, 0.02], [R + 0.3, 0.3]]
  for (let t = 0; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2, r = R * Math.pow(Math.cos(a), 0.9)
    if (open && r < open) break
    p.push([Math.max(r, 0.001), 0.3 + H * Math.pow(Math.sin(a), pointed)])
  }
  kv.add(place(rotateG(p, 72, [1, 1]), cx, y, cz), m.dome)
  if (finial && !open) {
    kv.add(place(rotateG([[0.28, 0], [0.09, 0.2], [0.24, 0.42], [0.08, 0.68], [0.17, 0.86], [0.03, 1.25], [0, 1.32]], 10), cx, y + 0.25 + H, cz), m.gold)
  }
}

/** Dış duvara kafesli pencere: mermer çerçeve + firuze kuşak + sivri alınlık + demir parmaklık (s. 88-89). */
function outerWindow(k: Bucket, m: UluMosqueMaterials, ym: GreenMaterials, ax: number, az: number, bx: number, bz: number, u: number, y0: number, g: number, h: number) {
  const outer = rect(u - g / 2 - 0.62, y0 - 0.62, u + g / 2 + 0.62, y0 + h + 2.1)
  const innerP = new THREE.Path(); innerP.moveTo(u - g / 2, y0); innerP.lineTo(u + g / 2, y0); innerP.lineTo(u + g / 2, y0 + h); innerP.lineTo(u - g / 2, y0 + h); innerP.closePath()
  outer.holes.push(innerP)
  k.add(align(subtract(outer, 0.1, 0), ax, az, bx, bz), m.marble)
  // Firuze kuşak
  const belt = rect(u - g / 2 - 0.42, y0 - 0.42, u + g / 2 + 0.42, y0 + h + 1.9)
  belt.holes.push(rect(u - g / 2 - 0.32, y0 - 0.32, u + g / 2 + 0.32, y0 + h + 1.8) as unknown as THREE.Path)
  k.add(align(new THREE.ShapeGeometry(belt).translate(0, 0, 0.115), ax, az, bx, bz), ym.friezeTurquoise)
  // Parmaklık
  k.add(align(new THREE.PlaneGeometry(g, h).translate(u, y0 + h / 2, 0.015), ax, az, bx, bz), m.dark)
  k.add(align(new THREE.PlaneGeometry(g, h).translate(u, y0 + h / 2, 0.03), ax, az, bx, bz), ym.iron)
  // Sivri kemerli alınlık
  const forehead = arch(new THREE.Shape(), u, y0 + h + 0.1, g + 0.2, 0.25, 1.25)
  plaque(k, forehead, ax, az, bx, bz, ym.carving, 0, 0.115)
}

export function mosqueExterior(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {
  // Sekiler ve döşeme altı
  k.add(place(boxG(2 * XD + 1, BASE, ZG - ZK + 1), 0, BASE / 2, (ZK + ZG) / 2), m.marble)
  k.add(place(boxG(2 * XE + 1, BASE, ZS - ZG + 1), 0, BASE / 2, (ZS + ZG) / 2), m.marble)

  // Gövde: N cephe mermer; diğer cepheler kesme taş (s. 96)
  const sideWall = (ax: number, az: number, bx: number, bz: number, t: number, mat: Mat) => {
    const L = Math.hypot(bx - ax, bz - az)
    k.add(align(subtract(rect(0, 0, L, H_OUT), t), ax, az, bx, bz), mat)
    k.add(align(boxG(L + 0.1, 1.5, 0.12).translate(L / 2, 0.75, -0.04), ax, az, bx, bz), m.marble)
  }
  sideWall(XD, ZK, XD, ZG, 1, m.marbleDark)         // doğu: normal -x (içe)
  sideWall(-XD, ZG, -XD, ZK, 1, m.marbleDark)       // batı
  sideWall(XD, ZG, XE, ZG, 1, m.marbleDark)
  sideWall(-XE, ZG, -XD, ZG, 1, m.marbleDark)
  sideWall(XE, ZG, XE, ZS, 1, m.marbleDark)
  sideWall(-XE, ZS, -XE, ZG, 1, m.marbleDark)
  sideWall(XE, ZS, -XE, ZS, 1.6, m.marbleDark)

  // Kuzey cephesi (a→b doğudan batıya değil, batıdan doğuya: kalınlık içe)
  const NA = -XD, NB = XD
  const portal = { g: 4.8, leg: 7.2, arch: 3.6 }
  const nWall = rect(0, 0, 2 * XD, H_OUT)
  nWall.holes.push(arch(new THREE.Path(), XD, BASE + 0.3, portal.g, portal.leg - BASE - 0.3, portal.arch))
  k.add(align(subtract(nWall, 1.7), NA, ZK, NB, ZK), m.marble)
  // Taç kapı arkası: kapı nişi
  const dPlate = rect(XD - portal.g / 2 - 0.1, BASE, XD + portal.g / 2 + 0.1, 11.5)
  k.add(align(subtract(dPlate, 0.3, 1.7), NA, ZK, NB, ZK), m.marble)

  // Dış yüz: duvarın kuzey yüzüne baktığı için a→b doğudan batıya, normal -z
  const ax = XD, az = ZK, bx = -XD, bz = ZK
  const u = (x: number) => XD - x
  const piece: Ext = (g, mat) => k.add(align(g, ax, az, bx, bz), mat)

  // Silmeler, ayak izleri (tamamlanmamış son cemaat yeri kemer üzengileri, s. 88)
  for (const x of [-15.5, -6.3, 6.3, 15.5]) piece(boxG(0.7, H_OUT - 0.5, 0.26).translate(u(x), (H_OUT - 0.5) / 2, 0.12), m.marble)
  for (const x of [-15.5, -10.9, -6.3, 6.3, 10.9, 15.5]) piece(boxG(0.82, 0.46, 0.5).translate(u(x), 6.4, 0.25), m.marbleDark)
  piece(boxG(2 * XD + 0.3, 0.62, 0.22).translate(XD, 0.65, 0.1), m.marble)
  piece(boxG(2 * XD + 0.5, 0.38, 0.5).translate(XD, H_OUT - 0.12, 0.2), m.marble)

  // Alt pencereler ve üst sıra balkon kemerleri (s. 88-89, 106)
  for (const x of [-13.2, -8.6, 8.6, 13.2]) {
    outerWindow(k, m, ym, ax, az, bx, bz, u(x), 1.9, 1.5, 2)
    // Üst pencere: derin kemer ve mermer korkuluk
    const burden = 7.1
    const kem = arch(new THREE.Shape(), u(x), burden, 1.9, 2.3, 1.15)
    plaque(k, kem, ax, az, bx, bz, m.dark, 0, 0.02, false)
    const kCer = arch(new THREE.Shape(), u(x), burden - 0.1, 2.5, 2.4, 1.45)
    kCer.holes.push(arch(new THREE.Path(), u(x), burden, 1.9, 2.3, 1.15))
    k.add(align(subtract(kCer, 0.08, 0.02), ax, az, bx, bz), m.marble)
    piece(boxG(2, 0.76, 0.1).translate(u(x), burden + 0.36, 0.12), ym.railing)
    for (let n = 0; n < 5; n++) piece(boxG(0.14, 0.42, 0.04).translate(u(x) - 0.76 + n * 0.38, burden + 0.36, 0.18), m.dark)
  }
  // Pencere aralarındaki mermer mihrap nişleri (s. 96)
  for (const x of [-10.9, 10.9]) {
    const cer = rect(u(x) - 0.75, 1.5, u(x) + 0.75, 4.9)
    piece(subtract(cer, 0.05, 0.02), m.marble)
    const niche = arch(new THREE.Shape(), u(x), 1.7, 0.95, 1.8, 0.9)
    k.add(align(new THREE.ShapeGeometry(niche, 8).translate(0, 0, 0.075), ax, az, bx, bz), m.marbleDark)
    for (const s of [-1, 1]) piece(cylinderG(0.05, 0.05, 1.1, 8).translate(u(x) + s * 0.6, 2.4, 0.12), ym.greenColumn)
  }

  // Taç kapı: dışa taşmaz; iç içe çerçeveler, mukarnas kavsara (s. 88-90)
  const frameBorder = (g: number, y0: number, y1: number, t: number, slip: number, mat: Mat) => {
    const s = rect(XD - g / 2, y0, XD + g / 2, y1)
    s.holes.push(rect(XD - g / 2 + t, y0 + t, XD + g / 2 - t, y1 - t) as unknown as THREE.Path)
    k.add(align(subtract(s, 0.14, slip), ax, az, bx, bz), mat)
  }
  const TOP = H_OUT - 0.15
  frameBorder(10.2, 0.65, TOP, 0.45, 0.02, m.marble)
  frameBorder(9.1, 1.1, TOP - 0.45, 0.62, 0.02, ym.carving)
  frameBorder(7.8, 1.7, TOP - 1.05, 0.34, 0.02, m.marble)
  // Kemer çevresi köşelikleri
  const kos = rect(XD - 3.56, 6.6, XD + 3.56, TOP - 1.05)
  kos.holes.push(arch(new THREE.Path(), XD, 6.6, portal.g + 0.4, portal.leg - 6.6 + 0.1, portal.arch + 0.2))
  k.add(align(new THREE.ShapeGeometry(kos, 10).translate(0, 0, 0.03), ax, az, bx, bz), ym.carving)
  const ringK = arch(new THREE.Shape(), XD, 6.6, portal.g + 0.5, portal.leg - 6.6 + 0.1, portal.arch + 0.28)
  ringK.holes.push(arch(new THREE.Path(), XD, 6.6, portal.g, portal.leg - 6.6, portal.arch))
  k.add(align(subtract(ringK, 0.16, 0.02), ax, az, bx, bz), m.marble)

  // Niş içi: kapı, kitabe yeri çerçevesi, yan nişler ve mukarnas (ekseni dışa bakacak biçimde)
  const innerZ = 1.4
  const innerExt: Ext = (g, mat) => k.add(align(g.translate(0, 0, -innerZ), ax, az, bx, bz), mat)
  innerExt(boxG(portal.g, 0.34, 1.2).translate(XD, BASE + 0.1, 0.6), m.marble)
  innerExt(boxG(2.5, 3.3, 0.1).translate(XD, BASE + 1.65, 0.05), ym.walnutDark)
  innerExt(boxG(2.8, 0.26, 0.2).translate(XD, BASE + 3.45, 0.1), m.marble)
  innerExt(boxG(3.1, 1.5, 0.16).translate(XD, BASE + 4.4, 0.08), ym.carving)
  for (const s of [-1, 1]) {
    innerExt(boxG(0.9, 3, 0.05).translate(XD + s * 1.85, BASE + 1.8, 0.05), m.marbleDark)
    innerExt(boxG(0.5, 0.5, 0.1).translate(XD + s * 1.85, BASE + 3.9, 0.05), ym.carving)
  }
  muqarnas(innerExt, XD, 6.1, portal.g - 0.1, 4.6, 1.25, m.marble, ym.railing, 9)

  // Kuzeydeki basamaklar ve yan sekiler
  for (let i = 0; i < 4; i++) {
    const dr = 3 - i * 0.7, y = (i + 1) * (BASE / 4)
    k.add(place(boxG(8 - i * 0.6, BASE / 4, dr), 0, y - BASE / 8, ZK - dr / 2), m.marble)
  }

  // Yan pencereler (s. 106: alt sıra dikdörtgen, üstte küçük kemerli)
  for (const s of [-1, 1]) {
    const d = (a: number, c: number, e: number, h: number) => {
      if (s > 0) outerWindow(k, m, ym, XD, ZG, XD, ZK, ZG - a, c, e, h)
      else outerWindow(k, m, ym, -XD, ZK, -XD, ZG, a - ZK, c, e, h)
    }
    for (const z of [-13, -3.5, 5]) d(z, 1.9, 1.4, 1.9)
    for (const z of [-13, -3.5]) {
      const [a0, a1, b0, b1, uu] = s > 0 ? [XD, ZG, XD, ZK, ZG - z] : [-XD, ZK, -XD, ZG, z - ZK]
      const cer = rect(uu - 0.72, 7.4, uu + 0.72, 10.3)
      k.add(align(subtract(cer, 0.06, 0.02), a0, a1, b0, b1), m.marble)
      k.add(align(new THREE.PlaneGeometry(0.95, 2.2).translate(uu, 8.85, 0.09), a0, a1, b0, b1), m.cage)
    }
    // Güney kolu: alt ve üst
    if (s > 0) outerWindow(k, m, ym, XE, ZS, XE, ZG, ZS - 15.5, 2, 1.4, 1.9)
    else outerWindow(k, m, ym, -XE, ZG, -XE, ZS, 15.5 - ZG, 2, 1.4, 1.9)
    outerWindow(k, m, ym, XE, ZS, -XE, ZS, XE + s * 5.5, 2.1, 1.3, 1.8)
    // Saçak altı: güney duvarına kemerli üst pencere
    const uG = XE + s * 5.5
    k.add(align(new THREE.PlaneGeometry(0.95, 1.9).translate(uG, 9, 0.03), XE, ZS, -XE, ZS), m.cage)
    const cG = rect(uG - 0.7, 7.8, uG + 0.7, 10.2)
    cG.holes.push(rect(uG - 0.48, 8.05, uG + 0.48, 9.95) as unknown as THREE.Path)
    k.add(align(subtract(cG, 0.04, 0), XE, ZS, -XE, ZS), m.marble)
  }

  // Saçak silmesi
  const eave = (ax0: number, az0: number, bx0: number, bz0: number) => {
    const L = Math.hypot(bx0 - ax0, bz0 - az0)
    k.add(align(boxG(L + 0.5, 0.28, 0.5).translate(L / 2, H_OUT - 0.14, 0.15), ax0, az0, bx0, bz0), m.marble)
  }
  eave(XD, ZG, XD, ZK); eave(-XD, ZK, -XD, ZG); eave(XD, ZG, XE, ZG); eave(-XE, ZG, -XD, ZG); eave(XE, ZS, XE, ZG); eave(-XE, ZG, -XE, ZS); eave(XE, ZS, -XE, ZS)

  // --- Kurşun çatı: kırma yüzey; kasnak ve eyvan kubbe tabanları açık bırakılır ---
  const step = 0.5, Y_S = H_OUT + 0.03
  const uprightK = { x0: -XD - 0.5, x1: XD + 0.5, z0: ZK - 0.5, z1: ZG + 0.5 }
  const guK = { x0: -XE - 0.5, x1: XE + 0.5, z0: ZG - 0.1, z1: ZS + 0.5 }
  const burden = (x: number, z: number) => {
    const d = (r: typeof uprightK) => Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z)
    return Y_S + Math.min(1.6, 0.42 * Math.max(0, Math.max(d(uprightK), d(guK))))
  }
  const inHole = (x: number, z: number) =>
    (Math.abs(x) < 7.7 && z > MID_Z - 7.7 && z < MIHRAB_Z + 7.7) ||
    Math.hypot(Math.abs(x) - IWAN_X, z - IWAN_Z) < 3.9 || Math.hypot(x, z + 15.6) < 1.3
  const pos: number[] = [], uv: number[] = []
  for (let x = uprightK.x0; x < uprightK.x1 - 1e-6; x += step) for (let z = uprightK.z0; z < guK.z1 - 1e-6; z += step) {
    const mx = x + step / 2, mz = z + step / 2
    const within = (r: typeof uprightK) => mx > r.x0 && mx < r.x1 && mz > r.z0 && mz < r.z1
    if ((!within(uprightK) && !within(guK)) || inHole(mx, mz)) continue
    const x1 = x + step, z1 = z + step
    const P = [[x, z], [x, z1], [x1, z1], [x1, z]].map(([a, b]) => [a, burden(a, b), b])
    const [A, B, C, D] = P
    pos.push(...A, ...B, ...C, ...A, ...C, ...D)
    for (const q of [A, B, C, A, C, D]) uv.push(q[0], q[2])
  }
  const roof = new THREE.BufferGeometry()
  roof.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  roof.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  roof.computeVertexNormals()
  kRoof.add(roof, m.lead)

  // --- Kasnaklar: pembe sıvalı pahlı kare ve sekizgenler (s. 111-112 fotoğrafları) ---
  const KY = 19
  for (const cz of [MID_Z, MIHRAB_Z]) {
    const corner = chamferedSquare(0, cz, 8.1, 1.9)
    kDrum.add(prism(corner, H_OUT + 1, KY), ym.pink)
    kDrum.add(prism(chamferedSquare(0, cz, 8.2, 1.95), KY - 0.3, KY), m.marble)
    // Üstten görünen düz örtü: kubbe eteğine kadar
    const avg = new THREE.Shape()
    corner.forEach(([a, b], i) => (i ? avg.lineTo(a, -(b - cz)) : avg.moveTo(a, -(b - cz))))
    avg.closePath()
    avg.holes.push(new THREE.Path().absarc(0, 0, 6.55, 0, Math.PI * 2, true))
    kDrum.add(new THREE.ShapeGeometry(avg, 32).rotateX(-Math.PI / 2).translate(0, KY, cz), m.lead)
    // Kafesli kasnak pencereleri
    const count = cz === MID_Z ? 2 : 3
    for (const dir of [0, 1, 2, 3]) {
      if (cz === MIHRAB_Z && dir === 2) continue
      if (cz === MID_Z && (dir === 0 || dir === 2)) continue
      for (let n = 0; n < count; n++) {
        const s = arch(new THREE.Shape(), (n - (count - 1) / 2) * 3.2, 15.6, 1.1, 1.3, 0.85)
        kDrum.add(new THREE.ShapeGeometry(s, 8).translate(0, 0, 8.13).rotateY(dir * Math.PI / 2).translate(0, 0, cz), m.cage)
      }
    }
    // Kubbeler: 13 m çap, 25 m tepe (s. 101)
    domeOuter(kDome, m, 0, cz, 6.95, KY, cz === MID_Z ? 6.15 : 6.25, 1.02, cz === MID_Z ? 1.7 : 0)
  }
  // Fener: sekizgen pembe gövde, kafesli pencereler, kurşun külah ve alem (s. 111-112)
  const FY = 25.05
  kDome.add(prism(polygon(8, 1.85, 0, MID_Z), FY - 0.5, FY + 2.4), ym.pink)
  kDome.add(flatShadow(cylinderG(2.05, 2.05, 0.2, 8).rotateY(Math.PI / 8).translate(0, FY + 2.46, MID_Z)), m.dark)
  for (let n = 0; n < 8; n++) {
    const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, FY + 0.1, 0.72, 1.05, 0.5), 6).translate(0, 0, 1.75)
    kDome.add(g.rotateY(n * Math.PI / 4).translate(0, 0, MID_Z), m.cage)
  }
  kDome.add(place(rotateG([[2.15, 0], [1.75, 0.28], [1.2, 0.74], [0.5, 1.05], [0.05, 1.18]], 16, [1, 1]), 0, FY + 2.46, MID_Z), m.dome)
  kDome.add(place(rotateG([[0.1, 0], [0.04, 0.22], [0.12, 0.42], [0.03, 0.8], [0, 0.86]], 8), 0, FY + 3.6, MID_Z), m.gold)

  // Yan eyvan kubbeleri: sekizgen kasnak, 7 m çap, 18 m tepe (s. 103)
  for (const s of [-1, 1]) {
    const ex = s * IWAN_X
    kDrum.add(prism(polygon(8, 4.55, ex, IWAN_Z), H_OUT, 14.6), ym.pink)
    kDrum.add(prism(polygon(8, 4.65, ex, IWAN_Z), 14.32, 14.6), m.marble)
    for (let n = 0; n < 8; n++) {
      const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 13.2, 0.85, 0.65, 0.6), 6).translate(0, 0, 4.22)
      kDrum.add(g.rotateY(n * Math.PI / 4).translate(ex, 0, IWAN_Z), m.cage)
    }
    domeOuter(kDome, m, ex, IWAN_Z, 3.85, 14.6, 3.45, 1.05)
  }

  // Giriş üzerindeki küçük kaburgalı kubbe (s. 85 ve 111)
  kDrum.add(prism(polygon(8, 1.5, 0, -15.6), H_OUT, 14.8), ym.pink)
  domeOuter(kDome, m, 0, -15.6, 1.35, 14.8, 1.25, 1)

  // --- Minareler: dışa taşkın bombeli kaide, tuğla gövde, tek şerefe, mermer külah (s. 110) ---
  const minaret = (x: number, z: number) => {
    const ext: Ext = (g, mat) => k.add(place(g, x, 0, z), mat)
    const base: [number, number][] = [[2.55, 0], [2.85, 0.5], [2.95, 1.6], [2.55, 3.4], [2.1, 5.3], [1.85, 6.8]]
    ext(rotateG(base, 28), m.brick)
    ext(rotateG([[1.8, 6.6], [1.62, 23.6]], 28), m.brick)
    for (const y of [7, 13.2, 18.6, 23.2]) ext(cylinderG(1.75, 1.75, 0.22, 24).translate(0, y, 0), m.marble)
    // Şerefe altı mukarnası
    for (let t = 0; t < 4; t++) {
      const r = 1.65 + t * 0.2, y = 23.6 + t * 0.34
      ext(cylinderG(r + 0.14, r, 0.36, 24).translate(0, y + 0.18, 0), m.marble)
      for (let a = 0; a < 16; a++) {
        const theta = (a + (t % 2) * 0.5) * (Math.PI * 2) / 16
        ext(new THREE.SphereGeometry(0.22, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5).translate(0, y + 0.02, r + 0.05).rotateY(theta), m.marbleDark)
      }
    }
    ext(cylinderG(2.72, 2.72, 0.24, 24).translate(0, 25.05, 0), m.marble)
    for (let a = 0; a < 18; a++) {
      const theta = a * Math.PI * 2 / 18
      ext(boxG(0.8, 0.95, 0.07).translate(0, 25.65, 2.58).rotateY(theta), ym.railing)
      ext(boxG(0.09, 1.05, 0.09).translate(0.46, 25.68, 2.58).rotateY(theta), m.marble)
    }
    ext(cylinderG(2.62, 2.62, 0.1, 24, true).translate(0, 26.22, 0), m.marble)
    ext(rotateG([[1.34, 25], [1.2, 31.5]], 20), m.marble)
    ext(rotateG([[1.28, 31.2], [1.7, 31.65], [1.72, 31.95], [1.25, 32.25]], 20), m.marble)
    // Dilimli mermer külah
    const cone = rotateG([[1.05, 32.2], [1.14, 33], [0.92, 33.7], [1.22, 34.4], [1.24, 34.8], [0.82, 35.3], [0.9, 35.85], [0.26, 38.2], [0.1, 38.8]], 16)
    ext(flatShadow(cone), m.marble)
    ext(rotateG([[0.1, 38.8], [0.04, 39.1], [0.2, 39.35], [0.04, 39.7], [0.13, 39.95], [0.02, 40.6], [0, 40.7]], 8), m.dark)
  }
  minaret(XD + 1.05, ZK - 0.7)
  minaret(-XD - 1.05, ZK - 0.7)
}
