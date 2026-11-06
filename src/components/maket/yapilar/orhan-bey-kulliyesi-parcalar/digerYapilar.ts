// Külliyenin ayakta kalan diğer yapıları ve çevre: yalnız dış kütle olarak.
// Emir Hanı ve Orhan Hamamı'nın plan ölçüleri envanterden; yerleri aradaki mesafe kısaltılarak temsilen konmuştur.
import * as THREE from 'three'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import { type Mal, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, yer } from '../../ulucamiParca'
import type { orhanMalzemeleri } from './dokular'
import { YerliKova, agac, disKasnak, duvar, kemerTaslari, kirpiSacak, kursunKubbe, ucgenG, yonla } from './ortak'

type O = ReturnType<typeof orhanMalzemeleri>

export function cevre(k: YerliKova, u: UlucamiMalzemeleri, o: O) {
  k.x = 0; k.z = 0
  const zemin = new THREE.CircleGeometry(64, 96).rotateX(-Math.PI / 2).translate(0, 0.012, 0)
  const p = zemin.attributes.position, uv = zemin.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.ekle(zemin, o.meydan)
  // Şadırvan bahçesi ve caminin güneyindeki çim
  const yama = (x: number, z: number, g: number, d: number) => {
    const b = kutuG(g, 0.14, d)
    k.ekle(yer(b, x, 0.07, z), o.cim)
    k.ekle(yer(kutuG(g + 0.3, 0.2, 0.25), x, 0.1, z - d / 2), u.mermerKoyu)
    k.ekle(yer(kutuG(g + 0.3, 0.2, 0.25), x, 0.1, z + d / 2), u.mermerKoyu)
    k.ekle(yer(kutuG(0.25, 0.2, d), x - g / 2, 0.1, z), u.mermerKoyu)
    k.ekle(yer(kutuG(0.25, 0.2, d), x + g / 2, 0.1, z), u.mermerKoyu)
  }
  yama(38, -19, 22, 13.5)
  yama(54, 5, 6, 20)
  yama(21, 26, 12, 8)
  // Temsilî ağaçlar: fotoğraflardaki çınarları anımsatır, konumları kesin değildir
  agac(k, o.govde, o.yaprak, 49, -23, 15, 4.6)
  agac(k, o.govde, o.yaprakSari, 27, -21, 16, 5.2)
  agac(k, o.govde, o.yaprak, 55, 14, 13, 4.2)
  agac(k, o.govde, o.yaprakSari, 20, 27, 15, 4.8)
  agac(k, o.govde, o.yaprak, 55, -6, 12, 3.8)
}

/** Emir Hanı: ~45 × 45 m, ~650 m² avlu, iki kat revak (envanter s. 214-215). */
export function emirHani(k: YerliKova, kCati: YerliKova, u: UlucamiMalzemeleri, o: O) {
  const X = -34, Z = 2
  for (const kv of [k, kCati]) { kv.x = X; kv.z = Z }
  const YAR = 22.5, AV = 12.75, H = 9.8, t = 1.1
  const kirpi = (yon: 'K' | 'G' | 'D' | 'B', s: number, a: number, b: number) => kirpiSacak(k, yon, s, a, b, H, u.tugla, u.koyu)
  for (const [yon, s] of [['K', -YAR], ['G', YAR], ['D', YAR], ['B', -YAR]] as const) {
    const pen = [-16, -11, -6, 6, 11, 16].flatMap((p) => [{ p, y0: 1.6, g: 0.9, duz: 1.35, kh: 0.01 }, { p, y0: 6, g: 0.9, duz: 1.35, kh: 0.01 }])
    const kapi = yon === 'K' ? [{ p: 0, y0: 0, g: 3.6, duz: 3, kh: 1.8 }] : []
    duvar(k, yon, s, -YAR, YAR, 0, H, t, u.tas, [...pen, ...kapi])
    for (const ac of pen) {
      const uyg = new THREE.PlaneGeometry(0.9, 1.35).translate(0, ac.y0 + 0.67, -0.4)
      k.ekle(yonla(uyg, yon, s, ac.p), u.koyu)
    }
    kirpi(yon, s, -YAR, YAR)
  }
  kemerTaslari(k, 'K', -YAR, { p: 0, y0: 0, g: 3.6, duz: 3, kh: 1.8 }, 0.42, 0.1, u.mermerKoyu, u.tugla, 8)
  // Kapı yanında kantar peykeleri (kaynakta anılır; biçim temsilî)
  for (const s of [-1, 1]) k.ekle(yer(kutuG(2.4, 0.7, 1), s * 3.3, 0.35, -YAR - 0.4), u.mermerKoyu)

  // Avluya bakan iki katlı sivri kemerli revak. Güney kanatta alt kemerler yarım daireye yakındır.
  const ADET = 7, adim = (AV * 2) / ADET
  for (const [yon, s] of [['G', -AV], ['K', AV], ['B', AV], ['D', -AV]] as const) {
    const ar: { p: number; y0: number; g: number; duz: number; kh: number }[] = []
    for (let i = 0; i < ADET; i++) {
      const p = -AV + (i + 0.5) * adim
      const yuvarlak = yon === 'G' && s === -AV
      ar.push({ p, y0: 0, g: adim - 0.9, duz: 2.2, kh: yuvarlak ? 1.2 : 1.6 })
      ar.push({ p, y0: 5.1, g: adim - 1.1, duz: 1.8, kh: 1.4 })
    }
    duvar(k, yon, s, -AV - 0.8, AV + 0.8, 0, H - 0.1, 0.9, u.tugla, ar)
    kirpiSacak(k, yon, s, -AV - 0.8, AV + 0.8, H - 0.05, u.tugla, u.koyu)
    // Taş ve tuğla ara kuşağı
    k.ekle(yonla(kutuG(AV * 2 + 1.6, 0.16, 0.08).translate(0, 4.8, 0.02), yon, s, 0), u.mermerKoyu)
    // Revak arkası: oda duvarı ve kat döşemesi
    k.ekle(yonla(kutuG(AV * 2 + 1.6, H - 0.2, 0.2).translate(0, (H - 0.2) / 2, -3.6), yon, s, 0), u.siva)
    k.ekle(yonla(kutuG(AV * 2 + 1.6, 0.25, 3.5).translate(0, 4.6, -1.75), yon, s, 0), u.koyu)
    for (let i = 0; i < ADET; i++) {
      const p = -AV + (i + 0.5) * adim
      k.ekle(yonla(new THREE.PlaneGeometry(1.5, 2.3).translate(0, 1.3, -3.48), yon, s, p), u.ceviz)
      k.ekle(yonla(new THREE.PlaneGeometry(1.2, 2).translate(0, 6.1, -3.48), yon, s, p), u.koyu)
    }
  }
  // Avlu: taş döşeme, ortada mermer şadırvan, ağaçlar
  k.ekle(yer(kutuG(AV * 2 + 1.6, 0.06, AV * 2 + 1.6), 0, 0.03, 0), u.mermerKoyu)
  k.ekle(yer(duzGolge(silindirG(2.6, 2.75, 0.7, 12)), 0, 0.4, 0), u.mermer)
  k.ekle(yer(silindirG(2.4, 2.4, 0.03, 18), 0, 0.73, 0), u.su)
  k.ekle(yer(dondurG([[0.45, 0], [0.12, 0.5], [0.5, 0.8], [0.08, 1], [0, 1.2]], 12), 0, 0.72, 0), u.mermer)
  for (const [ax, az] of [[-7, -7], [7, -6.5], [-6.5, 7.5], [7.5, 7]] as const) agac(k, o.govde, o.yaprak, ax, az, 11, 3.4)

  // Kuşaklı kurşun çatı: dış saçak, mahya ve avlu saçağı
  const yD = H + 0.1, yM = H + 2.5, R1 = YAR + 0.45, R2 = (YAR + AV) / 2, R3 = AV - 0.15
  const yuz = (a: number[], b: number[], c: number[], d: number[]) => kCati.ekle(ucgenG(a, b, c, d), u.kursun)
  for (let n = 0; n < 4; n++) {
    const yon = (r: number, y: number, s: number): number[] => {
      const c = [[s * r, -r], [r, s * r], [-s * r, r], [-r, -s * r]][n]
      return [c[0], y, c[1]]
    }
    yuz(yon(R1, yD, -1), yon(R1, yD, 1), yon(R2, yM, 1), yon(R2, yM, -1))
    yuz(yon(R2, yM, -1), yon(R2, yM, 1), yon(R3, yD, 1), yon(R3, yD, -1))
  }
  // Mahya üstünde bacalar (havadan fotoğrafta sıra sıra görünür)
  for (const [ax, az] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) for (let i = -2; i <= 2; i++) {
    const bx = ax ? ax * R2 : i * 6.5, bz = az ? az * R2 : i * 6.5
    kCati.ekle(yer(kutuG(0.8, 1.5, 0.8), bx, yM + 0.5, bz), u.tugla)
    kCati.ekle(yer(kutuG(1.05, 0.14, 1.05), bx, yM + 1.3, bz), u.koyu)
  }
}

/** Orhan Hamamı: çifte hamam, erkekler batıda, kadınlar doğuda; soğukluklar kuzeyde (envanter s. 207-213). */
export function orhanHamami(k: YerliKova, kCati: YerliKova, kKasnak: YerliKova, kKubbe: YerliKova, u: UlucamiMalzemeleri, o: O) {
  const X = 2, Z = -10
  for (const kv of [k, kCati, kKasnak, kKubbe]) { kv.x = X; kv.z = Z }
  const H = 6.2, al = u.altin
  // Kütle: batıda 14 m genişlikte erkekler, doğuda 12,4 m genişlikte kadınlar
  const W0 = -13.5, W1 = 0.5, E1 = 12.9, N = -15, S1 = 11, S2 = 3
  const yerles = (x0: number, x1: number, z0: number, z1: number, mal: Mal) =>
    k.ekle(yer(kutuG(x1 - x0, H, z1 - z0), (x0 + x1) / 2, H / 2, (z0 + z1) / 2), mal)
  yerles(W0, W1, N, S1, u.tas)
  yerles(W1, E1, N, S2, u.tas)
  const cephe = (yon: 'K' | 'G' | 'D' | 'B', s: number, a: number, b: number) => kirpiSacak(k, yon, s, a, b, H + 0.05, u.tugla, u.koyu)
  cephe('D', W1, S2, S1); cephe('G', S1, W0, W1); cephe('B', W0, N, S1); cephe('K', N, W0, E1); cephe('D', E1, N, S2); cephe('G', S2, W1, E1)
  // Küçük pencereler: doğu ve batı yüzlerde kare
  for (const z of [-11, -6, -1, 4, 8]) {
    k.ekle(yonla(new THREE.PlaneGeometry(0.9, 1.1).translate(0, 3.1, 0.02), 'B', W0, z), u.koyu)
  }
  for (const z of [-11, -6, -1]) k.ekle(yonla(new THREE.PlaneGeometry(0.9, 1.1).translate(0, 3.1, 0.02), 'D', E1, z), u.koyu)
  // Düz kurşun tavan
  const cati = new THREE.Shape()
  cati.moveTo(W0, -N); cati.lineTo(E1, -N); cati.lineTo(E1, -S2); cati.lineTo(W1, -S2); cati.lineTo(W1, -S1); cati.lineTo(W0, -S1); cati.closePath()
  kCati.ekle(new THREE.ShapeGeometry(cati).rotateX(-Math.PI / 2).translate(0, H + 0.03, 0), u.kursun)

  /** Kurşun kubbe, sekizgen veya yuvarlak üç sıra tuğla + bir sıra taş kasnak, fener. */
  const kubbe = (x: number, z: number, Rk: number, h: number, kh: number, yuvarlak = false) => {
    if (kh > 0) {
      if (yuvarlak) kKasnak.ekle(yer(silindirG(Rk, Rk, kh, 24), x, H + kh / 2, z), o.almasik)
      else disKasnak(kKasnak, o.almasik, u.koyu, x, z, H, H + kh, Rk)
    }
    kursunKubbe(kKubbe, u.kubbe, al, x, z, H + kh - 0.02, Rk * 0.88, h, 20)
    // Aydınlık feneri
    kKubbe.ekle(yer(silindirG(Rk * 0.1, Rk * 0.14, 0.42, 8), x, H + kh + h + 0.04, z), u.koyu)
  }
  const mx = (W0 + W1) / 2, kx = (W1 + E1) / 2
  kubbe(mx, -8, 7.3, 4.1, 2.6) // erkekler soğukluk, 11,95 × 11,86
  kubbe(kx, -8.8, 6.3, 3.6, 2.2) // kadınlar soğukluk, 10,35 × 10,35
  kubbe(mx, 1.1, 4, 2.3, 1, true) // erkekler ılıklık, yuvarlak kasnak
  kubbe(mx, 7.5, 3.6, 2.2, 0.7) // sıcaklık
  for (const [dx, dz] of [[-4.7, -2.7], [4.7, -2.7], [-4.7, 2.5], [4.7, 2.5]] as const) kubbe(mx + dx, 7.5 + dz, 1.9, 1.15, 0) // dört halvet
  kubbe(kx - 2.6, 1.3, 1.9, 1.15, 0) // kadınlar sıcaklık
  kubbe(kx + 2.6, 1.3, 1.9, 1.15, 0) // kadınlar halvet

  // Kuzeydeki özgün giriş: alınlıklı çıkma, tuğla kuşaklar, yuvarlak kemer; fotoğrafa göre
  const G = mx, EN = 8.6, DER = 3, UST = 7.4
  const gov = dikdortgen(-EN / 2, 0, EN / 2, UST - 0.8)
  gov.holes.push(kemer(new THREE.Path(), 0, 0, 4.1, 2.4, 2))
  const ond = cikar(gov, DER, -DER)
  k.ekle(yonla(ond, 'K', N - DER, G), o.almasik)
  kemerTaslari(k, 'K', N - DER, { p: G, y0: 0, g: 4.2, duz: 2.4, kh: 2 }, 0.48, 0.1, u.mermerKoyu, u.tugla, 9)
  // Kapı boşluğunun gerisi koyu
  k.ekle(yonla(new THREE.PlaneGeometry(4.2, 4.6).translate(0, 2.3, -DER + 0.1), 'K', N - DER, G), u.koyu)
  const uc = new THREE.Shape()
  uc.moveTo(-EN / 2 - 0.3, UST - 0.8); uc.lineTo(EN / 2 + 0.3, UST - 0.8); uc.lineTo(0, UST + 0.95); uc.closePath()
  k.ekle(yonla(cikar(uc, DER, -DER), 'K', N - DER, G), o.almasik)
  // Fener yerine yuvarlak dikine tuğla pencere (kaynakta kapının üstündedir)
  k.ekle(yonla(new THREE.CircleGeometry(0.5, 16).translate(0, UST - 0.4, 0.04), 'K', N - DER, G), u.tugla)
  // Alınlık kiremiti
  for (const s of [-1, 1]) {
    const x0 = G - s * (EN / 2 + 0.3), x1 = G
    kCati.ekle(ucgenG([x0, UST - 0.82, N - DER - 0.2], [x1, UST + 0.96, N - DER - 0.2], [x1, UST + 0.96, N + 0.05], [x0, UST - 0.82, N + 0.05]), u.kursun)
  }
}
