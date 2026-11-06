// Muradiye maketinin geometri yardımcıları. Birim metre; kuzey -z, doğu +x.
import * as THREE from 'three'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, silindirG, uvSigdir, yer } from '../../ulucamiParca'

export type Mal = THREE.Material
/** Yön dönüşleri: yerel +z dışarı bakar. */
export const KUZEY = Math.PI, GUNEY = 0, DOGU = Math.PI / 2, BATI = -Math.PI / 2

export interface Bosluk { u: number; g: number; y: number; duz: number; k: number }

/** Boşluklu duvar: dış yüzü (cx, cz) çizgisinde, kalınlık içeri doğru. İki malzeme katmanı. */
export function duvar(kv: Kova, cx: number, cz: number, L: number, y0: number, y1: number, T: number, ry: number, dis: Mal, ic: Mal, bosluklar: Bosluk[] = [], disOran = 0.6) {
  const sekil = () => {
    const s = dikdortgen(-L / 2, y0, L / 2, y1)
    for (const b of bosluklar) s.holes.push(kemer(new THREE.Path(), b.u, b.y, b.g, b.duz, b.k))
    return s
  }
  kv.ekle(yer(cikar(sekil(), T * disOran, -T * disOran), cx, 0, cz, ry), dis)
  kv.ekle(yer(cikar(sekil(), T * (1 - disOran), -T), cx, 0, cz, ry), ic)
}

/** Dört köşesi verilen yüz; UV metre cinsinden. */
export function dortgenG(a: number[], b: number[], c: number[], d: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3))
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const Lu = Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2])
  const h = Math.hypot((d[0] + c[0] - a[0] - b[0]) / 2, (d[1] + c[1] - a[1] - b[1]) / 2, (d[2] + c[2] - a[2] - b[2]) / 2)
  const pay = (L - Lu) / 2
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L - pay, h, 0, 0, L - pay, h, pay, h], 2))
  g.computeVertexNormals()
  return g
}

/** Kırma çatı: dört eğimli yüz; sırt uzun kenar boyuncadır. */
export function kirmaCati(kv: Kova, x0: number, x1: number, z0: number, z1: number, y: number, h: number, mal: Mal) {
  const gi = Math.min(x1 - x0, z1 - z0) / 2
  const Y = y + h
  const a = [x0, y, z0], b = [x1, y, z0], c = [x1, y, z1], d = [x0, y, z1]
  const p = [x0 + gi, Y, z0 + gi], q = [x1 - gi, Y, z0 + gi], r = [x1 - gi, Y, z1 - gi], s = [x0 + gi, Y, z1 - gi]
  kv.ekle(dortgenG(b, a, p, q), mal)
  kv.ekle(dortgenG(a, d, s, p), mal)
  kv.ekle(dortgenG(d, c, r, s), mal)
  kv.ekle(dortgenG(c, b, q, r), mal)
}

/** Daire delikli düz döşeme (çatı güvertesi veya tavan). */
export function delikliDoseme(kv: Kova, x0: number, x1: number, z0: number, z1: number, y: number, delikler: [number, number, number][], mal: Mal) {
  const s = dikdortgen(x0, -z1, x1, -z0)
  for (const [x, z, r] of delikler) s.holes.push(new THREE.Path().absarc(x, -z, r, 0, Math.PI * 2, true))
  kv.ekle(new THREE.ShapeGeometry(s, 24).rotateX(-Math.PI / 2).translate(0, y, 0), mal)
}

/** Kurşun (veya kiremit) kubbe: alta açılan etek ve yayvan gövde. */
export function disKubbe(kv: Kova, x: number, y: number, z: number, R: number, H: number, mal: Mal, parca = 48, acikR = 0) {
  const p: [number, number][] = [[R + 0.5, -0.28], [R, 0]]
  for (let t = 1; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    const r = R * Math.pow(Math.cos(a), 0.82)
    if (acikR && r < acikR) break
    p.push([Math.max(r, 0.001), H * Math.pow(Math.sin(a), 1.02)])
  }
  kv.ekle(yer(dondurG(p, parca, [1, 1]), x, y, z), mal)
}

/** Alem: dilimli küçük tepelik. */
export function alem(kv: Kova, x: number, y: number, z: number, mal: Mal, olcek = 1) {
  const p: [number, number][] = [[0.14, 0], [0.05, 0.12], [0.13, 0.28], [0.04, 0.46], [0.1, 0.58], [0.02, 0.9], [0, 0.95]]
  kv.ekle(yer(dondurG(p.map(([r, h]) => [r * olcek, h * olcek] as [number, number]), 8), x, y, z), mal)
}

/** Çokgen kasnak: yan yüz, üstte silme. */
export function kasnak(kv: Kova, x: number, y0: number, y1: number, z: number, R: number, n: number, mal: Mal, silme: Mal) {
  const h = y1 - y0
  kv.ekle(yer(duzGolge(silindirG(R, R, h, n, true).rotateY(Math.PI / n)), x, y0 + h / 2, z), mal)
  kv.ekle(yer(duzGolge(silindirG(R + 0.22, R + 0.06, 0.32, n, true).rotateY(Math.PI / n)), x, y1 - 0.14, z), silme)
}

/** Duvar yüzüne sivri kemerli ince bezeme (pencere, niş). `ileri`: yerel +z kayması. */
export function kemerYuz(kv: Kova, x: number, z: number, ry: number, u: number, y: number, g: number, duz: number, k: number, ileri: number, mal: Mal) {
  const geo = uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), u, y, g, duz, k), 10)).translate(0, 0, ileri)
  kv.ekle(yer(geo, x, 0, z, ry), mal)
}

/** Sivri kemerli çerçeve halkası. */
export function kemerHalka(kv: Kova, x: number, z: number, ry: number, u: number, y: number, g: number, duz: number, k: number, kalin: number, ileri: number, mal: Mal, derinlik = 0.08) {
  const s = kemer(new THREE.Shape(), u, y - kalin, g + kalin * 2, duz + kalin, k + kalin)
  s.holes.push(kemer(new THREE.Path(), u, y, g, duz, k))
  kv.ekle(yer(cikar(s, derinlik, ileri), x, 0, z, ry), mal)
}

/** Kare veya dikdörtgen tabandan daireye geçen kabuk; iç mekânda kubbeyi taşır. */
export function gecisKabugu(cx: number, cz: number, ax: number, az: number, y0: number, y1: number, R: number, parca = 32, sira = 4) {
  const konum: number[] = [], uv: number[] = [], dizin: number[] = []
  for (let s = 0; s <= sira; s++) {
    const t = s / sira, e = Math.pow(t, 0.8)
    for (let a = 0; a <= parca; a++) {
      const teta = (a / parca) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
      const uzak = Math.min(Math.abs(dx) > 1e-4 ? ax / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-4 ? az / Math.abs(dz) : Infinity)
      const r = THREE.MathUtils.lerp(uzak, R, e)
      konum.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / parca * 2, t)
    }
  }
  for (let s = 0; s < sira; s++) for (let a = 0; a < parca; a++) {
    const p = s * (parca + 1) + a, q = p + parca + 1
    dizin.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(dizin)
  g.computeVertexNormals()
  return g
}

/** İç kubbe: kasnak yarıçapından tepeye. */
export function icKubbeG(R: number, H: number) {
  const p: [number, number][] = []
  for (let t = 0; t <= 16; t++) {
    const a = (t / 16) * Math.PI / 2
    p.push([Math.max(R * Math.cos(a), 0.001), H * Math.sin(a)])
  }
  return dondurG(p, 56, [1, 1])
}
