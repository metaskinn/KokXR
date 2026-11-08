// Pure computations for model assembly in VR: uses neither three nor the DOM, runs directly in the Node test.
// The order is only the model's stacking order (layer list bottom to top); it is not the historical construction order.
export type Pointed = [number, number, number]
export interface Box { min: Pointed; max: Pointed }
export interface LayerCandidate { id: number; center: Pointed; radius: number }
export type ReleaseResult = 'seated' | 'row' | 'far'

/** A layer seats when this close to its target. Scene units: cm when the rig is 100×. */
export const SEAT_THRESHOLD = 18
/** Layers are wider than the hand and the shelf is beyond arm's reach: if the hand moves 1 cm the layer moves 2 cm. */
export const HAND_GAIN = 2
/** Ray range (scene units). */
export const RAY_RANGE = 300

// At the rig's initial angle the user's right is the scene's -x direction: the shelf is just to the right of the model.
const RAF_X = -85, SHELF_BASE = 18, SHELF_GAP = 10

/** Shelf slots (offset relative to the layer's home). The top layer goes to the bottom shelf, so the model's own stacking isn't given away. */
export function shelfLayout(boxes: Box[]): Pointed[] {
  const result: Pointed[] = []
  let base = SHELF_BASE
  for (let id = boxes.length - 1; id >= 0; id--) {
    const { min, max } = boxes[id]
    result[id] = [RAF_X - (min[0] + max[0]) / 2, base - min[1], -(min[2] + max[2]) / 2]
    base += max[1] - min[1] + SHELF_GAP
  }
  return result
}

/** Layers are wide and the controller is often inside one: first the aimed-at layer, else the touched one. `null` if there is no candidate. */
export function selectLayer(start_: Pointed, dir: Pointed, candidates: LayerCandidate[], reach = RAY_RANGE): number | null {
  let touching: number | null = null, nearestTouch = 1
  let aimed: number | null = null, bestAim = 1
  for (const { id, center, radius } of candidates) {
    const f: Pointed = [center[0] - start_[0], center[1] - start_[1], center[2] - start_[2]]
    const distance = Math.hypot(...f)
    if (distance / radius < nearestTouch) { nearestTouch = distance / radius; touching = id }
    const t = f[0] * dir[0] + f[1] * dir[1] + f[2] * dir[2]
    if (t <= 0 || t > reach) continue
    const upright = Math.sqrt(Math.max(0, distance * distance - t * t))
    if (upright / radius < bestAim) { bestAim = upright / radius; aimed = id }
  }
  return aimed ?? touching
}

/** New position of the held layer: where it started, plus the hand's travel multiplied by the gain. */
export function carriedPlace(pieceStart: Pointed, handStart: Pointed, el: Pointed, gain = HAND_GAIN): Pointed {
  return [
    pieceStart[0] + (el[0] - handStart[0]) * gain,
    pieceStart[1] + (el[1] - handStart[1]) * gain,
    pieceStart[2] + (el[2] - handStart[2]) * gain,
  ]
}

/** `seatedOne`: number of layers already seated, which is also the id of the next layer in order. If not close, order is not checked. */
export function releaseResult(id: number, seatedOne: number, distance: number, threshold = SEAT_THRESHOLD): ReleaseResult {
  if (distance >= threshold) return 'far'
  return id === seatedOne ? 'seated' : 'row'
}

export interface AssemblyText { top: string; message: string; note: string }

const ORDER_NOTE = 'Sıra, maketin üst üste oturma sırasıdır; tarihî inşa sırası değildir.'

/** Text of the status panel. `last` is the last release; without it, a hint is shown. */
export function assemblyText(seatedOne: number, names: string[], last?: { result: ReleaseResult; id: number }): AssemblyText {
  const progress = `${seatedOne}/${names.length} katman yerinde`
  if (seatedOne >= names.length) return { top: `Tamamlandı: ${progress}`, message: 'Maket birleşti.', note: ORDER_NOTE }
  const top = `Maketi birleştir: ${progress}`
  let message = 'Tetik ya da kavrama tuşuyla tut, yerine götür, bırak. Menü: B veya Y.'
  if (last?.result === 'seated') message = `${names[last.id]} yerine oturdu.`
  else if (last?.result === 'row') message = `Önce ${names[seatedOne]} oturmalı. Sıra alttan üste gider.`
  else if (last?.result === 'far') message = 'Yerine yaklaşmadı. Yeniden dene.'
  return { top, message, note: ORDER_NOTE }
}
