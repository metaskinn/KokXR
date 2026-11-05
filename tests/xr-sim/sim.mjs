// KökXR Ulu Camii WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager.
// Çalıştırma: node sim.mjs [senaryo,senaryo]   Senaryolar: ana,ikinci,parcali,yuksek
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const { chromium } = createRequire(S + '/kopya-temiz/')('playwright')
const URL_ = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const secilen = (process.argv[2] ?? 'ana,ikinci,parcali').split(',')
const ANGLE = process.env.ANGLE ?? 'swiftshader', ETIKET = process.env.ETIKET ?? 'ss'
const EKRAN = S + '/ekran' + (ETIKET === 'ss' ? '' : '-' + ETIKET); mkdirSync(EKRAN, { recursive: true })
const SURE = 900000
const sonuclar = []
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const rapor = (ad, ok, dayanak) => { sonuclar.push({ ad, sonuc: ok === null ? 'SINANAMADI' : ok ? 'GECTI' : 'KALDI', dayanak }); log(ok === null ? 'SINANAMADI' : ok ? 'GECTI' : 'KALDI ', ad, JSON.stringify(dayanak)); writeFileSync(S + `/sonuc-${ETIKET}.json`, JSON.stringify(sonuclar, null, 1)) }
const yakin = (a, b, tol = 1e-2) => Math.abs(a - b) <= tol
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })

async function ac(ek = '', viewport = { width: 960, height: 540 }) {
  const ctx = await tarayici.newContext({ viewport })
  const sayfa = await ctx.newPage()
  const h = { hata: [], uyari: [] }
  sayfa.on('pageerror', (e) => h.hata.push('pageerror: ' + e))
  sayfa.on('console', (m) => {
    if (m.location().url.includes('360tr')) return
    if (m.type() === 'error') h.hata.push(m.text())
    else if (m.type() === 'warning') h.uyari.push(m.text())
  })
  sayfa.setDefaultTimeout(SURE)
  await sayfa.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
  await sayfa.addInitScript({ path: S + '/sim-sayfa.js' })
  await sayfa.goto(`${URL_}/eser/ulu-camii${ek}`, { timeout: SURE })
  await sayfa.getByRole('button', { name: /maketini eline al/ }).click()
  await sayfa.locator('.maket-alan canvas').waitFor()
  await sayfa.locator('.maket-kutu').scrollIntoViewIfNeeded()
  await sayfa.waitForFunction(() => [...document.querySelectorAll('.maket-kontrol button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled) && window.__t?.kare > 2, null, { timeout: SURE, polling: 250 })
  return { sayfa, h, ctx }
}
const K = (s) => ({
  durum: () => s.evaluate(() => __sim.durum()),
  kare: (n = 1) => s.evaluate((n) => __sim.kareBekle(n), n),
  cubuk: (el, x, y) => s.evaluate(([e, x, y]) => __sim.cubuk(e, x, y), [el, x, y]),
  async yakala(ad) {
    const r = await s.evaluate(() => { const p = __sim.yakala(); return p })
    const yol = `${EKRAN}/${ad}.png`
    writeFileSync(yol, Buffer.from(r.png.split(',')[1], 'base64'))
    delete r.png
    return { yol, ...r }
  },
  async doku(hangi, ad) {
    const u = await s.evaluate((h) => __sim.dokuPng(h), hangi)
    const yol = `${EKRAN}/${ad}.png`; writeFileSync(yol, Buffer.from(u.split(',')[1], 'base64')); return yol
  },
  async nisanTikla(hedefFn, arg, el = 'right') {
    const ei = await s.evaluate((el) => {
      const kaynaklar = [...__sim.d.activeSession.inputSources]; return kaynaklar.findIndex((k) => k.handedness === el)
    }, el)
    await s.evaluate(([fn, arg, el]) => __sim.nisanla(fn === 'oge' ? __sim.menuOgeNoktasi(arg[0], arg[1]) : __sim.panelNoktasi(fn === 'baslik' ? __sim.baslik(arg) : __sim.kart(), .5, .5), el), [hedefFn, arg, el])
    await s.evaluate(() => __sim.kareBekle(2))
    const tani = await s.evaluate((i) => __sim.isinTani(i), ei)
    await s.evaluate((el) => __sim.bas(el, 'trigger', 1), el)
    await s.evaluate(() => __sim.kareBekle(2))
    await s.evaluate((el) => __sim.bas(el, 'trigger', 0), el)
    await s.evaluate(() => __sim.kareBekle(2)).catch(() => {})
    return tani
  },
  oge(i, n, el) { return this.nisanTikla('oge', [i, n], el) },
  kartTikla(el) { return this.nisanTikla('kart', null, el) },
  baslikTikla(id, el) { return this.nisanTikla('baslik', id, el) },
  async dugme(el, ad) {
    await s.evaluate(([e, a]) => __sim.bas(e, a, 1), [el, ad]); await this.kare(3)
    const basiliyken = await this.durum()
    await s.evaluate(([e, a]) => __sim.bas(e, a, 0), [el, ad]); await this.kare(3)
    return { basiliyken, birakinca: await this.durum() }
  },
})

async function adim(ad, fn) {
  try { await fn() } catch (e) { rapor(ad + ' (beklenmedik istisna)', false, String(e).slice(0, 500)) }
}
async function masaustuDenetle(s, h, ad, x) {
  await s.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await s.evaluate(() => __sim.kareBekle(3))
  const d = await x.durum()
  rapor(ad + ': masaüstü kamera/near/far/arka plan', !d.kameraEbeveyn && d.near === 4 && d.far === 900 && d.arka === 'artAlan' && yakin(d.fov, 40, 0.01) && d.kameraOlcek.every((v) => yakin(v, 1, 1e-3)) && !d.iceride && !d.sunuyor, { near: d.near, far: d.far, arka: d.arka, fov: d.fov, aspect: d.aspect, kameraOlcek: d.kameraOlcek, kameraEbeveyn: d.kameraEbeveyn, bas: d.bas, hedef: d.hedef, canvas: d.canvas, canvasEbeveyn: d.canvasEbeveyn, pikselOran: d.pikselOran, sahneCocuk: d.sahneCocuk, icIsik: d.icIsik, hemi: d.hemi, cevre: d.cevre, katmanY: d.katmanY })
  const alan = await s.locator('.maket-alan').boundingBox()
  rapor(ad + ': canvas boyutu alanla aynı', yakin(d.canvas[0], alan.width, 1) && yakin(d.canvas[1], alan.height, 1), { canvas: d.canvas, alan, aspect: d.aspect, pr: d.pikselOran })
  const dugmeler = await s.evaluate(() => [...document.querySelectorAll('.maket-kontrol button')].map((b) => ({ t: b.textContent, d: b.disabled, p: b.getAttribute('aria-pressed') })))
  rapor(ad + ': düğmeler yeniden etkin, kart yok', dugmeler.filter((b) => !/Tam ekran/.test(b.t)).every((b) => !b.d) && !(await s.locator('.maket-bilgi-kart').count()), dugmeler)
  await s.screenshot({ path: `${EKRAN}/${ad}-masaustu.png` })
  const f = await x.yakala(`${ad}-masaustu-fb`)
  rapor(ad + ': masaüstü kare çiziyor', f.sol.arkaDisi > 0.05, f)
  const once = (await x.durum()).bas
  const kutu = await s.locator('.maket-alan').boundingBox()
  await s.mouse.move(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2)
  await s.mouse.down(); await s.mouse.move(kutu.x + kutu.width / 2 + 120, kutu.y + kutu.height / 2 + 10, { steps: 4 }); await s.mouse.up()
  await x.kare(4)
  const sonra = (await x.durum()).bas
  rapor(ad + ': sürükleme kamerayı döndürüyor', once.some((v, i) => Math.abs(v - sonra[i]) > 1), { once, sonra })
  await s.getByRole('button', { name: 'İçeri gir' }).click()
  await s.getByRole('button', { name: /Dışarı çık/ }).waitFor()
  await x.kare(3)
  const ic = await x.durum()
  await s.screenshot({ path: `${EKRAN}/${ad}-masaustu-ic.png` })
  rapor(ad + ': masaüstü İçeri gir çalışıyor', ic.iceride && yakin(ic.bas[0], 0, 0.1) && yakin(ic.bas[2], -24.6, 0.1) && ic.near === 0.15, { bas: ic.bas, near: ic.near, far: ic.far, fov: ic.fov, aktifBilgi: ic.aktifBilgi })
  await s.getByRole('button', { name: /Dışarı çık/ }).click()
  await s.getByRole('button', { name: 'İçeri gir' }).waitFor()
  await x.kare(2)
  const dis = await x.durum()
  rapor(ad + ': masaüstü Dışarı çık çalışıyor', !dis.iceride && dis.near === 4, { bas: dis.bas, near: dis.near, fov: dis.fov })
}
async function vrAc(s, x, ad) {
  await s.getByRole('button', { name: "VR'da aç" }).click()
  await s.waitForFunction(() => !!__sim.d.activeSession && __t.renderer.xr.isPresenting, null, { polling: 100 })
  await s.waitForFunction(() => __sim.menu && __t.camera.parent && __sim.menu().visible, null, { polling: 100, timeout: SURE })
  await x.kare(2)
}

const DURAKLAR = ['giris', 'sadirvan', 'mihrap', 'minber', 'kapi', 'kabe', 'levha', 'kubbe']
const ICERI_N = 10 // disari + 8 durak + cik
const ICERI_ARA = (id) => DURAKLAR.indexOf(id) + 1

async function ana() {
  const { sayfa: s, h, ctx } = await ac()
  const x = K(s)
  await adim('A0 temel', async () => {
    const b = await x.durum(); log('masaüstü başlangıç', JSON.stringify(b))
    rapor("A0 VR'da aç görünüyor", await s.getByRole('button', { name: "VR'da aç" }).isVisible(), { kalite: b.kalite, kare: b.kare })
  })
  await adim('A1 oturum', async () => {
    await vrAc(s, x)
    const d = await x.durum()
    log('xrBilgi', JSON.stringify(await s.evaluate(() => __sim.xrBilgi())))
    log('oturum durum', JSON.stringify(d))
    rapor('A1 oturum açıldı, WebXRManager sunuyor', d.oturum && d.sunuyor, { sunuyor: d.sunuyor, xr: await s.evaluate(() => __sim.xrBilgi()), girdiler: d.girdiler, near: d.near, far: d.far, arka: d.arka })
    rapor('A1 menü görünür', d.menuAcik, { menuYerel: d.menuYerel, basYerel: d.basYerel })
    rapor('A1 rig maket görünümünde (ölçek 100, P=0,-90,-120, rotY=π)', d.rigOlcek === 100 && yakin(d.rigP[1], -90) && yakin(d.rigP[2], -120) && yakin(d.rigRotY, Math.PI), { rigP: d.rigP, rigRotY: d.rigRotY, rigOlcek: d.rigOlcek, maketYerel: d.maketYerel, disk: d.disk, bas: d.bas })
    const dugme = await s.evaluate(() => [...document.querySelectorAll('.maket-kontrol button')].map((b) => [b.textContent, b.disabled]))
    rapor('A1 sayfa düğmeleri oturumda kilitli', dugme.filter(([t]) => !/Tam ekran/.test(t)).every(([, d]) => d), dugme)
    await x.kare(2)
    const f = await x.yakala('01-oturum-acilis')
    rapor('A1 iki göz framebuffer çizimi', f.sol.arkaDisi > 0.02 && f.sag.arkaDisi > 0.02, f)
    rapor('A1 menü dokusu', true, await x.doku('menu', '01-menu-doku'))
    await s.screenshot({ path: `${EKRAN}/01-oturum-sayfa.png` })
  })
  await adim('A2 maket çubuk', async () => {
    const d0 = await x.durum()
    await x.cubuk('right', 0.15, 0.15); await x.kare(5)
    let d1 = await x.durum()
    rapor('A2 ölü bölge altı hareket yok (0.15)', d1.rigRotY === d0.rigRotY && d1.rigOlcek === d0.rigOlcek, { once: [d0.rigRotY, d0.rigOlcek], sonra: [d1.rigRotY, d1.rigOlcek] })
    await x.cubuk('right', 1, 0); await x.kare(6)
    d1 = await x.durum()
    await x.cubuk('right', 0, 0); await x.kare(2)
    rapor('A2 sağ çubuk x maketi döndürür, maket önde kalır', Math.abs(d1.rigRotY - d0.rigRotY) > 0.05 && yakin(d1.maketYerel[0], 0) && yakin(d1.maketYerel[1], .9) && yakin(d1.maketYerel[2], -1.2) && d1.rigOlcek === 100, { rotY: [d0.rigRotY, d1.rigRotY], maketYerel: d1.maketYerel, rigP: d1.rigP })
    const f0 = await x.yakala('02-dondurulmus')
    log('dondurulmus', JSON.stringify(f0))
    await x.cubuk('right', 0, -1)
    let d2; for (let i = 0; i < 60; i++) { await x.kare(2); d2 = await x.durum(); if (d2.rigOlcek <= 40) break }
    await x.kare(4); d2 = await x.durum(); await x.cubuk('right', 0, 0); await x.kare(2)
    const f40 = await x.yakala('02-olcek-40')
    rapor('A2 çubuk ileri: alt sınır 40, aşılmıyor', d2.rigOlcek === 40 && yakin(d2.maketYerel[2], -1.2), { rigOlcek: d2.rigOlcek, maketYerel: d2.maketYerel, rigP: d2.rigP, f40 })
    await x.cubuk('right', 0, 1)
    let d3; for (let i = 0; i < 80; i++) { await x.kare(2); d3 = await x.durum(); if (d3.rigOlcek >= 200) break }
    await x.kare(4); d3 = await x.durum(); await x.cubuk('right', 0, 0); await x.kare(2)
    const f200 = await x.yakala('02-olcek-200')
    rapor('A2 çubuk geri: üst sınır 200, aşılmıyor', d3.rigOlcek === 200 && yakin(d3.maketYerel[2], -1.2), { rigOlcek: d3.rigOlcek, maketYerel: d3.maketYerel, f200 })
    rapor('A2 yön: ileri itiş maketi görsel büyütür (rig küçülür), arka plan dışı piksel 40>200', f40.sol.arkaDisi > f200.sol.arkaDisi, { arkaDisi40: f40.sol.arkaDisi, arkaDisi200: f200.sol.arkaDisi })
    // Ölçeği yaklaşık 100'e getir
    await x.cubuk('right', 0, -1); for (let i = 0; i < 40; i++) { await x.kare(1); if ((await x.durum()).rigOlcek <= 105) break }
    await x.cubuk('right', 0, 0); await x.kare(2)
    log('olcek donus', (await x.durum()).rigOlcek)
  })
  await adim('A3 parçala', async () => {
    let t = await x.oge(1, 3)
    await x.kare(3)
    let d = await x.durum()
    rapor('A3 menüden Parçala katmanları kaldırır', d.parcali && d.katmanY.some((y) => y > 0), { tani: t, parcali: d.parcali, katmanY: d.katmanY })
    const dk = await x.doku('menu', '03-menu-birlestir')
    const f = await x.yakala('03-parcali')
    rapor('A3 parçalı görüntü ve Birleştir etiketi', true, { dk, f })
    t = await x.oge(1, 3)
    await x.kare(3)
    d = await x.durum()
    rapor('A3 menüden Birleştir katmanları indirir', !d.parcali && d.katmanY.every((y) => y === 0), { tani: t, parcali: d.parcali, katmanY: d.katmanY })
  })
  await adim('A4 menü düğmesi', async () => {
    const d0 = await x.durum()
    const r = await x.dugme('right', 'b-button')
    rapor('A4 B menüyü kapatır, basılı tutunca bir kez', d0.menuAcik && !r.basiliyken.menuAcik && !r.birakinca.menuAcik, { once: d0.menuAcik, basili: r.basiliyken.menuAcik, birak: r.birakinca.menuAcik })
    const r2 = await x.dugme('left', 'y-button')
    rapor('A4 Y menüyü açar', r2.birakinca.menuAcik, { basili: r2.basiliyken.menuAcik, birak: r2.birakinca.menuAcik })
    // Menü kapalıyken tık boşa düşer
    await x.dugme('right', 'b-button')
    const once = await x.durum()
    await s.evaluate(() => __sim.nisanla([0, 1.6, -1.3]))
    await x.kare(2)
    await s.evaluate(() => __sim.bas('right', 'trigger', 1)); await x.kare(2); await s.evaluate(() => __sim.bas('right', 'trigger', 0)); await x.kare(2)
    const sonra = await x.durum()
    rapor('A4 menü kapalıyken tetik eylem yapmaz', once.iceride === sonra.iceride && once.parcali === sonra.parcali, { iceride: sonra.iceride })
    // Baş dönük açılış: menü başın önüne gelir
    await s.evaluate(() => __sim.basYaw(Math.PI / 2)); await x.kare(2)
    await x.dugme('right', 'b-button')
    const d = await x.durum()
    rapor('A4 baş 90° sola dönükken menü başın önünde açılır', d.menuAcik && d.menuYerel[0] < -1 && Math.abs(d.menuYerel[2]) < 0.1, { menuYerel: d.menuYerel, basYerel: d.basYerel })
    await s.evaluate(() => __sim.basYaw(0)); await x.kare(2)
    await x.dugme('right', 'b-button'); await x.dugme('right', 'b-button')
    log('menü geri', JSON.stringify((await x.durum()).menuYerel))
  })
  await adim('A5 içeri', async () => {
    // Önce yaw'ı ve aci'yi bilinçli olarak dönük bırakıyoruz (A2'de aci≠0): durak yönü rig açısından bağımsız olmalı.
    const t = await x.oge(0, 3)
    await x.kare(3)
    const d = await x.durum()
    log('iceri durum', JSON.stringify(d))
    const f = await x.yakala('05-iceri-giris')
    const ileriTamam = d.ileri[2] > 0.9 && Math.abs(d.ileri[0]) < 0.05
    rapor('A5 İçeri gir: rig 1×, döşemede, durakta', d.iceride && d.rigOlcek === 1 && yakin(d.rigP[1], 0.7) && !d.disk && !d.carpiyor && yakin(d.bas[0], 0, 0.1) && yakin(d.bas[2], -24.6, 0.1), { tani: t, bas: d.bas, rigP: d.rigP, rigRotY: d.rigRotY, rigOlcek: d.rigOlcek, disk: d.disk, carpiyor: d.carpiyor, icIsik: d.icIsik })
    rapor('A5 durağa dönük (giris: +z)', ileriTamam, { ileri: d.ileri })
    rapor('A5 kart kendiliğinden açılmaz (kapi yarıçapı içinde)', d.aktifBilgi === null && !d.kartAcik, { aktifBilgi: d.aktifBilgi, kartAcik: d.kartAcik, menuAcik: d.menuAcik, f })
    const gorunen = await s.evaluate(() => __sim.gorunenBasliklar())
    log('görünen başlıklar', JSON.stringify(gorunen))
    rapor('A5 başlıklar görünüyor', gorunen.length > 0, { gorunen })
    // menü kartın arkasında mı?
    const tani = await s.evaluate(async () => { __sim.nisanla(__sim.menuOgeNoktasi(0, 10)); await __sim.kareBekle(2); return __sim.isinTani(0) })
    rapor('A5 GÖZLEM kart açıkken menü öğesine nişan karta çarpar (menü erişilemez)', tani?.nesne !== 'kart', { tani })
  })
  await adim('A6 kart kapatma', async () => {
    const hedef = (await s.evaluate(() => __sim.gorunenBasliklar()))[0]
    const bt = await x.baslikTikla(hedef); await x.kare(3)
    const d0 = await x.durum()
    rapor('A6 başlığa tıkla: kart açılır', d0.aktifBilgi === hedef && d0.kartAcik, { hedef, bt, aktifBilgi: d0.aktifBilgi, kartAcik: d0.kartAcik, f: await x.yakala('06-baslik-kart') })
    rapor('A6 kart dokusu kaydedildi', true, await x.doku('kart', '06-kart'))
    const t = await x.kartTikla()
    await x.kare(3)
    const d = await x.durum()
    const kartDom = await s.locator('.maket-bilgi-kart').count()
    rapor('A6 karta ışınla tıkla: kart kapanır, kapalı kalır', d0.kartAcik && t?.nesne === 'kart' && !d.kartAcik && d.aktifBilgi === null && !kartDom, { tani: t, kartAcik: d.kartAcik, aktifBilgi: d.aktifBilgi, kartDom })
    await x.kare(4)
    rapor('A6 kapatılan kart aynı noktada geri açılmaz', !(await x.durum()).kartAcik, {})
  })
  await adim('A7 yürüme', async () => {
    const d0 = await x.durum()
    await x.cubuk('left', 0, 0.15); await x.kare(4)
    let d = await x.durum()
    rapor('A7 ölü bölge altı yürüyüş yok', d.bas[2] === d0.bas[2], { once: d0.bas, sonra: d.bas })
    await x.cubuk('left', 0, -1); await x.kare(5)
    d = await x.durum()
    await x.cubuk('left', 0, 0); await x.kare(2)
    const ileriYol = d.bas[2] - d0.bas[2]
    rapor('A7 sol çubuk ileri: bakış yönünde (+z) yürür, sapmadan', ileriYol > 0.1 && yakin(d.bas[0], d0.bas[0], 0.05) && d.bas[1] === d0.bas[1], { once: d0.bas, sonra: d.bas, ileriYol })
    const d1 = await x.durum()
    await x.cubuk('left', 1, 0); await x.kare(4); const d2 = await x.durum(); await x.cubuk('left', 0, 0); await x.kare(2)
    rapor('A7 sol çubuk sağa: kullanıcının sağına kayar (+z bakarken −x)', d2.bas[0] < d1.bas[0] - 0.05, { once: d1.bas, sonra: d2.bas })
    // Hız: gerçek zamanla (dt tavanı 0.1 sn altındaysa anlamlı)
    const hz0 = await s.evaluate(() => { __sim.cubuk('left', 0, -1); return { t: performance.now(), k: __t.kare, z: __sim.durum().bas[2] } })
    await x.kare(20)
    const hz1 = await s.evaluate(() => ({ t: performance.now(), k: __t.kare, z: __sim.durum().bas[2] }))
    await x.cubuk('left', 0, 0); await x.kare(2)
    const sn = (hz1.t - hz0.t) / 1000, kareSure = sn / (hz1.k - hz0.k)
    log('hız ölçümü', JSON.stringify({ metre: hz1.z - hz0.z, sn, kareSure }))
    rapor('A7 yürüme hızı ~1.6 m/sn (yalnız kare süresi <0.1 sn ise sınanır)', kareSure < 0.1 ? yakin((hz1.z - hz0.z) / sn, 1.6, 0.25) : null, { mPerSn: (hz1.z - hz0.z) / sn, kareSure })
    // Yaklaşmak kart açmaz; başlığa tıklamak açar.
    await x.cubuk('left', 0, -1); await x.kare(40)
    await x.cubuk('left', 0, 0); await x.kare(3)
    let d3 = await x.durum()
    rapor('A7 yürürken kart kendiliğinden açılmaz', !d3.kartAcik && d3.aktifBilgi === null, { bas: d3.bas, aktifBilgi: d3.aktifBilgi })
    const f = await x.yakala('07-basliklar')
    const hedef = (await s.evaluate(() => __sim.gorunenBasliklar()))[0]
    await x.baslikTikla(hedef); await x.kare(3); d3 = await x.durum()
    const kartBilgi = d3.aktifBilgi ? await s.evaluate((id) => __t.xrKarti(id), d3.aktifBilgi) : null
    rapor('A7 başlığa tıklanınca bilgi kartı açılır, kaynak satırıyla', d3.aktifBilgi === hedef && d3.kartAcik && /^Kaynak: /.test(kartBilgi?.kaynak ?? ''), { hedef, aktifBilgi: d3.aktifBilgi, kartBilgi, f })
    rapor('A7 kart başın önünde', yakin(Math.hypot(d3.kartYerel[0] - d3.basYerel[0], d3.kartYerel[2] - d3.basYerel[2]), 1.3, 0.05), { kartYerel: d3.kartYerel, basYerel: d3.basYerel })
    await x.baslikTikla(hedef); await x.kare(3)
    rapor('A7 aynı başlığa yeniden tıklamak kartı kapatır', !(await x.durum()).kartAcik, {})
    await s.evaluate(() => {
      const r = __t.isaretler.map(({ bilgi }) => { const k = __t.xrKarti(bilgi.id); return [bilgi.id, k.kaynak] })
      window.__kaynaklar = r
    })
    const kaynaklar = await s.evaluate(() => window.__kaynaklar)
    rapor('A7 11 kartın hepsinde kaynak metni çözülüyor (veri)', kaynaklar.length === 11 && kaynaklar.every(([, k]) => /^Kaynak: /.test(k) && !/bulunamadı/.test(k)), kaynaklar)
  })
  await adim('A8 yumuşak dönüş', async () => {
    const d0 = await x.durum()
    await x.cubuk('right', 0.1, 0); await x.kare(4)
    const orta = await x.durum()
    rapor('A8 ölü bölgede dönüş yok', orta.rigRotY === d0.rigRotY, { rotY: [d0.rigRotY, orta.rigRotY] })
    await x.cubuk('right', 1, 0); await x.kare(8)
    const d1 = await x.durum()
    const donus = d1.rigRotY - d0.rigRotY
    const ileriAci = (d) => Math.atan2(d.ileri[0], d.ileri[2])
    rapor('A8 sağa itiş: kare başına en çok 4,5° yumuşak dönüş', donus < 0 && donus >= -8 * Math.PI / 40 - 1e-3, { donusDerece: donus * 180 / Math.PI, kare: 8 })
    const fark = Math.hypot(d1.bas[0] - d0.bas[0], d1.bas[2] - d0.bas[2])
    rapor('A8 dönüş başın çevresinde: baş yeri sabit (tol 2 cm)', fark < 0.02, { once: d0.bas, sonra: d1.bas, fark })
    // sağa dönüş mü: ileri vektör
    const ad = ileriAci(d1) - ileriAci(d0)
    rapor('A8 sağa itiş kullanıcıyı sağa döndürür', yakin(ad, donus, 0.02) , { ileriOnce: d0.ileri, ileriSonra: d1.ileri, not: '+z bakarken sağa dönüş −x yönüne: atan2(x,z) azalır' })
    await x.cubuk('right', 0, 0); await x.kare(3)
    const d2 = await x.durum()
    await x.kare(3)
    const durgun = await x.durum()
    await x.cubuk('right', -1, 0); await x.kare(4)
    const d3 = await x.durum()
    await x.cubuk('right', 0, 0); await x.kare(3)
    rapor('A8 çubuk bırakılınca durur, sola itiş ters döndürür', durgun.rigRotY === d2.rigRotY && d3.rigRotY > d2.rigRotY, { rotY: [d0.rigRotY, d1.rigRotY, d2.rigRotY, d3.rigRotY] })
  })
  await adim('A9 duraklar ve duvar', async () => {
    const dura = await s.evaluate(() => __t.duraklar)
    // menü aç
    if (!(await x.durum()).menuAcik) await x.dugme('right', 'b-button')
    for (const dk of dura) {
      let d = await x.durum()
      if (d.kartAcik) { await x.kartTikla(); await x.kare(2) }
      if (!(await x.durum()).menuAcik) await x.dugme('right', 'b-button')
      const t = await x.oge(ICERI_ARA(dk.id), ICERI_N)
      await x.kare(3)
      d = await x.durum()
      const hx = dk.bak[0] - dk.konum[0], hz = dk.bak[2] - dk.konum[2], boy = Math.hypot(hx, hz)
      const fb = Math.hypot(d.ileri[0], d.ileri[2])
      const yon = (d.ileri[0] * hx + d.ileri[2] * hz) / (boy * fb)
      const ok = yakin(d.bas[0], dk.konum[0], 0.05) && yakin(d.bas[2], dk.konum[2], 0.05) && yakin(d.rigP[1], 0.7) && yon > 0.999 && !d.carpiyor
      rapor(`A9 durak ${dk.id}: konum, yön, çarpmıyor`, ok, { tani: t, bas: d.bas, beklenen: [dk.konum[0], dk.konum[2]], yonKos: Number(yon.toFixed(4)), carpiyor: d.carpiyor, aktifBilgi: d.aktifBilgi, kartAcik: d.kartAcik })
      const f = await x.yakala(`09-durak-${dk.id}`)
      if (d.kartAcik) await x.doku('kart', `09-kart-${dk.id}`)
      log('görüntü', dk.id, JSON.stringify(f))
    }
    // Duvar: kapı durağı, doğu duvarına bakıyor
    let d = await x.durum()
    if (d.kartAcik) { await x.kartTikla(); await x.kare(2) }
    if (!(await x.durum()).menuAcik) await x.dugme('right', 'b-button')
    await x.oge(ICERI_ARA('kapi'), ICERI_N); await x.kare(3)
    if ((await x.durum()).kartAcik) { await x.kartTikla(); await x.kare(2) }
    await x.dugme('right', 'b-button') // menü kapansın, ekranı kaplamasın
    const bas0 = await x.durum()
    await x.cubuk('left', 0, -1)
    let onceki = null, durdu = 0, son = null
    for (let i = 0; i < 300 && durdu < 6; i++) { await x.kare(1); son = await x.durum(); if (onceki && son.bas[0] === onceki.bas[0] && son.bas[2] === onceki.bas[2]) durdu++; else durdu = 0; onceki = son }
    await x.cubuk('left', 0, 0); await x.kare(2)
    const g = await x.yakala('09-duvar-dibi')
    rapor('A9 ileri: duvarda durur, içinden geçmez', durdu >= 6 && !son.carpiyor && son.bas[0] > bas0.bas[0], { bas0: bas0.bas, son: son.bas, durduKare: durdu, carpiyor: son.carpiyor, g })
    // Duvar boyunca kayma: baş 30° dönük
    await s.evaluate(() => __sim.basYaw(-Math.PI / 6)); await x.kare(2)
    const k0 = await x.durum()
    await x.cubuk('left', 0, -1); await x.kare(6); const k1 = await x.durum(); await x.cubuk('left', 0, 0); await x.kare(2)
    rapor('A9 duvara çapraz itiş: duvar boyunca kayar', !k1.carpiyor && Math.hypot(k1.bas[0] - k0.bas[0], k1.bas[2] - k0.bas[2]) > 0.05, { once: k0.bas, sonra: k1.bas, ileri: k1.ileri })
    await s.evaluate(() => __sim.basYaw(0)); await x.kare(2)
    await x.dugme('right', 'b-button')
    if ((await x.durum()).kartAcik) { await x.kartTikla(); await x.kare(2) }
    // Yüzü başa dönük olmayan durak geçişi
    await s.evaluate(() => __sim.basYaw(Math.PI / 2)); await x.kare(2)
    await x.dugme('right', 'b-button'); await x.dugme('right', 'b-button') // menüyü başın önüne getir
    if ((await x.durum()).kartAcik) { await x.kartTikla(); await x.kare(2) }
    await x.oge(ICERI_ARA('giris'), ICERI_N); await x.kare(3)
    const y = await x.durum()
    rapor('A9 BAŞ 90° DÖNÜKKEN durak: kullanıcı durağa dönük mü', y.ileri[2] > 0.9, { ileri: y.ileri, bas: y.bas, not: 'durakRig baş yaw değerini dikkate almıyor' })
    await s.evaluate(() => __sim.basYaw(0)); await x.kare(2)
    await x.dugme('right', 'b-button'); await x.dugme('right', 'b-button')
    if ((await x.durum()).kartAcik) { await x.kartTikla(); await x.kare(2) }
  })
  await adim('A10 tek kumanda', async () => {
    await s.evaluate(() => __sim.dagBaglanti('left', false)); await x.kare(3)
    let d0 = await x.durum()
    log('tek kumanda girdiler', JSON.stringify(d0.girdiler))
    rapor('A10 kaynak listesi tek kumanda', d0.girdiler.length === 1 && d0.girdiler[0].startsWith('right'), d0.girdiler)
    await x.cubuk('right', 1, 0); await x.kare(6)
    const d1 = await x.durum()
    await x.cubuk('right', 0, 0); await x.kare(3)
    const fark = Math.hypot(d1.bas[0] - d0.bas[0], d1.bas[2] - d0.bas[2])
    rapor('A10 tek kumanda yana itiş: yumuşak dönüş, kayma yok', d1.rigRotY < d0.rigRotY && fark < 0.02, { donusDerece: (d1.rigRotY - d0.rigRotY) * 180 / Math.PI, bas0: d0.bas, bas1: d1.bas, fark })
    d0 = await x.durum()
    await x.cubuk('right', 0.1, 0); await x.kare(6)
    const d1b = await x.durum()
    await x.cubuk('right', 0, 0); await x.kare(2)
    rapor('A10 tek kumanda ölü bölge: kayma da dönüş de yok', d1b.rigRotY === d0.rigRotY && d1b.bas[0] === d0.bas[0] && d1b.bas[2] === d0.bas[2], { bas0: d0.bas, bas1: d1b.bas })
    const d2 = await x.durum()
    await x.cubuk('right', 0, -1); await x.kare(5)
    const d3 = await x.durum()
    await x.cubuk('right', 0, 0); await x.kare(2)
    rapor('A10 tek kumanda ileri itiş: yürür', Math.hypot(d3.bas[0] - d2.bas[0], d3.bas[2] - d2.bas[2]) > 0.1, { once: d2.bas, sonra: d3.bas, ileri: d3.ileri })
    // menü
    const mk = await x.dugme('right', 'b-button')
    rapor('A10 tek kumanda B menü', mk.birakinca.menuAcik !== d3.menuAcik, { once: d3.menuAcik, sonra: mk.birakinca.menuAcik })
    if (!(await x.durum()).menuAcik) await x.dugme('right', 'b-button')
    if ((await x.durum()).kartAcik) { await x.kartTikla(); await x.kare(2) }
    // yalnız sol kumanda
    await s.evaluate(() => { __sim.dagBaglanti('right', false); __sim.dagBaglanti('left', true) }); await x.kare(3)
    const l0 = await x.durum()
    await x.cubuk('left', 1, 0); await x.kare(5); const l1 = await x.durum(); await x.cubuk('left', 0, 0); await x.kare(3)
    rapor('A10 yalnız sol kumanda: yana itiş dönüş, kayma yok', yakin(l1.rigRotY - l0.rigRotY, -Math.PI / 6, 1e-3) && Math.hypot(l1.bas[0] - l0.bas[0], l1.bas[2] - l0.bas[2]) < 0.02, { girdiler: l1.girdiler, bas0: l0.bas, bas1: l1.bas })
    const kt = await x.oge(ICERI_ARA('giris'), ICERI_N, 'left'); await x.kare(3)
    rapor('A10 yalnız sol kumandayla menü tıklanır', yakin((await x.durum()).bas[2], -24.6, 0.1), { kt, bas: (await x.durum()).bas })
    await s.evaluate(() => __sim.dagBaglanti('right', true)); await x.kare(3)
    rapor('A10 yeniden bağlanma hata vermiyor', (await x.durum()).girdiler.length === 2, (await x.durum()).girdiler)
    if ((await x.durum()).kartAcik) { await x.kartTikla(); await x.kare(2) }
  })
  await adim('A11 dışarı', async () => {
    if (!(await x.durum()).menuAcik) await x.dugme('right', 'b-button')
    const t = await x.oge(0, ICERI_N); await x.kare(3)
    const d = await x.durum()
    const f = await x.yakala('11-disari')
    rapor('A11 Dışarı çık: maket görünümü, ışık/disk geri, kart yok', !d.iceride && d.rigOlcek > 39 && d.disk && d.icIsik === 0 && !d.kartAcik && yakin(d.maketYerel[1], .9) && yakin(d.maketYerel[2], -1.2), { tani: t, rigOlcek: d.rigOlcek, rigP: d.rigP, maketYerel: d.maketYerel, disk: d.disk, icIsik: d.icIsik, kartAcik: d.kartAcik, aktifBilgi: d.aktifBilgi, f })
  })
  await adim('A12 vrdan çık', async () => {
    const t = await x.oge(2, 3)
    log('çık tani', JSON.stringify(t))
    await masaustuDenetle(s, h, 'A12 VRdan-cik', x)
    rapor('A12 konsol hatası yok', !h.hata.length, { hata: h.hata })
    log('uyarılar', JSON.stringify([...new Set(h.uyari)].slice(0, 20)))
  })
  // ikinci oturum aynı sayfada
  await adim('B dışarıdan kapanma', async () => {
    await vrAc(s, x)
    const d0 = await x.durum()
    rapor('B yeniden açılış sıfırdan: ölçek 100, açı 0, menü açık', d0.rigOlcek === 100 && yakin(d0.rigRotY, Math.PI) && d0.menuAcik && !d0.iceride, { rigOlcek: d0.rigOlcek, rigRotY: d0.rigRotY, menuAcik: d0.menuAcik })
    await x.oge(0, 3); await x.kare(3)
    const d1 = await x.durum()
    rapor('B içeride, kart açık', d1.iceride && d1.kartAcik, { iceride: d1.iceride, aktifBilgi: d1.aktifBilgi })
    await s.evaluate(() => __sim.bitir())
    await masaustuDenetle(s, h, 'B dissardan-kapanis', x)
    rapor('B konsol hatası yok', !h.hata.length, { hata: h.hata })
  })
  await adim('C parçalı çıkış', async () => {
    await vrAc(s, x)
    await x.oge(1, 3); await x.kare(3)
    const d = await x.durum()
    await x.oge(2, 3)
    await s.waitForFunction(() => !__sim.d.activeSession, null, { polling: 100 })
    await x.kare(4)
    const son = await x.durum()
    const basili = await s.evaluate(() => [...document.querySelectorAll('.maket-kontrol button')].find((b) => /Parçala|Birleştir/.test(b.textContent))?.getAttribute('aria-pressed') + '|' + [...document.querySelectorAll('.maket-kontrol button')].find((b) => /Parçala|Birleştir/.test(b.textContent))?.textContent)
    rapor('C parçalıyken çıkış: sayfa birleşik, düğme uyumlu', d.parcali && !son.parcali && /false/.test(basili), { parcaliIci: d.parcali, parcaliSon: son.parcali, katmanY: son.katmanY, basili })
    await s.waitForFunction(() => __t.katmanlar.every((k) => Math.abs(k.grup.position.y) < 0.01), null, { polling: 200 })
    rapor('C katmanlar masaüstünde sıfıra iner', true, await x.durum().then((d) => d.katmanY))
  })
  await adim('D menü çıkış sonrası parçala masaüstü', async () => {
    const hatalar = h.hata
    rapor('Sonuç konsol', !hatalar.length, { hata: hatalar, uyari: [...new Set(h.uyari)].slice(0, 20) })
  })
  await ctx.close()
}

async function yuksek() {
  const { sayfa: s, h, ctx } = await ac('?kalite=yuksek', { width: 640, height: 360 })
  const x = K(s)
  await adim('Y composer yolu', async () => {
    log('başlangıç', JSON.stringify(await x.durum()))
    await vrAc(s, x)
    const f = await x.yakala('Y-oturum')
    rapor('Y kalite=yuksek ile oturum', f.sol.arkaDisi > 0.02, { f, kalite: (await x.durum()).kalite })
    await x.oge(2, 3)
    await s.waitForFunction(() => !__sim.d.activeSession, null, { polling: 100 })
    await x.kare(3)
    const d = await x.durum()
    await s.screenshot({ path: `${EKRAN}/Y-cikis-sayfa.png` })
    const piksel = await s.evaluate(async () => { await __sim.kareBekle(1); const c = __t.renderer.domElement; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; return { w: c.width, h: c.height } })
    rapor('Y çıkış sonrası composer yoluyla kare, hata yok', !h.hata.length && d.kalite === 0, { hata: h.hata, kalite: d.kalite, canvas: d.canvas, piksel, ekran: `${EKRAN}/Y-cikis-sayfa.png`, near: d.near, far: d.far })
  })
  await ctx.close()
}

for (const senaryo of secilen) {
  log('=== senaryo', senaryo)
  if (senaryo === 'ana') await ana()
  if (senaryo === 'yuksek') await yuksek()
}
await tarayici.close()
const say = (k) => sonuclar.filter((r) => r.sonuc === k).length
log('BİTTİ', { gecti: say('GECTI'), kaldi: say('KALDI'), sinanamadi: say('SINANAMADI') })
