// Vazo atölyesi WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager. Gerçek cihaz yerine geçmez.
// Hazırlık ve çalıştırma için bkz. kur.sh. Kumanda olayları gerçek akıştan gelir; tutma ve bırakma kumanda hareketiyle yapılır.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const SCREEN = S + '/screen-vase'
mkdirSync(SCREEN, { recursive: true })
const SURE = 180000
// Yazılımsal çizim yavaştır (paylaşılan makinede 1. senaryo ~9 dk). Mac'te ANGLE=metal çok daha hızlı.
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
const SCENARIOS = (process.env.SCENARIO ?? '1,2,3').split(',')
const STEPS = []
const step = (ad, stand = '') => { STEPS.push(ad); console.log(`GEÇTİ  ${ad}${stand ? ' ' + JSON.stringify(stand) : ''}`) }

async function ac(preparation) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
  const errors = []
  page.on('pageerror', (e) => { errors.push('pageerror: ' + e); if (process.env.SIM_DETAIL) console.log('pageerror', e.stack) })
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.setDefaultTimeout(SURE)
  await page.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
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
    // Panelin düğmesine nişan alır: i. düğmenin ortası.
    buttonPoint: (i) => sim().panelPoint(window.__v.panel(), i === 0 ? 0.265 : 0.735, 0.19),
    label: () => { const e = t().camera.children[0]; return e ? { var: true, visible: e.visible, depth: e.material.depthTest, png: e.material.map.image.toDataURL('image/png') } : { var: false } },
    panelPng: () => window.__v.panel().material.map.image.toDataURL('image/png'),
    // Kumandayı bir noktaya çevirir, yerini elle verilen konuma alır.
    placeController: (el, position, target) => {
      const { THREE } = t(), k = sim().d.controllers[el]
      const C = new THREE.Vector3(...position), y = new THREE.Vector3(...target).sub(C).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
      k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
    },
    controllerScroll: (el, d) => { const k = sim().d.controllers[el]; k.position.set(k.position.x + d[0], k.position.y + d[1], k.position.z + d[2]) },
    rotateController: (el, rad) => { const { THREE } = t(), k = sim().d.controllers[el]; const q = new THREE.Quaternion(k.quaternion.x, k.quaternion.y, k.quaternion.z, k.quaternion.w).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad)); k.quaternion.set(q.x, q.y, q.z, q.w) },
    // Uygulamaya gamepad yok görünür; IWER'in kendi tuş işlemesi aynı alandan okuduğu için ona gerçeği döner.
    removeGamepad: () => {
      window.__gamepadRead = 0
      for (const k of sim().d.activeSession.inputSources) {
        const actual = k.gamepad
        Object.defineProperty(k, 'gamepad', { configurable: true, get() {
          // Yalnız doğrudan çağıran bakılır: XR karesi zaten IWER'in içinden başlar.
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
    head: async (el, button) => { await s.evaluate(([e, d]) => __sim.head(e, d, 1), [el, button]); await x.frame() },
    release: async (el, button) => { await s.evaluate(([e, d]) => __sim.head(e, d, 0), [el, button]); await x.frame() },
    put: async (el, position, target) => { await s.evaluate(([e, k, h]) => __v.placeController(e, k, h), [el, position, target]); await x.frame() },
    scroll: async (el, d) => { await s.evaluate(([e, d]) => __v.controllerScroll(e, d), [el, d]); await x.frame() },
    rotate: async (el, r) => { await s.evaluate(([e, r]) => __v.rotateController(e, r), [el, r]); await x.frame() },
    enter: async () => {
      await s.getByRole('button', { name: "VR'da aç" }).click()
      await s.waitForFunction(() => window.__t.renderer.xr.isPresenting && window.__t.camera.parent, null, { polling: 100 })
      await x.frame(5)
      await s.getByRole('button', { name: "VR'dan çık" }).waitFor()
    },
    /** Paneldeki düğmeye nişan alıp tetikle basar. */
    panel: async (i, el = 'right') => {
      const n = await s.evaluate((i) => __v.buttonPoint(i), i)
      await x.put(el, el === 'right' ? [0.15, 1.2, -0.1] : [-0.15, 1.2, -0.1], n)
      await x.head(el, 'trigger'); await s.evaluate((e) => __sim.head(e, 'trigger', 0), el)
      await x.frame().catch(() => {})
    },
    /** Parçaya uzaktan nişan alır ve tutar. */
    teleportHold: async (id, el = 'right') => {
      const p = await s.evaluate((i) => __v.pieceLocal(i), id)
      const k = [p[0] * 0.3 + (el === 'right' ? 0.1 : -0.1), p[1] + 0.45, p[2] + 0.55]
      await x.put(el, k, p)
      await x.head(el, 'trigger')
      assert.equal((await x.d()).selected, id, `ışınla parça ${id} tutulamadı`)
    },
    /** Elinle tutarken parçayı verilen noktaya taşır (kumanda aynı kadar gider). */
    move: async (id, target, el = 'right') => {
      const p = await s.evaluate((i) => __v.pieceLocal(i), id)
      await x.scroll(el, [target[0] - p[0], target[1] - p[1], target[2] - p[2]])
    },
    /** Tutar, hedefine götürür, bırakır, oturmasını bekler. */
    placeAt: async (id, el = 'right', keyBtn = 'trigger') => {
      if (keyBtn === 'trigger') await x.teleportHold(id, el)
      else {
        const p = await s.evaluate((i) => __v.pieceLocal(i), id)
        await x.put(el, [p[0], p[1], p[2] + 0.02], [p[0], p[1], p[2] - 1])
        await x.head(el, 'squeeze')
        assert.equal((await x.d()).selected, id, `sıkmayla parça ${id} tutulamadı`)
      }
      await x.move(id, await s.evaluate((i) => __v.targetLocal(i), id), el)
      await x.release(el, keyBtn)
      await s.waitForFunction((i) => window.__t.state.placed.includes(i) && window.__t.motion === 0, id, { polling: 50 })
      await x.frame(2)
    },
    save: async (ad) => {
      const r = await s.evaluate(() => __sim.capture())
      writeFileSync(`${SCREEN}/${ad}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { left: r.left, right: r.right, eyeDiff: r.eyeDiff }
    },
    png: async (expression, ad) => {
      const u = await s.evaluate(expression)
      writeFileSync(`${SCREEN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64'))
    },
  }
  return x
}

const SHELF_TOL = 0.1
function desktopReturned(d, first, ad) {
  assert.equal(d.presenting, false, ad + ': hâlâ sunuyor')
  assert.equal(d.cameraParent, null, ad + ': kamera rig içinde')
  assert.equal(d.cameraChild, 0, ad + ': kameraya etiket takılı kaldı')
  assert.deepEqual([d.near, d.far, d.fov, d.ratio], [first.near, first.far, first.fov, first.ratio], ad + ': kamera veya piksel oranı dönmedi')
  assert.deepEqual(d.canvasEl, first.canvasEl, ad + ': tuval boyutu dönmedi')
  assert.deepEqual(d.cameraScale, [1, 1, 1], ad + ': kamera ölçeği')
  assert.equal(d.base, 1, ad + ': masaüstü tablası dönmedi')
  assert.equal(d.control, true, ad + ': kamera kontrolü kapalı kaldı')
  assert.equal(d.sceneChild, first.sceneChild, ad + ': sahnede rig, panel veya ortam kaldı')
  assert.ok(d.pieceParentScene && d.traceParentScene && d.intactParentScene, ad + ': dayanakta nesne kaldı')
  assert.deepEqual(d.tracePos, first.tracePos, ad + ': onarım izleri yerinden oynadı')
}

try {
  // ---------- 1. Baştan sona, iki kumanda ----------
  if (SCENARIOS.includes('1')) {
    const { page, errors, x } = await ac()
    const first = await x.d()
    assert.ok(first.intact && !first.repair)
    await x.enter()
    let d = await x.d()
    assert.equal(d.rig.scale, 100)
    assert.ok(d.presenting && d.intact && !d.repair && d.pieceVisible.every((v) => !v), 'VR izsiz vazoyla başlamadı')
    // Kullanıcıya yakın: yatayda 70 cm, başın altında.
    assert.ok(Math.abs(Math.hypot(d.head[0], d.head[2]) - 70) < 1, `vazo uzak: ${d.head}`)
    const label = await page.evaluate(() => __v.label())
    assert.ok(label.var && label.visible && label.depth === false, 'Temsilî etiketi başa bağlı değil')
    await x.png(() => __v.label().png, 'label')
    await x.png(() => __v.panelPng(), '1-panel-traceless')
    step("VR'da aç: izsiz vazo masada 1:1, 70 cm önde; Temsilî etiketi başa bağlı", { rig: d.rig, head: d.head })
    step('Kare: izsiz', await x.save('1-traceless'))

    // İzsiz vazoda parça tutulamaz, bütün vazo tutulup çevrilir.
    await x.put('left', [-0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.head('left', 'trigger')
    await x.frame(4)
    d = await x.d()
    assert.equal(d.selected, null)
    assert.equal(d.intactParentScene, false, 'izsiz vazo ele alınmadı')
    await x.release('left', 'trigger')
    await x.frame(30)
    d = await x.d()
    assert.ok(d.pieceFar.every((v) => v < 0.2), `izsiz vazo masaya dönmedi: ${d.pieceFar}`)
    step('İzsiz vazo ele alındı, masaya döndü; görünmez parça tutulmadı')

    await x.panel(0)
    await page.waitForFunction(() => __t.state.repair)
    await x.frame(2)
    d = await x.d()
    assert.ok(!d.intact && d.silhouette && d.pieceVisible.every(Boolean) && d.pieceParentScene && d.intactParentScene, JSON.stringify(d))
    assert.ok(d.shelfFar.every((v) => v < SHELF_TOL), `parçalar rafta değil: ${d.shelfFar}`)
    assert.equal(d.base < 1, true, 'VR tablası uygulanmadı')
    await x.png(() => __v.panelPng(), '2-panel-repair')
    step('Panel: Vazoyu parçala; parçalar tablada, siluet görünür', { shelfFar: d.shelfFar })
    step('Kare: parçalandı', await x.save('2-fragmented'))

    // Yanlış bırakma: masaüstündeki yol, geri döner, deneme sayılır, yerleşmez.
    await x.teleportHold(0)
    const once = (await x.d()).shelfFar[0]
    await x.scroll('right', [0.05, 0.12, 0])
    assert.ok((await x.d()).shelfFar[0] > once + 5, 'parça kumandayla gitmedi')
    await x.release('right', 'trigger')
    await page.waitForFunction(() => __t.motion === 0, null, { polling: 50 })
    d = await x.d()
    assert.deepEqual(d.placed, [])
    assert.ok(d.shelfFar[0] < SHELF_TOL, 'yanlış bırakılan parça rafa dönmedi')
    assert.match(await page.locator('.vase-message').textContent(), /henüz yerine yaklaşmadı/)
    await page.getByText('Deneme: 1').waitFor()
    await x.png(() => __v.panelPng(), '3-panel-wrong')
    step('Yanlış bırakma: parça rafa döndü, deneme 1, yerleşen 0')

    // Eşik sınırı: hedefin hemen dışı oturmaz, içi oturur (masaüstü işlevi yerineOturur, eşik 9 cm).
    await x.teleportHold(0)
    const h0 = await page.evaluate(() => __v.targetLocal(0))
    await x.move(0, [h0[0] + 0.095, h0[1], h0[2]])
    await x.release('right', 'trigger')
    await page.waitForFunction(() => __t.motion === 0, null, { polling: 50 })
    assert.deepEqual((await x.d()).placed, [], '9,5 cm oturdu')
    await x.teleportHold(0)
    await x.move(0, [h0[0] + 0.085, h0[1], h0[2]])
    await x.release('right', 'trigger')
    await page.waitForFunction(() => __t.state.placed.includes(0) && __t.motion === 0, null, { polling: 50 })
    d = await x.d()
    assert.ok(d.pieceFar[0] < 0.1, 'oturan parça hedefe gitmedi')
    step('Eşik: 9,5 cm oturmadı, 8,5 cm otomatik oturdu', { piece0: d.pieceFar[0] })

    await x.placeAt(1)                 // ışın + tetik
    await x.placeAt(2, 'left')         // öteki kumanda
    step('Işın + tetik, iki kumandayla parça 2 ve 3 yerleşti')
    await x.placeAt(3, 'right', 'squeeze') // değerek + sıkma
    step('Sıkma tuşuyla, değerek parça 4 yerleşti')
    await x.placeAt(4, 'left', 'squeeze')
    await x.placeAt(5)
    await page.waitForFunction(() => __t.state.placed.length === 6 && __t.motion === 0, null, { polling: 50 })
    await x.frame(3)
    d = await x.d()
    assert.ok(d.traces && !d.silhouette && !d.intact, 'onarım izleri görünmedi')
    assert.ok(d.pieceFar.every((v) => v < 0.1), `parçalar yerinde değil: ${d.pieceFar}`)
    await page.getByText('Vazo onarıldı!').first().waitFor()
    await x.png(() => __v.panelPng(), '4-panel-done')
    step('Tamamlandı: 6/6, onarım izleri görünür, siluet gizli', { pieceFar: d.pieceFar })
    step('Kare: tamam', await x.save('3-done'))

    // İnceleme: bütün vazo elde gider, izler birlikte taşınır, bırakınca masaya döner.
    const izEv = d.tracePos
    await x.put('right', [0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.head('right', 'trigger')
    await x.rotate('right', 0.9)
    await x.scroll('right', [0, 0.1, 0.05])
    await x.frame(8)
    d = await x.d()
    assert.equal(d.traceParentScene, false, 'vazo ele alınmadı')
    assert.notDeepEqual(d.tracePos, izEv, 'izler vazoyla gitmedi')
    step('İnceleme: vazo elde, izler birlikte', { tracePos: d.tracePos })
    step('Kare: inceleme', await x.save('4-inspection'))
    await x.release('right', 'trigger')
    await x.frame(30)
    d = await x.d()
    assert.ok(d.pieceFar.every((v) => v < 0.2), `bırakınca masaya dönmedi: ${d.pieceFar}`)
    step('Bırakınca vazo masaya döndü', { pieceFar: d.pieceFar })

    // Elde vazo varken öteki kumandayla panelden yeniden başlat.
    await x.put('left', [-0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.head('left', 'trigger')
    await x.scroll('left', [0, 0.1, 0])
    await x.frame(5)
    await x.panel(0)
    await page.waitForFunction(() => __t.state.placed.length === 0 && __t.state.repair)
    await x.frame(3)
    d = await x.d()
    assert.ok(d.pieceParentScene && d.traceParentScene, 'dayanak boşalmadı')
    assert.ok(d.shelfFar.every((v) => v < SHELF_TOL), `yeniden başlatınca raf bozuk: ${d.shelfFar}`)
    assert.equal(d.traces, false)
    await x.release('left', 'trigger')
    step('Panel: Yeniden parçala, vazo eldeyken; parçalar rafta', { shelfFar: d.shelfFar })

    // Parça elde varken yeniden başlat; parça elde kalmaz.
    await x.teleportHold(2, 'left')
    await x.scroll('left', [0, 0.1, 0])
    await x.panel(0)
    await x.frame(4)
    await x.release('left', 'trigger')
    await x.scroll('left', [0, 0.1, 0])
    await x.frame(3)
    assert.ok((await x.d()).shelfFar[2] < SHELF_TOL, 'yeniden başlatınca parça elde kaldı')
    step('Panel: Yeniden başlat, parça eldeyken; parça elde kalmadı')

    // Bir parça, sonra panelden çıkış.
    await x.placeAt(0)
    await x.panel(1)
    await page.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await page.waitForFunction(() => __t.frame > 0)
    await page.getByRole('button', { name: "VR'da aç" }).waitFor()
    d = await x.d()
    desktopReturned(d, first, 'panelden çıkış')
    assert.deepEqual(d.placed, [0], 'ilerleme kayboldu')
    assert.equal(await page.locator('.vase-handle:not([hidden])').count(), 5)
    assert.match(await page.locator('.vase-message').textContent(), /1\/6 parça yerinde/)
    assert.ok(await page.getByRole('button', { name: 'Yeniden parçala' }).isEnabled(), 'masaüstü düğmeleri kilitli kaldı')
    await page.locator('.vase-scene canvas').screenshot({ path: `${SCREEN}/5-desktop.png` })
    step("Panel: VR'dan çık; masaüstü kamera, boyut, sahne geri geldi, ilerleme 1/6 korundu", { canvasEl: d.canvasEl, near: d.near, far: d.far })

    // Çıkan oturumun ardından masaüstünde sürükleme hâlâ çalışıyor mu?
    const hold = page.locator('.vase-handle[data-piece-id="1"]')
    await hold.scrollIntoViewIfNeeded()
    const b = await hold.boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down()
    await page.waitForFunction(() => __t.state.selected === 1)
    await page.mouse.move(b.x + 40, b.y + 40, { steps: 3 }); await page.mouse.up()
    await page.waitForFunction(() => document.querySelector('.vase-message').textContent.includes('henüz'))
    step('VR sonrası masaüstünde parça sürükleme çalışıyor')

    // Yeniden giriş: yarım onarım sürer.
    await x.enter()
    d = await x.d()
    assert.deepEqual(d.placed, [0])
    assert.ok(d.shelfFar.slice(1).every((v) => v < SHELF_TOL), `yeniden girişte raf bozuk: ${d.shelfFar}`)
    step('Yeniden giriş: yarım onarım VR\'da sürüyor')

    // Meta düğmesi: oturum dışarıdan kapanır, parça eldeyken.
    await x.teleportHold(1)
    await x.scroll('right', [0, 0.1, 0])
    await page.evaluate(() => __sim.finish())
    await page.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await page.getByRole('button', { name: "VR'da aç" }).waitFor()
    await page.waitForFunction(() => __t.frame > 0)
    d = await x.d()
    desktopReturned(d, first, 'dışarıdan kapanış')
    assert.deepEqual(d.placed, [0], 'kopan tutuş yerleşti')
    assert.ok(d.shelfFar[1] < SHELF_TOL, 'elde kalan parça masaüstü rafına dönmedi')
    step('Dışarıdan kapanış (Meta düğmesi yerine session.end), parça eldeyken: masaüstü geri geldi, parça rafta')

    assert.deepEqual(errors, [], 'konsol hatası')
    step('Senaryo 1 konsol temiz')
    await page.context().close()
  }

  // ---------- 2. Tek kumanda, gamepad yok, baş dönük ----------
  if (SCENARIOS.includes('2')) {
    const { page, errors, x } = await ac(() => { __sim.headYaw(0.8); __sim.hillLink('left', false) })
    await x.enter()
    await page.evaluate(() => __v.removeGamepad())
    await x.frame(3)
    let d = await x.d()
    assert.ok(Math.abs(d.rig.rotY + 0.8) < 0.01, `rig dönmedi: ${d.rig.rotY}`)
    await x.panel(0)
    await page.waitForFunction(() => __t.state.repair)
    await x.frame(2)
    for (let id = 0; id < 6; id++) await x.placeAt(id)
    d = await x.d()
    assert.deepEqual(d.placed, [0, 1, 2, 3, 4, 5])
    assert.ok(d.traces)
    step('Tek kumanda, gamepad yok, baş 46° dönük: 6/6 tamamlandı', { rig: d.rig, appGamepadRead: await page.evaluate(() => window.__gamepadRead), inputCount: await page.evaluate(() => __sim.d.activeSession.inputSources.length) })
    await x.panel(1)
    await page.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    assert.deepEqual(errors, [], 'konsol hatası')
    step('Senaryo 2 konsol temiz')
    await page.context().close()
  }

  // ---------- 3. Kumanda kopması ve rota değişimi ----------
  if (SCENARIOS.includes('3')) {
    const { page, errors, x } = await ac()
    await x.enter()
    await x.panel(0)
    await page.waitForFunction(() => __t.state.repair)
    await x.frame(2)
    await x.teleportHold(0)
    await x.scroll('right', [0, 0.1, 0])
    await page.evaluate(() => __sim.hillLink('right', false))
    await x.frame(4)
    await page.waitForFunction(() => __t.motion === 0, null, { polling: 50 })
    let d = await x.d()
    assert.deepEqual(d.placed, [])
    assert.equal(d.selected, null)
    assert.ok(d.shelfFar[0] < SHELF_TOL, 'kopan kumandanın parçası rafa dönmedi')
    await page.getByText('Deneme: 0').waitFor()
    step('Kumanda koptu: parça rafa döndü, deneme sayılmadı')
    await page.evaluate(() => __sim.hillLink('right', true))
    await x.frame(4)
    await x.placeAt(0)
    step('Kumanda geri geldi: tutma sürüyor')

    const session = await page.evaluateHandle(() => { const o = __sim.d.activeSession; window.__last = { done: false }; o.addEventListener('end', () => { window.__last.done = true }); return o })
    await session.dispose()
    // IWER'in tam ekran tuvali sayfayı örter: fare yerine doğrudan tıklama olayı.
    await page.getByRole('link', { name: 'Ana sayfaya dön' }).dispatchEvent('click')
    await page.waitForFunction(() => window.__last.done, null, { polling: 100 })
    await page.waitForFunction(() => !document.querySelector('.vase-scene canvas'))
    await page.waitForTimeout(500)
    assert.deepEqual(errors, [], 'rota değişiminde hata')
    step('VR açıkken rota değişti: oturum kapandı, tuval kalktı, konsol temiz')
    await page.context().close()
  }
  console.log(`Vazo VR simülasyonu: ${STEPS.length} denetim geçti.`)
} finally { await browser.close() }
