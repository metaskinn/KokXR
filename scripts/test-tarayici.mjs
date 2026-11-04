// Tarayıcı testlerini tek komutla çalıştırır: preview'i açar, testleri sırayla koşar, kısa özet yazar, sunucuyu kapatır.
// Kullanım: node scripts/test-tarayici.mjs [test adı ...]   örn. maket-xr-dugme   (önce npm run build)
import { spawn } from 'node:child_process'

const PORT = '4173'
const testler = process.argv.slice(2).length ? process.argv.slice(2) : ['maket-xr-dugme', 'maket-ic']

function calistir(komut, argumanlar) {
  return new Promise((coz) => {
    const surec = spawn(komut, argumanlar, { stdio: ['ignore', 'pipe', 'pipe'] })
    let cikti = ''
    surec.stdout.on('data', (d) => { cikti += d })
    surec.stderr.on('data', (d) => { cikti += d })
    surec.on('close', (kod) => coz({ kod, cikti }))
  })
}

const sunucu = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', PORT, '--strictPort'], { stdio: 'ignore' })
let basarisiz = 0
try {
  let hazir = false
  for (let i = 0; i < 30 && !hazir; i++) {
    if (sunucu.exitCode !== null) throw new Error(`Preview açılamadı; ${PORT} portu dolu olabilir.`)
    hazir = await fetch(`http://127.0.0.1:${PORT}/`).then((y) => y.ok, () => false)
    if (!hazir) await new Promise((c) => setTimeout(c, 500))
  }
  if (!hazir) throw new Error('Preview 15 saniyede yanıt vermedi.')

  for (const ad of testler) {
    const basla = Date.now()
    const { kod, cikti } = await calistir(process.execPath, [`tests/${ad}.mjs`])
    const saniye = Math.round((Date.now() - basla) / 1000)
    const satirlar = cikti.trim().split('\n')
    if (kod === 0) {
      console.log(`GEÇTİ  ${ad} (${saniye} sn): ${satirlar.at(-1)}`)
    } else {
      basarisiz++
      console.log(`KALDI  ${ad} (${saniye} sn, çıkış ${kod})\n${satirlar.slice(-15).join('\n')}`)
    }
  }
} finally {
  sunucu.kill()
}
process.exit(basarisiz ? 1 : 0)
