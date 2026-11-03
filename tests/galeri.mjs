import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
mkdirSync('test-sonuclari', { recursive: true })
try {
  for (const width of [1280, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width === 360 })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const id of ['ulu-camii', 'muradiye-kulliyesi']) {
      await page.goto(`${url}/eser/${id}`)
      const gallery = page.locator('.fotograf-galerisi')
      await gallery.scrollIntoViewIfNeeded()
      const thumbs = gallery.locator('.kucuk-resimler button')
      const count = await thumbs.count()
      const next = gallery.getByRole('button', { name: 'Sonraki fotoğraf', exact: true })
      const previous = gallery.getByRole('button', { name: 'Önceki fotoğraf', exact: true })
      const image = gallery.locator('.buyut img')
      const fitted = async () => {
        await page.waitForFunction(() => { const i = document.querySelector('.buyut img'); return i.complete && i.naturalWidth > 0 && Math.abs(i.clientWidth / i.clientHeight - i.naturalWidth / i.naturalHeight) < 0.015 })
        const result = await image.evaluate((i) => {
          const r = i.getBoundingClientRect(), s = i.closest('.galeri-sahne').getBoundingClientRect()
          return { fits: r.left >= s.left - 1 && r.right <= s.right + 1 && r.top >= s.top - 1 && r.bottom <= s.bottom + 1, ratio: Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight) }
        })
        assert.ok(result.fits && result.ratio < 0.015, 'Görüntü kırpılmış veya alan dışına taşmış')
      }
      for (let index = 0; index < count; index++) {
        await thumbs.nth(index).click()
        await fitted()
        assert.equal(await thumbs.nth(index).getAttribute('aria-pressed'), 'true')
        const visible = await thumbs.nth(index).evaluate((button) => { const b=button.getBoundingClientRect(), p=button.parentElement.getBoundingClientRect(); return b.left >= p.left - 1 && b.right <= p.right + 1 })
        assert.ok(visible, 'Seçili küçük resim şerit dışında')
      }
      await next.click()
      assert.equal(await thumbs.first().getAttribute('aria-pressed'), 'true', 'Son fotoğraftan başa dönmedi')
      await previous.click()
      assert.equal(await thumbs.last().getAttribute('aria-pressed'), 'true')
      await thumbs.first().focus()
      await page.keyboard.press('ArrowRight')
      assert.equal(await thumbs.nth(1).getAttribute('aria-pressed'), 'true')
      await page.keyboard.press('Home')
      const stage = gallery.locator('.galeri-sahne')
      await stage.focus()
      await page.keyboard.press('ArrowRight')
      assert.equal(await thumbs.nth(1).getAttribute('aria-pressed'), 'true')
      await page.keyboard.press('ArrowLeft')
      await fitted()
      const button = gallery.getByRole('button', { name: 'Fotoğrafı büyüt', exact: true })
      await button.click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      await dialog.getByRole('button', { name: 'Yakınlaştır', exact: true }).click()
      await page.waitForFunction(() => document.querySelector('.fotograf-yakinlastirma span')?.textContent === '%150')
      await dialog.getByRole('button', { name: 'Fotoğrafı sığdır' }).click()
      await dialog.getByRole('button', { name: 'Sonraki fotoğraf' }).click()
      await dialog.getByRole('button', { name: 'Kapat (Esc)' }).focus()
      await page.keyboard.press('Shift+Tab')
      assert.match(await page.evaluate(() => document.activeElement.textContent), /Sonraki fotoğraf/)
      await page.keyboard.press('Escape')
      assert.equal(await dialog.count(), 0)
      assert.equal(await button.evaluate((b) => b === document.activeElement), true)
      if (width === 360) {
        await thumbs.first().click()
        await stage.scrollIntoViewIfNeeded()
        const box = await stage.boundingBox()
        const cdp = await page.context().newCDPSession(page)
        const y = box.y + box.height / 2
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * .8, y }] })
        for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * (.8 - .6 * i / 8), y }] })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await page.waitForFunction(() => document.querySelectorAll('.kucuk-resimler button')[1]?.getAttribute('aria-pressed') === 'true')
        assert.equal(await dialog.count(), 0, 'Kaydırma büyütme penceresini açtı')
        await cdp.detach()
      }
      const hotspotThumb = gallery.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ })
      if (await hotspotThumb.count()) {
        await hotspotThumb.click()
        await fitted()
        const point = gallery.locator('.bilgi-noktasi').first()
        const aligned = await point.evaluate((p) => {
          const b=p.getBoundingClientRect(), i=p.parentElement.querySelector('img').getBoundingClientRect()
          const x=parseFloat(p.style.left)/100, y=parseFloat(p.style.top)/100
          return Math.abs(b.x+b.width/2-(i.x+i.width*x)) < 1 && Math.abs(b.y+b.height/2-(i.y+i.height*y)) < 1
        })
        assert.ok(aligned, 'Keşif noktası fotoğrafla hizalı değil')
        await point.click()
        assert.ok(await gallery.locator('.bilgi-karti').isVisible())
      }
      await gallery.screenshot({ path: `test-sonuclari/galeri-${width}-${id}.png` })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      console.log(`${width}px ${id}: ${count} fotoğraf, oran/sığdırma, küçük resimler, oklar, klavye, büyütme, odak ve mobil kaydırma geçti.`)
    }
    await page.getByRole('button', { name: /Gezintiye başla/ }).click()
    await page.waitForFunction(() => document.querySelector('.gezinti-canvas.hazir'))
    await page.getByRole('button', { name: 'Fotoğrafın tamamını göster' }).click()
    await page.waitForFunction(() => !document.querySelector('.gezinti-canvas.hazir'))
    assert.equal(await page.locator('.gezinti-fotograf').evaluate((i) => getComputedStyle(i).objectFit), 'contain')
    const oldTitle = await page.locator('.gezinti-durak-basligi').textContent()
    await page.getByRole('group', { name: 'Bağlı duraklara git' }).getByRole('button').first().click()
    await page.waitForFunction((title) => document.querySelector('.gezinti-durak-basligi').textContent !== title, oldTitle)
    await page.getByRole('button', { name: 'Derinlik etkisine dön' }).click()
    await page.waitForFunction(() => document.querySelector('.gezinti-canvas.hazir'))
    assert.deepEqual(errors, [])
    console.log(`${width}px: gezinti fotoğraf modu, durak geçişi ve derinlik etkisine dönüş geçti.`)
    await page.close()
  }
} finally { await browser.close() }
