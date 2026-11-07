// Ulu Camii's immediate surroundings: paving, rough stone plinth, trees, garden. Textures are generated in code.
// The layout is read from drone frames in the archive (DJI_..._0228 top view, _0291 north facade, dis-gorunum.jpg):
// the single large cypress and plane tree in the north courtyard, the square with pergolas and lawn to the east, the green row in front of the south wall.
// Positions are approximate to a few meters, tree forms are representative; the surrounding urban fabric is deliberately left out.
import * as THREE from 'three'
import { DOOR_Z } from '../uluMosqueDetail'
import { type uluMosqueMaterials } from '../uluMosqueTextures'
import { Bucket, YX, YZ, rotateG, boxG, cylinderG, place } from '../uluMosquePiece'
import { lightDevice, random } from '../uluMosqueFloor'

type Color = [number, number, number]
const PEDESTAL_R = 70
const cluster = (a: number, b: number, t: number) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u) }
const rectFar = (x: number, z: number, cx: number, cz: number, hx: number, hz: number) => {
  const dx = Math.abs(x - cx) - hx, dz = Math.abs(z - cz) - hz
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0)
}

// Atlas regions (u0, v0, u1, v1). A small margin is left at the edges to prevent bleeding.
const B_BRANCH1 = [0.005, 0.505, 0.495, 0.995], B_BRANCH2 = [0.505, 0.505, 0.995, 0.995]
const B_SAPLING = [0.005, 0.255, 0.495, 0.495], B_BARK = [0.01, 0.01, 0.49, 0.24]
const B_GRASS = [0.53, 0.28, 0.97, 0.47], B_LEAF = [0.54, 0.035, 0.96, 0.215]

function repeated(el: HTMLCanvasElement, meter: number) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / meter, 1 / meter)
  t.anisotropy = 16
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** The yellowish-brown, small, rectangular cut stone from the photos; the courses tile seamlessly. */
function pavingTexture() {
  const B = lightDevice() ? 1024 : 2048, M = 8, o = B / M
  const el = document.createElement('canvas'); el.width = el.height = B
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas is not available')
  const r = random(211)
  c.fillStyle = '#574c3e'; c.fillRect(0, 0, B, B)
  let y = 0
  for (let row = 0; row < 20; row++) {
    const h = row % 2 ? 0.48 : 0.32, head = r() * 0.7
    let x = head
    while (x < head + M - 0.01) {
      let u = 0.42 + r() * 0.5
      if (head + M - (x + u) < 0.4) u = head + M - x
      const tone = 30 + r() * 8, doy = 14 + r() * 8, ac = 44 + r() * 8
      for (const k of [x, x - M]) {
        const px = k * o + 0.018 * o, py = y * o + 0.018 * o, pw = (u - 0.036) * o, ph = (h - 0.036) * o
        c.fillStyle = `hsl(${tone} ${doy}% ${ac}%)`; c.fillRect(px, py, pw, ph)
        c.fillStyle = 'rgba(255,240,215,0.16)'; c.fillRect(px, py, pw, 0.012 * o)
        c.fillStyle = 'rgba(40,28,16,0.22)'; c.fillRect(px, py + ph - 0.016 * o, pw, 0.016 * o)
      }
      x += u
    }
    y += h
  }
  // Wear: fine speckles save the stone from looking flat-colored.
  const point = B * B / 110
  for (let i = 0; i < point; i++) {
    const a = r(), s = 1 + r() * (B / 1024) * 2.2
    c.fillStyle = a > 0.45 ? `rgba(35,25,15,${r() * 0.17})` : `rgba(255,240,215,${r() * 0.13})`
    c.fillRect(r() * B, r() * B, s, s)
  }
  return repeated(el, M)
}

/** A single atlas: bare plane-tree branches, leaf cluster, plane bark, grass and dark needles. */
function treeAtlas() {
  const B = lightDevice() ? 1024 : 2048
  const el = document.createElement('canvas'); el.width = el.height = B
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas is not available')
  c.scale(B / 1024, B / 1024)
  const r = random(307)
  c.lineCap = 'round'

  // Branch cards: thin branches with remaining yellow-brown leaves (December frames).
  const branchCard = (ox: number, leafRatio: number) => {
    c.save(); c.beginPath(); c.rect(ox + 4, 4, 504, 504); c.clip()
    const branch = (x: number, y: number, a: number, u: number, k: number, s: number) => {
      const x2 = x + Math.sin(a) * u, y2 = y - Math.cos(a) * u
      c.strokeStyle = `hsl(${24 + r() * 10} 13% ${22 + s * 3}%)`; c.lineWidth = k
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2 + (r() - 0.5) * u * 0.3, (y + y2) / 2, x2, y2); c.stroke()
      if (s >= 4 && r() < leafRatio) {
        c.fillStyle = `hsl(${22 + r() * 20} ${34 + r() * 26}% ${24 + r() * 18}%)`
        c.beginPath(); c.ellipse(x2 + (r() - 0.5) * 10, y2 + (r() - 0.5) * 10, 4 + r() * 3.5, 2.6 + r() * 2.4, r() * 3, 0, Math.PI * 2); c.fill()
      }
      if (s >= 7 || x2 < ox + 8 || x2 > ox + 504 || y2 < 8) return
      const n = s < 2 ? 3 : 2 + (r() < 0.5 ? 1 : 0)
      for (let i = 0; i < n; i++) branch(x2, y2, a + (i - (n - 1) / 2) * (0.5 + r() * 0.5) + (r() - 0.5) * 0.3, u * (0.7 + r() * 0.14), Math.max(2.3, k * 0.7), s + 1)
    }
    branch(ox + 256, 506, (r() - 0.5) * 0.2, 104, 9, 0)
    c.restore()
  }
  branchCard(0, 0.06)
  branchCard(512, 0.2)

  // Needle foliage cluster: irregular, holey edge; the card itself is not visible.
  c.save(); c.beginPath(); c.rect(4, 516, 504, 248); c.clip()
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6), ox = 256 + Math.cos(a) * d * 215, oy = 640 + Math.sin(a) * d * 90
    const tone = 132 + r() * 30, sat = 13 + r() * 13, ac = 9 + r() * 15
    for (let n = 0; n < 34; n++) {
      const yy = r(), g = (1 - yy) * 15 + 3
      c.fillStyle = `hsl(${tone + r() * 8} ${sat}% ${(ac + r() * 11).toFixed(1)}%)`
      c.beginPath(); c.ellipse(ox + (r() - 0.5) * g * 2, oy + 26 - yy * 62, 1.1 + r() * 1.6, 5 + r() * 11, (r() - 0.5) * 0.7, 0, Math.PI * 2); c.fill()
    }
  }
  c.restore()

  // Plane bark: cream, olive and brown patches.
  c.fillStyle = '#7d7363'; c.fillRect(0, 768, 512, 256)
  c.save(); c.beginPath(); c.rect(0, 768, 512, 256); c.clip()
  for (let i = 0; i < 900; i++) {
    const a = r()
    c.fillStyle = a < 0.4 ? `hsl(${34 + r() * 14} ${12 + r() * 10}% ${48 + r() * 12}%)` : a < 0.75 ? `hsl(${50 + r() * 18} ${8 + r() * 10}% ${36 + r() * 10}%)` : `hsl(${24 + r() * 10} ${16 + r() * 10}% ${26 + r() * 10}%)`
    c.beginPath(); c.ellipse(r() * 512, 768 + r() * 256, 5 + r() * 28, 5 + r() * 15, r() * 3, 0, Math.PI * 2); c.fill()
  }
  c.restore()

  // Grass: light grey-green; the actual color comes from vertex paint.
  c.fillStyle = '#b7b9a4'; c.fillRect(512, 512, 512, 256)
  for (let i = 0; i < 14000; i++) {
    const a = r()
    c.fillStyle = a > 0.5 ? `rgba(35,50,20,${0.1 + r() * 0.22})` : `rgba(235,240,195,${0.08 + r() * 0.2})`
    c.fillRect(512 + r() * 512, 512 + r() * 256, 1.5 + r() * 2, 2 + r() * 6)
  }

  // The tree's closed mass: dark and deep; its top comes from the cards.
  c.fillStyle = '#121c17'; c.fillRect(512, 768, 512, 256)
  for (let i = 0; i < 3400; i++) {
    const a = r()
    c.fillStyle = `hsl(${132 + a * 30} ${13 + a * 13}% ${(7 + a * 20).toFixed(1)}%)`
    c.beginPath(); c.ellipse(512 + r() * 512, 768 + r() * 256, 1.5 + r() * 3, 7 + r() * 11, (r() - 0.5) * 1.4, 0, Math.PI * 2); c.fill()
  }

  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Triangle stack: accumulates the tree body and cards in a single geometry. */
class Stack {
  position: number[] = []; normal: number[] = []; uv: number[] = []; color: number[] = []
  corner(p: THREE.Vector3, n: THREE.Vector3, u: number, v: number, c: Color) {
    this.position.push(p.x, p.y, p.z); this.normal.push(n.x, n.y, n.z); this.uv.push(u, v); this.color.push(c[0], c[1], c[2])
  }
  quad(a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, e: THREE.Vector3, na: THREE.Vector3, nb: THREE.Vector3, nd: THREE.Vector3, ne: THREE.Vector3, uv: number[][], c: Color, c2 = c) {
    this.corner(a, na, uv[0][0], uv[0][1], c); this.corner(b, nb, uv[1][0], uv[1][1], c); this.corner(d, nd, uv[2][0], uv[2][1], c2)
    this.corner(a, na, uv[0][0], uv[0][1], c); this.corner(d, nd, uv[2][0], uv[2][1], c2); this.corner(e, ne, uv[3][0], uv[3][1], c2)
  }
  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.position, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normal, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.color, 3))
    return g
  }
}

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

/** A card oriented bottom to top: edge `right`, height `top`; the normal faces outward for lighting. */
function card(Y: Stack, base: THREE.Vector3, right: THREE.Vector3, top: THREE.Vector3, n: THREE.Vector3, b: number[], c: Color) {
  const a = base.clone().sub(right), d = base.clone().add(right), e = d.clone().add(top), f = a.clone().add(top)
  Y.quad(a, d, e, f, n, n, n, n, [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], c)
}

/** Tube made of rings: the bark region wraps mirrored, so it stays within the atlas. */
function pipe(Y: Stack, ring: { p: THREE.Vector3; r: number }[], edge: number, c: Color, c2: Color) {
  const dir = V(), s = V(), t = V(), n0 = V(), n1 = V()
  const point = (h: { p: THREE.Vector3; r: number }, i: number, a: number, output: THREE.Vector3) => {
    dir.copy(ring[Math.min(i + 1, ring.length - 1)].p).sub(ring[Math.max(i - 1, 0)].p).normalize()
    s.set(1, 0, 0).cross(dir); if (s.lengthSq() < 0.01) s.set(0, 0, 1).cross(dir)
    s.normalize(); t.crossVectors(dir, s)
    output.copy(s).multiplyScalar(Math.cos(a)).addScaledVector(t, Math.sin(a))
    return output.clone().multiplyScalar(h.r).add(h.p)
  }
  const [u0, v0, u1, v1] = B_BARK
  for (let i = 0; i < ring.length - 1; i++) {
    const f0 = ring.length > 2 ? i / (ring.length - 1) : 0, f1 = (i + 1) / (ring.length - 1)
    const ca: Color = [c[0] + (c2[0] - c[0]) * f0, c[1] + (c2[1] - c[1]) * f0, c[2] + (c2[2] - c[2]) * f0]
    const cb: Color = [c[0] + (c2[0] - c[0]) * f1, c[1] + (c2[1] - c[1]) * f1, c[2] + (c2[2] - c[2]) * f1]
    for (let k = 0; k < edge; k++) {
      const a0 = (k / edge) * Math.PI * 2, a1 = ((k + 1) / edge) * Math.PI * 2
      const pa = point(ring[i], i, a0, n0), na = n0.clone(), pb = point(ring[i], i, a1, n1), nb = n1.clone()
      const pd = point(ring[i + 1], i + 1, a1, n1), nd = n1.clone(), pe = point(ring[i + 1], i + 1, a0, n0), ne = n0.clone()
      const um = (q: number) => u0 + (u1 - u0) * Math.abs(((q / edge) * 2) % 2 - 1)
      const vu = i % 2 ? v1 : v0, vv = i % 2 ? v0 : v1
      Y.quad(pa, pb, pd, pe, na, nb, nd, ne, [[um(k), vu], [um(k + 1), vu], [um(k + 1), vv], [um(k), vv]], ca, cb)
    }
  }
}

/** Bare plane tree: trunk and three levels of branches as geometry, the finest branches as cards. The photos show its December look. */
function planeTree(Y: Stack, K: Stack, x: number, z: number, length: number, bodyR: number, seed: number) {
  const r = random(seed), center = V(x, length * 0.6, z), dir = V(), tmp = V()
  const branch = (head: THREE.Vector3, d0: THREE.Vector3, uz: number, ra: number, level: number) => {
    const step = [5, 4, 3, 3][level], d = d0.clone(), p = head.clone()
    const ring: { p: THREE.Vector3; r: number }[] = []
    for (let i = 0; i <= step; i++) {
      const f = i / step
      const rad = ra * (1 - 0.55 * f) * (level === 0 && i === 0 ? 1.45 : 1)
      ring.push({ p: p.clone(), r: rad })
      d.x += (r() - 0.5) * 0.34; d.y += (r() - 0.5) * 0.2 + (level === 0 ? 0 : 0.05); d.z += (r() - 0.5) * 0.34
      d.normalize()
      p.addScaledVector(d, uz / step)
    }
    const dark = 1 - level * 0.17
    pipe(Y, ring, [8, 6, 4, 3][level], [0.95 * dark, 0.9 * dark, 0.82 * dark], [0.85 * dark, 0.78 * dark, 0.68 * dark])
    if (level < 3) {
      const n = level === 0 ? 4 : 3
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 1.3, h = ring[Math.floor(step * (level === 0 ? 0.8 + r() * 0.2 : 0.5 + r() * 0.5))]
        const bow = level === 0 ? 0.75 + r() * 0.3 : 0.55 + r() * 0.4
        dir.set(Math.cos(a) * bow, 0.75 + (r() - 0.3) * 0.35, Math.sin(a) * bow).add(tmp.copy(d).multiplyScalar(0.55)).normalize()
        branch(h.p.clone(), dir, length * [0.38, 0.28, 0.2][level] * (0.8 + r() * 0.4), ra * 0.56, level + 1)
      }
    }
    if (level === 3) {
      // Two crossed branch cards at the tips; normals point out from the crown center, so the crown is lit as a whole.
      const tip = p.clone(), n = tip.clone().sub(center).normalize()
      const S = length * 0.2 * (0.8 + r() * 0.4)
      for (let j = 0; j < 3; j++) {
        const a = r() * Math.PI
        const right = V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(S / 2)
        const top = d.clone().multiplyScalar(0.75).add(V((r() - 0.5) * 0.6, 0.35, (r() - 0.5) * 0.6)).normalize().multiplyScalar(S)
        const tone = 0.8 + r() * 0.25
        card(K, tip, right, top, n, r() > 0.55 ? B_BRANCH2 : B_BRANCH1, [tone, tone * 0.96, tone * 0.9])
      }
    }
  }
  branch(V(x, 0, z), V((r() - 0.5) * 0.14, 1, (r() - 0.5) * 0.14).normalize(), length * 0.3, bodyR, 0)
}

/** A lumpy green mass with leaf cards scattered over it. For the large cypress and the dark row to the south. */
function greenMass(Gv: THREE.BufferGeometry[], K: Stack, opt: { x: number; z: number; y0: number; length: number; R: (t: number) => number; ring: number; slice: number; cardCount: number; cardB: [number, number]; dark: Color; open: Color; seed: number; wave?: number }) {
  const { x, z, y0, length, R, ring, slice, cardCount, cardB, dark, open, seed, wave = 1 } = opt
  const r = random(seed), s = seed * 0.37
  const knob = (a: number, y: number) => 0.62 * Math.sin(a * 2 + y * 0.31 + s) + 0.5 * Math.sin(a * 5 + y * 0.72 + s * 1.7) + 0.3 * Math.sin(a * 9 - y * 1.5 + s * 2) + 0.2 * Math.sin(a * 15 + y * 2.7)
  const position: number[] = [], uv: number[] = [], color: number[] = [], index: number[] = []
  const [u0, v0, u1, v1] = B_LEAF
  for (let h = 0; h <= ring; h++) {
    const t = h / ring, y = y0 + length * t
    for (let d = 0; d <= slice; d++) {
      const a = (d / slice) * Math.PI * 2, n = knob(a, y), rd = R(t) * (1 + 0.19 * n * wave)
      position.push(x + Math.sin(a) * rd, y, z + Math.cos(a) * rd)
      uv.push(u0 + (u1 - u0) * (d % 2), h % 2 ? v0 : v1)
      const l = cluster(-0.7, 0.8, n) * (0.55 + 0.45 * t)
      color.push(dark[0] + (open[0] - dark[0]) * l, dark[1] + (open[1] - dark[1]) * l, dark[2] + (open[2] - dark[2]) * l)
    }
  }
  for (let h = 0; h < ring; h++) for (let d = 0; d < slice; d++) {
    const p = h * (slice + 1) + d, q = p + slice + 1
    index.push(p, p + 1, q, p + 1, q + 1, q)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(color, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  Gv.push(g)

  for (let i = 0; i < cardCount; i++) {
    const t = Math.pow(r(), 0.8), a = r() * Math.PI * 2, y = y0 + length * t, n = knob(a, y)
    const rd = R(t) * (1 + 0.19 * n * wave)
    const outer = V(Math.sin(a), 0.16, Math.cos(a)).normalize()
    const teg = V(Math.cos(a), 0, -Math.sin(a))
    const S = (cardB[0] + r() * (cardB[1] - cardB[0])) * (0.5 + 0.5 * (1 - t))
    const right = teg.clone().multiplyScalar(S / 2 * (0.6 + r() * 0.4)).addScaledVector(outer, (r() - 0.5) * S * 0.45)
    const top = V((r() - 0.5) * 0.4, 0.75, (r() - 0.5) * 0.4).addScaledVector(outer, 0.55).normalize().multiplyScalar(S * 0.62)
    const l = cluster(-0.8, 0.8, n) * 0.55 + r() * 0.45
    const base = V(x + Math.sin(a) * rd, y - S * 0.3, z + Math.cos(a) * rd)
    card(K, base, right, top, outer, B_SAPLING, [dark[0] + (open[0] - dark[0]) * l, dark[1] + (open[1] - dark[1]) * l, dark[2] + (open[2] - dark[2]) * l])
  }
}

export function uluMosqueSurroundings(m: ReturnType<typeof uluMosqueMaterials>, k: Bucket) {
  const lite = lightDevice()
  const base = pavingTexture(), atlas = treeAtlas()
  const floorMat = new THREE.MeshStandardMaterial({ map: base, vertexColors: true, roughness: 0.93, bumpMap: lite ? null : base, bumpScale: 0.9 })
  const bodyMat = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.96 })
  const cardMat = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.96, alphaTest: 0.42, side: THREE.DoubleSide })
  const kZ = new Bucket(), kG = new Bucket(), kK = new Bucket()

  // Vertex paint: box bottom dark, top light; the plinth, border and walls are drawn with a single material.
  const paint = (g: THREE.BufferGeometry, f: (x: number, y: number, z: number) => Color) => {
    const p = g.attributes.position, c = new Float32Array(p.count * 3)
    for (let i = 0; i < p.count; i++) c.set(f(p.getX(i), p.getY(i), p.getZ(i)), i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(c, 3))
    return g
  }
  const stoneBox = (g: number, h: number, d: number, x: number, y: number, z: number, bottom: Color, top: Color) => {
    const kg = boxG(g, h, d)
    // UV offset: so each stone box doesn't start at the same corner of the texture.
    const uv = kg.attributes.uv, water = x * 0.73 + z * 0.41, sv = y * 1.3 + x * 0.17
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + water, uv.getY(i) + sv)
    const k0 = y - h / 2
    kZ.add(paint(place(kg, x, y, z), (_x, vy) => { const f = (vy - k0) / h; return [bottom[0] + (top[0] - bottom[0]) * f, bottom[1] + (top[1] - bottom[1]) * f, bottom[2] + (top[2] - bottom[2]) * f] }), floorMat)
  }

  // --- Ground: vertex-painted grid. The square is light sand-colored, the base edge neutral; wall bases dirty. ---
  const stain = (x: number, z: number) => 0.5 + 0.5 * (0.5 * Math.sin(x * 0.19 + z * 0.13 + 1.3) * Math.sin(z * 0.31 - x * 0.07) + 0.3 * Math.sin(x * 0.53 + 2.1) * Math.sin(z * 0.61) + 0.2 * Math.sin(x * 1.1 + z * 0.9))
  const floorColor = (x: number, z: number): Color => {
    const innerSquare = 1 - cluster(-1, 3, rectFar(x, z, 4, -6.5, 48, 42.5))
    const wall = cluster(0.3, 3.6, rectFar(x, z, 0, 0, YX + 1.1, YZ + 1.1))
    const l = (0.82 + 0.3 * stain(x, z)) * (0.74 + 0.26 * wall)
    return [
      l * (0.58 + 0.42 * innerSquare),
      l * (0.57 + 0.4 * innerSquare),
      l * (0.56 + 0.34 * innerSquare),
    ]
  }
  {
    const HC = 2, N = Math.ceil((PEDESTAL_R + HC) / HC) * 2
    const position: number[] = [], uv: number[] = [], color: number[] = [], index: number[] = []
    const line = (i: number, j: number) => i * (N + 1) + j
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      let x = -N / 2 * HC + j * HC, z = -N / 2 * HC + i * HC
      const q = Math.hypot(x, z)
      if (q > PEDESTAL_R) { x *= PEDESTAL_R / q; z *= PEDESTAL_R / q }
      position.push(x, 0.015, z); uv.push(x, z)
      const c = floorColor(x, z); color.push(c[0], c[1], c[2])
    }
    const outside = (x: number, z: number) => Math.hypot(x, z) >= PEDESTAL_R - 1e-3
    const indoors = (x: number, z: number) => Math.abs(x) < YX - 1 && Math.abs(z) < YZ - 1
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = line(i, j), b = line(i, j + 1), c = line(i + 1, j), d = line(i + 1, j + 1)
      const corners = [a, b, c, d].map((v) => [position[v * 3], position[v * 3 + 2]])
      if (corners.every(([x, z]) => outside(x, z)) || corners.every(([x, z]) => indoors(x, z))) continue
      index.push(a, c, b, b, c, d)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(color, 3))
    g.setIndex(index)
    g.computeVertexNormals()
    kZ.add(g, floorMat)
  }

  // Contact strip: a narrow dark strip against the base. Above the grid, with the same texture.
  const baseStrip = (x0: number, x1: number, z0: number, z1: number, gen: number, dark: number) => {
    const Yg = new Stack(), nu = V(0, 1, 0)
    const piece = (ax: number, az: number, bx: number, bz: number, dx: number, dz: number) => {
      const count = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2.5))
      for (let i = 0; i < count; i++) {
        const f0 = i / count, f1 = (i + 1) / count
        const px0 = ax + (bx - ax) * f0, pz0 = az + (bz - az) * f0, px1 = ax + (bx - ax) * f1, pz1 = az + (bz - az) * f1
        const a = V(px0, 0.028, pz0), b = V(px1, 0.028, pz1), c = V(px1 + dx * gen, 0.028, pz1 + dz * gen), d = V(px0 + dx * gen, 0.028, pz0 + dz * gen)
        const r0 = floorColor(px0, pz0), r1 = floorColor(px1, pz1), rd = floorColor(d.x, d.z), rc = floorColor(c.x, c.z)
        Yg.corner(a, nu, a.x, a.z, [r0[0] * dark, r0[1] * dark, r0[2] * dark]); Yg.corner(d, nu, d.x, d.z, rd); Yg.corner(b, nu, b.x, b.z, [r1[0] * dark, r1[1] * dark, r1[2] * dark])
        Yg.corner(b, nu, b.x, b.z, [r1[0] * dark, r1[1] * dark, r1[2] * dark]); Yg.corner(d, nu, d.x, d.z, rd); Yg.corner(c, nu, c.x, c.z, rc)
      }
    }
    piece(x1, z0, x0, z0, 0, -1); piece(x0, z1, x1, z1, 0, 1); piece(x0, z0, x0, z1, -1, 0); piece(x1, z1, x1, z0, 1, 0)
    kZ.add(Yg.geometry(), floorMat)
  }

  // --- Building plinth: the two-course rough stone footing from the photo (not marble). Interrupted in front of the doors. ---
  const TERRACE_1 = 1.2, TERRACE_2 = 0.66
  const terrace = (axis: 'x' | 'z', fixed: number, head: number, last: number, blanks: [number, number][]) => {
    let a = head
    const slices: [number, number][] = []
    for (const [b0, b1] of blanks) { slices.push([a, b0]); a = b1 }
    slices.push([a, last])
    for (const [d0, d1] of slices) {
      const L = d1 - d0, avg = (d0 + d1) / 2, marker = Math.sign(fixed)
      for (const [proud, y, h, bottom, top] of [[TERRACE_1, 0.2, 0.4, [0.5, 0.53, 0.6], [0.74, 0.78, 0.86]], [TERRACE_2, 0.62, 0.48, [0.62, 0.65, 0.72], [0.9, 0.94, 1.02]]] as [number, number, number, Color, Color][]) {
        const px = fixed + marker * (proud - 0.3) / 2 + marker * 0.15
        if (axis === 'x') stoneBox(L, h, proud + 0.3, avg, y, px, bottom, top)
        else stoneBox(proud + 0.3, h, L, px, y, avg, bottom, top)
      }
    }
  }
  const EXT = 1.2
  terrace('x', -YZ, -YX - EXT, YX + EXT, [[-6.3, 6.3]])
  terrace('x', YZ, -YX - EXT, YX + EXT, [])
  terrace('z', -YX, -YZ, YZ, [[DOOR_Z - 2.2, DOOR_Z + 2.2]])
  terrace('z', YX, -YZ, YZ, [[DOOR_Z - 2.2, DOOR_Z + 2.2]])
  baseStrip(-YX - TERRACE_1, YX + TERRACE_1, -YZ - TERRACE_1, YZ + TERRACE_1, 1.3, 0.5)
  // Foot of the crown gate steps (18 m wide, 7.15 m out from the door).
  baseStrip(-9, 9, -YZ - 7.15, -YZ - 1.2, 0.7, 0.55)

  // Edge of the base: a low stone border framing the model.
  kZ.add(paint(rotateG([[PEDESTAL_R - 0.6, 0.02], [PEDESTAL_R - 0.6, 0.16], [PEDESTAL_R, 0.16], [PEDESTAL_R, 0]], 96, [440, 1]), () => [0.46, 0.44, 0.41]), floorMat)

  // --- Courtyard fountain: on the crown gate axis, a slender marble body on an octagonal basin (dis-gorunum.jpg). ---
  {
    const z = -YZ - 13.5
    k.add(place(cylinderG(1.55, 1.7, 0.25, 8), 0, 0.125, z), m.marble)
    k.add(place(cylinderG(1.25, 1.35, 0.4, 8), 0, 0.45, z), m.marble)
    k.add(place(boxG(1.15, 2.2, 0.5), 0, 1.7, z), m.marble)
    k.add(place(boxG(0.62, 1.15, 0.05), 0, 1.45, z - 0.25), m.dark)
    k.add(place(boxG(1.4, 0.16, 0.66), 0, 2.86, z), m.marble)
    k.add(place(cylinderG(0.32, 0.56, 0.32, 8), 0, 3.1, z), m.marble)
  }

  // --- North boundary of the courtyard: iron railing on a low stone wall (section position approximate, representative). ---
  {
    const z = -YZ - 21, AC = 4.5, LENGTH = 27
    for (const s of [-1, 1]) {
      const avg = s * (AC + LENGTH) / 2, L = LENGTH - AC
      stoneBox(L, 0.34, 0.4, avg, 0.17, z, [0.36, 0.33, 0.3], [0.6, 0.56, 0.5])
      for (const y of [0.52, 1.46]) k.add(place(boxG(L, 0.05, 0.05), avg, y, z), m.dark)
      for (let x = AC; x <= LENGTH; x += 0.42) k.add(place(boxG(0.035, 1.14, 0.035), s * x, 0.92, z), m.dark)
      for (let x = AC; x <= LENGTH; x += 3.36) k.add(place(boxG(0.09, 1.28, 0.09), s * x, 0.98, z), m.dark)
    }
  }

  // --- East square: two dark-roofed pergolas on a low wall, and lawn (_0228, dis-gorunum). ---
  const arbor = (z0: number, z1: number) => {
    const x = 44, L = z1 - z0, avg = (z0 + z1) / 2
    stoneBox(0.55, 1, L + 0.6, x + 1, 0.5, avg, [0.34, 0.31, 0.28], [0.72, 0.65, 0.55])
    kZ.add(paint(place(boxG(2.9, 0.1, L).rotateZ(-0.09), x, 2.65, avg), () => [0.27, 0.28, 0.3]), floorMat)
    k.add(place(boxG(0.12, 0.16, L), x - 1.1, 2.52, avg), m.dark)
    for (let z = z0 + 0.15; z <= z1; z += L / 5 - 0.06) {
      k.add(place(boxG(0.1, 2.5, 0.1), x - 1.1, 1.25, z), m.dark)
      k.add(place(boxG(0.1, 1.6, 0.1), x + 1, 1.8, z), m.dark)
    }
  }
  arbor(-37, -24)
  arbor(-22.5, -9.5)
  const grassArea = (x0: number, x1: number, z0: number, z1: number) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, G = x1 - x0, D = z1 - z0
    for (const [gx, gd, px, pz] of [[G + 0.5, 0.25, cx, z0], [G + 0.5, 0.25, cx, z1], [0.25, D, x0, cz], [0.25, D, x1, cz]]) stoneBox(gx, 0.38, gd, px, 0.19, pz, [0.42, 0.39, 0.35], [0.82, 0.77, 0.67])
    const Yg = new Stack(), n = V(0, 1, 0)
    const [u0, v0, u1, v1] = B_GRASS
    const P = 3
    for (let i = 0; i < P; i++) for (let j = 0; j < P; j++) {
      const ax = x0 + (G * i) / P, bx = x0 + (G * (i + 1)) / P, az = z0 + (D * j) / P, bz = z0 + (D * (j + 1)) / P
      const c: Color = [0.25 + stain(ax * 3, az * 3) * 0.08, 0.42 + stain(az * 3, ax * 3) * 0.1, 0.15]
      Yg.quad(V(ax, 0.3, az), V(ax, 0.3, bz), V(bx, 0.3, bz), V(bx, 0.3, az), n, n, n, n, [[u0, v0], [u0, v1], [u1, v1], [u1, v0]], c)
    }
    kG.add(Yg.geometry(), bodyMat)
  }
  grassArea(45.5, 56.6, -22, -8.3)
  grassArea(52, 57.5, -2.5, 4.5)

  // --- Trees ---
  const Gv = new Stack(), Kt = new Stack()
  // Plane trees: in the north courtyard in front of the door and beside the west minaret, the east square and the lawn edge (_0228, _0510).
  const trees: [number, number, number, number, number, boolean][] = [
    [8.5, -YZ - 14, 16, 0.55, 11, true],
    [-33, -YZ - 10, 15, 0.8, 23, true],
    [45, -YZ - 12, 7.5, 0.22, 37, true],
    [49, -YZ - 9, 14, 0.45, 41, true],
    [54, 1, 18, 0.65, 53, false],
    [50.5, 12, 17, 0.6, 59, true],
    [58, -17, 17, 0.6, 67, false],
    [-46, 22, 8, 0.25, 71, true],
  ]
  for (const [x, z, length, r, seed, pit] of trees) {
    planeTree(Gv, Kt, x, z, length, r, seed)
    // Tree pit at the base of the trunk (dis-gorunum.jpg).
    if (pit) stoneBox(1.7 + r, 0.03, 1.7 + r, x, 0.03, z, [0.14, 0.11, 0.09], [0.14, 0.11, 0.09])
  }
  const gvPieces: THREE.BufferGeometry[] = []
  // The single large cypress in the north courtyard: a wide, dark, clustered mass rising above the facade (dis-gorunum, _0291).
  const CYPRESS_X = -9.5, CYPRESS_Z = -YZ - 14
  greenMass(gvPieces, Kt, {
    x: CYPRESS_X, z: CYPRESS_Z, y0: 2.4, length: 22.5, ring: 34, slice: 26, cardCount: 520, cardB: [1.7, 3.2],
    R: (t) => (t < 0.14 ? 2.6 + (t / 0.14) * 1.9 : 4.5 * Math.pow(1 - (t - 0.14) / 0.86, 0.6) + 0.05),
    dark: [0.36, 0.42, 0.4], open: [0.86, 0.95, 0.74], seed: 13, wave: 1.4,
  })
  pipe(Gv, [{ p: V(CYPRESS_X, 0.5, CYPRESS_Z), r: 0.5 }, { p: V(CYPRESS_X + 0.05, 2, CYPRESS_Z), r: 0.42 }, { p: V(CYPRESS_X, 4.5, CYPRESS_Z), r: 0.32 }], 8, [0.5, 0.42, 0.34], [0.4, 0.33, 0.27])
  // The raised stone planter beside the cypress (dis-gorunum.jpg).
  kZ.add(paint(place(cylinderG(1.95, 2.05, 0.7, 16), CYPRESS_X, 0.35, CYPRESS_Z), (_x, y) => { const f = y / 0.7; return [0.42 + 0.3 * f, 0.39 + 0.28 * f, 0.35 + 0.24 * f] }), floorMat)
  k.add(place(cylinderG(1.72, 1.72, 0.04, 16), CYPRESS_X, 0.71, CYPRESS_Z), m.dark)
  // The dark row in front of the eastern half of the south wall and the two large masses to the southeast (_0228). Species unknown.
  for (let i = 0; i < 9; i++) {
    const x = 8.5 + i * 3, r = 1.9 + ((i * 7) % 3) * 0.28, h = 4.2 + ((i * 5) % 4) * 0.5
    greenMass(gvPieces, Kt, {
      x, z: 33.6 + ((i * 3) % 2) * 0.7, y0: 0.1, length: h, ring: 7, slice: 12, cardCount: 60, cardB: [1.5, 2.6],
      R: (t) => r * Math.pow(Math.max(0.02, 1 - t), 0.5) * (0.82 + 0.3 * Math.min(1, t * 3)),
      dark: [0.42, 0.5, 0.42], open: [0.82, 0.95, 0.7], seed: 17 + i, wave: 1.3,
    })
  }
  for (const [x, z, r, h, t] of [[43, 42, 5, 9.5, 29], [55, 27, 4.6, 9, 31]]) {
    greenMass(gvPieces, Kt, {
      x, z, y0: 1.4, length: h, ring: 10, slice: 16, cardCount: 170, cardB: [2, 3.2],
      R: (q) => r * Math.sqrt(Math.max(0, 1 - Math.pow((q - 0.32) / 0.68, 2))) * (q < 0.32 ? 0.75 + q * 0.8 : 1) + 0.02,
      dark: [0.42, 0.5, 0.42], open: [0.85, 0.95, 0.72], seed: t, wave: 1.3,
    })
    pipe(Gv, [{ p: V(x, 0, z), r: 0.32 }, { p: V(x, 2.5, z), r: 0.24 }], 6, [0.5, 0.42, 0.34], [0.42, 0.35, 0.28])
  }
  gvPieces.forEach((g) => kG.add(g, bodyMat))
  kG.add(Gv.geometry(), bodyMat)
  kK.add(Kt.geometry(), cardMat)

  const group = new THREE.Group()
  const cards = kK.group()
  // The GTAO pass doesn't know about transparency and treats cards as solid quads: we don't draw this mesh in that pass.
  cards.children.forEach((c) => {
    c.onBeforeRender = (_r, scene, _k, g) => { g.setDrawRange(0, scene.overrideMaterial ? 0 : Infinity) }
  })
  group.add(kZ.group(), kG.group(), cards)
  return group
}
