// Bir yapının maketini uçtan uca dener: VR sayfası, sahne, Parçala, İçeri gir, duraklar, konsol hataları.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/maket-yapi.mjs <eser-id>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const id = process.argv[2]
if (!id) throw new Error('Eser kimliği gerekli')
const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
mkdirSync('test-results', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const s = await b.newPage({ viewport: { width: 1000, height: 640 } })
s.setDefaultTimeout(240000)
const errors = []
s.on('pageerror', (e) => errors.push(String(e)))
s.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
s.on('response', (r) => { if (/\/gorseller\//.test(r.url()) && r.status() !== 200) errors.push(`görsel yüklenmedi: ${r.url()}`) })
const area = s.locator('.model-area')
const wait = async (n = 5) => { const k = Number(await area.getAttribute('data-frame') ?? 0); await s.waitForFunction(([k, n]) => Number(document.querySelector('.model-area')?.dataset.frame) >= k + n, [k, n]); await s.waitForTimeout(800) }
await s.goto(`${url}/vr/${id}`)
await s.locator('.model-area canvas').waitFor()
await s.locator('.model-box').scrollIntoViewIfNeeded()
// Kare sayacı yalnız içeride işler; dışarıda ilk karelerin çizilmesi beklenir.
await s.waitForTimeout(6000)
await s.locator('.model-box').screenshot({ path: `test-results/${id}-outer.png` })
await s.getByRole('button', { name: /Parçala/ }).click()
await s.waitForTimeout(8000)
await s.locator('.model-box').screenshot({ path: `test-results/${id}-fragmented.png` })
await s.getByRole('button', { name: /Birleştir/ }).click()
await s.getByRole('button', { name: 'İçeri gir' }).click()
await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
const stops = await s.locator('.model-control button').evaluateAll((d) => d.map((x) => x.textContent ?? '').filter((t) => !/Dışarı çık|Tam ekran|VR/.test(t)))
if (!stops.length) throw new Error('İç durak yok')
for (const d of stops) {
  await s.getByRole('button', { name: d, exact: true }).click()
  await wait(6)
  await s.locator('.model-box').screenshot({ path: `test-results/${id}-stop-${d.replace(/\s+/g, '-')}.png` })
}
await s.getByRole('button', { name: /Dışarı çık/ }).click()
await s.goto(`${url}/artifact/${id}`)
await s.getByRole('heading', { name: 'Eseri eline al' }).waitFor()
if (errors.length) throw new Error(errors.join(' | '))
await b.close()
console.log(`${id}: sahne, parçalama, ${stops.length} durak, eser sayfası geçti.`)
