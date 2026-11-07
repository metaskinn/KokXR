// Külliyeye özel tuval dokuları: dışarıdan görsel kullanılmaz. Örgü ve renkler kitaptaki fotoğraflara bakılarak
// yorumlanmıştır; bezemeler temsilîdir, hat yazısı taklit edilmez.
import * as THREE from 'three'
import { random } from '../../uluMosqueFloor'
import type { UluMosqueMaterials } from '../../uluMosqueTextures'

type Draw = (c: CanvasRenderingContext2D, w: number, h: number, r: () => number) => void

function texture(w: number, h: number, meterX: number, meterY: number, seed: number, draw: Draw, colored = true) {
  const el = document.createElement('canvas')
  el.width = w; el.height = h
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  draw(c, w, h, random(seed))
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / meterX, 1 / meterY)
  t.anisotropy = 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Sıra sıra örgü: `sira` her dönemde [yükseklik oranı, tuğla mı]. */
function weave(c: CanvasRenderingContext2D, w: number, h: number, r: () => number, row: { h: number; brick: boolean; block: number }[]) {
  c.fillStyle = '#bda98f'
  c.fillRect(0, 0, w, h)
  const top = row.reduce((t, s) => t + s.h, 0)
  let y = 0
  for (const s of row) {
    const sh = (s.h / top) * h
    const block = s.block, n = Math.max(1, Math.round(w / block)), bg = w / n
    const kay = r() * bg
    for (let i = -1; i < n + 1; i++) {
      const x = kay + i * bg
      c.fillStyle = s.brick
        ? `hsl(${13 + r() * 9} ${44 + r() * 16}% ${35 + r() * 12}%)`
        : `hsl(${33 + r() * 9} ${20 + r() * 12}% ${60 + r() * 13}%)`
      const a = s.brick ? 2 : 2
      c.fillRect(x + a / 2, y + a / 2, bg - a, sh - a)
    }
    y += sh
  }
}

function geometricRosette(c: CanvasRenderingContext2D, x: number, y: number, R: number, color: string) {
  c.strokeStyle = color
  c.lineWidth = Math.max(1, R * 0.05)
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4
    c.beginPath()
    c.moveTo(x, y)
    c.quadraticCurveTo(x + Math.cos(a + 0.4) * R * 0.7, y + Math.sin(a + 0.4) * R * 0.7, x + Math.cos(a) * R, y + Math.sin(a) * R)
    c.quadraticCurveTo(x + Math.cos(a - 0.4) * R * 0.7, y + Math.sin(a - 0.4) * R * 0.7, x, y)
    c.stroke()
  }
  c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke()
}

export function complexMaterials(m: UluMosqueMaterials) {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })

  // Almaşık: üç sıra tuğla, bir sıra kesme taş (kitap s. 82-83). Dönem 0.62 m.
  const T = { h: 0.1, brick: true, block: 110 }, S = { h: 0.32, brick: false, block: 290 }
  const alternating = texture(1024, 512, 2.4, 1.24, 71, (c, w, h, r) => weave(c, w, h, r, [T, T, T, S, T, T, T, S]))
  const brick = texture(512, 512, 1.6, 1.6, 72, (c, w, h, r) => weave(c, w, h, r, Array.from({ length: 22 }, () => ({ h: 1, brick: true, block: 70 }))))
  // Yan cephe: daha çok taş, araya iki sıra tuğla (s. 82 ve arka cephe fotoğrafı)
  const T2 = { h: 0.085, brick: true, block: 110 }
  const side = texture(1024, 512, 2.4, 1.16, 73, (c, w, h, r) => weave(c, w, h, r, [T2, T2, { h: 0.41, brick: false, block: 300 }, T2, T2, { h: 0.41, brick: false, block: 340 }]))
  const rubble = texture(1024, 1024, 4, 4, 74, (c, w, h, r) => {
    c.fillStyle = '#a58f76'; c.fillRect(0, 0, w, h)
    for (let i = 0; i < 620; i++) {
      c.fillStyle = r() > 0.8 ? `hsl(${14 + r() * 8} 42% ${36 + r() * 8}%)` : `hsl(${24 + r() * 14} ${16 + r() * 18}% ${38 + r() * 24}%)`
      const b = 22 + r() * 44, x = r() * w, y = r() * h
      c.beginPath(); c.ellipse(x, y, b, b * (0.45 + r() * 0.3), r() * 0.5, 0, Math.PI * 2); c.fill()
    }
  })
  const roofTile = texture(512, 512, 2.4, 2.4, 75, (c, w, h, r) => {
    const ROW = 12, SUT = 12
    for (let j = 0; j < ROW; j++) for (let i = 0; i <= SUT; i++) {
      c.fillStyle = `hsl(${11 + r() * 9} ${48 + r() * 18}% ${32 + r() * 13}%)`
      const x = ((i + (j % 2) * 0.5) * w) / SUT, y = (j * h) / ROW
      c.fillRect(x - w / SUT / 2 + 1, y, w / SUT - 2, h / ROW - 1)
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x - w / SUT / 2 + 1, y + h / ROW - 5, w / SUT - 2, 4)
    }
  })
  // Saçak altında tüm cepheyi geçen küçük sivri kemer dizisi (s. 84-85)
  const friezeBand = texture(256, 256, 0.9, 0.8, 76, (c, w, h) => {
    c.fillStyle = '#b4674a'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#d7c6a6'; c.fillRect(0, 0, w, h * 0.14)
    c.fillStyle = '#d7c6a6'
    c.beginPath(); c.moveTo(w * 0.1, h); c.lineTo(w * 0.1, h * 0.55); c.quadraticCurveTo(w * 0.1, h * 0.3, w / 2, h * 0.2); c.quadraticCurveTo(w * 0.9, h * 0.3, w * 0.9, h * 0.55); c.lineTo(w * 0.9, h); c.fill()
    c.fillStyle = '#3c2a22'
    c.beginPath(); c.moveTo(w * 0.24, h); c.lineTo(w * 0.24, h * 0.6); c.quadraticCurveTo(w * 0.24, h * 0.42, w / 2, h * 0.34); c.quadraticCurveTo(w * 0.76, h * 0.42, w * 0.76, h * 0.6); c.lineTo(w * 0.76, h); c.fill()
  })
  // Cephe panosu ve kemer alınlıkları: iki renkli geometrik dolgu (TDV; s. 82 fotoğrafı)
  const interlock = texture(256, 256, 0.8, 0.8, 77, (c, w, h) => {
    c.fillStyle = '#b4674a'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#ddcfb2'
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) {
      c.save(); c.translate(x, y); c.rotate(Math.PI / 4)
      c.fillRect(-w * 0.2, -w * 0.2, w * 0.4, w * 0.4)
      c.restore()
    }
    c.fillStyle = '#7d4230'
    for (const [x, y] of [[w / 2, 0], [0, h / 2], [w, h / 2], [w / 2, h]]) {
      c.beginPath(); c.arc(x, y, w * 0.08, 0, Math.PI * 2); c.fill()
    }
  })
  // Minare gövdesi: tuğla dizilimleri ve geometrik kuşak
  const minaret = texture(1024, 1024, 8.6, 8.6, 78, (c, w, h, r) => {
    weave(c, w, h, r, Array.from({ length: 70 }, () => ({ h: 1, brick: true, block: 42 })))
    c.strokeStyle = 'rgba(214,190,150,0.8)'; c.lineWidth = 7
    for (let y = 0; y < h; y += h / 4) {
      c.beginPath()
      for (let x = 0; x <= w; x += w / 16) c.lineTo(x, y + (Math.round(x / (w / 16)) % 2 ? 40 : 0))
      c.stroke()
    }
  })
  // Kalem işi kuşak: rumi kıvrımlar, lacivert ve altın
  const border = texture(512, 128, 1, 0.25, 79, (c, w, h) => {
    c.fillStyle = '#1e3f5c'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#c9a24d'; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8)
    c.fillStyle = '#7e2a26'; c.fillRect(0, 8, w, 7); c.fillRect(0, h - 15, w, 7)
    c.strokeStyle = '#d7b667'; c.lineWidth = 5
    for (let i = 0; i < 4; i++) {
      const x = (i * w) / 4
      c.beginPath(); c.moveTo(x, h / 2); c.bezierCurveTo(x + w * 0.06, 18, x + w * 0.16, 18, x + w / 4, h / 2); c.stroke()
      c.beginPath(); c.moveTo(x, h / 2); c.bezierCurveTo(x + w * 0.06, h - 18, x + w * 0.16, h - 18, x + w / 4, h / 2); c.stroke()
      c.fillStyle = '#e8d6a0'; c.beginPath(); c.arc(x + w / 8, h / 2, 9, 0, Math.PI * 2); c.fill()
    }
  })
  // Hal kenarı: meandr bordür (fotoğraflardaki mavi halı)
  const carpetEdge = texture(256, 128, 0.8, 0.4, 80, (c, w, h) => {
    c.fillStyle = '#17333f'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#d7b667'; c.lineWidth = 8
    for (let i = 0; i < 4; i++) {
      const x = (i * w) / 4
      c.beginPath(); c.moveTo(x, h - 22); c.lineTo(x, 24); c.lineTo(x + w * 0.18, 24); c.lineTo(x + w * 0.18, h - 44); c.lineTo(x + w * 0.09, h - 44); c.stroke()
    }
  })
  // Levha: yazısız, altın halkalı yeşil yuvarlak pano
  const plaque = texture(256, 256, 1, 1, 81, (c, w, h) => {
    c.fillStyle = '#c9a24d'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#1f4a39'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2); c.fill()
    geometricRosette(c, w / 2, h / 2, w * 0.33, '#d7b667')
  })
  plaque.repeat.set(1, 1)
  // Kubbe göbeği: sekiz kandil, sekiz madalyon, palmet sonlanma (s. 88). Üstten görünüşe göre boyanır.
  const boss = texture(1024, 1024, 1, 1, 82, (c, w, h) => {
    c.fillStyle = '#efe7d6'; c.fillRect(0, 0, w, h)
    const m0 = w / 2
    c.translate(m0, m0)
    for (let k = 0; k < 8; k++) {
      c.save(); c.rotate((k * Math.PI) / 4)
      // Madalyon
      c.fillStyle = '#23465f'; c.beginPath(); c.ellipse(0, -m0 * 0.47, m0 * 0.075, m0 * 0.11, 0, 0, Math.PI * 2); c.fill()
      c.strokeStyle = '#c9a24d'; c.lineWidth = 5; c.stroke()
      // Palmet
      c.fillStyle = '#7e2a26'
      c.beginPath(); c.moveTo(0, -m0 * 0.74); c.quadraticCurveTo(m0 * 0.07, -m0 * 0.64, 0, -m0 * 0.58); c.quadraticCurveTo(-m0 * 0.07, -m0 * 0.64, 0, -m0 * 0.74); c.fill()
      c.rotate(Math.PI / 8)
      // Kandil
      c.fillStyle = '#c9a24d'
      c.beginPath(); c.moveTo(0, -m0 * 0.3); c.lineTo(m0 * 0.035, -m0 * 0.42); c.lineTo(0, -m0 * 0.56); c.lineTo(-m0 * 0.035, -m0 * 0.42); c.closePath(); c.fill()
      c.strokeStyle = '#7e2a26'; c.lineWidth = 3
      c.beginPath(); c.moveTo(0, -m0 * 0.56); c.lineTo(0, -m0 * 0.76); c.stroke()
      c.restore()
    }
    c.strokeStyle = '#c9a24d'; c.lineWidth = 10
    for (const R of [0.2, 0.28, 0.8]) { c.beginPath(); c.arc(0, 0, m0 * R, 0, Math.PI * 2); c.stroke() }
    c.fillStyle = '#1e3f5c'; c.beginPath(); c.arc(0, 0, m0 * 0.19, 0, Math.PI * 2); c.fill()
    c.strokeStyle = '#7e2a26'; c.lineWidth = 6
    c.beginPath(); c.arc(0, 0, m0 * 0.9, 0, Math.PI * 2); c.stroke()
  })
  boss.repeat.set(1, 1)
  // Perde motifi: ortasında kandil sarkan perde (s. 88). Yan eyvanların güney duvarında.
  const curtain = texture(512, 1024, 1, 1, 83, (c, w, h, r) => {
    c.fillStyle = '#f0e6d0'; c.fillRect(0, 0, w, h)
    const edge = 46
    c.fillStyle = '#2b2a2c'; c.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 26) for (let x = 0; x < w; x += 26) {
      c.fillStyle = (x + y) % 52 ? '#a67c35' : '#6e2a22'
      if (r() > 0.25) c.fillRect(x + 6, y + 6, 14, 14)
    }
    c.fillStyle = '#ead9b4'; c.fillRect(edge, edge + 120, w - edge * 2, h - edge - 120)
    c.fillStyle = '#efe7d6'; c.beginPath(); c.moveTo(edge, h); c.lineTo(edge, edge + 120); c.quadraticCurveTo(w / 2, edge + 40, w - edge, edge + 120); c.lineTo(w - edge, h); c.fill()
    const curtainColor = (x0: number, dir: number) => {
      c.fillStyle = '#a4552f'
      c.beginPath(); c.moveTo(x0, edge + 120); c.quadraticCurveTo(x0 + dir * 170, edge + 420, x0 + dir * 66, h - 180); c.lineTo(x0, h - 40); c.closePath(); c.fill()
      c.strokeStyle = '#e8c591'; c.lineWidth = 4
      for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x0 + dir * k * 22, edge + 130); c.quadraticCurveTo(x0 + dir * (60 + k * 22), edge + 420, x0 + dir * k * 13, h - 90); c.stroke() }
    }
    curtainColor(edge, 1); curtainColor(w - edge, -1)
    c.strokeStyle = '#5c4326'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, edge + 80); c.lineTo(w / 2, h * 0.62); c.stroke()
    c.fillStyle = '#6e4a22'; c.beginPath(); c.moveTo(w / 2, h * 0.6); c.lineTo(w / 2 + 28, h * 0.68); c.lineTo(w / 2, h * 0.78); c.lineTo(w / 2 - 28, h * 0.68); c.closePath(); c.fill()
  })
  curtain.repeat.set(1, 1)
  // Mihrap çerçevesi: iç içe kırmızı, lacivert ve altın kuşaklar. Yazı yoktur.
  const mihrabFrame = texture(1024, 1024, 1, 1, 84, (c, w, h, r) => {
    const belts: [string, number][] = [['#b08433', 26], ['#541c1b', 66], ['#c9a24d', 16], ['#16304a', 74], ['#c9a24d', 14], ['#6d2120', 96], ['#c9a24d', 14], ['#16304a', 66], ['#c9a24d', 20], ['#541c1b', 200]]
    let g = 0
    for (const [color, stay] of belts) {
      c.fillStyle = color
      c.fillRect(g, g, w - g * 2, h - g * 2)
      const i = g + stay / 2
      if (stay > 40) {
        c.fillStyle = color === '#16304a' ? '#d7b667' : '#c9a24d'
        for (let t = 0; t < 1; t += 0.018) for (const [x, y] of [[i + t * (w - 2 * i), i], [i + t * (w - 2 * i), h - i], [i, i + t * (h - 2 * i)], [w - i, i + t * (h - 2 * i)]]) {
          c.save(); c.translate(x, y); c.rotate(r() * 6)
          c.beginPath(); c.ellipse(0, 0, 6, 11, 0, 0, Math.PI * 2); c.fill()
          c.restore()
        }
      }
      g += stay
    }
  })
  mihrabFrame.repeat.set(1, 1)
  const hoodBottom = texture(256, 256, 1, 1, 85, (c, w, h) => {
    c.fillStyle = '#16304a'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#a67c35'; c.lineWidth = 3; c.strokeRect(14, 14, w - 28, h - 28)
    geometricRosette(c, w / 2, h * 0.45, w * 0.26, '#d7b667')
  })
  hoodBottom.repeat.set(1, 1)

  // Minber yüzü: kabartma geometrik motifli ahşap (s. 91); desen temsilîdir
  const carving = texture(256, 256, 0.5, 0.5, 86, (c, w, h) => {
    c.fillStyle = '#7a4d28'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#3f2412'; c.lineWidth = 7
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) {
      for (let k = 0; k < 2; k++) {
        c.save(); c.translate(x, y); c.rotate((k * Math.PI) / 4)
        c.strokeRect(-w * 0.17, -w * 0.17, w * 0.34, w * 0.34)
        c.restore()
      }
    }
    c.fillStyle = '#a06c3a'
    for (const [x, y] of [[w / 2, 0], [0, h / 2], [w, h / 2], [w / 2, h]]) { c.beginPath(); c.arc(x, y, w * 0.06, 0, Math.PI * 2); c.fill() }
  })

  const carpet = m.carpetPlain as THREE.MeshStandardMaterial
  const carpetMat = (color: string) => pbr({ map: carpet.map, normalMap: carpet.normalMap, normalScale: new THREE.Vector2(0.7, 0.7), color: color, roughness: 0.96 })
  return {
    alternating: pbr({ map: alternating, roughness: 0.9 }),
    sideFacade: pbr({ map: side, roughness: 0.92 }),
    brickRough: pbr({ map: brick, roughness: 0.92 }),
    rubble: pbr({ map: rubble, roughness: 0.96 }),
    roofTile: pbr({ map: roofTile, roughness: 0.82, side: THREE.DoubleSide }),
    friezeBand: pbr({ map: friezeBand, roughness: 0.9 }),
    interlock: pbr({ map: interlock, roughness: 0.88 }),
    minaret: pbr({ map: minaret, roughness: 0.92 }),
    border: pbr({ map: border, roughness: 0.6, metalness: 0.1 }),
    carpetEdge: pbr({ map: carpetEdge, roughness: 0.95 }),
    plaque: pbr({ map: plaque, roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide }),
    boss: pbr({ map: boss, roughness: 0.85, side: THREE.DoubleSide }),
    curtain: pbr({ map: curtain, roughness: 0.8 }),
    mihrabFrame: pbr({ map: mihrabFrame, roughness: 0.42, metalness: 0.22, side: THREE.DoubleSide }),
    hoodBottom: pbr({ map: hoodBottom, roughness: 0.55 }),
    carpetBlue: carpetMat('#1a86c0'),
    carpetRed: carpetMat('#b13f34'),
    wallInner: pbr({ color: '#e4e1d9', roughness: 0.9 }),
    minbar: pbr({ map: carving, roughness: 0.6, side: THREE.DoubleSide }),
    ceiling: pbr({ color: '#ece8df', roughness: 0.9, side: THREE.DoubleSide }),
    white: pbr({ color: '#efece4', roughness: 0.55 }),
    cream: pbr({ color: '#dfcf9e', roughness: 0.9 }),
    stonePaving: pbr({ color: '#8a7d6b', roughness: 0.92 }),
    path: pbr({ color: '#57534c', roughness: 0.98 }),
    grass: pbr({ color: '#4f6a36', roughness: 1 }),
    leaf: pbr({ color: '#5d7a35', roughness: 1 }),
    leafDark: pbr({ color: '#3f5a2b', roughness: 1 }),
    tension: pbr({ color: '#4a3020', roughness: 0.7 }),
    door: pbr({ color: '#94602c', roughness: 0.55 }),
    darkGlass: pbr({ color: '#20262a', roughness: 0.25, metalness: 0.3, side: THREE.DoubleSide }),
    windowLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.42, 1.25), side: THREE.DoubleSide }),
    lantern: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.8, 1), side: THREE.DoubleSide }),
    eight: pbr({ color: '#d9cfbb', roughness: 0.4 }),
  }
}

export type ComplexMaterials = ReturnType<typeof complexMaterials>
