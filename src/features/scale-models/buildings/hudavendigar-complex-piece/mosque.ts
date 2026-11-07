// Hudâvendigâr Camii ve üst kattaki medresesi. Plan ölçüleri plan.ts'te. Cephe, minare, kubbe ve iç mekân biçimleri
// envanter fotoğraflarına bakılarak temsilî yorumlanmıştır. Hat yazısı taklit edilmez.
import * as THREE from 'three'
import { Bucket, type Mat, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, uvFit, place } from '../../uluMosquePiece'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { ComplexMaterials } from './textures'
import {
  APSE_X, APSE_Z, BACK_X, BACK_Z, LEG_G, LEGS, OPENING, STAIR_STEP, SECTIONS, IWAN_H, ENTRY_HALL, BODY_Z, HALL, HALL_H,
  MAHFIL, MADRASA_Y, STAIRS, STAIRS_DOOR, MINBAR, NICHE, FRONT_Z, PORTICO_BACK, PORTICO_H, PORTICO_Z, EAVE_Y, SAD, SAD_Z, SOFA_H, BASE, TIP_LEG,
  HALF_X, YESIK, lowerMasses, pavings, upperMasses,
} from './plan'

const TOP0 = 7.5 // medrese katmanının başladığı yükseklik

/** Dünya koordinatından duvar UV'si: örgü sıraları bütün parçalarda aynı hizada kalır. */
export function wallUV(g: THREE.BufferGeometry) {
  const d = g.index ? g.toNonIndexed() : g
  const p = d.attributes.position, n = d.attributes.normal, uv = d.attributes.uv
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i))
    if (ny > 0.7) uv.setXY(i, p.getX(i), p.getZ(i))
    else uv.setXY(i, nz >= nx ? p.getX(i) : p.getZ(i), p.getY(i))
  }
  return d
}

/** Tepesi sivri açıklığın üstünü dolduran alınlık: alt kenarı kemerdir, üstü `ust` yüksekliğine çıkar. */
export function archTop(w: number, yS: number, h: number, top: number) {
  const o = w / 2, s = new THREE.Shape()
  s.moveTo(-o, yS)
  s.quadraticCurveTo(-o, yS + h * 0.55, 0, yS + h)
  s.quadraticCurveTo(o, yS + h * 0.55, o, yS)
  s.lineTo(o, top); s.lineTo(-o, top); s.closePath()
  return s
}

/** Yerel x dünya z'sine döner; yerel derinlik x'ten -x yönüne uzanır. */
export const zPlane = (g: THREE.BufferGeometry, x: number, zm: number) => g.rotateY(-Math.PI / 2).translate(x, 0, zm)

/** Sivri kemerin çevresinde sırayla iki malzemeden örülen taşlar. */
export function archStones(cx: number, yS: number, o: number, h: number, stay: number, n: number, der: number, z: number) {
  const points = (oo: number, hh: number, t: number) => {
    const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t
    return [a * -oo + b * -oo, a * yS + b * (yS + hh * 0.55) + c * (yS + hh)] as const
  }
  const pieces: { g: THREE.BufferGeometry; second: boolean }[] = []
  for (const side of [-1, 1]) for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n
    const [ix0, iy0] = points(o, h, t0), [ix1, iy1] = points(o, h, t1)
    const [dx0, dy0] = points(o + stay, h + stay * 1.15, t0), [dx1, dy1] = points(o + stay, h + stay * 1.15, t1)
    const s = new THREE.Shape()
    s.moveTo(cx + ix0 * -side, iy0); s.lineTo(cx + dx0 * -side, dy0); s.lineTo(cx + dx1 * -side, dy1); s.lineTo(cx + ix1 * -side, iy1); s.closePath()
    pieces.push({ g: new THREE.ExtrudeGeometry(s, { depth: der, bevelEnabled: false }).translate(0, 0, z), second: i % 2 === 1 })
  }
  return pieces
}

/** Kare veya dikdörtgen tabandan daire ağza geçen pandantif yüzey. */
export function pendentiveG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, R: number) {
  const SEG = 48, ROW = 6
  const position: number[] = [], uv: number[] = [], index: number[] = []
  for (let s = 0; s <= ROW; s++) {
    const t = s / ROW, e = Math.pow(t, 0.72)
    for (let a = 0; a <= SEG; a++) {
      const theta = (a / SEG) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
      const far = Math.min(dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity, dz > 0 ? (z1 - cz) / dz : dz < 0 ? (z0 - cz) / dz : Infinity)
      const r = THREE.MathUtils.lerp(far, R, e)
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

/** Kırma çatı: mahya `eksen` boyuncadır; saçak y'den mahya yR'ye. */
export function hipRoof(x0: number, x1: number, z0: number, z1: number, y: number, yR: number, axis: 'x' | 'z') {
  const k: number[] = [], uv: number[] = []
  const tri = (a: number[], b: number[], c: number[]) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const ny = ab[2] * ac[0] - ab[0] * ac[2]
    for (const v of ny >= 0 ? [a, b, c] : [a, c, b]) { k.push(v[0], v[1], v[2]); uv.push(v[0], v[2]) }
  }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
  const A = [x0, y, z0], B = [x1, y, z0], C = [x1, y, z1], D = [x0, y, z1]
  if (axis === 'z') {
    const e = Math.min((x1 - x0) / 2, (z1 - z0) / 2)
    const R0 = [mx, yR, z0 + e], R1 = [mx, yR, z1 - e]
    tri(A, B, R0); tri(C, D, R1); tri(B, C, R1); tri(B, R1, R0); tri(D, A, R0); tri(D, R0, R1)
  } else {
    const e = Math.min((x1 - x0) / 2, (z1 - z0) / 2)
    const R0 = [x0 + e, yR, mz], R1 = [x1 - e, yR, mz]
    tri(D, A, R0); tri(B, C, R1); tri(A, B, R1); tri(A, R1, R0); tri(C, D, R0); tri(C, R0, R1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(k, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Kurşun kubbeyi üstten boyanmış dokuya bağlayan düzlemsel UV. */
function topDownUV(g: THREE.BufferGeometry, cx: number, cz: number, R: number) {
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - cx) / (2 * R) + 0.5, (p.getZ(i) - cz) / (2 * R) + 0.5)
  return g
}

export function setupMosque(m: UluMosqueMaterials, x: ComplexMaterials, k: Bucket, kTop: Bucket, kRoof: Bucket, kDome: Bucket) {
  const box = (g: number, h: number, d: number, mat: Mat, px: number, py: number, pz: number, kv = k) => kv.add(place(boxG(g, h, d), px, py, pz), mat)
  const uvBox = (g: number, h: number, d: number, mat: Mat, px: number, py: number, pz: number, kv = k) => kv.add(wallUV(place(boxG(g, h, d), px, py, pz)), mat)
  /** İki noktası verilen kutu. */
  const boxUpright = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Mat, kv = k) =>
    kv.add(place(boxG(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mat)

  // --- Taban kütlesi ve merdivenler ---
  uvBox(HALF_X * 2 + 0.3, 0.92, BODY_Z - FRONT_Z + 0.15, m.stone, 0, 0.46, (FRONT_Z + BODY_Z) / 2)
  uvBox(BACK_X * 2 + 0.3, 0.92, BACK_Z - BODY_Z + 0.1, m.stone, 0, 0.46, (BACK_Z + BODY_Z) / 2)
  for (let i = 0; i < 5; i++) {
    const d = (5 - i) * 0.42
    box(6.4 - i * 0.12, 0.2, d, m.marble, 0, (i + 0.5) * 0.2, FRONT_Z - d / 2)
  }
  // Son cemaat yeri: taş orta sahanlık, üç basamakla çıkılan yan sofalar
  boxUpright(-14.3, 14.3, 0.9, BASE, FRONT_Z + 0.02, PORTICO_BACK, m.paving)
  for (const s of [-1, 1]) {
    boxUpright(Math.min(s * 2.91, s * 14.3), Math.max(s * 2.91, s * 14.3), BASE, BASE + SOFA_H, FRONT_Z + 0.02, PORTICO_BACK, m.paving)
    boxUpright(Math.min(s * 2.91, s * 2.6), Math.max(s * 2.91, s * 2.6), BASE, BASE + SOFA_H * 0.5, FRONT_Z + 0.02, PORTICO_BACK, m.paving)
  }

  // --- Duvar kütleleri: yürüme alanıyla aynı plandan ---
  for (const r of lowerMasses()) boxUpright(r.x0, r.x1, 0.9, TOP0, r.z0, r.z1, x.wallInner)
  for (const r of upperMasses()) boxUpright(r.x0, r.x1, MADRASA_Y, EAVE_Y, r.z0, r.z1, x.wallInner, kTop)
  for (const r of pavings()) {
    boxUpright(r.x0, r.x1, TOP0, TOP0 + 0.2, r.z0, r.z1, x.ceiling, kTop)
    boxUpright(r.x0, r.x1, TOP0 + 0.2, MADRASA_Y, r.z0, r.z1, x.carpetRed, kTop)
  }

  // --- Kuzey cephesi: alt kat ---
  const frontBottom = rect(-HALF_X, 0, HALF_X, MADRASA_Y)
  const ARCH_S = 4.2, ARCH_H = 2
  for (const c of SECTIONS) frontBottom.holes.push(arch(new THREE.Path(), c, BASE, OPENING, ARCH_S - BASE, ARCH_H))
  k.add(wallUV(subtract(frontBottom, PORTICO_Z - FRONT_Z, FRONT_Z)), x.alternating)
  // Ayaklar kesme taş, kemer başlangıcında silme (s. 82-83)
  const legBox = (cx: number, g: number) => {
    uvBox(g + 0.04, ARCH_S - 0.05, PORTICO_Z - FRONT_Z + 0.04, m.stone, cx, (ARCH_S - 0.05) / 2, (FRONT_Z + PORTICO_Z) / 2)
    box(g + 0.2, 0.2, PORTICO_Z - FRONT_Z + 0.2, m.marble, cx, ARCH_S + 0.05, (FRONT_Z + PORTICO_Z) / 2)
  }
  LEGS.forEach((c) => legBox(c, LEG_G))
  for (const s of [-1, 1]) legBox(s * (HALF_X - TIP_LEG / 2), TIP_LEG)
  const stones = (cx: number, yS: number, o: number, h: number, stay: number, n: number, der: number, z: number, m1: Mat, m2: Mat, kv = k) => {
    for (const { g, second } of archStones(cx, yS, o, h, stay, n, der, z)) kv.add(g, second ? m2 : m1)
  }
  for (const c of SECTIONS) {
    // İki kademeli kemer: dışta taş-tuğla, içte taş; arada ahşap gergi
    stones(c, ARCH_S, OPENING / 2, ARCH_H, 0.5, 7, 0.09, FRONT_Z - 0.09, x.brickRough, m.stone)
    stones(c, ARCH_S, OPENING / 2 - 0.26, ARCH_H - 0.3, 0.26, 6, 0.3, FRONT_Z + 0.02, m.stone, m.stone)
    box(OPENING + 0.2, 0.16, 0.16, x.tension, c, ARCH_S + 0.05, FRONT_Z + 0.5)
    box(OPENING + 0.2, 0.16, 0.16, x.tension, c, ARCH_S + 0.05, PORTICO_Z - 0.3)
  }
  // Orta üç kemerin üstünde kuş evi olarak tasarlanmış küçük pencereler (s. 84-85)
  for (const c of SECTIONS.slice(1, 4)) {
    k.add(new THREE.ShapeGeometry(arch(new THREE.Shape(), c, 6.92, 0.34, 0.18, 0.28), 6).translate(0, 0, FRONT_Z - 0.015).rotateY(0), x.darkGlass)
    stones(c, 7.1, 0.17, 0.28, 0.12, 3, 0.05, FRONT_Z - 0.05, x.brickRough, m.marble)
  }
  // Kat silmesi
  box(HALF_X * 2 + 0.3, 0.24, 0.22, m.marble, 0, MADRASA_Y - 0.05, FRONT_Z - 0.06)

  // Korkuluk: beyaz çubuklar, üst ve alt kuşak (fotoğraflara göre)
  const railing = (x0: number, x1: number, y: number, z: number, kv: Bucket, dirZ = false) => {
    const L = Math.abs(x1 - x0), n = Math.floor(L / 0.24)
    const ext = (g: THREE.BufferGeometry) => {
      if (dirZ) g.rotateY(Math.PI / 2).translate(z, y, (x0 + x1) / 2)
      else g.translate((x0 + x1) / 2, y, z)
      kv.add(g, x.white)
    }
    ext(boxG(L, 0.09, 0.14).translate(0, 0.86, 0))
    ext(boxG(L, 0.09, 0.14).translate(0, 0.08, 0))
    for (let i = 0; i <= n; i++) ext(cylinderG(0.05, 0.05, 0.74, 5).translate(-L / 2 + (L * i) / n, 0.47, 0))
  }
  SECTIONS.forEach((c, i) => { if (i !== 2) railing(c - OPENING / 2, c + OPENING / 2, BASE + SOFA_H, FRONT_Z + 0.52, k) })

  // --- Kuzey cephesi: üst kat, medrese revağı ---
  const TOP_S = 10.2, TOP_H = 2.4, YS = 1.2
  const frontTop = rect(-HALF_X, MADRASA_Y, HALF_X, EAVE_Y)
  for (const c of SECTIONS) frontTop.holes.push(arch(new THREE.Path(), c, MADRASA_Y + 0.01, OPENING, TOP_S - MADRASA_Y, TOP_H))
  kTop.add(wallUV(subtract(frontTop, PORTICO_Z - FRONT_Z, FRONT_Z)), x.alternating)
  /** İkiz kemerli alınlık: büyük kemer sütunla ikiye bölünür. */
  const twinPediment = (o: number, s: number, H: number, yh: number) => {
    const e = new THREE.Shape(), i = 0.14
    const inner = (a: number, b: number) => {
      const om = (a + b) / 2
      e.quadraticCurveTo(a, s + yh * 0.55, om, s + yh)
      e.quadraticCurveTo(b, s + yh * 0.55, b, s)
    }
    e.moveTo(-o, s); inner(-o, -i); e.lineTo(i, s); inner(i, o)
    e.quadraticCurveTo(o, s + H * 0.55, 0, s + H)
    e.quadraticCurveTo(-o, s + H * 0.55, -o, s)
    e.closePath()
    return e
  }
  const column = (px: number, y0: number, y1: number, pz: number, kv: Bucket) => {
    kv.add(place(cylinderG(0.15, 0.17, y1 - y0 - 0.5, 10), px, (y0 + y1 - 0.5) / 2 + 0.1, pz), x.white)
    kv.add(place(cylinderG(0.25, 0.17, 0.4, 8), px, y1 - 0.2, pz), x.white)
    kv.add(place(cylinderG(0.22, 0.24, 0.2, 8), px, y0 + 0.1, pz), x.white)
    kv.add(place(boxG(0.55, 0.1, 0.55), px, y1 + 0.03, pz), x.white)
  }
  for (const c of SECTIONS) {
    kTop.add(wallUV(subtract(twinPediment(OPENING / 2, TOP_S, TOP_H, YS), 0.42, FRONT_Z + 0.4).translate(c, 0, 0)), x.alternating)
    stones(c, TOP_S, OPENING / 2, TOP_H, 0.46, 8, 0.1, FRONT_Z - 0.1, m.stone, x.brickRough, kTop)
    column(c, MADRASA_Y, TOP_S, FRONT_Z + 0.6, kTop)
    railing(c - OPENING / 2, c + OPENING / 2, MADRASA_Y, FRONT_Z + 0.22, kTop)
    for (const s of [-1, 1]) stones(c + s * (OPENING / 4 + 0.07), TOP_S, OPENING / 4 - 0.07, YS, 0.14, 4, 0.05, FRONT_Z + 0.34, m.stone, x.brickRough, kTop)
  }
  // Ortadaki geometrik panolar (fotoğrafa göre)
  for (const s of [-1, 1]) for (const c of [2.91, 8.73]) box(0.82, 1.6, 0.04, x.interlock, s * c, 12, FRONT_Z - 0.02, kTop)
  kTop.add(place(boxG(30.3, 0.12, 5.1), 0, MADRASA_Y - 0.06, -21.45), m.paving)

  // --- Doğu ve batı uçları: alt ve üstte ikiz kemer (s. 84, 92) ---
  const ZM = (FRONT_Z + PORTICO_BACK) / 2, TIP = 0.8 // revak uçları ortası
  const U0 = (PORTICO_Z + PORTICO_BACK) / 2 - ZM // açıklığın eksene göre konumu
  for (const s of [-1, 1]) {
    const px = s > 0 ? HALF_X : -HALF_X + TIP
    const alt = rect(FRONT_Z - ZM, 0, PORTICO_BACK - ZM, MADRASA_Y)
    for (const a of [-0.76, 0.76]) alt.holes.push(arch(new THREE.Path(), U0 + a, BASE + SOFA_H, 1.3, ARCH_S - BASE - SOFA_H, 1.1))
    k.add(wallUV(zPlane(subtract(alt, TIP), px, ZM)), x.alternating)
    column(s * 14.7, BASE + SOFA_H, ARCH_S, ZM + U0, k)
    railing(ZM + U0 - 1.5, ZM + U0 + 1.5, BASE + SOFA_H, s * 14.7, k, true)
    const top = rect(FRONT_Z - ZM, MADRASA_Y, PORTICO_BACK - ZM, EAVE_Y)
    top.holes.push(arch(new THREE.Path(), U0, MADRASA_Y + 0.01, 3, TOP_S - MADRASA_Y, 2.2))
    kTop.add(wallUV(zPlane(subtract(top, TIP), px, ZM)), x.alternating)
    kTop.add(wallUV(zPlane(subtract(twinPediment(1.5, TOP_S, 2.2, 1), 0.3).translate(U0, 0, 0), px - 0.25, ZM)), x.alternating)
    column(s * 14.7, MADRASA_Y, TOP_S, ZM + U0, kTop)
    railing(ZM + U0 - 1.5, ZM + U0 + 1.5, MADRASA_Y, s * 15, kTop, true)
    stones(0, TOP_S, 1.5, 2.2, 0.4, 7, 0.08, 0, m.stone, x.brickRough, new BucketRoute(kTop, (g) => g.translate(U0, 0, 0).rotateY(s * Math.PI / 2).translate(s * (HALF_X + 0.08) + (s > 0 ? -0.08 : 0.08), 0, ZM)) as unknown as Bucket)
  }

  // --- Son cemaat ve revak: enine kemerler, pandantif, kubbe (s. 83, 92) ---
  const sectionOpening = SECTIONS.map((c, i) => i === 0 ? [-14.3, -9.78] : i === 4 ? [9.78, 14.3] : [c - OPENING / 2, c + OPENING / 2])
  for (const a of LEGS) {
    k.add(zPlane(subtract(archTop(PORTICO_BACK - PORTICO_Z, ARCH_S, 2.05, TOP0), LEG_G), a + LEG_G / 2, (PORTICO_Z + PORTICO_BACK) / 2), m.stone)
    box(LEG_G + 0.1, 0.16, 0.16, x.tension, a, ARCH_S + 0.05, PORTICO_BACK - 0.3)
    box(LEG_G + 0.1, 3.3, 0.2, m.stone, a, 2.6, PORTICO_BACK - 0.08)
    kTop.add(zPlane(subtract(archTop(PORTICO_BACK - PORTICO_Z, TOP_S, 2.2, EAVE_Y), LEG_G), a + LEG_G / 2, (PORTICO_Z + PORTICO_BACK) / 2), x.ceiling)
  }
  sectionOpening.forEach(([a0, a1], i) => {
    const cx = (a0 + a1) / 2, cz = (PORTICO_Z + PORTICO_BACK) / 2
    k.add(pendentiveG(cx, cz, a0, a1, PORTICO_Z, PORTICO_BACK, 6.1, 6.95, 1.72), x.ceiling)
    const profile: [number, number][] = []
    for (let t = 0; t <= 8; t++) { const a = (t / 8) * Math.PI / 2; profile.push([Math.max(1.72 * Math.cos(a), 0.001), 0.72 * Math.sin(a)]) }
    const dome = place(rotateG(profile, 24, [1, 1]), cx, 6.95, cz)
    if (i === 2) k.add(topDownUV(dome, cx, cz, 1.72), x.boss) // orta bölümde madalyon (s. 85)
    else k.add(dome, x.ceiling)
    // Revak: yanlardakiler aynalı tonoz, ortadakiler kubbe (s. 92)
    if (i === 0 || i === 4) { boxUpright(a0, a1, 12.4, EAVE_Y, PORTICO_Z, PORTICO_BACK, x.ceiling, kTop); return }
    kTop.add(pendentiveG(cx, cz, a0, a1, PORTICO_Z, PORTICO_BACK, 12.35, 13.1, 1.72), x.ceiling)
    kTop.add(place(rotateG(profile, 24, [1, 1]), cx, 13.1, cz), x.ceiling)
  })

  // --- Dış duvar kaplaması ---
  const cladding = (L: number, cx: number, cz: number, ry: number, y0: number, y1: number, kv: Bucket, mat: Mat) => {
    kv.add(wallUV(place(boxG(L, y1 - y0, 0.06), cx, (y0 + y1) / 2, cz, ry)), mat)
  }
  const windowOuter = (cx: number, cz: number, ry: number, y0: number, g: number, h: number, kv: Bucket, arched: boolean) => {
    const ext = (geo: THREE.BufferGeometry, mat: Mat) => kv.add(place(geo, cx, 0, cz, ry), mat)
    if (arched) {
      ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y0, g, h, g * 0.6), 8).translate(0, 0, 0.1), x.darkGlass)
      const s = arch(new THREE.Shape(), 0, y0 - 0.1, g + 0.34, h + 0.1, g * 0.75)
      s.holes.push(arch(new THREE.Path(), 0, y0, g, h, g * 0.6))
      ext(subtract(s, 0.1, 0.03), m.marble)
    } else {
      ext(boxG(g, h, 0.03).translate(0, y0 + h / 2, 0.09), x.darkGlass)
      for (const a of [-1, 1]) ext(boxG(0.18, h + 0.3, 0.1).translate(a * (g / 2 + 0.09), y0 + h / 2, 0.08), m.marble)
      for (const a of [-1, 1]) ext(boxG(g + 0.36, 0.16, 0.1).translate(0, y0 + h / 2 + a * (h / 2 + 0.07), 0.08), m.marble)
    }
  }
  const eave = (L: number, cx: number, cz: number, ry: number, top = EAVE_Y) => {
    kTop.add(place(boxG(L, 0.8, 0.14), cx, top - 0.5, cz, ry), x.friezeBand)
    kTop.add(wallUV(place(boxG(L + 0.2, 0.24, 0.5), cx, top - 0.02, cz, ry)), m.stone)
  }
  const frontZ = (FRONT_Z + BODY_Z) / 2, frontL = BODY_Z - FRONT_Z
  const sideZ0 = PORTICO_BACK, sideL = BODY_Z - PORTICO_BACK, sideZ = (BODY_Z + PORTICO_BACK) / 2
  for (const s of [-1, 1]) {
    const ry = s * Math.PI / 2, X = s * (HALF_X + 0.03)
    cladding(sideL, X, sideZ, ry, 0.9, MADRASA_Y, k, x.sideFacade)
    cladding(sideL, X, sideZ, ry, MADRASA_Y, EAVE_Y, kTop, x.sideFacade)
    uvBox(0.12, 0.24, sideL, m.marble, X, MADRASA_Y - 0.05, sideZ)
    // Alt kat pencereleri tabhane odalarını, üsttekiler hücreleri aydınlatır
    for (const z of [-15, -7.6, 5.4]) windowOuter(X, z, ry, 3.2, 1.1, 1.7, k, false)
    windowOuter(X, -0.5, ry, 3.2, 1.1, 1.9, k, false)
    for (let i = 0; i < 6; i++) windowOuter(X, -9.8 + i * 3, ry, 10.1, 0.55, 0.85, kTop, false)
    for (const z of [-17, -13.8]) windowOuter(X, z, ry, 10.1, 0.55, 0.85, kTop, false)
    // Saçak altındaki sığ kemerler (fotoğrafa göre)
    for (let i = 0; i < 6; i++) {
      const zc = sideZ0 + (i + 0.5) * (sideL / 6)
      stonesSide(zc, X)
    }
    eave(frontL + 0.1, s * (HALF_X + 0.05), frontZ, ry)
    // Harim kütlesinin yan yüzü ve dönüşleri
    const rX = s * (BACK_X + 0.03), rZ = (BODY_Z + BACK_Z) / 2, rL = BACK_Z - BODY_Z
    cladding(rL, rX, rZ, ry, 0.9, MADRASA_Y, k, x.sideFacade)
    cladding(rL, rX, rZ, ry, MADRASA_Y, EAVE_Y, kTop, x.sideFacade)
    for (const z of [12.6, 17.8]) windowOuter(rX, z, ry, 4, 1, 1.9, k, false)
    windowOuter(rX, 15.2, ry, 10, 0.5, 1.3, kTop, true)
    eave(rL + 0.1, s * (BACK_X + 0.05), rZ, ry)
    const dL = HALF_X - BACK_X, dX = s * (HALF_X + BACK_X) / 2
    cladding(dL, dX, BODY_Z + 0.03, 0, 0.9, MADRASA_Y, k, x.sideFacade)
    cladding(dL, dX, BODY_Z + 0.03, 0, MADRASA_Y, EAVE_Y, kTop, x.sideFacade)
    for (const a of [-2.2, 2.2]) windowOuter(dX + a, BODY_Z + 0.03, 0, 3.6, 0.9, 1.5, k, false)
    for (const a of [-2.2, 2.2]) windowOuter(dX + a, BODY_Z + 0.03, 0, 10.1, 0.55, 0.85, kTop, false)
    eave(dL + 0.1, dX, BODY_Z + 0.05, 0)
    const gL = BACK_X - APSE_X, gX = s * (BACK_X + APSE_X) / 2
    cladding(gL, gX, BACK_Z + 0.03, 0, 0.9, MADRASA_Y, k, x.sideFacade)
    cladding(gL, gX, BACK_Z + 0.03, 0, MADRASA_Y, EAVE_Y, kTop, x.sideFacade)
    eave(gL + 0.1, gX, BACK_Z + 0.05, 0)
  }
  function stonesSide(zc: number, X: number) {
    const s = Math.sign(X)
    for (const { g, second } of archStones(0, 11.7, 2.1, 1.1, 0.3, 5, 0.06, 0)) {
      g.rotateY(s * Math.PI / 2).translate(X, 0, zc)
      kTop.add(g, second ? m.stone : x.brickRough)
    }
  }
  eave(HALF_X * 2 + 0.4, 0, FRONT_Z - 0.05, Math.PI)

  // Dışa taşan beş cepheli mihrap yuvası (s. 89)
  const apse = (y0: number, y1: number, kv: Bucket) => {
    const s = new THREE.Shape()
    s.moveTo(-APSE_X, -BACK_Z); s.lineTo(-APSE_X, -22.8); s.lineTo(-2.2, -APSE_Z); s.lineTo(2.2, -APSE_Z); s.lineTo(APSE_X, -22.8); s.lineTo(APSE_X, -BACK_Z); s.closePath()
    kv.add(wallUV(subtract(s, y1 - y0).rotateX(-Math.PI / 2).translate(0, y0, 0)), x.sideFacade)
  }
  apse(0, MADRASA_Y, k); apse(MADRASA_Y, EAVE_Y - 0.2, kTop)
  windowOuter(0, APSE_Z + 0.02, 0, 10, 0.6, 1.3, kTop, true)
  {
    const s = new THREE.Shape()
    s.moveTo(-APSE_X - 0.25, -BACK_Z); s.lineTo(-APSE_X - 0.25, -22.9); s.lineTo(-2.3, -APSE_Z - 0.25); s.lineTo(2.3, -APSE_Z - 0.25); s.lineTo(APSE_X + 0.25, -22.9); s.lineTo(APSE_X + 0.25, -BACK_Z); s.closePath()
    kTop.add(wallUV(subtract(s, 0.28).rotateX(-Math.PI / 2).translate(0, EAVE_Y - 0.3, 0)), m.stone)
    // Üstü: kurşun kaplı eğik örtü
    const apex = [0, EAVE_Y + 1.1, 21.6] as const
    const c = [[-APSE_X - 0.3, 21.2], [-APSE_X - 0.3, 22.9], [-2.3, APSE_Z + 0.3], [2.3, APSE_Z + 0.3], [APSE_X + 0.3, 22.9], [APSE_X + 0.3, 21.2]]
    const position: number[] = [], uv: number[] = []
    for (let i = 0; i < c.length - 1; i++) {
      position.push(c[i][0], EAVE_Y, c[i][1], c[i + 1][0], EAVE_Y, c[i + 1][1], apex[0], apex[1], apex[2])
      uv.push(c[i][0], c[i][1], c[i + 1][0], c[i + 1][1], apex[0], apex[2])
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    kRoof.add(g, m.lead)
  }

  // --- Çatılar: düşük eğimli kurşun kırma çatı (fotoğraflara göre) ---
  const Y = EAVE_Y + 0.08
  kRoof.add(hipRoof(-HALF_X - 0.5, HALF_X + 0.5, -18.2, BODY_Z + 0.5, Y, Y + 3, 'z'), m.lead)
  kRoof.add(hipRoof(-HALF_X - 0.5, HALF_X + 0.5, FRONT_Z - 0.5, -17.4, Y, Y + 1.5, 'x'), m.lead)
  kRoof.add(hipRoof(-BACK_X - 0.5, BACK_X + 0.5, BODY_Z - 2, BACK_Z + 0.5, Y, Y + 1.5, 'z'), m.lead)

  // Revağın arkasında çatıdan görünen küçük kubbe (fotoğrafa göre)
  {
    const kx = 0, kz = -15.2, yy = 15.6
    kRoof.add(place(flatShadow(cylinderG(2.3, 2.4, 0.5, 8).rotateY(Math.PI / 8)), kx, yy + 0.25, kz), x.brickRough)
    const p: [number, number][] = []
    for (let t = 0; t <= 10; t++) { const a = (t / 10) * Math.PI / 2; p.push([Math.max(2.25 * Math.cos(a), 0.001), 1.5 * Math.sin(a)]) }
    kDome.add(place(rotateG(p, 28, [1, 1]), kx, yy + 0.5, kz), m.dome)
    kDome.add(place(rotateG([[0.12, 0], [0.05, 0.25], [0.1, 0.4], [0.02, 0.65], [0, 0.7]], 8), kx, yy + 1.95, kz), m.bronze)
  }

  // --- Büyük kubbe: taş-tuğla kare blok, on altı köşeli kasnak, kurşun kubbe, aydınlık feneri (s. 87-88) ---
  const KZ = SAD_Z, BLOCK = 7.4, BLOCK_U = EAVE_Y + 3
  {
    const ring = rect(-BLOCK, -BLOCK, BLOCK, BLOCK)
    ring.holes.push(new THREE.Path().absarc(0, 0, 5.75, 0, Math.PI * 2, true))
    const block = subtract(ring, BLOCK_U - EAVE_Y + 0.4).rotateX(-Math.PI / 2).translate(0, EAVE_Y - 0.4, KZ)
    kDome.add(wallUV(block), x.alternating)
    for (const [cx, cz, ry] of [[0, KZ - BLOCK - 0.03, Math.PI], [0, KZ + BLOCK + 0.03, 0], [BLOCK + 0.03, KZ, Math.PI / 2], [-BLOCK - 0.03, KZ, -Math.PI / 2]] as const) {
      kDome.add(place(boxG(BLOCK * 2, 0.8, 0.14), cx, BLOCK_U - 0.5, cz, ry), x.friezeBand)
      kDome.add(wallUV(place(boxG(BLOCK * 2 + 0.3, 0.24, 0.6), cx, BLOCK_U - 0.02, cz, ry)), m.stone)
    }
    kDome.add(place(flatShadow(cylinderG(6.3 * Math.SQRT2, (BLOCK + 0.1) * Math.SQRT2, 0.5, 4, true).rotateY(Math.PI / 4)), 0, BLOCK_U + 0.3, KZ), m.lead)
    kDome.add(place(flatShadow(cylinderG(6.45, 6.55, 0.7, 16, true).rotateY(Math.PI / 16)), 0, BLOCK_U + 0.8, KZ), x.brickRough)
    kDome.add(place(flatShadow(cylinderG(6.6, 6.5, 0.16, 16).rotateY(Math.PI / 16)), 0, BLOCK_U + 1.2, KZ), m.marble)
    const prof: [number, number][] = []
    for (let t = 0; t <= 14; t++) {
      const a = (t / 14) * Math.PI / 2
      const r = 6.25 * Math.cos(a)
      if (r < 0.62) break
      prof.push([r, 3.2 * Math.sin(a)])
    }
    prof.push([0.62, prof[prof.length - 1][1]])
    kDome.add(place(rotateG(prof, 96, [1, 1]), 0, BLOCK_U + 1.2, KZ), m.dome)
    // Fener
    const fY = BLOCK_U + 1.2 + prof[prof.length - 1][1]
    kDome.add(place(cylinderG(0.6, 0.62, 0.6, 8, true), 0, fY + 0.3, KZ), x.darkGlass)
    for (let n = 0; n < 8; n++) kDome.add(place(boxG(0.06, 0.6, 0.06).translate(0, fY + 0.3, 0.62), 0, 0, KZ, (n * Math.PI) / 4), m.marble)
    kDome.add(place(rotateG([[0.72, 0], [0.5, 0.2], [0.08, 0.5], [0, 0.55]], 12, [1, 1]), 0, fY + 0.6, KZ), m.lead)
    kDome.add(place(rotateG([[0.08, 0], [0.04, 0.2], [0.1, 0.32], [0.02, 0.6], [0, 0.65]], 8), 0, fY + 1.15, KZ), m.bronze)
  }

  // --- Minare: kuzeydoğu köşesinde, beden duvarı üzerinde, yaklaşık 34 m (s. 83) ---
  {
    const MX = 12.7, MZ = -16.4, ext = (g: THREE.BufferGeometry, mat: Mat) => kTop.add(place(g, MX, 0, MZ), mat)
    ext(wallUV(boxG(3.3, EAVE_Y + 1.4 - MADRASA_Y, 3.3).translate(MX, (EAVE_Y + 1.4 + MADRASA_Y) / 2, MZ)).translate(-MX, 0, -MZ), m.stone)
    ext(rotateG([[1.5, 0], [1.5, 0.3], [1.28, 0.75]], 20).translate(0, EAVE_Y + 1.35, 0), m.marble)
    ext(rotateG([[1.28, EAVE_Y + 2.1], [1.14, 25.6]], 28), x.minaret)
    // Şerefe altı: beş sıra tuğla mukarnas (TDV)
    for (let t = 0; t < 5; t++) {
      const r = 1.14 + t * 0.1, y = 25.6 + t * 0.26
      ext(cylinderG(r + 0.08, r, 0.26, 24).translate(0, y + 0.13, 0), x.brickRough)
      for (let a = 0; a < 16; a++) {
        const theta = (a + (t % 2) * 0.5) * (Math.PI * 2) / 16
        ext(new THREE.SphereGeometry(0.14, 5, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5).translate(0, y + 0.02, r + 0.04).rotateY(theta), m.stone)
      }
    }
    ext(cylinderG(1.76, 1.76, 0.18, 24).translate(0, 27, 0), m.marble)
    // Korkuluk düz levhalardan (TDV)
    for (let a = 0; a < 16; a++) ext(boxG(0.62, 0.85, 0.08).translate(0, 27.5, 1.7).rotateY((a * Math.PI) / 8), m.marble)
    ext(cylinderG(1.76, 1.76, 0.08, 24, true).translate(0, 27.94, 0), m.marble)
    ext(rotateG([[0.94, 27], [0.86, 31.2]], 20), x.minaret)
    ext(cylinderG(1.02, 0.88, 0.2, 20).translate(0, 31.25, 0), m.marble)
    // Külah
    ext(rotateG([[1.02, 31.35], [0.5, 32.5], [0.06, 33.5], [0, 33.55]], 16, [1, 1]), m.lead)
    ext(rotateG([[0.05, 33.5], [0.1, 33.65], [0.03, 33.8], [0, 34]], 8), m.bronze)
  }

  // ============ İÇ MEKÂN ============
  const tb = BASE
  // Döşemeler
  boxUpright(SAD.x0, SAD.x1, 0.9, tb, SAD.z0, SAD.z1, x.carpetBlue)
  boxUpright(-1.7, 1.7, 0.9, tb, -10.9, -6.9, x.carpetBlue)
  boxUpright(ENTRY_HALL.x0, ENTRY_HALL.x1, 0.9, tb, ENTRY_HALL.z0, ENTRY_HALL.z1, m.paving)
  boxUpright(-1, 1, 0.9, tb, PORTICO_BACK, ENTRY_HALL.z0, m.paving)
  boxUpright(HALL.x0, HALL.x1, 0.9, tb + HALL_H, STAIR_STEP.z1, 20.9, x.carpetBlue)
  for (const s of [-1, 1]) {
    const a = Math.min(s * YESIK.x0, s * YESIK.x1), b = Math.max(s * YESIK.x0, s * YESIK.x1)
    boxUpright(a, b, 0.9, tb + IWAN_H, YESIK.z0, YESIK.z1, x.carpetBlue)
    boxUpright(Math.min(s * 5.5, s * 5.56), Math.max(s * 5.5, s * 5.56), 0.9, tb + IWAN_H + 0.005, YESIK.z0, YESIK.z1, m.marble)
    // Merdiven kapısı önü ve basamaklar
    const kA = Math.min(s * STAIRS_DOOR.x0, s * STAIRS.x1), kB = Math.max(s * STAIRS_DOOR.x0, s * STAIRS.x1)
    boxUpright(kA, kB, 0.9, tb, STAIRS.zBottom, STAIRS.zLast, m.paving)
    boxUpright(Math.min(s * STAIRS_DOOR.x0, s * STAIRS_DOOR.x1), Math.max(s * STAIRS_DOOR.x0, s * STAIRS_DOOR.x1), 0.9, tb, STAIRS_DOOR.z0, STAIRS_DOOR.z1, m.paving)
    const STEP = 38, L = STAIRS.zBottom - STAIRS.zTop
    for (let i = 0; i < STEP; i++) {
      const y = tb + ((i + 1) / STEP) * PORTICO_H
      const z1 = STAIRS.zBottom - (i / STEP) * L, z0 = z1 - L / STEP
      boxUpright(Math.min(s * STAIRS.x0, s * STAIRS.x1), Math.max(s * STAIRS.x0, s * STAIRS.x1), 0.98, y, z0, z1, m.marble)
    }
    // Merdivenin revağa bakan yüzü alt katta kapalıdır
    boxUpright(Math.min(s * STAIRS.x0, s * STAIRS.x1), Math.max(s * STAIRS.x0, s * STAIRS.x1), tb, TOP0, PORTICO_BACK, PORTICO_BACK + 0.02, x.wallInner)
    // Merdiven kapısı alınlığı
    const px = s > 0 ? STAIRS_DOOR.x1 : -STAIRS_DOOR.x0
    k.add(zPlane(subtract(archTop(STAIRS_DOOR.z1 - STAIRS_DOOR.z0, tb + 2.05, 0.7, TOP0), STAIRS_DOOR.x1 - STAIRS_DOOR.x0), px, (STAIRS_DOOR.z0 + STAIRS_DOOR.z1) / 2), x.wallInner)
    // Merdiven ışığı: üst katın tavanı
    boxUpright(Math.min(s * STAIRS.x0, s * STAIRS.x1), Math.max(s * STAIRS.x0, s * STAIRS.x1), 10.4, 10.6, PORTICO_BACK, -15, x.ceiling, kTop)
    // Revak duvarındaki merdiven kapısı
    kTop.add(subtract(archTop(STAIRS.x1 - STAIRS.x0, 9.5, 0.9, EAVE_Y), 0.7, PORTICO_BACK).translate(s * (STAIRS.x0 + STAIRS.x1) / 2, 0, 0), x.wallInner)
  }
  // Harim basamakları (fotoğrafta beş basamak; kitap "iki basamak" der, görünüm fotoğrafa göredir)
  {
    const STEP = 5, L = STAIR_STEP.z1 - STAIR_STEP.z0
    for (let i = 0; i < STEP; i++) {
      const z0 = STAIR_STEP.z0 + (i / STEP) * L, z1 = STAIR_STEP.z0 + ((i + 1) / STEP) * L
      boxUpright(-STAIR_STEP.x, STAIR_STEP.x, 0.9, tb + ((i + 1) / STEP) * HALL_H, z0, z1, x.carpetBlue)
    }
    // Mermer korkuluk ve pabuçluk nişleri
    for (const s of [-1, 1]) {
      boxUpright(Math.min(s * STAIR_STEP.x, s * 4.75), Math.max(s * STAIR_STEP.x, s * 4.75), 0.9, tb + HALL_H + 0.08, STAIR_STEP.z0, STAIR_STEP.z1 + 0.05, m.innerMarble)
      for (const a of [3.42, 4.32]) k.add(new THREE.ShapeGeometry(arch(new THREE.Shape(), s * a, tb + 0.2, 0.62, 0.36, 0.28), 6).rotateY(Math.PI).translate(s * a * 2, 0, STAIR_STEP.z0 - 0.01), x.darkGlass)
      // Ahşap korkuluk
      const px = s * (STAIR_STEP.x - 0.06)
      for (let i = 0; i <= 5; i++) {
        const t = i / 5, z = STAIR_STEP.z0 + t * L, y = tb + t * HALL_H
        k.add(place(cylinderG(0.03, 0.03, 0.85, 5), px, y + 0.42, z), x.tension)
      }
      const dL = Math.hypot(L, HALL_H), a = Math.atan2(HALL_H, L)
      const cube = boxG(0.1, 0.09, dL).rotateX(-a).translate(px, tb + HALL_H / 2 + 0.87, (STAIR_STEP.z0 + STAIR_STEP.z1) / 2)
      k.add(cube, x.tension)
      // Dolaplar (fotoğrafa göre)
      const d0 = Math.min(s * 3.35, s * 4.75), d1 = Math.max(s * 3.35, s * 4.75)
      boxUpright(d0, d1, tb + HALL_H, tb + HALL_H + 2.1, 7.25, 8.2, x.door)
      boxUpright(d0 + 0.08, d1 - 0.08, tb + HALL_H + 0.25, tb + HALL_H + 1.95, 7.24, 7.25, x.tension)
    }
  }
  // Son cemaat duvarı: cümle kapısı (mermer söveli, çift kanatlı, üstünde yazısız pano)
  {
    boxUpright(-1, 1, 3.7, TOP0, PORTICO_BACK, -16.9, x.wallInner)
    boxUpright(-1.35, -1, tb, 3.95, PORTICO_BACK - 0.08, PORTICO_BACK, m.marble)
    boxUpright(1, 1.35, tb, 3.95, PORTICO_BACK - 0.08, PORTICO_BACK, m.marble)
    boxUpright(-1.35, 1.35, 3.7, 4.05, PORTICO_BACK - 0.08, PORTICO_BACK, m.marble)
    boxUpright(-0.6, 0.6, 4.2, 4.8, PORTICO_BACK - 0.04, PORTICO_BACK, m.marble) // onarım kitabesi yeri: 60 x 120 cm (s. 85), yazı taklit edilmez
    for (const s of [-1, 1]) boxUpright(Math.min(s * 0.99, s * 0.92), Math.max(s * 0.99, s * 0.92), tb, 3.7, -18.8, -17.4, x.door)
    // Taş duvar kaplaması
    boxUpright(-14.3, -1.35, BASE + SOFA_H, TOP0, PORTICO_BACK - 0.02, PORTICO_BACK, x.wallInner)
    boxUpright(1.35, 14.3, BASE + SOFA_H, TOP0, PORTICO_BACK - 0.02, PORTICO_BACK, x.wallInner)
  }
  // Giriş dehlizi ve eyvan kemerleri
  k.add(subtract(archTop(3.4, 3.8, 1.7, TOP0), 0.5, SAD.z0 - 0.5), x.wallInner)
  k.add(subtract(archTop(3.4, 3.8, 1.5, TOP0), 0.4, ENTRY_HALL.z1), x.wallInner)
  const YZ = (YESIK.z0 + YESIK.z1) / 2, YW = YESIK.z1 - YESIK.z0
  for (const s of [-1, 1]) {
    k.add(zPlane(subtract(archTop(YW, 4.2, 2.9, TOP0), 0.5), s > 0 ? 6 : -5.5, YZ), x.wallInner)
    k.add(zPlane(subtract(archTop(YW, 4.6, 2.75, TOP0), 7), s > 0 ? 13 : -6, YZ), x.ceiling)
  }

  // Şadırvanlı mekân: üst kat duvarı, pandantif, iç kubbe, fener açıklığı
  kRoof.add(pendentiveG(0, SAD_Z, SAD.x0, SAD.x1, SAD.z0, SAD.z1, 11.4, 13.3, 5.45), x.ceiling)
  {
    const prof: [number, number][] = []
    for (let t = 0; t <= 32; t++) {
      const a = (t / 32) * Math.PI / 2, r = 5.45 * Math.cos(a)
      if (r < 0.62) break
      prof.push([r, 2.72 * Math.sin(a)])
    }
    kDome.add(topDownUV(place(rotateG(prof, 64, [1, 1]), 0, 13.3, SAD_Z), 0, SAD_Z, 5.45), x.boss)
    kDome.add(new THREE.CircleGeometry(0.9, 16).rotateX(Math.PI / 2).translate(0, 13.3 + 2.76, SAD_Z), m.sky)
    // Kubbe kuşağı
    kDome.add(new THREE.TorusGeometry(5.45, 0.08, 6, 48).rotateX(Math.PI / 2).translate(0, 13.3, SAD_Z), m.goldDark)
  }
  // Kuşak bordürü (s. 88)
  const belt = (x0: number, x1: number, z0: number, z1: number, y: number, kv: Bucket, h = 0.32) => {
    const g = Math.abs(x1 - x0) > Math.abs(z1 - z0)
    kv.add(place(boxG(g ? x1 - x0 : 0.04, h, g ? 0.04 : z1 - z0), (x0 + x1) / 2, y, (z0 + z1) / 2), x.border)
  }
  belt(SAD.x0, SAD.x1, SAD.z0 + 0.02, SAD.z0 + 0.02, 11.05, kTop, 0.45)
  for (const s of [-1, 1]) belt(s * 5.48, s * 5.48, SAD.z0, SAD.z1, 11.05, kTop, 0.45)
  // İkişer pencere: yan koridorlar orta mekâna açılır (s. 93)
  const innerWindow = (px: number, pz: number, ry: number, y0: number, g: number, flat: number, kv: Bucket, archH = 0.6) => {
    const ext = (geo: THREE.BufferGeometry, mat: Mat) => kv.add(place(geo, px, 0, pz, ry), mat)
    ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y0, g, flat, archH), 8).translate(0, 0, 0.025), m.glassCage)
    const s = arch(new THREE.Shape(), 0, y0 - 0.1, g + 0.34, flat + 0.1, archH + 0.2)
    s.holes.push(arch(new THREE.Path(), 0, y0, g, flat, archH))
    ext(subtract(s, 0.05, 0.01), x.cream)
  }
  for (const s of [-1, 1]) for (const z of [-4, 2.8]) innerWindow(s * 5.49, z, -s * Math.PI / 2, 8.8, 0.75, 1, kTop)
  // Yan eyvanlar: uç pencere, perde motifli güney duvar
  for (const s of [-1, 1]) {
    innerWindow(s * 12.97, YZ, -s * Math.PI / 2, tb + 2.2, 1, 1.5, k)
    const pg = new THREE.PlaneGeometry(2.1, 3.5).rotateY(Math.PI).translate(s * 9.6, tb + IWAN_H + 1.85, YESIK.z1 - 0.02)
    k.add(pg, x.curtain)
    // Kapısı kapalı tabhane odaları
    for (const z of [-5.6, 4.6]) {
      boxUpright(Math.min(s * 5.48, s * 5.5), Math.max(s * 5.48, s * 5.5), tb, tb + 2.3, z - 0.6, z + 0.6, x.door)
      boxUpright(Math.min(s * 5.47, s * 5.5), Math.max(s * 5.47, s * 5.5), tb + 2.3, tb + 2.5, z - 0.75, z + 0.75, m.marble)
    }
  }
  // Harim tonozu ve pencereleri (s. 87, 90)
  const vaultZ = HALL.z1 - HALL.z0
  kTop.add(subtract(archTop(9.5, 8, 5.2, EAVE_Y), vaultZ, HALL.z0), x.ceiling)
  for (const s of [-1, 1]) {
    for (const z of [10.2, 15.2]) innerWindow(s * 4.73, z, -s * Math.PI / 2, tb + HALL_H + 1.1, 0.95, 2, k, 0.7)
    innerWindow(s * 4.73, 12.7, -s * Math.PI / 2, 9.1, 0.8, 1.2, kTop)
    belt(s * 4.74, s * 4.74, HALL.z0, HALL.z1, 7.95, kTop, 0.32)
    for (const z of [8.6, 11.4, 14, 17]) k.add(new THREE.CircleGeometry(0.42, 20).rotateY(-s * Math.PI / 2).translate(s * 4.72, 6.3, z), x.plaque)
  }
  belt(-4.75, 4.75, HALL.z1 - 0.02, HALL.z1 - 0.02, 7.95, kTop, 0.32)
  innerWindow(0, HALL.z1 - 0.03, Math.PI, 10.1, 0.95, 1.1, kTop, 0.7)

  // Mihrap: çerçeve, mukarnas (dokuz sıra, s. 90), ortada yazısız kandil motifi
  {
    const Y0 = tb + HALL_H, S = Y0 + 3, NH = 2.4, O = NICHE.x1
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(g.rotateY(Math.PI).translate(0, 0, HALL.z1), mat)
    const c = new THREE.Shape()
    c.moveTo(-3.4, Y0); c.lineTo(-3.4, 8.2); c.quadraticCurveTo(-3.4, 10, 0, 10.6); c.quadraticCurveTo(3.4, 10, 3.4, 8.2); c.lineTo(3.4, Y0); c.closePath()
    c.holes.push(arch(new THREE.Path(), 0, Y0 + 0.02, O * 2, S - Y0 - 0.02, NH))
    const cg = subtract(c, 0.12)
    uvFit(cg)
    ext(cg, x.mihrabFrame)
    // Niş sırtı ve yanları
    k.add(new THREE.PlaneGeometry(O * 2, S - Y0 + 0.1).rotateY(Math.PI).translate(0, (S + Y0) / 2, NICHE.z1 - 0.02), x.hoodBottom)
    for (const s of [-1, 1]) {
      k.add(new THREE.PlaneGeometry(NICHE.z1 - NICHE.z0, S - Y0 + 2.4).rotateY(-s * Math.PI / 2).translate(s * (O - 0.01), (S + Y0 + 2.4) / 2, (NICHE.z0 + NICHE.z1) / 2), x.carpetRed)
      k.add(place(rotateG([[0.16, 0], [0.09, 1.5], [0.16, 2.95]], 10), s * (O - 0.2), Y0, NICHE.z0 + 0.25), m.goldDark)
    }
    // Mukarnas
    const TIER = 9, H = NH / TIER, D = NICHE.z1 - NICHE.z0
    for (let i = 0; i < TIER; i++) {
      const t = i / TIER
      const g = (O * 2 - 0.04) * Math.pow(1 - t * t * 0.92, 0.75), dr = D * (0.2 + 0.8 * (i + 1) / TIER), y = S + i * H
      boxUpright(-g / 2, g / 2, y, y + H * 0.92, NICHE.z1 - dr, NICHE.z1, m.goldDark)
      const n = Math.max(1, Math.floor(g / 0.52)), step = g / n
      for (let j = 0; j < n; j++) {
        const hx = -g / 2 + (j + 0.5) * step
        const h = new THREE.SphereGeometry(step * 0.46, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)
        h.scale(1, (H * 0.86) / (step * 0.46), 0.5).rotateY(Math.PI).translate(hx, y + 0.01, NICHE.z1 - dr)
        k.add(h, m.gold)
      }
    }
    boxUpright(-O, O, S + NH - 0.02, TOP0, NICHE.z0, NICHE.z1, m.goldDark)
  }
  // Minber: ahşap, kabartma geometrik yüzlü; alınlıkta ışınsal göbek (s. 91). Biçim temsilîdir.
  {
    const mx = MINBAR.x, EN = MINBAR.en, z0 = MINBAR.z0, z1 = MINBAR.z1, y0 = tb + HALL_H, y1 = tb + MINBAR.h1
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(g.rotateY(-Math.PI / 2).translate(mx, 0, 0), mat)
    const side = new THREE.Shape()
    side.moveTo(z0 - 0.5, y0); side.lineTo(MINBAR.zLast, y0); side.lineTo(MINBAR.zLast, y1 + 1.2); side.lineTo(z1, y1 + 1.2); side.lineTo(z0 + 0.2, y0 + 1.05); side.lineTo(z0 - 0.5, y0 + 1.05); side.closePath()
    for (const s of [-1, 1]) ext(subtract(side, 0.1, s * (EN / 2) - 0.05 + s * 0.05), x.minbar)
    const STEP = 12
    for (let i = 0; i < STEP; i++) {
      const a = z0 + (i / STEP) * (z1 - z0), b = z0 + ((i + 1) / STEP) * (z1 - z0)
      boxUpright(mx - EN / 2, mx + EN / 2, y0, y0 + ((i + 1) / STEP) * (y1 - y0), a, b, x.carpetRed)
    }
    // Köşk ve külah
    boxUpright(mx - EN / 2 - 0.1, mx + EN / 2 + 0.1, y1, y1 + 2.5, z1, z1 + 1.6, x.minbar)
    boxUpright(mx - EN / 2 + 0.1, mx + EN / 2 - 0.1, y1 + 0.1, y1 + 2.2, z1 - 0.02, z1, x.tension)
    k.add(place(flatShadow(cylinderG(0.05, 1.2, 1.5, 4).rotateY(Math.PI / 4)), mx, y1 + 3.25, z1 + 0.8), x.minbar)
    k.add(place(rotateG([[0.08, 0], [0.04, 0.2], [0.1, 0.35], [0.02, 0.65], [0, 0.7]], 8), mx, y1 + 4, z1 + 0.8), m.gold)
    // Kapı: iki söve, lento ve alınlık
    for (const s of [-1, 1]) boxUpright(mx + s * (EN / 2) - 0.1, mx + s * (EN / 2) + 0.1, y0, y0 + 2.6, z0 - 0.5, z0, x.minbar)
    boxUpright(mx - EN / 2 - 0.1, mx + EN / 2 + 0.1, y0 + 2.6, y0 + 3.2, z0 - 0.5, z0, x.minbar)
    k.add(new THREE.CircleGeometry(0.25, 16).rotateY(Math.PI).translate(mx, y0 + 2.9, z0 - 0.51), x.plaque)
  }
  // Kürsü: sade ahşap (s. 91)
  boxUpright(2.6, 3.8, tb + HALL_H, tb + HALL_H + 0.9, 15.2, 16.4, x.door)
  boxUpright(2.55, 3.85, tb + HALL_H + 0.9, tb + HALL_H + 1, 15.15, 16.45, x.tension)

  // Müezzin mahfili: batı eyvanında ahşap platform; basamaklar kuzeyden
  {
    const y = tb + MAHFIL.h
    boxUpright(MAHFIL.x0, MAHFIL.x1, y - 0.16, y, MAHFIL.z0, MAHFIL.z1, x.door)
    for (const px of [MAHFIL.x0 + 0.12, MAHFIL.x1 - 0.12]) for (const pz of [MAHFIL.z0 + 0.1, MAHFIL.z1 - 0.1]) boxUpright(px - 0.09, px + 0.09, tb + IWAN_H, y - 0.16, pz - 0.09, pz + 0.09, x.tension)
    const STEP = 7
    for (let i = 0; i < STEP; i++) {
      const a = MAHFIL.stairZ0 + (i / STEP) * (MAHFIL.z0 - MAHFIL.stairZ0), b = MAHFIL.stairZ0 + ((i + 1) / STEP) * (MAHFIL.z0 - MAHFIL.stairZ0)
      boxUpright(MAHFIL.stairX0, MAHFIL.stairX1, tb + IWAN_H, tb + IWAN_H + ((i + 1) / STEP) * (MAHFIL.h - IWAN_H), a, b, x.door)
    }
    // Korkuluk: alçak ahşap, kenardan düşmeyi yürüme denetimi engeller
    boxUpright(MAHFIL.x0, MAHFIL.stairX0, y + 0.72, y + 0.8, MAHFIL.z0 - 0.04, MAHFIL.z0 + 0.04, x.tension)
    boxUpright(MAHFIL.stairX1 - 0.04, MAHFIL.stairX1 + 0.04, y + 0.72, y + 0.8, MAHFIL.z0, MAHFIL.z1, x.tension)
    for (let z = MAHFIL.z0; z <= MAHFIL.z1; z += 0.4) boxUpright(MAHFIL.stairX1 - 0.02, MAHFIL.stairX1 + 0.02, y, y + 0.72, z - 0.02, z + 0.02, x.tension)
    for (let px = MAHFIL.x0; px <= MAHFIL.stairX0; px += 0.4) boxUpright(px - 0.02, px + 0.02, y, y + 0.72, MAHFIL.z0 - 0.02, MAHFIL.z0 + 0.02, x.tension)
  }

  const carpetEdge = (x0: number, x1: number, z0: number, z1: number, y: number) => {
    const E = 0.34
    k.add(place(boxG(x1 - x0, 0.004, E), (x0 + x1) / 2, y + 0.002, z0 + E / 2), x.carpetEdge)
    k.add(place(boxG(x1 - x0, 0.004, E), (x0 + x1) / 2, y + 0.002, z1 - E / 2), x.carpetEdge)
    for (const a of [x0 + E / 2, x1 - E / 2]) k.add(place(boxG(z1 - z0, 0.004, E).rotateY(Math.PI / 2), a, y + 0.002, (z0 + z1) / 2), x.carpetEdge)
  }
  carpetEdge(SAD.x0, SAD.x1, SAD.z0, SAD.z1, tb)
  carpetEdge(HALL.x0, HALL.x1, STAIR_STEP.z1, HALL.z1, tb + HALL_H)
  for (const s of [-1, 1]) carpetEdge(s > 0 ? YESIK.x0 + 0.06 : -YESIK.x1, s > 0 ? YESIK.x1 : -YESIK.x0 - 0.06, YESIK.z0, YESIK.z1, tb + IWAN_H)

  // Şadırvan: altıgen mermer hazne ve fıskiye; basamaklı mermer zemin (s. 88 ve fotoğraf)
  {
    const cz = SAD_Z, ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, cz), mat)
    ext(flatShadow(cylinderG(3.1, 3.2, 0.1, 6)).translate(0, tb + 0.05, 0), m.innerMarble)
    ext(flatShadow(cylinderG(2.3, 2.4, 0.12, 6).rotateY(Math.PI / 6)).translate(0, tb + 0.14, 0), m.innerMarble)
    ext(flatShadow(cylinderG(1.5, 1.42, 0.92, 6)).translate(0, tb + 0.66, 0), m.innerMarble)
    ext(flatShadow(rotateG([[1.34, 0], [1.34, 0.08], [1.56, 0.08], [1.56, 0]], 6)).translate(0, tb + 1.1, 0), m.marble)
    ext(cylinderG(1.34, 1.34, 0.02, 24).translate(0, tb + 1.12, 0), m.water)
    ext(rotateG([[0.3, 0], [0.1, 0.34], [0.34, 0.5], [0.08, 0.68], [0.12, 0.9], [0.02, 1.1], [0, 1.12]], 14).translate(0, tb + 1.1, 0), m.innerMarble)
  }

  // Avizeler ve kandiller
  const ringChandelier = (cx: number, cz: number, y: number, apex: number, R: number) => {
    k.add(new THREE.TorusGeometry(R, 0.03, 6, 28).rotateX(Math.PI / 2).translate(cx, y, cz), m.gold)
    k.add(new THREE.TorusGeometry(R * 0.5, 0.025, 6, 20).rotateX(Math.PI / 2).translate(cx, y + 0.5, cz), m.gold)
    k.add(place(cylinderG(0.015, 0.015, apex - y, 4), cx, (apex + y) / 2, cz), x.tension)
    for (let n = 0; n < 4; n++) {
      const a = n * Math.PI / 2 + Math.PI / 4, ax = cx + Math.sin(a) * R, az = cz + Math.cos(a) * R
      const u = Math.hypot(ax - cx, 2.1, az - cz)
      const ip = new THREE.CylinderGeometry(0.012, 0.012, u, 4)
      ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(cx - ax, 2.1, cz - az).normalize()))
      k.add(ip.translate((ax + cx) / 2, y + 1.05, (az + cz) / 2), x.tension)
    }
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2, lx = cx + Math.sin(a) * R, lz = cz + Math.cos(a) * R
      k.add(new THREE.SphereGeometry(0.075, 6, 5).translate(lx, y - 0.16, lz), m.lamp)
      for (const [rx, ry] of [[0, 0], [0, Math.PI / 2]]) k.add(new THREE.PlaneGeometry(0.7, 0.7).rotateX(rx).rotateY(ry).translate(lx, y - 0.16, lz), m.lampHalo)
    }
  }
  ringChandelier(0, SAD_Z, 6.2, 16, 2.1)
  // Harimde büyük pirinç fener (fotoğrafa göre)
  {
    const cz = 12.4, y = 7.2
    k.add(place(cylinderG(0.012, 0.012, 5.6, 4), 0, 10.6, cz), x.tension)
    k.add(place(rotateG([[0.05, 0], [0.2, 0.15], [0.26, 0.6], [0.18, 1.1], [0, 1.25]], 8), 0, y - 1.35, cz), x.lantern)
    k.add(place(rotateG([[0.02, 0], [0.34, 0.12], [0.52, 0.22], [0.5, 0.28], [0, 0.3]], 12), 0, y - 1.55, cz), m.gold)
    k.add(place(rotateG([[0.52, 0], [0.56, 0.08], [0.3, 0.4], [0.04, 0.7], [0, 0.72]], 12), 0, y - 0.1, cz), m.gold)
    for (let n = 0; n < 8; n++) k.add(place(boxG(0.035, 1.5, 0.035).translate(0, y - 0.85, 0.5), 0, 0, cz, (n * Math.PI) / 4), m.goldDark)
  }
  // Merdiven ve revak duvar lambaları
  for (const s of [-1, 1]) {
    k.add(new THREE.SphereGeometry(0.1, 8, 6).translate(s * (STAIRS.x1 - 0.1), 5, -15), m.lamp)
    k.add(new THREE.SphereGeometry(0.1, 8, 6).translate(s * 8, 3.8, PORTICO_BACK - 0.14), m.lamp)
  }
}

/** Eklenen geometriyi önce dönüştüren ince sarmalayıcı: yan cephe kemerleri için. */
class BucketRoute {
  private bucket: Bucket
  private don: (g: THREE.BufferGeometry) => THREE.BufferGeometry
  constructor(bucket: Bucket, don: (g: THREE.BufferGeometry) => THREE.BufferGeometry) { this.bucket = bucket; this.don = don }
  add(g: THREE.BufferGeometry, m: Mat) { this.bucket.add(this.don(g), m) }
}
