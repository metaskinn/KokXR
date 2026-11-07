// Ulu Camii maket birleştirme, WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager. Gerçek cihaz yerine geçmez.
// Hazırlık ve çalıştırma için bkz. kur.sh. Kumanda olayları gerçek akıştan gelir; tutma ve bırakma kumanda hareketiyle yapılır.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const SCREEN = S + '/screen-assemble'
mkdirSync(SCREEN, { recursive: true })
const SURE = 180000
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
let audit = 0
const step = (ad, stand = '') => { audit++; console.log(`GEÇTİ  ${ad}${stand ? ' ' + JSON.stringify(stand) : ''}`) }
const ROOF = 0, DRUM = 1, DOME = 2

function pageHelpers() {
  // Tuvale yazılan her metin: uyarının gerçekten çizildiğini ve kare döngüsünde çizim olmadığını gösterir.
  window.__texts = []
  const actual = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (m, ...a) { window.__texts.push(m); return actual.call(this, m, ...a) }
  const t = () => window.__t, sim = () => window.__sim
  const ev = []
  window.__b = {
    // Etiketler katmanın çocuğu olmadan, oyundan önce çağrılır.
    measure: () => {
      const { THREE, layers } = t()
      layers.forEach(({ group }, i) => {
        const k = new THREE.Box3().setFromObject(group)
        ev[i] = k.getCenter(new THREE.Vector3()).sub(group.position)
      })
    },
    centerLocal: (id) => {
      const r = sim().rig(); r.updateWorldMatrix(true, false)
      return r.worldToLocal(ev[id].clone().add(t().layers[id].group.position)).toArray()
    },
    homeLocal: (id) => { const r = sim().rig(); r.updateWorldMatrix(true, false); return r.worldToLocal(ev[id].clone()).toArray() },
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
        menu: menu?.visible ?? false, cameraChild: camera.children.length, cameraParent: camera.parent?.type ?? null, sceneChild: scene.children.length,
        rig: camera.parent ? { p: camera.parent.position.toArray().map((v) => Number(v.toFixed(2))), rotY: Number(camera.parent.rotation.y.toFixed(3)), scale: camera.parent.scale.x } : null,
        near: camera.near, far: camera.far, control: T.controls.enabled,
      }
    },
    panelPng: () => t().camera.children.find((c) => c.geometry?.parameters?.height > 0.1)?.material.map.image.toDataURL('image/png'),
  }
}

async function ac() {
  const page = await (await browser.newContext({ viewport: { width: 960, height: 540 } })).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e))
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) errors.push(m.text()) })
  page.setDefaultTimeout(SURE)
  await page.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
  await page.addInitScript({ path: S + '/sim-page.js' })
  await page.addInitScript(pageHelpers)
  await page.goto(`${url}/artifact/ulu-mosque`)
  await page.getByRole('button', { name: /maketini eline al/ }).click()
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
    head: async (el, button) => { await s.evaluate(([e, d]) => __sim.head(e, d, 1), [el, button]); await x.frame() },
    release: async (el, button) => { await s.evaluate(([e, d]) => __sim.head(e, d, 0), [el, button]); await x.frame() },
    enter: async () => {
      await s.getByRole('button', { name: "VR'da aç" }).click()
      await s.waitForFunction(() => window.__t.renderer.xr.isPresenting && window.__t.camera.parent && __sim.menu().visible, null, { polling: 100 })
      await x.frame(3)
    },
    /** Menünün i. öğesine (n öğeden) tetikle basar. */
    item: async (i, n, el = 'right') => {
      const point = await s.evaluate(([i, n]) => __sim.menuItemPoint(i, n), [i, n])
      await s.evaluate(([el, point]) => __sim.aim(point, el), [el, point])
      await x.frame(2)
      await x.head(el, 'trigger')
      await s.evaluate((el) => __sim.head(el, 'trigger', 0), el)
      await x.frame(2).catch(() => {})
    },
    writeMenu: async () => { await s.evaluate(() => { window.__texts.length = 0 }) },
    writings: () => s.evaluate(() => [...window.__texts]),
    /** Birleştirmeye girer ve geçişin bitmesini bekler. */
    begin: async (n = 4, i = 2) => {
      await x.item(i, n)
      await s.waitForFunction(() => __t.xr.inAssembly(), null, { polling: 50 })
      await x.frame(20) // karartma biter
    },
    /** Katmana uzaktan nişan alıp kavrar. */
    hold: async (id, el = 'right', keyBtn = 'squeeze') => {
      const m = await s.evaluate((i) => __b.centerLocal(i), id)
      const k = [el === 'right' ? 0.25 : -0.25, 1.2, -0.35]
      await s.evaluate(([e, k, m]) => __b.placeController(e, k, m), [el, k, m])
      await x.frame(2)
      await x.head(el, keyBtn)
    },
    /** Tutulan katmanı `hedef`e götürür: el yolu kazancın yarısı. `pay`: hedefin yanına bırakma. */
    move: async (id, target, el = 'right', share = [0, 0, 0]) => {
      const m = await s.evaluate((i) => __b.centerLocal(i), id)
      const d = [0, 1, 2].map((a) => (target[a] + share[a] - m[a]) / 2)
      await s.evaluate(([e, d]) => __b.controllerScroll(e, d), [el, d])
      await x.frame()
    },
    ev: (id) => s.evaluate((i) => __b.homeLocal(i), id),
    /** Süzülmeler bitene dek bekler. */
    settleDown: async () => {
      let once = JSON.stringify((await x.d()).layer)
      for (let i = 0; i < 400; i++) {
        await x.frame(4)
        const now = JSON.stringify((await x.d()).layer)
        if (now === once) return
        once = now
      }
      throw new Error('katmanlar durmadı')
    },
    placeAt: async (id, el = 'right') => {
      await x.hold(id, el)
      await x.move(id, await x.ev(id), el)
      await x.release(el, 'squeeze')
      await x.settleDown()
    },
    save: async (ad) => {
      const r = await s.evaluate(() => __sim.capture())
      writeFileSync(`${SCREEN}/${ad}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { left: r.left, right: r.right }
    },
    panel: async (ad) => { const u = await s.evaluate(() => __b.panelPng()); writeFileSync(`${SCREEN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64')) },
    menu: async (ad) => { const u = await s.evaluate(() => __sim.texPng('menu')); writeFileSync(`${SCREEN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64')) },
  }
  return x
}
const atHome = (k) => k.every((v) => v === 0)

try {
  const { page, errors, x } = await ac()
  const first = await x.d()
  await x.enter()
  await x.menu('0-menu-normal')

  // Rafta: katmanlar kullanıcının sağında, üst üste binmeden.
  await x.begin()
  let d = await x.d()
  assert.ok(d.inAssembly && !d.menu, 'oyun açılmadı veya menü kapanmadı')
  assert.equal(d.rig.scale, 100)
  assert.equal(d.cameraChild, 2, 'etiket ve durum paneli başa bağlı değil')
  assert.deepEqual(d.child, [1, 1, 1], 'katman adları yok')
  const shelves = await Promise.all([ROOF, DRUM, DOME].map((i) => page.evaluate((i) => __b.centerLocal(i), i)))
  assert.ok(shelves.every((r) => r[0] > 0.5), `raf sağda değil: ${shelves}`)
  assert.ok(shelves[DOME][1] < shelves[DRUM][1] && shelves[DRUM][1] < shelves[ROOF][1], `raf sırası: ${shelves}`)
  assert.ok(!d.layer.some(atHome), 'katman evinde kaldı')
  await x.panel('1-panel-first')
  step('Menü: Maketi birleştir; katmanlar sağda rafta, menü kapalı, etiket ve panel başa bağlı', { shelves })
  step('Kare: raf', await x.save('1-shelf'))

  // Çizim yalnız durum değişince: bekleyen ve nişan alınan karelerde tuvale yazı yok.
  await x.writeMenu()
  await page.evaluate(([k, m]) => __b.placeController('right', k, m), [[0.25, 1.2, -0.35], shelves[ROOF]])
  await x.frame(30)
  assert.deepEqual(await x.writings(), [], 'kare döngüsünde doku çizildi')
  step('30 karede tuvale çizim yok')

  // Çubuk oyunda maketi oynatmaz.
  const rig0 = (await x.d()).rig
  await page.evaluate(() => __sim.bar('right', 1, 1))
  await x.frame(6)
  await page.evaluate(() => __sim.bar('right', 0, 0))
  await x.frame(2)
  assert.deepEqual((await x.d()).rig, rig0, 'çubuk oyunda rig oynattı')
  step('Sağ çubuk oyunda rig oynatmıyor')

  // Tetik tutmaz, kavrama tutar.
  await x.hold(ROOF, 'right', 'trigger')
  const once = (await x.d()).layer[ROOF]
  await page.evaluate(() => __b.controllerScroll('right', [0, 0.1, 0]))
  await x.frame()
  assert.deepEqual((await x.d()).layer[ROOF], once, 'tetik katmanı tuttu')
  await x.release('right', 'trigger')
  step('Tetik katman tutmuyor')

  // Yanlış sıra: Kubbeler önce.
  await x.hold(DOME)
  const shelfDome = (await x.d()).layer[DOME]
  await x.move(DOME, await x.ev(DOME))
  d = await x.d()
  assert.ok(Math.hypot(...d.layer[DOME]) < 3, `kubbe hedefe gitmedi: ${d.layer[DOME]}`)
  step('Kare: yanlış sıra tutuluyor', await x.save('2-wrong-held'))
  await x.writeMenu()
  await x.release('right', 'squeeze')
  await x.settleDown()
  d = await x.d()
  assert.deepEqual(d.layer[DOME], shelfDome, `kubbe rafa dönmedi: ${d.layer[DOME]}`)
  assert.ok(d.inAssembly)
  let writing = await x.writings()
  assert.ok(writing.includes('Önce Çatı oturmalı. Sıra alttan üste gider.'), `uyarı yok: ${writing}`)
  assert.ok(writing.includes('Maketi birleştir: 0/3 katman yerinde'), `ilerleme: ${writing}`)
  assert.ok(writing.some((m) => /maketin üst üste oturma sırasıdır/.test(m)), 'sıra notu yok')
  await x.panel('2-panel-warning')
  step('Yanlış sıra: Kubbeler oturmadı, rafa döndü, Türkçe uyarı çizildi', { writing })

  // Yakın değil: Çatı hedefin eşiği dışında bırakılır.
  await x.hold(ROOF)
  const shelfRoof = (await x.d()).layer[ROOF]
  await x.move(ROOF, await x.ev(ROOF), 'right', [0.25, 0, 0])
  d = await x.d()
  await x.writeMenu()
  await x.release('right', 'squeeze')
  await x.settleDown()
  assert.deepEqual((await x.d()).layer[ROOF], shelfRoof, 'uzak bırakılan çatı rafa dönmedi')
  assert.ok((await x.writings()).includes('Yerine yaklaşmadı. Yeniden dene.'))
  step('Eşik dışı (25 cm): oturmadı, rafa döndü', { releasedOne: d.layer[ROOF] })

  // Eşik içi: 15 cm yanda bırakılan oturur.
  await x.hold(ROOF)
  await x.move(ROOF, await x.ev(ROOF), 'right', [0.15, 0, 0])
  await x.writeMenu()
  await x.release('right', 'squeeze')
  await x.settleDown()
  d = await x.d()
  assert.ok(atHome(d.layer[ROOF]), `çatı oturmadı: ${d.layer[ROOF]}`)
  assert.ok((await x.writings()).includes('Çatı yerine oturdu.'))
  assert.deepEqual(d.child.length, 3)
  step('Çatı 15 cm yakından oturdu, evine süzüldü')

  // Oturan katman yeniden tutulmaz.
  await page.evaluate(([k, m]) => __b.placeController('right', k, m), [[0.25, 1.2, -0.35], await x.ev(ROOF)])
  await x.frame(2)
  await x.head('right', 'squeeze')
  await page.evaluate(() => __b.controllerScroll('right', [0, 0.1, 0]))
  await x.frame()
  assert.ok(atHome((await x.d()).layer[ROOF]), 'oturan katman tutuldu')
  await x.release('right', 'squeeze')
  step('Oturan katman yeniden tutulmuyor')

  // Kumanda koparsa rafa döner, deneme sayılmaz.
  await x.hold(DRUM)
  const shelfDrum = (await x.d()).layer.at(DRUM)
  await x.move(DRUM, await x.ev(DRUM), 'right', [0.3, 0, 0])
  await page.evaluate(() => __sim.hillLink('right', false))
  await x.frame(4)
  await x.settleDown()
  assert.deepEqual((await x.d()).layer[DRUM], shelfDrum, 'kopan kumandanın katmanı rafa dönmedi')
  await page.evaluate(() => __sim.hillLink('right', true))
  await x.frame(4)
  step('Kumanda koptu: katman rafa döndü')

  // İkinci katman sol elle, sonuncusu sağla.
  await x.placeAt(DRUM, 'left')
  assert.ok(atHome((await x.d()).layer[DRUM]), 'kasnak oturmadı')
  step('Sol kumandayla Kasnaklar oturdu')
  await x.writeMenu()
  await x.placeAt(DOME)
  await page.waitForFunction(() => !__t.xr.inAssembly(), null, { polling: 50 })
  await x.frame(2)
  d = await x.d()
  assert.ok(d.layer.every(atHome), `hepsi yerinde değil: ${d.layer}`)
  assert.ok(d.menu, 'menü geri açılmadı')
  assert.deepEqual(d.child, [0, 0, 0], 'katman adları kaldı')
  assert.equal(d.cameraChild, 2, 'tamamlandı mesajı hemen kalktı')
  writing = await x.writings()
  assert.ok(writing.includes('Tamamlandı: 3/3 katman yerinde') && writing.includes('Maket birleşti.'), `tamamlandı mesajı: ${writing}`)
  assert.ok(writing.includes('Maketi birleştir'), `menü normale dönmedi: ${writing}`)
  await x.panel('3-panel-done')
  await x.menu('3-menu-normal')
  step('Hepsi oturdu: tamamlandı mesajı, normal menü', { layer: d.layer })
  step('Kare: tamam', await x.save('3-done'))
  await page.waitForFunction(() => __t.camera.children.length === 1, null, { polling: 100, timeout: 20000 })
  step('Tamamlandı mesajı kendiliğinden kalktı, Temsilî etiketi kaldı')

  // Yeniden başlat: katman eldeyken.
  await x.begin()
  await x.placeAt(ROOF)
  await x.hold(DRUM, 'left')
  await page.evaluate(() => __b.controllerScroll('left', [0, 0.1, 0]))
  await x.frame()
  await x.head('right', 'b-button'); await x.release('right', 'b-button')
  assert.ok((await x.d()).menu, 'B ile menü açılmadı')
  await x.menu('4-menu-game')
  await x.item(0, 3)
  await x.frame(3)
  d = await x.d()
  assert.ok(d.inAssembly && !d.menu)
  assert.ok(d.layer.every((k) => !atHome(k)), `yeniden başlatınca hepsi rafta değil: ${d.layer}`)
  assert.deepEqual(d.child, [1, 1, 1])
  await page.evaluate(() => __b.controllerScroll('left', [0, 0.1, 0]))
  const onShelf = (await x.d()).layer
  await x.frame(3)
  assert.deepEqual((await x.d()).layer, onShelf, 'katman elde kaldı')
  await x.release('left', 'squeeze')
  step('Menü: Yeniden başlat, katman eldeyken; hepsi rafta, elde kalmadı')

  // Birleştirmeyi bırak.
  await x.head('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(1, 3)
  await page.waitForFunction(() => !__t.xr.inAssembly(), null, { polling: 50 })
  await x.frame(20)
  d = await x.d()
  assert.ok(d.layer.every(atHome) && d.menu && d.cameraChild === 1, JSON.stringify(d))
  step('Menü: Birleştirmeyi bırak; katmanlar evde, normal menü')

  // Oyun sonrası parçala ve içeri gir bozulmadı; parçalıyken oyun öğesi yok, oyun parçalıdan başlamaz.
  await x.item(1, 4)
  await x.frame(3)
  d = await x.d()
  assert.ok(d.fragmented && d.layer.every((k) => k[1] > 0 && k[0] === 0 && k[2] === 0), `parçala: ${d.layer}`)
  await x.item(1, 3)
  await x.frame(3)
  d = await x.d()
  assert.ok(!d.fragmented && d.layer.every(atHome), `birleştir: ${d.layer}`)
  await x.begin()
  assert.ok(!(await x.d()).layer.some(atHome))
  await x.head('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(1, 3)
  await page.waitForFunction(() => !__t.xr.inAssembly(), null, { polling: 50 })
  await x.frame(20)
  await x.item(0, 4)
  await page.waitForFunction(() => __t.inside, null, { polling: 50 })
  await x.frame(20)
  d = await x.d()
  assert.ok(d.layer.every(atHome) && d.rig.scale === 1, JSON.stringify(d))
  step('Oyundan sonra Parçala, Birleştir ve İçeri gir çalışıyor')
  await x.head('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(0, 10)
  await page.waitForFunction(() => !__t.inside, null, { polling: 50 })
  await x.frame(20)
  assert.ok(!(await x.d()).inside)

  // Oyun ortasında menüden çıkış.
  await x.begin()
  await x.placeAt(ROOF)
  await x.head('right', 'b-button'); await x.release('right', 'b-button')
  await x.item(2, 3)
  await page.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await page.getByRole('button', { name: "VR'da aç" }).waitFor()
  await page.waitForFunction(() => document.querySelector('.model-control button') && !document.querySelector('.model-control button').disabled)
  d = await x.d()
  const desktopOk = (d, ad) => {
    assert.ok(!d.presenting && !d.inAssembly, ad)
    assert.ok(d.layer.every(atHome), `${ad}: katmanlar evde değil: ${d.layer}`)
    assert.deepEqual(d.child, [0, 0, 0], `${ad}: ad panelleri kaldı`)
    assert.equal(d.cameraChild, 0, `${ad}: kamerada panel kaldı`)
    assert.equal(d.cameraParent, null, ad)
    assert.equal(d.sceneChild, first.sceneChild, `${ad}: sahnede nesne kaldı`)
    assert.deepEqual([d.near, d.far, d.control], [first.near, first.far, first.control], ad)
  }
  desktopOk(d, 'menüden çıkış')
  step("Menü: VR'dan çık, oyun ortasında; masaüstü temiz")

  // Katman eldeyken dışarıdan kapanış (Meta düğmesi yerine session.end).
  await x.enter()
  await x.begin()
  await x.hold(DOME)
  await page.evaluate(() => __b.controllerScroll('right', [0, 0.1, 0]))
  await x.frame()
  await page.evaluate(() => __sim.finish())
  await page.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await page.getByRole('button', { name: "VR'da aç" }).waitFor()
  await x.frame(3)
  desktopOk(await x.d(), 'dışarıdan kapanış')
  step('Dışarıdan kapanış, katman eldeyken: masaüstü temiz')

  // Masaüstü Parçala hâlâ yalnız y'de gider.
  await page.getByRole('button', { name: /Parçala/ }).click()
  await page.waitForFunction(() => __t.layers[2].group.position.y > 20, null, { polling: 100 })
  d = await x.d()
  assert.ok(d.layer.every((k) => k[0] === 0 && k[2] === 0), `masaüstü parçala: ${d.layer}`)
  step('Masaüstü Parçala çalışıyor')

  assert.deepEqual(errors, [], 'konsol hatası')
  step('Konsol temiz')
  console.log(`Maket birleştirme VR simülasyonu: ${audit} denetim geçti.`)
} finally { await browser.close() }
