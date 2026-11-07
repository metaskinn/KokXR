// Yönetim: eser ekleme, düzenleme, onay akışı. Kullanım: önce npm run build, sonra node scripts/test-tarayici.mjs yonetim
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const URL_KOK = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch()
const p = await (await tarayici.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
const anaSayfadaVar = async (ad) => { await p.goto(URL_KOK); await p.locator('#eserler').waitFor(); return (await p.locator('.eser-karti', { hasText: ad }).count()) > 0 }
try {
  // Düzenleme: varsayılan eser doğrudan değişir, geri alınabilir.
  await p.goto(`${URL_KOK}/yonetim/eser/ulu-camii`)
  await p.locator('#ozet').fill('Düzenleme testi özeti')
  await p.getByRole('button', { name: 'Kaydet' }).click()
  await p.waitForFunction(() => localStorage.getItem('kokxr-icerik')?.includes('Düzenleme testi özeti'))
  await p.goto(`${URL_KOK}/eser/ulu-camii`)
  await p.getByText('Düzenleme testi özeti').first().waitFor()
  await p.goto(`${URL_KOK}/yonetim`)
  await p.getByRole('button', { name: /Varsayılana döndür\s*: Bursa Ulu Camii/ }).click()
  await p.goto(`${URL_KOK}/eser/ulu-camii`)
  assert.equal(await p.getByText('Düzenleme testi özeti').count(), 0, 'varsayılana dönmedi')

  // Ekleme + onay: onaysız yayında yok, onayla görünür, reddet gizler.
  await p.goto(`${URL_KOK}/yonetim/yeni`)
  const alanlar = { ad: 'Onay Deneme Eseri', sehir: 'Konya', ilce: 'Meram', yapiTuru: 'Han', donem: 'Deneme', vakif: 'Deneme', ozet: 'Deneme özeti', tarihce: 'Deneme tarihçesi' }
  for (const [k, v] of Object.entries(alanlar)) await p.locator(`#${k}`).fill(v)
  for (let i = 0; i < 3; i++) {
    await p.locator(`#test-${i}-soru`).fill(`Soru ${i + 1}?`)
    for (let j = 0; j < 4; j++) await p.locator(`#test-${i}-secenek-${j}`).fill(`Seçenek ${j + 1}`)
    await p.locator(`#test-${i}-aciklama`).fill('Açıklama')
  }
  await p.getByRole('button', { name: 'Kaydet' }).click()
  await p.waitForFunction(() => localStorage.getItem('kokxr-icerik')?.includes('Onay Deneme Eseri'))
  assert.equal(await anaSayfadaVar('Onay Deneme Eseri'), false, 'onaysız eser yayında')

  const karar = async (ad) => { await p.goto(`${URL_KOK}/onay`); await p.getByRole('group', { name: /Onay Deneme Eseri/ }).getByRole('button', { name: ad }).click() }
  await karar('Onayla')
  assert.equal(await anaSayfadaVar('Onay Deneme Eseri'), true, 'onaylanan eser yayında değil')
  // Yeni şehir ve yapı türü kod değişmeden süzgece gelir.
  assert.ok((await p.getByLabel('Şehir').locator('option').allTextContents()).includes('Konya'), 'yeni şehir süzgeçte yok')
  assert.ok((await p.getByLabel('Yapı türü').locator('option').allTextContents()).includes('Han'), 'yeni yapı türü süzgeçte yok')
  await p.getByLabel('Şehir').selectOption('Konya')
  assert.equal(await p.locator('.eser-karti').count(), 1, 'Konya süzgeci yalnız yeni eseri göstermeli')
  await p.getByRole('button', { name: 'Süzgeci temizle' }).click()
  await karar('Reddet')
  assert.equal(await anaSayfadaVar('Onay Deneme Eseri'), false, 'reddedilen eser yayında')

  await p.goto(`${URL_KOK}/yonetim`)
  p.once('dialog', (d) => d.accept())
  await p.getByRole('button', { name: /Sil\s*: Onay Deneme Eseri/ }).click()
  await p.goto(`${URL_KOK}/onay`)
  assert.equal(await p.getByText('Onay Deneme Eseri').count(), 0, 'silinen eser onay listesinde')
  console.log('Yönetim: düzenle, varsayılana dön, ekle, onayla, reddet ve sil geçti.')
} finally {
  await tarayici.close()
}
