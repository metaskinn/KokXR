// Ulu Camii maketinin iç mekânı. Paye düzeni ve şadırvanın yeri envanterden; kemer, kubbe içi, mihrap,
// minber, şadırvan ve avize biçimleri arşiv fotoğraflarına bakılarak temsilî yorumlanmıştır.
// Hat yazısı taklit edilmez: panolar ve süslemeler yalnız bitkisel ve geometrik motif taşır.
import * as THREE from 'three'
import {
  DUVAR, GOZ_X, GOZ_Z, H, KASNAK_TABAN, Kova, OCTA, SADIRVAN_SATIR, SADIRVAN_SUTUN, SATIR, SUTUN, YX, YZ,
  cikar, dikdortgen, dondurG, duzGolge, gozAcikligi, gozOlcusu, kemer, kutuG, px, pz, silindirG, yer,
} from './ulucamiParca'
import { KAPI_Z, KURSU, MAHFIL } from './ulucamiDetay'
import { AHSAP_KURSU, MAHFIL_ALT_KORKULUK, minberYap, parmaklik } from './ulucami/minber'
import type { UlucamiMalzemeleri } from './ulucamiDokular'

const ZEMIN = 0.7
/** İç döşemenin (halının) üst yüzü: ulucamiMaket'teki halı y 0.65, kalınlık 0.1. */
export const ZEMIN_Y = ZEMIN

export interface IcDurak { id: string; ad: string; konum: [number, number, number]; bak: [number, number, number] }

const sx = px(SADIRVAN_SUTUN + 0.5), sz = pz(SADIRVAN_SATIR + 0.5)
// Minber, batıdaki kemerin doğu yüzüne yaslanır: köşkün üstü kemerde kaybolmaz, alem açıkta kalır (fotoğraflardaki gibi).
const MIHRAP_Z = YZ - DUVAR, MINBER_X = -5.4
const MINBER_BOY = 7.2, MINBER_EN = 1.9, MINBER_TEPE = 4.7, MINBER_Z0 = MIHRAP_Z - 1.05 - MINBER_BOY
/** Minber merdiveni: kapı eşiğinden köşk önüne yükselen eğim. */
const MINBER_RAMPA = { s0: 0.75, s1: 6.05, h1: 5.1 }
const MAHFIL_H = 3.8
const minberH = (s: number) => ((s - MINBER_RAMPA.s0) / (MINBER_RAMPA.s1 - MINBER_RAMPA.s0)) * MINBER_RAMPA.h1
const GOZ_Y = 2.7

export const icDuraklar: IcDurak[] = [
  { id: 'giris', ad: 'Giriş', konum: [0, 2.7, -24.6], bak: [0, 4.4, 10] },
  { id: 'sadirvan', ad: 'Şadırvan', konum: [3, 3.1, -13.6], bak: [0, 1.4, -6.9] },
  { id: 'mihrap', ad: 'Mihrap', konum: [0, 2.8, 14.5], bak: [0, 6.4, MIHRAP_Z] },
  { id: 'minber', ad: 'Minber', konum: [0.4, 2.8, 16], bak: [MINBER_X, 5.6, 21] },
  { id: 'kapi', ad: 'Doğu kapısı', konum: [23.5, 2.7, KAPI_Z], bak: [YX, 3.8, KAPI_Z] },
  { id: 'kabe', ad: 'Kâbe örtüsü', konum: [23, 2.8, pz(0.5)], bak: [YX, 7.2, pz(0.5)] },
  { id: 'levha', ad: 'Levha', konum: [13.8, 2.8, 13], bak: [13.8, 7, 24.5] },
  { id: 'kubbe', ad: 'Kubbe', konum: [-13.8, 2.4, 3.2], bak: [-13.8, 21, 7.6] },
  // Yapıların üstü: yürüyerek de çıkılır, bu duraklar kısa yoldur.
  { id: 'minber-ust', ad: 'Minbere çık', konum: [MINBER_X, GOZ_Y + minberH(4.6), MINBER_Z0 + 4.6], bak: [8, 4, 3] },
  { id: 'kursu-ust', ad: 'Kürsüye çık', konum: [KURSU.x - 0.1, GOZ_Y + 2.2, KURSU.z], bak: [-4, 5, 2] },
  { id: 'mahfil-ust', ad: 'Mahfile çık', konum: [MAHFIL.x, GOZ_Y + MAHFIL_H, MAHFIL.z], bak: [0, 6.4, MIHRAP_Z] },
]

/** `ust`: oyuncu bu yüksekliğin üstündeyse kutu engellemez (ör. platformun altındaki sütun). */
export interface Kutu { x0: number; x1: number; z0: number; z1: number; ust?: number }
/** Üstünde yürünen alan: yükseklik z boyunca h0'dan h1'e değişir. `altGecilir` değilse aşağıdan duvar gibi davranır. */
export interface ZeminAlani { x0: number; x1: number; z0: number; z1: number; h0: number; h1: number; altGecilir?: boolean }
export interface IcYurume { sinir: Kutu; kutular: Kutu[]; daireler: { x: number; z: number; r: number; ust?: number }[]; zeminler: ZeminAlani[]; gorusKesenler: Kutu[]; gozY: number; /** İç döşemenin üst yüzü; verilmezse ZEMIN_Y. */ tabanY?: number }

/** İçeride yürürken çarpılan yapılar (kuşbakışı). Payeler bakışı da keser. */
export function icYurumeAlani(): IcYurume {
  const kutu = (x: number, z: number, g: number, d: number): Kutu => ({ x0: x - g / 2, x1: x + g / 2, z0: z - d / 2, z1: z + d / 2 })
  const payeler: Kutu[] = []
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++) payeler.push(kutu(px(i), pz(j), 3.3, 3.3))
  const dolapli = payeler.map((p) => ({ ...p, z0: p.z0 - 0.42, z1: p.z1 + 0.42 }))
  const korkuluklar: Kutu[] = []
  for (const s of [-1, 1]) for (const k of [-1, 1]) {
    korkuluklar.push(kutu(sx + s * 5.15, sz + k * 3, 0.2, 3.6))
    korkuluklar.push(kutu(sx + s * 2.95, sz + k * 5.15, 3.8, 0.2))
  }
  const mahfil: Kutu[] = []
  for (const a of [-3.1, -1.03, 1.03, 3.1]) for (const b of [-MAHFIL.enZ, MAHFIL.enZ]) mahfil.push({ ...kutu(MAHFIL.x + a, MAHFIL.z + b, 0.25, 0.25), ust: 3 })
  const mx = MAHFIL.x, mz = MAHFIL.z, kx = KURSU.x, kz = KURSU.z, kr = KURSU.r
  const minberKutu = (x0: number, x1: number, z0: number, z1: number): Kutu => ({ x0: MINBER_X + x0, x1: MINBER_X + x1, z0: MINBER_Z0 + z0, z1: MINBER_Z0 + z1 })
  const MY = MINBER_EN / 2
  return {
    sinir: { x0: -YX + DUVAR, x1: YX - DUVAR, z0: -YZ + DUVAR, z1: YZ - DUVAR },
    kutular: [
      ...dolapli, ...korkuluklar, ...mahfil,
      ...[[sx - 4.3, sz - 4.3], [sx + 4.3, sz - 4.3], [sx - 4.3, sz + 4.3], [sx + 4.3, sz + 4.3]].map(([x, z]) => kutu(x, z, 0.85, 0.55)),
      { x0: -3.55, x1: 3.55, z0: MIHRAP_Z - 0.85, z1: MIHRAP_Z }, // mihrap
      // Minber: yan duvarlar, kapı sövesi ve köşk engeldir; aradaki merdivenden yürünür.
      minberKutu(-MY - 0.07, -MY + 0.07, 0.7, MINBER_BOY), minberKutu(MY - 0.07, MY + 0.07, 0.7, MINBER_BOY),
      minberKutu(-MY - 0.1, -0.65, 0, 0.7), minberKutu(0.65, MY + 0.1, 0, 0.7),
      minberKutu(-MY, MY, 6.05, MIHRAP_Z - MINBER_Z0), // köşk duvara dayanır
      { x0: MINBER_X + 1.6, x1: MINBER_X + 1.8, z0: MIHRAP_Z - 9.4, z1: MIHRAP_Z }, // minber korkuluğu
      kutu(AHSAP_KURSU.x, AHSAP_KURSU.z + 0.2, 1.8, 2.2), // ahşap vaaz kürsüsü
      // Mahfilin alt korkuluğu: platformda yürürken engellemez
      ...MAHFIL_ALT_KORKULUK.map(([a, b, c, d]) => ({ x0: MAHFIL.x + Math.min(a, c) - 0.08, x1: MAHFIL.x + Math.max(a, c) + 0.08, z0: MAHFIL.z + Math.min(b, d) - 0.08, z1: MAHFIL.z + Math.max(b, d) + 0.08, ust: 3 })),
      // Ön korkuluğun batısı açıktır: kapının karşısı paye olduğu için minbere bu yandan gelinir.
      { x0: MINBER_X + 0.8, x1: MINBER_X + 1.7, z0: MIHRAP_Z - 9.5, z1: MIHRAP_Z - 9.3 },
    ],
    daireler: [{ x: sx, z: sz, r: 3.75 }, { x: kx, z: kz, r: kr + 0.05, ust: 1.2 }],
    zeminler: [
      // Mahfil: alttan geçilir, merdiven kuzeydoğudan çıkar.
      { x0: mx - 3.35, x1: mx + 3.35, z0: mz - 2.35, z1: mz + 2.3, h0: MAHFIL_H, h1: MAHFIL_H, altGecilir: true },
      { x0: mx + 2.05, x1: mx + 3.25, z0: mz - 6.8, z1: mz - 2.35, h0: 0, h1: 3.62 },
      // Minber merdiveni
      { x0: MINBER_X - MY, x1: MINBER_X + MY, z0: MINBER_Z0 + MINBER_RAMPA.s0, z1: MINBER_Z0 + MINBER_RAMPA.s1, h0: 0, h1: MINBER_RAMPA.h1 },
      // Kürsü: basamaklar, giriş ve iç zemin
      { x0: kx - 0.42, x1: kx + 0.42, z0: kz - kr - 1.7, z1: kz - kr, h0: 0, h1: 2.1 },
      { x0: kx - 0.42, x1: kx + 0.42, z0: kz - kr, z1: kz - 0.7, h0: 2.2, h1: 2.2 },
      { x0: kx - 0.72, x1: kx + 0.72, z0: kz - 0.72, z1: kz + 0.72, h0: 2.2, h1: 2.2 },
    ],
    gorusKesenler: payeler,
    gozY: GOZ_Y,
  }
}

/** Kare gözden dairesel kasnağa geçen pandantif yüzey (kare taban → daire ağız). */
function pandantifG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, R: number) {
  const SEG = 64, SIRA = 7
  const konum: number[] = [], uv: number[] = [], dizin: number[] = []
  for (let s = 0; s <= SIRA; s++) {
    const t = s / SIRA, e = Math.pow(t, 0.72)
    for (let a = 0; a <= SEG; a++) {
      const teta = (a / SEG) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
      const uzak = Math.min(dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity, dz > 0 ? (z1 - cz) / dz : dz < 0 ? (z0 - cz) / dz : Infinity)
      const r = THREE.MathUtils.lerp(uzak, R, e)
      konum.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / SEG, t)
    }
  }
  for (let s = 0; s < SIRA; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    dizin.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(dizin)
  g.computeVertexNormals()
  return g
}

export function ulucamiIcMekani(m: UlucamiMalzemeleri, k: Kova, kCati: Kova, kKasnak: Kova, kKubbe: Kova) {
  const kutu = (g: number, h: number, d: number, mal: THREE.Material, x: number, y: number, z: number, kv = k) =>
    kv.ekle(yer(kutuG(g, h, d), x, y, z), mal)

  // --- Payeler: mermer kaide, boyalı yüzler, başlık silmesi ---
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++) {
    const x = px(i), z = pz(j)
    k.ekle(yer(new THREE.BoxGeometry(3, H - ZEMIN, 3), x, (H - ZEMIN) / 2 + ZEMIN, z), m.paye)
    kutu(3.24, 0.5, 3.24, m.icMermer, x, ZEMIN + 0.25, z)
    kutu(3.3, 0.22, 3.3, m.krem, x, 7.32, z)
    kutu(3.42, 0.09, 3.42, m.koyu, x, 7.47, z)
  }

  // --- Sivri kemerler: dolgu ve kemer yüzünde bitkisel bant ---
  const icKemer = (a: number, b: number, sabit: number, xBoyunca: boolean) => {
    const o = (b - a) / 2, orta = (a + b) / 2
    const dolu = new THREE.Shape()
    dolu.moveTo(-o, 7.4)
    dolu.quadraticCurveTo(-o, 10.2, 0, 12.3)
    dolu.quadraticCurveTo(o, 10.2, o, 7.4)
    dolu.lineTo(o, H); dolu.lineTo(-o, H); dolu.closePath()
    // Yalnız kemerin iki yüzünde boyalı bant; alt yüz sade kalır
    const bant = new THREE.Shape()
    bant.moveTo(-o, 7.4)
    bant.quadraticCurveTo(-o, 10.2, 0, 12.3)
    bant.quadraticCurveTo(o, 10.2, o, 7.4)
    bant.lineTo(o, 8.2)
    bant.quadraticCurveTo(o - 0.25, 10.75, 0, 12.92)
    bant.quadraticCurveTo(-o + 0.25, 10.75, -o, 8.2)
    bant.closePath()
    const ry = xBoyunca ? 0 : Math.PI / 2
    const [x, z] = xBoyunca ? [orta, sabit] : [sabit, orta]
    k.ekle(yer(cikar(dolu, 2, -1), x, 0, z, ry), m.ic)
    for (const yuz of [-1.03, 1]) k.ekle(yer(cikar(bant, 0.03, yuz), x, 0, z, ry), m.kemerBant)
  }
  for (let j = 1; j < SATIR; j++) for (let i = 0; i < SUTUN; i++)
    icKemer(i === 0 ? -YX + DUVAR : px(i) + 1.5, i === SUTUN - 1 ? YX - DUVAR : px(i + 1) - 1.5, pz(j), true)
  for (let i = 1; i < SUTUN; i++) for (let j = 0; j < SATIR; j++)
    icKemer(j === 0 ? -YZ + DUVAR : pz(j) + 1.5, j === SATIR - 1 ? YZ - DUVAR : pz(j + 1) - 1.5, px(i), false)

  // --- Tavan: pandantif, iç kasnak ve ışık alan pencereler, boyalı iç kubbe, avize ---
  for (let i = 0; i < SUTUN; i++) for (let j = 0; j < SATIR; j++) {
    const x = px(i + 0.5), z = pz(j + 0.5)
    const acik = i === SADIRVAN_SUTUN && j === SADIRVAN_SATIR
    const { kasnakH, kubbeH } = gozOlcusu(i)
    const { x0, x1, z0, z1 } = gozAcikligi(i, j)
    kCati.ekle(pandantifG(x, z, x0, x1, z0, z1, H - 0.05, KASNAK_TABAN, 5.25), m.pandantif)

    kKasnak.ekle(yer(duzGolge(silindirG(5.74, 5.74, kasnakH, 8, true).rotateY(Math.PI / 8)), x, KASNAK_TABAN + kasnakH / 2, z), m.ic)
    const yuz = 5.74 * OCTA - 0.03, pH = Math.min(0.95, kasnakH - 1.3), y0 = KASNAK_TABAN + (kasnakH - pH - 0.55) / 2
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4
      kKasnak.ekle(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0 - 0.12, 1.45, pH + 0.12, 1), 8).translate(0, 0, yuz), x, 0, z, a), m.bronz)
      kKasnak.ekle(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, 1.12, pH, 0.8), 8).translate(0, 0, yuz - 0.02), x, 0, z, a), m.camKafes)
    }

    const kY = KASNAK_TABAN + kasnakH
    const profil: [number, number][] = [[5.78, -0.02]]
    for (let t = 0; t <= 18; t++) {
      const a = (t / 18) * Math.PI / 2
      const r = 5.38 * Math.pow(Math.cos(a), 0.86)
      if (acik && r < 2.15) break
      profil.push([Math.max(r, 0.001), (kubbeH - 0.35) * Math.pow(Math.sin(a), 1.08)])
    }
    kKubbe.ekle(yer(dondurG(profil, 64, [1, acik ? 0.82 : 1]), x, kY, z), m.icKubbe)

    if (acik) {
      // Camın ardındaki gökyüzü: yalnız aşağıdan görünür, dıştan bakınca yok sayılır.
      const son = profil[profil.length - 1]
      const gok = new THREE.CircleGeometry(son[0] + 0.4, 32).rotateX(Math.PI / 2).translate(x, kY + son[1] + 1.1, z)
      kKubbe.ekle(gok, m.gok)
      continue
    }

    // Mihrabın ve Kâbe örtüsünün önü boş kalır
    if ((i === 2 && j === SATIR - 1) || (i === SUTUN - 1 && j === 0)) continue

    // Halka avize: dört askı, halka ve lambalar
    const ay = 5.6, R = 2.1, tepe = kY + kubbeH - 0.5
    k.ekle(new THREE.TorusGeometry(R, 0.035, 6, 36).rotateX(Math.PI / 2).translate(x, ay, z), m.altin)
    k.ekle(new THREE.TorusGeometry(R * 0.55, 0.025, 6, 24).rotateX(Math.PI / 2).translate(x, ay + 0.55, z), m.altin)
    for (let n = 0; n < 4; n++) {
      const a = n * Math.PI / 2 + Math.PI / 4
      const ax = x + Math.sin(a) * R, az = z + Math.cos(a) * R
      const uzunluk = Math.hypot(ax - x, tepe - ay, az - z)
      const ip = new THREE.CylinderGeometry(0.014, 0.014, uzunluk, 4)
      ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x - ax, tepe - ay, z - az).normalize()))
      ip.translate((ax + x) / 2, (ay + tepe) / 2, (az + z) / 2)
      k.ekle(ip, m.koyu)
    }
    for (let n = 0; n < 14; n++) {
      const a = (n / 14) * Math.PI * 2
      k.ekle(new THREE.SphereGeometry(0.085, 8, 6).translate(x + Math.sin(a) * R, ay - 0.2, z + Math.cos(a) * R), m.lamba)
      // Çapraz üç düzlemli hale: her bakış açısından yuvarlak parıltı gibi görünür.
      for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) {
        k.ekle(new THREE.PlaneGeometry(0.8, 0.8).rotateX(rx).rotateY(ry).translate(x + Math.sin(a) * R, ay - 0.2, z + Math.cos(a) * R), m.lambaHale)
      }
    }
  }

  // --- Mihrap: renkli bantlı çerçeve, süslemeli köşelikler, altın mukarnaslı niş ---
  const mihrap = () => {
    const ek = (g: THREE.BufferGeometry, mal: THREE.Material) => k.ekle(yer(g, 0, 0, MIHRAP_Z, Math.PI), mal)
    // Oranlar mihrap.jpg'ye göre: fotoğrafın 1600 px genişliği çerçevenin G metresine denk gelir.
    const G = 6.9, TEPE = 8.75, DER = 0.75, NIS_G = 3.22, NIS_DUZ = 4.35, NIS_K = 2.6
    const FOTO_H = G * (1148 / 1600), FOTO_ALT = TEPE - FOTO_H
    const blok = dikdortgen(-G / 2, ZEMIN, G / 2, TEPE)
    blok.holes.push(kemer(new THREE.Path(), 0, ZEMIN + 0.02, NIS_G, NIS_DUZ, NIS_K))
    ek(cikar(blok, DER), m.bezeme)
    // Üst bölüm: fotoğraf, niş kemeri boşaltılarak
    const on = dikdortgen(-G / 2, FOTO_ALT, G / 2, TEPE)
    on.holes.push(kemer(new THREE.Path(), 0, FOTO_ALT + 0.01, NIS_G, ZEMIN + NIS_DUZ - FOTO_ALT, NIS_K))
    const onG = new THREE.ShapeGeometry(on, 16).translate(0, 0, DER + 0.012)
    const onP = onG.attributes.position, onUV = onG.attributes.uv
    for (let i = 0; i < onP.count; i++) onUV.setXY(i, (onP.getX(i) + G / 2) / G, (onP.getY(i) - FOTO_ALT) / FOTO_H)
    ek(onG, m.mihrapOn)
    // Alt bölüm: fotoğraftaki yan bantların devamı (kırpılan bölge fotoğrafın 150-869 px arası)
    for (const s of [-1, 1]) {
      const yan = new THREE.PlaneGeometry((G - NIS_G) / 2, FOTO_ALT - ZEMIN).translate(s * (G + NIS_G) / 4, (FOTO_ALT + ZEMIN) / 2, DER + 0.012)
      const p = yan.attributes.position, uv = yan.attributes.uv
      for (let i = 0; i < p.count; i++) {
        const v = (p.getY(i) - ZEMIN) / (FOTO_ALT - ZEMIN)
        uv.setXY(i, (p.getX(i) + G / 2) / G, 1 - (869 - v * 719) / 1148)
      }
      ek(yan, m.mihrapOn)
    }
    ek(kutuG(G + 0.05, 0.1, DER + 0.08).translate(0, FOTO_ALT, DER / 2 + 0.02), m.altinKoyu)
    ek(kutuG(G + 0.3, 0.16, DER + 0.2).translate(0, TEPE + 0.02, DER / 2 + 0.04), m.altinKoyu)
    for (const s of [-1, 1]) ek(kutuG(0.1, TEPE - ZEMIN, DER + 0.08).translate(s * (G / 2 + 0.02), (TEPE + ZEMIN) / 2, DER / 2 + 0.02), m.altinKoyu)
    // Niş içi: açık zemin, sütunçeler, altın kuşak
    ek(kutuG(NIS_G, NIS_DUZ + NIS_K + 0.3, 0.1).translate(0, ZEMIN + (NIS_DUZ + NIS_K + 0.3) / 2, 0.08), m.ic)
    const nisIc = kemer(new THREE.Shape(), 0, ZEMIN + 0.3, 1.9, 2.5, 1)
    ek(new THREE.ShapeGeometry(nisIc, 10).translate(0, 0, 0.15), m.krem)
    const nb = new THREE.Shape()
    kemer(nb, 0, ZEMIN + 0.3, 2.25, 2.5, 1.2)
    nb.holes.push(kemer(new THREE.Path(), 0, ZEMIN + 0.3, 1.9, 2.5, 1))
    ek(cikar(nb, 0.05, 0.14), m.altin)
    for (const s of [-1, 1]) {
      const sut = NIS_DUZ - 0.3
      ek(dondurG([[0.18, 0], [0.09, sut * 0.5], [0.18, sut]], 14).translate(s * (NIS_G / 2 - 0.14), ZEMIN, DER - 0.15), m.ic)
      ek(new THREE.TorusGeometry(0.1, 0.02, 6, 16).rotateX(Math.PI / 2).translate(s * (NIS_G / 2 - 0.14), ZEMIN + sut * 0.5, DER - 0.15), m.altin)
      ek(silindirG(0.2, 0.15, 0.32, 12).translate(s * (NIS_G / 2 - 0.14), ZEMIN + NIS_DUZ - 0.2, DER - 0.15), m.altin)
    }
    const hat = ZEMIN + NIS_DUZ - 0.1
    ek(kutuG(NIS_G, 0.34, DER - 0.1).translate(0, hat - 0.2, DER / 2), m.mihrapYesil)
    ek(kutuG(NIS_G, 0.08, DER - 0.05).translate(0, hat, DER / 2), m.altin)
    // Altın mukarnas: daralan kademeler, her kademede kemerli hücreler
    const KADEME = 8
    for (let i = 0; i < KADEME; i++) {
      const o = 1 - i / KADEME
      const g = (NIS_G - 0.05) * Math.pow(o, 0.82), dr = 0.6 * o + 0.08, h = (NIS_K + 0.3) / KADEME, y = hat + 0.04 + i * h
      ek(kutuG(g, h * 0.86, dr).translate(0, y + h * 0.43, dr / 2 + 0.05), m.altinKoyu)
      const n = Math.max(1, Math.floor(g / 0.55)), adim = g / n
      for (let j = 0; j < n; j++) {
        const x = -g / 2 + (j + 0.5) * adim
        const hucre = new THREE.SphereGeometry(adim * 0.46, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
        hucre.scale(1, (h * 0.86) / (adim * 0.46), 0.5)
        hucre.translate(x, y + 0.01, dr + 0.05)
        ek(hucre, m.altin)
        ek(kutuG(adim * 0.12, h * 0.5, 0.1).translate(x + adim / 2, y + h * 0.2, dr + 0.08), m.altin)
      }
    }
  }
  mihrap()

  // --- Minber ve alçak korkuluğu: ulucami/minber.ts ---
  minberYap(m, k, { x: MINBER_X, z0: MINBER_Z0, boy: MINBER_BOY, en: MINBER_EN, tepe: MINBER_TEPE, duvarZ: MIHRAP_Z, zemin: ZEMIN })
  parmaklik(m, k, MINBER_X + 1.7, MIHRAP_Z - 9.4, MINBER_X + 1.7, MIHRAP_Z - 1, ZEMIN)
  parmaklik(m, k, MINBER_X + 0.8, MIHRAP_Z - 9.4, MINBER_X + 1.7, MIHRAP_Z - 9.4, ZEMIN)

  // --- Şadırvan: mermer zemin, on altı köşeli havuz, kademeli fıskiye, tabureler, sarkan fener, korkuluk ---
  // Fotoğraflarda şadırvan gözünün halısı zeytin yeşilidir.
  kutu(GOZ_X, 0.02, GOZ_Z, m.haliZeytin, sx, ZEMIN + 0.01, sz)
  kutu(GOZ_X - 3.2, 0.1, GOZ_Z - 3.2, m.mermerDoseme, sx, ZEMIN + 0.05, sz)
  k.ekle(yer(duzGolge(silindirG(3.55, 3.75, 1, 16)), sx, ZEMIN + 0.6, sz), m.icMermer)
  for (let n = 0; n < 16; n++) {
    const a = (n + 0.5) * Math.PI / 8
    k.ekle(yer(kutuG(0.62, 0.48, 0.04).translate(0, ZEMIN + 0.62, 3.66), sx, 0, sz, a), m.icMermer)
  }
  k.ekle(yer(duzGolge(dondurG([[3.42, 0], [3.42, 0.14], [3.72, 0.14], [3.72, 0]], 16)), sx, ZEMIN + 1.08, sz), m.icMermer)
  k.ekle(yer(silindirG(3.46, 3.46, 0.02, 40), sx, ZEMIN + 1.13, sz), m.su)
  k.ekle(yer(dondurG([[0.72, 0], [0.24, 0.6], [0.95, 0.85], [1, 0.95], [0.2, 1.05], [0.15, 1.5], [0.58, 1.7], [0.62, 1.8], [0.12, 1.88], [0.09, 2.2], [0.25, 2.34], [0.03, 2.65], [0, 2.7]], 20), sx, ZEMIN + 1.05, sz), m.icMermer)
  for (let n = 0; n < 14; n++) {
    const a = (n / 14) * Math.PI * 2, r = 4.25
    k.ekle(yer(dondurG([[0.12, 0], [0.09, 0.14], [0.19, 0.36], [0, 0.38]], 10), sx + Math.sin(a) * r, ZEMIN + 0.1, sz + Math.cos(a) * r), m.mermerKoyu)
  }
  const gokY = KASNAK_TABAN + gozOlcusu(SADIRVAN_SUTUN).kasnakH + 3.6
  // Kubbe açıklığından havuza inen ışık sütunu
  k.ekle(yer(new THREE.CylinderGeometry(2, 3.3, gokY - 1.5 - ZEMIN - 1.2, 28, 1, true), sx, (gokY - 1.5 + ZEMIN + 1.2) / 2, sz), m.isikSutunu)
  k.ekle(yer(silindirG(0.018, 0.018, gokY - 6, 5), sx, (gokY + 6) / 2, sz), m.koyu)
  k.ekle(yer(duzGolge(silindirG(0.3, 0.42, 0.7, 8)), sx, 5.6, sz), m.altin)
  k.ekle(yer(duzGolge(silindirG(0.05, 0.36, 0.34, 8)), sx, 6.1, sz), m.altin)
  for (const s of [-1, 1]) {
    kutu(0.14, 0.72, 3.6, m.ahsapKafes, sx + s * 5.15, ZEMIN + 0.46, sz - 3)
    kutu(0.14, 0.72, 3.6, m.ahsapKafes, sx + s * 5.15, ZEMIN + 0.46, sz + 3)
    kutu(3.8, 0.72, 0.14, m.ahsapKafes, sx + s * 2.95, ZEMIN + 0.46, sz + 5.15)
    kutu(3.8, 0.72, 0.14, m.ahsapKafes, sx + s * 2.95, ZEMIN + 0.46, sz - 5.15)
    kutu(3.9, 0.08, 0.2, m.ahsap, sx + s * 2.95, ZEMIN + 0.86, sz + 5.15)
    kutu(3.9, 0.08, 0.2, m.ahsap, sx + s * 2.95, ZEMIN + 0.86, sz - 5.15)
  }
}
