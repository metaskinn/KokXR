import { ortalama, sinir } from './durum.ts'
import type { Oyun } from './durum.ts'
export const hedefler = ['Hasır rulo', 'Kütük', 'Asılı kumaş']
export interface Kesim { guc: number; kesildi: boolean; derinlik: number; mesaj: string; kirildi: boolean }
export function kesimHesapla(d: Oyun, dx: number, dy: number, sure: number): Kesim {
  const hiz = Math.hypot(dx, dy) / Math.max(.08, sure)
  const yon = Math.max(Math.abs(dx), Math.abs(dy)) / Math.max(.001, Math.hypot(dx, dy))
  const guc = sinir(ortalama(d, 'cilt') * .55 + d.sertlik * .45 + (hiz > .7 ? .08 : 0) + (yon > .9 ? .04 : 0) - (d.catlak ? .18 : 0) - d.yanma * .1)
  const kirildi = d.kirildi || (d.catlak && d.hedef === 1 && hiz > 1)
  const kesildi = !kirildi && (d.hedef === 0 ? guc >= .35 : d.hedef === 2 ? guc >= .72 : false)
  const derinlik = d.hedef === 1 ? Math.min(.5, guc * .625) : 0
  const mesaj = kirildi ? 'Çatlak namlu darbede kırıldı. Baştan başlayarak yeniden deneyebilirsin.' : d.hedef === 1 ? `Kütükte %${Math.round(derinlik * 100)} derinliğinde iz. Kütük tek parça kaldı.` : kesildi ? `${hedefler[d.hedef]} kesildi; üst parça ayrıldı.` : d.hedef === 2 ? 'Gevşek kumaş sallandı. Kesim için daha keskin bir ağız gerekiyor.' : 'Darbe iz bıraktı; hasır ayrılmadı.'
  d.kirildi = kirildi; d.mesaj = mesaj; d.sonuclar[d.hedef] = mesaj
  d.puan = Math.max(d.puan, Math.round(guc * 100)); d.rozet ||= kesildi && guc >= .7
  return { guc, kesildi, derinlik, mesaj, kirildi }
}
