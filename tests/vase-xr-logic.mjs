import assert from 'node:assert/strict'
import {
  METER, ILLUSTRATIVE_MODEL_LABEL, XR_SEAT_THRESHOLD, XR_TABLE_RADIUS,
  screenThreshold, tableHeight, panelButton, panelText, selectPiece, vaseStage_, vaseRig, xrShelfLayout, snapsIn,
} from '../src/features/workshops/vase/vaseXr.ts'

const near = (a, b, tol = 1e-6) => assert(Math.abs(a - b) <= tol, `${a} ≠ ${b}`)

// Etiketler birebir: başka metin, tarih veya ad eklenmez.
assert.equal(ILLUSTRATIVE_MODEL_LABEL, 'Temsilî model · Tarihî eser değildir')

// Yerleşme kuralı: masaüstü ve VR aynı işlevden geçer, sınır dahil değildir.
assert.equal(snapsIn(XR_SEAT_THRESHOLD - 0.1, XR_SEAT_THRESHOLD), true)
assert.equal(snapsIn(XR_SEAT_THRESHOLD, XR_SEAT_THRESHOLD), false)
assert.equal(screenThreshold(100), 20)
assert.equal(screenThreshold(1000), 34)
near(screenThreshold(500), 27.5)

// Masa yüksekliği: ayakta, oturarak ve aşırı değerlerde sınırda kalır.
near(tableHeight(1.6), 0.75)
assert.equal(tableHeight(1.0), 0.55)
assert.equal(tableHeight(2.2), 0.85)

// Rig: baş hangi yöne baksın, model başlangıcı önde masa yüksekliğinde, kullanıcı -z'ye bakar.
const world = (r, p) => {
  const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
  return [r.x + METER * (p[0] * c + p[2] * s), r.y + METER * p[1], r.z + METER * (-p[0] * s + p[2] * c)]
}
for (const head of [{ x: 0, y: 1.6, z: 0, yaw: 0 }, { x: 0.4, y: 1.7, z: -1.1, yaw: Math.PI / 2 }, { x: -2, y: 1.1, z: 0.5, yaw: -2.3 }]) {
  const r = vaseRig(head)
  const b = world(r, [head.x, head.y, head.z])
  near(b[0], 0); near(b[2], 70)
  near(b[1], METER * (head.y - tableHeight(head.y)))
  const forward = world(r, [head.x - Math.sin(head.yaw), head.y, head.z - Math.cos(head.yaw)])
  near(forward[0] - b[0], 0); near(forward[2] - b[2], -METER)
}

// Raf: GLB'deki gerçek hedefler ve alt paylarıyla sınanır.
const targets = [[8.66, 10.85, 4.95], [-0.04, 10.85, -9.98], [-8.62, 10.85, 5.03], [6.01, 33.17, 3.48], [0.01, 33.17, -6.94], [-6.02, 33.17, 3.46]]
const bottomShares = [10.85, 10.85, 10.85, 13.5, 13.5, 13.5]
const halfWidth = 14.4
const raf = xrShelfLayout(bottomShares, -1.25)
assert.equal(raf.length, 6)
raf.forEach((p, id) => {
  const horizontal = Math.hypot(p[0], p[2])
  assert(horizontal + halfWidth <= XR_TABLE_RADIUS, `parça ${id} tabladan taşıyor: ${horizontal}`)
  near(p[1], bottomShares[id] - 1.25)
  assert(!snapsIn(Math.hypot(p[0] - targets[id][0], p[1] - targets[id][1], p[2] - targets[id][2]), XR_SEAT_THRESHOLD), `parça ${id} başlangıçta yerinde`)
  // Kullanıcı +z'de 70 cm'de, baş 1,6 m; ışın 150 cm uzanır. Rafta kalan parça erişilebilir olmalı.
  assert(Math.hypot(p[0], p[1] - 85, p[2] - 70) < 150, `parça ${id} menzil dışında`)
  raf.forEach((q, j) => {
    if (j > id) assert(Math.hypot(p[0] - q[0], p[2] - q[2]) >= 26, `parça ${id} ve ${j} üst üste`)
  })
})

// Parça seçimi
const candidates = [{ id: 0, center: [0, 0, -100], radius: 15 }, { id: 1, center: [30, 0, -100], radius: 15 }, { id: 2, center: [0, 0, 3], radius: 15 }]
assert.equal(selectPiece([0, 0, 0], [0, 0, -1], candidates, 150), 2, 'değen parça ışından önce gelir')
assert.equal(selectPiece([0, 0, 0], [0, 0, -1], candidates.slice(0, 2), 150), 0, 'ışın ortasından geçen')
assert.equal(selectPiece([27, 0, 0], [0, 0, -1], candidates.slice(0, 2), 150), 1, 'iki aday arasından en yakını')
assert.equal(selectPiece([0, 0, 0], [0, 0, 1], candidates.slice(0, 2), 150), null, 'ışının arkası')
assert.equal(selectPiece([0, 0, 0], [0, 0, -1], candidates.slice(0, 2), 50), null, 'menzil dışı')
assert.equal(selectPiece([0, 50, 0], [0, 0, -1], candidates.slice(0, 2), 150), null, 'ıskalar')
assert.equal(selectPiece([0, 0, 0], [0, 0, -1], [], 150), null)

// Panel düğmeleri: alt sırada iki düğme, aralarındaki boşluk ve üst bölge düğme değil.
assert.equal(panelButton(0.25, 0.19), 0)
assert.equal(panelButton(0.75, 0.19), 1)
assert.equal(panelButton(0.5, 0.19), null)
assert.equal(panelButton(0.25, 0.6), null)
assert.equal(panelButton(0.01, 0.19), null)

// Evre: masaüstünde incelemeye dönülse de onarılmış vazo tamamdır.
assert.equal(vaseStage_(false, 0), 'traceless')
assert.equal(vaseStage_(true, 2), 'repair')
assert.equal(vaseStage_(true, 6), 'done')
assert.equal(vaseStage_(false, 6), 'done')

// Panel metni: her evrede yeniden başlatma ve çıkış var, tarihsel metin yok.
assert.equal(panelText('repair', 2, '').progress, '2/6 parça yerinde')
assert.equal(panelText('repair', 2, 'Deneme').hint, 'Deneme')
assert.equal(panelText('done', 6, 'Deneme').title, 'Vazo onarıldı!')
assert.match(panelText('done', 6, '').hint, /onarım izlerini/)
assert.equal(panelText('traceless', 0, '').buttons[0].ad, 'Vazoyu parçala')
assert.equal(panelText('repair', 2, '').buttons[0].ad, 'Yeniden başlat')
assert.equal(panelText('done', 6, '').buttons[0].ad, 'Yeniden parçala')
for (const phase of ['traceless', 'repair', 'done']) {
  const { buttons, title, hint } = panelText(phase, phase === 'done' ? 6 : 2, '')
  assert.deepEqual(buttons.map((d) => d.id), ['shatter', 'exit'])
  assert.equal(buttons[1].ad, "VR'dan çık")
  assert.doesNotMatch(title + hint, /yazı|kitabe|tarih/i)
}

console.log('Vazo VR saf hesapları geçti.')
