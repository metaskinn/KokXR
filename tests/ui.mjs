import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
mkdirSync('test-results', { recursive: true })
const routes = ['/artifacts', '/places', '/artifact/ulu-mosque', '/artifact/muradiye-complex', '/workshops/vase', '/admin', '/admin/new']
try {
  for (const width of process.argv.includes('--contrast-only') ? [] : [1440, 768, 360, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const route of routes) {
      await page.goto(url + route)
      await page.locator('h1').waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px ${route}: horizontal overflow`)
      assert.equal(await page.locator('h1').count(), 1)
      const broken = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash))
      assert.deepEqual(broken, [], `${route}: broken section link`)
      const nav = page.getByRole('navigation', { name: 'Ana gezinme' })
      const sizes = await nav.getByRole('link').evaluateAll((links) => links.map((a) => a.getBoundingClientRect().height))
      assert.ok(sizes.every((h) => h >= 44), `${width}px: navigation targets too small`)
      if ([1440, 360].includes(width) && ['/artifacts', '/workshops/vase', '/admin'].includes(route)) {
        if (route === '/workshops/vase') await page.waitForFunction(() => document.querySelector('.vase-scene canvas'))
        await page.screenshot({ path: `test-results/ui-${width}-${route.replaceAll('/', '-')}.png`, fullPage: true })
      }
    }
    await page.goto(url)
    await page.keyboard.press('Tab')
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Ana içeriğe geç/)
    await page.keyboard.press('Enter')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content')
    await page.getByRole('navigation', { name: 'Ana gezinme' }).getByRole('link', { name: 'Atölyeler' }).click()
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Ana gezinme"] a[href="/workshops"]')?.getAttribute('aria-current') === 'page' && document.activeElement.id === 'main-content')
    assert.equal(await page.getByRole('navigation', { name: 'Atölyeler', exact: true }).getByRole('link', { name: 'Vazo atölyesi' }).getAttribute('aria-current'), 'page')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content')
    assert.deepEqual(errors, [])
    console.log(`${width}px: ${routes.length} routes, overflow, headings, section links, 44px navigation, skip link and route focus passed.`)
    await page.close()
  }
  const page = await browser.newPage()
  await page.goto(url)
  const pairs = await page.evaluate(() => {
    const v = getComputedStyle(document.documentElement)
    const get = (name) => v.getPropertyValue(name).trim()
    const color = (selector, property) => {
      const value = getComputedStyle(document.querySelector(selector))[property]
      return '#' + value.match(/\d+/g).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')
    }
    return [
      ['Body text', get('--text'), get('--floor')],
      ['Secondary text', get('--secondary'), get('--floor')],
      ['Bronze label', get('--bronze'), get('--floor')],
      ['Primary button', '#ffffff', get('--highlight')],
      ['Open panel', get('--highlight'), get('--highlight-open')],
      ['Card summary', color('.card-summary', 'color'), color('.artifact-card', 'backgroundColor')],
    ]
  })
  const luminance = (hex) => {
    const c = hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722
  }
  for (const [label, foreground, background] of pairs) {
    const a = luminance(foreground), b = luminance(background)
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    console.log(`${label}: ${ratio.toFixed(2)}:1`)
    assert.ok(ratio >= 4.5, `${label}: contrast too low`)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.cover').first().evaluate((e) => getComputedStyle(e).transitionDuration), '0s')
  await page.close()
} finally { await browser.close() }
