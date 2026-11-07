export type KatkiDurumu = 'beklemede' | 'onaylandi' | 'reddedildi'
export interface Katki { id: string; eserId: string; baslik: string; metin: string; durum: KatkiDurumu; tarih: string }

const anahtar = 'kokxr-katkilar'
export const BASLIK_EN_FAZLA = 80
export const METIN_EN_FAZLA = 600
const durumlar: KatkiDurumu[] = ['beklemede', 'onaylandi', 'reddedildi']

// Kontrol karakterlerini ve fazla boşluğu temizler. React metni zaten kaçırır; burada yalnız depolanan veri düzenlenir.
export const temizle = (m: string) => m.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
const kisiselVeri = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?90|0)?[\s(-]*5\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/

export function katkiHatasi(baslik: string, metin: string): string {
  const b = temizle(baslik), m = temizle(metin)
  if (!b || !m) return 'Başlık ve metin zorunludur.'
  if (b.length > BASLIK_EN_FAZLA) return `Başlık en fazla ${BASLIK_EN_FAZLA} karakter olabilir.`
  if (m.length > METIN_EN_FAZLA) return `Metin en fazla ${METIN_EN_FAZLA} karakter olabilir.`
  if (kisiselVeri.test(b) || kisiselVeri.test(m)) return 'E-posta veya telefon numarası gibi kişisel bilgi yazmayın.'
  return ''
}
export function katkilariOku(): Katki[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(anahtar) ?? '[]')
    if (!Array.isArray(v)) return []
    return v.filter((k): k is Katki => !!k && typeof k === 'object' && typeof k.id === 'string' && typeof k.eserId === 'string' &&
      typeof k.baslik === 'string' && typeof k.metin === 'string' && durumlar.includes(k.durum) && typeof k.tarih === 'string')
  } catch { return [] }
}
export function katkilariYaz(liste: Katki[]): boolean {
  try { localStorage.setItem(anahtar, JSON.stringify(liste)); return true } catch { return false }
}
export function yeniKatki(eserId: string, baslik: string, metin: string): Katki {
  return { id: crypto.randomUUID(), eserId, baslik: temizle(baslik), metin: temizle(metin), durum: 'beklemede', tarih: new Date().toISOString() }
}
