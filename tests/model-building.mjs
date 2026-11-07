// End-to-end test of a building's scale model: VR page, scene, "Parçala", "İçeri gir", stops, console errors.
// Run: with the dev server up, TEST_URL=http://127.0.0.1:5173 node tests/model-building.mjs <artifact-id>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const id = process.argv[2]
if (!id) throw new Error('Artifact id required')
const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
mkdirSync('test-results', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const s = await b.newPage({ viewport: { width: 1000, height: 640 } })
s.setDefaultTimeout(240000)
const errors = []
s.on('pageerror', (e) => errors.push(String(e)))
s.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
s.on('response', (r) => { if (/\/gorseller\//.test(r.url()) && r.status() !== 200) errors.push(`image failed to load: ${r.url()}`) })
const area = s.locator('.model-area')
const wait = async (n = 5) => { const k = Number(await area.getAttribute('data-frame') ?? 0); await s.waitForFunction(([k, n]) => Number(document.querySelector('.model-area')?.dataset.frame) >= k + n, [k, n]); await s.waitForTimeout(800) }
await s.goto(`${url}/places/${id}`)
await s.locator('.model-area canvas').waitFor()
await s.locator('.model-box').scrollIntoViewIfNeeded()
// The frame counter only runs inside; outside we wait for the first frames to be drawn.
await s.waitForTimeout(6000)
await s.locator('.model-box').screenshot({ path: `test-results/${id}-outer.png` })
await s.getByRole('button', { name: /Parçala/ }).click()
await s.waitForTimeout(8000)
await s.locator('.model-box').screenshot({ path: `test-results/${id}-fragmented.png` })
await s.getByRole('button', { name: /Birleştir/ }).click()
await s.getByRole('button', { name: 'İçeri gir' }).click()
await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
const stops = await s.locator('.model-control button').evaluateAll((d) => d.map((x) => x.textContent ?? '').filter((t) => !/Dışarı çık|Tam ekran|VR/.test(t)))
if (!stops.length) throw new Error('No interior stops')
for (const d of stops) {
  await s.getByRole('button', { name: d, exact: true }).click()
  await wait(6)
  await s.locator('.model-box').screenshot({ path: `test-results/${id}-stop-${d.replace(/\s+/g, '-')}.png` })
}
await s.getByRole('button', { name: /Dışarı çık/ }).click()
await s.goto(`${url}/artifact/${id}`)
await s.getByRole('link', { name: '3B maketi incele' }).waitFor()
if (errors.length) throw new Error(errors.join(' | '))
await b.close()
console.log(`${id}: scene, shatter, ${stops.length} stops, artifact page passed.`)
