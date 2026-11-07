// Herkese açık yayın çıktısını hazırlar: arşiv fotoğrafı kaynaklı klasörleri siler, izinli pano dışında fotoğraf kaldıysa durdurur.
// Kullanım: npm run build:acik
import { readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const kok = process.argv[2] ?? 'dist'
for (const klasor of ['gorseller', 'derinlik']) rmSync(join(kok, klasor), { recursive: true, force: true })

const IZINLI = join('restorasyon', 'muradiye-cini.jpg')
const kalan = readdirSync(kok, { recursive: true }).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(String(f)) && f !== IZINLI && !String(f).startsWith('ikonlar'))
if (kalan.length) throw new Error(`Açık yayında fotoğraf kaldı: ${kalan.join(', ')}`)

writeFileSync(join(kok, 'vercel.json'), JSON.stringify({
  redirects: [
    { source: '/c', destination: '/eser/ulu-camii', permanent: false },
    { source: '/m', destination: '/eser/muradiye-kulliyesi', permanent: false },
    { source: '/v', destination: '/atolye/vazo', permanent: false },
  ],
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
}, null, 2))
console.log('Açık yayın hazır: yalnız Muradiye panosu fotoğrafı var.')
