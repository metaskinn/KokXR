import type { InventoryDetails, InventoryItem, InventorySection } from '../domain/inventory'
import data from './inventory.json'
import detailsData from './inventory-details.json'

// Bundled copy; replaced by the database copy (GET /api/inventory) when the API answers. ES module live bindings carry the new value to importers.
export let inventory = data as InventoryItem[]
/** Facts per inventory id; buildings whose book pages could not be read reliably are absent. */
export let inventoryDetails = detailsData as Record<string, InventoryDetails>
export function replaceInventory(items: InventoryItem[], details: Record<string, InventoryDetails>) {
  if (Array.isArray(items) && items.length && details && typeof details === 'object') { inventory = items; inventoryDetails = details }
}

export const sectionLabels: Record<InventorySection, string> = {
  complex: 'Külliye',
  mosque: 'Cami ve hazire',
  tomb: 'Türbe ve mezar',
  education: 'Eğitim yapısı',
  commercial: 'Ticari yapı',
  water: 'Su yapısı',
  sufi: 'Tekke ve zaviye',
  civil: 'Sivil mimari',
}
