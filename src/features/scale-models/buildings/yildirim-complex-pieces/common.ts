// Shared textures and geometry helpers for the Yıldırım Complex model.
// Stone, alternating masonry, carpet and ornaments are generated on canvas; only the mihrab and two panels come from Drive photos.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../../shared/config/publicBuild'
import { uluMosqueMaterials } from '../../uluMosqueTextures'
import { Bucket, subtract, rotateG, flatShadow, arch, boxG, cylinderG, place } from '../../uluMosquePiece'
import { lightDevice, random } from '../../uluMosqueFloor'

export type Mat = THREE.Material
export type Ext = (kv: Bucket, g: THREE.BufferGeometry, mat: Mat) => void

const PHOTO = '/images/yildirim-complex/model'

function canvas(g: number, y: number, draw: (c: CanvasRenderingContext2D, g: number, y: number) => void) {
  const el = document.createElement('canvas')
  el.width = g; el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  draw(c, g, y)
  return el
}
function texture(el: HTMLCanvasElement, meterX: number, meterY: number, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / meterX, 1 / meterY)
  t.anisotropy = 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Cut stone: light gray and beige veined blocks (facade and interior piers as in the photos). */
function ashlarCanvas(seed: number, colors: string[]) {
  const r = random(seed)
  return canvas(1024, 1024, (c, G, Y) => {
    c.fillStyle = '#8f8a80'; c.fillRect(0, 0, G, Y)
    const ROW = 10, h = Y / ROW
    for (let s = 0; s < ROW; s++) {
      let x = -r() * 140
      const first = x
      while (x < G + first + 40) {
        const w = Math.min(120 + r() * 170, G + first - x + 4)
        if (w < 6) break
        const tone = colors[Math.floor(r() * colors.length)]
        const draw = (ox: number) => {
          c.fillStyle = tone
          c.fillRect(x + ox + 1.5, s * h + 1.5, w - 3, h - 3)
          c.globalAlpha = 0.07
          c.strokeStyle = r() > 0.5 ? '#5c5a57' : '#f4f1ea'
          c.lineWidth = 1 + r() * 1.4
          for (let d = 0; d < 3; d++) {
            c.beginPath()
            const yy = s * h + r() * h
            c.moveTo(x + ox + 2, yy)
            c.bezierCurveTo(x + ox + w * 0.3, yy + (r() - 0.5) * h, x + ox + w * 0.7, yy + (r() - 0.5) * h, x + ox + w - 2, s * h + r() * h)
            c.stroke()
          }
          c.globalAlpha = 1
        }
        draw(0)
        if (x < 0) draw(G)
        x += w
      }
    }
  })
}

/** Alternating (almaşık) masonry: two courses of brick with one course of stone (inventory pp. 176, 204). */
function alternatingCanvas(seed: number, stoneColor: string[]) {
  const r = random(seed)
  return canvas(1024, 1024, (c, G, Y) => {
    c.fillStyle = '#c9b89b'; c.fillRect(0, 0, G, Y)
    const PERIOD = 5, d = Y / PERIOD // 1024 px = 2.4 m; one repeat 0.48 m
    for (let s = 0; s < PERIOD; s++) {
      const y0 = s * d
      // Stone course
      let x = -r() * 90
      const stoneH = d * 0.62
      while (x < G) {
        const w = 90 + r() * 90
        c.fillStyle = stoneColor[Math.floor(r() * stoneColor.length)]
        c.fillRect(x + 2, y0 + 3, w - 4, stoneH - 5)
        c.globalAlpha = 0.14
        c.fillStyle = '#3d3a33'
        for (let n = 0; n < 12; n++) c.fillRect(x + 4 + r() * (w - 10), y0 + 5 + r() * (stoneH - 12), 2 + r() * 6, 1 + r() * 4)
        c.globalAlpha = 1
        x += w
      }
      // Two courses of brick
      for (let t = 0; t < 2; t++) {
        const yy = y0 + stoneH + t * (d - stoneH) / 2
        let bx = -(t * 40) - r() * 40
        while (bx < G) {
          const k = 150 + r() * 50
          c.fillStyle = `rgb(${k + 22},${k * 0.56},${k * 0.38})`
          c.fillRect(bx + 1.5, yy + 2, 62, (d - stoneH) / 2 - 4)
          bx += 66
        }
      }
    }
  })
}

/** Rubble stone wall: irregular warm gray stones (darüşşifa). */
function rubbleCanvas(seed: number) {
  const r = random(seed)
  return canvas(512, 512, (c, G, Y) => {
    c.fillStyle = '#b6a78f'; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 900; n++) {
      const k = 120 + r() * 70
      c.fillStyle = `rgb(${k + 26},${k + 8},${k - 16})`
      const w = 12 + r() * 34, h = 8 + r() * 18
      c.beginPath(); c.ellipse(r() * G, r() * Y, w / 2, h / 2, (r() - 0.5) * 0.7, 0, Math.PI * 2); c.fill()
    }
  })
}

/** Turquoise carpet: mottled ground and prayer-row strips perpendicular to the qibla (as in the photos; pattern not copied). */
function carpetCanvas(seed: number) {
  const r = random(seed)
  return canvas(512, 512, (c, G, Y) => {
    c.fillStyle = '#1d7880'; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 1400; n++) {
      c.fillStyle = r() > 0.5 ? 'rgba(70,160,165,0.1)' : 'rgba(8,70,80,0.14)'
      c.beginPath(); c.ellipse(r() * G, r() * Y, 8 + r() * 42, 3 + r() * 14, r() * 3, 0, Math.PI * 2); c.fill()
    }
    // Prayer-row strip: a dark band and lozenge row every 2.4 m
    const y0 = Y * 0.46, h = Y * 0.075
    c.fillStyle = '#16323a'; c.fillRect(0, y0, G, h)
    c.fillStyle = '#b9c9c4'; c.fillRect(0, y0 - 2, G, 2); c.fillRect(0, y0 + h, G, 2)
    c.fillStyle = '#9fb9b4'
    for (let x = 0; x < G; x += 32) {
      c.beginPath(); c.moveTo(x + 16, y0 + 4); c.lineTo(x + 28, y0 + h / 2); c.lineTo(x + 16, y0 + h - 4); c.lineTo(x + 4, y0 + h / 2); c.closePath(); c.fill()
    }
  })
}

/** Red carpet (tomb interior, visible from above in the exploded view). */
const redCanvas = (seed: number) => {
  const r = random(seed)
  return canvas(128, 128, (c, G, Y) => {
    c.fillStyle = '#b61f1c'; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 300; n++) { c.fillStyle = r() > 0.5 ? 'rgba(220,60,50,0.14)' : 'rgba(90,10,10,0.14)'; c.fillRect(r() * G, r() * Y, 2 + r() * 8, 1 + r() * 3) }
  })
}

/** Painted (kalem işi) band: rumi-like geometric repeat; contains no inscription. */
function bandCanvas() {
  return canvas(512, 64, (c, G, Y) => {
    c.fillStyle = '#f2ead9'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#8a5a2a'; c.fillRect(0, 4, G, 3); c.fillRect(0, Y - 7, G, 3)
    for (let x = 0; x < G; x += 64) {
      c.strokeStyle = '#a0522d'; c.lineWidth = 4
      c.beginPath(); c.moveTo(x, Y / 2); c.bezierCurveTo(x + 16, 8, x + 48, 8, x + 64, Y / 2); c.bezierCurveTo(x + 48, Y - 8, x + 16, Y - 8, x, Y / 2); c.stroke()
      c.fillStyle = '#23426f'; c.beginPath(); c.arc(x + 32, Y / 2, 8, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#c9963a'; c.beginPath(); c.arc(x + 32, Y / 2, 3.5, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#7a2b22'; c.beginPath(); c.arc(x, Y / 2, 5, 0, Math.PI * 2); c.fill()
    }
  })
}

/** Dome center: sixteen-armed geometric medallion; contains no inscription. */
function bossCanvas() {
  return canvas(512, 512, (c, G) => {
    const o = G / 2
    c.fillStyle = '#f2ead9'; c.fillRect(0, 0, G, G)
    c.translate(o, o)
    for (const [r, color] of [[250, '#8a5a2a'], [240, '#f2ead9'], [205, '#23426f'], [190, '#f2ead9']] as const) { c.fillStyle = color; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill() }
    for (let i = 0; i < 16; i++) {
      c.rotate(Math.PI / 8)
      c.fillStyle = i % 2 ? '#a0522d' : '#23426f'
      c.beginPath(); c.moveTo(0, -185); c.bezierCurveTo(46, -130, 26, -60, 0, -32); c.bezierCurveTo(-26, -60, -46, -130, 0, -185); c.fill()
      c.fillStyle = '#c9963a'
      c.beginPath(); c.arc(0, -150, 7, 0, Math.PI * 2); c.fill()
    }
    c.fillStyle = '#c9963a'; c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fill()
  })
}

/** Revzen: colored glass with plaster grille, glows as if letting light through. */
function transomCanvas() {
  return canvas(256, 384, (c, G, Y) => {
    c.fillStyle = '#f7f0dd'; c.fillRect(0, 0, G, Y)
    const color = ['#d73a3a', '#2f6fd0', '#f2c03c', '#3ba866', '#f7f0dd']
    for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) {
      c.fillStyle = color[(i * 3 + j * 2) % color.length]
      c.beginPath(); c.ellipse((i + 0.5) * G / 4, (j + 0.5) * Y / 7, G / 11, Y / 18, 0, 0, Math.PI * 2); c.fill()
    }
    c.strokeStyle = '#efe7d3'; c.lineWidth = 5
    for (let j = 0; j <= 7; j++) { c.beginPath(); c.moveTo(0, j * Y / 7); c.lineTo(G, j * Y / 7); c.stroke() }
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * G / 4, 0); c.lineTo(i * G / 4, Y); c.stroke() }
  })
}

/** Bright window behind a lokma iron grille. */
function ironCanvas() {
  return canvas(256, 256, (c, G, Y) => {
    c.fillStyle = '#dfe9ee'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#20201f'
    for (let i = 0; i <= 8; i++) { c.fillRect(i * G / 8 - 2.5, 0, 5, Y); c.fillRect(0, i * Y / 8 - 2.5, G, 5) }
  })
}
function ironDarkCanvas() {
  return canvas(256, 256, (c, G, Y) => {
    c.fillStyle = '#1a1c1d'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#4b5052'
    for (let i = 0; i <= 8; i++) { c.fillRect(i * G / 8 - 4, 0, 8, Y); c.fillRect(0, i * Y / 8 - 4, G, 8) }
  })
}
/** Plaster grille: drum window seen from outside. */
function latticeCanvas() {
  return canvas(128, 128, (c, G, Y) => {
    c.fillStyle = '#efe6d2'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#3b3a37'
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((i + 0.5 + (j % 2) * 0.5) * G / 6, (j + 0.5) * Y / 6, 7, 0, Math.PI * 2); c.fill() }
  })
}
/** Half-moon window with plaster grille: lit from inside (the lower window lunettes in the photos). */
function latticeLightCanvas() {
  return canvas(128, 128, (c, G, Y) => {
    c.fillStyle = '#d9d2c0'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#fbfbf6'
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { c.beginPath(); c.arc((i + 0.5 + (j % 2) * 0.5) * G / 8, (j + 0.5) * Y / 8, 5.5, 0, Math.PI * 2); c.fill() }
  })
}
/** Grass and leaves: noisy green. */
function greenCanvas(seed: number, base: string, open: string, dark: string) {
  const r = random(seed)
  return canvas(256, 256, (c, G, Y) => {
    c.fillStyle = base; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 2600; n++) {
      c.fillStyle = r() > 0.5 ? open : dark
      c.globalAlpha = 0.3
      c.beginPath(); c.ellipse(r() * G, r() * Y, 1 + r() * 5, 1 + r() * 4, r() * 3, 0, Math.PI * 2); c.fill()
    }
    c.globalAlpha = 1
  })
}

export function yildirimMaterials() {
  const u = uluMosqueMaterials()
  const lite = lightDevice()
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const emboss = (el: HTMLCanvasElement, mx: number, my: number, scale: number) => lite ? {} : { bumpMap: texture(el, mx, my, false), bumpScale: scale }
  const ashlarHand = ashlarCanvas(11, ['#b9b6ad', '#a9a69e', '#c6c2b8', '#9d9b95', '#bdb4a2', '#cfc9bb'])
  const ashlarLightHand = ashlarCanvas(23, ['#d9d7d0', '#cfcdc7', '#e4e2db', '#c6c7c5', '#dcd8cd'])
  const ashlarInnerHand = ashlarCanvas(37, ['#b8ad97', '#a79c88', '#c2b7a0', '#8f8c86', '#a5a29b', '#c9bea8'])
  const alternatingHand = alternatingCanvas(41, ['#cdbf9f', '#c2b18f', '#d6c9ac', '#b9a888'])
  const rubbleHand = rubbleCanvas(53)
  const band = texture(bandCanvas(), 2.4, 0.3)
  const photo = (name: string) => {
    if (PUBLIC_BUILD) return null
    const f = new THREE.TextureLoader().load(`${PHOTO}/${name}.jpg`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const glossy = (el: HTMLCanvasElement, c: [number, number, number]) => {
    const t = new THREE.CanvasTexture(el); t.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(...c), side: THREE.DoubleSide })
  }
  const upright = (el: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(el); t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const mihrabPhoto = photo('mihrab'), medallion = photo('medallion'), plaque = photo('plaque')
  return {
    ...u,
    dome: (u.dome.color.set('#a9adb0'), u.dome),
    ashlar: std({ map: texture(ashlarHand, 4.8, 4.8), ...emboss(ashlarHand, 4.8, 4.8, 0.5), color: '#d4d2cc', roughness: 0.82 }),
    ashlarLight: std({ map: texture(ashlarLightHand, 4.8, 4.8), ...emboss(ashlarLightHand, 4.8, 4.8, 0.3), color: '#dfddd6', roughness: 0.6 }),
    ashlarInner: std({ map: texture(ashlarInnerHand, 4.8, 4.8), ...emboss(ashlarInnerHand, 4.8, 4.8, 0.5), color: '#b7b1a6', roughness: 0.82 }),
    alternating: std({ map: texture(alternatingHand, 2.4, 2.4), ...emboss(alternatingHand, 2.4, 2.4, 0.5), roughness: 0.9 }),
    rubble: std({ map: texture(rubbleHand, 3, 3), ...emboss(rubbleHand, 3, 3, 0.8), roughness: 0.95 }),
    brickArch: std({ color: '#b5613c', roughness: 0.9 }),
    stoneArch: std({ color: '#e0d6bd', roughness: 0.85 }),
    whiteStone: std({ map: texture(ashlarLightHand, 4.8, 4.8), color: '#fff6e2', roughness: 0.7 }),
    burgundy: std({ color: '#5b2320', roughness: 0.35 }),
    plasterInner: std({ color: '#f4eee0', roughness: 0.9, side: THREE.DoubleSide }),
    carpetT: std({ map: texture(carpetCanvas(61), 2.4, 2.4), roughness: 0.97 }),
    carpetK: std({ map: texture(redCanvas(71), 1.5, 1.5), roughness: 0.97 }),
    band: std({ map: band, roughness: 0.8, side: THREE.DoubleSide }),
    boss: std({ map: upright(bossCanvas()), roughness: 0.75, side: THREE.DoubleSide }),
    transom: glossy(transomCanvas(), [1.5, 1.42, 1.25]),
    latticeLight: glossy(latticeLightCanvas(), [1.25, 1.22, 1.15]),
    iron: glossy(ironCanvas(), [1.25, 1.25, 1.2]),
    ironDark: std({ map: upright(ironDarkCanvas()), roughness: 0.8, side: THREE.DoubleSide }),
    lattice: std({ map: upright(latticeCanvas()), roughness: 0.8, side: THREE.DoubleSide }),
    grass: std({ map: texture(greenCanvas(83, '#4d6636', '#5f7b42', '#3a5029'), 6, 6), roughness: 1 }),
    leaf: std({ map: texture(greenCanvas(91, '#3f6330', '#5f8a3e', '#2a4522'), 5, 5), roughness: 1, flatShading: true }),
    leafYellow: std({ map: texture(greenCanvas(97, '#7f8f33', '#a9b545', '#5d6e28'), 5, 5), roughness: 1, flatShading: true }),
    shell: std({ color: '#4e3d2d', roughness: 1 }),
    mihrabWall: mihrabPhoto ? std({ map: mihrabPhoto, roughness: 0.55 }) : std({ color: '#a98446', roughness: 0.6 }),
    medallion: medallion ? std({ map: medallion, roughness: 0.7 }) : null,
    plaque: plaque ? std({ map: plaque, roughness: 0.6 }) : null,
    woodDark: std({ color: '#4a2d1a', roughness: 0.6 }),
    woodLight: std({ color: '#8a5d32', roughness: 0.55 }),
    greenIron: std({ color: '#1e6b3c', roughness: 0.5, metalness: 0.4 }),
    cenotaph: std({ color: '#1f6e45', roughness: 0.8 }),
    plasterDark: std({ color: '#c9bea9', roughness: 0.9, side: THREE.DoubleSide }),
  }
}
export type YM = ReturnType<typeof yildirimMaterials>

/** Bursa arch as in the photos: flattened arc dropping vertically at the sides, slightly pointed at the top. */
export function bursaArch<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, flat: number, archH: number): P {
  const o = g / 2, apex = y0 + flat + archH, shoulder = y0 + flat
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, shoulder)
  p.bezierCurveTo(cx - o, shoulder + archH * 0.72, cx - o * 0.5, apex - archH * 0.02, cx, apex)
  p.bezierCurveTo(cx + o * 0.5, apex - archH * 0.02, cx + o, shoulder + archH * 0.72, cx + o, shoulder)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

export const quadPath = (x0: number, y0: number, x1: number, y1: number) => {
  const p = new THREE.Path()
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath()
  return p
}
const quadShape = (x0: number, y0: number, x1: number, y1: number) => {
  const p = new THREE.Shape()
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath()
  return p
}

/** Wall running along X: holes in the (x, y) plane. Thickness z0..z1. */
export function wallX(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, holes: THREE.Path[] = []) {
  const s = quadShape(x0, y0, x1, y1)
  s.holes.push(...holes)
  return subtract(s, z1 - z0, z0)
}
/** Wall running along Z: holes in the (z, y) plane. Thickness x0..x1. */
export function wallZ(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, holes: THREE.Path[] = []) {
  const s = quadShape(z0, y0, z1, y1)
  s.holes.push(...holes)
  return subtract(s, x1 - x0, 0).rotateY(-Math.PI / 2).translate(x1, 0, 0)
}
/** Frame around a rectangle (eave molding): the middle stays empty, does not close the ceiling. */
export function molding(ext: (g: THREE.BufferGeometry, mat: Mat) => void, mat: Mat, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, t: number) {
  ext(boxK(x0, x1, y0, y1, z0, z0 + t), mat)
  ext(boxK(x0, x1, y0, y1, z1 - t, z1), mat)
  ext(boxK(x0, x0 + t, y0, y1, z0 + t, z1 - t), mat)
  ext(boxK(x1 - t, x1, y0, y1, z0 + t, z1 - t), mat)
}
/** Box given by its corners. */
export function boxK(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  return boxG(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
}

/** Alternating brick and stone voussoirs around the arch mouth (the mottled arches in the photos). */
export function alternatingArch(ext: (g: THREE.BufferGeometry, mat: Mat) => void, m: YM, cx: number, y0: number, g: number, flat: number, archH: number, stay: number, depth: number, z: number, count = 15) {
  const innerPath = arch(new THREE.Path(), cx, y0, g, flat, archH).getPoints(10)
  const outerPath = arch(new THREE.Path(), cx, y0, g + stay * 2, flat + 0.02, archH + stay * 0.85).getPoints(10)
  // getPoints: bottom-left, shoulder, arc points, shoulder, bottom-right; only the arc part is used
  const bow = (y: THREE.Vector2[]) => y.filter((n) => n.y >= y0 + flat - 0.001)
  const a = bow(innerPath), b = bow(outerPath)
  const n = Math.min(a.length, b.length) - 1
  for (let i = 0; i < Math.max(n, count); i++) {
    const t0 = i / Math.max(n, count), t1 = (i + 1) / Math.max(n, count)
    const al = (l: THREE.Vector2[], t: number) => { const f = t * (l.length - 1), j = Math.min(Math.floor(f), l.length - 2); return l[j].clone().lerp(l[j + 1], f - j) }
    const s = new THREE.Shape([al(a, t0), al(a, t1), al(b, t1), al(b, t0)])
    ext(subtract(s, depth, z), i % 2 ? m.brickArch : m.stoneArch)
  }
}

/** Outer dome: eaved skirt, lead cladding and gold finial. */
export function outerDome(ext: (kv: Bucket, g: THREE.BufferGeometry, mat: Mat) => void, kv: Bucket, m: YM, cx: number, cz: number, y0: number, R: number, H: number, finial = 1) {
  const p: [number, number][] = [[R + 0.42, -0.2], [R + 0.36, -0.02], [R + 0.05, 0.1]]
  for (let t = 0; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    p.push([R * Math.pow(Math.cos(a), 0.9), 0.1 + H * Math.pow(Math.sin(a), 1.05)])
  }
  ext(kv, place(rotateG(p, 40, [1, 1]), cx, y0, cz), m.dome)
  const s = finial
  const q: [number, number][] = [[0.14 * s, 0], [0.05 * s, 0.14 * s], [0.13 * s, 0.32 * s], [0.04 * s, 0.5 * s], [0.1 * s, 0.68 * s], [0.02 * s, 0.98 * s], [0, 1.1 * s]]
  ext(kv, place(rotateG(q, 8), cx, y0 + 0.1 + H - 0.05, cz), m.gold)
}

/** Outer drum: polygonal body, eave molding and arched window faces. */
export function outerDrum(ext: (kv: Bucket, g: THREE.BufferGeometry, mat: Mat) => void, kv: Bucket, m: YM, cx: number, cz: number, y0: number, h: number, R: number, edge: number, window: number, lock = 0) {
  const rotation = edge === 8 ? Math.PI / 8 : 0
  ext(kv, place(flatShadow(cylinderG(R, R, h, edge, true).rotateY(rotation + lock)), cx, y0 + h / 2, cz), m.alternating)
  ext(kv, place(flatShadow(cylinderG(R + 0.16, R + 0.04, 0.22, edge, true).rotateY(rotation + lock)), cx, y0 + h - 0.05, cz), m.ashlarLight)
  ext(kv, place(cylinderG(R + 0.01, R + 0.01, 0.02, 4), cx, y0, cz), m.dark)
  if (!window) return
  const face = R * Math.cos(Math.PI / edge) + 0.03
  const pH = Math.min(1.1, h * 0.42)
  for (let n = 0; n < window; n++) {
    const a = (n + 0.5) * (Math.PI * 2 / window) + lock
    const py = y0 + (h - pH) * 0.42
    const cer = arch(new THREE.Shape(), 0, py - 0.1, pH * 0.86, pH * 0.46 + 0.1, pH * 0.56)
    cer.holes.push(arch(new THREE.Path(), 0, py, pH * 0.6, pH * 0.46, pH * 0.4))
    ext(kv, place(subtract(cer, 0.08, face).rotateY(a), cx, 0, cz), m.stoneArch)
    ext(kv, place(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, py, pH * 0.6, pH * 0.46, pH * 0.4), 6).translate(0, 0, face + 0.02).rotateY(a), cx, 0, cz), m.lattice)
  }
}

/** Cover transitioning from a rectangular base to a circular mouth (a plain surface instead of pendentive / Turkish triangle). */
export function pendentiveG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, R: number) {
  const SEG = 48, ROW = 6
  const position: number[] = [], uv: number[] = [], index: number[] = []
  for (let s = 0; s <= ROW; s++) {
    const t = s / ROW, e = Math.pow(t, 0.72)
    for (let a = 0; a <= SEG; a++) {
      const theta = (a / SEG) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
      const far = Math.min(dx > 1e-6 ? (x1 - cx) / dx : dx < -1e-6 ? (x0 - cx) / dx : Infinity, dz > 1e-6 ? (z1 - cz) / dz : dz < -1e-6 ? (z0 - cz) / dz : Infinity)
      const r = THREE.MathUtils.lerp(far, R, e)
      position.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / SEG, t)
    }
  }
  for (let s = 0; s < ROW; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    index.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** Ring chandelier: two rings, hangers and lamps. */
export function chandelier(k: Bucket, m: YM, x: number, ay: number, z: number, R: number, apex: number, count: number) {
  const ring = (r: number, y: number) => k.add(new THREE.TorusGeometry(r, 0.035, 6, 32).rotateX(Math.PI / 2).translate(x, y, z), m.bronze)
  const lamp = (r: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const lx = x + Math.sin(a) * r, lz = z + Math.cos(a) * r
      k.add(new THREE.SphereGeometry(0.075, 6, 4).translate(lx, y - 0.18, lz), m.lamp)
      for (const ry of [0, Math.PI / 2]) k.add(new THREE.PlaneGeometry(0.42, 0.42).rotateY(ry).translate(lx, y - 0.18, lz), m.lampHalo)
    }
  }
  ring(R, ay); lamp(R, ay, count)
  if (R > 1.4) { ring(R * 0.42, ay - 0.6); lamp(R * 0.42, ay - 0.6, Math.ceil(count / 2)) }
  k.add(new THREE.CylinderGeometry(0.02, 0.02, apex - ay, 4).translate(x, (apex + ay) / 2, z), m.dark)
  for (let n = 0; n < 4; n++) {
    const a = n * Math.PI / 2 + Math.PI / 4
    const ax = x + Math.sin(a) * R, az = z + Math.cos(a) * R, top = ay + Math.min(3, (apex - ay) * 0.5)
    const length = Math.hypot(ax - x, top - ay, az - z)
    const ip = new THREE.CylinderGeometry(0.012, 0.012, length, 4)
    ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x - ax, top - ay, z - az).normalize()))
    ip.translate((ax + x) / 2, (ay + top) / 2, (az + z) / 2)
    k.add(ip, m.dark)
  }
}

/** Wedge roof: top flat (with holes) and lead skirts descending to four sides. */
export function roof(ext: (g: THREE.BufferGeometry) => void, x0: number, x1: number, z0: number, z1: number, bottomY: number, topY: number, eave: number, inward: number, holes: { x: number; z: number; r: number }[] = [], lash?: (g: THREE.BufferGeometry) => void) {
  const X0 = x0 - eave, X1 = x1 + eave, Z0 = z0 - eave, Z1 = z1 + eave
  const a0 = x0 + inward, a1 = x1 - inward, b0 = z0 + inward, b1 = z1 - inward
  const top = quadShape(a0, -b1, a1, -b0)
  for (const d of holes) top.holes.push(new THREE.Path().absarc(d.x, -d.z, d.r, 0, Math.PI * 2, true))
  ext(new THREE.ShapeGeometry(top, 18).rotateX(-Math.PI / 2).translate(0, topY, 0))
  const face = (p: number[][], L: number) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]], 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L, 2, 0, 0, L, 2, 0, 2], 2))
    g.computeVertexNormals()
    ext(g)
  }
  face([[X0, bottomY, Z1], [X1, bottomY, Z1], [a1, topY, b1], [a0, topY, b1]], X1 - X0)
  face([[X1, bottomY, Z0], [X0, bottomY, Z0], [a0, topY, b0], [a1, topY, b0]], X1 - X0)
  face([[X1, bottomY, Z1], [X1, bottomY, Z0], [a1, topY, b0], [a1, topY, b1]], Z1 - Z0)
  face([[X0, bottomY, Z0], [X0, bottomY, Z1], [a0, topY, b1], [a0, topY, b0]], Z1 - Z0)
  if (lash) {
    // Under-eave molding
    lash(boxK(X0, X1, bottomY - 0.28, bottomY, Z0, Z1 ))
  }
}

/** Window seen from outside: frame and dark opening with lokma iron, rectangular or with a pointed lunette. */
export function outerWindow(ext: (g: THREE.BufferGeometry, mat: Mat) => void, m: YM, x: number, y0: number, g: number, h: number, z: number, pointed: boolean, casing: Mat) {
  const k = 0.14
  ext(boxK(x - g / 2 - k, x + g / 2 + k, y0 - k, y0, z, z + 0.1), casing)
  ext(boxK(x - g / 2 - k, x + g / 2 + k, y0 + h, y0 + h + k, z, z + 0.1), casing)
  ext(boxK(x - g / 2 - k, x - g / 2, y0, y0 + h, z, z + 0.1), casing)
  ext(boxK(x + g / 2, x + g / 2 + k, y0, y0 + h, z, z + 0.1), casing)
  ext(new THREE.PlaneGeometry(g, h).translate(x, y0 + h / 2, z + 0.03), m.ironDark)
  if (pointed) {
    const s = arch(new THREE.Shape(), x, y0 + h + k, g + 0.2, 0.02, g * 0.48)
    s.holes.push(arch(new THREE.Path(), x, y0 + h + k + 0.03, g - 0.1, 0.02, g * 0.35))
    ext(subtract(s, 0.1, z), m.brickArch)
  }
}

/** Leafy tree: trunk and three large clusters. */
export function tree(ext: (g: THREE.BufferGeometry, mat: Mat) => void, m: YM, x: number, z: number, length: number, yellow: boolean, seed: number) {
  const r = random(seed)
  ext(place(cylinderG(length * 0.03, length * 0.05, length * 0.45, 7), x, length * 0.22, z), m.shell)
  for (let i = 0; i < 3; i++) {
    const R = length * (0.24 + r() * 0.1)
    const g = new THREE.IcosahedronGeometry(R, 2)
    const p = g.attributes.position
    for (let v = 0; v < p.count; v++) {
      const o = 0.86 + 0.28 * Math.abs(Math.sin(p.getX(v) * 3.1 + seed) * Math.cos(p.getZ(v) * 2.7 + p.getY(v)))
      p.setXYZ(v, p.getX(v) * o, p.getY(v) * o * 0.86, p.getZ(v) * o)
    }
    g.computeVertexNormals()
    ext(g.translate(x + (r() - 0.5) * length * 0.34, length * (0.56 + r() * 0.2), z + (r() - 0.5) * length * 0.34), yellow && i !== 1 ? m.leafYellow : m.leaf)
  }
}

/** Cypress: the dark, slender tree in the photos. */
export function cypress(ext: (g: THREE.BufferGeometry, mat: Mat) => void, m: YM, x: number, z: number, length: number) {
  const p: [number, number][] = [[0.12, 1], [0.9, 1.8], [1.35, length * 0.24], [1.45, length * 0.4], [1.15, length * 0.62], [0.72, length * 0.82], [0.24, length * 0.96], [0, length]]
  const g = rotateG(p, 10)
  ext(place(g, x, 0, z), m.cypress)
  ext(place(cylinderG(0.15, 0.22, 1.5, 6), x, 0.75, z), m.shell)
}
