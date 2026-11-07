import * as T from 'three'

export const easy = {
  inner: (t: number) => t * t * t,
  outer: (t: number) => 1 - (1 - t) ** 3,
  innerOuter: (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  // Hedefi hafifçe geçip geri oturur: yerine "tık" diye giren parçalar için.
  outerBack: (t: number) => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2 },
}
export const interrupt = (t: number, a: number, b: number) => T.MathUtils.clamp((t - a) / (b - a), 0, 1)

// Sönümlü takip: başlangıçta da yumuşak hızlanır (üstel yumuşatmanın ani başlangıcı olmaz).
export function soften(now: number, target: number, speed: { v: number }, sure: number, dt: number) {
  const w = 2 / Math.max(sure, 1e-4), x = w * dt, e = 1 / (1 + x + .48 * x * x + .235 * x * x * x)
  const diff = now - target, tmp = (speed.v + w * diff) * dt
  speed.v = (speed.v - w * tmp) * e
  return target + (diff + tmp) * e
}

export class DampedVector {
  private x = { v: 0 }; private y = { v: 0 }; private z = { v: 0 }
  follow(v: T.Vector3, target: T.Vector3, sure: number, dt: number) {
    v.x = soften(v.x, target.x, this.x, sure, dt)
    v.y = soften(v.y, target.y, this.y, sure, dt)
    v.z = soften(v.z, target.z, this.z, sure, dt)
  }
  reset() { this.x.v = this.y.v = this.z.v = 0 }
}

// Yay: küçük sabit adımlarla; kare hızı düşse de patlamaz.
export function bowStep(d: { x: number; v: number }, hardness: number, damping: number, dt: number) {
  const n = Math.max(1, Math.ceil(dt / .004)), h = dt / n
  for (let i = 0; i < n; i++) { d.v += (-d.x * hardness - d.v * damping) * h; d.x += d.v * h }
}

// İki nokta arasında yukarı kavisli taşıma: nesne duvarların içinden düz geçmez.
export function curvedPath(result: T.Vector3, a: T.Vector3, b: T.Vector3, t: number, height: number) {
  result.lerpVectors(a, b, t)
  result.y += Math.sin(t * Math.PI) * height
  return result
}
