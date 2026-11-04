// VR menüsü ve bilgi kartının saf metin hesapları. Çalıştırma: node tests/maket-xr-metin.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { menuOgeleri, satirKir, menuIsabet, TEMSILI_ETIKET, MENU_BASLIK_ORANI } from '../src/components/maket/xrMetin.ts'

assert.equal(TEMSILI_ETIKET, 'Temsilî maket · Gerçek bir 3B tarama değildir')
assert.equal(MENU_BASLIK_ORANI, 0.2)

// Menü öğeleri
const kimlik = (l) => l.map((o) => o.id)
const duraklar = Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, ad: `Durak ${i}` }))
let m = menuOgeleri({ iceride: false, parcali: false, duraklar })
assert.deepEqual(kimlik(m), ['iceri', 'parcala', 'cik'])
assert.deepEqual(m.map((o) => o.ad), ['İçeri gir', 'Parçala', "VR'dan çık"])
assert.equal(menuOgeleri({ iceride: false, parcali: true, duraklar })[1].ad, 'Birleştir')
m = menuOgeleri({ iceride: true, parcali: false, duraklar })
assert.equal(m.length, 10)
assert.deepEqual(m[0], { id: 'disari', ad: 'Dışarı çık' })
assert.deepEqual(m[1], { id: 'durak:d0', ad: 'Durak 0' })
assert.deepEqual(m[9], { id: 'cik', ad: "VR'dan çık" })

// Satır kırma: sözcük bölünmez, sığmayan sözcük sert bölünür, hiçbir harf kaybolmaz
const uzunluk = (s) => s.length
assert.deepEqual(satirKir('bir iki üç', uzunluk, 7), ['bir iki', 'üç'])
assert.deepEqual(satirKir('', uzunluk, 10), [])
assert.deepEqual(satirKir('  bir   iki  ', uzunluk, 40), ['bir iki'])
const dev = satirKir('ş'.repeat(100), uzunluk, 30)
assert.equal(dev.join(''), 'ş'.repeat(100))
assert(dev.every((s) => s.length <= 30))
assert.deepEqual(satirKir('ab ' + 'c'.repeat(12) + ' de', uzunluk, 5), ['ab', 'ccccc', 'ccccc', 'cc de'])
assert.deepEqual(satirKir('abc', uzunluk, 0), ['a', 'b', 'c']) // Genişlik yetmese de sonsuz döngü olmaz
assert.deepEqual(satirKir('İ̇ş', uzunluk, 1), ['İ̇', 'ş']) // Birleşen işaret harfinden ayrılmaz

// Tüm bilgi kartları sığar; 900 px genişlik, karakter başına 0,55 × 34 px
const eser = JSON.parse(readFileSync(new URL('../src/data/eserler/ulu-camii.json', import.meta.url), 'utf8'))
const olc = (s) => s.length * 0.55 * 34
let enCok = 0
assert(eser.maket.icBilgiler.length > 0)
for (const bilgi of eser.maket.icBilgiler) {
  const kaynak = eser.kaynaklar.find((k) => k.id === bilgi.kaynakId)
  assert(kaynak, `${bilgi.id}: kaynak yok`)
  const satir = `Kaynak: ${kaynak.metin}${kaynak.sayfa ? `, s. ${kaynak.sayfa}` : ''}`
  const metinSatirlari = satirKir(bilgi.metin, olc, 900)
  const kaynakSatirlari = satirKir(satir, olc, 900)
  assert.equal(metinSatirlari.join(' '), bilgi.metin, `${bilgi.id}: metin bozuldu`)
  assert.equal(kaynakSatirlari.join(' '), satir, `${bilgi.id}: kaynak bozuldu`)
  const toplam = metinSatirlari.length + kaynakSatirlari.length
  enCok = Math.max(enCok, toplam)
  assert(toplam <= 13, `${bilgi.id}: ${toplam} satır`)
}

// Panel isabeti: v = 1 üst kenar
assert.equal(menuIsabet(0.95, 3, 0.2), null)
assert.equal(menuIsabet(0.75, 3, 0.2), 0)
assert.equal(menuIsabet(0.05, 3, 0.2), 2)
assert.equal(menuIsabet(0, 3, 0.2), 2)
assert.equal(menuIsabet(0.5, 0, 0.2), null)
assert.equal(menuIsabet(1.2, 3, 0.2), null)
assert.equal(menuIsabet(-0.1, 3, 0.2), null)
for (let i = 0; i < 10; i++) assert.equal(menuIsabet(0.8 - (i + 0.5) * 0.08, 10, 0.2), i)

console.log(`VR metin: menü öğeleri, satır kırma, isabet ve ${eser.maket.icBilgiler.length} kartın sığması başarılı (en uzun ${enCok} satır).`)
