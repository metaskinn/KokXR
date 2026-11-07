// Ulu Camii kapıları, cephe taşı ve avlu şadırvan köşkleri.
// Taç kapı, arşivin önden çekilmiş fotoğrafının düzlemsel izdüşümüdür: geometri yalnız derinlik verir (çerçeve kademeleri,
// niş, mukarnas kademeleri), doku her parçaya fotoğraftaki yerinden gelir. Ağacın örttüğü sol kenar sağdan aynalanmıştır.
// Köşk ölçüleri ve biçimi arşiv fotoğrafından; "sekiz ahşap direk, yonca kemer, soğan kubbe" envanter kitabından.
// Yan kapıların dış biçimi kuzey cephedeki mermer çerçeveli açıklıktan, kanat renkleri arşivde görülen yan kapılardan
// yorumlanmıştır; doğu ve batı dış kapılarının yakın fotoğrafı arşivde yoktur, bu yüzden temsilîdir.
// Dokular: scripts/kapilar_doku.py
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../data/acikYayin'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'
import { Kova, type Mal, cikar, dondurG, kutuG, silindirG, yer } from '../ulucamiParca'
import { hafifCihaz, rastgele } from '../ulucamiZemin'

type Ekle = (g: THREE.BufferGeometry, m: Mal) => void

// --- Atlas yerleşimi (2048 piksel, bkz. scripts/kapilar_doku.py) ---
const ATLAS = 2048
const YER = {
  ust: [1340, 0, 240, 400], alt: [1590, 0, 240, 400], havuz: [1340, 410, 400, 230],
  kaide: [1340, 650, 700, 120], kubbe: [1340, 780, 300, 700], sacak: [1340, 1490, 300, 60], kapi: [1650, 790, 390, 1056],
} as const
type Yer = keyof typeof YER
const yerUV = (ad: Yer, s: number, t: number): [number, number] => {
  const [x, y, g, h] = YER[ad]
  return [(x + s * g) / ATLAS, 1 - (y + (1 - t) * h) / ATLAS]
}
// Fotoğraf koordinatı: taç kapının 859 piksellik önizlemesi.
const PX0 = 25, PY0 = 165, A = ATLAS / 1245
const fotoUV = (px: number, py: number): [number, number] => [(px - PX0) * A / ATLAS, 1 - (py - PY0) * A / ATLAS]

/** Atlas içindeki düz renk örnekleri: ahşap, sıva ve su ayrı malzeme açmaz (scripts/kapilar_doku.py ile aynı sıra). */
const BOYA = { direk: '#2f1c12', krem: '#d9cdb0', kremKanat: '#d8cfb6', kremKoyu: '#a79d84', yesil: '#27442f', su: '#55796f' } as const
type BoyaAdi = keyof typeof BOYA
type Boyali = Mal | BoyaAdi
const boyaUV = (ad: BoyaAdi): [number, number] => {
  const i = Object.keys(BOYA).indexOf(ad)
  return [(1780 + i * 44) / ATLAS, 1 - 440 / ATLAS]
}
function boya<G extends THREE.BufferGeometry>(g: G, ad: BoyaAdi) {
  const [u, v] = boyaUV(ad), t = g.attributes.uv
  for (let i = 0; i < t.count; i++) t.setXY(i, u, v)
  return g
}

export interface KapilarMalzemeleri { atlas: Mal; cepheTas: Mal }

const onbellek = new WeakMap<UlucamiMalzemeleri, KapilarMalzemeleri>()

/** Tek maket için bir kez kurulur: sahneden çıkınca dokular malzemeyle birlikte atılır. */
export function kapilarMalzemeleri(m: UlucamiMalzemeleri): KapilarMalzemeleri {
  const var_ = onbellek.get(m)
  if (var_) return var_
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...p })
  const ek = hafifCihaz() ? '-1024' : ''
  const yukle = (ad: string) => {
    const t = new THREE.TextureLoader().load(`/gorseller/ulu-camii/maket/${ad}.jpg`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  let atlas: Mal, cepheTas: Mal
  if (ACIK_YAYIN) {
    // Açık yayında fotoğraf yok: aynı UV'lerle boya örnekleri ve düz mermer rengi.
    const el = document.createElement('canvas')
    el.width = el.height = 512
    const c = el.getContext('2d')
    if (c) {
      c.fillStyle = '#cfccc6'
      c.fillRect(0, 0, 512, 512)
      Object.values(BOYA).forEach((renk, i) => { c.fillStyle = renk; c.fillRect((1760 + i * 44) / 4, 420 / 4, 10, 10) })
    }
    const harita = new THREE.CanvasTexture(el)
    harita.colorSpace = THREE.SRGBColorSpace
    atlas = std({ map: harita, roughness: 0.6, side: THREE.DoubleSide })
    cepheTas = m.tas
  } else {
    // Fotoğrafın kendi gölgesi vardır: hafif öz parlaklık, nişlerin sahne ışığında kararmasını önler.
    const harita = yukle(`kapilar-atlas${ek}`)
    atlas = std({ map: harita, roughness: 0.68, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: harita, emissiveIntensity: 0.2 })
    const tas = yukle('cephe-tas')
    tas.wrapS = tas.wrapT = THREE.RepeatWrapping
    tas.repeat.set(1 / TAS_M, 1 / TAS_M)
    cepheTas = std({ map: tas, roughness: 0.94 })
  }
  const K: KapilarMalzemeleri = { atlas, cepheTas }
  onbellek.set(m, K)
  return K
}
/** Cephe taşı dokusunun metre karşılığı. */
const TAS_M = 8

// --- Geometri yardımcıları ---
/** Atlas malzemesine giden dörtgenleri biriktirir: her köşe [x, y, z, u, v]. */
class Yuzler {
  private p: number[] = []
  private uv: number[] = []
  dortgen(a: number[], b: number[], c: number[], d: number[]) {
    for (const v of [a, b, c, a, c, d]) { this.p.push(v[0], v[1], v[2]); this.uv.push(v[3], v[4]) }
  }
  geometri() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.computeVertexNormals()
    return g
  }
}

/** Geometrinin UV'sini düzlemsel fotoğraf izdüşümü yapar. */
function izdusum<G extends THREE.BufferGeometry>(g: G, uv: (x: number, y: number) => [number, number]) {
  const p = g.attributes.position, t = g.attributes.uv
  for (let i = 0; i < p.count; i++) { const [u, v] = uv(p.getX(i), p.getY(i)); t.setXY(i, u, v) }
  return g
}

/** Pencere gibi düz bir yüzeyi atlastaki kırpıma oturtur. */
export function atlasaOturt<G extends THREE.BufferGeometry>(g: G, ad: Yer) {
  g.computeBoundingBox()
  const b = g.boundingBox as THREE.Box3
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  return izdusum(g, (x, y) => yerUV(ad, (x - b.min.x) / w, (y - b.min.y) / h))
}

/** Kemer eğrisinin denetim noktaları: niş kemerleri sivri, pencere tepeleri yuvarlak (kuzey cephe fotoğrafı). */
const kemerEgrisi = (g: number) => g > 2.5 ? [0.56, 0.42, 0.8] : [0.72, 0.56, 0.97]

export function cepheKemeri<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, duz: number, kemerH: number): P {
  const o = g / 2, b = y0 + duz, t = b + kemerH, [k1, kx, k2] = kemerEgrisi(g)
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, b)
  p.bezierCurveTo(cx - o, b + kemerH * k1, cx - o * kx, b + kemerH * k2, cx, t)
  p.bezierCurveTo(cx + o * kx, b + kemerH * k2, cx + o, b + kemerH * k1, cx + o, b)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

/** Kemeri çeviren taş dilimler: tuğla değil, cephe taşından, derzli (fotoğraflara göre). */
export function kemerDilimleri(ek: (g: THREE.BufferGeometry) => void, cx: number, y0: number, gDis: number, duz: number, kDis: number, gIc: number, kIc: number) {
  const nokta = (g: number, kh: number, t: number): [number, number] => {
    // Sol dipten tepeye ve sağ dibe parametrik gezinti (t: -1..1)
    const o = g / 2, b = y0 + duz, a = 1 - Math.abs(t), [k1, kx, k2] = kemerEgrisi(g)
    const bez = (p0: number, p1: number, p2: number, p3: number, s: number) => (1 - s) ** 3 * p0 + 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3 * p3
    const x = bez(-o, -o, -o * kx, 0, a), y = bez(b, b + kh * k1, b + kh * k2, b + kh, a)
    return [cx + (t < 0 ? x : -x), y]
  }
  const r = rastgele(Math.round((cx + 50) * 97 + y0 * 13))
  const N = 11
  for (let i = 0; i < N; i++) {
    const t0 = -1 + (2 * i) / N, t1 = -1 + (2 * (i + 1)) / N
    const adim = 5
    const s = new THREE.Shape()
    const dis: [number, number][] = [], ic: [number, number][] = []
    for (let n = 0; n <= adim; n++) {
      const t = t0 + ((t1 - t0) * n) / adim
      dis.push(nokta(gDis, kDis, t)); ic.push(nokta(gIc, kIc, t))
    }
    s.moveTo(dis[0][0], dis[0][1])
    for (const d of dis.slice(1)) s.lineTo(d[0], d[1])
    for (const d of ic.reverse()) s.lineTo(d[0], d[1])
    s.closePath()
    // Derz için dilimler derinlikte hafifçe farklı çıkar.
    ek(cikar(s, 0.06 + r() * 0.05, 0))
  }
  // Ayaklar: dipten kemer başlangıcına
  for (const sg of [-1, 1]) {
    const x0 = cx + (sg * (gIc + gDis)) / 4, gen = (gDis - gIc) / 2
    if (duz > 0.05) ek(kutuG(gen, duz, 0.08).translate(x0, y0 + duz / 2, 0.04))
  }
}

/** Atlastaki düz bir mermer bölgesinden, yüzün gerçek ölçüsünde rastgele parça alan kutu. */
function mermerBlok(y: Yuzler, r: () => number, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const P = 76 // piksel/metre
  const yuz = (a: number[], b: number[], c: number[], d: number[], g: number, h: number) => {
    const pg = Math.min(120, g * P), ph = Math.min(240, h * P)
    const px = 664 + r() * Math.max(0, 786 - 664 - pg), py = 884 + r() * Math.max(0, 1300 - 884 - ph)
    y.dortgen([...a, ...fotoUV(px, py + ph)], [...b, ...fotoUV(px + pg, py + ph)], [...c, ...fotoUV(px + pg, py)], [...d, ...fotoUV(px, py)])
  }
  const G = x1 - x0, H = y1 - y0, D = z1 - z0
  yuz([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], G, H) // ön
  yuz([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], G, D) // üst
  yuz([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], D, H) // sağ
  yuz([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], D, H) // sol
}

// --- Taç kapı ---
/** Fotoğraftan alınan ölçüler (önizleme pikseli). Kapı ekseni 433. */
const CX = 433
const SX = 0.01315, SY = 0.01158 // metre/piksel: duvar yüksekliği fotoğraftakinden kısa olduğu için hafif basıktır
const ESIK = 1.4, TABAN_PY = 1326
const yPy = (py: number) => ESIK + (TABAN_PY - py) * SY
const pyY = (y: number) => TABAN_PY - (y - ESIK) / SY
const taUV = (x: number, y: number) => fotoUV(CX + x / SX, pyY(y))

export const TAC_G = 365 * 2 * SX

export function tacKapi(k: Kova, m: UlucamiMalzemeleri, K: KapilarMalzemeleri, yz: number) {
  const parca = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, -yz, Math.PI), mal)
  const r = rastgele(4021)
  const y = new Yuzler()
  const ZO = 2.6 // blok önü
  const H0 = 365 * SX, TEPE = yPy(228), TABAN = 0.9
  // Çerçeve kademeleri: dıştan içe [dış yarı, dış tepe py, iç yarı, iç tepe py, derinlik]
  const kademe: [number, number, number, number, number][] = [
    [365, 228, 311, 287, 0],
    [311, 287, 283, 317, 0.12],
    [283, 317, 244, 353, 0.25],
    [244, 353, 226, 374, 0.35],
  ]
  for (const [hd, td, hi, ti, dz] of kademe) {
    const xd = hd * SX, xi = hi * SX, yd = yPy(td), yi = yPy(ti)
    // Ters U biçimi: alt kenar açık kalsın diye elle kurulur.
    const u = new THREE.Shape()
    u.moveTo(-xd, TABAN); u.lineTo(-xi, TABAN); u.lineTo(-xi, yi); u.lineTo(xi, yi); u.lineTo(xi, TABAN); u.lineTo(xd, TABAN); u.lineTo(xd, yd); u.lineTo(-xd, yd); u.closePath()
    parca(izdusum(cikar(u, 0.13, ZO - dz - 0.13), taUV), K.atlas)
  }
  // Pano: fotoğraftaki kemer ağzıyla delinmiş düzlem
  const ZP = ZO - 0.45
  const AGIZ: [number, number][] = [[858, 153], [700, 155], [650, 148], [600, 124], [575, 94], [550, 60], [538, 32], [527, 0]]
  const pano = new THREE.Shape()
  const xp = 226 * SX
  pano.moveTo(-xp, TABAN); pano.lineTo(-153 * SX, TABAN)
  for (const [py, h] of AGIZ) pano.lineTo(-h * SX, yPy(py))
  for (const [py, h] of [...AGIZ].reverse().slice(1)) pano.lineTo(h * SX, yPy(py))
  pano.lineTo(153 * SX, TABAN); pano.lineTo(xp, TABAN); pano.lineTo(xp, yPy(374)); pano.lineTo(-xp, yPy(374)); pano.closePath()
  parca(izdusum(cikar(pano, 0.13, ZP - 0.13), taUV), K.atlas)

  // Niş arka duvarı ve mukarnas: kademeler tepeden tabana öne doğru çıkar (yandan görünüş: 0291 fotoğrafı)
  const ZG = ZP - 1.25 // niş arka duvarı
  const KAD: [number, number][] = [[858, 153], [800, 146], [771, 133], [750, 114], [725, 100], [701, 86], [686, 72], [650, 66], [620, 52], [600, 42], [583, 34], [552, 22], [530, 2]]
  const agizH = (py: number) => {
    for (let i = 0; i < AGIZ.length - 1; i++) {
      const [p0, h0] = AGIZ[i], [p1, h1] = AGIZ[i + 1]
      if (py <= p0 && py >= p1) return h0 + ((h1 - h0) * (p0 - py)) / (p0 - p1)
    }
    return 0
  }
  const zKad = (py: number) => ZG + 0.08 + (ZP - 0.1 - ZG - 0.08) * THREE.MathUtils.clamp((py - 530) / (858 - 530), 0, 1) ** 0.85
  // Arka duvar: mukarnas ardı dokudan temizlensin diye iç kısım mermere uzatılır
  const satirlar = [...KAD.map((a) => a[0]), ...AGIZ.map((a) => a[0])].filter((v, i, d) => d.indexOf(v) === i).sort((a, b) => b - a)
  const kadH = (py: number) => {
    for (let i = 0; i < KAD.length - 1; i++) {
      const [p0, h0] = KAD[i], [p1, h1] = KAD[i + 1]
      if (py <= p0 && py >= p1) return h0 + ((h1 - h0) * (p0 - py)) / (p0 - p1)
    }
    return 0
  }
  for (let i = 0; i < satirlar.length - 1; i++) {
    const a = satirlar[i], b = satirlar[i + 1]
    const ya = yPy(a), yb = yPy(b)
    for (const s of [-1, 1]) {
      const ka = agizH(a), kb = agizH(b)
      const sa = Math.min(ka, kadH(a) + 6), sb = Math.min(kb, kadH(b) + 6)
      const noktalar = (h: number, py: number, zz: number) => [s * h * SX, yPy(py), zz, ...fotoUV(CX + s * h, py)]
      // Ağız kenarı ile mukarnas siluetinin dışı arasındaki gerçek mermer
      y.dortgen(noktalar(sa, a, ZG), noktalar(ka, a, ZG), noktalar(kb, b, ZG), noktalar(sb, b, ZG))
      // Silüetin içi: siluet dışındaki renk içeri uzatılır
      y.dortgen([0, ya, ZG, ...fotoUV(CX + s * sa, a)], [s * sa * SX, ya, ZG, ...fotoUV(CX + s * sa, a)], [s * sb * SX, yb, ZG, ...fotoUV(CX + s * sb, b)], [0, yb, ZG, ...fotoUV(CX + s * sb, b)])
      // Ağız kalınlığı: panodan arka duvara
      y.dortgen([s * ka * SX, ya, ZP, ...fotoUV(CX + s * ka, a)], [s * ka * SX, ya, ZG, ...fotoUV(CX + s * (ka - 3), a)], [s * kb * SX, yb, ZG, ...fotoUV(CX + s * (kb - 3), b)], [s * kb * SX, yb, ZP, ...fotoUV(CX + s * kb, b)])
    }
  }
  const SUTUN = 26
  const kademe2 = (py0: number, h0: number, py1: number, h1: number, zigzag: number) => {
    const ym = py0 - (py0 - py1) * 0.42
    const z0 = zKad(py0), z1 = zKad(py1)
    const ic = (t: number, zOn: number) => ZG + (zOn - ZG) * Math.sqrt(Math.max(0, 1 - t * t))
    for (let j = 0; j < SUTUN; j++) {
      const t0 = -1 + (2 * j) / SUTUN, t1 = -1 + (2 * (j + 1)) / SUTUN
      const v = (t: number, py: number, h: number, zOn: number, zg: number) => {
        const x = t * h * SX
        return [x, yPy(py), ic(t, zOn) + zg, ...fotoUV(CX + t * h, py)]
      }
      const zg0 = j % 2 ? 0 : zigzag, zg1 = j % 2 ? zigzag : 0
      // Dik hücre yüzü
      y.dortgen(v(t0, py0, h0, z0, zg0), v(t1, py0, h0, z0, zg1), v(t1, ym, h0, z0, zg1), v(t0, ym, h0, z0, zg0))
      // Üste doğru eğimli yüz
      y.dortgen(v(t0, ym, h0, z0, zg0), v(t1, ym, h0, z0, zg1), v(t1, py1, h1, z1, 0), v(t0, py1, h1, z1, 0))
    }
  }
  for (let i = 0; i < KAD.length - 1; i++) kademe2(KAD[i][0], KAD[i][1], KAD[i + 1][0], KAD[i + 1][1], i < KAD.length - 3 ? 0.07 : 0.02)
  // Mukarnasın alt yüzü (tavan): ön kenardan kapı duvarına
  const YT = yPy(858), ZK = ZP - 2.1
  const TAVAN = 128
  y.dortgen([-153 * SX, YT, zKad(858), ...fotoUV(CX - 150, 858)], [-TAVAN * SX, YT, ZK, ...fotoUV(CX - 125, 870)], [TAVAN * SX, YT, ZK, ...fotoUV(CX + 125, 870)], [153 * SX, YT, zKad(858), ...fotoUV(CX + 150, 858)])
  // Kapı duvarı: perdeli giriş, fotoğrafın kendisi
  y.dortgen([-TAVAN * SX, ESIK, ZK, ...fotoUV(CX - 126, 1240)], [TAVAN * SX, ESIK, ZK, ...fotoUV(CX + 126, 1240)], [TAVAN * SX, YT, ZK, ...fotoUV(CX + 126, 862)], [-TAVAN * SX, YT, ZK, ...fotoUV(CX - 126, 862)])
  // Yan yüzler: ağızdan kapıya daralan söve
  for (const s of [-1, 1]) {
    y.dortgen([s * 153 * SX, ESIK, ZP, ...fotoUV(CX + s * 150, 1322)], [s * TAVAN * SX, ESIK, ZK, ...fotoUV(CX + s * 126, 1240)], [s * TAVAN * SX, YT, ZK, ...fotoUV(CX + s * 126, 862)], [s * 153 * SX, YT, ZP, ...fotoUV(CX + s * 150, 858)])
  }
  // Eşik: halı, fotoğraftan
  y.dortgen([-153 * SX, ESIK, ZP, ...fotoUV(CX - 150, 1322)], [153 * SX, ESIK, ZP, ...fotoUV(CX + 150, 1322)], [TAVAN * SX, ESIK, ZK, ...fotoUV(CX + 126, 1240)], [-TAVAN * SX, ESIK, ZK, ...fotoUV(CX - 126, 1240)])
  y.dortgen([-226 * SX, ESIK, ZO, ...fotoUV(CX - 150, 1400)], [226 * SX, ESIK, ZO, ...fotoUV(CX + 150, 1400)], [226 * SX, ESIK, ZP, ...fotoUV(CX + 150, 1330)], [-226 * SX, ESIK, ZP, ...fotoUV(CX - 150, 1330)])

  // Blok yanları: mermer parçaları, gerçek derinlikte
  const SIRA = 11
  for (const s of [-1, 1]) for (let i = 0; i < SIRA; i++) {
    const y0 = (i * TEPE) / SIRA, y1 = ((i + 1) * TEPE) / SIRA
    let z = 0.0
    let ad = 0
    while (z < ZO - 0.02) {
      const z2 = Math.min(ZO, z + 0.7 + r() * 0.9 + (ad++ % 2 ? 0.3 : 0))
      const x0 = s * H0
      const [u0, u1, u2, u3] = (() => {
        const pg = 28 + r() * 24, ph = 16 + r() * 8
        const px = 662 + r() * (786 - 662 - pg), py = 884 + r() * (1130 - 884 - ph)
        return [fotoUV(px, py + ph), fotoUV(px + pg, py + ph), fotoUV(px + pg, py), fotoUV(px, py)]
      })()
      y.dortgen([x0, y0, z2, ...u0], [x0, y0, z, ...u1], [x0, y1, z, ...u2], [x0, y1, z2, ...u3])
      z = z2
    }
  }

  // Saçak: fotoğraftan, öne ve yanlara taşar
  const SH = 400 * SX, SY0 = yPy(228), SY1 = yPy(183), SZ = ZO + 0.5
  const sacakUV = (x: number, py: number) => fotoUV(CX + (x / SX), py)
  y.dortgen([-SH, SY0, SZ, ...sacakUV(-SH, 228)], [SH, SY0, SZ, ...sacakUV(SH, 228)], [SH, SY1, SZ, ...sacakUV(SH, 183)], [-SH, SY1, SZ, ...sacakUV(-SH, 183)])
  y.dortgen([-SH, SY0, 0, ...sacakUV(-SH, 228)], [SH, SY0, 0, ...sacakUV(SH, 228)], [SH, SY0, SZ, ...sacakUV(SH, 228)], [-SH, SY0, SZ, ...sacakUV(-SH, 228)])
  for (const s of [-1, 1]) y.dortgen([s * SH, SY0, SZ, ...sacakUV(s * SH * 0.8, 228)], [s * SH, SY0, 0, ...sacakUV(s * SH * 0.6, 228)], [s * SH, SY1, 0, ...sacakUV(s * SH * 0.6, 183)], [s * SH, SY1, SZ, ...sacakUV(s * SH * 0.8, 183)])
  parca(kutuG(SH * 2 + 0.3, 0.14, SZ + 0.15).translate(0, SY1 + 0.07, SZ / 2 - 0.02), m.koyu)
  parca(kutuG(SH * 2 - 0.6, 0.5, SZ - 0.25).translate(0, SY1 + 0.32, SZ / 2 - 0.15), m.kursun)

  // Yanlardaki mermer alt bant: fotoğrafta blokla ilk pencere arasında, ara silmeye kadar
  const AP0 = 1.2, AP1 = 6.2, APX = 6.75
  for (const s of [-1, 1]) {
    const pa = s > 0 ? 668 : 788, pb = s > 0 ? 788 : 668
    const a0 = s > 0 ? H0 : -APX, a1 = s > 0 ? APX : -H0
    const u0 = s > 0 ? pa : pb, u1 = s > 0 ? pb : pa
    y.dortgen([a0, AP0, 0.12, ...fotoUV(u0, 1310)], [a1, AP0, 0.12, ...fotoUV(u1, 1310)], [a1, AP1, 0.12, ...fotoUV(u1, 884)], [a0, AP1, 0.12, ...fotoUV(u0, 884)])
    mermerBlok(y, r, a0 - 0.02, a1 + 0.02, AP1, AP1 + 0.16, 0, 0.2)
    y.dortgen([s > 0 ? a1 : a0, AP0, 0, ...fotoUV(700, 1300)], [s > 0 ? a1 : a0, AP0, 0.12, ...fotoUV(708, 1300)], [s > 0 ? a1 : a0, AP1, 0.12, ...fotoUV(708, 900)], [s > 0 ? a1 : a0, AP1, 0, ...fotoUV(700, 900)])
  }

  // Basamaklar: mermer bloklar, önde ve iki yanda (fotoğraftaki gibi üç yandan çıkılır)
  const ADIM = 5, TREAD = 1.05
  for (let i = 0; i < ADIM; i++) {
    const y0 = i * 0.28, y1 = y0 + 0.28
    const gen = 9.2 - i * 0.7, z1 = ZO + (ADIM - i) * TREAD, z0 = z1 - TREAD
    let xx = -gen
    while (xx < gen - 0.02) {
      const x2 = Math.min(gen, xx + 1.3 + r() * 1.2)
      mermerBlok(y, r, xx, x2, y0, y1, z0, z1)
      xx = x2
    }
    for (const s of [-1, 1]) {
      let zz = 0
      while (zz < z0 - 0.02) {
        const z2 = Math.min(z0, zz + 1 + r())
        mermerBlok(y, r, s > 0 ? gen - 0.7 : -gen, s > 0 ? gen : -gen + 0.7, y0, y1, zz, z2)
        zz = z2
      }
    }
  }
  // Basamakların doldurduğu üst sahanlık
  for (let i = 0; i < 5; i++) mermerBlok(y, r, -H0 + i * (2 * H0) / 5, -H0 + (i + 1) * (2 * H0) / 5, 0, ESIK - 0.001, ZO, ZO + TREAD)
  parca(y.geometri(), K.atlas)
}

// --- Yan kapılar ---
/** Mermer çerçeveli, sivri alınlıklı kapı. +z yüzü bakılan yöndür. Boyut: duvardaki eski kapıyla aynı (3.9 m). */
export function yanKapi(ek0: Ekle, m: UlucamiMalzemeleri, K: KapilarMalzemeleri, y0: number, ic: boolean) {
  const ek = (g: THREE.BufferGeometry, mal: Boyali) => typeof mal === 'string' ? ek0(boya(g, mal), K.atlas) : ek0(g, mal)
  const G = 3.9, ACIK = 2.2, DER = 0.55, KAPI_H = ic ? 3.7 : 3.0, KEMER = 1.17, UST = y0 + (ic ? KAPI_H + 2.1 : 5.4)
  // Dış: mermer dilimli çerçeve; iç: boyalı ahşap kasa (arşiv fotoğrafında batı kapısı içten krem boyalıdır).
  if (ic) {
    const s = new THREE.Shape()
    s.moveTo(-G / 2, y0); s.lineTo(-ACIK / 2, y0); s.lineTo(-ACIK / 2, y0 + KAPI_H + 0.9); s.lineTo(ACIK / 2, y0 + KAPI_H + 0.9); s.lineTo(ACIK / 2, y0); s.lineTo(G / 2, y0); s.lineTo(G / 2, UST); s.lineTo(-G / 2, UST); s.closePath()
    ek(cikar(s, 0.3), 'kremKanat')
    // Kademeli silmeler
    for (const [g, ust, dz] of [[G + 0.2, UST + 0.1, 0.16], [G - 0.5, UST - 0.25, 0.3]] as const) {
      const c = new THREE.Shape(), t = 0.12
      c.moveTo(-g / 2, y0); c.lineTo(-g / 2 + t, y0); c.lineTo(-g / 2 + t, ust - t); c.lineTo(g / 2 - t, ust - t); c.lineTo(g / 2 - t, y0); c.lineTo(g / 2, y0); c.lineTo(g / 2, ust); c.lineTo(-g / 2, ust); c.closePath()
      ek(cikar(c, 0.06, dz), 'kremKanat')
    }
    ek(kutuG(ACIK, KAPI_H + 1, 0.1).translate(0, y0 + (KAPI_H + 1) / 2, 0.05), 'kremKanat')
    kanatlar(ek, 'kremKanat', 'kremKoyu', m.bronz, ACIK - 0.08, y0 + 0.02, KAPI_H, 0.14, 2)
    ek(kutuG(ACIK, 0.16, 0.26).translate(0, y0 + KAPI_H + 0.1, 0.18), 'kremKoyu')
    ek(kutuG(G + 0.2, 0.1, DER).translate(0, y0 + 0.05, DER / 2), m.icMermer)
    return
  }
  // Dış yüz: kuzey cephedeki mermer çerçeveli açıklığın fotoğrafı, eksenden aynalanır
  const KUV = (x: number, yy: number) => yerUV('kapi', 1 - Math.abs(x) / (G / 2), (yy - y0) / (UST - y0))
  const dis = new THREE.Shape()
  dis.moveTo(-G / 2, y0); dis.lineTo(G / 2, y0); dis.lineTo(G / 2, UST); dis.lineTo(-G / 2, UST); dis.closePath()
  dis.holes.push(cepheKemeri(new THREE.Path(), 0, y0, ACIK, KAPI_H, KEMER))
  ek(izdusum(cikar(dis, 0.5, 0), KUV), K.atlas)
  // Saçak gibi taşan üst silme
  ek(izdusum(kutuG(G + 0.24, 0.14, 0.62).translate(0, UST + 0.05, 0.31), (x, yy) => KUV(x * 0.9, Math.min(yy, UST - 0.06))), K.atlas)
  // Alınlık taşı, kapı arkası, kanatlar
  ek(new THREE.ShapeGeometry(cepheKemeri(new THREE.Shape(), 0, y0 + KAPI_H, ACIK, 0.01, KEMER), 10).translate(0, 0, 0.28), K.cepheTas)
  // Kanatlar duvar dibi kaidesinin önünde durur.
  ek(kutuG(ACIK, KAPI_H, 0.06).translate(0, y0 + KAPI_H / 2, 0.29), m.koyu)
  ek(izdusum(kutuG(ACIK + 0.1, 0.18, 0.3).translate(0, y0 + KAPI_H, 0.38), (x, yy) => KUV(x, yy - 1)), K.atlas)
  kanatlar(ek, 'yesil', m.koyu, m.bronz, ACIK - 0.05, y0 + 0.02, KAPI_H - 0.1, 0.36, 3)
  // Yan sütunceler (kuzey cephedeki mermer çerçeveli açıklıktaki gibi)
  for (const s of [-1, 1]) {
    ek(dondurG([[0.19, 0], [0.16, 0.2], [0.125, 0.34], [0.125, 2.52], [0.15, 2.64], [0.12, 2.74], [0.2, 2.98], [0.13, 3]], 12).translate(s * (ACIK / 2 + 0.03), y0, 0.56), m.icMermer)
  }
  ek(kutuG(ACIK + 0.5, 0.12, DER + 0.25).translate(0, y0 + 0.06, DER / 2 + 0.1), m.icMermer)
}

/** Boyalı ahşap, kabartma panolu iki kanat. */
function kanatlar(ek: (g: THREE.BufferGeometry, m: Boyali) => void, ana: Boyali, koyu: Boyali, bronz: Mal, w: number, y0: number, h: number, z: number, SIRA: number) {
  for (const s of [-1, 1]) {
    const kw = w / 2 - 0.02, kx = s * (w / 4)
    ek(kutuG(kw, h, 0.09).translate(kx, y0 + h / 2, z), ana)
    const pw = kw - 0.34, ara = 0.2, ph = (h - ara * (SIRA + 1)) / SIRA
    for (let i = 0; i < SIRA; i++) {
      const py = y0 + ara + ph / 2 + i * (ph + ara)
      // Yuvarlak kenarlı kabartma pano: gölgesi kenarlardan okunur
      ek(kutuG(pw, ph, 0.03).translate(kx, py, z + 0.055), ana)
      for (const u of [-1, 1]) {
        ek(kutuG(pw + 0.08, 0.035, 0.03).translate(kx, py + u * (ph / 2 + 0.018), z + 0.05), koyu)
        ek(kutuG(0.035, ph, 0.03).translate(kx + u * (pw / 2 + 0.018), py, z + 0.05), koyu)
      }
    }
    ek(new THREE.TorusGeometry(0.075, 0.014, 6, 14).translate(s * 0.15, y0 + h * 0.47, z + 0.06), bronz)
  }
  ek(kutuG(0.03, h, 0.02).translate(0, y0 + h / 2, z + 0.05), koyu)
}

// --- Şadırvan köşkü ---
const KOSK_OCTA = Math.cos(Math.PI / 8)

/** Yonca kemer açıklığının kenarı: post dibinden tepeye (sol yarı). u -1..0, v 0..1 */
function yoncaKenari(): [number, number][] {
  const n: [number, number][] = []
  const bez = (p: [number, number], q: [number, number], r: [number, number], s: [number, number], adim: number) => {
    for (let i = n.length ? 1 : 0; i <= adim; i++) {
      const t = i / adim, a = 1 - t
      n.push([a * a * a * p[0] + 3 * a * a * t * q[0] + 3 * a * t * t * r[0] + t * t * t * s[0], a * a * a * p[1] + 3 * a * a * t * q[1] + 3 * a * t * t * r[1] + t * t * t * s[1]])
    }
  }
  // Yan yaprak: postun yanından içeri kıvrılan küçük lob
  bez([-1, 0], [-0.98, 0.16], [-0.86, 0.3], [-0.68, 0.3], 5)
  // Tepe yaprağı: geniş lob, sivri tepe
  bez([-0.68, 0.3], [-0.84, 0.56], [-0.72, 0.8], [-0.38, 0.8], 6)
  bez([-0.38, 0.8], [-0.24, 0.82], [-0.08, 0.9], [0, 1], 4)
  return n
}

export function kosk(k: Kova, m: UlucamiMalzemeleri, K: KapilarMalzemeleri, x: number, z: number) {
  const ek = (g: THREE.BufferGeometry, mal: Boyali) => typeof mal === 'string' ? k.ekle(yer(boya(g, mal), x, 0, z), K.atlas) : k.ekle(yer(g, x, 0, z), mal)
  const sekizgen = (g: THREE.BufferGeometry) => { const d = g.index ? g.toNonIndexed() : g; d.computeVertexNormals(); return d }
  const yuzler = new Yuzler()
  // Oranlar fotoğraftan: post 3.45, kemer kuşağı 1.87, frız 1.33, saçak 0.45, kubbe 4.7
  const R = 3.7, TABAN = 0.28, BASLIK = 3.7, FRIZ_ALT = 5.45, FRIZ_UST = 6.85, SACAK_UST = 7.3, KUBBE_H = 4.75
  // Zemin: kademeli mermer sekizgen ve şerit döşeme
  const zeminUV = <G extends THREE.BufferGeometry>(g: G) => {
    const p = g.attributes.position, t = g.attributes.uv
    for (let i = 0; i < p.count; i++) { const [u, v] = fotoUV(725 + p.getX(i) * 13, 1000 + p.getZ(i) * 13 + p.getY(i) * 13); t.setXY(i, u, v) }
    return g
  }
  ek(zeminUV(sekizgen(silindirG(4.25, 4.35, TABAN, 8).rotateY(Math.PI / 8).translate(0, TABAN / 2, 0))), K.atlas)
  // Havuz: sekiz yüzlü, her yüzde panolu musluk (fotoğraftan)
  const HV_R = 2.05, HV_H = 1.0, HV_Y = 0.42
  ek(zeminUV(sekizgen(silindirG(2.4, 2.55, HV_Y - TABAN + 0.1, 8).rotateY(Math.PI / 8).translate(0, (HV_Y + TABAN) / 2, 0))), K.atlas)
  for (let n = 0; n < 8; n++) {
    const a0 = (n / 8) * Math.PI * 2 + Math.PI / 8, a1 = ((n + 1) / 8) * Math.PI * 2 + Math.PI / 8
    const p = (a: number, r: number, yy: number, s: number, t: number) => [Math.sin(a) * r, yy, Math.cos(a) * r, ...yerUV('havuz', s, t)]
    yuzler.dortgen(p(a0, HV_R, HV_Y, 0, 0), p(a1, HV_R, HV_Y, 1, 0), p(a1, HV_R, HV_Y + HV_H, 1, 1), p(a0, HV_R, HV_Y + HV_H, 0, 1))
  }
  ek(zeminUV(sekizgen(silindirG(HV_R + 0.1, HV_R + 0.1, 0.1, 8).rotateY(Math.PI / 8).translate(0, HV_Y + HV_H + 0.05, 0))), K.atlas)
  ek(silindirG(HV_R - 0.08, HV_R - 0.08, 0.04, 8).rotateY(Math.PI / 8).translate(0, HV_Y + HV_H + 0.09, 0), 'su')
  // Ortadaki fıskiye: ayak ve lale biçimi çanak
  ek(dondurG([[0.2, 0], [0.13, 0.1], [0.11, 0.45], [0.18, 0.55], [0.42, 0.72], [0.48, 0.82], [0.1, 0.72], [0, 0.72]], 16).translate(0, HV_Y + HV_H + 0.1, 0), m.mermer)
  // Oturaklar
  for (let n = 0; n < 8; n++) {
    const a = (n / 8) * Math.PI * 2
    ek(dondurG([[0.17, 0], [0.15, 0.3], [0.17, 0.32]], 8).translate(Math.sin(a) * 2.95, TABAN, Math.cos(a) * 2.95), m.mermer)
    ek(dondurG([[0.18, 0.32], [0.2, 0.42], [0.15, 0.5], [0, 0.52]], 8).translate(Math.sin(a) * 2.95, TABAN, Math.cos(a) * 2.95), 'direk')
  }

  // Direkler: koyu ahşap, sekiz köşe, başlıklı
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + (n * Math.PI) / 4, dx = R * Math.sin(a), dz = R * Math.cos(a)
    ek(dondurG([[0.2, TABAN], [0.19, TABAN + 0.1], [0.14, TABAN + 0.18], [0.14, BASLIK - 0.22], [0.2, BASLIK - 0.12], [0.2, BASLIK - 0.08], [0.26, BASLIK], [0.14, BASLIK + 0.05], [0.14, FRIZ_ALT]], 8).translate(dx, 0, dz), 'direk')
  }
  // Korkuluk: alt ve üst kuşak, çapraz ve dikmeler (fotoğraftaki çarpı düzeni)
  const gen = 2 * R * Math.sin(Math.PI / 8), yuz = R * KOSK_OCTA
  for (let n = 0; n < 8; n++) {
    const a = (n * Math.PI) / 4
    const parca = (g: THREE.BufferGeometry, mal: Boyali) => ek(g.translate(0, 0, yuz).rotateY(a), mal)
    const g2 = gen - 0.3
    parca(kutuG(g2, 0.08, 0.07).translate(0, TABAN + 0.28, 0), 'direk')
    parca(kutuG(g2, 0.08, 0.07).translate(0, TABAN + 1.02, 0), 'direk')
    const b = g2 / 2 - 0.02, yk = 0.66
    for (const c of [-1, 1]) {
      parca(kutuG(0.08, yk + 0.1, 0.07).translate((c * g2) / 6, TABAN + 0.65, 0), 'direk')
      for (const d of [-1, 1]) {
        const uzun = Math.hypot((b - g2 / 6), yk)
        const aci = Math.atan2(b - g2 / 6, yk)
        parca(kutuG(0.05, uzun, 0.05).rotateZ(d * aci).translate((c * (b + g2 / 6)) / 2, TABAN + 0.65, 0), 'direk')
      }
    }
    // Yonca kemerli kuşak: krem pano, koyu kenar
    const kenar = yoncaKenari()
    const B0 = BASLIK - 0.1, H = FRIZ_ALT - B0, O = gen / 2 - 0.17
    const nokta = (p: [number, number]): [number, number] => [p[0] * O, B0 + p[1] * H * 0.96]
    const sag = kenar.map(([u, v]) => nokta([-u, v])).reverse()
    const sol = kenar.map(nokta)
    const kremS = new THREE.Shape()
    kremS.moveTo(-O, FRIZ_ALT); kremS.lineTo(-O, sol[0][1])
    for (const p of sol) kremS.lineTo(p[0], p[1])
    for (const p of sag.slice(1)) kremS.lineTo(p[0], p[1])
    kremS.lineTo(O, FRIZ_ALT); kremS.closePath()
    parca(cikar(kremS, 0.09, -0.05), 'krem')
    // Koyu kenar: yonca çizgisi boyunca kalınlaştırılmış şerit
    const hepsi = [...sol, ...sag.slice(1)]
    const serit = new THREE.Shape()
    const KAL = 0.085
    const ofset = hepsi.map((p, i) => {
      const o = hepsi[Math.max(0, i - 1)], s = hepsi[Math.min(hepsi.length - 1, i + 1)]
      const dx = s[0] - o[0], dy = s[1] - o[1], l = Math.hypot(dx, dy) || 1
      return [p[0] + (-dy / l) * KAL, p[1] + (dx / l) * KAL] as [number, number]
    })
    serit.moveTo(hepsi[0][0], hepsi[0][1])
    for (const p of hepsi.slice(1)) serit.lineTo(p[0], p[1])
    for (const p of [...ofset].reverse()) serit.lineTo(p[0], p[1])
    serit.closePath()
    parca(cikar(serit, 0.14, -0.08), 'direk')
    // Kuşağın üst kirişi ve frız
    parca(kutuG(gen + 0.06, 0.13, 0.2).translate(0, FRIZ_ALT, 0), 'direk')
  }
  const sek = (ust: number, alt: number, h: number, yy: number, acik = false) => sekizgen(silindirG(ust, alt, h, 8, acik).rotateY(Math.PI / 8).translate(0, yy + h / 2, 0))
  ek(sek(R + 0.08, R + 0.08, FRIZ_UST - FRIZ_ALT, FRIZ_ALT), 'krem')
  ek(sek(R + 0.11, R + 0.11, 0.17, FRIZ_ALT + 0.58), 'direk')
  ek(sek(R + 0.34, R + 0.08, 0.32, FRIZ_UST - 0.1), 'krem')
  // Saçak: geniş, ince, kurşun kaplı; kubbe tabanına eğimli
  ek(sek(R + 0.72, R + 0.72, 0.08, FRIZ_UST + 0.22), m.koyu)
  ek(sek(3.15, R + 0.74, SACAK_UST - FRIZ_UST - 0.3, FRIZ_UST + 0.3), m.kursun)
  // Soğan kubbe: 16 dilim, dilimler dolgun, ince dikişli, tepede sivri (fotoğraftan)
  const PROF: [number, number][] = [[2.96, 0], [3.06, 0.32], [3.06, 0.95], [2.98, 1.32], [2.65, 1.85], [2.12, 2.25], [1.55, 2.62], [1.02, 3.05], [0.62, 3.5], [0.28, 4.05], [0.08, 4.6], [0.02, KUBBE_H]]
  const DILIM = 16, ALT = 8
  const SATIR = 26
  const noktalar: [number, number][] = []
  for (let i = 0; i <= SATIR; i++) {
    const t = (i / SATIR) * (PROF.length - 1), a = Math.min(PROF.length - 2, Math.floor(t)), f = t - a
    noktalar.push([PROF[a][0] + (PROF[a + 1][0] - PROF[a][0]) * f, PROF[a][1] + (PROF[a + 1][1] - PROF[a][1]) * f])
  }
  const ku = new Yuzler()
  const toplam = DILIM * ALT
  const v = (i: number, j: number) => {
    const [r0, h] = noktalar[i]
    const th = (j / toplam) * Math.PI * 2
    const dl = (j % ALT) / ALT // dilim içi 0..1
    const kabar = Math.sin(dl * Math.PI) ** 0.6
    const siddet = 0.035 + 0.05 * (1 - i / SATIR) // tepede kabarma azalır ama dikiş sürer
    const r2 = r0 * (1 - siddet * 0.55 + siddet * kabar * 0.55)
    // Atlas: iki dilimlik orta kırpım, dilimden dilime aynalanır
    const iki = (j / ALT) % 2
    const s = iki <= 1 ? iki : 2 - iki
    return [Math.sin(th) * r2, h + SACAK_UST - 0.05, Math.cos(th) * r2, ...yerUV('kubbe', 0.02 + s * 0.96, Math.min(0.995, 0.02 + (i / SATIR) * 0.97))]
  }
  for (let i = 0; i < SATIR; i++) for (let j = 0; j < toplam; j++) ku.dortgen(v(i, j), v(i, j + 1), v(i + 1, j + 1), v(i + 1, j))
  const kuG = ku.geometri()
  yumusat(kuG)
  ek(kuG, K.atlas)
  ek(dondurG([[0.1, 0], [0.18, 0.1], [0.05, 0.22], [0.13, 0.38], [0.04, 0.5], [0.02, 0.86], [0, 0.9]], 8).translate(0, SACAK_UST + KUBBE_H - 0.12, 0), m.bronz)
  ek(yuzler.geometri(), K.atlas)
}

/** Aynı konumdaki köşelerin normallerini ortalar: dilimler pürüzsüz görünür, dikişler keskin kalır. */
function yumusat(g: THREE.BufferGeometry) {
  const p = g.attributes.position, n = g.attributes.normal
  const harita = new Map<string, THREE.Vector3>()
  const a = new THREE.Vector3()
  const anahtar = (i: number) => `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
  for (let i = 0; i < p.count; i++) {
    const s = anahtar(i)
    const t = harita.get(s) ?? new THREE.Vector3()
    t.add(a.set(n.getX(i), n.getY(i), n.getZ(i)))
    harita.set(s, t)
  }
  for (let i = 0; i < p.count; i++) {
    const t = harita.get(anahtar(i))
    if (t) { a.copy(t).normalize(); n.setXYZ(i, a.x, a.y, a.z) }
  }
}

/** Duvar boyunca uzanan fotoğraflı şerit (kaba taş kaide, saçak silmesi): parçalar aynalanarak sürer. */
export function serit(ek: (g: THREE.BufferGeometry) => void, ad: 'kaide' | 'sacak', L: number, y0: number, h: number, d: number) {
  const n = Math.ceil(L / (ad === 'kaide' ? 4.5 : 10)), g = L / n
  const y = new Yuzler()
  for (let i = 0; i < n; i++) {
    const x0 = -L / 2 + i * g, x1 = x0 + g
    const s0 = i % 2 ? 1 : 0, s1 = 1 - s0
    y.dortgen([x0, y0, d, ...yerUV(ad, s0, 0)], [x1, y0, d, ...yerUV(ad, s1, 0)], [x1, y0 + h, d, ...yerUV(ad, s1, 1)], [x0, y0 + h, d, ...yerUV(ad, s0, 1)])
    y.dortgen([x0, y0 + h, d, ...yerUV(ad, s0, 0.97)], [x1, y0 + h, d, ...yerUV(ad, s1, 0.97)], [x1, y0 + h, -0.05, ...yerUV(ad, s1, 1)], [x0, y0 + h, -0.05, ...yerUV(ad, s0, 1)])
    y.dortgen([x0, y0, -0.05, ...yerUV(ad, s0, 0)], [x1, y0, -0.05, ...yerUV(ad, s1, 0)], [x1, y0, d, ...yerUV(ad, s1, 0.03)], [x0, y0, d, ...yerUV(ad, s0, 0.03)])
  }
  ek(y.geometri())
}
