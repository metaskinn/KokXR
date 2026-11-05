// VR maket birleştirmenin saf hesapları. Çalıştırma: node tests/maket-birlestir-mantik.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EL_KAZANCI, ISIN_MENZIL, OTURMA_ESIGI, birakmaSonucu, birlesimMetni, katmanSec, rafDizilimi, tasinanYer } from '../src/components/maket/maketBirlestirMantik.ts'

// Modül three'siz kalır
assert(!/from 'three'/.test(readFileSync(new URL('../src/components/maket/maketBirlestirMantik.ts', import.meta.url), 'utf8')))

// Sıra: yakında değilse sıra sorulmaz; sıradaki oturur, üstteki reddedilir, sınır dahil değil
assert.equal(birakmaSonucu(0, 0, 0), 'oturdu')
assert.equal(birakmaSonucu(0, 0, OTURMA_ESIGI - 0.01), 'oturdu')
assert.equal(birakmaSonucu(0, 0, OTURMA_ESIGI), 'uzak')
assert.equal(birakmaSonucu(2, 0, 1), 'sira')
assert.equal(birakmaSonucu(1, 0, 1), 'sira')
assert.equal(birakmaSonucu(1, 1, 1), 'oturdu')
assert.equal(birakmaSonucu(2, 1, 1), 'sira')
assert.equal(birakmaSonucu(2, 1, 50), 'uzak')

// Raf: sağda, örtüşmeyen raflar, üst katman altta; kutunun ortası rafın ortasına gelir
const kutular = [
  { min: [-35, 13, -28], max: [35, 17, 28] },
  { min: [-30, 15, -24], max: [30, 19, 24] },
  { min: [-30, 18, -24], max: [30, 27, 24] },
]
const raf = rafDizilimi(kutular)
assert.equal(raf.length, 3)
const taban = (i) => kutular[i].min[1] + raf[i][1], tavan = (i) => kutular[i].max[1] + raf[i][1]
assert(taban(2) < taban(1) && taban(1) < taban(0), 'üst katman alt rafta değil')
assert(tavan(2) < taban(1) && tavan(1) < taban(0), 'raflar örtüşüyor')
// Rig başlangıç açısı π: kullanıcının sağı -x. Maket gövdesinin (yarı genişlik ~35) dışında ve eşikten çok uzakta.
for (let i = 0; i < 3; i++) {
  assert(raf[i][0] + kutular[i].max[0] < -35 + 25, 'raf gövdeye giriyor')
  assert(Math.hypot(...raf[i]) > OTURMA_ESIGI * 3, 'raf hedefe çok yakın')
}
// Eşik elle erişilebilir: rafa en uzak katman için gereken el yolu kol boyunu aşmasın.
assert(Math.max(...raf.map((r) => Math.hypot(...r))) / EL_KAZANCI < 70, 'el yolu uzun')

// Seçim: nişan değmeden önce gelir, en ortadan geçen kazanır
const a = (id, merkez, yaricap = 30) => ({ id, merkez, yaricap })
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], []), null)
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], [a(0, [0, 5, -100]), a(1, [0, 25, -100])]), 0)
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 20]), a(1, [0, 10, -100])]), 1, 'değilen nişanı ezdi')
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 20])]), 0, 'yalnız değen seçilmedi')
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], [a(0, [100, 0, -100])]), null, 'ışın dışı seçildi')
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 100])]), null, 'arkadaki seçildi')
assert.equal(katmanSec([0, 0, 0], [0, 0, -1], [a(0, [0, 0, -ISIN_MENZIL - 1])]), null, 'menzil dışı seçildi')

// Taşıma: kazançlı, el kıpırdamazsa kıpırdamaz
assert.deepEqual(tasinanYer([1, 2, 3], [5, 5, 5], [5, 5, 5]), [1, 2, 3])
assert.deepEqual(tasinanYer([1, 2, 3], [0, 0, 0], [10, -5, 1]), [1 + 10 * EL_KAZANCI, 2 - 5 * EL_KAZANCI, 3 + EL_KAZANCI])
assert.deepEqual(tasinanYer([0, 0, 0], [0, 0, 0], [1, 1, 1], 1), [1, 1, 1])

// Metin: sıra iddiası maketle sınırlı, tarih yok
const adlar = ['Çatı', 'Kasnaklar', 'Kubbeler']
let m = birlesimMetni(0, adlar)
assert.match(m.ust, /0\/3 katman yerinde/)
assert.match(m.mesaj, /Kavrama/)
assert.match(m.not, /maketin üst üste oturma sırasıdır/)
assert.match(m.not, /inşa sırası değildir/)
assert.equal(birlesimMetni(0, adlar, { sonuc: 'sira', id: 2 }).mesaj, 'Önce Çatı oturmalı. Sıra alttan üste gider.')
assert.equal(birlesimMetni(1, adlar, { sonuc: 'sira', id: 2 }).mesaj, 'Önce Kasnaklar oturmalı. Sıra alttan üste gider.')
assert.equal(birlesimMetni(1, adlar, { sonuc: 'oturdu', id: 0 }).mesaj, 'Çatı yerine oturdu.')
assert.match(birlesimMetni(0, adlar, { sonuc: 'uzak', id: 0 }).mesaj, /yaklaşmadı/)
m = birlesimMetni(3, adlar, { sonuc: 'oturdu', id: 2 })
assert.match(m.ust, /^Tamamlandı: 3\/3/)
assert.match(m.mesaj, /birleşti/)
for (const metin of [birlesimMetni(0, adlar), birlesimMetni(0, adlar, { sonuc: 'sira', id: 1 }), m]) {
  assert(!/\b1[0-9]{3}\b|yüzyıl|padişah|sultan|yapıldı|inşa edildi/i.test(metin.ust + metin.mesaj + metin.not), 'tarihsel iddia')
}

console.log('Maket birleştirme: sıra, raf, seçim, taşıma ve metin başarılı.')
