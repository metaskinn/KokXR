// Ulu Mosque model interior: keyboard walking, collision, info card on approach, markers, cleanup.
// Run: npm run build && npm run preview -- --port 4173, then node tests/model-interior.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const condition = (cond, message) => { if (!cond) throw new Error(message) }

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width: width, height: height } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
  page.on('response', (r) => { if (r.url().includes('/images/ulu-mosque/model/') && r.status() !== 200) errors.push(`texture failed to load: ${r.url()}`) })
  await page.goto(`${url}/places/ulu-mosque`)
  await page.locator('.model-area canvas').waitFor({ timeout: 30000 })
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'İçeri gir' }).click({ timeout: 30000 })
  return { page, errors }
}
const card = (page) => page.locator('.model-info-card')
const cardTitle = (page, title) => card(page).getByRole('heading', { name: title }).waitFor({ timeout: 60000 })
const position = async (page) => {
  const k = await page.locator('.model-area').getAttribute('data-position')
  return k ? k.split(',').map(Number) : null
}
const frame = async (page) => Number(await page.locator('.model-area').getAttribute('data-frame'))
/** Holds the key until the position stays unchanged for 8 consecutive frames (with collision it must stop somewhere).
 *  Frames are counted, not time: the frame rate under software rendering is very low. */
async function toWall(page, keyBtn, maxMs = 200000) {
  await page.keyboard.down(keyBtn)
  const head = Date.now()
  let previous = await position(page), fixedFrame = await frame(page), stopped = false
  while (Date.now() - head < maxMs && !stopped) {
    await page.waitForTimeout(400)
    const now = await position(page), k = await frame(page)
    if (!now || !previous || now[0] !== previous[0] || now[1] !== previous[1]) { previous = now; fixedFrame = k }
    else stopped = k - fixedFrame >= 8
  }
  await page.keyboard.up(keyBtn)
  condition(stopped, `did not stop while walking with ${keyBtn}: ${previous}`)
  return previous
}

// --- Desktop: keyboard ---
{
  const { page, errors } = await open(1000, 700)
  await cardTitle(page, 'Giriş kapısı')
  condition(await card(page).getByText(/^Kaynak:/).count(), 'card has no source line')
  condition(await page.evaluate(() => document.activeElement?.classList.contains('model-area')), 'focus not on the scene after entering')

  // Walk south from the north entrance: pass through the railing gap and stop at the pool (r 3.75 + 0.45, center z ≈ -6.9).
  const [x1, z1] = await toWall(page, 'w')
  condition(Math.abs(x1) < 0.5, `drifted sideways while walking: x=${x1}`)
  condition(z1 > -12 && z1 < -10.8, `did not stop at the pool: z=${z1}`)
  await cardTitle(page, 'Şadırvan')
  await page.screenshot({ path: 'test-results/model-interior-fountain.png' })

  // Close: must not reopen while staying in the same area.
  await page.getByRole('button', { name: 'Bilgiyi kapat' }).click()
  await card(page).waitFor({ state: 'detached' })
  await page.waitForTimeout(1500)
  condition(!(await card(page).count()), 'closed card reopened by itself')

  // Walk back and sideways: must not cross the wall limit (inner wall z = -25.5, player 0.45).
  const [, z2] = await toWall(page, 's')
  condition(z2 < z1 - 5, `did not walk back: z=${z2}`)
  condition(z2 >= -25.06, `crossed the north wall: z=${z2}`)
  const [x3] = await toWall(page, 'd')
  condition(Math.abs(x3) > 5, `did not walk sideways: x=${x3}`)
  condition(Math.abs(x3) <= 32.06, `crossed the side wall: x=${x3}`)

  // Turning does not change position; walking forward afterwards must go in the new direction.
  const [xd, zd] = await position(page)
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(1500)
  await page.keyboard.up('ArrowLeft')
  const [xd2, zd2] = await position(page)
  condition(xd === xd2 && zd === zd2, 'position changed while turning')

  // Stops: each one opens its own card.
  for (const [stop, title] of [['Şadırvan', 'Şadırvan'], ['Mihrap', 'Mihrap'], ['Minber', 'Minber'], ['Doğu kapısı', 'Doğu kapısı'], ['Kâbe örtüsü', 'Kâbe kapısının örtüsü'], ['Levha', 'Hat levhaları'], ['Kubbe', 'Kubbeler'], ['Giriş', 'Giriş kapısı']]) {
    await page.getByRole('button', { name: stop, exact: true }).click()
    await cardTitle(page, title)
  }

  // Markers behind the viewer must be hidden: facing the east door, the mihrab is behind.
  await page.getByRole('button', { name: 'Doğu kapısı', exact: true }).click()
  await cardTitle(page, 'Doğu kapısı')
  await page.waitForFunction(() => {
    const k = document.querySelector('.model-area')?.dataset.frame
    return k && Number(k) > 0
  })
  await page.waitForTimeout(6000)
  condition(await page.locator('.model-marker[data-info="mihrab"]').isHidden(), 'mihrab marker behind is visible')

  // Clicking a marker opens its card; a visible marker must exist.
  await page.getByRole('button', { name: 'Şadırvan', exact: true }).click()
  const marker = page.locator('.model-marker[data-info="fountain"]')
  await marker.waitFor({ state: 'visible', timeout: 60000 })
  await cardTitle(page, 'Şadırvan')
  await page.getByRole('button', { name: 'Bilgiyi kapat' }).click()
  await card(page).waitFor({ state: 'detached', timeout: 30000 })
  await marker.dispatchEvent('click')
  await cardTitle(page, 'Şadırvan')
  await page.screenshot({ path: 'test-results/model-interior-marker.png' })

  // After exiting, no marker or card remains.
  await page.getByRole('button', { name: /Dışarı çık/ }).click()
  await card(page).waitFor({ state: 'detached', timeout: 30000 })
  condition(await page.locator('.model-markers').isHidden(), 'markers visible outside')

  // The scene is cleaned up on route change.
  await page.getByRole('navigation', { name: 'Ana gezinme' }).first().getByRole('link', { name: 'Eserler' }).click()
  await page.waitForURL(`${url}/artifacts`)
  await page.locator('.model-area').waitFor({ state: 'detached', timeout: 30000 })
  condition(!(await page.locator('.model-markers').count()), 'marker layer not cleaned up')
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('1000px: walking, collision, card on approach, closing, stops, markers, exit and cleanup passed.')
}

// --- Phone: tap a marker, no overflow ---
{
  const { page, errors } = await open(360, 760)
  await cardTitle(page, 'Giriş kapısı')
  await page.getByRole('button', { name: 'Şadırvan', exact: true }).click()
  await cardTitle(page, 'Şadırvan')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  condition(overflow <= 0, `horizontal overflow: ${overflow}px`)
  const k = await card(page).boundingBox(), a = await page.locator('.model-area').boundingBox()
  condition(k.x >= a.x && k.x + k.width <= a.x + a.width + 1, 'card overflows the scene')
  await page.locator('.model-box').screenshot({ path: 'test-results/model-interior-360.png' })
  condition(!errors.length, `console error: ${errors.join(' | ')}`)
  await page.close()
  console.log('360px: card from stop, no overflow, card fits the scene.')
}

await browser.close()
