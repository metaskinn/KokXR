// Creates the tables (server/schema.sql) and loads the 706 artifact JSON files as published content.
// Every file goes through the same validation as the API (server/handlers.ts cleanArtifact).
// Usage: npm run db:setup            → schema + add missing artifacts (existing rows are left alone)
//        npm run db:setup -- --reset → also overwrite rows with the JSON files (drafts are cleared)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createServer } from 'vite'
import { neon } from '@neondatabase/serverless'

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f)
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL is not set (.env.local).'); process.exit(1) }
const reset = process.argv.includes('--reset')
const db = neon(url)

// Load the TypeScript validation through Vite so the rules are not duplicated here.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { cleanArtifact } = await vite.ssrLoadModule('/server/handlers.ts')

const schema = readFileSync('server/schema.sql', 'utf8').replace(/--.*$/gm, '')
for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) await db.query(statement)
console.log('Schema ready.')

const dir = 'src/content/artifacts'
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
const bad = []
const rows = []
for (const f of files) {
  const raw = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))
  const { artifact, errors } = cleanArtifact(raw, raw.id)
  if (!artifact) bad.push(`${f}: ${JSON.stringify(errors)}`)
  else rows.push(artifact)
}
if (bad.length) { console.error(`${bad.length} invalid files, nothing loaded:\n${bad.slice(0, 20).join('\n')}`); await vite.close(); process.exit(1) }

let written = 0
for (let i = 0; i < rows.length; i += 100) {
  const chunk = rows.slice(i, i + 100)
  const ids = chunk.map((a) => a.id), data = chunk.map((a) => JSON.stringify(a))
  const result = reset
    ? await db.query(`insert into artifacts (id, status, published, updated_by)
        select id, 'published', data::jsonb, 'seed' from unnest($1::text[], $2::text[]) as t(id, data)
        on conflict (id) do update set status = 'published', published = excluded.published, draft = null, review_note = null, updated_by = 'seed', updated_at = now()
        returning id`, [ids, data])
    : await db.query(`insert into artifacts (id, status, published, updated_by)
        select id, 'published', data::jsonb, 'seed' from unnest($1::text[], $2::text[]) as t(id, data)
        on conflict (id) do nothing returning id`, [ids, data])
  written += result.length
}
if (written) await db.query(`insert into audit_log (artifact_id, action, actor, note) values ('*', 'seed', 'script', $1)`, [`${written} artifacts from JSON${reset ? ' (reset)' : ''}`])
// Inventory: replaced as a whole from the JSON files (it is reference data from the printed book, not edited in the admin).
const inventory = JSON.parse(readFileSync('src/content/inventory.json', 'utf8'))
const details = JSON.parse(readFileSync('src/content/inventory-details.json', 'utf8'))
const col = (k) => inventory.map((e) => e[k] ?? null)
await db.transaction([
  db.query('delete from inventory'),
  db.query(`insert into inventory (id, name, district, section, volume, grp, artifact_id, has_scale_model)
    select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[], $7::text[], $8::bool[])`,
    [col('id'), col('name'), col('district'), col('section'), col('volume'), col('group'), col('artifactId'), inventory.map((e) => !!e.hasScaleModel)]),
  db.query(`insert into inventory_details (id, data) select id, data::jsonb from unnest($1::text[], $2::text[]) as t(id, data)`,
    [Object.keys(details), Object.values(details).map((d) => JSON.stringify(d))]),
])
const [inv] = await db.query('select (select count(*) from inventory)::int as rows, (select count(*) from inventory_details)::int as details')
console.log(`Inventory: ${inv.rows} buildings, ${inv.details} with facts.`)

const [{ count }] = await db.query('select count(*)::int as count from artifacts where published is not null')
console.log(`${files.length} files valid; ${written} rows written; ${count} published artifacts in the database.`)
await vite.close()
