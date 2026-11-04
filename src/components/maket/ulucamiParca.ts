// Ulu Camii maketinin ortak ölçüleri ve geometri yardımcıları.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const DOGU_BATI = 69, KUZEY_GUNEY = 55
export const SUTUN = 5, SATIR = 4
export const GOZ_X = DOGU_BATI / SUTUN, GOZ_Z = KUZEY_GUNEY / SATIR
export const H = 13, DUVAR = 2
export const YX = DOGU_BATI / 2, YZ = KUZEY_GUNEY / 2
export const SADIRVAN_SUTUN = 2, SADIRVAN_SATIR = 1
export const DOSEME_Y = H + 0.9, ETEK_Y = 1.6, KASNAK_TABAN = DOSEME_Y + ETEK_Y
export const OCTA = Math.cos(Math.PI / 8)

export const px = (i: number) => -YX + GOZ_X * i
export const pz = (j: number) => -YZ + GOZ_Z * j

/** Gözün kemer ve duvar yüzleri arasındaki açıklığı. */
export const gozAcikligi = (i: number, j: number) => ({
  x0: i === 0 ? -YX + DUVAR : px(i) + 1,
  x1: i === SUTUN - 1 ? YX - DUVAR : px(i + 1) - 1,
  z0: j === 0 ? -YZ + DUVAR : pz(j) + 1,
  z1: j === SATIR - 1 ? YZ - DUVAR : pz(j + 1) - 1,
})

/** Fotoğraflarda orta sütunun kubbeleri belirgin biçimde yüksektir; ölçüler temsilidir. */
export const gozOlcusu = (sutun: number) => {
  const c = Math.abs(sutun - 2)
  return { kasnakH: [3.5, 2.8, 2.3][c], kubbeH: [4.5, 3.9, 3.5][c] }
}

export type Mal = THREE.Material

/** Parçaları malzemeye göre biriktirir; böylece sahnede yüzlerce yerine birkaç çizim çağrısı kalır. */
export class Kova {
  private parcalar = new Map<Mal, THREE.BufferGeometry[]>()
  ekle(g: THREE.BufferGeometry, m: Mal) {
    const liste = this.parcalar.get(m) ?? []
    g.clearGroups()
    liste.push(g.index ? g.toNonIndexed() : g)
    this.parcalar.set(m, liste)
  }
  grup() {
    const grup = new THREE.Group()
    for (const [m, liste] of this.parcalar) {
      const birlesik = mergeGeometries(liste, false)
      if (!birlesik) throw new Error('Maket geometrisi birleştirilemedi')
      liste.forEach((g) => g.dispose())
      const mesh = new THREE.Mesh(birlesik, m)
      mesh.castShadow = !m.transparent
      mesh.receiveShadow = !m.transparent
      grup.add(mesh)
    }
    return grup
  }
}

export function yer<G extends THREE.BufferGeometry>(g: G, x: number, y: number, z: number, ry = 0) {
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return g
}

/** Kutu: UV'ler metre cinsinden, böylece taş ve mermer her ölçekte aynı boyda görünür. */
export function kutuG(g: number, h: number, d: number) {
  const k = new THREE.BoxGeometry(g, h, d)
  const uv = k.attributes.uv
  const boy: [number, number][] = [[d, h], [d, h], [g, d], [g, d], [g, h], [g, h]]
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const n = f * 4 + i
    uv.setXY(n, uv.getX(n) * boy[f][0], uv.getY(n) * boy[f][1])
  }
  return k
}

/** Dönel gövde; `uvOlcek` verilmezse UV'ler çevre ve boy metresine ölçeklenir. */
export function dondurG(noktalar: [number, number][], parca: number, uvOlcek?: [number, number]) {
  const g = new THREE.LatheGeometry(noktalar.map(([r, y]) => new THREE.Vector2(r, y)), parca)
  const enGenis = Math.max(...noktalar.map((n) => n[0]))
  const boy = noktalar.reduce((t, n, i) => i ? t + Math.hypot(n[0] - noktalar[i - 1][0], n[1] - noktalar[i - 1][1]) : 0, 0)
  const [su, sv] = uvOlcek ?? [Math.PI * 2 * enGenis, boy]
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv)
  return g
}

export function silindirG(ust: number, alt: number, h: number, parca: number, acik = false) {
  const g = new THREE.CylinderGeometry(ust, alt, h, parca, 1, acik)
  const uv = g.attributes.uv
  const su = Math.PI * 2 * Math.max(ust, alt)
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * h)
  return g
}

/** Köşeli yüzeyler için düz gölgeleme. */
export function duzGolge<G extends THREE.BufferGeometry>(g: G) {
  const d = g.index ? g.toNonIndexed() : g
  d.computeVertexNormals()
  return d
}

export function kemer<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, duz: number, kemerH: number): P {
  const o = g / 2, tepe = y0 + duz + kemerH, kontrol = y0 + duz + kemerH * 0.55
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, y0 + duz)
  p.quadraticCurveTo(cx - o, kontrol, cx, tepe)
  p.quadraticCurveTo(cx + o, kontrol, cx + o, y0 + duz)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

export function dikdortgen(x0: number, y0: number, x1: number, y1: number) {
  const s = new THREE.Shape()
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath()
  return s
}

export function cikar(s: THREE.Shape, derinlik: number, z = 0) {
  const g = new THREE.ExtrudeGeometry(s, { depth: derinlik, bevelEnabled: false, curveSegments: 10 })
  g.translate(0, 0, z)
  return g
}

/** Yüzeyin UV'sini kendi sınırına oturtur: doku pencereye tek parça yerleşir. */
export function uvSigdir<G extends THREE.BufferGeometry>(g: G) {
  g.computeBoundingBox()
  const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv
  if (!b) return g
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / w, (p.getY(i) - b.min.y) / h)
  return g
}
