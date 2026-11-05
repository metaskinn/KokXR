import type { Eser } from '../types/eser'
import { ACIK_YAYIN } from './acikYayin'
import { eserGecerli, kaynakliOlabilir } from './dogrulama'

const eserDosyalari = import.meta.glob<Eser>('./eserler/*.json', { eager: true, import: 'default' })
const fotografsiz = (e: Eser): Eser => ({
  ...e, kapakGorsel: '', gorseller: [], tur: undefined,
  bilgiNoktalari: e.bilgiNoktalari.map((b) => ({ ...b, gorsel: '' })),
  maket: e.maket && { ...e.maket, aciklama: e.maket.aciklama.replace(/Levha ve paye yazıları[^.]*\./, 'Levha ve paye yüzeyleri bu sürümde yazısız bırakılmıştır.') },
})
const varsayilanlar = Object.values(eserDosyalari).map((e) => ACIK_YAYIN ? fotografsiz(e) : e)
const anahtar = 'kokxr-icerik'
export type UstKatman = Record<string, Eser>
export interface IcerikDurumu { ustKatman: UstKatman; uyari: string }
export const varsayilanIdler = varsayilanlar.map(e => e.id)

export function eserleriGetir(ustKatman: UstKatman = {}): Eser[] {
  return [...varsayilanlar.map(e => ustKatman[e.id] ?? e), ...Object.values(ustKatman).filter(e => !varsayilanIdler.includes(e.id))]
}
export function ustKatmaniCoz(veri: unknown): UstKatman {
  if (!veri || typeof veri !== 'object' || Array.isArray(veri)) throw new Error('Üst katman, eser kimliklerini tam eser nesnelerine eşleyen bir JSON nesnesi olmalıdır.')
  const kayitlar = Object.entries(veri)
  if (!kayitlar.every(([id, e]) => eserGecerli(e) && e.id === id)) throw new Error('JSON içinde geçersiz eser var. Zorunlu alanları, üç soruyu, dört seçeneği ve görsel/kaynak bağlantılarını kontrol edin. Hiçbir kayıt yüklenmedi.')
  return Object.fromEntries(kayitlar.map(([id, e]) => {
    const eser = e as Eser
    return [id, { ...eser, dogrulama: eser.dogrulama === 'dogrulanmis' && kaynakliOlabilir(eser) ? 'dogrulanmis' : 'temsili' }]
  }))
}
export function icerigiOku(): IcerikDurumu {
  try { return { ustKatman: ustKatmaniCoz(JSON.parse(localStorage.getItem(anahtar) ?? '{}')), uyari: '' } }
  catch { return { ustKatman: {}, uyari: 'Tarayıcıdaki içerik okunamadı veya geçersiz. Varsayılan eserler gösteriliyor. Yönetim ekranından geçerli JSON yükleyebilir ya da üst katmanı sıfırlayabilirsiniz.' } }
}
export function icerigiYaz(ustKatman: UstKatman): IcerikDurumu {
  const dogrulanmis = ustKatmaniCoz(ustKatman)
  try {
    localStorage.setItem(anahtar, JSON.stringify(dogrulanmis))
    return { ustKatman: dogrulanmis, uyari: '' }
  } catch { throw new Error('Değişiklikler tarayıcıya kaydedilemedi. Depolama iznini ve boş alanı kontrol edin; formdaki bilgiler korunuyor.') }
}
