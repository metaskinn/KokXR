import assert from 'node:assert/strict'
import { viewBlocked, collides, PLAYER_RADIUS } from '../src/features/scale-models/walkingCollision.ts'
import {
  deadZone, XR_WALK_SPEED, XR_TURN_SPEED, walkStep, smoothTurn, rotateAroundHead, tableRig, stopRig, controllerInput, nonOverlapAngle, titlePlace,
  TABLE_Y, TABLE_DISTANCE, TABLE_SCALE_INITIAL, TABLE_SCALE_MIN, TABLE_SCALE_MAX,
} from '../src/shared/xr/xrMotion.ts'
const near = (g, b) => { for (const a in b) assert(Math.abs(g[a] - b[a]) < 1e-6, `${a}: ${g[a]} ≠ ${b[a]}`) }

// Sabitler
assert.equal(PLAYER_RADIUS, 0.45); assert.equal(XR_WALK_SPEED, 1.6); assert.equal(XR_TURN_SPEED, Math.PI / 4)
assert.equal(TABLE_Y, 0.9); assert.equal(TABLE_DISTANCE, 1.2)
assert.equal(TABLE_SCALE_INITIAL, 100); assert.equal(TABLE_SCALE_MIN, 40); assert.equal(TABLE_SCALE_MAX, 200)

// Ölü bölge
assert.equal(deadZone(0.15), 0); assert.equal(deadZone(-0.1), 0); assert.equal(deadZone(1), 1); assert.equal(deadZone(-1), -1)
near({ d: deadZone(0.6) }, { d: 0.5 }); near({ d: deadZone(-0.6) }, { d: -0.5 })

// Yürüme
const free = () => false
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, free), {x:0, z:0.16})
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 5, free), {x:0, z:0.16})   // dt sınırı
near(walkStep({x:0,z:0}, {x:1,z:0}, {x:0,y:0}, 0.1, free), {x:0, z:0})
near(walkStep({x:0,z:0}, {x:0.6,z:0.8}, {x:0,y:-1}, 0.1, (x) => x > 0), {x:0, z:0.128}) // duvar boyunca kayar
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0.1,y:-0.15}, 0.1, free), {x:0, z:0}) // joystick kayması
near(walkStep({x:0,z:0}, {x:0,z:-1}, {x:1,y:0}, 0.1, free), {x:0.16, z:0}) // -z'ye bakarken sağ +x
near(walkStep({x:0,z:0}, {x:0,z:-1}, {x:0,y:1}, 0.1, free), {x:0, z:0.16}) // geri
near(walkStep({x:0,z:0}, {x:0,z:3}, {x:0,y:-1}, 0.1, free), {x:0, z:0.16}) // yön birim değilse hız aynı
const corner = walkStep({x:0,z:0}, {x:0,z:-1}, {x:1,y:-1}, 0.1, free)
near({ h: Math.hypot(corner.x, corner.z) }, { h: 0.16 }) // çapraz daha hızlı değil
near(walkStep({x:0,z:0}, {x:0,z:0}, {x:0,y:-1}, 0.1, free), {x:0, z:0}) // yön yoksa ileri hareket de yok
near(walkStep({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, () => true), {x:0, z:0}) // her yön kapalı

// Yumuşak dönüş: çubuğun itildiği kadar, saniyede en çok 45°; artı açı sola, sağa itiş sağa döndürür
near({ a: smoothTurn(1, 0.1) }, { a: -Math.PI / 40 })
near({ a: smoothTurn(-1, 0.1) }, { a: Math.PI / 40 })
near({ a: smoothTurn(0.6, 0.1) }, { a: -Math.PI / 80 }) // yarım itiş yarım hız
assert.equal(Math.abs(smoothTurn(0.15, 0.1)), 0) // joystick kayması döndürmez
near({ a: smoothTurn(1, 5) }, { a: -Math.PI / 40 }) // takılan karede zıplamaz

// Rig
near(rotateAroundHead({x:1,z:0}, {x:0,z:0}, Math.PI/2), {x:0, z:-1})
near(rotateAroundHead({x:3,z:4}, {x:3,z:4}, 1), {x:3, z:4}) // baş rig'in üstündeyse kımıldamaz
const m = tableRig(0, 100); near(m, {x:0, y:-90, z:-120, rotY:Math.PI})
near(tableRig(Math.PI/2, 50), {x:60, y:-45, z:0, rotY:Math.PI/2})
const k = stopRig([5,2.7,7], [5,2.7,20], {x:0,z:0}, 1.1); assert.equal(k.x, 5); assert.equal(k.y, 1.1); assert.equal(k.z, 7)
near(stopRig([0,0,0], [0,0,-3], {x:0,z:0}, 0), {rotY:0})
near(stopRig([0,0,0], [3,0,0], {x:0,z:0}, 0), {rotY:-Math.PI/2}) // ileri (-z) +x'e döner
// Baş rig'in ortasında değilse bile dünyada duraktaki x/z'ye gelir
const r = stopRig([5,2.7,7], [8,2.7,11], {x:0.4,z:-0.3}, 0)
const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
near({x: r.x + 0.4*c + -0.3*s, z: r.z - 0.4*s + -0.3*c}, {x:5, z:7})
// Baş rig içinde dönükse dünyada yine durağa bakar: rotY + basYaw = hedef yön; baş yine durakta
for (const headYaw of [Math.PI / 2, -1, 2.5]) {
  const ry = stopRig([5,2.7,7], [8,2.7,11], {x:0.4,z:-0.3}, 0, headYaw)
  const target = Math.atan2(-(8-5), -(11-7))
  near({ diff: Math.sin(ry.rotY + headYaw - target), cos: Math.cos(ry.rotY + headYaw - target) }, { diff: 0, cos: 1 })
  const cy = Math.cos(ry.rotY), sy = Math.sin(ry.rotY)
  near({x: ry.x + 0.4*cy + -0.3*sy, z: ry.z - 0.4*sy + -0.3*cy}, {x:5, z:7})
}

// Panel yerleşimi: açı artı yönde soldur, kart ve menü örtüşmez
const SPLIT = 0.7
near({ a: nonOverlapAngle(0, 2, SPLIT, -1) }, { a: 0 })       // uzakta: istenen yerde kalır
near({ a: nonOverlapAngle(0, 0, SPLIT, -1) }, { a: -SPLIT })  // tam üstünde: yon'a kayar
near({ a: nonOverlapAngle(0, 0, SPLIT, 1) }, { a: SPLIT })
near({ a: nonOverlapAngle(0.1, 0, SPLIT, -1) }, { a: SPLIT }) // baş hangi yana yakınsa o yana
near({ a: nonOverlapAngle(-0.1, 0, SPLIT, 1) }, { a: -SPLIT })
near({ a: nonOverlapAngle(3.1, -3.1, SPLIT, 1) }, { a: -3.1 - SPLIT }) // ±π sınırında fark doğru hesaplanır
near({ a: nonOverlapAngle(0.7, 0, SPLIT, 1) }, { a: 0.7 })    // sınırda kaymaz

// Bilgi başlığı: başa dönük, uzakta büyür, yaklaşınca göz hizasına iner, duvara gömülmez
const by = titlePlace([0, 12, 0], { x: 0, y: 2.3, z: 20 })
near(by, { x: 0, y: 12, z: 0.5, rotY: 0, scale: 2.4, horizontal: 20 }) // +z'deki başa bakar, başa 0.5 çekilir
near({ rotY: titlePlace([0, 5, 0], { x: 3, y: 2.3, z: 0 }).rotY }, { rotY: Math.PI / 2 }) // +x'teki başa bakar
near({ y: titlePlace([0, 12, 0], { x: 0, y: 2, z: 5 }).y }, { y: 7 })   // yarı yolda yarı inmiş
near({ y: titlePlace([0, 12, 0], { x: 0, y: 2, z: 1 }).y }, { y: 4.5 }) // altında en çok çeyreği kalır
near({ o: titlePlace([0, 2, 0], { x: 0, y: 2, z: 1 }).scale }, { o: 0.6 }) // yakında alt sınır
near({ o: titlePlace([0, 2, 0], { x: 0, y: 2, z: 100 }).scale }, { o: 2.4 }) // uzakta üst sınır
near(titlePlace([1, 2, 3], { x: 1, y: 2, z: 3 }), { x: 1, z: 3, horizontal: 0 }) // tam üstünde: sayı bozulmaz

// Görüş kesilmesi: duvarın ardındaki başlık gösterilmez
const pillar = { x0: 4, x1: 6, z0: -1, z1: 1 }
assert.equal(viewBlocked(0, 0, 10, 0, pillar), true)
assert.equal(viewBlocked(0, 5, 10, 5, pillar), false)
assert.equal(viewBlocked(0, 0, 3, 0, pillar), false) // kolona varmadan biter

// Çarpışma
const y = { limit:{x0:-10,x1:10,z0:-10,z1:10}, boxes:[{x0:1,x1:2,z0:1,z1:2}], circles:[{x:-5,z:-5,r:1}], floors:[], viewBlockers:[], eyeY:2.7 }
assert.equal(collides(y, 0, 0, .45), false); assert.equal(collides(y, 1.5, 1.5, .45), true)
assert.equal(collides(y, -5, -5, .45), true); assert.equal(collides(y, 9.9, 0, .45), true)
assert.equal(collides(y, 0.6, 1.5, .45), true) // kutuya yarıçap kadar yakın
assert.equal(collides(y, 0.5, 1.5, .45), false)

// Dairesel kaidede kare sınırın köşeleri yürünebilir döşeme sayılmaz.
const circular = { ...y, limit: { x0: -20, x1: 20, z0: -20, z1: 20, circle: { x: 0, z: 0, r: 23.8 } }, boxes: [], circles: [] }
assert.equal(collides(circular, 19, 19, .45), true)
assert.equal(collides(circular, 16, 16, .45), false)
// Oyuncunun merkezi içeride olsa da gövdesi döşemenin dışına çıkamaz.
const shiftedCircle = { ...circular, limit: { x0: -20, x1: 20, z0: -20, z1: 20, circle: { x: 3, z: -2, r: 5 } } }
assert.equal(collides(shiftedCircle, 7.6, -2, .45), true)
assert.equal(collides(shiftedCircle, 7.5, -2, .45), false)
assert.equal(collides(shiftedCircle, 3, -2, .45), false)

// Kumanda girdisi
const zero = { leftX:0, leftY:0, rightX:0, rightY:0, menu:false }
const buttons = (pressed) => Array.from({ length: 6 }, (_, i) => ({ pressed: pressed && i === 5 }))
assert.deepEqual(controllerInput([]), zero)
assert.deepEqual(controllerInput([{ handedness:'right' }]), zero) // gamepad yok
assert.deepEqual(controllerInput([{ handedness:'right', gamepad:{ axes:[.3,.4], buttons:[] } }]), zero) // axes kısa
// Tek kumandada yana itiş yalnız dönüştür: aynı çubuk hem kaydırıp hem döndürmesin.
const single = controllerInput([{ handedness:'right', gamepad:{ axes:[0,0,.5,-.8], buttons:[] } }])
assert.deepEqual(single, { leftX:0, leftY:-.8, rightX:.5, rightY:-.8, menu:false })
const two = controllerInput([
  { handedness:'left', gamepad:{ axes:[0,0,.1,.2], buttons:buttons(false) } },
  { handedness:'right', gamepad:{ axes:[0,0,.3,.4], buttons:buttons(false) } },
])
assert.deepEqual(two, { leftX:.1, leftY:.2, rightX:.3, rightY:.4, menu:false })
// Çubuğu okunamayan ikinci kumanda varken diğeri tek kumanda sayılır
const halfway = controllerInput([{ handedness:'left' }, { handedness:'right', gamepad:{ axes:[0,0,.5,-.8], buttons:[] } }])
assert.deepEqual(halfway, { leftX:0, leftY:-.8, rightX:.5, rightY:-.8, menu:false })
// Menü iki elden de gelir; çubuk okunamasa da çalışır
assert.equal(controllerInput([{ handedness:'left', gamepad:{ axes:[0,0,0,0], buttons:buttons(true) } }, { handedness:'right', gamepad:{ axes:[0,0,0,0], buttons:buttons(false) } }]).menu, true)
assert.equal(controllerInput([{ handedness:'right', gamepad:{ axes:[], buttons:buttons(true) } }]).menu, true)
// Dizi olmayan Iterable (XRInputSourceArray gibi)
assert.equal(controllerInput(new Set([{ handedness:'right', gamepad:{ axes:[0,0,.5,0], buttons:[] } }])).rightX, .5)

console.log('Maket XR mantığı: ölü bölge, yürüme ve kayma, yumuşak dönüş, rig konumları, bilgi başlıkları, çarpışma ve kumanda girdisi başarılı.')
