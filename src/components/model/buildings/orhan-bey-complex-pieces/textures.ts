// Orhan Bey Camii'ne özgü tuval dokuları. Renk ve düzen Vakıf Eserleri Envanteri fotoğraflarına bakılarak
// yorumlanmıştır; gerçek desenlerin kopyası değildir. Hat yazısı çizilmez, yalnız geometrik ve bitkisel motif vardır.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../../../data/openPublication'
import { lightDevice, random } from '../../uluMosqueFloor'

function canvas(g: number, y = g) {
  const el = document.createElement('canvas')
  el.width = g; el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  return { el, c }
}

/** `metre`: dokunun bir tekrarının gerçek boyu. UV'si metre olan kutu ve çıkarım yüzeylerinde kullanılır. */
function repeated(el: HTMLCanvasElement, meter: number, colored = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / meter, 1 / meter)
  t.anisotropy = 8
  if (colored) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function onePiece(el: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Almaşık örgü: bir sıra moloz-kesme taş, üç sıra tuğla; taşların arasında dikey tuğlalar. */
function alternatingCanvas() {
  const B = lightDevice() ? 1024 : 2048, measure = B / 2048
  const { el, c } = canvas(B)
  const r = random(41)
  c.fillStyle = '#b79f83'
  c.fillRect(0, 0, B, B)
  const ROW = 4, glazeH = B / ROW
  for (let s = 0; s < ROW; s++) {
    const y0 = s * glazeH, stoneH = glazeH * 0.62
    const stones = 5 + Math.floor(r() * 2)
    let x = -r() * 60 * measure
    const width = B / stones
    for (let i = 0; i <= stones; i++) {
      const g = width * (0.86 + r() * 0.2)
      const tone = 0.86 + r() * 0.2
      c.fillStyle = `rgb(${196 * tone},${170 * tone},${134 * tone})`
      c.fillRect(x + 12 * measure, y0 + 5 * measure, g - 24 * measure, stoneH - 10 * measure)
      for (let n = 0; n < 26; n++) {
        c.fillStyle = `rgba(${r() < 0.5 ? '90,70,50' : '235,220,190'},${0.08 + r() * 0.14})`
        c.fillRect(x + 12 * measure + r() * (g - 30 * measure), y0 + 6 * measure + r() * (stoneH - 18 * measure), (6 + r() * 40) * measure, (3 + r() * 12) * measure)
      }
      // Taşların arasında çift dikey tuğla
      c.fillStyle = `rgb(${172 + r() * 20},${92 + r() * 16},${62 + r() * 12})`
      c.fillRect(x + g - 12 * measure, y0 + 6 * measure, 10 * measure, stoneH - 12 * measure)
      c.fillRect(x + g + 2 * measure, y0 + 6 * measure, 10 * measure, stoneH - 12 * measure)
      x += g
    }
    // Üç sıra tuğla
    const brkH = (glazeH - stoneH) / 3
    for (let t = 0; t < 3; t++) {
      const y = y0 + stoneH + t * brkH
      let bx = -r() * 90 * measure
      while (bx < B) {
        const uz = (90 + r() * 50) * measure, tone = 0.84 + r() * 0.24
        c.fillStyle = `rgb(${186 * tone},${100 * tone},${68 * tone})`
        c.fillRect(bx, y + 4 * measure, uz - 5 * measure, brkH - 8 * measure)
        bx += uz
      }
    }
  }
  return el
}

/** Son cemaat yeri ve revak için tuğla ayırmalı dama: beyaz taş zemin, kırmızı küçük kareler. */
function checkerCanvas() {
  const B = 512, { el, c } = canvas(B), step = B / 8
  c.fillStyle = '#e4dccb'
  c.fillRect(0, 0, B, B)
  c.strokeStyle = '#b9ad96'
  c.lineWidth = 2
  for (let i = -8; i < 16; i++) {
    c.beginPath(); c.moveTo(i * step, 0); c.lineTo((i + 8) * step, B); c.stroke()
    c.beginPath(); c.moveTo((i + 8) * step, 0); c.lineTo(i * step, B); c.stroke()
  }
  c.fillStyle = '#a9583a'
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const px = (x + (y % 2) * 0.5) * step, py = (y + 0.5) * step
    c.fillRect(px - step * 0.13, py - step * 0.13, step * 0.26, step * 0.26)
  }
  return el
}

/** Bugünkü meydan: koyu parke zemin üzerinde açık renk çapraz bantlar. */
function squareCanvas() {
  const B = 1024, { el, c } = canvas(B)
  const r = random(7)
  c.fillStyle = '#5f5e60'
  c.fillRect(0, 0, B, B)
  for (let y = 0; y < B; y += 20) for (let x = (y / 20) % 2 ? 10 : 0; x < B; x += 20) {
    const t = 80 + r() * 28
    c.fillStyle = `rgb(${t},${t},${t + 3})`
    c.fillRect(x + 1, y + 1, 18, 18)
  }
  c.strokeStyle = '#857265'
  c.lineWidth = 26
  for (const k of [-B, 0, B]) {
    c.beginPath(); c.moveTo(k, 0); c.lineTo(k + B, B); c.stroke()
    c.beginPath(); c.moveTo(k + B, 0); c.lineTo(k, B); c.stroke()
  }
  return el
}

function grassCanvas() {
  const B = 512, { el, c } = canvas(B), r = random(13)
  c.fillStyle = '#4b6a33'
  c.fillRect(0, 0, B, B)
  for (let i = 0; i < 9000; i++) {
    const t = r()
    c.fillStyle = `rgb(${50 + t * 50},${86 + t * 60},${34 + t * 26})`
    c.fillRect(r() * B, r() * B, 2, 3 + r() * 3)
  }
  return el
}

/** Halı: fotoğraftaki turkuaz zemin ve iki yandan koyu çizgili örgü bandı. Bir saf 1,4 m. */
function carpetCanvas() {
  const B = lightDevice() ? 512 : 1024, { el, c } = canvas(B), r = random(23), measure = B / 1024
  c.fillStyle = '#0b8aa3'
  c.fillRect(0, 0, B, B)
  for (let i = 0; i < 22000 * measure; i++) {
    const t = r()
    c.fillStyle = `rgba(${t < 0.5 ? '6,92,116' : '40,168,186'},0.32)`
    c.fillRect(r() * B, r() * B, 2 + r() * 3, 2 + r() * 3)
  }
  const y0 = B * 0.84, h = B * 0.14
  c.fillStyle = '#0e5f73'
  c.fillRect(0, y0 - 6 * measure, B, h + 12 * measure)
  c.fillStyle = '#cfe8df'
  c.fillRect(0, y0 + 3 * measure, B, 4 * measure); c.fillRect(0, y0 + h - 7 * measure, B, 4 * measure)
  const count = 8, ad = B / count, mid = y0 + h / 2
  c.lineWidth = 7 * measure
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * ad
    c.strokeStyle = i % 2 ? '#e8efe2' : '#17305f'
    c.beginPath(); c.ellipse(x, mid, ad * 0.58, h * 0.32, 0, 0, Math.PI * 2); c.stroke()
    c.fillStyle = '#e8efe2'
    c.beginPath(); c.arc(x, mid, 5 * measure, 0, Math.PI * 2); c.fill()
  }
  return el
}

/** Daire örgülü alçı şebeke: beyaz örgü, arkası ışıklı veya koyu. */
function latticeCanvas(back: string, weave: string) {
  const B = 512, { el, c } = canvas(B)
  c.fillStyle = back
  c.fillRect(0, 0, B, B)
  const n = 6, d = B / n
  c.strokeStyle = weave
  c.lineWidth = 12
  for (let y = 0; y < n * 1.4; y++) for (let x = 0; x <= n; x++) {
    const px = (x + (y % 2) * 0.5) * d, py = y * d * 0.72 + d * 0.4
    c.beginPath(); c.arc(px, py, d * 0.46, 0, Math.PI * 2); c.stroke()
  }
  c.lineWidth = 26
  c.strokeRect(0, 0, B, B)
  return el
}

/** Alt pencere: ahşap kayıt ve baklava demir, arkası gün ışığı. */
function diamondWindowCanvas(open: boolean) {
  const B = 512, { el, c } = canvas(B)
  c.fillStyle = open ? '#fff8e6' : '#23282a'
  c.fillRect(0, 0, B, B)
  c.strokeStyle = open ? '#4a3a2c' : '#0d0f10'
  c.lineWidth = 5
  for (let i = -6; i < 14; i++) {
    c.beginPath(); c.moveTo(i * 64, 0); c.lineTo((i + 6) * 64, B); c.stroke()
    c.beginPath(); c.moveTo((i + 6) * 64, 0); c.lineTo(i * 64, B); c.stroke()
  }
  c.strokeStyle = open ? '#6c4227' : '#14110f'
  c.lineWidth = 16
  c.beginPath(); c.moveTo(B / 2, 0); c.lineTo(B / 2, B); c.moveTo(0, B * 0.72); c.lineTo(B, B * 0.72); c.stroke()
  c.lineWidth = 26
  c.strokeRect(0, 0, B, B)
  return el
}

const STROKE = '#f4efe2', RED = '#7f2a18', NAVY = '#23407a', GOLD = '#c79a3a', GREEN = '#2e5a43', DARK = '#1d3029'

/** Yelpaze üçgenli köşe paneli: fotoğraftaki kırmızı zemin, beyaz kaburga, mavi-altın dolgu. */
function cornerStar(c: CanvasRenderingContext2D, cx: number, base: number, en: number, length: number) {
  c.save()
  c.beginPath()
  c.moveTo(cx - en / 2, base)
  c.quadraticCurveTo(cx - en / 2, base - length * 0.82, cx, base - length)
  c.quadraticCurveTo(cx + en / 2, base - length * 0.82, cx + en / 2, base)
  c.closePath()
  c.fillStyle = RED
  c.fill()
  c.clip()
  const N = 9
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * (i / N), a1 = Math.PI * ((i + 1) / N), am = (a0 + a1) / 2
    const R = Math.max(en, length) * 1.1
    c.fillStyle = i % 2 ? NAVY : GOLD
    for (const o of [0.3, 0.55, 0.78]) {
      const rx = (en / 2) * o, ry = length * o
      c.beginPath()
      c.ellipse(cx - Math.cos(am) * rx, base - Math.sin(am) * ry, en * 0.012, length * 0.03, Math.PI / 2 - am, 0, Math.PI * 2)
      c.fill()
    }
    c.strokeStyle = STROKE
    c.lineWidth = en * 0.012
    c.beginPath(); c.moveTo(cx, base); c.lineTo(cx - Math.cos(a1) * R, base - Math.sin(a1) * R * (length / (en / 2)) * 0.5); c.stroke()
  }
  // İkinci halka: içte yıldız kırığı
  c.strokeStyle = STROKE
  c.lineWidth = en * 0.01
  c.beginPath()
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * (i / N), o = i % 2 ? 0.66 : 0.46
    const x = cx - Math.cos(a) * (en / 2) * o, y = base - Math.sin(a) * length * o
    if (i) c.lineTo(x, y); else c.moveTo(x, y)
  }
  c.stroke()
  c.restore()
  c.strokeStyle = '#7d6a4c'
  c.lineWidth = en * 0.012
  c.beginPath()
  c.moveTo(cx - en / 2, base)
  c.quadraticCurveTo(cx - en / 2, base - length * 0.82, cx, base - length)
  c.quadraticCurveTo(cx + en / 2, base - length * 0.82, cx + en / 2, base)
  c.stroke()
}

/** Geçiş bölgesi: u çevre (0 = güney), v taban-tepe. Köşelerde yıldız paneller. */
function transitionCanvas(southPediment: boolean, star = true) {
  const G = lightDevice() ? 1024 : 2048, Y = G / 4, { el, c } = canvas(G, Y)
  c.fillStyle = '#e9e7df'
  c.fillRect(0, 0, G, Y)
  if (star) for (const u of [1 / 8, 3 / 8, 5 / 8, 7 / 8]) cornerStar(c, u * G, Y, G * 0.2, Y * 0.92)
  if (southPediment) {
    // Mihrap duvarındaki alınlık: yalnız geometrik örgü; kuşak yazısı çizilmez.
    for (const cx of [0, G]) {
      const en = G * 0.1, length = Y * 0.72
      c.beginPath()
      c.moveTo(cx - en / 2, Y); c.quadraticCurveTo(cx - en / 2, Y - length * 0.85, cx, Y - length); c.quadraticCurveTo(cx + en / 2, Y - length * 0.85, cx + en / 2, Y); c.closePath()
      c.fillStyle = GREEN
      c.fill()
      c.strokeStyle = NAVY
      c.lineWidth = G * 0.004
      c.stroke()
      c.save(); c.clip()
      c.fillStyle = GOLD
      for (let y = Y; y > Y - length; y -= Y * 0.09) for (let x = cx - en / 2; x < cx + en / 2; x += en * 0.14) {
        c.beginPath(); c.arc(x, y, G * 0.0028, 0, Math.PI * 2); c.fill()
      }
      c.fillStyle = DARK
      c.beginPath()
      c.moveTo(cx - en * 0.3, Y); c.quadraticCurveTo(cx - en * 0.3, Y - length * 0.55, cx, Y - length * 0.68); c.quadraticCurveTo(cx + en * 0.3, Y - length * 0.55, cx + en * 0.3, Y); c.closePath()
      c.fill()
      c.restore()
    }
  }
  return el
}

/** İç kubbe: u çevre, v kenardan tepeye. Örgü kuşağı, boş alçı ve tepede renkli göbek. */
function innerDomeCanvas(boss: 'medallion' | 'rose' | 'plain') {
  const G = lightDevice() ? 1024 : 2048, Y = G / 2, { el, c } = canvas(G, Y)
  c.fillStyle = '#e9e7df'
  c.fillRect(0, 0, G, Y)
  // Eteğe yakın örgü kuşağı (tuvalde alt taraf kubbe eteğidir)
  const by = Y * 0.9, bh = Y * 0.04
  c.fillStyle = RED
  c.fillRect(0, by, G, bh)
  c.fillStyle = NAVY
  c.fillRect(0, by - 4, G, 4); c.fillRect(0, by + bh, G, 4)
  c.strokeStyle = STROKE
  c.lineWidth = 3
  const count = 64
  for (let i = 0; i < count; i++) {
    c.fillStyle = i % 2 ? GOLD : NAVY
    const x = ((i + 0.5) / count) * G
    c.beginPath(); c.ellipse(x, by + bh / 2, G / count * 0.42, bh * 0.36, 0, 0, Math.PI * 2); c.fill(); c.stroke()
  }
  if (boss === 'plain') return el
  const gY = boss === 'rose' ? 0.3 : 0.22
  c.fillStyle = boss === 'rose' ? '#e2d2ab' : RED
  c.fillRect(0, 0, G, Y * gY)
  const N = boss === 'rose' ? 16 : 12
  for (let i = 0; i < N; i++) {
    const x = ((i + 0.5) / N) * G, en = G / N
    c.fillStyle = boss === 'rose' ? (i % 2 ? RED : NAVY) : GOLD
    c.beginPath()
    c.moveTo(x - en * 0.42, Y * gY)
    c.quadraticCurveTo(x - en * 0.3, Y * gY * 0.45, x, Y * gY * 0.2)
    c.quadraticCurveTo(x + en * 0.3, Y * gY * 0.45, x + en * 0.42, Y * gY)
    c.closePath()
    c.fill()
    c.strokeStyle = '#3b2e20'; c.lineWidth = 3; c.stroke()
    c.fillStyle = boss === 'rose' ? GOLD : STROKE
    c.beginPath(); c.ellipse(x, Y * gY * 0.62, en * 0.1, Y * gY * 0.18, 0, 0, Math.PI * 2); c.fill()
    // Eteğe uzanan yaprak
    c.fillStyle = NAVY
    c.beginPath(); c.moveTo(x, Y * gY); c.quadraticCurveTo(x - en * 0.12, Y * (gY + 0.06), x, Y * (gY + 0.11)); c.quadraticCurveTo(x + en * 0.12, Y * (gY + 0.06), x, Y * gY); c.fill()
  }
  c.fillStyle = GREEN
  c.fillRect(0, 0, G, Y * gY * 0.2)
  return el
}

/** Fotoğrafın kullanılamadığı açık yayında mihrap yüzü: altın geometrik çerçeve, koyu kavsara, basamaklı mukarnas. */
function mihrabCanvas() {
  const G = 1024, Y = 1372, { el, c } = canvas(G, Y)
  c.fillStyle = DARK
  c.fillRect(0, 0, G, Y)
  c.fillStyle = '#d9c88e'
  c.fillRect(46, 46, G - 92, Y - 46)
  const step = 44
  c.lineWidth = 3
  for (let y = 70; y < Y; y += step) for (let x = 70; x < G - 60; x += step) {
    c.strokeStyle = '#6d5322'
    c.beginPath(); c.arc(x + ((y / step) % 2) * 22, y, 16, 0, Math.PI * 2); c.stroke()
    c.fillStyle = DARK
    c.beginPath(); c.arc(x + ((y / step) % 2) * 22, y, 5, 0, Math.PI * 2); c.fill()
  }
  const x0 = 290, x1 = G - 290
  c.fillStyle = '#c8a24c'
  c.fillRect(x0 - 16, 240, x1 - x0 + 32, Y - 240)
  c.fillStyle = DARK
  c.fillRect(x0, 256, x1 - x0, 620)
  for (let i = 0; i < 7; i++) {
    const w = (x1 - x0 - 40) * (1 - i / 7.6), yy = 840 - i * 78
    c.fillStyle = i % 2 ? '#d6a941' : '#b5862c'
    c.fillRect(G / 2 - w / 2, yy, w, 74)
    c.strokeStyle = '#6a4a18'; c.lineWidth = 3
    for (let x = G / 2 - w / 2; x < G / 2 + w / 2; x += 28) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 74); c.stroke() }
  }
  c.fillStyle = '#e7e2c8'
  c.fillRect(x0, 876, x1 - x0, Y - 876)
  return el
}

/** Çeşmedeki mavi-beyaz çini yüzeyler: düzen genel, gerçek pano kopyalanmaz. */
function tileCanvas() {
  const B = 512, { el, c } = canvas(B)
  c.fillStyle = '#f2f4f6'
  c.fillRect(0, 0, B, B)
  const n = 4, d = B / n
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const cx = (x + 0.5) * d, cy = (y + 0.5) * d
    c.fillStyle = (x + y) % 2 ? '#1f4f93' : '#2f8fb2'
    for (let i = 0; i < 8; i++) {
      c.save(); c.translate(cx, cy); c.rotate(i * Math.PI / 4)
      c.beginPath(); c.ellipse(0, -d * 0.24, d * 0.06, d * 0.17, 0, 0, Math.PI * 2); c.fill()
      c.restore()
    }
    c.fillStyle = '#b5352c'
    c.beginPath(); c.arc(cx, cy, d * 0.07, 0, Math.PI * 2); c.fill()
  }
  return el
}

/** Minber ve kürsünün koyu ceviz yüzünde ince oyma çizgileri. */
function carvingCanvas() {
  const B = 256, { el, c } = canvas(B)
  c.fillStyle = '#4c2f1b'
  c.fillRect(0, 0, B, B)
  c.strokeStyle = '#2b190d'
  c.lineWidth = 4
  for (let i = -4; i < 8; i++) {
    c.beginPath(); c.moveTo(i * 42, 0); c.lineTo((i + 4) * 42, B); c.stroke()
    c.beginPath(); c.moveTo((i + 4) * 42, 0); c.lineTo(i * 42, B); c.stroke()
  }
  c.strokeStyle = '#8a6a3c'
  c.lineWidth = 1.5
  c.strokeRect(6, 6, B - 12, B - 12)
  return el
}

export function orhanMaterials() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...p })
  const light = (el: HTMLCanvasElement, glossy = 1.55) => new THREE.MeshBasicMaterial({ map: onePiece(el), color: new THREE.Color(glossy, glossy * 0.95, glossy * 0.86), side: THREE.DoubleSide })
  const alm = repeated(alternatingCanvas(), 1.9)
  let mihrabTex: THREE.Texture
  if (PUBLIC_BUILD) mihrabTex = onePiece(mihrabCanvas())
  else {
    const y = new THREE.TextureLoader().load('/images/orhan-bey-complex/model/mihrab-front.jpg')
    y.colorSpace = THREE.SRGBColorSpace
    y.anisotropy = 8
    mihrabTex = y
  }
  return {
    alternating: pbr({ map: alm, bumpMap: alm, bumpScale: 0.7, side: THREE.DoubleSide }),
    checker: pbr({ map: onePiece(checkerCanvas()), roughness: 0.8, side: THREE.DoubleSide }),
    plaza: pbr({ map: repeated(squareCanvas(), 9), roughness: 0.92 }),
    grass: pbr({ map: repeated(grassCanvas(), 4), roughness: 1 }),
    carpet: pbr({ map: repeated(carpetCanvas(), 1.4), roughness: 0.96 }),
    latticeInner: light(latticeCanvas('#fff4d8', '#a8916a'), 1.12),
    latticeOuter: pbr({ map: onePiece(latticeCanvas('#2c3030', '#e6dfd0')), roughness: 0.8, side: THREE.DoubleSide }),
    windowInner: light(diamondWindowCanvas(true), 1.14),
    windowOuter: pbr({ map: onePiece(diamondWindowCanvas(false)), roughness: 0.6, side: THREE.DoubleSide }),
    transitionMihrab: pbr({ map: onePiece(transitionCanvas(true)), roughness: 0.82, side: THREE.DoubleSide }),
    transitionMid: pbr({ map: onePiece(transitionCanvas(false)), roughness: 0.82, side: THREE.DoubleSide }),
    domeMedallion: pbr({ map: onePiece(innerDomeCanvas('medallion')), roughness: 0.85, side: THREE.DoubleSide }),
    domeRose: pbr({ map: onePiece(innerDomeCanvas('rose')), roughness: 0.85, side: THREE.DoubleSide }),
    domePlain: pbr({ map: onePiece(innerDomeCanvas('plain')), roughness: 0.85, side: THREE.DoubleSide }),
    mihrab: pbr({ map: mihrabTex, roughness: 0.45, metalness: 0.08 }),
    tile: pbr({ map: repeated(tileCanvas(), 0.9), roughness: 0.3 }),
    carving: pbr({ map: repeated(carvingCanvas(), 0.3), color: '#c9b39a', roughness: 0.55, side: THREE.DoubleSide }),
    plaster: pbr({ color: '#e9e7df', roughness: 0.9, side: THREE.DoubleSide }),
    plasterLight: pbr({ color: '#e9e7df', emissive: '#6d6a60', roughness: 0.9, side: THREE.DoubleSide }),
    transitionPlain: pbr({ map: onePiece(transitionCanvas(false, false)), roughness: 0.85, side: THREE.DoubleSide }),
    brass: pbr({ color: '#c99a42', metalness: 0.8, roughness: 0.28 }),
    candle: pbr({ color: '#d9c98f', roughness: 0.55 }),
    iron: pbr({ color: '#1b1c1d', metalness: 0.55, roughness: 0.5 }),
    brickFloor: pbr({ color: '#8c4c3a', roughness: 0.8 }),
    cypress: pbr({ color: '#2f4f2c', roughness: 1 }),
    leaf: pbr({ color: '#6d7f38', roughness: 1, flatShading: true }),
    leafYellow: pbr({ color: '#b08a36', roughness: 1, flatShading: true }),
    body: pbr({ color: '#5c4d3f', roughness: 1 }),
  }
}
