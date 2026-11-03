import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const gpu = process.env.TEST_GPU === '1'
const browser = await chromium.launch({ args: gpu ? ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
mkdirSync('test-sonuclari', { recursive: true })
const errors = [], report = []
try {
  for (const width of [1280, 360]) {
    const p = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width === 360 })
    p.setDefaultTimeout(60000)
    p.on('pageerror', e => errors.push(e.message))
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    const stage = p.locator('.kilic-sahne')
    const waitStage = n => p.waitForFunction(n => document.querySelector('.kilic-sahne')?.dataset.asama === String(n), n, { timeout: 90000 })
    const snap = async name => { await stage.scrollIntoViewIfNeeded(); await p.waitForTimeout(1400); await p.screenshot({ path: `test-sonuclari/kilic-${width}-${name}.png`, fullPage: true }) }
    const click = name => p.getByRole('button', { name }).click()
    const hold = async (name, until) => {
      const button = p.getByRole('button', { name, exact: true }); await button.scrollIntoViewIfNeeded(); const r = await button.boundingBox()
      await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down()
      try { await until() } finally { await p.mouse.up() }
    }
    await p.goto(url)
    // A home visit must not load Three.js or the workshop renderer.
    const imports = await p.evaluate(() => performance.getEntriesByType('resource').map(r => r.name))
    assert(!imports.some(s => /three\.js|three\.module|components\/kilic\/sahne/.test(s)), 'Three.js ana sayfada yüklendi')
    await p.getByRole('link', { name: /Kılıç atölyesine gir/ }).click()
    await p.locator('.kilic-sahne canvas').waitFor(); await p.waitForFunction(() => document.querySelector('.kilic-sahne')?.dataset.uzunluk)
    const initial = Number(await stage.getAttribute('data-uzunluk')); assert(initial < .25)
    await snap('01-kulce')
    for (let n = 0; n < 7; n++) {
      console.log(width, 'usta aşama', n)
      await click(/^Ustaya bırak/); await waitStage(n + 1)
      if (n === 1) assert(Number(await stage.getAttribute('data-uzunluk')) < .3)
      if (n === 2) assert(Number(await stage.getAttribute('data-uzunluk')) > initial * 4, 'Namlu uzamadı')
      if (n === 5) assert(Number(await stage.getAttribute('data-takilan')) >= 9)
      await snap(`usta-0${n + 2}`)
    }
    await p.getByRole('button', { name: 'Hasır rulo', exact: true }).click()
    await click(/^Ustaya bırak/); await p.waitForFunction(() => +document.querySelector('.kilic-sahne').dataset.ayrilan > 0)
    await snap('usta-kesim')
    await click('Hedefleri yenile'); await p.waitForFunction(() => document.querySelector('.kilic-sahne')?.dataset.ayrilan === '0')
    await click('Baştan başla'); await waitStage(0)
    // Entire manual route: real pointer presses and drags, with no direct state mutation.
    await click(/01 · Külçeyi al/); await waitStage(1)
    const heat = target => p.waitForFunction(t => +document.querySelector('#kilic-sicaklik')?.value >= t, target, { timeout: 90000 })
    await hold('Körüğü basılı tut', () => heat(980)); await snap('02-kizgin-kulce')
    await click('Örse geç →'); await waitStage(2)
    async function strike() {
      await stage.scrollIntoViewIfNeeded(); await p.waitForTimeout(210)
      const box = await stage.boundingBox(), coords = await stage.evaluate(e => [Number(e.dataset.vurusX), Number(e.dataset.vurusY)])
      await p.mouse.click(box.x + coords[0], box.y + coords[1])
    }
    for (let i = 0; i < 12; i++) {
      if (await stage.getAttribute('data-asama') !== '2') break
      if (Number(await p.locator('#kilic-sicaklik').getAttribute('value')) < 800) {
        await click('Yeniden ısıt'); await hold('Körüğü basılı tut', () => heat(1050)); await click('Örse geç →'); await p.waitForTimeout(1500)
      }
      await click(new RegExp(`^Bölge ${i + 1}$`)); await p.waitForTimeout(450)
      for (let k = 0; k < 3; k++) await strike()
      if (i === 5) { await snap('03-dovme-ortasi'); assert(Number(await stage.getAttribute('data-uzunluk')) > initial * 1.5) }
    }
    await waitStage(3); await snap('04-su-oncesi')
    // Water cools the steel during the actual press.
    await p.waitForFunction(() => { const t = +document.querySelector('#kilic-sicaklik')?.value; return t >= 780 && t <= 880 }, null, { timeout: 90000 })
    await hold('Suya daldır · basılı tut', () => waitStage(4)); await snap('05-bileme')
    for (let i = 0; i < 12; i++) {
      await click(new RegExp(`^Bölge ${i + 1}$`))
      // A pointer stroke selects the region under the blade and polishes while held.
      await stage.scrollIntoViewIfNeeded(); await p.waitForTimeout(450)
      const r = await stage.boundingBox(), a = await stage.evaluate(e => [Number(e.dataset.vurusX), Number(e.dataset.vurusY)])
      await p.mouse.move(r.x + a[0], r.y + a[1]); await p.mouse.down()
      await p.waitForFunction(i => { const b = document.querySelector(`[aria-label="Bölge ${i + 1}"]`); return !b || parseFloat(b.style.getPropertyValue('--ilerleme')) >= 98 }, i, { timeout: 30000 })
      await p.mouse.up()
    }
    await waitStage(5); await snap('06-kusanma')
    for (let i = 0; i < 7; i++) { await click(/· Parçayı yerleştir/); await p.waitForTimeout(250) }
    await waitStage(6); await snap('07-bitmis-kilic')
    assert(Number(await stage.getAttribute('data-takilan')) >= 9)
    await click('1. Ölçüler'); assert(await p.getByRole('dialog', { name: 'Ölçüler', exact: true }).isVisible()); await click('Parça notunu kapat')
    await stage.focus(); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('+')
    await click('Test alanına geç →'); await waitStage(7); await snap('08-test')
    for (const [i, name] of ['Hasır rulo', 'Kütük', 'Asılı kumaş'].entries()) {
      await click(name); await stage.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500)
      const b = await stage.boundingBox(), x = b.x + (width > 700 ? (b.width - 340) / 2 : b.width / 2), y = b.y + b.height * .52
      await p.mouse.move(x - 90, y); await p.mouse.down(); await p.mouse.move(x + 90, y, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(800)
      if (i === 0) assert(Number(await stage.getAttribute('data-ayrilan')) > 0)
      if (i === 1) assert.match(await p.locator('.kilic-mesaj').textContent(), /Kütük tek parça kaldı/)
      await snap(`kesim-${i}`)
    }
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px taşma`)
    assert(await p.getByText('Temsilî model ve kurgusal oyun.', { exact: false }).isVisible())
    // Page is keyboard operable, sound toggle works, reset does not persist session.
    await click('♪ Ses açık'); assert(await p.getByRole('button', { name: '♪ Ses kapalı', exact: true }).isVisible())
    await click('Baştan başla'); await waitStage(0)
    await p.reload(); await waitStage(0)
    await p.getByRole('link', { name: 'Keşfe dön' }).click(); assert.equal(await p.locator('.kilic-sahne canvas').count(), 0)
    report.push({ width, master: '8/8', manual: '8/8', initial, deformation: 'uzama doğrulandı', targets: '3/3', dispose: 'canvas temizlendi' }); console.log(report.at(-1))
    await p.close()
  }
  // Expected failure is a user-facing message, with no orphan canvas.
  const fail = await browser.newPage(); await fail.route('**/modeller/kilic.glb', r => r.abort()); await fail.goto(url + '/atolye/kilic'); await fail.getByRole('alert').filter({ hasText: 'Atölye görüntülenemedi' }).waitFor(); assert.equal(await fail.locator('.kilic-sahne canvas').count(), 0); await fail.close()
  assert.deepEqual(errors, []); console.log('Kılıç testleri başarılı.', report)
} finally { await browser.close() }
