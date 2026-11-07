import assert from 'node:assert/strict'
import { firstGame, strike, heatUp, giveWater, wrist, masterComplete, average } from '../src/features/workshops/sword/engine/state.ts'
import { computeCut } from '../src/features/workshops/sword/engine/test.ts'
let d = firstGame(); d.stage = 2
for (let i = 0; i < 10; i++) strike(d, 0)
assert.equal(d.regions[0].p, 0); assert(d.crack_); assert(d.strain > 1)
d = firstGame(); d.stage = 2; d.regions.forEach(b => { b.heat = 650 }); strike(d, 0); assert.equal(d.regions[0].p, .17)
d.regions.forEach(b => { b.heat = 900 }); strike(d, 1); assert.equal(d.regions[1].p, .34)
for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) strike(d, i)
assert.equal(d.stage, 3); assert.equal(average(d, 'p'), 1)
for (const [heat, expect] of [[830, 1], [200, 0], [1150, .31]]) {
  d = firstGame(); d.stage = 3; d.regions.forEach(b => { b.heat = heat }); giveWater(d, .5); giveWater(d, 1.1)
  assert.equal(d.stage, 4); assert(Math.abs(d.hardness - expect) < .01); if (heat > 1050) assert(d.crack_)
}
d = firstGame(); heatUp(d, 10, true); assert.equal(average(d, 'heat'), 1200); assert(d.burn > 0)
d = firstGame(); d.stage = 4; for (let i = 0; i < 12; i++) wrist(d, i, .72); assert.equal(d.stage, 5)
d = firstGame(); d.stage = 4; for (let i = 0; i < 40; i++) wrist(d, 0, .2); assert(d.burn > 0)
d = firstGame(); for (let i = 0; i < 7; i++) masterComplete(d); assert.equal(d.stage, 7); assert.equal(d.attached, 7); assert.equal(d.hardness, .6); assert(Math.abs(average(d, 'skin') - .6) < .001)
assert(computeCut(d, 1, 0, .2).wasCut); d.target = 1; assert.equal(computeCut(d, 1, 0, .2).wasCut, false); d.target = 2; assert.equal(computeCut(d, .1, .1, 2).wasCut, false)
d.regions.forEach(b => { b.skin = 1 }); d.hardness = 1; assert(computeCut(d, 1, 0, .2).wasCut); d.crack_ = true; d.target = 1; assert(computeCut(d, 1, 0, .2).broke)
console.log('Kılıç mantığı: sıcak/soğuk darbe, 12 bölge, su verme, yanma, bileme, usta ve üç hedef başarılı.')
