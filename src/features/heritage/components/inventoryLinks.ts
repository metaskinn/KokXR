import type { Artifact } from '../../../domain/artifact'
import type { InventoryItem } from '../../../domain/inventory'
import { inventory, inventoryDetails } from '../../../content/inventory'

/** At most this many "Aynı külliyede" links (UX brief §4.2). */
const MAX_SIBLINGS = 8

export interface InventoryLinks {
  /** "Envanter kaydı: …" text, when the artifact has its own row in the Bursa inventory. */
  record?: string
  /** Complex the building is listed under, with the complex's own artifact page when that is another page. */
  group?: { name: string; artifact?: Artifact }
  /** Other buildings of the same complex that have their own artifact page. */
  siblings: Artifact[]
  /** Number of the complex's buildings with a page that are not in `siblings` (over the limit). */
  more: number
  /** True when this artifact is the complex page itself (its group rows all point to it). */
  isComplex: boolean
}

/** The artifact's own inventory row: its `inventoryId`, else the single row pointing to it, else the complex's main (model) row. */
function ownRow(artifact: Artifact): InventoryItem | undefined {
  if (artifact.inventoryId) return inventory.find((row) => row.id === artifact.inventoryId)
  const rows = inventory.filter((row) => row.artifactId === artifact.id)
  if (rows.length <= 1) return rows[0]
  return rows.find((row) => row.hasScaleModel) ?? rows[0]
}

/** "Cilt 1, s. 145" + district → "Vakıf Eserleri Envanteri – Bursa, Cilt 1, Osmangazi, s. 145". Only facts in the data are used. */
function recordText(row: InventoryItem) {
  const source = inventoryDetails[row.id]?.source
  const match = source?.match(/^Cilt\s*(\d)\s*,\s*(s\.\s*.+)$/)
  const volume = match ? match[1] : String(row.volume)
  return `Vakıf Eserleri Envanteri – Bursa, Cilt ${volume}, ${row.district}${match ? `, ${match[2]}` : ''}`
}

/** Inventory facts for the artifact page; empty for artifacts outside the Bursa inventory (Konya, Hatay). */
export function inventoryLinks(artifact: Artifact, artifacts: Artifact[]): InventoryLinks {
  const empty = { siblings: [], more: 0, isComplex: false }
  if (artifact.city !== 'Bursa') return empty
  const row = ownRow(artifact)
  if (!row) return empty
  const record = recordText(row)
  if (!row.group) return { ...empty, record }
  const groupRows = inventory.filter((r) => r.group === row.group)
  const complexId = groupRows.find((r) => r.artifactId)?.artifactId
  const isComplex = complexId === artifact.id && !artifact.inventoryId
  const complexPage = complexId && complexId !== artifact.id ? artifacts.find((a) => a.id === complexId) : undefined
  const pages = groupRows
    .filter((r) => r.id !== row.id)
    .map((r) => artifacts.find((a) => a.inventoryId === r.id))
    .filter((a): a is Artifact => !!a && a.id !== artifact.id)
  return {
    record: isComplex ? undefined : record,
    group: { name: complexPage?.name ?? row.group, artifact: complexPage },
    siblings: pages.slice(0, MAX_SIBLINGS),
    more: Math.max(0, pages.length - MAX_SIBLINGS),
    isComplex,
  }
}
