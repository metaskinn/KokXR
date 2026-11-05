import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DURUM_DUGMELERI, PANO_GENISLIK, PANO_Y, PANO_Z, TEPSI_OLCEK,
  donusAcisi, dondur, durumMetni, enYakinYuva, hucreOlcusu, karistir, panoIzdusumu, parcaHucresi, parcaUv, tamamMi, tepsiKonumu, yonler, yuvaMerkezi, yuvayaKoy,
} from '../src/components/restorasyon/kurallar.ts'

const yakin = (a, b, tol = 1e-9) => assert(Math.abs(a - b) <= tol, `${a} ≠ ${b}`)
const coz = (adet) => Array.from({ length: adet }, (_, id) => ({ id, yuva: id, donus: 0 }))

// Modül three ve DOM'a bağlı değil.
const kaynak = readFileSync(new URL('../src/components/restorasyon/kurallar.ts', import.meta.url), 'utf8')
assert.ok(!/^\s*import\s/m.test(kaynak), 'kurallar.ts bağımlılıksız olmalı')

// Karıştırma: hepsi yuvasız, hiçbiri düz değil, tüm kimlikler bir kez.
for (let tur = 0; tur < 50; tur++) {
  const p = karistir(8)
  assert.deepEqual(p.map((x) => x.id).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7])
  assert.ok(p.every((x) => x.yuva === null && x.donus >= 1 && x.donus <= 3))
  assert.equal(tamamMi(p), false)
}
// Rastgele üreteci uçlarda da sınır dışına çıkmaz.
assert.ok(karistir(8, () => 0.999999).every((x) => x.donus === 3))
assert.ok(karistir(8, () => 0).every((x) => x.donus === 1))
// Sıra gerçekten karışır: masaüstü tepsisi de VR tepsisi de bu sırayı kullanır.
assert.notDeepEqual(karistir(8, () => 0).map((x) => x.id), [0, 1, 2, 3, 4, 5, 6, 7])

// Bitiş: yer ve yön birlikte.
assert.equal(tamamMi(coz(8)), true)
assert.equal(tamamMi(coz(8).map((p) => p.id === 3 ? { ...p, donus: 1 } : p)), false, 'dönük parça')
const iki = coz(8); iki[0].yuva = 1; iki[1].yuva = 0
assert.equal(tamamMi(iki), false, 'yer değişmiş parçalar')
assert.equal(tamamMi(coz(8).map((p) => p.id === 3 ? { ...p, yuva: null } : p)), false, 'tepsideki parça')

// Yerleştirme: masaüstündeki yer değiştirme kuralı.
const bas = [{ id: 0, yuva: null, donus: 1 }, { id: 1, yuva: 2, donus: 0 }, { id: 2, yuva: 5, donus: 2 }]
const dondu = JSON.stringify(bas)
let s = yuvayaKoy(bas, 0, 3)
assert.deepEqual(s[0], { id: 0, yuva: 3, donus: 1 })
assert.equal(JSON.stringify(bas), dondu, 'girdi değişmemeli')
s = yuvayaKoy(bas, 0, 2) // tepsiden dolu yuvaya: oradaki tepsiye iner
assert.equal(s[0].yuva, 2); assert.equal(s[1].yuva, null)
s = yuvayaKoy(bas, 1, 5) // yuvadan dolu yuvaya: yer değiştirir, yönler korunur
assert.deepEqual(s[1], { id: 1, yuva: 5, donus: 0 }); assert.deepEqual(s[2], { id: 2, yuva: 2, donus: 2 })
s = yuvayaKoy(bas, 1, 2) // aynı yuvaya bırakmak: hiçbir şey değişmez
assert.deepEqual(s, bas)

// Döndürme: dört kez başa döner, başkasına dokunmaz.
s = bas
for (const beklenen of [2, 3, 0, 1]) { s = dondur(s, 0); assert.equal(s[0].donus, beklenen) }
assert.deepEqual(s[1], bas[1])
assert.equal(yonler.length, 4)

// Hücreler ve kesitler: satır 0 görselin üstü.
assert.deepEqual(parcaHucresi(0, 4), { sutun: 0, satir: 0 })
assert.deepEqual(parcaHucresi(5, 4), { sutun: 1, satir: 1 })
assert.deepEqual(parcaUv(0, 4, 2), { u0: 0, u1: 0.25, v0: 0.5, v1: 1 })
assert.deepEqual(parcaUv(7, 4, 2), { u0: 0.75, u1: 1, v0: 0, v1: 0.5 })
// Kesitler görseli boşluksuz ve örtüşmesiz kaplar.
let alan = 0
for (let id = 0; id < 12; id++) { const u = parcaUv(id, 4, 3); alan += (u.u1 - u.u0) * (u.v1 - u.v0) }
yakin(alan, 1)

// Muradiye: 1200×600 görsel, 4×2: kare hücreler.
const [S, Y, O] = [4, 2, 2]
const h = hucreOlcusu(S, Y, O)
yakin(h.en, 0.25); yakin(h.boy, 0.25)
assert.deepEqual(yuvaMerkezi(0, S, Y, O), [-0.375, PANO_Y + 0.125])
assert.deepEqual(yuvaMerkezi(7, S, Y, O), [0.375, PANO_Y - 0.125])
// Yuvalar panonun içinde, başka düzende de simetrik.
for (const [a, b, c] of [[4, 2, 2], [3, 3, 1], [5, 2, 1.5], [1, 1, 2]]) {
  const o = hucreOlcusu(a, b, c)
  let tx = 0, ty = 0
  for (let i = 0; i < a * b; i++) {
    const [x, y] = yuvaMerkezi(i, a, b, c)
    assert.ok(Math.abs(x) <= PANO_GENISLIK / 2 - o.en / 2 + 1e-9)
    tx += x; ty += y - PANO_Y
  }
  yakin(tx, 0); yakin(ty, 0)
  // Her yuvanın merkezi kendi yuvasına düşer.
  for (let i = 0; i < a * b; i++) assert.equal(enYakinYuva(...yuvaMerkezi(i, a, b, c), a, b, c), i)
}

// En yakın yuva: sınır komşuya geçmez, panonun çok dışı reddedilir.
const [m0x, m0y] = yuvaMerkezi(0, S, Y, O)
assert.equal(enYakinYuva(m0x + 0.12, m0y, S, Y, O), 0)
assert.equal(enYakinYuva(m0x + 0.13, m0y, S, Y, O), 1)
assert.equal(enYakinYuva(m0x - 0.2, m0y, S, Y, O), 0, 'kenar payı içinde')
assert.equal(enYakinYuva(m0x - 0.26, m0y, S, Y, O), null, 'panonun solu')
assert.equal(enYakinYuva(0, PANO_Y + 0.5, S, Y, O), null, 'panonun üstü')

// Tepsi: panoyu örtmez, parçalar çakışmaz.
const panoAlt = PANO_Y - 0.25, panoAltAcisi = panoAlt / -PANO_Z
const tepsi = Array.from({ length: 8 }, (_, i) => tepsiKonumu(i, S, Y, O))
for (const [i, [x, y, z]] of tepsi.entries()) {
  assert.ok(z > PANO_Z, 'tepsi panodan yakın')
  assert.ok((y + h.boy * TEPSI_OLCEK / 2) / -z < panoAltAcisi, `tepsi ${i} panoyu örtüyor`)
  // Tepsiye bırakılan parça yuvaya oturmaz: eski yerine döner.
  assert.equal(enYakinYuva(...panoIzdusumu([0, 0, 0], [x, y, z]), S, Y, O), null, `tepsi ${i} yuvaya düştü`)
  for (const [j, [a, b]] of tepsi.entries()) if (j > i) assert.ok(Math.hypot(a - x, b - y) >= h.en * TEPSI_OLCEK, `tepsi ${i} ve ${j} çakışıyor`)
}

// İzdüşüm: başa yakın tutulan parça, göründüğü yuvaya gider.
const hedef = yuvaMerkezi(6, S, Y, O)
const yarida = [hedef[0] / 2, hedef[1] / 2, PANO_Z / 2]
const iz = panoIzdusumu([0, 0, 0], yarida)
yakin(iz[0], hedef[0]); yakin(iz[1], hedef[1])
assert.equal(enYakinYuva(...iz, S, Y, O), 6)
assert.deepEqual(panoIzdusumu([0.3, 0.1, 0], [0.5, 0.2, PANO_Z]), [0.5, 0.2]) // Düzlemdeki parça olduğu yerde
assert.equal(panoIzdusumu([0, 0, 0], [0, 0, 0.1]), null, 'başın arkası')
assert.equal(panoIzdusumu([0, 0, 0], [0.5, 0, 0]), null, 'başın yanı')

// Yön: masaüstündeki CSS rotate gibi saat yönü (z açısı eksi).
assert.equal(donusAcisi(0) === 0, true)
yakin(donusAcisi(1), -Math.PI / 2)
yakin(donusAcisi(3), -3 * Math.PI / 2)

// Panel metni.
let m = durumMetni({ parcalar: karistir(8), hamle: 0, tutuyor: false, sonuc: '' })
assert.equal(m.ilerleme, 'Tahtada 0/8 · Hamle: 0')
assert.match(m.ipucu, /yan tuş/)
assert.deepEqual(m.dugmeler.map((d) => d.id), DURUM_DUGMELERI.map((d) => d.id))
assert.deepEqual(DURUM_DUGMELERI.map((d) => d.id), ['basla', 'cik'])
assert.match(durumMetni({ parcalar: karistir(8), hamle: 0, tutuyor: true, sonuc: '' }).ipucu, /Tetikle 90°/)
assert.equal(durumMetni({ parcalar: karistir(8), hamle: 1, tutuyor: true, sonuc: 'Sonuç.' }).ipucu, 'Sonuç.')
m = durumMetni({ parcalar: coz(8).map((p) => ({ ...p, donus: 1 })), hamle: 9, tutuyor: false, sonuc: '' })
assert.equal(m.ilerleme, 'Tahtada 8/8 · Hamle: 9')
assert.match(m.ipucu, /düzelt/)
m = durumMetni({ parcalar: coz(8), hamle: 12, tutuyor: false, sonuc: 'eski' })
assert.equal(m.baslik, 'Pano onarıldı!')
assert.match(m.ilerleme, /Restoratör/)
assert.match(m.ipucu, /12 hamle/)

console.log('Restorasyon kuralları: tüm denetimler geçti.')
