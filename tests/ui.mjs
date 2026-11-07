import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
mkdirSync('test-sonuclari', { recursive: true })
const routes = ['/', '/yolculuk', '/ogretmen', '/vizyon', '/kutuphane', '/onay', '/eser/ulu-camii', '/eser/muradiye-kulliyesi', '/atolye/vazo', '/yonetim', '/yonetim/yeni']
try {
  for (const width of process.argv.includes('--contrast-only') ? [] : [1440, 768, 360, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const route of routes) {
      await page.goto(url + route)
      await page.locator('h1').waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px ${route}: yatay taşma`)
      assert.equal(await page.locator('h1').count(), 1)
      const broken = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash))
      assert.deepEqual(broken, [], `${route}: bozuk bölüm bağlantısı`)
      const nav = page.getByRole('navigation', { name: 'Ana gezinme' })
      const sizes = await nav.getByRole('link').evaluateAll((links) => links.map((a) => a.getBoundingClientRect().height))
      assert.ok(sizes.every((h) => h >= 44), `${width}px: gezinme hedefleri küçük`)
      if ([1440, 360].includes(width) && ['/', '/atolye/vazo', '/yonetim'].includes(route)) {
        if (route === '/atolye/vazo') await page.waitForFunction(() => document.querySelector('.vazo-sahne canvas'))
        await page.screenshot({ path: `test-sonuclari/ui-${width}-${route === '/' ? 'ana' : route.replaceAll('/', '-')}.png`, fullPage: true })
      }
    }
    await page.goto(url)
    await page.locator('a.atlama').waitFor({ state: 'attached' })
    await page.keyboard.press('Tab')
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Ana içeriğe geç/)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.activeElement.id === 'ana-icerik')
    await page.getByRole('link', { name: 'Keşfetmeye başla' }).click()
    const top = await page.locator('#eserler').evaluate((e) => e.getBoundingClientRect().top)
    assert.ok(top >= 0 && top < 100, `bölüme atlama: ${top}`)
    await page.getByRole('navigation', { name: 'Ana gezinme' }).getByRole('link', { name: 'Vazo atölyesi' }).click()
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Ana gezinme"] a[href="/atolye/vazo"]')?.getAttribute('aria-current') === 'page' && document.activeElement.id === 'ana-icerik')
    assert.equal(await page.getByRole('link', { name: 'Vazo atölyesi', exact: true }).getAttribute('aria-current'), 'page')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'ana-icerik')
    assert.deepEqual(errors, [])
    console.log(`${width}px: ${routes.length} rota, taşma, başlıklar, bölüm bağlantıları, 44px gezinme, atlama ve rota odağı geçti.`)
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
      ['Ana metin', get('--metin'), get('--zemin')],
      ['İkincil metin', get('--ikincil'), get('--zemin')],
      ['Bronz etiket', get('--bronz'), get('--zemin')],
      ['Ana düğme', '#ffffff', get('--yesil')],
      ['Açık panel', get('--yesil'), get('--yesil-acik')],
      ['Fotoğraf açıklaması', '#ffffff', color('.giris-gorsel figcaption', 'backgroundColor')],
      ['Hero vurgu', color('.giris h1 em', 'color'), get('--zemin')],
      ['Atölye açıklaması', color('.vazo-tanitim-metin > p:not(.ust-baslik)', 'color'), color('.vazo-tanitim', 'backgroundColor')],
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
    assert.ok(ratio >= 4.5, `${label}: kontrast düşük`)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.kapak').first().evaluate((e) => getComputedStyle(e).transitionDuration), '0s')
  await page.close()
} finally { await browser.close() }
