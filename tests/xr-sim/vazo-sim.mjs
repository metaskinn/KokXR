// Vazo atölyesi WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager. Gerçek cihaz yerine geçmez.
// Hazırlık ve çalıştırma için bkz. kur.sh. Kumanda olayları gerçek akıştan gelir; tutma ve bırakma kumanda hareketiyle yapılır.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const EKRAN = S + '/ekran-vazo'
mkdirSync(EKRAN, { recursive: true })
const SURE = 180000
// Yazılımsal çizim yavaştır (paylaşılan makinede 1. senaryo ~9 dk). Mac'te ANGLE=metal çok daha hızlı.
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
const SENARYOLAR = (process.env.SENARYO ?? '1,2,3').split(',')
const ADIMLAR = []
const adim = (ad, dayanak = '') => { ADIMLAR.push(ad); console.log(`GEÇTİ  ${ad}${dayanak ? ' ' + JSON.stringify(dayanak) : ''}`) }

async function ac(hazirlik) {
  const sayfa = await (await tarayici.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
  const hatalar = []
  sayfa.on('pageerror', (e) => { hatalar.push('pageerror: ' + e); if (process.env.SIM_AYRINTI) console.log('pageerror', e.stack) })
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()) })
  sayfa.setDefaultTimeout(SURE)
  await sayfa.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
  await sayfa.addInitScript({ path: S + '/sim-sayfa.js' })
  await sayfa.addInitScript(sayfaYardimcilari)
  await sayfa.goto(`${url}/atolye/vazo`)
  await sayfa.waitForFunction(() => window.__t?.kare > 2 && ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { polling: 100 })
  if (hazirlik) await sayfa.evaluate(hazirlik)
  return { sayfa, hatalar, x: kisa(sayfa) }
}

function sayfaYardimcilari() {
  const t = () => window.__t, sim = () => window.__sim
  const yerel = (v) => { const r = sim().rig(); r.updateWorldMatrix(true, false); return r.worldToLocal(v.clone()).toArray() }
  window.__v = {
    parcaYerel: (id) => yerel(t().parcalar[id].getWorldPosition(new (t().THREE.Vector3)())),
    hedefYerel: (id) => yerel(t().hedefler[id].position),
    panel: () => t().scene.children.find((c) => c.geometry?.parameters?.width === 64),
    // Panelin düğmesine nişan alır: i. düğmenin ortası.
    dugmeNoktasi: (i) => sim().panelNoktasi(window.__v.panel(), i === 0 ? 0.265 : 0.735, 0.19),
    etiket: () => { const e = t().camera.children[0]; return e ? { var: true, gorunur: e.visible, derinlik: e.material.depthTest, png: e.material.map.image.toDataURL('image/png') } : { var: false } },
    panelPng: () => window.__v.panel().material.map.image.toDataURL('image/png'),
    // Kumandayı bir noktaya çevirir, yerini elle verilen konuma alır.
    kumandaKoy: (el, konum, hedef) => {
      const { THREE } = t(), k = sim().d.controllers[el]
      const C = new THREE.Vector3(...konum), y = new THREE.Vector3(...hedef).sub(C).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
      k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
    },
    kumandaKaydir: (el, d) => { const k = sim().d.controllers[el]; k.position.set(k.position.x + d[0], k.position.y + d[1], k.position.z + d[2]) },
    kumandaDondur: (el, rad) => { const { THREE } = t(), k = sim().d.controllers[el]; const q = new THREE.Quaternion(k.quaternion.x, k.quaternion.y, k.quaternion.z, k.quaternion.w).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad)); k.quaternion.set(q.x, q.y, q.z, q.w) },
    // Uygulamaya gamepad yok görünür; IWER'in kendi tuş işlemesi aynı alandan okuduğu için ona gerçeği döner.
    gamepadSil: () => {
      window.__gamepadOkuma = 0
      for (const k of sim().d.activeSession.inputSources) {
        const asil = k.gamepad
        Object.defineProperty(k, 'gamepad', { configurable: true, get() {
          // Yalnız doğrudan çağıran bakılır: XR karesi zaten IWER'in içinden başlar.
          if (new Error().stack.split('\n')[2]?.includes('iwer.min.js')) return asil
          window.__gamepadOkuma++
          return undefined
        } })
      }
    },
    durum: () => {
      const T = t(), { THREE, camera, renderer, parcalar, hedefler, base, birlesimIzleri, saglamGorunum, siluet, scene } = T
      const dunya = (o) => o.getWorldPosition(new THREE.Vector3())
      return {
        oturum: !!sim().d.activeSession, sunuyor: renderer.xr.isPresenting, onarim: T.durum.onarim, yerlesen: [...T.durum.yerlesen], secili: T.durum.secili, hareket: T.hareket,
        saglam: saglamGorunum.visible, izler: birlesimIzleri.visible, siluet: siluet.visible, parcaGorunur: parcalar.map((p) => p.visible),
        parcaUzak: parcalar.map((p, i) => Number(dunya(p).distanceTo(hedefler[i].position).toFixed(3))),
        rafUzak: parcalar.map((p, i) => Number(dunya(p).distanceTo(T.raflar[i]).toFixed(3))),
        parcaEbeveynSahne: parcalar.every((p) => p.parent === scene), izKonum: dunya(birlesimIzleri).toArray().map((v) => Number(v.toFixed(3))), izEbeveynSahne: birlesimIzleri.parent === scene, saglamEbeveynSahne: saglamGorunum.parent === scene,
        near: camera.near, far: camera.far, fov: Number(camera.fov.toFixed(3)), kameraEbeveyn: camera.parent ? camera.parent.type : null, kameraOlcek: camera.scale.toArray().map((v) => Number(v.toFixed(4))), kameraCocuk: camera.children.length,
        taban: base.scale.x, sahneCocuk: scene.children.length, kontrol: T.controls.enabled, kanvas: [renderer.domElement.width, renderer.domElement.height], oran: renderer.getPixelRatio(),
        rig: camera.parent ? { p: camera.parent.position.toArray().map((v) => Number(v.toFixed(2))), rotY: Number(camera.parent.rotation.y.toFixed(3)), olcek: camera.parent.scale.x } : null,
        bas: dunya(camera).toArray().map((v) => Number(v.toFixed(2))),
      }
    },
  }
}

const kisa = (s) => {
  const x = {
    d: () => s.evaluate(() => __v.durum()),
    kare: (n = 3) => s.evaluate((n) => __sim.kareBekle(n, 60000), n),
    bas: async (el, dugme) => { await s.evaluate(([e, d]) => __sim.bas(e, d, 1), [el, dugme]); await x.kare() },
    birak: async (el, dugme) => { await s.evaluate(([e, d]) => __sim.bas(e, d, 0), [el, dugme]); await x.kare() },
    koy: async (el, konum, hedef) => { await s.evaluate(([e, k, h]) => __v.kumandaKoy(e, k, h), [el, konum, hedef]); await x.kare() },
    kaydir: async (el, d) => { await s.evaluate(([e, d]) => __v.kumandaKaydir(e, d), [el, d]); await x.kare() },
    dondur: async (el, r) => { await s.evaluate(([e, r]) => __v.kumandaDondur(e, r), [el, r]); await x.kare() },
    gir: async () => {
      await s.getByRole('button', { name: "VR'da aç" }).click()
      await s.waitForFunction(() => window.__t.renderer.xr.isPresenting && window.__t.camera.parent, null, { polling: 100 })
      await x.kare(5)
      await s.getByRole('button', { name: "VR'dan çık" }).waitFor()
    },
    /** Paneldeki düğmeye nişan alıp tetikle basar. */
    panel: async (i, el = 'right') => {
      const n = await s.evaluate((i) => __v.dugmeNoktasi(i), i)
      await x.koy(el, el === 'right' ? [0.15, 1.2, -0.1] : [-0.15, 1.2, -0.1], n)
      await x.bas(el, 'trigger'); await s.evaluate((e) => __sim.bas(e, 'trigger', 0), el)
      await x.kare().catch(() => {})
    },
    /** Parçaya uzaktan nişan alır ve tutar. */
    isinlaTut: async (id, el = 'right') => {
      const p = await s.evaluate((i) => __v.parcaYerel(i), id)
      const k = [p[0] * 0.3 + (el === 'right' ? 0.1 : -0.1), p[1] + 0.45, p[2] + 0.55]
      await x.koy(el, k, p)
      await x.bas(el, 'trigger')
      assert.equal((await x.d()).secili, id, `ışınla parça ${id} tutulamadı`)
    },
    /** Elinle tutarken parçayı verilen noktaya taşır (kumanda aynı kadar gider). */
    tasi: async (id, hedef, el = 'right') => {
      const p = await s.evaluate((i) => __v.parcaYerel(i), id)
      await x.kaydir(el, [hedef[0] - p[0], hedef[1] - p[1], hedef[2] - p[2]])
    },
    /** Tutar, hedefine götürür, bırakır, oturmasını bekler. */
    yerlestir: async (id, el = 'right', tus = 'trigger') => {
      if (tus === 'trigger') await x.isinlaTut(id, el)
      else {
        const p = await s.evaluate((i) => __v.parcaYerel(i), id)
        await x.koy(el, [p[0], p[1], p[2] + 0.02], [p[0], p[1], p[2] - 1])
        await x.bas(el, 'squeeze')
        assert.equal((await x.d()).secili, id, `sıkmayla parça ${id} tutulamadı`)
      }
      await x.tasi(id, await s.evaluate((i) => __v.hedefYerel(i), id), el)
      await x.birak(el, tus)
      await s.waitForFunction((i) => window.__t.durum.yerlesen.includes(i) && window.__t.hareket === 0, id, { polling: 50 })
      await x.kare(2)
    },
    kaydet: async (ad) => {
      const r = await s.evaluate(() => __sim.yakala())
      writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { sol: r.sol, sag: r.sag, gozFarki: r.gozFarki }
    },
    png: async (ifade, ad) => {
      const u = await s.evaluate(ifade)
      writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64'))
    },
  }
  return x
}

const RAF_TOL = 0.1
function masaustuGeriGeldi(d, ilk, ad) {
  assert.equal(d.sunuyor, false, ad + ': hâlâ sunuyor')
  assert.equal(d.kameraEbeveyn, null, ad + ': kamera rig içinde')
  assert.equal(d.kameraCocuk, 0, ad + ': kameraya etiket takılı kaldı')
  assert.deepEqual([d.near, d.far, d.fov, d.oran], [ilk.near, ilk.far, ilk.fov, ilk.oran], ad + ': kamera veya piksel oranı dönmedi')
  assert.deepEqual(d.kanvas, ilk.kanvas, ad + ': tuval boyutu dönmedi')
  assert.deepEqual(d.kameraOlcek, [1, 1, 1], ad + ': kamera ölçeği')
  assert.equal(d.taban, 1, ad + ': masaüstü tablası dönmedi')
  assert.equal(d.kontrol, true, ad + ': kamera kontrolü kapalı kaldı')
  assert.equal(d.sahneCocuk, ilk.sahneCocuk, ad + ': sahnede rig, panel veya ortam kaldı')
  assert.ok(d.parcaEbeveynSahne && d.izEbeveynSahne && d.saglamEbeveynSahne, ad + ': dayanakta nesne kaldı')
  assert.deepEqual(d.izKonum, ilk.izKonum, ad + ': onarım izleri yerinden oynadı')
}

try {
  // ---------- 1. Baştan sona, iki kumanda ----------
  if (SENARYOLAR.includes('1')) {
    const { sayfa, hatalar, x } = await ac()
    const ilk = await x.d()
    assert.ok(ilk.saglam && !ilk.onarim)
    await x.gir()
    let d = await x.d()
    assert.equal(d.rig.olcek, 100)
    assert.ok(d.sunuyor && d.saglam && !d.onarim && d.parcaGorunur.every((v) => !v), 'VR izsiz vazoyla başlamadı')
    // Kullanıcıya yakın: yatayda 70 cm, başın altında.
    assert.ok(Math.abs(Math.hypot(d.bas[0], d.bas[2]) - 70) < 1, `vazo uzak: ${d.bas}`)
    const etiket = await sayfa.evaluate(() => __v.etiket())
    assert.ok(etiket.var && etiket.gorunur && etiket.derinlik === false, 'Temsilî etiketi başa bağlı değil')
    await x.png(() => __v.etiket().png, 'etiket')
    await x.png(() => __v.panelPng(), '1-panel-izsiz')
    adim("VR'da aç: izsiz vazo masada 1:1, 70 cm önde; Temsilî etiketi başa bağlı", { rig: d.rig, bas: d.bas })
    adim('Kare: izsiz', await x.kaydet('1-izsiz'))

    // İzsiz vazoda parça tutulamaz, bütün vazo tutulup çevrilir.
    await x.koy('left', [-0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.bas('left', 'trigger')
    await x.kare(4)
    d = await x.d()
    assert.equal(d.secili, null)
    assert.equal(d.saglamEbeveynSahne, false, 'izsiz vazo ele alınmadı')
    await x.birak('left', 'trigger')
    await x.kare(30)
    d = await x.d()
    assert.ok(d.parcaUzak.every((v) => v < 0.2), `izsiz vazo masaya dönmedi: ${d.parcaUzak}`)
    adim('İzsiz vazo ele alındı, masaya döndü; görünmez parça tutulmadı')

    await x.panel(0)
    await sayfa.waitForFunction(() => __t.durum.onarim)
    await x.kare(2)
    d = await x.d()
    assert.ok(!d.saglam && d.siluet && d.parcaGorunur.every(Boolean) && d.parcaEbeveynSahne && d.saglamEbeveynSahne, JSON.stringify(d))
    assert.ok(d.rafUzak.every((v) => v < RAF_TOL), `parçalar rafta değil: ${d.rafUzak}`)
    assert.equal(d.taban < 1, true, 'VR tablası uygulanmadı')
    await x.png(() => __v.panelPng(), '2-panel-onarim')
    adim('Panel: Vazoyu parçala; parçalar tablada, siluet görünür', { rafUzak: d.rafUzak })
    adim('Kare: parçalandı', await x.kaydet('2-parcali'))

    // Yanlış bırakma: masaüstündeki yol, geri döner, deneme sayılır, yerleşmez.
    await x.isinlaTut(0)
    const once = (await x.d()).rafUzak[0]
    await x.kaydir('right', [0.05, 0.12, 0])
    assert.ok((await x.d()).rafUzak[0] > once + 5, 'parça kumandayla gitmedi')
    await x.birak('right', 'trigger')
    await sayfa.waitForFunction(() => __t.hareket === 0, null, { polling: 50 })
    d = await x.d()
    assert.deepEqual(d.yerlesen, [])
    assert.ok(d.rafUzak[0] < RAF_TOL, 'yanlış bırakılan parça rafa dönmedi')
    assert.match(await sayfa.locator('.vazo-mesaj').textContent(), /henüz yerine yaklaşmadı/)
    await sayfa.getByText('Deneme: 1').waitFor()
    await x.png(() => __v.panelPng(), '3-panel-yanlis')
    adim('Yanlış bırakma: parça rafa döndü, deneme 1, yerleşen 0')

    // Eşik sınırı: hedefin hemen dışı oturmaz, içi oturur (masaüstü işlevi yerineOturur, eşik 9 cm).
    await x.isinlaTut(0)
    const h0 = await sayfa.evaluate(() => __v.hedefYerel(0))
    await x.tasi(0, [h0[0] + 0.095, h0[1], h0[2]])
    await x.birak('right', 'trigger')
    await sayfa.waitForFunction(() => __t.hareket === 0, null, { polling: 50 })
    assert.deepEqual((await x.d()).yerlesen, [], '9,5 cm oturdu')
    await x.isinlaTut(0)
    await x.tasi(0, [h0[0] + 0.085, h0[1], h0[2]])
    await x.birak('right', 'trigger')
    await sayfa.waitForFunction(() => __t.durum.yerlesen.includes(0) && __t.hareket === 0, null, { polling: 50 })
    d = await x.d()
    assert.ok(d.parcaUzak[0] < 0.1, 'oturan parça hedefe gitmedi')
    adim('Eşik: 9,5 cm oturmadı, 8,5 cm otomatik oturdu', { parca0: d.parcaUzak[0] })

    await x.yerlestir(1)                 // ışın + tetik
    await x.yerlestir(2, 'left')         // öteki kumanda
    adim('Işın + tetik, iki kumandayla parça 2 ve 3 yerleşti')
    await x.yerlestir(3, 'right', 'squeeze') // değerek + sıkma
    adim('Sıkma tuşuyla, değerek parça 4 yerleşti')
    await x.yerlestir(4, 'left', 'squeeze')
    await x.yerlestir(5)
    await sayfa.waitForFunction(() => __t.durum.yerlesen.length === 6 && __t.hareket === 0, null, { polling: 50 })
    await x.kare(3)
    d = await x.d()
    assert.ok(d.izler && !d.siluet && !d.saglam, 'onarım izleri görünmedi')
    assert.ok(d.parcaUzak.every((v) => v < 0.1), `parçalar yerinde değil: ${d.parcaUzak}`)
    await sayfa.getByText('Vazo onarıldı!').first().waitFor()
    await x.png(() => __v.panelPng(), '4-panel-tamam')
    adim('Tamamlandı: 6/6, onarım izleri görünür, siluet gizli', { parcaUzak: d.parcaUzak })
    adim('Kare: tamam', await x.kaydet('3-tamam'))

    // İnceleme: bütün vazo elde gider, izler birlikte taşınır, bırakınca masaya döner.
    const izEv = d.izKonum
    await x.koy('right', [0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.bas('right', 'trigger')
    await x.dondur('right', 0.9)
    await x.kaydir('right', [0, 0.1, 0.05])
    await x.kare(8)
    d = await x.d()
    assert.equal(d.izEbeveynSahne, false, 'vazo ele alınmadı')
    assert.notDeepEqual(d.izKonum, izEv, 'izler vazoyla gitmedi')
    adim('İnceleme: vazo elde, izler birlikte', { izKonum: d.izKonum })
    adim('Kare: inceleme', await x.kaydet('4-inceleme'))
    await x.birak('right', 'trigger')
    await x.kare(30)
    d = await x.d()
    assert.ok(d.parcaUzak.every((v) => v < 0.2), `bırakınca masaya dönmedi: ${d.parcaUzak}`)
    adim('Bırakınca vazo masaya döndü', { parcaUzak: d.parcaUzak })

    // Elde vazo varken öteki kumandayla panelden yeniden başlat.
    await x.koy('left', [-0.1, 1.2, -0.25], [0, 0.97, -0.7])
    await x.bas('left', 'trigger')
    await x.kaydir('left', [0, 0.1, 0])
    await x.kare(5)
    await x.panel(0)
    await sayfa.waitForFunction(() => __t.durum.yerlesen.length === 0 && __t.durum.onarim)
    await x.kare(3)
    d = await x.d()
    assert.ok(d.parcaEbeveynSahne && d.izEbeveynSahne, 'dayanak boşalmadı')
    assert.ok(d.rafUzak.every((v) => v < RAF_TOL), `yeniden başlatınca raf bozuk: ${d.rafUzak}`)
    assert.equal(d.izler, false)
    await x.birak('left', 'trigger')
    adim('Panel: Yeniden parçala, vazo eldeyken; parçalar rafta', { rafUzak: d.rafUzak })

    // Parça elde varken yeniden başlat; parça elde kalmaz.
    await x.isinlaTut(2, 'left')
    await x.kaydir('left', [0, 0.1, 0])
    await x.panel(0)
    await x.kare(4)
    await x.birak('left', 'trigger')
    await x.kaydir('left', [0, 0.1, 0])
    await x.kare(3)
    assert.ok((await x.d()).rafUzak[2] < RAF_TOL, 'yeniden başlatınca parça elde kaldı')
    adim('Panel: Yeniden başlat, parça eldeyken; parça elde kalmadı')

    // Bir parça, sonra panelden çıkış.
    await x.yerlestir(0)
    await x.panel(1)
    await sayfa.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await sayfa.waitForFunction(() => __t.kare > 0)
    await sayfa.getByRole('button', { name: "VR'da aç" }).waitFor()
    d = await x.d()
    masaustuGeriGeldi(d, ilk, 'panelden çıkış')
    assert.deepEqual(d.yerlesen, [0], 'ilerleme kayboldu')
    assert.equal(await sayfa.locator('.vazo-tutamac:not([hidden])').count(), 5)
    assert.match(await sayfa.locator('.vazo-mesaj').textContent(), /1\/6 parça yerinde/)
    assert.ok(await sayfa.getByRole('button', { name: 'Yeniden parçala' }).isEnabled(), 'masaüstü düğmeleri kilitli kaldı')
    await sayfa.locator('.vazo-sahne canvas').screenshot({ path: `${EKRAN}/5-masaustu.png` })
    adim("Panel: VR'dan çık; masaüstü kamera, boyut, sahne geri geldi, ilerleme 1/6 korundu", { kanvas: d.kanvas, near: d.near, far: d.far })

    // Çıkan oturumun ardından masaüstünde sürükleme hâlâ çalışıyor mu?
    const tut = sayfa.locator('.vazo-tutamac[data-parca-id="1"]')
    await tut.scrollIntoViewIfNeeded()
    const b = await tut.boundingBox()
    await sayfa.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await sayfa.mouse.down()
    await sayfa.waitForFunction(() => __t.durum.secili === 1)
    await sayfa.mouse.move(b.x + 40, b.y + 40, { steps: 3 }); await sayfa.mouse.up()
    await sayfa.waitForFunction(() => document.querySelector('.vazo-mesaj').textContent.includes('henüz'))
    adim('VR sonrası masaüstünde parça sürükleme çalışıyor')

    // Yeniden giriş: yarım onarım sürer.
    await x.gir()
    d = await x.d()
    assert.deepEqual(d.yerlesen, [0])
    assert.ok(d.rafUzak.slice(1).every((v) => v < RAF_TOL), `yeniden girişte raf bozuk: ${d.rafUzak}`)
    adim('Yeniden giriş: yarım onarım VR\'da sürüyor')

    // Meta düğmesi: oturum dışarıdan kapanır, parça eldeyken.
    await x.isinlaTut(1)
    await x.kaydir('right', [0, 0.1, 0])
    await sayfa.evaluate(() => __sim.bitir())
    await sayfa.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await sayfa.getByRole('button', { name: "VR'da aç" }).waitFor()
    await sayfa.waitForFunction(() => __t.kare > 0)
    d = await x.d()
    masaustuGeriGeldi(d, ilk, 'dışarıdan kapanış')
    assert.deepEqual(d.yerlesen, [0], 'kopan tutuş yerleşti')
    assert.ok(d.rafUzak[1] < RAF_TOL, 'elde kalan parça masaüstü rafına dönmedi')
    adim('Dışarıdan kapanış (Meta düğmesi yerine session.end), parça eldeyken: masaüstü geri geldi, parça rafta')

    assert.deepEqual(hatalar, [], 'konsol hatası')
    adim('Senaryo 1 konsol temiz')
    await sayfa.context().close()
  }

  // ---------- 2. Tek kumanda, gamepad yok, baş dönük ----------
  if (SENARYOLAR.includes('2')) {
    const { sayfa, hatalar, x } = await ac(() => { __sim.basYaw(0.8); __sim.dagBaglanti('left', false) })
    await x.gir()
    await sayfa.evaluate(() => __v.gamepadSil())
    await x.kare(3)
    let d = await x.d()
    assert.ok(Math.abs(d.rig.rotY + 0.8) < 0.01, `rig dönmedi: ${d.rig.rotY}`)
    await x.panel(0)
    await sayfa.waitForFunction(() => __t.durum.onarim)
    await x.kare(2)
    for (let id = 0; id < 6; id++) await x.yerlestir(id)
    d = await x.d()
    assert.deepEqual(d.yerlesen, [0, 1, 2, 3, 4, 5])
    assert.ok(d.izler)
    adim('Tek kumanda, gamepad yok, baş 46° dönük: 6/6 tamamlandı', { rig: d.rig, uygulamanınGamepadOkuması: await sayfa.evaluate(() => window.__gamepadOkuma), girdiSayisi: await sayfa.evaluate(() => __sim.d.activeSession.inputSources.length) })
    await x.panel(1)
    await sayfa.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    assert.deepEqual(hatalar, [], 'konsol hatası')
    adim('Senaryo 2 konsol temiz')
    await sayfa.context().close()
  }

  // ---------- 3. Kumanda kopması ve rota değişimi ----------
  if (SENARYOLAR.includes('3')) {
    const { sayfa, hatalar, x } = await ac()
    await x.gir()
    await x.panel(0)
    await sayfa.waitForFunction(() => __t.durum.onarim)
    await x.kare(2)
    await x.isinlaTut(0)
    await x.kaydir('right', [0, 0.1, 0])
    await sayfa.evaluate(() => __sim.dagBaglanti('right', false))
    await x.kare(4)
    await sayfa.waitForFunction(() => __t.hareket === 0, null, { polling: 50 })
    let d = await x.d()
    assert.deepEqual(d.yerlesen, [])
    assert.equal(d.secili, null)
    assert.ok(d.rafUzak[0] < RAF_TOL, 'kopan kumandanın parçası rafa dönmedi')
    await sayfa.getByText('Deneme: 0').waitFor()
    adim('Kumanda koptu: parça rafa döndü, deneme sayılmadı')
    await sayfa.evaluate(() => __sim.dagBaglanti('right', true))
    await x.kare(4)
    await x.yerlestir(0)
    adim('Kumanda geri geldi: tutma sürüyor')

    const oturum = await sayfa.evaluateHandle(() => { const o = __sim.d.activeSession; window.__son = { bitti: false }; o.addEventListener('end', () => { window.__son.bitti = true }); return o })
    await oturum.dispose()
    // IWER'in tam ekran tuvali sayfayı örter: fare yerine doğrudan tıklama olayı.
    await sayfa.getByRole('link', { name: 'Ana sayfaya dön' }).dispatchEvent('click')
    await sayfa.waitForFunction(() => window.__son.bitti, null, { polling: 100 })
    await sayfa.waitForFunction(() => !document.querySelector('.vazo-sahne canvas'))
    await sayfa.waitForTimeout(500)
    assert.deepEqual(hatalar, [], 'rota değişiminde hata')
    adim('VR açıkken rota değişti: oturum kapandı, tuval kalktı, konsol temiz')
    await sayfa.context().close()
  }
  console.log(`Vazo VR simülasyonu: ${ADIMLAR.length} denetim geçti.`)
} finally { await tarayici.close() }
