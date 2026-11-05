// Vazo atölyesinin `VR'da aç` düğmesi: sahte navigator.xr ile destek ve reddedilme akışı.
// Çalıştırma: npm run build && npm run preview -- --port 4178 --strictPort, sonra TEST_URL=http://127.0.0.1:4178 node tests/vazo-xr-dugme.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (kosul, mesaj) => { if (!kosul) throw new Error(mesaj) }
// Yazılımsal çizimde yüklü makinede ana iş parçacığı uzun süre meşgul kalır; 30 sn yetmez.
const SURE = 180000
const RET_METNI = 'VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Atölyeyi bu ekranda kullanmaya devam edebilirsin.'

async function ac(xrTaklidi) {
  const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 900 } })
  sayfa.setDefaultTimeout(SURE)
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()) })
  await sayfa.addInitScript(xrTaklidi)
  await sayfa.goto(`${url}/atolye/vazo`)
  const baslat = sayfa.getByRole('button', { name: 'Vazoyu parçala ve onar' })
  await sayfa.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Vazoyu parçala ve onar')?.disabled, null, { timeout: SURE })
  return { sayfa, hatalar, baslat, vrDugme: sayfa.getByRole('button', { name: "VR'da aç" }) }
}
/** Ekrandaki atölye sürüyor: onarım başlar, tutamaçlar görünür, tuval hâlâ yerinde. */
async function atolyeCalisiyor(sayfa, baslat) {
  await baslat.click()
  await sayfa.waitForFunction(() => [...document.querySelectorAll('.vazo-tutamac')].filter((e) => !e.hidden).length === 6, null, { timeout: SURE })
  sart(await sayfa.locator('.vazo-sahne canvas').count() === 1, 'tuval yok')
}

{
  const { sayfa, hatalar, baslat, vrDugme } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  })
  sart(!(await vrDugme.count()), "xr yokken VR'da aç görünüyor")
  await atolyeCalisiyor(sayfa, baslat)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('xr_yok: düğme yok, atölye çalışıyor, konsol temiz.')
}

{
  const { sayfa, hatalar, baslat, vrDugme } = await ac(() => {
    window.__xrSoruldu = 0
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => { window.__xrSoruldu++; return false },
        requestSession: async () => { throw new Error('çağrılmamalıydı') },
      },
      configurable: true,
    })
  })
  sart(await sayfa.evaluate(() => window.__xrSoruldu > 0), 'isSessionSupported sorulmadı')
  sart(!(await vrDugme.count()), "destek yokken VR'da aç görünüyor")
  await atolyeCalisiyor(sayfa, baslat)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('destek_yok: düğme yok, atölye çalışıyor, konsol temiz.')
}

{
  const { sayfa, hatalar, baslat, vrDugme } = await ac(() => {
    window.__xrIstek = []
    Object.defineProperty(navigator, 'xr', {
      value: {
        isSessionSupported: async () => true,
        requestSession: (kip) => {
          window.__xrIstek.push({ kip, jest: navigator.userActivation.isActive })
          return Promise.reject(new DOMException('İzin verilmedi', 'NotAllowedError'))
        },
      },
      configurable: true,
    })
  })
  await vrDugme.waitFor({ timeout: SURE })
  sart(await vrDugme.isEnabled(), "VR'da aç etkin değil")
  await vrDugme.click()
  const mesaj = sayfa.getByRole('alert')
  await mesaj.waitFor({ state: 'visible', timeout: SURE })
  sart((await mesaj.textContent()).trim() === RET_METNI, `hata metni birebir değil: ${await mesaj.textContent()}`)
  const istek = await sayfa.evaluate(() => window.__xrIstek)
  sart(istek.length === 1, `requestSession ${istek.length} kez çağrıldı`)
  sart(istek[0].kip === 'immersive-vr', `yanlış kip: ${istek[0].kip}`)
  sart(istek[0].jest, 'requestSession kullanıcı jesti dışında çağrıldı')
  sart(await vrDugme.isEnabled(), "ret sonrası VR'da aç etkin değil")
  await atolyeCalisiyor(sayfa, baslat)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('reddedildi: Türkçe mesaj görünür, jest korunur, atölye sürer, konsol temiz.')
}

await tarayici.close()
