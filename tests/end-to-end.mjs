// KökXR uçtan uca test. Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: npm run test:e2e  (veya node tests/uctan-uca.mjs <chromium|firefox> <genislik> <ekran-klasoru>)
// İlk kurulumda tarayıcılar için: npx playwright install chromium firefox
import { chromium, firefox } from 'playwright';
const [, , browserName = 'chromium', widthStr = '1280', out = 'test-results'] = process.argv;
import { mkdirSync } from 'node:fs';
mkdirSync(out, { recursive: true });
const width = Number(widthStr);
const URL = process.env.TEST_URL ?? 'http://localhost:4173';
const browser = browserName === 'firefox'
  ? await firefox.launch()
  : await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await browser.newPage({ viewport: { width: width, height: 900 } });
const appErrors = [], iframeErrors = [], http404 = [];
p.on('pageerror', (e) => appErrors.push(e.message));
p.on('console', (m) => { if (m.type() !== 'error') return; (m.location().url.includes('360tr') ? iframeErrors : appErrors).push(m.text().slice(0, 160)) });
p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(URL)) http404.push(`${r.status()} ${r.url()}`) });
p.on('dialog', (d) => d.accept());
const result = [];
const control = async (ad, fn) => {
  try { const not = await fn(); result.push(['✅', ad, not ?? '']) }
  catch (e) { result.push(['❌', ad, String(e.message).split('\n')[0].slice(0, 200)]); await p.screenshot({ path: `${out}/error-${browserName}-${width}-${ad.replace(/\W+/g, '_')}.png` }).catch(() => {}) }
};
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const condition = (k, m) => { if (!k) throw new Error(m) };
const screen = (ad) => p.screenshot({ path: `${out}/${browserName}-${width}-${ad}.png` });

await control('1a ilk Tab atlama bağlantısı', async () => {
  await p.goto(URL); await p.keyboard.press('Tab');
  const t = await p.evaluate(() => document.activeElement?.textContent); condition(t?.includes('Ana içeriğe geç'), `ilk odak: ${t}`);
});
await control('1b favicon', async () => {
  const r = await p.request.get(`${URL}/favicon.svg`); condition(r.ok(), `favicon ${r.status()}`);
});
await control('artifacts', async () => {
  await p.goto(URL); condition(await p.getByRole('heading', { name: 'Eserler', level: 1 }).count(), 'başlık yok');
  condition(await p.locator('.artifact-card').count() >= 2, 'kart < 2'); condition(!(await overflow()), 'yatay taşma'); await screen('main');
});
await control('1d keşif kartı görünür', async () => {
  await p.goto(`${URL}/artifact/ulu-mosque`);
  await p.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ }).click();
  await p.locator('.info-point').first().click(); await p.waitForTimeout(600);
  const visible = await p.evaluate(() => { const el = [...document.querySelectorAll('h3, .info-card, [id^="nokta-"]')].find((e) => /Şadırvan|şadırvan/.test(e.textContent) && e.getBoundingClientRect().height > 0); if (!el) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 });
  condition(visible, 'kart görünür alanda değil');
});
await control('2 maket: aç, çevir, yakınlaştır, parçala, klavye', async () => {
  await p.goto(`${URL}/artifact/ulu-mosque`);
  await p.getByRole('button', { name: /maketini eline al/ }).click();
  await p.locator('.model-area canvas').waitFor({ timeout: 30000 });
  await p.waitForFunction(() => !document.querySelector('.model-state'), null, { timeout: 30000 });
  const a = p.locator('.model-area'); await a.scrollIntoViewIfNeeded(); const b = await a.boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.mouse.move(b.x + b.width / 2 + 150, b.y + b.height / 2, { steps: 8 }); await p.mouse.up();
  await p.mouse.wheel(0, -300);
  await p.getByRole('button', { name: '⤒ Parçala' }).click(); await p.waitForTimeout(1500); await screen('model-fragmented');
  await p.getByRole('button', { name: '⤓ Birleştir' }).click();
  await a.focus(); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('+');
  await p.getByRole('button', { name: 'Görünümü sıfırla' }).click();
  condition(await p.getByText('Temsili maket').count(), 'temsili etiketi yok');
});
await control('6 yönetim: düzenle, ana sayfa, varsayılana döndür', async () => {
  await p.goto(URL); await p.getByRole('link', { name: 'Yönetim', exact: true }).click();
  await p.getByRole('link', { name: /Düzenle\s*: Bursa Ulu Camii/ }).click();
  await p.locator('#summary').fill('TEST ÖZETİ — yönetim ekranından değiştirildi.');
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(500);
  await p.getByRole('link', { name: 'KökXR ana sayfa' }).click();
  condition(await p.getByText('TEST ÖZETİ').count(), 'değişiklik eserler sayfasında yok');
  await p.getByRole('link', { name: 'Yönetim', exact: true }).click();
  await p.getByRole('button', { name: /Varsayılana döndür\s*: Bursa Ulu Camii/ }).click();
  await p.getByRole('link', { name: 'KökXR ana sayfa' }).click();
  condition(!(await p.getByText('TEST ÖZETİ').count()), 'varsayılana dönmedi');
});
await control('6b yönetim: yeni eser ekle ve sil', async () => {
  await p.goto(`${URL}/admin/fresh`);
  const areas = { ad: 'Deneme Eseri', city: 'Bursa', district: 'Osmangazi', period: 'Deneme', endowment: 'Deneme', summary: 'Deneme özeti', history: 'Deneme tarihçesi' };
  for (const [k, v] of Object.entries(areas)) await p.locator(`#${k}`).fill(v);
  for (let i = 0; i < 3; i++) {
    await p.locator(`#test-${i}-question`).fill(`Soru ${i + 1}?`);
    for (let j = 0; j < 4; j++) await p.locator(`#test-${i}-option-${j}`).fill(`Seçenek ${j + 1}`);
    await p.locator(`#test-${i}-description`).fill('Açıklama');
  }
  condition(await p.locator('#verification option[value="verified"]').evaluate((o) => o.disabled), 'kaynaksız Kaynaklı bilgi seçilebiliyor');
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(700);
  const error = await p.locator('.error-summary').textContent().catch(() => null); condition(!error, `kayıt hatası: ${error}`);
  await p.goto(URL); condition(await p.getByText('Deneme Eseri').count(), 'yeni eser ana sayfada yok');
  await p.getByText('Deneme Eseri').first().click(); condition(await p.getByRole('heading', { name: 'Deneme Eseri' }).count(), 'eser sayfası açılmadı');
  await p.goto(`${URL}/admin`); await p.getByRole('button', { name: /Sil\s*: Deneme Eseri/ }).click();
  await p.goto(URL); condition(!(await p.getByText('Deneme Eseri').count()), 'notDeleted');
});
await control('7b bulunamayan sayfa', async () => {
  await p.goto(`${URL}/artifact/none`); condition(await p.getByText('Sayfa bulunamadı').count(), '404 metni yok');
});
await control('7c taşma (tüm sayfalar)', async () => {
  const overhang = [];
  for (const path of ['/', '/artifact/ulu-mosque', '/artifact/muradiye-complex', '/admin', '/admin/fresh']) { await p.goto(URL + path); await p.waitForTimeout(400); if (await overflow()) overhang.push(path) }
  condition(!overhang.length, `taşan: ${overhang}`);
});

console.log(JSON.stringify({ browserName, width, result, appErrors: [...new Set(appErrors)].slice(0, 8), iframeErrorCount: iframeErrors.length, http404: [...new Set(http404)] }, null, 1));
await browser.close();
if (result.some(([state]) => state === '❌')) process.exitCode = 1;
