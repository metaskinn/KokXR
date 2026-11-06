import assert from 'node:assert/strict'
import { bakisKesiliyor, carpiyor, OYUNCU_YARICAP } from '../src/components/maket/yurumeCarpisma.ts'
import {
  oluBolge, XR_YURUME_HIZI, XR_DONUS_HIZI, yurumeAdimi, yumusakDonus, basCevresindeDon, masaRig, durakRig, kumandaGirdisi, ortusmeyenAci, baslikYeri,
  MASA_Y, MASA_UZAKLIK, MASA_OLCEK_ILK, MASA_OLCEK_MIN, MASA_OLCEK_MAX,
} from '../src/components/maket/xrHareket.ts'
const yakin = (g, b) => { for (const a in b) assert(Math.abs(g[a] - b[a]) < 1e-6, `${a}: ${g[a]} ≠ ${b[a]}`) }

// Sabitler
assert.equal(OYUNCU_YARICAP, 0.45); assert.equal(XR_YURUME_HIZI, 1.6); assert.equal(XR_DONUS_HIZI, Math.PI / 4)
assert.equal(MASA_Y, 0.9); assert.equal(MASA_UZAKLIK, 1.2)
assert.equal(MASA_OLCEK_ILK, 100); assert.equal(MASA_OLCEK_MIN, 40); assert.equal(MASA_OLCEK_MAX, 200)

// Ölü bölge
assert.equal(oluBolge(0.15), 0); assert.equal(oluBolge(-0.1), 0); assert.equal(oluBolge(1), 1); assert.equal(oluBolge(-1), -1)
yakin({ d: oluBolge(0.6) }, { d: 0.5 }); yakin({ d: oluBolge(-0.6) }, { d: -0.5 })

// Yürüme
const serbest = () => false
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, serbest), {x:0, z:0.16})
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 5, serbest), {x:0, z:0.16})   // dt sınırı
yakin(yurumeAdimi({x:0,z:0}, {x:1,z:0}, {x:0,y:0}, 0.1, serbest), {x:0, z:0})
yakin(yurumeAdimi({x:0,z:0}, {x:0.6,z:0.8}, {x:0,y:-1}, 0.1, (x) => x > 0), {x:0, z:0.128}) // duvar boyunca kayar
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0.1,y:-0.15}, 0.1, serbest), {x:0, z:0}) // joystick kayması
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:-1}, {x:1,y:0}, 0.1, serbest), {x:0.16, z:0}) // -z'ye bakarken sağ +x
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:-1}, {x:0,y:1}, 0.1, serbest), {x:0, z:0.16}) // geri
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:3}, {x:0,y:-1}, 0.1, serbest), {x:0, z:0.16}) // yön birim değilse hız aynı
const kose = yurumeAdimi({x:0,z:0}, {x:0,z:-1}, {x:1,y:-1}, 0.1, serbest)
yakin({ h: Math.hypot(kose.x, kose.z) }, { h: 0.16 }) // çapraz daha hızlı değil
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:0}, {x:0,y:-1}, 0.1, serbest), {x:0, z:0}) // yön yoksa ileri hareket de yok
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, () => true), {x:0, z:0}) // her yön kapalı

// Yumuşak dönüş: çubuğun itildiği kadar, saniyede en çok 45°; artı açı sola, sağa itiş sağa döndürür
yakin({ a: yumusakDonus(1, 0.1) }, { a: -Math.PI / 40 })
yakin({ a: yumusakDonus(-1, 0.1) }, { a: Math.PI / 40 })
yakin({ a: yumusakDonus(0.6, 0.1) }, { a: -Math.PI / 80 }) // yarım itiş yarım hız
assert.equal(Math.abs(yumusakDonus(0.15, 0.1)), 0) // joystick kayması döndürmez
yakin({ a: yumusakDonus(1, 5) }, { a: -Math.PI / 40 }) // takılan karede zıplamaz

// Rig
yakin(basCevresindeDon({x:1,z:0}, {x:0,z:0}, Math.PI/2), {x:0, z:-1})
yakin(basCevresindeDon({x:3,z:4}, {x:3,z:4}, 1), {x:3, z:4}) // baş rig'in üstündeyse kımıldamaz
const m = masaRig(0, 100); yakin(m, {x:0, y:-90, z:-120, rotY:Math.PI})
yakin(masaRig(Math.PI/2, 50), {x:60, y:-45, z:0, rotY:Math.PI/2})
const k = durakRig([5,2.7,7], [5,2.7,20], {x:0,z:0}, 1.1); assert.equal(k.x, 5); assert.equal(k.y, 1.1); assert.equal(k.z, 7)
yakin(durakRig([0,0,0], [0,0,-3], {x:0,z:0}, 0), {rotY:0})
yakin(durakRig([0,0,0], [3,0,0], {x:0,z:0}, 0), {rotY:-Math.PI/2}) // ileri (-z) +x'e döner
// Baş rig'in ortasında değilse bile dünyada duraktaki x/z'ye gelir
const r = durakRig([5,2.7,7], [8,2.7,11], {x:0.4,z:-0.3}, 0)
const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
yakin({x: r.x + 0.4*c + -0.3*s, z: r.z - 0.4*s + -0.3*c}, {x:5, z:7})
// Baş rig içinde dönükse dünyada yine durağa bakar: rotY + basYaw = hedef yön; baş yine durakta
for (const basYaw of [Math.PI / 2, -1, 2.5]) {
  const ry = durakRig([5,2.7,7], [8,2.7,11], {x:0.4,z:-0.3}, 0, basYaw)
  const hedef = Math.atan2(-(8-5), -(11-7))
  yakin({ fark: Math.sin(ry.rotY + basYaw - hedef), cos: Math.cos(ry.rotY + basYaw - hedef) }, { fark: 0, cos: 1 })
  const cy = Math.cos(ry.rotY), sy = Math.sin(ry.rotY)
  yakin({x: ry.x + 0.4*cy + -0.3*sy, z: ry.z - 0.4*sy + -0.3*cy}, {x:5, z:7})
}

// Panel yerleşimi: açı artı yönde soldur, kart ve menü örtüşmez
const AYRIM = 0.7
yakin({ a: ortusmeyenAci(0, 2, AYRIM, -1) }, { a: 0 })       // uzakta: istenen yerde kalır
yakin({ a: ortusmeyenAci(0, 0, AYRIM, -1) }, { a: -AYRIM })  // tam üstünde: yon'a kayar
yakin({ a: ortusmeyenAci(0, 0, AYRIM, 1) }, { a: AYRIM })
yakin({ a: ortusmeyenAci(0.1, 0, AYRIM, -1) }, { a: AYRIM }) // baş hangi yana yakınsa o yana
yakin({ a: ortusmeyenAci(-0.1, 0, AYRIM, 1) }, { a: -AYRIM })
yakin({ a: ortusmeyenAci(3.1, -3.1, AYRIM, 1) }, { a: -3.1 - AYRIM }) // ±π sınırında fark doğru hesaplanır
yakin({ a: ortusmeyenAci(0.7, 0, AYRIM, 1) }, { a: 0.7 })    // sınırda kaymaz

// Bilgi başlığı: başa dönük, uzakta büyür, yaklaşınca göz hizasına iner, duvara gömülmez
const by = baslikYeri([0, 12, 0], { x: 0, y: 2.3, z: 20 })
yakin(by, { x: 0, y: 12, z: 0.5, rotY: 0, olcek: 2.4, yatay: 20 }) // +z'deki başa bakar, başa 0.5 çekilir
yakin({ rotY: baslikYeri([0, 5, 0], { x: 3, y: 2.3, z: 0 }).rotY }, { rotY: Math.PI / 2 }) // +x'teki başa bakar
yakin({ y: baslikYeri([0, 12, 0], { x: 0, y: 2, z: 5 }).y }, { y: 7 })   // yarı yolda yarı inmiş
yakin({ y: baslikYeri([0, 12, 0], { x: 0, y: 2, z: 1 }).y }, { y: 4.5 }) // altında en çok çeyreği kalır
yakin({ o: baslikYeri([0, 2, 0], { x: 0, y: 2, z: 1 }).olcek }, { o: 0.6 }) // yakında alt sınır
yakin({ o: baslikYeri([0, 2, 0], { x: 0, y: 2, z: 100 }).olcek }, { o: 2.4 }) // uzakta üst sınır
yakin(baslikYeri([1, 2, 3], { x: 1, y: 2, z: 3 }), { x: 1, z: 3, yatay: 0 }) // tam üstünde: sayı bozulmaz

// Görüş kesilmesi: duvarın ardındaki başlık gösterilmez
const kolon = { x0: 4, x1: 6, z0: -1, z1: 1 }
assert.equal(bakisKesiliyor(0, 0, 10, 0, kolon), true)
assert.equal(bakisKesiliyor(0, 5, 10, 5, kolon), false)
assert.equal(bakisKesiliyor(0, 0, 3, 0, kolon), false) // kolona varmadan biter

// Çarpışma
const y = { sinir:{x0:-10,x1:10,z0:-10,z1:10}, kutular:[{x0:1,x1:2,z0:1,z1:2}], daireler:[{x:-5,z:-5,r:1}], zeminler:[], gorusKesenler:[], gozY:2.7 }
assert.equal(carpiyor(y, 0, 0, .45), false); assert.equal(carpiyor(y, 1.5, 1.5, .45), true)
assert.equal(carpiyor(y, -5, -5, .45), true); assert.equal(carpiyor(y, 9.9, 0, .45), true)
assert.equal(carpiyor(y, 0.6, 1.5, .45), true) // kutuya yarıçap kadar yakın
assert.equal(carpiyor(y, 0.5, 1.5, .45), false)

// Kumanda girdisi
const sifir = { solX:0, solY:0, sagX:0, sagY:0, menu:false }
const dugmeler = (basili) => Array.from({ length: 6 }, (_, i) => ({ pressed: basili && i === 5 }))
assert.deepEqual(kumandaGirdisi([]), sifir)
assert.deepEqual(kumandaGirdisi([{ handedness:'right' }]), sifir) // gamepad yok
assert.deepEqual(kumandaGirdisi([{ handedness:'right', gamepad:{ axes:[.3,.4], buttons:[] } }]), sifir) // axes kısa
// Tek kumandada yana itiş yalnız dönüştür: aynı çubuk hem kaydırıp hem döndürmesin.
const tek = kumandaGirdisi([{ handedness:'right', gamepad:{ axes:[0,0,.5,-.8], buttons:[] } }])
assert.deepEqual(tek, { solX:0, solY:-.8, sagX:.5, sagY:-.8, menu:false })
const iki = kumandaGirdisi([
  { handedness:'left', gamepad:{ axes:[0,0,.1,.2], buttons:dugmeler(false) } },
  { handedness:'right', gamepad:{ axes:[0,0,.3,.4], buttons:dugmeler(false) } },
])
assert.deepEqual(iki, { solX:.1, solY:.2, sagX:.3, sagY:.4, menu:false })
// Çubuğu okunamayan ikinci kumanda varken diğeri tek kumanda sayılır
const yarim = kumandaGirdisi([{ handedness:'left' }, { handedness:'right', gamepad:{ axes:[0,0,.5,-.8], buttons:[] } }])
assert.deepEqual(yarim, { solX:0, solY:-.8, sagX:.5, sagY:-.8, menu:false })
// Menü iki elden de gelir; çubuk okunamasa da çalışır
assert.equal(kumandaGirdisi([{ handedness:'left', gamepad:{ axes:[0,0,0,0], buttons:dugmeler(true) } }, { handedness:'right', gamepad:{ axes:[0,0,0,0], buttons:dugmeler(false) } }]).menu, true)
assert.equal(kumandaGirdisi([{ handedness:'right', gamepad:{ axes:[], buttons:dugmeler(true) } }]).menu, true)
// Dizi olmayan Iterable (XRInputSourceArray gibi)
assert.equal(kumandaGirdisi(new Set([{ handedness:'right', gamepad:{ axes:[0,0,.5,0], buttons:[] } }])).sagX, .5)

console.log('Maket XR mantığı: ölü bölge, yürüme ve kayma, yumuşak dönüş, rig konumları, bilgi başlıkları, çarpışma ve kumanda girdisi başarılı.')
