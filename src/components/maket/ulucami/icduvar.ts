// Ulu Camii iç duvarı: pencerelerin içten görünüşü, alt sıra nişleri ve Kâbe örtüsünün vitrini.
// Biçimler arşiv fotoğraflarından: üst pencere ve vitrin ERD05018, kıble penceresi ERD05161, niş ve tepelik DJI_0288.
// Dokular scripts/ulu_icduvar_kirp.py ile bu fotoğrafların perspektifi düzeltilmiş kırpımlarıdır; yazı çizilmez.
// Vitrinin ölçüsü ve duvardaki yeri temsilîdir.
import * as THREE from 'three'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'
import { DUVAR, Kova, YX, cikar, kutuG, pz, type Mal, yer } from '../ulucamiParca'

const ZEMIN = 0.7

// ic-pencere.webp atlasındaki hücreler (piksel: x0, y0, x1, y1). scripts/ulu_icduvar_kirp.py ile aynı olmalı.
type Hucre = readonly [number, number, number, number]
const KAFES: Hucre = [0, 0, 624, 1024]
const KIBLE: Hucre = [684, 340, 964, 880]
const TEPELIK: Hucre = [661, 4, 986, 334]
/** Tepeliğin duvardaki ölçüsü (m): alt kenarı kemerin üzengisindedir, iç eğrisi dış halkaya oturur. */
const TEPELIK_G = 2.52, TEPELIK_Y = 2.56
const KIRMIZI: Hucre = [650, 910, 690, 950]
const CAM: Hucre = [730, 910, 770, 950]
const KAHVE: Hucre = [810, 910, 850, 950]
const CAM_ALT: Hucre = [890, 910, 930, 950]

/** Geometrinin UV'sini sınır kutusundan atlas hücresine oturtur. */
function hucreyeOtur<G extends THREE.BufferGeometry>(g: G, [x0, y0, x1, y1]: Hucre) {
  g.computeBoundingBox()
  const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv
  if (!b) return g
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) - b.min.x) / w, v = (p.getY(i) - b.min.y) / h
    uv.setXY(i, (x0 + u * (x1 - x0)) / 1024, 1 - (y1 - v * (y1 - y0)) / 1024)
  }
  return g
}

/** Yuvarlak kemerli açıklık: fotoğraflardaki pencere ve niş ağzı. */
function yuvarlak<P extends THREE.Path>(p: P, y0: number, g: number, duz: number, yuk: number, cx = 0): P {
  const o = g / 2
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, y0 + duz)
  p.absellipse(cx, y0 + duz, o, yuk, Math.PI, 0, true, 0)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

/** Duvar yüzünde halka: dışı `d` kadar taşan kemer. */
function halka(y0: number, g: number, duz: number, yuk: number, d: number, altTasar = true) {
  const s = yuvarlak(new THREE.Shape(), altTasar ? y0 - d : y0, g + d * 2, altTasar ? duz + d : duz, yuk + d)
  s.holes.push(yuvarlak(new THREE.Path(), y0, g, duz, yuk))
  return s
}

type Duvar = { k: Kova; m: UlucamiMalzemeleri; cx: number; x: number; z: number; ry: number }

/** Parçalar +z odaya bakacak biçimde, duvar yüzü z = 0 ve pencere ekseni x = 0 kabul edilerek kurulur. */
const duvarEki = ({ k, cx, x, z, ry }: Duvar) => (g: THREE.BufferGeometry, mal: Mal) =>
  k.ekle(yer(g.rotateY(Math.PI).translate(cx, 0, -DUVAR), x, 0, z, ry), mal)

/** Fotoğraf yoksa (açık yayın) düz renkli yedek kullanılır. */
const fotoVar = (m: UlucamiMalzemeleri) => Boolean(m.pencereIc.map)

/** Üst sıra pencere: kırmızı-kahve boyalı bant, içinde alçı kafes. Kıble ortasında oyma kafes, koyu kemerli niş. */
export function icPencereUst(k: Kova, m: UlucamiMalzemeleri, cx: number, py: number, kible: boolean, x: number, z: number, ry: number): THREE.Path {
  const ek = duvarEki({ k, m, cx, x, z, ry })
  const y0 = kible ? 9 : 7.2 + py, g = kible ? 1.7 : 2.2, duz = kible ? 2.25 : 2.55, yuk = kible ? 1.03 : 1.05
  const foto = fotoVar(m)
  const renkli = (s: THREE.Shape, z0: number, hucre: Hucre) => {
    const a = new THREE.ShapeGeometry(s, 16).translate(0, 0, z0)
    if (foto) ek(hucreyeOtur(a, hucre), m.pencereIc)
    else ek(a, m.koyu)
  }
  const pano = new THREE.ShapeGeometry(yuvarlak(new THREE.Shape(), y0, g, duz, yuk), 16).translate(0, 0, kible ? -0.12 : -0.07)
  ek(hucreyeOtur(pano, kible ? KIBLE : KAFES), m.pencereIc)
  if (kible) {
    renkli(halka(y0, g, duz, yuk, 0.3), 0.008, KAHVE)
    ek(new THREE.ShapeGeometry(halka(y0, g, duz, yuk, 0.36), 16).translate(0, 0, 0.004), m.altinKoyu)
    ek(kutuG(g + 0.8, 0.12, 0.1).translate(0, y0 - 0.33, 0.05), m.ceviz)
  } else {
    renkli(halka(y0, g, duz, yuk, 0.25), 0.008, KIRMIZI)
    ek(new THREE.ShapeGeometry(halka(y0, g, duz, yuk, 0.28), 16).translate(0, 0, 0.004), m.koyu)
  }
  return yuvarlak(new THREE.Path(), y0, g, duz, yuk, cx)
}

/** Alt sıra: kemerli niş, boyalı halka ve yapraklı tepelik, dipte ceviz doğramalı dikdörtgen pencere (DJI_0288). */
export function icPencereAlt(k: Kova, m: UlucamiMalzemeleri, cx: number, x: number, z: number, ry: number): THREE.Path {
  const ek = duvarEki({ k, m, cx, x, z, ry })
  const y0 = 1, G = 2.05, DUZ = 3.1, YUK = 1.385
  // Nişin arka yüzü: dış pencere boşluğu kadar açık
  const arka = yuvarlak(new THREE.Shape(), y0, G, DUZ, YUK)
  const PX = 0.8, P0 = 2, P1 = 4.1
  const delik = new THREE.Path()
  delik.moveTo(-PX, P0); delik.lineTo(-PX, P1); delik.lineTo(PX, P1); delik.lineTo(PX, P0); delik.closePath()
  arka.holes.push(delik)
  ek(new THREE.ShapeGeometry(arka, 16).translate(0, 0, -0.17), m.ic)
  // Camlar ve doğrama
  const cam = new THREE.PlaneGeometry(PX * 2, P1 - P0).translate(0, (P0 + P1) / 2, -0.165)
  if (fotoVar(m)) ek(hucreyeOtur(cam, CAM_ALT), m.pencereIc)
  else ek(cam, m.koyu)
  const SUT = 4, SIRA = 5
  for (let i = 0; i <= SUT; i++) {
    const t = i === 0 || i === SUT ? 0.09 : i === SUT / 2 ? 0.08 : 0.035
    ek(kutuG(t, P1 - P0 + 0.09, 0.08).translate(-PX + (i * PX * 2) / SUT, (P0 + P1) / 2, -0.12), m.ceviz)
  }
  for (let j = 0; j <= SIRA; j++) {
    const t = j === 0 || j === SIRA ? 0.09 : 0.035
    ek(kutuG(PX * 2 + 0.09, t, 0.08).translate(0, P0 + (j * (P1 - P0)) / SIRA, -0.12), m.ceviz)
  }
  // Pencere üstünde altıgen küçük açıklık
  const altigen = new THREE.CircleGeometry(0.16, 6).rotateZ(Math.PI / 6).translate(0, DUZ + y0 + 0.5, -0.165)
  if (fotoVar(m)) ek(hucreyeOtur(altigen, KAHVE), m.pencereIc)
  else ek(altigen, m.koyu)
  ek(new THREE.TorusGeometry(0.17, 0.02, 4, 6).rotateZ(Math.PI / 6).translate(0, DUZ + y0 + 0.5, -0.16), m.ceviz)
  // Nişin dibi ve kemer halkaları: koyu iç çizgi, krem bant, koyu dış çizgi
  ek(kutuG(G + 0.1, 0.12, 0.3).translate(0, y0 + 0.02, -0.05), m.krem)
  ek(cikar(halka(y0, G, DUZ, YUK, 0.05, false), 0.03, 0.012), m.koyu)
  ek(cikar(halka(y0, G + 0.1, DUZ, YUK + 0.05, 0.1, false), 0.03, 0.006), m.krem)
  ek(cikar(halka(y0, G + 0.3, DUZ, YUK + 0.15, 0.035, false), 0.02, 0.006), m.koyu)
  // Tepelik: kemerin üstünde, kenarı saydam kesilmiş fotoğraf kırpımı
  if (fotoVar(m)) {
    ek(hucreyeOtur(new THREE.PlaneGeometry(TEPELIK_G, TEPELIK_Y).translate(0, y0 + DUZ + TEPELIK_Y / 2, 0.004), TEPELIK), m.pencereIc)
  }
  return yuvarlak(new THREE.Path(), y0, G, DUZ, YUK, cx)
}

/** Vitrinin kuşbakışı izi: çarpışma kutusu (ulucamiIc). */
const VITRIN_G = 4.3, VITRIN_D = 1.2
export const KABE_VITRIN = { x0: YX - DUVAR - VITRIN_D, x1: YX - DUVAR, z0: pz(0.5) - VITRIN_G / 2, z1: pz(0.5) + VITRIN_G / 2 }

/** Kâbe kapısının örtüsü: doğu duvarının dibinde, ışıklı ve geriye eğik vitrin (ERD05018). */
export function kabeVitrini(k: Kova, m: UlucamiMalzemeleri) {
  const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, YX - DUVAR, 0, pz(0.5), -Math.PI / 2), mal)
  const G = VITRIN_G, D = VITRIN_D, AYAK = ZEMIN + 0.35, TEPE = AYAK + 3.2, TEPE_Z = 0.2
  const L = Math.hypot(TEPE - AYAK, D - TEPE_Z), EGIM = Math.atan2(D - TEPE_Z, TEPE - AYAK)
  /** Eğik pano: y panonun boyunca (0 alt kenar), +z yüzü odaya bakar. */
  const pano = (g: THREE.BufferGeometry, mal: Mal) => ek(g.rotateX(-EGIM).translate(0, AYAK, D), mal)

  // Ayak, tepe ve yan duvarlar
  ek(kutuG(G, AYAK - ZEMIN, D).translate(0, (AYAK + ZEMIN) / 2, D / 2), m.krem)
  for (const s of [-1 / 3, 1 / 3]) ek(kutuG(0.012, AYAK - ZEMIN, 0.01).translate(s * G, (AYAK + ZEMIN) / 2, D + 0.002), m.koyu)
  ek(kutuG(G + 0.08, 0.14, TEPE_Z + 0.12).translate(0, TEPE + 0.07, (TEPE_Z + 0.12) / 2), m.krem)
  const yan = new THREE.Shape()
  yan.moveTo(0, AYAK); yan.lineTo(D, AYAK); yan.lineTo(TEPE_Z, TEPE); yan.lineTo(0, TEPE); yan.closePath()
  for (const s of [-1, 1]) ek(cikar(yan, 0.06).rotateY(-Math.PI / 2).translate(s * (G / 2 - 0.03) + 0.03, 0, 0), m.krem)

  // Pano: krem çerçeve, koyu fon, örtü, solda ve altta ışık şeridi
  const C = 0.15
  pano(kutuG(G, C, 0.1).translate(0, C / 2, 0.02), m.krem)
  pano(kutuG(G, C, 0.1).translate(0, L - C / 2, 0.02), m.krem)
  for (const s of [-1, 1]) pano(kutuG(C, L, 0.1).translate(s * (G / 2 - C / 2), L / 2, 0.02), m.krem)
  const fon = new THREE.PlaneGeometry(G - C * 2, L - C * 2).translate(0, L / 2, 0)
  if (fotoVar(m)) pano(hucreyeOtur(fon, CAM), m.pencereIc)
  else pano(fon, m.koyu)
  const ORTU_Y = L - C * 2 - 0.1, ORTU_G = (ORTU_Y * 1400) / 1180, SAG = (G - C * 2 - ORTU_G) / 2 - 0.04
  pano(new THREE.PlaneGeometry(ORTU_G, ORTU_Y).translate(SAG, L / 2, 0.012), m.kabeOrtusu)
  pano(new THREE.PlaneGeometry(0.03, L - C * 2 - 0.04).translate(-G / 2 + C + 0.05, L / 2, 0.014), m.lamba)
  pano(new THREE.PlaneGeometry(G - C * 2, 0.018).translate(0, C + 0.012, 0.016), m.lamba)
}
