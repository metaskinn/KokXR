import type { Artifact } from '../../../../domain/artifact'
import { typesOf } from '../../../../content/artifactTypeIndex'
export { TYPE_LABELS, typeLabel } from '../../../../domain/artifactTypes'
export { typesOf } from '../../../../content/artifactTypeIndex'

/** Turkish case and accent folding for search. */
export const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

export const collator = new Intl.Collator('tr')

export interface Filters { q: string; city: string; district: string; type: string; model: boolean }
export const noFilters: Filters = { q: '', city: '', district: '', type: '', model: false }
type Facet = 'q' | 'city' | 'district' | 'type' | 'model'

/** Whether an artifact passes every filter except the facets named in `skip` (used for the counts beside each option). */
export function passes(a: Artifact, f: Filters, skip: Facet[] = []) {
  const on = (k: Facet) => !skip.includes(k)
  if (on('city') && f.city && a.city !== f.city) return false
  if (on('district') && f.district && a.district !== f.district) return false
  if (on('type') && f.type && !typesOf(a).includes(f.type)) return false
  if (on('model') && f.model && !a.model) return false
  if (on('q') && f.q.trim()) {
    const q = fold(f.q.trim())
    if (!fold(`${a.name} ${a.district} ${a.city}`).includes(q)) return false
  }
  return true
}

/** Turkish alphabetical order; while searching, names that start with the query come first. */
export function sortResults(list: Artifact[], q: string) {
  const fq = fold(q.trim())
  const rank = (a: Artifact) => (fq && !fold(a.name).startsWith(fq) ? 1 : 0)
  return [...list].sort((a, b) => rank(a) - rank(b) || collator.compare(a.name, b.name))
}

export function countBy(list: Artifact[], key: (a: Artifact) => string | string[]) {
  const out = new Map<string, number>()
  for (const a of list) for (const k of [key(a)].flat()) out.set(k, (out.get(k) ?? 0) + 1)
  return out
}

/** Locative suffix with vowel harmony and consonant assimilation: Bursa'da, Hatay'da, Osmangazi'de, İznik'te. */
export function locative(name: string) {
  const lower = name.toLocaleLowerCase('tr')
  const last = lower.match(/[aeıioöuüâîû]/g)?.at(-1) ?? 'a'
  const vowel = 'aıouâû'.includes(last) ? 'a' : 'e'
  const hard = /[fstkçşhp]$/.test(lower)
  return `${name}’${hard ? 't' : 'd'}${vowel}`
}

/** "Bursa, Konya ve Hatay" */
export const joinTr = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ve ${items.at(-1)}`
