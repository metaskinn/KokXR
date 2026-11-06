// Orhan Bey Külliyesi maketinin yapı yardımcıları: yönlü duvar, sivri kemer dizisi, kurşun kubbe, kirpi saçak.
import * as THREE from 'three'
import { Kova, type Mal, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, uvSigdir, yer } from '../../ulucamiParca'

/** Geometriyi kovaya koymadan önce yapının yerine kaydırır; her yapı kendi yerel ölçüleriyle çizilir. */
export class YerliKova extends Kova {
  x = 0
  z = 0
  ekle(g: THREE.BufferGeometry, m: Mal) {
    if (this.x || this.z) g.translate(this.x, 0, this.z)
    super.ekle(g, m)
  }
}

export type Yon = 'K' | 'G' | 'D' | 'B'
export interface Acik { p: number; y0: number; g: number; duz: number; kh: number }

/** Yerel +z dışa bakar. Yerel x ekseni K ve D'de dünya ekseninin tersidir. */
function isaret(yon: Yon) { return yon === 'K' || yon === 'D' ? -1 : 1 }

export function yonla<G extends THREE.BufferGeometry>(g: G, yon: Yon, sabit: number, merkez: number) {
  if (yon === 'G') return yer(g, merkez, 0, sabit)
  if (yon === 'K') return yer(g, merkez, 0, sabit, Math.PI)
  if (yon === 'D') return yer(g, sabit, 0, merkez, Math.PI / 2)
  return yer(g, sabit, 0, merkez, -Math.PI / 2)
}

/** `sabit`: dış yüzün ekseni; `a..b`: duvar boyunca aralık. Duvar `t` kalınlığında içe doğru çıkar. */
export function duvar(kv: Kova, yon: Yon, sabit: number, a: number, b: number, y0: number, y1: number, t: number, mal: Mal, acik: Acik[] = []) {
  const m = (a + b) / 2, L = Math.abs(b - a), s = isaret(yon)
  const sekil = dikdortgen(-L / 2, y0, L / 2, y1)
  for (const o of acik) sekil.holes.push(kemer(new THREE.Path(), s * (o.p - m), o.y0, o.g, o.duz, o.kh))
  kv.ekle(yonla(cikar(sekil, t, -t), yon, sabit, m), mal)
}

/** Kemer şekilli düzlem: pencere camı, şebeke, kapı yüzü. `derin`: dış yüzden içeri uzaklık. */
export function kemerDuzlem(kv: Kova, yon: Yon, sabit: number, o: Acik, derin: number, mal: Mal) {
  const g = uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, o.y0, o.g, o.duz, o.kh), 10))
  kv.ekle(yonla(g.translate(0, 0, -derin), yon, sabit, o.p), mal)
}

/** Kemer eğrisi üzerinde örnekler: kemer() ile aynı ikinci derece eğri. */
function kemerNoktalari(o: number, y: number, kh: number, n: number) {
  const nokta: [number, number, number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    const px = u * u * -o + 2 * u * t * -o
    const py = u * u * y + 2 * u * t * (y + kh * 0.55) + t * t * (y + kh)
    const dx = 2 * u * (-o + o) + 2 * t * (0 + o)
    const dy = 2 * u * (kh * 0.55) + 2 * t * (kh * 0.45)
    const l = Math.hypot(dx, dy) || 1
    nokta.push([px, py, -dy / l, dx / l])
  }
  return nokta
}

/** Taş ve tuğlanın sırayla dizildiği kemer yüzü; yüzeyden `cik` kadar dışarı taşar. */
export function kemerTaslari(kv: Kova, yon: Yon, sabit: number, ac: Acik, en: number, cik: number, tas: Mal, tugla: Mal, adet = 11) {
  const o = ac.g / 2, y = ac.y0 + ac.duz, nokta = kemerNoktalari(o, y, ac.kh, adet)
  for (const yan of [-1, 1]) for (let i = 0; i < adet; i++) {
    const [x0, y0, nx0, ny0] = nokta[i], [x1, y1, nx1, ny1] = nokta[i + 1]
    const nx = (nx0 + nx1) / 2, ny = (ny0 + ny1) / 2
    const boy = Math.hypot(x1 - x0, y1 - y0) * 0.97
    const mx = (x0 + x1) / 2 + nx * en / 2, my = (y0 + y1) / 2 + ny * en / 2
    const aci = Math.atan2(y1 - y0, x1 - x0)
    const b = kutuG(boy, en, cik).rotateZ(aci).translate(mx, my, cik / 2)
    if (yan > 0) b.scale(-1, 1, 1).computeVertexNormals()
    kv.ekle(yonla(b, yon, sabit, ac.p), i % 2 ? tugla : tas)
  }
  // Kemer ayakları: yere inen dar şerit
  for (const yan of [-1, 1]) {
    const b = kutuG(en, Math.max(0.01, ac.duz), cik).translate(yan * (o + en / 2), ac.y0 + ac.duz / 2, cik / 2)
    kv.ekle(yonla(b, yon, sabit, ac.p), tas)
  }
}

/** Saçak boyunca iki sıra testere dişi tuğla (kirpi saçak) ve üstte silme. */
export function kirpiSacak(kv: Kova, yon: Yon, sabit: number, a: number, b: number, y: number, tugla: Mal, ust: Mal) {
  const m = (a + b) / 2, L = Math.abs(b - a), adim = 0.32
  const adet = Math.floor(L / adim)
  for (const [sira, kayma] of [[0, 0], [1, adim / 2]] as const) for (let i = 0; i < adet; i++) {
    const x = -L / 2 + (i + 0.5) * (L / adet) + kayma - adim / 4
    const dis = kutuG(0.19, 0.11, 0.19).rotateY(Math.PI / 4).translate(x, y - 0.5 + sira * 0.2, 0.02)
    kv.ekle(yonla(dis, yon, sabit, m), tugla)
  }
  kv.ekle(yonla(kutuG(L + 0.1, 0.1, 0.32).translate(0, y - 0.1, 0.03), yon, sabit, m), ust)
}

/** Çoğu yan yüzeyi saklı dikdörtgen çatı: sekiz değil, tepeye doğru daralan dört yüz. */
export function ucgenG(a: number[], b: number[], c: number[], d: number[], olcek = 3) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]) / olcek, H = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]) / olcek
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L, H, 0, 0, L, H, 0, H], 2))
  g.computeVertexNormals()
  return g
}

/** Kurşun kubbe: alta doğru açılan etek, sekizgen ağızdan daireye geçiş, kurşun dikişleri ve alem. */
export function kursunKubbe(kv: Kova, kubbe: Mal, alemMal: Mal, cx: number, cz: number, kY: number, R: number, h: number, dikis = 24, alem = true) {
  const OCTA = Math.cos(Math.PI / 8)
  const profil: [number, number][] = [[R * 1.18, -0.24], [R * 1.11, 0], [R * 1.03, h * 0.07]]
  for (let t = 0; t <= 12; t++) {
    const a = (t / 12) * Math.PI / 2
    profil.push([Math.max(R * Math.pow(Math.cos(a), 0.86), 0.002), h * 0.07 + h * 0.93 * Math.pow(Math.sin(a), 1.08)])
  }
  const PARCA = 4
  const g = dondurG(profil, dikis * PARCA, [1, 1])
  const uv = g.attributes.uv, poz = g.attributes.position
  for (let v = 0; v < poz.count; v++) {
    const vx = poz.getX(v), vy = poz.getY(v), vz = poz.getZ(v)
    const b = 1 - THREE.MathUtils.smoothstep(vy, 0, h * 0.34)
    const teta = Math.atan2(vx, vz), parca = Math.PI / 4
    const fark = ((teta + Math.PI * 2 + parca / 2) % parca) - parca / 2
    const oran = b > 0 ? THREE.MathUtils.lerp(1, (OCTA / Math.cos(fark)) * 1.04, b) : 1
    const r = Math.hypot(vx, vz)
    const dikisVar = Math.round(uv.getX(v) * dikis * PARCA) % PARCA === 0
    const kabarti = dikisVar && r > 0.2 ? 1 + 0.05 / r : 1
    poz.setX(v, vx * oran * kabarti); poz.setZ(v, vz * oran * kabarti)
  }
  g.computeVertexNormals()
  kv.ekle(yer(g, cx, kY, cz), kubbe)
  if (alem) {
    const a = R * 0.09
    const p: [number, number][] = [[a, 0], [a * 0.4, a * 0.8], [a * 0.9, a * 1.8], [a * 0.3, a * 2.8], [a * 0.7, a * 3.6], [0.015, a * 5.6], [0, a * 6]]
    kv.ekle(yer(dondurG(p, 10), cx, kY + h - 0.06, cz), alemMal)
  }
}

/** Dış sekizgen kasnak; `zOlcek` oval planlı odalar içindir. */
export function disKasnak(kv: Kova, mal: Mal, silme: Mal, cx: number, cz: number, y0: number, y1: number, R: number, zOlcek = 1) {
  const g = duzGolge(silindirG(R, R, y1 - y0, 8, true).rotateY(Math.PI / 8))
  kv.ekle(yer(g.scale(1, 1, zOlcek), cx, (y0 + y1) / 2, cz), mal)
  const ust = duzGolge(silindirG(R + 0.14, R + 0.14, 0.24, 8).rotateY(Math.PI / 8))
  kv.ekle(yer(ust.scale(1, 1, zOlcek), cx, y1 - 0.1, cz), silme)
}

/** Dikdörtgen tabandan daireye geçiş: Türk üçgeni ve tromp bölgesini tek yüzeyle temsil eder. u çevre, v yukarı. */
export function gecisG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, Rx: number, Rz: number) {
  const SEG = 64, SIRA = 8
  const konum: number[] = [], uv: number[] = [], dizin: number[] = []
  for (let s = 0; s <= SIRA; s++) {
    const t = s / SIRA, e = Math.pow(t, 0.78)
    for (let a = 0; a <= SEG; a++) {
      const teta = (a / SEG) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
      const uzak = Math.min(dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity, dz > 0 ? (z1 - cz) / dz : dz < 0 ? (z0 - cz) / dz : Infinity)
      const daire = 1 / Math.hypot(dx / Rx, dz / Rz)
      const r = THREE.MathUtils.lerp(uzak, daire, e)
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

/** İç kubbe: v kenardan tepeye. */
export function icKubbe(kv: Kova, mal: Mal, cx: number, cz: number, y: number, Rx: number, Rz: number, h: number) {
  const profil: [number, number][] = []
  for (let t = 0; t <= 16; t++) {
    const a = (t / 16) * Math.PI / 2
    profil.push([Math.max(Math.pow(Math.cos(a), 0.9), 0.002), h * Math.pow(Math.sin(a), 1.05)])
  }
  const g = dondurG(profil, 56, [1, 1]).scale(Rx, 1, Rz)
  g.computeVertexNormals()
  kv.ekle(yer(g, cx, y, cz), mal)
}

/** Yuvarlak ve yapraklı basit ağaç; yerel gürültüyle düzgün küre görünümünden çıkar. */
export function agac(kv: Kova, govde: Mal, yaprak: Mal, x: number, z: number, boy: number, R: number) {
  kv.ekle(yer(silindirG(R * 0.1, R * 0.16, boy * 0.55, 8), x, boy * 0.275, z), govde)
  for (const [ox, oy, oz, o] of [[0, 0.62, 0, 1], [0.45, 0.72, 0.2, 0.7], [-0.4, 0.7, -0.25, 0.72], [0.1, 0.9, -0.15, 0.62]] as const) {
    const g = new THREE.IcosahedronGeometry(R * o, 1)
    const p = g.attributes.position, t = x * 0.31 + z * 0.17 + ox * 5
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i)
      const n = 1 + 0.16 * Math.sin(vx * 2.1 + t) * Math.cos(vz * 2.3 + vy * 1.7 - t)
      p.setXYZ(i, vx * n, vy * n * 0.86, vz * n)
    }
    g.computeVertexNormals()
    kv.ekle(g.translate(x + ox * R, boy * oy, z + oz * R), yaprak)
  }
}
