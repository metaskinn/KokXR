// Orhan Bey Külliyesi temsilî maketi. Plan ölçüleri Vakıf Eserleri Envanteri'nden (Bursa 1, s. 191-204, 207-215):
// son cemaat yeri 25,80 × 6,30 m, harim orta mekânı 8,90 × 9,90 m, tabhaneler 6,05 × 9,10 m, mihraplı bölüm 9,64 × 8,83 m.
// Duvar, kubbe ve minare yükseklikleri ile yerleşim fotoğraflara bakılarak oranlanmıştır; gerçek 3B tarama değildir.
// Birim metre. Kuzey -z, kıble +z, doğu +x. Cami yerel koordinatta çizilir, YER ile kaideye yerleşir.
import * as THREE from 'three'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import type { IcDurak, IcYurume, Kutu, ZeminAlani } from '../ulucamiIc'
import type { Maket } from '../ulucamiMaket'
import { type Mal, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, yer } from '../ulucamiParca'
import { emirHani, orhanHamami, cevre } from './orhan-bey-kulliyesi-parcalar/digerYapilar'
import { orhanMalzemeleri } from './orhan-bey-kulliyesi-parcalar/dokular'
import {
  type Acik, type Yon, YerliKova, disKasnak, duvar, gecisG, icKubbe, kemerDuzlem, kemerTaslari, kirpiSacak, kursunKubbe, yonla,
} from './orhan-bey-kulliyesi-parcalar/ortak'

const YER = { x: 38, z: 6 }

// Plan aksları: kaynaktaki iç ölçüler korunur, duvar ve paye kalınlıkları fotoğraftan oranlanmıştır.
const N0 = -17.2, N1 = -16.1, N2 = -9.8, R0 = -8.8, G1 = -4.8, C0 = -3.8, C1 = 6.1, M0 = 7.3, M1 = 16.13, S1 = 17.3, T0 = -3.2, T1 = 5.9, TS = 6.9
const CX = 4.45, PX = 5.35, TX = 11.4, BX = 12.4, NX = 12.9, MX = 4.82, MB = 6.1
const H = 9.5, NH = 8.6, TABAN = 0.4, TABHANE = 0.5, MIHRAP = 0.8
const GOZ_Y = TABAN + 1.65
const MINBER = { x0: -4.75, x1: -3.05, z0: 11, z1: 14.8, tepe: 2.4 }

const dur = (id: string, ad: string, k: [number, number, number], b: [number, number, number]): IcDurak =>
  ({ id, ad, konum: [k[0] + YER.x, k[1], k[2] + YER.z], bak: [b[0] + YER.x, b[1], b[2] + YER.z] })

const minberEgim = (z: number) => MIHRAP + ((z - MINBER.z0) / (MINBER.z1 - MINBER.z0)) * MINBER.tepe

const duraklar: IcDurak[] = [
  dur('revak', 'Son cemaat yeri', [0, GOZ_Y, -14.6], [0, 3.4, -9.8]),
  dur('giris', 'Giriş holü', [0, GOZ_Y, -6.9], [0, 3, 2]),
  dur('orta', 'Orta mekân', [0, GOZ_Y, -1.6], [0, 6.2, 12]),
  dur('tabhane', 'Doğu tabhanesi', [7.6, GOZ_Y + TABHANE, 1.3], [TX, 3.1, 1.3]),
  dur('kubbe', 'Kubbe', [0, GOZ_Y, 1.2], [0, 16, 1.5]),
  dur('mihrap', 'Mihrap', [0, GOZ_Y + MIHRAP, 9.4], [0, 4.2, M1]),
  dur('minber', 'Minber', [-1.4, GOZ_Y + MIHRAP, 9.2], [-3.9, 3.2, 13.5]),
  dur('minber-ust', 'Minbere çık', [-3.9, GOZ_Y + minberEgim(13.4), 13.4], [1.5, 4, 9]),
]

function yurumeAlani(): IcYurume {
  const k = (x0: number, x1: number, z0: number, z1: number, ust?: number): Kutu =>
    ({ x0: x0 + YER.x, x1: x1 + YER.x, z0: z0 + YER.z, z1: z1 + YER.z, ust })
  const ayna = (x0: number, x1: number, z0: number, z1: number) => [k(x0, x1, z0, z1), k(-x1, -x0, z0, z1)]
  const kutular: Kutu[] = [
    // Son cemaat yerinin 90 cm yüksek, parmaklıklı yan sofaları
    ...ayna(2.2, TX, N1, N2),
    // Revakla hol arasındaki duvar; kapı ortada
    ...ayna(0.9, TX, N2, R0),
    // Hol yanındaki odalar ve kuzey kütlesi
    ...ayna(1.9, TX, R0, G1),
    ...ayna(1, TX, G1, C0),
    ...ayna(CX, TX, C0, T0),
    // Doğu-batı kemerlerinin ayakları
    ...ayna(CX, PX, T0, -2.4),
    ...ayna(CX, PX, 4.9, C1),
    // Tabhane güneyi ve mihraplı bölüm yan kütleleri
    ...ayna(PX, TX, T1, C1),
    ...ayna(3.9, TX, C1, M0),
    ...ayna(MX, TX, M0, M1),
    // Sakıflar
    ...ayna(1.25, CX, C0, -2.4),
    // Minber: yan korkuluklar ve köşk; aradaki merdivenden yürünür
    k(MINBER.x0, MINBER.x0 + 0.12, MINBER.z0, M1), k(MINBER.x1 - 0.12, MINBER.x1, MINBER.z0, M1),
    k(MINBER.x0, MINBER.x1, MINBER.z1, M1),
    // Kürsü
    k(-MX, -3.75, 7.6, 9.2),
    // Mihrap ve şamdanlar
    k(-2, 2, M1 - 0.5, M1),
  ]
  const zeminler: ZeminAlani[] = [
    // Tabhaneler: birer basamakla çıkılır
    { x0: YER.x + PX - 0.3, x1: YER.x + TX, z0: YER.z - 2.4, z1: YER.z + T1, h0: TABHANE, h1: TABHANE },
    { x0: YER.x - TX, x1: YER.x - PX + 0.3, z0: YER.z - 2.4, z1: YER.z + T1, h0: TABHANE, h1: TABHANE },
    // Dört basamaklı mermer merdiven ve mihraplı bölüm
    { x0: YER.x - CX, x1: YER.x + CX, z0: YER.z + 4.9, z1: YER.z + C1, h0: 0, h1: MIHRAP },
    { x0: YER.x - MX, x1: YER.x + MX, z0: YER.z + C1, z1: YER.z + M1, h0: MIHRAP, h1: MIHRAP },
    // Minber merdiveni
    { x0: YER.x + MINBER.x0 + 0.12, x1: YER.x + MINBER.x1 - 0.12, z0: YER.z + MINBER.z0, z1: YER.z + MINBER.z1, h0: MIHRAP, h1: MIHRAP + MINBER.tepe },
  ]
  return {
    sinir: { x0: YER.x - TX, x1: YER.x + TX, z0: YER.z + N1, z1: YER.z + M1 },
    kutular,
    daireler: [],
    zeminler,
    gorusKesenler: [k(1, TX, R0, C0), k(-TX, -1, R0, C0), k(CX, PX, T0, -2.4), k(CX, PX, 4.9, C1), k(-PX, -CX, T0, -2.4), k(-PX, -CX, 4.9, C1)],
    gozY: GOZ_Y,
    tabanY: TABAN,
  }
}

export const yapi = (): Maket => {
  const u = ulucamiMalzemeleri()
  const o = orhanMalzemeleri()
  // Kurşun bugünkü fotoğraflarda gri-mavidir; Ulu Camii dokusu daha açık tonda kalır.
  const kubbeMal = u.kubbe.clone(), kursunMal = u.kursun.clone()
  kubbeMal.color.set('#a4adb6'); kursunMal.color.set('#a0a8ae')
  const k = new YerliKova(), kCati = new YerliKova(), kKasnak = new YerliKova(), kKubbe = new YerliKova()

  // --- Zemin ve komşu yapılar ---
  cevre(k, u, o)
  emirHani(k, kCati, u, o)
  orhanHamami(k, kCati, kKasnak, kKubbe, u, o)
  for (const kv of [k, kCati, kKasnak, kKubbe]) { kv.x = YER.x; kv.z = YER.z }

  const kutu = (g: number, h: number, d: number, mal: Mal, x: number, y: number, z: number, kv = k) => kv.ekle(yer(kutuG(g, h, d), x, y, z), mal)

  // --- Oturtma ve döşemeler ---
  kutu(NX * 2 + 0.6, TABAN, S1 - N0 + 0.6, u.mermerKoyu, 0, TABAN / 2, (S1 + N0) / 2)
  const hali = (x0: number, x1: number, z0: number, z1: number, y: number, ters = false) => {
    const g = ters ? kutuG(z1 - z0, 0.04, x1 - x0).rotateY(Math.PI / 2) : kutuG(x1 - x0, 0.04, z1 - z0)
    k.ekle(yer(g, (x0 + x1) / 2, y - 0.02, (z0 + z1) / 2), o.hali)
  }
  kutu(4.4, 0.02, N2 - N1, u.mermerDoseme, 0, TABAN + 0.005, (N1 + N2) / 2)
  kutu(3.8, 0.02, G1 - R0, u.mermerDoseme, 0, TABAN + 0.005, (R0 + G1) / 2)
  kutu(2, 0.02, 1, u.mermerDoseme, 0, TABAN + 0.005, (R0 + N2) / 2)
  kutu(2, 0.02, 1, u.mermerDoseme, 0, TABAN + 0.005, (G1 + C0) / 2)
  hali(-CX, CX, C0, 4.9, TABAN + 0.03)
  kutu(1.8, 0.02, 0.05, u.mermerDoseme, 0, TABAN + 0.01, C0)
  for (const s of [-1, 1]) {
    // Tabhane sekisi: bir basamak yüksek, turkuaz halılı, ahşap kenarlı
    kutu(TX - PX + 1, TABHANE, T1 - T0, u.mermerKoyu, s * (TX + PX - 1) / 2, TABAN + TABHANE / 2, (T0 + T1) / 2)
    hali(s > 0 ? PX - 0.6 : -TX, s > 0 ? TX : -PX + 0.6, T0, T1, TABAN + TABHANE + 0.03, true)
    kutu(0.08, 0.16, 7.3, u.ahsap, s * (PX - 0.6), TABAN + TABHANE - 0.08, 1.25)
  }
  // Dört basamak ve mihrap döşemesi
  for (let i = 0; i < 4; i++) {
    const y = ((i + 1) / 4) * MIHRAP
    kutu(CX * 2, y, C1 - 4.9 - i * 0.3, u.icMermer, 0, TABAN + y / 2, C1 - (C1 - 4.9 - i * 0.3) / 2)
  }
  kutu(MX * 2, MIHRAP, M1 - C1, u.mermerKoyu, 0, TABAN + MIHRAP / 2, (C1 + M1) / 2)
  hali(-MX, MX, C1 + 0.02, M1, TABAN + MIHRAP + 0.03)

  // --- Duvarlar ---
  const a = o.almasik
  const tasKemer = (yon: Yon, sabit: number, ac: Acik, en = 0.34, cik = 0.1) => kemerTaslari(k, yon, sabit, ac, en, cik, u.mermerKoyu, u.tugla, 9)
  /** Sivri kemerli silme: zeminden saçağa yükselir, içindeki pencereler taşıyıcı duvardadır. */
  const silme = (yon: Yon, sabit: number, p: number, g: number) => tasKemer(yon, sabit, { p, y0: 0.2, g, duz: H - 3.2, kh: 2.1 }, 0.2, 0.09)

  /** Pencere çifti: dış duvar + iç sıva boşluğu, dış ve iç düzlem. */
  const altPencere = (yon: Yon, sabit: number, p: number, y0: number, t: number, g = 1.05): Acik => {
    const ac = { p, y0, g, duz: 1.25, kh: 0.72 }
    kemerDuzlem(k, yon, sabit, ac, 0.3, o.pencereDis)
    kemerDuzlem(k, yon, sabit, ac, t - 0.1, o.pencereIc)
    return ac
  }
  const ustPencere = (yon: Yon, sabit: number, p: number, y0: number, t: number, g = 0.95): Acik => {
    const ac = { p, y0, g, duz: 1.25, kh: 0.52 }
    kemerDuzlem(k, yon, sabit, ac, 0.3, o.sebekeDis)
    kemerDuzlem(k, yon, sabit, ac, t - 0.1, o.sebekeIc)
    return ac
  }
  /** Yalnız dıştan görülen pencere: arkası dolu odaya bakar. */
  const kapaliPencere = (yon: Yon, sabit: number, p: number, y0: number, ust: boolean) => {
    const ac = { p, y0, g: ust ? 0.95 : 1.05, duz: 1.25, kh: ust ? 0.52 : 0.72 }
    kemerDuzlem(k, yon, sabit, ac, -0.02, ust ? o.sebekeDis : o.pencereDis)
    tasKemer(yon, sabit, { ...ac, g: ac.g + 0.12 }, 0.16, 0.05)
  }

  // Doğu ve batı beden duvarları: iki silme tabhaneye, biri kuzey odaya
  for (const [yon, s] of [['D', 1], ['B', -1]] as const) {
    const x = s * BX
    const pS = 1.35 + 2.3, pK = 1.35 - 2.3
    const ac: Acik[] = [altPencere(yon, x, pS, TABAN + 1.3, 1), altPencere(yon, x, pK, TABAN + 1.3, 1), ustPencere(yon, x, 1.35, 4.8, 1)]
    duvar(k, yon, x, R0, TS, 0, H, 1, a, ac)
    duvar(k, yon, s * (TX + 0.02), T0, T1, TABAN, H, 0.05, o.siva, ac.map((b) => ({ ...b })))
    silme(yon, x, pS, 3.7)
    silme(yon, x, pK, 3.7)
    silme(yon, x, -6.1, 3.7)
    kapaliPencere(yon, x, -6.1, TABAN + 1.3, false)
    kapaliPencere(yon, x, -6.1, 4.8, true)
    kirpiSacak(k, yon, x, R0, TS, H, u.tugla, u.koyu)

    // Tabhane güney duvarı
    const pT = s * (BX + MB) / 2
    const acT = [altPencere('G', TS, pT - 1.3, TABAN + 1.3, 1), altPencere('G', TS, pT + 1.3, TABAN + 1.3, 1)]
    duvar(k, 'G', TS, Math.min(s * MB, s * BX), Math.max(s * MB, s * BX), 0, H, 1, a, acT)
    duvar(k, 'G', T1 + 0.02, Math.min(s * PX, s * TX), Math.max(s * PX, s * TX), TABAN, H, 0.05, o.siva, acT)
    silme('G', TS, pT - 1.5, 2.9)
    silme('G', TS, pT + 1.5, 2.9)
    kirpiSacak(k, 'G', TS, Math.min(s * MB, s * BX), Math.max(s * MB, s * BX), H, u.tugla, u.koyu)

    // Kuzey kütlesi: yan odalar dıştan görünür, içi modellenmez. Holü ve tabhane kuzey yüzünü sıva kaplar.
    kutu(BX - 0.8 - PX, H - 0.05, T0 - R0, o.siva, s * (BX - 0.8 + PX) / 2, (H - 0.05) / 2, (R0 + T0) / 2)
    kutu(PX - 1.9, H - 0.05, G1 - R0, o.siva, s * (PX + 1.9) / 2, (H - 0.05) / 2, (R0 + G1) / 2)

    // Mihraplı bölüm yan duvarı: kaynakta altlı üstlü ikişer pencere
    const xM = s * MB, mp = [(M0 + M1) / 2 - 2.1, (M0 + M1) / 2 + 2.1]
    const acM = mp.flatMap((p) => [altPencere(yon, xM, p, TABAN + MIHRAP + 0.45, 1.28), ustPencere(yon, xM, p, 4.75, 1.28)])
    duvar(k, yon, xM, TS, S1, 0, H, 1.2, a, acM)
    duvar(k, yon, s * (MX + 0.03), M0, M1, TABAN + MIHRAP, H, 0.05, o.siva, acM)
    for (const p of mp) silme(yon, xM, p, 3.5)
    kirpiSacak(k, yon, xM, TS, S1, H, u.tugla, u.koyu)

    // Doğu-batı kemerleri: orta mekânla tabhaneyi ayıran payeler
    const kemerAc = { p: 1.25, y0: TABAN, g: 7.3, duz: 4.2, kh: 2.8 }
    duvar(k, yon, s * PX, C0, C1, 0, H, 0.9, o.siva, [kemerAc])
    for (const [z0, z1] of [[C0, -2.4], [4.9, C1]]) {
      k.ekle(yer(kutuG(PX - CX + 0.06, 4.1, z1 - z0 + 0.02), s * (PX + CX) / 2, TABAN + 2.05, (z0 + z1) / 2), u.tas)
      kutu(PX - CX + 0.14, 0.18, z1 - z0 + 0.1, o.siva, s * (PX + CX) / 2, TABAN + 4.17, (z0 + z1) / 2)
    }
  }

  // Son cemaat yerinin ön yüzü ve mihrap duvarı; ortak yardımcı dışında kalanlar
  const SEFE = 4.8, ACIKLIK = 3.84
  const onAc: Acik[] = [-2, -1, 0, 1, 2].map((n) => ({ p: n * SEFE, y0: 0, g: ACIKLIK, duz: 3.6, kh: 2.5 }))
  duvar(k, 'K', N0, -NX, NX, 0, NH, N1 - N0, a, onAc)
  for (const ac of onAc) tasKemer('K', N0, { ...ac, g: ACIKLIK + 0.1 }, 0.46, 0.08)
  for (let n = -2; n <= 2; n++) if (n) {
    // Yan gözlerde alçak taş set ve demir parmaklık (fotoğrafa göre)
    kutu(ACIKLIK, TABAN + 0.9, 0.5, u.mermerKoyu, n * SEFE, (TABAN + 0.9) / 2, N0 + 0.4)
    kutu(ACIKLIK, 0.05, 0.05, o.demir, n * SEFE, TABAN + 1.8, N0 + 0.4)
    for (let c = 0; c < 22; c++) kutu(0.03, 0.75, 0.03, o.demir, n * SEFE - ACIKLIK / 2 + (c + 0.5) * (ACIKLIK / 22), TABAN + 1.4, N0 + 0.4)
  }
  // Ön ayaklar: kesme taş kaplama
  for (const x of [-12.2, -7.2, -2.4, 2.4, 7.2, 12.2]) {
    const g = Math.abs(x) > 12 ? 1.38 : 0.96
    kutu(g + 0.06, 3.6, 1.14, u.tas, x, 1.8, (N0 + N1) / 2)
    kutu(g + 0.22, 0.2, 1.3, u.mermerKoyu, x, 3.68, (N0 + N1) / 2)
  }
  kirpiSacak(k, 'K', N0, -NX, NX, NH, u.tugla, u.koyu)
  // Basamaklar
  for (let i = 0; i < 2; i++) kutu(ACIKLIK + 0.6 - i * 0.2, 0.2, 1.2 - i * 0.4, u.mermerKoyu, 0, 0.1 + i * 0.2, N0 - 0.3 + i * 0.2)

  // Son cemaat yan yüzleri: devşirme başlıklı sütuna oturan ikiz sivri kemer
  for (const [yon, s] of [['D', 1], ['B', -1]] as const) {
    const x = s * NX, zm = (N0 + R0) / 2 + 0.3
    const ikiz: Acik[] = [-1, 1].map((n) => ({ p: zm + n * 1.45, y0: TABAN + 0.9, g: 2.55, duz: 2.3, kh: 1.65 }))
    duvar(k, yon, x, N0, R0, 0, NH, 1, a, ikiz)
    for (const ac of ikiz) tasKemer(yon, x, ac, 0.26, 0.07)
    // Üstte büyük boşaltma kemeri ve dama dolgu
    const buyuk = { p: zm, y0: 3.1, g: 6.5, duz: 0.2, kh: 3.45 }
    tasKemer(yon, x, buyuk, 0.34, 0.09)
    const dolgu = new THREE.Shape()
    kemer(dolgu, 0, buyuk.y0 + 0.5, buyuk.g - 0.45, 0.1, buyuk.kh - 0.5)
    const dg = new THREE.ShapeGeometry(dolgu, 12).translate(0, 0, 0.012)
    const p = dg.attributes.position, uvd = dg.attributes.uv
    for (let i = 0; i < p.count; i++) uvd.setXY(i, p.getX(i) / 3 + 0.5, p.getY(i) / 3)
    k.ekle(yonla(dg, yon, x, zm), o.dama)
    // Sütun
    const sx = x - s * 0.5
    k.ekle(yer(silindirG(0.2, 0.23, 2.5, 16), sx, TABAN + 0.9 + 1.4, zm), u.mermer)
    k.ekle(yer(kutuG(0.56, 0.3, 0.56), sx, TABAN + 0.9 + 0.15, zm), u.tas)
    k.ekle(yer(dondurG([[0.2, 0], [0.26, 0.14], [0.3, 0.28], [0.38, 0.42], [0.42, 0.5]], 12), sx, TABAN + 3.55, zm), u.mermer)
    kutu(0.9, 0.12, 0.9, u.mermer, sx, TABAN + 4.1, zm)
    // Yan parmaklık ve sofa
    kutu(0.05, 0.05, 2.5, o.demir, sx, TABAN + 1.8, zm - 1.45)
    kutu(0.05, 0.05, 2.5, o.demir, sx, TABAN + 1.8, zm + 1.45)
    kirpiSacak(k, yon, x, N0, R0, NH, u.tugla, u.koyu)
    // Yan sofa: tuğla döşemeli, 90 cm yüksek
    const xk = s * (2.2 + NX - 1) / 2
    kutu(NX - 1 - 2.2, 0.9, N2 - N1, o.tuglaZemin, xk, TABAN + 0.45, (N1 + N2) / 2)
    kutu(0.05, 0.05, N2 - N1, o.demir, s * 2.22, TABAN + 1.8, (N1 + N2) / 2)
    for (let c = 0; c < 26; c++) kutu(0.03, 0.9, 0.03, o.demir, s * 2.22, TABAN + 1.35, N1 + (c + 0.5) * ((N2 - N1) / 26))
  }

  // Revakın iç duvarı: kapı ve iki yanda 19. yüzyılda açılan pencereler
  const kapiAc = { p: 0, y0: TABAN, g: 1.8, duz: 2.5, kh: 0.55 }
  const revakPencere = [-5.9, -3.2, 3.2, 5.9].map((p) => ({ p, y0: TABAN + 1.5, g: 1, duz: 1.5, kh: 0.5 }))
  duvar(k, 'K', N2, -NX + 0.8, NX - 0.8, 0, NH + 0.05, R0 - N2, a, [kapiAc, ...revakPencere])
  for (const ac of revakPencere) {
    kemerDuzlem(k, 'K', N2, ac, 0.35, o.pencereDis)
    kutu(1, 0.1, 0.5, u.mermerKoyu, ac.p, ac.y0 + 0.02, N2 + 0.15)
    tasKemer('K', N2, { ...ac, g: 1.3, duz: 1.5, kh: 0.8 }, 0.2, 0.06)
  }
  // Mermer söveli kapı ve yuvarlak alınlık
  kemerTaslari(k, 'K', N2, { ...kapiAc, g: 1.92 }, 0.32, 0.1, u.mermer, u.mermerKoyu, 7)
  const alinlikDis = new THREE.Shape()
  kemer(alinlikDis, 0, TABAN + 3.5, 2.8, 0.05, 1.5)
  k.ekle(yonla(cikar(alinlikDis, 0.08, 0), 'K', N2, 0), u.mermer)
  for (const s of [-1, 1]) {
    kutu(0.3, 3.0, 0.5, u.mermer, s * 1.04, TABAN + 1.5, N2 + 0.22)
    // Açık duran kanatlar içte kalır
    k.ekle(yer(kutuG(0.08, 2.9, 0.9).translate(s * 0.86, TABAN + 1.45, -7.9 - 0.42), 0, 0, 0), u.ceviz)
  }

  // Revak tavanı: enine sivri kemerler ve bezemesiz kubbe içleri
  for (let n = -2; n <= 2; n++) {
    const p = n * SEFE, Rx = n === 0 ? 2.25 : 2, zm = (N1 + N2) / 2
    kCati.ekle(gecisG(p, zm, p - SEFE / 2, p + SEFE / 2, N1, N2, 5.4, 7.2, Rx, Rx), o.sivaAcik)
    k.ekle(yer(new THREE.CircleGeometry(Rx + 0.1, 40).rotateX(Math.PI / 2), p, 7.2, zm), o.sivaAcik)
  }
  for (const n of [-2, -1, 1, 2, 3]) {
    const xk = (n - 0.5) * SEFE
    if (Math.abs(xk) > NX - 1) continue
    const ac = { p: (N1 + N2) / 2, y0: TABAN, g: N2 - N1 - 0.5, duz: 3.5, kh: 2.4 }
    duvar(k, 'D', xk + 0.25, N1, N2, TABAN, 7.3, 0.5, o.sivaAcik, [ac])
  }
  // Revak iç yüzleri: yan odaların sıvalı tavan altı
  for (const s of [-1, 1]) kutu(0.05, NH - 0.4, N2 - N1, o.siva, s * (NX - 1.02), 3.9 + 0.3, (N1 + N2) / 2)

  // Hol: küçük kubbe ve iki yanda sıvalı duvar
  kCati.ekle(gecisG(0, (R0 + G1) / 2, -1.9, 1.9, R0, G1, 4.7, 6.2, 1.8, 1.8), o.siva)
  k.ekle(yer(new THREE.CircleGeometry(1.9, 32).rotateX(Math.PI / 2), 0, 7.2, (R0 + G1) / 2), o.kubbeSade)
  // Holden orta mekâna geçilen kapı duvarı
  const icKapi = { p: 0, y0: TABAN, g: 2, duz: 2.6, kh: 0.6 }
  duvar(k, 'G', C0, -CX, CX, 0, H, C0 - G1, o.siva, [icKapi])
  kemerTaslari(k, 'G', C0, { ...icKapi, g: 2.1 }, 0.24, 0.05, u.mermer, u.mermerKoyu, 7)
  // Holün kuzey duvarı sıvalı
  duvar(k, 'G', R0 + 0.03, -1.9, 1.9, TABAN, H, 0.03, o.siva, [{ ...kapiAc }])

  // Mihrap duvarı ve mihrap
  const guneyP = [-2.6, 2.6]
  const acG = guneyP.flatMap((p) => [altPencere('G', S1, p, TABAN + MIHRAP + 0.5, S1 - M1), ustPencere('G', S1, p, 4.75, S1 - M1)])
  duvar(k, 'G', S1, -MB, MB, 0, H, S1 - M1, a, acG)
  duvar(k, 'G', M1 + 0.03, -MX - 0.03, MX + 0.03, TABAN + MIHRAP, H, 0.04, o.siva, acG)
  for (const p of guneyP) silme('G', S1, p, 4.4)
  kirpiSacak(k, 'G', S1, -MB, MB, H, u.tugla, u.koyu)
  // Orta mekân ile mihraplı bölümü ayıran geniş kemer
  const mihrapKemer = { p: 0, y0: TABAN, g: 7.8, duz: 3.9, kh: 2.6 }
  duvar(k, 'G', M0, -MX, MX, 0, H, M0 - C1, o.siva, [mihrapKemer])
  for (const s of [-1, 1]) kutu(MX - 3.9 + 0.06, 3.6 + TABAN, M0 - C1 + 0.06, u.tas, s * (MX + 3.9) / 2, 2, (M0 + C1) / 2)

  // Mihrap: fotoğraf yüzeyi (açık yayında tuval), üstte taç, yanlarda şamdanlar
  const MG = 4, MY = MG * (985 / 725), MALT = TABAN + MIHRAP + 0.05
  kutu(MG + 0.14, MY + 0.1, 0.16, u.koyu, 0, MALT + MY / 2, M1 - 0.08)
  k.ekle(new THREE.PlaneGeometry(MG, MY).rotateY(Math.PI).translate(0, MALT + MY / 2, M1 - 0.17), o.mihrap)
  const tac = new THREE.Shape()
  tac.moveTo(-MG / 2 - 0.2, 0); tac.quadraticCurveTo(-1, 0.25, -0.75, 0.62); tac.quadraticCurveTo(-0.3, 0.7, 0, 1.25)
  tac.quadraticCurveTo(0.3, 0.7, 0.75, 0.62); tac.quadraticCurveTo(1, 0.25, MG / 2 + 0.2, 0); tac.closePath()
  k.ekle(yer(cikar(tac, 0.1, 0).translate(0, MALT + MY + 0.08, 0).rotateY(Math.PI), 0, 0, M1 - 0.04), u.bezeme)
  // Sekizgen köşe panelleri ve ölçek için alçak sıra
  for (const s of [-1, 1]) {
    // Şamdan: pirinç ayak, kalın mum
    const sx = s * 1.69, sz = M1 - 0.5
    const ayak: [number, number][] = [[0.42, 0], [0.42, 0.06], [0.28, 0.42], [0.12, 0.62], [0.1, 1.05], [0.26, 1.15], [0.26, 1.2]]
    k.ekle(yer(dondurG(ayak, 20), sx, TABAN + MIHRAP, sz), o.pirinc)
    k.ekle(yer(silindirG(0.2, 0.2, 1.05, 18), sx, TABAN + MIHRAP + 1.72, sz), o.pirinc)
    k.ekle(yer(dondurG([[0.18, 0], [0.18, 1.5], [0.12, 1.85], [0, 1.95]], 18), sx, TABAN + MIHRAP + 2.2, sz), o.mum)
    // Alt pencere tacı
    const px = s * 2.6
    const tacS = kemer(new THREE.Shape(), 0, TABAN + MIHRAP + 2.1, 1.75, 0.15, 1.15)
    tacS.holes.push(kemer(new THREE.Path(), 0, TABAN + MIHRAP + 2.1, 1.3, 0.1, 0.8))
    k.ekle(yer(new THREE.ShapeGeometry(tacS, 10).rotateY(Math.PI), px, 0, M1 - 0.03), u.bezeme)
    // Mermer sekiler
    kutu(MX - 2 + 0.04, 0.22, 0.75, u.icMermer, s * (MX + 2) / 2, TABAN + MIHRAP + 0.11, M1 - 0.37)
  }
  // Mihrap önü basamak halısı
  kutu(1.3, 0.1, 0.6, o.hali, 0, TABAN + MIHRAP + 0.05, M1 - 0.8)

  // Tabhane pencereleri üstü taçları, sakıflar ve mahfil
  for (const s of [-1, 1]) {
    kutu(CX - 1.25, TABAN + 2.7, -2.4 - C0, o.siva, s * (CX + 1.25) / 2, (TABAN + 2.7) / 2, (C0 - 2.4) / 2)
    kutu(CX - 1.25 + 0.06, 0.1, -2.4 - C0 + 0.3, u.ahsap, s * (CX + 1.25) / 2, TABAN + 2.72, (C0 - 2.4) / 2 + 0.1)
    kutu(CX - 1.25, 0.08, 0.08, u.ceviz, s * (CX + 1.25) / 2, TABAN + 3.72, -2.3)
    for (let c = 0; c < 11; c++) {
      const bx = s * (1.25 + (c + 0.5) * ((CX - 1.25) / 11))
      k.ekle(yer(silindirG(0.03, 0.03, 0.95, 6), bx, TABAN + 3.24, -2.3), u.ceviz)
    }
    kutu(0.08, 0.9, 1.3, u.ceviz, s * 1.25, TABAN + 3.2, (C0 - 2.4) / 2)
    // Mahfil altı ahşap kaplama
    kutu(CX - 1.25, TABAN + 2.2, 0.06, o.oyma, s * (CX + 1.25) / 2, 1.3, -2.38)
  }

  // Minber: üçgen gövde, korkuluklar, köşk ve sivri külah
  const minberOlustur = () => {
    const { x0, x1, z0, z1, tepe } = MINBER
    const taban = TABAN + MIHRAP, xm = (x0 + x1) / 2, en = x1 - x0
    const yan = new THREE.Shape()
    yan.moveTo(z0, taban); yan.lineTo(M1, taban); yan.lineTo(M1, taban + tepe + 0.9); yan.lineTo(z1, taban + tepe + 0.9); yan.lineTo(z0, taban + 0.9); yan.closePath()
    for (const x of [x0, x1 - 0.12]) k.ekle(cikar(yan, 0.12, 0).rotateY(-Math.PI / 2).translate(x + 0.12, 0, 0), o.oyma)
    const ADIM = 12
    for (let i = 0; i < ADIM; i++) {
      const t = i / ADIM, z = z0 + t * (z1 - z0), y = taban + ((i + 1) / ADIM) * tepe
      kutu(en - 0.24, y - taban, (z1 - z0) / ADIM + 0.01, i % 2 ? u.mihrapKirmizi : o.hali, xm, (y + taban) / 2, z + (z1 - z0) / ADIM / 2)
    }
    // Köşk ve külah
    const kzm = (z1 + M1) / 2, kd = M1 - z1
    kutu(en, tepe, kd, o.oyma, xm, taban + tepe / 2, kzm)
    kutu(en, 2.1, kd, o.oyma, xm, taban + tepe + 1.05, kzm)
    kutu(en + 0.1, 0.1, kd + 0.08, u.altinKoyu, xm, taban + tepe + 2.15, kzm)
    k.ekle(yer(duzGolge(silindirG(0.03, en * 0.62, 2.3, 8).rotateY(Math.PI / 8)), xm, taban + tepe + 3.3, kzm), o.oyma)
    k.ekle(yer(dondurG([[0.07, 0], [0.03, 0.14], [0.08, 0.28], [0, 0.55]], 8), xm, taban + tepe + 4.45, kzm), u.altin)
    // Kapı: iki söve ve taç
    for (const x of [x0 + 0.06, x1 - 0.06]) kutu(0.12, 2.3, 0.2, o.oyma, x, taban + 1.15, z0)
    kutu(en, 0.25, 0.2, o.oyma, xm, taban + 2.42, z0)
  }
  minberOlustur()
  // Vaaz kürsüsü: minberin batısında sade ahşap, turkuaz panolu
  kutu(1.05, 3.2, 1.6, o.oyma, -MX + 0.55, TABAN + MIHRAP + 1.6, 8.4)
  kutu(0.04, 1.2, 0.9, o.cini, -MX + 1.09, TABAN + MIHRAP + 1.5, 8.4)

  // Avize: kristal halkası lamba ve halelerle gösterilir
  const avize = (x: number, y: number, z: number, tepe: number, R: number, adet: number) => {
    k.ekle(new THREE.TorusGeometry(R, 0.03, 6, 28).rotateX(Math.PI / 2).translate(x, y, z), u.altin)
    k.ekle(new THREE.TorusGeometry(R * 0.55, 0.025, 6, 20).rotateX(Math.PI / 2).translate(x, y + 0.5, z), u.altin)
    k.ekle(yer(silindirG(0.012, 0.012, tepe - y, 5), x, (tepe + y) / 2, z), u.koyu)
    for (let n = 0; n < adet; n++) {
      const c = (n / adet) * Math.PI * 2, lx = x + Math.sin(c) * R, lz = z + Math.cos(c) * R
      k.ekle(new THREE.SphereGeometry(0.07, 8, 6).translate(lx, y - 0.14, lz), u.lamba)
      for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) {
        k.ekle(new THREE.PlaneGeometry(0.42, 0.42).rotateX(rx).rotateY(ry).translate(lx, y - 0.14, lz), u.lambaHale)
      }
    }
  }
  avize(0, 5.4, 1.15, 16, 0.85, 10)
  avize(0, 5.9, 11.7, 15.5, 0.95, 12)
  avize(8.375, 4.4, 1.35, 11, 0.5, 6)
  avize(-8.375, 4.4, 1.35, 11, 0.5, 6)

  // --- Çatı: kurşun döşeme, kasnak halkası ---
  const ana = new THREE.Shape()
  const yol: [number, number][] = [[-BX, R0], [BX, R0], [BX, TS], [MB, TS], [MB, S1], [-MB, S1], [-MB, TS], [-BX, TS]]
  yol.forEach(([x, z], i) => { if (i) ana.lineTo(x, -z); else ana.moveTo(x, -z) })
  ana.closePath()
  const CE = 1.15, ME = 11.71
  ana.holes.push(new THREE.Path().absellipse(0, -CE, 4.72, 5.05, 0, Math.PI * 2, true))
  ana.holes.push(new THREE.Path().absellipse(0, -ME, 4.92, 4.5, 0, Math.PI * 2, true))
  for (const s of [-1, 1]) ana.holes.push(new THREE.Path().absarc(s * 8.375, -1.35, 3.05, 0, Math.PI * 2, true))
  kCati.ekle(new THREE.ShapeGeometry(ana, 28).rotateX(-Math.PI / 2).translate(0, H + 0.02, 0), kursunMal)
  // Hafif eğimli kurşun etekler
  const revakCati = dikdortgen(-NX, -R0, NX, -N0)
  kCati.ekle(new THREE.ShapeGeometry(revakCati).rotateX(-Math.PI / 2).translate(0, NH + 0.04, 0), kursunMal)
  for (const [yon, x, a0, b0] of [['D', BX, R0, TS], ['B', -BX, R0, TS], ['G', TS, MB, BX], ['G', TS, -BX, -MB], ['D', MB, TS, S1], ['B', -MB, TS, S1], ['G', S1, -MB, MB]] as const) {
    const L = b0 - a0, m = (a0 + b0) / 2
    kCati.ekle(yonla(kutuG(L + 0.5, 0.1, 0.5).translate(0, H + 0.06, 0.1), yon, x, m), u.koyu)
  }
  for (const [yon, x, a0, b0] of [['K', N0, -NX, NX], ['D', NX, N0, R0], ['B', -NX, N0, R0]] as const) {
    const L = b0 - a0, m = (a0 + b0) / 2
    kCati.ekle(yonla(kutuG(L + 0.5, 0.1, 0.5).translate(0, NH + 0.06, 0.1), yon, x, m), u.koyu)
  }

  // İç geçiş bölgeleri
  kCati.ekle(gecisG(0, CE, -CX, CX, C0, C1, 7.5, 9.4, 4.45, 4.85), o.gecisOrta)
  kCati.ekle(gecisG(0, ME, -MX, MX, M0, M1, 7, 9.4, 4.8, 4.4), o.gecisMihrap)
  for (const s of [-1, 1]) kCati.ekle(gecisG(s * 8.375, 1.35, s * 8.375 - 3.03, s * 8.375 + 3.03, T0, T1, 5.9, 8.75, 2.95, 2.95), o.gecisSade)

  // --- Kasnaklar ---
  const icKasnak = (cx: number, cz: number, y0: number, y1: number, Rx: number, Rz: number, aciler: number[], cisim: Mal) => {
    const g = duzGolge(silindirG(1, 1, y1 - y0, 16, true)).scale(Rx, 1, Rz)
    kKasnak.ekle(yer(g, cx, (y0 + y1) / 2, cz), o.siva)
    for (const a of aciler) {
      const y = y0 + (y1 - y0) * 0.16, boy = (y1 - y0) * 0.54
      const pen = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y, 0.82, boy, 0.42), 8)
      const uv = pen.attributes.uv, p = pen.attributes.position
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.82 + 0.5, (p.getY(i) - y) / (boy + 0.42))
      const nx = Math.sin(a), nz = Math.cos(a), Rd = 1 / Math.hypot(nx / Rx, nz / Rz)
      kKasnak.ekle(yer(pen.translate(0, 0, Rd - 0.06), cx, 0, cz, a), cisim)
      void nx; void nz
    }
    // Dış sekizgen yüzünde karşılık gelen pencereler
    return aciler
  }
  const disPencereler = (cx: number, cz: number, y0: number, y1: number, R: number, aciler: number[], zOlcek = 1) => {
    for (const a of aciler) {
      const y = y0 + 0.5, boy = y1 - y0 - 1.6
      const rz = R * Math.cos(Math.PI / 8)
      const pen = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y, 1, boy, 0.55), 8)
      const uv = pen.attributes.uv, p = pen.attributes.position
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + 0.5, (p.getY(i) - y) / (boy + 0.55))
      pen.translate(0, 0, rz + 0.04).rotateY(a).scale(1, 1, zOlcek)
      kKasnak.ekle(pen.translate(cx, 0, cz), o.sebekeDis)
    }
  }
  const YUZ = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
  // Orta mekân: sekizgen kasnak; kaynakta kasnak ve etekte pencereler
  icKasnak(0, CE, 9.4, 11.4, 4.45, 4.85, [YUZ[1], YUZ[3], YUZ[0]], o.sebekeIc)
  disKasnak(kKasnak, a, u.koyu, 0, CE, H, 12.7, 5.8)
  disPencereler(0, CE, H, 12.7, 5.8, [YUZ[1], YUZ[3]])
  // Mihraplı bölüm: oval kubbe, kubbede üç pencere
  icKasnak(0, ME, 9.4, 10.6, 4.8, 4.4, [YUZ[0], YUZ[1], YUZ[3]], o.sebekeIc)
  disKasnak(kKasnak, a, u.koyu, 0, ME, H, 12, 6.6, 0.885)
  disPencereler(0, ME, H, 12, 6.6, [YUZ[1], YUZ[3]], 0.885)
  disPencereler(0, ME, H, 12, 6.6, [YUZ[0]], 0.885)
  // Tabhanelerin alçak kasnağı
  for (const s of [-1, 1]) disKasnak(kKasnak, a, u.koyu, s * 8.375, 1.35, H, H + 0.55, 4.05)

  // --- Kubbeler ---
  const al = u.altin
  kursunKubbe(kKubbe, kubbeMal, al, 0, CE, 12.68, 5.2, 4.4, 28)
  kursunKubbe(kKubbe, kubbeMal, al, 0, ME, 11.98, 5.6, 4.3, 28, true, 0.885)
  for (const s of [-1, 1]) kursunKubbe(kKubbe, kubbeMal, al, s * 8.375, 1.35, H + 0.52, 3.55, 2.4, 22)
  // Son cemaat yeri: beş göz, ortası büyük
  kursunKubbe(kKubbe, kubbeMal, al, 0, -12.95, NH + 0.05, 2.75, 2.15, 22)
  for (const s of [-1, 1]) {
    kursunKubbe(kKubbe, kubbeMal, al, s * SEFE, -12.95, NH + 0.05, 1.95, 1.5, 18)
    kursunKubbe(kKubbe, kubbeMal, al, s * SEFE * 2, -12.95, NH + 0.05, 1.8, 1.35, 18)
  }
  icKubbe(kKubbe, o.kubbeMadalyon, 0, CE, 11.4, 4.45, 4.85, 4.6)
  icKubbe(kKubbe, o.kubbeGul, 0, ME, 10.6, 4.8, 4.4, 5)
  for (const s of [-1, 1]) icKubbe(kKubbe, o.kubbeSade, s * 8.375, 1.35, 8.75, 2.95, 2.95, 2.45)
  // Hol kubbesi dışarıdan görünmez; revak iç kubbeleri tavanla kapalıdır.

  // --- Minare: kuzeydoğu köşesi, çokgen tuğla gövde, tek şerefe, kurşun külah ---
  const minare = (x: number, z: number) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z), mal)
    ek(duzGolge(silindirG(1.48, 1.62, 13.5, 12).translate(0, 14.25, 0)), u.tugla)
    ek(duzGolge(silindirG(1.75, 1.75, 2.2, 12).translate(0, 9.2, 0)), a)
    for (const y of [12, 15, 18]) ek(duzGolge(silindirG(1.6, 1.6, 0.14, 12).translate(0, y, 0)), u.mermerKoyu)
    // Şerefe altında iki sıra stalaktit
    for (let t = 0; t < 2; t++) {
      const r = 1.55 + t * 0.32, y = 21.05 + t * 0.42
      ek(silindirG(r + 0.3, r, 0.42, 20).translate(0, y, 0), u.mermerKoyu)
      for (let a2 = 0; a2 < 16; a2++) {
        const c = ((a2 + (t % 2) * 0.5) / 16) * Math.PI * 2
        ek(new THREE.SphereGeometry(0.2, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.15, 0.5).translate(0, y - 0.2, r + 0.12).rotateY(c), u.taskoyu)
      }
    }
    ek(silindirG(2.34, 2.34, 0.22, 24).translate(0, 22, 0), u.mermer)
    for (let c = 0; c < 22; c++) ek(kutuG(0.56, 0.86, 0.05).translate(0, 22.52, 2.26).rotateY((c / 22) * Math.PI * 2), u.mermer)
    ek(silindirG(1.12, 1.22, 2.9, 12).translate(0, 23.5, 0), u.tugla)
    ek(silindirG(1.34, 1.1, 0.26, 12).translate(0, 25, 0), u.mermerKoyu)
    ek(duzGolge(silindirG(0.04, 1.3, 6.3, 12).translate(0, 28.2, 0)), kursunMal)
    ek(dondurG([[0.08, 31.2], [0.03, 31.5], [0.13, 31.8], [0.03, 32.1], [0.1, 32.35], [0.01, 32.9], [0, 33]], 8), u.bronz)
  }
  minare(BX - 1.5, -8.9)

  // --- Şadırvan: geniş saçaklı kurşun örtü, sekiz direk, bezemeli kubbe ---
  const sadirvan = (x: number, z: number) => {
    k.ekle(yer(duzGolge(silindirG(4.7, 4.7, 0.28, 8).rotateY(Math.PI / 8)), x, 0.14, z), u.mermerKoyu)
    k.ekle(yer(duzGolge(silindirG(1.7, 1.85, 1, 12)), x, 0.78, z), u.mermer)
    k.ekle(yer(silindirG(1.55, 1.55, 0.04, 16), x, 1.27, z), u.su)
    k.ekle(yer(dondurG([[0.55, 0], [0.18, 0.5], [0.7, 0.75], [0.15, 0.95], [0.1, 1.5], [0.02, 1.7], [0, 1.72]], 14), x, 1.25, z), u.mermer)
    const R = 3.7
    for (let n = 0; n < 8; n++) {
      const a2 = Math.PI / 8 + n * Math.PI / 4
      const px = x + R * Math.sin(a2), pz = z + R * Math.cos(a2)
      k.ekle(yer(silindirG(0.13, 0.16, 3.6, 10), px, 2.08, pz), u.ceviz)
      k.ekle(yer(kutuG(0.28, 0.3, 0.28), px, 3.75, pz), u.ceviz)
      // Direkleri bağlayan kemerli ahşap kuşak
      const gen = 2 * R * Math.sin(Math.PI / 8), yuz = R * Math.cos(Math.PI / 8)
      const s = dikdortgen(-gen / 2, 2.85, gen / 2, 3.95)
      s.holes.push(kemer(new THREE.Path(), 0, 2.86, gen - 0.42, 0.2, 0.75))
      k.ekle(yer(cikar(s, 0.08, yuz - 0.04), x, 0, z, n * Math.PI / 4), u.ceviz)
    }
    // Kuşağın üstünde geniş saçak
    kCati.ekle(yer(duzGolge(silindirG(3.5, 5.3, 0.75, 8, false).rotateY(Math.PI / 8)), x, 4.3, z), kursunMal)
    kCati.ekle(yer(duzGolge(silindirG(5.32, 5.32, 0.14, 8, false).rotateY(Math.PI / 8)), x, 3.9, z), u.koyu)
    disKasnak(kKasnak, u.krem, u.koyu, x, z, 4.65, 5.65, 3.45)
    kursunKubbe(kKubbe, kubbeMal, al, x, z, 5.62, 3.05, 2.9, 22)
  }
  sadirvan(0, -25)

  // Evliya Çelebi Çeşmesi: kare çinili gövde, dört yanda mermer tekne ve saçak (fotoğrafa göre)
  const cesme = (x: number, z: number) => {
    kutu(4.2, 0.2, 4.2, u.mermerKoyu, x, 0.1, z)
    kutu(2.2, 2.4, 2.2, o.cini, x, 1.9, z)
    for (const s of [-1, 1]) {
      kutu(1.4, 0.8, 0.8, u.mermer, x + s * 0.55, 0.65, z - 1.5)
      kutu(1.4, 0.8, 0.8, u.mermer, x + s * 0.55, 0.65, z + 1.5)
    }
    k.ekle(yer(duzGolge(silindirG(0.9, 3, 0.45, 4).rotateY(Math.PI / 4)), x, 3.25, z), u.ceviz)
    kursunKubbe(k, kubbeMal, al, x, z, 3.45, 1, 0.7, 12)
  }
  cesme(-19, -20)

  const kokGrup = k.grup()
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  kokGrup.add(catiGrup, kasnakGrup, kubbeGrup)
  const gx = YER.x, gz = YER.z
  return {
    kok: kokGrup,
    katmanlar: [
      { grup: catiGrup, yukseklik: 12, ad: 'Çatı' },
      { grup: kasnakGrup, yukseklik: 20, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 28, ad: 'Kubbeler' },
    ],
    duraklar,
    yurume: yurumeAlani(),
    kamera: { konum: [gx + 30, 38, gz - 78], hedef: [6, 7, 0] },
    kaideYaricap: 64,
    icIsiklar: [[gx, 8.2, gz + 1], [gx, 8.2, gz + 11.7], [gx + 8.4, 6, gz + 1.3], [gx - 8.4, 6, gz + 1.3]],
  }
}
