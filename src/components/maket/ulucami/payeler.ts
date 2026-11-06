// Ulu Camii maketi: payeler, sivri kemerler ve doğu/batı duvarlarının hat levhaları.
// Pano yazıları, tepelik, kemer bandı ve levhalar arşiv fotoğraflarından gelir (scripts/ulucami_paye_atlas.py);
// kod yazı üretmez. Hangi panonun hangi yüzde, levhanın hangi duvarda durduğu temsilîdir.
// Paye ve kemer anatomisi fotoğraflardan: sıvalı etek, koyu-altın çizgiler, üstte tepelikli pano,
// iki kademeli başlık, kemer alnında bitkisel bant, kemer altında çerçeve çizgisi (ERD05027, ERD05161, 0288, 0334).
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../data/acikYayin'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'
import {
  DUVAR, H, Kova, type Mal, SATIR, SUTUN, YX, YZ, duzGolge, kutuG, px, pz, silindirG, yer,
} from '../ulucamiParca'
import { hafifCihaz } from '../ulucamiZemin'

const ATLAS = 2048
const HUCRE_G = 512 / ATLAS, HUCRE_Y = 1000 / ATLAS, PANO_SAYI = 8
const BANT_H = 128 / ATLAS, CIZGI_V0 = 128 / ATLAS, CIZGI_V1 = 168 / ATLAS
/** Düz boya örnekleri: paye atlasının alt şeridi. */
const BOYA = { siva: 0.125, koyu: 0.375, altin: 0.625 }

const ZEMIN = 0.7, PANO_G = 2.33, PANO_ALT = 3.26, GOVDE_UST = 7.18, PANO_UST = 6.98, ETEK = 1.28
const KEMER_ALT = 7.4, KEMER_TEPE = 12.3, KEMER_KONTROL = 10.2, BANT_EN = 0.62, BASLIK_UST = 7.98

interface Mallar { paye: Mal; bant: Mal; cizgi: Mal; levha: Mal; acik: boolean }

const onbellek = new WeakMap<UlucamiMalzemeleri, Mallar>()

function mallar(m: UlucamiMalzemeleri): Mallar {
  const var_ = onbellek.get(m)
  if (var_) return var_
  let sonuc: Mallar
  if (ACIK_YAYIN) {
    sonuc = {
      paye: new THREE.MeshStandardMaterial({ color: '#f1e8d6', roughness: 0.82, vertexColors: true }),
      bant: m.kemerBant, cizgi: m.koyu,
      levha: new THREE.MeshStandardMaterial({ color: '#2c2620', roughness: 0.6 }),
      acik: true,
    }
  } else {
    const yukleyici = new THREE.TextureLoader()
    const son = hafifCihaz() ? '-k' : ''
    const doku = (ad: string) => {
      const t = yukleyici.load(`/gorseller/ulu-camii/maket/${ad}${son}.jpg`)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      return t
    }
    const levhaT = doku('levha-atlas')
    levhaT.wrapS = THREE.RepeatWrapping
    const levha = new THREE.MeshStandardMaterial({ map: levhaT, roughness: 0.7 })
    sonuc = {
      paye: new THREE.MeshStandardMaterial({ map: doku('paye-atlas'), roughness: 0.82, vertexColors: true }),
      bant: levha, cizgi: levha, levha, acik: false,
    }
  }
  onbellek.set(m, sonuc)
  return sonuc
}

/** Yüksekliğe göre temas gölgesi: yerde ve başlık altında koyulaşır. Doku yerine köşe rengi: dikiş olmaz. */
function golge(y: number) {
  if (y < 1.5) return THREE.MathUtils.lerp(0.72, 0.98, THREE.MathUtils.smoothstep(y, ZEMIN, 1.5))
  if (y > 6.4) return THREE.MathUtils.lerp(1, 0.84, THREE.MathUtils.smoothstep(y, 6.4, GOVDE_UST))
  return 1
}

const AO_SIRA = [ZEMIN, 0.9, 1.1, 1.3, 1.5, 6.4, 6.7, 7, GOVDE_UST]

/**
 * +z'ye bakan dikdörtgen (x0-x1, y0-y1), z yüzünde. Yükseklik AO sırasına bölünür.
 * uv: (u0, v0) sol alt, (u1, v1) sağ üst. renk: payeye özgü köşe rengi eklensin mi.
 */
function yuz(x0: number, x1: number, y0: number, y1: number, z: number, u0: number, u1: number, v0: number, v1: number, renk: boolean) {
  const ys = [y0, ...AO_SIRA.filter((a) => a > y0 && a < y1), y1]
  const konum: number[] = [], nor: number[] = [], uv: number[] = [], kr: number[] = []
  const ekle = (x: number, y: number) => {
    konum.push(x, y, z); nor.push(0, 0, 1)
    uv.push(u0 + ((x - x0) / (x1 - x0)) * (u1 - u0), v0 + ((y - y0) / (y1 - y0)) * (v1 - v0))
    const a = golge(y)
    kr.push(a, a, a)
  }
  for (let n = 0; n < ys.length - 1; n++) {
    const a = ys[n], b = ys[n + 1]
    ekle(x0, a); ekle(x1, a); ekle(x1, b)
    ekle(x0, a); ekle(x1, b); ekle(x0, b)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  if (renk) g.setAttribute('color', new THREE.Float32BufferAttribute(kr, 3))
  return g
}

const kolon = (r: number, r2: number, h: number, y: number) => duzGolge(silindirG(r2 * Math.SQRT2, r * Math.SQRT2, h, 4).rotateY(Math.PI / 4)).translate(0, y + h / 2, 0)

/** İki kademeli başlık, paye merkezine göre (x,z). Fotoğraflarda: boyun, eğimli geçiş, geniş tabla, pah. */
function baslik(k: Kova, m: UlucamiMalzemeleri, x: number, z: number) {
  k.ekle(yer(kolon(1.53, 1.53, 0.13, GOVDE_UST), x, 0, z), m.ic)
  k.ekle(yer(kolon(1.53, 1.74, 0.24, GOVDE_UST + 0.13), x, 0, z), m.ic)
  k.ekle(yer(kolon(1.74, 1.74, 0.36, GOVDE_UST + 0.37), x, 0, z), m.ic)
  k.ekle(yer(kolon(1.74, 1.66, 0.07, GOVDE_UST + 0.73), x, 0, z), m.ic)
}

export function payeleriKur(m: UlucamiMalzemeleri, k: Kova) {
  const g = mallar(m)
  const boya = (u: number) => [u, u, 0.012, 0.012] as const
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++) {
    const x = px(i), z = pz(j)
    for (let f = 0; f < 4; f++) {
      const a = f * Math.PI / 2
      const ek = (x0: number, x1: number, y0: number, y1: number, ofs: number, u: readonly number[]) =>
        k.ekle(yer(yuz(x0, x1, y0, y1, 1.5 + ofs, u[0], u[1], u[2], u[3], true), x, 0, z, a), g.paye)
      // Sıva gövde (yerden başlık altına)
      ek(-1.5, 1.5, ZEMIN, GOVDE_UST, 0, boya(BOYA.siva))
      if (g.acik) continue
      // Yan çizgiler, etek çizgisi, başlık altı çizgi: koyu ve ince altın (ERD05027)
      for (const s of [-1, 1]) {
        const d0 = s * 1.2, d1 = s * 1.32
        ek(Math.min(d0, d1), Math.max(d0, d1), ETEK, GOVDE_UST - 0.2, 0.003, boya(BOYA.koyu))
        const a0 = s * 1.345, a1 = s * 1.37
        ek(Math.min(a0, a1), Math.max(a0, a1), ETEK, GOVDE_UST - 0.2, 0.003, boya(BOYA.altin))
      }
      ek(-1.37, 1.37, ETEK, ETEK + 0.1, 0.004, boya(BOYA.koyu))
      ek(-1.37, 1.37, ETEK + 0.125, ETEK + 0.15, 0.004, boya(BOYA.altin))
      ek(-1.5, 1.5, GOVDE_UST - 0.14, GOVDE_UST - 0.05, 0.004, boya(BOYA.koyu))
      ek(-1.5, 1.5, GOVDE_UST - 0.19, GOVDE_UST - 0.165, 0.004, boya(BOYA.altin))
      // Pano: atlastan. Sıra, komşu yüzlerde aynı yazı gelmeyecek biçimde.
      const n = (i * 3 + j * 5 + f * 3) % PANO_SAYI
      const u0 = (n % 4) * HUCRE_G, v1 = 1 - Math.floor(n / 4) * HUCRE_Y
      ek(-PANO_G / 2, PANO_G / 2, PANO_ALT, PANO_UST, 0.002, [u0, u0 + HUCRE_G, v1 - HUCRE_Y, v1])
    }
    baslik(k, m, x, z)
    // Başlığın üstünde paye kalkmaz: kemer duvarları haç biçiminde birleşir, araları kubbeye geçer.
    const uy = (H + BASLIK_UST - 0.3) / 2, uh = H - BASLIK_UST + 0.3
    k.ekle(yer(kutuG(2, uh, 3), x, uy, z), m.ic)
    k.ekle(yer(kutuG(3, uh, 2), x, uy, z), m.ic)
  }
  // Duvara oturan kemer ayakları: başlık yarısı. Kıble ortasındaki iki ayak madalyonlara değmesin diye yok.
  const duvarBaslik = (x: number, z: number, ry: number) => {
    const ek = (geo: THREE.BufferGeometry) => k.ekle(yer(geo, x, 0, z, ry), m.ic)
    ek(kutuG(3.06, 0.13, 0.08).translate(0, GOVDE_UST + 0.065, 0.04))
    ek(kutuG(3.3, 0.24, 0.2).translate(0, GOVDE_UST + 0.25, 0.1))
    ek(kutuG(3.48, 0.43, 0.3).translate(0, GOVDE_UST + 0.585, 0.15))
  }
  for (let j = 1; j < SATIR; j++) for (const s of [-1, 1]) duvarBaslik(s * (YX - DUVAR), pz(j), s > 0 ? -Math.PI / 2 : Math.PI / 2)
  for (let i = 1; i < SUTUN; i++) {
    duvarBaslik(px(i), -YZ + DUVAR, 0)
    if (i !== 2 && i !== 3) duvarBaslik(px(i), YZ - DUVAR, Math.PI)
  }
}

/** Kemer eğrisi: sol ayaktan tepeye (t 0-1) ikinci derece Bezier. */
function egriNokta(o: number, t: number, sag: boolean) {
  const a = 1 - t
  const nx = a * a * -o + 2 * a * t * -o + 0
  const ny = a * a * KEMER_ALT + 2 * a * t * KEMER_KONTROL + t * t * KEMER_TEPE
  const tx = 2 * a * 0 + 2 * t * o, ty = 2 * a * (KEMER_KONTROL - KEMER_ALT) + 2 * t * (KEMER_TEPE - KEMER_KONTROL)
  const L = Math.hypot(tx, ty) || 1
  // İç normal (kemer merkezine doğru) ve dış normal aynı doğruda
  const icx = ty / L, icy = -tx / L
  return sag ? { x: -nx, y: ny, tx: tx / L, ty: ty / L, icx: -icx, icy } : { x: nx, y: ny, tx: tx / L, ty: ty / L, icx, icy }
}

function bosGeo(konum: number[], nor: number[], uv: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

const ADIM = 24

/** Kemer alnında bant: iç kenardan dışa BANT_EN genişlikte şerit. Fotoğraftaki boya, u boyuna tekrar eder. */
function bantG(o: number, z: number, onYuz: boolean, acik: boolean) {
  const konum: number[] = [], nor: number[] = [], uv: number[] = []
  const tekrar = BANT_EN * 16 // atlas şeridinin boyu (metre): 2048x128
  const nz = onYuz ? 1 : -1
  for (const sag of [false, true]) {
    let s = 0
    for (let n = 0; n < ADIM; n++) {
      const a = egriNokta(o, n / ADIM, sag), b = egriNokta(o, (n + 1) / ADIM, sag)
      const uz = Math.hypot(b.x - a.x, b.y - a.y)
      const u0 = s / tekrar, u1 = (s + uz) / tekrar
      s += uz
      const [v0, v1] = acik ? [0, BANT_EN] : [1 - BANT_H + 0.001, 1 - 0.001]
      const dA = { x: a.x - a.icx * BANT_EN, y: a.y - a.icy * BANT_EN }, dB = { x: b.x - b.icx * BANT_EN, y: b.y - b.icy * BANT_EN }
      const ic0 = [a.x, a.y, z], ic1 = [b.x, b.y, z], d0 = [dA.x, dA.y, z], d1 = [dB.x, dB.y, z]
      const uv0 = [u0, v0], uv1 = [u1, v0], uv2 = [u1, v1], uv3 = [u0, v1]
      // Sol yarıda yol saat yönünde; sağ yarıda ters. Sarım normal yönüyle uyumlu olmalı.
      const duz = sag ? onYuz : !onYuz
      const dizi = duz ? [ic0, d0, d1, ic0, d1, ic1] : [ic0, d1, d0, ic0, ic1, d1]
      const uvd = duz ? [uv0, uv3, uv2, uv0, uv2, uv1] : [uv0, uv2, uv3, uv0, uv1, uv2]
      for (let q = 0; q < 6; q++) { konum.push(...dizi[q]); nor.push(0, 0, nz); uv.push(...uvd[q]) }
    }
  }
  return bosGeo(konum, nor, uv)
}

/** Kemer altı çerçeve çizgisi: iki kenar boyunca şerit, ayakta enine çizgiyle kapanır. */
function kemerAltG(o: number, acik: boolean) {
  const konum: number[] = [], nor: number[] = [], uv: number[] = []
  const Z0 = 0.74, Z1 = 0.9, OFS = 0.012
  // Başlığın üstünden başla
  let t0 = 0
  while (egriNokta(o, t0, false).y < BASLIK_UST + 0.06 && t0 < 0.5) t0 += 0.005
  const [v0, v1] = acik ? [0, 1] : [1 - CIZGI_V1, 1 - CIZGI_V0]
  const kose = (a: ReturnType<typeof egriNokta>, z: number, u: number, v: number) => {
    konum.push(a.x + a.icx * OFS, a.y + a.icy * OFS, z)
    nor.push(a.icx, a.icy, 0)
    uv.push(u, v)
  }
  for (const sag of [false, true]) {
    for (const s of [-1, 1]) {
      const zi = s * Z0, zd = s * Z1
      for (let n = 0; n < ADIM; n++) {
        const a = egriNokta(o, t0 + ((1 - t0) * n) / ADIM, sag), b = egriNokta(o, t0 + ((1 - t0) * (n + 1)) / ADIM, sag)
        const u0 = n * 0.1, u1 = (n + 1) * 0.1
        // Normal aşağıya: sarım kemerin yarısına ve z yanına göre değişir
        const ters = (s > 0) !== sag
        if (ters) {
          kose(a, zi, u0, v0); kose(b, zi, u1, v0); kose(b, zd, u1, v1)
          kose(a, zi, u0, v0); kose(b, zd, u1, v1); kose(a, zd, u0, v1)
        } else {
          kose(a, zi, u0, v0); kose(b, zd, u1, v1); kose(b, zi, u1, v0)
          kose(a, zi, u0, v0); kose(a, zd, u0, v1); kose(b, zd, u1, v1)
        }
      }
    }
    // Ayakta enine çizgi
    const a = egriNokta(o, t0, sag), b = egriNokta(o, t0 + 0.035, sag)
    const ters = sag
    if (ters) {
      kose(a, -Z1, 0, v0); kose(a, Z1, 1, v0); kose(b, Z1, 1, v1)
      kose(a, -Z1, 0, v0); kose(b, Z1, 1, v1); kose(b, -Z1, 0, v1)
    } else {
      kose(a, -Z1, 0, v0); kose(b, Z1, 1, v1); kose(a, Z1, 1, v0)
      kose(a, -Z1, 0, v0); kose(b, -Z1, 0, v1); kose(b, Z1, 1, v1)
    }
  }
  return bosGeo(konum, nor, uv)
}

/** Kemer dolgusu: ExtrudeGeometry, eğri daha sık bölünür. */
function dolguG(o: number) {
  const s = new THREE.Shape()
  s.moveTo(-o, KEMER_ALT)
  s.quadraticCurveTo(-o, KEMER_KONTROL, 0, KEMER_TEPE)
  s.quadraticCurveTo(o, KEMER_KONTROL, o, KEMER_ALT)
  s.lineTo(o, H); s.lineTo(-o, H); s.closePath()
  return new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: false, curveSegments: ADIM }).translate(0, 0, -1)
}

export function kemerleriKur(m: UlucamiMalzemeleri, k: Kova) {
  const g = mallar(m)
  const kemer = (a: number, b: number, sabit: number, xBoyunca: boolean) => {
    const o = (b - a) / 2, orta = (a + b) / 2
    const ry = xBoyunca ? 0 : Math.PI / 2
    const [x, z] = xBoyunca ? [orta, sabit] : [sabit, orta]
    k.ekle(yer(dolguG(o), x, 0, z, ry), m.ic)
    k.ekle(yer(bantG(o, 1.006, true, g.acik), x, 0, z, ry), g.bant)
    k.ekle(yer(bantG(o, -1.006, false, g.acik), x, 0, z, ry), g.bant)
    k.ekle(yer(kemerAltG(o, g.acik), x, 0, z, ry), g.cizgi)
  }
  for (let j = 1; j < SATIR; j++) for (let i = 0; i < SUTUN; i++)
    kemer(i === 0 ? -YX + DUVAR : px(i) + 1.5, i === SUTUN - 1 ? YX - DUVAR : px(i + 1) - 1.5, pz(j), true)
  for (let i = 1; i < SUTUN; i++) for (let j = 0; j < SATIR; j++)
    kemer(j === 0 ? -YZ + DUVAR : pz(j) + 1.5, j === SATIR - 1 ? YZ - DUVAR : pz(j + 1) - 1.5, px(i), false)
}

/** Atlastaki levha dikdörtgenleri (piksel, scripts/ulucami_paye_atlas.py çıktısı). */
const LEVHA = {
  galib: [0, 190, 1400, 559],
  zikr: [93, 800, 1213, 450],
  hasm: [15, 1260, 1370, 500],
  zafer: [1410, 178, 638, 414],
  kuran: [1410, 662, 638, 505],
}

/** Eğik asılı hat levhası (ic-mekan-uzun.jpg'deki gibi üstü öne yatık). +z odaya bakar; x,y,z duvar yüzü. */
function levhaAs(k: Kova, m: UlucamiMalzemeleri, l: Mallar, r: readonly number[], g: number, h: number, x: number, y: number, z: number, ry: number) {
  const EGIM = 0.1
  const ekle = (geo: THREE.BufferGeometry, mal: Mal) => {
    geo.rotateX(EGIM)
    // Eğik çerçevenin üst arka köşesi de sıvanın önünde kalır.
    geo.translate(0, y, ((h + 0.14) / 2) * Math.sin(EGIM) + 0.09 * Math.cos(EGIM) + 0.035)
    k.ekle(yer(geo, x, 0, z, ry), mal)
  }
  ekle(kutuG(g + 0.14, h + 0.14, 0.09).translate(0, 0, -0.045), m.ceviz)
  const yuzey = new THREE.PlaneGeometry(g, h)
  if (!l.acik) {
    const uv = yuzey.attributes.uv
    for (let n = 0; n < uv.count; n++) {
      uv.setXY(n, (r[0] + uv.getX(n) * r[2]) / ATLAS, 1 - (r[1] + (1 - uv.getY(n)) * r[3]) / ATLAS)
    }
  }
  ekle(yuzey.translate(0, 0, 0.004), l.levha)
  // Askı zincirleri
  for (const s of [-1, 1]) {
    const boy = 0.42
    k.ekle(yer(silindirG(0.012, 0.012, boy, 5).rotateX(-0.42).translate(s * g * 0.36, y + (h / 2) * Math.cos(EGIM) + boy * 0.42, (h / 2) * Math.sin(EGIM) * 1.2), x, 0, z, ry), m.bronz)
  }
}

/** Doğu ve batı duvarı levhaları: üst pencerelerin altında, alt nişlerin üstünde (0288). Duvar seçimi temsilî. */
export function doguBatiLevhalari(m: UlucamiMalzemeleri, k: Kova) {
  const l = mallar(m)
  const dogu = YX - DUVAR - 0.02, bati = -YX + DUVAR + 0.02
  const Y = 5.75
  const orantili = (r: readonly number[], g: number) => g * (r[3] / r[2])
  const yerles: [readonly number[], number, number, number, number][] = [
    // Çerçeveler, iki pencere tepeliği arasındaki yaklaşık 4.35 m boşluğa sığar.
    [LEVHA.galib, 3.8, dogu, pz(2.5), -Math.PI / 2],
    [LEVHA.hasm, 3.8, dogu, pz(3.5), -Math.PI / 2],
    [LEVHA.zikr, 3.8, bati, pz(2.5), Math.PI / 2],
    [LEVHA.kuran, 2.4, bati, pz(3.5), Math.PI / 2],
    [LEVHA.zafer, 2.8, bati, pz(0.5), Math.PI / 2],
  ]
  for (const [r, g, x, z, ry] of yerles) levhaAs(k, m, l, r, g, orantili(r, g), x, Y, z, ry)
}
