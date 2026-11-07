// KökXR uçtan uca test. Önce: npm run build && npm run preview -- --port 4173
// Çalıştır: npm run test:e2e  (veya node tests/uctan-uca.mjs <chromium|firefox> <genislik> <ekran-klasoru>)
// İlk kurulumda tarayıcılar için: npx playwright install chromium firefox
import { chromium, firefox } from 'playwright';
const [, , tarayiciAdi = 'chromium', genislikStr = '1280', out = 'test-sonuclari'] = process.argv;
import { mkdirSync } from 'node:fs';
mkdirSync(out, { recursive: true });
const genislik = Number(genislikStr);
const URL = process.env.TEST_URL ?? 'http://localhost:4173';
const tarayici = tarayiciAdi === 'firefox'
  ? await firefox.launch()
  : await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await tarayici.newPage({ viewport: { width: genislik, height: 900 } });
const uygulamaHatalari = [], iframeHatalari = [], http404 = [];
p.on('pageerror', (e) => uygulamaHatalari.push(e.message));
p.on('console', (m) => { if (m.type() !== 'error') return; (m.location().url.includes('360tr') ? iframeHatalari : uygulamaHatalari).push(m.text().slice(0, 160)) });
p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(URL)) http404.push(`${r.status()} ${r.url()}`) });
p.on('dialog', (d) => d.accept());
const sonuc = [];
const kontrol = async (ad, fn) => {
  try { const not = await fn(); sonuc.push(['✅', ad, not ?? '']) }
  catch (e) { sonuc.push(['❌', ad, String(e.message).split('\n')[0].slice(0, 200)]); await p.screenshot({ path: `${out}/HATA-${tarayiciAdi}-${genislik}-${ad.replace(/\W+/g, '_')}.png` }).catch(() => {}) }
};
const tasma = () => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const sart = (k, m) => { if (!k) throw new Error(m) };
const ekran = (ad) => p.screenshot({ path: `${out}/${tarayiciAdi}-${genislik}-${ad}.png` });

await kontrol('1a ilk Tab atlama bağlantısı', async () => {
  await p.goto(URL); await p.keyboard.press('Tab');
  const t = await p.evaluate(() => document.activeElement?.textContent); sart(t?.includes('Ana içeriğe geç'), `ilk odak: ${t}`);
});
await kontrol('1b favicon', async () => {
  const r = await p.request.get(`${URL}/favicon.svg`); sart(r.ok(), `favicon ${r.status()}`);
});
await kontrol('ana sayfa', async () => {
  await p.goto(URL); sart(await p.getByRole('heading', { name: 'KökXR' }).count(), 'başlık yok');
  sart(await p.locator('.eser-karti').count() >= 2, 'kart < 2'); sart(!(await tasma()), 'yatay taşma'); await ekran('ana');
});
await kontrol('1c test klavyeyle 3/3 + rozet', async () => {
  await p.goto(`${URL}/eser/ulu-camii`);
  for (const dogru of ['20', 'Kündekâri', "Bursa'nın Ayasofyası"]) {
    const sec = p.getByRole('radio', { name: dogru, exact: true });
    await p.getByRole('radio').first().focus();
    for (let i = 0; i < 4 && !(await sec.isChecked()); i++) await p.keyboard.press('ArrowDown');
    sart(await sec.isChecked(), `klavyeyle seçilemedi: ${dogru}`);
    await p.getByRole('button', { name: 'Cevabı kontrol et' }).press('Enter');
    await p.getByRole('button', { name: /Sonraki soru|Sonucu gör/ }).press('Enter');
  }
  sart(await p.getByText('3 sorudan 3 doğru').count(), 'sonuç 3/3 değil');
});
await kontrol('1d keşif kartı görünür', async () => {
  await p.goto(`${URL}/eser/ulu-camii`);
  await p.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ }).click();
  await p.locator('.bilgi-noktasi').first().click(); await p.waitForTimeout(600);
  const gorunur = await p.evaluate(() => { const el = [...document.querySelectorAll('h3, .bilgi-karti, [id^="nokta-"]')].find((e) => /Şadırvan|şadırvan/.test(e.textContent) && e.getBoundingClientRect().height > 0); if (!el) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 });
  sart(gorunur, 'kart görünür alanda değil');
});
await kontrol('2 maket: aç, çevir, yakınlaştır, parçala, klavye', async () => {
  await p.goto(`${URL}/eser/ulu-camii`);
  await p.getByRole('button', { name: /maketini eline al/ }).click();
  await p.locator('.maket-alan canvas').waitFor({ timeout: 30000 });
  await p.waitForFunction(() => !document.querySelector('.maket-durum'), null, { timeout: 30000 });
  const a = p.locator('.maket-alan'); await a.scrollIntoViewIfNeeded(); const b = await a.boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.mouse.move(b.x + b.width / 2 + 150, b.y + b.height / 2, { steps: 8 }); await p.mouse.up();
  await p.mouse.wheel(0, -300);
  await p.getByRole('button', { name: '⤒ Parçala' }).click(); await p.waitForTimeout(1500); await ekran('maket-parcali');
  await p.getByRole('button', { name: '⤓ Birleştir' }).click();
  await a.focus(); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('+');
  await p.getByRole('button', { name: 'Görünümü sıfırla' }).click();
  sart(await p.getByText('Temsili maket').count(), 'temsili etiketi yok');
});
await kontrol('3 360° tur', async () => {
  await p.goto(`${URL}/eser/ulu-camii`);
  await p.getByRole('button', { name: '360° turu başlat' }).click();
  await p.waitForTimeout(8000);
  const f = p.frames().find((fr) => fr.url().includes('360tr.com/embed'));
  sart(f, 'iframe yüklenmedi'); const c = await f.locator('canvas').count(); sart(c > 0, 'oynatıcı canvas yok');
  sart(await p.getByRole('link', { name: /yeni sekmede aç/ }).count(), 'yedek bağlantı yok');
  await p.locator('.tur360-cerceve').screenshot({ path: `${out}/${tarayiciAdi}-${genislik}-360.png` });
  return `${c} canvas`;
});
for (const eser of ['ulu-camii', 'muradiye-kulliyesi']) await kontrol(`4 gezinti ${eser}`, async () => {
  await p.goto(`${URL}/eser/${eser}`);
  await p.getByRole('button', { name: /Gezintiye başla/ }).click();
  const grup = p.getByRole('group', { name: 'Bağlı duraklara git' });
  const basliklar = [];
  for (let i = 0; i < 4; i++) {
    await grup.getByRole('button').first().waitFor({ timeout: 20000 });
    await grup.getByRole('button').first().click(); await p.waitForTimeout(1200);
    basliklar.push(await p.locator('.gezinti-durak-basligi').first().textContent().catch(() => '?'));
  }
  sart(await p.getByText('360° çekim veya 3B tarama değildir').count(), 'dürüstlük etiketi yok');
  if (eser === 'muradiye-kulliyesi') await ekran('gezinti');
  return basliklar.join(' → ');
});
await kontrol('5 restorasyon: klavye + tamamlama', async () => {
  await p.goto(`${URL}/eser/muradiye-kulliyesi`);
  await p.getByRole('button', { name: 'Panoyu parçala ve onar' }).click();
  const sec = p.locator('.restorasyon');
  const parca = (id) => sec.getByRole('button', { name: new RegExp(`^Parça ${id},`) });
  await parca(1).focus(); await p.keyboard.press('Enter');
  for (let k = 0; k < 4 && !(await parca(1).getAttribute('aria-label')).includes(', düz,'); k++) await p.keyboard.press('r');
  await sec.getByRole('button', { name: 'Boş yuva 1', exact: true }).focus(); await p.keyboard.press('Enter');
  sart((await parca(1).getAttribute('aria-label')).includes('1. yuvada'), 'klavyeyle yerleşmedi');
  for (let id = 2; id <= 8; id++) {
    await parca(id).click();
    for (let k = 0; k < 4 && !(await parca(id).getAttribute('aria-label')).includes(', düz,'); k++) await sec.getByRole('button', { name: '⟳ Döndür' }).click();
    await sec.getByRole('button', { name: `Boş yuva ${id}`, exact: true }).click();
  }
  sart(await sec.getByText('Pano onarıldı!').count(), 'tamamlanmadı'); await ekran('restorasyon');
});
await kontrol('6 yönetim: düzenle, ana sayfa, varsayılana döndür', async () => {
  await p.goto(URL); await p.getByRole('link', { name: 'Yönetim', exact: true }).click();
  await p.getByRole('link', { name: /Düzenle\s*: Bursa Ulu Camii/ }).click();
  await p.locator('#ozet').fill('TEST ÖZETİ — yönetim ekranından değiştirildi.');
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(500);
  await p.getByRole('link', { name: 'KökXR ana sayfa' }).click();
  sart(await p.getByText('TEST ÖZETİ').count(), 'değişiklik ana sayfada yok');
  await p.getByRole('link', { name: 'Yönetim', exact: true }).click();
  await p.getByRole('button', { name: /Varsayılana döndür\s*: Bursa Ulu Camii/ }).click();
  await p.getByRole('link', { name: 'KökXR ana sayfa' }).click();
  sart(!(await p.getByText('TEST ÖZETİ').count()), 'varsayılana dönmedi');
});
await kontrol('6b yönetim: yeni eser ekle ve sil', async () => {
  await p.goto(`${URL}/yonetim/yeni`);
  const alanlar = { ad: 'Deneme Eseri', sehir: 'Bursa', ilce: 'Osmangazi', donem: 'Deneme', vakif: 'Deneme', ozet: 'Deneme özeti', tarihce: 'Deneme tarihçesi' };
  for (const [k, v] of Object.entries(alanlar)) await p.locator(`#${k}`).fill(v);
  for (let i = 0; i < 3; i++) {
    await p.locator(`#test-${i}-soru`).fill(`Soru ${i + 1}?`);
    for (let j = 0; j < 4; j++) await p.locator(`#test-${i}-secenek-${j}`).fill(`Seçenek ${j + 1}`);
    await p.locator(`#test-${i}-aciklama`).fill('Açıklama');
  }
  sart(await p.locator('#dogrulama option[value="dogrulanmis"]').evaluate((o) => o.disabled), 'kaynaksız Kaynaklı bilgi seçilebiliyor');
  await p.getByRole('button', { name: 'Kaydet' }).click(); await p.waitForTimeout(700);
  const hata = await p.locator('.hata-ozeti').textContent().catch(() => null); sart(!hata, `kayıt hatası: ${hata}`);
  await p.goto(URL); await p.waitForTimeout(300); sart(!(await p.getByText('Deneme Eseri').count()), 'onaysız eser yayında');
  await p.goto(`${URL}/onay`); await p.getByRole('group', { name: /Deneme Eseri/ }).getByRole('button', { name: 'Onayla' }).click();
  await p.goto(URL); sart(await p.getByText('Deneme Eseri').count(), 'onaylanan eser ana sayfada yok');
  await p.getByText('Deneme Eseri').first().click(); sart(await p.getByRole('heading', { name: 'Deneme Eseri' }).count(), 'eser sayfası açılmadı');
  await p.goto(`${URL}/yonetim`); await p.getByRole('button', { name: /Sil\s*: Deneme Eseri/ }).click();
  await p.goto(URL); sart(!(await p.getByText('Deneme Eseri').count()), 'silinmedi');
});
await kontrol('7 rozetler ana sayfada', async () => {
  await p.goto(URL); const r = await p.evaluate(() => localStorage.getItem('kokxr-rozetler'));
  sart(await p.getByText('Rozet kazanıldı').count(), 'test rozeti kartta yok'); return r;
});
await kontrol('7b bulunamayan sayfa', async () => {
  await p.goto(`${URL}/eser/yok`); sart(await p.getByText('Sayfa bulunamadı').count(), '404 metni yok');
});
await kontrol('7c taşma (tüm sayfalar)', async () => {
  const tasan = [];
  for (const yol of ['/', '/eser/ulu-camii', '/eser/muradiye-kulliyesi', '/yonetim', '/yonetim/yeni']) { await p.goto(URL + yol); await p.waitForTimeout(400); if (await tasma()) tasan.push(yol) }
  sart(!tasan.length, `taşan: ${tasan}`);
});

console.log(JSON.stringify({ tarayiciAdi, genislik, sonuc, uygulamaHatalari: [...new Set(uygulamaHatalari)].slice(0, 8), iframeHataSayisi: iframeHatalari.length, http404: [...new Set(http404)] }, null, 1));
await tarayici.close();
if (sonuc.some(([durum]) => durum === '❌')) process.exitCode = 1;
