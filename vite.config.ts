import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Derlenen JS ve CSS dosyalarını çevrimdışı kullanım için ön belleğe alan dist/sw.js dosyasını üretir.
function serviceWorker(): Plugin {
  return {
    name: 'kokxr-service-worker',
    apply: 'build',
    generateBundle(_, paket) {
      const dosyalar = Object.keys(paket).filter((ad) => /\.(js|css)$/.test(ad)).map((ad) => `/${ad}`).sort()
      const liste = ['/index.html', '/manifest.webmanifest', '/favicon.svg', '/ikonlar/ikon-192.png', ...dosyalar]
      const surum = createHash('sha256').update(liste.join()).digest('hex').slice(0, 12)
      const kaynak = readFileSync('scripts/sw-sablon.js', 'utf8')
        .replace('__SURUM__', surum)
        .replace('__ON_YUKLEME__', JSON.stringify(liste))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: kaynak })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
})
