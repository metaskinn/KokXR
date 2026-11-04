import assert from 'node:assert/strict'
import {
  ALT_YAZI, METRE, TEMSILI_MODEL_ETIKET, XR_OTURMA_ESIGI, XR_TABLA_YARICAP,
  cikisDugmesineMi, ekranEsigi, masaYuksekligi, panelMetni, parcaSec, vazoRigi, xrRafDizilimi, yerineOturur,
} from '../src/components/maket/vazoXr.ts'

const yakin = (a, b, tol = 1e-6) => assert(Math.abs(a - b) <= tol, `${a} ≠ ${b}`)

// Etiketler birebir: başka metin, tarih veya ad eklenmez.
assert.equal(TEMSILI_MODEL_ETIKET, 'Temsilî model · Tarihî eser değildir')
assert.equal(ALT_YAZI, 'Örnek yazı · Tarihî kitabe değildir')

// Yerleşme kuralı: masaüstü ve VR aynı işlevden geçer, sınır dahil değildir.
assert.equal(yerineOturur(XR_OTURMA_ESIGI - 0.1, XR_OTURMA_ESIGI), true)
assert.equal(yerineOturur(XR_OTURMA_ESIGI, XR_OTURMA_ESIGI), false)
assert.equal(ekranEsigi(100), 20)
assert.equal(ekranEsigi(1000), 34)
yakin(ekranEsigi(500), 27.5)

// Masa yüksekliği: ayakta, oturarak ve aşırı değerlerde sınırda kalır.
yakin(masaYuksekligi(1.6), 0.75)
assert.equal(masaYuksekligi(1.0), 0.55)
assert.equal(masaYuksekligi(2.2), 0.85)

// Rig: baş hangi yöne baksın, model başlangıcı önde masa yüksekliğinde, kullanıcı -z'ye bakar.
const dunya = (r, p) => {
  const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
  return [r.x + METRE * (p[0] * c + p[2] * s), r.y + METRE * p[1], r.z + METRE * (-p[0] * s + p[2] * c)]
}
for (const bas of [{ x: 0, y: 1.6, z: 0, yaw: 0 }, { x: 0.4, y: 1.7, z: -1.1, yaw: Math.PI / 2 }, { x: -2, y: 1.1, z: 0.5, yaw: -2.3 }]) {
  const r = vazoRigi(bas)
  const b = dunya(r, [bas.x, bas.y, bas.z])
  yakin(b[0], 0); yakin(b[2], 70)
  yakin(b[1], METRE * (bas.y - masaYuksekligi(bas.y)))
  const ileri = dunya(r, [bas.x - Math.sin(bas.yaw), bas.y, bas.z - Math.cos(bas.yaw)])
  yakin(ileri[0] - b[0], 0); yakin(ileri[2] - b[2], -METRE)
}

// Raf: GLB'deki gerçek hedefler ve alt paylarıyla sınanır.
const hedefler = [[8.66, 10.85, 4.95], [-0.04, 10.85, -9.98], [-8.62, 10.85, 5.03], [6.01, 33.17, 3.48], [0.01, 33.17, -6.94], [-6.02, 33.17, 3.46]]
const altPaylari = [10.85, 10.85, 10.85, 13.5, 13.5, 13.5]
const yarimGenislik = 14.4
const raf = xrRafDizilimi(altPaylari, -1.25)
assert.equal(raf.length, 6)
raf.forEach((p, id) => {
  const yatay = Math.hypot(p[0], p[2])
  assert(yatay + yarimGenislik <= XR_TABLA_YARICAP, `parça ${id} tabladan taşıyor: ${yatay}`)
  yakin(p[1], altPaylari[id] - 1.25)
  assert(!yerineOturur(Math.hypot(p[0] - hedefler[id][0], p[1] - hedefler[id][1], p[2] - hedefler[id][2]), XR_OTURMA_ESIGI), `parça ${id} başlangıçta yerinde`)
  // Kullanıcı +z'de 70 cm'de, baş 1,6 m; ışın 150 cm uzanır. Rafta kalan parça erişilebilir olmalı.
  assert(Math.hypot(p[0], p[1] - 85, p[2] - 70) < 150, `parça ${id} menzil dışında`)
  raf.forEach((q, j) => {
    if (j > id) assert(Math.hypot(p[0] - q[0], p[2] - q[2]) >= 26, `parça ${id} ve ${j} üst üste`)
  })
})

// Parça seçimi
const adaylar = [{ id: 0, merkez: [0, 0, -100], yaricap: 15 }, { id: 1, merkez: [30, 0, -100], yaricap: 15 }, { id: 2, merkez: [0, 0, 3], yaricap: 15 }]
assert.equal(parcaSec([0, 0, 0], [0, 0, -1], adaylar, 150), 2, 'değen parça ışından önce gelir')
assert.equal(parcaSec([0, 0, 0], [0, 0, -1], adaylar.slice(0, 2), 150), 0, 'ışın ortasından geçen')
assert.equal(parcaSec([27, 0, 0], [0, 0, -1], adaylar.slice(0, 2), 150), 1, 'iki aday arasından en yakını')
assert.equal(parcaSec([0, 0, 0], [0, 0, 1], adaylar.slice(0, 2), 150), null, 'ışının arkası')
assert.equal(parcaSec([0, 0, 0], [0, 0, -1], adaylar.slice(0, 2), 50), null, 'menzil dışı')
assert.equal(parcaSec([0, 50, 0], [0, 0, -1], adaylar.slice(0, 2), 150), null, 'ıskalar')
assert.equal(parcaSec([0, 0, 0], [0, 0, -1], [], 150), null)

// Çıkış düğmesi
assert.equal(cikisDugmesineMi(0.5, 0.19), true)
assert.equal(cikisDugmesineMi(0.5, 0.6), false)
assert.equal(cikisDugmesineMi(0.1, 0.19), false)

// Panel metni: bitişte VR'dan çıkmadan alt yazıya yönlendirir.
assert.equal(panelMetni(2, '').ilerleme, '2/6 parça yerinde')
assert.equal(panelMetni(2, 'Deneme').ipucu, 'Deneme')
assert.equal(panelMetni(6, 'Deneme').baslik, 'Vazo onarıldı!')
assert.match(panelMetni(6, '').ipucu, /örnek yazı/)

console.log('Vazo VR saf hesapları geçti.')
