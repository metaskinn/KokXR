// Muradiye çini panosu WebXR akışı: IWER (Quest 3 taklidi) + gerçek three.js WebXRManager. Gerçek cihaz yerine geçmez.
// Hazırlık ve çalıştırma için bkz. kur.sh. Kumanda olayları gerçek akıştan gelir.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const S = process.env.XR_SIM ?? (() => { throw new Error('XR_SIM klasörünü ver; bkz. kur.sh') })()
const url = process.env.TEST_URL ?? 'http://127.0.0.1:4174'
const EKRAN = S + '/ekran-restorasyon'
mkdirSync(EKRAN, { recursive: true })
const ANGLE = process.env.ANGLE ?? 'swiftshader'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'])] })
const SENARYOLAR = (process.env.SENARYO ?? '0,1,2,3,4').split(',')
const ROZET = 'muradiye-kulliyesi:restorasyon'
const VERI = JSON.parse(readFileSync(new URL('../../src/data/eserler/muradiye-kulliyesi.json', import.meta.url), 'utf8'))
const ADIMLAR = []
const adim = (ad, dayanak = '') => { ADIMLAR.push(ad); console.log(`GEÇTİ  ${ad}${dayanak ? ' ' + JSON.stringify(dayanak) : ''}`) }

async function ac({ sim = true, hazirlik } = {}) {
  const sayfa = await (await tarayici.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
  const hatalar = [], istekler = []
  sayfa.on('pageerror', (e) => hatalar.push('pageerror: ' + e))
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()) })
  sayfa.on('request', (r) => istekler.push(r.url()))
  sayfa.setDefaultTimeout(120000)
  if (sim) {
    await sayfa.addInitScript({ path: S + '/paket/node_modules/iwer/build/iwer.min.js' })
    await sayfa.addInitScript({ path: S + '/sim-sayfa.js' })
    await sayfa.addInitScript(sayfaYardimcilari)
  }
  await sayfa.goto(`${url}/eser/muradiye-kulliyesi`)
  if (hazirlik) await sayfa.evaluate(hazirlik)
  return { sayfa, hatalar, istekler, x: kisa(sayfa) }
}

function sayfaYardimcilari() {
  // Tuvale yazılan her metin: panel içeriği ve kare döngüsünde yeniden çizim buradan denetlenir.
  window.__yazilar = []
  const asil = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (m, ...k) { window.__yazilar.push(m); return asil.call(this, m, ...k) }
  const t = () => window.__t, sim = () => window.__sim
  const dunya = (o) => o.getWorldPosition(new (t().THREE.Vector3)()).toArray()
  const yuvaLocal = (y) => {
    const { sutun, satir, oran } = t().OLCU, en = 1 / sutun, boy = 1 / oran / satir
    return [(y % sutun - (sutun - 1) / 2) * en, -0.05 + ((satir - 1) / 2 - Math.floor(y / sutun)) * boy, -0.85]
  }
  const alanDan = (p) => t().alan.localToWorld(new (t().THREE.Vector3)(...p)).toArray()
  const el = (ad) => {
    const i = [...sim().d.activeSession.inputSources].findIndex((k) => k.handedness === ad)
    return t().eller[i]
  }
  window.__v = {
    parcaDunya: (id) => dunya(t().meshler[id]),
    yuvaDunya: (y) => alanDan(yuvaLocal(y)),
    alanDan,
    durumPanel: () => t().durum.nesne,
    dugmeNoktasi: (i) => {
      const n = t().durum.nesne, g = n.geometry.parameters
      n.updateWorldMatrix(true, false)
      return n.localToWorld(new (t().THREE.Vector3)(((i === 0 ? 0.265 : 0.735) - 0.5) * g.width, (0.19 - 0.5) * g.height, 0)).toArray()
    },
    durumPng: () => t().durum.nesne.material.map.image.toDataURL('image/png'),
    bilgiPng: () => t().bilgi.material.map.image.toDataURL('image/png'),
    kumandaKoy: (ad, konum, hedef) => {
      const { THREE } = t(), k = sim().d.controllers[ad]
      const C = new THREE.Vector3(...konum), y = new THREE.Vector3(...hedef).sub(C).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
      k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
    },
    kumandaKaydir: (ad, d) => { const k = sim().d.controllers[ad]; k.position.set(k.position.x + d[0], k.position.y + d[1], k.position.z + d[2]) },
    tutulan: (ad) => el(ad).tutulan,
    durum: () => {
      const T = t(), { renderer, parcalar, hamle, bitis, sonuc, meshler, alan, hedefVurgular, eller, camera } = T
      const yerel = (o) => o.position.toArray().map((v) => Number(v.toFixed(4)))
      return {
        oturum: !!sim().d.activeSession, sunuyor: renderer.xr.isPresenting, parcalar, hamle, bitis, sonuc,
        konum: meshler.map(yerel), olcek: meshler.map((m) => Number(m.scale.x.toFixed(3))), zAci: meshler.map((m) => Number(m.rotation.z.toFixed(4))),
        secili: meshler.map((m) => m.children[0].visible), hedefVurgu: hedefVurgular.map((h) => h.visible ? yerel(h) : null), tutulan: eller.map((e) => e.tutulan),
        alanY: Number(alan.rotation.y.toFixed(3)), alanP: alan.position.toArray().map((v) => Number(v.toFixed(3))), bas: camera.position.toArray().map((v) => Number(v.toFixed(3))),
        yazi: window.__yazilar.length,
      }
    },
    rozetler: () => JSON.parse(localStorage.getItem('kokxr-rozetler') ?? '[]'),
  }
}

const EL_YAN = { right: 0.15, left: -0.15 }

const kisa = (s) => {
  const x = {
    d: () => s.evaluate(() => __v.durum()),
    kare: (n = 3) => s.evaluate((n) => __sim.kareBekle(n, 60000), n),
    bas: async (el, dugme) => { await s.evaluate(([e, d]) => __sim.bas(e, d, 1), [el, dugme]); await x.kare() },
    birak: async (el, dugme) => { await s.evaluate(([e, d]) => __sim.bas(e, d, 0), [el, dugme]); await x.kare() },
    /** Tetiğe basıp bırakır. */
    tetik: async (el = 'right') => { await x.bas(el, 'trigger'); await x.birak(el, 'trigger') },
    koy: async (el, konum, hedef) => { await s.evaluate(([e, k, h]) => __v.kumandaKoy(e, k, h), [el, konum, hedef]); await x.kare() },
    kaydir: async (el, d) => { await s.evaluate(([e, d]) => __v.kumandaKaydir(e, d), [el, d]); await x.kare() },
    gir: async () => {
      await s.getByRole('button', { name: "VR'da onar" }).click()
      await s.waitForFunction(() => window.__t?.renderer.xr.isPresenting && window.__t.yerlesti, null, { polling: 100 })
      await x.kare(3)
      await s.getByRole('button', { name: "VR'dan çık" }).waitFor()
    },
    /** Kumandayı başın altından hedefe çevirir. */
    nisanla: async (el, hedef) => {
      const k = await s.evaluate(([e]) => __v.alanDan([e, -0.35, -0.1]), [EL_YAN[el]])
      await x.koy(el, k, hedef)
    },
    panel: async (i, el = 'right') => {
      await x.nisanla(el, await s.evaluate((i) => __v.dugmeNoktasi(i), i))
      await s.evaluate((e) => __sim.bas(e, 'trigger', 1), el)
      // Çıkış düğmesinde oturum kapanır ve kare gelmez: yalnız öteki düğmede kare beklenir.
      if (i === 1) return
      await x.kare()
      await s.evaluate((e) => __sim.bas(e, 'trigger', 0), el)
      await x.kare()
    },
    /** Parçaya nişan alıp kavrar. */
    tut: async (id, el = 'right') => {
      await x.nisanla(el, await s.evaluate((i) => __v.parcaDunya(i), id))
      await x.bas(el, 'squeeze')
      assert.equal(await s.evaluate((e) => __v.tutulan(e), el), id, `parça ${id} tutulamadı`)
    },
    /** Tutulan parçayı yuvanın önüne götürür. */
    tasi: async (id, yuva, el = 'right', pay = [0, 0, 0]) => {
      const [p, h] = await s.evaluate(([i, y]) => [__v.parcaDunya(i), __v.yuvaDunya(y)], [id, yuva])
      await x.kaydir(el, [h[0] - p[0] + pay[0], h[1] - p[1] + pay[1], h[2] - p[2] + 0.02 + pay[2]])
    },
    birakKare: async (el = 'right') => { await x.birak(el, 'squeeze'); await x.kare(2) },
    /** Tut, götür, bırak. */
    yerlestir: async (id, yuva, el = 'right') => {
      await x.tut(id, el)
      await x.tasi(id, yuva, el)
      await x.birakKare(el)
    },
    /** Tutarken tetikle düzeltir. */
    duzelt: async (id, el = 'right') => {
      for (let k = 0; k < 4; k++) {
        const { parcalar } = await x.d()
        if (parcalar.find((p) => p.id === id).donus === 0) return
        await x.tetik(el)
      }
    },
    /** Eksiksiz, doğru yerleştirir. */
    onar: async (id, el = 'right') => {
      await x.tut(id, el)
      await x.duzelt(id, el)
      await x.tasi(id, id, el)
      await x.birakKare(el)
    },
    png: async (ifade, ad) => {
      const u = await s.evaluate(ifade)
      writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(u.split(',')[1], 'base64'))
    },
    kaydet: async (ad) => {
      const r = await s.evaluate(() => __sim.yakala())
      writeFileSync(`${EKRAN}/${ad}.png`, Buffer.from(r.png.split(',')[1], 'base64'))
      return { sol: r.sol, sag: r.sag, gozFarki: r.gozFarki }
    },
    rozetler: () => s.evaluate(() => __v.rozetler()),
  }
  return x
}

/** Masaüstü bulmacası: gerçek düğmelerle baştan sona. */
async function masaustundeOnar(sayfa) {
  const sec = sayfa.locator('.restorasyon')
  const parca = (id) => sec.getByRole('button', { name: new RegExp(`^Parça ${id},`) })
  for (let id = 1; id <= 8; id++) {
    await parca(id).click()
    for (let k = 0; k < 4 && !(await parca(id).getAttribute('aria-label')).includes(', düz,'); k++) await sec.getByRole('button', { name: '⟳ Döndür' }).click()
    await sec.getByRole('button', { name: `Boş yuva ${id}`, exact: true }).click()
  }
  await sec.locator('strong', { hasText: 'Pano onarıldı!' }).waitFor()
}

const yakin = (a, b, tol = 1e-3) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) <= tol, `${a} ≠ ${b}`))
const birlesik = (d) => d.join('\n').replace(/\s+/g, ' ')

try {
  // ---------- 0. XR'siz tarayıcı: düğme yok, VR kodu inmez ----------
  if (SENARYOLAR.includes('0')) {
    const { sayfa, hatalar, istekler } = await ac({ sim: false })
    await sayfa.getByRole('button', { name: 'Panoyu parçala ve onar' }).waitFor()
    await sayfa.waitForTimeout(800)
    assert.equal(await sayfa.getByRole('button', { name: "VR'da onar" }).count(), 0, 'XR yokken VR düğmesi görünüyor')
    const js = istekler.filter((u) => u.endsWith('.js')).map((u) => u.split('/').pop())
    assert.ok(!js.some((u) => /^(xr|three|vazoXr)/i.test(u)), `VR kodu indi: ${js}`)
    await sayfa.getByRole('button', { name: 'Panoyu parçala ve onar' }).click()
    await masaustundeOnar(sayfa)
    assert.ok((await sayfa.evaluate(() => JSON.parse(localStorage.getItem('kokxr-rozetler')))).includes(ROZET), 'masaüstü rozeti yok')
    assert.deepEqual(hatalar.filter((h) => !h.includes('360')), [], 'konsol hatası')
    adim('XR yok: VR düğmesi görünmez, VR kodu inmez, masaüstü bulmaca tamamlanır ve rozet verir', { js })
    await sayfa.context().close()
  }

  // ---------- 1. Baştan sona: tut, yanlış yuva, yeniden al, döndür, bitiş, rozet, çıkış ----------
  if (SENARYOLAR.includes('1')) {
    const { sayfa, hatalar, istekler, x } = await ac()
    const vrDugme = sayfa.getByRole('button', { name: "VR'da onar" })
    await vrDugme.waitFor()
    const istekOnce = istekler.length
    await x.gir()
    let d = await x.d()
    assert.ok(d.sunuyor)
    assert.equal(d.parcalar.length, 8)
    assert.ok(d.parcalar.every((p) => p.yuva === null && p.donus !== 0), 'karışık başlamadı')
    assert.ok(d.olcek.every((o) => o === 0.6))
    adim("VR'da onar: oturum açıldı, parçalar tepside, hepsi karışık", { alanP: d.alanP })

    // Panel: yalnız JSON'daki metin, kaynak ve not.
    const yazilar = await sayfa.evaluate(() => window.__yazilar)
    const ham = birlesik(yazilar)
    for (const parca of [VERI.restorasyon.metin, VERI.restorasyon.not]) assert.ok(ham.includes(parca), `panelde yok: ${parca}\n--- panelde:\n${ham}`)
    assert.match(ham, /gerçek bir restorasyon yöntemini temsil etmez/)
    const kaynak = VERI.kaynaklar.find((k) => k.id === VERI.restorasyon.kaynakId)
    assert.ok(ham.includes(`Kaynak: ${kaynak.metin}, s. ${kaynak.sayfa}`), `kaynak yok:\n${ham}`)
    await x.png(() => __v.bilgiPng(), '1-bilgi-paneli')
    await x.png(() => __v.durumPng(), '1-durum-paneli')
    adim('Bilgi paneli: metin, not ve kaynak satırı birebir JSON\'dan', { kaynak: `s. ${kaynak.sayfa}` })
    adim('Kare: başlangıç', await x.kaydet('1-baslangic'))

    // Kare döngüsünde doku çizilmez.
    let once = (await x.d()).yazi
    await x.kare(30)
    assert.equal((await x.d()).yazi, once, 'boşta panel yeniden çiziliyor')
    adim('Boşta 30 kare: panel dokusu yeniden çizilmedi')

    // Dışarıdan bir şey inmez (kumanda modeli yok), başka görsel yok.
    const yeni = istekler.slice(istekOnce)
    assert.ok(yeni.every((u) => u.startsWith(url)), `dışarıya istek: ${yeni.filter((u) => !u.startsWith(url))}`)
    const gorseller = yeni.filter((u) => /\.(jpe?g|png|webp|avif|glb|gltf)(\?|$)/i.test(u))
    assert.ok(gorseller.every((u) => u.endsWith('/restorasyon/muradiye-cini.jpg')), `başka görsel: ${gorseller}`)
    adim('Oturumda dışarıya istek yok; görsel yalnız muradiye-cini.jpg', { gorseller: gorseller.map((u) => u.split('/').pop()) })

    // Boş yere kavrama ve tutmadan tetik: bir şey tutulmaz.
    await x.nisanla('right', await sayfa.evaluate(() => __v.alanDan([0, 1, -1])))
    await x.bas('right', 'squeeze')
    assert.equal(await sayfa.evaluate(() => __v.tutulan('right')), null)
    await x.birak('right', 'squeeze')
    const a = (await x.d()).parcalar[0].id, b = (await x.d()).parcalar[1].id
    await x.nisanla('right', await sayfa.evaluate((i) => __v.parcaDunya(i), a))
    d = await x.d()
    assert.equal(d.secili[a], true, 'nişan alınan parça vurgulanmadı')
    await x.tetik()
    d = await x.d()
    assert.equal(d.tutulan.every((t) => t === null), true, 'tetik parça tuttu')
    assert.match(d.sonuc, /yan tuşa/)
    assert.equal(d.hamle, 0)
    adim('Boş yere kavrama ve tutmadan tetik: parça tutulmadı, yan tuşa yönlendirdi')

    // Tut: parça kumandayla gider, tam boyuta gelir.
    await x.tut(a)
    d = await x.d()
    assert.equal(d.olcek[a], 1)
    const k0 = d.konum[a]
    await x.kaydir('right', [0, 0.15, -0.1])
    d = await x.d()
    yakin(d.konum[a], [k0[0], k0[1] + 0.15, k0[2] - 0.1], 0.01)
    adim('Kavrama: parça kumandayla gidiyor', { konum: d.konum[a] })

    // Yanlış yuva: oturur, bitiş yok, yeniden alınabilir.
    const yanlis = (a + 1) % 8
    await x.tasi(a, yanlis)
    await x.kare(2)
    d = await x.d()
    assert.ok(d.hedefVurgu.some(Boolean), 'hedef yuva vurgulanmadı')
    adim('Kare: yuvaya götürürken', await x.kaydet('2-tasirken'))
    await x.birakKare()
    d = await x.d()
    const pa = () => d.parcalar.find((p) => p.id === a)
    assert.equal(pa().yuva, yanlis, 'yanlış yuvaya oturmadı')
    assert.equal(d.hamle, 1)
    assert.equal(d.bitis, false)
    assert.equal(d.olcek[a], 1)
    adim('Yanlış yuvaya bırakıldı: oturdu, bitiş yok, hamle 1', { yuva: yanlis })

    // Uzağa bırak: eski yerine döner, hamle sayılmaz.
    const eski = d.konum[a]
    await x.tut(a)
    await x.kaydir('right', [0, 1.2, 0])
    await x.birakKare()
    d = await x.d()
    assert.equal(pa().yuva, yanlis)
    assert.equal(d.hamle, 1)
    assert.match(d.sonuc, /yaklaştır/)
    yakin(d.konum[a], eski)
    adim('Panodan uzağa bırakılan parça eski yuvasına döndü, hamle sayılmadı')

    // Yanlış parça yeniden alınır; tutarken tetikle 90°, dört basışta başa döner.
    await x.tut(a)
    const ilkDonus = pa().donus
    d = await x.d()
    const baslangicZ = d.zAci[a]
    for (let k = 1; k <= 4; k++) {
      await x.tetik()
      d = await x.d()
      assert.equal(pa().donus, (ilkDonus + k) % 4, 'mantık dönüşü')
      yakin([d.zAci[a]], [-((ilkDonus + k) % 4) * Math.PI / 2], 1e-3)
      assert.equal(d.tutulan.includes(a), true, 'tetik parçayı bıraktırdı')
    }
    assert.equal(d.hamle, 5)
    await x.png(() => __v.durumPng(), '2-durum-dondurme')
    adim('Yanlış parça yeniden alındı; tetikle 4 × 90° döndü, saat yönünde', { baslangicZ })
    await x.duzelt(a)
    d = await x.d()
    assert.equal(pa().donus, 0)

    // Doğru yere yanlış yönle; yön düzelmeden bitmez.
    await x.tasi(a, a)
    await x.birakKare()
    d = await x.d()
    assert.equal(pa().yuva, a)
    assert.equal(pa().donus, 0)
    yakin(d.konum[a].slice(0, 2), [(a % 4 - 1.5) * 0.25, -0.05 + (0.5 - Math.floor(a / 4)) * 0.25])
    adim('Doğru yer ve yön: parça yuva merkezine oturdu', { konum: d.konum[a] })

    // En yakın yuva: merkezden kayık bırakılan oturur; başa yakın tutulan, göründüğü yuvaya gider.
    await x.tut(b)
    await x.tasi(b, b, 'right', [0.08, -0.06, 0])
    await x.birakKare()
    d = await x.d()
    assert.equal(d.parcalar.find((p) => p.id === b).yuva, b, 'kayık bırakma en yakın yuvaya gitmedi')
    yakin(d.konum[b].slice(0, 2), [(b % 4 - 1.5) * 0.25, -0.05 + (0.5 - Math.floor(b / 4)) * 0.25])
    await x.tut(b)
    const yakinYuva = await sayfa.evaluate(([y]) => {
      const bas = window.__t.camera.getWorldPosition(new (window.__t.THREE.Vector3)()).toArray()
      const h = __v.yuvaDunya(y), p = __v.parcaDunya(window.__t.eller.find((e) => e.tutulan !== null).tutulan)
      return [0, 1, 2].map((i) => bas[i] + (h[i] - bas[i]) * 0.65 - p[i])
    }, [(b + 2) % 8])
    await x.kaydir('right', yakinYuva)
    await x.kare(2)
    await x.birakKare()
    d = await x.d()
    assert.equal(d.parcalar.find((p) => p.id === b).yuva, (b + 2) % 8, 'izdüşüm: göründüğü yuvaya gitmedi')
    adim('En yakın yuva: 8 cm kayık oturdu; başa yakın tutulan parça göründüğü yuvaya gitti')

    // Dolu yuvaya bırakma: oradaki parça taşınanın eski yerine (burada tepsiye) iner.
    const tepside = d.parcalar.find((p) => p.yuva === null && p.id !== a && p.id !== b).id
    const tepsiKonum = d.konum[tepside]
    const hedefYuva = (b + 2) % 8
    await x.tut(tepside)
    await x.tasi(tepside, hedefYuva)
    await x.birakKare()
    d = await x.d()
    assert.equal(d.parcalar.find((p) => p.id === tepside).yuva, hedefYuva)
    assert.equal(d.parcalar.find((p) => p.id === b).yuva, null, 'oradaki parça tepsiye inmedi')
    assert.equal(d.olcek[b], 0.6)
    adim('Dolu yuvaya bırakma: oradaki parça tepsiye indi', { tepsiKonum })

    // Hepsi tahtada, biri dönük: bitiş yok. Tutarken düzeltince de bitmez, bırakınca biter.
    d = await x.d()
    const son = d.parcalar.find((p) => p.id !== a).id
    for (const p of d.parcalar) if (p.id !== a && p.id !== son) await x.onar(p.id)
    await x.tut(son)
    d = await x.d()
    if (d.parcalar.find((p) => p.id === son).donus === 0) await x.tetik()
    await x.tasi(son, son)
    await x.birakKare()
    d = await x.d()
    assert.ok(d.parcalar.every((p) => p.yuva === p.id), JSON.stringify(d.parcalar))
    assert.equal(d.bitis, false, 'dönük parçayla bitti')
    assert.deepEqual((await x.rozetler()).filter((r) => r === ROZET), [], 'erken rozet')
    await x.png(() => __v.durumPng(), '3-durum-son-dokunus')
    adim('Hepsi doğru yerde, biri dönük: bitmedi, rozet yok')
    adim('Kare: son dokunuş', await x.kaydet('3-son-dokunus'))
    await x.tut(son)
    await x.duzelt(son)
    d = await x.d()
    assert.equal(d.parcalar.find((p) => p.id === son).donus, 0)
    assert.equal(d.bitis, false, 'tutarken bitti')
    assert.deepEqual((await x.rozetler()).filter((r) => r === ROZET), [], 'tutarken rozet')
    await x.birakKare()
    d = await x.d()
    assert.equal(d.bitis, true, 'bitiş yok')
    assert.ok((await x.rozetler()).includes(ROZET), 'rozet verilmedi')
    const toplam = d.hamle
    await x.kare(3)
    await x.png(() => __v.durumPng(), '4-durum-bitis')
    assert.ok(birlesik(await sayfa.evaluate(() => window.__yazilar.slice(-8))).includes('Pano onarıldı!'), 'bitiş mesajı çizilmedi')
    adim('Bırakınca bitti: "Pano onarıldı!" ve aynı rozet', { hamle: toplam, rozet: ROZET })
    adim('Kare: bitiş', await x.kaydet('4-bitis'))

    // Bitince parça tutulmaz.
    await x.nisanla('right', await sayfa.evaluate((i) => __v.parcaDunya(i), a))
    await x.bas('right', 'squeeze')
    assert.equal(await sayfa.evaluate(() => __v.tutulan('right')), null, 'bitince parça tutuldu')
    await x.birak('right', 'squeeze')
    adim('Bitince parçalar kilitli')

    // Çıkış düğmesi: sayfa geri gelir, bitmiş bulmaca masaüstünde görünür.
    await x.panel(1)
    await sayfa.waitForFunction(() => !__sim.d.activeSession && !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await vrDugme.waitFor()
    await sayfa.getByText(`rozeti kazandın (${toplam} hamle)`).waitFor()
    await sayfa.getByText(VERI.restorasyon.metin).waitFor()
    adim("Panelden VR'dan çık: oturum kapandı; masaüstünde aynı bitiş, metin ve hamle", { hamle: toplam })

    // Masaüstü bulmacası aynı kurallarla baştan oynanır.
    await sayfa.getByRole('button', { name: 'Baştan başla' }).click()
    await masaustundeOnar(sayfa)
    await sayfa.locator('.restorasyon').screenshot({ path: `${EKRAN}/5-masaustu.png` })
    adim('VR sonrası masaüstü bulmaca baştan sona oynandı')

    // Bitmişken yeniden giriş: yeni pano; hamlesiz çıkınca sayfa girildiği gibi.
    const metin = await sayfa.locator('.restorasyon .yanit').first().textContent()
    await x.gir()
    d = await x.d()
    assert.ok(d.parcalar.every((p) => p.yuva === null), 'bitmiş panoya girildi')
    await x.panel(1)
    await sayfa.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await vrDugme.waitFor()
    assert.equal(await sayfa.locator('.restorasyon .yanit').first().textContent(), metin, 'hamlesiz çıkış sayfayı değiştirdi')
    adim('Hamlesiz çıkış: sayfa girildiği gibi kaldı')

    assert.deepEqual(hatalar, [], 'konsol hatası')
    adim('Senaryo 1 konsol temiz')
    await sayfa.context().close()
  }

  // ---------- 2. Tek kumanda, baş dönük, masaüstünden devam, Meta düğmesi ----------
  if (SENARYOLAR.includes('2')) {
    const { sayfa, hatalar, x } = await ac({ hazirlik: () => { __sim.basYaw(0.8); __sim.dagBaglanti('left', false) } })
    // Masaüstünde bir parça yerleştir: VR aynı onarımı sürdürür.
    const sec = sayfa.locator('.restorasyon')
    await sayfa.getByRole('button', { name: 'Panoyu parçala ve onar' }).click()
    await sec.getByRole('button', { name: /^Parça 3,/ }).click()
    await sec.getByRole('button', { name: 'Boş yuva 5', exact: true }).click()
    await sayfa.getByText('Hamle: 1').waitFor()
    await x.gir()
    let d = await x.d()
    assert.ok(Math.abs(d.alanY - 0.8) < 0.01, `pano başa dönmedi: ${d.alanY}`)
    assert.equal(d.parcalar.find((p) => p.id === 2).yuva, 4, 'masaüstü onarımı VR\'a gelmedi')
    assert.equal(d.hamle, 1)
    adim('Baş 46° dönük: pano önünde; masaüstünde başlanan onarım VR\'da sürüyor', { alanY: d.alanY })
    adim('Kare: baş dönük', await x.kaydet('6-bas-donuk'))

    // Meta düğmesi: parça eldeyken dışarıdan kapanış; parça eski yerine döner.
    await x.tut(2)
    await x.kaydir('right', [0, 0.1, 0])
    await sayfa.evaluate(() => __sim.bitir())
    await sayfa.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await sayfa.getByRole('button', { name: "VR'da onar" }).waitFor()
    await sec.getByText('Hamle: 1').waitFor()
    await sec.getByRole('button', { name: /^Parça 3, .*5\. yuvada/ }).waitFor()
    adim('Dışarıdan kapanış, parça eldeyken: masaüstünde parça yuvasında, hamle 1')

    // Masaüstünde sürdürülür, sonra VR'da tamamlanır.
    await sec.getByRole('button', { name: /^Parça 1,/ }).click()
    await sec.getByRole('button', { name: 'Boş yuva 1', exact: true }).click()
    await sayfa.getByText('Hamle: 2').waitFor()
    await x.gir()
    for (const { id } of (await x.d()).parcalar) await x.onar(id)
    d = await x.d()
    assert.equal(d.bitis, true, JSON.stringify(d.parcalar))
    assert.ok((await x.rozetler()).includes(ROZET))
    await sayfa.evaluate(() => __sim.bitir())
    await sayfa.waitForFunction(() => !__t.renderer.xr.isPresenting, null, { polling: 100 })
    await sec.locator('strong', { hasText: 'Pano onarıldı!' }).waitFor()
    assert.deepEqual(hatalar, [], 'konsol hatası')
    adim('Tek kumanda, baş dönük: masaüstü + VR onarımı bitti, rozet verildi, konsol temiz')
    await sayfa.context().close()
  }

  // ---------- 3. İki kumanda: panelden baştan başla, kumanda kopması ----------
  if (SENARYOLAR.includes('3')) {
    const { sayfa, hatalar, x } = await ac()
    await x.gir()
    let d = await x.d()
    const [p0, p1, p2] = d.parcalar.map((p) => p.id)
    await x.yerlestir(p0, p1, 'left')
    await x.tut(p1, 'left')
    await x.tut(p2, 'right')
    d = await x.d()
    assert.equal(d.tutulan.filter((t) => t !== null).length, 2, 'iki el aynı anda tutamadı')
    adim('İki kumanda aynı anda birer parça tutuyor')
    await x.birak('right', 'squeeze')
    await x.kare(3)
    await x.panel(0)
    await x.kare(2)
    d = await x.d()
    assert.ok(d.parcalar.every((p) => p.yuva === null), 'Baştan başla panoyu boşaltmadı')
    assert.equal(d.hamle, 0)
    assert.equal(d.tutulan.every((t) => t === null), true, 'yeniden karınca parça elde kaldı')
    assert.ok(d.olcek.every((o) => o === 0.6), 'tepsi ölçeği dönmedi')
    await x.birak('left', 'squeeze')
    await x.kare(2)
    d = await x.d()
    assert.equal(d.hamle, 0, 'tuş bırakılınca kopan tutuş hamle saydı')
    adim('Panel: Baştan başla, parça eldeyken: pano karıldı, elde parça kalmadı')

    // Kopan kumanda: parça eski yerine, hamle sayılmaz.
    const id = d.parcalar[0].id
    const ev = d.konum[id]
    await x.tut(id)
    await x.kaydir('right', [0, 0.1, 0])
    await sayfa.evaluate(() => __sim.dagBaglanti('right', false))
    await x.kare(4)
    d = await x.d()
    assert.deepEqual(d.konum[id], ev, 'kopan kumandanın parçası dönmedi')
    assert.equal(d.hamle, 0)
    adim('Kumanda koptu: parça tepsiye döndü, hamle sayılmadı')
    await sayfa.evaluate(() => __sim.dagBaglanti('right', true))
    await x.kare(4)
    await sayfa.evaluate(() => __sim.bas('right', 'squeeze', 0))
    await x.kare(2)
    await x.yerlestir(id, id)
    d = await x.d()
    assert.equal(d.parcalar.find((p) => p.id === id).yuva, id)
    adim('Kumanda geri geldi: tutma sürüyor')

    // Rota değişimi: oturum kapanır, hata yok.
    await sayfa.evaluate(() => { const o = __sim.d.activeSession; window.__son = false; o.addEventListener('end', () => { window.__son = true }) })
    await sayfa.getByRole('link', { name: '← Ana sayfaya dön' }).dispatchEvent('click')
    await sayfa.waitForFunction(() => window.__son, null, { polling: 100 })
    await sayfa.waitForFunction(() => !document.querySelector('.restorasyon'))
    await sayfa.waitForTimeout(400)
    assert.deepEqual(hatalar, [], 'rota değişiminde hata')
    adim('VR açıkken rota değişti: oturum kapandı, konsol temiz')
    await sayfa.context().close()
  }

  // ---------- 4. Oturum reddi ----------
  if (SENARYOLAR.includes('4')) {
    const { sayfa, hatalar } = await ac()
    await sayfa.getByRole('button', { name: "VR'da onar" }).waitFor()
    await sayfa.evaluate(() => { navigator.xr.requestSession = () => Promise.reject(new DOMException('reddedildi', 'NotAllowedError')) })
    await sayfa.getByRole('button', { name: "VR'da onar" }).click()
    await sayfa.getByRole('alert').filter({ hasText: 'VR oturumu açılamadı' }).waitFor()
    assert.ok(await sayfa.getByRole('button', { name: "VR'da onar" }).isEnabled())
    await sayfa.getByRole('button', { name: 'Panoyu parçala ve onar' }).click()
    await masaustundeOnar(sayfa)
    assert.deepEqual(hatalar, [], 'konsol hatası')
    adim('Oturum reddedildi: uyarı çıktı, masaüstü bulmaca oynandı')
    await sayfa.context().close()
  }
  console.log(`Muradiye VR simülasyonu: ${ADIMLAR.length} denetim geçti.`)
} finally { await tarayici.close() }
