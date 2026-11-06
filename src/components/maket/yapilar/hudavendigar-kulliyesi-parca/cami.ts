// Hudâvendigâr Camii ve üst kattaki medresesi. Plan ölçüleri plan.ts'te. Cephe, minare, kubbe ve iç mekân biçimleri
// envanter fotoğraflarına bakılarak temsilî yorumlanmıştır. Hat yazısı taklit edilmez.
import * as THREE from 'three'
import { Kova, type Mal, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, uvSigdir, yer } from '../../ulucamiParca'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'
import type { KulliyeMalzemeleri } from './dokular'
import {
  APSIS_X, APSIS_Z, ARKA_X, ARKA_Z, AYAK_G, AYAKLAR, ACIKLIK, BASAMAK, BOLUMLER, EYVAN_H, GIRIS_HOL, GOVDE_Z, HARIM, HARIM_H,
  MAHFIL, MEDRESE_Y, MERDIVEN, MERDIVEN_KAPI, MINBER, NIS, ON_Z, REVAK_ARKA, REVAK_H, REVAK_Z, SACAK_Y, SAD, SAD_Z, SOFA_H, TABAN, UC_AYAK,
  YARI_X, YESIK, altKutleler, dosemeler, ustKutleler,
} from './plan'

const UST0 = 7.5 // medrese katmanının başladığı yükseklik

/** Dünya koordinatından duvar UV'si: örgü sıraları bütün parçalarda aynı hizada kalır. */
export function duvarUV(g: THREE.BufferGeometry) {
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
export function kemerUstu(w: number, yS: number, h: number, ust: number) {
  const o = w / 2, s = new THREE.Shape()
  s.moveTo(-o, yS)
  s.quadraticCurveTo(-o, yS + h * 0.55, 0, yS + h)
  s.quadraticCurveTo(o, yS + h * 0.55, o, yS)
  s.lineTo(o, ust); s.lineTo(-o, ust); s.closePath()
  return s
}

/** Yerel x dünya z'sine döner; yerel derinlik x'ten -x yönüne uzanır. */
export const zDuzlem = (g: THREE.BufferGeometry, x: number, zm: number) => g.rotateY(-Math.PI / 2).translate(x, 0, zm)

/** Sivri kemerin çevresinde sırayla iki malzemeden örülen taşlar. */
export function kemerTaslari(cx: number, yS: number, o: number, h: number, kal: number, n: number, der: number, z: number) {
  const noktalar = (oo: number, hh: number, t: number) => {
    const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t
    return [a * -oo + b * -oo, a * yS + b * (yS + hh * 0.55) + c * (yS + hh)] as const
  }
  const parcalar: { g: THREE.BufferGeometry; ikinci: boolean }[] = []
  for (const yan of [-1, 1]) for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n
    const [ix0, iy0] = noktalar(o, h, t0), [ix1, iy1] = noktalar(o, h, t1)
    const [dx0, dy0] = noktalar(o + kal, h + kal * 1.15, t0), [dx1, dy1] = noktalar(o + kal, h + kal * 1.15, t1)
    const s = new THREE.Shape()
    s.moveTo(cx + ix0 * -yan, iy0); s.lineTo(cx + dx0 * -yan, dy0); s.lineTo(cx + dx1 * -yan, dy1); s.lineTo(cx + ix1 * -yan, iy1); s.closePath()
    parcalar.push({ g: new THREE.ExtrudeGeometry(s, { depth: der, bevelEnabled: false }).translate(0, 0, z), ikinci: i % 2 === 1 })
  }
  return parcalar
}

/** Kare veya dikdörtgen tabandan daire ağza geçen pandantif yüzey. */
export function pandantifG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, R: number) {
  const SEG = 48, SIRA = 6
  const konum: number[] = [], uv: number[] = [], dizin: number[] = []
  for (let s = 0; s <= SIRA; s++) {
    const t = s / SIRA, e = Math.pow(t, 0.72)
    for (let a = 0; a <= SEG; a++) {
      const teta = (a / SEG) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
      const uzak = Math.min(dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity, dz > 0 ? (z1 - cz) / dz : dz < 0 ? (z0 - cz) / dz : Infinity)
      const r = THREE.MathUtils.lerp(uzak, R, e)
      konum.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / SEG, t)
    }
  }
  for (let s = 0; s < SIRA; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    dizin.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(dizin)
  g.computeVertexNormals()
  return g
}

/** Kırma çatı: mahya `eksen` boyuncadır; saçak y'den mahya yR'ye. */
export function kirmaCati(x0: number, x1: number, z0: number, z1: number, y: number, yR: number, eksen: 'x' | 'z') {
  const k: number[] = [], uv: number[] = []
  const tri = (a: number[], b: number[], c: number[]) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const ny = ab[2] * ac[0] - ab[0] * ac[2]
    for (const v of ny >= 0 ? [a, b, c] : [a, c, b]) { k.push(v[0], v[1], v[2]); uv.push(v[0], v[2]) }
  }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
  const A = [x0, y, z0], B = [x1, y, z0], C = [x1, y, z1], D = [x0, y, z1]
  if (eksen === 'z') {
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
function ustenUV(g: THREE.BufferGeometry, cx: number, cz: number, R: number) {
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - cx) / (2 * R) + 0.5, (p.getZ(i) - cz) / (2 * R) + 0.5)
  return g
}

export function camiKur(m: UlucamiMalzemeleri, x: KulliyeMalzemeleri, k: Kova, kUst: Kova, kCati: Kova, kKubbe: Kova) {
  const kutu = (g: number, h: number, d: number, mal: Mal, px: number, py: number, pz: number, kv = k) => kv.ekle(yer(kutuG(g, h, d), px, py, pz), mal)
  const uvKutu = (g: number, h: number, d: number, mal: Mal, px: number, py: number, pz: number, kv = k) => kv.ekle(duvarUV(yer(kutuG(g, h, d), px, py, pz)), mal)
  /** İki noktası verilen kutu. */
  const kutuDik = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mal: Mal, kv = k) =>
    kv.ekle(yer(kutuG(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mal)

  // --- Taban kütlesi ve merdivenler ---
  uvKutu(YARI_X * 2 + 0.3, 1, GOVDE_Z - ON_Z + 0.15, m.tas, 0, 0.5, (ON_Z + GOVDE_Z) / 2)
  uvKutu(ARKA_X * 2 + 0.3, 1, ARKA_Z - GOVDE_Z + 0.1, m.tas, 0, 0.5, (ARKA_Z + GOVDE_Z) / 2)
  for (let i = 0; i < 5; i++) {
    const d = (5 - i) * 0.42
    kutu(6.4 - i * 0.12, 0.2, d, m.mermer, 0, (i + 0.5) * 0.2, ON_Z - d / 2)
  }
  // Son cemaat yeri: taş orta sahanlık, üç basamakla çıkılan yan sofalar
  kutuDik(-14.3, 14.3, 0.9, TABAN, ON_Z + 0.02, REVAK_ARKA, m.doseme)
  for (const s of [-1, 1]) {
    kutuDik(Math.min(s * 2.91, s * 14.3), Math.max(s * 2.91, s * 14.3), TABAN, TABAN + SOFA_H, ON_Z + 0.02, REVAK_ARKA, m.doseme)
    kutuDik(Math.min(s * 2.91, s * 2.6), Math.max(s * 2.91, s * 2.6), TABAN, TABAN + SOFA_H * 0.5, ON_Z + 0.02, REVAK_ARKA, m.doseme)
  }

  // --- Duvar kütleleri: yürüme alanıyla aynı plandan ---
  for (const r of altKutleler()) kutuDik(r.x0, r.x1, 0.98, UST0, r.z0, r.z1, x.duvarIc)
  for (const r of ustKutleler()) kutuDik(r.x0, r.x1, MEDRESE_Y, SACAK_Y, r.z0, r.z1, x.duvarIc, kUst)
  for (const r of dosemeler()) {
    kutuDik(r.x0, r.x1, UST0, UST0 + 0.2, r.z0, r.z1, x.tavan, kUst)
    kutuDik(r.x0, r.x1, UST0 + 0.2, MEDRESE_Y, r.z0, r.z1, x.haliKirmizi, kUst)
  }

  // --- Kuzey cephesi: alt kat ---
  const onAlt = dikdortgen(-YARI_X, 0, YARI_X, MEDRESE_Y)
  const KEMER_S = 4.2, KEMER_H = 2
  for (const c of BOLUMLER) onAlt.holes.push(kemer(new THREE.Path(), c, TABAN, ACIKLIK, KEMER_S - TABAN, KEMER_H))
  k.ekle(duvarUV(cikar(onAlt, REVAK_Z - ON_Z, ON_Z)), x.almasik)
  // Ayaklar kesme taş, kemer başlangıcında silme (s. 82-83)
  const ayakKutu = (cx: number, g: number) => {
    uvKutu(g + 0.04, KEMER_S - 0.05, REVAK_Z - ON_Z + 0.04, m.tas, cx, (KEMER_S - 0.05) / 2, (ON_Z + REVAK_Z) / 2)
    kutu(g + 0.2, 0.2, REVAK_Z - ON_Z + 0.2, m.mermer, cx, KEMER_S + 0.05, (ON_Z + REVAK_Z) / 2)
  }
  AYAKLAR.forEach((c) => ayakKutu(c, AYAK_G))
  for (const s of [-1, 1]) ayakKutu(s * (YARI_X - UC_AYAK / 2), UC_AYAK)
  const taslar = (cx: number, yS: number, o: number, h: number, kal: number, n: number, der: number, z: number, m1: Mal, m2: Mal, kv = k) => {
    for (const { g, ikinci } of kemerTaslari(cx, yS, o, h, kal, n, der, z)) kv.ekle(g, ikinci ? m2 : m1)
  }
  for (const c of BOLUMLER) {
    // İki kademeli kemer: dışta taş-tuğla, içte taş; arada ahşap gergi
    taslar(c, KEMER_S, ACIKLIK / 2, KEMER_H, 0.5, 7, 0.09, ON_Z - 0.09, x.tuglaKaba, m.tas)
    taslar(c, KEMER_S, ACIKLIK / 2 - 0.26, KEMER_H - 0.3, 0.26, 6, 0.3, ON_Z + 0.02, m.tas, m.tas)
    kutu(ACIKLIK + 0.2, 0.16, 0.16, x.gergi, c, KEMER_S + 0.05, ON_Z + 0.5)
    kutu(ACIKLIK + 0.2, 0.16, 0.16, x.gergi, c, KEMER_S + 0.05, REVAK_Z - 0.3)
  }
  // Orta üç kemerin üstünde kuş evi olarak tasarlanmış küçük pencereler (s. 84-85)
  for (const c of BOLUMLER.slice(1, 4)) {
    k.ekle(new THREE.ShapeGeometry(kemer(new THREE.Shape(), c, 6.92, 0.34, 0.18, 0.28), 6).translate(0, 0, ON_Z - 0.015).rotateY(0), x.koyuCam)
    taslar(c, 7.1, 0.17, 0.28, 0.12, 3, 0.05, ON_Z - 0.05, x.tuglaKaba, m.mermer)
  }
  // Kat silmesi
  kutu(YARI_X * 2 + 0.3, 0.24, 0.22, m.mermer, 0, MEDRESE_Y - 0.05, ON_Z - 0.06)

  // Korkuluk: beyaz çubuklar, üst ve alt kuşak (fotoğraflara göre)
  const korkuluk = (x0: number, x1: number, y: number, z: number, kv: Kova, yonZ = false) => {
    const L = Math.abs(x1 - x0), n = Math.floor(L / 0.24)
    const ek = (g: THREE.BufferGeometry) => {
      if (yonZ) g.rotateY(Math.PI / 2).translate(z, y, (x0 + x1) / 2)
      else g.translate((x0 + x1) / 2, y, z)
      kv.ekle(g, x.beyaz)
    }
    ek(kutuG(L, 0.09, 0.14).translate(0, 0.86, 0))
    ek(kutuG(L, 0.09, 0.14).translate(0, 0.08, 0))
    for (let i = 0; i <= n; i++) ek(silindirG(0.05, 0.05, 0.74, 5).translate(-L / 2 + (L * i) / n, 0.47, 0))
  }
  BOLUMLER.forEach((c, i) => { if (i !== 2) korkuluk(c - ACIKLIK / 2, c + ACIKLIK / 2, TABAN + SOFA_H, ON_Z + 0.52, k) })

  // --- Kuzey cephesi: üst kat, medrese revağı ---
  const UST_S = 10.2, UST_H = 2.4, YS = 1.2
  const onUst = dikdortgen(-YARI_X, MEDRESE_Y, YARI_X, SACAK_Y)
  for (const c of BOLUMLER) onUst.holes.push(kemer(new THREE.Path(), c, MEDRESE_Y + 0.01, ACIKLIK, UST_S - MEDRESE_Y, UST_H))
  kUst.ekle(duvarUV(cikar(onUst, REVAK_Z - ON_Z, ON_Z)), x.almasik)
  /** İkiz kemerli alınlık: büyük kemer sütunla ikiye bölünür. */
  const ikizAlinlik = (o: number, s: number, H: number, yh: number) => {
    const e = new THREE.Shape(), i = 0.14
    const ic = (a: number, b: number) => {
      const om = (a + b) / 2
      e.quadraticCurveTo(a, s + yh * 0.55, om, s + yh)
      e.quadraticCurveTo(b, s + yh * 0.55, b, s)
    }
    e.moveTo(-o, s); ic(-o, -i); e.lineTo(i, s); ic(i, o)
    e.quadraticCurveTo(o, s + H * 0.55, 0, s + H)
    e.quadraticCurveTo(-o, s + H * 0.55, -o, s)
    e.closePath()
    return e
  }
  const sutun = (px: number, y0: number, y1: number, pz: number, kv: Kova) => {
    kv.ekle(yer(silindirG(0.15, 0.17, y1 - y0 - 0.5, 10), px, (y0 + y1 - 0.5) / 2 + 0.1, pz), x.beyaz)
    kv.ekle(yer(silindirG(0.25, 0.17, 0.4, 8), px, y1 - 0.2, pz), x.beyaz)
    kv.ekle(yer(silindirG(0.22, 0.24, 0.2, 8), px, y0 + 0.1, pz), x.beyaz)
    kv.ekle(yer(kutuG(0.55, 0.1, 0.55), px, y1 + 0.03, pz), x.beyaz)
  }
  for (const c of BOLUMLER) {
    kUst.ekle(duvarUV(cikar(ikizAlinlik(ACIKLIK / 2, UST_S, UST_H, YS), 0.42, ON_Z + 0.4).translate(c, 0, 0)), x.almasik)
    taslar(c, UST_S, ACIKLIK / 2, UST_H, 0.46, 8, 0.1, ON_Z - 0.1, m.tas, x.tuglaKaba, kUst)
    sutun(c, MEDRESE_Y, UST_S, ON_Z + 0.6, kUst)
    korkuluk(c - ACIKLIK / 2, c + ACIKLIK / 2, MEDRESE_Y, ON_Z + 0.22, kUst)
    for (const s of [-1, 1]) taslar(c + s * (ACIKLIK / 4 + 0.07), UST_S, ACIKLIK / 4 - 0.07, YS, 0.14, 4, 0.05, ON_Z + 0.34, m.tas, x.tuglaKaba, kUst)
  }
  // Ortadaki geometrik panolar (fotoğrafa göre)
  for (const s of [-1, 1]) for (const c of [2.91, 8.73]) kutu(0.82, 1.6, 0.04, x.gecme, s * c, 12, ON_Z - 0.02, kUst)
  kUst.ekle(yer(kutuG(30.3, 0.12, 5.1), 0, MEDRESE_Y - 0.06, -21.45), m.doseme)

  // --- Doğu ve batı uçları: alt ve üstte ikiz kemer (s. 84, 92) ---
  const ZM = (ON_Z + REVAK_ARKA) / 2, UC = 0.8 // revak uçları ortası
  const U0 = (REVAK_Z + REVAK_ARKA) / 2 - ZM // açıklığın eksene göre konumu
  for (const s of [-1, 1]) {
    const px = s > 0 ? YARI_X : -YARI_X + UC
    const alt = dikdortgen(ON_Z - ZM, 0, REVAK_ARKA - ZM, MEDRESE_Y)
    for (const a of [-0.76, 0.76]) alt.holes.push(kemer(new THREE.Path(), U0 + a, TABAN + SOFA_H, 1.3, KEMER_S - TABAN - SOFA_H, 1.1))
    k.ekle(duvarUV(zDuzlem(cikar(alt, UC), px, ZM)), x.almasik)
    sutun(s * 14.7, TABAN + SOFA_H, KEMER_S, ZM + U0, k)
    korkuluk(ZM + U0 - 1.5, ZM + U0 + 1.5, TABAN + SOFA_H, s * 14.7, k, true)
    const ust = dikdortgen(ON_Z - ZM, MEDRESE_Y, REVAK_ARKA - ZM, SACAK_Y)
    ust.holes.push(kemer(new THREE.Path(), U0, MEDRESE_Y + 0.01, 3, UST_S - MEDRESE_Y, 2.2))
    kUst.ekle(duvarUV(zDuzlem(cikar(ust, UC), px, ZM)), x.almasik)
    kUst.ekle(duvarUV(zDuzlem(cikar(ikizAlinlik(1.5, UST_S, 2.2, 1), 0.3).translate(U0, 0, 0), px - 0.25, ZM)), x.almasik)
    sutun(s * 14.7, MEDRESE_Y, UST_S, ZM + U0, kUst)
    korkuluk(ZM + U0 - 1.5, ZM + U0 + 1.5, MEDRESE_Y, s * 15, kUst, true)
    taslar(0, UST_S, 1.5, 2.2, 0.4, 7, 0.08, 0, m.tas, x.tuglaKaba, new KovaYonlendir(kUst, (g) => g.translate(U0, 0, 0).rotateY(s * Math.PI / 2).translate(s * (YARI_X + 0.08) + (s > 0 ? -0.08 : 0.08), 0, ZM)) as unknown as Kova)
  }

  // --- Son cemaat ve revak: enine kemerler, pandantif, kubbe (s. 83, 92) ---
  const bolumAciklik = BOLUMLER.map((c, i) => i === 0 ? [-14.3, -9.78] : i === 4 ? [9.78, 14.3] : [c - ACIKLIK / 2, c + ACIKLIK / 2])
  for (const a of AYAKLAR) {
    k.ekle(zDuzlem(cikar(kemerUstu(REVAK_ARKA - REVAK_Z, KEMER_S, 2.05, UST0), AYAK_G), a + AYAK_G / 2, (REVAK_Z + REVAK_ARKA) / 2), m.tas)
    kutu(AYAK_G + 0.1, 0.16, 0.16, x.gergi, a, KEMER_S + 0.05, REVAK_ARKA - 0.3)
    kutu(AYAK_G + 0.1, 3.3, 0.2, m.tas, a, 2.6, REVAK_ARKA - 0.08)
    kUst.ekle(zDuzlem(cikar(kemerUstu(REVAK_ARKA - REVAK_Z, UST_S, 2.2, SACAK_Y), AYAK_G), a + AYAK_G / 2, (REVAK_Z + REVAK_ARKA) / 2), x.tavan)
  }
  bolumAciklik.forEach(([a0, a1], i) => {
    const cx = (a0 + a1) / 2, cz = (REVAK_Z + REVAK_ARKA) / 2
    k.ekle(pandantifG(cx, cz, a0, a1, REVAK_Z, REVAK_ARKA, 6.1, 6.95, 1.72), x.tavan)
    const profil: [number, number][] = []
    for (let t = 0; t <= 8; t++) { const a = (t / 8) * Math.PI / 2; profil.push([Math.max(1.72 * Math.cos(a), 0.001), 0.72 * Math.sin(a)]) }
    const kubbe = yer(dondurG(profil, 24, [1, 1]), cx, 6.95, cz)
    if (i === 2) k.ekle(ustenUV(kubbe, cx, cz, 1.72), x.gobek) // orta bölümde madalyon (s. 85)
    else k.ekle(kubbe, x.tavan)
    // Revak: yanlardakiler aynalı tonoz, ortadakiler kubbe (s. 92)
    if (i === 0 || i === 4) { kutuDik(a0, a1, 12.4, SACAK_Y, REVAK_Z, REVAK_ARKA, x.tavan, kUst); return }
    kUst.ekle(pandantifG(cx, cz, a0, a1, REVAK_Z, REVAK_ARKA, 12.35, 13.1, 1.72), x.tavan)
    kUst.ekle(yer(dondurG(profil, 24, [1, 1]), cx, 13.1, cz), x.tavan)
  })

  // --- Dış duvar kaplaması ---
  const kaplama = (L: number, cx: number, cz: number, ry: number, y0: number, y1: number, kv: Kova, mal: Mal) => {
    kv.ekle(duvarUV(yer(kutuG(L, y1 - y0, 0.06), cx, (y0 + y1) / 2, cz, ry)), mal)
  }
  const pencereDis = (cx: number, cz: number, ry: number, y0: number, g: number, h: number, kv: Kova, kemerli: boolean) => {
    const ek = (geo: THREE.BufferGeometry, mal: Mal) => kv.ekle(yer(geo, cx, 0, cz, ry), mal)
    if (kemerli) {
      ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, g, h, g * 0.6), 8).translate(0, 0, 0.1), x.koyuCam)
      const s = kemer(new THREE.Shape(), 0, y0 - 0.1, g + 0.34, h + 0.1, g * 0.75)
      s.holes.push(kemer(new THREE.Path(), 0, y0, g, h, g * 0.6))
      ek(cikar(s, 0.1, 0.03), m.mermer)
    } else {
      ek(kutuG(g, h, 0.03).translate(0, y0 + h / 2, 0.09), x.koyuCam)
      for (const a of [-1, 1]) ek(kutuG(0.18, h + 0.3, 0.1).translate(a * (g / 2 + 0.09), y0 + h / 2, 0.08), m.mermer)
      for (const a of [-1, 1]) ek(kutuG(g + 0.36, 0.16, 0.1).translate(0, y0 + h / 2 + a * (h / 2 + 0.07), 0.08), m.mermer)
    }
  }
  const sacak = (L: number, cx: number, cz: number, ry: number, ust = SACAK_Y) => {
    kUst.ekle(yer(kutuG(L, 0.8, 0.14), cx, ust - 0.5, cz, ry), x.friz)
    kUst.ekle(duvarUV(yer(kutuG(L + 0.2, 0.24, 0.5), cx, ust - 0.02, cz, ry)), m.tas)
  }
  const onZ = (ON_Z + GOVDE_Z) / 2, onL = GOVDE_Z - ON_Z
  const yanZ0 = REVAK_ARKA, yanL = GOVDE_Z - REVAK_ARKA, yanZ = (GOVDE_Z + REVAK_ARKA) / 2
  for (const s of [-1, 1]) {
    const ry = s * Math.PI / 2, X = s * (YARI_X + 0.03)
    kaplama(yanL, X, yanZ, ry, 1, MEDRESE_Y, k, x.yanCephe)
    kaplama(yanL, X, yanZ, ry, MEDRESE_Y, SACAK_Y, kUst, x.yanCephe)
    uvKutu(0.12, 0.24, yanL, m.mermer, X, MEDRESE_Y - 0.05, yanZ)
    // Alt kat pencereleri tabhane odalarını, üsttekiler hücreleri aydınlatır
    for (const z of [-15, -7.6, 5.4]) pencereDis(X, z, ry, 3.2, 1.1, 1.7, k, false)
    pencereDis(X, -0.5, ry, 3.2, 1.1, 1.9, k, false)
    for (let i = 0; i < 6; i++) pencereDis(X, -9.8 + i * 3, ry, 10.1, 0.55, 0.85, kUst, false)
    for (const z of [-17, -13.8]) pencereDis(X, z, ry, 10.1, 0.55, 0.85, kUst, false)
    // Saçak altındaki sığ kemerler (fotoğrafa göre)
    for (let i = 0; i < 6; i++) {
      const zc = yanZ0 + (i + 0.5) * (yanL / 6)
      taslarYan(zc, X)
    }
    sacak(onL + 0.1, s * (YARI_X + 0.05), onZ, ry)
    // Harim kütlesinin yan yüzü ve dönüşleri
    const rX = s * (ARKA_X + 0.03), rZ = (GOVDE_Z + ARKA_Z) / 2, rL = ARKA_Z - GOVDE_Z
    kaplama(rL, rX, rZ, ry, 1, MEDRESE_Y, k, x.yanCephe)
    kaplama(rL, rX, rZ, ry, MEDRESE_Y, SACAK_Y, kUst, x.yanCephe)
    for (const z of [12.6, 17.8]) pencereDis(rX, z, ry, 4, 1, 1.9, k, false)
    pencereDis(rX, 15.2, ry, 10, 0.5, 1.3, kUst, true)
    sacak(rL + 0.1, s * (ARKA_X + 0.05), rZ, ry)
    const dL = YARI_X - ARKA_X, dX = s * (YARI_X + ARKA_X) / 2
    kaplama(dL, dX, GOVDE_Z + 0.03, 0, 1, MEDRESE_Y, k, x.yanCephe)
    kaplama(dL, dX, GOVDE_Z + 0.03, 0, MEDRESE_Y, SACAK_Y, kUst, x.yanCephe)
    for (const a of [-2.2, 2.2]) pencereDis(dX + a, GOVDE_Z + 0.03, 0, 3.6, 0.9, 1.5, k, false)
    for (const a of [-2.2, 2.2]) pencereDis(dX + a, GOVDE_Z + 0.03, 0, 10.1, 0.55, 0.85, kUst, false)
    sacak(dL + 0.1, dX, GOVDE_Z + 0.05, 0)
    const gL = ARKA_X - APSIS_X, gX = s * (ARKA_X + APSIS_X) / 2
    kaplama(gL, gX, ARKA_Z + 0.03, 0, 1, MEDRESE_Y, k, x.yanCephe)
    kaplama(gL, gX, ARKA_Z + 0.03, 0, MEDRESE_Y, SACAK_Y, kUst, x.yanCephe)
    sacak(gL + 0.1, gX, ARKA_Z + 0.05, 0)
  }
  function taslarYan(zc: number, X: number) {
    const s = Math.sign(X)
    for (const { g, ikinci } of kemerTaslari(0, 11.7, 2.1, 1.1, 0.3, 5, 0.06, 0)) {
      g.rotateY(s * Math.PI / 2).translate(X, 0, zc)
      kUst.ekle(g, ikinci ? m.tas : x.tuglaKaba)
    }
  }
  sacak(YARI_X * 2 + 0.4, 0, ON_Z - 0.05, Math.PI)

  // Dışa taşan beş cepheli mihrap yuvası (s. 89)
  const apsis = (y0: number, y1: number, kv: Kova) => {
    const s = new THREE.Shape()
    s.moveTo(-APSIS_X, -ARKA_Z); s.lineTo(-APSIS_X, -22.8); s.lineTo(-2.2, -APSIS_Z); s.lineTo(2.2, -APSIS_Z); s.lineTo(APSIS_X, -22.8); s.lineTo(APSIS_X, -ARKA_Z); s.closePath()
    kv.ekle(duvarUV(cikar(s, y1 - y0).rotateX(-Math.PI / 2).translate(0, y0, 0)), x.yanCephe)
  }
  apsis(0, MEDRESE_Y, k); apsis(MEDRESE_Y, SACAK_Y - 0.2, kUst)
  pencereDis(0, APSIS_Z + 0.02, 0, 10, 0.6, 1.3, kUst, true)
  {
    const s = new THREE.Shape()
    s.moveTo(-APSIS_X - 0.25, -ARKA_Z); s.lineTo(-APSIS_X - 0.25, -22.9); s.lineTo(-2.3, -APSIS_Z - 0.25); s.lineTo(2.3, -APSIS_Z - 0.25); s.lineTo(APSIS_X + 0.25, -22.9); s.lineTo(APSIS_X + 0.25, -ARKA_Z); s.closePath()
    kUst.ekle(duvarUV(cikar(s, 0.28).rotateX(-Math.PI / 2).translate(0, SACAK_Y - 0.3, 0)), m.tas)
    // Üstü: kurşun kaplı eğik örtü
    const tepe = [0, SACAK_Y + 1.1, 21.6] as const
    const c = [[-APSIS_X - 0.3, 21.2], [-APSIS_X - 0.3, 22.9], [-2.3, APSIS_Z + 0.3], [2.3, APSIS_Z + 0.3], [APSIS_X + 0.3, 22.9], [APSIS_X + 0.3, 21.2]]
    const konum: number[] = [], uv: number[] = []
    for (let i = 0; i < c.length - 1; i++) {
      konum.push(c[i][0], SACAK_Y, c[i][1], c[i + 1][0], SACAK_Y, c[i + 1][1], tepe[0], tepe[1], tepe[2])
      uv.push(c[i][0], c[i][1], c[i + 1][0], c[i + 1][1], tepe[0], tepe[2])
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    kCati.ekle(g, m.kursun)
  }

  // --- Çatılar: düşük eğimli kurşun kırma çatı (fotoğraflara göre) ---
  const Y = SACAK_Y + 0.08
  kCati.ekle(kirmaCati(-YARI_X - 0.5, YARI_X + 0.5, -18.2, GOVDE_Z + 0.5, Y, Y + 2.3, 'z'), m.kursun)
  kCati.ekle(kirmaCati(-YARI_X - 0.5, YARI_X + 0.5, ON_Z - 0.5, -17.4, Y, Y + 1.5, 'x'), m.kursun)
  kCati.ekle(kirmaCati(-ARKA_X - 0.5, ARKA_X + 0.5, GOVDE_Z - 2, ARKA_Z + 0.5, Y, Y + 1.5, 'z'), m.kursun)

  // Revağın arkasında çatıdan görünen küçük kubbe (fotoğrafa göre)
  {
    const kx = 0, kz = -15.2, yy = 15.6
    kCati.ekle(yer(duzGolge(silindirG(2.3, 2.4, 0.5, 8).rotateY(Math.PI / 8)), kx, yy + 0.25, kz), x.tuglaKaba)
    const p: [number, number][] = []
    for (let t = 0; t <= 10; t++) { const a = (t / 10) * Math.PI / 2; p.push([Math.max(2.25 * Math.cos(a), 0.001), 1.5 * Math.sin(a)]) }
    kKubbe.ekle(yer(dondurG(p, 28, [1, 1]), kx, yy + 0.5, kz), m.kubbe)
    kKubbe.ekle(yer(dondurG([[0.12, 0], [0.05, 0.25], [0.1, 0.4], [0.02, 0.65], [0, 0.7]], 8), kx, yy + 1.95, kz), m.bronz)
  }

  // --- Büyük kubbe: taş-tuğla kare blok, on altı köşeli kasnak, kurşun kubbe, aydınlık feneri (s. 87-88) ---
  const KZ = SAD_Z, BLOK = 7.4, BLOK_U = SACAK_Y + 3
  {
    const halka = dikdortgen(-BLOK, -BLOK, BLOK, BLOK)
    halka.holes.push(new THREE.Path().absarc(0, 0, 5.75, 0, Math.PI * 2, true))
    const blok = cikar(halka, BLOK_U - SACAK_Y + 0.4).rotateX(-Math.PI / 2).translate(0, SACAK_Y - 0.4, KZ)
    kKubbe.ekle(duvarUV(blok), x.almasik)
    for (const [cx, cz, ry] of [[0, KZ - BLOK - 0.03, Math.PI], [0, KZ + BLOK + 0.03, 0], [BLOK + 0.03, KZ, Math.PI / 2], [-BLOK - 0.03, KZ, -Math.PI / 2]] as const) {
      kKubbe.ekle(yer(kutuG(BLOK * 2, 0.8, 0.14), cx, BLOK_U - 0.5, cz, ry), x.friz)
      kKubbe.ekle(duvarUV(yer(kutuG(BLOK * 2 + 0.3, 0.24, 0.6), cx, BLOK_U - 0.02, cz, ry)), m.tas)
    }
    kKubbe.ekle(yer(duzGolge(silindirG(6.3 * Math.SQRT2, (BLOK + 0.1) * Math.SQRT2, 0.5, 4, true).rotateY(Math.PI / 4)), 0, BLOK_U + 0.3, KZ), m.kursun)
    kKubbe.ekle(yer(duzGolge(silindirG(6.45, 6.55, 0.7, 16, true).rotateY(Math.PI / 16)), 0, BLOK_U + 0.8, KZ), x.tuglaKaba)
    kKubbe.ekle(yer(duzGolge(silindirG(6.6, 6.5, 0.16, 16).rotateY(Math.PI / 16)), 0, BLOK_U + 1.2, KZ), m.mermer)
    const prof: [number, number][] = []
    for (let t = 0; t <= 14; t++) {
      const a = (t / 14) * Math.PI / 2
      const r = 6.25 * Math.cos(a)
      if (r < 0.62) break
      prof.push([r, 3.2 * Math.sin(a)])
    }
    prof.push([0.62, prof[prof.length - 1][1]])
    kKubbe.ekle(yer(dondurG(prof, 96, [1, 1]), 0, BLOK_U + 1.2, KZ), m.kubbe)
    // Fener
    const fY = BLOK_U + 1.2 + prof[prof.length - 1][1]
    kKubbe.ekle(yer(silindirG(0.6, 0.62, 0.6, 8, true), 0, fY + 0.3, KZ), x.koyuCam)
    for (let n = 0; n < 8; n++) kKubbe.ekle(yer(kutuG(0.06, 0.6, 0.06).translate(0, fY + 0.3, 0.62), 0, 0, KZ, (n * Math.PI) / 4), m.mermer)
    kKubbe.ekle(yer(dondurG([[0.72, 0], [0.5, 0.2], [0.08, 0.5], [0, 0.55]], 12, [1, 1]), 0, fY + 0.6, KZ), m.kursun)
    kKubbe.ekle(yer(dondurG([[0.08, 0], [0.04, 0.2], [0.1, 0.32], [0.02, 0.6], [0, 0.65]], 8), 0, fY + 1.15, KZ), m.bronz)
  }

  // --- Minare: kuzeydoğu köşesinde, beden duvarı üzerinde, yaklaşık 34 m (s. 83) ---
  {
    const MX = 12.7, MZ = -16.4, ek = (g: THREE.BufferGeometry, mal: Mal) => kUst.ekle(yer(g, MX, 0, MZ), mal)
    ek(duvarUV(kutuG(3.3, SACAK_Y + 1.4 - MEDRESE_Y, 3.3).translate(MX, (SACAK_Y + 1.4 + MEDRESE_Y) / 2, MZ)).translate(-MX, 0, -MZ), m.tas)
    ek(dondurG([[1.5, 0], [1.5, 0.3], [1.28, 0.75]], 20).translate(0, SACAK_Y + 1.35, 0), m.mermer)
    ek(dondurG([[1.28, SACAK_Y + 2.1], [1.14, 25.6]], 28), x.minare)
    // Şerefe altı: beş sıra tuğla mukarnas (TDV)
    for (let t = 0; t < 5; t++) {
      const r = 1.14 + t * 0.1, y = 25.6 + t * 0.26
      ek(silindirG(r + 0.08, r, 0.26, 24).translate(0, y + 0.13, 0), x.tuglaKaba)
      for (let a = 0; a < 16; a++) {
        const teta = (a + (t % 2) * 0.5) * (Math.PI * 2) / 16
        ek(new THREE.SphereGeometry(0.14, 5, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5).translate(0, y + 0.02, r + 0.04).rotateY(teta), m.tas)
      }
    }
    ek(silindirG(1.76, 1.76, 0.18, 24).translate(0, 27, 0), m.mermer)
    // Korkuluk düz levhalardan (TDV)
    for (let a = 0; a < 16; a++) ek(kutuG(0.62, 0.85, 0.08).translate(0, 27.5, 1.7).rotateY((a * Math.PI) / 8), m.mermer)
    ek(silindirG(1.76, 1.76, 0.08, 24, true).translate(0, 27.94, 0), m.mermer)
    ek(dondurG([[0.94, 27], [0.86, 31.2]], 20), x.minare)
    ek(silindirG(1.02, 0.88, 0.2, 20).translate(0, 31.25, 0), m.mermer)
    // Külah
    ek(dondurG([[1.02, 31.35], [0.5, 32.5], [0.06, 33.5], [0, 33.55]], 16, [1, 1]), m.kursun)
    ek(dondurG([[0.05, 33.5], [0.1, 33.65], [0.03, 33.8], [0, 34]], 8), m.bronz)
  }

  // ============ İÇ MEKÂN ============
  const tb = TABAN
  // Döşemeler
  kutuDik(SAD.x0, SAD.x1, 0.9, tb, SAD.z0, SAD.z1, x.haliMavi)
  kutuDik(-1.7, 1.7, 0.9, tb, -10.9, -6.9, x.haliMavi)
  kutuDik(GIRIS_HOL.x0, GIRIS_HOL.x1, 0.9, tb, GIRIS_HOL.z0, GIRIS_HOL.z1, m.doseme)
  kutuDik(-1, 1, 0.9, tb, REVAK_ARKA, GIRIS_HOL.z0, m.doseme)
  kutuDik(HARIM.x0, HARIM.x1, 0.9, tb + HARIM_H, BASAMAK.z1, 20.9, x.haliMavi)
  for (const s of [-1, 1]) {
    const a = Math.min(s * YESIK.x0, s * YESIK.x1), b = Math.max(s * YESIK.x0, s * YESIK.x1)
    kutuDik(a, b, 0.9, tb + EYVAN_H, YESIK.z0, YESIK.z1, x.haliMavi)
    kutuDik(Math.min(s * 5.5, s * 5.56), Math.max(s * 5.5, s * 5.56), 0.9, tb + EYVAN_H + 0.005, YESIK.z0, YESIK.z1, m.mermer)
    // Merdiven kapısı önü ve basamaklar
    const kA = Math.min(s * MERDIVEN_KAPI.x0, s * MERDIVEN.x1), kB = Math.max(s * MERDIVEN_KAPI.x0, s * MERDIVEN.x1)
    kutuDik(kA, kB, 0.9, tb, MERDIVEN.zAlt, MERDIVEN.zSon, m.doseme)
    kutuDik(Math.min(s * MERDIVEN_KAPI.x0, s * MERDIVEN_KAPI.x1), Math.max(s * MERDIVEN_KAPI.x0, s * MERDIVEN_KAPI.x1), 0.9, tb, MERDIVEN_KAPI.z0, MERDIVEN_KAPI.z1, m.doseme)
    const ADIM = 38, L = MERDIVEN.zAlt - MERDIVEN.zUst
    for (let i = 0; i < ADIM; i++) {
      const y = tb + ((i + 1) / ADIM) * REVAK_H
      const z1 = MERDIVEN.zAlt - (i / ADIM) * L, z0 = z1 - L / ADIM
      kutuDik(Math.min(s * MERDIVEN.x0, s * MERDIVEN.x1), Math.max(s * MERDIVEN.x0, s * MERDIVEN.x1), 0.98, y, z0, z1, m.mermer)
    }
    // Merdivenin revağa bakan yüzü alt katta kapalıdır
    kutuDik(Math.min(s * MERDIVEN.x0, s * MERDIVEN.x1), Math.max(s * MERDIVEN.x0, s * MERDIVEN.x1), tb, UST0, REVAK_ARKA, REVAK_ARKA + 0.02, x.duvarIc)
    // Merdiven kapısı alınlığı
    const px = s > 0 ? MERDIVEN_KAPI.x1 : -MERDIVEN_KAPI.x0
    k.ekle(zDuzlem(cikar(kemerUstu(MERDIVEN_KAPI.z1 - MERDIVEN_KAPI.z0, tb + 2.05, 0.7, UST0), MERDIVEN_KAPI.x1 - MERDIVEN_KAPI.x0), px, (MERDIVEN_KAPI.z0 + MERDIVEN_KAPI.z1) / 2), x.duvarIc)
    // Merdiven ışığı: üst katın tavanı
    kutuDik(Math.min(s * MERDIVEN.x0, s * MERDIVEN.x1), Math.max(s * MERDIVEN.x0, s * MERDIVEN.x1), 10.4, 10.6, REVAK_ARKA, -15, x.tavan, kUst)
    // Revak duvarındaki merdiven kapısı
    kUst.ekle(cikar(kemerUstu(MERDIVEN.x1 - MERDIVEN.x0, 9.5, 0.9, SACAK_Y), 0.7, REVAK_ARKA).translate(s * (MERDIVEN.x0 + MERDIVEN.x1) / 2, 0, 0), x.duvarIc)
  }
  // Harim basamakları (fotoğrafta beş basamak; kitap "iki basamak" der, görünüm fotoğrafa göredir)
  {
    const ADIM = 5, L = BASAMAK.z1 - BASAMAK.z0
    for (let i = 0; i < ADIM; i++) {
      const z0 = BASAMAK.z0 + (i / ADIM) * L, z1 = BASAMAK.z0 + ((i + 1) / ADIM) * L
      kutuDik(-BASAMAK.x, BASAMAK.x, 0.9, tb + ((i + 1) / ADIM) * HARIM_H, z0, z1, x.haliMavi)
    }
    // Mermer korkuluk ve pabuçluk nişleri
    for (const s of [-1, 1]) {
      kutuDik(Math.min(s * BASAMAK.x, s * 4.75), Math.max(s * BASAMAK.x, s * 4.75), 0.9, tb + HARIM_H + 0.08, BASAMAK.z0, BASAMAK.z1 + 0.05, m.icMermer)
      for (const a of [3.42, 4.32]) k.ekle(new THREE.ShapeGeometry(kemer(new THREE.Shape(), s * a, tb + 0.2, 0.62, 0.36, 0.28), 6).rotateY(Math.PI).translate(s * a * 2, 0, BASAMAK.z0 - 0.01), x.koyuCam)
      // Ahşap korkuluk
      const px = s * (BASAMAK.x - 0.06)
      for (let i = 0; i <= 5; i++) {
        const t = i / 5, z = BASAMAK.z0 + t * L, y = tb + t * HARIM_H
        k.ekle(yer(silindirG(0.03, 0.03, 0.85, 5), px, y + 0.42, z), x.gergi)
      }
      const dL = Math.hypot(L, HARIM_H), a = Math.atan2(HARIM_H, L)
      const kup = kutuG(0.1, 0.09, dL).rotateX(-a).translate(px, tb + HARIM_H / 2 + 0.87, (BASAMAK.z0 + BASAMAK.z1) / 2)
      k.ekle(kup, x.gergi)
      // Dolaplar (fotoğrafa göre)
      const d0 = Math.min(s * 3.35, s * 4.75), d1 = Math.max(s * 3.35, s * 4.75)
      kutuDik(d0, d1, tb + HARIM_H, tb + HARIM_H + 2.1, 7.25, 8.2, x.kapi)
      kutuDik(d0 + 0.08, d1 - 0.08, tb + HARIM_H + 0.25, tb + HARIM_H + 1.95, 7.24, 7.25, x.gergi)
    }
  }
  // Son cemaat duvarı: cümle kapısı (mermer söveli, çift kanatlı, üstünde yazısız pano)
  {
    kutuDik(-1, 1, 3.7, UST0, REVAK_ARKA, -16.9, x.duvarIc)
    kutuDik(-1.35, -1, tb, 3.95, REVAK_ARKA - 0.08, REVAK_ARKA, m.mermer)
    kutuDik(1, 1.35, tb, 3.95, REVAK_ARKA - 0.08, REVAK_ARKA, m.mermer)
    kutuDik(-1.35, 1.35, 3.7, 4.05, REVAK_ARKA - 0.08, REVAK_ARKA, m.mermer)
    kutuDik(-0.6, 0.6, 4.2, 4.8, REVAK_ARKA - 0.04, REVAK_ARKA, m.mermer) // onarım kitabesi yeri: 60 x 120 cm (s. 85), yazı taklit edilmez
    for (const s of [-1, 1]) kutuDik(Math.min(s * 0.99, s * 0.92), Math.max(s * 0.99, s * 0.92), tb, 3.7, -18.8, -17.4, x.kapi)
    // Taş duvar kaplaması
    kutuDik(-14.3, -1.35, TABAN + SOFA_H, UST0, REVAK_ARKA - 0.02, REVAK_ARKA, x.duvarIc)
    kutuDik(1.35, 14.3, TABAN + SOFA_H, UST0, REVAK_ARKA - 0.02, REVAK_ARKA, x.duvarIc)
  }
  // Giriş dehlizi ve eyvan kemerleri
  k.ekle(cikar(kemerUstu(3.4, 3.8, 1.7, UST0), 0.5, SAD.z0 - 0.5), x.duvarIc)
  k.ekle(cikar(kemerUstu(3.4, 3.8, 1.5, UST0), 0.4, GIRIS_HOL.z1), x.duvarIc)
  const YZ = (YESIK.z0 + YESIK.z1) / 2, YW = YESIK.z1 - YESIK.z0
  for (const s of [-1, 1]) {
    k.ekle(zDuzlem(cikar(kemerUstu(YW, 4.2, 2.9, UST0), 0.5), s > 0 ? 6 : -5.5, YZ), x.duvarIc)
    k.ekle(zDuzlem(cikar(kemerUstu(YW, 4.6, 2.75, UST0), 7), s > 0 ? 13 : -6, YZ), x.tavan)
  }

  // Şadırvanlı mekân: üst kat duvarı, pandantif, iç kubbe, fener açıklığı
  kCati.ekle(pandantifG(0, SAD_Z, SAD.x0, SAD.x1, SAD.z0, SAD.z1, 11.4, 13.3, 5.45), x.tavan)
  {
    const prof: [number, number][] = []
    for (let t = 0; t <= 16; t++) {
      const a = (t / 16) * Math.PI / 2, r = 5.45 * Math.cos(a)
      if (r < 0.55) break
      prof.push([r, 2.72 * Math.sin(a)])
    }
    kKubbe.ekle(ustenUV(yer(dondurG(prof, 64, [1, 1]), 0, 13.3, SAD_Z), 0, SAD_Z, 5.45), x.gobek)
    kKubbe.ekle(new THREE.CircleGeometry(0.8, 16).rotateX(Math.PI / 2).translate(0, 13.3 + 2.8, SAD_Z), m.gok)
    // Kubbe kuşağı
    kKubbe.ekle(new THREE.TorusGeometry(5.45, 0.08, 6, 48).rotateX(Math.PI / 2).translate(0, 13.3, SAD_Z), m.altinKoyu)
  }
  // Kuşak bordürü (s. 88)
  const kusak = (x0: number, x1: number, z0: number, z1: number, y: number, kv: Kova, h = 0.32) => {
    const g = Math.abs(x1 - x0) > Math.abs(z1 - z0)
    kv.ekle(yer(kutuG(g ? x1 - x0 : 0.04, h, g ? 0.04 : z1 - z0), (x0 + x1) / 2, y, (z0 + z1) / 2), x.bordur)
  }
  kusak(SAD.x0, SAD.x1, SAD.z0 + 0.02, SAD.z0 + 0.02, 11.05, kUst, 0.45)
  kusak(SAD.x0, SAD.x1, SAD.z1 - 0.02, SAD.z1 - 0.02, 11.05 + 3, kUst, 0.01)
  for (const s of [-1, 1]) kusak(s * 5.48, s * 5.48, SAD.z0, SAD.z1, 11.05, kUst, 0.45)
  // İkişer pencere: yan koridorlar orta mekâna açılır (s. 93)
  const icPencere = (px: number, pz: number, ry: number, y0: number, g: number, duz: number, kv: Kova, kemerH = 0.6) => {
    const ek = (geo: THREE.BufferGeometry, mal: Mal) => kv.ekle(yer(geo, px, 0, pz, ry), mal)
    ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, g, duz, kemerH), 8).translate(0, 0, 0.025), x.pencereIsik)
    const s = kemer(new THREE.Shape(), 0, y0 - 0.1, g + 0.34, duz + 0.1, kemerH + 0.2)
    s.holes.push(kemer(new THREE.Path(), 0, y0, g, duz, kemerH))
    ek(cikar(s, 0.05, 0.01), x.krem)
  }
  for (const s of [-1, 1]) for (const z of [-4, 2.8]) icPencere(s * 5.49, z, -s * Math.PI / 2, 8.8, 0.75, 1, kUst)
  // Yan eyvanlar: uç pencere, perde motifli güney duvar
  for (const s of [-1, 1]) {
    icPencere(s * 12.97, YZ, -s * Math.PI / 2, tb + 2.2, 1, 1.5, k)
    const pg = new THREE.PlaneGeometry(2.1, 3.5).rotateY(Math.PI).translate(s * 9.6, tb + EYVAN_H + 1.85, YESIK.z1 - 0.02)
    k.ekle(pg, x.perde)
    // Kapısı kapalı tabhane odaları
    for (const z of [-5.6, 4.6]) {
      kutuDik(Math.min(s * 5.48, s * 5.5), Math.max(s * 5.48, s * 5.5), tb, tb + 2.3, z - 0.6, z + 0.6, x.kapi)
      kutuDik(Math.min(s * 5.47, s * 5.5), Math.max(s * 5.47, s * 5.5), tb + 2.3, tb + 2.5, z - 0.75, z + 0.75, m.mermer)
    }
  }
  // Harim tonozu ve pencereleri (s. 87, 90)
  const vaultZ = HARIM.z1 - HARIM.z0
  kUst.ekle(cikar(kemerUstu(9.5, 8, 5.2, SACAK_Y), vaultZ, HARIM.z0), x.tavan)
  for (const s of [-1, 1]) {
    for (const z of [10.2, 15.2]) icPencere(s * 4.73, z, -s * Math.PI / 2, tb + HARIM_H + 1.1, 0.95, 2, k, 0.7)
    icPencere(s * 4.73, 12.7, -s * Math.PI / 2, 9.1, 0.8, 1.2, kUst)
    kusak(s * 4.74, s * 4.74, HARIM.z0, HARIM.z1, 7.95, kUst, 0.32)
    for (const z of [8.6, 11.4, 14, 17]) k.ekle(new THREE.CircleGeometry(0.42, 20).rotateY(-s * Math.PI / 2).translate(s * 4.72, 6.3, z), x.levha)
  }
  kusak(-4.75, 4.75, HARIM.z1 - 0.02, HARIM.z1 - 0.02, 7.95, kUst, 0.32)
  icPencere(0, HARIM.z1 - 0.03, Math.PI, 10.1, 0.95, 1.1, kUst, 0.7)

  // Mihrap: çerçeve, mukarnas (dokuz sıra, s. 90), ortada yazısız kandil motifi
  {
    const Y0 = tb + HARIM_H, S = Y0 + 3, NH = 2.4, O = NIS.x1
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(g.rotateY(Math.PI).translate(0, 0, HARIM.z1), mal)
    const c = new THREE.Shape()
    c.moveTo(-3.4, Y0); c.lineTo(-3.4, 8.2); c.quadraticCurveTo(-3.4, 10, 0, 10.6); c.quadraticCurveTo(3.4, 10, 3.4, 8.2); c.lineTo(3.4, Y0); c.closePath()
    c.holes.push(kemer(new THREE.Path(), 0, Y0 + 0.02, O * 2, S - Y0 - 0.02, NH))
    const cg = cikar(c, 0.12)
    uvSigdir(cg)
    ek(cg, x.mihrapCerceve)
    // Niş sırtı ve yanları
    k.ekle(new THREE.PlaneGeometry(O * 2, S - Y0 + 0.1).rotateY(Math.PI).translate(0, (S + Y0) / 2, NIS.z1 - 0.02), x.kavsaraAlti)
    for (const s of [-1, 1]) {
      k.ekle(new THREE.PlaneGeometry(NIS.z1 - NIS.z0, S - Y0 + 2.4).rotateY(-s * Math.PI / 2).translate(s * (O - 0.01), (S + Y0 + 2.4) / 2, (NIS.z0 + NIS.z1) / 2), x.haliKirmizi)
      k.ekle(yer(dondurG([[0.16, 0], [0.09, 1.5], [0.16, 2.95]], 10), s * (O - 0.2), Y0, NIS.z0 + 0.25), m.altinKoyu)
    }
    // Mukarnas
    const KADEME = 9, H = NH / KADEME, D = NIS.z1 - NIS.z0
    for (let i = 0; i < KADEME; i++) {
      const o = 1 - i / KADEME
      const g = (O * 2 - 0.04) * Math.pow(o, 0.75), dr = D * o, y = S + i * H
      kutuDik(-g / 2, g / 2, y, y + H * 0.92, NIS.z1 - dr, NIS.z1, m.altinKoyu)
      const n = Math.max(1, Math.floor(g / 0.52)), adim = g / n
      for (let j = 0; j < n; j++) {
        const hx = -g / 2 + (j + 0.5) * adim
        const h = new THREE.SphereGeometry(adim * 0.46, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)
        h.scale(1, (H * 0.86) / (adim * 0.46), 0.5).rotateY(Math.PI).translate(hx, y + 0.01, NIS.z1 - dr)
        k.ekle(h, m.altin)
      }
    }
    kutuDik(-O, O, S + NH, UST0, NIS.z0, NIS.z1, x.duvarIc)
  }
  // Minber: ahşap, kabartma geometrik yüzlü; alınlıkta ışınsal göbek (s. 91). Biçim temsilîdir.
  {
    const mx = MINBER.x, EN = MINBER.en, z0 = MINBER.z0, z1 = MINBER.z1, y0 = tb + HARIM_H, y1 = tb + MINBER.h1
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(g.rotateY(-Math.PI / 2).translate(mx, 0, 0), mal)
    const yan = new THREE.Shape()
    yan.moveTo(z0 - 0.5, y0); yan.lineTo(MINBER.zSon, y0); yan.lineTo(MINBER.zSon, y1 + 1.2); yan.lineTo(z1, y1 + 1.2); yan.lineTo(z0 + 0.2, y0 + 1.05); yan.lineTo(z0 - 0.5, y0 + 1.05); yan.closePath()
    for (const s of [-1, 1]) ek(cikar(yan, 0.1, s * (EN / 2) - 0.05 + s * 0.05), m.kundekari)
    const ADIM = 12
    for (let i = 0; i < ADIM; i++) {
      const a = z0 + (i / ADIM) * (z1 - z0), b = z0 + ((i + 1) / ADIM) * (z1 - z0)
      kutuDik(mx - EN / 2, mx + EN / 2, y0, y0 + ((i + 1) / ADIM) * (y1 - y0), a, b, x.haliKirmizi)
    }
    // Köşk ve külah
    kutuDik(mx - EN / 2 - 0.1, mx + EN / 2 + 0.1, y1, y1 + 2.5, z1, z1 + 1.6, m.kundekari)
    kutuDik(mx - EN / 2 + 0.1, mx + EN / 2 - 0.1, y1 + 0.1, y1 + 2.2, z1 - 0.02, z1, x.gergi)
    k.ekle(yer(duzGolge(silindirG(0.05, 1.2, 1.5, 4).rotateY(Math.PI / 4)), mx, y1 + 3.25, z1 + 0.8), m.kundekari)
    k.ekle(yer(dondurG([[0.08, 0], [0.04, 0.2], [0.1, 0.35], [0.02, 0.65], [0, 0.7]], 8), mx, y1 + 4, z1 + 0.8), m.altin)
    // Kapı: iki söve, lento ve alınlık
    for (const s of [-1, 1]) kutuDik(mx + s * (EN / 2) - 0.1, mx + s * (EN / 2) + 0.1, y0, y0 + 2.6, z0 - 0.5, z0, m.kundekari)
    kutuDik(mx - EN / 2 - 0.1, mx + EN / 2 + 0.1, y0 + 2.6, y0 + 3.2, z0 - 0.5, z0, m.kundekari)
    k.ekle(new THREE.CircleGeometry(0.25, 16).rotateY(Math.PI).translate(mx, y0 + 2.9, z0 - 0.51), x.levha)
  }
  // Kürsü: sade ahşap (s. 91)
  kutuDik(2.6, 3.8, tb + HARIM_H, tb + HARIM_H + 0.9, 15.2, 16.4, x.kapi)
  kutuDik(2.55, 3.85, tb + HARIM_H + 0.9, tb + HARIM_H + 1, 15.15, 16.45, x.gergi)

  // Müezzin mahfili: batı eyvanında ahşap platform; basamaklar kuzeyden
  {
    const y = tb + MAHFIL.h
    kutuDik(MAHFIL.x0, MAHFIL.x1, y - 0.16, y, MAHFIL.z0, MAHFIL.z1, x.kapi)
    for (const px of [MAHFIL.x0 + 0.12, MAHFIL.x1 - 0.12]) for (const pz of [MAHFIL.z0 + 0.1, MAHFIL.z1 - 0.1]) kutuDik(px - 0.09, px + 0.09, tb + EYVAN_H, y - 0.16, pz - 0.09, pz + 0.09, x.gergi)
    const ADIM = 7
    for (let i = 0; i < ADIM; i++) {
      const a = MAHFIL.merdZ0 + (i / ADIM) * (MAHFIL.z0 - MAHFIL.merdZ0), b = MAHFIL.merdZ0 + ((i + 1) / ADIM) * (MAHFIL.z0 - MAHFIL.merdZ0)
      kutuDik(MAHFIL.merdX0, MAHFIL.merdX1, tb + EYVAN_H, tb + EYVAN_H + ((i + 1) / ADIM) * (MAHFIL.h - EYVAN_H), a, b, x.kapi)
    }
    // Korkuluk: alçak ahşap, kenardan düşmeyi yürüme denetimi engeller
    kutuDik(MAHFIL.x0, MAHFIL.merdX0, y + 0.72, y + 0.8, MAHFIL.z0 - 0.04, MAHFIL.z0 + 0.04, x.gergi)
    kutuDik(MAHFIL.merdX1 - 0.04, MAHFIL.merdX1 + 0.04, y + 0.72, y + 0.8, MAHFIL.z0, MAHFIL.z1, x.gergi)
    for (let z = MAHFIL.z0; z <= MAHFIL.z1; z += 0.4) kutuDik(MAHFIL.merdX1 - 0.02, MAHFIL.merdX1 + 0.02, y, y + 0.72, z - 0.02, z + 0.02, x.gergi)
    for (let px = MAHFIL.x0; px <= MAHFIL.merdX0; px += 0.4) kutuDik(px - 0.02, px + 0.02, y, y + 0.72, MAHFIL.z0 - 0.02, MAHFIL.z0 + 0.02, x.gergi)
  }

  // Şadırvan: altıgen mermer hazne ve fıskiye; basamaklı mermer zemin (s. 88 ve fotoğraf)
  {
    const cz = SAD_Z, ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, cz), mal)
    ek(duzGolge(silindirG(3.1, 3.2, 0.1, 6)).translate(0, tb + 0.05, 0), m.icMermer)
    ek(duzGolge(silindirG(2.3, 2.4, 0.12, 6).rotateY(Math.PI / 6)).translate(0, tb + 0.14, 0), m.icMermer)
    ek(duzGolge(silindirG(1.5, 1.42, 0.92, 6)).translate(0, tb + 0.66, 0), m.icMermer)
    ek(duzGolge(dondurG([[1.34, 0], [1.34, 0.08], [1.56, 0.08], [1.56, 0]], 6)).translate(0, tb + 1.1, 0), m.mermer)
    ek(silindirG(1.34, 1.34, 0.02, 24).translate(0, tb + 1.12, 0), m.su)
    ek(dondurG([[0.3, 0], [0.1, 0.34], [0.34, 0.5], [0.08, 0.68], [0.12, 0.9], [0.02, 1.1], [0, 1.12]], 14).translate(0, tb + 1.1, 0), m.icMermer)
  }

  // Avizeler ve kandiller
  const halkaAvize = (cx: number, cz: number, y: number, tepe: number, R: number) => {
    k.ekle(new THREE.TorusGeometry(R, 0.03, 6, 28).rotateX(Math.PI / 2).translate(cx, y, cz), m.altin)
    k.ekle(new THREE.TorusGeometry(R * 0.5, 0.025, 6, 20).rotateX(Math.PI / 2).translate(cx, y + 0.5, cz), m.altin)
    k.ekle(yer(silindirG(0.015, 0.015, tepe - y, 4), cx, (tepe + y) / 2, cz), x.gergi)
    for (let n = 0; n < 4; n++) {
      const a = n * Math.PI / 2 + Math.PI / 4, ax = cx + Math.sin(a) * R, az = cz + Math.cos(a) * R
      const u = Math.hypot(ax - cx, 2.1, az - cz)
      const ip = new THREE.CylinderGeometry(0.012, 0.012, u, 4)
      ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(cx - ax, 2.1, cz - az).normalize()))
      k.ekle(ip.translate((ax + cx) / 2, y + 1.05, (az + cz) / 2), x.gergi)
    }
    for (let n = 0; n < 12; n++) {
      const a = (n / 12) * Math.PI * 2, lx = cx + Math.sin(a) * R, lz = cz + Math.cos(a) * R
      k.ekle(new THREE.SphereGeometry(0.075, 6, 5).translate(lx, y - 0.16, lz), m.lamba)
      for (const [rx, ry] of [[0, 0], [0, Math.PI / 2]]) k.ekle(new THREE.PlaneGeometry(0.7, 0.7).rotateX(rx).rotateY(ry).translate(lx, y - 0.16, lz), m.lambaHale)
    }
  }
  halkaAvize(0, SAD_Z, 6.2, 16, 2.1)
  // Harimde büyük pirinç fener (fotoğrafa göre)
  {
    const cz = 12.4, y = 7.2
    k.ekle(yer(silindirG(0.012, 0.012, 5.6, 4), 0, 10.6, cz), x.gergi)
    k.ekle(yer(dondurG([[0.1, 0], [0.35, 0.1], [0.5, 0.5], [0.34, 1.2], [0.1, 1.5], [0, 1.6]], 8), 0, y - 1.5, cz), x.fener)
    for (let n = 0; n < 8; n++) k.ekle(yer(kutuG(0.03, 1.5, 0.03).translate(0, y - 0.8, 0.5), 0, 0, cz, (n * Math.PI) / 4), m.altinKoyu)
  }
  // Merdiven ve revak duvar lambaları
  for (const s of [-1, 1]) {
    k.ekle(new THREE.SphereGeometry(0.1, 8, 6).translate(s * (MERDIVEN.x1 - 0.1), 5, -15), m.lamba)
    k.ekle(new THREE.SphereGeometry(0.1, 8, 6).translate(s * 8, 3.8, REVAK_ARKA - 0.14), m.lamba)
  }
  void REVAK_H
}

/** Eklenen geometriyi önce dönüştüren ince sarmalayıcı: yan cephe kemerleri için. */
class KovaYonlendir {
  private kova: Kova
  private don: (g: THREE.BufferGeometry) => THREE.BufferGeometry
  constructor(kova: Kova, don: (g: THREE.BufferGeometry) => THREE.BufferGeometry) { this.kova = kova; this.don = don }
  ekle(g: THREE.BufferGeometry, m: Mal) { this.kova.ekle(this.don(g), m) }
}
