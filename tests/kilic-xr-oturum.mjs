// Kılıç atölyesinin VR oturumu: gerçek Three.js WebXRManager, sahte WebXR çalışma ortamıyla (cihaz değil, emülatör değil).
// Baş ve kumanda pozları elle verilir; ekran görüntüleri test-sonuclari/kilic-xr-*.png.
// Çalıştırma: npm run build && npm run preview -- --port 4177 --strictPort, sonra TEST_URL=http://localhost:4177 node tests/kilic-xr-oturum.mjs
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const SURE = 240000
mkdirSync('test-sonuclari', { recursive: true })
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })

// Sayfaya enjekte edilen sahte WebXR: three'nin kullandığı en küçük yüzey.
function sahteXr({ gen, yuk }) {
  const poz = (p, ileri) => {
    const l = Math.hypot(...ileri), z = ileri.map(v => -v / l)
    let x = [z[2], 0, -z[0]] // yukarı × z
    const lx = Math.hypot(...x); x = lx < 1e-5 ? [1, 0, 0] : x.map(v => v / lx)
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]
    return new Float32Array([...x, 0, ...y, 0, ...z, 0, ...p, 1])
  }
  const ters = m => {
    const r = [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0]
    const t = [m[12], m[13], m[14]]
    return new Float32Array([...r, -(m[0] * t[0] + m[1] * t[1] + m[2] * t[2]), -(m[4] * t[0] + m[5] * t[1] + m[6] * t[2]), -(m[8] * t[0] + m[9] * t[1] + m[10] * t[2]), 1])
  }
  const n = .05, f = 70, proj = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -(f + n) / (f - n), -1, 0, 0, -2 * f * n / (f - n), 0])
  const kumanda = (el) => ({ el, ray: { p: [el === 'right' ? .2 : -.2, 1.2, -.2], y: [0, 0, -1] }, grip: { p: [el === 'right' ? .2 : -.2, 1.1, -.2], y: [0, 0, -1] } })
  const X = window.__xr = {
    bas: { p: [0, 1.6, 0], yaw: 0 }, kareler: 0, titresim: 0, oturum: null, sonlandi: 0, istek: [],
    el: { right: kumanda('right'), left: kumanda('left') }, kaynaklar: [], planli: [],
  }
  const uzay = f => ({ __poz: f })
  const kaynak = (el) => ({
    handedness: el, targetRayMode: 'tracked-pointer', profiles: [],
    targetRaySpace: uzay(() => poz(X.el[el].ray.p, X.el[el].ray.y)), gripSpace: uzay(() => poz(X.el[el].grip.p, X.el[el].grip.y)),
    gamepad: { axes: [0, 0, 0, 0], buttons: Array.from({ length: 6 }, () => ({ pressed: false, touched: false, value: 0 })), hapticActuators: [{ pulse: async () => { X.titresim++; return true } }] },
  })
  const kareOlustur = () => ({
    getViewerPose: () => {
      const b = X.bas, y = [-Math.sin(b.yaw), 0, -Math.cos(b.yaw)], o = poz(b.p, y)
      const goz = (eye, dx) => { const p = [b.p[0] + o[0] * dx, b.p[1] + o[1] * dx, b.p[2] + o[2] * dx], m = poz(p, y); return { eye, projectionMatrix: proj, transform: { matrix: m, inverse: { matrix: ters(m) } } } }
      return { transform: { matrix: o, inverse: { matrix: ters(o) } }, views: [goz('left', -.032), goz('right', .032)] }
    },
    getPose: (s) => ({ transform: { matrix: s.__poz() }, emulatedPosition: false }),
    getJointPose: () => null,
  })
  class Oturum extends EventTarget {
    renderState = { baseLayer: null, depthNear: .1, depthFar: 1000 }
    enabledFeatures = ['local-floor']; inputSources = []; visibilityState = 'visible'; environmentBlendMode = 'opaque'; bitti = false
    updateRenderState(s) { Object.assign(this.renderState, s) }
    async requestReferenceSpace(tur) { X.uzayTuru = tur; return { tur } }
    requestAnimationFrame(cb) { return requestAnimationFrame(t => { if (this.bitti) return; X.kareler++; for (const f of X.planli.splice(0)) f(); if (this.bitti) return; const k = kareOlustur(); k.session = this; cb(t, k) }) }
    cancelAnimationFrame(id) { cancelAnimationFrame(id) }
    async end() { if (this.bitti) throw new DOMException('kapalı', 'InvalidStateError'); this.bitti = true; X.sonlandi++; this.dispatchEvent(new Event('end')) }
  }
  window.XRWebGLLayer = class { constructor() { this.framebuffer = null; this.framebufferWidth = gen; this.framebufferHeight = yuk; this.antialias = true; this.fixedFoveation = 0 } getViewport(v) { return { x: v.eye === 'left' ? 0 : gen / 2, y: 0, width: gen / 2, height: yuk } } }
  WebGL2RenderingContext.prototype.makeXRCompatible = async function () {}
  window.XRWebGLBinding = undefined
  Object.defineProperty(navigator, 'xr', {
    configurable: true,
    value: {
      isSessionSupported: async k => k === 'immersive-vr',
      requestSession: async (kip, sec) => {
        X.istek.push({ kip, sec, jest: navigator.userActivation.isActive })
        const s = X.oturum = new Oturum()
        X.planli.length = 0
        // Kaynaklar oturum kurulduktan sonra gelir (gerçek cihazda da olay ile).
        setTimeout(() => {
          const eklenen = ['right', 'left'].map(kaynak); s.inputSources = eklenen; X.kaynaklar = eklenen
          const e = new Event('inputsourceschange'); e.added = eklenen; e.removed = []; s.dispatchEvent(e)
        }, 50)
        return s
      },
    },
  })
  const olay = (ad, el) => { const e = new Event(ad); e.inputSource = X.kaynaklar.find(k => k.handedness === el); e.frame = kareOlustur(); e.frame.session = X.oturum; X.oturum.dispatchEvent(e) }
  X.tetik = (el, bas) => X.planli.push(() => olay(bas ? 'selectstart' : 'selectend', el))
}

const sayfa = await tarayici.newPage({ viewport: { width: 1200, height: 800 } })
const hatalar = []
sayfa.on('pageerror', e => hatalar.push(String(e)))
sayfa.on('console', m => { if (m.type() === 'error') hatalar.push(m.text()) })
// Yazılımsal çizim yavaştır: mantık düşük çözünürlükte, ekran görüntüsü XR_GORUNTU=1 ile yüksek çözünürlükte denenir.
const [GEN, YUK] = process.env.XR_GORUNTU ? [1400, 700] : [240, 120]
await sayfa.addInitScript(sahteXr, { gen: GEN, yuk: YUK })
await sayfa.goto(`${url}/atolye/kilic`)
const alan = sayfa.locator('.kilic-sahne')
await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne')?.dataset.vurusX, null, { timeout: SURE })
const vrDugme = sayfa.getByRole('button', { name: "VR'da aç" })
await vrDugme.waitFor({ timeout: SURE })
await sayfa.locator('.kilic-yukleme').waitFor({ state: 'detached', timeout: SURE })

const veri = ad => alan.getAttribute(`data-${ad}`)
const sahne = async () => JSON.parse(await veri('xr-sahne') ?? '{}')
const kareBekle = (n = 3) => sayfa.evaluate(async n => { const b = window.__xr.kareler; while (window.__xr.kareler < b + n && !window.__xr.oturum?.bitti) await new Promise(r => setTimeout(r, 15)) }, n) // Kapanan oturumda kare gelmez
const bekle = async (kosul, ad, ms = 240000) => { const son = Date.now() + ms; while (Date.now() < son) { if (await kosul()) return; await sayfa.waitForTimeout(120) } throw new Error(`zaman aşımı: ${ad}; sahne ${await veri('xr-sahne')}; konsol ${hatalar.join(' | ')}; sayfa hatası ${await sayfa.locator('.kilic-xr-hata').count()}`) }
const asamaBekle = (n) => bekle(async () => await veri('asama') === String(n), `aşama ${n}`)
const rig = async () => JSON.parse(await veri('xr-rig'))
/** Dünya noktasını rig yereline çevirir. */
const yerel = (r, p) => { const dx = p[0] - r[0], dy = p[1] - r[1], dz = p[2] - r[2], c = Math.cos(r[3]), s = Math.sin(r[3]); return [dx * c - dz * s, dy, dx * s + dz * c] }
const nisanla = async (el, dunya) => {
  const y = yerel(await rig(), dunya)
  await sayfa.evaluate(({ el, y }) => { const k = window.__xr.el[el]; k.ray.y = y.map((v, i) => v - k.ray.p[i]) }, { el, y })
  await kareBekle(2)
}
const tetik = async (el, bas) => { await sayfa.evaluate(({ el, bas }) => window.__xr.tetik(el, bas), { el, bas }); await kareBekle(2) }
const dugme = async id => { const d = JSON.parse(await veri('xr-dugmeler')).find(k => k.id === id); assert(d, `düğme yok: ${id}`); return d }
const bas = async (id, el = 'left') => { await nisanla(el, (await dugme(id)).p); await tetik(el, true); await tetik(el, false) }
const basiliTut = async (id, kosul, ad, el = 'left') => { await nisanla(el, (await dugme(id)).p); await tetik(el, true); await bekle(kosul, ad); await tetik(el, false) }
const hedefNokta = async () => JSON.parse(await veri('xr-isaret'))
const basKonumu = (r, b) => { const c = Math.cos(r[3]), s = Math.sin(r[3]); return [r[0] + b[0] * c + b[2] * s, r[2] - b[0] * s + b[2] * c] }
// Three kare başında sol göz pozunu verir: 3,2 cm pay.
const istasyonda = async (x, z) => { await kareBekle(2); const b = await sayfa.evaluate(() => window.__xr.bas.p), h = basKonumu(await rig(), b); assert(Math.hypot(h[0] - x, h[1] - z) < .04, `baş ${h} ≠ ${x},${z}`) }
const goruntu = async ad => { if (!process.env.XR_GORUNTU) return; await kareBekle(3); await sayfa.evaluate(() => document.querySelector('.kilic-sahne').scrollIntoView()); await alan.screenshot({ path: `test-sonuclari/kilic-xr-${ad}.png` }) }
const olcum = []
const olc = async ad => { await kareBekle(4); const s = await sahne(); olcum.push({ asama: ad, cizim: s.cizim, ucgen: s.ucgen, program: s.program, doku: s.doku, geometri: s.geo }) }
// Kılıç aşamalar arasında kavisle taşınır; asıl konumuna oturunca nişan alınır.
const kilicDursun = async () => { let once = ''; await bekle(async () => { const k = JSON.stringify((await sahne()).kilic); const sabit = k === once; once = k; await kareBekle(2); return sabit }, 'kılıç otursun') }
const titresim = () => sayfa.evaluate(() => window.__xr.titresim)

// Önce: masaüstü kamerasının ekrana izdüşümü (çıkışta aynısına dönmeli).
const onceki = { x: Number(await veri('hedef-x')), o: Number(await veri('hedef-olcek')), w: await sayfa.evaluate(() => document.querySelector('.kilic-sahne canvas').width), css: await sayfa.evaluate(() => document.querySelector('.kilic-sahne canvas').clientWidth) }

const gir = async () => {
  await vrDugme.click()
  await bekle(async () => await veri('xr') === '1' && await veri('xr-sahne') && await veri('xr-dugmeler'), 'oturum açılışı')
  await kareBekle(3)
}
await gir()
{
  const istek = await sayfa.evaluate(() => ({ i: window.__xr.istek, u: window.__xr.uzayTuru }))
  assert.equal(istek.i[0].kip, 'immersive-vr'); assert(istek.i[0].jest, 'jest kayboldu'); assert.equal(istek.u, 'local-floor')
  const s = await sahne(); assert.equal(s.golge, false, 'VR gölgesi kapanmadı')
  const w = await sayfa.evaluate(() => document.querySelector('.kilic-sahne canvas').width); assert.equal(w, GEN, 'çizim tamponu XR boyutunda değil')
  assert(await veri('xr-bilgi'), 'bilgi paneli çizilmedi')
  for (const id of ['komut:usta', 'komut:bastan', 'cik', 'komut:al']) await dugme(id)
  assert(await sayfa.locator('.kilic-nokta:not([hidden])').count() === 0)
  await istasyonda(2.8, -1.75)
  console.log('giriş: immersive-vr + local-floor, jest içinde, gölge kapalı, tampon XR boyutunda, istasyon doğru.')
}

// --- Fiziksel rota ---
await olc('0 Külçe'); await goruntu('0-kulce')
await nisanla('right', await hedefNokta()); await tetik('right', true); await tetik('right', false); await asamaBekle(1)
await istasyonda(-3.1, -1)
console.log('külçe: ışın+tetik.')

await olc('1 Isıtma'); await goruntu('1-isitma')
await bekle(async () => (await hedefNokta())[0] < -3, 'işaret körüğe geçsin')
await nisanla('right', await hedefNokta()); await tetik('right', true)
await bekle(async () => (await sahne()).isi >= 850, 'körükle ısınma'); await tetik('right', false)
await bekle(async () => !(await dugme('komut:devam')).pasif, 'Örse geç etkin')
await bas('komut:devam'); await asamaBekle(2); await istasyonda(.1, .55)
console.log('ısıtma: körüğe ışın + basılı tetik, panelden örse geçiş.')

await olc('2 Dövme'); await goruntu('2-dovme')
{
  await bekle(async () => (await veri('cekic')) === '1', 'çekiç hazır'); await kilicDursun()
  const tOnce = await titresim()
  await nisanla('right', await hedefNokta()); await tetik('right', true); await tetik('right', false)
  await bekle(async () => (await veri('bolgeler')).split(',').some(Number), 'vuruş namluyu uzatsın')
  await bekle(async () => (await titresim()) > tOnce, 'çekiç titreşimi')
  const once = (await veri('bolgeler')).split(',').reduce((a, v) => a + Number(v), 0)
  // Hızla indirme: grip iki karede 40 cm aşağı. Işın aynı bölgede kalır.
  await bekle(async () => (await veri('cekic')) === '1', 'çekiç yeniden hazır')
  await sayfa.evaluate(async () => {
    const k = window.__xr.el.right, b = window.__xr.kareler
    for (let i = 0; i < 4; i++) { k.grip.p = [k.grip.p[0], k.grip.p[1] - .4, k.grip.p[2]]; while (window.__xr.kareler <= b + i) await new Promise(r => setTimeout(r, 5)) }
    k.grip.p = [k.grip.p[0], 1.1, k.grip.p[2]]
  })
  await bekle(async () => (await veri('bolgeler')).split(',').reduce((a, v) => a + Number(v), 0) > once, 'hızlı indirme vursun')
  console.log('dövme: ışın+tetik ve hızlı indirme vurdu, titreşim geldi.')
  await bas('bolge:5'); assert.equal((await sahne()).secili, 5, 'panel bölge seçmedi')
  await bas('komut:yeniden'); await istasyonda(-3.1, -1)
  await basiliTut('tut:koruk', async () => (await sahne()).isi > 950, 'panelden körük'); await bas('komut:devam'); await istasyonda(.1, .55)
  console.log('yeniden ısıtma: ocağa götürür, panelden körük, örse döner.')
  await bas('komut:usta'); await asamaBekle(3)
}
await istasyonda(1.95, 1.05)

await olc('3 Su verme'); await goruntu('3-su')
await nisanla('right', [1.95, .4, .15]); await tetik('right', true); await asamaBekle(4); await tetik('right', false)
assert((await sahne()).daldirma >= 1.5); await istasyonda(3.05, -.45)
console.log('su verme: basılı tetikle tamamlandı.')

await olc('4 Bileme'); await goruntu('4-bileme')
{
  const u0 = (await sahne()).bileU, c0 = (await sahne()).cilt
  await nisanla('right', [3.05, 1.1, -1.2]); await tetik('right', true)
  await kareBekle(6)
  await nisanla('right', [2.95, 1.1, -1.2]); await kareBekle(4)
  const u1 = (await sahne()).bileU
  await nisanla('right', [2.75, 1.1, -1.2]); await kareBekle(6)
  await bekle(async () => (await sahne()).cilt > c0, 'bileme ilerlesin'); await tetik('right', false)
  const s = await sahne(); assert(s.bileU > u0 || u1 > u0, `sola gezdirmek temas noktasını ilerletmedi ${u0} ${u1} ${s.bileU}`)
  console.log(`bileme: ışını gezdirmek temas noktasını ${u0} → ${s.bileU} taşıdı, keskinlik ${c0} → ${s.cilt}.`)
  await bas('komut:usta'); await asamaBekle(5)
}
await istasyonda(2.35, -1.7)

await olc('5 Kuşanma'); await goruntu('5-kusanma')
{
  const once = Number(await veri('takilan'))
  await kilicDursun(); await kareBekle(4)
  // Tutup yerinde bırakmak parçayı takmaz.
  const parca = await hedefNokta()
  await nisanla('right', parca); await tetik('right', true); await kareBekle(3); await tetik('right', false); await kareBekle(6)
  assert.equal(Number(await veri('takilan')), once, 'yerinde bırakılan parça oturdu')
  assert((await sahne()).mesaj.includes('yaklaşmadı'), 'yaklaşmadı mesajı yok')
  // Tut, kılıçtaki yerine götür, bırak. İşaret taşıma sırasında yeri gösterir.
  await nisanla('right', parca); await tetik('right', true)
  await bekle(async () => { const p = await hedefNokta(); return Math.hypot(p[0] - parca[0], p[1] - parca[1], p[2] - parca[2]) > .1 }, 'işaret yere geçsin')
  const yer = await hedefNokta(), r5 = await rig(), fark = yerel(r5, yer).map((v, i) => v - yerel(r5, parca)[i])
  await sayfa.evaluate(fark => { const k = window.__xr.el.right; k.ray.p = k.ray.p.map((v, i) => v + fark[i]) }, fark); await kareBekle(3)
  await tetik('right', false)
  await bekle(async () => Number(await veri('takilan')) > once, 'götürülen parça otursun')
  assert((await sahne()).mesaj.includes('oturdu')); await sayfa.evaluate(fark => { const k = window.__xr.el.right; k.ray.p = k.ray.p.map((v, i) => v - fark[i]) }, fark)
  // Panel düğmesi yedek olarak kalır.
  const iki = Number(await veri('takilan'))
  await bas('komut:tak'); await bekle(async () => Number(await veri('takilan')) > iki, 'panelden parça takılsın')
  console.log('kuşanma: tut-götür-bırak oturttu, yerinde bırakmak oturtmadı, panel yedeği çalıştı.')
  await bas('komut:usta'); await asamaBekle(6)
}
await istasyonda(.42, 1)

await olc('6 İnceleme'); await goruntu('6-inceleme')
{
  const y0 = (await sahne()).y
  await sayfa.evaluate(() => { window.__xr.kaynaklar[0].gamepad.axes[2] = 1 }); await kareBekle(6)
  await sayfa.evaluate(() => { window.__xr.kaynaklar[0].gamepad.axes[2] = 0 })
  await bekle(async () => (await sahne()).y !== y0, 'sağ çubuk çevirsin')
  await bas('not:3'); assert((await veri('xr-bilgi')).startsWith('Balçak|Kaynak: '), 'parça notu açılmadı'); await goruntu('6-not')
  await bas('not:kapat'); assert((await veri('xr-bilgi')).startsWith('Atölye notu|'), 'not kapanmadı')
  console.log('inceleme: sağ çubuk çevirir, parça notu panelde açılıp kapanır.')
  await bas('komut:devam'); await asamaBekle(7)
}
await istasyonda(12, 1.15)

await olc('7 Test'); await goruntu('7-rulo')
{
  // Kılıç sağ elde: grip gezince kılıç da gelir.
  const k0 = (await sahne()).kilic
  await sayfa.evaluate(() => { const k = window.__xr.el.right; k.grip.p = [.3, 1.2, -.4]; k.grip.y = [0, 0, -1] }); await bekle(async () => { const a = await sahne(); return Math.hypot(a.kilic[0] - k0[0], a.kilic[1] - k0[1]) > .05 }, 'kılıç eli izlesin')
  const s = await sahne(), [r] = [await rig()]
  assert(Math.hypot(s.kilic[0] - (r[0] + .3), s.kilic[1] - (r[1] + 1.2), s.kilic[2] - (r[2] - .4 - .11)) < .04, `kılıç el dışında ${s.kilic} ${r}`)
  await goruntu('7-kilic-elde')
  // Savurma: namlu noktası rulo önünden soldan sağa geçer.
  const savur = (bas, adim, kare) => sayfa.evaluate(async ({ bas, adim, kare }) => {
    const k = window.__xr.el.right; k.grip.p = bas; const b0 = window.__xr.kareler
    while (window.__xr.kareler < b0 + 4) await new Promise(r => setTimeout(r, 5))
    for (let i = 0; i < kare; i++) { const b = window.__xr.kareler; k.grip.p = k.grip.p.map((v, j) => v + adim[j]); while (window.__xr.kareler <= b) await new Promise(r => setTimeout(r, 5)) }
    const b = window.__xr.kareler; while (window.__xr.kareler < b + 4) await new Promise(r => setTimeout(r, 5))
  }, { bas, adim, kare })
  const tOnce = await titresim()
  await savur([-.6, 1.1, -.4], [.32, 0, 0], 4)
  await bekle(async () => Number(await veri('ayrilan')) > 0 || (await veri('hasar')).split(',')[0] > 0, 'savurma ruloya işlesin', 30000)
  assert((await titresim()) > tOnce, 'savurma titreşimi yok')
  console.log('test: kılıç eli izler; savurma ruloyu kesti:', await veri('hasar'), (await sahne()).mesaj)
  await goruntu('7-rulo-kesim')

  await bas('hedef:1'); await istasyonda(14, .95); assert.equal((await sahne()).hedef, 1)
  const h1 = (await veri('hasar')).split(',')[1]
  await savur([0, 1.75, -.35], [0, -.28, 0], 4)
  await bekle(async () => (await veri('hasar')).split(',')[1] !== h1, 'yukarıdan inen savurma kütüğe işlesin', 30000)
  console.log('test: kütüğe yukarıdan savurma işledi:', await veri('hasar'))
  await sayfa.evaluate(() => { window.__xr.el.right.grip.p = [.3, 1.2, -.4] })

  // Sol elin ışınıyla hedef seçimi.
  await nisanla('left', [16.15, 1.3, -.1]); await tetik('left', true); await tetik('left', false)
  await bekle(async () => (await sahne()).hedef === 2, 'ışınla hedef'); await istasyonda(16.15, 1)
  // Kılıç eli panele basamaz (iki kumanda varken).
  const h2 = (await sahne()).hedef
  await nisanla('right', (await dugme('hedef:0')).p); await tetik('right', true); await tetik('right', false); await kareBekle(3)
  assert.equal((await sahne()).hedef, h2, 'kılıç eli paneli tetikledi')
  // Yedek düğme.
  await bas('komut:kes')
  await bekle(async () => (await veri('hasar')).split(',')[2] > 0, 'Kes düğmesi kumaşa işlesin', 60000)
  await goruntu('7-kumas')
  await bas('komut:hedefleri-yenile'); await bekle(async () => (await veri('ayrilan')) === '0', 'hedefler yenilensin')
  console.log('test: ışınla hedef, kılıç eli paneli tetiklemez, Kes düğmesi kumaşa işler, hedefler yenilenir.')
}

// --- Her aşama ustayla bitirilebilir, baştan başlanabilir ---
await bas('komut:bastan'); await asamaBekle(0); await istasyonda(2.8, -1.75); assert(await dugme('komut:al'))
for (let n = 0; n < 7; n++) { await bas('komut:usta'); await asamaBekle(n + 1); await bekle(async () => !(await dugme('komut:usta')).pasif, 'usta bitsin'); await kareBekle(4) }
await bas('komut:usta'); await bekle(async () => Number(await veri('ayrilan')) > 0, 'usta ruloyu kessin')
console.log('usta: 8 aşama panelden tamamlandı, son kesim ruloyu ayırdı.')

// --- Sayfa gizlense de VR kare döngüsü durmaz ---
{
  await sayfa.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  const a = await sahne(); await kareBekle(8); await bas('komut:hedefleri-yenile'); await bekle(async () => (await veri('ayrilan')) === '0', 'gizliyken de işlesin')
  await sayfa.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  assert(a)
  console.log('gizli sayfa: VR döngüsü sürdü.')
}

// --- Meta düğmesiyle kapanış: sayfa eski hâline döner ---
const dogrula = async ne => {
  await bekle(async () => await veri('xr') === null, 'çıkış')
  await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne').dataset.vurusX, null, { timeout: SURE })
  const c = await sayfa.evaluate(() => { const k = document.querySelector('.kilic-sahne canvas'); return { w: k.width, css: k.clientWidth } })
  // Yazılımsal çizimde masaüstü uyarlamalı kalitesi piksel oranını düşürebilir: 0 → .8, 1 → .85, 2 → .65.
  const oran = [.8, .85, .65][Number(await veri('kalite'))]
  assert.equal(c.css, onceki.css); assert(Math.abs(c.w - c.css * oran) < 2, `${ne}: tampon ${c.w}, beklenen ${c.css * oran}`)
  await vrDugme.waitFor({ timeout: SURE }); assert(await vrDugme.isEnabled(), `${ne}: VR'da aç etkin değil`)
}
await sayfa.evaluate(() => window.__xr.oturum.end())
await dogrula('Meta çıkışı')
await sayfa.waitForTimeout(800)
await goruntu_masaustu('kapanis-masaustu')
// Oyun ekranda sürer: baştan başlanıp kamera başlangıç izdüşümüne döner.
await sayfa.getByRole('button', { name: 'Baştan başla' }).click()
await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne').dataset.asama === '0', null, { timeout: SURE })
{
  // Kamera sönümlü izler; yazılımsal çizimde yerine oturması uzun sürer.
  await bekle(async () => Math.abs(Number(await veri('hedef-x')) - onceki.x) < 2 && Math.abs(Number(await veri('hedef-olcek')) - onceki.o) < 2, `izdüşüm ${onceki.x},${onceki.o} → ${await veri('hedef-x')},${await veri('hedef-olcek')}`, 120000)
  await sayfa.getByRole('button', { name: /^Külçeyi al/ }).click()
  await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne').dataset.asama === '1', null, { timeout: SURE })
  await sayfa.getByRole('button', { name: 'Baştan başla' }).click()
  await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne').dataset.asama === '0', null, { timeout: SURE })
  console.log('Meta çıkışı: tampon, izdüşüm ve masaüstü oyun geri döndü.')
}

// --- Başı odada kaymış ve dönmüş kullanıcı, panelden çıkış ---
await sayfa.evaluate(() => { window.__xr.bas = { p: [.5, 1.05, -.3], yaw: 1 }; window.__xr.el.left.ray.p = [.1, .9, -.3] })
await gir()
{
  await istasyonda(2.8, -1.75)
  const r = await rig(); assert(Math.abs(r[1] - .4) < .01, `oturan kullanıcı göz hizasına kalkmadı: ${r[1]}`)
  await bas('cik')
  await dogrula('panelden çıkış')
  console.log("VR'dan çık: panelden kapandı; oturan ve dönmüş kullanıcı istasyona doğru yerleşti.")
}

// --- Rota değişince oturum kapanır, kaynaklar temizlenir ---
await sayfa.evaluate(() => { window.__xr.bas = { p: [0, 1.6, 0], yaw: 0 } })
await gir()
{
  const onceSon = await sayfa.evaluate(() => window.__xr.sonlandi)
  await sayfa.evaluate(() => document.querySelector('.kilic-baslik a').click())
  await sayfa.waitForFunction(() => !document.querySelector('.kilic-sahne canvas'), null, { timeout: 30000 })
  assert.equal(await sayfa.evaluate(() => window.__xr.sonlandi), onceSon + 1, 'rota değişince oturum kapanmadı')
  await sayfa.waitForTimeout(500)
  console.log('rota değişimi: oturum kapandı, tuval kaldırıldı.')
}

assert.deepEqual(hatalar, [])
console.table(olcum)
console.log('Kılıç VR oturum akışı başarılı (sahte WebXR; cihaz denemesi değildir). Konsol temiz.')
await tarayici.close()

async function goruntu_masaustu(ad) { await sayfa.evaluate(() => document.querySelector('.kilic-sahne').scrollIntoView()); await alan.screenshot({ path: `test-sonuclari/kilic-xr-${ad}.png` }) }
