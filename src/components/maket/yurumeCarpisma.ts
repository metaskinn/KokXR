// İç mekân çarpışması; three ve DOM kullanmaz, Node testinde doğrudan çalışır.
import type { IcYurume, Kutu } from './ulucamiIc.ts'

export const OYUNCU_YARICAP = 0.45
/** Tek adımda çıkılıp inilebilen yükseklik: daha büyük fark duvar veya uçurum gibi davranır. */
export const ADIM_SINIRI = 0.55
const YAN_ORNEK = 0.2

/** Çarpışma kutuları ve daireler oyuncu yarıçapı kadar şişirilmiş kabul edilir. */
export function carpiyor(yurume: IcYurume, x: number, z: number, r: number, h = 0): boolean {
  const { sinir, kutular, daireler } = yurume
  if (x < sinir.x0 + r || x > sinir.x1 - r || z < sinir.z0 + r || z > sinir.z1 - r) return true
  if (sinir.daire && Math.hypot(x - sinir.daire.x, z - sinir.daire.z) + r > sinir.daire.r) return true
  for (const k of kutular) if ((k.ust === undefined || h < k.ust) && x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r) return true
  for (const d of daireler) if ((d.ust === undefined || h < d.ust) && Math.hypot(x - d.x, z - d.z) < d.r + r) return true
  return false
}

/** `h` yüksekliğindeki oyuncunun bu noktadaki zemini; geçilemiyorsa null. */
function zeminBul(yurume: IcYurume, x: number, z: number, h: number): number | null {
  let ust = 0
  for (const a of yurume.zeminler) {
    if (x < a.x0 || x > a.x1 || z < a.z0 || z > a.z1) continue
    const y = a.h0 + (a.h1 - a.h0) * ((z - a.z0) / (a.z1 - a.z0))
    if (y <= h + ADIM_SINIRI) ust = Math.max(ust, y)
    else if (!a.altGecilir) return null
  }
  return h - ust > ADIM_SINIRI ? null : ust
}

/** Bu noktaya adım atılabiliyorsa yeni zemin yüksekliği, atılamıyorsa null. Yan örnekler kenardan düşmeyi önler. */
export function zeminAdimi(yurume: IcYurume, x: number, z: number, r: number, h: number): number | null {
  const y = zeminBul(yurume, x, z, h)
  if (y === null || carpiyor(yurume, x, z, r, y)) return null
  for (const [a, b] of [[YAN_ORNEK, 0], [-YAN_ORNEK, 0], [0, YAN_ORNEK], [0, -YAN_ORNEK]]) {
    if (zeminBul(yurume, x + a, z + b, y) === null) return null
  }
  return y
}

/** Durak konumunun göz yüksekliğinden zemini: yerdeki durak 0, yapı üstündeki durak o yapının yüksekliği. */
export function durakZemini(yurume: IcYurume, konum: number[]): number {
  return Math.max(0, zeminBul(yurume, konum[0], konum[2], konum[1] - yurume.gozY) ?? 0)
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
