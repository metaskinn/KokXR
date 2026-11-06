// Timurtaş Paşa Külliyesi dokuları: tuvalde üretilir. Örgü oranları Şener 1997 çizimine (üç sıra tuğla, bir sıra köfeki),
// renk ve desenler envanter fotoğraflarına bakılarak yorumlanmıştır. Hat yazısı taklit edilmez.
import * as THREE from 'three'
import { hafifCihaz, rastgele } from '../../ulucamiZemin'

function tuval(w: number, h: number) {
  const el = document.createElement('canvas')
  el.width = w; el.height = h
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  return { el, c }
}

function doku(el: HTMLCanvasElement, mu: number, mv: number, renkli = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / mu, 1 / mv)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

const boyut = () => hafifCihaz() ? 512 : 1024
const sec = <T,>(r: () => number, l: T[]) => l[Math.floor(r() * l.length)]

function benek(c: CanvasRenderingContext2D, B: number, r: () => number, adet: number, guc = 0.05) {
  for (let i = 0; i < adet; i++) {
    c.fillStyle = r() < 0.5 ? `rgba(0,0,0,${guc * r()})` : `rgba(255,255,255,${guc * r()})`
    const s = 1 + r() * 3
    c.fillRect(r() * B, r() * B, s, s)
  }
}

function tuglaSirasi(c: CanvasRenderingContext2D, B: number, olc: number, y: number, h: number, boy: number, kayma: number, renkler: string[], r: () => number) {
  const adet = Math.round(B / (boy * olc)), w = B / adet, ara = 0.022 * olc
  for (let i = -1; i <= adet; i++) {
    c.fillStyle = sec(r, renkler)
    c.fillRect(i * w + kayma * w + ara / 2, B - (y + h) * olc, w - ara, h * olc)
  }
}

const TUGLA_RENK = ['#a9553a', '#b5613f', '#9d4c35', '#bd6c49', '#a65a3f', '#8f4632']

/** Almaşık duvar: 0,67 m'lik dönem içinde bir sıra köfeki taşı ve üç sıra tuğla. Dört dönem tekrar eder. */
export function almasikDokusu() {
  const B = boyut(), METRE = 2.68, olc = B / METRE
  const { el, c } = tuval(B, B)
  const r = rastgele(391)
  c.fillStyle = '#cdc2ab'
  c.fillRect(0, 0, B, B)
  for (let p = 0; p < 4; p++) {
    const y0 = p * 0.67
    let x = -r() * 0.6
    while (x < METRE) {
      const boy = 0.5 + r() * 0.55
      const g = 150 + Math.floor(r() * 45)
      c.fillStyle = `rgb(${g + 12},${g},${g - 26})`
      c.fillRect(x * olc + 1.5, B - (y0 + 0.32) * olc, boy * olc - 3, 0.3 * olc)
      c.fillStyle = 'rgba(70,55,35,.09)'
      c.fillRect(x * olc + 1.5, B - (y0 + 0.08) * olc, boy * olc - 3, 0.06 * olc)
      x += boy
    }
    for (let s = 0; s < 3; s++) tuglaSirasi(c, B, olc, y0 + 0.345 + s * 0.11, 0.075, 0.27, s % 2 ? 0.5 : 0.1 * p, TUGLA_RENK, r)
  }
  benek(c, B, r, B * 9)
  return { renk: doku(el, METRE, METRE), kabartma: doku(el, METRE, METRE, false) }
}

/** Minare ve şadırvan ayakları: yalnız tuğla, geniş derz. */
export function tuglaDokusu() {
  const B = boyut(), METRE = 1.84, olc = B / METRE
  const { el, c } = tuval(B, B)
  const r = rastgele(517)
  c.fillStyle = '#c4b39a'
  c.fillRect(0, 0, B, B)
  for (let s = 0; s < 16; s++) tuglaSirasi(c, B, olc, s * 0.115 + 0.012, 0.09, 0.27, s % 2 ? 0.5 : 0, ['#b2593a', '#bd6642', '#a85337', '#c47350', '#9e4c33'], r)
  benek(c, B, r, B * 6)
  return { renk: doku(el, METRE, METRE), kabartma: doku(el, METRE, METRE, false) }
}

/** Hamam duvarı: bir sıra tuğla, bir sıra moloz taş (envanter s. 220). */
export function molozDokusu() {
  const B = boyut(), METRE = 2.4, olc = B / METRE
  const { el, c } = tuval(B, B)
  const r = rastgele(233)
  c.fillStyle = '#b8a282'
  c.fillRect(0, 0, B, B)
  for (let p = 0; p < 4; p++) {
    const y0 = p * 0.6
    let x = 0
    while (x < METRE) {
      const en = 0.18 + r() * 0.3, boy = 0.3 + r() * 0.13
      c.fillStyle = sec(r, ['#a08d6e', '#918a74', '#ad9570', '#83795f', '#a59a82', '#98846a', '#8e8c7a'])
      c.beginPath()
      const cx = (x + en / 2) * olc, cy = B - (y0 + 0.22 + (r() - 0.5) * 0.06) * olc, n = 7, a0 = r()
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * Math.PI * 2, o = 0.8 + r() * 0.2
        const px = cx + Math.cos(a) * (en / 2) * olc * o, py = cy + Math.sin(a) * (boy / 2) * olc * o
        if (i) c.lineTo(px, py); else c.moveTo(px, py)
      }
      c.closePath(); c.fill()
      x += en * 0.96
    }
    tuglaSirasi(c, B, olc, y0 + 0.45, 0.06, 0.28, p % 2 ? 0.5 : 0, TUGLA_RENK, r)
    tuglaSirasi(c, B, olc, y0 + 0.525, 0.06, 0.28, p % 2 ? 0 : 0.5, TUGLA_RENK, r)
  }
  benek(c, B, r, B * 8, 0.07)
  return { renk: doku(el, METRE, METRE), kabartma: doku(el, METRE, METRE, false) }
}

/** Minare kasnağı: iri kesme taş sıraları. */
export function kesmeTasDokusu() {
  const B = hafifCihaz() ? 256 : 512, METRE = 2.4, olc = B / METRE
  const { el, c } = tuval(B, B)
  const r = rastgele(641)
  c.fillStyle = '#9d9483'
  c.fillRect(0, 0, B, B)
  for (let s = 0; s < 6; s++) {
    let x = -r() * 0.5
    while (x < METRE) {
      const boy = 0.55 + r() * 0.55, g = 176 + Math.floor(r() * 34)
      c.fillStyle = `rgb(${g},${g - 6},${g - 24})`
      c.fillRect(x * olc + 1.5, s * 0.4 * olc + 1.5, boy * olc - 3, 0.4 * olc - 3)
      x += boy
    }
  }
  benek(c, B, r, B * 6, 0.06)
  return doku(el, METRE, METRE)
}

/** Hamam kubbesindeki oluklu kiremit: dönel gövdenin 0-1 UV'sine sarılır. */
export function kiremitDokusu() {
  const B = hafifCihaz() ? 512 : 1024, N = 16, h = B / N
  const { el, c } = tuval(B, B)
  const r = rastgele(911)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = -18 + r() * 34
    const g = c.createLinearGradient(i * h, 0, (i + 1) * h, 0)
    g.addColorStop(0, `rgb(${96 + t},${52 + t * 0.6},${36 + t * 0.4})`)
    g.addColorStop(0.5, `rgb(${178 + t},${104 + t * 0.6},${70 + t * 0.4})`)
    g.addColorStop(1, `rgb(${96 + t},${52 + t * 0.6},${36 + t * 0.4})`)
    c.fillStyle = g
    c.fillRect(i * h, j * h, h, h)
    c.fillStyle = 'rgba(30,14,8,.55)'
    c.fillRect(i * h, (j + 1) * h - h * 0.13, h, h * 0.13)
  }
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 1.5)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Kemer alınlığı: tuğla parçaları ve turkuaz çiniyle fırıldak örgüsü (envanter fotoğrafı). */
export function ciniDokusu() {
  const B = 512, N = 4, s = B / N, METRE = 0.92
  const { el, c } = tuval(B, B)
  const r = rastgele(77)
  c.fillStyle = '#8c8a83'
  c.fillRect(0, 0, B, B)
  benek(c, B, r, 4000, 0.1)
  const b = s * 0.24
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i * s, y = j * s
    c.fillStyle = sec(r, TUGLA_RENK.map((k) => k)).replace('#8f4632', '#b5613f')
    c.beginPath(); c.moveTo(x + b + 3, y + 3); c.lineTo(x + s - 3, y + 3); c.lineTo(x + s - b - 3, y + b - 2); c.lineTo(x + 3 + b * 0.2, y + b - 2); c.closePath(); c.fill()
    c.fillStyle = sec(r, TUGLA_RENK)
    c.beginPath(); c.moveTo(x + 3, y + b + 3); c.lineTo(x + b - 2, y + b * 1.2); c.lineTo(x + b - 2, y + s - 3); c.lineTo(x + 3, y + s - b - 3); c.closePath(); c.fill()
    c.fillStyle = sec(r, ['#127a9c', '#0e6d8e', '#1486aa'])
    c.fillRect(x + b, y + b, b * 0.9, b * 0.9)
  }
  return doku(el, METRE, METRE)
}

/** Düzensiz taş döşeme (hazire, meydan). Hücreleri dikişsiz Voronoi ile üretilir. 7 metrede tekrar. */
export function tasDosemeDokusu(tohum: number, palet: [number, number, number][], derz: [number, number, number]) {
  const B = hafifCihaz() ? 256 : 512, N = 16, HUCRE = B / N, METRE = 7
  const { el, c } = tuval(B, B)
  const r = rastgele(tohum), noktaX = new Float32Array(N * N), noktaY = new Float32Array(N * N)
  const renk: [number, number, number][] = []
  for (let i = 0; i < N * N; i++) {
    noktaX[i] = r(); noktaY[i] = r()
    const p = sec(r, palet), t = 0.85 + r() * 0.3
    renk.push([p[0] * t, p[1] * t, p[2] * t])
  }
  const v = c.createImageData(B, B)
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const hx = x / HUCRE, hy = y / HUCRE, ix = Math.floor(hx), iy = Math.floor(hy)
    let d1 = 9, d2 = 9, e = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const a = ((ix + dx) % N + N) % N, b = ((iy + dy) % N + N) % N, n = b * N + a
      const d = Math.hypot(ix + dx + noktaX[n] - hx, iy + dy + noktaY[n] - hy)
      if (d < d1) { d2 = d1; d1 = d; e = n } else if (d < d2) d2 = d
    }
    const k = d2 - d1 < 0.09 ? derz : renk[e], i = (y * B + x) * 4
    v.data[i] = k[0]; v.data[i + 1] = k[1]; v.data[i + 2] = k[2]; v.data[i + 3] = 255
  }
  c.putImageData(v, 0, 0)
  return doku(el, METRE, METRE)
}

/** Yol: küçük gri parke sıraları. */
export function parkeDokusu() {
  const B = 512, METRE = 2.4, olc = B / METRE
  const { el, c } = tuval(B, B)
  const r = rastgele(55)
  c.fillStyle = '#54534f'
  c.fillRect(0, 0, B, B)
  for (let s = 0; s < 12; s++) for (let i = -1; i < 12; i++) {
    const g = 96 + Math.floor(r() * 34)
    c.fillStyle = `rgb(${g},${g - 2},${g - 6})`
    c.fillRect((i + (s % 2) * 0.5) * 0.2 * olc + 1, s * 0.2 * olc + 1, 0.2 * olc - 2, 0.2 * olc - 2)
  }
  return doku(el, METRE, METRE)
}

/** Yapı içi duvar: 9 m boyunca tek parça; açık yeşil izare, bitkisel kuşak, beyaz sıva ve geçmeli üst kuşak (fotoğrafa göre). */
export function icDuvarDokusu() {
  const G = hafifCihaz() ? 512 : 1024, H = G * 2, METRE_U = 3, METRE_V = 9, oy = H / METRE_V, ou = G / METRE_U
  const { el, c } = tuval(G, H)
  const Y = (m: number) => H - m * oy
  c.fillStyle = '#ecebe2'
  c.fillRect(0, 0, G, H)
  c.fillStyle = '#d6e4c8'
  c.fillRect(0, Y(1.5), G, 1.5 * oy)
  const yap = (y0: number, y1: number, renk: string) => { c.fillStyle = renk; c.fillRect(0, Y(y1), G, (y1 - y0) * oy) }
  yap(1.5, 1.98, '#bcd3a3')
  yap(1.95, 1.99, '#23402f'); yap(1.49, 1.52, '#23402f')
  // Bitkisel kuşak: yan yana palmet ve kıvrım dalları.
  for (let i = 0; i < 24; i++) {
    const x = ((i + 0.5) / 24) * G, y = Y(1.74), o = oy * 0.15
    c.fillStyle = i % 2 ? '#2d5a3b' : '#264b64'
    c.beginPath(); c.moveTo(x, y - o); c.bezierCurveTo(x + o * 0.8, y - o * 0.2, x + o * 0.5, y + o * 0.7, x, y + o * 0.9); c.bezierCurveTo(x - o * 0.5, y + o * 0.7, x - o * 0.8, y - o * 0.2, x, y - o); c.fill()
    c.strokeStyle = '#2d5a3b'; c.lineWidth = Math.max(2, oy * 0.012)
    c.beginPath(); c.arc(x + G / 48, y + o * 0.2, o * 0.45, Math.PI, 0); c.stroke()
  }
  // Geçmeli üst kuşak: renkli halkalar.
  yap(4.82, 5.28, '#efece1'); yap(4.8, 4.83, '#21354c'); yap(5.27, 5.3, '#21354c')
  const adet = 18, adim = G / adet, cy = Y(5.05)
  for (let i = 0; i < adet; i++) {
    const x = (i + 0.5) * adim
    c.lineWidth = Math.max(3, oy * 0.04)
    c.strokeStyle = ['#1e4f7a', '#2c7a4e', '#a33a33'][i % 3]
    c.beginPath(); c.ellipse(x, cy, adim * 0.62, oy * 0.14, 0, 0, Math.PI * 2); c.stroke()
    c.fillStyle = ['#c9443a', '#20648f', '#2f8554'][i % 3]
    c.beginPath(); c.arc(x, cy, oy * 0.045, 0, Math.PI * 2); c.fill()
  }
  // Üstte ince mavi kuşak ve küçük noktalar
  yap(5.34, 5.44, '#d7e1e6')
  for (let i = 0; i < 48; i++) {
    c.fillStyle = i % 2 ? '#20486e' : '#a33a33'
    c.fillRect(((i + 0.3) / 48) * G, Y(5.42), ou * 0.03, oy * 0.06)
  }
  const t = new THREE.CanvasTexture(el)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.repeat.set(1 / METRE_U, 1 / METRE_V)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Pencere nişlerindeki bitkisel rozet: yazı içermez. */
export function rozetDokusu() {
  const { el, c } = tuval(256, 256)
  c.translate(128, 128)
  for (let i = 0; i < 8; i++) {
    c.rotate(Math.PI / 4)
    c.fillStyle = i % 2 ? '#1e4f7a' : '#a8352f'
    c.beginPath(); c.moveTo(0, -8); c.bezierCurveTo(40, -40, 34, -96, 0, -116); c.bezierCurveTo(-34, -96, -40, -40, 0, -8); c.fill()
    c.fillStyle = '#2c7a4e'
    c.beginPath(); c.moveTo(0, -24); c.bezierCurveTo(16, -44, 13, -72, 0, -88); c.bezierCurveTo(-13, -72, -16, -44, 0, -24); c.fill()
  }
  c.fillStyle = '#d2a640'
  c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill()
  return new THREE.CanvasTexture(el)
}

/** Mezar taşı yüzü: oyma hissi veren geometrik ve bitkisel ağ; hat taklidi yoktur. */
export function mezarTasiDokusu(zemin: string, koyu: string, acik: string, tohum: number) {
  const W = 256, H = 512
  const { el, c } = tuval(W, H)
  const r = rastgele(tohum)
  c.fillStyle = zemin
  c.fillRect(0, 0, W, H)
  c.strokeStyle = koyu; c.lineWidth = 7
  c.strokeRect(14, 14, W - 28, H - 28)
  c.strokeStyle = acik; c.lineWidth = 2
  c.strokeRect(24, 24, W - 48, H - 48)
  for (let j = 0; j < 7; j++) {
    const y = 58 + j * 66
    c.fillStyle = koyu
    c.fillRect(32, y - 26, W - 64, 52)
    c.strokeStyle = acik; c.lineWidth = 3
    for (let i = 0; i < 4; i++) {
      const x = 62 + i * 44
      c.beginPath(); c.arc(x, y, 14 + r() * 7, 0, Math.PI * 2); c.stroke()
      c.beginPath(); c.moveTo(x - 16, y); c.quadraticCurveTo(x, y - 22, x + 16, y); c.quadraticCurveTo(x, y + 22, x - 16, y); c.stroke()
    }
  }
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Fotoğraf dokusu kapalıyken mihrap yüzü: bronz çerçeve ve mukarnas hissi veren dizi. Yazı içermez. */
export function mihrapYedekDokusu() {
  const W = 512, H = 860
  const { el, c } = tuval(W, H)
  c.fillStyle = '#4a3a22'
  c.fillRect(0, 0, W, H)
  c.strokeStyle = '#b08a3f'; c.lineWidth = 16
  c.strokeRect(26, 26, W - 52, H - 26)
  c.strokeStyle = '#6d5a33'; c.lineWidth = 8
  c.strokeRect(62, 70, W - 124, H - 70)
  c.fillStyle = '#29261f'
  c.beginPath(); c.moveTo(130, H); c.lineTo(130, 370); c.quadraticCurveTo(130, 270, 256, 190); c.quadraticCurveTo(382, 270, 382, 370); c.lineTo(382, H); c.closePath(); c.fill()
  c.strokeStyle = '#b08a3f'; c.lineWidth = 4
  for (let j = 0; j < 6; j++) for (let i = 0; i <= 8 - j; i++) {
    const x = 256 + (i - (8 - j) / 2) * 30, y = 370 - j * 28
    c.beginPath(); c.arc(x, y, 13, Math.PI, 0); c.stroke()
  }
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
