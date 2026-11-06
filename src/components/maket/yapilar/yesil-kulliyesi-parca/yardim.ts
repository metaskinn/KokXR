// Yeşil Külliyesi maketinin geometri yardımcıları: boşluklu duvar, yüzey kaplaması, prizma ve geçiş kuşağı.
import * as THREE from 'three'
import { Kova, cikar, dikdortgen, kemer, type Mal } from '../../ulucamiParca'

/** Duvar boşluğu: `u` duvar başlangıcından metre; `kemerH` varsa sivri, `bursa` ise basık Bursa kemeri. */
export interface Bosluk { u0: number; u1: number; y0: number; y1: number; kemerH?: number; bursa?: boolean }

/** Bursa kemeri: düşey ayaklar, kısa eğri omuz ve neredeyse düz üst. */
export function bursaKemeri<P extends THREE.Path>(p: P, u0: number, u1: number, y0: number, ayak: number, kemerH: number): P {
  const g = u1 - u0, y = y0 + ayak
  p.moveTo(u0, y0)
  p.lineTo(u0, y)
  p.quadraticCurveTo(u0, y + kemerH * 0.82, u0 + g * 0.22, y + kemerH * 0.9)
  p.lineTo(u1 - g * 0.22, y + kemerH * 0.9)
  p.quadraticCurveTo(u1, y + kemerH * 0.82, u1, y)
  p.lineTo(u1, y0)
  p.closePath()
  return p
}

function bosluga<P extends THREE.Path>(p: P, b: Bosluk): P {
  if (b.bursa) return bursaKemeri(p, b.u0, b.u1, b.y0, b.y1 - b.y0, b.kemerH ?? 2)
  if (b.kemerH) return kemer(p, (b.u0 + b.u1) / 2, b.y0, b.u1 - b.u0, b.y1 - b.y0, b.kemerH)
  p.moveTo(b.u0, b.y0); p.lineTo(b.u1, b.y0); p.lineTo(b.u1, b.y1); p.lineTo(b.u0, b.y1); p.closePath()
  return p
}

/** a→b doğrultusundaki yerel düzlemi dünyaya taşır; yerel +z, a→b'nin solundaki yöne (-dz, dx) bakar. */
export function hizala<G extends THREE.BufferGeometry>(g: G, ax: number, az: number, bx: number, bz: number) {
  g.rotateY(Math.atan2(-(bz - az), bx - ax))
  g.translate(ax, 0, az)
  return g
}

/** Kalın duvar: a→b hattından başlayıp normal yönünde `t` kalınlığında. */
export function duvar(k: Kova, ax: number, az: number, bx: number, bz: number, t: number, y0: number, y1: number, mal: Mal, bosluklar: Bosluk[] = []) {
  const L = Math.hypot(bx - ax, bz - az)
  const s = dikdortgen(0, y0, L, y1)
  for (const b of bosluklar) s.holes.push(bosluga(new THREE.Path(), b))
  k.ekle(hizala(cikar(s, t), ax, az, bx, bz), mal)
}

/** İnce kaplama yüzeyi: normal a→b'nin soluna bakar. UV metre cinsindendir. */
export function yuzey(k: Kova, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, mal: Mal, bosluklar: Bosluk[] = [], kayma = 0.015) {
  const L = Math.hypot(bx - ax, bz - az)
  const s = dikdortgen(0, y0, L, y1)
  for (const b of bosluklar) s.holes.push(bosluga(new THREE.Path(), b))
  k.ekle(hizala(new THREE.ShapeGeometry(s, 10).translate(0, 0, kayma), ax, az, bx, bz), mal)
}

/** Yatay bant kaplaması: dokunun yüksekliği bandın yüksekliğine oturur, u ekseninde `tekrarM` metrede tekrarlar. */
export function bant(k: Kova, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, mal: Mal, tekrarM = 1, kayma = 0.02) {
  const L = Math.hypot(bx - ax, bz - az)
  const g = new THREE.PlaneGeometry(L, y1 - y0).translate(L / 2, (y0 + y1) / 2, kayma)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tekrarM, (p.getY(i) - y0) / (y1 - y0))
  k.ekle(hizala(g, ax, az, bx, bz), mal)
}

/** Yerel düzlemde kemer biçimli tek parça levha; doku levhaya bir kez oturur. */
export function levha(k: Kova, s: THREE.Shape, ax: number, az: number, bx: number, bz: number, mal: Mal, kalinlik = 0, kayma = 0.02, sigdir = true) {
  const g = kalinlik ? cikar(s, kalinlik, kayma) : new THREE.ShapeGeometry(s, 12).translate(0, 0, kayma)
  if (sigdir) {
    g.computeBoundingBox()
    const b = g.boundingBox!, p = g.attributes.position, uv = g.attributes.uv
    const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / w, (p.getY(i) - b.min.y) / h)
  }
  k.ekle(hizala(g, ax, az, bx, bz), mal)
}

/** Kapalı çokgen tabanlı açık prizma; yanlar dışa bakar, UV metre cinsindendir. */
export function prizma(noktalar: [number, number][], y0: number, y1: number, ic = false) {
  const konum: number[] = [], uv: number[] = []
  let u = 0
  const n = noktalar.length
  for (let i = 0; i < n; i++) {
    const [ax, az] = noktalar[i], [bx, bz] = noktalar[(i + 1) % n]
    const L = Math.hypot(bx - ax, bz - az)
    const A = [ax, y0, az], B = [bx, y0, bz], C = [bx, y1, bz], D = [ax, y1, az]
    const uA = [u, y0], uB = [u + L, y0], uC = [u + L, y1], uD = [u, y1]
    const tri = ic ? [A, B, C, A, C, D] : [A, C, B, A, D, C]
    const tuv = ic ? [uA, uB, uC, uA, uC, uD] : [uA, uC, uB, uA, uD, uC]
    tri.forEach((p) => konum.push(...p))
    tuv.forEach((p) => uv.push(...p))
    u += L
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Düzgün çokgen köşeleri; `don` radyan, ilk köşe +z yönünden başlar. Köşeler saat yönünde (yukarıdan) dizilir. */
export const cokgen = (n: number, r: number, cx = 0, cz = 0, don = Math.PI / n): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = don + (i / n) * Math.PI * 2
    return [cx + Math.sin(a) * r, cz + Math.cos(a) * r] as [number, number]
  })

/** Köşeleri pahlı kare (kuşbakışı): kubbe kasnaklarının gövdesi. */
export const pahliKare = (cx: number, cz: number, y: number, pah: number): [number, number][] => [
  [cx - y + pah, cz + y], [cx + y - pah, cz + y], [cx + y, cz + y - pah], [cx + y, cz - y + pah],
  [cx + y - pah, cz - y], [cx - y + pah, cz - y], [cx - y, cz - y + pah], [cx - y, cz + y - pah],
]

/** Çokgen halka kapağı (dış çokgen → iç daire), üstten görünür. */
export function halka(noktalar: [number, number][], r: number, cx: number, cz: number, y: number) {
  const s = new THREE.Shape()
  noktalar.forEach(([x, z], i) => (i ? s.lineTo(x - cx, -(z - cz)) : s.moveTo(x - cx, -(z - cz))))
  s.closePath()
  s.holes.push(new THREE.Path().absarc(0, 0, r, 0, Math.PI * 2, true))
  return new THREE.ShapeGeometry(s, 32).rotateX(-Math.PI / 2).translate(cx, y, cz)
}

/**
 * Kare mekândan daire ağza geçen kuşak; `dilim` köşeli yüzler Türk üçgeni izlenimi verir. İçten görünür.
 * UV: u çevre (0–1), v alttan üste (0–1).
 */
export function gecisKusagi(cx: number, cz: number, ax: number, az: number, y0: number, y1: number, R: number, dilim = 16) {
  const konum: number[] = [], uv: number[] = []
  const nokta = (i: number, ust: boolean) => {
    const a = (i / dilim) * Math.PI * 2 + Math.PI / dilim
    const dx = Math.sin(a), dz = Math.cos(a)
    if (ust) return [cx + dx * R, y1, cz + dz * R]
    const u = Math.min(ax / Math.abs(dx || 1e-6), az / Math.abs(dz || 1e-6))
    return [cx + dx * u, y0, cz + dz * u]
  }
  for (let i = 0; i < dilim; i++) {
    const A = nokta(i, false), B = nokta(i + 1, false), C = nokta(i, true), D = nokta(i + 1, true)
    const u0 = i / dilim, u1 = (i + 1) / dilim
    konum.push(...A, ...C, ...B, ...B, ...C, ...D)
    uv.push(u0, 0, u0, 1, u1, 0, u1, 0, u0, 1, u1, 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Basit dörtgen: köşe sırası saat yönünün tersi (normal yukarı). */
export function dortgen(a: number[], b: number[], c: number[], d: number[], olcek = 1) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
  const u = (p: number[]) => [p[0] / olcek, p[2] / olcek]
  g.setAttribute('uv', new THREE.Float32BufferAttribute([...u(a), ...u(b), ...u(c), ...u(a), ...u(c), ...u(d)], 2))
  g.computeVertexNormals()
  return g
}

/**
 * Kırma çatı: dikdörtgenin kenarlarından `perde` eğimiyle mahyaya yükselir.
 * UV: yatay metre ve eğim metresi; kiremit sıraları saçağa paralel kalır.
 */
export function kirmaCati(x0: number, x1: number, z0: number, z1: number, y: number, yuk: number) {
  const dar = Math.min(x1 - x0, z1 - z0) / 2
  const konum: number[] = [], uv: number[] = []
  const X0 = x0 + dar, X1 = x1 - dar, Z0 = z0 + dar, Z1 = z1 - dar
  const ek = (a: number[], b: number[], c: number[], ua: number[], ub: number[], uc: number[]) => { konum.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc) }
  const egim = Math.hypot(dar, yuk), T = y + yuk
  const yuz = (a0: number[], a1: number[], b1: number[], b0: number[]) => {
    const L = Math.hypot(a1[0] - a0[0], a1[2] - a0[2])
    const k = Math.hypot(b0[0] - a0[0], b0[2] - a0[2])
    const yatay = Math.sqrt(Math.max(0, k * k - dar * dar))
    const L2 = Math.hypot(b1[0] - b0[0], b1[2] - b0[2])
    const u0 = [0, 0], u1 = [L, 0], v1 = [yatay + L2, egim], v0 = [yatay, egim]
    ek(a0, a1, b1, u0, u1, v1)
    if (L2 > 0.001) ek(a0, b1, b0, u0, v1, v0)
  }
  yuz([x0, y, z1], [x1, y, z1], [X1, T, Z1], [X0, T, Z1])
  yuz([x1, y, z0], [x0, y, z0], [X0, T, Z0], [X1, T, Z0])
  yuz([x1, y, z1], [x1, y, z0], [X1, T, Z0], [X1, T, Z1])
  yuz([x0, y, z0], [x0, y, z1], [X0, T, Z1], [X0, T, Z0])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}
