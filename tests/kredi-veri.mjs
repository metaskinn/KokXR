// Her eser görselinin kredi satırı olmalı.
import { readdirSync, readFileSync } from 'node:fs'
const klasor = 'src/data/eserler/'
for (const dosya of readdirSync(klasor)) {
  const eser = JSON.parse(readFileSync(klasor + dosya, 'utf8'))
  for (const g of eser.gorseller) if (!g.kredi?.trim()) throw new Error(`${dosya}: ${g.dosya} görselinde kredi yok`)
  for (const g of eser.gorseller) if (!eser.kaynaklar.some((k) => k.metin === g.kredi)) throw new Error(`${dosya}: kredi kaynak listesinde yok`)
}
console.log('Görsel kredileri: tüm eserler başarılı.')
