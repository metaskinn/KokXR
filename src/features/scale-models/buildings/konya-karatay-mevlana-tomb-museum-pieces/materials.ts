// Materials for the Mevlâna Complex model: light canvas patterns, the rest from the shared Ulu Camii set.
import * as THREE from 'three'
import { uluMosqueMaterials } from '../../uluMosqueTextures'
import { random } from '../../uluMosqueFloor'

function canvas(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const el = document.createElement('canvas')
  el.width = w; el.height = h
  const c = el.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  draw(c, w, h)
  return el
}
function texture(el: HTMLCanvasElement, meterX: number, meterY: number) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / meterX, 1 / meterY)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Cut stone in courses; tones kept light like the stone in the book's photos. */
function ashlarCanvas(seed: number, tones: string[], joint: string, rows: number) {
  const r = random(seed)
  return canvas(512, 512, (c, W, H) => {
    c.fillStyle = joint; c.fillRect(0, 0, W, H)
    const h = H / rows
    for (let s = 0; s < rows; s++) {
      let x = -r() * 80
      while (x < W) {
        const w = 60 + r() * 110
        c.fillStyle = tones[Math.floor(r() * tones.length)]
        c.fillRect(x + 1.5, s * h + 1.5, w - 3, h - 3)
        if (x < 0) c.fillRect(x + W + 1.5, s * h + 1.5, w - 3, h - 3)
        x += w
      }
    }
  })
}

/** Glazed tile: small square tiles with light joints and slight tone variation. */
function tileCanvas(seed: number) {
  const r = random(seed)
  return canvas(256, 256, (c, W) => {
    c.fillStyle = '#bfe3e0'; c.fillRect(0, 0, W, W)
    const n = 8, s = W / n
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      c.fillStyle = `hsl(${182 + r() * 6} 72% ${36 + r() * 8}%)`
      c.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3)
    }
  })
}

/** Inner dome: kalem-işi-like ribs and bands, drawn once around and once up the dome (UV 0..1). Pattern representative. */
function domeInnerCanvas() {
  return canvas(512, 256, (c, W, H) => {
    c.fillStyle = '#efe3c8'; c.fillRect(0, 0, W, H)
    c.fillStyle = '#a8402e'; c.fillRect(0, 0, W, H * 0.06)
    c.fillStyle = '#2f5d57'; c.fillRect(0, H * 0.06, W, H * 0.025)
    c.fillStyle = '#b7863a'; c.fillRect(0, H * 0.42, W, H * 0.02)
    c.strokeStyle = 'rgba(168,64,46,0.55)'; c.lineWidth = 3
    for (let i = 0; i < 16; i++) { const x = (i + 0.5) * W / 16; c.beginPath(); c.moveTo(x, H * 0.09); c.lineTo(x, H * 0.92); c.stroke() }
    c.fillStyle = '#a8402e'; c.fillRect(0, H * 0.9, W, H * 0.1)
  })
}

function speckleCanvas(seed: number, base: string, a: string, b: string) {
  const r = random(seed)
  return canvas(256, 256, (c, W, H) => {
    c.fillStyle = base; c.fillRect(0, 0, W, H)
    c.globalAlpha = 0.3
    for (let n = 0; n < 2200; n++) {
      c.fillStyle = r() > 0.5 ? a : b
      c.beginPath(); c.ellipse(r() * W, r() * H, 1 + r() * 4, 1 + r() * 3, r() * 3, 0, Math.PI * 2); c.fill()
    }
    c.globalAlpha = 1
  })
}

export function mevlanaMaterials() {
  const u = uluMosqueMaterials()
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  return {
    u,
    ashlar: std({ map: texture(ashlarCanvas(5, ['#d8d1c2', '#cfc6b4', '#e0d9cb', '#c8bfae'], '#a59c8c', 9), 4, 4) }),
    rubble: std({ map: texture(ashlarCanvas(13, ['#b9ad98', '#a99d88', '#c4b8a2', '#9f9480'], '#8a8070', 14), 3, 3), roughness: 0.95 }),
    tile: std({ map: texture(tileCanvas(17), 1.2, 1.2), roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide }),
    grass: std({ map: texture(speckleCanvas(23, '#4f6a38', '#62803f', '#3b512a'), 5, 5), roughness: 1 }),
    leaf: std({ map: texture(speckleCanvas(29, '#3f6330', '#5f8a3e', '#2a4522'), 4, 4), roughness: 1, flatShading: true }),
    window: std({ color: '#2b3036', roughness: 0.4 }),
    cloth: std({ color: '#1f6b46', roughness: 0.9 }),
    railing: std({ color: '#6b4527', roughness: 0.6 }),
    floor: std({ color: '#cfc6b6', roughness: 0.8 }),
    plaster: std({ color: '#efe6d3', roughness: 0.9, side: THREE.DoubleSide }),
    domeInner: std({ map: (() => { const t = new THREE.CanvasTexture(domeInnerCanvas()); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t })(), roughness: 0.9, side: THREE.DoubleSide }),
    silver: std({ color: '#c9ccd1', roughness: 0.35, metalness: 0.7 }),
    niche: std({ color: '#7d8580', roughness: 0.45 }),
  }
}
export type MM = ReturnType<typeof mevlanaMaterials>
