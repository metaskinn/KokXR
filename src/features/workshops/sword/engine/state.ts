// Game scale; not a historical production or temperature simulation.
export const stages = ['Külçe', 'Isıtma', 'Dövme', 'Su verme', 'Bileme', 'Kuşanma', 'İnceleme', 'Test alanı']
export const pieces = ['Guard', 'Hilt_Left', 'Hilt_Right', 'Rivet_1', 'Rivet_2', 'Rivet_3', 'Rivet_4']
export interface Region { p: number; heat: number; skin: number; shell: number }
export interface Game {
  stage: number; regions: Region[]; selected: number; strain: number; burn: number; crack_: boolean
  hardness: number; form: number; attached: number; dip: number; again: boolean; message: string
  target: number; results: string[]; damages: number[]; score: number; rosette: boolean; master: boolean; broke: boolean
}
export const limit = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
export const average = (d: Game, key: keyof Region) => d.regions.reduce((a, b) => a + b[key], 0) / 12
export function firstGame(): Game {
  return { stage: 0, regions: Array.from({ length: 12 }, () => ({ p: 0, heat: 20, skin: 0, shell: 0 })), selected: 0, strain: 0, burn: 0, crack_: false, hardness: 0, form: 1, attached: 0, dip: 0, again: false, message: 'Tezgâhtaki çelik külçesini seç.', target: 0, results: [], damages: [0, 0, 0], score: 0, rosette: false, master: false, broke: false }
}
export function advance(d: Game) { d.stage = Math.min(7, d.stage + 1); d.message = `${stages[d.stage]} aşaması.` }
export function heatUp(d: Game, dt: number, bellows: boolean) {
  for (const b of d.regions) { b.heat = limit(b.heat + dt * (bellows ? 145 : 24), 20, 1200); b.shell = limit(b.shell + dt * .012) }
  if (average(d, 'heat') > 1180) { d.burn = limit(d.burn + dt * .08); d.message = 'Çok sıcak! Yanma kaliteyi düşürüyor.' }
}
export function strike(d: Game, region: number) {
  if (d.stage !== 2 || d.again) return
  d.selected = limit(Math.round(region), 0, 11)
  const b = d.regions[d.selected]
  const effect = b.heat >= 750 && b.heat <= 1150 ? 1 : b.heat >= 550 ? .5 : 0
  b.p = limit(b.p + .34 * effect); b.shell = limit(b.shell - .09)
  if (!effect) { d.strain += .12; d.message = 'Çelik soğuk. Yeniden ısıt; soğuk darbe gerilim oluşturur.' }
  else d.message = `Bölge ${d.selected + 1} · biçim %${Math.round(b.p * 100)}`
  if (d.strain > 1) d.crack_ = true
  d.form = limit(1 - d.strain * .3 - d.burn * .3)
  if (d.regions.every(b => b.p >= .98)) advance(d)
}
export function wrist(d: Game, region: number, dt: number) {
  if (d.stage !== 4) return
  d.selected = limit(Math.round(region), 0, 11)
  const b = d.regions[d.selected]
  b.skin = limit(b.skin + dt * 1.4); b.heat += dt * 110; b.shell = limit(b.shell - dt)
  if (b.heat > 350) { d.burn = limit(d.burn + dt * .1); d.message = 'Aynı bölgede fazla kaldın. Yanma riski; başka bölgeye geç.' }
  if (d.regions.every(b => b.skin >= .98)) advance(d)
}
export function giveWater(d: Game, dt: number) {
  if (d.stage !== 3) return
  if (!d.dip) {
    const t = average(d, 'heat')
    d.hardness = limit(1 - Math.abs(t - 830) / 600 - d.burn * .3)
    if (t > 1050) { d.crack_ = true; d.hardness *= .65 }
  }
  d.dip += dt
  d.regions.forEach(b => { b.heat = Math.max(30, b.heat - dt * 650) })
  if (d.dip >= 1.5) { d.message = 'Su verme tamamlandı.'; advance(d) }
}
export function clink(d: Game) {
  if (d.stage !== 5) return
  d.attached++
  if (d.attached === pieces.length) advance(d)
}
export function masterComplete(d: Game) {
  if (d.stage === 0) advance(d)
  else if (d.stage === 1 || d.again) { d.regions.forEach(b => { b.heat = 900 }); d.again = false; if (d.stage === 1) advance(d) }
  else if (d.stage === 2) { d.regions.forEach(b => { b.p = 1; b.heat = 830 }); d.form = .6; advance(d) }
  else if (d.stage === 3) { d.hardness = .6; d.regions.forEach(b => { b.heat = 30 }); advance(d) }
  else if (d.stage === 4) { d.regions.forEach(b => { b.skin = .6; b.shell = 0 }); advance(d) }
  else if (d.stage === 5) { d.attached = 7; advance(d) }
  else if (d.stage === 6) advance(d)
}
export function quality(d: Game) { return Math.round(100 * limit((d.hardness + average(d, 'skin') + d.form) / 3 - d.burn * .2 - (d.crack_ ? .2 : 0))) }
