// Geometry helpers for the Yeşil Complex model: wall with openings, surface cladding, prism and transition belt.
import * as THREE from 'three'
import { Bucket, subtract, rect, arch, type Mat } from '../../uluMosquePiece'

/** Wall opening: `u` in meters from the wall start; pointed if `archH` is set, flat Bursa arch if `bursa`. */
export interface Gap { u0: number; u1: number; y0: number; y1: number; archH?: number; bursa?: boolean }

/** Bursa arch: vertical jambs, short curved shoulders and an almost flat top. */
export function bursaArchOf<P extends THREE.Path>(p: P, u0: number, u1: number, y0: number, leg: number, archH: number): P {
  const g = u1 - u0, y = y0 + leg
  p.moveTo(u0, y0)
  p.lineTo(u0, y)
  p.quadraticCurveTo(u0, y + archH * 0.82, u0 + g * 0.22, y + archH * 0.9)
  p.lineTo(u1 - g * 0.22, y + archH * 0.9)
  p.quadraticCurveTo(u1, y + archH * 0.82, u1, y)
  p.lineTo(u1, y0)
  p.closePath()
  return p
}

function toGap<P extends THREE.Path>(p: P, b: Gap): P {
  if (b.bursa) return bursaArchOf(p, b.u0, b.u1, b.y0, b.y1 - b.y0, b.archH ?? 2)
  if (b.archH) return arch(p, (b.u0 + b.u1) / 2, b.y0, b.u1 - b.u0, b.y1 - b.y0, b.archH)
  p.moveTo(b.u0, b.y0); p.lineTo(b.u1, b.y0); p.lineTo(b.u1, b.y1); p.lineTo(b.u0, b.y1); p.closePath()
  return p
}

/** Moves the local plane along a→b into the world; local +z faces left of a→b, i.e. (-dz, dx). */
export function align<G extends THREE.BufferGeometry>(g: G, ax: number, az: number, bx: number, bz: number) {
  g.rotateY(Math.atan2(-(bz - az), bx - ax))
  g.translate(ax, 0, az)
  return g
}

/** Thick wall: starts at the a→b line, `t` thick in the normal direction. */
export function wall(k: Bucket, ax: number, az: number, bx: number, bz: number, t: number, y0: number, y1: number, mat: Mat, gaps: Gap[] = []) {
  const L = Math.hypot(bx - ax, bz - az)
  const s = rect(0, y0, L, y1)
  for (const b of gaps) s.holes.push(toGap(new THREE.Path(), b))
  k.add(align(subtract(s, t), ax, az, bx, bz), mat)
}

/** Thin cladding surface: the normal faces left of a→b. UVs are in meters. */
export function surface(k: Bucket, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, mat: Mat, gaps: Gap[] = [], slip = 0.015) {
  const L = Math.hypot(bx - ax, bz - az)
  const s = rect(0, y0, L, y1)
  for (const b of gaps) s.holes.push(toGap(new THREE.Path(), b))
  k.add(align(new THREE.ShapeGeometry(s, 10).translate(0, 0, slip), ax, az, bx, bz), mat)
}

/** Horizontal band cladding: texture height fits the band height, repeats every `repeatM` meters along u. */
export function band(k: Bucket, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, mat: Mat, repeatM = 1, slip = 0.02) {
  const L = Math.hypot(bx - ax, bz - az)
  const g = new THREE.PlaneGeometry(L, y1 - y0).translate(L / 2, (y0 + y1) / 2, slip)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / repeatM, (p.getY(i) - y0) / (y1 - y0))
  k.add(align(g, ax, az, bx, bz), mat)
}

/** Single arch-shaped plaque in the local plane; the texture fits the plaque once. */
export function plaque(k: Bucket, s: THREE.Shape, ax: number, az: number, bx: number, bz: number, mat: Mat, thickness = 0, slip = 0.02, fit = true) {
  const g = thickness ? subtract(s, thickness, slip) : new THREE.ShapeGeometry(s, 12).translate(0, 0, slip)
  if (fit) {
    g.computeBoundingBox()
    const b = g.boundingBox!, p = g.attributes.position, uv = g.attributes.uv
    const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / w, (p.getY(i) - b.min.y) / h)
  }
  k.add(align(g, ax, az, bx, bz), mat)
}

/** Open prism on a closed polygon base; sides face outward, UVs in meters. */
export function prism(points: [number, number][], y0: number, y1: number, inner = false) {
  const position: number[] = [], uv: number[] = []
  let u = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const [ax, az] = points[i], [bx, bz] = points[(i + 1) % n]
    const L = Math.hypot(bx - ax, bz - az)
    const A = [ax, y0, az], B = [bx, y0, bz], C = [bx, y1, bz], D = [ax, y1, az]
    const uA = [u, y0], uB = [u + L, y0], uC = [u + L, y1], uD = [u, y1]
    const tri = inner ? [A, B, C, A, C, D] : [A, C, B, A, D, C]
    const tuv = inner ? [uA, uB, uC, uA, uC, uD] : [uA, uC, uB, uA, uD, uC]
    tri.forEach((p) => position.push(...p))
    tuv.forEach((p) => uv.push(...p))
    u += L
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Regular polygon corners; `rotation` in radians, the first corner starts from +z. Corners run clockwise (seen from above). */
export const polygon = (n: number, r: number, cx = 0, cz = 0, rotation = Math.PI / n): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = rotation + (i / n) * Math.PI * 2
    return [cx + Math.sin(a) * r, cz + Math.cos(a) * r] as [number, number]
  })

/** Chamfered square (bird's-eye): body of the dome drums. */
export const chamferedSquare = (cx: number, cz: number, y: number, chamfer: number): [number, number][] => [
  [cx - y + chamfer, cz + y], [cx + y - chamfer, cz + y], [cx + y, cz + y - chamfer], [cx + y, cz - y + chamfer],
  [cx + y - chamfer, cz - y], [cx - y + chamfer, cz - y], [cx - y, cz - y + chamfer], [cx - y, cz + y - chamfer],
]

/** Polygon ring cap (outer polygon → inner circle), visible from above. */
export function ring(points: [number, number][], r: number, cx: number, cz: number, y: number) {
  const s = new THREE.Shape()
  points.forEach(([x, z], i) => (i ? s.lineTo(x - cx, -(z - cz)) : s.moveTo(x - cx, -(z - cz))))
  s.closePath()
  s.holes.push(new THREE.Path().absarc(0, 0, r, 0, Math.PI * 2, true))
  return new THREE.ShapeGeometry(s, 32).rotateX(-Math.PI / 2).translate(cx, y, cz)
}

/**
 * Belt transitioning from a square room to a circular mouth; `slice` faceted faces give a Turkish-triangle impression. Visible from inside.
 * UV: u around (0–1), v bottom to top (0–1).
 */
export function transitionBelt(cx: number, cz: number, ax: number, az: number, y0: number, y1: number, R: number, slice = 16) {
  const position: number[] = [], uv: number[] = []
  const point = (i: number, top: boolean) => {
    const a = (i / slice) * Math.PI * 2 + Math.PI / slice
    const dx = Math.sin(a), dz = Math.cos(a)
    if (top) return [cx + dx * R, y1, cz + dz * R]
    const u = Math.min(ax / Math.abs(dx || 1e-6), az / Math.abs(dz || 1e-6))
    return [cx + dx * u, y0, cz + dz * u]
  }
  for (let i = 0; i < slice; i++) {
    const A = point(i, false), B = point(i + 1, false), C = point(i, true), D = point(i + 1, true)
    const u0 = i / slice, u1 = (i + 1) / slice
    position.push(...A, ...C, ...B, ...B, ...C, ...D)
    uv.push(u0, 0, u0, 1, u1, 0, u1, 0, u0, 1, u1, 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Simple quad: counter-clockwise corner order (normal up). */
export function quad(a: number[], b: number[], c: number[], d: number[], scale = 1) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
  const u = (p: number[]) => [p[0] / scale, p[2] / scale]
  g.setAttribute('uv', new THREE.Float32BufferAttribute([...u(a), ...u(b), ...u(c), ...u(a), ...u(c), ...u(d)], 2))
  g.computeVertexNormals()
  return g
}

/**
 * Hipped roof: rises from the rectangle's edges to the ridge with slope `burden`.
 * UV: horizontal meters and slope meters; tile rows stay parallel to the eave.
 */
export function hipRoof(x0: number, x1: number, z0: number, z1: number, y: number, burden: number) {
  const narrow = Math.min(x1 - x0, z1 - z0) / 2
  const position: number[] = [], uv: number[] = []
  const X0 = x0 + narrow, X1 = x1 - narrow, Z0 = z0 + narrow, Z1 = z1 - narrow
  const ext = (a: number[], b: number[], c: number[], ua: number[], ub: number[], tip: number[]) => { position.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...tip) }
  const slope = Math.hypot(narrow, burden), T = y + burden
  const face = (a0: number[], a1: number[], b1: number[], b0: number[]) => {
    const L = Math.hypot(a1[0] - a0[0], a1[2] - a0[2])
    const k = Math.hypot(b0[0] - a0[0], b0[2] - a0[2])
    const horizontal = Math.sqrt(Math.max(0, k * k - narrow * narrow))
    const L2 = Math.hypot(b1[0] - b0[0], b1[2] - b0[2])
    const u0 = [0, 0], u1 = [L, 0], v1 = [horizontal + L2, slope], v0 = [horizontal, slope]
    ext(a0, a1, b1, u0, u1, v1)
    if (L2 > 0.001) ext(a0, b1, b0, u0, v1, v0)
  }
  face([x0, y, z1], [x1, y, z1], [X1, T, Z1], [X0, T, Z1])
  face([x1, y, z0], [x0, y, z0], [X0, T, Z0], [X1, T, Z0])
  face([x1, y, z1], [x1, y, z0], [X1, T, Z0], [X1, T, Z1])
  face([x0, y, z0], [x0, y, z1], [X0, T, Z1], [X0, T, Z0])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}
