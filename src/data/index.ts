import type { Eser } from '../types/eser'

const eserDosyalari = import.meta.glob<Eser>('./eserler/*.json', {
  eager: true,
  import: 'default',
})

export function eserleriGetir(): Eser[] {
  return Object.values(eserDosyalari)
}
