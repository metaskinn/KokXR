// Uploads public/images/** to the private "uploads" bucket as images/<artifact-id>/<file> and records each key in the media table.
// Safe to run again: keys already in the bucket are skipped, so an interrupted run continues where it stopped.
// Usage: node scripts/storage-upload-images.mjs   (reads DATABASE_URL and AWS_* from .env.local; prints no secrets)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { Files } from 'files-sdk'
import { neon as neonFiles } from 'files-sdk/neon'
import { neon } from '@neondatabase/serverless'

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f)
const files = new Files({ adapter: neonFiles({ bucket: 'uploads' }) })
const db = neon(process.env.DATABASE_URL)
const ROOT = 'public/images'
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const CONCURRENCY = 8

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)])
const local = walk(ROOT).filter((p) => TYPES[extname(p).toLowerCase()])

// Keys already in the bucket (paged listing).
const existing = new Set()
let cursor
do {
  const page = await files.list({ prefix: 'images/', cursor })
  for (const item of page.items) existing.add(item.key)
  cursor = page.cursor ?? page.nextCursor
} while (cursor)

const todo = local.filter((p) => !existing.has(`images/${relative(ROOT, p)}`))
console.log(`${local.length} local images, ${existing.size} already in the bucket, ${todo.length} to upload.`)

let done = 0, failed = 0, bytes = 0
const rows = []
async function flush() {
  if (!rows.length) return
  const batch = rows.splice(0)
  await db.query(`insert into media (key, artifact_id, size, content_type, etag, source)
    select key, artifact_id, size, content_type, etag, 'repo' from unnest($1::text[], $2::text[], $3::bigint[], $4::text[], $5::text[]) as t(key, artifact_id, size, content_type, etag)
    on conflict (key) do update set size = excluded.size, etag = excluded.etag, uploaded_at = now()`,
    [batch.map((r) => r.key), batch.map((r) => r.artifactId), batch.map((r) => r.size), batch.map((r) => r.type), batch.map((r) => r.etag)])
}
async function worker(queue) {
  for (let p = queue.shift(); p; p = queue.shift()) {
    const rel = relative(ROOT, p), key = `images/${rel}`, type = TYPES[extname(p).toLowerCase()]
    try {
      const body = readFileSync(p)
      const out = await files.upload(key, body, { contentType: type, cacheControl: 'private, max-age=86400' })
      rows.push({ key, artifactId: rel.split('/')[0], size: statSync(p).size, type, etag: out?.etag ?? null })
      bytes += body.length
      if (rows.length >= 100) await flush()
    } catch (e) { failed++; console.error(`FAIL ${key}: ${e.message}`) }
    if (++done % 100 === 0) console.log(`${done}/${todo.length} (${(bytes / 1e6).toFixed(0)} MB)`)
  }
}
const queue = [...todo]
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)))
await flush()

// Rows for keys that were uploaded in an earlier run but not recorded.
const [{ count }] = await db.query('select count(*)::int as count from media where key like $1', ['images/%'])
console.log(`Done: ${done - failed} uploaded, ${failed} failed, ${(bytes / 1e6).toFixed(0)} MB. media rows (images/): ${count}.`)
process.exit(failed ? 1 : 0)
