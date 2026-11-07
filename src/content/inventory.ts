import type { InventoryItem, InventorySection } from '../domain/inventory'
import data from './inventory.json'

export const inventory = data as InventoryItem[]

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
