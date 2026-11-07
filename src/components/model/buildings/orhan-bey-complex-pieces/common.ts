// Orhan Bey Külliyesi maketinin yapı yardımcıları: yönlü duvar, sivri kemer dizisi, kurşun kubbe, kirpi saçak.
import * as THREE from 'three'
import { Bucket, type Mat, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, uvFit, place } from '../../uluMosquePiece'

/** Geometriyi kovaya koymadan önce yapının yerine kaydırır; her yapı kendi yerel ölçüleriyle çizilir. */
export class LocalBucket extends Bucket {
  x = 0
  z = 0
  add(g: THREE.BufferGeometry, m: Mat) {
    if (this.x || this.z) g.translate(this.x, 0, this.z)
    super.add(g, m)
  }
}

export type Dir = 'K' | 'G' | 'D' | 'B'
export interface Open { p: number; y0: number; g: number; flat: number; kh: number }

/** Yerel +z dışa bakar. Yerel x ekseni K ve D'de dünya ekseninin tersidir. */
function marker(dir: Dir) { return dir === 'K' || dir === 'D' ? -1 : 1 }

export function orient<G extends THREE.BufferGeometry>(g: G, dir: Dir, fixed: number, center: number) {
  if (dir === 'G') return place(g, center, 0, fixed)
  if (dir === 'K') return place(g, center, 0, fixed, Math.PI)
  if (dir === 'D') return place(g, fixed, 0, center, Math.PI / 2)
  return place(g, fixed, 0, center, -Math.PI / 2)
}

/** `sabit`: dış yüzün ekseni; `a..b`: duvar boyunca aralık. Duvar `t` kalınlığında içe doğru çıkar. */
export function wall(kv: Bucket, dir: Dir, fixed: number, a: number, b: number, y0: number, y1: number, t: number, mat: Mat, open: Open[] = []) {
  const m = (a + b) / 2, L = Math.abs(b - a), s = marker(dir)
  const shape = rect(-L / 2, y0, L / 2, y1)
  for (const o of open) shape.holes.push(arch(new THREE.Path(), s * (o.p - m), o.y0, o.g, o.flat, o.kh))
  kv.add(orient(subtract(shape, t, -t), dir, fixed, m), mat)
}

/** Kemer şekilli düzlem: pencere camı, şebeke, kapı yüzü. `derin`: dış yüzden içeri uzaklık. */
export function archPlane(kv: Bucket, dir: Dir, fixed: number, o: Open, deep: number, mat: Mat) {
  const g = uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, o.y0, o.g, o.flat, o.kh), 10))
  kv.add(orient(g.translate(0, 0, -deep), dir, fixed, o.p), mat)
}

/** Kemer eğrisi üzerinde örnekler: kemer() ile aynı ikinci derece eğri. */
function archPoints(o: number, y: number, kh: number, n: number) {
  const point: [number, number, number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    const px = u * u * -o + 2 * u * t * -o
    const py = u * u * y + 2 * u * t * (y + kh * 0.55) + t * t * (y + kh)
    const dx = 2 * u * (-o + o) + 2 * t * (0 + o)
    const dy = 2 * u * (kh * 0.55) + 2 * t * (kh * 0.45)
    const l = Math.hypot(dx, dy) || 1
    point.push([px, py, -dy / l, dx / l])
  }
  return point
}

/** Taş ve tuğlanın sırayla dizildiği kemer yüzü; yüzeyden `cik` kadar dışarı taşar. */
export function archStones(kv: Bucket, dir: Dir, fixed: number, ac: Open, en: number, exit: number, stone: Mat, brick: Mat, count = 11) {
  const o = ac.g / 2, y = ac.y0 + ac.flat, point = archPoints(o, y, ac.kh, count)
  for (const side of [-1, 1]) for (let i = 0; i < count; i++) {
    const [x0, y0, nx0, ny0] = point[i], [x1, y1, nx1, ny1] = point[i + 1]
    const nx = (nx0 + nx1) / 2, ny = (ny0 + ny1) / 2
    const length = Math.hypot(x1 - x0, y1 - y0) * 0.97
    const mx = (x0 + x1) / 2 + nx * en / 2, my = (y0 + y1) / 2 + ny * en / 2
    const angle = Math.atan2(y1 - y0, x1 - x0)
    const b = boxG(length, en, exit).rotateZ(angle).translate(mx, my, exit / 2)
    if (side > 0) b.scale(-1, 1, 1).computeVertexNormals()
    kv.add(orient(b, dir, fixed, ac.p), i % 2 ? brick : stone)
  }
  // Kemer ayakları: yere inen dar şerit
  for (const side of [-1, 1]) {
    const b = boxG(en, Math.max(0.01, ac.flat), exit).translate(side * (o + en / 2), ac.y0 + ac.flat / 2, exit / 2)
    kv.add(orient(b, dir, fixed, ac.p), stone)
  }
}

/** Saçak boyunca iki sıra testere dişi tuğla (kirpi saçak) ve üstte silme. */
export function dentilEave(kv: Bucket, dir: Dir, fixed: number, a: number, b: number, y: number, brick: Mat, top: Mat) {
  const m = (a + b) / 2, L = Math.abs(b - a), step = 0.32
  const count = Math.floor(L / step)
  for (const [row, slip] of [[0, 0], [1, step / 2]] as const) for (let i = 0; i < count; i++) {
    const x = -L / 2 + (i + 0.5) * (L / count) + slip - step / 4
    const outer = boxG(0.19, 0.11, 0.19).rotateY(Math.PI / 4).translate(x, y - 0.5 + row * 0.2, 0.02)
    kv.add(orient(outer, dir, fixed, m), brick)
  }
  kv.add(orient(boxG(L + 0.1, 0.1, 0.32).translate(0, y - 0.1, 0.03), dir, fixed, m), top)
}

/** Çoğu yan yüzeyi saklı dikdörtgen çatı: sekiz değil, tepeye doğru daralan dört yüz. */
export function triangleG(a: number[], b: number[], c: number[], d: number[], scale = 3) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]) / scale, H = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]) / scale
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L, H, 0, 0, L, H, 0, H], 2))
  g.computeVertexNormals()
  return g
}

/** Kurşun kubbe: alta doğru açılan etek, sekizgen ağızdan daireye geçiş, kurşun dikişleri ve alem. */
export function leadDome(kv: Bucket, dome: Mat, finialMat: Mat, cx: number, cz: number, kY: number, R: number, h: number, seam = 24, finial = true, zScale = 1) {
  const OCTA = Math.cos(Math.PI / 8)
  const profile: [number, number][] = [[R * 1.18, -0.24], [R * 1.11, 0], [R * 1.03, h * 0.07]]
  for (let t = 0; t <= 12; t++) {
    const a = (t / 12) * Math.PI / 2
    profile.push([Math.max(R * Math.pow(Math.cos(a), 0.86), 0.002), h * 0.07 + h * 0.93 * Math.pow(Math.sin(a), 1.08)])
  }
  const PIECE = 4
  const g = rotateG(profile, seam * PIECE, [1, 1])
  const uv = g.attributes.uv, pose = g.attributes.position
  for (let v = 0; v < pose.count; v++) {
    const vx = pose.getX(v), vy = pose.getY(v), vz = pose.getZ(v)
    const b = 1 - THREE.MathUtils.smoothstep(vy, 0, h * 0.34)
    const theta = Math.atan2(vx, vz), piece = Math.PI / 4
    const diff = ((theta + Math.PI * 2 + piece / 2) % piece) - piece / 2
    const ratio = b > 0 ? THREE.MathUtils.lerp(1, (OCTA / Math.cos(diff)) * 1.04, b) : 1
    const r = Math.hypot(vx, vz)
    const hasSeam = Math.round(uv.getX(v) * seam * PIECE) % PIECE === 0
    const bump = hasSeam && r > 0.2 ? 1 + 0.05 / r : 1
    pose.setX(v, vx * ratio * bump); pose.setZ(v, vz * ratio * bump)
  }
  g.scale(1, 1, zScale)
  g.computeVertexNormals()
  kv.add(place(g, cx, kY, cz), dome)
  if (finial) {
    const a = R * 0.09
    const p: [number, number][] = [[a, 0], [a * 0.4, a * 0.8], [a * 0.9, a * 1.8], [a * 0.3, a * 2.8], [a * 0.7, a * 3.6], [0.015, a * 5.6], [0, a * 6]]
    kv.add(place(rotateG(p, 10), cx, kY + h - 0.06, cz), finialMat)
  }
}

/** Dış sekizgen kasnak; `zOlcek` oval planlı odalar içindir. */
export function outerDrum(kv: Bucket, mat: Mat, molding: Mat, cx: number, cz: number, y0: number, y1: number, R: number, zScale = 1) {
  const g = flatShadow(cylinderG(R, R, y1 - y0, 8, true).rotateY(Math.PI / 8))
  kv.add(place(g.scale(1, 1, zScale), cx, (y0 + y1) / 2, cz), mat)
  const top = flatShadow(cylinderG(R + 0.14, R + 0.14, 0.24, 8, true).rotateY(Math.PI / 8))
  kv.add(place(top.scale(1, 1, zScale), cx, y1 - 0.1, cz), molding)
}

/** Dikdörtgen tabandan daireye geçiş: Türk üçgeni ve tromp bölgesini tek yüzeyle temsil eder. u çevre, v yukarı. */
export function transitionG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, Rx: number, Rz: number) {
  const SEG = 64, ROW = 8
  const position: number[] = [], uv: number[] = [], index: number[] = []
  for (let s = 0; s <= ROW; s++) {
    const t = s / ROW, e = Math.pow(t, 0.78)
    for (let a = 0; a <= SEG; a++) {
      const theta = (a / SEG) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
      const far = Math.min(dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity, dz > 0 ? (z1 - cz) / dz : dz < 0 ? (z0 - cz) / dz : Infinity)
      const circle = 1 / Math.hypot(dx / Rx, dz / Rz)
      const r = THREE.MathUtils.lerp(far, circle, e)
      position.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / SEG, t)
    }
  }
  for (let s = 0; s < ROW; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    index.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** İç kubbe: v kenardan tepeye. */
export function innerDome(kv: Bucket, mat: Mat, cx: number, cz: number, y: number, Rx: number, Rz: number, h: number) {
  const profile: [number, number][] = []
  for (let t = 0; t <= 16; t++) {
    const a = (t / 16) * Math.PI / 2
    profile.push([Math.max(Math.pow(Math.cos(a), 0.9), 0.002), h * Math.pow(Math.sin(a), 1.05)])
  }
  const g = rotateG(profile, 56, [1, 1]).scale(Rx, 1, Rz)
  g.computeVertexNormals()
  kv.add(place(g, cx, y, cz), mat)
}

/** Yuvarlak ve yapraklı basit ağaç; yerel gürültüyle düzgün küre görünümünden çıkar. */
export function tree(kv: Bucket, body: Mat, leaf: Mat, x: number, z: number, length: number, R: number) {
  kv.add(place(cylinderG(R * 0.1, R * 0.16, length * 0.55, 8), x, length * 0.275, z), body)
  for (const [ox, oy, oz, o] of [[0, 0.62, 0, 1], [0.45, 0.72, 0.2, 0.7], [-0.4, 0.7, -0.25, 0.72], [0.1, 0.9, -0.15, 0.62]] as const) {
    const g = new THREE.IcosahedronGeometry(R * o, 2)
    const p = g.attributes.position, t = x * 0.31 + z * 0.17 + ox * 5
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i)
      const n = 1 + 0.1 * Math.sin((vx * 5.1) / R + t) * Math.cos((vz * 4.3 + vy * 3.7) / R - t) + 0.07 * Math.sin((vy * 11 + vx * 9) / R)
      p.setXYZ(i, vx * n, vy * n * 0.86, vz * n)
    }
    g.computeVertexNormals()
    kv.add(g.translate(x + ox * R, length * oy, z + oz * R), leaf)
  }
}
