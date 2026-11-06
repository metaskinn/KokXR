// Hudâvendigâr Camii plan ölçüleri. Mekân ölçüleri envanterden (s. 84, 88, 89, 92, 93); yerleşim yayımlanmış
// plan çiziminden (Goodwin / Kuran) oranlanmıştır. Duvar kalınlıkları ve yükseklikler temsilîdir.
// Birim metre. Kuzey = -z, kıble (güney) = +z, doğu = +x.
import type { IcDurak, IcYurume, Kutu, ZeminAlani } from '../../ulucamiIc'

export interface Dik { x0: number; x1: number; z0: number; z1: number }
export const dik = (x0: number, x1: number, z0: number, z1: number): Dik => ({ x0, x1, z0, z1 })
const ort = (e: number, z0: number, z1: number) => dik(-e, e, z0, z1)
const iki = (x0: number, x1: number, z0: number, z1: number) => [dik(x0, x1, z0, z1), dik(-x1, -x0, z0, z1)]

// --- Düşey ölçüler ---
export const TABAN = 1 // şadırvanlı mekân döşemesi
export const MEDRESE_Y = 7.8 // üst kat döşemesi: 38 basamak x ~0.18 m
export const SACAK_Y = 14
export const GOZ_Y = TABAN + 1.75
export const HARIM_H = 1 // harim döşemesinin şadırvanlı mekândan farkı
export const EYVAN_H = 0.25
export const SOFA_H = 0.5 // son cemaat yeri yan sofaları
export const REVAK_H = MEDRESE_Y - TABAN

// --- Dış kütle ---
export const YARI_X = 15.1 // ön kütle yarı genişliği; revak iç boyu 28.65 m
export const ON_Z = -24 // kuzey cephe
export const REVAK_Z = -22.5, REVAK_ARKA = -18.9 // revak derinliği 3.6 m
export const ARKA_X = 7.75, GOVDE_Z = 9.9, ARKA_Z = 21.2 // harim kütlesi
export const APSIS_Z = 24.7, APSIS_X = 4.4

// --- Cephe bölümleri: altı destek, beş bölüm ---
export const AYAK_G = 2.1, UC_AYAK = 1.6, ACIKLIK = 3.72, BOLUM = 5.82
export const BOLUMLER = [-2, -1, 0, 1, 2].map((i) => i * BOLUM)
export const AYAKLAR = [-1.5, -0.5, 0.5, 1.5].map((i) => i * BOLUM)

// --- Mekânlar ---
export const SAD = ort(5.5, -6.9, 5.77) // 11.00 x 12.67 m
export const SAD_Z = (SAD.z0 + SAD.z1) / 2
export const HARIM = ort(4.75, 5.77, 18.4) // 9.50 x 12.50 m (basamaklar dahil)
export const NIS = ort(2.11, 18.4, 20.9) // 4.22 x 2.50 m
export const YESIK = { z0: -3.2, z1: 2.09, x0: 5.5, x1: 13 } // eyvan 5.29 x 7.49 m
export const GIRIS_HOL = ort(2.55, -16.9, -10.9)
export const DEHLIZ = ort(1.7, -10.9, -6.9)
export const KAPI = ort(1, REVAK_ARKA, -16.9)
export const MERDIVEN = { x0: 3.4, x1: 5.2, zUst: REVAK_ARKA, zAlt: -11.7, zSon: -10.9 }
export const MERDIVEN_KAPI = { x0: 2.55, x1: 3.4, z0: -12.3, z1: -10.9 }
export const BASAMAK = { x: 3, z0: 5.77, z1: 7.2 } // harim basamakları
export const MAHFIL = { x0: -12.9, x1: -8.1, z0: -0.4, z1: 2, h: 1.7, merdX0: -9.1, merdX1: -8.1, merdZ0: -3.1 }
export const MINBER = { x: -3.2, en: 1.5, z0: 11.6, z1: 16.6, h1: 3.3, zSon: 18.4 }

/** Yürünen alt kat alanları; bunların dışı duvardır. */
const yuruAlanlari: Dik[] = [
  ort(14.3, -23, REVAK_ARKA), KAPI, GIRIS_HOL, DEHLIZ, SAD, HARIM, ort(2.11, 18.4, 19.6),
  ...iki(YESIK.x0, YESIK.x1, YESIK.z0, YESIK.z1),
  ...iki(MERDIVEN_KAPI.x0, MERDIVEN_KAPI.x1, MERDIVEN_KAPI.z0, MERDIVEN_KAPI.z1),
  ...iki(MERDIVEN.x0, MERDIVEN.x1, MERDIVEN.zUst, MERDIVEN.zSon),
]

/** Kapısı kapalı tabhane odaları: yalnız "Parçala" görünümünde mekân olarak görünür, içine girilmez. */
const odalar: Dik[] = [
  ...iki(7.2, 13, 3.5, 7.5), // güney: tedrisat odaları
  ...iki(7.2, 13, -10.7, -4.4), // kuzey: zaviye bölmeleri
  ...iki(6.3, 13, -16.7, -12.3),
]

/** Alt kat duvar kütlesi hesabındaki boşluklar. */
export const altBosluklar: Dik[] = [
  KAPI, GIRIS_HOL, DEHLIZ, SAD, HARIM, NIS,
  ...iki(YESIK.x0, YESIK.x1, YESIK.z0, YESIK.z1),
  ...iki(MERDIVEN_KAPI.x0, MERDIVEN_KAPI.x1, MERDIVEN_KAPI.z0, MERDIVEN_KAPI.z1),
  ...iki(MERDIVEN.x0, MERDIVEN.x1, MERDIVEN.zUst, MERDIVEN.zSon),
  ...odalar,
]

/** Medrese katı: n planlı koridor (3.5 m), iki yanda altışar hücre, öndeki büyük odalar, harimi saran dar dehliz. */
const hucreler: Dik[] = []
for (let i = 0; i < 6; i++) {
  const z = -11 + i * 3
  hucreler.push(...iki(11, 14.3, z, z + 2.4), ...iki(10.3, 11, z + 0.75, z + 1.65))
}
export const ustBosluklar: Dik[] = [
  SAD, HARIM,
  ...iki(MERDIVEN.x0, MERDIVEN.x1, REVAK_ARKA, -15),
  ort(2.55, -17.4, -12.4), ort(1, -12.4, -11.9),
  ort(10.3, -11.9, -8.4), // n'nin kuzey kolu
  ...iki(6.8, 10.3, -11.9, 9.4), // yan kollar
  ...hucreler,
  ...iki(5.9, 6.9, 9.4, 19.8), ort(6.9, 19.3, 20.1), // harimi saran 80 cm'lik dehliz
  ...iki(6, 8, -17.8, -12.6), ...iki(8, 14.3, -17.8, -15.4), ...iki(8, 14.3, -15, -12.6), ...iki(7, 8, -12.6, -11.9),
]

/** Döşeme boşlukları: kubbeli mekân, tonozlu harim, merdivenler. */
export const dosemeBosluklari: Dik[] = [SAD, HARIM, ...iki(MERDIVEN.x0, MERDIVEN.x1, REVAK_ARKA, -13.5)]

/** Boşlukların tümleyeni: dikdörtgen kütlelere ayrılmış, komşular birleştirilmiş. */
export function tumleyen(alan: Dik, bosluklar: Dik[]): Dik[] {
  const xs = [...new Set([alan.x0, alan.x1, ...bosluklar.flatMap((b) => [b.x0, b.x1]).filter((v) => v > alan.x0 && v < alan.x1)])].sort((a, b) => a - b)
  const zs = [...new Set([alan.z0, alan.z1, ...bosluklar.flatMap((b) => [b.z0, b.z1]).filter((v) => v > alan.z0 && v < alan.z1)])].sort((a, b) => a - b)
  const bos = (x: number, z: number) => bosluklar.some((b) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1)
  const sonuc: Dik[] = []
  const acik = new Map<string, Dik>()
  for (let j = 0; j < zs.length - 1; j++) {
    const yeni = new Map<string, Dik>()
    let i = 0
    while (i < xs.length - 1) {
      if (bos((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) { i++; continue }
      let s = i + 1
      while (s < xs.length - 1 && !bos((xs[s] + xs[s + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) s++
      const k = `${xs[i]}:${xs[s]}`
      const onceki = acik.get(k)
      if (onceki) { onceki.z1 = zs[j + 1]; yeni.set(k, onceki); acik.delete(k) }
      else yeni.set(k, dik(xs[i], xs[s], zs[j], zs[j + 1]))
      i = s
    }
    sonuc.push(...acik.values())
    acik.clear()
    for (const [k, v] of yeni) acik.set(k, v)
  }
  sonuc.push(...acik.values())
  return sonuc
}

export const altKutleler = () => [
  ...tumleyen(dik(-YARI_X, YARI_X, REVAK_ARKA, GOVDE_Z), altBosluklar),
  ...tumleyen(dik(-ARKA_X, ARKA_X, GOVDE_Z, ARKA_Z), altBosluklar),
]
export const ustKutleler = () => [
  ...tumleyen(dik(-YARI_X, YARI_X, REVAK_ARKA, GOVDE_Z), ustBosluklar),
  ...tumleyen(dik(-ARKA_X, ARKA_X, GOVDE_Z, ARKA_Z), ustBosluklar),
]
export const dosemeler = () => [
  ...tumleyen(dik(-YARI_X, YARI_X, REVAK_ARKA, GOVDE_Z), dosemeBosluklari),
  ...tumleyen(dik(-ARKA_X, ARKA_X, GOVDE_Z, ARKA_Z), dosemeBosluklari),
]

export function yurumeAlani(): IcYurume {
  const sinir: Kutu = { x0: -14.3, x1: 14.3, z0: -23, z1: 19.6 }
  const duvarlar: Kutu[] = tumleyen(sinir, yuruAlanlari)
  const ayaklar: Kutu[] = AYAKLAR.map((x) => dik(x - AYAK_G / 2, x + AYAK_G / 2, -23, REVAK_Z))
  const engeller: Kutu[] = [
    ...ayaklar,
    dik(-14.3, -13.5, -23, REVAK_Z), dik(13.5, 14.3, -23, REVAK_Z),
    // Basamak yanlarındaki mermer korkuluk ve pabuçluk
    dik(BASAMAK.x, 4.75, BASAMAK.z0, 7.25), dik(-4.75, -BASAMAK.x, BASAMAK.z0, 7.25),
    // Dolaplar
    dik(3.35, 4.75, 7.25, 8.2), dik(-4.75, -3.35, 7.25, 8.2),
    // Minber: köşk ve kapı sövesi; kürsü
    dik(MINBER.x - MINBER.en / 2 - 0.1, MINBER.x + MINBER.en / 2 + 0.1, MINBER.z1, MINBER.zSon),
    dik(MINBER.x - MINBER.en / 2 - 0.1, MINBER.x - MINBER.en / 2 + 0.03, MINBER.z0 - 0.5, MINBER.z0),
    dik(MINBER.x + MINBER.en / 2 - 0.03, MINBER.x + MINBER.en / 2 + 0.1, MINBER.z0 - 0.5, MINBER.z0),
    dik(2.6, 3.8, 15.2, 16.4),
  ]
  const zeminler: ZeminAlani[] = [
    { x0: -BASAMAK.x, x1: BASAMAK.x, z0: BASAMAK.z0, z1: BASAMAK.z1, h0: 0, h1: HARIM_H },
    { x0: -4.75, x1: 4.75, z0: BASAMAK.z1, z1: 19.6, h0: HARIM_H, h1: HARIM_H },
    { x0: YESIK.x0, x1: YESIK.x1, z0: YESIK.z0, z1: YESIK.z1, h0: EYVAN_H, h1: EYVAN_H },
    { x0: -YESIK.x1, x1: -YESIK.x0, z0: YESIK.z0, z1: YESIK.z1, h0: EYVAN_H, h1: EYVAN_H },
    // Son cemaat yeri yan sofaları
    { x0: 2.91, x1: 14.3, z0: -23, z1: REVAK_ARKA, h0: SOFA_H, h1: SOFA_H },
    { x0: -14.3, x1: -2.91, z0: -23, z1: REVAK_ARKA, h0: SOFA_H, h1: SOFA_H },
    // Medrese revağı: alttan geçilir
    { x0: -14.3, x1: 14.3, z0: -23, z1: REVAK_ARKA, h0: REVAK_H, h1: REVAK_H, altGecilir: true },
    // Duvar kalınlığındaki merdivenler: güneyden kuzeye çıkar
    { x0: MERDIVEN.x0, x1: MERDIVEN.x1, z0: MERDIVEN.zUst, z1: MERDIVEN.zAlt, h0: REVAK_H, h1: 0 },
    { x0: -MERDIVEN.x1, x1: -MERDIVEN.x0, z0: MERDIVEN.zUst, z1: MERDIVEN.zAlt, h0: REVAK_H, h1: 0 },
    // Müezzin mahfili
    { x0: MAHFIL.merdX0, x1: MAHFIL.merdX1, z0: MAHFIL.merdZ0, z1: MAHFIL.z0, h0: EYVAN_H, h1: MAHFIL.h },
    { x0: MAHFIL.x0, x1: MAHFIL.x1, z0: MAHFIL.z0, z1: MAHFIL.z1, h0: MAHFIL.h, h1: MAHFIL.h },
    // Minber merdiveni
    { x0: MINBER.x - MINBER.en / 2, x1: MINBER.x + MINBER.en / 2, z0: MINBER.z0, z1: MINBER.z1, h0: HARIM_H, h1: MINBER.h1 },
  ]
  return {
    sinir, kutular: [...duvarlar, ...engeller],
    daireler: [{ x: 0, z: SAD_Z, r: 1.75 }],
    zeminler, gorusKesenler: duvarlar, gozY: GOZ_Y, tabanY: TABAN,
  }
}

const minberH = (z: number) => HARIM_H + (MINBER.h1 - HARIM_H) * ((z - MINBER.z0) / (MINBER.z1 - MINBER.z0))
export const duraklar: IcDurak[] = [
  { id: 'revak', ad: 'Son cemaat yeri', konum: [0, GOZ_Y, -20.8], bak: [11, 3.4, -20.8] },
  { id: 'giris', ad: 'Giriş', konum: [0, GOZ_Y, -14], bak: [0, 3.2, 8] },
  { id: 'sadirvan', ad: 'Şadırvan', konum: [3.4, GOZ_Y, -5], bak: [0, 1.8, SAD_Z] },
  { id: 'kubbe', ad: 'Kubbe', konum: [-2.6, GOZ_Y, SAD_Z - 2], bak: [0, 16, SAD_Z] },
  { id: 'eyvan', ad: 'Doğu eyvanı', konum: [7, GOZ_Y + EYVAN_H, -2.1], bak: [12, 3.6, 1.6] },
  { id: 'harim', ad: 'Harim', konum: [0, GOZ_Y + HARIM_H, 8.6], bak: [0, 5.6, 20] },
  { id: 'mihrap', ad: 'Mihrap', konum: [0, GOZ_Y + HARIM_H, 15], bak: [0, 5.4, 20.5] },
  { id: 'mahfil-ust', ad: 'Mahfile çık', konum: [-10.4, GOZ_Y + MAHFIL.h, 0.9], bak: [0, 4.4, 0] },
  { id: 'minber-ust', ad: 'Minbere çık', konum: [MINBER.x, GOZ_Y + minberH(15.4), 15.4], bak: [3, 4.6, 8] },
  { id: 'medrese', ad: 'Medrese revağı', konum: [0, GOZ_Y + REVAK_H, -20.7], bak: [-13, 9.6, -23.8] },
]
