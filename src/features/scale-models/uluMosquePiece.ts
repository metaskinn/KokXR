// Ulu Camii maketinin ortak ölçüleri ve geometri yardımcıları.
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

/** Gözün kemer ve duvar yüzleri arasındaki açıklığı. */
export const bayOpening = (i: number, j: number) => ({
  x0: i === 0 ? -YX + WALL : px(i) + 1,
  x1: i === COLUMN - 1 ? YX - WALL : px(i + 1) - 1,
  z0: j === 0 ? -YZ + WALL : pz(j) + 1,
  z1: j === LINE - 1 ? YZ - WALL : pz(j + 1) - 1,
})

/** Fotoğraflarda orta sütunun kubbeleri belirgin biçimde yüksektir; ölçüler temsilidir. */
export const baySize = (column: number) => {
  const c = Math.abs(column - 2)
  return { drumH: [3.5, 2.8, 2.3][c], domeH: [4.5, 3.9, 3.5][c] }
}

export type Mat = THREE.Material

/** Parçaları malzemeye göre biriktirir; böylece sahnede yüzlerce yerine birkaç çizim çağrısı kalır. */
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
      if (!merged) throw new Error('Maket geometrisi birleştirilemedi')
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

/** Kutu: UV'ler metre cinsinden, böylece taş ve mermer her ölçekte aynı boyda görünür. */
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

/** Dönel gövde; `uvOlcek` verilmezse UV'ler çevre ve boy metresine ölçeklenir. */
export function rotateG(points: [number, number][], piece: number, uvScaleOf?: [number, number]) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), piece)
  const widest = Math.max(...points.map((n) => n[0]))
  const length = points.reduce((t, n, i) => i ? t + Math.hypot(n[0] - points[i - 1][0], n[1] - points[i - 1][1]) : 0, 0)
  const [water, sv] = uvScaleOf ?? [Math.PI * 2 * widest, length]
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * water, uv.getY(i) * sv)
  return g
}

export function cylinderG(top: number, alt: number, h: number, piece: number, open = false) {
  const g = new THREE.CylinderGeometry(top, alt, h, piece, 1, open)
  const uv = g.attributes.uv
  const water = Math.PI * 2 * Math.max(top, alt)
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * water, uv.getY(i) * h)
  return g
}

/** Köşeli yüzeyler için düz gölgeleme. */
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

/** Yüzeyin UV'sini kendi sınırına oturtur: doku pencereye tek parça yerleşir. */
export function uvFit<G extends THREE.BufferGeometry>(g: G) {
  g.computeBoundingBox()
  const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv
  if (!b) return g
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / w, (p.getY(i) - b.min.y) / h)
  return g
}
