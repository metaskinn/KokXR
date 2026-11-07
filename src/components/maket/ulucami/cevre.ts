// Ulu Camii'nin yakın çevresi: döşeme, kaba taş seki, ağaçlar, bahçe. Dokular kodla üretilir.
// Yerleşim arşivdeki drone karelerinden okunmuştur (DJI_..._0228 tepeden, _0291 kuzey cephe, dis-gorunum.jpg):
// kuzey avludaki tek büyük selvi ve çınar, doğudaki çardaklı meydan ve çim, güney duvarı önündeki yeşil sıra.
// Konumlar birkaç metre yaklaşıktır, ağaç biçimleri temsilîdir; çevredeki şehir dokusu bilerek konmamıştır.
import * as THREE from 'three'
import { KAPI_Z } from '../ulucamiDetay'
import { type ulucamiMalzemeleri } from '../ulucamiDokular'
import { Kova, YX, YZ, dondurG, kutuG, silindirG, yer } from '../ulucamiParca'
import { hafifCihaz, rastgele } from '../ulucamiZemin'

type Renk = [number, number, number]
const KAIDE_R = 70
const kume = (a: number, b: number, t: number) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u) }
const dikdortgenUzak = (x: number, z: number, cx: number, cz: number, hx: number, hz: number) => {
  const dx = Math.abs(x - cx) - hx, dz = Math.abs(z - cz) - hz
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0)
}

// Atlas bölgeleri (u0, v0, u1, v1). Kenarlarda taşmayı önleyen küçük pay bırakılır.
const B_DAL1 = [0.005, 0.505, 0.495, 0.995], B_DAL2 = [0.505, 0.505, 0.995, 0.995]
const B_FIDAN = [0.005, 0.255, 0.495, 0.495], B_KABUK = [0.01, 0.01, 0.49, 0.24]
const B_CIM = [0.53, 0.28, 0.97, 0.47], B_YAPRAK = [0.54, 0.035, 0.96, 0.215]

function tekrarli(el: HTMLCanvasElement, metre: number) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metre, 1 / metre)
  t.anisotropy = 16
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Fotoğraflardaki sarımsı kahve, küçük, dikdörtgen kesme taş; sıralar dikişsiz tekrarlanır. */
function dosemeDokusu() {
  const B = hafifCihaz() ? 1024 : 2048, M = 8, o = B / M
  const el = document.createElement('canvas'); el.width = el.height = B
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  const r = rastgele(211)
  c.fillStyle = '#574c3e'; c.fillRect(0, 0, B, B)
  let y = 0
  for (let sira = 0; sira < 20; sira++) {
    const h = sira % 2 ? 0.48 : 0.32, bas = r() * 0.7
    let x = bas
    while (x < bas + M - 0.01) {
      let u = 0.42 + r() * 0.5
      if (bas + M - (x + u) < 0.4) u = bas + M - x
      const ton = 30 + r() * 8, doy = 14 + r() * 8, ac = 44 + r() * 8
      for (const k of [x, x - M]) {
        const px = k * o + 0.018 * o, py = y * o + 0.018 * o, pw = (u - 0.036) * o, ph = (h - 0.036) * o
        c.fillStyle = `hsl(${ton} ${doy}% ${ac}%)`; c.fillRect(px, py, pw, ph)
        c.fillStyle = 'rgba(255,240,215,0.16)'; c.fillRect(px, py, pw, 0.012 * o)
        c.fillStyle = 'rgba(40,28,16,0.22)'; c.fillRect(px, py + ph - 0.016 * o, pw, 0.016 * o)
      }
      x += u
    }
    y += h
  }
  // Aşınma: ince benekler taşı düz renkten kurtarır.
  const nokta = B * B / 110
  for (let i = 0; i < nokta; i++) {
    const a = r(), s = 1 + r() * (B / 1024) * 2.2
    c.fillStyle = a > 0.45 ? `rgba(35,25,15,${r() * 0.17})` : `rgba(255,240,215,${r() * 0.13})`
    c.fillRect(r() * B, r() * B, s, s)
  }
  return tekrarli(el, M)
}

/** Tek atlas: çıplak çınar dalları, yaprak kümesi, çınar kabuğu, çim ve koyu ibre. */
function agacAtlasi() {
  const B = hafifCihaz() ? 1024 : 2048
  const el = document.createElement('canvas'); el.width = el.height = B
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  c.scale(B / 1024, B / 1024)
  const r = rastgele(307)
  c.lineCap = 'round'

  // Dal kartları: ince dallar ve üzerinde kalmış sarı-kahve yapraklar (Aralık kareleri).
  const dalKarti = (ox: number, yaprakOran: number) => {
    c.save(); c.beginPath(); c.rect(ox + 4, 4, 504, 504); c.clip()
    const dal = (x: number, y: number, a: number, u: number, k: number, s: number) => {
      const x2 = x + Math.sin(a) * u, y2 = y - Math.cos(a) * u
      c.strokeStyle = `hsl(${24 + r() * 10} 13% ${22 + s * 3}%)`; c.lineWidth = k
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2 + (r() - 0.5) * u * 0.3, (y + y2) / 2, x2, y2); c.stroke()
      if (s >= 4 && r() < yaprakOran) {
        c.fillStyle = `hsl(${22 + r() * 20} ${34 + r() * 26}% ${24 + r() * 18}%)`
        c.beginPath(); c.ellipse(x2 + (r() - 0.5) * 10, y2 + (r() - 0.5) * 10, 4 + r() * 3.5, 2.6 + r() * 2.4, r() * 3, 0, Math.PI * 2); c.fill()
      }
      if (s >= 7 || x2 < ox + 8 || x2 > ox + 504 || y2 < 8) return
      const n = s < 2 ? 3 : 2 + (r() < 0.5 ? 1 : 0)
      for (let i = 0; i < n; i++) dal(x2, y2, a + (i - (n - 1) / 2) * (0.5 + r() * 0.5) + (r() - 0.5) * 0.3, u * (0.7 + r() * 0.14), Math.max(2.3, k * 0.7), s + 1)
    }
    dal(ox + 256, 506, (r() - 0.5) * 0.2, 104, 9, 0)
    c.restore()
  }
  dalKarti(0, 0.06)
  dalKarti(512, 0.2)

  // İbreli yaprak kümesi: kenarı düzensiz, delikli; kartın kendisi görünmez.
  c.save(); c.beginPath(); c.rect(4, 516, 504, 248); c.clip()
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6), ox = 256 + Math.cos(a) * d * 215, oy = 640 + Math.sin(a) * d * 90
    const ton = 132 + r() * 30, sat = 13 + r() * 13, ac = 9 + r() * 15
    for (let n = 0; n < 34; n++) {
      const yy = r(), g = (1 - yy) * 15 + 3
      c.fillStyle = `hsl(${ton + r() * 8} ${sat}% ${(ac + r() * 11).toFixed(1)}%)`
      c.beginPath(); c.ellipse(ox + (r() - 0.5) * g * 2, oy + 26 - yy * 62, 1.1 + r() * 1.6, 5 + r() * 11, (r() - 0.5) * 0.7, 0, Math.PI * 2); c.fill()
    }
  }
  c.restore()

  // Çınar kabuğu: krem, zeytin ve kahve lekeler.
  c.fillStyle = '#7d7363'; c.fillRect(0, 768, 512, 256)
  c.save(); c.beginPath(); c.rect(0, 768, 512, 256); c.clip()
  for (let i = 0; i < 900; i++) {
    const a = r()
    c.fillStyle = a < 0.4 ? `hsl(${34 + r() * 14} ${12 + r() * 10}% ${48 + r() * 12}%)` : a < 0.75 ? `hsl(${50 + r() * 18} ${8 + r() * 10}% ${36 + r() * 10}%)` : `hsl(${24 + r() * 10} ${16 + r() * 10}% ${26 + r() * 10}%)`
    c.beginPath(); c.ellipse(r() * 512, 768 + r() * 256, 5 + r() * 28, 5 + r() * 15, r() * 3, 0, Math.PI * 2); c.fill()
  }
  c.restore()

  // Çim: açık gri-yeşil; asıl rengi köşe boyası verir.
  c.fillStyle = '#b7b9a4'; c.fillRect(512, 512, 512, 256)
  for (let i = 0; i < 14000; i++) {
    const a = r()
    c.fillStyle = a > 0.5 ? `rgba(35,50,20,${0.1 + r() * 0.22})` : `rgba(235,240,195,${0.08 + r() * 0.2})`
    c.fillRect(512 + r() * 512, 512 + r() * 256, 1.5 + r() * 2, 2 + r() * 6)
  }

  // Ağacın kapalı gövdesi: koyu ve derin, tepesi kartlardan gelir.
  c.fillStyle = '#121c17'; c.fillRect(512, 768, 512, 256)
  for (let i = 0; i < 3400; i++) {
    const a = r()
    c.fillStyle = `hsl(${132 + a * 30} ${13 + a * 13}% ${(7 + a * 20).toFixed(1)}%)`
    c.beginPath(); c.ellipse(512 + r() * 512, 768 + r() * 256, 1.5 + r() * 3, 7 + r() * 11, (r() - 0.5) * 1.4, 0, Math.PI * 2); c.fill()
  }

  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Üçgen yığını: ağaç gövdesi ve kartları tek geometride biriktirir. */
class Yigin {
  konum: number[] = []; normal: number[] = []; uv: number[] = []; renk: number[] = []
  kose(p: THREE.Vector3, n: THREE.Vector3, u: number, v: number, c: Renk) {
    this.konum.push(p.x, p.y, p.z); this.normal.push(n.x, n.y, n.z); this.uv.push(u, v); this.renk.push(c[0], c[1], c[2])
  }
  dortgen(a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, e: THREE.Vector3, na: THREE.Vector3, nb: THREE.Vector3, nd: THREE.Vector3, ne: THREE.Vector3, uv: number[][], c: Renk, c2 = c) {
    this.kose(a, na, uv[0][0], uv[0][1], c); this.kose(b, nb, uv[1][0], uv[1][1], c); this.kose(d, nd, uv[2][0], uv[2][1], c2)
    this.kose(a, na, uv[0][0], uv[0][1], c); this.kose(d, nd, uv[2][0], uv[2][1], c2); this.kose(e, ne, uv[3][0], uv[3][1], c2)
  }
  geometri() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.konum, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normal, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.renk, 3))
    return g
  }
}

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

/** Alttan üste yönlü bir kart: kenar `sag`, boy `ust`; ışık hesabı için normal dışarı bakar. */
function kart(Y: Yigin, taban: THREE.Vector3, sag: THREE.Vector3, ust: THREE.Vector3, n: THREE.Vector3, b: number[], c: Renk) {
  const a = taban.clone().sub(sag), d = taban.clone().add(sag), e = d.clone().add(ust), f = a.clone().add(ust)
  Y.dortgen(a, d, e, f, n, n, n, n, [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], c)
}

/** Halkalardan boru: kabuk bölgesi aynalanarak sarılır, bu sayede atlasın içinde kalır. */
function boru(Y: Yigin, halka: { p: THREE.Vector3; r: number }[], kenar: number, c: Renk, c2: Renk) {
  const yon = V(), s = V(), t = V(), n0 = V(), n1 = V()
  const nokta = (h: { p: THREE.Vector3; r: number }, i: number, a: number, cikti: THREE.Vector3) => {
    yon.copy(halka[Math.min(i + 1, halka.length - 1)].p).sub(halka[Math.max(i - 1, 0)].p).normalize()
    s.set(1, 0, 0).cross(yon); if (s.lengthSq() < 0.01) s.set(0, 0, 1).cross(yon)
    s.normalize(); t.crossVectors(yon, s)
    cikti.copy(s).multiplyScalar(Math.cos(a)).addScaledVector(t, Math.sin(a))
    return cikti.clone().multiplyScalar(h.r).add(h.p)
  }
  const [u0, v0, u1, v1] = B_KABUK
  for (let i = 0; i < halka.length - 1; i++) {
    const f0 = halka.length > 2 ? i / (halka.length - 1) : 0, f1 = (i + 1) / (halka.length - 1)
    const ca: Renk = [c[0] + (c2[0] - c[0]) * f0, c[1] + (c2[1] - c[1]) * f0, c[2] + (c2[2] - c[2]) * f0]
    const cb: Renk = [c[0] + (c2[0] - c[0]) * f1, c[1] + (c2[1] - c[1]) * f1, c[2] + (c2[2] - c[2]) * f1]
    for (let k = 0; k < kenar; k++) {
      const a0 = (k / kenar) * Math.PI * 2, a1 = ((k + 1) / kenar) * Math.PI * 2
      const pa = nokta(halka[i], i, a0, n0), na = n0.clone(), pb = nokta(halka[i], i, a1, n1), nb = n1.clone()
      const pd = nokta(halka[i + 1], i + 1, a1, n1), nd = n1.clone(), pe = nokta(halka[i + 1], i + 1, a0, n0), ne = n0.clone()
      const um = (q: number) => u0 + (u1 - u0) * Math.abs(((q / kenar) * 2) % 2 - 1)
      const vu = i % 2 ? v1 : v0, vv = i % 2 ? v0 : v1
      Y.dortgen(pa, pb, pd, pe, na, nb, nd, ne, [[um(k), vu], [um(k + 1), vu], [um(k + 1), vv], [um(k), vv]], ca, cb)
    }
  }
}

/** Çıplak çınar: gövde ve üç kat dal geometri, en ince dallar kart. Fotoğraflarda Aralık görünümüdür. */
function cinar(Y: Yigin, K: Yigin, x: number, z: number, boy: number, govdeR: number, tohum: number) {
  const r = rastgele(tohum), merkez = V(x, boy * 0.6, z), yon = V(), tmp = V()
  const dal = (bas: THREE.Vector3, d0: THREE.Vector3, uz: number, ra: number, sev: number) => {
    const adim = [5, 4, 3, 3][sev], d = d0.clone(), p = bas.clone()
    const halka: { p: THREE.Vector3; r: number }[] = []
    for (let i = 0; i <= adim; i++) {
      const f = i / adim
      const rad = ra * (1 - 0.55 * f) * (sev === 0 && i === 0 ? 1.45 : 1)
      halka.push({ p: p.clone(), r: rad })
      d.x += (r() - 0.5) * 0.34; d.y += (r() - 0.5) * 0.2 + (sev === 0 ? 0 : 0.05); d.z += (r() - 0.5) * 0.34
      d.normalize()
      p.addScaledVector(d, uz / adim)
    }
    const koyu = 1 - sev * 0.17
    boru(Y, halka, [8, 6, 4, 3][sev], [0.95 * koyu, 0.9 * koyu, 0.82 * koyu], [0.85 * koyu, 0.78 * koyu, 0.68 * koyu])
    if (sev < 3) {
      const n = sev === 0 ? 4 : 3
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 1.3, h = halka[Math.floor(adim * (sev === 0 ? 0.8 + r() * 0.2 : 0.5 + r() * 0.5))]
        const yay = sev === 0 ? 0.75 + r() * 0.3 : 0.55 + r() * 0.4
        yon.set(Math.cos(a) * yay, 0.75 + (r() - 0.3) * 0.35, Math.sin(a) * yay).add(tmp.copy(d).multiplyScalar(0.55)).normalize()
        dal(h.p.clone(), yon, boy * [0.38, 0.28, 0.2][sev] * (0.8 + r() * 0.4), ra * 0.56, sev + 1)
      }
    }
    if (sev === 3) {
      // Uçlara çapraz iki dal kartı; normaller tepe merkezinden dışa bakar, taç bütün gibi aydınlanır.
      const uc = p.clone(), n = uc.clone().sub(merkez).normalize()
      const S = boy * 0.2 * (0.8 + r() * 0.4)
      for (let j = 0; j < 3; j++) {
        const a = r() * Math.PI
        const sag = V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(S / 2)
        const ust = d.clone().multiplyScalar(0.75).add(V((r() - 0.5) * 0.6, 0.35, (r() - 0.5) * 0.6)).normalize().multiplyScalar(S)
        const ton = 0.8 + r() * 0.25
        kart(K, uc, sag, ust, n, r() > 0.55 ? B_DAL2 : B_DAL1, [ton, ton * 0.96, ton * 0.9])
      }
    }
  }
  dal(V(x, 0, z), V((r() - 0.5) * 0.14, 1, (r() - 0.5) * 0.14).normalize(), boy * 0.3, govdeR, 0)
}

/** Yumru yüzeyli yeşil kütle ve dışına serpilmiş yaprak kartları. Büyük selvi ve güneydeki koyu sıra için. */
function yesilKutle(Gv: THREE.BufferGeometry[], K: Yigin, opt: { x: number; z: number; y0: number; boy: number; R: (t: number) => number; halka: number; dilim: number; kartSay: number; kartB: [number, number]; koyu: Renk; acik: Renk; tohum: number; dalga?: number }) {
  const { x, z, y0, boy, R, halka, dilim, kartSay, kartB, koyu, acik, tohum, dalga = 1 } = opt
  const r = rastgele(tohum), s = tohum * 0.37
  const yumru = (a: number, y: number) => 0.62 * Math.sin(a * 2 + y * 0.31 + s) + 0.5 * Math.sin(a * 5 + y * 0.72 + s * 1.7) + 0.3 * Math.sin(a * 9 - y * 1.5 + s * 2) + 0.2 * Math.sin(a * 15 + y * 2.7)
  const konum: number[] = [], uv: number[] = [], renk: number[] = [], dizin: number[] = []
  const [u0, v0, u1, v1] = B_YAPRAK
  for (let h = 0; h <= halka; h++) {
    const t = h / halka, y = y0 + boy * t
    for (let d = 0; d <= dilim; d++) {
      const a = (d / dilim) * Math.PI * 2, n = yumru(a, y), rd = R(t) * (1 + 0.19 * n * dalga)
      konum.push(x + Math.sin(a) * rd, y, z + Math.cos(a) * rd)
      uv.push(u0 + (u1 - u0) * (d % 2), h % 2 ? v0 : v1)
      const l = kume(-0.7, 0.8, n) * (0.55 + 0.45 * t)
      renk.push(koyu[0] + (acik[0] - koyu[0]) * l, koyu[1] + (acik[1] - koyu[1]) * l, koyu[2] + (acik[2] - koyu[2]) * l)
    }
  }
  for (let h = 0; h < halka; h++) for (let d = 0; d < dilim; d++) {
    const p = h * (dilim + 1) + d, q = p + dilim + 1
    dizin.push(p, p + 1, q, p + 1, q + 1, q)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3))
  g.setIndex(dizin)
  g.computeVertexNormals()
  Gv.push(g)

  for (let i = 0; i < kartSay; i++) {
    const t = Math.pow(r(), 0.8), a = r() * Math.PI * 2, y = y0 + boy * t, n = yumru(a, y)
    const rd = R(t) * (1 + 0.19 * n * dalga)
    const dis = V(Math.sin(a), 0.16, Math.cos(a)).normalize()
    const teg = V(Math.cos(a), 0, -Math.sin(a))
    const S = (kartB[0] + r() * (kartB[1] - kartB[0])) * (0.5 + 0.5 * (1 - t))
    const sag = teg.clone().multiplyScalar(S / 2 * (0.6 + r() * 0.4)).addScaledVector(dis, (r() - 0.5) * S * 0.45)
    const ust = V((r() - 0.5) * 0.4, 0.75, (r() - 0.5) * 0.4).addScaledVector(dis, 0.55).normalize().multiplyScalar(S * 0.62)
    const l = kume(-0.8, 0.8, n) * 0.55 + r() * 0.45
    const taban = V(x + Math.sin(a) * rd, y - S * 0.3, z + Math.cos(a) * rd)
    kart(K, taban, sag, ust, dis, B_FIDAN, [koyu[0] + (acik[0] - koyu[0]) * l, koyu[1] + (acik[1] - koyu[1]) * l, koyu[2] + (acik[2] - koyu[2]) * l])
  }
}

export function ulucamiCevresi(m: ReturnType<typeof ulucamiMalzemeleri>, k: Kova) {
  const hafif = hafifCihaz()
  const taban = dosemeDokusu(), atlas = agacAtlasi()
  const zeminMal = new THREE.MeshStandardMaterial({ map: taban, vertexColors: true, roughness: 0.93, bumpMap: hafif ? null : taban, bumpScale: 0.9 })
  const govdeMal = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.96 })
  const kartMal = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.96, alphaTest: 0.42, side: THREE.DoubleSide })
  const kZ = new Kova(), kG = new Kova(), kK = new Kova()

  // Köşeye boya: kutu altı koyu, üstü açık; tek malzemeyle seki, bordür ve duvarlar çizilir.
  const boya = (g: THREE.BufferGeometry, f: (x: number, y: number, z: number) => Renk) => {
    const p = g.attributes.position, c = new Float32Array(p.count * 3)
    for (let i = 0; i < p.count; i++) c.set(f(p.getX(i), p.getY(i), p.getZ(i)), i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(c, 3))
    return g
  }
  const tasKutu = (g: number, h: number, d: number, x: number, y: number, z: number, alt: Renk, ust: Renk) => {
    const kg = kutuG(g, h, d)
    // Uv kaydırma: her taş kutu dokunun aynı köşesinden başlamasın.
    const uv = kg.attributes.uv, su = x * 0.73 + z * 0.41, sv = y * 1.3 + x * 0.17
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + su, uv.getY(i) + sv)
    const k0 = y - h / 2
    kZ.ekle(boya(yer(kg, x, y, z), (_x, vy) => { const f = (vy - k0) / h; return [alt[0] + (ust[0] - alt[0]) * f, alt[1] + (ust[1] - alt[1]) * f, alt[2] + (ust[2] - alt[2]) * f] }), zeminMal)
  }

  // --- Zemin: köşe boyalı ızgara. Meydan açık kum rengi, kaidenin kenarı nötr; duvar dipleri kirli. ---
  const leke = (x: number, z: number) => 0.5 + 0.5 * (0.5 * Math.sin(x * 0.19 + z * 0.13 + 1.3) * Math.sin(z * 0.31 - x * 0.07) + 0.3 * Math.sin(x * 0.53 + 2.1) * Math.sin(z * 0.61) + 0.2 * Math.sin(x * 1.1 + z * 0.9))
  const zeminRenk = (x: number, z: number): Renk => {
    const icMeydan = 1 - kume(-1, 3, dikdortgenUzak(x, z, 4, -6.5, 48, 42.5))
    const duvar = kume(0.3, 3.6, dikdortgenUzak(x, z, 0, 0, YX + 1.1, YZ + 1.1))
    const l = (0.82 + 0.3 * leke(x, z)) * (0.74 + 0.26 * duvar)
    return [
      l * (0.58 + 0.42 * icMeydan),
      l * (0.57 + 0.4 * icMeydan),
      l * (0.56 + 0.34 * icMeydan),
    ]
  }
  {
    const HC = 2, N = Math.ceil((KAIDE_R + HC) / HC) * 2
    const konum: number[] = [], uv: number[] = [], renk: number[] = [], dizin: number[] = []
    const satir = (i: number, j: number) => i * (N + 1) + j
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      let x = -N / 2 * HC + j * HC, z = -N / 2 * HC + i * HC
      const q = Math.hypot(x, z)
      if (q > KAIDE_R) { x *= KAIDE_R / q; z *= KAIDE_R / q }
      konum.push(x, 0.015, z); uv.push(x, z)
      const c = zeminRenk(x, z); renk.push(c[0], c[1], c[2])
    }
    const disari = (x: number, z: number) => Math.hypot(x, z) >= KAIDE_R - 1e-3
    const icerde = (x: number, z: number) => Math.abs(x) < YX - 1 && Math.abs(z) < YZ - 1
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = satir(i, j), b = satir(i, j + 1), c = satir(i + 1, j), d = satir(i + 1, j + 1)
      const kosem = [a, b, c, d].map((v) => [konum[v * 3], konum[v * 3 + 2]])
      if (kosem.every(([x, z]) => disari(x, z)) || kosem.every(([x, z]) => icerde(x, z))) continue
      dizin.push(a, c, b, b, c, d)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3))
    g.setIndex(dizin)
    g.computeVertexNormals()
    kZ.ekle(g, zeminMal)
  }

  // Temas şeridi: dibe yaslanan dar, koyu şerit. Izgaranın üstünde, aynı dokuyla.
  const dipSeridi = (x0: number, x1: number, z0: number, z1: number, gen: number, koyu: number) => {
    const Yg = new Yigin(), nu = V(0, 1, 0)
    const parca = (ax: number, az: number, bx: number, bz: number, dx: number, dz: number) => {
      const adet = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2.5))
      for (let i = 0; i < adet; i++) {
        const f0 = i / adet, f1 = (i + 1) / adet
        const px0 = ax + (bx - ax) * f0, pz0 = az + (bz - az) * f0, px1 = ax + (bx - ax) * f1, pz1 = az + (bz - az) * f1
        const a = V(px0, 0.028, pz0), b = V(px1, 0.028, pz1), c = V(px1 + dx * gen, 0.028, pz1 + dz * gen), d = V(px0 + dx * gen, 0.028, pz0 + dz * gen)
        const r0 = zeminRenk(px0, pz0), r1 = zeminRenk(px1, pz1), rd = zeminRenk(d.x, d.z), rc = zeminRenk(c.x, c.z)
        Yg.kose(a, nu, a.x, a.z, [r0[0] * koyu, r0[1] * koyu, r0[2] * koyu]); Yg.kose(d, nu, d.x, d.z, rd); Yg.kose(b, nu, b.x, b.z, [r1[0] * koyu, r1[1] * koyu, r1[2] * koyu])
        Yg.kose(b, nu, b.x, b.z, [r1[0] * koyu, r1[1] * koyu, r1[2] * koyu]); Yg.kose(d, nu, d.x, d.z, rd); Yg.kose(c, nu, c.x, c.z, rc)
      }
    }
    parca(x1, z0, x0, z0, 0, -1); parca(x0, z1, x1, z1, 0, 1); parca(x0, z0, x0, z1, -1, 0); parca(x1, z1, x1, z0, 1, 0)
    kZ.ekle(Yg.geometri(), zeminMal)
  }

  // --- Bina sekisi: fotoğraftaki iki sıralı kaba taş ayak (mermer değil). Kapı önlerinde kesilir. ---
  const SEKI_1 = 1.2, SEKI_2 = 0.66
  const seki = (eksen: 'x' | 'z', sabit: number, bas: number, son: number, boslar: [number, number][]) => {
    let a = bas
    const dilimler: [number, number][] = []
    for (const [b0, b1] of boslar) { dilimler.push([a, b0]); a = b1 }
    dilimler.push([a, son])
    for (const [d0, d1] of dilimler) {
      const L = d1 - d0, ort = (d0 + d1) / 2, isaret = Math.sign(sabit)
      for (const [proud, y, h, alt, ust] of [[SEKI_1, 0.2, 0.4, [0.5, 0.53, 0.6], [0.74, 0.78, 0.86]], [SEKI_2, 0.62, 0.48, [0.62, 0.65, 0.72], [0.9, 0.94, 1.02]]] as [number, number, number, Renk, Renk][]) {
        const px = sabit + isaret * (proud - 0.3) / 2 + isaret * 0.15
        if (eksen === 'x') tasKutu(L, h, proud + 0.3, ort, y, px, alt, ust)
        else tasKutu(proud + 0.3, h, L, px, y, ort, alt, ust)
      }
    }
  }
  const EK = 1.2
  seki('x', -YZ, -YX - EK, YX + EK, [[-6.3, 6.3]])
  seki('x', YZ, -YX - EK, YX + EK, [])
  seki('z', -YX, -YZ, YZ, [[KAPI_Z - 2.2, KAPI_Z + 2.2]])
  seki('z', YX, -YZ, YZ, [[KAPI_Z - 2.2, KAPI_Z + 2.2]])
  dipSeridi(-YX - SEKI_1, YX + SEKI_1, -YZ - SEKI_1, YZ + SEKI_1, 1.3, 0.5)
  // Taç kapı basamaklarının dibi (18 m genişlik, kapıdan 7,15 m ileri).
  dipSeridi(-9, 9, -YZ - 7.15, -YZ - 1.2, 0.7, 0.55)

  // Kaidenin kenarı: maketi çerçeveleyen alçak taş bordür.
  kZ.ekle(boya(dondurG([[KAIDE_R - 0.6, 0.02], [KAIDE_R - 0.6, 0.16], [KAIDE_R, 0.16], [KAIDE_R, 0]], 96, [440, 1]), () => [0.46, 0.44, 0.41]), zeminMal)

  // --- Avlu çeşmesi: taç kapı ekseninde, sekizgen teknenin üstünde dar mermer gövde (dis-gorunum.jpg). ---
  {
    const z = -YZ - 13.5
    k.ekle(yer(silindirG(1.55, 1.7, 0.25, 8), 0, 0.125, z), m.mermer)
    k.ekle(yer(silindirG(1.25, 1.35, 0.4, 8), 0, 0.45, z), m.mermer)
    k.ekle(yer(kutuG(1.15, 2.2, 0.5), 0, 1.7, z), m.mermer)
    k.ekle(yer(kutuG(0.62, 1.15, 0.05), 0, 1.45, z - 0.25), m.koyu)
    k.ekle(yer(kutuG(1.4, 0.16, 0.66), 0, 2.86, z), m.mermer)
    k.ekle(yer(silindirG(0.32, 0.56, 0.32, 8), 0, 3.1, z), m.mermer)
  }

  // --- Avlunun kuzey sınırı: alçak taş üstünde demir parmaklık (bölüm konumu yaklaşık, temsilî). ---
  {
    const z = -YZ - 21, AC = 4.5, BOY = 27
    for (const s of [-1, 1]) {
      const ort = s * (AC + BOY) / 2, L = BOY - AC
      tasKutu(L, 0.34, 0.4, ort, 0.17, z, [0.36, 0.33, 0.3], [0.6, 0.56, 0.5])
      for (const y of [0.52, 1.46]) k.ekle(yer(kutuG(L, 0.05, 0.05), ort, y, z), m.koyu)
      for (let x = AC; x <= BOY; x += 0.42) k.ekle(yer(kutuG(0.035, 1.14, 0.035), s * x, 0.92, z), m.koyu)
      for (let x = AC; x <= BOY; x += 3.36) k.ekle(yer(kutuG(0.09, 1.28, 0.09), s * x, 0.98, z), m.koyu)
    }
  }

  // --- Doğu meydanı: alçak duvar üzerinde koyu çatılı iki çardak ve çim (_0228, dis-gorunum). ---
  const cardak = (z0: number, z1: number) => {
    const x = 44, L = z1 - z0, ort = (z0 + z1) / 2
    tasKutu(0.55, 1, L + 0.6, x + 1, 0.5, ort, [0.34, 0.31, 0.28], [0.72, 0.65, 0.55])
    kZ.ekle(boya(yer(kutuG(2.9, 0.1, L).rotateZ(-0.09), x, 2.65, ort), () => [0.27, 0.28, 0.3]), zeminMal)
    k.ekle(yer(kutuG(0.12, 0.16, L), x - 1.1, 2.52, ort), m.koyu)
    for (let z = z0 + 0.15; z <= z1; z += L / 5 - 0.06) {
      k.ekle(yer(kutuG(0.1, 2.5, 0.1), x - 1.1, 1.25, z), m.koyu)
      k.ekle(yer(kutuG(0.1, 1.6, 0.1), x + 1, 1.8, z), m.koyu)
    }
  }
  cardak(-37, -24)
  cardak(-22.5, -9.5)
  const cimAlan = (x0: number, x1: number, z0: number, z1: number) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, G = x1 - x0, D = z1 - z0
    for (const [gx, gd, px, pz] of [[G + 0.5, 0.25, cx, z0], [G + 0.5, 0.25, cx, z1], [0.25, D, x0, cz], [0.25, D, x1, cz]]) tasKutu(gx, 0.38, gd, px, 0.19, pz, [0.42, 0.39, 0.35], [0.82, 0.77, 0.67])
    const Yg = new Yigin(), n = V(0, 1, 0)
    const [u0, v0, u1, v1] = B_CIM
    const P = 3
    for (let i = 0; i < P; i++) for (let j = 0; j < P; j++) {
      const ax = x0 + (G * i) / P, bx = x0 + (G * (i + 1)) / P, az = z0 + (D * j) / P, bz = z0 + (D * (j + 1)) / P
      const c: Renk = [0.25 + leke(ax * 3, az * 3) * 0.08, 0.42 + leke(az * 3, ax * 3) * 0.1, 0.15]
      Yg.dortgen(V(ax, 0.3, az), V(ax, 0.3, bz), V(bx, 0.3, bz), V(bx, 0.3, az), n, n, n, n, [[u0, v0], [u0, v1], [u1, v1], [u1, v0]], c)
    }
    kG.ekle(Yg.geometri(), govdeMal)
  }
  cimAlan(45.5, 56.6, -22, -8.3)
  cimAlan(52, 57.5, -2.5, 4.5)

  // --- Ağaçlar ---
  const Gv = new Yigin(), Kt = new Yigin()
  // Çınarlar: kuzey avluda kapı önü ve batı minaresi yanı, doğu meydanı ve çim kenarı (_0228, _0510).
  const agaclar: [number, number, number, number, number, boolean][] = [
    [8.5, -YZ - 14, 16, 0.55, 11, true],
    [-33, -YZ - 10, 15, 0.8, 23, true],
    [45, -YZ - 12, 7.5, 0.22, 37, true],
    [49, -YZ - 9, 14, 0.45, 41, true],
    [54, 1, 18, 0.65, 53, false],
    [50.5, 12, 17, 0.6, 59, true],
    [58, -17, 17, 0.6, 67, false],
    [-46, 22, 8, 0.25, 71, true],
  ]
  for (const [x, z, boy, r, tohum, cukur] of agaclar) {
    cinar(Gv, Kt, x, z, boy, r, tohum)
    // Gövde dibindeki ağaç çukuru (dis-gorunum.jpg).
    if (cukur) tasKutu(1.7 + r, 0.03, 1.7 + r, x, 0.03, z, [0.14, 0.11, 0.09], [0.14, 0.11, 0.09])
  }
  const gvParcalar: THREE.BufferGeometry[] = []
  // Kuzey avludaki tek büyük selvi: cephenin üstüne çıkan geniş, koyu, kümeli gövde (dis-gorunum, _0291).
  const SELVI_X = -9.5, SELVI_Z = -YZ - 14
  yesilKutle(gvParcalar, Kt, {
    x: SELVI_X, z: SELVI_Z, y0: 2.4, boy: 22.5, halka: 34, dilim: 26, kartSay: 520, kartB: [1.7, 3.2],
    R: (t) => (t < 0.14 ? 2.6 + (t / 0.14) * 1.9 : 4.5 * Math.pow(1 - (t - 0.14) / 0.86, 0.6) + 0.05),
    koyu: [0.36, 0.42, 0.4], acik: [0.86, 0.95, 0.74], tohum: 13, dalga: 1.4,
  })
  boru(Gv, [{ p: V(SELVI_X, 0.5, SELVI_Z), r: 0.5 }, { p: V(SELVI_X + 0.05, 2, SELVI_Z), r: 0.42 }, { p: V(SELVI_X, 4.5, SELVI_Z), r: 0.32 }], 8, [0.5, 0.42, 0.34], [0.4, 0.33, 0.27])
  // Selvinin yanındaki yükseltilmiş taş saksı (dis-gorunum.jpg).
  kZ.ekle(boya(yer(silindirG(1.95, 2.05, 0.7, 16), SELVI_X, 0.35, SELVI_Z), (_x, y) => { const f = y / 0.7; return [0.42 + 0.3 * f, 0.39 + 0.28 * f, 0.35 + 0.24 * f] }), zeminMal)
  k.ekle(yer(silindirG(1.72, 1.72, 0.04, 16), SELVI_X, 0.71, SELVI_Z), m.koyu)
  // Güney duvarının doğu yarısı önündeki koyu sıra ve güneydoğudaki iki iri kütle (_0228). Tür belirsiz.
  for (let i = 0; i < 9; i++) {
    const x = 8.5 + i * 3, r = 1.9 + ((i * 7) % 3) * 0.28, h = 4.2 + ((i * 5) % 4) * 0.5
    yesilKutle(gvParcalar, Kt, {
      x, z: 33.6 + ((i * 3) % 2) * 0.7, y0: 0.1, boy: h, halka: 7, dilim: 12, kartSay: 60, kartB: [1.5, 2.6],
      R: (t) => r * Math.pow(Math.max(0.02, 1 - t), 0.5) * (0.82 + 0.3 * Math.min(1, t * 3)),
      koyu: [0.42, 0.5, 0.42], acik: [0.82, 0.95, 0.7], tohum: 17 + i, dalga: 1.3,
    })
  }
  for (const [x, z, r, h, t] of [[43, 42, 5, 9.5, 29], [55, 27, 4.6, 9, 31]]) {
    yesilKutle(gvParcalar, Kt, {
      x, z, y0: 1.4, boy: h, halka: 10, dilim: 16, kartSay: 170, kartB: [2, 3.2],
      R: (q) => r * Math.sqrt(Math.max(0, 1 - Math.pow((q - 0.32) / 0.68, 2))) * (q < 0.32 ? 0.75 + q * 0.8 : 1) + 0.02,
      koyu: [0.42, 0.5, 0.42], acik: [0.85, 0.95, 0.72], tohum: t, dalga: 1.3,
    })
    boru(Gv, [{ p: V(x, 0, z), r: 0.32 }, { p: V(x, 2.5, z), r: 0.24 }], 6, [0.5, 0.42, 0.34], [0.42, 0.35, 0.28])
  }
  gvParcalar.forEach((g) => kG.ekle(g, govdeMal))
  kG.ekle(Gv.geometri(), govdeMal)
  kK.ekle(Kt.geometri(), kartMal)

  const grup = new THREE.Group()
  const kartlar = kK.grup()
  // GTAO geçişi saydamlığı bilmez, kartları dolu dörtgen sanır: o geçişte bu ağı çizmeyiz.
  kartlar.children.forEach((c) => {
    c.onBeforeRender = (_r, sahne, _k, g) => { g.setDrawRange(0, sahne.overrideMaterial ? 0 : Infinity) }
  })
  grup.add(kZ.grup(), kG.grup(), kartlar)
  return grup
}
