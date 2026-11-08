// Usage: node scripts/new-artifact.mjs <inventory-id> <english-slug>
// Writes a draft artifact to drafts/artifacts/<slug>.json from the inventory entry and its book summary.
// A draft is not loaded by the app. Fill in the TODO fields (photos, 3 questions, sources), then move it to
// src/content/artifacts/ and put the photos in public/images/<slug>/. No shared file needs editing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const [id, slug] = process.argv.slice(2)
const inventory = JSON.parse(readFileSync('src/content/inventory.json', 'utf8'))
const details = JSON.parse(readFileSync('src/content/inventory-details.json', 'utf8'))
const item = inventory.find((e) => e.id === id)
if (!item || !/^[a-z0-9-]+$/.test(slug ?? '')) {
  console.error('Usage: node scripts/new-artifact.mjs <inventory-id> <english-slug>\nUnknown inventory id or invalid slug.')
  process.exit(1)
}
const file = `drafts/artifacts/${slug}.json`
if (existsSync(file) || existsSync(`src/content/artifacts/${slug}.json`)) { console.error(`${slug} already exists.`); process.exit(1) }
const d = details[id]
const source = d ? `Bursa Vakıf Eserleri, ${d.source}` : 'TODO'
const draft = {
  id: slug,
  inventoryId: id,
  name: item.name,
  city: 'Bursa',
  district: item.district,
  period: d?.date ?? 'TODO',
  endowment: d?.builder ?? 'Kitapta belirtilmemiştir',
  summary: d?.summary ?? 'TODO',
  history: d?.summary ?? 'TODO',
  verification: 'illustrative',
  coverImage: `/images/${slug}/TODO.jpg`,
  images: [],
  hotspots: [],
  test: [],
  sources: [{ id: 'book', text: source }],
}
mkdirSync('drafts/artifacts', { recursive: true })
writeFileSync(file, JSON.stringify(draft, null, 2) + '\n')
console.log(`Draft written: ${file}\nNext (or use /admin instead): fill the fields and 3 questions, move the file to src/content/artifacts/, put photos in a temporary public/images/${slug}/ and run node scripts/storage-upload-images.mjs, then npm run db:setup.`)
