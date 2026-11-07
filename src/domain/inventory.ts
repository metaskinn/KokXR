/** Section of the printed inventory a building is listed under (the book's own classification). */
export type InventorySection = 'complex' | 'mosque' | 'tomb' | 'education' | 'commercial' | 'water' | 'sufi' | 'civil'

/**
 * One building from the contents pages of "Bursa Vakıf Eserleri" (Vakıf Katılım, 2026), volumes 1-3.
 * Only the name, district, section and volume come from the book; descriptions and photos are separate artifact data.
 */
export interface InventoryItem {
  id: string
  name: string
  district: string
  section: InventorySection
  /** Volume of the printed inventory the entry appears in. */
  volume: 1 | 2 | 3
  /** Complex (külliye) the building is listed under, when the book groups it. */
  group?: string
  /** Artifact that has a model covering this building's complex. Set on complex members and the main building. */
  artifactId?: string
  /** True only for the main building that an existing artifact's scale model represents. New entries default to false. */
  hasScaleModel: boolean
}

/** Short facts for one building, written in our own words from the printed inventory. Fields are null-free: absent means the book does not state it. */
export interface InventoryDetails {
  builder?: string
  date?: string
  architect?: string
  location?: string
  summary: string
  /** Volume and printed page the facts were taken from, e.g. "Cilt 1, s. 37". */
  source: string
}
