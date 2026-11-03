import assert from 'node:assert/strict'
import { ilkOyun, vur, isit, suVer, bile, ustaTamamla, ortalama } from '../src/components/kilic/durum.ts'
import { kesimHesapla } from '../src/components/kilic/test.ts'
let d = ilkOyun(); d.asama = 2
for (let i = 0; i < 10; i++) vur(d, 0)
assert.equal(d.bolgeler[0].p, 0); assert(d.catlak); assert(d.gerilim > 1)
d = ilkOyun(); d.asama = 2; d.bolgeler.forEach(b => { b.isi = 650 }); vur(d, 0); assert.equal(d.bolgeler[0].p, .17)
d.bolgeler.forEach(b => { b.isi = 900 }); vur(d, 1); assert.equal(d.bolgeler[1].p, .34)
for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) vur(d, i)
assert.equal(d.asama, 3); assert.equal(ortalama(d, 'p'), 1)
for (const [heat, expect] of [[830, 1], [200, 0], [1150, .31]]) {
  d = ilkOyun(); d.asama = 3; d.bolgeler.forEach(b => { b.isi = heat }); suVer(d, .5); suVer(d, 1.1)
  assert.equal(d.asama, 4); assert(Math.abs(d.sertlik - expect) < .01); if (heat > 1050) assert(d.catlak)
}
d = ilkOyun(); isit(d, 10, true); assert.equal(ortalama(d, 'isi'), 1200); assert(d.yanma > 0)
d = ilkOyun(); d.asama = 4; for (let i = 0; i < 12; i++) bile(d, i, .72); assert.equal(d.asama, 5)
d = ilkOyun(); d.asama = 4; for (let i = 0; i < 40; i++) bile(d, 0, .2); assert(d.yanma > 0)
d = ilkOyun(); for (let i = 0; i < 7; i++) ustaTamamla(d); assert.equal(d.asama, 7); assert.equal(d.takilan, 7); assert.equal(d.sertlik, .6); assert(Math.abs(ortalama(d, 'cilt') - .6) < .001)
assert(kesimHesapla(d, 1, 0, .2).kesildi); d.hedef = 1; assert.equal(kesimHesapla(d, 1, 0, .2).kesildi, false); d.hedef = 2; assert.equal(kesimHesapla(d, .1, .1, 2).kesildi, false)
d.bolgeler.forEach(b => { b.cilt = 1 }); d.sertlik = 1; assert(kesimHesapla(d, 1, 0, .2).kesildi); d.catlak = true; d.hedef = 1; assert(kesimHesapla(d, 1, 0, .2).kirildi)
console.log('Kılıç mantığı: sıcak/soğuk darbe, 12 bölge, su verme, yanma, bileme, usta ve üç hedef başarılı.')
