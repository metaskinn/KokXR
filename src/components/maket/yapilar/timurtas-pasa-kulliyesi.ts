// Timurtaş Paşa Külliyesi temsilî maketi. Cami planı ve ölçüleri Ayverdi 1989'daki plandan (Kahraman 2025, Şekil 4);
// örtü düzeni, minare ve hamam ölçüleri Vakıf Eserleri Envanteri'nden (s. 216-220); yükseklikler, süsleme ve
// yerleşim fotoğraflara bakılarak yorumlandı. Birim metre. Kuzey = -z, kıble = +z, doğu = +x.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../data/acikYayin'
import type { Maket } from '../ulucamiMaket'
import type { IcDurak, IcYurume, Kutu, ZeminAlani } from '../ulucamiIc'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, uvSigdir, yer } from '../ulucamiParca'
import {
  almasikDokusu, ciniDokusu, icDuvarDokusu, kesmeTasDokusu, kiremitDokusu, mezarTasiDokusu, mihrapYedekDokusu, molozDokusu,
  parkeDokusu, rozetDokusu, tasDosemeDokusu, tuglaDokusu,
} from './timurtas-pasa-kulliyesi-parcalar/dokular'

/** Külliye sahne ortasına otursun diye tüm geometri x'te kaydırılır; plan ölçüleri kaymasız yazılır. */
const OX = 16
const IC = 0.45, EYVAN = 0.95, GOZ = 1.62, SACAK = 8.4
// Plan: cephe 20,98 m; son cemaat, kubbeli orta mekân (yaklaşık 6 m), yanlarda zaviyeler, mihrap önünde tonozlu eyvan.
const E = 10.5, ON = -9.5, SC_IC = -8.3, SC_ARKA = -4.23, ORTA_K = -2.87, ORTA_G = 3.05, ORTA_X = 3.05
const KANAT_IC_X = 4.04, KANAT_G_IC = 4.62, KANAT_G = 5.8, EYVAN_X = 2.87, EYVAN_DIS = 4.16, EYVAN_ICG = 10.14, EYVAN_G = 11.14
const MIN_X = 8, MIN_Z = -25, MIN_R = 3.7

type Mal = THREE.Material
type P2 = [number, number]

interface Aciklik {
  u: number; g: number; y0: number; duz: number; kh: number
  tur: 'kapi' | 'pencere' | 'cam' | 'kafes'
  /** Dış yüzde büyük kör kemer ve çini alınlık. */
  kor?: boolean
  rozet?: boolean
}

function kemerNoktalari(cx: number, y0: number, g: number, duz: number, kh: number, n: number) {
  const o = g / 2, b = y0 + duz, tepe = b + kh, kon = b + kh * 0.55, s: P2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = 1 - t
    s.push([a * a * -o + 2 * a * t * -o, a * a * b + 2 * a * t * kon + t * t * tepe])
  }
  for (let i = n - 1; i >= 0; i--) s.push([-s[i][0], s[i][1]])
  return s.map(([x, y]): P2 => [x + cx, y])
}

/** Dünyaya yerleşmiş yüzeyin UV'si normaline göre metreden: taş sıraları bütün duvarlarda aynı hizada kalır. */
function uvDunya<G extends THREE.BufferGeometry>(g: G) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i))
    if (ny > 0.7) uv.setXY(i, p.getX(i), p.getZ(i))
    else if (nx > nz) uv.setXY(i, p.getZ(i), p.getY(i))
    else uv.setXY(i, p.getX(i), p.getY(i))
  }
  return g
}

/** Üçgenlerden düz gölgeli yüzey; normaller yukarı dönük olsun diye sıra düzeltilir. */
function ucgenler(liste: [THREE.Vector3, THREE.Vector3, THREE.Vector3][]) {
  const konum: number[] = [], uv: number[] = []
  for (const t of liste) {
    const [a, b0, c0] = t
    const yukari = b0.clone().sub(a).cross(c0.clone().sub(a)).y >= 0
    const b = yukari ? b0 : c0, c = yukari ? c0 : b0
    for (const v of [a, b, c]) { konum.push(v.x, v.y, v.z); uv.push(v.x + v.y * 0.4, v.z + v.y * 0.4) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Kırma çatı: mahya uzun kenar boyunca. */
function kirma(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) {
  const a = V(x0, y0, z0), b = V(x1, y0, z0), c = V(x1, y0, z1), d = V(x0, y0, z1)
  const gx = x1 - x0, gz = z1 - z0
  if (gz >= gx) {
    const p = V((x0 + x1) / 2, y1, z0 + gx / 2), q = V((x0 + x1) / 2, y1, z1 - gx / 2)
    return ucgenler([[a, b, p], [b, c, q], [b, q, p], [c, d, q], [d, a, p], [d, p, q]])
  }
  const p = V(x0 + gz / 2, y1, (z0 + z1) / 2), q = V(x1 - gz / 2, y1, (z0 + z1) / 2)
  return ucgenler([[d, a, p], [a, b, q], [a, q, p], [b, c, q], [c, d, p], [c, p, q]])
}

/** z yönünde uzanan yarım silindir tonoz. */
function tonoz(x: number, R: number, z0: number, z1: number, y: number) {
  return new THREE.CylinderGeometry(R, R, z1 - z0, 28, 1, true, -Math.PI / 2, Math.PI)
    .rotateX(-Math.PI / 2).translate(x, y, (z0 + z1) / 2)
}

export const yapi = (): Maket => {
  const m = ulucamiMalzemeleri()
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...p })
  const al = almasikDokusu(), tg = tuglaDokusu(), ml = molozDokusu()
  const almasik = pbr({ map: al.renk, bumpMap: al.kabartma, bumpScale: 0.9, roughness: 0.92 })
  const tugla = pbr({ map: tg.renk, bumpMap: tg.kabartma, bumpScale: 0.9, roughness: 0.9, side: THREE.DoubleSide })
  const moloz = pbr({ map: ml.renk, bumpMap: ml.kabartma, bumpScale: 1.3, roughness: 0.95 })
  const koseTasi = pbr({ color: '#b6a98f', roughness: 0.9 })
  const icDuvar = pbr({ map: icDuvarDokusu(), color: '#a3a197', roughness: 0.92 })
  const icSiva = pbr({ color: '#9f9d92', roughness: 0.92, side: THREE.DoubleSide })
  const sonCemaatSiva = pbr({ color: '#baB29f', roughness: 0.9, side: THREE.DoubleSide })
  const pembe = pbr({ color: '#d4a48c', roughness: 0.9 })
  const cini = pbr({ map: ciniDokusu(), roughness: 0.7 })
  const kiremit = pbr({ map: kiremitDokusu(), roughness: 0.8 })
  const camDis = new THREE.MeshStandardMaterial({ color: '#223039', roughness: 0.16, metalness: 0.7, transparent: true, opacity: 0.86 })
  const camIc = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 1.06, 1.2), transparent: true })
  const gokIsik = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.3, 2.4), side: THREE.DoubleSide })
  const beyazDograma = pbr({ color: '#e9e6dd', roughness: 0.6 })
  const ahsapAcik = pbr({ color: '#9b5a2a', roughness: 0.55 })
  const demir = pbr({ color: '#1d1f20', roughness: 0.55, metalness: 0.5 })
  const hali = m.haliSade.clone()
  hali.color = new THREE.Color('#14748f')
  const dosemeIc = pbr({ map: tasDosemeDokusu(13, [[196, 190, 174], [182, 176, 160], [208, 200, 184]], [128, 122, 110]), roughness: 0.75 })
  const meydan = pbr({ map: tasDosemeDokusu(29, [[83, 90, 95], [99, 105, 108], [66, 74, 80], [112, 112, 108]], [150, 146, 134]), roughness: 0.82 })
  const avluTas = pbr({ map: tasDosemeDokusu(41, [[92, 92, 84], [104, 102, 92], [84, 84, 78]], [66, 66, 60]), roughness: 0.92 })
  const parke = pbr({ map: parkeDokusu(), roughness: 0.9 })
  const yesil = pbr({ color: '#47663a', roughness: 1 })
  const yaprak = pbr({ color: '#5f8a3d', roughness: 1 })
  const yaprakKoyu = pbr({ color: '#4a7334', roughness: 1 })
  const govdeAgac = pbr({ color: '#4d3f33', roughness: 1 })
  const mezarKoyu = pbr({ map: mezarTasiDokusu('#585b57', '#3b3e3b', '#83867e', 5), roughness: 0.95 })
  const mezarAcik = pbr({ map: mezarTasiDokusu('#a9a697', '#7f7c6f', '#c9c6b6', 9), roughness: 0.95 })
  const kaideTas = pbr({ color: '#b4b0a2', roughness: 0.95 })
  const rozet = pbr({ map: rozetDokusu(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })
  rozet.map!.colorSpace = THREE.SRGBColorSpace
  const fotoMihrap = (() => {
    if (ACIK_YAYIN) return null
    const f = new THREE.TextureLoader().load('/gorseller/timurtas-pasa-kulliyesi/maket/mihrap.jpg')
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  })()
  const mihrapYuz = pbr({ map: fotoMihrap ?? mihrapYedekDokusu(), roughness: 0.5, metalness: 0.1 })

  const hamamSiva = pbr({ color: '#8e897b', roughness: 0.95, side: THREE.DoubleSide })
  const kundekariSik = m.kundekari.clone()
  if (m.kundekari.map) { const t = m.kundekari.map.clone(); t.repeat.multiplyScalar(2.6); t.needsUpdate = true; kundekariSik.map = t }
  const hazneMermer = pbr({ map: m.mermer.map, color: '#ded9cc', roughness: 0.42 })
  const k = new Kova(), kCati = new Kova(), kKubbe = new Kova(), kMinare = new Kova()
  const kutular: Kutu[] = [], gorusKesenler: Kutu[] = []
  const daireler: { x: number; z: number; r: number; ust?: number }[] = []
  const zeminler: ZeminAlani[] = []
  const kutu = (g: number, h: number, d: number, mal: Mal, x: number, y: number, z: number, kv = k) => kv.ekle(yer(kutuG(g, h, d), x, y, z), mal)
  const kutuD = (g: number, h: number, d: number, mal: Mal, x: number, y: number, z: number, kv = k) => kv.ekle(uvDunya(yer(new THREE.BoxGeometry(g, h, d), x, y, z)), mal)
  const engel = (x0: number, x1: number, z0: number, z1: number) => kutular.push({ x0, x1, z0, z1 })

  /** Plandaki bir duvar: a'dan b'ye giderken +Z yerel yönü içeriyi gösterir. Dış, gövde ve iç üç katmandır. */
  const yerel = (ax: number, az: number, bx: number, bz: number) => {
    const L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L
    return { L, dx, dz, mat: new THREE.Matrix4().makeBasis(V(dx, 0, dz), V(0, 1, 0), V(-dz, 0, dx)).setPosition(ax, 0, az) }
  }
  const acikYol = (a: Aciklik) => a.kh > 0
    ? kemer(new THREE.Path(), a.u, a.y0, a.g, a.duz, a.kh)
    : dikdortgen(a.u - a.g / 2, a.y0, a.u + a.g / 2, a.y0 + a.duz) as unknown as THREE.Path
  const korOlcu = (a: Aciklik) => ({ g: a.g + 1.5, y0: 0.55, duz: a.y0 + a.duz + 0.65 - 0.55, kh: 1.75 })
  /** Kemer yüzünde sırayla tuğla ve taş dizilen, duvardan hafif çıkan halka. */
  const kemerHalka = (ek: (g: THREE.BufferGeometry, mal: Mal, world?: boolean) => void, cx: number, y0: number, g: number, duz: number, kh: number, t: number, z: number, d: number) => {
    const n = 8, ic = kemerNoktalari(cx, y0, g, duz, kh, n), dis = kemerNoktalari(cx, y0, g + 2 * t, duz, kh + t * 1.15, n)
    for (let i = 0; i < ic.length - 1; i++) {
      const s = new THREE.Shape()
      s.moveTo(ic[i][0], ic[i][1]); s.lineTo(ic[i + 1][0], ic[i + 1][1]); s.lineTo(dis[i + 1][0], dis[i + 1][1]); s.lineTo(dis[i][0], dis[i][1]); s.closePath()
      ek(cikar(s, d, z), i % 2 ? tugla : koseTasi, true)
    }
  }

  const duvar = (ax: number, az: number, bx: number, bz: number, kalin: number, h: number, disMal: Mal, icMal: Mal, acik: Aciklik[] = [], secenek: { carp?: boolean; govdeMal?: Mal; kv?: Kova } = {}) => {
    const { L, dx, dz, mat } = yerel(ax, az, bx, bz)
    const kv = secenek.kv ?? k
    const ek = (g: THREE.BufferGeometry, mal: Mal, dunyaUv = true) => {
      g.applyMatrix4(mat)
      if (dunyaUv) uvDunya(g)
      kv.ekle(g, mal)
    }
    const dD = Math.min(0.3, kalin * 0.3), dI = 0.12
    const dis = dikdortgen(0, -0.2, L, h), gov = dikdortgen(0, -0.2, L, h), ics = dikdortgen(0, -0.2, L, h)
    for (const a of acik) {
      gov.holes.push(acikYol(a)); ics.holes.push(acikYol(a))
      if (a.kor) {
        const o = korOlcu(a)
        dis.holes.push(kemer(new THREE.Path(), a.u, o.y0, o.g, o.duz, o.kh))
      } else dis.holes.push(acikYol(a))
    }
    ek(cikar(dis, dD, 0), disMal)
    // Pencere boşluğunun dış yarısı dış malzeme, iç yarısı sıva: içeriden bakınca tuğla görünmez.
    const zOrta = Math.max(kalin * 0.45, dD + 0.02)
    const gov2 = dikdortgen(0, -0.2, L, h)
    for (const a of acik) gov2.holes.push(acikYol(a))
    ek(cikar(gov, zOrta - dD, dD), secenek.govdeMal ?? disMal)
    ek(cikar(gov2, kalin - dI - zOrta, zOrta), secenek.govdeMal ?? icMal)
    ek(cikar(ics, dI, kalin - dI), icMal)
    const zc = kalin * 0.45
    for (const a of acik) {
      const top = a.y0 + a.duz + a.kh
      if (a.kor) {
        const o = korOlcu(a)
        kemerHalka(ek, a.u, o.y0, o.g, o.duz, o.kh, 0.42, -0.05, 0.1)
        // Pencere üstündeki alçak kemer ve çini alınlık
        const ky = a.y0 + a.duz + 0.03, kg = a.g + 0.12, kh = 0.95
        const al = new THREE.ShapeGeometry(kemer(new THREE.Shape(), a.u, ky, kg, 0, kh), 10).translate(0, 0, dD - 0.01)
        ek(al, cini)
        kemerHalka(ek, a.u, ky, kg, 0, kh, 0.26, dD - 0.14, 0.13)
        // Duvar yüzüne dönük kör kemer tabanı ve söve
        for (const s of [-1, 1]) {
          const y1 = a.y0 + a.duz + 0.03
          ek(kutuG(0.2, y1 - o.y0, dD).translate(a.u + s * (o.g / 2 - 0.1), (y1 + o.y0) / 2, dD / 2 - 0.01), koseTasi, false)
        }
        ek(kutuG(o.g, 0.16, dD + 0.06).translate(a.u, o.y0 + 0.08, dD / 2 - 0.02), koseTasi, false)
      }
      if (a.tur === 'kapi') continue
      const sekil = () => a.kh > 0 ? kemer(new THREE.Shape(), 0, a.y0, a.g, a.duz, a.kh) : dikdortgen(-a.g / 2, a.y0, a.g / 2, a.y0 + a.duz)
      if (a.tur !== 'kafes') {
        ek(new THREE.ShapeGeometry(sekil(), 12).translate(a.u, 0, zc), camIc, false)
        ek(new THREE.ShapeGeometry(sekil(), 12).rotateY(Math.PI).translate(a.u, 0, zc - 0.02), camDis, false)
      }
      // Parmaklık veya doğrama
      const cubuk = a.tur === 'cam' ? beyazDograma : demir
      const yy = a.kh > 0 ? kemerNoktalari(a.u, a.y0, a.g, a.duz, a.kh, 12) : []
      const tepeX = (x: number) => { let en = a.y0 + a.duz; for (let i = 0; i < yy.length - 1; i++) { const [x0, y0] = yy[i], [x1, y1] = yy[i + 1]; if ((x0 - x) * (x1 - x) <= 0 && x1 !== x0) en = y0 + (y1 - y0) * ((x - x0) / (x1 - x0)) } return en }
      const yanX = (y: number) => { if (y <= a.y0 + a.duz || !yy.length) return a.g / 2; for (let i = 0; i < 12; i++) if (yy[i][1] <= y && yy[i + 1][1] >= y) return a.u - yy[i][0] - (a.u - yy[i][0] - (a.u - yy[i + 1][0])) * ((y - yy[i][1]) / (yy[i + 1][1] - yy[i][1])); return 0 }
      const adimX = a.tur === 'cam' ? 0.42 : 0.2, adimY = a.tur === 'cam' ? 0.42 : 0.2, kal = a.tur === 'cam' ? 0.045 : 0.022
      const adet = Math.floor(a.g / adimX)
      for (let i = 1; i < adet; i++) {
        const x = a.u - a.g / 2 + (i * a.g) / adet, ust = tepeX(x)
        if (ust > a.y0 + 0.02) for (const zb of [zc - 0.05, zc + 0.03]) ek(kutuG(kal, ust - a.y0, kal).translate(x, (ust + a.y0) / 2, zb), cubuk, false)
      }
      for (let y = a.y0 + adimY; y < top - 0.05; y += adimY) {
        const o = yanX(y)
        if (o > 0.03) for (const zb of [zc - 0.05, zc + 0.03]) ek(kutuG(o * 2, kal, kal).translate(a.u, y, zb), cubuk, false)
      }
      // Kör kemerli pencere: iç yüzde ahşap söve (fotoğrafa göre)
      if (a.tur === 'pencere' || a.tur === 'kafes') {
        const z = kalin + 0.02
        ek(kutuG(a.g + 0.3, 0.14, 0.1).translate(a.u, top + 0.06, z), ahsapAcik, false)
        ek(kutuG(a.g + 0.3, 0.14, 0.1).translate(a.u, a.y0 - 0.06, z), ahsapAcik, false)
        for (const s of [-1, 1]) ek(kutuG(0.14, top - a.y0 + 0.24, 0.1).translate(a.u + s * (a.g / 2 + 0.08), (top + a.y0) / 2, z), ahsapAcik, false)
        if (a.rozet) ek(new THREE.PlaneGeometry(0.95, 0.95).translate(a.u, top + 0.85, kalin + 0.012), rozet, false)
      }
    }
    if (secenek.carp !== false) {
      // Kapı boşlukları dışında duvar çarpışma kutusudur; aynı kutular bakışı da keser.
      const araliklar = acik.filter((a) => a.tur === 'kapi').map((a) => [a.u - a.g / 2, a.u + a.g / 2]).sort((p, q) => p[0] - q[0])
      let s = 0
      const parca = (u0: number, u1: number) => {
        if (u1 - u0 < 0.02) return
        const ptl = [
          [ax + dx * u0, az + dz * u0], [ax + dx * u1, az + dz * u1],
          [ax + dx * u0 - dz * kalin, az + dz * u0 + dx * kalin], [ax + dx * u1 - dz * kalin, az + dz * u1 + dx * kalin],
        ]
        const kut = { x0: Math.min(...ptl.map((p) => p[0])), x1: Math.max(...ptl.map((p) => p[0])), z0: Math.min(...ptl.map((p) => p[1])), z1: Math.max(...ptl.map((p) => p[1])) }
        kutular.push(kut); gorusKesenler.push(kut)
      }
      for (const [u0, u1] of araliklar) { parca(s, u0); s = u1 }
      parca(s, L)
    }
  }

  /** Kirpi saçak: iki sıra testere dişi tuğla ve üstte taş silme (Kahraman 2025). */
  const sacak = (ax: number, az: number, bx: number, bz: number, y: number, kv = k, duvarMal: Mal = tugla) => {
    const { L, mat } = yerel(ax, az, bx, bz)
    const ek = (g: THREE.BufferGeometry, mal: Mal) => { g.applyMatrix4(mat); kv.ekle(g, mal) }
    ek(kutuG(L + 0.1, 0.08, 0.3).translate(L / 2, y - 0.04, -0.06), koseTasi)
    const n = Math.floor(L / 0.28)
    for (let s = 0; s < 2; s++) for (let i = 0; i < n; i++) {
      const u = (i + (s ? 0.5 : 0)) * (L / n) + (L / n) * 0.25
      ek(new THREE.BoxGeometry(0.18, 0.15, 0.18).rotateY(Math.PI / 4).translate(u, y + 0.08 + s * 0.16, -0.06 - s * 0.05), duvarMal)
    }
    ek(kutuG(L + 0.7, 0.1, 0.62).translate(L / 2, y + 0.38, -0.1), koseTasi)
  }

  // --- Zemin ---
  const R_ZEMIN = 53
  const zeminDaire = new THREE.CircleGeometry(R_ZEMIN, 72).rotateX(-Math.PI / 2).translate(-OX, 0.02, 0)
  uvDunya(zeminDaire)
  k.ekle(zeminDaire, avluTas)
  // Demirtaş Caddesi: caminin önünde parke yol, karşısında minare meydanı.
  const yatay = (x0: number, x1: number, z0: number, z1: number, y: number, mal: Mal) => k.ekle(uvDunya(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2)), mal)
  yatay(-59, 34, -19.5, -11, 0.05, parke)
  yatay(-8, 24, -36, -19.5, 0.05, meydan)
  yatay(-59, 34, -11, -10.7, 0.06, koseTasi)
  yatay(-59, 34, -19.8, -19.5, 0.06, koseTasi)
  for (const z of [-30, -27, -24, -21]) for (let x = -7; x < 23; x += 7.5) kutu(5.5, 0.01, 0.2, pembe, x + 2.7, 0.06, z)

  // Yapı sekisi ve iç döşemeler
  kutuD(E * 2 + 0.3, IC, ORTA_K + 9.65, koseTasi, 0, IC / 2, (ON - 0.15 + ORTA_K) / 2)
  kutuD(E * 2 + 0.3, IC, KANAT_G - ORTA_K + 0.2, koseTasi, 0, IC / 2, (ORTA_K + KANAT_G) / 2)
  kutuD(EYVAN_DIS * 2 + 0.3, IC, EYVAN_G - KANAT_G + 0.15, koseTasi, 0, IC / 2, (KANAT_G + EYVAN_G + 0.15) / 2)
  yatay(-E + 1.1, E - 1.1, SC_IC, SC_ARKA, IC + 0.01, dosemeIc)
  yatay(-ORTA_X, ORTA_X, ORTA_K, 2.6, IC + 0.01, hali)
  yatay(KANAT_IC_X, E - 1.1, ORTA_K, KANAT_G_IC, IC + 0.01, hali)
  yatay(-E + 1.1, -KANAT_IC_X, ORTA_K, KANAT_G_IC, IC + 0.01, hali)
  // Eyvan: +0,50 kot, iki basamak (Kahraman 2025).
  kutuD(EYVAN_X * 2, EYVAN - IC, EYVAN_ICG - 3.4, koseTasi, 0, (EYVAN + IC) / 2, (EYVAN_ICG + 3.4) / 2)
  yatay(-EYVAN_X, EYVAN_X, 3.4, EYVAN_ICG, EYVAN + 0.012, hali)
  kutuD(EYVAN_X * 2, 0.25, 0.4, m.icMermer, 0, IC + 0.125, 3.0)
  kutuD(EYVAN_X * 2, 0.5, 0.4, m.icMermer, 0, IC + 0.25, 3.2)
  // Cephe basamakları
  for (const [z, h, d] of [[-10.05, 0.15, 1.1], [-9.95, 0.3, 0.9], [-9.85, 0.45, 0.7]] as const) kutu(5.8, h, d, m.mermer, 0, h / 2, z)

  // --- Duvarlar ---
  const pencere = (u: number, g = 1.2, y0 = 1.25, duz = 1.55, kor = true, rozetli = false): Aciklik => ({ u, g, y0, duz, kh: 0, tur: 'pencere', kor, rozet: rozetli })
  const bay = (u: number, g: number, tepe: number): Aciklik => ({ u, g, y0: 1.15, duz: 2.65, kh: tepe - 3.8, tur: 'cam' })
  // Cephe: 1,33 · 2,36 · 1,09 · 2,50 · 1,07 · 4,30 · 1,06 · 2,49 · 1,07 · 2,39 · 1,33
  const bayU = [1.33 + 1.18, 1.33 + 2.36 + 1.09 + 1.25, 10.495, 10.495 + 2.15 + 1.06 + 1.245, 10.495 + 2.15 + 1.06 + 2.49 + 1.07 + 1.195]
  duvar(-E, ON, E, ON, 1.2, SACAK, almasik, sonCemaatSiva, [
    bay(bayU[0], 2.36, 5.75), bay(bayU[1], 2.5, 5.85),
    { u: bayU[2], g: 4.3, y0: 0, duz: 3.8, kh: 2.85, tur: 'kapi' },
    bay(bayU[3], 2.49, 5.85), bay(bayU[4], 2.39, 5.75),
  ])
  // Cephe kemer halkaları ve pembe izare (fotoğrafa göre)
  const onDuvar = yerel(-E, ON, E, ON)
  const onEk = (g: THREE.BufferGeometry, mal: Mal) => { g.applyMatrix4(onDuvar.mat); uvDunya(g); k.ekle(g, mal) }
  bayU.forEach((u, i) => {
    const orta = i === 2, g = [2.36, 2.5, 4.3, 2.49, 2.39][i], tepe = orta ? 6.65 : i === 0 || i === 4 ? 5.75 : 5.85
    kemerHalka(onEk, u, 0, g, 3.8, tepe - 3.8, orta ? 0.62 : 0.5, -0.09, 0.12)
    if (!orta) { const b = new THREE.BoxGeometry(g - 0.08, 1.15, 0.05).translate(u, 0.575 + 0.3, -0.03); onEk(b, pembe) }
  })
  // Orta göz: kapının iki yanı alçak dolgu, üstü camlı doğrama. Geçiş ortadan.
  for (const s of [-1, 1]) {
    kutu(1.35, 1.2, 0.3, pembe, s * 1.475, 0.6 + 0.3, ON + 0.6)
    engel(s * 0.8 - (s > 0 ? 0 : 1.35), s * 0.8 + (s > 0 ? 1.35 : 0), ON + 0.4, ON + 0.8)
    kutu(0.1, 2.4, 0.14, beyazDograma, s * 0.8, 1.65, ON + 0.6)
  }
  kutu(1.7, 0.12, 0.2, beyazDograma, 0, 2.86, ON + 0.6)
  const ortaCam = new THREE.Shape()
  kemer(ortaCam, 0, 2.9, 4.2, 0.85, 2.85)
  const camO = () => new THREE.ShapeGeometry(ortaCam, 14)
  k.ekle(camO().translate(0, 0, ON + 0.62), camIc)
  k.ekle(camO().rotateY(Math.PI).translate(0, 0, ON + 0.6), camDis)
  for (let i = -4; i <= 4; i++) { const x = i * 0.46, t = Math.max(0, 1 - (Math.abs(x) / 2.1) ** 1.6); kutu(0.05, 0.85 + t * 2.85, 0.05, beyazDograma, x, 2.9 + (0.85 + t * 2.85) / 2, ON + 0.56) }
  for (const y of [2.9, 3.35, 3.75]) kutu(4.2, 0.05, 0.05, beyazDograma, 0, y, ON + 0.56)
  for (let i = 0; i < 6; i++) { const y = 4.2 + i * 0.42, o = 2.1 * Math.max(0, (1 - ((y - 3.75) / 2.85)) ** 0.7); kutu(o * 2, 0.05, 0.05, beyazDograma, 0, y, ON + 0.56) }
  sacak(-E, ON, E, ON, SACAK)

  // Son cemaat uçları, zaviye dış duvarları (doğu ve batı). Plan: her zaviyede iki yan, bir üst pencere.
  duvar(E, ON, E, ORTA_K, 1.1, SACAK, almasik, sonCemaatSiva, [pencere(3.4, 1.15, 1.8, 1.8, false)])
  duvar(-E, ORTA_K, -E, ON, 1.1, SACAK, almasik, sonCemaatSiva, [pencere(3.2, 1.15, 1.8, 1.8, false)])
  duvar(E, ORTA_K, E, KANAT_G, 1.1, SACAK, almasik, icDuvar, [pencere(1.9, 1.26, 1.25, 1.55, true, true), pencere(6.75, 1.26, 1.25, 1.55, true, true)])
  duvar(-E, KANAT_G, -E, ORTA_K, 1.1, SACAK, almasik, icDuvar, [pencere(1.9, 1.26, 1.25, 1.55, true, true), pencere(6.75, 1.26, 1.25, 1.55, true, true)])
  duvar(E, KANAT_G, EYVAN_DIS, KANAT_G, 1.18, SACAK, almasik, icDuvar, [pencere(3.15, 1.26, 1.25, 1.55, true, true)])
  duvar(-EYVAN_DIS, KANAT_G, -E, KANAT_G, 1.18, SACAK, almasik, icDuvar, [pencere(3.15, 1.26, 1.25, 1.55, true, true)])
  // Son cemaat arka duvarı: orta kapı 1,40 m, zaviyelere birer kapı (plan).
  const kapi = (u: number, g: number): Aciklik => ({ u, g, y0: 0, duz: 2.5, kh: 0.9, tur: 'kapi' })
  duvar(-E + 1.1, SC_ARKA, E - 1.1, SC_ARKA, SC_ARKA * -1 + ORTA_K, SACAK, sonCemaatSiva, icDuvar, [kapi(9.4 - 6.9, 1.3), kapi(9.4, 1.4), kapi(9.4 + 6.9, 1.3)])
  // Orta mekân yan duvarları: her yanda birer kapı ve pencere (Kahraman 2025).
  const yanDuvar: Aciklik[] = [kapi(1.3, 1.2), { u: 4.4, g: 1.1, y0: 1.25, duz: 1.3, kh: 0.5, tur: 'kafes' }]
  duvar(KANAT_IC_X, ORTA_K, KANAT_IC_X, ORTA_G, KANAT_IC_X - ORTA_X, SACAK, icDuvar, icDuvar, yanDuvar)
  duvar(-KANAT_IC_X, ORTA_G, -KANAT_IC_X, ORTA_K, KANAT_IC_X - ORTA_X, SACAK, icDuvar, icDuvar, [{ ...yanDuvar[1], u: 1.5 }, { ...yanDuvar[0], u: 4.6 }])
  // Eyvan yan duvarları
  duvar(EYVAN_DIS, ORTA_G, EYVAN_DIS, KANAT_G, EYVAN_DIS - EYVAN_X, SACAK, icDuvar, icDuvar)
  duvar(-EYVAN_DIS, KANAT_G, -EYVAN_DIS, ORTA_G, EYVAN_DIS - EYVAN_X, SACAK, icDuvar, icDuvar)
  duvar(EYVAN_DIS, KANAT_G, EYVAN_DIS, EYVAN_G, EYVAN_DIS - EYVAN_X, SACAK, almasik, icDuvar, [pencere(2.4, 1.3, 1.55, 1.5, true, true)])
  duvar(-EYVAN_DIS, EYVAN_G, -EYVAN_DIS, KANAT_G, EYVAN_DIS - EYVAN_X, SACAK, almasik, icDuvar, [pencere(2.94, 1.3, 1.55, 1.5, true, true)])
  // Kıble duvarı: mihrabın iki yanında ve üstünde pencere (Kahraman 2025).
  duvar(EYVAN_DIS, EYVAN_G, -EYVAN_DIS, EYVAN_G, EYVAN_G - EYVAN_ICG, SACAK, almasik, icDuvar, [
    pencere(EYVAN_DIS - 2.05, 1.05, 1.55, 1.5, true, true),
    { u: EYVAN_DIS, g: 0.95, y0: 5.55, duz: 0.75, kh: 0.5, tur: 'pencere' },
    pencere(EYVAN_DIS + 2.05, 1.05, 1.55, 1.5, true, true),
  ])
  sacak(E, ON, E, KANAT_G, SACAK); sacak(E, KANAT_G, EYVAN_DIS, KANAT_G, SACAK)
  sacak(EYVAN_DIS, KANAT_G, EYVAN_DIS, EYVAN_G, SACAK); sacak(EYVAN_DIS, EYVAN_G, -EYVAN_DIS, EYVAN_G, SACAK)
  sacak(-EYVAN_DIS, EYVAN_G, -EYVAN_DIS, KANAT_G, SACAK); sacak(-EYVAN_DIS, KANAT_G, -E, KANAT_G, SACAK); sacak(-E, KANAT_G, -E, ON, SACAK)

  // Orta mekân ile eyvan arasındaki büyük kemer
  const kemerDuvar = dikdortgen(-ORTA_X, 0.5, ORTA_X, SACAK)
  kemerDuvar.holes.push(kemer(new THREE.Path(), 0, 0.52, EYVAN_X * 2, 4.5, 1.8))
  k.ekle(uvDunya(cikar(kemerDuvar, 0.36, ORTA_G - 0.36)), icDuvar)

  // Son cemaat ara kemerleri
  for (const x of [-6.2, -2.62, 2.62, 6.2]) {
    const s = dikdortgen(SC_IC, 0.5, SC_ARKA, 7)
    s.holes.push(kemer(new THREE.Path(), (SC_IC + SC_ARKA) / 2, 0.52, SC_ARKA - SC_IC, 4.4, 1.3))
    const g = cikar(s, 0.55, -0.27).rotateY(-Math.PI / 2)
    k.ekle(uvDunya(g.translate(x, 0, 0)), sonCemaatSiva)
  }

  // --- Zaviye ve eyvan tonozları, son cemaat örtüsü (Çatı katmanı) ---
  const KX = (KANAT_IC_X + E - 1.1) / 2, KR = (E - 1.1 - KANAT_IC_X) / 2
  for (const s of [-1, 1]) kCati.ekle(tonoz(s * KX, KR, ORTA_K, KANAT_G_IC, 5.28), icSiva)
  kCati.ekle(tonoz(0, EYVAN_X, ORTA_G, EYVAN_ICG, 5.3), icSiva)
  // Tonozların ucundaki alınlıklar duvarla örtülü; eyvanda ahşap gergi kirişi (fotoğrafa göre).
  kutu(EYVAN_X * 2, 0.22, 0.22, pbr({ color: '#e7e3d8', roughness: 0.75 }), 0, 5.25, 7.0)

  // Son cemaat üst örtüsü: ortada Türk üçgenli kubbe, yanlarda küçük kubbeler, uçlarda çapraz tonoz.
  const SC_ORTA = (SC_IC + SC_ARKA) / 2, D_Y = 7
  const tavan = dikdortgen(-E + 1.05, SC_IC - 0.05, E - 1.05, SC_ARKA + 0.05)
  const delik = (x: number, r: number) => { tavan.holes.push(new THREE.Path().absarc(x, SC_ORTA, r, 0, Math.PI * 2, true)) }
  delik(0, 1.85); delik(-4.4, 1.25); delik(4.4, 1.25)
  tavan.holes.push(dikdortgen(-E + 1.25, SC_IC + 0.15, -6.5, SC_ARKA - 0.15) as unknown as THREE.Path)
  tavan.holes.push(dikdortgen(6.5, SC_IC + 0.15, E - 1.25, SC_ARKA - 0.15) as unknown as THREE.Path)
  kCati.ekle(new THREE.ShapeGeometry(tavan, 24).rotateX(Math.PI / 2).translate(0, D_Y, 0), sonCemaatSiva)
  const icKubbe = (x: number, z: number, y: number, r: number, h: number, kv: Kova, mal: Mal) => {
    const p: P2[] = []
    for (let t = 0; t <= 12; t++) { const a = (t / 12) * Math.PI / 2; p.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)]) }
    kv.ekle(yer(dondurG(p, 32, [1, 1]), x, y, z), mal)
  }
  icKubbe(0, SC_ORTA, D_Y, 1.85, 1.6, kCati, sonCemaatSiva)
  icKubbe(-4.4, SC_ORTA, D_Y, 1.25, 1.1, kCati, sonCemaatSiva)
  icKubbe(4.4, SC_ORTA, D_Y, 1.25, 1.1, kCati, sonCemaatSiva)
  // Orta göz: düz üçgen yüzeylerden geçiş (kubbe kenarından tavana doğru).
  const turkUcgen: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  const Kx = 2.07, Kz = 2.0
  for (let n = 0; n < 16; n++) {
    const a0 = (n / 16) * Math.PI * 2, a1 = ((n + 1) / 16) * Math.PI * 2, am = (a0 + a1) / 2
    const p = (a: number) => V(1.85 * Math.cos(a), D_Y - 0.01, SC_ORTA + 1.85 * Math.sin(a))
    const bak = (a: number) => { const c = Math.cos(a), s = Math.sin(a), t = Math.min(Kx / Math.max(Math.abs(c), 1e-3), Kz / Math.max(Math.abs(s), 1e-3)); return V(c * t, D_Y - 0.75, SC_ORTA + s * t) }
    turkUcgen.push([p(a0), p(a1), bak(am)])
    turkUcgen.push([p(a0), bak(am), bak(a0)], [p(a1), bak(a1), bak(am)])
  }
  kCati.ekle(ucgenler(turkUcgen), pbr({ color: '#b5ab94', roughness: 0.9, side: THREE.DoubleSide, flatShading: true }))
  // Uçlarda çapraz tonoz: dört üçgen yüzey tepede buluşur.
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 6.5 : -E + 1.25, x1 = s > 0 ? E - 1.25 : -6.5, z0 = SC_IC + 0.15, z1 = SC_ARKA - 0.15, tp = V((x0 + x1) / 2, D_Y + 1, (z0 + z1) / 2)
    const a = V(x0, D_Y, z0), b = V(x1, D_Y, z0), c = V(x1, D_Y, z1), d = V(x0, D_Y, z1)
    kCati.ekle(ucgenler([[a, b, tp], [b, c, tp], [c, d, tp], [d, a, tp]]), pbr({ color: '#d7cfba', roughness: 0.9, side: THREE.DoubleSide }))
  }

  // Kurşun kırma çatılar (fotoğraflara göre)
  const CY = SACAK + 0.34
  const catilar: [number, number, number, number, number, number][] = [
    [-E - 0.42, -4.2, ON - 0.42, KANAT_G + 0.42, CY, CY + 1.45],
    [4.2, E + 0.42, ON - 0.42, KANAT_G + 0.42, CY, CY + 1.45],
    [-4.26, 4.26, ON - 0.42, ORTA_K - 0.3, CY, CY + 0.95],
    [-EYVAN_DIS - 0.42, EYVAN_DIS + 0.42, ORTA_G, EYVAN_G + 0.42, CY, CY + 1.55],
  ]
  for (const [x0, x1, z0, z1, y0, y1] of catilar) kCati.ekle(kirma(x0, x1, z0, z1, y0, y1), m.kursun)
  // Çatıdaki boşlukları kapatan alt örtü
  for (const [x0, x1, z0, z1] of catilar) kCati.ekle(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(Math.PI / 2).translate((x0 + x1) / 2, CY - 0.02, (z0 + z1) / 2), m.koyu)

  // Son cemaat orta kubbesi: dıştan küçük kasnak ve kurşun kubbe (fotoğrafa göre)
  kKubbe.ekle(uvDunya(yer(silindirG(2.2, 2.2, 1.1, 12, true), 0, CY + 0.5, SC_ORTA)), almasik)
  sacakHalka(kKubbe, 0, SC_ORTA, CY + 1.05, 2.32, 12, tugla, koseTasi)
  kKubbe.ekle(yer(dondurG(kubbeProfil(2.08, 1.35), 40, [1, 1]), 0, CY + 1.2, SC_ORTA), m.kubbe)
  alem(kKubbe, 0, CY + 2.5, SC_ORTA, 0.7, m.altin)

  // --- Orta kubbe: kare kaide, sekizgen kasnak, 6 m çapında kubbe, sekizgen aydınlık feneri (Kahraman 2025) ---
  const KAIDE = 4.45, KY0 = SACAK, KY1 = 9.75
  const kaideH = KY1 - KY0, kaideI = ORTA_X + 0.02, kaideE = KAIDE - kaideI
  for (const s of [-1, 1]) {
    kKubbe.ekle(uvDunya(yer(new THREE.BoxGeometry(KAIDE * 2, kaideH, kaideE), 0, (KY0 + KY1) / 2, s * (kaideI + kaideE / 2))), almasik)
    kKubbe.ekle(uvDunya(yer(new THREE.BoxGeometry(kaideE, kaideH, kaideI * 2), s * (kaideI + kaideE / 2), (KY0 + KY1) / 2, 0)), almasik)
    kKubbe.ekle(new THREE.BoxGeometry(KAIDE * 2 + 0.6, 0.08, kaideE + 0.3).translate(0, KY1 + 0.08, s * (kaideI + (kaideE + 0.3) / 2)), m.kursun)
    kKubbe.ekle(new THREE.BoxGeometry(kaideE + 0.3, 0.08, kaideI * 2).translate(s * (kaideI + (kaideE + 0.3) / 2), KY1 + 0.08, 0), m.kursun)
  }
  for (const [ax, az, bx, bz] of [[-KAIDE, -KAIDE, KAIDE, -KAIDE], [KAIDE, -KAIDE, KAIDE, KAIDE], [KAIDE, KAIDE, -KAIDE, KAIDE], [-KAIDE, KAIDE, -KAIDE, -KAIDE]]) sacak(ax, az, bx, bz, KY1 - 0.32, kKubbe)
  const KASNAK_Y = KY1, KASNAK_H = 1.15, KASNAK_R = 4.3, DIS_Y = KASNAK_Y + KASNAK_H
  kKubbe.ekle(uvDunya(duzGolge(silindirG(KASNAK_R, KASNAK_R, KASNAK_H, 8, true).rotateY(Math.PI / 8)).translate(0, KASNAK_Y + KASNAK_H / 2, 0)), almasik)
  sacakHalka(kKubbe, 0, 0, DIS_Y - 0.1, KASNAK_R + 0.1, 8, tugla, koseTasi)
  kKubbe.ekle(duzGolge(silindirG(KASNAK_R - 0.2, KASNAK_R + 0.22, 0.32, 8, true).rotateY(Math.PI / 8)).translate(0, DIS_Y + 0.22, 0), m.kursun)
  kKubbe.ekle(yer(dondurG(kubbeProfil(3.98, 2.35), 56, [1, 1]), 0, DIS_Y + 0.28, 0), m.kubbe)
  // Fener: sekizgen almaşık gövde, kemerli pencereler, kurşun külah
  const FENER_Y = DIS_Y + 0.28 + 2.1, FENER_H = 1.75, FENER_R = 1.12
  kKubbe.ekle(uvDunya(duzGolge(silindirG(FENER_R, FENER_R, FENER_H, 8, true).rotateY(Math.PI / 8)).translate(0, FENER_Y + FENER_H / 2, 0)), almasik)
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4, s = kemer(new THREE.Shape(), 0, FENER_Y + 0.28, 0.46, 0.55, 0.4), yuz = FENER_R * Math.cos(Math.PI / 8) + 0.02
    kKubbe.ekle(new THREE.ShapeGeometry(s, 8).translate(0, 0, yuz).rotateY(a), camDis)
    const h = kemer(new THREE.Shape(), 0, FENER_Y + 0.22, 0.66, 0.55, 0.52)
    h.holes.push(kemer(new THREE.Path(), 0, FENER_Y + 0.28, 0.46, 0.55, 0.4))
    kKubbe.ekle(cikar(h, 0.03, yuz - 0.01).rotateY(a), tugla)
  }
  sacakHalka(kKubbe, 0, 0, FENER_Y + FENER_H - 0.05, FENER_R + 0.06, 8, tugla, koseTasi)
  kKubbe.ekle(yer(dondurG([[1.24, 0], [1.08, 0.1], [0.8, 0.45], [0.35, 0.72], [0.08, 0.86], [0, 0.88]], 16, [1, 1]), 0, FENER_Y + FENER_H + 0.14, 0), m.kursun)
  alem(kKubbe, 0, FENER_Y + FENER_H + 0.95, 0, 0.75, m.altin)

  // İç kubbe: kareden sekizgene birim üçgenli geçiş, silme, kubbe, fener bacası
  const U_Y0 = 7.3, U_Y1 = 8.15, K = ORTA_X, kk = K * Math.tan(Math.PI / 8)
  const ucg: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
    const a = V(sx * K, U_Y0, sz * K), orta = V(sx * (K + kk) / 2 * 0.98, U_Y0 + (U_Y1 - U_Y0) * 0.6, sz * (K + kk) / 2 * 0.98)
    const b = V(sx * K, U_Y1, sz * kk), c = V(sx * kk, U_Y1, sz * K)
    ucg.push([a, b, orta], [a, orta, c], [b, c, orta])
  }
  kKubbe.ekle(ucgenler(ucg), pbr({ color: '#8f8469', roughness: 0.92, side: THREE.DoubleSide, flatShading: true }))
  const halka = dikdortgen(-K, -K, K, K)
  halka.holes.push(new THREE.Path().absarc(0, 0, 2.86, 0, Math.PI * 2, true))
  kKubbe.ekle(new THREE.ShapeGeometry(halka, 28).rotateX(Math.PI / 2).translate(0, U_Y1 + 0.05, 0), icSiva)
  kKubbe.ekle(new THREE.TorusGeometry(2.88, 0.07, 6, 48).rotateX(Math.PI / 2).translate(0, U_Y1 + 0.08, 0), pbr({ color: '#b39c6d', roughness: 0.7 }))
  const icK: P2[] = []
  for (let t = 0; t <= 14; t++) { const a = (t / 14) * Math.PI / 2 * 0.92; icK.push([Math.max(2.86 * Math.cos(a), 0.4), 2.75 * Math.sin(a)]) }
  kKubbe.ekle(yer(dondurG(icK, 48, [1, 1]), 0, U_Y1 + 0.05, 0), pbr({ color: '#a29c8b', roughness: 0.92, side: THREE.DoubleSide }))
  const icKSon = icK[icK.length - 1]
  const fenerY = U_Y1 + 0.05 + icKSon[1]
  kKubbe.ekle(new THREE.TorusGeometry(icKSon[0] + 0.04, 0.05, 6, 24).rotateX(Math.PI / 2).translate(0, fenerY - 0.02, 0), pbr({ color: '#8d6d3c', roughness: 0.6 }))
  kKubbe.ekle(new THREE.TorusGeometry(2.5, 0.04, 6, 48).rotateX(Math.PI / 2).translate(0, U_Y1 + 1.34, 0), pbr({ color: '#8d6d3c', roughness: 0.6 }))
  const fenerUc: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  for (let n = 0; n < 16; n++) {
    const a0 = (n / 16) * Math.PI * 2, a1 = ((n + 1) / 16) * Math.PI * 2, am = (a0 + a1) / 2, R0 = icKSon[0] + 0.05, R1 = R0 + 0.42
    const y0 = fenerY - 0.04, y1 = fenerY - 0.22
    fenerUc.push([V(R0 * Math.cos(a0), y0, R0 * Math.sin(a0)), V(R0 * Math.cos(a1), y0, R0 * Math.sin(a1)), V(R1 * Math.cos(am), y1, R1 * Math.sin(am))])
  }
  kKubbe.ekle(ucgenler(fenerUc), pbr({ color: '#b08d55', roughness: 0.7, side: THREE.DoubleSide, flatShading: true }))
  const bacaY = U_Y1 + 0.05 + icKSon[1]
  kKubbe.ekle(yer(silindirG(icKSon[0], icKSon[0], FENER_Y + FENER_H - bacaY, 8, true).rotateY(Math.PI / 8), 0, (FENER_Y + FENER_H + bacaY) / 2, 0), pbr({ color: '#9f9988', roughness: 0.85, side: THREE.DoubleSide }))
  kKubbe.ekle(new THREE.CircleGeometry(icKSon[0] + 0.1, 16).rotateX(Math.PI / 2).translate(0, FENER_Y + FENER_H - 0.02, 0), gokIsik)

  // --- Mihrap: fotoğraftan yüz (varsa), üstünde pencere; iki yanda madalyon ---
  const mihrapZ = EYVAN_ICG - 0.03
  const MG = 2.34, MH = 3.98, MY = EYVAN + 0.02
  kutu(MG + 0.22, MH + 0.15, 0.3, m.altinKoyu, 0, MY + (MH + 0.15) / 2, mihrapZ - 0.15)
  const yuz = new THREE.PlaneGeometry(MG, MH).rotateY(Math.PI).translate(0, MY + MH / 2, mihrapZ - 0.31)
  k.ekle(yuz, mihrapYuz)
  for (const s of [-1, 1]) {
    k.ekle(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 28).rotateX(Math.PI / 2).translate(s * 1.72, MY + MH - 0.05, mihrapZ - 0.03), m.koyu)
    k.ekle(new THREE.TorusGeometry(0.42, 0.03, 6, 28).translate(s * 1.72, MY + MH - 0.05, mihrapZ - 0.06), m.altin)
    k.ekle(new THREE.PlaneGeometry(0.72, 0.72).rotateY(Math.PI).translate(s * 1.72, MY + MH - 0.05, mihrapZ - 0.055), rozet)
  }
  engel(-1.3, 1.3, mihrapZ - 0.5, EYVAN_ICG)

  // --- Minber: kündekâri, köşk ve külah; merdivenden çıkılır (fotoğrafa göre) ---
  const MB = { x: -1.95, en: 1.3, z0: 5.1, z1: 9.1, h: 2.05 }
  const mbEk = (g: THREE.BufferGeometry, mal: Mal, z0 = MB.z0) => k.ekle(g.rotateY(-Math.PI / 2).translate(MB.x, 0, z0), mal)
  const boy = MB.z1 - MB.z0
  for (const s of [-1, 1]) {
    const yan = new THREE.Shape()
    yan.moveTo(0.6, MY); yan.lineTo(boy, MY); yan.lineTo(boy, MY + MB.h + 0.95); yan.lineTo(boy - 0.05, MY + MB.h + 0.95); yan.lineTo(0.9, MY + 0.9); yan.lineTo(0.6, MY + 0.9); yan.closePath()
    mbEk(cikar(yan, 0.09, s * (MB.en / 2) - 0.045), kundekariSik)
    const ust = new THREE.Shape()
    ust.moveTo(0.9, MY + 0.9); ust.lineTo(boy - 0.05, MY + MB.h + 0.95); ust.lineTo(boy - 0.05, MY + MB.h + 1.1); ust.lineTo(0.9, MY + 1.05); ust.closePath()
    mbEk(cikar(ust, 0.13, s * (MB.en / 2) - 0.065), m.ceviz)
  }
  const ADIM = 11
  for (let i = 0; i < ADIM; i++) {
    const t = (i + 1) / ADIM, h = MB.h * t, s = 0.6 + (i / ADIM) * (boy - 0.6)
    mbEk(kutuG((boy - 0.6) / ADIM + 0.01, h, MB.en - 0.14).translate(s + (boy - 0.6) / ADIM / 2, MY + h / 2, 0), m.ahsapKafes)
  }
  // Kapı sövesi ve taçlı üst
  for (const s of [-1, 1]) mbEk(kutuG(0.3, 2.3, 0.16).translate(0.3, MY + 1.15, s * (MB.en / 2 - 0.04)), m.ceviz)
  mbEk(kutuG(0.3, 0.42, MB.en + 0.1).translate(0.3, MY + 2.5, 0), kundekariSik)
  mbEk(kutuG(0.34, 0.08, MB.en + 0.16).translate(0.3, MY + 2.72, 0), m.altinKoyu)
  // Köşk: dört ince direk, ahşap çatı, sivri külah
  const koskZ = MB.z1 + 0.05, koskG = 1.0
  kutu(MB.en, MB.h + 0.02, koskG, m.kundekari, MB.x, MY + (MB.h + 0.02) / 2, koskZ + koskG / 2)
  for (const a of [-1, 1]) for (const b of [0, 1]) kutu(0.1, 1.9, 0.1, m.ceviz, MB.x + a * (MB.en / 2 - 0.05), MY + MB.h + 0.95, koskZ + 0.05 + b * (koskG - 0.1))
  kutu(MB.en + 0.14, 0.16, koskG + 0.14, m.ceviz, MB.x, MY + MB.h + 1.97, koskZ + koskG / 2)
  k.ekle(duzGolge(silindirG(0.05, MB.en * 0.72, 1.7, 8)).scale(1, 1, koskG / MB.en).translate(MB.x, MY + MB.h + 2.9, koskZ + koskG / 2), m.ceviz)
  k.ekle(yer(dondurG([[0.07, 0], [0.03, 0.14], [0.09, 0.26], [0.02, 0.44], [0, 0.46]], 8), MB.x, MY + MB.h + 3.72, koskZ + koskG / 2), m.altin)
  kutu(MB.en - 0.18, 1.7, 0.03, pbr({ color: '#1c4c37', roughness: 0.9 }), MB.x, MY + MB.h + 0.95, koskZ + koskG - 0.05)
  // Çarpışma: yan duvarlar, kapı sövesi, köşk; arada merdiven yürünür.
  const mbx0 = MB.x - MB.en / 2, mbx1 = MB.x + MB.en / 2
  engel(mbx0 - 0.05, mbx0 + 0.05, MB.z0 + 0.6, MB.z1 + 1.05); engel(mbx1 - 0.05, mbx1 + 0.05, MB.z0 + 0.6, MB.z1 + 1.05)
  engel(mbx0, mbx1, MB.z1, EYVAN_ICG)
  zeminler.push({ x0: mbx0, x1: mbx1, z0: MB.z0 + 0.6, z1: MB.z1, h0: EYVAN, h1: EYVAN + MB.h })

  // Vaaz kürsüsü: ahşap kafesli küçük kutu, mihrabın solunda
  kutu(0.95, 1.15, 1.0, m.ahsapKafes, 2.1, MY + 0.575, 8.85)
  kutu(1.0, 0.08, 1.06, m.ceviz, 2.1, MY + 1.2, 8.85)
  engel(1.6, 2.6, 8.35, 9.35)

  // Avizeler
  const avize = (x: number, y: number, z: number, tepe: number) => {
    k.ekle(yer(silindirG(0.012, 0.012, tepe - y, 5), x, (tepe + y) / 2, z), m.koyu)
    for (const [r, dy, n] of [[0.42, 0, 10], [0.26, 0.28, 7], [0.13, 0.5, 5]] as const) {
      k.ekle(new THREE.TorusGeometry(r, 0.012, 5, 18).rotateX(Math.PI / 2).translate(x, y + dy, z), m.altin)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r
        k.ekle(new THREE.SphereGeometry(0.05, 6, 4).translate(px, y + dy - 0.08, pz), m.lamba)
        k.ekle(new THREE.PlaneGeometry(0.24, 0.24).translate(px, y + dy - 0.08, pz), m.lambaHale)
      }
    }
  }
  avize(0, 4.3, 7.9, 8.15)
  avize(0, 4.2, 0, 10.9)
  avize(KX, 3.8, 0.9, 7.9); avize(-KX, 3.8, 0.9, 7.9)

  // --- Şadırvanlı minare: altı tuğla ayak, kemerler, altıgen kasnak, tuğla gövde ve şerefe (envanter s. 216) ---
  const kose = (i: number): P2 => [MIN_X + MIN_R * Math.cos(i * Math.PI / 3), MIN_Z + MIN_R * Math.sin(i * Math.PI / 3)]
  const AYAK_D = 1.05, MIN_H1 = 5.4
  const yanG = MIN_R
  const mYay = (u: number) => ({ u, g: yanG - 1.45, y0: 0, duz: 3.05, kh: 1.55, tur: 'kapi' as const })
  for (let i = 0; i < 6; i++) {
    const [ax, az] = kose(i), [bx, bz] = kose(i + 1)
    duvar(ax, az, bx, bz, AYAK_D, MIN_H1, tugla, tugla, [mYay(yanG / 2)], { carp: false, govdeMal: tugla })
    const y = yerel(ax, az, bx, bz)
    const ek = (g: THREE.BufferGeometry, mal: Mal) => { g.applyMatrix4(y.mat); uvDunya(g); k.ekle(g, mal) }
    kemerHalka(ek, yanG / 2, 0, yanG - 1.45, 3.05, 1.55, 0.38, -0.07, 0.1)
    // Üzengi taşı bandı ve ahşap gergi
    for (const s of [0, 1]) ek(new THREE.BoxGeometry(0.72, 0.2, 0.12).translate(s * yanG + (s ? -0.36 : 0.36), 3.05, -0.05), koseTasi)
    ek(new THREE.BoxGeometry(yanG - 1.4, 0.2, 0.2).translate(yanG / 2, 2.98, AYAK_D / 2), ahsapAcik)
    sacak(ax, az, bx, bz, MIN_H1 - 0.3)
    daireler.push({ x: ax, z: az, r: 0.72 })
  }
  // Tavan: tuğla tonozcuk, sarkan sekizgen gövde tabanı, demir merdiven
  k.ekle(yer(dondurG([[3.1, 0], [2.6, 0.55], [1.7, 0.95], [0.95, 1.1], [0.95, 1.12], [0, 1.12]], 24), MIN_X, 4.05, MIN_Z), tugla)
  k.ekle(duzGolge(silindirG(0.95, 0.95, 1.45, 8)).translate(MIN_X, 4.45, MIN_Z), pbr({ color: '#d9d4c7', roughness: 0.9 }))
  const merdiven = new THREE.Vector3(MIN_X + 2.5, 0.12, MIN_Z + 1.2).sub(V(MIN_X + 0.75, 4.1, MIN_Z + 0.2))
  const mBoy = merdiven.length(), mOrta = V(MIN_X + 1.62, 2.1, MIN_Z + 0.7)
  const yon = merdiven.clone().normalize()
  for (const ofs of [-0.22, 0.22]) {
    const c = new THREE.CylinderGeometry(0.025, 0.025, mBoy, 5)
    c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), yon)).translate(mOrta.x - ofs * 0.5, mOrta.y, mOrta.z + ofs)
    k.ekle(c, demir)
  }
  for (let i = 1; i < 13; i++) {
    const p = V(MIN_X + 0.75, 4.1, MIN_Z + 0.2).addScaledVector(yon, (i / 13) * mBoy)
    k.ekle(new THREE.BoxGeometry(0.03, 0.03, 0.46).translate(p.x, p.y, p.z), demir)
  }
  // Şadırvan: sekizgen mermer hazne, demir korkuluk, musluklar, tabureler (fotoğrafa göre)
  k.ekle(duzGolge(silindirG(MIN_R + 0.35, MIN_R + 0.35, 0.14, 6).rotateY(Math.PI / 6)).translate(MIN_X, 0.09, MIN_Z), m.icMermer)
  const HR = 1.2, HH = 1.2
  k.ekle(duzGolge(silindirG(HR, HR, HH, 8).rotateY(Math.PI / 8)).translate(MIN_X, 0.16 + HH / 2, MIN_Z), hazneMermer)
  k.ekle(yer(silindirG(HR - 0.08, HR - 0.08, 0.02, 24), MIN_X, 0.16 + HH + 0.02, MIN_Z), m.su)
  for (let n = 0; n < 8; n++) {
    const a = (n + 0.5) * Math.PI / 4, yu = HR * Math.cos(Math.PI / 8) + 0.015
    const s = kemer(new THREE.Shape(), 0, 0.42, 0.68, 0.34, 0.26)
    s.holes.push(kemer(new THREE.Path(), 0, 0.46, 0.58, 0.32, 0.2))
    k.ekle(cikar(s, 0.015, yu).rotateY(a).translate(MIN_X, 0, MIN_Z), m.mermerKoyu)
    k.ekle(new THREE.BoxGeometry(0.05, 0.05, 0.1).translate(0, 0.75, yu + 0.04).rotateY(a).translate(MIN_X, 0, MIN_Z), m.altin)
    k.ekle(new THREE.BoxGeometry(0.08, 0.06, 0.03).translate(0, 0.8, yu + 0.08).rotateY(a).translate(MIN_X, 0, MIN_Z), pbr({ color: '#b5392c', roughness: 0.5 }))
    const px = MIN_X + Math.sin(a) * 2.02, pz = MIN_Z + Math.cos(a) * 2.02
    k.ekle(yer(dondurG([[0.17, 0], [0.11, 0.18], [0.17, 0.4]], 10), px, 0.14, pz), m.mermerKoyu)
    k.ekle(yer(silindirG(0.2, 0.2, 0.05, 12), px, 0.56, pz), m.ceviz)
  }
  k.ekle(new THREE.TorusGeometry(HR + 0.03, 0.025, 5, 40).rotateX(Math.PI / 2).translate(MIN_X, 0.16 + HH + 0.55, MIN_Z), demir)
  k.ekle(new THREE.TorusGeometry(HR + 0.03, 0.018, 5, 40).rotateX(Math.PI / 2).translate(MIN_X, 0.16 + HH + 0.06, MIN_Z), demir)
  for (let n = 0; n < 26; n++) {
    const a = (n / 26) * Math.PI * 2
    k.ekle(new THREE.BoxGeometry(0.018, 0.5, 0.018).translate(MIN_X + Math.sin(a) * (HR + 0.03), 0.16 + HH + 0.3, MIN_Z + Math.cos(a) * (HR + 0.03)), demir)
  }
  daireler.push({ x: MIN_X, z: MIN_Z, r: 1.32 })
  // Üst: kurşun etek, taş altıgen kasnak, tuğla gövde, mukarnaslı şerefe, mermer korkuluk, kurşun külah, alem
  const MIN_Y = MIN_H1 + 0.2
  const altigen = (r: number, y0: number, y1: number, mal: Mal, ust = r) => { const g = duzGolge(silindirG(ust, r, y1 - y0, 6).rotateY(Math.PI / 6)).translate(MIN_X, (y0 + y1) / 2, MIN_Z); kMinare.ekle(uvDunya(g), mal) }
  altigen(MIN_R + 0.3, MIN_Y, MIN_Y + 0.26, m.kursun, MIN_R - 0.5)
  altigen(MIN_R - 0.4, MIN_Y, MIN_Y + 2.15, almasikTas())
  for (let i = 0; i < 6; i++) {
    const r = MIN_R - 0.4
    const p = (n: number): P2 => [MIN_X + r * Math.cos(n * Math.PI / 3), MIN_Z + r * Math.sin(n * Math.PI / 3)]
    const [ax, az] = p(i), [bx, bz] = p(i + 1)
    sacak(ax, az, bx, bz, MIN_Y + 2.05, kMinare)
  }
  altigen(MIN_R - 0.2, MIN_Y + 2.5, MIN_Y + 2.72, m.kursun, 1.2)
  const GOV = MIN_Y + 2.72
  const ekM = (g: THREE.BufferGeometry, mal: Mal) => kMinare.ekle(yer(g, MIN_X, 0, MIN_Z), mal)
  ekM(dondurG([[1.07, GOV - 0.05], [0.98, GOV + 5.1]], 28), tugla)
  ekM(new THREE.TorusGeometry(1.06, 0.05, 6, 28).rotateX(Math.PI / 2).translate(0, GOV + 0.45, 0), m.mermer)
  const SER = GOV + 5.1
  for (let t = 0; t < 4; t++) {
    const r = 0.98 + t * 0.14, y = SER + t * 0.36
    ekM(dondurG([[r, y], [r + 0.13, y + 0.36]], 26), tugla)
    const adet = 16
    for (let a = 0; a < adet; a++) {
      const te = (a + (t % 2) * 0.5) * (Math.PI * 2) / adet
      ekM(new THREE.SphereGeometry(0.2, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.1, 0.5).translate(0, y + 0.04, r + 0.05).rotateY(te), tugla)
    }
  }
  const SY = SER + 1.44
  ekM(silindirG(1.62, 1.62, 0.12, 28).translate(0, SY + 0.06, 0), m.mermer)
  for (let a = 0; a < 18; a++) {
    const te = a * Math.PI * 2 / 18
    ekM(kutuG(0.5, 0.86, 0.1).translate(0, SY + 0.48, 1.58).rotateY(te), m.mermer)
    ekM(kutuG(0.32, 0.14, 0.14).translate(0.12, SY + 1, 1.58).rotateY(te), m.mermer)
  }
  ekM(dondurG([[0.74, SY], [0.7, SY + 3.15]], 22), tugla)
  // Küçük kapı
  ekM(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, SY + 1.3, 0.34, 0.5, 0.3), 8).translate(0, 0, 0.72), m.koyu)
  ekM(dondurG([[0.74, SY + 3.12], [0.82, SY + 3.3], [0.78, SY + 3.75], [0.5, SY + 4.15], [0.14, SY + 4.42], [0.03, SY + 4.6]], 22, [1, 1]), m.kursun)
  ekM(dondurG([[0.06, SY + 4.6], [0.03, SY + 4.8], [0.1, SY + 4.95], [0.03, SY + 5.2], [0.07, SY + 5.32], [0.012, SY + 5.75], [0, SY + 5.8]], 10), m.altin)

  // Minare meydanı babaları
  for (let x = -22; x <= 30; x += 4.4) { for (const z of [-19.2, -11.3]) { if (x > -3 && x < 3 && z > -12) continue; kutu(0.1, 0.7, 0.1, demir, x, 0.4, z); kutu(0.12, 0.08, 0.12, m.altin, x, 0.62, z) } }

  // --- İmaret izi: günümüze ulaşmadı; yalnız plandaki yeri alçak kaideyle gösterilir (Ayverdi planı, envanter) ---
  const IM = { x0: -21.4, x1: -10.5, z0: -9.5, z1: -2.87 }
  for (const [a, b, c, d] of [[IM.x0, IM.z0, IM.x1, IM.z0], [IM.x0, IM.z1, IM.x1, IM.z1], [IM.x0, IM.z0, IM.x0, IM.z1]] as const) {
    const g = Math.abs(c - a) + 0.6, dd = Math.abs(d - b) + 0.6
    kutuD(Math.max(g, 0.6), 0.55, Math.max(dd, 0.6), koseTasi, (a + c) / 2, 0.275, (b + d) / 2)
    engel(Math.min(a, c) - 0.3, Math.max(a, c) + 0.3, Math.min(b, d) - 0.3, Math.max(b, d) + 0.3)
  }
  for (const x of [-13.3, -18.5]) for (const z of [IM.z0, IM.z1]) kutu(1.05, 0.85, 0.8, koseTasi, x, 0.425, z)
  yatay(IM.x0 + 0.3, IM.x1, IM.z0 + 0.3, IM.z1 - 0.3, 0.05, yesil)

  // --- Hamam: batıda dış kütle (envanter s. 220) ---
  hamam()

  // --- Hazire: doğu ve güneyde, kademeli mezarlar (envanter s. 218) ---
  const HX0 = 11.4, HX1 = 31, HZ0 = -9.5, HZ1 = 17.2
  yatay(HX0, HX1, HZ0, HZ1, 0.05, meydan)
  yatay(-E - 0.5, HX0, EYVAN_G + 0.9, HZ1, 0.05, meydan)
  // Demir çit: kuzeyden kapısı vardır.
  const cit = (x0: number, z0: number, x1: number, z1: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 1.2)
    for (let i = 0; i <= n; i++) {
      const t = i / n
      kutu(0.09, 1.55, 0.09, demir, x0 + (x1 - x0) * t, 0.78, z0 + (z1 - z0) * t)
    }
    const yatayG = x1 === x0 ? 0.04 : L, derin = x1 === x0 ? L : 0.04
    for (const y of [0.25, 1.35]) kutu(yatayG, 0.04, derin, demir, (x0 + x1) / 2, y, (z0 + z1) / 2)
    for (let i = 0; i < n * 5; i++) {
      const t = (i + 0.5) / (n * 5)
      kutu(0.018, 1.1, 0.018, demir, x0 + (x1 - x0) * t, 0.8, z0 + (z1 - z0) * t)
    }
    engel(Math.min(x0, x1) - 0.08, Math.max(x0, x1) + 0.08, Math.min(z0, z1) - 0.08, Math.max(z0, z1) + 0.08)
  }
  cit(HX0, HZ0, HX0 + 3.2, HZ0); cit(HX0 + 5.8, HZ0, HX1, HZ0); cit(HX1, HZ0, HX1, HZ1); cit(-E - 0.5, HZ1, HX1, HZ1); cit(-E - 0.5, KANAT_G + 0.1, -E - 0.5, HZ1)
  // Mezar: taş kademeler, baş ve ayak şahidesi
  const mezar = (x: number, z: number, en: number, boy2: number, kademe: number, koyu: boolean, siwri = 1) => {
    let y = 0.05
    for (let i = 0; i < kademe; i++) {
      const o = (kademe - i - 1) * 0.22, h = 0.34
      kutuD(en + o * 2, h, boy2 + o * 2, kaideTas, x, y + h / 2, z)
      kutu(0.03, h - 0.02, boy2 + o * 2 + 0.005, koseTasi, x + en * 0.28, y + h / 2, z)
      y += h
    }
    kutu(en - 0.25, 0.32, boy2 - 0.25, koyu ? govdeAgac : kaideTas, x, y + 0.08, z)
    const sahide = (zs: number, sw: number, H: number) => {
      const s = new THREE.Shape()
      s.moveTo(-sw / 2, 0); s.lineTo(-sw / 2, H * 0.72)
      s.quadraticCurveTo(-sw / 2, H * 0.92, 0, H * siwri)
      s.quadraticCurveTo(sw / 2, H * 0.92, sw / 2, H * 0.72); s.lineTo(sw / 2, 0); s.closePath()
      const g = cikar(s, 0.17, -0.085)
      g.computeBoundingBox(); uvSigdir(g)
      k.ekle(yer(g, x, y + 0.05, zs), koyu ? mezarKoyu : mezarAcik)
    }
    sahide(z + boy2 / 2 - 0.2, en * 0.62, 1.45)
    sahide(z - boy2 / 2 + 0.2, en * 0.48, 1.0)
    const o = (kademe - 1) * 0.22
    engel(x - en / 2 - o, x + en / 2 + o, z - boy2 / 2 - o, z + boy2 / 2 + o)
  }
  const MEZARLAR: [number, number, number, number, number, boolean][] = [
    [17.6, 1.4, 1.4, 2.6, 3, true], // Kara Timurtaş Paşa'nın mezarı konumu temsilîdir
    [13.8, -1.2, 1.15, 2.2, 2, true], [13.9, 5.2, 1.2, 2.3, 3, false], [17.6, 7.6, 1.25, 2.4, 2, true], [21.8, 4.4, 1.3, 2.5, 3, false],
    [21.4, -2.6, 1.15, 2.2, 2, true], [25.6, 1.8, 1.2, 2.3, 2, false], [25.8, 8.6, 1.25, 2.4, 3, true], [21.2, 11, 1.15, 2.2, 2, false],
    [14.6, 12.8, 1.15, 2.2, 2, true], [8.4, 14.4, 1.15, 2.2, 2, false], [2.6, 14.2, 1.15, 2.2, 3, true], [-3.8, 14.4, 1.15, 2.2, 2, false],
    [27, -5.2, 1.15, 2.2, 2, true], [17.2, -6, 1.1, 2.1, 2, false],
  ]
  for (const [x, z, en, b, kd, ky] of MEZARLAR) mezar(x, z, en, b, kd, ky)

  // Ağaçlar: hazirenin çınarları ve selviler (konumlar temsilîdir)
  const agac = (x: number, z: number, boyAg: number, tepeR: number, koyu = false) => {
    const g = new THREE.CylinderGeometry(0.2, 0.42, boyAg, 9).translate(x, boyAg / 2, z)
    k.ekle(g, govdeAgac)
    const mal = koyu ? yaprakKoyu : yaprak, parca = 4
    for (let i = 0; i < parca; i++) {
      const a = i * 2.4 + x, rr = tepeR * (i === 0 ? 1 : 0.68), o = i === 0 ? 0 : tepeR * 0.58
      const g2 = new THREE.IcosahedronGeometry(rr, 3)
      const p = g2.attributes.position
      for (let v = 0; v < p.count; v++) { const n = 1 + 0.15 * Math.sin(p.getX(v) * 2.6 + a) * Math.cos(p.getZ(v) * 2.2 + a) + 0.1 * Math.sin(p.getY(v) * 3.3); p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 0.8, p.getZ(v) * n) }
      const nr = g2.attributes.normal
      for (let v = 0; v < p.count; v++) { const l = Math.hypot(p.getX(v), p.getY(v), p.getZ(v)) || 1; nr.setXYZ(v, p.getX(v) / l, p.getY(v) / l, p.getZ(v) / l) }
      k.ekle(g2.translate(x + Math.cos(a) * o, boyAg + (i === 0 ? tepeR * 0.25 : -tepeR * 0.05), z + Math.sin(a) * o), mal)
    }
    daireler.push({ x, z, r: 0.5 })
  }
  agac(29, 13.5, 9, 5, false); agac(16, 15.5, 8.5, 4.2, true); agac(30, 3, 8, 4.2, false); agac(24.7, 12.2, 7.5, 3.5, true); agac(-11.4, 14.2, 8, 4, false)
  const selvi = (x: number, z: number, b: number) => {
    const p: P2[] = [[0.12, 0.2], [0.9, 1.4], [1.15, b * 0.3], [1.05, b * 0.5], [0.72, b * 0.72], [0.28, b * 0.92], [0, b]]
    const g = dondurG(p, 14)
    k.ekle(yer(g, x, 0, z), m.selvi)
    daireler.push({ x, z, r: 0.7 })
  }
  selvi(-22.6, 3, 11); selvi(-5, -33, 11); selvi(30.2, -33.5, 10); selvi(30.4, 9.5, 12); selvi(-8, 15.8, 10.5)

  // --- Yürüme alanı ---
  zeminler.push(
    { x0: -2.9, x1: 2.9, z0: -10.7, z1: ON, h0: 0, h1: IC },
    { x0: -E + 1.1, x1: E - 1.1, z0: ON, z1: SC_ARKA, h0: IC, h1: IC },
    { x0: -ORTA_X, x1: ORTA_X, z0: SC_ARKA, z1: 2.6, h0: IC, h1: IC },
    { x0: -EYVAN_X, x1: EYVAN_X, z0: 2.6, z1: 3.4, h0: IC, h1: EYVAN },
    { x0: -EYVAN_X, x1: EYVAN_X, z0: 3.4, z1: EYVAN_ICG, h0: EYVAN, h1: EYVAN },
    { x0: KANAT_IC_X, x1: E - 1.1, z0: ORTA_K, z1: KANAT_G_IC, h0: IC, h1: IC },
    { x0: -E + 1.1, x1: -KANAT_IC_X, z0: ORTA_K, z1: KANAT_G_IC, h0: IC, h1: IC },
    { x0: ORTA_X, x1: KANAT_IC_X, z0: ORTA_K, z1: ORTA_G, h0: IC, h1: IC },
    { x0: -KANAT_IC_X, x1: -ORTA_X, z0: ORTA_K, z1: ORTA_G, h0: IC, h1: IC },
    { x0: 5.5, x1: 8.3, z0: SC_ARKA, z1: ORTA_K, h0: IC, h1: IC },
    { x0: -8.3, x1: -5.5, z0: SC_ARKA, z1: ORTA_K, h0: IC, h1: IC },
  )
  // Yürüyüş sınırı dışında kalan hamam kütlesi engel listesine girmez; sınır doğusunda kalır.
  const kay = (b: Kutu): Kutu => ({ ...b, x0: b.x0 + OX, x1: b.x1 + OX, z0: b.z0, z1: b.z1 })
  const yurume: IcYurume = {
    sinir: { x0: -23 + OX, x1: 30.6 + OX, z0: -35, z1: 16.8, daire: { x: 0, z: 0, r: R_ZEMIN * Math.cos(Math.PI / 72) } },
    kutular: kutular.map(kay),
    daireler: daireler.map((d) => ({ ...d, x: d.x + OX })),
    zeminler: zeminler.map((z) => ({ ...z, x0: z.x0 + OX, x1: z.x1 + OX })),
    gorusKesenler: gorusKesenler.map(kay),
    gozY: GOZ,
    tabanY: 0,
  }

  const durak = (id: string, ad: string, x: number, z: number, h: number, bx: number, by: number, bz: number): IcDurak => ({ id, ad, konum: [x + OX, GOZ + h, z], bak: [bx + OX, by, bz] })
  const duraklar: IcDurak[] = [
    durak('cephe', 'Cephe', -3.5, -18.2, 0, 0, 4.2, ON),
    durak('son-cemaat', 'Son cemaat yeri', -6.4, -6.2, IC, 2, 4.6, -6.3),
    durak('orta-kubbe', 'Orta kubbe', 0, -2, IC, 0, 12, 0.7),
    durak('mihrap', 'Mihrap', 0.5, 4.2, EYVAN, 0, 3.4, EYVAN_ICG),
    durak('minber', 'Minbere çık', MB.x, 7.8, EYVAN + MB.h * ((7.8 - MB.z0 - 0.6) / (MB.z1 - MB.z0 - 0.6)), 0.5, 3.4, 3.5),
    durak('zaviye', 'Zaviye', 6.8, -1.6, IC, 6.6, 3, 4.6),
    durak('sadirvan', 'Şadırvan', MIN_X - 1.6, MIN_Z + 1.75, 0, MIN_X + 0.3, 1.25, MIN_Z - 3),
    durak('minare', 'Minare', MIN_X - 9, -14.5, 0, MIN_X, 10, MIN_Z),
    durak('imaret', 'İmaret izi', -12, -12, 0, -17, 0.6, -6),
    durak('hazire', 'Hazire', 19.8, -7.6, 0, 16.8, 1.6, 1.4),
  ]

  // --- Katmanlar ---
  const kok = k.grup()
  const catiGrup = kCati.grup(), kubbeGrup = kKubbe.grup(), minareGrup = kMinare.grup()
  kok.add(catiGrup, kubbeGrup, minareGrup)
  // Plan ölçüleri korunur; sahneye oturtmak için geometri bir kez kaydırılır (gölgelendirici konumu da aynı kalır).
  kok.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.translate(OX, 0, 0) })

  return {
    kok,
    katmanlar: [
      { grup: catiGrup, yukseklik: 13, ad: 'Çatı ve tonozlar' },
      { grup: kubbeGrup, yukseklik: 26, ad: 'Kubbeler' },
      { grup: minareGrup, yukseklik: 17, ad: 'Minare gövdesi' },
    ],
    duraklar,
    yurume,
    kamera: { konum: [OX + 30, 24, -66], hedef: [OX - 9, 6, -8] },
    kaideYaricap: 54,
    icIsiklar: [[OX, 4.8, -0.4], [OX, 4.9, 7.4], [OX + 6.7, 4.4, 1], [OX - 6.7, 4.4, 1]],
  }

  function almasikTas() {
    return pbr({ map: kesmeTasDokusu(), roughness: 0.92 })
  }

  /** Oluklu kurşun kubbe profili. */
  function kubbeProfil(r: number, h: number): P2[] {
    const p: P2[] = []
    for (let t = 0; t <= 14; t++) { const a = (t / 14) * Math.PI / 2; p.push([Math.max(r * Math.cos(a) ** 0.88, 0.001), h * Math.sin(a) ** 1.08]) }
    return p
  }

  function alem(kv: Kova, x: number, y: number, z: number, H: number, mal: Mal) {
    kv.ekle(yer(dondurG([[0.1, 0], [0.04, H * 0.22], [0.12, H * 0.42], [0.04, H * 0.62], [0.015, H], [0, H * 1.02]], 8), x, y, z), mal)
  }

  /** Çokgen kasnak saçağı: taş silme ve tuğla diş halkası. */
  function sacakHalka(kv: Kova, x: number, z: number, y: number, r: number, n: number, dis: Mal, tas: Mal) {
    const ofs = Math.PI / n
    kv.ekle(duzGolge(silindirG(r + 0.28, r + 0.28, 0.1, n).rotateY(ofs)).translate(x, y + 0.08, z), tas)
    const adet = Math.max(12, Math.round((2 * Math.PI * r) / 0.3))
    for (let i = 0; i < adet; i++) {
      const a = (i / adet) * Math.PI * 2
      const ap = r * Math.cos(Math.PI / n) / Math.cos(((a + 2 * Math.PI) % (2 * Math.PI / n)) - Math.PI / n)
      kv.ekle(new THREE.BoxGeometry(0.16, 0.13, 0.16).rotateY(a + Math.PI / 4).translate(x + Math.sin(a) * ap, y - 0.06, z + Math.cos(a) * ap), dis)
    }
  }

  function hamam() {
    const W0 = -60, W1 = W0 + 18.35, Z0 = -10.2, Z1 = 10.2, H_D = 8.2
    const hEk = (g: THREE.BufferGeometry, mal: Mal, kv = k) => kv.ekle(uvDunya(g), mal)
    const yapDuv = (ax: number, az: number, bx: number, bz: number, h: number, acik: Aciklik[] = []) => duvar(ax, az, bx, bz, 1.3, h, moloz, moloz, acik, { carp: false })
    const hp = (u: number): Aciklik => ({ u, g: 0.72, y0: 1.2, duz: 0.75, kh: 0, tur: 'pencere' })
    // Soğukluk: iç ölçü 15,75 x 17,85 m, kubbeli.
    yapDuv(W0, Z0, W1, Z0, H_D, [hp(4.2), { u: 9.2, g: 1.5, y0: 0, duz: 2.1, kh: 0.8, tur: 'kapi' }, hp(14.2)])
    yapDuv(W1, Z0, W1, Z1, H_D)
    yapDuv(W1, Z1, W0, Z1, H_D, [hp(5.2), hp(13.4)])
    yapDuv(W0, Z1, W0, Z0, H_D, [hp(5.2), hp(15.3)])
    // Taç kapı kavsarası: yedi sıra stalaktit (envanter s. 220)
    const kx = W0 + 9.2, kz = Z0
    for (let i = 0; i < 7; i++) {
      const o = 1 - i / 7, g = 2.3 * o + 0.3, d = 0.55 * o + 0.1, y = 3.1 + i * 0.16
      k.ekle(uvDunya(new THREE.BoxGeometry(g, 0.15, d).translate(kx, y, kz - d / 2 + 0.02)), koseTasi)
    }
    k.ekle(new THREE.BoxGeometry(3, 2.5, 0.15).translate(kx, 3.25 + 0.55, kz - 0.02), koseTasi)
    k.ekle(new THREE.BoxGeometry(1.5, 2.3, 0.08).translate(kx, 1.15, kz + 0.55), m.koyu)
    for (const [ax, az, bx, bz] of [[W0, Z0, W1, Z0], [W1, Z0, W1, Z1], [W1, Z1, W0, Z1], [W0, Z1, W0, Z0]]) sacak(ax, az, bx, bz, H_D - 0.2, k)
    // Üstte köşeleri kesilmiş kuşak (fotoğrafa göre)
    const cx = (W0 + W1) / 2
    const kU = Math.min(W1 - W0, Z1 - Z0) / 2 - 0.25
    hEk(duzGolge(silindirG(kU * 1.08, kU * 1.08, 1.5, 8).rotateY(Math.PI / 8)).translate(cx, H_D + 0.75, 0), moloz, kCati)
    kCati.ekle(new THREE.PlaneGeometry(W1 - W0 + 0.5, Z1 - Z0 + 0.5).rotateX(-Math.PI / 2).translate(cx, H_D + 0.22, 0), m.kursun)
    sacakHalka(kCati, cx, 0, H_D + 1.45, kU * 1.08, 8, tugla, koseTasi)
    // Kubbe: oluklu kiremit, üstte fener
    const R = kU * 0.99, HK = 6.1, tepeY = H_D + 1.58
    kKubbe.ekle(yer(dondurG(kubbeProfil(R, HK), 64, [1, 1]), cx, tepeY, 0), kiremit)
    kKubbe.ekle(duzGolge(silindirG(0.95, 0.95, 1.5, 8).rotateY(Math.PI / 8)).translate(cx, tepeY + HK + 0.55, 0), pbr({ map: tg.renk, roughness: 0.9 }))
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4, yu = 0.95 * Math.cos(Math.PI / 8) + 0.02
      kKubbe.ekle(new THREE.PlaneGeometry(0.42, 0.75).translate(0, tepeY + HK + 0.55, yu).rotateY(a).translate(cx, 0, 0), camDis)
    }
    kKubbe.ekle(yer(dondurG([[1.1, 0], [0.9, 0.08], [0.4, 0.48], [0.05, 0.62]], 8, [1, 1]), cx, tepeY + HK + 1.3, 0), kiremit)
    alem(kKubbe, cx, tepeY + HK + 1.9, 0, 0.5, m.altin)
    // Ilıklık ve sıcaklık: alçak gövde, delikli kubbeler (fotoğrafa göre); külhan doğuda.
    const X0 = W1, X1 = -24.5, ZB = 7, HA = 5.2
    yapDuv(X0, -ZB, X1, -ZB, HA, [hp(5.4), hp(11.8)])
    yapDuv(X1, -ZB, X1, ZB, HA)
    yapDuv(X1, ZB, X0, ZB, HA, [hp(4.6), hp(10.9)])
    for (const [ax, az, bx, bz] of [[X0, -ZB, X1, -ZB], [X1, -ZB, X1, ZB], [X1, ZB, X0, ZB]]) sacak(ax, az, bx, bz, HA - 0.2, k)
    kCati.ekle(new THREE.PlaneGeometry(X1 - X0 + 0.5, ZB * 2 + 0.5).rotateX(-Math.PI / 2).translate((X0 + X1) / 2, HA + 0.22, 0), hamamSiva)
    const gozlu = (x: number, z: number, r: number, h: number) => {
      kKubbe.ekle(yer(dondurG(kubbeProfil(r, h), 28, [1, 1]), x, HA + 0.22, z), hamamSiva)
      const satir = 5
      for (let s = 0; s < satir; s++) {
        const a = ((s + 0.6) / satir) * Math.PI * 0.46
        const yar = r * Math.cos(a) ** 0.88, y = h * Math.sin(a) ** 1.08
        const adet = Math.max(3, Math.round((yar * 2 * Math.PI) / 1.0))
        for (let n = 0; n < adet; n++) {
          const t = (n + (s % 2) * 0.5) / adet * Math.PI * 2
          const c = new THREE.CylinderGeometry(0.1, 0.13, 0.1, 8).rotateX(Math.PI / 2 - a * 1.2).rotateY(t)
          kKubbe.ekle(c.translate(x + Math.sin(t) * yar, HA + 0.25 + y, z + Math.cos(t) * yar), n % 3 ? m.koyu : camDis)
        }
      }
    }
    gozlu((X0 + X1) / 2, 0, 4.5, 3)
    for (const [dx, dz] of [[-6.2, 4.1], [-6.2, -4.1], [6.2, 4.1], [6.2, -4.1]]) gozlu((X0 + X1) / 2 + dx, dz, 2.25, 1.65)
    k.ekle(uvDunya(yer(new THREE.BoxGeometry(1.2, 7.6, 1.2), X1 - 0.7, 3.8, -5.4)), tugla)
  }
}
