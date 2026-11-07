// Regenerates map data from source. Not used while the app runs; network is needed only by this script.
// Usage: node src/content/maps/data-generate.mjs <raw-data-folder>
// Downloaded and cached: Natural Earth GeoJSON, one-off OSM Overpass queries, Terrain Tiles elevation tiles.
// No OSM tile server is used. The relief WebP is rendered on a Chromium canvas (Playwright).
import fs from 'node:fs'
import pathMod from 'node:path'
import { fileURLToPath } from 'node:url'

const RAW = process.argv[2]
if (!RAW) throw new Error('Provide the raw data folder')
fs.mkdirSync(RAW, { recursive: true })
const OUTPUT = pathMod.dirname(fileURLToPath(import.meta.url))
const UA = 'KokXR-hackathon-prototype/1.0 (one-off data extraction)'
const sleep = (ms) => new Promise((c) => setTimeout(c, ms))

// ---- Download ----
async function cache(name, generate) {
  const file = pathMod.join(RAW, name)
  if (fs.existsSync(file)) return fs.readFileSync(file)
  const v = await generate()
  fs.writeFileSync(file, v)
  return v
}
const NE = (name) => cache(name, async () => {
  const r = await fetch(`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/${name}`, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${name}: ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}).then((b) => JSON.parse(b))
const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const overpass = (name, q) => cache(name, async () => {
  let last
  for (let attempt = 0; attempt < 4; attempt++) for (const s of SERVERS) {
    try {
      const r = await fetch(s, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(200000) })
      const t = await r.text()
      if (r.ok && t.startsWith('{') && !JSON.parse(t).remark?.includes('error')) return t
      last = `${s} ${r.status} ${t.slice(0, 120)}`
    } catch (e) { last = `${s} ${e}` }
    console.error('Overpass will retry:', last)
    await sleep(20000)
  }
  throw new Error(`Overpass ${name}: ${last}`)
}).then((b) => JSON.parse(b))

// ---- Projection and geometry ----
const mx = (lon) => (lon + 180) / 360
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2
function projection(c, G) {
  const x0 = mx(c.west), x1 = mx(c.east), y0 = my(c.north), y1 = my(c.south)
  const k = G / (x1 - x0), H = Math.round((y1 - y0) * k)
  return { G, H, p: ([lon, lat]) => [(mx(lon) - x0) * k, (my(lat) - y0) * k], x0, x1, y0, y1 }
}
function dp(pts, tol) {
  if (pts.length < 3) return pts
  const hold = new Uint8Array(pts.length); hold[0] = hold[pts.length - 1] = 1
  const heap = [[0, pts.length - 1]]
  while (heap.length) {
    const [a, b] = heap.pop()
    const [ax, ay] = pts[a], [bx, by] = pts[b]
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy
    let maxDist = 0, i = -1
    for (let k = a + 1; k < b; k++) {
      const [px, py] = pts[k]
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
      t = Math.max(0, Math.min(1, t))
      const ex = px - ax - t * dx, ey = py - ay - t * dy, d = ex * ex + ey * ey
      if (d > maxDist) { maxDist = d; i = k }
    }
    if (maxDist > tol * tol) { hold[i] = 1; heap.push([a, i], [i, b]) }
  }
  return pts.filter((_, i) => hold[i])
}
/** Clips a polyline to a rectangle (Liang-Barsky); splits it into pieces where it leaves. */
function clipLine(pts, x0, y0, x1, y1) {
  const out = []; let current = []
  for (let i = 1; i < pts.length; i++) {
    let [ax, ay] = pts[i - 1]; const [bx, by] = pts[i]
    const dx = bx - ax, dy = by - ay
    let t0 = 0, t1 = 1, ok = true
    for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
      if (p === 0) { if (q < 0) ok = false; continue }
      const r = q / p
      if (p < 0) { if (r > t1) ok = false; else if (r > t0) t0 = r } else { if (r < t0) ok = false; else if (r < t1) t1 = r }
    }
    if (!ok) { if (current.length > 1) out.push(current); current = []; continue }
    const g = [ax + t0 * dx, ay + t0 * dy], c = [ax + t1 * dx, ay + t1 * dy]
    if (!current.length) current.push(g)
    current.push(c)
    if (t1 < 1) { out.push(current); current = [] }
  }
  if (current.length > 1) out.push(current)
  return out
}
/** Clips a ring to a rectangle (Sutherland-Hodgman). Leftovers along the edge lie outside the frame, so they stay invisible. */
function clipRing(h, x0, y0, x1, y1) {
  const cutOff = (poly, inner, cut) => {
    const o = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]
      if (inner(a)) { o.push(a); if (!inner(b)) o.push(cut(a, b)) } else if (inner(b)) o.push(cut(a, b))
    }
    return o
  }
  const dX = (v) => (a, b) => [v, a[1] + ((v - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]
  const dY = (v) => (a, b) => [a[0] + ((v - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), v]
  let p = h
  p = cutOff(p, (a) => a[0] >= x0, dX(x0)); if (!p.length) return p
  p = cutOff(p, (a) => a[0] <= x1, dX(x1)); if (!p.length) return p
  p = cutOff(p, (a) => a[1] >= y0, dY(y0)); if (!p.length) return p
  return cutOff(p, (a) => a[1] <= y1, dY(y1))
}
const area = (h) => { let a = 0; for (let i = 0; i < h.length; i++) { const [x, y] = h[i], [u, v] = h[(i + 1) % h.length]; a += x * v - u * y } return a / 2 }
/** Relative SVG path on an integer grid: the shortest possible text. */
function path(pieces, closedState = false) {
  let s = ''
  for (const pts of pieces) {
    let lx = Math.round(pts[0][0]), ly = Math.round(pts[0][1]), write = '', n = 0
    for (let i = 1; i < pts.length; i++) {
      const x = Math.round(pts[i][0]), y = Math.round(pts[i][1]), dx = x - lx, dy = y - ly
      if (!dx && !dy) continue
      write += (n ? (dx < 0 ? '' : ' ') : '') + dx + (dy < 0 ? '' : ' ') + dy
      lx = x; ly = y; n++
    }
    if (!n) continue
    s += `M${Math.round(pts[0][0])} ${Math.round(pts[0][1])}l${write}${closedState ? 'z' : ''}`
  }
  return s
}
/** Joins lines that share endpoints: fewer M commands, fewer bytes, cleaner simplification. */
function chain(strokes) {
  const keyStr = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`
  const tip = new Map()
  const add = (k, c) => { if (!tip.has(k)) tip.set(k, new Set()); tip.get(k).add(c) }
  const cluster = new Set(strokes.map((c) => ({ p: c })))
  for (const c of cluster) { add(keyStr(c.p[0]), c); add(keyStr(c.p.at(-1)), c) }
  const remove = (k, c) => tip.get(k)?.delete(c)
  const result = []
  for (const c of cluster) {
    if (c.done) continue
    c.done = true
    remove(keyStr(c.p[0]), c); remove(keyStr(c.p.at(-1)), c)
    let p = c.p
    for (let dir = 0; dir < 2; dir++) {
      for (;;) {
        const k = keyStr(p.at(-1)), candidates = [...(tip.get(k) ?? [])]
        if (candidates.length !== 1) break
        const d = candidates[0]
        d.done = true
        remove(keyStr(d.p[0]), d); remove(keyStr(d.p.at(-1)), d)
        p = p.concat((keyStr(d.p[0]) === k ? d.p : [...d.p].reverse()).slice(1))
      }
      p = [...p].reverse()
    }
    result.push(p)
  }
  return result
}
const rings = (g) => g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : []
const strokes = (g) => g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
const paths = (d) => d.elements.filter((e) => e.type === 'way' && e.geometry).map((e) => ({ t: e.tags ?? {}, p: e.geometry.map((n) => [n.lon, n.lat]) }))
const bb = (c) => `${c.south},${c.west},${c.north},${c.east}`
function strokeLayer(proj, raw, tol) {
  const share = 5
  const pr = raw.map((c) => c.map(proj.p))
  const clipped = chain(pr).flatMap((c) => clipLine(c, -share, -share, proj.G + share, proj.H + share))
  return path(clipped.map((c) => dp(c, tol)).filter((c) => c.length > 1))
}
function areaLayer(proj, raw, tol, minW = 0) {
  const share = 5
  const clipped = raw.map((h) => clipRing(h.map(proj.p), -share, -share, proj.G + share, proj.H + share)).filter((h) => h.length > 2)
  return path(clipped.map((h) => dp(h, tol)).filter((h) => h.length > 2 && Math.abs(area(h)) >= minW), true)
}
/**
 * Sea area from the OSM coastline: coastline ways are drawn with land on the left, so the sea is on the right.
 * A chain leaving the frame is joined to the next entry by following the frame edge clockwise.
 */
function seaArea(proj, coast, tol) {
  const { G, H } = proj
  const pieces = chain(coast.map((c) => c.map(proj.p))).flatMap((c) => clipLine(c, 0, 0, G, H))
  // Clockwise on a y-down screen: top (left to right), right, bottom, left
  const position = ([x, y]) => {
    const e = 0.01
    if (Math.abs(y) < e) return x
    if (Math.abs(x - G) < e) return G + y
    if (Math.abs(y - H) < e) return G + H + (G - x)
    if (Math.abs(x) < e) return 2 * G + H + (H - y)
    return null
  }
  const corners = [[G, 0, G], [G, H, G + H], [0, H, 2 * G + H], [0, 0, 2 * G + 2 * H]]
  const open = pieces.filter((c) => position(c[0]) !== null && position(c.at(-1)) !== null)
  const closedState = pieces.filter((c) => !open.includes(c) && Math.hypot(c[0][0] - c.at(-1)[0], c[0][1] - c.at(-1)[1]) < 1)
  const ring = []
  const remaining = new Set(open)
  while (remaining.size) {
    const head = remaining.values().next().value
    let p = [], current = head
    for (;;) {
      remaining.delete(current)
      p = p.concat(dp(current, tol))
      const exit = position(current.at(-1))
      let next = null, least = Infinity
      for (const a of [head, ...remaining]) {
        const d = (position(a[0]) - exit + 2 * (G + H)) % (2 * (G + H))
        if (d < least) { least = d; next = a }
      }
      const target = position(next[0])
      for (const [x, y, k] of [...corners, ...corners.map(([x, y, k]) => [x, y, k + 2 * (G + H)])]) {
        const u = target < exit ? target + 2 * (G + H) : target
        if (k > exit && k < u) p.push([x, y])
      }
      if (next === head) break
      current = next
    }
    ring.push(p)
  }
  return { path: path(ring, true) + path(closedState.map((c) => dp(c, tol)), true), open: open.length, closedState: closedState.length, total: pieces.length }
}

// ---- Maps ----
const FRAME = {
  turkey: { west: 25.2, east: 45.2, south: 35.35, north: 42.6 },
  bursa: { west: 28.7, east: 29.42, south: 40.03, north: 40.44 },
  konya: { west: 32.2, east: 32.78, south: 37.7, north: 38.06 },
  hatay: { west: 35.86, east: 36.46, south: 36.0, north: 36.42 },
}
const write = (name, v) => { const s = JSON.stringify(v); fs.writeFileSync(pathMod.join(OUTPUT, `${name}.json`), s + '\n'); console.log(name, s.length, Object.fromEntries(Object.entries(v.layer).map(([k, x]) => [k, x.length]))) }
const roundOff = (proj, name, lon, lat, kind, z) => { const [x, y] = proj.p([lon, lat]); return { name: name, x: Math.round(x), y: Math.round(y), kind, ...(z ? { z } : {}) } }

async function turkey() {
  const c = FRAME.turkey, proj = projection(c, 2000)
  const [country, land, province, lake, river, place] = await Promise.all(['ne_10m_admin_0_countries.geojson', 'ne_10m_land.geojson', 'ne_10m_admin_1_states_provinces.geojson', 'ne_10m_lakes.geojson', 'ne_10m_rivers_lake_centerlines.geojson', 'ne_10m_populated_places_simple.geojson'].map(NE))
  const trPlace = place.features.filter((f) => f.properties.adm0_a3 === 'TUR')
  const cityLabel = (name, pattern) => { const f = trPlace.find((f) => pattern.test(f.properties.name)); if (!f) { console.log('  label missing:', name); return [] } return [roundOff(proj, name, ...f.geometry.coordinates, 'city')] }
  const tr = country.features.filter((f) => f.properties.ADM0_A3 === 'TUR').flatMap((f) => rings(f.geometry))
  // Province borders: edges shared by two provinces are written once.
  const provinces = province.features.filter((f) => f.properties.adm0_a3 === 'TUR')
  const edge = new Map()
  const pointKey = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`
  for (const f of provinces) for (const h of rings(f.geometry)) for (let i = 1; i < h.length; i++) {
    const a = pointKey(h[i - 1]), b = pointKey(h[i]), k = a < b ? a + '|' + b : b + '|' + a
    const e = edge.get(k); if (e) e.n++; else edge.set(k, { n: 1, p: [h[i - 1], h[i]] })
  }
  const innerEdge = [...edge.values()].filter((e) => e.n === 2).map((e) => e.p)
  const specialProvince = (name) => provinces.filter((f) => f.properties.name === name).flatMap((f) => rings(f.geometry))
  for (const name of ['Bursa', 'Konya', 'Hatay']) if (!specialProvince(name).length) throw new Error(`Province missing: ${name}`)
  const lakeH = lake.features.flatMap((f) => rings(f.geometry))
  const riverC = river.features.filter((f) => (f.properties.scalerank ?? 9) <= 7).flatMap((f) => strokes(f.geometry))
  const G = proj.G, H = proj.H
  write('turkey', {
    id: 'turkey', name: 'Türkiye', frameBorder: c, g: G, y: H, zMax: 1,
    attribution: ['Natural Earth (kamu malı)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    layer: {
      land: `M0 0H${G}V${H}H0z` + areaLayer(proj, land.features.flatMap((f) => rings(f.geometry)), 1.1, 3),
      country: areaLayer(proj, tr, 1.1, 3),
      province: strokeLayer(proj, innerEdge, 2.4),
      lake: areaLayer(proj, lakeH, 1, 6),
      river: strokeLayer(proj, riverC, 2),
      special: areaLayer(proj, ['Bursa', 'Konya', 'Hatay'].flatMap(specialProvince), 1.1, 3),
    },
    label: [
      ...[['İstanbul', /^Istanbul/], ['Ankara', /^Ankara/], ['İzmir', /zmir/], ['Antalya', /^Antalya/], ['Samsun', /^Samsun/], ['Trabzon', /^Trabzon/], ['Erzurum', /^Erzurum/], ['Diyarbakır', /^Diyarbak/], ['Van', /^Van$/]].flatMap(([a, r]) => cityLabel(a, r)),
      roundOff(proj, 'Karadeniz', 34.5, 42.25, 'sea'), roundOff(proj, 'Akdeniz', 31.6, 35.75, 'sea'), roundOff(proj, 'Ege Denizi', 26.25, 37.3, 'sea'),
    ],
  })
}

async function city(name, G, klass, feature) {
  const c = FRAME[name], proj = projection(c, G), b = bb(c)
  const roads = await overpass(`${name}-path.json`, `[out:json][timeout:180];way["highway"~"^(${klass.join('|')})$"](${b});out geom;`)
  const coast = await overpass(`${name}-coast.json`, `[out:json][timeout:120];way["natural"="coastline"](${c.south - 0.2},${c.west - 0.2},${c.north + 0.2},${c.east + 0.2});out geom;`)
  const water = await overpass(`${name}-water.json`, `[out:json][timeout:120];(way["natural"="water"](${b});rel["natural"="water"](${b});way["waterway"="river"](${b}););out geom;`)
  const places = await overpass(`${name}-place.json`, `[out:json][timeout:60];(node["place"~"^(city|town)$"](${b});node["natural"="peak"]["name"](${b}););out tags center;`)
  return { c, proj, b, roads: paths(roads), coast: paths(coast), water, places }
}
/** Selected labels from OSM place nodes; if OSM records an elevation, it is added under the peak name. */
const placeLabel = (proj, places, names) => names.map((name) => {
  const e = places.elements.find((n) => n.tags.name === name)
  if (!e) throw new Error(`Place missing: ${name}`)
  const peak = e.tags.natural === 'peak'
  return { ...roundOff(proj, name, e.lon, e.lat, peak ? 'peak' : 'city'), ...(peak && e.tags.ele ? { alt: `${e.tags.ele} m` } : {}) }
})
function waterLayer(proj, water, tol, minW) {
  const ring = []
  for (const e of water.elements) {
    if (e.type === 'way' && e.tags?.natural === 'water' && e.geometry) ring.push(e.geometry.map((n) => [n.lon, n.lat]))
    if (e.type === 'relation' && e.members) {
      const outer = e.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map((n) => [n.lon, n.lat]))
      ring.push(...chain(outer))
    }
  }
  const river = water.elements.filter((e) => e.type === 'way' && e.tags?.waterway && e.geometry).map((e) => e.geometry.map((n) => [n.lon, n.lat]))
  return { lake: areaLayer(proj, ring, tol, minW), river: strokeLayer(proj, river, tol * 1.5) }
}
const drawClass = (proj, roads, classes, tol, limit) => strokeLayer(proj, roads.filter((w) => classes.includes(w.t.highway) && (!limit || w.p.some(([lo, la]) => lo >= limit.west && lo <= limit.east && la >= limit.south && la <= limit.north))).map((w) => w.p), tol)

async function bursa() {
  const d = await city('bursa', 5000, ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street', 'pedestrian'])
  const { proj, c, b, roads } = d
  const rail = await overpass('bursa-rail.json', `[out:json][timeout:120];way["railway"~"^(light_rail|subway|tram)$"](${b});out geom;`)
  const build = await overpass('bursa-town.json', `[out:json][timeout:180];way["landuse"~"^(residential|commercial|retail)$"](${b});out geom;`)
  const sea = seaArea(proj, d.coast.map((w) => w.p), 1.6)
  console.log('  coast', sea.total, 'open', sea.open, 'closed', sea.closedState)
  const water = waterLayer(proj, d.water, 3, 250)
  const center = { west: 28.97, east: 29.13, south: 40.15, north: 40.24 }, historical = { west: 29.04, east: 29.087, south: 40.176, north: 40.194 }
  write('bursa', {
    id: 'bursa', name: 'Bursa', frameBorder: c, g: proj.G, y: proj.H, zMax: 12,
    attribution: ['© OpenStreetMap katkıda bulunanlar (ODbL)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    layer: {
      sea: sea.path, ...water,
      town: areaLayer(proj, build.elements.filter((e) => e.geometry).map((e) => e.geometry.map((n) => [n.lon, n.lat])), 6, 1500),
      ray: strokeLayer(proj, paths(rail).map((w) => w.p), 3),
      motorway: drawClass(proj, roads, ['motorway'], 3),
      ana: drawClass(proj, roads, ['trunk', 'primary'], 3),
      secondary: drawClass(proj, roads, ['secondary'], 6),
      tertiary: drawClass(proj, roads, ['tertiary'], 3, center),
      street: drawClass(proj, roads, ['residential', 'unclassified', 'living_street', 'pedestrian'], 3, historical),
    },
    label: [...placeLabel(proj, d.places, ['Mudanya', 'Gemlik', 'Nilüfer', 'Gürsu', 'Kestel', 'Uludağ']), roundOff(proj, 'Marmara Denizi', 28.97, 40.415, 'sea')],
  })
}

async function smallCity(name, G) {
  const d = await city(name, G, ['motorway', 'trunk', 'primary', 'secondary'])
  const { proj, c, roads } = d
  const sea = d.coast.length ? seaArea(proj, d.coast.map((w) => w.p), 1.5) : { path: '' }
  const water = waterLayer(proj, d.water, 4, 500)
  write(name, {
    id: name, name: name === 'konya' ? 'Konya' : 'Hatay', frameBorder: c, g: proj.G, y: proj.H, zMax: 4,
    attribution: ['© OpenStreetMap katkıda bulunanlar (ODbL)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    layer: { sea: sea.path, ...water, motorway: drawClass(proj, roads, ['motorway'], 3), ana: drawClass(proj, roads, ['trunk', 'primary'], 3), secondary: drawClass(proj, roads, ['secondary'], 9) },
    label: placeLabel(proj, d.places, name === 'konya' ? ['Selçuklu', 'Meram', 'Karatay', 'Loras Dağı'] : ['Antakya', 'Samandağ', 'Altınözü', 'Musa Dağı']),
  })
}

const target = process.argv.slice(3)
const play = async (name, f) => { if (!target.length || target.includes(name)) await f() }
await play('turkey', turkey)
await play('bursa', bursa)
await play('konya', () => smallCity('konya', 3000))
await play('hatay', () => smallCity('hatay', 3000))
