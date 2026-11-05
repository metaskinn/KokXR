import assert from 'node:assert/strict'
import { ilkOyun, sekillendir, astarSur, firin, sogut, sirDok, komurle, tahrirCiz, boya, boyaBitir, renkSec, kalite, ustaTamamla, eylemler, BISKUVI, SIR_FIRINI, TUTMA_SURESI } from '../src/components/cini/durum.ts'
import { bolgeBul, bolgeler, icinde, izIlerlet, izler, lale, yaprak, MERKEZ_R, HALKA_IC, HALKA_DIS } from '../src/components/cini/desen.ts'

// Desen: bölgeler doğru yerde, birbirine binmiyor.
assert.equal(bolgeler.length, 14)
assert.equal(bolgeler[bolgeBul([0, .5])].tur, 'lale')
assert.equal(bolgeler[bolgeBul([0, 0])].tur, 'merkez')
assert.equal(bolgeler[bolgeBul([(HALKA_IC + HALKA_DIS) / 2, 0])].tur, 'halka')
assert.equal(bolgeBul([0, .25]), -1)
assert.equal(bolgeBul([0, 0.99]), -1)
for (const [x, y] of yaprak.filter((_, i) => i % 3 === 0)) assert(!icinde([x * .98, y * .98], lale), 'yaprak laleye binmemeli')
assert(Math.hypot(...lale[0]) > MERKEZ_R, 'lale merkeze binmemeli')

// İz: atlayarak ilerlemez, uzaktayken ilerlemez.
assert.equal(izIlerlet(izler[0], 0, [5, 5], .07).sira, 0)
assert.equal(izIlerlet(izler[0], 0, izler[0][izler[0].length - 2], .07, 10).sira, 0)
assert(izIlerlet(izler[0], 0, izler[0][3], .07).sira >= 2)

// Şekil: yavaş çekmek ilerletir, hızlı çekmek ilerletmez.
let d = ilkOyun()
sekillendir(d, 1, .01); assert.equal(d.bicim, 0); assert(d.bicimCeza > 0)
d = ilkOyun()
for (let i = 0; i < 400 && d.asama === 0; i++) sekillendir(d, .05, .016)
assert.equal(d.asama, 1); assert.equal(d.alt, 0)

// Astar, sonra fırın: aralıkta tutmak gerekir.
for (let i = 0; i < 200 && d.alt === 0; i++) astarSur(d, .016)
assert.equal(d.alt, 1); assert(d.firinda)
firin(d, .016, false); assert.equal(d.isi, 20)
let adim = 0
while (d.isi < BISKUVI.min && adim++ < 5000) firin(d, .016, true)
assert(adim < 5000, 'fırın aralığa ulaşmalı')
assert(d.isi <= BISKUVI.max, 'tek adımda aralık atlanmamalı')
let t = 0
while (d.asama === 1 && t < 30) { firin(d, .016, d.isi < BISKUVI.min + 15); t += .016 }
assert.equal(d.asama, 2, 'ateş ayarlanarak bisküvi bitirilebilmeli')
assert(t >= TUTMA_SURESI - .1)

// Aşırı ısı kaliteyi düşürür.
const kS = ilkOyun(); kS.asama = 1; kS.alt = 1; kS.firinda = true; kS.isi = 1000
const kOnce = kalite(kS); for (let i = 0; i < 200; i++) firin(kS, .016, false); assert(kalite(kS) < kOnce)

// Kömür: gezdirince tamamlanır.
for (let y = -1; y <= 1 && d.asama === 2; y += .1) for (let x = -1; x <= 1 && d.asama === 2; x += .1) komurle(d, [x, y])
assert.equal(d.asama, 3); assert(d.komur.every(Boolean))

// Tahrir: izler sırayla bitince boyamaya geçer.
for (const iz of izler) for (const p of iz) tahrirCiz(d, p)
assert.equal(d.asama, 4)
assert(d.izOlcum > 0)

// Boya: bütün bölgeler dolmadan geçilmez, sonra geçilir.
assert(eylemler(d).find((e) => e.id === 'boyabitti').pasif)
boyaBitir(d); assert.equal(d.asama, 4)
renkSec(d, 'kirmizi'); boya(d, 0); assert.equal(d.boyalar[0], 'kirmizi')
boya(d, -1); bolgeler.forEach((_, i) => boya(d, i))
assert(!eylemler(d).find((e) => e.id === 'boyabitti').pasif)
boyaBitir(d); assert.equal(d.asama, 5)

// Sır ve fırın: kaynaktaki aralık, sonra canlanma.
assert.deepEqual([SIR_FIRINI.min, SIR_FIRINI.max], [900, 940])
for (let i = 0; i < 200 && d.alt === 0; i++) sirDok(d, .016)
assert.equal(d.alt, 1)
t = 0; while (d.alt === 1 && t < 40) { firin(d, .016, d.isi < SIR_FIRINI.min + 15); t += .016 }
assert.equal(d.alt, 2); assert.equal(d.canli, 0)
for (let i = 0; i < 400 && d.asama === 5; i++) sogut(d, .016)
assert.equal(d.asama, 6); assert.equal(d.canli, 1)
assert(kalite(d) >= 70 && kalite(d) <= 100, `kalite ${kalite(d)}`)

// Usta her adımı bitirir ve akış kilitlenmez.
d = ilkOyun()
for (let i = 0; i < 6; i++) { ustaTamamla(d); if (d.asama === 5 && d.alt === 2) while (d.asama === 5) sogut(d, .1) }
assert.equal(d.asama, 6); assert(d.boyalar.every(Boolean))
console.log('Çini mantık testleri geçti.')
