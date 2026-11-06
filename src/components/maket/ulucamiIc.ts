// Ulu Camii maketinin iç mekânı. Paye düzeni ve şadırvanın yeri envanterden; kemer, kubbe içi, mihrap,
// minber, şadırvan ve avize biçimleri arşiv fotoğraflarına bakılarak temsilî yorumlanmıştır.
// Hat yazısı taklit edilmez: panolar ve süslemeler yalnız bitkisel ve geometrik motif taşır.
import * as THREE from 'three'
import {
  DUVAR, H, KASNAK_TABAN, Kova, OCTA, SADIRVAN_SATIR, SADIRVAN_SUTUN, SATIR, SUTUN, YX, YZ,
  dondurG, duzGolge, gozAcikligi, gozOlcusu, kemer, px, pz, silindirG, yer,
} from './ulucamiParca'
import { KABE_VITRIN } from './ulucami/icduvar'
import { KAPI_Z, KURSU, MAHFIL } from './ulucamiDetay'
import { sadirvan } from './ulucami/sadirvan'
import { AHSAP_KURSU, MAHFIL_ALT_KORKULUK, minberYap, parmaklik } from './ulucami/minber'
import type { UlucamiMalzemeleri } from './ulucamiDokular'
import { MIHRAP, SAMDAN, ulucamiMihrabi } from './ulucami/mihrap'
import { kemerleriKur, payeleriKur } from './ulucami/payeler'

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
  { id: 'kabe', ad: 'Kâbe örtüsü', konum: [26.5, 2.8, pz(0.5)], bak: [YX, 2.5, pz(0.5)] },
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
      ...dolapli, ...korkuluklar, ...mahfil, KABE_VITRIN,
      ...[[sx - 4.3, sz - 4.3], [sx + 4.3, sz - 4.3], [sx - 4.3, sz + 4.3], [sx + 4.3, sz + 4.3]].map(([x, z]) => kutu(x, z, 0.85, 0.55)),
      { x0: -MIHRAP.G / 2 - 0.05, x1: MIHRAP.G / 2 + 0.05, z0: MIHRAP_Z - MIHRAP.DER - 0.05, z1: MIHRAP_Z }, // mihrap
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
    daireler: [{ x: sx, z: sz, r: 3.75 }, { x: kx, z: kz, r: kr + 0.05, ust: 1.2 }, ...[-1, 1].map((s) => ({ x: s * SAMDAN.x, z: MIHRAP_Z - SAMDAN.z, r: SAMDAN.r }))],
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

  // --- Payeler ve sivri kemerler: ulucami/payeler.ts ---
  payeleriKur(m, k)
  kemerleriKur(m, k)

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

  // --- Mihrap: arşiv fotoğrafından cephe, kabartma kademeleri, mukarnas (ulucami/mihrap.ts) ---
  ulucamiMihrabi(k, MIHRAP_Z, ZEMIN, m)

  // --- Minber ve alçak korkuluğu: ulucami/minber.ts ---
  minberYap(m, k, { x: MINBER_X, z0: MINBER_Z0, boy: MINBER_BOY, en: MINBER_EN, tepe: MINBER_TEPE, duvarZ: MIHRAP_Z, zemin: ZEMIN })
  parmaklik(m, k, MINBER_X + 1.7, MIHRAP_Z - 9.4, MINBER_X + 1.7, MIHRAP_Z - 1, ZEMIN)
  parmaklik(m, k, MINBER_X + 0.8, MIHRAP_Z - 9.4, MINBER_X + 1.7, MIHRAP_Z - 9.4, ZEMIN)

  // --- Şadırvan: halı ve mermer döşeme ulucami/zemin.ts'te; havuz, fıskiye ve çevresi ulucami/sadirvan.ts'te ---
  sadirvan(m, k, { sx, sz, zemin: ZEMIN, gokY: KASNAK_TABAN + gozOlcusu(SADIRVAN_SUTUN).kasnakH + 3.6 })
}
