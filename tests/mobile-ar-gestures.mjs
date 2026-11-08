// Phone AR gestures: pinch factor clamping and twist wrapping.
import assert from 'node:assert/strict'
import { pinchFactor, twistDelta } from '../src/features/scale-models/mobileAr/gestures.ts'

assert.equal(pinchFactor(100, 100), 1)
assert.ok(Math.abs(pinchFactor(100, 110) - 1.1) < 1e-12)
assert.ok(Math.abs(pinchFactor(100, 90) - 0.9) < 1e-12)
assert.equal(pinchFactor(100, 500), 1.25, 'clamped up')
assert.equal(pinchFactor(100, 10), 0.8, 'clamped down')
assert.equal(pinchFactor(0, 50), 1, 'zero previous distance')
assert.equal(pinchFactor(50, 0), 1, 'zero distance')
assert.equal(pinchFactor(NaN, 50), 1)

assert.equal(twistDelta([0, 0, 1, 0], [0, 0, 1, 0]), 0, 'no movement')
assert.equal(twistDelta([5, 5, 5, 5], [5, 5, 5, 5]), 0, 'degenerate segment')
assert.ok(Math.abs(twistDelta([0, 0, 1, 0], [0, 0, 0, 1]) - Math.PI / 2) < 1e-12, 'quarter turn')
const seg = (r) => [0, 0, Math.cos(r), Math.sin(r)]
const d1 = twistDelta(seg(3.0), seg(-3.0))
assert.ok(d1 > 0 && Math.abs(d1 - (2 * Math.PI - 6.0)) < 1e-9, 'wraps forward across PI')
const d2 = twistDelta(seg(-3.0), seg(3.0))
assert.ok(d2 < 0 && Math.abs(d2 + (2 * Math.PI - 6.0)) < 1e-9, 'wraps backward across -PI')
assert.ok(Math.abs(twistDelta(seg(0), seg(Math.PI))) <= Math.PI + 1e-12)
console.log('Mobile AR gestures: pinch clamp, zero cases and twist wrapping passed.')

{
  const { midpoint } = await import('../src/features/scale-models/mobileAr/gestures.ts')
  assert.deepEqual(midpoint([0, 0, 10, 20]), [5, 10])
  console.log('Mobile AR gestures: two-finger midpoint passed.')
}
