// Ulu Camii iç mekânı: minber, kürsü ve mahfile gerçek çarpışma verisiyle yürüyerek çıkılabilir, kenardan düşülmez.
// Çalıştırma: geliştirme sunucusu açıkken TEST_URL=http://127.0.0.1:5173 node tests/maket-tirmanma.mjs
import { chromium } from 'playwright'

const url = process.env.TEST_URL ?? 'http://127.0.0.1:5173'
const tarayici = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] })
const sayfa = await tarayici.newPage()
await sayfa.goto(url)
const sonuc = await sayfa.evaluate(async () => {
  const { icYurumeAlani, icDuraklar } = await import('/src/components/maket/ulucamiIc.ts')
  const { zeminAdimi, durakZemini, OYUNCU_YARICAP: R } = await import('/src/components/maket/yurumeCarpisma.ts')
  const { MAHFIL, KURSU } = await import('/src/components/maket/ulucamiDetay.ts')
  const y = icYurumeAlani()
  /** Noktadan noktaya 3 cm adımlarla yürür; takıldığı yeri ve yüksekliği döner. */
  const yuru = (bas, yol) => {
    let [x, z, h] = bas
    for (const [hx, hz] of yol) {
      const n = Math.ceil(Math.hypot(hx - x, hz - z) / 0.03)
      const dx = (hx - x) / n, dz = (hz - z) / n
      for (let i = 0; i < n; i++) {
        const yeni = zeminAdimi(y, x + dx, z + dz, R, h)
        if (yeni === null) return { x, z, h, takildi: true }
        x += dx; z += dz; h = yeni
      }
    }
    return { x, z, h, takildi: false }
  }
  const MX = -7, Z0 = 25.5 - 1.05 - 7.2, zem = (id) => durakZemini(y, icDuraklar.find((d) => d.id === id).konum)
  return {
    minber: yuru([MX - 3, Z0 - 0.75, 0], [[MX, Z0 - 0.75], [MX, Z0 + 5.5]]),
    minberIn: yuru([MX, Z0 + 5.5, 4.7], [[MX, Z0 - 0.75], [MX - 3, Z0 - 0.75]]),
    minberYan: yuru([MX, Z0 + 3, 2.15], [[MX - 3, Z0 + 3]]),
    minberDis: yuru([MX + 2, Z0 + 3, 0], [[MX, Z0 + 3]]),
    kursu: yuru([KURSU.x - 0.1, KURSU.z - KURSU.r - 2.2, 0], [[KURSU.x - 0.1, KURSU.z]]),
    kursuDis: yuru([KURSU.x - 2, KURSU.z, 0], [[KURSU.x, KURSU.z]]),
    mahfil: yuru([MAHFIL.x + 2.65, MAHFIL.z - 6.95, 0], [[MAHFIL.x + 2.65, MAHFIL.z - 2], [MAHFIL.x, MAHFIL.z]]),
    mahfilKenar: yuru([MAHFIL.x, MAHFIL.z, 3.8], [[MAHFIL.x, MAHFIL.z + 5]]),
    mahfilAlt: yuru([MAHFIL.x, MAHFIL.z - 4, 0], [[MAHFIL.x, MAHFIL.z + 4]]),
    duraklar: { minber: zem('minber-ust'), kursu: zem('kursu-ust'), mahfil: zem('mahfil-ust'), giris: zem('giris'), sadirvan: zem('sadirvan') },
  }
})
const sart = (k, m) => { if (!k) throw new Error(m + ' ' + JSON.stringify(sonuc)) }
sart(!sonuc.minber.takildi && sonuc.minber.h > 4, 'minbere çıkılamadı')
sart(!sonuc.minberIn.takildi && sonuc.minberIn.h === 0, 'minberden inilemedi')
sart(sonuc.minberYan.takildi && sonuc.minberYan.h > 1.5, 'minber yanından düşüldü')
sart(sonuc.minberDis.takildi && sonuc.minberDis.h === 0, 'minber yanından girildi')
sart(!sonuc.kursu.takildi && sonuc.kursu.h > 2, 'kürsüye çıkılamadı')
sart(sonuc.kursuDis.takildi && sonuc.kursuDis.h === 0, 'kürsü gövdesinden geçildi')
sart(!sonuc.mahfil.takildi && sonuc.mahfil.h > 3.5, 'mahfile çıkılamadı')
sart(sonuc.mahfilKenar.takildi && sonuc.mahfilKenar.h > 3.5, 'mahfilden düşüldü')
sart(!sonuc.mahfilAlt.takildi && sonuc.mahfilAlt.h === 0, 'mahfilin altından geçilemedi')
sart(sonuc.duraklar.minber > 3 && sonuc.duraklar.kursu > 2 && sonuc.duraklar.mahfil > 3.5 && sonuc.duraklar.giris === 0 && sonuc.duraklar.sadirvan === 0, 'durak zeminleri yanlış')
console.log('Tırmanma: minber, kürsü ve mahfile çıkış, iniş, kenardan düşmeme, duraklar geçti.')
await tarayici.close()
