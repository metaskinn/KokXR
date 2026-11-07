import type { InventoryDetails, InventoryItem, InventorySection } from '../domain/inventory'
import data from './inventory.json'
import detailsData from './inventory-details.json'

export const inventory = data as InventoryItem[]
/** Facts per inventory id; buildings whose book pages could not be read reliably are absent. */
export const inventoryDetails = detailsData as Record<string, InventoryDetails>

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
