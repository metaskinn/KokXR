// Ulu Camii maketi: payeler, sivri kemerler ve doğu/batı duvarlarının hat levhaları.
// Pano yazıları, tepelik, kemer bandı ve levhalar arşiv fotoğraflarından gelir (scripts/ulucami_paye_atlas.py);
// kod yazı üretmez. Hangi panonun hangi yüzde, levhanın hangi duvarda durduğu temsilîdir.
// Paye ve kemer anatomisi fotoğraflardan: sıvalı etek, koyu-altın çizgiler, üstte tepelikli pano,
// iki kademeli başlık, kemer alnında bitkisel bant, kemer altında çerçeve çizgisi (ERD05027, ERD05161, 0288, 0334).
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../data/openPublication'
import type { UluMosqueMaterials } from '../uluMosqueTextures'
import {
  WALL, H, Bucket, type Mat, LINE, COLUMN, YX, YZ, flatShadow, boxG, px, pz, cylinderG, place,
} from '../uluMosquePiece'
import { lightDevice } from '../uluMosqueFloor'

const ATLAS = 2048
const CELL_G = 512 / ATLAS, CELL_Y = 1000 / ATLAS, BOARD_COUNT = 8
const BAND_H = 128 / ATLAS, STROKE_V0 = 128 / ATLAS, STROKE_V1 = 168 / ATLAS
/** Düz boya örnekleri: paye atlasının alt şeridi. */
const PAINT = { plaster: 0.125, dark: 0.375, gold: 0.625 }

const FLOOR = 0.7, BOARD_G = 2.33, BOARD_BOTTOM = 3.26, BODY_TOP = 7.18, BOARD_TOP = 6.98, SKIRT = 1.28
const ARCH_BOTTOM = 7.4, ARCH_TOP = 12.3, ARCH_CHECK = 10.2, BAND_W = 0.62, TITLE_TOP = 7.98

interface Mats { pier: Mat; band: Mat; stroke: Mat; plaque: Mat; open: boolean }

const cache = new WeakMap<UluMosqueMaterials, Mats>()

function mats(m: UluMosqueMaterials): Mats {
  const var_ = cache.get(m)
  if (var_) return var_
  let result: Mats
  if (PUBLIC_BUILD) {
    result = {
      pier: new THREE.MeshStandardMaterial({ color: '#f1e8d6', roughness: 0.82, vertexColors: true }),
      band: m.archBand, stroke: m.dark,
      plaque: new THREE.MeshStandardMaterial({ color: '#2c2620', roughness: 0.6 }),
      open: true,
    }
  } else {
    const loader = new THREE.TextureLoader()
    const last = lightDevice() ? '-k' : ''
    const texture = (ad: string) => {
      const t = loader.load(`/images/ulu-mosque/model/${ad}${last}.jpg`)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      return t
    }
    const plaqueT = texture('plaque-atlas')
    plaqueT.wrapS = THREE.RepeatWrapping
    const plaque = new THREE.MeshStandardMaterial({ map: plaqueT, roughness: 0.7 })
    result = {
      pier: new THREE.MeshStandardMaterial({ map: texture('pier-atlas'), roughness: 0.82, vertexColors: true }),
      band: plaque, stroke: plaque, plaque, open: false,
    }
  }
  cache.set(m, result)
  return result
}

/** Yüksekliğe göre temas gölgesi: yerde ve başlık altında koyulaşır. Doku yerine köşe rengi: dikiş olmaz. */
function shadow(y: number) {
  if (y < 1.5) return THREE.MathUtils.lerp(0.72, 0.98, THREE.MathUtils.smoothstep(y, FLOOR, 1.5))
  if (y > 6.4) return THREE.MathUtils.lerp(1, 0.84, THREE.MathUtils.smoothstep(y, 6.4, BODY_TOP))
  return 1
}

const AO_ORDER = [FLOOR, 0.9, 1.1, 1.3, 1.5, 6.4, 6.7, 7, BODY_TOP]

/**
 * +z'ye bakan dikdörtgen (x0-x1, y0-y1), z yüzünde. Yükseklik AO sırasına bölünür.
 * uv: (u0, v0) sol alt, (u1, v1) sağ üst. renk: payeye özgü köşe rengi eklensin mi.
 */
function face(x0: number, x1: number, y0: number, y1: number, z: number, u0: number, u1: number, v0: number, v1: number, color: boolean) {
  const ys = [y0, ...AO_ORDER.filter((a) => a > y0 && a < y1), y1]
  const position: number[] = [], nor: number[] = [], uv: number[] = [], kr: number[] = []
  const add = (x: number, y: number) => {
    position.push(x, y, z); nor.push(0, 0, 1)
    uv.push(u0 + ((x - x0) / (x1 - x0)) * (u1 - u0), v0 + ((y - y0) / (y1 - y0)) * (v1 - v0))
    const a = shadow(y)
    kr.push(a, a, a)
  }
  for (let n = 0; n < ys.length - 1; n++) {
    const a = ys[n], b = ys[n + 1]
    add(x0, a); add(x1, a); add(x1, b)
    add(x0, a); add(x1, b); add(x0, b)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  if (color) g.setAttribute('color', new THREE.Float32BufferAttribute(kr, 3))
  return g
}

const pillar = (r: number, r2: number, h: number, y: number) => flatShadow(cylinderG(r2 * Math.SQRT2, r * Math.SQRT2, h, 4).rotateY(Math.PI / 4)).translate(0, y + h / 2, 0)

/** İki kademeli başlık, paye merkezine göre (x,z). Fotoğraflarda: boyun, eğimli geçiş, geniş tabla, pah. */
function title(k: Bucket, m: UluMosqueMaterials, x: number, z: number) {
  k.add(place(pillar(1.53, 1.53, 0.13, BODY_TOP), x, 0, z), m.inner)
  k.add(place(pillar(1.53, 1.74, 0.24, BODY_TOP + 0.13), x, 0, z), m.inner)
  k.add(place(pillar(1.74, 1.74, 0.36, BODY_TOP + 0.37), x, 0, z), m.inner)
  k.add(place(pillar(1.74, 1.66, 0.07, BODY_TOP + 0.73), x, 0, z), m.inner)
}

export function setupPiers(m: UluMosqueMaterials, k: Bucket) {
  const g = mats(m)
  const paint = (u: number) => [u, u, 0.012, 0.012] as const
  for (let i = 1; i < COLUMN; i++) for (let j = 1; j < LINE; j++) {
    const x = px(i), z = pz(j)
    for (let f = 0; f < 4; f++) {
      const a = f * Math.PI / 2
      const ext = (x0: number, x1: number, y0: number, y1: number, ofs: number, u: readonly number[]) =>
        k.add(place(face(x0, x1, y0, y1, 1.5 + ofs, u[0], u[1], u[2], u[3], true), x, 0, z, a), g.pier)
      // Sıva gövde (yerden başlık altına)
      ext(-1.5, 1.5, FLOOR, BODY_TOP, 0, paint(PAINT.plaster))
      if (g.open) continue
      // Yan çizgiler, etek çizgisi, başlık altı çizgi: koyu ve ince altın (ERD05027)
      for (const s of [-1, 1]) {
        const d0 = s * 1.2, d1 = s * 1.32
        ext(Math.min(d0, d1), Math.max(d0, d1), SKIRT, BODY_TOP - 0.2, 0.003, paint(PAINT.dark))
        const a0 = s * 1.345, a1 = s * 1.37
        ext(Math.min(a0, a1), Math.max(a0, a1), SKIRT, BODY_TOP - 0.2, 0.003, paint(PAINT.gold))
      }
      ext(-1.37, 1.37, SKIRT, SKIRT + 0.1, 0.004, paint(PAINT.dark))
      ext(-1.37, 1.37, SKIRT + 0.125, SKIRT + 0.15, 0.004, paint(PAINT.gold))
      ext(-1.5, 1.5, BODY_TOP - 0.14, BODY_TOP - 0.05, 0.004, paint(PAINT.dark))
      ext(-1.5, 1.5, BODY_TOP - 0.19, BODY_TOP - 0.165, 0.004, paint(PAINT.gold))
      // Pano: atlastan. Sıra, komşu yüzlerde aynı yazı gelmeyecek biçimde.
      const n = (i * 3 + j * 5 + f * 3) % BOARD_COUNT
      const u0 = (n % 4) * CELL_G, v1 = 1 - Math.floor(n / 4) * CELL_Y
      ext(-BOARD_G / 2, BOARD_G / 2, BOARD_BOTTOM, BOARD_TOP, 0.002, [u0, u0 + CELL_G, v1 - CELL_Y, v1])
    }
    title(k, m, x, z)
    // Başlığın üstünde paye kalkmaz: kemer duvarları haç biçiminde birleşir, araları kubbeye geçer.
    const uy = (H + TITLE_TOP - 0.3) / 2, uh = H - TITLE_TOP + 0.3
    k.add(place(boxG(2, uh, 3), x, uy, z), m.inner)
    k.add(place(boxG(3, uh, 2), x, uy, z), m.inner)
  }
  // Duvara oturan kemer ayakları: başlık yarısı. Kıble ortasındaki iki ayak madalyonlara değmesin diye yok.
  const wallCap = (x: number, z: number, ry: number) => {
    const ext = (geo: THREE.BufferGeometry) => k.add(place(geo, x, 0, z, ry), m.inner)
    ext(boxG(3.06, 0.13, 0.08).translate(0, BODY_TOP + 0.065, 0.04))
    ext(boxG(3.3, 0.24, 0.2).translate(0, BODY_TOP + 0.25, 0.1))
    ext(boxG(3.48, 0.43, 0.3).translate(0, BODY_TOP + 0.585, 0.15))
  }
  for (let j = 1; j < LINE; j++) for (const s of [-1, 1]) wallCap(s * (YX - WALL), pz(j), s > 0 ? -Math.PI / 2 : Math.PI / 2)
  for (let i = 1; i < COLUMN; i++) {
    wallCap(px(i), -YZ + WALL, 0)
    if (i !== 2 && i !== 3) wallCap(px(i), YZ - WALL, Math.PI)
  }
}

/** Kemer eğrisi: sol ayaktan tepeye (t 0-1) ikinci derece Bezier. */
function curvePoint(o: number, t: number, right: boolean) {
  const a = 1 - t
  const nx = a * a * -o + 2 * a * t * -o + 0
  const ny = a * a * ARCH_BOTTOM + 2 * a * t * ARCH_CHECK + t * t * ARCH_TOP
  const tx = 2 * a * 0 + 2 * t * o, ty = 2 * a * (ARCH_CHECK - ARCH_BOTTOM) + 2 * t * (ARCH_TOP - ARCH_CHECK)
  const L = Math.hypot(tx, ty) || 1
  // İç normal (kemer merkezine doğru) ve dış normal aynı doğruda
  const icx = ty / L, icy = -tx / L
  return right ? { x: -nx, y: ny, tx: tx / L, ty: ty / L, icx: -icx, icy } : { x: nx, y: ny, tx: tx / L, ty: ty / L, icx, icy }
}

function emptyGeo(position: number[], nor: number[], uv: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

const STEP = 24

/** Kemer alnında bant: iç kenardan dışa BANT_EN genişlikte şerit. Fotoğraftaki boya, u boyuna tekrar eder. */
function bandG(o: number, z: number, frontFace: boolean, open: boolean) {
  const position: number[] = [], nor: number[] = [], uv: number[] = []
  const repeat = BAND_W * 16 // atlas şeridinin boyu (metre): 2048x128
  const nz = frontFace ? 1 : -1
  for (const right of [false, true]) {
    let s = 0
    for (let n = 0; n < STEP; n++) {
      const a = curvePoint(o, n / STEP, right), b = curvePoint(o, (n + 1) / STEP, right)
      const uz = Math.hypot(b.x - a.x, b.y - a.y)
      const u0 = s / repeat, u1 = (s + uz) / repeat
      s += uz
      const [v0, v1] = open ? [0, BAND_W] : [1 - BAND_H + 0.001, 1 - 0.001]
      const dA = { x: a.x - a.icx * BAND_W, y: a.y - a.icy * BAND_W }, dB = { x: b.x - b.icx * BAND_W, y: b.y - b.icy * BAND_W }
      const inner0 = [a.x, a.y, z], inner1 = [b.x, b.y, z], d0 = [dA.x, dA.y, z], d1 = [dB.x, dB.y, z]
      const uv0 = [u0, v0], uv1 = [u1, v0], uv2 = [u1, v1], uv3 = [u0, v1]
      // Sol yarıda yol saat yönünde; sağ yarıda ters. Sarım normal yönüyle uyumlu olmalı.
      const flat = right ? frontFace : !frontFace
      const array = flat ? [inner0, d0, d1, inner0, d1, inner1] : [inner0, d1, d0, inner0, inner1, d1]
      const uvd = flat ? [uv0, uv3, uv2, uv0, uv2, uv1] : [uv0, uv2, uv3, uv0, uv1, uv2]
      for (let q = 0; q < 6; q++) { position.push(...array[q]); nor.push(0, 0, nz); uv.push(...uvd[q]) }
    }
  }
  return emptyGeo(position, nor, uv)
}

/** Kemer altı çerçeve çizgisi: iki kenar boyunca şerit, ayakta enine çizgiyle kapanır. */
function archBottomG(o: number, open: boolean) {
  const position: number[] = [], nor: number[] = [], uv: number[] = []
  const Z0 = 0.74, Z1 = 0.9, OFS = 0.012
  // Başlığın üstünden başla
  let t0 = 0
  while (curvePoint(o, t0, false).y < TITLE_TOP + 0.06 && t0 < 0.5) t0 += 0.005
  const [v0, v1] = open ? [0, 1] : [1 - STROKE_V1, 1 - STROKE_V0]
  const corner = (a: ReturnType<typeof curvePoint>, z: number, u: number, v: number) => {
    position.push(a.x + a.icx * OFS, a.y + a.icy * OFS, z)
    nor.push(a.icx, a.icy, 0)
    uv.push(u, v)
  }
  for (const right of [false, true]) {
    for (const s of [-1, 1]) {
      const zi = s * Z0, zd = s * Z1
      for (let n = 0; n < STEP; n++) {
        const a = curvePoint(o, t0 + ((1 - t0) * n) / STEP, right), b = curvePoint(o, t0 + ((1 - t0) * (n + 1)) / STEP, right)
        const u0 = n * 0.1, u1 = (n + 1) * 0.1
        // Normal aşağıya: sarım kemerin yarısına ve z yanına göre değişir
        const inverse = (s > 0) !== right
        if (inverse) {
          corner(a, zi, u0, v0); corner(b, zi, u1, v0); corner(b, zd, u1, v1)
          corner(a, zi, u0, v0); corner(b, zd, u1, v1); corner(a, zd, u0, v1)
        } else {
          corner(a, zi, u0, v0); corner(b, zd, u1, v1); corner(b, zi, u1, v0)
          corner(a, zi, u0, v0); corner(a, zd, u0, v1); corner(b, zd, u1, v1)
        }
      }
    }
    // Ayakta enine çizgi
    const a = curvePoint(o, t0, right), b = curvePoint(o, t0 + 0.035, right)
    const inverse = right
    if (inverse) {
      corner(a, -Z1, 0, v0); corner(a, Z1, 1, v0); corner(b, Z1, 1, v1)
      corner(a, -Z1, 0, v0); corner(b, Z1, 1, v1); corner(b, -Z1, 0, v1)
    } else {
      corner(a, -Z1, 0, v0); corner(b, Z1, 1, v1); corner(a, Z1, 1, v0)
      corner(a, -Z1, 0, v0); corner(b, -Z1, 0, v1); corner(b, Z1, 1, v1)
    }
  }
  return emptyGeo(position, nor, uv)
}

/** Kemer dolgusu: ExtrudeGeometry, eğri daha sık bölünür. */
function infillG(o: number) {
  const s = new THREE.Shape()
  s.moveTo(-o, ARCH_BOTTOM)
  s.quadraticCurveTo(-o, ARCH_CHECK, 0, ARCH_TOP)
  s.quadraticCurveTo(o, ARCH_CHECK, o, ARCH_BOTTOM)
  s.lineTo(o, H); s.lineTo(-o, H); s.closePath()
  return new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: false, curveSegments: STEP }).translate(0, 0, -1)
}

export function setupArches(m: UluMosqueMaterials, k: Bucket) {
  const g = mats(m)
  const arch = (a: number, b: number, fixed: number, alongX: boolean) => {
    const o = (b - a) / 2, mid = (a + b) / 2
    const ry = alongX ? 0 : Math.PI / 2
    const [x, z] = alongX ? [mid, fixed] : [fixed, mid]
    k.add(place(infillG(o), x, 0, z, ry), m.inner)
    k.add(place(bandG(o, 1.006, true, g.open), x, 0, z, ry), g.band)
    k.add(place(bandG(o, -1.006, false, g.open), x, 0, z, ry), g.band)
    k.add(place(archBottomG(o, g.open), x, 0, z, ry), g.stroke)
  }
  for (let j = 1; j < LINE; j++) for (let i = 0; i < COLUMN; i++)
    arch(i === 0 ? -YX + WALL : px(i) + 1.5, i === COLUMN - 1 ? YX - WALL : px(i + 1) - 1.5, pz(j), true)
  for (let i = 1; i < COLUMN; i++) for (let j = 0; j < LINE; j++)
    arch(j === 0 ? -YZ + WALL : pz(j) + 1.5, j === LINE - 1 ? YZ - WALL : pz(j + 1) - 1.5, px(i), false)
}

/** Atlastaki levha dikdörtgenleri (piksel, scripts/ulucami_paye_atlas.py çıktısı). */
const PLAQUE = {
  galib: [0, 190, 1400, 559],
  zikr: [93, 800, 1213, 450],
  hasm: [15, 1260, 1370, 500],
  victory: [1410, 178, 638, 414],
  quran: [1410, 662, 638, 505],
}

/** Eğik asılı hat levhası (ic-mekan-uzun.jpg'deki gibi üstü öne yatık). +z odaya bakar; x,y,z duvar yüzü. */
function plaqueAs(k: Bucket, m: UluMosqueMaterials, l: Mats, r: readonly number[], g: number, h: number, x: number, y: number, z: number, ry: number) {
  const SLOPE = 0.1
  const add = (geo: THREE.BufferGeometry, mat: Mat) => {
    geo.rotateX(SLOPE)
    // Eğik çerçevenin üst arka köşesi de sıvanın önünde kalır.
    geo.translate(0, y, ((h + 0.14) / 2) * Math.sin(SLOPE) + 0.09 * Math.cos(SLOPE) + 0.035)
    k.add(place(geo, x, 0, z, ry), mat)
  }
  add(boxG(g + 0.14, h + 0.14, 0.09).translate(0, 0, -0.045), m.walnut)
  const surface = new THREE.PlaneGeometry(g, h)
  if (!l.open) {
    const uv = surface.attributes.uv
    for (let n = 0; n < uv.count; n++) {
      uv.setXY(n, (r[0] + uv.getX(n) * r[2]) / ATLAS, 1 - (r[1] + (1 - uv.getY(n)) * r[3]) / ATLAS)
    }
  }
  add(surface.translate(0, 0, 0.004), l.plaque)
  // Askı zincirleri
  for (const s of [-1, 1]) {
    const length = 0.42
    k.add(place(cylinderG(0.012, 0.012, length, 5).rotateX(-0.42).translate(s * g * 0.36, y + (h / 2) * Math.cos(SLOPE) + length * 0.42, (h / 2) * Math.sin(SLOPE) * 1.2), x, 0, z, ry), m.bronze)
  }
}

/** Doğu ve batı duvarı levhaları: üst pencerelerin altında, alt nişlerin üstünde (0288). Duvar seçimi temsilî. */
export function eastWestPlaques(m: UluMosqueMaterials, k: Bucket) {
  const l = mats(m)
  const east = YX - WALL - 0.02, west = -YX + WALL + 0.02
  const Y = 5.75
  const proportional = (r: readonly number[], g: number) => g * (r[3] / r[2])
  const settle: [readonly number[], number, number, number, number][] = [
    // Çerçeveler, iki pencere tepeliği arasındaki yaklaşık 4.35 m boşluğa sığar.
    [PLAQUE.galib, 3.8, east, pz(2.5), -Math.PI / 2],
    [PLAQUE.hasm, 3.8, east, pz(3.5), -Math.PI / 2],
    [PLAQUE.zikr, 3.8, west, pz(2.5), Math.PI / 2],
    [PLAQUE.quran, 2.4, west, pz(3.5), Math.PI / 2],
    [PLAQUE.victory, 2.8, west, pz(0.5), Math.PI / 2],
  ]
  for (const [r, g, x, z, ry] of settle) plaqueAs(k, m, l, r, g, proportional(r, g), x, Y, z, ry)
}
