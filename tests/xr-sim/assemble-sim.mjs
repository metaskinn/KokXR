// Ulu Mosque model assembly, WebXR flow: IWER (Quest 3 emulation) + the real three.js WebXRManager. Not a substitute for a real device.
// For setup and running see setup.sh. Controller events come from the real flow; grabbing and releasing are done by moving the controller.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('Set the XR_SIM folder; see setup.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const SCREEN = S + '/screen-assemble'
mkdirSync(SCREEN, { recursive: true })
const TIMEOUT = 180000
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
let audit = 0
const step = (name, evidence = '') => { audit++; console.log(`PASS  ${name}${evidence ? ' ' + JSON.stringify(evidence) : ''}`) }
const ROOF = 0, DRUM = 1, DOME = 2

function pageHelpers() {
  // Every text written to a canvas: shows the warning was really drawn and nothing is drawn in the frame loop.
  window.__texts = []
  const actual = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (m, ...a) { window.__texts.push(m); return actual.call(this, m, ...a) }
  const t = () => window.__t, sim = () => window.__sim
  const homes = []
  window.__b = {
    // Called before the game, while labels are not yet children of the layer.
    measure: () => {
      const { THREE, layers } = t()
      layers.forEach(({ group }, i) => {
        const k = new THREE.Box3().setFromObject(group)
        homes[i] = k.getCenter(new THREE.Vector3()).sub(group.position)
      })
    },
    centerLocal: (id) => {
      const r = sim().rig(); r.updateWorldMatrix(true, false)
      return r.worldToLocal(homes[id].clone().add(t().layers[id].group.position)).toArray()
    },
    homeLocal: (id) => { const r = sim().rig(); r.updateWorldMatrix(true, false); return r.worldToLocal(homes[id].clone()).toArray() },
    placeController: (el, position, target) => {
      const { THREE } = t(), k = sim().d.controllers[el]
      const C = new THREE.Vector3(...position), y = new THREE.Vector3(...target).sub(C).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
      k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
    },
    controllerScroll: (el, d) => { const k = sim().d.controllers[el]; k.position.set(k.position.x + d[0], k.position.y + d[1], k.position.z + d[2]) },
    state: () => {
      const T = t(), { layers, camera, scene, renderer } = T
      const menu = sim()._rig ? sim().menu() : null
      return {
        presenting: renderer.xr.isPresenting, inAssembly: T.xr.inAssembly(), fragmented: T.fragmented, inside: T.inside,
        layer: layers.map((k) => k.group.position.toArray().map((v) => Number(v.toFixed(2)))),
        child: layers.map((k) => k.group.children.filter((c) => c.geometry?.type === 'PlaneGeometry').length),
        // The comfort vignette stays on the camera; it is hidden while standing still, so only visible children count.
        menu: menu?.visible ?? false, cameraChild: camera.children.filter((c) => c.visible).length, cameraParent: camera.parent?.type ?? null, sceneChild: scene.children.length,
        rig: camera.parent ? { p: camera.parent.position.toArray().map((v) => Number(v.toFixed(2))), rotY: Number(camera.parent.rotation.y.toFixed(3)), scale: camera.parent.scale.x } : null,
        near: camera.near, far: camera.far, control: T.controls.enabled,
      }
    },
    panelPng: () => t().camera.children.find((c) => c.geometry?.parameters?.height > 0.1)?.material.map.image.toDataURL('image/png'),
  }
}

async function open() {
  const page = await (await browser.newContext({ viewport: { width: 960, height: 540 } })).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e))
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
  page.setDefaultTimeout(TIMEOUT)
  await page.addInitScript({ path: S + '/package/node_modules/iwer/build/iwer.min.js' })
  await page.addInitScript({ path: S + '/sim-page.js' })
  await page.addInitScript(pageHelpers)
  await page.goto(`${url}/places/ulu-mosque`)
  await page.locator('.model-area canvas').waitFor()
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => [...document.querySelectorAll('.model-control button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled) && window.__t?.frame > 2, null, { polling: 250 })
  await page.evaluate(() => __b.measure())
  return { page, errors, x: short(page) }
}

const short = (s) => {
  const x = {
    d: () => s.evaluate(() => __b.state()),
    frame: (n = 3) => s.evaluate((n) => __sim.waitFrame(n, 60000), n),
    press: async (el, button) => { await s.evaluate(([e, d]) => __sim.press(e, d, 1), [el, button]); await x.frame() },
    release: async (el, button) => { await s.evaluate(([e, d]) => __sim.press(e, d, 0), [el, button]); await x.frame() },
    enter: async () => {
      await s.getByRole('button', { name: "VR'da aç" }).click()
      await s.waitForFunction(() => window.__t.renderer.xr.isPresenting && window.__t.camera.parent && __sim.menu().visible, null, { polling: 100 })
      await x.frame(3)
    },
    /** Presses the trigger on the i-th menu item (of n). */
    item: async (i, n, el = 'right') => {
      const point = await s.evaluate(([i, n]) => __sim.menuItemPoint(i, n), [i, n])
      await s.evaluate(([el, point]) => __sim.aim(point, el), [el, point])
      await x.frame(2)
      await x.press(el, 'trigger')
      await s.evaluate((el) => __sim.press(el, 'trigger', 0), el)
      await x.frame(2).catch(() => {})
    },
    clearWritings: async () => { await s.evaluate(() => { window.__texts.length = 0 }) },
    writings: () => s.evaluate(() => [...window.__texts]),
    /** Enters assembly and waits for the transition to finish. */
    begin: async (n = 4, i = 2) => {
      await x.item(i, n)
      await s.waitForFunction(() => __t.xr.inAssembly(), null, { polling: 50 })
      await x.frame(20) // fade ends
    },
    /** Aims at a layer from a distance and grips it. */
    hold: async (id, el = 'right', keyBtn = 'squeeze') => {
      const m = await s.evaluate((i) => __b.centerLocal(i), id)
      const k = [el === 'right' ? 0.25 : -0.25, 1.2, -0.35]
      await s.evaluate(([e, k, m]) => __b.placeController(e, k, m), [el, k, m])
      await x.frame(2)
      await x.press(el, keyBtn)
    },
    /** Moves the held layer to `target`: hand travel is half the gain. `offset`: release beside the target. */
    move: async (id, target, el = 'right', offset = [0, 0, 0]) => {
      const m = await s.evaluate((i) => __b.centerLocal(i), id)
      const d = [0, 1, 2].map((a) => (target[a] + offset[a] - m[a]) / 2)
      await s.evaluate(([e, d]) => __b.controllerScroll(e, d), [el, d])
      await x.frame()
    },
    home: (id) => s.evaluate((i) => __b.homeLocal(i), id),
    /** Waits until all glides have finished. */
    settleDown: async () => {
      let previous = JSON.stringify((await x.d()).layer)
      for (let i = 0; i < 400; i++) {
        await x.frame(4)
        const now = JSON.stringify((await x.d()).layer)
        if (now === previous) return
        previous = now
      }
      throw new Error('layers did not settle')
    },
    placeAt: async (id, el = 'right') => {
      await x.hold(id, el)
      await x.move(id, await x.home(id), el)
      await x.release(el, 'squeeze')
      await x.settleDown()
    },
    save: async (name) => {
      const r = await s.evaluate(() => __sim.capture())
      writeFileSync(`${SCREEN}/${name}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { left: r.left, right: r.right }
    },
    panel: async (name) => { const u = await s.evaluate(() => __b.panelPng()); writeFileSync(`${SCREEN}/${name}.png`, Buffer.from(u.split(',')[1], 'base64')) },
    menu: async (name) => { const u = await s.evaluate(() => __sim.texPng('menu')); writeFileSync(`${SCREEN}/${name}.png`, Buffer.from(u.split(',')[1], 'base64')) },
  }
  return x
}
const atHome = (k) => k.every((v) => v === 0)

try {
  const { page, errors, x } = await open()
  const first = await x.d()
  await x.enter()
  await x.menu('0-menu-normal')

  // On the shelf: layers to the user's right, not overlapping.
  await x.begin()
  let d = await x.d()
  assert.ok(d.inAssembly && !d.menu, 'game did not open or menu did not close')
  assert.equal(d.rig.scale, 100)
  assert.equal(d.cameraChild, 2, 'label and status panel not attached to the head')
  assert.deepEqual(d.child, [1, 1, 1], 'layer names missing')
  const shelves = await Promise.all([ROOF, DRUM, DOME].map((i) => page.evaluate((i) => __b.centerLocal(i), i)))
  assert.ok(shelves.every((r) => r[0] > 0.5), `shelf not on the right: ${shelves}`)
  assert.ok(shelves[DOME][1] < shelves[DRUM][1] && shelves[DRUM][1] < shelves[ROOF][1], `shelf order: ${shelves}`)
  assert.ok(!d.layer.some(atHome), 'layer stayed at home')
  await x.panel('1-panel-first')
  step('Menu: "Maketi birleştir"; layers on the shelf to the right, menu closed, label and panel attached to the head', { shelves })
  step('Frame: shelf', await x.save('1-shelf'))

  // Drawing only on state change: no canvas text in idle and aiming frames.
  await x.clearWritings()
  await page.evaluate(([k, m]) => __b.placeController('right', k, m), [[0.25, 1.2, -0.35], shelves[ROOF]])
  await x.frame(30)
  assert.deepEqual(await x.writings(), [], 'texture drawn in the frame loop')
  step('No canvas drawing in 30 frames')

  // The stick does not move the model during the game.
  const rig0 = (await x.d()).rig
  await page.evaluate(() => __sim.stick('right', 1, 1))
  await x.frame(6)
  await page.evaluate(() => __sim.stick('right', 0, 0))
  await x.frame(2)
  assert.deepEqual((await x.d()).rig, rig0, 'stick moved the rig during the game')
  step('Right stick does not move the rig during the game')

  // The trigger grabs too (most people try it first); releasing it puts the layer back on the shelf.
  await x.hold(ROOF, 'right', 'trigger')
  const before = (await x.d()).layer[ROOF]
  await page.evaluate(() => __b.controllerScroll('right', [0, 0.1, 0]))
  await x.frame()
  assert.notDeepEqual((await x.d()).layer[ROOF], before, 'trigger did not grab the layer')
  await x.release('right', 'trigger')
  await x.frame(30)
  step('Trigger grabs a layer as well')

  // Wrong order: domes first.
  await x.hold(DOME)
  const shelfDome = (await x.d()).layer[DOME]
  await x.move(DOME, await x.home(DOME))
  d = await x.d()
  assert.ok(Math.hypot(...d.layer[DOME]) < 3, `dome did not reach the target: ${d.layer[DOME]}`)
  step('Frame: holding in wrong order', await x.save('2-wrong-held'))
  await x.clearWritings()
  await x.release('right', 'squeeze')
  await x.settleDown()
  d = await x.d()
  assert.deepEqual(d.layer[DOME], shelfDome, `dome did not return to the shelf: ${d.layer[DOME]}`)
  assert.ok(d.inAssembly)
  let writing = await x.writings()
  assert.ok(writing.includes('Önce Çatı oturmalı. Sıra alttan üste gider.'), `no warning: ${writing}`)
  assert.ok(writing.includes('Maketi birleştir: 0/3 katman yerinde'), `progress: ${writing}`)
  assert.ok(writing.some((m) => /maketin üst üste oturma sırasıdır/.test(m)), 'order note missing')
  await x.panel('2-panel-warning')
  step('Wrong order: domes did not snap, returned to the shelf, Turkish warning drawn', { writing })

  // Not close: roof released outside the target threshold.
  await x.hold(ROOF)
  const shelfRoof = (await x.d()).layer[ROOF]
  await x.move(ROOF, await x.home(ROOF), 'right', [0.25, 0, 0])
  d = await x.d()
  await x.clearWritings()
  await x.release('right', 'squeeze')
  await x.settleDown()
  assert.deepEqual((await x.d()).layer[ROOF], shelfRoof, 'roof released far away did not return to the shelf')
  assert.ok((await x.writings()).includes('Yerine yaklaşmadı. Yeniden dene.'))
  step('Outside threshold (25 cm): did not snap, returned to the shelf', { releasedOne: d.layer[ROOF] })

  // Inside threshold: released 15 cm beside, it snaps.
  await x.hold(ROOF)
  await x.move(ROOF, await x.home(ROOF), 'right', [0.15, 0, 0])
  await x.clearWritings()
  await x.release('right', 'squeeze')
  await x.settleDown()
  d = await x.d()
  assert.ok(atHome(d.layer[ROOF]), `roof did not snap: ${d.layer[ROOF]}`)
  assert.ok((await x.writings()).includes('Çatı yerine oturdu.'))
  assert.deepEqual(d.child.length, 3)
  step('Roof snapped from 15 cm and glided home')

  // A snapped layer cannot be grabbed again.
  await page.evaluate(([k, m]) => __b.placeController('right', k, m), [[0.25, 1.2, -0.35], await x.home(ROOF)])
  await x.frame(2)
  await x.press('right', 'squeeze')
  await page.evaluate(() => __b.controllerScroll('right', [0, 0.1, 0]))
  await x.frame()
  assert.ok(atHome((await x.d()).layer[ROOF]), 'snapped layer was grabbed')
  await x.release('right', 'squeeze')
  step('Snapped layer cannot be grabbed again')

  // If the controller disconnects the layer returns to the shelf, no attempt counted.
  await x.hold(DRUM)
  const shelfDrum = (await x.d()).layer.at(DRUM)
  await x.move(DRUM, await x.home(DRUM), 'right', [0.3, 0, 0])
  await page.evaluate(() => __sim.setConnected('right', false))
  await x.frame(4)
  await x.settleDown()
  assert.deepEqual((await x.d()).layer[DRUM], shelfDrum, 'layer of the disconnected controller did not return to the shelf')
  await page.evaluate(() => __sim.setConnected('right', true))
  await x.frame(4)
  step('Controller disconnected: layer returned to the shelf')

  // Second layer with the left hand, the last with the right.
  await x.placeAt(DRUM, 'left')
  assert.ok(atHome((await x.d()).layer[DRUM]), 'drum did not snap')
  step('Drums snapped with the left controller')
  await x.clearWritings()
  await x.placeAt(DOME)
  await page.waitForFunction(() => !__t.xr.inAssembly(), null, { polling: 50 })
  await x.frame(2)
  d = await x.d()
  assert.ok(d.layer.every(atHome), `not all in place: ${d.layer}`)
  assert.ok(d.menu, 'menu did not reopen')
  assert.deepEqual(d.child, [0, 0, 0], 'layer names left behind')
  assert.equal(d.cameraChild, 2, 'completion message disappeared immediately')
  writing = await x.writings()
  assert.ok(writing.includes('Tamamlandı: 3/3 katman yerinde') && writing.includes('Maket birleşti.'), `completion message: ${writing}`)
  assert.ok(writing.includes('Maketi birleştir'), `menu did not return to normal: ${writing}`)
  await x.panel('3-panel-done')
  await x.menu('3-menu-normal')
  step('All snapped: completion message, normal menu', { layer: d.layer })
  step('Frame: done', await x.save('3-done'))
  await page.waitForFunction(() => __t.camera.children.length === 1, null, { polling: 100, timeout: 20000 })
  step('Completion message cleared by itself, "Temsilî" label remained')

  // Restart: while holding a layer.
  await x.begin()
  await x.placeAt(ROOF)
  await x.hold(DRUM, 'left')
  await page.evaluate(() => __b.controllerScroll('left', [0, 0.1, 0]))
  await x.frame()
  await x.press('right', 'b-button'); await x.release('right', 'b-button')
  assert.ok((await x.d()).menu, 'menu did not open with B')
  await x.menu('4-menu-game')
  await x.item(0, 3)
  await x.frame(3)
  d = await x.d()
  assert.ok(d.inAssembly && !d.menu)
  assert.ok(d.layer.every((k) => !atHome(k)), `not all on the shelf after restart: ${d.layer}`)
  assert.deepEqual(d.child, [1, 1, 1])
  await page.evaluate(() => __b.controllerScroll('left', [0, 0.1, 0]))
  const onShelf = (await x.d()).layer
  await x.frame(3)
  assert.deepEqual((await x.d()).layer, onShelf, 'layer stayed in hand')
  await x.release('left', 'squeeze')
  step('Menu: restart while holding a layer; all on the shelf, none left in hand')

  // Quit assembly.
  await x.press('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(1, 3)
  await page.waitForFunction(() => !__t.xr.inAssembly(), null, { polling: 50 })
  await x.frame(20)
  d = await x.d()
  assert.ok(d.layer.every(atHome) && d.menu && d.cameraChild === 1, JSON.stringify(d))
  step('Menu: "Birleştirmeyi bırak"; layers at home, normal menu')

  // Shatter and enter still work after the game; no game item while fragmented, game does not start fragmented.
  await x.item(1, 4)
  await x.frame(3)
  d = await x.d()
  assert.ok(d.fragmented && d.layer.every((k) => k[1] > 0 && k[0] === 0 && k[2] === 0), `shatter: ${d.layer}`)
  await x.item(1, 3)
  await x.frame(3)
  d = await x.d()
  assert.ok(!d.fragmented && d.layer.every(atHome), `assemble: ${d.layer}`)
  await x.begin()
  assert.ok(!(await x.d()).layer.some(atHome))
  await x.press('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(1, 3)
  await page.waitForFunction(() => !__t.xr.inAssembly(), null, { polling: 50 })
  await x.frame(20)
  await x.item(0, 4)
  await page.waitForFunction(() => __t.inside, null, { polling: 50 })
  await x.frame(20)
  d = await x.d()
  assert.ok(d.layer.every(atHome) && d.rig.scale === 1, JSON.stringify(d))
  step('After the game, "Parçala", "Birleştir" and "İçeri gir" work')
  await x.press('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(0, 10)
  await page.waitForFunction(() => !__t.inside, null, { polling: 50 })
  await x.frame(20)
  assert.ok(!(await x.d()).inside)

  // Exit from the menu mid-game.
  await x.begin()
  await x.placeAt(ROOF)
  await x.press('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(2, 3)
  await page.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await page.getByRole('button', { name: "VR'da aç" }).waitFor()
  await page.waitForFunction(() => document.querySelector('.model-control button') && !document.querySelector('.model-control button').disabled)
  d = await x.d()
  const desktopOk = (d, name) => {
    assert.ok(!d.presenting && !d.inAssembly, name)
    assert.ok(d.layer.every(atHome), `${name}: layers not at home: ${d.layer}`)
    assert.deepEqual(d.child, [0, 0, 0], `${name}: name panels left behind`)
    assert.equal(d.cameraChild, 0, `${name}: panel left on the camera`)
    assert.equal(d.cameraParent, null, name)
    assert.equal(d.sceneChild, first.sceneChild, `${name}: object left in the scene`)
    assert.deepEqual([d.near, d.far, d.control], [first.near, first.far, first.control], name)
  }
  desktopOk(d, 'exit from menu')
  step('Menu: "VR\'dan çık" mid-game; desktop clean')

  // External close while holding a layer (session.end instead of the Meta button).
  await x.enter()
  await x.begin()
  await x.hold(DOME)
  await page.evaluate(() => __b.controllerScroll('right', [0, 0.1, 0]))
  await x.frame()
  await page.evaluate(() => __sim.finish())
  await page.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await page.getByRole('button', { name: "VR'da aç" }).waitFor()
  await x.frame(3)
  desktopOk(await x.d(), 'external close')
  step('External close while holding a layer: desktop clean')

  // Desktop "Parçala" still moves only along y.
  await page.getByRole('button', { name: /Parçala/ }).click()
  await page.waitForFunction(() => __t.layers[2].group.position.y > 20, null, { polling: 100 })
  d = await x.d()
  assert.ok(d.layer.every((k) => k[0] === 0 && k[2] === 0), `desktop shatter: ${d.layer}`)
  step('Desktop "Parçala" works')

  assert.deepEqual(errors, [], 'console error')
  step('Konsol temiz')
  console.log(`Model assembly VR simulation: ${audit} checks passed.`)
} finally { await browser.close() }
