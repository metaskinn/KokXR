import assert from 'node:assert/strict'
import { firstGame, shapeUp, applySlip, kiln, cool, pourGlaze, withCoal, drawOutline, paint, finishPaint, pickColor, quality, masterComplete, actions, BISQUE, GLAZE_KILN, HOLD_DURATION } from '../src/components/tile/state.ts'
import { findRegion, regions, within, advanceTrace, traces, tulip, leaf, CENTER_R, RING_IN, RING_OUT } from '../src/components/tile/pattern.ts'

// Desen: bölgeler doğru yerde, birbirine binmiyor.
assert.equal(regions.length, 14)
assert.equal(regions[findRegion([0, .5])].tour, 'tulip')
assert.equal(regions[findRegion([0, 0])].tour, 'center')
assert.equal(regions[findRegion([(RING_IN + RING_OUT) / 2, 0])].tour, 'ring')
assert.equal(findRegion([0, .25]), -1)
assert.equal(findRegion([0, 0.99]), -1)
for (const [x, y] of leaf.filter((_, i) => i % 3 === 0)) assert(!within([x * .98, y * .98], tulip), 'yaprak laleye binmemeli')
assert(Math.hypot(...tulip[0]) > CENTER_R, 'lale merkeze binmemeli')

// İz: atlayarak ilerlemez, uzaktayken ilerlemez.
assert.equal(advanceTrace(traces[0], 0, [5, 5], .07).row, 0)
assert.equal(advanceTrace(traces[0], 0, traces[0][traces[0].length - 2], .07, 10).row, 0)
assert(advanceTrace(traces[0], 0, traces[0][3], .07).row >= 2)

// Şekil: yavaş çekmek ilerletir, hızlı çekmek ilerletmez.
let d = firstGame()
shapeUp(d, 1, .01); assert.equal(d.form, 0); assert(d.formPenalty > 0)
d = firstGame()
for (let i = 0; i < 400 && d.stage === 0; i++) shapeUp(d, .05, .016)
assert.equal(d.stage, 1); assert.equal(d.alt, 0)

// Astar, sonra fırın: aralıkta tutmak gerekir.
for (let i = 0; i < 200 && d.alt === 0; i++) applySlip(d, .016)
assert.equal(d.alt, 1); assert(d.inKiln)
kiln(d, .016, false); assert.equal(d.heat, 20)
let step = 0
while (d.heat < BISQUE.min && step++ < 5000) kiln(d, .016, true)
assert(step < 5000, 'fırın aralığa ulaşmalı')
assert(d.heat <= BISQUE.max, 'tek adımda aralık atlanmamalı')
let t = 0
while (d.stage === 1 && t < 30) { kiln(d, .016, d.heat < BISQUE.min + 15); t += .016 }
assert.equal(d.stage, 2, 'ateş ayarlanarak bisküvi bitirilebilmeli')
assert(t >= HOLD_DURATION - .1)

// Aşırı ısı kaliteyi düşürür.
const kS = firstGame(); kS.stage = 1; kS.alt = 1; kS.inKiln = true; kS.heat = 1000
const kOnce = quality(kS); for (let i = 0; i < 200; i++) kiln(kS, .016, false); assert(quality(kS) < kOnce)

// Kömür: gezdirince tamamlanır.
for (let y = -1; y <= 1 && d.stage === 2; y += .1) for (let x = -1; x <= 1 && d.stage === 2; x += .1) withCoal(d, [x, y])
assert.equal(d.stage, 3); assert(d.coal.every(Boolean))

// Tahrir: izler sırayla bitince boyamaya geçer.
for (const iz of traces) for (const p of iz) drawOutline(d, p)
assert.equal(d.stage, 4)
assert(d.traceMeasure > 0)

// Boya: bütün bölgeler dolmadan geçilmez, sonra geçilir.
assert(actions(d).find((e) => e.id === 'paintdone').passive)
finishPaint(d); assert.equal(d.stage, 4)
pickColor(d, 'red'); paint(d, 0); assert.equal(d.paints[0], 'red')
paint(d, -1); regions.forEach((_, i) => paint(d, i))
assert(!actions(d).find((e) => e.id === 'paintdone').passive)
finishPaint(d); assert.equal(d.stage, 5)

// Sır ve fırın: kaynaktaki aralık, sonra canlanma.
assert.deepEqual([GLAZE_KILN.min, GLAZE_KILN.max], [900, 940])
for (let i = 0; i < 200 && d.alt === 0; i++) pourGlaze(d, .016)
assert.equal(d.alt, 1)
t = 0; while (d.alt === 1 && t < 40) { kiln(d, .016, d.heat < GLAZE_KILN.min + 15); t += .016 }
assert.equal(d.alt, 2); assert.equal(d.live, 0)
for (let i = 0; i < 400 && d.stage === 5; i++) cool(d, .016)
assert.equal(d.stage, 6); assert.equal(d.live, 1)
assert(quality(d) >= 70 && quality(d) <= 100, `kalite ${quality(d)}`)

// Usta her adımı bitirir ve akış kilitlenmez.
d = firstGame()
for (let i = 0; i < 6; i++) { masterComplete(d); if (d.stage === 5 && d.alt === 2) while (d.stage === 5) cool(d, .1) }
assert.equal(d.stage, 6); assert(d.paints.every(Boolean))
console.log('Çini mantık testleri geçti.')
