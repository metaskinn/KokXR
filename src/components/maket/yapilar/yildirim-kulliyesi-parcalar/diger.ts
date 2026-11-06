// Külliyenin diğer yapıları: türbe, medrese, darüşşifa, şadırvan köşkü ve bahçe.
// Yerleşim ve kütleler fotoğraftan (Drive; envanter s. 162 havadan görünüm) oranlanmış, ölçüler envanterden alınmıştır
// (türbe 10,50 m kare, s. 204; medrese avlusu 200 m² ve dershane 8,65 × 8,86 m, s. 186; darüşşifa 30 × 53 m, s. 195).
// Darüşşifa gerçekte yaklaşık 300 m doğudadır (s. 193); makete sığsın diye yakına alınmıştır.
import * as THREE from 'three'
import { dondurG, duzGolge, kemer, Kova, kutuG, silindirG, yer } from '../../ulucamiParca'
import { agac, almasikKemer, cati, disKasnak, disKubbe, disPencere, duvarX, duvarZ, kutuK, selvi, silme, type Mal, type YM } from './ortak'

const YERLESIM = {
  turbe: { x: -4, z: -54, ry: 0.76 },
  medrese: { x: -41, z: -36, ry: 0.76 },
  darussifa: { x: 52, z: -36, ry: -Math.PI / 2 },
}

interface Y { ek: (g: THREE.BufferGeometry, mal: Mal) => void; cati: (g: THREE.BufferGeometry, mal: Mal) => void; kasnak: Kova; kubbe: Kova; koy: (kv: Kova, g: THREE.BufferGeometry, mal: Mal) => void }
function yerlesik(k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova, p: { x: number; z: number; ry: number }): Y {
  return {
    ek: (g, mal) => k.ekle(yer(g, p.x, 0, p.z, p.ry), mal),
    cati: (g, mal) => kCati.ekle(yer(g, p.x, 0, p.z, p.ry), mal),
    kasnak: kKasnak, kubbe: kKubbe,
    koy: (kv, g, mal) => kv.ekle(yer(g, p.x, 0, p.z, p.ry), mal),
  }
}

/** Dış duvarın boyunca pencere dizisi: `yon` duvarın baktığı yöne göre döndürülür. */
function pencereDizi(y: Y, m: YM, ry: number, ox: number, oz: number, xler: number[], y0: number, g: number, h: number, sivri: boolean, sove: Mal) {
  const ek = (a: THREE.BufferGeometry, mal: Mal) => { y.ek(yer(a, ox, 0, oz, ry), mal) }
  for (const x of xler) disPencere(ek, m, x, y0, g, h, 0, sivri, sove)
}

export function turbe(m: YM, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  const y = yerlesik(k, kCati, kKasnak, kKubbe, YERLESIM.turbe)
  const { ek } = y
  const kutu = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal) => ek(kutuK(x0, x1, y0, y1, z0, z1), mal)
  const B = 6.75, H = 8, TAB = 0.7, REV_Z = -B - 5.4
  // Kaide ve zemin
  kutu(-B - 0.5, B + 0.5, 0, TAB, -B - 5.9, B + 0.4, m.kesmeAcik)
  for (let i = 0; i < 3; i++) kutu(-1.8 + i * 0.1, 1.8 - i * 0.1, 0, TAB * (3 - i) / 3, -B - 6.0 - (3 - i) * 0.4, -B - 6.0 - (2 - i) * 0.4, m.kesmeAcik)
  // Gövde: dört duvar, içte sıva; köşelerde beyaz mermer (s. 204)
  const K = 1.1
  kutu(-B, B, TAB, H, -B, -B + K, m.almasik); kutu(-B, B, TAB, H, B - K, B, m.almasik)
  kutu(-B, -B + K, TAB, H, -B, B, m.almasik); kutu(B - K, B, TAB, H, -B, B, m.almasik)
  for (const [x, z] of [[-B, B], [B, B]] as const) kutu(x - 0.04 * Math.sign(-x) - 0.4, x + 0.4, TAB, H, z - 0.4, z + 0.04, m.beyazTas)
  const I = B - K - 0.03
  kutu(-I, I, TAB, TAB + 0.04, -I, I, m.haliK)
  for (const [a, b, c, d] of [[-I, I, -I, -I + 0.04], [-I, I, I - 0.04, I], [-I, -I + 0.04, -I, I], [I - 0.04, I, -I, I]]) kutu(a, b, TAB, H - 0.1, c, d, m.sivaIc)
  // Sandukalar: Yıldırım Bayezid ortada, demir parmaklık içinde (s. 204, 207)
  const sanduka = (x: number, z: number, g: number, d: number, h: number) => {
    ek(kutuK(x - g / 2, x + g / 2, TAB, TAB + h, z - d / 2, z + d / 2), m.sanduka)
    ek(new THREE.SphereGeometry(g * 0.3, 8, 5).scale(1, 0.55, 1).translate(x, TAB + h + 0.3, z - d / 2 + g * 0.45), m.krem)
    ek(silindirG(g * 0.28, g * 0.24, 0.3, 8).translate(x, TAB + h + 0.14, z - d / 2 + g * 0.45), m.krem)
  }
  sanduka(0, 0.2, 1, 2.6, 1.05); sanduka(-2.2, 0.2, 0.85, 2.2, 0.85); sanduka(2.2, 0.2, 0.85, 2.2, 0.85); sanduka(-0.9, 3.1, 0.55, 1.1, 0.55); sanduka(0.9, 3.1, 0.55, 1.1, 0.55)
  for (let i = 0; i <= 12; i++) { const z = -1.5 + i * 0.3; for (const x of [-0.9, 0.9]) ek(kutuK(x - 0.02, x + 0.02, TAB, TAB + 1.35, z - 0.02, z + 0.02), m.yesilDemir) }
  for (let i = 0; i <= 6; i++) { const x = -0.9 + i * 0.3; for (const z of [-1.5, 2.1]) ek(kutuK(x - 0.02, x + 0.02, TAB, TAB + 1.35, z - 0.02, z + 0.02), m.yesilDemir) }
  // Cephe pencereleri: batıda üç, doğuda iki (biri kapalı), güneyde iki (s. 204, 206). Dikdörtgen niş içinde sivri.
  const niş = (ry: number, ox: number, oz: number, xler: number[]) => {
    const e2 = (a: THREE.BufferGeometry, mal: Mal) => ek(yer(a, ox, 0, oz, ry), mal)
    for (const x of xler) {
      e2(kutuK(x - 0.75, x + 0.75, TAB + 0.9, TAB + 4.5, -0.04, 0.03), m.tuglaKemer)
      e2(new THREE.ShapeGeometry(kemer(new THREE.Shape(), x, TAB + 1.2, 0.95, 1.8, 1.05), 8).translate(0, 0, 0.04), m.demirKoyu)
      almasikKemer(e2, m, x, TAB + 1.2 + 1.8 - 0.01, 0.95, 0.01, 1.05, 0.22, 0.06, 0.03, 9)
    }
  }
  niş(0, 0, B, [-2.9, 2.9])
  niş(Math.PI / 2, B, 0, [-3.4, 0, 3.4])
  niş(-Math.PI / 2, -B, 0, [-3.4, 3.4])
  // Saçak silmesi ve kurşun etek
  silme(ek, m.tuglaKemer, -B - 0.1, B + 0.1, H - 0.28, H, -B - 0.1, B + 0.1, 0.4)
  cati((g) => y.cati(g, m.kursun), -B, B, -B, B, H, H + 0.8, 0.5, 0.9, [{ x: 0, z: 0, r: 5.3 }])
  // Kasnak ve kubbe: sekizgen, üç penceresi; kubbe iri mukarnasla oturur (s. 204)
  const R = YERLESIM.turbe
  const gx = (lx: number, lz: number) => [R.x + lx * Math.cos(R.ry) + lz * Math.sin(R.ry), R.z - lx * Math.sin(R.ry) + lz * Math.cos(R.ry)] as const
  const [cx, cz] = gx(0, 0)
  disKasnak(y.koy, kKasnak, m, 0, 0, H + 0.45, 2.5, 6.2, 8, 3)
  disKubbe((kv, g, mal) => kv.ekle(g, mal), kKubbe, m, cx, cz, H + 2.9, 6.3, 4.9, 1.1)
  // Üstten bakınca: iç kapak (parçalanmış görünüşte içeri görülür)
  // Revak: önde üç, yanlarda birer sivri kemer; köşelerde mermer ayak, ortada koyu bordo iki sütun; üç kubbe (s. 204)
  const RH = 6.9
  const onDel = [-3.85, 3.85].map((x) => kemer(new THREE.Path(), x, TAB + 3.0, 3.45, 0.02, 2.05))
  onDel.push(kemer(new THREE.Path(), 0, TAB + 3.0, 3.6, 0.02, 2.15))
  ek(duvarX(-B, B, REV_Z, REV_Z + 1.1, TAB + 3, RH, onDel), m.almasik)
  for (const s of [-1, 1]) {
    const [a, b] = s > 0 ? [B - 1.1, B] : [-B, -B + 1.1]
    const yan = kemer(new THREE.Path(), (REV_Z - B) / 2 + 0.2, TAB + 3, 2.9, 0.02, 2.05)
    ek(duvarZ(a, b, REV_Z, -B, TAB + 3, RH, [yan]), m.almasik)
    kutu(s > 0 ? B - 1.45 : -B, s > 0 ? B : -B + 1.45, TAB, TAB + 3.1, REV_Z, REV_Z + 1.45, m.beyazTas)
    kutu(s > 0 ? B - 1.1 : -B, s > 0 ? B : -B + 1.1, TAB, TAB + 3.1, -B - 1.2, -B, m.beyazTas)
    ek(silindirG(0.26, 0.27, 2.75, 10).translate(s * 1.92, TAB + 1.5, REV_Z + 0.55), m.bordo)
    ek(kutuG(0.8, 0.28, 0.8).translate(s * 1.92, TAB + 0.14, REV_Z + 0.55), m.beyazTas)
    ek(silindirG(0.56, 0.26, 0.45, 8).translate(s * 1.92, TAB + 3, REV_Z + 0.55), m.beyazTas)
    almasikKemer(ek, m, s * 3.85, TAB + 3.0, 3.45, 0.02, 2.05, 0.42, 0.08, REV_Z - 0.05, 15)
    const e3 = (a2: THREE.BufferGeometry, mal: Mal) => ek(yer(a2, s * (B + 0.0), 0, (REV_Z - B) / 2 + 0.2, s * Math.PI / 2), mal)
    almasikKemer(e3, m, 0, TAB + 3, 2.9, 0.02, 2.05, 0.4, 0.06, -0.02, 13)
  }
  almasikKemer(ek, m, 0, TAB + 3.0, 3.6, 0.02, 2.15, 0.42, 0.08, REV_Z - 0.05, 15)
  // Kapı: koyu ahşap, kitabeli alınlık; yan pencereler
  kutu(-1.25, 1.25, TAB, TAB + 4.4, -B - 0.08, -B, m.beyazTas)
  kutu(-0.75, 0.75, TAB, TAB + 2.6, -B - 0.11, -B - 0.08, m.ahsapKoyu)
  kutu(-0.6, 0.6, TAB + 3.1, TAB + 3.7, -B - 0.11, -B - 0.08, m.altinKoyu)
  for (const s of [-1, 1]) {
    const x = s * 3.6
    const ser = new THREE.ShapeGeometry(kemer(new THREE.Shape(), x, TAB + 0.9, 1, 1.5, 0.9), 8).rotateY(0).translate(0, 0, -B - 0.05)
    ek(ser, m.demirKoyu)
  }
  kutu(-B + 0.1, B - 0.1, TAB + 0.0, TAB + 0.02, REV_Z + 1, -B, m.mermerKoyu)
  silme(ek, m.tuglaKemer, -B - 0.08, B + 0.08, RH - 0.16, RH, REV_Z - 0.1, -B, 0.3)
  cati((g) => y.cati(g, m.kursun), -B, B, REV_Z, -B, RH + 0.02, RH + 0.14, 0.42, 0.25, [])
  const rz = (REV_Z - B) / 2 + 0.45
  for (const x of [-4.25, 0, 4.25]) {
    const [dx, dz] = gx(x, rz)
    disKubbe((kv, g, mal) => kv.ekle(g, mal), kKubbe, m, dx, dz, RH + 0.14, 1.9, 1.8, 0.65)
  }
}

export function medrese(m: YM, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  const y = yerlesik(k, kCati, kKasnak, kKubbe, YERLESIM.medrese)
  const { ek } = y
  const kutu = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal) => ek(kutuK(x0, x1, y0, y1, z0, z1), mal)
  // Yerel +x giriş (doğu), -x dershane (batı). Dış ölçü fotoğraftan, avlu 200 m² (s. 186).
  const X0 = -16, X1 = 17, ZD = 10.6, H = 6, AX0 = -11.8, AX1 = 11.4, AZ = 4.3
  const REV = 2.5
  kutu(X0 - 0.3, X1 + 0.3, 0, 0.5, -ZD - 0.3, ZD + 0.3, m.kesme)
  // Dış duvar: almaşık; giriş cephesi beyaz kesme taş (s. 185)
  kutu(X0, X1 - 0.8, 0.5, H, -ZD, -ZD + 0.8, m.almasik)
  kutu(X0, X1 - 0.8, 0.5, H, ZD - 0.8, ZD, m.almasik)
  kutu(X0, X0 + 0.8, 0.5, H, -ZD, ZD, m.almasik)
  const port = kemer(new THREE.Path(), 0, 0.5, 4.2, 3.2, 2.9)
  ek(duvarZ(X1 - 1, X1, -ZD, ZD, 0.5, 8.2, [port]), m.beyazTas)
  // Çerçeve
  for (const [a, b, c, d] of [[-3.2, -2.9, 0.5, 7.7], [2.9, 3.2, 0.5, 7.7], [-3.2, 3.2, 7.4, 7.7]]) kutu(X1, X1 + 0.1, c, d, a, b, m.beyazTas)
  kutu(X1 - 2.2, X1 - 2, 0.5, 4, -2.3, 2.3, m.ahsapKoyu)
  // Yan odalar penceresi: giriş cephesinde iki sivri nişli pencere
  for (const z of [-6.4, 6.4]) {
    const e2 = (a: THREE.BufferGeometry, mal: Mal) => ek(yer(a, X1, 0, z, Math.PI / 2), mal)
    disPencere(e2, m, 0, 2.1, 0.9, 1.5, 0, true, m.beyazTas)
  }
  // Oda pencereleri: dikdörtgen, sivri alınlıklı (s. 186); sekiz talebe odası
  const odaAdim = (AX1 - AX0) / 8
  const odalar = Array.from({ length: 8 }, (_, i) => AX0 + (i + 0.5) * odaAdim)
  pencereDizi(y, m, 0, 0, ZD, odalar, 2, 0.8, 1.35, true, m.beyazTas)
  pencereDizi(y, m, Math.PI, 0, -ZD, odalar.map((x) => -x), 2, 0.8, 1.35, true, m.beyazTas)
  // Kuzey cephe payandaları (s. 185)
  for (let i = 0; i < 5; i++) {
    const x = X0 + 4 + i * 6.2
    kutu(x - 0.45, x + 0.45, 0.2, 4.6, -ZD - 0.9, -ZD, m.almasik)
    const p = new THREE.CylinderGeometry(0.5, 0.86, 0.6, 4).rotateY(Math.PI / 4).scale(1, 1, 1).translate(x, 4.9, -ZD - 0.4)
    ek(duzGolge(p), m.kursun)
  }
  // Oda sıraları: avlu tarafı duvar, oda kapıları
  kutu(AX0, AX1, 0.5, H, -AZ - REV - 0.6, -AZ - REV, m.almasik)
  kutu(AX0, AX1, 0.5, H, AZ + REV, AZ + REV + 0.6, m.almasik)
  for (const x of odalar) for (const s of [-1, 1]) {
    const zYuz = s * (AZ + REV) - s * 0.01
    ek(new THREE.BoxGeometry(0.9, 2.2, 0.03).translate(x, 2.05, zYuz), m.ahsapKoyu)
  }
  // Avlu: taban, sekizgen fıskiyeli havuz (s. 186)
  kutu(AX0, AX1, 0.42, 0.5, -AZ, AZ, m.cim)
  kutu(AX0, AX1, 0.42, 0.9, -AZ - REV, -AZ, m.tuglaKemer)
  kutu(AX0, AX1, 0.42, 0.9, AZ, AZ + REV, m.tuglaKemer)
  kutu(AX1 - 2.6, AX1, 0.42, 0.9, -AZ, AZ, m.tuglaKemer)
  ek(duzGolge(silindirG(2.05, 2.05, 0.6, 8)).translate(0, 0.8, 0), m.kesmeAcik)
  ek(silindirG(1.75, 1.75, 0.02, 8).translate(0, 1.11, 0), m.su)
  ek(dondurG([[0.45, 1.1], [0.35, 1.5], [0.12, 1.65], [0.05, 2], [0, 2.05]], 8), m.kesmeAcik)
  // Avlu revakları: üç cephede sivri kemer; ayaklar almaşık (s. 186; fotoğraf)
  const ay = 0.9, RH = 4.9
  const kemerDizi = (eksenX: boolean, c0: number, c1: number, adet: number, sabit: number) => {
    const adim = (c1 - c0) / adet
    const del = Array.from({ length: adet }, (_, i) => kemer(new THREE.Path(), c0 + (i + 0.5) * adim, ay, adim - 0.82, 1.5, 1.5))
    if (eksenX) ek(duvarX(c0, c1, sabit - 0.32, sabit + 0.32, ay, RH, del), m.almasik)
    else ek(duvarZ(sabit - 0.32, sabit + 0.32, c0, c1, ay, RH, del), m.almasik)
    for (let i = 0; i < adet; i++) {
      const c = c0 + (i + 0.5) * adim
      if (eksenX) {
        almasikKemer(ek, m, c, ay + 1.5, adim - 0.82, 0.01, 1.5, 0.26, 0.04, sabit + 0.32, 11)
        almasikKemer(ek, m, c, ay + 1.5, adim - 0.82, 0.01, 1.5, 0.26, 0.04, sabit - 0.36, 11)
      } else {
        const e2 = (a: THREE.BufferGeometry, mal: Mal) => ek(yer(a, sabit, 0, c, Math.PI / 2), mal)
        almasikKemer(e2, m, 0, ay + 1.5, adim - 0.82, 0.01, 1.5, 0.26, 0.04, 0.32, 11)
        almasikKemer(e2, m, 0, ay + 1.5, adim - 0.82, 0.01, 1.5, 0.26, 0.04, -0.36, 11)
      }
    }
  }
  kemerDizi(true, AX0, AX1, 8, -AZ - 0.32)
  kemerDizi(true, AX0, AX1, 8, AZ + 0.32)
  kemerDizi(false, -AZ, AZ, 3, AX1 - 2.6 - 0.32)
  // Örtü: odalarda uzunlamasına beşik tonoz, revakta düşük tonoz, kurşun (s. 186)
  const besik = (x0: number, x1: number, zo: number, gen: number, y0: number, yuk: number) => {
    const n = 14, c = (x0 + x1) / 2, L = x1 - x0
    const g = new THREE.CylinderGeometry(gen / 2, gen / 2, L, n, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, yuk / (gen / 2), 1).translate(c, y0, zo)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * gen * 1.6, uv.getY(i) * L)
    y.cati(g, m.kursun)
  }
  for (const s of [-1, 1]) {
    besik(X0 - 0.2, AX1, s * (AZ + REV + 2.15), 4.4, H, 1.15)
    besik(AX0 - 0.2, AX1, s * (AZ + REV / 2 - 0.05), REV + 0.8, RH, 0.5)
    y.cati(kutuK(X0, AX1, H - 0.06, H + 0.08, s > 0 ? AZ + REV - 0.1 : -ZD, s > 0 ? ZD : -AZ - REV + 0.1), m.kursun)
    y.cati(kutuK(AX0, AX1, RH - 0.1, RH + 0.1, s > 0 ? AZ : -AZ - REV, s > 0 ? AZ + REV : -AZ), m.kursun)
    // Baca dizisi: kare gövde, piramit başlık (fotoğraf)
    for (const x of odalar) {
      const zb = s * (ZD - 0.9)
      y.cati(kutuK(x - 0.32, x + 0.32, H, H + 1.55, zb - 0.32, zb + 0.32), m.kesmeAcik)
      y.cati(duzGolge(new THREE.ConeGeometry(0.56, 0.55, 4).rotateY(Math.PI / 4).translate(x, H + 1.82, zb)), m.kursun)
    }
  }
  // Giriş kütlesi: üstte düz kurşun ve iki kubbe (dershane ucu büyük kubbe)
  y.cati(kutuK(AX1, X1 - 0.8, H + 1.2, H + 1.34, -ZD, ZD), m.kursun)
  kutu(AX1, X1 - 1, 0.5, H + 1.2, -ZD, -3.3, m.almasik)
  kutu(AX1, X1 - 1, 0.5, H + 1.2, 3.3, ZD, m.almasik)
  kutu(X1 - 5.4, X1 - 1, 0.5, 0.9, -3.3, 3.3, m.mermerKoyu)
  kutu(AX1, AX1 + 0.5, 0.5, H + 1.2, -3.3, -1.2, m.almasik)
  kutu(AX1, AX1 + 0.5, 0.5, H + 1.2, 1.2, 3.3, m.almasik)
  const R = YERLESIM.medrese
  const gx = (lx: number, lz: number) => [R.x + lx * Math.cos(R.ry) + lz * Math.sin(R.ry), R.z - lx * Math.sin(R.ry) + lz * Math.cos(R.ry)] as const
  for (const [lx, r, kas] of [[14.4, 3.1, H + 1.3], [9.2, 2.45, H + 0.6]] as const) {
    disKasnak(y.koy, kKasnak, m, lx, 0, kas, 1.6, r, 8, r > 3 ? 0 : 4)
    const [dx, dz] = gx(lx, 0)
    disKubbe((kv, g, mal) => kv.ekle(g, mal), kKubbe, m, dx, dz, kas + 1.5, r + 0.1, r > 3 ? 2.6 : 2.1, 0.8)
  }
  // Dershane: 8,65 × 8,86 m iç ölçü, sekizgen kasnak, kurşun kubbe (s. 186)
  const DX1 = X0 + 1.1, DX0 = DX1 - 10.6, DZ = 5.45
  kutu(DX0 - 0.3, DX1, 0, 0.5, -DZ - 0.3, DZ + 0.3, m.kesme)
  kutu(DX0, DX1, 0.5, 8.6, -DZ, -DZ + 1, m.almasik)
  kutu(DX0, DX1, 0.5, 8.6, DZ - 1, DZ, m.almasik)
  kutu(DX0, DX0 + 1, 0.5, 8.6, -DZ, DZ, m.almasik)
  kutu(DX1 - 1, DX1, 0.5, 8.6, -DZ, DZ, m.almasik)
  silme(ek, m.tuglaKemer, DX0 - 0.1, DX1 + 0.1, 8.45, 8.7, -DZ - 0.1, DZ + 0.1, 0.4)
  cati((g) => y.cati(g, m.kursun), DX0, DX1, -DZ, DZ, 8.7, 9.2, 0.35, 0.6, [])
  const dxo = (DX0 + DX1) / 2
  disKasnak(y.koy, kKasnak, m, dxo, 0, 9.05, 1.9, 4.95, 8, 4)
  const [dxx, dzz] = gx(dxo, 0)
  disKubbe((kv, g, mal) => kv.ekle(g, mal), kKubbe, m, dxx, dzz, 10.85, 5.1, 3.9, 0.95)
  // Dershaneye bakan iki pencere (cephe)
  for (const s of [-1, 1]) {
    const e2 = (a: THREE.BufferGeometry, mal: Mal) => ek(yer(a, dxo, 0, s * DZ, s > 0 ? 0 : Math.PI), mal)
    disPencere(e2, m, -2.2, 2.4, 1, 1.7, 0, true, m.beyazTas)
    disPencere(e2, m, 2.2, 2.4, 1, 1.7, 0, true, m.beyazTas)
  }
}

export function darussifa(m: YM, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  const y = yerlesik(k, kCati, kKasnak, kKubbe, YERLESIM.darussifa)
  const { ek } = y
  const kutu = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal) => ek(kutuK(x0, x1, y0, y1, z0, z1), mal)
  // Yerel: +x güney (kubbeli salon), -x kuzey (giriş). 30 × 53 m (s. 195), 420 m² avlu (s. 198).
  const LX = 26.5, ZD = 15, H = 6.2, AX = 16.5, AZ = 6.35, D = 0.9
  kutu(-LX - 0.3, LX + 0.3, 0, 0.5, -ZD - 0.3, ZD + 0.3, m.kesme)
  kutu(-LX, LX, 0.5, H, -ZD, -ZD + D, m.moloz); kutu(-LX, LX, 0.5, H, ZD - D, ZD, m.moloz)
  kutu(LX - D, LX, 0.5, H, -ZD, ZD, m.moloz)
  const kap = kemer(new THREE.Path(), 0, 0.5, 2.8, 2.3, 1.9)
  ek(duvarZ(-LX, -LX + D, -ZD, ZD, 0.5, H, [kap]), m.moloz)
  kutu(-LX - 0.03, -LX + 0.2, 0.5, H, -2.9, 2.9, m.kesmeAcik)
  ek(duvarZ(-LX - 0.1, -LX + 0.25, -2.9, 2.9, 0.5, H + 0.6, [kemer(new THREE.Path(), 0, 0.5, 2.8, 2.3, 1.9)]), m.kesmeAcik)
  kutu(-LX + 0.4, -LX + 0.5, 0.5, 3.7, -1.5, 1.5, m.ahsapKoyu)
  for (let i = 0; i < 3; i++) kutu(-LX - 0.1 - (3 - i) * 0.35, -LX - 0.1 - (2 - i) * 0.35, 0, 0.5 * (3 - i) / 3, -2.2, 2.2, m.kesmeAcik)
  // Köşelerde kesme taş ve tuğla; büyük yuvarlak kemerler (s. 198)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const e2 = (a: THREE.BufferGeometry, mal: Mal) => ek(yer(a, sx * (LX - 4), 0, sz * ZD, sz > 0 ? 0 : Math.PI), mal)
    almasikKemer(e2, m, 0, 3.1, 4.6, 0.01, 2.3, 0.42, 0.06, 0, 17)
    kutu(sx * LX - 0.4, sx * LX + 0.4, 0.5, H, sz * ZD - 0.4, sz * ZD + 0.4, m.almasik)
  }
  // Pencereler: 34 dış pencere; dikdörtgen, küfeki söveli, sivri kemerli (s. 198)
  const dizi = Array.from({ length: 10 }, (_, i) => -LX + 7.5 + i * 3.9)
  pencereDizi(y, m, 0, 0, ZD, dizi, 2, 0.9, 1.4, true, m.kesmeAcik)
  pencereDizi(y, m, Math.PI, 0, -ZD, dizi, 2, 0.9, 1.4, true, m.kesmeAcik)
  // Oda sırası ve sivri kemerli revak
  kutu(-AX, AX, 0.5, H, -AZ - 2.6 - 0.5, -AZ - 2.6, m.moloz); kutu(-AX, AX, 0.5, H, AZ + 2.6, AZ + 2.6 + 0.5, m.moloz)
  kutu(-AX, AX, 0.42, 0.5, -AZ, AZ, m.cim)
  kutu(-AX, AX, 0.42, 0.95, -AZ - 2.6, -AZ, m.tuglaKemer)
  kutu(-AX, AX, 0.42, 0.95, AZ, AZ + 2.6, m.tuglaKemer)
  ek(duzGolge(silindirG(1.9, 2.1, 0.75, 8)).translate(0, 0.85, 0), m.kesmeAcik)
  ek(silindirG(1.65, 1.65, 0.02, 8).translate(0, 1.21, 0), m.su)
  ek(dondurG([[0.4, 1.2], [0.3, 1.7], [0.1, 1.9], [0.04, 2.15], [0, 2.2]], 8), m.kesmeAcik)
  const adim = (AX * 2) / 9, RH = 5.2
  for (const s of [-1, 1]) {
    const del = Array.from({ length: 9 }, (_, i) => kemer(new THREE.Path(), -AX + (i + 0.5) * adim, 0.95, adim - 0.9, 1.6, 1.5))
    ek(duvarX(-AX, AX, s * AZ - 0.3, s * AZ + 0.3, 0.95, RH, del), m.almasik)
    for (let i = 0; i < 9; i++) {
      const c = -AX + (i + 0.5) * adim
      almasikKemer(ek, m, c, 0.95 + 1.6, adim - 0.9, 0.01, 1.5, 0.26, 0.04, s * AZ + 0.3, 11)
      almasikKemer(ek, m, c, 0.95 + 1.6, adim - 0.9, 0.01, 1.5, 0.26, 0.04, s * AZ - 0.34, 11)
    }
    // Örtü ve bacalar
    y.cati(kutuK(-LX, LX, H - 0.04, H + 0.1, s > 0 ? AZ + 2.4 : -ZD, s > 0 ? ZD : -AZ - 2.4), m.kursun)
    y.cati(kutuK(-AX, AX, RH - 0.05, RH + 0.14, s > 0 ? AZ - 0.35 : -AZ - 2.7, s > 0 ? AZ + 2.7 : -AZ + 0.35), m.kursun)
    const zb = s * (ZD - 1.4)
    for (const x of dizi) {
      y.cati(kutuK(x - 0.32, x + 0.32, H, H + 1.4, zb - 0.32, zb + 0.32), m.kesmeAcik)
      y.cati(duzGolge(new THREE.ConeGeometry(0.55, 0.5, 4).rotateY(Math.PI / 4).translate(x, H + 1.65, zb)), m.kursun)
    }
  }
  // Uç kitleler: kuzeyde hekim odaları, güneyde kubbeli salon ve tonozlu iki oda
  kutu(-LX, -AX, 0.5, H + 0.1, -ZD, -3, m.moloz); kutu(-LX, -AX, 0.5, H + 0.1, 3, ZD, m.moloz)
  y.cati(kutuK(-LX - 0.2, -AX, H + 0.1, H + 0.3, -ZD - 0.2, ZD + 0.2), m.kursun)
  kutu(AX, AX + 0.6, 0.5, H + 2.6, -AZ - 2.6, AZ + 2.6, m.almasik)
  kutu(AX, LX, 0.5, H + 0.1, -ZD, -5, m.moloz); kutu(AX, LX, 0.5, H + 0.1, 5, ZD, m.moloz)
  y.cati(kutuK(AX, LX + 0.2, H + 0.1, H + 0.3, -ZD - 0.2, -4.6), m.kursun)
  y.cati(kutuK(AX, LX + 0.2, H + 0.1, H + 0.3, 4.6, ZD + 0.2), m.kursun)
  kutu(AX + 0.6, LX, 0.5, H + 2.6, -5, -4.4, m.almasik); kutu(AX + 0.6, LX, 0.5, H + 2.6, 4.4, 5, m.almasik)
  kutu(LX - 0.9, LX, 0.5, H + 2.6, -5, 5, m.almasik)
  // Kubbeli salon: 9,40 × 7,67 m, sekizgen kasnak (s. 198)
  const sx = AX + 5
  y.cati(kutuK(AX, LX + 0.2, H + 2.6, H + 2.84, -5.2, 5.2), m.kursun)
  disKasnak(y.koy, kKasnak, m, sx, 0, H + 2.7, 1.8, 4.7, 8, 4)
  const R = YERLESIM.darussifa
  const gx = (lx: number, lz: number) => [R.x + lx * Math.cos(R.ry) + lz * Math.sin(R.ry), R.z - lx * Math.sin(R.ry) + lz * Math.cos(R.ry)] as const
  const [dx, dz] = gx(sx, 0)
  disKubbe((kv, g, mal) => kv.ekle(g, mal), kKubbe, m, dx, dz, H + 4.45, 4.85, 3.4, 0.85)
}

export function sadirvanKosku(m: YM, k: Kova, kKubbe: Kova, x: number, z: number) {
  const e = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z), mal)
  const R = 3.3
  e(duzGolge(silindirG(R + 0.5, R + 0.5, 0.25, 8).rotateY(Math.PI / 8)).translate(0, 0.12, 0), m.kesmeAcik)
  e(duzGolge(silindirG(1.5, 1.5, 0.7, 8)).translate(0, 0.6, 0), m.kesmeAcik)
  e(silindirG(1.3, 1.3, 0.02, 8).translate(0, 0.96, 0), m.su)
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + n * Math.PI / 4
    e(silindirG(0.13, 0.15, 3, 8).translate(R * Math.sin(a), 1.75, R * Math.cos(a)), m.ahsapKoyu)
  }
  e(duzGolge(silindirG(R + 0.2, R + 0.1, 0.34, 8).rotateY(Math.PI / 8)).translate(0, 3.35, 0), m.ahsapKoyu)
  e(duzGolge(silindirG(R - 0.3, R + 0.8, 0.5, 8, true).rotateY(Math.PI / 8)).translate(0, 3.7, 0), m.kursun)
  disKubbe((kv, g, mal) => kv.ekle(g, mal), kKubbe, m, x, z, 3.95, R - 0.1, 1.7, 0.5)
}

export function site(m: YM, k: Kova, Rk: number, oz: number) {
  const e = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(g, mal)
  const uvDuz = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
    return g
  }
  // Çim kaide ve döşeli avlular: fotoğraftaki taş döşeli geniş alan
  e(uvDuz(new THREE.CircleGeometry(Rk - 0.6, 80).rotateX(-Math.PI / 2).translate(0, 0.01, -oz)), m.cim)
  const yol = (pts: [number, number][], y: number) => {
    const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
    e(uvDuz(new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2).translate(0, y, 0)), m.doseme)
  }
  // Cami çevresi
  yol([[-22, -29], [22, -29], [23, 11], [10, 24], [-10, 24], [-23, 11]], 0.03)
  // Türbe ve medrese arasındaki avlu
  yol([[-34, -26], [-3, -33], [17, -48], [-1, -74], [-30, -58], [-56, -18], [-44, -8]], 0.035)
  // Darüşşifa çevresi
  yol([[33, -68], [71, -68], [71, -5], [33, -5]], 0.03)
  // İki terası ayıran kagir istinat duvarı (fotoğraf)
  const duvar = (a: [number, number], b: [number, number], h: number) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const g = kutuG(L, h, 0.6).rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])).translate((a[0] + b[0]) / 2, h / 2, (a[1] + b[1]) / 2)
    e(g, m.moloz)
  }
  duvar([-23, -28], [6, -36], 1.5)
  duvar([6, -36], [24, -28], 1.5)
  // Ağaçlar: yalnız fotoğraftaki yeşil dokuyu andırır; konumları temsilîdir
  const ag: [number, number, number, boolean][] = [
    [29, -12, 13, false], [31, 6, 12, false], [26, 21, 11, true], [-27, 18, 12, false], [-29, 3, 13, true], [-31, -8, 10, false],
    [-8, 31, 12, false], [13, 34, 11, true], [-22, 36, 10, false], [40, 26, 13, false], [-42, 28, 12, true], [8, -33, 9, true], [-18, -34, 8, false],
    [22, -38, 12, false], [26, -62, 13, false], [17, -72, 11, true], [-22, -76, 11, false], [-50, -60, 13, false], [-62, -44, 12, true],
    [-70, -22, 11, false], [-60, 2, 13, false], [-47, 18, 11, true], [62, 12, 12, false], [76, -22, 9, false], [46, 40, 10, true],
  ]
  ag.forEach(([x, z, b, s], i) => agac(e, m, x, z, b, s, 100 + i))
  for (const [x, z, b] of [[-14, -71, 15], [-9, -74, 13], [-30, -64, 14], [13, -56, 14], [-34, -6, 12], [-22, 30, 13], [28, 30, 12], [58, 26, 12], [36, -10, 11]] as const) selvi(e, m, x, z, b)
}
