// Yeşil Camii iç mekânı. Mekân dizilişi, kot farkları ve kubbe ölçüleri envanterden (Bursa II, s. 88, 101, 103, 105-106);
// oda ölçüleri, duvar kalınlıkları ve bezeme yerleşimi kitaptaki fotoğraflara bakılarak temsilî yorumlanmıştır.
// Yazı ve hat taklit edilmez: kuşaklar ve panolar yalnız geometrik ve bitkisel motif taşır.
// Kuzey = -z, kıble (güney) = +z, doğu = +x.
import * as THREE from 'three'
import type { IcDurak, IcYurume, Kutu, ZeminAlani } from '../../ulucamiIc'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, yer, type Mal } from '../../ulucamiParca'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { YesilMalzemeleri } from './dokular'
import { cokgen, gecisKusagi, hizala, levha, prizma, type Bosluk } from './yardim'

export const TABAN = 0.35
export const GOZ_Y = TABAN + 1.75
/** Eyvan ve müezzin mahfili +0,75 m (s. 88, 101); mihrap bölümü iki basamak (s. 105), yüksekliği 1 m (Yıldırım Belediyesi). */
export const EYVAN_H = 0.75, MIHRAP_H = 1
/** Hünkâr mahfili döşemesi: yükseklik temsilîdir. */
export const UST_H = 6.45
export const UST_Y = TABAN + UST_H

// Orta harim (fıskiyeli) ve mihrap bölümü: 13 m kubbeler (s. 101, 105)
export const ORTA = { x0: -6.5, x1: 6.5, z0: -10, z1: 3 }, MIHRAP = { x0: -6.5, x1: 6.5, z0: 4.8, z1: 17.8 }
export const ORTA_Z = -3.5, MIHRAP_Z = 11.3
export const HOL = { x0: -2.2, x1: 2.2, z0: -16.8, z1: -11.5 }
export const EYVAN = { x0: 7.9, x1: 14.9, z0: -7, z1: 0 }, EYVAN_X = 11.4, EYVAN_Z = -3.5
export const TABHANE = { x0: 8.6, x1: 14.9, z0: 1.4, z1: 8.1 }
export const KOSE = { x0: 6.6, x1: 14.9, z0: -17.3, z1: -8.5 }
export const SOFA = { x0: -3.2, x1: 3.2, z0: -17.3, z1: -11.5 }
const MERDIVEN_X0 = 13.6, MERDIVEN_Z0 = -16

type Yon = 'K' | 'G' | 'D' | 'B'
/** Dünya aralığında (duvar ekseninde c0–c1) tanımlı boşluk. */
interface Delik { c0: number; c1: number; y0: number; y1: number; kemerH?: number; bursa?: boolean; sove?: number; soveMal?: Mal }

interface Oda { x0: number; x1: number; z0: number; z1: number }

/** Odanın duvarı: normal odaya bakar. K: kuzey duvarı, G: güney, D: doğu, B: batı. */
const hat = (o: Oda, y: Yon): [number, number, number, number, (c: number) => number] => {
  if (y === 'K') return [o.x0, o.z0, o.x1, o.z0, (c) => c - o.x0]
  if (y === 'G') return [o.x1, o.z1, o.x0, o.z1, (c) => o.x1 - c]
  if (y === 'B') return [o.x0, o.z1, o.x0, o.z0, (c) => o.z1 - c]
  return [o.x1, o.z0, o.x1, o.z1, (c) => c - o.z0]
}

/** Boşluğun üst konturu; soldan sağa. */
function kontur(b: Bosluk): [number, number][] {
  const n = 10, nok: [number, number][] = []
  const kuadr = (p0: number[], p1: number[], p2: number[]) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (1 - t) * (1 - t), c = 2 * t * (1 - t), d = t * t
      nok.push([a * p0[0] + c * p1[0] + d * p2[0], a * p0[1] + c * p1[1] + d * p2[1]])
    }
  }
  if (!b.kemerH) return [[b.u0, b.y1], [b.u1, b.y1]]
  const y = b.y1, k = b.kemerH, g = b.u1 - b.u0
  if (b.bursa) {
    kuadr([b.u0, y], [b.u0, y + k * 0.82], [b.u0 + g * 0.22, y + k * 0.9])
    kuadr([b.u1 - g * 0.22, y + k * 0.9], [b.u1, y + k * 0.82], [b.u1, y])
    return nok
  }
  const m = (b.u0 + b.u1) / 2
  kuadr([b.u0, y], [b.u0, y + k * 0.55], [m, y + k])
  kuadr([m, y + k], [b.u1, y + k * 0.55], [b.u1, y])
  return nok
}

const uvDortgen = (u0: number, y0: number, u1: number, y1: number, u2: number, y2: number, u3: number, y3: number) =>
  ({ p: [u0, y0, 0, u1, y1, 0, u2, y2, 0, u0, y0, 0, u2, y2, 0, u3, y3, 0], uv: [u0, y0, u1, y1, u2, y2, u0, y0, u2, y2, u3, y3] })

/** Duvar bandı: boşlukların çevresini dörtgenlerle kaplar; `bantlu` ise doku yüksekliği banda oturur. */
export function kaplama(k: Kova, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, mal: Mal, delikler: Bosluk[] = [], bantlu = false, kayma = 0.015) {
  const L = Math.hypot(bx - ax, bz - az)
  const p: number[] = [], uv: number[] = []
  const ekle = (q: ReturnType<typeof uvDortgen>) => { p.push(...q.p); uv.push(...q.uv) }
  const rect = (u0: number, u1: number, a: number, b: number) => { if (u1 > u0 + 1e-4 && b > a + 1e-4) ekle(uvDortgen(u0, a, u1, a, u1, b, u0, b)) }
  let u = 0
  const sirali = delikler.filter((d) => d.y0 < y1 && (d.y1 + (d.kemerH ?? 0)) > y0).sort((a, b) => a.u0 - b.u0)
  for (const d of sirali) {
    rect(u, d.u0, y0, y1)
    rect(d.u0, d.u1, y0, Math.min(y1, d.y0))
    const nok = kontur(d)
    for (let i = 0; i < nok.length - 1; i++) {
      const [ua, ya] = nok[i], [ub, yb] = nok[i + 1]
      const a = Math.max(y0, Math.min(y1, ya)), b = Math.max(y0, Math.min(y1, yb))
      if (ub > ua + 1e-5 && (a < y1 || b < y1)) ekle(uvDortgen(ua, a, ub, b, ub, y1, ua, y1))
    }
    u = d.u1
  }
  rect(u, L, y0, y1)
  if (!p.length) return
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  if (bantlu) {
    const uva = g.attributes.uv
    for (let i = 0; i < uva.count; i++) uva.setY(i, (uva.getY(i) - y0) / (y1 - y0))
  }
  g.translate(0, 0, kayma)
  g.computeVertexNormals()
  k.ekle(hizala(g, ax, az, bx, bz), mal)
}

/** Boşluğun derinliği: konturdan duvar içine doğru söve. */
function sove(k: Kova, ax: number, az: number, bx: number, bz: number, b: Bosluk, t: number, mal: Mal) {
  const nok = kontur(b)
  const hepsi: [number, number][] = [[b.u0, b.y0], ...nok, [b.u1, b.y0]]
  const p: number[] = [], uv: number[] = []
  let s = 0
  for (let i = 0; i < hepsi.length - 1; i++) {
    const [ua, ya] = hepsi[i], [ub, yb] = hepsi[i + 1]
    const d = Math.hypot(ub - ua, yb - ya)
    p.push(ua, ya, 0, ub, yb, 0, ub, yb, -t, ua, ya, 0, ub, yb, -t, ua, ya, -t)
    uv.push(s, 0, s + d, 0, s + d, t, s, 0, s + d, t, s, t)
    s += d
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  k.ekle(hizala(g, ax, az, bx, bz), mal)
}

/** Yatay düzlem; normal yukarı (tavan için `asagi`). UV metre. */
export function duzlem(k: Kova, x0: number, x1: number, z0: number, z1: number, y: number, mal: Mal, asagi = false) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(asagi ? Math.PI / 2 : -Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.ekle(g, mal)
}

interface OdaAyar {
  y0: number; y1: number
  duvar: Mal
  dado?: Mal; dadoH?: number; firiz?: Mal
  delik?: Partial<Record<Yon, Delik[]>>
}

function oda(k: Kova, o: Oda, a: OdaAyar) {
  for (const y of ['K', 'G', 'D', 'B'] as Yon[]) {
    const [ax, az, bx, bz, cu] = hat(o, y)
    const bosluk: Bosluk[] = (a.delik?.[y] ?? []).map((d) => {
      const u0 = Math.min(cu(d.c0), cu(d.c1)), u1 = Math.max(cu(d.c0), cu(d.c1))
      return { u0, u1, y0: d.y0, y1: d.y1, kemerH: d.kemerH, bursa: d.bursa }
    })
    const dh = a.dado ? a.y0 + (a.dadoH ?? 2) : a.y0
    if (a.dado) kaplama(k, ax, az, bx, bz, a.y0, dh, a.dado, bosluk)
    const fh = a.firiz ? dh + 0.55 : dh
    if (a.firiz) kaplama(k, ax, az, bx, bz, dh, fh, a.firiz, bosluk, true)
    kaplama(k, ax, az, bx, bz, fh, a.y1, a.duvar, bosluk)
    ;(a.delik?.[y] ?? []).forEach((d, i) => { if (d.sove) sove(k, ax, az, bx, bz, bosluk[i], d.sove, d.soveMal ?? a.duvar) })
  }
}

/** Duvar üstüne çizilen (açılmayan) pencere: mermer çerçeve, ışık alan lokma ve kafes. */
function pencere(k: Kova, m: UlucamiMalzemeleri, ax: number, az: number, bx: number, bz: number, c: number, y0: number, g: number, h: number, kemerli: boolean, ahsap = false) {
  const u = c
  const yL = kemerli ? kemer(new THREE.Shape(), u, y0, g, h, g * 0.55) : dikdortgen(u - g / 2, y0, u + g / 2, y0 + h)
  const cerceve = dikdortgen(u - g / 2 - 0.22, y0 - 0.22, u + g / 2 + 0.22, y0 + h + (kemerli ? g * 0.55 : 0) + 0.22)
  cerceve.holes.push((kemerli ? kemer(new THREE.Path(), u, y0, g, h, g * 0.55) : pathDik(u - g / 2, y0, u + g / 2, y0 + h)))
  k.ekle(hizala(new THREE.ShapeGeometry(cerceve, 8).translate(0, 0, 0.03), ax, az, bx, bz), m.mermer)
  const panel = new THREE.ShapeGeometry(yL, 8).translate(0, 0, 0.022)
  k.ekle(hizala(panel, ax, az, bx, bz), ahsap ? m.ahsapKafes : m.camKafes)
}
const pathDik = (a: number, b: number, c: number, d: number) => {
  const p = new THREE.Path(); p.moveTo(a, b); p.lineTo(c, b); p.lineTo(c, d); p.lineTo(a, d); p.closePath(); return p
}

/** Duvar üstünde yuvarlak pano: krem halka ve çini göbek; yazı yok. */
function pano(k: Kova, ym: YesilMalzemeleri, ax: number, az: number, bx: number, bz: number, c: number, y: number, r: number) {
  k.ekle(hizala(new THREE.CircleGeometry(r + 0.09, 28).translate(c, y, 0.02), ax, az, bx, bz), ym.firizKoyu)
  k.ekle(hizala(new THREE.CircleGeometry(r, 28).translate(c, y, 0.03), ax, az, bx, bz), ym.mahfilCiniKoyu)
}

/** Mukarnas: daralan kademelerde kemerli hücreler. Yerel düzlemde (u, y) ve -z duvara doğru. */
export function mukarnas(ek: (g: THREE.BufferGeometry, mal: Mal) => void, cx: number, y0: number, G: number, H: number, D: number, ana: Mal, hucre: Mal, kademe = 7) {
  const h = H / kademe
  for (let i = 0; i < kademe; i++) {
    const o = 1 - i / kademe
    const g = G * Math.pow(o, 0.82), dr = D * o + 0.05, y = y0 + i * h
    ek(kutuG(g, h * 0.92, dr).translate(cx, y + h * 0.46, dr / 2), ana)
    const n = Math.max(1, Math.floor(g / 0.48)), adim = g / n
    for (let j = 0; j < n; j++) {
      const x = cx - g / 2 + (j + 0.5) * adim
      const s = new THREE.SphereGeometry(adim * 0.46, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)
      s.scale(1, (h * 0.86) / (adim * 0.46), 0.5)
      ek(s.translate(x, y + 0.01, dr), hucre)
    }
  }
}

function avize(k: Kova, m: UlucamiMalzemeleri, cx: number, cz: number, y: number, R: number, tepe: number, adet: number) {
  const halkaG = (r: number, h: number) => new THREE.TorusGeometry(r, 0.05, 6, 40).rotateX(Math.PI / 2).translate(cx, h, cz)
  k.ekle(halkaG(R, y), m.koyu)
  k.ekle(halkaG(R * 0.5, y + 0.55), m.koyu)
  k.ekle(new THREE.TorusGeometry(R * 0.6, 0.03, 5, 28).rotateX(Math.PI / 2).translate(cx, y + 1.2, cz), m.altin)
  for (let n = 0; n < 6; n++) {
    const a = (n / 6) * Math.PI * 2
    const ip = new THREE.CylinderGeometry(0.018, 0.018, 1, 4)
    const ax = cx + Math.sin(a) * R, az = cz + Math.cos(a) * R
    const uz = Math.hypot(ax - cx, tepe - y, az - cz)
    ip.scale(1, uz, 1)
    ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(cx - ax, tepe - y, cz - az).normalize()))
    ip.translate((ax + cx) / 2, (y + tepe) / 2, (az + cz) / 2)
    k.ekle(ip, m.koyu)
  }
  for (let n = 0; n < adet; n++) {
    const a = (n / adet) * Math.PI * 2
    k.ekle(new THREE.SphereGeometry(0.13, 8, 6).translate(cx + Math.sin(a) * R, y - 0.22, cz + Math.cos(a) * R), m.lamba)
    if (n % 2 === 0) k.ekle(new THREE.SphereGeometry(0.1, 6, 5).translate(cx + Math.sin(a) * R * 0.5, y + 0.3, cz + Math.cos(a) * R * 0.5), m.lamba)
  }
}

export function camiIci(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova, kKasnak: Kova, kKubbe: Kova) {
  // --- Döşemeler ---
  duzlem(k, -15.2, 15.2, -18, 18.2, TABAN - 0.02, m.mermerDoseme)
  duzlem(k, ORTA.x0, ORTA.x1, ORTA.z0, ORTA.z1, TABAN, ym.hali)
  duzlem(k, HOL.x0, HOL.x1, HOL.z0, ORTA.z0, TABAN, ym.hali)
  duzlem(k, MIHRAP.x0, MIHRAP.x1, MIHRAP.z0, MIHRAP.z1, TABAN + MIHRAP_H, ym.hali)
  for (const s of [-1, 1]) {
    const [ex0, ex1] = s > 0 ? [EYVAN.x0, EYVAN.x1] : [-EYVAN.x1, -EYVAN.x0]
    duzlem(k, ex0, ex1, EYVAN.z0, EYVAN.z1, TABAN + EYVAN_H, ym.hali)
    const [tx0, tx1] = s > 0 ? [TABHANE.x0, TABHANE.x1] : [-TABHANE.x1, -TABHANE.x0]
    duzlem(k, tx0, tx1, TABHANE.z0, TABHANE.z1, TABAN, ym.hali)
    const [kx0, kx1] = s > 0 ? [KOSE.x0, KOSE.x1] : [-KOSE.x1, -KOSE.x0]
    duzlem(k, kx0, kx1, KOSE.z0, KOSE.z1, TABAN, ym.hali)
  }

  // --- Orta harim: geniş eyvan kemerleri, mihrap kemeri, kuzey cephesi ---
  const KEMER = { ayak: 8, h: 3.6 }, TABHANE_K = { c0: 1.25, c1: 2.75, y0: TABAN, y1: 3.4 }
  oda(k, ORTA, {
    y0: TABAN, y1: 15, duvar: ym.krem, dado: m.mermer, dadoH: 2.2, firiz: ym.firizLacivert,
    delik: {
      K: [
        { c0: -1.2, c1: 1.2, y0: TABAN, y1: 3.2, kemerH: 1, sove: 1.5, soveMal: m.mermer },
        { c0: -5.8, c1: -2.6, y0: TABAN, y1: 3.6, kemerH: 1.4, sove: 2.6, soveMal: ym.mahfilCini },
        { c0: 2.6, c1: 5.8, y0: TABAN, y1: 3.6, kemerH: 1.4, sove: 2.6, soveMal: ym.mahfilCini },
        { c0: -2.4, c1: 2.4, y0: UST_Y, y1: 10, kemerH: 1.8, sove: 1.5, soveMal: ym.mahfilCini },
      ],
      G: [{ c0: -6.2, c1: 6.2, y0: TABAN, y1: 9.2, kemerH: 3.4, bursa: true, sove: 1.8, soveMal: m.mermer }],
      D: [{ c0: EYVAN.z0 + 0.15, c1: EYVAN.z1 - 0.15, y0: TABAN, y1: KEMER.ayak, kemerH: KEMER.h, sove: 1.4, soveMal: m.mermer }, { ...TABHANE_K, sove: 2.1, soveMal: m.mermer }],
      B: [{ c0: EYVAN.z0 + 0.15, c1: EYVAN.z1 - 0.15, y0: TABAN, y1: KEMER.ayak, kemerH: KEMER.h, sove: 1.4, soveMal: m.mermer }, { ...TABHANE_K, sove: 2.1, soveMal: m.mermer }],
    },
  })
  // Kuzey duvarında çini alan: müezzin mahfilleri ve hünkâr mahfili çevresi (s. 91)
  const kz = ORTA.z0
  const kuzey: Bosluk[] = [
    { u0: 0.7, u1: 3.9, y0: TABAN, y1: 3.6, kemerH: 1.4 },
    { u0: 5.3, u1: 7.7, y0: TABAN, y1: 3.2, kemerH: 1 },
    { u0: 9.1, u1: 12.3, y0: TABAN, y1: 3.6, kemerH: 1.4 },
    { u0: 4.1, u1: 8.9, y0: UST_Y, y1: 10, kemerH: 1.8 },
  ]
  kaplama(k, ORTA.x0, kz, ORTA.x1, kz, TABAN, 6.3, ym.mahfilCini, kuzey.slice(0, 3), false, 0.03)
  kaplama(k, ORTA.x0 + 2.4, kz, ORTA.x1 - 2.4, kz, 6.3, 12.6, ym.mahfilCini, [{ ...kuzey[3], u0: kuzey[3].u0 - 2.4, u1: kuzey[3].u1 - 2.4 }], false, 0.03)
  for (const s of [-1, 1]) {
    pano(k, ym, ORTA.x0, kz, ORTA.x1, kz, 6.5 + s * 4.2, 9.4, 0.8)
    pencere(k, m, ORTA.x0, kz, ORTA.x1, kz, 6.5 + s * 4.3, 6.9, 0.8, 1, true)
  }
  // Mermer kapı çerçevesi
  const kapiCerceve = dikdortgen(4.7, TABAN, 8.3, 5.4)
  kapiCerceve.holes.push(kemer(new THREE.Path(), 6.5, TABAN + 0.001, 2.4, 3.2 - TABAN, 1))
  k.ekle(hizala(cikar(kapiCerceve, 0.12, 0.04), ORTA.x0, kz, ORTA.x1, kz), m.mermer)

  // Müezzin mahfilleri: tamamen çini kaplı, birer basamakla çıkılan iki mekân (s. 101)
  for (const s of [-1, 1]) {
    const [x0, x1] = s > 0 ? [2.6, 5.8] : [-5.8, -2.6]
    const mz: Oda = { x0, x1, z0: -12.6, z1: -10 }
    oda(k, mz, { y0: TABAN, y1: 5.6, duvar: ym.mahfilCini })
    duzlem(k, x0, x1, mz.z0, mz.z1 - 0.5, TABAN + EYVAN_H, ym.hali)
    duzlem(k, x0, x1, mz.z0, mz.z1, 5.5, ym.mahfilCiniKoyu, true)
    k.ekle(yer(kutuG(x1 - x0, EYVAN_H * 0.5, 0.5), (x0 + x1) / 2, TABAN + EYVAN_H * 0.25, mz.z1 - 0.25), m.mermer)
    k.ekle(yer(kutuG(x1 - x0, EYVAN_H, 0.02), (x0 + x1) / 2, TABAN + EYVAN_H * 0.5, mz.z1 - 0.5), m.mermer)
  }

  // --- Giriş holü ---
  oda(k, HOL, {
    y0: TABAN, y1: 6.6, duvar: ym.krem, dado: m.mermer, dadoH: 2.6,
    delik: {
      K: [],
      G: [{ c0: -1.2, c1: 1.2, y0: TABAN, y1: 3.2, kemerH: 1 }],
      D: [{ c0: -16.2, c1: -14.4, y0: TABAN, y1: 3.2, sove: 4.4, soveMal: m.mermer }],
      B: [{ c0: -16.2, c1: -14.4, y0: TABAN, y1: 3.2, sove: 4.4, soveMal: m.mermer }],
    },
  })
  duzlem(k, HOL.x0, HOL.x1, HOL.z0, HOL.z1, 6.58, ym.kirmiziKalem, true)
  // Kapının iç yüzü
  k.ekle(yer(kutuG(2.6, 3.4, 0.12), 0, TABAN + 1.7, HOL.z0 + 0.08), ym.ceviz)
  k.ekle(yer(kutuG(3, 0.3, 0.2), 0, TABAN + 3.5, HOL.z0 + 0.1), m.mermer)

  // --- Yan mekânlar (iki yan simetrik) ---
  for (const s of [-1, 1]) {
    const yan = (o: Oda): Oda => (s > 0 ? o : { x0: -o.x1, x1: -o.x0, z0: o.z0, z1: o.z1 })
    const ic: Yon = s > 0 ? 'B' : 'D', dis: Yon = s > 0 ? 'D' : 'B'

    // Eyvan: 7 m çapında 18 m yüksekliğinde 24 dilimli kubbe; duvarlar 2 m çini + yazı kuşağı yerine bitkisel kuşak (s. 103)
    const ey = yan(EYVAN)
    oda(k, ey, {
      y0: TABAN + EYVAN_H, y1: 11.5, duvar: ym.krem, dado: ym.yesilCini, dadoH: 2, firiz: ym.firizFiruze,
      delik: { [ic]: [{ c0: EYVAN.z0 + 0.15, c1: EYVAN.z1 - 0.15, y0: TABAN, y1: KEMER.ayak, kemerH: KEMER.h }] },
    })
    const ex = s * EYVAN_X
    const [dax, daz, dbx, dbz] = hat(ey, dis)
    pencere(k, m, dax, daz, dbx, dbz, 3.5, TABAN + EYVAN_H + 0.6, 1.5, 2, false, true)
    pencere(k, m, dax, daz, dbx, dbz, 3.5, 7.6, 1.2, 1.7, true)
    pano(k, ym, dax, daz, dbx, dbz, 1.1, 6.5, 0.55)
    pano(k, ym, dax, daz, dbx, dbz, 5.9, 6.5, 0.55)
    kKasnak.ekle(duzGolge(gecisKusagi(ex, EYVAN_Z, 3.5, 3.5, 11.5, 14, 3.5, 8)), ym.gecis)
    kKubbe.ekle(yer(dondurG(icKubbeProfil(3.5, 3.9), 48, [1, 1]), ex, 14, EYVAN_Z), ym.kubbeKalemB)
    // Basamaklar: eyvanın önü
    const on = s > 0 ? 6.9 : -7.9
    k.ekle(yer(kutuG(1, EYVAN_H * 0.5, 6.7), on + 0.5, TABAN + EYVAN_H * 0.25, EYVAN_Z), m.mermer)
    k.ekle(yer(kutuG(0.06, EYVAN_H, 6.7), s * EYVAN.x0, TABAN + EYVAN_H / 2, EYVAN_Z), m.mermer)

    // Tabhane: doğudaki 32, batıdaki 24 dilimli kubbe; açık mavi altıgen çini (s. 105)
    const tb = yan(TABHANE)
    oda(k, tb, {
      y0: TABAN, y1: 7.2, duvar: ym.krem, dado: ym.firuzeCini, dadoH: 2.5, firiz: ym.firizFiruze,
      delik: { [ic]: [TABHANE_K] },
    })
    const tx = (tb.x0 + tb.x1) / 2, tz = (tb.z0 + tb.z1) / 2
    k.ekle(duzGolge(gecisKusagi(tx, tz, 3.15, 3.35, 7.2, 8.8, 3.05, 8)), ym.krem)
    k.ekle(yer(dondurG(icKubbeProfil(3.05, 2.7), 32, [1, 1]), tx, 8.8, tz), s > 0 ? ym.kubbeBeyaz : ym.kubbeKalemB)
    const [tax, taz, tbx, tbz] = hat(tb, dis)
    pencere(k, m, tax, taz, tbx, tbz, 3.35, TABAN + 0.6, 1.4, 1.9, false, true)
    pencere(k, m, tax, taz, tbx, tbz, 3.35, 5.1, 1, 1.2, true)
    const [gax, gaz, gbx, gbz] = hat(tb, 'G')
    pencere(k, m, gax, gaz, gbx, gbz, 3.15, 5.1, 1, 1.2, true)
    // Ocak: alçı nişli
    const ocakG = 1.6
    k.ekle(yer(kutuG(ocakG, 2.6, 0.5), tx, TABAN + 1.3, tb.z1 - 0.25), m.mermer)
    k.ekle(yer(kutuG(ocakG - 0.5, 1.5, 0.04), tx, TABAN + 0.8, tb.z1 - 0.52), m.koyu)

    // Köşe odaları: kapı koridoru, çini kaplı alt duvarlar, kalem işli örtü (s. 101)
    const ko = yan(KOSE)
    oda(k, ko, {
      y0: TABAN, y1: 6.6, duvar: ym.krem, dado: ym.lacivertCini, dadoH: 3.1, firiz: ym.firizLacivert,
      delik: { [ic]: [{ c0: -16.2, c1: -14.4, y0: TABAN, y1: 3.2 }] },
    })
    const mx = s > 0 ? [KOSE.x0, MERDIVEN_X0] : [-MERDIVEN_X0, -KOSE.x0]
    duzlem(k, mx[0], mx[1], KOSE.z0, KOSE.z1, 6.58, ym.kirmiziKalem, true)
    const [kax, kaz, kbx, kbz] = hat(ko, 'K')
    pencere(k, m, kax, kaz, kbx, kbz, 2.8, TABAN + 0.8, 1.5, 2, false, true)
    const [dkx, dkz, dlx, dlz] = hat(ko, dis)
    pencere(k, m, dkx, dkz, dlx, dlz, 4.4, TABAN + 0.8, 1.5, 2, false, true)

    // Merdiven: köşe odasının dış duvarı boyunca (yeri temsilî)
    const adim = 22, mX = s * (MERDIVEN_X0 + 14.9) / 2
    for (let i = 0; i < adim; i++) {
      const t = i / adim
      const z = -8.6 - t * 7.4, h = (t + 1 / adim) * UST_H
      k.ekle(yer(kutuG(1.3, h, 7.4 / adim + 0.02), mX, TABAN + h / 2, z - 7.4 / adim / 2), m.mermer)
    }

    // Üst katın merdiven kovası ve koridoru
    const [kv0, kv1] = s > 0 ? [MERDIVEN_X0, 14.9] : [-14.9, -MERDIVEN_X0]
    oda(k, { x0: kv0, x1: kv1, z0: -16, z1: -8.5 }, { y0: 6.6, y1: 10.2, duvar: ym.krem, delik: { K: [{ c0: kv0, c1: kv1, y0: 6.6, y1: 10.2 }] } })
    duzlem(k, kv0, kv1, -16, -8.5, 10.2, ym.krem, true)
    const kor: Oda = s > 0 ? { x0: 3.2, x1: 14.9, z0: -17.3, z1: -16 } : { x0: -14.9, x1: -3.2, z0: -17.3, z1: -16 }
    oda(k, kor, { y0: UST_Y, y1: 10.2, duvar: ym.mahfilCiniKoyu, delik: { G: [{ c0: kv0, c1: kv1, y0: UST_Y, y1: 10.2 }], [ic]: [{ c0: -17.1, c1: -16.1, y0: UST_Y, y1: 9.3 }] } })
    duzlem(k, kor.x0, kor.x1, kor.z0, kor.z1, UST_Y, m.mermerDoseme)
    duzlem(k, kor.x0, kor.x1, kor.z0, kor.z1, 10.2, ym.krem, true)
  }

  // Koridorların tavanı ve üst kat sofası
  const SOFA_Y = 11.6
  oda(k, SOFA, {
    y0: UST_Y, y1: SOFA_Y, duvar: ym.mahfilCini, dado: ym.firuzeCini, dadoH: 1.4, firiz: ym.firizLacivert,
    delik: {
      G: [{ c0: -2.4, c1: 2.4, y0: UST_Y, y1: 10, kemerH: 1.4 }],
      D: [{ c0: -17.1, c1: -16.1, y0: UST_Y, y1: 9.3 }],
      B: [{ c0: -17.1, c1: -16.1, y0: UST_Y, y1: 9.3 }],
    },
  })
  duzlem(k, SOFA.x0, SOFA.x1, SOFA.z0, -10.1, UST_Y, m.mermerDoseme)
  duzlem(k, SOFA.x0, SOFA.x1, SOFA.z0, SOFA.z1, SOFA_Y, ym.mahfilCiniKoyu, true)
  const [sax, saz, sbx, sbz] = hat(SOFA, 'K')
  pencere(k, m, sax, saz, sbx, sbz, 3.2, UST_Y + 0.9, 1.5, 1.8, false, true)
  // Mahfil korkuluğu
  k.ekle(yer(kutuG(4.8, 1, 0.1), 0, UST_Y + 0.5, -10.15), m.ahsapKafes)
  k.ekle(yer(kutuG(4.9, 0.08, 0.2), 0, UST_Y + 1.03, -10.15), ym.ceviz)

  // --- Orta kubbe: Türk üçgenli geçiş, 13 m çap, tepede ışık feneri (s. 101) ---
  kKasnak.ekle(duzGolge(gecisKusagi(0, ORTA_Z, 6.5, 6.5, 15, 19, 6.5)), ym.gecis)
  const profilOrta = icKubbeProfil(6.5, 5.85, 1.45)
  kKubbe.ekle(yer(dondurG(profilOrta, 64, [1, 1]), 0, 19, ORTA_Z), ym.kubbeKalemA)
  kKubbe.ekle(new THREE.CircleGeometry(1.7, 24).rotateX(Math.PI / 2).translate(0, 25.7, ORTA_Z), ym.camIsik)
  k.ekle(yer(silindirG(0.03, 0.03, 15, 4), 0, 16, ORTA_Z), m.koyu)
  avize(k, m, 0, ORTA_Z, 6.2, 3.4, 13.5, 32)

  // Kasnak pencereleri: orta kubbede dört, mihrap önünde sekiz (s. 106)
  for (const [[a, b, c, d], c0] of [
    [[ORTA.x0, ORTA.z0, ORTA.x1, ORTA.z0], 6.5],
    [[ORTA.x1, ORTA.z0, ORTA.x1, ORTA.z1], 6.5],
    [[ORTA.x0, ORTA.z1, ORTA.x0, ORTA.z0], 6.5],
  ] as [[number, number, number, number], number][]) pencere(k, m, a, b, c, d, c0, 12.6, 1.5, 1.2, true)

  // --- Mihrap bölümü ---
  const M = MIHRAP, MY = TABAN + MIHRAP_H
  oda(k, M, {
    y0: MY, y1: 15, duvar: ym.krem, dado: ym.lacivertCini, dadoH: 2, firiz: ym.firizLacivert,
    delik: { K: [{ c0: -6.2, c1: 6.2, y0: TABAN, y1: 9.2, kemerH: 3.4, bursa: true }] },
  })
  kaplama(k, M.x0, M.z0, M.x1, M.z0, TABAN, MY, m.mermer, [{ u0: 4.1, u1: 8.9, y0: TABAN, y1: MY }])
  kKasnak.ekle(duzGolge(gecisKusagi(0, MIHRAP_Z, 6.5, 6.5, 15, 19, 6.5)), ym.gecis)
  kKubbe.ekle(yer(dondurG(icKubbeProfil(6.5, 6), 64, [1, 1]), 0, 19, MIHRAP_Z), ym.kubbeKalemA)
  avize(k, m, 0, MIHRAP_Z, 7.5, 2.6, 15, 24)
  k.ekle(yer(silindirG(0.03, 0.03, 15, 4), 0, 17.5, MIHRAP_Z), m.koyu)

  // Mihrap duvarı: alt ve üst sırada ikişer pencere (s. 106); yan duvarlarda birer pencere, panolar
  const [gx0, gz0, gx1, gz1] = hat(M, 'G')
  for (const u of [1.7, 11.3]) {
    pencere(k, m, gx0, gz0, gx1, gz1, u, MY + 0.3, 1.5, 1.5, false, true)
    pencere(k, m, gx0, gz0, gx1, gz1, u, 8.1, 1.1, 1.7, true)
  }
  pano(k, ym, gx0, gz0, gx1, gz1, 1.7, 6.1, 0.65)
  pano(k, ym, gx0, gz0, gx1, gz1, 11.3, 6.1, 0.65)
  for (const y of ['D', 'B'] as Yon[]) {
    const [a, b, c, d] = hat(M, y)
    pencere(k, m, a, b, c, d, 6.5, MY + 0.3, 1.8, 2, false, true)
    pencere(k, m, a, b, c, d, 6.5, 8.6, 1.1, 1.8, true)
    pano(k, ym, a, b, c, d, 3.2, 8, 1.35)
    pano(k, ym, a, b, c, d, 9.8, 8, 1.35)
    pano(k, ym, a, b, c, d, 6.5, 12.8, 0.6)
  }
  // Mihrap önü alçak mermer set ve iki basamak (fotoğrafta nişli; s. 90)
  for (const s of [-1, 1]) {
    k.ekle(yer(kutuG(3.8, MIHRAP_H, 1.8), s * 4.3, TABAN + MIHRAP_H / 2, 3.9), m.mermer)
    for (const x of [2.9, 4.3, 5.7]) k.ekle(yer(kutuG(0.9, 0.6, 0.03), s * x, TABAN + 0.48, 2.985), ym.cevizKoyu)
  }
  for (let i = 0; i < 3; i++) {
    const h = (i + 1) / 3 * MIHRAP_H
    k.ekle(yer(kutuG(4.8, h, 1.8 - i * 0.6), 0, TABAN + h / 2, 3 + (1.8 - i * 0.6) / 2 + i * 0.6), m.mermer)
  }

  // Mihrap: yaklaşık 6 m genişlik, 10,67 m yükseklik (s. 106); yazı yerine geometrik pano
  mihrap(m, ym, k)
  minberVeKursu(m, ym, k)

  // --- Şadırvan (fıskiye): sekizgen koyu mermer gövde, açık mermer sekiler; merkezde kademeli fıskiye (s. 90, 103) ---
  const f = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(g.translate(0, 0, ORTA_Z), mal)
  f(duzGolge(silindirG(3.2, 3.3, 0.14, 8)).rotateY(Math.PI / 8).translate(0, TABAN + 0.07, 0), m.mermer)
  f(prizma(cokgen(8, 2.45), TABAN + 0.14, TABAN + 1.15), ym.siyahMermer)
  f(duzGolge(silindirG(2.72, 2.72, 0.18, 8)).rotateY(Math.PI / 8).translate(0, TABAN + 1.24, 0), m.mermer)
  f(silindirG(2.42, 2.42, 0.02, 8).rotateY(Math.PI / 8).translate(0, TABAN + 1.34, 0), m.su)
  f(dondurG([[0.72, 0], [0.5, 0.25], [0.5, 0.6], [0.72, 0.68], [0.72, 0.82], [0.46, 0.9], [0.46, 1.5], [0.66, 1.6], [0.56, 1.72], [0.2, 2.18], [0.07, 2.36], [0.14, 2.42], [0, 2.56]], 12).translate(0, TABAN + 1.2, 0), m.mermer)
}

/** İç kubbe yarım kesiti: `acik` verilirse tepede fener boşluğu kalır. */
function icKubbeProfil(R: number, H: number, acik = 0): [number, number][] {
  const p: [number, number][] = []
  for (let t = 0; t <= 16; t++) {
    const a = (t / 16) * Math.PI / 2, r = R * Math.pow(Math.cos(a), 0.92)
    if (acik && r < acik) break
    p.push([Math.max(r, 0.001), H * Math.pow(Math.sin(a), 1.02)])
  }
  return p
}

function mihrap(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova) {
  const Z = MIHRAP.z1, ax = 3.05, bx = -3.05, MY = TABAN + MIHRAP_H, TEPE = MY + 10.67
  const NIS = { g: 2.3, ayak: 3, kemer: 1.7 }
  const blok = dikdortgen(0, MY, 6.1, TEPE)
  blok.holes.push(kemer(new THREE.Path(), 3.05, MY + 0.02, NIS.g, NIS.ayak, NIS.kemer))
  levha(k, blok, ax, Z, bx, Z, ym.mihrap, 0.34, 0.01, true)
  // Çerçeve üstü: düz sarı kuşak ve alt mermer
  k.ekle(yer(kutuG(6.3, 0.16, 0.44), 0, TEPE, Z - 0.22), m.altinKoyu)
  // Niş: lacivert zemin, mukarnaslı kavsara
  k.ekle(yer(kutuG(NIS.g + 0.04, NIS.ayak + NIS.kemer, 0.03), 0, MY + (NIS.ayak + NIS.kemer) / 2, Z - 0.03), ym.mahfilCiniKoyu)
  const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(hizala(g.translate(0, 0, 0.02), 0, Z, -1, Z), mal)
  mukarnas(ek, 0, MY + NIS.ayak - 0.1, NIS.g - 0.08, NIS.kemer, 0.3, ym.firuzeCini, m.altinKoyu, 6)
  // Sütunçeler ve alt kuşak
  for (const s of [-1, 1]) k.ekle(yer(silindirG(0.09, 0.09, NIS.ayak - 0.1, 10), s * (NIS.g / 2 + 0.14), MY + NIS.ayak / 2, Z - 0.38), ym.firuzeCini)
}

function minberVeKursu(m: UlucamiMalzemeleri, ym: YesilMalzemeleri, k: Kova) {
  const X = -4.7, Z0 = 11.6, Z1 = 15.8, EN = 1.2, MY = TABAN + MIHRAP_H, TEPE = 2.7
  const ek = (g: THREE.BufferGeometry, mal: Mal) => {
    g.rotateY(-Math.PI / 2)
    g.translate(X, 0, Z0)
    k.ekle(g, mal)
  }
  const BOY = Z1 - Z0
  const yan = new THREE.Shape()
  yan.moveTo(-0.5, MY); yan.lineTo(BOY + 1.2, MY); yan.lineTo(BOY + 1.2, MY + TEPE + 0.95); yan.lineTo(BOY, MY + TEPE + 0.95); yan.lineTo(0, MY + 0.95); yan.lineTo(-0.5, MY + 0.95); yan.closePath()
  for (const s of [-1, 1]) ek(cikar(yan, 0.1, s * (EN / 2 + 0.05) - 0.05), m.kundekari)
  const ADIM = 11
  for (let i = 0; i < ADIM; i++) {
    const t = i / ADIM, h = (t + 1 / ADIM) * TEPE, u = t * BOY
    ek(kutuG(BOY / ADIM + 0.01, h, EN).translate(u + BOY / ADIM / 2, MY + h / 2, 0), m.mihrapKirmizi)
  }
  ek(kutuG(1.2, TEPE, EN).translate(BOY + 0.6, MY + TEPE / 2, 0), m.mihrapKirmizi)
  // Köşk: dört ince ayak ve fotoğraftaki gibi uzun sivri külah
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ek(kutuG(0.1, 2.5, 0.1).translate(BOY + 0.6 + a * 0.54, MY + TEPE + 1.25, b * (EN / 2 + 0.03)), ym.cevizKoyu)
  ek(kutuG(1.3, 0.18, EN + 0.25).translate(BOY + 0.6, MY + TEPE + 2.55, 0), ym.ceviz)
  ek(duzGolge(silindirG(0.02, 0.86, 3.2, 8).rotateY(Math.PI / 8).translate(BOY + 0.6, MY + TEPE + 4.25, 0)), ym.ceviz)
  // Kapı: iki direk ve taç
  for (const s of [-1, 1]) ek(kutuG(0.14, 2.8, 0.14).translate(-0.4, MY + 1.4, s * (EN / 2 + 0.05)), ym.ceviz)
  ek(kutuG(0.2, 0.5, EN + 0.3).translate(-0.4, MY + 2.9, 0), m.kundekari)
  // Kürsü
  k.ekle(yer(kutuG(1.8, 1.1, 1.4), 4.6, MY + 0.55, 15.6), ym.ceviz)
  k.ekle(yer(kutuG(2, 0.1, 1.6), 4.6, MY + 1.14, 15.6), ym.cevizKoyu)
  k.ekle(yer(kutuG(1.5, 0.75, 1.1), 4.6, MY + 0.4, 15.6), m.kundekari)
}

// --- Yürüme ---

const ODALAR: Oda[] = [
  HOL,
  { x0: -1.2, x1: 1.2, z0: HOL.z1 - 0.01, z1: ORTA.z0 + 0.01 },
  ORTA,
  { x0: -6.5, x1: 6.5, z0: 2.9, z1: 4.9 },
  MIHRAP,
  ...[1, -1].flatMap((s) => {
    const yan = (o: Oda): Oda => (s > 0 ? o : { x0: -o.x1, x1: -o.x0, z0: o.z0, z1: o.z1 })
    return [
      yan({ x0: 2.6, x1: 5.8, z0: -12.6, z1: ORTA.z0 + 0.01 }),
      yan({ x0: 6.4, x1: EYVAN.x1, z0: EYVAN.z0, z1: EYVAN.z1 }),
      yan({ x0: 6.4, x1: TABHANE.x0 + 0.1, z0: 1.25, z1: 2.75 }),
      yan(TABHANE),
      yan({ x0: HOL.x1 - 0.1, x1: KOSE.x0 + 0.1, z0: -16.2, z1: -14.4 }),
      yan(KOSE),
    ]
  }),
]

/** Odaların dışında kalan her yer çarpışma kutusu olur; üst kattaki oyuncu bu kutuların üstünden geçer. */
function duvarKutulari(sinir: Kutu): Kutu[] {
  const xs = [...new Set([sinir.x0, sinir.x1, ...ODALAR.flatMap((o) => [o.x0, o.x1])])].filter((v) => v >= sinir.x0 && v <= sinir.x1).sort((a, b) => a - b)
  const zs = [...new Set([sinir.z0, sinir.z1, ...ODALAR.flatMap((o) => [o.z0, o.z1])])].filter((v) => v >= sinir.z0 && v <= sinir.z1).sort((a, b) => a - b)
  const sonuc: Kutu[] = []
  for (let i = 0; i < xs.length - 1; i++) {
    let bas: number | null = null
    for (let j = 0; j < zs.length - 1; j++) {
      const mx = (xs[i] + xs[i + 1]) / 2, mz = (zs[j] + zs[j + 1]) / 2
      const bos = ODALAR.some((o) => mx > o.x0 && mx < o.x1 && mz > o.z0 && mz < o.z1)
      if (!bos && bas === null) bas = zs[j]
      if (bos && bas !== null) { sonuc.push({ x0: xs[i], x1: xs[i + 1], z0: bas, z1: zs[j], ust: 5.5 }); bas = null }
    }
    if (bas !== null) sonuc.push({ x0: xs[i], x1: xs[i + 1], z0: bas, z1: zs[zs.length - 1], ust: 5.5 })
  }
  return sonuc
}

export function camiYurumeAlani(): IcYurume {
  const sinir: Kutu = { x0: -14.9, x1: 14.9, z0: -17.3, z1: 17.8 }
  const kutular = duvarKutulari(sinir)
  const zeminler: ZeminAlani[] = [
    // Mihrap bölümü ve basamaklar
    { x0: -6.5, x1: 6.5, z0: 4.75, z1: 17.8, h0: MIHRAP_H, h1: MIHRAP_H },
    { x0: -2.4, x1: 2.4, z0: 3, z1: 4.75, h0: 0, h1: MIHRAP_H },
    // Müezzin mahfilleri: basamak bandı + düz alan
    { x0: 2.6, x1: 5.8, z0: -12.6, z1: -10.5, h0: EYVAN_H, h1: EYVAN_H },
    { x0: 2.6, x1: 5.8, z0: -10.5, z1: -10, h0: EYVAN_H / 2, h1: EYVAN_H / 2 },
    { x0: -5.8, x1: -2.6, z0: -12.6, z1: -10.5, h0: EYVAN_H, h1: EYVAN_H },
    { x0: -5.8, x1: -2.6, z0: -10.5, z1: -10, h0: EYVAN_H / 2, h1: EYVAN_H / 2 },
    // Üst kat: mahfil, sofa, koridorlar, merdivenler (altından geçilir)
    { x0: -3.2, x1: 3.2, z0: -17.3, z1: -10.4, h0: UST_H, h1: UST_H, altGecilir: true },
  ]
  for (const s of [1, -1]) {
    const x = (a: number, b: number) => (s > 0 ? { x0: a, x1: b } : { x0: -b, x1: -a })
    zeminler.push(
      { ...x(EYVAN.x0, EYVAN.x1), z0: EYVAN.z0, z1: EYVAN.z1, h0: EYVAN_H, h1: EYVAN_H },
      { ...x(6.9, EYVAN.x0), z0: EYVAN.z0, z1: EYVAN.z1, h0: EYVAN_H / 2, h1: EYVAN_H / 2 },
      { ...x(3.2, 14.9), z0: -17.3, z1: -16, h0: UST_H, h1: UST_H, altGecilir: true },
      { ...x(MERDIVEN_X0, 14.9), z0: MERDIVEN_Z0, z1: -8.6, h0: UST_H, h1: 0 },
    )
  }
  const minber = { x0: -5.3, x1: -4.1, z0: 11.6, z1: 15.8, h0: MIHRAP_H, h1: MIHRAP_H + 2.7 }
  zeminler.push(minber, { x0: -5.3, x1: -4.1, z0: 15.8, z1: 17, h0: MIHRAP_H + 2.7, h1: MIHRAP_H + 2.7 })
  return {
    sinir,
    kutular: [
      ...kutular,
      { x0: 3.65, x1: 5.55, z0: 14.85, z1: 16.35, ust: MIHRAP_H + 1.2 },
      { x0: -3.05, x1: 3.05, z0: 17.4, z1: 17.8 },
      { x0: 2.4, x1: 6.5, z0: 3, z1: 4.75 },
      { x0: -6.5, x1: -2.4, z0: 3, z1: 4.75 },
    ],
    daireler: [{ x: 0, z: ORTA_Z, r: 3.2 }],
    zeminler,
    gorusKesenler: kutular.map(({ x0, x1, z0, z1 }) => ({ x0, x1, z0, z1 })),
    gozY: GOZ_Y,
    tabanY: TABAN,
  }
}

export const camiDuraklari: IcDurak[] = [
  { id: 'giris', ad: 'Giriş holü', konum: [0, GOZ_Y, -15.2], bak: [0, 3, 0] },
  { id: 'fiskiye', ad: 'Fıskiyeli orta mekân', konum: [3.6, GOZ_Y, -7.8], bak: [0, 2.4, 6] },
  { id: 'mihrap', ad: 'Mihrap', konum: [0, GOZ_Y + MIHRAP_H, 7.4], bak: [0, 6.4, 17.8] },
  { id: 'eyvan', ad: 'Doğu eyvanı', konum: [9, GOZ_Y + EYVAN_H, -3.5], bak: [14.9, 4, -3.5] },
  { id: 'hunkar', ad: 'Hünkâr mahfili', konum: [0, GOZ_Y + UST_H, -11.2], bak: [0, 6, 12] },
  { id: 'muezzin', ad: 'Müezzin mahfili', konum: [4.2, GOZ_Y + EYVAN_H, -11.2], bak: [-2, 3.5, 2] },
  { id: 'tabhane', ad: 'Tabhane', konum: [11.8, GOZ_Y, 3.3], bak: [11.8, 3.5, 8.1] },
  { id: 'kose', ad: 'Köşe odası', konum: [10, GOZ_Y, -10.5], bak: [11, 3, -17.3] },
  { id: 'minber', ad: 'Minbere çık', konum: [-4.7, GOZ_Y + MIHRAP_H + 2.7, 16.4], bak: [4, 3, 2] },
]

