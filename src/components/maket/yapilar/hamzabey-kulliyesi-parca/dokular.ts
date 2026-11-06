// Hamzabey Külliyesi maketinin dokuları. Tuvalde üretilir; renk ve düzen Drive arşiv fotoğraflarına bakılarak yorumlanmıştır.
// Hat yazısı taklit edilmez. Yalnız iki fotoğraf dokusu vardır (kitabe, kubbe göbeği); açık yayında kullanılmaz.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../../data/acikYayin'
import { rastgele } from '../../ulucamiZemin'

type Ciz = (c: CanvasRenderingContext2D, g: number, y: number) => void

function tuval(g: number, y: number, ciz: Ciz) {
  const el = document.createElement('canvas')
  el.width = g
  el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  ciz(c, g, y)
  return el
}

/** `gx`, `gy` metre: doku bu kadar metrede bir tekrarlanır (UV'ler metre cinsinden). */
function doku(el: HTMLCanvasElement, gx = 1, gy = gx, renkli = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / gx, 1 / gy)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

const sec = <T,>(r: () => number, l: T[]) => l[Math.floor(r() * l.length)]
const TUGLA = ['#8d4a31', '#975238', '#9f5a3f', '#864429', '#a56247', '#914f36']
const TAS = ['#a5957a', '#94866c', '#ae9f85', '#9a8c72', '#8a7c64', '#a99a80']

/** Üç sıra tuğla, bir sıra moloz taş; taş aralarında düşey tuğla (envanter, s. 180-182). */
function orgu() {
  const G = 1024, Y = 512, TAS_H = 146, TUG_H = 37
  const r = rastgele(11)
  const parcalar: { x: number; y: number; g: number; h: number; renk: string; yuk: number }[] = []
  let y = 0
  for (let p = 0; p < 2; p++) {
    let x = -r() * 60
    while (x < G) {
      const g = 170 + r() * 150
      parcalar.push({ x, y, g: g - 5, h: TAS_H - 5, renk: sec(r, TAS), yuk: 150 + r() * 70 })
      x += g
      const adet = 1 + Math.floor(r() * 2)
      for (let i = 0; i < adet; i++) {
        parcalar.push({ x, y, g: 21, h: TAS_H - 5, renk: sec(r, TUGLA), yuk: 210 })
        x += 26
      }
    }
    y += TAS_H
    for (let s = 0; s < 3; s++) {
      let xb = -r() * 130
      while (xb < G) {
        const g = 110 + r() * 40
        parcalar.push({ x: xb, y, g: g - 5, h: TUG_H - 5, renk: sec(r, TUGLA), yuk: 215 })
        xb += g
      }
      y += TUG_H
    }
  }
  const renk = tuval(G, Y, (c) => {
    c.fillStyle = '#bcae98'
    c.fillRect(0, 0, G, Y)
    for (const p of parcalar) { c.fillStyle = p.renk; c.fillRect(p.x, p.y, p.g, p.h) }
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'
      const b = 1 + r() * 4
      c.fillRect(r() * G, r() * Y, b, b)
    }
  })
  const kabartma = tuval(G / 2, Y / 2, (c) => {
    c.fillStyle = '#303030'
    c.fillRect(0, 0, G, Y)
    c.scale(0.5, 0.5)
    for (const p of parcalar) { c.fillStyle = `rgb(${p.yuk},${p.yuk},${p.yuk})`; c.fillRect(p.x, p.y, p.g, p.h) }
  })
  return { renk: doku(renk, 2.1, 1.05), kabartma: doku(kabartma, 2.1, 1.05, false) }
}

/** Yalnız tuğla: kasnak, minare gövdesi ve kemer halkaları. */
function tuglaDokusu() {
  const G = 512, Y = 256, H = 64
  const r = rastgele(23)
  return doku(tuval(G, Y, (c) => {
    c.fillStyle = '#b5a791'
    c.fillRect(0, 0, G, Y)
    for (let s = 0; s < 4; s++) {
      let x = s % 2 ? -110 : 0
      while (x < G) {
        c.fillStyle = sec(r, TUGLA)
        c.fillRect(x + 3, s * H + 4, 212, H - 8)
        x += 218
      }
    }
    for (let i = 0; i < 1200; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'
      c.fillRect(r() * G, r() * Y, 3, 3)
    }
  }), 0.6, 0.3)
}

/** Aile Türbesi'nin üst cephesindeki zikzak tuğla düzeni (fotoğraftan yorum). */
function zikzakDokusu() {
  const G = 768, Y = 576, A = 64, B = 96
  const r = rastgele(7)
  return doku(tuval(G, Y, (c) => {
    c.fillStyle = '#c4b59e'
    c.fillRect(0, 0, G, Y)
    for (let s = 0; s < Y / B; s++) {
      const yt = s * B
      // Bant arası ince tuğla sırası
      c.fillStyle = sec(r, TUGLA)
      c.fillRect(0, yt, G, 12)
      for (let i = -1; i <= G / (A * 2); i++) {
        const x = i * A * 2 + (s % 2 ? A : 0)
        c.fillStyle = sec(r, TUGLA)
        c.beginPath(); c.moveTo(x + 5, yt + B - 6); c.lineTo(x + A, yt + 20); c.lineTo(x + A * 2 - 5, yt + B - 6); c.closePath(); c.fill()
        c.fillStyle = '#efe4cd'
        c.beginPath(); c.moveTo(x + A - 18, yt + B - 8); c.lineTo(x + A, yt + 52); c.lineTo(x + A + 18, yt + B - 8); c.closePath(); c.fill()
      }
    }
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.07)'
      c.fillRect(r() * G, r() * Y, 3, 3)
    }
  }), 1.2, 0.9)
}

/** Kaburgalı kurşun kubbe: dilim dikişleri ve yatay ek yerleri; UV kubbeye bir kez sarılır. */
function kursunKubbe(dilim: number) {
  const G = 2048, Y = 512
  const r = rastgele(31)
  return doku(tuval(G, Y, (c) => {
    c.fillStyle = '#8d989e'
    c.fillRect(0, 0, G, Y)
    const d = G / dilim
    for (let i = 0; i < dilim; i++) {
      const t = 132 + r() * 22
      c.fillStyle = `rgb(${t - 6},${t + 6},${t + 12})`
      c.fillRect(i * d, 0, d, Y)
      for (let j = 1; j < 5; j++) {
        c.fillStyle = 'rgba(60,70,76,.35)'
        c.fillRect(i * d, j * 100 + (i % 2) * 40, d, 2)
      }
      c.fillStyle = 'rgba(48,56,62,.75)'
      c.fillRect(i * d, 0, 3, Y)
      c.fillStyle = 'rgba(240,245,248,.45)'
      c.fillRect(i * d + 3, 0, 3, Y)
    }
  }))
}

/** Renkli cam pencere: beyaz daireler ve kırmızı-mavi dolgu (fotoğrafa göre). */
function vitrayDokusu() {
  return doku(tuval(256, 384, (c, g, y) => {
    c.fillStyle = '#f7f2e6'
    c.fillRect(0, 0, g, y)
    const s = 56
    for (let j = -1; j < y / s + 1; j++) for (let i = -1; i < g / s + 1; i++) {
      const x = i * s + s / 2 + (j % 2 ? s / 2 : 0), yy = j * s + s / 2
      c.fillStyle = (i + j) % 3 === 0 ? '#c9352b' : (i + j) % 3 === 1 ? '#e5683c' : '#3a66b5'
      c.beginPath(); c.moveTo(x, yy - 27); c.lineTo(x + 27, yy); c.lineTo(x, yy + 27); c.lineTo(x - 27, yy); c.closePath(); c.fill()
      c.fillStyle = '#fbf8ee'
      c.beginPath(); c.arc(x + s / 2, yy, 18, 0, Math.PI * 2); c.fill()
      c.strokeStyle = '#8c8880'; c.lineWidth = 2.5; c.stroke()
    }
  }))
}

/** İçeriden görülen ahşap kanatlı pencere ve aydınlık cam. */
function pencereDokusu() {
  return doku(tuval(256, 320, (c, g, y) => {
    c.fillStyle = '#eef4f6'
    c.fillRect(0, 0, g, y)
    const gr = c.createLinearGradient(0, 0, 0, y)
    gr.addColorStop(0, 'rgba(190,215,235,.75)'); gr.addColorStop(0.65, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(150,175,120,.55)')
    c.fillStyle = gr
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#8a4b26'
    c.fillRect(0, 0, g, 22); c.fillRect(0, y - 22, g, 22); c.fillRect(0, 0, 22, y); c.fillRect(g - 22, 0, 22, y)
    c.fillRect(g / 2 - 11, 0, 22, y); c.fillRect(0, y * 0.32, g, 14)
    c.fillStyle = '#5b5a58'
    for (let i = 1; i < 6; i++) c.fillRect((i * g) / 6 - 2, y * 0.34, 4, y)
    for (let j = 0; j < 4; j++) c.fillRect(0, y * (0.45 + j * 0.15), g, 3)
  }))
}

/** Dışarıdan görülen demir parmaklıklı pencere. */
function parmaklikDokusu() {
  return doku(tuval(256, 320, (c, g, y) => {
    c.fillStyle = '#17120e'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#2d2f33'
    for (let i = 1; i < 7; i++) c.fillRect((i * g) / 7 - 4, 0, 8, y)
    for (let j = 1; j < 8; j++) c.fillRect(0, (j * y) / 8 - 3, g, 6)
    c.strokeStyle = '#55351f'; c.lineWidth = 16; c.strokeRect(0, 0, g, y)
  }))
}

/** Dıştan alçı şebeke: daire dizili kafes. */
function sebekeDokusu() {
  return doku(tuval(256, 384, (c, g, y) => {
    c.fillStyle = '#ece3d0'
    c.fillRect(0, 0, g, y)
    const s = 62
    for (let j = 0; j < y / s + 1; j++) for (let i = 0; i < g / s + 1; i++) {
      c.fillStyle = '#2d3137'
      c.beginPath(); c.arc(i * s + (j % 2 ? s / 2 : 0), j * s, s * 0.39, 0, Math.PI * 2); c.fill()
    }
  }))
}

function cicek(c: CanvasRenderingContext2D, x: number, y: number, r: number, renk: string, gobek: string, yaprak = 6) {
  c.fillStyle = renk
  for (let i = 0; i < yaprak; i++) {
    const a = (i / yaprak) * Math.PI * 2
    c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.42, r * 0.28, a, 0, Math.PI * 2); c.fill()
  }
  c.fillStyle = gobek
  c.beginPath(); c.arc(x, y, r * 0.3, 0, Math.PI * 2); c.fill()
}

/** Bal rengi halı: 1,2 metrede bir saf bandı ve çiçek dizisi (fotoğrafa göre). */
function haliDokusu() {
  const G = 1024
  const r = rastgele(5)
  return doku(tuval(G, G, (c) => {
    c.fillStyle = '#b89f78'
    c.fillRect(0, 0, G, G)
    for (let i = 0; i < 26000; i++) {
      const t = r()
      c.fillStyle = t > 0.5 ? 'rgba(255,240,205,.07)' : 'rgba(88,62,30,.07)'
      c.fillRect(r() * G, r() * G, 2, 2)
    }
    for (let s = 0; s < 2; s++) {
      const y = s * (G / 2) + 60
      c.fillStyle = '#cdbc9c'
      c.fillRect(0, y - 40, G, 80)
      c.fillStyle = '#6a4a35'
      c.fillRect(0, y - 40, G, 4); c.fillRect(0, y + 36, G, 4)
      for (let i = 0; i < 8; i++) {
        const x = (i + 0.5) * (G / 8)
        cicek(c, x, y, 28, i % 2 ? '#2a2b52' : '#74303a', '#d8b56a', 8)
        c.fillStyle = '#6a4a35'
        c.beginPath(); c.arc(x + G / 16, y, 5, 0, Math.PI * 2); c.fill()
      }
    }
  }), 2.4, 2.4)
}

/** Orta sofadaki göbek halı: iç içe halkalarda iri çiçekler; kenarı saydam. */
function gulHaliDokusu() {
  const G = 1024, m = G / 2
  return doku(tuval(G, G, (c) => {
    c.clearRect(0, 0, G, G)
    c.beginPath()
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2, rr = 498 - 14 * Math.abs(Math.sin(a * 6))
      const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr
      if (i) c.lineTo(x, y); else c.moveTo(x, y)
    }
    c.closePath()
    c.fillStyle = '#e9dfca'; c.fill()
    c.lineWidth = 8; c.strokeStyle = '#7a5a3c'; c.stroke()
    const halka = (rr: number, n: number, boy: number, r1: string, r2: string) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr
        c.fillStyle = '#f7f1e2'
        c.beginPath(); c.arc(x, y, boy * 1.05, 0, Math.PI * 2); c.fill()
        c.strokeStyle = '#b08a55'; c.lineWidth = 3; c.stroke()
        cicek(c, x, y, boy, i % 2 ? r1 : r2, '#d9a53f', 8)
      }
    }
    halka(390, 12, 66, '#1e3f78', '#8f2a2f')
    halka(235, 8, 74, '#8f2a2f', '#1e3f78')
    cicek(c, m, m, 110, '#6d4720', '#d9a53f', 10)
    cicek(c, m, m, 58, '#1e3f78', '#f0d68a', 8)
  }))
}

/** İç kubbe: u çevre, v tabandan tepeye. Eteğinde yeşil-kahve yaprak kuşağı. */
function kubbeIcDokusu() {
  return doku(tuval(2048, 512, (c, g, y) => {
    c.fillStyle = '#efece4'
    c.fillRect(0, 0, g, y)
    const yb = y - 34
    c.fillStyle = '#5a3a28'
    c.fillRect(0, y - 8, g, 8)
    c.fillStyle = '#3f5a48'
    c.fillRect(0, yb - 34, g, 4)
    const n = 48
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * g
      c.fillStyle = i % 2 ? '#3f6650' : '#6c4630'
      c.beginPath(); c.ellipse(x - 9, yb, 15, 9, -0.7, 0, Math.PI * 2); c.ellipse(x + 9, yb, 15, 9, 0.7, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#b7863f'
      c.beginPath(); c.arc(x, yb, 5, 0, Math.PI * 2); c.fill()
    }
  }))
}

/** Kubbe göbeği yedeği (açık yayın veya foto yoksa): halkalı rozet. */
function gobekDokusu() {
  const G = 512, m = G / 2
  return doku(tuval(G, G, (c) => {
    c.fillStyle = '#efece4'
    c.fillRect(0, 0, G, G)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      c.fillStyle = i % 2 ? '#3f6650' : '#2c5484'
      c.beginPath(); c.ellipse(m + Math.cos(a) * 160, m + Math.sin(a) * 160, 26, 13, a, 0, Math.PI * 2); c.fill()
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      c.strokeStyle = '#2b2622'; c.lineWidth = 10
      c.beginPath(); c.ellipse(m + Math.cos(a) * 55, m + Math.sin(a) * 55, 58, 22, a, 0, Math.PI * 2); c.stroke()
    }
  }))
}

/** Türk üçgeni yüzü: her üçgene çizgili kontur (fotoğraftaki boyalı çizgiler). */
function ucgenDokusu() {
  return doku(tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#efece4'
    c.fillRect(0, 0, g, y)
    const yol = (p: number) => {
      c.beginPath()
      c.moveTo(p, y - p * 0.6); c.lineTo(g - p, y - p * 0.6); c.lineTo(g / 2, p * 1.5); c.closePath()
    }
    c.strokeStyle = '#3a3836'
    c.lineWidth = 6; yol(10); c.stroke()
    c.lineWidth = 2.5; yol(46); c.stroke()
  }))
}

/** Mihrap çerçevesi şeridi: krem üzerine yeşil geçme. */
function mihrapBantDokusu() {
  return doku(tuval(128, 128, (c, g, y) => {
    c.fillStyle = '#e7e6da'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#2e5642'; c.lineWidth = 11
    c.beginPath(); c.arc(g / 2, 0, 44, 0, Math.PI); c.stroke()
    c.beginPath(); c.arc(g / 2, y, 44, Math.PI, Math.PI * 2); c.stroke()
    c.beginPath(); c.arc(0, y / 2, 44, -Math.PI / 2, Math.PI / 2); c.stroke()
    c.beginPath(); c.arc(g, y / 2, 44, Math.PI / 2, Math.PI * 1.5); c.stroke()
    c.fillStyle = '#25382f'
    c.beginPath(); c.arc(g / 2, y / 2, 12, 0, Math.PI * 2); c.fill()
  }), 0.26)
}

/** Sekizgen levha: yazısız, yıldız geçmeli. Fotoğraftaki hat levhaları taklit edilmez. */
function madalyonDokusu() {
  const G = 256, m = G / 2
  return doku(tuval(G, G, (c) => {
    c.fillStyle = '#1f2b24'
    c.fillRect(0, 0, G, G)
    c.strokeStyle = '#cda44f'; c.lineWidth = 7
    c.beginPath(); c.arc(m, m, 104, 0, Math.PI * 2); c.stroke()
    c.lineWidth = 4
    for (let k = 0; k < 2; k++) {
      c.beginPath()
      for (let i = 0; i <= 4; i++) {
        const a = (i / 4) * Math.PI * 2 + (k * Math.PI) / 4
        const x = m + Math.cos(a) * 80, y = m + Math.sin(a) * 80
        if (i) c.lineTo(x, y); else c.moveTo(x, y)
      }
      c.stroke()
    }
  }))
}

/** Sanduka örtüsü: siyah üzerine altın zikzak (Hamza Bey Türbesi fotoğrafı). */
function sandukaDokusu() {
  return doku(tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#14161a'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#b89650'; c.lineWidth = 7
    for (let j = 0; j < 5; j++) {
      c.beginPath()
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * g, yy = j * 52 + 26 + (i % 2 ? -18 : 18)
        if (i) c.lineTo(x, yy); else c.moveTo(x, yy)
      }
      c.stroke()
    }
  }), 0.32)
}

/** Aile Türbesi sanduka örtüsü: kırmızı brokar. */
function brokarDokusu() {
  return doku(tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#7d1f1c'
    c.fillRect(0, 0, g, y)
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) cicek(c, (i + 0.5) * 64 + (j % 2 ? 32 : 0), (j + 0.5) * 64, 22, '#a8483a', '#c98f4d', 6)
  }), 0.5)
}

/** Sıvalı niş içindeki dökümlü perde tasviri (batı eyvanı mihrabı için temsilî). */
function perdeDokusu() {
  return doku(tuval(256, 512, (c, g, y) => {
    for (let x = 0; x < g; x++) {
      const t = 220 + 26 * Math.sin((x / g) * Math.PI * 12)
      c.fillStyle = `rgb(${t},${t - 6},${t - 18})`
      c.fillRect(x, 0, 1, y)
    }
    c.fillStyle = 'rgba(115,84,50,.6)'
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.ellipse(g * (0.1 + i * 0.2), y * 0.12, g * 0.12, y * 0.06, 0, 0, Math.PI); c.fill()
    }
  }))
}

/** Sıva üstü kahverengi kıvrım bezeme; saydam zemin. */
function malakariDokusu() {
  const G = 512, Y = 256, m = G / 2
  return doku(tuval(G, Y, (c) => {
    c.clearRect(0, 0, G, Y)
    c.strokeStyle = '#5b3a2a'; c.lineWidth = 9; c.lineCap = 'round'
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(m, 190); c.bezierCurveTo(m + s * 70, 230, m + s * 180, 200, m + s * 170, 110); c.bezierCurveTo(m + s * 165, 70, m + s * 100, 80, m + s * 110, 125); c.stroke()
      c.beginPath(); c.moveTo(m, 150); c.bezierCurveTo(m + s * 30, 120, m + s * 60, 130, m + s * 55, 165); c.stroke()
      c.fillStyle = '#5b3a2a'
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.ellipse(m + s * (70 + i * 30), 205 - i * 12, 15, 7, s * 0.4, 0, Math.PI * 2); c.fill()
      }
    }
    c.fillStyle = '#5b3a2a'
    c.beginPath(); c.moveTo(m, 40); c.quadraticCurveTo(m + 34, 90, m, 130); c.quadraticCurveTo(m - 34, 90, m, 40); c.fill()
  }))
}

/** Tuğla döşeme: türbelerde kırmızı-kahve kare tuğla. */
function dosemeTuglaDokusu() {
  const r = rastgele(41)
  return doku(tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#8a7461'
    c.fillRect(0, 0, g, y)
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      c.fillStyle = sec(r, ['#b3684f', '#a65c46', '#bd735a', '#9f5541'])
      c.fillRect(i * 128 + 3, j * 128 + 3, 122, 122)
    }
  }), 1)
}

function benekli(tohum: number, taban: string, renkler: string[], gx: number) {
  const r = rastgele(tohum)
  return doku(tuval(256, 256, (c, g, y) => {
    c.fillStyle = taban
    c.fillRect(0, 0, g, y)
    for (let i = 0; i < 2200; i++) {
      c.fillStyle = sec(r, renkler)
      const b = 2 + r() * 7
      c.fillRect(r() * g, r() * y, b, b)
    }
  }), gx)
}

export function hamzabeyMalzemeleri() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const parla = (map: THREE.Texture, k: number) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k * 0.97) })
  const o = orgu()
  const yukleyici = new THREE.TextureLoader()
  const fotoDoku = (ad: string) => {
    if (ACIK_YAYIN) return null
    const f = yukleyici.load(`/gorseller/hamzabey-kulliyesi/maket/${ad}.jpg`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const gobekFoto = fotoDoku('kubbe-gobek')
  const kitabeFoto = fotoDoku('kitabe')
  return {
    orgu: pbr({ map: o.renk, bumpMap: o.kabartma, bumpScale: 0.9, roughness: 0.92 }),
    tugla: pbr({ map: tuglaDokusu(), roughness: 0.9 }),
    zikzak: pbr({ map: zikzakDokusu(), roughness: 0.9 }),
    kubbeDis: pbr({ map: kursunKubbe(36), roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide }),
    siva: pbr({ color: '#e9e8e4', roughness: 0.92, side: THREE.DoubleSide }),
    sivaAydin: pbr({ color: '#e9e8e4', roughness: 0.92, side: THREE.DoubleSide, emissive: '#8c8a84', emissiveIntensity: 0.55 }),
    nis: pbr({ color: '#c9c7c0', roughness: 0.92 }),
    cizgi: pbr({ color: '#3c3a38', roughness: 0.8 }),
    hali: pbr({ map: haliDokusu(), roughness: 0.97 }),
    gulHali: pbr({ map: gulHaliDokusu(), roughness: 0.96, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    vitray: parla(vitrayDokusu(), 1.5),
    pencere: new THREE.MeshBasicMaterial({ map: pencereDokusu(), color: new THREE.Color(1.15, 1.15, 1.12) }),
    parmaklik: pbr({ map: parmaklikDokusu(), roughness: 0.7 }),
    sebeke: pbr({ map: sebekeDokusu(), roughness: 0.85 }),
    kubbeIc: pbr({ map: kubbeIcDokusu(), roughness: 0.92, side: THREE.DoubleSide }),
    kubbeIcAydin: pbr({ map: kubbeIcDokusu(), roughness: 0.92, side: THREE.DoubleSide, emissive: '#8c8a84', emissiveIntensity: 0.55 }),
    gobek: pbr({ map: gobekFoto ?? gobekDokusu(), roughness: 0.92, side: THREE.DoubleSide }),
    ucgen: pbr({ map: ucgenDokusu(), roughness: 0.92, side: THREE.DoubleSide }),
    mihrapBant: pbr({ map: mihrapBantDokusu(), roughness: 0.75 }),
    madalyon: pbr({ map: madalyonDokusu(), roughness: 0.5, metalness: 0.15 }),
    sanduka: pbr({ map: sandukaDokusu(), roughness: 0.75, side: THREE.DoubleSide }),
    brokar: pbr({ map: brokarDokusu(), roughness: 0.82, side: THREE.DoubleSide }),
    perde: pbr({ map: perdeDokusu(), roughness: 0.9 }),
    malakari: pbr({ map: malakariDokusu(), transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    dosemeTugla: pbr({ map: dosemeTuglaDokusu(), roughness: 0.85 }),
    kitabe: pbr({ map: kitabeFoto, color: kitabeFoto ? '#ffffff' : '#d9d2bf', roughness: 0.7 }),
    ceviz: pbr({ color: '#5a3219', roughness: 0.5 }),
    cevizAcik: pbr({ color: '#7d4a25', roughness: 0.5 }),
    kirmizi: pbr({ color: '#8e1f24', roughness: 0.7 }),
    cini: pbr({ color: '#2f7f86', roughness: 0.35, metalness: 0.05 }),
    yaprakSari: pbr({ map: benekli(3, '#9c7a2a', ['#b0892f', '#8b6420', '#7c7c2c', '#b8953a', '#6e5220', '#5f6a28'], 1.2), roughness: 1 }),
    yaprakYesil: pbr({ map: benekli(4, '#4d6629', ['#5d7a30', '#3f5522', '#6d8535', '#34491d', '#7c8a35'], 1.2), roughness: 1 }),
    cim: pbr({ map: benekli(8, '#5a7a33', ['#688b3b', '#4c6b2a', '#79963f', '#507031'], 3), roughness: 1 }),
    govde: pbr({ color: '#4c3a2b', roughness: 1 }),
  }
}
