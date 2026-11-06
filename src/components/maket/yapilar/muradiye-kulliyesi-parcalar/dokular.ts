// Muradiye maketine özel dokular: tamamı tuvalde üretilir, fotoğraf kullanılmaz, yazı veya hat çizilmez.
// Renk ve düzen envanterdeki fotoğraflara ve metne göre yorumlanmıştır (üç sıra tuğla + bir sıra moloz taş,
// altıgen zümrüt ve firuze çini, tuğla örgü desenleri, kalem işi bantlar).
import * as THREE from 'three'
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

function doku(el: HTMLCanvasElement, olcekU: number, olcekV = olcekU) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / olcekU, 1 / olcekV)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Almaşık örgü: `tugla` sıra tuğla, bir sıra moloz taş; taşların arasına düşey tuğla girer. */
function almasik(tugla: number, tohum: number) {
  return tuval(512, 512, (c, g, y) => {
    const r = rastgele(tohum)
    c.fillStyle = '#b9a58a'
    c.fillRect(0, 0, g, y)
    const tuglaH = 15, tasH = 44, tekrar = 2
    const boy = (tugla * tuglaH + tasH) * tekrar
    const o = y / boy
    let v = 0
    const tuglaRenk = () => `hsl(${10 + r() * 11} ${44 + r() * 18}% ${34 + r() * 14}%)`
    for (let t = 0; t < tekrar; t++) {
      for (let s = 0; s < tugla; s++) {
        let x = -r() * 30
        while (x < g) {
          const b = 44 + r() * 22
          c.fillStyle = tuglaRenk()
          c.fillRect(x + 1, v * o + 1.5, b - 2, tuglaH * o - 3)
          x += b
        }
        v += tuglaH
      }
      let x = -r() * 30
      while (x < g) {
        const b = 58 + r() * 50
        c.fillStyle = `hsl(${30 + r() * 14} ${18 + r() * 16}% ${54 + r() * 18}%)`
        c.fillRect(x + 2, v * o + 2, b - 4, tasH * o - 4)
        x += b
        // Taş araları: düşey tuğlalar
        for (let d = 0; d < 2; d++) {
          c.fillStyle = tuglaRenk()
          c.fillRect(x + 1, v * o + 2, 7, tasH * o - 4)
          x += 8
        }
      }
      v += tasH
    }
  })
}

/** Son cemaat yeri cephesi: kırık geçmeli tuğla ağı, aralarda firuze yıldızlar. */
function tuglaDesen() {
  return tuval(512, 512, (c, g, y) => {
    const r = rastgele(83)
    c.fillStyle = '#c8b294'
    c.fillRect(0, 0, g, y)
    const a = 64
    for (let i = -1; i <= g / a + 1; i++) for (let j = -1; j <= y / a + 1; j++) {
      const x = i * a, v = j * a
      c.fillStyle = `hsl(${12 + r() * 9} ${48 + r() * 12}% ${38 + r() * 10}%)`
      c.save()
      c.translate(x + a / 2, v + a / 2)
      c.rotate(Math.PI / 4)
      c.fillRect(-a * 0.42, -a * 0.09, a * 0.84, a * 0.18)
      c.rotate(Math.PI / 2)
      c.fillRect(-a * 0.42, -a * 0.09, a * 0.84, a * 0.18)
      c.restore()
    }
    c.fillStyle = '#2f9fa8'
    for (let i = 0; i <= g / a; i += 2) for (let j = 0; j <= y / a; j += 2) {
      const x = i * a, v = j * a
      c.beginPath()
      for (let n = 0; n < 8; n++) {
        const t = n * Math.PI / 4, q = n % 2 ? 7 : 16
        c.lineTo(x + Math.cos(t) * q, v + Math.sin(t) * q)
      }
      c.closePath(); c.fill()
    }
  })
}

/** Altıgen çini; aralar `ara` rengiyle dolar, ortada ve çevrede yaldız izi. */
function altigen(renk: string, koyu: string, ara: string) {
  const G = 256, H = Math.round(G * Math.sqrt(3))
  return tuval(G, H, (c) => {
    const r = rastgele(renk.length * 13)
    c.fillStyle = ara
    c.fillRect(0, 0, G, H)
    const R = G / 3 * 0.94, dx = G, dy = H
    const hucre = (x: number, y: number) => {
      c.beginPath()
      for (let n = 0; n < 6; n++) c.lineTo(x + Math.cos(n * Math.PI / 3) * R, y + Math.sin(n * Math.PI / 3) * R)
      c.closePath()
      const g = c.createRadialGradient(x, y, 4, x, y, R)
      g.addColorStop(0, renk); g.addColorStop(1, koyu)
      c.fillStyle = g; c.globalAlpha = 0.86 + r() * 0.14; c.fill(); c.globalAlpha = 1
      c.strokeStyle = 'rgba(214,176,92,0.85)'; c.lineWidth = 3; c.stroke()
      c.fillStyle = 'rgba(226,190,106,0.9)'
      for (let n = 0; n < 6; n++) {
        const t = n * Math.PI / 3 + Math.PI / 6
        c.beginPath(); c.arc(x + Math.cos(t) * R * 0.36, y + Math.sin(t) * R * 0.36, 2.6, 0, 7); c.fill()
      }
      c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill()
    }
    for (const [ox, oy] of [[0, 0], [dx / 2, dy / 2]]) for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) hucre(ox + i * dx, oy + j * dy)
  })
}

/** Çini pano çevresi ve şerit: yalnız geometrik ve palmet motifi. */
function bant(zemin: string, motif: string, kenar: string) {
  return tuval(256, 64, (c, g, y) => {
    c.fillStyle = zemin
    c.fillRect(0, 0, g, y)
    c.fillStyle = kenar
    c.fillRect(0, 0, g, 5); c.fillRect(0, y - 5, g, 5)
    for (let i = 0; i < 4; i++) {
      const x = (i + 0.5) * (g / 4)
      c.fillStyle = motif
      c.beginPath()
      c.moveTo(x, 10); c.quadraticCurveTo(x + 24, 24, x + 20, 50); c.quadraticCurveTo(x, 40, x - 20, 50); c.quadraticCurveTo(x - 24, 24, x, 10)
      c.fill()
      c.fillStyle = kenar
      c.beginPath(); c.arc(x, 32, 6, 0, 7); c.fill()
    }
  })
}

/** Kemer yüzü: fotoğraftaki kırmızı-lacivert dilimli şerit. */
function kemerSerit() {
  return tuval(256, 64, (c, g, y) => {
    c.fillStyle = '#efe6d2'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#a63a2a'
    c.fillRect(0, 0, g, 10)
    for (let i = 0; i < 6; i++) {
      const x = (i + 0.5) * (g / 6)
      c.fillStyle = i % 2 ? '#2d4f8f' : '#b5402f'
      c.beginPath(); c.moveTo(x - 20, 10); c.quadraticCurveTo(x - 20, 42, x, 54); c.quadraticCurveTo(x + 20, 42, x + 20, 10); c.closePath(); c.fill()
      c.fillStyle = '#d9b25f'
      c.beginPath(); c.arc(x, 24, 5, 0, 7); c.fill()
    }
  })
}

/** Kubbeye geçiş kabuğu: krem zemin, kırmızı hatlı üçgen ağı. */
function trompDesen() {
  return tuval(512, 256, (c, g, y) => {
    c.fillStyle = '#efe6d3'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = 'rgba(166,58,42,0.75)'
    c.lineWidth = 3
    const n = 16
    for (let i = 0; i < n; i++) {
      const x = i * g / n, b = g / n
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + b / 2, y * 0.3); c.lineTo(x + b, y); c.stroke()
      c.beginPath(); c.moveTo(x + b / 2, y * 0.3); c.lineTo(x + b / 2, 0); c.stroke()
    }
    c.fillStyle = '#a63a2a'
    c.fillRect(0, 0, g, 12)
  })
}

/** İç kubbe: açık krem göbek, eteğinde kalem işi süs halkası (u: çevre, v: etekten tepeye). */
function icKubbe() {
  return tuval(1024, 512, (c, g, y) => {
    c.fillStyle = '#f0e8d4'
    c.fillRect(0, 0, g, y)
    const n = 32
    c.fillStyle = '#2b2d2a'
    c.fillRect(0, y - 78, g, 8)
    c.fillStyle = '#b9472f'
    c.fillRect(0, y - 40, g, 10)
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * g / n
      c.fillStyle = i % 2 ? '#a63a2a' : '#2f6f62'
      c.beginPath(); c.moveTo(x, y - 76); c.quadraticCurveTo(x + 15, y - 44, x, y - 18); c.quadraticCurveTo(x - 15, y - 44, x, y - 76); c.fill()
      c.fillStyle = '#d6ac55'
      c.beginPath(); c.arc(x, y - 46, 4, 0, 7); c.fill()
    }
    c.fillStyle = 'rgba(166,58,42,0.5)'
    c.fillRect(0, y - 92, g, 3)
  })
}

/** Kasnak iç bandı: sivri kemerli madalyonlar. */
function kasnakIc() {
  return tuval(1024, 128, (c, g, y) => {
    c.fillStyle = '#efe6d1'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#b9472f'
    c.fillRect(0, 0, g, 8); c.fillRect(0, y - 8, g, 8)
    for (let i = 0; i < 24; i++) {
      const x = (i + 0.5) * g / 24
      c.fillStyle = i % 2 ? '#a63a2a' : '#2b5a7f'
      c.beginPath(); c.moveTo(x, 18); c.quadraticCurveTo(x + 18, 64, x, 110); c.quadraticCurveTo(x - 18, 64, x, 18); c.fill()
    }
  })
}

/** Renkli camlı pencere: kurşun ağı arasında kırmızı, yeşil, mavi ve sarı parçalar. */
function vitray() {
  return tuval(128, 256, (c, g, y) => {
    const r = rastgele(97)
    const renk = ['#d8a33a', '#bf3f33', '#3d8a5c', '#3268a8', '#efd27a', '#f2ead0']
    const a = 21
    for (let i = 0; i <= g / a; i++) for (let j = 0; j <= y / a; j++) {
      c.fillStyle = renk[Math.floor(r() * renk.length)]
      c.fillRect(i * a, j * a, a, a)
    }
    c.strokeStyle = '#3a2f22'
    c.lineWidth = 3
    for (let i = 0; i <= g / a; i++) { c.beginPath(); c.moveTo(i * a, 0); c.lineTo(i * a, y); c.stroke() }
    for (let j = 0; j <= y / a; j++) { c.beginPath(); c.moveTo(0, j * a); c.lineTo(g, j * a); c.stroke() }
  })
}

/** Dış cephe taş-alçı şebeke: küçük kare gözler. */
function sebeke() {
  return tuval(128, 128, (c, g, y) => {
    c.fillStyle = '#d9cfbb'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#2a2622'
    const n = 6, b = g / n
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c.fillRect(i * b + 3, j * b + 3, b - 6, b - 6)
  })
}

function kiremit() {
  return tuval(256, 256, (c, g, y) => {
    const r = rastgele(19)
    c.fillStyle = '#7a3a24'
    c.fillRect(0, 0, g, y)
    const s = 32, b = 22
    for (let j = 0; j < y / s; j++) for (let i = -1; i < g / b + 1; i++) {
      c.fillStyle = `hsl(${12 + r() * 9} ${50 + r() * 14}% ${36 + r() * 14}%)`
      const x = i * b + (j % 2 ? b / 2 : 0)
      c.beginPath(); c.moveTo(x + 1, j * s); c.lineTo(x + b - 1, j * s); c.lineTo(x + b - 1, j * s + s - 4); c.quadraticCurveTo(x + b / 2, j * s + s + 3, x + 1, j * s + s - 4); c.closePath(); c.fill()
    }
  })
}

function cimen() {
  return tuval(256, 256, (c, g, y) => {
    const r = rastgele(29)
    c.fillStyle = '#4c6b34'
    c.fillRect(0, 0, g, y)
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = `hsl(${85 + r() * 25} ${28 + r() * 25}% ${22 + r() * 22}%)`
      c.fillRect(r() * g, r() * y, 1 + r() * 2, 2 + r() * 3)
    }
  })
}

/** Son cemaat yerinin altıgen tuğla döşemesi. */
function altigenTugla() {
  const G = 128, H = Math.round(G * Math.sqrt(3))
  return tuval(G, H, (c) => {
    const r = rastgele(37)
    c.fillStyle = '#7d6a55'
    c.fillRect(0, 0, G, H)
    const R = G / 3 * 0.92
    for (const [ox, oy] of [[0, 0], [G / 2, H / 2]]) for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) {
      const x = ox + i * G, y = oy + j * H
      c.beginPath()
      for (let n = 0; n < 6; n++) c.lineTo(x + Math.cos(n * Math.PI / 3) * R, y + Math.sin(n * Math.PI / 3) * R)
      c.closePath()
      c.fillStyle = `hsl(${14 + r() * 10} ${38 + r() * 12}% ${44 + r() * 10}%)`
      c.fill()
    }
  })
}

/** Rokoko alçı mihrap yüzeyi: krem zeminde altın kıvrımlar (temsilî; gerçek desen kopyalanmaz). */
function rokoko() {
  return tuval(256, 256, (c, g, y) => {
    const r = rastgele(43)
    c.fillStyle = '#d9c9a2'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#a57e33'
    c.lineWidth = 6
    for (let i = 0; i < 14; i++) {
      const x = r() * g, v = r() * y, a = r() * 7
      c.beginPath()
      c.arc(x, v, 16 + r() * 22, a, a + 3.6)
      c.stroke()
    }
    c.fillStyle = '#c29a45'
    for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(r() * g, r() * y, 3, 0, 7); c.fill() }
  })
}

/** Altın çerçeveli koyu pano: yazı taşımaz. Levha ve Kâbe örtüsünün yeri için. */
function koyuPano(zemin: string) {
  return tuval(256, 128, (c, g, y) => {
    c.fillStyle = zemin
    c.fillRect(0, 0, g, y)
    c.strokeStyle = '#c29a45'
    c.lineWidth = 6
    c.strokeRect(8, 8, g - 16, y - 16)
    c.lineWidth = 2
    c.strokeRect(18, 18, g - 36, y - 36)
  })
}

/** Ağaç yaprağı: benekli ton. */
function yaprak(ton: number, doyma: number, parlak: number, tohum: number) {
  return tuval(128, 128, (c, g, y) => {
    const r = rastgele(tohum)
    c.fillStyle = `hsl(${ton} ${doyma}% ${parlak - 8}%)`
    c.fillRect(0, 0, g, y)
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = `hsl(${ton + r() * 16 - 8} ${doyma + r() * 14 - 7}% ${parlak + r() * 22 - 14}%)`
      c.beginPath(); c.arc(r() * g, r() * y, 1 + r() * 2.4, 0, 7); c.fill()
    }
  })
}

export function muradiyeMalzemeleri() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const iki = THREE.DoubleSide
  const cini = (el: HTMLCanvasElement, u: number) => pbr({ map: doku(el, u, u * Math.sqrt(3)), roughness: 0.3, metalness: 0.05 })
  const kend = (el: HTMLCanvasElement) => doku(el, 1, 1)
  return {
    almasikCami: pbr({ map: doku(almasik(3, 7), 1.2), roughness: 0.92 }),
    almasikTurbe: pbr({ map: doku(almasik(2, 17), 0.95), roughness: 0.92 }),
    almasikKaba: pbr({ map: doku(almasik(3, 27), 1.5), color: '#c2a895', roughness: 0.95 }),
    tuglaDesen: pbr({ map: doku(tuglaDesen(), 2.4), roughness: 0.88 }),
    ciniZumrut: cini(altigen('#177a58', '#0d5a42', '#2ca9a2'), 0.42),
    ciniFiruze: cini(altigen('#1f9fb4', '#14758c', '#123f6a'), 0.42),
    ciniLacivert: cini(altigen('#24549f', '#183a78', '#d9d3c0'), 0.42),
    bordur: pbr({ map: doku(bant('#14315f', '#f0e8d4', '#2ba0ac'), 0.8, 0.2), roughness: 0.35 }),
    firuzeBant: pbr({ map: doku(bant('#123f5a', '#2fa8b0', '#b09154'), 1.2, 0.5), roughness: 0.4 }),
    kemerBant: pbr({ map: doku(kemerSerit(), 1, 0.3), side: iki, roughness: 0.7 }),
    tromp: pbr({ map: kend(trompDesen()), side: iki, roughness: 0.85, flatShading: true }),
    icKubbe: pbr({ map: kend(icKubbe()), side: iki, roughness: 0.9 }),
    kasnakIc: pbr({ map: kend(kasnakIc()), side: iki, roughness: 0.85 }),
    vitray: new THREE.MeshBasicMaterial({ map: kend(vitray()), color: new THREE.Color(1.35, 1.3, 1.2), side: iki }),
    sebeke: pbr({ map: kend(sebeke()), side: iki, roughness: 0.8 }),
    kiremit: pbr({ map: doku(kiremit(), 1.4), side: iki, roughness: 0.92 }),
    cimen: pbr({ map: doku(cimen(), 7), roughness: 1 }),
    altigenTugla: pbr({ map: doku(altigenTugla(), 0.9, 0.9 * Math.sqrt(3)), roughness: 0.9 }),
    rokoko: pbr({ map: doku(rokoko(), 1.1), roughness: 0.5, metalness: 0.25 }),
    levha: pbr({ map: kend(koyuPano('#10231c')), roughness: 0.6 }),
    kabe: pbr({ map: kend(koyuPano('#14130f')), roughness: 0.92 }),
    granit: pbr({ color: '#5b5f60', roughness: 0.42 }),
    camCati: pbr({ color: '#1e2c2c', roughness: 0.18, metalness: 0.7 }),
    celik: pbr({ color: '#2f3331', roughness: 0.5, metalness: 0.6 }),
    agacTuruncu: pbr({ map: doku(yaprak(32, 72, 46, 3), 3), roughness: 1 }),
    agacSari: pbr({ map: doku(yaprak(46, 66, 46, 5), 3), roughness: 1 }),
    agacYesil: pbr({ map: doku(yaprak(112, 34, 30, 9), 3), roughness: 1 }),
    sacakAlti: pbr({ color: '#6e2f1d', roughness: 0.55, side: iki }),
  }
}

export type MuradiyeMalzemeleri = ReturnType<typeof muradiyeMalzemeleri>
