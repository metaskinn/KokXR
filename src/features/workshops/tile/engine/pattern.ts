// Tile plate pattern: an original tulip-and-leaf layout drawn for the app; not a copy of any specific historical work.
// Coordinates are relative to the plate radius: center (0, 0), rim 1.
export type N = [number, number]
export type Tour = 'tulip' | 'leaf' | 'center' | 'ring'
export interface Region { tour: Tour; outer: N[]; inner?: N[] }

function curve(a: N, b: N, c: N, d: N, step = 14): N[] {
  const o: N[] = []
  for (let i = 0; i < step; i++) {
    const t = i / step, u = 1 - t
    o.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]])
  }
  return o
}
const mirrorize = (p: N[]): N[] => p.slice(1).reverse().map(([x, y]) => [-x, y])
function circle(r: number, step = 72): N[] {
  return Array.from({ length: step }, (_, i) => { const a = (i / step) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r] as N })
}
export const rotate = (p: N[], angle: number): N[] => {
  const c = Math.cos(angle), s = Math.sin(angle)
  return p.map(([x, y]) => [x * c - y * s, x * s + y * c])
}

// Three-lobed tulip, tip facing the rim.
const tulipHalf: N[] = [
  ...curve([0, .34], [-.15, .38], [-.2, .56], [-.135, .74]),
  ...curve([-.135, .74], [-.105, .67], [-.075, .62], [-.05, .61], 8),
  ...curve([-.05, .61], [-.04, .68], [-.018, .75], [0, .8], 8),
  [0, .8],
]
export const tulip: N[] = [...tulipHalf, ...mirrorize(tulipHalf).slice(1)]

// Thin, uncurled leaf fitting between two tulips.
const leafHalf: N[] = [...curve([0, .3], [-.075, .42], [-.075, .62], [0, .8]), [0, .8]]
const leaf0: N[] = [...leafHalf, ...mirrorize(leafHalf).slice(1)]
export const leaf = rotate(leaf0, Math.PI / 6)

export const CENTER_R = .2, RING_IN = .86, RING_OUT = .96
const centerCircle = circle(CENTER_R)
const SECTOR = 6

export const regions: Region[] = [
  ...Array.from({ length: SECTOR }, (_, i): Region => ({ tour: 'tulip', outer: rotate(tulip, (i * Math.PI) / 3) })),
  ...Array.from({ length: SECTOR }, (_, i): Region => ({ tour: 'leaf', outer: rotate(leaf, (i * Math.PI) / 3) })),
  { tour: 'center', outer: centerCircle },
  { tour: 'ring', outer: circle(RING_OUT, 96), inner: circle(RING_IN, 96) },
]

// Traces the player follows with the brush; the remaining repeats of the same pattern are completed by the apprentice.
const close = (p: N[]): N[] => [...p, p[0]]
export const traces: N[][] = [close(tulip), close(leaf), close(centerCircle)]

/** All contour lines: charcoal dots and the finished outline are drawn from these. */
export const contours: N[][] = [
  ...regions.flatMap((b) => (b.inner ? [close(b.outer), close(b.inner)] : [close(b.outer)])),
]

export function within([x, y]: N, p: N[]) {
  let inner = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inner = !inner
  }
  return inner
}

export function findRegion(n: N): number {
  return regions.findIndex((b) => within(n, b.outer) && !(b.inner && within(n, b.inner)))
}

export interface TraceResult { row: number; distance: number }
/** Advances if the brush is near the continuation of the trace. Never goes back, cannot shortcut the trace by jumping ahead. */
export function advanceTrace(iz: N[], row: number, n: N, tolerance: number, window = 10): TraceResult {
  let en = row, wU = Infinity
  for (let i = row; i < Math.min(iz.length, row + window); i++) {
    const u = Math.hypot(iz[i][0] - n[0], iz[i][1] - n[1])
    if (u < wU) { wU = u; en = i }
  }
  return wU <= tolerance ? { row: Math.max(row, en), distance: wU } : { row, distance: wU }
}
