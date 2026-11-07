// Her eser görselinin kredi satırı olmalı.
import { readdirSync, readFileSync } from 'node:fs'
const folder = 'src/content/artifacts/'
for (const file of readdirSync(folder)) {
  const artifact = JSON.parse(readFileSync(folder + file, 'utf8'))
  for (const g of artifact.images) if (!g.credit?.trim()) throw new Error(`${file}: ${g.file} görselinde kredi yok`)
  for (const g of artifact.images) if (!artifact.sources.some((k) => k.text === g.credit)) throw new Error(`${file}: kredi kaynak listesinde yok`)
}
console.log('Görsel kredileri: tüm eserler başarılı.')
