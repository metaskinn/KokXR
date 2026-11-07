// Tile workshop game logic: desktop and VR share the same state. Does not depend on three.js.
// Durations and bisque temperature are game scale; the glaze firing range comes from a source (src/content/tile.ts).
import { regions, advanceTrace, traces, type N } from './pattern.ts'

export const stages = ['Şekil', 'Astar ve bisküvi', 'Desen', 'Tahrir', 'Boyama', 'Sır ve fırın', 'İnceleme']
export type ColorId = 'cobalt' | 'turquoiseLight' | 'green' | 'red'
export const colors: { id: ColorId; ad: string; live: string; mat: string }[] = [
  { id: 'cobalt', ad: 'Kobalt mavisi', live: '#123f96', mat: '#6f7d96' },
  { id: 'turquoiseLight', ad: 'Turkuaz', live: '#159fa8', mat: '#8aa3a2' },
  { id: 'green', ad: 'Yeşil', live: '#1f7d4d', mat: '#7f8f80' },
  { id: 'red', ad: 'Kırmızı', live: '#c5301f', mat: '#a58d82' },
]
export const BISQUE = { min: 850, max: 900 }
export const GLAZE_KILN = { min: 900, max: 940 }
export const HOLD_DURATION = 2.5
const COAL_THRESHOLD = .85, CELL = 8
export const OUTLINE_TOLERANCE = .075

export interface Game {
  stage: number
  /** The two parts of the slip-and-bisque and glaze-and-kiln steps: 0 applying, 1 kiln. */
  alt: number
  form: number; formPenalty: number
  primer: number; glaze: number
  heat: number; holding: number; excess: number; excessGlaze: number; inKiln: boolean
  coal: boolean[]; coalRatio: number
  iz: number; traceIndex: number; traceError: number; traceMeasure: number
  paints: (ColorId | null)[]; color: ColorId
  /** 0 to 1 as the glaze fires: paints become vivid, the surface vitrifies. */
  live: number
  masterStep: number; message: string
}

export function firstGame(): Game {
  return {
    stage: 0, alt: 0, form: 0, formPenalty: 0, primer: 0, glaze: 0, heat: 20, holding: 0, excess: 0, excessGlaze: 0, inKiln: false,
    coal: Array(CELL * CELL).fill(false), coalRatio: 0, iz: 0, traceIndex: 0, traceError: 0, traceMeasure: 0,
    paints: regions.map(() => null), color: 'cobalt', live: 0, masterStep: 0,
    message: 'Çamur çarkın üstünde. Basılı tutup sürükleyerek şekil ver.',
  }
}
const limit = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
function advance(d: Game, message: string) { d.stage = Math.min(6, d.stage + 1); d.alt = 0; d.holding = 0; d.heat = 20; d.inKiln = false; d.message = message }

/** `dist` is the drag in plate radii. Pulling too fast makes the clay wobble. */
export function shapeUp(d: Game, dist: number, dt: number) {
  if (d.stage !== 0 || dist <= 0) return
  if (dist / Math.max(dt, .001) > 7) { d.formPenalty = limit(d.formPenalty + dt * .8); d.message = 'Yavaş: çamur hızlı çekilince yalpalar.'; return }
  d.form = limit(d.form + dist * .16)
  if (d.form >= 1) { d.form = 1; advance(d, 'Tabak kurudu. Yüzeyi astarla kapla.') }
}

export function applySlip(d: Game, dt: number) {
  if (d.stage !== 1 || d.alt !== 0) return
  d.primer = limit(d.primer + dt * .55)
  if (d.primer >= 1) { d.alt = 1; d.inKiln = true; d.message = 'Astar kurudu. Fırını ısıt, ibreyi aralıkta tut.' }
}
export function pourGlaze(d: Game, dt: number) {
  if (d.stage !== 5 || d.alt !== 0) return
  d.glaze = limit(d.glaze + dt * .55)
  if (d.glaze >= 1) { d.alt = 1; d.inKiln = true; d.message = 'Sır deseni örttü; korkma, pişince cam gibi saydamlaşır. Fırını ısıt.' }
}

/** Kiln step. Fires while kept in range; excess heat lowers quality. */
export function kiln(d: Game, dt: number, fire: boolean) {
  const bisk = d.stage === 1 && d.alt === 1, glaze = d.stage === 5 && d.alt === 1
  if (!bisk && !glaze) return
  d.heat = limit(d.heat + dt * (fire ? 240 * (1 - d.heat / 1500) : -32), 20, 1100)
  const a = bisk ? BISQUE : GLAZE_KILN
  if (d.heat >= a.min && d.heat <= a.max) d.holding += dt
  else if (d.heat > a.max) {
    if (bisk) d.excess = limit(d.excess + dt * .25); else d.excessGlaze = limit(d.excessGlaze + dt * .25)
    d.message = 'Çok sıcak: ateşi bırak, soğusun.'
  }
  if (d.holding >= HOLD_DURATION) {
    if (bisk) advance(d, 'Bisküvi hazır. Delikli kâğıdın üstünde kömür keseciğini gezdir.')
    else { d.inKiln = false; d.alt = 2; d.message = 'Sır eridi. Fırın soğuyor…' }
  }
}
/** Post-kiln appearance change; moves to inspection when done. */
export function cool(d: Game, dt: number) {
  if (d.stage !== 5 || d.alt !== 2) return
  d.live = limit(d.live + dt * .4)
  if (d.live >= 1) advance(d, 'Çinin hazır. Elinde çevir, sırın parlaklığına bak.')
}

export function withCoal(d: Game, n: N) {
  if (d.stage !== 2) return
  const cells: number[] = []
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const x = Math.floor(((n[0] + ox * .12 + 1) / 2) * CELL), y = Math.floor(((n[1] + oy * .12 + 1) / 2) * CELL)
    if (x >= 0 && y >= 0 && x < CELL && y < CELL) cells.push(y * CELL + x)
  }
  cells.forEach((h) => { d.coal[h] = true })
  const total = coalCells(), full = total.filter((h) => d.coal[h]).length
  d.coalRatio = full / total.length
  if (d.coalRatio >= COAL_THRESHOLD) { d.coal.fill(true); d.coalRatio = 1; advance(d, 'Desen noktalar halinde geçti. Şimdi samur fırçayla noktaların üstünden git.') }
}
/** Cells that fall inside the plate. */
export function coalCells() {
  const o: number[] = []
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    if (Math.hypot(((x + .5) / CELL) * 2 - 1, ((y + .5) / CELL) * 2 - 1) < .95) o.push(y * CELL + x)
  }
  return o
}
export const COAL_CELL = CELL

export function drawOutline(d: Game, n: N) {
  if (d.stage !== 3) return
  const iz = traces[d.iz], s = advanceTrace(iz, d.traceIndex, n, OUTLINE_TOLERANCE)
  if (s.row > d.traceIndex) { d.traceError += s.distance; d.traceMeasure++; d.traceIndex = s.row }
  // The line is closed: the last point equals the start, so missing the last step on mouse release must not lock the trace.
  if (d.traceIndex >= iz.length - 2) {
    d.traceIndex = 0; d.iz++
    if (d.iz >= traces.length) { d.iz = traces.length; advance(d, 'Tahrir bitti, kalan tekrarları çırak tamamladı. Renk seç, desenin içine dokun.') }
    else d.message = 'Güzel. Sıradaki çizgiyi başından izle.'
  }
}
/** Start of the next trace: to show where the brush should go. */
export const traceHead = (d: Game): N | null => (d.stage === 3 && d.iz < traces.length ? traces[d.iz][d.traceIndex] : null)

export function paint(d: Game, region: number) {
  if (d.stage !== 4 || region < 0) return
  d.paints[region] = d.color
  d.message = paintDone(d) ? 'Boyalar mat görünür; rengini fırında bulacak. Sırlamaya geç.' : `${regions.filter((_, i) => d.paints[i]).length}/${regions.length} bölge boyandı.`
}
export const paintDone = (d: Game) => d.paints.every(Boolean)
export function pickColor(d: Game, r: ColorId) { d.color = r }
export function finishPaint(d: Game) {
  if (d.stage === 4 && paintDone(d)) advance(d, 'Sırı dök: tabağı süt beyazı bir tabaka örtecek.')
}

export function quality(d: Game) {
  const outline = d.traceMeasure ? 1 - limit(d.traceError / d.traceMeasure / OUTLINE_TOLERANCE) * .5 : .7
  return Math.round(100 * limit((1 - d.formPenalty * .6) * .25 + (1 - d.excess) * .2 + outline * .3 + (1 - d.excessGlaze) * .25))
}

/** Completes the current step at medium quality. When painting, gives empty regions a balanced arrangement. */
export function masterComplete(d: Game) {
  const a = d.stage
  if (a === 0) { d.form = 1; advance(d, 'Usta şekillendirdi. Şimdi astar.') }
  else if (a === 1) { d.primer = 1; advance(d, 'Usta bisküviyi pişirdi. Şimdi deseni aktar.') }
  else if (a === 2) { d.coal.fill(true); d.coalRatio = 1; advance(d, 'Usta deseni aktardı. Şimdi tahrir.') }
  else if (a === 3) { d.iz = traces.length; d.traceIndex = 0; d.traceError += .04; d.traceMeasure++; advance(d, 'Usta tahriri çekti. Şimdi boya.') }
  else if (a === 4) {
    const layoutOf: Record<string, ColorId> = { tulip: 'red', leaf: 'green', center: 'turquoiseLight', ring: 'cobalt' }
    regions.forEach((b, i) => { d.paints[i] ??= layoutOf[b.tour] })
    advance(d, 'Usta boyadı. Sırı dök.')
  } else if (a === 5) { d.glaze = 1; d.inKiln = false; d.alt = 2; d.message = 'Usta fırını yönetti. Fırın soğuyor…' }
}

export type Action = { id: string; ad: string; tour: 'head' | 'hold'; passive?: boolean; selected?: boolean }
/** Desktop panel and VR panel buttons come from the same list. */
export function actions(d: Game): Action[] {
  if (d.stage === 1 && d.alt === 0) return [{ id: 'primer', ad: 'Astar sür · basılı tut', tour: 'hold' }]
  if (d.stage === 5 && d.alt === 0) return [{ id: 'glaze', ad: 'Sır dök · basılı tut', tour: 'hold' }]
  if (d.inKiln) return [{ id: 'fire', ad: 'Ateşi körükle · basılı tut', tour: 'hold' }]
  if (d.stage === 4) return [
    ...colors.map((r): Action => ({ id: `color:${r.id}`, ad: r.ad, tour: 'head', selected: d.color === r.id })),
    { id: 'paintdone', ad: 'Sırlamaya geç →', tour: 'head', passive: !paintDone(d) },
  ]
  if (d.stage === 6) return [{ id: 'fromStart', ad: 'Yeni çini yap', tour: 'head' }]
  return []
}
