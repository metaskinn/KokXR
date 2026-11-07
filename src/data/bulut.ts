import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Eser } from '../types/eser'

const adres = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anahtar = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
// .env boşsa bulut kapalıdır; uygulama yalnız localStorage ile çalışır.
export const bulutVar = Boolean(adres && anahtar)
export type EserDurumu = 'beklemede' | 'onaylandi' | 'reddedildi'
export interface BulutEser { eser: Eser; durum: EserDurumu }

let istemci: SupabaseClient | null = null
function sb(): SupabaseClient {
  if (!bulutVar) throw new Error('Bulut bağlantısı yapılandırılmamış.')
  return istemci ??= createClient(adres!, anahtar!)
}

export async function oturumEposta(): Promise<string> {
  if (!bulutVar) return ''
  try { return (await sb().auth.getSession()).data.session?.user.email ?? '' } catch { return '' }
}
export async function girisYap(eposta: string, sifre: string) {
  const { error } = await sb().auth.signInWithPassword({ email: eposta, password: sifre })
  if (error) throw new Error('Giriş yapılamadı: e-posta veya parola hatalı.')
}
export async function cikisYap() { await sb().auth.signOut() }
export async function yoneticiMi(): Promise<boolean> {
  if (!bulutVar) return false
  const { data } = await sb().auth.getUser()
  return data.user?.app_metadata?.rol === 'yonetici'
}

export async function eserleriOku(yalnizOnayli = true): Promise<BulutEser[]> {
  if (!bulutVar) return []
  let sorgu = sb().from('eserler').select('veri,durum')
  if (yalnizOnayli) sorgu = sorgu.eq('durum', 'onaylandi')
  const { data, error } = await sorgu
  if (error) throw new Error('Bulut içeriği okunamadı.')
  return (data ?? []).map((s) => ({ eser: s.veri as Eser, durum: s.durum as EserDurumu }))
}
export async function eserKaydet(eser: Eser, durum: EserDurumu = 'beklemede') {
  const { data } = await sb().auth.getUser()
  if (!data.user) throw new Error('Buluta kaydetmek için giriş yapın.')
  const { error } = await sb().from('eserler').upsert({ id: eser.id, veri: eser, durum, olusturan: data.user.id, guncelleme: new Date().toISOString() })
  if (error) throw new Error('Eser buluta kaydedilemedi.')
}
export async function eserSil(id: string) {
  const { error } = await sb().from('eserler').delete().eq('id', id)
  if (error) throw new Error('Eser buluttan silinemedi.')
}
export async function durumDegistir(id: string, durum: EserDurumu) {
  const { error } = await sb().from('eserler').update({ durum, guncelleme: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error('Karar kaydedilemedi.')
}
export async function gorselYukle(eserId: string, dosya: File, alt: string, kredi: string): Promise<string> {
  const { data } = await sb().auth.getUser()
  if (!data.user) throw new Error('Görsel yüklemek için giriş yapın.')
  const uzanti = dosya.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const yol = `${eserId}/${crypto.randomUUID()}.${uzanti}`
  const yukle = await sb().storage.from('gorseller').upload(yol, dosya, { contentType: dosya.type })
  if (yukle.error) throw new Error('Görsel yüklenemedi.')
  const kayit = await sb().from('gorseller').insert({ eser_id: eserId, yol, alt, kredi, yukleyen: data.user.id })
  if (kayit.error) throw new Error('Görsel kaydı oluşturulamadı.')
  return sb().storage.from('gorseller').getPublicUrl(yol).data.publicUrl
}

// Tablolar kurulu ve erişilebilir mi? Değilse yönetim yerel kayıtla çalışır, giriş zorunlu tutulmaz.
export async function bulutHazir(): Promise<boolean> {
  if (!bulutVar) return false
  try { return !(await sb().from('eserler').select('id').limit(1)).error } catch { return false }
}
