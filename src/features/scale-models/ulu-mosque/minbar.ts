// Ulu Camii minber bölgesi: kündekâri minber, müezzin mahfili, mermer ve ahşap vaaz kürsüleri, dolaplar, sandık ve rahleler.
// Biçimler arşiv fotoğraflarından, sekiz direk ve kitabeler envanter kitabından. Dokular ve yazılar arşiv fotoğrafının
// perspektifi düzeltilmiş kırpımlarıdır (scripts/minber_kirp.py); kod yazı üretmez.
// Temsilî olanlar: köşkün doğu yüzü batı yüzünün kırpımını taşır, kürsünün basamakları yürüme içindir, oranlar maket ölçeğindedir.
// Kafes ve halka korkuluklar saydam katman değil gerçek geometridir; her şey iki malzemede birleşir (iki çizim çağrısı).
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'
import { lightDevice } from '../uluMosqueFloor'
import type { UluMosqueMaterials } from '../uluMosqueTextures'
import { Bucket, subtract, rotateG, flatShadow, boxG, cylinderG, uvFit, place } from '../uluMosquePiece'

const ATLAS = 2048
/** Atlastaki bölgeler (piksel: x, y, g, y). scripts/minber_kirp.py çıktısıyla aynı kalmalı. */
const REGION = {
  kioskNorth: [0, 0, 480, 1336], kioskWest: [490, 0, 480, 1266], doorBoard: [980, 0, 512, 440], doorCrown: [980, 450, 512, 320],
  leather: [1500, 0, 512, 496], marble: [980, 810, 1024, 128], inscription: [1500, 510, 512, 137], pedestal: [1500, 660, 256, 112],
  walnut: [980, 945, 1060, 84], boardStar: [1762, 660, 280, 116], cabinet: [0, 1345, 360, 498], cabinetSide: [370, 1345, 120, 400],
} as const
type Region = keyof typeof REGION

/** Geometrinin 0-1 UV'sini atlas bölgesine taşır; yarım piksel içeriden keserek komşu bölgenin sızmasını önler. */
function match<G extends THREE.BufferGeometry>(g: G, ad: Region): G {
  const [x, y, gn, yk] = REGION[ad]
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    const u = THREE.MathUtils.clamp(uv.getX(i), 0, 1), v = THREE.MathUtils.clamp(uv.getY(i), 0, 1)
    uv.setXY(i, (x + 1 + u * (gn - 2)) / ATLAS, 1 - (y + 1 + (1 - v) * (yk - 2)) / ATLAS)
  }
  return g
}

/** Kutu: her yüz bölgenin tamamını alır (UV 0-1). */
const boxA = (g: number, h: number, d: number, ad: Region) => match(new THREE.BoxGeometry(g, h, d), ad)
const plaqueA = (g: number, h: number, ad: Region) => match(new THREE.PlaneGeometry(g, h), ad)

/** İki yüzlü üçgen; `uv` köşeleri atlas bölgesinin 0-1 koordinatındadır. */
function triangleA(k: [number, number, number][], uv: [number, number][], ad: Region) {
  const g = new THREE.BufferGeometry()
  const row = [0, 1, 2, 0, 2, 1]
  g.setAttribute('position', new THREE.Float32BufferAttribute(row.flatMap((i) => k[i]), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(row.flatMap((i) => uv[i]), 2))
  g.computeVertexNormals()
  return match(g, ad)
}

/** Kafes: dikdörtgen levhada sekiz köşeli yıldız ve köşelerde baklava boşluklar; x 0..L, y 0..W. */
function cageG(L: number, W: number, unit: number) {
  const s = new THREE.Shape()
  s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, W); s.lineTo(0, W); s.closePath()
  const column = Math.max(1, Math.floor(L / unit)), row = Math.max(1, Math.floor(W / unit))
  const bx = L / column, by = W / row
  for (let i = 0; i < column; i++) for (let j = 0; j < row; j++) {
    const cx = (i + 0.5) * bx, cy = (j + 0.5) * by, R = Math.min(bx, by) * 0.4
    const y = new THREE.Path()
    for (let n = 0; n < 16; n++) {
      const a = (n / 16) * Math.PI * 2, r = n % 2 ? R * 0.7 : R * 1.08
      if (n) y.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      else y.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    y.closePath()
    s.holes.push(y)
    if (i < column - 1 && j < row - 1) {
      const dx = (i + 1) * bx, dy = (j + 1) * by, d = Math.min(bx, by) * 0.13
      const b = new THREE.Path()
      b.moveTo(dx + d, dy); b.lineTo(dx, dy + d); b.lineTo(dx - d, dy); b.lineTo(dx, dy - d); b.closePath()
      s.holes.push(b)
    }
  }
  return subtract(s, 0.05, -0.025)
}

interface Textures { atlas: THREE.MeshStandardMaterial; kund: THREE.MeshStandardMaterial }
const cache = new WeakMap<UluMosqueMaterials, Textures>()

/** Bölgenin iki malzemesi. Sahne kapanınca dokular başka malzemelerle birlikte temizlenir. */
function textures(m: UluMosqueMaterials): Textures {
  const var_ = cache.get(m)
  if (var_) return var_
  let d: Textures
  if (PUBLIC_BUILD) {
    // Açık yayında arşiv kırpımı yok: yalnız düz ceviz ve koddan üretilmiş kündekâri izlenimi.
    d = { atlas: new THREE.MeshStandardMaterial({ color: '#3a2317', roughness: 0.6 }), kund: m.kundekari }
  } else {
    const lite = lightDevice()
    const y = new THREE.TextureLoader()
    const at = y.load(`/images/ulu-mosque/model/minbar-atlas${lite ? '-1024' : ''}.jpg`)
    at.colorSpace = THREE.SRGBColorSpace
    at.anisotropy = lite ? 2 : 8
    const ku = y.load(`/images/ulu-mosque/model/minbar-kundekari${lite ? '-512' : ''}.jpg`)
    ku.colorSpace = THREE.SRGBColorSpace
    ku.wrapS = ku.wrapT = THREE.RepeatWrapping
    // Bir tekrar, köşk ayağı genişliğinin iki katı: yıldızlar fotoğraftaki boyda kalır.
    ku.repeat.set(1 / 3, 1 / (3 * (1440 / 1024)))
    ku.anisotropy = lite ? 2 : 8
    d = {
      atlas: new THREE.MeshStandardMaterial({ map: at, roughness: 0.58, metalness: 0 }),
      kund: new THREE.MeshStandardMaterial({ map: ku, color: new THREE.Color(1.45, 1.42, 1.5), roughness: 0.5, metalness: 0.08, ...(lite ? {} : { bumpMap: ku, bumpScale: 1.4 }) }),
    }
  }
  cache.set(m, d)
  return d
}

export interface MinbarSize { x: number; z0: number; length: number; en: number; apex: number; wallZ: number; floor: number }

/** Yerel eksen: s (x) kapıdan köşke, y yukarı, z batıya. `ek` geometriyi dünyaya taşır. */
export function buildMinbar(m: UluMosqueMaterials, k: Bucket, o: MinbarSize) {
  const { atlas, kund } = textures(m)
  const { length: LENGTH, en: EN, apex: TOP, floor: Z } = o
  const ext = (g: THREE.BufferGeometry, mat: THREE.Material) => {
    g.rotateY(-Math.PI / 2)
    g.translate(o.x, 0, o.z0)
    k.add(g, mat)
  }
  const gold = m.goldDark
  /** İki nokta arası ince altın (veya verilen) şerit: (s, y) düzleminde, zYuz yüzünde. */
  const strip = (s0: number, y0: number, s1: number, y1: number, zFace: number, en = 0.035, mat: THREE.Material = gold, stay = 0.03) => {
    const L = Math.hypot(s1 - s0, y1 - y0)
    const g = new THREE.BoxGeometry(L, en, stay)
    g.rotateZ(Math.atan2(y1 - y0, s1 - s0))
    g.translate((s0 + s1) / 2, (y0 + y1) / 2, zFace)
    ext(g, mat)
  }
  const YK = EN / 2

  // --- Yan yüzler: üçgen gövde kündekâri, içinde altın üçgen çerçeve (fotoğraftaki gibi) ---
  const side = new THREE.Shape()
  side.moveTo(0.7, Z); side.lineTo(LENGTH, Z); side.lineTo(LENGTH, Z + TOP + 0.5); side.lineTo(LENGTH - 1.2, Z + TOP + 0.5)
  side.lineTo(1.8, Z + 0.9); side.lineTo(0.7, Z + 0.9); side.closePath()
  for (const s of [-1, 1]) ext(subtract(side, 0.14, s * YK - 0.07), kund)
  const slope = (TOP + 0.5 - 0.9) / (LENGTH - 1.2 - 1.8)
  const topY = (s: number) => Z + 0.9 + (s - 1.8) * slope
  for (const s of [-1, 1]) {
    const zy = s * (YK + 0.075)
    // Üçgen çerçeve
    strip(1.55, Z + 0.28, 5.8, Z + 0.28, zy)
    strip(5.8, Z + 0.28, 5.8, topY(5.8) - 0.3, zy)
    strip(1.55, Z + 0.28, 5.8, topY(5.8) - 0.3, zy)
    // Basamak kirişi: kafesin altında boydan boya koyu şerit, iki yanı altın
    const s0 = 1.15, s1 = 6.05, a0 = topY(s0), a1 = topY(s1)
    strip(s0, a0 + 0.03, s1, a1 + 0.03, s * YK, 0.3, kund, 0.2)
    strip(s0, a0 - 0.13, s1, a1 - 0.13, s * (YK + 0.1), 0.03)
    strip(s0, a0 + 0.2, s1, a1 + 0.2, s * (YK + 0.1), 0.03)
    // Süpürgelik
    ext(boxA(6.6, 0.14, 0.1, 'walnut').translate(4, Z + 0.07, s * (YK + 0.12)), atlas)
  }

  // --- Korkuluk: yıldız kafesli panolar, aralarında dikey kayıtlar, üstte küpeşte ---
  {
    const a = Math.atan(slope), head = 1.25, last = 6.05
    const long = (last - head) / Math.cos(a), BOARD = 5, W = 0.78, OFFSET = 0.22
    for (const s of [-1, 1]) {
      const zy = s * YK
      const placeAt = (g: THREE.BufferGeometry) => {
        g.rotateZ(a)
        g.translate(head, topY(head) + OFFSET, zy)
        return g
      }
      for (let p = 0; p < BOARD; p++) {
        const L = long / BOARD
        const cage = cageG(L - 0.1, W, 0.25)
        cage.translate(p * L + 0.05, 0, 0)
        ext(placeAt(cage), kund)
        ext(placeAt(new THREE.BoxGeometry(0.1, W + 0.04, 0.09).translate(p * L, W / 2, 0)), kund)
      }
      ext(placeAt(new THREE.BoxGeometry(0.1, W + 0.04, 0.09).translate(long, W / 2, 0)), kund)
      ext(placeAt(boxA(long + 0.1, 0.1, 0.16, 'walnut').translate(long / 2, W + 0.05, 0)), atlas)
      ext(placeAt(new THREE.BoxGeometry(long + 0.1, 0.025, 0.17).translate(long / 2, W + 0.002, 0)), gold)
    }
  }

  // --- Basamaklar: kırmızı halı, koyu burun ---
  for (const [s, y] of [[1.0, 0.3], [1.45, 0.6]]) ext(boxG(0.5, y, EN - 0.28).translate(s + 0.2, Z + y / 2, 0), m.mihrabRed)
  const STEP = 11
  for (let i = 0; i < STEP; i++) {
    const t = i / STEP, s = 1.8 + t * (LENGTH - 3), y = Z + 0.9 + t * (TOP - 0.4), d = (LENGTH - 3) / STEP
    ext(boxG(d + 0.02, y - Z, EN - 0.28).translate(s + d / 2, (y + Z) / 2, 0), m.mihrabRed)
    ext(new THREE.BoxGeometry(0.05, 0.05, EN - 0.28).translate(s + 0.03, y + 0.005, 0), m.wood)
  }

  // --- Köşk: duvara dayanan kule; kuzey yüzünde perdeli niş, yanlarda niş, kafes ve kitabe ---
  const KS = 6.05, KE = o.wallZ - o.z0, KG = KE - KS, KM = (KS + KE) / 2, TH = 9.1
  ext(boxG(KG, TH, EN).translate(KM, Z + TH / 2, 0), kund)
  // Yan yüzler: batı yüz kırpımı. Doğu yüzü için aynı kırpım (temsilî): köşkün doğusunu kapatan net bir fotoğraf yok.
  const YH = KG * (1266 / 480), YY = Z + TH - YH / 2
  ext(plaqueA(KG, YH, 'kioskWest').translate(KM, YY, YK + 0.012), atlas)
  ext(plaqueA(KG, YH, 'kioskWest').rotateY(Math.PI).translate(KM, YY, -YK - 0.012), atlas)
  // Kuzey yüzü: ortada fotoğraf, iki yanda kündekâri
  const NOR_G = 1.4, NOR_H = NOR_G * (1336 / 480), NOR_Y = Z + TH - NOR_H / 2
  ext(plaqueA(NOR_G, NOR_H, 'kioskNorth').rotateY(-Math.PI / 2).translate(KS - 0.012, NOR_Y, 0), atlas)
  for (const s of [-1, 1]) {
    const dx = KS - 0.02
    ext(new THREE.BoxGeometry(0.03, NOR_H, 0.03).translate(dx, NOR_Y, s * (NOR_G / 2 + 0.01)), gold)
    ext(new THREE.BoxGeometry(0.03, TH, 0.04).translate(dx, Z + TH / 2, s * (YK - 0.01)), gold)
    // Köşk ayağının kenar altınları
    const zy = s * (YK + 0.012)
    strip(KS + 0.07, Z + 0.1, KS + 0.07, YY - YH / 2, zy)
    strip(KE - 0.07, Z + 0.1, KE - 0.07, YY - YH / 2, zy)
    strip(KS + 0.07, Z + 0.1, KE - 0.07, Z + 0.1, zy)
    ext(new THREE.BoxGeometry(KG, 0.05, 0.03).translate(KM, YY - YH / 2, zy), gold)
  }
  // Saçak: altın silme ve kitabe kuşağı izlenimi veren ceviz
  ext(boxA(KG + 0.14, 0.2, EN + 0.14, 'walnut').translate(KM, Z + TH + 0.1, 0), atlas)
  ext(new THREE.BoxGeometry(KG + 0.18, 0.05, EN + 0.18).translate(KM, Z + TH + 0.02, 0), gold)
  ext(new THREE.BoxGeometry(KG + 0.18, 0.04, EN + 0.18).translate(KM, Z + TH + 0.19, 0), gold)

  // --- Külâh: sekiz yüzlü, koyu, altın üçgen örgülü (kitap: ajurlu ahşap külâh; fotoğraftaki örgü) ---
  {
    const y0 = Z + TH + 0.2, R = Math.max(KG, EN) * 0.62
    const ring: [number, number][] = [[R, 0], [R * 0.82, 0.42], [R * 0.48, 0.95], [R * 0.1, 1.4]]
    const gv = flatShadow(rotateG(ring, 8).rotateY(Math.PI / 8))
    ext(gv.translate(KM, y0, 0), m.wood)
    const rib = (a: THREE.Vector3, b: THREE.Vector3) => {
      const L = a.distanceTo(b)
      const g = cylinderG(0.018, 0.018, L, 4)
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()))
      g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
      ext(g, gold)
    }
    const point = (hl: number, n: number) => {
      const a = ((n + 0.5) / 8) * Math.PI * 2
      const r = ring[hl][0] * 1.012
      return new THREE.Vector3(KM + Math.cos(a) * r, y0 + ring[hl][1], Math.sin(a) * r)
    }
    const ara = (hl: number, n: number) => {
      const a = ((n + 1) / 8) * Math.PI * 2
      const r = ring[hl][0] * Math.cos(Math.PI / 8) * 1.012
      return new THREE.Vector3(KM + Math.cos(a) * r, y0 + ring[hl][1], Math.sin(a) * r)
    }
    for (let n = 0; n < 8; n++) for (let h = 0; h < 3; h++) {
      rib(point(h, n), point(h + 1, n))
      rib(point(h, n), point(h, n + 1))
      rib(point(h, n), ara(h + 1, n))
      rib(point(h, n + 1), ara(h + 1, n))
    }
    // Alem: üst üste altın küreler ve hilal
    const apex = y0 + 1.36
    ext(rotateG([[0.09, 0], [0.04, 0.05], [0.16, 0.16], [0.17, 0.25], [0.05, 0.36], [0.14, 0.46], [0.15, 0.55], [0.04, 0.66], [0.11, 0.76], [0.11, 0.84], [0.025, 0.95], [0.02, 1.1]], 10).translate(KM, apex, 0), m.gold)
    ext(new THREE.TorusGeometry(0.16, 0.035, 5, 14, Math.PI * 1.45).rotateZ(Math.PI * 0.77).rotateY(Math.PI / 2).translate(KM, apex + 1.24, 0), m.gold)
  }

  // --- Kapı: iki söve, kitabeli lento ve oymalı taç ---
  {
    const PG = EN + 0.2, OPEN = 1.3, LINTEL0 = 3.05, LINTEL1 = 4.4, DER = 0.7
    const casing = (PG - OPEN) / 2
    for (const s of [-1, 1]) {
      const zs = s * (OPEN / 2 + casing / 2)
      ext(boxG(DER, LINTEL0, casing).translate(DER / 2, Z + LINTEL0 / 2, zs), kund)
      ext(new THREE.BoxGeometry(0.03, LINTEL0, 0.03).translate(-0.012, Z + LINTEL0 / 2, s * (OPEN / 2 + 0.03)), gold)
      ext(new THREE.BoxGeometry(0.03, LINTEL1, 0.03).translate(-0.012, Z + LINTEL1 / 2, s * (PG / 2 - 0.03)), gold)
    }
    ext(boxG(DER, LINTEL1 - LINTEL0, PG).translate(DER / 2, Z + (LINTEL0 + LINTEL1) / 2, 0), kund)
    const panG = 1.4, panH = panG * (440 / 512)
    const panY = Z + (LINTEL0 + LINTEL1) / 2
    ext(plaqueA(panG, Math.min(panH, LINTEL1 - LINTEL0 - 0.1), 'doorBoard').rotateY(-Math.PI / 2).translate(-0.012, panY, 0), atlas)
    ext(new THREE.BoxGeometry(DER + 0.06, 0.05, PG + 0.06).translate(DER / 2, Z + LINTEL1 + 0.025, 0), gold)
    // Taç: fotoğraftan kesilmiş siluet; arkadan da görünür
    const TG = PG, TH2 = TG * (320 / 512)
    const outer: [number, number][] = [[0.02, 0.01], [0.13, 0.25], [0.24, 0.47], [0.35, 0.66], [0.37, 0.81], [0.43, 0.96], [0.51, 0.91], [0.53, 0.77], [0.65, 0.66], [0.82, 0.44], [0.97, 0.25], [1, 0.02]]
    const crown = new THREE.Shape()
    outer.forEach(([u, v], i) => {
      const x = (u - 0.5) * TG, y = v * TH2
      if (i) crown.lineTo(x, y); else crown.moveTo(x, y)
    })
    crown.closePath()
    const face = (ry: number, dx: number) => {
      const g = new THREE.ShapeGeometry(crown)
      const p = g.attributes.position, uv = g.attributes.uv
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / TG + 0.5, p.getY(i) / TH2)
      match(g, 'doorCrown')
      g.rotateY(ry)
      g.translate(dx, Z + LINTEL1 + 0.05, 0)
      ext(g, atlas)
    }
    face(-Math.PI / 2, 0.24)
    face(Math.PI / 2, 0.46)
    const body = subtract(crown, 0.2, -0.1)
    body.rotateY(-Math.PI / 2)
    ext(body.translate(0.35, Z + LINTEL1 + 0.05, 0), m.wood)
  }
}

/** Alçak korkuluk: tornalı parmaklık, alt ve üst kayıt, aralıklı dikmeler. */
export function balustrade(m: UluMosqueMaterials, k: Bucket, x0: number, z0: number, x1: number, z1: number, floor: number, h = 0.82) {
  const { atlas } = textures(m)
  const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
  const count = Math.max(2, Math.round(L / 0.2))
  const bal: [number, number][] = [[0.026, 0], [0.042, 0.1 * h], [0.022, 0.3 * h], [0.05, 0.5 * h], [0.022, 0.7 * h], [0.04, 0.9 * h], [0.026, h]]
  for (let n = 0; n <= count; n++) {
    const t = n / count
    k.add(match(rotateG(bal, 5, [1, 1]), 'walnut').translate(x0 + (x1 - x0) * t, floor, z0 + (z1 - z0) * t), atlas)
  }
  k.add(place(boxA(0.14, 0.06, L + 0.08, 'walnut'), mx, floor + h + 0.03, mz, a), atlas)
  k.add(place(boxA(0.12, 0.08, L + 0.04, 'walnut'), mx, floor + 0.04, mz, a), atlas)
  const stanchion = Math.max(1, Math.round(L / 1.3))
  for (let n = 0; n <= stanchion; n++) {
    const t = n / stanchion
    k.add(place(boxA(0.12, h + 0.12, 0.12, 'walnut'), x0 + (x1 - x0) * t, floor + (h + 0.12) / 2, z0 + (z1 - z0) * t, a), atlas)
  }
}

export interface MahfilSize { x: number; z: number; wZ: number; floor: number }
/** Mahfilin alt korkuluğu: orta eksen açık kalır, kuzeydoğu köşesinde merdiven vardır. */
export const MAHFIL_LOWER_RAILING: [number, number, number, number][] = [
  [-3.1, -2.1, -3.1, 2.1], [3.1, -1.6, 3.1, 2.1],
  [-3.1, 2.1, -0.85, 2.1], [0.85, 2.1, 3.1, 2.1],
  [-3.1, -2.1, -0.85, -2.1], [0.85, -2.1, 1.95, -2.1],
]

/** Sekiz direkli ceviz mahfil (envanter: sekiz ağaç direk; biçim g85, g84). Platform üstü y = zemin + 3.5 + 0.3. */
export function buildMahfil(m: UluMosqueMaterials, k: Bucket, o: MahfilSize) {
  const { atlas } = textures(m)
  const { x: mx, z: mz, wZ, floor: Z } = o
  const PY = Z + 3.5
  // Direkler: mermer ayaklık, koyu kaide, ince gövde, profilli başlık
  const post: [number, number][] = [[0.16, 0.34], [0.13, 0.42], [0.115, 0.55], [0.1, 1.2], [0.095, 2.8], [0.11, 2.95], [0.095, 3.05], [0.17, 3.2], [0.21, 3.28]]
  for (const a of [-3.1, -1.03, 1.03, 3.1]) for (const b of [-wZ, wZ]) {
    k.add(place(match(rotateG(post, 10, [1, 1]), 'walnut'), mx + a, Z, mz + b), atlas)
    k.add(place(rotateG([[0.26, 0.04], [0.2, 0.1], [0.14, 0.34], [0, 0.34]], 8), mx + a, Z, mz + b), m.innerMarble)
    k.add(place(boxA(0.56, 0.06, 0.56, 'walnut'), mx + a, Z + 0.03, mz + b), atlas)
    // Başlık tablası
    k.add(place(boxA(0.46, 0.1, 0.46, 'walnut'), mx + a, Z + 3.32, mz + b), atlas)
  }
  // Kiriş: derin ceviz alın, altta silme
  const beam = (x: number, z: number, gn: number, d: number) => {
    k.add(place(boxA(gn, 0.44, d, 'walnut'), x, PY + 0.02, z), atlas)
    k.add(place(boxA(gn + 0.1, 0.06, d + 0.1, 'walnut'), x, PY - 0.2, z), atlas)
    k.add(place(boxA(gn + 0.14, 0.05, d + 0.14, 'walnut'), x, PY + 0.26, z), atlas)
  }
  beam(mx, mz + 2.3, 7, 0.26); beam(mx, mz - 2.3, 7, 0.26)
  beam(mx - 3.4, mz, 0.26, 4.5); beam(mx + 3.4, mz, 0.26, 4.5)
  // Döşeme: üstü ceviz, altı tahta
  k.add(place(boxA(6.8, 0.1, 4.7, 'walnut'), mx, PY + 0.2, mz), atlas)
  for (let n = 0; n < 7; n++) k.add(place(boxA(6.6, 0.05, 0.1, 'walnut'), mx, PY - 0.03, mz - 2 + (n * 4) / 6), atlas)

  // Küpeşte: dikmeler, üst ve alt kayıt, halka zincir (g85)
  const KY = PY + 0.28
  const handrail = (x0: number, z0: number, x1: number, z1: number, h0 = KY, h1 = KY) => {
    const L = Math.hypot(x1 - x0, z1 - z0, h1 - h0), Lz = Math.hypot(x1 - x0, z1 - z0)
    const ry = Math.atan2(z1 - z0, x1 - x0), slope = Math.atan2(h1 - h0, Lz)
    const placeAt = (g: THREE.BufferGeometry, u: number, v: number) => {
      g.translate(u, v, 0)
      g.rotateZ(slope)
      g.rotateY(-ry)
      g.translate(x0, h0, z0)
      return g
    }
    const R = 0.14, step = 0.19, count = Math.floor((L - 0.1) / step)
    for (let n = 0; n < count; n++) {
      k.add(placeAt(match(new THREE.TorusGeometry(R, 0.016, 3, 12), 'walnut'), 0.14 + n * step, 0.36), atlas)
    }
    k.add(placeAt(boxA(L + 0.1, 0.09, 0.14, 'walnut'), L / 2, 0.58), atlas)
    k.add(placeAt(boxA(L, 0.05, 0.08, 'walnut'), L / 2, 0.15), atlas)
    k.add(placeAt(boxA(L, 0.12, 0.1, 'walnut'), L / 2, 0.06), atlas)
    const stanchion = Math.max(1, Math.round(L / 2.2))
    for (let n = 0; n <= stanchion; n++) k.add(placeAt(boxA(0.12, 0.64, 0.14, 'walnut'), (n / stanchion) * L, 0.31), atlas)
  }
  handrail(mx - 3.4, mz + 2.35, mx + 3.4, mz + 2.35)
  handrail(mx - 3.4, mz - 2.35, mx + 1.9, mz - 2.35)
  handrail(mx - 3.4, mz - 2.35, mx - 3.4, mz + 2.35)
  handrail(mx + 3.4, mz - 2.35, mx + 3.4, mz + 2.35)

  // Merdiven: kuzeyden platforma; iki yanı deri üzeri süslemeli pano, üstünde halka korkuluk
  const STEP = 12, X = mx + 2.65, LENGTH = 4.4, LOAD = 3.56, Z0 = mz - 2.4 - LENGTH
  for (let n = 0; n < STEP; n++) {
    const y = Z + (n + 1) * (LOAD / STEP), z = Z0 + (n + 0.5) * (LENGTH / STEP)
    k.add(place(boxA(1.2, 0.06, LENGTH / STEP + 0.05, 'walnut'), X, y, z), atlas)
    k.add(place(boxA(1.2, y - Z - 0.02, 0.03, 'walnut'), X, Z + (y - Z) / 2, z + LENGTH / STEP / 2), atlas)
  }
  for (const s of [-1, 1]) {
    const xx = X + s * 0.64
    // Fotoğrafta yüksek uç solda: u aynalanır ki pano iki yandan da doğru otursun.
    k.add(triangleA([[xx, Z + 0.16, Z0 + 0.1], [xx, Z + 0.16, Z0 + LENGTH], [xx, Z + LOAD - 0.05, Z0 + LENGTH]], [[1, 0], [0, 0], [0, 1]], 'leather'), atlas)
    k.add(place(boxA(0.1, 0.16, LENGTH + 0.04, 'walnut'), xx, Z + 0.08, Z0 + LENGTH / 2), atlas)
    handrail(xx, Z0 + 0.05, xx, Z0 + LENGTH, Z + 0.12, Z + LOAD + 0.04)
    // Alttaki oymalı yan pano (g65, g84)
    const board = plaqueA(1.3, 0.56, 'boardStar').rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2)
    k.add(board.translate(X + s * 0.72, Z + 0.32, Z0 - 0.6), atlas)
    const back = plaqueA(1.3, 0.56, 'boardStar').rotateY(s > 0 ? -Math.PI / 2 : Math.PI / 2)
    k.add(back.translate(X + s * 0.7, Z + 0.32, Z0 - 0.6), atlas)
    k.add(place(boxA(0.08, 0.66, 1.4, 'walnut'), X + s * 0.71, Z + 0.33, Z0 - 0.6), atlas)
  }
  // Alt korkuluk (g85)
  for (const [a, b, c, d] of MAHFIL_LOWER_RAILING) balustrade(m, k, mx + a, mz + b, mx + c, mz + d, Z, 0.68)
}

export interface KursuSize { x: number; z: number; r: number; floor: number; entrance: number }
/** Rokoko mermer kürsü: taş kaide, boğumlu ayak, damarlı tekne, altın süslü kitabe, iki topuz (g103; envanter: H. 1231). */
export function marbleKursu(m: UluMosqueMaterials, k: Bucket, o: KursuSize) {
  const { atlas } = textures(m)
  const { x, z, floor: Z, entrance: G } = o
  const outer = PUBLIC_BUILD ? m.innerMarble : atlas
  // Damar boyu korunsun diye v, yükseklikle üçgen dalga izler; u çevreyi bir tur alır (bölge kendi içinde aynalıdır).
  const merm = <T extends THREE.BufferGeometry>(g: T) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) / 0.95) % 2
      uv.setXY(i, uv.getX(i), t < 1 ? t : 2 - t)
    }
    return match(g, 'marble')
  }
  // Taş kaide
  k.add(place(boxA(1.55, 0.52, 1.55, 'pedestal'), x, Z + 0.26, z), atlas)
  // Ayak ve teknenin altı (tam tur)
  // Ayak fotoğrafta açık renkli ve boğumludur; damar yalnız teknede belirgindir.
  const leg: [number, number][] = [[0.66, 0.52], [0.62, 0.62], [0.46, 0.68], [0.42, 0.85], [0.45, 0.95], [0.42, 1.05], [0.42, 1.28], [0.47, 1.36], [0.42, 1.44], [0.62, 1.54], [0.66, 1.62], [0.58, 1.68]]
  k.add(place(rotateG(leg, 20), x, Z, z), m.innerMarble)
  const belly: [number, number][] = [[0.58, 1.68], [0.74, 1.76], [0.94, 1.9], [1.03, 2.05], [1.07, 2.2]]
  k.add(place(merm(rotateG(belly, 28, [1, 1])), x, Z, z), outer)
  k.add(place(merm(rotateG([[1, 2.2], [0.1, 2.2]], 28, [1, 1])), x, Z, z), outer)
  // Teknenin duvarı: kuzey girişi açık
  const profile = [[1.0, 2.2], [1.0, 3.12], [1.12, 3.14], [1.13, 3.26], [0.96, 3.26], [0.96, 2.2]].map(([r, y]) => new THREE.Vector2(r, y))
  const inner = new THREE.LatheGeometry(profile, 28, Math.PI + G / 2, Math.PI * 2 - G)
  k.add(place(merm(inner), x, Z, z), outer)
  const outerP = [[1.07, 2.2], [1.11, 2.7], [1.13, 3.14]].map(([r, y]) => new THREE.Vector2(r, y))
  k.add(place(merm(new THREE.LatheGeometry(outerP, 28, Math.PI + G / 2, Math.PI * 2 - G)), x, Z, z), outer)
  // Kitabe: fotoğraftaki beyit, batıya bakar
  const kit = new THREE.CylinderGeometry(1.135, 1.115, 0.7, 12, 1, true, -Math.PI / 2 - 0.82, 1.64)
  k.add(place(match(kit, 'inscription'), x, Z + 2.72, z), atlas)
  // Altın kuşak ve topuzlar
  for (const y of [3.12]) k.add(place(new THREE.TorusGeometry(1.125, 0.016, 4, 28, Math.PI * 2 - G).rotateZ(-Math.PI / 2 + G / 2).rotateX(Math.PI / 2), x, Z + y, z), m.goldDark)
  for (const a of [-Math.PI / 2 - 0.9, -Math.PI / 2 + 0.9, Math.PI / 2 + 0.3, Math.PI / 2 - 0.3]) {
    k.add(place(rotateG([[0.05, 0], [0.09, 0.05], [0.1, 0.12], [0.03, 0.22], [0, 0.26]], 8), x + Math.sin(a) * 1.03, Z + 3.26, z + Math.cos(a) * 1.03), m.innerMarble)
  }
}

/** Mihrabın yanındaki ahşap vaaz kürsüsü (envanter; biçim g92): sekiz köşe gövde, eğik rahle, yüksek arkalık. */
export const WOOD_KURSU = { x: 5.6, z: 23.75 }
export function woodKursu(m: UluMosqueMaterials, k: Bucket, floor: number) {
  const { atlas, kund } = textures(m)
  const { x, z } = WOOD_KURSU
  const R = 0.82, H = 1.15
  for (let n = 0; n < 8; n++) {
    const a = ((n + 0.5) / 8) * Math.PI * 2, d = R * Math.cos(Math.PI / 8), g = 2 * R * Math.sin(Math.PI / 8)
    k.add(place(plaqueA(g, H - 0.24, 'boardStar').translate(0, floor + 0.12 + (H - 0.24) / 2, d + 0.005), x, 0, z, a), atlas)
  }
  k.add(place(flatShadow(cylinderG(R, R, H, 8).rotateY(Math.PI / 8)), x, floor + H / 2, z), m.wood)
  k.add(place(flatShadow(cylinderG(R + 0.07, R + 0.07, 0.1, 8).rotateY(Math.PI / 8)), x, floor + H + 0.05, z), m.walnut)
  k.add(place(flatShadow(cylinderG(R + 0.05, R + 0.05, 0.12, 8).rotateY(Math.PI / 8)), x, floor + 0.06, z), m.walnut)
  // Rahle ve arkalık
  k.add(place(boxA(0.8, 0.05, 0.5, 'walnut').rotateX(-0.35), x, floor + H + 0.32, z - 0.5), atlas)
  k.add(place(boxG(0.9, 2.7, 0.14).translate(0, floor + 1.35, 0), x, 0, z + 0.9), kund)
  const crown = new THREE.Shape()
  crown.moveTo(-0.45, 0); crown.quadraticCurveTo(-0.32, 0.34, 0, 0.62); crown.quadraticCurveTo(0.32, 0.34, 0.45, 0); crown.closePath()
  k.add(place(subtract(crown, 0.14, -0.07), x, floor + 2.7, z + 0.9), kund)
}

/** Paye dibindeki kavsaralı ahşap dolap (g89): önü fotoğraf, gövdesi ceviz. `ry` yönünde, payenin 1.5 m dışında. */
export function buildCabinet(m: UluMosqueMaterials, k: Bucket, x: number, z: number, ry: number, floor: number) {
  const { atlas } = textures(m)
  const G = 1.8, H = 2.3, D = 0.42
  const halfway: [number, number][] = [[0, 0.6], [0.05, 0.7], [0.17, 0.8], [0.33, 0.88], [0.44, 0.95], [0.5, 1]]
  const s = new THREE.Shape()
  s.moveTo(-G / 2, 0)
  for (const [u, v] of halfway) s.lineTo((u - 0.5) * G, v * H)
  for (const [u, v] of [...halfway].reverse().slice(1)) s.lineTo((0.5 - u) * G, v * H)
  s.lineTo(G / 2, 0)
  s.closePath()
  const on = match(uvFit(new THREE.ShapeGeometry(s)), 'cabinet')
  k.add(place(on.translate(0, floor + 0.02, 1.5 + D + 0.002), x, 0, z, ry), atlas)
  const body = subtract(s, D, 1.5)
  match(uvFit(body), 'cabinetSide')
  k.add(place(body.translate(0, floor + 0.02, 0), x, 0, z, ry), atlas)
}

/** Sandık: ceviz gövde, önde oymalı pano. */
export function buildChest(m: UluMosqueMaterials, k: Bucket, x: number, z: number, frontDir: number, floor: number) {
  const { atlas } = textures(m)
  k.add(place(boxA(0.8, 0.85, 0.52, 'cabinetSide'), x, floor + 0.53, z), atlas)
  k.add(place(boxA(0.86, 0.06, 0.58, 'walnut'), x, floor + 0.98, z), atlas)
  k.add(place(plaqueA(0.7, 0.42, 'boardStar').rotateY(frontDir > 0 ? 0 : Math.PI), x, floor + 0.55, z + frontDir * 0.262), atlas)
}

/** Rahle: ortadan geçme, X biçiminde iki ceviz kanat (temsilî). */
export function buildLectern(m: UluMosqueMaterials, k: Bucket, x: number, z: number, floor: number) {
  const { atlas } = textures(m)
  for (const s of [-1, 1]) {
    k.add(place(boxA(0.5, 0.86, 0.03, 'cabinetSide').rotateX(s * 0.72), x, floor + 0.34, z), atlas)
    k.add(place(plaqueA(0.4, 0.3, 'boardStar').translate(0, 0.25, 0.02).rotateX(s > 0 ? 0.72 : -0.72), x, floor + 0.34, z), atlas)
  }
}
