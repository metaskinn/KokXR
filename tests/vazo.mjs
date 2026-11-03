import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
mkdirSync('test-sonuclari', { recursive: true })
try {
  for (const width of [1280, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width === 360 })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(url + '/atolye/vazo')
    const start = page.getByRole('button', { name: 'Vazoyu parçala ve onar' })
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Vazoyu parçala ve onar')?.disabled)
    assert.equal(await page.locator('.vazo-sahne canvas').count(), 1)
    const glb = await page.request.get(url + '/modeller/vazo.glb')
    assert.equal(glb.status(), 200)
    assert.equal((await glb.body()).subarray(0, 4).toString(), 'glTF')
    await page.screenshot({ path: `test-sonuclari/vazo-${width}-blender-incele.png`, fullPage: true })
    await start.click()
    const stage = page.locator('.vazo-sahne')
    await stage.scrollIntoViewIfNeeded()
    await page.waitForFunction(() => [...document.querySelectorAll('.vazo-tutamac')].filter((e) => !e.hidden).length === 6)
    await page.screenshot({ path: `test-sonuclari/vazo-${width}-surukle-baslangic.png`, fullPage: true })
    const drag = async (id, good = true, touch = false, physical = false) => {
      const piece = page.locator(`.vazo-tutamac[data-parca-id="${id}"]`)
      const b = await piece.boundingBox()
      assert.ok(b, 'Parça tutamacı yok')
      const cx = b.x + b.width / 2, cy = b.y + b.height / 2
      let sx = cx, sy = cy, started = false
      if (physical) {
        // Sayı tutamacına değil, gerçek GLB yüzeyine fareyle tutun.
        for (const [dx, dy] of [[-28, 0], [28, 0], [-25, -18], [25, -18], [-30, 18], [30, 18], [0, -32], [0, 32]]) {
          const x = cx + dx, y = cy + dy
          const canvas = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === 'CANVAS', { x, y })
          if (!canvas) continue
          await page.mouse.move(x, y); await page.mouse.down()
          await page.waitForTimeout(50)
          const selected = await piece.getAttribute('aria-pressed')
          if (await stage.evaluate((s) => s.classList.contains('parca-surukleniyor')) && selected === 'true') {
            sx = x; sy = y; started = true; break
          }
          await page.keyboard.press('Escape'); await page.mouse.up()
        }
        assert.ok(started, 'GLB yüzeyinden parça tutulamadı')
      }
      let cdp
      if (touch) {
        cdp = await page.context().newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] })
      } else if (!started) { await page.mouse.move(sx, sy); await page.mouse.down() }
      await page.waitForFunction((id) => document.querySelector('.vazo-hedef:not([hidden])')?.dataset.hedefId === String(id), id)
      const target = await page.locator('.vazo-hedef:not([hidden])').boundingBox()
      const tx = good ? target.x + target.width / 2 + sx - cx : sx + 18
      const ty = good ? target.y + target.height / 2 + sy - cy : sy + 18
      if (touch) {
        for (let n = 1; n <= 8; n++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + (tx - sx) * n / 8, y: sy + (ty - sy) * n / 8 }] })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await cdp.detach()
      } else {
        await page.mouse.move(tx, ty, { steps: 12 })
        if (good) await page.waitForFunction(() => document.querySelector('.vazo-hedef.hazir:not([hidden])'))
        await page.mouse.up()
      }
    }
    await drag(0, false, width === 360)
    await page.waitForFunction(() => document.querySelector('.vazo-mesaj').textContent.includes('henüz'))
    assert.equal(await page.getByRole('progressbar').getAttribute('value'), '0')
    // Geri dönüş animasyonu bitsin; sonrasında yeni tutuş aynı yerden başlar.
    await page.waitForTimeout(350)
    for (let id = 0; id < 6; id++) {
      await drag(id, true, width === 360, width === 1280 && id === 0)
      await page.waitForFunction((count) => document.querySelector('progress')?.value === count, id + 1)
      assert.equal(await page.locator(`.vazo-tutamac[data-parca-id="${id}"]`).isVisible(), false)
    }
    assert.match(await page.locator('.yanit').textContent(), /Vazo onarıldı/)
    await page.screenshot({ path: `test-sonuclari/vazo-${width}-surukle-tamam.png`, fullPage: true })
    await page.getByRole('button', { name: 'Yeniden parçala' }).click()
    await stage.scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('progress')?.value === 0)
    // Yakalama iptali parçayı yerleştirmeden bırakır ve kameranın kilidini açar.
    const p0 = await page.locator('.vazo-tutamac[data-parca-id="0"]').boundingBox()
    await page.mouse.move(p0.x + p0.width / 2, p0.y + p0.height / 2)
    await page.mouse.down(); await page.mouse.move(p0.x + 25, p0.y + 25)
    await page.keyboard.press('Escape'); await page.mouse.up()
    assert.equal(await stage.evaluate((s) => s.classList.contains('parca-surukleniyor')), false)
    assert.equal(await page.getByRole('progressbar').getAttribute('value'), '0')
    // Klavye alternatifi: aynı yakınlık kuralıyla parçayı hedefe taşı.
    await page.getByText('Klavye ile birleştir', { exact: true }).click()
    await page.getByRole('group', { name: 'Klavye için parça seçimi' }).getByRole('button', { name: 'Parça 1', exact: true }).click()
    await page.waitForTimeout(300)
    const source = await page.locator('.vazo-tutamac[data-parca-id="0"]').boundingBox()
    const target = await page.locator('.vazo-hedef:not([hidden])').boundingBox()
    const dx = target.x + target.width / 2 - source.x - source.width / 2
    const dy = target.y + target.height / 2 - source.y - source.height / 2
    for (let i = 0; i < Math.abs(Math.round(dx / 12)); i++) await page.keyboard.press(dx > 0 ? 'ArrowRight' : 'ArrowLeft')
    for (let i = 0; i < Math.abs(Math.round(dy / 12)); i++) await page.keyboard.press(dy > 0 ? 'ArrowDown' : 'ArrowUp')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('progress')?.value === 1)
    await page.getByRole('button', { name: 'İncelemeye dön' }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('.vazo-tutamac')].every((e) => e.hidden))
    await page.getByRole('button', { name: 'Görünümü sıfırla' }).click()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.getByRole('link', { name: 'Ana sayfaya dön' }).click()
    await page.getByRole('link', { name: 'Vazo atölyesi', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.vazo-sahne canvas'))
    assert.deepEqual(errors, [])
    console.log(`${width}px: GLB, yanlış bırakma, ${width === 360 ? 'dokunarak' : 'fareyle'} 6 parça sürükleme ve tamamlama, sıfırlama, Escape, klavye ve rota temizliği geçti.`)
    await page.close()
  }
  const failed = await browser.newPage()
  await failed.route('**/modeller/vazo.glb', (route) => route.abort())
  await failed.goto(url + '/atolye/vazo')
  await failed.getByRole('alert').waitFor()
  assert.equal(await failed.getByRole('button', { name: 'Vazoyu parçala ve onar' }).isDisabled(), true)
  assert.equal(await failed.locator('.vazo-sahne canvas').count(), 0)
  await failed.close()
  console.log('GLB yükleme hatası: anlaşılır hata durumu, devre dışı başlangıç ve sızan canvas yok.')
} finally { await browser.close() }
