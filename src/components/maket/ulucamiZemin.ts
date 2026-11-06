// Ulu Camii iç zemini: halı ve mermer dokuları piksel piksel üretilir, dışarıdan görsel kullanılmaz.
// Renk ve düzen arşiv fotoğraflarına bakılarak yorumlanmıştır (ic-mekan, sadirvan); gerçek halının veya
// döşemenin deseni kopyalanmaz. Dokular kesintisiz tekrarlanır, geniş ölçekli farkı gölgelendirici ekler.
import * as THREE from 'three'

export function rastgele(tohum: number) {
  return () => {
    tohum = (tohum + 0x6d2b79f5) | 0
    let t = Math.imul(tohum ^ (tohum >>> 15), 1 | tohum)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Dokunmatik cihaz ve Quest: dokular yarı boyutta, malzemeler ek yüzey hesabı olmadan çalışır. */
export const hafifCihaz = () => matchMedia('(hover: none)').matches || /OculusBrowser|Quest/i.test(navigator.userAgent)

export function tekrarli(el: HTMLCanvasElement, metre: number, renkli: boolean) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metre, 1 / metre)
  t.anisotropy = hafifCihaz() ? 4 : 16
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function tuval(boyut: number) {
  const el = document.createElement('canvas')
  el.width = el.height = boyut
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  return { el, c }
}

/** Dikişsiz gürültü: `per` hücrede bir kendini tekrarlar. */
export function gurultuUret(tohum: number) {
  const N = 256, r = rastgele(tohum), t = new Float32Array(N * N)
  for (let i = 0; i < t.length; i++) t[i] = r()
  const n = (x: number, y: number, per: number, ek: number) => {
    const ix = Math.floor(x), iy = Math.floor(y)
    let fx = x - ix, fy = y - iy
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    const x0 = ((ix % per) + per) % per, y0 = ((iy % per) + per) % per
    const x1 = (x0 + 1) % per, y1 = (y0 + 1) % per
    const d = (a: number, b: number) => t[(((b + ek) & 255) << 8) | ((a + ek) & 255)]
    const u = d(x0, y0) + (d(x1, y0) - d(x0, y0)) * fx
    const v = d(x0, y1) + (d(x1, y1) - d(x0, y1)) * fx
    return u + (v - u) * fy
  }
  /** `per` hücrelik fbm; x ve y hücre biriminde verilir. */
  return (x: number, y: number, per: number, oktav: number) => {
    let s = 0, a = 0.5, top = 0
    for (let i = 0; i < oktav; i++) {
      s += a * n(x, y, per, i * 37); top += a
      x *= 2; y *= 2; per *= 2; a *= 0.5
    }
    return s / top
  }
}

export const yumusak = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function damla(c: CanvasRenderingContext2D, x: number, y: number, b: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a)
  c.beginPath()
  c.moveTo(0, -b); c.bezierCurveTo(b * 0.62, -b * 0.3, b * 0.5, b * 0.72, 0, b)
  c.bezierCurveTo(-b * 0.5, b * 0.72, -b * 0.62, -b * 0.3, 0, -b)
  c.closePath(); c.fill(); c.restore()
}

/**
 * Halı: enine saf bantları, aralarda şaşırtmalı küçük damla motifleri ve hav dokusu.
 * Doku nötr tonludur; aynı doku malzeme rengiyle gül kurusu ve zeytin yeşili halıya dönüşür.
 * İki saf (2,4 m) bir tekrardır. Hav düğümleri yaklaşık 5 mm'dir.
 */
export function haliDokulari() {
  const B = hafifCihaz() ? 1024 : 2048
  const { el, c } = tuval(B)
  const r = rastgele(83), SAF = B / 2, olc = B / 2048
  c.fillStyle = '#f3ebe3'
  c.fillRect(0, 0, B, B)

  for (let s = 0; s < 2; s++) {
    const y0 = s * SAF
    // Saf bandı: koyu zemin, ince çift çizgi ve örgü zinciri (yaklaşık 12 cm).
    const bant = 104 * olc
    c.fillStyle = '#94695c'
    c.fillRect(0, y0, B, bant)
    c.fillStyle = '#5f3a30'
    c.fillRect(0, y0, B, 7 * olc); c.fillRect(0, y0 + bant - 7 * olc, B, 7 * olc)
    c.fillStyle = '#dfcfc3'
    c.fillRect(0, y0 + 14 * olc, B, 4 * olc); c.fillRect(0, y0 + bant - 18 * olc, B, 4 * olc)
    const adet = 24, ad = B / adet, orta = y0 + bant / 2
    c.lineWidth = 7 * olc
    for (let i = 0; i < adet; i++) {
      const x = (i + 0.5) * ad
      c.strokeStyle = i % 2 ? '#ecdccd' : '#54322a'
      c.beginPath(); c.ellipse(x, orta, ad * 0.62, 25 * olc, 0, 0, Math.PI * 2); c.stroke()
    }
    // Bant dışında ince eşlik çizgileri.
    c.fillStyle = '#a98a7d'
    c.fillRect(0, y0 + bant + 22 * olc, B, 5 * olc)
    c.fillRect(0, y0 - 27 * olc + (s === 0 ? B : 0), B, 5 * olc)

    // Alan: şaşırtmalı damla ikilileri (yaklaşık 30 cm aralık).
    const sutun = 8, sira = 3, alan = SAF - bant - 60 * olc
    c.fillStyle = '#7d4a3d'
    for (let j = 0; j < sira; j++) for (let i = 0; i < sutun; i++) {
      const x = ((i + (j % 2) * 0.5 + (s % 2) * 0.25) * B) / sutun
      const y = y0 + bant + 40 * olc + ((j + 0.5) * alan) / sira
      const a = (r() - 0.5) * 0.12
      damla(c, x, y - 30 * olc, 42 * olc, a)
      damla(c, x - 32 * olc, y + 26 * olc, 26 * olc, -0.95 + a)
      damla(c, x + 32 * olc, y + 26 * olc, 26 * olc, 0.95 + a)
    }
  }

  // Hav: tuval deseni üzerine düğüm düğüm ton farkı, sıra izi ve yumuşak leke.
  const fbm = gurultuUret(19), D = B >> 2
  const dugum = new Float32Array(D * D)
  for (let i = 0; i < dugum.length; i++) dugum[i] = r()
  const veri = c.getImageData(0, 0, B, B), px = veri.data
  for (let y = 0; y < B; y++) {
    const sira = (y >> 2) & 1 ? 0.975 : 1.02
    for (let x = 0; x < B; x++) {
      const i = (y * B + x) * 4, k = dugum[(y >> 2) * D + (x >> 2)]
      const t = (0.86 + k * 0.24) * sira
      px[i] = Math.min(255, px[i] * t); px[i + 1] = Math.min(255, px[i + 1] * t); px[i + 2] = Math.min(255, px[i + 2] * t)
    }
  }
  // Normal haritası için motif kabartması, hav çarpanından önceki parlaklığa yakın olduğu için buradan okunur.
  const N = B >> 1, yuk = new Float32Array(N * N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = ((y * 2) * B + x * 2) * 4
    const parlak = (px[i] + px[i + 1] + px[i + 2]) / 765
    yuk[y * N + x] = dugum[(y >> 1) * D + (x >> 1)] * 0.8 + parlak * 0.9 + fbm((x / N) * 64, (y / N) * 64, 64, 2) * 0.35
  }
  c.putImageData(veri, 0, 0)

  const nt = tuval(N), nv = nt.c.createImageData(N, N), nd = nv.data, g = 2.2
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const sag = yuk[y * N + ((x + 1) % N)], sol = yuk[y * N + ((x + N - 1) % N)]
    const alt = yuk[((y + 1) % N) * N + x], ust = yuk[((y + N - 1) % N) * N + x]
    const dx = (sol - sag) * g, dy = (alt - ust) * g, u = 1 / Math.hypot(dx, dy, 1), i = (y * N + x) * 4
    nd[i] = (dx * u * 0.5 + 0.5) * 255; nd[i + 1] = (dy * u * 0.5 + 0.5) * 255; nd[i + 2] = (u * 0.5 + 0.5) * 255; nd[i + 3] = 255
  }
  nt.c.putImageData(nv, 0, 0)
  return { renk: tekrarli(el, 2.4, true), normal: tekrarli(nt.el, 2.4, false) }
}

type Fbm = ReturnType<typeof gurultuUret>

/** Damarlı gri-beyaz mermer: bulutlu zemin, ana damarlar ve ince çatlaklar. `a`,`b` tam sayı: damar yönü, dikişsiz kalır. */
function mermerPiksel(fbm: Fbm, u: number, v: number, a: number, b: number, ox: number, oy: number, ton: number, cikti: number[]) {
  const w1 = fbm(u * 6 + ox, v * 6 + oy, 6, 4), w2 = fbm(u * 6 + ox + 3, v * 6 + oy + 5, 6, 4)
  const ana = Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * a + v * b + (w1 - 0.5) * 3))), 16)
  const ince = Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * a * 3 - v * b * 2 + (w2 - 0.5) * 6))), 34)
  const bulut = yumusak(0.42, 0.68, w2)
  const karisim = Math.min(1, ana * (0.35 + w1 * 0.9) + ince * 0.28)
  for (let k = 0; k < 3; k++) {
    const acik = [238, 238, 233][k], koyu = [176, 181, 184][k], damar = [86, 92, 100][k]
    const z = acik + (koyu - acik) * bulut * 0.72
    cikti[k] = (z + (damar - z) * karisim) * ton
  }
}

/** Şadırvan çevresi döşemesi: sıra sıra büyük levhalar, her levhada ayrı damar yönü. 4,2 metrede tekrar. */
export function mermerDosemeDokulari() {
  const B = hafifCihaz() ? 512 : 1024, olc = B / 1024
  const { el, c } = tuval(B)
  const kab = tuval(B)
  const r = rastgele(29), fbm = gurultuUret(47)
  const veri = c.createImageData(B, B), px = veri.data, renk = [0, 0, 0]
  const yonler: [number, number][] = [[3, 1], [1, 3], [2, -2], [4, 1], [-1, 4], [3, 2]]
  kab.c.fillStyle = '#d0d0d0'
  kab.c.fillRect(0, 0, B, B)
  const derz = Math.max(1, Math.round(3 * olc))
  const siralar = 4, sirH = Math.floor(B / siralar)
  for (let s = 0; s < siralar; s++) {
    const y0 = s * sirH, y1 = s === siralar - 1 ? B : y0 + sirH
    const adet = 2 + Math.floor(r() * 2), kayma = Math.floor(r() * B)
    for (let n = 0; n < adet; n++) {
      const x0 = kayma + Math.floor((n * B) / adet), x1 = kayma + Math.floor(((n + 1) * B) / adet)
      const [a, b] = yonler[Math.floor(r() * yonler.length)]
      const ox = Math.floor(r() * 6), oy = Math.floor(r() * 6), ton = 0.93 + r() * 0.1
      for (let y = y0; y < y1; y++) for (let xh = x0; xh < x1; xh++) {
        const x = xh % B, i = (y * B + x) * 4
        const kenar = y - y0 < derz || xh - x0 < derz
        mermerPiksel(fbm, x / B, y / B, a, b, ox, oy, kenar ? ton * 0.45 : ton, renk)
        px[i] = renk[0]; px[i + 1] = renk[1]; px[i + 2] = renk[2]; px[i + 3] = 255
      }
      kab.c.fillStyle = '#202020'
      kab.c.fillRect(x0 % B, y0, derz, y1 - y0)
    }
    kab.c.fillStyle = '#202020'
    kab.c.fillRect(0, y0, B, derz)
  }
  c.putImageData(veri, 0, 0)
  return { renk: tekrarli(el, 4.2, true), kabartma: tekrarli(kab.el, 4.2, false) }
}

/** Havuz gövdesi, kaide ve kürsü için derzsiz damarlı mermer. 3 metrede tekrar. */
export function mermerGovdeDokusu() {
  const B = hafifCihaz() ? 512 : 1024
  const { el, c } = tuval(B)
  const fbm = gurultuUret(61), veri = c.createImageData(B, B), px = veri.data, renk = [0, 0, 0]
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const i = (y * B + x) * 4
    mermerPiksel(fbm, x / B, y / B, 2, 3, 0, 0, 1, renk)
    px[i] = renk[0]; px[i + 1] = renk[1]; px[i + 2] = renk[2]; px[i + 3] = 255
  }
  c.putImageData(veri, 0, 0)
  return tekrarli(el, 3, true)
}

/** Havuz suyu için dikişsiz ince dalga normali. 3 metrede tekrar. */
export function suNormali() {
  const B = 512, nt = tuval(B), fbm = gurultuUret(73), yuk = new Float32Array(B * B)
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) yuk[y * B + x] = fbm((x / B) * 10, (y / B) * 10, 10, 3)
  const nv = nt.c.createImageData(B, B), nd = nv.data, g = 7
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
    const dx = (yuk[y * B + ((x + B - 1) % B)] - yuk[y * B + ((x + 1) % B)]) * g
    const dy = (yuk[((y + 1) % B) * B + x] - yuk[((y + B - 1) % B) * B + x]) * g
    const u = 1 / Math.hypot(dx, dy, 1), i = (y * B + x) * 4
    nd[i] = (dx * u * 0.5 + 0.5) * 255; nd[i + 1] = (dy * u * 0.5 + 0.5) * 255; nd[i + 2] = (u * 0.5 + 0.5) * 255; nd[i + 3] = 255
  }
  nt.c.putImageData(nv, 0, 0)
  return tekrarli(nt.el, 3, false)
}
