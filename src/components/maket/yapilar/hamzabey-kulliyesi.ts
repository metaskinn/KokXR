// Hamzabey Külliyesi temsilî maketi. Birim metre; kuzey -z, kıble (güney) +z, doğu +x.
// Kaynaklı ölçüler: orta kubbe 8,10 m çap, iki kubbe arası kemerin üzengisi sofadan 1,75 m, orta ayakların 80 cm taşması (Envanter, s. 180-183).
// Plan düzeni (ters T, tabhaneler, revak, türbelerin yeri) Drive'daki dik kuşbakışı fotoğraftan oranlanmıştır; yükseklikler ve geri kalan ölçüler temsilîdir.
// Hat yazısı taklit edilmez. Kuzey cephesi ve iç mekân fotoğraflara bakılarak yorumlanmıştır.
import * as THREE from 'three'
import type { Maket } from '../ulucamiMaket'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import type { IcDurak, Kutu, ZeminAlani } from '../ulucamiIc'
import { Kova, cikar, dikdortgen, dondurG, duzGolge, kemer, kutuG, silindirG, uvSigdir, yer, type Mal } from '../ulucamiParca'
import { hamzabeyMalzemeleri } from './hamzabey-kulliyesi-parca/dokular'

/** Plan merkezi sahnenin ortasına gelsin diye tüm yapı bu kadar kaydırılır (kaide y ekseninde merkezlidir). */
const OX = 5, OZ = 14.5
const KAIDE_R = 36
const F = 1, PLATFORM = 1.6, GOZ = 1.7
const BANT_ALT = 8.8
const MIHRAP_Z = 9.4, KIBLE_Z = 13.45
const EYVAN_X = 8.05, EYVAN_Z = 0.1
const HAMZA = { x: -21.8, z: -19.7 }, AILE = { x: -14.9, z: -7.7 }, MUSTAFA = { x: -7.7, z: -38.5 }, MINARE = { x: 13.85, z: -7.6 }
const MINBER = { x: -2.9, boy: 5.2, en: 1.9, tepe: 2.9, z0: 8.1, s0: 0.75, s1: 4.05, h1: 2.55 }

type Acik =
  | { tip: 'alt' | 'ust'; u: number; F: number }
  | { tip: 'kemer'; u: number; y0: number; g: number; duz: number; kH: number; cizgi?: boolean }

export const yapi = (): Maket => {
  const u = ulucamiMalzemeleri()
  const m = hamzabeyMalzemeleri()
  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()
  const kutu = (g: number, h: number, d: number, mal: Mal, x: number, y: number, z: number, kv = k) => kv.ekle(yer(kutuG(g, h, d), x, y, z), mal)
  /** Nokta ışığı olmayan yapıların (revak, türbeler) içi kararmasın diye sıvaya hafif öz ışık verilir. */
  let sivaAktif: Mal = m.siva

  /** Kemer şeridi: yerel z'de `z`den `z+d`ye. */
  const halka = (cx: number, y0: number, gDis: number, duzDis: number, kDis: number, gIc: number, duzIc: number, kIc: number, d: number, z: number, y0Ic = y0) => {
    // Delik yerine tek kapalı şerit: taban kenarları çakışınca üçgenleme açıklıkta ince çizgi bırakıyordu.
    const oD = gDis / 2, oI = gIc / 2, s = new THREE.Shape()
    s.moveTo(cx - oD, y0)
    s.lineTo(cx - oD, y0 + duzDis)
    s.quadraticCurveTo(cx - oD, y0 + duzDis + kDis * 0.55, cx, y0 + duzDis + kDis)
    s.quadraticCurveTo(cx + oD, y0 + duzDis + kDis * 0.55, cx + oD, y0 + duzDis)
    s.lineTo(cx + oD, y0)
    s.lineTo(cx + oI, y0Ic)
    s.lineTo(cx + oI, y0Ic + duzIc)
    s.quadraticCurveTo(cx + oI, y0Ic + duzIc + kIc * 0.55, cx, y0Ic + duzIc + kIc)
    s.quadraticCurveTo(cx - oI, y0Ic + duzIc + kIc * 0.55, cx - oI, y0Ic + duzIc)
    s.lineTo(cx - oI, y0Ic)
    s.closePath()
    return cikar(s, d, z)
  }

  /** Testere dişi sırası: yerel z=d yüzeyine, L boyunca. */
  const testere = (L: number, y: number, x: number, z: number, ry: number, d: number, adim = 0.34, kv = k) => {
    const n = Math.floor(L / adim)
    for (let i = 0; i < n; i++) {
      const g = new THREE.BoxGeometry(0.2, 0.2, 0.14).rotateZ(Math.PI / 4).translate(-L / 2 + (i + 0.5) * adim, y, d + 0.02)
      kv.ekle(yer(g, x, 0, z, ry), m.tugla)
    }
  }

  /**
   * Duvar: yerel z=0 iç yüz, z=t dış yüz. İç yarı sıva, dış yarı `dis` malzeme.
   * Pencere boşluklarının ardında iki opak düzlem vardır: içe aydınlık cam, dışa parmaklık veya şebeke.
   */
  const duvar = (L: number, y0: number, y1: number, x: number, z: number, ry: number, t: number, dis: Mal, acik: Acik[]) => {
    const a = dikdortgen(-L / 2, y0, L / 2, y1), b = dikdortgen(-L / 2, y0, L / 2, y1), c = dikdortgen(-L / 2, y0, L / 2, y1)
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z, ry), mal)
    for (const p of acik) {
      if (p.tip === 'kemer') {
        for (const s of [a, b, c]) s.holes.push(kemer(new THREE.Path(), p.u, p.y0, p.g, p.duz, p.kH))
        if (p.cizgi) {
          ek(halka(p.u, p.y0, p.g + 0.14, p.duz, p.kH + 0.1, p.g + 0.02, p.duz, p.kH + 0.01, 0.015, -0.015), m.cizgi)
          ek(halka(p.u, p.y0, p.g + 0.14, p.duz, p.kH + 0.1, p.g + 0.02, p.duz, p.kH + 0.01, 0.015, t), m.cizgi)
        }
        continue
      }
      if (p.tip === 'alt') {
        // Rengi açık içte kemerli niş ve dikdörtgen pencere; dışta mermer lentolu dikdörtgen pencere ve tuğla hafifletme kemeri.
        const pf = p.F, W = 1.2, y00 = pf + 0.75, y11 = pf + 2.25
        a.holes.push(kemer(new THREE.Path(), p.u, pf + 0.25, 1.9, 2.25, 0.95))
        b.holes.push(dikdortgen(p.u - W / 2, y00, p.u + W / 2, y11) as unknown as THREE.Path)
        c.holes.push(dikdortgen(p.u - W / 2, y00, p.u + W / 2, y11) as unknown as THREE.Path)
        const pencere = uvSigdir(new THREE.ShapeGeometry(dikdortgen(-W / 2, y00, W / 2, y11)))
        ek(pencere.rotateY(Math.PI).translate(p.u, 0, t / 2 - 0.01), m.pencere)
        ek(uvSigdir(new THREE.ShapeGeometry(dikdortgen(-W / 2, y00, W / 2, y11))).translate(p.u, 0, t / 2 + 0.01), m.parmaklik)
        // İç: nişin kontur çizgisi, kemerli alandaki alçı bezeme, pervaz
        ek(halka(p.u, pf + 0.25, 2.02, 2.25, 1.03, 1.9, 2.25, 0.95, 0.015, -0.015), m.cizgi)
        ek(new THREE.PlaneGeometry(1.25, 0.62).rotateY(Math.PI).translate(p.u, y11 + 0.42, 0.19), m.malakari)
        ek(kutuG(W + 0.26, 0.08, 0.28).translate(p.u, y00 - 0.03, 0.12), u.mermer)
        // Dış
        ek(kutuG(W + 0.3, 0.2, 0.1).translate(p.u, y11 + 0.1, t + 0.03), u.mermer)
        ek(kutuG(W + 0.3, 0.14, 0.14).translate(p.u, y00 - 0.05, t + 0.03), u.mermer)
        for (const s of [-1, 1]) ek(kutuG(0.14, y11 - y00, 0.1).translate(p.u + s * (W / 2 + 0.07), (y00 + y11) / 2, t + 0.03), u.mermer)
        ek(halka(p.u, y11 + 0.2, W + 0.72, 0.01, 0.82, W + 0.1, 0.01, 0.52, 0.06, t), m.tugla)
      } else {
        const pf = p.F, y00 = pf + 3.55, duz = 1.15, kH = 0.62, g = 0.98
        for (const s of [a, b, c]) s.holes.push(kemer(new THREE.Path(), p.u, y00, g, duz, kH))
        const sekil = () => uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, y00, g, duz, kH), 8))
        ek(sekil().rotateY(Math.PI).translate(p.u, 0, t / 2 - 0.01), m.vitray)
        ek(sekil().translate(p.u, 0, t / 2 + 0.01), m.sebeke)
        // İç: pencereyi çeviren kemerli çerçeve
        ek(halka(p.u, y00 - 0.26, g + 0.72, duz + 0.16, kH + 0.3, g + 0.58, duz + 0.16, kH + 0.22, 0.015, -0.015), m.cizgi)
        ek(kutuG(g + 0.6, 0.03, 0.03).translate(p.u, y00 - 0.25, -0.015), m.cizgi)
        ek(kutuG(g + 0.22, 0.07, 0.2).translate(p.u, y00 - 0.03, 0.1), u.mermer)
        // Dış: tuğla kemer halkası ve mermer denizlik
        ek(halka(p.u, y00, g + 0.5, duz, kH + 0.26, g, duz, kH, 0.06, t), m.tugla)
        ek(kutuG(g + 0.34, 0.1, 0.14).translate(p.u, y00 - 0.05, t + 0.03), u.mermer)
      }
    }
    ek(cikar(a, 0.2), sivaAktif)
    ek(cikar(b, t / 2 - 0.2, 0.2), sivaAktif)
    ek(cikar(c, t / 2, t / 2), dis)
  }

  // Yüzey: dünya koordinatıyla duvar kurma kısayolları
  /** `ic` z'si iç yüz; `yon` +1 ise dış yüz +z tarafında. */
  const duvarX = (ic: number, yon: 1 | -1, x0: number, x1: number, y1: number, t: number, dis: Mal, acik: Acik[], y0 = 0) => {
    const xc = (x0 + x1) / 2
    duvar(x1 - x0, y0, y1, xc, ic, yon > 0 ? 0 : Math.PI, t, dis, acik.map((a) => ({ ...a, u: yon > 0 ? a.u - xc : xc - a.u })))
  }
  const duvarZ = (ic: number, yon: 1 | -1, z0: number, z1: number, y1: number, t: number, dis: Mal, acik: Acik[], y0 = 0) => {
    const zc = (z0 + z1) / 2
    duvar(z1 - z0, y0, y1, ic, zc, yon > 0 ? Math.PI / 2 : -Math.PI / 2, t, dis, acik.map((a) => ({ ...a, u: yon > 0 ? zc - a.u : a.u - zc })))
  }

  /** Üçgen listesi; UV metre. */
  const yuzler = (konum: number[], uv?: number[]) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
    if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    else {
      const uvs: number[] = []
      for (let i = 0; i < konum.length; i += 3) uvs.push(konum[i] + konum[i + 2], konum[i + 1])
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }
    g.computeVertexNormals()
    return g
  }

  /** Dört yana eğimli kurşun örtü: taban dikdörtgeni ve içe çekilmiş tepe. */
  const kalcaCati = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, ic: number, kv = kCati) => {
    const a = [x0, z0], b = [x1, z0], c = [x1, z1], d = [x0, z1]
    const A = [x0 + ic, z0 + ic], B = [x1 - ic, z0 + ic], C = [x1 - ic, z1 - ic], D = [x0 + ic, z1 - ic]
    const p: number[] = []
    const dortgen = (s: number[], t: number[], T: number[], S: number[], yt: number) => p.push(s[0], y0, s[1], t[0], y0, t[1], T[0], yt, T[1], s[0], y0, s[1], T[0], yt, T[1], S[0], yt, S[1])
    dortgen(a, b, B, A, y1); dortgen(b, c, C, B, y1); dortgen(c, d, D, C, y1); dortgen(d, a, A, D, y1)
    p.push(A[0], y1, A[1], B[0], y1, B[1], C[0], y1, C[1], A[0], y1, A[1], C[0], y1, C[1], D[0], y1, D[1])
    kv.ekle(yuzler(p), u.kursun)
  }

  /** Dış kaburgalı kubbe ve alem. */
  const kubbeDis = (x: number, y: number, z: number, r: number, h: number, alem = 1) => {
    const profil: [number, number][] = [[r + 0.28, -0.2], [r + 0.06, 0.02]]
    for (let t = 1; t <= 14; t++) {
      const a = (t / 14) * Math.PI / 2
      profil.push([r * Math.pow(Math.cos(a), 0.9), h * Math.pow(Math.sin(a), 1.05)])
    }
    const DIKIS = 36, PARCA = 4
    const g = dondurG(profil, DIKIS * PARCA, [1, 1])
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const rr = Math.hypot(p.getX(i), p.getZ(i))
      if (rr < 0.2 || Math.round(uv.getX(i) * DIKIS * PARCA) % PARCA !== 0) continue
      const o = 1 + 0.05 / rr
      p.setX(i, p.getX(i) * o); p.setZ(i, p.getZ(i) * o)
    }
    g.computeVertexNormals()
    kKubbe.ekle(yer(g, x, y, z), m.kubbeDis)
    kKubbe.ekle(yer(dondurG([[0.16 * alem, 0], [0.05 * alem, 0.14], [0.14 * alem, 0.3], [0.05 * alem, 0.48], [0.1 * alem, 0.62], [0.02, 1 * alem], [0, 1.1 * alem]], 8), x, y + h - 0.06, z), u.bronz)
  }

  /** İç kubbe; `gobek` ise tepesine düzlem UV'li rozet oturur. */
  const kubbeIc = (x: number, y: number, z: number, r: number, h: number, gobek: boolean, mal: Mal = m.kubbeIc) => {
    const profil: [number, number][] = []
    const SON = gobek ? 11 : 16
    for (let t = 0; t <= SON; t++) {
      const a = (t / 16) * Math.PI / 2
      profil.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)])
    }
    kKubbe.ekle(yer(dondurG(profil, 48, [1, 1]), x, y, z), mal)
    if (!gobek) return
    const [rs, ys] = profil[profil.length - 1]
    const cap: [number, number][] = [[rs, ys]]
    for (let t = SON + 1; t <= 16; t++) {
      const a = (t / 16) * Math.PI / 2
      cap.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)])
    }
    const g = dondurG(cap, 40, [1, 1])
    const p = g.attributes.position, uv = g.attributes.uv
    // Fotoğrafta rozet beyaz zeminin ortasındadır: UV kenarı rozetin biraz dışına denk gelir.
    for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (rs * 2.02), 0.5 + p.getZ(i) / (rs * 2.02))
    kKubbe.ekle(yer(g, x, y, z), m.gobek)
  }

  /** Kare ağızdan daireye: düzgün pandantif yüzeyi. */
  const pandantif = (cx: number, cz: number, hx: number, hz: number, y0: number, y1: number, R: number, kv = kCati, mal: Mal = m.siva) => {
    const SEG = 48, SIRA = 5
    const konum: number[] = [], uv: number[] = [], dizin: number[] = []
    for (let s = 0; s <= SIRA; s++) {
      const t = s / SIRA, e = Math.pow(t, 0.72)
      for (let a = 0; a <= SEG; a++) {
        const teta = (a / SEG) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
        const uzak = Math.min(Math.abs(dx) > 1e-4 ? hx / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-4 ? hz / Math.abs(dz) : Infinity)
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
    kv.ekle(g, mal)
  }

  /** Türk üçgenli kuşak: kare → sekizgen → on altıgen, köşeli yüzler ve boyalı konturlar. */
  const ucgenKusak = (cx: number, cz: number, h: number, y0: number, y1: number, R: number) => {
    const karede = (a: number): [number, number] => {
      const dx = Math.sin(a), dz = Math.cos(a)
      const uz = Math.min(Math.abs(dx) > 1e-4 ? h / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-4 ? h / Math.abs(dz) : Infinity)
      return [cx + dx * uz, cz + dz * uz]
    }
    const daire = (a: number, r: number): [number, number] => [cx + Math.sin(a) * r, cz + Math.cos(a) * r]
    const ym = y0 + (y1 - y0) * 0.55
    const p: number[] = [], uv: number[] = []
    const ucgen = (a: number[], b: number[], c: number[]) => { p.push(...a, ...b, ...c); uv.push(0, 0, 1, 0, 0.5, 1) }
    const n = (xz: [number, number], y: number) => [xz[0], y, xz[1]]
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2, am = (a0 + a1) / 2
      // Alt sıra: dik ve ters üçgenler
      ucgen(n(karede(a0), y0), n(karede(a1), y0), n(daire(am, R * 1.0), ym))
      const a2 = ((i + 1.5) / 16) * Math.PI * 2
      ucgen(n(daire(am, R), ym), n(daire(a2, R), ym), n(karede(a1), y0))
      // Üst sıra
      ucgen(n(daire(am, R), ym), n(daire(a2, R), ym), n(daire(a1, R), y1))
      ucgen(n(daire(a0, R), y1), n(daire(a1, R), y1), n(daire(am, R), ym))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    kCati.ekle(g, m.ucgen)
  }

  /** Köşeden sarkan mukarnas kümesi: alttan üste genişleyen sıralar. */
  const mukarnasKose = (cx: number, cz: number, h: number, y0: number, sira: number, olcek: number) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const ic = new THREE.Vector2(-sx, -sz).normalize(), yan = new THREE.Vector2(sz, -sx).normalize()
      for (let r = 0; r < sira; r++) {
        const adet = 1 + r * 2
        const d = (0.42 + r * 0.52) * olcek
        for (let i = 0; i < adet; i++) {
          const o = (i - (adet - 1) / 2) * 0.5 * olcek
          const x = cx + sx * h + ic.x * d + yan.x * o, z = cz + sz * h + ic.y * d + yan.y * o, y = y0 + r * 0.62 * olcek
          const hucre = new THREE.SphereGeometry(0.24 * olcek, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.5, 1)
          kCati.ekle(yer(hucre, x, y, z), m.siva)
        }
      }
    }
  }

  const sekizgen = (rt: number, rb: number, y0: number, y1: number, kv: Kova, mal: Mal, x: number, z: number, acik = true) => {
    kv.ekle(yer(duzGolge(silindirG(rt, rb, y1 - y0, 8, acik).rotateY(Math.PI / 8)), x, (y0 + y1) / 2, z), mal)
  }

  /** Sekizgen dış kasnak: yüzlerde kemerli şebeke, üstte testere dişi ve kurşun etek. */
  const disKasnak = (x: number, z: number, A: number, y0: number, y1: number, yuzler8: number[], pG: number, pH: number) => {
    const R = A / Math.cos(Math.PI / 8)
    sekizgen(R, R, y0, y1, kKasnak, m.tugla, x, z)
    sekizgen(R + 0.08, R + 0.08, y0, y0 + 0.16, kKasnak, u.mermer, x, z)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4, L = 2 * A * Math.tan(Math.PI / 8)
      testere(L, y1 - 0.18, x, z, a, A, 0.34, kKasnak)
      if (!yuzler8.includes(n)) continue
      const yp = y0 + (y1 - y0 - pH - 0.4 * pG) / 2
      kKasnak.ekle(yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, yp, pG, pH, 0.5 * pG), 8).translate(0, 0, A + 0.05), x, 0, z, a), m.sebeke)
      kKasnak.ekle(yer(halka(0, yp - 0.04, pG + 0.34, pH, 0.5 * pG + 0.2, pG, pH, 0.5 * pG, 0.05, A, yp), x, 0, z, a), u.mermer)
    }
    sekizgen(R - 0.2, R + 0.32, y1, y1 + 0.42, kKasnak, u.kursun, x, z)
  }

  // ---------------------------------------------------------------- ZEMİN
  const cember = new THREE.CircleGeometry(KAIDE_R, 72).rotateX(-Math.PI / 2).translate(-OX, 0.01, -OZ)
  const cemberP = cember.attributes.position, cemberUV = cember.attributes.uv
  for (let i = 0; i < cemberP.count; i++) cemberUV.setXY(i, cemberP.getX(i), cemberP.getZ(i))
  k.ekle(cember, u.doseme)
  const cimAlan = (x0: number, z0: number, x1: number, z1: number) => {
    const g = new THREE.ShapeGeometry(dikdortgen(x0, -z1, x1, -z0)).rotateX(-Math.PI / 2).translate(0, 0.03, 0)
    k.ekle(g, m.cim)
  }
  cimAlan(-30, -14, -18, -1); cimAlan(-31, -40, -22, -27); cimAlan(-18, -33, -6, -28)
  cimAlan(7.5, -2, 24, 12); cimAlan(-19, -2.5, -12.5, 14); cimAlan(0, -44, 9, -33)

  // ---------------------------------------------------------------- SON CEMAAT YERİ (REVAK)
  // Beş göz; orta göz yüksek ve iki orta ayak 80 cm öne taşkın (envanter). Ayaklar mermer kaplı, kemerler tuğla, alt kaide kaba taş (foto).
  const REVAK_D = -10.4, REVAK_I = -9.5, REVAK_X = 12.2
  const ORTA_D = REVAK_D - 0.8
  const yanKemer: [number, number][] = [[4.85, 3.7], [9.45, 3.7]]
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 3 : -REVAK_X, x1 = s > 0 ? REVAK_X : -3
    const sekil = dikdortgen(x0, 0, x1, 8.3)
    for (const [cx, g] of yanKemer) sekil.holes.push(kemer(new THREE.Path(), s * cx, 1, g, 3.6, 1.9))
    k.ekle(cikar(sekil, REVAK_I - REVAK_D, REVAK_D), m.orgu)
    for (const [cx, g] of yanKemer) {
      // Kemer halkası, iç sıvalı karın, arka yüz sıvası
      k.ekle(halka(s * cx, 4.6, g + 0.7, 0.01, 2.25, g, 0.01, 1.9, 0.08, REVAK_D - 0.06), m.tugla)
      k.ekle(halka(s * cx, 1, g, 3.6, 1.9, g - 0.04, 3.6, 1.87, REVAK_I - REVAK_D, REVAK_D), m.sivaAydin)
    }
    const arka = dikdortgen(x0, 1, x1, 8.3)
    for (const [cx, g] of yanKemer) arka.holes.push(kemer(new THREE.Path(), s * cx, 1, g, 3.6, 1.9))
    k.ekle(cikar(arka, 0.02, REVAK_I), m.sivaAydin)
    // Mermer kaplı ayaklar
    for (const ax of [7.15, 11.75]) kutu(0.92 + 0.08, 3.6, 1, u.mermer, s * ax, F + 1.8, (REVAK_D + REVAK_I) / 2)
    // Ayaklar arasında alçak mermer korkuluk
    for (const [cx, g] of yanKemer) kutu(g, 1, 0.34, u.mermer, s * cx, F + 0.5, REVAK_D + 0.3)
    // Saçak
    kutu(REVAK_X - 3 + 0.5, 0.14, 0.34, u.mermer, s * (REVAK_X + 3 + 0.25) / 2, 8.25, REVAK_D - 0.02)
    testere(REVAK_X - 3, 8.02, s * (REVAK_X + 3) / 2, REVAK_D, Math.PI, 0)
    testere(REVAK_X - 3, 7.76, s * (REVAK_X + 3) / 2, REVAK_D, Math.PI, 0)
  }
  // Orta göz: taşkın blok, yüksek kemer, kendi saçağı
  const ortaSekil = dikdortgen(-3, 0, 3, 9.8)
  ortaSekil.holes.push(kemer(new THREE.Path(), 0, 1, 4.2, 3.7, 2.6))
  k.ekle(cikar(ortaSekil, REVAK_I - ORTA_D, ORTA_D), m.orgu)
  k.ekle(halka(0, 4.7, 4.9, 0.01, 2.95, 4.2, 0.01, 2.6, 0.08, ORTA_D - 0.06), m.tugla)
  k.ekle(halka(0, 1, 4.2, 3.7, 2.6, 4.16, 3.7, 2.57, REVAK_I - ORTA_D, ORTA_D), m.sivaAydin)
  for (const s of [-1, 1]) kutu(0.98, 3.7, REVAK_I - ORTA_D + 0.08, u.mermer, s * 2.5, F + 1.85, (ORTA_D + REVAK_I) / 2)
  kutu(6.5, 0.14, 0.34, u.mermer, 0, 9.75, ORTA_D - 0.02)
  testere(6, 9.52, 0, ORTA_D, Math.PI, 0)
  testere(6, 9.26, 0, ORTA_D, Math.PI, 0)
  for (const s of [-1, 1]) {
    testere(6.1, 9.52, s * 3, -8.15, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0)
    kutu(0.34, 0.14, 6.4, u.mermer, s * 3.1, 9.75, -8.15)
  }
  // Basamaklar, kaide ve revak döşemesi
  for (const [z0, z1] of [[ORTA_D - 1.4, ORTA_D]] as const) {
    for (let i = 0; i < 5; i++) {
      const d = (z1 - z0) * (5 - i) / 5
      kutu(4.2, 0.2, d, u.mermer, 0, 0.1 + i * 0.2, z1 - d / 2)
    }
  }
  for (const s of [-1, 1]) {
    kutu(REVAK_X - 3 + 0.25, 1, 0.85, u.tas, s * (REVAK_X + 3) / 2 + s * 0.1, 0.5, REVAK_D + 0.4)
    kutu(REVAK_X - 3 + 0.25, 0.36, 0.6, u.tas, s * (REVAK_X + 3) / 2 + s * 0.1, 0.18, REVAK_D - 0.25)
    kutu(0.98, 1.02, REVAK_I - ORTA_D + 0.08, u.tas, s * 2.5, 0.5, (ORTA_D + REVAK_I) / 2)
  }
  kutu(REVAK_X * 2 - 1.8, F, 5.4, u.tas, 0, F / 2, -7.4)
  kutu(REVAK_X * 2 - 1.8, 0.02, 5.8, u.doseme, 0, F + 0.01, -7.6)
  kutu(4.2, F, 1.7, u.tas, 0, F / 2, ORTA_D + 0.85)
  kutu(4.2, 0.02, 1.7, u.doseme, 0, F + 0.01, ORTA_D + 0.85)

  // Revak uç duvarları ve göz arası kemerleri
  for (const s of [-1, 1] as const) {
    sivaAktif = m.sivaAydin
    duvarZ(s * 11.3, s, -10.4, -5.1, 8.3, 0.9, m.orgu, [])
    sivaAktif = m.siva
    for (const ax of [3, 7.15]) {
      const b = dikdortgen(-2.2, 4.5, 2.2, s * ax === 3 ? 8 : 8)
      b.holes.push(kemer(new THREE.Path(), 0, 4.5, 3.7, 0.05, 1.8))
      k.ekle(yer(cikar(b, 0.5, -0.25), s * ax, 0, -7.3, Math.PI / 2), m.sivaAydin)
    }
  }

  // Revak tavanı ve küçük kubbeler (kuzeye bakan orta göz daha yüksek)
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 3 : -11.3, x1 = s > 0 ? 11.3 : -3
    const p = dikdortgen(x0, 5.1, x1, 9.5)
    for (const cx of [4.85, 9.45]) p.holes.push(new THREE.Path().absarc(s * cx, 7.3, 1.95, 0, Math.PI * 2, true))
    kCati.ekle(new THREE.ShapeGeometry(p, 20).rotateX(Math.PI / 2).translate(0, 7, 0), m.sivaAydin)
    for (const cx of [4.85, 9.45]) kubbeIc(s * cx, 7, -7.3, 1.95, 1.5, false, m.kubbeIcAydin)
  }
  {
    const p = dikdortgen(-3, 5.1, 3, 11.2)
    p.holes.push(new THREE.Path().absarc(0, 8.15, 2.5, 0, Math.PI * 2, true))
    kCati.ekle(new THREE.ShapeGeometry(p, 24).rotateX(Math.PI / 2).translate(0, 7.45, 0), m.sivaAydin)
    kubbeIc(0, 7.45, -8.15, 2.5, 2.05, false, m.kubbeIcAydin)
  }

  // Revak çatısı: iki yanda kurşun kaplı eğimli örtü, ortada kubbeli yüksek göz (foto)
  kalcaCati(3, REVAK_X + 0.42, REVAK_D - 0.4, -4.8, 8.32, 9.5, 1.5)
  kalcaCati(-REVAK_X - 0.42, -3, REVAK_D - 0.4, -4.8, 8.32, 9.5, 1.5)
  kalcaCati(-3.45, 3.45, ORTA_D - 0.42, -4.9, 9.82, 10.5, 0.55)
  kutu(0.3, 1.7, 6.1, m.orgu, -3.15, 8.95, -8.05)
  kutu(0.3, 1.7, 6.1, m.orgu, 3.15, 8.95, -8.05)
  kubbeDis(0, 10.42, -8.05, 2.65, 2.4, 0.85)

  // ---------------------------------------------------------------- ANA GÖVDE (ters T)
  const K_ALT = (a: number, F2: number): Acik => ({ tip: 'alt', u: a, F: F2 })
  const K_UST = (a: number, F2: number): Acik => ({ tip: 'ust', u: a, F: F2 })
  // Harim kuzey duvarı: revağa ve sofaya sıvalı, ortada cümle kapısı
  duvarX(-4.05, -1, -11.75, 11.75, 9, 1.05, m.sivaAydin, [{ tip: 'kemer', u: 0, y0: F, g: 1.9, duz: 2.5, kH: 0.95 }])
  // Sofa ile mihrap önü arasındaki büyük kemer: üzengi sofadan 1,75 m (envanter)
  duvarX(4.05, 1, -4.95, 4.95, 9, 1.3, m.siva, [{ tip: 'kemer', u: 0, y0: F, g: 6.8, duz: 1.75, kH: 5.95, cizgi: true }])
  // Sofa ile eyvanlar arasındaki kemerler
  for (const s of [-1, 1] as const) {
    duvarZ(s * 4.05, s, -5.1, 4.05, 9, 1.2, m.siva, [{ tip: 'kemer', u: -0.25, y0: F, g: 6.2, duz: 2.2, kH: 4.3, cizgi: true }])
    // Eyvan dış duvarı: altlı üstlü ikişer pencere
    duvarZ(s * 10.85, s, -5.1, 3.8, 7.9, 0.9, m.orgu, [K_ALT(-2, F), K_ALT(0.95, F), K_UST(-2, F), K_UST(0.95, F)])
    // Eyvan güney duvarı
    duvarX(2.9, 1, s > 0 ? 5.25 : -11.75, s > 0 ? 11.75 : -5.25, 7.9, 0.9, m.orgu, s > 0 ? [K_ALT(EYVAN_X, F), K_UST(EYVAN_X, F)] : [K_UST(-9.6, F)])
    // Mihrap önü yan duvarları: altlı üstlü ikişer pencere (envanter: altışar)
    duvarZ(s * 4.05, s, 3.8, 14.35, 9.2, 0.9, m.orgu, [K_ALT(MIHRAP_Z - 2.2, PLATFORM), K_ALT(MIHRAP_Z + 2.2, PLATFORM), K_UST(MIHRAP_Z - 2.2, PLATFORM), K_UST(MIHRAP_Z + 2.2, PLATFORM)])
  }
  // Kıble duvarı
  duvarX(KIBLE_Z, 1, -4.95, 4.95, 9.2, 0.9, m.orgu, [K_ALT(-3, PLATFORM), K_ALT(3, PLATFORM), K_UST(-2.5, PLATFORM), K_UST(2.5, PLATFORM)])

  // Saçak ve testere dişi sıraları (saçak altında, envanter)
  const sacak = (L: number, x: number, z: number, ry: number, y: number) => {
    k.ekle(yer(kutuG(L + 0.5, 0.14, 0.34).translate(0, y, 0.1), x, 0, z, ry), u.mermer)
    testere(L, y - 0.24, x, z, ry, 0)
    testere(L, y - 0.5, x, z, ry, 0)
  }
  for (const s of [-1, 1]) {
    sacak(8.9, s * 11.75, -0.65, s > 0 ? Math.PI / 2 : -Math.PI / 2, 7.95)
    sacak(6.5, s * 8.5, 3.8, 0, 7.95)
    sacak(10.55, s * 4.95, 9.1, s > 0 ? Math.PI / 2 : -Math.PI / 2, 9.2)
  }
  sacak(9.9, 0, 14.35, 0, 9.2)

  // Döşemeler: sofa ve eyvanlarda halı, mihrap önünde ahşap yüzlü yükseltilmiş sofa
  const haliUst = (g: number, d: number, x: number, z: number, y: number, h = 0.04) => kutu(g, h, d, m.hali, x, y - h / 2, z)
  kutu(21.8, F - 0.02, 7.1, u.tas, 0, F / 2 - 0.01, -0.5)
  haliUst(8.1, 8.2, 0, 0, F + 0.02)
  for (const s of [-1, 1]) haliUst(6.9, 7, s * 7.4, -0.55, F + 0.02)
  k.ekle(new THREE.PlaneGeometry(6.6, 6.6).rotateX(-Math.PI / 2).translate(0, F + 0.035, -0.2), m.gulHali)
  const PZ0 = 4.1, PZ1 = KIBLE_Z
  kutu(8.1, PLATFORM, PZ1 - PZ0, u.tas, 0, PLATFORM / 2, (PZ0 + PZ1) / 2)
  haliUst(8.1, PZ1 - PZ0, 0, (PZ0 + PZ1) / 2, PLATFORM + 0.02)
  // Platform ön yüzü: ahşap panel ve üç parçalı çerçeve
  kutu(6.8, PLATFORM - F, 0.05, m.cevizAcik, 0, (PLATFORM + F) / 2, PZ0 - 0.02)
  kutu(6.84, 0.06, 0.09, m.ceviz, 0, PLATFORM - 0.02, PZ0 - 0.03)
  for (const cx of [-2.6, 2.6]) kutu(1.5, 0.34, 0.02, m.ceviz, cx, F + 0.28, PZ0 - 0.06)
  for (const [z1, h] of [[PZ0 - 0.5, 0.3], [PZ0 - 1, 0.15]] as const) {
    kutu(2.4, h, 0.5, m.cevizAcik, 0, F + h / 2, z1 + 0.25)
    haliUst(2.4, 0.5, 0, z1 + 0.25, F + h + 0.012, 0.02)
  }

  // Tavan: orta sofa — düz pandantif, mukarnas köşeler, on altıgen kasnak, kubbe
  pandantif(0, 0, 4.05, 4.05, BANT_ALT, 10.7, 4.05)
  mukarnasKose(0, 0, 4.05, BANT_ALT + 0.15, 3, 1.1)
  kKasnak.ekle(yer(silindirG(4.05, 4.05, 1, 36, true), 0, 11.2, 0), m.siva)
  // Kasnakta altı pencere, on iki niş (envanter)
  for (let n = 0; n < 18; n++) {
    const a = (n / 18) * Math.PI * 2 + Math.PI / 18
    const pen = n % 3 === 0
    const s = kemer(new THREE.Shape(), 0, 10.82, 0.5, 0.42, 0.28)
    const g = (pen ? uvSigdir(new THREE.ShapeGeometry(s, 6)) : new THREE.ShapeGeometry(s, 6)).translate(0, 0, -4.02)
    g.rotateY(a)
    g.translate(0, 0, 0)
    kKasnak.ekle(g, pen ? m.vitray : m.nis)
  }
  kubbeIc(0, 11.7, 0, 4.05, 3.95, true)

  // Tavan: mihrap önü — Türk üçgenli kuşak, üç pencere, kubbe
  ucgenKusak(0, MIHRAP_Z, 4.05, BANT_ALT, 11, 4.05)
  kKasnak.ekle(yer(silindirG(4.05, 4.05, 0.7, 36, true), 0, 11.35, MIHRAP_Z), m.siva)
  kubbeIc(0, 11.7, MIHRAP_Z, 4.05, 3.95, false)
  for (const a of [Math.PI / 2, -Math.PI / 2, 0]) {
    const sk = () => kemer(new THREE.Shape(), 0, 9.2, 0.82, 0.8, 0.5)
    kCati.ekle(uvSigdir(new THREE.ShapeGeometry(sk(), 8)).rotateY(Math.PI).translate(0, 0, 3.98).rotateY(a).translate(0, 0, MIHRAP_Z), m.vitray)
    const cerceve = kemer(new THREE.Shape(), 0, 9.05, 1.28, 0.95, 0.75)
    cerceve.holes.push(kemer(new THREE.Path(), 0, 9.2, 0.82, 0.8, 0.5))
    kCati.ekle(cikar(cerceve, 0.03, 3.95).rotateY(a).translate(0, 0, MIHRAP_Z), m.siva)
  }
  // Duvarla kuşak arasındaki silme
  for (const s of [-1, 1]) {
    kutu(0.14, 0.1, 8.1, m.cizgi, s * 4.0, BANT_ALT, MIHRAP_Z)
    kutu(8.1, 0.1, 0.14, m.cizgi, 0, BANT_ALT, MIHRAP_Z + s * 4.0)
  }

  // Tavan: eyvanlar — kubbe ve kuzeyde beşik tonoz (envanter). Batıda mukarnaslı pandantif, doğuda iri badem kuşak.
  for (const s of [-1, 1]) {
    const cx = s * EYVAN_X
    pandantif(cx, EYVAN_Z, 2.8, 2.8, 7.2, 8.4, 2.8)
    if (s < 0) mukarnasKose(cx, EYVAN_Z, 2.8, 7.32, 2, 0.8)
    kKasnak.ekle(yer(silindirG(2.8, 2.8, 0.4, 28, true), cx, 8.6, EYVAN_Z), m.siva)
    if (s > 0) for (let n = 0; n < 16; n++) {
      const a = (n / 16) * Math.PI * 2
      const g = new THREE.SphereGeometry(0.2, 6, 4).scale(1, 0.75, 0.3).translate(0, 8.6, -2.73).rotateY(a).translate(cx, 0, EYVAN_Z)
      kKasnak.ekle(g, m.siva)
    }
    kubbeIc(cx, 8.8, EYVAN_Z, 2.8, 2.6, false)
    // Tonoz: dome'un kuzeyindeki şerit
    const ton = new THREE.CylinderGeometry(2.8, 2.8, 1.4, 20, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(cx, 7.2, -3.4)
    ton.scale(1, 1, 1)
    kCati.ekle(ton, m.siva)
    // Dış: dört yana eğimli kurşun örtü ve kubbe
    kalcaCati(s > 0 ? 5.1 : -11.95, s > 0 ? 11.95 : -5.1, -5, 4, 7.98, 9.15, 0.55)
    kubbeDis(cx, 9, EYVAN_Z, 3.05, 3, 0.8)
  }

  // Dış: ana gövde çatı plakası, sekizgen kasnaklar, kubbeler
  const plaka = dikdortgen(-5.1, -14.5, 5.1, 5.2)
  for (const cz of [0, MIHRAP_Z]) plaka.holes.push(new THREE.Path().absarc(0, -cz, 4.8, 0, Math.PI * 2, true))
  kCati.ekle(cikar(plaka, 0.16).rotateX(-Math.PI / 2).translate(0, 9.15, 0), u.kursun)
  disKasnak(0, 0, 4.92, 9.3, 11.75, [1, 2, 3, 5, 6, 7], 0.56, 0.72)
  disKasnak(0, MIHRAP_Z, 4.92, 9.3, 11.75, [2, 0, 6], 0.56, 0.72)
  kubbeDis(0, 11.95, 0, 4.72, 4.45, 1.1)
  kubbeDis(0, 11.95, MIHRAP_Z, 4.72, 4.45, 1.1)

  // Kapı çevresi ve kitabe (fotoğraftaki kitabe levhası)
  {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, -5.1, Math.PI), mal)
    ek(halka(0, F, 2.7, 2.65, 1.25, 1.9, 2.5, 0.95, 0.12, 0), u.mermer)
    const kitabeG = new THREE.PlaneGeometry(2.4, 2.4 * (347 / 1024)).translate(0, 5.42, 0.05)
    ek(kutuG(2.6, 1, 0.05).translate(0, 5.42, 0.01), u.mermer)
    ek(kitabeG, m.kitabe)
    // Ceviz açık kapı kanatları: söve içinde, geçişi kapatmaz
    for (const s of [-1, 1]) ek(kutuG(0.07, 2.6, 0.84).translate(s * 0.92, F + 1.3, -0.55), m.ceviz)
  }
  // İç mekân: büyük kemerin üzengi silmesi ve eyvan kemeri sıva çizgisi
  for (const s of [-1, 1]) {
    kutu(0.66, 0.06, 1.34, m.cizgi, s * 3.74, F + 1.77, 4.7)
    kutu(1.24, 0.06, 0.82, m.cizgi, s * 4.65, F + 2.22, -3.7)
    kutu(1.24, 0.06, 1.25, m.cizgi, s * 4.65, F + 2.22, 3.4)
  }

  // Orta göz ayaklarının iç yüzlerinde mihrabiyeler (envanter s. 180)
  for (const s of [-1, 1]) {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, s * 2.0, 0, (ORTA_D + REVAK_I) / 2, s > 0 ? -Math.PI / 2 : Math.PI / 2), mal)
    ek(halka(0, F + 0.5, 0.86, 1.5, 0.5, 0.62, 1.42, 0.4, 0.05, 0), m.cizgi)
    ek(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, F + 0.5, 0.62, 1.42, 0.4), 8).translate(0, 0, 0.01), u.mermerKoyu)
  }
  // Duvar aplikleri (foto): küçük demir kol ve yanan lamba
  const aplik = (x: number, y: number, z: number, ry: number) => {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z, ry), mal)
    ek(kutuG(0.02, 0.02, 0.26).translate(0, y + 0.1, -0.13), u.bronz)
    ek(silindirG(0.03, 0.07, 0.08, 8).translate(0, y + 0.06, -0.26), u.bronz)
    ek(new THREE.SphereGeometry(0.075, 8, 6).translate(0, y - 0.03, -0.26), u.lamba)
  }
  for (const s of [-1, 1]) {
    for (const z of [MIHRAP_Z - 2.9, MIHRAP_Z, MIHRAP_Z + 2.9]) aplik(s * 4.05, 5.3, z, s > 0 ? Math.PI / 2 : -Math.PI / 2)
    aplik(s * 10.85, 4.2, -0.5, s > 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  aplik(-1.9, 5.1, KIBLE_Z, 0); aplik(1.9, 5.1, KIBLE_Z, 0)

  // ---------------------------------------------------------------- MİHRAP
  {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 0, 0, KIBLE_Z, Math.PI), mal)
    const G = 3, T = 6.95, NG = 1.5, NH = 3.2, D = 0.55
    const blok = dikdortgen(-G / 2, PLATFORM, G / 2, T)
    blok.holes.push(dikdortgen(-NG / 2, PLATFORM, NG / 2, PLATFORM + NH) as unknown as THREE.Path)
    ek(cikar(blok, D), m.siva)
    ek(kutuG(NG, NH, 0.05).translate(0, PLATFORM + NH / 2, 0.03), m.siva)
    const bant = (x0: number, y0: number, x1: number, y1: number) => {
      const s = dikdortgen(x0, y0, x1, y1), b = 0.2
      s.holes.push(dikdortgen(x0 + b, y0 + b, x1 - b, y1 - b) as unknown as THREE.Path)
      ek(cikar(s, 0.03, D), m.mihrapBant)
    }
    bant(-G / 2 + 0.02, PLATFORM + 0.05, G / 2 - 0.02, T - 0.05)
    bant(-NG / 2 - 0.26, PLATFORM + 0.03, NG / 2 + 0.26, PLATFORM + NH + 0.95)
    // Yazısız üst levha
    ek(kutuG(NG, 0.42, 0.04).translate(0, PLATFORM + NH + 0.5, D + 0.02), m.ceviz)
    ek(kutuG(NG - 0.1, 0.32, 0.05).translate(0, PLATFORM + NH + 0.5, D + 0.02), m.madalyon)
    // Niş üstünde altı sıra mukarnas (envanter)
    const KADEME = 6, SH = 0.33
    for (let i = 0; i < KADEME; i++) {
      const o = 1 - i / KADEME
      const g = (NG - 0.05) * o + 0.12, y = PLATFORM + NH - KADEME * SH + i * SH, dr = 0.1 + 0.44 * (1 - o)
      const n = Math.max(1, Math.round(g / 0.27))
      ek(kutuG(g, SH * 0.9, dr).translate(0, y + SH / 2, dr / 2 + 0.03), m.siva)
      for (let j = 0; j < n; j++) {
        const x = -g / 2 + (j + 0.5) * (g / n)
        const h = new THREE.SphereGeometry((g / n) * 0.48, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, SH * 1.9 / (g / n), 0.55)
        ek(h.translate(x, y + 0.04, dr + 0.03), m.siva)
      }
    }
  }

  // ---------------------------------------------------------------- MİNBER (ahşap, kırmızı kumaş köşk kapısı)
  {
    const { boy: BOY, en: EN, tepe: TEPE, z0, x } = MINBER
    const ek = (g: THREE.BufferGeometry, mal: Mal) => { g.rotateY(-Math.PI / 2); g.translate(x, 0, z0); k.ekle(g, mal) }
    const yan = new THREE.Shape()
    yan.moveTo(0.7, PLATFORM); yan.lineTo(BOY, PLATFORM); yan.lineTo(BOY, PLATFORM + TEPE + 0.5); yan.lineTo(BOY - 1.15, PLATFORM + TEPE + 0.5)
    yan.lineTo(1.5, PLATFORM + 0.9); yan.lineTo(0.7, PLATFORM + 0.9); yan.closePath()
    for (const s of [-1, 1]) ek(cikar(yan, 0.14, s * (EN / 2) - 0.07), m.ceviz)
    const kenar = new THREE.Shape()
    kenar.moveTo(1.5, PLATFORM + 0.9); kenar.lineTo(BOY - 1.15, PLATFORM + TEPE + 0.5); kenar.lineTo(BOY - 1.15, PLATFORM + TEPE + 0.7); kenar.lineTo(1.5, PLATFORM + 1.1); kenar.closePath()
    for (const s of [-1, 1]) ek(cikar(kenar, 0.2, s * (EN / 2) - 0.1), m.cevizAcik)
    const ADIM = 9, rampa = (s: number) => (MINBER.h1 * (s - MINBER.s0)) / (MINBER.s1 - MINBER.s0)
    for (let i = 0; i < ADIM; i++) {
      const s = MINBER.s0 + ((i + 0.5) / ADIM) * (MINBER.s1 - MINBER.s0), h = Math.max(0.05, rampa(s))
      ek(kutuG((MINBER.s1 - MINBER.s0) / ADIM + 0.02, h, EN - 0.28).translate(s, PLATFORM + h / 2, 0), m.kirmizi)
    }
    const koskS = BOY - 0.6
    ek(kutuG(1.15, 2.1, EN).translate(koskS, PLATFORM + TEPE + 0.5 + 1.05, 0), m.ceviz)
    ek(kutuG(0.05, 1.5, EN - 0.5).translate(koskS - 0.6, PLATFORM + TEPE + 1.45, 0), m.kirmizi)
    ek(kutuG(1.2, 0.12, EN + 0.06).translate(koskS, PLATFORM + TEPE + 2.66, 0), m.cevizAcik)
    ek(duzGolge(silindirG(0.05, EN * 0.7, 2, 8).scale(0.72, 1, 1)).translate(koskS, PLATFORM + TEPE + 3.72, 0), m.ceviz)
    ek(dondurG([[0.08, 0], [0.03, 0.18], [0.1, 0.36], [0.03, 0.54], [0.02, 0.95], [0, 1]], 8).translate(koskS, PLATFORM + TEPE + 4.68, 0), u.altin)
    for (const s of [-1, 1]) ek(kutuG(0.7, 3.2, 0.4).translate(0.35, PLATFORM + 1.6, s * (EN / 2 - 0.1)), m.ceviz)
    ek(kutuG(0.7, 0.6, EN + 0.2).translate(0.35, PLATFORM + 2.95, 0), m.ceviz)
    ek(kutuG(0.02, 0.42, EN - 0.1).translate(-0.01, PLATFORM + 2.95, 0), m.kirmizi)
    ek(kutuG(0.74, 0.1, EN + 0.26).translate(0.35, PLATFORM + 3.3, 0), m.cevizAcik)
  }

  // ---------------------------------------------------------------- EYVAN MİHRAPLARI
  {
    // Batı eyvanı güney duvarı: yarı silindirik niş, sivri alınlık, perde tasviri, malakâri (envanter)
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, -7.1, 0, 2.9, Math.PI), mal)
    const sekil = kemer(new THREE.Shape(), 0, F, 2.2, 3.1, 1.5)
    sekil.holes.push(kemer(new THREE.Path(), 0, F + 0.1, 1.15, 2.2, 0.8))
    ek(cikar(sekil, 0.2), m.siva)
    ek(halka(0, F, 2.3, 3.1, 1.56, 2.2, 3.1, 1.5, 0.21, 0), m.cizgi)
    ek(new THREE.PlaneGeometry(1.15, 3).translate(0, F + 1.5, 0.02), m.perde)
    ek(new THREE.PlaneGeometry(1.5, 0.75).translate(0, F + 3.95, 0.205), m.malakari)
    // Doğu eyvanı: önceden ocak olabileceği düşünülen sade niş
    const ekD = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, 5.9, 0, 2.9, Math.PI), mal)
    const sD = kemer(new THREE.Shape(), 0, F, 1.5, 1.9, 0.9)
    sD.holes.push(kemer(new THREE.Path(), 0, F + 0.04, 0.9, 1.5, 0.6))
    ekD(cikar(sD, 0.16), m.siva)
    ekD(new THREE.PlaneGeometry(0.9, 2.1).translate(0, F + 1.05, 0.015), m.siva)
  }

  // Sekizgen levhalar: yazısız, mihrap önü üst duvarında (foto düzeninden yorum)
  const levha = (x: number, y: number, z: number, ry: number) => {
    const g = new THREE.CircleGeometry(0.46, 8).rotateZ(Math.PI / 8)
    k.ekle(yer(g.translate(0, 0, 0), x, y, z, ry), m.madalyon)
    k.ekle(yer(new THREE.RingGeometry(0.44, 0.5, 8).rotateZ(Math.PI / 8), x, y, z, ry), u.altin)
  }
  levha(-1.1, 7.75, KIBLE_Z - 0.03, Math.PI); levha(1.1, 7.75, KIBLE_Z - 0.03, Math.PI)
  for (const s of [-1, 1]) for (const z of [MIHRAP_Z - 3.9 + 0.6, MIHRAP_Z, MIHRAP_Z + 3.3]) levha(s * 4.02, 7.9, z, s > 0 ? -Math.PI / 2 : Math.PI / 2)

  // ---------------------------------------------------------------- MİNARE (kaide tuğla ve kesme taş, gövde tuğla, tek şerefe, şerefe altı iki sıra çini: envanter)
  {
    const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, MINARE.x, 0, MINARE.z), mal)
    ek(duzGolge(silindirG(1.8, 1.8, 7.3, 12).rotateY(Math.PI / 12).translate(0, 3.65, 0)), m.orgu)
    ek(duzGolge(silindirG(1.86, 1.86, 0.14, 12).rotateY(Math.PI / 12).translate(0, 7.3, 0)), u.mermer)
    ek(duzGolge(silindirG(1.3, 1.8, 1.3, 12).rotateY(Math.PI / 12).translate(0, 8, 0)), m.tugla)
    ek(dondurG([[1.3, 8.6], [1.14, 20]], 20), m.tugla)
    for (const y of [12, 16]) ek(silindirG(1.27, 1.27, 0.08, 20, true).translate(0, y, 0), u.tas)
    for (const [y, t] of [[18.9, 0.34], [19.4, 0.3]]) ek(silindirG(1.2, 1.2, t, 20, true).translate(0, y, 0), m.cini)
    ek(dondurG([[1.14, 19.9], [1.3, 20.2], [1.7, 20.6], [1.75, 20.75]], 20), u.tas)
    for (let a = 0; a < 20; a++) ek(kutuG(0.54, 0.95, 0.05).translate(0, 21.2, 1.72).rotateY((a * Math.PI * 2) / 20), u.mermer)
    ek(silindirG(1.76, 1.76, 0.08, 20, true).translate(0, 21.68, 0), u.mermer)
    ek(silindirG(1.74, 1.74, 0.05, 20).translate(0, 20.8, 0), u.tas)
    ek(dondurG([[0.95, 20.7], [0.88, 24.2]], 18), m.tugla)
    ek(dondurG([[0.88, 24.1], [1.14, 24.4], [1.1, 24.6], [0.03, 28.7], [0, 28.7]], 18), u.kursun)
    ek(dondurG([[0.1, 28.5], [0.03, 28.7], [0.08, 28.9], [0.02, 29.3], [0, 29.35]], 6), u.bronz)
  }

  // ---------------------------------------------------------------- TÜRBELER
  /** İçi dolu sanduka: beşgen kesitli örtü. */
  const sanduka = (x: number, z: number, en: number, boy: number, h: number, y0: number, mal: Mal, ry = 0) => {
    const s = new THREE.Shape()
    s.moveTo(-en / 2, 0); s.lineTo(en / 2, 0); s.lineTo(en / 2, h * 0.55); s.lineTo(0, h); s.lineTo(-en / 2, h * 0.55); s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: boy, bevelEnabled: false }).translate(0, 0, -boy / 2)
    if (ry) g.rotateY(ry)
    k.ekle(g.translate(x, y0, z), mal)
    const bs = new THREE.Shape()
    bs.moveTo(-en / 2 - 0.02, 0); bs.lineTo(en / 2 + 0.02, 0); bs.lineTo(en / 2 + 0.02, h * 0.6); bs.lineTo(0, h * 1.1); bs.lineTo(-en / 2 - 0.02, h * 0.6); bs.closePath()
    const kapak = new THREE.ShapeGeometry(bs).translate(0, 0, boy / 2 + 0.01)
    if (ry) kapak.rotateY(ry)
    k.ekle(kapak.translate(x, y0, z), mal)
  }

  // Hamza Bey Türbesi: sekizgen, yüksek sekizgen kasnak, doğuda dar eyvan, on üç sanduka (envanter s. 184-185)
  {
    const { x, z } = HAMZA
    const A = 3.7, T = 1, UST = 6.3, L = 2 * (A + T) * Math.tan(Math.PI / 8)
    sivaAktif = m.sivaAydin
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      const wx = x + Math.sin(a) * A, wz = z + Math.cos(a) * A
      const acik: Acik[] = []
      // n=0 güney (mihrap), n=2 doğu (kapı); kalan altı yüzde pencere
      if (n === 2) acik.push({ tip: 'kemer', u: 0, y0: 0.05, g: 1.5, duz: 2.1, kH: 0.75 })
      else if (n !== 0) acik.push({ tip: 'alt', u: 0, F: 0.05 })
      duvar(L, 0, UST, wx, wz, a, T, m.orgu, acik)
      testere(L, UST - 0.16, wx, wz, a, T)
      testere(L, UST - 0.4, wx, wz, a, T)
      k.ekle(yer(kutuG(L + 0.2, 0.12, 0.3).translate(0, UST + 0.02, T + 0.12), wx, 0, wz, a), u.mermer)
    }
    sivaAktif = m.siva
    // Döşeme, sandukalar
    k.ekle(yer(duzGolge(silindirG(A + 0.2, A + 0.2, 0.06, 8).rotateY(Math.PI / 8)), x, 0.03, z), m.dosemeTugla)
    // Düzen temsilî: kapı önü boş, ortada Hamza Bey, kuzey ve güneyde altışar sanduka (toplam on üç: envanter)
    kutu(2.2, 0.5, 2.4, m.ceviz, x - 0.6, 0.32, z)
    sanduka(x - 0.6, z, 0.95, 2, 0.9, 0.56, m.sanduka)
    for (const s of [-1, 1]) {
      kutu(4.3, 0.4, 1.5, m.ceviz, x - 0.25, 0.26, z + s * 2.62)
      for (let i = 0; i < 6; i++) sanduka(x - 2.05 + i * 0.72, z + s * 2.62, 0.58, 1.25, 0.66, 0.46, m.sanduka)
    }
    // Mihrap: mukarnaslı, güney yüzünde
    const ekM = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, x, 0, z + A, Math.PI), mal)
    const mh = kemer(new THREE.Shape(), 0, 0.06, 1.85, 2.5, 0.9)
    mh.holes.push(kemer(new THREE.Path(), 0, 0.06, 1.15, 1.9, 0.5))
    ekM(cikar(mh, 0.2), m.sivaAydin)
    for (let i = 0; i < 3; i++) ekM(kutuG(1.1 - i * 0.3, 0.24, 0.1 + i * 0.08).translate(0, 2.1 + i * 0.24, 0.1), m.sivaAydin)
    // Kasnak: dıştan yüksek sekizgen, içte sekiz alçı şebekeli pencere (envanter)
    const AK = 3.95, Y0 = 6.35, Y1 = 9.35, AIC = 3.4
    const RDIS = (A + T + 0.22) / Math.cos(Math.PI / 8)
    kCati.ekle(yer(duzGolge(silindirG(AK / Math.cos(Math.PI / 8) + 0.06, RDIS, 0.75, 8, true).rotateY(Math.PI / 8)), x, UST + 0.47, z), u.kursun)
    disKasnak(x, z, AK, Y0 + 0.25, Y1, [0, 1, 2, 3, 4, 5, 6, 7], 0.75, 1.05)
    const ic = AIC / Math.cos(Math.PI / 8)
    kKasnak.ekle(yer(duzGolge(silindirG(ic, ic, Y1 - UST + 0.1, 8, true).rotateY(Math.PI / 8)), x, (Y1 + UST - 0.1) / 2, z), m.sivaAydin)
    const halkaIc = new THREE.RingGeometry(ic - 0.05, (A + 0.1) / Math.cos(Math.PI / 8), 8).rotateZ(Math.PI / 8).rotateX(Math.PI / 2).translate(x, UST - 0.1, z)
    kKasnak.ekle(halkaIc, m.sivaAydin)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      const s = kemer(new THREE.Shape(), 0, 7.2, 0.82, 1, 0.5)
      kKasnak.ekle(uvSigdir(new THREE.ShapeGeometry(s, 8)).rotateY(Math.PI).translate(0, 0, AIC - 0.03).rotateY(a).translate(x, 0, z), m.vitray)
    }
    kubbeIc(x, Y1, z, AIC + 0.05, 3.2, false, m.kubbeIcAydin)
    kubbeDis(x, Y1 + 0.2, z, 3.65, 3.4, 0.9)
    // Doğu kapısının dar eyvanı: kemerli, kurşun örtülü, dışa taşkın
    const ex = x + A + T
    for (const s of [-1, 1]) {
      kutu(1.5, 4.5, 0.5, m.orgu, ex + 0.75, 2.25, z + s * 1.05)
      for (let i = 0; i < 2; i++) kutu(1.53, 0.14, 0.53, u.mermer, ex + 0.75, 0.07 + i * 4.36, z + s * 1.05)
    }
    const on = dikdortgen(-1.3, 0, 1.3, 4.5)
    on.holes.push(kemer(new THREE.Path(), 0, 0, 1.6, 2.15, 1))
    k.ekle(yer(cikar(on, 0.3, 1.5), ex, 0, z, Math.PI / 2), m.orgu)
    k.ekle(yer(halka(0, 2.15, 2.2, 0.01, 1.3, 1.6, 0.01, 1, 0.05, 1.8), ex, 0, z, Math.PI / 2), m.tugla)
    kutu(1.5, 0.12, 1.6, m.siva, ex + 0.75, 4.3, z)
    kalcaCati(ex - 0.1, ex + 2.05, z - 1.55, z + 1.55, 4.5, 5.1, 0.45)
  }

  // Hamza Bey Ailesi Türbesi: kare, kasnaksız kubbe, kuzeyde kapı ve iki yanında mermer söveli pencere, üst cephe zikzak tuğla, üç sanduka (envanter s. 186-187)
  {
    const { x, z } = AILE
    const A = 1.9, T = 0.8, UST = 6.6, F2 = 0.05
    sivaAktif = m.sivaAydin
    // Kuzey duvarı
    duvarX(z - A, -1, x - A - T, x + A + T, UST, T, m.orgu, [{ tip: 'kemer', u: x, y0: F2, g: 1.4, duz: 2.1, kH: 0.75 }, K_ALT(x - 1.55, F2 + 0.05), K_ALT(x + 1.55, F2 + 0.05)])
    duvarX(z + A, 1, x - A - T, x + A + T, UST, T, m.orgu, [K_ALT(x - 0.9, F2), K_ALT(x + 0.9, F2)])
    duvarZ(x + A, 1, z - A - T, z + A + T, UST, T, m.orgu, [K_ALT(z, F2)])
    duvarZ(x - A, -1, z - A - T, z + A + T, UST, T, m.orgu, [K_ALT(z - 0.9, F2), K_ALT(z + 0.9, F2)])
    sivaAktif = m.siva
    const yuz = A + T
    const levhaZ = (L: number, wx: number, wz: number, ry: number) => {
      const p = dikdortgen(-L / 2, 3.55, L / 2, UST - 0.32)
      p.holes.push(kemer(new THREE.Path(), 0, 4.4, 0.85, 0.75, 0.42))
      k.ekle(yer(cikar(p, 0.03, 0), wx, 0, wz, ry), m.zikzak)
      const sk = () => uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, 4.4, 0.85, 0.75, 0.42), 8))
      k.ekle(yer(sk().translate(0, 0, 0.01), wx, 0, wz, ry), m.sebeke)
      k.ekle(yer(halka(0, 4.28, 1.3, 0.8, 0.65, 0.85, 0.75, 0.42, 0.05, 0.02, 4.4), wx, 0, wz, ry), m.tugla)
      testere(L, UST - 0.2, wx, wz, ry, 0)
      k.ekle(yer(kutuG(L + 0.3, 0.12, 0.3).translate(0, UST, 0.1), wx, 0, wz, ry), u.mermer)
    }
    levhaZ(yuz * 2, x, z - yuz, Math.PI); levhaZ(yuz * 2, x, z + yuz, 0); levhaZ(yuz * 2, x + yuz, z, Math.PI / 2); levhaZ(yuz * 2, x - yuz, z, -Math.PI / 2)
    // Döşeme, tavan, sandukalar
    kutu(A * 2 + 0.4, 0.06, A * 2 + 0.4, m.dosemeTugla, x, 0.03, z)
    kutu(2.6, 0.5, 1.7, m.ceviz, x, 0.31, z + 0.9)
    for (const o of [-0.85, 0, 0.85]) sanduka(x + o, z + 0.9, 0.62, 1.5, 0.62, 0.56, m.brokar)
    pandantif(x, z, A, A, 5.2, 6.5, A, kCati, m.sivaAydin)
    kubbeIc(x, 6.5, z, A, 1.9, false, m.kubbeIcAydin)
    kalcaCati(x - yuz - 0.28, x + yuz + 0.28, z - yuz - 0.28, z + yuz + 0.28, 6.62, 7.3, 0.55)
    kubbeDis(x, 7.2, z, 2.55, 1.85, 0.75)
  }

  // Kara Mustafa Paşa Türbesi: kare, sekizgen kasnak, kubbe (envanter s. 188-189); burada dış kütle olarak modellenmiştir.
  {
    const { x, z } = MUSTAFA
    const H = 4.1, Y = 6.9
    k.ekle(yer(cikar(dikdortgen(-H, 0, H, Y), H * 2, -H), x, 0, z), m.orgu)
    for (const [wx, wz, ry] of [[x, z + H, 0], [x, z - H, Math.PI], [x + H, z, Math.PI / 2], [x - H, z, -Math.PI / 2]] as const) {
      const ek = (g: THREE.BufferGeometry, mal: Mal) => k.ekle(yer(g, wx, 0, wz, ry), mal)
      testere(H * 2, Y - 0.2, wx, wz, ry, 0)
      testere(H * 2, Y - 0.44, wx, wz, ry, 0)
      ek(kutuG(H * 2 + 0.3, 0.12, 0.3).translate(0, Y, 0.1), u.mermer)
      for (const o of [-2.4, 2.4]) {
        if (ry === 0) continue
        ek(new THREE.ShapeGeometry(dikdortgen(o - 0.6, 1, o + 0.6, 2.7)).translate(0, 0, 0.02), m.parmaklik)
        ek(kutuG(1.46, 0.16, 0.1).translate(o, 2.78, 0.05), u.mermer)
      }
      for (const o of [-2.4, 0, 2.4]) {
        ek(uvSigdir(new THREE.ShapeGeometry(kemer(new THREE.Shape(), o, 3.6, 0.95, 1.1, 0.55), 8)).translate(0, 0, 0.02), m.sebeke)
        ek(halka(o, 3.6, 1.45, 1.1, 0.8, 0.95, 1.1, 0.55, 0.05, 0.02), m.tugla)
      }
    }
    // Güneyde kurşun örtülü kemerli giriş (foto); kapı kapalıdır
    const ex = z + H
    for (const s of [-1, 1]) kutu(0.5, 4.6, 2, m.orgu, x + s * 1.45, 2.3, ex + 1)
    const on = dikdortgen(-1.7, 0, 1.7, 4.6)
    on.holes.push(kemer(new THREE.Path(), 0, 0, 2.2, 2.2, 1.2))
    k.ekle(yer(cikar(on, 0.3, 0), x, 0, ex + 1.7), m.orgu)
    k.ekle(yer(halka(0, 2.2, 2.9, 0.01, 1.55, 2.2, 0.01, 1.2, 0.06, 0.3), x, 0, ex + 1.7), m.tugla)
    kutu(1.5, 2.6, 0.08, m.ceviz, x, 1.3, ex + 0.04)
    kalcaCati(x - 1.95, x + 1.95, ex - 0.1, ex + 2.25, 4.6, 5.3, 0.5)
    // Doğudaki ek bölüm (foto, envanter "ekleme")
    kutu(1.7, 4.2, 4.4, m.orgu, x + H + 0.85, 2.1, z - 0.2)
    kalcaCati(x + H - 0.05, x + H + 1.9, z - 2.6, z + 2.2, 4.2, 4.7, 0.3)
    // Çatı: köşelerde kurşun pahlar, sekizgen kasnak, kubbe
    kalcaCati(x - H - 0.28, x + H + 0.28, z - H - 0.28, z + H + 0.28, Y + 0.02, Y + 0.85, 0.75)
    disKasnak(x, z, 3.55, Y + 0.72, 9.7, [0, 2, 4, 6], 0.7, 0.8)
    kubbeDis(x, 9.92, z, 3.42, 3.2, 0.85)
  }

  // Avludaki sekizgen köşk: yalnız kuşbakışı fotoğraftan yorumlanmıştır, kaynakta adı geçmez.
  {
    const x = -0.4, z = -25, R = 3.1
    sekizgen(R + 0.3, R + 0.3, 0, 0.2, k, u.mermer, x, z, false)
    for (let n = 0; n < 8; n++) {
      const a = Math.PI / 8 + (n * Math.PI) / 4
      k.ekle(yer(silindirG(0.09, 0.11, 2.8, 8), x + Math.sin(a) * R, 1.6, z + Math.cos(a) * R), u.bronz)
    }
    sekizgen(R + 0.05, R + 0.05, 3, 3.3, k, u.kursun, x, z, false)
    k.ekle(yer(duzGolge(silindirG(0.5, R + 0.4, 1.3, 8).rotateY(Math.PI / 8)), x, 3.95, z), u.koyu)
  }

  // ---------------------------------------------------------------- AĞAÇLAR (konumlar kuşbakışı fotoğraftan, boylar temsilî)
  const taclar = (x: number, z: number, r: number, y: number, mal: Mal, tohum: number) => {
    for (let i = 0; i < 4; i++) {
      const a = tohum + i * 1.9, d = i === 0 ? 0 : r * 0.55
      const g = new THREE.IcosahedronGeometry(i === 0 ? r : r * 0.62, 3)
      const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
      for (let v = 0; v < p.count; v++) {
        const vx = p.getX(v), vy = p.getY(v), vz = p.getZ(v)
        const o = 1 + 0.12 * Math.sin(vx * 1.7 + tohum) * Math.cos(vz * 1.5) + 0.09 * Math.sin(vy * 2.6 + tohum * 2) + 0.05 * Math.sin((vx + vz) * 5 + vy * 4)
        // Yumuşak gölgeleme: normal kürenin normali kalır.
        n.setXYZ(v, vx, vy, vz)
        p.setXYZ(v, vx * o, vy * o * 0.82, vz * o)
        uv.setXY(v, vx + vy, vz + vy)
      }
      n.needsUpdate = true
      g.normalizeNormals()
      k.ekle(yer(g, x + Math.sin(a) * d, y + (i === 0 ? 0 : -r * 0.2), z + Math.cos(a) * d), mal)
    }
    k.ekle(yer(silindirG(r * 0.09, r * 0.14, y, 8), x, y / 2, z), m.govde)
  }
  taclar(16.5, -25.5, 5.2, 10, m.yaprakSari, 1)
  taclar(-10.5, -19.5, 3.8, 8, m.yaprakSari, 2)
  taclar(19, -5, 3.6, 7, m.yaprakYesil, 3)
  taclar(-26, -33.5, 3.4, 7, m.yaprakYesil, 4)
  taclar(-15, -29, 3.3, 7, m.yaprakYesil, 5)
  const selvi = (x: number, z: number, boy: number) => {
    const p: [number, number][] = [[0.15, 1.5], [1.2, 2.1], [1.7, boy * 0.2], [1.95, boy * 0.33], [1.85, boy * 0.47], [1.55, boy * 0.61], [1.15, boy * 0.75], [0.72, boy * 0.87], [0.3, boy * 0.96], [0, boy]]
    const g = dondurG(p, 18)
    k.ekle(yer(g, x, 0, z), u.selvi)
    k.ekle(yer(silindirG(0.2, 0.3, 2.2, 8), x, 1.1, z), m.govde)
  }
  selvi(-23, -3, 15); selvi(9.5, 8.5, 14); selvi(-9, 11, 13); selvi(6, -43, 14)
  const agaclar: { x: number; z: number; r: number }[] = [
    { x: 16.5, z: -25.5, r: 0.55 }, { x: -10.5, z: -19.5, r: 0.4 }, { x: 19, z: -5, r: 0.4 }, { x: -26, z: -33.5, r: 0.4 }, { x: -15, z: -29, r: 0.4 },
    { x: -23, z: -3, r: 0.3 }, { x: 9.5, z: 8.5, r: 0.3 }, { x: -9, z: 11, r: 0.3 }, { x: 6, z: -43, r: 0.3 },
  ]

  // ---------------------------------------------------------------- YÜRÜME
  const k1 = (x0: number, x1: number, z0: number, z1: number, ust?: number): Kutu => ({ x0: x0 + OX, x1: x1 + OX, z0: z0 + OZ, z1: z1 + OZ, ust })
  const anaDuvarlar: Kutu[] = [
    // Revak ön hattı: yalnız orta göz açık
    k1(-REVAK_X, -2.1, REVAK_D - 0.2, REVAK_I), k1(2.1, REVAK_X, REVAK_D - 0.2, REVAK_I),
    k1(-3, -2.1, ORTA_D, REVAK_I), k1(2.1, 3, ORTA_D, REVAK_I),
    // Revak uçları
    k1(-REVAK_X, -11.3, REVAK_D, -5.1), k1(11.3, REVAK_X, REVAK_D, -5.1),
    // Harim kuzey duvarı, kapı ortada
    k1(-11.75, -0.95, -5.1, -4.05), k1(0.95, 11.75, -5.1, -4.05),
    // Sofa-eyvan kemerlerinin ayakları
    ...[-1, 1].flatMap((s) => {
      const b = (a: number, c: number) => (s > 0 ? [a, c] : [-c, -a]) as [number, number]
      return [
        k1(...b(4.05, 5.25), -4.05, -3.35), k1(...b(4.05, 5.25), 2.85, 4.05),
        k1(...b(10.85, 11.75), -5.1, 3.8),
        k1(...b(5.25, 11.75), 2.9, 3.8),
        k1(...b(3.4, 4.05), 4.05, 5.35),
        k1(...b(4.05, 4.95), 3.8, 14.35),
      ]
    }),
    k1(-4.95, 4.95, KIBLE_Z, 14.35),
  ]
  const ayrinti: Kutu[] = [
    // Basamak yanı platform kenarı adım sınırına takılır; burada yalnız görünen engeller
    k1(-1.55, 1.55, KIBLE_Z - 0.55, KIBLE_Z),
    k1(-4.05, -1.95, KIBLE_Z - 0.2, KIBLE_Z),
    // Eyvan mihrap nişleri
    k1(-8.2, -6, 2.7, 2.9),
    k1(5.15, 6.65, 2.74, 2.9),
  ]
  // Minber: Ulu Camii'deki gibi yan duvarlar, kapı sövesi ve köşk engel, arası merdiven
  const MY = MINBER.en / 2
  const mk = (a: number, b: number, c: number, d: number) => k1(MINBER.x + a, MINBER.x + b, MINBER.z0 + c, MINBER.z0 + d)
  const minberKutular = [mk(-MY - 0.07, -MY + 0.07, 0.7, MINBER.boy), mk(MY - 0.07, MY + 0.07, 0.7, MINBER.boy), mk(-MY - 0.1, -0.65, 0, 0.7), mk(0.65, MY + 0.1, 0, 0.7), mk(-MY, MY, MINBER.s1, MINBER.boy)]

  // Türbeler
  const turbeKutular: Kutu[] = []
  {
    const { x, z } = HAMZA, A = 3.7, T = 1, orta = A + T / 2, boy = T + 0.1
    const L = 2 * (A + T) * Math.tan(Math.PI / 8)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4, dx = Math.sin(a), dz = Math.cos(a), ux = Math.cos(a), uz = -Math.sin(a)
      for (let t = -L / 2; t <= L / 2 + 0.01; t += L / 8) {
        // Kapı ekseninde kutular boş: kalan açıklık oyuncu yarıçapıyla geçilebilir.
        if (n === 2 && Math.abs(t) < 1.3) continue
        const px = x + dx * orta + ux * t, pz = z + dz * orta + uz * t
        turbeKutular.push(k1(px - boy / 2, px + boy / 2, pz - boy / 2, pz + boy / 2))
      }
    }
    // Eyvan yanları, sandukalar
    const ex = x + A + T
    for (const s of [-1, 1]) turbeKutular.push(k1(ex, ex + 1.5, z + s * 1.05 - 0.25, z + s * 1.05 + 0.25))
    turbeKutular.push(k1(x - 1.7, x + 0.5, z - 1.2, z + 1.2), k1(x - 2.4, x + 1.9, z + 1.87, z + 3.37), k1(x - 2.4, x + 1.9, z - 3.37, z - 1.87))
  }
  {
    const { x, z } = AILE, A = 1.9, T = 0.8
    turbeKutular.push(
      k1(x - A - T, x - 0.7, z - A - T, z - A), k1(x + 0.7, x + A + T, z - A - T, z - A),
      k1(x - A - T, x + A + T, z + A, z + A + T), k1(x - A - T, x - A, z - A, z + A), k1(x + A, x + A + T, z - A, z + A),
      k1(x - 1.3, x + 1.3, z + 0.05, z + 1.75),
    )
  }
  {
    const { x, z } = MUSTAFA, H = 4.1
    turbeKutular.push(k1(x - H, x + H + 1.7, z - H, z + H), k1(x - 1.7, x + 1.7, z + H, z + H + 2))
  }
  const koskKutu = k1(-3.5, 2.7, -27.8, -22.2)
  const minareKutu = k1(MINARE.x - 1.8, MINARE.x + 1.8, MINARE.z - 1.8, MINARE.z + 1.8)

  const SINIR_X = 27, SINIR_Z = 30, KOSE_X = 20, KOSE_Z = 24
  const kaideKoseleri: Kutu[] = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    kaideKoseleri.push({ x0: sx > 0 ? KOSE_X : -SINIR_X - 1, x1: sx > 0 ? SINIR_X + 1 : -KOSE_X, z0: sz > 0 ? KOSE_Z : -SINIR_Z - 1, z1: sz > 0 ? SINIR_Z + 1 : -KOSE_Z })
  }

  const z1 = (x0: number, x1: number, z0: number, z2: number, h0: number, h1: number): ZeminAlani => ({ x0: x0 + OX, x1: x1 + OX, z0: z0 + OZ, z1: z2 + OZ, h0, h1 })
  const zeminler: ZeminAlani[] = [
    // Dış merdiven ve revak
    z1(-2.1, 2.1, ORTA_D - 1.4, ORTA_D, 0, F),
    z1(-2.1, 2.1, ORTA_D, REVAK_D, F, F),
    z1(-11.3, 11.3, REVAK_D, -4.05, F, F),
    // Sofa, eyvanlar
    z1(-11, 11, -4.05, 2.9, F, F),
    z1(-4.05, 4.05, 2.9, 4.1, F, F),
    // Mihrap önüne çıkan iki basamak ve yükseltilmiş sofa
    z1(-1.2, 1.2, 3.1, 4.1, F, PLATFORM),
    z1(-4.05, 4.05, 4.1, KIBLE_Z, PLATFORM, PLATFORM),
    // Minber merdiveni
    z1(MINBER.x - MY, MINBER.x + MY, MINBER.z0 + MINBER.s0, MINBER.z0 + MINBER.s1, PLATFORM, PLATFORM + MINBER.h1),
  ]

  // ---------------------------------------------------------------- KATMANLAR
  const kok = k.grup()
  const cati = kCati.grup(), kasnak = kKasnak.grup(), kubbe = kKubbe.grup()
  kok.add(cati, kasnak, kubbe)
  kok.position.set(OX, 0, OZ)

  const d = (id: string, ad: string, x: number, h: number, z: number, bx: number, by: number, bz: number): IcDurak =>
    ({ id, ad, konum: [x + OX, GOZ + h, z + OZ], bak: [bx + OX, by, bz + OZ] })
  const minberS = 3.6
  const minberH = PLATFORM + (MINBER.h1 * (minberS - MINBER.s0)) / (MINBER.s1 - MINBER.s0)
  const duraklar: IcDurak[] = [
    d('revak', 'Son cemaat yeri', 7.5, F, -7.6, -4, 4.2, -5.3),
    d('kapi', 'Cümle kapısı', 0, F, -10, 0, 3.3, -5.1),
    d('sofa', 'Orta sofa', 0, F, -3, 0, 4.6, 13.4),
    d('mihrap', 'Mihrap', 0, PLATFORM, 7.5, 0, 4.2, KIBLE_Z),
    d('minber', 'Minbere çık', MINBER.x, minberH, MINBER.z0 + minberS, 4, 3, 4),
    d('bati-eyvan', 'Batı eyvanı', -8.3, F, -2.4, -7.1, 3, 2.9),
    d('dogu-eyvan', 'Doğu eyvanı', 7.5, F, -2.8, 7, 3.2, 2.9),
    d('kubbe', 'Orta kubbe', 1.5, F, -0.8, 0, 16, 0),
    d('avlu', 'Avlu', 0, 0, -20.8, 0, 5, -8),
    d('hamza-turbesi', 'Hamza Bey Türbesi', HAMZA.x + 2.7, 0, HAMZA.z, HAMZA.x - 3, 1.6, HAMZA.z),
    d('aile-turbesi', 'Aile Türbesi', AILE.x, 0, AILE.z - 1.3, AILE.x, 1, AILE.z + 1.9),
  ]

  return {
    kok,
    katmanlar: [
      { grup: cati, yukseklik: 16, ad: 'Çatılar' },
      { grup: kasnak, yukseklik: 26, ad: 'Kasnaklar' },
      { grup: kubbe, yukseklik: 36, ad: 'Kubbeler' },
    ],
    duraklar,
    yurume: {
      sinir: { x0: -SINIR_X, x1: SINIR_X, z0: -SINIR_Z, z1: SINIR_Z },
      kutular: [...anaDuvarlar, ...ayrinti, ...minberKutular, ...turbeKutular, koskKutu, minareKutu, ...kaideKoseleri],
      daireler: agaclar.map((a) => ({ x: a.x + OX, z: a.z + OZ, r: a.r })),
      zeminler,
      gorusKesenler: [...anaDuvarlar, ...turbeKutular, koskKutu, minareKutu],
      gozY: GOZ,
      tabanY: 0,
    },
    kamera: { konum: [22, 31, -72], hedef: [2, 6, 2] },
    kaideYaricap: KAIDE_R + 1,
    icIsiklar: [[OX, 8.2, OZ], [OX, 8.6, MIHRAP_Z + OZ], [OX - EYVAN_X, 6.2, OZ], [OX + EYVAN_X, 6.2, OZ]],
  }
}
