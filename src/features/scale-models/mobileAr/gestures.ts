// Phone AR touch: one-finger drag, two-finger pinch, twist and pan. Pure maths plus a small pointer-event tracker; no three.js.

const MIN_FACTOR = 0.8
const MAX_FACTOR = 1.25

/** Scale factor between two pinch distances, clamped per event to [0.8, 1.25]. Zero or invalid distances give 1. */
export function pinchFactor(prevDist: number, dist: number): number {
  if (!(prevDist > 0) || !(dist > 0) || !Number.isFinite(prevDist) || !Number.isFinite(dist)) return 1
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, dist / prevDist))
}

/** Signed rotation (rad) of the two-finger segment between frames, wrapped into -PI..PI. Segments are [x1, y1, x2, y2]. */
export function twistDelta(prev: [number, number, number, number], next: [number, number, number, number]): number {
  const a0 = Math.atan2(prev[3] - prev[1], prev[2] - prev[0])
  const a1 = Math.atan2(next[3] - next[1], next[2] - next[0])
  let d = a1 - a0
  if (!Number.isFinite(d)) return 0
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

/** Centre of a two-finger segment. */
export function midpoint(seg: [number, number, number, number]): [number, number] {
  return [(seg[0] + seg[2]) / 2, (seg[1] + seg[3]) / 2]
}

/**
 * Touch gestures on `el`: two fingers pinch (onScale), twist (onRotate) and move together (onPan, screen pixels);
 * one finger dragging gives onDrag (screen pixels). A third pointer is ignored. Returns detach().
 */
export function attachArGestures(
  el: HTMLElement,
  cb: { onScale(factor: number): void; onRotate(deltaRad: number): void; onPan?(dx: number, dy: number): void; onDrag?(dx: number, dy: number): void },
): () => void {
  const pts = new Map<number, { x: number; y: number }>()
  const active: number[] = [] // ids of the two tracked pointers
  let prev: [number, number, number, number] | null = null

  const segment = (): [number, number, number, number] | null => {
    if (active.length < 2) return null
    const a = pts.get(active[0])
    const b = pts.get(active[1])
    return a && b ? [a.x, a.y, b.x, b.y] : null
  }

  const onDown = (e: PointerEvent) => {
    // A touch that starts on a button belongs to the button: no drag, no capture (capture would swallow its click).
    if (e.target instanceof Element && e.target.closest('button, [data-xr-ui]')) return
    if (active.length >= 2 && !active.includes(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!active.includes(e.pointerId)) active.push(e.pointerId)
    prev = segment()
    if (prev) {
      try { el.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    }
  }
  const onMove = (e: PointerEvent) => {
    if (!active.includes(e.pointerId)) return
    const last = pts.get(e.pointerId)
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (active.length === 1) {
      if (last && cb.onDrag) { cb.onDrag(e.clientX - last.x, e.clientY - last.y); e.preventDefault() }
      return
    }
    const next = segment()
    if (!next || !prev) return
    if (cb.onPan) {
      const [ax, ay] = midpoint(prev), [bx, by] = midpoint(next)
      if (ax !== bx || ay !== by) cb.onPan(bx - ax, by - ay)
    }
    const f = pinchFactor(Math.hypot(prev[2] - prev[0], prev[3] - prev[1]), Math.hypot(next[2] - next[0], next[3] - next[1]))
    const d = twistDelta(prev, next)
    if (f !== 1) cb.onScale(f)
    if (d !== 0) cb.onRotate(d)
    prev = next
    e.preventDefault()
  }
  const onUp = (e: PointerEvent) => {
    pts.delete(e.pointerId)
    const i = active.indexOf(e.pointerId)
    if (i >= 0) active.splice(i, 1)
    prev = null
  }

  const prevTouchAction = el.style.touchAction
  el.style.touchAction = 'none'
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  return () => {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    el.style.touchAction = prevTouchAction
    pts.clear()
    active.length = 0
    prev = null
  }
}
