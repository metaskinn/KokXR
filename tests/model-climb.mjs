// Ulu Mosque interior: the minbar and mahfil can be climbed on foot with real collision data, without falling off edges.
// Run: with the dev server up, TEST_URL=http://127.0.0.1:5173 node tests/model-climb.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto(url)
const result = await page.evaluate(async () => {
  const { interiorWalkArea, interiorStops } = await import('/src/features/scale-models/uluMosqueInterior.ts')
  const { floorStep, stopFloor, PLAYER_RADIUS: R } = await import('/src/features/scale-models/walkingCollision.ts')
  const { MAHFIL, KURSU } = await import('/src/features/scale-models/uluMosqueDetail.ts')
  const y = interiorWalkArea()
  /** Walks point to point in 3 cm steps; returns where it got stuck and the height. */
  const walk = (head, path) => {
    let [x, z, h] = head
    for (const [hx, hz] of path) {
      const n = Math.ceil(Math.hypot(hx - x, hz - z) / 0.03)
      const dx = (hx - x) / n, dz = (hz - z) / n
      for (let i = 0; i < n; i++) {
        const fresh = floorStep(y, x + dx, z + dz, R, h)
        if (fresh === null) return { x, z, h, blocked: true }
        x += dx; z += dz; h = fresh
      }
    }
    return { x, z, h, blocked: false }
  }
  const MX = -5.4, Z0 = 25.5 - 1.05 - 7.2, floorAt = (id) => stopFloor(y, interiorStops.find((d) => d.id === id).position)
  return {
    minbar: walk([MX - 3, Z0 - 0.75, 0], [[MX, Z0 - 0.75], [MX, Z0 + 5.5]]),
    minbarIn: walk([MX, Z0 + 5.5, 4.7], [[MX, Z0 - 0.75], [MX - 3, Z0 - 0.75]]),
    minbarSide: walk([MX, Z0 + 3, 2.15], [[MX - 3, Z0 + 3]]),
    minbarOuter: walk([MX + 2, Z0 + 3, 0], [[MX, Z0 + 3]]),
    kursuOuter: walk([KURSU.x - 2, KURSU.z, 0], [[KURSU.x, KURSU.z]]),
    mahfil: walk([MAHFIL.x + 2.65, MAHFIL.z - 6.95, 0], [[MAHFIL.x + 2.65, MAHFIL.z - 2], [MAHFIL.x, MAHFIL.z]]),
    mahfilEdge: walk([MAHFIL.x, MAHFIL.z, 3.8], [[MAHFIL.x, MAHFIL.z + 5]]),
    mahfilBottom: walk([MAHFIL.x, MAHFIL.z - 4, 0], [[MAHFIL.x, MAHFIL.z + 4]]),
    stops: { minbar: floorAt('minbar-top'), mahfil: floorAt('mahfil-top'), entrance: floorAt('entrance'), fountain: floorAt('fountain') },
  }
})
const condition = (k, m) => { if (!k) throw new Error(m + ' ' + JSON.stringify(result)) }
condition(!result.minbar.blocked && result.minbar.h > 4, 'could not climb the minbar')
condition(!result.minbarIn.blocked && result.minbarIn.h === 0, 'could not descend the minbar')
condition(result.minbarSide.blocked && result.minbarSide.h > 1.5, 'fell off the side of the minbar')
condition(result.minbarOuter.blocked && result.minbarOuter.h === 0, 'entered the minbar from the side')
condition(result.kursuOuter.blocked && result.kursuOuter.h === 0, 'passed through the kursu body')
condition(!result.mahfil.blocked && result.mahfil.h > 3.5, 'could not climb the mahfil')
condition(result.mahfilEdge.blocked && result.mahfilEdge.h > 3.5, 'fell off the mahfil')
condition(!result.mahfilBottom.blocked && result.mahfilBottom.h === 0, 'could not pass under the mahfil')
condition(result.stops.minbar > 3 && result.stops.mahfil > 3.5 && result.stops.entrance === 0 && result.stops.fountain === 0, 'stop floors are wrong')
console.log('Climb: ascending and descending minbar and mahfil, no falling off edges, stops passed.')
await browser.close()
