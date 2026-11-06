// Muradiye Camii: dış kütle ve yürünebilir iç mekân. Tabhaneli/zaviyeli (ters T) şema, beş gözlü son cemaat yeri,
// art arda iki kubbe, iki yan eyvan, iki tuğla minare envanterden (s. 114-118). Plan ölçüleri kaynakta yoktur;
// envanter s. 113'teki kuşbakışı fotoğraftan, medresenin 17 × 17 m avlusuyla ölçeklenerek okunmuştur.
// Plan koordinatı: caminin ortası (0, 0), kuzey -z, doğu +x. Hat yazısı taklit edilmez: levha ve kitabe yüzeyleri yazısızdır.
import * as THREE from 'three'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kutuG, silindirG, yer } from '../../ulucamiParca'
import type { IcDurak, IcYurume, Kutu } from '../../ulucamiIc'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { MuradiyeMalzemeleri } from './dokular'
import { BATI, DOGU, GUNEY, KUZEY, type Mal, alem, delikliDoseme, disKubbe, duvar, gecisKabugu, icKubbeG, kasnak, kemerHalka, kemerYuz, kirmaCati } from './ortak'

export const TABAN = 1
const PLATFORM = 1.1, GOZ = 2.7
const COURT_Z = -1.6, HALL_Z = 11, A = 5.2
const EYVAN_X = 10, EYVAN_AX = 3.8, EYVAN_AZ = 4.6
const MINBER = { x0: -3.75, x1: -2.45, z0: 12, rampa0: 12.5, rampa1: 15, z1: 16.1, h: 2.2 }

export function camiDuraklari(ox: number, oz: number): IcDurak[] {
  const d = (id: string, ad: string, k: [number, number, number], b: [number, number, number]): IcDurak =>
    ({ id, ad, konum: [k[0] + ox, k[1], k[2] + oz], bak: [b[0] + ox, b[1], b[2] + oz] })
  const minberZ = 14.2
  const minberH = PLATFORM + ((minberZ - MINBER.rampa0) / (MINBER.rampa1 - MINBER.rampa0)) * MINBER.h
  return [
    d('son-cemaat', 'Son cemaat yeri', [0, GOZ, -13.2], [0, 4.4, -9.6]),
    d('avlu', 'Kubbeli iç avlu', [0, GOZ, -5], [0, 5.4, 16]),
    d('mihrap', 'Mihrap', [0, GOZ + PLATFORM, 8.2], [0, 5.2, 16.2]),
    d('minber', 'Minber', [1, GOZ + PLATFORM, 11], [-3.1, 4.6, 14.5]),
    d('cini', 'Çiniler', [2.2, GOZ + PLATFORM, 10], [5.2, 4, 12]),
    d('kubbe', 'Kubbe', [0, GOZ + PLATFORM, 8.4], [0, 19, 11]),
    d('dogu-eyvan', 'Doğu eyvanı', [11.4, GOZ, -1.6], [-5, 5.4, -1.6]),
    d('bati-eyvan', 'Batı eyvanı', [-11.4, GOZ, -1.6], [5, 5.4, -1.6]),
    d('minber-ust', 'Minbere çık', [(MINBER.x0 + MINBER.x1) / 2, GOZ + minberH, minberZ], [4, 4.2, 4]),
  ]
}

export function camiYurumesi(ox: number, oz: number): IcYurume {
  const K = (x0: number, x1: number, z0: number, z1: number): Kutu => ({ x0: x0 + ox, x1: x1 + ox, z0: z0 + oz, z1: z1 + oz })
  const ikiYan = (x0: number, x1: number, z0: number, z1: number) => [K(x0, x1, z0, z1), K(-x1, -x0, z0, z1)]
  // Duvar kitleleri: bakışı da keser.
  const kitleler = [
    ...ikiYan(1.3, 15, -9.6, -6.8), // giriş duvarı
    ...ikiYan(6.2, 15, -6.8, -6.2), // eyvan kuzeyi
    ...ikiYan(5.2, 6.2, -6.8, -6), ...ikiYan(5.2, 6.2, 2.8, 3.6), // eyvan kemer ayakları
    ...ikiYan(6.2, 15, 3, 5.9), // eyvan güneyi
    ...ikiYan(4.8, 6.9, 3.6, 5.8), // ana kemer ayakları
    ...ikiYan(5.2, 15, 5.8, 18), // harim yan duvarları
  ]
  const my = (MINBER.x0 + MINBER.x1) / 2
  return {
    sinir: K(-13.8, 13.8, -16.1, 16.2),
    kutular: [
      ...kitleler,
      K(-1.5, 1.5, 15.8, 16.2), // mihrap
      // Son cemaat yeri ayakları (iç sırada çarpılmaz, cephe sınırın dışındadır); minber:
      K(MINBER.x0 - 0.1, MINBER.x0, MINBER.z0, MINBER.z1), K(MINBER.x1, MINBER.x1 + 0.1, MINBER.z0, MINBER.z1),
      K(MINBER.x0, MINBER.x1, MINBER.rampa1 + 0.1, MINBER.z1),
      K(my - 0.75, my - 0.62, MINBER.z0 - 0.1, MINBER.z0 + 0.3), K(my + 0.62, my + 0.75, MINBER.z0 - 0.1, MINBER.z0 + 0.3),
    ],
    daireler: [],
    zeminler: [
      // Harime birkaç basamakla çıkılır.
      { x0: -2.3 + ox, x1: 2.3 + ox, z0: 1.8 + oz, z1: 3.6 + oz, h0: 0, h1: PLATFORM },
      { x0: -A + ox, x1: A + ox, z0: 3.6 + oz, z1: 16.2 + oz, h0: PLATFORM, h1: PLATFORM },
      // Minber merdiveni
      { x0: MINBER.x0 + ox, x1: MINBER.x1 + ox, z0: MINBER.rampa0 + oz, z1: MINBER.rampa1 + oz, h0: PLATFORM, h1: PLATFORM + MINBER.h },
    ],
    gorusKesenler: kitleler,
    gozY: GOZ,
    tabanY: TABAN,
  }
}

export function cami(m: UlucamiMalzemeleri, d: MuradiyeMalzemeleri, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  const kutu = (g: number, h: number, dd: number, mal: Mal, x: number, y: number, z: number, kv = k) => kv.ekle(yer(kutuG(g, h, dd), x, y, z), mal)
  const ikiYan = (f: (s: number) => void) => { f(1); f(-1) }
  const hali = m.haliSade.clone()
  hali.color.set('#e08878')

  // --- Kaide ve döşemeler ---
  kutu(31.6, 0.95, 8.8, m.mermer, 0, 0.475, -13.3)
  kutu(31, 0.95, 16, m.mermer, 0, 0.475, -1.8)
  kutu(14.4, 0.95, 12.6, m.mermer, 0, 0.475, 12)
  kutu(30, 0.05, 7.4, d.altigenTugla, 0, TABAN - 0.025, -13.3)
  kutu(10.4, 0.05, 10.4, hali, 0, TABAN - 0.025, COURT_Z)
  ikiYan((s) => kutu(EYVAN_AX * 2 + 1, 0.05, 9.2, hali, s * 9.7, TABAN - 0.025, COURT_Z))
  // Basamaklar: son cemaat yerine dört basamak
  for (let i = 0; i < 4; i++) kutu(7.4 - i * 0.3, 0.25, (4 - i) * 0.42, m.mermer, 0, 0.125 + i * 0.25, -17.8 - (4 - i) * 0.21)
  // Harim sekisi: önü firuze çinili, ortada halilı basamaklar
  kutu(A * 2, PLATFORM, 12.6, hali, 0, TABAN + PLATFORM / 2, 9.9)
  kutu(A * 2, PLATFORM - 0.12, 0.05, d.ciniFiruze, 0, TABAN + PLATFORM / 2 - 0.05, 3.58)
  kutu(A * 2 + 0.02, 0.12, 0.2, d.bordur, 0, TABAN + PLATFORM - 0.06, 3.6)
  const ADIM = 7
  for (let i = 0; i < ADIM; i++) {
    const h = PLATFORM * (i + 1) / ADIM
    kutu(4.6, h, 1.8 / ADIM, hali, 0, TABAN + h / 2, 1.8 + (i + 0.5) * 1.8 / ADIM)
  }

  // --- Son cemaat yeri: beş kemerli cephe, dört mermer paye, iki granit sütun ---
  const YAY_Y = 4.6, O = 2.55, KH = 2.5, UST = 9
  const arkadaSekli = (L: number, gozler: number[], o: number) => {
    const s = new THREE.Shape()
    s.moveTo(-L / 2, YAY_Y)
    for (const c of gozler) {
      s.lineTo(c - o, YAY_Y)
      s.quadraticCurveTo(c - o, YAY_Y + KH * 0.55, c, YAY_Y + KH)
      s.quadraticCurveTo(c + o, YAY_Y + KH * 0.55, c + o, YAY_Y)
    }
    s.lineTo(L / 2, YAY_Y); s.lineTo(L / 2, UST); s.lineTo(-L / 2, UST); s.closePath()
    return s
  }
  const gozler = [-12, -6, 0, 6, 12]
  const kemerSeridi = (cx: number, z: number, ry: number) => {
    // Tuğla ve taş dilimli kemer: fotoğraftaki gibi cepheden hafif çıkıntılı
    const s = new THREE.Shape()
    const dis = O + 0.38, h = KH + 0.42
    s.moveTo(cx - dis, YAY_Y); s.quadraticCurveTo(cx - dis, YAY_Y + h * 0.55, cx, YAY_Y + h); s.quadraticCurveTo(cx + dis, YAY_Y + h * 0.55, cx + dis, YAY_Y)
    s.lineTo(cx + O, YAY_Y); s.quadraticCurveTo(cx + O, YAY_Y + KH * 0.55, cx, YAY_Y + KH); s.quadraticCurveTo(cx - O, YAY_Y + KH * 0.55, cx - O, YAY_Y); s.closePath()
    return yer(cikar(s, 0.08, 0), 0, 0, z, ry)
  }
  // Ön cephe
  k.ekle(yer(cikar(arkadaSekli(30, gozler, O), 0.55, -0.55), 0, 0, -17, KUZEY), d.tuglaDesen)
  k.ekle(yer(cikar(arkadaSekli(30, gozler, O), 0.35, -0.9), 0, 0, -17, KUZEY), m.ic)
  for (const c of gozler) k.ekle(kemerSeridi(c, -17, KUZEY), m.tugla)
  // Yan cepheler: birer kemer
  ikiYan((s) => {
    const ry = s > 0 ? DOGU : BATI
    k.ekle(yer(cikar(arkadaSekli(7.4, [0], 2.3), 0.55, -0.55), s * 15, 0, -13.3, ry), d.tuglaDesen)
    k.ekle(yer(cikar(arkadaSekli(7.4, [0], 2.3), 0.35, -0.9), s * 15, 0, -13.3, ry), m.ic)
  })
  // Paye ve sütunlar
  for (const u of [-15, -3, 3, 15]) {
    const x = Math.sign(u) * (Math.abs(u) === 15 ? 14.55 : 3)
    kutu(0.95, YAY_Y - TABAN, 0.95, m.mermer, x, (YAY_Y + TABAN) / 2, -16.55)
    kutu(1.2, 0.28, 1.2, m.mermer, x, TABAN + 0.14, -16.55)
    kutu(1.1, 0.2, 1.1, m.mermer, x, YAY_Y - 0.1, -16.55)
  }
  for (const u of [-9, 9]) {
    k.ekle(yer(silindirG(0.3, 0.34, YAY_Y - TABAN - 0.5, 16), u, (YAY_Y + TABAN) / 2 + 0.05, -16.55), d.granit)
    k.ekle(yer(silindirG(0.42, 0.34, 0.3, 12), u, YAY_Y - 0.15, -16.55), m.mermer)
    k.ekle(yer(silindirG(0.42, 0.42, 0.25, 12), u, TABAN + 0.12, -16.55), m.mermer)
  }
  ikiYan((s) => {
    kutu(0.9, YAY_Y - TABAN, 1.6, m.mermer, s * 14.55, (YAY_Y + TABAN) / 2, -10.6)
  })
  // Korkuluk: orta göz açık
  for (const c of [-12, -6, 6, 12]) {
    kutu(4.9, 0.08, 0.1, m.ahsap, c, TABAN + 0.95, -16.55)
    kutu(4.9, 0.08, 0.1, m.ahsap, c, TABAN + 0.45, -16.55)
    for (let i = -2; i <= 2; i++) kutu(0.08, 0.9, 0.08, m.ahsap, c + i * 1.15, TABAN + 0.5, -16.55)
  }
  // Saçak: firuze şerit ve testere dişli tuğla
  kutu(30.2, 0.62, 0.08, d.firuzeBant, 0, 8.1, -17.04)
  ikiYan((s) => kutu(0.08, 0.62, 7.6, d.firuzeBant, s * 15.04, 8.1, -13.3))
  for (let i = 0; i < 60; i++) k.ekle(yer(kutuG(0.3, 0.3, 0.3).rotateY(Math.PI / 4), -14.75 + i * 0.5, 8.65, -17), m.tugla)
  for (let s of [-1, 1]) for (let i = 0; i < 15; i++) k.ekle(yer(kutuG(0.3, 0.3, 0.3).rotateY(Math.PI / 4), s * 15, 8.65, -16.8 + i * 0.5), m.tugla)
  kutu(30.8, 0.2, 8.3, m.koyu, 0, 9.05, -13.3, kCati)
  // Son cemaat yeri örtüsü: tavan, göz kubbeleri ve kurşun kırma çatı
  delikliDoseme(kCati, -14.2, 14.2, -16.1, -9.6, 7.3, gozler.map((c) => [c, -13.3, 2.6] as [number, number, number]), m.ic)
  for (const c of gozler) {
    const R = 2.62
    kCati.ekle(yer(icKubbeG(R, 1.6), c, 7.3, -13.3), c === 0 ? d.tromp : d.icKubbe)
  }
  kirmaCati(kCati, -15.7, 15.7, -17.8, -8.8, 9.15, 2.9, m.kursun)
  disKubbe(kCati, 0, 10.8, -13.3, 2.6, 2, m.kubbe, 32)

  // Giriş duvarı: mermer taç, kündekâri kanatlar, alınlıkta çini
  const KAPI = { u: 0, g: 2.6, y: TABAN + 0.02, duz: 3.2, k: 1.1 }
  duvar(k, 0, -9.6, 30, TABAN, 9.6, 2.8, KUZEY, m.ic, m.ic, [KAPI])
  const tac0 = dikdortgen(-3.4, TABAN, 3.4, 8.1)
  tac0.holes.push(new THREE.Path().moveTo(-2, TABAN + 0.02).lineTo(-2, 4.8).quadraticCurveTo(-2, 5.8, 0, 6.6).quadraticCurveTo(2, 5.8, 2, 4.8).lineTo(2, TABAN + 0.02).closePath() as THREE.Path)
  k.ekle(yer(cikar(tac0, 0.3, 0), 0, 0, -9.6, KUZEY), m.mermer)
  kutu(5.6, 0.82, 0.05, d.ciniLacivert, 0, 7.45, -9.92)
  kutu(6.8, 0.18, 0.5, m.mermer, 0, 8.18, -9.8)
  kutu(2.2, 0.56, 0.06, m.altin, 0, 5.72, -9.64) // kitabe yeri: yazısız
  ikiYan((s) => {
    k.ekle(yer(kutuG(0.14, 3.7, 1.35), s * 1.22, TABAN + 1.85, -8.95), m.kundekari)
    // Yan kapı ve pencereler: alınlıkları geometrik çini
    kemerYuz(k, s * 9, -9.6, KUZEY, 0, TABAN, 2, 2.2, 0.9, 0.02, m.koyu)
    kemerHalka(k, s * 9, -9.6, KUZEY, 0, TABAN, 2, 2.2, 0.9, 0.2, 0, m.mermer)
    kutu(2.8, 1.2, 0.05, d.ciniLacivert, s * 9, 6, -9.63)
    kutu(3.2, 0.14, 0.14, m.mermer, s * 9, 5.35, -9.64)
    kutu(3.2, 0.14, 0.14, m.mermer, s * 9, 6.66, -9.64)
  })

  // --- Beden duvarları (üç sıra tuğla + bir sıra moloz taş) ---
  ikiYan((s) => {
    const dogu = s > 0
    const ry = dogu ? DOGU : BATI
    duvar(k, s * 15, -1.85, 15.5, TABAN, 9.6, 1.2, ry, d.almasikCami, m.ic)
    duvar(k, s * 10.95, 5.9, 8.1, TABAN, 9.6, 2.9, GUNEY, d.almasikCami, m.ic, [], 0.9)
    // Eyvanın kuzey yüzü
    kutu(EYVAN_AX * 2, 8.6, 0.6, m.ic, s * EYVAN_X, TABAN + 4.3, -6.5)
    // Avlu kemerleri
    duvar(k, s * 6.2, COURT_Z, 10.4, TABAN, 12.4, 1, ry, m.ic, m.ic, [{ u: 0, g: 8.8, y: TABAN + 0.02, duz: 4.6, k: 3.1 }])
    // Harim yan duvarı
    duvar(k, s * 6.9, 11.9, 12.2, TABAN, 14.6, 1.7, ry, d.almasikCami, m.ic)
    // Beden pencereleri (dıştan şebeke)
    for (const z of [-5.8, -1.6, 2.6]) {
      kemerYuz(k, s * 15, z, ry, 0, 2.2, 1.3, 2.4, 0.8, 0.02, d.sebeke)
      kemerHalka(k, s * 15, z, ry, 0, 2.2, 1.3, 2.4, 0.8, 0.22, 0, m.tugla)
      kemerYuz(k, s * 15, z, ry, 0, 6.4, 0.9, 1, 0.5, 0.02, d.sebeke)
    }
    for (const z of [8.5, 15]) {
      kemerYuz(k, s * 6.9, z, ry, 0, 3.2, 1.2, 2.2, 0.8, 0.02, d.sebeke)
      kemerHalka(k, s * 6.9, z, ry, 0, 3.2, 1.2, 2.2, 0.8, 0.22, 0, m.tugla)
      kemerYuz(k, s * 6.9, z, ry, 0, 8, 1, 1.3, 0.6, 0.02, d.sebeke)
    }
  })
  duvar(k, 0, 5.8, 13.8, TABAN, 12.4, 2.2, GUNEY, m.ic, m.ic, [{ u: 0, g: 9.6, y: TABAN + 0.02, duz: 5.5, k: 4.5 }], 0.5)
  duvar(k, 0, 18, 13.8, TABAN, 14.6, 1.8, GUNEY, d.almasikCami, m.ic, [], 0.7)
  for (const u of [-3.6, 3.6]) {
    kemerYuz(k, 0, 18, GUNEY, u, 3.2, 1.2, 2.2, 0.8, 0.02, d.sebeke)
    kemerHalka(k, 0, 18, GUNEY, u, 3.2, 1.2, 2.2, 0.8, 0.22, 0, m.tugla)
    kemerYuz(k, 0, 18, GUNEY, u, 8.2, 1, 1.3, 0.6, 0.02, d.sebeke)
  }
  // Saçak silmeleri
  ikiYan((s) => {
    kutu(0.5, 0.3, 16, m.tugla, s * 15.1, 9.55, -1.85)
    kutu(8.6, 0.3, 0.5, m.tugla, s * 11, 9.55, 6)
  })
  kutu(14.6, 0.3, 0.5, m.tugla, 0, 14.55, 18.1)
  ikiYan((s) => kutu(0.5, 0.3, 12.4, m.tugla, s * 7, 14.55, 11.9))

  // --- Çatı: kurşun güverte, sekizgen tuğla kasnaklar, kurşun kubbeler ---
  const DIS_R = 6.9 / Math.cos(Math.PI / 8)
  delikliDoseme(kCati, -15.4, 15.4, -9.6, 6.2, 9.8, [[0, COURT_Z, A + 0.05], [EYVAN_X, COURT_Z, 3.9], [-EYVAN_X, COURT_Z, 3.9]], m.kursun)
  delikliDoseme(kCati, -7.3, 7.3, 6.2, 18.4, 14.62, [[0, HALL_Z, 5.2]], m.kursun)
  kasnak(kKasnak, 0, 9.7, 14.7, COURT_Z, DIS_R, 8, d.almasikCami, m.tugla)
  kasnak(kKasnak, 0, 14.4, 15.3, HALL_Z, DIS_R, 8, d.almasikCami, m.tugla)
  ikiYan((s) => kasnak(kKasnak, s * EYVAN_X, 9.7, 10.9, COURT_Z, 4.95, 8, d.almasikCami, m.tugla))
  // Kasnak şebekeleri
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4
    kemerYuz(kKasnak, 0, COURT_Z, a, 0, 11.6, 1.1, 1, 0.6, 6.92, d.sebeke)
    kemerHalka(kKasnak, 0, COURT_Z, a, 0, 11.6, 1.1, 1, 0.6, 0.18, 6.9, m.tugla)
  }
  // Kubbeler
  disKubbe(kKubbe, 0, 14.75, COURT_Z, 6.6, 5.6, m.kubbe, 56)
  disKubbe(kKubbe, 0, 15.3, HALL_Z, 6.6, 5.6, m.kubbe, 56)
  ikiYan((s) => disKubbe(kKubbe, s * EYVAN_X, 10.95, COURT_Z, 4.6, 3.8, m.kubbe, 44))
  alem(kKubbe, 0, 20.3, COURT_Z, m.bronz, 1.1)
  alem(kKubbe, 0, 20.85, HALL_Z, m.bronz, 1.1)
  ikiYan((s) => alem(kKubbe, s * EYVAN_X, 14.7, COURT_Z, m.bronz, 0.9))

  // --- İç: kubbeye geçiş, kasnak, kubbe ---
  const icUst = (cz: number) => {
    kKasnak.ekle(gecisKabugu(0, cz, A, A, 11.1, 12.6, A - 0.06, 32, 3), d.tromp)
    kKasnak.ekle(yer(silindirG(A - 0.06, A - 0.06, 1.2, 40, true), 0, 13.2, cz), d.kasnakIc)
    for (let n = 0; n < 8; n++) {
      const a = (n + 0.5) * Math.PI / 4
      const r = A - 0.1
      kemerYuz(kKasnak, 0, cz, a + Math.PI, 0, 12.8, 0.55, 0.45, 0.32, -r, d.vitray)
    }
    kKubbe.ekle(yer(icKubbeG(A - 0.06, 5), 0, 13.8, cz), d.icKubbe)
    // Köşelerde büyük prizmatik üçgenler (avlu) ve damlalı tromp (harim)
  }
  icUst(COURT_Z); icUst(HALL_Z)
  ikiYan((s) => {
    kKasnak.ekle(gecisKabugu(s * EYVAN_X, COURT_Z, EYVAN_AX, EYVAN_AZ, 8.8, 9.9, 3.72, 28, 2), d.tromp)
    kKubbe.ekle(yer(icKubbeG(3.72, 3.1), s * EYVAN_X, 9.9, COURT_Z), d.icKubbe)
  })

  /** Avlu köşesi: aşağı sivrilen prizmatik üçgen. */
  const ucgenKose = (cx: number, cz: number, sx: number, sz: number, y0: number, y1: number, g: number) => {
    const u1 = [cx + sx * (A - g), y1, cz + sz * A], u2 = [cx + sx * A, y1, cz + sz * (A - g)]
    const uc = [cx + sx * A, y0, cz + sz * A]
    const on = [cx + sx * (A - g * 0.34), y1, cz + sz * (A - g * 0.34)]
    const tek = (a: number[], b: number[], c: number[]) => {
      const t = new THREE.BufferGeometry()
      t.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3))
      t.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0.25, 1, 0.12, 0], 2))
      t.computeVertexNormals()
      kKasnak.ekle(t, d.tromp)
    }
    tek(u1, on, uc); tek(on, u2, uc)
  }
  /** Harim köşesi: duvarın ortasına inen damlalı, mukarnaslı tromp. */
  const damla = (sx: number, sz: number) => {
    const cx = sx * A, cz = HALL_Z + sz * A
    const N = 11, y0 = 6.4, y1 = 11.3
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const r0 = 0.1 + Math.pow(t, 1.2) * 2.9, r1 = 0.24 + Math.pow((i + 1) / N, 1.2) * 2.9
      const h = (y1 - y0) / N, y = y0 + i * h + h / 2
      const zig = i % 2 ? 1.14 : 1
      const g = duzGolge(silindirG(r1 * zig, r0, h, 12, false).rotateY(i % 2 ? Math.PI / 12 : 0))
      kKasnak.ekle(yer(g, cx - sx * r0 * 0.12, y, cz - sz * r0 * 0.12), i % 3 === 2 ? d.kemerBant : m.krem)
    }
  }
  ikiYan((sx) => ikiYan((sz) => {
    ucgenKose(0, COURT_Z, sx, sz, 8.2, 11.15, 3.4)
    damla(sx, sz)
  }))

  // Kemer bantları: ana kemer ve eyvan kemerleri
  kemerHalka(k, 0, 3.6, KUZEY, 0, TABAN + 0.02, 9.6, 5.5, 4.5, 0.35, -0.02, d.kemerBant, 0.06)
  ikiYan((s) => kemerHalka(k, s * 5.2, COURT_Z, s > 0 ? BATI : DOGU, 0, TABAN + 0.02, 8.8, 4.6, 3.1, 0.3, -0.02, d.kemerBant, 0.06))
  // Kemerin üstünde kalem işi şerit
  kutu(10.3, 0.5, 0.05, d.kemerBant, 0, 11.02, 3.58)

  // --- Çini panolar ---
  const panoX = (x: number, z0: number, z1: number, y0: number, y1: number, mal: Mal) => {
    const zo = (z0 + z1) / 2, L = z1 - z0, h = y1 - y0
    kutu(0.05, h, L, mal, x, y0 + h / 2, zo)
    for (const y of [y0 + 0.06, y1 - 0.06]) kutu(0.07, 0.12, L + 0.06, d.bordur, x, y, zo)
    for (const z of [z0 + 0.06, z1 - 0.06]) kutu(0.07, h, 0.12, d.bordur, x, y0 + h / 2, z)
  }
  const panoZ = (z: number, x0: number, x1: number, y0: number, y1: number, mal: Mal) => {
    const xo = (x0 + x1) / 2, L = x1 - x0, h = y1 - y0
    kutu(L, h, 0.05, mal, xo, y0 + h / 2, z)
    for (const y of [y0 + 0.06, y1 - 0.06]) kutu(L + 0.06, 0.12, 0.07, d.bordur, xo, y, z)
    for (const x of [x0 + 0.06, x1 - 0.06]) kutu(0.12, h, 0.07, d.bordur, x, y0 + h / 2, z)
  }
  const ZEM = TABAN + PLATFORM
  // Mihrap önü duvarları: altıgen zümrüt yeşili; pencere altları ve köşeler firuze (envanter s. 116-117).
  ikiYan((s) => {
    const x = s * (A - 0.03)
    panoX(x, 9.2, 12.8, ZEM, ZEM + 3.1, d.ciniZumrut)
    panoX(x, 14.7, 16.15, ZEM, ZEM + 3.1, d.ciniFiruze)
    panoX(x, 5.85, 7.1, ZEM, ZEM + 3.1, d.ciniFiruze)
    // Beyaz sivri nişler
    const ry = s > 0 ? BATI : DOGU
    for (const z of [8.15, 13.75]) {
      kemerYuz(k, x, z, ry, 0, ZEM, 1.3, 2.4, 1.1, 0.03, m.krem)
      kemerHalka(k, x, z, ry, 0, ZEM, 1.3, 2.4, 1.1, 0.14, 0.02, d.kemerBant)
      kemerYuz(k, x, z, ry, 0, ZEM + 0.9, 0.8, 1.3, 0.7, 0.05, d.vitray)
    }
    // Üst pencereler
    for (const z of [8.2, 11, 13.8]) {
      kemerYuz(k, x, z, ry, 0, 7.2, 0.95, 1.5, 0.65, 0.03, d.vitray)
      kemerHalka(k, x, z, ry, 0, 7.2, 0.95, 1.5, 0.65, 0.1, 0.02, m.altinKoyu, 0.04)
    }
    // Giriş duvarında firuze, eyvan uçlarında pencere ve kapı
    panoZ(-6.77, s * 1.6, s * 5.15 + (s > 0 ? 0 : 0), TABAN, TABAN + 2.6, d.ciniFiruze)
    const ex = s * 13.77
    kemerYuz(k, ex, COURT_Z, ry, 0, TABAN, 2, 2.6, 1, 0.03, m.kundekari)
    kemerHalka(k, ex, COURT_Z, ry, 0, TABAN, 2, 2.6, 1, 0.16, 0.02, d.kemerBant)
    for (const z of [COURT_Z - 2.9, COURT_Z + 2.9]) {
      kemerYuz(k, ex, z, ry, 0, TABAN + 0.9, 1.1, 2, 0.8, 0.03, d.vitray)
      kemerHalka(k, ex, z, ry, 0, TABAN + 0.9, 1.1, 2, 0.8, 0.16, 0.02, d.kemerBant)
    }
    for (const z of [COURT_Z - 2, COURT_Z, COURT_Z + 2]) kemerYuz(k, ex, z, ry, 0, 6.2, 0.7, 1, 0.45, 0.03, d.vitray)
  })
  // Kıble duvarı
  panoZ(16.17, 3.1, 5.15, ZEM, ZEM + 3.1, d.ciniFiruze)
  panoZ(16.17, -5.15, -3.1, ZEM, ZEM + 3.1, d.ciniLacivert) // minber arkası köşe
  for (const u of [-2.25, 2.25]) {
    kemerYuz(k, 0, 16.17, KUZEY, -u, ZEM + 0.3, 1.2, 1.9, 0.8, 0.03, d.vitray)
    kemerHalka(k, 0, 16.17, KUZEY, -u, ZEM + 0.3, 1.2, 1.9, 0.8, 0.14, 0.02, m.krem)
    kemerYuz(k, 0, 16.17, KUZEY, -u, 7.4, 1.1, 1.3, 0.7, 0.03, d.vitray)
    kemerHalka(k, 0, 16.17, KUZEY, -u, 7.4, 1.1, 1.3, 0.7, 0.14, 0.02, m.altinKoyu, 0.04)
    // Pencere üstü boş madalyon: hat taklit edilmez
    k.ekle(yer(silindirG(0.34, 0.34, 0.05, 16).rotateX(Math.PI / 2), u, 10.1, 16.17), m.koyu)
    k.ekle(new THREE.TorusGeometry(0.36, 0.03, 6, 20).translate(u, 10.1, 16.13), m.altin)
  }
  // Levha ve Kâbe örtüsü yerleri: yazısız pano. Levha mihrabın batısındaki duvarda, örtü tam karşısında (s. 116-117).
  kutu(0.06, 1.3, 2.6, d.levha, -A + 0.04, 6.1, 11)
  kutu(0.06, 1.3, 2.6, d.kabe, A - 0.04, 6.1, 11)

  // --- Mihrap: 1790 onarımından kalan, alçı Rokoko; biçim temsilî ---
  const mihrap = () => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, 16.17, KUZEY), mal)
    const G = 2.9, TEPE = ZEM + 5.2
    const blok = dikdortgen(-G / 2, ZEM, G / 2, TEPE)
    blok.holes.push(new THREE.Path().moveTo(-0.7, ZEM + 0.02).lineTo(-0.7, ZEM + 2.2).quadraticCurveTo(-0.7, ZEM + 2.9, 0, ZEM + 3.3).quadraticCurveTo(0.7, ZEM + 2.9, 0.7, ZEM + 2.2).lineTo(0.7, ZEM + 0.02).closePath() as THREE.Path)
    ek(cikar(blok, 0.34), d.rokoko)
    ek(kutuG(1.5, 3.4, 0.08).translate(0, ZEM + 1.7, 0.03), m.altinKoyu)
    for (let i = 0; i < 6; i++) {
      const y = ZEM + 2.25 + i * 0.17, g = 1.36 - i * 0.2
      ek(kutuG(g, 0.15, 0.2).translate(0, y, 0.14), m.altin)
    }
    // Çerçeve bantları
    for (const s of [-1, 1]) {
      ek(kutuG(0.14, 5.2, 0.42).translate(s * (G / 2 - 0.07), ZEM + 2.6, 0.2), m.altinKoyu)
      ek(silindirG(0.08, 0.08, 3, 12).translate(s * 0.9, ZEM + 1.6, 0.38), m.altin)
    }
    ek(kutuG(G + 0.3, 0.16, 0.5).translate(0, TEPE, 0.2), m.altinKoyu)
    // Tepelik: kıvrımlı alçı taç
    const tac = new THREE.Shape()
    tac.moveTo(-1.5, TEPE + 0.05); tac.bezierCurveTo(-1.25, TEPE + 0.5, -0.7, TEPE + 0.45, -0.55, TEPE + 0.85)
    tac.quadraticCurveTo(-0.25, TEPE + 0.9, 0, TEPE + 1.45); tac.quadraticCurveTo(0.25, TEPE + 0.9, 0.55, TEPE + 0.85)
    tac.bezierCurveTo(0.7, TEPE + 0.45, 1.25, TEPE + 0.5, 1.5, TEPE + 0.05); tac.closePath()
    ek(cikar(tac, 0.16, 0.08), m.altinKoyu)
    // Basamak benzeri kaide
    ek(kutuG(G + 0.2, 0.2, 0.7).translate(0, ZEM + 0.1, 0.3), m.mermer)
  }
  mihrap()

  // --- Minber: 2014'te yerine konulan ahşap minber; biçim temsilî ---
  const minber = () => {
    const my = (MINBER.x0 + MINBER.x1) / 2, en = MINBER.x1 - MINBER.x0
    const koyu = m.mihrapKirmizi
    const yan = new THREE.Shape()
    const L = MINBER.rampa1 - MINBER.z0
    yan.moveTo(0, ZEM); yan.lineTo(MINBER.z1 - MINBER.z0, ZEM); yan.lineTo(MINBER.z1 - MINBER.z0, ZEM + MINBER.h + 1); yan.lineTo(L, ZEM + MINBER.h + 1)
    yan.lineTo(MINBER.rampa0 - MINBER.z0, ZEM + 1); yan.lineTo(0, ZEM + 1); yan.closePath()
    for (const s of [-1, 1]) {
      k.ekle(yer(cikar(yan, 0.1, 0).rotateY(-Math.PI / 2), my + s * (en / 2 + 0.05) + 0.05, 0, MINBER.z0), m.kundekari)
    }
    // Basamaklar
    const N = 9
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N, h = t * MINBER.h, dz = (MINBER.rampa1 - MINBER.rampa0) / N
      kutu(en, h, dz + 0.01, koyu, my, ZEM + h / 2, MINBER.rampa0 + (i + 0.5) * dz)
    }
    // Köşk: kırmızı gövde, sivri külah
    kutu(en + 0.2, MINBER.h + 2.5, MINBER.z1 - MINBER.rampa1, koyu, my, ZEM + (MINBER.h + 2.5) / 2, (MINBER.z1 + MINBER.rampa1) / 2)
    kutu(en + 0.3, 0.1, MINBER.z1 - MINBER.rampa1 + 0.1, m.altin, my, ZEM + MINBER.h + 2.5, (MINBER.z1 + MINBER.rampa1) / 2)
    k.ekle(yer(duzGolge(silindirG(0.05, 0.85, 1.6, 8)), my, ZEM + MINBER.h + 3.3, (MINBER.z1 + MINBER.rampa1) / 2), koyu)
    alem(k, my, ZEM + MINBER.h + 4.1, (MINBER.z1 + MINBER.rampa1) / 2, m.altin, 0.8)
    // Kapı: iki söve ve lento, içinden geçilir
    for (const s of [-1, 1]) kutu(0.13, 3, 0.4, m.kundekari, my + s * 0.685, ZEM + 1.5, MINBER.z0 + 0.1)
    kutu(en + 0.25, 0.5, 0.42, koyu, my, ZEM + 3.05, MINBER.z0 + 0.1)
  }
  minber()

  // --- Duvar aplikleri: sıcak ışık noktaları ---
  const aplik = (x: number, y: number, z: number) => {
    k.ekle(new THREE.SphereGeometry(0.12, 8, 6).translate(x, y, z), m.lamba)
    k.ekle(yer(kutuG(0.05, 0.05, 0.3), x, y + 0.2, z), m.bronz)
    for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]])
      k.ekle(new THREE.PlaneGeometry(0.9, 0.9).rotateX(rx).rotateY(ry).translate(x, y, z), m.lambaHale)
  }
  ikiYan((s) => {
    for (const z of [8.2, 13.8]) aplik(s * (A - 0.3), 6.2, z)
    aplik(s * 13.4, 5, COURT_Z - 4)
    aplik(s * 13.4, 5, COURT_Z + 4)
    aplik(s * 4.8, 5, -6.4)
    aplik(s * 4, 5.4, -10)
  })

  // --- Minareler: batıdaki 1904 tarihli (s. 117); ikisi de tuğla gövde, tek şerefe ---
  const minare = (x: number, z: number, kursunKulah: boolean) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z), mal)
    ek(kutuG(3.1, 9.2, 3.1).translate(0, 4.6, 0), d.almasikCami)
    ek(duzGolge(silindirG(1.5, 2.1, 1.8, 8).rotateY(Math.PI / 8).translate(0, 10.1, 0)), m.tugla)
    ek(silindirG(1.32, 1.42, 13.4, 24).translate(0, 17.7, 0), m.tugla)
    for (const y of [11.2, 15, 19.5]) ek(silindirG(1.46, 1.46, 0.24, 24).translate(0, y, 0), m.mermer)
    ek(silindirG(1.45, 1.45, 0.42, 24).translate(0, 23.6, 0), d.ciniFiruze)
    // Şerefe: taş kuşak ve dolu korkuluk (fotoğrafa göre)
    ek(dondurG([[1.34, 23.8], [1.9, 24.5], [1.95, 24.8], [1.95, 26], [1.75, 26.1]], 24), m.mermer)
    ek(silindirG(1.05, 1.15, 5, 24).translate(0, 28.4, 0), m.tugla)
    ek(silindirG(1.2, 1.2, 0.2, 24).translate(0, 30.9, 0), m.mermer)
    if (kursunKulah) ek(dondurG([[1.25, 31], [0.95, 31.5], [0.1, 35], [0, 35.4]], 12), m.kursun)
    else ek(dondurG([[1.1, 31], [0.9, 31.7], [0.75, 32.5], [0.55, 33.6], [0.2, 34.8], [0, 35.2]], 16), m.mermer)
    alem(k, x, 35.2, z, m.bronz, 0.9)
  }
  minare(15.6, -9.6, true)
  minare(-15.6, -9.6, false)
}
