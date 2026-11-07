// Runs the browser tests with one command: starts preview, runs the tests in order, prints a short summary, stops the server.
// Usage: TEST_PORT=4178 node scripts/test-browser.mjs [test name ...]   e.g. model-xr-button   (run npm run build first)
import { spawn } from 'node:child_process'

const PORT = process.env.TEST_PORT ?? '4173'
const tests = process.argv.slice(2).length ? process.argv.slice(2) : ['model-xr-button', 'vase-xr-button', 'inventory-list', 'model-interior']

function run(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TEST_URL: `http://127.0.0.1:${PORT}` } })
    let output = ''
    proc.stdout.on('data', (d) => { output += d })
    proc.stderr.on('data', (d) => { output += d })
    proc.on('close', (code) => resolve({ code, output }))
  })
}

// If the port is taken, the tests would run against another build on that server and give misleading results.
if (await fetch(`http://127.0.0.1:${PORT}/`).then(() => true, () => false)) {
  console.error(`Port ${PORT} is in use; another server is running. Pass a free port with TEST_PORT.`)
  process.exit(2)
}
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', PORT, '--strictPort'], { stdio: 'ignore' })
let failed = 0
try {
  let ready = false
  for (let i = 0; i < 30 && !ready; i++) {
    if (server.exitCode !== null) throw new Error(`Preview failed to start; port ${PORT} may be in use.`)
    ready = await fetch(`http://127.0.0.1:${PORT}/`).then((y) => y.ok, () => false)
    if (!ready) await new Promise((c) => setTimeout(c, 500))
  }
  if (!ready) throw new Error('Preview did not respond within 15 seconds.')

  for (const name of tests) {
    const begin = Date.now()
    const { code, output } = await run(process.execPath, [`tests/${name}.mjs`])
    const seconds = Math.round((Date.now() - begin) / 1000)
    const lines = output.trim().split('\n')
    if (code === 0) {
      console.log(`PASS  ${name} (${seconds} s): ${lines.at(-1)}`)
    } else {
      failed++
      console.log(`FAIL  ${name} (${seconds} s, exit ${code})\n${lines.slice(-15).join('\n')}`)
    }
  }
} finally {
  server.kill()
}
process.exit(failed ? 1 : 0)
