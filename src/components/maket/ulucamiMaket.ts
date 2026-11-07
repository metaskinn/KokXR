// Ulu Camii temsili maketi. Plan ölçüleri ile kubbe ve paye düzeni envanterden (s. 44, 46, 60, 63);
// cephe, kasnak, kubbe, minare ve taç kapı biçimleri arşiv fotoğraflarına bakılarak yorumlanmıştır.
// Yükseklikler ve pencere sayıları temsilidir. Birim: metre. Kuzey = -z, kıble (güney) = +z, doğu = +x.
import * as THREE from 'three'
import { icPencereAlt, icPencereUst } from './ulucami/icduvar'
import { ulucamiCevresi } from './ulucami/cevre'
import { icZemini } from './ulucami/zemin'
import { atlasaOturt, cepheKemeri, kapilarMalzemeleri, kemerDilimleri, kosk, serit, tacKapi } from './ulucami/kapilar'
import { ulucamiDetaylari } from './ulucamiDetay'
import { ulucamiMalzemeleri } from './ulucamiDokular'
import { uluIsikMalzemeleri } from './ulucami/isik'
import { kursunKaideG, kursunKubbeEkle, minareUstu } from './ulucami/kubbeler'
import { icDuraklar, icYurumeAlani, ulucamiIcMekani, type IcDurak, type IcYurume } from './ulucamiIc'
import {
  DOGU_BATI, DOSEME_Y, DUVAR, ETEK_Y, GOZ_X, GOZ_Z, H, KASNAK_TABAN, KUZEY_GUNEY, Kova, type Mal, OCTA,
  SADIRVAN_SATIR, SADIRVAN_SUTUN, SATIR, SUTUN, YX, YZ,
  cikar, dikdortgen, duzGolge, gozAcikligi, gozOlcusu, kemer, kutuG, px, pz, silindirG, yer,
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
  const K = kapilarMalzemeleri(m)

  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()
  const kutu = (g: number, h: number, dd: number, mal: Mal, x: number, y: number, z: number, kv = k) =>
    kv.ekle(yer(kutuG(g, h, dd), x, y, z), mal)

  // --- Zemin: çevre ayrı modülde; bina tabanı ve halı burada ---
  const cevre = ulucamiCevresi(m, k)
  kutu(DOGU_BATI + 1, 0.6, KUZEY_GUNEY + 1, m.mermer, 0, 0.3, 0)
  icZemini(k, m)

  // --- Cephe: üç katman (dış taş + kemerli nişler, gövde, iç sıva) ve kafesli pencereler ---
  const cephe = (L: number, x: number, z: number, ry: number, ortaYok: 'hepsi' | 'alt' | 'yok', goz: number, adet: number, altYok = false) => {
    const kemer = cepheKemeri
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
        k.ekle(yer(atlasaOturt(pencere(), 'ust').translate(0, 0, -1.1), x, 0, z, ry), K.atlas)
        kemerHalkasi(px, 6.5 + py, 4.4, duzD, kibleOrtasi ? 2.1 : 2.3, 3.8, 1.9, x, z, ry)
        k.ekle(yer(kutuG(2.5, 0.1, 0.7).translate(px, 7.13 + py, -0.34), x, 0, z, ry), K.cepheTas)
        if (altYok || (orta && ortaYok === 'alt')) continue
        dis.holes.push(kemer(new THREE.Path(), px, 1.5, 2.8, 1.9, 1.1))
        govde.holes.push(dikdortgen(px - 0.8, 2, px + 0.8, 4.1) as unknown as THREE.Path)
        ic.holes.push(icPencereAlt(k, m, px, x, z, ry))
        pencereler.push(new THREE.ShapeGeometry(dikdortgen(px - 0.8, 2, px + 0.8, 4.1)).translate(0, 0, -1.1))
        kemerHalkasi(px, 1.5, 3.3, 1.9, 1.4, 2.8, 1.1, x, z, ry)
        k.ekle(yer(kutuG(2.1, 0.12, 0.7).translate(px, 1.96, -0.3), x, 0, z, ry), m.icMermer)
        for (const s of [-1, 1]) k.ekle(yer(kutuG(0.14, 2.2, 0.66).translate(px + s * 0.87, 3.05, -0.33), x, 0, z, ry), m.icMermer)
        k.ekle(yer(kutuG(1.88, 0.16, 0.66).translate(px, 4.19, -0.33), x, 0, z, ry), m.icMermer)
        // Pencere üstü alınlık taştır, kafes değil (fotoğraflara göre).
        k.ekle(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), px, 4.3, 1.1, 0.05, 0.6), 8).translate(0, 0, -0.45), x, 0, z, ry), K.cepheTas)
      }
    }
    k.ekle(yer(cikar(dis, 0.65, -0.65), x, 0, z, ry), K.cepheTas)
    k.ekle(yer(cikar(govde, 1.15, -1.8), x, 0, z, ry), K.cepheTas)
    k.ekle(yer(cikar(ic, 0.2, -2), x, 0, z, ry), m.icDuvar)
    pencereler.forEach((p) => {
      k.ekle(yer(p.clone().translate(0, 0, -0.72), x, 0, z, ry), m.camKafes)
      k.ekle(yer(atlasaOturt(p, 'alt'), x, 0, z, ry), K.atlas)
    })
    // Kaide, ara silme ve saçak silmesi
    serit((g) => k.ekle(yer(g, x, 0, z, ry), K.atlas), 'kaide', L + 0.3, 0, 1.3, 0.25)
    kutu2(L + 0.3, 0.2, 0.14, x, 6.05, z, ry, K.cepheTas)
    serit((g) => k.ekle(yer(g, x, 0, z, ry), K.atlas), 'sacak', L + 1, H - 0.7, 1, 0.7)
  }
  /** Kemeri çeviren, duvardan hafif çıkıntılı taş dilimler (fotoğraflardaki gibi). */
  const kemerHalkasi = (cx: number, y0: number, gDis: number, duz: number, kDis: number, gIc: number, kIc: number, x: number, z: number, ry: number) =>
    kemerDilimleri((g) => k.ekle(yer(g, x, 0, z, ry), K.cepheTas), cx, y0, gDis, duz, kDis, gIc, kIc)
  const kutu2 = (g: number, h: number, dd: number, x: number, y: number, z: number, ry: number, mal: Mal) => {
    const b = kutuG(g, h, dd).translate(0, y, dd / 2 - 0.05)
    k.ekle(yer(b, x, 0, z, ry), mal)
  }
  cephe(DOGU_BATI, 0, -YZ, Math.PI, 'hepsi', GOZ_X, SUTUN)
  // Güney duvarının alt sıra pencereleri sonradan kapatılmıştır (Kültür Portalı).
  cephe(DOGU_BATI, 0, YZ, 0, 'alt', GOZ_X, SUTUN, true)
  cephe(KUZEY_GUNEY - DUVAR * 2, YX, 0, Math.PI / 2, 'yok', GOZ_Z, SATIR)
  cephe(KUZEY_GUNEY - DUVAR * 2, -YX, 0, -Math.PI / 2, 'yok', GOZ_Z, SATIR)

  // --- Taç kapı (kuzey cephesi): ulucami/kapilar.ts ---
  tacKapi(k, m, K, YZ)

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
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L - 2, 2, 0, 0, L - 2, 2, 2, 2], 2))
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

    const kaide = kursunKaideG(7.9, 9.6, ETEK_Y)
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
    // Yüz başına tek kemerli pencere, yüksekliğin yarısından fazlası (DJI_0291): sıvadan hafif içeride, açık çerçeveli.
    const yuz = R * OCTA + 0.04
    const pG = 1.42, pK = 0.68, pH = kasnakH * 0.62 - pK, y0 = KASNAK_TABAN + kasnakH * 0.17
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4
      const cerceveS = kemer(new THREE.Shape(), 0, y0 - 0.1, pG + 0.26, pH + 0.1, pK + 0.14)
      cerceveS.holes.push(kemer(new THREE.Path(), 0, y0, pG, pH, pK))
      const cerceve = cikar(cerceveS, 0.09, yuz)
      const kafes = new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y0, pG, pH, pK), 8).translate(0, 0, yuz + 0.02)
      kKasnak.ekle(yer(cerceve, x, 0, z, a), m.krem)
      kKasnak.ekle(yer(kafes, x, 0, z, a), m.kafes)
    }

    kursunKubbeEkle(kKubbe, m, x, KASNAK_TABAN + kasnakH, z, kubbeH, acik, i, j)
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
    minareUstu(ek, m, govdeTaban)
  }
  minare(-YX - 2.2, -YZ - 1.4, true)
  minare(YX + 2.2, -YZ - 1.4, false)

  // --- Kuzey avlusundaki iki şadırvan köşkü: ulucami/kapilar.ts ---
  kosk(k, m, K, -17, -YZ - 15)
  kosk(k, m, K, 17, -YZ - 15)

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
