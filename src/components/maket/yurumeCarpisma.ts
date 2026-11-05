// İç mekân çarpışması; three ve DOM kullanmaz, Node testinde doğrudan çalışır.
import type { IcYurume, Kutu } from './ulucamiIc.ts'

export const OYUNCU_YARICAP = 0.45

/** Çarpışma kutuları ve daireler oyuncu yarıçapı kadar şişirilmiş kabul edilir. */
export function carpiyor(yurume: IcYurume, x: number, z: number, r: number): boolean {
  const { sinir, kutular, daireler } = yurume
  if (x < sinir.x0 + r || x > sinir.x1 - r || z < sinir.z0 + r || z > sinir.z1 - r) return true
  for (const k of kutular) if (x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r) return true
  for (const d of daireler) if (Math.hypot(x - d.x, z - d.z) < d.r + r) return true
  return false
}

/** İki nokta arasındaki kuşbakışı doğru parçası kutuyu kesiyor mu? */
export function bakisKesiliyor(ax: number, az: number, bx: number, bz: number, k: Kutu) {
  let t0 = 0, t1 = 1
  for (const [p, q] of [[ax - bx, ax - k.x0], [bx - ax, k.x1 - ax], [az - bz, az - k.z0], [bz - az, k.z1 - az]]) {
    if (p === 0) { if (q < 0) return false; continue }
    const t = q / p
    if (p < 0) t0 = Math.max(t0, t)
    else t1 = Math.min(t1, t)
    if (t0 > t1) return false
  }
  return true
}
