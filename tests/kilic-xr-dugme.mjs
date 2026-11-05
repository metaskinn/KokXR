// Kılıç atölyesinin `VR'da aç` düğmesi: sahte navigator.xr ile destek ve reddedilme akışı.
// Çalıştırma: npm run build && npm run preview -- --port 4177 --strictPort, sonra TEST_URL=http://127.0.0.1:4177 node tests/kilic-xr-dugme.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (kosul, mesaj) => { if (!kosul) throw new Error(mesaj) }
const RET_METNI = 'VR oturumu başlatılamadı. Atölyeyi ekranda kullanmaya devam edebilirsin.'
const SURE = 180000

async function ac(xrTaklidi) {
  const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 900 } })
  const hatalar = []
  sayfa.on('pageerror', e => hatalar.push(String(e)))
  sayfa.on('console', m => { if (m.type() === 'error') hatalar.push(m.text()) })
  await sayfa.addInitScript(xrTaklidi)
  await sayfa.goto(`${url}/atolye/kilic`)
  await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne')?.dataset.asama === '0', null, { timeout: SURE })
  await sayfa.locator('.kilic-yukleme').waitFor({ state: 'detached', timeout: SURE })
  return { sayfa, hatalar, vr: sayfa.getByRole('button', { name: "VR'da aç" }) }
}
// Ekrandaki oyun hâlâ oynanıyor: külçe alınır, aşama ilerler, kalan kare hatası olmaz.
async function oyunSuruyor(sayfa) {
  await sayfa.getByRole('button', { name: /^Külçeyi al/ }).click()
  await sayfa.waitForFunction(() => document.querySelector('.kilic-sahne')?.dataset.asama === '1', null, { timeout: SURE })
}

// --- navigator.xr yok ---
{
  const { sayfa, hatalar, vr } = await ac(() => { Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true }) })
  sart(!(await vr.count()), "xr yokken VR'da aç görünüyor")
  await oyunSuruyor(sayfa)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('xr_yok: düğme yok, ekrandaki oyun sürüyor, konsol temiz.')
}

// --- Tarayıcı immersive-vr desteklemiyor ---
{
  const { sayfa, hatalar, vr } = await ac(() => {
    window.__xrSoruldu = []
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async k => { window.__xrSoruldu.push(k); return false }, requestSession: async () => { throw new Error('çağrılmamalıydı') } }, configurable: true })
  })
  sart((await sayfa.evaluate(() => window.__xrSoruldu)).includes('immersive-vr'), 'isSessionSupported sorulmadı')
  sart(!(await vr.count()), "destek yokken VR'da aç görünüyor")
  await oyunSuruyor(sayfa)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('destek_yok: düğme yok, ekrandaki oyun sürüyor, konsol temiz.')
}

// --- isSessionSupported reddediyor (ör. izin politikası) ---
{
  const { sayfa, hatalar, vr } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: () => Promise.reject(new DOMException('yasak', 'SecurityError')) }, configurable: true })
  })
  sart(!(await vr.count()), "denetim reddedilince VR'da aç görünüyor")
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('denetim_reddi: düğme yok, konsol temiz.')
}

// --- Destek var, oturum isteği reddediliyor ---
{
  const { sayfa, hatalar, vr } = await ac(() => {
    window.__xrIstek = []
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => true,
        requestSession: (kip, secenek) => { window.__xrIstek.push({ kip, secenek, jest: navigator.userActivation.isActive }); return Promise.reject(new DOMException('İzin verilmedi', 'NotAllowedError')) },
      },
      configurable: true,
    })
  })
  await vr.waitFor({ timeout: SURE })
  sart(await vr.isEnabled(), "VR'da aç etkin değil")
  await vr.click()
  const mesaj = sayfa.locator('.kilic-xr-hata')
  await mesaj.waitFor({ state: 'visible', timeout: SURE })
  sart((await mesaj.textContent()).trim() === RET_METNI, 'hata metni farklı')
  sart((await mesaj.getAttribute('role')) === 'alert', 'hata mesajı duyurulmuyor')
  const istek = await sayfa.evaluate(() => window.__xrIstek)
  sart(istek.length === 1, `requestSession ${istek.length} kez çağrıldı`)
  sart(istek[0].kip === 'immersive-vr', `yanlış kip: ${istek[0].kip}`)
  sart(istek[0].secenek.optionalFeatures.includes('local-floor'), 'local-floor istenmedi')
  sart(istek[0].jest, 'requestSession kullanıcı jesti dışında çağrıldı')
  sart(await vr.isEnabled(), "ret sonrası VR'da aç etkin değil")
  sart(await sayfa.locator('.kilic-sahne').getAttribute('data-xr') === null, 'ret sonrası sahne VR kipinde kaldı')
  await oyunSuruyor(sayfa)
  // Yeniden denenebilir; yeni deneme eski mesajı kaldırır.
  await vr.click()
  await sayfa.waitForFunction(() => window.__xrIstek.length === 2)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('reddedildi: Türkçe mesaj görünür, jest korunur, local-floor istenir, oyun sürer, yeniden denenir, konsol temiz.')
}

await tarayici.close()
