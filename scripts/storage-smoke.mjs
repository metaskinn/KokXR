// Neon Object Storage check: uploads a small text file to the "uploads" bucket, lists it, reads it back.
// Usage: node scripts/storage-smoke.mjs   (reads AWS_* from .env.local; prints no secrets)
import { existsSync } from 'node:fs'
import { Files } from 'files-sdk'
import { neon } from 'files-sdk/neon'

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f)
const files = new Files({ adapter: neon({ bucket: 'uploads' }) })
const key = `smoke/kokxr-${Date.now()}.txt`
const text = `KökXR object storage testi — ${new Date().toISOString()}`

await files.upload(key, text, { contentType: 'text/plain; charset=utf-8' })
console.log(`Uploaded: ${key}`)
const listed = await files.list({ prefix: 'smoke/' })
console.log('List (smoke/):', JSON.stringify(listed, (k, v) => (k === 'url' ? '<presigned>' : v)))
const back = await (await files.download(key)).text()
console.log(`Read back: "${back}"`)
console.log(back === text ? 'PASS: content matches' : 'FAIL: content differs')
