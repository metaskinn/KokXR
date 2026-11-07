// Herkese açık yayın çıktısını hazırlar: arşiv fotoğrafı kaynaklı klasörleri siler, izinli pano dışında fotoğraf kaldıysa durdurur.
// Kullanım: npm run build:acik
import { readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? 'dist'
for (const folder of ['images', 'depth']) rmSync(join(root, folder), { recursive: true, force: true })

const ALLOWED = join('restoration', 'muradiye-tile.jpg')
const remaining = readdirSync(root, { recursive: true }).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(String(f)) && f !== ALLOWED)
if (remaining.length) throw new Error(`Açık yayında fotoğraf kaldı: ${remaining.join(', ')}`)

writeFileSync(join(root, 'vercel.json'), JSON.stringify({
  redirects: [
    { source: '/c', destination: '/artifact/ulu-mosque', permanent: false },
    { source: '/m', destination: '/artifact/muradiye-complex', permanent: false },
    { source: '/v', destination: '/workshop/vase', permanent: false },
  ],
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
}, null, 2))
console.log('Açık yayın hazır: yalnız Muradiye panosu fotoğrafı var.')
