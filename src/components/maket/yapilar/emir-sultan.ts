// Emir Sultan Külliyesi temsilî maketi. Kaynak: Vakıf Eserleri Envanteri – Bursa, Yıldırım (s. 273-313) ve Drive'daki
// fotoğraflar. Kaynakta verilen ölçü: harim 15,20 × 15,20 m. Avlu, revak, türbe, hamam ve kuleler kuşbakışı fotoğraftan
// oranlanmıştır; yükseklikler temsilîdir. Birim metre. Kuzey -z, kıble (güney) +z, doğu +x.
// Kod yerel koordinatta yazılır: yerel z=0 avlunun ortasıdır, dünyaya geçerken OZ eklenir (kaide ortalansın diye).
import * as THREE from 'three'
import type { Maket } from '../ulucamiMaket'
import type { IcDurak, IcYurume, Kutu, ZeminAlani } from '../ulucamiIc'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import { Kova, type Mal, cikar, dikdortgen, dondurG, duzGolge, kutuG, silindirG, uvSigdir, yer } from '../ulucamiParca'
import { emirDokulari, gokMalzemesi } from './emir-sultan-yardim/dokular'

const OZ = -16
/** Kotlar: türbe zemini en alttadır (kaynak: avludan yaklaşık bir metre aşağıda). Yürüme yüksekliği bu kottan ölçülür. */
const TURBE_Y = 0.2, AVLU_Y = 1.2, HARIM_Y = 1.35
const GOZ = TURBE_Y + 1.7
const hAvlu = AVLU_Y - TURBE_Y, hHarim = HARIM_Y - TURBE_Y

/** Harim: kaynaktaki 15,20 × 15,20 m. */
const HARIM_YARI = 7.6, DUVAR = 1.7
const HARIM_Z0 = 12.9, HARIM_Z1 = HARIM_Z0 + 2 * HARIM_YARI, HARIM_ORTA = HARIM_Z0 + HARIM_YARI
const CAMI_DIS_X = HARIM_YARI + DUVAR, CAMI_Z0 = HARIM_Z0 - DUVAR, CAMI_Z1 = HARIM_Z1 + DUVAR, CAMI_L = CAMI_Z1 - CAMI_Z0

/** Harim içi düşey düzen (fotoğraftan oranlı). */
const BANT1 = HARIM_Y + 4.4, KORNIS = HARIM_Y + 8.8, TONOZ_TEPE = HARIM_Y + 14
const KEMER_YUK = TONOZ_TEPE - KORNIS
const KASNAK_ALT = TONOZ_TEPE, KASNAK_H = 2.3, KUBBE_IC_R = 7.3, KUBBE_IC_H = 6.1
const SACAK = 14.2, SACAK_ORTA = 16.5

/** Avlu ve revak: kuşbakışı fotoğraftan. */
const AVLU_X = 11, AVLU_Z = 6.5, REVAK_DIS_X = 15, REVAK_K_Z = -10, KOLON_H = 3.25, REVAK_UST = AVLU_Y + 4.35

/** Türbe: sekizgen. Dış ayna yarıçapı (apothem) ve merkez. */
const TURBE_Z = -19.2, TURBE_DIS = 7, TURBE_IC = 6.2, TURBE_H = 8.9, TURBE_KENAR = 2 * TURBE_DIS * Math.tan(Math.PI / 8)
/** Türbe girişi güneydoğu yüzündedir; koridor oraya kuzeye doğru iner (temsilî, kaynak: doğudan giriş). */
const GIRIS_X0 = 3.3, GIRIS_X1 = 5.5, GIRIS_Z = -15.4

/** Minber: bir hücrelik yürünebilir merdiven için gerçeğinden biraz geniş. */
const MINBER_X = -4.7, MINBER_EN = 1.7, MINBER_Z0 = HARIM_Z1 - 7.3, MINBER_RAMPA = { z0: MINBER_Z0 + 0.8, z1: MINBER_Z0 + 5.2, h: 3 }

function yuvarlakKemer<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, duz: number): P {
  const o = g / 2
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, y0 + duz)
  p.absarc(cx, y0 + duz, o, Math.PI, 0, true)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

/** Kaş kemer: sütun başından içbükey kalkıp ortada sivrilen, fotoğraftaki revak yayı. */
function kasKemer<P extends THREE.Path>(p: P, a: number, b: number, y0: number, h: number): P {
  const o = (b - a) / 2, m = (a + b) / 2
  p.moveTo(a, y0)
  p.bezierCurveTo(a + o * 0.02, y0 + h * 0.72, m - o * 0.42, y0 + h * 0.62, m, y0 + h)
  p.bezierCurveTo(m + o * 0.42, y0 + h * 0.62, b - o * 0.02, y0 + h * 0.72, b, y0)
  p.closePath()
  return p
}

/** Kuşak: üstü düz, altı kaş kemerli tek parça yüzey. */
function kusakSekli(a: number, b: number, y0: number, h: number, ust: number) {
  const o = (b - a) / 2, m = (a + b) / 2, s = new THREE.Shape()
  s.moveTo(a, y0)
  s.bezierCurveTo(a + o * 0.02, y0 + h * 0.72, m - o * 0.42, y0 + h * 0.62, m, y0 + h)
  s.bezierCurveTo(m + o * 0.42, y0 + h * 0.62, b - o * 0.02, y0 + h * 0.72, b, y0)
  s.lineTo(b, ust); s.lineTo(a, ust); s.closePath()
  return s
}

/** Kaş kemeri çeviren şerit: dış yay, sonra iç yay ters yönde. */
function kasSerit(a: number, b: number, y0: number, h: number, t: number) {
  const o = (b - a) / 2, m = (a + b) / 2, s = new THREE.Shape()
  const h2 = h + t
  s.moveTo(a, y0)
  s.bezierCurveTo(a + o * 0.02, y0 + h2 * 0.72, m - o * 0.42, y0 + h2 * 0.62, m, y0 + h2)
  s.bezierCurveTo(m + o * 0.42, y0 + h2 * 0.62, b - o * 0.02, y0 + h2 * 0.72, b, y0)
  const a2 = a + t, b2 = b - t, o2 = (b2 - a2) / 2
  s.lineTo(b2, y0)
  s.bezierCurveTo(b2 - o2 * 0.02, y0 + h * 0.72, m + o2 * 0.42, y0 + h * 0.62, m, y0 + h)
  s.bezierCurveTo(m - o2 * 0.42, y0 + h * 0.62, a2 + o2 * 0.02, y0 + h * 0.72, a2, y0)
  s.closePath()
  return s
}

/** Kemeri çeviren U biçimli çerçeve: dış ve iç yay aynı tabandan başlar. */
function kemerCerceve(cx: number, y0: number, gDis: number, gIc: number, duz: number) {
  const ro = gDis / 2, ri = gIc / 2, s = new THREE.Shape()
  s.moveTo(cx - ro, y0)
  s.lineTo(cx - ro, y0 + duz)
  s.absarc(cx, y0 + duz, ro, Math.PI, 0, true)
  s.lineTo(cx + ro, y0)
  s.lineTo(cx + ri, y0)
  s.lineTo(cx + ri, y0 + duz)
  s.absarc(cx, y0 + duz, ri, 0, Math.PI, false)
  s.lineTo(cx - ri, y0)
  s.closePath()
  return s
}

/** Dört yana eğimli kurşun çatı. */
function kirmaCati(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, ic: number) {
  const a: number[][] = [[x0, y0, z1], [x1, y0, z1], [x1 - ic, y1, z1 - ic], [x0 + ic, y1, z1 - ic]]
  const b: number[][] = [[x1, y0, z0], [x0, y0, z0], [x0 + ic, y1, z0 + ic], [x1 - ic, y1, z0 + ic]]
  const c: number[][] = [[x1, y0, z1], [x1, y0, z0], [x1 - ic, y1, z0 + ic], [x1 - ic, y1, z1 - ic]]
  const d: number[][] = [[x0, y0, z0], [x0, y0, z1], [x0 + ic, y1, z1 - ic], [x0 + ic, y1, z0 + ic]]
  const ust: number[][] = [[x0 + ic, y1, z1 - ic], [x1 - ic, y1, z1 - ic], [x1 - ic, y1, z0 + ic], [x0 + ic, y1, z0 + ic]]
  const konum: number[] = [], uv: number[] = []
  for (const q of [a, b, c, d, ust]) {
    const L = Math.hypot(q[1][0] - q[0][0], q[1][2] - q[0][2]), E = Math.hypot(q[3][1] - q[0][1], q[3][2] - q[0][2], q[3][0] - q[0][0])
    const u = [[0, 0], [L, 0], [L, E], [0, E]]
    for (const i of [0, 1, 2, 0, 2, 3]) { konum.push(...q[i]); uv.push(u[i][0], u[i][1]) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Kaburgalı kurşun kubbe: dilimler boyunca hafif dikiş kabartısı. */
function kaburgaliKubbe(R: number, h: number, dilim: number, etek = 0.25) {
  const profil: [number, number][] = [[R + 0.3, -etek], [R, 0]]
  for (let t = 1; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    profil.push([Math.max(R * Math.pow(Math.cos(a), 0.85), 0.001), h * Math.pow(Math.sin(a), 1.05)])
  }
  const P = 4, g = dondurG(profil, dilim * P, [1, 1])
  const poz = g.attributes.position, uv = g.attributes.uv
  for (let v = 0; v < poz.count; v++) {
    const r = Math.hypot(poz.getX(v), poz.getZ(v))
    if (r > 0.2 && Math.round(uv.getX(v) * dilim * P) % P === 0) {
      const k = 1 + 0.06 / r
      poz.setX(v, poz.getX(v) * k); poz.setZ(v, poz.getZ(v) * k)
    }
  }
  g.computeVertexNormals()
  return g
}

/** Kare ayaktan daire ağza geçiş. `acikMi` verilen noktada yüzey örülmez: kemer açıklıkları duvara bakar. */
function pandantifG(R: number, yari: number, y0: number, y1: number, acikMi: (dx: number, dz: number, y: number, uzak: number) => boolean) {
  const SEG = 96, SIRA = 14
  const konum: number[] = [], uv: number[] = [], dizin: number[] = [], ac: boolean[] = []
  for (let s = 0; s <= SIRA; s++) {
    const t = s / SIRA, e = Math.pow(t, 0.8)
    for (let a = 0; a <= SEG; a++) {
      const teta = (a / SEG) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
      const uzak = yari / Math.max(Math.abs(dx), Math.abs(dz))
      const r = THREE.MathUtils.lerp(uzak, R, e), y = THREE.MathUtils.lerp(y0, y1, t)
      konum.push(dx * r, y, dz * r)
      uv.push((a / SEG) * 4, t)
      ac.push(acikMi(dx * r, dz * r, y, uzak))
    }
  }
  for (let s = 0; s < SIRA; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    if (ac[p] && ac[q] && ac[p + 1] && ac[q + 1]) continue
    dizin.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(dizin)
  g.computeVertexNormals()
  return g
}

export const yapi = (): Maket => {
  const m = ulucamiMalzemeleri()
  const d = emirDokulari()
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  // Ortak zemin malzemeleri Ulu Camii'nin paye gölgesini taşır; burada aynı dokular gölgesiz kullanılır.
  const avluMermer = pbr({ map: m.mermerDoseme.map, bumpMap: m.mermerDoseme.bumpMap, bumpScale: 0.3, color: '#d5d8db', roughness: 0.3 })
  const hali = m.haliSade.clone(); hali.color.set('#d9452a')
  const almasik = pbr({ map: d.almasik.renk, bumpMap: d.almasik.kabartma, bumpScale: 0.8, color: '#d9d0c4', roughness: 0.92 })
  const siva = pbr({ color: '#efe4cf', roughness: 0.88, side: THREE.DoubleSide })
  // Hafif öz ışık: revak tavanı içerideki gölgede kahverengiye dönmesin.
  const beyazBoya = pbr({ color: '#f5f0e4', emissive: '#4a453a', roughness: 0.82, side: THREE.DoubleSide })
  const icDuvar = pbr({ color: '#f1d6c4', roughness: 0.84, side: THREE.DoubleSide })
  const griSilme = pbr({ color: '#a7a095', roughness: 0.65 })
  const griBant = pbr({ color: '#bdb7ad', roughness: 0.6 })
  const koyuAhsap = pbr({ color: '#33231a', roughness: 0.62, side: THREE.DoubleSide })
  const kirmiziAhsap = pbr({ color: '#7c3a22', roughness: 0.5, side: THREE.DoubleSide })
  const sutunBeyaz = m.icMermer
  const sutunKahve = pbr({ map: m.icMermer.map, color: '#c9a585', roughness: 0.36 })
  const sutunYesil = pbr({ map: m.icMermer.map, color: '#7f9a8b', roughness: 0.36 })
  const zeminTugla = pbr({ color: '#a44f35', roughness: 0.82 })
  const camDis = pbr({ map: d.pencereDis, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide })
  const isikli = (map: THREE.Texture, k = 1.4) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k * 0.98), side: THREE.DoubleSide })
  const camUst = isikli(d.revzen), camAlt = isikli(d.altPencere, 1.25)
  const demir = pbr({ map: d.demir, roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide })
  const demirIc = isikli(d.demirAcik, 1.35)
  const icKubbe = pbr({ map: d.icKubbe, roughness: 0.9, side: THREE.DoubleSide })
  const pandantif = pbr({ map: d.pandantif, roughness: 0.9, side: THREE.DoubleSide })
  const nis = pbr({ map: d.nis, roughness: 0.75, side: THREE.DoubleSide })
  const ortu = pbr({ map: d.ortu, roughness: 0.75 })
  const korkulukM = pbr({ map: d.korkuluk, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide })
  const turbeDuvar = pbr({ map: d.turbeDuvar, roughness: 0.55, side: THREE.DoubleSide })
  const madalyon = pbr({ color: '#17140f', roughness: 0.4 })
  const levha = pbr({ color: '#17140f', roughness: 0.45 })
  const levhaYesil = pbr({ color: '#1c5a3c', roughness: 0.5, side: THREE.DoubleSide })
  const cinar = pbr({ color: '#6c7a34', roughness: 1 })
  const camLamba = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.4, 1.15) })
  const mezar = pbr({ color: '#d9d5ca', roughness: 0.7 })
  const camSari = pbr({ color: '#c8a557', roughness: 0.55 })

  class Yerel extends Kova {
    ekle(g: THREE.BufferGeometry, mal: Mal) { g.translate(0, 0, OZ); super.ekle(g, mal) }
  }
  const k = new Yerel(), kCati = new Yerel(), kKasnak = new Yerel(), kKubbe = new Yerel()
  const kutu = (g: number, h: number, dd: number, mal: Mal, x: number, y: number, z: number, kv: Kova = k) => kv.ekle(yer(kutuG(g, h, dd), x, y, z), mal)
  /** Sınırlarıyla kutu: x0-x1, y0-y1, z0-z1. */
  const blok = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal, kv: Kova = k) =>
    kutu(x1 - x0, y1 - y0, z1 - z0, mal, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, kv)

  // --- Zemin: taş döşemeli kaide ve külliyenin yükseltilmiş sekisi (türbe boşluğu açık) ---
  const zemin = new THREE.CircleGeometry(54, 96).rotateX(-Math.PI / 2).translate(0, 0.01, -OZ)
  const zp = zemin.attributes.position, zu = zemin.attributes.uv
  for (let i = 0; i < zu.count; i++) zu.setXY(i, zp.getX(i), zp.getZ(i))
  k.ekle(zemin, m.doseme)
  const seki = dikdortgen(-21, -CAMI_Z1 - 3, 21, 29)
  // Türbe boşluğu ve iniş koridoru tek çokgendir; şekil y'si -z'dir.
  const A = 6.45, S = A * Math.tan(Math.PI / 8), CX0 = GIRIS_X0 - 0.1, CX1 = GIRIS_X1 + 0.1
  const kenarZ = (x: number) => TURBE_Z + A - (x - S)
  const sekiDelik = new THREE.Path()
  const delik: [number, number][] = [[-S, TURBE_Z + A], [S, TURBE_Z + A], [CX0, kenarZ(CX0)], [CX0, -9.9], [CX1, -9.9], [CX1, kenarZ(CX1)], [A, TURBE_Z + S], [A, TURBE_Z - S], [S, TURBE_Z - A], [-S, TURBE_Z - A], [-A, TURBE_Z - S], [-A, TURBE_Z + S]]
  delik.forEach(([x, z], i) => { if (i) sekiDelik.lineTo(x, -z); else sekiDelik.moveTo(x, -z) })
  sekiDelik.closePath()
  seki.holes.push(sekiDelik)
  k.ekle(cikar(seki, AVLU_Y).rotateX(-Math.PI / 2), m.tas)
  // Sekinin kıble yönünde mermer şeridi ve türbe zemini
  k.ekle(duzGolge(silindirG(6.9, 6.9, 0.1, 8).rotateY(Math.PI / 8)).translate(0, TURBE_Y - 0.05, TURBE_Z), hali)
  blok(GIRIS_X0 - 0.1, GIRIS_X1 + 0.1, 0.1, TURBE_Y, -16, -10, m.mermer)

  // --- Avlu: mermer döşeme ve sekizgen şadırvan ---
  blok(-AVLU_X, AVLU_X, AVLU_Y, AVLU_Y + 0.03, -AVLU_Z, AVLU_Z, avluMermer)
  sadirvan()

  // --- Revaklar: on altı sütun, kaş kemerler ---
  // Kuzey ve güney sıraları altışar, doğu ve batı dört köşe arasında ikişer sütun: toplam on altı (kaynak). Dizilim temsilîdir.
  const KOLON_X = [-AVLU_X, -6.6, -2.2, 2.2, 6.6, AVLU_X], KOLON_Z = [-2.2, 2.2]
  const kolonM = [sutunBeyaz, sutunKahve, sutunYesil, sutunBeyaz, sutunYesil, sutunKahve]
  const kolon = (x: number, z: number, mal: Mal, taban = HARIM_Y) => {
    const h = taban + KOLON_H
    k.ekle(yer(dondurG([[0.27, 0], [0.27, 0.16], [0.21, 0.28], [0.17, 0.55], [0.15, h - taban - 0.4], [0.17, h - taban - 0.33]], 14), x, taban, z), mal)
    k.ekle(yer(duzGolge(silindirG(0.32, 0.18, 0.28, 8).rotateY(Math.PI / 8)), x, h - 0.17, z), sutunBeyaz)
    kutu(0.66, 0.1, 0.66, sutunBeyaz, x, h - 0.0, z)
  }
  KOLON_X.forEach((x, i) => { kolon(x, AVLU_Z, kolonM[i]); kolon(x, -AVLU_Z, kolonM[(i + 3) % 6]) })
  for (const x of [-AVLU_X, AVLU_X]) KOLON_Z.forEach((z, i) => kolon(x, z, kolonM[i + 1], AVLU_Y + 0.15))

  /** Sütunlar arası kuşak: beyaz boyalı yüzey, kaş yayını çeviren koyu ahşap. `ry` doğu-batı sırası için. */
  const kusak = (a: number, b: number, sabit: number, ry: number, yKemer: number, ust: number, kemerH: number) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(ry ? yer(g, sabit, 0, 0, ry) : yer(g, 0, 0, sabit), mal)
    ek(cikar(kusakSekli(a + 0.02, b - 0.02, yKemer, kemerH, ust), 0.2, -0.1), beyazBoya)
    ek(cikar(kasSerit(a, b, yKemer, kemerH - 0.03, 0.1), 0.28, -0.14), koyuAhsap)
    // Sütun üstünde dikme
    for (const x of [a, b]) ek(kutuG(0.2, ust - yKemer, 0.3).translate(x, (ust + yKemer) / 2, 0), koyuAhsap)
  }
  const KEMER_Y = HARIM_Y + KOLON_H + 0.05
  for (let i = 0; i < 5; i++) {
    const a = KOLON_X[i], b = KOLON_X[i + 1]
    const orta = i === 2
    // Cami ve türbe girişi önündeki kemerler daha yüksektir (kaynak).
    kusak(a, b, AVLU_Z, 0, KEMER_Y, orta ? REVAK_UST + 2.2 : REVAK_UST, orta ? 3.35 : 1.05)
    kusak(a, b, -AVLU_Z, 0, KEMER_Y, orta ? REVAK_UST + 2.2 : REVAK_UST, orta ? 3.35 : 1.05)
  }
  const zSira = [-AVLU_Z, -2.2, 2.2, AVLU_Z]
  for (let i = 0; i < 3; i++) for (const x of [-AVLU_X, AVLU_X]) kusak(zSira[i], zSira[i + 1], x, Math.PI / 2, KEMER_Y - 0.05, REVAK_UST, 0.95)

  // Revak zeminleri, tavanları ve saçak kirişleri
  blok(-REVAK_DIS_X, REVAK_DIS_X, AVLU_Y, HARIM_Y, AVLU_Z - 0.35, CAMI_Z0, hali)
  blok(-REVAK_DIS_X, REVAK_DIS_X, AVLU_Y, HARIM_Y, REVAK_K_Z, -AVLU_Z + 0.35, zeminTugla)
  for (const s of [-1, 1]) {
    blok(s > 0 ? AVLU_X - 0.35 : -REVAK_DIS_X, s > 0 ? REVAK_DIS_X : -AVLU_X + 0.35, AVLU_Y, HARIM_Y, -AVLU_Z, AVLU_Z, zeminTugla)
    blok(s > 0 ? AVLU_X : -REVAK_DIS_X, s > 0 ? REVAK_DIS_X : -AVLU_X, REVAK_UST - 0.1, REVAK_UST, -AVLU_Z - 0.2, AVLU_Z + 0.2, beyazBoya)
    // Doğu-batı saçağı ve çatısı
    blok(s > 0 ? AVLU_X - 0.45 : -AVLU_X - 0.12, s > 0 ? AVLU_X + 0.12 : -AVLU_X + 0.45, REVAK_UST, REVAK_UST + 0.3, -AVLU_Z, AVLU_Z, koyuAhsap)
    kCati.ekle(s > 0 ? kirmaCati(AVLU_X - 0.5, REVAK_DIS_X + 0.4, -AVLU_Z, AVLU_Z, REVAK_UST + 0.28, REVAK_UST + 1.2, 0.4) : kirmaCati(-REVAK_DIS_X - 0.4, -AVLU_X + 0.5, -AVLU_Z, AVLU_Z, REVAK_UST + 0.28, REVAK_UST + 1.2, 0.4), m.kursun)
  }

  guneyBlogu()
  kuzeyBlogu()
  dogubatiDuvarlari()
  camiGovdesi()
  camiIci()
  minare(-CAMI_DIS_X - 0.6, CAMI_Z0 + 0.6)
  minare(CAMI_DIS_X + 0.6, CAMI_Z0 + 0.6)
  turbe()
  disKutleler()
  cevre()

  const kok = k.grup()
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  kok.add(catiGrup, kasnakGrup, kubbeGrup)
  // Avludan görünen gök: yalnız yürürken çizilir.
  const gok = new THREE.Mesh(new THREE.SphereGeometry(240, 32, 16), gokMalzemesi(0, OZ + 1.5, 33))
  gok.frustumCulled = false
  kok.add(gok)

  return {
    kok,
    katmanlar: [
      { grup: catiGrup, yukseklik: 16, ad: 'Çatılar' },
      { grup: kasnakGrup, yukseklik: 26, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 36, ad: 'Kubbeler' },
    ],
    duraklar: duraklar(),
    yurume: yurume(),
    kamera: { konum: [-88, 62, -34], hedef: [0, 8, -8] },
    kaideYaricap: 56,
    icIsiklar: [
      [0, HARIM_Y + 12, HARIM_ORTA + OZ],
      [0, HARIM_Y + 5.5, HARIM_ORTA - 3 + OZ],
      [0, AVLU_Y + 3.4, 3 + OZ],
      [0, TURBE_Y + 6.5, TURBE_Z + OZ],
    ],
  }

  // ---------------------------------------------------------------------------------------------------------------

  function sadirvan() {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, AVLU_Y + 0.03, 0), mal)
    ek(duzGolge(silindirG(3.95, 4.15, 0.22, 8).rotateY(Math.PI / 8).translate(0, 0.11, 0)), sutunBeyaz)
    ek(duzGolge(silindirG(2.75, 2.9, 1.0, 8).rotateY(Math.PI / 8).translate(0, 0.72, 0)), m.mermer)
    ek(duzGolge(silindirG(2.9, 2.9, 0.12, 8).rotateY(Math.PI / 8).translate(0, 1.24, 0)), sutunBeyaz)
    ek(new THREE.CylinderGeometry(2.55, 2.55, 0.03, 32).translate(0, 1.18, 0), m.su)
    // Köşe dikmeleri ve yüzlerde lüle
    for (let n = 0; n < 8; n++) {
      const a = Math.PI / 8 + (n * Math.PI) / 4
      k.ekle(yer(kutuG(0.2, 1.15, 0.2).translate(0, AVLU_Y + 0.8, 2.92), 0, 0, 0, a), sutunBeyaz)
      const yuz = (n * Math.PI) / 4
      k.ekle(yer(kutuG(1.1, 0.5, 0.05).translate(0, AVLU_Y + 0.72, 2.68), 0, 0, 0, yuz), sutunBeyaz)
      k.ekle(yer(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8).rotateX(Math.PI / 2).translate(0, AVLU_Y + 0.92, 2.8), 0, 0, 0, yuz), m.bronz)
      // Tabureler
      const r = 3.45
      k.ekle(yer(dondurG([[0.17, 0], [0.09, 0.17], [0.2, 0.34], [0, 0.36]], 10), Math.sin(yuz + 0.2) * r, AVLU_Y + 0.24, Math.cos(yuz + 0.2) * r), m.mermerKoyu)
    }
    // Fıskiye tablaları
    ek(dondurG([[0.45, 0.95], [0.16, 1.32], [0.55, 1.6], [0.6, 1.68], [0.12, 1.76], [0.09, 2.15], [0.34, 2.32], [0.36, 2.38], [0.07, 2.45], [0.05, 2.75], [0.12, 2.86], [0.02, 3.02], [0, 3.04]], 16), sutunBeyaz)
  }

  /** Cami önü: iki katlı revak; üstte kadınlar mahfilinin beyaz duvarı ve pencereleri. */
  function guneyBlogu() {
    const cep = AVLU_Z, ic = CAMI_Z0
    // Revak tavanı ve üst kat duvarı
    blok(-REVAK_DIS_X, REVAK_DIS_X, REVAK_UST - 0.05, REVAK_UST + 0.05, cep, ic, beyazBoya)
    const UST = REVAK_UST + 4
    const duvar = dikdortgen(-REVAK_DIS_X, REVAK_UST, REVAK_DIS_X, UST)
    const pencereX = [-12.6, -9.4, -6.2, 6.2, 9.4, 12.6]
    for (const x of pencereX) duvar.holes.push(dikdortgen(x - 0.62, REVAK_UST + 1.05, x + 0.62, REVAK_UST + 3.05) as unknown as THREE.Path)
    k.ekle(cikar(duvar, 0.25, cep - 0.05), beyazBoya)
    for (const x of pencereX) {
      blok(x - 0.72, x + 0.72, REVAK_UST + 0.95, REVAK_UST + 3.15, cep - 0.02, cep + 0.02, koyuAhsap)
      k.ekle(uvSigdir(new THREE.PlaneGeometry(1.24, 2).translate(x, REVAK_UST + 2.05, cep - 0.04)), camDis)
      k.ekle(uvSigdir(new THREE.PlaneGeometry(1.24, 2).rotateY(Math.PI).translate(x, REVAK_UST + 2.05, cep + 0.2)), demir)
    }
    // Pencere dikmeleri ve yatay kirişler
    for (const x of [-15, -11, -4.4, -2.2, 2.2, 4.4, 11, 15]) blok(x - 0.1, x + 0.1, REVAK_UST, UST, cep - 0.1, cep + 0.05, koyuAhsap)
    blok(-REVAK_DIS_X - 0.5, -2.2, REVAK_UST - 0.02, REVAK_UST + 0.28, cep - 0.7, cep + 0.2, koyuAhsap)
    blok(2.2, REVAK_DIS_X + 0.5, REVAK_UST - 0.02, REVAK_UST + 0.28, cep - 0.7, cep + 0.2, koyuAhsap)
    // Orta bölümde daire madalyon (fotoğrafa göre)
    const halka = new THREE.Shape(); halka.absarc(0, UST - 1.05, 0.72, 0, Math.PI * 2, false)
    const halkaD = new THREE.Path(); halkaD.absarc(0, UST - 1.05, 0.6, 0, Math.PI * 2, true); halka.holes.push(halkaD)
    k.ekle(cikar(halka, 0.1, cep - 0.1), koyuAhsap)
    // Saçak ve kırma çatı
    blok(-REVAK_DIS_X - 0.6, REVAK_DIS_X + 0.6, UST, UST + 0.34, cep - 0.8, ic + 0.2, koyuAhsap)
    blok(-REVAK_DIS_X - 0.8, REVAK_DIS_X + 0.8, UST + 0.2, UST + 0.3, cep - 1, ic + 0.3, koyuAhsap)
    kCati.ekle(kirmaCati(-REVAK_DIS_X - 0.9, REVAK_DIS_X + 0.9, cep - 1.1, ic + 0.5, UST + 0.3, UST + 2.05, 2), m.kursun)
    // Dış yan duvar ve arka
    for (const s of [-1, 1]) {
      blok(s > 0 ? REVAK_DIS_X - 0.35 : -REVAK_DIS_X, s > 0 ? REVAK_DIS_X : -REVAK_DIS_X + 0.35, AVLU_Y, UST, cep, ic + 0.1, almasik)
      blok(s > 0 ? CAMI_DIS_X : -REVAK_DIS_X, s > 0 ? REVAK_DIS_X : -CAMI_DIS_X, AVLU_Y, UST, ic - 0.3, ic, almasik)
    }
    // Revaktaki iki küçük oda (imam ve müezzin): ahşap ön yüz, kapı ve pencere.
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? AVLU_X : -REVAK_DIS_X, x1 = s > 0 ? REVAK_DIS_X : -AVLU_X
      blok(x0, x1, HARIM_Y, REVAK_UST - 0.05, cep + 0.45, ic, koyuAhsap)
      blok(s * 12.2 - 0.5, s * 12.2 + 0.5, HARIM_Y, HARIM_Y + 2.2, cep + 0.42, cep + 0.46, kirmiziAhsap)
      // Mahfile çıkan sekiz basamak (kaynak). Basamaklar görünüm içindir; üst kat yürünmez.
      for (let i = 0; i < 8; i++) {
        const u = i / 8, z0 = ic - 3.6 + u * 3.3
        const xa = s > 0 ? 8.7 : -AVLU_X + 0.05, xb = s > 0 ? AVLU_X - 0.05 : -8.7
        blok(xa, xb, HARIM_Y, HARIM_Y + 0.2 * (i + 1), z0, ic - 0.1, kirmiziAhsap)
      }
    }
    // Arka duvar: harim kapısı, iki yanda mihrap nişi ve kesme taş cephe
    const onY = HARIM_Y
    blok(-1.55, -1.15, onY, onY + 3.75, ic - 0.08, ic, m.mermer)
    blok(1.15, 1.55, onY, onY + 3.75, ic - 0.08, ic, m.mermer)
    blok(-1.55, 1.55, onY + 3.35, onY + 3.75, ic - 0.08, ic, m.mermer)
    // Kitabe levhası: 0,50 × 1,50 m (kaynak). Yazı gösterilmez.
    blok(-0.75, 0.75, onY + 3.82, onY + 4.32, ic - 0.08, ic, sutunBeyaz)
    for (const s of [-1, 1]) {
      const n = yuvarlakKemer(new THREE.Shape(), 0, onY + 0.1, 1.1, 1.9)
      k.ekle(yer(cikar(n, 0.04, ic - 0.05), s * 5.5, 0, 0), sutunBeyaz)
      k.ekle(yer(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, onY + 0.25, 0.8, 1.75), 10).translate(0, 0, ic - 0.06), s * 5.5, 0, 0), m.krem)
    }
  }

  /** Türbe önü: kuzey revakı, niyaz penceresi, ahşap köşk. */
  function kuzeyBlogu() {
    const z = REVAK_K_Z, y0 = AVLU_Y, ust = REVAK_UST
    const duvar = dikdortgen(-REVAK_DIS_X, y0, REVAK_DIS_X, ust)
    const delikler = [-11.4, -8, -4.5, 8, 11.4]
    for (const x of delikler) duvar.holes.push(yuvarlakKemer(new THREE.Path(), x, HARIM_Y + 0.5, 1.5, 1.8))
    duvar.holes.push(yuvarlakKemer(new THREE.Path(), 4.4, HARIM_Y, 1.8, 2.15))
    duvar.holes.push(yuvarlakKemer(new THREE.Path(), 0, HARIM_Y + 0.25, 2.6, 2))
    // Dış-iç: taş ve tuğla cephe, sıva değil
    const s = cikar(duvar, 0.7, z - 0.7)
    k.ekle(s, almasik)
    blok(-REVAK_DIS_X, REVAK_DIS_X, REVAK_UST - 0.05, REVAK_UST + 0.05, z, -AVLU_Z, beyazBoya)
    // Çerçeveli pencereler
    for (const x of delikler) {
      k.ekle(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), x, HARIM_Y + 0.5, 1.5, 1.8), 10)).translate(0, 0, z - 0.3), demir)
      k.ekle(cikar(kemerCerceve(x, HARIM_Y + 0.5, 1.8, 1.5, 1.8), 0.1, z), koyuAhsap)
    }
    // Niyaz Penceresi: büyük demir parmaklık, mermer söve (kaynak: revak önünde, 0,50 × 1,50 m kitabeli). Kitabede yazı gösterilmez.
    k.ekle(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, HARIM_Y + 0.25, 2.6, 2), 12)).translate(0, 0, z - 0.3), demir)
    k.ekle(cikar(kemerCerceve(0, HARIM_Y + 0.25, 3.4, 2.6, 2), 0.14, z), m.mermer)
    blok(-0.75, 0.75, REVAK_UST - 0.62, REVAK_UST - 0.12, z, z + 0.05, sutunBeyaz)
    for (const x of [-2.1, 2.1]) blok(x - 0.22, x + 0.22, HARIM_Y, HARIM_Y + 3.9, z, z + 0.25, griSilme)
    // Giriş kapısı çerçevesi
    k.ekle(cikar(kemerCerceve(4.4, HARIM_Y, 2.3, 1.8, 2.15), 0.12, z), m.mermer)
    // Koridor: giriş sofasından sandukaların olduğu mekâna iner (kaynak: iki ve iki basamak)
    for (const x of [GIRIS_X0 - 0.15, GIRIS_X1 + 0.15]) blok(x - 0.15, x + 0.15, TURBE_Y, REVAK_UST, x > 4 ? -16.6 : -14.2, z - 0.7, siva)
    blok(GIRIS_X0 - 0.3, GIRIS_X1 + 0.3, REVAK_UST - 0.6, REVAK_UST - 0.45, -16.6, z, siva)
    const basamak: [number, number, number][] = [[hAvlu, -11.3, z], [0.72, -12.7, -11.3], [0.43, -14, -12.7], [0.14, GIRIS_Z, -14]]
    for (const [h, z0, z1] of basamak) blok(GIRIS_X0, GIRIS_X1, TURBE_Y - 0.1, TURBE_Y + h, z0, z1, m.mermer)

    // Saçak, kırma çatı ve ahşap köşk: orta bölüm yükselir
    blok(-REVAK_DIS_X - 0.5, REVAK_DIS_X + 0.5, ust, ust + 0.3, -AVLU_Z - 0.2, z - 0.2, koyuAhsap)
    blok(-REVAK_DIS_X - 0.7, REVAK_DIS_X + 0.7, ust + 0.2, ust + 0.3, -AVLU_Z + 0.5, z - 0.6, koyuAhsap)
    kCati.ekle(kirmaCati(-REVAK_DIS_X - 0.8, REVAK_DIS_X + 0.8, -13.6, -AVLU_Z + 0.6, ust + 0.3, ust + 1.5, 1.2), m.kursun)

    // Köşk: kaynakta "ahşap revak", fotoğrafta orta kemerin üstünde koyu ahşap kutu ve dört yüzlü kavisli kurşun örtü
    const kY0 = ust + 0.05, kY1 = kY0 + 3.1, kx = 3, z0 = -AVLU_Z - 3.8, z1 = -AVLU_Z + 0.25
    blok(-kx, kx, kY0, kY1, z0, z1, koyuAhsap)
    blok(-kx - 0.25, kx + 0.25, kY1, kY1 + 0.28, z0 - 0.25, z1 + 0.25, koyuAhsap)
    blok(-kx - 0.45, kx + 0.45, kY1 + 0.26, kY1 + 0.36, z0 - 0.45, z1 + 0.45, koyuAhsap)
    for (const x of [-1.8, 1.8]) blok(x - 0.08, x + 0.08, kY0, kY1, z1, z1 + 0.04, m.ceviz)
    const hk = new THREE.Shape(); hk.absarc(0, kY0 + 2.15, 0.38, 0, Math.PI * 2, false)
    const hkD = new THREE.Path(); hkD.absarc(0, kY0 + 2.15, 0.28, 0, Math.PI * 2, true); hk.holes.push(hkD)
    k.ekle(cikar(hk, 0.06, z1), m.ceviz)
    const zm = (z0 + z1) / 2
    const ortu4 = dondurG([[1.02, 0], [1, 0.1], [0.82, 0.45], [0.58, 0.72], [0.28, 0.92], [0.01, 1.02]], 4, [6, 3]).rotateY(Math.PI / 4)
    ortu4.scale((kx + 0.5) * Math.SQRT2, 2.35, (z1 - z0 + 1) / 2 * Math.SQRT2)
    ortu4.computeVertexNormals()
    kCati.ekle(yer(ortu4, 0, kY1 + 0.34, zm), m.kursun)
    kCati.ekle(yer(dondurG([[0.1, 0], [0.04, 0.22], [0.14, 0.4], [0.05, 0.62], [0.11, 0.8], [0.02, 1.25], [0, 1.28]], 10), 0, kY1 + 2.6, zm), m.altin)

    // Türbenin iki yanındaki dikdörtgen odalar (kaynak), lead çatılı dış kütle
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? 7.05 : -13.5, x1 = s > 0 ? 13.5 : -7.05
      blok(x0, x1, AVLU_Y, AVLU_Y + 4.2, -24, -13.4, almasik)
      kCati.ekle(kirmaCati(s > 0 ? x0 : x0 - 0.5, s > 0 ? x1 + 0.5 : x1, -24.5, -13, AVLU_Y + 4.2, AVLU_Y + 5.5, 1.5), m.kursun)
    }
  }

  /** Avlunun doğu ve batı girişleri: iki mermer sütunlu, kurşun kubbeli giriş mekânı (kaynak). */
  function dogubatiDuvarlari() {
    for (const s of [-1, 1]) {
      const ry = s > 0 ? Math.PI / 2 : -Math.PI / 2
      const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, s * REVAK_DIS_X, 0, 0, ry), mal)
      // Yerel: +z dışa bakar. Duvar kalınlığı 0,4.
      const dv = dikdortgen(-AVLU_Z - 3.5, AVLU_Y, AVLU_Z + 3.5, REVAK_UST)
      const pencere = [-4.6, 4.6]
      for (const x of pencere) dv.holes.push(yuvarlakKemer(new THREE.Path(), x, HARIM_Y + 0.6, 1.3, 1.6))
      dv.holes.push(yuvarlakKemer(new THREE.Path(), 0, HARIM_Y, 1.8, 2.1))
      ek(cikar(dv, 0.4, 0), almasik)
      const ic = dikdortgen(-AVLU_Z, AVLU_Y, AVLU_Z, REVAK_UST)
      for (const x of pencere) ic.holes.push(yuvarlakKemer(new THREE.Path(), x, HARIM_Y + 0.6, 1.3, 1.6))
      ic.holes.push(yuvarlakKemer(new THREE.Path(), 0, HARIM_Y, 1.8, 2.1))
      ek(cikar(ic, 0.03, -0.03), siva)
      for (const x of pencere) {
        ek(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), x, HARIM_Y + 0.6, 1.3, 1.6), 10)).translate(0, 0, 0.2), demir)
      }
      blok2(ek, -AVLU_Z, AVLU_Z, HARIM_Y + 1.1, HARIM_Y + 1.2, -0.05, -0.02, koyuAhsap)
      // Giriş kapısı: kapalı ahşap kanatlar. Kapıdan çıkılmaz; yürüyüş avlu içinde kalır.
      ek(kutuG(1.9, 3, 0.1).translate(0, HARIM_Y + 1.5, 0.22), m.ahsap)
      ek(kutuG(0.05, 3, 0.12).translate(0, HARIM_Y + 1.5, 0.21), koyuAhsap)
      // Kitabe levhası: koyu zemin, yazı yok.
      ek(kutuG(2.4, 0.5, 0.05).translate(0, HARIM_Y + 2.95, -0.05), levha)

      // Giriş köşkü: dışarı taşan dikdörtgen mekân, sütunlu ön, sekizgen kaide ve kurşun kubbe
      const dx = s * (REVAK_DIS_X + 2.3)
      const bas = s > 0 ? REVAK_DIS_X + 0.3 : -REVAK_DIS_X - 4.3
      blok(bas, bas + 4, AVLU_Y, REVAK_UST, -3, -2.5, almasik)
      blok(bas, bas + 4, AVLU_Y, REVAK_UST, 2.5, 3, almasik)
      blok(bas, bas + 4, REVAK_UST, REVAK_UST + 0.35, -3.1, 3.1, m.tas)
      for (const z of [-1.3, 1.3]) {
        k.ekle(yer(dondurG([[0.22, 0], [0.15, 0.25], [0.13, 3.2], [0.2, 3.5]], 12), s * (REVAK_DIS_X + 4), AVLU_Y, z), sutunBeyaz)
      }
      blok(s * (REVAK_DIS_X + 4) - 0.25, s * (REVAK_DIS_X + 4) + 0.25, AVLU_Y + 3.5, REVAK_UST + 0.05, -3, 3, m.tas)
      kKasnak.ekle(yer(duzGolge(silindirG(3.15, 3.2, 1.1, 8).rotateY(Math.PI / 8)), dx, REVAK_UST + 0.85, 0), m.tas)
      kKubbe.ekle(yer(kaburgaliKubbe(2.95, 2.1, 20), dx, REVAK_UST + 1.4, 0), m.kubbe)
      kKubbe.ekle(yer(dondurG([[0.1, 0], [0.05, 0.2], [0.12, 0.38], [0.02, 0.8], [0, 0.82]], 8), dx, REVAK_UST + 3.42, 0), m.altin)
    }
  }
  function blok2(ek: (g: THREE.BufferGeometry, mal: Mal) => void, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal) {
    ek(kutuG(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mal)
  }

  /** Bir cami cephesi. Kaynak: alt pencere üstü seviyesine kadar kesme taş, yukarısı küfeki taş ve üç sıra tuğla. */
  function camiGovdesi() {
    const G_ALT = 1.5, G_ORT = 1.6, G_UST = 1.25
    const altY0 = HARIM_Y + 0.95, altY1 = HARIM_Y + 3.25, ortY0 = HARIM_Y + 4.75, ortD = 1.65, ustY0 = HARIM_Y + 9.35, ustD = 1.05
    const TAS_UST = HARIM_Y + 4.25
    type Yuz = 'dogu' | 'bati' | 'guney' | 'kuzey'
    const yuzler: { ad: Yuz; x: number; z: number; ry: number; alt: number[]; ort: number[]; ust: number[] }[] = [
      { ad: 'dogu', x: CAMI_DIS_X, z: HARIM_ORTA, ry: Math.PI / 2, alt: [-5.6, -2, 2, 5.6], ort: [-5.6, -2, 2, 5.6], ust: [-3, 0, 3] },
      { ad: 'bati', x: -CAMI_DIS_X, z: HARIM_ORTA, ry: -Math.PI / 2, alt: [-5.6, -2, 2, 5.6], ort: [-5.6, -2, 2, 5.6], ust: [-3, 0, 3] },
      { ad: 'guney', x: 0, z: CAMI_Z1, ry: 0, alt: [-4.1, 4.1], ort: [-4.1, 4.1], ust: [-3, 0, 3] },
      { ad: 'kuzey', x: 0, z: CAMI_Z0, ry: Math.PI, alt: [-4.1, 4.1], ort: [-4.1, 4.1], ust: [-3, 0, 3] },
    ]
    for (const y of yuzler) {
      const ek = (g: THREE.BufferGeometry, mal: Mal, kv: Kova = k) => kv.ekle(yer(g, y.x, 0, y.z, y.ry), mal)
      const L = CAMI_L / 2
      // Üstü orta kemere göre yükselen duvar silueti
      const tepe: [number, number][] = [[L, SACAK]]
      for (let i = 0; i <= 28; i++) {
        const x = 7.8 - (15.6 * i) / 28
        tepe.push([x, Math.max(SACAK, 9.6 + (SACAK_ORTA - 9.6) * Math.sqrt(Math.max(0, 1 - (x / 7.7) ** 2)))])
      }
      tepe.push([-L, SACAK])
      const silueti = () => {
        const s = new THREE.Shape()
        s.moveTo(-L, 0); s.lineTo(L, 0)
        for (const [x, yy] of tepe) s.lineTo(x, yy)
        s.closePath()
        return s
      }
      const delik = (s: THREE.Shape) => {
        for (const x of y.alt) s.holes.push(dikdortgen(x - G_ALT / 2, altY0, x + G_ALT / 2, altY1) as unknown as THREE.Path)
        for (const x of y.ort) s.holes.push(yuvarlakKemer(new THREE.Path(), x, ortY0, G_ORT, ortD))
        for (const x of y.ust) s.holes.push(yuvarlakKemer(new THREE.Path(), x, ustY0, G_UST, ustD))
        if (y.ad === 'kuzey') s.holes.push(dikdortgen(-1.15, AVLU_Y, 1.15, HARIM_Y + 3.3) as unknown as THREE.Path)
      }
      const s = silueti(); delik(s)
      ek(cikar(s, DUVAR, -DUVAR), almasik)
      // Kesme taş alt bölge ve kornişler (cami önü revak içindedir)
      const alt = dikdortgen(-L - 0.05, 0, L + 0.05, TAS_UST)
      for (const x of y.alt) alt.holes.push(dikdortgen(x - G_ALT / 2 - 0.15, altY0 - 0.15, x + G_ALT / 2 + 0.15, altY1 + 0.15) as unknown as THREE.Path)
      if (y.ad === 'kuzey') alt.holes.push(dikdortgen(-1.15, AVLU_Y, 1.15, HARIM_Y + 3.3) as unknown as THREE.Path)
      ek(cikar(alt, 0.08, 0), m.tas)
      ek(kutuG(CAMI_L + 0.3, 0.26, 0.3).translate(0, TAS_UST + 0.13, 0.1), m.mermer)
      ek(kutuG(CAMI_L + 0.2, 0.3, 0.2).translate(0, 0.65, 0.1), m.tas)

      // Büyük orta kemer ve yanlarda küçük kemerler (kaynak)
      if (y.ad !== 'kuzey') {
        const halka = (cx: number, y0: number, rx: number, ry2: number, t: number, kvm: Mal, parca: number) => {
          const dis = new THREE.Shape(), ic = new THREE.Path()
          dis.absellipse(cx, y0, rx + t, ry2 + t, 0, Math.PI, false)
          ic.absellipse(cx, y0, rx, ry2, 0, Math.PI, false)
          dis.lineTo(cx - rx - t, y0)
          dis.lineTo(cx - rx, y0)
          const pts = ic.getPoints(24).reverse()
          for (const p of pts) dis.lineTo(p.x, p.y)
          dis.closePath()
          ek(cikar(dis, 0.1, 0), kvm)
          // Tuğla kemer üstüne seyrek küfeki kilit taşları
          for (let i = 1; i < parca; i++) {
            const a = (i / parca) * Math.PI
            const r = t / 2
            const b = kutuG(0.42, t * 0.86, 0.14)
            const nx = Math.cos(a) * (rx + r), ny = Math.sin(a) * (ry2 + r)
            b.rotateZ(Math.atan2(ny / (ry2 * ry2), nx / (rx * rx)) - Math.PI / 2)
            ek(b.translate(cx + nx, y0 + ny, 0.05), m.tas)
          }
        }
        halka(0, 9.6, 6.35, 6.25, 0.62, m.tugla, 11)
        for (const s2 of [-1, 1]) halka(s2 * 7.6, 9.2, 0.95, 1.05, 0.34, m.tugla, 3)
      }
      // Pencere dıştan: kasa ve kemer alınlığı
      for (const x of y.alt) {
        ek(uvSigdir(new THREE.PlaneGeometry(G_ALT, altY1 - altY0)).translate(x, (altY0 + altY1) / 2, -0.55), demir)
        ek(kutuG(G_ALT + 0.3, 0.1, 0.3).translate(x, altY0 - 0.15, 0.03), m.mermer)
      }
      for (const x of [...y.ort]) {
        ek(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), x, ortY0, G_ORT, ortD), 10)).translate(0, 0, -0.5), camDis)
        ek(cikar(kemerCerceve(x, ortY0 + ortD, G_ORT + 0.5, G_ORT, 0), 0.08, 0), m.tugla)
      }
      for (const x of y.ust) {
        ek(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), x, ustY0, G_UST, ustD), 10)).translate(0, 0, -0.5), camDis)
        ek(cikar(kemerCerceve(x, ustY0 + ustD, G_UST + 0.42, G_UST, 0), 0.08, 0), m.tugla)
      }
      // Kavisli kurşun saçak ve taş silme (Parçala ile çatıya gider)
      const c1 = new THREE.Shape()
      tepe.forEach(([x, yy], i) => { if (i) c1.lineTo(x, yy + 0.28); else c1.moveTo(x, yy + 0.28) })
      for (const [x, yy] of [...tepe].reverse()) c1.lineTo(x, yy - 0.02)
      c1.closePath()
      ek(cikar(c1, 1.5, -1.25), m.kursun, kCati)
      if (y.ad === 'guney') {
        // Mihrabın dış yüzünde kuş evi (kaynak)
        ek(kutuG(0.7, 0.55, 0.28).translate(0, 7.4, 0.12), m.mermer)
        ek(duzGolge(silindirG(0.01, 0.6, 0.4, 4).rotateY(Math.PI / 4)).scale(0.9, 1, 0.4).translate(0, 7.88, 0.14), m.kursun)
        ek(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, 7.2, 0.2, 0.15), 6).translate(0, 0, 0.27), m.koyu)
      }

      // Harim içi: boyalı yüzey, silmeler, pencere iç yüzleri
      const icKalin = 0.03
      const icS = dikdortgen(-HARIM_YARI, AVLU_Y - 0.1, HARIM_YARI, TONOZ_TEPE)
      for (const x of y.alt) icS.holes.push(dikdortgen(x - G_ALT / 2, altY0, x + G_ALT / 2, altY1) as unknown as THREE.Path)
      for (const x of y.ort) icS.holes.push(yuvarlakKemer(new THREE.Path(), x, ortY0, G_ORT, ortD))
      for (const x of y.ust) icS.holes.push(yuvarlakKemer(new THREE.Path(), x, ustY0, G_UST, ustD))
      if (y.ad === 'kuzey') icS.holes.push(dikdortgen(-1.15, AVLU_Y, 1.15, HARIM_Y + 3.3) as unknown as THREE.Path)
      ek(cikar(icS, icKalin, -DUVAR - icKalin), icDuvar)
      // İki bant kuşağı ve dikey köşe pilastrları
      ek(kutuG(2 * HARIM_YARI, 0.22, 0.07).translate(0, BANT1, -DUVAR - 0.04), griBant)
      ek(kutuG(2 * HARIM_YARI, 0.34, 0.14).translate(0, KORNIS + 0.1, -DUVAR - 0.07), griSilme)
      ek(kutuG(2 * HARIM_YARI, 0.1, 0.2).translate(0, KORNIS + 0.32, -DUVAR - 0.1), griBant)
      ek(kutuG(2 * HARIM_YARI, 0.08, 0.05).translate(0, HARIM_Y + 0.42, -DUVAR - 0.025), koyuAhsap)
      for (const px of [-HARIM_YARI + 0.55, HARIM_YARI - 0.55]) {
        ek(kutuG(1.1, KORNIS - HARIM_Y, 0.08).translate(px, (KORNIS + HARIM_Y) / 2, -DUVAR - 0.04), icDuvar)
        for (const ds of [-0.47, 0.47]) ek(kutuG(0.16, KORNIS - HARIM_Y, 0.09).translate(px + ds, (KORNIS + HARIM_Y) / 2, -DUVAR - 0.045), griBant)
      }
      // Alt sıra: kalın sarımsı çerçeve, ahşap kapak, aydınlık pencere
      for (const x of y.alt) {
        const dz = -DUVAR - 0.03
        ek(uvSigdir(new THREE.PlaneGeometry(G_ALT, altY1 - altY0)).rotateY(Math.PI).translate(x, (altY0 + altY1) / 2, -1.1), camAlt)
        const f = dikdortgen(x - G_ALT / 2 - 0.28, altY0 - 0.28, x + G_ALT / 2 + 0.28, altY1 + 0.28)
        f.holes.push(dikdortgen(x - G_ALT / 2, altY0, x + G_ALT / 2, altY1) as unknown as THREE.Path)
        ek(cikar(f, 0.05, dz - 0.05), camSari)
        // Duvar içinde açık duran kapaklar
        for (const sd of [-1, 1]) ek(kutuG(0.05, altY1 - altY0 - 0.1, 0.55).translate(x + sd * (G_ALT / 2 - 0.05), (altY0 + altY1) / 2, -1.42), m.ceviz)
      }
      // Orta ve üst sıra: revzen, kalem işi alınlık
      for (const [x, y0, g, duz] of [...y.ort.map((x) => [x, ortY0, G_ORT, ortD]), ...y.ust.map((x) => [x, ustY0, G_UST, ustD])]) {
        ek(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), x, y0, g, duz), 12)).translate(0, 0, -DUVAR + 0.25), camUst)
        ek(cikar(kemerCerceve(x, y0 + duz, g + 0.42, g + 0.04, 0), 0.05, -DUVAR - 0.06), griSilme)
        for (const sd of [-1, 1]) ek(kutuG(0.08, duz + 0.06, 0.04).translate(x + sd * (g / 2 + 0.05), y0 + duz / 2 - 0.03, -DUVAR - 0.05), griSilme)
        ek(kutuG(g + 0.18, 0.06, 0.04).translate(x, y0 - 0.03, -DUVAR - 0.05), griSilme)
      }
    }

    // Çatı: kasnağa çıkan kurşun etek
    const YUK = SACAK - 0.15
    const etek = duzGolge(silindirG(8.3 * Math.SQRT2, CAMI_DIS_X * Math.SQRT2 + 0.6, 2.2, 4, true).rotateY(Math.PI / 4))
    kCati.ekle(yer(etek, 0, YUK + 1.1, HARIM_ORTA), m.kursun)

    // Kasnak: on iki pencereli (kaynak), tuğla-taş, yuvarlak
    const KY0 = YUK + 1.35, KH = 3.15, KR = 8.25
    const kas = silindirG(KR, KR, KH, 64, true)
    const ku = kas.attributes.uv
    for (let i = 0; i < ku.count; i++) ku.setXY(i, ku.getX(i), ku.getY(i))
    kKasnak.ekle(yer(kas, 0, KY0 + KH / 2, HARIM_ORTA), almasik)
    kKasnak.ekle(yer(silindirG(KR + 0.12, KR + 0.12, 0.2, 48, true), 0, KY0 + KH - 0.05, HARIM_ORTA), m.mermer)
    kKasnak.ekle(yer(silindirG(KR + 0.1, KR + 0.1, 0.3, 48, true), 0, KY0 + 0.12, HARIM_ORTA), m.tas)
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2 + Math.PI / 12
      const pen = (): THREE.Shape => yuvarlakKemer(new THREE.Shape(), 0, KY0 + 0.65, 0.95, 0.95)
      const g = uvSigdir(new THREE.ShapeGeometry(pen(), 8)).translate(0, 0, KR + 0.03)
      kKasnak.ekle(yer(g, 0, 0, HARIM_ORTA, a), camDis)
      kKasnak.ekle(yer(cikar(kemerCerceve(0, KY0 + 0.65 + 0.95, 1.3, 0.95, 0), 0.06, KR), 0, 0, HARIM_ORTA, a), m.tugla)
    }
    // Dış kubbe
    const DKY = KY0 + KH
    kKubbe.ekle(yer(kaburgaliKubbe(8.05, 6.5, 40), 0, DKY, HARIM_ORTA), m.kubbe)
    kKubbe.ekle(yer(dondurG([[0.28, 0], [0.12, 0.25], [0.32, 0.55], [0.1, 0.9], [0.26, 1.2], [0.03, 1.9], [0, 1.95]], 12), 0, DKY + 6.35, HARIM_ORTA), m.altin)
  }

  function camiIci() {
    const y0 = HARIM_Y
    // Halı ve mihrap önü yükseltisi
    blok(-HARIM_YARI, HARIM_YARI, AVLU_Y, y0, HARIM_Z0, HARIM_Z1, hali)
    blok(-1.9, 1.9, y0, y0 + 0.2, HARIM_Z1 - 1.25, HARIM_Z1, hali)
    // Kapı içi
    blok(-1.15, 1.15, AVLU_Y, y0, CAMI_Z0, HARIM_Z0, zeminTugla)
    for (const s of [-1, 1]) {
      kutu(0.1, 3.2, 0.55, m.ahsap, s * 1.4, y0 + 1.6, HARIM_Z0 + 0.28)
      blok(s * 1.15 - 0.13, s * 1.15 + 0.13, y0, y0 + 3.4, HARIM_Z0, HARIM_Z0 + 0.04, griSilme)
    }
    blok(-1.3, 1.3, y0 + 3.3, y0 + 3.58, HARIM_Z0, HARIM_Z0 + 0.05, griSilme)

    // Dört büyük kemer şeridi ve pandantifler
    const kemerSerit = (ry: number, x: number, z: number) => {
      const dis = new THREE.Shape(), ic = new THREE.Path()
      dis.absellipse(0, KORNIS + 0.35, HARIM_YARI - 0.05, KEMER_YUK - 0.35 - 0.05, 0, Math.PI, false)
      dis.lineTo(-HARIM_YARI + 0.55, KORNIS + 0.35)
      ic.absellipse(0, KORNIS + 0.35, HARIM_YARI - 0.55, KEMER_YUK - 0.35 - 0.55, 0, Math.PI, false)
      const n = ic.getPoints(32).reverse()
      for (const p of n) dis.lineTo(p.x, p.y)
      dis.closePath()
      kCati.ekle(yer(cikar(dis, 0.28, -0.28), x, 0, z, ry), griSilme)
    }
    const SY = HARIM_YARI - 0.01
    kemerSerit(Math.PI / 2, SY, HARIM_ORTA); kemerSerit(-Math.PI / 2, -SY, HARIM_ORTA)
    kemerSerit(0, 0, HARIM_ORTA + SY); kemerSerit(Math.PI, 0, HARIM_ORTA - SY)
    const acikMi = (dx: number, dz: number, y: number, uzak: number) => {
      // Duvara yakın yüzey kemer içinde kalıyorsa tympanum görünsün diye örülmez.
      const dy = (y - KORNIS - 0.35) / (KEMER_YUK - 0.35 - 0.3)
      // Nokta merkezden duvara izdüşürülür: köşeye bakan yönler kemer dışında kalır, delik açılmaz.
      const yan = (Math.min(Math.abs(dx), Math.abs(dz)) / Math.max(Math.abs(dx), Math.abs(dz), 0.001)) * HARIM_YARI
      const kemer = (HARIM_YARI - 0.3) * Math.sqrt(Math.max(0, 1 - dy * dy))
      return yan < kemer && uzak > 0
    }
    kCati.ekle(pandantifG(KUBBE_IC_R, HARIM_YARI - 0.02, KORNIS + 0.35, TONOZ_TEPE - 0.05, acikMi).translate(0, 0, HARIM_ORTA), pandantif)
    // Kasnak iç halkası ve on iki pencere
    const halkaY = KASNAK_ALT
    kCati.ekle(yer(new THREE.TorusGeometry(KUBBE_IC_R + 0.02, 0.22, 8, 64).rotateX(Math.PI / 2), 0, halkaY - 0.05, HARIM_ORTA), griSilme)
    kKasnak.ekle(yer(silindirG(KUBBE_IC_R, KUBBE_IC_R, KASNAK_H, 64, true), 0, KASNAK_ALT + KASNAK_H / 2, HARIM_ORTA), icDuvar)
    const pk = (): THREE.Shape => yuvarlakKemer(new THREE.Shape(), 0, KASNAK_ALT + 0.45, 1.1, 0.75)
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2 + Math.PI / 12
      kKasnak.ekle(yer(uvSigdir(new THREE.ShapeGeometry(pk(), 8)).rotateY(Math.PI).translate(0, 0, KUBBE_IC_R - 0.04), 0, 0, HARIM_ORTA, a), camUst)
    }
    // Kalem işli sekiz dilimli iç kubbe: UV kuşbakışı
    const profil: [number, number][] = []
    for (let t = 0; t <= 18; t++) {
      const a = (t / 18) * Math.PI / 2
      profil.push([Math.max(KUBBE_IC_R * Math.pow(Math.cos(a), 0.86), 0.001), KUBBE_IC_H * Math.pow(Math.sin(a), 1.06)])
    }
    const kub = dondurG(profil, 64, [1, 1])
    const kp = kub.attributes.position, kuu = kub.attributes.uv
    for (let i = 0; i < kuu.count; i++) kuu.setXY(i, kp.getX(i) / (2 * KUBBE_IC_R) + 0.5, kp.getZ(i) / (2 * KUBBE_IC_R) + 0.5)
    kKubbe.ekle(yer(kub, 0, KASNAK_ALT + KASNAK_H, HARIM_ORTA), icKubbe)

    // Köşe madalyonları: koyu zemin, altın halka. Yazı taklit edilmez.
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = sx * 5.2, z = HARIM_ORTA + sz * 5.2, y = KORNIS + 3.2
      const a = Math.atan2(-sx, -sz)
      kCati.ekle(yer(new THREE.CircleGeometry(0.62, 28).translate(0, y, 0.06), x, 0, z, a), madalyon)
      kCati.ekle(yer(new THREE.TorusGeometry(0.64, 0.07, 6, 28).translate(0, y, 0.05), x, 0, z, a), m.altin)
    }
    // Duvarlarda boş çerçeveli levhalar ve tarihî saat, şamdanlar, kürsü
    for (const s of [-1, 1]) {
      const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, s * (HARIM_YARI - 0.05), 0, HARIM_ORTA, s * -Math.PI / 2), mal)
      for (const z of [-3.8, 3.8]) {
        ek(kutuG(2.1, 1.2, 0.08).translate(z, BANT1 + 0.9, 0), levha)
        ek(kutuG(2.3, 1.4, 0.05).translate(z, BANT1 + 0.9, -0.02), m.altinKoyu)
      }
    }
    // Şamdanlar mihrabın iki yanında (kaynak)
    for (const s of [-1, 1]) {
      const x = s * 2.65, z = HARIM_Z1 - 0.65
      k.ekle(yer(dondurG([[0.28, 0], [0.08, 0.14], [0.07, 0.5], [0.15, 0.6], [0.08, 0.72], [0.1, 1.6], [0.22, 1.7], [0.13, 1.82], [0.13, 2.75], [0.03, 2.8], [0, 2.8]], 12), x, y0, z), m.altinKoyu)
      k.ekle(yer(dondurG([[0.13, 0], [0.13, 0.5], [0.04, 0.55], [0, 0.56]], 10), x, y0 + 2.75, z), m.krem)
    }
    // Saat
    kutu(0.55, 2.2, 0.32, m.ceviz, 6.3, y0 + 1.1, HARIM_Z1 - 0.2)
    k.ekle(yer(new THREE.CircleGeometry(0.2, 18).rotateY(Math.PI).translate(0, y0 + 1.75, 0), 6.3, 0, HARIM_Z1 - 0.37), m.krem)
    // Kürsü: mihrabın doğusunda sade ahşap
    const krX = 5.6, krZ = HARIM_Z1 - 3.6
    blok(krX - 0.65, krX + 0.65, y0, y0 + 1.1, krZ - 0.65, krZ + 0.65, m.ceviz)
    blok(krX - 0.72, krX + 0.72, y0 + 1.1, y0 + 1.22, krZ - 0.72, krZ + 0.72, m.ahsap)
    blok(krX - 0.65, krX + 0.65, y0 + 1.22, y0 + 1.72, krZ - 0.05, krZ + 0.65, m.ceviz)

    mihrap()
    minber()
    avize()
  }

  function mihrap() {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, HARIM_Z1, Math.PI), mal)
    const y0 = HARIM_Y, G = 5.2, TEPE = y0 + 8, DER = 0.8, NG = 2.5
    const mihrapGovde = pbr({ color: '#f3e4d6', roughness: 0.7, side: THREE.DoubleSide })
    const mermerTaklit = pbr({ color: '#a97b52', roughness: 0.5 })
    // Yerel +z harime bakar. Söveler, üst kuşak ve tepelik
    const s = dikdortgen(-G / 2, y0, G / 2, TEPE)
    s.holes.push(yuvarlakKemer(new THREE.Path(), 0, y0, NG, 3.5))
    ek(cikar(s, DER, 0), mihrapGovde)
    // Mermer taklidi köşe yüzeyleri
    for (const x of [-1, 1]) {
      const yan = dikdortgen(x * (NG / 2 + 0.34) - 0.28, y0 + 4.4, x * (NG / 2 + 0.34) + 0.28, y0 + 5.36)
      ek(cikar(yan, 0.02, DER), mermerTaklit)
    }
    // Niş: içe açılan yarım silindir ve yarım kubbe, yivli kalem işi
    const R = NG / 2
    const yuzey = new THREE.CylinderGeometry(R, R, 3.5, 24, 1, true, Math.PI / 2, Math.PI)
    yuzey.scale(1, 1, (DER - 0.02) / R)
    const uv = yuzey.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i))
    ek(yuzey.translate(0, y0 + 1.75, DER), nis)
    const kav = new THREE.SphereGeometry(R, 24, 10, Math.PI, Math.PI, 0, Math.PI / 2).scale(1, 1, (DER - 0.02) / R)
    ek(kav.translate(0, y0 + 3.5, DER), nis)
    // Sütunçeler ve altın İyon başlıkları (kaynak)
    for (const x of [-1, 1]) {
      ek(yer(dondurG([[0.16, 0], [0.09, 0.2], [0.08, 3.1], [0.14, 3.2]], 10), x * 1.4, y0, DER + 0.09), m.ic)
      ek(yer(silindirG(0.22, 0.13, 0.26, 10), x * 1.4, y0 + 3.3, DER + 0.09), m.altin)
    }
    // Yeşil kartuş: yazısız düz zemin, altın çerçeve
    ek(kutuG(2.5, 0.8, 0.06).translate(0, y0 + 5.95, DER + 0.03), levhaYesil)
    ek(kutuG(2.72, 1.02, 0.04).translate(0, y0 + 5.95, DER + 0.01), m.altin)
    ek(kutuG(G + 0.15, 0.1, DER + 0.12).translate(0, y0 + 5.42, DER / 2 + 0.02), m.altin)
    ek(kutuG(G + 0.15, 0.1, DER + 0.12).translate(0, TEPE - 0.05, DER / 2 + 0.02), m.altin)
    // Tepelik: altın yaldızlı kıvrımlı sivri alınlık
    const t = new THREE.Shape()
    t.moveTo(-G / 2 - 0.1, TEPE)
    t.bezierCurveTo(-1.8, TEPE + 0.5, -1.3, TEPE + 0.3, -1, TEPE + 0.72)
    t.bezierCurveTo(-0.7, TEPE + 0.98, -0.42, TEPE + 0.86, 0, TEPE + 1.5)
    t.bezierCurveTo(0.42, TEPE + 0.86, 0.7, TEPE + 0.98, 1, TEPE + 0.72)
    t.bezierCurveTo(1.3, TEPE + 0.3, 1.8, TEPE + 0.5, G / 2 + 0.1, TEPE)
    t.closePath()
    t.holes.push(kasKemer(new THREE.Path(), -1.5, 1.5, TEPE + 0.08, 0.7))
    ek(cikar(t, 0.1, DER - 0.04), m.altin)
    ek(new THREE.CircleGeometry(0.22, 16).translate(0, TEPE + 0.45, DER), madalyon)
    // Palmet ve gül motifleri
    for (const [x, y] of [[-1.85, 6.9], [1.85, 6.9], [-1.85, 5], [1.85, 5], [-1.85, 3.6], [1.85, 3.6]]) {
      ek(new THREE.TorusGeometry(0.14, 0.04, 6, 14).translate(x, y0 + y - 1, DER + 0.03), m.altin)
      ek(new THREE.SphereGeometry(0.07, 8, 6).translate(x, y0 + y - 1, DER + 0.04), m.altinKoyu)
    }
    // Askılı kandil
    ek(new THREE.CylinderGeometry(0.01, 0.01, 2.2, 4).translate(0, y0 + 3.75, 1.5), m.koyu)
    ek(yer(dondurG([[0.02, 0], [0.2, 0.16], [0.17, 0.3], [0.02, 0.42]], 10), 0, y0 + 2.26, 1.5), m.altinKoyu)
  }

  /** Minber: sade ahşap, kapı ve külahlı köşk; merdiveni yürünür. Mihrabın batısında (fotoğraf). */
  function minber() {
    const y0 = HARIM_Y, x = MINBER_X, EN = MINBER_EN, z0 = MINBER_Z0
    const BOY = HARIM_Z1 - z0
    const TEPE = MINBER_RAMPA.h + 0.8
    const yanS = new THREE.Shape()
    yanS.moveTo(0.7, y0); yanS.lineTo(BOY, y0); yanS.lineTo(BOY, y0 + TEPE)
    yanS.lineTo(BOY - 2, y0 + TEPE); yanS.lineTo(0.8, y0 + 1.2); yanS.lineTo(0.7, y0 + 0.9); yanS.closePath()
    const ek = (g: THREE.BufferGeometry, mal: Mal) => {
      g.rotateY(-Math.PI / 2)
      g.translate(x, 0, z0)
      k.ekle(g, mal)
    }
    for (const s of [-1, 1]) ek(cikar(yanS, 0.12, s * EN / 2 - 0.06), kirmiziAhsap)
    // Kenar kuşağı
    const kenar = new THREE.Shape()
    kenar.moveTo(0.8, y0 + 1.2); kenar.lineTo(BOY - 2, y0 + TEPE); kenar.lineTo(BOY - 2, y0 + TEPE + 0.14); kenar.lineTo(0.8, y0 + 1.36); kenar.closePath()
    for (const s of [-1, 1]) ek(cikar(kenar, 0.16, s * EN / 2 - 0.08), m.ceviz)
    // Alt kuşakta küçük kemerli panolar
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
      const s0 = 1.15 + i * 0.86
      ek(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), s0, y0 + 0.14, 0.56, 0.42), 6).translate(0, 0, sd * (EN / 2 + (sd > 0 ? 0.065 : 0.065))), koyuAhsap)
    }
    // Basamaklar: yürüme rampasıyla aynı eğimde
    const ADIM = 12
    const r = MINBER_RAMPA
    for (let i = 0; i < ADIM; i++) {
      const t = (i + 1) / ADIM, s0 = r.z0 - z0 + (i / ADIM) * (r.z1 - r.z0), s1 = r.z0 - z0 + t * (r.z1 - r.z0)
      ek(kutuG(s1 - s0, t * r.h, EN - 0.24).translate((s0 + s1) / 2, y0 + (t * r.h) / 2, 0), m.ahsap)
    }
    ek(kutuG(BOY - (r.z1 - z0), r.h, EN - 0.24).translate((r.z1 - z0 + BOY) / 2, y0 + r.h / 2, 0), m.ahsap)
    // Kapı: açık, iki söve ve taçlı lento
    for (const s of [-1, 1]) ek(kutuG(0.75, 3, 0.26).translate(0.38, y0 + 1.5, s * (EN / 2 - 0.02)), kirmiziAhsap)
    ek(kutuG(0.75, 0.55, EN + 0.26).translate(0.38, y0 + 2.75, 0), kirmiziAhsap)
    const tac = new THREE.Shape()
    tac.moveTo(-EN / 2 - 0.1, 0); tac.quadraticCurveTo(-0.3, 0.1, 0, 0.6); tac.quadraticCurveTo(0.3, 0.1, EN / 2 + 0.1, 0); tac.closePath()
    const tacG = cikar(tac, 0.22, -0.11); tacG.rotateY(Math.PI / 2)
    ek(tacG.translate(0.38, y0 + 3.02, 0), kirmiziAhsap)
    // Köşk ve külah: en üst yürüme kotunun üstünde
    const kskS = BOY - 0.75
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ek(kutuG(0.14, 2.2, 0.14).translate(kskS + a * 0.55, y0 + r.h + 1.1, b * (EN / 2 - 0.05)), kirmiziAhsap)
    }
    ek(kutuG(1.4, 0.2, EN + 0.1).translate(kskS, y0 + r.h + 2.3, 0), kirmiziAhsap)
    ek(duzGolge(silindirG(0.05, EN * 0.72, 1.7, 4).rotateY(Math.PI / 4)).translate(kskS, y0 + r.h + 3.25, 0), kirmiziAhsap)
    ek(new THREE.SphereGeometry(0.1, 8, 6).translate(kskS, y0 + r.h + 4.15, 0), m.altin)
  }

  /** Halka avize ve küçük askı lambalar: fotoğraftaki gibi armut biçimli cam kandiller. */
  function avize() {
    const cy = HARIM_Y + 5.3, cz = HARIM_ORTA
    const tepe = KASNAK_ALT + KASNAK_H + KUBBE_IC_H - 0.4
    const RS = [4.5, 3.3]
    RS.forEach((R, i) => {
      const y = cy + i * 0.55
      k.ekle(new THREE.TorusGeometry(R, 0.08, 8, 56).rotateX(Math.PI / 2).translate(0, y, cz), m.bronz)
      const n = i === 0 ? 20 : 14
      for (let a = 0; a < n; a++) {
        const t = (a / n) * Math.PI * 2, x = Math.sin(t) * R, z = cz + Math.cos(t) * R
        k.ekle(yer(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 3), x, y - 0.14, z), m.koyu)
        k.ekle(yer(dondurG([[0.02, 0.34], [0.11, 0.24], [0.13, 0.13], [0.03, 0]], 10), x, y - 0.56, z), camLamba)
        if (a % 3 === 0) for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) {
          k.ekle(new THREE.PlaneGeometry(0.55, 0.55).rotateX(rx).rotateY(ry).translate(x, y - 0.42, z), m.lambaHale)
        }
      }
    })
    for (let n = 0; n < 8; n++) {
      const t = (n / 8) * Math.PI * 2, x = Math.sin(t) * RS[0], z = cz + Math.cos(t) * RS[0]
      const uz = Math.hypot(x, tepe - cy, z - cz)
      const ip = new THREE.CylinderGeometry(0.012, 0.012, uz, 4)
      ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-x, tepe - cy, cz - z).normalize()))
      k.ekle(ip.translate(x / 2, (cy + tepe) / 2, (z + cz) / 2), m.koyu)
    }
    // Duvar kemerleri arasında demir gergiler ve küçük askılar
    for (const [ax, az, bx, bz] of [[-HARIM_YARI, HARIM_Z0 + 1, HARIM_YARI, HARIM_Z0 + 1], [-HARIM_YARI, HARIM_Z1 - 1, HARIM_YARI, HARIM_Z1 - 1], [-HARIM_YARI + 1, HARIM_Z0, -HARIM_YARI + 1, HARIM_Z1], [HARIM_YARI - 1, HARIM_Z0, HARIM_YARI - 1, HARIM_Z1]]) {
      const uz = Math.hypot(bx - ax, bz - az)
      const c = new THREE.CylinderGeometry(0.035, 0.035, uz, 5).rotateZ(Math.PI / 2)
      if (ax === bx) c.rotateY(Math.PI / 2)
      k.ekle(c.translate((ax + bx) / 2, KORNIS + 0.3, (az + bz) / 2), m.koyu)
      const x = (ax + bx) / 2, z = (az + bz) / 2
      k.ekle(yer(new THREE.CylinderGeometry(0.008, 0.008, 3.4, 3), x, KORNIS + 0.3 - 1.7, z), m.koyu)
      k.ekle(yer(dondurG([[0.03, 0], [0.22, 0.14], [0.18, 0.3], [0.03, 0.42]], 8), x, KORNIS - 3.6, z), camLamba)
    }
  }

  function minare(x: number, z: number) {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z), mal)
    const TABAN = 3.6
    // Saçak seviyesine kadar kare kesme taş kaide (kaynak)
    ek(kutuG(TABAN, SACAK + 0.4, TABAN).translate(0, (SACAK + 0.4) / 2, 0), m.tas)
    for (const y of [1.5, HARIM_Y + 4.3]) ek(kutuG(TABAN + 0.2, 0.2, TABAN + 0.2).translate(0, y, 0), m.mermer)
    ek(kutuG(TABAN + 0.25, 0.28, TABAN + 0.25).translate(0, SACAK + 0.5, 0), m.mermer)
    ek(duzGolge(silindirG(1.25, TABAN / 2 * Math.SQRT2, 1.8, 8).rotateY(Math.PI / 8)).translate(0, SACAK + 1.55, 0), m.tas)
    const G0 = SACAK + 2.45, G1 = 31.5
    ek(dondurG([[1.28, G0], [1.15, G1]], 28), m.tas)
    for (const y of [G0 + 0.3, 21, 26]) ek(silindirG(1.28, 1.28, 0.2, 28).translate(0, y, 0), m.mermer)
    // Şerefe altı: stalaktit biçimli kademeler (kaynak)
    for (let t = 0; t < 4; t++) {
      const r = 1.15 + t * 0.2, y = G1 + t * 0.42
      ek(silindirG(r + 0.14, r, 0.42, 20).translate(0, y + 0.21, 0), m.tas)
      for (let a = 0; a < 16; a++) {
        const teta = ((a + (t % 2) * 0.5) * Math.PI * 2) / 16
        const h = new THREE.SphereGeometry(0.22, 5, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.1, 0.5)
        ek(h.translate(0, y + 0.01, r + 0.05).rotateY(teta), m.taskoyu)
      }
    }
    const SY = G1 + 1.7
    ek(silindirG(2.05, 2.05, 0.22, 28).translate(0, SY, 0), m.mermer)
    for (let a = 0; a < 20; a++) {
      const t = (a * Math.PI * 2) / 20
      ek(kutuG(0.58, 0.95, 0.09).translate(0, SY + 0.57, 1.95).rotateY(t), m.tas)
    }
    ek(silindirG(2.05, 2.05, 0.1, 28, true).translate(0, SY + 1.08, 0), m.mermer)
    // Üst gövde, üç taş bilezik, altıgen tabanlı sivri külah (kaynak)
    ek(dondurG([[1.02, SY], [0.95, SY + 5]], 22), m.tas)
    for (const y of [SY + 4.1, SY + 4.5, SY + 4.9]) ek(silindirG(1.1, 1.1, 0.14, 22).translate(0, y, 0), m.mermer)
    ek(duzGolge(silindirG(0.06, 1.12, 4.2, 6)).translate(0, SY + 7.15, 0), m.kursun)
    ek(dondurG([[0.1, 0], [0.04, 0.2], [0.12, 0.42], [0.04, 0.62], [0.09, 0.82], [0.01, 1.35], [0, 1.4]], 8).translate(0, SY + 9.2, 0), m.altin)
  }

  function turbe() {
    const cz = TURBE_Z
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, cz, a), mal)
      const girisYuzu = n === 1 // Güneydoğu yüzü: giriş
      const guneyYuzu = n === 0 // Güney yüzü: niyaz penceresi tarafı
      const W = TURBE_KENAR / 2 + 0.02
      const s = dikdortgen(-W, 0, W, TURBE_H)
      const pG = 2.2, pY0 = TURBE_Y + 2.1, pD = 3.05
      if (girisYuzu) s.holes.push(dikdortgen(-1.25, TURBE_Y + 0.12, 1.25, TURBE_Y + 3.85) as unknown as THREE.Path)
      else if (!guneyYuzu) s.holes.push(yuvarlakKemer(new THREE.Path(), 0, pY0, pG, pD))
      ek(cikar(s, TURBE_DIS - TURBE_IC, TURBE_IC), almasik)
      // Dış köşede taş dikme, tuğla kemer alınlığı (kaynak), demir parmaklıklı pencere
      ek(kutuG(0.3, TURBE_H, 0.1).translate(W - 0.1, TURBE_H / 2, TURBE_DIS + 0.03), m.tas)
      if (!girisYuzu && !guneyYuzu) {
        ek(cikar(kemerCerceve(0, pY0 + pD, pG + 0.58, pG, 0), 0.1, TURBE_DIS), m.tugla)
        ek(kutuG(pG + 0.5, 0.12, 0.35).translate(0, pY0 - 0.06, TURBE_DIS + 0.02), m.mermer)
        const c = uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, pY0, pG, pD), 12))
        ek(c.clone().translate(0, 0, TURBE_DIS - 0.3), demir)
        ek(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, pY0, pG, pD), 12)).translate(0, 0, TURBE_IC + 0.15), demirIc)
      }
      // İç yüz: açık yeşil mermer taklidi, koyu çerçeve
      const icS = dikdortgen(-TURBE_KENAR * (TURBE_IC / TURBE_DIS) / 2 - 0.02, TURBE_Y, TURBE_KENAR * (TURBE_IC / TURBE_DIS) / 2 + 0.02, TURBE_H)
      if (girisYuzu) icS.holes.push(dikdortgen(-1.25, TURBE_Y + 0.12, 1.25, TURBE_Y + 3.85) as unknown as THREE.Path)
      else if (!guneyYuzu) icS.holes.push(yuvarlakKemer(new THREE.Path(), 0, pY0, pG, pD))
      ek(cikar(icS, 0.02, TURBE_IC - 0.02), turbeDuvar)
      if (guneyYuzu) {
        // Niyaz penceresi içten: aydınlık parmaklık
        ek(uvSigdir(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, TURBE_Y + 2, 2.4, 2.8), 12)).translate(0, 0, TURBE_IC - 0.05), demirIc)
      }
      // Kuşak, korniş ve içte yeşil pano bandı
      ek(kutuG(TURBE_KENAR * (TURBE_IC / TURBE_DIS), 0.18, 0.05).translate(0, TURBE_Y + 1.35, TURBE_IC - 0.04), m.ceviz)
      ek(kutuG(TURBE_KENAR * (TURBE_IC / TURBE_DIS), 0.2, 0.08).translate(0, TURBE_H - 0.1, TURBE_IC - 0.05), m.altinKoyu)
      ek(kutuG(TURBE_KENAR + 0.35, 0.35, 0.4).translate(0, TURBE_H + 0.05, TURBE_DIS), m.mermer)
    }
    // Kasnak: krem renkli sekizgen, kademeli silme ve madalyonlar
    const KY0 = TURBE_H + 0.2, KH = 2.6, RK = 7.5
    const ky = (g: THREE.BufferGeometry, mal: Mal) => kKasnak.ekle(yer(g, 0, 0, cz), mal)
    ky(duzGolge(silindirG(RK, RK, KH, 8, true).rotateY(Math.PI / 8)).translate(0, KY0 + KH / 2, 0), siva)
    ky(duzGolge(silindirG(RK + 0.25, RK + 0.25, 0.28, 8, true).rotateY(Math.PI / 8)).translate(0, KY0 + 0.12, 0), siva)
    ky(duzGolge(silindirG(RK + 0.4, RK + 0.05, 0.45, 8, true).rotateY(Math.PI / 8)).translate(0, KY0 + KH + 0.05, 0), siva)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4, yuz = RK * Math.cos(Math.PI / 8)
      const h = new THREE.Shape(); h.absarc(0, KY0 + KH / 2, 0.52, 0, Math.PI * 2, false)
      const hd = new THREE.Path(); hd.absarc(0, KY0 + KH / 2, 0.38, 0, Math.PI * 2, true); h.holes.push(hd)
      kKasnak.ekle(yer(cikar(h, 0.08, yuz), 0, 0, cz, a), m.krem)
      kKasnak.ekle(yer(kutuG(0.22, KH, 0.14).translate(RK * Math.sin(Math.PI / 8), KY0 + KH / 2, yuz), 0, 0, cz, a), m.krem)
    }
    // İç tavan: sekizgen tonoz düzlem ve kubbe
    kKasnak.ekle(yer(duzGolge(silindirG(6.2 / Math.cos(Math.PI / 8) - 0.05, 6.2 / Math.cos(Math.PI / 8) - 0.05, KH + 0.2, 8, true).rotateY(Math.PI / 8)), 0, KY0 + KH / 2 - 0.05, cz), turbeDuvar)
    const DKY = KY0 + KH + 0.25
    const ic: [number, number][] = []
    for (let t = 0; t <= 14; t++) {
      const b = (t / 14) * Math.PI / 2
      ic.push([Math.max(6.5 * Math.pow(Math.cos(b), 0.88), 0.001), 4.4 * Math.pow(Math.sin(b), 1.05)])
    }
    const icK = dondurG(ic, 48, [1, 1])
    const ip = icK.attributes.position, iu = icK.attributes.uv
    for (let i = 0; i < iu.count; i++) iu.setXY(i, ip.getX(i) / 13 + 0.5, ip.getZ(i) / 13 + 0.5)
    kKubbe.ekle(yer(icK, 0, DKY - 0.2, cz), icKubbe)
    kKubbe.ekle(yer(kaburgaliKubbe(7.05, 4.9, 32, 0.15), 0, DKY, cz), m.kubbe)
    kKubbe.ekle(yer(dondurG([[0.22, 0], [0.09, 0.22], [0.24, 0.48], [0.08, 0.78], [0.19, 1], [0.03, 1.8], [0, 1.85]], 12), 0, DKY + 4.75, cz), m.altin)

    // Avize: merkezde büyük (kaynak)
    const ay = TURBE_Y + 4.6
    k.ekle(new THREE.TorusGeometry(1.3, 0.05, 6, 28).rotateX(Math.PI / 2).translate(0, ay, cz), m.altin)
    k.ekle(new THREE.TorusGeometry(0.75, 0.04, 6, 22).rotateX(Math.PI / 2).translate(0, ay + 0.7, cz), m.altin)
    k.ekle(yer(silindirG(0.015, 0.015, DKY + 4 - ay, 4), 0, (ay + DKY + 4) / 2, cz), m.koyu)
    for (let n = 0; n < 12; n++) {
      const t = (n / 12) * Math.PI * 2, x = Math.sin(t) * 1.3, z = cz + Math.cos(t) * 1.3
      k.ekle(yer(new THREE.SphereGeometry(0.08, 8, 6), x, ay - 0.15, z), camLamba)
      if (n % 2 === 0) for (const [rx, ry] of [[0, 0], [0, Math.PI / 2], [Math.PI / 2, 0]]) k.ekle(new THREE.PlaneGeometry(0.7, 0.7).rotateX(rx).rotateY(ry).translate(x, ay - 0.15, z), m.lambaHale)
    }
    // Sandukalar: Emir Sultan'ınki daha büyük (kaynak); korkulukla çevrili. Kumaş deseni temsilîdir.
    const sanduka = (x: number, z: number, g: number, boy: number, h: number) => {
      const s = new THREE.Shape()
      s.moveTo(-g / 2, 0); s.lineTo(g / 2, 0); s.lineTo(g / 2, h * 0.55); s.quadraticCurveTo(g / 2 - 0.03, h, 0, h); s.quadraticCurveTo(-g / 2 + 0.03, h, -g / 2, h * 0.55); s.closePath()
      const c = cikar(s, boy, -boy / 2)
      const cu = c.attributes.uv
      for (let i = 0; i < cu.count; i++) cu.setXY(i, cu.getX(i) * 0.8, cu.getY(i) * 0.8)
      k.ekle(yer(c, x, TURBE_Y, z), ortu)
      k.ekle(yer(new THREE.SphereGeometry(g * 0.22, 10, 8).scale(1, 0.72, 1), x, TURBE_Y + h + g * 0.1, z - boy / 2 + g * 0.26), levhaYesil)
    }
    sanduka(0, cz + 0.3, 1.25, 3.1, 1.3)
    sanduka(-1.55, cz + 0.2, 0.85, 2.2, 0.95)
    sanduka(1.55, cz + 0.2, 0.85, 2.2, 0.95)
    sanduka(-1.5, cz - 2.2, 0.7, 1.7, 0.82)
    sanduka(1.5, cz - 2.2, 0.7, 1.7, 0.82)
    const KX = 2.7, KZ = 3.75
    for (const s of [-1, 1]) {
      const rx = kutuG(0.08, 1.15, 2 * KZ); const ux = rx.attributes.uv
      for (let i = 0; i < ux.count; i++) ux.setXY(i, ux.getX(i) / 0.95, ux.getY(i) / 1.15)
      k.ekle(rx.translate(s * KX, TURBE_Y + 0.58, cz), korkulukM)
      const rz = kutuG(2 * KX, 1.15, 0.08); const uz = rz.attributes.uv
      for (let i = 0; i < uz.count; i++) uz.setXY(i, uz.getX(i) / 0.95, uz.getY(i) / 1.15)
      k.ekle(rz.translate(0, TURBE_Y + 0.58, cz + s * KZ), korkulukM)
      for (const t of [-1, 1]) k.ekle(yer(dondurG([[0.11, 0], [0.05, 0.1], [0.05, 1.25], [0.12, 1.32], [0, 1.5]], 8), s * KX, TURBE_Y, cz + t * KZ), m.altin)
    }
  }

  /** Hamam, tekke, Beşir Ağa Çeşmesi ve dış avlu duvarı: dış kütle. */
  function disKutleler() {
    // Dış avlu duvarı ve çeşme: caminin kıble yönünde, güneydoğu köşede (kaynak)
    const DZ = CAMI_Z1 + 3.2
    blok(-21, 21, 0, 2.7, DZ - 0.3, DZ + 0.3, almasik)
    blok(-21.2, 21.2, 2.7, 2.9, DZ - 0.4, DZ + 0.4, m.mermer)
    blok(-21, -20.5, 0, 2.7, -18, DZ, almasik); blok(20.5, 21, 0, 2.7, -18, DZ, almasik)
    // Çeşme: 1,20 × 2,80 m (kaynak), mermer ayna, iki yanda peyke
    const cx = 15.5, cz = DZ + 0.3
    blok(cx - 1.4, cx + 1.4, 0, 2.6, cz, cz + 0.22, m.mermer)
    blok(cx - 0.5, cx + 0.5, 0.2, 1.5, cz + 0.22, cz + 0.24, sutunBeyaz)
    k.ekle(yer(new THREE.CircleGeometry(0.5, 16, 0, Math.PI).translate(0, 1.5, 0), cx, 0, cz + 0.24), sutunKahve)
    blok(cx - 0.6, cx + 0.6, 0, 0.42, cz + 0.22, cz + 0.72, m.mermer)
    for (const s of [-1, 1]) blok(cx + s * 1.3 - 0.35, cx + s * 1.3 + 0.35, 0, 0.45, cz + 0.22, cz + 0.72, m.mermer)

    // Hamam: caminin güneyindeki meydanda (kaynak), kuzey-güney doğrultusunda, kurşun kubbeli ve fenerli
    const hx = -12.5, hz0 = DZ + 5
    const taban = (x0: number, x1: number, z0: number, z1: number, y: number) => {
      blok(x0, x1, 0, y, z0, z1, almasik)
      blok(x0 - 0.2, x1 + 0.2, y, y + 0.28, z0 - 0.2, z1 + 0.2, m.tugla)
    }
    const fener = (x: number, z: number, y: number, r: number) => {
      kCati.ekle(yer(duzGolge(silindirG(0.03, r, r * 1.3, 4).rotateY(Math.PI / 4)), x, y + r * 0.65, z), m.kursun)
    }
    const kub = (x: number, z: number, y: number, R: number, H: number, sekizgen = true) => {
      if (sekizgen) kKasnak.ekle(yer(duzGolge(silindirG(R + 0.5, R + 0.75, 1.15, 8).rotateY(Math.PI / 8)), x, y + 0.57, z), almasik)
      kKubbe.ekle(yer(kaburgaliKubbe(R, H, 16, 0.1), x, y + 1.15, z), m.kubbe)
    }
    taban(hx - 6.2, hx + 6.2, hz0, hz0 + 12.6, 6.6)
    kub(hx, hz0 + 6.3, 6.7, 5.05, 3.7)
    fener(hx, hz0 + 6.3, 11.3, 0.8)
    // Cümle kapısı: kuzey cephesinde (kaynak), basık kemerli, mermer söveli, tuğla alınlıklı
    blok(hx - 0.85, hx + 0.85, 0, 2.5, hz0 - 0.03, hz0, m.mermer)
    blok(hx - 0.6, hx + 0.6, 0, 2.2, hz0 - 0.05, hz0 - 0.03, m.ahsap)
    k.ekle(yer(new THREE.ShapeGeometry(yuvarlakKemer(new THREE.Shape(), 0, 2.5, 1.8, 0.01), 8), hx, 0, hz0 - 0.03), m.tugla)
    for (const s of [-1, 1]) {
      blok(hx + s * 3.4 - 0.65, hx + s * 3.4 + 0.65, 2.5, 4.4, hz0 - 0.02, hz0, koyuAhsap)
      blok(hx + s * 3.4 - 0.75, hx + s * 3.4 + 0.75, 2.3, 2.4, hz0 - 0.2, hz0, m.mermer)
    }
    // Ilıklık ve sıcaklık: küçük kubbeler, sekizgen kasnak
    const hz1 = hz0 + 12.6
    taban(hx - 4.3, hx + 4.3, hz1, hz1 + 9, 4.6)
    kub(hx, hz1 + 5, 4.7, 3.85, 3)
    fener(hx, hz1 + 5, 8.5, 0.6)
    for (const [dx, dz] of [[-4.9, 4.7], [4.9, 4.7]]) {
      taban(hx + dx - 1.6, hx + dx + 1.6, hz1 + dz - 1.8, hz1 + dz + 1.8, 3.8)
      kub(hx + dx, hz1 + dz, 3.9, 1.35, 1.3, false)
      fener(hx + dx, hz1 + dz, 6.1, 0.34)
    }
    // Su deposu: dikdörtgen, tonoz örtülü (kaynak)
    blok(hx - 3.8, hx + 3.8, 0, 3.2, hz1 + 9, hz1 + 11.8, almasik)
    kCati.ekle(yer(new THREE.CylinderGeometry(1.4, 1.4, 7.6, 16, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2), hx, 3.2, hz1 + 10.4), m.kursun)

    // Tekke: meydanın doğusunda dış kütle (2008-2010'da yeniden ihya edilmiştir; konum ve biçim temsilîdir).
    const tx = 14
    blok(tx - 6, tx + 6, 0, 5.4, hz0 + 0.5, hz0 + 11, almasik)
    blok(tx - 6.3, tx + 6.3, 5.4, 5.6, hz0 + 0.2, hz0 + 11.3, m.tas)
    kCati.ekle(kirmaCati(tx - 6.6, tx + 6.6, hz0, hz0 + 11.5, 5.6, 7.5, 3), m.kursun)
    for (const x of [-3.5, 0, 3.5]) {
      blok(tx + x - 0.55, tx + x + 0.55, 1.6, 3.5, hz0 + 0.48, hz0 + 0.5, koyuAhsap)
    }
  }

  function selvi(x: number, z: number, boy: number) {
    const R = 2 + boy * 0.02
    const p: [number, number][] = [[0.15, 1.5], [R * 0.6, 2.1], [R * 0.9, boy * 0.2], [R, boy * 0.33], [R * 0.95, boy * 0.47], [R * 0.8, boy * 0.61], [R * 0.6, boy * 0.75], [R * 0.38, boy * 0.87], [R * 0.16, boy * 0.96], [0, boy]]
    const g = dondurG(p, 22)
    const poz = g.attributes.position, tohum = x * 0.37 + z * 0.61
    for (let v = 0; v < poz.count; v++) {
      const vx = poz.getX(v), vy = poz.getY(v), vz = poz.getZ(v), a = Math.atan2(vx, vz)
      const o = 1 + 0.1 * Math.sin(a * 3 + vy * 0.9 + tohum) + 0.07 * Math.sin(a * 7 - vy * 1.9 + tohum * 2)
      poz.setX(v, vx * o); poz.setZ(v, vz * o)
    }
    g.computeVertexNormals()
    k.ekle(yer(g, x, 0, z), m.selvi)
    k.ekle(yer(silindirG(0.2, 0.32, 2.2, 8), x, 1.1, z), m.ahsap)
  }

  function cevre() {
    // Mezarlık ve selviler: batı ve doğu yanında (kuşbakışı fotoğraf); konumlar temsilîdir.
    const rastgele = (t: number) => () => { t = (t * 16807) % 2147483647; return (t - 1) / 2147483646 }
    const r = rastgele(4177)
    const alanlar = [[-34, -22, -30, 3], [22, 34, -30, 3], [-33, -22, 6, 30], [22, 33, 6, 30]]
    for (const [x0, x1, z0, z1] of alanlar) {
      blok(x0, x1, 0, 0.1, z0, z1, pbr({ color: '#4d5a39', roughness: 1 }))
      for (let i = 0; i < 26; i++) {
        const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0)
        blok(x - 0.05, x + 0.05, 0.1, 0.9 + r() * 0.5, z - 0.22, z + 0.22, mezar)
        blok(x - 0.4, x + 0.4, 0.1, 0.22, z - 0.22, z + 0.22, mezar)
      }
    }
    for (const [x, z, h] of [[-22, -32, 22], [-17, -34, 25], [-36, -24, 20], [-37, 16, 21], [26, -24, 24], [30, -8, 21], [25, 8, 20], [29, 22, 24], [12, -34, 22], [33, 28, 19]]) selvi(x, z, h)
    // Çınar: tekke önünde; bugün meydandaki ulu ağaç (fotoğraf). Taç birleşik kürelerden.
    const ax = 0, az = CAMI_Z1 + 11
    k.ekle(yer(silindirG(0.55, 0.9, 7, 10), ax, 3.5, az), m.ahsap)
    const c = (dx: number, y: number, dz: number, R: number) => {
      const g = new THREE.IcosahedronGeometry(R, 3)
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const o = 1 + 0.12 * Math.sin(p.getX(v) * 1.1 + p.getY(v) * 1.4 + dx) + 0.08 * Math.sin(p.getZ(v) * 2.3 + dz)
        p.setXYZ(v, p.getX(v) * o, p.getY(v) * o, p.getZ(v) * o)
      }
      // Küre normalleri yumuşak taç verir; Icosahedron dizinsiz olduğu için hesaplanan normal köşeli çıkardı.
      const nrm = g.attributes.normal
      for (let v = 0; v < p.count; v++) { const l = Math.hypot(p.getX(v), p.getY(v), p.getZ(v)) || 1; nrm.setXYZ(v, p.getX(v) / l, p.getY(v) / l, p.getZ(v) / l) }
      k.ekle(yer(g, ax + dx, y, az + dz), cinar)
    }
    c(0, 11, 0, 6.2); c(-4.6, 9.5, 2, 4.4); c(4.4, 9.8, -2, 4.6); c(1, 9.2, 4.6, 4); c(-1, 13.2, -2, 4.2)
  }

  function yurume(): IcYurume {
    const kaydir = <T extends { z0: number; z1: number }>(a: T): T => ({ ...a, z0: a.z0 + OZ, z1: a.z1 + OZ })
    const kutular: Kutu[] = [
      // Cami kütlesi: yan duvarlar ve kuzey duvarı (kapı boş)
      { x0: -REVAK_DIS_X, x1: -HARIM_YARI, z0: CAMI_Z0, z1: CAMI_Z1 },
      { x0: HARIM_YARI, x1: REVAK_DIS_X, z0: CAMI_Z0, z1: CAMI_Z1 },
      { x0: -HARIM_YARI, x1: -1.15, z0: CAMI_Z0, z1: HARIM_Z0 },
      { x0: 1.15, x1: HARIM_YARI, z0: CAMI_Z0, z1: HARIM_Z0 },
      // Revaktaki imam ve müezzin odaları, merdivenler
      { x0: AVLU_X, x1: REVAK_DIS_X, z0: AVLU_Z + 0.45, z1: CAMI_Z0 },
      { x0: -REVAK_DIS_X, x1: -AVLU_X, z0: AVLU_Z + 0.45, z1: CAMI_Z0 },
      { x0: 8.1, x1: AVLU_X, z0: CAMI_Z0 - 3.6, z1: CAMI_Z0 },
      { x0: -AVLU_X, x1: -8.1, z0: CAMI_Z0 - 3.6, z1: CAMI_Z0 },
      // Türbe önü duvar ve iniş koridoru
      { x0: -REVAK_DIS_X, x1: GIRIS_X0, z0: -14, z1: REVAK_K_Z },
      { x0: GIRIS_X1, x1: REVAK_DIS_X, z0: -16.6, z1: REVAK_K_Z },
      { x0: 6.2, x1: REVAK_DIS_X, z0: -30, z1: -10 },
      { x0: -REVAK_DIS_X, x1: -6.2, z0: -30, z1: -10 },
      // Sanduka korkuluğu
      { x0: -2.75, x1: 2.75, z0: TURBE_Z - 3.8, z1: TURBE_Z + 3.8 },
      // Mihrap ve minber
      { x0: -2.6, x1: 2.6, z0: HARIM_Z1 - 0.85, z1: HARIM_Z1 },
      { x0: MINBER_X - MINBER_EN / 2 - 0.06, x1: MINBER_X - MINBER_EN / 2 + 0.06, z0: MINBER_Z0 + 0.7, z1: HARIM_Z1 },
      { x0: MINBER_X + MINBER_EN / 2 - 0.06, x1: MINBER_X + MINBER_EN / 2 + 0.06, z0: MINBER_Z0 + 0.7, z1: HARIM_Z1 },
      { x0: MINBER_X - MINBER_EN / 2 - 0.15, x1: MINBER_X - 0.74, z0: MINBER_Z0, z1: MINBER_Z0 + 0.76 },
      { x0: MINBER_X + 0.74, x1: MINBER_X + MINBER_EN / 2 + 0.15, z0: MINBER_Z0, z1: MINBER_Z0 + 0.76 },
      { x0: MINBER_X - MINBER_EN / 2, x1: MINBER_X + MINBER_EN / 2, z0: MINBER_RAMPA.z1 + 0.8, z1: HARIM_Z1 },
      // Kürsü ve saat
      { x0: 4.9, x1: 6.3, z0: HARIM_Z1 - 4.3, z1: HARIM_Z1 - 2.9 },
      { x0: 6, x1: 6.6, z0: HARIM_Z1 - 0.4, z1: HARIM_Z1 },
    ]
    // Türbe köşeleri: sekizgeni dört basamaklı kutularla kapatır. Güneydoğu yüzünde koridor açık kalır.
    const IC = TURBE_IC, CARP = IC * Math.SQRT2 + 0.02
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      for (const x of [IC - 3.65, IC - 2.65, IC - 1.65, IC - 0.65]) {
        const z = CARP - x
        const a = Math.min(sx * x, sx * IC), b = Math.max(sx * x, sx * IC)
        let x0 = a, x1 = b
        // Koridor x aralığını boş bırak
        if (sx > 0 && sz > 0) {
          if (x1 <= GIRIS_X1 && x0 >= GIRIS_X0) continue
          if (x0 < GIRIS_X1 && x1 > GIRIS_X1) x0 = GIRIS_X1
          if (x0 < GIRIS_X0) x1 = GIRIS_X0
        }
        const za = TURBE_Z + Math.min(sz * z, sz * IC), zb = TURBE_Z + Math.max(sz * z, sz * IC)
        kutular.push({ x0, x1, z0: za, z1: zb })
      }
    }
    const daireler: { x: number; z: number; r: number }[] = [
      { x: 0, z: 0 + OZ, r: 3.3 },
      { x: 2.65, z: HARIM_Z1 - 0.65 + OZ, r: 0.28 }, { x: -2.65, z: HARIM_Z1 - 0.65 + OZ, r: 0.28 },
    ]
    for (const x of [-AVLU_X, -6.6, -2.2, 2.2, 6.6, AVLU_X]) for (const z of [-AVLU_Z, AVLU_Z]) daireler.push({ x, z: z + OZ, r: 0.3 })
    for (const x of [-AVLU_X, AVLU_X]) for (const z of [-2.2, 2.2]) daireler.push({ x, z: z + OZ, r: 0.3 })
    const zeminler: ZeminAlani[] = [
      // Avlu, revaklar ve harim. Revak 15 cm yüksektir; harim revakla aynı kottadır.
      { x0: -REVAK_DIS_X, x1: REVAK_DIS_X, z0: REVAK_K_Z, z1: AVLU_Z, h0: hAvlu, h1: hAvlu },
      { x0: -REVAK_DIS_X, x1: REVAK_DIS_X, z0: AVLU_Z - 0.35, z1: CAMI_Z0, h0: hHarim, h1: hHarim },
      { x0: -REVAK_DIS_X, x1: REVAK_DIS_X, z0: REVAK_K_Z, z1: -AVLU_Z + 0.35, h0: hHarim, h1: hHarim },
      { x0: -REVAK_DIS_X, x1: -AVLU_X + 0.35, z0: -AVLU_Z, z1: AVLU_Z, h0: hHarim, h1: hHarim },
      { x0: AVLU_X - 0.35, x1: REVAK_DIS_X, z0: -AVLU_Z, z1: AVLU_Z, h0: hHarim, h1: hHarim },
      { x0: -HARIM_YARI, x1: HARIM_YARI, z0: CAMI_Z0 - 0.01, z1: HARIM_Z1 + 0.01, h0: hHarim, h1: hHarim },
      // Türbeye iniş: revak kotundan sanduka zeminine
      { x0: GIRIS_X0, x1: GIRIS_X1, z0: GIRIS_Z, z1: REVAK_K_Z, h0: 0, h1: hHarim },
      // Minber merdiveni ve üst sahanlık
      { x0: MINBER_X - MINBER_EN / 2, x1: MINBER_X + MINBER_EN / 2, z0: MINBER_RAMPA.z0, z1: MINBER_RAMPA.z1, h0: hHarim, h1: hHarim + MINBER_RAMPA.h },
      { x0: MINBER_X - MINBER_EN / 2, x1: MINBER_X + MINBER_EN / 2, z0: MINBER_RAMPA.z1 - 0.01, z1: MINBER_RAMPA.z1 + 0.9, h0: hHarim + MINBER_RAMPA.h, h1: hHarim + MINBER_RAMPA.h },
    ]
    const gorus: Kutu[] = [
      { x0: -9.3, x1: -1.15, z0: CAMI_Z0, z1: HARIM_Z0 }, { x0: 1.15, x1: 9.3, z0: CAMI_Z0, z1: HARIM_Z0 },
      { x0: -9.3, x1: -7.6, z0: CAMI_Z0, z1: CAMI_Z1 }, { x0: 7.6, x1: 9.3, z0: CAMI_Z0, z1: CAMI_Z1 },
      { x0: -REVAK_DIS_X, x1: GIRIS_X0, z0: -13, z1: REVAK_K_Z }, { x0: GIRIS_X1, x1: REVAK_DIS_X, z0: -16, z1: REVAK_K_Z },
    ]
    return {
      sinir: { x0: -14.5, x1: 14.5, z0: TURBE_Z - TURBE_IC + OZ, z1: HARIM_Z1 + OZ },
      kutular: kutular.map(kaydir),
      daireler,
      zeminler: zeminler.map(kaydir),
      gorusKesenler: gorus.map(kaydir),
      gozY: GOZ,
      tabanY: TURBE_Y,
    }
  }

  function duraklar(): IcDurak[] {
    const d = (id: string, ad: string, x: number, h: number, z: number, bx: number, by: number, bz: number): IcDurak =>
      ({ id, ad, konum: [x, GOZ + h, z + OZ], bak: [bx, by, bz + OZ] })
    const rp = MINBER_RAMPA
    return [
      d('avlu', 'Avlu', -9.8, hAvlu, 4.6, 1, 3.8, -8),
      d('sadirvan', 'Şadırvan', 7.2, hAvlu, 3.6, 0, 3, -1),
      d('revak', 'Cami revakı', -4.4, hHarim, 8.6, 0, 3.6, CAMI_Z0),
      d('harim', 'Harim', 1.6, hHarim, 13.9, -0.3, 7.6, HARIM_Z1),
      d('mihrap', 'Mihrap', 0, hHarim, 20.6, 0, 5.4, HARIM_Z1),
      d('kubbe', 'Kubbe', 0.2, hHarim, HARIM_ORTA + 0.6, 0, 23, HARIM_ORTA),
      d('minber', 'Minber', 2.2, hHarim, HARIM_Z1 - 9.6, MINBER_X, 4.2, HARIM_Z1 - 3.4),
      d('minber-ust', 'Minbere çık', MINBER_X, hHarim + rp.h, rp.z1 + 0.3, 2, 4, HARIM_ORTA - 2),
      d('niyaz', 'Niyaz Penceresi', 0, hAvlu, -4.1, 0, 3.7, REVAK_K_Z),
      d('turbe', 'Türbe', 4.4, 0, -16, 0, TURBE_Y + 1.8, TURBE_Z),
      d('sanduka', 'Sandukalar', -4.2, 0, TURBE_Z + 1.6, 0, TURBE_Y + 1.1, TURBE_Z),
    ]
  }
}
