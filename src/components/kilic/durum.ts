// Oyun ölçeği; tarihsel bir üretim veya sıcaklık simülasyonu değildir.
export const asamalar = ['Külçe', 'Isıtma', 'Dövme', 'Su verme', 'Bileme', 'Kuşanma', 'İnceleme', 'Test alanı']
export const parcalar = ['Balcak', 'Kabza_Sol', 'Kabza_Sag', 'Percin_1', 'Percin_2', 'Percin_3', 'Percin_4']
export interface Bolge { p: number; isi: number; cilt: number; kabuk: number }
export interface Oyun {
  asama: number; bolgeler: Bolge[]; secili: number; gerilim: number; yanma: number; catlak: boolean
  sertlik: number; bicim: number; takilan: number; daldirma: number; yeniden: boolean; mesaj: string
  hedef: number; sonuclar: string[]; puan: number; rozet: boolean; usta: boolean; kirildi: boolean
}
export const sinir = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
export const ortalama = (d: Oyun, key: keyof Bolge) => d.bolgeler.reduce((a, b) => a + b[key], 0) / 12
export function ilkOyun(): Oyun {
  return { asama: 0, bolgeler: Array.from({ length: 12 }, () => ({ p: 0, isi: 20, cilt: 0, kabuk: 0 })), secili: 0, gerilim: 0, yanma: 0, catlak: false, sertlik: 0, bicim: 1, takilan: 0, daldirma: 0, yeniden: false, mesaj: 'Tezgâhtaki çelik külçesini seç.', hedef: 0, sonuclar: [], puan: 0, rozet: false, usta: false, kirildi: false }
}
export function ilerle(d: Oyun) { d.asama = Math.min(7, d.asama + 1); d.mesaj = `${asamalar[d.asama]} aşaması.` }
export function isit(d: Oyun, dt: number, koruk: boolean) {
  for (const b of d.bolgeler) { b.isi = sinir(b.isi + dt * (koruk ? 145 : 24), 20, 1200); b.kabuk = sinir(b.kabuk + dt * .012) }
  if (ortalama(d, 'isi') > 1180) { d.yanma = sinir(d.yanma + dt * .08); d.mesaj = 'Çok sıcak! Yanma kaliteyi düşürüyor.' }
}
export function vur(d: Oyun, bolge: number) {
  if (d.asama !== 2 || d.yeniden) return
  d.secili = sinir(Math.round(bolge), 0, 11)
  const b = d.bolgeler[d.secili]
  const etki = b.isi >= 750 && b.isi <= 1150 ? 1 : b.isi >= 550 ? .5 : 0
  b.p = sinir(b.p + .34 * etki); b.kabuk = sinir(b.kabuk - .09)
  if (!etki) { d.gerilim += .12; d.mesaj = 'Çelik soğuk. Yeniden ısıt; soğuk darbe gerilim oluşturur.' }
  else d.mesaj = `Bölge ${d.secili + 1} · biçim %${Math.round(b.p * 100)}`
  if (d.gerilim > 1) d.catlak = true
  d.bicim = sinir(1 - d.gerilim * .3 - d.yanma * .3)
  if (d.bolgeler.every(b => b.p >= .98)) ilerle(d)
}
export function bile(d: Oyun, bolge: number, dt: number) {
  if (d.asama !== 4) return
  d.secili = sinir(Math.round(bolge), 0, 11)
  const b = d.bolgeler[d.secili]
  b.cilt = sinir(b.cilt + dt * 1.4); b.isi += dt * 110; b.kabuk = sinir(b.kabuk - dt)
  if (b.isi > 350) { d.yanma = sinir(d.yanma + dt * .1); d.mesaj = 'Aynı bölgede fazla kaldın. Yanma riski; başka bölgeye geç.' }
  if (d.bolgeler.every(b => b.cilt >= .98)) ilerle(d)
}
export function suVer(d: Oyun, dt: number) {
  if (d.asama !== 3) return
  if (!d.daldirma) {
    const t = ortalama(d, 'isi')
    d.sertlik = sinir(1 - Math.abs(t - 830) / 600 - d.yanma * .3)
    if (t > 1050) { d.catlak = true; d.sertlik *= .65 }
  }
  d.daldirma += dt
  d.bolgeler.forEach(b => { b.isi = Math.max(30, b.isi - dt * 650) })
  if (d.daldirma >= 1.5) { d.mesaj = 'Su verme tamamlandı.'; ilerle(d) }
}
export function tak(d: Oyun) {
  if (d.asama !== 5) return
  d.takilan++
  if (d.takilan === parcalar.length) ilerle(d)
}
export function ustaTamamla(d: Oyun) {
  if (d.asama === 0) ilerle(d)
  else if (d.asama === 1 || d.yeniden) { d.bolgeler.forEach(b => { b.isi = 900 }); d.yeniden = false; if (d.asama === 1) ilerle(d) }
  else if (d.asama === 2) { d.bolgeler.forEach(b => { b.p = 1; b.isi = 830 }); d.bicim = .6; ilerle(d) }
  else if (d.asama === 3) { d.sertlik = .6; d.bolgeler.forEach(b => { b.isi = 30 }); ilerle(d) }
  else if (d.asama === 4) { d.bolgeler.forEach(b => { b.cilt = .6; b.kabuk = 0 }); ilerle(d) }
  else if (d.asama === 5) { d.takilan = 7; ilerle(d) }
  else if (d.asama === 6) ilerle(d)
}
export function kalite(d: Oyun) { return Math.round(100 * sinir((d.sertlik + ortalama(d, 'cilt') + d.bicim) / 3 - d.yanma * .2 - (d.catlak ? .2 : 0))) }
