// Ulu Camii iç mekânı: minber, kürsü ve mahfile gerçek çarpışma verisiyle yürüyerek çıkılabilir, kenardan düşülmez.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/maket-tirmanma.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto(url)
const result = await page.evaluate(async () => {
  const { interiorWalkArea, interiorStops } = await import('/src/components/maket/ulucamiIc.ts')
  const { floorStep, stopFloor, PLAYER_RADIUS: R } = await import('/src/components/maket/yurumeCarpisma.ts')
  const { MAHFIL, KURSU } = await import('/src/components/maket/ulucamiDetay.ts')
  const y = interiorWalkArea()
  /** Noktadan noktaya 3 cm adımlarla yürür; takıldığı yeri ve yüksekliği döner. */
  const walk = (head, path) => {
    let [x, z, h] = head
    for (const [hx, hz] of path) {
      const n = Math.ceil(Math.hypot(hx - x, hz - z) / 0.03)
      const dx = (hx - x) / n, dz = (hz - z) / n
      for (let i = 0; i < n; i++) {
        const fresh = floorStep(y, x + dx, z + dz, R, h)
        if (fresh === null) return { x, z, h, attachedFlag: true }
        x += dx; z += dz; h = fresh
      }
    }
    return { x, z, h, attachedFlag: false }
  }
  const MX = -5.4, Z0 = 25.5 - 1.05 - 7.2, zem = (id) => stopFloor(y, interiorStops.find((d) => d.id === id).position)
  return {
    minbar: walk([MX - 3, Z0 - 0.75, 0], [[MX, Z0 - 0.75], [MX, Z0 + 5.5]]),
    minbarIn: walk([MX, Z0 + 5.5, 4.7], [[MX, Z0 - 0.75], [MX - 3, Z0 - 0.75]]),
    minbarSide: walk([MX, Z0 + 3, 2.15], [[MX - 3, Z0 + 3]]),
    minbarOuter: walk([MX + 2, Z0 + 3, 0], [[MX, Z0 + 3]]),
    kursu: walk([KURSU.x - 0.1, KURSU.z - KURSU.r - 2.2, 0], [[KURSU.x - 0.1, KURSU.z]]),
    kursuOuter: walk([KURSU.x - 2, KURSU.z, 0], [[KURSU.x, KURSU.z]]),
    mahfil: walk([MAHFIL.x + 2.65, MAHFIL.z - 6.95, 0], [[MAHFIL.x + 2.65, MAHFIL.z - 2], [MAHFIL.x, MAHFIL.z]]),
    mahfilEdge: walk([MAHFIL.x, MAHFIL.z, 3.8], [[MAHFIL.x, MAHFIL.z + 5]]),
    mahfilBottom: walk([MAHFIL.x, MAHFIL.z - 4, 0], [[MAHFIL.x, MAHFIL.z + 4]]),
    stops: { minbar: zem('minbar-top'), kursu: zem('kursu-top'), mahfil: zem('mahfil-top'), entrance: zem('entrance'), fountain: zem('fountain') },
  }
})
const condition = (k, m) => { if (!k) throw new Error(m + ' ' + JSON.stringify(result)) }
condition(!result.minbar.attachedFlag && result.minbar.h > 4, 'minbere çıkılamadı')
condition(!result.minbarIn.attachedFlag && result.minbarIn.h === 0, 'minberden inilemedi')
condition(result.minbarSide.attachedFlag && result.minbarSide.h > 1.5, 'minber yanından düşüldü')
condition(result.minbarOuter.attachedFlag && result.minbarOuter.h === 0, 'minber yanından girildi')
condition(!result.kursu.attachedFlag && result.kursu.h > 2, 'kürsüye çıkılamadı')
condition(result.kursuOuter.attachedFlag && result.kursuOuter.h === 0, 'kürsü gövdesinden geçildi')
condition(!result.mahfil.attachedFlag && result.mahfil.h > 3.5, 'mahfile çıkılamadı')
condition(result.mahfilEdge.attachedFlag && result.mahfilEdge.h > 3.5, 'mahfilden düşüldü')
condition(!result.mahfilBottom.attachedFlag && result.mahfilBottom.h === 0, 'mahfilin altından geçilemedi')
condition(result.stops.minbar > 3 && result.stops.kursu > 2 && result.stops.mahfil > 3.5 && result.stops.entrance === 0 && result.stops.fountain === 0, 'durak zeminleri yanlış')
console.log('Tırmanma: minber, kürsü ve mahfile çıkış, iniş, kenardan düşmeme, duraklar geçti.')
await browser.close()
