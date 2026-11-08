// Vakıf Katılım inventory books (public PDFs) and the link from a source to the cited page.
// Only `import type` here: tests load this file directly with Node's type stripping.
import type { Source } from '../domain/artifact'

/** pdfPage = floor(printed / perPdfPage) + add, for printed pages from `fromPrinted` on (until the next range). */
export interface PageRange { fromPrinted: number; perPdfPage: 1 | 2; add: number }
export interface InventoryBook {
  id: string
  city: 'Bursa' | 'Konya' | 'Hatay'
  volume?: number
  label: string
  url: string
  /** Page count of the PDF; a computed page outside 1..pdfPages is not linked. */
  pdfPages: number
  pages: PageRange[]
}

const ROOT = 'https://www.vakifkatilim.com.tr/documents/KurumsalIletisim'

// Measured on the local copies with pdftotext (November 2026). Every PDF page is a two-page spread; each book
// has one range: the printed page numbers found on 260–490 PDF pages per book all fit the formula, none differ.
// The public files have the same byte size as the measured copies.
export const INVENTORY_BOOKS: InventoryBook[] = [
  { id: 'bursa-1', city: 'Bursa', volume: 1, label: 'Bursa Vakıf Eserleri Envanteri, Cilt 1', url: `${ROOT}/yayinlarimiz/bursa-envanteri-cilt-1.pdf`, pdfPages: 245, pages: [{ fromPrinted: 1, perPdfPage: 2, add: 1 }] },
  { id: 'bursa-2', city: 'Bursa', volume: 2, label: 'Bursa Vakıf Eserleri Envanteri, Cilt 2', url: `${ROOT}/yayinlarimiz/bursa-envanteri-cilt-2.pdf`, pdfPages: 289, pages: [{ fromPrinted: 1, perPdfPage: 2, add: 1 }] },
  { id: 'bursa-3', city: 'Bursa', volume: 3, label: 'Bursa Vakıf Eserleri Envanteri, Cilt 3', url: `${ROOT}/yayinlarimiz/bursa-envanteri-cilt-3.pdf`, pdfPages: 209, pages: [{ fromPrinted: 1, perPdfPage: 2, add: 1 }] },
  { id: 'konya-1', city: 'Konya', volume: 1, label: 'Konya Vakıf Eserleri Envanteri, Cilt 1', url: `${ROOT}/yayinlarimiz/konya-envanteri-1_cilt-web.pdf`, pdfPages: 246, pages: [{ fromPrinted: 1, perPdfPage: 2, add: 2 }] },
  { id: 'konya-2', city: 'Konya', volume: 2, label: 'Konya Vakıf Eserleri Envanteri, Cilt 2', url: `${ROOT}/yayinlarimiz/konya-envanteri-2_cilt-web.pdf`, pdfPages: 167, pages: [{ fromPrinted: 1, perPdfPage: 2, add: 2 }] },
  { id: 'hatay', city: 'Hatay', label: 'Hatay Vakıf Eserleri', url: `${ROOT}/hatay-vakif-eserleri.pdf`, pdfPages: 249, pages: [{ fromPrinted: 1, perPdfPage: 2, add: 1 }] },
]

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3 }
const volumeOf = (v: string) => ROMAN[v.toUpperCase()] ?? Number(v)

export interface BookCitation { book: InventoryBook; district: string; item: string }

/**
 * Reads a book citation from the source text: `Vakıf Eserleri Envanteri – Bursa, Cilt 1, Osmangazi, "Hamza Bey Külliyesi"`
 * (also "1. cilt", "II. Cilt") or `Hatay Vakıf Eserleri, Antakya, "Habib-i Neccar Camii"`. Photo credits start with
 * "Fotoğraf:" and do not match.
 */
export function parseBookCitation(text: string): BookCitation | undefined {
  const rest = (tail: string) => {
    const m = tail.match(/^(?:,\s*([^,"\s][^,"]*))?(?:,\s*"([^"]*)")?\s*(.*)$/)
    return { district: m?.[1]?.trim() ?? '', item: m?.[2] ?? '' }
  }
  const inv = text.trim().match(/^Vakıf Eserleri Envanteri\s*[–-]\s*(Bursa|Konya),\s*(?:Cilt\s*(\d|I{1,3})|(\d|I{1,3})\.\s*[Cc]ilt)\b(.*)$/)
  if (inv) {
    const volume = volumeOf(inv[2] ?? inv[3])
    const book = INVENTORY_BOOKS.find((b) => b.city === inv[1] && b.volume === volume)
    return book && { book, ...rest(inv[4]) }
  }
  const hatay = text.trim().match(/^Hatay Vakıf Eserleri\b(.*)$/)
  if (hatay) return { book: INVENTORY_BOOKS.find((b) => b.id === 'hatay')!, ...rest(hatay[1]) }
  return undefined
}

/** Text in the data's format: `Vakıf Eserleri Envanteri – Bursa, Cilt 1, Osmangazi, "Madde"`; empty parts are left out. */
export function bookCitationText({ book, district, item }: BookCitation): string {
  const head = book.city === 'Hatay' ? 'Hatay Vakıf Eserleri' : `Vakıf Eserleri Envanteri – ${book.city}, Cilt ${book.volume}`
  return [head, district.trim(), item.trim() ? `"${item.trim()}"` : ''].filter(Boolean).join(', ')
}

/** First number of "177", "177-178" or "177, 180". */
export function firstPage(page?: string): number | undefined {
  const m = page?.match(/\d+/)
  return m ? Number(m[0]) : undefined
}

/** PDF page index of a printed page, or undefined when it falls outside the PDF. */
export function pdfPage(book: InventoryBook, printed: number): number | undefined {
  const range = [...book.pages].reverse().find((r) => printed >= r.fromPrinted)
  if (!range || printed < 1) return undefined
  const page = Math.floor(printed / range.perPdfPage) + range.add
  return page >= 1 && page <= book.pdfPages ? page : undefined
}

const webUrl = (url?: string) => { try { return url && ['http:', 'https:'].includes(new URL(url).protocol) ? url : undefined } catch { return undefined } }

export interface SourceLinkInfo { href: string; kind: 'book' | 'url'; page?: number }

/** Link for a source: the inventory book's PDF at the cited page first, else the source's own http(s) `url`. */
export function sourceLinkInfo(source: Source): SourceLinkInfo | undefined {
  const citation = parseBookCitation(source.text)
  if (citation) {
    const printed = firstPage(source.page)
    const page = printed === undefined ? undefined : pdfPage(citation.book, printed)
    if (page !== undefined) return { href: `${citation.book.url}#page=${page}`, kind: 'book', page: printed }
    if (printed === undefined) return { href: citation.book.url, kind: 'book' }
  }
  const url = webUrl(source.url)
  return url ? { href: url, kind: 'url' } : undefined
}

export function sourceLink(source: Source): string | undefined {
  return sourceLinkInfo(source)?.href
}
