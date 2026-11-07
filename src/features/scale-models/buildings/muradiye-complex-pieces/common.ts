// Geometry helpers for the Muradiye model. Units in meters; north -z, east +x.
import * as THREE from 'three'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, cylinderG, uvFit, place } from '../../uluMosquePiece'

export type Mat = THREE.Material
/** Facing rotations: local +z faces outward. */
export const NORTH = Math.PI, SOUTH = 0, EAST = Math.PI / 2, WEST = -Math.PI / 2

export interface Gap { u: number; g: number; y: number; flat: number; k: number }

/** Wall with openings: outer face on the (cx, cz) line, thickness goes inward. Two material layers. */
export function wall(kv: Bucket, cx: number, cz: number, L: number, y0: number, y1: number, T: number, ry: number, outer: Mat, inner: Mat, gaps: Gap[] = [], outerRatio = 0.6) {
  const shape = () => {
    const s = rect(-L / 2, y0, L / 2, y1)
    for (const b of gaps) s.holes.push(arch(new THREE.Path(), b.u, b.y, b.g, b.flat, b.k))
    return s
  }
  kv.add(place(subtract(shape(), T * outerRatio, -T * outerRatio), cx, 0, cz, ry), outer)
  kv.add(place(subtract(shape(), T * (1 - outerRatio), -T), cx, 0, cz, ry), inner)
}

/** Face given by four corners; UVs in meters. */
export function quadG(a: number[], b: number[], c: number[], d: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const Lu = Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2])
  const h = Math.hypot((d[0] + c[0] - a[0] - b[0]) / 2, (d[1] + c[1] - a[1] - b[1]) / 2, (d[2] + c[2] - a[2] - b[2]) / 2)
  const share = (L - Lu) / 2
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L - share, h, 0, 0, L - share, h, share, h], 2))
  g.computeVertexNormals()
  return g
}

/** Hipped roof: four sloped faces; the ridge runs along the long side. */
export function hipRoof(kv: Bucket, x0: number, x1: number, z0: number, z1: number, y: number, h: number, mat: Mat) {
  const gi = Math.min(x1 - x0, z1 - z0) / 2
  const Y = y + h
  const a = [x0, y, z0], b = [x1, y, z0], c = [x1, y, z1], d = [x0, y, z1]
  const p = [x0 + gi, Y, z0 + gi], q = [x1 - gi, Y, z0 + gi], r = [x1 - gi, Y, z1 - gi], s = [x0 + gi, Y, z1 - gi]
  kv.add(quadG(b, a, p, q), mat)
  kv.add(quadG(a, d, s, p), mat)
  kv.add(quadG(d, c, r, s), mat)
  kv.add(quadG(c, b, q, r), mat)
}

/** Flat slab with a circular hole (roof deck or ceiling). */
export function perforatedPaving(kv: Bucket, x0: number, x1: number, z0: number, z1: number, y: number, holes: [number, number, number][], mat: Mat) {
  const s = rect(x0, -z1, x1, -z0)
  for (const [x, z, r] of holes) s.holes.push(new THREE.Path().absarc(x, -z, r, 0, Math.PI * 2, true))
  kv.add(new THREE.ShapeGeometry(s, 24).rotateX(-Math.PI / 2).translate(0, y, 0), mat)
}

/** Lead (or tile) dome: skirt opening downward and a shallow body. */
export function outerDome(kv: Bucket, x: number, y: number, z: number, R: number, H: number, mat: Mat, piece = 48, openR = 0) {
  const p: [number, number][] = [[R + 0.5, -0.28], [R, 0]]
  for (let t = 1; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    const r = R * Math.pow(Math.cos(a), 0.82)
    if (openR && r < openR) break
    p.push([Math.max(r, 0.001), H * Math.pow(Math.sin(a), 1.02)])
  }
  kv.add(place(rotateG(p, piece, [1, 1]), x, y, z), mat)
}

/** Finial (alem): small segmented crown. */
export function finial(kv: Bucket, x: number, y: number, z: number, mat: Mat, scale = 1) {
  const p: [number, number][] = [[0.14, 0], [0.05, 0.12], [0.13, 0.28], [0.04, 0.46], [0.1, 0.58], [0.02, 0.9], [0, 0.95]]
  kv.add(place(rotateG(p.map(([r, h]) => [r * scale, h * scale] as [number, number]), 8), x, y, z), mat)
}

/** Polygonal drum: side face, molding on top. */
export function drum(kv: Bucket, x: number, y0: number, y1: number, z: number, R: number, n: number, mat: Mat, molding: Mat) {
  const h = y1 - y0
  kv.add(place(flatShadow(cylinderG(R, R, h, n, true).rotateY(Math.PI / n)), x, y0 + h / 2, z), mat)
  kv.add(place(flatShadow(cylinderG(R + 0.22, R + 0.06, 0.32, n, true).rotateY(Math.PI / n)), x, y1 - 0.14, z), molding)
}

/** Thin pointed-arch ornament on a wall face (window, niche). `forward`: local +z offset. */
export function archFace(kv: Bucket, x: number, z: number, ry: number, u: number, y: number, g: number, flat: number, k: number, forward: number, mat: Mat) {
  const geo = uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), u, y, g, flat, k), 10)).translate(0, 0, forward)
  kv.add(place(geo, x, 0, z, ry), mat)
}

/** Pointed-arch frame ring. */
export function archRing(kv: Bucket, x: number, z: number, ry: number, u: number, y: number, g: number, flat: number, k: number, thick: number, forward: number, mat: Mat, depth = 0.08) {
  const s = arch(new THREE.Shape(), u, y - thick, g + thick * 2, flat + thick, k + thick)
  s.holes.push(arch(new THREE.Path(), u, y, g, flat, k))
  kv.add(place(subtract(s, depth, forward), x, 0, z, ry), mat)
}

/** Shell transitioning from a square or rectangular base to a circle; carries the dome in the interior. */
export function transitionShell(cx: number, cz: number, ax: number, az: number, y0: number, y1: number, R: number, piece = 32, row = 4) {
  const position: number[] = [], uv: number[] = [], index: number[] = []
  for (let s = 0; s <= row; s++) {
    const t = s / row, e = Math.pow(t, 0.8)
    for (let a = 0; a <= piece; a++) {
      const theta = (a / piece) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
      const far = Math.min(Math.abs(dx) > 1e-4 ? ax / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-4 ? az / Math.abs(dz) : Infinity)
      const r = THREE.MathUtils.lerp(far, R, e)
      position.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / piece * 2, t)
    }
  }
  for (let s = 0; s < row; s++) for (let a = 0; a < piece; a++) {
    const p = s * (piece + 1) + a, q = p + piece + 1
    index.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** Inner dome: from the drum radius to the apex. */
export function innerDomeG(R: number, H: number) {
  const p: [number, number][] = []
  for (let t = 0; t <= 16; t++) {
    const a = (t / 16) * Math.PI / 2
    p.push([Math.max(R * Math.cos(a), 0.001), H * Math.sin(a)])
  }
  return rotateG(p, 56, [1, 1])
}
