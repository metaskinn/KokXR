// Umur Bey Külliyesi temsilî maketi (Bursa, Yıldırım). Birim metre. Kuzey = -z, kıble (güney) = +z, doğu = +x.
// Kaynaklı ölçüler: iki mekân 8,18 × 8,10 m ve 6,34 × 6,60 m, aradaki geçit 2,20 m (Yıldırım Belediyesi, envanter);
// türbe 4,60 × 4,60 m; taş vakfiye 1,35 × 2,15 m; beş gözlü son cemaat yeri (envanter).
// Yerleşim, yükseklikler, duvar kalınlığı, pencere ve mobilya biçimleri Drive arşivindeki fotoğraflara bakılarak yorumlanmıştır.
// Hat yazısı taklit edilmez: yalnız taş vakfiye ve çeşme kitabesi gerçek fotoğrafla gösterilir.
import * as THREE from 'three'
import type { Maket } from '../ulucamiMaket'
import type { Kutu, IcDurak, ZeminAlani } from '../ulucamiIc'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, uvSigdir, yer } from '../ulucamiParca'
import { rastgele } from '../ulucamiZemin'
import { umurbeyMalzemeleri } from './umurbey-kulliyesi-parca/dokular'

type Mal = THREE.Material

// --- Plan ---
const DUVAR = 1.05
/** Ana mekân iç yüzleri (8,18 × 8,10 m). */
const A = { x0: -7.785, x1: 0.395, z0: -1.9, z1: 6.2 }
/** Küçük mekân iç yüzleri (6,34 × 6,60 m). Kuzey duvarı ana mekânla aynı hizada (tepeden fotoğraf). */
const B = { x0: 1.445, x1: 7.785, z0: -1.9, z1: 4.7 }
const AX = (A.x0 + A.x1) / 2, AZ = (A.z0 + A.z1) / 2
const BX = (B.x0 + B.x1) / 2, BZ = (B.z0 + B.z1) / 2
const XB = A.x0 - DUVAR, XD = B.x1 + DUVAR
const ZK = A.z0 - DUVAR, ZG_A = A.z1 + DUVAR, ZG_B = B.z1 + DUVAR
/** Son cemaat yeri: tepeden fotoğraftaki orana göre 4,3 m derin. */
const ZSC = ZK - 4.3
const UC_DUVAR = 0.85
const GOZ = (XD - XB - 2 * UC_DUVAR) / 5
const GOZ_MERKEZ = (i: number) => XB + UC_DUVAR + GOZ * (i + 0.5)
const DOSEME = 0.35
const GOZ_Y = 1.6
const H = 7.6, KORNIS = 7.05
const GECIT = { z0: BZ - 1.1, z1: BZ + 1.1 }
const MAHFIL = { z1: 0.5, y: DOSEME + 3.1, merd: { x0: -1.35, x1: -0.55, z1: 4.1 } }
const MINBER = { x: AX - 2.75, en: 1, z0: A.z1 - 3.9, rz0: A.z1 - 3.6, rz1: A.z1 - 1, tepe: DOSEME + 2.1 }
const TURBE = { x: AX, z: ZG_A + 2.9 + 2.3, y: 4.6 }
const MINARE = { x: XB - 1.35, z: ZK - 0.25 }
const SADIRVAN = { x: 8, z: ZSC - 3 }

const dik = (x0: number, y0: number, x1: number, y1: number) => dikdortgen(x0, y0, x1, y1) as unknown as THREE.Path

/** Düz üçgen yüzey listesinden gölgeli geometri (UV metre). */
function yuzey(ucgenler: { p: number[]; uv: number[] }[]) {
  const pos: number[] = [], uv: number[] = []
  ucgenler.forEach((u) => { pos.push(...u.p); uv.push(...u.uv) })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Dört yana eğimli çatı: alt dikdörtgenden üst dikdörtgene (üst nokta olabilir). UV: u saçak boyunca, v eğim boyunca. */
function dortEgim(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, ix: number, iz: number) {
  const X0 = x0 + ix, X1 = x1 - ix, Z0 = z0 + iz, Z1 = z1 - iz
  const a: { p: number[]; uv: number[] }[] = []
  const trapez = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number) => {
    // a-b saçak, c-d mahya (c, b'nin üstünde)
    const L = Math.hypot(bx - ax, bz - az)
    const orta = (L - Math.hypot(cx - dx, cz - dz)) / 2
    const egim = Math.hypot(Math.hypot((ax + bx) / 2 - (cx + dx) / 2, (az + bz) / 2 - (cz + dz) / 2), y1 - y0)
    a.push({ p: [ax, y0, az, bx, y0, bz, cx, y1, cz], uv: [0, 0, L, 0, L - orta, egim] })
    a.push({ p: [ax, y0, az, cx, y1, cz, dx, y1, dz], uv: [0, 0, L - orta, egim, orta, egim] })
  }
  trapez(x0, z1, x1, z1, X1, Z1, X0, Z1)
  trapez(x1, z1, x1, z0, X1, Z0, X1, Z1)
  trapez(x1, z0, x0, z0, X0, Z0, X1, Z0)
  trapez(x0, z0, x0, z1, X0, Z1, X0, Z0)
  return yuzey(a)
}

/** Sıra sıra bindirmeli kiremit kubbe; profil basamaklıdır, UV'nin v'si sıraya oturur. */
function kiremitKubbe(r: number, h: number, sira: number, parca: number) {
  const noktalar: [number, number][] = []
  const v: number[] = []
  for (let i = 0; i < sira; i++) {
    const a0 = (i / sira) * Math.PI / 2, a1 = ((i + 1) / sira) * Math.PI / 2
    noktalar.push([r * Math.cos(a0) + 0.05, h * Math.sin(a0) - 0.03], [r * Math.cos(a1), h * Math.sin(a1)])
    v.push(i * 0.33 + 0.01, (i + 1) * 0.33)
  }
  noktalar[noktalar.length - 1][0] = 0.001
  const g = dondurG(noktalar, parca, [2 * Math.PI * r, 1])
  const uv = g.attributes.uv
  for (let s = 0; s <= parca; s++) for (let j = 0; j < noktalar.length; j++) uv.setY(s * noktalar.length + j, v[j])
  return g
}

/** Kare ağızdan on altıgen ağza geçen "Türk üçgenleri" kuşağı (içeriden fotoğraftaki kırma yüzler). */
function ucgenKusagi(cx: number, cz: number, ax: number, az: number, y0: number, y1: number, R: number) {
  const N = 16, alt: [number, number][] = []
  for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) {
    const t = i / 4
    if (k === 0) alt.push([cx - ax + 2 * ax * t, cz + az])
    if (k === 1) alt.push([cx + ax, cz + az - 2 * az * t])
    if (k === 2) alt.push([cx + ax - 2 * ax * t, cz - az])
    if (k === 3) alt.push([cx - ax, cz - az + 2 * az * t])
  }
  const a0 = Math.atan2(-ax, az)
  const ust = (i: number): [number, number] => {
    const a = a0 + ((i + 0.5) / N) * Math.PI * 2
    return [cx + Math.sin(a) * R, cz + Math.cos(a) * R]
  }
  const a: { p: number[]; uv: number[] }[] = []
  for (let i = 0; i < N; i++) {
    const b0 = alt[i], b1 = alt[(i + 1) % N], t0 = ust(i), t1 = ust((i + 1) % N)
    a.push({ p: [b0[0], y0, b0[1], b1[0], y0, b1[1], t0[0], y1, t0[1]], uv: [0, 0, 1, 0, 0.5, 1] })
    a.push({ p: [t0[0], y1, t0[1], b1[0], y0, b1[1], t1[0], y1, t1[1]], uv: [0, 1, 1, 0, 1, 1] })
  }
  return yuzey(a)
}

export const yapi = (): Maket => {
  const m = umurbeyMalzemeleri()
  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()
  const kutu = (g: number, h: number, d: number, mal: Mal, x: number, y: number, z: number, kv = k) =>
    kv.ekle(yer(kutuG(g, h, d), x, y, z), mal)
  const r = rastgele(865)

  // --- Çarpışma listeleri ---
  const engeller: Kutu[] = []
  const duvarlar: Kutu[] = []
  const daireler: { x: number; z: number; r: number; ust?: number }[] = []
  const zeminler: ZeminAlani[] = []
  const engel = (x0: number, x1: number, z0: number, z1: number, duvar = false, ust?: number) => {
    const b: Kutu = { x0, x1, z0, z1, ...(ust === undefined ? {} : { ust }) }
    engeller.push(b)
    if (duvar) duvarlar.push(b)
  }

  // --- Zemin: çim, avlu taşı, sekiler ---
  const zeminDaire = new THREE.CircleGeometry(23.8, 64).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const zp = zeminDaire.attributes.position, zuv = zeminDaire.attributes.uv
  for (let i = 0; i < zuv.count; i++) zuv.setXY(i, zp.getX(i), zp.getZ(i))
  k.ekle(zeminDaire, m.cim)
  // Kuzey avlusu ve doğudaki yol (tepeden ve kuzeydoğudan fotoğraf)
  kutu(XD - XB + 1, 0.04, 8.2, m.tasDoseme, 0, 0.02, ZSC - 4.1)
  kutu(1.5, 0.04, ZG_B - ZSC + 1, m.tasDoseme, XD + 0.75, 0.02, (ZG_B + ZSC) / 2)
  // Bina sekisi
  kutu(XD - XB, DOSEME, ZK - ZSC + 0.25, m.tasDoseme, 0, DOSEME / 2, (ZK + ZSC) / 2)
  kutu(A.x1 - XB + 0.5, DOSEME, ZG_A - ZK, m.krem, (XB + A.x1 + 0.5) / 2, DOSEME / 2, (ZK + ZG_A) / 2)
  kutu(XD - A.x1 - 0.5, DOSEME, ZG_B - ZK, m.krem, (XD + A.x1 + 0.5) / 2, DOSEME / 2, (ZK + ZG_B) / 2)
  zeminler.push(
    { x0: XB, x1: XD, z0: ZSC, z1: A.z0, h0: DOSEME, h1: DOSEME },
    { x0: A.x0, x1: A.x1 + 0.5, z0: A.z0, z1: A.z1, h0: DOSEME, h1: DOSEME },
    { x0: A.x1, x1: B.x1, z0: B.z0, z1: B.z1, h0: DOSEME, h1: DOSEME },
  )
  // Halı: kırmızı saf çizgileri kıbleye paralel
  kutu(A.x1 - A.x0, 0.02, A.z1 - A.z0, m.hali, AX, DOSEME + 0.01, AZ)
  kutu(B.x1 - B.x0, 0.02, B.z1 - B.z0, m.hali, BX, DOSEME + 0.01, BZ)
  kutu(DUVAR, 0.02, GECIT.z1 - GECIT.z0, m.tasDoseme, (A.x1 + B.x0) / 2, DOSEME + 0.01, BZ)
  // Süpürgelik (ahşap)
  for (const [g, x, z] of [[A.x1 - A.x0, AX, A.z0 + 0.02], [A.x1 - A.x0, AX, A.z1 - 0.02], [B.x1 - B.x0, BX, B.z0 + 0.02], [B.x1 - B.x0, BX, B.z1 - 0.02]] as const)
    kutu(g, 0.16, 0.04, m.ahsap, x, DOSEME + 0.08, z)

  // --- Duvarlar: dış örgü + iç sıva; açıklıklar duvardan gerçekten geçer ---
  type Aciklik = { tip: 'ust' | 'alt' | 'kapi' | 'gecit' | 'kucukKapi'; u: number }
  const USTY = { y0: 3.75, g: 0.82, d: 0.95, k: 0.62 }, ALTY = { y0: 0.95, g: 1.05, h: 1.45 }
  const KAPI = { g: 1.5, h: 2.5, k: 0.42 }, KKAPI = { g: 1.15, h: 2.25, k: 0.38 }

  const cephe = (L: number, x: number, z: number, ry: number, t: number, acik: Aciklik[], disMal: Mal, icMal: Mal, disHalka = true) => {
    const yerel = (g: THREE.BufferGeometry, mal: Mal, kv = k) => kv.ekle(yer(g, x, 0, z, ry), mal)
    const delikler = (s: THREE.Shape) => {
      for (const a of acik) {
        if (a.tip === 'ust') s.holes.push(kemer(new THREE.Path(), a.u, USTY.y0, USTY.g, USTY.d, USTY.k))
        if (a.tip === 'alt') s.holes.push(dik(a.u - ALTY.g / 2, ALTY.y0, a.u + ALTY.g / 2, ALTY.y0 + ALTY.h))
        if (a.tip === 'kapi') s.holes.push(kemer(new THREE.Path(), a.u, 0.02, KAPI.g, KAPI.h, KAPI.k))
        if (a.tip === 'kucukKapi') s.holes.push(kemer(new THREE.Path(), a.u, 0.02, KKAPI.g, KKAPI.h, KKAPI.k))
        if (a.tip === 'gecit') s.holes.push(kemer(new THREE.Path(), a.u, 0.02, GECIT.z1 - GECIT.z0, 2.6, 0.9))
      }
      return s
    }
    yerel(cikar(delikler(dikdortgen(-L / 2, 0, L / 2, H)), t - 0.04, -t + 0.04), disMal)
    yerel(cikar(delikler(dikdortgen(-L / 2, 0, L / 2, KORNIS + 0.02)), 0.04, -t), icMal)
    for (const a of acik) {
      if (a.tip === 'ust') {
        // İçeride sıvalı pencere boşluğu, ortada alçı revzen, içte vitray
        const halka = kemer(new THREE.Shape(), a.u, USTY.y0 - 0.04, USTY.g + 0.08, USTY.d, USTY.k + 0.06)
        halka.holes.push(kemer(new THREE.Path(), a.u, USTY.y0, USTY.g - 0.06, USTY.d, USTY.k))
        yerel(cikar(halka, 0.14, -t - 0.01), icMal)
        const cam = () => uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), a.u, USTY.y0, USTY.g, USTY.d, USTY.k), 8))
        yerel(cam().translate(0, 0, -0.14), m.revzen)
        yerel(cam().rotateY(Math.PI).translate(2 * a.u, 0, -t + 0.12), m.vitray)
        if (disHalka) {
          const dh = kemer(new THREE.Shape(), a.u, USTY.y0 - 0.1, USTY.g + 0.34, USTY.d + 0.1, USTY.k + 0.2)
          dh.holes.push(kemer(new THREE.Path(), a.u, USTY.y0 - 0.1, USTY.g, USTY.d + 0.1, USTY.k))
          yerel(cikar(dh, 0.05, 0), m.tugla)
          yerel(kutuG(USTY.g + 0.3, 0.08, 0.1).translate(a.u, USTY.y0 - 0.06, -0.03), m.mermer)
        }
      }
      if (a.tip === 'alt') {
        const { g, h, y0 } = ALTY
        // Ahşap kasa, iç aydınlık, dış parmaklık
        for (const s of [-1, 1]) yerel(kutuG(0.09, h, t - 0.12).translate(a.u + s * (g / 2 - 0.045), y0 + h / 2, -t / 2 - 0.08), m.ahsap)
        for (const yy of [y0 + 0.045, y0 + h - 0.045]) yerel(kutuG(g, 0.09, t - 0.12).translate(a.u, yy, -t / 2 - 0.08), m.ahsap)
        yerel(new THREE.PlaneGeometry(g, h).translate(a.u, y0 + h / 2, -0.08), m.parmaklik)
        yerel(new THREE.PlaneGeometry(g, h).rotateY(Math.PI).translate(a.u, y0 + h / 2, -t + 0.2), m.gunIsigi)
        // İçten pencere kanatları
        for (const s of [-1, 1]) yerel(kutuG(0.05, h - 0.12, g * 0.42).rotateY(0).translate(a.u + s * (g / 2 + 0.02), y0 + h / 2, -t - 0.2), m.ahsap)
        if (disHalka) {
          // Dışta krem lento ve üstünde tuğla boşaltma kemeri (fotoğrafa göre)
          yerel(kutuG(g + 0.26, 0.2, 0.08).translate(a.u, y0 + h + 0.1, -0.02), m.krem)
          for (const s of [-1, 1]) yerel(kutuG(0.13, h, 0.08).translate(a.u + s * (g / 2 + 0.065), y0 + h / 2, -0.02), m.krem)
          yerel(kutuG(g + 0.26, 0.1, 0.1).translate(a.u, y0 - 0.05, -0.01), m.krem)
          const b = kemer(new THREE.Shape(), a.u, y0 + h + 0.2, g + 0.6, 0.02, 0.62)
          b.holes.push(kemer(new THREE.Path(), a.u, y0 + h + 0.2, g + 0.24, 0.02, 0.44))
          yerel(cikar(b, 0.05, 0), m.tugla)
          const dolgu = new THREE.ShapeGeometry(kemer(new THREE.Shape(), a.u, y0 + h + 0.2, g + 0.24, 0.02, 0.44), 8)
          yerel(dolgu.translate(0, 0, 0.02), m.krem)
        }
      }
    }
  }

  // Kuzey duvarı: son cemaat yerine bakar, iki yüzü de sıvalı (fotoğraf). ry=π olduğu için u = -x.
  cephe(XD - XB - 0.1, 0, ZK, Math.PI, DUVAR, [
    { tip: 'kapi', u: -AX },
    { tip: 'alt', u: -(AX - 2.6) }, { tip: 'alt', u: -(AX + 2.6) },
    { tip: 'ust', u: -(AX - 2.6) }, { tip: 'ust', u: -(AX + 2.6) },
    { tip: 'kucukKapi', u: -BX },
    { tip: 'alt', u: -(BX + 2) }, { tip: 'alt', u: -(BX - 2) },
  ], m.sivaDis, m.siva, false)
  // Batı duvarı: iki üst, iki alt pencere (içeriden fotoğraf). ry=-π/2 için u = z - merkez.
  const ZO_A = (ZK + ZG_A) / 2
  cephe(ZG_A - ZK, XB, ZO_A, -Math.PI / 2, DUVAR, [
    { tip: 'ust', u: AZ - 2.05 - ZO_A }, { tip: 'ust', u: AZ + 2.05 - ZO_A },
    { tip: 'alt', u: AZ - 2.05 - ZO_A }, { tip: 'alt', u: AZ + 2.05 - ZO_A },
  ], m.almasik, m.siva)
  // Ana mekân güney duvarı: mihrabın iki yanında alt ve üst pencere
  const XO_A = (XB + B.x0) / 2
  cephe(B.x0 - XB, XO_A, ZG_A, 0, DUVAR, [
    { tip: 'ust', u: AX - XO_A - 2.45 }, { tip: 'ust', u: AX - XO_A + 2.45 }, { tip: 'alt', u: AX - XO_A - 2.45 }, { tip: 'alt', u: AX - XO_A + 2.45 },
  ], m.almasik, m.siva)
  // Küçük mekân güney ve doğu duvarları
  const XO_B = (XD + B.x0) / 2
  cephe(XD - B.x0, XO_B, ZG_B, 0, DUVAR, [
    { tip: 'ust', u: BX - XO_B - 1.6 }, { tip: 'ust', u: BX - XO_B + 1.6 }, { tip: 'alt', u: BX - XO_B + 1.6 },
  ], m.almasik, m.siva)
  const ZO_B = (ZK + ZG_B) / 2
  cephe(ZG_B - ZK, XD, ZO_B, Math.PI / 2, DUVAR, [
    { tip: 'ust', u: -(BZ - 1.6 - ZO_B) }, { tip: 'ust', u: -(BZ + 1.6 - ZO_B) }, { tip: 'alt', u: -(BZ - 1.6 - ZO_B) },
  ], m.almasik, m.siva)
  // İki mekân arasındaki duvar ve 2,20 m'lik geçit. Dış yüzü x = B.x0.
  const ZO_ORTA = (ZK + ZG_B) / 2
  cephe(ZG_B - ZK, B.x0, ZO_ORTA, Math.PI / 2, DUVAR, [{ tip: 'gecit', u: -(BZ - ZO_ORTA) }], m.siva, m.siva, false)
  // Üst pencereler bu duvarda da olmalı: fotoğrafta görünmüyor, boş bırakıldı.
  // Ortak duvarın güneye taşan parçası: küçük mekânın arkasında dışarıda kalır
  const tasan = dikdortgen(-(ZG_A - ZG_B) / 2, 0, (ZG_A - ZG_B) / 2, H)
  k.ekle(yer(cikar(tasan, DUVAR - 0.04, -DUVAR + 0.04), B.x0, 0, (ZG_A + ZG_B) / 2, Math.PI / 2), m.almasik)
  kutu(0.04, KORNIS, ZG_A - ZG_B, m.siva, A.x1 + 0.02, KORNIS / 2, (ZG_A + ZG_B) / 2)

  // Çarpışma: dış duvarlar
  engel(XB, A.x0, ZK, ZG_A, true)
  engel(A.x0, A.x1 + DUVAR, A.z1, ZG_A, true)
  engel(B.x0, XD, B.z1, ZG_B, true)
  engel(B.x1, XD, ZK, ZG_B, true)
  engel(XB, AX - KAPI.g / 2, ZK, A.z0, true)
  engel(AX + KAPI.g / 2, BX - KKAPI.g / 2, ZK, A.z0, true)
  engel(BX + KKAPI.g / 2, XD, ZK, A.z0, true)
  engel(A.x1, B.x0, A.z0, GECIT.z0, true)
  engel(A.x1, B.x0, GECIT.z1, A.z1 + DUVAR, true)

  // Kapılar: kırmızı-kahve kanat açık, üstte küçük kubbecik (Yıldırım Belediyesi metni) ve yaprak süsü yerine sade kavsara
  const kapiKanat = (cx: number, g: number, h: number) => {
    for (const s of [-1, 1]) {
      kutu(0.07, h, g / 2, m.ahsapKoyu, cx + s * (g / 2 + 0.04), DOSEME + h / 2 - 0.2, A.z0 + g / 4)
    }
  }
  kapiKanat(AX, KAPI.g, KAPI.h)
  kapiKanat(BX, KKAPI.g, KKAPI.h)
  const kavsara = dondurG([[0.5, 0], [0.46, 0.08], [0.28, 0.26], [0.001, 0.36]], 14, [2, 1])
  k.ekle(yer(kavsara.scale(1, 1, 0.35), AX, KAPI.h + KAPI.k + 0.34, ZK - 0.02), m.mukarnas)
  // Kapıyı çevreleyen mermer söve (son cemaat yerinden)
  for (const [cx, g, hh, kk] of [[AX, KAPI.g, KAPI.h, KAPI.k], [BX, KKAPI.g, KKAPI.h, KKAPI.k]] as const) {
    const s = kemer(new THREE.Shape(), -cx, 0.02, g + 0.36, hh + 0.05, kk + 0.1)
    s.holes.push(kemer(new THREE.Path(), -cx, 0.02, g, hh, kk))
    k.ekle(yer(cikar(s, 0.08, -0.02), 0, 0, ZK, Math.PI), m.mermer)
  }

  // --- Taş vakfiyeler: son cemaat yerinin iki yan duvarında, yerden yüksekte ve çevreleri sıvalı (envanter). 2,15 × 1,35 m ---
  const levha = (x: number, ry: number, mal: Mal) => {
    const G = 2.15, Y = 1.35, cy = 4.55, zc = (ZSC + ZK) / 2
    const g = new THREE.PlaneGeometry(G, Y)
    k.ekle(yer(g.translate(0, cy, 0.04), x, 0, zc, ry), mal)
    k.ekle(yer(kutuG(G + 0.3, Y + 0.3, 0.05).translate(0, cy, 0), x, 0, zc, ry), m.mukarnas)
  }

  // --- Son cemaat yeri ---
  const ZSC_I = ZSC + 0.55
  const YAY = 3.72, TEPE = 5.72
  // Yan duvarlar
  cephe(ZK - ZSC, XD - 0.0, (ZSC + ZK) / 2, Math.PI / 2, UC_DUVAR, [], m.almasik, m.sivaDis)
  cephe(ZK - ZSC, XB + 0.0, (ZSC + ZK) / 2, -Math.PI / 2, UC_DUVAR, [], m.almasik, m.sivaDis)
  levha(XD - UC_DUVAR - 0.01, -Math.PI / 2, m.vakfiye1)
  levha(XB + UC_DUVAR + 0.01, Math.PI / 2, m.vakfiye2)
  engel(XB, XB + UC_DUVAR, ZSC, ZK, true)
  engel(XD - UC_DUVAR, XD, ZSC, ZK, true)
  // Minareye çıkılan kapı (son cemaat yerinin batı duvarında)
  kutu(0.06, 2.2, 0.95, m.ahsapKoyu, XB + UC_DUVAR + 0.03, DOSEME + 1.1, ZK - 1.2)

  // Ön duvar: beş kemer. u = -x. Altı açık, sütun üzerine oturur.
  const ON_L = XD - XB
  const on = new THREE.Shape()
  on.moveTo(-ON_L / 2, 0); on.lineTo(-ON_L / 2 + UC_DUVAR, 0); on.lineTo(-ON_L / 2 + UC_DUVAR, YAY)
  for (let i = 0; i < 5; i++) {
    const a = -ON_L / 2 + UC_DUVAR + GOZ * i, b = a + GOZ, o = (a + b) / 2
    on.quadraticCurveTo(a + 0.02, YAY + (TEPE - YAY) * 0.72, o, TEPE)
    on.quadraticCurveTo(b - 0.02, YAY + (TEPE - YAY) * 0.72, b, YAY)
  }
  on.lineTo(ON_L / 2 - UC_DUVAR, 0); on.lineTo(ON_L / 2, 0); on.lineTo(ON_L / 2, H); on.lineTo(-ON_L / 2, H); on.closePath()
  k.ekle(yer(cikar(on, 0.55, -0.55), 0, 0, ZSC, Math.PI), m.almasikAcik)
  // Kemer halkası: krem taş ve tuğla
  for (let i = 0; i < 5; i++) {
    const a = -ON_L / 2 + UC_DUVAR + GOZ * i, b = a + GOZ, o = (a + b) / 2
    const halka = new THREE.Shape()
    halka.moveTo(a, YAY)
    halka.quadraticCurveTo(a + 0.02, YAY + (TEPE - YAY) * 0.72, o, TEPE)
    halka.quadraticCurveTo(b - 0.02, YAY + (TEPE - YAY) * 0.72, b, YAY)
    halka.lineTo(b + 0.14, YAY)
    halka.quadraticCurveTo(b + 0.1, YAY + (TEPE + 0.5 - YAY) * 0.78, o, TEPE + 0.5)
    halka.quadraticCurveTo(a - 0.1, YAY + (TEPE + 0.5 - YAY) * 0.78, a - 0.14, YAY)
    halka.closePath()
    k.ekle(yer(cikar(halka, 0.05, 0), 0, 0, ZSC, Math.PI), i % 2 ? m.krem : m.krem)
    const ic = new THREE.Shape()
    ic.moveTo(a + 0.02, YAY)
    ic.quadraticCurveTo(a + 0.04, YAY + (TEPE - YAY) * 0.72, o, TEPE - 0.02)
    ic.quadraticCurveTo(b - 0.04, YAY + (TEPE - YAY) * 0.72, b - 0.02, YAY)
    ic.lineTo(a + 0.02, YAY); ic.closePath()
    // Kemer karnı: dış örgünün iç yüzü görünür; ince ahşap gergi fotoğraftaki gibi
    kutu(GOZ - 0.1, 0.14, 0.14, m.ahsapKoyu, (b + a) / -2, YAY + 0.02, ZSC + 0.27)
  }
  // Tavan ve iç bölme kemerleri
  k.ekle(new THREE.PlaneGeometry(ON_L - 2 * UC_DUVAR, ZK - ZSC_I).rotateX(Math.PI / 2).translate(0, 6.9, (ZK + ZSC_I) / 2), m.siva)
  for (let i = 1; i < 5; i++) {
    const x = XB + UC_DUVAR + GOZ * i
    const s = dikdortgen(-(ZK - ZSC_I) / 2, YAY, (ZK - ZSC_I) / 2, 6.9)
    const ac = (ZK - ZSC_I) / 2
    s.holes.push(kemer(new THREE.Path(), 0, YAY, ac * 2 - 0.5, 0.05, 2.5))
    k.ekle(yer(cikar(s, 0.3, -0.15), x, 0, (ZK + ZSC_I) / 2, Math.PI / 2), m.siva)
    kutu(0.12, 0.14, ZK - ZSC_I, m.ahsapKoyu, x, YAY + 0.02, (ZK + ZSC_I) / 2)
  }
  // Destekler: fotoğrafa göre doğudan batıya sütun, örme paye, sütun, sütun. Korint başlıklı mermer.
  const SUTUN_Z = ZSC + 0.27
  const sutun = (x: number) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, SUTUN_Z), mal)
    ek(kutuG(0.56, 0.22, 0.56).translate(0, DOSEME + 0.11, 0), m.mermer)
    ek(dondurG([[0.27, DOSEME + 0.22], [0.2, DOSEME + 0.34], [0.18, 3.0], [0.21, 3.06]], 16), m.mermer)
    // Korint başlık: alta doğru daralan çan, iki sıra yaprak, üstte kare yastık
    ek(dondurG([[0.2, 3.06], [0.26, 3.3], [0.36, 3.56]], 16), m.mermer)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      for (const [ry, y, rr] of [[0.21, 3.2, 0], [0.28, 3.42, 0.39]] as const) {
        const yaprak = new THREE.SphereGeometry(0.09, 5, 4).scale(0.9, 1.3, 0.45).translate(0, y, ry + 0.05)
        ek(yaprak.rotateY(a + rr), m.mermer)
      }
    }
    ek(kutuG(0.78, 0.15, 0.78).translate(0, YAY - 0.09, 0), m.mermer)
    daireler.push({ x, z: SUTUN_Z, r: 0.26 })
  }
  const destek = (i: number) => XB + UC_DUVAR + GOZ * i
  sutun(destek(1)); sutun(destek(2)); sutun(destek(4))
  kutu(0.8, YAY - DOSEME, 0.72, m.almasikAcik, destek(3), (YAY + DOSEME) / 2, SUTUN_Z)
  kutu(0.9, 0.14, 0.84, m.mermer, destek(3), YAY - 0.04, SUTUN_Z)
  engel(destek(3) - 0.4, destek(3) + 0.4, SUTUN_Z - 0.36, SUTUN_Z + 0.36)
  engel(XB, XB + UC_DUVAR, ZSC, ZSC + 0.55)

  // --- Saçak silmesi: testere dişi tuğla ---
  const kirpi = (x0: number, z0: number, x1: number, z1: number, y: number, kv: { ekle(g: THREE.BufferGeometry, mal: Mal): void }, disX: number, disZ: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.floor(L / 0.24))
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const d = new THREE.BoxGeometry(0.14, 0.09, 0.14).rotateY(Math.PI / 4)
      kv.ekle(d.translate(x0 + (x1 - x0) * t + disX, y, z0 + (z1 - z0) * t + disZ), m.tugla)
    }
  }
  const saçak = (x0: number, x1: number, z0: number, z1: number, y: number, kv: Kova) => {
    const b = 0.05
    const halka = (ek: number, yy: number, ic = 0.5) => {
      const g = x1 - x0 + ek, dd = z1 - z0 + ek, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
      kv.ekle(yer(kutuG(g, 0.09, ic), cx, yy, z0 - ek / 2 + ic / 2), m.tugla)
      kv.ekle(yer(kutuG(g, 0.09, ic), cx, yy, z1 + ek / 2 - ic / 2), m.tugla)
      kv.ekle(yer(kutuG(ic, 0.09, dd), x0 - ek / 2 + ic / 2, yy, cz), m.tugla)
      kv.ekle(yer(kutuG(ic, 0.09, dd), x1 + ek / 2 - ic / 2, yy, cz), m.tugla)
    }
    halka(0.1, y)
    kirpi(x0, z0 - b, x1, z0 - b, y + 0.1, kv, 0, 0); kirpi(x0, z1 + b, x1, z1 + b, y + 0.1, kv, 0, 0)
    kirpi(x0 - b, z0, x0 - b, z1, y + 0.1, kv, 0, 0); kirpi(x1 + b, z0, x1 + b, z1, y + 0.1, kv, 0, 0)
    halka(0.34, y + 0.2)
  }

  // --- Çatı: kiremitli son cemaat yeri ve mekânların kare omuzları ---
  saçak(XB, XD, ZSC, ZK, H + 0.04, kCati)
  saçak(XB, A.x1 + DUVAR, ZK, ZG_A, H + 0.04, kCati)
  saçak(A.x1 + 0.1, XD, ZK, ZG_B, H + 0.04, kCati)
  const CATI_Y = H + 0.3
  // Son cemaat yeri: taban eğimi, üstünde her göz için piramit; kapının karşısındaki göz küçük kubbeli
  kCati.ekle(dortEgim(XB - 0.35, XD + 0.35, ZSC - 0.35, ZK + 0.4, CATI_Y, CATI_Y + 0.55, 0.9, 0.9), m.kiremit)
  kCati.ekle(new THREE.PlaneGeometry(XD - XB - 1, ZK - ZSC - 1).rotateX(-Math.PI / 2).translate(0, CATI_Y + 0.55, (ZSC + ZK) / 2), m.kiremit)
  const SC_ORTA = (ZSC + ZK) / 2
  for (let i = 0; i < 5; i++) {
    const cx = GOZ_MERKEZ(i)
    if (i === 1) {
      kCati.ekle(yer(duzGolge(silindirG(1.45, 1.5, 0.55, 8, true).rotateY(Math.PI / 8)), cx, CATI_Y + 0.8, SC_ORTA), m.almasikAcik)
      kCati.ekle(yer(duzGolge(silindirG(1.25, 1.7, 0.16, 8, true).rotateY(Math.PI / 8)), cx, CATI_Y + 1.12, SC_ORTA), m.kiremit)
      kKubbe.ekle(yer(kiremitKubbe(1.28, 0.95, 5, 24), cx, CATI_Y + 1.2, SC_ORTA), m.kiremit)
    } else {
      const g = GOZ / 2 - 0.12, d = (ZK - ZSC) / 2 - 0.42
      kCati.ekle(dortEgim(cx - g, cx + g, SC_ORTA - d, SC_ORTA + d, CATI_Y + 0.5, CATI_Y + 1.55, g, d), m.kiremit)
    }
  }

  // --- Mekân örtüsü: kare omuz → sekizgen kasnak → saçak → kiremit kubbe; içte üçgen kuşağı, on altıgen kasnak, kubbe ---
  const OCT = Math.cos(Math.PI / 8)
  const ortu = (o: {
    cx: number; cz: number; xa: number; za: number; icX: number; icZ: number
    kasnak: number; kasnakUst: number; saçakR: number; kubbeR: number; kubbeH: number; icR: number; icKusak: number; icKasnak: number; icKubbeH: number
  }) => {
    // Kare omuz: dört yana eğimli, ortası kasnak için boş
    kCati.ekle(dortEgim(o.cx - o.xa - 0.3, o.cx + o.xa + 0.3, o.cz - o.za - 0.3, o.cz + o.za + 0.3, CATI_Y, CATI_Y + 0.9, 0.5, 0.5), m.kiremit)
    const kapak = dikdortgen(o.cx - o.xa + 0.2, -o.cz - o.za + 0.2, o.cx + o.xa - 0.2, -o.cz + o.za - 0.2)
    kapak.holes.push(new THREE.Path().absarc(o.cx, -o.cz, o.icR + 0.55, 0, Math.PI * 2, true))
    kCati.ekle(new THREE.ShapeGeometry(kapak, 20).rotateX(-Math.PI / 2).translate(0, CATI_Y + 0.9, 0), m.kiremit)

    // Dış kasnak: sekizgen, açık taşlı almaşık, tuğla silme, dört yönde küçük pencere
    const H0 = o.kasnak, H1 = o.kasnakUst, RK = o.saçakR - 0.42
    const dk = duzGolge(silindirG(RK / OCT, RK / OCT, H1 - H0, 8, true).rotateY(Math.PI / 8))
    kKasnak.ekle(yer(dk, o.cx, (H0 + H1) / 2, o.cz), m.almasikAcik)
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4, gen = 2 * RK * Math.tan(Math.PI / 8)
      kKasnak.ekle(yer(kutuG(gen + 0.14, 0.1, 0.14).translate(0, H1 - 0.12, RK + 0.03), o.cx, 0, o.cz, a), m.tugla)
      kirpi(-gen / 2, 0, gen / 2, 0, H1 - 0.02, { ekle: (g, mm) => kKasnak.ekle(yer(g.translate(0, 0, RK + 0.09), o.cx, 0, o.cz, a), mm) }, 0, 0)
      kKasnak.ekle(yer(kutuG(gen + 0.26, 0.1, 0.26).translate(0, H1 + 0.09, RK + 0.06), o.cx, 0, o.cz, a), m.tugla)
      if (n % 2 === 0) {
        const y0 = H0 + 0.5
        kKasnak.ekle(yer(uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, 0.46, 0.35, 0.28), 6)).translate(0, 0, RK + 0.015), o.cx, 0, o.cz, a), m.revzen)
        const h = kemer(new THREE.Shape(), 0, y0 - 0.04, 0.68, 0.38, 0.4)
        h.holes.push(kemer(new THREE.Path(), 0, y0 - 0.04, 0.46, 0.38, 0.3))
        kKasnak.ekle(yer(cikar(h, 0.05, RK).translate(0, 0, 0), o.cx, 0, o.cz, a), m.tugla)
      }
    }

    // Sekizgen saçak ve kubbe
    const sac = duzGolge(silindirG(o.kubbeR + 0.02, o.saçakR / OCT, 0.34, 8, true).rotateY(Math.PI / 8))
    const uvs = sac.attributes.uv
    for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * 0.7, uvs.getY(i) * 3)
    kKubbe.ekle(yer(sac, o.cx, H1 + 0.32, o.cz), m.kiremit)
    kKubbe.ekle(yer(kiremitKubbe(o.kubbeR, o.kubbeH, 10, 56), o.cx, H1 + 0.48, o.cz), m.kiremit)
    const alem: [number, number][] = [[0.08, 0], [0.05, 0.12], [0.1, 0.2], [0.03, 0.34], [0.07, 0.42], [0.001, 0.62]]
    kKubbe.ekle(yer(dondurG(alem, 8), o.cx, H1 + 0.48 + o.kubbeH, o.cz), m.bronz)

    // İç: silme, üçgen kuşağı, on altıgen kasnak ve sade beyaz kubbe (içeriden fotoğraf yalnız beyaz yüzey gösteriyor)
    for (const [gx, gz, x, z] of [[o.icX * 2, 0.12, o.cx, o.cz - o.icZ + 0.05], [o.icX * 2, 0.12, o.cx, o.cz + o.icZ - 0.05], [0.12, o.icZ * 2, o.cx - o.icX + 0.05, o.cz], [0.12, o.icZ * 2, o.cx + o.icX - 0.05, o.cz]] as const)
      kutu(gx, 0.14, gz, m.siva, x, KORNIS, z, kCati)
    kKasnak.ekle(ucgenKusagi(o.cx, o.cz, o.icX, o.icZ, KORNIS + 0.05, o.icKusak, o.icR), m.mukarnas)
    const ik = duzGolge(silindirG(o.icR, o.icR, o.icKasnak - o.icKusak, 16, true).rotateY(Math.PI / 16))
    kKasnak.ekle(yer(ik, o.cx, (o.icKusak + o.icKasnak) / 2, o.cz), m.siva)
    for (let n = 0; n < 4; n++) {
      const a = n * Math.PI / 2, yuz = o.icR * Math.cos(Math.PI / 16) - 0.02, y0 = o.icKusak + 0.14
      kKasnak.ekle(yer(uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, 0.46, 0.3, 0.26), 6)).rotateY(Math.PI).translate(0, 0, yuz), o.cx, 0, o.cz, a), m.vitray)
    }
    const profil: [number, number][] = [[o.icR + 0.06, -0.03]]
    for (let t = 0; t <= 14; t++) {
      const a = (t / 14) * Math.PI / 2
      profil.push([Math.max(o.icR * Math.cos(a), 0.001), o.icKubbeH * Math.sin(a)])
    }
    kKubbe.ekle(yer(dondurG(profil, 48, [1, 1]), o.cx, o.icKasnak, o.cz), m.siva)
  }
  ortu({ cx: AX, cz: AZ, xa: (A.x1 - A.x0) / 2 + DUVAR, za: (A.z1 - A.z0) / 2 + DUVAR, icX: (A.x1 - A.x0) / 2, icZ: (A.z1 - A.z0) / 2, kasnak: 8.7, kasnakUst: 10.5, saçakR: 5.0, kubbeR: 4.4, kubbeH: 2.95, icR: 3.98, icKusak: 9.25, icKasnak: 10.5, icKubbeH: 2.85 })
  ortu({ cx: BX, cz: BZ, xa: (B.x1 - B.x0) / 2 + DUVAR, za: (B.z1 - B.z0) / 2 + DUVAR, icX: (B.x1 - B.x0) / 2, icZ: (B.z1 - B.z0) / 2, kasnak: 8.7, kasnakUst: 10.0, saçakR: 4.1, kubbeR: 3.55, kubbeH: 2.5, icR: 3.18, icKusak: 8.9, icKasnak: 10, icKubbeH: 2.4 })

  // --- Mihrap duvarı (fotoğrafa göre): krem kenarlı niş, bezeli bant, üstte ahşap taç ve levha, iki yanda kırmızı seki ---
  const ZM = A.z1
  const yuz = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(g, mal)
  const CERCEVE_G = 2.1, CERCEVE_Y = DOSEME + 4
  for (const s of [-1, 1]) {
    const band = uvSigdir(new THREE.PlaneGeometry(0.26, CERCEVE_Y - DOSEME)).rotateY(Math.PI)
    yuz(band.translate(AX + s * (CERCEVE_G / 2 - 0.13), DOSEME + (CERCEVE_Y - DOSEME) / 2, ZM - 0.015), m.mihrapBandi)
  }
  const ustBand = uvSigdir(new THREE.PlaneGeometry(CERCEVE_G, 0.24)).rotateY(Math.PI)
  yuz(ustBand.translate(AX, CERCEVE_Y - 0.12, ZM - 0.015), m.mihrapBandi)
  // Niş: öne çıkan beyaz gövde, kademeli alçı mukarnas, yeşil boyalı alt yarı
  const NIS_G = 1.05, NIS_Y = 3.3
  for (const s of [-1, 1]) kutu(0.2, NIS_Y - 0.02, 0.32, m.mukarnas, AX + s * (NIS_G / 2 + 0.1), DOSEME + NIS_Y / 2, ZM - 0.16)
  const boya = uvSigdir(new THREE.PlaneGeometry(NIS_G, 1.62)).rotateY(Math.PI)
  yuz(boya.translate(AX, DOSEME + 0.81, ZM - 0.02), m.mihrapBoya)
  const KADEME = 6
  for (let i = 0; i < KADEME; i++) {
    const t = i / KADEME, g = NIS_G * (1 - t * 0.78), y = DOSEME + 1.62 + i * 0.28, dr = 0.28 * (1 - t) + 0.04
    kutu(g, 0.26, dr, m.mukarnas, AX, y + 0.13, ZM - dr / 2)
    const n = Math.max(1, Math.floor(g / 0.26))
    for (let j = 0; j < n; j++) {
      const hc = new THREE.SphereGeometry((g / n) * 0.46, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5)
      k.ekle(hc.translate(AX - g / 2 + (j + 0.5) * (g / n), y + 0.02, ZM - dr), m.mukarnas)
    }
  }
  // Niş önü basamak ve iki yandaki kırmızı halılı mermer seki
  kutu(CERCEVE_G + 0.1, 0.1, 0.62, m.krem, AX, DOSEME + 0.05, ZM - 0.31)
  kutu(CERCEVE_G - 0.2, 0.03, 0.6, m.hali, AX, DOSEME + 0.115, ZM - 0.3)
  zeminler.push({ x0: AX - CERCEVE_G / 2, x1: AX + CERCEVE_G / 2, z0: ZM - 0.62, z1: ZM, h0: DOSEME + 0.1, h1: DOSEME + 0.1 })
  engel(AX - NIS_G / 2 - 0.2, AX + NIS_G / 2 + 0.2, ZM - 0.2, ZM)
  const SEKI_H = 0.24
  for (const [a, b] of [[AX - 2.75, AX - CERCEVE_G / 2], [AX + CERCEVE_G / 2, AX + 3.1]] as const) {
    kutu(b - a, SEKI_H, 0.85, m.sekiMermer, (a + b) / 2, DOSEME + SEKI_H / 2, ZM - 0.425)
    kutu(b - a - 0.02, 0.03, 0.83, m.kirmiziHali, (a + b) / 2, DOSEME + SEKI_H + 0.015, ZM - 0.425)
    zeminler.push({ x0: a, x1: b, z0: ZM - 0.85, z1: ZM, h0: DOSEME + SEKI_H, h1: DOSEME + SEKI_H })
  }
  // Mihrap üstü ahşap taç (alınlık) ve yazısız levha
  const tac = new THREE.Shape()
  tac.moveTo(-0.76, 0); tac.lineTo(0.76, 0); tac.lineTo(0.76, 0.3); tac.lineTo(0, 0.78); tac.lineTo(-0.76, 0.3); tac.closePath()
  k.ekle(yer(cikar(tac, 0.07, 0).rotateY(Math.PI), AX, CERCEVE_Y + 0.46, ZM - 0.01), m.ahsap)
  kutu(1.45, 0.42, 0.05, m.ahsapKoyu, AX, CERCEVE_Y + 0.24, ZM - 0.03)
  kutu(1.28, 0.3, 0.02, m.levha, AX, CERCEVE_Y + 0.24, ZM - 0.06)
  kutu(1.1, 0.5, 0.02, m.ahsapKoyu, AX, CERCEVE_Y + 0.78, ZM - 0.09)

  // Madalyonlar: yazısız, fotoğraftaki yerlerine
  const madalyon = (x: number, y: number, z: number, ry: number, R = 0.42) => {
    const g = new THREE.CircleGeometry(R, 24)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i))
    k.ekle(yer(g, x, y, z, ry), m.madalyon)
  }
  madalyon(AX - 1.3, DOSEME + 4.7, ZM - 0.025, Math.PI); madalyon(AX + 1.3, DOSEME + 4.7, ZM - 0.025, Math.PI)
  madalyon(A.x0 + 0.025, DOSEME + 5.05, AZ - 0.05, Math.PI / 2); madalyon(A.x0 + 0.025, DOSEME + 5.05, AZ + 4 - 0.05, Math.PI / 2)
  madalyon(A.x0 + 0.025, DOSEME + 5.05, AZ - 4 + 0.05, Math.PI / 2)
  madalyon(A.x1 - 0.025, DOSEME + 5.05, AZ - 2.05, -Math.PI / 2); madalyon(A.x1 - 0.025, DOSEME + 5.05, AZ + 2.05, -Math.PI / 2)

  // Şamdanlar: pirinç gövde, küresel başlık
  const samdan = (x: number, z: number) => {
    k.ekle(yer(dondurG([[0.18, 0], [0.08, 0.07], [0.04, 0.25], [0.12, 0.34], [0.04, 0.45], [0.09, 0.56], [0.03, 0.72], [0.1, 0.86], [0.03, 1.0], [0.06, 1.08]], 12), x, DOSEME + SEKI_H + 0.03, z), m.pirinc)
    k.ekle(new THREE.SphereGeometry(0.11, 12, 8).translate(x, DOSEME + SEKI_H + 1.23, z), m.mermer)
  }
  samdan(AX - 1.6, ZM - 0.42); samdan(AX + 1.6, ZM - 0.42)

  // Duvar lambaları
  const lamba = (x: number, y: number, z: number, dx: number, dz: number) => {
    k.ekle(new THREE.BoxGeometry(0.03 + Math.abs(dz) * 0.04, 0.05, 0.03 + Math.abs(dx) * 0.04).translate(x - dx * 0.1, y + 0.1, z - dz * 0.1), m.koyu)
    k.ekle(new THREE.SphereGeometry(0.05, 8, 6).translate(x, y, z), m.lamba)
  }
  lamba(AX - 1.45, 3.4, ZM - 0.16, 0, 1); lamba(AX + 1.45, 3.4, ZM - 0.16, 0, 1)
  lamba(A.x0 + 0.16, 3.4, AZ, -1, 0); lamba(A.x1 - 0.16, 3.4, AZ + 3, 1, 0)
  lamba(B.x1 - 0.16, 3.4, BZ, 1, 0); lamba(B.x0 + 0.16, 3.4, BZ - 2.2, -1, 0)

  // --- Minber: koyu ahşap, köşk kıble duvarında; merdiven kuzeyden güneye çıkar (fotoğraf) ---
  const mb = MINBER
  const yan = new THREE.Shape()
  yan.moveTo(0, DOSEME); yan.lineTo(mb.z0 + 3.9 - mb.z0, DOSEME); yan.lineTo(3.9, mb.tepe + 0.08); yan.lineTo(2.9, mb.tepe + 0.08)
  yan.lineTo(0.3, DOSEME + 0.08); yan.lineTo(0, DOSEME + 0.08); yan.closePath()
  for (const s of [-1, 1]) k.ekle(yer(cikar(yan, 0.06, -0.03).rotateY(-Math.PI / 2), mb.x + s * (mb.en / 2), 0, mb.z0), m.gecme)
  const ADIM = 9
  for (let i = 0; i < ADIM; i++) {
    const t = (i + 0.5) / ADIM, y = DOSEME + (mb.tepe - DOSEME) * t
    const zc = mb.rz0 + (mb.rz1 - mb.rz0) * t
    kutu(mb.en - 0.1, y - DOSEME, (mb.rz1 - mb.rz0) / ADIM + 0.01, m.kirmiziHali, mb.x, (y + DOSEME) / 2, zc)
  }
  // Korkuluk: eğimli kol ve sık baba
  const kolL = Math.hypot(mb.rz1 - mb.rz0, mb.tepe - DOSEME), egim = Math.atan2(mb.tepe - DOSEME, mb.rz1 - mb.rz0)
  for (const s of [-1, 1]) {
    const kol = new THREE.BoxGeometry(0.07, 0.07, kolL + 0.3).rotateX(-egim)
    k.ekle(kol.translate(mb.x + s * (mb.en / 2), (DOSEME + mb.tepe) / 2 + 0.92, (mb.rz0 + mb.rz1) / 2), m.ahsapKoyu)
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, y = DOSEME + (mb.tepe - DOSEME) * t, z = mb.rz0 + (mb.rz1 - mb.rz0) * t
      k.ekle(new THREE.BoxGeometry(0.03, 0.9, 0.03).translate(mb.x + s * (mb.en / 2), y + 0.45, z), m.ahsapKoyu)
    }
  }
  // Köşk: dört dikme, kemerli aralık, kademeli külah ve hilalli alem
  const KZ = (mb.rz1 + A.z1) / 2, KY = mb.tepe + 0.08
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) kutu(0.1, 1.5, 0.1, m.ahsapKoyu, mb.x + sx * (mb.en / 2 - 0.05), KY + 0.75, KZ + sz * 0.42)
  kutu(mb.en + 0.06, 0.22, 1, m.gecme, mb.x, KY + 1.56, KZ)
  kutu(mb.en + 0.2, 0.07, 1.14, m.ahsapKoyu, mb.x, KY + 1.7, KZ)
  k.ekle(yer(duzGolge(silindirG(0.08, 0.62, 0.72, 8).rotateY(Math.PI / 8)), mb.x, KY + 2.09, KZ), m.ahsapKoyu)
  k.ekle(yer(dondurG([[0.05, 0], [0.03, 0.2], [0.06, 0.3], [0.015, 0.5]], 8), mb.x, KY + 2.42, KZ), m.pirinc)
  k.ekle(new THREE.TorusGeometry(0.075, 0.015, 6, 14, Math.PI * 1.5).rotateZ(-Math.PI * 0.25).translate(mb.x, KY + 3, KZ), m.pirinc)
  // Kapı: söveler, tepelik, kırmızı perde tek yana toplu
  for (const s of [-1, 1]) kutu(0.1, 2.5, 0.2, m.ahsapKoyu, mb.x + s * (mb.en / 2 - 0.02), DOSEME + 1.25, mb.z0 + 0.1)
  kutu(mb.en + 0.1, 0.22, 0.22, m.ahsapKoyu, mb.x, DOSEME + 2.45, mb.z0 + 0.1)
  const tepelik = new THREE.Shape()
  tepelik.moveTo(-0.52, 0); tepelik.quadraticCurveTo(-0.3, 0.1, 0, 0.42); tepelik.quadraticCurveTo(0.3, 0.1, 0.52, 0); tepelik.closePath()
  k.ekle(yer(cikar(tepelik, 0.08, -0.04), mb.x, DOSEME + 2.56, mb.z0 + 0.1), m.ahsap)
  kutu(0.42, 2.3, 0.03, m.perde, mb.x - 0.27, DOSEME + 1.17, mb.z0 + 0.03)
  zeminler.push({ x0: mb.x - mb.en / 2 + 0.05, x1: mb.x + mb.en / 2 - 0.05, z0: mb.rz0, z1: mb.rz1, h0: DOSEME, h1: mb.tepe })
  engel(mb.x - mb.en / 2, mb.x + mb.en / 2, mb.rz1, A.z1)

  // Doğudaki ahşap kürsü (fotoğraf)
  const KRX = AX + 3.55
  kutu(0.82, 0.7, 0.7, m.ahsapKoyu, KRX, DOSEME + 0.5, ZM - 0.4)
  kutu(0.82, 0.08, 0.7, m.ahsap, KRX, DOSEME + 0.9, ZM - 0.4)
  for (const s of [-1, 1]) kutu(0.82, 0.4, 0.05, m.gecme, KRX, DOSEME + 1.15, ZM - 0.4 + s * 0.34)
  kutu(0.05, 0.4, 0.7, m.gecme, KRX - 0.39, DOSEME + 1.15, ZM - 0.4)
  engel(KRX - 0.42, KRX + 0.42, ZM - 0.78, ZM)

  // --- Mahfil: kuzey duvarında ahşap sekili kat, dört dikme, tornalı korkuluk ---
  const MH = MAHFIL.y
  kutu(A.x1 - A.x0, 0.2, MAHFIL.z1 - A.z0, m.ahsap, AX, MH - 0.1, (MAHFIL.z1 + A.z0) / 2)
  kutu(A.x1 - A.x0, 0.14, 0.14, m.ahsapKoyu, AX, MH - 0.26, MAHFIL.z1 - 0.1)
  for (const x of [A.x0 + 1.4, AX - 1.1, AX + 1.1, A.x1 - 1.05]) {
    kutu(0.2, MH - DOSEME - 0.2, 0.2, m.ahsap, x, (MH - 0.2 + DOSEME) / 2, MAHFIL.z1 - 0.1)
    engel(x - 0.1, x + 0.1, MAHFIL.z1 - 0.2, MAHFIL.z1, false, 2.8)
    // Dirsekler
    const d = new THREE.BoxGeometry(0.1, 0.1, 0.9).rotateX(0.65)
    k.ekle(d.translate(x, MH - 0.55, MAHFIL.z1 - 0.45), m.ahsap)
  }
  const korkulukX = (x0: number, x1: number) => {
    kutu(x1 - x0, 0.07, 0.12, m.ahsap, (x0 + x1) / 2, MH + 0.95, MAHFIL.z1 - 0.05)
    const n = Math.floor((x1 - x0) / 0.32)
    for (let i = 0; i <= n; i++) k.ekle(yer(dondurG([[0.03, 0], [0.05, 0.25], [0.025, 0.45], [0.05, 0.7], [0.03, 0.93]], 7), x0 + ((x1 - x0) * i) / n, MH, MAHFIL.z1 - 0.05), m.ahsapKoyu)
  }
  korkulukX(A.x0, MAHFIL.merd.x0 - 0.02); korkulukX(MAHFIL.merd.x1 + 0.02, A.x1)
  zeminler.push({ x0: A.x0, x1: A.x1, z0: A.z0, z1: MAHFIL.z1, h0: MH, h1: MH, altGecilir: true })
  // Mahfil merdiveni: yeri kaynakta yok, temsilî
  const md = MAHFIL.merd
  zeminler.push({ x0: md.x0, x1: md.x1, z0: MAHFIL.z1, z1: md.z1, h0: MH, h1: DOSEME })
  const BASAMAK = 14
  for (let i = 0; i < BASAMAK; i++) {
    const t = (i + 0.5) / BASAMAK, y = MH + (DOSEME - MH) * t, z = MAHFIL.z1 + (md.z1 - MAHFIL.z1) * t
    kutu(md.x1 - md.x0, 0.05, (md.z1 - MAHFIL.z1) / BASAMAK + 0.03, m.ahsap, (md.x0 + md.x1) / 2, y, z)
  }
  const mL = Math.hypot(md.z1 - MAHFIL.z1, MH - DOSEME), mE = Math.atan2(MH - DOSEME, md.z1 - MAHFIL.z1)
  for (const x of [md.x0, md.x1]) {
    k.ekle(new THREE.BoxGeometry(0.05, 0.2, mL).rotateX(mE).translate(x, (MH + DOSEME) / 2 - 0.05, (MAHFIL.z1 + md.z1) / 2), m.ahsapKoyu)
    k.ekle(new THREE.BoxGeometry(0.06, 0.06, mL).rotateX(mE).translate(x, (MH + DOSEME) / 2 + 0.85, (MAHFIL.z1 + md.z1) / 2), m.ahsap)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      k.ekle(new THREE.BoxGeometry(0.03, 0.9, 0.03).translate(x, MH + (DOSEME - MH) * t + 0.42, MAHFIL.z1 + (md.z1 - MAHFIL.z1) * t), m.ahsapKoyu)
    }
  }
  // Mahfil altında dolap ve alçak korkuluk (fotoğraf)
  kutu(1.2, 2.2, 0.5, m.ahsapKoyu, AX - 2.45, DOSEME + 1.1, A.z0 + 0.25)
  engel(AX - 3.05, AX - 1.85, A.z0, A.z0 + 0.5)

  // --- Minare: sekizgen kaide, sekiz niş, Türk üçgenleri, tuğla gövde, tuğla kirpi şerefe altı, mermer korkuluk, sivri kurşun külah ---
  const MN = MINARE
  const ekMin = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, MN.x, 0, MN.z), mal)
  const KAIDE_R = 1.75, KAIDE_Y = 9.6
  const oct8 = (rd: number, h: number, y: number) => duzGolge(silindirG(rd / OCT, rd / OCT, h, 8).rotateY(Math.PI / 8)).translate(0, y + h / 2, 0)
  ekMin(oct8(KAIDE_R, KAIDE_Y, 0), m.almasik)
  ekMin(oct8(KAIDE_R + 0.06, 0.16, KAIDE_Y - 0.1), m.tugla)
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4
    const s = kemer(new THREE.Shape(), 0, KAIDE_Y - 2.4, 0.86, 1.1, 0.5)
    k.ekle(yer(new THREE.ShapeGeometry(s, 6).translate(0, 0, KAIDE_R + 0.015).rotateY(a), MN.x, 0, MN.z), m.koyuTas)
    const h = kemer(new THREE.Shape(), 0, KAIDE_Y - 2.44, 1.08, 1.12, 0.62)
    h.holes.push(kemer(new THREE.Path(), 0, KAIDE_Y - 2.44, 0.86, 1.12, 0.5))
    k.ekle(yer(cikar(h, 0.04, KAIDE_R).rotateY(a), MN.x, 0, MN.z), m.tugla)
  }
  // Geçiş kuşağı
  const SR = 1.12, GECIS = 1.5, GY = KAIDE_Y + 0.06
  const gecis = silindirG(SR + 0.04, KAIDE_R / OCT, GECIS, 16, true).rotateY(Math.PI / 8)
  const guv = gecis.attributes.uv
  for (let i = 0; i < guv.count; i++) guv.setXY(i, (guv.getX(i) / (Math.PI * 2 * (KAIDE_R / OCT))) * 8, guv.getY(i) / GECIS)
  const gd = duzGolge(gecis)
  const gm = (m.turkUcgeni as THREE.MeshStandardMaterial).map
  if (gm) gm.wrapS = THREE.RepeatWrapping
  ekMin(gd.translate(0, GY + GECIS / 2, 0), m.turkUcgeni)
  ekMin(silindirG(SR + 0.12, SR + 0.12, 0.1, 28).translate(0, GY + GECIS + 0.03, 0), m.mermer)
  const GOVDE0 = GY + GECIS, GOVDE1 = GOVDE0 + 5.9
  ekMin(dondurG([[SR, GOVDE0], [SR - 0.05, GOVDE1]], 28), m.tugla)
  // Şerefe altı: yedi kat tuğla kirpi (envanter), yukarı açılır
  const KAT = 7
  for (let t = 0; t < KAT; t++) {
    const rr = SR - 0.03 + t * 0.075, y = GOVDE1 + t * 0.27
    ekMin(silindirG(rr + 0.07, rr, 0.27, 28).translate(0, y + 0.135, 0), m.tugla)
    for (let a = 0; a < 26; a++) {
      const te = ((a + (t % 2) * 0.5) * Math.PI * 2) / 26
      ekMin(new THREE.BoxGeometry(0.12, 0.09, 0.1).translate(0, y + 0.05, rr + 0.04).rotateY(te), m.tugla)
    }
  }
  const SY = GOVDE1 + KAT * 0.27
  const SERR = SR - 0.03 + KAT * 0.075 + 0.1
  ekMin(duzGolge(silindirG(SERR, SERR, 1.2, 16)).translate(0, SY + 0.6, 0), m.mermer)
  ekMin(silindirG(SERR + 0.03, SERR + 0.03, 0.06, 16).translate(0, SY + 1.2, 0), m.koyuTas)
  const PTK = 0.83, PY = SY + 1.2, PH = 3
  ekMin(dondurG([[PTK, PY], [PTK, PY + PH]], 24), m.tugla)
  // Petek üstü: dişli kuşak ve küçük açıklıklar
  for (let a = 0; a < 16; a++) {
    const te = (a * Math.PI * 2) / 16
    ekMin(new THREE.BoxGeometry(0.2, 0.3, 0.1).translate(0, PY + PH - 0.28, PTK).rotateY(te), a % 2 ? m.tugla : m.koyuTas)
  }
  ekMin(silindirG(PTK + 0.08, PTK + 0.08, 0.12, 24).translate(0, PY + PH + 0.06, 0), m.koyuTas)
  ekMin(dondurG([[0.86, 0], [0.87, 0.3], [0.72, 0.72], [0.42, 1.12], [0.14, 1.5], [0.03, 1.9], [0.001, 1.95]], 20).translate(0, PY + PH + 0.12, 0), m.kursunKapak)
  ekMin(dondurG([[0.04, 0], [0.02, 0.2], [0.05, 0.3], [0.01, 0.6], [0.001, 0.62]], 8).translate(0, PY + PH + 2, 0), m.bronz)
  daireler.push({ x: MN.x, z: MN.z, r: KAIDE_R + 0.08 })

  // --- Çeşme: batı duvarına gömülü, sivri kemerli, üstünde gerçek kitabe fotoğrafı (fotoğraf ve envanter) ---
  const CZ = AZ
  const cesme = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, XB, 0, CZ, -Math.PI / 2), mal)
  const cg = kemer(new THREE.Shape(), 0, 0.1, 2, 0.95, 1)
  cg.holes.push(kemer(new THREE.Path(), 0, 0.1, 1.2, 0.95, 0.7))
  cesme(cikar(cg, 0.07, 0), m.krem)
  cesme(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, 0.1, 1.2, 0.95, 0.7), 8).translate(0, 0, 0.02), m.mukarnas)
  cesme(kutuG(0.95, 0.09, 0.5).translate(0, 0.72, 0.22), m.mermer)
  cesme(dondurG([[0.42, 0], [0.35, 0.3], [0.1, 0.6]], 14).scale(1, -1, 0.65).translate(0, 0.7, 0.2), m.mermer)
  cesme(kutuG(0.55, 0.45, 0.16).translate(0, 0.25, 0.1), m.krem)
  cesme(new THREE.PlaneGeometry(1.1, 0.62).translate(0, 2.62, 0.09), m.cesmeKitabe)
  cesme(kutuG(1.26, 0.76, 0.05).translate(0, 2.62, 0.06), m.krem)

  // --- Türbe: 4,60 × 4,60 m, dört ayak üzerinde baldaken, tamamen tuğla, kirpi saçak, kiremit örtülü kubbe, ahşap gergi ---
  const T = TURBE, TY = 4.05, TA = T.y / 2
  const tk = (g: THREE.BufferGeometry, mal: Mal, kv = k) => kv.ekle(yer(g, T.x, 0, T.z), mal)
  tk(kutuG(T.y + 0.3, 0.3, T.y + 0.3).translate(0, 0.15, 0), m.tugla)
  tk(kutuG(T.y - 1, 0.04, T.y - 1).translate(0, 0.32, 0), m.mermer)
  const TKEMER = { g: 2.9, d: 1.55, k: 1.1, y0: 0.3 }
  for (let n = 0; n < 4; n++) {
    const s = dikdortgen(-TA, 0.3, TA, TY)
    s.holes.push(kemer(new THREE.Path(), 0, TKEMER.y0, TKEMER.g, TKEMER.d, TKEMER.k))
    const ry = (n * Math.PI) / 2
    k.ekle(yer(cikar(s, 0.72, TA - 0.72).rotateY(ry), T.x, 0, T.z), m.tugla)
    // İç sıva ve kemer karnı beyaz
    const ic = kemer(new THREE.Shape(), 0, TKEMER.y0, TKEMER.g + 0.02, TKEMER.d, TKEMER.k + 0.01)
    ic.holes.push(kemer(new THREE.Path(), 0, TKEMER.y0, TKEMER.g - 0.1, TKEMER.d, TKEMER.k - 0.05))
    k.ekle(yer(cikar(ic, 0.74, TA - 0.73).rotateY(ry), T.x, 0, T.z), m.sivaDis)
    const halka = kemer(new THREE.Shape(), 0, TKEMER.y0 + 1.1, TKEMER.g + 0.72, TKEMER.d - 1.05, TKEMER.k + 0.36)
    halka.holes.push(kemer(new THREE.Path(), 0, TKEMER.y0 + 1.1, TKEMER.g + 0.02, TKEMER.d - 1.05, TKEMER.k + 0.01))
    k.ekle(yer(cikar(halka, 0.04, TA).rotateY(ry), T.x, 0, T.z), m.tugla)
    // Ahşap gergi
    tk(kutuG(T.y - 1.2, 0.12, 0.12).translate(0, TKEMER.y0 + TKEMER.d - 0.1, TA - 0.36).rotateY(ry), m.ahsapKoyu)
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) engel(T.x + sx * (TA - 0.36) - 0.36, T.x + sx * (TA - 0.36) + 0.36, T.z + sz * (TA - 0.36) - 0.36, T.z + sz * (TA - 0.36) + 0.36)
  zeminler.push({ x0: T.x - TA - 0.15, x1: T.x + TA + 0.15, z0: T.z - TA - 0.15, z1: T.z + TA + 0.15, h0: 0.32, h1: 0.32 })
  saçak(T.x - TA, T.x + TA, T.z - TA, T.z + TA, TY + 0.04, kCati)
  // İç pandantif kubbe
  const tp: [number, number][] = [[1.62, 0]]
  for (let t = 1; t <= 10; t++) { const a = (t / 10) * Math.PI / 2; tp.push([Math.max(1.62 * Math.cos(a), 0.001), 1.5 * Math.sin(a)]) }
  kKubbe.ekle(yer(dondurG(tp, 28, [1, 1]), T.x, TY - 0.28, T.z), m.siva)
  kCati.ekle(yer(dortEgim(-TA - 0.25, TA + 0.25, -TA - 0.25, TA + 0.25, TY + 0.3, TY + 0.55, 0.25, 0.25), 0, 0, 0).translate(T.x, 0, T.z), m.kiremit)
  const tKapak = dikdortgen(-TA, -TA, TA, TA)
  tKapak.holes.push(new THREE.Path().absarc(0, 0, 1.68, 0, Math.PI * 2, true))
  k.ekle(new THREE.ShapeGeometry(tKapak, 16).rotateX(Math.PI / 2).translate(T.x, TY - 0.28, T.z), m.siva)
  kCati.ekle(new THREE.ShapeGeometry(dikdortgen(-TA, -TA, TA, TA), 1).rotateX(-Math.PI / 2).translate(T.x, TY + 0.55, T.z), m.kiremit)
  kKubbe.ekle(yer(kiremitKubbe(2.08, 1.45, 7, 36), T.x, TY + 0.55, T.z), m.kiremit)
  kKubbe.ekle(yer(dondurG([[0.06, 0], [0.03, 0.14], [0.06, 0.22], [0.001, 0.42]], 8), T.x, TY + 2, T.z), m.bronz)
  // Sanduka ve şahideler: yeşil gövde, altın renkli baş ve ayak taşı. Yazısız kabartma izlenimi.
  tk(kutuG(1, 0.42, 2).translate(0, 0.53, 0), m.yesil)
  tk(kutuG(1.2, 0.08, 2.2).translate(0, 0.36, 0), m.mermer)
  const sahide = (z: number, y: number) => {
    const s = kemer(new THREE.Shape(), 0, 0, 0.8, y - 0.35, 0.35)
    const on = uvSigdir(cikar(s, 0.1, 0))
    k.ekle(yer(on, T.x, 0.72, T.z + z - 0.05), m.sahide)
  }
  sahide(-0.85, 1.55); sahide(0.85, 1.25)
  engel(T.x - 0.6, T.x + 0.6, T.z - 1.1, T.z + 1.1)

  // --- Şadırvan (kuzey avlusu): sekiz ahşap direk, kemerli kuşak, kiremit külah; ortada mermer gövde (fotoğraf) ---
  const SD = SADIRVAN
  const ekSd = (g: THREE.BufferGeometry, mal: Mal, kv = k) => kv.ekle(yer(g, SD.x, 0, SD.z), mal)
  ekSd(duzGolge(silindirG(2.1, 2.1, 0.2, 8).rotateY(Math.PI / 8)).translate(0, 0.14, 0), m.mermer)
  ekSd(duzGolge(silindirG(0.75, 0.82, 1.15, 8).rotateY(Math.PI / 8)).translate(0, 0.8, 0), m.mermer)
  ekSd(new THREE.CylinderGeometry(0.62, 0.62, 0.02, 16).translate(0, 1.38, 0), m.su)
  ekSd(dondurG([[0.22, 0], [0.12, 0.12], [0.1, 0.3], [0.001, 0.36]], 10).translate(0, 1.38, 0), m.mermer)
  daireler.push({ x: SD.x, z: SD.z, r: 0.9 })
  const SR_D = 1.72
  for (let n = 0; n < 8; n++) {
    const a = Math.PI / 8 + n * Math.PI / 4
    const px = Math.sin(a) * SR_D, pz = Math.cos(a) * SR_D
    ekSd(kutuG(0.16, 2.6, 0.16).translate(px, 1.5, pz), m.ahsap)
    daireler.push({ x: SD.x + px, z: SD.z + pz, r: 0.1 })
    const yon = n * Math.PI / 4, gen = 2 * SR_D * Math.sin(Math.PI / 8)
    const ks = dikdortgen(-gen / 2, 2.1, gen / 2, 2.85)
    ks.holes.push(kemer(new THREE.Path(), 0, 2.1, gen - 0.12, 0.05, 0.56))
    ekSd(cikar(ks, 0.08, SR_D * OCT - 0.04).rotateY(yon), m.ahsap)
    // Taburecikler
    if (n % 2 === 0) ekSd(kutuG(0.32, 0.36, 0.32).translate(Math.sin(yon) * 1.28, 0.42, Math.cos(yon) * 1.28), m.ahsap)
  }
  ekSd(duzGolge(silindirG(SR_D + 0.1, SR_D + 0.1, 0.15, 8).rotateY(Math.PI / 8)).translate(0, 2.92, 0), m.ahsapKoyu)
  ekSd(duzGolge(silindirG(0.08, 2.42, 1.15, 8, true).rotateY(Math.PI / 8)).translate(0, 3.52, 0), m.kiremit, kKubbe)
  ekSd(dondurG([[0.08, 0], [0.04, 0.16], [0.07, 0.24], [0.001, 0.46]], 8).translate(0, 4.08, 0), m.bronz, kKubbe)

  // --- Hazire: yaklaşık seksen taş; güneyde ve kuzeyde, çerçeveli kabirler (fotoğraf). Yerleri temsilîdir. ---
  const mezarAlani = (x: number, z: number) => {
    if (Math.hypot(x, z) > 21.5) return false
    if (x > XB - 1.4 && x < XD + 1.8 && z > ZSC - 8.6 && z < ZG_A + 0.9) return false
    if (x > XB - 3.6 && x < XB - 0.5 && z > ZSC - 1 && z < ZK + 4) return false
    if (Math.abs(x - T.x) < 3.6 && Math.abs(z - T.z) < 4) return false
    if (x > T.x - 1.8 && x < T.x + 1.8 && z > ZG_A && z < T.z) return false
    return true
  }
  const baslik = (tip: number, x: number, z: number, y0: number) => {
    const taban = 0.18 + r() * 0.04
    if (tip === 0) {
      // Sivri tepeli düz şahide
      const s = new THREE.Shape()
      s.moveTo(-taban, 0); s.lineTo(taban, 0); s.lineTo(taban, 0.72); s.lineTo(0, 0.98); s.lineTo(-taban, 0.72); s.closePath()
      k.ekle(yer(cikar(s, 0.09, -0.045).rotateY(Math.PI / 2), x, y0, z), m.mermer)
    } else if (tip === 1) {
      // Silindir gövde ve kavuk
      k.ekle(yer(dondurG([[0.13, 0], [0.13, 0.78]], 8), x, y0, z), m.mermer)
      k.ekle(yer(new THREE.SphereGeometry(0.17, 8, 5).scale(1, 0.72, 1), x, y0 + 0.86, z), m.mermer)
    } else {
      // Kanatlı (fiyonk) şahide
      const s = new THREE.Shape()
      s.moveTo(-0.1, 0); s.lineTo(0.1, 0); s.lineTo(0.1, 0.5); s.lineTo(0.28, 0.82); s.lineTo(0.05, 0.7); s.lineTo(0, 0.95); s.lineTo(-0.05, 0.7); s.lineTo(-0.28, 0.82); s.lineTo(-0.1, 0.5); s.closePath()
      k.ekle(yer(cikar(s, 0.08, -0.04).rotateY(Math.PI / 2), x, y0, z), m.mermer)
    }
  }
  let mezarSay = 0
  for (let z = -21; z < 21 && mezarSay < 74; z += 2.35) {
    for (let x = -21; x < 21 && mezarSay < 74; x += 2.75) {
      const mx = x + r() * 0.5, mz = z + r() * 0.4
      const dur = r() > 0.35
      if (!dur || !mezarAlani(mx, mz)) continue
      mezarSay++
      const gen = 1.5, der = 0.68, h = 0.22
      for (const s of [-1, 1]) {
        kutu(gen, h, 0.08, m.sekiMermer, mx, h / 2, mz + (s * der) / 2)
        kutu(0.08, h, der, m.sekiMermer, mx + (s * gen) / 2, h / 2, mz)
      }
      kutu(gen - 0.08, 0.02, der - 0.08, m.mezarIci, mx, h - 0.04, mz)
      const tip = Math.floor(r() * 3)
      baslik(tip, mx - gen / 2 + 0.1, mz, h - 0.05)
      if (r() > 0.45) baslik(0, mx + gen / 2 - 0.1, mz, h - 0.1)
      engel(mx - gen / 2, mx + gen / 2, mz - der / 2, mz + der / 2)
    }
  }
  // Anıtsal sandukalar: H. 1208 / M. 1794 tarihli taşlar (fotoğrafa göre; konumları temsilîdir)
  for (const [x, z] of [[T.x - 4.4, T.z + 2.2], [T.x + 4.3, T.z + 2.5]] as const) {
    kutu(2.1, 0.62, 0.92, m.mermer, x, 0.31, z)
    kutu(2.14, 0.06, 0.96, m.sekiMermer, x, 0.65, z)
    kutu(2.03, 0.02, 0.84, m.mezarIci, x, 0.69, z)
    for (const s of [-1, 1]) {
      kutu(0.1, 1.8, 0.42, m.mermer, x + s * 0.98, 1.3, z)
      k.ekle(yer(new THREE.SphereGeometry(0.21, 8, 6).scale(1, 0.8, 1), x + s * 0.98, 2.35, z), m.mermer)
    }
    engel(x - 1.05, x + 1.05, z - 0.46, z + 0.46)
  }

  // --- Ağaçlar: selviler ve büyük yapraklı ağaç (fotoğraf). Yerleri temsilîdir ---
  const selvi = (x: number, z: number, boy: number) => {
    const p: [number, number][] = [[0.1, 1], [0.8, 1.4], [1.2, boy * 0.22], [1.32, boy * 0.38], [1.2, boy * 0.55], [0.9, boy * 0.72], [0.5, boy * 0.88], [0.001, boy]]
    const g = dondurG(p, 14)
    const poz = g.attributes.position, tohum = x * 0.4 + z * 0.7
    for (let v = 0; v < poz.count; v++) {
      const vx = poz.getX(v), vy = poz.getY(v), vz = poz.getZ(v), a = Math.atan2(vx, vz)
      const o = 1 + 0.11 * Math.sin(a * 3 + vy * 0.8 + tohum) + 0.06 * Math.sin(a * 7 - vy * 1.7 + tohum)
      poz.setX(v, vx * o); poz.setZ(v, vz * o)
    }
    g.computeVertexNormals()
    k.ekle(yer(g, x, 0, z), m.selvi)
    k.ekle(yer(silindirG(0.14, 0.24, 1.6, 8), x, 0.8, z), m.gövde)
    daireler.push({ x, z, r: 0.35 })
  }
  selvi(-13, 14.5, 15); selvi(-10.2, 17.6, 13.5); selvi(16.4, 7.5, 14.5); selvi(18, 2.5, 13)
  const buyukAgac = (x: number, z: number, R: number, boy: number) => {
    k.ekle(yer(silindirG(0.32, 0.48, boy * 0.55, 8), x, boy * 0.27, z), m.gövde)
    daireler.push({ x, z, r: 0.55 })
    for (const [dx, dy, dz, rr] of [[0, 0.72, 0, 1], [R * 0.45, 0.6, R * 0.2, 0.7], [-R * 0.4, 0.62, R * 0.32, 0.72], [R * 0.1, 0.62, -R * 0.45, 0.72]] as const) {
      const g = new THREE.IcosahedronGeometry(R * rr, 2)
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const o = 1 + 0.12 * Math.sin(p.getX(v) * 1.7 + p.getY(v)) + 0.08 * Math.cos(p.getZ(v) * 2.3)
        p.setXYZ(v, p.getX(v) * o, p.getY(v) * o, p.getZ(v) * o)
      }
      g.computeVertexNormals()
      const uv = g.attributes.uv
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10, uv.getY(i) * 6)
      k.ekle(yer(g, x + dx, boy * dy, z + dz), m.yaprak)
    }
  }
  buyukAgac(-16.5, -9.5, 4, 12)

  // --- Duraklar ---
  const durak = (id: string, ad: string, konum: [number, number, number], bak: [number, number, number]): IcDurak => ({ id, ad, konum, bak })
  const ICY = GOZ_Y + DOSEME
  const SC_MERKEZ = (ZSC + ZK) / 2
  const duraklar: IcDurak[] = [
    durak('son-cemaat', 'Son cemaat yeri', [AX + 0.6, ICY, SC_MERKEZ - 0.3], [AX, 2.3, A.z0]),
    durak('vakfiye', 'Taş vakfiye', [XD - UC_DUVAR - 5.2, ICY, SC_MERKEZ], [XD - UC_DUVAR, 4.1, SC_MERKEZ]),
    durak('mihrap', 'Mihrap', [AX, ICY, 1.15], [AX, 2.75, A.z1]),
    durak('minber', 'Minber', [AX + 0.7, ICY, 1.6], [MINBER.x, 2.5, MINBER.z0 + 1.8]),
    durak('mahfil', 'Mahfil', [AX - 0.2, MAHFIL.y + GOZ_Y, A.z0 + 1.1], [AX, 3, A.z1]),
    durak('gecit', 'Geçit', [(A.x1 + B.x0) / 2, ICY, BZ], [BX + 3, 2.4, BZ]),
    durak('kucuk-mekan', 'Küçük mekân', [BX + 0.9, ICY, BZ - 1.6], [BX - 0.8, 5.2, B.z1]),
    durak('cesme', 'Çeşme', [XB - 3.1, GOZ_Y, CZ], [XB, 1.5, CZ]),
    durak('turbe', 'Umur Bey Türbesi', [T.x + 0.1, GOZ_Y, T.z - 4.6], [T.x, 1.9, T.z]),
    durak('sadirvan', 'Şadırvan', [SD.x - 4.2, GOZ_Y, SD.z - 1.2], [SD.x, 2, SD.z]),
  ]

  // --- Katmanlar ---
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  const kok = k.grup()
  kok.add(catiGrup, kasnakGrup, kubbeGrup)

  return {
    kok,
    katmanlar: [
      { grup: catiGrup, yukseklik: 18, ad: 'Çatı' },
      { grup: kasnakGrup, yukseklik: 30, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 42, ad: 'Kubbeler' },
    ],
    duraklar,
    yurume: {
      sinir: { x0: -20, x1: 20, z0: -20, z1: 20 },
      kutular: engeller,
      daireler,
      zeminler,
      gorusKesenler: duvarlar,
      gozY: GOZ_Y,
      tabanY: 0,
    },
    // Fotoğraftaki gibi kuzeydoğudan: son cemaat yeri önde, minare geride.
    kamera: { konum: [31, 24, -40], hedef: [0, 7.2, 0] },
    kaideYaricap: 24.5,
    icIsiklar: [[AX, 9.4, AZ], [BX, 8.6, BZ], [0, 6.2, SC_MERKEZ]],
  }
}
