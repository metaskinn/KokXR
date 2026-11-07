// Ulu Camii maketinin `VR'da aç` düğmesi: sahte navigator.xr ile destek ve reddedilme akışı.
// Çalıştırma: npm run build && npm run preview -- --port 4173, sonra node tests/maket-xr-dugme.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:4173'
const tarayici = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const sart = (kosul, mesaj) => { if (!kosul) throw new Error(mesaj) }
const RET_METNI = "VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin."
// Yazılımsal çizimde sahne kurulumu ana iş parçacığını uzun süre tutar; yüklü makinede 30 sn yetmez.
const SURE = 180000

async function ac(xrTaklidi, arguman, hemenAc = false) {
  const sayfa = await tarayici.newPage({ viewport: { width: 1000, height: 700 } })
  const hatalar = []
  sayfa.on('pageerror', (e) => hatalar.push(String(e)))
  sayfa.on('console', (m) => { if (m.type() === 'error' && !m.location().url.includes('360tr')) hatalar.push(m.text()) })
  await sayfa.addInitScript(xrTaklidi, arguman)
  await sayfa.goto(`${url}/${hemenAc ? 'vr' : 'eser'}/ulu-camii`)
  if (!hemenAc) await sayfa.getByRole('button', { name: /maketini eline al/ }).click({ timeout: SURE })
  await sayfa.locator('.maket-alan canvas').waitFor({ timeout: SURE })
  await sayfa.locator('.maket-kutu').scrollIntoViewIfNeeded()
  const iceriGir = sayfa.getByRole('button', { name: 'İçeri gir' })
  await sayfa.waitForFunction(() => [...document.querySelectorAll('.maket-kontrol button')].some((d) => d.textContent === 'İçeri gir' && !d.disabled), null, { timeout: SURE })
  return { sayfa, hatalar, iceriGir, vrDugme: sayfa.getByRole('button', { name: "VR'da aç" }) }
}

/** Sahnenin hâlâ çizdiğini gösterir: içeri girilir, kare sayacı ilerler. */
async function iceriCalisiyor(sayfa, iceriGir) {
  await iceriGir.click()
  await sayfa.getByRole('button', { name: /Dışarı çık/ }).waitFor({ timeout: SURE })
  const alan = sayfa.locator('.maket-alan')
  await sayfa.waitForFunction(() => Number(document.querySelector('.maket-alan')?.dataset.kare) > 0, null, { timeout: SURE })
  const once = Number(await alan.getAttribute('data-kare'))
  await sayfa.waitForFunction((n) => Number(document.querySelector('.maket-alan')?.dataset.kare) > n, once, { timeout: SURE })
}

// --- navigator.xr yok ---
{
  const { sayfa, hatalar, iceriGir, vrDugme } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  })
  sart(!(await vrDugme.count()), "xr yokken VR'da aç görünüyor")
  await iceriCalisiyor(sayfa, iceriGir)
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('xr_yok: düğme yok, içeri girildi, sahne çiziyor.')
}

// --- Tarayıcı immersive-vr desteklemiyor ---
{
  const { sayfa, hatalar, vrDugme } = await ac(() => {
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
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('destek_yok: düğme yok.')
}

// --- Destek var, oturum isteği reddediliyor ---
{
  const { sayfa, hatalar, iceriGir, vrDugme } = await ac(() => {
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
  const mesaj = sayfa.locator('.maket-durum', { hasText: RET_METNI })
  await mesaj.waitFor({ state: 'visible', timeout: SURE })
  sart(await mesaj.getAttribute('aria-live'), 'hata mesajı aria-live değil')
  sart((await mesaj.textContent()).trim() === RET_METNI, 'hata metni birebir değil')

  const istek = await sayfa.evaluate(() => window.__xrIstek)
  sart(istek.length === 1, `requestSession ${istek.length} kez çağrıldı`)
  sart(istek[0].kip === 'immersive-vr', `yanlış kip: ${istek[0].kip}`)
  sart(istek[0].jest, 'requestSession kullanıcı jesti dışında çağrıldı')

  // Mesaj sahneyi sürüklemeyi engellememeli.
  const ortadaki = await sayfa.evaluate(() => {
    const k = document.querySelector('.maket-alan').getBoundingClientRect()
    return document.elementFromPoint(k.x + k.width / 2, k.y + k.height / 2)?.closest('.maket-durum') !== null
  })
  sart(!ortadaki, 'hata mesajı sahnenin üstünü kapatıyor')

  sart(await iceriGir.isEnabled(), 'ret sonrası İçeri gir etkin değil')
  sart(await vrDugme.isEnabled(), "ret sonrası VR'da aç etkin değil")
  await iceriCalisiyor(sayfa, iceriGir)
  sart(!(await sayfa.locator('.maket-durum', { hasText: RET_METNI }).count()), 'hata mesajı içeri girince kalkmadı')
  sart(!hatalar.length, `konsol hatası: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('reddedildi: Türkçe mesaj görünür, jest korunur, içeri girilir, konsol temiz.')
}

// Doğrudan /vr rotasında sahne düğmeye basmadan hazırlanır ve içeri girilebilir.
{
  const { sayfa, hatalar, iceriGir } = await ac(() => {
    Object.defineProperty(navigator, 'xr', { value: undefined, configurable: true })
  }, undefined, true)
  await iceriCalisiyor(sayfa, iceriGir)
  sart(!hatalar.length, `doğrudan VR rotasında hata: ${hatalar.join(' | ')}`)
  await sayfa.close()
  console.log('/vr/ulu-camii: sahne kendiliğinden açılır, iç mekân çizimi sürer.')
}

await tarayici.close()
