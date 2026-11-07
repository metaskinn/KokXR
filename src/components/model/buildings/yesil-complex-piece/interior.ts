// Yeşil Camii iç mekânı. Mekân dizilişi, kot farkları ve kubbe ölçüleri envanterden (Bursa II, s. 88, 101, 103, 105-106);
// oda ölçüleri, duvar kalınlıkları ve bezeme yerleşimi kitaptaki fotoğraflara bakılarak temsilî yorumlanmıştır.
// Yazı ve hat taklit edilmez: kuşaklar ve panolar yalnız geometrik ve bitkisel motif taşır.
// Kuzey = -z, kıble (güney) = +z, doğu = +x.
import * as THREE from 'three'
import type { InteriorStop, InteriorWalk, Box, FloorArea } from '../../uluMosqueInterior'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, place, type Mat } from '../../uluMosquePiece'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'
import type { GreenMaterials } from './textures'
import { polygon, transitionBelt, align, plaque, prism, type Gap } from './help'

export const BASE = 0.35
export const BAY_Y = BASE + 1.75
/** Eyvan ve müezzin mahfili +0,75 m (s. 88, 101); mihrap bölümü iki basamak (s. 105), yüksekliği 1 m (Yıldırım Belediyesi). */
export const IWAN_H = 0.75, MIHRAB_H = 1
/** Hünkâr mahfili döşemesi: yükseklik temsilîdir. */
export const TOP_H = 6.45
export const TOP_Y = BASE + TOP_H

// Orta harim (fıskiyeli) ve mihrap bölümü: 13 m kubbeler (s. 101, 105)
export const MID = { x0: -6.5, x1: 6.5, z0: -10, z1: 3 }, MIHRAB = { x0: -6.5, x1: 6.5, z0: 4.8, z1: 17.8 }
export const MID_Z = -3.5, MIHRAB_Z = 11.3
export const LOBBY = { x0: -2.2, x1: 2.2, z0: -16.8, z1: -11.5 }
export const IWAN = { x0: 7.9, x1: 14.9, z0: -7, z1: 0 }, IWAN_X = 11.4, IWAN_Z = -3.5
export const TABHANE = { x0: 8.6, x1: 14.9, z0: 1.4, z1: 8.1 }
export const CORNER = { x0: 6.6, x1: 14.9, z0: -17.3, z1: -8.5 }
export const SOFA = { x0: -3.2, x1: 3.2, z0: -17.3, z1: -11.5 }
const STAIRS_X0 = 13.6, STAIRS_Z0 = -16

type Dir = 'K' | 'G' | 'D' | 'B'
/** Dünya aralığında (duvar ekseninde c0–c1) tanımlı boşluk. */
interface Hole { c0: number; c1: number; y0: number; y1: number; archH?: number; bursa?: boolean; casing?: number; casingMat?: Mat }

interface Room { x0: number; x1: number; z0: number; z1: number }

/** Odanın duvarı: normal odaya bakar. K: kuzey duvarı, G: güney, D: doğu, B: batı. */
const calligraphy = (o: Room, y: Dir): [number, number, number, number, (c: number) => number] => {
  if (y === 'K') return [o.x0, o.z0, o.x1, o.z0, (c) => c - o.x0]
  if (y === 'G') return [o.x1, o.z1, o.x0, o.z1, (c) => o.x1 - c]
  if (y === 'B') return [o.x0, o.z1, o.x0, o.z0, (c) => o.z1 - c]
  return [o.x1, o.z0, o.x1, o.z1, (c) => c - o.z0]
}

/** Boşluğun üst konturu; soldan sağa. */
function contour(b: Gap): [number, number][] {
  const n = 10, nok: [number, number][] = []
  const quadr = (p0: number[], p1: number[], p2: number[]) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (1 - t) * (1 - t), c = 2 * t * (1 - t), d = t * t
      nok.push([a * p0[0] + c * p1[0] + d * p2[0], a * p0[1] + c * p1[1] + d * p2[1]])
    }
  }
  if (!b.archH) return [[b.u0, b.y1], [b.u1, b.y1]]
  const y = b.y1, k = b.archH, g = b.u1 - b.u0
  if (b.bursa) {
    quadr([b.u0, y], [b.u0, y + k * 0.82], [b.u0 + g * 0.22, y + k * 0.9])
    quadr([b.u1 - g * 0.22, y + k * 0.9], [b.u1, y + k * 0.82], [b.u1, y])
    return nok
  }
  const m = (b.u0 + b.u1) / 2
  quadr([b.u0, y], [b.u0, y + k * 0.55], [m, y + k])
  quadr([m, y + k], [b.u1, y + k * 0.55], [b.u1, y])
  return nok
}

const uvQuad = (u0: number, y0: number, u1: number, y1: number, u2: number, y2: number, u3: number, y3: number) =>
  ({ p: [u0, y0, 0, u1, y1, 0, u2, y2, 0, u0, y0, 0, u2, y2, 0, u3, y3, 0], uv: [u0, y0, u1, y1, u2, y2, u0, y0, u2, y2, u3, y3] })

/** Duvar bandı: boşlukların çevresini dörtgenlerle kaplar; `bantlu` ise doku yüksekliği banda oturur. */
export function cladding(k: Bucket, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, mat: Mat, holes: Gap[] = [], banded = false, slip = 0.015) {
  // U ekseninde çakışan boşluklar (kapının üstündeki mahfil gibi) ayrı yükseklik bantlarında işlenir.
  const related = holes.filter((d) => d.y0 < y1 && (d.y1 + (d.archH ?? 0)) > y0)
  for (const a of related) for (const b of related) {
    if (a !== b && a.u0 < b.u1 && b.u0 < a.u1 && b.y0 > y0 && a.y1 + (a.archH ?? 0) <= b.y0) {
      cladding(k, ax, az, bx, bz, y0, b.y0, mat, related.filter((d) => d.y0 < b.y0), banded, slip)
      cladding(k, ax, az, bx, bz, b.y0, y1, mat, related.filter((d) => d.y0 >= b.y0), banded, slip)
      return
    }
  }
  const L = Math.hypot(bx - ax, bz - az)
  const p: number[] = [], uv: number[] = []
  const add = (q: ReturnType<typeof uvQuad>) => { p.push(...q.p); uv.push(...q.uv) }
  const rectV = (u0: number, u1: number, a: number, b: number) => { if (u1 > u0 + 1e-4 && b > a + 1e-4) add(uvQuad(u0, a, u1, a, u1, b, u0, b)) }
  let u = 0
  const ordered = [...related].sort((a, b) => a.u0 - b.u0)
  for (const d of ordered) {
    rectV(u, d.u0, y0, y1)
    rectV(d.u0, d.u1, y0, Math.min(y1, d.y0))
    const nok = contour(d)
    for (let i = 0; i < nok.length - 1; i++) {
      const [ua, ya] = nok[i], [ub, yb] = nok[i + 1]
      const a = Math.max(y0, Math.min(y1, ya)), b = Math.max(y0, Math.min(y1, yb))
      if (ub > ua + 1e-5 && (a < y1 || b < y1)) add(uvQuad(ua, a, ub, b, ub, y1, ua, y1))
    }
    u = d.u1
  }
  rectV(u, L, y0, y1)
  if (!p.length) return
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  if (banded) {
    const uva = g.attributes.uv
    for (let i = 0; i < uva.count; i++) uva.setY(i, (uva.getY(i) - y0) / (y1 - y0))
  }
  g.translate(0, 0, slip)
  g.computeVertexNormals()
  k.add(align(g, ax, az, bx, bz), mat)
}

/** Boşluğun derinliği: konturdan duvar içine doğru söve. */
function casing(k: Bucket, ax: number, az: number, bx: number, bz: number, b: Gap, t: number, mat: Mat) {
  const nok = contour(b)
  const all: [number, number][] = [[b.u0, b.y0], ...nok, [b.u1, b.y0]]
  const p: number[] = [], uv: number[] = []
  let s = 0
  for (let i = 0; i < all.length - 1; i++) {
    const [ua, ya] = all[i], [ub, yb] = all[i + 1]
    const d = Math.hypot(ub - ua, yb - ya)
    p.push(ua, ya, 0, ub, yb, 0, ub, yb, -t, ua, ya, 0, ub, yb, -t, ua, ya, -t)
    uv.push(s, 0, s + d, 0, s + d, t, s, 0, s + d, t, s, t)
    s += d
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  k.add(align(g, ax, az, bx, bz), mat)
}

/** Yatay düzlem; normal yukarı (tavan için `asagi`). UV metre. */
export function plane(k: Bucket, x0: number, x1: number, z0: number, z1: number, y: number, mat: Mat, down = false) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(down ? Math.PI / 2 : -Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.add(g, mat)
}

interface RoomConfig {
  y0: number; y1: number
  wall: Mat
  dado?: Mat; dadoH?: number; frieze?: Mat
  hole?: Partial<Record<Dir, Hole[]>>
}

function room(k: Bucket, o: Room, a: RoomConfig) {
  for (const y of ['K', 'G', 'D', 'B'] as Dir[]) {
    const [ax, az, bx, bz, cu] = calligraphy(o, y)
    const gap: Gap[] = (a.hole?.[y] ?? []).map((d) => {
      const u0 = Math.min(cu(d.c0), cu(d.c1)), u1 = Math.max(cu(d.c0), cu(d.c1))
      return { u0, u1, y0: d.y0, y1: d.y1, archH: d.archH, bursa: d.bursa }
    })
    const dh = a.dado ? a.y0 + (a.dadoH ?? 2) : a.y0
    if (a.dado) cladding(k, ax, az, bx, bz, a.y0, dh, a.dado, gap)
    const fh = a.frieze ? dh + 0.55 : dh
    if (a.frieze) cladding(k, ax, az, bx, bz, dh, fh, a.frieze, gap, true)
    cladding(k, ax, az, bx, bz, fh, a.y1, a.wall, gap)
    ;(a.hole?.[y] ?? []).forEach((d, i) => { if (d.casing) casing(k, ax, az, bx, bz, gap[i], d.casing, d.casingMat ?? a.wall) })
  }
}

/** Duvar üstüne çizilen (açılmayan) pencere: mermer çerçeve, ışık alan lokma ve kafes. */
function window(k: Bucket, m: UluMosqueMaterials, ax: number, az: number, bx: number, bz: number, c: number, y0: number, g: number, h: number, arched: boolean, wood = false) {
  const u = c
  const yL = arched ? arch(new THREE.Shape(), u, y0, g, h, g * 0.55) : rect(u - g / 2, y0, u + g / 2, y0 + h)
  const frameBorder = rect(u - g / 2 - 0.22, y0 - 0.22, u + g / 2 + 0.22, y0 + h + (arched ? g * 0.55 : 0) + 0.22)
  frameBorder.holes.push((arched ? arch(new THREE.Path(), u, y0, g, h, g * 0.55) : pathUpright(u - g / 2, y0, u + g / 2, y0 + h)))
  k.add(align(new THREE.ShapeGeometry(frameBorder, 8).translate(0, 0, 0.03), ax, az, bx, bz), m.marble)
  const panel = new THREE.ShapeGeometry(yL, 8).translate(0, 0, 0.022)
  k.add(align(panel, ax, az, bx, bz), wood ? m.woodLattice : m.glassCage)
}
const pathUpright = (a: number, b: number, c: number, d: number) => {
  const p = new THREE.Path(); p.moveTo(a, b); p.lineTo(c, b); p.lineTo(c, d); p.lineTo(a, d); p.closePath(); return p
}

/** Duvar üstünde yuvarlak pano: krem halka ve çini göbek; yazı yok. */
function board(k: Bucket, ym: GreenMaterials, ax: number, az: number, bx: number, bz: number, c: number, y: number, r: number) {
  k.add(align(new THREE.CircleGeometry(r + 0.09, 28).translate(c, y, 0.02), ax, az, bx, bz), ym.friezeDark)
  k.add(align(new THREE.CircleGeometry(r, 28).translate(c, y, 0.03), ax, az, bx, bz), ym.mahfilTileDark)
}

/** Mukarnas: daralan kademelerde kemerli hücreler. Yerel düzlemde (u, y) ve -z duvara doğru. */
export function muqarnas(ext: (g: THREE.BufferGeometry, mat: Mat) => void, cx: number, y0: number, G: number, H: number, D: number, ana: Mat, cell: Mat, tier = 7) {
  const h = H / tier
  for (let i = 0; i < tier; i++) {
    const o = 1 - i / tier
    const g = G * Math.pow(o, 0.82), dr = D * o + 0.05, y = y0 + i * h
    ext(boxG(g, h * 0.92, dr).translate(cx, y + h * 0.46, dr / 2), ana)
    const n = Math.max(1, Math.floor(g / 0.48)), step = g / n
    for (let j = 0; j < n; j++) {
      const x = cx - g / 2 + (j + 0.5) * step
      const s = new THREE.SphereGeometry(step * 0.46, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)
      s.scale(1, (h * 0.86) / (step * 0.46), 0.5)
      ext(s.translate(x, y + 0.01, dr), cell)
    }
  }
}

function chandelier(k: Bucket, m: UluMosqueMaterials, cx: number, cz: number, y: number, R: number, apex: number, count: number) {
  const ringG = (r: number, h: number) => new THREE.TorusGeometry(r, 0.05, 6, 40).rotateX(Math.PI / 2).translate(cx, h, cz)
  k.add(ringG(R, y), m.dark)
  k.add(ringG(R * 0.5, y + 0.55), m.dark)
  k.add(new THREE.TorusGeometry(R * 0.6, 0.03, 5, 28).rotateX(Math.PI / 2).translate(cx, y + 1.2, cz), m.gold)
  for (let n = 0; n < 6; n++) {
    const a = (n / 6) * Math.PI * 2
    const ip = new THREE.CylinderGeometry(0.018, 0.018, 1, 4)
    const ax = cx + Math.sin(a) * R, az = cz + Math.cos(a) * R
    const uz = Math.hypot(ax - cx, apex - y, az - cz)
    ip.scale(1, uz, 1)
    ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(cx - ax, apex - y, cz - az).normalize()))
    ip.translate((ax + cx) / 2, (y + apex) / 2, (az + cz) / 2)
    k.add(ip, m.dark)
  }
  for (let n = 0; n < count; n++) {
    const a = (n / count) * Math.PI * 2
    k.add(new THREE.SphereGeometry(0.13, 8, 6).translate(cx + Math.sin(a) * R, y - 0.22, cz + Math.cos(a) * R), m.lamp)
    if (n % 2 === 0) k.add(new THREE.SphereGeometry(0.1, 6, 5).translate(cx + Math.sin(a) * R * 0.5, y + 0.3, cz + Math.cos(a) * R * 0.5), m.lamp)
  }
}

export function mosqueInterior(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket, kDrum: Bucket, kDome: Bucket) {
  // --- Döşemeler ---
  plane(k, -15.2, 15.2, -18, 18.2, BASE - 0.02, m.marblePaving)
  plane(k, MID.x0, MID.x1, MID.z0, MID.z1, BASE, ym.carpet)
  plane(k, LOBBY.x0, LOBBY.x1, LOBBY.z0, MID.z0, BASE, ym.carpet)
  plane(k, MIHRAB.x0, MIHRAB.x1, MIHRAB.z0, MIHRAB.z1, BASE + MIHRAB_H, ym.carpet)
  for (const s of [-1, 1]) {
    const [ex0, ex1] = s > 0 ? [IWAN.x0, IWAN.x1] : [-IWAN.x1, -IWAN.x0]
    plane(k, ex0, ex1, IWAN.z0, IWAN.z1, BASE + IWAN_H, ym.carpet)
    const [tx0, tx1] = s > 0 ? [TABHANE.x0, TABHANE.x1] : [-TABHANE.x1, -TABHANE.x0]
    plane(k, tx0, tx1, TABHANE.z0, TABHANE.z1, BASE, ym.carpet)
    const [kx0, kx1] = s > 0 ? [CORNER.x0, CORNER.x1] : [-CORNER.x1, -CORNER.x0]
    plane(k, kx0, kx1, CORNER.z0, CORNER.z1, BASE, ym.carpet)
  }

  // --- Orta harim: geniş eyvan kemerleri, mihrap kemeri, kuzey cephesi ---
  const ARCH = { leg: 8, h: 3.6 }, TABHANE_K = { c0: 1.25, c1: 2.75, y0: BASE, y1: 3.4 }
  room(k, MID, {
    y0: BASE, y1: 15, wall: ym.cream, dado: m.marble, dadoH: 2.2, frieze: ym.friezeNavy,
    hole: {
      K: [
        { c0: -1.2, c1: 1.2, y0: BASE, y1: 3.2, archH: 1, casing: 1.5, casingMat: m.marble },
        { c0: -5.8, c1: -2.6, y0: BASE, y1: 3.6, archH: 1.4, casing: 2.6, casingMat: ym.mahfilTile },
        { c0: 2.6, c1: 5.8, y0: BASE, y1: 3.6, archH: 1.4, casing: 2.6, casingMat: ym.mahfilTile },
        { c0: -2.4, c1: 2.4, y0: TOP_Y, y1: 10, archH: 1.8, casing: 1.5, casingMat: ym.mahfilTile },
      ],
      G: [{ c0: -6.2, c1: 6.2, y0: BASE, y1: 9.2, archH: 3.4, bursa: true, casing: 1.8, casingMat: m.marble }],
      D: [{ c0: IWAN.z0 + 0.15, c1: IWAN.z1 - 0.15, y0: BASE, y1: ARCH.leg, archH: ARCH.h, casing: 1.4, casingMat: m.marble }, { ...TABHANE_K, casing: 2.1, casingMat: m.marble }],
      B: [{ c0: IWAN.z0 + 0.15, c1: IWAN.z1 - 0.15, y0: BASE, y1: ARCH.leg, archH: ARCH.h, casing: 1.4, casingMat: m.marble }, { ...TABHANE_K, casing: 2.1, casingMat: m.marble }],
    },
  })
  // Kuzey duvarında çini alan: müezzin mahfilleri ve hünkâr mahfili çevresi (s. 91)
  const kz = MID.z0
  const north: Gap[] = [
    { u0: 0.7, u1: 3.9, y0: BASE, y1: 3.6, archH: 1.4 },
    { u0: 5.3, u1: 7.7, y0: BASE, y1: 3.2, archH: 1 },
    { u0: 9.1, u1: 12.3, y0: BASE, y1: 3.6, archH: 1.4 },
    { u0: 4.1, u1: 8.9, y0: TOP_Y, y1: 10, archH: 1.8 },
  ]
  cladding(k, MID.x0, kz, MID.x1, kz, BASE, 6.3, ym.mahfilTile, north.slice(0, 3), false, 0.03)
  cladding(k, MID.x0 + 2.4, kz, MID.x1 - 2.4, kz, 6.3, 12.6, ym.mahfilTile, [{ ...north[3], u0: north[3].u0 - 2.4, u1: north[3].u1 - 2.4 }], false, 0.03)
  for (const s of [-1, 1]) {
    board(k, ym, MID.x0, kz, MID.x1, kz, 6.5 + s * 4.2, 9.4, 0.8)
    window(k, m, MID.x0, kz, MID.x1, kz, 6.5 + s * 4.3, 6.9, 0.8, 1, true)
  }
  // Mermer kapı çerçevesi
  const doorFrame = rect(4.7, BASE, 8.3, 5.4)
  doorFrame.holes.push(arch(new THREE.Path(), 6.5, BASE + 0.001, 2.4, 3.2 - BASE, 1))
  k.add(align(subtract(doorFrame, 0.12, 0.04), MID.x0, kz, MID.x1, kz), m.marble)

  // Müezzin mahfilleri: tamamen çini kaplı, birer basamakla çıkılan iki mekân (s. 101)
  for (const s of [-1, 1]) {
    const [x0, x1] = s > 0 ? [2.6, 5.8] : [-5.8, -2.6]
    const mz: Room = { x0, x1, z0: -12.6, z1: -10 }
    room(k, mz, { y0: BASE, y1: 5.6, wall: ym.mahfilTile, hole: { G: [{ c0: x0, c1: x1, y0: BASE, y1: 3.6, archH: 1.4 }] } })
    plane(k, x0, x1, mz.z0, mz.z1 - 0.5, BASE + IWAN_H, ym.carpet)
    plane(k, x0, x1, mz.z0, mz.z1, 5.5, ym.mahfilTileDark, true)
    k.add(place(boxG(x1 - x0, IWAN_H * 0.5, 0.5), (x0 + x1) / 2, BASE + IWAN_H * 0.25, mz.z1 - 0.25), m.marble)
    k.add(place(boxG(x1 - x0, IWAN_H, 0.02), (x0 + x1) / 2, BASE + IWAN_H * 0.5, mz.z1 - 0.5), m.marble)
  }

  // --- Giriş holü ---
  room(k, LOBBY, {
    y0: BASE, y1: 6.6, wall: ym.cream, dado: m.marble, dadoH: 2.6,
    hole: {
      K: [],
      G: [{ c0: -1.2, c1: 1.2, y0: BASE, y1: 3.2, archH: 1 }],
      D: [{ c0: -16.2, c1: -14.4, y0: BASE, y1: 3.2, casing: 4.4, casingMat: m.marble }],
      B: [{ c0: -16.2, c1: -14.4, y0: BASE, y1: 3.2, casing: 4.4, casingMat: m.marble }],
    },
  })
  plane(k, LOBBY.x0, LOBBY.x1, LOBBY.z0, LOBBY.z1, 6.58, ym.redPaint, true)
  // Kapının iç yüzü
  k.add(place(boxG(2.6, 3.4, 0.12), 0, BASE + 1.7, LOBBY.z0 + 0.08), ym.walnut)
  k.add(place(boxG(3, 0.3, 0.2), 0, BASE + 3.5, LOBBY.z0 + 0.1), m.marble)

  // --- Yan mekânlar (iki yan simetrik) ---
  for (const s of [-1, 1]) {
    const side = (o: Room): Room => (s > 0 ? o : { x0: -o.x1, x1: -o.x0, z0: o.z0, z1: o.z1 })
    const inner: Dir = s > 0 ? 'B' : 'D', outer: Dir = s > 0 ? 'D' : 'B'

    // Eyvan: 7 m çapında 18 m yüksekliğinde 24 dilimli kubbe; duvarlar 2 m çini + yazı kuşağı yerine bitkisel kuşak (s. 103)
    const ey = side(IWAN)
    room(k, ey, {
      y0: BASE + IWAN_H, y1: 11.5, wall: ym.cream, dado: ym.greenTile, dadoH: 2, frieze: ym.friezeTurquoise,
      hole: { [inner]: [{ c0: IWAN.z0 + 0.15, c1: IWAN.z1 - 0.15, y0: BASE, y1: ARCH.leg, archH: ARCH.h }] },
    })
    const ex = s * IWAN_X
    const [dax, daz, dbx, dbz] = calligraphy(ey, outer)
    window(k, m, dax, daz, dbx, dbz, 3.5, BASE + IWAN_H + 0.6, 1.5, 2, false, true)
    window(k, m, dax, daz, dbx, dbz, 3.5, 7.6, 1.2, 1.7, true)
    board(k, ym, dax, daz, dbx, dbz, 1.1, 6.5, 0.55)
    board(k, ym, dax, daz, dbx, dbz, 5.9, 6.5, 0.55)
    kDrum.add(flatShadow(transitionBelt(ex, IWAN_Z, 3.5, 3.5, 11.5, 14, 3.5, 8)), ym.transition)
    kDome.add(place(rotateG(innerDomeProfile(3.5, 3.9), 48, [1, 1]), ex, 14, IWAN_Z), ym.domePaintB)
    // Basamaklar: eyvanın önü
    const on = s > 0 ? 6.9 : -7.9
    k.add(place(boxG(1, IWAN_H * 0.5, 6.7), on + 0.5, BASE + IWAN_H * 0.25, IWAN_Z), m.marble)
    k.add(place(boxG(0.06, IWAN_H, 6.7), s * IWAN.x0, BASE + IWAN_H / 2, IWAN_Z), m.marble)

    // Tabhane: doğudaki 32, batıdaki 24 dilimli kubbe; açık mavi altıgen çini (s. 105)
    const tb = side(TABHANE)
    room(k, tb, {
      y0: BASE, y1: 7.2, wall: ym.cream, dado: ym.turquoiseTile, dadoH: 2.5, frieze: ym.friezeTurquoise,
      hole: { [inner]: [TABHANE_K] },
    })
    const tx = (tb.x0 + tb.x1) / 2, tz = (tb.z0 + tb.z1) / 2
    k.add(flatShadow(transitionBelt(tx, tz, 3.15, 3.35, 7.2, 8.8, 3.05, 8)), ym.cream)
    k.add(place(rotateG(innerDomeProfile(3.05, 2.7), 32, [1, 1]), tx, 8.8, tz), s > 0 ? ym.domeWhite : ym.domePaintB)
    const [tax, taz, tbx, tbz] = calligraphy(tb, outer)
    window(k, m, tax, taz, tbx, tbz, 3.35, BASE + 0.6, 1.4, 1.9, false, true)
    window(k, m, tax, taz, tbx, tbz, 3.35, 5.1, 1, 1.2, true)
    const [gax, gaz, gbx, gbz] = calligraphy(tb, 'G')
    window(k, m, gax, gaz, gbx, gbz, 3.15, 5.1, 1, 1.2, true)
    // Ocak: alçı nişli
    const hearthG = 1.6
    k.add(place(boxG(hearthG, 2.6, 0.5), tx, BASE + 1.3, tb.z1 - 0.25), m.marble)
    k.add(place(boxG(hearthG - 0.5, 1.5, 0.04), tx, BASE + 0.8, tb.z1 - 0.52), m.dark)

    // Köşe odaları: kapı koridoru, çini kaplı alt duvarlar, kalem işli örtü (s. 101)
    const ko = side(CORNER)
    room(k, ko, {
      y0: BASE, y1: 6.6, wall: ym.cream, dado: ym.navyTile, dadoH: 3.1, frieze: ym.friezeNavy,
      hole: { [inner]: [{ c0: -16.2, c1: -14.4, y0: BASE, y1: 3.2 }] },
    })
    const mx = s > 0 ? [CORNER.x0, STAIRS_X0] : [-STAIRS_X0, -CORNER.x0]
    plane(k, mx[0], mx[1], CORNER.z0, CORNER.z1, 6.58, ym.redPaint, true)
    const [kax, kaz, kbx, kbz] = calligraphy(ko, 'K')
    window(k, m, kax, kaz, kbx, kbz, 2.8, BASE + 0.8, 1.5, 2, false, true)
    const [dkx, dkz, dlx, dlz] = calligraphy(ko, outer)
    window(k, m, dkx, dkz, dlx, dlz, 4.4, BASE + 0.8, 1.5, 2, false, true)

    // Merdiven: köşe odasının dış duvarı boyunca (yeri temsilî)
    const step = 22, mX = s * (STAIRS_X0 + 14.9) / 2
    for (let i = 0; i < step; i++) {
      const t = i / step
      const z = -8.6 - t * 7.4, h = (t + 1 / step) * TOP_H
      k.add(place(boxG(1.3, h, 7.4 / step + 0.02), mX, BASE + h / 2, z - 7.4 / step / 2), m.marble)
    }

    // Üst katın merdiven kovası ve koridoru
    const [kv0, kv1] = s > 0 ? [STAIRS_X0, 14.9] : [-14.9, -STAIRS_X0]
    room(k, { x0: kv0, x1: kv1, z0: -16, z1: -8.5 }, { y0: 6.6, y1: 10.2, wall: ym.cream, hole: { K: [{ c0: kv0, c1: kv1, y0: 6.6, y1: 10.2 }] } })
    plane(k, kv0, kv1, -16, -8.5, 10.2, ym.cream, true)
    const kor: Room = s > 0 ? { x0: 3.2, x1: 14.9, z0: -17.3, z1: -16 } : { x0: -14.9, x1: -3.2, z0: -17.3, z1: -16 }
    room(k, kor, { y0: TOP_Y, y1: 10.2, wall: ym.mahfilTileDark, hole: { G: [{ c0: kv0, c1: kv1, y0: TOP_Y, y1: 10.2 }], [inner]: [{ c0: -17.1, c1: -16.1, y0: TOP_Y, y1: 9.3 }] } })
    plane(k, kor.x0, kor.x1, kor.z0, kor.z1, TOP_Y, m.marblePaving)
    plane(k, kor.x0, kor.x1, kor.z0, kor.z1, 10.2, ym.cream, true)
  }

  // Koridorların tavanı ve üst kat sofası
  const SOFA_Y = 11.6
  room(k, SOFA, {
    y0: TOP_Y, y1: SOFA_Y, wall: ym.mahfilTile, dado: ym.turquoiseTile, dadoH: 1.4, frieze: ym.friezeNavy,
    hole: {
      G: [{ c0: -2.4, c1: 2.4, y0: TOP_Y, y1: 10, archH: 1.4 }],
      D: [{ c0: -17.1, c1: -16.1, y0: TOP_Y, y1: 9.3 }],
      B: [{ c0: -17.1, c1: -16.1, y0: TOP_Y, y1: 9.3 }],
    },
  })
  plane(k, SOFA.x0, SOFA.x1, SOFA.z0, -10.1, TOP_Y, m.marblePaving)
  plane(k, SOFA.x0, SOFA.x1, SOFA.z0, SOFA.z1, SOFA_Y, ym.mahfilTileDark, true)
  const [sax, saz, sbx, sbz] = calligraphy(SOFA, 'K')
  window(k, m, sax, saz, sbx, sbz, 3.2, TOP_Y + 0.9, 1.5, 1.8, false, true)
  // Mahfil korkuluğu
  k.add(place(boxG(4.8, 1, 0.1), 0, TOP_Y + 0.5, -10.15), m.woodLattice)
  k.add(place(boxG(4.9, 0.08, 0.2), 0, TOP_Y + 1.03, -10.15), ym.walnut)

  // --- Orta kubbe: Türk üçgenli geçiş, 13 m çap, tepede ışık feneri (s. 101) ---
  kDrum.add(flatShadow(transitionBelt(0, MID_Z, 6.5, 6.5, 15, 19, 6.5)), ym.transition)
  const profileMid = innerDomeProfile(6.5, 5.85, 1.45)
  kDome.add(place(rotateG(profileMid, 64, [1, 1]), 0, 19, MID_Z), ym.domePaintA)
  kDome.add(new THREE.CircleGeometry(1.7, 24).rotateX(Math.PI / 2).translate(0, 25.7, MID_Z), ym.glassLight)
  k.add(place(cylinderG(0.03, 0.03, 15, 4), 0, 16, MID_Z), m.dark)
  chandelier(k, m, 0, MID_Z, 7.4, 3.3, 15, 30)

  // Kasnak pencereleri: orta kubbede dört, mihrap önünde sekiz (s. 106)
  for (const [[a, b, c, d], c0] of [
    [[MID.x0, MID.z0, MID.x1, MID.z0], 6.5],
    [[MID.x1, MID.z0, MID.x1, MID.z1], 6.5],
    [[MID.x0, MID.z1, MID.x0, MID.z0], 6.5],
  ] as [[number, number, number, number], number][]) window(k, m, a, b, c, d, c0, 12.6, 1.5, 1.2, true)

  // --- Mihrap bölümü ---
  const M = MIHRAB, MY = BASE + MIHRAB_H
  room(k, M, {
    y0: MY, y1: 15, wall: ym.cream, dado: ym.navyTile, dadoH: 2, frieze: ym.friezeNavy,
    hole: { K: [{ c0: -6.2, c1: 6.2, y0: BASE, y1: 9.2, archH: 3.4, bursa: true }] },
  })
  cladding(k, M.x0, M.z0, M.x1, M.z0, BASE, MY, m.marble, [{ u0: 4.1, u1: 8.9, y0: BASE, y1: MY }])
  kDrum.add(flatShadow(transitionBelt(0, MIHRAB_Z, 6.5, 6.5, 15, 19, 6.5)), ym.transition)
  kDome.add(place(rotateG(innerDomeProfile(6.5, 6), 64, [1, 1]), 0, 19, MIHRAB_Z), ym.domePaintA)
  chandelier(k, m, 0, MIHRAB_Z - 1.5, 9.4, 2.5, 16, 22)
  k.add(place(cylinderG(0.03, 0.03, 13, 4), 0, 18.5, MIHRAB_Z - 1.5), m.dark)

  // Mihrap duvarı: alt ve üst sırada ikişer pencere (s. 106); yan duvarlarda birer pencere, panolar
  const [gx0, gz0, gx1, gz1] = calligraphy(M, 'G')
  for (const u of [1.7, 11.3]) {
    window(k, m, gx0, gz0, gx1, gz1, u, MY + 0.3, 1.5, 1.5, false, true)
    window(k, m, gx0, gz0, gx1, gz1, u, 8.1, 1.1, 1.7, true)
  }
  board(k, ym, gx0, gz0, gx1, gz1, 1.7, 6.1, 0.65)
  board(k, ym, gx0, gz0, gx1, gz1, 11.3, 6.1, 0.65)
  for (const y of ['D', 'B'] as Dir[]) {
    const [a, b, c, d] = calligraphy(M, y)
    window(k, m, a, b, c, d, 6.5, MY + 0.3, 1.8, 2, false, true)
    window(k, m, a, b, c, d, 6.5, 8.6, 1.1, 1.8, true)
    board(k, ym, a, b, c, d, 3.2, 8, 1.35)
    board(k, ym, a, b, c, d, 9.8, 8, 1.35)
    board(k, ym, a, b, c, d, 6.5, 12.8, 0.6)
  }
  // Mihrap önü alçak mermer set ve iki basamak (fotoğrafta nişli; s. 90)
  for (const s of [-1, 1]) {
    k.add(place(boxG(3.8, MIHRAB_H, 1.8), s * 4.3, BASE + MIHRAB_H / 2, 3.9), m.marble)
    for (const x of [2.9, 4.3, 5.7]) k.add(place(boxG(0.9, 0.6, 0.03), s * x, BASE + 0.48, 2.985), ym.walnutDark)
  }
  for (let i = 0; i < 3; i++) {
    const h = (i + 1) / 3 * MIHRAB_H
    k.add(place(boxG(4.8, h, 1.8 - i * 0.6), 0, BASE + h / 2, 3 + (1.8 - i * 0.6) / 2 + i * 0.6), m.marble)
  }

  // Mihrap: yaklaşık 6 m genişlik, 10,67 m yükseklik (s. 106); yazı yerine geometrik pano
  mihrab(m, ym, k)
  minbarAndKursu(m, ym, k)

  // --- Şadırvan (fıskiye): sekizgen koyu mermer gövde, açık mermer sekiler; merkezde kademeli fıskiye (s. 90, 103) ---
  const f = (g: THREE.BufferGeometry, mat: Mat) => k.add(g.translate(0, 0, MID_Z), mat)
  f(flatShadow(cylinderG(3.2, 3.3, 0.14, 8)).rotateY(Math.PI / 8).translate(0, BASE + 0.07, 0), m.marble)
  f(prism(polygon(8, 2.45), BASE + 0.14, BASE + 1.15), ym.blackMarble)
  f(flatShadow(cylinderG(2.72, 2.72, 0.18, 8)).rotateY(Math.PI / 8).translate(0, BASE + 1.24, 0), m.marble)
  f(cylinderG(2.42, 2.42, 0.02, 8).rotateY(Math.PI / 8).translate(0, BASE + 1.34, 0), m.water)
  f(rotateG([[0.55, 0], [0.38, 0.2], [0.38, 0.48], [0.56, 0.55], [0.56, 0.66], [0.34, 0.72], [0.34, 1.18], [0.5, 1.26], [0.42, 1.36], [0.15, 1.72], [0.05, 1.86], [0.1, 1.9], [0, 2]], 12).translate(0, BASE + 1.2, 0), m.marble)
}

/** İç kubbe yarım kesiti: `acik` verilirse tepede fener boşluğu kalır. */
function innerDomeProfile(R: number, H: number, open = 0): [number, number][] {
  const p: [number, number][] = []
  for (let t = 0; t <= 16; t++) {
    const a = (t / 16) * Math.PI / 2, r = R * Math.pow(Math.cos(a), 0.92)
    if (open && r < open) break
    p.push([Math.max(r, 0.001), H * Math.pow(Math.sin(a), 1.02)])
  }
  return p
}

function mihrab(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket) {
  const Z = MIHRAB.z1, ax = 3.05, bx = -3.05, MY = BASE + MIHRAB_H, TOP = MY + 10.67
  const NICHE = { g: 2.3, leg: 3, arch: 1.7 }
  const block = rect(0, MY, 6.1, TOP)
  block.holes.push(arch(new THREE.Path(), 3.05, MY + 0.02, NICHE.g, NICHE.leg, NICHE.arch))
  plaque(k, block, ax, Z, bx, Z, ym.mihrab, 0.34, 0.01, true)
  // Çini panolar (Drive fotoğraflarından yazısız kırpılmış; açık yayında tuval deseni kalır)
  const panel = (u0: number, u1: number, y0: number, y1: number, mat: Mat) => {
    const g = new THREE.PlaneGeometry(u1 - u0, y1 - y0).translate((u0 + u1) / 2, (y0 + y1) / 2, 0.36)
    k.add(align(g, ax, Z, bx, Z), mat)
  }
  if (ym.mihrabPhoto) {
    panel(1.05, 5.05, MY + NICHE.leg + NICHE.arch + 0.28, TOP - 1.05, ym.mihrabStar)
    panel(1.05, 2.2, MY + 0.95, MY + NICHE.leg + NICHE.arch + 0.1, ym.mihrabTile)
    panel(3.9, 5.05, MY + 0.95, MY + NICHE.leg + NICHE.arch + 0.1, ym.mihrabTile)
    panel(1.05, 5.05, MY + NICHE.leg + NICHE.arch + 0.1, MY + NICHE.leg + NICHE.arch + 0.28, ym.mihrabBelt)
  }
  // Çerçeve üstü: düz sarı kuşak ve alt mermer
  k.add(place(boxG(6.3, 0.16, 0.44), 0, TOP, Z - 0.22), m.goldDark)
  // Niş: lacivert zemin, mukarnaslı kavsara
  k.add(place(boxG(NICHE.g + 0.04, NICHE.leg + NICHE.arch, 0.03), 0, MY + (NICHE.leg + NICHE.arch) / 2, Z - 0.03), ym.mahfilTileDark)
  const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(align(g.translate(0, 0, 0.02), 0, Z, -1, Z), mat)
  muqarnas(ext, 0, MY + NICHE.leg - 0.1, NICHE.g - 0.08, NICHE.arch, 0.3, ym.turquoiseTile, m.goldDark, 6)
  // Sütunçeler ve alt kuşak
  for (const s of [-1, 1]) k.add(place(cylinderG(0.09, 0.09, NICHE.leg - 0.1, 10), s * (NICHE.g / 2 + 0.14), MY + NICHE.leg / 2, Z - 0.38), ym.turquoiseTile)
}

function minbarAndKursu(m: UluMosqueMaterials, ym: GreenMaterials, k: Bucket) {
  const X = -4.7, Z0 = 11.6, Z1 = 15.8, EN = 1.2, MY = BASE + MIHRAB_H, TOP = 2.7
  const ext = (g: THREE.BufferGeometry, mat: Mat) => {
    g.rotateY(-Math.PI / 2)
    g.translate(X, 0, Z0)
    k.add(g, mat)
  }
  const LENGTH = Z1 - Z0
  const side = new THREE.Shape()
  side.moveTo(-0.5, MY); side.lineTo(LENGTH + 1.2, MY); side.lineTo(LENGTH + 1.2, MY + TOP + 0.95); side.lineTo(LENGTH, MY + TOP + 0.95); side.lineTo(0, MY + 0.95); side.lineTo(-0.5, MY + 0.95); side.closePath()
  for (const s of [-1, 1]) ext(subtract(side, 0.1, s * (EN / 2 + 0.05) - 0.05), m.kundekari)
  const STEP = 11
  for (let i = 0; i < STEP; i++) {
    const t = i / STEP, h = (t + 1 / STEP) * TOP, u = t * LENGTH
    ext(boxG(LENGTH / STEP + 0.01, h, EN).translate(u + LENGTH / STEP / 2, MY + h / 2, 0), m.mihrabRed)
  }
  ext(boxG(1.2, TOP, EN).translate(LENGTH + 0.6, MY + TOP / 2, 0), m.mihrabRed)
  // Köşk: dört ince ayak ve fotoğraftaki gibi uzun sivri külah
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ext(boxG(0.1, 2.5, 0.1).translate(LENGTH + 0.6 + a * 0.54, MY + TOP + 1.25, b * (EN / 2 + 0.03)), ym.walnutDark)
  ext(boxG(1.3, 0.18, EN + 0.25).translate(LENGTH + 0.6, MY + TOP + 2.55, 0), ym.walnut)
  ext(flatShadow(cylinderG(0.02, 0.86, 3.2, 8).rotateY(Math.PI / 8).translate(LENGTH + 0.6, MY + TOP + 4.25, 0)), ym.walnut)
  // Kapı: iki direk ve taç
  for (const s of [-1, 1]) ext(boxG(0.14, 2.8, 0.14).translate(-0.4, MY + 1.4, s * (EN / 2 + 0.05)), ym.walnut)
  ext(boxG(0.2, 0.5, EN + 0.3).translate(-0.4, MY + 2.9, 0), m.kundekari)
  // Kürsü
  k.add(place(boxG(1.8, 1.1, 1.4), 4.6, MY + 0.55, 15.6), ym.walnut)
  k.add(place(boxG(2, 0.1, 1.6), 4.6, MY + 1.14, 15.6), ym.walnutDark)
  k.add(place(boxG(1.5, 0.75, 1.1), 4.6, MY + 0.4, 15.6), m.kundekari)
}

// --- Yürüme ---

const ROOMS: Room[] = [
  LOBBY,
  { x0: -1.2, x1: 1.2, z0: LOBBY.z1 - 0.01, z1: MID.z0 + 0.01 },
  MID,
  { x0: -6.5, x1: 6.5, z0: 2.9, z1: 4.9 },
  MIHRAB,
  ...[1, -1].flatMap((s) => {
    const side = (o: Room): Room => (s > 0 ? o : { x0: -o.x1, x1: -o.x0, z0: o.z0, z1: o.z1 })
    return [
      side({ x0: 2.6, x1: 5.8, z0: -12.6, z1: MID.z0 + 0.01 }),
      side({ x0: 6.4, x1: IWAN.x1, z0: IWAN.z0, z1: IWAN.z1 }),
      side({ x0: 6.4, x1: TABHANE.x0 + 0.1, z0: 1.25, z1: 2.75 }),
      side(TABHANE),
      side({ x0: LOBBY.x1 - 0.1, x1: CORNER.x0 + 0.1, z0: -16.2, z1: -14.4 }),
      side(CORNER),
    ]
  }),
]

/** Odaların dışında kalan her yer çarpışma kutusu olur; üst kattaki oyuncu bu kutuların üstünden geçer. */
function wallBoxes(limit: Box): Box[] {
  const xs = [...new Set([limit.x0, limit.x1, ...ROOMS.flatMap((o) => [o.x0, o.x1])])].filter((v) => v >= limit.x0 && v <= limit.x1).sort((a, b) => a - b)
  const zs = [...new Set([limit.z0, limit.z1, ...ROOMS.flatMap((o) => [o.z0, o.z1])])].filter((v) => v >= limit.z0 && v <= limit.z1).sort((a, b) => a - b)
  const result: Box[] = []
  for (let i = 0; i < xs.length - 1; i++) {
    let head: number | null = null
    for (let j = 0; j < zs.length - 1; j++) {
      const mx = (xs[i] + xs[i + 1]) / 2, mz = (zs[j] + zs[j + 1]) / 2
      const empty = ROOMS.some((o) => mx > o.x0 && mx < o.x1 && mz > o.z0 && mz < o.z1)
      if (!empty && head === null) head = zs[j]
      if (empty && head !== null) { result.push({ x0: xs[i], x1: xs[i + 1], z0: head, z1: zs[j], top: 5.5 }); head = null }
    }
    if (head !== null) result.push({ x0: xs[i], x1: xs[i + 1], z0: head, z1: zs[zs.length - 1], top: 5.5 })
  }
  return result
}

export function mosqueWalkArea(): InteriorWalk {
  const limit: Box = { x0: -14.9, x1: 14.9, z0: -17.3, z1: 17.8 }
  const boxes = wallBoxes(limit)
  const floors: FloorArea[] = [
    // Mihrap bölümü ve basamaklar
    { x0: -6.5, x1: 6.5, z0: 4.75, z1: 17.8, h0: MIHRAB_H, h1: MIHRAB_H },
    { x0: -2.4, x1: 2.4, z0: 3, z1: 4.75, h0: 0, h1: MIHRAB_H },
    // Müezzin mahfilleri: basamak bandı + düz alan
    { x0: 2.6, x1: 5.8, z0: -12.6, z1: -10.5, h0: IWAN_H, h1: IWAN_H },
    { x0: 2.6, x1: 5.8, z0: -10.5, z1: -10, h0: IWAN_H / 2, h1: IWAN_H / 2 },
    { x0: -5.8, x1: -2.6, z0: -12.6, z1: -10.5, h0: IWAN_H, h1: IWAN_H },
    { x0: -5.8, x1: -2.6, z0: -10.5, z1: -10, h0: IWAN_H / 2, h1: IWAN_H / 2 },
    // Üst kat: mahfil, sofa, koridorlar, merdivenler (altından geçilir)
    { x0: -3.2, x1: 3.2, z0: -17.3, z1: -10.4, h0: TOP_H, h1: TOP_H, underPassable: true },
  ]
  for (const s of [1, -1]) {
    const x = (a: number, b: number) => (s > 0 ? { x0: a, x1: b } : { x0: -b, x1: -a })
    floors.push(
      { ...x(IWAN.x0, IWAN.x1), z0: IWAN.z0, z1: IWAN.z1, h0: IWAN_H, h1: IWAN_H },
      { ...x(6.9, IWAN.x0), z0: IWAN.z0, z1: IWAN.z1, h0: IWAN_H / 2, h1: IWAN_H / 2 },
      { ...x(3.2, 14.9), z0: -17.3, z1: -16, h0: TOP_H, h1: TOP_H, underPassable: true },
      { ...x(STAIRS_X0, 14.9), z0: STAIRS_Z0, z1: -8.6, h0: TOP_H, h1: 0 },
    )
  }
  const minbar = { x0: -5.3, x1: -4.1, z0: 11.6, z1: 15.8, h0: MIHRAB_H, h1: MIHRAB_H + 2.7 }
  floors.push(minbar, { x0: -5.3, x1: -4.1, z0: 15.8, z1: 17, h0: MIHRAB_H + 2.7, h1: MIHRAB_H + 2.7 })
  return {
    limit,
    boxes: [
      ...boxes,
      { x0: 3.65, x1: 5.55, z0: 14.85, z1: 16.35, top: MIHRAB_H + 1.2 },
      { x0: -3.05, x1: 3.05, z0: 17.4, z1: 17.8 },
      { x0: 2.4, x1: 6.5, z0: 3, z1: 4.75 },
      { x0: -6.5, x1: -2.4, z0: 3, z1: 4.75 },
    ],
    circles: [{ x: 0, z: MID_Z, r: 3.2 }],
    floors,
    viewBlockers: boxes.map(({ x0, x1, z0, z1 }) => ({ x0, x1, z0, z1 })),
    eyeY: BAY_Y,
    baseY: BASE,
  }
}

export const mosqueStops: InteriorStop[] = [
  { id: 'entrance', ad: 'Giriş holü', position: [0, BAY_Y, -15.2], look: [0, 3, 0] },
  { id: 'jet', ad: 'Fıskiyeli orta mekân', position: [3.6, BAY_Y, -7.8], look: [0, 2.4, 6] },
  { id: 'mihrab', ad: 'Mihrap', position: [0, BAY_Y + MIHRAB_H, 7.4], look: [0, 6.4, 17.8] },
  { id: 'iwan', ad: 'Doğu eyvanı', position: [9, BAY_Y + IWAN_H, -3.5], look: [14.9, 4, -3.5] },
  { id: 'sultan', ad: 'Hünkâr mahfili', position: [0, BAY_Y + TOP_H, -11.2], look: [0, 6, 12] },
  { id: 'muezzin', ad: 'Müezzin mahfili', position: [4.2, BAY_Y + IWAN_H, -11.2], look: [2, 3, 8] },
  { id: 'tabhane', ad: 'Tabhane', position: [11.8, BAY_Y, 3.3], look: [11.8, 3.5, 8.1] },
  { id: 'corner', ad: 'Köşe odası', position: [10, BAY_Y, -10.5], look: [11, 3, -17.3] },
  { id: 'minbar', ad: 'Minbere çık', position: [-4.7, BAY_Y + MIHRAB_H + 2.7, 16.4], look: [4, 3, 2] },
]

