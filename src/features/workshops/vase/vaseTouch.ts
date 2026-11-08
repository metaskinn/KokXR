// Phone AR touch for the vase: one finger on a piece carries it, one finger elsewhere turns the turntable, two fingers pinch.
// Same rules as the scale models' gestures.ts (touches that start on a button are the button's; a third finger is ignored).
import { pinchFactor } from '../../scale-models/mobileAr/gestures'

export interface VaseTouchHandlers {
  /** Normalized device coordinates (-1..1, y up). True if a piece was grabbed. */
  start(x: number, y: number): boolean
  move(x: number, y: number): void
  end(): void
  cancel(): void
  turn(rad: number): void
  scale(factor: number): void
}

/** Screen pixels to radians for a one-finger turn (same as the scale models). */
const TURN_PER_PIXEL = 0.01

export function attachVaseTouch(el: HTMLElement, h: VaseTouchHandlers): () => void {
  const pts = new Map<number, { x: number; y: number }>()
  // 'idle': after a pinch, the finger left on the screen does nothing until every finger has lifted.
  let mode: 'piece' | 'turn' | 'pinch' | 'idle' | null = null
  let first = -1
  let prevDist = 0

  const ndc = (x: number, y: number): [number, number] => {
    const r = el.getBoundingClientRect()
    return [((x - r.left) / Math.max(1, r.width)) * 2 - 1, -((y - r.top) / Math.max(1, r.height)) * 2 + 1]
  }
  const distance = () => {
    const [a, b] = Array.from(pts.values())
    return a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 0
  }
  const capture = (id: number) => { try { el.setPointerCapture(id) } catch { /* ignore */ } }

  const onDown = (e: PointerEvent) => {
    if (e.target instanceof Element && e.target.closest('button, [data-xr-ui]')) return
    if (pts.size === 0) {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      first = e.pointerId
      mode = h.start(...ndc(e.clientX, e.clientY)) ? 'piece' : 'turn'
      capture(e.pointerId)
    } else if (pts.size === 1 && mode === 'turn') {
      // A second finger turns a turn into a pinch; a carried piece ignores it.
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      mode = 'pinch'
      prevDist = distance()
      capture(e.pointerId)
    }
  }
  const onMove = (e: PointerEvent) => {
    const last = pts.get(e.pointerId)
    if (!last) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (mode === 'piece' && e.pointerId === first) h.move(...ndc(e.clientX, e.clientY))
    else if (mode === 'turn') h.turn((e.clientX - last.x) * TURN_PER_PIXEL)
    else if (mode === 'pinch') {
      const d = distance()
      const f = pinchFactor(prevDist, d)
      if (f !== 1) h.scale(f)
      prevDist = d
    }
    e.preventDefault()
  }
  const lift = (e: PointerEvent, cancelled: boolean) => {
    if (!pts.delete(e.pointerId)) return
    if (mode === 'piece' && e.pointerId === first) {
      if (cancelled) h.cancel()
      else h.end()
      mode = 'idle'
    } else if (mode === 'pinch') mode = 'idle'
    if (pts.size === 0) { mode = null; first = -1 }
  }
  const onUp = (e: PointerEvent) => lift(e, false)
  const onCancel = (e: PointerEvent) => lift(e, true)

  const prevTouchAction = el.style.touchAction
  el.style.touchAction = 'none'
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onCancel)
  return () => {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onCancel)
    el.style.touchAction = prevTouchAction
    if (mode === 'piece') h.cancel()
    pts.clear()
    mode = null
  }
}
