// Kılıç VR'ının saf hesapları ve panel içeriği. Çalıştırma: node tests/kilic-xr-mantik.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ilkOyun, ustaTamamla, asamalar } from '../src/components/kilic/durum.ts'
import { kesimHesapla } from '../src/components/kilic/test.ts'
import { kilicTanitim, kilicKaynaklari, kilicParcaNotlari } from '../src/data/kilic.ts'
import {
  istasyon, istasyonRig, OTURMA_GOZ, aciFark, panelGeriGelsin, isinEksenX, enYakinBolge, duzlemX, bileAdim, cekicSalinimi, CekicOlcer,
  SavurmaOlcer, savurmaKesimi, SAVURMA_TOLERANS, parcaOturur, PARCA_OTURMA_ESIGI, panelDurumu, bilgiDurumu, panelYerlesim, panelKare, PANEL_G, PANEL_Y,
} from '../src/components/kilic/xrHesap.ts'

const yakin = (a, b, e = 1e-6) => assert(Math.abs(a - b) < e, `${a} ≠ ${b}`)

// --- istasyon: rig uygulanınca baş istasyona gelir, bakış hedefe döner; baş odada nerede ve nereye bakarsa baksın
for (const asama of [0, 1, 2, 3, 4, 5, 6, 7]) for (const hedef of [0, 1, 2]) for (const bas of [{ x: 0, y: 1.6, z: 0, yaw: 0 }, { x: .7, y: 1.7, z: -.4, yaw: 1.2 }, { x: -.3, y: 1.5, z: .9, yaw: -2.6 }]) {
  const ist = istasyon({ asama, hedef, yeniden: false }), r = istasyonRig(ist, bas)
  const c = Math.cos(r.rotY), s = Math.sin(r.rotY)
  yakin(r.x + bas.x * c + bas.z * s, ist.x); yakin(r.z - bas.x * s + bas.z * c, ist.z)
  const dunyaYaw = r.rotY + bas.yaw, ileriX = -Math.sin(dunyaYaw), ileriZ = -Math.cos(dunyaYaw), l = Math.hypot(ist.bakX - ist.x, ist.bakZ - ist.z)
  yakin(ileriX, (ist.bakX - ist.x) / l); yakin(ileriZ, (ist.bakZ - ist.z) / l)
  assert.equal(r.y, 0, 'ayaktaki kullanıcı kaldırılmamalı')
}
yakin(istasyonRig(istasyon({ asama: 2, hedef: 0, yeniden: false }), { x: 0, y: 1.05, z: 0, yaw: 0 }).y + 1.05, OTURMA_GOZ)
assert.deepEqual(istasyon({ asama: 2, hedef: 0, yeniden: true }), istasyon({ asama: 1, hedef: 0, yeniden: false }), 'yeniden ısıtma ocağa götürür')
// Asıl nesne elle veya kısa ışınla erişilecek yerde: sahnedeki sabit nesne konumları (kilic-atolye.glb).
for (const [a, x, z] of [[0, 2.8, -2.5], [1, -3.7, -1.75], [1, -2.25, -1.45], [2, 0, -.1], [3, 1.95, .15], [4, 3.05, -1.2], [5, 2.45, -2.45], [6, .42, 0]]) {
  const i = istasyon({ asama: a, hedef: 0, yeniden: false }), u = Math.hypot(i.x - x, i.z - z)
  assert(u <= 1.1, `aşama ${a} nesnesi ${u.toFixed(2)} m uzakta`)
}
// Odaların içinde: oda x ±4.25, z -3.05..4; avlu x 9.5..18.5.
for (let a = 0; a < 7; a++) { const i = istasyon({ asama: a, hedef: 0, yeniden: false }); assert(Math.abs(i.x) < 4.2 && i.z > -3 && i.z < 3.9, `aşama ${a} oda dışında`) }
for (let h = 0; h < 3; h++) { const i = istasyon({ asama: 7, hedef: h, yeniden: false }); assert(i.x > 9.6 && i.x < 18.4) }

// --- panelin geri gelmesi
yakin(aciFark(3.1, -3.1), 6.2 - 2 * Math.PI)
let g = panelGeriGelsin(0, .5, 0, .1); assert(!g.gelsin); assert.equal(g.sure, 0)
g = panelGeriGelsin(2.5, .5, 0, .6); assert(!g.gelsin); g = panelGeriGelsin(2.5, .5, g.sure, .7); assert(g.gelsin); assert.equal(g.sure, 0)

// --- ışın ve namlu
let h = isinEksenX({ x: .5, y: .3, z: 1 }, { x: 0, y: 0, z: -1 }, 1); yakin(h.x, .5); yakin(h.uzaklik, .3)
h = isinEksenX({ x: .5, y: 0, z: 1 }, { x: .6, y: 0, z: -.8 }, 1.06); yakin(h.x, 1.06); assert(h.uzaklik > 0)
h = isinEksenX({ x: .5, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }, 1); yakin(h.uzaklik, 1, 1e-6) // geriye bakan ışın
assert.equal(enYakinBolge([.1, .2, .3], .26), 2); assert.equal(enYakinBolge([.1, .2, .3], -1), 0)
yakin(duzlemX({ x: 1, y: 0, z: 2 }, { x: .5, y: 0, z: -1 }, 0), 2); assert.equal(duzlemX({ x: 1, y: 0, z: 2 }, { x: 0, y: 0, z: 1 }, 0), null); assert.equal(duzlemX({ x: 1, y: 0, z: 2 }, { x: 1, y: 0, z: 0 }, 0), null)
yakin(bileAdim(.5, .106), .4); yakin(bileAdim(.5, -.106), .6); yakin(bileAdim(.01, 1), 0); yakin(bileAdim(.5, 5), .5 - .2 / 1.06)

// --- çekiç salınımı: bir inişte bir vuruş
let c = cekicSalinimi(-2.5, true); assert(c.vur); assert(!c.silahli)
c = cekicSalinimi(-2.5, c.silahli); assert(!c.vur); c = cekicSalinimi(-.2, c.silahli); assert(!c.vur); assert(c.silahli); assert(cekicSalinimi(-2, c.silahli).vur)
assert(!cekicSalinimi(2.5, true).vur, 'kaldırmak vurmaz')

// Geride kalan hedef, öteki el, takip kaybı ve duraklama darbe üretmez.
const cekic = new CekicOlcer(), digerEl = new CekicOlcer()
assert.equal(cekic.adim(1.4, .02, 4), null)
assert.equal(cekic.adim(1.3, .02, null), 4, 'inişte kısa süre önce nişanlanan bölge vurulur')
assert.equal(cekic.adim(1.2, .02, null), null, 'tek inişte ikinci darbe yok')
digerEl.adim(1.4, .02, null)
assert.equal(digerEl.adim(1.2, .02, null), null, 'öteki elin nişanı kullanılamaz')
cekic.adim(1.4, .02, 4)
for (let i = 0; i < 12; i++) cekic.adim(1.4, .02, null)
assert.equal(cekic.adim(1.2, .02, null), null, 'eski hedefe hayalet darbe yok')
cekic.sifirla(); assert.equal(cekic.adim(.3, .02, 4), null, 'takip/rig değişiminden sonraki ilk poz darbe sayılmaz')
assert.equal(cekic.adim(-.1, .3, 4), null, 'uzun kare aralığı darbe sayılmaz')
assert.equal(cekic.adim(.3, .02, 4), null)
cekic.tetikle(); assert.equal(cekic.adim(.2, .02, 4), null, 'tetik ve aynı iniş iki darbe üretmez')

// --- kuşanma: yakınsa oturur; bekleme yerinde (masaüstü sahnesindeki +12 cm, +14 cm) tutup bırakmak yetmez
assert(parcaOturur(.05)); assert(!parcaOturur(PARCA_OTURMA_ESIGI)); assert(!parcaOturur(Math.hypot(.12, .14)))

// --- savurma
const dt = 1 / 72
function savur(o, yol) { const s = []; for (const p of yol) { const r = o.adim(p, dt); if (r) s.push(r) } return s }
const dur = n => Array.from({ length: n }, () => ({ x: 12, y: 1.3, z: .2 }))
const kayma = (n, hiz, x0 = 12) => Array.from({ length: n }, (_, i) => ({ x: x0 + hiz * dt * i, y: 1.3, z: .2 }))
let o = new SavurmaOlcer(); assert.equal(savur(o, dur(20)).length, 0, 'duran kol savurma sayılmaz')
assert.equal(savur(new SavurmaOlcer(), kayma(30, .8)).length, 0, 'yavaş kol savurma sayılmaz')
o = new SavurmaOlcer(); let s = savur(o, [...kayma(1, 0), ...kayma(14, 3), ...Array.from({ length: 4 }, () => ({ x: 12 + 3 * dt * 13, y: 1.3, z: .2 }))])
assert.equal(s.length, 1); assert(s[0].b.x > s[0].a.x + .4); assert(s[0].sure > .1 && s[0].sure < .4)
assert(!o.suruyor)
// Kısa sarsıntı ve art arda vuruş bekleme süresi
o = new SavurmaOlcer(); assert.equal(savur(o, [{ x: 0, y: 1, z: 0 }, { x: .03, y: 1, z: 0 }, { x: .03, y: 1, z: 0 }, { x: .03, y: 1, z: 0 }]).length, 0, 'kısa sarsıntı')
o = new SavurmaOlcer(); s = savur(o, kayma(50, 4)); assert.equal(s.length, 1, 'çok uzun savurma süre sınırında biter; bekleme içinde yenisi başlamaz')
o.sifirla(); assert.equal(o.adim({ x: 0, y: 0, z: 0 }, dt), null)

// --- savurma → kesim çizgisi ve kesimHesapla girdileri
const rulo = { minX: 11.9, maxX: 12.1, minY: .6, maxY: 1.55, z: 0 }
let k = savurmaKesimi({ a: { x: 11.7, y: 1.2, z: .4 }, b: { x: 12.4, y: 1.1, z: .4 }, sure: .2 }, rulo)
yakin(k.a.z, 0); yakin(k.a.y, 1.2); yakin(k.a.x, 11.7); assert(k.yakin, 'rulodan geçen çizgi kaydırılmaz')
yakin(k.dx, .7 / 2.5); yakin(k.dy, .1 / 2.5)
const hiz = Math.hypot(k.dx, k.dy) / k.sure; assert(hiz > 1 && hiz < 2, `hız ${hiz}`)
k = savurmaKesimi({ a: { x: 12.3, y: 1.2, z: .4 }, b: { x: 13, y: 1.1, z: .4 }, sure: .2 }, rulo)
assert(k.yakin); assert(k.a.x <= 12.1 + 1e-9, 'yakın çizgi hedefe çekilir'); yakin(k.b.x - k.a.x, .7)
k = savurmaKesimi({ a: { x: 11.6, y: 2.4, z: .4 }, b: { x: 12.4, y: 2.4, z: .4 }, sure: .2 }, rulo)
assert(!k.yakin); yakin(k.a.y, 2.4); assert(2.4 - 1.55 > SAVURMA_TOLERANS)
k = savurmaKesimi({ a: { x: 14, y: 1.5, z: .4 }, b: { x: 14, y: .95, z: .4 }, sure: .2 }, { minX: 13.6, maxX: 14.4, minY: .62, maxY: .86, z: -.1 })
assert(k.yakin); assert(k.b.y <= .86 + 1e-9, 'yukarıdan inen kesim kütüğe değer'); assert(k.dy > 0, 'ekran Y aşağı doğru artıdır')
// Çevrilen girdi kesimHesapla'nın hız eşiklerini (hiz > .7) gerçek bir savuruşta aşar
const dHiz = Object.assign(ilkOyun(), { asama: 7 }); kesimHesapla(dHiz, k.dx, k.dy, k.sure)
assert.equal(dHiz.kirildi, false)

// --- panel içeriği: her aşamada usta, baştan, çık; yerleşim taşmaz; isabet doğru
for (let a = 0; a < 8; a++) for (const not of [null, 3]) {
  const d = ilkOyun(); for (let i = 0; i < a; i++) ustaTamamla(d)
  assert.equal(d.asama, a)
  const p = panelDurumu(d, { reheat: false, not })
  assert.equal(p.baslik, asamalar[a]); assert.deepEqual(p.ortak.map(b => b.id), ['komut:usta', 'komut:bastan', 'cik']); assert.equal(p.ortak[0].ad, 'Ustaya bırak')
  assert.equal(p.ortak[2].ad, "VR'dan çık"); assert(p.yonerge.length < 180, `aşama ${a} yönergesi uzun`)
  const y = panelYerlesim(p)
  // Üstte başlık, yönerge, mesaj (≈285 px); ölçü ve kalite için en az bu kadar kalmalı.
  const gereken = 285 + (p.isi ? 58 : 0) + (p.ilerleme ? 44 : 0) + (p.kalite ? 116 : 0)
  assert(y.icerikAlt >= gereken, `aşama ${a}: içerik ${gereken} px, yer ${y.icerikAlt} px`)
  for (const q of y.kareler) {
    assert(q.x >= 0 && q.x + q.g <= PANEL_G && q.y >= 0 && q.y2 <= PANEL_Y, `aşama ${a} ${q.id} taştı`)
    assert.equal(panelKare(y.kareler, (q.x + q.g / 2) / PANEL_G, 1 - (q.y + q.y2) / 2 / PANEL_Y)?.id, q.id)
    for (const r of y.kareler) if (r !== q) assert(q.x + q.g <= r.x || r.x + r.g <= q.x || q.y2 <= r.y || r.y2 <= q.y, `${q.id} ve ${r.id} üst üste`)
  }
  assert.equal(panelKare(y.kareler, .5, .999), null, 'başlığa isabet yok')
  // Dürüstlük notu her aşamada ve her not açıkken değişmeden durur.
  const b = bilgiDurumu(a, not); assert.equal(b.durustluk, kilicTanitim.durustluk); assert(b.kaynak.startsWith('Kaynak: ')); assert(Object.values(kilicKaynaklari).some(v => b.kaynak.endsWith(v)))
}
assert.equal(bilgiDurumu(6, 3).baslik, kilicParcaNotlari[3].baslik); assert.equal(bilgiDurumu(5, 3).baslik, 'Atölye notu')

const dA = ilkOyun()
assert.deepEqual(panelDurumu(dA, { reheat: false, not: null }).dugmeler.map(b => b.id), ['komut:al'])
ustaTamamla(dA); dA.bolgeler.forEach(b => { b.isi = 100 })
let p = panelDurumu(dA, { reheat: false, not: null }); assert(p.dugmeler.find(b => b.id === 'komut:devam').pasif); assert(p.dugmeler.find(b => b.id === 'tut:koruk').tut)
dA.bolgeler.forEach(b => { b.isi = 800 }); assert(!panelDurumu(dA, { reheat: false, not: null }).dugmeler.find(b => b.id === 'komut:devam').pasif)
ustaTamamla(dA); p = panelDurumu(dA, { reheat: false, not: null }); assert.equal(p.bolgeler.oran.length, 12); assert(p.dugmeler.some(b => b.id === 'komut:yeniden'))
dA.yeniden = true; p = panelDurumu(dA, { reheat: false, not: null }); assert(!p.bolgeler); assert(p.dugmeler.some(b => b.id === 'tut:koruk'))
dA.yeniden = false; dA.usta = true; p = panelDurumu(dA, { reheat: false, not: null }); assert(p.dugmeler.every(b => b.pasif)); assert(p.ortak[0].pasif); assert(!p.ortak[1].pasif)
const d7 = ilkOyun(); for (let i = 0; i < 7; i++) ustaTamamla(d7); d7.hasarlar = [.5, 0, 0]; d7.kirildi = true
p = panelDurumu(d7, { reheat: false, not: null }); assert(p.dugmeler[0].ad.includes('hasar %50')); assert(p.dugmeler.find(b => b.id === 'komut:kes').pasif); assert(p.kalite.notlar.some(n => n.startsWith('Kesim puanı')))

// --- Yasak ifadeler: yazdığımız VR metinleri (data/kilic.ts dışı) tarihsel iddia ve abartı içermez.
for (const dosya of ['xrHesap.ts', 'xrPanel.ts', 'xrOturum.ts']) {
  const metin = readFileSync(new URL(`../src/components/kilic/${dosya}`, import.meta.url), 'utf8')
  for (const yasak of [/birebir/i, /gerçek kılıç/i, /dijital ikiz/i, /XRControllerModelFactory/]) assert(!yasak.test(metin), `${dosya}: ${yasak}`)
}
console.log('Kılıç VR hesapları: istasyon, panel dönüşü, ışın, bileme, çekiç, savurma, kesim girdileri, panel içeriği ve yerleşimi başarılı.')
