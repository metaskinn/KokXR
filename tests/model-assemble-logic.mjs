// Pure calculations for VR model assembly. Run: node tests/model-assemble-logic.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HAND_GAIN, RAY_RANGE, SEAT_THRESHOLD, releaseResult, assemblyText, selectLayer, shelfLayout, carriedPlace } from '../src/features/scale-models/modelAssembleLogic.ts'

// The module stays free of three
assert(!/from 'three'/.test(readFileSync(new URL('../src/features/scale-models/modelAssembleLogic.ts', import.meta.url), 'utf8')))

// Order: if not close, order is not checked; the next one snaps, a higher one is rejected, the boundary is exclusive
assert.equal(releaseResult(0, 0, 0), 'seated')
assert.equal(releaseResult(0, 0, SEAT_THRESHOLD - 0.01), 'seated')
assert.equal(releaseResult(0, 0, SEAT_THRESHOLD), 'far')
assert.equal(releaseResult(2, 0, 1), 'row')
assert.equal(releaseResult(1, 0, 1), 'row')
assert.equal(releaseResult(1, 1, 1), 'seated')
assert.equal(releaseResult(2, 1, 1), 'row')
assert.equal(releaseResult(2, 1, 50), 'far')

// Shelf: on the right, non-overlapping shelves, top layer at the bottom; box center aligns with shelf center
const boxes = [
  { min: [-35, 13, -28], max: [35, 17, 28] },
  { min: [-30, 15, -24], max: [30, 19, 24] },
  { min: [-30, 18, -24], max: [30, 27, 24] },
]
const shelf = shelfLayout(boxes)
assert.equal(shelf.length, 3)
const base = (i) => boxes[i].min[1] + shelf[i][1], ceiling = (i) => boxes[i].max[1] + shelf[i][1]
assert(base(2) < base(1) && base(1) < base(0), 'top layer is not on the bottom shelf')
assert(ceiling(2) < base(1) && ceiling(1) < base(0), 'shelves overlap')
// Initial rig angle π: the user's right is -x. Outside the model body (half width ~35) and far beyond the threshold.
for (let i = 0; i < 3; i++) {
  assert(shelf[i][0] + boxes[i].max[0] < -35 + 25, 'shelf intersects the body')
  assert(Math.hypot(...shelf[i]) > SEAT_THRESHOLD * 3, 'shelf too close to the target')
}
// Threshold reachable by hand: the hand travel for the farthest layer must not exceed arm length.
assert(Math.max(...shelf.map((r) => Math.hypot(...r))) / HAND_GAIN < 70, 'hand travel too long')

// Selection: aiming comes before touching, the most central hit wins
const a = (id, center, radius = 30) => ({ id, center, radius })
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], []), null)
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 5, -100]), a(1, [0, 25, -100])]), 0)
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 20]), a(1, [0, 10, -100])]), 1, 'touch overrode the aim')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 20])]), 0, 'sole touched layer not selected')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [100, 0, -100])]), null, 'off-ray layer selected')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, 100])]), null, 'layer behind selected')
assert.equal(selectLayer([0, 0, 0], [0, 0, -1], [a(0, [0, 0, -RAY_RANGE - 1])]), null, 'out-of-range layer selected')

// Carrying: with gain; if the hand does not move, neither does the layer
assert.deepEqual(carriedPlace([1, 2, 3], [5, 5, 5], [5, 5, 5]), [1, 2, 3])
assert.deepEqual(carriedPlace([1, 2, 3], [0, 0, 0], [10, -5, 1]), [1 + 10 * HAND_GAIN, 2 - 5 * HAND_GAIN, 3 + HAND_GAIN])
assert.deepEqual(carriedPlace([0, 0, 0], [0, 0, 0], [1, 1, 1], 1), [1, 1, 1])

// Text: the order claim is limited to the model, no history
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
  assert(!/\b1[0-9]{3}\b|yüzyıl|padişah|sultan|yapıldı|inşa edildi/i.test(text.top + text.message + text.not), 'historical claim')
}

console.log('Model assembly: order, shelf, selection, carrying and text passed.')
