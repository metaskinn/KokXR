// Yeşil Complex textures: all generated on canvas. Colors and layout interpreted from the photos on Drive
// (hexagonal tiles, turquoise tomb cladding, alternating wall, roof tiles). No inscription or calligraphy imitation is drawn.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../../shared/config/publicBuild'
import { random } from '../../uluMosqueFloor'

type Draw = (c: CanvasRenderingContext2D, g: number, y: number) => void

function canvas(g: number, y: number, draw: Draw) {
  const el = document.createElement('canvas')
  el.width = g; el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  draw(c, g, y)
  return el
}

function texture(el: HTMLCanvasElement, ou: number, ov = ou, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / ou, 1 / ov)
  t.anisotropy = 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function speck(c: CanvasRenderingContext2D, g: number, y: number, r: () => number, count: number, opaque = 0.05) {
  for (let i = 0; i < count; i++) {
    c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${opaque})` : `rgba(0,0,0,${opaque})`
    const b = 1 + r() * 3
    c.fillRect(r() * g, r() * y, b, b)
  }
}

/** Hexagonal tile: horizontal rows, seamless. One cell contains 2 columns and 2 rows. */
function hexagon(colors: string[], joint: string, seed: number, raised = false) {
  const a = 56, h = Math.round(a * Math.sqrt(3))
  return canvas(a * 3 * 2, h * 2, (c, G, Y) => {
    const r = random(seed)
    c.fillStyle = joint
    c.fillRect(0, 0, G, Y)
    const sixK = (cx: number, cy: number, s: number) => {
      c.beginPath()
      for (let i = 0; i < 6; i++) {
        const t = (i / 6) * Math.PI * 2
        c.lineTo(cx + Math.cos(t) * s, cy + Math.sin(t) * s)
      }
      c.closePath()
    }
    for (let i = -1; i <= 4; i++) for (let j = -1; j <= 3; j++) {
      const cx = i * a * 1.5, cy = j * h + (i % 2 !== 0 ? h / 2 : 0)
      c.fillStyle = colors[Math.floor(r() * colors.length)]
      sixK(cx, cy, a - 4.5)
      c.fill()
      if (!raised) {
        c.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.07})`
        c.beginPath(); c.ellipse(cx - a * 0.15, cy - h * 0.12, a * 0.34, h * 0.13, -0.4, 0, Math.PI * 2); c.fill()
      }
    }
  })
}

/** White-turquoise-navy floral band: repeating palmettes and stars instead of inscription. */
function frieze(floor: string, motif: string, inner: string, stroke: string) {
  return canvas(512, 128, (c, G, Y) => {
    c.fillStyle = floor
    c.fillRect(0, 0, G, Y)
    c.fillStyle = stroke
    c.fillRect(0, 4, G, 4); c.fillRect(0, Y - 8, G, 4)
    const count = 8, d = G / count
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5) * d, m = Y / 2
      c.fillStyle = motif
      c.beginPath()
      for (let k = 0; k < 16; k++) {
        const t = (k / 16) * Math.PI * 2, u = k % 2 ? 15 : 34
        c.lineTo(x + Math.sin(t) * u, m + Math.cos(t) * u)
      }
      c.closePath(); c.fill()
      c.fillStyle = inner
      c.beginPath(); c.arc(x, m, 9, 0, Math.PI * 2); c.fill()
      c.strokeStyle = motif; c.lineWidth = 2.5
      c.beginPath(); c.moveTo(x + 30, m); c.bezierCurveTo(x + 38, m - 26, x + d - 38, m - 26, x + d - 30, m); c.stroke()
      c.beginPath(); c.moveTo(x + 30, m); c.bezierCurveTo(x + 38, m + 26, x + d - 38, m + 26, x + d - 30, m); c.stroke()
    }
  })
}

/** Star geometric interlace; a close impression of the mihrab and mahfil surfaces. Not a copy of the real pattern. */
function starWeave(floor: string, a: string, b: string, stroke: string) {
  return canvas(256, 256, (c, G, Y) => {
    c.fillStyle = floor
    c.fillRect(0, 0, G, Y)
    const star = (x: number, y: number, R: number, color: string, corner = 8) => {
      c.fillStyle = color
      c.beginPath()
      for (let i = 0; i < corner * 2; i++) {
        const t = (i / (corner * 2)) * Math.PI * 2, u = i % 2 ? R * 0.6 : R
        c.lineTo(x + Math.sin(t) * u, y + Math.cos(t) * u)
      }
      c.closePath(); c.fill()
    }
    c.strokeStyle = stroke; c.lineWidth = 3
    for (const [x, y] of [[0, 0], [G, 0], [0, Y], [G, Y], [G / 2, Y / 2]] as const) {
      star(x, y, 56, a); star(x, y, 28, b, 6)
      c.beginPath(); c.arc(x, y, 62, 0, Math.PI * 2); c.stroke()
    }
    for (const [x, y] of [[G / 2, 0], [G / 2, Y], [0, Y / 2], [G, Y / 2]] as const) { star(x, y, 24, b, 6); star(x, y, 10, a, 4) }
  })
}

/** Painted (kalem işi) dome: segments in the lower band, white area opening toward the apex. No inscription. */
function paintedDome(slice: number, alt: string, top: string, floor: string) {
  return canvas(1536, 512, (c, G, Y) => {
    c.fillStyle = floor
    c.fillRect(0, 0, G, Y)
    const d = G / slice
    for (let i = 0; i < slice; i++) {
      const x = i * d
      c.fillStyle = i % 2 ? alt : top
      c.beginPath(); c.moveTo(x, Y); c.lineTo(x + d, Y); c.lineTo(x + d / 2, Y * 0.32); c.closePath(); c.fill()
      c.strokeStyle = 'rgba(240,220,170,.75)'; c.lineWidth = 2
      c.beginPath(); c.moveTo(x, Y); c.lineTo(x + d / 2, Y * 0.32); c.lineTo(x + d, Y); c.stroke()
      c.fillStyle = 'rgba(240,226,190,.85)'
      c.beginPath(); c.arc(x + d / 2, Y * 0.72, Math.min(d * 0.16, 16), 0, Math.PI * 2); c.fill()
    }
    c.fillStyle = '#7c2b1e'
    c.fillRect(0, Y - 18, G, 18)
    c.fillStyle = '#e0c88c'
    c.fillRect(0, Y - 23, G, 4)
    c.fillStyle = '#21407a'
    c.fillRect(0, 0, G, 14)
    c.fillStyle = 'rgba(120,70,40,.5)'
    c.fillRect(0, 14, G, 3)
  })
}

export function greenMaterials() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0, ...p })
  const glossy = (map: THREE.Texture, side: THREE.Side = THREE.FrontSide) => pbr({ map, roughness: 0.32, metalness: 0.04, side })

  // Navy hexagons in the mihrab section, green in the side iwans, turquoise tiles in the tabhane and tomb
  const navy = texture(hexagon(['#1b2c8c', '#1f3299', '#162680', '#23379f', '#2a2a78'], '#e6e2d6', 3), 1.02, 0.59)
  const green = texture(hexagon(['#0d6a58', '#0f7763', '#0a5c4c', '#127f6c', '#0d6f6a'], '#c9b86f', 5), 0.82, 0.48)
  const turquoise = texture(hexagon(['#2aa0c4', '#2fa9cd', '#2697b9', '#37b2d3', '#2aa6c9'], '#17506a', 7), 0.8, 0.46)

  // Tomb facade: turquoise glazed brick tiles in horizontal rows
  const tombBrick = canvas(512, 512, (c, G, Y) => {
    const r = random(13)
    c.fillStyle = '#0e6f8f'
    c.fillRect(0, 0, G, Y)
    const h = 32, w = 128
    for (let j = 0; j < Y / h; j++) for (let i = -1; i <= G / w; i++) {
      c.fillStyle = `hsl(${192 + r() * 8} ${72 + r() * 12}% ${44 + r() * 12}%)`
      c.fillRect(i * w + (j % 2 ? w / 2 : 0) + 1.5, j * h + 1.5, w - 3, h - 3)
    }
  })

  // Alternating wall: rubble stone courses with brick bands (imaret, madrasa)
  const alternating = (base: number) => canvas(512, 512, (c, G, Y) => {
    const r = random(19)
    c.fillStyle = '#6f5a44'
    c.fillRect(0, 0, G, Y)
    const rowT = 88, brickH = 12
    let v = 0
    while (v < Y) {
      // three courses of brick
      for (let i = 0; i < 3 && v < Y; i++) {
        let x = -r() * 30
        while (x < G) {
          const g = 34 + r() * 14
          c.fillStyle = `hsl(${base + r() * 8} ${48 + r() * 12}% ${34 + r() * 10}%)`
          c.fillRect(x + 1, v + 1, g - 2, brickH - 2)
          x += g
        }
        v += brickH
      }
      // rubble stone course: stone between vertical bricks
      let x = 0
      while (x < G && v < Y) {
        const g = 66 + r() * 34
        c.fillStyle = `hsl(${30 + r() * 12} ${14 + r() * 16}% ${48 + r() * 18}%)`
        c.beginPath()
        c.roundRect(x + 3, v + 3, g - 6, rowT - 6, 8)
        c.fill()
        c.fillStyle = `hsl(${base + r() * 8} 50% 36%)`
        c.fillRect(x + g - 5, v, 10, rowT)
        x += g
      }
      v += rowT
    }
    speck(c, G, Y, r, 2400, 0.04)
  })

  const roofTile = canvas(512, 512, (c, G, Y) => {
    const r = random(29)
    c.fillStyle = '#5e2c1a'
    c.fillRect(0, 0, G, Y)
    const w = 46, h = 42
    for (let j = 0; j < Y / h; j++) for (let i = -1; i <= G / w; i++) {
      c.fillStyle = `hsl(${12 + r() * 10} ${50 + r() * 14}% ${34 + r() * 12}%)`
      c.beginPath()
      c.roundRect(i * w + (j % 2 ? w / 2 : 0) + 2, j * h + 1, w - 4, h + 2, 14)
      c.fill()
    }
    speck(c, G, Y, r, 1500, 0.05)
  })

  // Pink plaster of the drums instead of a pink marble-clad wall
  const pink = canvas(256, 256, (c, G, Y) => {
    const r = random(37)
    c.fillStyle = '#d99c7f'
    c.fillRect(0, 0, G, Y)
    speck(c, G, Y, r, 2600, 0.03)
  })

  const cream = canvas(256, 256, (c, G, Y) => {
    const r = random(41)
    c.fillStyle = '#f3e7cf'
    c.fillRect(0, 0, G, Y)
    speck(c, G, Y, r, 2000, 0.012)
  })

  // Marble carving (crown portal and window lunettes): rumi medallions with a relief impression on white
  const drawCarving = (relief: boolean): Draw => (c, G, Y) => {
    const r = random(43)
    c.fillStyle = relief ? '#606060' : '#dcd8cd'
    c.fillRect(0, 0, G, Y)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x = (a + 0.5) * G / 2, v = (b + 0.5) * Y / 2
      c.strokeStyle = relief ? '#ececec' : '#9a968b'
      c.lineWidth = 4
      for (let t = 0; t < 6; t++) {
        c.beginPath()
        const s = (t / 6) * Math.PI * 2
        c.moveTo(x + Math.cos(s) * 10, v + Math.sin(s) * 10)
        c.quadraticCurveTo(x + Math.cos(s + 0.6) * 42, v + Math.sin(s + 0.6) * 42, x + Math.cos(s + 1.1) * 54, v + Math.sin(s + 1.1) * 54)
        c.stroke()
      }
      c.fillStyle = relief ? '#ffffff' : '#ece9df'
      c.beginPath(); c.arc(x, v, 11, 0, Math.PI * 2); c.fill()
    }
    if (!relief) speck(c, G, Y, r, 800, 0.03)
  }

  // Teal carpet: light veined ground, angular medallion
  const carpet = canvas(1024, 1024, (c, G, Y) => {
    const r = random(47)
    c.fillStyle = '#1e7489'
    c.fillRect(0, 0, G, Y)
    c.strokeStyle = 'rgba(180,225,215,.4)'; c.lineWidth = 3
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const x = (a + 0.5) * G / 3, v = (b + 0.5) * Y / 3
      c.beginPath(); c.moveTo(x, v - 110); c.quadraticCurveTo(x + 110, v, x, v + 110); c.quadraticCurveTo(x - 110, v, x, v - 110); c.stroke()
      c.fillStyle = 'rgba(235,160,130,.5)'
      c.beginPath(); c.arc(x, v, 18, 0, Math.PI * 2); c.fill()
      c.fillStyle = 'rgba(15,50,95,.45)'
      for (let t = 0; t < 4; t++) { c.beginPath(); c.ellipse(x + Math.sin(t * 1.57) * 54, v + Math.cos(t * 1.57) * 54, 13, 24, t * 1.57, 0, Math.PI * 2); c.fill() }
    }
    speck(c, G, Y, r, 6000, 0.02)
  })

  const iron = canvas(128, 128, (c, G, Y) => {
    c.fillStyle = '#2a211a'
    c.fillRect(0, 0, G, Y)
    c.fillStyle = '#0d0a08'
    c.fillRect(0, 0, 12, Y); c.fillRect(0, 0, G, 12)
    c.fillStyle = '#7a6f5c'
    c.fillRect(0, 0, 14, 14)
  })

  const mihrabCanvas = canvas(1024, 1820, (c, G, Y) => {
    // Nested frames: wide band + inner field; with the photo's colors, without inscription.
    const lac = '#14246d', fir = '#2fa6c6', yellow = '#d9a634', bey = '#e9e5d8', dark = '#0c1547'
    c.fillStyle = lac
    c.fillRect(0, 0, G, Y)
    const frameBorder = (b: number, inner: number, color: string, motif?: string) => {
      c.fillStyle = color
      c.fillRect(b, b, G - b * 2, Y - b * 2)
      if (motif) {
        c.fillStyle = motif
        for (let x = b + 16; x < G - b; x += 34) { c.beginPath(); c.arc(x, b + (inner - b) / 2, 7, 0, 7); c.fill(); c.beginPath(); c.arc(x, Y - b - (inner - b) / 2, 7, 0, 7); c.fill() }
        for (let v = b + 16; v < Y - b; v += 34) { c.beginPath(); c.arc(b + (inner - b) / 2, v, 7, 0, 7); c.fill(); c.beginPath(); c.arc(G - b - (inner - b) / 2, v, 7, 0, 7); c.fill() }
      }
    }
    frameBorder(0, 56, dark, fir)
    frameBorder(56, 108, bey, lac)
    frameBorder(108, 176, dark, yellow)
    frameBorder(176, 214, fir, dark)
    frameBorder(214, 288, lac, bey)
    frameBorder(288, 320, yellow, lac)
    c.fillStyle = dark
    c.fillRect(320, 320, G - 640, Y - 640)
    // Upper panel: geometric interlace instead of inscription
    const o = starWeave('#132368', '#d9a634', '#2fa6c6', 'rgba(230,226,216,.5)')
    const des = c.createPattern(o, 'repeat')
    if (des) { c.fillStyle = des; c.fillRect(330, 330, G - 660, 330) }
    // Arch spandrels and niche surround
    const des2 = c.createPattern(starWeave('#0c1547', '#2fa6c6', '#e9e5d8', 'rgba(217,166,52,.7)'), 'repeat')
    if (des2) { c.fillStyle = des2; c.fillRect(330, 680, G - 660, Y - 1010) }
    c.fillStyle = yellow
    c.fillRect(330, 668, G - 660, 12)
    speck(c, G, Y, random(53), 1800, 0.035)
  })

  const halo = (color: string, size = 128) => canvas(size, size, (c, G, Y) => {
    const z = c.createRadialGradient(G / 2, Y / 2, 0, G / 2, Y / 2, G / 2)
    z.addColorStop(0, color); z.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = z
    c.fillRect(0, 0, G, Y)
  })

  const srgb = (t: THREE.Texture) => { t.colorSpace = THREE.SRGBColorSpace; return t }
  const load = new THREE.TextureLoader()
  const photo = (ad: string) => {
    if (PUBLIC_BUILD) return null
    const t = load.load(`/images/yesil-complex/model/${ad}.jpg`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  const fTile = photo('mihrab-tile'), fStar = photo('mihrab-star'), fBelt = photo('mihrab-belt')

  const carvingColor = texture(canvas(256, 256, drawCarving(false)), 0.9)
  const carvingKab = texture(canvas(256, 256, drawCarving(true)), 0.9, 0.9, false)

  return {
    navyTile: glossy(navy),
    greenTile: glossy(green),
    turquoiseTile: glossy(turquoise),
    tombTile: pbr({ map: texture(tombBrick, 2.6, 0.65), roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide }),
    alternating: pbr({ map: texture(alternating(16), 5, 5), roughness: 0.95 }),
    alternatingKind: pbr({ map: texture(alternating(24), 5, 5), roughness: 0.95 }),
    roofTile: pbr({ map: texture(roofTile, 3.2, 3.2), roughness: 0.85, side: THREE.DoubleSide }),
    pink: pbr({ map: texture(pink, 4), roughness: 0.92, side: THREE.DoubleSide }),
    cream: pbr({ map: texture(cream, 4), roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color('#3b3323') }),
    carving: pbr({ map: carvingColor, bumpMap: carvingKab, bumpScale: 1.2, roughness: 0.62 }),
    carpet: pbr({ map: texture(carpet, 7.5), roughness: 1 }),
    iron: pbr({ map: texture(iron, 0.16), roughness: 0.6, metalness: 0.35, side: THREE.DoubleSide }),
    friezeNavy: glossy(texture(frieze('#101c5c', '#e8e4d8', '#2fa6c6', '#d9a634'), 1.6, 1), THREE.DoubleSide),
    friezeTurquoise: glossy(texture(frieze('#1a7fa0', '#f0ece0', '#14246d', '#f3f0e6'), 1.4, 1), THREE.DoubleSide),
    friezeDark: glossy(texture(frieze('#7c2b1e', '#e8d7a6', '#16306f', '#e0c88c'), 1.8, 1), THREE.DoubleSide),
    mahfilTile: glossy(texture(starWeave('#14246d', '#d9a634', '#2fa6c6', 'rgba(230,226,216,.55)'), 0.62)),
    mahfilTileDark: glossy(texture(starWeave('#10245a', '#e9e5d8', '#2fa6c6', 'rgba(217,166,52,.55)'), 0.55)),
    redPaint: pbr({ map: texture(starWeave('#7c2b1e', '#16306f', '#e0c88c', 'rgba(224,200,140,.7)'), 1.5), roughness: 0.85, side: THREE.DoubleSide }),
    mihrab: glossy(srgb(new THREE.CanvasTexture(mihrabCanvas)), THREE.DoubleSide),
    mihrabPhoto: !!fTile,
    mihrabTile: pbr({ map: fTile, roughness: 0.35 }),
    mihrabStar: pbr({ map: fStar, roughness: 0.35 }),
    mihrabBelt: pbr({ map: fBelt, roughness: 0.35 }),
    domePaintA: pbr({ map: texture(paintedDome(48, '#16306f', '#7c2b1e', '#f1e6cd'), 1, 1), roughness: 0.9, side: THREE.DoubleSide }),
    domePaintB: pbr({ map: texture(paintedDome(24, '#16306f', '#a2482d', '#efe2c4'), 1, 1), roughness: 0.9, side: THREE.DoubleSide }),
    domeWhite: pbr({ map: texture(paintedDome(32, '#efe8d7', '#e6dcc5', '#f3ecdc'), 1, 1), roughness: 0.92, side: THREE.DoubleSide }),
    transition: pbr({ map: texture(paintedDome(16, '#16306f', '#7c2b1e', '#223d78'), 1, 1), roughness: 0.82, side: THREE.DoubleSide }),
    glassLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 2.1, 2.2), side: THREE.DoubleSide }),
    halo: new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(halo('rgba(255,225,170,.8)')), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    leaf: pbr({ color: '#47672c', roughness: 1, flatShading: true }),
    leafDark: pbr({ color: '#33511f', roughness: 1, flatShading: true }),
    grass: pbr({ color: '#54783a', roughness: 1 }),
    goggles: pbr({ color: '#6b5a4a', roughness: 0.9 }),
    greenColumn: pbr({ color: '#3f7a60', roughness: 0.35 }),
    walnut: pbr({ color: '#5a3a24', roughness: 0.55 }),
    walnutDark: pbr({ color: '#3a2415', roughness: 0.6 }),
    railing: pbr({ color: '#ecebe3', roughness: 0.7, side: THREE.DoubleSide }),
    blackMarble: pbr({ color: '#2d2a28', roughness: 0.28 }),
  }
}

export type GreenMaterials = ReturnType<typeof greenMaterials>
