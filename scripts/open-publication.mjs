// Prepares the public build output: deletes folders sourced from archive photos, stops if any photo other than the permitted panel remains.
// Usage: npm run build:acik
import { readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? 'dist'
for (const folder of ['images', 'depth']) rmSync(join(root, folder), { recursive: true, force: true })

const ALLOWED = join('restoration', 'muradiye-tile.jpg')
const remaining = readdirSync(root, { recursive: true }).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(String(f)) && f !== ALLOWED)
if (remaining.length) throw new Error(`Photos left in the public build: ${remaining.join(', ')}`)

writeFileSync(join(root, 'vercel.json'), JSON.stringify({
  redirects: [
    { source: '/c', destination: '/artifact/ulu-mosque', permanent: false },
    { source: '/m', destination: '/artifact/muradiye-complex', permanent: false },
    { source: '/v', destination: '/workshops/vase', permanent: false },
  ],
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
}, null, 2))
console.log('Public build ready: only the Muradiye panel photo remains.')
