// Kılıç atölyesi VR hesapları ve panel içeriği: three ve DOM kullanmaz, Node testinde doğrudan çalışır.
// Tarihsel metin burada yazılmaz; yalnız data/kilic.ts'ten okunur.
import { stages, quality, average, pieces, limit } from './state.ts'
import type { Game } from './state.ts'
import { targets } from './test.ts'
import { swordStageInfo, swordSources, swordPartNotes, swordIntro } from '../../../../content/sword.ts'

export interface Point { x: number; y: number; z: number }

// ---------------------------------------------------- istasyonlar
/** Başın duracağı yer, baktığı yer ve panelin bakışa göre yatay açısı (artı sola). Ölçüler sahnenin metresidir. */
export interface Station { x: number; z: number; lookX: number; lookZ: number; panel: number }
const WORKSHOP: Station[] = [
  { x: 2.8, z: -1.75, lookX: 2.8, lookZ: -2.5, panel: .75 }, // Külçe: tezgâhın önü
  { x: -3.1, z: -1, lookX: -2.9, lookZ: -2, panel: -.95 }, // Isıtma: körükle ocak ağzının arası
  { x: .1, z: .55, lookX: .15, lookZ: -.1, panel: .85 }, // Dövme: örsün önü
  { x: 1.95, z: 1.05, lookX: 1.95, lookZ: .15, panel: .85 }, // Su verme: teknenin yanı
  { x: 3.05, z: -.45, lookX: 3.05, lookZ: -1.2, panel: .95 }, // Bileme: taşın önü
  { x: 2.35, z: -1.7, lookX: 2.45, lookZ: -2.45, panel: .85 }, // Kuşanma: tezgâhın önü
  { x: .42, z: 1, lookX: .42, lookZ: 0, panel: 1 }, // İnceleme: kaidenin önü
]
const COURTYARD = [{ x: 12, z: 1.15, lookZ: 0 }, { x: 14, z: .95, lookZ: -.1 }, { x: 16.15, z: 1, lookZ: -.1 }]

export function station(d: Pick<Game, 'stage' | 'target' | 'again'>): Station {
  if (d.again) return WORKSHOP[1]
  if (d.stage < 7) return WORKSHOP[d.stage]
  const a = COURTYARD[limit(d.target, 0, 2)]
  return { x: a.x, z: a.z, lookX: a.x, lookZ: a.lookZ, panel: .95 }
}

export const SEAT_THRESHOLD = 1.2, SEAT_EYE = 1.45

/** Rig: başı istasyona getirir, bakışı hedefe çevirir. Oturan kullanıcı (baş alçaksa) göz hizasına kaldırılır. */
export function stationRig(ist: Station, head: Point & { yaw: number }) {
  const rotY = Math.atan2(-(ist.lookX - ist.x), -(ist.lookZ - ist.z)) - head.yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: ist.x - (head.x * c + head.z * s), y: head.y < SEAT_THRESHOLD ? SEAT_EYE - head.y : 0,
    z: ist.z - (-head.x * s + head.z * c), rotY,
  }
}

/** -PI..PI aralığına indirir. */
export const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
export const PANEL_TURN_THRESHOLD = 1.55, PANEL_TURN_DURATION = 1.2
/** Durum: bakış panelden bu süre boyunca uzak kaldıysa panel görüş alanına döner; dürüstlük notu hep erişilir kalır. */
export function panelShouldReturn(headYaw: number, panelYaw: number, farDuration: number, dt: number) {
  const sure = Math.abs(angleDiff(headYaw, panelYaw)) > PANEL_TURN_THRESHOLD ? farDuration + dt : 0
  return { sure: sure >= PANEL_TURN_DURATION ? 0 : sure, shouldCome: sure >= PANEL_TURN_DURATION }
}

// ---------------------------------------------------- ışın
/** Yerel uzayda ışının X ekseni üzerindeki [0, boy] aralığına en yakın noktası: namlu tutturmak için. */
export function rayAxisX(o: Point, y: Point, length: number) {
  const yz = y.y * y.y + y.z * y.z, lenFrame = y.x * y.x + yz
  const t = yz < 1e-8 ? 0 : Math.max(0, -(o.y * y.y + o.z * y.z) / yz)
  const x = limit(o.x + t * y.x, 0, length)
  // Eksen noktası kırpılmış olabilir; ışın parametresi ona göre yeniden bulunur.
  const t2 = Math.max(0, ((x - o.x) * y.x - o.y * y.y - o.z * y.z) / lenFrame)
  return { x, distance: Math.hypot(o.x + t2 * y.x - x, o.y + t2 * y.y, o.z + t2 * y.z) }
}

/** Bölge merkezleri içinden x'e en yakın olanı. */
export function nearestRegion(centers: number[], x: number) {
  let en = 0
  centers.forEach((m, i) => { if (Math.abs(m - x) < Math.abs(centers[en] - x)) en = i })
  return en
}

/** Işının z sabit düzlemini kestiği x; ışın düzleme paralelse veya geriye bakıyorsa null. */
export function planeX(o: Point, y: Point, z: number) {
  if (Math.abs(y.z) < 1e-4) return null
  const t = (z - o.z) / y.z
  return t > 0 ? o.x + t * y.x : null
}
/** Bileme: namluyu tutmuş gibi; ışın sağa kayınca namlu sağa gider, temas noktası başa doğru kayar. */
export function wristStep(u: number, dx: number) { return limit(u - limit(dx, -.2, .2) / 1.06, 0, 1) }

// ---------------------------------------------------- kuşanma
/** Parça merkezi yerine bu kadar yakınken bırakılırsa oturur (metre); bekleme yeri 18 cm uzaktadır, tutup bırakmak yetmez. */
export const PIECE_SEAT_THRESHOLD = .09, PIECE_TOUCH = .12
export const pieceSnaps = (distance: number) => distance < PIECE_SEAT_THRESHOLD

// ---------------------------------------------------- çekiç
export const HAMMER_SPEED = 1.6, HAMMER_WEAPON = .4
/** Kumandayı hızla indirme: her inişte bir kez tetikler; yavaşlamadan yeniden silahlanmaz. */
export function hammerSwing(verticalSpeed: number, armed: boolean) {
  if (armed && verticalSpeed < -HAMMER_SPEED) return { strike: true, armed: false }
  return { strike: false, armed: armed || verticalSpeed > -HAMMER_WEAPON }
}

/** Her el kendi yakın zamandaki hedefini tutar; kaybolan poz veya rig sıçraması darbe sayılmaz. */
export class HammerMeter {
  private onceY: number | null = null
  private region: number | null = null
  private targetAge = 0
  private armed = true
  reset() { this.onceY = null; this.region = null; this.targetAge = 0; this.armed = true }
  fireTrigger() { this.armed = false }
  step(y: number, dt: number, region: number | null): number | null {
    if (!Number.isFinite(y) || !Number.isFinite(dt) || dt <= 0 || dt > .1) { this.reset(); return null }
    const speed = this.onceY === null ? 0 : (y - this.onceY) / dt
    this.onceY = y
    this.targetAge += dt
    if (region !== null) { this.region = region; this.targetAge = 0 }
    if (this.targetAge > .18) this.region = null
    const s = hammerSwing(speed, this.armed)
    this.armed = s.armed
    return s.strike ? this.region : null
  }
}

// ---------------------------------------------------- savurma
export interface Swing { a: Point; b: Point; sure: number }
export const SWING_START = 1.8, SWING_END = .9, SWING_LONGEST = .4, SWING_SHORTEST_PATH = .25, SWING_GAP = .5

/** Namlu noktasının hız geçmişinden savurmaları ayırır. Dünya metresi ve saniye alır. */
export class SwingMeter {
  private once: Point | null = null
  private head: Point | null = null
  private sure = 0
  private wait = 0
  /** Sürüyorsa namlu izi çizilir. */
  ongoing = false
  reset() { this.once = null; this.head = null; this.sure = 0; this.ongoing = false; this.wait = 0 }
  step(p: Point, dt: number): Swing | null {
    const once = this.once
    this.once = { x: p.x, y: p.y, z: p.z }
    this.wait = Math.max(0, this.wait - dt)
    if (!once || dt <= 0) return null
    const speed = Math.hypot(p.x - once.x, p.y - once.y, p.z - once.z) / dt
    if (!this.head) {
      if (speed < SWING_START || this.wait > 0) return null
      this.head = once; this.sure = dt; this.ongoing = true
      return null
    }
    this.sure += dt
    if (speed >= SWING_END && this.sure < SWING_LONGEST) return null
    const a = this.head, sure = this.sure
    this.head = null; this.ongoing = false
    if (Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z) < SWING_SHORTEST_PATH) return null
    this.wait = SWING_GAP
    return { a, b: { x: p.x, y: p.y, z: p.z }, sure }
  }
}

export interface Box { minX: number; maxX: number; minY: number; maxY: number; z: number }
export const SWING_TOLERANCE = .5
// Masaüstünde dx/dy sahnenin ekran kesridir; hedef düzleminde görünen genişlik yaklaşık bu kadar metredir.
const SCREEN_METER = 2.5

/**
 * Savurmayı kesimHesapla girdilerine ve hedef düzlemindeki çizgiye çevirir.
 * Kol boyu ve ıraksak bakış yüzünden çizgi hedefe az farkla değmeyebilir; yakınsa en küçük kaydırmayla hedefin içine alınır.
 */
export function swingCut(s: Swing, k: Box) {
  const fx = s.b.x - s.a.x, fy = s.b.y - s.a.y
  const mx = (k.minX + k.maxX) / 2, my = (k.minY + k.maxY) / 2, l2 = fx * fx + fy * fy || 1e-6
  const t = limit(((mx - s.a.x) * fx + (my - s.a.y) * fy) / l2)
  const px = s.a.x + fx * t, py = s.a.y + fy * t
  const qx = limit(px, k.minX, k.maxX), qy = limit(py, k.minY, k.maxY)
  const near = Math.hypot(qx - px, qy - py) <= SWING_TOLERANCE
  const kx = near ? qx - px : 0, ky = near ? qy - py : 0
  return {
    a: { x: s.a.x + kx, y: s.a.y + ky, z: k.z }, b: { x: s.b.x + kx, y: s.b.y + ky, z: k.z },
    dx: fx / SCREEN_METER, dy: -fy / SCREEN_METER, sure: s.sure, near,
  }
}

// ---------------------------------------------------- panel içeriği
export interface PanelButton { id: string; ad: string; hold?: boolean; passive?: boolean; selected?: boolean }
export interface PanelState {
  step: string; title: string; instruction: string; message: string
  heat?: { value: number; interval: string }
  progress?: { text: string; ratio: number }
  regions?: { ratio: number[]; selected: number }
  quality?: { score: number; measurement: [string, number][]; notes: string[] }
  buttons: PanelButton[]; common: PanelButton[]
}

const instructions = [
  'Işını tezgâhtaki külçeye tut, tetiğe bas.',
  'Işını körüğe tut, tetiği basılı tut. Çeliğin rengini izle; 750–1150 aralığında örse geç.',
  'Işını namluya tut, tetikle vur; kumandayı hızla indirerek de vurabilirsin. Her bölgeyi döv.',
  'Isının 780–880 aralığına gelmesini bekle. Suya daldırmak için tetiği basılı tut.',
  'Tetiği basılı tut, ışını namlu boyunca gezdir. Her bölgeyi bile; aynı yerde fazla kalma.',
  'Havada bekleyen parçayı tetik veya yan tuşla tut, kılıçtaki yerine götür, bırak. Parçalar sırayla takılır.',
  'Sağ çubukla çevir. Numaralı noktaların notları bu panelde açılır.',
  'Kılıç elinde. Hedefi seç, hızlı bir savuruşla kes; diğer elinle paneli kullan. Düğmeyle de kesebilirsin.',
]

export function panelState(d: Game, s: { reheat: boolean; not: number | null }): PanelState {
  const a = d.stage, master = d.master, realHeat = average(d, 'heat'), heat = Math.round(realHeat / 10) * 10, heatingPhase = a === 1 || d.again
  const buttons: PanelButton[] = []
  const r: PanelState = {
    step: `ADIM 0${a + 1} / 08`, title: stages[a], instruction: d.again ? instructions[1] : instructions[a], message: d.message, buttons,
    common: [
      { id: 'command:master', ad: master ? 'Usta çalışıyor…' : 'Ustaya bırak', passive: master },
      { id: 'command:fromStart', ad: 'Baştan başla' },
      { id: 'exit', ad: "VR'dan çık" },
    ],
  }
  if (a >= 1 && a <= 3) r.heat = { value: heat, interval: a === 3 ? '780–880 ideal' : '750–1150 ideal' }
  if (a === 0) buttons.push({ id: 'command:al', ad: 'Külçeyi al' })
  else if (heatingPhase) buttons.push({ id: 'hold:bellows', ad: 'Körüğü basılı tut', hold: true }, { id: 'command:continue', ad: 'Örse geç', passive: realHeat < 750 })
  else if (a === 2) buttons.push({ id: 'command:strike', ad: 'Seçili bölgeye vur' }, { id: 'command:again', ad: 'Yeniden ısıt' })
  else if (a === 3) {
    buttons.push({ id: 'hold:water', ad: 'Suya daldır · basılı tut', hold: true }, { id: 'hold:bellows', ad: 'Su öncesi ısıt · basılı tut', hold: true, selected: s.reheat })
    r.progress = { text: 'Su verme', ratio: limit(d.dip / 1.5) }
  } else if (a === 4) buttons.push({ id: 'hold:wrist', ad: 'Seçili bölgeyi bile · basılı tut', hold: true })
  else if (a === 5) {
    buttons.push({ id: 'command:clink', ad: 'Sıradaki parçayı yerleştir' })
    r.progress = { text: `${d.attached} / ${pieces.length} parça yerinde`, ratio: d.attached / pieces.length }
  } else if (a === 6) {
    swordPartNotes.forEach((p, i) => buttons.push({ id: `not:${i}`, ad: `${i + 1}. ${p.title}`, selected: s.not === i }))
    buttons.push({ id: 'command:continue', ad: 'Test alanına geç' })
    if (s.not !== null) buttons.push({ id: 'not:close', ad: 'Notu kapat' })
  } else if (a === 7) {
    targets.forEach((ad, i) => buttons.push({ id: `target:${i}`, ad: d.damages[i] > 0 ? `${ad} · hasar %${Math.round(d.damages[i] * 100)}` : ad, selected: d.target === i }))
    buttons.push({ id: 'command:cutOff', ad: 'Kes', passive: d.broke }, { id: 'command:targets-renew', ad: 'Hedefleri yenile' })
  }
  if ((a === 2 && !d.again) || a === 4) {
    const area = a === 2 ? 'p' : 'skin'
    r.regions = { ratio: d.regions.map(b => b[area]), selected: d.selected }
    r.progress = { text: `${a === 2 ? 'Biçim' : 'Bileme'} %${Math.round(average(d, area) * 100)} · Bölge ${d.selected + 1}`, ratio: average(d, area) }
  }
  if (a >= 6) {
    const notes: string[] = []
    if (d.crack_) notes.push('Namluda çatlak var.')
    if (d.rosette) notes.push('Kılıç Ustası')
    if (a === 7) notes.push(`Kesim puanı: ${d.score}/100`)
    r.quality = { score: quality(d), measurement: [['Sertlik', d.hardness], ['Keskinlik', average(d, 'skin')], ['Biçim', d.form]], notes }
  }
  if (master) r.buttons = buttons.map(b => ({ ...b, passive: true }))
  return r
}

/** Bilgi panelinin içeriği; dürüstlük notu hiçbir durumda çıkmaz. */
export function infoState(stage: number, not: number | null) {
  const p = stage === 6 && not !== null ? swordPartNotes[not] : null
  const k = stage === 3 ? swordStageInfo.water : stage >= 5 ? swordStageInfo.equip : swordStageInfo.ingot
  return {
    title: p ? p.title : 'Atölye notu', text: p ? p.text : k.text, source: `Kaynak: ${swordSources[p ? p.source : k.source]}`,
    honestyTitle: 'MODEL HAKKINDA', honesty: swordIntro.honesty,
  }
}

// ---------------------------------------------------- panel yerleşimi (tuval pikseli)
export const PANEL_G = 1024, PANEL_Y = 820
export interface Frame { id: string; x: number; y: number; g: number; y2: number; button: PanelButton; region?: boolean }
const EDGE = 32, BETWEEN = 10, LINE = 62

/** Düğmeler alttan yukarı dizilir: en altta ortak satır, üstünde aşama düğmeleri, onun üstünde bölge hücreleri. */
export function panelLayout(p: Pick<PanelState, 'buttons' | 'common' | 'regions'>) {
  const squares: Frame[] = []
  const gen = PANEL_G - 2 * EDGE
  let alt = PANEL_Y - 20
  const line = (list: PanelButton[], column: number) => {
    const g = (gen - (column - 1) * BETWEEN) / column
    const lineCount = Math.ceil(list.length / column)
    alt -= lineCount * LINE + (lineCount - 1) * BETWEEN
    list.forEach((d, i) => {
      const y = alt + Math.floor(i / column) * (LINE + BETWEEN)
      squares.push({ id: d.id, x: EDGE + (i % column) * (g + BETWEEN), y, g, y2: y + LINE, button: d })
    })
    alt -= BETWEEN + 4
  }
  line(p.common, 3)
  if (p.buttons.length) line(p.buttons, 2)
  if (p.regions) {
    const g = (gen - 11 * 6) / 12, y = alt - 50
    p.regions.ratio.forEach((_, i) => squares.push({ id: `region:${i}`, x: EDGE + i * (g + 6), y, g, y2: y + 50, region: true, button: { id: `region:${i}`, ad: String(i + 1) } }))
    alt = y - BETWEEN
  }
  return { squares, contentBottom: alt }
}

/** uv (v=1 üst kenar) tuvaldeki kareye düşüyorsa onu verir; pasif de döner, karar çağırana bırakılır. */
export function panelFrame(squares: Frame[], u: number, v: number) {
  const x = u * PANEL_G, y = (1 - v) * PANEL_Y
  return squares.find(k => x >= k.x && x <= k.x + k.g && y >= k.y && y <= k.y2) ?? null
}
