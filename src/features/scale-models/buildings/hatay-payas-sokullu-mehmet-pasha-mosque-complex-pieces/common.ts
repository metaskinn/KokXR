// Materials and simple geometry helpers for the Sokullu Mehmet Paşa Complex (Payas) model.
// All textures are drawn on canvas; no photo is used. Colours follow the book's photos (Hatay Vakıf Eserleri, pp. 94–119):
// yellow-grey cut stone, lead domes, and the red-white-black striped portals the text describes.
import * as THREE from 'three'
import { Bucket, boxG, cylinderG, rotateG, flatShadow, place, arch, subtract } from '../../uluMosquePiece'
import { lightDevice, random } from '../../uluMosqueFloor'

export type Mat = THREE.Material

function canvas(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const el = document.createElement('canvas')
  el.width = w; el.height = h
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  draw(c, w, h)
  return el
}
function texture(el: HTMLCanvasElement, mx: number, my: number, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / mx, 1 / my)
  t.anisotropy = lightDevice() ? 4 : 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Cut stone courses (512 px = 4 m). */
function ashlarCanvas(seed: number, base: string, tones: string[]) {
  const r = random(seed)
  return canvas(512, 512, (c, W, H) => {
    c.fillStyle = base; c.fillRect(0, 0, W, H)
    const ROW = 9, h = H / ROW
    for (let s = 0; s < ROW; s++) {
      let x = -r() * 60
      while (x < W) {
        const w = 50 + r() * 70
        c.fillStyle = tones[Math.floor(r() * tones.length)]
        c.fillRect(x + 1.5, s * h + 1.5, w - 3, h - 3)
        x += w
      }
    }
  })
}

/** Red, white and black stone courses of the portals (book pp. 102, 104); 256 px = 1.2 m. */
function stripedCanvas() {
  return canvas(64, 256, (c, W, H) => {
    const colors = ['#efe9dc', '#9a3a2c', '#efe9dc', '#2b2a28']
    const h = H / colors.length
    colors.forEach((k, i) => { c.fillStyle = k; c.fillRect(0, i * h, W, h - 2) })
  })
}

/** Mihrab stone courses: black, off-white and pink (book p. 115); 256 px = 1 m. */
function mihrabCanvas() {
  return canvas(64, 256, (c, W, H) => {
    const colors = ['#ebe4d6', '#c98f8a', '#ebe4d6', '#25221f']
    const h = H / colors.length
    colors.forEach((k, i) => { c.fillStyle = k; c.fillRect(0, i * h, W, h - 2) })
  })
}

function pavingCanvas(seed: number) {
  const r = random(seed)
  return canvas(256, 256, (c, W, H) => {
    c.fillStyle = '#7d7466'; c.fillRect(0, 0, W, H)
    for (let y = 0; y < H; y += 32) for (let x = (y / 32) % 2 ? -24 : 0; x < W; x += 48) {
      const k = 150 + r() * 40
      c.fillStyle = `rgb(${k},${k - 8},${k - 24})`
      c.fillRect(x + 2, y + 2, 44, 28)
    }
  })
}

function greenCanvas(seed: number, base: string, a: string, b: string) {
  const r = random(seed)
  return canvas(256, 256, (c, W, H) => {
    c.fillStyle = base; c.fillRect(0, 0, W, H)
    c.globalAlpha = 0.3
    for (let n = 0; n < 2000; n++) {
      c.fillStyle = r() > 0.5 ? a : b
      c.beginPath(); c.ellipse(r() * W, r() * H, 1 + r() * 5, 1 + r() * 4, r() * 3, 0, Math.PI * 2); c.fill()
    }
    c.globalAlpha = 1
  })
}

export function sokulluMaterials() {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...p })
  const stone = ashlarCanvas(7, '#8d8473', ['#c3b79d', '#b8ab90', '#cdc2a8', '#ab9f86', '#bfb193'])
  return {
    stone: std({ map: texture(stone, 4, 4) }),
    stoneInner: std({ map: texture(stone, 4, 4), color: '#d9d2c4', side: THREE.DoubleSide }),
    roof: std({ color: '#a59b88', roughness: 0.95 }),
    striped: std({ map: texture(stripedCanvas(), 1.2, 1.2), roughness: 0.6, side: THREE.DoubleSide }),
    lead: std({ color: '#7f878b', roughness: 0.7, metalness: 0.15 }),
    gold: std({ color: '#c9a24a', roughness: 0.4, metalness: 0.7 }),
    plaster: std({ color: '#e9e2d3', side: THREE.DoubleSide }),
    dark: std({ color: '#2a2622', roughness: 1, side: THREE.DoubleSide }),
    wood: std({ color: '#5a3b24', roughness: 0.7, side: THREE.DoubleSide }),
    mihrab: std({ map: texture(mihrabCanvas(), 1, 1), roughness: 0.55 }),
    carpet: std({ color: '#8e2730', roughness: 1 }),
    /** Daylight in windows and skylights seen from inside. */
    glow: new THREE.MeshBasicMaterial({ color: '#fff3dc', side: THREE.DoubleSide }),
    water: std({ color: '#4d7d8c', roughness: 0.15, metalness: 0.2 }),
    paving: std({ map: texture(pavingCanvas(13), 3, 3), roughness: 0.95 }),
    grass: std({ map: texture(greenCanvas(17, '#5a6e3a', '#6f8648', '#43552c'), 6, 6), roughness: 1 }),
    leaf: std({ map: texture(greenCanvas(19, '#3f6330', '#5f8a3e', '#2a4522'), 5, 5), roughness: 1, flatShading: true }),
    trunk: std({ color: '#4e3d2d', roughness: 1 }),
  }
}
export type SM = ReturnType<typeof sokulluMaterials>

/** Axis-aligned box from bounds. */
export const blockG = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  place(boxG(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)

/** Flat plane facing ±x or ±z (doors, windows, recesses): `n` is the outward normal. */
export function panelG(n: 'x+' | 'x-' | 'z+' | 'z-', c: number, along: number, y: number, w: number, h: number, pointed = false) {
  const s = pointed ? arch(new THREE.Shape(), 0, -h / 2, w, h - w * 0.55, w * 0.55) : null
  const g = s ? new THREE.ShapeGeometry(s, 6) : new THREE.PlaneGeometry(w, h)
  if (n === 'z-') g.rotateY(Math.PI)
  if (n === 'x+') g.rotateY(Math.PI / 2)
  if (n === 'x-') g.rotateY(-Math.PI / 2)
  return n[0] === 'z' ? g.translate(along, y, c) : g.translate(c, y, along)
}

/** Wall along x (at z = c) or along z (at x = c) with arched openings cut through; extruded `t` thick, centred on c. */
export function archWall(axis: 'x' | 'z', c: number, a0: number, a1: number, y0: number, y1: number, t: number, holes: { at: number; w: number; h: number }[]) {
  const s = new THREE.Shape()
  s.moveTo(a0, y0); s.lineTo(a1, y0); s.lineTo(a1, y1); s.lineTo(a0, y1); s.closePath()
  for (const o of holes) s.holes.push(arch(new THREE.Path(), o.at, y0, o.w, o.h - o.w * 0.55, o.w * 0.55))
  const g = subtract(s, t)
  if (axis === 'x') return g.translate(0, 0, c - t / 2)
  return g.rotateY(-Math.PI / 2).translate(c + t / 2, 0, 0)
}

/** Lead dome with a small finial; `R` radius, `H` rise. */
export function dome(k: Bucket, m: SM, cx: number, cz: number, y0: number, R: number, H: number, seg = 24) {
  const p: [number, number][] = [[R + 0.15, 0], [R, 0.08]]
  for (let t = 1; t <= 10; t++) {
    const a = (t / 10) * Math.PI / 2
    p.push([R * Math.cos(a), 0.08 + H * Math.sin(a)])
  }
  k.add(place(rotateG(p, seg, [1, 1]), cx, y0, cz), m.lead)
  const f = Math.max(0.5, R * 0.22)
  k.add(place(rotateG([[0.08 * f, 0], [0.12 * f, 0.3 * f], [0.04 * f, 0.6 * f], [0.09 * f, 0.8 * f], [0, 1.2 * f]], 6), cx, y0 + H, cz), m.gold)
}

/** Polygonal drum with a cornice. `open`: no caps, with an inner lining, so the dome can be seen from inside. */
export function drum(k: Bucket, m: SM, cx: number, cz: number, y0: number, h: number, R: number, sides = 8, open = false) {
  const rot = Math.PI / sides
  k.add(place(flatShadow(cylinderG(R, R, h, sides, open).rotateY(rot)), cx, y0 + h / 2, cz), m.stone)
  k.add(place(flatShadow(cylinderG(R + 0.18, R + 0.05, 0.25, sides, open).rotateY(rot)), cx, y0 + h - 0.1, cz), m.stone)
  if (open) k.add(place(cylinderG(R - 0.25, R - 0.25, h, sides * 2, true), cx, y0 + h / 2, cz), m.stoneInner)
}

/** Plastered inner shell of a dome, seen from below. */
export function innerDome(k: Bucket, m: SM, cx: number, cz: number, y0: number, R: number, H: number, seg = 24) {
  const p: [number, number][] = []
  for (let t = 0; t <= 10; t++) {
    const a = (t / 10) * Math.PI / 2
    p.push([Math.max(0.001, R * Math.cos(a)), H * Math.sin(a)])
  }
  k.add(place(rotateG(p, seg, [1, 1]), cx, y0, cz), m.plaster)
}

/** Horizontal plate over a square bay with a round opening: the transition from the bay to a drum (pendentive zone, simplified). */
export function ringPlate(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, r: number) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
  const s = new THREE.Shape()
  s.moveTo(x0 - cx, z0 - cz); s.lineTo(x1 - cx, z0 - cz); s.lineTo(x1 - cx, z1 - cz); s.lineTo(x0 - cx, z1 - cz); s.closePath()
  s.holes.push(new THREE.Path().absarc(0, 0, r, 0, Math.PI * 2, true))
  // Shape (x, y) extruded along z; rotateX(-90°) maps it to (x, depth, −y).
  return subtract(s, y1 - y0).rotateX(-Math.PI / 2).translate(cx, y0, cz)
}

/** Groin (cross) vault over a rectangular bay, seen from below: two crossing barrels, lunettes on all four sides. */
export function groinVault(cx: number, cz: number, hx: number, hz: number, spring: number, rise: number, n = 12) {
  const g = new THREE.PlaneGeometry(2 * hx, 2 * hz, n, n).rotateX(Math.PI / 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const u = Math.min(1, Math.abs(p.getX(i)) / hx), v = Math.min(1, Math.abs(p.getZ(i)) / hz)
    p.setY(i, spring + rise * Math.sqrt(1 - Math.min(u, v) ** 2))
  }
  g.computeVertexNormals()
  return g.translate(cx, 0, cz)
}

/** Low four-sided cover over a vaulted bay, as seen from outside. */
export function vaultCover(k: Bucket, m: SM, cx: number, cz: number, y0: number, w: number, d: number, h: number) {
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4)
  g.scale(w, h, d).translate(cx, y0 + h / 2, cz)
  k.add(flatShadow(g), m.roof)
}

export function tree(k: Bucket, m: SM, x: number, z: number, size: number, seed: number) {
  const r = random(seed)
  k.add(place(cylinderG(size * 0.04, size * 0.06, size * 0.45, 6), x, size * 0.22, z), m.trunk)
  for (let i = 0; i < 2; i++) {
    const g = new THREE.IcosahedronGeometry(size * (0.26 + r() * 0.08), 1)
    g.scale(1, 0.85, 1)
    k.add(g.translate(x + (r() - 0.5) * size * 0.3, size * (0.58 + r() * 0.15), z + (r() - 0.5) * size * 0.3), m.leaf)
  }
}
