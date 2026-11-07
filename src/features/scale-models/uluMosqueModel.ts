// Ulu Camii temsili maketi. Plan ölçüleri ile kubbe ve paye düzeni envanterden (s. 44, 46, 60, 63);
// cephe, kasnak, kubbe, minare ve taç kapı biçimleri arşiv fotoğraflarına bakılarak yorumlanmıştır.
// Yükseklikler ve pencere sayıları temsilidir. Birim: metre. Kuzey = -z, kıble (güney) = +z, doğu = +x.
import * as THREE from 'three'
import { innerWindowBottom, innerWindowTop } from './ulu-mosque/inner-wall'
import { uluMosqueSurroundings } from './ulu-mosque/surroundings'
import { interiorFloor } from './ulu-mosque/floor'
import { fitToAtlas, facadeArch, doorsMaterials, archSlices, kiosk, strip, crownDoor } from './ulu-mosque/doors'
import { uluMosqueDetails } from './uluMosqueDetail'
import { uluMosqueMaterials } from './uluMosqueTextures'
import { uluLightMaterials } from './ulu-mosque/light'
import { leadPedestalG, addLeadDome, minaretTop } from './ulu-mosque/domes'
import { interiorStops, interiorWalkArea, uluMosqueInterior, type InteriorStop, type InteriorWalk } from './uluMosqueInterior'
import {
  EAST_WEST, PAVING_Y, WALL, SKIRT_Y, BAY_X, BAY_Z, H, DRUM_BASE, NORTH_SOUTH, Bucket, type Mat, OCTA,
  FOUNTAIN_ROW, FOUNTAIN_COLUMN, LINE, COLUMN, YX, YZ,
  subtract, rect, flatShadow, bayOpening, baySize, arch, boxG, px, pz, cylinderG, place,
} from './uluMosquePiece'

export interface ModelLayer { group: THREE.Group; height: number; ad: string }
export interface Model {
  root: THREE.Group; layers: ModelLayer[]; stops: InteriorStop[]; walking: InteriorWalk
  /** Verilmezse Ulu Camii ölçüsüne göre varsayılanlar kullanılır. */
  camera?: { position: [number, number, number]; target: [number, number, number] }
  pedestalRadius?: number
  innerLights?: [number, number, number][]
}

export function uluMosqueModel(): Model {
  const m = uluMosqueMaterials()
  uluLightMaterials(m)
  const K = doorsMaterials(m)

  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()
  const box = (g: number, h: number, dd: number, mat: Mat, x: number, y: number, z: number, kv = k) =>
    kv.add(place(boxG(g, h, dd), x, y, z), mat)

  // --- Zemin: çevre ayrı modülde; bina tabanı ve halı burada ---
  const surroundings = uluMosqueSurroundings(m, k)
  box(EAST_WEST + 1, 0.6, NORTH_SOUTH + 1, m.marble, 0, 0.3, 0)
  interiorFloor(k, m)

  // --- Cephe: üç katman (dış taş + kemerli nişler, gövde, iç sıva) ve kafesli pencereler ---
  const facade = (L: number, x: number, z: number, ry: number, noMid: 'all' | 'alt' | 'none', eye: number, count: number, noBottom = false) => {
    const arch = facadeArch
    const outer = rect(-L / 2, 0, L / 2, H), body = rect(-L / 2, 0, L / 2, H), inner = rect(-L / 2, 0, L / 2, H)
    const windows: THREE.BufferGeometry[] = []
    const first = -((count - 1) / 2) * eye
    for (let i = 0; i < count; i++) {
      const mid = i === (count - 1) / 2
      if (mid && noMid === 'all') continue
      // Kıble duvarının ortasında pencereler mihrabın üstünde ve yeşil levhanın iki yanındadır (fotoğraflara göre).
      const qiblaMid = mid && noBottom
      for (const f of qiblaMid ? [-0.2, 0.2] : [-0.25, 0.25]) {
        const px = first + i * eye + f * eye
        const py = qiblaMid ? 1.8 : 0, flatD = qiblaMid ? 2.6 : 3.1, flatP = qiblaMid ? 2.2 : 2.3
        outer.holes.push(arch(new THREE.Path(), px, 6.5 + py, 3.8, flatD, 1.9))
        body.holes.push(arch(new THREE.Path(), px, 7.2 + py, 2.2, flatP, 1.3))
        inner.holes.push(innerWindowTop(k, m, px, py, qiblaMid, x, z, ry))
        const window = () => new THREE.ShapeGeometry(arch(new THREE.Shape(), px, 7.2 + py, 2.2, flatP, 1.3), 12)
        k.add(place(fitToAtlas(window(), 'top').translate(0, 0, -1.1), x, 0, z, ry), K.atlas)
        archRingOf(px, 6.5 + py, 4.4, flatD, qiblaMid ? 2.1 : 2.3, 3.8, 1.9, x, z, ry)
        k.add(place(boxG(2.5, 0.1, 0.7).translate(px, 7.13 + py, -0.34), x, 0, z, ry), K.facadeStone)
        if (noBottom || (mid && noMid === 'alt')) continue
        outer.holes.push(arch(new THREE.Path(), px, 1.5, 2.8, 1.9, 1.1))
        body.holes.push(rect(px - 0.8, 2, px + 0.8, 4.1) as unknown as THREE.Path)
        inner.holes.push(innerWindowBottom(k, m, px, x, z, ry))
        windows.push(new THREE.ShapeGeometry(rect(px - 0.8, 2, px + 0.8, 4.1)).translate(0, 0, -1.1))
        archRingOf(px, 1.5, 3.3, 1.9, 1.4, 2.8, 1.1, x, z, ry)
        k.add(place(boxG(2.1, 0.12, 0.7).translate(px, 1.96, -0.3), x, 0, z, ry), m.innerMarble)
        for (const s of [-1, 1]) k.add(place(boxG(0.14, 2.2, 0.66).translate(px + s * 0.87, 3.05, -0.33), x, 0, z, ry), m.innerMarble)
        k.add(place(boxG(1.88, 0.16, 0.66).translate(px, 4.19, -0.33), x, 0, z, ry), m.innerMarble)
        // Pencere üstü alınlık taştır, kafes değil (fotoğraflara göre).
        k.add(place(new THREE.ShapeGeometry(arch(new THREE.Shape(), px, 4.3, 1.1, 0.05, 0.6), 8).translate(0, 0, -0.45), x, 0, z, ry), K.facadeStone)
      }
    }
    k.add(place(subtract(outer, 0.65, -0.65), x, 0, z, ry), K.facadeStone)
    k.add(place(subtract(body, 1.15, -1.8), x, 0, z, ry), K.facadeStone)
    k.add(place(subtract(inner, 0.2, -2), x, 0, z, ry), m.innerWall)
    windows.forEach((p) => {
      k.add(place(p.clone().translate(0, 0, -0.72), x, 0, z, ry), m.glassCage)
      k.add(place(fitToAtlas(p, 'alt'), x, 0, z, ry), K.atlas)
    })
    // Kaide, ara silme ve saçak silmesi
    strip((g) => k.add(place(g, x, 0, z, ry), K.atlas), 'pedestal', L + 0.3, 0, 1.3, 0.25)
    box2(L + 0.3, 0.2, 0.14, x, 6.05, z, ry, K.facadeStone)
    strip((g) => k.add(place(g, x, 0, z, ry), K.atlas), 'eave', L + 1, H - 0.7, 1, 0.7)
  }
  /** Kemeri çeviren, duvardan hafif çıkıntılı taş dilimler (fotoğraflardaki gibi). */
  const archRingOf = (cx: number, y0: number, gOuter: number, flat: number, kOuter: number, gInner: number, kInner: number, x: number, z: number, ry: number) =>
    archSlices((g) => k.add(place(g, x, 0, z, ry), K.facadeStone), cx, y0, gOuter, flat, kOuter, gInner, kInner)
  const box2 = (g: number, h: number, dd: number, x: number, y: number, z: number, ry: number, mat: Mat) => {
    const b = boxG(g, h, dd).translate(0, y, dd / 2 - 0.05)
    k.add(place(b, x, 0, z, ry), mat)
  }
  facade(EAST_WEST, 0, -YZ, Math.PI, 'all', BAY_X, COLUMN)
  // Güney duvarının alt sıra pencereleri sonradan kapatılmıştır (Kültür Portalı).
  facade(EAST_WEST, 0, YZ, 0, 'alt', BAY_X, COLUMN, true)
  facade(NORTH_SOUTH - WALL * 2, YX, 0, Math.PI / 2, 'none', BAY_Z, LINE)
  facade(NORTH_SOUTH - WALL * 2, -YX, 0, -Math.PI / 2, 'none', BAY_Z, LINE)

  // --- Taç kapı (kuzey cephesi): ulucami/kapilar.ts ---
  crownDoor(k, m, K, YZ)

  // --- İç mekân: ayrı modülde ---
  uluMosqueInterior(m, k, kRoof, kDrum, kDome)
  uluMosqueDetails(m, k)

  // --- Çatı: kurşun döşeme ve etekler, her gözde dört yana eğimli kurşun kaide ---
  const YO = YX - 0.5, ZO = YZ - 0.5
  const paving = rect(-YO, -ZO, YO, ZO)
  // Her gözün üstü açık: döşeme yalnız kemerlerin üzerinde kalır, içeriden kubbeler görünür.
  for (let i = 0; i < COLUMN; i++) for (let j = 0; j < LINE; j++) {
    const { x0, x1, z0, z1 } = bayOpening(i, j)
    paving.holes.push(rect(x0, -z1, x1, -z0) as unknown as THREE.Path)
  }
  kRoof.add(new THREE.ShapeGeometry(paving, 24).rotateX(-Math.PI / 2).translate(0, PAVING_Y, 0), m.lead)
  const SA = 1.5, bottomY = H + 0.35
  const skirt = (x0: number, z0: number, x1: number, z1: number, x2: number, z2: number, x3: number, z3: number) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, bottomY, z0, x1, bottomY, z1, x2, PAVING_Y, z2, x0, bottomY, z0, x2, PAVING_Y, z2, x3, PAVING_Y, z3], 3))
    const L = Math.hypot(x1 - x0, z1 - z0)
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L - 2, 2, 0, 0, L - 2, 2, 2, 2], 2))
    g.computeVertexNormals()
    kRoof.add(g, m.lead)
  }
  const ox = YX + SA, oz = YZ + SA
  skirt(-ox, oz, ox, oz, YO, ZO, -YO, ZO)
  skirt(ox, -oz, -ox, -oz, -YO, -ZO, YO, -ZO)
  skirt(ox, oz, ox, -oz, YO, -ZO, YO, ZO)
  skirt(-ox, -oz, -ox, oz, -YO, ZO, -YO, -ZO)
  for (const s of [-1, 1]) {
    box(EAST_WEST + SA * 2 + 0.2, 0.3, 0.3, m.dark, 0, bottomY - 0.05, s * oz, kRoof)
    box(0.3, 0.3, NORTH_SOUTH + SA * 2 + 0.2, m.dark, s * ox, bottomY - 0.05, 0, kRoof)
  }

  // --- Yirmi göz: kaide, sekizgen sarı kasnak + kafesli pencereler, kaburgalı kurşun kubbe ---
  for (let i = 0; i < COLUMN; i++) for (let j = 0; j < LINE; j++) {
    const x = px(i + 0.5), z = pz(j + 0.5)
    const open = i === FOUNTAIN_COLUMN && j === FOUNTAIN_ROW
    const { drumH, domeH } = baySize(i)

    const pedestal = leadPedestalG(7.9, 9.6, SKIRT_Y)
    kRoof.add(place(pedestal, x, PAVING_Y + SKIRT_Y / 2, z), m.lead)
    const ring = rect(-5.65, -5.65, 5.65, 5.65)
    ring.holes.push(new THREE.Path().absarc(0, 0, 5.4, 0, Math.PI * 2, true))
    kRoof.add(new THREE.ShapeGeometry(ring, 24).rotateX(-Math.PI / 2).translate(x, DRUM_BASE, z), m.lead)

    const R = 6
    const drum = flatShadow(cylinderG(R, R, drumH, 8, true).rotateY(Math.PI / 8))
    kDrum.add(place(drum, x, DRUM_BASE + drumH / 2, z), m.plaster)
    kDrum.add(place(flatShadow(cylinderG(R + 0.12, R + 0.12, 0.28, 8, true).rotateY(Math.PI / 8)), x, DRUM_BASE + 0.14, z), m.dark)
    kDrum.add(place(flatShadow(cylinderG(R + 0.28, R + 0.1, 0.26, 8, true).rotateY(Math.PI / 8)), x, DRUM_BASE + drumH - 0.13, z), m.cream)
    for (let n = 0; n < 8; n++) {
      const pilaster = boxG(0.36, drumH - 0.3, 0.2).translate(0, DRUM_BASE + drumH / 2 - 0.1, R - 0.01)
      kDrum.add(place(pilaster, x, 0, z, Math.PI / 8 + n * Math.PI / 4), m.cream)
    }
    // Yüz başına tek kemerli pencere, yüksekliğin yarısından fazlası (DJI_0291): sıvadan hafif içeride, açık çerçeveli.
    const face = R * OCTA + 0.04
    const pG = 1.42, pK = 0.68, pH = drumH * 0.62 - pK, y0 = DRUM_BASE + drumH * 0.17
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4
      const frameS = arch(new THREE.Shape(), 0, y0 - 0.1, pG + 0.26, pH + 0.1, pK + 0.14)
      frameS.holes.push(arch(new THREE.Path(), 0, y0, pG, pH, pK))
      const frameBorder = subtract(frameS, 0.09, face)
      const cage = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y0, pG, pH, pK), 8).translate(0, 0, face + 0.02)
      kDrum.add(place(frameBorder, x, 0, z, a), m.cream)
      kDrum.add(place(cage, x, 0, z, a), m.cage)
    }

    addLeadDome(kDome, m, x, DRUM_BASE + drumH, z, domeH, open, i, j)
  }

  // --- Minareler: batıdaki mermer çok köşeli kaideli, doğudaki taş kare kaideli (fotoğraflara göre) ---
  const minaret = (x: number, z: number, west: boolean) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z), mat)
    let bodyBase: number
    if (west) {
      ext(flatShadow(cylinderG(3.5, 3.5, 13, 8).translate(0, 6.5, 0)), m.marble)
      ext(flatShadow(cylinderG(3.56, 3.56, 0.5, 8).translate(0, 3.1, 0)), m.dark)
      ext(flatShadow(cylinderG(3.56, 3.56, 0.25, 8).translate(0, 4.0, 0)), m.dark)
      ext(flatShadow(cylinderG(2.3, 3.5, 1.6, 8).translate(0, 13.8, 0)), m.marble)
      for (const y of [6.6, 9.8, 12.9]) ext(flatShadow(cylinderG(3.62, 3.62, 0.2, 8).translate(0, y, 0)), m.marble)
      bodyBase = 14.5
    } else {
      ext(boxG(6.8, 6, 6.8).translate(0, 3, 0), m.stone)
      ext(boxG(7.3, 0.9, 7.3).translate(0, 0.45, 0), m.marble)
      ext(flatShadow(cylinderG(2.5, 4.8, 3.2, 4).rotateY(Math.PI / 4).translate(0, 7.6, 0)), m.stone)
      bodyBase = 9.1
    }
    minaretTop(ext, m, bodyBase)
  }
  minaret(-YX - 2.2, -YZ - 1.4, true)
  minaret(YX + 2.2, -YZ - 1.4, false)

  // --- Kuzey avlusundaki iki şadırvan köşkü: ulucami/kapilar.ts ---
  kiosk(k, m, K, -17, -YZ - 15)
  kiosk(k, m, K, 17, -YZ - 15)

  // --- Katmanlar ---
  const root = k.group()
  root.add(surroundings)
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)
  return {
    root,
    // Alttan üste: maketin üst üste oturma sırası.
    layers: [
      { group: roofGroup, height: 24, ad: 'Çatı' },
      { group: drumGroup, height: 34, ad: 'Kasnaklar' },
      { group: domeGroup, height: 44, ad: 'Kubbeler' },
    ],
    stops: interiorStops,
    walking: interiorWalkArea(),
  }
}
