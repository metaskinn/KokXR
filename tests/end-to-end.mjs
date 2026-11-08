// KökXR end-to-end test. First: npm run build && npm run preview -- --port 4173
// Run: npm run test:e2e  (or node tests/end-to-end.mjs <chromium|firefox> <width> <screenshot-folder>)
// On first setup, install browsers with: npx playwright install chromium firefox
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
const control = async (name, fn) => {
  try { const note = await fn(); result.push(['✅', name, note ?? '']) }
  catch (e) { result.push(['❌', name, String(e.message).split('\n')[0].slice(0, 200)]); await p.screenshot({ path: `${out}/error-${browserName}-${width}-${name.replace(/\W+/g, '_')}.png` }).catch(() => {}) }
};
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const condition = (k, m) => { if (!k) throw new Error(m) };
const screen = (name) => p.screenshot({ path: `${out}/${browserName}-${width}-${name}.png` });

await control('1a first Tab skip link', async () => {
  await p.goto(URL); await p.keyboard.press('Tab');
  const t = await p.evaluate(() => document.activeElement?.textContent); condition(t?.includes('Ana içeriğe geç'), `first focus: ${t}`);
});
await control('1b favicon', async () => {
  const r = await p.request.get(`${URL}/favicon.svg`); condition(r.ok(), `favicon ${r.status()}`);
});
// Waits for the element instead of counting right after navigation.
const appears = (locator, timeout = 10000) => locator.first().waitFor({ timeout }).then(() => true, () => false);

await control('artifacts', async () => {
  await p.goto(`${URL}/artifacts`); condition(await appears(p.getByRole('heading', { name: 'Eserler', level: 1 })), 'no heading');
  condition(await p.locator('.artifact-card').count() >= 2, 'cards < 2'); condition(!(await overflow()), 'horizontal overflow'); await screen('main');
});
await control('1d hotspot card visible', async () => {
  await p.goto(`${URL}/artifact/ulu-mosque`);
  await p.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ }).click();
  await p.locator('.info-point').first().click(); await p.waitForTimeout(600);
  const visible = await p.evaluate(() => { const el = [...document.querySelectorAll('h3, .info-card, [id^="point-"]')].find((e) => /Şadırvan|şadırvan/.test(e.textContent) && e.getBoundingClientRect().height > 0); if (!el) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 });
  condition(visible, 'card not in visible area');
});
await control('2 model: open, rotate, zoom, shatter, keyboard', async () => {
  await p.goto(`${URL}/places/ulu-mosque`);
  await p.locator('.model-area canvas').waitFor({ timeout: 30000 });
  await p.waitForFunction(() => !document.querySelector('.model-state'), null, { timeout: 30000 });
  const a = p.locator('.model-area'); await a.scrollIntoViewIfNeeded(); const b = await a.boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.mouse.move(b.x + b.width / 2 + 150, b.y + b.height / 2, { steps: 8 }); await p.mouse.up();
  await p.mouse.wheel(0, -300);
  await p.getByRole('button', { name: 'Parçala' }).click(); await p.waitForTimeout(1500); await screen('model-fragmented');
  await p.getByRole('button', { name: 'Birleştir' }).click();
  await a.focus(); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('+');
  await p.getByRole('button', { name: 'Görünümü sıfırla' }).click();
  condition(await p.getByText('Temsili maket').count(), 'illustrative label missing');
});
await control('6 admin: edit, home page, restore default', async () => {
  await p.goto(`${URL}/admin`);
  await p.getByRole('link', { name: /Düzenle\s*: Bursa Ulu Camii/ }).click();
  await p.locator('#summary').fill('TEST ÖZETİ — yönetim ekranından değiştirildi.');
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(500);
  await p.getByRole('link', { name: 'KökXR ana sayfa' }).click();
  condition(await p.getByText('TEST ÖZETİ').count(), 'change missing on artifacts page');
  await p.goto(`${URL}/admin`);
  await p.getByRole('button', { name: /Varsayılana döndür\s*: Bursa Ulu Camii/ }).click();
  await p.getByRole('link', { name: 'KökXR ana sayfa' }).click();
  condition(!(await p.getByText('TEST ÖZETİ').count()), 'not restored to default');
});
await control('6b admin: add and delete new artifact', async () => {
  await p.goto(`${URL}/admin/new`);
  const areas = { name: 'Deneme Eseri', city: 'Bursa', district: 'Osmangazi', period: 'Deneme', endowment: 'Deneme', summary: 'Deneme özeti', history: 'Deneme tarihçesi' };
  for (const [k, v] of Object.entries(areas)) await p.locator(`#${k}`).fill(v);
  for (let i = 0; i < 3; i++) {
    await p.locator(`#test-${i}-question`).fill(`Soru ${i + 1}?`);
    for (let j = 0; j < 4; j++) await p.locator(`#test-${i}-option-${j}`).fill(`Seçenek ${j + 1}`);
    await p.locator(`#test-${i}-description`).fill('Açıklama');
  }
  condition(await p.locator('#verification option[value="verified"]').evaluate((o) => o.disabled), '"Kaynaklı bilgi" selectable without sources');
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(500);
  condition(await p.locator('#types-error').count(), 'saved without a type');
  await p.locator('#types-hamam').check();
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(700);
  const error = await p.locator('.error-summary').textContent().catch(() => null); condition(!error, `save error: ${error}`);
  // The list is paged; find the new artifact through the search box.
  await p.goto(URL); await p.locator('#artifact-search').fill('Deneme Eseri');
  condition(await appears(p.getByText('Deneme Eseri')), 'new artifact missing on home page');
  await p.goto(`${URL}/artifacts?tur=hamam&q=Deneme`); condition(await appears(p.getByText('Deneme Eseri')), 'new artifact missing under its type filter');
  await p.goto(`${URL}/artifacts?tur=cami&q=Deneme`); await p.waitForTimeout(500); condition(!(await p.locator('.artifact-card', { hasText: 'Deneme Eseri' }).count()), 'new artifact shown under another type');
  await p.getByText('Deneme Eseri').first().click(); condition(await p.getByRole('heading', { name: 'Deneme Eseri' }).count(), 'artifact page did not open');
  await p.goto(`${URL}/admin`); await p.getByRole('button', { name: /Sil\s*: Deneme Eseri/ }).click();
  await p.goto(URL); await p.locator('#artifact-search').fill('Deneme Eseri'); await p.waitForTimeout(700);
  condition(!(await p.getByText('Deneme Eseri').count()), 'not deleted');
});
await control('7b page not found', async () => {
  await p.goto(`${URL}/artifact/none`); condition(await appears(p.getByRole('heading', { name: 'Bu adreste eser yok' })), 'missing-artifact text missing');
  await p.goto(`${URL}/no-such-page`); condition(await appears(p.getByRole('heading', { name: 'Sayfa bulunamadı' })), '404 text missing');
});
await control('7c overflow (all pages)', async () => {
  const overhang = [];
  for (const path of ['/', '/artifact/ulu-mosque', '/artifact/muradiye-complex', '/admin', '/admin/new']) { await p.goto(URL + path); await p.waitForTimeout(400); if (await overflow()) overhang.push(path) }
  condition(!overhang.length, `overflowing: ${overhang}`);
});

console.log(JSON.stringify({ browserName, width, result, appErrors: [...new Set(appErrors)].slice(0, 8), iframeErrorCount: iframeErrors.length, http404: [...new Set(http404)] }, null, 1));
await browser.close();
if (result.some(([state]) => state === '❌')) process.exitCode = 1;
