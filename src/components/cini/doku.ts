// Tabağın yüzeyi tek bir tuvaldir: çamur, astar, kömür noktaları, tahrir, boya ve sır sırayla üst üste çizilir.
// Tuvalin (x, y) noktası tabağın (ux, uz) birim koordinatıdır: merkez 0, kenar 1.
import * as THREE from 'three'
import { bolgeler, izler, konturlar, type N } from './desen'
import { KOMUR_HUCRE, izBasi, renkler, type Oyun } from './durum'

const S = 1280
const px = (u: number) => ((u + 1) / 2) * S
const ASTAR = '#f5f0e2', MUREKKEP = '#17202f', SIR = '#ece9df'

function karistir(a: string, b: string, t: number) {
  const h = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16)
  const k = (i: number) => Math.round(h(a, i) + (h(b, i) - h(a, i)) * t).toString(16).padStart(2, '0')
  return `#${k(1)}${k(3)}${k(5)}`
}
/** Tohumlu gürültü: el yapımı yüzeyin küçük lekeleri her açılışta aynı olur. */
function lekeler(c: CanvasRenderingContext2D, adet: number, renk: string, enB: number, alfa: number) {
  let s = 12345
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  c.fillStyle = renk
  for (let i = 0; i < adet; i++) {
    c.globalAlpha = alfa * r()
    c.beginPath(); c.arc(r() * S, r() * S, 1 + r() * enB, 0, 7); c.fill()
  }
  c.globalAlpha = 1
}
function katman(ciz: (c: CanvasRenderingContext2D) => void) {
  const e = document.createElement('canvas'); e.width = e.height = S
  const c = e.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  ciz(c)
  return e
}
const yol = (c: CanvasRenderingContext2D, p: N[], kapali = true) => {
  c.moveTo(px(p[0][0]), px(p[0][1]))
  for (let i = 1; i < p.length; i++) c.lineTo(px(p[i][0]), px(p[i][1]))
  if (kapali) c.closePath()
}

// Kontur boyunca eşit aralıklı kömür noktaları ve düştükleri hücre.
const noktalar: { x: number; y: number; h: number }[] = konturlar.flatMap((k) => {
  const o: { x: number; y: number; h: number }[] = []
  let kalan = 0
  for (let i = 1; i < k.length; i++) {
    const [ax, ay] = k[i - 1], [bx, by] = k[i], u = Math.hypot(bx - ax, by - ay)
    for (let t = kalan; t < u; t += .018) {
      const x = ax + ((bx - ax) * t) / u, y = ay + ((by - ay) * t) / u
      o.push({ x, y, h: Math.floor(((y + 1) / 2) * KOMUR_HUCRE) * KOMUR_HUCRE + Math.floor(((x + 1) / 2) * KOMUR_HUCRE) })
      kalan = t + .018 - u
    }
  }
  return o
})

/** Kömürleme kâğıdı: delikli desen, yarı saydam parşömen. */
export function kagitDokusu() {
  const e = katman((c) => {
    c.fillStyle = 'rgba(232,222,196,.86)'; c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, 7); c.fill()
    c.fillStyle = '#5a5145'
    for (const n of noktalar) { c.beginPath(); c.arc(px(n.x), px(n.y), 2.4, 0, 7); c.fill() }
  })
  const d = new THREE.CanvasTexture(e); d.colorSpace = THREE.SRGBColorSpace; d.flipY = false; d.anisotropy = 8
  return d
}

export function yuzeyOlustur(anizotropi: number) {
  const camur = katman((c) => { c.fillStyle = '#a87b5a'; c.fillRect(0, 0, S, S); lekeler(c, 5000, '#6f4c34', 5, .35); lekeler(c, 3000, '#c9a07e', 4, .3) })
  const astar = katman((c) => { c.fillStyle = ASTAR; c.fillRect(0, 0, S, S); lekeler(c, 2500, '#d9d0b9', 3, .22) })
  const sir = katman((c) => { c.fillStyle = SIR; c.fillRect(0, 0, S, S); lekeler(c, 4000, '#fbfaf5', 5, .5); lekeler(c, 1500, '#cfcabb', 3, .3) })
  const el = document.createElement('canvas'); el.width = el.height = S
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  const doku = new THREE.CanvasTexture(el)
  doku.colorSpace = THREE.SRGBColorSpace; doku.flipY = false; doku.anisotropy = anizotropi; doku.generateMipmaps = true
  let anahtar = ''

  const ciz = (d: Oyun) => {
    const yeni = [d.astar.toFixed(2), d.sir.toFixed(2), d.canli.toFixed(2), d.asama, d.iz, d.izSira, d.komurOran.toFixed(2), d.boyalar.join()].join('|')
    if (yeni === anahtar) return
    anahtar = yeni
    c.globalAlpha = 1
    c.drawImage(camur, 0, 0)
    if (d.astar > 0) {
      c.save(); c.beginPath(); c.arc(S / 2, S / 2, (d.astar * 1.5 * S) / 2, 0, 7); c.clip(); c.drawImage(astar, 0, 0); c.restore()
    }
    // Boya: fırına kadar mat, sır pişince canlı.
    d.boyalar.forEach((r, i) => {
      if (!r) return
      const b = bolgeler[i], renk = renkler.find((x) => x.id === r)
      if (!renk) return
      c.fillStyle = karistir(renk.mat, renk.canli, d.canli)
      c.beginPath(); yol(c, b.dis); if (b.ic) yol(c, b.ic); c.fill('evenodd')
    })
    // Kömür noktaları, tahrirden sonra da altta kalır.
    if (d.asama >= 2 && d.asama <= 4) {
      c.fillStyle = 'rgba(40,36,34,.75)'
      for (const n of noktalar) if (d.komur[n.h]) { c.beginPath(); c.arc(px(n.x), px(n.y), 2.1, 0, 7); c.fill() }
    }
    // Tahrir.
    c.strokeStyle = MUREKKEP; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 4.2
    if (d.asama > 3) { c.beginPath(); konturlar.forEach((k) => yol(c, k, false)); c.stroke() }
    if (d.asama === 3) {
      c.beginPath()
      izler.forEach((iz, i) => { if (i < d.iz) yol(c, iz, false); else if (i === d.iz && d.izSira > 0) yol(c, iz.slice(0, d.izSira + 1), false) })
      c.stroke()
      const n = izBasi(d)
      if (n) { c.strokeStyle = '#e5902f'; c.lineWidth = 6; c.beginPath(); c.arc(px(n[0]), px(n[1]), 15, 0, 7); c.stroke() }
    }
    // Pişmemiş sır deseni örter; piştikçe saydamlaşır.
    if (d.sir > 0 && d.canli < 1) {
      c.save(); c.globalAlpha = .96 * (1 - d.canli)
      c.beginPath(); c.arc(S / 2, S / 2, (d.sir * 1.5 * S) / 2, 0, 7); c.clip(); c.drawImage(sir, 0, 0); c.restore()
    }
    doku.needsUpdate = true
  }
  return { doku, ciz, dispose: () => doku.dispose() }
}
