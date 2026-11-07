// Representative model of the Timurtaş Paşa Complex. Mosque plan and dimensions from the plan in Ayverdi 1989 (Kahraman 2025, Figure 4);
// cover layout, minaret and hamam dimensions from the Vakıf Eserleri Envanteri (pp. 216-220); heights, ornament and
// layout interpreted from photos. Units in meters. North = -z, qibla = +z, east = +x.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'
import type { Model } from '../uluMosqueModel'
import type { InteriorStop, InteriorWalk, Box, FloorArea } from '../uluMosqueInterior'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, uvFit, place } from '../uluMosquePiece'
import {
  alternatingTexture, tileTexture, innerWallTexture, ashlarTexture, roofTileTexture, gravestoneTexture, mihrabFallbackTexture, rubbleTexture,
  parquetTexture, rosetteTexture, stonePavingTexture, brickTexture,
} from './timurtas-pasa-complex-pieces/textures'

/** All geometry is shifted in x so the complex sits at the scene center; plan dimensions are written unshifted. */
const OX = 16
const IC = 0.45, IWAN = 0.95, BAY = 1.62, EAVE = 8.4
// Plan: facade 20.98 m; late-comers' portico, domed central space (about 6 m), zaviyes on the sides, vaulted iwan in front of the mihrab.
const E = 10.5, FRONT = -9.5, SC_IN = -8.3, SC_BACK = -4.23, MID_K = -2.87, MID_G = 3.05, MID_X = 3.05
const WING_IN_X = 4.04, WING_G_IN = 4.62, WING_G = 5.8, IWAN_X = 2.87, IWAN_OUT = 4.16, IWAN_ING = 10.14, IWAN_G = 11.14
const MIN_X = 8, MIN_Z = -25, MIN_R = 3.7

type Mat = THREE.Material
type P2 = [number, number]

interface Opening {
  u: number; g: number; y0: number; flat: number; kh: number
  tour: 'door' | 'window' | 'glass' | 'cage'
  /** Large blind arch and tile lunette on the outer face. */
  kor?: boolean
  rosette?: boolean
}

function archPoints(cx: number, y0: number, g: number, flat: number, kh: number, n: number) {
  const o = g / 2, b = y0 + flat, apex = b + kh, kon = b + kh * 0.55, s: P2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = 1 - t
    s.push([a * a * -o + 2 * a * t * -o, a * a * b + 2 * a * t * kon + t * t * apex])
  }
  for (let i = n - 1; i >= 0; i--) s.push([-s[i][0], s[i][1]])
  return s.map(([x, y]): P2 => [x + cx, y])
}

/** UV of a world-placed surface in meters based on its normal: stone courses stay aligned across all walls. */
function uvWorld<G extends THREE.BufferGeometry>(g: G) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i))
    if (ny > 0.7) uv.setXY(i, p.getX(i), p.getZ(i))
    else if (nx > nz) uv.setXY(i, p.getZ(i), p.getY(i))
    else uv.setXY(i, p.getX(i), p.getY(i))
  }
  return g
}

/** Flat-shaded surface from triangles; winding is fixed so normals face up. */
function triangles(list: [THREE.Vector3, THREE.Vector3, THREE.Vector3][]) {
  const position: number[] = [], uv: number[] = []
  for (const t of list) {
    const [a, b0, c0] = t
    const up = b0.clone().sub(a).cross(c0.clone().sub(a)).y >= 0
    const b = up ? b0 : c0, c = up ? c0 : b0
    for (const v of [a, b, c]) { position.push(v.x, v.y, v.z); uv.push(v.x + v.y * 0.4, v.z + v.y * 0.4) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Hipped roof: ridge along the long side. */
function hip(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) {
  const a = V(x0, y0, z0), b = V(x1, y0, z0), c = V(x1, y0, z1), d = V(x0, y0, z1)
  const gx = x1 - x0, gz = z1 - z0
  if (gz >= gx) {
    const p = V((x0 + x1) / 2, y1, z0 + gx / 2), q = V((x0 + x1) / 2, y1, z1 - gx / 2)
    return triangles([[a, b, p], [b, c, q], [b, q, p], [c, d, q], [d, a, p], [d, p, q]])
  }
  const p = V(x0 + gz / 2, y1, (z0 + z1) / 2), q = V(x1 - gz / 2, y1, (z0 + z1) / 2)
  return triangles([[d, a, p], [a, b, q], [a, q, p], [b, c, q], [c, d, p], [c, p, q]])
}

/** Half-cylinder vault running along z. */
function vault(x: number, R: number, z0: number, z1: number, y: number) {
  return new THREE.CylinderGeometry(R, R, z1 - z0, 28, 1, true, -Math.PI / 2, Math.PI)
    .rotateX(-Math.PI / 2).translate(x, y, (z0 + z1) / 2)
}

export const building = (): Model => {
  const m = uluMosqueMaterials()
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...p })
  const al = alternatingTexture(), tg = brickTexture(), ml = rubbleTexture()
  const alternating = pbr({ map: al.color, bumpMap: al.relief, bumpScale: 0.9, roughness: 0.92 })
  const brick = pbr({ map: tg.color, bumpMap: tg.relief, bumpScale: 0.9, roughness: 0.9, side: THREE.DoubleSide })
  const rubble = pbr({ map: ml.color, bumpMap: ml.relief, bumpScale: 1.3, roughness: 0.95 })
  const cornerStone = pbr({ color: '#b6a98f', roughness: 0.9 })
  const innerWall = pbr({ map: innerWallTexture(), color: '#a3a197', roughness: 0.92 })
  const innerPlaster = pbr({ color: '#9f9d92', roughness: 0.92, side: THREE.DoubleSide })
  const porchPlaster = pbr({ color: '#baB29f', roughness: 0.9, side: THREE.DoubleSide })
  const pink = pbr({ color: '#d4a48c', roughness: 0.9 })
  const tile = pbr({ map: tileTexture(), roughness: 0.7 })
  const roofTile = pbr({ map: roofTileTexture(), roughness: 0.8 })
  const glassOuter = new THREE.MeshStandardMaterial({ color: '#223039', roughness: 0.16, metalness: 0.7, transparent: true, opacity: 0.86 })
  const camInner = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 1.06, 1.2), transparent: true })
  const skyLight = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.3, 2.4), side: THREE.DoubleSide })
  const whiteJoinery = pbr({ color: '#e9e6dd', roughness: 0.6 })
  const woodLight = pbr({ color: '#9b5a2a', roughness: 0.55 })
  const iron = pbr({ color: '#1d1f20', roughness: 0.55, metalness: 0.5 })
  const carpet = m.carpetPlain.clone()
  carpet.color = new THREE.Color('#14748f')
  const pavingInner = pbr({ map: stonePavingTexture(13, [[196, 190, 174], [182, 176, 160], [208, 200, 184]], [128, 122, 110]), roughness: 0.75 })
  const plaza = pbr({ map: stonePavingTexture(29, [[83, 90, 95], [99, 105, 108], [66, 74, 80], [112, 112, 108]], [150, 146, 134]), roughness: 0.82 })
  const courtyardStone = pbr({ map: stonePavingTexture(41, [[92, 92, 84], [104, 102, 92], [84, 84, 78]], [66, 66, 60]), roughness: 0.92 })
  const parquet = pbr({ map: parquetTexture(), roughness: 0.9 })
  const green = pbr({ color: '#47663a', roughness: 1 })
  const leaf = pbr({ color: '#5f8a3d', roughness: 1 })
  const leafDark = pbr({ color: '#4a7334', roughness: 1 })
  const trunkTree = pbr({ color: '#4d3f33', roughness: 1 })
  const graveDark = pbr({ map: gravestoneTexture('#585b57', '#3b3e3b', '#83867e', 5), roughness: 0.95 })
  const graveLight = pbr({ map: gravestoneTexture('#a9a697', '#7f7c6f', '#c9c6b6', 9), roughness: 0.95 })
  const pedestalStone = pbr({ color: '#b4b0a2', roughness: 0.95 })
  const rosette = pbr({ map: rosetteTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })
  rosette.map!.colorSpace = THREE.SRGBColorSpace
  const photoMihrab = (() => {
    if (PUBLIC_BUILD) return null
    const f = new THREE.TextureLoader().load('/images/timurtas-pasa-complex/model/mihrab.jpg')
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  })()
  const mihrabFace = pbr({ map: photoMihrab ?? mihrabFallbackTexture(), roughness: 0.5, metalness: 0.1 })

  const bathPlaster = pbr({ color: '#8e897b', roughness: 0.95, side: THREE.DoubleSide })
  const kundekariDense = m.kundekari.clone()
  if (m.kundekari.map) { const t = m.kundekari.map.clone(); t.repeat.multiplyScalar(2.6); t.needsUpdate = true; kundekariDense.map = t }
  const basinMarble = pbr({ map: m.marble.map, color: '#ded9cc', roughness: 0.42 })
  const k = new Bucket(), kRoof = new Bucket(), kDome = new Bucket(), kMinaret = new Bucket()
  const boxes: Box[] = [], viewBlockers: Box[] = []
  const circles: { x: number; z: number; r: number; top?: number }[] = []
  const floors: FloorArea[] = []
  const box = (g: number, h: number, d: number, mat: Mat, x: number, y: number, z: number, kv = k) => kv.add(place(boxG(g, h, d), x, y, z), mat)
  const boxD = (g: number, h: number, d: number, mat: Mat, x: number, y: number, z: number, kv = k) => kv.add(uvWorld(place(new THREE.BoxGeometry(g, h, d), x, y, z)), mat)
  const obstacle = (x0: number, x1: number, z0: number, z1: number) => boxes.push({ x0, x1, z0, z1 })

  /** A wall in the plan: going from a to b, local +Z points inside. Outer, body and inner are three layers. */
  const local = (ax: number, az: number, bx: number, bz: number) => {
    const L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L
    return { L, dx, dz, mat: new THREE.Matrix4().makeBasis(V(dx, 0, dz), V(0, 1, 0), V(-dz, 0, dx)).setPosition(ax, 0, az) }
  }
  const openPath = (a: Opening) => a.kh > 0
    ? arch(new THREE.Path(), a.u, a.y0, a.g, a.flat, a.kh)
    : rect(a.u - a.g / 2, a.y0, a.u + a.g / 2, a.y0 + a.flat) as unknown as THREE.Path
  const blindSize = (a: Opening) => ({ g: a.g + 1.5, y0: 0.55, flat: a.y0 + a.flat + 0.65 - 0.55, kh: 1.75 })
  /** Ring of alternating brick and stone on the arch face, projecting slightly from the wall. */
  const archRing = (ext: (g: THREE.BufferGeometry, mat: Mat, world?: boolean) => void, cx: number, y0: number, g: number, flat: number, kh: number, t: number, z: number, d: number) => {
    const n = 8, inner = archPoints(cx, y0, g, flat, kh, n), outer = archPoints(cx, y0, g + 2 * t, flat, kh + t * 1.15, n)
    for (let i = 0; i < inner.length - 1; i++) {
      const s = new THREE.Shape()
      s.moveTo(inner[i][0], inner[i][1]); s.lineTo(inner[i + 1][0], inner[i + 1][1]); s.lineTo(outer[i + 1][0], outer[i + 1][1]); s.lineTo(outer[i][0], outer[i][1]); s.closePath()
      ext(subtract(s, d, z), i % 2 ? brick : cornerStone, true)
    }
  }

  const wall = (ax: number, az: number, bx: number, bz: number, thick: number, h: number, outerMat: Mat, innerMat: Mat, open: Opening[] = [], option: { collide?: boolean; bodyMat?: Mat; kv?: Bucket } = {}) => {
    const { L, dx, dz, mat: matV } = local(ax, az, bx, bz)
    const kv = option.kv ?? k
    const ext = (g: THREE.BufferGeometry, mat: Mat, worldUv = true) => {
      g.applyMatrix4(matV)
      if (worldUv) uvWorld(g)
      kv.add(g, mat)
    }
    const dD = Math.min(0.3, thick * 0.3), dI = 0.12
    const outer = rect(0, -0.2, L, h), gov = rect(0, -0.2, L, h), ics = rect(0, -0.2, L, h)
    for (const a of open) {
      gov.holes.push(openPath(a)); ics.holes.push(openPath(a))
      if (a.kor) {
        const o = blindSize(a)
        outer.holes.push(arch(new THREE.Path(), a.u, o.y0, o.g, o.flat, o.kh))
      } else outer.holes.push(openPath(a))
    }
    ext(subtract(outer, dD, 0), outerMat)
    // Outer half of the window opening uses the outer material, inner half plaster: brick is not visible from inside.
    const zMid = Math.max(thick * 0.45, dD + 0.02)
    const gov2 = rect(0, -0.2, L, h)
    for (const a of open) gov2.holes.push(openPath(a))
    ext(subtract(gov, zMid - dD, dD), option.bodyMat ?? outerMat)
    ext(subtract(gov2, thick - dI - zMid, zMid), option.bodyMat ?? innerMat)
    ext(subtract(ics, dI, thick - dI), innerMat)
    const zc = thick * 0.45
    for (const a of open) {
      const topV = a.y0 + a.flat + a.kh
      if (a.kor) {
        const o = blindSize(a)
        archRing(ext, a.u, o.y0, o.g, o.flat, o.kh, 0.42, -0.05, 0.1)
        // Low arch and tile lunette above the window
        const ky = a.y0 + a.flat + 0.03, kg = a.g + 0.12, kh = 0.95
        const al = new THREE.ShapeGeometry(arch(new THREE.Shape(), a.u, ky, kg, 0, kh), 10).translate(0, 0, dD - 0.01)
        ext(al, tile)
        archRing(ext, a.u, ky, kg, 0, kh, 0.26, dD - 0.14, 0.13)
        // Blind arch base and frame facing the wall surface
        for (const s of [-1, 1]) {
          const y1 = a.y0 + a.flat + 0.03
          ext(boxG(0.2, y1 - o.y0, dD).translate(a.u + s * (o.g / 2 - 0.1), (y1 + o.y0) / 2, dD / 2 - 0.01), cornerStone, false)
        }
        ext(boxG(o.g, 0.16, dD + 0.06).translate(a.u, o.y0 + 0.08, dD / 2 - 0.02), cornerStone, false)
      }
      if (a.tour === 'door') continue
      const shape = () => a.kh > 0 ? arch(new THREE.Shape(), 0, a.y0, a.g, a.flat, a.kh) : rect(-a.g / 2, a.y0, a.g / 2, a.y0 + a.flat)
      if (a.tour !== 'cage') {
        ext(new THREE.ShapeGeometry(shape(), 12).translate(a.u, 0, zc), camInner, false)
        ext(new THREE.ShapeGeometry(shape(), 12).rotateY(Math.PI).translate(a.u, 0, zc - 0.02), glassOuter, false)
      }
      // Grille or joinery
      const bar = a.tour === 'glass' ? whiteJoinery : iron
      const yy = a.kh > 0 ? archPoints(a.u, a.y0, a.g, a.flat, a.kh, 12) : []
      const apexX = (x: number) => { let en = a.y0 + a.flat; for (let i = 0; i < yy.length - 1; i++) { const [x0, y0] = yy[i], [x1, y1] = yy[i + 1]; if ((x0 - x) * (x1 - x) <= 0 && x1 !== x0) en = y0 + (y1 - y0) * ((x - x0) / (x1 - x0)) } return en }
      const sideX = (y: number) => { if (y <= a.y0 + a.flat || !yy.length) return a.g / 2; for (let i = 0; i < 12; i++) if (yy[i][1] <= y && yy[i + 1][1] >= y) return a.u - yy[i][0] - (a.u - yy[i][0] - (a.u - yy[i + 1][0])) * ((y - yy[i][1]) / (yy[i + 1][1] - yy[i][1])); return 0 }
      const stepX = a.tour === 'glass' ? 0.42 : 0.2, stepY = a.tour === 'glass' ? 0.42 : 0.2, stay = a.tour === 'glass' ? 0.045 : 0.022
      const count = Math.floor(a.g / stepX)
      for (let i = 1; i < count; i++) {
        const x = a.u - a.g / 2 + (i * a.g) / count, top = apexX(x)
        if (top > a.y0 + 0.02) for (const zb of [zc - 0.05, zc + 0.03]) ext(boxG(stay, top - a.y0, stay).translate(x, (top + a.y0) / 2, zb), bar, false)
      }
      for (let y = a.y0 + stepY; y < topV - 0.05; y += stepY) {
        const o = sideX(y)
        if (o > 0.03) for (const zb of [zc - 0.05, zc + 0.03]) ext(boxG(o * 2, stay, stay).translate(a.u, y, zb), bar, false)
      }
      // Blind-arched window: wooden frame on the inner face (based on the photo)
      if (a.tour === 'window' || a.tour === 'cage') {
        const z = thick + 0.02
        ext(boxG(a.g + 0.3, 0.14, 0.1).translate(a.u, topV + 0.06, z), woodLight, false)
        ext(boxG(a.g + 0.3, 0.14, 0.1).translate(a.u, a.y0 - 0.06, z), woodLight, false)
        for (const s of [-1, 1]) ext(boxG(0.14, topV - a.y0 + 0.24, 0.1).translate(a.u + s * (a.g / 2 + 0.08), (topV + a.y0) / 2, z), woodLight, false)
        if (a.rosette) ext(new THREE.PlaneGeometry(0.95, 0.95).translate(a.u, topV + 0.85, thick + 0.012), rosette, false)
      }
    }
    if (option.collide !== false) {
      // Except for door openings, the wall is a collision box; the same boxes also block the view.
      const intervals = open.filter((a) => a.tour === 'door').map((a) => [a.u - a.g / 2, a.u + a.g / 2]).sort((p, q) => p[0] - q[0])
      let s = 0
      const piece = (u0: number, u1: number) => {
        if (u1 - u0 < 0.02) return
        const ptl = [
          [ax + dx * u0, az + dz * u0], [ax + dx * u1, az + dz * u1],
          [ax + dx * u0 - dz * thick, az + dz * u0 + dx * thick], [ax + dx * u1 - dz * thick, az + dz * u1 + dx * thick],
        ]
        const kut = { x0: Math.min(...ptl.map((p) => p[0])), x1: Math.max(...ptl.map((p) => p[0])), z0: Math.min(...ptl.map((p) => p[1])), z1: Math.max(...ptl.map((p) => p[1])) }
        boxes.push(kut); viewBlockers.push(kut)
      }
      for (const [u0, u1] of intervals) { piece(s, u0); s = u1 }
      piece(s, L)
    }
  }

  /** Saw-tooth (kirpi) eave: two rows of saw-tooth brick and a stone molding on top (Kahraman 2025). */
  const eave = (ax: number, az: number, bx: number, bz: number, y: number, kv = k, wallMat: Mat = brick) => {
    const { L, mat: matV } = local(ax, az, bx, bz)
    const ext = (g: THREE.BufferGeometry, mat: Mat) => { g.applyMatrix4(matV); kv.add(g, mat) }
    ext(boxG(L + 0.1, 0.08, 0.3).translate(L / 2, y - 0.04, -0.06), cornerStone)
    const n = Math.floor(L / 0.28)
    for (let s = 0; s < 2; s++) for (let i = 0; i < n; i++) {
      const u = (i + (s ? 0.5 : 0)) * (L / n) + (L / n) * 0.25
      ext(new THREE.BoxGeometry(0.18, 0.15, 0.18).rotateY(Math.PI / 4).translate(u, y + 0.08 + s * 0.16, -0.06 - s * 0.05), wallMat)
    }
    ext(boxG(L + 0.7, 0.1, 0.62).translate(L / 2, y + 0.38, -0.1), cornerStone)
  }

  // --- Ground ---
  const R_FLOOR = 53
  const floorCircle = new THREE.CircleGeometry(R_FLOOR, 72).rotateX(-Math.PI / 2).translate(-OX, 0.02, 0)
  uvWorld(floorCircle)
  k.add(floorCircle, courtyardStone)
  // Demirtaş Caddesi: paved road in front of the mosque, minaret square opposite.
  const horizontal = (x0: number, x1: number, z0: number, z1: number, y: number, mat: Mat) => k.add(uvWorld(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2)), mat)
  horizontal(-59, 34, -19.5, -11, 0.05, parquet)
  horizontal(-8, 24, -36, -19.5, 0.05, plaza)
  horizontal(-59, 34, -11, -10.7, 0.06, cornerStone)
  horizontal(-59, 34, -19.8, -19.5, 0.06, cornerStone)
  for (const z of [-30, -27, -24, -21]) for (let x = -7; x < 23; x += 7.5) box(5.5, 0.01, 0.2, pink, x + 2.7, 0.06, z)

  // Building platform and interior floors
  boxD(E * 2 + 0.3, IC, MID_K + 9.65, cornerStone, 0, IC / 2, (FRONT - 0.15 + MID_K) / 2)
  boxD(E * 2 + 0.3, IC, WING_G - MID_K + 0.2, cornerStone, 0, IC / 2, (MID_K + WING_G) / 2)
  boxD(IWAN_OUT * 2 + 0.3, IC, IWAN_G - WING_G + 0.15, cornerStone, 0, IC / 2, (WING_G + IWAN_G + 0.15) / 2)
  horizontal(-E + 1.1, E - 1.1, SC_IN, SC_BACK, IC + 0.01, pavingInner)
  horizontal(-MID_X, MID_X, MID_K, 2.6, IC + 0.01, carpet)
  horizontal(WING_IN_X, E - 1.1, MID_K, WING_G_IN, IC + 0.01, carpet)
  horizontal(-E + 1.1, -WING_IN_X, MID_K, WING_G_IN, IC + 0.01, carpet)
  // Iwan: +0.50 level, two steps (Kahraman 2025).
  boxD(IWAN_X * 2, IWAN - IC, IWAN_ING - 3.4, cornerStone, 0, (IWAN + IC) / 2, (IWAN_ING + 3.4) / 2)
  horizontal(-IWAN_X, IWAN_X, 3.4, IWAN_ING, IWAN + 0.012, carpet)
  boxD(IWAN_X * 2, 0.25, 0.4, m.innerMarble, 0, IC + 0.125, 3.0)
  boxD(IWAN_X * 2, 0.5, 0.4, m.innerMarble, 0, IC + 0.25, 3.2)
  // Facade steps
  for (const [z, h, d] of [[-10.05, 0.15, 1.1], [-9.95, 0.3, 0.9], [-9.85, 0.45, 0.7]] as const) box(5.8, h, d, m.marble, 0, h / 2, z)

  // --- Walls ---
  const window = (u: number, g = 1.2, y0 = 1.25, flat = 1.55, kor = true, rosetted = false): Opening => ({ u, g, y0, flat, kh: 0, tour: 'window', kor, rosette: rosetted })
  const bay = (u: number, g: number, apex: number): Opening => ({ u, g, y0: 1.15, flat: 2.65, kh: apex - 3.8, tour: 'glass' })
  // Facade: 1.33 · 2.36 · 1.09 · 2.50 · 1.07 · 4.30 · 1.06 · 2.49 · 1.07 · 2.39 · 1.33
  const bayU = [1.33 + 1.18, 1.33 + 2.36 + 1.09 + 1.25, 10.495, 10.495 + 2.15 + 1.06 + 1.245, 10.495 + 2.15 + 1.06 + 2.49 + 1.07 + 1.195]
  wall(-E, FRONT, E, FRONT, 1.2, EAVE, alternating, porchPlaster, [
    bay(bayU[0], 2.36, 5.75), bay(bayU[1], 2.5, 5.85),
    { u: bayU[2], g: 4.3, y0: 0, flat: 3.8, kh: 2.85, tour: 'door' },
    bay(bayU[3], 2.49, 5.85), bay(bayU[4], 2.39, 5.75),
  ])
  // Facade arch rings and pink dado (based on the photo)
  const frontWall = local(-E, FRONT, E, FRONT)
  const frontExt = (g: THREE.BufferGeometry, mat: Mat) => { g.applyMatrix4(frontWall.mat); uvWorld(g); k.add(g, mat) }
  bayU.forEach((u, i) => {
    const mid = i === 2, g = [2.36, 2.5, 4.3, 2.49, 2.39][i], apex = mid ? 6.65 : i === 0 || i === 4 ? 5.75 : 5.85
    archRing(frontExt, u, 0, g, 3.8, apex - 3.8, mid ? 0.62 : 0.5, -0.09, 0.12)
    if (!mid) { const b = new THREE.BoxGeometry(g - 0.08, 1.15, 0.05).translate(u, 0.575 + 0.3, -0.03); frontExt(b, pink) }
  })
  // Middle bay: low infill on both sides of the door, glazed joinery above. Passage through the middle.
  for (const s of [-1, 1]) {
    box(1.35, 1.2, 0.3, pink, s * 1.475, 0.6 + 0.3, FRONT + 0.6)
    obstacle(s * 0.8 - (s > 0 ? 0 : 1.35), s * 0.8 + (s > 0 ? 1.35 : 0), FRONT + 0.4, FRONT + 0.8)
    box(0.1, 2.4, 0.14, whiteJoinery, s * 0.8, 1.65, FRONT + 0.6)
  }
  box(1.7, 0.12, 0.2, whiteJoinery, 0, 2.86, FRONT + 0.6)
  const midGlass = new THREE.Shape()
  arch(midGlass, 0, 2.9, 4.2, 0.85, 2.85)
  const camO = () => new THREE.ShapeGeometry(midGlass, 14)
  k.add(camO().translate(0, 0, FRONT + 0.62), camInner)
  k.add(camO().rotateY(Math.PI).translate(0, 0, FRONT + 0.6), glassOuter)
  for (let i = -4; i <= 4; i++) { const x = i * 0.46, t = Math.max(0, 1 - (Math.abs(x) / 2.1) ** 1.6); box(0.05, 0.85 + t * 2.85, 0.05, whiteJoinery, x, 2.9 + (0.85 + t * 2.85) / 2, FRONT + 0.56) }
  for (const y of [2.9, 3.35, 3.75]) box(4.2, 0.05, 0.05, whiteJoinery, 0, y, FRONT + 0.56)
  for (let i = 0; i < 6; i++) { const y = 4.2 + i * 0.42, o = 2.1 * Math.max(0, (1 - ((y - 3.75) / 2.85)) ** 0.7); box(o * 2, 0.05, 0.05, whiteJoinery, 0, y, FRONT + 0.56) }
  eave(-E, FRONT, E, FRONT, EAVE)

  // Late-comers' portico ends, zaviye outer walls (east and west). Plan: two side windows and one upper window in each zaviye.
  wall(E, FRONT, E, MID_K, 1.1, EAVE, alternating, porchPlaster, [window(3.4, 1.15, 1.8, 1.8, false)])
  wall(-E, MID_K, -E, FRONT, 1.1, EAVE, alternating, porchPlaster, [window(3.2, 1.15, 1.8, 1.8, false)])
  wall(E, MID_K, E, WING_G, 1.1, EAVE, alternating, innerWall, [window(1.9, 1.26, 1.25, 1.55, true, true), window(6.75, 1.26, 1.25, 1.55, true, true)])
  wall(-E, WING_G, -E, MID_K, 1.1, EAVE, alternating, innerWall, [window(1.9, 1.26, 1.25, 1.55, true, true), window(6.75, 1.26, 1.25, 1.55, true, true)])
  wall(E, WING_G, IWAN_OUT, WING_G, 1.18, EAVE, alternating, innerWall, [window(3.15, 1.26, 1.25, 1.55, true, true)])
  wall(-IWAN_OUT, WING_G, -E, WING_G, 1.18, EAVE, alternating, innerWall, [window(3.15, 1.26, 1.25, 1.55, true, true)])
  // Late-comers' portico back wall: middle door 1.40 m, one door to each zaviye (plan).
  const door = (u: number, g: number): Opening => ({ u, g, y0: 0, flat: 2.5, kh: 0.9, tour: 'door' })
  wall(-E + 1.1, SC_BACK, E - 1.1, SC_BACK, SC_BACK * -1 + MID_K, EAVE, porchPlaster, innerWall, [door(9.4 - 6.9, 1.3), door(9.4, 1.4), door(9.4 + 6.9, 1.3)])
  // Side walls of the central space: one door and one window on each side (Kahraman 2025).
  const sideWall: Opening[] = [door(1.3, 1.2), { u: 4.4, g: 1.1, y0: 1.25, flat: 1.3, kh: 0.5, tour: 'cage' }]
  wall(WING_IN_X, MID_K, WING_IN_X, MID_G, WING_IN_X - MID_X, EAVE, innerWall, innerWall, sideWall)
  wall(-WING_IN_X, MID_G, -WING_IN_X, MID_K, WING_IN_X - MID_X, EAVE, innerWall, innerWall, [{ ...sideWall[1], u: 1.5 }, { ...sideWall[0], u: 4.6 }])
  // Iwan side walls
  wall(IWAN_OUT, MID_G, IWAN_OUT, WING_G, IWAN_OUT - IWAN_X, EAVE, innerWall, innerWall)
  wall(-IWAN_OUT, WING_G, -IWAN_OUT, MID_G, IWAN_OUT - IWAN_X, EAVE, innerWall, innerWall)
  wall(IWAN_OUT, WING_G, IWAN_OUT, IWAN_G, IWAN_OUT - IWAN_X, EAVE, alternating, innerWall, [window(2.4, 1.3, 1.55, 1.5, true, true)])
  wall(-IWAN_OUT, IWAN_G, -IWAN_OUT, WING_G, IWAN_OUT - IWAN_X, EAVE, alternating, innerWall, [window(2.94, 1.3, 1.55, 1.5, true, true)])
  // Qibla wall: windows on both sides of and above the mihrab (Kahraman 2025).
  wall(IWAN_OUT, IWAN_G, -IWAN_OUT, IWAN_G, IWAN_G - IWAN_ING, EAVE, alternating, innerWall, [
    window(IWAN_OUT - 2.05, 1.05, 1.55, 1.5, true, true),
    { u: IWAN_OUT, g: 0.95, y0: 5.55, flat: 0.75, kh: 0.5, tour: 'window' },
    window(IWAN_OUT + 2.05, 1.05, 1.55, 1.5, true, true),
  ])
  eave(E, FRONT, E, WING_G, EAVE); eave(E, WING_G, IWAN_OUT, WING_G, EAVE)
  eave(IWAN_OUT, WING_G, IWAN_OUT, IWAN_G, EAVE); eave(IWAN_OUT, IWAN_G, -IWAN_OUT, IWAN_G, EAVE)
  eave(-IWAN_OUT, IWAN_G, -IWAN_OUT, WING_G, EAVE); eave(-IWAN_OUT, WING_G, -E, WING_G, EAVE); eave(-E, WING_G, -E, FRONT, EAVE)

  // Large arch between the central space and the iwan
  const archWall = rect(-MID_X, 0.5, MID_X, EAVE)
  archWall.holes.push(arch(new THREE.Path(), 0, 0.52, IWAN_X * 2, 4.5, 1.8))
  k.add(uvWorld(subtract(archWall, 0.36, MID_G - 0.36)), innerWall)

  // Late-comers' portico intermediate arches
  for (const x of [-6.2, -2.62, 2.62, 6.2]) {
    const s = rect(SC_IN, 0.5, SC_BACK, 7)
    s.holes.push(arch(new THREE.Path(), (SC_IN + SC_BACK) / 2, 0.52, SC_BACK - SC_IN, 4.4, 1.3))
    const g = subtract(s, 0.55, -0.27).rotateY(-Math.PI / 2)
    k.add(uvWorld(g.translate(x, 0, 0)), porchPlaster)
  }

  // --- Zaviye and iwan vaults, late-comers' portico cover (Roof layer) ---
  const KX = (WING_IN_X + E - 1.1) / 2, KR = (E - 1.1 - WING_IN_X) / 2
  for (const s of [-1, 1]) kRoof.add(vault(s * KX, KR, MID_K, WING_G_IN, 5.28), innerPlaster)
  kRoof.add(vault(0, IWAN_X, MID_G, IWAN_ING, 5.3), innerPlaster)
  // Lunettes at the ends of the vaults are covered by the wall; wooden tie beam in the iwan (based on the photo).
  box(IWAN_X * 2, 0.22, 0.22, pbr({ color: '#e7e3d8', roughness: 0.75 }), 0, 5.25, 7.0)

  // Late-comers' portico upper cover: dome with Turkish triangles in the middle, small domes on the sides, cross vaults at the ends.
  const SC_MID = (SC_IN + SC_BACK) / 2, D_Y = 7
  const ceiling = rect(-E + 1.05, SC_IN - 0.05, E - 1.05, SC_BACK + 0.05)
  const hole = (x: number, r: number) => { ceiling.holes.push(new THREE.Path().absarc(x, SC_MID, r, 0, Math.PI * 2, true)) }
  hole(0, 1.85); hole(-4.4, 1.25); hole(4.4, 1.25)
  ceiling.holes.push(rect(-E + 1.25, SC_IN + 0.15, -6.5, SC_BACK - 0.15) as unknown as THREE.Path)
  ceiling.holes.push(rect(6.5, SC_IN + 0.15, E - 1.25, SC_BACK - 0.15) as unknown as THREE.Path)
  kRoof.add(new THREE.ShapeGeometry(ceiling, 24).rotateX(Math.PI / 2).translate(0, D_Y, 0), porchPlaster)
  const innerDome = (x: number, z: number, y: number, r: number, h: number, kv: Bucket, mat: Mat) => {
    const p: P2[] = []
    for (let t = 0; t <= 12; t++) { const a = (t / 12) * Math.PI / 2; p.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)]) }
    kv.add(place(rotateG(p, 32, [1, 1]), x, y, z), mat)
  }
  innerDome(0, SC_MID, D_Y, 1.85, 1.6, kRoof, porchPlaster)
  innerDome(-4.4, SC_MID, D_Y, 1.25, 1.1, kRoof, porchPlaster)
  innerDome(4.4, SC_MID, D_Y, 1.25, 1.1, kRoof, porchPlaster)
  // Middle bay: transition from flat triangular surfaces (from the dome edge toward the ceiling).
  const turkTriangle: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  const Kx = 2.07, Kz = 2.0
  for (let n = 0; n < 16; n++) {
    const a0 = (n / 16) * Math.PI * 2, a1 = ((n + 1) / 16) * Math.PI * 2, am = (a0 + a1) / 2
    const p = (a: number) => V(1.85 * Math.cos(a), D_Y - 0.01, SC_MID + 1.85 * Math.sin(a))
    const look = (a: number) => { const c = Math.cos(a), s = Math.sin(a), t = Math.min(Kx / Math.max(Math.abs(c), 1e-3), Kz / Math.max(Math.abs(s), 1e-3)); return V(c * t, D_Y - 0.75, SC_MID + s * t) }
    turkTriangle.push([p(a0), p(a1), look(am)])
    turkTriangle.push([p(a0), look(am), look(a0)], [p(a1), look(a1), look(am)])
  }
  kRoof.add(triangles(turkTriangle), pbr({ color: '#b5ab94', roughness: 0.9, side: THREE.DoubleSide, flatShading: true }))
  // Cross vaults at the ends: four triangular faces meet at the top.
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 6.5 : -E + 1.25, x1 = s > 0 ? E - 1.25 : -6.5, z0 = SC_IN + 0.15, z1 = SC_BACK - 0.15, tp = V((x0 + x1) / 2, D_Y + 1, (z0 + z1) / 2)
    const a = V(x0, D_Y, z0), b = V(x1, D_Y, z0), c = V(x1, D_Y, z1), d = V(x0, D_Y, z1)
    kRoof.add(triangles([[a, b, tp], [b, c, tp], [c, d, tp], [d, a, tp]]), pbr({ color: '#d7cfba', roughness: 0.9, side: THREE.DoubleSide }))
  }

  // Lead hipped roofs (based on the photos)
  const CY = EAVE + 0.34
  const roofs: [number, number, number, number, number, number][] = [
    [-E - 0.42, -4.2, FRONT - 0.42, WING_G + 0.42, CY, CY + 1.45],
    [4.2, E + 0.42, FRONT - 0.42, WING_G + 0.42, CY, CY + 1.45],
    [-4.26, 4.26, FRONT - 0.42, MID_K - 0.3, CY, CY + 0.95],
    [-IWAN_OUT - 0.42, IWAN_OUT + 0.42, MID_G, IWAN_G + 0.42, CY, CY + 1.55],
  ]
  for (const [x0, x1, z0, z1, y0, y1] of roofs) kRoof.add(hip(x0, x1, z0, z1, y0, y1), m.lead)
  // Under-cover closing the gaps in the roof
  for (const [x0, x1, z0, z1] of roofs) kRoof.add(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(Math.PI / 2).translate((x0 + x1) / 2, CY - 0.02, (z0 + z1) / 2), m.dark)

  // Late-comers' portico middle dome: small drum and lead dome from outside (based on the photo)
  kDome.add(uvWorld(place(cylinderG(2.2, 2.2, 1.1, 12, true), 0, CY + 0.5, SC_MID)), alternating)
  eaveRing(kDome, 0, SC_MID, CY + 1.05, 2.32, 12, brick, cornerStone)
  kDome.add(place(rotateG(domeProfile(2.08, 1.35), 40, [1, 1]), 0, CY + 1.2, SC_MID), m.dome)
  finial(kDome, 0, CY + 2.5, SC_MID, 0.7, m.gold)

  // --- Central dome: square base, octagonal drum, 6 m diameter dome, octagonal skylight lantern (Kahraman 2025) ---
  const PEDESTAL = 4.45, KY0 = EAVE, KY1 = 9.75
  const pedestalH = KY1 - KY0, pedestalI = MID_X + 0.02, pedestalE = PEDESTAL - pedestalI
  for (const s of [-1, 1]) {
    kDome.add(uvWorld(place(new THREE.BoxGeometry(PEDESTAL * 2, pedestalH, pedestalE), 0, (KY0 + KY1) / 2, s * (pedestalI + pedestalE / 2))), alternating)
    kDome.add(uvWorld(place(new THREE.BoxGeometry(pedestalE, pedestalH, pedestalI * 2), s * (pedestalI + pedestalE / 2), (KY0 + KY1) / 2, 0)), alternating)
    kDome.add(new THREE.BoxGeometry(PEDESTAL * 2 + 0.6, 0.08, pedestalE + 0.3).translate(0, KY1 + 0.08, s * (pedestalI + (pedestalE + 0.3) / 2)), m.lead)
    kDome.add(new THREE.BoxGeometry(pedestalE + 0.3, 0.08, pedestalI * 2).translate(s * (pedestalI + (pedestalE + 0.3) / 2), KY1 + 0.08, 0), m.lead)
  }
  for (const [ax, az, bx, bz] of [[-PEDESTAL, -PEDESTAL, PEDESTAL, -PEDESTAL], [PEDESTAL, -PEDESTAL, PEDESTAL, PEDESTAL], [PEDESTAL, PEDESTAL, -PEDESTAL, PEDESTAL], [-PEDESTAL, PEDESTAL, -PEDESTAL, -PEDESTAL]]) eave(ax, az, bx, bz, KY1 - 0.32, kDome)
  const DRUM_Y = KY1, DRUM_H = 1.15, DRUM_R = 4.3, OUT_Y = DRUM_Y + DRUM_H
  kDome.add(uvWorld(flatShadow(cylinderG(DRUM_R, DRUM_R, DRUM_H, 8, true).rotateY(Math.PI / 8)).translate(0, DRUM_Y + DRUM_H / 2, 0)), alternating)
  eaveRing(kDome, 0, 0, OUT_Y - 0.1, DRUM_R + 0.1, 8, brick, cornerStone)
  kDome.add(flatShadow(cylinderG(DRUM_R - 0.2, DRUM_R + 0.22, 0.32, 8, true).rotateY(Math.PI / 8)).translate(0, OUT_Y + 0.22, 0), m.lead)
  kDome.add(place(rotateG(domeProfile(3.98, 2.35), 56, [1, 1]), 0, OUT_Y + 0.28, 0), m.dome)
  // Lantern: octagonal alternating-masonry body, arched windows, lead cone
  const LANTERN_Y = OUT_Y + 0.28 + 2.1, LANTERN_H = 1.75, LANTERN_R = 1.12
  kDome.add(uvWorld(flatShadow(cylinderG(LANTERN_R, LANTERN_R, LANTERN_H, 8, true).rotateY(Math.PI / 8)).translate(0, LANTERN_Y + LANTERN_H / 2, 0)), alternating)
  for (let n = 0; n < 8; n++) {
    const a = n * Math.PI / 4, s = arch(new THREE.Shape(), 0, LANTERN_Y + 0.28, 0.46, 0.55, 0.4), face = LANTERN_R * Math.cos(Math.PI / 8) + 0.02
    kDome.add(new THREE.ShapeGeometry(s, 8).translate(0, 0, face).rotateY(a), glassOuter)
    const h = arch(new THREE.Shape(), 0, LANTERN_Y + 0.22, 0.66, 0.55, 0.52)
    h.holes.push(arch(new THREE.Path(), 0, LANTERN_Y + 0.28, 0.46, 0.55, 0.4))
    kDome.add(subtract(h, 0.03, face - 0.01).rotateY(a), brick)
  }
  eaveRing(kDome, 0, 0, LANTERN_Y + LANTERN_H - 0.05, LANTERN_R + 0.06, 8, brick, cornerStone)
  kDome.add(place(rotateG([[1.24, 0], [1.08, 0.1], [0.8, 0.45], [0.35, 0.72], [0.08, 0.86], [0, 0.88]], 16, [1, 1]), 0, LANTERN_Y + LANTERN_H + 0.14, 0), m.lead)
  finial(kDome, 0, LANTERN_Y + LANTERN_H + 0.95, 0, 0.75, m.gold)

  // Inner dome: square-to-octagon transition with unit triangles, molding, dome, lantern shaft
  const U_Y0 = 7.3, U_Y1 = 8.15, K = MID_X, kk = K * Math.tan(Math.PI / 8)
  const tri: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
    const a = V(sx * K, U_Y0, sz * K), mid = V(sx * (K + kk) / 2 * 0.98, U_Y0 + (U_Y1 - U_Y0) * 0.6, sz * (K + kk) / 2 * 0.98)
    const b = V(sx * K, U_Y1, sz * kk), c = V(sx * kk, U_Y1, sz * K)
    tri.push([a, b, mid], [a, mid, c], [b, c, mid])
  }
  kDome.add(triangles(tri), pbr({ color: '#8f8469', roughness: 0.92, side: THREE.DoubleSide, flatShading: true }))
  const ring = rect(-K, -K, K, K)
  ring.holes.push(new THREE.Path().absarc(0, 0, 2.86, 0, Math.PI * 2, true))
  kDome.add(new THREE.ShapeGeometry(ring, 28).rotateX(Math.PI / 2).translate(0, U_Y1 + 0.05, 0), innerPlaster)
  kDome.add(new THREE.TorusGeometry(2.88, 0.07, 6, 48).rotateX(Math.PI / 2).translate(0, U_Y1 + 0.08, 0), pbr({ color: '#b39c6d', roughness: 0.7 }))
  const innerK: P2[] = []
  for (let t = 0; t <= 14; t++) { const a = (t / 14) * Math.PI / 2 * 0.92; innerK.push([Math.max(2.86 * Math.cos(a), 0.4), 2.75 * Math.sin(a)]) }
  kDome.add(place(rotateG(innerK, 48, [1, 1]), 0, U_Y1 + 0.05, 0), pbr({ color: '#a29c8b', roughness: 0.92, side: THREE.DoubleSide }))
  const innerKLast = innerK[innerK.length - 1]
  const lanternY = U_Y1 + 0.05 + innerKLast[1]
  kDome.add(new THREE.TorusGeometry(innerKLast[0] + 0.04, 0.05, 6, 24).rotateX(Math.PI / 2).translate(0, lanternY - 0.02, 0), pbr({ color: '#8d6d3c', roughness: 0.6 }))
  kDome.add(new THREE.TorusGeometry(2.5, 0.04, 6, 48).rotateX(Math.PI / 2).translate(0, U_Y1 + 1.34, 0), pbr({ color: '#8d6d3c', roughness: 0.6 }))
  const lanternTip: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  for (let n = 0; n < 16; n++) {
    const a0 = (n / 16) * Math.PI * 2, a1 = ((n + 1) / 16) * Math.PI * 2, am = (a0 + a1) / 2, R0 = innerKLast[0] + 0.05, R1 = R0 + 0.42
    const y0 = lanternY - 0.04, y1 = lanternY - 0.22
    lanternTip.push([V(R0 * Math.cos(a0), y0, R0 * Math.sin(a0)), V(R0 * Math.cos(a1), y0, R0 * Math.sin(a1)), V(R1 * Math.cos(am), y1, R1 * Math.sin(am))])
  }
  kDome.add(triangles(lanternTip), pbr({ color: '#b08d55', roughness: 0.7, side: THREE.DoubleSide, flatShading: true }))
  const chimneyY = U_Y1 + 0.05 + innerKLast[1]
  kDome.add(place(cylinderG(innerKLast[0], innerKLast[0], LANTERN_Y + LANTERN_H - chimneyY, 8, true).rotateY(Math.PI / 8), 0, (LANTERN_Y + LANTERN_H + chimneyY) / 2, 0), pbr({ color: '#9f9988', roughness: 0.85, side: THREE.DoubleSide }))
  kDome.add(new THREE.CircleGeometry(innerKLast[0] + 0.1, 16).rotateX(Math.PI / 2).translate(0, LANTERN_Y + LANTERN_H - 0.02, 0), skyLight)

  // --- Mihrab: face from the photo (if available), window above; medallions on both sides ---
  const mihrabZ = IWAN_ING - 0.03
  const MG = 2.34, MH = 3.98, MY = IWAN + 0.02
  box(MG + 0.22, MH + 0.15, 0.3, m.goldDark, 0, MY + (MH + 0.15) / 2, mihrabZ - 0.15)
  const face = new THREE.PlaneGeometry(MG, MH).rotateY(Math.PI).translate(0, MY + MH / 2, mihrabZ - 0.31)
  k.add(face, mihrabFace)
  for (const s of [-1, 1]) {
    k.add(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 28).rotateX(Math.PI / 2).translate(s * 1.72, MY + MH - 0.05, mihrabZ - 0.03), m.dark)
    k.add(new THREE.TorusGeometry(0.42, 0.03, 6, 28).translate(s * 1.72, MY + MH - 0.05, mihrabZ - 0.06), m.gold)
    k.add(new THREE.PlaneGeometry(0.72, 0.72).rotateY(Math.PI).translate(s * 1.72, MY + MH - 0.05, mihrabZ - 0.055), rosette)
  }
  obstacle(-1.3, 1.3, mihrabZ - 0.5, IWAN_ING)

  // --- Minbar: kündekâri, kiosk and cone; reached by the stair (based on the photo) ---
  const MB = { x: -1.95, en: 1.3, z0: 5.1, z1: 9.1, h: 2.05 }
  const mbExt = (g: THREE.BufferGeometry, mat: Mat, z0 = MB.z0) => k.add(g.rotateY(-Math.PI / 2).translate(MB.x, 0, z0), mat)
  const length = MB.z1 - MB.z0
  for (const s of [-1, 1]) {
    const side = new THREE.Shape()
    side.moveTo(0.6, MY); side.lineTo(length, MY); side.lineTo(length, MY + MB.h + 0.95); side.lineTo(length - 0.05, MY + MB.h + 0.95); side.lineTo(0.9, MY + 0.9); side.lineTo(0.6, MY + 0.9); side.closePath()
    mbExt(subtract(side, 0.09, s * (MB.en / 2) - 0.045), kundekariDense)
    const top = new THREE.Shape()
    top.moveTo(0.9, MY + 0.9); top.lineTo(length - 0.05, MY + MB.h + 0.95); top.lineTo(length - 0.05, MY + MB.h + 1.1); top.lineTo(0.9, MY + 1.05); top.closePath()
    mbExt(subtract(top, 0.13, s * (MB.en / 2) - 0.065), m.walnut)
  }
  const STEP = 11
  for (let i = 0; i < STEP; i++) {
    const t = (i + 1) / STEP, h = MB.h * t, s = 0.6 + (i / STEP) * (length - 0.6)
    mbExt(boxG((length - 0.6) / STEP + 0.01, h, MB.en - 0.14).translate(s + (length - 0.6) / STEP / 2, MY + h / 2, 0), m.woodLattice)
  }
  // Door frame and crowned top
  for (const s of [-1, 1]) mbExt(boxG(0.3, 2.3, 0.16).translate(0.3, MY + 1.15, s * (MB.en / 2 - 0.04)), m.walnut)
  mbExt(boxG(0.3, 0.42, MB.en + 0.1).translate(0.3, MY + 2.5, 0), kundekariDense)
  mbExt(boxG(0.34, 0.08, MB.en + 0.16).translate(0.3, MY + 2.72, 0), m.goldDark)
  // Kiosk: four thin posts, wooden roof, pointed cone
  const kioskZ = MB.z1 + 0.05, kioskG = 1.0
  box(MB.en, MB.h + 0.02, kioskG, m.kundekari, MB.x, MY + (MB.h + 0.02) / 2, kioskZ + kioskG / 2)
  for (const a of [-1, 1]) for (const b of [0, 1]) box(0.1, 1.9, 0.1, m.walnut, MB.x + a * (MB.en / 2 - 0.05), MY + MB.h + 0.95, kioskZ + 0.05 + b * (kioskG - 0.1))
  box(MB.en + 0.14, 0.16, kioskG + 0.14, m.walnut, MB.x, MY + MB.h + 1.97, kioskZ + kioskG / 2)
  k.add(flatShadow(cylinderG(0.05, MB.en * 0.72, 1.7, 8)).scale(1, 1, kioskG / MB.en).translate(MB.x, MY + MB.h + 2.9, kioskZ + kioskG / 2), m.walnut)
  k.add(place(rotateG([[0.07, 0], [0.03, 0.14], [0.09, 0.26], [0.02, 0.44], [0, 0.46]], 8), MB.x, MY + MB.h + 3.72, kioskZ + kioskG / 2), m.gold)
  box(MB.en - 0.18, 1.7, 0.03, pbr({ color: '#1c4c37', roughness: 0.9 }), MB.x, MY + MB.h + 0.95, kioskZ + kioskG - 0.05)
  // Collision: side walls, door frame, kiosk; the stair between them is walkable.
  const mbx0 = MB.x - MB.en / 2, mbx1 = MB.x + MB.en / 2
  obstacle(mbx0 - 0.05, mbx0 + 0.05, MB.z0 + 0.6, MB.z1 + 1.05); obstacle(mbx1 - 0.05, mbx1 + 0.05, MB.z0 + 0.6, MB.z1 + 1.05)
  obstacle(mbx0, mbx1, MB.z1, IWAN_ING)
  floors.push({ x0: mbx0, x1: mbx1, z0: MB.z0 + 0.6, z1: MB.z1, h0: IWAN, h1: IWAN + MB.h })

  // Preaching pulpit (kürsü): small box with wooden lattice, left of the mihrab
  box(0.95, 1.15, 1.0, m.woodLattice, 2.1, MY + 0.575, 8.85)
  box(1.0, 0.08, 1.06, m.walnut, 2.1, MY + 1.2, 8.85)
  obstacle(1.6, 2.6, 8.35, 9.35)

  // Chandeliers
  const chandelier = (x: number, y: number, z: number, apex: number) => {
    k.add(place(cylinderG(0.012, 0.012, apex - y, 5), x, (apex + y) / 2, z), m.dark)
    for (const [r, dy, n] of [[0.42, 0, 10], [0.26, 0.28, 7], [0.13, 0.5, 5]] as const) {
      k.add(new THREE.TorusGeometry(r, 0.012, 5, 18).rotateX(Math.PI / 2).translate(x, y + dy, z), m.gold)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r
        k.add(new THREE.SphereGeometry(0.05, 6, 4).translate(px, y + dy - 0.08, pz), m.lamp)
        k.add(new THREE.PlaneGeometry(0.24, 0.24).translate(px, y + dy - 0.08, pz), m.lampHalo)
      }
    }
  }
  chandelier(0, 4.3, 7.9, 8.15)
  chandelier(0, 4.2, 0, 10.9)
  chandelier(KX, 3.8, 0.9, 7.9); chandelier(-KX, 3.8, 0.9, 7.9)

  // --- Minaret with şadırvan: six brick piers, arches, hexagonal drum, brick shaft and balcony (inventory p. 216) ---
  const corner = (i: number): P2 => [MIN_X + MIN_R * Math.cos(i * Math.PI / 3), MIN_Z + MIN_R * Math.sin(i * Math.PI / 3)]
  const LEG_D = 1.05, MIN_H1 = 5.4
  const sideG = MIN_R
  const mBow = (u: number) => ({ u, g: sideG - 1.45, y0: 0, flat: 3.05, kh: 1.55, tour: 'door' as const })
  for (let i = 0; i < 6; i++) {
    const [ax, az] = corner(i), [bx, bz] = corner(i + 1)
    wall(ax, az, bx, bz, LEG_D, MIN_H1, brick, brick, [mBow(sideG / 2)], { collide: false, bodyMat: brick })
    const y = local(ax, az, bx, bz)
    const ext = (g: THREE.BufferGeometry, mat: Mat) => { g.applyMatrix4(y.mat); uvWorld(g); k.add(g, mat) }
    archRing(ext, sideG / 2, 0, sideG - 1.45, 3.05, 1.55, 0.38, -0.07, 0.1)
    // Impost stone band and wooden tie rod
    for (const s of [0, 1]) ext(new THREE.BoxGeometry(0.72, 0.2, 0.12).translate(s * sideG + (s ? -0.36 : 0.36), 3.05, -0.05), cornerStone)
    ext(new THREE.BoxGeometry(sideG - 1.4, 0.2, 0.2).translate(sideG / 2, 2.98, LEG_D / 2), woodLight)
    eave(ax, az, bx, bz, MIN_H1 - 0.3)
    circles.push({ x: ax, z: az, r: 0.72 })
  }
  // Ceiling: small brick vault, base of the hanging octagonal body, iron stairs
  k.add(place(rotateG([[3.1, 0], [2.6, 0.55], [1.7, 0.95], [0.95, 1.1], [0.95, 1.12], [0, 1.12]], 24), MIN_X, 4.05, MIN_Z), brick)
  k.add(flatShadow(cylinderG(0.95, 0.95, 1.45, 8)).translate(MIN_X, 4.45, MIN_Z), pbr({ color: '#d9d4c7', roughness: 0.9 }))
  const stairs = new THREE.Vector3(MIN_X + 2.5, 0.12, MIN_Z + 1.2).sub(V(MIN_X + 0.75, 4.1, MIN_Z + 0.2))
  const mLen = stairs.length(), mMid = V(MIN_X + 1.62, 2.1, MIN_Z + 0.7)
  const dir = stairs.clone().normalize()
  for (const ofs of [-0.22, 0.22]) {
    const c = new THREE.CylinderGeometry(0.025, 0.025, mLen, 5)
    c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir)).translate(mMid.x - ofs * 0.5, mMid.y, mMid.z + ofs)
    k.add(c, iron)
  }
  for (let i = 1; i < 13; i++) {
    const p = V(MIN_X + 0.75, 4.1, MIN_Z + 0.2).addScaledVector(dir, (i / 13) * mLen)
    k.add(new THREE.BoxGeometry(0.03, 0.03, 0.46).translate(p.x, p.y, p.z), iron)
  }
  // Şadırvan: octagonal marble basin, iron railing, taps, stools (based on the photo)
  k.add(flatShadow(cylinderG(MIN_R + 0.35, MIN_R + 0.35, 0.14, 6).rotateY(Math.PI / 6)).translate(MIN_X, 0.09, MIN_Z), m.innerMarble)
  const HR = 1.2, HH = 1.2
  k.add(flatShadow(cylinderG(HR, HR, HH, 8).rotateY(Math.PI / 8)).translate(MIN_X, 0.16 + HH / 2, MIN_Z), basinMarble)
  k.add(place(cylinderG(HR - 0.08, HR - 0.08, 0.02, 24), MIN_X, 0.16 + HH + 0.02, MIN_Z), m.water)
  for (let n = 0; n < 8; n++) {
    const a = (n + 0.5) * Math.PI / 4, yu = HR * Math.cos(Math.PI / 8) + 0.015
    const s = arch(new THREE.Shape(), 0, 0.42, 0.68, 0.34, 0.26)
    s.holes.push(arch(new THREE.Path(), 0, 0.46, 0.58, 0.32, 0.2))
    k.add(subtract(s, 0.015, yu).rotateY(a).translate(MIN_X, 0, MIN_Z), m.marbleDark)
    k.add(new THREE.BoxGeometry(0.05, 0.05, 0.1).translate(0, 0.75, yu + 0.04).rotateY(a).translate(MIN_X, 0, MIN_Z), m.gold)
    k.add(new THREE.BoxGeometry(0.08, 0.06, 0.03).translate(0, 0.8, yu + 0.08).rotateY(a).translate(MIN_X, 0, MIN_Z), pbr({ color: '#b5392c', roughness: 0.5 }))
    const px = MIN_X + Math.sin(a) * 2.02, pz = MIN_Z + Math.cos(a) * 2.02
    k.add(place(rotateG([[0.17, 0], [0.11, 0.18], [0.17, 0.4]], 10), px, 0.14, pz), m.marbleDark)
    k.add(place(cylinderG(0.2, 0.2, 0.05, 12), px, 0.56, pz), m.walnut)
  }
  k.add(new THREE.TorusGeometry(HR + 0.03, 0.025, 5, 40).rotateX(Math.PI / 2).translate(MIN_X, 0.16 + HH + 0.55, MIN_Z), iron)
  k.add(new THREE.TorusGeometry(HR + 0.03, 0.018, 5, 40).rotateX(Math.PI / 2).translate(MIN_X, 0.16 + HH + 0.06, MIN_Z), iron)
  for (let n = 0; n < 26; n++) {
    const a = (n / 26) * Math.PI * 2
    k.add(new THREE.BoxGeometry(0.018, 0.5, 0.018).translate(MIN_X + Math.sin(a) * (HR + 0.03), 0.16 + HH + 0.3, MIN_Z + Math.cos(a) * (HR + 0.03)), iron)
  }
  circles.push({ x: MIN_X, z: MIN_Z, r: 1.32 })
  // Top: lead skirt, stone hexagonal drum, brick shaft, muqarnas balcony, marble railing, lead cone, finial
  const MIN_Y = MIN_H1 + 0.2
  const hexagon = (r: number, y0: number, y1: number, mat: Mat, top = r) => { const g = flatShadow(cylinderG(top, r, y1 - y0, 6).rotateY(Math.PI / 6)).translate(MIN_X, (y0 + y1) / 2, MIN_Z); kMinaret.add(uvWorld(g), mat) }
  hexagon(MIN_R + 0.3, MIN_Y, MIN_Y + 0.26, m.lead, MIN_R - 0.5)
  hexagon(MIN_R - 0.4, MIN_Y, MIN_Y + 2.15, alternatingStone())
  for (let i = 0; i < 6; i++) {
    const r = MIN_R - 0.4
    const p = (n: number): P2 => [MIN_X + r * Math.cos(n * Math.PI / 3), MIN_Z + r * Math.sin(n * Math.PI / 3)]
    const [ax, az] = p(i), [bx, bz] = p(i + 1)
    eave(ax, az, bx, bz, MIN_Y + 2.05, kMinaret)
  }
  hexagon(MIN_R - 0.2, MIN_Y + 2.5, MIN_Y + 2.72, m.lead, 1.2)
  const GOV = MIN_Y + 2.72
  const extM = (g: THREE.BufferGeometry, mat: Mat) => kMinaret.add(place(g, MIN_X, 0, MIN_Z), mat)
  extM(rotateG([[1.07, GOV - 0.05], [0.98, GOV + 5.1]], 28), brick)
  extM(new THREE.TorusGeometry(1.06, 0.05, 6, 28).rotateX(Math.PI / 2).translate(0, GOV + 0.45, 0), m.marble)
  const SER = GOV + 5.1
  for (let t = 0; t < 4; t++) {
    const r = 0.98 + t * 0.14, y = SER + t * 0.36
    extM(rotateG([[r, y], [r + 0.13, y + 0.36]], 26), brick)
    const count = 16
    for (let a = 0; a < count; a++) {
      const te = (a + (t % 2) * 0.5) * (Math.PI * 2) / count
      extM(new THREE.SphereGeometry(0.2, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.1, 0.5).translate(0, y + 0.04, r + 0.05).rotateY(te), brick)
    }
  }
  const SY = SER + 1.44
  extM(cylinderG(1.62, 1.62, 0.12, 28).translate(0, SY + 0.06, 0), m.marble)
  for (let a = 0; a < 18; a++) {
    const te = a * Math.PI * 2 / 18
    extM(boxG(0.5, 0.86, 0.1).translate(0, SY + 0.48, 1.58).rotateY(te), m.marble)
    extM(boxG(0.32, 0.14, 0.14).translate(0.12, SY + 1, 1.58).rotateY(te), m.marble)
  }
  extM(rotateG([[0.74, SY], [0.7, SY + 3.15]], 22), brick)
  // Small door
  extM(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, SY + 1.3, 0.34, 0.5, 0.3), 8).translate(0, 0, 0.72), m.dark)
  extM(rotateG([[0.74, SY + 3.12], [0.82, SY + 3.3], [0.78, SY + 3.75], [0.5, SY + 4.15], [0.14, SY + 4.42], [0.03, SY + 4.6]], 22, [1, 1]), m.lead)
  extM(rotateG([[0.06, SY + 4.6], [0.03, SY + 4.8], [0.1, SY + 4.95], [0.03, SY + 5.2], [0.07, SY + 5.32], [0.012, SY + 5.75], [0, SY + 5.8]], 10), m.gold)

  // Minaret square bollards
  for (let x = -22; x <= 30; x += 4.4) { for (const z of [-19.2, -11.3]) { if (x > -3 && x < 3 && z > -12) continue; box(0.1, 0.7, 0.1, iron, x, 0.4, z); box(0.12, 0.08, 0.12, m.gold, x, 0.62, z) } }

  // --- Imaret trace: did not survive to the present; only its position in the plan is shown with a low base (Ayverdi plan, inventory) ---
  const IM = { x0: -21.4, x1: -10.5, z0: -9.5, z1: -2.87 }
  for (const [a, b, c, d] of [[IM.x0, IM.z0, IM.x1, IM.z0], [IM.x0, IM.z1, IM.x1, IM.z1], [IM.x0, IM.z0, IM.x0, IM.z1]] as const) {
    const g = Math.abs(c - a) + 0.6, dd = Math.abs(d - b) + 0.6
    boxD(Math.max(g, 0.6), 0.55, Math.max(dd, 0.6), cornerStone, (a + c) / 2, 0.275, (b + d) / 2)
    obstacle(Math.min(a, c) - 0.3, Math.max(a, c) + 0.3, Math.min(b, d) - 0.3, Math.max(b, d) + 0.3)
  }
  for (const x of [-13.3, -18.5]) for (const z of [IM.z0, IM.z1]) box(1.05, 0.85, 0.8, cornerStone, x, 0.425, z)
  horizontal(IM.x0 + 0.3, IM.x1, IM.z0 + 0.3, IM.z1 - 0.3, 0.05, green)

  // --- Hamam: exterior mass to the west (inventory p. 220) ---
  bath()

  // --- Hazire: to the east and south, stepped graves (inventory p. 218) ---
  const HX0 = 11.4, HX1 = 31, HZ0 = -9.5, HZ1 = 17.2
  horizontal(HX0, HX1, HZ0, HZ1, 0.05, plaza)
  horizontal(-E - 0.5, HX0, IWAN_G + 0.9, HZ1, 0.05, plaza)
  // Iron fence: has a gate on the north.
  const fence = (x0: number, z0: number, x1: number, z1: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 1.2)
    for (let i = 0; i <= n; i++) {
      const t = i / n
      box(0.09, 1.55, 0.09, iron, x0 + (x1 - x0) * t, 0.78, z0 + (z1 - z0) * t)
    }
    const horizontalG = x1 === x0 ? 0.04 : L, deep = x1 === x0 ? L : 0.04
    for (const y of [0.25, 1.35]) box(horizontalG, 0.04, deep, iron, (x0 + x1) / 2, y, (z0 + z1) / 2)
    for (let i = 0; i < n * 5; i++) {
      const t = (i + 0.5) / (n * 5)
      box(0.018, 1.1, 0.018, iron, x0 + (x1 - x0) * t, 0.8, z0 + (z1 - z0) * t)
    }
    obstacle(Math.min(x0, x1) - 0.08, Math.max(x0, x1) + 0.08, Math.min(z0, z1) - 0.08, Math.max(z0, z1) + 0.08)
  }
  fence(HX0, HZ0, HX0 + 3.2, HZ0); fence(HX0 + 5.8, HZ0, HX1, HZ0); fence(HX1, HZ0, HX1, HZ1); fence(-E - 0.5, HZ1, HX1, HZ1); fence(-E - 0.5, WING_G + 0.1, -E - 0.5, HZ1)
  // Grave: stone tiers, head and foot headstones
  const grave = (x: number, z: number, en: number, len2: number, tier: number, dark: boolean, siwri = 1) => {
    let y = 0.05
    for (let i = 0; i < tier; i++) {
      const o = (tier - i - 1) * 0.22, h = 0.34
      boxD(en + o * 2, h, len2 + o * 2, pedestalStone, x, y + h / 2, z)
      box(0.03, h - 0.02, len2 + o * 2 + 0.005, cornerStone, x + en * 0.28, y + h / 2, z)
      y += h
    }
    box(en - 0.25, 0.32, len2 - 0.25, dark ? trunkTree : pedestalStone, x, y + 0.08, z)
    const headstone = (zs: number, sw: number, H: number) => {
      const s = new THREE.Shape()
      s.moveTo(-sw / 2, 0); s.lineTo(-sw / 2, H * 0.72)
      s.quadraticCurveTo(-sw / 2, H * 0.92, 0, H * siwri)
      s.quadraticCurveTo(sw / 2, H * 0.92, sw / 2, H * 0.72); s.lineTo(sw / 2, 0); s.closePath()
      const g = subtract(s, 0.17, -0.085)
      g.computeBoundingBox(); uvFit(g)
      k.add(place(g, x, y + 0.05, zs), dark ? graveDark : graveLight)
    }
    headstone(z + len2 / 2 - 0.2, en * 0.62, 1.45)
    headstone(z - len2 / 2 + 0.2, en * 0.48, 1.0)
    const o = (tier - 1) * 0.22
    obstacle(x - en / 2 - o, x + en / 2 + o, z - len2 / 2 - o, z + len2 / 2 + o)
  }
  const GRAVES: [number, number, number, number, number, boolean][] = [
    [17.6, 1.4, 1.4, 2.6, 3, true], // position of Kara Timurtaş Paşa's grave is representative
    [13.8, -1.2, 1.15, 2.2, 2, true], [13.9, 5.2, 1.2, 2.3, 3, false], [17.6, 7.6, 1.25, 2.4, 2, true], [21.8, 4.4, 1.3, 2.5, 3, false],
    [21.4, -2.6, 1.15, 2.2, 2, true], [25.6, 1.8, 1.2, 2.3, 2, false], [25.8, 8.6, 1.25, 2.4, 3, true], [21.2, 11, 1.15, 2.2, 2, false],
    [14.6, 12.8, 1.15, 2.2, 2, true], [8.4, 14.4, 1.15, 2.2, 2, false], [2.6, 14.2, 1.15, 2.2, 3, true], [-3.8, 14.4, 1.15, 2.2, 2, false],
    [27, -5.2, 1.15, 2.2, 2, true], [17.2, -6, 1.1, 2.1, 2, false],
  ]
  for (const [x, z, en, b, kd, ky] of GRAVES) grave(x, z, en, b, kd, ky)

  // Trees: the hazire's plane trees and cypresses (positions are representative)
  const tree = (x: number, z: number, lenNet: number, apexR: number, dark = false) => {
    const g = new THREE.CylinderGeometry(0.2, 0.42, lenNet, 9).translate(x, lenNet / 2, z)
    k.add(g, trunkTree)
    const mat = dark ? leafDark : leaf, piece = 4
    for (let i = 0; i < piece; i++) {
      const a = i * 2.4 + x, rr = apexR * (i === 0 ? 1 : 0.68), o = i === 0 ? 0 : apexR * 0.58
      const g2 = new THREE.IcosahedronGeometry(rr, 3)
      const p = g2.attributes.position
      for (let v = 0; v < p.count; v++) { const n = 1 + 0.15 * Math.sin(p.getX(v) * 2.6 + a) * Math.cos(p.getZ(v) * 2.2 + a) + 0.1 * Math.sin(p.getY(v) * 3.3); p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 0.8, p.getZ(v) * n) }
      const nr = g2.attributes.normal
      for (let v = 0; v < p.count; v++) { const l = Math.hypot(p.getX(v), p.getY(v), p.getZ(v)) || 1; nr.setXYZ(v, p.getX(v) / l, p.getY(v) / l, p.getZ(v) / l) }
      k.add(g2.translate(x + Math.cos(a) * o, lenNet + (i === 0 ? apexR * 0.25 : -apexR * 0.05), z + Math.sin(a) * o), mat)
    }
    circles.push({ x, z, r: 0.5 })
  }
  tree(29, 13.5, 9, 5, false); tree(16, 15.5, 8.5, 4.2, true); tree(30, 3, 8, 4.2, false); tree(24.7, 12.2, 7.5, 3.5, true); tree(-11.4, 14.2, 8, 4, false)
  const cypress = (x: number, z: number, b: number) => {
    const p: P2[] = [[0.12, 0.2], [0.9, 1.4], [1.15, b * 0.3], [1.05, b * 0.5], [0.72, b * 0.72], [0.28, b * 0.92], [0, b]]
    const g = rotateG(p, 14)
    k.add(place(g, x, 0, z), m.cypress)
    circles.push({ x, z, r: 0.7 })
  }
  cypress(-22.6, 3, 11); cypress(-5, -33, 11); cypress(30.2, -33.5, 10); cypress(30.4, 9.5, 12); cypress(-8, 15.8, 10.5)

  // --- Walking area ---
  floors.push(
    { x0: -2.9, x1: 2.9, z0: -10.7, z1: FRONT, h0: 0, h1: IC },
    { x0: -E + 1.1, x1: E - 1.1, z0: FRONT, z1: SC_BACK, h0: IC, h1: IC },
    { x0: -MID_X, x1: MID_X, z0: SC_BACK, z1: 2.6, h0: IC, h1: IC },
    { x0: -IWAN_X, x1: IWAN_X, z0: 2.6, z1: 3.4, h0: IC, h1: IWAN },
    { x0: -IWAN_X, x1: IWAN_X, z0: 3.4, z1: IWAN_ING, h0: IWAN, h1: IWAN },
    { x0: WING_IN_X, x1: E - 1.1, z0: MID_K, z1: WING_G_IN, h0: IC, h1: IC },
    { x0: -E + 1.1, x1: -WING_IN_X, z0: MID_K, z1: WING_G_IN, h0: IC, h1: IC },
    { x0: MID_X, x1: WING_IN_X, z0: MID_K, z1: MID_G, h0: IC, h1: IC },
    { x0: -WING_IN_X, x1: -MID_X, z0: MID_K, z1: MID_G, h0: IC, h1: IC },
    { x0: 5.5, x1: 8.3, z0: SC_BACK, z1: MID_K, h0: IC, h1: IC },
    { x0: -8.3, x1: -5.5, z0: SC_BACK, z1: MID_K, h0: IC, h1: IC },
  )
  // The hamam mass outside the walking boundary is not in the obstacle list; it stays east of the boundary.
  const kay = (b: Box): Box => ({ ...b, x0: b.x0 + OX, x1: b.x1 + OX, z0: b.z0, z1: b.z1 })
  const walking: InteriorWalk = {
    limit: { x0: -23 + OX, x1: 30.6 + OX, z0: -35, z1: 16.8, circle: { x: 0, z: 0, r: R_FLOOR * Math.cos(Math.PI / 72) } },
    boxes: boxes.map(kay),
    circles: circles.map((d) => ({ ...d, x: d.x + OX })),
    floors: floors.map((z) => ({ ...z, x0: z.x0 + OX, x1: z.x1 + OX })),
    viewBlockers: viewBlockers.map(kay),
    eyeY: BAY,
    baseY: 0,
  }

  const stop = (id: string, ad: string, x: number, z: number, h: number, bx: number, by: number, bz: number): InteriorStop => ({ id, ad, position: [x + OX, BAY + h, z], look: [bx + OX, by, bz] })
  const stops: InteriorStop[] = [
    stop('facade', 'Cephe', -3.5, -18.2, 0, 0, 4.2, FRONT),
    stop('narthex', 'Son cemaat yeri', -6.4, -6.2, IC, 2, 4.6, -6.3),
    stop('mid-dome', 'Orta kubbe', 0, -2, IC, 0, 12, 0.7),
    stop('mihrab', 'Mihrap', 0.5, 4.2, IWAN, 0, 3.4, IWAN_ING),
    stop('minbar', 'Minbere çık', MB.x, 7.8, IWAN + MB.h * ((7.8 - MB.z0 - 0.6) / (MB.z1 - MB.z0 - 0.6)), 0.5, 3.4, 3.5),
    stop('zawiya', 'Zaviye', 6.8, -1.6, IC, 6.6, 3, 4.6),
    stop('fountain', 'Şadırvan', MIN_X - 1.6, MIN_Z + 1.75, 0, MIN_X + 0.3, 1.25, MIN_Z - 3),
    stop('minaret', 'Minare', MIN_X - 9, -14.5, 0, MIN_X, 10, MIN_Z),
    stop('imaret', 'İmaret izi', -12, -12, 0, -17, 0.6, -6),
    stop('graveyard', 'Hazire', 19.8, -7.6, 0, 16.8, 1.6, 1.4),
  ]

  // --- Layers ---
  const root = k.group()
  const roofGroup = kRoof.group(), domeGroup = kDome.group(), minaretGroup = kMinaret.group()
  root.add(roofGroup, domeGroup, minaretGroup)
  // Plan dimensions are kept; geometry is shifted once to place it in the scene (the shader position stays the same too).
  root.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.translate(OX, 0, 0) })

  return {
    root,
    layers: [
      { group: roofGroup, height: 13, ad: 'Çatı ve tonozlar' },
      { group: domeGroup, height: 26, ad: 'Kubbeler' },
      { group: minaretGroup, height: 17, ad: 'Minare gövdesi' },
    ],
    stops,
    walking,
    camera: { position: [OX + 30, 24, -66], target: [OX - 9, 6, -8] },
    pedestalRadius: 54,
    innerLights: [[OX, 4.8, -0.4], [OX, 4.9, 7.4], [OX + 6.7, 4.4, 1], [OX - 6.7, 4.4, 1]],
  }

  function alternatingStone() {
    return pbr({ map: ashlarTexture(), roughness: 0.92 })
  }

  /** Grooved lead dome profile. */
  function domeProfile(r: number, h: number): P2[] {
    const p: P2[] = []
    for (let t = 0; t <= 14; t++) { const a = (t / 14) * Math.PI / 2; p.push([Math.max(r * Math.cos(a) ** 0.88, 0.001), h * Math.sin(a) ** 1.08]) }
    return p
  }

  function finial(kv: Bucket, x: number, y: number, z: number, H: number, mat: Mat) {
    kv.add(place(rotateG([[0.1, 0], [0.04, H * 0.22], [0.12, H * 0.42], [0.04, H * 0.62], [0.015, H], [0, H * 1.02]], 8), x, y, z), mat)
  }

  /** Polygonal drum eave: stone molding and brick tooth ring. */
  function eaveRing(kv: Bucket, x: number, z: number, y: number, r: number, n: number, outer: Mat, stone: Mat) {
    const ofs = Math.PI / n
    kv.add(flatShadow(cylinderG(r + 0.28, r + 0.28, 0.1, n).rotateY(ofs)).translate(x, y + 0.08, z), stone)
    const count = Math.max(12, Math.round((2 * Math.PI * r) / 0.3))
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const ap = r * Math.cos(Math.PI / n) / Math.cos(((a + 2 * Math.PI) % (2 * Math.PI / n)) - Math.PI / n)
      kv.add(new THREE.BoxGeometry(0.16, 0.13, 0.16).rotateY(a + Math.PI / 4).translate(x + Math.sin(a) * ap, y - 0.06, z + Math.cos(a) * ap), outer)
    }
  }

  function bath() {
    const W0 = -60, W1 = W0 + 18.35, Z0 = -10.2, Z1 = 10.2, H_D = 8.2
    const hExt = (g: THREE.BufferGeometry, mat: Mat, kv = k) => kv.add(uvWorld(g), mat)
    const buildWall = (ax: number, az: number, bx: number, bz: number, h: number, open: Opening[] = []) => wall(ax, az, bx, bz, 1.3, h, rubble, rubble, open, { collide: false })
    const hp = (u: number): Opening => ({ u, g: 0.72, y0: 1.2, flat: 0.75, kh: 0, tour: 'window' })
    // Cold room: interior 15.75 x 17.85 m, domed.
    buildWall(W0, Z0, W1, Z0, H_D, [hp(4.2), { u: 9.2, g: 1.5, y0: 0, flat: 2.1, kh: 0.8, tour: 'door' }, hp(14.2)])
    buildWall(W1, Z0, W1, Z1, H_D)
    buildWall(W1, Z1, W0, Z1, H_D, [hp(5.2), hp(13.4)])
    buildWall(W0, Z1, W0, Z0, H_D, [hp(5.2), hp(15.3)])
    // Crown portal hood: seven rows of stalactites (inventory p. 220)
    const kx = W0 + 9.2, kz = Z0
    for (let i = 0; i < 7; i++) {
      const o = 1 - i / 7, g = 2.3 * o + 0.3, d = 0.55 * o + 0.1, y = 3.1 + i * 0.16
      k.add(uvWorld(new THREE.BoxGeometry(g, 0.15, d).translate(kx, y, kz - d / 2 + 0.02)), cornerStone)
    }
    k.add(new THREE.BoxGeometry(3, 2.5, 0.15).translate(kx, 3.25 + 0.55, kz - 0.02), cornerStone)
    k.add(new THREE.BoxGeometry(1.5, 2.3, 0.08).translate(kx, 1.15, kz + 0.55), m.dark)
    for (const [ax, az, bx, bz] of [[W0, Z0, W1, Z0], [W1, Z0, W1, Z1], [W1, Z1, W0, Z1], [W0, Z1, W0, Z0]]) eave(ax, az, bx, bz, H_D - 0.2, k)
    // Band with chamfered corners on top (based on the photo)
    const cx = (W0 + W1) / 2
    const kU = Math.min(W1 - W0, Z1 - Z0) / 2 - 0.25
    hExt(flatShadow(cylinderG(kU * 1.08, kU * 1.08, 1.5, 8).rotateY(Math.PI / 8)).translate(cx, H_D + 0.75, 0), rubble, kRoof)
    kRoof.add(new THREE.PlaneGeometry(W1 - W0 + 0.5, Z1 - Z0 + 0.5).rotateX(-Math.PI / 2).translate(cx, H_D + 0.22, 0), m.lead)
    eaveRing(kRoof, cx, 0, H_D + 1.45, kU * 1.08, 8, brick, cornerStone)
    // Dome: grooved tiles, lantern on top
    const R = kU * 0.99, HK = 6.1, apexY = H_D + 1.58
    kDome.add(place(rotateG(domeProfile(R, HK), 64, [1, 1]), cx, apexY, 0), roofTile)
    kDome.add(flatShadow(cylinderG(0.95, 0.95, 1.5, 8).rotateY(Math.PI / 8)).translate(cx, apexY + HK + 0.55, 0), pbr({ map: tg.color, roughness: 0.9 }))
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4, yu = 0.95 * Math.cos(Math.PI / 8) + 0.02
      kDome.add(new THREE.PlaneGeometry(0.42, 0.75).translate(0, apexY + HK + 0.55, yu).rotateY(a).translate(cx, 0, 0), glassOuter)
    }
    kDome.add(place(rotateG([[1.1, 0], [0.9, 0.08], [0.4, 0.48], [0.05, 0.62]], 8, [1, 1]), cx, apexY + HK + 1.3, 0), roofTile)
    finial(kDome, cx, apexY + HK + 1.9, 0, 0.5, m.gold)
    // Warm and hot rooms: low body, domes with holes (based on the photo); furnace (külhan) to the east.
    const X0 = W1, X1 = -24.5, ZB = 7, HA = 5.2
    buildWall(X0, -ZB, X1, -ZB, HA, [hp(5.4), hp(11.8)])
    buildWall(X1, -ZB, X1, ZB, HA)
    buildWall(X1, ZB, X0, ZB, HA, [hp(4.6), hp(10.9)])
    for (const [ax, az, bx, bz] of [[X0, -ZB, X1, -ZB], [X1, -ZB, X1, ZB], [X1, ZB, X0, ZB]]) eave(ax, az, bx, bz, HA - 0.2, k)
    kRoof.add(new THREE.PlaneGeometry(X1 - X0 + 0.5, ZB * 2 + 0.5).rotateX(-Math.PI / 2).translate((X0 + X1) / 2, HA + 0.22, 0), bathPlaster)
    const bayed = (x: number, z: number, r: number, h: number) => {
      kDome.add(place(rotateG(domeProfile(r, h), 28, [1, 1]), x, HA + 0.22, z), bathPlaster)
      const line = 5
      for (let s = 0; s < line; s++) {
        const a = ((s + 0.6) / line) * Math.PI * 0.46
        const yar = r * Math.cos(a) ** 0.88, y = h * Math.sin(a) ** 1.08
        const count = Math.max(3, Math.round((yar * 2 * Math.PI) / 1.0))
        for (let n = 0; n < count; n++) {
          const t = (n + (s % 2) * 0.5) / count * Math.PI * 2
          const c = new THREE.CylinderGeometry(0.1, 0.13, 0.1, 8).rotateX(Math.PI / 2 - a * 1.2).rotateY(t)
          kDome.add(c.translate(x + Math.sin(t) * yar, HA + 0.25 + y, z + Math.cos(t) * yar), n % 3 ? m.dark : glassOuter)
        }
      }
    }
    bayed((X0 + X1) / 2, 0, 4.5, 3)
    for (const [dx, dz] of [[-6.2, 4.1], [-6.2, -4.1], [6.2, 4.1], [6.2, -4.1]]) bayed((X0 + X1) / 2 + dx, dz, 2.25, 1.65)
    k.add(uvWorld(place(new THREE.BoxGeometry(1.2, 7.6, 1.2), X1 - 0.7, 3.8, -5.4)), brick)
  }
}
