// Çini atölyesinin oyun mantığı: masaüstü ve VR aynı durumu kullanır. Üç.js'e bağlı değildir.
// Süreler ve bisküvi sıcaklığı oyun ölçeğidir; sır pişirimi aralığı kaynaktan gelir (src/data/cini.ts).
import { bolgeler, izIlerlet, izler, type N } from './desen.ts'

export const asamalar = ['Şekil', 'Astar ve bisküvi', 'Desen', 'Tahrir', 'Boyama', 'Sır ve fırın', 'İnceleme']
export type RenkId = 'kobalt' | 'turkuaz' | 'yesil' | 'kirmizi'
export const renkler: { id: RenkId; ad: string; canli: string; mat: string }[] = [
  { id: 'kobalt', ad: 'Kobalt mavisi', canli: '#123f96', mat: '#6f7d96' },
  { id: 'turkuaz', ad: 'Turkuaz', canli: '#159fa8', mat: '#8aa3a2' },
  { id: 'yesil', ad: 'Yeşil', canli: '#1f7d4d', mat: '#7f8f80' },
  { id: 'kirmizi', ad: 'Kırmızı', canli: '#c5301f', mat: '#a58d82' },
]
export const BISKUVI = { min: 850, max: 900 }
export const SIR_FIRINI = { min: 900, max: 940 }
export const TUTMA_SURESI = 2.5
const KOMUR_ESIK = .85, HUCRE = 8
export const TAHRIR_TOLERANS = .075

export interface Oyun {
  asama: number
  /** Astar ve bisküvi ile sır ve fırın adımlarının iki bölümü: 0 sürme, 1 fırın. */
  alt: number
  bicim: number; bicimCeza: number
  astar: number; sir: number
  isi: number; tutma: number; asiri: number; asiriSir: number; firinda: boolean
  komur: boolean[]; komurOran: number
  iz: number; izSira: number; izHata: number; izOlcum: number
  boyalar: (RenkId | null)[]; renk: RenkId
  /** Sır piştikçe 0'dan 1'e: boyalar canlanır, yüzey camlaşır. */
  canli: number
  ustaAdim: number; mesaj: string
}

export function ilkOyun(): Oyun {
  return {
    asama: 0, alt: 0, bicim: 0, bicimCeza: 0, astar: 0, sir: 0, isi: 20, tutma: 0, asiri: 0, asiriSir: 0, firinda: false,
    komur: Array(HUCRE * HUCRE).fill(false), komurOran: 0, iz: 0, izSira: 0, izHata: 0, izOlcum: 0,
    boyalar: bolgeler.map(() => null), renk: 'kobalt', canli: 0, ustaAdim: 0,
    mesaj: 'Çamur çarkın üstünde. Basılı tutup sürükleyerek şekil ver.',
  }
}
const sinir = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
function ilerle(d: Oyun, mesaj: string) { d.asama = Math.min(6, d.asama + 1); d.alt = 0; d.tutma = 0; d.isi = 20; d.firinda = false; d.mesaj = mesaj }

/** `mesafe` tabak yarıçapı cinsinden sürükleme. Çok hızlı çekmek çamuru yalpalatır. */
export function sekillendir(d: Oyun, mesafe: number, dt: number) {
  if (d.asama !== 0 || mesafe <= 0) return
  if (mesafe / Math.max(dt, .001) > 7) { d.bicimCeza = sinir(d.bicimCeza + dt * .8); d.mesaj = 'Yavaş: çamur hızlı çekilince yalpalar.'; return }
  d.bicim = sinir(d.bicim + mesafe * .16)
  if (d.bicim >= 1) { d.bicim = 1; ilerle(d, 'Tabak kurudu. Yüzeyi astarla kapla.') }
}

export function astarSur(d: Oyun, dt: number) {
  if (d.asama !== 1 || d.alt !== 0) return
  d.astar = sinir(d.astar + dt * .55)
  if (d.astar >= 1) { d.alt = 1; d.firinda = true; d.mesaj = 'Astar kurudu. Fırını ısıt, ibreyi aralıkta tut.' }
}
export function sirDok(d: Oyun, dt: number) {
  if (d.asama !== 5 || d.alt !== 0) return
  d.sir = sinir(d.sir + dt * .55)
  if (d.sir >= 1) { d.alt = 1; d.firinda = true; d.mesaj = 'Sır deseni örttü; korkma, pişince cam gibi saydamlaşır. Fırını ısıt.' }
}

/** Fırın adımı. Aralıkta kalındıkça pişer; aşırı ısı kaliteyi düşürür. */
export function firin(d: Oyun, dt: number, ates: boolean) {
  const bisk = d.asama === 1 && d.alt === 1, sir = d.asama === 5 && d.alt === 1
  if (!bisk && !sir) return
  d.isi = sinir(d.isi + dt * (ates ? 240 * (1 - d.isi / 1500) : -32), 20, 1100)
  const a = bisk ? BISKUVI : SIR_FIRINI
  if (d.isi >= a.min && d.isi <= a.max) d.tutma += dt
  else if (d.isi > a.max) {
    if (bisk) d.asiri = sinir(d.asiri + dt * .25); else d.asiriSir = sinir(d.asiriSir + dt * .25)
    d.mesaj = 'Çok sıcak: ateşi bırak, soğusun.'
  }
  if (d.tutma >= TUTMA_SURESI) {
    if (bisk) ilerle(d, 'Bisküvi hazır. Delikli kâğıdın üstünde kömür keseciğini gezdir.')
    else { d.firinda = false; d.alt = 2; d.mesaj = 'Sır eridi. Fırın soğuyor…' }
  }
}
/** Fırın sonrası görünüm değişimi; bitince incelemeye geçer. */
export function sogut(d: Oyun, dt: number) {
  if (d.asama !== 5 || d.alt !== 2) return
  d.canli = sinir(d.canli + dt * .4)
  if (d.canli >= 1) ilerle(d, 'Çinin hazır. Elinde çevir, sırın parlaklığına bak.')
}

export function komurle(d: Oyun, n: N) {
  if (d.asama !== 2) return
  const hucreler: number[] = []
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const x = Math.floor(((n[0] + ox * .12 + 1) / 2) * HUCRE), y = Math.floor(((n[1] + oy * .12 + 1) / 2) * HUCRE)
    if (x >= 0 && y >= 0 && x < HUCRE && y < HUCRE) hucreler.push(y * HUCRE + x)
  }
  hucreler.forEach((h) => { d.komur[h] = true })
  const toplam = komurHucreleri(), dolu = toplam.filter((h) => d.komur[h]).length
  d.komurOran = dolu / toplam.length
  if (d.komurOran >= KOMUR_ESIK) { d.komur.fill(true); d.komurOran = 1; ilerle(d, 'Desen noktalar halinde geçti. Şimdi samur fırçayla noktaların üstünden git.') }
}
/** Tabağın içine düşen hücreler. */
export function komurHucreleri() {
  const o: number[] = []
  for (let y = 0; y < HUCRE; y++) for (let x = 0; x < HUCRE; x++) {
    if (Math.hypot(((x + .5) / HUCRE) * 2 - 1, ((y + .5) / HUCRE) * 2 - 1) < .95) o.push(y * HUCRE + x)
  }
  return o
}
export const KOMUR_HUCRE = HUCRE

export function tahrirCiz(d: Oyun, n: N) {
  if (d.asama !== 3) return
  const iz = izler[d.iz], s = izIlerlet(iz, d.izSira, n, TAHRIR_TOLERANS)
  if (s.sira > d.izSira) { d.izHata += s.uzaklik; d.izOlcum++; d.izSira = s.sira }
  // Çizgi kapalıdır: son nokta başlangıçla aynı, fare bırakılırken son adımı kaçırmak izi kilitlemesin.
  if (d.izSira >= iz.length - 2) {
    d.izSira = 0; d.iz++
    if (d.iz >= izler.length) { d.iz = izler.length; ilerle(d, 'Tahrir bitti, kalan tekrarları çırak tamamladı. Renk seç, desenin içine dokun.') }
    else d.mesaj = 'Güzel. Sıradaki çizgiyi başından izle.'
  }
}
/** Sıradaki izin başlangıcı: fırçanın gideceği yeri göstermek için. */
export const izBasi = (d: Oyun): N | null => (d.asama === 3 && d.iz < izler.length ? izler[d.iz][d.izSira] : null)

export function boya(d: Oyun, bolge: number) {
  if (d.asama !== 4 || bolge < 0) return
  d.boyalar[bolge] = d.renk
  d.mesaj = boyaBitti(d) ? 'Boyalar mat görünür; rengini fırında bulacak. Sırlamaya geç.' : `${bolgeler.filter((_, i) => d.boyalar[i]).length}/${bolgeler.length} bölge boyandı.`
}
export const boyaBitti = (d: Oyun) => d.boyalar.every(Boolean)
export function renkSec(d: Oyun, r: RenkId) { d.renk = r }
export function boyaBitir(d: Oyun) {
  if (d.asama === 4 && boyaBitti(d)) ilerle(d, 'Sırı dök: tabağı süt beyazı bir tabaka örtecek.')
}

export function kalite(d: Oyun) {
  const tahrir = d.izOlcum ? 1 - sinir(d.izHata / d.izOlcum / TAHRIR_TOLERANS) * .5 : .7
  return Math.round(100 * sinir((1 - d.bicimCeza * .6) * .25 + (1 - d.asiri) * .2 + tahrir * .3 + (1 - d.asiriSir) * .25))
}

/** Mevcut adımı orta kalitede tamamlar. Boyamada boş kalan bölgelere dengeli bir düzen verir. */
export function ustaTamamla(d: Oyun) {
  const a = d.asama
  if (a === 0) { d.bicim = 1; ilerle(d, 'Usta şekillendirdi. Şimdi astar.') }
  else if (a === 1) { d.astar = 1; ilerle(d, 'Usta bisküviyi pişirdi. Şimdi deseni aktar.') }
  else if (a === 2) { d.komur.fill(true); d.komurOran = 1; ilerle(d, 'Usta deseni aktardı. Şimdi tahrir.') }
  else if (a === 3) { d.iz = izler.length; d.izSira = 0; d.izHata += .04; d.izOlcum++; ilerle(d, 'Usta tahriri çekti. Şimdi boya.') }
  else if (a === 4) {
    const duzen: Record<string, RenkId> = { lale: 'kirmizi', yaprak: 'yesil', merkez: 'turkuaz', halka: 'kobalt' }
    bolgeler.forEach((b, i) => { d.boyalar[i] ??= duzen[b.tur] })
    ilerle(d, 'Usta boyadı. Sırı dök.')
  } else if (a === 5) { d.sir = 1; d.firinda = false; d.alt = 2; d.mesaj = 'Usta fırını yönetti. Fırın soğuyor…' }
}

export type Eylem = { id: string; ad: string; tur: 'bas' | 'tut'; pasif?: boolean; secili?: boolean }
/** Masaüstü panelindeki ve VR panelindeki düğmeler aynı listeden çıkar. */
export function eylemler(d: Oyun): Eylem[] {
  if (d.asama === 1 && d.alt === 0) return [{ id: 'astar', ad: 'Astar sür · basılı tut', tur: 'tut' }]
  if (d.asama === 5 && d.alt === 0) return [{ id: 'sir', ad: 'Sır dök · basılı tut', tur: 'tut' }]
  if (d.firinda) return [{ id: 'ates', ad: 'Ateşi körükle · basılı tut', tur: 'tut' }]
  if (d.asama === 4) return [
    ...renkler.map((r): Eylem => ({ id: `renk:${r.id}`, ad: r.ad, tur: 'bas', secili: d.renk === r.id })),
    { id: 'boyabitti', ad: 'Sırlamaya geç →', tur: 'bas', pasif: !boyaBitti(d) },
  ]
  if (d.asama === 6) return [{ id: 'bastan', ad: 'Yeni çini yap', tur: 'bas' }]
  return []
}
