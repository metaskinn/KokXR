// Ulu Camii iç zemini: halı, şadırvan mermeri, kapı önü taşları ve süpürgelik. Dokular kodla üretilir.
// Biçim arşiv fotoğraflarına bakılarak yorumlanmıştır: tek şeritli sarmal saf bandı, kıbleye dönük üç loblu
// motif, solgun ve koyu lekeler; havuz çevresinde yelpaze gibi açılan damarlı levhalar. Desen birebir kopya
// değildir; ölçüler (saf aralığı 2,2 m, bant 30 cm, motif 20 cm) fotoğraftan kestirilmiştir, ölçüm değildir.
// Süpürgelik ve kapı önü taşlarının ölçüleri temsilîdir.
//
// Geniş ölçekli ton (temas gölgesi, ışık havuzu, solma) köşe renginde durur: Quest'te gölgelendirici
// gürültüsü ve normal harita yoktur; net kenarlı lekeler yalnız masaüstünde piksel başına hesaplanır.
import * as THREE from 'three'
import { DUVAR, GOZ_X, GOZ_Z, Kova, SADIRVAN_SATIR, SADIRVAN_SUTUN, YX, YZ, kutuG, px, pz, yer } from '../ulucamiParca'
import { gurultuUret, hafifCihaz, rastgele, tekrarli, tuval, yumusak } from '../ulucamiZemin'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'

const ZEMIN = 0.7
const sx = px(SADIRVAN_SUTUN + 0.5), sz = pz(SADIRVAN_SATIR + 0.5)
const KAPI_Z = sz
/** Mermer alanın kenarı: korkulukların ayağı bu alana basar, tabureler üst yüzdedir. */
const MERMER_G = GOZ_X - 3.2, MERMER_D = GOZ_Z - 3.2, MERMER_UST = ZEMIN + 0.1
const HALI_TEKRAR = 4.4
const MERMER_METRE = 10.6

const karisim = (a: number, b: number, t: number) => a + (b - a) * t

/** Halı motifi: ortada sivri yaprak, iki yana kıvrık kanat, altta sap. Ucu tuvalde yukarı, yani kıbleye bakar. */
function haliMotifi(c: CanvasRenderingContext2D, x: number, y: number, o: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(o, o)
  c.beginPath()
  c.moveTo(0, -1)
  c.bezierCurveTo(0.3, -0.7, 0.4, -0.38, 0.15, -0.1)
  c.bezierCurveTo(0.32, -0.2, 0.52, -0.3, 0.76, -0.24)
  c.bezierCurveTo(0.62, -0.12, 0.62, 0.02, 0.5, 0.12)
  c.lineTo(0.56, 0.28)
  c.bezierCurveTo(0.38, 0.3, 0.24, 0.22, 0.1, 0.14)
  c.lineTo(0.07, 0.42)
  c.lineTo(0.26, 0.54); c.lineTo(0.06, 0.56)
  c.lineTo(0, 0.86)
  c.lineTo(-0.06, 0.56); c.lineTo(-0.26, 0.54)
  c.lineTo(-0.07, 0.42)
  c.lineTo(-0.1, 0.14)
  c.bezierCurveTo(-0.24, 0.22, -0.38, 0.3, -0.56, 0.28)
  c.lineTo(-0.5, 0.12)
  c.bezierCurveTo(-0.62, 0.02, -0.62, -0.12, -0.76, -0.24)
  c.bezierCurveTo(-0.52, -0.3, -0.32, -0.2, -0.15, -0.1)
  c.bezierCurveTo(-0.4, -0.38, -0.3, -0.7, 0, -1)
  c.closePath(); c.fill(); c.restore()
}

function yapracik(c: CanvasRenderingContext2D, x: number, y: number, b: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a)
  c.beginPath(); c.moveTo(0, -b)
  c.quadraticCurveTo(b * 0.55, -b * 0.1, 0, b)
  c.quadraticCurveTo(-b * 0.55, -b * 0.1, 0, -b)
  c.fill(); c.restore()
}

/** Saf bandı: birbirine dolanan iki dal halkalar kurar, halkaların içinde sarmal filiz ve yaprak vardır. */
function safBandi(c: CanvasRenderingContext2D, y: number, B: number, s: number) {
  const adet = 8, L = B / adet, yuk = 0.128 * s
  const dal = (genlik: number, kayma: number, kalin: number) => {
    c.lineWidth = kalin * s
    c.beginPath()
    for (let x = -L, ilk = true; x <= B + L; x += L / 32, ilk = false) {
      // Sinüsün tepesi düzleştirilir: yaprak gibi sivri değil, yuvarlak halka olur.
      const dalga = Math.sin((2 * Math.PI * (x + kayma)) / L)
      const yy = y + genlik * Math.sign(dalga) * Math.pow(Math.abs(dalga), 0.62)
      if (ilk) c.moveTo(x, yy)
      else c.lineTo(x, yy)
    }
    c.stroke()
  }
  c.lineCap = 'round'
  dal(yuk, 0, 0.026); dal(-yuk, 0, 0.026)
  for (let i = -1; i <= adet * 2; i++) {
    const cx = ((i + 0.5) * L) / 2, yon = i & 1 ? 1 : -1
    // Halkanın içinde bir dönüşlük kalın sarmal, ucunda yaprak
    c.lineWidth = 0.019 * s
    c.beginPath()
    let ux = 0, uy = 0
    for (let t = 0; t <= 1; t += 0.05) {
      const aci = yon * (t * 5 - 1.6), r = yuk * 0.76 * (1 - t * 0.74)
      ux = cx + Math.cos(aci) * r; uy = y + Math.sin(aci) * r * yon
      if (t === 0) c.moveTo(ux, uy)
      else c.lineTo(ux, uy)
    }
    c.stroke()
    yapracik(c, ux, uy, 0.03 * s, yon * 2.2)
    yapracik(c, cx - yon * yuk * 0.5, y + yon * yuk * 0.5, 0.036 * s, yon * 0.8)
    yapracik(c, cx + yon * yuk * 0.56, y - yon * yuk * 0.4, 0.032 * s, -yon * 1.1)
    // Halkaları birbirine bağlayan S kıvrımı: dalın düğümünden bir sonraki halkaya uzanır.
    const nx = cx + (L / 4), ny = y
    c.lineWidth = 0.012 * s
    c.beginPath(); c.moveTo(nx - yuk * 0.5, ny - yon * yuk * 0.62)
    c.bezierCurveTo(nx - yuk * 0.1, ny - yon * yuk * 0.1, nx + yuk * 0.1, ny + yon * yuk * 0.1, nx + yuk * 0.5, ny + yon * yuk * 0.62)
    c.stroke()
    yapracik(c, nx, ny, 0.024 * s, yon * 0.7)
    // Dalın dış kıvrımından taşan yapraklar
    for (const k of [-1, -0.2, 0.6]) yapracik(c, cx + k * yuk * 0.62, y + yon * yuk * 1.12, 0.028 * s, k * 1.3)
  }
}

/**
 * Halı: açık zemin üzerine iki saf bandı ve şaşırtmalı motif sıraları, hav tanesi ve fırça izi. Doku nötrdür;
 * köşe rengi ve malzeme rengi onu gül kurusu ya da zeytin yeşili yapar. Tekrar: 4,4 m (iki saf).
 */
function haliDokusu(hafif: boolean) {
  const B = hafif ? 1024 : 2048, s = B / HALI_TEKRAR
  const { el, c } = tuval(B)
  const r = rastgele(211)
  c.fillStyle = '#fbf8f4'
  c.fillRect(0, 0, B, B)
  const MOTIF = '#aa9156'
  c.fillStyle = MOTIF; c.strokeStyle = MOTIF
  const safAra = B / 2
  for (const y of [safAra * 0.5, safAra * 1.5]) safBandi(c, y, B, s)
  // Her saf aralığında üç sıra motif; sıralar şaşırtmalıdır.
  const sutun = 6, sira = 3
  for (let k = 0; k < 2; k++) for (let j = 0; j < sira; j++) {
    const y = safAra * (k + 0.5) + (safAra * (j + 1)) / (sira + 1)
    for (let i = 0; i < sutun; i++) {
      const x = ((i + (j % 2) * 0.5 + 0.25) * B) / sutun
      const a = (r() - 0.5) * 0.14
      for (const oy of y > B - 0.2 * s ? [y, y - B] : [y]) haliMotifi(c, x, oy, 0.1 * s, a)
    }
  }
  // Ek yeri: bandın bir kenarında ince, koyuca bir dikiş çizgisi.
  c.fillStyle = 'rgba(92,70,58,0.2)'
  for (const y of [safAra * 0.5, safAra * 1.5]) c.fillRect(0, y + 0.172 * s, B, Math.max(1, 0.006 * s))

  // Hav: düğüm tanesi, sıra izi, saf yönünde fırça izi ve yumuşak ton farkı.
  const fbm = gurultuUret(37), M = 256, leke = new Float32Array(M * M)
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
    const u = x / M, v = y / M
    const genis = fbm(u * 6, v * 6, 6, 3), firca = fbm(u * 6, v * 42, 6, 2)
    leke[y * M + x] = (genis - 0.5) * 0.11 + (firca - 0.5) * 0.09
  }
  const veri = c.getImageData(0, 0, B, B), px_ = veri.data
  const adim = hafif ? 1 : 2, D = B / adim, dugum = new Float32Array(D * D)
  for (let i = 0; i < dugum.length; i++) dugum[i] = r()
  for (let y = 0; y < B; y++) {
    const sira_ = ((y / adim) | 0) & 1 ? 0.985 : 1.012, ly = (y * M) / B, ly0 = ly | 0, fy = ly - ly0
    for (let x = 0; x < B; x++) {
      const lx = (x * M) / B, lx0 = lx | 0, fx = lx - lx0, x1 = (lx0 + 1) % M, y1 = (ly0 + 1) % M
      const a = leke[ly0 * M + lx0], b = leke[ly0 * M + x1], e = leke[y1 * M + lx0], f = leke[y1 * M + x1]
      const l = a + (b - a) * fx + (e - a + (a - b - e + f) * fx) * fy
      const t = (0.9 + dugum[((y / adim) | 0) * D + ((x / adim) | 0)] * 0.15) * sira_ * (0.985 + l)
      const i = (y * B + x) * 4
      px_[i] = Math.min(255, px_[i] * t); px_[i + 1] = Math.min(255, px_[i + 1] * t); px_[i + 2] = Math.min(255, px_[i + 2] * t)
    }
  }
  c.putImageData(veri, 0, 0)
  const renk = tekrarli(el, HALI_TEKRAR, true)
  if (hafif) return { renk, normal: null }

  // Normal harita yalnız masaüstünde: hav tanesi ve motifin kesik havı.
  const N = B >> 1, yukseklik = new Float32Array(N * N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = ((y * 2) * B + x * 2) * 4
    yukseklik[y * N + x] = ((px_[i] + px_[i + 1] + px_[i + 2]) / 765) * 1.1 + dugum[y * D + x] * 0.55
  }
  const nt = tuval(N), nv = nt.c.createImageData(N, N), nd = nv.data, g = 2
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (yukseklik[y * N + ((x + N - 1) % N)] - yukseklik[y * N + ((x + 1) % N)]) * g
    const dy = (yukseklik[((y + 1) % N) * N + x] - yukseklik[((y + N - 1) % N) * N + x]) * g
    const u = 1 / Math.hypot(dx, dy, 1), i = (y * N + x) * 4
    nd[i] = (dx * u * 0.5 + 0.5) * 255; nd[i + 1] = (dy * u * 0.5 + 0.5) * 255; nd[i + 2] = (u * 0.5 + 0.5) * 255; nd[i + 3] = 255
  }
  nt.c.putImageData(nv, 0, 0)
  return { renk, normal: tekrarli(nt.el, HALI_TEKRAR, false) }
}

/** Marmara mermeri parçası: beyaz zeminde tek yönde akan gri mavi damar kuşakları. */
function mermerParcasi(tohum: number, koyu: number) {
  const B = 512, { el, c } = tuval(B), fbm = gurultuUret(tohum), veri = c.createImageData(B, B), d = veri.data
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const u = x / B, v = y / B
    const bozma = fbm(u * 3, v * 3, 3, 3) - 0.5
    const kusak = fbm(u * 3, v * 22 + bozma * 2.2, 22, 3)
    const ince = fbm(u * 5, v * 70 + bozma * 7, 35, 2)
    const t = Math.min(1, yumusak(0.48, 0.72, kusak) * 0.58 + yumusak(0.6, 0.74, ince) * 0.34)
    const i = (y * B + x) * 4
    d[i] = karisim(238, 142 - koyu, t); d[i + 1] = karisim(238, 148 - koyu, t); d[i + 2] = karisim(234, 154 - koyu, t); d[i + 3] = 255
  }
  c.putImageData(veri, 0, 0)
  return el
}

/**
 * Şadırvan döşemesi: tek parça (tekrarsız) 10,6 m'lik doku. Levhalar havuzun on altı köşesinden yelpaze gibi
 * açılır, derzleri eğiktir; birkaç koyu yeşil yama, tabure dibi ve havuz kenarı kirleri fotoğraftaki gibidir.
 */
function mermerDokusu(hafif: boolean) {
  const B = hafif ? 1024 : 2048, s = B / MERMER_METRE, o = B / 2
  const { el, c } = tuval(B)
  const kab = hafif ? null : tuval(1024)
  const r = rastgele(97)
  const parcalar = [mermerParcasi(131, 0), mermerParcasi(149, 18)]
  c.fillStyle = '#4a4744'
  c.fillRect(0, 0, B, B)
  if (kab) { kab.c.fillStyle = '#d0d0d0'; kab.c.fillRect(0, 0, 1024, 1024) }

  const KOSE = Math.PI / 8
  const koseliR = (rad: number, t: number) => {
    const m = ((t % KOSE) + KOSE) % KOSE
    return (rad * Math.cos(KOSE / 2)) / Math.cos(m - KOSE / 2)
  }
  // Dünya: x = sin(t), z = cos(t). Tuvalin yukarısı +z (kıble).
  const nokta = (rad: number, t: number): [number, number] => { const q = koseliR(rad, t); return [o + Math.sin(t) * q * s, o - Math.cos(t) * q * s] }
  const halkalar = [3.55, 4.5, 5.6, 7.1, 8.4], sayilar = [12, 13, 16, 13]
  const levhalar: [number, number][][] = []
  const koyuLevha = new Set<number>()
  halkalar.slice(0, -1).forEach((ic, h) => {
    const dis = halkalar[h + 1], n = sayilar[h], kayma = r() * 2, egim = (h % 2 ? -1 : 1) * (0.12 + r() * 0.1)
    const kesik: number[] = []
    for (let i = 0; i < n; i++) kesik.push(((i + kayma + (r() - 0.5) * 0.5) / n) * Math.PI * 2)
    for (let i = 0; i < n; i++) {
      const a = kesik[i], b = i === n - 1 ? kesik[0] + Math.PI * 2 : kesik[i + 1]
      const pol: [number, number][] = []
      // İç kenar: köşeden köşeye düz gider.
      pol.push(nokta(ic, a))
      for (let k = Math.ceil(a / KOSE); k * KOSE < b; k++) pol.push(nokta(ic, k * KOSE))
      pol.push(nokta(ic, b))
      const a2 = a + egim, b2 = b + egim
      pol.push(nokta(dis, b2))
      for (let k = Math.floor(b2 / KOSE); k * KOSE > a2; k--) pol.push(nokta(dis, k * KOSE))
      pol.push(nokta(dis, a2))
      levhalar.push(pol)
      if (h <= 1 && r() < 0.11) koyuLevha.add(levhalar.length - 1)
    }
  })
  levhalar.forEach((pol, n) => {
    let mx = 0, my = 0
    for (const [x, y] of pol) { mx += x; my += y }
    mx /= pol.length; my /= pol.length
    c.save()
    c.beginPath(); pol.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip()
    c.translate(mx, my)
    c.rotate(Math.atan2(my - o, mx - o) + (r() - 0.5) * 1.1 + (r() < 0.3 ? Math.PI / 2 : 0))
    const boy = 3.6 * s
    c.drawImage(parcalar[n % 2], -boy / 2 - r() * 0.3 * s, -boy / 2 - r() * 0.3 * s, boy * 1.1, boy * 1.1)
    c.setTransform(1, 0, 0, 1, 0, 0)
    // Levha başına ton: gri, sıcak bej ya da koyu yeşil yama.
    c.globalCompositeOperation = 'multiply'
    if (koyuLevha.has(n)) c.fillStyle = '#4c5a50'
    else { const t = r(), a = 216 + r() * 39 | 0; c.fillStyle = t < 0.3 ? `rgb(${a},${a - 12},${a - 34})` : `rgb(${a},${a},${a - 3})` }
    c.fillRect(0, 0, B, B)
    c.restore()
  })
  // Derzler
  c.lineJoin = 'round'
  c.strokeStyle = 'rgba(58,54,50,0.8)'; c.lineWidth = Math.max(1.2, 0.012 * s)
  for (const pol of levhalar) { c.beginPath(); pol.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke() }
  if (kab) {
    const k = 1024 / B
    kab.c.strokeStyle = '#1c1c1c'; kab.c.lineWidth = Math.max(1, 0.014 * s * k)
    for (const pol of levhalar) { kab.c.beginPath(); pol.forEach(([x, y], i) => (i ? kab.c.lineTo(x * k, y * k) : kab.c.moveTo(x * k, y * k))); kab.c.closePath(); kab.c.stroke() }
  }

  c.globalCompositeOperation = 'multiply'
  // Havuz dibi: su ve sabun izi, sıcak kahverengi.
  const dip = c.createRadialGradient(o, o, 3.55 * s, o, o, 4.75 * s)
  dip.addColorStop(0, 'rgb(150,126,98)'); dip.addColorStop(0.35, 'rgb(208,192,170)'); dip.addColorStop(1, 'rgb(255,255,255)')
  c.fillStyle = dip; c.fillRect(0, 0, B, B)
  // Tabure dipleri
  for (let n = 0; n < 14; n++) {
    const a = (n / 14) * Math.PI * 2, x = o + Math.sin(a) * 4.25 * s, y = o - Math.cos(a) * 4.25 * s
    const g = c.createRadialGradient(x, y, 0.1 * s, x, y, 0.42 * s)
    g.addColorStop(0, 'rgb(112,104,94)'); g.addColorStop(1, 'rgb(255,255,255)')
    c.fillStyle = g; c.fillRect(x - 0.45 * s, y - 0.45 * s, 0.9 * s, 0.9 * s)
  }
  // Korkuluk dipleri
  const seritler: [number, number, number, number][] = []
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    seritler.push([a * 5.15, b * 3, 0.5, 3.8], [a * 2.95, b * 5.15, 4, 0.5])
  }
  c.fillStyle = 'rgb(186,178,168)'
  for (const [x, z, g, d] of seritler) c.fillRect(o + (x - g / 2) * s, o - (z + d / 2) * s, g * s, d * s)
  // Basılan yerlerde geniş leke: büyük ölçekli gri kir.
  c.globalAlpha = 0.16
  c.drawImage(parcalar[1], 0, 0, B, B)
  c.globalAlpha = 1
  c.globalCompositeOperation = 'source-over'
  // Fotoğraftaki kuzeydeki gider kapağı: koyu taş levha.
  const ka = (7.5 / 14) * Math.PI * 2, kx = o + Math.sin(ka) * 4.75 * s, ky = o - Math.cos(ka) * 4.75 * s
  c.save(); c.translate(kx, ky); c.rotate(-ka)
  c.fillStyle = '#6c665a'; c.fillRect(-0.36 * s, -0.27 * s, 0.72 * s, 0.54 * s)
  c.strokeStyle = '#2d2a26'; c.lineWidth = Math.max(1, 0.014 * s); c.strokeRect(-0.36 * s, -0.27 * s, 0.72 * s, 0.54 * s)
  c.fillStyle = '#26231f'; c.beginPath(); c.ellipse(0, 0, 0.05 * s, 0.025 * s, 0, 0, Math.PI * 2); c.fill()
  c.restore()

  return { renk: tekrarli(el, MERMER_METRE, true), kabartma: kab ? tekrarli(kab.el, MERMER_METRE, false) : null }
}

/** Masaüstü: net kenarlı nem lekeleri ve ince solma. Köşe rengi geniş ölçeği taşır, burası yalnız kenarı keskinleştirir. */
function lekeliHali<M extends THREE.MeshStandardMaterial>(m: M) {
  m.onBeforeCompile = (g) => {
    g.vertexShader = g.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vZemPoz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZemPoz = position.xz;')
    g.fragmentShader = g.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec2 vZemPoz;
float zemK(vec2 p) { p = fract(p * vec2(0.1031, 0.1137)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float zemG(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(zemK(i), zemK(i + vec2(1, 0)), f.x), mix(zemK(i + vec2(0, 1)), zemK(i + vec2(1, 1)), f.x), f.y); }
float zemF(vec2 p) { float t = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { t += a * zemG(p); p = p * 2.03 + 17.0; a *= 0.5; } return t; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ float nem = smoothstep(0.615, 0.635, zemF(vZemPoz * 0.34 + 41.0));
  float kuru = smoothstep(0.56, 0.585, zemF(vZemPoz * vec2(0.5, 0.26) + 7.0));
  float ince = zemF(vZemPoz * 2.3);
  vec3 c = diffuseColor.rgb;
  c = mix(c, vec3(dot(c, vec3(0.33))) * 1.12, kuru * 0.42);
  c *= mix(1.0, 0.72, nem) * (0.93 + 0.14 * ince);
  diffuseColor.rgb = c; }`)
  }
  m.customProgramCacheKey = () => 'ulu-zemin-hali'
  return m
}

/** Yukarı bakan ızgara; ton işlevi her köşenin rengini verir, `atla` döşemenin altında kalan hücreleri çıkarır. */
function izgara(x0: number, x1: number, z0: number, z1: number, y: number, adim: number, ton: (x: number, z: number, c: number[]) => void, atla?: (x: number, z: number) => boolean) {
  const nx = Math.round((x1 - x0) / adim), nz = Math.round((z1 - z0) / adim), dx = (x1 - x0) / nx, dz = (z1 - z0) / nz
  const poz: number[] = [], nor: number[] = [], uv: number[] = [], renk: number[] = [], c = [1, 1, 1]
  const ekle = (x: number, z: number) => {
    poz.push(x, y, z); nor.push(0, 1, 0); uv.push(x, z)
    ton(x, z, c); renk.push(c[0], c[1], c[2])
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = x0 + i * dx, b = a + dx, e = z0 + j * dz, f = e + dz
    if (atla?.((a + b) / 2, (e + f) / 2)) continue
    ekle(a, e); ekle(a, f); ekle(b, e)
    ekle(b, e); ekle(a, f); ekle(b, f)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3))
  return g
}

/** Halının geniş ölçekli tonu: paye ve duvar dibi gölgesi, avize altı sıcak ışık, solgun ve kirli büyük lekeler. */
function haliTonu() {
  const fbm = gurultuUret(53), GX = GOZ_X, GZ = GOZ_Z
  return (x: number, z: number, c: number[]) => {
    const kx = Math.round((x + YX) / GX) * GX - YX, kz = Math.round((z + YZ) / GZ) * GZ - YZ
    const paye = Math.hypot(Math.max(Math.abs(x - kx) - 1.62, 0), Math.max(Math.abs(z - kz) - 1.62, 0))
    const mx = (Math.floor((x + YX) / GX) + 0.5) * GX - YX, mz = (Math.floor((z + YZ) / GZ) + 0.5) * GZ - YZ
    const havuz = Math.exp(-((x - mx) ** 2 + (z - mz) ** 2) / 26)
    const duvar = Math.min(YX - DUVAR - Math.abs(x), YZ - DUVAR - Math.abs(z))
    const golge = karisim(0.62, 1, yumusak(0, 2.3, paye)) * karisim(0.68, 1, yumusak(0, 2, duvar))
    const n1 = fbm((x + 70) * 0.19, (z + 70) * 0.26, 256, 3)
    const n2 = fbm((x + 90) * 0.42, (z + 40) * 0.42, 256, 3)
    const solgun = yumusak(0.5, 0.6, n1), kirli = yumusak(0.56, 0.66, n2)
    const t = golge * (0.86 + 0.2 * solgun) * karisim(1, 0.8, kirli)
    // Solgun yerde renk griye kayar (mavi artar), kirli yerde üçü birden iner.
    c[0] = t * (0.9 + 0.3 * havuz)
    c[1] = t * (0.9 + 0.27 * havuz) * (1 + 0.035 * solgun)
    c[2] = t * (0.9 + 0.2 * havuz) * (1 + 0.09 * solgun)
  }
}

/** Halı, mermer, kapı önü taşları ve süpürgelik. Yüzeyler yürüme alanını değiştirmez: çok incedirler. */
export function icZemini(k: Kova, m: UlucamiMalzemeleri) {
  const hafif = hafifCihaz()
  const hali = haliDokusu(hafif), mermer = mermerDokusu(hafif)
  const haliMal = (renk: string, parlama: string) => hafif
    ? new THREE.MeshStandardMaterial({ map: hali.renk, color: renk, roughness: 0.97, metalness: 0, vertexColors: true })
    : lekeliHali(new THREE.MeshPhysicalMaterial({
      map: hali.renk, normalMap: hali.normal, normalScale: new THREE.Vector2(0.55, 0.55), color: renk, roughness: 0.97, metalness: 0,
      vertexColors: true, sheen: 0.32, sheenRoughness: 0.75, sheenColor: new THREE.Color(parlama),
    }))
  // ERD05018 açık halı örneklerinin RGB medyanları: (197,155,136), (226,190,174).
  // Bunlar fotoğraf ışığını içerir; orta ton albedo + sahne ışığıyla yorumlanır.
  const gul = haliMal('#cfb09f', '#e6cfb9')
  const zeytin = haliMal('#a89e79', '#cdc6a0')
  const mermerMal = hafif
    ? new THREE.MeshStandardMaterial({ map: mermer.renk, roughness: 0.3, metalness: 0, vertexColors: true })
    : new THREE.MeshPhysicalMaterial({ map: mermer.renk, bumpMap: mermer.kabartma, bumpScale: 0.35, roughness: 0.32, metalness: 0, vertexColors: true, clearcoat: 0.5, clearcoatRoughness: 0.16 })

  const ton = haliTonu()
  const bx = GOZ_X / 2, bz = GOZ_Z / 2
  // Şadırvan gözünün gül halısı zeytin halının altında kalır: o hücreler çizilmez.
  k.ekle(izgara(-YX + DUVAR, YX - DUVAR, -YZ + DUVAR, YZ - DUVAR, ZEMIN, 0.65, ton, (x, z) => Math.abs(x - sx) < bx - 0.7 && Math.abs(z - sz) < bz - 0.7), gul)
  const mg = MERMER_G / 2, md = MERMER_D / 2
  k.ekle(izgara(sx - bx, sx + bx, sz - bz, sz + bz, ZEMIN + 0.012, 0.65, ton, (x, z) => Math.abs(x - sx) < mg - 0.7 && Math.abs(z - sz) < md - 0.7), zeytin)

  // Mermer: üst yüz tek parça doku, yan kenar kirli taş bordür.
  const uvMermer = (g: THREE.BufferGeometry, ux: number, uz: number) => {
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) - ux, p.getZ(i) - uz)
    return g
  }
  const beyaz = (_x: number, _z: number, c: number[]) => { c[0] = c[1] = c[2] = 1 }
  const ux = sx - MERMER_METRE / 2, uz = sz - MERMER_METRE / 2
  k.ekle(uvMermer(izgara(sx - mg, sx + mg, sz - md, sz + md, MERMER_UST, MERMER_G, beyaz), ux, uz), mermerMal)
  k.ekle(yer(kutuG(MERMER_G, 0.095, MERMER_D), sx, ZEMIN + 0.05, sz), m.mermerKoyu)
  // Kuzey korkuluk aralığından halıya uzanan mermer geçit (fotoğrafta kuzey yönünde görülür).
  const gecitZ0 = sz - bz + 0.35, gecitZ1 = sz - md
  // Doku köşesinden alınır: koyu yamalar yalnız havuz kenarındadır.
  k.ekle(uvMermer(izgara(sx - 1.05, sx + 1.05, gecitZ0, gecitZ1, MERMER_UST, 2.1, beyaz), sx - 1.55, gecitZ0 - 0.2), mermerMal)
  k.ekle(yer(kutuG(2.1, 0.095, gecitZ1 - gecitZ0), sx, ZEMIN + 0.05, (gecitZ0 + gecitZ1) / 2), m.mermerKoyu)

  // Kapı önleri: duvardan bir metre içeri ince gri taş (fotoğrafta kapı nişi önündeki şerit).
  const duvarDibi = (duvarUzak: (x: number, z: number) => number) => (x: number, z: number, c: number[]) => {
    const t = karisim(0.5, 0.74, yumusak(0, 0.95, duvarUzak(x, z)))
    c[0] = t; c[1] = t; c[2] = t * 1.02
  }
  const IX = YX - DUVAR, IZ = YZ - DUVAR, KG = 2.1, KD = 1.05
  k.ekle(uvMermer(izgara(-KG, KG, -IZ, -IZ + KD, ZEMIN + 0.014, 2.1, duvarDibi((_x, z) => z + IZ)), ux - 1.4, uz + 20.2), mermerMal)
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? IX - KD : -IX, x1 = x0 + KD
    k.ekle(uvMermer(izgara(x0, x1, KAPI_Z - KG, KAPI_Z + KG, ZEMIN + 0.014, 2.1, duvarDibi((x) => IX - Math.abs(x))), ux + s * 27, uz + 2), mermerMal)
  }

  // Süpürgelik: duvar dibinde alçak taş, kapı ve mihrap önünde kesilir.
  const YUK = 0.11, KAL = 0.035, y = ZEMIN + YUK / 2
  const parca = (a: number, b: number, sabit: number, xBoyunca: boolean) => {
    const L = b - a, orta = (a + b) / 2
    k.ekle(xBoyunca ? yer(kutuG(L, YUK, KAL), orta, y, sabit) : yer(kutuG(KAL, YUK, L), sabit, y, orta), m.mermerKoyu)
  }
  for (const s of [-1, 1]) {
    const yan = s * (IX - KAL / 2)
    parca(-IZ, KAPI_Z - KG, yan, false); parca(KAPI_Z + KG, IZ, yan, false)
    parca(s > 0 ? KG : -IX, s > 0 ? IX : -KG, -IZ + KAL / 2, true)
    parca(s > 0 ? 3.7 : -IX, s > 0 ? IX : -3.7, IZ - KAL / 2, true)
  }
}
