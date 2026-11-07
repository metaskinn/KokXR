// Vase workshop WebXR flow: IWER (Quest 3 emulation) + the real three.js WebXRManager. Not a substitute for a real device.
// For setup and running see setup.sh. Controller events come from the real flow; grabbing and releasing are done by moving the controller.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('Set the XR_SIM folder; see setup.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const SCREEN = S + '/screen-vase'
mkdirSync(SCREEN, { recursive: true })
const TIMEOUT = 180000
// Software rendering is slow (scenario 1 takes ~9 min on a shared machine). ANGLE=metal on a Mac is much faster.
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
const SCENARIOS = (process.env.SCENARIO ?? '1,2,3').split(',')
const STEPS = []
const step = (name, evidence = '') => { STEPS.push(name); console.log(`PASS  ${name}${evidence ? ' ' + JSON.stringify(evidence) : ''}`) }

async function open(preparation) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
  const errors = []
  page.on('pageerror', (e) => { errors.push('pageerror: ' + e); if (process.env.SIM_DETAIL) console.log('pageerror', e.stack) })
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.setDefaultTimeout(TIMEOUT)
  await page.addInitScript({ path: S + '/package/node_modules/iwer/build/iwer.min.js' })
  await page.addInitScript({ path: S + '/sim-page.js' })
  await page.addInitScript(pageHelpers)
  await page.goto(`${url}/workshops/vase`)
  await page.waitForFunction(() => window.__t?.frame > 2 && ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { polling: 100 })
  if (preparation) await page.evaluate(preparation)
  return { page, errors, x: short(page) }
}

function pageHelpers() {
  const t = () => window.__t, sim = () => window.__sim
  const local = (v) => { const r = sim().rig(); r.updateWorldMatrix(true, false); return r.worldToLocal(v.clone()).toArray() }
  window.__v = {
    pieceLocal: (id) => local(t().pieces[id].getWorldPosition(new (t().THREE.Vector3)())),
    targetLocal: (id) => local(t().targets[id].position),
    panel: () => t().scene.children.find((c) => c.geometry?.parameters?.width === 64),
    // Aims at a panel button: the center of the i-th button.
    buttonPoint: (i) => sim().panelPoint(window.__v.panel(), i === 0 ? 0.265 : 0.735, 0.19),
    label: () => { const e = t().camera.children[0]; return e ? { exists: true, visible: e.visible, depth: e.material.depthTest, png: e.material.map.image.toDataURL('image/png') } : { exists: false } },
    panelPng: () => window.__v.panel().material.map.image.toDataURL('image/png'),
    // Points the controller at a target and moves it to the given position.
    placeController: (el, position, target) => {
      const { THREE } = t(), k = sim().d.controllers[el]
      const C = new THREE.Vector3(...position), y = new THREE.Vector3(...target).sub(C).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
      k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
    },
    controllerScroll: (el, d) => { const k = sim().d.controllers[el]; k.position.set(k.position.x + d[0], k.position.y + d[1], k.position.z + d[2]) },
    rotateController: (el, rad) => { const { THREE } = t(), k = sim().d.controllers[el]; const q = new THREE.Quaternion(k.quaternion.x, k.quaternion.y, k.quaternion.z, k.quaternion.w).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad)); k.quaternion.set(q.x, q.y, q.z, q.w) },
    // The app sees no gamepad; IWER's own button handling reads the same field, so it gets the real one.
    removeGamepad: () => {
      window.__gamepadRead = 0
      for (const k of sim().d.activeSession.inputSources) {
        const actual = k.gamepad
        Object.defineProperty(k, 'gamepad', { configurable: true, get() {
          // Only the direct caller is checked: the XR frame starts inside IWER anyway.
          if (new Error().stack.split('\n')[2]?.includes('iwer.min.js')) return actual
          window.__gamepadRead++
          return undefined
        } })
      }
    },
    state: () => {
      const T = t(), { THREE, camera, renderer, pieces, targets, base, assemblyTraces, intactView, silhouette, scene } = T
      const world = (o) => o.getWorldPosition(new THREE.Vector3())
      return {
        session: !!sim().d.activeSession, presenting: renderer.xr.isPresenting, repair: T.state.repair, placed: [...T.state.placed], selected: T.state.selected, motion: T.motion,
        intact: intactView.visible, traces: assemblyTraces.visible, silhouette: silhouette.visible, pieceVisible: pieces.map((p) => p.visible),
        pieceFar: pieces.map((p, i) => Number(world(p).distanceTo(targets[i].position).toFixed(3))),
        shelfFar: pieces.map((p, i) => Number(world(p).distanceTo(T.shelves[i]).toFixed(3))),
        pieceParentScene: pieces.every((p) => p.parent === scene), tracePos: world(assemblyTraces).toArray().map((v) => Number(v.toFixed(3))), traceParentScene: assemblyTraces.parent === scene, intactParentScene: intactView.parent === scene,
        near: camera.near, far: camera.far, fov: Number(camera.fov.toFixed(3)), cameraParent: camera.parent ? camera.parent.type : null, cameraScale: camera.scale.toArray().map((v) => Number(v.toFixed(4))), cameraChild: camera.children.length,
        base: base.scale.x, sceneChild: scene.children.length, control: T.controls.enabled, canvasEl: [renderer.domElement.width, renderer.domElement.height], ratio: renderer.getPixelRatio(),
        rig: camera.parent ? { p: camera.parent.position.toArray().map((v) => Number(v.toFixed(2))), rotY: Number(camera.parent.rotation.y.toFixed(3)), scale: camera.parent.scale.x } : null,
        head: world(camera).toArray().map((v) => Number(v.toFixed(2))),
      }
    },
  }
}

const short = (s) => {
  const x = {
    d: () => s.evaluate(() => __v.state()),
    frame: (n = 3) => s.evaluate((n) => __sim.waitFrame(n, 60000), n),
    press: async (el, button) => { await s.evaluate(([e, d]) => __sim.press(e, d, 1), [el, button]); await x.frame() },
    release: async (el, button) => { await s.evaluate(([e, d]) => __sim.press(e, d, 0), [el, button]); await x.frame() },
    put: async (el, position, target) => { await s.evaluate(([e, k, h]) => __v.placeController(e, k, h), [el, position, target]); await x.frame() },
    scroll: async (el, d) => { await s.evaluate(([e, d]) => __v.controllerScroll(e, d), [el, d]); await x.frame() },
    rotate: async (el, r) => { await s.evaluate(([e, r]) => __v.rotateController(e, r), [el, r]); await x.frame() },
    enter: async () => {
      await s.getByRole('button', { name: "VR'da aç" }).click()
      await s.waitForFunction(() => window.__t.renderer.xr.isPresenting && window.__t.camera.parent, null, { polling: 100 })
      await x.frame(5)
      await s.getByRole('button', { name: "VR'dan çık" }).waitFor()
    },
    /** Aims at a panel button and presses the trigger. */
    panel: async (i, el = 'right') => {
      const n = await s.evaluate((i) => __v.buttonPoint(i), i)
      await x.put(el, el === 'right' ? [0.15, 1.2, -0.1] : [-0.15, 1.2, -0.1], n)
      await x.press(el, 'trigger'); await s.evaluate((e) => __sim.press(e, 'trigger', 0), el)
      await x.frame().catch(() => {})
    },
    /** Aims at a piece from a distance and grabs it. */
    teleportHold: async (id, el = 'right') => {
      const p = await s.evaluate((i) => __v.pieceLocal(i), id)
      const k = [p[0] * 0.3 + (el === 'right' ? 0.1 : -0.1), p[1] + 0.45, p[2] + 0.55]
      await x.put(el, k, p)
      await x.press(el, 'trigger')
      assert.equal((await x.d()).selected, id, `could not grab piece ${id} with the ray`)
    },
    /** Moves a held piece to the given point (the controller moves by the same amount). */
    move: async (id, target, el = 'right') => {
      const p = await s.evaluate((i) => __v.pieceLocal(i), id)
      await x.scroll(el, [target[0] - p[0], target[1] - p[1], target[2] - p[2]])
    },
    /** Grabs, carries to its target, releases and waits for it to snap. */
    placeAt: async (id, el = 'right', keyBtn = 'trigger') => {
      if (keyBtn === 'trigger') await x.teleportHold(id, el)
      else {
        const p = await s.evaluate((i) => __v.pieceLocal(i), id)
        await x.put(el, [p[0], p[1], p[2] + 0.02], [p[0], p[1], p[2] - 1])
        await x.press(el, 'squeeze')
        assert.equal((await x.d()).selected, id, `could not grab piece ${id} with squeeze`)
      }
      await x.move(id, await s.evaluate((i) => __v.targetLocal(i), id), el)
      await x.release(el, keyBtn)
      await s.waitForFunction((i) => window.__t.state.placed.includes(i) && window.__t.motion === 0, id, { polling: 50 })
      await x.frame(2)
    },
    save: async (name) => {
      const r = await s.evaluate(() => __sim.capture())
      writeFileSync(`${SCREEN}/${name}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { left: r.left, right: r.right, eyeDiff: r.eyeDiff }
    },
    png: async (expression, name) => {
      const u = await s.evaluate(expression)
      writeFileSync(`${SCREEN}/${name}.png`, Buffer.from(u.split(',')[1], 'base64'))
    },
  }
  return x
}

const SHELF_TOL = 0.1
function desktopReturned(d, first, name) {
  assert.equal(d.presenting, false, name + ': still presenting')
  assert.equal(d.cameraParent, null, name + ': camera inside rig')
  assert.equal(d.cameraChild, 0, name + ': label left attached to the camera')
  assert.deepEqual([d.near, d.far, d.fov, d.ratio], [first.near, first.far, first.fov, first.ratio], name + ': camera or pixel ratio not restored')
  assert.deepEqual(d.canvasEl, first.canvasEl, name + ': canvas size not restored')
  assert.deepEqual(d.cameraScale, [1, 1, 1], name + ': camera scale')
  assert.equal(d.base, 1, name + ': desktop base not restored')
  assert.equal(d.control, true, name + ': camera controls left disabled')
  assert.equal(d.sceneChild, first.sceneChild, name + ': rig, panel or environment left in scene')
  assert.ok(d.pieceParentScene && d.traceParentScene && d.intactParentScene, name + ': object left in the holder')
  assert.deepEqual(d.tracePos, first.tracePos, name + ': repair traces moved')
}

try {
  // ---------- 1. End to end, two controllers ----------
  if (SCENARIOS.includes('1')) {
    const { page, errors, x } = await open()
    const first = await x.d()
    assert.ok(first.intact && !first.repair)
    await x.enter()
    let d = await x.d()
    assert.equal(d.rig.scale, 100)
    assert.ok(d.presenting && d.intact && !d.repair && d.pieceVisible.every((v) => !v), 'VR did not start with the traceless vase')
    // Close to the user: 70 cm horizontally, below the head.
    assert.ok(Math.abs(Math.hypot(d.head[0], d.head[2]) - 70) < 1, `vase too far: ${d.head}`)
    const label = await page.evaluate(() => __v.label())
    assert.ok(label.exists && label.visible && label.depth === false, '"Temsilî" label not attached to the head')
    await x.png(() => __v.label().png, 'label')
    await x.png(() => __v.panelPng(), '1-panel-traceless')
    step('"VR\'da aç": traceless vase on the table 1:1, 70 cm ahead; "Temsilî" label attached to the head', { rig: d.rig, head: d.head })
    step('Frame: traceless', await x.save('1-traceless'))

    // Pieces of the traceless vase cannot be grabbed; the whole vase is grabbed and rotated.
    await x.put('left', [-0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.press('left', 'trigger')
    await x.frame(4)
    d = await x.d()
    assert.equal(d.selected, null)
    assert.equal(d.intactParentScene, false, 'traceless vase not picked up')
    await x.release('left', 'trigger')
    await x.frame(30)
    d = await x.d()
    assert.ok(d.pieceFar.every((v) => v < 0.2), `traceless vase did not return to the table: ${d.pieceFar}`)
    step('Traceless vase picked up and returned to the table; no invisible piece grabbed')

    await x.panel(0)
    await page.waitForFunction(() => __t.state.repair)
    await x.frame(2)
    d = await x.d()
    assert.ok(!d.intact && d.silhouette && d.pieceVisible.every(Boolean) && d.pieceParentScene && d.intactParentScene, JSON.stringify(d))
    assert.ok(d.shelfFar.every((v) => v < SHELF_TOL), `pieces not on the shelf: ${d.shelfFar}`)
    assert.equal(d.base < 1, true, 'VR base not applied')
    await x.png(() => __v.panelPng(), '2-panel-repair')
    step('Panel: shatter vase; pieces on the base, silhouette visible', { shelfFar: d.shelfFar })
    step('Frame: shattered', await x.save('2-fragmented'))

    // Wrong release: same path as desktop, returns, counts as an attempt, does not snap.
    await x.teleportHold(0)
    const before = (await x.d()).shelfFar[0]
    await x.scroll('right', [0.05, 0.12, 0])
    assert.ok((await x.d()).shelfFar[0] > before + 5, 'piece did not follow the controller')
    await x.release('right', 'trigger')
    await page.waitForFunction(() => __t.motion === 0, null, { polling: 50 })
    d = await x.d()
    assert.deepEqual(d.placed, [])
    assert.ok(d.shelfFar[0] < SHELF_TOL, 'wrongly released piece did not return to the shelf')
    assert.match(await page.locator('.vase-message').textContent(), /henüz yerine yaklaşmadı/)
    await page.getByText('Deneme: 1').waitFor()
    await x.png(() => __v.panelPng(), '3-panel-wrong')
    step('Wrong release: piece returned to the shelf, attempt 1, placed 0')

    // Threshold: just outside the target does not snap, just inside does (desktop snap function, threshold 9 cm).
    await x.teleportHold(0)
    const h0 = await page.evaluate(() => __v.targetLocal(0))
    await x.move(0, [h0[0] + 0.095, h0[1], h0[2]])
    await x.release('right', 'trigger')
    await page.waitForFunction(() => __t.motion === 0, null, { polling: 50 })
    assert.deepEqual((await x.d()).placed, [], 'snapped at 9.5 cm')
    await x.teleportHold(0)
    await x.move(0, [h0[0] + 0.085, h0[1], h0[2]])
    await x.release('right', 'trigger')
    await page.waitForFunction(() => __t.state.placed.includes(0) && __t.motion === 0, null, { polling: 50 })
    d = await x.d()
    assert.ok(d.pieceFar[0] < 0.1, 'snapped piece did not move to its target')
    step('Threshold: 9.5 cm did not snap, 8.5 cm snapped automatically', { piece0: d.pieceFar[0] })

    await x.placeAt(1)                 // ray + trigger
    await x.placeAt(2, 'left')         // other controller
    step('Ray + trigger, pieces 2 and 3 placed with both controllers')
    await x.placeAt(3, 'right', 'squeeze') // touch + squeeze
    step('Piece 4 placed by touch with the squeeze button')
    await x.placeAt(4, 'left', 'squeeze')
    await x.placeAt(5)
    await page.waitForFunction(() => __t.state.placed.length === 6 && __t.motion === 0, null, { polling: 50 })
    await x.frame(3)
    d = await x.d()
    assert.ok(d.traces && !d.silhouette && !d.intact, 'repair traces not shown')
    assert.ok(d.pieceFar.every((v) => v < 0.1), `pieces not in place: ${d.pieceFar}`)
    await page.getByText('Vazo onarıldı!').first().waitFor()
    await x.png(() => __v.panelPng(), '4-panel-done')
    step('Completed: 6/6, repair traces visible, silhouette hidden', { pieceFar: d.pieceFar })
    step('Frame: done', await x.save('3-done'))

    // Inspection: the whole vase goes in hand, traces move with it, returns to the table on release.
    const tracesHome = d.tracePos
    await x.put('right', [0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.press('right', 'trigger')
    await x.rotate('right', 0.9)
    await x.scroll('right', [0, 0.1, 0.05])
    await x.frame(8)
    d = await x.d()
    assert.equal(d.traceParentScene, false, 'vase not picked up')
    assert.notDeepEqual(d.tracePos, tracesHome, 'traces did not move with the vase')
    step('Inspection: vase in hand, traces with it', { tracePos: d.tracePos })
    step('Frame: inspection', await x.save('4-inspection'))
    await x.release('right', 'trigger')
    await x.frame(30)
    d = await x.d()
    assert.ok(d.pieceFar.every((v) => v < 0.2), `did not return to the table on release: ${d.pieceFar}`)
    step('Vase returned to the table on release', { pieceFar: d.pieceFar })

    // Restart from the panel with the other controller while holding the vase.
    await x.put('left', [-0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.press('left', 'trigger')
    await x.scroll('left', [0, 0.1, 0])
    await x.frame(5)
    await x.panel(0)
    await page.waitForFunction(() => __t.state.placed.length === 0 && __t.state.repair)
    await x.frame(3)
    d = await x.d()
    assert.ok(d.pieceParentScene && d.traceParentScene, 'holder not emptied')
    assert.ok(d.shelfFar.every((v) => v < SHELF_TOL), `shelf broken after restart: ${d.shelfFar}`)
    assert.equal(d.traces, false)
    await x.release('left', 'trigger')
    step('Panel: shatter again while holding the vase; pieces on the shelf', { shelfFar: d.shelfFar })

    // Restart while holding a piece; the piece does not stay in hand.
    await x.teleportHold(2, 'left')
    await x.scroll('left', [0, 0.1, 0])
    await x.panel(0)
    await x.frame(4)
    await x.release('left', 'trigger')
    await x.scroll('left', [0, 0.1, 0])
    await x.frame(3)
    assert.ok((await x.d()).shelfFar[2] < SHELF_TOL, 'piece stayed in hand after restart')
    step('Panel: restart while holding a piece; piece did not stay in hand')

    // One piece, then exit from the panel.
    await x.placeAt(0)
    await x.panel(1)
    await page.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await page.waitForFunction(() => __t.frame > 0)
    await page.getByRole('button', { name: "VR'da aç" }).waitFor()
    d = await x.d()
    desktopReturned(d, first, 'exit from panel')
    assert.deepEqual(d.placed, [0], 'progress lost')
    assert.equal(await page.locator('.vase-handle:not([hidden])').count(), 5)
    assert.match(await page.locator('.vase-message').textContent(), /1\/6 parça yerinde/)
    assert.ok(await page.getByRole('button', { name: 'Yeniden parçala' }).isEnabled(), 'desktop buttons stayed locked')
    await page.locator('.vase-scene canvas').screenshot({ path: `${SCREEN}/5-desktop.png` })
    step('Panel: "VR\'dan çık"; desktop camera, size and scene restored, progress 1/6 kept', { canvasEl: d.canvasEl, near: d.near, far: d.far })

    // Does dragging still work on desktop after the session ended?
    const hold = page.locator('.vase-handle[data-piece-id="1"]')
    await hold.scrollIntoViewIfNeeded()
    const b = await hold.boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down()
    await page.waitForFunction(() => __t.state.selected === 1)
    await page.mouse.move(b.x + 40, b.y + 40, { steps: 3 }); await page.mouse.up()
    await page.waitForFunction(() => document.querySelector('.vase-message').textContent.includes('henüz'))
    step('Dragging pieces works on desktop after VR')

    // Re-entry: the partial repair continues.
    await x.enter()
    d = await x.d()
    assert.deepEqual(d.placed, [0])
    assert.ok(d.shelfFar.slice(1).every((v) => v < SHELF_TOL), `shelf broken on re-entry: ${d.shelfFar}`)
    step('Re-entry: partial repair continues in VR')

    // Meta button: session closed externally while holding a piece.
    await x.teleportHold(1)
    await x.scroll('right', [0, 0.1, 0])
    await page.evaluate(() => __sim.finish())
    await page.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await page.getByRole('button', { name: "VR'da aç" }).waitFor()
    await page.waitForFunction(() => __t.frame > 0)
    d = await x.d()
    desktopReturned(d, first, 'external close')
    assert.deepEqual(d.placed, [0], 'interrupted grab got placed')
    assert.ok(d.shelfFar[1] < SHELF_TOL, 'held piece did not return to the desktop shelf')
    step('External close (session.end instead of the Meta button) while holding a piece: desktop restored, piece on the shelf')

    assert.deepEqual(errors, [], 'console error')
    step('Scenario 1 console clean')
    await page.context().close()
  }

  // ---------- 2. Single controller, no gamepad, head turned ----------
  if (SCENARIOS.includes('2')) {
    const { page, errors, x } = await open(() => { __sim.headYaw(0.8); __sim.setConnected('left', false) })
    await x.enter()
    await page.evaluate(() => __v.removeGamepad())
    await x.frame(3)
    let d = await x.d()
    assert.ok(Math.abs(d.rig.rotY + 0.8) < 0.01, `rig did not rotate: ${d.rig.rotY}`)
    await x.panel(0)
    await page.waitForFunction(() => __t.state.repair)
    await x.frame(2)
    for (let id = 0; id < 6; id++) await x.placeAt(id)
    d = await x.d()
    assert.deepEqual(d.placed, [0, 1, 2, 3, 4, 5])
    assert.ok(d.traces)
    step('Single controller, no gamepad, head turned 46°: 6/6 completed', { rig: d.rig, appGamepadRead: await page.evaluate(() => window.__gamepadRead), inputCount: await page.evaluate(() => __sim.d.activeSession.inputSources.length) })
    await x.panel(1)
    await page.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    assert.deepEqual(errors, [], 'console error')
    step('Scenario 2 console clean')
    await page.context().close()
  }

  // ---------- 3. Controller disconnect and route change ----------
  if (SCENARIOS.includes('3')) {
    const { page, errors, x } = await open()
    await x.enter()
    await x.panel(0)
    await page.waitForFunction(() => __t.state.repair)
    await x.frame(2)
    await x.teleportHold(0)
    await x.scroll('right', [0, 0.1, 0])
    await page.evaluate(() => __sim.setConnected('right', false))
    await x.frame(4)
    await page.waitForFunction(() => __t.motion === 0, null, { polling: 50 })
    let d = await x.d()
    assert.deepEqual(d.placed, [])
    assert.equal(d.selected, null)
    assert.ok(d.shelfFar[0] < SHELF_TOL, 'piece of the disconnected controller did not return to the shelf')
    await page.getByText('Deneme: 0').waitFor()
    step('Controller disconnected: piece returned to the shelf, attempt not counted')
    await page.evaluate(() => __sim.setConnected('right', true))
    await x.frame(4)
    await x.placeAt(0)
    step('Controller reconnected: grabbing works')

    const session = await page.evaluateHandle(() => { const o = __sim.d.activeSession; window.__last = { done: false }; o.addEventListener('end', () => { window.__last.done = true }); return o })
    await session.dispose()
    // IWER's fullscreen canvas covers the page: dispatch a click event instead of using the mouse.
    await page.getByRole('link', { name: 'Ana sayfaya dön' }).dispatchEvent('click')
    await page.waitForFunction(() => window.__last.done, null, { polling: 100 })
    await page.waitForFunction(() => !document.querySelector('.vase-scene canvas'))
    await page.waitForTimeout(500)
    assert.deepEqual(errors, [], 'error on route change')
    step('Route changed while in VR: session closed, canvas removed, console clean')
    await page.context().close()
  }
  console.log(`Vase VR simulation: ${STEPS.length} checks passed.`)
} finally { await browser.close() }
