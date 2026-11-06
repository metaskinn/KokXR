// Ulu Camii kubbe bölgesi: kurşun kubbeler, iç kubbeler, pandantifler, avizeler ve minarelerin üst bölümü.
// Biçimler arşiv fotoğraflarından yorumlanmıştır: kurşun dikişleri, etek ve âlem DJI_0315; tepeden görünüş DJI_0228;
// minare gövdesi, şerefe ve külah DJI_0417 ile DJI_0085; iç kubbe bezemesi ERD05149 (doku doğrudan bu fotoğraftan).
// Ölçüler temsilîdir. Aynı kurşun dokusu her kubbede döndürülerek kullanılır; hepsi Kova ile birleşir.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../data/acikYayin'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'
import { hafifCihaz, rastgele } from '../ulucamiZemin'
import { KASNAK_TABAN, type Kova, OCTA, dondurG, kemer, kutuG, silindirG, yer } from '../ulucamiParca'

type Ciz = (c: CanvasRenderingContext2D, g: number, y: number) => void

/** Kurşun kubbe dokusunun üst şeridi: âlemlerin bakır yeşili buradan okunur, böylece ayrı çizim çağrısı açılmaz. */
const YAMA_V = 0.94
/** Kurşun levha sıraları (v) ve her sıranın sütun sayısı: tepeye doğru her ikinci dikiş biter (DJI_0315). */
const SIRALAR: [number, number, number][] = [[0, 0.15, 40], [0.15, 0.33, 40], [0.33, 0.53, 40], [0.53, 0.74, 20], [0.74, YAMA_V, 20]]
const KUBBE_DIKIS = 40

export const kubbeDokuBoyu = () => (hafifCihaz() ? 1024 : 2048)

export const kursunKubbeCiz = (kabartma: boolean): Ciz => (c, g, y) => {
  const r = rastgele(61), oy = (v: number) => (1 - v) * y
  c.fillStyle = kabartma ? '#808080' : '#9db0bd'
  c.fillRect(0, 0, g, y)
  const birim = g / 2048
  for (const [v0, v1, adet] of SIRALAR) {
    const d = g / adet
    for (let i = 0; i < adet; i++) {
      const s = r(), x = i * d, u = oy(v1), h = oy(v0) - oy(v1)
      if (kabartma) {
        c.fillStyle = `rgba(${s > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.1})`
        c.fillRect(x, u, d, h)
        continue
      }
      // Levhaların tonu: çoğu açık mavi gri, seyrek olarak yenilenmiş veya kahverengi oksitli levha.
      c.fillStyle = s < 0.035 && adet === KUBBE_DIKIS ? `rgba(138,116,94,${0.35 + r() * 0.3})`
        : s < 0.14 ? `rgba(214,226,233,${0.3 + r() * 0.3})`
          : s < 0.42 ? `rgba(120,138,150,${0.08 + r() * 0.16})` : `rgba(235,242,246,${r() * 0.16})`
      c.fillRect(x, u, d, h)
      const iz = c.createLinearGradient(0, u, 0, u + h)
      iz.addColorStop(0, 'rgba(255,255,255,0.1)'); iz.addColorStop(1, 'rgba(66,76,84,0.14)')
      c.fillStyle = iz
      c.fillRect(x, u, d, h)
      // Bindirmeden süzülen ince izler
      for (let n = 0; n < 7; n++) {
        c.fillStyle = `rgba(${r() > 0.35 ? '70,76,80' : '255,255,255'},${0.03 + r() * 0.07})`
        c.fillRect(x + r() * d, u, (1 + r() * 3) * birim, h * (0.3 + r() * 0.7))
      }
      // Dikişin iki yanındaki gölge ve üstündeki ışık
      c.fillStyle = 'rgba(42,50,56,0.34)'
      c.fillRect(x + 3 * birim, u, 3 * birim, h); c.fillRect(x - 6 * birim, u, 3 * birim, h)
      c.fillStyle = 'rgba(244,248,250,0.26)'
      c.fillRect(x - 2 * birim, u, 4 * birim, h)
    }
    // Yatay bindirme
    c.fillStyle = kabartma ? '#2a2a2a' : 'rgba(44,52,58,0.62)'
    c.fillRect(0, oy(v1), g, 3 * birim)
    c.fillStyle = kabartma ? '#e8e8e8' : 'rgba(246,249,250,0.4)'
    c.fillRect(0, oy(v1) + 3 * birim, g, 3 * birim)
  }
  if (kabartma) {
    c.fillStyle = '#808080'
    c.fillRect(0, 0, g, oy(YAMA_V))
    return
  }
  // Eteğin kiri ve koyu saçak ağzı
  const etek = c.createLinearGradient(0, oy(0.13), 0, y)
  etek.addColorStop(0, 'rgba(84,86,84,0)'); etek.addColorStop(0.42, 'rgba(84,86,84,0.3)'); etek.addColorStop(0.47, 'rgba(38,40,42,0.92)'); etek.addColorStop(1, 'rgba(30,32,34,0.95)')
  c.fillStyle = etek
  c.fillRect(0, oy(0.13), g, y - oy(0.13))
  // Bakır yeşili yama
  c.fillStyle = '#56685c'
  c.fillRect(0, 0, g, oy(YAMA_V))
  for (let i = 0; i < 900; i++) {
    c.fillStyle = `rgba(${r() > 0.5 ? '120,158,136' : '36,34,28'},${r() * 0.35})`
    c.fillRect(r() * g, r() * oy(YAMA_V), (1 + r() * 8) * birim, (1 + r() * 4) * birim)
  }
}

/** Düz kurşun: yamaca dik levhalar, dikişler, oksit ve toz. */
export const kursunDuzCiz: Ciz = (c, g, y) => {
  const r = rastgele(53), adet = 8, boy = 2, d = g / adet, h = y / boy
  c.fillStyle = '#9ea7ab'
  c.fillRect(0, 0, g, y)
  for (let i = 0; i < adet; i++) for (let j = 0; j < boy; j++) {
    const s = r()
    c.fillStyle = s < 0.2 ? `rgba(122,106,88,${0.14 + r() * 0.26})` : s < 0.55 ? `rgba(70,78,84,${0.05 + r() * 0.15})` : `rgba(226,232,236,${r() * 0.24})`
    c.fillRect(i * d, j * h, d, h)
    for (let n = 0; n < 16; n++) {
      c.fillStyle = `rgba(${r() > 0.4 ? '58,58,54' : '238,240,240'},${0.02 + r() * 0.06})`
      c.fillRect(i * d + r() * d, j * h, 1 + r() * 3, h * (0.3 + r() * 0.7))
    }
  }
  for (let i = 0; i < adet; i++) {
    c.fillStyle = 'rgba(36,40,44,0.55)'; c.fillRect(i * d + 3, 0, 3, y); c.fillRect(i * d - 5, 0, 2, y)
    c.fillStyle = 'rgba(238,242,244,0.6)'; c.fillRect(i * d - 3, 0, 6, y)
  }
  for (let j = 0; j < boy; j++) { c.fillStyle = 'rgba(36,40,44,0.5)'; c.fillRect(0, j * h, g, 2) }
}

/** Pandantif: düz sıva, kenarlarda çift çizgi, kemer tepelerine bakan küçük bitkisel motif (ERD05124). */
export const pandantifCiz: Ciz = (c, g, y) => {
  c.fillStyle = '#f2ead9'
  c.fillRect(0, 0, g, y)
  const ton = c.createLinearGradient(0, 0, 0, y)
  ton.addColorStop(0, 'rgba(176,146,108,0.26)'); ton.addColorStop(0.5, 'rgba(176,146,108,0.06)'); ton.addColorStop(1, 'rgba(176,146,108,0)')
  c.fillStyle = ton
  c.fillRect(0, 0, g, y)
  c.fillStyle = '#2e2a26'
  c.fillRect(0, 3, g, 5); c.fillRect(0, y - 9, g, 6)
  c.fillStyle = '#8a6a35'
  c.fillRect(0, 12, g, 3); c.fillRect(0, y - 17, g, 3)
  c.fillStyle = '#5b4730'
  for (let n = 0; n < 4; n++) {
    const x = (n / 4) * g, v = y - 46
    for (const yan of [-1, 1]) for (let k = 0; k < 4; k++) {
      const px = x + yan * (6 + k * 6)
      c.beginPath(); c.ellipse(px, v - k * 2 + 8, 7 - k, 3.4, yan * (0.5 + k * 0.25), 0, Math.PI * 2); c.fill()
      if (n === 0) { c.beginPath(); c.ellipse(g + px, v - k * 2 + 8, 7 - k, 3.4, yan * (0.5 + k * 0.25), 0, Math.PI * 2); c.fill() }
    }
  }
}

/** İç kubbe atlası yoksa (açık yayın) kodla çizilen aynı düzen: kuşak, sekiz taç, göbek. */
const icKubbeYedekCiz: Ciz = (c, g, y) => {
  c.fillStyle = '#efe3cd'
  c.fillRect(0, 0, g, y)
  const yaprak = (x: number, v: number, b: number, a: number) => {
    c.save(); c.translate(x, v); c.rotate(a)
    c.beginPath(); c.moveTo(0, -b); c.quadraticCurveTo(b * 0.7, 0, 0, b); c.quadraticCurveTo(-b * 0.7, 0, 0, -b)
    c.fill(); c.restore()
  }
  for (let t = 0; t < 2; t++) {
    const cx = g / 4 + (t * g) / 2, cy = y / 2, R = 0.48 * y
    c.strokeStyle = '#2e2a26'; c.lineWidth = R * 0.012
    for (const o of [0.995, 0.905]) { c.beginPath(); c.arc(cx, cy, R * o, 0, Math.PI * 2); c.stroke() }
    c.fillStyle = '#54402c'
    for (let n = 0; n < 72; n++) {
      const a = (n / 72) * Math.PI * 2
      yaprak(cx + Math.sin(a) * R * 0.95, cy - Math.cos(a) * R * 0.95, R * 0.022, a + (n % 2 ? 0.9 : -0.9))
    }
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      for (let k = -2; k <= 2; k++) yaprak(cx + Math.sin(a + k * 0.03) * R * 0.71, cy - Math.cos(a + k * 0.03) * R * 0.71, R * 0.036, a + k * 0.4)
    }
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2 + t * 0.13
      c.fillStyle = n % 2 ? '#54402c' : '#8a6a35'
      yaprak(cx + Math.sin(a) * R * 0.19, cy - Math.cos(a) * R * 0.19, R * 0.13, a)
    }
    c.fillStyle = '#3a2d1f'
    c.beginPath(); c.arc(cx, cy, R * 0.05, 0, Math.PI * 2); c.fill()
  }
}

/** İç kubbe haritası: fotoğraf atlası; açık yayında kodla çizilen eşi. */
function icKubbeHaritasi() {
  if (ACIK_YAYIN) {
    const el = document.createElement('canvas')
    el.width = 2048; el.height = 1024
    const c = el.getContext('2d')
    if (!c) throw new Error('Tuval kullanılamıyor')
    icKubbeYedekCiz(c, el.width, el.height)
    const t = new THREE.CanvasTexture(el)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  const t = new THREE.TextureLoader().load(`/gorseller/ulu-camii/maket/kubbe-ic-${kubbeDokuBoyu()}.jpg`)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** İç kubbe malzemesinin ayarları: resim kendi ışığını taşıdığından az bir öz ışık gölgeleri açar. */
export function icKubbeAyari() {
  const map = icKubbeHaritasi()
  return { map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.3, roughness: 0.9, side: THREE.DoubleSide }
}

const smooth = THREE.MathUtils.smoothstep

/** Dikişleri gerçekten kabaran, eteği sekizgene açılan kurşun kubbe (DJI_0315). */
function kursunKubbeG(kubbeH: number, acikR: number, donus: number) {
  // Saçak altı, ağız, içbükey etek, sonra dışbükey gövde
  const profil: [number, number][] = [[6.12, -0.24], [6.86, -0.17], [6.92, -0.08], [6.64, 0.08], [6.3, 0.26], [6.0, 0.5], [5.76, 0.8]]
  const a0 = Math.asin(Math.pow(0.83 / kubbeH, 1 / 1.08))
  for (let t = 0; t <= 13; t++) {
    const a = a0 + (t / 13) * (Math.PI / 2 - a0)
    const r = 5.65 * Math.pow(Math.max(Math.cos(a), 0), 0.86)
    if (acikR && r < acikR) break
    profil.push([Math.max(r, 0.001), 0.32 + kubbeH * Math.pow(Math.sin(a), 1.08)])
  }
  let boy = 0
  const yayV = profil.map((p, i) => (boy += i ? Math.hypot(p[0] - profil[i - 1][0], p[1] - profil[i - 1][1]) : 0))
  const oranlar = [0, 0.07, 0.5, 0.93]
  const konum: number[] = [], uv: number[] = [], dizin: number[] = []
  const sut = KUBBE_DIKIS * oranlar.length
  profil.forEach(([r0, y], s) => {
    const b = 1 - smooth(y, 0, kubbeH * 0.34), v = (yayV[s] / boy) * YAMA_V
    for (let a = 0; a <= sut; a++) {
      const panel = Math.floor(a / oranlar.length), oran = oranlar[a % oranlar.length]
      const uyuk = (panel + oran) / KUBBE_DIKIS, teta = uyuk * Math.PI * 2
      const parca = Math.PI / 4, fark = ((teta + parca / 2) % parca) - parca / 2
      const sekizgen = THREE.MathUtils.lerp(1, (OCTA / Math.cos(fark)) * 1.04, b)
      const zayif = smooth(r0, 0.5, 1.8) * (panel % 2 ? 1 - smooth(v, 0.5, 0.56) : 1)
      const kabarti = (a % oranlar.length === 0 ? 0.06 : a % oranlar.length === 2 ? -0.035 : 0) * zayif
      const r = r0 * sekizgen + kabarti
      konum.push(Math.sin(teta) * r, y, Math.cos(teta) * r)
      uv.push(uyuk + donus, v)
    }
  })
  for (let s = 0; s < profil.length - 1; s++) for (let a = 0; a < sut; a++) {
    const p = s * (sut + 1) + a, q = p + sut + 1
    dizin.push(p, p + 1, q, p + 1, q + 1, q)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(dizin)
  g.computeVertexNormals()
  // Doku dikişinde normaller kopmasın
  const n = g.attributes.normal
  for (let s = 0; s < profil.length; s++) {
    const a = s * (sut + 1), z = a + sut
    const v = new THREE.Vector3(n.getX(a) + n.getX(z), n.getY(a) + n.getY(z), n.getZ(a) + n.getZ(z)).normalize()
    n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(z, v.x, v.y, v.z)
  }
  return { g, son: profil[profil.length - 1] }
}

/** Kasnağın dört yana eğimli kurşun kaidesi: levhalar yamaç boyunca düz iner. */
export function kursunKaideG(ustR: number, altR: number, h: number) {
  const g = new THREE.CylinderGeometry(ustR, altR, h, 4, 1, true).rotateY(Math.PI / 4).toNonIndexed()
  g.computeVertexNormals()
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, Math.abs(n.getX(i)) > Math.abs(n.getZ(i)) ? p.getZ(i) : p.getX(i), p.getY(i))
  return g
}

/** UV'yi kurşun dokusunun bakır yeşili şeridine taşır. */
function yamaUV<G extends THREE.BufferGeometry>(g: G) {
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), YAMA_V + 0.012 + (uv.getY(i) % 1) * 0.04)
  return g
}

/** Kubbe âlemi: geniş tabla, kademeler ve hilal (DJI_0315). */
function alemEkle(kv: Kova, m: UlucamiMalzemeleri, x: number, y: number, z: number) {
  const P: [number, number][] = [[0.44, 0], [0.44, 0.05], [0.22, 0.12], [0.17, 0.3], [0.24, 0.42], [0.14, 0.56], [0.2, 0.68], [0.11, 0.78], [0.15, 0.86], [0.05, 0.96], [0.09, 1.03], [0.025, 1.18], [0.02, 1.32]]
  kv.ekle(yer(yamaUV(dondurG(P, 8, [1, 1])), x, y, z), m.kubbe)
  const hilal = new THREE.TorusGeometry(0.13, 0.026, 4, 10, Math.PI * 1.45).rotateZ((Math.PI * 3) / 4)
  kv.ekle(yer(yamaUV(hilal), x, y + 1.44, z), m.kubbe)
}

/** Dış kubbe: kurşun gövde; şadırvan gözünde üstü geniş cam açıklık (DJI_0228), diğerlerinde âlem. */
export function kursunKubbeEkle(kv: Kova, m: UlucamiMalzemeleri, x: number, kY: number, z: number, kubbeH: number, acik: boolean, i: number, j: number) {
  const { g, son } = kursunKubbeG(kubbeH, acik ? 3.5 : 0, ((i * 7 + j * 13) % KUBBE_DIKIS) / KUBBE_DIKIS)
  kv.ekle(yer(g, x, kY, z), m.kubbe)
  if (!acik) { alemEkle(kv, m, x, kY + 0.32 + kubbeH - 0.05, z); return }
  const [sonR, sonY] = son
  kv.ekle(yer(new THREE.TorusGeometry(sonR, 0.14, 8, 32).rotateX(Math.PI / 2), x, kY + sonY, z), m.koyu)
  kv.ekle(yer(dondurG([[sonR, 0], [sonR * 0.93, 0.55], [sonR * 0.72, 1.15], [sonR * 0.4, 1.6], [0.01, 1.8]], 32, [1, 1]), x, kY + sonY, z), m.cam)
  kv.ekle(yer(dondurG([[0.1, 0], [0.04, 0.5], [0, 0.55]], 8), x, kY + sonY + 1.8, z), m.bronz)
}

/** Pandantifin ağız yarıçapı: dış kurşun halkanın içinde kalır. */
export const IC_KUBBE_R = 5.38
const ACIK_IC_R = 3.1

/** Doku yarıçapı (tepe 0, ağız 1) ile yükseliş açısı arasındaki eşleme: alttan bakışta fotoğrafa yakın, ağızda sündürmez. */
const dokuQ = (t: number) => 0.62 * Math.cos(t) + 0.38 * (1 - t / (Math.PI / 2))
function dokuTeta(q: number) {
  let a = 0, b = Math.PI / 2
  for (let n = 0; n < 24; n++) { const o = (a + b) / 2; if (dokuQ(o) > q) a = o; else b = o }
  return (a + b) / 2
}

/** İç kubbe: pandantiften tepeye tek yüzey. Kasnak yüksekliğine kadarı kasnak katmanına, üstü kubbe katmanına gider. */
export function icKubbeEkle(m: UlucamiMalzemeleri, kKasnak: Kova, kKubbe: Kova, x: number, z: number, kasnakH: number, kubbeH: number, acik: boolean, i: number, j: number) {
  const H2 = kasnakH + kubbeH - 0.35, R = IC_KUBBE_R
  const tepe = acik ? Math.acos(ACIK_IC_R / R) : Math.PI / 2
  const orta = Math.asin(kasnakH / H2)
  const tur = (i + j) % 2, ceyrek = (i * 3 + j) % 4
  const SEG = 64
  const parca = (t0: number, t1: number, sira: number) => {
    const konum: number[] = [], uv: number[] = [], dizin: number[] = []
    for (let s = 0; s <= sira; s++) {
      const t = t0 + ((t1 - t0) * s) / sira, rho = Math.max(Math.cos(t), 0.001), y = H2 * Math.sin(t), q = dokuQ(t)
      for (let a = 0; a <= SEG; a++) {
        const f = (a / SEG) * Math.PI * 2, fd = f + (ceyrek * Math.PI) / 2
        konum.push(Math.sin(f) * R * rho, y, Math.cos(f) * R * rho)
        uv.push((tur + 0.5 + 0.48 * Math.sin(fd) * q) / 2, 0.5 + 0.48 * Math.cos(fd) * q)
      }
    }
    for (let s = 0; s < sira; s++) for (let a = 0; a < SEG; a++) {
      const p = s * (SEG + 1) + a, q = p + SEG + 1
      dizin.push(p, q, p + 1, p + 1, q, q + 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(dizin)
    g.computeVertexNormals()
    return yer(g, x, KASNAK_TABAN, z)
  }
  kKasnak.ekle(parca(0, Math.min(orta, tepe), 6), m.icKubbe)
  if (tepe > orta) kKubbe.ekle(parca(orta, tepe, acik ? 5 : 10), m.icKubbe)

  // Fotoğraftaki sekiz pencerenin kafesi, dokudaki yerine oturur ve ışık alır.
  for (let n = 0; n < 8; n++) {
    const f = (n * Math.PI) / 4
    const s = kemer(new THREE.Shape(), 0, 0, 2, 0.62, 0.38)
    const g = new THREE.ShapeGeometry(s, 5)
    const p = g.attributes.position, uv = g.attributes.uv
    for (let v = 0; v < p.count; v++) {
      const nx = p.getX(v), ny = p.getY(v), t = dokuTeta(0.885 - ny * 0.1), fa = f + nx * 0.08
      const rIc = R * Math.cos(t) - 0.02
      uv.setXY(v, nx * 0.42, ny * 0.75)
      p.setXYZ(v, Math.sin(fa) * rIc, H2 * Math.sin(t) - 0.03, Math.cos(fa) * rIc)
    }
    kKubbe.ekle(yer(g, x, KASNAK_TABAN, z), m.camKafes)
  }

  if (acik) {
    // Camın ardındaki gökyüzü: yalnız aşağıdan görünür, dıştan bakınca yok sayılır.
    const gok = new THREE.CircleGeometry(ACIK_IC_R + 0.4, 32).rotateX(Math.PI / 2).translate(x, KASNAK_TABAN + H2 * Math.sin(tepe) + 0.55, z)
    kKubbe.ekle(gok, m.gok)
  }
}

/** DJI_0312/0339: ince koyu halka, yıldız kollar, uzun askılar ve küçük ampuller. */
export function avizeEkle(k: Kova, m: UlucamiMalzemeleri, x: number, z: number, tepe: number) {
  const ay = 4.5, R = 1.4, gobekY = ay + 2.3, N = 12
  const yon = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), delta = new THREE.Vector3()
  const tel = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    delta.subVectors(b, a)
    const geo = new THREE.CylinderGeometry(r, r, delta.length(), 4)
    geo.applyQuaternion(q.setFromUnitVectors(yon, delta.normalize()))
    k.ekle(geo.translate((a.x + b.x) / 2 + x, (a.y + b.y) / 2, (a.z + b.z) / 2 + z), m.bronz)
  }
  const nokta = (n: number, r = R, y = ay) => new THREE.Vector3(Math.sin(n * Math.PI * 2 / N) * r, y, Math.cos(n * Math.PI * 2 / N) * r)
  k.ekle(new THREE.TorusGeometry(R, 0.012, 4, 48).rotateX(Math.PI / 2).translate(x, ay, z), m.bronz)
  k.ekle(new THREE.TorusGeometry(R * 0.52, 0.009, 4, 32).rotateX(Math.PI / 2).translate(x, ay + 0.3, z), m.bronz)
  tel(new THREE.Vector3(0, gobekY, 0), new THREE.Vector3(0, tepe, 0), 0.007)
  for (let n = 0; n < N; n++) {
    // İki iç içe üçgen örgüsü yıldız iskeletini kurar; kalın disk yoktur.
    tel(nokta(n), nokta(n + 5), 0.007)
    if (n % 2 === 0) tel(nokta(n), new THREE.Vector3(0, gobekY, 0), 0.005)
    for (const inner of [false, true]) {
      const p = nokta(n + (inner ? 0.5 : 0), inner ? R * 0.52 : R, inner ? ay + 0.3 : ay)
      tel(p, p.clone().add(new THREE.Vector3(0, -0.17, 0)), 0.009)
      k.ekle(new THREE.SphereGeometry(0.04, 6, 4).scale(0.8, 1.2, 0.8).translate(x + p.x, p.y - 0.2, z + p.z), m.lamba)
      for (const ry of [0, Math.PI / 2])
        k.ekle(new THREE.PlaneGeometry(0.2, 0.2).rotateY(ry).translate(x + p.x, p.y - 0.2, z + p.z), m.lambaHale)
    }
  }
}

/** Minarenin gövdeden yukarısı: tuğla gövde, kademeli tuğla çıkma, mermer şerefe, ince gövde, boğumlu külah (DJI_0417, DJI_0085). */
export function minareUstu(ek: (g: THREE.BufferGeometry, mal: THREE.Material) => void, m: UlucamiMalzemeleri, govdeTaban: number) {
  ek(dondurG([[2.35, govdeTaban], [2.05, 26.5]], 32), m.tugla)
  for (const [y, h] of [[govdeTaban + 0.4, 0.28], [18.5, 0.12], [25.95, 0.42]]) {
    const r = THREE.MathUtils.lerp(2.35, 2.05, (y - govdeTaban) / (26.5 - govdeTaban)) + 0.05
    ek(silindirG(r, r, h, 32).translate(0, y, 0), m.tas)
  }
  // Gövdedeki dar ışık yarıkları (DJI_0315)
  for (const [y, a] of [[15.5, 1.1], [20.5, 3.3], [24, 5.2]]) {
    const r = THREE.MathUtils.lerp(2.35, 2.05, (y - govdeTaban) / (26.5 - govdeTaban))
    ek(kutuG(0.15, 0.72, 0.06).translate(0, y, r).rotateY(a), m.koyu)
  }
  // Şerefe altı: yukarı açılan kademeler ve sıra sıra çıkıntı yapan tuğlalar
  const KADEME = 6, UST = 29.75
  for (let t = 0; t < KADEME; t++) {
    const h = (UST - 26.2) / KADEME, y = 26.2 + t * h, r = 2.05 + t * 0.125
    ek(silindirG(r + 0.05, r, h, 28, true).translate(0, y + h / 2, 0), m.tugla)
    const ADET = 26
    for (let a = 0; a < ADET; a++) {
      const teta = ((a + (t % 2) * 0.5) * Math.PI * 2) / ADET
      ek(kutuG(0.27, h * 0.56, 0.2).translate(0, y + h * 0.5, r + 0.08).rotateY(teta), m.tugla)
    }
  }
  // Şerefe: dikmeli mermer korkuluk
  ek(silindirG(2.86, 2.72, 0.25, 32).translate(0, UST + 0.1, 0), m.mermer)
  ek(silindirG(2.84, 2.84, 1.35, 32, true).translate(0, UST + 0.85, 0), m.mermer)
  ek(silindirG(2.96, 2.96, 0.16, 32).translate(0, UST + 1.58, 0), m.mermer)
  for (let a = 0; a < 32; a++) {
    ek(kutuG(0.05, 1.12, 0.03).translate(0, UST + 0.85, 2.85).rotateY((a * Math.PI * 2) / 32), m.mermerKoyu)
  }
  // İnce gövde, kornişli üst bitim ve iki boğumlu külah
  ek(dondurG([[1.78, UST + 1.6], [1.68, 37.65]], 28), m.tugla)
  ek(dondurG([[1.7, 37.6], [2.02, 37.88], [2.02, 38.08], [1.72, 38.22]], 28), m.mermer)
  const Y = 38.2
  const kulah: [number, number][] = [[1.48, 0], [1.42, 0.55], [1.5, 0.6], [1.3, 1.1], [1.36, 1.17], [1.36, 1.3], [1.14, 1.38], [1.5, 1.78], [1.56, 2.17], [1.42, 2.62], [1.05, 3], [1.08, 3.1], [1.08, 3.3], [0.9, 3.4], [1.02, 3.72], [1.06, 4.06], [0.9, 4.5], [0.46, 4.85], [0.4, 5.2], [0.62, 5.55], [0.6, 5.7], [0.3, 5.95], [0.1, 6.1]]
  ek(dondurG(kulah.map(([r, y]) => [r, Y + y] as [number, number]), 22), m.hucre)
  const uc: [number, number][] = [[0.1, 0], [0.04, 0.2], [0.11, 0.35], [0.04, 0.5], [0.1, 0.65], [0.04, 0.8], [0.08, 0.95], [0.02, 1.3], [0, 1.35]]
  ek(dondurG(uc.map(([r, y]) => [r, Y + 6.1 + y] as [number, number]), 8), m.koyu)
  ek(new THREE.TorusGeometry(0.2, 0.04, 4, 10, Math.PI * 1.45).rotateZ((Math.PI * 3) / 4).translate(0, Y + 7.68, 0), m.koyu)
}
