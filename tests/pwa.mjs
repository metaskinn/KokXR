// Kurulabilirlik ve çevrimdışı açılış. Kullanım: önce npm run build, sonra node scripts/test-tarayici.mjs pwa
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const URL_KOK = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch()
const baglam = await tarayici.newContext()
const p = await baglam.newPage()
try {
  await p.goto(URL_KOK)
  const manifestYolu = await p.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await baglam.request.get(URL_KOK + manifestYolu)).json()
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.start_url, '/')
  for (const boy of ['192x192', '512x512']) assert.ok(manifest.icons.some((i) => i.sizes === boy && i.type === 'image/png'), `${boy} ikon yok`)
  for (const ikon of manifest.icons) assert.ok((await baglam.request.get(URL_KOK + ikon.src)).ok(), `${ikon.src} açılmadı`)

  await p.evaluate(() => navigator.serviceWorker.ready)
  await p.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await p.goto(`${URL_KOK}/eser/ulu-camii`)
  await p.getByRole('heading', { level: 1, name: 'Bursa Ulu Camii' }).waitFor()
  const kapak = await p.locator('img').first().getAttribute('src')
  await p.waitForFunction((a) => caches.match(a).then(Boolean), kapak)

  await baglam.setOffline(true)
  await p.goto(URL_KOK)
  await p.getByRole('link', { name: 'Yönetim', exact: true }).waitFor()
  await p.goto(`${URL_KOK}/eser/ulu-camii`)
  await p.getByRole('heading', { level: 1, name: 'Bursa Ulu Camii' }).waitFor()
  await p.waitForFunction((a) => [...document.images].some((i) => i.getAttribute('src') === a && i.complete && i.naturalWidth > 0), kapak)
  await p.goto(`${URL_KOK}/atolye/vazo`)
  await p.getByRole('heading', { level: 1 }).waitFor()
  console.log('PWA: manifest, ikonlar, service worker ve çevrimdışı açılış geçti.')
} finally {
  await tarayici.close()
}
