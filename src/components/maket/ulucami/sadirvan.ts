// Ulu Camii iç şadırvanı. Biçim ve renkler arşiv fotoğraflarına (ERD05081, sadirvan.jpg) bakılarak yorumlanmıştır;
// ölçüler temsilîdir. Dokular kodla üretilir: mermer damarı, leke ve döşeme düzeni fotoğrafın karakterini izler,
// taş taş kopyası değildir. Havuzun on altı köşesi önceki modelden korunmuştur.
import * as THREE from 'three'
import { Kova, duzGolge, yer } from '../ulucamiParca'
import { hafifCihaz, rastgele } from '../ulucamiZemin'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'

type Bolge = [number, number, number, number]

const KOSE = 16
const R_GOVDE = 3.8, R_SU = 3.69, GOVDE_H = 1.06, KAIDE_H = 0.14
const ZEMIN_G = 10.6, ZEMIN_D = 10.55
const TABURE = 14, R_TABURE = 4.3

// --- Atlas düzeni (2048 x 1024 mantıksal piksel): solda su, sağda mermer bölgeleri ---
const bolge = (x: number, y: number, g: number, h: number): Bolge => {
  const p = 6
  return [(x + p) / 2048, 1 - (y + h - p) / 1024, (x + g - p) / 2048, 1 - (y + p) / 1024]
}
const YUZLER = [bolge(1024, 0, 512, 512), bolge(1536, 0, 512, 512), bolge(1024, 512, 512, 512)]
const FISKIYE = bolge(1536, 512, 512, 256)
const KAIDE = bolge(1536, 768, 512, 128)
const FILDISI = bolge(1536, 896, 384, 128)
const TAHTA = bolge(1920, 896, 128, 128)

/** UV'yi verilen atlas bölgesine sığdırır. */
function uvBolge<G extends THREE.BufferGeometry>(g: G, b: Bolge, ters = false) {
  const uv = g.attributes.uv
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
  for (let i = 0; i < uv.count; i++) {
    u0 = Math.min(u0, uv.getX(i)); u1 = Math.max(u1, uv.getX(i))
    v0 = Math.min(v0, uv.getY(i)); v1 = Math.max(v1, uv.getY(i))
  }
  for (let i = 0; i < uv.count; i++) {
    const u = (uv.getX(i) - u0) / (u1 - u0 || 1), v = (uv.getY(i) - v0) / (v1 - v0 || 1)
    uv.setXY(i, b[0] + (ters ? 1 - u : u) * (b[2] - b[0]), b[1] + v * (b[3] - b[1]))
  }
  return g
}

const dondur = (noktalar: [number, number][], parca: number) =>
  new THREE.LatheGeometry(noktalar.map(([r, y]) => new THREE.Vector2(r, y)), parca)

function tuval(g: number, h: number, olcek: number) {
  const el = document.createElement('canvas')
  el.width = g * olcek; el.height = h * olcek
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  c.scale(olcek, olcek)
  return { el, c }
}

function dokuYap(el: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Mermer damarı: seçili alanın içine, verilen açıda uzun paralel şeritler çizer. Tuval önceden kırpılmış olmalı. */
function damarlar(c: CanvasRenderingContext2D, r: () => number, x: number, y: number, boy: number, aci: number, adet: number, koyu: number, yaygi = 1) {
  c.save()
  c.translate(x, y); c.rotate(aci)
  // Bantlar kümelenir: fotoğraftaki taşlarda koyu damarlar aynı şeritte toplanır.
  const kume = (r() - 0.5) * boy * 0.8
  for (let n = 0; n < adet; n++) {
    const kumede = r() < 0.6
    const v = kumede ? kume + (r() - 0.5) * boy * 0.42 * yaygi : (r() - 0.5) * boy * 1.1
    const ince = r() < 0.62
    const h = ince ? 0.6 + r() * 1.8 : 3 + r() * boy * 0.05
    const a = (ince ? 0.2 + r() * 0.42 : 0.05 + r() * 0.13) * koyu
    c.fillStyle = r() < 0.86 ? `rgba(66,64,78,${a})` : `rgba(255,253,250,${a * 1.4})`
    const u0 = -boy * (0.3 + r() * 0.7), u1 = boy * (0.3 + r() * 0.7)
    c.fillRect(u0, v, u1 - u0, h)
  }
  c.restore()
}

function leke(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, renk: string, a: number) {
  c.save()
  c.translate(x, y); c.scale(rx, ry)
  const d = c.createRadialGradient(0, 0, 0.1, 0, 0, 1)
  d.addColorStop(0, `rgba(${renk},${a})`); d.addColorStop(0.65, `rgba(${renk},${a * 0.72})`); d.addColorStop(1, `rgba(${renk},0)`)
  c.fillStyle = d
  c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill()
  c.restore()
}

/** Su ve mermer atlası: tek dokuda, böylece havuz, fıskiye ve tabureler tek malzemede birleşir. */
function atlasDokusu(olcek: number) {
  const { el, c } = tuval(2048, 1024, olcek), r = rastgele(4217)
  const alan = (x: number, y: number, g: number, h: number, ciz: () => void) => {
    c.save(); c.beginPath(); c.rect(x, y, g, h); c.clip(); ciz(); c.restore()
  }

  // Su: sütlü turkuaz; koyu lekeler yansıyan kubbe ve fıskiye gölgesi, açık lekeler yansıyan krem duvarlar.
  alan(0, 0, 1024, 1024, () => {
    const t = c.createRadialGradient(512, 512, 60, 512, 512, 512)
    t.addColorStop(0, '#3f8592'); t.addColorStop(0.4, '#4f97a3'); t.addColorStop(1, '#6aabb0')
    c.fillStyle = t
    c.fillRect(0, 0, 1024, 1024)
    for (let n = 0; n < 34; n++) {
      const a = r() * Math.PI * 2, u = 120 + r() * 380
      const koyu = r() < 0.45
      leke(c, 512 + Math.sin(a) * u, 512 + Math.cos(a) * u, 40 + r() * 110, 40 + r() * 110, koyu ? '50,112,130' : '176,206,204', koyu ? 0.42 : 0.4)
    }
    leke(c, 512, 512, 215, 215, '40,96,112', 0.6)
    // Uzak payelerin yansıması: bakan kişiye doğru uzanır, bu yüzden merkezden ışınsal çizilir
    c.save(); c.translate(512, 512); c.filter = `blur(${9 * olcek}px)`
    for (let n = 0; n < 22; n++) {
      c.save(); c.rotate(r() * Math.PI * 2)
      const en = 16 + r() * 60, koyu = r() < 0.5
      const d = c.createLinearGradient(0, 130, 0, 505)
      const renk = koyu ? '46,100,114' : '206,216,204'
      d.addColorStop(0, `rgba(${renk},0)`); d.addColorStop(0.45, `rgba(${renk},${koyu ? 0.36 : 0.2})`); d.addColorStop(1, `rgba(${renk},${koyu ? 0.16 : 0.08})`)
      c.fillStyle = d
      c.fillRect(-en / 2, 130, en, 375)
      c.restore()
    }
    c.restore()
    // Durgun yüzeydeki ince halkalar
    c.lineWidth = 1.4
    for (let n = 0; n < 90; n++) {
      c.strokeStyle = `rgba(240,248,244,${0.04 + r() * 0.1})`
      const u = 90 + r() * 410, a0 = r() * Math.PI * 2
      c.beginPath(); c.arc(512, 512, u, a0, a0 + 0.2 + r() * 0.9); c.stroke()
    }
  })

  // Havuz yüzleri: gri damarlı beyaz mermer, sarı pas lekeleri, çerçeve diplerinde kir
  const yuz = (x: number, y: number, taban: string, ciz: () => void) => alan(x, y, 512, 512, () => {
    c.fillStyle = taban
    c.fillRect(x, y, 512, 512)
    ciz()
    const a = c.createLinearGradient(0, y, 0, y + 512)
    a.addColorStop(0, 'rgba(70,60,50,0.26)'); a.addColorStop(0.1, 'rgba(70,60,50,0)'); a.addColorStop(0.82, 'rgba(70,60,50,0)'); a.addColorStop(1, 'rgba(70,55,40,0.3)')
    c.fillStyle = a
    c.fillRect(x, y, 512, 512)
  })
  yuz(1024, 0, '#d8d4d4', () => {
    damarlar(c, r, 1280, 256, 760, 1.05, 58, 1.1, 0.7)
    leke(c, 1400, 380, 150, 220, '112,108,120', 0.3)
    leke(c, 1120, 110, 50, 90, '208,160,92', 0.3)
  })
  yuz(1536, 0, '#e4ded6', () => {
    damarlar(c, r, 1792, 256, 760, 2.0, 30, 0.42)
    leke(c, 1680, 130, 46, 42, '214,160,60', 0.62)
    leke(c, 1690, 330, 62, 50, '206,150,48', 0.66)
    leke(c, 1930, 90, 34, 60, '216,172,110', 0.38)
  })
  yuz(1024, 512, '#c6c2c6', () => {
    damarlar(c, r, 1280, 768, 760, 0.04, 62, 0.95, 1.1)
    leke(c, 1400, 860, 170, 80, '98,96,106', 0.34)
    leke(c, 1120, 620, 110, 200, '120,116,126', 0.32)
  })

  // Fıskiye: yatay kuşaklı gri beyaz mermer
  alan(1536, 512, 512, 256, () => {
    c.fillStyle = '#d6d5d8'
    c.fillRect(1536, 512, 512, 256)
    damarlar(c, r, 1792, 640, 620, 0.02, 90, 1.6, 2)
  })

  // Kaide: kirlenmiş kaba taş, kahve ve toprak tonlarında
  alan(1536, 768, 512, 128, () => {
    c.fillStyle = '#7c7366'
    c.fillRect(1536, 768, 512, 128)
    const renkler = ['#5f574c', '#a39a88', '#4f483e', '#bcb3a0', '#6e6455', '#8d7654']
    for (let n = 0; n < 700; n++) {
      c.fillStyle = renkler[Math.floor(r() * renkler.length)]
      c.globalAlpha = 0.25 + r() * 0.45
      c.fillRect(1536 + r() * 512, 768 + r() * 128, 2 + r() * 18, 1.5 + r() * 9)
    }
    c.globalAlpha = 1
  })

  // Fildişi mermer: çerçeve, kabartma, ağız ve tabure gövdesi
  alan(1536, 896, 384, 128, () => {
    c.fillStyle = '#ebe9e6'
    c.fillRect(1536, 896, 384, 128)
    for (let n = 0; n < 16; n++) leke(c, 1536 + r() * 384, 896 + r() * 128, 14 + r() * 42, 10 + r() * 24, r() < 0.25 ? '206,164,104' : '176,170,160', 0.16)
  })

  // Tabure tablası: turuncuya çalan cilalı ceviz
  alan(1920, 896, 128, 128, () => {
    c.fillStyle = '#9e5d2a'
    c.fillRect(1920, 896, 128, 128)
    for (let n = 0; n < 46; n++) {
      c.fillStyle = r() < 0.7 ? `rgba(84,42,14,${0.04 + r() * 0.1})` : `rgba(226,160,90,${0.04 + r() * 0.08})`
      c.fillRect(1920, 896 + r() * 128, 128, 0.6 + r() * 2.6)
    }
  })
  return dokuYap(el)
}

/** Havuz döşemesi: merkezden ışınsal halkalara dizilmiş düzensiz mermer plakalar. */
function zeminDokusu(olcek: number) {
  const { el, c } = tuval(2048, 2048, olcek), r = rastgele(90211)
  const pm = 2048 / ZEMIN_G, m = 1024
  const nokta = (a: number, u: number): [number, number] => [m + Math.sin(a) * u * pm, m + Math.cos(a) * u * pm]
  c.fillStyle = '#6d6a68'
  c.fillRect(0, 0, 2048, 2048)
  const tonlar = ['#e2e0dd', '#d6d5d5', '#c4c3c7', '#b1b0b6', '#d9d0c2', '#c8bdb0', '#9e9da4', '#85848c']

  const plaka = (kose: [number, number][], ton: string, damarAci: number, koyu: number) => {
    c.save()
    c.beginPath()
    kose.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
    c.closePath()
    c.save(); c.clip()
    c.fillStyle = ton
    c.fillRect(0, 0, 2048, 2048)
    const ox = kose.reduce((t, p) => t + p[0], 0) / kose.length, oy = kose.reduce((t, p) => t + p[1], 0) / kose.length
    damarlar(c, r, ox, oy, 460, damarAci, 46, koyu * 0.62, 0.7)
    c.restore()
    c.lineWidth = 3.4; c.strokeStyle = 'rgba(46,42,40,0.82)'; c.stroke()
    c.restore()
  }

  // İç halka: havuzu çeviren dar açık taşlar
  const parca = (Math.PI * 2) / KOSE
  for (let n = 0; n < KOSE; n++) {
    const a0 = n * parca, a1 = a0 + parca
    plaka([nokta(a0, 3.8), nokta(a1, 3.8), nokta(a1, 4.42), nokta(a0, 4.42)], tonlar[Math.floor(r() * 3)], a0 + parca / 2 + (r() < 0.5 ? Math.PI / 2 : 0), 0.55)
  }
  // Dış halkalar: geniş, açıları düzensiz plakalar
  const halkalar: [number, number, number][] = [[4.42, 5.95, 0.3], [5.95, 7.7, 1.1]]
  for (const [ic, dis, kayma] of halkalar) {
    let a = kayma
    const son = kayma + Math.PI * 2
    let onceki = 0
    while (a < son - 0.02) {
      const adim = Math.min(0.32 + r() * 0.5, son - a), b = a + adim
      const sapma = (r() - 0.5) * 0.34
      const koseler: [number, number][] = [nokta(a + onceki, ic), nokta(b + sapma, ic), nokta(b - sapma * 0.5, dis), nokta(a + onceki * 0.5, dis)]
      const ton = tonlar[Math.floor(r() * tonlar.length)]
      plaka(koseler, ton, (a + b) / 2 + (r() < 0.5 ? 0 : Math.PI / 2) + (r() - 0.5) * 0.6, 0.7 + r() * 0.6)
      onceki = sapma
      a = b
    }
  }
  // Fotoğraftaki koyu benekli taş ve iki yandaki gider yarıkları
  const [bx, by] = nokta(Math.PI, 4.82)
  c.fillStyle = '#4a4a4c'
  c.fillRect(bx - 66, by - 48, 132, 96)
  for (let n = 0; n < 1100; n++) {
    c.fillStyle = r() < 0.5 ? 'rgba(180,178,176,0.5)' : 'rgba(22,22,24,0.6)'
    c.fillRect(bx - 66 + r() * 132, by - 48 + r() * 96, 1 + r() * 3.4, 1 + r() * 3.4)
  }
  c.lineWidth = 2.6; c.strokeStyle = 'rgba(40,36,34,0.8)'; c.strokeRect(bx - 66, by - 48, 132, 96)
  for (const s of [-1, 1]) {
    const [x0, y0] = nokta(Math.PI / 2 * s + 0.42, 4.24), [x1, y1] = nokta(Math.PI / 2 * s - 0.42, 4.24)
    c.lineCap = 'round'
    c.lineWidth = 9; c.strokeStyle = '#2f2c2a'
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
    c.lineCap = 'butt'
  }

  // Temas gölgeleri: havuz dibi ve tabure ayakları
  const ao = c.createRadialGradient(m, m, 3.72 * pm, m, m, 4.45 * pm)
  ao.addColorStop(0, 'rgba(34,28,24,0.62)'); ao.addColorStop(0.35, 'rgba(34,28,24,0.2)'); ao.addColorStop(1, 'rgba(34,28,24,0)')
  c.fillStyle = ao
  c.fillRect(0, 0, 2048, 2048)
  for (let n = 0; n < TABURE; n++) {
    const a = (n / TABURE) * Math.PI * 2, x = m + Math.sin(a) * R_TABURE * pm, y = m + Math.cos(a) * R_TABURE * pm
    leke(c, x, y, 0.34 * pm, 0.34 * pm, '30,25,22', 0.55)
  }
  // Köşelere doğru hafif kararma: payelerin arasında kalan ışık farkı
  const k = c.createRadialGradient(m, m, 4.4 * pm, m, m, 7.6 * pm)
  k.addColorStop(0, 'rgba(50,42,34,0)'); k.addColorStop(1, 'rgba(50,42,34,0.3)')
  c.fillStyle = k
  c.fillRect(0, 0, 2048, 2048)
  return dokuYap(el)
}

/** Su yansımayı boyalı dokudan alır: ışık hesabı yok, yalnız yatık bakışta krem duvarları yansıtan bir karışım. */
function suMalzemesi(map: THREE.Texture) {
  const su = new THREE.MeshBasicMaterial({ map, color: new THREE.Color(0.8, 0.86, 0.8) })
  su.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSuBakis;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSuBakis = cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSuBakis;')
      .replace('#include <map_fragment>', `#include <map_fragment>
      { float f = 1.0 - clamp(normalize(vSuBakis).y, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.62, 0.56), f * f * f * 0.42); }`)
  }
  su.customProgramCacheKey = () => 'sadirvan-su'
  return su
}

export interface SadirvanOlcu { sx: number; sz: number; zemin: number; gokY: number }

/** Şadırvanın tamamını `k` kovasına ekler. Çarpışma dairesi (r 3.75) ve korkuluk kutuları ulucamiIc'te aynı kalır. */
export function sadirvan(m: UlucamiMalzemeleri, k: Kova, { sx, sz, zemin, gokY }: SadirvanOlcu) {
  const olcek = hafifCihaz() ? 0.5 : 1
  const atlas = atlasDokusu(olcek), zeminDoku = zeminDokusu(olcek)
  // Ortam haritasındaki lamba küresi havuzun üstüne denk gelir: mermer düşük yansımalı kalmalı, yoksa beyaz parlar.
  const tas = new THREE.MeshStandardMaterial({ map: atlas, color: '#dcdde2', roughness: 0.46, metalness: 0, envMapIntensity: 0.5 })
  const doseme = new THREE.MeshStandardMaterial({ map: zeminDoku, color: '#d2d3d9', roughness: 0.38, metalness: 0, envMapIntensity: 0.55 })
  const su = suMalzemesi(atlas)

  const taban = zemin + 0.1, yGovde = taban + KAIDE_H, yUst = yGovde + GOVDE_H, ySu = yUst + 0.005

  // --- Döşeme ---
  const dg = new THREE.BoxGeometry(ZEMIN_G, 0.1, ZEMIN_D)
  for (let i = 0, p = dg.attributes.position, uv = dg.attributes.uv; i < p.count; i++) uv.setXY(i, p.getX(i) / ZEMIN_G + 0.5, 0.5 - p.getZ(i) / ZEMIN_D)
  k.ekle(yer(dg, sx, zemin + 0.05, sz), doseme)

  // --- Kaide ve ağız: on altı köşeli, düz gölgeli ---
  k.ekle(yer(uvBolge(duzGolge(dondur([[3.97, 0], [3.95, 0.09], [3.86, KAIDE_H + 0.01], [3.8, KAIDE_H + 0.01]], KOSE)), KAIDE), sx, taban, sz), tas)
  k.ekle(yer(uvBolge(duzGolge(dondur([
    [3.82, 0], [3.835, 0.02], [3.815, 0.045], [3.8, 0.06], [3.8, 0.085], [3.77, 0.115], [3.72, 0.115], [3.695, 0.09], [3.68, 0.0], [3.68, -0.3],
  ], KOSE)), FILDISI), sx, yUst - 0.05, sz), tas)

  // --- Su ---
  const sg = new THREE.CylinderGeometry(R_SU, R_SU, 0.02, KOSE)
  for (let i = 0, p = sg.attributes.position, uv = sg.attributes.uv; i < p.count; i++) uv.setXY(i, 0.25 + (p.getX(i) / R_SU) * 0.247, 0.5 - (p.getZ(i) / R_SU) * 0.494)
  k.ekle(yer(sg, sx, ySu, sz), su)

  // --- Bir yüzün süslemesi yerel koordinatta kurulur, sonra on altı yüze döndürülür ---
  const apotem = R_GOVDE * Math.cos(Math.PI / KOSE), kiris = 2 * R_GOVDE * Math.sin(Math.PI / KOSE), H = GOVDE_H
  const yY = (t: number) => yGovde + t * H
  const yaprak = new THREE.SphereGeometry(1, 6, 4)
  const kivrim = (s: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.075, yY(0.67), 0), new THREE.Vector3(s * 0.25, yY(0.66), 0), new THREE.Vector3(s * 0.31, yY(0.55), 0),
    new THREE.Vector3(s * 0.21, yY(0.37), 0), new THREE.Vector3(s * 0.2, yY(0.2), 0), new THREE.Vector3(s * 0.3, yY(0.1), 0),
    new THREE.Vector3(s * 0.36, yY(0.15), 0), new THREE.Vector3(s * 0.31, yY(0.2), 0),
  ]), 16, 0.017, 4, false)
  const kosePayesi = dondur([[0.062, 0], [0.062, 0.05], [0.038, 0.1], [0.038, H - 0.14], [0.054, H - 0.1], [0.04, H - 0.07], [0.06, H - 0.03], [0, H]], 6)

  for (let n = 0; n < KOSE; n++) {
    const a = (n + 0.5) * (Math.PI * 2) / KOSE
    const ekle = (g: THREE.BufferGeometry, mal: THREE.Material, z = apotem) => k.ekle(yer(g.translate(0, 0, z), sx, 0, sz, a), mal)

    // Yüz plakası
    const pl = uvBolge(new THREE.PlaneGeometry(kiris, H), YUZLER[n % 3], n % 2 === 1)
    ekle(pl.translate(0, yGovde + H / 2, 0), tas)

    // Çerçeve: üstte kalın, altta ve yanlarda ince kabartma
    const cubuk = (g: number, h: number, x: number, y: number, d = 0.016) => ekle(uvBolge(new THREE.BoxGeometry(g, h, d), FILDISI).translate(x, y, 0), tas)
    cubuk(kiris - 0.1, 0.035, 0, yY(0.915))
    cubuk(kiris - 0.1, 0.016, 0, yY(0.875), 0.01)
    cubuk(kiris - 0.1, 0.03, 0, yY(0.06))
    for (const s of [-1, 1]) cubuk(0.02, H * 0.86, s * (kiris / 2 - 0.085), yY(0.487), 0.01)

    // Palmet: dokuz yaprak, ortadaki en uzun
    for (let y = -4; y <= 4; y++) {
      const t = y / 4, aci = t * 1.2, boy = 0.17 - 0.06 * t * t, en = 0.03
      const g = yaprak.clone().scale(en, boy, 0.016).translate(0, boy, 0).rotateZ(-aci).translate(0, yY(0.67), 0)
      ekle(uvBolge(g, FILDISI), tas, apotem + 0.016)
    }
    ekle(uvBolge(yaprak.clone().scale(0.06, 0.038, 0.02).translate(0, yY(0.665), 0), FILDISI), tas, apotem + 0.016)
    // Musluğu çeviren iki S kıvrımı
    for (const s of [-1, 1]) ekle(uvBolge(kivrim(s), FILDISI), tas, apotem + 0.012)

    // Bronz musluk: gövde, aşağı dönen ağız, tepede düğme
    const yM = yY(0.53)
    ekle(new THREE.CylinderGeometry(0.019, 0.026, 0.1, 7).rotateX(Math.PI / 2).translate(0, yM, 0.05), m.bronz)
    ekle(new THREE.CylinderGeometry(0.018, 0.021, 0.08, 7).translate(0, yM - 0.035, 0.092), m.bronz)
    ekle(new THREE.CylinderGeometry(0.009, 0.012, 0.04, 6).translate(0, yM + 0.035, 0.05), m.bronz)
    ekle(new THREE.BoxGeometry(0.055, 0.012, 0.016).translate(0, yM + 0.058, 0.05), m.bronz)

    // Köşe payesi ve ağız üstündeki bronz boru (fotoğrafta iç kenarda görünür)
    const ka = n * (Math.PI * 2) / KOSE
    k.ekle(yer(uvBolge(kosePayesi.clone(), FILDISI).translate(0, yGovde, R_GOVDE + 0.012), sx, 0, sz, ka), tas)
    if (n % 2 === 0) k.ekle(yer(new THREE.CylinderGeometry(0.011, 0.011, 0.17, 6).rotateZ(Math.PI / 2).translate(0, yUst + 0.09, 3.71), sx, 0, sz, a), m.bronz)
  }
  yaprak.dispose(); kosePayesi.dispose()

  // --- Fıskiye: kuşaklı ayak, üç kademeli tas, tepede kozalak ---
  const f0 = ySu - 0.02
  const ayak: [number, number][] = [[0.46, 0], [0.42, 0.1], [0.34, 0.14], [0.31, 0.3], [0.36, 0.42], [0.34, 0.5]]
  k.ekle(yer(uvBolge(dondur(ayak, 24), FISKIYE), sx, f0, sz), tas)
  const tas1: [number, number][] = [[0.34, 0.5], [0.52, 0.58], [0.86, 0.68], [1.0, 0.8], [1.03, 0.9], [1.0, 0.96], [0.93, 0.95], [0.88, 0.84], [0.42, 0.8], [0.24, 0.8]]
  k.ekle(yer(uvBolge(dondur(tas1, 32), FISKIYE), sx, f0, sz), tas)
  const orta: [number, number][] = [[0.3, 0.8], [0.19, 0.95], [0.16, 1.2], [0.24, 1.36], [0.27, 1.42], [0.42, 1.48], [0.6, 1.62], [0.66, 1.72], [0.62, 1.76], [0.56, 1.7], [0.2, 1.66]]
  k.ekle(yer(uvBolge(dondur(orta, 28), FISKIYE), sx, f0, sz), tas)
  const ust: [number, number][] = [[0.15, 1.66], [0.1, 1.82], [0.09, 2.02], [0.2, 2.1], [0.34, 2.2], [0.38, 2.27], [0.34, 2.3], [0.26, 2.26], [0.09, 2.27], [0.075, 2.36], [0.12, 2.46], [0.14, 2.56], [0.09, 2.68], [0.02, 2.76], [0, 2.78]]
  k.ekle(yer(uvBolge(dondur(ust, 18), FILDISI), sx, f0, sz), tas)
  // Taşlardaki bronz lüleler: alttaki ve ortadaki tasın dış yüzünde, dirsekli
  const luleler = (adet: number, r: number, y: number, o: number) => {
    for (let n = 0; n < adet; n++) {
      const a = ((n + o) / adet) * Math.PI * 2
      k.ekle(yer(new THREE.CylinderGeometry(0.03, 0.035, 0.13, 6).rotateX(Math.PI / 2).translate(0, f0 + y, r + 0.05), sx, 0, sz, a), m.bronz)
      k.ekle(yer(new THREE.CylinderGeometry(0.024, 0.03, 0.09, 6).translate(0, f0 + y - 0.05, r + 0.1), sx, 0, sz, a), m.bronz)
    }
  }
  luleler(8, 0.98, 0.84, 0)
  luleler(8, 0.62, 1.67, 0.5)

  // --- Tabureler: bel veren mermer gövde, cilalı ahşap tabla ---
  const tabureGovde = dondur([[0.17, 0], [0.18, 0.025], [0.15, 0.05], [0.125, 0.07], [0.115, 0.2], [0.14, 0.34], [0.175, 0.44], [0.17, 0.47], [0, 0.47]], 12)
  const tabureTabla = dondur([[0, 0], [0.2, 0], [0.225, 0.016], [0.228, 0.036], [0.21, 0.056], [0, 0.058]], 14)
  uvBolge(tabureGovde, FILDISI)
  for (let i = 0, p = tabureTabla.attributes.position, uv = tabureTabla.attributes.uv; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  uvBolge(tabureTabla, TAHTA)
  for (let n = 0; n < TABURE; n++) {
    const a = (n / TABURE) * Math.PI * 2, x = sx + Math.sin(a) * R_TABURE, z = sz + Math.cos(a) * R_TABURE
    k.ekle(yer(tabureGovde.clone(), x, taban, z, n * 1.3), tas)
    k.ekle(yer(tabureTabla.clone(), x, taban + 0.47, z, n * 1.3), tas)
  }
  tabureGovde.dispose(); tabureTabla.dispose()

  // --- Korkuluk: koyu ahşap, kesme dilimli pano, kalın küpeşte ---
  const dilim = new THREE.Shape()
  const yarim: [number, number][] = [[0.026, 0], [0.05, 0.07], [0.022, 0.14], [0.05, 0.25], [0.022, 0.36], [0.05, 0.43], [0.026, 0.5]]
  yarim.forEach(([x, y], i) => (i ? dilim.lineTo(x, y) : dilim.moveTo(x, y)))
  ;[...yarim].reverse().forEach(([x, y]) => dilim.lineTo(-x, y))
  dilim.closePath()
  const dilimG = new THREE.ExtrudeGeometry(dilim, { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015)
  const gobek = new THREE.SphereGeometry(0.03, 4, 3).scale(1, 1, 0.75)
  const y0 = taban
  const parcaEkle = (g: THREE.BufferGeometry, x: number, y: number, z: number, xBoyunca: boolean, mal: THREE.Material) =>
    k.ekle(yer(g, x, y, z, xBoyunca ? 0 : Math.PI / 2), mal)
  const korkuluk = (x0: number, z0: number, x1: number, z1: number) => {
    const boy = Math.hypot(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, xB = Math.abs(x1 - x0) > Math.abs(z1 - z0)
    parcaEkle(new THREE.BoxGeometry(boy, 0.07, 0.13), mx, y0 + 0.035, mz, xB, m.ahsap)
    parcaEkle(new THREE.BoxGeometry(boy, 0.04, 0.09), mx, y0 + 0.09, mz, xB, m.ahsap)
    parcaEkle(new THREE.BoxGeometry(boy, 0.04, 0.09), mx, y0 + 0.63, mz, xB, m.ahsap)
    parcaEkle(new THREE.BoxGeometry(boy, 0.03, 0.13), mx, y0 + 0.665, mz, xB, m.ahsap)
    parcaEkle(new THREE.BoxGeometry(boy, 0.05, 0.17), mx, y0 + 0.705, mz, xB, m.ceviz)
    const adet = Math.round(boy / 0.15)
    for (let n = 0; n < adet; n++) {
      const t = (n + 0.5) / adet - 0.5
      const x = mx + (xB ? t * boy : 0), z = mz + (xB ? 0 : t * boy)
      parcaEkle(dilimG.clone(), x, y0 + 0.11, z, xB, m.ahsap)
      parcaEkle(gobek.clone(), x, y0 + 0.36, z, xB, m.ceviz)
    }
  }
  for (const s of [-1, 1]) for (const c of [-1, 1]) {
    korkuluk(sx + s * 5.15, sz + c * 1.2, sx + s * 5.15, sz + c * 5.24)
    korkuluk(sx + s * 1.05, sz + c * 5.15, sx + s * 5.06, sz + c * 5.15)
  }
  dilimG.dispose(); gobek.dispose()

  // --- Fener: fotoğraftaki pirinç gemi feneri; yan çemberleri, nervürlü camı ve sivri tabanıyla ---
  const fY = 4.95
  k.ekle(yer(new THREE.CylinderGeometry(0.013, 0.013, gokY - fY - 1.5, 5), sx, (gokY + fY + 1.5) / 2, sz), m.koyu)
  // Alt tabla ve sivri uç
  k.ekle(yer(dondur([[0, -0.14], [0.05, -0.08], [0.24, 0], [0.34, 0.04], [0.35, 0.08], [0.3, 0.1]], 12), sx, fY, sz), m.altin)
  // Soluk cam gövde ve önünde nervürler (lamba malzemesi parlayıp fıskiyeyi yıkıyordu)
  k.ekle(yer(uvBolge(new THREE.CylinderGeometry(0.25, 0.25, 0.46, 12), FILDISI), sx, fY + 0.33, sz), tas)
  for (const y of [0.13, 0.25, 0.37, 0.49]) k.ekle(yer(new THREE.TorusGeometry(0.27, 0.012, 4, 14).rotateX(Math.PI / 2), sx, fY + y, sz), m.altinKoyu)
  // Üst tabla, kubbe, baca ve halka
  k.ekle(yer(dondur([[0.3, 0.55], [0.35, 0.58], [0.34, 0.63], [0.3, 0.68], [0.25, 0.8], [0.15, 0.9], [0.1, 0.94], [0.1, 1.08], [0.14, 1.11], [0.13, 1.15], [0, 1.2]], 12), sx, fY, sz), m.altin)
  k.ekle(yer(new THREE.TorusGeometry(0.06, 0.012, 4, 10), sx, fY + 1.25, sz), m.altinKoyu)
  // Dört dikme ve iki yan çember
  for (let n = 0; n < 4; n++) {
    const a = (n + 0.5) * Math.PI / 2
    k.ekle(yer(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 5).translate(0, fY + 0.36, 0.33), sx, 0, sz, a), m.altinKoyu)
    k.ekle(yer(new THREE.BoxGeometry(0.1, 0.018, 0.018).rotateY(Math.PI / 2).translate(0, fY + 0.06, 0.38), sx, 0, sz, a), m.altinKoyu)
  }
  for (const a of [0, Math.PI / 2]) k.ekle(yer(new THREE.TorusGeometry(0.42, 0.011, 4, 14, Math.PI).translate(0, fY + 0.72, 0), sx, 0, sz, a), m.altinKoyu)
}
