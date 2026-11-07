// Harita sayfası: Leaflet açılır, rota seçilince sıralı liste görünür. Kullanım: önce npm run build, sonra node scripts/test-tarayici.mjs harita
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const URL_KOK = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch()
const p = await (await tarayici.newContext({ viewport: { width: 360, height: 800 } })).newPage()
const hatalar = []
p.on('pageerror', (e) => hatalar.push(e.message))
try {
  await p.goto(`${URL_KOK}/harita`)
  await p.locator('.leaflet-container').waitFor()
  assert.ok(await p.locator('.leaflet-interactive').count() >= 1, 'şehir işareti yok')
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'yatay taşma')
  await p.getByRole('button', { name: 'Hanlar ve çarşı' }).click()
  const sira = await p.locator('ol.rota-listesi li a').allTextContents()
  assert.deepEqual(sira, ['Koza Han', 'Bursa Ulu Camii'])
  assert.equal(await p.getByRole('button', { name: 'Hanlar ve çarşı' }).getAttribute('aria-pressed'), 'true')
  assert.deepEqual(hatalar, [])
  console.log('Harita: Leaflet açılır, şehir işareti var, rota seçimi sıralı listeyi gösterir, taşma yok.')
} finally {
  await tarayici.close()
}
