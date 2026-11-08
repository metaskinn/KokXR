// Integrity of the inventory list (src/content/inventory.json): unique ids, valid links to artifacts, scale-model flags.
import { readFileSync, readdirSync } from 'node:fs'
import assert from 'node:assert/strict'

const inventory = JSON.parse(readFileSync('src/content/inventory.json', 'utf8'))
const dir = 'src/content/artifacts'
const artifacts = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.json'))
  .map((f) => { const a = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); return [a.id, a] }))

const details = JSON.parse(readFileSync('src/content/inventory-details.json', 'utf8'))
const ids = new Set(inventory.map((e) => e.id))
for (const [id, v] of Object.entries(details)) {
  assert.ok(ids.has(id), `details for unknown id ${id}`)
  assert.ok(v.summary && v.source && /^Cilt [123], s\. \d+(-\d+)?$/.test(v.source), `${id}: summary and source`)
  assert.ok(v.summary.split(/\s+/).length <= 45, `${id}: summary too long`)
}
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

// Artifact modules: each artifact's inventoryId must point at a real inventory row, once per row, and its image paths must be bucket keys.
// Photos live in the private bucket, not in public/; whether each key is really there is checked online by scripts/storage-check.mjs.
const seen = new Map()
for (const a of Object.values(artifacts)) {
  if (!a.inventoryId) continue
  assert.ok(ids.has(a.inventoryId), `${a.id}: inventoryId ${a.inventoryId} is not in the inventory`)
  assert.ok(!seen.has(a.inventoryId), `${a.id} and ${seen.get(a.inventoryId)} both claim ${a.inventoryId}`)
  seen.set(a.inventoryId, a.id)
  for (const g of a.images ?? []) assert.ok(/^\/(api\/media\/)?images\/[a-z0-9-]+\/[^/]+/.test(g.file), `${a.id}: image path is not a bucket key: ${g.file}`)
}
console.log(`Artifact modules: ${seen.size} linked to the inventory.`)
