// Ulu Camii maketinin dokuları: tamamı tuvalde üretilir, dışarıdan görsel kullanılmaz.
// Renkler ve örgü düzeni arşiv fotoğraflarına bakılarak yorumlanmıştır; yazı veya hat taklidi çizilmez.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../data/openPublication'
import { innerDomeSetting, domeTexLen, drawLeadFlat, drawLeadDome, drawPendentive } from './ulu-mosque/domes'
import { lightDevice, carpetTextures, marblePavingTextures, marbleBodyTexture, random, waterNormal } from './uluMosqueFloor'

type Draw = (c: CanvasRenderingContext2D, g: number, y: number) => void

function canvas(g: number, y: number, draw: Draw) {
  const el = document.createElement('canvas')
  el.width = g
  el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  draw(c, g, y)
  return el
}

/** `olcek` metre: dokunun kaç metrede bir tekrarlanacağı (UV'ler metre cinsindendir). */
function texture(el: HTMLCanvasElement, scale: number, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / scale, 1 / scale)
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

interface Weave {
  seed: number
  size: number
  row: [number, number]
  block: [number, number]
  joint: string
  jointThick: number
  color: (r: () => number) => string
}

/** Sıra sıra blok örgüsü: aynı düzenden renk ve kabartma dokusu üretir. */
function weave(o: Weave) {
  const layout: { x: number; y: number; g: number; h: number; color: string; tone: number }[] = []
  const r = random(o.seed)
  let y = 0
  while (y < o.size) {
    let h = o.row[0] + r() * (o.row[1] - o.row[0])
    if (o.size - y - h < o.row[0]) h = o.size - y
    let x = -r() * o.block[0]
    while (x < o.size) {
      const g = o.block[0] + r() * (o.block[1] - o.block[0])
      layout.push({ x, y, g, h, color: o.color(r), tone: 120 + r() * 70 })
      x += g
    }
    y += h
  }
  const color = canvas(o.size, o.size, (c, g, b) => {
    c.fillStyle = o.joint
    c.fillRect(0, 0, g, b)
    const d = o.jointThick
    for (const p of layout) {
      c.fillStyle = p.color
      c.fillRect(p.x + d / 2, p.y + d / 2, p.g - d, p.h - d)
    }
    speck(c, g, b, r, o.size * 8)
  })
  const relief = canvas(o.size, o.size, (c, g, b) => {
    c.fillStyle = '#202020'
    c.fillRect(0, 0, g, b)
    const d = o.jointThick
    for (const p of layout) {
      const t = Math.round(p.tone)
      c.fillStyle = `rgb(${t},${t},${t})`
      c.fillRect(p.x + d / 2, p.y + d / 2, p.g - d, p.h - d)
    }
    speck(c, g, b, r, o.size * 4, 0.1)
  })
  return { color, relief }
}

export function uluMosqueTextures() {
  const stone = weave({
    seed: 11, size: 1024, row: [46, 88], block: [70, 170], joint: '#8f7d69', jointThick: 3,
    color: (r) => `hsl(${24 + r() * 14} ${20 + r() * 16}% ${r() > 0.82 ? 54 + r() * 8 : 62 + r() * 12}%)`,
  })
  const marble = weave({
    seed: 23, size: 1024, row: [60, 120], block: [110, 260], joint: '#9ca0a6', jointThick: 2,
    color: (r) => `hsl(${205 + r() * 20} ${4 + r() * 6}% ${74 + r() * 16}%)`,
  })
  const marbleColor = marble.color
  const mc = marbleColor.getContext('2d')
  if (mc) {
    const r = random(77)
    for (let i = 0; i < 90; i++) {
      mc.strokeStyle = `rgba(95,104,118,${0.1 + r() * 0.22})`
      mc.lineWidth = 0.6 + r() * 1.8
      const x = r() * 1024, y = r() * 1024
      mc.beginPath()
      mc.moveTo(x, y)
      mc.bezierCurveTo(x + 40 + r() * 80, y + (r() - 0.5) * 50, x + 100 + r() * 80, y + (r() - 0.5) * 70, x + 180 + r() * 90, y + (r() - 0.5) * 60)
      mc.stroke()
    }
  }
  const brick = weave({
    seed: 31, size: 512, row: [15, 19], block: [38, 62], joint: '#a48f72', jointThick: 3,
    color: (r) => `hsl(${24 + r() * 10} ${26 + r() * 14}% ${36 + r() * 14}%)`,
  })
  const paving = weave({
    seed: 41, size: 1024, row: [60, 110], block: [90, 210], joint: '#6f675c', jointThick: 3,
    color: (r) => `hsl(${28 + r() * 12} ${8 + r() * 8}% ${40 + r() * 11}%)`,
  })

  const leadFlat = canvas(512, 512, drawLeadFlat)

  const plaster = canvas(256, 256, (c, g, y) => {
    const r = random(71)
    c.fillStyle = '#e6d283'
    c.fillRect(0, 0, g, y)
    speck(c, g, y, r, 2500, 0.035)
  })

  const cage = canvas(128, 128, (c, g, y) => {
    c.fillStyle = '#ece6da'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#26292a'
    const k = g / 2
    for (const [x, v] of [[k, k], [0, 0], [g, 0], [0, y], [g, y]]) {
      c.beginPath()
      c.moveTo(x, v - 42); c.lineTo(x + 28, v); c.lineTo(x, v + 42); c.lineTo(x - 28, v)
      c.closePath(); c.fill()
    }
  })

  const leaf = (c: CanvasRenderingContext2D, x: number, y: number, b: number, a = 0) => {
    c.save(); c.translate(x, y); c.rotate(a)
    c.beginPath()
    c.moveTo(0, -b); c.quadraticCurveTo(b * 0.75, -b * 0.15, 0, b); c.quadraticCurveTo(-b * 0.75, -b * 0.15, 0, -b)
    c.closePath(); c.fill(); c.restore()
  }
  /** Sekiz köşeli yıldızlı geometrik göbek. */
  const boss = (c: CanvasRenderingContext2D, x: number, y: number, r: number, outer: string, inner: string) => {
    for (const [o, color] of [[r, outer], [r * 0.62, inner]] as const) {
      c.fillStyle = color
      c.beginPath()
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, u = i % 2 ? o * 0.62 : o
        c.lineTo(x + Math.sin(a) * u, y + Math.cos(a) * u)
      }
      c.closePath(); c.fill()
    }
  }

  // Paye yüzü: mermer kaide ve koyu çift çizgi. Yazılar ayrı olarak arşiv fotoğrafından gelir.
  const pier = canvas(512, 2048, (c, g, y) => {
    const cy = (m: number) => ((13 - m) / 12.3) * y
    c.fillStyle = '#f1e8d6'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#c3bdb1'
    c.fillRect(0, cy(2.1), g, y - cy(2.1))
    c.fillStyle = '#2e2a26'
    c.fillRect(0, cy(2.1) - 8, g, 8)
    c.fillStyle = '#8a6a35'
    c.fillRect(0, cy(2.1) - 14, g, 3)
    for (const x of [14, g - 22]) {
      c.fillStyle = '#2e2a26'; c.fillRect(x, 0, 8, cy(2.1))
    }
    for (const x of [28, g - 31]) {
      c.fillStyle = '#8a6a35'; c.fillRect(x, 0, 3, cy(2.1))
    }
  })

  const pendentive = canvas(1024, 256, drawPendentive)

  // Fotoğraflardaki gibi yaprak dizili dal kuşağı. Yazı üretmez;
  // açık yayında özel fotoğrafın yerine kullanılan boyalı bezemedir.
  const archBand = canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#dfc899'; c.fillRect(0, 0, g, y)
    for (let row = 0; row < 4; row++) {
      const cy = row * 64 + 32
      c.strokeStyle = '#5a493b'; c.lineWidth = 2
      c.beginPath(); c.moveTo(0, cy); c.lineTo(g, cy); c.stroke()
      c.fillStyle = '#514337'
      for (let n = 0; n < 8; n++) {
        const x = n * 32 + 16
        for (const side of [-1, 1]) {
          leaf(c, x, cy + side * 12, 15, side * 0.8)
          leaf(c, x + 10, cy + side * 8, 10, side * 1.1)
        }
      }
      c.strokeStyle = '#a27d3d'; c.lineWidth = 2
      for (const yy of [cy - 29, cy + 29]) {
        c.beginPath(); c.moveTo(0, yy); c.lineTo(g, yy); c.stroke()
      }
    }
  })

  // Pencereden gelen ışık: koyu kafes, sıcak açık boşluklar
  const glassCage = canvas(128, 128, (c, g, y) => {
    c.fillStyle = '#3d2e22'
    c.fillRect(0, 0, g, y)
    const k = g / 2
    for (const [x, v, color] of [[k, k, '#ffe9c2'], [0, 0, '#f7c9a6'], [g, 0, '#f7c9a6'], [0, y, '#f7c9a6'], [g, y, '#f7c9a6']] as const) {
      c.fillStyle = color
      c.beginPath()
      c.moveTo(x, v - 44); c.lineTo(x + 30, v); c.lineTo(x, v + 44); c.lineTo(x - 30, v)
      c.closePath(); c.fill()
    }
  })

  // İç duvar: dokunun yüksekliği duvarın yüksekliğine eşlenir (0–13 m). Fotoğraflarda (ERD05007, ERD05161) sıva
  // halıya kadar iner; dipte koyu ve aşı boyası çift bant, yukarıda ince bir çizgi vardır, mermer kaide yoktur.
  const innerWall = canvas(64, lightDevice() ? 1024 : 2048, (c, g, y) => {
    const cy = (m: number) => ((13 - m) / 13) * y
    c.fillStyle = '#f2e9d8'
    c.fillRect(0, 0, g, y)
    const band = (m0: number, m1: number, color: string) => { c.fillStyle = color; c.fillRect(0, cy(m1), g, cy(m0) - cy(m1)) }
    band(1.16, 1.2, '#a98a4a')
    band(1.22, 1.33, '#3b342c')
    band(1.35, 1.37, '#a98a4a')
    band(6.72, 6.75, '#3b342c')
    band(6.77, 6.785, '#a98a4a')
    // Halı kenarındaki temas gölgesi
    const dip = c.createLinearGradient(0, cy(1.05), 0, cy(0.7))
    dip.addColorStop(0, 'rgba(70,52,34,0)'); dip.addColorStop(1, 'rgba(70,52,34,0.42)')
    c.fillStyle = dip
    c.fillRect(0, cy(1.05), g, cy(0.7) - cy(1.05))
  })

  // Kündekâri izlenimi: koyu ahşapta yıldız ağı. Gerçek minberin deseninin kopyası değildir.
  const kundekari = canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#1b100a'
    c.fillRect(0, 0, g, y)
    for (const [x, v] of [[0, 0], [g, 0], [0, y], [g, y], [g / 2, y / 2]] as const) boss(c, x, v, 74, '#3d2616', '#6b4a28')
    c.strokeStyle = 'rgba(150,115,60,0.5)'; c.lineWidth = 3
    c.strokeRect(1, 1, g - 2, y - 2)
  })

  const woodLattice = canvas(256, 128, (c, g, y) => {
        c.fillStyle = '#3a2317'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#17100b'
    for (let x = 8; x < g; x += 32) c.fillRect(x, 16, 18, y - 32)
    c.fillStyle = '#6d4524'
    for (let x = 17; x < g; x += 32) c.fillRect(x - 2, 56, 4, 16)
  })

  // Mihrap yüzeyleri: bitkisel kıvrımlar ve geometrik dizi; yazı içermez
  const ornament = canvas(512, 512, (c, g, y) => {
    c.fillStyle = '#5a2019'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#c99e4b'; c.lineWidth = 4
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x = a * 256 + 128, v = b * 256 + 128
      c.beginPath()
      for (let t = 0; t < 24; t += 0.25) {
        const r = 8 + t * 4.4
        c.lineTo(x + Math.cos(t) * r, v + Math.sin(t) * r)
      }
      c.stroke()
      c.fillStyle = '#e8c56f'
      boss(c, x, v, 20, '#e8c56f', '#7a3226')
    }
  })
  const mihrabBlue = canvas(256, 256, (c, g, y) => {
    c.fillStyle = '#24376b'
    c.fillRect(0, 0, g, y)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x = a * 128 + 64, v = b * 128 + 64
      c.fillStyle = '#c9cfd8'
      for (let n = 0; n < 6; n++) leaf(c, x + Math.sin(n) * 24, v + Math.cos(n) * 24, 19, -n)
      boss(c, x, v, 16, '#e0b95f', '#8a6a35')
    }
  })
  const mihrabGreen = canvas(128, 128, (c, g, y) => {
    c.fillStyle = '#183a2e'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#d6ad56'
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) leaf(c, a * 64 + 32, b * 64 + 32, 22, Math.PI / 4)
  })
  const mihrabRed = canvas(128, 128, (c, g, y) => {
    c.fillStyle = '#4d1712'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#672519'
    for (let v = 0; v < y; v += 32) c.fillRect(0, v, g, 6)
  })

  const cam = canvas(512, 256, (c, g, y) => {
    c.fillStyle = 'rgba(150,190,205,0.32)'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = 'rgba(30,38,42,0.95)'
    c.lineWidth = 5
    for (let x = 0; x <= g; x += g / 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke() }
    for (let v = 0; v <= y; v += y / 4) { c.beginPath(); c.moveTo(0, v); c.lineTo(g, v); c.stroke() }
  })

  const drawCypress = (relief: boolean): Draw => (c, g, y) => {
    const r = random(97)
    c.fillStyle = relief ? '#555' : '#1c3626'
    c.fillRect(0, 0, g, y)
    for (let i = 0; i < 2600; i++) {
      const a = r()
      c.fillStyle = relief ? `rgb(${40 + a * 200},${40 + a * 200},${40 + a * 200})` : `hsl(${135 + a * 25} ${28 + a * 18}% ${10 + a * 20}%)`
      c.beginPath()
      c.ellipse(r() * g, r() * y, 2 + r() * 3, 7 + r() * 9, (r() - 0.5) * 0.9, 0, Math.PI * 2)
      c.fill()
    }
  }

  // Kâbe kapısının örtüsü: siyah dokuma, burgulu bordür, işlemeleri dökülmüş altın kemer ve göbekler.
  // Yazı içermez; gerçek ayet işlemeleri taklit edilmez.
  const kaabaCover = canvas(1024, 1332, (c, g, y) => {
    const r = random(131)
    c.fillStyle = '#0d0c0b'
    c.fillRect(0, 0, g, y)
    for (let v = 0; v < y; v += 3) {
      c.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.022})`
      c.fillRect(0, v, g, 1)
    }
    // Burgulu bordür
    const b = 78
    c.strokeStyle = '#a08a5e'; c.lineWidth = 3
    c.strokeRect(b, b, g - b * 2, y - b * 2)
    c.strokeRect(10, 10, g - 20, y - 20)
    const twist = (x: number, v: number, a: number) => {
      c.save(); c.translate(x, v); c.rotate(a)
      c.fillStyle = '#b39c6c'
      c.beginPath(); c.ellipse(0, 0, 24, 8, 0.7, 0, Math.PI * 2); c.fill()
      c.fillStyle = 'rgba(30,22,12,0.55)'
      c.beginPath(); c.ellipse(4, 3, 18, 3, 0.7, 0, Math.PI * 2); c.fill()
      c.restore()
    }
    for (let x = b / 2 + 10; x < g - 30; x += 40) { twist(x, 44, 0); twist(x, y - 44, 0) }
    for (let v = b + 34; v < y - b - 10; v += 40) { twist(44, v, Math.PI / 2); twist(g - 44, v, Math.PI / 2) }
    // İç işleme: iç içe sivri kemer, baklava ağı, köşe göbekleri
    const gold = '#c79d4d'
    const drawArch = (o: number, alt: number, top: number) => {
      c.beginPath()
      c.moveTo(g / 2 - o, alt); c.lineTo(g / 2 - o, top + o * 1.05)
      c.quadraticCurveTo(g / 2 - o, top + o * 0.3, g / 2, top)
      c.quadraticCurveTo(g / 2 + o, top + o * 0.3, g / 2 + o, top + o * 1.05)
      c.lineTo(g / 2 + o, alt)
    }
    const alt = y - 190, top = 190
    c.save()
    drawArch(300, alt, top + 40); c.closePath(); c.clip()
    c.strokeStyle = 'rgba(199,157,77,0.55)'; c.lineWidth = 2
    for (let i = -y; i < y; i += 64) {
      c.beginPath(); c.moveTo(0, i); c.lineTo(g, i + g * 0.6); c.stroke()
      c.beginPath(); c.moveTo(g, i); c.lineTo(0, i + g * 0.6); c.stroke()
    }
    c.fillStyle = gold
    for (let a = 0; a < 9; a++) for (let e = 0; e < 13; e++) leaf(c, 130 + a * 95 + (e % 2) * 47, 180 + e * 80, 11, (a + e) * 0.7)
    c.restore()
    c.strokeStyle = gold
    for (const [o, l, u] of [[300, 6, 40], [335, 3, 0], [355, 2, -24]] as const) { c.lineWidth = l; drawArch(o, alt, top + u); c.stroke() }
    c.lineWidth = 6
    c.beginPath(); c.moveTo(g / 2 - 355, alt); c.lineTo(g / 2 + 355, alt); c.stroke()
    for (let x = g / 2 - 320; x <= g / 2 + 320; x += 80) boss(c, x, alt + 48, 26, gold, '#2a1f10')
    for (const [x, v] of [[170, 190], [g - 170, 190]] as const) { boss(c, x, v, 62, gold, '#14100b'); boss(c, x, v, 24, gold, '#14100b') }
    boss(c, g / 2, (alt + top) / 2 + 40, 118, gold, '#14100b')
    boss(c, g / 2, (alt + top) / 2 + 40, 54, gold, '#14100b')
    // Dökülmüş işlemeler: altının üzerine düzensiz koyu yamalar
    for (let i = 0; i < 520; i++) {
      const x = 90 + r() * (g - 180), v = 90 + r() * (y - 180), a = 6 + r() * r() * 70
      c.fillStyle = `rgba(13,12,11,${0.25 + r() * 0.6})`
      c.beginPath(); c.ellipse(x, v, a, a * (0.35 + r() * 0.8), r() * 3, 0, Math.PI * 2); c.fill()
    }
  })

  // Lamba halesi: görüntü işleme kapalıyken ve VR'da da parıltı verir.
  const halo = canvas(128, 128, (c, g, y) => {
    const z = c.createRadialGradient(g / 2, y / 2, 0, g / 2, y / 2, g / 2)
    z.addColorStop(0, 'rgba(255,240,210,1)'); z.addColorStop(0.16, 'rgba(255,214,150,0.55)'); z.addColorStop(0.5, 'rgba(255,190,110,0.12)'); z.addColorStop(1, 'rgba(255,180,100,0)')
    c.fillStyle = '#000'; c.fillRect(0, 0, g, y)
    c.fillStyle = z; c.fillRect(0, 0, g, y)
  })
  // Şadırvan kubbesinden inen ışık: yukarıda parlak, aşağıda sönen, hafif çizgili.
  const lightColumn = canvas(256, 256, (c, g, y) => {
    const r = random(151)
    const z = c.createLinearGradient(0, 0, 0, y)
    z.addColorStop(0, '#fff3da'); z.addColorStop(0.55, '#6b6252'); z.addColorStop(1, '#000')
    c.fillStyle = z; c.fillRect(0, 0, g, y)
    c.globalCompositeOperation = 'multiply'
    for (let x = 0; x < g; x += 8) { const t = Math.round(120 + r() * 135); c.fillStyle = `rgb(${t},${t},${t})`; c.fillRect(x, 0, 8, y) }
  })

  const domeTex = texture(canvas(domeTexLen(), domeTexLen() / 2, drawLeadDome(false)), 1)
  const domeRelief = texture(canvas(domeTexLen() / 2, domeTexLen() / 4, drawLeadDome(true)), 1, false)
  const glassTex = texture(cam, 1)
  const innerWallTex = texture(innerWall, 1)
  innerWallTex.repeat.set(0.25, 1 / 13)
  const woodLatticeTex = texture(woodLattice, 1)
  woodLatticeTex.repeat.set(1.3, 1.4)

  return {
    stone: texture(stone.color, 8), stoneRelief: texture(stone.relief, 8, false),
    marble: texture(marbleColor, 7), marbleRelief: texture(marble.relief, 7, false),
    brick: texture(brick.color, 3.2), brickRelief: texture(brick.relief, 3.2, false),
    paving: texture(paving.color, 14), pavingRelief: texture(paving.relief, 14, false),
    leadFlat: texture(leadFlat, 7),
    dome: domeTex, domeRelief,
    kaabaCover: texture(kaabaCover, 1),
    cypress: texture(canvas(512, 512, drawCypress(false)), 4),
    cypressRelief: texture(canvas(512, 512, drawCypress(true)), 4, false),
    plaster: texture(plaster, 4),
    cage: texture(cage, 0.34),
    carpet: carpetTextures(),
    marblePaving: marblePavingTextures(),
    marbleBody: marbleBodyTexture(),
    waterNormalOf: waterNormal(),
    pier: texture(pier, 1),
    pendentive: texture(pendentive, 1),
    archBand: texture(archBand, 0.62),
    glassCage: texture(glassCage, 0.34),
    innerWall: innerWallTex,
    kundekari: texture(kundekari, 0.46),
    woodLattice: woodLatticeTex,
    ornament: texture(ornament, 1.25),
    mihrabBlue: texture(mihrabBlue, 0.9),
    mihrabGreen: texture(mihrabGreen, 0.42),
    mihrabRed: texture(mihrabRed, 0.9),
    cam: glassTex,
    halo: texture(halo, 1),
    lightColumn: texture(lightColumn, 1),
  }
}

const AGE_COMMON = `
varying vec3 vYasPoz;
float yasKarma(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float yasGurultu(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(yasKarma(i), yasKarma(i + vec2(1, 0)), f.x), mix(yasKarma(i + vec2(0, 1)), yasKarma(i + vec2(1, 1)), f.x), f.y);
}
float yasFbm(vec2 p) {
  float t = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { t += a * yasGurultu(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return t;
}`

// Zemin için ortak: en yakın paye köşesi, duvar uzaklığı ve göz ortasındaki avizenin düşürdüğü ışık.
const FLOOR_LIGHT = `vec2 goz = vec2(13.8, 13.75), kayma = vec2(34.5, 27.5), p = vYasPoz.xz;
    vec2 kose = floor((p + kayma) / goz + 0.5) * goz - kayma;
    float paye = length(max(abs(p - kose) - vec2(1.62), vec2(0.0)));
    vec2 merkez = (floor((p + kayma) / goz) + 0.5) * goz - kayma;
    float havuz = exp(-dot(p - merkez, p - merkez) / 22.0);
    float duvar = min(32.5 - abs(p.x), 25.5 - abs(p.y));
    float golge = mix(0.64, 1.0, smoothstep(0.0, 2.4, paye)) * mix(0.72, 1.0, smoothstep(0.0, 2.0, duvar));`

/** Parça koordinatına bağlı yaşlanma: katmanlar kalksa da leke yerinde kalır. */
const AGE_KINDS = {
  // Duvar: saçaktan süzülen yağmur izi, zemine yakın kir, geniş ton farkı
  wall: `float u = vYasPoz.x + vYasPoz.z;
    float leke = yasFbm(vec2(u * 0.16, vYasPoz.y * 0.11));
    float cizgi = yasFbm(vec2(u * 1.5, vYasPoz.y * 0.05));
    float sacak = smoothstep(6.5, 13.0, vYasPoz.y) * smoothstep(0.42, 0.72, cizgi);
    float taban = 1.0 - smoothstep(0.2, 2.8, vYasPoz.y);
    diffuseColor.rgb *= mix(1.0, 0.66, sacak * 0.6) * mix(1.0, 0.62, taban * 0.7) * (0.88 + 0.24 * leke);`,
  marble: `float u = vYasPoz.x + vYasPoz.z;
    float cizgi = yasFbm(vec2(u * 1.2, vYasPoz.y * 0.06));
    float taban = 1.0 - smoothstep(0.1, 1.8, vYasPoz.y);
    diffuseColor.rgb *= mix(1.0, 0.8, taban * 0.6) * (0.92 + 0.14 * cizgi);`,
  // Kurşun döşeme: dağınık oksit lekeleri
  lead: `float leke = yasFbm(vYasPoz.xz * 0.28);
    diffuseColor.rgb *= vec3(0.97, 1.0, 1.03) * (0.78 + 0.34 * leke);`,
  // Kubbe: her gözde farklı ton, tepeden eteğe süzülen izler
  dome: `vec2 goz = vec2(13.8, 13.75), kayma = vec2(34.5, 27.5);
    vec2 kimlik = floor((vYasPoz.xz + kayma) / goz);
    vec2 merkez = (kimlik + 0.5) * goz - kayma;
    float aci = atan(vYasPoz.x - merkez.x, vYasPoz.z - merkez.y);
    float iz = yasFbm(vec2(aci * 5.0, vYasPoz.y * 0.22) + kimlik * 7.0);
    float ton = 0.9 + 0.2 * yasKarma(kimlik);
    diffuseColor.rgb *= vec3(0.95, 1.0, 1.05) * ton * (0.78 + 0.38 * iz);`,
  plaster: `float leke = yasFbm(vec2((vYasPoz.x + vYasPoz.z) * 0.9, vYasPoz.y * 0.35));
    diffuseColor.rgb *= 0.84 + 0.26 * leke;`,
  brick: `float leke = yasFbm(vec2(atan(vYasPoz.x, vYasPoz.z) * 3.0, vYasPoz.y * 0.28));
    diffuseColor.rgb *= 0.8 + 0.34 * leke;`,
  paving: `float leke = yasFbm(vYasPoz.xz * 0.12);
    diffuseColor.rgb *= 0.8 + 0.34 * leke;`,
  // Halı: paye ve duvar diplerinde temas gölgesi, avize altında sıcak ışık havuzu, ayak izi solması
  carpet: `${FLOOR_LIGHT}
    float genis = yasFbm(p * 0.28);
    float asinma = smoothstep(0.52, 0.74, yasFbm(p * 0.55 + 9.0));
    vec3 solgun = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.33))), 0.3) * 1.1;
    diffuseColor.rgb = mix(diffuseColor.rgb, solgun, asinma * 0.4);
    diffuseColor.rgb *= golge * (0.92 + 0.16 * genis) * (0.9 + vec3(0.42, 0.36, 0.26) * havuz);`,
  // Hafif sürüm: gürültüsüz; yalnız temas gölgesi ve ışık havuzu
  floorLight: `${FLOOR_LIGHT}
    diffuseColor.rgb *= golge * (0.9 + vec3(0.42, 0.36, 0.26) * havuz);`,
  marblePaving: `${FLOOR_LIGHT}
    diffuseColor.rgb *= golge * (0.94 + 0.12 * yasFbm(p * 0.7));`,
  // Boyalı sıva: geniş bulutlanma, ince fırça farkı, zemine yakın kir
  innerPlaster: `float u = vYasPoz.x + vYasPoz.z;
    float leke = yasFbm(vec2(u * 0.35, vYasPoz.y * 0.22));
    float ince = yasFbm(vec2(u * 2.2, vYasPoz.y * 1.6));
    float taban = 1.0 - smoothstep(0.7, 1.9, vYasPoz.y);
    diffuseColor.rgb *= (0.93 + 0.12 * leke) * (0.975 + 0.05 * ince) * mix(1.0, 0.84, taban);`,
} as const

function age<M extends THREE.MeshStandardMaterial>(material: M, tour: keyof typeof AGE_KINDS) {
  material.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vYasPoz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvYasPoz = position;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${AGE_COMMON}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n{ ${AGE_KINDS[tour]} }`)
  }
  material.customProgramCacheKey = () => `age-${tour}`
  return material
}

/** İç pencere atlası: fotoğrafın ışığı dokuda olduğu için kısmen kendinden aydınlık; tepeliğin kenarı alfa ile kesilir. */
function innerWindowMaterial(map: THREE.Texture | null) {
  return new THREE.MeshStandardMaterial({ map, emissive: map ? '#ffffff' : '#000000', emissiveMap: map, emissiveIntensity: 0.5, color: map ? '#ffffff' : '#e7dcc4', roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide })
}

export function uluMosqueMaterials() {
  const d = uluMosqueTextures()
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const loader = new THREE.TextureLoader()
  const photoTexture = (ad: string) => {
    if (PUBLIC_BUILD) return null
    const f = loader.load(`/images/ulu-mosque/model/${ad.includes('.') ? ad : `${ad}.jpg`}`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const lite = lightDevice()
  // Halı havı: sheen, bakış açısına göre kadife parlaklığı verir.
  const pile = (color: string, glow: string) => age(lite
    ? pbr({ map: d.carpet.color, normalMap: d.carpet.normal, normalScale: new THREE.Vector2(0.75, 0.75), color: color, roughness: 0.96 })
    : new THREE.MeshPhysicalMaterial({ map: d.carpet.color, normalMap: d.carpet.normal, normalScale: new THREE.Vector2(0.75, 0.75), color: color, roughness: 0.96, sheen: 0.28, sheenRoughness: 0.8, sheenColor: new THREE.Color(glow) }), lite ? 'floorLight' : 'carpet')
  // Cila: masaüstünde ayrı parlak katman, hafif cihazda yalnız düşük pürüzlülük.
  const polished = (p: THREE.MeshStandardMaterialParameters, varnish: number, varnishRough: number) => lite ? pbr(p) : new THREE.MeshPhysicalMaterial({ ...p, clearcoat: varnish, clearcoatRoughness: varnishRough })
  const plaster = <M extends THREE.MeshStandardMaterial>(m: M) => lite ? m : age(m, 'innerPlaster')
  const light = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1.5, 1.4, 1.25), side: THREE.DoubleSide })
  return {
    stone: age(pbr({ map: d.stone, bumpMap: d.stoneRelief, bumpScale: 1.1, roughness: 0.92 }), 'wall'),
    marble: age(pbr({ map: d.marble, bumpMap: d.marbleRelief, bumpScale: 0.25, roughness: 0.48 }), 'marble'),
    marbleDark: pbr({ map: d.marble, color: '#c9c3b5', roughness: 0.5 }),
    brick: age(pbr({ map: d.brick, bumpMap: d.brickRelief, bumpScale: 0.9, roughness: 0.9 }), 'brick'),
    paving: age(pbr({ map: d.paving, bumpMap: d.pavingRelief, bumpScale: 0.7 }), 'paving'),
    lead: age(pbr({ map: d.leadFlat, roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide }), 'lead'),
    dome: age(pbr({ map: d.dome, bumpMap: d.domeRelief, bumpScale: 0.35, roughness: 0.66, metalness: 0.14, side: THREE.DoubleSide }), 'dome'),
    stoneDark: pbr({ map: d.brick, bumpMap: d.brickRelief, bumpScale: 0.6, color: '#a39480', roughness: 0.9 }),
    cell: pbr({ color: '#6f5f4c', roughness: 0.9 }),
    cypress: pbr({ map: d.cypress, bumpMap: d.cypressRelief, bumpScale: 1.6, roughness: 1 }),
    plaster: age(pbr({ map: d.plaster, roughness: 0.9, side: THREE.DoubleSide }), 'plaster'),
    cage: pbr({ map: d.cage, roughness: 0.75, side: THREE.DoubleSide }),
    carpet: pile('#d9a39b', '#ecc2b6'),
    // Ulu Camii göz düzeni gölgesi içermez; başka yapılarda bunu kullan.
    carpetPlain: pbr({ map: d.carpet.color, normalMap: d.carpet.normal, normalScale: new THREE.Vector2(0.75, 0.75), color: '#c9877c', roughness: 0.96 }),
    carpetOlive: pile('#a29b63', '#c9c188'),
    marblePaving: age(polished({ map: d.marblePaving.color, bumpMap: d.marblePaving.relief, bumpScale: 0.4, roughness: 0.34 }, 0.55, 0.14), lite ? 'floorLight' : 'marblePaving'),
    innerMarble: polished({ map: d.marbleBody, roughness: 0.36 }, 0.35, 0.2),
    pier: plaster(pbr({ map: d.pier, roughness: 0.8 })),
    inner: plaster(pbr({ color: '#f1e8d6', roughness: 0.85, side: THREE.DoubleSide })),
    innerWall: plaster(pbr({ map: d.innerWall, roughness: 0.85, side: THREE.DoubleSide })),
    innerDome: plaster(pbr(innerDomeSetting())),
    pendentive: pbr({ map: d.pendentive, roughness: 0.9, side: THREE.DoubleSide }),
    archBand: pbr({ map: d.archBand, roughness: 0.75, side: THREE.DoubleSide }),
    kundekari: pbr({ map: d.kundekari, roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide }),
    woodLattice: pbr({ map: d.woodLattice, roughness: 0.6 }),
    ornament: pbr({ map: d.ornament, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide }),
    mihrabBlue: pbr({ map: d.mihrabBlue, roughness: 0.55 }),
    mihrabGreen: pbr({ map: d.mihrabGreen, roughness: 0.5, side: THREE.DoubleSide }),
    mihrabRed: pbr({ map: d.mihrabRed, roughness: 0.8 }),
    dark: pbr({ color: '#2b2d2c', roughness: 0.75, side: THREE.DoubleSide }),
    wood: pbr({ color: '#3a2317', roughness: 0.6 }),
    walnut: pbr({ color: '#5c3a22', roughness: 0.52 }),
    gold: pbr({ color: '#d3a43f', metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide }),
    goldDark: pbr({ color: '#a97f2e', metalness: 0.6, roughness: 0.42, side: THREE.DoubleSide }),
    bronze: pbr({ color: '#6f5a35', metalness: 0.75, roughness: 0.4, side: THREE.DoubleSide }),
    water: polished({ color: '#5fb3b5', normalMap: d.waterNormalOf, normalScale: new THREE.Vector2(0.28, 0.28), roughness: 0.16 }, 1, 0.08),
    cam: new THREE.MeshStandardMaterial({ map: d.cam, transparent: true, depthWrite: false, roughness: 0.15, metalness: 0.3, side: THREE.DoubleSide }),
    cream: pbr({ color: '#e7dcc4', roughness: 0.8, side: THREE.DoubleSide }),
    glassCage: light(d.glassCage),
    windowInner: innerWindowMaterial(photoTexture('interior-window.webp')),
    kaabaCover: new THREE.MeshBasicMaterial({ map: photoTexture(lite ? 'kaaba-cover-1024' : 'kaaba-cover') ?? d.kaabaCover, color: '#d4d0c8' }),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.8, 2.1) }),
    lampHalo: new THREE.MeshBasicMaterial({ map: d.halo, color: new THREE.Color(1.1, 0.95, 0.75), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    lightColumn: new THREE.MeshBasicMaterial({ map: d.lightColumn, color: new THREE.Color(0.2, 0.19, 0.16), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    sky: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.5, 2.7), side: THREE.FrontSide }),
  }
}

export type UluMosqueMaterials = ReturnType<typeof uluMosqueMaterials>
