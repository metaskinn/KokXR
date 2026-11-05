// VR'da maket birleştirmenin saf hesapları: three ve DOM kullanmaz, Node testinde doğrudan çalışır.
// Sıra yalnız maketin üst üste oturma sırasıdır (katman listesi alttan üste); tarihî inşa sırası değildir.
export type Uclu = [number, number, number]
export interface Kutu { min: Uclu; max: Uclu }
export interface KatmanAdayi { id: number; merkez: Uclu; yaricap: number }
export type BirakmaSonucu = 'oturdu' | 'sira' | 'uzak'

/** Katman hedefe bu kadar yakınsa oturur. Sahne birimi: rig 100× iken cm. */
export const OTURMA_ESIGI = 18
/** Katmanlar elden geniş, raf da kol boyundan uzak: el 1 cm giderse katman 2 cm gider. */
export const EL_KAZANCI = 2
/** Işın menzili (sahne birimi). */
export const ISIN_MENZIL = 300

// Rig başlangıç açısında kullanıcının sağı sahnede -x yönüdür: raf maketin hemen sağındadır.
const RAF_X = -85, RAF_TABAN = 18, RAF_ARA = 10

/** Raftaki yerler (katmanın evine göre kayma). En üst katman en alt rafa gelir: maketin kendi dizilişini ele vermesin. */
export function rafDizilimi(kutular: Kutu[]): Uclu[] {
  const sonuc: Uclu[] = []
  let taban = RAF_TABAN
  for (let id = kutular.length - 1; id >= 0; id--) {
    const { min, max } = kutular[id]
    sonuc[id] = [RAF_X - (min[0] + max[0]) / 2, taban - min[1], -(min[2] + max[2]) / 2]
    taban += max[1] - min[1] + RAF_ARA
  }
  return sonuc
}

/** Katmanlar geniştir, kumanda çoğu zaman birinin içinde kalır: önce nişan alınan, yoksa değilen katman. Aday yoksa `null`. */
export function katmanSec(baslangic: Uclu, yon: Uclu, adaylar: KatmanAdayi[], menzil = ISIN_MENZIL): number | null {
  let dokunan: number | null = null, enDokunus = 1
  let nisanlanan: number | null = null, enNisan = 1
  for (const { id, merkez, yaricap } of adaylar) {
    const f: Uclu = [merkez[0] - baslangic[0], merkez[1] - baslangic[1], merkez[2] - baslangic[2]]
    const uzaklik = Math.hypot(...f)
    if (uzaklik / yaricap < enDokunus) { enDokunus = uzaklik / yaricap; dokunan = id }
    const t = f[0] * yon[0] + f[1] * yon[1] + f[2] * yon[2]
    if (t <= 0 || t > menzil) continue
    const dik = Math.sqrt(Math.max(0, uzaklik * uzaklik - t * t))
    if (dik / yaricap < enNisan) { enNisan = dik / yaricap; nisanlanan = id }
  }
  return nisanlanan ?? dokunan
}

/** Tutulan katmanın yeni yeri: başladığı yer, artı elin aldığı yolun kazançlısı. */
export function tasinanYer(parcaBas: Uclu, elBas: Uclu, el: Uclu, kazanc = EL_KAZANCI): Uclu {
  return [
    parcaBas[0] + (el[0] - elBas[0]) * kazanc,
    parcaBas[1] + (el[1] - elBas[1]) * kazanc,
    parcaBas[2] + (el[2] - elBas[2]) * kazanc,
  ]
}

/** `oturan`: yerine oturmuş katman sayısı, aynı zamanda sıradaki katmanın kimliği. Yakında değilse sıra sorulmaz. */
export function birakmaSonucu(id: number, oturan: number, uzaklik: number, esik = OTURMA_ESIGI): BirakmaSonucu {
  if (uzaklik >= esik) return 'uzak'
  return id === oturan ? 'oturdu' : 'sira'
}

export interface BirlesimMetni { ust: string; mesaj: string; not: string }

const SIRA_NOTU = 'Sıra, maketin üst üste oturma sırasıdır; tarihî inşa sırası değildir.'

/** Durum panelinin metni. `son` son bırakma; yoksa ipucu yazar. */
export function birlesimMetni(oturan: number, adlar: string[], son?: { sonuc: BirakmaSonucu; id: number }): BirlesimMetni {
  const ilerleme = `${oturan}/${adlar.length} katman yerinde`
  if (oturan >= adlar.length) return { ust: `Tamamlandı: ${ilerleme}`, mesaj: 'Maket birleşti.', not: SIRA_NOTU }
  const ust = `Maketi birleştir: ${ilerleme}`
  let mesaj = 'Kavrama tuşuyla tut, yerine götür, bırak. Menü: B veya Y.'
  if (son?.sonuc === 'oturdu') mesaj = `${adlar[son.id]} yerine oturdu.`
  else if (son?.sonuc === 'sira') mesaj = `Önce ${adlar[oturan]} oturmalı. Sıra alttan üste gider.`
  else if (son?.sonuc === 'uzak') mesaj = 'Yerine yaklaşmadı. Yeniden dene.'
  return { ust, mesaj, not: SIRA_NOTU }
}
