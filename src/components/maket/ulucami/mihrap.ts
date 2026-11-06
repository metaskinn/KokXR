// Ulu Camii mihrabı ve kıble duvarı: yüzeyler arşiv fotoğraflarından çıkarılmış ön görünüş dokusunu
// (yazılar dâhil) taşır; kod yazı üretmez. Kabartma derinlikleri fotoğraflara bakılarak temsilî verilmiştir.
// Oranlar DJI_0325 (karşıdan görünüş): çerçeve yükseklik/genişlik 1.52.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../data/acikYayin'
import { Kova, dondurG, silindirG, yer } from '../ulucamiParca'
import { hafifCihaz } from '../ulucamiZemin'

type Mal = THREE.Material

/** Çerçevenin dış ölçüleri (m); doku uzayı T: 1600 x 2432 px. */
export const MIHRAP = { G: 5.26, TEPE: 8.75, DER: 0.95 }
const TG = 1600, TH = 2432
/** Şamdanların yeri: duvardan uzaklık ve eksenden sapma (DJI_0325). */
export const SAMDAN = { x: 3.4, z: 0.85, r: 0.3 }

const dokuYukle = (ad: string) => {
  if (ACIK_YAYIN) return null
  const t = new THREE.TextureLoader().load(`/gorseller/ulu-camii/maket/${ad}${hafifCihaz() ? '-1k' : ''}.jpg`)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Dokuyu bozmadan fotoğraf gibi gösterir: taban rengin bir bölümü ışıktan bağımsızdır. */
const fotoMalzeme = (map: THREE.Texture | null, renk: string, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({
  map, color: map ? '#ffffff' : renk, roughness: 0.62, metalness: 0,
  emissive: map ? '#ffffff' : '#000000', emissiveMap: map, emissiveIntensity: map ? 0.14 : 0, side: THREE.DoubleSide, ...p,
})

/** Yerel: x sağa, y yukarı (dünya), z odaya doğru (duvar yüzü 0). */
export function ulucamiMihrabi(k: Kova, duvarZ: number, zemin: number, m: { altinKoyu: Mal; krem: Mal; bronz: Mal; koyu: Mal }) {
  const { G, TEPE, DER } = MIHRAP
  const dokuOn = dokuYukle('mihrap-tam')
  const on = fotoMalzeme(dokuOn, '#b8924e')
  const altin = fotoMalzeme(dokuOn, '#c89a3c', { roughness: 0.42, metalness: 0.3, emissiveIntensity: dokuOn ? 0.12 : 0 })
  const tx = (t: number) => (t / TG - 0.5) * G
  const ty = (t: number) => TEPE - (t / TH) * (TEPE - zemin)
  /** Düzlemsel izdüşüm: karşıdan bakınca fotoğrafla birebir, yürürken kabartma ayrışır. */
  const izdus = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position, uv = g.attributes.uv ?? new THREE.BufferAttribute(new Float32Array(p.count * 2), 2)
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / G + 0.5, (p.getY(i) - zemin) / (TEPE - zemin))
    g.setAttribute('uv', uv)
    return g
  }
  const ek = (g: THREE.BufferGeometry, mal: Mal = on) => k.ekle(yer(g, 0, 0, duvarZ, Math.PI), mal)
  const ekD = (g: THREE.BufferGeometry, mal: Mal = on) => ek(izdus(g), mal)
  /** Dörtgen (a,b,c,d saat yönü tersine, önden). */
  const dortgen = (a: number[], b: number[], c: number[], d: number[]) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
    g.computeVertexNormals()
    return g
  }
  const sekil = (s: THREE.Shape, z: number) => new THREE.ShapeGeometry(s, 14).translate(0, 0, z)
  const dik = (x0: number, y0: number, x1: number, y1: number) => {
    const s = new THREE.Shape()
    s.moveTo(tx(x0), ty(y0)); s.lineTo(tx(x0), ty(y1)); s.lineTo(tx(x1), ty(y1)); s.lineTo(tx(x1), ty(y0)); s.closePath()
    return s
  }

  /** Üstten ve yanlardan dolanan (altı açık) kademe: dış sınırdan iç sınıra, iç kenarda geri çekilen yüzle. */
  const kademe = (dx0: number, dy: number, dx1: number, ix0: number, iy: number, ix1: number, z: number, zIc: number) => {
    const s = new THREE.Shape()
    s.moveTo(tx(dx0), zemin); s.lineTo(tx(dx0), ty(dy)); s.lineTo(tx(dx1), ty(dy)); s.lineTo(tx(dx1), zemin)
    s.lineTo(tx(ix1), zemin); s.lineTo(tx(ix1), ty(iy)); s.lineTo(tx(ix0), ty(iy)); s.lineTo(tx(ix0), zemin); s.closePath()
    ekD(sekil(s, z))
    const i0 = tx(ix0), i1 = tx(ix1), iu = ty(iy)
    ekD(dortgen([i0, zemin, zIc], [i0, zemin, z], [i0, iu, z], [i0, iu, zIc]))
    ekD(dortgen([i1, zemin, z], [i1, zemin, zIc], [i1, iu, zIc], [i1, iu, z]))
    ekD(dortgen([i0, iu, zIc], [i0, iu, z], [i1, iu, z], [i1, iu, zIc]))
  }
  const Z1 = DER, Z2 = DER - 0.03, Z3 = DER - 0.07, ZA = DER - 0.17, ZB = DER - 0.22, ZT = DER - 0.42
  kademe(0, 8, 1600, 172, 198, 1430, Z1, Z2)
  kademe(172, 198, 1430, 235, 267, 1365, Z2, Z3)

  // Mavi kuşak ve üstündeki yazı levhası: levha hafifçe öne çıkar
  const LX0 = 290, LX1 = 1320, LY0 = 325, LY1 = 605
  const mavi = new THREE.Shape()
  mavi.moveTo(tx(235), zemin); mavi.lineTo(tx(235), ty(267)); mavi.lineTo(tx(1365), ty(267)); mavi.lineTo(tx(1365), zemin)
  mavi.lineTo(tx(1275), zemin); mavi.lineTo(tx(1275), ty(716)); mavi.lineTo(tx(330), ty(716)); mavi.lineTo(tx(330), zemin); mavi.closePath()
  ekD(sekil(mavi, Z3))
  const ZL = Z3 + 0.05
  ekD(sekil(dik(LX0, LY0, LX1, LY1), ZL))
  for (const [a, b] of [[[LX0, LY1], [LX1, LY1]], [[LX1, LY1], [LX1, LY0]], [[LX1, LY0], [LX0, LY0]], [[LX0, LY0], [LX0, LY1]]]) {
    ekD(dortgen([tx(a[0]), ty(a[1]), Z3], [tx(b[0]), ty(b[1]), Z3], [tx(b[0]), ty(b[1]), ZL], [tx(a[0]), ty(a[1]), ZL]))
  }
  // Mavi kuşaktan köşelik yüzeyine iniş
  for (const [x, y0, x1] of [[330, 716, 1275]]) {
    ekD(dortgen([tx(x), ty(y0), ZA], [tx(x), ty(y0), Z3], [tx(x1), ty(y0), Z3], [tx(x1), ty(y0), ZA]))
    ekD(dortgen([tx(x), zemin, ZA], [tx(x), zemin, Z3], [tx(x), ty(y0), Z3], [tx(x), ty(y0), ZA]))
    ekD(dortgen([tx(x1), zemin, Z3], [tx(x1), zemin, ZA], [tx(x1), ty(y0), ZA], [tx(x1), ty(y0), Z3]))
  }

  // Dış yan yüzler ve üst
  ekD(dortgen([tx(0), zemin, 0], [tx(0), zemin, Z1], [tx(0), ty(0), Z1], [tx(0), ty(0), 0]))
  ekD(dortgen([tx(TG), zemin, Z1], [tx(TG), zemin, 0], [tx(TG), ty(0), 0], [tx(TG), ty(0), Z1]))
  ekD(dortgen([tx(0), ty(0), Z1], [tx(TG), ty(0), Z1], [tx(TG), ty(0), 0], [tx(0), ty(0), 0]), m.altinKoyu)
  // Yan payanda: sütun arkasına inen kademe boşluğu
  for (const x of [330, 1275]) ekD(dortgen([tx(x), zemin, DER - 0.22], [tx(x), zemin, ZA], [tx(x), ty(1511), ZA], [tx(x), ty(1511), DER - 0.22]))

  // Sivri kemer: köşelik, yazılı kuşak, alınlık. Kemer eğrisi 0247 karesinden.
  const AY0 = 1511, ORTA = 810
  const disKemer = (p: THREE.Path, ters: boolean) => {
    const a: [number, number] = [340, AY0], t: [number, number] = [ORTA, 751], b: [number, number] = [1272, AY0]
    const k1: [number, number] = [430, 1085], k2: [number, number] = [1182, 1085]
    if (!ters) { p.lineTo(tx(a[0]), ty(a[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(b[0]), ty(b[1])) }
    else { p.lineTo(tx(b[0]), ty(b[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(a[0]), ty(a[1])) }
  }
  const IY0 = 1471
  const icKemer = (p: THREE.Path, ters: boolean) => {
    const a: [number, number] = [425, IY0], t: [number, number] = [ORTA, 841], b: [number, number] = [1192, IY0]
    const k1: [number, number] = [505, 1120], k2: [number, number] = [1112, 1120]
    if (!ters) { p.lineTo(tx(a[0]), ty(a[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(b[0]), ty(b[1])) }
    else { p.lineTo(tx(b[0]), ty(b[1])); p.quadraticCurveTo(tx(k2[0]), ty(k2[1]), tx(t[0]), ty(t[1])); p.quadraticCurveTo(tx(k1[0]), ty(k1[1]), tx(a[0]), ty(a[1])) }
  }
  // Köşelik: dış kemerin dışı
  const koselik = new THREE.Shape()
  koselik.moveTo(tx(330), ty(AY0)); koselik.lineTo(tx(330), ty(716)); koselik.lineTo(tx(1275), ty(716)); koselik.lineTo(tx(1275), ty(AY0))
  disKemer(koselik, true); koselik.closePath()
  ekD(sekil(koselik, ZA))
  // Yazılı kuşak
  const kusak = new THREE.Shape()
  kusak.moveTo(tx(340), ty(AY0))
  { const p = kusak; p.quadraticCurveTo(tx(430), ty(1085), tx(ORTA), ty(751)); p.quadraticCurveTo(tx(1182), ty(1085), tx(1272), ty(AY0)) }
  kusak.lineTo(tx(1192), ty(IY0)); icKemer(kusak, true); kusak.closePath()
  ekD(sekil(kusak, ZB))
  // Alınlık
  const alinlik = new THREE.Shape()
  alinlik.moveTo(tx(425), ty(IY0)); icKemer(alinlik, false); alinlik.closePath()
  ekD(sekil(alinlik, ZT))
  // Kemer yüzü kademesi: köşelikten kuşağa, kuşaktan alınlığa
  const egri = (a: [number, number], c: [number, number], b: [number, number], n: number) => {
    const v = new THREE.QuadraticBezierCurve(new THREE.Vector2(tx(a[0]), ty(a[1])), new THREE.Vector2(tx(c[0]), ty(c[1])), new THREE.Vector2(tx(b[0]), ty(b[1])))
    return v.getPoints(n)
  }
  const serit = (noktalar: THREE.Vector2[], z0: number, z1: number) => {
    for (let i = 0; i < noktalar.length - 1; i++) {
      const a = noktalar[i], b = noktalar[i + 1]
      ekD(dortgen([a.x, a.y, z0], [b.x, b.y, z0], [b.x, b.y, z1], [a.x, a.y, z1]))
    }
  }
  serit([...egri([340, AY0], [430, 1085], [ORTA, 751], 12), ...egri([ORTA, 751], [1182, 1085], [1272, AY0], 12)], ZB, ZA)
  serit([...egri([425, IY0], [505, 1120], [ORTA, 841], 12), ...egri([ORTA, 841], [1112, 1120], [1192, IY0], 12)], ZT, ZB)

  // Mukarnas: 0247 karesindeki kademeler (T uzayı). Her kademe öne doğru kabarık dilimlerden oluşur.
  const OFS = 586
  const kademeler: [number, number, number, number, number][] = [
    // x0, x1, yUst, yAlt, dilim
    [745, 870, 295, 395, 3],
    [695, 920, 396, 486, 4],
    [650, 965, 487, 553, 5],
    [555, 1060, 554, 618, 7],
    [540, 1075, 619, 680, 7],
    [490, 1122, 681, 735, 8],
    [465, 1148, 736, 838, 8],
  ]
  const zKademe = (i: number) => ZT + 0.09 + (i / (kademeler.length - 1)) * (DER - 0.04 - ZT - 0.09)
  kademeler.forEach(([x0, x1, yu, ya, n], i) => {
    const X = n * 6, Y = 4, z = zKademe(i), zOnce = i ? zKademe(i - 1) : ZT
    const konum: number[] = [], dizin: number[] = []
    for (let a = 0; a <= Y; a++) {
      const t = a / Y // 0 alt, 1 üst
      const y = ty(OFS + ya - (ya - yu) * t)
      const profil = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38 * (1 - 0.15)
      for (let b = 0; b <= X; b++) {
        const s = b / X
        const dilim = Math.abs(Math.sin(s * n * Math.PI))
        const kenar = Math.min(1, Math.min(s, 1 - s) * n * 2.5)
        const zz = zOnce + (z - zOnce) * profil + 0.055 * Math.pow(dilim, 0.6) * profil
        konum.push(tx(x0 + (x1 - x0) * s), y, ZT + (zz - ZT) * Math.pow(kenar, 0.5))
      }
    }
    for (let a = 0; a < Y; a++) for (let b = 0; b < X; b++) {
      const p = a * (X + 1) + b, q = p + X + 1
      dizin.push(p, p + 1, q, q, p + 1, q + 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
    g.setIndex(dizin)
    g.computeVertexNormals()
    ekD(g, altin)
  })

  // Mukarnas altı: öne çıkan altın sahanlık, niş tavanı
  const LIP_U = OFS + 838, LIP_A = OFS + 888, ZF = DER - 0.04
  ekD(sekil(dik(525, LIP_U, 1100, LIP_A), ZF), altin)
  ekD(dortgen([tx(525), ty(LIP_U), ZT], [tx(525), ty(LIP_U), ZF], [tx(1100), ty(LIP_U), ZF], [tx(1100), ty(LIP_U), ZT]))
  ekD(dortgen([tx(455), ty(LIP_A), ZF], [tx(1155), ty(LIP_A), ZF], [tx(1155), ty(LIP_A), 0.12], [tx(455), ty(LIP_A), 0.12]), m.altinKoyu)

  // Niş: arka duvar, yan yüzler, sütunlar
  const ZG = 0.12, ZO = DER - 0.22
  ekD(sekil(dik(525, LIP_A - 50, 1100, TH), ZG))
  for (const [xd, xi] of [[455, 525], [1155, 1100]]) {
    const a = [tx(xd), zemin, ZO], b = [tx(xi), zemin, ZG], c = [tx(xi), ty(LIP_A - 50), ZG], d = [tx(xd), ty(LIP_A - 50), ZO]
    ekD(xd < xi ? dortgen(a, b, c, d) : dortgen(b, a, d, c))
  }
  // Sütun arkası düz yüz ve köşe kaplaması
  for (const [x0, x1] of [[330, 455], [1155, 1275]]) ekD(sekil(dik(x0, AY0, x1, TH), ZO))
  // Başlık üstü kuşak
  for (const [x0, x1] of [[335, 460], [1150, 1270]]) {
    const y0 = OFS + 930, y1 = OFS + 1010
    ekD(sekil(dik(x0, y0, x1, y1), ZO + 0.17))
    ekD(dortgen([tx(x0), ty(y1), ZO], [tx(x0), ty(y1), ZO + 0.17], [tx(x1), ty(y1), ZO + 0.17], [tx(x1), ty(y1), ZO]), m.altinKoyu)
    ekD(dortgen([tx(x0), ty(y0), ZO + 0.17], [tx(x0), ty(y0), ZO], [tx(x1), ty(y0), ZO], [tx(x1), ty(y0), ZO + 0.17]))
  }
  // Sütunlar: mermer gövde, altın bilezik ve kaide
  for (const s of [-1, 1]) {
    const x = s * (tx(1205) - tx(810)), r = 0.16, ust = ty(OFS + 1012)
    ek(silindirG(r, r, ust - zemin, 14).translate(x, (ust + zemin) / 2, ZO + 0.06), m.krem)
    ek(dondurG([[r + 0.05, 0], [r + 0.05, 0.2], [r + 0.02, 0.3], [r, 0.34]], 14).translate(x, zemin, ZO + 0.06), m.altinKoyu)
    ek(new THREE.TorusGeometry(r + 0.012, 0.022, 6, 16).rotateX(Math.PI / 2).translate(x, ust - 0.03, ZO + 0.06), m.altinKoyu)
  }

  // Şamdanlar: bakır ayak ve kâse, kalın beyaz mum (ERD05161, DJI_0325)
  for (const s of [-1, 1]) {
    const x = s * SAMDAN.x, z = SAMDAN.z, y0 = zemin
    ek(dondurG([[0.27, 0], [0.26, 0.12], [0.1, 0.34], [0.07, 0.72], [0.12, 0.84], [0.05, 0.98], [0.07, 1.12], [0.24, 1.24], [0.26, 1.56]], 14).translate(x, y0, z), m.bronz)
    ek(silindirG(0.21, 0.21, 1.95, 14).translate(x, y0 + 1.52 + 0.98, z), m.krem)
  }
}

/** Kıble duvarının mihrap çevresi: sancak, iki madalyon, doğudaki duvar panosu. Yazılar fotoğraftan (ERD05161, DJI_0276, DJI_0325). */
export function kibleDuvari(k: Kova, duvarZ: number, m: { koyu: Mal; altinKoyu: Mal }) {
  const doku = dokuYukle('mihrap-kible')
  const mal = fotoMalzeme(doku, '#c8b48a', { roughness: 0.74, emissiveIntensity: doku ? 0.1 : 0 })
  const AW = 2048, AH = 1450
  const ek = (g: THREE.BufferGeometry, x: number, m2: Mal = mal) => k.ekle(yer(g, x, 0, duvarZ, Math.PI), m2)
  /** Atlas hücresine düzlemsel eşleme: g'nin x,y'si metre; hücre px'i = (x-x0)*olcek. */
  const atlas = (g: THREE.BufferGeometry, hx: number, hy: number, xOlc: number, yOlc: number, xSol: number, yUst: number) => {
    const p = g.attributes.position, uv = g.attributes.uv ?? new THREE.BufferAttribute(new Float32Array(p.count * 2), 2)
    for (let i = 0; i < p.count; i++) uv.setXY(i, (hx + (p.getX(i) - xSol) * xOlc) / AW, 1 - (hy + (yUst - p.getY(i)) * yOlc) / AH)
    g.setAttribute('uv', uv)
    return g
  }
  /** Yüz + kenar: duvardan kalkan levha; kenarlar koyu. */
  const levha = (s: THREE.Shape, z: number, kur: (g: THREE.BufferGeometry) => THREE.BufferGeometry, x: number) => {
    ek(kur(new THREE.ShapeGeometry(s, 16).translate(0, 0, z)), x)
    ek(new THREE.ExtrudeGeometry(s, { depth: z - 0.02, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, 0.005), x, m.koyu)
  }

  // --- Sancak: üstü kemere uyan yeşil levha (hücre 800x1430; S uzayı 700x1250) ---
  const SG = 2.36, SH = SG * (1250 / 700), SY0 = MIHRAP.TEPE - 0.04, SU = SY0 + SH
  const sancak = new THREE.Shape()
  sancak.moveTo(-SG / 2, SY0); sancak.lineTo(SG / 2, SY0); sancak.lineTo(SG / 2, SU - SH * (110 / 1250))
  sancak.quadraticCurveTo(SG * 0.27, SU - SH * 0.012, 0, SU)
  sancak.quadraticCurveTo(-SG * 0.27, SU - SH * 0.012, -SG / 2, SU - SH * (110 / 1250)); sancak.closePath()
  const sOlc = 800 / SG
  levha(sancak, 0.06, (g) => atlas(g, 0, 0, sOlc, sOlc, -SG / 2, SU), 0)

  // --- Madalyonlar (hücre 500x500, oval 30..470 x 170..480) ---
  const MG = 1.39, MH = MG * (310 / 440), mOlc = 440 / MG, MY = 7.16
  const madalyon = (x: number, hy: number) => {
    const s = new THREE.Shape()
    s.absellipse(0, MY, MG / 2, MH / 2, 0, Math.PI * 2, false, 0)
    levha(s, 0.06, (g) => atlas(g, 1540 + 30, hy + 170, mOlc, mOlc, -MG / 2, MY + MH / 2), x)
    // Fiyonk: üstte kesik biçimli küçük parça
    const ust = MY + MH / 2
    const f = new THREE.Shape()
    const q = (px: number, py: number): [number, number] => [(px - 250) / mOlc, ust + (170 - py) / mOlc]
    const nokta = [[172, 175], [205, 110], [190, 60], [215, 30], [250, 45], [285, 30], [310, 60], [295, 110], [328, 175]].map(([a, b]) => q(a, b))
    f.moveTo(...nokta[0]); nokta.slice(1).forEach((n) => f.lineTo(...n)); f.closePath()
    ek(atlas(new THREE.ShapeGeometry(f).translate(0, 0, 0.03), 1540 + 30, hy + 170, mOlc, mOlc, -MG / 2, ust), x)
  }
  madalyon(-3.45, 520)
  madalyon(3.45, 0)

  // --- Duvar panosu: doğu yanında, tepeliği ile (ERD05161, hücre 700x1440) ---
  const PG = 2.55, pOlc = 700 / PG, PY0 = 2.15, PU = PY0 + 1440 / pOlc, PX = 6.55
  const py = (d: number) => PU - d * 1.575 / pOlc
  const px = (d: number) => -PG / 2 + (d - 520) * 1.575 / pOlc
  const pano = new THREE.Shape()
  const dis: [number, number][] = [[522, 910], [965, 910], [965, 145], [940, 130], [912, 122], [905, 80], [880, 60], [835, 20], [800, 0], [730, 8], [665, 40], [652, 82], [595, 100], [578, 130], [522, 140]]
  pano.moveTo(px(dis[0][0]), py(dis[0][1])); dis.slice(1).forEach(([a, b]) => pano.lineTo(px(a), py(b))); pano.closePath()
  ek(atlas(new THREE.ShapeGeometry(pano).translate(0, 0, 0.012), 820, 0, pOlc, pOlc, -PG / 2, PU), PX)
}
