// Orhan Bey Camii'ne özgü tuval dokuları. Renk ve düzen Vakıf Eserleri Envanteri fotoğraflarına bakılarak
// yorumlanmıştır; gerçek desenlerin kopyası değildir. Hat yazısı çizilmez, yalnız geometrik ve bitkisel motif vardır.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../../../data/acikYayin'
import { hafifCihaz, rastgele } from '../../ulucamiZemin'

function tuval(g: number, y = g) {
  const el = document.createElement('canvas')
  el.width = g; el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  return { el, c }
}

/** `metre`: dokunun bir tekrarının gerçek boyu. UV'si metre olan kutu ve çıkarım yüzeylerinde kullanılır. */
function tekrarli(el: HTMLCanvasElement, metre: number, renkli = true) {
  const t = new THREE.CanvasTexture(el)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metre, 1 / metre)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function tekParca(el: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Almaşık örgü: bir sıra moloz-kesme taş, üç sıra tuğla; taşların arasında dikey tuğlalar. */
function almasikTuval() {
  const B = hafifCihaz() ? 1024 : 2048, olc = B / 2048
  const { el, c } = tuval(B)
  const r = rastgele(41)
  c.fillStyle = '#b79f83'
  c.fillRect(0, 0, B, B)
  const SIRA = 4, sirH = B / SIRA
  for (let s = 0; s < SIRA; s++) {
    const y0 = s * sirH, tasH = sirH * 0.62
    const taslar = 5 + Math.floor(r() * 2)
    let x = -r() * 60 * olc
    const genislik = B / taslar
    for (let i = 0; i <= taslar; i++) {
      const g = genislik * (0.86 + r() * 0.2)
      const ton = 0.86 + r() * 0.2
      c.fillStyle = `rgb(${196 * ton},${170 * ton},${134 * ton})`
      c.fillRect(x + 12 * olc, y0 + 5 * olc, g - 24 * olc, tasH - 10 * olc)
      for (let n = 0; n < 26; n++) {
        c.fillStyle = `rgba(${r() < 0.5 ? '90,70,50' : '235,220,190'},${0.08 + r() * 0.14})`
        c.fillRect(x + 12 * olc + r() * (g - 30 * olc), y0 + 6 * olc + r() * (tasH - 18 * olc), (6 + r() * 40) * olc, (3 + r() * 12) * olc)
      }
      // Taşların arasında çift dikey tuğla
      c.fillStyle = `rgb(${172 + r() * 20},${92 + r() * 16},${62 + r() * 12})`
      c.fillRect(x + g - 12 * olc, y0 + 6 * olc, 10 * olc, tasH - 12 * olc)
      c.fillRect(x + g + 2 * olc, y0 + 6 * olc, 10 * olc, tasH - 12 * olc)
      x += g
    }
    // Üç sıra tuğla
    const tugH = (sirH - tasH) / 3
    for (let t = 0; t < 3; t++) {
      const y = y0 + tasH + t * tugH
      let bx = -r() * 90 * olc
      while (bx < B) {
        const uz = (90 + r() * 50) * olc, ton = 0.84 + r() * 0.24
        c.fillStyle = `rgb(${186 * ton},${100 * ton},${68 * ton})`
        c.fillRect(bx, y + 4 * olc, uz - 5 * olc, tugH - 8 * olc)
        bx += uz
      }
    }
  }
  return el
}

/** Son cemaat yeri ve revak için tuğla ayırmalı dama: beyaz taş zemin, kırmızı küçük kareler. */
function damaTuval() {
  const B = 512, { el, c } = tuval(B), adim = B / 8
  c.fillStyle = '#e4dccb'
  c.fillRect(0, 0, B, B)
  c.strokeStyle = '#b9ad96'
  c.lineWidth = 2
  for (let i = -8; i < 16; i++) {
    c.beginPath(); c.moveTo(i * adim, 0); c.lineTo((i + 8) * adim, B); c.stroke()
    c.beginPath(); c.moveTo((i + 8) * adim, 0); c.lineTo(i * adim, B); c.stroke()
  }
  c.fillStyle = '#a9583a'
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const px = (x + (y % 2) * 0.5) * adim, py = (y + 0.5) * adim
    c.fillRect(px - adim * 0.13, py - adim * 0.13, adim * 0.26, adim * 0.26)
  }
  return el
}

/** Bugünkü meydan: koyu parke zemin üzerinde açık renk çapraz bantlar. */
function meydanTuval() {
  const B = 1024, { el, c } = tuval(B)
  const r = rastgele(7)
  c.fillStyle = '#5f5e60'
  c.fillRect(0, 0, B, B)
  for (let y = 0; y < B; y += 20) for (let x = (y / 20) % 2 ? 10 : 0; x < B; x += 20) {
    const t = 80 + r() * 28
    c.fillStyle = `rgb(${t},${t},${t + 3})`
    c.fillRect(x + 1, y + 1, 18, 18)
  }
  c.strokeStyle = '#a58b78'
  c.lineWidth = 44
  for (const k of [-B, 0, B]) {
    c.beginPath(); c.moveTo(k, 0); c.lineTo(k + B, B); c.stroke()
    c.beginPath(); c.moveTo(k + B, 0); c.lineTo(k, B); c.stroke()
  }
  return el
}

function cimTuval() {
  const B = 512, { el, c } = tuval(B), r = rastgele(13)
  c.fillStyle = '#4b6a33'
  c.fillRect(0, 0, B, B)
  for (let i = 0; i < 9000; i++) {
    const t = r()
    c.fillStyle = `rgb(${50 + t * 50},${86 + t * 60},${34 + t * 26})`
    c.fillRect(r() * B, r() * B, 2, 3 + r() * 3)
  }
  return el
}

/** Halı: fotoğraftaki turkuaz zemin ve iki yandan koyu çizgili örgü bandı. Bir saf 1,4 m. */
function haliTuval() {
  const B = hafifCihaz() ? 512 : 1024, { el, c } = tuval(B), r = rastgele(23), olc = B / 1024
  c.fillStyle = '#1f9aa8'
  c.fillRect(0, 0, B, B)
  for (let i = 0; i < 22000 * olc; i++) {
    const t = r()
    c.fillStyle = `rgba(${t < 0.5 ? '14,110,126' : '74,190,196'},0.32)`
    c.fillRect(r() * B, r() * B, 2 + r() * 3, 2 + r() * 3)
  }
  const y0 = B * 0.84, h = B * 0.14
  c.fillStyle = '#0e5f73'
  c.fillRect(0, y0 - 6 * olc, B, h + 12 * olc)
  c.fillStyle = '#cfe8df'
  c.fillRect(0, y0 + 3 * olc, B, 4 * olc); c.fillRect(0, y0 + h - 7 * olc, B, 4 * olc)
  const adet = 8, ad = B / adet, orta = y0 + h / 2
  c.lineWidth = 7 * olc
  for (let i = 0; i < adet; i++) {
    const x = (i + 0.5) * ad
    c.strokeStyle = i % 2 ? '#e8efe2' : '#17305f'
    c.beginPath(); c.ellipse(x, orta, ad * 0.58, h * 0.32, 0, 0, Math.PI * 2); c.stroke()
    c.fillStyle = '#e8efe2'
    c.beginPath(); c.arc(x, orta, 5 * olc, 0, Math.PI * 2); c.fill()
  }
  return el
}

/** Daire örgülü alçı şebeke: beyaz örgü, arkası ışıklı veya koyu. */
function sebekeTuval(arka: string, orgu: string) {
  const B = 512, { el, c } = tuval(B)
  c.fillStyle = arka
  c.fillRect(0, 0, B, B)
  const n = 6, d = B / n
  c.strokeStyle = orgu
  c.lineWidth = 12
  for (let y = 0; y < n * 1.4; y++) for (let x = 0; x <= n; x++) {
    const px = (x + (y % 2) * 0.5) * d, py = y * d * 0.72 + d * 0.4
    c.beginPath(); c.arc(px, py, d * 0.46, 0, Math.PI * 2); c.stroke()
  }
  c.lineWidth = 26
  c.strokeRect(0, 0, B, B)
  return el
}

/** Alt pencere: ahşap kayıt ve baklava demir, arkası gün ışığı. */
function baklavaPencereTuval(acik: boolean) {
  const B = 512, { el, c } = tuval(B)
  c.fillStyle = acik ? '#fff8e6' : '#23282a'
  c.fillRect(0, 0, B, B)
  c.strokeStyle = acik ? '#4a3a2c' : '#0d0f10'
  c.lineWidth = 5
  for (let i = -6; i < 14; i++) {
    c.beginPath(); c.moveTo(i * 64, 0); c.lineTo((i + 6) * 64, B); c.stroke()
    c.beginPath(); c.moveTo((i + 6) * 64, 0); c.lineTo(i * 64, B); c.stroke()
  }
  c.strokeStyle = acik ? '#6c4227' : '#14110f'
  c.lineWidth = 16
  c.beginPath(); c.moveTo(B / 2, 0); c.lineTo(B / 2, B); c.moveTo(0, B * 0.72); c.lineTo(B, B * 0.72); c.stroke()
  c.lineWidth = 26
  c.strokeRect(0, 0, B, B)
  return el
}

const CIZGI = '#f4efe2', KIRMIZI = '#9f3f25', LACIVERT = '#23407a', ALTIN = '#c79a3a', YESIL = '#2e5a43', KOYU = '#1d3029'

/** Yelpaze üçgenli köşe paneli: fotoğraftaki kırmızı zemin, beyaz kaburga, mavi-altın dolgu. */
function koseYildizi(c: CanvasRenderingContext2D, cx: number, taban: number, en: number, boy: number) {
  c.save()
  c.beginPath()
  c.moveTo(cx - en / 2, taban)
  c.quadraticCurveTo(cx - en / 2, taban - boy * 0.82, cx, taban - boy)
  c.quadraticCurveTo(cx + en / 2, taban - boy * 0.82, cx + en / 2, taban)
  c.closePath()
  c.fillStyle = KIRMIZI
  c.fill()
  c.clip()
  const N = 9
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * (i / N), a1 = Math.PI * ((i + 1) / N), am = (a0 + a1) / 2
    const R = Math.max(en, boy) * 1.1
    c.fillStyle = i % 2 ? LACIVERT : ALTIN
    for (const o of [0.3, 0.55, 0.78]) {
      const rx = (en / 2) * o, ry = boy * o
      c.beginPath()
      c.ellipse(cx - Math.cos(am) * rx, taban - Math.sin(am) * ry, en * 0.022, boy * 0.05, Math.PI / 2 - am, 0, Math.PI * 2)
      c.fill()
    }
    c.strokeStyle = CIZGI
    c.lineWidth = en * 0.022
    c.beginPath(); c.moveTo(cx, taban); c.lineTo(cx - Math.cos(a1) * R, taban - Math.sin(a1) * R * (boy / (en / 2)) * 0.5); c.stroke()
  }
  // İkinci halka: içte yıldız kırığı
  c.strokeStyle = CIZGI
  c.lineWidth = en * 0.016
  c.beginPath()
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * (i / N), o = i % 2 ? 0.66 : 0.46
    const x = cx - Math.cos(a) * (en / 2) * o, y = taban - Math.sin(a) * boy * o
    if (i) c.lineTo(x, y); else c.moveTo(x, y)
  }
  c.stroke()
  c.restore()
  c.strokeStyle = '#7d6a4c'
  c.lineWidth = en * 0.012
  c.beginPath()
  c.moveTo(cx - en / 2, taban)
  c.quadraticCurveTo(cx - en / 2, taban - boy * 0.82, cx, taban - boy)
  c.quadraticCurveTo(cx + en / 2, taban - boy * 0.82, cx + en / 2, taban)
  c.stroke()
}

/** Geçiş bölgesi: u çevre (0 = güney), v taban-tepe. Köşelerde yıldız paneller. */
function gecisTuval(guneyAlinlik: boolean) {
  const G = hafifCihaz() ? 1024 : 2048, Y = G / 4, { el, c } = tuval(G, Y)
  c.fillStyle = '#efe9db'
  c.fillRect(0, 0, G, Y)
  for (const u of [1 / 8, 3 / 8, 5 / 8, 7 / 8]) koseYildizi(c, u * G, Y, G * 0.2, Y * 0.92)
  if (guneyAlinlik) {
    // Mihrap duvarındaki alınlık: yalnız geometrik örgü; kuşak yazısı çizilmez.
    for (const cx of [0, G]) {
      const en = G * 0.1, boy = Y * 0.72
      c.beginPath()
      c.moveTo(cx - en / 2, Y); c.quadraticCurveTo(cx - en / 2, Y - boy * 0.85, cx, Y - boy); c.quadraticCurveTo(cx + en / 2, Y - boy * 0.85, cx + en / 2, Y); c.closePath()
      c.fillStyle = YESIL
      c.fill()
      c.strokeStyle = LACIVERT
      c.lineWidth = G * 0.004
      c.stroke()
      c.save(); c.clip()
      c.fillStyle = ALTIN
      for (let y = Y; y > Y - boy; y -= Y * 0.09) for (let x = cx - en / 2; x < cx + en / 2; x += en * 0.14) {
        c.beginPath(); c.arc(x, y, G * 0.0028, 0, Math.PI * 2); c.fill()
      }
      c.fillStyle = KOYU
      c.beginPath()
      c.moveTo(cx - en * 0.3, Y); c.quadraticCurveTo(cx - en * 0.3, Y - boy * 0.55, cx, Y - boy * 0.68); c.quadraticCurveTo(cx + en * 0.3, Y - boy * 0.55, cx + en * 0.3, Y); c.closePath()
      c.fill()
      c.restore()
    }
  }
  return el
}

/** İç kubbe: u çevre, v kenardan tepeye. Örgü kuşağı, boş alçı ve tepede renkli göbek. */
function icKubbeTuval(gobek: 'madalyon' | 'gul' | 'sade') {
  const G = hafifCihaz() ? 1024 : 2048, Y = G / 2, { el, c } = tuval(G, Y)
  c.fillStyle = '#ece8dd'
  c.fillRect(0, 0, G, Y)
  // Eteğe yakın örgü kuşağı (tuvalde alt taraf kubbe eteğidir)
  const by = Y * 0.9, bh = Y * 0.04
  c.fillStyle = KIRMIZI
  c.fillRect(0, by, G, bh)
  c.fillStyle = LACIVERT
  c.fillRect(0, by - 4, G, 4); c.fillRect(0, by + bh, G, 4)
  c.strokeStyle = CIZGI
  c.lineWidth = 3
  const adet = 64
  for (let i = 0; i < adet; i++) {
    c.fillStyle = i % 2 ? ALTIN : LACIVERT
    const x = ((i + 0.5) / adet) * G
    c.beginPath(); c.ellipse(x, by + bh / 2, G / adet * 0.42, bh * 0.36, 0, 0, Math.PI * 2); c.fill(); c.stroke()
  }
  if (gobek === 'sade') return el
  const gY = gobek === 'gul' ? 0.3 : 0.22
  c.fillStyle = gobek === 'gul' ? '#e2d2ab' : KIRMIZI
  c.fillRect(0, 0, G, Y * gY)
  const N = gobek === 'gul' ? 16 : 12
  for (let i = 0; i < N; i++) {
    const x = ((i + 0.5) / N) * G, en = G / N
    c.fillStyle = gobek === 'gul' ? (i % 2 ? KIRMIZI : LACIVERT) : ALTIN
    c.beginPath()
    c.moveTo(x - en * 0.42, Y * gY)
    c.quadraticCurveTo(x - en * 0.3, Y * gY * 0.45, x, Y * gY * 0.2)
    c.quadraticCurveTo(x + en * 0.3, Y * gY * 0.45, x + en * 0.42, Y * gY)
    c.closePath()
    c.fill()
    c.strokeStyle = '#3b2e20'; c.lineWidth = 3; c.stroke()
    c.fillStyle = gobek === 'gul' ? ALTIN : CIZGI
    c.beginPath(); c.ellipse(x, Y * gY * 0.62, en * 0.1, Y * gY * 0.18, 0, 0, Math.PI * 2); c.fill()
    // Eteğe uzanan yaprak
    c.fillStyle = LACIVERT
    c.beginPath(); c.moveTo(x, Y * gY); c.quadraticCurveTo(x - en * 0.12, Y * (gY + 0.06), x, Y * (gY + 0.11)); c.quadraticCurveTo(x + en * 0.12, Y * (gY + 0.06), x, Y * gY); c.fill()
  }
  c.fillStyle = YESIL
  c.fillRect(0, 0, G, Y * gY * 0.2)
  return el
}

/** Fotoğrafın kullanılamadığı açık yayında mihrap yüzü: altın geometrik çerçeve, koyu kavsara, basamaklı mukarnas. */
function mihrapTuval() {
  const G = 1024, Y = 1372, { el, c } = tuval(G, Y)
  c.fillStyle = KOYU
  c.fillRect(0, 0, G, Y)
  c.fillStyle = '#d9c88e'
  c.fillRect(46, 46, G - 92, Y - 46)
  const adim = 44
  c.lineWidth = 3
  for (let y = 70; y < Y; y += adim) for (let x = 70; x < G - 60; x += adim) {
    c.strokeStyle = '#6d5322'
    c.beginPath(); c.arc(x + ((y / adim) % 2) * 22, y, 16, 0, Math.PI * 2); c.stroke()
    c.fillStyle = KOYU
    c.beginPath(); c.arc(x + ((y / adim) % 2) * 22, y, 5, 0, Math.PI * 2); c.fill()
  }
  const x0 = 290, x1 = G - 290
  c.fillStyle = '#c8a24c'
  c.fillRect(x0 - 16, 240, x1 - x0 + 32, Y - 240)
  c.fillStyle = KOYU
  c.fillRect(x0, 256, x1 - x0, 620)
  for (let i = 0; i < 7; i++) {
    const w = (x1 - x0 - 40) * (1 - i / 7.6), yy = 840 - i * 78
    c.fillStyle = i % 2 ? '#d6a941' : '#b5862c'
    c.fillRect(G / 2 - w / 2, yy, w, 74)
    c.strokeStyle = '#6a4a18'; c.lineWidth = 3
    for (let x = G / 2 - w / 2; x < G / 2 + w / 2; x += 28) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 74); c.stroke() }
  }
  c.fillStyle = '#e7e2c8'
  c.fillRect(x0, 876, x1 - x0, Y - 876)
  return el
}

/** Çeşmedeki mavi-beyaz çini yüzeyler: düzen genel, gerçek pano kopyalanmaz. */
function ciniTuval() {
  const B = 512, { el, c } = tuval(B)
  c.fillStyle = '#f2f4f6'
  c.fillRect(0, 0, B, B)
  const n = 4, d = B / n
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const cx = (x + 0.5) * d, cy = (y + 0.5) * d
    c.fillStyle = (x + y) % 2 ? '#1f4f93' : '#2f8fb2'
    for (let i = 0; i < 8; i++) {
      c.save(); c.translate(cx, cy); c.rotate(i * Math.PI / 4)
      c.beginPath(); c.ellipse(0, -d * 0.24, d * 0.06, d * 0.17, 0, 0, Math.PI * 2); c.fill()
      c.restore()
    }
    c.fillStyle = '#b5352c'
    c.beginPath(); c.arc(cx, cy, d * 0.07, 0, Math.PI * 2); c.fill()
  }
  return el
}

/** Minber ve kürsünün koyu ceviz yüzünde ince oyma çizgileri. */
function oymaTuval() {
  const B = 256, { el, c } = tuval(B)
  c.fillStyle = '#4c2f1b'
  c.fillRect(0, 0, B, B)
  c.strokeStyle = '#2b190d'
  c.lineWidth = 4
  for (let i = -4; i < 8; i++) {
    c.beginPath(); c.moveTo(i * 42, 0); c.lineTo((i + 4) * 42, B); c.stroke()
    c.beginPath(); c.moveTo((i + 4) * 42, 0); c.lineTo(i * 42, B); c.stroke()
  }
  c.strokeStyle = '#8a6a3c'
  c.lineWidth = 1.5
  c.strokeRect(6, 6, B - 12, B - 12)
  return el
}

export function orhanMalzemeleri() {
  const pbr = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...p })
  const isik = (el: HTMLCanvasElement, parlak = 1.55) => new THREE.MeshBasicMaterial({ map: tekParca(el), color: new THREE.Color(parlak, parlak * 0.95, parlak * 0.86), side: THREE.DoubleSide })
  const alm = tekrarli(almasikTuval(), 1.9)
  let mihrapDoku: THREE.Texture
  if (ACIK_YAYIN) mihrapDoku = tekParca(mihrapTuval())
  else {
    const y = new THREE.TextureLoader().load('/gorseller/orhan-bey-kulliyesi/maket/mihrap-on.jpg')
    y.colorSpace = THREE.SRGBColorSpace
    y.anisotropy = 8
    mihrapDoku = y
  }
  return {
    almasik: pbr({ map: alm, bumpMap: alm, bumpScale: 0.7, side: THREE.DoubleSide }),
    dama: pbr({ map: tekParca(damaTuval()), roughness: 0.8, side: THREE.DoubleSide }),
    meydan: pbr({ map: tekrarli(meydanTuval(), 9), roughness: 0.92 }),
    cim: pbr({ map: tekrarli(cimTuval(), 4), roughness: 1 }),
    hali: pbr({ map: tekrarli(haliTuval(), 1.4), roughness: 0.96 }),
    sebekeIc: isik(sebekeTuval('#fff6df', '#efe7d4'), 1.45),
    sebekeDis: pbr({ map: tekParca(sebekeTuval('#2c3030', '#e6dfd0')), roughness: 0.8, side: THREE.DoubleSide }),
    pencereIc: isik(baklavaPencereTuval(true), 1.5),
    pencereDis: pbr({ map: tekParca(baklavaPencereTuval(false)), roughness: 0.6, side: THREE.DoubleSide }),
    gecisMihrap: pbr({ map: tekParca(gecisTuval(true)), roughness: 0.82, side: THREE.DoubleSide }),
    gecisOrta: pbr({ map: tekParca(gecisTuval(false)), roughness: 0.82, side: THREE.DoubleSide }),
    kubbeMadalyon: pbr({ map: tekParca(icKubbeTuval('madalyon')), roughness: 0.85, side: THREE.DoubleSide }),
    kubbeGul: pbr({ map: tekParca(icKubbeTuval('gul')), roughness: 0.85, side: THREE.DoubleSide }),
    kubbeSade: pbr({ map: tekParca(icKubbeTuval('sade')), roughness: 0.85, side: THREE.DoubleSide }),
    mihrap: pbr({ map: mihrapDoku, roughness: 0.45, metalness: 0.08 }),
    cini: pbr({ map: tekrarli(ciniTuval(), 0.9), roughness: 0.3 }),
    oyma: pbr({ map: tekrarli(oymaTuval(), 0.5), roughness: 0.55, side: THREE.DoubleSide }),
    pirinc: pbr({ color: '#c99a42', metalness: 0.8, roughness: 0.28 }),
    mum: pbr({ color: '#d9c98f', roughness: 0.55 }),
    demir: pbr({ color: '#1b1c1d', metalness: 0.55, roughness: 0.5 }),
    tuglaZemin: pbr({ color: '#8c4c3a', roughness: 0.8 }),
    selvi: pbr({ color: '#2f4f2c', roughness: 1 }),
    yaprak: pbr({ color: '#6d7f38', roughness: 1, flatShading: true }),
    yaprakSari: pbr({ color: '#b08a36', roughness: 1, flatShading: true }),
    govde: pbr({ color: '#5c4d3f', roughness: 1 }),
  }
}
