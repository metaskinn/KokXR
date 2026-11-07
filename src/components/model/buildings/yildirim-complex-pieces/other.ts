// Külliyenin diğer yapıları: türbe, medrese, darüşşifa, şadırvan köşkü ve bahçe.
// Yerleşim ve kütleler fotoğraftan (Drive; envanter s. 162 havadan görünüm) oranlanmış, ölçüler envanterden alınmıştır
// (türbe 10,50 m kare, s. 204; medrese avlusu 200 m² ve dershane 8,65 × 8,86 m, s. 186; darüşşifa 30 × 53 m, s. 195).
// Darüşşifa gerçekte yaklaşık 300 m doğudadır (s. 193); makete sığsın diye yakına alınmıştır.
import * as THREE from 'three'
import { rotateG, flatShadow, arch, Bucket, boxG, cylinderG, place } from '../../uluMosquePiece'
import { tree, alternatingArch, roof, outerDrum, outerDome, outerWindow, wallX, wallZ, boxK, cypress, molding, type Mat, type YM } from './common'

const LAYOUT = {
  tomb: { x: -4, z: -54, ry: 0.76 },
  madrasa: { x: -41, z: -36, ry: 0.76 },
  hospital: { x: 52, z: -36, ry: -Math.PI / 2 },
}

interface Y { ext: (g: THREE.BufferGeometry, mat: Mat) => void; roof: (g: THREE.BufferGeometry, mat: Mat) => void; drum: Bucket; dome: Bucket; put: (kv: Bucket, g: THREE.BufferGeometry, mat: Mat) => void }
function builtIn(k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket, p: { x: number; z: number; ry: number }): Y {
  return {
    ext: (g, mat) => k.add(place(g, p.x, 0, p.z, p.ry), mat),
    roof: (g, mat) => kRoof.add(place(g, p.x, 0, p.z, p.ry), mat),
    drum: kDrum, dome: kDome,
    put: (kv, g, mat) => kv.add(place(g, p.x, 0, p.z, p.ry), mat),
  }
}

/** Dış duvarın boyunca pencere dizisi: `yon` duvarın baktığı yöne göre döndürülür. */
function windowArray(y: Y, m: YM, ry: number, ox: number, oz: number, xList: number[], y0: number, g: number, h: number, pointed: boolean, casing: Mat) {
  const ext = (a: THREE.BufferGeometry, mat: Mat) => { y.ext(place(a, ox, 0, oz, ry), mat) }
  for (const x of xList) outerWindow(ext, m, x, y0, g, h, 0, pointed, casing)
}

export function tomb(m: YM, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {
  const y = builtIn(k, kRoof, kDrum, kDome, LAYOUT.tomb)
  const { ext } = y
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat) => ext(boxK(x0, x1, y0, y1, z0, z1), mat)
  const B = 6.75, H = 8, TAB = 0.7, REV_Z = -B - 5.4
  // Kaide ve zemin
  box(-B - 0.5, B + 0.5, 0, TAB, -B - 5.9, B + 0.4, m.ashlarLight)
  for (let i = 0; i < 3; i++) box(-1.8 + i * 0.1, 1.8 - i * 0.1, 0, TAB * (3 - i) / 3, -B - 6.0 - (3 - i) * 0.4, -B - 6.0 - (2 - i) * 0.4, m.ashlarLight)
  // Gövde: dört duvar, içte sıva; köşelerde beyaz mermer (s. 204)
  const K = 1.1
  box(-B, B, TAB, H, -B, -B + K, m.alternating); box(-B, B, TAB, H, B - K, B, m.alternating)
  box(-B, -B + K, TAB, H, -B, B, m.alternating); box(B - K, B, TAB, H, -B, B, m.alternating)
  for (const [x, z] of [[-B, B], [B, B]] as const) box(x - 0.04 * Math.sign(-x) - 0.4, x + 0.4, TAB, H, z - 0.4, z + 0.04, m.whiteStone)
  const I = B - K - 0.03
  box(-I, I, TAB, TAB + 0.04, -I, I, m.carpetK)
  for (const [a, b, c, d] of [[-I, I, -I, -I + 0.04], [-I, I, I - 0.04, I], [-I, -I + 0.04, -I, I], [I - 0.04, I, -I, I]]) box(a, b, TAB, H - 0.1, c, d, m.plasterInner)
  // Sandukalar: Yıldırım Bayezid ortada, demir parmaklık içinde (s. 204, 207)
  const cenotaph = (x: number, z: number, g: number, d: number, h: number) => {
    ext(boxK(x - g / 2, x + g / 2, TAB, TAB + h, z - d / 2, z + d / 2), m.cenotaph)
    ext(new THREE.SphereGeometry(g * 0.3, 8, 5).scale(1, 0.55, 1).translate(x, TAB + h + 0.3, z - d / 2 + g * 0.45), m.cream)
    ext(cylinderG(g * 0.28, g * 0.24, 0.3, 8).translate(x, TAB + h + 0.14, z - d / 2 + g * 0.45), m.cream)
  }
  cenotaph(0, 0.2, 1, 2.6, 1.05); cenotaph(-2.2, 0.2, 0.85, 2.2, 0.85); cenotaph(2.2, 0.2, 0.85, 2.2, 0.85); cenotaph(-0.9, 3.1, 0.55, 1.1, 0.55); cenotaph(0.9, 3.1, 0.55, 1.1, 0.55)
  for (let i = 0; i <= 12; i++) { const z = -1.5 + i * 0.3; for (const x of [-0.9, 0.9]) ext(boxK(x - 0.02, x + 0.02, TAB, TAB + 1.35, z - 0.02, z + 0.02), m.greenIron) }
  for (let i = 0; i <= 6; i++) { const x = -0.9 + i * 0.3; for (const z of [-1.5, 2.1]) ext(boxK(x - 0.02, x + 0.02, TAB, TAB + 1.35, z - 0.02, z + 0.02), m.greenIron) }
  // Cephe pencereleri: batıda üç, doğuda iki (biri kapalı), güneyde iki (s. 204, 206). Dikdörtgen niş içinde sivri.
  const nicheB = (ry: number, ox: number, oz: number, xList: number[]) => {
    const e2 = (a: THREE.BufferGeometry, mat: Mat) => ext(place(a, ox, 0, oz, ry), mat)
    for (const x of xList) {
      e2(boxK(x - 0.75, x + 0.75, TAB + 0.9, TAB + 4.5, -0.04, 0.03), m.brickArch)
      e2(new THREE.ShapeGeometry(arch(new THREE.Shape(), x, TAB + 1.2, 0.95, 1.8, 1.05), 8).translate(0, 0, 0.04), m.ironDark)
      alternatingArch(e2, m, x, TAB + 1.2 + 1.8 - 0.01, 0.95, 0.01, 1.05, 0.22, 0.06, 0.03, 9)
    }
  }
  nicheB(0, 0, B, [-2.9, 2.9])
  nicheB(Math.PI / 2, B, 0, [-3.4, 0, 3.4])
  nicheB(-Math.PI / 2, -B, 0, [-3.4, 3.4])
  // Saçak silmesi ve kurşun etek
  molding(ext, m.brickArch, -B - 0.1, B + 0.1, H - 0.28, H, -B - 0.1, B + 0.1, 0.4)
  roof((g) => y.roof(g, m.lead), -B, B, -B, B, H, H + 0.8, 0.5, 0.9, [{ x: 0, z: 0, r: 5.3 }])
  // Kasnak ve kubbe: sekizgen, üç penceresi; kubbe iri mukarnasla oturur (s. 204)
  const R = LAYOUT.tomb
  const gx = (lx: number, lz: number) => [R.x + lx * Math.cos(R.ry) + lz * Math.sin(R.ry), R.z - lx * Math.sin(R.ry) + lz * Math.cos(R.ry)] as const
  const [cx, cz] = gx(0, 0)
  outerDrum(y.put, kDrum, m, 0, 0, H + 0.45, 2.5, 6.2, 8, 3)
  outerDome((kv, g, mat) => kv.add(g, mat), kDome, m, cx, cz, H + 2.9, 6.3, 4.9, 1.1)
  // Üstten bakınca: iç kapak (parçalanmış görünüşte içeri görülür)
  // Revak: önde üç, yanlarda birer sivri kemer; köşelerde mermer ayak, ortada koyu bordo iki sütun; üç kubbe (s. 204)
  const RH = 6.9
  const frontDel = [-3.85, 3.85].map((x) => arch(new THREE.Path(), x, TAB + 3.0, 3.45, 0.02, 2.05))
  frontDel.push(arch(new THREE.Path(), 0, TAB + 3.0, 3.6, 0.02, 2.15))
  ext(wallX(-B, B, REV_Z, REV_Z + 1.1, TAB + 3, RH, frontDel), m.alternating)
  for (const s of [-1, 1]) {
    const [a, b] = s > 0 ? [B - 1.1, B] : [-B, -B + 1.1]
    const side = arch(new THREE.Path(), (REV_Z - B) / 2 + 0.2, TAB + 3, 2.9, 0.02, 2.05)
    ext(wallZ(a, b, REV_Z, -B, TAB + 3, RH, [side]), m.alternating)
    box(s > 0 ? B - 1.45 : -B, s > 0 ? B : -B + 1.45, TAB, TAB + 3.1, REV_Z, REV_Z + 1.45, m.whiteStone)
    box(s > 0 ? B - 1.1 : -B, s > 0 ? B : -B + 1.1, TAB, TAB + 3.1, -B - 1.2, -B, m.whiteStone)
    ext(cylinderG(0.26, 0.27, 2.75, 10).translate(s * 1.92, TAB + 1.5, REV_Z + 0.55), m.burgundy)
    ext(boxG(0.8, 0.28, 0.8).translate(s * 1.92, TAB + 0.14, REV_Z + 0.55), m.whiteStone)
    ext(cylinderG(0.56, 0.26, 0.45, 8).translate(s * 1.92, TAB + 3, REV_Z + 0.55), m.whiteStone)
    alternatingArch(ext, m, s * 3.85, TAB + 3.0, 3.45, 0.02, 2.05, 0.42, 0.08, REV_Z - 0.05, 15)
    const e3 = (a2: THREE.BufferGeometry, mat: Mat) => ext(place(a2, s * (B + 0.0), 0, (REV_Z - B) / 2 + 0.2, s * Math.PI / 2), mat)
    alternatingArch(e3, m, 0, TAB + 3, 2.9, 0.02, 2.05, 0.4, 0.06, -0.02, 13)
  }
  alternatingArch(ext, m, 0, TAB + 3.0, 3.6, 0.02, 2.15, 0.42, 0.08, REV_Z - 0.05, 15)
  // Kapı: koyu ahşap, kitabeli alınlık; yan pencereler
  box(-1.25, 1.25, TAB, TAB + 4.4, -B - 0.08, -B, m.whiteStone)
  box(-0.75, 0.75, TAB, TAB + 2.6, -B - 0.11, -B - 0.08, m.woodDark)
  box(-0.6, 0.6, TAB + 3.1, TAB + 3.7, -B - 0.11, -B - 0.08, m.goldDark)
  for (const s of [-1, 1]) {
    const x = s * 3.6
    const ser = new THREE.ShapeGeometry(arch(new THREE.Shape(), x, TAB + 0.9, 1, 1.5, 0.9), 8).rotateY(0).translate(0, 0, -B - 0.05)
    ext(ser, m.ironDark)
  }
  box(-B + 0.1, B - 0.1, TAB + 0.0, TAB + 0.02, REV_Z + 1, -B, m.marbleDark)
  molding(ext, m.brickArch, -B - 0.08, B + 0.08, RH - 0.16, RH, REV_Z - 0.1, -B, 0.3)
  roof((g) => y.roof(g, m.lead), -B, B, REV_Z, -B, RH + 0.02, RH + 0.14, 0.42, 0.25, [])
  const rz = (REV_Z - B) / 2 + 0.45
  for (const x of [-4.25, 0, 4.25]) {
    const [dx, dz] = gx(x, rz)
    outerDome((kv, g, mat) => kv.add(g, mat), kDome, m, dx, dz, RH + 0.14, 1.9, 1.8, 0.65)
  }
}

export function madrasa(m: YM, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {
  const y = builtIn(k, kRoof, kDrum, kDome, LAYOUT.madrasa)
  const { ext } = y
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat) => ext(boxK(x0, x1, y0, y1, z0, z1), mat)
  // Yerel +x giriş (doğu), -x dershane (batı). Dış ölçü fotoğraftan, avlu 200 m² (s. 186).
  const X0 = -16, X1 = 17, ZD = 10.6, H = 6, AX0 = -11.8, AX1 = 11.4, AZ = 4.3
  const REV = 2.5
  box(X0 - 0.3, X1 + 0.3, 0, 0.5, -ZD - 0.3, ZD + 0.3, m.ashlar)
  // Dış duvar: almaşık; giriş cephesi beyaz kesme taş (s. 185)
  box(X0, X1 - 0.8, 0.5, H, -ZD, -ZD + 0.8, m.alternating)
  box(X0, X1 - 0.8, 0.5, H, ZD - 0.8, ZD, m.alternating)
  box(X0, X0 + 0.8, 0.5, H, -ZD, ZD, m.alternating)
  const port = arch(new THREE.Path(), 0, 0.5, 4.2, 3.2, 2.9)
  ext(wallZ(X1 - 1, X1, -ZD, ZD, 0.5, 8.2, [port]), m.whiteStone)
  // Çerçeve
  for (const [a, b, c, d] of [[-3.2, -2.9, 0.5, 7.7], [2.9, 3.2, 0.5, 7.7], [-3.2, 3.2, 7.4, 7.7]]) box(X1, X1 + 0.1, c, d, a, b, m.whiteStone)
  box(X1 - 2.2, X1 - 2, 0.5, 4, -2.3, 2.3, m.woodDark)
  // Yan odalar penceresi: giriş cephesinde iki sivri nişli pencere
  for (const z of [-6.4, 6.4]) {
    const e2 = (a: THREE.BufferGeometry, mat: Mat) => ext(place(a, X1, 0, z, Math.PI / 2), mat)
    outerWindow(e2, m, 0, 2.1, 0.9, 1.5, 0, true, m.whiteStone)
  }
  // Oda pencereleri: dikdörtgen, sivri alınlıklı (s. 186); sekiz talebe odası
  const roomStep = (AX1 - AX0) / 8
  const rooms = Array.from({ length: 8 }, (_, i) => AX0 + (i + 0.5) * roomStep)
  windowArray(y, m, 0, 0, ZD, rooms, 2, 0.8, 1.35, true, m.whiteStone)
  windowArray(y, m, Math.PI, 0, -ZD, rooms.map((x) => -x), 2, 0.8, 1.35, true, m.whiteStone)
  // Kuzey cephe payandaları (s. 185)
  for (let i = 0; i < 5; i++) {
    const x = X0 + 4 + i * 6.2
    box(x - 0.45, x + 0.45, 0.2, 4.6, -ZD - 0.9, -ZD, m.alternating)
    const p = new THREE.CylinderGeometry(0.5, 0.86, 0.6, 4).rotateY(Math.PI / 4).scale(1, 1, 1).translate(x, 4.9, -ZD - 0.4)
    ext(flatShadow(p), m.lead)
  }
  // Oda sıraları: avlu tarafı duvar, oda kapıları
  box(AX0, AX1, 0.5, H, -AZ - REV - 0.6, -AZ - REV, m.alternating)
  box(AX0, AX1, 0.5, H, AZ + REV, AZ + REV + 0.6, m.alternating)
  for (const x of rooms) for (const s of [-1, 1]) {
    const zFace = s * (AZ + REV) - s * 0.01
    ext(new THREE.BoxGeometry(0.9, 2.2, 0.03).translate(x, 2.05, zFace), m.woodDark)
  }
  // Avlu: taban, sekizgen fıskiyeli havuz (s. 186)
  box(AX0, AX1, 0.42, 0.5, -AZ, AZ, m.grass)
  box(AX0, AX1, 0.42, 0.9, -AZ - REV, -AZ, m.brickArch)
  box(AX0, AX1, 0.42, 0.9, AZ, AZ + REV, m.brickArch)
  box(AX1 - 2.6, AX1, 0.42, 0.9, -AZ, AZ, m.brickArch)
  ext(flatShadow(cylinderG(2.05, 2.05, 0.6, 8)).translate(0, 0.8, 0), m.ashlarLight)
  ext(cylinderG(1.75, 1.75, 0.02, 8).translate(0, 1.11, 0), m.water)
  ext(rotateG([[0.45, 1.1], [0.35, 1.5], [0.12, 1.65], [0.05, 2], [0, 2.05]], 8), m.ashlarLight)
  // Avlu revakları: üç cephede sivri kemer; ayaklar almaşık (s. 186; fotoğraf)
  const ay = 0.9, RH = 4.9
  const archArray = (axisX: boolean, c0: number, c1: number, count: number, fixed: number) => {
    const step = (c1 - c0) / count
    const del = Array.from({ length: count }, (_, i) => arch(new THREE.Path(), c0 + (i + 0.5) * step, ay, step - 0.82, 1.5, 1.5))
    if (axisX) ext(wallX(c0, c1, fixed - 0.32, fixed + 0.32, ay, RH, del), m.alternating)
    else ext(wallZ(fixed - 0.32, fixed + 0.32, c0, c1, ay, RH, del), m.alternating)
    for (let i = 0; i < count; i++) {
      const c = c0 + (i + 0.5) * step
      if (axisX) {
        alternatingArch(ext, m, c, ay + 1.5, step - 0.82, 0.01, 1.5, 0.26, 0.04, fixed + 0.32, 11)
        alternatingArch(ext, m, c, ay + 1.5, step - 0.82, 0.01, 1.5, 0.26, 0.04, fixed - 0.36, 11)
      } else {
        const e2 = (a: THREE.BufferGeometry, mat: Mat) => ext(place(a, fixed, 0, c, Math.PI / 2), mat)
        alternatingArch(e2, m, 0, ay + 1.5, step - 0.82, 0.01, 1.5, 0.26, 0.04, 0.32, 11)
        alternatingArch(e2, m, 0, ay + 1.5, step - 0.82, 0.01, 1.5, 0.26, 0.04, -0.36, 11)
      }
    }
  }
  archArray(true, AX0, AX1, 8, -AZ - 0.32)
  archArray(true, AX0, AX1, 8, AZ + 0.32)
  archArray(false, -AZ, AZ, 3, AX1 - 2.6 - 0.32)
  // Örtü: odalarda uzunlamasına beşik tonoz, revakta düşük tonoz, kurşun (s. 186)
  const barrel = (x0: number, x1: number, zo: number, gen: number, y0: number, burden: number) => {
    const n = 14, c = (x0 + x1) / 2, L = x1 - x0
    const g = new THREE.CylinderGeometry(gen / 2, gen / 2, L, n, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, burden / (gen / 2), 1).translate(c, y0, zo)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * gen * 1.6, uv.getY(i) * L)
    y.roof(g, m.lead)
  }
  for (const s of [-1, 1]) {
    barrel(X0 - 0.2, AX1, s * (AZ + REV + 2.15), 4.4, H, 1.15)
    barrel(AX0 - 0.2, AX1, s * (AZ + REV / 2 - 0.05), REV + 0.8, RH, 0.5)
    y.roof(boxK(X0, AX1, H - 0.06, H + 0.08, s > 0 ? AZ + REV - 0.1 : -ZD, s > 0 ? ZD : -AZ - REV + 0.1), m.lead)
    y.roof(boxK(AX0, AX1, RH - 0.1, RH + 0.1, s > 0 ? AZ : -AZ - REV, s > 0 ? AZ + REV : -AZ), m.lead)
    // Baca dizisi: kare gövde, piramit başlık (fotoğraf)
    for (const x of rooms) {
      const zb = s * (ZD - 0.9)
      y.roof(boxK(x - 0.32, x + 0.32, H, H + 1.55, zb - 0.32, zb + 0.32), m.ashlarLight)
      y.roof(flatShadow(new THREE.ConeGeometry(0.56, 0.55, 4).rotateY(Math.PI / 4).translate(x, H + 1.82, zb)), m.lead)
    }
  }
  // Giriş kütlesi: üstte düz kurşun ve iki kubbe (dershane ucu büyük kubbe)
  y.roof(boxK(AX1, X1 - 0.8, H + 1.2, H + 1.34, -ZD, ZD), m.lead)
  box(AX1, X1 - 1, 0.5, H + 1.2, -ZD, -3.3, m.alternating)
  box(AX1, X1 - 1, 0.5, H + 1.2, 3.3, ZD, m.alternating)
  box(X1 - 5.4, X1 - 1, 0.5, 0.9, -3.3, 3.3, m.marbleDark)
  box(AX1, AX1 + 0.5, 0.5, H + 1.2, -3.3, -1.2, m.alternating)
  box(AX1, AX1 + 0.5, 0.5, H + 1.2, 1.2, 3.3, m.alternating)
  const R = LAYOUT.madrasa
  const gx = (lx: number, lz: number) => [R.x + lx * Math.cos(R.ry) + lz * Math.sin(R.ry), R.z - lx * Math.sin(R.ry) + lz * Math.cos(R.ry)] as const
  for (const [lx, r, kas] of [[14.4, 3.1, H + 1.3], [9.2, 2.45, H + 0.6]] as const) {
    outerDrum(y.put, kDrum, m, lx, 0, kas, 1.6, r, 8, r > 3 ? 0 : 4)
    const [dx, dz] = gx(lx, 0)
    outerDome((kv, g, mat) => kv.add(g, mat), kDome, m, dx, dz, kas + 1.5, r + 0.1, r > 3 ? 2.6 : 2.1, 0.8)
  }
  // Dershane: 8,65 × 8,86 m iç ölçü, sekizgen kasnak, kurşun kubbe (s. 186)
  const DX1 = X0 + 1.1, DX0 = DX1 - 10.6, DZ = 5.45
  box(DX0 - 0.3, DX1, 0, 0.5, -DZ - 0.3, DZ + 0.3, m.ashlar)
  box(DX0, DX1, 0.5, 8.6, -DZ, -DZ + 1, m.alternating)
  box(DX0, DX1, 0.5, 8.6, DZ - 1, DZ, m.alternating)
  box(DX0, DX0 + 1, 0.5, 8.6, -DZ, DZ, m.alternating)
  box(DX1 - 1, DX1, 0.5, 8.6, -DZ, DZ, m.alternating)
  molding(ext, m.brickArch, DX0 - 0.1, DX1 + 0.1, 8.45, 8.7, -DZ - 0.1, DZ + 0.1, 0.4)
  roof((g) => y.roof(g, m.lead), DX0, DX1, -DZ, DZ, 8.7, 9.2, 0.35, 0.6, [])
  const dxo = (DX0 + DX1) / 2
  outerDrum(y.put, kDrum, m, dxo, 0, 9.05, 1.9, 4.95, 8, 4)
  const [dxx, dzz] = gx(dxo, 0)
  outerDome((kv, g, mat) => kv.add(g, mat), kDome, m, dxx, dzz, 10.85, 5.1, 3.9, 0.95)
  // Dershaneye bakan iki pencere (cephe)
  for (const s of [-1, 1]) {
    const e2 = (a: THREE.BufferGeometry, mat: Mat) => ext(place(a, dxo, 0, s * DZ, s > 0 ? 0 : Math.PI), mat)
    outerWindow(e2, m, -2.2, 2.4, 1, 1.7, 0, true, m.whiteStone)
    outerWindow(e2, m, 2.2, 2.4, 1, 1.7, 0, true, m.whiteStone)
  }
}

export function hospital(m: YM, k: Bucket, kRoof: Bucket, kDrum: Bucket, kDome: Bucket) {
  const y = builtIn(k, kRoof, kDrum, kDome, LAYOUT.hospital)
  const { ext } = y
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat) => ext(boxK(x0, x1, y0, y1, z0, z1), mat)
  // Yerel: +x güney (kubbeli salon), -x kuzey (giriş). 30 × 53 m (s. 195), 420 m² avlu (s. 198).
  const LX = 26.5, ZD = 15, H = 6.2, AX = 16.5, AZ = 6.35, D = 0.9
  box(-LX - 0.3, LX + 0.3, 0, 0.5, -ZD - 0.3, ZD + 0.3, m.ashlar)
  box(-LX, LX, 0.5, H, -ZD, -ZD + D, m.rubble); box(-LX, LX, 0.5, H, ZD - D, ZD, m.rubble)
  box(LX - D, LX, 0.5, H, -ZD, ZD, m.rubble)
  const container = arch(new THREE.Path(), 0, 0.5, 2.8, 2.3, 1.9)
  ext(wallZ(-LX, -LX + D, -ZD, ZD, 0.5, H, [container]), m.rubble)
  box(-LX - 0.03, -LX + 0.2, 0.5, H, -2.9, 2.9, m.ashlarLight)
  ext(wallZ(-LX - 0.1, -LX + 0.25, -2.9, 2.9, 0.5, H + 0.6, [arch(new THREE.Path(), 0, 0.5, 2.8, 2.3, 1.9)]), m.ashlarLight)
  box(-LX + 0.4, -LX + 0.5, 0.5, 3.7, -1.5, 1.5, m.woodDark)
  for (let i = 0; i < 3; i++) box(-LX - 0.1 - (3 - i) * 0.35, -LX - 0.1 - (2 - i) * 0.35, 0, 0.5 * (3 - i) / 3, -2.2, 2.2, m.ashlarLight)
  // Köşelerde kesme taş ve tuğla; büyük yuvarlak kemerler (s. 198)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const e2 = (a: THREE.BufferGeometry, mat: Mat) => ext(place(a, sx * (LX - 4), 0, sz * ZD, sz > 0 ? 0 : Math.PI), mat)
    alternatingArch(e2, m, 0, 3.1, 4.6, 0.01, 2.3, 0.42, 0.06, 0, 17)
    box(sx * LX - 0.4, sx * LX + 0.4, 0.5, H, sz * ZD - 0.4, sz * ZD + 0.4, m.alternating)
  }
  // Pencereler: 34 dış pencere; dikdörtgen, küfeki söveli, sivri kemerli (s. 198)
  const array = Array.from({ length: 10 }, (_, i) => -LX + 7.5 + i * 3.9)
  windowArray(y, m, 0, 0, ZD, array, 2, 0.9, 1.4, true, m.ashlarLight)
  windowArray(y, m, Math.PI, 0, -ZD, array, 2, 0.9, 1.4, true, m.ashlarLight)
  // Oda sırası ve sivri kemerli revak
  box(-AX, AX, 0.5, H, -AZ - 2.6 - 0.5, -AZ - 2.6, m.rubble); box(-AX, AX, 0.5, H, AZ + 2.6, AZ + 2.6 + 0.5, m.rubble)
  box(-AX, AX, 0.42, 0.5, -AZ, AZ, m.grass)
  box(-AX, AX, 0.42, 0.95, -AZ - 2.6, -AZ, m.brickArch)
  box(-AX, AX, 0.42, 0.95, AZ, AZ + 2.6, m.brickArch)
  ext(flatShadow(cylinderG(1.9, 2.1, 0.75, 8)).translate(0, 0.85, 0), m.ashlarLight)
  ext(cylinderG(1.65, 1.65, 0.02, 8).translate(0, 1.21, 0), m.water)
  ext(rotateG([[0.4, 1.2], [0.3, 1.7], [0.1, 1.9], [0.04, 2.15], [0, 2.2]], 8), m.ashlarLight)
  const step = (AX * 2) / 9, RH = 5.2
  for (const s of [-1, 1]) {
    const del = Array.from({ length: 9 }, (_, i) => arch(new THREE.Path(), -AX + (i + 0.5) * step, 0.95, step - 0.9, 1.6, 1.5))
    ext(wallX(-AX, AX, s * AZ - 0.3, s * AZ + 0.3, 0.95, RH, del), m.alternating)
    for (let i = 0; i < 9; i++) {
      const c = -AX + (i + 0.5) * step
      alternatingArch(ext, m, c, 0.95 + 1.6, step - 0.9, 0.01, 1.5, 0.26, 0.04, s * AZ + 0.3, 11)
      alternatingArch(ext, m, c, 0.95 + 1.6, step - 0.9, 0.01, 1.5, 0.26, 0.04, s * AZ - 0.34, 11)
    }
    // Örtü ve bacalar
    y.roof(boxK(-LX, LX, H - 0.04, H + 0.1, s > 0 ? AZ + 2.4 : -ZD, s > 0 ? ZD : -AZ - 2.4), m.lead)
    y.roof(boxK(-AX, AX, RH - 0.05, RH + 0.14, s > 0 ? AZ - 0.35 : -AZ - 2.7, s > 0 ? AZ + 2.7 : -AZ + 0.35), m.lead)
    const zb = s * (ZD - 1.4)
    for (const x of array) {
      y.roof(boxK(x - 0.32, x + 0.32, H, H + 1.4, zb - 0.32, zb + 0.32), m.ashlarLight)
      y.roof(flatShadow(new THREE.ConeGeometry(0.55, 0.5, 4).rotateY(Math.PI / 4).translate(x, H + 1.65, zb)), m.lead)
    }
  }
  // Uç kitleler: kuzeyde hekim odaları, güneyde kubbeli salon ve tonozlu iki oda
  box(-LX, -AX, 0.5, H + 0.1, -ZD, -3, m.rubble); box(-LX, -AX, 0.5, H + 0.1, 3, ZD, m.rubble)
  y.roof(boxK(-LX - 0.2, -AX, H + 0.1, H + 0.3, -ZD - 0.2, ZD + 0.2), m.lead)
  box(AX, AX + 0.6, 0.5, H + 2.6, -AZ - 2.6, AZ + 2.6, m.alternating)
  box(AX, LX, 0.5, H + 0.1, -ZD, -5, m.rubble); box(AX, LX, 0.5, H + 0.1, 5, ZD, m.rubble)
  y.roof(boxK(AX, LX + 0.2, H + 0.1, H + 0.3, -ZD - 0.2, -4.6), m.lead)
  y.roof(boxK(AX, LX + 0.2, H + 0.1, H + 0.3, 4.6, ZD + 0.2), m.lead)
  box(AX + 0.6, LX, 0.5, H + 2.6, -5, -4.4, m.alternating); box(AX + 0.6, LX, 0.5, H + 2.6, 4.4, 5, m.alternating)
  box(LX - 0.9, LX, 0.5, H + 2.6, -5, 5, m.alternating)
  // Kubbeli salon: 9,40 × 7,67 m, sekizgen kasnak (s. 198)
  const sx = AX + 5
  y.roof(boxK(AX, LX + 0.2, H + 2.6, H + 2.84, -5.2, 5.2), m.lead)
  outerDrum(y.put, kDrum, m, sx, 0, H + 2.7, 1.8, 4.7, 8, 4)
  const R = LAYOUT.hospital
  const gx = (lx: number, lz: number) => [R.x + lx * Math.cos(R.ry) + lz * Math.sin(R.ry), R.z - lx * Math.sin(R.ry) + lz * Math.cos(R.ry)] as const
  const [dx, dz] = gx(sx, 0)
  outerDome((kv, g, mat) => kv.add(g, mat), kDome, m, dx, dz, H + 4.45, 4.85, 3.4, 0.85)
}

export function fountainKiosk(m: YM, k: Bucket, kDome: Bucket, x: number, z: number) {
  const e = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z), mat)
  const R = 3.3
  e(flatShadow(cylinderG(R + 0.5, R + 0.5, 0.25, 8).rotateY(Math.PI / 8)).translate(0, 0.12, 0), m.ashlarLight)
  e(flatShadow(cylinderG(1.5, 1.5, 0.7, 8)).translate(0, 0.6, 0), m.ashlarLight)
  e(cylinderG(1.3, 1.3, 0.02, 8).translate(0, 0.96, 0), m.water)
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + n * Math.PI / 4
    e(cylinderG(0.13, 0.15, 3, 8).translate(R * Math.sin(a), 1.75, R * Math.cos(a)), m.woodDark)
  }
  e(flatShadow(cylinderG(R + 0.2, R + 0.1, 0.34, 8).rotateY(Math.PI / 8)).translate(0, 3.35, 0), m.woodDark)
  e(flatShadow(cylinderG(R - 0.3, R + 0.8, 0.5, 8, true).rotateY(Math.PI / 8)).translate(0, 3.7, 0), m.lead)
  outerDome((kv, g, mat) => kv.add(g, mat), kDome, m, x, z, 3.95, R - 0.1, 1.7, 0.5)
}

export function site(m: YM, k: Bucket, Rk: number, oz: number) {
  const e = (g: THREE.BufferGeometry, mat: Mat) => k.add(g, mat)
  const uvFlat = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
    return g
  }
  // Çim kaide ve döşeli avlular: fotoğraftaki taş döşeli geniş alan
  e(uvFlat(new THREE.CircleGeometry(Rk - 0.6, 80).rotateX(-Math.PI / 2).translate(0, 0.01, -oz)), m.grass)
  const path = (pts: [number, number][], y: number) => {
    const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
    e(uvFlat(new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2).translate(0, y, 0)), m.paving)
  }
  // Cami çevresi
  path([[-22, -29], [22, -29], [23, 11], [10, 24], [-10, 24], [-23, 11]], 0.03)
  // Türbe ve medrese arasındaki avlu
  path([[-34, -26], [-3, -33], [17, -48], [-1, -74], [-30, -58], [-56, -18], [-44, -8]], 0.035)
  // Darüşşifa çevresi
  path([[33, -68], [71, -68], [71, -5], [33, -5]], 0.03)
  // İki terası ayıran kagir istinat duvarı (fotoğraf)
  const wall = (a: [number, number], b: [number, number], h: number) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const g = boxG(L, h, 0.6).rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])).translate((a[0] + b[0]) / 2, h / 2, (a[1] + b[1]) / 2)
    e(g, m.rubble)
  }
  wall([-23, -28], [6, -36], 1.5)
  wall([6, -36], [24, -28], 1.5)
  // Ağaçlar: yalnız fotoğraftaki yeşil dokuyu andırır; konumları temsilîdir
  const ag: [number, number, number, boolean][] = [
    [29, -12, 13, false], [31, 6, 12, false], [26, 21, 11, true], [-27, 18, 12, false], [-29, 3, 13, true], [-31, -8, 10, false],
    [-8, 31, 12, false], [13, 34, 11, true], [-22, 36, 10, false], [40, 26, 13, false], [-42, 28, 12, true], [8, -33, 9, true], [-18, -34, 8, false],
    [22, -38, 12, false], [26, -62, 13, false], [17, -72, 11, true], [-22, -76, 11, false], [-50, -60, 13, false], [-62, -44, 12, true],
    [-70, -22, 11, false], [-60, 2, 13, false], [-47, 18, 11, true], [62, 12, 12, false], [76, -22, 9, false], [46, 40, 10, true],
  ]
  ag.forEach(([x, z, b, s], i) => tree(e, m, x, z, b, s, 100 + i))
  for (const [x, z, b] of [[-14, -71, 15], [-9, -74, 13], [-30, -64, 14], [13, -56, 14], [-34, -6, 12], [-22, 30, 13], [28, 30, 12], [58, 26, 12], [36, -10, 11]] as const) cypress(e, m, x, z, b)
}
