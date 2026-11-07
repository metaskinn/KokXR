// Sword workshop VR session: the real Three.js WebXRManager with a fake WebXR runtime (not a device, not an emulator).
// Head and controller poses are set by hand; screenshots go to test-results/sword-xr-*.png.
// Run: npm run build && npm run preview -- --port 4177 --strictPort, then TEST_URL=http://localhost:4177 node tests/sword-xr-session.mjs
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const TIMEOUT = 240000
mkdirSync('test-results', { recursive: true })
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })

// Fake WebXR injected into the page: the smallest surface three uses.
function fakeXr({ width, height }) {
  const pose = (p, forward) => {
    const l = Math.hypot(...forward), z = forward.map(v => -v / l)
    let x = [z[2], 0, -z[0]] // up × z
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
    head: { p: [0, 1.6, 0], yaw: 0 }, frames: 0, vibration: 0, session: null, ended: 0, request: [],
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
    async requestReferenceSpace(type) { X.spaceType = type; return { type } }
    requestAnimationFrame(cb) { return requestAnimationFrame(t => { if (this.done) return; X.frames++; for (const f of X.planned.splice(0)) f(); if (this.done) return; const k = createFrame(); k.session = this; cb(t, k) }) }
    cancelAnimationFrame(id) { cancelAnimationFrame(id) }
    async end() { if (this.done) throw new DOMException('closed', 'InvalidStateError'); this.done = true; X.ended++; this.dispatchEvent(new Event('end')) }
  }
  window.XRWebGLLayer = class { constructor() { this.framebuffer = null; this.framebufferWidth = width; this.framebufferHeight = height; this.antialias = true; this.fixedFoveation = 0 } getViewport(v) { return { x: v.eye === 'left' ? 0 : width / 2, y: 0, width: width / 2, height: height } } }
  WebGL2RenderingContext.prototype.makeXRCompatible = async function () {}
  window.XRWebGLBinding = undefined
  Object.defineProperty(navigator, 'xr', {
    configurable: true,
    value: {
      isSessionSupported: async k => k === 'immersive-vr',
      requestSession: async (mode, options) => {
        X.request.push({ mode, options, gesture: navigator.userActivation.isActive })
        const s = X.session = new Session()
        X.planned.length = 0
        // Input sources arrive after the session is set up (via an event on a real device too).
        setTimeout(() => {
          const added = ['right', 'left'].map(source); s.inputSources = added; X.sources = added
          const e = new Event('inputsourceschange'); e.added = added; e.removed = []; s.dispatchEvent(e)
        }, 50)
        return s
      },
    },
  })
  const event = (name, el) => { const e = new Event(name); e.inputSource = X.sources.find(k => k.handedness === el); e.frame = createFrame(); e.frame.session = X.session; X.session.dispatchEvent(e) }
  X.trigger = (el, down) => X.planned.push(() => event(down ? 'selectstart' : 'selectend', el))
}

const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
// Software rendering is slow: logic runs at low resolution, screenshots at high resolution with XR_SCREENSHOT=1.
const [XR_WIDTH, XR_HEIGHT] = process.env.XR_SCREENSHOT ? [1400, 700] : [240, 120]
await page.addInitScript(fakeXr, { width: XR_WIDTH, height: XR_HEIGHT })
await page.goto(`${url}/workshops/sword`)
const area = page.locator('.sword-scene')
await page.waitForFunction(() => document.querySelector('.sword-scene')?.dataset.strikeX, null, { timeout: TIMEOUT })
const vrButton = page.getByRole('button', { name: "VR'da aç" })
await vrButton.waitFor({ timeout: TIMEOUT })
await page.locator('.sword-loading').waitFor({ state: 'detached', timeout: TIMEOUT })

const data = name => area.getAttribute(`data-${name}`)
const scene = async () => JSON.parse(await data('xr-scene') ?? '{}')
const waitFrame = (n = 3) => page.evaluate(async n => { const b = window.__xr.frames; while (window.__xr.frames < b + n && !window.__xr.session?.done) await new Promise(r => setTimeout(r, 15)) }, n) // No frames arrive in a closed session
const wait = async (cond, label, ms = 240000) => { const last = Date.now() + ms; while (Date.now() < last) { if (await cond()) return; await page.waitForTimeout(120) } throw new Error(`timeout: ${label}; scene ${await data('xr-scene')}; console ${errors.join(' | ')}; page error ${await page.locator('.sword-xr-error').count()}`) }
const waitStage = (n) => wait(async () => await data('stage') === String(n), `stage ${n}`)
const rig = async () => JSON.parse(await data('xr-rig'))
/** Converts a world point to rig-local space. */
const local = (r, p) => { const dx = p[0] - r[0], dy = p[1] - r[1], dz = p[2] - r[2], c = Math.cos(r[3]), s = Math.sin(r[3]); return [dx * c - dz * s, dy, dx * s + dz * c] }
const aim = async (el, world) => {
  const y = local(await rig(), world)
  await page.evaluate(({ el, y }) => { const k = window.__xr.el[el]; k.ray.y = y.map((v, i) => v - k.ray.p[i]) }, { el, y })
  await waitFrame(2)
}
const trigger = async (el, down) => { await page.evaluate(({ el, down }) => window.__xr.trigger(el, down), { el, down }); await waitFrame(2) }
const button = async id => { const d = JSON.parse(await data('xr-buttons')).find(k => k.id === id); assert(d, `no button: ${id}`); return d }
const pressButton = async (id, el = 'left') => { await aim(el, (await button(id)).p); await trigger(el, true); await trigger(el, false) }
const pressHold = async (id, cond, label, el = 'left') => { await aim(el, (await button(id)).p); await trigger(el, true); await wait(cond, label); await trigger(el, false) }
const targetPoint_ = async () => JSON.parse(await data('xr-marker'))
const headPos = (r, b) => { const c = Math.cos(r[3]), s = Math.sin(r[3]); return [r[0] + b[0] * c + b[2] * s, r[2] - b[0] * s + b[2] * c] }
// Three reports the left-eye pose at frame start: 3.2 cm tolerance.
const atStation = async (x, z) => { await waitFrame(2); const b = await page.evaluate(() => window.__xr.head.p), h = headPos(await rig(), b); assert(Math.hypot(h[0] - x, h[1] - z) < .04, `head ${h} ≠ ${x},${z}`) }
const view = async name => { if (!process.env.XR_SCREENSHOT) return; await waitFrame(3); await page.evaluate(() => document.querySelector('.sword-scene').scrollIntoView()); await area.screenshot({ path: `test-results/sword-xr-${name}.png` }) }
const measurements = []
const measure = async name => { await waitFrame(4); const s = await scene(); measurements.push({ stage: name, drawing: s.drawing, triangle: s.triangle, program: s.program, texture: s.texture, geometry: s.geo }) }
// The sword moves along an arc between stages; aim once it settles in place.
const swordStays = async () => { let previous = ''; await wait(async () => { const k = JSON.stringify((await scene()).sword); const fixed = k === previous; previous = k; await waitFrame(2); return fixed }, 'sword settles') }
const vibration = () => page.evaluate(() => window.__xr.vibration)

// Before: the desktop camera's screen projection (must return to it on exit).
const previous = { x: Number(await data('target-x')), o: Number(await data('target-scale')), w: await page.evaluate(() => document.querySelector('.sword-scene canvas').width), css: await page.evaluate(() => document.querySelector('.sword-scene canvas').clientWidth) }

const enter = async () => {
  await vrButton.click()
  await wait(async () => await data('xr') === '1' && await data('xr-scene') && await data('xr-buttons'), 'session opening')
  await waitFrame(3)
}
await enter()
{
  const request = await page.evaluate(() => ({ i: window.__xr.request, u: window.__xr.spaceType }))
  assert.equal(request.i[0].mode, 'immersive-vr'); assert(request.i[0].gesture, 'gesture lost'); assert.equal(request.u, 'local-floor')
  const s = await scene(); assert.equal(s.shadow, false, 'VR shadows not disabled')
  const w = await page.evaluate(() => document.querySelector('.sword-scene canvas').width); assert.equal(w, XR_WIDTH, 'drawing buffer not at XR size')
  assert(await data('xr-info'), 'info panel not drawn')
  for (const id of ['command:master', 'command:fromStart', 'exit', 'command:al']) await button(id)
  assert(await page.locator('.sword-point:not([hidden])').count() === 0)
  await atStation(2.8, -1.75)
  console.log('entry: immersive-vr + local-floor, within gesture, shadows off, buffer at XR size, station correct.')
}

// --- Physical route ---
await measure('0 Ingot'); await view('0-ingot')
await aim('right', await targetPoint_()); await trigger('right', true); await trigger('right', false); await waitStage(1)
await atStation(-3.1, -1)
console.log('ingot: ray+trigger.')

await measure('1 Heating'); await view('1-heating-phase')
await wait(async () => (await targetPoint_())[0] < -3, 'marker moves to the bellows')
await aim('right', await targetPoint_()); await trigger('right', true)
await wait(async () => (await scene()).heat >= 850, 'heating with bellows'); await trigger('right', false)
await wait(async () => !(await button('command:continue')).passive, '"Örse geç" enabled')
await pressButton('command:continue'); await waitStage(2); await atStation(.1, .55)
console.log('heating: ray at bellows + held trigger, move to anvil from panel.')

await measure('2 Forging'); await view('2-forging')
{
  await wait(async () => (await data('hammer')) === '1', 'hammer ready'); await swordStays()
  const vibrationBefore = await vibration()
  await aim('right', await targetPoint_()); await trigger('right', true); await trigger('right', false)
  await wait(async () => (await data('regions')).split(',').some(Number), 'strike lengthens the blade')
  await wait(async () => (await vibration()) > vibrationBefore, 'hammer vibration')
  const before = (await data('regions')).split(',').reduce((a, v) => a + Number(v), 0)
  // Fast downswing: grip drops 40 cm over two frames. The ray stays on the same region.
  await wait(async () => (await data('hammer')) === '1', 'hammer ready again')
  await page.evaluate(async () => {
    const k = window.__xr.el.right, b = window.__xr.frames
    for (let i = 0; i < 4; i++) { k.grip.p = [k.grip.p[0], k.grip.p[1] - .4, k.grip.p[2]]; while (window.__xr.frames <= b + i) await new Promise(r => setTimeout(r, 5)) }
    k.grip.p = [k.grip.p[0], 1.1, k.grip.p[2]]
  })
  await wait(async () => (await data('regions')).split(',').reduce((a, v) => a + Number(v), 0) > before, 'fast downswing strikes')
  console.log('forging: ray+trigger and fast downswing struck, vibration received.')
  await pressButton('region:5'); assert.equal((await scene()).selected, 5, 'panel did not select the region')
  await pressButton('command:again'); await atStation(-3.1, -1)
  await pressHold('hold:bellows', async () => (await scene()).heat > 950, 'bellows from panel'); await pressButton('command:continue'); await atStation(.1, .55)
  console.log('reheat: goes to the forge, bellows from panel, back to the anvil.')
  await pressButton('command:master'); await waitStage(3)
}
await atStation(1.95, 1.05)

await measure('3 Quenching'); await view('3-water')
await aim('right', [4, 2.5, 2]); await trigger('right', true); await waitFrame(8); await trigger('right', false)
assert.equal((await scene()).dip, 0, 'pressing on empty space must not start quenching')
await aim('right', [1.95, .4, .15]); await trigger('right', true); await waitStage(4); await trigger('right', false)
assert((await scene()).dip >= 1.5); await atStation(3.05, -.45)
console.log('quenching: completed with held trigger.')

await measure('4 Sharpening'); await view('4-sharpen')
{
  const u0 = (await scene()).wristU, c0 = (await scene()).skin
  await aim('right', [3.05, 1.1, -1.2]); await trigger('right', true)
  await waitFrame(6)
  await aim('right', [2.95, 1.1, -1.2]); await waitFrame(4)
  const u1 = (await scene()).wristU
  await aim('right', [2.75, 1.1, -1.2]); await waitFrame(6)
  await wait(async () => (await scene()).skin > c0, 'sharpening progresses'); await trigger('right', false)
  const s = await scene(); assert(s.wristU > u0 || u1 > u0, `moving left did not advance the contact point ${u0} ${u1} ${s.wristU}`)
  console.log(`sharpening: sweeping the ray moved the contact point ${u0} → ${s.wristU}, sharpness ${c0} → ${s.skin}.`)
  await pressButton('command:master'); await waitStage(5)
}
await atStation(2.35, -1.7)

await measure('5 Assembly'); await view('5-equip')
{
  const before = Number(await data('attached'))
  await swordStays(); await waitFrame(4)
  // Grabbing and releasing in place does not attach the piece.
  const piece = await targetPoint_()
  await aim('right', piece); await trigger('right', true); await waitFrame(3); await trigger('right', false); await waitFrame(6)
  assert.equal(Number(await data('attached')), before, 'piece released in place got attached')
  assert((await scene()).message.includes('yaklaşmadı'), '"yaklaşmadı" message missing')
  // Grab, carry to its spot on the sword, release. The marker shows the spot while carrying.
  await aim('right', piece); await trigger('right', true)
  await wait(async () => { const p = await targetPoint_(); return Math.hypot(p[0] - piece[0], p[1] - piece[1], p[2] - piece[2]) > .1 }, 'marker moves to the spot')
  const place = await targetPoint_(), r5 = await rig(), diff = local(r5, place).map((v, i) => v - local(r5, piece)[i])
  await page.evaluate(diff => { const k = window.__xr.el.right; k.ray.p = k.ray.p.map((v, i) => v + diff[i]) }, diff); await waitFrame(3)
  await trigger('right', false)
  await wait(async () => Number(await data('attached')) > before, 'carried piece attaches')
  assert((await scene()).message.includes('seated')); await page.evaluate(diff => { const k = window.__xr.el.right; k.ray.p = k.ray.p.map((v, i) => v - diff[i]) }, diff)
  // The panel button remains as a fallback.
  const two = Number(await data('attached'))
  await pressButton('command:clink'); await wait(async () => Number(await data('attached')) > two, 'piece attached from panel')
  console.log('assembly: grab-carry-release attached, releasing in place did not, panel fallback worked.')
  await pressButton('command:master'); await waitStage(6)
}
await atStation(.42, 1)

await measure('6 Inspection'); await view('6-inspection')
{
  const y0 = (await scene()).y
  await page.evaluate(() => { window.__xr.sources[0].gamepad.axes[2] = 1 }); await waitFrame(6)
  await page.evaluate(() => { window.__xr.sources[0].gamepad.axes[2] = 0 })
  await wait(async () => (await scene()).y !== y0, 'right stick rotates')
  await pressButton('not:3'); assert((await data('xr-info')).startsWith('Balçak|Kaynak: '), 'part note did not open'); await view('6-not')
  await pressButton('not:close'); assert((await data('xr-info')).startsWith('Atölye notu|'), 'note did not close')
  console.log('inspection: right stick rotates, part note opens and closes in the panel.')
  await pressButton('command:continue'); await waitStage(7)
}
await atStation(12, 1.15)

await measure('7 Test'); await view('7-roll')
{
  // Sword in the right hand: when the grip moves, the sword follows.
  const k0 = (await scene()).sword
  await page.evaluate(() => { const k = window.__xr.el.right; k.grip.p = [.3, 1.2, -.4]; k.grip.y = [0, 0, -1] }); await wait(async () => { const a = await scene(); return Math.hypot(a.sword[0] - k0[0], a.sword[1] - k0[1]) > .05 }, 'sword follows the handesin')
  const s = await scene(), [r] = [await rig()]
  assert(Math.hypot(s.sword[0] - (r[0] + .3), s.sword[1] - (r[1] + 1.2), s.sword[2] - (r[2] - .4 - .11)) < .04, `sword outside the hand ${s.sword} ${r}`)
  await view('7-sword-in-hand')
  // Swing: the blade point passes in front of the roll from left to right.
  const swing = (start, step, frame) => page.evaluate(async ({ start, step, frame }) => {
    const k = window.__xr.el.right; k.grip.p = start; const b0 = window.__xr.frames
    while (window.__xr.frames < b0 + 4) await new Promise(r => setTimeout(r, 5))
    for (let i = 0; i < frame; i++) { const b = window.__xr.frames; k.grip.p = k.grip.p.map((v, j) => v + step[j]); while (window.__xr.frames <= b) await new Promise(r => setTimeout(r, 5)) }
    const b = window.__xr.frames; while (window.__xr.frames < b + 4) await new Promise(r => setTimeout(r, 5))
  }, { start, step, frame })
  const vibrationBefore = await vibration()
  await swing([-.6, 1.1, -.4], [.32, 0, 0], 4)
  await wait(async () => Number(await data('detachedOne')) > 0 || (await data('damage')).split(',')[0] > 0, 'swing cuts the roll', 30000)
  assert((await vibration()) > vibrationBefore, 'no swing vibration')
  console.log('test: sword follows the hand; swing cut the roll:', await data('damage'), (await scene()).message)
  await view('7-roll-cut')

  await pressButton('target:1'); await atStation(14, .95); assert.equal((await scene()).target, 1)
  const h1 = (await data('damage')).split(',')[1]
  await swing([0, 1.75, -.35], [0, -.28, 0], 4)
  await wait(async () => (await data('damage')).split(',')[1] !== h1, 'downward swing cuts the log', 30000)
  console.log('test: downward swing cut the log:', await data('damage'))
  await page.evaluate(() => { window.__xr.el.right.grip.p = [.3, 1.2, -.4] })

  // Target selection with the left hand's ray.
  await aim('left', [16.15, 1.3, -.1]); await trigger('left', true); await trigger('left', false)
  await wait(async () => (await scene()).target === 2, 'target via ray'); await atStation(16.15, 1)
  // The sword hand cannot press the panel (with two controllers).
  const h2 = (await scene()).target
  await aim('right', (await button('target:0')).p); await trigger('right', true); await trigger('right', false); await waitFrame(3)
  assert.equal((await scene()).target, h2, 'sword hand triggered the panel')
  // Fallback button.
  await pressButton('command:cutOff')
  await wait(async () => (await data('damage')).split(',')[2] > 0, '"Kes" button cuts the cloth', 60000)
  await view('7-cloth')
  await pressButton('command:targets-renew'); await wait(async () => (await data('detachedOne')) === '0', 'targets renewed')
  console.log('test: target via ray, sword hand does not trigger the panel, "Kes" button cuts the cloth, targets renewed.')
}

// --- Every stage can be finished by the master, and restarted ---
await pressButton('command:fromStart'); await waitStage(0); await atStation(2.8, -1.75); assert(await button('command:al'))
for (let n = 0; n < 7; n++) { await pressButton('command:master'); await waitStage(n + 1); await wait(async () => !(await button('command:master')).passive, 'master finishes'); await waitFrame(4) }
await pressButton('command:master'); await wait(async () => Number(await data('detachedOne')) > 0, 'master cuts the roll')
console.log('master: 8 stages completed from the panel, the final cut split the roll.')

// --- The VR frame loop keeps running even when the page is hidden ---
{
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  const a = await scene(); await waitFrame(8); await pressButton('command:targets-renew'); await wait(async () => (await data('detachedOne')) === '0', 'works while hidden too')
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  assert(a)
  console.log('hidden page: VR loop continued.')
}

// --- Closing with the Meta button: the page returns to its previous state ---
const validate = async label => {
  await wait(async () => await data('xr') === null, 'exit')
  await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.strikeX, null, { timeout: TIMEOUT })
  const c = await page.evaluate(() => { const k = document.querySelector('.sword-scene canvas'); return { w: k.width, css: k.clientWidth } })
  // Under software rendering the desktop adaptive quality may lower the pixel ratio: 0 → .8, 1 → .85, 2 → .65.
  const ratio = [.8, .85, .65][Number(await data('quality'))]
  assert.equal(c.css, previous.css); assert(Math.abs(c.w - c.css * ratio) < 2, `${label}: buffer ${c.w}, expected ${c.css * ratio}`)
  await vrButton.waitFor({ timeout: TIMEOUT }); assert(await vrButton.isEnabled(), `${label}: "VR'da aç" not enabled`)
}
await page.evaluate(() => window.__xr.session.end())
await validate('Meta exit')
await page.waitForTimeout(800)
await screenshot_desktop('closing-desktop')
// The game continues on screen: after restarting the camera returns to its initial projection.
await page.getByRole('button', { name: 'Baştan başla' }).click()
await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.stage === '0', null, { timeout: TIMEOUT })
{
  // The camera follows with damping; under software rendering it takes long to settle.
  await wait(async () => Math.abs(Number(await data('target-x')) - previous.x) < 2 && Math.abs(Number(await data('target-scale')) - previous.o) < 2, `projection ${previous.x},${previous.o} → ${await data('target-x')},${await data('target-scale')}`, 120000)
  await page.getByRole('button', { name: /^Külçeyi al/ }).click()
  await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.stage === '1', null, { timeout: TIMEOUT })
  await page.getByRole('button', { name: 'Baştan başla' }).click()
  await page.waitForFunction(() => document.querySelector('.sword-scene').dataset.stage === '0', null, { timeout: TIMEOUT })
  console.log('Meta exit: buffer, projection and desktop game restored.')
}

// --- User with head shifted and turned in the room, exit from panel ---
await page.evaluate(() => { window.__xr.head = { p: [.5, 1.05, -.3], yaw: 1 }; window.__xr.el.left.ray.p = [.1, .9, -.3] })
await enter()
{
  await atStation(2.8, -1.75)
  const r = await rig(); assert(Math.abs(r[1] - .4) < .01, `seated user not raised to eye level: ${r[1]}`)
  await pressButton('exit')
  await validate('exit from panel')
  console.log('"VR\'dan çık": closed from the panel; seated and turned user placed correctly at the station.')
}

// --- On route change the session closes and resources are cleaned up ---
await page.evaluate(() => { window.__xr.head = { p: [0, 1.6, 0], yaw: 0 } })
await enter()
{
  const beforeAfter = await page.evaluate(() => window.__xr.ended)
  await page.evaluate(() => document.querySelector('nav[aria-label="Ana gezinme"] a[href="/artifacts"]').click())
  await page.waitForFunction(() => !document.querySelector('.sword-scene canvas'), null, { timeout: 30000 })
  assert.equal(await page.evaluate(() => window.__xr.ended), beforeAfter + 1, 'session did not close on route change')
  await page.waitForTimeout(500)
  console.log('route change: session closed, canvas removed.')
}

assert.deepEqual(errors, [])
console.table(measurements)
console.log('Sword VR session flow passed (fake WebXR; not a device test). Console clean.')
await browser.close()

async function screenshot_desktop(name) { await page.evaluate(() => document.querySelector('.sword-scene').scrollIntoView()); await area.screenshot({ path: `test-results/sword-xr-${name}.png` }) }
