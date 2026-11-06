// Külliyenin diğer yapıları: Yeşil Türbe, medrese, imaret ve avlu şadırvanı. Ölçüler envanterden (s. 119, 125, 127, 138);
// yapıların birbirine uzaklığı maket içinde sığsın diye kısaltılmıştır, yönleri kaynağa uygundur.
import * as THREE from 'three'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, yer, type Mal } from '../../ulucamiParca'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { YesilMalzemeleri } from './dokular'
import { kubbeDis } from './dis'
import { cokgen, hizala, kirmaCati, levha, prizma } from './yardim'

/** Yeşil Türbe: sekizgen, kenar 8,20 m; saçak 13,83 m; toplam 25,5 m (s. 138). */
export function yesilTurbe(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, kKasnak: Kova, kKubbe: Kova, cx: number, cz: number) {
  const KENAR = 8.2, R = KENAR / (2 * Math.sin(Math.PI / 8)), APOT = KENAR / (2 * Math.tan(Math.PI / 8))
  const SACAK = 13.83, TABAN_H = 1.6
  // Yükselti: küçük tepe ve teras (s. 137)
  k.ekle(yer(duzGolge(dondurG([[R + 7, 0], [R + 5.6, 0.8], [R + 2.2, 1], [0.01, 1]], 8)).rotateY(Math.PI / 8), cx, 0, cz), m.mermerKoyu)
  const Y0 = 1
  k.ekle(prizma(cokgen(8, R + 0.55, cx, cz), Y0, Y0 + TABAN_H), m.mermer)
  k.ekle(prizma(cokgen(8, R + 0.8, cx, cz), Y0, Y0 + 0.5), m.mermerKoyu)
  k.ekle(prizma(cokgen(8, R, cx, cz), Y0 + TABAN_H, SACAK + Y0), ym.turbeCini)
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 4 * n
    const ek = (g: THREE.BufferGeometry, mal: Mal) => {
      g.translate(0, 0, APOT).rotateY(a).translate(cx, 0, cz)
      k.ekle(g, mal)
    }
    const kuzey = n === 4 // +z'den saat yönünde: dördüncü yüz kuzeye bakar
    const Y = Y0
    // Mermer dikdörtgen çerçeve ve sivri kemerli yüzey (s. 138)
    const G = 6.9, ust = Y + 12.9, alt = Y + 2
    const cer = dikdortgen(-G / 2, alt, G / 2, ust)
    cer.holes.push(dikdortgen(-G / 2 + 0.26, alt + 0.26, G / 2 - 0.26, ust - 0.26) as unknown as THREE.Path)
    ek(cikar(cer, 0.08), m.mermer)
    const kem = kemer(new THREE.Shape(), 0, Y + 5.7, G - 0.75, 1, 3.8)
    kem.holes.push(kemer(new THREE.Path(), 0, Y + 5.7, G - 1.45, 1, 3.3))
    ek(cikar(kem, 0.06), m.mermer)
    for (const s of [-1, 1]) ek(kutuG(0.35, 3.72, 0.06).translate(s * (G - 1.1) / 2, Y + 3.86, 0.03), m.mermer)
    if (kuzey) {
      // Taç kapı: derin niş, mukarnas izlenimi, ahşap kanat (s. 140)
      ek(kutuG(3.6, 7.2, 0.12).translate(0, Y + 5.6, 0.04), m.mermer)
      ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, Y + 2.1, 2.5, 3.3, 1.6), 8).translate(0, 0, 0.11), ym.mahfilCini)
      ek(kutuG(1.71, 2.37, 0.1).translate(0, Y + 3.3, 0.14), ym.ceviz)
      for (const s of [-1, 1]) ek(kutuG(0.05, 2.37, 0.04).translate(s * 0.02, Y + 3.3, 0.2), ym.cevizKoyu)
      for (let j = 0; j < 4; j++) ek(kutuG(2.6 - j * 0.5, 0.28, 0.14 + j * 0.05).translate(0, Y + 6.6 + j * 0.28, 0.11), ym.firuzeCini)
      continue
    }
    // Alt pencere: mermer söve, lacivert alınlık; üst pencere: kemerli kafes (s. 138, 140)
    ek(cikar(dikdortgen(-1.25, Y + 2.8, 1.25, Y + 5.8), 0.1), m.mermer)
    ek(new THREE.PlaneGeometry(1.5, 2).translate(0, Y + 4.3, 0.12), ym.demir)
    ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, Y + 5.9, 2.4, 0.3, 1.25), 8).translate(0, 0, 0.1), ym.mahfilCini)
    ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, Y + 8.6, 1.3, 0.75, 0.85), 8).translate(0, 0, 0.09), m.kafes)
    const ekle = kemer(new THREE.Shape(), 0, Y + 8.5, 1.75, 0.85, 1.05)
    ekle.holes.push(kemer(new THREE.Path(), 0, Y + 8.6, 1.3, 0.75, 0.85))
    ek(cikar(ekle, 0.05), m.mermer)
  }
  // Saçak silmesi, açık mavi yüksek kasnak (8 pencereli), hafif sivri kurşun kubbe; toplam 25,5 m
  k.ekle(prizma(cokgen(8, R + 0.22, cx, cz), Y0 + SACAK - 0.1, Y0 + SACAK + 0.42), m.mermer)
  k.ekle(new THREE.CircleGeometry(R + 0.2, 8, Math.PI / 8).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate(cx, Y0 + SACAK + 0.42, cz), m.mermer)
  const KY = Y0 + 19.3
  const kasnakR = R * 0.93
  kKasnak.ekle(prizma(cokgen(8, kasnakR, cx, cz), Y0 + SACAK + 0.4, KY), ym.krem)
  kKasnak.ekle(prizma(cokgen(8, kasnakR + 0.1, cx, cz), KY - 0.3, KY), m.mermer)
  for (let n = 0; n < 8; n++) {
    const g = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, Y0 + 15.3, 1, 1.2, 0.8), 8).translate(0, 0, kasnakR * Math.cos(Math.PI / 8) + 0.02)
    kKasnak.ekle(g.rotateY(n * Math.PI / 4).translate(cx, 0, cz), m.kafes)
  }
  kKasnak.ekle(new THREE.CircleGeometry(kasnakR, 8, Math.PI / 8).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate(cx, KY, cz), ym.krem)
  kubbeDis(kKubbe, m, cx, cz, kasnakR - 0.25, KY, 25.2 - KY, 1.2)
}

/** Medrese: 36,00 × 38,50 m, üç eyvanlı açık avlu, tonozlu revak; güneyde dışa taşan kubbeli dershane (s. 125-127). */
export function yesilMedrese(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova, cx: number, cz: number) {
  const GX = 18, GZ = 19.25, H = 5.6, ICX = 10.2, ICZ = 11.5
  const duvar = (ax: number, az: number, bx: number, bz: number, y1: number, mal: Mal) => {
    const L = Math.hypot(bx - ax, bz - az)
    k.ekle(hizala(cikar(dikdortgen(0, 0, L, y1), 0.8), ax, az, bx, bz), mal)
  }
  const [x0, x1, z0, z1] = [cx - GX, cx + GX, cz - GZ, cz + GZ]
  duvar(x0, z0, x0, z1, H, ym.almasikTuru)  // batı... normal içe
  duvar(x1, z1, x1, z0, H, ym.almasikTuru)
  duvar(x1, z0, x0, z0, H, ym.almasikTuru)
  duvar(x0, z1, x1, z1, H, ym.almasikTuru)
  // Avlu içi duvarlar
  const [ax0, ax1, az0, az1] = [cx - ICX, cx + ICX, cz - ICZ, cz + ICZ]
  duvar(ax0, az1, ax0, az0, H - 0.2, ym.almasikTuru)
  duvar(ax1, az0, ax1, az1, H - 0.2, ym.almasikTuru)
  duvar(ax0, az0, ax1, az0, H - 0.2, ym.almasikTuru)
  duvar(ax1, az1, ax0, az1, H - 0.2, ym.almasikTuru)
  // Avlu tabanı
  k.ekle(new THREE.PlaneGeometry(ICX * 2, ICZ * 2).rotateX(-Math.PI / 2).translate(cx, 0.03, cz), ym.gozluk)
  // Şadırvan: 12 kenarlı, 2,60 m çap; çevresinde yeşillik (s. 127)
  k.ekle(duzGolge(silindirG(4.6, 4.8, 0.22, 24)).translate(cx, 0.14, cz), ym.cim)
  k.ekle(duzGolge(silindirG(1.3, 1.36, 0.55, 12)).translate(cx, 0.5, cz), m.mermer)
  k.ekle(silindirG(1.2, 1.2, 0.02, 12).translate(cx, 0.78, cz), m.su)
  // Revak: sütunlar, sivri kemerli kuşak ve kiremit örtü
  const revak = (ax: number, az: number, bx: number, bz: number, adet: number) => {
    const L = Math.hypot(bx - ax, bz - az), adim = L / adet
    for (let i = 0; i <= adet; i++) {
      const t = i / adet
      k.ekle(yer(silindirG(0.26, 0.3, 3.3, 10), ax + (bx - ax) * t, 1.65, az + (bz - az) * t), m.mermer)
    }
    for (let i = 0; i < adet; i++) {
      const s = dikdortgen(i * adim, 3.1, (i + 1) * adim, 4.8)
      s.holes.push(kemer(new THREE.Path(), (i + 0.5) * adim, 3.2, adim - 0.5, 0.1, 1.3))
      k.ekle(hizala(cikar(s, 0.45), ax, az, bx, bz), ym.almasikTuru)
    }
  }
  const R = 2.8
  revak(ax0 + R, az0 + R, ax0 + R, az1 - R + 0, 5)
  revak(ax1 - R, az1 - R, ax1 - R, az0 + R, 5)
  revak(ax1 - R, az0 + R, ax0 + R, az0 + R, 5)
  revak(ax0 + R, az1 - R, ax1 - R, az1 - R, 5)
  // Revak örtüsü: avluya bakan eğimli kiremit
  const egim = (a: number[], b: number[], c: number[], d: number[]) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
    const uvx = (p: number[]) => [p[0] + p[2], p[1] * 2 + (p[0] - p[2]) * 0.2]
    g.setAttribute('uv', new THREE.Float32BufferAttribute([...uvx(a), ...uvx(b), ...uvx(c), ...uvx(a), ...uvx(c), ...uvx(d)], 2))
    g.computeVertexNormals()
    kCati.ekle(g, ym.kiremit)
  }
  const dusuk = 4.9, yuksek = 6
  egim([ax0 + R, dusuk, az1 - R], [ax1 - R, dusuk, az1 - R], [ax1, yuksek, az1], [ax0, yuksek, az1])
  egim([ax1 - R, dusuk, az0 + R], [ax0 + R, dusuk, az0 + R], [ax0, yuksek, az0], [ax1, yuksek, az0])
  egim([ax0 + R, dusuk, az0 + R], [ax0 + R, dusuk, az1 - R], [ax0, yuksek, az1], [ax0, yuksek, az0])
  egim([ax1 - R, dusuk, az1 - R], [ax1 - R, dusuk, az0 + R], [ax1, yuksek, az0], [ax1, yuksek, az1])
  // Hücre kanatlarının kırma çatıları
  const P = 0.45
  kCati.ekle(kirmaCati(x0 - P, x1 + P, z0 - P, az0, H - 0.05, 2.6), ym.kiremit)
  kCati.ekle(kirmaCati(x0 - P, x1 + P, az1, z1 + P, H - 0.05, 2.6), ym.kiremit)
  kCati.ekle(kirmaCati(x0 - P, ax0, az0 - 0.2, az1 + 0.2, H - 0.05, 2.6), ym.kiremit)
  kCati.ekle(kirmaCati(ax1, x1 + P, az0 - 0.2, az1 + 0.2, H - 0.05, 2.6), ym.kiremit)
  // Kapak: çatı altı boşluğu görünmesin
  for (const [a, b, c, d] of [[x0, x1, z0, az0], [x0, x1, az1, z1], [x0, ax0, az0, az1], [ax1, x1, az0, az1]]) {
    k.ekle(new THREE.PlaneGeometry(b - a, d - c).rotateX(-Math.PI / 2).translate((a + b) / 2, H - 0.06, (c + d) / 2), ym.gozluk)
  }
  // Dış cephe pencereleri: dikdörtgen taş söve, sivri kemer, firuze alınlık (s. 130)
  const dPen = (ax: number, az: number, bx: number, bz: number, u: number) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(hizala(g, ax, az, bx, bz), mal)
    ek(cikar(dikdortgen(u - 0.95, 0.9, u + 0.95, 3.1), 0.12), m.mermer)
    ek(new THREE.PlaneGeometry(1.15, 1.65).translate(u, 1.95, 0.14), ym.demir)
    const halka = kemer(new THREE.Shape(), u, 3.1, 2.3, 0.04, 1.65)
    halka.holes.push(kemer(new THREE.Path(), u, 3.1, 1.75, 0.04, 1.3))
    ek(cikar(halka, 0.14), m.mermer)
    levha(k, kemer(new THREE.Shape(), u, 3.1, 1.75, 0.04, 1.3), ax, az, bx, bz, ym.firuzeCini, 0, 0.1, false)
  }
  const adetX = 7, adetZ = 7
  for (let i = 0; i < adetX; i++) {
    const u = (i + 0.5) * (2 * GX) / adetX
    if (i !== 3) dPen(x1, z0, x0, z0, u)
    dPen(x0, z1, x1, z1, u)
  }
  for (let i = 0; i < adetZ; i++) {
    const u = (i + 0.5) * (2 * GZ) / adetZ
    dPen(x0, z0, x0, z1, u)
    dPen(x1, z1, x1, z0, u)
  }
  // Kuzey girişi: sivri kemerli yüksek açıklık, mermer kapı, firuze alınlık (s. 127)
  const giris = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(hizala(g, x1, z0, x0, z0), mal)
  const uK = GX
  giris(cikar(dikdortgen(uK - 2.5, 0, uK + 2.5, H + 1.4), 0.5), m.tas)
  giris(new THREE.ShapeGeometry(kemer(new THREE.Shape(), uK, 0, 3.5, 3.2, 1.9), 10).translate(0, 0, 0.51), m.koyu)
  giris(kutuG(1.7, 2.6, 0.08).translate(uK, 1.3, 0.54), ym.ceviz)
  giris(new THREE.ShapeGeometry(kemer(new THREE.Shape(), uK, 2.7, 2.1, 0.1, 1.1), 8).translate(0, 0, 0.54), ym.firuzeCini)
  kCati.ekle(kirmaCati(cx - 3, cx + 3, z0 - 1.5, z0 + 3, H + 1.3, 1.4), ym.kiremit)
  // Bacalar (fotoğraftaki gibi)
  for (const [ux, uz] of [[-12, -15], [12, -15], [-14, 8], [14, 8], [-15, -4], [15, -4]]) {
    k.ekle(yer(kutuG(0.7, 2.6, 0.7), cx + ux, H + 1.9, cz + uz), ym.almasikTuru)
    k.ekle(yer(duzGolge(silindirG(0.05, 0.62, 0.5, 4).rotateY(Math.PI / 4)), cx + ux, H + 3.4, cz + uz), ym.kiremit)
  }
  // Dershane: kare, kuzey-güney ekseninde güneye taşkın; 10 m çap kurşun kubbe, sekizgen kasnak (s. 125, 127)
  const DG = 6.9, DZ0 = z1 - 0.8, DZ1 = z1 + 12.5, DH = 8.5
  const [dx0, dx1] = [cx - DG, cx + DG]
  duvar(dx0, DZ0, dx0, DZ1, DH, m.tas)
  duvar(dx1, DZ1, dx1, DZ0, DH, m.tas)
  duvar(dx0, DZ1, dx1, DZ1, DH, m.tas)
  for (const s of [-1, 1]) dPen(s > 0 ? dx1 : dx0, s > 0 ? DZ1 : DZ0, s > 0 ? dx1 : dx0, s > 0 ? DZ0 : DZ1, (DZ1 - DZ0) / 2)
  dPen(dx0, DZ1, dx1, DZ1, DG)
  k.ekle(new THREE.PlaneGeometry(DG * 2 + 0.6, DZ1 - DZ0 + 0.6).rotateX(-Math.PI / 2).translate(cx, DH + 0.02, (DZ0 + DZ1) / 2), m.mermer)
  kKasnak.ekle(prizma(cokgen(8, 6.8, cx, (DZ0 + DZ1) / 2), DH, DH + 2.2), ym.almasikTuru)
  kKasnak.ekle(prizma(cokgen(8, 6.9, cx, (DZ0 + DZ1) / 2), DH + 2, DH + 2.3), m.mermer)
  for (let n = 0; n < 8; n++) {
    const g = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, DH + 0.3, 1, 0.5, 0.65), 8).translate(0, 0, 6.3)
    kKasnak.ekle(g.rotateY(n * Math.PI / 4).translate(cx, 0, (DZ0 + DZ1) / 2), m.kafes)
  }
  kubbeDis(kKubbe, m, cx, (DZ0 + DZ1) / 2, 5.5, DH + 2.25, 4.8, 1.05)
}

/** İmaret: 26 × 10 m mutfak + 16,30 × 10 m yemekhane, kırma kiremit çatı, kiremit kaplı çift kubbe (s. 119). */
export function yesilImaret(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, kCati: Kova, kKubbe: Kova, x0: number, z0: number) {
  const D = 10, H = 5.2, L1 = 26, L2 = 16.3
  const duvar = (ax: number, az: number, bx: number, bz: number) => {
    const L = Math.hypot(bx - ax, bz - az)
    k.ekle(hizala(cikar(dikdortgen(0, 0, L, H), 0.7), ax, az, bx, bz), ym.almasik)
  }
  const x1 = x0 + L1 + L2, z1 = z0 + D
  duvar(x0, z1, x1, z1); duvar(x1, z0, x0, z0); duvar(x0, z0, x0, z1); duvar(x1, z1, x1, z0)
  k.ekle(new THREE.PlaneGeometry(L1 + L2, D).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, H - 0.02, (z0 + z1) / 2), ym.gozluk)
  kCati.ekle(kirmaCati(x0 - 0.5, x0 + L1 + 0.1, z0 - 0.5, z1 + 0.5, H, 2.5), ym.kiremit)
  kCati.ekle(kirmaCati(x0 + L1 - 0.1, x1 + 0.5, z0 - 0.5, z1 + 0.5, H - 0.2, 2.5), ym.kiremit)
  // Kiremit kaplı çift kubbe: mutfak çatısından yükselir
  for (const x of [x0 + 8, x0 + 16]) {
    kKubbe.ekle(yer(silindirG(2.6, 2.75, 1.4, 12), x, H + 2.3, (z0 + z1) / 2), ym.almasik)
    kKubbe.ekle(yer(dondurG([[2.95, 0], [2.6, 0.3], [2.2, 0.95], [1.3, 1.65], [0.3, 2.1], [0, 2.15]], 18, [1, 1]), x, H + 3, (z0 + z1) / 2), ym.kiremit)
  }
  // Kuzeye bakan cephe: dört sivri kemerli açıklık ve yuvarlak kemerli pencereler (s. 119-120)
  const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(hizala(g, x1, z0, x0, z0), mal)
  for (let i = 0; i < 4; i++) {
    const u = L2 + 4 + i * 5.8
    ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), u, 0, 2.4, 1.8, 1.3), 8).translate(0, 0, 0.02), m.koyu)
    const hk = kemer(new THREE.Shape(), u, 0, 3, 1.8, 1.65)
    hk.holes.push(kemer(new THREE.Path(), u, 0.01, 2.4, 1.8, 1.3))
    ek(cikar(hk, 0.1), m.tugla)
  }
  for (let i = 0; i < 3; i++) {
    const u = 3.5 + i * 4.5
    ek(new THREE.CircleGeometry(0.7, 12, 0, Math.PI).translate(u, 3, 0.02), m.koyu)
    ek(new THREE.PlaneGeometry(1.4, 1.5).translate(u, 2.25, 0.02), m.koyu)
    ek(kutuG(1.7, 0.14, 0.1).translate(u, 1.45, 0.05), m.mermer)
  }
  // Anıtsal giriş ve mermer yalaklı çeşme nişi
  ek(cikar(dikdortgen(L2 - 0.4, 0, L2 + 1.8, H + 0.2), 0.3), m.tas)
}

/** Avlu şadırvanı: sekizgen, sekiz ahşap sütun, kurşun kaplı sivri kubbe, fıskiyeli havuz (s. 110). */
export function avluSadirvani(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, kKubbe: Kova, cx: number, cz: number) {
  const R = 3.7, H = 4.2
  k.ekle(duzGolge(silindirG(R + 0.65, R + 0.75, 0.25, 8)).rotateY(Math.PI / 8).translate(cx, 0.14, cz), m.mermer)
  k.ekle(duzGolge(silindirG(2.1, 2.15, 0.8, 8)).rotateY(Math.PI / 8).translate(cx, 0.65, cz), m.mermer)
  k.ekle(silindirG(1.9, 1.9, 0.02, 16).translate(cx, 1.06, cz), m.su)
  k.ekle(yer(dondurG([[0.28, 0], [0.12, 0.3], [0.36, 0.5], [0.1, 0.78], [0, 0.9]], 10), cx, 1.05, cz), m.mermer)
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + n * Math.PI / 4
    k.ekle(yer(silindirG(0.17, 0.2, H, 10), cx + Math.sin(a) * R, H / 2 + 0.25, cz + Math.cos(a) * R), ym.ceviz)
  }
  k.ekle(duzGolge(silindirG(R + 0.5, R + 0.5, 0.45, 8)).rotateY(Math.PI / 8).translate(cx, H + 0.45, cz), ym.ceviz)
  k.ekle(new THREE.CircleGeometry(R + 0.45, 8, Math.PI / 8).rotateX(Math.PI / 2).rotateY(Math.PI / 2).translate(cx, H + 0.22, cz), ym.cevizKoyu)
  kKubbe.ekle(yer(dondurG([[R + 1.1, -0.3], [R + 0.7, 0.05], [3.5, 0.5], [2.6, 1.4], [1.4, 2.6], [0.45, 3.7], [0.05, 4.2]], 32, [1, 1]), cx, H + 0.7, cz), m.kubbe)
  kKubbe.ekle(yer(dondurG([[0.1, 0], [0.05, 0.2], [0.14, 0.42], [0.03, 0.75], [0, 0.8]], 8), cx, H + 4.85, cz), m.altin)
}

/** Çınar izlenimli ağaç: birkaç düşük çokgenli küre. */
export function agac(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, x: number, z: number, boy: number, tohum: number) {
  k.ekle(yer(silindirG(0.32, 0.5, boy * 0.55, 8), x, boy * 0.28, z), m.ahsap)
  const r = (n: number) => {
    const v = Math.sin(tohum * 12.9 + n * 78.2) * 43758.5
    return v - Math.floor(v)
  }
  for (let i = 0; i < 7; i++) {
    const R = boy * (0.2 + r(i) * 0.14)
    const a = r(i + 10) * Math.PI * 2, d = boy * (0.08 + r(i + 20) * 0.26)
    const g = new THREE.IcosahedronGeometry(R, 1)
    k.ekle(g.translate(x + Math.sin(a) * d, boy * (0.58 + r(i + 30) * 0.32), z + Math.cos(a) * d), i % 2 ? ym.yaprak : ym.yaprakKoyu)
  }
}
