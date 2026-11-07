import assert from 'node:assert/strict'
import { viewBlocked, collides, PLAYER_RADIUS } from '../src/features/scale-models/walkingCollision.ts'
import {
  deadZone, XR_WALK_SPEED, XR_TURN_SPEED, walkStep, smoothTurn, rotateAroundHead, tableRig, stopRig, controllerInput, nonOverlapAngle, titlePlace,
  TABLE_Y, TABLE_DISTANCE, TABLE_SCALE_INITIAL, TABLE_SCALE_MIN, TABLE_SCALE_MAX,
} from '../src/shared/xr/xrMotion.ts'
const near = (g, b) => { for (const a in b) assert(Math.abs(g[a] - b[a]) < 1e-6, `${a}: ${g[a]} ≠ ${b[a]}`) }

// Constants
assert.equal(PLAYER_RADIUS, 0.45); assert.equal(XR_WALK_SPEED, 1.6); assert.equal(XR_TURN_SPEED, Math.PI / 4)
assert.equal(TABLE_Y, 0.9); assert.equal(TABLE_DISTANCE, 1.2)
assert.equal(TABLE_SCALE_INITIAL, 100); assert.equal(TABLE_SCALE_MIN, 40); assert.equal(TABLE_SCALE_MAX, 200)

// Dead zone
assert.equal(deadZone(0.15), 0); assert.equal(deadZone(-0.1), 0); assert.equal(deadZone(1), 1); assert.equal(deadZone(-1), -1)
near({ d: deadZone(0.6) }, { d: 0.5 }); near({ d: deadZone(-0.6) }, { d: -0.5 })

// Walking
const free = () => false
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, free), {x:0, z:0.16})
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 5, free), {x:0, z:0.16})   // dt cap
near(walkStep({x:0,z:0}, {x:1,z:0}, {x:0,y:0}, 0.1, free), {x:0, z:0})
near(walkStep({x:0,z:0}, {x:0.6,z:0.8}, {x:0,y:-1}, 0.1, (x) => x > 0), {x:0, z:0.128}) // slides along the wall
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0.1,y:-0.15}, 0.1, free), {x:0, z:0}) // joystick drift
near(walkStep({x:0,z:0}, {x:0,z:-1}, {x:1,y:0}, 0.1, free), {x:0.16, z:0}) // facing -z, right is +x
near(walkStep({x:0,z:0}, {x:0,z:-1}, {x:0,y:1}, 0.1, free), {x:0, z:0.16}) // back
near(walkStep({x:0,z:0}, {x:0,z:3}, {x:0,y:-1}, 0.1, free), {x:0, z:0.16}) // same speed if direction is not unit length
const corner = walkStep({x:0,z:0}, {x:0,z:-1}, {x:1,y:-1}, 0.1, free)
near({ h: Math.hypot(corner.x, corner.z) }, { h: 0.16 }) // diagonal is not faster
near(walkStep({x:0,z:0}, {x:0,z:0}, {x:0,y:-1}, 0.1, free), {x:0, z:0}) // no direction, no forward motion
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, () => true), {x:0, z:0}) // every direction blocked

// Smooth turn: proportional to stick push, at most 45° per second; positive angle is left, pushing right turns right
near({ a: smoothTurn(1, 0.1) }, { a: -Math.PI / 40 })
near({ a: smoothTurn(-1, 0.1) }, { a: Math.PI / 40 })
near({ a: smoothTurn(0.6, 0.1) }, { a: -Math.PI / 80 }) // half push, half speed
assert.equal(Math.abs(smoothTurn(0.15, 0.1)), 0) // joystick drift does not turn
near({ a: smoothTurn(1, 5) }, { a: -Math.PI / 40 }) // no jump on a stalled frame

// Rig
near(rotateAroundHead({x:1,z:0}, {x:0,z:0}, Math.PI/2), {x:0, z:-1})
near(rotateAroundHead({x:3,z:4}, {x:3,z:4}, 1), {x:3, z:4}) // does not move if the head is at the rig origin
const m = tableRig(0, 100); near(m, {x:0, y:-90, z:-120, rotY:Math.PI})
near(tableRig(Math.PI/2, 50), {x:60, y:-45, z:0, rotY:Math.PI/2})
const k = stopRig([5,2.7,7], [5,2.7,20], {x:0,z:0}, 1.1); assert.equal(k.x, 5); assert.equal(k.y, 1.1); assert.equal(k.z, 7)
near(stopRig([0,0,0], [0,0,-3], {x:0,z:0}, 0), {rotY:0})
near(stopRig([0,0,0], [3,0,0], {x:0,z:0}, 0), {rotY:-Math.PI/2}) // forward (-z) turns to +x
// Even if the head is off the rig center, it lands on the stop's x/z in the world
const r = stopRig([5,2.7,7], [8,2.7,11], {x:0.4,z:-0.3}, 0)
const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
near({x: r.x + 0.4*c + -0.3*s, z: r.z - 0.4*s + -0.3*c}, {x:5, z:7})
// If the head is turned inside the rig it still faces the stop in the world: rotY + headYaw = target direction; head still at the stop
for (const headYaw of [Math.PI / 2, -1, 2.5]) {
  const ry = stopRig([5,2.7,7], [8,2.7,11], {x:0.4,z:-0.3}, 0, headYaw)
  const target = Math.atan2(-(8-5), -(11-7))
  near({ diff: Math.sin(ry.rotY + headYaw - target), cos: Math.cos(ry.rotY + headYaw - target) }, { diff: 0, cos: 1 })
  const cy = Math.cos(ry.rotY), sy = Math.sin(ry.rotY)
  near({x: ry.x + 0.4*cy + -0.3*sy, z: ry.z - 0.4*sy + -0.3*cy}, {x:5, z:7})
}

// Panel placement: positive angle is left, card and menu do not overlap
const SPLIT = 0.7
near({ a: nonOverlapAngle(0, 2, SPLIT, -1) }, { a: 0 })       // far apart: stays where requested
near({ a: nonOverlapAngle(0, 0, SPLIT, -1) }, { a: -SPLIT })  // exactly on top: shifts toward the given side
near({ a: nonOverlapAngle(0, 0, SPLIT, 1) }, { a: SPLIT })
near({ a: nonOverlapAngle(0.1, 0, SPLIT, -1) }, { a: SPLIT }) // toward whichever side the head is closer to
near({ a: nonOverlapAngle(-0.1, 0, SPLIT, 1) }, { a: -SPLIT })
near({ a: nonOverlapAngle(3.1, -3.1, SPLIT, 1) }, { a: -3.1 - SPLIT }) // difference computed correctly across ±π
near({ a: nonOverlapAngle(0.7, 0, SPLIT, 1) }, { a: 0.7 })    // does not shift at the boundary

// Info title: faces the head, grows when far, drops to eye level when near, does not sink into walls
const by = titlePlace([0, 12, 0], { x: 0, y: 2.3, z: 20 })
near(by, { x: 0, y: 12, z: 0.5, rotY: 0, scale: 2.4, horizontal: 20 }) // faces a head at +z, pulled 0.5 toward it
near({ rotY: titlePlace([0, 5, 0], { x: 3, y: 2.3, z: 0 }).rotY }, { rotY: Math.PI / 2 }) // faces a head at +x
near({ y: titlePlace([0, 12, 0], { x: 0, y: 2, z: 5 }).y }, { y: 7 })   // halfway there, halfway down
near({ y: titlePlace([0, 12, 0], { x: 0, y: 2, z: 1 }).y }, { y: 4.5 }) // at most a quarter remains below
near({ o: titlePlace([0, 2, 0], { x: 0, y: 2, z: 1 }).scale }, { o: 0.6 }) // lower limit when near
near({ o: titlePlace([0, 2, 0], { x: 0, y: 2, z: 100 }).scale }, { o: 2.4 }) // upper limit when far
near(titlePlace([1, 2, 3], { x: 1, y: 2, z: 3 }), { x: 1, z: 3, horizontal: 0 }) // exactly on top: no NaN

// Occlusion: a title behind a wall is not shown
const pillar = { x0: 4, x1: 6, z0: -1, z1: 1 }
assert.equal(viewBlocked(0, 0, 10, 0, pillar), true)
assert.equal(viewBlocked(0, 5, 10, 5, pillar), false)
assert.equal(viewBlocked(0, 0, 3, 0, pillar), false) // ends before reaching the pillar

// Collision
const y = { limit:{x0:-10,x1:10,z0:-10,z1:10}, boxes:[{x0:1,x1:2,z0:1,z1:2}], circles:[{x:-5,z:-5,r:1}], floors:[], viewBlockers:[], eyeY:2.7 }
assert.equal(collides(y, 0, 0, .45), false); assert.equal(collides(y, 1.5, 1.5, .45), true)
assert.equal(collides(y, -5, -5, .45), true); assert.equal(collides(y, 9.9, 0, .45), true)
assert.equal(collides(y, 0.6, 1.5, .45), true) // within one radius of the box
assert.equal(collides(y, 0.5, 1.5, .45), false)

// On a circular base, the corners of the square bound are not walkable floor.
const circular = { ...y, limit: { x0: -20, x1: 20, z0: -20, z1: 20, circle: { x: 0, z: 0, r: 23.8 } }, boxes: [], circles: [] }
assert.equal(collides(circular, 19, 19, .45), true)
assert.equal(collides(circular, 16, 16, .45), false)
// Even if the player's center is inside, the body cannot extend past the floor.
const shiftedCircle = { ...circular, limit: { x0: -20, x1: 20, z0: -20, z1: 20, circle: { x: 3, z: -2, r: 5 } } }
assert.equal(collides(shiftedCircle, 7.6, -2, .45), true)
assert.equal(collides(shiftedCircle, 7.5, -2, .45), false)
assert.equal(collides(shiftedCircle, 3, -2, .45), false)

// Controller input
const zero = { leftX:0, leftY:0, rightX:0, rightY:0, menu:false }
const buttons = (pressed) => Array.from({ length: 6 }, (_, i) => ({ pressed: pressed && i === 5 }))
assert.deepEqual(controllerInput([]), zero)
assert.deepEqual(controllerInput([{ handedness:'right' }]), zero) // no gamepad
assert.deepEqual(controllerInput([{ handedness:'right', gamepad:{ axes:[.3,.4], buttons:[] } }]), zero) // axes too short
// With a single controller a sideways push only turns: the same stick must not both strafe and turn.
const single = controllerInput([{ handedness:'right', gamepad:{ axes:[0,0,.5,-.8], buttons:[] } }])
assert.deepEqual(single, { leftX:0, leftY:-.8, rightX:.5, rightY:-.8, menu:false })
const two = controllerInput([
  { handedness:'left', gamepad:{ axes:[0,0,.1,.2], buttons:buttons(false) } },
  { handedness:'right', gamepad:{ axes:[0,0,.3,.4], buttons:buttons(false) } },
])
assert.deepEqual(two, { leftX:.1, leftY:.2, rightX:.3, rightY:.4, menu:false })
// If the second controller's stick is unreadable, the other counts as a single controller
const halfway = controllerInput([{ handedness:'left' }, { handedness:'right', gamepad:{ axes:[0,0,.5,-.8], buttons:[] } }])
assert.deepEqual(halfway, { leftX:0, leftY:-.8, rightX:.5, rightY:-.8, menu:false })
// Menu works from either hand, even if the stick is unreadable
assert.equal(controllerInput([{ handedness:'left', gamepad:{ axes:[0,0,0,0], buttons:buttons(true) } }, { handedness:'right', gamepad:{ axes:[0,0,0,0], buttons:buttons(false) } }]).menu, true)
assert.equal(controllerInput([{ handedness:'right', gamepad:{ axes:[], buttons:buttons(true) } }]).menu, true)
// Non-array Iterable (like XRInputSourceArray)
assert.equal(controllerInput(new Set([{ handedness:'right', gamepad:{ axes:[0,0,.5,0], buttons:[] } }])).rightX, .5)

console.log('Model XR logic: dead zone, walking and sliding, smooth turn, rig positions, info titles, collision and controller input passed.')
