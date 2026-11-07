// Pure calculations and panel content for the sword VR. Run: node tests/sword-xr-logic.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { firstGame, masterComplete, stages } from '../src/features/workshops/sword/engine/state.ts'
import { computeCut } from '../src/features/workshops/sword/engine/test.ts'
import { swordIntro, swordSources, swordPartNotes } from '../src/content/sword.ts'
import {
  station, stationRig, SEAT_EYE, angleDiff, panelShouldReturn, rayAxisX, nearestRegion, planeX, wristStep, hammerSwing, HammerMeter,
  SwingMeter, swingCut, SWING_TOLERANCE, pieceSnaps, PIECE_SEAT_THRESHOLD, panelState, infoState, panelLayout, panelFrame, PANEL_G, PANEL_Y,
} from '../src/features/workshops/sword/engine/xrCalc.ts'

const near = (a, b, e = 1e-6) => assert(Math.abs(a - b) < e, `${a} ≠ ${b}`)

// --- station: once the rig is applied the head lands at the station facing the target, wherever the head is and looks in the room
for (const stage of [0, 1, 2, 3, 4, 5, 6, 7]) for (const target of [0, 1, 2]) for (const head of [{ x: 0, y: 1.6, z: 0, yaw: 0 }, { x: .7, y: 1.7, z: -.4, yaw: 1.2 }, { x: -.3, y: 1.5, z: .9, yaw: -2.6 }]) {
  const ist = station({ stage, target, again: false }), r = stationRig(ist, head)
  const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
  near(r.x + head.x * c + head.z * s, ist.x); near(r.z - head.x * s + head.z * c, ist.z)
  const worldYaw = r.rotY + head.yaw, forwardX = -Math.sin(worldYaw), forwardZ = -Math.cos(worldYaw), l = Math.hypot(ist.lookX - ist.x, ist.lookZ - ist.z)
  near(forwardX, (ist.lookX - ist.x) / l); near(forwardZ, (ist.lookZ - ist.z) / l)
  assert.equal(r.y, 0, 'a standing user must not be lifted')
}
near(stationRig(station({ stage: 2, target: 0, again: false }), { x: 0, y: 1.05, z: 0, yaw: 0 }).y + 1.05, SEAT_EYE)
assert.deepEqual(station({ stage: 2, target: 0, again: true }), station({ stage: 1, target: 0, again: false }), 'reheating goes to the forge')
// The main object is within hand or short-ray reach: fixed object positions in the scene (sword workshop .glb).
for (const [a, x, z] of [[0, 2.8, -2.5], [1, -3.7, -1.75], [1, -2.25, -1.45], [2, 0, -.1], [3, 1.95, .15], [4, 3.05, -1.2], [5, 2.45, -2.45], [6, .42, 0]]) {
  const i = station({ stage: a, target: 0, again: false }), u = Math.hypot(i.x - x, i.z - z)
  assert(u <= 1.1, `stage ${a} object is ${u.toFixed(2)} m away`)
}
// Inside the rooms: room x ±4.25, z -3.05..4; courtyard x 9.5..18.5.
for (let a = 0; a < 7; a++) { const i = station({ stage: a, target: 0, again: false }); assert(Math.abs(i.x) < 4.2 && i.z > -3 && i.z < 3.9, `stage ${a} outside the room`) }
for (let h = 0; h < 3; h++) { const i = station({ stage: 7, target: h, again: false }); assert(i.x > 9.6 && i.x < 18.4) }

// --- panel returning
near(angleDiff(3.1, -3.1), 6.2 - 2 * Math.PI)
let g = panelShouldReturn(0, .5, 0, .1); assert(!g.shouldCome); assert.equal(g.sure, 0)
g = panelShouldReturn(2.5, .5, 0, .6); assert(!g.shouldCome); g = panelShouldReturn(2.5, .5, g.sure, .7); assert(g.shouldCome); assert.equal(g.sure, 0)

// --- ray and blade
let h = rayAxisX({ x: .5, y: .3, z: 1 }, { x: 0, y: 0, z: -1 }, 1); near(h.x, .5); near(h.distance, .3)
h = rayAxisX({ x: .5, y: 0, z: 1 }, { x: .6, y: 0, z: -.8 }, 1.06); near(h.x, 1.06); assert(h.distance > 0)
h = rayAxisX({ x: .5, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }, 1); near(h.distance, 1, 1e-6) // backward-facing ray
assert.equal(nearestRegion([.1, .2, .3], .26), 2); assert.equal(nearestRegion([.1, .2, .3], -1), 0)
near(planeX({ x: 1, y: 0, z: 2 }, { x: .5, y: 0, z: -1 }, 0), 2); assert.equal(planeX({ x: 1, y: 0, z: 2 }, { x: 0, y: 0, z: 1 }, 0), null); assert.equal(planeX({ x: 1, y: 0, z: 2 }, { x: 1, y: 0, z: 0 }, 0), null)
near(wristStep(.5, .106), .4); near(wristStep(.5, -.106), .6); near(wristStep(.01, 1), 0); near(wristStep(.5, 5), .5 - .2 / 1.06)

// --- hammer swing: one strike per downswing
let c = hammerSwing(-2.5, true); assert(c.strike); assert(!c.armed)
c = hammerSwing(-2.5, c.armed); assert(!c.strike); c = hammerSwing(-.2, c.armed); assert(!c.strike); assert(c.armed); assert(hammerSwing(-2, c.armed).strike)
assert(!hammerSwing(2.5, true).strike, 'raising does not strike')

// A stale target, the other hand, tracking loss and stalls produce no strike.
const hammer = new HammerMeter(), otherHand = new HammerMeter()
assert.equal(hammer.step(1.4, .02, 4), null)
assert.equal(hammer.step(1.3, .02, null), 4, 'the region aimed at shortly before is struck on the downswing')
assert.equal(hammer.step(1.2, .02, null), null, 'no second strike in one downswing')
otherHand.step(1.4, .02, null)
assert.equal(otherHand.step(1.2, .02, null), null, 'the other hand\'s aim cannot be used')
hammer.step(1.4, .02, 4)
for (let i = 0; i < 12; i++) hammer.step(1.4, .02, null)
assert.equal(hammer.step(1.2, .02, null), null, 'no ghost strike on a stale target')
hammer.reset(); assert.equal(hammer.step(.3, .02, 4), null, 'first pose after a tracking/rig change is not a strike')
assert.equal(hammer.step(-.1, .3, 4), null, 'a long frame gap is not a strike')
assert.equal(hammer.step(.3, .02, 4), null)
hammer.fireTrigger(); assert.equal(hammer.step(.2, .02, 4), null, 'trigger plus the same downswing do not produce two strikes')

// --- assembly: snaps when close; grabbing and releasing at the waiting spot (+12 cm, +14 cm in the desktop scene) is not enough
assert(pieceSnaps(.05)); assert(!pieceSnaps(PIECE_SEAT_THRESHOLD)); assert(!pieceSnaps(Math.hypot(.12, .14)))

// --- swinging
const dt = 1 / 72
function swing(o, path) { const s = []; for (const p of path) { const r = o.step(p, dt); if (r) s.push(r) } return s }
const dur = n => Array.from({ length: n }, () => ({ x: 12, y: 1.3, z: .2 }))
const slip = (n, speed, x0 = 12) => Array.from({ length: n }, (_, i) => ({ x: x0 + speed * dt * i, y: 1.3, z: .2 }))
let o = new SwingMeter(); assert.equal(swing(o, dur(20)).length, 0, 'a still arm is not a swing')
assert.equal(swing(new SwingMeter(), slip(30, .8)).length, 0, 'a slow arm is not a swing')
o = new SwingMeter(); let s = swing(o, [...slip(1, 0), ...slip(14, 3), ...Array.from({ length: 4 }, () => ({ x: 12 + 3 * dt * 13, y: 1.3, z: .2 }))])
assert.equal(s.length, 1); assert(s[0].b.x > s[0].a.x + .4); assert(s[0].sure > .1 && s[0].sure < .4)
assert(!o.ongoing)
// Short jitter and cooldown between consecutive swings
o = new SwingMeter(); assert.equal(swing(o, [{ x: 0, y: 1, z: 0 }, { x: .03, y: 1, z: 0 }, { x: .03, y: 1, z: 0 }, { x: .03, y: 1, z: 0 }]).length, 0, 'short jitter')
o = new SwingMeter(); s = swing(o, slip(50, 4)); assert.equal(s.length, 1, 'a very long swing ends at the time limit; no new one starts during cooldown')
o.reset(); assert.equal(o.step({ x: 0, y: 0, z: 0 }, dt), null)

// --- swing → cut line and computeCut inputs
const roll = { minX: 11.9, maxX: 12.1, minY: .6, maxY: 1.55, z: 0 }
let k = swingCut({ a: { x: 11.7, y: 1.2, z: .4 }, b: { x: 12.4, y: 1.1, z: .4 }, sure: .2 }, roll)
near(k.a.z, 0); near(k.a.y, 1.2); near(k.a.x, 11.7); assert(k.near, 'a line through the roll is not shifted')
near(k.dx, .7 / 2.5); near(k.dy, .1 / 2.5)
const speed = Math.hypot(k.dx, k.dy) / k.sure; assert(speed > 1 && speed < 2, `speed ${speed}`)
k = swingCut({ a: { x: 12.3, y: 1.2, z: .4 }, b: { x: 13, y: 1.1, z: .4 }, sure: .2 }, roll)
assert(k.near); assert(k.a.x <= 12.1 + 1e-9, 'a nearby line is pulled to the target'); near(k.b.x - k.a.x, .7)
k = swingCut({ a: { x: 11.6, y: 2.4, z: .4 }, b: { x: 12.4, y: 2.4, z: .4 }, sure: .2 }, roll)
assert(!k.near); near(k.a.y, 2.4); assert(2.4 - 1.55 > SWING_TOLERANCE)
k = swingCut({ a: { x: 14, y: 1.5, z: .4 }, b: { x: 14, y: .95, z: .4 }, sure: .2 }, { minX: 13.6, maxX: 14.4, minY: .62, maxY: .86, z: -.1 })
assert(k.near); assert(k.b.y <= .86 + 1e-9, 'a downward cut touches the log'); assert(k.dy > 0, 'screen Y is positive downward')
// The converted input exceeds computeCut's speed thresholds (speed > .7) in a real swing
const dSpeed = Object.assign(firstGame(), { stage: 7 }); computeCut(dSpeed, k.dx, k.dy, k.sure)
assert.equal(dSpeed.broke, false)

// --- panel content: master, restart, exit at every stage; layout does not overflow; hit test correct
for (let a = 0; a < 8; a++) for (const not of [null, 3]) {
  const d = firstGame(); for (let i = 0; i < a; i++) masterComplete(d)
  assert.equal(d.stage, a)
  const p = panelState(d, { reheat: false, not })
  assert.equal(p.title, stages[a]); assert.deepEqual(p.common.map(b => b.id), ['command:master', 'command:fromStart', 'exit']); assert.equal(p.common[0].ad, 'Ustaya bırak')
  assert.equal(p.common[2].ad, "VR'dan çık"); assert(p.instruction.length < 180, `stage ${a} instruction too long`)
  const y = panelLayout(p)
  // Title, instruction and message on top (≈285 px); at least this much must remain for gauges and quality.
  const needed = 285 + (p.heat ? 58 : 0) + (p.progress ? 44 : 0) + (p.quality ? 116 : 0)
  assert(y.contentBottom >= needed, `stage ${a}: content ${needed} px, room ${y.contentBottom} px`)
  for (const q of y.squares) {
    assert(q.x >= 0 && q.x + q.g <= PANEL_G && q.y >= 0 && q.y2 <= PANEL_Y, `stage ${a} ${q.id} overflowed`)
    assert.equal(panelFrame(y.squares, (q.x + q.g / 2) / PANEL_G, 1 - (q.y + q.y2) / 2 / PANEL_Y)?.id, q.id)
    for (const r of y.squares) if (r !== q) assert(q.x + q.g <= r.x || r.x + r.g <= q.x || q.y2 <= r.y || r.y2 <= q.y, `${q.id} and ${r.id} overlap`)
  }
  assert.equal(panelFrame(y.squares, .5, .999), null, 'no hit on the title')
  // The honesty note stays unchanged at every stage and with every note open.
  const b = infoState(a, not); assert.equal(b.honesty, swordIntro.honesty); assert(b.source.startsWith('Kaynak: ')); assert(Object.values(swordSources).some(v => b.source.endsWith(v)))
}
assert.equal(infoState(6, 3).title, swordPartNotes[3].title); assert.equal(infoState(5, 3).title, 'Atölye notu')

const dA = firstGame()
assert.deepEqual(panelState(dA, { reheat: false, not: null }).buttons.map(b => b.id), ['command:al'])
masterComplete(dA); dA.regions.forEach(b => { b.heat = 100 })
let p = panelState(dA, { reheat: false, not: null }); assert(p.buttons.find(b => b.id === 'command:continue').passive); assert(p.buttons.find(b => b.id === 'hold:bellows').hold)
dA.regions.forEach(b => { b.heat = 800 }); assert(!panelState(dA, { reheat: false, not: null }).buttons.find(b => b.id === 'command:continue').passive)
masterComplete(dA); p = panelState(dA, { reheat: false, not: null }); assert.equal(p.regions.ratio.length, 12); assert(p.buttons.some(b => b.id === 'command:again'))
dA.again = true; p = panelState(dA, { reheat: false, not: null }); assert(!p.regions); assert(p.buttons.some(b => b.id === 'hold:bellows'))
dA.again = false; dA.master = true; p = panelState(dA, { reheat: false, not: null }); assert(p.buttons.every(b => b.passive)); assert(p.common[0].passive); assert(!p.common[1].passive)
const d7 = firstGame(); for (let i = 0; i < 7; i++) masterComplete(d7); d7.damages = [.5, 0, 0]; d7.broke = true
p = panelState(d7, { reheat: false, not: null }); assert(p.buttons[0].ad.includes('hasar %50')); assert(p.buttons.find(b => b.id === 'command:cutOff').passive); assert(p.quality.notes.some(n => n.startsWith('Kesim puanı')))

// --- Forbidden phrases: our VR texts (outside content/sword.ts) contain no historical claims or exaggeration.
for (const file of ['xrCalc.ts', 'xrPanel.ts', 'xrSession.ts']) {
  const text = readFileSync(new URL(`../src/features/workshops/sword/engine/${file}`, import.meta.url), 'utf8')
  for (const forbidden of [/birebir/i, /gerçek kılıç/i, /dijital ikiz/i, /XRControllerModelFactory/]) assert(!forbidden.test(text), `${file}: ${forbidden}`)
}
console.log('Sword VR calculations: station, panel return, ray, sharpening, hammer, swing, cut inputs, panel content and layout passed.')
