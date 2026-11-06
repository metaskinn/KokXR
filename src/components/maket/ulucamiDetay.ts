// Ulu Camii maketinin ayrıntıları: kapılar, hat levhaları, paye yazıları, Kur'an dolapları, mahfil, kürsü.
// Kapıların ve şadırvanın ekseni, mahfilin sekiz sütunu ve kürsünün biçimi Kültür Portalı metninden;
// levha ve paye yazıları arşiv fotoğraflarının perspektifi düzeltilmiş kırpımlarıdır (scripts/levha_kirp.py).
// Levhaların hangi yüzde durduğu temsilîdir: yazılar gerçek ama konumları bire bir değildir.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../data/acikYayin'
import { kibleDuvari } from './ulucami/mihrap'
import type { UlucamiMalzemeleri } from './ulucamiDokular'
import {
  DUVAR, Kova, type Mal, SADIRVAN_SATIR, SADIRVAN_SUTUN, SATIR, SUTUN, YX, YZ,
  cikar, dikdortgen, dondurG, kemer, kutuG, px, pz, silindirG, yer,
} from './ulucamiParca'

const ZEMIN = 0.7
const sx = px(SADIRVAN_SUTUN + 0.5), sz = pz(SADIRVAN_SATIR + 0.5)
const MIHRAP_Z = YZ - DUVAR

export const MAHFIL = { x: sx, z: pz(2.5) - 1, enX: 3.1, enZ: 2.1 }
export const KURSU = { x: px(3) - 2.1, z: pz(3), r: 1.05 }

/** Şadırvan merkezinde birleşen kapı eksenleri: doğu ve batı kapıları şadırvanın z hizasındadır. */
export const KAPI_Z = sz

type Ekle = (g: THREE.BufferGeometry, m: Mal) => void

/** Oyma panolu, kabaralı, halkalı iki kanat. +z yüzü dışa bakar. */
export function kapiKanatlari(ek: Ekle, m: UlucamiMalzemeleri, w: number, y0: number, h: number, z: number) {
  const SIRA = 3
  for (const s of [-1, 1]) {
    const kx = s * (w / 4), kw = w / 2 - 0.03
    ek(kutuG(kw, h, 0.12).translate(kx, y0 + h / 2, z), m.ceviz)
    const pw = kw - 0.3, ph = (h - 0.2 * (SIRA + 1)) / SIRA
    for (let i = 0; i < SIRA; i++) {
      const py = y0 + 0.2 + ph / 2 + i * (ph + 0.2)
      ek(kutuG(pw, ph, 0.03).translate(kx, py, z + 0.07), m.kundekari)
      // Pano çerçevesi
      for (const u of [-1, 1]) {
        ek(kutuG(pw + 0.1, 0.05, 0.05).translate(kx, py + u * (ph / 2 + 0.025), z + 0.08), m.altinKoyu)
        ek(kutuG(0.05, ph, 0.05).translate(kx + u * (pw / 2 + 0.025), py, z + 0.08), m.altinKoyu)
      }
    }
    for (let i = 0; i <= SIRA; i++) for (let j = 0; j < 4; j++) {
      const ky = y0 + 0.1 + i * (ph + 0.2)
      ek(new THREE.SphereGeometry(0.03, 6, 4).translate(kx - pw / 2 + j * (pw / 3), ky, z + 0.07), m.bronz)
    }
    ek(new THREE.TorusGeometry(0.1, 0.016, 6, 16).translate(s * 0.2, y0 + h * 0.48, z + 0.09), m.bronz)
    ek(new THREE.SphereGeometry(0.045, 8, 5).translate(s * 0.2, y0 + h * 0.48 + 0.1, z + 0.08), m.bronz)
  }
  ek(kutuG(0.05, h, 0.03).translate(0, y0 + h / 2, z + 0.07), m.bronz)
}

/** Mermer çerçeveli, sivri alınlıklı yan kapı. Duvar yüzünde, +z yüzü dışa bakacak biçimde kurulur. */
function kapi(ek: Ekle, m: UlucamiMalzemeleri, y0: number, ic: boolean) {
  const G = 3.9, ACIK = 2.6, KAPI_H = 3.5, DER = 0.55, UST = y0 + KAPI_H + 2.1
  const cerceve = dikdortgen(-G / 2, y0, G / 2, UST)
  cerceve.holes.push(kemer(new THREE.Path(), 0, y0 + 0.01, ACIK, KAPI_H, 1.25))
  ek(cikar(cerceve, DER), m.mermer)
  // İç içe silmeler
  const silme = (g: number, y1: number, t: number) => {
    const s = dikdortgen(-g / 2, y0 + 0.02, g / 2, y1)
    s.holes.push(dikdortgen(-g / 2 + t, y0 + 0.03, g / 2 - t, y1 - t) as unknown as THREE.Path)
    ek(cikar(s, 0.07, DER), ic ? m.koyu : m.mermer)
  }
  silme(G, UST, 0.14)
  silme(G - 0.5, UST - 0.25, 0.08)
  const halka = new THREE.Shape()
  kemer(halka, 0, y0 + 0.01, ACIK + 0.42, KAPI_H, 1.55)
  halka.holes.push(kemer(new THREE.Path(), 0, y0 + 0.01, ACIK, KAPI_H, 1.25))
  ek(cikar(halka, 0.06, DER), ic ? m.altinKoyu : m.tas)
  ek(kutuG(ACIK, KAPI_H + 1.4, 0.1).translate(0, y0 + (KAPI_H + 1.4) / 2, 0.05), m.koyu)
  // Alınlık: kafes ve taşıyıcı kiriş
  ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0 + KAPI_H, ACIK - 0.02, 0, 1.22), 10).translate(0, 0, 0.12), m.kafes)
  ek(kutuG(ACIK, 0.2, 0.3).translate(0, y0 + KAPI_H - 0.02, 0.2), m.mermer)
  kapiKanatlari(ek, m, ACIK - 0.06, y0 + 0.02, KAPI_H - 0.14, 0.18)
  // Söveler ve eşik
  for (const s of [-1, 1]) ek(kutuG(0.14, KAPI_H, DER).translate(s * (ACIK / 2 - 0.05), y0 + KAPI_H / 2, DER / 2), m.mermer)
  ek(kutuG(ACIK + 0.5, 0.12, DER + 0.25).translate(0, y0 + 0.06, DER / 2 + 0.1), m.mermer)
}

/** Fotoğraftan alınmış doku taşıyan malzeme. Tek yüzlüdür: arkadan bakınca yazı aynalanmış görünmez. */
function levhaDokulari() {
  const yukleyici = new THREE.TextureLoader()
  const malzeme = (ad: string) => {
    if (ACIK_YAYIN) return new THREE.MeshStandardMaterial({ color: '#c8b48a', roughness: 0.72, metalness: 0 })
    const t = yukleyici.load(`/gorseller/ulu-camii/maket/${ad}.jpg`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.72, metalness: 0 })
  }
  return {
    payeler: ['paye-1', 'paye-3', 'paye-5', 'paye-2', 'paye-6', 'paye-4'].map(malzeme),
    altin: malzeme('levha-altin'),
        madalyon: malzeme('madalyon'),
    kucuk: malzeme('levha-kucuk'),
  }
}

/** Çerçeveli duvar levhası: +z yüzü odaya bakar. */
function levha(ek: Ekle, m: UlucamiMalzemeleri, doku: Mal, g: number, h: number, cerceve: Mal = m.altinKoyu) {
  ek(kutuG(g + 0.24, h + 0.24, 0.08).translate(0, 0, 0.04), cerceve)
  ek(new THREE.PlaneGeometry(g, h).translate(0, 0, 0.09), doku)
}

export function ulucamiDetaylari(m: UlucamiMalzemeleri, k: Kova) {
  const d = levhaDokulari()
  const duvardan = (x: number, y: number, z: number, ry: number): Ekle => (g, mal) => {
    g.translate(0, y, 0)
    k.ekle(yer(g, x, 0, z, ry), mal)
  }

  // --- Paye yazıları: her payenin dört yüzüne, zemin yukarısına ---
  const YZ_G = 2.5, YZ_H = 4.55, YZ_Y = 4.9
  let sayac = 0
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++) for (let f = 0; f < 4; f++) {
    const a = f * Math.PI / 2
    const mal = d.payeler[(sayac++ * 5 + i) % d.payeler.length]
    k.ekle(yer(new THREE.PlaneGeometry(YZ_G, YZ_H).translate(0, YZ_Y, 1.515), px(i), 0, pz(j), a), mal)
    k.ekle(yer(kutuG(YZ_G + 0.12, 0.06, 0.05).translate(0, YZ_Y - YZ_H / 2 - 0.03, 1.52), px(i), 0, pz(j), a), m.koyu)
  }

  // --- Duvar levhaları (güney duvarı kuzeye, doğu duvarı batıya, batı duvarı doğuya bakar) ---
  // Kıble duvarı: mihrabın üstünde yeşil levha, yanlarında oval madalyonlar ve panolar (fotoğraflara göre)
  kibleDuvari(k, MIHRAP_Z, m)
  levha(duvardan(10.2, 4.85, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[3], 2.4, 4.27, m.ceviz)
  levha(duvardan(px(3.5), 9.25, MIHRAP_Z - 0.02, Math.PI), m, d.altin, 3.1, 3.2)
  levha(duvardan(px(3.5) + 3.4, 4.6, MIHRAP_Z - 0.02, Math.PI), m, d.kucuk, 3.2, 1.7, m.ahsap)
  levha(duvardan(-12.6, 4.6, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[0], 2.5, 4.81, m.ceviz)
  levha(duvardan(px(1.5) - 3.6, 4.7, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[4], 2.3, 4.6, m.ceviz)
  levha(duvardan(px(4.5), 4.7, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[2], 2.3, 4.6, m.ceviz)
  levha(duvardan(px(0.5), 4.7, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[1], 2.4, 4.6, m.ceviz)
  levha(duvardan(YX - DUVAR - 0.02, 8.9, pz(2.5), -Math.PI / 2), m, d.kucuk, 3.4, 1.8, m.ahsap)
  levha(duvardan(-YX + DUVAR + 0.02, 8.9, pz(2.5), Math.PI / 2), m, d.kucuk, 3.4, 1.8, m.ahsap)
  // Kâbe kapısının örtüsü: doğu kapısı tarafında yüksekçe, çerçevede öne eğik asılı (Kültür Portalı; görünüm temsilî)
  const kabeEk = duvardan(YX - DUVAR - 0.02, 8.9, pz(0.5), -Math.PI / 2)
  const egik: Ekle = (g, mal) => {
    g.rotateX(0.13)
    g.translate(0, 0, 0.42)
    kabeEk(g, mal)
  }
  const ortuG = 3.3, ortuH = 4.3
  const ortu = new THREE.PlaneGeometry(ortuG, ortuH, 44, 56)
  const op = ortu.attributes.position
  for (let i = 0; i < op.count; i++) {
    const ox = op.getX(i), oy = op.getY(i)
    // Üstte gergin, aşağı doğru artan dik kıvrımlar
    const serbest = 0.35 + 0.65 * (0.5 - oy / ortuH)
    op.setZ(i, serbest * (0.055 * Math.sin(ox * 5.2 + 0.6) + 0.028 * Math.sin(ox * 11.3 + oy * 0.7) + 0.012 * Math.sin(ox * 23 + oy * 2.2)))
  }
  ortu.computeVertexNormals()
  egik(ortu, m.kabeOrtusu)
  // Ceviz çerçeve ve altın kenar
  for (const s of [-1, 1]) {
    egik(kutuG(ortuG + 0.5, 0.2, 0.22).translate(0, s * (ortuH / 2 + 0.1), -0.02), m.ceviz)
    egik(kutuG(0.2, ortuH + 0.2, 0.22).translate(s * (ortuG / 2 + 0.15), 0, -0.02), m.ceviz)
    egik(kutuG(ortuG + 0.14, 0.045, 0.1).translate(0, s * (ortuH / 2 - 0.0), 0.1), m.altinKoyu)
    egik(kutuG(0.045, ortuH + 0.1, 0.1).translate(s * (ortuG / 2), 0, 0.1), m.altinKoyu)
    // Askı zincirleri
    kabeEk(silindirG(0.018, 0.018, 1.25, 5).rotateX(0.34).translate(s * 1.2, ortuH / 2 + 0.58, 0.28), m.bronz)
    kabeEk(new THREE.TorusGeometry(0.07, 0.016, 6, 12).rotateY(Math.PI / 2).translate(s * 1.2, ortuH / 2 + 1.2, 0.08), m.bronz)
  }
  egik(kutuG(ortuG + 0.5, 0.05, 0.3).translate(0, ortuH / 2 + 0.22, 0), m.altinKoyu)
  // Yuvarlak madalyonlar: kırpımın köşeleri görünmesin diye daire biçiminde
  for (const [x, z, ry] of [[-YX + DUVAR + 0.03, pz(0.5), Math.PI / 2], [px(2.5) - 8, -YZ + DUVAR + 0.03, 0], [px(2.5) + 8, -YZ + DUVAR + 0.03, 0]]) {
    const ek = duvardan(x, 9.6, z, ry)
    ek(new THREE.TorusGeometry(1.32, 0.09, 8, 40), m.altinKoyu)
    ek(new THREE.CircleGeometry(1.3, 40).translate(0, 0, 0.03), d.madalyon)
  }

  // --- Kapılar: kuzey içi, doğu ve batı (içte ve dışta) ---
  kapi(duvardan(0, 0, -YZ + DUVAR, 0), m, ZEMIN, true)
  for (const [x, ic, dis] of [[YX, -Math.PI / 2, Math.PI / 2], [-YX, Math.PI / 2, -Math.PI / 2]] as const) {
    const s = Math.sign(x)
    kapi(duvardan(x - s * DUVAR, 0, KAPI_Z, ic), m, ZEMIN, true)
    kapi(duvardan(x, 0, KAPI_Z, dis), m, 0.72, false)
    // Dış basamaklar
    for (let n = 0; n < 3; n++) {
      const der = (3 - n) * 0.75
      k.ekle(yer(kutuG(5.4 - n * 0.5, 0.24, der).translate(0, 0.12 + n * 0.24, der / 2 + 0.5), x, 0, KAPI_Z, dis), m.mermer)
    }
  }

  // --- Kur'an dolapları: payelerin kuzey ve güney yüzlerinin dibinde, ahşap raflı ---
  const dolap = (x: number, z: number, ry: number) => {
    const ek: Ekle = (g, mal) => k.ekle(yer(g, x, 0, z, ry), mal)
    const G = 2.7, YK = 1.55, D = 0.44, Y0 = ZEMIN + 0.05, RAF = 3, BOL = 6
    ek(kutuG(G, YK, 0.06).translate(0, Y0 + YK / 2, 1.53), m.ahsap)
    for (const s of [-1, 1]) ek(kutuG(0.07, YK, D).translate(s * (G / 2 - 0.035), Y0 + YK / 2, 1.5 + D / 2), m.ceviz)
    for (let r = 0; r <= RAF; r++) ek(kutuG(G, 0.06, D).translate(0, Y0 + r * (YK - 0.06) / RAF + 0.03, 1.5 + D / 2), m.ceviz)
    for (let b = 1; b < BOL; b++) ek(kutuG(0.035, YK - 0.06, D - 0.04).translate(-G / 2 + b * G / BOL, Y0 + YK / 2, 1.5 + D / 2), m.ceviz)
    // Taç silme
    ek(kutuG(G + 0.12, 0.09, D + 0.08).translate(0, Y0 + YK + 0.04, 1.5 + D / 2), m.altinKoyu)
  }
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++) {
    dolap(px(i), pz(j), 0)
    dolap(px(i), pz(j), Math.PI)
  }

  // --- Müezzin mahfili: sekiz ahşap sütun, korkuluklu platform, merdiven (Kültür Portalı: sekiz sütun) ---
  const { x: mx, z: mz, enZ } = MAHFIL
  const PLATFORM_Y = ZEMIN + 3.5
  const sutun: [number, number][] = [[0.16, 0], [0.11, 0.25], [0.09, 0.45], [0.09, 2.2], [0.13, 2.45], [0.09, 2.7], [0.11, 3.2], [0.18, 3.5]]
  for (const a of [-3.1, -1.03, 1.03, 3.1]) for (const b of [-enZ, enZ])
    k.ekle(yer(dondurG(sutun, 12), mx + a, ZEMIN, mz + b), m.ceviz)
  k.ekle(yer(kutuG(6.9, 0.22, 4.8), mx, PLATFORM_Y + 0.11, mz), m.ceviz)
  k.ekle(yer(kutuG(7.05, 0.08, 4.95), mx, PLATFORM_Y + 0.26, mz), m.altinKoyu)
  k.ekle(yer(kutuG(6.7, 0.04, 4.6), mx, PLATFORM_Y - 0.02, mz), m.kundekari)
  const korkulukY = PLATFORM_Y + 0.3
  const parmaklik = (x0: number, z0: number, x1: number, z1: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0), adet = Math.round(L / 0.3)
    for (let n = 0; n <= adet; n++) {
      const t = n / adet
      k.ekle(yer(dondurG([[0.03, 0], [0.05, 0.15], [0.025, 0.35], [0.05, 0.55], [0.03, 0.72]], 6), x0 + (x1 - x0) * t, korkulukY, z0 + (z1 - z0) * t), m.ceviz)
    }
    const a = Math.atan2(x1 - x0, z1 - z0)
    k.ekle(yer(kutuG(0.09, 0.07, L + 0.09), (x0 + x1) / 2, korkulukY + 0.76, (z0 + z1) / 2, a), m.ahsap)
  }
  parmaklik(mx - 3.4, mz + 2.35, mx + 3.4, mz + 2.35)
  parmaklik(mx - 3.4, mz - 2.35, mx + 1.9, mz - 2.35)
  parmaklik(mx - 3.4, mz - 2.35, mx - 3.4, mz + 2.35)
  parmaklik(mx + 3.4, mz - 2.35, mx + 3.4, mz + 2.35)
  // Kuzeydoğu köşesinden inen merdiven
  const ADIM = 12, merdivenX = mx + 2.65, merdivenBoy = 4.4
  for (let n = 0; n < ADIM; n++) {
    const y = ZEMIN + (n + 1) * (3.56 / ADIM), z = mz - 2.4 - merdivenBoy + (n + 0.5) * (merdivenBoy / ADIM)
    k.ekle(yer(kutuG(1.2, 0.06, merdivenBoy / ADIM + 0.05), merdivenX, y, z), m.ceviz)
    k.ekle(yer(kutuG(1.2, y - ZEMIN - 0.02, 0.03), merdivenX, ZEMIN + (y - ZEMIN) / 2, z + merdivenBoy / ADIM / 2), m.ahsap)
  }
  for (const s of [-1, 1]) {
    const yan = new THREE.Shape()
    yan.moveTo(0, ZEMIN); yan.lineTo(merdivenBoy, ZEMIN + 3.56); yan.lineTo(merdivenBoy, ZEMIN + 4.3); yan.lineTo(0, ZEMIN + 0.74); yan.closePath()
    const g = cikar(yan, 0.08, -0.04).rotateY(-Math.PI / 2).translate(merdivenX + s * 0.62, 0, mz - 2.4 - merdivenBoy)
    k.ekle(g, m.ceviz)
  }

  // --- Vaaz kürsüsü: mahfilin karşısındaki ayağa yerleştirilmiş yuvarlak, tek parça mermer ---
  const { x: kuX, z: kuZ, r: kuR } = KURSU
  const kursu: [number, number][] = [[1.1, 0], [1.1, 0.3], [0.86, 0.5], [0.72, 0.9], [0.68, 1.3], [0.92, 1.75], [1.12, 2.05], [1.12, 2.15], [1, 2.2], [1, 3.1], [1.1, 3.14], [1.1, 3.26], [0.96, 3.26], [0.96, 2.2], [0.1, 2.2]]
  // Üst duvarın kuzeyi açık: basamaklardan çıkılan giriş.
  const GIRIS = 1.1
  const kursuAlt = kursu.slice(0, 8)
  k.ekle(yer(dondurG(kursuAlt, 32), kuX, ZEMIN, kuZ), m.icMermer)
  k.ekle(yer(dondurG([[1, 2.2], [0.1, 2.2]], 32), kuX, ZEMIN, kuZ), m.icMermer)
  const kursuUst = new THREE.LatheGeometry(kursu.slice(8, 14).map(([r, y]) => new THREE.Vector2(r, y)), 32, Math.PI + GIRIS / 2, Math.PI * 2 - GIRIS)
  k.ekle(yer(kursuUst, kuX, ZEMIN, kuZ), m.icMermer)
  k.ekle(yer(new THREE.TorusGeometry(0.71, 0.025, 6, 32).rotateX(Math.PI / 2), kuX, ZEMIN + 1.3, kuZ), m.altinKoyu)
  for (const y of [2.55, 2.85]) k.ekle(yer(new THREE.TorusGeometry(1.02, 0.025, 6, 32, Math.PI * 2 - GIRIS).rotateZ(-Math.PI / 2 + GIRIS / 2).rotateX(Math.PI / 2), kuX, ZEMIN + y, kuZ), m.altinKoyu)
  // Payeye bağlayan basamaklar
  for (let n = 0; n < 6; n++) {
    k.ekle(yer(kutuG(0.8, 0.34, 0.5), kuX, ZEMIN + 0.17 + n * 0.34, kuZ - kuR - 1.6 + n * 0.32), m.icMermer)
    k.ekle(yer(kutuG(0.8, n * 0.34 + 0.02, 0.5), kuX, ZEMIN + (n * 0.34) / 2, kuZ - kuR - 1.6 + n * 0.32), m.mermerKoyu)
  }

  // --- Şadırvan: on altı köşeli havuzun her yüzünde bir musluk, fıskiyeden inen sekiz kol ---
  for (let n = 0; n < 16; n++) {
    const a = (n + 0.5) * Math.PI / 8
    k.ekle(yer(silindirG(0.05, 0.05, 0.2, 8).rotateX(Math.PI / 2).translate(0, ZEMIN + 0.68, 3.76), sx, 0, sz, a), m.altinKoyu)
    k.ekle(yer(new THREE.SphereGeometry(0.1, 8, 5).scale(1, 1, 0.45).translate(0, ZEMIN + 0.68, 3.68), sx, 0, sz, a), m.icMermer)
  }
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4
    k.ekle(yer(silindirG(0.035, 0.035, 0.05, 6).translate(0, ZEMIN + 2.01, 0.96), sx, 0, sz, a), m.altinKoyu)
  }

  // --- Ahşap sandıklar ve rahleler ---
  for (const [x, z] of [[sx - 4.3, sz - 4.3], [sx + 4.3, sz - 4.3], [sx - 4.3, sz + 4.3], [sx + 4.3, sz + 4.3]]) {
    k.ekle(yer(kutuG(0.8, 0.85, 0.52), x, ZEMIN + 0.53, z), m.ceviz)
    k.ekle(yer(kutuG(0.86, 0.06, 0.58), x, ZEMIN + 0.98, z), m.ahsap)
    k.ekle(yer(kutuG(0.66, 0.55, 0.02), x, ZEMIN + 0.55, z + (z < sz ? 0.27 : -0.27)), m.kundekari)
  }
  for (const [x, z] of [[-2.9, MIHRAP_Z - 2.9], [2.9, MIHRAP_Z - 2.9]]) {
    k.ekle(yer(kutuG(0.7, 0.05, 0.42).rotateX(-0.42), x, ZEMIN + 0.62, z), m.ceviz)
    for (const s of [-1, 1]) k.ekle(yer(kutuG(0.05, 0.62, 0.05).rotateX(s * 0.42), x + s * 0.28, ZEMIN + 0.31, z), m.ahsap)
  }
}
