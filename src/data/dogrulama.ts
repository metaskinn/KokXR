import type { Eser } from '../types/eser'

export type Hatalar = Record<string, string>
export const kaynakliOlabilir = (eser: Eser) => eser.kaynaklar.some(k => k.metin.trim()) &&
  [...eser.test, ...eser.bilgiNoktalari].every(n => eser.kaynaklar.some(k => k.id === n.kaynakId && k.metin.trim()))

export function gorselAdresiGecerli(adres: string): boolean {
  if (/^\/(?!\/)[^\s\\]*$/.test(adres)) return true
  try { const url = new URL(adres); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password }
  catch { return false }
}

export function eserHatalari(eser: Eser): Hatalar {
  const hatalar: Hatalar = {}
  const zorunlu = (id: string, deger: string) => { if (!deger.trim()) hatalar[id] = 'Bu alan zorunludur.' }
  for (const alan of ['ad', 'sehir', 'ilce', 'donem', 'vakif', 'ozet', 'tarihce'] as const) zorunlu(alan, eser[alan])
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(eser.id)) hatalar.ad = 'Ad, geçerli bir eser kimliği üretmelidir.'
  const kaynakIds = eser.kaynaklar.map(k => k.id)
  eser.kaynaklar.forEach((k, i) => {
    zorunlu(`kaynak-${i}-metin`, k.metin)
    if (!k.id || kaynakIds.indexOf(k.id) !== i) hatalar[`kaynak-${i}-metin`] = 'Kaynak kimliği boş veya tekrarlı.'
  })
  if (eser.test.length !== 3) hatalar.test = 'Tam üç soru gereklidir.'
  eser.test.forEach((s, i) => {
    zorunlu(`test-${i}-soru`, s.soru)
    zorunlu(`test-${i}-aciklama`, s.aciklama)
    if (s.secenekler.length !== 4) hatalar[`test-${i}-soru`] = 'Dört seçenek gereklidir.'
    s.secenekler.forEach((v, j) => zorunlu(`test-${i}-secenek-${j}`, v))
    if (!Number.isInteger(s.dogru) || s.dogru < 0 || s.dogru > 3) hatalar[`test-${i}-dogru`] = 'Doğru seçeneği seçin.'
    if (s.kaynakId && !kaynakIds.includes(s.kaynakId)) hatalar[`test-${i}-kaynakId`] = 'Geçerli bir kaynak seçin veya kaynağı kaldırın.'
  })
  eser.gorseller.forEach((g, i) => {
    if (!gorselAdresiGecerli(g.dosya)) hatalar[`gorsel-${i}-dosya`] = 'Yerel /gorseller/... yolu veya http/https URL girin.'
    if (eser.gorseller.findIndex(x => x.dosya === g.dosya) !== i) hatalar[`gorsel-${i}-dosya`] = 'Bu görsel zaten eklenmiş.'
    zorunlu(`gorsel-${i}-alt`, g.alt)
    if (g.kaynakId && !kaynakIds.includes(g.kaynakId)) hatalar[`gorsel-${i}-kaynakId`] = 'Geçerli bir kaynak seçin veya kaynağı kaldırın.'
  })
  if ((eser.gorseller.length > 0 || eser.kapakGorsel) && !eser.gorseller.some(g => g.dosya === eser.kapakGorsel)) hatalar.kapakGorsel = 'Galeriden bir kapak görseli seçin.'
  eser.bilgiNoktalari.forEach((n, i) => {
    zorunlu(`nokta-${i}-baslik`, n.baslik)
    zorunlu(`nokta-${i}-metin`, n.metin)
    if (!n.id || eser.bilgiNoktalari.findIndex(x => x.id === n.id) !== i) hatalar[`nokta-${i}-baslik`] = 'Bilgi noktası kimliği boş veya tekrarlı.'
    if (n.gorsel && !eser.gorseller.some(g => g.dosya === n.gorsel)) hatalar[`nokta-${i}-gorsel`] = 'Galeriden bir görsel seçin.'
    for (const eksen of ['x', 'y'] as const) if (!Number.isFinite(n[eksen]) || n[eksen] < 0 || n[eksen] > 100) hatalar[`nokta-${i}-${eksen}`] = '0 ile 100 arasında sayı girin.'
    if (n.kaynakId && !kaynakIds.includes(n.kaynakId)) hatalar[`nokta-${i}-kaynakId`] = 'Geçerli bir kaynak seçin veya kaynağı kaldırın.'
  })
  return hatalar
}

// JSON'dan gelen nesneler React'e ulaşmadan önce yapısal ve anlamsal olarak denetlenir.
const nesne = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const metinler = (v: Record<string, unknown>, alanlar: string[]) => alanlar.every(a => typeof v[a] === 'string')
const liste = (v: unknown, kontrol: (n: Record<string, unknown>) => boolean): boolean => Array.isArray(v) && v.every(n => nesne(n) && kontrol(n))
const istegeBagliMetin = (v: Record<string, unknown>, a: string) => v[a] === undefined || typeof v[a] === 'string'
export function eserGecerli(v: unknown): v is Eser {
  if (!nesne(v) || !metinler(v, ['id', 'ad', 'sehir', 'ilce', 'donem', 'vakif', 'ozet', 'tarihce', 'kapakGorsel']) || !['temsili', 'dogrulanmis'].includes(String(v.dogrulama))) return false
  if (!liste(v.kaynaklar, n => metinler(n, ['id', 'metin']) && istegeBagliMetin(n, 'sayfa')) ||
    !liste(v.gorseller, n => metinler(n, ['dosya', 'alt', 'kaynakId']) && istegeBagliMetin(n, 'aciklama')) ||
    !liste(v.test, n => metinler(n, ['soru', 'aciklama', 'kaynakId']) && Array.isArray(n.secenekler) && n.secenekler.every(s => typeof s === 'string') && typeof n.dogru === 'number') ||
    !liste(v.bilgiNoktalari, n => metinler(n, ['id', 'gorsel', 'baslik', 'metin', 'kaynakId']) && typeof n.x === 'number' && typeof n.y === 'number')) return false
  if (v.tur !== undefined && (!nesne(v.tur) || !metinler(v.tur, ['aciklama']) || !istegeBagliMetin(v.tur, 'baslangic') || !liste(v.tur.duraklar, n => metinler(n, ['id', 'baslik', 'gorsel', 'derinlik', 'metin']) && istegeBagliMetin(n, 'kaynakId') && liste(n.baglantilar, b => metinler(b, ['hedef', 'etiket']))))) return false
  if (v.tur360 !== undefined && (!nesne(v.tur360) || !metinler(v.tur360, ['saglayici', 'embedUrl', 'kaynakUrl', 'aciklama']) || !String(v.tur360.embedUrl).startsWith('https://') || !String(v.tur360.kaynakUrl).startsWith('https://'))) return false
  return Object.keys(eserHatalari(v as unknown as Eser)).length === 0
}

export function eserId(ad: string): string {
  return ad.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
export function tekilId(temel: string, mevcut: string[]): string {
  let id = temel, sira = 2
  while (mevcut.includes(id)) id = `${temel}-${sira++}`
  return id
}
