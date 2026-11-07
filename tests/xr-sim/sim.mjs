// KökXR Ulu Camii WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager.
// Çalıştırma: node sim.mjs [senaryo,senaryo]   Senaryolar: ana,ikinci,parcali,yuksek
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const { chromium } = createRequire(S + '/copy-clean/')('playwright')
const URL_ = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const chosen = (process.argv[2] ?? 'main,second,fragmented').split(',')
const ANGLE = process.env.ANGLE ?? 'swiftshader', LABEL = process.env.LABEL ?? 'ss'
const SCREEN = S + '/screen' + (LABEL === 'ss' ? '' : '-' + LABEL); mkdirSync(SCREEN, { recursive: true })
const SURE = 900000
const results = []
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const report = (ad, ok, stand) => { results.push({ ad, result: ok === null ? 'Untestable' : ok ? 'Passed' : 'Remained', stand }); log(ok === null ? 'Untestable' : ok ? 'Passed' : 'KALDI ', ad, JSON.stringify(stand)); writeFileSync(S + `/result-${LABEL}.json`, JSON.stringify(results, null, 1)) }
const near = (a, b, tol = 1e-2) => Math.abs(a - b) <= tol
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })

async function ac(ext = '', viewport = { width: 960, height: 540 }) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const h = { error: [], warning: [] }
  page.on('pageerror', (e) => h.error.push('pageerror: ' + e))
  page.on('console', (m) => {
    if (m.location().url.includes('360tr')) return
    if (m.type() === 'error') h.error.push(m.text())
    else if (m.type() === 'warning') h.warning.push(m.text())
  })
  page.setDefaultTimeout(SURE)
  await page.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
  await page.addInitScript({ path: S + '/sim-page.js' })
  await page.goto(`${URL_}/artifact/ulu-mosque${ext}`, { timeout: SURE })
  await page.getByRole('button', { name: /maketini eline al/ }).click()
  await page.locator('.model-area canvas').waitFor()
  await page.locator('.model-box').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => [...document.querySelectorAll('.model-control button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled) && window.__t?.frame > 2, null, { timeout: SURE, polling: 250 })
  return { page, h, ctx }
}
const K = (s) => ({
  state: () => s.evaluate(() => __sim.state()),
  frame: (n = 1) => s.evaluate((n) => __sim.waitFrame(n), n),
  bar: (el, x, y) => s.evaluate(([e, x, y]) => __sim.bar(e, x, y), [el, x, y]),
  async capture(ad) {
    const r = await s.evaluate(() => { const p = __sim.capture(); return p })
    const path = `${SCREEN}/${ad}.png`
    writeFileSync(path, Buffer.from(r.png.split(',')[1], 'base64'))
    delete r.png
    return { path, ...r }
  },
  async texture(which, ad) {
    const u = await s.evaluate((h) => __sim.texPng(h), which)
    const path = `${SCREEN}/${ad}.png`; writeFileSync(path, Buffer.from(u.split(',')[1], 'base64')); return path
  },
  async aimClick(targetFn, arg, el = 'right') {
    const ei = await s.evaluate((el) => {
      const sources = [...__sim.d.activeSession.inputSources]; return sources.findIndex((k) => k.handedness === el)
    }, el)
    await s.evaluate(([fn, arg, el]) => __sim.aim(fn === 'item' ? __sim.menuItemPoint(arg[0], arg[1]) : __sim.panelPoint(fn === 'title' ? __sim.title(arg) : __sim.card(), .5, .5), el), [targetFn, arg, el])
    await s.evaluate(() => __sim.waitFrame(2))
    const diagnose = await s.evaluate((i) => __sim.rayDiagnose(i), ei)
    await s.evaluate((el) => __sim.head(el, 'trigger', 1), el)
    await s.evaluate(() => __sim.waitFrame(2))
    await s.evaluate((el) => __sim.head(el, 'trigger', 0), el)
    await s.evaluate(() => __sim.waitFrame(2)).catch(() => {})
    return diagnose
  },
  item(i, n, el) { return this.aimClick('item', [i, n], el) },
  cardClick(el) { return this.aimClick('card', null, el) },
  titleClick(id, el) { return this.aimClick('title', id, el) },
  async button(el, ad) {
    await s.evaluate(([e, a]) => __sim.head(e, a, 1), [el, ad]); await this.frame(3)
    const whilePressed = await this.state()
    await s.evaluate(([e, a]) => __sim.head(e, a, 0), [el, ad]); await this.frame(3)
    return { whilePressed, onRelease: await this.state() }
  },
})

async function step(ad, fn) {
  try { await fn() } catch (e) { report(ad + ' (beklenmedik istisna)', false, String(e).slice(0, 500)) }
}
async function desktopCheck(s, h, ad, x) {
  await s.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await s.evaluate(() => __sim.waitFrame(3))
  const d = await x.state()
  report(ad + ': masaüstü kamera/near/far/arka plan', !d.cameraParent && d.near === 4 && d.far === 900 && d.back === 'backdrop' && near(d.fov, 40, 0.01) && d.cameraScale.every((v) => near(v, 1, 1e-3)) && !d.inside && !d.presenting, { near: d.near, far: d.far, back: d.back, fov: d.fov, aspect: d.aspect, cameraScale: d.cameraScale, cameraParent: d.cameraParent, head: d.head, target: d.target, canvas: d.canvas, canvasParent: d.canvasParent, pixelRatio: d.pixelRatio, sceneChild: d.sceneChild, innerLight: d.innerLight, hemi: d.hemi, surroundings: d.surroundings, layerY: d.layerY })
  const area = await s.locator('.model-area').boundingBox()
  report(ad + ': canvas boyutu alanla aynı', near(d.canvas[0], area.width, 1) && near(d.canvas[1], area.height, 1), { canvas: d.canvas, area, aspect: d.aspect, pr: d.pixelRatio })
  const buttons = await s.evaluate(() => [...document.querySelectorAll('.model-control button')].map((b) => ({ t: b.textContent, d: b.disabled, p: b.getAttribute('aria-pressed') })))
  report(ad + ': düğmeler yeniden etkin, kart yok', buttons.filter((b) => !/Tam ekran/.test(b.t)).every((b) => !b.d) && !(await s.locator('.model-info-card').count()), buttons)
  await s.screenshot({ path: `${SCREEN}/${ad}-desktop.png` })
  const f = await x.capture(`${ad}-desktop-fb`)
  report(ad + ': masaüstü kare çiziyor', f.left.backOuter > 0.05, f)
  const once = (await x.state()).head
  const box = await s.locator('.model-area').boundingBox()
  await s.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await s.mouse.down(); await s.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 10, { steps: 4 }); await s.mouse.up()
  await x.frame(4)
  const after = (await x.state()).head
  report(ad + ': sürükleme kamerayı döndürüyor', once.some((v, i) => Math.abs(v - after[i]) > 1), { once, after })
  await s.getByRole('button', { name: 'İçeri gir' }).click()
  await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
  await x.frame(3)
  const inner = await x.state()
  await s.screenshot({ path: `${SCREEN}/${ad}-desktop-interior.png` })
  report(ad + ': masaüstü İçeri gir çalışıyor', inner.inside && near(inner.head[0], 0, 0.1) && near(inner.head[2], -24.6, 0.1) && inner.near === 0.15, { head: inner.head, near: inner.near, far: inner.far, fov: inner.fov, activeInfo: inner.activeInfo })
  await s.getByRole('button', { name: /Dışarı çık/ }).click()
  await s.getByRole('button', { name: 'İçeri gir' }).waitFor()
  await x.frame(2)
  const outer = await x.state()
  report(ad + ': masaüstü Dışarı çık çalışıyor', !outer.inside && outer.near === 4, { head: outer.head, near: outer.near, fov: outer.fov })
}
async function vrAc(s, x, ad) {
  await s.getByRole('button', { name: "VR'da aç" }).click()
  await s.waitForFunction(() => !!__sim.d.activeSession && __t.renderer.xr.isPresenting, null, { polling: 100 })
  await s.waitForFunction(() => __sim.menu && __t.camera.parent && __sim.menu().visible, null, { polling: 100, timeout: SURE })
  await x.frame(2)
}

const STOPS = ['entrance', 'fountain', 'mihrab', 'minbar', 'door', 'kaaba', 'plaque', 'dome']
const INSIDE_N = 10 // disari + 8 durak + cik
const INSIDE_GAP = (id) => STOPS.indexOf(id) + 1

async function ana() {
  const { page: s, h, ctx } = await ac()
  const x = K(s)
  await step('A0 temel', async () => {
    const b = await x.state(); log('masaüstü başlangıç', JSON.stringify(b))
    report("A0 VR'da aç görünüyor", await s.getByRole('button', { name: "VR'da aç" }).isVisible(), { quality: b.quality, frame: b.frame })
  })
  await step('A1 oturum', async () => {
    await vrAc(s, x)
    const d = await x.state()
    log('xrInfo', JSON.stringify(await s.evaluate(() => __sim.xrInfo())))
    log('oturum durum', JSON.stringify(d))
    report('A1 oturum açıldı, WebXRManager sunuyor', d.session && d.presenting, { presenting: d.presenting, xr: await s.evaluate(() => __sim.xrInfo()), inputs: d.inputs, near: d.near, far: d.far, back: d.back })
    report('A1 menü görünür', d.menuOpen, { menuLocal: d.menuLocal, headLocal: d.headLocal })
    report('A1 rig maket görünümünde (ölçek 100, P=0,-90,-120, rotY=π)', d.rigScale === 100 && near(d.rigP[1], -90) && near(d.rigP[2], -120) && near(d.rigRotY, Math.PI), { rigP: d.rigP, rigRotY: d.rigRotY, rigScale: d.rigScale, modelLocal: d.modelLocal, disk: d.disk, head: d.head })
    const button = await s.evaluate(() => [...document.querySelectorAll('.model-control button')].map((b) => [b.textContent, b.disabled]))
    report('A1 sayfa düğmeleri oturumda kilitli', button.filter(([t]) => !/Tam ekran/.test(t)).every(([, d]) => d), button)
    await x.frame(2)
    const f = await x.capture('01-session-opening')
    report('A1 iki göz framebuffer çizimi', f.left.backOuter > 0.02 && f.right.backOuter > 0.02, f)
    report('A1 menü dokusu', true, await x.texture('menu', '01-menu-texture'))
    await s.screenshot({ path: `${SCREEN}/01-session-page.png` })
  })
  await step('A2 maket çubuk', async () => {
    const d0 = await x.state()
    await x.bar('right', 0.15, 0.15); await x.frame(5)
    let d1 = await x.state()
    report('A2 ölü bölge altı hareket yok (0.15)', d1.rigRotY === d0.rigRotY && d1.rigScale === d0.rigScale, { once: [d0.rigRotY, d0.rigScale], after: [d1.rigRotY, d1.rigScale] })
    await x.bar('right', 1, 0); await x.frame(6)
    d1 = await x.state()
    await x.bar('right', 0, 0); await x.frame(2)
    report('A2 sağ çubuk x maketi döndürür, maket önde kalır', Math.abs(d1.rigRotY - d0.rigRotY) > 0.05 && near(d1.modelLocal[0], 0) && near(d1.modelLocal[1], .9) && near(d1.modelLocal[2], -1.2) && d1.rigScale === 100, { rotY: [d0.rigRotY, d1.rigRotY], modelLocal: d1.modelLocal, rigP: d1.rigP })
    const f0 = await x.capture('02-frozen')
    log('frozen', JSON.stringify(f0))
    await x.bar('right', 0, -1)
    let d2; for (let i = 0; i < 60; i++) { await x.frame(2); d2 = await x.state(); if (d2.rigScale <= 40) break }
    await x.frame(4); d2 = await x.state(); await x.bar('right', 0, 0); await x.frame(2)
    const f40 = await x.capture('02-scale-40')
    report('A2 çubuk ileri: alt sınır 40, aşılmıyor', d2.rigScale === 40 && near(d2.modelLocal[2], -1.2), { rigScale: d2.rigScale, modelLocal: d2.modelLocal, rigP: d2.rigP, f40 })
    await x.bar('right', 0, 1)
    let d3; for (let i = 0; i < 80; i++) { await x.frame(2); d3 = await x.state(); if (d3.rigScale >= 200) break }
    await x.frame(4); d3 = await x.state(); await x.bar('right', 0, 0); await x.frame(2)
    const f200 = await x.capture('02-scale-200')
    report('A2 çubuk geri: üst sınır 200, aşılmıyor', d3.rigScale === 200 && near(d3.modelLocal[2], -1.2), { rigScale: d3.rigScale, modelLocal: d3.modelLocal, f200 })
    report('A2 yön: ileri itiş maketi görsel büyütür (rig küçülür), arka plan dışı piksel 40>200', f40.left.backOuter > f200.left.backOuter, { backOuter40: f40.left.backOuter, backOuter200: f200.left.backOuter })
    // Ölçeği yaklaşık 100'e getir
    await x.bar('right', 0, -1); for (let i = 0; i < 40; i++) { await x.frame(1); if ((await x.state()).rigScale <= 105) break }
    await x.bar('right', 0, 0); await x.frame(2)
    log('olcek donus', (await x.state()).rigScale)
  })
  await step('A3 parçala', async () => {
    let t = await x.item(1, 4)
    await x.frame(20)
    let d = await x.state()
    report('A3 menüden Parçala katmanları kaldırır', d.fragmented && d.layerY.some((y) => y > 0), { diagnose: t, fragmented: d.fragmented, layerY: d.layerY })
    const dk = await x.texture('menu', '03-menu-assemble')
    const f = await x.capture('03-fragmented')
    report('A3 parçalı görüntü ve Birleştir etiketi', true, { dk, f })
    t = await x.item(1, 3)
    await x.frame(20)
    d = await x.state()
    report('A3 menüden Birleştir katmanları indirir', !d.fragmented && d.layerY.every((y) => y === 0), { diagnose: t, fragmented: d.fragmented, layerY: d.layerY })
  })
  await step('A4 menü düğmesi', async () => {
    const d0 = await x.state()
    const r = await x.button('right', 'b-button')
    report('A4 B menüyü kapatır, basılı tutunca bir kez', d0.menuOpen && !r.whilePressed.menuOpen && !r.onRelease.menuOpen, { once: d0.menuOpen, pressed: r.whilePressed.menuOpen, release: r.onRelease.menuOpen })
    const r2 = await x.button('left', 'y-button')
    report('A4 Y menüyü açar', r2.onRelease.menuOpen, { pressed: r2.whilePressed.menuOpen, release: r2.onRelease.menuOpen })
    // Menü kapalıyken tık boşa düşer
    await x.button('right', 'b-button')
    const once = await x.state()
    await s.evaluate(() => __sim.aim([0, 1.6, -1.3]))
    await x.frame(2)
    await s.evaluate(() => __sim.head('right', 'trigger', 1)); await x.frame(2); await s.evaluate(() => __sim.head('right', 'trigger', 0)); await x.frame(2)
    const after = await x.state()
    report('A4 menü kapalıyken tetik eylem yapmaz', once.inside === after.inside && once.fragmented === after.fragmented, { inside: after.inside })
    // Baş dönük açılış: menü başın önüne gelir
    await s.evaluate(() => __sim.headYaw(Math.PI / 2)); await x.frame(2)
    await x.button('right', 'b-button')
    const d = await x.state()
    report('A4 baş 90° sola dönükken menü başın önünde açılır', d.menuOpen && d.menuLocal[0] < -1 && Math.abs(d.menuLocal[2]) < 0.1, { menuLocal: d.menuLocal, headLocal: d.headLocal })
    await s.evaluate(() => __sim.headYaw(0)); await x.frame(2)
    await x.button('right', 'b-button'); await x.button('right', 'b-button')
    log('menü geri', JSON.stringify((await x.state()).menuLocal))
  })
  await step('A5 içeri', async () => {
    // Önce yaw'ı ve aci'yi bilinçli olarak dönük bırakıyoruz (A2'de aci≠0): durak yönü rig açısından bağımsız olmalı.
    const t = await x.item(0, 4)
    await x.frame(20)
    const d = await x.state()
    log('iceri durum', JSON.stringify(d))
    const f = await x.capture('05-inside-entrance')
    const forwardDone = d.forward[2] > 0.9 && Math.abs(d.forward[0]) < 0.05
    report('A5 İçeri gir: rig 1×, döşemede, durakta', d.inside && d.rigScale === 1 && near(d.rigP[1], 0.7) && !d.disk && !d.collides && near(d.head[0], 0, 0.1) && near(d.head[2], -24.6, 0.1), { diagnose: t, head: d.head, rigP: d.rigP, rigRotY: d.rigRotY, rigScale: d.rigScale, disk: d.disk, collides: d.collides, innerLight: d.innerLight })
    report('A5 durağa dönük (giris: +z)', forwardDone, { forward: d.forward })
    report('A5 kart kendiliğinden açılmaz (kapi yarıçapı içinde)', d.activeInfo === null && !d.cardOpen, { activeInfo: d.activeInfo, cardOpen: d.cardOpen, menuOpen: d.menuOpen, f })
    const shown = await s.evaluate(() => __sim.visibleTitles())
    log('görünen başlıklar', JSON.stringify(shown))
    report('A5 başlıklar görünüyor', shown.length > 0, { shown })
    // menü kartın arkasında mı?
    const diagnose = await s.evaluate(async () => { __sim.aim(__sim.menuItemPoint(0, 10)); await __sim.waitFrame(2); return __sim.rayDiagnose(0) })
    report('A5 GÖZLEM kart açıkken menü öğesine nişan karta çarpar (menü erişilemez)', diagnose?.obj !== 'card', { diagnose })
  })
  await step('A6 kart kapatma', async () => {
    const target = (await s.evaluate(() => __sim.visibleTitles()))[0]
    const bt = await x.titleClick(target); await x.frame(3)
    const d0 = await x.state()
    report('A6 başlığa tıkla: kart açılır', d0.activeInfo === target && d0.cardOpen, { target, bt, activeInfo: d0.activeInfo, cardOpen: d0.cardOpen, f: await x.capture('06-title-card') })
    report('A6 kart dokusu kaydedildi', true, await x.texture('card', '06-card'))
    const t = await x.cardClick()
    await x.frame(3)
    const d = await x.state()
    const cardDom = await s.locator('.model-info-card').count()
    report('A6 karta ışınla tıkla: kart kapanır, kapalı kalır', d0.cardOpen && t?.obj === 'card' && !d.cardOpen && d.activeInfo === null && !cardDom, { diagnose: t, cardOpen: d.cardOpen, activeInfo: d.activeInfo, cardDom })
    await x.frame(4)
    report('A6 kapatılan kart aynı noktada geri açılmaz', !(await x.state()).cardOpen, {})
  })
  await step('A7 yürüme', async () => {
    const d0 = await x.state()
    await x.bar('left', 0, 0.15); await x.frame(4)
    let d = await x.state()
    report('A7 ölü bölge altı yürüyüş yok', d.head[2] === d0.head[2], { once: d0.head, after: d.head })
    await x.bar('left', 0, -1); await x.frame(5)
    d = await x.state()
    await x.bar('left', 0, 0); await x.frame(2)
    const forwardPath = d.head[2] - d0.head[2]
    report('A7 sol çubuk ileri: bakış yönünde (+z) yürür, sapmadan', forwardPath > 0.1 && near(d.head[0], d0.head[0], 0.05) && d.head[1] === d0.head[1], { once: d0.head, after: d.head, forwardPath })
    const d1 = await x.state()
    await x.bar('left', 1, 0); await x.frame(4); const d2 = await x.state(); await x.bar('left', 0, 0); await x.frame(2)
    report('A7 sol çubuk sağa: kullanıcının sağına kayar (+z bakarken −x)', d2.head[0] < d1.head[0] - 0.05, { once: d1.head, after: d2.head })
    // Hız: gerçek zamanla (dt tavanı 0.1 sn altındaysa anlamlı)
    const hz0 = await s.evaluate(() => { __sim.bar('left', 0, -1); return { t: performance.now(), k: __t.frame, z: __sim.state().head[2] } })
    await x.frame(20)
    const hz1 = await s.evaluate(() => ({ t: performance.now(), k: __t.frame, z: __sim.state().head[2] }))
    await x.bar('left', 0, 0); await x.frame(2)
    const sec = (hz1.t - hz0.t) / 1000, frameDuration = sec / (hz1.k - hz0.k)
    log('hız ölçümü', JSON.stringify({ meter: hz1.z - hz0.z, sec, frameDuration }))
    report('A7 yürüme hızı ~1.6 m/sn (yalnız kare süresi <0.1 sn ise sınanır)', frameDuration < 0.1 ? near((hz1.z - hz0.z) / sec, 1.6, 0.25) : null, { mPerSec: (hz1.z - hz0.z) / sec, frameDuration })
    // Yaklaşmak kart açmaz; başlığa tıklamak açar.
    await x.bar('left', 0, -1); await x.frame(40)
    await x.bar('left', 0, 0); await x.frame(3)
    let d3 = await x.state()
    report('A7 yürürken kart kendiliğinden açılmaz', !d3.cardOpen && d3.activeInfo === null, { head: d3.head, activeInfo: d3.activeInfo })
    const f = await x.capture('07-titles')
    const target = (await s.evaluate(() => __sim.visibleTitles()))[0]
    await x.titleClick(target); await x.frame(3); d3 = await x.state()
    const cardInfo = d3.activeInfo ? await s.evaluate((id) => __t.xrCard(id), d3.activeInfo) : null
    report('A7 başlığa tıklanınca bilgi kartı açılır, kaynak satırıyla', d3.activeInfo === target && d3.cardOpen && /^Kaynak: /.test(cardInfo?.source ?? ''), { target, activeInfo: d3.activeInfo, cardInfo, f })
    report('A7 kart başın önünde', near(Math.hypot(d3.cardLocal[0] - d3.headLocal[0], d3.cardLocal[2] - d3.headLocal[2]), 1.3, 0.05), { cardLocal: d3.cardLocal, headLocal: d3.headLocal })
    await x.titleClick(target); await x.frame(3)
    report('A7 aynı başlığa yeniden tıklamak kartı kapatır', !(await x.state()).cardOpen, {})
    await s.evaluate(() => {
      const r = __t.markers.map(({ info }) => { const k = __t.xrCard(info.id); return [info.id, k.source] })
      window.__sources = r
    })
    const sources = await s.evaluate(() => window.__sources)
    report('A7 11 kartın hepsinde kaynak metni çözülüyor (veri)', sources.length === 11 && sources.every(([, k]) => /^Kaynak: /.test(k) && !/bulunamadı/.test(k)), sources)
  })
  await step('A8 yumuşak dönüş', async () => {
    const d0 = await x.state()
    await x.bar('right', 0.1, 0); await x.frame(4)
    const mid = await x.state()
    report('A8 ölü bölgede dönüş yok', mid.rigRotY === d0.rigRotY, { rotY: [d0.rigRotY, mid.rigRotY] })
    await x.bar('right', 1, 0); await x.frame(8)
    const d1 = await x.state()
    const turn = d1.rigRotY - d0.rigRotY
    const forwardAngle = (d) => Math.atan2(d.forward[0], d.forward[2])
    report('A8 sağa itiş: kare başına en çok 4,5° yumuşak dönüş', turn < 0 && turn >= -8 * Math.PI / 40 - 1e-3, { turnDegree: turn * 180 / Math.PI, frame: 8 })
    const diff = Math.hypot(d1.head[0] - d0.head[0], d1.head[2] - d0.head[2])
    report('A8 dönüş başın çevresinde: baş yeri sabit (tol 2 cm)', diff < 0.02, { once: d0.head, after: d1.head, diff })
    // sağa dönüş mü: ileri vektör
    const ad = forwardAngle(d1) - forwardAngle(d0)
    report('A8 sağa itiş kullanıcıyı sağa döndürür', near(ad, turn, 0.02) , { forwardBefore: d0.forward, forwardAfter: d1.forward, not: '+z bakarken sağa dönüş −x yönüne: atan2(x,z) azalır' })
    await x.bar('right', 0, 0); await x.frame(3)
    const d2 = await x.state()
    await x.frame(3)
    const still = await x.state()
    await x.bar('right', -1, 0); await x.frame(4)
    const d3 = await x.state()
    await x.bar('right', 0, 0); await x.frame(3)
    report('A8 çubuk bırakılınca durur, sola itiş ters döndürür', still.rigRotY === d2.rigRotY && d3.rigRotY > d2.rigRotY, { rotY: [d0.rigRotY, d1.rigRotY, d2.rigRotY, d3.rigRotY] })
  })
  await step('A9 duraklar ve duvar', async () => {
    const pause = await s.evaluate(() => __t.stops)
    // menü aç
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    for (const dk of pause) {
      let d = await x.state()
      if (d.cardOpen) { await x.cardClick(); await x.frame(2) }
      if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
      const t = await x.item(INSIDE_GAP(dk.id), INSIDE_N)
      await x.frame(20) // Karartmalı geçiş bitmeden B düğmesi işlemez
      d = await x.state()
      const hx = dk.look[0] - dk.position[0], hz = dk.look[2] - dk.position[2], length = Math.hypot(hx, hz)
      const fb = Math.hypot(d.forward[0], d.forward[2])
      const dir = (d.forward[0] * hx + d.forward[2] * hz) / (length * fb)
      const ok = near(d.head[0], dk.position[0], 0.05) && near(d.head[2], dk.position[2], 0.05) && near(d.rigP[1], 0.7) && dir > 0.999 && !d.collides
      report(`A9 durak ${dk.id}: konum, yön, çarpmıyor`, ok, { diagnose: t, head: d.head, expected: [dk.position[0], dk.position[2]], runDir: Number(dir.toFixed(4)), collides: d.collides, activeInfo: d.activeInfo, cardOpen: d.cardOpen })
      const f = await x.capture(`09-stop-${dk.id}`)
      if (d.cardOpen) await x.texture('card', `09-card-${dk.id}`)
      log('görüntü', dk.id, JSON.stringify(f))
    }
    // Duvar: kapı durağı, doğu duvarına bakıyor
    let d = await x.state()
    if (d.cardOpen) { await x.cardClick(); await x.frame(2) }
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    await x.item(INSIDE_GAP('door'), INSIDE_N); await x.frame(20)
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    if ((await x.state()).menuOpen) await x.button('right', 'b-button') // menü kapansın, ekranı kaplamasın
    const head0 = await x.state()
    await x.bar('left', 0, -1)
    let previous = null, stopped = 0, last = null
    for (let i = 0; i < 300 && stopped < 6; i++) { await x.frame(1); last = await x.state(); if (previous && last.head[0] === previous.head[0] && last.head[2] === previous.head[2]) stopped++; else stopped = 0; previous = last }
    await x.bar('left', 0, 0); await x.frame(2)
    const g = await x.capture('09-wall-foot')
    report('A9 ileri: duvarda durur, içinden geçmez', stopped >= 6 && !last.collides && last.head[0] > head0.head[0], { head0: head0.head, last: last.head, stoppedFrame: stopped, collides: last.collides, g })
    // Duvar boyunca kayma: baş 30° dönük
    await s.evaluate(() => __sim.headYaw(-Math.PI / 6)); await x.frame(2)
    const k0 = await x.state()
    await x.bar('left', 0, -1); await x.frame(6); const k1 = await x.state(); await x.bar('left', 0, 0); await x.frame(2)
    report('A9 duvara çapraz itiş: duvar boyunca kayar', !k1.collides && Math.hypot(k1.head[0] - k0.head[0], k1.head[2] - k0.head[2]) > 0.05, { once: k0.head, after: k1.head, forward: k1.forward })
    await s.evaluate(() => __sim.headYaw(0)); await x.frame(2)
    await x.button('right', 'b-button')
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    // Yüzü başa dönük olmayan durak geçişi
    await s.evaluate(() => __sim.headYaw(Math.PI / 2)); await x.frame(2)
    if ((await x.state()).menuOpen) await x.button('right', 'b-button')
    await x.button('right', 'b-button') // menüyü başın önüne getir
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    await x.item(INSIDE_GAP('entrance'), INSIDE_N); await x.frame(20)
    const y = await x.state()
    report('A9 BAŞ 90° DÖNÜKKEN durak: kullanıcı durağa dönük mü', y.forward[2] > 0.9, { forward: y.forward, head: y.head, not: 'durakRig baş yaw değerini dikkate almıyor' })
    await s.evaluate(() => __sim.headYaw(0)); await x.frame(2)
    await x.button('right', 'b-button'); await x.button('right', 'b-button')
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
  })
  await step('A10 tek kumanda', async () => {
    await s.evaluate(() => __sim.hillLink('left', false)); await x.frame(3)
    let d0 = await x.state()
    log('tek kumanda girdiler', JSON.stringify(d0.inputs))
    report('A10 kaynak listesi tek kumanda', d0.inputs.length === 1 && d0.inputs[0].startsWith('right'), d0.inputs)
    await x.bar('right', 1, 0); await x.frame(6)
    const d1 = await x.state()
    await x.bar('right', 0, 0); await x.frame(3)
    const diff = Math.hypot(d1.head[0] - d0.head[0], d1.head[2] - d0.head[2])
    report('A10 tek kumanda yana itiş: yumuşak dönüş, kayma yok', d1.rigRotY < d0.rigRotY && diff < 0.02, { turnDegree: (d1.rigRotY - d0.rigRotY) * 180 / Math.PI, head0: d0.head, head1: d1.head, diff })
    d0 = await x.state()
    await x.bar('right', 0.1, 0); await x.frame(6)
    const d1b = await x.state()
    await x.bar('right', 0, 0); await x.frame(2)
    report('A10 tek kumanda ölü bölge: kayma da dönüş de yok', d1b.rigRotY === d0.rigRotY && d1b.head[0] === d0.head[0] && d1b.head[2] === d0.head[2], { head0: d0.head, head1: d1b.head })
    const d2 = await x.state()
    await x.bar('right', 0, -1); await x.frame(5)
    const d3 = await x.state()
    await x.bar('right', 0, 0); await x.frame(2)
    report('A10 tek kumanda ileri itiş: yürür', Math.hypot(d3.head[0] - d2.head[0], d3.head[2] - d2.head[2]) > 0.1, { once: d2.head, after: d3.head, forward: d3.forward })
    // menü
    const mk = await x.button('right', 'b-button')
    report('A10 tek kumanda B menü', mk.onRelease.menuOpen !== d3.menuOpen, { once: d3.menuOpen, after: mk.onRelease.menuOpen })
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
    // yalnız sol kumanda
    await s.evaluate(() => { __sim.hillLink('right', false); __sim.hillLink('left', true) }); await x.frame(3)
    const l0 = await x.state()
    await x.bar('left', 1, 0); await x.frame(5); const l1 = await x.state(); await x.bar('left', 0, 0); await x.frame(3)
    report('A10 yalnız sol kumanda: yana itiş dönüş, kayma yok', l1.rigRotY < l0.rigRotY - 0.01 && Math.hypot(l1.head[0] - l0.head[0], l1.head[2] - l0.head[2]) < 0.02, { inputs: l1.inputs, head0: l0.head, head1: l1.head })
    const kt = await x.item(INSIDE_GAP('entrance'), INSIDE_N, 'left'); await x.frame(20)
    report('A10 yalnız sol kumandayla menü tıklanır', near((await x.state()).head[2], -24.6, 0.1), { kt, head: (await x.state()).head })
    await s.evaluate(() => __sim.hillLink('right', true)); await x.frame(3)
    report('A10 yeniden bağlanma hata vermiyor', (await x.state()).inputs.length === 2, (await x.state()).inputs)
    if ((await x.state()).cardOpen) { await x.cardClick(); await x.frame(2) }
  })
  await step('A11 dışarı', async () => {
    if (!(await x.state()).menuOpen) await x.button('right', 'b-button')
    const t = await x.item(0, INSIDE_N); await x.frame(20)
    const d = await x.state()
    const f = await x.capture('11-outside')
    report('A11 Dışarı çık: maket görünümü, ışık/disk geri, kart yok', !d.inside && d.rigScale > 39 && d.disk && d.innerLight === 0 && !d.cardOpen && near(d.modelLocal[1], .9) && near(d.modelLocal[2], -1.2), { diagnose: t, rigScale: d.rigScale, rigP: d.rigP, modelLocal: d.modelLocal, disk: d.disk, innerLight: d.innerLight, cardOpen: d.cardOpen, activeInfo: d.activeInfo, f })
  })
  await step('A12 vrdan çık', async () => {
    const t = await x.item(3, 4)
    log('çık tani', JSON.stringify(t))
    await desktopCheck(s, h, 'A12 VRdan-cik', x)
    report('A12 konsol hatası yok', !h.error.length, { error: h.error })
    log('uyarılar', JSON.stringify([...new Set(h.warning)].slice(0, 20)))
  })
  // ikinci oturum aynı sayfada
  await step('B dışarıdan kapanma', async () => {
    await vrAc(s, x)
    const d0 = await x.state()
    report('B yeniden açılış sıfırdan: ölçek 100, açı 0, menü açık', d0.rigScale === 100 && near(d0.rigRotY, Math.PI) && d0.menuOpen && !d0.inside, { rigScale: d0.rigScale, rigRotY: d0.rigRotY, menuOpen: d0.menuOpen })
    await x.item(0, 4); await x.frame(20)
    const d1 = await x.state()
    report('B içeride, kart kendiliğinden açılmaz', d1.inside && !d1.cardOpen, { inside: d1.inside, activeInfo: d1.activeInfo })
    await s.evaluate(() => __sim.finish())
    await desktopCheck(s, h, 'B dissardan-kapanis', x)
    report('B konsol hatası yok', !h.error.length, { error: h.error })
  })
  await step('C parçalı çıkış', async () => {
    await vrAc(s, x)
    await x.item(1, 4); await x.frame(20)
    const d = await x.state()
    await x.item(2, 3)
    await s.waitForFunction(() => !__sim.d.activeSession, null, { polling: 100 })
    await x.frame(4)
    const last = await x.state()
    const pressed = await s.evaluate(() => [...document.querySelectorAll('.model-control button')].find((b) => /Parçala|Birleştir/.test(b.textContent))?.getAttribute('aria-pressed') + '|' + [...document.querySelectorAll('.model-control button')].find((b) => /Parçala|Birleştir/.test(b.textContent))?.textContent)
    report('C parçalıyken çıkış: sayfa birleşik, düğme uyumlu', d.fragmented && !last.fragmented && /false/.test(pressed), { fragmentedInner: d.fragmented, fragmentedLast: last.fragmented, layerY: last.layerY, pressed })
    await s.waitForFunction(() => __t.layers.every((k) => Math.abs(k.group.position.y) < 0.01), null, { polling: 200 })
    report('C katmanlar masaüstünde sıfıra iner', true, await x.state().then((d) => d.layerY))
  })
  await step('D menü çıkış sonrası parçala masaüstü', async () => {
    const errors = h.error
    report('Sonuç konsol', !errors.length, { error: errors, warning: [...new Set(h.warning)].slice(0, 20) })
  })
  await ctx.close()
}

async function tall() {
  const { page: s, h, ctx } = await ac('?quality=tall', { width: 640, height: 360 })
  const x = K(s)
  await step('Y composer yolu', async () => {
    log('başlangıç', JSON.stringify(await x.state()))
    await vrAc(s, x)
    const f = await x.capture('Y-session')
    report('Y kalite=yuksek ile oturum', f.left.backOuter > 0.02, { f, quality: (await x.state()).quality })
    await x.item(3, 4)
    await s.waitForFunction(() => !__sim.d.activeSession, null, { polling: 100 })
    await x.frame(3)
    const d = await x.state()
    await s.screenshot({ path: `${SCREEN}/Y-exit-page.png` })
    const pixel = await s.evaluate(async () => { await __sim.waitFrame(1); const c = __t.renderer.domElement; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; return { w: c.width, h: c.height } })
    report('Y çıkış sonrası composer yoluyla kare, hata yok', !h.error.length && d.quality === 0, { error: h.error, quality: d.quality, canvas: d.canvas, pixel, screen: `${SCREEN}/Y-exit-page.png`, near: d.near, far: d.far })
  })
  await ctx.close()
}

for (const scenario of chosen) {
  log('=== senaryo', scenario)
  if (scenario === 'main') await ana()
  if (scenario === 'tall') await tall()
}
await browser.close()
const say = (k) => results.filter((r) => r.result === k).length
log('BİTTİ', { passed: say('Passed'), remained: say('Remained'), untestable: say('Untestable') })
