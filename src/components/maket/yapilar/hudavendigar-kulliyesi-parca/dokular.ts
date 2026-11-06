// Külliyeye özel tuval dokuları: dışarıdan görsel kullanılmaz. Örgü ve renkler kitaptaki fotoğraflara bakılarak
// yorumlanmıştır; bezemeler temsilîdir, hat yazısı taklit edilmez.
import * as THREE from 'three'
import { rastgele } from '../../ulucamiZemin'
import type { UlucamiMalzemeleri } from '../../ulucamiDokular'

type Ciz = (c: CanvasRenderingContext2D, w: number, h: number, r: () => number) => void

function doku(w: number, h: number, metreX: number, metreY: number, tohum: number, ciz: Ciz, renkli = true) {
  const el = document.createElement('canvas')
  el.width = w; el.height = h
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  ciz(c, w, h, rastgele(tohum))
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metreX, 1 / metreY)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Sıra sıra örgü: `sira` her dönemde [yükseklik oranı, tuğla mı]. */
function orgu(c: CanvasRenderingContext2D, w: number, h: number, r: () => number, sira: { h: number; tugla: boolean; blok: number }[]) {
  c.fillStyle = '#bda98f'
  c.fillRect(0, 0, w, h)
  const top = sira.reduce((t, s) => t + s.h, 0)
  let y = 0
  for (const s of sira) {
    const sh = (s.h / top) * h
    const blok = s.blok, n = Math.max(1, Math.round(w / blok)), bg = w / n
    const kay = r() * bg
    for (let i = -1; i < n + 1; i++) {
      const x = kay + i * bg
      c.fillStyle = s.tugla
        ? `hsl(${13 + r() * 9} ${44 + r() * 16}% ${35 + r() * 12}%)`
        : `hsl(${33 + r() * 9} ${20 + r() * 12}% ${60 + r() * 13}%)`
      const a = s.tugla ? 2 : 2
      c.fillRect(x + a / 2, y + a / 2, bg - a, sh - a)
    }
    y += sh
  }
}

function geometrikRozet(c: CanvasRenderingContext2D, x: number, y: number, R: number, renk: string) {
  c.strokeStyle = renk
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

export function kulliyeMalzemeleri(m: UlucamiMalzemeleri) {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })

  // Almaşık: üç sıra tuğla, bir sıra kesme taş (kitap s. 82-83). Dönem 0.62 m.
  const T = { h: 0.1, tugla: true, blok: 110 }, S = { h: 0.32, tugla: false, blok: 290 }
  const almasik = doku(1024, 512, 2.4, 1.24, 71, (c, w, h, r) => orgu(c, w, h, r, [T, T, T, S, T, T, T, S]))
  const tugla = doku(512, 512, 1.6, 1.6, 72, (c, w, h, r) => orgu(c, w, h, r, Array.from({ length: 22 }, () => ({ h: 1, tugla: true, blok: 70 }))))
  // Yan cephe: daha çok taş, araya iki sıra tuğla (s. 82 ve arka cephe fotoğrafı)
  const T2 = { h: 0.085, tugla: true, blok: 110 }
  const yan = doku(1024, 512, 2.4, 1.16, 73, (c, w, h, r) => orgu(c, w, h, r, [T2, T2, { h: 0.41, tugla: false, blok: 300 }, T2, T2, { h: 0.41, tugla: false, blok: 340 }]))
  const moloz = doku(1024, 1024, 4, 4, 74, (c, w, h, r) => {
    c.fillStyle = '#a58f76'; c.fillRect(0, 0, w, h)
    for (let i = 0; i < 620; i++) {
      c.fillStyle = r() > 0.8 ? `hsl(${14 + r() * 8} 42% ${36 + r() * 8}%)` : `hsl(${24 + r() * 14} ${16 + r() * 18}% ${38 + r() * 24}%)`
      const b = 22 + r() * 44, x = r() * w, y = r() * h
      c.beginPath(); c.ellipse(x, y, b, b * (0.45 + r() * 0.3), r() * 0.5, 0, Math.PI * 2); c.fill()
    }
  })
  const kiremit = doku(512, 512, 2.4, 2.4, 75, (c, w, h, r) => {
    const SIRA = 12, SUT = 12
    for (let j = 0; j < SIRA; j++) for (let i = 0; i <= SUT; i++) {
      c.fillStyle = `hsl(${11 + r() * 9} ${48 + r() * 18}% ${32 + r() * 13}%)`
      const x = ((i + (j % 2) * 0.5) * w) / SUT, y = (j * h) / SIRA
      c.fillRect(x - w / SUT / 2 + 1, y, w / SUT - 2, h / SIRA - 1)
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x - w / SUT / 2 + 1, y + h / SIRA - 5, w / SUT - 2, 4)
    }
  })
  // Saçak altında tüm cepheyi geçen küçük sivri kemer dizisi (s. 84-85)
  const friz = doku(256, 256, 0.9, 0.8, 76, (c, w, h) => {
    c.fillStyle = '#b4674a'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#d7c6a6'; c.fillRect(0, 0, w, h * 0.14)
    c.fillStyle = '#d7c6a6'
    c.beginPath(); c.moveTo(w * 0.1, h); c.lineTo(w * 0.1, h * 0.55); c.quadraticCurveTo(w * 0.1, h * 0.3, w / 2, h * 0.2); c.quadraticCurveTo(w * 0.9, h * 0.3, w * 0.9, h * 0.55); c.lineTo(w * 0.9, h); c.fill()
    c.fillStyle = '#3c2a22'
    c.beginPath(); c.moveTo(w * 0.24, h); c.lineTo(w * 0.24, h * 0.6); c.quadraticCurveTo(w * 0.24, h * 0.42, w / 2, h * 0.34); c.quadraticCurveTo(w * 0.76, h * 0.42, w * 0.76, h * 0.6); c.lineTo(w * 0.76, h); c.fill()
  })
  // Cephe panosu ve kemer alınlıkları: iki renkli geometrik dolgu (TDV; s. 82 fotoğrafı)
  const gecme = doku(256, 256, 0.8, 0.8, 77, (c, w, h) => {
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
  const minare = doku(1024, 1024, 8.6, 8.6, 78, (c, w, h, r) => {
    orgu(c, w, h, r, Array.from({ length: 70 }, () => ({ h: 1, tugla: true, blok: 42 })))
    c.strokeStyle = 'rgba(214,190,150,0.8)'; c.lineWidth = 7
    for (let y = 0; y < h; y += h / 4) {
      c.beginPath()
      for (let x = 0; x <= w; x += w / 16) c.lineTo(x, y + (Math.round(x / (w / 16)) % 2 ? 40 : 0))
      c.stroke()
    }
  })
  // Kalem işi kuşak: rumi kıvrımlar, lacivert ve altın
  const bordur = doku(512, 128, 1, 0.25, 79, (c, w, h) => {
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
  const haliKenar = doku(256, 128, 0.8, 0.4, 80, (c, w, h) => {
    c.fillStyle = '#17333f'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#d7b667'; c.lineWidth = 8
    for (let i = 0; i < 4; i++) {
      const x = (i * w) / 4
      c.beginPath(); c.moveTo(x, h - 22); c.lineTo(x, 24); c.lineTo(x + w * 0.18, 24); c.lineTo(x + w * 0.18, h - 44); c.lineTo(x + w * 0.09, h - 44); c.stroke()
    }
  })
  // Levha: yazısız, altın halkalı yeşil yuvarlak pano
  const levha = doku(256, 256, 1, 1, 81, (c, w, h) => {
    c.fillStyle = '#c9a24d'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#1f4a39'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2); c.fill()
    geometrikRozet(c, w / 2, h / 2, w * 0.33, '#d7b667')
  })
  levha.repeat.set(1, 1)
  // Kubbe göbeği: sekiz kandil, sekiz madalyon, palmet sonlanma (s. 88). Üstten görünüşe göre boyanır.
  const gobek = doku(1024, 1024, 1, 1, 82, (c, w, h) => {
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
  gobek.repeat.set(1, 1)
  // Perde motifi: ortasında kandil sarkan perde (s. 88). Yan eyvanların güney duvarında.
  const perde = doku(512, 1024, 1, 1, 83, (c, w, h, r) => {
    c.fillStyle = '#f0e6d0'; c.fillRect(0, 0, w, h)
    const kenar = 46
    c.fillStyle = '#2b2a2c'; c.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 26) for (let x = 0; x < w; x += 26) {
      c.fillStyle = (x + y) % 52 ? '#a67c35' : '#6e2a22'
      if (r() > 0.25) c.fillRect(x + 6, y + 6, 14, 14)
    }
    c.fillStyle = '#ead9b4'; c.fillRect(kenar, kenar + 120, w - kenar * 2, h - kenar - 120)
    c.fillStyle = '#efe7d6'; c.beginPath(); c.moveTo(kenar, h); c.lineTo(kenar, kenar + 120); c.quadraticCurveTo(w / 2, kenar + 40, w - kenar, kenar + 120); c.lineTo(w - kenar, h); c.fill()
    const perdeRenk = (x0: number, yon: number) => {
      c.fillStyle = '#a4552f'
      c.beginPath(); c.moveTo(x0, kenar + 120); c.quadraticCurveTo(x0 + yon * 170, kenar + 420, x0 + yon * 66, h - 180); c.lineTo(x0, h - 40); c.closePath(); c.fill()
      c.strokeStyle = '#e8c591'; c.lineWidth = 4
      for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x0 + yon * k * 22, kenar + 130); c.quadraticCurveTo(x0 + yon * (60 + k * 22), kenar + 420, x0 + yon * k * 13, h - 90); c.stroke() }
    }
    perdeRenk(kenar, 1); perdeRenk(w - kenar, -1)
    c.strokeStyle = '#5c4326'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, kenar + 80); c.lineTo(w / 2, h * 0.62); c.stroke()
    c.fillStyle = '#6e4a22'; c.beginPath(); c.moveTo(w / 2, h * 0.6); c.lineTo(w / 2 + 28, h * 0.68); c.lineTo(w / 2, h * 0.78); c.lineTo(w / 2 - 28, h * 0.68); c.closePath(); c.fill()
  })
  perde.repeat.set(1, 1)
  // Mihrap çerçevesi: iç içe kırmızı, lacivert ve altın kuşaklar. Yazı yoktur.
  const mihrapCerceve = doku(1024, 1024, 1, 1, 84, (c, w, h, r) => {
    const kusaklar: [string, number][] = [['#b08433', 26], ['#541c1b', 66], ['#c9a24d', 16], ['#16304a', 74], ['#c9a24d', 14], ['#6d2120', 96], ['#c9a24d', 14], ['#16304a', 66], ['#c9a24d', 20], ['#541c1b', 200]]
    let g = 0
    for (const [renk, kal] of kusaklar) {
      c.fillStyle = renk
      c.fillRect(g, g, w - g * 2, h - g * 2)
      const i = g + kal / 2
      if (kal > 40) {
        c.fillStyle = renk === '#16304a' ? '#d7b667' : '#c9a24d'
        for (let t = 0; t < 1; t += 0.018) for (const [x, y] of [[i + t * (w - 2 * i), i], [i + t * (w - 2 * i), h - i], [i, i + t * (h - 2 * i)], [w - i, i + t * (h - 2 * i)]]) {
          c.save(); c.translate(x, y); c.rotate(r() * 6)
          c.beginPath(); c.ellipse(0, 0, 6, 11, 0, 0, Math.PI * 2); c.fill()
          c.restore()
        }
      }
      g += kal
    }
  })
  mihrapCerceve.repeat.set(1, 1)
  const kavsaraAlti = doku(256, 256, 1, 1, 85, (c, w, h) => {
    c.fillStyle = '#16304a'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#a67c35'; c.lineWidth = 3; c.strokeRect(14, 14, w - 28, h - 28)
    geometrikRozet(c, w / 2, h * 0.45, w * 0.26, '#d7b667')
  })
  kavsaraAlti.repeat.set(1, 1)

  const hali = m.haliSade as THREE.MeshStandardMaterial
  const haliMal = (renk: string) => pbr({ map: hali.map, normalMap: hali.normalMap, normalScale: new THREE.Vector2(0.7, 0.7), color: renk, roughness: 0.96 })
  return {
    almasik: pbr({ map: almasik, roughness: 0.9 }),
    yanCephe: pbr({ map: yan, roughness: 0.92 }),
    tuglaKaba: pbr({ map: tugla, roughness: 0.92 }),
    moloz: pbr({ map: moloz, roughness: 0.96 }),
    kiremit: pbr({ map: kiremit, roughness: 0.82, side: THREE.DoubleSide }),
    friz: pbr({ map: friz, roughness: 0.9 }),
    gecme: pbr({ map: gecme, roughness: 0.88 }),
    minare: pbr({ map: minare, roughness: 0.92 }),
    bordur: pbr({ map: bordur, roughness: 0.6, metalness: 0.1 }),
    haliKenar: pbr({ map: haliKenar, roughness: 0.95 }),
    levha: pbr({ map: levha, roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide }),
    gobek: pbr({ map: gobek, roughness: 0.85, side: THREE.DoubleSide }),
    perde: pbr({ map: perde, roughness: 0.8 }),
    mihrapCerceve: pbr({ map: mihrapCerceve, roughness: 0.42, metalness: 0.22, side: THREE.DoubleSide }),
    kavsaraAlti: pbr({ map: kavsaraAlti, roughness: 0.55 }),
    haliMavi: haliMal('#2d94aa'),
    haliKirmizi: haliMal('#b13f34'),
    duvarIc: pbr({ color: '#dcd5c6', roughness: 0.9 }),
    tavan: pbr({ color: '#e7e1d3', roughness: 0.9, side: THREE.DoubleSide }),
    beyaz: pbr({ color: '#efece4', roughness: 0.55 }),
    krem: pbr({ color: '#dfcf9e', roughness: 0.9 }),
    tasDoseme: pbr({ color: '#8a7d6b', roughness: 0.92 }),
    yol: pbr({ color: '#57534c', roughness: 0.98 }),
    cim: pbr({ color: '#4f6a36', roughness: 1 }),
    yaprak: pbr({ color: '#5d7a35', roughness: 1, flatShading: true }),
    yaprakKoyu: pbr({ color: '#3f5a2b', roughness: 1, flatShading: true }),
    gergi: pbr({ color: '#4a3020', roughness: 0.7 }),
    kapi: pbr({ color: '#94602c', roughness: 0.55 }),
    koyuCam: pbr({ color: '#20262a', roughness: 0.25, metalness: 0.3, side: THREE.DoubleSide }),
    pencereIsik: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.42, 1.25), side: THREE.DoubleSide }),
    fener: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.8, 1), side: THREE.DoubleSide }),
    sekiz: pbr({ color: '#d9cfbb', roughness: 0.4 }),
  }
}

export type KulliyeMalzemeleri = ReturnType<typeof kulliyeMalzemeleri>
