// Integrity of the inventory list (src/content/inventory.json): unique ids, valid links to artifacts, scale-model flags.
import { readFileSync, readdirSync } from 'node:fs'
import assert from 'node:assert/strict'

const inventory = JSON.parse(readFileSync('src/content/inventory.json', 'utf8'))
const dir = 'src/content/artifacts'
const artifacts = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.json'))
  .map((f) => { const a = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); return [a.id, a] }))

const sections = ['complex', 'mosque', 'tomb', 'education', 'commercial', 'water', 'sufi', 'civil']
assert.equal(new Set(inventory.map((e) => e.id)).size, inventory.length, 'ids are unique')
for (const e of inventory) {
  assert.ok(e.name && e.district, `${e.id}: name and district`)
  assert.ok(sections.includes(e.section), `${e.id}: section ${e.section}`)
  assert.ok([1, 2, 3].includes(e.volume), `${e.id}: volume`)
  assert.equal(typeof e.hasScaleModel, 'boolean', `${e.id}: hasScaleModel`)
  if (e.artifactId) assert.ok(artifacts[e.artifactId], `${e.id}: artifact ${e.artifactId} exists`)
  if (e.hasScaleModel) {
    assert.ok(e.artifactId && artifacts[e.artifactId].model, `${e.id}: flagged model but artifact has none`)
    assert.ok(['Osmangazi', 'Yıldırım'].includes(e.district), `${e.id}: models exist only for the Bursa city districts`)
  }
}
const flagged = inventory.filter((e) => e.hasScaleModel)
const withModel = Object.values(artifacts).filter((a) => a.model)
assert.equal(new Set(flagged.map((e) => e.artifactId)).size, flagged.length, 'one flagged building per model')
assert.equal(flagged.length, withModel.length, 'every artifact with a model has exactly one flagged building')
console.log(`Inventory data: ${inventory.length} buildings, ${flagged.length} with a scale model, links and flags passed.`)
