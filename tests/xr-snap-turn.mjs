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
