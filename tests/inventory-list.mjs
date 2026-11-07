// Places page: the full inventory list, its filters and the 3D-model filter. First: npm run build && npm run preview -- --port 4173
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] })
try {
  for (const width of [1280, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width === 360 })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${url}/places`)
    const section = page.locator('.inventory')
    await section.waitFor()
    const count = async () => Number((await section.locator('.inventory-count').innerText()).replace(/\D/g, ''))
    assert.equal(await count(), 340, 'all buildings are listed')

    await section.getByLabel('Yalnız 3B maketi olanlar').check()
    assert.equal(await count(), 10, 'model filter keeps exactly the buildings with a scale model')
    assert.equal(await section.locator('.inventory-list li[data-model="yes"] a').count(), 10, 'each model building links to its page')
    assert.equal(await section.locator('.inventory-list em', { hasText: '3B maket yok' }).count(), 0)
    await section.getByLabel('Yalnız 3B maketi olanlar').uncheck()

    await section.locator('select').first().selectOption('İznik')
    assert.equal(await count(), 19)
    assert.equal(await section.locator('.inventory-list li[data-model="yes"] a').count(), 0, 'no model exists outside the Bursa city districts')
    await section.locator('select').first().selectOption('')

    await section.getByRole('searchbox').fill('iznik')
    assert.equal(await count(), 0, 'search matches names and groups, not districts')
    await section.getByRole('searchbox').fill('ulucami')
    assert.ok((await count()) >= 1)
    await section.getByRole('searchbox').fill('')

    assert.equal(await section.locator('.inventory-list li').count(), 60, 'first page shows 60 rows')
    await section.getByRole('button', { name: /Daha fazla göster/ }).click()
    assert.equal(await section.locator('.inventory-list li').count(), 120)

    if (width === 1280) {
      await section.getByRole('searchbox').fill('davutpa')
      await section.locator('.inventory-list a').first().click()
      await page.getByRole('heading', { level: 1 }).waitFor()
      assert.match(page.url(), /\/places\/yapi\//, 'non-model building opens its inventory page')
      assert.ok((await page.locator('.inventory-page').innerText()).includes('3B maket: yok'))
      await page.goBack()
      await section.waitFor()
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    assert.ok(!overflow, `${width}px: no horizontal overflow`)
    assert.deepEqual(errors, [], 'no console errors')
    await page.close()
  }
  console.log('PASS inventory-list: 340 rows, model filter 10, district and search filters, paging, no overflow at 1280 and 360.')
} finally { await browser.close() }
