// Ulu Camii minber bölgesi: kündekâri minber, müezzin mahfili, mermer ve ahşap vaaz kürsüleri, dolaplar, sandık ve rahleler.
// Biçimler arşiv fotoğraflarından, sekiz direk ve kitabeler envanter kitabından. Dokular ve yazılar arşiv fotoğrafının
// perspektifi düzeltilmiş kırpımlarıdır (scripts/minber_kirp.py); kod yazı üretmez.
// Temsilî olanlar: köşkün doğu yüzü batı yüzünün kırpımını taşır, kürsünün basamakları yürüme içindir, oranlar maket ölçeğindedir.
// Kafes ve halka korkuluklar saydam katman değil gerçek geometridir; her şey iki malzemede birleşir (iki çizim çağrısı).
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../data/acikYayin'
import { hafifCihaz } from '../ulucamiZemin'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'
import { Kova, cikar, dondurG, duzGolge, kutuG, silindirG, uvSigdir, yer } from '../ulucamiParca'

const ATLAS = 2048
/** Atlastaki bölgeler (piksel: x, y, g, y). scripts/minber_kirp.py çıktısıyla aynı kalmalı. */
const BOLGE = {
  koskKuzey: [0, 0, 480, 1336], koskBati: [490, 0, 480, 1266], kapiPano: [980, 0, 512, 440], kapiTac: [980, 450, 512, 320],
  deri: [1500, 0, 512, 496], mermer: [980, 810, 1024, 128], kitabe: [1500, 510, 512, 137], kaide: [1500, 660, 256, 112],
  ceviz: [980, 945, 1060, 84], panoYildiz: [1762, 660, 280, 116], dolap: [0, 1345, 360, 498], dolapYan: [370, 1345, 120, 400],
} as const
type Bolge = keyof typeof BOLGE

/** Geometrinin 0-1 UV'sini atlas bölgesine taşır; yarım piksel içeriden keserek komşu bölgenin sızmasını önler. */
function esle<G extends THREE.BufferGeometry>(g: G, ad: Bolge): G {
  const [x, y, gn, yk] = BOLGE[ad]
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    const u = THREE.MathUtils.clamp(uv.getX(i), 0, 1), v = THREE.MathUtils.clamp(uv.getY(i), 0, 1)
    uv.setXY(i, (x + 1 + u * (gn - 2)) / ATLAS, 1 - (y + 1 + (1 - v) * (yk - 2)) / ATLAS)
  }
  return g
}

/** Kutu: her yüz bölgenin tamamını alır (UV 0-1). */
const kutuA = (g: number, h: number, d: number, ad: Bolge) => esle(new THREE.BoxGeometry(g, h, d), ad)
const levhaA = (g: number, h: number, ad: Bolge) => esle(new THREE.PlaneGeometry(g, h), ad)

/** İki yüzlü üçgen; `uv` köşeleri atlas bölgesinin 0-1 koordinatındadır. */
function ucgenA(k: [number, number, number][], uv: [number, number][], ad: Bolge) {
  const g = new THREE.BufferGeometry()
  const sira = [0, 1, 2, 0, 2, 1]
  g.setAttribute('position', new THREE.Float32BufferAttribute(sira.flatMap((i) => k[i]), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(sira.flatMap((i) => uv[i]), 2))
  g.computeVertexNormals()
  return esle(g, ad)
}

/** Kafes: dikdörtgen levhada sekiz köşeli yıldız ve köşelerde baklava boşluklar; x 0..L, y 0..W. */
function kafesG(L: number, W: number, birim: number) {
  const s = new THREE.Shape()
  s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, W); s.lineTo(0, W); s.closePath()
  const sutun = Math.max(1, Math.floor(L / birim)), sira = Math.max(1, Math.floor(W / birim))
  const bx = L / sutun, by = W / sira
  for (let i = 0; i < sutun; i++) for (let j = 0; j < sira; j++) {
    const cx = (i + 0.5) * bx, cy = (j + 0.5) * by, R = Math.min(bx, by) * 0.4
    const y = new THREE.Path()
    for (let n = 0; n < 16; n++) {
      const a = (n / 16) * Math.PI * 2, r = n % 2 ? R * 0.7 : R * 1.08
      if (n) y.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      else y.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    y.closePath()
    s.holes.push(y)
    if (i < sutun - 1 && j < sira - 1) {
      const dx = (i + 1) * bx, dy = (j + 1) * by, d = Math.min(bx, by) * 0.13
      const b = new THREE.Path()
      b.moveTo(dx + d, dy); b.lineTo(dx, dy + d); b.lineTo(dx - d, dy); b.lineTo(dx, dy - d); b.closePath()
      s.holes.push(b)
    }
  }
  return cikar(s, 0.05, -0.025)
}

interface Dokular { atlas: THREE.MeshStandardMaterial; kund: THREE.MeshStandardMaterial }
const onbellek = new WeakMap<UlucamiMalzemeleri, Dokular>()

/** Bölgenin iki malzemesi. Sahne kapanınca dokular başka malzemelerle birlikte temizlenir. */
function dokular(m: UlucamiMalzemeleri): Dokular {
  const var_ = onbellek.get(m)
  if (var_) return var_
  let d: Dokular
  if (ACIK_YAYIN) {
    // Açık yayında arşiv kırpımı yok: yalnız düz ceviz ve koddan üretilmiş kündekâri izlenimi.
    d = { atlas: new THREE.MeshStandardMaterial({ color: '#3a2317', roughness: 0.6 }), kund: m.kundekari }
  } else {
    const hafif = hafifCihaz()
    const y = new THREE.TextureLoader()
    const at = y.load(`/gorseller/ulu-camii/maket/minber-atlas${hafif ? '-1024' : ''}.jpg`)
    at.colorSpace = THREE.SRGBColorSpace
    at.anisotropy = hafif ? 2 : 8
    const ku = y.load(`/gorseller/ulu-camii/maket/minber-kundekari${hafif ? '-512' : ''}.jpg`)
    ku.colorSpace = THREE.SRGBColorSpace
    ku.wrapS = ku.wrapT = THREE.RepeatWrapping
    // Bir tekrar, köşk ayağı genişliğinin iki katı: yıldızlar fotoğraftaki boyda kalır.
    ku.repeat.set(1 / 3, 1 / (3 * (1440 / 1024)))
    ku.anisotropy = hafif ? 2 : 8
    d = {
      atlas: new THREE.MeshStandardMaterial({ map: at, roughness: 0.58, metalness: 0 }),
      kund: new THREE.MeshStandardMaterial({ map: ku, color: new THREE.Color(1.45, 1.42, 1.5), roughness: 0.5, metalness: 0.08, ...(hafif ? {} : { bumpMap: ku, bumpScale: 1.4 }) }),
    }
  }
  onbellek.set(m, d)
  return d
}

export interface MinberOlcu { x: number; z0: number; boy: number; en: number; tepe: number; duvarZ: number; zemin: number }

/** Yerel eksen: s (x) kapıdan köşke, y yukarı, z batıya. `ek` geometriyi dünyaya taşır. */
export function minberYap(m: UlucamiMalzemeleri, k: Kova, o: MinberOlcu) {
  const { atlas, kund } = dokular(m)
  const { boy: BOY, en: EN, tepe: TEPE, zemin: Z } = o
  const ek = (g: THREE.BufferGeometry, mal: THREE.Material) => {
    g.rotateY(-Math.PI / 2)
    g.translate(o.x, 0, o.z0)
    k.ekle(g, mal)
  }
  const altin = m.altinKoyu
  /** İki nokta arası ince altın (veya verilen) şerit: (s, y) düzleminde, zYuz yüzünde. */
  const serit = (s0: number, y0: number, s1: number, y1: number, zYuz: number, en = 0.035, mal: THREE.Material = altin, kal = 0.03) => {
    const L = Math.hypot(s1 - s0, y1 - y0)
    const g = new THREE.BoxGeometry(L, en, kal)
    g.rotateZ(Math.atan2(y1 - y0, s1 - s0))
    g.translate((s0 + s1) / 2, (y0 + y1) / 2, zYuz)
    ek(g, mal)
  }
  const YK = EN / 2

  // --- Yan yüzler: üçgen gövde kündekâri, içinde altın üçgen çerçeve (fotoğraftaki gibi) ---
  const yan = new THREE.Shape()
  yan.moveTo(0.7, Z); yan.lineTo(BOY, Z); yan.lineTo(BOY, Z + TEPE + 0.5); yan.lineTo(BOY - 1.2, Z + TEPE + 0.5)
  yan.lineTo(1.8, Z + 0.9); yan.lineTo(0.7, Z + 0.9); yan.closePath()
  for (const s of [-1, 1]) ek(cikar(yan, 0.14, s * YK - 0.07), kund)
  const egim = (TEPE + 0.5 - 0.9) / (BOY - 1.2 - 1.8)
  const ustY = (s: number) => Z + 0.9 + (s - 1.8) * egim
  for (const s of [-1, 1]) {
    const zy = s * (YK + 0.075)
    // Üçgen çerçeve
    serit(1.55, Z + 0.28, 5.8, Z + 0.28, zy)
    serit(5.8, Z + 0.28, 5.8, ustY(5.8) - 0.3, zy)
    serit(1.55, Z + 0.28, 5.8, ustY(5.8) - 0.3, zy)
    // Basamak kirişi: kafesin altında boydan boya koyu şerit, iki yanı altın
    const s0 = 1.15, s1 = 6.05, a0 = ustY(s0), a1 = ustY(s1)
    serit(s0, a0 + 0.03, s1, a1 + 0.03, s * YK, 0.3, kund, 0.2)
    serit(s0, a0 - 0.13, s1, a1 - 0.13, s * (YK + 0.1), 0.03)
    serit(s0, a0 + 0.2, s1, a1 + 0.2, s * (YK + 0.1), 0.03)
    // Süpürgelik
    ek(kutuA(6.6, 0.14, 0.1, 'ceviz').translate(4, Z + 0.07, s * (YK + 0.12)), atlas)
  }

  // --- Korkuluk: yıldız kafesli panolar, aralarında dikey kayıtlar, üstte küpeşte ---
  {
    const a = Math.atan(egim), bas = 1.25, son = 6.05
    const uzun = (son - bas) / Math.cos(a), PANO = 5, W = 0.78, OFSET = 0.22
    for (const s of [-1, 1]) {
      const zy = s * YK
      const yerlestir = (g: THREE.BufferGeometry) => {
        g.rotateZ(a)
        g.translate(bas, ustY(bas) + OFSET, zy)
        return g
      }
      for (let p = 0; p < PANO; p++) {
        const L = uzun / PANO
        const kafes = kafesG(L - 0.1, W, 0.25)
        kafes.translate(p * L + 0.05, 0, 0)
        ek(yerlestir(kafes), kund)
        ek(yerlestir(new THREE.BoxGeometry(0.1, W + 0.04, 0.09).translate(p * L, W / 2, 0)), kund)
      }
      ek(yerlestir(new THREE.BoxGeometry(0.1, W + 0.04, 0.09).translate(uzun, W / 2, 0)), kund)
      ek(yerlestir(kutuA(uzun + 0.1, 0.1, 0.16, 'ceviz').translate(uzun / 2, W + 0.05, 0)), atlas)
      ek(yerlestir(new THREE.BoxGeometry(uzun + 0.1, 0.025, 0.17).translate(uzun / 2, W + 0.002, 0)), altin)
    }
  }

  // --- Basamaklar: kırmızı halı, koyu burun ---
  for (const [s, y] of [[1.0, 0.3], [1.45, 0.6]]) ek(kutuG(0.5, y, EN - 0.28).translate(s + 0.2, Z + y / 2, 0), m.mihrapKirmizi)
  const ADIM = 11
  for (let i = 0; i < ADIM; i++) {
    const t = i / ADIM, s = 1.8 + t * (BOY - 3), y = Z + 0.9 + t * (TEPE - 0.4), d = (BOY - 3) / ADIM
    ek(kutuG(d + 0.02, y - Z, EN - 0.28).translate(s + d / 2, (y + Z) / 2, 0), m.mihrapKirmizi)
    ek(new THREE.BoxGeometry(0.05, 0.05, EN - 0.28).translate(s + 0.03, y + 0.005, 0), m.ahsap)
  }

  // --- Köşk: duvara dayanan kule; kuzey yüzünde perdeli niş, yanlarda niş, kafes ve kitabe ---
  const KS = 6.05, KE = o.duvarZ - o.z0, KG = KE - KS, KM = (KS + KE) / 2, TH = 9.1
  ek(kutuG(KG, TH, EN).translate(KM, Z + TH / 2, 0), kund)
  // Yan yüzler: batı yüz kırpımı. Doğu yüzü için aynı kırpım (temsilî): köşkün doğusunu kapatan net bir fotoğraf yok.
  const YH = KG * (1266 / 480), YY = Z + TH - YH / 2
  ek(levhaA(KG, YH, 'koskBati').translate(KM, YY, YK + 0.012), atlas)
  ek(levhaA(KG, YH, 'koskBati').rotateY(Math.PI).translate(KM, YY, -YK - 0.012), atlas)
  // Kuzey yüzü: ortada fotoğraf, iki yanda kündekâri
  const KUZ_G = 1.4, KUZ_H = KUZ_G * (1336 / 480), KUZ_Y = Z + TH - KUZ_H / 2
  ek(levhaA(KUZ_G, KUZ_H, 'koskKuzey').rotateY(-Math.PI / 2).translate(KS - 0.012, KUZ_Y, 0), atlas)
  for (const s of [-1, 1]) {
    const dx = KS - 0.02
    ek(new THREE.BoxGeometry(0.03, KUZ_H, 0.03).translate(dx, KUZ_Y, s * (KUZ_G / 2 + 0.01)), altin)
    ek(new THREE.BoxGeometry(0.03, TH, 0.04).translate(dx, Z + TH / 2, s * (YK - 0.01)), altin)
    // Köşk ayağının kenar altınları
    const zy = s * (YK + 0.012)
    serit(KS + 0.07, Z + 0.1, KS + 0.07, YY - YH / 2, zy)
    serit(KE - 0.07, Z + 0.1, KE - 0.07, YY - YH / 2, zy)
    serit(KS + 0.07, Z + 0.1, KE - 0.07, Z + 0.1, zy)
    ek(new THREE.BoxGeometry(KG, 0.05, 0.03).translate(KM, YY - YH / 2, zy), altin)
  }
  // Saçak: altın silme ve kitabe kuşağı izlenimi veren ceviz
  ek(kutuA(KG + 0.14, 0.2, EN + 0.14, 'ceviz').translate(KM, Z + TH + 0.1, 0), atlas)
  ek(new THREE.BoxGeometry(KG + 0.18, 0.05, EN + 0.18).translate(KM, Z + TH + 0.02, 0), altin)
  ek(new THREE.BoxGeometry(KG + 0.18, 0.04, EN + 0.18).translate(KM, Z + TH + 0.19, 0), altin)

  // --- Külâh: sekiz yüzlü, koyu, altın üçgen örgülü (kitap: ajurlu ahşap külâh; fotoğraftaki örgü) ---
  {
    const y0 = Z + TH + 0.2, R = Math.max(KG, EN) * 0.62
    const halka: [number, number][] = [[R, 0], [R * 0.82, 0.42], [R * 0.48, 0.95], [R * 0.1, 1.4]]
    const gv = duzGolge(dondurG(halka, 8).rotateY(Math.PI / 8))
    ek(gv.translate(KM, y0, 0), m.ahsap)
    const rib = (a: THREE.Vector3, b: THREE.Vector3) => {
      const L = a.distanceTo(b)
      const g = silindirG(0.018, 0.018, L, 4)
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()))
      g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
      ek(g, altin)
    }
    const nokta = (hl: number, n: number) => {
      const a = ((n + 0.5) / 8) * Math.PI * 2
      const r = halka[hl][0] * 1.012
      return new THREE.Vector3(KM + Math.cos(a) * r, y0 + halka[hl][1], Math.sin(a) * r)
    }
    const ara = (hl: number, n: number) => {
      const a = ((n + 1) / 8) * Math.PI * 2
      const r = halka[hl][0] * Math.cos(Math.PI / 8) * 1.012
      return new THREE.Vector3(KM + Math.cos(a) * r, y0 + halka[hl][1], Math.sin(a) * r)
    }
    for (let n = 0; n < 8; n++) for (let h = 0; h < 3; h++) {
      rib(nokta(h, n), nokta(h + 1, n))
      rib(nokta(h, n), nokta(h, n + 1))
      rib(nokta(h, n), ara(h + 1, n))
      rib(nokta(h, n + 1), ara(h + 1, n))
    }
    // Alem: üst üste altın küreler ve hilal
    const tepe = y0 + 1.36
    ek(dondurG([[0.09, 0], [0.04, 0.05], [0.16, 0.16], [0.17, 0.25], [0.05, 0.36], [0.14, 0.46], [0.15, 0.55], [0.04, 0.66], [0.11, 0.76], [0.11, 0.84], [0.025, 0.95], [0.02, 1.1]], 10).translate(KM, tepe, 0), m.altin)
    ek(new THREE.TorusGeometry(0.16, 0.035, 5, 14, Math.PI * 1.45).rotateZ(Math.PI * 0.77).rotateY(Math.PI / 2).translate(KM, tepe + 1.24, 0), m.altin)
  }

  // --- Kapı: iki söve, kitabeli lento ve oymalı taç ---
  {
    const PG = EN + 0.2, ACIK = 1.3, LENTO0 = 3.05, LENTO1 = 4.4, DER = 0.7
    const sove = (PG - ACIK) / 2
    for (const s of [-1, 1]) {
      const zs = s * (ACIK / 2 + sove / 2)
      ek(kutuG(DER, LENTO0, sove).translate(DER / 2, Z + LENTO0 / 2, zs), kund)
      ek(new THREE.BoxGeometry(0.03, LENTO0, 0.03).translate(-0.012, Z + LENTO0 / 2, s * (ACIK / 2 + 0.03)), altin)
      ek(new THREE.BoxGeometry(0.03, LENTO1, 0.03).translate(-0.012, Z + LENTO1 / 2, s * (PG / 2 - 0.03)), altin)
    }
    ek(kutuG(DER, LENTO1 - LENTO0, PG).translate(DER / 2, Z + (LENTO0 + LENTO1) / 2, 0), kund)
    const panG = 1.4, panH = panG * (440 / 512)
    const panY = Z + (LENTO0 + LENTO1) / 2
    ek(levhaA(panG, Math.min(panH, LENTO1 - LENTO0 - 0.1), 'kapiPano').rotateY(-Math.PI / 2).translate(-0.012, panY, 0), atlas)
    ek(new THREE.BoxGeometry(DER + 0.06, 0.05, PG + 0.06).translate(DER / 2, Z + LENTO1 + 0.025, 0), altin)
    // Taç: fotoğraftan kesilmiş siluet; arkadan da görünür
    const TG = PG, TH2 = TG * (320 / 512)
    const dis: [number, number][] = [[0.02, 0.01], [0.13, 0.25], [0.24, 0.47], [0.35, 0.66], [0.37, 0.81], [0.43, 0.96], [0.51, 0.91], [0.53, 0.77], [0.65, 0.66], [0.82, 0.44], [0.97, 0.25], [1, 0.02]]
    const tac = new THREE.Shape()
    dis.forEach(([u, v], i) => {
      const x = (u - 0.5) * TG, y = v * TH2
      if (i) tac.lineTo(x, y); else tac.moveTo(x, y)
    })
    tac.closePath()
    const yuz = (ry: number, dx: number) => {
      const g = new THREE.ShapeGeometry(tac)
      const p = g.attributes.position, uv = g.attributes.uv
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / TG + 0.5, p.getY(i) / TH2)
      esle(g, 'kapiTac')
      g.rotateY(ry)
      g.translate(dx, Z + LENTO1 + 0.05, 0)
      ek(g, atlas)
    }
    yuz(-Math.PI / 2, 0.24)
    yuz(Math.PI / 2, 0.46)
    const govde = cikar(tac, 0.2, -0.1)
    govde.rotateY(-Math.PI / 2)
    ek(govde.translate(0.35, Z + LENTO1 + 0.05, 0), m.ahsap)
  }
}

/** Alçak korkuluk: tornalı parmaklık, alt ve üst kayıt, aralıklı dikmeler. */
export function parmaklik(m: UlucamiMalzemeleri, k: Kova, x0: number, z0: number, x1: number, z1: number, zemin: number, h = 0.82) {
  const { atlas } = dokular(m)
  const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
  const adet = Math.max(2, Math.round(L / 0.2))
  const bal: [number, number][] = [[0.026, 0], [0.042, 0.1 * h], [0.022, 0.3 * h], [0.05, 0.5 * h], [0.022, 0.7 * h], [0.04, 0.9 * h], [0.026, h]]
  for (let n = 0; n <= adet; n++) {
    const t = n / adet
    k.ekle(esle(dondurG(bal, 5, [1, 1]), 'ceviz').translate(x0 + (x1 - x0) * t, zemin, z0 + (z1 - z0) * t), atlas)
  }
  k.ekle(yer(kutuA(0.14, 0.06, L + 0.08, 'ceviz'), mx, zemin + h + 0.03, mz, a), atlas)
  k.ekle(yer(kutuA(0.12, 0.08, L + 0.04, 'ceviz'), mx, zemin + 0.04, mz, a), atlas)
  const dikme = Math.max(1, Math.round(L / 1.3))
  for (let n = 0; n <= dikme; n++) {
    const t = n / dikme
    k.ekle(yer(kutuA(0.12, h + 0.12, 0.12, 'ceviz'), x0 + (x1 - x0) * t, zemin + (h + 0.12) / 2, z0 + (z1 - z0) * t, a), atlas)
  }
}

export interface MahfilOlcu { x: number; z: number; enZ: number; zemin: number }
/** Mahfilin alt korkuluğu: orta eksen açık kalır, kuzeydoğu köşesinde merdiven vardır. */
export const MAHFIL_ALT_KORKULUK: [number, number, number, number][] = [
  [-3.1, -2.1, -3.1, 2.1], [3.1, -1.6, 3.1, 2.1],
  [-3.1, 2.1, -0.85, 2.1], [0.85, 2.1, 3.1, 2.1],
  [-3.1, -2.1, -0.85, -2.1], [0.85, -2.1, 1.95, -2.1],
]

/** Sekiz direkli ceviz mahfil (envanter: sekiz ağaç direk; biçim g85, g84). Platform üstü y = zemin + 3.5 + 0.3. */
export function mahfilYap(m: UlucamiMalzemeleri, k: Kova, o: MahfilOlcu) {
  const { atlas } = dokular(m)
  const { x: mx, z: mz, enZ, zemin: Z } = o
  const PY = Z + 3.5
  // Direkler: mermer ayaklık, koyu kaide, ince gövde, profilli başlık
  const direk: [number, number][] = [[0.16, 0.34], [0.13, 0.42], [0.115, 0.55], [0.1, 1.2], [0.095, 2.8], [0.11, 2.95], [0.095, 3.05], [0.17, 3.2], [0.21, 3.28]]
  for (const a of [-3.1, -1.03, 1.03, 3.1]) for (const b of [-enZ, enZ]) {
    k.ekle(yer(esle(dondurG(direk, 10, [1, 1]), 'ceviz'), mx + a, Z, mz + b), atlas)
    k.ekle(yer(dondurG([[0.26, 0.04], [0.2, 0.1], [0.14, 0.34], [0, 0.34]], 8), mx + a, Z, mz + b), m.icMermer)
    k.ekle(yer(kutuA(0.56, 0.06, 0.56, 'ceviz'), mx + a, Z + 0.03, mz + b), atlas)
    // Başlık tablası
    k.ekle(yer(kutuA(0.46, 0.1, 0.46, 'ceviz'), mx + a, Z + 3.32, mz + b), atlas)
  }
  // Kiriş: derin ceviz alın, altta silme
  const kiris = (x: number, z: number, gn: number, d: number) => {
    k.ekle(yer(kutuA(gn, 0.44, d, 'ceviz'), x, PY + 0.02, z), atlas)
    k.ekle(yer(kutuA(gn + 0.1, 0.06, d + 0.1, 'ceviz'), x, PY - 0.2, z), atlas)
    k.ekle(yer(kutuA(gn + 0.14, 0.05, d + 0.14, 'ceviz'), x, PY + 0.26, z), atlas)
  }
  kiris(mx, mz + 2.3, 7, 0.26); kiris(mx, mz - 2.3, 7, 0.26)
  kiris(mx - 3.4, mz, 0.26, 4.5); kiris(mx + 3.4, mz, 0.26, 4.5)
  // Döşeme: üstü ceviz, altı tahta
  k.ekle(yer(kutuA(6.8, 0.1, 4.7, 'ceviz'), mx, PY + 0.2, mz), atlas)
  for (let n = 0; n < 7; n++) k.ekle(yer(kutuA(6.6, 0.05, 0.1, 'ceviz'), mx, PY - 0.03, mz - 2 + (n * 4) / 6), atlas)

  // Küpeşte: dikmeler, üst ve alt kayıt, halka zincir (g85)
  const KY = PY + 0.28
  const kupeste = (x0: number, z0: number, x1: number, z1: number, h0 = KY, h1 = KY) => {
    const L = Math.hypot(x1 - x0, z1 - z0, h1 - h0), Lz = Math.hypot(x1 - x0, z1 - z0)
    const ry = Math.atan2(z1 - z0, x1 - x0), egim = Math.atan2(h1 - h0, Lz)
    const yerlestir = (g: THREE.BufferGeometry, u: number, v: number) => {
      g.translate(u, v, 0)
      g.rotateZ(egim)
      g.rotateY(-ry)
      g.translate(x0, h0, z0)
      return g
    }
    const R = 0.14, adim = 0.19, adet = Math.floor((L - 0.1) / adim)
    for (let n = 0; n < adet; n++) {
      k.ekle(yerlestir(esle(new THREE.TorusGeometry(R, 0.016, 3, 12), 'ceviz'), 0.14 + n * adim, 0.36), atlas)
    }
    k.ekle(yerlestir(kutuA(L + 0.1, 0.09, 0.14, 'ceviz'), L / 2, 0.58), atlas)
    k.ekle(yerlestir(kutuA(L, 0.05, 0.08, 'ceviz'), L / 2, 0.15), atlas)
    k.ekle(yerlestir(kutuA(L, 0.12, 0.1, 'ceviz'), L / 2, 0.06), atlas)
    const dikme = Math.max(1, Math.round(L / 2.2))
    for (let n = 0; n <= dikme; n++) k.ekle(yerlestir(kutuA(0.12, 0.64, 0.14, 'ceviz'), (n / dikme) * L, 0.31), atlas)
  }
  kupeste(mx - 3.4, mz + 2.35, mx + 3.4, mz + 2.35)
  kupeste(mx - 3.4, mz - 2.35, mx + 1.9, mz - 2.35)
  kupeste(mx - 3.4, mz - 2.35, mx - 3.4, mz + 2.35)
  kupeste(mx + 3.4, mz - 2.35, mx + 3.4, mz + 2.35)

  // Merdiven: kuzeyden platforma; iki yanı deri üzeri süslemeli pano, üstünde halka korkuluk
  const ADIM = 12, X = mx + 2.65, BOY = 4.4, YUK = 3.56, Z0 = mz - 2.4 - BOY
  for (let n = 0; n < ADIM; n++) {
    const y = Z + (n + 1) * (YUK / ADIM), z = Z0 + (n + 0.5) * (BOY / ADIM)
    k.ekle(yer(kutuA(1.2, 0.06, BOY / ADIM + 0.05, 'ceviz'), X, y, z), atlas)
    k.ekle(yer(kutuA(1.2, y - Z - 0.02, 0.03, 'ceviz'), X, Z + (y - Z) / 2, z + BOY / ADIM / 2), atlas)
  }
  for (const s of [-1, 1]) {
    const xx = X + s * 0.64
    // Fotoğrafta yüksek uç solda: u aynalanır ki pano iki yandan da doğru otursun.
    k.ekle(ucgenA([[xx, Z + 0.16, Z0 + 0.1], [xx, Z + 0.16, Z0 + BOY], [xx, Z + YUK - 0.05, Z0 + BOY]], [[1, 0], [0, 0], [0, 1]], 'deri'), atlas)
    k.ekle(yer(kutuA(0.1, 0.16, BOY + 0.04, 'ceviz'), xx, Z + 0.08, Z0 + BOY / 2), atlas)
    kupeste(xx, Z0 + 0.05, xx, Z0 + BOY, Z + 0.12, Z + YUK + 0.04)
    // Alttaki oymalı yan pano (g65, g84)
    const pano = levhaA(1.3, 0.56, 'panoYildiz').rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2)
    k.ekle(pano.translate(X + s * 0.72, Z + 0.32, Z0 - 0.6), atlas)
    const arka = levhaA(1.3, 0.56, 'panoYildiz').rotateY(s > 0 ? -Math.PI / 2 : Math.PI / 2)
    k.ekle(arka.translate(X + s * 0.7, Z + 0.32, Z0 - 0.6), atlas)
    k.ekle(yer(kutuA(0.08, 0.66, 1.4, 'ceviz'), X + s * 0.71, Z + 0.33, Z0 - 0.6), atlas)
  }
  // Alt korkuluk (g85)
  for (const [a, b, c, d] of MAHFIL_ALT_KORKULUK) parmaklik(m, k, mx + a, mz + b, mx + c, mz + d, Z, 0.68)
}

export interface KursuOlcu { x: number; z: number; r: number; zemin: number; giris: number }
/** Rokoko mermer kürsü: taş kaide, boğumlu ayak, damarlı tekne, altın süslü kitabe, iki topuz (g103; envanter: H. 1231). */
export function mermerKursu(m: UlucamiMalzemeleri, k: Kova, o: KursuOlcu) {
  const { atlas } = dokular(m)
  const { x, z, zemin: Z, giris: G } = o
  const dis = ACIK_YAYIN ? m.icMermer : atlas
  // Damar boyu korunsun diye v, yükseklikle üçgen dalga izler; u çevreyi bir tur alır (bölge kendi içinde aynalıdır).
  const merm = <T extends THREE.BufferGeometry>(g: T) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) / 0.95) % 2
      uv.setXY(i, uv.getX(i), t < 1 ? t : 2 - t)
    }
    return esle(g, 'mermer')
  }
  // Taş kaide
  k.ekle(yer(kutuA(1.55, 0.52, 1.55, 'kaide'), x, Z + 0.26, z), atlas)
  // Ayak ve teknenin altı (tam tur)
  // Ayak fotoğrafta açık renkli ve boğumludur; damar yalnız teknede belirgindir.
  const ayak: [number, number][] = [[0.66, 0.52], [0.62, 0.62], [0.46, 0.68], [0.42, 0.85], [0.45, 0.95], [0.42, 1.05], [0.42, 1.28], [0.47, 1.36], [0.42, 1.44], [0.62, 1.54], [0.66, 1.62], [0.58, 1.68]]
  k.ekle(yer(dondurG(ayak, 20), x, Z, z), m.icMermer)
  const karin: [number, number][] = [[0.58, 1.68], [0.74, 1.76], [0.94, 1.9], [1.03, 2.05], [1.07, 2.2]]
  k.ekle(yer(merm(dondurG(karin, 28, [1, 1])), x, Z, z), dis)
  k.ekle(yer(merm(dondurG([[1, 2.2], [0.1, 2.2]], 28, [1, 1])), x, Z, z), dis)
  // Teknenin duvarı: kuzey girişi açık
  const profil = [[1.0, 2.2], [1.0, 3.12], [1.12, 3.14], [1.13, 3.26], [0.96, 3.26], [0.96, 2.2]].map(([r, y]) => new THREE.Vector2(r, y))
  const ic = new THREE.LatheGeometry(profil, 28, Math.PI + G / 2, Math.PI * 2 - G)
  k.ekle(yer(merm(ic), x, Z, z), dis)
  const disP = [[1.07, 2.2], [1.11, 2.7], [1.13, 3.14]].map(([r, y]) => new THREE.Vector2(r, y))
  k.ekle(yer(merm(new THREE.LatheGeometry(disP, 28, Math.PI + G / 2, Math.PI * 2 - G)), x, Z, z), dis)
  // Kitabe: fotoğraftaki beyit, batıya bakar
  const kit = new THREE.CylinderGeometry(1.135, 1.115, 0.7, 12, 1, true, -Math.PI / 2 - 0.82, 1.64)
  k.ekle(yer(esle(kit, 'kitabe'), x, Z + 2.72, z), atlas)
  // Altın kuşak ve topuzlar
  for (const y of [3.12]) k.ekle(yer(new THREE.TorusGeometry(1.125, 0.016, 4, 28, Math.PI * 2 - G).rotateZ(-Math.PI / 2 + G / 2).rotateX(Math.PI / 2), x, Z + y, z), m.altinKoyu)
  for (const a of [-Math.PI / 2 - 0.9, -Math.PI / 2 + 0.9, Math.PI / 2 + 0.3, Math.PI / 2 - 0.3]) {
    k.ekle(yer(dondurG([[0.05, 0], [0.09, 0.05], [0.1, 0.12], [0.03, 0.22], [0, 0.26]], 8), x + Math.sin(a) * 1.03, Z + 3.26, z + Math.cos(a) * 1.03), m.icMermer)
  }
}

/** Mihrabın yanındaki ahşap vaaz kürsüsü (envanter; biçim g92): sekiz köşe gövde, eğik rahle, yüksek arkalık. */
export const AHSAP_KURSU = { x: 5.6, z: 23.75 }
export function ahsapKursu(m: UlucamiMalzemeleri, k: Kova, zemin: number) {
  const { atlas, kund } = dokular(m)
  const { x, z } = AHSAP_KURSU
  const R = 0.82, H = 1.15
  for (let n = 0; n < 8; n++) {
    const a = ((n + 0.5) / 8) * Math.PI * 2, d = R * Math.cos(Math.PI / 8), g = 2 * R * Math.sin(Math.PI / 8)
    k.ekle(yer(levhaA(g, H - 0.24, 'panoYildiz').translate(0, zemin + 0.12 + (H - 0.24) / 2, d + 0.005), x, 0, z, a), atlas)
  }
  k.ekle(yer(duzGolge(silindirG(R, R, H, 8).rotateY(Math.PI / 8)), x, zemin + H / 2, z), m.ahsap)
  k.ekle(yer(duzGolge(silindirG(R + 0.07, R + 0.07, 0.1, 8).rotateY(Math.PI / 8)), x, zemin + H + 0.05, z), m.ceviz)
  k.ekle(yer(duzGolge(silindirG(R + 0.05, R + 0.05, 0.12, 8).rotateY(Math.PI / 8)), x, zemin + 0.06, z), m.ceviz)
  // Rahle ve arkalık
  k.ekle(yer(kutuA(0.8, 0.05, 0.5, 'ceviz').rotateX(-0.35), x, zemin + H + 0.32, z - 0.5), atlas)
  k.ekle(yer(kutuG(0.9, 2.7, 0.14).translate(0, zemin + 1.35, 0), x, 0, z + 0.9), kund)
  const tac = new THREE.Shape()
  tac.moveTo(-0.45, 0); tac.quadraticCurveTo(-0.32, 0.34, 0, 0.62); tac.quadraticCurveTo(0.32, 0.34, 0.45, 0); tac.closePath()
  k.ekle(yer(cikar(tac, 0.14, -0.07), x, zemin + 2.7, z + 0.9), kund)
}

/** Paye dibindeki kavsaralı ahşap dolap (g89): önü fotoğraf, gövdesi ceviz. `ry` yönünde, payenin 1.5 m dışında. */
export function dolapYap(m: UlucamiMalzemeleri, k: Kova, x: number, z: number, ry: number, zemin: number) {
  const { atlas } = dokular(m)
  const G = 1.8, H = 2.3, D = 0.42
  const yarim: [number, number][] = [[0, 0.6], [0.05, 0.7], [0.17, 0.8], [0.33, 0.88], [0.44, 0.95], [0.5, 1]]
  const s = new THREE.Shape()
  s.moveTo(-G / 2, 0)
  for (const [u, v] of yarim) s.lineTo((u - 0.5) * G, v * H)
  for (const [u, v] of [...yarim].reverse().slice(1)) s.lineTo((0.5 - u) * G, v * H)
  s.lineTo(G / 2, 0)
  s.closePath()
  const on = esle(uvSigdir(new THREE.ShapeGeometry(s)), 'dolap')
  k.ekle(yer(on.translate(0, zemin + 0.02, 1.5 + D + 0.002), x, 0, z, ry), atlas)
  const govde = cikar(s, D, 1.5)
  esle(uvSigdir(govde), 'dolapYan')
  k.ekle(yer(govde.translate(0, zemin + 0.02, 0), x, 0, z, ry), atlas)
}

/** Sandık: ceviz gövde, önde oymalı pano. */
export function sandikYap(m: UlucamiMalzemeleri, k: Kova, x: number, z: number, onYon: number, zemin: number) {
  const { atlas } = dokular(m)
  k.ekle(yer(kutuA(0.8, 0.85, 0.52, 'dolapYan'), x, zemin + 0.53, z), atlas)
  k.ekle(yer(kutuA(0.86, 0.06, 0.58, 'ceviz'), x, zemin + 0.98, z), atlas)
  k.ekle(yer(levhaA(0.7, 0.42, 'panoYildiz').rotateY(onYon > 0 ? 0 : Math.PI), x, zemin + 0.55, z + onYon * 0.262), atlas)
}

/** Rahle: ortadan geçme, X biçiminde iki ceviz kanat (temsilî). */
export function rahleYap(m: UlucamiMalzemeleri, k: Kova, x: number, z: number, zemin: number) {
  const { atlas } = dokular(m)
  for (const s of [-1, 1]) {
    k.ekle(yer(kutuA(0.5, 0.86, 0.03, 'dolapYan').rotateX(s * 0.72), x, zemin + 0.34, z), atlas)
    k.ekle(yer(levhaA(0.4, 0.3, 'panoYildiz').translate(0, 0.25, 0.02).rotateX(s > 0 ? 0.72 : -0.72), x, zemin + 0.34, z), atlas)
  }
}
