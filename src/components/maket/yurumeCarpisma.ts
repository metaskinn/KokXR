// İç mekân çarpışması; three ve DOM kullanmaz, Node testinde doğrudan çalışır.
import type { IcYurume } from './ulucamiIc.ts'

export const OYUNCU_YARICAP = 0.45

/** Çarpışma kutuları ve daireler oyuncu yarıçapı kadar şişirilmiş kabul edilir. */
export function carpiyor(yurume: IcYurume, x: number, z: number, r: number): boolean {
  const { sinir, kutular, daireler } = yurume
  if (x < sinir.x0 + r || x > sinir.x1 - r || z < sinir.z0 + r || z > sinir.z1 - r) return true
  for (const k of kutular) if (x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r) return true
  for (const d of daireler) if (Math.hypot(x - d.x, z - d.z) < d.r + r) return true
  return false
}
