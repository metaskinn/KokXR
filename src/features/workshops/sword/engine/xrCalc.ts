// Sword workshop VR calculations and panel content: uses neither three nor the DOM, runs directly in the Node test.
// No historical text is written here; it is only read from content/sword.ts.
import { stages, quality, average, pieces, limit } from './state.ts'
import type { Game } from './state.ts'
import { targets } from './test.ts'
import { swordStageInfo, swordSources, swordPartNotes, swordIntro } from '../../../../content/sword.ts'

export interface Point { x: number; y: number; z: number }

// ---------------------------------------------------- stations
/** Where the head stands, where it looks, and the panel's horizontal angle relative to the gaze (positive is left). Units are scene meters. */
export interface Station { x: number; z: number; lookX: number; lookZ: number; panel: number }
const WORKSHOP: Station[] = [
  { x: 2.8, z: -1.75, lookX: 2.8, lookZ: -2.5, panel: .75 }, // Ingot: in front of the workbench
  { x: -3.1, z: -1, lookX: -2.9, lookZ: -2, panel: -.95 }, // Heating: between the bellows and the forge mouth
  { x: .1, z: .55, lookX: .15, lookZ: -.1, panel: .85 }, // Forging: in front of the anvil
  { x: 1.95, z: 1.05, lookX: 1.95, lookZ: .15, panel: .85 }, // Quenching: beside the trough
  { x: 3.05, z: -.45, lookX: 3.05, lookZ: -1.2, panel: .95 }, // Grinding: in front of the stone
  { x: 2.35, z: -1.7, lookX: 2.45, lookZ: -2.45, panel: .85 }, // Assembly: in front of the workbench
  { x: .42, z: 1, lookX: .42, lookZ: 0, panel: 1 }, // Inspection: in front of the pedestal
]
const COURTYARD = [{ x: 12, z: 1.15, lookZ: 0 }, { x: 14, z: .95, lookZ: -.1 }, { x: 16.15, z: 1, lookZ: -.1 }]

export function station(d: Pick<Game, 'stage' | 'target' | 'again'>): Station {
  if (d.again) return WORKSHOP[1]
  if (d.stage < 7) return WORKSHOP[d.stage]
  const a = COURTYARD[limit(d.target, 0, 2)]
  return { x: a.x, z: a.z, lookX: a.x, lookZ: a.lookZ, panel: .95 }
}

export const SEAT_THRESHOLD = 1.2, SEAT_EYE = 1.45

/** Rig: brings the head to the station and turns the gaze to the target. A seated user (low head) is raised to eye level. */
export function stationRig(st: Station, head: Point & { yaw: number }) {
  const rotY = Math.atan2(-(st.lookX - st.x), -(st.lookZ - st.z)) - head.yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: st.x - (head.x * c + head.z * s), y: head.y < SEAT_THRESHOLD ? SEAT_EYE - head.y : 0,
    z: st.z - (-head.x * s + head.z * c), rotY,
  }
}

/** Wraps into the -PI..PI range. */
export const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
export const PANEL_TURN_THRESHOLD = 1.55, PANEL_TURN_DURATION = 1.2
/** State: if the gaze stays away from the panel for this long, the panel returns to view; the honesty note always stays reachable. */
export function panelShouldReturn(headYaw: number, panelYaw: number, farDuration: number, dt: number) {
  const duration = Math.abs(angleDiff(headYaw, panelYaw)) > PANEL_TURN_THRESHOLD ? farDuration + dt : 0
  return { duration: duration >= PANEL_TURN_DURATION ? 0 : duration, shouldCome: duration >= PANEL_TURN_DURATION }
}

// ---------------------------------------------------- ray
/** Closest point of the ray to the [0, length] range on the X axis in local space: for aiming at the blade. */
export function rayAxisX(o: Point, y: Point, length: number) {
  const yz = y.y * y.y + y.z * y.z, lenFrame = y.x * y.x + yz
  const t = yz < 1e-8 ? 0 : Math.max(0, -(o.y * y.y + o.z * y.z) / yz)
  const x = limit(o.x + t * y.x, 0, length)
  // The axis point may have been clamped; the ray parameter is recomputed from it.
  const t2 = Math.max(0, ((x - o.x) * y.x - o.y * y.y - o.z * y.z) / lenFrame)
  return { x, distance: Math.hypot(o.x + t2 * y.x - x, o.y + t2 * y.y, o.z + t2 * y.z) }
}

/** The region center closest to x. */
export function nearestRegion(centers: number[], x: number) {
  let en = 0
  centers.forEach((m, i) => { if (Math.abs(m - x) < Math.abs(centers[en] - x)) en = i })
  return en
}

/** The x where the ray crosses the constant-z plane; null if the ray is parallel to the plane or points away. */
export function planeX(o: Point, y: Point, z: number) {
  if (Math.abs(y.z) < 1e-4) return null
  const t = (z - o.z) / y.z
  return t > 0 ? o.x + t * y.x : null
}
/** Grinding: as if holding the blade; when the ray moves right the blade moves right and the contact point slides toward the start. */
export function wristStep(u: number, dx: number) { return limit(u - limit(dx, -.2, .2) / 1.06, 0, 1) }

// ---------------------------------------------------- assembly
/** A part seats if released with its center this close to its slot (meters); the waiting spot is 18 cm away, so grabbing and releasing is not enough. */
export const PIECE_SEAT_THRESHOLD = .09, PIECE_TOUCH = .12
export const pieceSnaps = (distance: number) => distance < PIECE_SEAT_THRESHOLD

// ---------------------------------------------------- hammer
export const HAMMER_SPEED = 1.6, HAMMER_WEAPON = .4
/** Fast downward controller swing: triggers once per downswing; does not re-arm until it slows down. */
export function hammerSwing(verticalSpeed: number, armed: boolean) {
  if (armed && verticalSpeed < -HAMMER_SPEED) return { strike: true, armed: false }
  return { strike: false, armed: armed || verticalSpeed > -HAMMER_WEAPON }
}

/** Each hand keeps its own recent target; a lost pose or rig jump does not count as a strike. */
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

// ---------------------------------------------------- swing
export interface Swing { a: Point; b: Point; duration: number }
export const SWING_START = 1.8, SWING_END = .9, SWING_LONGEST = .4, SWING_SHORTEST_PATH = .25, SWING_GAP = .5

/** Detects swings from the velocity history of the blade point. Takes world meters and seconds. */
export class SwingMeter {
  private once: Point | null = null
  private head: Point | null = null
  private duration = 0
  private wait = 0
  /** While ongoing, the blade trail is drawn. */
  ongoing = false
  reset() { this.once = null; this.head = null; this.duration = 0; this.ongoing = false; this.wait = 0 }
  step(p: Point, dt: number): Swing | null {
    const once = this.once
    this.once = { x: p.x, y: p.y, z: p.z }
    this.wait = Math.max(0, this.wait - dt)
    if (!once || dt <= 0) return null
    const speed = Math.hypot(p.x - once.x, p.y - once.y, p.z - once.z) / dt
    if (!this.head) {
      if (speed < SWING_START || this.wait > 0) return null
      this.head = once; this.duration = dt; this.ongoing = true
      return null
    }
    this.duration += dt
    if (speed >= SWING_END && this.duration < SWING_LONGEST) return null
    const a = this.head, duration = this.duration
    this.head = null; this.ongoing = false
    if (Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z) < SWING_SHORTEST_PATH) return null
    this.wait = SWING_GAP
    return { a, b: { x: p.x, y: p.y, z: p.z }, duration }
  }
}

export interface Box { minX: number; maxX: number; minY: number; maxY: number; z: number }
export const SWING_TOLERANCE = .5
// On desktop dx/dy are fractions of the scene on screen; the visible width at the target plane is roughly this many meters.
const SCREEN_METER = 2.5

/**
 * Converts a swing into computeCut inputs and a line on the target plane.
 * Because of arm length and divergent gaze the line may narrowly miss the target; if close, it is pulled inside with the smallest shift.
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
    dx: fx / SCREEN_METER, dy: -fy / SCREEN_METER, duration: s.duration, near,
  }
}

// ---------------------------------------------------- panel content
export interface PanelButton { id: string; name: string; hold?: boolean; passive?: boolean; selected?: boolean }
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

export function panelState(d: Game, s: { reheat: boolean; note: number | null }): PanelState {
  const a = d.stage, master = d.master, realHeat = average(d, 'heat'), heat = Math.round(realHeat / 10) * 10, heatingPhase = a === 1 || d.again
  const buttons: PanelButton[] = []
  const r: PanelState = {
    step: `ADIM 0${a + 1} / 08`, title: stages[a], instruction: d.again ? instructions[1] : instructions[a], message: d.message, buttons,
    common: [
      { id: 'command:master', name: master ? 'Usta çalışıyor…' : 'Ustaya bırak', passive: master },
      { id: 'command:fromStart', name: 'Baştan başla' },
      { id: 'exit', name: "VR'dan çık" },
    ],
  }
  if (a >= 1 && a <= 3) r.heat = { value: heat, interval: a === 3 ? '780–880 ideal' : '750–1150 ideal' }
  if (a === 0) buttons.push({ id: 'command:al', name: 'Külçeyi al' })
  else if (heatingPhase) buttons.push({ id: 'hold:bellows', name: 'Körüğü basılı tut', hold: true }, { id: 'command:continue', name: 'Örse geç', passive: realHeat < 750 })
  else if (a === 2) buttons.push({ id: 'command:strike', name: 'Seçili bölgeye vur' }, { id: 'command:again', name: 'Yeniden ısıt' })
  else if (a === 3) {
    buttons.push({ id: 'hold:water', name: 'Suya daldır · basılı tut', hold: true }, { id: 'hold:bellows', name: 'Su öncesi ısıt · basılı tut', hold: true, selected: s.reheat })
    r.progress = { text: 'Su verme', ratio: limit(d.dip / 1.5) }
  } else if (a === 4) buttons.push({ id: 'hold:wrist', name: 'Seçili bölgeyi bile · basılı tut', hold: true })
  else if (a === 5) {
    buttons.push({ id: 'command:clink', name: 'Sıradaki parçayı yerleştir' })
    r.progress = { text: `${d.attached} / ${pieces.length} parça yerinde`, ratio: d.attached / pieces.length }
  } else if (a === 6) {
    swordPartNotes.forEach((p, i) => buttons.push({ id: `note:${i}`, name: `${i + 1}. ${p.title}`, selected: s.note === i }))
    buttons.push({ id: 'command:continue', name: 'Test alanına geç' })
    if (s.note !== null) buttons.push({ id: 'note:close', name: 'Notu kapat' })
  } else if (a === 7) {
    targets.forEach((name, i) => buttons.push({ id: `target:${i}`, name: d.damages[i] > 0 ? `${name} · hasar %${Math.round(d.damages[i] * 100)}` : name, selected: d.target === i }))
    buttons.push({ id: 'command:cutOff', name: 'Kes', passive: d.broke }, { id: 'command:targets-renew', name: 'Hedefleri yenile' })
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

/** Info panel content; the honesty note is never dropped. */
export function infoState(stage: number, note: number | null) {
  const p = stage === 6 && note !== null ? swordPartNotes[note] : null
  const k = stage === 3 ? swordStageInfo.water : stage >= 5 ? swordStageInfo.equip : swordStageInfo.ingot
  return {
    title: p ? p.title : 'Atölye notu', text: p ? p.text : k.text, source: `Kaynak: ${swordSources[p ? p.source : k.source]}`,
    honestyTitle: 'MODEL HAKKINDA', honesty: swordIntro.honesty,
  }
}

// ---------------------------------------------------- panel layout (canvas pixels)
export const PANEL_G = 1024, PANEL_Y = 820
export interface Frame { id: string; x: number; y: number; g: number; y2: number; button: PanelButton; region?: boolean }
const EDGE = 32, BETWEEN = 10, LINE = 62

/** Buttons stack bottom-up: the common row at the bottom, stage buttons above it, region cells above those. */
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
    p.regions.ratio.forEach((_, i) => squares.push({ id: `region:${i}`, x: EDGE + i * (g + 6), y, g, y2: y + 50, region: true, button: { id: `region:${i}`, name: String(i + 1) } }))
    alt = y - BETWEEN
  }
  return { squares, contentBottom: alt }
}

/** Returns the canvas box that uv (v=1 is the top edge) falls in; passive boxes are returned too, the caller decides. */
export function panelFrame(squares: Frame[], u: number, v: number) {
  const x = u * PANEL_G, y = (1 - v) * PANEL_Y
  return squares.find(k => x >= k.x && x <= k.x + k.g && y >= k.y && y <= k.y2) ?? null
}
