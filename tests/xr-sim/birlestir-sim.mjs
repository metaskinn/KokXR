// Ulu Camii maket birleştirme, WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager. Gerçek cihaz yerine geçmez.
// Hazırlık ve çalıştırma için bkz. kur.sh. Kumanda olayları gerçek akıştan gelir; tutma ve bırakma kumanda hareketiyle yapılır.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const EKRAN = S + '/ekran-birlestir'
mkdirSync(EKRAN, { recursive: true })
const SURE = 180000
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
let denetim = 0
const adim = (ad, dayanak = '') => { denetim++; console.log(`GEÇTİ  ${ad}${dayanak ? ' ' + JSON.stringify(dayanak) : ''}`) }
const CATI = 0, KASNAK = 1, KUBBE = 2

function sayfaYardimcilari() {
  // Tuvale yazılan her metin: uyarının gerçekten çizildiğini ve kare döngüsünde çizim olmadığını gösterir.
  window.__yazilar = []
  const asil = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (m, ...a) { window.__yazilar.push(m); return asil.call(this, m, ...a) }
  const t = () => window.__t, sim = () => window.__sim
  const ev = []
  window.__b = {
    // Etiketler katmanın çocuğu olmadan, oyundan önce çağrılır.
    olc: () => {
      const { THREE, katmanlar } = t()
      katmanlar.forEach(({ grup }, i) => {
        const k = new THREE.Box3().setFromObject(grup)
        ev[i] = k.getCenter(new THREE.Vector3()).sub(grup.position)
      })
    },
    merkezYerel: (id) => {
      const r = sim().rig(); r.updateWorldMatrix(true, false)
      return r.worldToLocal(ev[id].clone().add(t().katmanlar[id].grup.position)).toArray()
    },
    evYerel: (id) => { const r = sim().rig(); r.updateWorldMatrix(true, false); return r.worldToLocal(ev[id].clone()).toArray() },
    kumandaKoy: (el, konum, hedef) => {
      const { THREE } = t(), k = sim().d.controllers[el]
      const C = new THREE.Vector3(...konum), y = new THREE.Vector3(...hedef).sub(C).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
      k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
    },
    kumandaKaydir: (el, d) => { const k = sim().d.controllers[el]; k.position.set(k.position.x + d[0], k.position.y + d[1], k.position.z + d[2]) },
    durum: () => {
      const T = t(), { katmanlar, camera, scene, renderer } = T
      const menu = sim()._rig ? sim().menu() : null
      return {
        sunuyor: renderer.xr.isPresenting, birlesimde: T.xr.birlesimde(), parcali: T.parcali, iceride: T.iceride,
        katman: katmanlar.map((k) => k.grup.position.toArray().map((v) => Number(v.toFixed(2)))),
        cocuk: katmanlar.map((k) => k.grup.children.filter((c) => c.geometry?.type === 'PlaneGeometry').length),
        menu: menu?.visible ?? false, kameraCocuk: camera.children.length, kameraEbeveyn: camera.parent?.type ?? null, sahneCocuk: scene.children.length,
        rig: camera.parent ? { p: camera.parent.position.toArray().map((v) => Number(v.toFixed(2))), rotY: Number(camera.parent.rotation.y.toFixed(3)), olcek: camera.parent.scale.x } : null,
        near: camera.near, far: camera.far, kontrol: T.controls.enabled,
      }
    },
    panelPng: () => t().camera.children.find((c) => c.geometry?.parameters?.height > 0.1)?.material.map.image.toDataURL('image/png'),
  }
}

async function ac() {
  const sayfa = await (await tarayici.newContext({ viewport: { width: 960, height: 540 } })).newPage()
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push('pageerror: ' + e))
  sayfa.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) hatalar.push(m.text()) })
  sayfa.setDefaultTimeout(SURE)
  await sayfa.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
  await sayfa.addInitScript({ path: S + '/sim-sayfa.js' })
  await sayfa.addInitScript(sayfaYardimcilari)
  await sayfa.goto(`${url}/eser/ulu-camii`)
  await sayfa.getByRole('button', { name: /maketini eline al/ }).click()
  await sayfa.locator('.maket-alan canvas').waitFor()
  await sayfa.locator('.maket-kutu').scrollIntoViewIfNeeded()
  await sayfa.waitForFunction(() => [...document.querySelectorAll('.maket-kontrol button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled) && window.__t?.kare > 2, null, { polling: 250 })
  await sayfa.evaluate(() => __b.olc())
  return { sayfa, hatalar, x: kisa(sayfa) }
}

const kisa = (s) => {
  const x = {
    d: () => s.evaluate(() => __b.durum()),
    kare: (n = 3) => s.evaluate((n) => __sim.kareBekle(n, 60000), n),
    bas: async (el, dugme) => { await s.evaluate(([e, d]) => __sim.bas(e, d, 1), [el, dugme]); await x.kare() },
    birak: async (el, dugme) => { await s.evaluate(([e, d]) => __sim.bas(e, d, 0), [el, dugme]); await x.kare() },
    gir: async () => {
      await s.getByRole('button', { name: "VR'da aç" }).click()
      await s.waitForFunction(() => window.__t.renderer.xr.isPresenting && window.__t.camera.parent && __sim.menu().visible, null, { polling: 100 })
      await x.kare(3)
    },
    /** Menünün i. öğesine (n öğeden) tetikle basar. */
    oge: async (i, n, el = 'right') => {
      const nokta = await s.evaluate(([i, n]) => __sim.menuOgeNoktasi(i, n), [i, n])
      await s.evaluate(([el, nokta]) => __sim.nisanla(nokta, el), [el, nokta])
      await x.kare(2)
      await x.bas(el, 'trigger')
      await s.evaluate((el) => __sim.bas(el, 'trigger', 0), el)
      await x.kare(2).catch(() => {})
    },
    menuYaz: async () => { await s.evaluate(() => { window.__yazilar.length = 0 }) },
    yazilar: () => s.evaluate(() => [...window.__yazilar]),
    /** Birleştirmeye girer ve geçişin bitmesini bekler. */
    basla: async (n = 4, i = 2) => {
      await x.oge(i, n)
      await s.waitForFunction(() => __t.xr.birlesimde(), null, { polling: 50 })
      await x.kare(20) // karartma biter
    },
    /** Katmana uzaktan nişan alıp kavrar. */
    tut: async (id, el = 'right', tus = 'squeeze') => {
      const m = await s.evaluate((i) => __b.merkezYerel(i), id)
      const k = [el === 'right' ? 0.25 : -0.25, 1.2, -0.35]
      await s.evaluate(([e, k, m]) => __b.kumandaKoy(e, k, m), [el, k, m])
      await x.kare(2)
      await x.bas(el, tus)
    },
    /** Tutulan katmanı `hedef`e götürür: el yolu kazancın yarısı. `pay`: hedefin yanına bırakma. */
    tasi: async (id, hedef, el = 'right', pay = [0, 0, 0]) => {
      const m = await s.evaluate((i) => __b.merkezYerel(i), id)
      const d = [0, 1, 2].map((a) => (hedef[a] + pay[a] - m[a]) / 2)
      await s.evaluate(([e, d]) => __b.kumandaKaydir(e, d), [el, d])
      await x.kare()
    },
    ev: (id) => s.evaluate((i) => __b.evYerel(i), id),
    /** Süzülmeler bitene dek bekler. */
    durul: async () => {
      let once = JSON.stringify((await x.d()).katman)
      for (let i = 0; i < 400; i++) {
        await x.kare(4)
        const simdi = JSON.stringify((await x.d()).katman)
        if (simdi === once) return
        once = simdi
      }
      throw new Error('katmanlar durmadı')
    },
    yerlestir: async (id, el = 'right') => {
      await x.tut(id, el)
      await x.tasi(id, await x.ev(id), el)
      await x.birak(el, 'squeeze')
      await x.durul()
    },
    kaydet: async (ad) => {
      const r = await s.evaluate(() => __sim.yakala())
      writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { sol: r.sol, sag: r.sag }
    },
    panel: async (ad) => { const u = await s.evaluate(() => __b.panelPng()); writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64')) },
    menu: async (ad) => { const u = await s.evaluate(() => __sim.dokuPng('menu')); writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64')) },
  }
  return x
}
const evde = (k) => k.every((v) => v === 0)

try {
  const { sayfa, hatalar, x } = await ac()
  const ilk = await x.d()
  await x.gir()
  await x.menu('0-menu-normal')

  // Rafta: katmanlar kullanıcının sağında, üst üste binmeden.
  await x.basla()
  let d = await x.d()
  assert.ok(d.birlesimde && !d.menu, 'oyun açılmadı veya menü kapanmadı')
  assert.equal(d.rig.olcek, 100)
  assert.equal(d.kameraCocuk, 2, 'etiket ve durum paneli başa bağlı değil')
  assert.deepEqual(d.cocuk, [1, 1, 1], 'katman adları yok')
  const raflar = await Promise.all([CATI, KASNAK, KUBBE].map((i) => sayfa.evaluate((i) => __b.merkezYerel(i), i)))
  assert.ok(raflar.every((r) => r[0] > 0.5), `raf sağda değil: ${raflar}`)
  assert.ok(raflar[KUBBE][1] < raflar[KASNAK][1] && raflar[KASNAK][1] < raflar[CATI][1], `raf sırası: ${raflar}`)
  assert.ok(!d.katman.some(evde), 'katman evinde kaldı')
  await x.panel('1-panel-ilk')
  adim('Menü: Maketi birleştir; katmanlar sağda rafta, menü kapalı, etiket ve panel başa bağlı', { raflar })
  adim('Kare: raf', await x.kaydet('1-raf'))

  // Çizim yalnız durum değişince: bekleyen ve nişan alınan karelerde tuvale yazı yok.
  await x.menuYaz()
  await sayfa.evaluate(([k, m]) => __b.kumandaKoy('right', k, m), [[0.25, 1.2, -0.35], raflar[CATI]])
  await x.kare(30)
  assert.deepEqual(await x.yazilar(), [], 'kare döngüsünde doku çizildi')
  adim('30 karede tuvale çizim yok')

  // Çubuk oyunda maketi oynatmaz.
  const rig0 = (await x.d()).rig
  await sayfa.evaluate(() => __sim.cubuk('right', 1, 1))
  await x.kare(6)
  await sayfa.evaluate(() => __sim.cubuk('right', 0, 0))
  await x.kare(2)
  assert.deepEqual((await x.d()).rig, rig0, 'çubuk oyunda rig oynattı')
  adim('Sağ çubuk oyunda rig oynatmıyor')

  // Tetik tutmaz, kavrama tutar.
  await x.tut(CATI, 'right', 'trigger')
  const once = (await x.d()).katman[CATI]
  await sayfa.evaluate(() => __b.kumandaKaydir('right', [0, 0.1, 0]))
  await x.kare()
  assert.deepEqual((await x.d()).katman[CATI], once, 'tetik katmanı tuttu')
  await x.birak('right', 'trigger')
  adim('Tetik katman tutmuyor')

  // Yanlış sıra: Kubbeler önce.
  await x.tut(KUBBE)
  const rafKubbe = (await x.d()).katman[KUBBE]
  await x.tasi(KUBBE, await x.ev(KUBBE))
  d = await x.d()
  assert.ok(Math.hypot(...d.katman[KUBBE]) < 3, `kubbe hedefe gitmedi: ${d.katman[KUBBE]}`)
  adim('Kare: yanlış sıra tutuluyor', await x.kaydet('2-yanlis-tutulu'))
  await x.menuYaz()
  await x.birak('right', 'squeeze')
  await x.durul()
  d = await x.d()
  assert.deepEqual(d.katman[KUBBE], rafKubbe, `kubbe rafa dönmedi: ${d.katman[KUBBE]}`)
  assert.ok(d.birlesimde)
  let yazi = await x.yazilar()
  assert.ok(yazi.includes('Önce Çatı oturmalı. Sıra alttan üste gider.'), `uyarı yok: ${yazi}`)
  assert.ok(yazi.includes('Maketi birleştir: 0/3 katman yerinde'), `ilerleme: ${yazi}`)
  assert.ok(yazi.some((m) => /maketin üst üste oturma sırasıdır/.test(m)), 'sıra notu yok')
  await x.panel('2-panel-uyari')
  adim('Yanlış sıra: Kubbeler oturmadı, rafa döndü, Türkçe uyarı çizildi', { yazi })

  // Yakın değil: Çatı hedefin eşiği dışında bırakılır.
  await x.tut(CATI)
  const rafCati = (await x.d()).katman[CATI]
  await x.tasi(CATI, await x.ev(CATI), 'right', [0.25, 0, 0])
  d = await x.d()
  await x.menuYaz()
  await x.birak('right', 'squeeze')
  await x.durul()
  assert.deepEqual((await x.d()).katman[CATI], rafCati, 'uzak bırakılan çatı rafa dönmedi')
  assert.ok((await x.yazilar()).includes('Yerine yaklaşmadı. Yeniden dene.'))
  adim('Eşik dışı (25 cm): oturmadı, rafa döndü', { bırakılan: d.katman[CATI] })

  // Eşik içi: 15 cm yanda bırakılan oturur.
  await x.tut(CATI)
  await x.tasi(CATI, await x.ev(CATI), 'right', [0.15, 0, 0])
  await x.menuYaz()
  await x.birak('right', 'squeeze')
  await x.durul()
  d = await x.d()
  assert.ok(evde(d.katman[CATI]), `çatı oturmadı: ${d.katman[CATI]}`)
  assert.ok((await x.yazilar()).includes('Çatı yerine oturdu.'))
  assert.deepEqual(d.cocuk.length, 3)
  adim('Çatı 15 cm yakından oturdu, evine süzüldü')

  // Oturan katman yeniden tutulmaz.
  await sayfa.evaluate(([k, m]) => __b.kumandaKoy('right', k, m), [[0.25, 1.2, -0.35], await x.ev(CATI)])
  await x.kare(2)
  await x.bas('right', 'squeeze')
  await sayfa.evaluate(() => __b.kumandaKaydir('right', [0, 0.1, 0]))
  await x.kare()
  assert.ok(evde((await x.d()).katman[CATI]), 'oturan katman tutuldu')
  await x.birak('right', 'squeeze')
  adim('Oturan katman yeniden tutulmuyor')

  // Kumanda koparsa rafa döner, deneme sayılmaz.
  await x.tut(KASNAK)
  const rafKasnak = (await x.d()).katman.at(KASNAK)
  await x.tasi(KASNAK, await x.ev(KASNAK), 'right', [0.3, 0, 0])
  await sayfa.evaluate(() => __sim.dagBaglanti('right', false))
  await x.kare(4)
  await x.durul()
  assert.deepEqual((await x.d()).katman[KASNAK], rafKasnak, 'kopan kumandanın katmanı rafa dönmedi')
  await sayfa.evaluate(() => __sim.dagBaglanti('right', true))
  await x.kare(4)
  adim('Kumanda koptu: katman rafa döndü')

  // İkinci katman sol elle, sonuncusu sağla.
  await x.yerlestir(KASNAK, 'left')
  assert.ok(evde((await x.d()).katman[KASNAK]), 'kasnak oturmadı')
  adim('Sol kumandayla Kasnaklar oturdu')
  await x.menuYaz()
  await x.yerlestir(KUBBE)
  await sayfa.waitForFunction(() => !__t.xr.birlesimde(), null, { polling: 50 })
  await x.kare(2)
  d = await x.d()
  assert.ok(d.katman.every(evde), `hepsi yerinde değil: ${d.katman}`)
  assert.ok(d.menu, 'menü geri açılmadı')
  assert.deepEqual(d.cocuk, [0, 0, 0], 'katman adları kaldı')
  assert.equal(d.kameraCocuk, 2, 'tamamlandı mesajı hemen kalktı')
  yazi = await x.yazilar()
  assert.ok(yazi.includes('Tamamlandı: 3/3 katman yerinde') && yazi.includes('Maket birleşti.'), `tamamlandı mesajı: ${yazi}`)
  assert.ok(yazi.includes('Maketi birleştir'), `menü normale dönmedi: ${yazi}`)
  await x.panel('3-panel-tamam')
  await x.menu('3-menu-normal')
  adim('Hepsi oturdu: tamamlandı mesajı, normal menü', { katman: d.katman })
  adim('Kare: tamam', await x.kaydet('3-tamam'))
  await sayfa.waitForFunction(() => __t.camera.children.length === 1, null, { polling: 100, timeout: 20000 })
  adim('Tamamlandı mesajı kendiliğinden kalktı, Temsilî etiketi kaldı')

  // Yeniden başlat: katman eldeyken.
  await x.basla()
  await x.yerlestir(CATI)
  await x.tut(KASNAK, 'left')
  await sayfa.evaluate(() => __b.kumandaKaydir('left', [0, 0.1, 0]))
  await x.kare()
  await x.bas('right', 'b-button'); await x.birak('right', 'b-button')
  assert.ok((await x.d()).menu, 'B ile menü açılmadı')
  await x.menu('4-menu-oyun')
  await x.oge(0, 3)
  await x.kare(3)
  d = await x.d()
  assert.ok(d.birlesimde && !d.menu)
  assert.ok(d.katman.every((k) => !evde(k)), `yeniden başlatınca hepsi rafta değil: ${d.katman}`)
  assert.deepEqual(d.cocuk, [1, 1, 1])
  await sayfa.evaluate(() => __b.kumandaKaydir('left', [0, 0.1, 0]))
  const rafta = (await x.d()).katman
  await x.kare(3)
  assert.deepEqual((await x.d()).katman, rafta, 'katman elde kaldı')
  await x.birak('left', 'squeeze')
  adim('Menü: Yeniden başlat, katman eldeyken; hepsi rafta, elde kalmadı')

  // Birleştirmeyi bırak.
  await x.bas('right', 'b-button'); await x.birak('right', 'b-button')
  await x.oge(1, 3)
  await sayfa.waitForFunction(() => !__t.xr.birlesimde(), null, { polling: 50 })
  await x.kare(20)
  d = await x.d()
  assert.ok(d.katman.every(evde) && d.menu && d.kameraCocuk === 1, JSON.stringify(d))
  adim('Menü: Birleştirmeyi bırak; katmanlar evde, normal menü')

  // Oyun sonrası parçala ve içeri gir bozulmadı; parçalıyken oyun öğesi yok, oyun parçalıdan başlamaz.
  await x.oge(1, 4)
  await x.kare(3)
  d = await x.d()
  assert.ok(d.parcali && d.katman.every((k) => k[1] > 0 && k[0] === 0 && k[2] === 0), `parçala: ${d.katman}`)
  await x.oge(1, 3)
  await x.kare(3)
  d = await x.d()
  assert.ok(!d.parcali && d.katman.every(evde), `birleştir: ${d.katman}`)
  await x.basla()
  assert.ok(!(await x.d()).katman.some(evde))
  await x.bas('right', 'b-button'); await x.birak('right', 'b-button')
  await x.oge(1, 3)
  await sayfa.waitForFunction(() => !__t.xr.birlesimde(), null, { polling: 50 })
  await x.kare(20)
  await x.oge(0, 4)
  await sayfa.waitForFunction(() => __t.iceride, null, { polling: 50 })
  await x.kare(20)
  d = await x.d()
  assert.ok(d.katman.every(evde) && d.rig.olcek === 1, JSON.stringify(d))
  adim('Oyundan sonra Parçala, Birleştir ve İçeri gir çalışıyor')
  await x.bas('right', 'b-button'); await x.birak('right', 'b-button')
  await x.oge(0, 10)
  await sayfa.waitForFunction(() => !__t.iceride, null, { polling: 50 })
  await x.kare(20)
  assert.ok(!(await x.d()).iceride)

  // Oyun ortasında menüden çıkış.
  await x.basla()
  await x.yerlestir(CATI)
  await x.bas('right', 'b-button'); await x.birak('right', 'b-button')
  await x.oge(2, 3)
  await sayfa.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await sayfa.getByRole('button', { name: "VR'da aç" }).waitFor()
  await sayfa.waitForFunction(() => document.querySelector('.maket-kontrol button') && !document.querySelector('.maket-kontrol button').disabled)
  d = await x.d()
  const masaustuTamam = (d, ad) => {
    assert.ok(!d.sunuyor && !d.birlesimde, ad)
    assert.ok(d.katman.every(evde), `${ad}: katmanlar evde değil: ${d.katman}`)
    assert.deepEqual(d.cocuk, [0, 0, 0], `${ad}: ad panelleri kaldı`)
    assert.equal(d.kameraCocuk, 0, `${ad}: kamerada panel kaldı`)
    assert.equal(d.kameraEbeveyn, null, ad)
    assert.equal(d.sahneCocuk, ilk.sahneCocuk, `${ad}: sahnede nesne kaldı`)
    assert.deepEqual([d.near, d.far, d.kontrol], [ilk.near, ilk.far, ilk.kontrol], ad)
  }
  masaustuTamam(d, 'menüden çıkış')
  adim("Menü: VR'dan çık, oyun ortasında; masaüstü temiz")

  // Katman eldeyken dışarıdan kapanış (Meta düğmesi yerine session.end).
  await x.gir()
  await x.basla()
  await x.tut(KUBBE)
  await sayfa.evaluate(() => __b.kumandaKaydir('right', [0, 0.1, 0]))
  await x.kare()
  await sayfa.evaluate(() => __sim.bitir())
  await sayfa.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
  await sayfa.getByRole('button', { name: "VR'da aç" }).waitFor()
  await x.kare(3)
  masaustuTamam(await x.d(), 'dışarıdan kapanış')
  adim('Dışarıdan kapanış, katman eldeyken: masaüstü temiz')

  // Masaüstü Parçala hâlâ yalnız y'de gider.
  await sayfa.getByRole('button', { name: /Parçala/ }).click()
  await sayfa.waitForFunction(() => __t.katmanlar[2].grup.position.y > 20, null, { polling: 100 })
  d = await x.d()
  assert.ok(d.katman.every((k) => k[0] === 0 && k[2] === 0), `masaüstü parçala: ${d.katman}`)
  adim('Masaüstü Parçala çalışıyor')

  assert.deepEqual(hatalar, [], 'konsol hatası')
  adim('Konsol temiz')
  console.log(`Maket birleştirme VR simülasyonu: ${denetim} denetim geçti.`)
} finally { await tarayici.close() }
