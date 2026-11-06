// Ulu Camii maketinin dokuları: tamamı tuvalde üretilir, dışarıdan görsel kullanılmaz.
// Renkler ve örgü düzeni arşiv fotoğraflarına bakılarak yorumlanmıştır; yazı veya hat taklidi çizilmez.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../data/acikYayin'
import { icKubbeAyari, kubbeDokuBoyu, kursunDuzCiz, kursunKubbeCiz, pandantifCiz } from './ulucami/kubbeler'
import { hafifCihaz, haliDokulari, mermerDosemeDokulari, mermerGovdeDokusu, rastgele, suNormali } from './ulucamiZemin'

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

/** `olcek` metre: dokunun kaç metrede bir tekrarlanacağı (UV'ler metre cinsindendir). */
function doku(el: HTMLCanvasElement, olcek: number, renkli = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / olcek, 1 / olcek)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function benek(c: CanvasRenderingContext2D, g: number, y: number, r: () => number, adet: number, opak = 0.05) {
  for (let i = 0; i < adet; i++) {
    c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${opak})` : `rgba(0,0,0,${opak})`
    const b = 1 + r() * 3
    c.fillRect(r() * g, r() * y, b, b)
  }
}

interface Orgu {
  tohum: number
  boyut: number
  sira: [number, number]
  blok: [number, number]
  derz: string
  derzKalin: number
  renk: (r: () => number) => string
}

/** Sıra sıra blok örgüsü: aynı düzenden renk ve kabartma dokusu üretir. */
function orgu(o: Orgu) {
  const yerlesim: { x: number; y: number; g: number; h: number; renk: string; ton: number }[] = []
  const r = rastgele(o.tohum)
  let y = 0
  while (y < o.boyut) {
    let h = o.sira[0] + r() * (o.sira[1] - o.sira[0])
    if (o.boyut - y - h < o.sira[0]) h = o.boyut - y
    let x = -r() * o.blok[0]
    while (x < o.boyut) {
      const g = o.blok[0] + r() * (o.blok[1] - o.blok[0])
      yerlesim.push({ x, y, g, h, renk: o.renk(r), ton: 120 + r() * 70 })
      x += g
    }
    y += h
  }
  const renk = tuval(o.boyut, o.boyut, (c, g, b) => {
    c.fillStyle = o.derz
    c.fillRect(0, 0, g, b)
    const d = o.derzKalin
    for (const p of yerlesim) {
      c.fillStyle = p.renk
      c.fillRect(p.x + d / 2, p.y + d / 2, p.g - d, p.h - d)
    }
    benek(c, g, b, r, o.boyut * 8)
  })
  const kabartma = tuval(o.boyut, o.boyut, (c, g, b) => {
    c.fillStyle = '#202020'
    c.fillRect(0, 0, g, b)
    const d = o.derzKalin
    for (const p of yerlesim) {
      const t = Math.round(p.ton)
      c.fillStyle = `rgb(${t},${t},${t})`
      c.fillRect(p.x + d / 2, p.y + d / 2, p.g - d, p.h - d)
    }
    benek(c, g, b, r, o.boyut * 4, 0.1)
  })
  return { renk, kabartma }
}

export function ulucamiDokulari() {
  const tas = orgu({
    tohum: 11, boyut: 1024, sira: [46, 88], blok: [70, 170], derz: '#8f7d69', derzKalin: 3,
    renk: (r) => `hsl(${24 + r() * 14} ${20 + r() * 16}% ${r() > 0.82 ? 54 + r() * 8 : 62 + r() * 12}%)`,
  })
  const mermer = orgu({
    tohum: 23, boyut: 1024, sira: [60, 120], blok: [110, 260], derz: '#9ca0a6', derzKalin: 2,
    renk: (r) => `hsl(${205 + r() * 20} ${4 + r() * 6}% ${74 + r() * 16}%)`,
  })
  const mermerRenk = mermer.renk
  const mc = mermerRenk.getContext('2d')
  if (mc) {
    const r = rastgele(77)
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
  const tugla = orgu({
    tohum: 31, boyut: 512, sira: [15, 19], blok: [38, 62], derz: '#a48f72', derzKalin: 3,
    renk: (r) => `hsl(${24 + r() * 10} ${26 + r() * 14}% ${36 + r() * 14}%)`,
  })
  const doseme = orgu({
    tohum: 41, boyut: 1024, sira: [60, 110], blok: [90, 210], derz: '#6f675c', derzKalin: 3,
    renk: (r) => `hsl(${28 + r() * 12} ${8 + r() * 8}% ${40 + r() * 11}%)`,
  })

  const kursunDuz = tuval(512, 512, kursunDuzCiz)

  const siva = tuval(256, 256, (c, g, y) => {
    const r = rastgele(71)
    c.fillStyle = '#e6d283'
    c.fillRect(0, 0, g, y)
    benek(c, g, y, r, 2500, 0.035)
  })

  const kafes = tuval(128, 128, (c, g, y) => {
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

  const yaprak = (c: CanvasRenderingContext2D, x: number, y: number, b: number, a = 0) => {
    c.save(); c.translate(x, y); c.rotate(a)
    c.beginPath()
    c.moveTo(0, -b); c.quadraticCurveTo(b * 0.75, -b * 0.15, 0, b); c.quadraticCurveTo(-b * 0.75, -b * 0.15, 0, -b)
    c.closePath(); c.fill(); c.restore()
  }
  /** Sekiz köşeli yıldızlı geometrik göbek. */
  const gobek = (c: CanvasRenderingContext2D, x: number, y: number, r: number, dis: string, ic: string) => {
    for (const [o, renk] of [[r, dis], [r * 0.62, ic]] as const) {
      c.fillStyle = renk
      c.beginPath()
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, u = i % 2 ? o * 0.62 : o
        c.lineTo(x + Math.sin(a) * u, y + Math.cos(a) * u)
      }
      c.closePath(); c.fill()
    }
  }

  // Paye yüzü: mermer kaide ve koyu çift çizgi. Yazılar ayrı olarak arşiv fotoğrafından gelir.
  const paye = tuval(512, 2048, (c, g, y) => {
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

  const pandantif = tuval(1024, 256, pandantifCiz)

  // Fotoğraflardaki gibi yaprak dizili dal kuşağı. Yazı üretmez;
  // açık yayında özel fotoğrafın yerine kullanılan boyalı bezemedir.
  const kemerBant = tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#dfc899'; c.fillRect(0, 0, g, y)
    for (let row = 0; row < 4; row++) {
      const cy = row * 64 + 32
      c.strokeStyle = '#5a493b'; c.lineWidth = 2
      c.beginPath(); c.moveTo(0, cy); c.lineTo(g, cy); c.stroke()
      c.fillStyle = '#514337'
      for (let n = 0; n < 8; n++) {
        const x = n * 32 + 16
        for (const side of [-1, 1]) {
          yaprak(c, x, cy + side * 12, 15, side * 0.8)
          yaprak(c, x + 10, cy + side * 8, 10, side * 1.1)
        }
      }
      c.strokeStyle = '#a27d3d'; c.lineWidth = 2
      for (const yy of [cy - 29, cy + 29]) {
        c.beginPath(); c.moveTo(0, yy); c.lineTo(g, yy); c.stroke()
      }
    }
  })

  // Pencereden gelen ışık: koyu kafes, sıcak açık boşluklar
  const camKafes = tuval(128, 128, (c, g, y) => {
    c.fillStyle = '#3d2e22'
    c.fillRect(0, 0, g, y)
    const k = g / 2
    for (const [x, v, renk] of [[k, k, '#ffe9c2'], [0, 0, '#f7c9a6'], [g, 0, '#f7c9a6'], [0, y, '#f7c9a6'], [g, y, '#f7c9a6']] as const) {
      c.fillStyle = renk
      c.beginPath()
      c.moveTo(x, v - 44); c.lineTo(x + 30, v); c.lineTo(x, v + 44); c.lineTo(x - 30, v)
      c.closePath(); c.fill()
    }
  })

  // İç duvar: dokunun yüksekliği duvarın yüksekliğine eşlenir (0–13 m). Fotoğraflarda (ERD05007, ERD05161) sıva
  // halıya kadar iner; dipte koyu ve aşı boyası çift bant, yukarıda ince bir çizgi vardır, mermer kaide yoktur.
  const icDuvar = tuval(64, hafifCihaz() ? 1024 : 2048, (c, g, y) => {
    const cy = (m: number) => ((13 - m) / 13) * y
    c.fillStyle = '#f2e9d8'
    c.fillRect(0, 0, g, y)
    const bant = (m0: number, m1: number, renk: string) => { c.fillStyle = renk; c.fillRect(0, cy(m1), g, cy(m0) - cy(m1)) }
    bant(1.16, 1.2, '#a98a4a')
    bant(1.22, 1.33, '#3b342c')
    bant(1.35, 1.37, '#a98a4a')
    bant(6.72, 6.75, '#3b342c')
    bant(6.77, 6.785, '#a98a4a')
    // Halı kenarındaki temas gölgesi
    const dip = c.createLinearGradient(0, cy(1.05), 0, cy(0.7))
    dip.addColorStop(0, 'rgba(70,52,34,0)'); dip.addColorStop(1, 'rgba(70,52,34,0.42)')
    c.fillStyle = dip
    c.fillRect(0, cy(1.05), g, cy(0.7) - cy(1.05))
  })

  // Kündekâri izlenimi: koyu ahşapta yıldız ağı. Gerçek minberin deseninin kopyası değildir.
  const kundekari = tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#1b100a'
    c.fillRect(0, 0, g, y)
    for (const [x, v] of [[0, 0], [g, 0], [0, y], [g, y], [g / 2, y / 2]] as const) gobek(c, x, v, 74, '#3d2616', '#6b4a28')
    c.strokeStyle = 'rgba(150,115,60,0.5)'; c.lineWidth = 3
    c.strokeRect(1, 1, g - 2, y - 2)
  })

  const ahsapKafes = tuval(256, 128, (c, g, y) => {
        c.fillStyle = '#3a2317'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#17100b'
    for (let x = 8; x < g; x += 32) c.fillRect(x, 16, 18, y - 32)
    c.fillStyle = '#6d4524'
    for (let x = 17; x < g; x += 32) c.fillRect(x - 2, 56, 4, 16)
  })

  // Mihrap yüzeyleri: bitkisel kıvrımlar ve geometrik dizi; yazı içermez
  const bezeme = tuval(512, 512, (c, g, y) => {
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
      gobek(c, x, v, 20, '#e8c56f', '#7a3226')
    }
  })
  const mihrapMavi = tuval(256, 256, (c, g, y) => {
    c.fillStyle = '#24376b'
    c.fillRect(0, 0, g, y)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x = a * 128 + 64, v = b * 128 + 64
      c.fillStyle = '#c9cfd8'
      for (let n = 0; n < 6; n++) yaprak(c, x + Math.sin(n) * 24, v + Math.cos(n) * 24, 19, -n)
      gobek(c, x, v, 16, '#e0b95f', '#8a6a35')
    }
  })
  const mihrapYesil = tuval(128, 128, (c, g, y) => {
    c.fillStyle = '#183a2e'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#d6ad56'
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) yaprak(c, a * 64 + 32, b * 64 + 32, 22, Math.PI / 4)
  })
  const mihrapKirmizi = tuval(128, 128, (c, g, y) => {
    c.fillStyle = '#4d1712'
    c.fillRect(0, 0, g, y)
    c.fillStyle = '#672519'
    for (let v = 0; v < y; v += 32) c.fillRect(0, v, g, 6)
  })

  const cam = tuval(512, 256, (c, g, y) => {
    c.fillStyle = 'rgba(150,190,205,0.32)'
    c.fillRect(0, 0, g, y)
    c.strokeStyle = 'rgba(30,38,42,0.95)'
    c.lineWidth = 5
    for (let x = 0; x <= g; x += g / 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke() }
    for (let v = 0; v <= y; v += y / 4) { c.beginPath(); c.moveTo(0, v); c.lineTo(g, v); c.stroke() }
  })

  const selviCiz = (kabartma: boolean): Ciz => (c, g, y) => {
    const r = rastgele(97)
    c.fillStyle = kabartma ? '#555' : '#1c3626'
    c.fillRect(0, 0, g, y)
    for (let i = 0; i < 2600; i++) {
      const a = r()
      c.fillStyle = kabartma ? `rgb(${40 + a * 200},${40 + a * 200},${40 + a * 200})` : `hsl(${135 + a * 25} ${28 + a * 18}% ${10 + a * 20}%)`
      c.beginPath()
      c.ellipse(r() * g, r() * y, 2 + r() * 3, 7 + r() * 9, (r() - 0.5) * 0.9, 0, Math.PI * 2)
      c.fill()
    }
  }

  // Kâbe kapısının örtüsü: siyah dokuma, burgulu bordür, işlemeleri dökülmüş altın kemer ve göbekler.
  // Yazı içermez; gerçek ayet işlemeleri taklit edilmez.
  const kabeOrtusu = tuval(1024, 1332, (c, g, y) => {
    const r = rastgele(131)
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
    const burgu = (x: number, v: number, a: number) => {
      c.save(); c.translate(x, v); c.rotate(a)
      c.fillStyle = '#b39c6c'
      c.beginPath(); c.ellipse(0, 0, 24, 8, 0.7, 0, Math.PI * 2); c.fill()
      c.fillStyle = 'rgba(30,22,12,0.55)'
      c.beginPath(); c.ellipse(4, 3, 18, 3, 0.7, 0, Math.PI * 2); c.fill()
      c.restore()
    }
    for (let x = b / 2 + 10; x < g - 30; x += 40) { burgu(x, 44, 0); burgu(x, y - 44, 0) }
    for (let v = b + 34; v < y - b - 10; v += 40) { burgu(44, v, Math.PI / 2); burgu(g - 44, v, Math.PI / 2) }
    // İç işleme: iç içe sivri kemer, baklava ağı, köşe göbekleri
    const altin = '#c79d4d'
    const kemerCiz = (o: number, alt: number, ust: number) => {
      c.beginPath()
      c.moveTo(g / 2 - o, alt); c.lineTo(g / 2 - o, ust + o * 1.05)
      c.quadraticCurveTo(g / 2 - o, ust + o * 0.3, g / 2, ust)
      c.quadraticCurveTo(g / 2 + o, ust + o * 0.3, g / 2 + o, ust + o * 1.05)
      c.lineTo(g / 2 + o, alt)
    }
    const alt = y - 190, ust = 190
    c.save()
    kemerCiz(300, alt, ust + 40); c.closePath(); c.clip()
    c.strokeStyle = 'rgba(199,157,77,0.55)'; c.lineWidth = 2
    for (let i = -y; i < y; i += 64) {
      c.beginPath(); c.moveTo(0, i); c.lineTo(g, i + g * 0.6); c.stroke()
      c.beginPath(); c.moveTo(g, i); c.lineTo(0, i + g * 0.6); c.stroke()
    }
    c.fillStyle = altin
    for (let a = 0; a < 9; a++) for (let e = 0; e < 13; e++) yaprak(c, 130 + a * 95 + (e % 2) * 47, 180 + e * 80, 11, (a + e) * 0.7)
    c.restore()
    c.strokeStyle = altin
    for (const [o, l, u] of [[300, 6, 40], [335, 3, 0], [355, 2, -24]] as const) { c.lineWidth = l; kemerCiz(o, alt, ust + u); c.stroke() }
    c.lineWidth = 6
    c.beginPath(); c.moveTo(g / 2 - 355, alt); c.lineTo(g / 2 + 355, alt); c.stroke()
    for (let x = g / 2 - 320; x <= g / 2 + 320; x += 80) gobek(c, x, alt + 48, 26, altin, '#2a1f10')
    for (const [x, v] of [[170, 190], [g - 170, 190]] as const) { gobek(c, x, v, 62, altin, '#14100b'); gobek(c, x, v, 24, altin, '#14100b') }
    gobek(c, g / 2, (alt + ust) / 2 + 40, 118, altin, '#14100b')
    gobek(c, g / 2, (alt + ust) / 2 + 40, 54, altin, '#14100b')
    // Dökülmüş işlemeler: altının üzerine düzensiz koyu yamalar
    for (let i = 0; i < 520; i++) {
      const x = 90 + r() * (g - 180), v = 90 + r() * (y - 180), a = 6 + r() * r() * 70
      c.fillStyle = `rgba(13,12,11,${0.25 + r() * 0.6})`
      c.beginPath(); c.ellipse(x, v, a, a * (0.35 + r() * 0.8), r() * 3, 0, Math.PI * 2); c.fill()
    }
  })

  // Lamba halesi: görüntü işleme kapalıyken ve VR'da da parıltı verir.
  const hale = tuval(128, 128, (c, g, y) => {
    const z = c.createRadialGradient(g / 2, y / 2, 0, g / 2, y / 2, g / 2)
    z.addColorStop(0, 'rgba(255,240,210,1)'); z.addColorStop(0.16, 'rgba(255,214,150,0.55)'); z.addColorStop(0.5, 'rgba(255,190,110,0.12)'); z.addColorStop(1, 'rgba(255,180,100,0)')
    c.fillStyle = '#000'; c.fillRect(0, 0, g, y)
    c.fillStyle = z; c.fillRect(0, 0, g, y)
  })
  // Şadırvan kubbesinden inen ışık: yukarıda parlak, aşağıda sönen, hafif çizgili.
  const isikSutunu = tuval(256, 256, (c, g, y) => {
    const r = rastgele(151)
    const z = c.createLinearGradient(0, 0, 0, y)
    z.addColorStop(0, '#fff3da'); z.addColorStop(0.55, '#6b6252'); z.addColorStop(1, '#000')
    c.fillStyle = z; c.fillRect(0, 0, g, y)
    c.globalCompositeOperation = 'multiply'
    for (let x = 0; x < g; x += 8) { const t = Math.round(120 + r() * 135); c.fillStyle = `rgb(${t},${t},${t})`; c.fillRect(x, 0, 8, y) }
  })

  const kubbeDoku = doku(tuval(kubbeDokuBoyu(), kubbeDokuBoyu() / 2, kursunKubbeCiz(false)), 1)
  const kubbeKabartma = doku(tuval(kubbeDokuBoyu() / 2, kubbeDokuBoyu() / 4, kursunKubbeCiz(true)), 1, false)
  const camDoku = doku(cam, 1)
  const icDuvarDoku = doku(icDuvar, 1)
  icDuvarDoku.repeat.set(0.25, 1 / 13)
  const ahsapKafesDoku = doku(ahsapKafes, 1)
  ahsapKafesDoku.repeat.set(1.3, 1.4)

  return {
    tas: doku(tas.renk, 8), tasKabartma: doku(tas.kabartma, 8, false),
    mermer: doku(mermerRenk, 7), mermerKabartma: doku(mermer.kabartma, 7, false),
    tugla: doku(tugla.renk, 3.2), tuglaKabartma: doku(tugla.kabartma, 3.2, false),
    doseme: doku(doseme.renk, 14), dosemeKabartma: doku(doseme.kabartma, 14, false),
    kursunDuz: doku(kursunDuz, 7),
    kubbe: kubbeDoku, kubbeKabartma,
    kabeOrtusu: doku(kabeOrtusu, 1),
    selvi: doku(tuval(512, 512, selviCiz(false)), 4),
    selviKabartma: doku(tuval(512, 512, selviCiz(true)), 4, false),
    siva: doku(siva, 4),
    kafes: doku(kafes, 0.34),
    hali: haliDokulari(),
    mermerDoseme: mermerDosemeDokulari(),
    mermerGovde: mermerGovdeDokusu(),
    suNormal: suNormali(),
    paye: doku(paye, 1),
    pandantif: doku(pandantif, 1),
    kemerBant: doku(kemerBant, 0.62),
    camKafes: doku(camKafes, 0.34),
    icDuvar: icDuvarDoku,
    kundekari: doku(kundekari, 0.46),
    ahsapKafes: ahsapKafesDoku,
    bezeme: doku(bezeme, 1.25),
    mihrapMavi: doku(mihrapMavi, 0.9),
    mihrapYesil: doku(mihrapYesil, 0.42),
    mihrapKirmizi: doku(mihrapKirmizi, 0.9),
    cam: camDoku,
    hale: doku(hale, 1),
    isikSutunu: doku(isikSutunu, 1),
  }
}

const YAS_ORTAK = `
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
const ZEMIN_ISIK = `vec2 goz = vec2(13.8, 13.75), kayma = vec2(34.5, 27.5), p = vYasPoz.xz;
    vec2 kose = floor((p + kayma) / goz + 0.5) * goz - kayma;
    float paye = length(max(abs(p - kose) - vec2(1.62), vec2(0.0)));
    vec2 merkez = (floor((p + kayma) / goz) + 0.5) * goz - kayma;
    float havuz = exp(-dot(p - merkez, p - merkez) / 22.0);
    float duvar = min(32.5 - abs(p.x), 25.5 - abs(p.y));
    float golge = mix(0.64, 1.0, smoothstep(0.0, 2.4, paye)) * mix(0.72, 1.0, smoothstep(0.0, 2.0, duvar));`

/** Parça koordinatına bağlı yaşlanma: katmanlar kalksa da leke yerinde kalır. */
const YAS_TURLERI = {
  // Duvar: saçaktan süzülen yağmur izi, zemine yakın kir, geniş ton farkı
  duvar: `float u = vYasPoz.x + vYasPoz.z;
    float leke = yasFbm(vec2(u * 0.16, vYasPoz.y * 0.11));
    float cizgi = yasFbm(vec2(u * 1.5, vYasPoz.y * 0.05));
    float sacak = smoothstep(6.5, 13.0, vYasPoz.y) * smoothstep(0.42, 0.72, cizgi);
    float taban = 1.0 - smoothstep(0.2, 2.8, vYasPoz.y);
    diffuseColor.rgb *= mix(1.0, 0.66, sacak * 0.6) * mix(1.0, 0.62, taban * 0.7) * (0.88 + 0.24 * leke);`,
  mermer: `float u = vYasPoz.x + vYasPoz.z;
    float cizgi = yasFbm(vec2(u * 1.2, vYasPoz.y * 0.06));
    float taban = 1.0 - smoothstep(0.1, 1.8, vYasPoz.y);
    diffuseColor.rgb *= mix(1.0, 0.8, taban * 0.6) * (0.92 + 0.14 * cizgi);`,
  // Kurşun döşeme: dağınık oksit lekeleri
  kursun: `float leke = yasFbm(vYasPoz.xz * 0.28);
    diffuseColor.rgb *= vec3(0.97, 1.0, 1.03) * (0.78 + 0.34 * leke);`,
  // Kubbe: her gözde farklı ton, tepeden eteğe süzülen izler
  kubbe: `vec2 goz = vec2(13.8, 13.75), kayma = vec2(34.5, 27.5);
    vec2 kimlik = floor((vYasPoz.xz + kayma) / goz);
    vec2 merkez = (kimlik + 0.5) * goz - kayma;
    float aci = atan(vYasPoz.x - merkez.x, vYasPoz.z - merkez.y);
    float iz = yasFbm(vec2(aci * 5.0, vYasPoz.y * 0.22) + kimlik * 7.0);
    float ton = 0.9 + 0.2 * yasKarma(kimlik);
    diffuseColor.rgb *= vec3(0.95, 1.0, 1.05) * ton * (0.78 + 0.38 * iz);`,
  siva: `float leke = yasFbm(vec2((vYasPoz.x + vYasPoz.z) * 0.9, vYasPoz.y * 0.35));
    diffuseColor.rgb *= 0.84 + 0.26 * leke;`,
  tugla: `float leke = yasFbm(vec2(atan(vYasPoz.x, vYasPoz.z) * 3.0, vYasPoz.y * 0.28));
    diffuseColor.rgb *= 0.8 + 0.34 * leke;`,
  doseme: `float leke = yasFbm(vYasPoz.xz * 0.12);
    diffuseColor.rgb *= 0.8 + 0.34 * leke;`,
  // Halı: paye ve duvar diplerinde temas gölgesi, avize altında sıcak ışık havuzu, ayak izi solması
  hali: `${ZEMIN_ISIK}
    float genis = yasFbm(p * 0.28);
    float asinma = smoothstep(0.52, 0.74, yasFbm(p * 0.55 + 9.0));
    vec3 solgun = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.33))), 0.3) * 1.1;
    diffuseColor.rgb = mix(diffuseColor.rgb, solgun, asinma * 0.4);
    diffuseColor.rgb *= golge * (0.92 + 0.16 * genis) * (0.9 + vec3(0.42, 0.36, 0.26) * havuz);`,
  // Hafif sürüm: gürültüsüz; yalnız temas gölgesi ve ışık havuzu
  zeminHafif: `${ZEMIN_ISIK}
    diffuseColor.rgb *= golge * (0.9 + vec3(0.42, 0.36, 0.26) * havuz);`,
  mermerDoseme: `${ZEMIN_ISIK}
    diffuseColor.rgb *= golge * (0.94 + 0.12 * yasFbm(p * 0.7));`,
  // Boyalı sıva: geniş bulutlanma, ince fırça farkı, zemine yakın kir
  icSiva: `float u = vYasPoz.x + vYasPoz.z;
    float leke = yasFbm(vec2(u * 0.35, vYasPoz.y * 0.22));
    float ince = yasFbm(vec2(u * 2.2, vYasPoz.y * 1.6));
    float taban = 1.0 - smoothstep(0.7, 1.9, vYasPoz.y);
    diffuseColor.rgb *= (0.93 + 0.12 * leke) * (0.975 + 0.05 * ince) * mix(1.0, 0.84, taban);`,
} as const

function yaslandir<M extends THREE.MeshStandardMaterial>(malzeme: M, tur: keyof typeof YAS_TURLERI) {
  malzeme.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vYasPoz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvYasPoz = position;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${YAS_ORTAK}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n{ ${YAS_TURLERI[tur]} }`)
  }
  malzeme.customProgramCacheKey = () => `yas-${tur}`
  return malzeme
}

/** İç pencere atlası: fotoğrafın ışığı dokuda olduğu için kısmen kendinden aydınlık; tepeliğin kenarı alfa ile kesilir. */
function icPencereMalzemesi(map: THREE.Texture | null) {
  return new THREE.MeshStandardMaterial({ map, emissive: map ? '#ffffff' : '#000000', emissiveMap: map, emissiveIntensity: 0.5, color: map ? '#ffffff' : '#e7dcc4', roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide })
}

export function ulucamiMalzemeleri() {
  const d = ulucamiDokulari()
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const yukleyici = new THREE.TextureLoader()
  const fotoDoku = (ad: string) => {
    if (ACIK_YAYIN) return null
    const f = yukleyici.load(`/gorseller/ulu-camii/maket/${ad.includes('.') ? ad : `${ad}.jpg`}`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const hafif = hafifCihaz()
  // Halı havı: sheen, bakış açısına göre kadife parlaklığı verir.
  const hav = (renk: string, parlama: string) => yaslandir(hafif
    ? pbr({ map: d.hali.renk, normalMap: d.hali.normal, normalScale: new THREE.Vector2(0.75, 0.75), color: renk, roughness: 0.96 })
    : new THREE.MeshPhysicalMaterial({ map: d.hali.renk, normalMap: d.hali.normal, normalScale: new THREE.Vector2(0.75, 0.75), color: renk, roughness: 0.96, sheen: 0.28, sheenRoughness: 0.8, sheenColor: new THREE.Color(parlama) }), hafif ? 'zeminHafif' : 'hali')
  // Cila: masaüstünde ayrı parlak katman, hafif cihazda yalnız düşük pürüzlülük.
  const cilali = (p: THREE.MeshStandardMaterialParameters, cila: number, cilaPuruz: number) => hafif ? pbr(p) : new THREE.MeshPhysicalMaterial({ ...p, clearcoat: cila, clearcoatRoughness: cilaPuruz })
  const siva = <M extends THREE.MeshStandardMaterial>(m: M) => hafif ? m : yaslandir(m, 'icSiva')
  const isik = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1.5, 1.4, 1.25), side: THREE.DoubleSide })
  return {
    tas: yaslandir(pbr({ map: d.tas, bumpMap: d.tasKabartma, bumpScale: 1.1, roughness: 0.92 }), 'duvar'),
    mermer: yaslandir(pbr({ map: d.mermer, bumpMap: d.mermerKabartma, bumpScale: 0.25, roughness: 0.48 }), 'mermer'),
    mermerKoyu: pbr({ map: d.mermer, color: '#c9c3b5', roughness: 0.5 }),
    tugla: yaslandir(pbr({ map: d.tugla, bumpMap: d.tuglaKabartma, bumpScale: 0.9, roughness: 0.9 }), 'tugla'),
    doseme: yaslandir(pbr({ map: d.doseme, bumpMap: d.dosemeKabartma, bumpScale: 0.7 }), 'doseme'),
    kursun: yaslandir(pbr({ map: d.kursunDuz, roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide }), 'kursun'),
    kubbe: yaslandir(pbr({ map: d.kubbe, bumpMap: d.kubbeKabartma, bumpScale: 0.35, roughness: 0.66, metalness: 0.14, side: THREE.DoubleSide }), 'kubbe'),
    taskoyu: pbr({ map: d.tugla, bumpMap: d.tuglaKabartma, bumpScale: 0.6, color: '#a39480', roughness: 0.9 }),
    hucre: pbr({ color: '#6f5f4c', roughness: 0.9 }),
    selvi: pbr({ map: d.selvi, bumpMap: d.selviKabartma, bumpScale: 1.6, roughness: 1 }),
    siva: yaslandir(pbr({ map: d.siva, roughness: 0.9, side: THREE.DoubleSide }), 'siva'),
    kafes: pbr({ map: d.kafes, roughness: 0.75, side: THREE.DoubleSide }),
    hali: hav('#d9a39b', '#ecc2b6'),
    // Ulu Camii göz düzeni gölgesi içermez; başka yapılarda bunu kullan.
    haliSade: pbr({ map: d.hali.renk, normalMap: d.hali.normal, normalScale: new THREE.Vector2(0.75, 0.75), color: '#c9877c', roughness: 0.96 }),
    haliZeytin: hav('#a29b63', '#c9c188'),
    mermerDoseme: yaslandir(cilali({ map: d.mermerDoseme.renk, bumpMap: d.mermerDoseme.kabartma, bumpScale: 0.4, roughness: 0.34 }, 0.55, 0.14), hafif ? 'zeminHafif' : 'mermerDoseme'),
    icMermer: cilali({ map: d.mermerGovde, roughness: 0.36 }, 0.35, 0.2),
    paye: siva(pbr({ map: d.paye, roughness: 0.8 })),
    ic: siva(pbr({ color: '#f1e8d6', roughness: 0.85, side: THREE.DoubleSide })),
    icDuvar: siva(pbr({ map: d.icDuvar, roughness: 0.85, side: THREE.DoubleSide })),
    icKubbe: siva(pbr(icKubbeAyari())),
    pandantif: pbr({ map: d.pandantif, roughness: 0.9, side: THREE.DoubleSide }),
    kemerBant: pbr({ map: d.kemerBant, roughness: 0.75, side: THREE.DoubleSide }),
    kundekari: pbr({ map: d.kundekari, roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide }),
    ahsapKafes: pbr({ map: d.ahsapKafes, roughness: 0.6 }),
    bezeme: pbr({ map: d.bezeme, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide }),
    mihrapMavi: pbr({ map: d.mihrapMavi, roughness: 0.55 }),
    mihrapYesil: pbr({ map: d.mihrapYesil, roughness: 0.5, side: THREE.DoubleSide }),
    mihrapKirmizi: pbr({ map: d.mihrapKirmizi, roughness: 0.8 }),
    koyu: pbr({ color: '#2b2d2c', roughness: 0.75, side: THREE.DoubleSide }),
    ahsap: pbr({ color: '#3a2317', roughness: 0.6 }),
    ceviz: pbr({ color: '#5c3a22', roughness: 0.52 }),
    altin: pbr({ color: '#d3a43f', metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide }),
    altinKoyu: pbr({ color: '#a97f2e', metalness: 0.6, roughness: 0.42, side: THREE.DoubleSide }),
    bronz: pbr({ color: '#6f5a35', metalness: 0.75, roughness: 0.4, side: THREE.DoubleSide }),
    su: cilali({ color: '#5fb3b5', normalMap: d.suNormal, normalScale: new THREE.Vector2(0.28, 0.28), roughness: 0.16 }, 1, 0.08),
    cam: new THREE.MeshStandardMaterial({ map: d.cam, transparent: true, depthWrite: false, roughness: 0.15, metalness: 0.3, side: THREE.DoubleSide }),
    krem: pbr({ color: '#e7dcc4', roughness: 0.8, side: THREE.DoubleSide }),
    camKafes: isik(d.camKafes),
    pencereIc: icPencereMalzemesi(fotoDoku('ic-pencere.webp')),
    kabeOrtusu: new THREE.MeshBasicMaterial({ map: fotoDoku(hafif ? 'kabe-ortusu-1024' : 'kabe-ortusu') ?? d.kabeOrtusu, color: '#d4d0c8' }),
    lamba: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.8, 2.1) }),
    lambaHale: new THREE.MeshBasicMaterial({ map: d.hale, color: new THREE.Color(1.1, 0.95, 0.75), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    isikSutunu: new THREE.MeshBasicMaterial({ map: d.isikSutunu, color: new THREE.Color(0.2, 0.19, 0.16), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    gok: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.5, 2.7), side: THREE.FrontSide }),
  }
}

export type UlucamiMalzemeleri = ReturnType<typeof ulucamiMalzemeleri>
