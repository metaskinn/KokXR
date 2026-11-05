// Çini tabağın deseni: uygulama için çizilmiş özgün bir lale-yaprak düzeni; belirli bir tarihî eserin kopyası değildir.
// Koordinatlar tabak yarıçapına göredir: merkez (0, 0), kenar 1.
export type N = [number, number]
export type Tur = 'lale' | 'yaprak' | 'merkez' | 'halka'
export interface Bolge { tur: Tur; dis: N[]; ic?: N[] }

function egri(a: N, b: N, c: N, d: N, adim = 14): N[] {
  const o: N[] = []
  for (let i = 0; i < adim; i++) {
    const t = i / adim, u = 1 - t
    o.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]])
  }
  return o
}
const aynala = (p: N[]): N[] => p.slice(1).reverse().map(([x, y]) => [-x, y])
function daire(r: number, adim = 72): N[] {
  return Array.from({ length: adim }, (_, i) => { const a = (i / adim) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r] as N })
}
export const dondur = (p: N[], aci: number): N[] => {
  const c = Math.cos(aci), s = Math.sin(aci)
  return p.map(([x, y]) => [x * c - y * s, x * s + y * c])
}

// Üç dilimli lale, tepesi kenara bakar.
const laleYari: N[] = [
  ...egri([0, .34], [-.15, .38], [-.2, .56], [-.135, .74]),
  ...egri([-.135, .74], [-.105, .67], [-.075, .62], [-.05, .61], 8),
  ...egri([-.05, .61], [-.04, .68], [-.018, .75], [0, .8], 8),
  [0, .8],
]
export const lale: N[] = [...laleYari, ...aynala(laleYari).slice(1)]

// İki lale arasına giren ince, kıvrımsız yaprak.
const yaprakYari: N[] = [...egri([0, .3], [-.075, .42], [-.075, .62], [0, .8]), [0, .8]]
const yaprak0: N[] = [...yaprakYari, ...aynala(yaprakYari).slice(1)]
export const yaprak = dondur(yaprak0, Math.PI / 6)

export const MERKEZ_R = .2, HALKA_IC = .86, HALKA_DIS = .96
const merkezDaire = daire(MERKEZ_R)
const SEKTOR = 6

export const bolgeler: Bolge[] = [
  ...Array.from({ length: SEKTOR }, (_, i): Bolge => ({ tur: 'lale', dis: dondur(lale, (i * Math.PI) / 3) })),
  ...Array.from({ length: SEKTOR }, (_, i): Bolge => ({ tur: 'yaprak', dis: dondur(yaprak, (i * Math.PI) / 3) })),
  { tur: 'merkez', dis: merkezDaire },
  { tur: 'halka', dis: daire(HALKA_DIS, 96), ic: daire(HALKA_IC, 96) },
]

// Oyuncunun fırçayla geçtiği izler; aynı desenin kalan tekrarları çırak tarafından tamamlanır.
const kapat = (p: N[]): N[] => [...p, p[0]]
export const izler: N[][] = [kapat(lale), kapat(yaprak), kapat(merkezDaire)]

/** Bütün kontur çizgileri: kömür noktaları ve bitmiş tahrir buradan çizilir. */
export const konturlar: N[][] = [
  ...bolgeler.flatMap((b) => (b.ic ? [kapat(b.dis), kapat(b.ic)] : [kapat(b.dis)])),
]

export function icinde([x, y]: N, p: N[]) {
  let ic = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic
  }
  return ic
}

export function bolgeBul(n: N): number {
  return bolgeler.findIndex((b) => icinde(n, b.dis) && !(b.ic && icinde(n, b.ic)))
}

export interface IzSonucu { sira: number; uzaklik: number }
/** Fırça izin devamına yakınsa ilerler. Geri gitmez, ileri atlayarak izi kısaltamaz. */
export function izIlerlet(iz: N[], sira: number, n: N, tolerans: number, pencere = 10): IzSonucu {
  let en = sira, enU = Infinity
  for (let i = sira; i < Math.min(iz.length, sira + pencere); i++) {
    const u = Math.hypot(iz[i][0] - n[0], iz[i][1] - n[1])
    if (u < enU) { enU = u; en = i }
  }
  return enU <= tolerans ? { sira: Math.max(sira, en), uzaklik: enU } : { sira, uzaklik: enU }
}
