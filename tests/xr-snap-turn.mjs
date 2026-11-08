// Snap turn: one 45 degree step per flick, re-armed only after the stick returns near the centre.
import assert from 'node:assert/strict'
import { snapTurn, XR_SNAP_ANGLE } from '../src/shared/xr/xrSnapTurn.ts'

let s = snapTurn(0, true)
assert.deepEqual(s, { angle: 0, ready: true }, 'centred stick does nothing')
s = snapTurn(0.9, s.ready)
assert.equal(s.angle, -XR_SNAP_ANGLE, 'right flick turns right (negative rotation about Y)')
assert.equal(s.ready, false)
s = snapTurn(0.9, s.ready)
assert.equal(s.angle, 0, 'holding the stick does not turn again')
s = snapTurn(0.4, s.ready)
assert.equal(s.ready, false, 'between centre and threshold stays disarmed')
s = snapTurn(0.1, s.ready)
assert.equal(s.ready, true, 'returning to centre re-arms')
assert.equal(snapTurn(-0.9, true).angle, XR_SNAP_ANGLE, 'left flick turns left')
assert.equal(snapTurn(0.5, true).angle, 0, 'a push below the threshold does not turn')
console.log('Snap turn: single step per flick, re-arm at centre, both directions passed.')

// Smooth turn: eases in, full push reaches about 90°/s, a small push stays in the dead zone, release eases out.
{
  const { smoothTurn, XR_TURN_SPEED } = await import('../src/shared/xr/xrSnapTurn.ts')
  assert.equal(smoothTurn(0.15, 0, 1 / 72), 0, 'dead zone does not turn')
  let v = smoothTurn(1, 0, 1 / 72)
  assert.ok(v < 0 && Math.abs(v) < XR_TURN_SPEED * 0.2, 'first frame does not jump to full speed')
  for (let i = 0; i < 72; i++) v = smoothTurn(1, v, 1 / 72)
  assert.ok(Math.abs(v + XR_TURN_SPEED) < 0.01, 'full push to the right turns right at full speed')
  assert.ok(smoothTurn(-1, 0, 1 / 72) > 0, 'left push turns left')
  let w = v
  w = smoothTurn(0, w, 1 / 72)
  assert.ok(w < 0 && Math.abs(w) < Math.abs(v), 'release slows down instead of stopping in one frame')
  for (let i = 0; i < 144; i++) w = smoothTurn(0, w, 1 / 72)
  assert.equal(w, 0, 'turn stops after release')
  console.log('XR smooth turn: dead zone, ease in, full speed, ease out passed.')
}
