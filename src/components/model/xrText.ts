// VR menüsü ve bilgi kartının saf hesapları: three ve DOM kullanmaz, Node'da da çalışır.

export interface MenuItem { id: string; ad: string }

export const ILLUSTRATIVE_LABEL = 'Temsilî maket · Gerçek bir 3B tarama değildir'
/** Menü panelinin üstündeki başlık bandının yükseklik oranı. */
export const MENU_TITLE_RATIO = 0.2

export function menuItems(d: { inside: boolean; fragmented: boolean; inAssembly?: boolean; stops: { id: string; ad: string }[] }): MenuItem[] {
  const exit = { id: 'exit', ad: "VR'dan çık" }
  if (d.inAssembly) return [{ id: 'assembleFromStart', ad: 'Yeniden başlat' }, { id: 'assembleRelease', ad: 'Birleştirmeyi bırak' }, exit]
  if (d.inside) {
    return [{ id: 'outside', ad: 'Dışarı çık' }, ...d.stops.map(({ id, ad }) => ({ id: `stop:${id}`, ad })), exit]
  }
  // Parçalıyken "Birleştir" zaten var; yanında ikinci bir birleştirme adı karışır.
  if (d.fragmented) return [{ id: 'inside', ad: 'İçeri gir' }, { id: 'shatter', ad: 'Birleştir' }, exit]
  return [{ id: 'inside', ad: 'İçeri gir' }, { id: 'shatter', ad: 'Parçala' }, { id: 'assemble', ad: 'Maketi birleştir' }, exit]
}

// Modül yüklenirken çalışmamalı: bu dosya masaüstü sahnesiyle birlikte yüklenir, API'si olmayan tarayıcıda maket açılmaz.
const splitChars = (word: string): string[] => typeof Intl.Segmenter === 'function'
  ? Array.from(new Intl.Segmenter('tr', { granularity: 'grapheme' }).segment(word), (h) => h.segment)
  : Array.from(word)

/** Metni sözcük sınırından kırar; genişliğe sığmayan tek sözcük harf sınırından bölünür. */
export function wrapLine(text: string, measure: (s: string) => number, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (measure(candidate) <= width) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    line = ''
    if (measure(word) <= width) {
      line = word
      continue
    }
    for (const segment of splitChars(word)) {
      if (line && measure(line + segment) > width) {
        lines.push(line)
        line = ''
      }
      line += segment
    }
  }
  if (line) lines.push(line)
  return lines
}

/** `v` panelin uv.y değeridir (1 üst kenar). Başlık bandına veya panel dışına düşerse `null`. */
export function menuHit(v: number, itemCount: number, titleRatio: number): number | null {
  if (itemCount <= 0 || v < 0 || v > 1) return null
  const body = 1 - titleRatio
  if (v > body) return null
  return Math.min(itemCount - 1, Math.floor(((body - v) / body) * itemCount))
}
