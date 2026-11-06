// Yıldırım Bayezid Camii. Ölçüler envanterden (Bursa Cilt 2, s. 166, 170, 172, 176): son cemaat yeri 33,60 × 7,10 m,
// orta kubbe zeminden 14 m; harim orta mekânı 12,20 × 12,20 m; mihraplı kubbe 11,50 m; eyvanlar ~8,5 × 6,75 m;
// tabhane odaları ~6,3 × 6,5 m; yan eyvan ve mihraplı bölüme iki basamakla çıkılır.
// Duvar kalınlıkları, yükseklikler ve dış pencere yerleri fotoğraflardan oranlanmıştır; temsilîdir.
// Birim metre. Kuzey -z, kıble +z, doğu +x. Bu dosyadaki z'ler site kaydırmasından önceki değerlerdir.
import * as THREE from 'three'
import { cikar, dondurG, duzGolge, kemer, kutuG, Kova, silindirG, yer } from '../../ulucamiParca'
import type { IcYurume, Kutu, ZeminAlani } from '../../ulucamiIc'
import { avize, bursaKemer, cati, disKasnak, disKubbe, duvarX, duvarZ, kutuK, pandantifG, silme, type Mal, type YM } from './ortak'


export const TABAN = 0.6
export const GOZ_Y = TABAN + 1.6
const YUKSEK = 0.4 // eyvan ve mihraplı bölümün iki basamağı
const SOFA = 0.5 // son cemaat yerinin yan sofaları

// Plan sabitleri
const W = 16.8, N0 = -21, N1 = -13.9, N_IC = -19.6
const HOL_N = -8, HOL_G = 4.2, HOL_X = 6.1, ARA_G = 5.8
const YAN_X = 7.55, EY_G = -1.25, TAB_K = -0.2, TAB_G = 6.5, TAB_D = 14
const MIH_X = 5.75, MIH_G = 17.3, DIS_G = 19.1, GOVDE_G = 7.6
const EY_DIS = 15.9
const GOVDE_H = 12.8, CATI_UST = 13.7, REVAK_H = 11
const DIREK = [3.3, 9.75, 16.05]

export function cami(m: YM, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova): IcYurume {
  const K = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(g, mal)
  const kutu = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal) => K(kutuK(x0, x1, y0, y1, z0, z1), mal)
  const cift = (f: (s: number) => void) => { f(1); f(-1) }
  const ayna = (s: number, a: number, b: number): [number, number] => s > 0 ? [a, b] : [-b, -a]
  const ek3 = (kv: Kova, g: THREE.BufferGeometry, mal: Mal) => kv.ekle(g, mal)

  // --- Kaide ve dış basamaklar ---
  kutu(-W - 0.4, W + 0.4, 0, TABAN - 0.02, N0 - 0.4, GOVDE_G + 0.4, m.kesme)
  kutu(-MIH_X - 2.2, MIH_X + 2.2, 0, TABAN - 0.02, GOVDE_G, DIS_G + 0.4, m.kesme)
  for (let i = 0; i < 3; i++) kutu(-3.4 - i * 0.5 + 0.8, 3.4 + i * 0.5 - 0.8, 0, TABAN * (3 - i) / 3, N0 - 0.4 - i * 0.42 - 0.42, N0 - 0.4 - i * 0.42, m.kesmeAcik)

  // --- Son cemaat yeri: zemin, yan sofalar ---
  kutu(-W, W, TABAN - 0.05, TABAN, N0, N1, m.kesmeAcik)
  cift((s) => {
    for (const [a, b] of [[DIREK[0], DIREK[1]], [DIREK[1], EY_DIS]]) {
      const [x0, x1] = ayna(s, a, b)
      kutu(x0, x1, TABAN, TABAN + SOFA, N0, N1, m.kesmeAcik)
    }
    // Sofaya çıkan üç basamak: orta gözün iki yanında
    for (let i = 0; i < 2; i++) {
      const [x0, x1] = ayna(s, DIREK[0] - 0.56 - i * 0.28 + 0.28, DIREK[0])
      kutu(x0, x1, TABAN, TABAN + SOFA * (2 - i) / 3, N_IC + 0.4, N1 - 0.4, m.kesmeAcik)
    }
  })

  // --- Son cemaat yeri ön cephesi: beş Bursa kemeri, silindirik silmeler ---
  const orta = bursaKemer(new THREE.Path(), 0, 0.02 + TABAN, 4.7, 5.4, 3.5)
  const kolTepe = (x: number) => bursaKemer(new THREE.Path(), x, TABAN + SOFA, 4.55, 4.9, 2.7)
  const koler = [(DIREK[0] + DIREK[1]) / 2, (DIREK[1] + DIREK[2]) / 2]
  const delik = [orta, ...koler.flatMap((x) => [kolTepe(x), kolTepe(-x)])]
  K(duvarX(-W, W, N0, N_IC, TABAN, REVAK_H, delik), m.kesmeAcik)
  // Kaba alt parça: yan gözlerin korkuluk taşı kemer ağzında sofa ile aynı hizadadır.
  for (const x of [...koler, ...koler.map((v) => -v)]) kutu(x - 2.28, x + 2.28, TABAN, TABAN + SOFA, N0 - 0.02, N_IC, m.kesmeAcik)
  // Dikey silindirik silmeler ve dikdörtgen çerçeveler
  for (const x of [-DIREK[2] - 0.75, -DIREK[1] - 0.95, -DIREK[1] + 0.95, -DIREK[0] - 0.95, -DIREK[0] + 0.95, DIREK[0] - 0.95, DIREK[0] + 0.95, DIREK[1] - 0.95, DIREK[1] + 0.95, DIREK[2] + 0.75]) {
    K(silindirG(0.13, 0.13, REVAK_H - TABAN - 0.3, 8).translate(x, (REVAK_H + TABAN - 0.3) / 2, N0 - 0.04), m.kesmeAcik)
  }
  for (const [x, g, u] of [[0, 5.5, 10.15], ...koler.flatMap((v) => [[v, 5.3, 9.45], [-v, 5.3, 9.45]])]) {
    kutu(x - g / 2, x + g / 2, u, u + 0.2, N0 - 0.16, N0 + 0.02, m.kesmeAcik)
    K(silindirG(0.09, 0.09, g, 8).rotateZ(Math.PI / 2).translate(x, u - 0.02, N0 - 0.16), m.kesmeAcik)
  }
  silme(K, m.kesmeAcik, -W - 0.3, W + 0.3, REVAK_H - 0.28, REVAK_H, N0 - 0.3, N1, 0.5)
  // Kemer başlangıcında yatay yastık, altında mukarnas sarkıt ve demir gergi
  const yastik = (x: number, y: number, s: number) => {
    K(silindirG(0.22, 0.22, 1.5, 8).rotateX(Math.PI / 2).translate(x, y, N0 + 0.7), m.kesmeAcik)
    for (let i = 0; i < 5; i++) {
      const g = 0.5 - i * 0.07
      K(kutuG(g, 0.16, 0.9 - i * 0.08).translate(x - s * (i * 0.012), y - 0.27 - i * 0.16, N0 + 0.7), m.kesmeAcik)
    }
  }
  const gergi = (x: number, g: number, y: number) => {
    K(kutuG(g + 0.5, 0.05, 0.05).translate(x, y, N0 + 0.28), m.koyu)
    K(kutuG(g + 0.5, 0.05, 0.05).translate(x, y, N_IC - 0.28), m.koyu)
  }
  yastik(-2.35, TABAN + 5.25, 1); yastik(2.35, TABAN + 5.25, -1); gergi(0, 4.7, TABAN + 5.25)
  for (const x of [...koler, ...koler.map((v) => -v)]) {
    const y = TABAN + SOFA + 4.75
    yastik(x - 2.27, y, 1); yastik(x + 2.27, y, -1); gergi(x, 4.55, y)
  }

  // Yan cepheler: dikdörtgen çerçeve içinde ikiz Bursa kemeri
  cift((s) => {
    const [x0, x1] = ayna(s, EY_DIS, W)
    const ic = [N0 + 2.45, N1 - 2.05].map((z) => bursaKemer(new THREE.Path(), z, TABAN + SOFA, 2.2, 3.2, 1.55))
    K(duvarZ(x0, x1, N0, N1, TABAN, REVAK_H, ic), m.kesmeAcik)
    const fx = s > 0 ? W : -W - 0.12
    kutu(fx, fx + 0.12, 7.4, 7.6, N_IC + 0.3, N1 - 0.2, m.kesmeAcik)
    kutu(fx, fx + 0.12, TABAN + SOFA, 7.6, N_IC + 0.3, N_IC + 0.46, m.kesmeAcik)
    kutu(fx, fx + 0.12, TABAN + SOFA, 7.6, N1 - 0.36, N1 - 0.2, m.kesmeAcik)
    // Direk araları: bölme kemerleri
    for (const d of [DIREK[0], DIREK[1]]) {
      const x = s * d
      K(duvarZ(x - 0.6, x + 0.6, N_IC, N1, TABAN, REVAK_H - 1.1, [bursaKemer(new THREE.Path(), (N_IC + N1) / 2, TABAN + (d === DIREK[0] ? 0 : SOFA), 3.55, 3.6, 2.2)]), m.kesmeAcik)
    }
  })

  // Son cemaat kubbeleri: içte pandantifli küçük kubbe, dışta kurşun; orta kubbe zeminden 14 m
  const revakGoz = [[-DIREK[2] + 0.6, -DIREK[1] - 0.6], [-DIREK[1] + 0.6, -DIREK[0] - 0.6], [-DIREK[0] + 0.6, DIREK[0] - 0.6], [DIREK[0] + 0.6, DIREK[1] - 0.6], [DIREK[1] + 0.6, DIREK[2] - 0.6]]
  const revakDelik: { x: number; z: number; r: number }[] = []
  const nzOrta = (N_IC + N1) / 2
  revakGoz.forEach(([a, b], i) => {
    const cx = (a + b) / 2, ortami = i === 2
    const R = Math.min((b - a) / 2, (N1 - N_IC) / 2) - 0.2
    kCati.ekle(pandantifG(cx, nzOrta, a, b, N_IC, N1, REVAK_H - 1.3, REVAK_H - 0.15, R), m.sivaIc)
    kKubbe.ekle(yer(icKubbeG(R, ortami ? 2.1 : 1.7), cx, REVAK_H - 0.15, nzOrta), m.sivaIc)
    kKubbe.ekle(new THREE.CircleGeometry(0.75, 20).rotateX(Math.PI / 2).translate(cx, REVAK_H - 0.15 + (ortami ? 2.1 : 1.7) - 0.05, nzOrta), m.gobek)
    revakDelik.push({ x: cx, z: nzOrta, r: R + 0.05 })
    if (ortami) {
      disKasnak(ek3, kKasnak, m, cx, nzOrta, REVAK_H, 0.55, 3, 8, 0)
      disKubbe(ek3, kKubbe, m, cx, nzOrta, REVAK_H + 0.5, 2.75, 2.4, 0.6)
    } else {
      disKasnak(ek3, kKasnak, m, cx, nzOrta, REVAK_H, 0.3, R + 0.25, 8, 0)
      disKubbe(ek3, kKubbe, m, cx, nzOrta, REVAK_H + 0.25, R + 0.15, 2.1, 0.5)
    }
  })
  cati((g) => kCati.ekle(g, m.kursun), -W, W, N0, N1, REVAK_H + 0.02, REVAK_H + 0.08, 0.2, 0.2, revakDelik)

  // --- Ana giriş: mermer taç kapı, derin niş, siyah-beyaz kemer ---
  const nis = kemer(new THREE.Path(), 0, TABAN, 3.4, 4.6, 2.2)
  K(duvarX(-W, W, N1, -9.2, 0, GOVDE_H, [nis]), m.kesme)
  kutu(-W, W, 0, TABAN, N1, HOL_N, m.kesme)
  // Niş yüzü ve kemer: siyah-beyaz dönüşüm
  const siyahBeyaz = (i: number) => (i % 2 ? m.koyu : m.beyazTas)
  const ringS = 13
  for (let i = 0; i < ringS; i++) {
    const a0 = Math.PI * (i / ringS), a1 = Math.PI * ((i + 1) / ringS)
    const nok = (a: number, r: number) => new THREE.Vector2(Math.cos(a) * r, TABAN + 4.6 + Math.sin(a) * r * 1.29)
    const s = new THREE.Shape([nok(a0, 1.7), nok(a1, 1.7), nok(a1, 2.05), nok(a0, 2.05)])
    K(cikar(s, 0.12, N1 - 0.12), siyahBeyaz(i))
  }
  // Giriş kapısı: kapı duvarı, sivri kemerli açıklık ve açık ahşap kanat
  const kapiYol = () => kemer(new THREE.Path(), 0, TABAN, 2, 2.9, 1.1)
  K(duvarX(-HOL_X - 0.5, HOL_X + 0.5, -9.2, HOL_N, 0, CATI_UST, [kapiYol()]), m.kesmeIc)
  K(new THREE.BoxGeometry(0.1, 3.4, 1).translate(-1.18, TABAN + 1.7, HOL_N - 0.5), m.ahsapKoyu)
  K(new THREE.BoxGeometry(0.1, 3.4, 1).translate(1.18, TABAN + 1.7, -9.7), m.ahsapKoyu)
  // Kapı önünde niş iç pencereleri ve küçük nefeslik
  K(new THREE.PlaneGeometry(0.6, 0.6).translate(0, TABAN + 5.4, -9.19).rotateY(0).translate(0, 0, -0.02), m.sebeke)

  // Revak duvarı: simetrik mihrap nişi ve üstte dikdörtgen pencere, altta sivri alınlıklı pencere
  const revakPencereleri = (x: number) => {
    const z = N1 - 0.02
    kutu(x - 0.95, x + 0.95, TABAN + SOFA + 0.2, TABAN + SOFA + 3.55, z - 0.06, z, m.kesme)
    kutu(x - 0.62, x + 0.62, TABAN + SOFA + 0.55, TABAN + SOFA + 1.95, z - 0.08, z - 0.02, m.demirKoyu)
    const alin = kemer(new THREE.Shape(), x, TABAN + SOFA + 2.1, 1.5, 0.05, 0.8)
    alin.holes.push(kemer(new THREE.Path(), x, TABAN + SOFA + 2.2, 1.1, 0.03, 0.55))
    K(cikar(alin, 0.08, z - 0.09), m.tuglaKemer)
    K(new THREE.ShapeGeometry(kemer(new THREE.Shape(), x, TABAN + SOFA + 2.2, 1.1, 0.03, 0.55), 6).translate(0, 0, z - 0.05), m.sivaKoyu)
    kutu(x - 0.75, x + 0.75, TABAN + SOFA + 4.1, TABAN + SOFA + 5.7, z - 0.06, z, m.kesme)
    kutu(x - 0.5, x + 0.5, TABAN + SOFA + 4.3, TABAN + SOFA + 5.5, z - 0.08, z - 0.02, m.demirKoyu)
  }
  for (const x of [...koler, ...koler.map((v) => -v)]) revakPencereleri(x)

  // --- Gövde duvarları (dış taş) ---
  cift((s) => {
    const [x0, x1] = ayna(s, EY_DIS, W)
    kutu(x0, x1, 0, GOVDE_H, N1, GOVDE_G, m.kesme)
    // Eyvan kuzey dolgu (kuzeydeki odalar kapalı bırakılmıştır)
    const [yx0, yx1] = ayna(s, HOL_X, EY_DIS)
    kutu(yx0, yx1, 0, GOVDE_H, -9.2, HOL_N, m.kesme)
    // Tabhane dolgu ve güney duvarı
    const [dx0, dx1] = ayna(s, TAB_D, EY_DIS)
    kutu(dx0, dx1, 0, GOVDE_H, TAB_K, GOVDE_G, m.kesme)
    const [gx0, gx1] = ayna(s, YAN_X, EY_DIS)
    kutu(gx0, gx1, 0, GOVDE_H, TAB_G, GOVDE_G, m.kesme)
    // Eyvan güney duvarı / tabhane kuzey duvarı
    kutu(gx0, gx1, 0, GOVDE_H, EY_G, TAB_K, m.kesme)
    // Harim yan duvarı: eyvan kemeri ve tabhane kapısı
    const [hx0, hx1] = ayna(s, HOL_X, YAN_X)
    const eyvanKemer = bursaKemer(new THREE.Path(), (HOL_N + EY_G) / 2 - 0.2, TABAN, 5.95, 4.6, 4.0)
    const kapi = kemer(new THREE.Path(), 1.8, TABAN, 1.6, 2.4, 0.5)
    K(duvarZ(hx0, hx1, HOL_N, ARA_G, 0, CATI_UST, [eyvanKemer, kapi]), m.kesmeIc)
    // Mihraplı bölümün yan duvarı
    const [mx0, mx1] = ayna(s, MIH_X, YAN_X)
    kutu(mx0, mx1, 0, GOVDE_H + 1, ARA_G, DIS_G, m.kesme)
  })
  kutu(-YAN_X, YAN_X, 0, GOVDE_H + 1, MIH_G, DIS_G, m.kesme)

  // Hol ile mihraplı bölümü ayıran geniş kemer
  const buyukKemer = bursaKemer(new THREE.Path(), 0, TABAN, 9.8, 6.2, 5.2)
  K(duvarX(-YAN_X, YAN_X, HOL_G, ARA_G, 0, CATI_UST, [buyukKemer]), m.kesmeIc)
  // Kemer ayaklarında mukarnaslı niş ve yastıklar
  cift((s) => {
    for (let i = 0; i < 11; i++) {
      const g = 1.1 - i * 0.05
      K(kutuG(g, 0.2, 1.2).translate(s * (5.55 - i * 0.04), TABAN + 4.7 + i * 0.2, (HOL_G + ARA_G) / 2), m.kesmeAcik)
    }
    const nisS = kemer(new THREE.Shape(), s * 5.55, TABAN + 0.1, 0.9, 2.5, 1)
    K(cikar(nisS, 0.04, HOL_G - 0.04), m.sivaKoyu)
  })

  // --- Dış görünüm: gövde pencereleri ve saçak silmeleri ---
  const disGoz = (cx: number, y: number, cz: number, ry: number, g: number, h: number, sivri: boolean) => {
    const ek = (a: THREE.BufferGeometry, mal: Mal) => K(yer(a, cx, 0, cz, ry), mal)
    ek(kutuK(-g / 2 - 0.18, g / 2 + 0.18, y - 0.16, y + h + 0.16, -0.02, 0.08), m.kesmeAcik)
    ek(new THREE.PlaneGeometry(g, h).translate(0, y + h / 2, 0.09), m.demirKoyu)
    if (sivri) {
      const s = kemer(new THREE.Shape(), 0, y + h + 0.2, g + 0.3, 0.02, g * 0.55)
      s.holes.push(kemer(new THREE.Path(), 0, y + h + 0.3, g - 0.15, 0.02, g * 0.36))
      ek(cikar(s, 0.08), m.kesmeAcik)
    }
  }
  cift((s) => {
    // Yan cephe: üstte yedi, altta iki pencere (envanter s. 178)
    for (let i = 0; i < 7; i++) disGoz(s * (W + 0.0), 8.6, -11.5 + i * 3, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.85, 1.3, false)
    for (const z of [-4.6, 3.3]) disGoz(s * W, 2.9, z, s > 0 ? Math.PI / 2 : -Math.PI / 2, 1, 1.6, true)
    // Güneydoğu ve güneybatı köşeleri
    for (const x of [10.4, 13.9]) disGoz(s * x, 8.6, GOVDE_G, 0, 0.85, 1.3, false)
    // Mihraplı bölüm
    for (const z of [10, 14.5]) {
      disGoz(s * YAN_X, 8.6, z, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.85, 1.3, false)
      disGoz(s * YAN_X, 2.9, z, s > 0 ? Math.PI / 2 : -Math.PI / 2, 1, 1.6, true)
    }
    disGoz(s * 3.2, 8.6, DIS_G, 0, 0.85, 1.3, false)
    disGoz(s * 3.2, 2.9, DIS_G, 0, 1, 1.6, true)
  })
  // Taş saçak silmesi
  silme(K, m.kesmeAcik, -W - 0.1, W + 0.1, GOVDE_H - 0.3, GOVDE_H, N1, GOVDE_G + 0.1, 0.5)
  silme(K, m.kesmeAcik, -YAN_X - 0.1, YAN_X + 0.1, GOVDE_H + 0.7, GOVDE_H + 1, GOVDE_G, DIS_G + 0.1, 0.5)

  // --- Çatı: iki gövde kırma çatısı ---
  const ortaKubbe = { x: 0, z: (HOL_N + HOL_G) / 2, r: 6.4 }
  const eyvanX = (YAN_X + EY_DIS) / 2, eyvanZ = (HOL_N + EY_G) / 2
  const mihZ = (ARA_G + MIH_G) / 2
  cati((g) => kCati.ekle(g, m.kursun), -W, W, N1, GOVDE_G, GOVDE_H, CATI_UST, 0.5, 2.3, [
    ortaKubbe, { x: eyvanX, z: eyvanZ, r: 3.45 }, { x: -eyvanX, z: eyvanZ, r: 3.45 },
  ])
  cati((g) => kCati.ekle(g, m.kursun), -YAN_X, YAN_X, GOVDE_G - 0.5, DIS_G, GOVDE_H + 1, CATI_UST + 0.1, 0.5, 0.8, [{ x: 0, z: mihZ, r: 5.9 }])

  // --- Kasnak ve kubbeler ---
  const oda = (cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, yDuvar: number, yHalka: number, R: number, kasnakH: number, kubbeH: number, kenar: number, pencere: number) => {
    kCati.ekle(pandantifG(cx, cz, x0, x1, z0, z1, yDuvar, yHalka, R), m.sivaIc)
    // İç kasnak, kuşak ve pencereler
    kKasnak.ekle(yer(duzGolge(silindirG(R, R, kasnakH, kenar, true).rotateY(Math.PI / kenar)), cx, yHalka + kasnakH / 2, cz), m.sivaIc)
    kKasnak.ekle(yer(silindirG(R - 0.03, R - 0.03, 0.3, 32, true), cx, yHalka + 0.12, cz), m.bant)
    const yuz = R * Math.cos(Math.PI / kenar) - 0.05
    for (let n = 0; n < pencere; n++) {
      const a = (n / pencere) * Math.PI * 2
      const g = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, yHalka + 0.42, kasnakH * 0.5, kasnakH * 0.28, kasnakH * 0.26), 8).translate(0, 0, yuz).rotateY(a)
      kKasnak.ekle(yer(g, cx, 0, cz), m.revzen)
    }
    // İç kubbe ve göbek
    kKubbe.ekle(yer(icKubbeG(R, kubbeH), cx, yHalka + kasnakH, cz), m.sivaIc)
    kKubbe.ekle(yer(silindirG(R - 0.02, R - 0.02, 0.26, 32, true), cx, yHalka + kasnakH + 0.14, cz), m.bant)
    const gr = R * 0.42
    const gobek = new THREE.CircleGeometry(gr, 32).rotateX(Math.PI / 2)
    kKubbe.ekle(gobek.translate(cx, yHalka + kasnakH + kubbeH * Math.sin(Math.acos(Math.min(1, gr / R))) - 0.02, cz), m.gobek)
  }
  // Harim orta mekânı: dört pencereli sekizgen kasnak (s. 172)
  oda(0, ortaKubbe.z, -HOL_X, HOL_X, HOL_N, HOL_G, 10.9, 14.6, 6.05, 1.7, 5.4, 8, 4)
  disKasnak(ek3, kKasnak, m, 0, ortaKubbe.z, CATI_UST - 0.3, 3.2, 7.45, 8, 4)
  disKubbe(ek3, kKubbe, m, 0, ortaKubbe.z, CATI_UST + 2.85, 7.5, 6.1, 1.2)
  // Mihraplı bölüm: 11,50 m çapında kubbe, dört pencereli kasnak (s. 176)
  oda(0, mihZ, -MIH_X, MIH_X, ARA_G, MIH_G, 11.2, 14.4, MIH_X - 0.02, 1.5, 5, 16, 4)
  disKasnak(ek3, kKasnak, m, 0, mihZ, GOVDE_H + 0.8, 3.1, 7.05, 24, 4)
  disKubbe(ek3, kKubbe, m, 0, mihZ, GOVDE_H + 3.65, 7.2, 5.7, 1.2)
  // Yan eyvanlar: üç pencereli küçük kubbeler (s. 172)
  cift((s) => {
    const [x0, x1] = ayna(s, YAN_X, EY_DIS)
    oda(s * eyvanX, eyvanZ, x0, x1, HOL_N, EY_G, 8.7, 11, 3.3, 1.2, 2.5, 8, 3)
    disKasnak(ek3, kKasnak, m, s * eyvanX, eyvanZ, CATI_UST - 0.25, 1.1, 3.95, 8, 0)
    disKubbe(ek3, kKubbe, m, s * eyvanX, eyvanZ, CATI_UST + 0.8, 4.05, 2.7, 0.8)
  })

  // --- Minareler: taş kaide, tuğla silindirik gövde, iki bilezik, tek şerefe, kurşun külah (s. 180) ---
  cift((s) => {
    const x = s * (W + 1.85), z = -12
    const e = (g: THREE.BufferGeometry, mal: Mal) => K(yer(g, x, 0, z), mal)
    e(kutuG(3.6, 8.6, 3.6).translate(0, 4.3, 0), m.kesme)
    e(duzGolge(silindirG(1.5, 2.1, 1.6, 12)).translate(0, 9.4, 0), m.kesme)
    e(silindirG(1.42, 1.5, 22, 20).translate(0, 21, 0), m.tugla)
    for (const y of [13.5, 24.5]) e(silindirG(1.62, 1.62, 0.5, 20).translate(0, y, 0), m.kesmeAcik)
    for (let i = 0; i < 4; i++) e(silindirG(1.5 + (i + 1) * 0.22, 1.5 + i * 0.22, 0.42, 20).translate(0, 32.2 + i * 0.42, 0), m.kesmeAcik)
    e(silindirG(2.6, 2.6, 0.2, 20).translate(0, 33.95, 0), m.kesmeAcik)
    e(silindirG(2.42, 2.42, 0.95, 20, true).translate(0, 34.5, 0), m.kesmeAcik)
    e(silindirG(1.15, 1.25, 4.4, 16).translate(0, 36.2, 0), m.tugla)
    e(silindirG(1.42, 1.25, 0.28, 16).translate(0, 38.5, 0), m.kesmeAcik)
    e(dondurG([[1.34, 38.6], [0.06, 45.2], [0, 45.5]], 12, [1, 1]), m.kursun)
    e(dondurG([[0.08, 45.3], [0.16, 45.55], [0.04, 45.8], [0.1, 46], [0.01, 46.4], [0, 46.45]], 8), m.altin)
  })

  // ===== İÇ MEKÂN =====
  // Halı zeminler
  kutu(-HOL_X - 0.01, HOL_X + 0.01, TABAN - 0.03, TABAN + 0.02, HOL_N, HOL_G, m.haliT)
  cift((s) => {
    const [x0, x1] = ayna(s, HOL_X, EY_DIS)
    kutu(x0, x1, TABAN, TABAN + YUKSEK, HOL_N, EY_G, m.sivaIc)
    kutu(x0, x1, TABAN + YUKSEK, TABAN + YUKSEK + 0.02, HOL_N, EY_G, m.haliT)
    const [tx0, tx1] = ayna(s, YAN_X - 1.5, TAB_D)
    kutu(tx0, tx1, TABAN - 0.03, TABAN + 0.02, TAB_K, TAB_G, m.haliT)
  })
  kutu(-MIH_X, MIH_X, TABAN, TABAN + YUKSEK, HOL_G, MIH_G, m.sivaIc)
  kutu(-MIH_X, MIH_X, TABAN + YUKSEK, TABAN + YUKSEK + 0.02, HOL_G, MIH_G, m.haliT)
  // Basamaklar: orta eksende iki basamak, ahşap tırabzan
  const merdiven = (x0: number, x1: number, z0: number, z1: number, xEksen: boolean) => {
    for (let i = 0; i < 2; i++) {
      if (xEksen) kutu(x0 - 0.3 * (2 - i), x1 + 0.0, TABAN, TABAN + 0.2 * (i + 1), z0, z1, m.haliT)
      else kutu(x0, x1, TABAN, TABAN + 0.2 * (i + 1), z0 - 0.3 * (2 - i), z1, m.haliT)
    }
  }
  merdiven(-1.1, 1.1, HOL_G, HOL_G + 0.02, false)
  for (const x of [-1.15, 1.15]) {
    K(kutuG(0.08, 0.9, 0.08).translate(x, TABAN + 0.65, HOL_G - 0.6), m.ahsapKoyu)
    K(kutuG(0.06, 0.06, 1.3).translate(x, TABAN + 1.05, HOL_G).rotateX(0), m.ahsapKoyu)
  }
  cift((s) => {
    const gX = s > 0 ? HOL_X : -HOL_X
    for (let i = 0; i < 2; i++) {
      const d = 0.3 * (2 - i)
      const [ax, bx] = s > 0 ? [gX - d, gX + 0.02] : [gX - 0.02, gX + d]
      kutu(ax, bx, TABAN, TABAN + 0.2 * (i + 1), eyvanZ - 1, eyvanZ + 1, m.haliT)
    }
    for (const dz of [-1.05, 1.05]) K(kutuG(1.3, 0.06, 0.06).translate(gX, TABAN + 1.05, eyvanZ + dz), m.ahsapKoyu)
    // Pabuçluk nişleri
    for (const dz of [-2.4, 2.1]) K(kutuG(0.03, 0.22, 0.7).translate(gX - s * 0.01, TABAN + 0.2, eyvanZ + dz), m.sivaKoyu)
  })
  for (const dx of [-3.2, 3.2]) K(kutuG(0.7, 0.22, 0.03).translate(dx, TABAN + 0.2, HOL_G - 0.01), m.sivaKoyu)
  // Harim duvarları üstünde taş-sıva kuşağı ve eyvan sıvaları
  const icPanel = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => kutu(x0, x1, y0, y1, z0, z1, m.sivaIc)
  cift((s) => {
    const [ix0, ix1] = ayna(s, YAN_X, EY_DIS)
    icPanel(ix0, ix1, TABAN, 8.8, HOL_N - 0.0, HOL_N + 0.04)
    icPanel(ix0, ix1, TABAN, 8.8, EY_G - 0.04, EY_G)
    const [dx0, dx1] = s > 0 ? [EY_DIS - 0.04, EY_DIS] : [-EY_DIS, -EY_DIS + 0.04]
    icPanel(dx0, dx1, TABAN, 8.8, HOL_N, EY_G)
    // Eyvan penceresi: dış duvarda altta sivri alınlıklı, üstte dikdörtgen
    const pc = s > 0 ? -Math.PI / 2 : Math.PI / 2
    const pencere = (x: number, y: number, z: number, ry: number, g: number, h: number, mal: Mal) => K(yer(new THREE.PlaneGeometry(g, h).translate(0, y + h / 2, 0), x, 0, z, ry), mal)
    pencere(s * (EY_DIS - 0.05), TABAN + YUKSEK + 1.05, eyvanZ, pc, 1.15, 1.45, m.demir)
    pencere(s * (EY_DIS - 0.05), TABAN + YUKSEK + 3.85, eyvanZ, pc, 0.75, 1.05, m.revzen)
    K(yer(cikar(kemerCerceve(1.9, 2.6), 0.04, 0), s * (EY_DIS - 0.06), TABAN + YUKSEK + 0.85, eyvanZ, pc), m.bant)
    // Tabhane: duvar sıvası, üst ocak ve raf nişleri, çapraz tonoz
    const [tx0, tx1] = ayna(s, YAN_X, TAB_D)
    icPanel(tx0, tx1, TABAN, 7, TAB_K, TAB_K + 0.04)
    const rafZ = TAB_G - 0.03
    icPanel(tx0, tx1, TABAN, 7, TAB_G - 0.04, TAB_G)
    const [px0, px1] = s > 0 ? [YAN_X, YAN_X + 0.04] : [-YAN_X - 0.04, -YAN_X]
    icPanel(px0, px1, TABAN, 7, TAB_K, TAB_G)
    const [qx0, qx1] = s > 0 ? [TAB_D - 0.04, TAB_D] : [-TAB_D, -TAB_D + 0.04]
    icPanel(qx0, qx1, TABAN, 7, TAB_K, TAB_G)
    const tc = s * (YAN_X + TAB_D) / 2, tz = (TAB_K + TAB_G) / 2
    // Ocak ve iki sıra kemerli raf nişi (ERD02013 fotoğrafına göre)
    for (let j = 0; j < 2; j++) for (let i = -2; i <= 2; i++) {
      if (j === 0 && i === 0) continue
      const nx = tc + i * 1.05, ny = TABAN + 1.5 + j * 1.5
      const n = kemer(new THREE.Shape(), nx, ny, 0.72, 0.5, 0.4)
      K(new THREE.ShapeGeometry(n, 6).rotateY(Math.PI).translate(2 * nx, 0, rafZ - 0.02), m.sivaKoyu)
    }
    K(kutuG(1.5, 2.3, 0.3).translate(tc, TABAN + 1.15, TAB_G - 0.18), m.sivaIc)
    K(kutuG(0.9, 1.5, 0.04).translate(tc, TABAN + 0.8, TAB_G - 0.35), m.koyu)
    // Tonoz: dört üçgen yüz
    const tepe = TABAN + 8.6, yk = TABAN + 6.6
    const koseler = [[tx0, TAB_K], [tx1, TAB_K], [tx1, TAB_G], [tx0, TAB_G]]
    for (let i = 0; i < 4; i++) {
      const a = koseler[i], b = koseler[(i + 1) % 4]
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], yk, a[1], b[0], yk, b[1], tc, tepe, tz], 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2))
      g.computeVertexNormals()
      K(g, m.sivaIc)
    }
    K(yer(new THREE.PlaneGeometry(1.1, 1.5), s * (TAB_D - 0.05), TABAN + 2.2, tz, pc), m.demir)
  })

  // Mihraplı bölümün sıvası, kuşağı, pencereleri
  const mihPanel = (x0: number, x1: number, z0: number, z1: number) => kutu(x0, x1, TABAN, 11.25, z0, z1, m.sivaIc)
  mihPanel(-MIH_X, MIH_X, MIH_G - 0.05, MIH_G)
  cift((s) => {
    const [a, b] = s > 0 ? [MIH_X - 0.05, MIH_X] : [-MIH_X, -MIH_X + 0.05]
    mihPanel(a, b, ARA_G, MIH_G)
    // Yan duvar: alt pencere, üst şebekeli kemerli pencereler
    const ry = s > 0 ? -Math.PI / 2 : Math.PI / 2, x = s * (MIH_X - 0.06)
    const pencereler = [8, 14.5]
    for (const z of pencereler) {
      K(yer(new THREE.PlaneGeometry(1.1, 1.75).translate(0, TABAN + YUKSEK + 1.4, 0), x, 0, z, ry), m.demir)
      K(yer(kutuK(-0.75, 0.75, TABAN + YUKSEK + 0.42, TABAN + YUKSEK + 0.5, 0, 0.08), x, 0, z, ry), m.kesmeAcik)
      K(yer(cikar(kemerCerceve(1.5, 1.5), 0.03, 0), x, TABAN + YUKSEK + 2.5, z, ry), m.bant)
      K(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, TABAN + YUKSEK + 2.8, 1, 0.1, 0.5), 6).translate(0, 0, 0.02), x, 0, z, ry), m.sebekeAcik)
      K(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, 8.1, 0.8, 0.6, 0.45), 6).translate(0, 0, 0.02), x, 0, z, ry), m.revzen)
    }
    // Kıble duvarı: mihrap yanındaki alt pencere ve üstte revzenli kemerli pencere
    const dz = MIH_G - 0.07
    K(new THREE.PlaneGeometry(1.1, 1.8).rotateY(Math.PI).translate(s * 3.85, TABAN + YUKSEK + 1.45, dz), m.demir)
    K(kutuK(s * 3.85 - 0.75, s * 3.85 + 0.75, TABAN + YUKSEK + 0.48, TABAN + YUKSEK + 0.56, dz - 0.1, dz), m.kesmeAcik)
    K(new THREE.PlaneGeometry(1.25, 0.05).translate(0, 0, 0).rotateY(Math.PI).translate(s * 3.85, TABAN + YUKSEK + 2.42, dz), m.kesmeAcik)
    K(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, TABAN + YUKSEK + 2.65, 1.15, 0.1, 0.5), 6).rotateY(Math.PI).translate(s * 3.85, 0, dz), m.sebekeAcik)
    K(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, 7.6, 0.95, 1.2, 0.5), 6).rotateY(Math.PI).translate(s * 3.95, 0, dz), m.revzen)
  })
  // Mihrap duvarı: Drive fotoğrafı doğrudan duvar olarak (ACIK_YAYIN'da düz panel)
  const mihG = 5.08, mihH = 10.03
  K(new THREE.PlaneGeometry(mihG, mihH).rotateY(Math.PI).translate(0, TABAN + YUKSEK + mihH / 2 + 0.02, MIH_G - 0.075), m.mihrapDuvar)
  kutu(-MIH_X, MIH_X, 11.05, 11.28, MIH_G - 0.12, MIH_G - 0.05, m.bant)
  cift((s) => {
    const [a, b] = s > 0 ? [MIH_X - 0.12, MIH_X - 0.05] : [-MIH_X + 0.05, -MIH_X + 0.12]
    kutu(a, b, 11.05, 11.28, ARA_G, MIH_G, m.bant)
  })
  // Harim taş kuşağı
  for (const [x0, x1, z0, z1] of [[-HOL_X, HOL_X, HOL_N, HOL_N + 0.06], [-HOL_X, HOL_X, HOL_G - 0.06, HOL_G], [-HOL_X, -HOL_X + 0.06, HOL_N, HOL_G], [HOL_X - 0.06, HOL_X, HOL_N, HOL_G]]) kutu(x0, x1, 10.78, 11, z0, z1, m.bant)
  // Levhalar: Drive görsellerinden (ACIK_YAYIN'da yok)
  if (m.madalyon) {
    K(new THREE.CircleGeometry(1.2, 28).rotateY(Math.PI).translate(3.95, 6.3, MIH_G - 0.08), m.madalyon)
    K(yer(new THREE.CircleGeometry(1.25, 28), -MIH_X + 0.07, 5.7, 11.3, Math.PI / 2), m.madalyon)
  }
  if (m.levha) {
    K(new THREE.CircleGeometry(1.2, 28).rotateY(Math.PI).translate(-3.95, 6.3, MIH_G - 0.08), m.levha)
    K(yer(new THREE.CircleGeometry(1.25, 28), MIH_X - 0.07, 5.7, 11.3, -Math.PI / 2), m.levha)
  }

  // Harim kuzey duvarı: iki kemerli pencere ve ortada nefeslik
  for (const x of [-2.9, 2.9]) {
    K(new THREE.ShapeGeometry(kemer(new THREE.Shape(), x, 7, 1.05, 1.2, 0.7), 6).translate(0, 0, HOL_N + 0.03), m.sebekeAcik)
  }
  K(new THREE.PlaneGeometry(1.2, 0.8).translate(0, 8.1, HOL_N + 0.03), m.sebekeAcik)
  // Tabhane kapısı üstü: iki yanda iri lokma demirli niş pencere (b31)
  cift((s) => {
    const ry = s > 0 ? -Math.PI / 2 : Math.PI / 2
    K(yer(new THREE.PlaneGeometry(1.5, 2.3).translate(0, 7.2, 0), s * (HOL_X + 0.02), 0, 1.8, ry), m.demirKoyu)
    K(yer(kutuK(-1.0, 1.0, 5.75, 8.6, -0.02, 0.0), s * (HOL_X + 0.01), 0, 1.8, ry), m.kesmeAcik)
    K(new THREE.BoxGeometry(0.12, 2.9, 0.08).translate(s * (HOL_X + 0.02), TABAN + 1.45, 1.0), m.ahsapKoyu)
    K(new THREE.BoxGeometry(0.12, 2.9, 0.08).translate(s * (HOL_X + 0.02), TABAN + 1.45, 2.6), m.ahsapKoyu)
  })

  // Minber: ahşap, sade, sivri külahlı; merdiven kıbleye doğru yükselir (fotoğraf ERD01977)
  const MIN_X = -4.75, MIN_G = 1, RZ0 = 12.2, RZ1 = 15.7, TEPE = 2.4
  const ZM = TABAN + YUKSEK
  const adim = 12
  for (let i = 0; i < adim; i++) {
    const z0 = RZ0 + (RZ1 - RZ0) * (i / adim), z1 = RZ0 + (RZ1 - RZ0) * ((i + 1) / adim)
    const h = TEPE * ((i + 0.5) / adim)
    kutu(MIN_X - MIN_G / 2, MIN_X + MIN_G / 2, ZM, ZM + h, z0, z1, m.haliT)
  }
  const kenarYan = (s: number) => {
    const ks = new THREE.Shape()
    ks.moveTo(RZ0, 0); ks.lineTo(RZ1 + 0.2, TEPE); ks.lineTo(RZ1 + 1.4, TEPE); ks.lineTo(RZ1 + 1.4, 0); ks.closePath()
    const x = MIN_X + s * (MIN_G / 2 + 0.04)
    K(cikar(ks, 0.07, 0).rotateY(-Math.PI / 2).translate(x + 0.035, ZM, 0), m.ahsapAcik)
    const kk = new THREE.Shape()
    kk.moveTo(RZ0, 0.2); kk.lineTo(RZ1 + 0.05, TEPE + 0.85); kk.lineTo(RZ1 + 0.05, TEPE + 0.75); kk.lineTo(RZ0, 0.08); kk.closePath()
    K(cikar(kk, 0.05, 0).rotateY(-Math.PI / 2).translate(x + 0.025, ZM + 0.2, 0), m.ahsapAcik)
  }
  kenarYan(1); kenarYan(-1)
  kutu(MIN_X - MIN_G / 2, MIN_X + MIN_G / 2, ZM, ZM + TEPE, RZ1, RZ1 + 1.4, m.ahsapKoyu)
  for (const [dx, dz] of [[-0.55, RZ1 + 0.05], [0.55, RZ1 + 0.05], [-0.55, RZ1 + 1.35], [0.55, RZ1 + 1.35]]) K(kutuG(0.1, 1.9, 0.1).translate(MIN_X + dx, ZM + TEPE + 0.95, dz), m.ahsapAcik)
  K(yer(duzGolge(silindirG(0.05, 0.86, 2.5, 8).rotateY(Math.PI / 8)), MIN_X, ZM + TEPE + 3.2, RZ1 + 0.7), m.altinKoyu)
  K(yer(dondurG([[0.08, 0], [0.15, 0.1], [0.03, 0.28], [0, 0.4]], 8), MIN_X, ZM + TEPE + 4.43, RZ1 + 0.7), m.altin)
  // Minber kapısı
  kutu(MIN_X - 0.62, MIN_X - 0.5, ZM, ZM + 2.25, RZ0 - 0.35, RZ0 - 0.25, m.ahsapAcik)
  kutu(MIN_X + 0.5, MIN_X + 0.62, ZM, ZM + 2.25, RZ0 - 0.35, RZ0 - 0.25, m.ahsapAcik)
  kutu(MIN_X - 0.62, MIN_X + 0.62, ZM + 2.25, ZM + 2.55, RZ0 - 0.35, RZ0 - 0.25, m.ahsapAcik)

  // Vaaz kürsüsü: yalın ahşap (s. 178)
  kutu(3.55, 4.75, ZM, ZM + 1, 15.3, 16.5, m.ahsapKoyu)
  kutu(3.5, 4.8, ZM + 1, ZM + 1.12, 15.25, 16.55, m.ahsapAcik)
  kutu(3.55, 4.75, ZM + 1.12, ZM + 2.2, 16.42, 16.5, m.ahsapKoyu)

  // Müezzin mahfili: harim kuzeybatı köşesi, dört direk ve korkuluk; merdivenle çıkılır (fotoğraf ERD01991)
  const MAH = { x0: -5.95, x1: -2.3, z0: HOL_N, z1: -5.9, h: 2.9 }
  const MY = TABAN + MAH.h
  kutu(MAH.x0, MAH.x1, MY - 0.18, MY, MAH.z0, MAH.z1, m.ahsapKoyu)
  kutu(MAH.x0, MAH.x1, MY - 0.42, MY - 0.18, MAH.z1 - 0.1, MAH.z1, m.ahsapAcik)
  for (const x of [MAH.x0 + 0.1, -4.1, MAH.x1 - 0.1]) K(kutuG(0.2, MAH.h - 0.2, 0.2).translate(x, TABAN + (MAH.h - 0.2) / 2, MAH.z1 - 0.12), m.ahsapKoyu)
  for (const [x0, x1, z0, z1] of [[MAH.x0, -4.72, MAH.z1 - 0.06, MAH.z1], [-3.8, MAH.x1, MAH.z1 - 0.06, MAH.z1], [MAH.x1 - 0.06, MAH.x1, MAH.z0, MAH.z1]]) {
    kutu(x0, x1, MY + 0.94, MY + 1.02, z0, z1, m.ahsapAcik)
    const adet = Math.floor(Math.max(x1 - x0, z1 - z0) / 0.16)
    for (let i = 0; i <= adet; i++) {
      const t = i / adet
      K(kutuG(0.04, 0.94, 0.04).translate(x0 + (x1 - x0) * t, MY + 0.47, z0 + (z1 - z0) * t), m.ahsapKoyu)
    }
  }
  // Mahfil merdiveni: düz koşu, yerden platforma
  const MRZ0 = MAH.z1, MRZ1 = -2.3
  const madim = 14
  for (let i = 0; i < madim; i++) {
    const h = MAH.h * (1 - (i + 0.5) / madim)
    kutu(-4.72, -3.8, TABAN, TABAN + h, MRZ0 + (MRZ1 - MRZ0) * (i / madim), MRZ0 + (MRZ1 - MRZ0) * ((i + 1) / madim), m.haliT)
  }
  for (const x of [-4.76, -3.76]) {
    const ks = new THREE.Shape()
    ks.moveTo(MRZ1, 0.9); ks.lineTo(MRZ0, MAH.h + 1); ks.lineTo(MRZ0, MAH.h + 0.9); ks.lineTo(MRZ1, 0.8); ks.closePath()
    K(cikar(ks, 0.05, 0).rotateY(-Math.PI / 2).translate(x + 0.025, TABAN, 0), m.ahsapAcik)
  }
  // Pabuç rafları: kapının iki yanında (fotoğraf)
  for (const [x0, x1] of [[1.4, 5.8], [-2.1, -1.3]] as const) {
    kutu(x0, x1, TABAN, TABAN + 0.85, HOL_N, HOL_N + 0.4, m.ahsapAcik)
  }
  // Avizeler
  avize(k, m, 0, 5.4, ortaKubbe.z, 3.2, 21, 22)
  avize(k, m, 0, 5.8, mihZ, 3, 20.6, 20)
  cift((s) => avize(k, m, s * eyvanX, 5.2, eyvanZ, 1.15, 12.5, 8))

  // ===== YÜRÜME =====
  const K0 = (x0: number, x1: number, z0: number, z1: number, ust?: number): Kutu => ({ x0, x1, z0, z1, ...(ust === undefined ? {} : { ust }) })
  const kutular: Kutu[] = []
  const hepsi = (x0: number, x1: number, z0: number, z1: number, ust?: number) => { kutular.push(K0(x0, x1, z0, z1, ust), K0(-x1, -x0, z0, z1, ust)) }
  // Son cemaat: bölme kemeri ayakları; ön cephe ve yan duvar sınır
  for (const d of [DIREK[0], DIREK[1]]) { hepsi(d - 0.6, d + 0.6, N_IC, nzOrta - 1.75); hepsi(d - 0.6, d + 0.6, nzOrta + 1.75, N1) }
  // Revak duvarı: yalnız orta niş açık
  hepsi(1.7, EY_DIS + 1, N1, -9.2)
  hepsi(1, EY_DIS + 1, -9.2, HOL_N)
  // Harim yan duvarları: eyvan kemeri ve tabhane kapısı
  hepsi(HOL_X, YAN_X, HOL_N, -7.6)
  hepsi(HOL_X, YAN_X, -1.65, 1)
  hepsi(HOL_X, YAN_X, 2.6, HOL_G)
  // Eyvan-tabhane arası ve tabhane dış dolgu
  hepsi(YAN_X, EY_DIS + 1, EY_G, TAB_K)
  hepsi(TAB_D, EY_DIS + 1, TAB_K, TAB_G)
  hepsi(YAN_X, EY_DIS + 1, TAB_G, MIH_G)
  // Ara kemer ve mihraplı bölüm yan duvarları
  hepsi(4.9, YAN_X + 1, HOL_G, ARA_G)
  hepsi(MIH_X, YAN_X + 1, ARA_G, MIH_G)
  // Harimden eyvan/mihraplı bölüme yalnız basamaktan çıkılır
  hepsi(HOL_X - 0.06, HOL_X, -7.6, eyvanZ - 1.1, YUKSEK)
  hepsi(HOL_X - 0.06, HOL_X, eyvanZ + 1.1, -1.65, YUKSEK)
  hepsi(1.15, 4.9, HOL_G - 0.06, HOL_G, YUKSEK)
  // Eşyalar
  kutular.push(
    K0(MIN_X - MIN_G / 2 - 0.07, MIN_X + MIN_G / 2 + 0.07, RZ1 + 1.42, MIH_G), // minber arkası
    K0(3.55, 4.75, 15.3, MIH_G), // kürsü
    K0(1.4, 5.8, HOL_N, HOL_N + 0.4), K0(-2.1, -1.3, HOL_N, HOL_N + 0.4), // raflar
    K0(MAH.x0 + 0, MAH.x0 + 0.2, MAH.z1 - 0.22, MAH.z1 - 0.02), K0(-4.2, -4, MAH.z1 - 0.22, MAH.z1 - 0.02), K0(MAH.x1 - 0.2, MAH.x1, MAH.z1 - 0.22, MAH.z1 - 0.02),
    K0(-MIH_X, MIH_X, MIH_G - 0.1, MIH_G),
  )
  const zeminler: ZeminAlani[] = [
    // Yan eyvanlar ve mihraplı bölüm: iki basamak yüksek
    { x0: HOL_X, x1: EY_DIS, z0: HOL_N, z1: EY_G, h0: YUKSEK, h1: YUKSEK },
    { x0: -EY_DIS, x1: -HOL_X, z0: HOL_N, z1: EY_G, h0: YUKSEK, h1: YUKSEK },
    { x0: -MIH_X - 1, x1: MIH_X + 1, z0: HOL_G, z1: MIH_G, h0: YUKSEK, h1: YUKSEK },
    // Son cemaat yan sofaları
    { x0: DIREK[0], x1: EY_DIS, z0: N_IC, z1: N1, h0: SOFA, h1: SOFA },
    { x0: -EY_DIS, x1: -DIREK[0], z0: N_IC, z1: N1, h0: SOFA, h1: SOFA },
    // Minber merdiveni ve köşkü
    { x0: MIN_X - MIN_G / 2, x1: MIN_X + MIN_G / 2, z0: RZ0, z1: RZ1, h0: YUKSEK, h1: YUKSEK + TEPE },
    { x0: MIN_X - MIN_G / 2, x1: MIN_X + MIN_G / 2, z0: RZ1, z1: RZ1 + 1.4, h0: YUKSEK + TEPE, h1: YUKSEK + TEPE },
    // Mahfil: alttan geçilir, merdivenle çıkılır
    { x0: MAH.x0, x1: MAH.x1, z0: MAH.z0, z1: MAH.z1, h0: MAH.h, h1: MAH.h, altGecilir: true },
    { x0: -4.72, x1: -3.8, z0: MRZ0, z1: MRZ1, h0: MAH.h, h1: 0 },
  ]
  const gorusKesenler: Kutu[] = [
    K0(-W, -1.7, N1, HOL_N), K0(1.7, W, N1, HOL_N),
    K0(HOL_X, YAN_X, -1.65, HOL_G), K0(-YAN_X, -HOL_X, -1.65, HOL_G),
    K0(4.9, YAN_X, HOL_G, ARA_G), K0(-YAN_X, -4.9, HOL_G, ARA_G),
    K0(YAN_X, W, EY_G, TAB_K), K0(-W, -YAN_X, EY_G, TAB_K),
    K0(MIH_X, W, TAB_G, DIS_G), K0(-W, -MIH_X, TAB_G, DIS_G),
  ]
  return {
    sinir: { x0: -EY_DIS, x1: EY_DIS, z0: N_IC, z1: MIH_G },
    kutular: kutular.filter((b) => b.x1 > b.x0 && b.z1 > b.z0),
    daireler: [],
    zeminler,
    gorusKesenler,
    gozY: GOZ_Y,
    tabanY: TABAN,
  }
}

/** İçte küçük kubbe: tek parça yüzey. */
function icKubbeG(R: number, H: number) {
  const p: [number, number][] = []
  for (let t = 0; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    p.push([R * Math.cos(a), H * Math.sin(a)])
  }
  return dondurG(p, 40, [1, 1])
}

function kemerCerceve(g: number, h: number) {
  const s = kemer(new THREE.Shape(), 0, 0, g, h * 0.55, h * 0.45)
  s.holes.push(kemer(new THREE.Path(), 0, 0, g - 0.24, h * 0.55, h * 0.45 - 0.18))
  return s
}
