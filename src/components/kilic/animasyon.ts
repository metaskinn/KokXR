import * as T from 'three'

export const kolay = {
  ic: (t: number) => t * t * t,
  dis: (t: number) => 1 - (1 - t) ** 3,
  icDis: (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  // Hedefi hafifçe geçip geri oturur: yerine "tık" diye giren parçalar için.
  disGeri: (t: number) => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2 },
}
export const araKes = (t: number, a: number, b: number) => T.MathUtils.clamp((t - a) / (b - a), 0, 1)

// Sönümlü takip: başlangıçta da yumuşak hızlanır (üstel yumuşatmanın ani başlangıcı olmaz).
export function yumusat(simdi: number, hedef: number, hiz: { v: number }, sure: number, dt: number) {
  const w = 2 / Math.max(sure, 1e-4), x = w * dt, e = 1 / (1 + x + .48 * x * x + .235 * x * x * x)
  const fark = simdi - hedef, tmp = (hiz.v + w * fark) * dt
  hiz.v = (hiz.v - w * tmp) * e
  return hedef + (fark + tmp) * e
}

export class SonumluVektor {
  private x = { v: 0 }; private y = { v: 0 }; private z = { v: 0 }
  takip(v: T.Vector3, hedef: T.Vector3, sure: number, dt: number) {
    v.x = yumusat(v.x, hedef.x, this.x, sure, dt)
    v.y = yumusat(v.y, hedef.y, this.y, sure, dt)
    v.z = yumusat(v.z, hedef.z, this.z, sure, dt)
  }
  sifirla() { this.x.v = this.y.v = this.z.v = 0 }
}

// Yay: küçük sabit adımlarla; kare hızı düşse de patlamaz.
export function yayAdim(d: { x: number; v: number }, sertlik: number, sonum: number, dt: number) {
  const n = Math.max(1, Math.ceil(dt / .004)), h = dt / n
  for (let i = 0; i < n; i++) { d.v += (-d.x * sertlik - d.v * sonum) * h; d.x += d.v * h }
}

// İki nokta arasında yukarı kavisli taşıma: nesne duvarların içinden düz geçmez.
export function kavisliYol(sonuc: T.Vector3, a: T.Vector3, b: T.Vector3, t: number, yukseklik: number) {
  sonuc.lerpVectors(a, b, t)
  sonuc.y += Math.sin(t * Math.PI) * yukseklik
  return sonuc
}
