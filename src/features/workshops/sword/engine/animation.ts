import * as T from 'three'

export const easy = {
  inner: (t: number) => t * t * t,
  outer: (t: number) => 1 - (1 - t) ** 3,
  innerOuter: (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  // Slightly overshoots the target and settles back: for parts that "click" into place.
  outerBack: (t: number) => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2 },
}
export const interrupt = (t: number, a: number, b: number) => T.MathUtils.clamp((t - a) / (b - a), 0, 1)

// Damped follow: also accelerates smoothly at the start (no abrupt start as with exponential smoothing).
export function soften(now: number, target: number, speed: { v: number }, duration: number, dt: number) {
  const w = 2 / Math.max(duration, 1e-4), x = w * dt, e = 1 / (1 + x + .48 * x * x + .235 * x * x * x)
  const diff = now - target, tmp = (speed.v + w * diff) * dt
  speed.v = (speed.v - w * tmp) * e
  return target + (diff + tmp) * e
}

export class DampedVector {
  private x = { v: 0 }; private y = { v: 0 }; private z = { v: 0 }
  follow(v: T.Vector3, target: T.Vector3, duration: number, dt: number) {
    v.x = soften(v.x, target.x, this.x, duration, dt)
    v.y = soften(v.y, target.y, this.y, duration, dt)
    v.z = soften(v.z, target.z, this.z, duration, dt)
  }
  reset() { this.x.v = this.y.v = this.z.v = 0 }
}

// Spring: small fixed steps; stays stable even when the frame rate drops.
export function bowStep(d: { x: number; v: number }, hardness: number, damping: number, dt: number) {
  const n = Math.max(1, Math.ceil(dt / .004)), h = dt / n
  for (let i = 0; i < n; i++) { d.v += (-d.x * hardness - d.v * damping) * h; d.x += d.v * h }
}

// Upward-arcing move between two points: the object does not pass straight through walls.
export function curvedPath(result: T.Vector3, a: T.Vector3, b: T.Vector3, t: number, height: number) {
  result.lerpVectors(a, b, t)
  result.y += Math.sin(t * Math.PI) * height
  return result
}
