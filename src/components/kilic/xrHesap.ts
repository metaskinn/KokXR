// Kılıç atölyesi VR hesapları ve panel içeriği: three ve DOM kullanmaz, Node testinde doğrudan çalışır.
// Tarihsel metin burada yazılmaz; yalnız data/kilic.ts'ten okunur.
import { asamalar, kalite, ortalama, parcalar, sinir } from './durum.ts'
import type { Oyun } from './durum.ts'
import { hedefler } from './test.ts'
import { kilicAsamaBilgileri, kilicKaynaklari, kilicParcaNotlari, kilicTanitim } from '../../data/kilic.ts'

export interface Nokta { x: number; y: number; z: number }

// ---------------------------------------------------- istasyonlar
/** Başın duracağı yer, baktığı yer ve panelin bakışa göre yatay açısı (artı sola). Ölçüler sahnenin metresidir. */
export interface Istasyon { x: number; z: number; bakX: number; bakZ: number; panel: number }
const ATOLYE: Istasyon[] = [
  { x: 2.8, z: -1.75, bakX: 2.8, bakZ: -2.5, panel: .75 }, // Külçe: tezgâhın önü
  { x: -3.1, z: -1, bakX: -2.9, bakZ: -2, panel: -.95 }, // Isıtma: körükle ocak ağzının arası
  { x: .1, z: .55, bakX: .15, bakZ: -.1, panel: .85 }, // Dövme: örsün önü
  { x: 1.95, z: 1.05, bakX: 1.95, bakZ: .15, panel: .85 }, // Su verme: teknenin yanı
  { x: 3.05, z: -.45, bakX: 3.05, bakZ: -1.2, panel: .95 }, // Bileme: taşın önü
  { x: 2.35, z: -1.7, bakX: 2.45, bakZ: -2.45, panel: .85 }, // Kuşanma: tezgâhın önü
  { x: .42, z: 1, bakX: .42, bakZ: 0, panel: 1 }, // İnceleme: kaidenin önü
]
const AVLU = [{ x: 12, z: 1.15, bakZ: 0 }, { x: 14, z: .95, bakZ: -.1 }, { x: 16.15, z: 1, bakZ: -.1 }]

export function istasyon(d: Pick<Oyun, 'asama' | 'hedef' | 'yeniden'>): Istasyon {
  if (d.yeniden) return ATOLYE[1]
  if (d.asama < 7) return ATOLYE[d.asama]
  const a = AVLU[sinir(d.hedef, 0, 2)]
  return { x: a.x, z: a.z, bakX: a.x, bakZ: a.bakZ, panel: .95 }
}

export const OTURMA_ESIGI = 1.2, OTURMA_GOZ = 1.45

/** Rig: başı istasyona getirir, bakışı hedefe çevirir. Oturan kullanıcı (baş alçaksa) göz hizasına kaldırılır. */
export function istasyonRig(ist: Istasyon, bas: Nokta & { yaw: number }) {
  const rotY = Math.atan2(-(ist.bakX - ist.x), -(ist.bakZ - ist.z)) - bas.yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: ist.x - (bas.x * c + bas.z * s), y: bas.y < OTURMA_ESIGI ? OTURMA_GOZ - bas.y : 0,
    z: ist.z - (-bas.x * s + bas.z * c), rotY,
  }
}

/** -PI..PI aralığına indirir. */
export const aciFark = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
export const PANEL_DONUS_ESIGI = 1.55, PANEL_DONUS_SURE = 1.2
/** Durum: bakış panelden bu süre boyunca uzak kaldıysa panel görüş alanına döner; dürüstlük notu hep erişilir kalır. */
export function panelGeriGelsin(basYaw: number, panelYaw: number, uzakSure: number, dt: number) {
  const sure = Math.abs(aciFark(basYaw, panelYaw)) > PANEL_DONUS_ESIGI ? uzakSure + dt : 0
  return { sure: sure >= PANEL_DONUS_SURE ? 0 : sure, gelsin: sure >= PANEL_DONUS_SURE }
}

// ---------------------------------------------------- ışın
/** Yerel uzayda ışının X ekseni üzerindeki [0, boy] aralığına en yakın noktası: namlu tutturmak için. */
export function isinEksenX(o: Nokta, y: Nokta, boy: number) {
  const yz = y.y * y.y + y.z * y.z, boyKare = y.x * y.x + yz
  const t = yz < 1e-8 ? 0 : Math.max(0, -(o.y * y.y + o.z * y.z) / yz)
  const x = sinir(o.x + t * y.x, 0, boy)
  // Eksen noktası kırpılmış olabilir; ışın parametresi ona göre yeniden bulunur.
  const t2 = Math.max(0, ((x - o.x) * y.x - o.y * y.y - o.z * y.z) / boyKare)
  return { x, uzaklik: Math.hypot(o.x + t2 * y.x - x, o.y + t2 * y.y, o.z + t2 * y.z) }
}

/** Bölge merkezleri içinden x'e en yakın olanı. */
export function enYakinBolge(merkezler: number[], x: number) {
  let en = 0
  merkezler.forEach((m, i) => { if (Math.abs(m - x) < Math.abs(merkezler[en] - x)) en = i })
  return en
}

/** Işının z sabit düzlemini kestiği x; ışın düzleme paralelse veya geriye bakıyorsa null. */
export function duzlemX(o: Nokta, y: Nokta, z: number) {
  if (Math.abs(y.z) < 1e-4) return null
  const t = (z - o.z) / y.z
  return t > 0 ? o.x + t * y.x : null
}
/** Bileme: namluyu tutmuş gibi; ışın sağa kayınca namlu sağa gider, temas noktası başa doğru kayar. */
export function bileAdim(u: number, dx: number) { return sinir(u - sinir(dx, -.2, .2) / 1.06, 0, 1) }

// ---------------------------------------------------- kuşanma
/** Parça merkezi yerine bu kadar yakınken bırakılırsa oturur (metre); bekleme yeri 18 cm uzaktadır, tutup bırakmak yetmez. */
export const PARCA_OTURMA_ESIGI = .09, PARCA_DOKUNMA = .12
export const parcaOturur = (uzaklik: number) => uzaklik < PARCA_OTURMA_ESIGI

// ---------------------------------------------------- çekiç
export const CEKIC_HIZI = 1.6, CEKIC_SILAH = .4
/** Kumandayı hızla indirme: her inişte bir kez tetikler; yavaşlamadan yeniden silahlanmaz. */
export function cekicSalinimi(dikeyHiz: number, silahli: boolean) {
  if (silahli && dikeyHiz < -CEKIC_HIZI) return { vur: true, silahli: false }
  return { vur: false, silahli: silahli || dikeyHiz > -CEKIC_SILAH }
}

// ---------------------------------------------------- savurma
export interface Savurma { a: Nokta; b: Nokta; sure: number }
export const SAVURMA_BASLA = 1.8, SAVURMA_BIT = .9, SAVURMA_EN_UZUN = .4, SAVURMA_EN_KISA_YOL = .25, SAVURMA_ARA = .5

/** Namlu noktasının hız geçmişinden savurmaları ayırır. Dünya metresi ve saniye alır. */
export class SavurmaOlcer {
  private once: Nokta | null = null
  private bas: Nokta | null = null
  private sure = 0
  private bekle = 0
  /** Sürüyorsa namlu izi çizilir. */
  suruyor = false
  sifirla() { this.once = null; this.bas = null; this.sure = 0; this.suruyor = false; this.bekle = 0 }
  adim(p: Nokta, dt: number): Savurma | null {
    const once = this.once
    this.once = { x: p.x, y: p.y, z: p.z }
    this.bekle = Math.max(0, this.bekle - dt)
    if (!once || dt <= 0) return null
    const hiz = Math.hypot(p.x - once.x, p.y - once.y, p.z - once.z) / dt
    if (!this.bas) {
      if (hiz < SAVURMA_BASLA || this.bekle > 0) return null
      this.bas = once; this.sure = dt; this.suruyor = true
      return null
    }
    this.sure += dt
    if (hiz >= SAVURMA_BIT && this.sure < SAVURMA_EN_UZUN) return null
    const a = this.bas, sure = this.sure
    this.bas = null; this.suruyor = false
    if (Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z) < SAVURMA_EN_KISA_YOL) return null
    this.bekle = SAVURMA_ARA
    return { a, b: { x: p.x, y: p.y, z: p.z }, sure }
  }
}

export interface Kutu { minX: number; maxX: number; minY: number; maxY: number; z: number }
export const SAVURMA_TOLERANS = .5
// Masaüstünde dx/dy sahnenin ekran kesridir; hedef düzleminde görünen genişlik yaklaşık bu kadar metredir.
const EKRAN_METRE = 2.5

/**
 * Savurmayı kesimHesapla girdilerine ve hedef düzlemindeki çizgiye çevirir.
 * Kol boyu ve ıraksak bakış yüzünden çizgi hedefe az farkla değmeyebilir; yakınsa en küçük kaydırmayla hedefin içine alınır.
 */
export function savurmaKesimi(s: Savurma, k: Kutu) {
  const fx = s.b.x - s.a.x, fy = s.b.y - s.a.y
  const mx = (k.minX + k.maxX) / 2, my = (k.minY + k.maxY) / 2, l2 = fx * fx + fy * fy || 1e-6
  const t = sinir(((mx - s.a.x) * fx + (my - s.a.y) * fy) / l2)
  const px = s.a.x + fx * t, py = s.a.y + fy * t
  const qx = sinir(px, k.minX, k.maxX), qy = sinir(py, k.minY, k.maxY)
  const yakin = Math.hypot(qx - px, qy - py) <= SAVURMA_TOLERANS
  const kx = yakin ? qx - px : 0, ky = yakin ? qy - py : 0
  return {
    a: { x: s.a.x + kx, y: s.a.y + ky, z: k.z }, b: { x: s.b.x + kx, y: s.b.y + ky, z: k.z },
    dx: fx / EKRAN_METRE, dy: -fy / EKRAN_METRE, sure: s.sure, yakin,
  }
}

// ---------------------------------------------------- panel içeriği
export interface PanelDugme { id: string; ad: string; tut?: boolean; pasif?: boolean; secili?: boolean }
export interface PanelDurumu {
  adim: string; baslik: string; yonerge: string; mesaj: string
  isi?: { deger: number; aralik: string }
  ilerleme?: { metin: string; oran: number }
  bolgeler?: { oran: number[]; secili: number }
  kalite?: { puan: number; olcu: [string, number][]; notlar: string[] }
  dugmeler: PanelDugme[]; ortak: PanelDugme[]
}

const yonergeler = [
  'Işını tezgâhtaki külçeye tut, tetiğe bas.',
  'Işını körüğe tut, tetiği basılı tut. Çeliğin rengini izle; 750–1150 aralığında örse geç.',
  'Işını namluya tut, tetikle vur; kumandayı hızla indirerek de vurabilirsin. Her bölgeyi döv.',
  'Isının 780–880 aralığına gelmesini bekle. Suya daldırmak için tetiği basılı tut.',
  'Tetiği basılı tut, ışını namlu boyunca gezdir. Her bölgeyi bile; aynı yerde fazla kalma.',
  'Havada bekleyen parçayı tetik veya yan tuşla tut, kılıçtaki yerine götür, bırak. Parçalar sırayla takılır.',
  'Sağ çubukla çevir. Numaralı noktaların notları bu panelde açılır.',
  'Kılıç elinde. Hedefi seç, hızlı bir savuruşla kes; diğer elinle paneli kullan. Düğmeyle de kesebilirsin.',
]

export function panelDurumu(d: Oyun, s: { reheat: boolean; not: number | null }): PanelDurumu {
  const a = d.asama, usta = d.usta, isiGercek = ortalama(d, 'isi'), isi = Math.round(isiGercek / 10) * 10, isitma = a === 1 || d.yeniden
  const dugmeler: PanelDugme[] = []
  const r: PanelDurumu = {
    adim: `ADIM 0${a + 1} / 08`, baslik: asamalar[a], yonerge: d.yeniden ? yonergeler[1] : yonergeler[a], mesaj: d.mesaj, dugmeler,
    ortak: [
      { id: 'komut:usta', ad: usta ? 'Usta çalışıyor…' : 'Ustaya bırak', pasif: usta },
      { id: 'komut:bastan', ad: 'Baştan başla' },
      { id: 'cik', ad: "VR'dan çık" },
    ],
  }
  if (a >= 1 && a <= 3) r.isi = { deger: isi, aralik: a === 3 ? '780–880 ideal' : '750–1150 ideal' }
  if (a === 0) dugmeler.push({ id: 'komut:al', ad: 'Külçeyi al' })
  else if (isitma) dugmeler.push({ id: 'tut:koruk', ad: 'Körüğü basılı tut', tut: true }, { id: 'komut:devam', ad: 'Örse geç', pasif: isiGercek < 750 })
  else if (a === 2) dugmeler.push({ id: 'komut:vur', ad: 'Seçili bölgeye vur' }, { id: 'komut:yeniden', ad: 'Yeniden ısıt' })
  else if (a === 3) {
    dugmeler.push({ id: 'tut:su', ad: 'Suya daldır · basılı tut', tut: true }, { id: 'tut:koruk', ad: 'Su öncesi ısıt · basılı tut', tut: true, secili: s.reheat })
    r.ilerleme = { metin: 'Su verme', oran: sinir(d.daldirma / 1.5) }
  } else if (a === 4) dugmeler.push({ id: 'tut:bile', ad: 'Seçili bölgeyi bile · basılı tut', tut: true })
  else if (a === 5) {
    dugmeler.push({ id: 'komut:tak', ad: 'Sıradaki parçayı yerleştir' })
    r.ilerleme = { metin: `${d.takilan} / ${parcalar.length} parça yerinde`, oran: d.takilan / parcalar.length }
  } else if (a === 6) {
    kilicParcaNotlari.forEach((p, i) => dugmeler.push({ id: `not:${i}`, ad: `${i + 1}. ${p.baslik}`, secili: s.not === i }))
    dugmeler.push({ id: 'komut:devam', ad: 'Test alanına geç' })
    if (s.not !== null) dugmeler.push({ id: 'not:kapat', ad: 'Notu kapat' })
  } else if (a === 7) {
    hedefler.forEach((ad, i) => dugmeler.push({ id: `hedef:${i}`, ad: d.hasarlar[i] > 0 ? `${ad} · hasar %${Math.round(d.hasarlar[i] * 100)}` : ad, secili: d.hedef === i }))
    dugmeler.push({ id: 'komut:kes', ad: 'Kes', pasif: d.kirildi }, { id: 'komut:hedefleri-yenile', ad: 'Hedefleri yenile' })
  }
  if ((a === 2 && !d.yeniden) || a === 4) {
    const alan = a === 2 ? 'p' : 'cilt'
    r.bolgeler = { oran: d.bolgeler.map(b => b[alan]), secili: d.secili }
    r.ilerleme = { metin: `${a === 2 ? 'Biçim' : 'Bileme'} %${Math.round(ortalama(d, alan) * 100)} · Bölge ${d.secili + 1}`, oran: ortalama(d, alan) }
  }
  if (a >= 6) {
    const notlar: string[] = []
    if (d.catlak) notlar.push('Namluda çatlak var.')
    if (d.rozet) notlar.push('Kılıç Ustası')
    if (a === 7) notlar.push(`Kesim puanı: ${d.puan}/100`)
    r.kalite = { puan: kalite(d), olcu: [['Sertlik', d.sertlik], ['Keskinlik', ortalama(d, 'cilt')], ['Biçim', d.bicim]], notlar }
  }
  if (usta) r.dugmeler = dugmeler.map(b => ({ ...b, pasif: true }))
  return r
}

/** Bilgi panelinin içeriği; dürüstlük notu hiçbir durumda çıkmaz. */
export function bilgiDurumu(asama: number, not: number | null) {
  const p = asama === 6 && not !== null ? kilicParcaNotlari[not] : null
  const k = asama === 3 ? kilicAsamaBilgileri.su : asama >= 5 ? kilicAsamaBilgileri.kusanma : kilicAsamaBilgileri.kulce
  return {
    baslik: p ? p.baslik : 'Atölye notu', metin: p ? p.metin : k.metin, kaynak: `Kaynak: ${kilicKaynaklari[p ? p.kaynak : k.kaynak]}`,
    durustlukBaslik: 'MODEL HAKKINDA', durustluk: kilicTanitim.durustluk,
  }
}

// ---------------------------------------------------- panel yerleşimi (tuval pikseli)
export const PANEL_G = 1024, PANEL_Y = 820
export interface Kare { id: string; x: number; y: number; g: number; y2: number; dugme: PanelDugme; bolge?: boolean }
const KENAR = 32, ARA = 10, SATIR = 62

/** Düğmeler alttan yukarı dizilir: en altta ortak satır, üstünde aşama düğmeleri, onun üstünde bölge hücreleri. */
export function panelYerlesim(p: Pick<PanelDurumu, 'dugmeler' | 'ortak' | 'bolgeler'>) {
  const kareler: Kare[] = []
  const gen = PANEL_G - 2 * KENAR
  let alt = PANEL_Y - 20
  const satir = (liste: PanelDugme[], sutun: number) => {
    const g = (gen - (sutun - 1) * ARA) / sutun
    const satirSay = Math.ceil(liste.length / sutun)
    alt -= satirSay * SATIR + (satirSay - 1) * ARA
    liste.forEach((d, i) => {
      const y = alt + Math.floor(i / sutun) * (SATIR + ARA)
      kareler.push({ id: d.id, x: KENAR + (i % sutun) * (g + ARA), y, g, y2: y + SATIR, dugme: d })
    })
    alt -= ARA + 4
  }
  satir(p.ortak, 3)
  if (p.dugmeler.length) satir(p.dugmeler, 2)
  if (p.bolgeler) {
    const g = (gen - 11 * 6) / 12, y = alt - 50
    p.bolgeler.oran.forEach((_, i) => kareler.push({ id: `bolge:${i}`, x: KENAR + i * (g + 6), y, g, y2: y + 50, bolge: true, dugme: { id: `bolge:${i}`, ad: String(i + 1) } }))
    alt = y - ARA
  }
  return { kareler, icerikAlt: alt }
}

/** uv (v=1 üst kenar) tuvaldeki kareye düşüyorsa onu verir; pasif de döner, karar çağırana bırakılır. */
export function panelKare(kareler: Kare[], u: number, v: number) {
  const x = u * PANEL_G, y = (1 - v) * PANEL_Y
  return kareler.find(k => x >= k.x && x <= k.x + k.g && y >= k.y && y <= k.y2) ?? null
}
