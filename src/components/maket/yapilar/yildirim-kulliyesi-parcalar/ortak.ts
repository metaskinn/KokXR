// Yıldırım Külliyesi maketinin ortak dokuları ve geometri yardımcıları.
// Taş, almaşık örgü, halı ve bezemeler tuvalde üretilir; yalnız mihrap ve iki levha Drive fotoğrafından gelir.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../../data/acikYayin'
import { ulucamiMalzemeleri } from '../../ulucamiDokular'
import { Kova, cikar, dondurG, duzGolge, kemer, kutuG, silindirG, yer } from '../../ulucamiParca'
import { hafifCihaz, rastgele } from '../../ulucamiZemin'

export type Mal = THREE.Material
export type Ek = (kv: Kova, g: THREE.BufferGeometry, mal: Mal) => void

const FOTO = '/gorseller/yildirim-kulliyesi/maket'

function tuval(g: number, y: number, ciz: (c: CanvasRenderingContext2D, g: number, y: number) => void) {
  const el = document.createElement('canvas')
  el.width = g; el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  ciz(c, g, y)
  return el
}
function doku(el: HTMLCanvasElement, metreX: number, metreY: number, renkli = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metreX, 1 / metreY)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Kesme taş: açık gri ve bej, damarlı bloklar (cephe ve iç payeler fotoğraflardaki gibi). */
function kesmeTuval(tohum: number, renkler: string[]) {
  const r = rastgele(tohum)
  return tuval(1024, 1024, (c, G, Y) => {
    c.fillStyle = '#8f8a80'; c.fillRect(0, 0, G, Y)
    const SIRA = 10, h = Y / SIRA
    for (let s = 0; s < SIRA; s++) {
      let x = -r() * 140
      const ilk = x
      while (x < G + ilk + 40) {
        const w = Math.min(120 + r() * 170, G + ilk - x + 4)
        if (w < 6) break
        const ton = renkler[Math.floor(r() * renkler.length)]
        const ciz = (ox: number) => {
          c.fillStyle = ton
          c.fillRect(x + ox + 1.5, s * h + 1.5, w - 3, h - 3)
          c.globalAlpha = 0.07
          c.strokeStyle = r() > 0.5 ? '#5c5a57' : '#f4f1ea'
          c.lineWidth = 1 + r() * 1.4
          for (let d = 0; d < 3; d++) {
            c.beginPath()
            const yy = s * h + r() * h
            c.moveTo(x + ox + 2, yy)
            c.bezierCurveTo(x + ox + w * 0.3, yy + (r() - 0.5) * h, x + ox + w * 0.7, yy + (r() - 0.5) * h, x + ox + w - 2, s * h + r() * h)
            c.stroke()
          }
          c.globalAlpha = 1
        }
        ciz(0)
        if (x < 0) ciz(G)
        x += w
      }
    }
  })
}

/** Almaşık örgü: iki sıra tuğla ile bir sıra taş (envanter s. 176, 204). */
function almasikTuval(tohum: number, tasRenk: string[]) {
  const r = rastgele(tohum)
  return tuval(1024, 1024, (c, G, Y) => {
    c.fillStyle = '#c9b89b'; c.fillRect(0, 0, G, Y)
    const DONEM = 5, d = Y / DONEM // 1024 px = 2,4 m; bir tekrar 0,48 m
    for (let s = 0; s < DONEM; s++) {
      const y0 = s * d
      // Taş sırası
      let x = -r() * 90
      const tasH = d * 0.62
      while (x < G) {
        const w = 90 + r() * 90
        c.fillStyle = tasRenk[Math.floor(r() * tasRenk.length)]
        c.fillRect(x + 2, y0 + 3, w - 4, tasH - 5)
        c.globalAlpha = 0.14
        c.fillStyle = '#3d3a33'
        for (let n = 0; n < 12; n++) c.fillRect(x + 4 + r() * (w - 10), y0 + 5 + r() * (tasH - 12), 2 + r() * 6, 1 + r() * 4)
        c.globalAlpha = 1
        x += w
      }
      // İki sıra tuğla
      for (let t = 0; t < 2; t++) {
        const yy = y0 + tasH + t * (d - tasH) / 2
        let bx = -(t * 40) - r() * 40
        while (bx < G) {
          const k = 150 + r() * 50
          c.fillStyle = `rgb(${k + 22},${k * 0.56},${k * 0.38})`
          c.fillRect(bx + 1.5, yy + 2, 62, (d - tasH) / 2 - 4)
          bx += 66
        }
      }
    }
  })
}

/** Moloz taş duvar: düzensiz, sıcak gri taşlar (darüşşifa). */
function molozTuval(tohum: number) {
  const r = rastgele(tohum)
  return tuval(512, 512, (c, G, Y) => {
    c.fillStyle = '#b6a78f'; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 900; n++) {
      const k = 120 + r() * 70
      c.fillStyle = `rgb(${k + 26},${k + 8},${k - 16})`
      const w = 12 + r() * 34, h = 8 + r() * 18
      c.beginPath(); c.ellipse(r() * G, r() * Y, w / 2, h / 2, (r() - 0.5) * 0.7, 0, Math.PI * 2); c.fill()
    }
  })
}

/** Turkuaz halı: alacalı zemin ve kıbleye dik saf şeritleri (fotoğraflardaki gibi; desen kopyalanmaz). */
function haliTuval(tohum: number) {
  const r = rastgele(tohum)
  return tuval(512, 512, (c, G, Y) => {
    c.fillStyle = '#1d7880'; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 1400; n++) {
      c.fillStyle = r() > 0.5 ? 'rgba(70,160,165,0.1)' : 'rgba(8,70,80,0.14)'
      c.beginPath(); c.ellipse(r() * G, r() * Y, 8 + r() * 42, 3 + r() * 14, r() * 3, 0, Math.PI * 2); c.fill()
    }
    // Saf şeridi: 2,4 m'de bir koyu bant ve baklava dizisi
    const y0 = Y * 0.46, h = Y * 0.075
    c.fillStyle = '#16323a'; c.fillRect(0, y0, G, h)
    c.fillStyle = '#b9c9c4'; c.fillRect(0, y0 - 2, G, 2); c.fillRect(0, y0 + h, G, 2)
    c.fillStyle = '#9fb9b4'
    for (let x = 0; x < G; x += 32) {
      c.beginPath(); c.moveTo(x + 16, y0 + 4); c.lineTo(x + 28, y0 + h / 2); c.lineTo(x + 16, y0 + h - 4); c.lineTo(x + 4, y0 + h / 2); c.closePath(); c.fill()
    }
  })
}

/** Kırmızı halı (türbe iç mekânı, parçalı görünüşte üstten görünür). */
const kirmiziTuval = (tohum: number) => {
  const r = rastgele(tohum)
  return tuval(128, 128, (c, G, Y) => {
    c.fillStyle = '#b61f1c'; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 300; n++) { c.fillStyle = r() > 0.5 ? 'rgba(220,60,50,0.14)' : 'rgba(90,10,10,0.14)'; c.fillRect(r() * G, r() * Y, 2 + r() * 8, 1 + r() * 3) }
  })
}

/** Kalem işi kuşak: rumi benzeri geometrik tekrar; yazı içermez. */
function bantTuval() {
  return tuval(512, 64, (c, G, Y) => {
    c.fillStyle = '#f2ead9'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#8a5a2a'; c.fillRect(0, 4, G, 3); c.fillRect(0, Y - 7, G, 3)
    for (let x = 0; x < G; x += 64) {
      c.strokeStyle = '#a0522d'; c.lineWidth = 4
      c.beginPath(); c.moveTo(x, Y / 2); c.bezierCurveTo(x + 16, 8, x + 48, 8, x + 64, Y / 2); c.bezierCurveTo(x + 48, Y - 8, x + 16, Y - 8, x, Y / 2); c.stroke()
      c.fillStyle = '#23426f'; c.beginPath(); c.arc(x + 32, Y / 2, 8, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#c9963a'; c.beginPath(); c.arc(x + 32, Y / 2, 3.5, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#7a2b22'; c.beginPath(); c.arc(x, Y / 2, 5, 0, Math.PI * 2); c.fill()
    }
  })
}

/** Kubbe göbeği: on altı kollu geometrik madalyon; yazı içermez. */
function gobekTuval() {
  return tuval(512, 512, (c, G) => {
    const o = G / 2
    c.fillStyle = '#f2ead9'; c.fillRect(0, 0, G, G)
    c.translate(o, o)
    for (const [r, renk] of [[250, '#8a5a2a'], [240, '#f2ead9'], [205, '#23426f'], [190, '#f2ead9']] as const) { c.fillStyle = renk; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill() }
    for (let i = 0; i < 16; i++) {
      c.rotate(Math.PI / 8)
      c.fillStyle = i % 2 ? '#a0522d' : '#23426f'
      c.beginPath(); c.moveTo(0, -185); c.bezierCurveTo(46, -130, 26, -60, 0, -32); c.bezierCurveTo(-26, -60, -46, -130, 0, -185); c.fill()
      c.fillStyle = '#c9963a'
      c.beginPath(); c.arc(0, -150, 7, 0, Math.PI * 2); c.fill()
    }
    c.fillStyle = '#c9963a'; c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fill()
  })
}

/** Revzen: alçı şebekeli renkli cam, ışık geçirir gibi parlar. */
function revzenTuval() {
  return tuval(256, 384, (c, G, Y) => {
    c.fillStyle = '#f7f0dd'; c.fillRect(0, 0, G, Y)
    const renk = ['#d73a3a', '#2f6fd0', '#f2c03c', '#3ba866', '#f7f0dd']
    for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) {
      c.fillStyle = renk[(i * 3 + j * 2) % renk.length]
      c.beginPath(); c.ellipse((i + 0.5) * G / 4, (j + 0.5) * Y / 7, G / 11, Y / 18, 0, 0, Math.PI * 2); c.fill()
    }
    c.strokeStyle = '#efe7d3'; c.lineWidth = 5
    for (let j = 0; j <= 7; j++) { c.beginPath(); c.moveTo(0, j * Y / 7); c.lineTo(G, j * Y / 7); c.stroke() }
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * G / 4, 0); c.lineTo(i * G / 4, Y); c.stroke() }
  })
}

/** Lokma demir parmaklık ardında aydınlık pencere. */
function demirTuval() {
  return tuval(256, 256, (c, G, Y) => {
    c.fillStyle = '#dfe9ee'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#20201f'
    for (let i = 0; i <= 8; i++) { c.fillRect(i * G / 8 - 2.5, 0, 5, Y); c.fillRect(0, i * Y / 8 - 2.5, G, 5) }
  })
}
function demirKoyuTuval() {
  return tuval(256, 256, (c, G, Y) => {
    c.fillStyle = '#1a1c1d'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#4b5052'
    for (let i = 0; i <= 8; i++) { c.fillRect(i * G / 8 - 4, 0, 8, Y); c.fillRect(0, i * Y / 8 - 4, G, 8) }
  })
}
/** Alçı şebeke: dışarıdan görünen kasnak penceresi. */
function sebekeTuval() {
  return tuval(128, 128, (c, G, Y) => {
    c.fillStyle = '#efe6d2'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#3b3a37'
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((i + 0.5 + (j % 2) * 0.5) * G / 6, (j + 0.5) * Y / 6, 7, 0, Math.PI * 2); c.fill() }
  })
}
/** Alçı şebekeli yarım ay pencere: içeriden ışıklı (fotoğraflardaki alt pencere alınlıkları). */
function sebekeAcikTuval() {
  return tuval(128, 128, (c, G, Y) => {
    c.fillStyle = '#d9d2c0'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#fbfbf6'
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { c.beginPath(); c.arc((i + 0.5 + (j % 2) * 0.5) * G / 8, (j + 0.5) * Y / 8, 5.5, 0, Math.PI * 2); c.fill() }
  })
}
/** Çim ve yaprak: gürültülü yeşil. */
function yesilTuval(tohum: number, taban: string, acik: string, koyu: string) {
  const r = rastgele(tohum)
  return tuval(256, 256, (c, G, Y) => {
    c.fillStyle = taban; c.fillRect(0, 0, G, Y)
    for (let n = 0; n < 2600; n++) {
      c.fillStyle = r() > 0.5 ? acik : koyu
      c.globalAlpha = 0.3
      c.beginPath(); c.ellipse(r() * G, r() * Y, 1 + r() * 5, 1 + r() * 4, r() * 3, 0, Math.PI * 2); c.fill()
    }
    c.globalAlpha = 1
  })
}

export function yildirimMalzemeleri() {
  const u = ulucamiMalzemeleri()
  const hafif = hafifCihaz()
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p })
  const kabart = (el: HTMLCanvasElement, mx: number, my: number, olcek: number) => hafif ? {} : { bumpMap: doku(el, mx, my, false), bumpScale: olcek }
  const kesmeEl = kesmeTuval(11, ['#b9b6ad', '#a9a69e', '#c6c2b8', '#9d9b95', '#bdb4a2', '#cfc9bb'])
  const kesmeAcikEl = kesmeTuval(23, ['#d9d7d0', '#cfcdc7', '#e4e2db', '#c6c7c5', '#dcd8cd'])
  const kesmeIcEl = kesmeTuval(37, ['#b8ad97', '#a79c88', '#c2b7a0', '#8f8c86', '#a5a29b', '#c9bea8'])
  const almasikEl = almasikTuval(41, ['#cdbf9f', '#c2b18f', '#d6c9ac', '#b9a888'])
  const molozEl = molozTuval(53)
  const bant = doku(bantTuval(), 2.4, 0.3)
  const foto = (ad: string) => {
    if (ACIK_YAYIN) return null
    const f = new THREE.TextureLoader().load(`${FOTO}/${ad}.jpg`)
    f.colorSpace = THREE.SRGBColorSpace
    f.anisotropy = 8
    return f
  }
  const parlak = (el: HTMLCanvasElement, c: [number, number, number]) => {
    const t = new THREE.CanvasTexture(el); t.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(...c), side: THREE.DoubleSide })
  }
  const dik = (el: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(el); t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const mihrapFoto = foto('mihrap'), madalyon = foto('madalyon'), levha = foto('levha')
  return {
    ...u,
    kubbe: (u.kubbe.color.set('#a9adb0'), u.kubbe),
    kesme: std({ map: doku(kesmeEl, 4.8, 4.8), ...kabart(kesmeEl, 4.8, 4.8, 0.5), color: '#d4d2cc', roughness: 0.82 }),
    kesmeAcik: std({ map: doku(kesmeAcikEl, 4.8, 4.8), ...kabart(kesmeAcikEl, 4.8, 4.8, 0.3), color: '#dfddd6', roughness: 0.6 }),
    kesmeIc: std({ map: doku(kesmeIcEl, 4.8, 4.8), ...kabart(kesmeIcEl, 4.8, 4.8, 0.5), color: '#b7b1a6', roughness: 0.82 }),
    almasik: std({ map: doku(almasikEl, 2.4, 2.4), ...kabart(almasikEl, 2.4, 2.4, 0.5), roughness: 0.9 }),
    moloz: std({ map: doku(molozEl, 3, 3), ...kabart(molozEl, 3, 3, 0.8), roughness: 0.95 }),
    tuglaKemer: std({ color: '#b5613c', roughness: 0.9 }),
    tasKemer: std({ color: '#e0d6bd', roughness: 0.85 }),
    beyazTas: std({ map: doku(kesmeAcikEl, 4.8, 4.8), color: '#fff6e2', roughness: 0.7 }),
    bordo: std({ color: '#5b2320', roughness: 0.35 }),
    sivaIc: std({ color: '#f4eee0', roughness: 0.9, side: THREE.DoubleSide }),
    haliT: std({ map: doku(haliTuval(61), 2.4, 2.4), roughness: 0.97 }),
    haliK: std({ map: doku(kirmiziTuval(71), 1.5, 1.5), roughness: 0.97 }),
    bant: std({ map: bant, roughness: 0.8, side: THREE.DoubleSide }),
    gobek: std({ map: dik(gobekTuval()), roughness: 0.75, side: THREE.DoubleSide }),
    revzen: parlak(revzenTuval(), [1.5, 1.42, 1.25]),
    sebekeAcik: parlak(sebekeAcikTuval(), [1.25, 1.22, 1.15]),
    demir: parlak(demirTuval(), [1.25, 1.25, 1.2]),
    demirKoyu: std({ map: dik(demirKoyuTuval()), roughness: 0.8, side: THREE.DoubleSide }),
    sebeke: std({ map: dik(sebekeTuval()), roughness: 0.8, side: THREE.DoubleSide }),
    cim: std({ map: doku(yesilTuval(83, '#4d6636', '#5f7b42', '#3a5029'), 6, 6), roughness: 1 }),
    yaprak: std({ map: doku(yesilTuval(91, '#3f6330', '#5f8a3e', '#2a4522'), 5, 5), roughness: 1, flatShading: true }),
    yaprakSari: std({ map: doku(yesilTuval(97, '#7f8f33', '#a9b545', '#5d6e28'), 5, 5), roughness: 1, flatShading: true }),
    kabuk: std({ color: '#4e3d2d', roughness: 1 }),
    mihrapDuvar: mihrapFoto ? std({ map: mihrapFoto, roughness: 0.55 }) : std({ color: '#a98446', roughness: 0.6 }),
    madalyon: madalyon ? std({ map: madalyon, roughness: 0.7 }) : null,
    levha: levha ? std({ map: levha, roughness: 0.6 }) : null,
    ahsapKoyu: std({ color: '#4a2d1a', roughness: 0.6 }),
    ahsapAcik: std({ color: '#8a5d32', roughness: 0.55 }),
    yesilDemir: std({ color: '#1e6b3c', roughness: 0.5, metalness: 0.4 }),
    sanduka: std({ color: '#1f6e45', roughness: 0.8 }),
    sivaKoyu: std({ color: '#c9bea9', roughness: 0.9, side: THREE.DoubleSide }),
  }
}
export type YM = ReturnType<typeof yildirimMalzemeleri>

/** Fotoğraflardaki Bursa kemeri: yanlarda dik inen, tepede hafif sivrilen basık yay. */
export function bursaKemer<P extends THREE.Path>(p: P, cx: number, y0: number, g: number, duz: number, kemerH: number): P {
  const o = g / 2, tepe = y0 + duz + kemerH, omuz = y0 + duz
  p.moveTo(cx - o, y0)
  p.lineTo(cx - o, omuz)
  p.bezierCurveTo(cx - o, omuz + kemerH * 0.72, cx - o * 0.5, tepe - kemerH * 0.02, cx, tepe)
  p.bezierCurveTo(cx + o * 0.5, tepe - kemerH * 0.02, cx + o, omuz + kemerH * 0.72, cx + o, omuz)
  p.lineTo(cx + o, y0)
  p.closePath()
  return p
}

export const dortgenYol = (x0: number, y0: number, x1: number, y1: number) => {
  const p = new THREE.Path()
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath()
  return p
}
const dortgenSekil = (x0: number, y0: number, x1: number, y1: number) => {
  const p = new THREE.Shape()
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath()
  return p
}

/** X doğrultusunda uzanan duvar: delikler (x, y) düzleminde. Kalınlık z0..z1. */
export function duvarX(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, delikler: THREE.Path[] = []) {
  const s = dortgenSekil(x0, y0, x1, y1)
  s.holes.push(...delikler)
  return cikar(s, z1 - z0, z0)
}
/** Z doğrultusunda uzanan duvar: delikler (z, y) düzleminde. Kalınlık x0..x1. */
export function duvarZ(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, delikler: THREE.Path[] = []) {
  const s = dortgenSekil(z0, y0, z1, y1)
  s.holes.push(...delikler)
  return cikar(s, x1 - x0, 0).rotateY(-Math.PI / 2).translate(x1, 0, 0)
}
/** Dikdörtgeni çeviren çerçeve (saçak silmesi): ortası boş kalır, tavanı kapatmaz. */
export function silme(ek: (g: THREE.BufferGeometry, mal: Mal) => void, mal: Mal, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, t: number) {
  ek(kutuK(x0, x1, y0, y1, z0, z0 + t), mal)
  ek(kutuK(x0, x1, y0, y1, z1 - t, z1), mal)
  ek(kutuK(x0, x0 + t, y0, y1, z0 + t, z1 - t), mal)
  ek(kutuK(x1 - t, x1, y0, y1, z0 + t, z1 - t), mal)
}
/** Köşeleri verilen kutu. */
export function kutuK(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  return kutuG(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
}

/** Kemer ağzını çeviren dönüşümlü tuğla ve taş kemer taşları (fotoğraflardaki alacalı kemerler). */
export function almasikKemer(ek: (g: THREE.BufferGeometry, mal: Mal) => void, m: YM, cx: number, y0: number, g: number, duz: number, kemerH: number, kal: number, derinlik: number, z: number, adet = 15) {
  const icYol = kemer(new THREE.Path(), cx, y0, g, duz, kemerH).getPoints(10)
  const disYol = kemer(new THREE.Path(), cx, y0, g + kal * 2, duz + 0.02, kemerH + kal * 0.85).getPoints(10)
  // getPoints: alt-sol, omuz, yay noktaları, omuz, alt-sağ; yalnız yay kısmı kullanılır
  const yay = (y: THREE.Vector2[]) => y.filter((n) => n.y >= y0 + duz - 0.001)
  const a = yay(icYol), b = yay(disYol)
  const n = Math.min(a.length, b.length) - 1
  for (let i = 0; i < Math.max(n, adet); i++) {
    const t0 = i / Math.max(n, adet), t1 = (i + 1) / Math.max(n, adet)
    const al = (l: THREE.Vector2[], t: number) => { const f = t * (l.length - 1), j = Math.min(Math.floor(f), l.length - 2); return l[j].clone().lerp(l[j + 1], f - j) }
    const s = new THREE.Shape([al(a, t0), al(a, t1), al(b, t1), al(b, t0)])
    ek(cikar(s, derinlik, z), i % 2 ? m.tuglaKemer : m.tasKemer)
  }
}

/** Dış kubbe: saçaklı etek, kurşun kaplama ve altın alem. */
export function disKubbe(ek: (kv: Kova, g: THREE.BufferGeometry, mal: Mal) => void, kv: Kova, m: YM, cx: number, cz: number, y0: number, R: number, H: number, alem = 1) {
  const p: [number, number][] = [[R + 0.42, -0.2], [R + 0.36, -0.02], [R + 0.05, 0.1]]
  for (let t = 0; t <= 14; t++) {
    const a = (t / 14) * Math.PI / 2
    p.push([R * Math.pow(Math.cos(a), 0.9), 0.1 + H * Math.pow(Math.sin(a), 1.05)])
  }
  ek(kv, yer(dondurG(p, 40, [1, 1]), cx, y0, cz), m.kubbe)
  const s = alem
  const q: [number, number][] = [[0.14 * s, 0], [0.05 * s, 0.14 * s], [0.13 * s, 0.32 * s], [0.04 * s, 0.5 * s], [0.1 * s, 0.68 * s], [0.02 * s, 0.98 * s], [0, 1.1 * s]]
  ek(kv, yer(dondurG(q, 8), cx, y0 + 0.1 + H - 0.05, cz), m.altin)
}

/** Dış kasnak: çokgen gövde, saçak silmesi ve kemerli pencere yüzleri. */
export function disKasnak(ek: (kv: Kova, g: THREE.BufferGeometry, mal: Mal) => void, kv: Kova, m: YM, cx: number, cz: number, y0: number, h: number, R: number, kenar: number, pencere: number, kilit = 0) {
  const don = kenar === 8 ? Math.PI / 8 : 0
  ek(kv, yer(duzGolge(silindirG(R, R, h, kenar, true).rotateY(don + kilit)), cx, y0 + h / 2, cz), m.almasik)
  ek(kv, yer(duzGolge(silindirG(R + 0.16, R + 0.04, 0.22, kenar, true).rotateY(don + kilit)), cx, y0 + h - 0.05, cz), m.kesmeAcik)
  ek(kv, yer(silindirG(R + 0.01, R + 0.01, 0.02, 4), cx, y0, cz), m.koyu)
  if (!pencere) return
  const yuz = R * Math.cos(Math.PI / kenar) + 0.03
  const pH = Math.min(1.1, h * 0.42)
  for (let n = 0; n < pencere; n++) {
    const a = (n + 0.5) * (Math.PI * 2 / pencere) + kilit
    const py = y0 + (h - pH) * 0.42
    const cer = kemer(new THREE.Shape(), 0, py - 0.1, pH * 0.86, pH * 0.46 + 0.1, pH * 0.56)
    cer.holes.push(kemer(new THREE.Path(), 0, py, pH * 0.6, pH * 0.46, pH * 0.4))
    ek(kv, yer(cikar(cer, 0.08, yuz).rotateY(a), cx, 0, cz), m.tasKemer)
    ek(kv, yer(new THREE.ShapeGeometry(kemer(new THREE.Shape(), 0, py, pH * 0.6, pH * 0.46, pH * 0.4), 6).translate(0, 0, yuz + 0.02).rotateY(a), cx, 0, cz), m.sebeke)
  }
}

/** Dikdörtgen tabandan daire ağza geçen örtü (pandantif / Türk üçgeni yerine sade yüzey). */
export function pandantifG(cx: number, cz: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, R: number) {
  const SEG = 48, SIRA = 6
  const konum: number[] = [], uv: number[] = [], dizin: number[] = []
  for (let s = 0; s <= SIRA; s++) {
    const t = s / SIRA, e = Math.pow(t, 0.72)
    for (let a = 0; a <= SEG; a++) {
      const teta = (a / SEG) * Math.PI * 2, dx = Math.sin(teta), dz = Math.cos(teta)
      const uzak = Math.min(dx > 1e-6 ? (x1 - cx) / dx : dx < -1e-6 ? (x0 - cx) / dx : Infinity, dz > 1e-6 ? (z1 - cz) / dz : dz < -1e-6 ? (z0 - cz) / dz : Infinity)
      const r = THREE.MathUtils.lerp(uzak, R, e)
      konum.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
      uv.push(a / SEG, t)
    }
  }
  for (let s = 0; s < SIRA; s++) for (let a = 0; a < SEG; a++) {
    const p = s * (SEG + 1) + a, q = p + SEG + 1
    dizin.push(p, q, p + 1, p + 1, q, q + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(konum, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(dizin)
  g.computeVertexNormals()
  return g
}

/** Halka avize: iki halka, askılar ve lambalar. */
export function avize(k: Kova, m: YM, x: number, ay: number, z: number, R: number, tepe: number, adet: number) {
  const halka = (r: number, y: number) => k.ekle(new THREE.TorusGeometry(r, 0.035, 6, 32).rotateX(Math.PI / 2).translate(x, y, z), m.bronz)
  const lamba = (r: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const lx = x + Math.sin(a) * r, lz = z + Math.cos(a) * r
      k.ekle(new THREE.SphereGeometry(0.075, 6, 4).translate(lx, y - 0.18, lz), m.lamba)
      for (const ry of [0, Math.PI / 2]) k.ekle(new THREE.PlaneGeometry(0.42, 0.42).rotateY(ry).translate(lx, y - 0.18, lz), m.lambaHale)
    }
  }
  halka(R, ay); lamba(R, ay, adet)
  if (R > 1.4) { halka(R * 0.42, ay - 0.6); lamba(R * 0.42, ay - 0.6, Math.ceil(adet / 2)) }
  k.ekle(new THREE.CylinderGeometry(0.02, 0.02, tepe - ay, 4).translate(x, (tepe + ay) / 2, z), m.koyu)
  for (let n = 0; n < 4; n++) {
    const a = n * Math.PI / 2 + Math.PI / 4
    const ax = x + Math.sin(a) * R, az = z + Math.cos(a) * R, ust = ay + Math.min(3, (tepe - ay) * 0.5)
    const boy = Math.hypot(ax - x, ust - ay, az - z)
    const ip = new THREE.CylinderGeometry(0.012, 0.012, boy, 4)
    ip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x - ax, ust - ay, z - az).normalize()))
    ip.translate((ax + x) / 2, (ay + ust) / 2, (az + z) / 2)
    k.ekle(ip, m.koyu)
  }
}

/** Kama çatı: tepe düzlüğü (deliklerle) ve dört yana inen kurşun etekler. */
export function cati(ek: (g: THREE.BufferGeometry) => void, x0: number, x1: number, z0: number, z1: number, altY: number, ustY: number, sacak: number, ice: number, delikler: { x: number; z: number; r: number }[] = [], kirpik?: (g: THREE.BufferGeometry) => void) {
  const X0 = x0 - sacak, X1 = x1 + sacak, Z0 = z0 - sacak, Z1 = z1 + sacak
  const a0 = x0 + ice, a1 = x1 - ice, b0 = z0 + ice, b1 = z1 - ice
  const ust = dortgenSekil(a0, -b1, a1, -b0)
  for (const d of delikler) ust.holes.push(new THREE.Path().absarc(d.x, -d.z, d.r, 0, Math.PI * 2, true))
  ek(new THREE.ShapeGeometry(ust, 18).rotateX(-Math.PI / 2).translate(0, ustY, 0))
  const yuz = (p: number[][], L: number) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]], 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L, 2, 0, 0, L, 2, 0, 2], 2))
    g.computeVertexNormals()
    ek(g)
  }
  yuz([[X0, altY, Z1], [X1, altY, Z1], [a1, ustY, b1], [a0, ustY, b1]], X1 - X0)
  yuz([[X1, altY, Z0], [X0, altY, Z0], [a0, ustY, b0], [a1, ustY, b0]], X1 - X0)
  yuz([[X1, altY, Z1], [X1, altY, Z0], [a1, ustY, b0], [a1, ustY, b1]], Z1 - Z0)
  yuz([[X0, altY, Z0], [X0, altY, Z1], [a0, ustY, b1], [a0, ustY, b0]], Z1 - Z0)
  if (kirpik) {
    // Saçak altı silmesi
    kirpik(kutuK(X0, X1, altY - 0.28, altY, Z0, Z1 ))
  }
}

/** Dıştan görünen pencere: söve ve lokma demirli karanlık gözle dikdörtgen veya sivri alınlıklı. */
export function disPencere(ek: (g: THREE.BufferGeometry, mal: Mal) => void, m: YM, x: number, y0: number, g: number, h: number, z: number, sivri: boolean, sove: Mal) {
  const k = 0.14
  ek(kutuK(x - g / 2 - k, x + g / 2 + k, y0 - k, y0, z, z + 0.1), sove)
  ek(kutuK(x - g / 2 - k, x + g / 2 + k, y0 + h, y0 + h + k, z, z + 0.1), sove)
  ek(kutuK(x - g / 2 - k, x - g / 2, y0, y0 + h, z, z + 0.1), sove)
  ek(kutuK(x + g / 2, x + g / 2 + k, y0, y0 + h, z, z + 0.1), sove)
  ek(new THREE.PlaneGeometry(g, h).translate(x, y0 + h / 2, z + 0.03), m.demirKoyu)
  if (sivri) {
    const s = kemer(new THREE.Shape(), x, y0 + h + k, g + 0.2, 0.02, g * 0.48)
    s.holes.push(kemer(new THREE.Path(), x, y0 + h + k + 0.03, g - 0.1, 0.02, g * 0.35))
    ek(cikar(s, 0.1, z), m.tuglaKemer)
  }
}

/** Yaprak dolu ağaç: gövde ve üç iri öbek. */
export function agac(ek: (g: THREE.BufferGeometry, mal: Mal) => void, m: YM, x: number, z: number, boy: number, sari: boolean, tohum: number) {
  const r = rastgele(tohum)
  ek(yer(silindirG(boy * 0.03, boy * 0.05, boy * 0.45, 7), x, boy * 0.22, z), m.kabuk)
  for (let i = 0; i < 3; i++) {
    const R = boy * (0.24 + r() * 0.1)
    const g = new THREE.IcosahedronGeometry(R, 2)
    const p = g.attributes.position
    for (let v = 0; v < p.count; v++) {
      const o = 0.86 + 0.28 * Math.abs(Math.sin(p.getX(v) * 3.1 + tohum) * Math.cos(p.getZ(v) * 2.7 + p.getY(v)))
      p.setXYZ(v, p.getX(v) * o, p.getY(v) * o * 0.86, p.getZ(v) * o)
    }
    g.computeVertexNormals()
    ek(g.translate(x + (r() - 0.5) * boy * 0.34, boy * (0.56 + r() * 0.2), z + (r() - 0.5) * boy * 0.34), sari && i !== 1 ? m.yaprakSari : m.yaprak)
  }
}

/** Selvi: fotoğraflardaki koyu, ince ağaç. */
export function selvi(ek: (g: THREE.BufferGeometry, mal: Mal) => void, m: YM, x: number, z: number, boy: number) {
  const p: [number, number][] = [[0.12, 1], [0.9, 1.8], [1.35, boy * 0.24], [1.45, boy * 0.4], [1.15, boy * 0.62], [0.72, boy * 0.82], [0.24, boy * 0.96], [0, boy]]
  const g = dondurG(p, 10)
  ek(yer(g, x, 0, z), m.selvi)
  ek(yer(silindirG(0.15, 0.22, 1.5, 6), x, 0.75, z), m.kabuk)
}
