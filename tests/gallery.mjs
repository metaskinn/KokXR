import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
mkdirSync('test-results', { recursive: true })
try {
  for (const width of [1280, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width === 360 })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const id of ['ulu-mosque', 'muradiye-complex']) {
      await page.goto(`${url}/artifact/${id}`)
      const gallery = page.locator('.photo-gallery')
      await gallery.scrollIntoViewIfNeeded()
      const thumbs = gallery.locator('.small-images button')
      const count = await thumbs.count()
      const next = gallery.getByRole('button', { name: 'Sonraki fotoğraf', exact: true })
      const previous = gallery.getByRole('button', { name: 'Önceki fotoğraf', exact: true })
      const image = gallery.locator('.zoom img')
      const fitted = async () => {
        await page.waitForFunction(() => { const i = document.querySelector('.zoom img'); return i.complete && i.naturalWidth > 0 && Math.abs(i.clientWidth / i.clientHeight - i.naturalWidth / i.naturalHeight) < 0.015 })
        const result = await image.evaluate((i) => {
          const r = i.getBoundingClientRect(), s = i.closest('.gallery-scene').getBoundingClientRect()
          return { fits: r.left >= s.left - 1 && r.right <= s.right + 1 && r.top >= s.top - 1 && r.bottom <= s.bottom + 1, ratio: Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight) }
        })
        assert.ok(result.fits && result.ratio < 0.015, 'Image cropped or overflowing its area')
      }
      for (let index = 0; index < count; index++) {
        await thumbs.nth(index).click()
        await fitted()
        assert.equal(await thumbs.nth(index).getAttribute('aria-pressed'), 'true')
        const visible = await thumbs.nth(index).evaluate((button) => { const b=button.getBoundingClientRect(), p=button.parentElement.getBoundingClientRect(); return b.left >= p.left - 1 && b.right <= p.right + 1 })
        assert.ok(visible, 'Selected thumbnail outside the strip')
      }
      await next.click()
      assert.equal(await thumbs.first().getAttribute('aria-pressed'), 'true', 'Did not wrap from the last photo to the first')
      await previous.click()
      assert.equal(await thumbs.last().getAttribute('aria-pressed'), 'true')
      await thumbs.first().focus()
      await page.keyboard.press('ArrowRight')
      assert.equal(await thumbs.nth(1).getAttribute('aria-pressed'), 'true')
      await page.keyboard.press('Home')
      const stage = gallery.locator('.gallery-scene')
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
      await page.waitForFunction(() => document.querySelector('.photo-zoom span')?.textContent === '%150')
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
        await page.waitForFunction(() => document.querySelectorAll('.small-images button')[1]?.getAttribute('aria-pressed') === 'true')
        assert.equal(await dialog.count(), 0, 'Swipe opened the zoom dialog')
        await cdp.detach()
      }
      const hotspotThumb = gallery.getByRole('button', { name: /fotoğraf: İç mekândaki şadırvan/ })
      if (await hotspotThumb.count()) {
        await hotspotThumb.click()
        await fitted()
        const point = gallery.locator('.info-point').first()
        const aligned = await point.evaluate((p) => {
          const b=p.getBoundingClientRect(), i=p.parentElement.querySelector('img').getBoundingClientRect()
          const x=parseFloat(p.style.left)/100, y=parseFloat(p.style.top)/100
          return Math.abs(b.x+b.width/2-(i.x+i.width*x)) < 1 && Math.abs(b.y+b.height/2-(i.y+i.height*y)) < 1
        })
        assert.ok(aligned, 'Hotspot not aligned with the photo')
        await point.click()
        assert.ok(await gallery.locator('.info-card').isVisible())
      }
      await gallery.screenshot({ path: `test-results/gallery-${width}-${id}.png` })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      console.log(`${width}px ${id}: ${count} photos, ratio/fit, thumbnails, arrows, keyboard, zoom, focus and mobile swipe passed.`)
    }
    assert.deepEqual(errors, [])
    await page.close()
  }
} finally { await browser.close() }
