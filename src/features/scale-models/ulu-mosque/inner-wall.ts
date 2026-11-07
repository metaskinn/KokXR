// Ulu Camii inner wall: interior view of the windows, lower-row niches and the Kaaba cover showcase.
// Forms from archive photos: upper window and showcase ERD05018, qibla window ERD05161, niche and crest DJI_0288.
// Textures are perspective-corrected crops of these photos made with scripts/ulu_inner_wall_crop.py; no writing is drawn.
// The showcase's size and position on the wall are representative.
import * as THREE from 'three'
import type { UluMosqueMaterials } from '../uluMosqueTextures'
import { WALL, Bucket, YX, subtract, boxG, pz, cylinderG, type Mat, place } from '../uluMosquePiece'

const FLOOR = 0.7

// Cells in the interior-window.webp atlas (pixels: x0, y0, x1, y1). Must match scripts/ulu_inner_wall_crop.py.
type Cell = readonly [number, number, number, number]
const CAGE: Cell = [0, 0, 624, 1024]
const QIBLA: Cell = [684, 340, 964, 880]
const CREST: Cell = [661, 4, 986, 334]
/** Size of the crest on the wall (m): its lower edge is at the arch springing, its inner curve sits on the outer ring. */
const CREST_G = 2.52, CREST_Y = 2.56
const RED: Cell = [650, 910, 690, 950]
const CAM: Cell = [730, 910, 770, 950]
const BROWN: Cell = [810, 910, 850, 950]
const CAM_BOTTOM: Cell = [890, 910, 930, 950]

/** Fits the geometry's UVs from its bounding box onto an atlas cell. */
function snapToCell<G extends THREE.BufferGeometry>(g: G, [x0, y0, x1, y1]: Cell) {
  g.computeBoundingBox()
  const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv
  if (!b) return g
  const w = b.max.x - b.min.x || 1, h = b.max.y - b.min.y || 1
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) - b.min.x) / w, v = (p.getY(i) - b.min.y) / h
    uv.setXY(i, (x0 + u * (x1 - x0)) / 1024, 1 - (y1 - v * (y1 - y0)) / 1024)
  }
  return g
}

/** Round-arched opening: the window and niche mouth in the photos. */
function round<P extends THREE.Path>(p: P, y0: number, g: number, flat: number, burden: number, cx = 0): P {
  const o = g / 2
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, y0 + flat)
  p.absellipse(cx, y0 + flat, o, burden, Math.PI, 0, true, 0)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

/** Ring on the wall face: an arch whose outside projects by `d`. */
function ring(y0: number, g: number, flat: number, burden: number, d: number, bottomDesign = true) {
  const s = round(new THREE.Shape(), bottomDesign ? y0 - d : y0, g + d * 2, bottomDesign ? flat + d : flat, burden + d)
  s.holes.push(round(new THREE.Path(), y0, g, flat, burden))
  return s
}

type Wall = { k: Bucket; m: UluMosqueMaterials; cx: number; x: number; z: number; ry: number }

/** Pieces are built facing the room at +z, assuming the wall face at z = 0 and the window axis at x = 0. */
const wallAddon = ({ k, cx, x, z, ry }: Wall) => (g: THREE.BufferGeometry, mat: Mat) =>
  k.add(place(g.rotateY(Math.PI).translate(cx, 0, -WALL), x, 0, z, ry), mat)

/** Without the photo (public build) a flat-colored fallback is used. */
const hasPhoto = (m: UluMosqueMaterials) => Boolean(m.windowInner.map)

/** Upper-row window: red-brown painted band with a plaster lattice inside. In the middle of the qibla, a carved lattice and dark arched niche. */
export function innerWindowTop(k: Bucket, m: UluMosqueMaterials, cx: number, py: number, qibla: boolean, x: number, z: number, ry: number): THREE.Path {
  const ext = wallAddon({ k, m, cx, x, z, ry })
  const y0 = qibla ? 9 : 7.2 + py, g = qibla ? 1.7 : 2.2, flat = qibla ? 2.25 : 2.55, burden = qibla ? 1.03 : 1.05
  const photo = hasPhoto(m)
  const colored = (s: THREE.Shape, z0: number, cell: Cell) => {
    const a = new THREE.ShapeGeometry(s, 16).translate(0, 0, z0)
    if (photo) ext(snapToCell(a, cell), m.windowInner)
    else ext(a, m.dark)
  }
  const board = new THREE.ShapeGeometry(round(new THREE.Shape(), y0, g, flat, burden), 16).translate(0, 0, qibla ? -0.12 : -0.07)
  ext(snapToCell(board, qibla ? QIBLA : CAGE), m.windowInner)
  if (!photo) {
    // The public build doesn't use the photo atlas; don't leave the lattice as a flat dark void.
    const step = g / 6, r = step * 0.44
    for (let j = 0; j < 10; j++) for (let i = 0; i < 6; i++) {
      const xx = -g / 2 + step * (i + 0.5 + (j % 2) * 0.35)
      const yy = y0 + step * (j + 0.5)
      const ceiling = y0 + flat + burden * Math.sqrt(Math.max(0, 1 - (xx / (g / 2)) ** 2))
      if (Math.abs(xx) + r > g / 2 || yy + r > ceiling) continue
      ext(new THREE.TorusGeometry(r, 0.022, 4, 10).translate(xx, yy, -0.045), m.cream)
    }
  }
  if (qibla) {
    colored(ring(y0, g, flat, burden, 0.3), 0.008, BROWN)
    ext(new THREE.ShapeGeometry(ring(y0, g, flat, burden, 0.36), 16).translate(0, 0, 0.004), m.goldDark)
    ext(boxG(g + 0.8, 0.12, 0.1).translate(0, y0 - 0.33, 0.05), m.walnut)
  } else {
    colored(ring(y0, g, flat, burden, 0.25), 0.008, RED)
    ext(new THREE.ShapeGeometry(ring(y0, g, flat, burden, 0.28), 16).translate(0, 0, 0.004), m.dark)
  }
  return round(new THREE.Path(), y0, g, flat, burden, cx)
}

/** Lower row: arched niche, painted ring and leafy crest, with a walnut-framed rectangular window at the bottom (DJI_0288). */
export function innerWindowBottom(k: Bucket, m: UluMosqueMaterials, cx: number, x: number, z: number, ry: number): THREE.Path {
  const ext = wallAddon({ k, m, cx, x, z, ry })
  const y0 = 1, G = 2.05, FLAT = 3.1, LOAD = 1.385
  // Back face of the niche: as bright as the outer window opening
  const back = round(new THREE.Shape(), y0, G, FLAT, LOAD)
  const PX = 0.8, P0 = 2, P1 = 4.1
  const hole = new THREE.Path()
  hole.moveTo(-PX, P0); hole.lineTo(-PX, P1); hole.lineTo(PX, P1); hole.lineTo(PX, P0); hole.closePath()
  back.holes.push(hole)
  ext(new THREE.ShapeGeometry(back, 16).translate(0, 0, -0.17), m.inner)
  // Panes and frame
  const glass = new THREE.PlaneGeometry(PX * 2, P1 - P0).translate(0, (P0 + P1) / 2, -0.165)
  if (hasPhoto(m)) ext(snapToCell(glass, CAM_BOTTOM), m.windowInner)
  else ext(glass, m.dark)
  const MULLIONS = 4, ROW = 5
  for (let i = 0; i <= MULLIONS; i++) {
    const t = i === 0 || i === MULLIONS ? 0.09 : i === MULLIONS / 2 ? 0.08 : 0.035
    ext(boxG(t, P1 - P0 + 0.09, 0.08).translate(-PX + (i * PX * 2) / MULLIONS, (P0 + P1) / 2, -0.12), m.walnut)
  }
  for (let j = 0; j <= ROW; j++) {
    const t = j === 0 || j === ROW ? 0.09 : 0.035
    ext(boxG(PX * 2 + 0.09, t, 0.08).translate(0, P0 + (j * (P1 - P0)) / ROW, -0.12), m.walnut)
  }
  // Small hexagonal opening above the window
  const hexagon = new THREE.CircleGeometry(0.16, 6).rotateZ(Math.PI / 6).translate(0, FLAT + y0 + 0.5, -0.165)
  if (hasPhoto(m)) ext(snapToCell(hexagon, BROWN), m.windowInner)
  else ext(hexagon, m.dark)
  ext(new THREE.TorusGeometry(0.17, 0.02, 4, 6).rotateZ(Math.PI / 6).translate(0, FLAT + y0 + 0.5, -0.16), m.walnut)
  // Niche bottom and arch rings: dark inner line, cream band, dark outer line
  ext(boxG(G + 0.1, 0.12, 0.3).translate(0, y0 + 0.02, -0.05), m.cream)
  ext(subtract(ring(y0, G, FLAT, LOAD, 0.05, false), 0.03, 0.012), m.dark)
  ext(subtract(ring(y0, G + 0.1, FLAT, LOAD + 0.05, 0.1, false), 0.03, 0.006), m.cream)
  ext(subtract(ring(y0, G + 0.3, FLAT, LOAD + 0.15, 0.035, false), 0.02, 0.006), m.dark)
  // Crest: above the arch, a photo crop with a transparent-cut edge
  if (hasPhoto(m)) {
    ext(snapToCell(new THREE.PlaneGeometry(CREST_G, CREST_Y).translate(0, y0 + FLAT + CREST_Y / 2, 0.004), CREST), m.windowInner)
  }
  return round(new THREE.Path(), y0, G, FLAT, LOAD, cx)
}

/** Top-down footprint of the showcase: collision box (uluMosqueInterior). */
const SHOWCASE_G = 4.3, SHOWCASE_D = 1.2, SHOWCASE_Z = pz(0.5) + 2.2
export const KAABA_SHOWCASE = { x0: YX - WALL - SHOWCASE_D, x1: YX - WALL, z0: SHOWCASE_Z - SHOWCASE_G / 2, z1: SHOWCASE_Z + SHOWCASE_G / 2 }

/** Cover of the Kaaba door: a lit, backward-tilted showcase at the foot of the east wall (ERD05018). */
export function kaabaShowcase(k: Bucket, m: UluMosqueMaterials) {
  const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, YX - WALL, 0, SHOWCASE_Z, -Math.PI / 2), mat)
  const G = SHOWCASE_G, D = SHOWCASE_D, LEG = FLOOR + 0.35, TOP = LEG + 3.2, TOP_Z = 0.2
  const L = Math.hypot(TOP - LEG, D - TOP_Z), SLOPE = Math.atan2(D - TOP_Z, TOP - LEG)
  /** Tilted panel: y runs along the panel (0 = bottom edge), its +z face looks into the room. */
  const board = (g: THREE.BufferGeometry, mat: Mat) => ext(g.rotateX(-SLOPE).translate(0, LEG, D), mat)

  // Foot, top and side walls
  ext(boxG(G, LEG - FLOOR, D).translate(0, (LEG + FLOOR) / 2, D / 2), m.cream)
  for (const s of [-1 / 3, 1 / 3]) ext(boxG(0.012, LEG - FLOOR, 0.01).translate(s * G, (LEG + FLOOR) / 2, D + 0.002), m.dark)
  ext(boxG(G + 0.08, 0.14, TOP_Z + 0.12).translate(0, TOP + 0.07, (TOP_Z + 0.12) / 2), m.cream)
  const side = new THREE.Shape()
  side.moveTo(0, LEG); side.lineTo(D, LEG); side.lineTo(TOP_Z, TOP); side.lineTo(0, TOP); side.closePath()
  for (const s of [-1, 1]) ext(subtract(side, 0.06).rotateY(-Math.PI / 2).translate(s * (G / 2 - 0.03) + 0.03, 0, 0), m.cream)

  // Panel: cream frame, dark background, the cover, light strip on the left and bottom
  const C = 0.15
  board(boxG(G, C, 0.1).translate(0, C / 2, 0.02), m.cream)
  board(boxG(G, C, 0.1).translate(0, L - C / 2, 0.02), m.cream)
  for (const s of [-1, 1]) board(boxG(C, L, 0.1).translate(s * (G / 2 - C / 2), L / 2, 0.02), m.cream)
  const background = new THREE.PlaneGeometry(G - C * 2, L - C * 2).translate(0, L / 2, 0)
  if (hasPhoto(m)) board(snapToCell(background, CAM), m.windowInner)
  else board(background, m.dark)
  const COVER_Y = L - C * 2 - 0.1, COVER_G = (COVER_Y * 1400) / 1180, RIGHT = (G - C * 2 - COVER_G) / 2 - 0.04
  board(new THREE.PlaneGeometry(COVER_G, COVER_Y).translate(RIGHT, L / 2, 0.012), m.kaabaCover)
  board(new THREE.PlaneGeometry(0.03, L - C * 2 - 0.04).translate(-G / 2 + C + 0.05, L / 2, 0.014), m.lamp)
  board(new THREE.PlaneGeometry(G - C * 2, 0.018).translate(0, C + 0.012, 0.016), m.lamp)
}

/** ERD05018: the glass case adjoining the cover showcase and the open lattice above it.
 * Photo proportions are used; the placement is representative at model scale. +z looks into the room.
 */
export const COVER_SIDE_KIOSK = {
  x0: YX - WALL - 3.5, x1: YX - WALL,
  z0: SHOWCASE_Z - SHOWCASE_G / 2 - 4.36,
  z1: SHOWCASE_Z - SHOWCASE_G / 2 - 0.16,
}

export function coverSideKiosk(k: Bucket, m: UluMosqueMaterials) {
  const G = 4.2, D = 3.5, T = FLOOR + 3.1
  const glass = new THREE.MeshStandardMaterial({ color: '#918a77', transparent: true, opacity: 0.38,
    depthWrite: false, roughness: 0.72, side: THREE.DoubleSide })
  const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, YX - WALL, 0,
    (COVER_SIDE_KIOSK.z0 + COVER_SIDE_KIOSK.z1) / 2, -Math.PI / 2), mat)
  ext(boxG(G, 0.15, D).translate(0, FLOOR + 0.075, D / 2), m.cream)
  ext(boxG(G + 0.22, 0.28, D + 0.12).translate(0, T, D / 2), m.cream)
  // Front and both sides: thin cream frame in front of dark, semi-transparent glass.
  const face = (long: number, cx: number, cz: number, a: number) => {
    const e = (g: THREE.BufferGeometry, mat: Mat) => ext(g.rotateY(a).translate(cx, 0, cz), mat)
    e(boxG(long, 0.62, 0.12).translate(0, FLOOR + 0.43, 0), m.cream)
    e(new THREE.PlaneGeometry(long - 0.08, 2.08).translate(0, FLOOR + 1.78, 0), glass)
    const cols = Math.round(long / 0.7)
    for (let n = 0; n <= cols; n++) {
      const x = -long / 2 + n * long / cols
      e(boxG(0.055, 2.2, 0.09).translate(x, FLOOR + 1.8, 0.03), m.cream)
    }
    // Dense drop/oval openings with gold rosettes between them; the gaps are truly open.
    const bays = Math.round(long / 0.28)
    for (let n = 0; n < bays; n++) for (const y of [T + 0.4, T + 0.95]) {
      const x = -long / 2 + (n + 0.5) * long / bays
      e(new THREE.TorusGeometry(0.12, 0.014, 4, 12).scale(0.8, 1.8, 1).translate(x, y, 0), m.cream)
      e(new THREE.TorusGeometry(0.045, 0.016, 4, 8).translate(x, y - 0.26, 0.018), m.gold)
    }
    for (const y of [FLOOR + 0.79, FLOOR + 1.63, T - 0.28])
      e(boxG(long, 0.055, 0.09).translate(0, y, 0.035), m.cream)
    // Round-arched glass transoms.
    for (let n = 0; n < Math.round(long / 1.4); n++) {
      const x = -long / 2 + (n + 0.5) * long / Math.round(long / 1.4)
      e(new THREE.TorusGeometry(0.54, 0.025, 4, 16, Math.PI).translate(x, T - 0.61, 0.05), m.cream)
    }
    for (const y of [T + 0.16, T + 0.68, T + 1.24])
      e(boxG(long + 0.08, 0.06, 0.08).translate(0, y, 0), m.goldDark)
  }
  face(G, 0, D, 0)
  face(D, -G / 2, D / 2, -Math.PI / 2)
  face(D, G / 2, D / 2, Math.PI / 2)
  // Thin fluted columns, wide base, prominent gold capital.
  for (const x of [-G / 2, 0, G / 2]) for (const z of [0.1, D]) {
    ext(cylinderG(0.13, 0.15, 2.78, 12).translate(x, FLOOR + 1.5, z), m.cream)
    ext(cylinderG(0.23, 0.25, 0.1, 12).translate(x, FLOOR + 0.14, z), m.cream)
    ext(cylinderG(0.22, 0.15, 0.18, 12).translate(x, T - 0.29, z), m.gold)
    ext(boxG(0.43, 0.08, 0.43).translate(x, T - 0.17, z), m.gold)
  }
}
