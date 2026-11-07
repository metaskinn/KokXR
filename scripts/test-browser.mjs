// Tarayıcı testlerini tek komutla çalıştırır: preview'i açar, testleri sırayla koşar, kısa özet yazar, sunucuyu kapatır.
// Kullanım: TEST_PORT=4178 node scripts/test-tarayici.mjs [test adı ...]   örn. maket-xr-dugme   (önce npm run build)
import { spawn } from 'node:child_process'

const PORT = process.env.TEST_PORT ?? '4173'
const tests = process.argv.slice(2).length ? process.argv.slice(2) : ['model-xr-button', 'vase-xr-button', 'model-interior']

function run(command, args) {
  return new Promise((solve) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TEST_URL: `http://127.0.0.1:${PORT}` } })
    let output = ''
    proc.stdout.on('data', (d) => { output += d })
    proc.stderr.on('data', (d) => { output += d })
    proc.on('close', (code) => solve({ code, output }))
  })
}

// Port doluysa testler o sunucudaki başka bir derlemeye karşı koşup yanıltıcı sonuç verir.
if (await fetch(`http://127.0.0.1:${PORT}/`).then(() => true, () => false)) {
  console.error(`${PORT} portu dolu; başka bir sunucu çalışıyor. TEST_PORT ile boş bir port ver.`)
  process.exit(2)
}
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', PORT, '--strictPort'], { stdio: 'ignore' })
let failed = 0
try {
  let ready = false
  for (let i = 0; i < 30 && !ready; i++) {
    if (server.exitCode !== null) throw new Error(`Preview açılamadı; ${PORT} portu dolu olabilir.`)
    ready = await fetch(`http://127.0.0.1:${PORT}/`).then((y) => y.ok, () => false)
    if (!ready) await new Promise((c) => setTimeout(c, 500))
  }
  if (!ready) throw new Error('Preview 15 saniyede yanıt vermedi.')

  for (const ad of tests) {
    const begin = Date.now()
    const { code, output } = await run(process.execPath, [`tests/${ad}.mjs`])
    const seconds = Math.round((Date.now() - begin) / 1000)
    const lines = output.trim().split('\n')
    if (code === 0) {
      console.log(`GEÇTİ  ${ad} (${seconds} sn): ${lines.at(-1)}`)
    } else {
      failed++
      console.log(`KALDI  ${ad} (${seconds} sn, çıkış ${code})\n${lines.slice(-15).join('\n')}`)
    }
  }
} finally {
  server.kill()
}
process.exit(failed ? 1 : 0)
