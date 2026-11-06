// Bir yapının maketini uçtan uca dener: VR sayfası, sahne, Parçala, İçeri gir, duraklar, konsol hataları.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/maket-yapi.mjs <eser-id>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const id = process.argv[2]
if (!id) throw new Error('Eser kimliği gerekli')
const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
mkdirSync('test-sonuclari', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const s = await b.newPage({ viewport: { width: 1000, height: 640 } })
s.setDefaultTimeout(240000)
const hatalar = []
s.on('pageerror', (e) => hatalar.push(String(e)))
s.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) hatalar.push(m.text()) })
s.on('response', (r) => { if (/\/gorseller\//.test(r.url()) && r.status() !== 200) hatalar.push(`görsel yüklenmedi: ${r.url()}`) })
const alan = s.locator('.maket-alan')
const bekle = async (n = 5) => { const k = Number(await alan.getAttribute('data-kare') ?? 0); await s.waitForFunction(([k, n]) => Number(document.querySelector('.maket-alan')?.dataset.kare) >= k + n, [k, n]); await s.waitForTimeout(800) }
await s.goto(`${url}/vr/${id}`)
await s.locator('.maket-alan canvas').waitFor()
await s.locator('.maket-kutu').scrollIntoViewIfNeeded()
await bekle()
await s.locator('.maket-kutu').screenshot({ path: `test-sonuclari/${id}-dis.png` })
await s.getByRole('button', { name: /Parçala/ }).click()
await bekle(8)
await s.locator('.maket-kutu').screenshot({ path: `test-sonuclari/${id}-parcali.png` })
await s.getByRole('button', { name: /Birleştir/ }).click()
await s.getByRole('button', { name: 'İçeri gir' }).click()
await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
const duraklar = await s.locator('.maket-kontrol button').evaluateAll((d) => d.map((x) => x.textContent ?? '').filter((t) => !/Dışarı çık|Tam ekran|VR/.test(t)))
if (!duraklar.length) throw new Error('İç durak yok')
for (const d of duraklar) {
  await s.getByRole('button', { name: d, exact: true }).click()
  await bekle(6)
  await s.locator('.maket-kutu').screenshot({ path: `test-sonuclari/${id}-durak-${d.replace(/\s+/g, '-')}.png` })
}
await s.getByRole('button', { name: /Dışarı çık/ }).click()
await s.goto(`${url}/eser/${id}`)
await s.getByRole('heading', { name: 'Eseri eline al' }).waitFor()
if (hatalar.length) throw new Error(hatalar.join(' | '))
await b.close()
console.log(`${id}: sahne, parçalama, ${duraklar.length} durak, eser sayfası geçti.`)
