// Umur Bey Külliyesi dokuları: almaşık örgü, kiremit, tuğla, halı ve pencereler piksel piksel üretilir.
// Renk ve düzen Drive arşivindeki fotoğraflara bakılarak yorumlanmıştır; yalnız taş vakfiyeler gerçek fotoğraftır.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../../data/acikYayin'
import { hafifCihaz, rastgele } from '../../ulucamiZemin'

type C = CanvasRenderingContext2D
const olcek = () => (hafifCihaz() ? 0.5 : 1)

function tuval(g: number, h = g) {
  const el = document.createElement('canvas')
  el.width = Math.round(g * olcek()); el.height = Math.round(h * olcek())
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  c.scale(olcek(), olcek())
  return { el, c }
}

/** Metre UV'li yüzeylerde tekrar eden doku: `g` ve `h` dokunun gerçek boyu. */
function tekrar(el: HTMLCanvasElement, g: number, h: number, renkli = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / g, 1 / h)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}
/** Tek parça oturan doku (pencere, levha): UV 0-1. */
function tek(el: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function benek(c: C, g: number, h: number, adet: number, r: () => number, renkler: string[], alfa: number, boy = 2) {
  for (let i = 0; i < adet; i++) {
    c.globalAlpha = alfa * r()
    c.fillStyle = renkler[Math.floor(r() * renkler.length)]
    c.fillRect(r() * g, r() * h, 1 + r() * boy, 1 + r() * boy)
  }
  c.globalAlpha = 1
}

/** Bir sıra kesme taş, taş araları düşey tuğla, ardından üç sıra tuğla (envanterdeki almaşık düzen). */
function almasikDokusu(tohum: number, secenek: { tasRenk: string[]; harc: string; taseni: number; tasboy: number; tuglaSira: number }) {
  const P = 1024, METRE = 2.08, ppm = P / METRE
  const { el, c } = tuval(P), kab = tuval(P)
  const r = rastgele(tohum)
  const { tasRenk, harc, taseni, tasboy, tuglaSira } = secenek
  const tuglaH = 0.052, derz = 0.018
  const periyot = METRE / Math.round(METRE / (tasboy + derz + tuglaSira * (tuglaH + derz)))
  c.fillStyle = harc; c.fillRect(0, 0, P, P)
  kab.c.fillStyle = '#404040'; kab.c.fillRect(0, 0, P, P)
  const dolgu = (x: number, y: number, g: number, h: number, renk: string, yukseklik: string) => {
    c.fillStyle = renk; c.fillRect(x * ppm, y * ppm, g * ppm, h * ppm)
    kab.c.fillStyle = yukseklik; kab.c.fillRect(x * ppm, y * ppm, g * ppm, h * ppm)
  }
  const tuglaRenk = () => {
    const t = r(), a = 116 + t * 38, b = 62 + t * 26, d = 40 + t * 18
    return `rgb(${a | 0},${b | 0},${d | 0})`
  }
  const siraAdet = Math.round(METRE / periyot)
  for (let s = 0; s < siraAdet; s++) {
    let y = s * periyot
    // Taş sırası: bloklar arasında düşey iki tuğla
    const adet = Math.round(METRE / (taseni + 0.09))
    const adim = METRE / adet
    for (let i = 0; i < adet; i++) {
      const x = i * adim + (s % 2 ? adim / 2 : 0)
      const gx = x % METRE
      dolgu(gx, y, adim - 0.09, tasboy, tasRenk[Math.floor(r() * tasRenk.length)], '#e8e8e8')
      if (gx + adim - 0.09 > METRE) dolgu(gx - METRE, y, adim - 0.09, tasboy, tasRenk[0], '#e8e8e8')
      const dx = (gx + adim - 0.082) % METRE
      dolgu(dx, y, 0.034, tasboy, tuglaRenk(), '#c8c8c8')
      dolgu((dx + 0.04) % METRE, y, 0.034, tasboy, tuglaRenk(), '#c8c8c8')
    }
    y += tasboy + derz
    for (let t = 0; t < tuglaSira; t++) {
      let x = (t % 2) * -0.13
      while (x < METRE) {
        const g = 0.22 + r() * 0.08
        dolgu(x, y, g - 0.014, tuglaH, tuglaRenk(), '#b8b8b8')
        x += g
      }
      y += tuglaH + derz
    }
  }
  benek(c, P, P, 9000, r, ['#3a2a18', '#e9d9b8', '#5a4028'], 0.22, 3)
  return { renk: tekrar(el, METRE, METRE), kabartma: tekrar(kab.el, METRE, METRE, false) }
}

function kiremitDokusu() {
  const G = 512, H = 256, METREG = 1.2, METREH = 0.66
  const { el, c } = tuval(G, H)
  const r = rastgele(44)
  c.fillStyle = '#5e2c18'; c.fillRect(0, 0, G, H)
  const sutun = 6, sira = 2, tg = G / sutun, th = H / sira
  for (let s = 0; s < sira; s++) for (let i = -1; i <= sutun; i++) {
    const x = i * tg + (s % 2 ? tg / 2 : 0), y = s * th
    const t = r()
    const renk = `rgb(${(172 + t * 40) | 0},${(88 + t * 28) | 0},${(52 + t * 18) | 0})`
    const d = c.createLinearGradient(x, 0, x + tg, 0)
    d.addColorStop(0, 'rgba(50,20,8,.55)'); d.addColorStop(0.28, 'rgba(255,220,180,.12)'); d.addColorStop(0.72, 'rgba(255,220,180,.06)'); d.addColorStop(1, 'rgba(50,20,8,.55)')
    c.fillStyle = renk; c.fillRect(x + 1, y, tg - 2, th - 2)
    c.fillStyle = d; c.fillRect(x + 1, y, tg - 2, th - 2)
    const alt = c.createLinearGradient(0, y + th - 16, 0, y + th)
    alt.addColorStop(0, 'rgba(40,16,6,0)'); alt.addColorStop(1, 'rgba(40,16,6,.6)')
    c.fillStyle = alt; c.fillRect(x + 1, y + th - 16, tg - 2, 16)
  }
  benek(c, G, H, 2500, r, ['#3a1c0c', '#e2b08a'], 0.16)
  return tekrar(el, METREG, METREH)
}

function tuglaDokusu() {
  const P = 512, METRE = 1.3, ppm = P / METRE
  const { el, c } = tuval(P), kab = tuval(P)
  const r = rastgele(7)
  c.fillStyle = '#a3957e'; c.fillRect(0, 0, P, P)
  kab.c.fillStyle = '#404040'; kab.c.fillRect(0, 0, P, P)
  const SIRA = 16, h = METRE / SIRA
  for (let s = 0; s < SIRA; s++) {
    let x = s % 2 ? -0.12 : 0
    while (x < METRE) {
      const g = 0.25, t = r()
      c.fillStyle = `rgb(${(128 + t * 34) | 0},${(72 + t * 24) | 0},${(50 + t * 16) | 0})`
      c.fillRect(x * ppm, s * h * ppm + 2, (g - 0.016) * ppm, (h - 0.018) * ppm)
      kab.c.fillStyle = '#d0d0d0'
      kab.c.fillRect(x * ppm, s * h * ppm + 2, (g - 0.016) * ppm, (h - 0.018) * ppm)
      x += g
    }
  }
  benek(c, P, P, 3000, r, ['#3a2214', '#efd9bd'], 0.18)
  return { renk: tekrar(el, METRE, METRE), kabartma: tekrar(kab.el, METRE, METRE, false) }
}

/** Fotoğraftaki bej benekli, kırmızı saf çizgili halı: çizgiler kıbleye paralel, 1,25 m arayla. */
function haliDokusu() {
  const P = 512, METRE = 1.25
  const { el, c } = tuval(P)
  const r = rastgele(3)
  c.fillStyle = '#b5a483'; c.fillRect(0, 0, P, P)
  benek(c, P, P, 5000, r, ['#9d8c6c', '#c6b797', '#a89877'], 0.5, 3)
  c.fillStyle = '#4a4034'
  for (let y = 18; y < P - 50; y += 18) for (let x = (y % 36 ? 9 : 0); x < P; x += 18) c.fillRect(x, y, 3, 3)
  c.fillStyle = '#92222a'; c.fillRect(0, P - 46, P, 34)
  c.fillStyle = '#b8434a'; for (let x = 0; x < P; x += 16) c.fillRect(x, P - 34, 8, 8)
  c.fillStyle = '#dcc8a0'; c.fillRect(0, P - 46, P, 2); c.fillRect(0, P - 13, P, 2)
  return tekrar(el, METRE, METRE)
}

function kirmiziHali() {
  const { el, c } = tuval(256)
  c.fillStyle = '#a4152a'; c.fillRect(0, 0, 256, 256)
  benek(c, 256, 256, 2500, rastgele(8), ['#7e0e1f', '#c33043'], 0.45, 3)
  return tekrar(el, 0.8, 0.8)
}

function tasDosemeDokusu() {
  const P = 512
  const { el, c } = tuval(P)
  const r = rastgele(12)
  c.fillStyle = '#6b6a60'; c.fillRect(0, 0, P, P)
  const SIRA = 4
  for (let s = 0; s < SIRA; s++) {
    let x = s % 2 ? -64 : 0
    while (x < P) {
      const g = 96 + r() * 90, t = r()
      const v = 128 + t * 46
      c.fillStyle = `rgb(${v | 0},${(v - 4) | 0},${(v - 14) | 0})`
      c.fillRect(x + 2, (s * P) / SIRA + 2, g - 4, P / SIRA - 4)
      x += g
    }
  }
  benek(c, P, P, 5000, r, ['#55524a', '#cac5b5'], 0.2, 3)
  return tekrar(el, 2.4, 2.4)
}

function cimDokusu() {
  const P = 512
  const { el, c } = tuval(P)
  const r = rastgele(21)
  c.fillStyle = '#5b6c33'; c.fillRect(0, 0, P, P)
  benek(c, P, P, 16000, r, ['#46582a', '#73853f', '#8b8f4e', '#3a4a26'], 0.55, 5)
  return tekrar(el, 5, 5)
}

function ahsapDokusu(tohum: number, taban: string, koyu: string) {
  const { el, c } = tuval(256)
  const r = rastgele(tohum)
  c.fillStyle = taban; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = koyu
  for (let i = 0; i < 70; i++) {
    const y = r() * 256
    c.globalAlpha = 0.06 + r() * 0.14
    c.lineWidth = 1 + r() * 2
    c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(90, y + r() * 8 - 4, 170, y + r() * 8 - 4, 256, y); c.stroke()
  }
  c.globalAlpha = 1
  return tekrar(el, 1, 1)
}

/** Kündekâri izlenimi: koyu ahşapta baklava geçmeler (minber yan yüzü). */
function geçmeDokusu() {
  const { el, c } = tuval(256)
  c.fillStyle = '#3a2214'; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = '#7a5230'; c.lineWidth = 7
  for (let i = -256; i < 512; i += 64) {
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 256, 256); c.stroke()
    c.beginPath(); c.moveTo(i + 256, 0); c.lineTo(i, 256); c.stroke()
  }
  return tekrar(el, 0.5, 0.5)
}

/** Vitray: baklava camlar, üst ve alt sırada sarı (fotoğraftaki iç pencereler). */
function vitray() {
  const G = 256, H = 512
  const { el, c } = tuval(G, H)
  c.fillStyle = '#f5f2e6'; c.fillRect(0, 0, G, H)
  const r = rastgele(5)
  const n = 42
  for (let y = 60; y < H - 40; y += n) for (let x = 0; x < G + n; x += n * 1.25) {
    const ox = ((y - 60) / n) % 2 ? n * 0.625 : 0
    c.fillStyle = r() > 0.45 ? '#7fbf7a' : '#d9efdb'
    c.beginPath(); c.moveTo(x + ox, y - n * 0.46); c.lineTo(x + ox + n * 0.56, y); c.lineTo(x + ox, y + n * 0.46); c.lineTo(x + ox - n * 0.56, y); c.closePath(); c.fill()
    c.strokeStyle = '#7d7b70'; c.lineWidth = 3; c.stroke()
  }
  c.fillStyle = '#f4be2a'; c.fillRect(0, H - 46, G, 46); c.fillRect(0, 0, G, 58)
  c.strokeStyle = '#7d7b70'; c.lineWidth = 3; c.strokeRect(2, H - 46, G - 4, 44)
  c.beginPath(); c.moveTo(G / 2, 0); c.lineTo(G / 2, 58); c.moveTo(0, 58); c.lineTo(G, 58); c.stroke()
  return tek(el)
}

/** Dıştan görünen beyaz alçı revzen: koyu altıgen delikler. */
function revzen() {
  const G = 256, H = 512
  const { el, c } = tuval(G, H)
  c.fillStyle = '#ece6d6'; c.fillRect(0, 0, G, H)
  c.fillStyle = '#2b3338'
  const d = 19
  for (let y = 8, s = 0; y < H + d; y += d * 1.28, s++) for (let x = s % 2 ? d : 0; x < G + d; x += d * 2) {
    c.beginPath(); c.ellipse(x, y, d * 0.62, d * 0.46, 0, 0, Math.PI * 2); c.fill()
  }
  return tek(el)
}

/** Alt pencere: dıştan demir parmaklık, ardında koyu boşluk. */
function parmaklik() {
  const { el, c } = tuval(256, 340)
  c.fillStyle = '#23272a'; c.fillRect(0, 0, 256, 340)
  c.strokeStyle = '#0b0c0d'; c.lineWidth = 10
  for (let x = 32; x < 256; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 340); c.stroke() }
  for (let y = 38; y < 340; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke() }
  return tek(el)
}

/** Alt pencere içten: açık kanatların ardında dış aydınlık. */
function gunIsigi() {
  const { el, c } = tuval(128, 170)
  const d = c.createLinearGradient(0, 0, 0, 170)
  d.addColorStop(0, '#fbf8ee'); d.addColorStop(0.6, '#f0ead9'); d.addColorStop(1, '#d9cba9')
  c.fillStyle = d; c.fillRect(0, 0, 128, 170)
  c.strokeStyle = '#6a4427'; c.lineWidth = 5
  c.strokeRect(0, 0, 128, 170)
  c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 170); c.moveTo(0, 85); c.lineTo(128, 85); c.stroke()
  return tek(el)
}

/** Duvardaki yuvarlak levha: yazısız, altın zeminli çiçekli çelenk. Hat taklit edilmez. */
function madalyon() {
  const { el, c } = tuval(256)
  c.fillStyle = '#e8ded0'; c.fillRect(0, 0, 256, 256)
  const r = c.createRadialGradient(128, 128, 20, 128, 128, 125)
  r.addColorStop(0, '#c9a862'); r.addColorStop(1, '#a4823f')
  c.fillStyle = r; c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill()
  c.strokeStyle = '#3b2a12'; c.lineWidth = 4; c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.stroke()
  c.fillStyle = '#d7c088'; c.beginPath(); c.arc(128, 128, 76, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#3f6b3b'
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    c.save(); c.translate(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); c.rotate(a + 0.6)
    c.beginPath(); c.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2); c.fill(); c.restore()
  }
  c.strokeStyle = '#6d5526'; c.lineWidth = 3
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    c.beginPath(); c.moveTo(128, 128); c.quadraticCurveTo(128 + Math.cos(a + 0.5) * 44, 128 + Math.sin(a + 0.5) * 44, 128 + Math.cos(a) * 62, 128 + Math.sin(a) * 62); c.stroke()
  }
  return tek(el)
}

/** Mihrap çerçevesi bandı: krem zeminde geçmeli süs ve alt bölümde mavi çiçek. Yazı yerine yalnız motif. */
function mihrapBandi() {
  const { el, c } = tuval(96, 768)
  c.fillStyle = '#efe7d3'; c.fillRect(0, 0, 96, 768)
  c.fillStyle = '#3a342a'; c.fillRect(0, 0, 8, 768); c.fillRect(88, 0, 8, 768)
  c.strokeStyle = '#3a342a'; c.lineWidth = 6
  for (let y = 0; y < 400; y += 48) {
    c.beginPath(); c.moveTo(14, y); c.bezierCurveTo(60, y + 12, 34, y + 36, 82, y + 48); c.stroke()
    c.beginPath(); c.moveTo(82, y); c.bezierCurveTo(36, y + 12, 62, y + 36, 14, y + 48); c.stroke()
  }
  for (let y = 430; y < 760; y += 72) {
    c.fillStyle = '#2f6fb0'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      c.beginPath(); c.ellipse(48 + Math.cos(a) * 15, y + Math.sin(a) * 15, 13, 9, a, 0, Math.PI * 2); c.fill()
    }
    c.fillStyle = '#82b37a'; c.fillRect(46, y + 18, 4, 36)
    c.beginPath(); c.ellipse(30, y + 40, 12, 6, -0.6, 0, Math.PI * 2); c.fill()
    c.beginPath(); c.ellipse(66, y + 40, 12, 6, 0.6, 0, Math.PI * 2); c.fill()
  }
  return tek(el)
}

/** Mihrabın alt yarısı: yeşil zemin, iki yana açılan gri perde boyası ve ortada koyu sarkıt (fotoğrafa göre). */
function mihrapBoya() {
  const { el, c } = tuval(256, 384)
  c.fillStyle = '#a9c79a'; c.fillRect(0, 0, 256, 384)
  c.fillStyle = '#4c5866'; c.strokeStyle = '#d7dce0'; c.lineWidth = 3
  for (const s of [0, 1]) {
    c.save()
    if (s) { c.translate(256, 0); c.scale(-1, 1) }
    c.beginPath(); c.moveTo(0, 0); c.lineTo(112, 0); c.bezierCurveTo(100, 120, 40, 150, 28, 300); c.lineTo(0, 310); c.closePath(); c.fill(); c.stroke()
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(i * 22, 0); c.bezierCurveTo(i * 20, 100, i * 8, 180, 8 + i * 4, 300); c.stroke() }
    c.restore()
  }
  c.fillStyle = '#6b5a3b'
  c.beginPath(); c.moveTo(128, 30); c.lineTo(160, 90); c.lineTo(128, 160); c.lineTo(96, 90); c.closePath(); c.fill()
  c.fillStyle = '#31506b'
  c.beginPath(); c.moveTo(128, 56); c.lineTo(146, 92); c.lineTo(128, 130); c.lineTo(110, 92); c.closePath(); c.fill()
  return tek(el)
}

/** Minarenin geçiş kuşağı: beyaz mermer üçgenler arasında çizgili tuğla ve koyu taş (fotoğrafa göre). */
function turkUcgeni() {
  const { el, c } = tuval(256, 128)
  c.fillStyle = '#7a4a34'; c.fillRect(0, 0, 256, 128)
  c.fillStyle = '#5d6168'
  for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(i * 128, 128); c.lineTo(i * 128 + 64, 0); c.lineTo(i * 128 + 128, 128); c.closePath(); c.fill() }
  c.fillStyle = '#e3ddd0'
  c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 128); c.lineTo(128, 0); c.closePath(); c.fill()
  c.beginPath(); c.moveTo(128, 0); c.lineTo(192, 128); c.lineTo(256, 0); c.closePath(); c.fill()
  return tek(el)
}

function altinSahide() {
  const { el, c } = tuval(160, 340)
  c.fillStyle = '#2d2316'; c.fillRect(0, 0, 160, 340)
  c.fillStyle = '#c49a3c'; c.fillRect(6, 6, 148, 328)
  c.fillStyle = '#433219'
  const r = rastgele(31)
  // Yazı taklidi yerine kabartma izlenimi veren eş aralıklı süs satırları
  for (let y = 22; y < 330; y += 22) for (let x = 14; x < 146; x += 12 + r() * 6) c.fillRect(x, y, 5, 10)
  return tek(el)
}

function selviDokusu() {
  const { el, c } = tuval(256)
  const r = rastgele(66)
  c.fillStyle = '#20381f'; c.fillRect(0, 0, 256, 256)
  benek(c, 256, 256, 9000, r, ['#16291a', '#2f5230', '#3c6538'], 0.7, 5)
  return tekrar(el, 3, 3)
}

function yaprakDokusu() {
  const { el, c } = tuval(256)
  const r = rastgele(67)
  c.fillStyle = '#4a6230'; c.fillRect(0, 0, 256, 256)
  benek(c, 256, 256, 9000, r, ['#34482a', '#6f8540', '#90994d'], 0.7, 6)
  return tekrar(el, 4, 4)
}

export function umurbeyMalzemeleri() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const yukleyici = new THREE.TextureLoader()
  const foto = (ad: string) => {
    if (ACIK_YAYIN) return null
    const f = yukleyici.load(`/gorseller/umurbey-kulliyesi/maket/${ad}.jpg`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const almasik = almasikDokusu(11, { tasRenk: ['#8f7f58', '#998862', '#85764f', '#93835c'], harc: '#a0937b', taseni: 0.36, tasboy: 0.24, tuglaSira: 3 })
  const acik = almasikDokusu(23, { tasRenk: ['#c5bba2', '#ccc3ac', '#bcb196', '#c3b99f'], harc: '#a99d86', taseni: 0.42, tasboy: 0.26, tuglaSira: 3 })
  const tugla = tuglaDokusu()
  const bg = (renk: THREE.Texture, kab: THREE.Texture, olc: number, p: THREE.MeshStandardMaterialParameters = {}) => pbr({ map: renk, bumpMap: kab, bumpScale: olc, roughness: 0.92, ...p })
  return {
    almasik: bg(almasik.renk, almasik.kabartma, 1.1),
    almasikAcik: bg(acik.renk, acik.kabartma, 1.1),
    tugla: bg(tugla.renk, tugla.kabartma, 0.8),
    kiremit: pbr({ map: kiremitDokusu(), roughness: 0.72, side: THREE.DoubleSide }),
    siva: pbr({ color: '#c6cacb', roughness: 0.92, side: THREE.DoubleSide }),
    sivaDis: pbr({ color: '#d8d2c2', roughness: 0.92, side: THREE.DoubleSide }),
    mukarnas: pbr({ color: '#c9cbc8', roughness: 0.85, side: THREE.DoubleSide }),
    mermer: pbr({ color: '#d7d3c9', roughness: 0.42 }),
    sekiMermer: pbr({ color: '#c9c5ba', roughness: 0.4 }),
    krem: pbr({ color: '#c4b897', roughness: 0.82 })
    ,levha: pbr({ color: '#6d5a2c', roughness: 0.5, metalness: 0.2 }),
    koyuTas: pbr({ color: '#6c6f72', roughness: 0.8 }),
    kursunKapak: pbr({ color: '#a8acb0', roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide }),
    hali: pbr({ map: haliDokusu(), roughness: 0.96 }),
    kirmiziHali: pbr({ map: kirmiziHali(), roughness: 0.95 }),
    tasDoseme: pbr({ map: tasDosemeDokusu(), roughness: 0.88 }),
    cim: pbr({ map: cimDokusu(), roughness: 1 }),
    ahsap: pbr({ map: ahsapDokusu(1, '#7a4a28', '#3f2412'), roughness: 0.55 }),
    ahsapKoyu: pbr({ map: ahsapDokusu(2, '#3f2616', '#1d1009'), roughness: 0.5 }),
    gecme: pbr({ map: geçmeDokusu(), roughness: 0.5 }),
    kahveKiremitAlt: pbr({ map: ahsapDokusu(4, '#6a3a1f', '#2f1809'), roughness: 0.7, side: THREE.DoubleSide }),
    pirinc: pbr({ color: '#c98a45', metalness: 0.8, roughness: 0.32 }),
    bronz: pbr({ color: '#6a5a3a', metalness: 0.7, roughness: 0.45 }),
    koyu: pbr({ color: '#23262a', roughness: 0.7, side: THREE.DoubleSide }),
    selvi: pbr({ map: selviDokusu(), roughness: 1 }),
    yaprak: pbr({ map: yaprakDokusu(), roughness: 1 }),
    gövde: pbr({ color: '#4a3b2e', roughness: 1 }),
    yesil: pbr({ color: '#2f7a53', roughness: 0.55 }),
    mezarIci: pbr({ color: '#4e6030', roughness: 1 }),
    perde: pbr({ color: '#8c1522', roughness: 0.9, side: THREE.DoubleSide }),
    vitray: new THREE.MeshBasicMaterial({ map: vitray(), color: new THREE.Color(1.2, 1.2, 1.15) }),
    revzen: pbr({ map: revzen(), roughness: 0.9 }),
    parmaklik: pbr({ map: parmaklik(), roughness: 0.7 }),
    gunIsigi: new THREE.MeshBasicMaterial({ map: gunIsigi(), color: new THREE.Color(1.15, 1.15, 1.1) }),
    madalyon: pbr({ map: madalyon(), roughness: 0.55, metalness: 0.25, transparent: false }),
    mihrapBandi: pbr({ map: mihrapBandi(), roughness: 0.55 }),
    mihrapBoya: pbr({ map: mihrapBoya(), roughness: 0.75 }),
    turkUcgeni: pbr({ map: turkUcgeni(), roughness: 0.6 }),
    sahide: pbr({ map: altinSahide(), roughness: 0.45, metalness: 0.45 }),
    lamba: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.6) }),
    su: pbr({ color: '#65878a', roughness: 0.2, metalness: 0.2 }),
    // Taş vakfiyeler: Drive arşivinden gerçek fotoğraf; açık yayında fotoğrafsız, sade koyu levha.
    vakfiye1: pbr({ map: foto('vakfiye-1'), color: ACIK_YAYIN ? '#3a3020' : '#a8a8a8', roughness: 0.6 }),
    vakfiye2: pbr({ map: foto('vakfiye-2'), color: ACIK_YAYIN ? '#3a3020' : '#a8a8a8', roughness: 0.6 }),
    cesmeKitabe: pbr({ map: foto('cesme-kitabe'), color: ACIK_YAYIN ? '#3a3020' : '#ffffff', roughness: 0.5 }),
  }
}
export type UmurbeyMalzemeleri = ReturnType<typeof umurbeyMalzemeleri>
