// Every artifact image must have a credit line.
import { readdirSync, readFileSync } from 'node:fs'
const folder = 'src/content/artifacts/'
for (const file of readdirSync(folder)) {
  const artifact = JSON.parse(readFileSync(folder + file, 'utf8'))
  for (const g of artifact.images) if (!g.credit?.trim()) throw new Error(`${file}: ${g.file} has no credit`)
  for (const g of artifact.images) if (!artifact.sources.some((k) => k.text === g.credit)) throw new Error(`${file}: credit missing from the source list`)
}
console.log('Image credits: all artifacts passed.')
