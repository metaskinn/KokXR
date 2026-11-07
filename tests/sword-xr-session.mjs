// Kılıç atölyesinin VR oturumu: gerçek Three.js WebXRManager, sahte WebXR çalışma ortamıyla (cihaz değil, emülatör değil).
// Baş ve kumanda pozları elle verilir; ekran görüntüleri test-sonuclari/kilic-xr-*.png.
// Çalıştırma: npm run build && npm run preview -- --port 4177 --strictPort, sonra TEST_URL=http://localhost:4177 node tests/kilic-xr-oturum.mjs
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const SURE = 240000
mkdirSync('test-results', { recursive: true })
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })

// Sayfaya enjekte edilen sahte WebXR: three'nin kullandığı en küçük yüzey.
function fakeXr({ gen, burden }) {
  const pose = (p, forward) => {
    const l = Math.hypot(...forward), z = forward.map(v => -v / l)
    let x = [z[2], 0, -z[0]] // yukarı × z
    const lx = Math.hypot(...x); x = lx < 1e-5 ? [1, 0, 0] : x.map(v => v / lx)
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]
    return new Float32Array([...x, 0, ...y, 0, ...z, 0, ...p, 1])
  }
  const inverse = m => {
    const r = [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0]
    const t = [m[12], m[13], m[14]]
    return new Float32Array([...r, -(m[0] * t[0] + m[1] * t[1] + m[2] * t[2]), -(m[4] * t[0] + m[5] * t[1] + m[6] * t[2]), -(m[8] * t[0] + m[9] * t[1] + m[10] * t[2]), 1])
  }
  const n = .05, f = 70, proj = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -(f + n) / (f - n), -1, 0, 0, -2 * f * n / (f - n), 0])
  const controller = (el) => ({ el, ray: { p: [el === 'right' ? .2 : -.2, 1.2, -.2], y: [0, 0, -1] }, grip: { p: [el === 'right' ? .2 : -.2, 1.1, -.2], y: [0, 0, -1] } })
  const X = window.__xr = {
    head: { p: [0, 1.6, 0], yaw: 0 }, squares: 0, vibration: 0, session: null, ended: 0, request: [],
    el: { right: controller('right'), left: controller('left') }, sources: [], planned: [],
  }
  const space = f => ({ __pose: f })
  const source = (el) => ({
    handedness: el, targetRayMode: 'tracked-pointer', profiles: [],
    targetRaySpace: space(() => pose(X.el[el].ray.p, X.el[el].ray.y)), gripSpace: space(() => pose(X.el[el].grip.p, X.el[el].grip.y)),
    gamepad: { axes: [0, 0, 0, 0], buttons: Array.from({ length: 6 }, () => ({ pressed: false, touched: false, value: 0 })), hapticActuators: [{ pulse: async () => { X.vibration++; return true } }] },
  })
  const createFrame = () => ({
    getViewerPose: () => {
      const b = X.head, y = [-Math.sin(b.yaw), 0, -Math.cos(b.yaw)], o = pose(b.p, y)
      const eye = (eyeV, dx) => { const p = [b.p[0] + o[0] * dx, b.p[1] + o[1] * dx, b.p[2] + o[2] * dx], m = pose(p, y); return { eye: eyeV, projectionMatrix: proj, transform: { matrix: m, inverse: { matrix: inverse(m) } } } }
      return { transform: { matrix: o, inverse: { matrix: inverse(o) } }, views: [eye('left', -.032), eye('right', .032)] }
    },
    getPose: (s) => ({ transform: { matrix: s.__pose() }, emulatedPosition: false }),
    getJointPose: () => null,
  })
  class Session extends EventTarget {
    renderState = { baseLayer: null, depthNear: .1, depthFar: 1000 }
    enabledFeatures = ['local-floor']; inputSources = []; visibilityState = 'visible'; environmentBlendMode = 'opaque'; done = false
    updateRenderState(s) { Object.assign(this.renderState, s) }
    async requestReferenceSpace(tour) { X.spaceType = tour; return { tour } }
    requestAnimationFrame(cb) { return requestAnimationFrame(t => { if (this.done) return; X.squares++; for (const f of X.planned.splice(0)) f(); if (this.done) return; const k = createFrame(); k.session = this; cb(t, k) }) }
    cancelAnimationFrame(id) { cancelAnimationFrame(id) }
    async end() { if (this.done) throw new DOMException('kapalı', 'InvalidStateError'); this.done = true; X.ended++; this.dispatchEvent(new Event('end')) }
  }
  window.XRWebGLLayer = class { constructor() { this.framebuffer = null; this.framebufferWidth = gen; this.framebufferHeight = burden; this.antialias = true; this.fixedFoveation = 0 } getViewport(v) { return { x: v.eye === 'left' ? 0 : gen / 2, y: 0, width: gen / 2, height: burden } } }
  WebGL2RenderingContext.prototype.makeXRCompatible = async function () {}
  window.XRWebGLBinding = undefined
  Object.defineProperty(navigator, 'xr', {
    configurable: true,
    value: {
      isSessionSupported: async k => k === 'immersive-vr',
      requestSession: async (kip, sec) => {
        X.request.push({ kip, sec, gesture: navigator.userActivation.isActive })
        const s = X.session = new Session()
        X.planned.length = 0
        // Kaynaklar oturum kurulduktan sonra gelir (gerçek cihazda da olay ile).
        setTimeout(() => {
          const added = ['right', 'left'].map(source); s.inputSources = added; X.sources = added
          const e = new Event('inputsourceschange'); e.added = added; e.removed = []; s.dispatchEvent(e)
        }, 50)
        return s
      },
    },
  })
  const event = (ad, el) => { const e = new Event(ad); e.inputSource = X.sources.find(k => k.handedness === el); e.frame = createFrame(); e.frame.session = X.session; X.session.dispatchEvent(e) }
  X.trigger = (el, head) => X.planned.push(() => event(head ? 'selectstart' : 'selectend', el))
}

const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
// Yazılımsal çizim yavaştır: mantık düşük çözünürlükte, ekran görüntüsü XR_GORUNTU=1 ile yüksek çözünürlükte denenir.
const [GEN, LOAD] = process.env.XR_SCREENSHOT ? [1400, 700] : [240, 120]
await page.addInitScript(fakeXr, { gen: GEN, burden: LOAD })
await page.goto(`${url}/workshop/sword`)
const area = page.locator('.sword-scene')
await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.strikeX, null, { timeout: SURE })
const vrButton = page.getByRole('button', { name: "VR'da aç" })
await vrButton.waitFor({ timeout: SURE })
await page.locator('.sword-loading').waitFor({ state: 'detached', timeout: SURE })

const data = ad => area.getAttribute(`data-${ad}`)
const scene = async () => JSON.parse(await data('xr-scene') ?? '{}')
const waitFrame = (n = 3) => page.evaluate(async n => { const b = window.__xr.squares; while (window.__xr.squares < b + n && !window.__xr.session?.done) await new Promise(r => setTimeout(r, 15)) }, n) // Kapanan oturumda kare gelmez
const wait = async (cond, ad, ms = 240000) => { const last = Date.now() + ms; while (Date.now() < last) { if (await cond()) return; await page.waitForTimeout(120) } throw new Error(`zaman aşımı: ${ad}; sahne ${await data('xr-scene')}; konsol ${errors.join(' | ')}; sayfa hatası ${await page.locator('.sword-xr-error').count()}`) }
const waitStage = (n) => wait(async () => await data('stage') === String(n), `aşama ${n}`)
const rig = async () => JSON.parse(await data('xr-rig'))
/** Dünya noktasını rig yereline çevirir. */
const local = (r, p) => { const dx = p[0] - r[0], dy = p[1] - r[1], dz = p[2] - r[2], c = Math.cos(r[3]), s = Math.sin(r[3]); return [dx * c - dz * s, dy, dx * s + dz * c] }
const aim = async (el, world) => {
  const y = local(await rig(), world)
  await page.evaluate(({ el, y }) => { const k = window.__xr.el[el]; k.ray.y = y.map((v, i) => v - k.ray.p[i]) }, { el, y })
  await waitFrame(2)
}
const trigger = async (el, head) => { await page.evaluate(({ el, head }) => window.__xr.trigger(el, head), { el, head }); await waitFrame(2) }
const button = async id => { const d = JSON.parse(await data('xr-buttons')).find(k => k.id === id); assert(d, `düğme yok: ${id}`); return d }
const head = async (id, el = 'left') => { await aim(el, (await button(id)).p); await trigger(el, true); await trigger(el, false) }
const pressHold = async (id, cond, ad, el = 'left') => { await aim(el, (await button(id)).p); await trigger(el, true); await wait(cond, ad); await trigger(el, false) }
const targetPoint_ = async () => JSON.parse(await data('xr-marker'))
const headPos = (r, b) => { const c = Math.cos(r[3]), s = Math.sin(r[3]); return [r[0] + b[0] * c + b[2] * s, r[2] - b[0] * s + b[2] * c] }
// Three kare başında sol göz pozunu verir: 3,2 cm pay.
const atStation = async (x, z) => { await waitFrame(2); const b = await page.evaluate(() => window.__xr.head.p), h = headPos(await rig(), b); assert(Math.hypot(h[0] - x, h[1] - z) < .04, `baş ${h} ≠ ${x},${z}`) }
const view = async ad => { if (!process.env.XR_SCREENSHOT) return; await waitFrame(3); await page.evaluate(() => document.querySelector('.sword-scene').scrollIntoView()); await area.screenshot({ path: `test-results/sword-xr-${ad}.png` }) }
const measurementOf = []
const measure = async ad => { await waitFrame(4); const s = await scene(); measurementOf.push({ stage: ad, drawing: s.drawing, triangle: s.triangle, program: s.program, texture: s.texture, geometry: s.geo }) }
// Kılıç aşamalar arasında kavisle taşınır; asıl konumuna oturunca nişan alınır.
const swordStays = async () => { let once = ''; await wait(async () => { const k = JSON.stringify((await scene()).sword); const fixed = k === once; once = k; await waitFrame(2); return fixed }, 'kılıç otursun') }
const vibration = () => page.evaluate(() => window.__xr.vibration)

// Önce: masaüstü kamerasının ekrana izdüşümü (çıkışta aynısına dönmeli).
const previous = { x: Number(await data('target-x')), o: Number(await data('target-scale')), w: await page.evaluate(() => document.querySelector('.sword-scene canvas').width), css: await page.evaluate(() => document.querySelector('.sword-scene canvas').clientWidth) }

const enter = async () => {
  await vrButton.click()
  await wait(async () => await data('xr') === '1' && await data('xr-scene') && await data('xr-buttons'), 'oturum açılışı')
  await waitFrame(3)
}
await enter()
{
  const request = await page.evaluate(() => ({ i: window.__xr.request, u: window.__xr.spaceType }))
  assert.equal(request.i[0].kip, 'immersive-vr'); assert(request.i[0].gesture, 'jest kayboldu'); assert.equal(request.u, 'local-floor')
  const s = await scene(); assert.equal(s.shadow, false, 'VR gölgesi kapanmadı')
  const w = await page.evaluate(() => document.querySelector('.sword-scene canvas').width); assert.equal(w, GEN, 'çizim tamponu XR boyutunda değil')
  assert(await data('xr-info'), 'bilgi paneli çizilmedi')
  for (const id of ['command:master', 'command:fromStart', 'exit', 'command:al']) await button(id)
  assert(await page.locator('.sword-point:not([hidden])').count() === 0)
  await atStation(2.8, -1.75)
  console.log('giriş: immersive-vr + local-floor, jest içinde, gölge kapalı, tampon XR boyutunda, istasyon doğru.')
}

// --- Fiziksel rota ---
await measure('0 Külçe'); await view('0-ingot')
await aim('right', await targetPoint_()); await trigger('right', true); await trigger('right', false); await waitStage(1)
await atStation(-3.1, -1)
console.log('külçe: ışın+tetik.')

await measure('1 Isıtma'); await view('1-heating-phase')
await wait(async () => (await targetPoint_())[0] < -3, 'işaret körüğe geçsin')
await aim('right', await targetPoint_()); await trigger('right', true)
await wait(async () => (await scene()).heat >= 850, 'körükle ısınma'); await trigger('right', false)
await wait(async () => !(await button('command:continue')).passive, 'Örse geç etkin')
await head('command:continue'); await waitStage(2); await atStation(.1, .55)
console.log('ısıtma: körüğe ışın + basılı tetik, panelden örse geçiş.')

await measure('2 Dövme'); await view('2-forging')
{
  await wait(async () => (await data('hammer')) === '1', 'çekiç hazır'); await swordStays()
  const tOnce = await vibration()
  await aim('right', await targetPoint_()); await trigger('right', true); await trigger('right', false)
  await wait(async () => (await data('regions')).split(',').some(Number), 'vuruş namluyu uzatsın')
  await wait(async () => (await vibration()) > tOnce, 'çekiç titreşimi')
  const once = (await data('regions')).split(',').reduce((a, v) => a + Number(v), 0)
  // Hızla indirme: grip iki karede 40 cm aşağı. Işın aynı bölgede kalır.
  await wait(async () => (await data('hammer')) === '1', 'çekiç yeniden hazır')
  await page.evaluate(async () => {
    const k = window.__xr.el.right, b = window.__xr.squares
    for (let i = 0; i < 4; i++) { k.grip.p = [k.grip.p[0], k.grip.p[1] - .4, k.grip.p[2]]; while (window.__xr.squares <= b + i) await new Promise(r => setTimeout(r, 5)) }
    k.grip.p = [k.grip.p[0], 1.1, k.grip.p[2]]
  })
  await wait(async () => (await data('regions')).split(',').reduce((a, v) => a + Number(v), 0) > once, 'hızlı indirme vursun')
  console.log('dövme: ışın+tetik ve hızlı indirme vurdu, titreşim geldi.')
  await head('region:5'); assert.equal((await scene()).selected, 5, 'panel bölge seçmedi')
  await head('command:again'); await atStation(-3.1, -1)
  await pressHold('hold:bellows', async () => (await scene()).heat > 950, 'panelden körük'); await head('command:continue'); await atStation(.1, .55)
  console.log('yeniden ısıtma: ocağa götürür, panelden körük, örse döner.')
  await head('command:master'); await waitStage(3)
}
await atStation(1.95, 1.05)

await measure('3 Su verme'); await view('3-water')
await aim('right', [4, 2.5, 2]); await trigger('right', true); await waitFrame(8); await trigger('right', false)
assert.equal((await scene()).dip, 0, 'boşluğa basmak su vermeyi başlatmamalı')
await aim('right', [1.95, .4, .15]); await trigger('right', true); await waitStage(4); await trigger('right', false)
assert((await scene()).dip >= 1.5); await atStation(3.05, -.45)
console.log('su verme: basılı tetikle tamamlandı.')

await measure('4 Bileme'); await view('4-sharpen')
{
  const u0 = (await scene()).wristU, c0 = (await scene()).skin
  await aim('right', [3.05, 1.1, -1.2]); await trigger('right', true)
  await waitFrame(6)
  await aim('right', [2.95, 1.1, -1.2]); await waitFrame(4)
  const u1 = (await scene()).wristU
  await aim('right', [2.75, 1.1, -1.2]); await waitFrame(6)
  await wait(async () => (await scene()).skin > c0, 'bileme ilerlesin'); await trigger('right', false)
  const s = await scene(); assert(s.wristU > u0 || u1 > u0, `sola gezdirmek temas noktasını ilerletmedi ${u0} ${u1} ${s.wristU}`)
  console.log(`bileme: ışını gezdirmek temas noktasını ${u0} → ${s.wristU} taşıdı, keskinlik ${c0} → ${s.skin}.`)
  await head('command:master'); await waitStage(5)
}
await atStation(2.35, -1.7)

await measure('5 Kuşanma'); await view('5-equip')
{
  const once = Number(await data('attached'))
  await swordStays(); await waitFrame(4)
  // Tutup yerinde bırakmak parçayı takmaz.
  const piece = await targetPoint_()
  await aim('right', piece); await trigger('right', true); await waitFrame(3); await trigger('right', false); await waitFrame(6)
  assert.equal(Number(await data('attached')), once, 'yerinde bırakılan parça oturdu')
  assert((await scene()).message.includes('yaklaşmadı'), 'yaklaşmadı mesajı yok')
  // Tut, kılıçtaki yerine götür, bırak. İşaret taşıma sırasında yeri gösterir.
  await aim('right', piece); await trigger('right', true)
  await wait(async () => { const p = await targetPoint_(); return Math.hypot(p[0] - piece[0], p[1] - piece[1], p[2] - piece[2]) > .1 }, 'işaret yere geçsin')
  const place = await targetPoint_(), r5 = await rig(), diff = local(r5, place).map((v, i) => v - local(r5, piece)[i])
  await page.evaluate(diff => { const k = window.__xr.el.right; k.ray.p = k.ray.p.map((v, i) => v + diff[i]) }, diff); await waitFrame(3)
  await trigger('right', false)
  await wait(async () => Number(await data('attached')) > once, 'götürülen parça otursun')
  assert((await scene()).message.includes('seated')); await page.evaluate(diff => { const k = window.__xr.el.right; k.ray.p = k.ray.p.map((v, i) => v - diff[i]) }, diff)
  // Panel düğmesi yedek olarak kalır.
  const two = Number(await data('attached'))
  await head('command:clink'); await wait(async () => Number(await data('attached')) > two, 'panelden parça takılsın')
  console.log('kuşanma: tut-götür-bırak oturttu, yerinde bırakmak oturtmadı, panel yedeği çalıştı.')
  await head('command:master'); await waitStage(6)
}
await atStation(.42, 1)

await measure('6 İnceleme'); await view('6-inspection')
{
  const y0 = (await scene()).y
  await page.evaluate(() => { window.__xr.sources[0].gamepad.axes[2] = 1 }); await waitFrame(6)
  await page.evaluate(() => { window.__xr.sources[0].gamepad.axes[2] = 0 })
  await wait(async () => (await scene()).y !== y0, 'sağ çubuk çevirsin')
  await head('not:3'); assert((await data('xr-info')).startsWith('Balçak|Kaynak: '), 'parça notu açılmadı'); await view('6-not')
  await head('not:close'); assert((await data('xr-info')).startsWith('Atölye notu|'), 'not kapanmadı')
  console.log('inceleme: sağ çubuk çevirir, parça notu panelde açılıp kapanır.')
  await head('command:continue'); await waitStage(7)
}
await atStation(12, 1.15)

await measure('7 Test'); await view('7-roll')
{
  // Kılıç sağ elde: grip gezince kılıç da gelir.
  const k0 = (await scene()).sword
  await page.evaluate(() => { const k = window.__xr.el.right; k.grip.p = [.3, 1.2, -.4]; k.grip.y = [0, 0, -1] }); await wait(async () => { const a = await scene(); return Math.hypot(a.sword[0] - k0[0], a.sword[1] - k0[1]) > .05 }, 'kılıç eli izlesin')
  const s = await scene(), [r] = [await rig()]
  assert(Math.hypot(s.sword[0] - (r[0] + .3), s.sword[1] - (r[1] + 1.2), s.sword[2] - (r[2] - .4 - .11)) < .04, `kılıç el dışında ${s.sword} ${r}`)
  await view('7-sword-in-hand')
  // Savurma: namlu noktası rulo önünden soldan sağa geçer.
  const swing = (head, step, frame) => page.evaluate(async ({ head, step, frame }) => {
    const k = window.__xr.el.right; k.grip.p = head; const b0 = window.__xr.squares
    while (window.__xr.squares < b0 + 4) await new Promise(r => setTimeout(r, 5))
    for (let i = 0; i < frame; i++) { const b = window.__xr.squares; k.grip.p = k.grip.p.map((v, j) => v + step[j]); while (window.__xr.squares <= b) await new Promise(r => setTimeout(r, 5)) }
    const b = window.__xr.squares; while (window.__xr.squares < b + 4) await new Promise(r => setTimeout(r, 5))
  }, { head, step, frame })
  const tOnce = await vibration()
  await swing([-.6, 1.1, -.4], [.32, 0, 0], 4)
  await wait(async () => Number(await data('detachedOne')) > 0 || (await data('damage')).split(',')[0] > 0, 'savurma ruloya işlesin', 30000)
  assert((await vibration()) > tOnce, 'savurma titreşimi yok')
  console.log('test: kılıç eli izler; savurma ruloyu kesti:', await data('damage'), (await scene()).message)
  await view('7-roll-cut')

  await head('target:1'); await atStation(14, .95); assert.equal((await scene()).target, 1)
  const h1 = (await data('damage')).split(',')[1]
  await swing([0, 1.75, -.35], [0, -.28, 0], 4)
  await wait(async () => (await data('damage')).split(',')[1] !== h1, 'yukarıdan inen savurma kütüğe işlesin', 30000)
  console.log('test: kütüğe yukarıdan savurma işledi:', await data('damage'))
  await page.evaluate(() => { window.__xr.el.right.grip.p = [.3, 1.2, -.4] })

  // Sol elin ışınıyla hedef seçimi.
  await aim('left', [16.15, 1.3, -.1]); await trigger('left', true); await trigger('left', false)
  await wait(async () => (await scene()).target === 2, 'ışınla hedef'); await atStation(16.15, 1)
  // Kılıç eli panele basamaz (iki kumanda varken).
  const h2 = (await scene()).target
  await aim('right', (await button('target:0')).p); await trigger('right', true); await trigger('right', false); await waitFrame(3)
  assert.equal((await scene()).target, h2, 'kılıç eli paneli tetikledi')
  // Yedek düğme.
  await head('command:cutOff')
  await wait(async () => (await data('damage')).split(',')[2] > 0, 'Kes düğmesi kumaşa işlesin', 60000)
  await view('7-cloth')
  await head('command:targets-renew'); await wait(async () => (await data('detachedOne')) === '0', 'hedefler yenilensin')
  console.log('test: ışınla hedef, kılıç eli paneli tetiklemez, Kes düğmesi kumaşa işler, hedefler yenilenir.')
}

// --- Her aşama ustayla bitirilebilir, baştan başlanabilir ---
await head('command:fromStart'); await waitStage(0); await atStation(2.8, -1.75); assert(await button('command:al'))
for (let n = 0; n < 7; n++) { await head('command:master'); await waitStage(n + 1); await wait(async () => !(await button('command:master')).passive, 'usta bitsin'); await waitFrame(4) }
await head('command:master'); await wait(async () => Number(await data('detachedOne')) > 0, 'usta ruloyu kessin')
console.log('usta: 8 aşama panelden tamamlandı, son kesim ruloyu ayırdı.')

// --- Sayfa gizlense de VR kare döngüsü durmaz ---
{
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  const a = await scene(); await waitFrame(8); await head('command:targets-renew'); await wait(async () => (await data('detachedOne')) === '0', 'gizliyken de işlesin')
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  assert(a)
  console.log('gizli sayfa: VR döngüsü sürdü.')
}

// --- Meta düğmesiyle kapanış: sayfa eski hâline döner ---
const validate = async ne => {
  await wait(async () => await data('xr') === null, 'çıkış')
  await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.strikeX, null, { timeout: SURE })
  const c = await page.evaluate(() => { const k = document.querySelector('.sword-scene canvas'); return { w: k.width, css: k.clientWidth } })
  // Yazılımsal çizimde masaüstü uyarlamalı kalitesi piksel oranını düşürebilir: 0 → .8, 1 → .85, 2 → .65.
  const ratio = [.8, .85, .65][Number(await data('quality'))]
  assert.equal(c.css, previous.css); assert(Math.abs(c.w - c.css * ratio) < 2, `${ne}: tampon ${c.w}, beklenen ${c.css * ratio}`)
  await vrButton.waitFor({ timeout: SURE }); assert(await vrButton.isEnabled(), `${ne}: VR'da aç etkin değil`)
}
await page.evaluate(() => window.__xr.session.end())
await validate('Meta çıkışı')
await page.waitForTimeout(800)
await screenshot_desktop('closing-desktop')
// Oyun ekranda sürer: baştan başlanıp kamera başlangıç izdüşümüne döner.
await page.getByRole('button', { name: 'Baştan başla' }).click()
await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.stage === '0', null, { timeout: SURE })
{
  // Kamera sönümlü izler; yazılımsal çizimde yerine oturması uzun sürer.
  await wait(async () => Math.abs(Number(await data('target-x')) - previous.x) < 2 && Math.abs(Number(await data('target-scale')) - previous.o) < 2, `izdüşüm ${previous.x},${previous.o} → ${await data('target-x')},${await data('target-scale')}`, 120000)
  await page.getByRole('button', { name: /^Külçeyi al/ }).click()
  await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.stage === '1', null, { timeout: SURE })
  await page.getByRole('button', { name: 'Baştan başla' }).click()
  await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.stage === '0', null, { timeout: SURE })
  console.log('Meta çıkışı: tampon, izdüşüm ve masaüstü oyun geri döndü.')
}

// --- Başı odada kaymış ve dönmüş kullanıcı, panelden çıkış ---
await page.evaluate(() => { window.__xr.head = { p: [.5, 1.05, -.3], yaw: 1 }; window.__xr.el.left.ray.p = [.1, .9, -.3] })
await enter()
{
  await atStation(2.8, -1.75)
  const r = await rig(); assert(Math.abs(r[1] - .4) < .01, `oturan kullanıcı göz hizasına kalkmadı: ${r[1]}`)
  await head('exit')
  await validate('panelden çıkış')
  console.log("VR'dan çık: panelden kapandı; oturan ve dönmüş kullanıcı istasyona doğru yerleşti.")
}

// --- Rota değişince oturum kapanır, kaynaklar temizlenir ---
await page.evaluate(() => { window.__xr.head = { p: [0, 1.6, 0], yaw: 0 } })
await enter()
{
  const beforeAfter = await page.evaluate(() => window.__xr.ended)
  await page.evaluate(() => document.querySelector('nav[aria-label="Main nav"] a[href="/artifacts"]').click())
  await page.waitForFunction(() => !document.querySelector('.sword-scene canvas'), null, { timeout: 30000 })
  assert.equal(await page.evaluate(() => window.__xr.ended), beforeAfter + 1, 'rota değişince oturum kapanmadı')
  await page.waitForTimeout(500)
  console.log('rota değişimi: oturum kapandı, tuval kaldırıldı.')
}

assert.deepEqual(errors, [])
console.table(measurementOf)
console.log('Kılıç VR oturum akışı başarılı (sahte WebXR; cihaz denemesi değildir). Konsol temiz.')
await browser.close()

async function screenshot_desktop(ad) { await page.evaluate(() => document.querySelector('.sword-scene').scrollIntoView()); await area.screenshot({ path: `test-results/sword-xr-${ad}.png` }) }
