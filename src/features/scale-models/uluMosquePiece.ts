// Shared dimensions and geometry helpers of the Ulu Camii model.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const EAST_WEST = 69, NORTH_SOUTH = 55
export const COLUMN = 5, LINE = 4
export const BAY_X = EAST_WEST / COLUMN, BAY_Z = NORTH_SOUTH / LINE
export const H = 13, WALL = 2
export const YX = EAST_WEST / 2, YZ = NORTH_SOUTH / 2
export const FOUNTAIN_COLUMN = 2, FOUNTAIN_ROW = 1
export const PAVING_Y = H + 0.9, SKIRT_Y = 1.6, DRUM_BASE = PAVING_Y + SKIRT_Y
export const OCTA = Math.cos(Math.PI / 8)

export const px = (i: number) => -YX + BAY_X * i
export const pz = (j: number) => -YZ + BAY_Z * j

/** Clear span of a bay between its arch and wall faces. */
export const bayOpening = (i: number, j: number) => ({
  x0: i === 0 ? -YX + WALL : px(i) + 1,
  x1: i === COLUMN - 1 ? YX - WALL : px(i + 1) - 1,
  z0: j === 0 ? -YZ + WALL : pz(j) + 1,
  z1: j === LINE - 1 ? YZ - WALL : pz(j + 1) - 1,
})

/** In the photos the domes of the middle column are noticeably higher; dimensions are representative. */
export const baySize = (column: number) => {
  const c = Math.abs(column - 2)
  return { drumH: [3.5, 2.8, 2.3][c], domeH: [4.5, 3.9, 3.5][c] }
}

export type Mat = THREE.Material

/** Accumulates pieces by material, so the scene has a few draw calls instead of hundreds. */
export class Bucket {
  private pieces = new Map<Mat, THREE.BufferGeometry[]>()
  add(g: THREE.BufferGeometry, m: Mat) {
    const list = this.pieces.get(m) ?? []
    g.clearGroups()
    list.push(g.index ? g.toNonIndexed() : g)
    this.pieces.set(m, list)
  }
  group() {
    const group = new THREE.Group()
    for (const [m, list] of this.pieces) {
      const merged = mergeGeometries(list, false)
      if (!merged) throw new Error('Could not merge model geometry')
      list.forEach((g) => g.dispose())
      const mesh = new THREE.Mesh(merged, m)
      mesh.castShadow = !m.transparent
      mesh.receiveShadow = !m.transparent
      group.add(mesh)
    }
    return group
  }
}

export function place<G extends THREE.BufferGeometry>(g: G, x: number, y: number, z: number, ry = 0) {
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return g
}

/** Box: UVs in meters, so stone and marble look the same size at any scale. */
export function boxG(g: number, h: number, d: number) {
  const k = new THREE.BoxGeometry(g, h, d)
  const uv = k.attributes.uv
  const length: [number, number][] = [[d, h], [d, h], [g, d], [g, d], [g, h], [g, h]]
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const n = f * 4 + i
    uv.setXY(n, uv.getX(n) * length[f][0], uv.getY(n) * length[f][1])
  }
  return k
}

/** Body of revolution; if `uvScaleOf` is not given, UVs are scaled to circumference and height in meters. */
export function rotateG(points: [number, number][], piece: number, uvScaleOf?: [number, number]) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), piece)
  const widest = Math.max(...points.map((n) => n[0]))
  const length = points.reduce((t, n, i) => i ? t + Math.hypot(n[0] - points[i - 1][0], n[1] - points[i - 1][1]) : 0, 0)
  const [water, sv] = uvScaleOf ?? [Math.PI * 2 * widest, length]
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * water, uv.getY(i) * sv)
  return g
}

export function cylinderG(top: number, bottom: number, h: number, piece: number, open = false) {
  const g = new THREE.CylinderGeometry(top, bottom, h, piece, 1, open)
  const uv = g.attributes.uv
  const circumference = Math.PI * 2 * Math.max(top, bottom)
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circumference, uv.getY(i) * h)
  return g
}

/** Flat shading for faceted surfaces. */
export function flatShadow<G extends THREE.BufferGeometry>(g: G) {
  const d = g.index ? g.toNonIndexed() : g
  d.computeVertexNormals()
  return d
}

export function arch<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, flat: number, archH: number): P {
  const o = g / 2, apex = y0 + flat + archH, control = y0 + flat + archH * 0.55
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, y0 + flat)
  p.quadraticCurveTo(cx - o, control, cx, apex)
  p.quadraticCurveTo(cx + o, control, cx + o, y0 + flat)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

export function rect(x0: number, y0: number, x1: number, y1: number) {
  const s = new THREE.Shape()
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath()
  return s
}

export function subtract(s: THREE.Shape, depth: number, z = 0) {
  const g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false, curveSegments: 10 })
  g.translate(0, 0, z)
  return g
}

/** Fits the surface UVs to its own bounds: the texture sits on the window as a single piece. */
export function uvFit<G extends THREE.BufferGeometry>(g: G) {
  g.computeBoundingBox()
  const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv
  if (!b) return g
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / w, (p.getY(i) - b.min.y) / h)
  return g
}
