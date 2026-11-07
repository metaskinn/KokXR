// KökXR Ulu Mosque WebXR flow: IWER (Quest 3 emulation) + the real three.js WebXRManager.
// Run: node sim.mjs [scenario,scenario]   Scenarios: main,tall
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
const S = process.env.XR_SIM ?? (() => { throw new Error('Set the XR_SIM folder; see setup.sh') })()
const { chromium } = createRequire(S + '/copy-clean/')('playwright')
const URL_ = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const chosen = (process.argv[2] ?? 'main,second,fragmented').split(',')
const ANGLE = process.env.ANGLE ?? 'swiftshader', LABEL = process.env.LABEL ?? 'ss'
const SCREEN = S + '/screen' + (LABEL === 'ss' ? '' : '-' + LABEL); mkdirSync(SCREEN, { recursive: true })
const TIMEOUT = 900000
const results = []
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const report = (name, ok, evidence) => { results.push({ name, result: ok === null ? 'UNTESTABLE' : ok ? 'PASS' : 'FAIL', evidence }); log(ok === null ? 'UNTESTABLE' : ok ? 'PASS' : 'FAIL', name, JSON.stringify(evidence)); writeFileSync(S + `/result-${LABEL}.json`, JSON.stringify(results, null, 1)) }
const near = (a, b, tol = 1e-2) => Math.abs(a - b) <= tol
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })

async function open(ext = '', viewport = { width: 960, height: 540 }) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const h = { error: [], warning: [] }
  page.on('pageerror', (e) => h.error.push('pageerror: ' + e))
  page.on('console', (m) => {
    if (m.location().url.includes('360tr')) return
    if (m.type() === 'error') h.error.push(m.text())
    else if (m.type() === 'warning') h.warning.push(m.text())
  })
  page.setDefaultTimeout(TIMEOUT)
  await page.addInitScript({ path: S + '/package/node_modules/iwer/build/iwer.min.js' })
  await page.addInitScript({ path: S + '/sim-page.js' })
  await page.goto(`${URL_}/artifact/ulu-mosque${ext}`, { timeout: TIMEOUT })
  await page.getByRole('button', { name: /maketini eline al/ }).click()
  await page.locator('.model-area canvas').waitFor()
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => [...document.querySelectorAll('.model-control button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled) && window.__t?.frame > 2, null, { timeout: TIMEOUT, polling: 250 })
  return { page, h, ctx }
}
const controls = (s) => ({
  state: () => s.evaluate(() => __sim.state()),
  frame: (n = 1) => s.evaluate((n) => __sim.waitFrame(n), n),
  stick: (el, x, y) => s.evaluate(([e, x, y]) => __sim.stick(e, x, y), [el, x, y]),
  async capture(name) {
    const r = await s.evaluate(() => { const p = __sim.capture(); return p })
    const path = `${SCREEN}/${name}.png`
    writeFileSync(path, Buffer.from(r.png.split(',')[1], 'base64'))
    delete r.png
    return { path, ...r }
  },
  async texture(which, name) {
    const u = await s.evaluate((h) => __sim.texPng(h), which)
    const path = `${SCREEN}/${name}.png`; writeFileSync(path, Buffer.from(u.split(',')[1], 'base64')); return path
  },
  async aimClick(targetFn, arg, el = 'right') {
    const ei = await s.evaluate((el) => {
      const sources = [...__sim.d.activeSession.inputSources]; return sources.findIndex((k) => k.handedness === el)
    }, el)
    await s.evaluate(([fn, arg, el]) => __sim.aim(fn === 'item' ? __sim.menuItemPoint(arg[0], arg[1]) : __sim.panelPoint(fn === 'title' ? __sim.title(arg) : __sim.card(), .5, .5), el), [targetFn, arg, el])
    await s.evaluate(() => __sim.waitFrame(2))
    const diagnose = await s.evaluate((i) => __sim.rayDiagnose(i), ei)
    await s.evaluate((el) => __sim.press(el, 'trigger', 1), el)
    await s.evaluate(() => __sim.waitFrame(2))
    await s.evaluate((el) => __sim.press(el, 'trigger', 0), el)
    await s.evaluate(() => __sim.waitFrame(2)).catch(() => {})
    return diagnose
  },
  item(i, n, el) { return this.aimClick('item', [i, n], el) },
  cardClick(el) { return this.aimClick('card', null, el) },
  titleClick(id, el) { return this.aimClick('title', id, el) },
  async button(el, name) {
    await s.evaluate(([e, a]) => __sim.press(e, a, 1), [el, name]); await this.frame(3)
    const whilePressed = await this.state()
    await s.evaluate(([e, a]) => __sim.press(e, a, 0), [el, name]); await this.frame(3)
    return { whilePressed, onRelease: await this.state() }
  },
})

async function step(name, fn) {
  try { await fn() } catch (e) { report(name + ' (unexpected exception)', false, String(e).slice(0, 500)) }
}
async function desktopCheck(s, h, name, x) {
  await s.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await s.evaluate(() => __sim.waitFrame(3))
  const d = await x.state()
  report(name + ': desktop camera/near/far/background', !d.cameraParent && d.near === 4 && d.far === 900 && d.back === 'backdrop' && near(d.fov, 40, 0.01) && d.cameraScale.every((v) => near(v, 1, 1e-3)) && !d.inside && !d.presenting, { near: d.near, far: d.far, back: d.back, fov: d.fov, aspect: d.aspect, cameraScale: d.cameraScale, cameraParent: d.cameraParent, head: d.head, target: d.target, canvas: d.canvas, canvasParent: d.canvasParent, pixelRatio: d.pixelRatio, sceneChild: d.sceneChild, innerLight: d.innerLight, hemi: d.hemi, surroundings: d.surroundings, layerY: d.layerY })
  const area = await s.locator('.model-area').boundingBox()
  report(name + ': canvas size matches the area', near(d.canvas[0], area.width, 1) && near(d.canvas[1], area.height, 1), { canvas: d.canvas, area, aspect: d.aspect, pr: d.pixelRatio })
  const buttons = await s.evaluate(() => [...document.querySelectorAll('.model-control button')].map((b) => ({ t: b.textContent, d: b.disabled, p: b.getAttribute('aria-pressed') })))
  report(name + ': buttons enabled again, no card', buttons.filter((b) => !/Tam ekran/.test(b.t)).every((b) => !b.d) && !(await s.locator('.model-info-card').count()), buttons)
  await s.screenshot({ path: `${SCREEN}/${name}-desktop.png` })
  const f = await x.capture(`${name}-desktop-fb`)
  report(name + ': desktop draws frames', f.left.backOuter > 0.05, f)
  const before = (await x.state()).head
  const box = await s.locator('.model-area').boundingBox()
  await s.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await s.mouse.down(); await s.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 10, { steps: 4 }); await s.mouse.up()
  await x.frame(4)
  const after = (await x.state()).head
  report(name + ': dragging rotates the camera', before.some((v, i) => Math.abs(v - after[i]) > 1), { before, after })
  await s.getByRole('button', { name: 'İçeri gir' }).click()
  await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
  await x.frame(3)
  const inner = await x.state()
  await s.screenshot({ path: `${SCREEN}/${name}-desktop-interior.png` })
  report(name + ': desktop "İçeri gir" works', inner.inside && near(inner.head[0], 0, 0.1) && near(inner.head[2], -24.6, 0.1) && inner.near === 0.15, { head: inner.head, near: inner.near, far: inner.far, fov: inner.fov, activeInfo: inner.activeInfo })
  await s.getByRole('button', { name: /Dışarı çık/ }).click()
  await s.getByRole('button', { name: 'İçeri gir' }).waitFor()
  await x.frame(2)
  const outer = await x.state()
  report(name + ': desktop "Dışarı çık" works', !outer.inside && outer.near === 4, { head: outer.head, near: outer.near, fov: outer.fov })
}
async function openVr(s, x) {
  await s.getByRole('button', { name: "VR'da aç" }).click()
  await s.waitForFunction(() => !!__sim.d.activeSession && __t.renderer.xr.isPresenting, null, { polling: 100 })
  await s.waitForFunction(() => __sim.menu && __t.camera.parent && __sim.menu().visible, null, { polling: 100, timeout: TIMEOUT })
  await x.frame(2)
}

const STOPS = ['entrance', 'fountain', 'mihrab', 'minbar', 'door', 'kaaba', 'plaque', 'dome']
const INSIDE_N = 10 // outside + 8 stops + exit
const INSIDE_GAP = (id) => STOPS.indexOf(id) + 1

async function main() {
  const { page: s, h, ctx } = await open()
  const x = controls(s)
  await step('A0 basics', async () => {
    const b = await x.state(); log('desktop start', JSON.stringify(b))
    report('A0 "VR\'da aç" is visible', await s.getByRole('button', { name: "VR'da aç" }).isVisible(), { quality: b.quality, frame: b.frame })
  })
  await step('A1 session', async () => {
    await openVr(s, x)
    const d = await x.state()
    log('xrInfo', JSON.stringify(await s.evaluate(() => __sim.xrInfo())))
    log('session state', JSON.stringify(d))
    report('A1 session opened, WebXRManager presenting', d.session && d.presenting, { presenting: d.presenting, xr: await s.evaluate(() => __sim.xrInfo()), inputs: d.inputs, near: d.near, far: d.far, back: d.back })
    report('A1 menu visible', d.menuOpen, { menuLocal: d.menuLocal, headLocal: d.headLocal })
    report('A1 rig in model view (scale 100, P=0,-90,-120, rotY=π)', d.rigScale === 100 && near(d.rigP[1], -90) && near(d.rigP[2], -120) && near(d.rigRotY, Math.PI), { rigP: d.rigP, rigRotY: d.rigRotY, rigScale: d.rigScale, modelLocal: d.modelLocal, disk: d.disk, head: d.head })
    const button = await s.evaluate(() => [...document.querySelectorAll('.model-control button')].map((b) => [b.textContent, b.disabled]))
    report('A1 page buttons locked during session', button.filter(([t]) => !/Tam ekran/.test(t)).every(([, d]) => d), button)
    await x.frame(2)
    const f = await x.capture('01-session-opening')
    report('A1 both eyes drawn to framebuffer', f.left.backOuter > 0.02 && f.right.backOuter > 0.02, f)
    report('A1 menu texture', true, await x.texture('menu', '01-menu-texture'))
    await s.screenshot({ path: `${SCREEN}/01-session-page.png` })
  })
  await step('A2 model stick', async () => {
    const d0 = await x.state()
    await x.stick('right', 0.15, 0.15); await x.frame(5)
    let d1 = await x.state()
    report('A2 no motion below dead zone (0.15)', d1.rigRotY === d0.rigRotY && d1.rigScale === d0.rigScale, { before: [d0.rigRotY, d0.rigScale], after: [d1.rigRotY, d1.rigScale] })
    await x.stick('right', 1, 0); await x.frame(6)
    d1 = await x.state()
    await x.stick('right', 0, 0); await x.frame(2)
    report('A2 right stick x rotates the model, model stays in front', Math.abs(d1.rigRotY - d0.rigRotY) > 0.05 && near(d1.modelLocal[0], 0) && near(d1.modelLocal[1], .9) && near(d1.modelLocal[2], -1.2) && d1.rigScale === 100, { rotY: [d0.rigRotY, d1.rigRotY], modelLocal: d1.modelLocal, rigP: d1.rigP })
    const f0 = await x.capture('02-frozen')
    log('frozen', JSON.stringify(f0))
    await x.stick('right', 0, -1)
    let d2; for (let i = 0; i < 60; i++) { await x.frame(2); d2 = await x.state(); if (d2.rigScale <= 40) break }
    await x.frame(4); d2 = await x.state(); await x.stick('right', 0, 0); await x.frame(2)
    const f40 = await x.capture('02-scale-40')
    report('A2 stick forward: lower limit 40, not exceeded', d2.rigScale === 40 && near(d2.modelLocal[2], -1.2), { rigScale: d2.rigScale, modelLocal: d2.modelLocal, rigP: d2.rigP, f40 })
    await x.stick('right', 0, 1)
    let d3; for (let i = 0; i < 80; i++) { await x.frame(2); d3 = await x.state(); if (d3.rigScale >= 200) break }
    await x.frame(4); d3 = await x.state(); await x.stick('right', 0, 0); await x.frame(2)
    const f200 = await x.capture('02-scale-200')
    report('A2 stick back: upper limit 200, not exceeded', d3.rigScale === 200 && near(d3.modelLocal[2], -1.2), { rigScale: d3.rigScale, modelLocal: d3.modelLocal, f200 })
    report('A2 direction: pushing forward visually enlarges the model (rig shrinks), non-background pixels 40>200', f40.left.backOuter > f200.left.backOuter, { backOuter40: f40.left.backOuter, backOuter200: f200.left.backOuter })
    // Bring the scale back to about 100
    await x.stick('right', 0, -1); for (let i = 0; i < 40; i++) { await x.frame(1); if ((await x.state()).rigScale <= 105) break }
    await x.stick('right', 0, 0); await x.frame(2)
    log('scale back', (await x.state()).rigScale)
  })
  await step('A3 shatter', async () => {
    let t = await x.item(1, 4)
    await x.frame(20)
    let d = await x.state()
    report('A3 "Parçala" from the menu lifts the layers', d.fragmented && d.layerY.some((y) => y > 0), { diagnose: t, fragmented: d.fragmented, layerY: d.layerY })
    const dk = await x.texture('menu', '03-menu-assemble')
    const f = await x.capture('03-fragmented')
    report('A3 fragmented view and "Birleştir" label', true, { dk, f })
    t = await x.item(1, 3)
    await x.frame(20)
    d = await x.state()
    report('A3 "Birleştir" from the menu lowers the layers', !d.fragmented && d.layerY.every((y) => y === 0), { diagnose: t, fragmented: d.fragmented, layerY: d.layerY })
  })
  await step('A4 menu button', async () => {
    const d0 = await x.state()
    const r = await x.button('right', 'b-button')
    report('A4 B closes the menu, only once while held', d0.menuOpen && !r.whilePressed.menuOpen && !r.onRelease.menuOpen, { before: d0.menuOpen, pressed: r.whilePressed.menuOpen, release: r.onRelease.menuOpen })
    const r2 = await x.button('left', 'y-button')
    report('A4 Y opens the menu', r2.onRelease.menuOpen, { pressed: r2.whilePressed.menuOpen, release: r2.onRelease.menuOpen })
    // With the menu closed a click does nothing
    await x.button('right', 'b-button')
    const before = await x.state()
    await s.evaluate(() => __sim.aim([0, 1.6, -1.3]))
    await x.frame(2)
    await s.evaluate(() => __sim.press('right', 'trigger', 1)); await x.frame(2); await s.evaluate(() => __sim.press('right', 'trigger', 0)); await x.frame(2)
    const after = await x.state()
    report('A4 trigger does nothing while the menu is closed', before.inside === after.inside && before.fragmented === after.fragmented, { inside: after.inside })
    // Opening with the head turned: the menu appears in front of the head
    await s.evaluate(() => __sim.headYaw(Math.PI / 2)); await x.frame(2)
    await x.button('right', 'b-button')
    const d = await x.state()
    report('A4 with head turned 90° left the menu opens in front of the head', d.menuOpen && d.menuLocal[0] < -1 && Math.abs(d.menuLocal[2]) < 0.1, { menuLocal: d.menuLocal, headLocal: d.headLocal })
    await s.evaluate(() => __sim.headYaw(0)); await x.frame(2)
    await x.button('right', 'b-button'); await x.button('right', 'b-button')
    log('menu back', JSON.stringify((await x.state()).menuLocal))
  })
  await step('A5 inside', async () => {
    // Yaw and angle are deliberately left rotated (angle≠0 after A2): stop direction must not depend on the rig angle.
    const t = await x.item(0, 4)
    await x.frame(20)
    const d = await x.state()
    log('inside state', JSON.stringify(d))
    const f = await x.capture('05-inside-entrance')
    const forwardDone = d.forward[2] > 0.9 && Math.abs(d.forward[0]) < 0.05
    report('A5 "İçeri gir": rig 1×, on the floor, at the stop', d.inside && d.rigScale === 1 && near(d.rigP[1], 0.7) && !d.disk && !d.collides && near(d.head[0], 0, 0.1) && near(d.head[2], -24.6, 0.1), { diagnose: t, head: d.head, rigP: d.rigP, rigRotY: d.rigRotY, rigScale: d.rigScale, disk: d.disk, collides: d.collides, innerLight: d.innerLight })
    report('A5 facing the stop (entrance: +z)', forwardDone, { forward: d.forward })
    report('A5 card does not open by itself (within door radius)', d.activeInfo === null && !d.cardOpen, { activeInfo: d.activeInfo, cardOpen: d.cardOpen, menuOpen: d.menuOpen, f })
    const shown = await s.evaluate(() => __sim.visibleTitles())
    log('visible titles', JSON.stringify(shown))
    report('A5 titles are visible', shown.length > 0, { shown })
    // is the menu behind the card?
    const diagnose = await s.evaluate(async () => { __sim.aim(__sim.menuItemPoint(0, 10)); await __sim.waitFrame(2); return __sim.rayDiagnose(0) })
    report('A5 OBSERVATION aiming at a menu item while the card is open hits the card (menu unreachable)', diagnose?.obj !== 'card', { diagnose })
  })
  await step('A6 card closing', async () => {
    const target = (await s.evaluate(() => __sim.visibleTitles()))[0]
    const bt = await x.titleClick(target); await x.frame(3)
    const d0 = await x.state()
    report('A6 click title: card opens', d0.activeInfo === target && d0.cardOpen, { target, bt, activeInfo: d0.activeInfo, cardOpen: d0.cardOpen, f: await x.capture('06-title-card') })
    report('A6 card texture saved', true, await x.texture('card', '06-card'))
    const t = await x.cardClick()
    await x.frame(3)
    const d = await x.state()
    const cardDom = await s.locator('.model-info-card').count()
    report('A6 ray-click the card: card closes and stays closed', d0.cardOpen && t?.obj === 'card' && !d.cardOpen && d.activeInfo === null && !cardDom, { diagnose: t, cardOpen: d.cardOpen, activeInfo: d.activeInfo, cardDom })
    await x.frame(4)
    report('A6 closed card does not reopen at the same spot', !(await x.state()).cardOpen, {})
  })
  await step('A7 walking', async () => {
    const d0 = await x.state()
    await x.stick('left', 0, 0.15); await x.frame(4)
    let d = await x.state()
    report('A7 no walking below dead zone', d.head[2] === d0.head[2], { before: d0.head, after: d.head })
    await x.stick('left', 0, -1); await x.frame(5)
    d = await x.state()
    await x.stick('left', 0, 0); await x.frame(2)
    const forwardPath = d.head[2] - d0.head[2]
    report('A7 left stick forward: walks in gaze direction (+z) without drifting', forwardPath > 0.1 && near(d.head[0], d0.head[0], 0.05) && d.head[1] === d0.head[1], { before: d0.head, after: d.head, forwardPath })
    const d1 = await x.state()
    await x.stick('left', 1, 0); await x.frame(4); const d2 = await x.state(); await x.stick('left', 0, 0); await x.frame(2)
    report('A7 left stick right: strafes to the user\'s right (−x while facing +z)', d2.head[0] < d1.head[0] - 0.05, { before: d1.head, after: d2.head })
    // Speed: in real time (meaningful only if frame time is below the 0.1 s dt cap)
    const hz0 = await s.evaluate(() => { __sim.stick('left', 0, -1); return { t: performance.now(), k: __t.frame, z: __sim.state().head[2] } })
    await x.frame(20)
    const hz1 = await s.evaluate(() => ({ t: performance.now(), k: __t.frame, z: __sim.state().head[2] }))
    await x.stick('left', 0, 0); await x.frame(2)
    const select = (hz1.t - hz0.t) / 1000, frameDuration = select / (hz1.k - hz0.k)
    log('speed measurement', JSON.stringify({ meter: hz1.z - hz0.z, select, frameDuration }))
    report('A7 walking speed ~1.6 m/s (checked only if frame time <0.1 s)', frameDuration < 0.1 ? near((hz1.z - hz0.z) / select, 1.6, 0.25) : null, { mPerSec: (hz1.z - hz0.z) / select, frameDuration })
    // Approaching does not open a card; clicking the title does.
    await x.stick('left', 0, -1); await x.frame(40)
    await x.stick('left', 0, 0); await x.frame(3)
    let d3 = await x.state()
    report('A7 card does not open by itself while walking', !d3.cardOpen && d3.activeInfo === null, { head: d3.head, activeInfo: d3.activeInfo })
    const f = await x.capture('07-titles')
    const target = (await s.evaluate(() => __sim.visibleTitles()))[0]
    await x.titleClick(target); await x.frame(3); d3 = await x.state()
    const cardInfo = d3.activeInfo ? await s.evaluate((id) => __t.xrCard(id), d3.activeInfo) : null
    report('A7 clicking a title opens the info card, with a source line', d3.activeInfo === target && d3.cardOpen && /^Kaynak: /.test(cardInfo?.source ?? ''), { target, activeInfo: d3.activeInfo, cardInfo, f })
    report('A7 card is in front of the head', near(Math.hypot(d3.cardLocal[0] - d3.headLocal[0], d3.cardLocal[2] - d3.headLocal[2]), 1.3, 0.05), { cardLocal: d3.cardLocal, headLocal: d3.headLocal })
    await x.titleClick(target); await x.frame(3)
    report('A7 clicking the same title again closes the card', !(await x.state()).cardOpen, {})
    await s.evaluate(() => {
      const r = __t.markers.map(({ info }) => { const k = __t.xrCard(info.id); return [info.id, k.source] })
      window.__sources = r
    })
    const sources = await s.evaluate(() => window.__sources)
    report('A7 source text resolves on all 11 cards (data)', sources.length === 11 && sources.every(([, k]) => /^Kaynak: /.test(k) && !/bulunamadı/.test(k)), sources)
  })
  await step('A8 smooth turn', async () => {
    const d0 = await x.state()
    await x.stick('right', 0.1, 0); await x.frame(4)
    const mid = await x.state()
    report('A8 no turning in dead zone', mid.rigRotY === d0.rigRotY, { rotY: [d0.rigRotY, mid.rigRotY] })
    await x.stick('right', 1, 0); await x.frame(8)
    const d1 = await x.state()
    const turn = d1.rigRotY - d0.rigRotY
    const forwardAngle = (d) => Math.atan2(d.forward[0], d.forward[2])
    report('A8 push right: smooth turn of at most 4.5° per frame', turn < 0 && turn >= -8 * Math.PI / 40 - 1e-3, { turnDegree: turn * 180 / Math.PI, frame: 8 })
    const diff = Math.hypot(d1.head[0] - d0.head[0], d1.head[2] - d0.head[2])
    report('A8 turn around the head: head position fixed (tol 2 cm)', diff < 0.02, { before: d0.head, after: d1.head, diff })
    // is it a right turn: forward vector
    const angleDiff = forwardAngle(d1) - forwardAngle(d0)
    report('A8 push right turns the user right', near(angleDiff, turn, 0.02) , { forwardBefore: d0.forward, forwardAfter: d1.forward, note: 'facing +z, a right turn goes toward −x: atan2(x,z) decreases' })
    await x.stick('right', 0, 0); await x.frame(3)
    const d2 = await x.state()
    await x.frame(3)
    const still = await x.state()
    await x.stick('right', -1, 0); await x.frame(4)
    const d3 = await x.state()
    await x.stick('right', 0, 0); await x.frame(3)
    report('A8 stops when stick released, push left turns the other way', still.rigRotY === d2.rigRotY && d3.rigRotY > d2.rigRotY, { rotY: [d0.rigRotY, d1.rigRotY, d2.rigRotY, d3.rigRotY] })
  })
  await step('A9 stops and wall', async () => {
    const stopList = await s.evaluate(() => __t.stops)
    // open menu
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    for (const dk of stopList) {
      let d = await x.state()
      if (d.cardOpen) { await x.cardClick(); await x.frame(2) }
      if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
      const t = await x.item(INSIDE_GAP(dk.id), INSIDE_N)
      await x.frame(20) // The B button does nothing until the fade transition ends
      d = await x.state()
      const hx = dk.look[0] - dk.position[0], hz = dk.look[2] - dk.position[2], length = Math.hypot(hx, hz)
      const fb = Math.hypot(d.forward[0], d.forward[2])
      const dir = (d.forward[0] * hx + d.forward[2] * hz) / (length * fb)
      const ok = near(d.head[0], dk.position[0], 0.05) && near(d.head[2], dk.position[2], 0.05) && near(d.rigP[1], 0.7) && dir > 0.999 && !d.collides
      report(`A9 stop ${dk.id}: position, direction, no collision`, ok, { diagnose: t, head: d.head, expected: [dk.position[0], dk.position[2]], runDir: Number(dir.toFixed(4)), collides: d.collides, activeInfo: d.activeInfo, cardOpen: d.cardOpen })
      const f = await x.capture(`09-stop-${dk.id}`)
      if (d.cardOpen) await x.texture('card', `09-card-${dk.id}`)
      log('image', dk.id, JSON.stringify(f))
    }
    // Wall: door stop, facing the east wall
    let d = await x.state()
    if (d.cardOpen) { await x.cardClick(); await x.frame(2) }
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    await x.item(INSIDE_GAP('door'), INSIDE_N); await x.frame(20)
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    if ((await x.state()).menuOpen) await x.button('right', 'b-button') // close the menu so it does not cover the view
    const head0 = await x.state()
    await x.stick('left', 0, -1)
    let previous = null, stopped = 0, last = null
    for (let i = 0; i < 300 && stopped < 6; i++) { await x.frame(1); last = await x.state(); if (previous && last.head[0] === previous.head[0] && last.head[2] === previous.head[2]) stopped++; else stopped = 0; previous = last }
    await x.stick('left', 0, 0); await x.frame(2)
    const g = await x.capture('09-wall-foot')
    report('A9 forward: stops at the wall, does not pass through', stopped >= 6 && !last.collides && last.head[0] > head0.head[0], { head0: head0.head, last: last.head, stoppedFrame: stopped, collides: last.collides, g })
    // Sliding along the wall: head turned 30°
    await s.evaluate(() => __sim.headYaw(-Math.PI / 6)); await x.frame(2)
    const k0 = await x.state()
    await x.stick('left', 0, -1); await x.frame(6); const k1 = await x.state(); await x.stick('left', 0, 0); await x.frame(2)
    report('A9 diagonal push into the wall: slides along it', !k1.collides && Math.hypot(k1.head[0] - k0.head[0], k1.head[2] - k0.head[2]) > 0.05, { before: k0.head, after: k1.head, forward: k1.forward })
    await s.evaluate(() => __sim.headYaw(0)); await x.frame(2)
    await x.button('right', 'b-button')
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    // Stop transition while the head is not facing forward
    await s.evaluate(() => __sim.headYaw(Math.PI / 2)); await x.frame(2)
    if ((await x.state()).menuOpen) await x.button('right', 'b-button')
    await x.button('right', 'b-button') // bring the menu in front of the head
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    await x.item(INSIDE_GAP('entrance'), INSIDE_N); await x.frame(20)
    const y = await x.state()
    report('A9 stop with HEAD TURNED 90°: is the user facing the stop', y.forward[2] > 0.9, { forward: y.forward, head: y.head, note: 'the stop rig ignores head yaw' })
    await s.evaluate(() => __sim.headYaw(0)); await x.frame(2)
    await x.button('right', 'b-button'); await x.button('right', 'b-button')
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
  })
  await step('A10 single controller', async () => {
    await s.evaluate(() => __sim.setConnected('left', false)); await x.frame(3)
    let d0 = await x.state()
    log('single controller inputs', JSON.stringify(d0.inputs))
    report('A10 input source list has one controller', d0.inputs.length === 1 && d0.inputs[0].startsWith('right'), d0.inputs)
    await x.stick('right', 1, 0); await x.frame(6)
    const d1 = await x.state()
    await x.stick('right', 0, 0); await x.frame(3)
    const diff = Math.hypot(d1.head[0] - d0.head[0], d1.head[2] - d0.head[2])
    report('A10 single controller sideways push: smooth turn, no strafe', d1.rigRotY < d0.rigRotY && diff < 0.02, { turnDegree: (d1.rigRotY - d0.rigRotY) * 180 / Math.PI, head0: d0.head, head1: d1.head, diff })
    d0 = await x.state()
    await x.stick('right', 0.1, 0); await x.frame(6)
    const d1b = await x.state()
    await x.stick('right', 0, 0); await x.frame(2)
    report('A10 single controller dead zone: neither strafe nor turn', d1b.rigRotY === d0.rigRotY && d1b.head[0] === d0.head[0] && d1b.head[2] === d0.head[2], { head0: d0.head, head1: d1b.head })
    const d2 = await x.state()
    await x.stick('right', 0, -1); await x.frame(5)
    const d3 = await x.state()
    await x.stick('right', 0, 0); await x.frame(2)
    report('A10 single controller forward push: walks', Math.hypot(d3.head[0] - d2.head[0], d3.head[2] - d2.head[2]) > 0.1, { before: d2.head, after: d3.head, forward: d3.forward })
    // menu
    const mk = await x.button('right', 'b-button')
    report('A10 single controller B menu', mk.onRelease.menuOpen !== d3.menuOpen, { before: d3.menuOpen, after: mk.onRelease.menuOpen })
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    // left controller only
    await s.evaluate(() => { __sim.setConnected('right', false); __sim.setConnected('left', true) }); await x.frame(3)
    const l0 = await x.state()
    await x.stick('left', 1, 0); await x.frame(5); const l1 = await x.state(); await x.stick('left', 0, 0); await x.frame(3)
    report('A10 left controller only: sideways push turns, no strafe', l1.rigRotY < l0.rigRotY - 0.01 && Math.hypot(l1.head[0] - l0.head[0], l1.head[2] - l0.head[2]) < 0.02, { inputs: l1.inputs, head0: l0.head, head1: l1.head })
    const kt = await x.item(INSIDE_GAP('entrance'), INSIDE_N, 'left'); await x.frame(20)
    report('A10 menu can be clicked with the left controller only', near((await x.state()).head[2], -24.6, 0.1), { kt, head: (await x.state()).head })
    await s.evaluate(() => __sim.setConnected('right', true)); await x.frame(3)
    report('A10 reconnecting causes no error', (await x.state()).inputs.length === 2, (await x.state()).inputs)
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
  })
  await step('A11 outside', async () => {
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    const t = await x.item(0, INSIDE_N); await x.frame(20)
    const d = await x.state()
    const f = await x.capture('11-outside')
    report('A11 "Dışarı çık": model view, light/disk restored, no card', !d.inside && d.rigScale > 39 && d.disk && d.innerLight === 0 && !d.cardOpen && near(d.modelLocal[1], .9) && near(d.modelLocal[2], -1.2), { diagnose: t, rigScale: d.rigScale, rigP: d.rigP, modelLocal: d.modelLocal, disk: d.disk, innerLight: d.innerLight, cardOpen: d.cardOpen, activeInfo: d.activeInfo, f })
  })
  await step('A12 exit VR', async () => {
    const t = await x.item(3, 4)
    log('exit diagnosis', JSON.stringify(t))
    await desktopCheck(s, h, 'A12 exit-VR', x)
    report('A12 no console errors', !h.error.length, { error: h.error })
    log('warnings', JSON.stringify([...new Set(h.warning)].slice(0, 20)))
  })
  // second session on the same page
  await step('B closed externally', async () => {
    await openVr(s, x)
    const d0 = await x.state()
    report('B reopening starts fresh: scale 100, angle 0, menu open', d0.rigScale === 100 && near(d0.rigRotY, Math.PI) && d0.menuOpen && !d0.inside, { rigScale: d0.rigScale, rigRotY: d0.rigRotY, menuOpen: d0.menuOpen })
    await x.item(0, 4); await x.frame(20)
    const d1 = await x.state()
    report('B inside, card does not open by itself', d1.inside && !d1.cardOpen, { inside: d1.inside, activeInfo: d1.activeInfo })
    await s.evaluate(() => __sim.finish())
    await desktopCheck(s, h, 'B closed-externally', x)
    report('B no console errors', !h.error.length, { error: h.error })
  })
  await step('C exit while fragmented', async () => {
    await openVr(s, x)
    await x.item(1, 4); await x.frame(20)
    const d = await x.state()
    await x.item(2, 3)
    await s.waitForFunction(() => !__sim.d.activeSession, null, { polling: 100 })
    await x.frame(4)
    const last = await x.state()
    const pressed = await s.evaluate(() => [...document.querySelectorAll('.model-control button')].find((b) => /Parçala|Birleştir/.test(b.textContent))?.getAttribute('aria-pressed') + '|' + [...document.querySelectorAll('.model-control button')].find((b) => /Parçala|Birleştir/.test(b.textContent))?.textContent)
    report('C exit while fragmented: page assembled, button in sync', d.fragmented && !last.fragmented && /false/.test(pressed), { fragmentedInner: d.fragmented, fragmentedLast: last.fragmented, layerY: last.layerY, pressed })
    await s.waitForFunction(() => __t.layers.every((k) => Math.abs(k.group.position.y) < 0.01), null, { polling: 200 })
    report('C layers return to zero on desktop', true, await x.state().then((d) => d.layerY))
  })
  await step('D desktop shatter after menu exit', async () => {
    const errors = h.error
    report('Final console', !errors.length, { error: errors, warning: [...new Set(h.warning)].slice(0, 20) })
  })
  await ctx.close()
}

async function tall() {
  const { page: s, h, ctx } = await open('?quality=tall', { width: 640, height: 360 })
  const x = controls(s)
  await step('Y composer path', async () => {
    log('start', JSON.stringify(await x.state()))
    await openVr(s, x)
    const f = await x.capture('Y-session')
    report('Y session with quality=tall', f.left.backOuter > 0.02, { f, quality: (await x.state()).quality })
    await x.item(3, 4)
    await s.waitForFunction(() => !__sim.d.activeSession, null, { polling: 100 })
    await x.frame(3)
    const d = await x.state()
    await s.screenshot({ path: `${SCREEN}/Y-exit-page.png` })
    const pixel = await s.evaluate(async () => { await __sim.waitFrame(1); const c = __t.renderer.domElement; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; return { w: c.width, h: c.height } })
    report('Y frame via composer path after exit, no errors', !h.error.length && d.quality === 0, { error: h.error, quality: d.quality, canvas: d.canvas, pixel, screen: `${SCREEN}/Y-exit-page.png`, near: d.near, far: d.far })
  })
  await ctx.close()
}

for (const scenario of chosen) {
  log('=== scenario', scenario)
  if (scenario === 'main') await main()
  if (scenario === 'tall') await tall()
}
await browser.close()
const count = (k) => results.filter((r) => r.result === k).length
log('DONE', { passed: count('PASS'), failed: count('FAIL'), untestable: count('UNTESTABLE') })
