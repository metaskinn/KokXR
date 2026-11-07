import { varsayilanIdler } from '.'
import type { UstKatman } from '.'

export type OnayDurumu = 'beklemede' | 'onaylandi' | 'reddedildi'
export type OnayHaritasi = Record<string, OnayDurumu>
const anahtar = 'kokxr-onay'
const gecerli = (d: unknown): d is OnayDurumu => d === 'beklemede' || d === 'onaylandi' || d === 'reddedildi'

export function onayiOku(): OnayHaritasi {
  try {
    const veri: unknown = JSON.parse(localStorage.getItem(anahtar) ?? '{}')
    if (!veri || typeof veri !== 'object' || Array.isArray(veri)) return {}
    return Object.fromEntries(Object.entries(veri).filter(([, d]) => gecerli(d))) as OnayHaritasi
  } catch { return {} }
}
export function onayiYaz(harita: OnayHaritasi): boolean {
  try { localStorage.setItem(anahtar, JSON.stringify(harita)); return true } catch { return false }
}
// Yeni eklenen (varsayılan olmayan) eser, onaylanana kadar yayında görünmez; varsayılan eserlerin düzenlemeleri doğrudan geçer.
export function yayinKatmani(ustKatman: UstKatman, onay: OnayHaritasi): UstKatman {
  return Object.fromEntries(Object.entries(ustKatman).filter(([id]) => varsayilanIdler.includes(id) || onay[id] === 'onaylandi'))
}
export function onayBekleyenler(ustKatman: UstKatman): string[] {
  return Object.keys(ustKatman).filter((id) => !varsayilanIdler.includes(id))
}
