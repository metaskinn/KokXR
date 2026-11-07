// Data model and loader for the Places map. Geometry in `maps/*.json`, relief in `maps/*-relief.webp`:
// both are bundled in the repo, need no internet and load only when the map is opened. Sources and licence: maps/SOURCES.md
import reliefTurkey from './maps/turkey-relief.webp'
import reliefBursa from './maps/bursa-relief.webp'
import reliefKonya from './maps/konya-relief.webp'
import reliefHatay from './maps/hatay-relief.webp'

export type MapId = 'turkey' | 'bursa' | 'konya' | 'hatay'

export interface MapLabel { name: string; x: number; y: number; kind: string; z?: number; alt?: string }
export interface MapData {
  id: MapId
  name: string
  frameBorder: { west: number; east: number; south: number; north: number }
  g: number
  y: number
  zMax: number
  attribution: string[]
  layer: Record<string, string>
  label: MapLabel[]
}

const LOADER: Record<MapId, () => Promise<{ default: unknown }>> = {
  turkey: () => import('./maps/turkey.json'),
  bursa: () => import('./maps/bursa.json'),
  konya: () => import('./maps/konya.json'),
  hatay: () => import('./maps/hatay.json'),
}

export const RELIEF: Record<MapId, string> = { turkey: reliefTurkey, bursa: reliefBursa, konya: reliefKonya, hatay: reliefHatay }

export const loadMap = async (k: MapId) => (await LOADER[k]()).default as MapData

const mx = (lon: number) => (lon + 180) / 360
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2

/** Converts longitude/latitude to map units (Web Mercator, the same projection as the data). */
export function mapPoint(v: MapData, [lon, lat]: [number, number]) {
  const c = v.frameBorder, k = v.g / (mx(c.east) - mx(c.west))
  return { x: (mx(lon) - mx(c.west)) * k, y: (my(lat) - my(c.north)) * k }
}

/**
 * Spreads overlapping markers far enough apart that their touch targets do not collide, and keeps them in the frame.
 * The building's true location is shown separately as a dot; a shifted marker is linked to it by a line.
 */
export function separateMarkers(points: { x: number; y: number }[], w: number, h: number, spacing = 46, padding = 24) {
  const s = points.map((n) => ({ x: n.x, y: n.y }))
  // A tight cluster is first expanded from its centre: markers keep their relative direction (an eastern building stays east).
  const group = s.map((_, i) => i)
  const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])))
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (Math.hypot(s[i].x - s[j].x, s[i].y - s[j].y) < spacing) group[root(i)] = root(j)
  for (const r of new Set(s.map((_, i) => root(i)))) {
    const member = s.filter((_, i) => root(i) === r)
    if (member.length < 2) continue
    const ox = member.reduce((t, n) => t + n.x, 0) / member.length, oy = member.reduce((t, n) => t + n.y, 0) / member.length
    const radius = Math.max(...member.map((n) => Math.hypot(n.x - ox, n.y - oy)), 1)
    const k = Math.max(1, Math.min(5, (spacing * Math.sqrt(member.length) * 0.75) / radius))
    for (const n of member) { n.x = ox + (n.x - ox) * k; n.y = oy + (n.y - oy) * k }
  }
  const clamp = (n: { x: number; y: number }) => {
    n.x = Math.max(padding, Math.min(w - padding, n.x))
    n.y = Math.max(padding, Math.min(h - padding, n.y))
    // Keep clear of the zoom buttons at the top right.
    if (n.x > w - 76 && n.y < 150) n.y = 150
  }
  s.forEach(clamp)
  for (let iter = 0; iter < 80; iter++) {
    let moved = false
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      let dx = s[j].x - s[i].x, dy = s[j].y - s[i].y, d = Math.hypot(dx, dy)
      if (d >= spacing) continue
      if (d < 0.01) { const a = (i + j) * 2.399963; dx = Math.cos(a); dy = Math.sin(a); d = 1 }
      const push = (spacing - d) / 2 + 0.2
      s[i].x -= (dx / d) * push; s[i].y -= (dy / d) * push
      s[j].x += (dx / d) * push; s[j].y += (dy / d) * push
      moved = true
    }
    s.forEach(clamp)
    if (!moved) break
  }
  return s
}
