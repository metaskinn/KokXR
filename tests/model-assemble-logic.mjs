// VR maket birleştirmenin saf hesapları. Çalıştırma: node tests/maket-birlestir-mantik.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HAND_GAIN, RAY_RANGE, SEAT_THRESHOLD, releaseResult, assemblyText, selectLayer, shelfLayout, carriedPlace } from '../src/features/scale-models/modelAssembleLogic.ts'

// Modül three'siz kalır
assert(!/from 'three'/.test(readFileSync(new URL('../src/features/scale-models/modelAssembleLogic.ts', import.meta.url), 'utf8')))

// Sıra: yakında değilse sıra sorulmaz; sıradaki oturur, üstteki reddedilir, sınır dahil değil
assert.equal(releaseResult(0, 0, 0), 'seated')
assert.equal(releaseResult(0, 0, SEAT_THRESHOLD - 0.01), 'seated')
assert.equal(releaseResult(0, 0, SEAT_THRESHOLD), 'far')
assert.equal(releaseResult(2, 0, 1), 'row')
assert.equal(releaseResult(1, 0, 1), 'row')
assert.equal(releaseResult(1, 1, 1), 'seated')
assert.equal(releaseResult(2, 1, 1), 'row')
assert.equal(releaseResult(2, 1, 50), 'far')

// Raf: sağda, örtüşmeyen raflar, üst katman altta; kutunun ortası rafın ortasına gelir
const boxes = [
  { min: [-35, 13, -28], max: [35, 17, 28] },
  { min: [-30, 15, -24], max: [30, 19, 24] },
  { min: [-30, 18, -24], max: [30, 27, 24] },
]
const raf = shelfLayout(boxes)
assert.equal(raf.length, 3)
const base = (i) => boxes[i].min[1] + raf[i][1], ceiling = (i) => boxes[i].max[1] + raf[i][1]
assert(base(2) < base(1) && base(1) < base(0), 'üst katman alt rafta değil')
assert(ceiling(2) < base(1) && ceiling(1) < base(0), 'raflar örtüşüyor')
// Rig başlangıç açısı π: kullanıcının sağı -x. Maket gövdesinin (yarı genişlik ~35) dışında ve eşikten çok uzakta.
for (let i = 0; i < 3; i++) {
  assert(raf[i][0] + boxes[i].max[0] < -35 + 25, 'raf gövdeye giriyor')
  assert(Math.hypot(...raf[i]) > SEAT_THRESHOLD * 3, 'raf hedefe çok yakın')
}
// Eşik elle erişilebilir: rafa en uzak katman için gereken el yolu kol boyunu aşmasın.
assert(Math.max(...raf.map((r) => Math.hypot(...r))) / HAND_GAIN < 70, 'el yolu uzun')

// Seçim: nişan değmeden önce gelir, en ortadan geçen kazanır
const a = (id, center, radius = 30) => ({ id, center, radius })
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], []), null)
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 5, -100]), a(1, [0, 25, -100])]), 0)
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 20]), a(1, [0, 10, -100])]), 1, 'değilen nişanı ezdi')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 20])]), 0, 'yalnız değen seçilmedi')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [100, 0, -100])]), null, 'ışın dışı seçildi')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 100])]), null, 'arkadaki seçildi')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, -RAY_RANGE - 1])]), null, 'menzil dışı seçildi')

// Taşıma: kazançlı, el kıpırdamazsa kıpırdamaz
assert.deepEqual(carriedPlace([1, 2, 3], [5, 5, 5], [5, 5, 5]), [1, 2, 3])
assert.deepEqual(carriedPlace([1, 2, 3], [0, 0, 0], [10, -5, 1]), [1 + 10 * HAND_GAIN, 2 - 5 * HAND_GAIN, 3 + HAND_GAIN])
assert.deepEqual(carriedPlace([0, 0, 0], [0, 0, 0], [1, 1, 1], 1), [1, 1, 1])

// Metin: sıra iddiası maketle sınırlı, tarih yok
const names = ['Çatı', 'Kasnaklar', 'Kubbeler']
let m = assemblyText(0, names)
assert.match(m.top, /0\/3 katman yerinde/)
assert.match(m.message, /Kavrama/)
assert.match(m.not, /maketin üst üste oturma sırasıdır/)
assert.match(m.not, /inşa sırası değildir/)
assert.equal(assemblyText(0, names, { result: 'row', id: 2 }).message, 'Önce Çatı oturmalı. Sıra alttan üste gider.')
assert.equal(assemblyText(1, names, { result: 'row', id: 2 }).message, 'Önce Kasnaklar oturmalı. Sıra alttan üste gider.')
assert.equal(assemblyText(1, names, { result: 'seated', id: 0 }).message, 'Çatı yerine oturdu.')
assert.match(assemblyText(0, names, { result: 'far', id: 0 }).message, /yaklaşmadı/)
m = assemblyText(3, names, { result: 'seated', id: 2 })
assert.match(m.top, /^Tamamlandı: 3\/3/)
assert.match(m.message, /birleşti/)
for (const text of [assemblyText(0, names), assemblyText(0, names, { result: 'row', id: 1 }), m]) {
  assert(!/\b1[0-9]{3}\b|yüzyıl|padişah|sultan|yapıldı|inşa edildi/i.test(text.top + text.message + text.not), 'tarihsel iddia')
}

console.log('Maket birleştirme: sıra, raf, seçim, taşıma ve metin başarılı.')
