// VR menüsü ve bilgi kartının saf hesapları: three ve DOM kullanmaz, Node'da da çalışır.

export interface MenuOgesi { id: string; ad: string }

export const TEMSILI_ETIKET = 'Temsilî maket · Gerçek bir 3B tarama değildir'
/** Menü panelinin üstündeki başlık bandının yükseklik oranı. */
export const MENU_BASLIK_ORANI = 0.2

export function menuOgeleri(d: { iceride: boolean; parcali: boolean; duraklar: { id: string; ad: string }[] }): MenuOgesi[] {
  const cik = { id: 'cik', ad: "VR'dan çık" }
  if (d.iceride) {
    return [{ id: 'disari', ad: 'Dışarı çık' }, ...d.duraklar.map(({ id, ad }) => ({ id: `durak:${id}`, ad })), cik]
  }
  return [{ id: 'iceri', ad: 'İçeri gir' }, { id: 'parcala', ad: d.parcali ? 'Birleştir' : 'Parçala' }, cik]
}

const harfler = new Intl.Segmenter('tr', { granularity: 'grapheme' })

/** Metni sözcük sınırından kırar; genişliğe sığmayan tek sözcük harf sınırından bölünür. */
export function satirKir(metin: string, olc: (s: string) => number, genislik: number): string[] {
  const satirlar: string[] = []
  let satir = ''
  for (const soz of metin.split(/\s+/).filter(Boolean)) {
    const aday = satir ? `${satir} ${soz}` : soz
    if (olc(aday) <= genislik) {
      satir = aday
      continue
    }
    if (satir) satirlar.push(satir)
    satir = ''
    if (olc(soz) <= genislik) {
      satir = soz
      continue
    }
    for (const { segment } of harfler.segment(soz)) {
      if (satir && olc(satir + segment) > genislik) {
        satirlar.push(satir)
        satir = ''
      }
      satir += segment
    }
  }
  if (satir) satirlar.push(satir)
  return satirlar
}

/** `v` panelin uv.y değeridir (1 üst kenar). Başlık bandına veya panel dışına düşerse `null`. */
export function menuIsabet(v: number, ogeSayisi: number, baslikOrani: number): number | null {
  if (ogeSayisi <= 0 || v < 0 || v > 1) return null
  const govde = 1 - baslikOrani
  if (v > govde) return null
  return Math.min(ogeSayisi - 1, Math.floor(((govde - v) / govde) * ogeSayisi))
}
