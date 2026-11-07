import { average, limit } from './state.ts'
import type { Game } from './state.ts'
export const targets = ['Hasır rulo', 'Kütük', 'Asılı kumaş']
export interface Cut { power: number; wasCut: boolean; depth: number; message: string; broke: boolean }
export function computeCut(d: Game, dx: number, dy: number, duration: number): Cut {
  const speed = Math.hypot(dx, dy) / Math.max(.08, duration)
  const dir = Math.max(Math.abs(dx), Math.abs(dy)) / Math.max(.001, Math.hypot(dx, dy))
  const power = limit(average(d, 'skin') * .55 + d.hardness * .45 + (speed > .7 ? .08 : 0) + (dir > .9 ? .04 : 0) - (d.crack_ ? .18 : 0) - d.burn * .1)
  const broke = d.broke || (d.crack_ && d.target === 1 && speed > 1)
  const wasCut = !broke && (d.target === 0 ? power >= .35 : d.target === 2 ? power >= .72 : false)
  const depth = d.target === 1 ? Math.min(.5, power * .625) : 0
  const message = broke ? 'Çatlak namlu darbede kırıldı. Baştan başlayarak yeniden deneyebilirsin.' : d.target === 1 ? `Kütükte %${Math.round(depth * 100)} derinliğinde iz. Kütük tek parça kaldı.` : wasCut ? `${targets[d.target]} kesildi; üst parça ayrıldı.` : d.target === 2 ? 'Gevşek kumaş sallandı. Kesim için daha keskin bir ağız gerekiyor.' : 'Darbe iz bıraktı; hasır ayrılmadı.'
  d.broke = broke; d.message = message; d.results[d.target] = message
  d.score = Math.max(d.score, Math.round(power * 100)); d.rosette ||= wasCut && power >= .7
  return { power, wasCut, depth, message, broke }
}
