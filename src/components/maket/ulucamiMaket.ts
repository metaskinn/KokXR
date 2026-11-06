// Ulu Camii temsili maketi. Plan ölçüleri ile kubbe ve paye düzeni envanterden (s. 44, 46, 60, 63);
// cephe, kasnak, kubbe, minare ve taç kapı biçimleri arşiv fotoğraflarına bakılarak yorumlanmıştır.
// Yükseklikler ve pencere sayıları temsilidir. Birim: metre. Kuzey = -z, kıble (güney) = +z, doğu = +x.
import * as THREE from 'three'
import { icPencereAlt, icPencereUst } from './ulucami/icduvar'
import { ulucamiCevresi } from './ulucami/cevre'
import { kapiKanatlari, ulucamiDetaylari } from './ulucamiDetay'
import { icZemini } from './ulucami/zemin'
import { ulucamiMalzemeleri } from './ulucamiDokular'
import { uluIsikMalzemeleri } from './ulucami/isik'
import { icDuraklar, icYurumeAlani, ulucamiIcMekani, type IcDurak, type IcYurume } from './ulucamiIc'
import {
  DOGU_BATI, DOSEME_Y, DUVAR, ETEK_Y, GOZ_X, GOZ_Z, H, KASNAK_TABAN, KUZEY_GUNEY, Kova, type Mal, OCTA,
  SADIRVAN_SATIR, SADIRVAN_SUTUN, SATIR, SUTUN, YX, YZ,
  cikar, dikdortgen, dondurG, duzGolge, gozAcikligi, gozOlcusu, kemer, kutuG, px, pz, silindirG, yer,
} from './ulucamiParca'

export interface MaketKatmani { grup: THREE.Group; yukseklik: number; ad: string }
export interface Maket {
  kok: THREE.Group; katmanlar: MaketKatmani[]; duraklar: IcDurak[]; yurume: IcYurume
  /** Verilmezse Ulu Camii ölçüsüne göre varsayılanlar kullanılır. */
  kamera?: { konum: [number, number, number]; hedef: [number, number, number] }
  kaideYaricap?: number
  icIsiklar?: [number, number, number][]
}

export function ulucamiMaketi(): Maket {
  const m = ulucamiMalzemeleri()
  uluIsikMalzemeleri(m)

  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()
  const kutu = (g: number, h: number, dd: number, mal: Mal, x: number, y: number, z: number, kv = k) =>
    kv.ekle(yer(kutuG(g, h, dd), x, y, z), mal)

  // --- Zemin: çevre ayrı modülde; bina tabanı ve halı burada ---
  const cevre = ulucamiCevresi(m, k)
  kutu(DOGU_BATI + 1, 0.6, KUZEY_GUNEY + 1, m.mermer, 0, 0.3, 0)
  icZemini(k, m)

  // --- Cephe: üç katman (dış taş + kemerli nişler, gövde, iç sıva) ve kafesli pencereler ---
  const cephe = (L: number, x: number, z: number, ry: number, ortaYok: 'hepsi' | 'alt' | 'yok', goz: number, adet: number, altYok = false) => {
    const dis = dikdortgen(-L / 2, 0, L / 2, H), govde = dikdortgen(-L / 2, 0, L / 2, H), ic = dikdortgen(-L / 2, 0, L / 2, H)
    const pencereler: THREE.BufferGeometry[] = []
    const ilk = -((adet - 1) / 2) * goz
    for (let i = 0; i < adet; i++) {
      const orta = i === (adet - 1) / 2
      if (orta && ortaYok === 'hepsi') continue
      // Kıble duvarının ortasında pencereler mihrabın üstünde ve yeşil levhanın iki yanındadır (fotoğraflara göre).
      const kibleOrtasi = orta && altYok
      for (const f of kibleOrtasi ? [-0.2, 0.2] : [-0.25, 0.25]) {
        const px = ilk + i * goz + f * goz
        const py = kibleOrtasi ? 1.8 : 0, duzD = kibleOrtasi ? 2.6 : 3.1, duzP = kibleOrtasi ? 2.2 : 2.3
        dis.holes.push(kemer(new THREE.Path(), px, 6.5 + py, 3.8, duzD, 1.9))
        govde.holes.push(kemer(new THREE.Path(), px, 7.2 + py, 2.2, duzP, 1.3))
        ic.holes.push(icPencereUst(k, m, px, py, kibleOrtasi, x, z, ry))
        const pencere = () => new THREE.ShapeGeometry(kemer(new THREE.Shape(), px, 7.2 + py, 2.2, duzP, 1.3), 12)
        k.ekle(yer(pencere().translate(0, 0, -1.1), x, 0, z, ry), m.kafes)
        kemerHalkasi(px, 6.5 + py, 4.4, duzD, kibleOrtasi ? 2.1 : 2.3, 3.8, 1.9, x, z, ry)
        k.ekle(yer(kutuG(2.7, 0.14, 0.75).translate(px, 7.15 + py, -0.32), x, 0, z, ry), m.mermer)
        if (altYok || (orta && ortaYok === 'alt')) continue
        dis.holes.push(kemer(new THREE.Path(), px, 1.5, 2.8, 1.9, 1.1))
        govde.holes.push(dikdortgen(px - 0.8, 2, px + 0.8, 4.1) as unknown as THREE.Path)
        ic.holes.push(icPencereAlt(k, m, px, x, z, ry))
        pencereler.push(new THREE.ShapeGeometry(dikdortgen(px - 0.8, 2, px + 0.8, 4.1)).translate(0, 0, -1.1))
        kemerHalkasi(px, 1.5, 3.3, 1.9, 1.4, 2.8, 1.1, x, z, ry)
        k.ekle(yer(kutuG(2.1, 0.12, 0.7).translate(px, 1.96, -0.3), x, 0, z, ry), m.mermer)
        for (const s of [-1, 1]) k.ekle(yer(kutuG(0.14, 2.2, 0.66).translate(px + s * 0.87, 3.05, -0.33), x, 0, z, ry), m.mermer)
        k.ekle(yer(kutuG(1.88, 0.16, 0.66).translate(px, 4.19, -0.33), x, 0, z, ry), m.mermer)
        pencereler.push(new THREE.ShapeGeometry(kemer(new THREE.Shape(), px, 4.3, 1.1, 0.05, 0.6), 8).translate(0, 0, 0.45))
      }
    }
    k.ekle(yer(cikar(dis, 0.65, -0.65), x, 0, z, ry), m.tas)
    k.ekle(yer(cikar(govde, 1.15, -1.8), x, 0, z, ry), m.tas)
    k.ekle(yer(cikar(ic, 0.2, -2), x, 0, z, ry), m.icDuvar)
    pencereler.forEach((p) => {
      k.ekle(yer(p.clone().translate(0, 0, -0.72), x, 0, z, ry), m.camKafes)
      k.ekle(yer(p, x, 0, z, ry), m.kafes)
    })
    // Kaide, ara silme ve saçak silmesi
    kutu2(L + 0.3, 1.3, 0.3, x, 0.65, z, ry, m.mermer)
    kutu2(L + 0.3, 0.28, 0.24, x, 6.05, z, ry, m.mermer)
    kutu2(L + 1, 0.55, 0.9, x, H - 0.1, z, ry, m.mermer)
    const disAdet = Math.floor(L / 0.85)
    for (let i = 0; i < disAdet; i++)
      k.ekle(yer(kutuG(0.3, 0.32, 0.24).translate(-L / 2 + (i + 0.5) * (L / disAdet), H - 0.52, 0.1), x, 0, z, ry), m.mermer)
  }
  /** Kemeri çeviren, duvardan hafif çıkıntılı tuğla-taş halka (fotoğraflardaki gibi). */
  const kemerHalkasi = (cx: number, y0: number, gDis: number, duz: number, kDis: number, gIc: number, kIc: number, x: number, z: number, ry: number) => {
    const s = kemer(new THREE.Shape(), cx, y0, gDis, duz, kDis)
    s.holes.push(kemer(new THREE.Path(), cx, y0, gIc, duz, kIc))
    k.ekle(yer(cikar(s, 0.1, 0), x, 0, z, ry), m.tugla)
  }
  const kutu2 = (g: number, h: number, dd: number, x: number, y: number, z: number, ry: number, mal: Mal) => {
    const b = kutuG(g, h, dd).translate(0, y, dd / 2 - 0.05)
    k.ekle(yer(b, x, 0, z, ry), mal)
  }
  cephe(DOGU_BATI, 0, -YZ, Math.PI, 'hepsi', GOZ_X, SUTUN)
  // Güney duvarının alt sıra pencereleri sonradan kapatılmıştır (Kültür Portalı).
  cephe(DOGU_BATI, 0, YZ, 0, 'alt', GOZ_X, SUTUN, true)
  cephe(KUZEY_GUNEY - DUVAR * 2, YX, 0, Math.PI / 2, 'yok', GOZ_Z, SATIR)
  cephe(KUZEY_GUNEY - DUVAR * 2, -YX, 0, -Math.PI / 2, 'yok', GOZ_Z, SATIR)

  // --- Taç kapı (kuzey cephesi): mermer blok, iç içe çerçeveler, sivri kemer, mukarnas, basamaklar ---
  const tacKapi = () => {
    const G = 12, EN = H + 1, DER = 1.9
    const parca = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, -YZ, Math.PI), mal)
    const blok = dikdortgen(-G / 2, 0, G / 2, EN)
    blok.holes.push(kemer(new THREE.Path(), 0, 0.5, 5.8, 6.7, 3.6))
    parca(cikar(blok, DER), m.mermer)
    parca(kutuG(5.8, 11, 0.2).translate(0, 5.5, 0.1), m.mermer)
    const cerceve = (g: number, y0: number, y1: number, t: number, z: number, mal: Mal) => {
      const s = dikdortgen(-g / 2, y0, g / 2, y1)
      s.holes.push(dikdortgen(-g / 2 + t, y0 + t, g / 2 - t, y1 - t) as unknown as THREE.Path)
      parca(cikar(s, 0.14, z), mal)
    }
    cerceve(11.2, 0.5, EN - 0.5, 0.42, DER, m.mermer)
    cerceve(9.9, 1.2, EN - 1.15, 0.28, DER, m.tas)
    cerceve(8.7, 7, EN - 1.8, 0.2, DER, m.mermer)
    const kemerBant = new THREE.Shape()
    kemer(kemerBant, 0, 7.1, 6.5, 0.1, 3.8)
    kemerBant.holes.push(kemer(new THREE.Path(), 0, 7.1, 5.8, 0.1, 3.3))
    parca(cikar(kemerBant, 0.14, DER), m.mermer)
    parca(kutuG(G + 0.9, 0.55, DER + 0.8).translate(0, EN - 0.1, (DER + 0.8) / 2 - 0.2), m.mermer)
    // Yan sövelerle daralan kapı boşluğu
    for (const s of [-1, 1]) parca(kutuG(1.15, 6.8, DER - 0.2).translate(s * 2.33, 3.9, (DER - 0.2) / 2 + 0.1), m.mermer)
    kapiKanatlari(parca, m, 3.5, 1.5, 5.3, 0.3)
    parca(kutuG(3.5, 0.3, 0.2).translate(0, 6.9, 0.35), m.altin)
    // Çerçevede baklava kabartma dizileri
    const baklava = (bx: number, by: number) => parca(new THREE.OctahedronGeometry(0.17, 0).scale(1, 1, 0.3).translate(bx, by, DER + 0.17), m.tas)
    for (let by = 1.7; by < EN - 1.6; by += 0.56) for (const s of [-1, 1]) baklava(s * 4.81, by)
    for (let bx = -4.4; bx <= 4.4; bx += 0.56) baklava(bx, EN - 1.42)
    // Mukarnas: yukarı doğru daralan kademeler ve her kademede küçük hücreler
    const KADEME = 11, SIRA_H = 3.5 / KADEME
    for (let i = 0; i < KADEME; i++) {
      const o = 1 - i / KADEME
      const g = 5.75 * Math.pow(o, 0.88), dr = 1.72 * o + 0.1, y = 7.25 + i * SIRA_H
      parca(kutuG(g, SIRA_H * 0.92, dr).translate(0, y, dr / 2 + 0.1), m.tas)
      const n = Math.max(1, Math.floor(g / 0.46))
      for (let j = 0; j < n; j++) {
        const x = -g / 2 + (j + 0.5) * (g / n)
        parca(kutuG(0.4, SIRA_H * 0.92, 0.03).translate(x, y, dr + 0.11), m.hucre)
        const hucre = new THREE.SphereGeometry(0.18, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2)
        hucre.scale(1, (SIRA_H * 0.85) / 0.18, 0.55)
        parca(hucre.translate(x, y - SIRA_H * 0.42, dr + 0.12), m.tas)
        parca(kutuG(0.06, SIRA_H * 0.8, 0.09).translate(x + (g / n) / 2, y - 0.02, dr + 0.14), m.mermer)
      }
    }
    // Basamaklar
    const ADIM = 5
    for (let i = 0; i < ADIM; i++) {
      const dr = (ADIM - i) * 1.05, y = (i + 1) * 0.28
      parca(kutuG(18 - i * 1.4, 0.28, dr).translate(0, y - 0.14, DER + dr / 2), m.mermer)
    }
  }
  tacKapi()

  // --- İç mekân: ayrı modülde ---
  ulucamiIcMekani(m, k, kCati, kKasnak, kKubbe)
  ulucamiDetaylari(m, k)

  // --- Çatı: kurşun döşeme ve etekler, her gözde dört yana eğimli kurşun kaide ---
  const YO = YX - 0.5, ZO = YZ - 0.5
  const doseme = dikdortgen(-YO, -ZO, YO, ZO)
  // Her gözün üstü açık: döşeme yalnız kemerlerin üzerinde kalır, içeriden kubbeler görünür.
  for (let i = 0; i < SUTUN; i++) for (let j = 0; j < SATIR; j++) {
    const { x0, x1, z0, z1 } = gozAcikligi(i, j)
    doseme.holes.push(dikdortgen(x0, -z1, x1, -z0) as unknown as THREE.Path)
  }
  kCati.ekle(new THREE.ShapeGeometry(doseme, 24).rotateX(-Math.PI / 2).translate(0, DOSEME_Y, 0), m.kursun)
  const SA = 1.5, altY = H + 0.35
  const etek = (x0: number, z0: number, x1: number, z1: number, x2: number, z2: number, x3: number, z3: number) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, altY, z0, x1, altY, z1, x2, DOSEME_Y, z2, x0, altY, z0, x2, DOSEME_Y, z2, x3, DOSEME_Y, z3], 3))
    const L = Math.hypot(x1 - x0, z1 - z0)
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L, 2, 0, 0, L, 2, 0, 2], 2))
    g.computeVertexNormals()
    kCati.ekle(g, m.kursun)
  }
  const ox = YX + SA, oz = YZ + SA
  etek(-ox, oz, ox, oz, YO, ZO, -YO, ZO)
  etek(ox, -oz, -ox, -oz, -YO, -ZO, YO, -ZO)
  etek(ox, oz, ox, -oz, YO, -ZO, YO, ZO)
  etek(-ox, -oz, -ox, oz, -YO, ZO, -YO, -ZO)
  for (const s of [-1, 1]) {
    kutu(DOGU_BATI + SA * 2 + 0.2, 0.3, 0.3, m.koyu, 0, altY - 0.05, s * oz, kCati)
    kutu(0.3, 0.3, KUZEY_GUNEY + SA * 2 + 0.2, m.koyu, s * ox, altY - 0.05, 0, kCati)
  }

  // --- Yirmi göz: kaide, sekizgen sarı kasnak + kafesli pencereler, kaburgalı kurşun kubbe ---
  for (let i = 0; i < SUTUN; i++) for (let j = 0; j < SATIR; j++) {
    const x = px(i + 0.5), z = pz(j + 0.5)
    const acik = i === SADIRVAN_SUTUN && j === SADIRVAN_SATIR
    const { kasnakH, kubbeH } = gozOlcusu(i)

    const kaide = duzGolge(new THREE.CylinderGeometry(7.9, 9.6, ETEK_Y, 4, 1, true).rotateY(Math.PI / 4))
    kCati.ekle(yer(kaide, x, DOSEME_Y + ETEK_Y / 2, z), m.kursun)
    const halka = dikdortgen(-5.65, -5.65, 5.65, 5.65)
    halka.holes.push(new THREE.Path().absarc(0, 0, 5.4, 0, Math.PI * 2, true))
    kCati.ekle(new THREE.ShapeGeometry(halka, 24).rotateX(-Math.PI / 2).translate(x, KASNAK_TABAN, z), m.kursun)

    const R = 6
    const kasnak = duzGolge(silindirG(R, R, kasnakH, 8, true).rotateY(Math.PI / 8))
    kKasnak.ekle(yer(kasnak, x, KASNAK_TABAN + kasnakH / 2, z), m.siva)
    kKasnak.ekle(yer(duzGolge(silindirG(R + 0.12, R + 0.12, 0.28, 8, true).rotateY(Math.PI / 8)), x, KASNAK_TABAN + 0.14, z), m.koyu)
    kKasnak.ekle(yer(duzGolge(silindirG(R + 0.28, R + 0.1, 0.26, 8, true).rotateY(Math.PI / 8)), x, KASNAK_TABAN + kasnakH - 0.13, z), m.krem)
    for (let n = 0; n < 8; n++) {
      const pilastr = kutuG(0.36, kasnakH - 0.3, 0.2).translate(0, KASNAK_TABAN + kasnakH / 2 - 0.1, R - 0.01)
      kKasnak.ekle(yer(pilastr, x, 0, z, Math.PI / 8 + n * Math.PI / 4), m.krem)
    }
    const yuz = R * OCTA + 0.04
    const pH = Math.min(0.95, kasnakH - 1.3)
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4
      const y0 = KASNAK_TABAN + (kasnakH - pH - 0.55) / 2
      const cerceveS = kemer(new THREE.Shape(), 0, y0 - 0.12, 1.45, pH + 0.12, 1)
      cerceveS.holes.push(kemer(new THREE.Path(), 0, y0, 1.12, pH, 0.8))
      const cerceve = cikar(cerceveS, 0.12, yuz)
      const kafes = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, 1.12, pH, 0.8), 8).translate(0, 0, yuz + 0.03)
      kKasnak.ekle(yer(cerceve, x, 0, z, a), m.krem)
      kKasnak.ekle(yer(kafes, x, 0, z, a), m.kafes)
    }

    // Kubbe: alta doğru açılan etek, sekizgen ağızdan yuvarlağa geçiş
    const kY = KASNAK_TABAN + kasnakH
    const profil: [number, number][] = [[6.75, -0.28], [6.35, 0], [5.85, 0.32]]
    const ACIK_R = 2.3
    for (let t = 0; t <= 16; t++) {
      const a = (t / 16) * Math.PI / 2
      const r = 5.65 * Math.pow(Math.cos(a), 0.86)
      if (acik && r < ACIK_R) break
      profil.push([r, 0.32 + kubbeH * Math.pow(Math.sin(a), 1.08)])
    }
    const DIKIS = 36, DIKIS_PARCA = 5
    const kubbe = dondurG(profil, DIKIS * DIKIS_PARCA, [1, 1])
    const kubbeUV = kubbe.attributes.uv
    const poz = kubbe.attributes.position
    for (let v = 0; v < poz.count; v++) {
      const vx = poz.getX(v), vy = poz.getY(v), vz = poz.getZ(v)
      const b = 1 - THREE.MathUtils.smoothstep(vy, 0, kubbeH * 0.34)
      const teta = Math.atan2(vx, vz)
      const parca = Math.PI / 4
      const fark = ((teta + Math.PI * 2 + parca / 2) % parca) - parca / 2
      const oran = b > 0 ? THREE.MathUtils.lerp(1, OCTA / Math.cos(fark) * 1.04, b) : 1
      const r = Math.hypot(vx, vz)
      const dikisVar = Math.round(kubbeUV.getX(v) * DIKIS * DIKIS_PARCA) % DIKIS_PARCA === 0
      const kabarti = dikisVar && r > 0.2 ? 1 + 0.07 / r : 1
      poz.setX(v, vx * oran * kabarti); poz.setZ(v, vz * oran * kabarti)
    }
    kubbe.computeVertexNormals()
    kKubbe.ekle(yer(kubbe, x, kY, z), m.kubbe)

    if (acik) {
      // Fotoğrafta açıklık bugün camla örtülüdür; metin ve kaynak "ortası açık" der.
      const sonR = profil[profil.length - 1][0], sonY = profil[profil.length - 1][1]
      kKubbe.ekle(yer(new THREE.TorusGeometry(sonR, 0.14, 8, 32).rotateX(Math.PI / 2), x, kY + sonY, z), m.koyu)
      const camG = dondurG([[sonR, 0], [sonR * 0.86, 0.5], [sonR * 0.5, 1], [0.01, 1.2]], 32, [1, 1])
      kKubbe.ekle(yer(camG, x, kY + sonY, z), m.cam)
      kKubbe.ekle(yer(dondurG([[0.1, 0], [0.04, 0.5], [0, 0.55]], 8), x, kY + sonY + 1.2, z), m.bronz)
    } else {
      const alem: [number, number][] = [[0.2, 0], [0.06, 0.14], [0.16, 0.32], [0.05, 0.52], [0.12, 0.66], [0.02, 1], [0, 1.08]]
      kKubbe.ekle(yer(dondurG(alem, 10), x, kY + 0.32 + kubbeH - 0.08, z), m.bronz)
    }
  }

  // --- Minareler: batıdaki mermer çok köşeli kaideli, doğudaki taş kare kaideli (fotoğraflara göre) ---
  const minare = (x: number, z: number, bati: boolean) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z), mal)
    let govdeTaban: number
    if (bati) {
      ek(duzGolge(silindirG(3.5, 3.5, 13, 8).translate(0, 6.5, 0)), m.mermer)
      ek(duzGolge(silindirG(3.56, 3.56, 0.5, 8).translate(0, 3.1, 0)), m.koyu)
      ek(duzGolge(silindirG(3.56, 3.56, 0.25, 8).translate(0, 4.0, 0)), m.koyu)
      ek(duzGolge(silindirG(2.3, 3.5, 1.6, 8).translate(0, 13.8, 0)), m.mermer)
      for (const y of [6.6, 9.8, 12.9]) ek(duzGolge(silindirG(3.62, 3.62, 0.2, 8).translate(0, y, 0)), m.mermer)
      govdeTaban = 14.5
    } else {
      ek(kutuG(6.8, 6, 6.8).translate(0, 3, 0), m.tas)
      ek(kutuG(7.3, 0.9, 7.3).translate(0, 0.45, 0), m.mermer)
      ek(duzGolge(silindirG(2.5, 4.8, 3.2, 4).rotateY(Math.PI / 4).translate(0, 7.6, 0)), m.tas)
      govdeTaban = 9.1
    }
    ek(dondurG([[2.35, govdeTaban], [2.05, 26.5]], 32), m.tugla)
    for (const y of [govdeTaban + 0.4, 18.5, 22]) ek(silindirG(2.3, 2.3, 0.28, 32).translate(0, y, 0), m.tas)
    // Şerefe altı: yukarı açılan kademeler ve küçük hücreler
    const KADEME = 5
    for (let t = 0; t < KADEME; t++) {
      const r = 2.1 + t * 0.2, y = 26.5 + t * 0.55
      ek(silindirG(r + 0.14, r, 0.55, 28).translate(0, y + 0.27, 0), m.tas)
      for (let a = 0; a < 20; a++) {
        const teta = (a + (t % 2) * 0.5) * (Math.PI * 2) / 20
        const hucre = new THREE.SphereGeometry(0.3, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 0.5)
        ek(hucre.translate(0, y + 0.02, r + 0.06).rotateY(teta), m.taskoyu)
      }
    }
    ek(silindirG(3.15, 3.15, 0.35, 32).translate(0, 29.5, 0), m.mermer)
    for (let a = 0; a < 28; a++) {
      const teta = a * (Math.PI * 2) / 28
      ek(kutuG(0.58, 1, 0.06).translate(0, 30.2, 3).rotateY(teta), m.kafes)
      ek(kutuG(0.09, 1.1, 0.09).translate(0.33, 30.22, 3).rotateY(teta), m.mermer)
    }
    ek(silindirG(3.08, 3.08, 0.14, 32, true).translate(0, 30.8, 0), m.mermer)
    ek(dondurG([[1.85, 29.7], [1.72, 37.8]], 28), m.tugla)
    ek(dondurG([[1.8, 37.6], [2.35, 38.05], [2.35, 38.3], [1.6, 38.55]], 28), m.mermer)
    ek(dondurG([[1.35, 38.5], [1.65, 39.1], [1.05, 39.8], [1.45, 40.5], [1.65, 41], [0.95, 41.8], [1.05, 42.2], [0.22, 43.6], [0.12, 44.1]], 24), m.taskoyu)
    ek(dondurG([[0.12, 44.1], [0.06, 44.4], [0.2, 44.7], [0.05, 45], [0.15, 45.3], [0.02, 46], [0, 46.1]], 10), m.bronz)
  }
  minare(-YX - 2.2, -YZ - 1.4, true)
  minare(YX + 2.2, -YZ - 1.4, false)

  // --- Kuzey avlusundaki iki şadırvan köşkü: sekiz direk, kemerli kuşak, soğan kubbe (fotoğrafa göre) ---
  const kosk = (x: number, z: number) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z), mal)
    ek(duzGolge(silindirG(4.3, 4.3, 0.25, 8).rotateY(Math.PI / 8).translate(0, 0.13, 0)), m.mermer)
    ek(duzGolge(silindirG(2.2, 2.2, 0.85, 8).rotateY(Math.PI / 8).translate(0, 0.65, 0)), m.mermer)
    ek(silindirG(2, 2, 0.05, 16).translate(0, 1.07, 0), m.su)
    const R = 3.7, kusakY = 2.9, ustY = 3.9
    const yuz = R * OCTA, gen = 2 * R * Math.sin(Math.PI / 8)
    for (let n = 0; n < 8; n++) {
      const a = Math.PI / 8 + n * Math.PI / 4
      ek(silindirG(0.17, 0.2, ustY - 0.25, 10).translate(R * Math.sin(a), (ustY - 0.25) / 2 + 0.25, R * Math.cos(a)), m.ahsap)
      const yon = n * Math.PI / 4
      const kusak = dikdortgen(-gen / 2, kusakY - 1.1, gen / 2, ustY)
      kusak.holes.push(kemer(new THREE.Path(), 0, kusakY - 1.1 + 0.01, gen - 0.55, 0.45, 1.05))
      ek(cikar(kusak, 0.1, yuz - 0.05).rotateY(yon), m.krem)
    }
    ek(duzGolge(silindirG(R + 0.12, R + 0.12, 0.2, 8).rotateY(Math.PI / 8).translate(0, ustY, 0)), m.ahsap)
    ek(duzGolge(silindirG(R + 0.08, R + 0.08, 0.95, 8).rotateY(Math.PI / 8).translate(0, ustY + 0.57, 0)), m.krem)
    ek(duzGolge(silindirG(R + 0.1, R + 0.1, 0.16, 8).rotateY(Math.PI / 8).translate(0, ustY + 0.62, 0)), m.ahsap)
    ek(duzGolge(silindirG(R - 0.2, R + 0.75, 0.42, 8).rotateY(Math.PI / 8).translate(0, ustY + 1.25, 0)), m.kursun)
    const sogan = dondurG([[2.75, ustY + 1.45], [3.05, ustY + 2.1], [3, ustY + 2.9], [2.35, ustY + 3.7], [1.2, ustY + 4.5], [0.45, ustY + 5.5], [0.08, ustY + 6.6], [0, ustY + 6.7]], 48, [1, 1])
    ek(sogan, m.kubbe)
    ek(dondurG([[0.08, ustY + 6.6], [0.2, ustY + 6.85], [0.04, ustY + 7.1], [0, ustY + 7.4]], 8), m.altin)
  }
  kosk(-17, -YZ - 15)
  kosk(17, -YZ - 15)

  // --- Katmanlar ---
  const kok = k.grup()
  kok.add(cevre)
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  kok.add(catiGrup, kasnakGrup, kubbeGrup)
  return {
    kok,
    // Alttan üste: maketin üst üste oturma sırası.
    katmanlar: [
      { grup: catiGrup, yukseklik: 24, ad: 'Çatı' },
      { grup: kasnakGrup, yukseklik: 34, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 44, ad: 'Kubbeler' },
    ],
    duraklar: icDuraklar,
    yurume: icYurumeAlani(),
  }
}
