// Yeşil Camii dış kütlesi: ters T plan, mermer kuzey cephesi, kesme taş yanlar, kurşun çatı, pembe kasnaklar,
// kurşun kubbeler ve iki tuğla minare. Kubbe ölçüleri envanterden (s. 101, 103), oranlar drone fotoğrafından (s. 85).
import * as THREE from 'three'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, yer, type Mal } from '../../ulucamiParca'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { YesilMalzemeleri } from './dokular'
import { EYVAN_X, EYVAN_Z, MIHRAP_Z, ORTA_Z, TABAN, mukarnas } from './ic'
import { cokgen, hizala, levha, pahliKare, prizma } from './yardim'

export const XD = 16.3, ZK = -19, ZG = 9.5, ZS = 19.4, XE = 8.4, H_DIS = 12.5

type Ek = (g: THREE.BufferGeometry, mal: Mal) => void

/** Kurşun kubbe: eteği açılan, dikişli. `acik` varsa tepede fener boşluğu kalır. */
export function kubbeDis(kv: Kova, m: UlucamiMalzemeleri, cx: number, cz: number, R: number, y: number, H: number, sivri = 1, acik = 0, alem = true) {
  const p: [number, number][] = [[R + 0.95, -0.22], [R + 0.72, 0.02], [R + 0.3, 0.3]]
  for (let t = 0; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2, r = R * Math.pow(Math.cos(a), 0.9)
    if (acik && r < acik) break
    p.push([Math.max(r, 0.001), 0.3 + H * Math.pow(Math.sin(a), sivri)])
  }
  kv.ekle(yer(dondurG(p, 72, [1, 1]), cx, y, cz), m.kubbe)
  if (alem && !acik) {
    kv.ekle(yer(dondurG([[0.28, 0], [0.09, 0.2], [0.24, 0.42], [0.08, 0.68], [0.17, 0.86], [0.03, 1.25], [0, 1.32]], 10), cx, y + 0.25 + H, cz), m.altin)
  }
}

/** Dış duvara kafesli pencere: mermer çerçeve + firuze kuşak + sivri alınlık + demir parmaklık (s. 88-89). */
function disPencere(k: Kova, m: UlucamiMalzemeleri, ym: YesilMalzemeleri, ax: number, az: number, bx: number, bz: number, u: number, y0: number, g: number, h: number) {
  const dis = dikdortgen(u - g / 2 - 0.62, y0 - 0.62, u + g / 2 + 0.62, y0 + h + 2.1)
  const icP = new THREE.Path(); icP.moveTo(u - g / 2, y0); icP.lineTo(u + g / 2, y0); icP.lineTo(u + g / 2, y0 + h); icP.lineTo(u - g / 2, y0 + h); icP.closePath()
  dis.holes.push(icP)
  k.ekle(hizala(cikar(dis, 0.1, 0), ax, az, bx, bz), m.mermer)
  // Firuze kuşak
  const kusak = dikdortgen(u - g / 2 - 0.42, y0 - 0.42, u + g / 2 + 0.42, y0 + h + 1.9)
  kusak.holes.push(dikdortgen(u - g / 2 - 0.32, y0 - 0.32, u + g / 2 + 0.32, y0 + h + 1.8) as unknown as THREE.Path)
  k.ekle(hizala(new THREE.ShapeGeometry(kusak).translate(0, 0, 0.115), ax, az, bx, bz), ym.firizFiruze)
  // Parmaklık
  k.ekle(hizala(new THREE.PlaneGeometry(g, h).translate(u, y0 + h / 2, 0.015), ax, az, bx, bz), m.koyu)
  k.ekle(hizala(new THREE.PlaneGeometry(g, h).translate(u, y0 + h / 2, 0.03), ax, az, bx, bz), ym.demir)
  // Sivri kemerli alınlık
  const alin = kemer(new THREE.Shape(), u, y0 + h + 0.1, g + 0.2, 0.25, 1.25)
  levha(k, alin, ax, az, bx, bz, ym.oyma, 0, 0.115)
}

export function camiDisi(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  // Sekiler ve döşeme altı
  k.ekle(yer(kutuG(2 * XD + 1, TABAN, ZG - ZK + 1), 0, TABAN / 2, (ZK + ZG) / 2), m.mermer)
  k.ekle(yer(kutuG(2 * XE + 1, TABAN, ZS - ZG + 1), 0, TABAN / 2, (ZS + ZG) / 2), m.mermer)

  // Gövde: N cephe mermer; diğer cepheler kesme taş (s. 96)
  const yanDuvar = (ax: number, az: number, bx: number, bz: number, t: number, mal: Mal) => {
    const L = Math.hypot(bx - ax, bz - az)
    k.ekle(hizala(cikar(dikdortgen(0, 0, L, H_DIS), t), ax, az, bx, bz), mal)
    k.ekle(hizala(kutuG(L + 0.1, 1.5, 0.12).translate(L / 2, 0.75, -0.04), ax, az, bx, bz), m.mermer)
  }
  yanDuvar(XD, ZK, XD, ZG, 1, m.mermerKoyu)         // doğu: normal -x (içe)
  yanDuvar(-XD, ZG, -XD, ZK, 1, m.mermerKoyu)       // batı
  yanDuvar(XD, ZG, XE, ZG, 1, m.mermerKoyu)
  yanDuvar(-XE, ZG, -XD, ZG, 1, m.mermerKoyu)
  yanDuvar(XE, ZG, XE, ZS, 1, m.mermerKoyu)
  yanDuvar(-XE, ZS, -XE, ZG, 1, m.mermerKoyu)
  yanDuvar(XE, ZS, -XE, ZS, 1.6, m.mermerKoyu)

  // Kuzey cephesi (a→b doğudan batıya değil, batıdan doğuya: kalınlık içe)
  const NA = -XD, NB = XD
  const portal = { g: 4.8, ayak: 7.2, kemer: 3.6 }
  const nDuvar = dikdortgen(0, 0, 2 * XD, H_DIS)
  nDuvar.holes.push(kemer(new THREE.Path(), XD, TABAN + 0.3, portal.g, portal.ayak - TABAN - 0.3, portal.kemer))
  k.ekle(hizala(cikar(nDuvar, 1.7), NA, ZK, NB, ZK), m.mermer)
  // Taç kapı arkası: kapı nişi
  const dPlaka = dikdortgen(XD - portal.g / 2 - 0.1, TABAN, XD + portal.g / 2 + 0.1, 11.5)
  k.ekle(hizala(cikar(dPlaka, 0.3, 1.7), NA, ZK, NB, ZK), m.mermer)

  // Dış yüz: duvarın kuzey yüzüne baktığı için a→b doğudan batıya, normal -z
  const ax = XD, az = ZK, bx = -XD, bz = ZK
  const u = (x: number) => XD - x
  const parca: Ek = (g, mal) => k.ekle(hizala(g, ax, az, bx, bz), mal)

  // Silmeler, ayak izleri (tamamlanmamış son cemaat yeri kemer üzengileri, s. 88)
  for (const x of [-15.5, -6.3, 6.3, 15.5]) parca(kutuG(0.7, H_DIS - 0.5, 0.26).translate(u(x), (H_DIS - 0.5) / 2, 0.12), m.mermer)
  for (const x of [-15.5, -10.9, -6.3, 6.3, 10.9, 15.5]) parca(kutuG(0.82, 0.46, 0.5).translate(u(x), 6.4, 0.25), m.mermerKoyu)
  parca(kutuG(2 * XD + 0.3, 0.62, 0.22).translate(XD, 0.65, 0.1), m.mermer)
  parca(kutuG(2 * XD + 0.5, 0.38, 0.5).translate(XD, H_DIS - 0.12, 0.2), m.mermer)

  // Alt pencereler ve üst sıra balkon kemerleri (s. 88-89, 106)
  for (const x of [-13.2, -8.6, 8.6, 13.2]) {
    disPencere(k, m, ym, ax, az, bx, bz, u(x), 1.9, 1.5, 2)
    // Üst pencere: derin kemer ve mermer korkuluk
    const yuk = 7.1
    const kem = kemer(new THREE.Shape(), u(x), yuk, 1.9, 2.3, 1.15)
    levha(k, kem, ax, az, bx, bz, m.koyu, 0, 0.02, false)
    const kCer = kemer(new THREE.Shape(), u(x), yuk - 0.1, 2.5, 2.4, 1.45)
    kCer.holes.push(kemer(new THREE.Path(), u(x), yuk, 1.9, 2.3, 1.15))
    k.ekle(hizala(cikar(kCer, 0.08, 0.02), ax, az, bx, bz), m.mermer)
    parca(kutuG(2, 0.76, 0.1).translate(u(x), yuk + 0.36, 0.12), ym.korkuluk)
    for (let n = 0; n < 5; n++) parca(kutuG(0.14, 0.42, 0.04).translate(u(x) - 0.76 + n * 0.38, yuk + 0.36, 0.18), m.koyu)
  }
  // Pencere aralarındaki mermer mihrap nişleri (s. 96)
  for (const x of [-10.9, 10.9]) {
    const cer = dikdortgen(u(x) - 0.75, 1.5, u(x) + 0.75, 4.9)
    parca(cikar(cer, 0.05, 0.02), m.mermer)
    const nis = kemer(new THREE.Shape(), u(x), 1.7, 0.95, 1.8, 0.9)
    k.ekle(hizala(new THREE.ShapeGeometry(nis, 8).translate(0, 0, 0.075), ax, az, bx, bz), m.mermerKoyu)
    for (const s of [-1, 1]) parca(silindirG(0.05, 0.05, 1.1, 8).translate(u(x) + s * 0.6, 2.4, 0.12), ym.yesilSutun)
  }

  // Taç kapı: dışa taşmaz; iç içe çerçeveler, mukarnas kavsara (s. 88-90)
  const cerceve = (g: number, y0: number, y1: number, t: number, kayma: number, mal: Mal) => {
    const s = dikdortgen(XD - g / 2, y0, XD + g / 2, y1)
    s.holes.push(dikdortgen(XD - g / 2 + t, y0 + t, XD + g / 2 - t, y1 - t) as unknown as THREE.Path)
    k.ekle(hizala(cikar(s, 0.14, kayma), ax, az, bx, bz), mal)
  }
  const TOP = H_DIS - 0.15
  cerceve(10.2, 0.65, TOP, 0.45, 0.02, m.mermer)
  cerceve(9.1, 1.1, TOP - 0.45, 0.62, 0.02, ym.oyma)
  cerceve(7.8, 1.7, TOP - 1.05, 0.34, 0.02, m.mermer)
  // Kemer çevresi köşelikleri
  const kos = dikdortgen(XD - 3.56, 6.6, XD + 3.56, TOP - 1.05)
  kos.holes.push(kemer(new THREE.Path(), XD, 6.6, portal.g + 0.4, portal.ayak - 6.6 + 0.1, portal.kemer + 0.2))
  k.ekle(hizala(new THREE.ShapeGeometry(kos, 10).translate(0, 0, 0.03), ax, az, bx, bz), ym.oyma)
  const halkaK = kemer(new THREE.Shape(), XD, 6.6, portal.g + 0.5, portal.ayak - 6.6 + 0.1, portal.kemer + 0.28)
  halkaK.holes.push(kemer(new THREE.Path(), XD, 6.6, portal.g, portal.ayak - 6.6, portal.kemer))
  k.ekle(hizala(cikar(halkaK, 0.16, 0.02), ax, az, bx, bz), m.mermer)

  // Niş içi: kapı, kitabe yeri çerçevesi, yan nişler ve mukarnas (ekseni dışa bakacak biçimde)
  const icZ = 1.4
  const icEk: Ek = (g, mal) => k.ekle(hizala(g.translate(0, 0, -icZ), ax, az, bx, bz), mal)
  icEk(kutuG(portal.g, 0.34, 1.2).translate(XD, TABAN + 0.1, 0.6), m.mermer)
  icEk(kutuG(2.5, 3.3, 0.1).translate(XD, TABAN + 1.65, 0.05), ym.cevizKoyu)
  icEk(kutuG(2.8, 0.26, 0.2).translate(XD, TABAN + 3.45, 0.1), m.mermer)
  icEk(kutuG(3.1, 1.5, 0.16).translate(XD, TABAN + 4.4, 0.08), ym.oyma)
  for (const s of [-1, 1]) {
    icEk(kutuG(0.9, 3, 0.05).translate(XD + s * 1.85, TABAN + 1.8, 0.05), m.mermerKoyu)
    icEk(kutuG(0.5, 0.5, 0.1).translate(XD + s * 1.85, TABAN + 3.9, 0.05), ym.oyma)
  }
  mukarnas(icEk, XD, 6.1, portal.g - 0.1, 4.6, 1.25, m.mermer, ym.korkuluk, 9)

  // Kuzeydeki basamaklar ve yan sekiler
  for (let i = 0; i < 4; i++) {
    const dr = 3 - i * 0.7, y = (i + 1) * (TABAN / 4)
    k.ekle(yer(kutuG(8 - i * 0.6, TABAN / 4, dr), 0, y - TABAN / 8, ZK - dr / 2), m.mermer)
  }

  // Yan pencereler (s. 106: alt sıra dikdörtgen, üstte küçük kemerli)
  for (const s of [-1, 1]) {
    const d = (a: number, c: number, e: number, h: number) => {
      if (s > 0) disPencere(k, m, ym, XD, ZG, XD, ZK, ZG - a, c, e, h)
      else disPencere(k, m, ym, -XD, ZK, -XD, ZG, a - ZK, c, e, h)
    }
    for (const z of [-13, -3.5, 5]) d(z, 1.9, 1.4, 1.9)
    for (const z of [-13, -3.5]) {
      const [a0, a1, b0, b1, uu] = s > 0 ? [XD, ZG, XD, ZK, ZG - z] : [-XD, ZK, -XD, ZG, z - ZK]
      const cer = dikdortgen(uu - 0.72, 7.4, uu + 0.72, 10.3)
      k.ekle(hizala(cikar(cer, 0.06, 0.02), a0, a1, b0, b1), m.mermer)
      k.ekle(hizala(new THREE.PlaneGeometry(0.95, 2.2).translate(uu, 8.85, 0.09), a0, a1, b0, b1), m.kafes)
    }
    // Güney kolu: alt ve üst
    if (s > 0) disPencere(k, m, ym, XE, ZS, XE, ZG, ZS - 15.5, 2, 1.4, 1.9)
    else disPencere(k, m, ym, -XE, ZG, -XE, ZS, 15.5 - ZG, 2, 1.4, 1.9)
    disPencere(k, m, ym, XE, ZS, -XE, ZS, XE + s * 5.5, 2.1, 1.3, 1.8)
    // Saçak altı: güney duvarına kemerli üst pencere
    const uG = XE + s * 5.5
    k.ekle(hizala(new THREE.PlaneGeometry(0.95, 1.9).translate(uG, 9, 0.03), XE, ZS, -XE, ZS), m.kafes)
    const cG = dikdortgen(uG - 0.7, 7.8, uG + 0.7, 10.2)
    cG.holes.push(dikdortgen(uG - 0.48, 8.05, uG + 0.48, 9.95) as unknown as THREE.Path)
    k.ekle(hizala(cikar(cG, 0.04, 0), XE, ZS, -XE, ZS), m.mermer)
  }

  // Saçak silmesi
  const sacak = (ax0: number, az0: number, bx0: number, bz0: number) => {
    const L = Math.hypot(bx0 - ax0, bz0 - az0)
    k.ekle(hizala(kutuG(L + 0.5, 0.28, 0.5).translate(L / 2, H_DIS - 0.14, 0.15), ax0, az0, bx0, bz0), m.mermer)
  }
  sacak(XD, ZG, XD, ZK); sacak(-XD, ZK, -XD, ZG); sacak(XD, ZG, XE, ZG); sacak(-XE, ZG, -XD, ZG); sacak(XE, ZS, XE, ZG); sacak(-XE, ZG, -XE, ZS); sacak(XE, ZS, -XE, ZS)

  // --- Kurşun çatı: kırma yüzey; kasnak ve eyvan kubbe tabanları açık bırakılır ---
  const adim = 0.5, Y_S = H_DIS + 0.03
  const dikK = { x0: -XD - 0.5, x1: XD + 0.5, z0: ZK - 0.5, z1: ZG + 0.5 }
  const guK = { x0: -XE - 0.5, x1: XE + 0.5, z0: ZG - 0.1, z1: ZS + 0.5 }
  const yuk = (x: number, z: number) => {
    const d = (r: typeof dikK) => Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z)
    return Y_S + Math.min(1.6, 0.42 * Math.max(0, Math.max(d(dikK), d(guK))))
  }
  const delikte = (x: number, z: number) =>
    (Math.abs(x) < 7.7 && z > ORTA_Z - 7.7 && z < MIHRAP_Z + 7.7) ||
    Math.hypot(Math.abs(x) - EYVAN_X, z - EYVAN_Z) < 3.9 || Math.hypot(x, z + 15.6) < 1.3
  const pos: number[] = [], uv: number[] = []
  for (let x = dikK.x0; x < dikK.x1 - 1e-6; x += adim) for (let z = dikK.z0; z < guK.z1 - 1e-6; z += adim) {
    const mx = x + adim / 2, mz = z + adim / 2
    const icinde = (r: typeof dikK) => mx > r.x0 && mx < r.x1 && mz > r.z0 && mz < r.z1
    if ((!icinde(dikK) && !icinde(guK)) || delikte(mx, mz)) continue
    const x1 = x + adim, z1 = z + adim
    const P = [[x, z], [x, z1], [x1, z1], [x1, z]].map(([a, b]) => [a, yuk(a, b), b])
    const [A, B, C, D] = P
    pos.push(...A, ...B, ...C, ...A, ...C, ...D)
    for (const q of [A, B, C, A, C, D]) uv.push(q[0], q[2])
  }
  const cati = new THREE.BufferGeometry()
  cati.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  cati.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  cati.computeVertexNormals()
  kCati.ekle(cati, m.kursun)

  // --- Kasnaklar: pembe sıvalı pahlı kare ve sekizgenler (s. 111-112 fotoğrafları) ---
  const KY = 19
  for (const cz of [ORTA_Z, MIHRAP_Z]) {
    const kose = pahliKare(0, cz, 8.1, 1.9)
    kKasnak.ekle(prizma(kose, H_DIS + 1, KY), ym.pembe)
    kKasnak.ekle(prizma(pahliKare(0, cz, 8.2, 1.95), KY - 0.3, KY), m.mermer)
    // Üstten görünen düz örtü: kubbe eteğine kadar
    const ort = new THREE.Shape()
    kose.forEach(([a, b], i) => (i ? ort.lineTo(a, -(b - cz)) : ort.moveTo(a, -(b - cz))))
    ort.closePath()
    ort.holes.push(new THREE.Path().absarc(0, 0, 6.55, 0, Math.PI * 2, true))
    kKasnak.ekle(new THREE.ShapeGeometry(ort, 32).rotateX(-Math.PI / 2).translate(0, KY, cz), m.kursun)
    // Kafesli kasnak pencereleri
    const adet = cz === ORTA_Z ? 2 : 3
    for (const yon of [0, 1, 2, 3]) {
      if (cz === MIHRAP_Z && yon === 2) continue
      if (cz === ORTA_Z && (yon === 0 || yon === 2)) continue
      for (let n = 0; n < adet; n++) {
        const s = kemer(new THREE.Shape(), (n - (adet - 1) / 2) * 3.2, 15.6, 1.1, 1.3, 0.85)
        kKasnak.ekle(new THREE.ShapeGeometry(s, 8).translate(0, 0, 8.13).rotateY(yon * Math.PI / 2).translate(0, 0, cz), m.kafes)
      }
    }
    // Kubbeler: 13 m çap, 25 m tepe (s. 101)
    kubbeDis(kKubbe, m, 0, cz, 6.95, KY, cz === ORTA_Z ? 6.15 : 6.25, 1.02, cz === ORTA_Z ? 1.7 : 0)
  }
  // Fener: sekizgen pembe gövde, kafesli pencereler, kurşun külah ve alem (s. 111-112)
  const FY = 25.05
  kKubbe.ekle(prizma(cokgen(8, 1.85, 0, ORTA_Z), FY - 0.5, FY + 2.4), ym.pembe)
  kKubbe.ekle(duzGolge(silindirG(2.05, 2.05, 0.2, 8).rotateY(Math.PI / 8).translate(0, FY + 2.46, ORTA_Z)), m.koyu)
  for (let n = 0; n < 8; n++) {
    const g = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, FY + 0.1, 0.72, 1.05, 0.5), 6).translate(0, 0, 1.75)
    kKubbe.ekle(g.rotateY(n * Math.PI / 4).translate(0, 0, ORTA_Z), m.kafes)
  }
  kKubbe.ekle(yer(dondurG([[2.15, 0], [1.75, 0.28], [1.2, 0.74], [0.5, 1.05], [0.05, 1.18]], 16, [1, 1]), 0, FY + 2.46, ORTA_Z), m.kubbe)
  kKubbe.ekle(yer(dondurG([[0.1, 0], [0.04, 0.22], [0.12, 0.42], [0.03, 0.8], [0, 0.86]], 8), 0, FY + 3.6, ORTA_Z), m.altin)

  // Yan eyvan kubbeleri: sekizgen kasnak, 7 m çap, 18 m tepe (s. 103)
  for (const s of [-1, 1]) {
    const ex = s * EYVAN_X
    kKasnak.ekle(prizma(cokgen(8, 4.55, ex, EYVAN_Z), H_DIS, 14.6), ym.pembe)
    kKasnak.ekle(prizma(cokgen(8, 4.65, ex, EYVAN_Z), 14.32, 14.6), m.mermer)
    for (let n = 0; n < 8; n++) {
      const g = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, 13.2, 0.85, 0.65, 0.6), 6).translate(0, 0, 4.22)
      kKasnak.ekle(g.rotateY(n * Math.PI / 4).translate(ex, 0, EYVAN_Z), m.kafes)
    }
    kubbeDis(kKubbe, m, ex, EYVAN_Z, 3.85, 14.6, 3.45, 1.05)
  }

  // Giriş üzerindeki küçük kaburgalı kubbe (s. 85 ve 111)
  kKasnak.ekle(prizma(cokgen(8, 1.5, 0, -15.6), H_DIS, 14.8), ym.pembe)
  kubbeDis(kKubbe, m, 0, -15.6, 1.35, 14.8, 1.25, 1)

  // --- Minareler: dışa taşkın bombeli kaide, tuğla gövde, tek şerefe, mermer külah (s. 110) ---
  const minare = (x: number, z: number) => {
    const ek: Ek = (g, mal) => k.ekle(yer(g, x, 0, z), mal)
    const taban: [number, number][] = [[2.55, 0], [2.85, 0.5], [2.95, 1.6], [2.55, 3.4], [2.1, 5.3], [1.85, 6.8]]
    ek(dondurG(taban, 28), m.tugla)
    ek(dondurG([[1.8, 6.6], [1.62, 23.6]], 28), m.tugla)
    for (const y of [7, 13.2, 18.6, 23.2]) ek(silindirG(1.75, 1.75, 0.22, 24).translate(0, y, 0), m.mermer)
    // Şerefe altı mukarnası
    for (let t = 0; t < 4; t++) {
      const r = 1.65 + t * 0.2, y = 23.6 + t * 0.34
      ek(silindirG(r + 0.14, r, 0.36, 24).translate(0, y + 0.18, 0), m.mermer)
      for (let a = 0; a < 16; a++) {
        const teta = (a + (t % 2) * 0.5) * (Math.PI * 2) / 16
        ek(new THREE.SphereGeometry(0.22, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5).translate(0, y + 0.02, r + 0.05).rotateY(teta), m.mermerKoyu)
      }
    }
    ek(silindirG(2.72, 2.72, 0.24, 24).translate(0, 25.05, 0), m.mermer)
    for (let a = 0; a < 18; a++) {
      const teta = a * Math.PI * 2 / 18
      ek(kutuG(0.8, 0.95, 0.07).translate(0, 25.65, 2.58).rotateY(teta), ym.korkuluk)
      ek(kutuG(0.09, 1.05, 0.09).translate(0.46, 25.68, 2.58).rotateY(teta), m.mermer)
    }
    ek(silindirG(2.62, 2.62, 0.1, 24, true).translate(0, 26.22, 0), m.mermer)
    ek(dondurG([[1.34, 25], [1.2, 31.5]], 20), m.mermer)
    ek(dondurG([[1.28, 31.2], [1.7, 31.65], [1.72, 31.95], [1.25, 32.25]], 20), m.mermer)
    // Dilimli mermer külah
    const kulah = dondurG([[1.05, 32.2], [1.14, 33], [0.92, 33.7], [1.22, 34.4], [1.24, 34.8], [0.82, 35.3], [0.9, 35.85], [0.26, 38.2], [0.1, 38.8]], 16)
    ek(duzGolge(kulah), m.mermer)
    ek(dondurG([[0.1, 38.8], [0.04, 39.1], [0.2, 39.35], [0.04, 39.7], [0.13, 39.95], [0.02, 40.6], [0, 40.7]], 8), m.koyu)
  }
  minare(XD + 1.05, ZK - 0.7)
  minare(-XD - 1.05, ZK - 0.7)
}
