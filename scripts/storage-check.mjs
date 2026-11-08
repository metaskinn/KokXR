// Every photo referenced by published artifacts must be recorded in the media table (= uploaded to the private bucket).
// Usage: node scripts/storage-check.mjs   (reads DATABASE_URL from .env.local)
import { existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f)
const db = neon(process.env.DATABASE_URL)
const rows = await db`select id, published from artifacts where published is not null`
const keys = new Set((await db`select key from media`).map((r) => r.key))
const missing = []
let refs = 0
for (const { id, published } of rows) {
  for (const m of JSON.stringify(published).matchAll(/"\/(?:api\/media\/)?(images\/[^"]+)"/g)) {
    refs++
    if (!keys.has(m[1])) missing.push(`${id}: ${m[1]}`)
  }
}
console.log(`${rows.length} artifacts, ${refs} image references, ${keys.size} files in media, ${missing.length} missing.`)
if (missing.length) { console.log(missing.slice(0, 20).join('\n')); process.exit(1) }
