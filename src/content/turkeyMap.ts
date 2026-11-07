// Mekanlar haritasının veri modeli ve yükleyicisi. Geometri `harita/*.json`, kabartma `harita/*-kabartma.webp`:
// ikisi de repoya gömülüdür, internet istemez ve yalnız gereken harita açılınca yüklenir. Kaynak ve lisans: harita/KAYNAK.md
import reliefTurkey from './maps/turkey-relief.webp'
import reliefBursa from './maps/bursa-relief.webp'
import reliefKonya from './maps/konya-relief.webp'
import reliefHatay from './maps/hatay-relief.webp'

export type MapId = 'turkey' | 'bursa' | 'konya' | 'hatay'

export interface MapLabel { ad: string; x: number; y: number; tour: string; z?: number; alt?: string }
export interface MapData {
  id: MapId
  ad: string
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

/** Boylam/enlemi harita birimine çevirir (Web Mercator, veriyle aynı izdüşüm). */
export function mapPoint(v: MapData, [lon, lat]: [number, number]) {
  const c = v.frameBorder, k = v.g / (mx(c.east) - mx(c.west))
  return { x: (mx(lon) - mx(c.west)) * k, y: (my(lat) - my(c.north)) * k }
}

/**
 * Birbirine binen işaretleri, dokunma hedefleri çakışmayacak kadar ayırır ve çerçevede tutar.
 * Yapının gerçek yeri ayrıca noktayla gösterilir; işaret kaydıysa çizgiyle bağlanır.
 */
export function separateMarkers(points: { x: number; y: number }[], g: number, y: number, interval = 46, share = 24) {
  const s = points.map((n) => ({ x: n.x, y: n.y }))
  // Sıkışık öbek önce merkezinden açılır: işaretler birbirine göre yönünü korur (doğudaki yapı doğuda kalır).
  const group = s.map((_, i) => i)
  const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])))
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (Math.hypot(s[i].x - s[j].x, s[i].y - s[j].y) < interval) group[root(i)] = root(j)
  for (const r of new Set(s.map((_, i) => root(i)))) {
    const member = s.filter((_, i) => root(i) === r)
    if (member.length < 2) continue
    const ox = member.reduce((t, n) => t + n.x, 0) / member.length, oy = member.reduce((t, n) => t + n.y, 0) / member.length
    const radius = Math.max(...member.map((n) => Math.hypot(n.x - ox, n.y - oy)), 1)
    const k = Math.max(1, Math.min(5, (interval * Math.sqrt(member.length) * 0.75) / radius))
    for (const n of member) { n.x = ox + (n.x - ox) * k; n.y = oy + (n.y - oy) * k }
  }
  const clamp = (n: { x: number; y: number }) => {
    n.x = Math.max(share, Math.min(g - share, n.x))
    n.y = Math.max(share, Math.min(y - share, n.y))
    // Sağ üstteki yakınlaştırma düğmelerinin altına girmesin.
    if (n.x > g - 76 && n.y < 150) n.y = 150
  }
  s.forEach(clamp)
  for (let tour = 0; tour < 80; tour++) {
    let recordOf = false
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      let dx = s[j].x - s[i].x, dy = s[j].y - s[i].y, d = Math.hypot(dx, dy)
      if (d >= interval) continue
      if (d < 0.01) { const a = (i + j) * 2.399963; dx = Math.cos(a); dy = Math.sin(a); d = 1 }
      const it = (interval - d) / 2 + 0.2
      s[i].x -= (dx / d) * it; s[i].y -= (dy / d) * it
      s[j].x += (dx / d) * it; s[j].y += (dy / d) * it
      recordOf = true
    }
    s.forEach(clamp)
    if (!recordOf) break
  }
  return s
}
