// Külliyenin dış kütleleri: medrese, imaret, hamam, on üç türbe, hazîre, ağaçlar. Yalnız dıştan gezilir.
// Ölçüsü kaynaktaki yapılar: imaret 13 × 40 m, medrese avlusu 17 × 17 m, hamam soğukluğu 10 × 10 m, II. Murad Türbesi
// 13,45 × 13,45 m, Alâaddin Türbesi 7,25 × 7,80 m, Saraylılar 6,65 m kenar, Ebe Hatun 4,46 m kenar (envanter s. 120-146).
// Yerleşim: s. 113 kuşbakışı fotoğraftan okunmuş, fotoğrafa girmeyen yapılar ve hamam temsilî konumlandırılmıştır.
import * as THREE from 'three'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kutuG, silindirG, yer } from '../../ulucamiParca'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { MuradiyeMalzemeleri } from './dokular'
import { BATI, DOGU, GUNEY, KUZEY, type Mal, alem, delikliDoseme, disKubbe, kasnak, kemerHalka, kemerYuz, kirmaCati } from './ortak'

export function kulliye(m: UlucamiMalzemeleri, d: MuradiyeMalzemeleri, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  const kutu = (g: number, h: number, dd: number, mal: Mal, x: number, y: number, z: number, kv = k) => kv.ekle(yer(kutuG(g, h, dd), x, y, z), mal)
  /** Dikdörtgen yapının dört yüzüne pencere dizisi. */
  const pencereSirasi = (x: number, z: number, ry: number, L: number, adet: number, y: number, g: number, duz: number, hkalin: number, halka: Mal, yuz: Mal) => {
    for (let i = 0; i < adet; i++) {
      const u = -L / 2 + (i + 0.5) * (L / adet)
      kemerYuz(k, x, z, ry, u, y, g, duz, g * 0.5, 0.02, yuz)
      kemerHalka(k, x, z, ry, u, y, g, duz, g * 0.5, hkalin, 0, halka)
    }
  }

  // --- Medrese: batı ucunda; revaklı avlu bugün çelik-cam örtülü, on altı hücre, dershane eyvanı güneyde (s. 120-122) ---
  const medrese = () => {
    const X = -67.6, Z = 0.7, EN = 18, DER = 13.5 // yarı ölçüler: fotoğraftan
    const Y = 6.4
    kutu(EN * 2, Y, DER * 2, d.almasikCami, X, Y / 2, Z)
    kutu(EN * 2 + 0.5, 0.3, DER * 2 + 0.5, m.tugla, X, Y, Z)
    pencereSirasi(X, Z - DER, KUZEY, EN * 2, 8, 1.4, 1, 1.5, 0.2, m.tugla, m.koyu)
    pencereSirasi(X, Z + DER, GUNEY, EN * 2, 6, 1.4, 1, 1.5, 0.2, m.tugla, m.koyu)
    pencereSirasi(X + EN, Z, DOGU, DER * 2, 7, 1.4, 1, 1.5, 0.2, m.tugla, m.koyu)
    pencereSirasi(X - EN, Z, BATI, DER * 2, 7, 1.4, 1, 1.5, 0.2, m.tugla, m.koyu)
    // Kurşun çevre çatısı ve cam örtü
    delikliDoseme(kCati, X - EN - 0.2, X + EN + 0.2, Z - DER - 0.2, Z + DER + 0.2, 6.56, [], m.kursun)
    kirmaCati(kCati, X - EN - 0.2, X + EN + 0.2, Z - DER - 0.2, Z - 8.7, 6.56, 1.1, m.kursun)
    kirmaCati(kCati, X - EN - 0.2, X + EN + 0.2, Z + 8.7, Z + DER + 0.2, 6.56, 1.1, m.kursun)
    // Cam örtü: iki kademe (avlu 17 × 17 m)
    for (const [dx, h, yuk] of [[-4.3, 2.2, 1.1], [4.3, 2.6, 1.3]] as const) {
      kutu(8.6, h, 17, d.camCati, X + dx, 6.6 + h / 2, Z, kCati)
      kirmaCati(kCati, X + dx - 4.6, X + dx + 4.6, Z - 8.9, Z + 8.9, 6.6 + h, yuk * 0.55, m.kursun)
      for (let i = 0; i <= 8; i++) kutu(0.08, h, 17.05, d.celik, X + dx - 4.3 + i * 1.075, 6.6 + h / 2, Z, kCati)
    }
    // Revak kubbeleri ve bacalar: doğu ve batı sırası
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      const z = Z - 8 + i * 4
      const x = X + s * 12.6
      disKubbe(kKubbe, x, 6.7, z, 1.6, 1.4, d.kursunKubbe, 18)
      if (i % 2 === 0) {
        kutu(0.8, 2.6, 0.8, m.tugla, x + s * 2.9, 7.6, z + 1.5, kCati)
        kutu(1, 0.2, 1, m.mermer, x + s * 2.9, 8.95, z + 1.5, kCati)
      }
    }
    // Taç kapı: kuzeyde sivri kemerli eyvan, tromplu kubbe
    kutu(7.6, 8.8, 3, d.tuglaDesen, X, 4.4, Z - DER - 0.4)
    kemerYuz(k, X, Z - DER - 1.9, KUZEY, 0, 0.05, 3.6, 3, 2, 0.02, m.koyu)
    kemerHalka(k, X, Z - DER - 1.9, KUZEY, 0, 0.05, 3.6, 3, 2, 0.32, 0, m.tugla)
    for (let i = 0; i < 16; i++) k.ekle(yer(kutuG(0.32, 0.32, 0.32).rotateY(Math.PI / 4), X - 3.6 + i * 0.48, 8.65, Z - DER - 1.9), m.tugla)
    kasnak(kKasnak, X, 8.8, 9.6, Z - DER - 0.4, 2.7, 8, d.almasikCami, m.tugla)
    disKubbe(kKubbe, X, 9.6, Z - DER - 0.4, 2.4, 2.1, d.kursunKubbe, 24)
    // Dershane: güneyde kubbeli eyvan
    kutu(10.6, 8.4, 10.6, d.almasikCami, X, 4.2, Z + DER + 5.2)
    pencereSirasi(X, Z + DER + 10.5, GUNEY, 10.6, 2, 1.6, 1.3, 1.9, 0.22, m.tugla, m.koyu)
    pencereSirasi(X + 5.3, Z + DER + 5.2, DOGU, 10.6, 2, 1.6, 1.3, 1.9, 0.22, m.tugla, m.koyu)
    pencereSirasi(X - 5.3, Z + DER + 5.2, BATI, 10.6, 2, 1.6, 1.3, 1.9, 0.22, m.tugla, m.koyu)
    kasnak(kKasnak, X, 8.3, 9.7, Z + DER + 5.2, 5.6, 8, d.almasikCami, m.tugla)
    disKubbe(kKubbe, X, 9.7, Z + DER + 5.2, 5.1, 4.2, d.kursunKubbe, 40)
    alem(kKubbe, X, 13.8, Z + DER + 5.2, m.bronz)
  }
  medrese()

  // --- İmaret: caminin kuzeydoğusunda, 13 × 40 m, kırma ahşap çatı, alaturka kiremit (s. 124) ---
  const imaret = () => {
    const X = 35, Z = -21, RY = -0.658 // uzun eksen fotoğraftaki gibi eğik
    const yerel = new Kova(), yerelCati = new Kova()
    const G = 13, L = 40, Y = 5.6
    yerel.ekle(yer(kutuG(G, Y, L), 0, Y / 2, 0), d.almasikCami)
    yerel.ekle(yer(kutuG(G + 0.4, 0.3, L + 0.4), 0, Y, 0), m.tugla)
    kirmaCati(yerelCati, -G / 2 - 0.5, G / 2 + 0.5, -L / 2 - 0.5, L / 2 + 0.5, Y + 0.1, 3.4, d.kiremit)
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
      const z = -L / 2 + (i + 0.5) * (L / 9)
      const ry = s > 0 ? DOGU : BATI
      kemerYuz(yerel, s * G / 2, z, ry, 0, 1.1, 1, 1.4, 0.5, 0.02, m.koyu)
      kemerHalka(yerel, s * G / 2, z, ry, 0, 1.1, 1, 1.4, 0.5, 0.2, 0, m.tugla)
      // Alınlıkta altıgen ve yıldız motifli tuğla süsleme
      yerel.ekle(yer(kutuG(1.5, 0.7, 0.04), s * (G / 2 + 0.03), 3.9, z), d.tuglaDesen)
    }
    // Giriş eyvanı
    yerel.ekle(yer(kutuG(4.5, 5.8, 1), G / 2 + 0.3, 2.9, 2), d.tuglaDesen)
    kemerYuz(yerel, G / 2 + 0.8, 2, DOGU, 0, 0.05, 2.2, 2.2, 1.3, 0.02, m.koyu)
    kemerHalka(yerel, G / 2 + 0.8, 2, DOGU, 0, 0.05, 2.2, 2.2, 1.3, 0.25, 0, m.tugla)
    // Yerel gövdeyi plan konumuna al: Kova malzemeye göre biriktirir, burada doğrudan döndürülür.
    const aktar = (grup: THREE.Group, kv: Kova) => {
      for (const c of grup.children) {
        const mesh = c as THREE.Mesh
        const g = mesh.geometry.clone().rotateY(RY).translate(X, 0, Z)
        kv.ekle(g, mesh.material as Mal)
        mesh.geometry.dispose()
      }
    }
    aktar(yerel.grup(), k)
    aktar(yerelCati.grup(), kCati)
  }
  imaret()

  // --- Hamam: medresenin batısında; soğukluk, sekizgen kasnak, kiremit kubbe ve aydınlık feneri (s. 126). Konum temsilî ---
  const hamam = () => {
    const X = -98, Z = -6
    kutu(14, 7.6, 14, d.almasikKaba, X, 3.8, Z)
    kutu(14.4, 0.25, 14.4, m.tugla, X, 7.6, Z)
    for (const [ry, xx, zz] of [[KUZEY, X, Z - 7], [DOGU, X + 7, Z], [BATI, X - 7, Z]] as const) {
      pencereSirasi(xx, zz, ry, 14, 3, 1.4, 1, 1.7, 0.2, m.tugla, m.koyu)
      pencereSirasi(xx, zz, ry, 14, 3, 4.8, 0.8, 1, 0.14, m.tugla, m.koyu)
    }
    // Kuzeyde sekiz basamak ve kapı saçağı
    for (let i = 0; i < 8; i++) kutu(4.4, 0.2 * (8 - i), 0.42, m.mermer, X, 0.1 * (8 - i), Z - 7.2 - i * 0.42)
    kirmaCati(kCati, X - 2.6, X + 2.6, Z - 9.4, Z - 7, 4.4, 1, d.kiremit)
    kirmaCati(kCati, X - 7.5, X + 7.5, Z - 7.5, Z + 7.5, 7.7, 2.4, d.kiremit)
    kKasnak.ekle(yer(duzGolge(silindirG(5.8, 5.8, 2.1, 8).rotateY(Math.PI / 8)), X, 10.2, Z), m.krem)
    disKubbe(kKubbe, X, 11.2, Z, 5.8, 2.5, d.kiremit, 8)
    // Fener
    kKubbe.ekle(yer(duzGolge(silindirG(1, 1.1, 1.4, 8)), X, 14.2, Z), m.tugla)
    disKubbe(kKubbe, X, 14.9, Z, 1.15, 0.8, d.kiremit, 8)
    // Sıcaklık bölümü: güneyde uzun gövde, küçük kubbeler
    kutu(11, 5.6, 19, d.almasikKaba, X, 2.8, Z + 16.5)
    kirmaCati(kCati, X - 5.8, X + 5.8, Z + 7, Z + 26.3, 5.6, 1.5, d.kiremit)
    for (const dz of [13, 21]) {
      kKasnak.ekle(yer(duzGolge(silindirG(2.3, 2.3, 1.1, 8).rotateY(Math.PI / 8)), X, 7.4, Z + dz), m.tugla)
      disKubbe(kKubbe, X, 8, Z + dz, 2.2, 1.6, d.kiremit, 12)
    }
  }
  hamam()

  // --- Türbeler ---
  type Plan = { x: number; z: number; a: number; n: 4 | 6 | 8; h: number; kasnakH?: number; R?: number; kubbeH?: number; mal?: Mal; acik?: boolean }
  const dome = (p: Plan, y: number, R: number) => {
    const H = p.kubbeH ?? R * 0.85
    disKubbe(kKubbe, p.x, y, p.z, R, H, d.kursunKubbe, 36)
    alem(kKubbe, p.x, y + H - 0.05, p.z, m.bronz, 0.8)
  }
  /** Çokgen veya kare gövdeli türbe: gövde, silme, pencere, kasnak, kurşun kubbe. */
  const turbe = (p: Plan) => {
    const mal = p.mal ?? d.almasikTurbe
    const y0 = 0.5
    kutu(p.a + 0.6, y0, p.a + 0.6, m.mermer, p.x, y0 / 2, p.z)
    const apo = p.a / 2
    if (p.n === 4) {
      kutu(p.a, p.h, p.a, mal, p.x, y0 + p.h / 2, p.z)
      for (const [ry, xx, zz] of [[KUZEY, p.x, p.z - apo], [GUNEY, p.x, p.z + apo], [DOGU, p.x + apo, p.z], [BATI, p.x - apo, p.z]] as const) {
        pencereSirasi(xx, zz, ry, p.a, 2, 1.1, 0.8, 1.2, 0.16, m.tugla, m.koyu)
        kemerYuz(k, xx, zz, ry, 0, p.h - 1.7, 0.7, 0.7, 0.4, 0.02, d.sebeke)
      }
      kirmaCati(kCati, p.x - apo - 0.3, p.x + apo + 0.3, p.z - apo - 0.3, p.z + apo + 0.3, y0 + p.h, 0.5, m.kursun)
    } else {
      const R = apo / Math.cos(Math.PI / p.n)
      k.ekle(yer(duzGolge(silindirG(R, R, p.h, p.n).rotateY(Math.PI / p.n)), p.x, y0 + p.h / 2, p.z), mal)
      for (let n = 0; n < p.n; n++) {
        const a = (n * Math.PI * 2) / p.n
        kemerYuz(k, p.x, p.z, a, 0, 1.2, 0.7, 1.1, 0.4, apo + 0.02, m.koyu)
        kemerHalka(k, p.x, p.z, a, 0, 1.2, 0.7, 1.1, 0.4, 0.15, apo, m.tugla)
        kemerYuz(k, p.x, p.z, a, 0, p.h - 1.7, 0.6, 0.6, 0.35, apo + 0.02, d.sebeke)
      }
    }
    const kH = p.kasnakH ?? 1.6
    const kR = p.R ?? apo * 0.9
    const ust = y0 + p.h
    kasnak(kKasnak, p.x, ust, ust + kH, p.z, kR / Math.cos(Math.PI / 8), p.n === 6 ? 6 : 8, mal, m.tugla)
    dome(p, ust + kH, kR * 0.96)
  }
  /** Dört ayaklı, üstü kemerli, etrafı açık baldaken türbe (Ebe Hatun). */
  const baldaken = (x: number, z: number, a: number, h: number, kaide: number) => {
    kutu(a + 0.8, kaide, a + 0.8, m.taskoyu, x, kaide / 2, z)
    const c = a / 2 - 0.39
    for (const s of [-1, 1]) for (const t of [-1, 1]) kutu(0.78, h, 0.78, d.almasikTurbe, x + s * c, kaide + h / 2, z + t * c)
    for (const [ry, xx, zz] of [[KUZEY, x, z - a / 2], [GUNEY, x, z + a / 2], [DOGU, x + a / 2, z], [BATI, x - a / 2, z]] as const) {
      const s = dikdortgen(-a / 2, kaide + h * 0.55, a / 2, kaide + h)
      const o = a / 2 - 0.78
      s.moveTo(-a / 2, kaide + h * 0.55)
      const delik = new THREE.Path()
      delik.moveTo(-o, kaide + h * 0.55 + 0.01); delik.quadraticCurveTo(-o, kaide + h * 0.8, 0, kaide + h - 0.15); delik.quadraticCurveTo(o, kaide + h * 0.8, o, kaide + h * 0.55 + 0.01); delik.closePath()
      s.holes.push(delik)
      k.ekle(yer(cikar(s, 0.5, -0.5), xx, 0, zz, ry), d.almasikTurbe)
    }
    kutu(a + 0.3, 0.2, a + 0.3, m.tugla, x, kaide + h + 0.05, z, kCati)
    disKubbe(kKubbe, x, kaide + h + 0.15, z, a * 0.42, a * 0.36, d.kursunKubbe, 24)
  }

  // II. Murad Türbesi: iç içe iki kare, sekizgen kasnak, açık kubbe; kuzeyde mermer taç kapı ve geniş ahşap saçak (s. 130-133)
  const muradTurbesi = () => {
    const X = -29.5, Z = 31.6, A = 13.45, IC = 6.9
    kutu(A + 0.8, 0.8, A + 0.8, m.mermer, X, 0.4, Z)
    kutu(A, 6.2, A, d.almasikTurbe, X, 3.9, Z)
    kutu(A + 0.5, 0.25, A + 0.5, m.tugla, X, 7, Z)
    kirmaCati(kCati, X - A / 2 - 0.3, X + A / 2 + 0.3, Z - A / 2 - 0.3, Z + A / 2 + 0.3, 7.1, 0.6, m.kursun)
    // Pencere düzeni: kapı duvarı ve karşısında ikişer, diğerlerinde üçer.
    pencereSirasi(X, Z - A / 2, KUZEY, A, 2, 1.8, 1.3, 1.8, 0.22, m.mermer, m.koyu)
    pencereSirasi(X, Z + A / 2, GUNEY, A, 2, 1.8, 1.3, 1.8, 0.22, m.mermer, m.koyu)
    pencereSirasi(X + A / 2, Z, DOGU, A, 3, 1.8, 1.3, 1.8, 0.22, m.mermer, m.koyu)
    pencereSirasi(X - A / 2, Z, BATI, A, 3, 1.8, 1.3, 1.8, 0.22, m.mermer, m.koyu)
    kutu(IC + 1.6, 3, IC + 1.6, d.almasikTurbe, X, 8.6, Z, kKasnak)
    kasnak(kKasnak, X, 10, 11.6, Z, (IC / 2 + 0.8) / Math.cos(Math.PI / 8), 8, d.almasikTurbe, m.tugla)
    for (let n = 0; n < 8; n++) kemerYuz(kKasnak, X, Z, n * Math.PI / 4, 0, 10.3, 0.8, 0.5, 0.4, IC / 2 + 0.82, d.sebeke)
    // Kubbe ortası açık (s. 131: "üstü açık")
    disKubbe(kKubbe, X, 11.7, Z, IC / 2 + 0.4, 3.4, d.kursunKubbe, 40, 0.75)
    kKubbe.ekle(new THREE.TorusGeometry(0.75, 0.1, 6, 20).rotateX(Math.PI / 2).translate(X, 14.96, Z), m.koyu)
    // Taç kapı ve saçak
    const pz = Z - A / 2 - 2
    kutu(5.6, 5.4, 4, m.mermer, X, 3.5, pz)
    kemerYuz(k, X, pz - 2, KUZEY, 0, 0.82, 2.8, 2, 1.4, 0.02, m.koyu)
    kemerHalka(k, X, pz - 2, KUZEY, 0, 0.82, 2.8, 2, 1.4, 0.26, 0, m.mermerKoyu)
    // Yuvarlatılmış köşeli ahşap saçak: alt yüz koyu kırmızı, üst yüz kurşun
    const S = new THREE.Shape()
    const w = 6.5, f0 = pz - 5, f1 = pz + 1.2
    S.moveTo(-w, -f1); S.lineTo(w, -f1); S.quadraticCurveTo(w + 1.5, -f1, w + 1.5, -(f1 + f0) / 2 - 1.4)
    S.quadraticCurveTo(w + 1.5, -f0, w - 1.5, -f0); S.lineTo(-w + 1.5, -f0); S.quadraticCurveTo(-w - 1.5, -f0, -w - 1.5, -(f1 + f0) / 2 - 1.4)
    S.quadraticCurveTo(-w - 1.5, -f1, -w, -f1); S.closePath()
    const sac = (y: number, kal: number, mal: Mal) => k.ekle(new THREE.ExtrudeGeometry(S, { depth: kal, bevelEnabled: false, curveSegments: 8 }).rotateX(-Math.PI / 2).translate(X, y, 0), mal)
    sac(6, 0.28, d.sacakAlti)
    sac(6.28, 0.14, m.kursun)
    for (let i = -6; i <= 6; i++) kutu(0.1, 0.1, 5.8, m.altinKoyu, X + i, 5.98, pz - 1.8)
  }
  muradTurbesi()

  // Şehzade Alâaddin: II. Murad'a bitişik, 7,25 × 7,80 m (s. 134)
  turbe({ x: -36.8, z: 44, a: 7.5, n: 4, h: 5.8, R: 3.1, kasnakH: 1.8, kubbeH: 2.8 })
  // Cem Sultan: altıgen, kurşun kubbe, tepesi küçük altıgen açıklık; mermer revak (s. 141-143)
  turbe({ x: -48, z: 45, a: 8.4, n: 6, h: 6.2, R: 3.6, kasnakH: 1.8, kubbeH: 3 })
  kutu(4.2, 4, 2.4, m.mermer, -48, 2.5, 45 - 5.2)
  kirmaCati(kCati, -48 - 2.5, -48 + 2.5, 45 - 6.8, 45 - 3.8, 4.5, 0.8, m.kursun)
  kemerYuz(k, -48, 45 - 6.4, KUZEY, 0, 0.5, 2, 1.5, 1, 0.02, m.koyu)
  // Fotoğraftan okunan büyük sekizgen türbe; hangi yapı olduğu temsilîdir.
  turbe({ x: -83, z: 38, a: 11, n: 8, h: 6.4, R: 4.7, kasnakH: 1.6, kubbeH: 3.7 })
  // Doğu sırasındaki küçük türbeler; biçim ve konum temsilî
  turbe({ x: 32.6, z: 27.9, a: 7, n: 8, h: 5, R: 3 })
  turbe({ x: 32, z: 16.5, a: 6, n: 8, h: 4.6, R: 2.5 })
  // Saraylılar (Cariyeler): sekiz ayaklı açık kubbeli, 6,65 m kenar (s. 138)
  turbe({ x: -60, z: 46, a: 8, n: 8, h: 5.2, R: 3.4 })
  baldaken(-21, 48, 4.46, 4.6, 1) // Ebe Hatun: 4,46 m kenar, 1 m kaide (s. 146)
  // Geri kalanlar: Gülruh, Gülşah, Hüma, Mükrime, Ahmed, Mahmud, Mustafa, Şirin içinden; konum temsilî
  turbe({ x: -12, z: 57, a: 8.5, n: 8, h: 5.6, R: 3.6 })
  turbe({ x: -28, z: 60, a: 7, n: 8, h: 5, R: 3 })
  turbe({ x: -46, z: 60, a: 9, n: 4, h: 5.6, R: 3.6, kasnakH: 1.8 })
  turbe({ x: -66, z: 60, a: 8.6, n: 8, h: 5.6, R: 3.6 })
  turbe({ x: 4, z: 61, a: 7.6, n: 8, h: 5.2, R: 3.2 })

  // --- Hazîre: çimen parseller ve taşlar (fotoğrafa göre; mezar yerleri temsilî) ---
  const r = (() => { let t = 11; return () => { t = (t * 16807) % 2147483647; return t / 2147483647 } })()
  const parsel = (x0: number, x1: number, z0: number, z1: number, tasli: boolean) => {
    kutu(x1 - x0, 0.04, z1 - z0, d.cimen, (x0 + x1) / 2, 0.03, (z0 + z1) / 2)
    if (!tasli) return
    for (let x = x0 + 1.5; x < x1 - 1; x += 2.2) for (let z = z0 + 1.5; z < z1 - 1; z += 3.4) {
      if (r() < 0.25) continue
      const h = 0.7 + r() * 0.9
      kutu(0.42, h, 0.14, m.mermer, x + r() * 0.3, h / 2, z + r() * 0.3)
      kutu(0.3, 0.1, 1.6, m.mermerKoyu, x, 0.06, z + 0.85)
    }
  }
  parsel(-4, 44, 37, 53, true)
  parsel(-23, -6, 37, 53, true)

  // Yollar ve meydanlar: taş döşeme (fotoğrafa göre kabaca; çimenin üstünde)
  const yol = (x0: number, x1: number, z0: number, z1: number) => kutu(x1 - x0, 0.03, z1 - z0, m.doseme, (x0 + x1) / 2, 0.035, (z0 + z1) / 2)
  yol(-118, 62, -33, -22) // kuzeydeki cadde
  yol(-18, 18, -22, -17) // cami önü
  yol(-21, -17, -22, 30) // caminin batısından türbelere
  yol(-44, -17, 18, 38) // II. Murad meydanı
  yol(-44, -32, 38, 66)
  yol(-90, -44, 28, 34) // türbeler arası
  yol(-70, -66, 17, 28)
  yol(-17, 40, 34, 37)
  yol(-90, -48, -20, -14) // medrese kuzeyi
  yol(-108, -90, -22, 24) // hamam çevresi

  // --- Ağaçlar: selvi ve yapraklı ağaçlar. Konumlar fotoğraftaki yoğunluğa göre temsilî ---
  const selvi = (x: number, z: number, boy: number) => {
    const p: [number, number][] = [[0.12, 0.8], [0.9, 1.5], [1.25, boy * 0.25], [1.35, boy * 0.4], [1.2, boy * 0.58], [0.9, boy * 0.75], [0.45, boy * 0.9], [0, boy]]
    k.ekle(yer(dondurG(p, 12), x, 0, z), m.selvi)
  }
  const agac = (x: number, z: number, R: number, mal: Mal) => {
    const topak = (ox: number, oy: number, oz: number, r0: number) => {
      const g = new THREE.IcosahedronGeometry(r0, 3)
      const poz = g.attributes.position, nor = g.attributes.normal
      for (let i = 0; i < poz.count; i++) {
        const a = poz.getX(i), b = poz.getY(i), c = poz.getZ(i)
        const o = 1 + 0.1 * Math.sin(a * 3.1 + x) * Math.sin(c * 2.3 + z) + 0.07 * Math.sin(b * 4.7 + x + z) + 0.05 * Math.sin(a * 7 + b * 6 + c * 5)
        const l = Math.hypot(a, b, c) || 1
        nor.setXYZ(i, a / l, b / l, c / l)
        poz.setXYZ(i, a * o, b * o * 0.9, c * o)
      }
      k.ekle(g.translate(x + ox, oy, z + oz), mal)
    }
    const y = R * 1.35
    topak(0, y, 0, R * 0.8)
    topak(R * 0.55, y - R * 0.25, R * 0.2, R * 0.55)
    topak(-R * 0.5, y - R * 0.2, -R * 0.3, R * 0.58)
    topak(R * 0.05, y - R * 0.3, -R * 0.6, R * 0.5)
    topak(-R * 0.15, y - R * 0.3, R * 0.6, R * 0.5)
    k.ekle(yer(silindirG(0.22, 0.38, R * 1.1, 7), x, R * 0.55, z), m.ahsap)
  }
  for (const [x, z, b] of [[24, -30, 15], [28, 16, 14], [20, 22, 16], [36, 8, 15], [40, 22, 17], [-24, -14, 14], [-18, 22, 15], [-20, 14, 13], [14, 30, 15], [6, 30, 17], [-6, 34, 14], [44, 35, 14], [-40, 24, 15], [-52, 22, 14], [-88, 18, 16], [-92, 44, 15], [-106, -22, 15], [12, -32, 14], [-40, -20, 15], [-8, -28, 13]] as const) selvi(x, z, b)
  for (const [x, z, R, mal] of [
    [-26, -12, 4.4, d.agacTuruncu], [-30, -2, 4.6, d.agacSari], [-46, -10, 5, d.agacTuruncu], [-42, 4, 4.4, d.agacYesil],
    [-40, 12, 5, d.agacTuruncu], [-10, -26, 5, d.agacSari], [26, -2, 5, d.agacYesil], [22, 10, 4.5, d.agacSari],
    [-34, 18, 4.4, d.agacYesil], [-54, 34, 6, d.agacSari], [-74, 26, 5, d.agacYesil], [-92, -26, 6, d.agacTuruncu],
    [-58, -20, 5.4, d.agacTuruncu], [-76, -26, 5, d.agacSari], [8, -26, 5, d.agacTuruncu], [52, 2, 6, d.agacSari],
  ] as const) agac(x, z, R, mal)
}
