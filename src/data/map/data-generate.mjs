// Harita verisini kaynaktan yeniden üretir. Uygulama çalışırken kullanılmaz; ağ yalnız bu betikte gerekir.
// Kullanım: node src/data/harita/veri-uret.mjs <ham-veri-klasörü>
// İner ve önbelleğe alınır: Natural Earth GeoJSON, tek seferlik OSM Overpass sorguları, Terrain Tiles yükseklik paftaları.
// OSM tile sunucusu kullanılmaz. Kabartma WebP'si Chromium tuvalinde (Playwright) üretilir.
import fs from 'node:fs'
import pathMod from 'node:path'
import { fileURLToPath } from 'node:url'

const RAW = process.argv[2]
if (!RAW) throw new Error('Ham veri klasörünü verin')
fs.mkdirSync(RAW, { recursive: true })
const OUTPUT = pathMod.dirname(fileURLToPath(import.meta.url))
const UA = 'KokXR-hackathon-prototip/1.0 (tek seferlik veri cikarimi)'
const sleep = (ms) => new Promise((c) => setTimeout(c, ms))

// ---- İndirme ----
async function cache(ad, generate) {
  const y = pathMod.join(RAW, ad)
  if (fs.existsSync(y)) return fs.readFileSync(y)
  const v = await generate()
  fs.writeFileSync(y, v)
  return v
}
const NE = (ad) => cache(ad, async () => {
  const r = await fetch(`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/${ad}`, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${ad}: ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}).then((b) => JSON.parse(b))
const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const overpass = (ad, q) => cache(ad, async () => {
  let last
  for (let tour = 0; tour < 4; tour++) for (const s of SERVERS) {
    try {
      const r = await fetch(s, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(200000) })
      const t = await r.text()
      if (r.ok && t.startsWith('{') && !JSON.parse(t).remark?.includes('error')) return t
      last = `${s} ${r.status} ${t.slice(0, 120)}`
    } catch (e) { last = `${s} ${e}` }
    console.error('Overpass yeniden denenecek:', last)
    await sleep(20000)
  }
  throw new Error(`Overpass ${ad}: ${last}`)
}).then((b) => JSON.parse(b))

// ---- İzdüşüm ve geometri ----
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
    let enb = 0, i = -1
    for (let k = a + 1; k < b; k++) {
      const [px, py] = pts[k]
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
      t = Math.max(0, Math.min(1, t))
      const ex = px - ax - t * dx, ey = py - ay - t * dy, d = ex * ex + ey * ey
      if (d > enb) { enb = d; i = k }
    }
    if (enb > tol * tol) { hold[i] = 1; heap.push([a, i], [i, b]) }
  }
  return pts.filter((_, i) => hold[i])
}
/** Çizgiyi dikdörtgene kırpar (Liang-Barsky); dışarı çıkınca parçalara böler. */
function clipLine(pts, x0, y0, x1, y1) {
  const out = []; let akt = []
  for (let i = 1; i < pts.length; i++) {
    let [ax, ay] = pts[i - 1]; const [bx, by] = pts[i]
    const dx = bx - ax, dy = by - ay
    let t0 = 0, t1 = 1, ok = true
    for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
      if (p === 0) { if (q < 0) ok = false; continue }
      const r = q / p
      if (p < 0) { if (r > t1) ok = false; else if (r > t0) t0 = r } else { if (r < t0) ok = false; else if (r < t1) t1 = r }
    }
    if (!ok) { if (akt.length > 1) out.push(akt); akt = []; continue }
    const g = [ax + t0 * dx, ay + t0 * dy], c = [ax + t1 * dx, ay + t1 * dy]
    if (!akt.length) akt.push(g)
    akt.push(c)
    if (t1 < 1) { out.push(akt); akt = [] }
  }
  if (akt.length > 1) out.push(akt)
  return out
}
/** Halkayı dikdörtgene kırpar (Sutherland-Hodgman). Kenarda kalan fazlalık çerçeve dışında olduğundan görünmez. */
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
/** Tam sayı ızgarada göreli SVG yolu: mümkün olan en kısa metin. */
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
/** Uç noktaları aynı çizgileri birleştirir: daha az M, daha az bayt, daha temiz sadeleştirme. */
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
function strokeLayer(izd, raw, tol) {
  const share = 5
  const pr = raw.map((c) => c.map(izd.p))
  const krp = chain(pr).flatMap((c) => clipLine(c, -share, -share, izd.G + share, izd.H + share))
  return path(krp.map((c) => dp(c, tol)).filter((c) => c.length > 1))
}
function areaLayer(izd, raw, tol, minW = 0) {
  const share = 5
  const krp = raw.map((h) => clipRing(h.map(izd.p), -share, -share, izd.G + share, izd.H + share)).filter((h) => h.length > 2)
  return path(krp.map((h) => dp(h, tol)).filter((h) => h.length > 2 && Math.abs(area(h)) >= minW), true)
}
/**
 * OSM kıyı çizgisinden deniz alanı: kıyı yolları karada solda kalacak yönde çizilir, yani deniz sağdadır.
 * Çerçeveden çıkan zincir, saat yönünde çerçeve kenarını izleyerek sonraki girişe bağlanır.
 */
function seaArea(izd, coast, tol) {
  const { G, H } = izd
  const pieces = chain(coast.map((c) => c.map(izd.p))).flatMap((c) => clipLine(c, 0, 0, G, H))
  // y aşağı bakan ekranda saat yönü: üst (soldan sağa), sağ, alt, sol
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
    let p = [], akt = head
    for (;;) {
      remaining.delete(akt)
      p = p.concat(dp(akt, tol))
      const exit = position(akt.at(-1))
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
      akt = next
    }
    ring.push(p)
  }
  return { path: path(ring, true) + path(closedState.map((c) => dp(c, tol)), true), open: open.length, closedState: closedState.length, total: pieces.length }
}

// ---- Haritalar ----
const FRAME = {
  turkey: { west: 25.2, east: 45.2, south: 35.35, north: 42.6 },
  bursa: { west: 28.7, east: 29.42, south: 40.03, north: 40.44 },
  konya: { west: 32.2, east: 32.78, south: 37.7, north: 38.06 },
  hatay: { west: 35.86, east: 36.46, south: 36.0, north: 36.42 },
}
const write = (ad, v) => { const s = JSON.stringify(v); fs.writeFileSync(pathMod.join(OUTPUT, `${ad}.json`), s + '\n'); console.log(ad, s.length, Object.fromEntries(Object.entries(v.layer).map(([k, x]) => [k, x.length]))) }
const roundOff = (izd, ad, lon, lat, tour, z) => { const [x, y] = izd.p([lon, lat]); return { ad, x: Math.round(x), y: Math.round(y), tour, ...(z ? { z } : {}) } }

async function turkey() {
  const c = FRAME.turkey, izd = projection(c, 2000)
  const [country, land, province, lake, river, place] = await Promise.all(['ne_10m_admin_0_countries.geojson', 'ne_10m_land.geojson', 'ne_10m_admin_1_states_provinces.geojson', 'ne_10m_lakes.geojson', 'ne_10m_rivers_lake_centerlines.geojson', 'ne_10m_populated_places_simple.geojson'].map(NE))
  const trPlace = place.features.filter((f) => f.properties.adm0_a3 === 'Tour')
  const cityE = (ad, ara) => { const f = trPlace.find((f) => ara.test(f.properties.name)); if (!f) { console.log('  etiket yok:', ad); return [] } return [roundOff(izd, ad, ...f.geometry.coordinates, 'city')] }
  const tr = country.features.filter((f) => f.properties.ADM0_A3 === 'Tour').flatMap((f) => rings(f.geometry))
  // İller arası çizgi: iki ilin paylaştığı kenarlar bir kez yazılır.
  const provinces = province.features.filter((f) => f.properties.adm0_a3 === 'Tour')
  const edge = new Map()
  const an = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`
  for (const f of provinces) for (const h of rings(f.geometry)) for (let i = 1; i < h.length; i++) {
    const a = an(h[i - 1]), b = an(h[i]), k = a < b ? a + '|' + b : b + '|' + a
    const e = edge.get(k); if (e) e.n++; else edge.set(k, { n: 1, p: [h[i - 1], h[i]] })
  }
  const innerEdge = [...edge.values()].filter((e) => e.n === 2).map((e) => e.p)
  const specialProvince = (ad) => provinces.filter((f) => f.properties.name === ad).flatMap((f) => rings(f.geometry))
  for (const ad of ['Bursa', 'Konya', 'Hatay']) if (!specialProvince(ad).length) throw new Error(`İl yok: ${ad}`)
  const lakeH = lake.features.flatMap((f) => rings(f.geometry))
  const riverC = river.features.filter((f) => (f.properties.scalerank ?? 9) <= 7).flatMap((f) => strokes(f.geometry))
  const G = izd.G, H = izd.H
  write('turkey', {
    id: 'turkey', ad: 'Türkiye', frameBorder: c, g: G, y: H, zMax: 1,
    attribution: ['Natural Earth (kamu malı)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    layer: {
      land: `M0 0H${G}V${H}H0z` + areaLayer(izd, land.features.flatMap((f) => rings(f.geometry)), 1.1, 3),
      country: areaLayer(izd, tr, 1.1, 3),
      province: strokeLayer(izd, innerEdge, 2.4),
      lake: areaLayer(izd, lakeH, 1, 6),
      river: strokeLayer(izd, riverC, 2),
      special: areaLayer(izd, ['Bursa', 'Konya', 'Hatay'].flatMap(specialProvince), 1.1, 3),
    },
    label: [
      ...[['İstanbul', /^Istanbul/], ['Ankara', /^Ankara/], ['İzmir', /zmir/], ['Antalya', /^Antalya/], ['Samsun', /^Samsun/], ['Trabzon', /^Trabzon/], ['Erzurum', /^Erzurum/], ['Diyarbakır', /^Diyarbak/], ['Van', /^Van$/]].flatMap(([a, r]) => cityE(a, r)),
      roundOff(izd, 'Karadeniz', 34.5, 42.25, 'sea'), roundOff(izd, 'Akdeniz', 31.6, 35.75, 'sea'), roundOff(izd, 'Ege Denizi', 26.25, 37.3, 'sea'),
    ],
  })
}

async function city(ad, G, klass, feature) {
  const c = FRAME[ad], izd = projection(c, G), b = bb(c)
  const hp = await overpass(`${ad}-path.json`, `[out:json][timeout:180];way["highway"~"^(${klass.join('|')})$"](${b});out geom;`)
  const ky = await overpass(`${ad}-coast.json`, `[out:json][timeout:120];way["natural"="coastline"](${c.south - 0.2},${c.west - 0.2},${c.north + 0.2},${c.east + 0.2});out geom;`)
  const water = await overpass(`${ad}-water.json`, `[out:json][timeout:120];(way["natural"="water"](${b});rel["natural"="water"](${b});way["waterway"="river"](${b}););out geom;`)
  const ked = await overpass(`${ad}-place.json`, `[out:json][timeout:60];(node["place"~"^(city|town)$"](${b});node["natural"="peak"]["name"](${b}););out tags center;`)
  return { c, izd, b, hp: paths(hp), ky: paths(ky), water, ked }
}
/** OSM yer düğümlerinden seçili etiketler; yükseklik OSM'de yazılıysa zirve adının altına eklenir. */
const placeLabel = (izd, ked, names) => names.map((ad) => {
  const e = ked.elements.find((n) => n.tags.name === ad)
  if (!e) throw new Error(`Yer yok: ${ad}`)
  const peak = e.tags.natural === 'peak'
  return { ...roundOff(izd, ad, e.lon, e.lat, peak ? 'peak' : 'city'), ...(peak && e.tags.filterOut ? { alt: `${e.tags.filterOut} m` } : {}) }
})
function waterLayer(izd, water, tol, minW) {
  const ring = []
  for (const e of water.elements) {
    if (e.type === 'way' && e.tags?.natural === 'water' && e.geometry) ring.push(e.geometry.map((n) => [n.lon, n.lat]))
    if (e.type === 'relation' && e.members) {
      const outer = e.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map((n) => [n.lon, n.lat]))
      ring.push(...chain(outer))
    }
  }
  const river = water.elements.filter((e) => e.type === 'way' && e.tags?.waterway && e.geometry).map((e) => e.geometry.map((n) => [n.lon, n.lat]))
  return { lake: areaLayer(izd, ring, tol, minW), river: strokeLayer(izd, river, tol * 1.5) }
}
const drawClass = (izd, hp, classes, tol, limit) => strokeLayer(izd, hp.filter((w) => classes.includes(w.t.highway) && (!limit || w.p.some(([lo, la]) => lo >= limit.west && lo <= limit.east && la >= limit.south && la <= limit.north))).map((w) => w.p), tol)

async function bursa() {
  const d = await city('bursa', 5000, ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street', 'pedestrian'])
  const { izd, c, b, hp } = d
  const rail = await overpass('bursa-rail.json', `[out:json][timeout:120];way["railway"~"^(light_rail|subway|tram)$"](${b});out geom;`)
  const build = await overpass('bursa-town.json', `[out:json][timeout:180];way["landuse"~"^(residential|commercial|retail)$"](${b});out geom;`)
  const de = seaArea(izd, d.ky.map((w) => w.p), 1.6)
  console.log('  kıyı', de.total, 'açık', de.open, 'kapalı', de.closedState)
  const water = waterLayer(izd, d.water, 3, 250)
  const center = { west: 28.97, east: 29.13, south: 40.15, north: 40.24 }, historical = { west: 29.04, east: 29.087, south: 40.176, north: 40.194 }
  write('bursa', {
    id: 'bursa', ad: 'Bursa', frameBorder: c, g: izd.G, y: izd.H, zMax: 12,
    attribution: ['© OpenStreetMap katkıda bulunanlar (ODbL)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    layer: {
      sea: de.path, ...water,
      town: areaLayer(izd, build.elements.filter((e) => e.geometry).map((e) => e.geometry.map((n) => [n.lon, n.lat])), 6, 1500),
      ray: strokeLayer(izd, paths(rail).map((w) => w.p), 3),
      motorway: drawClass(izd, hp, ['motorway'], 3),
      ana: drawClass(izd, hp, ['trunk', 'primary'], 3),
      secondary: drawClass(izd, hp, ['secondary'], 6),
      tertiary: drawClass(izd, hp, ['tertiary'], 3, center),
      street: drawClass(izd, hp, ['residential', 'unclassified', 'living_street', 'pedestrian'], 3, historical),
    },
    label: [...placeLabel(izd, d.ked, ['Mudanya', 'Gemlik', 'Nilüfer', 'Gürsu', 'Kestel', 'Uludağ']), roundOff(izd, 'Marmara Denizi', 28.97, 40.415, 'sea')],
  })
}

async function smallCity(ad, G) {
  const d = await city(ad, G, ['motorway', 'trunk', 'primary', 'secondary'])
  const { izd, c, hp } = d
  const de = d.ky.length ? seaArea(izd, d.ky.map((w) => w.p), 1.5) : { path: '' }
  const water = waterLayer(izd, d.water, 4, 500)
  write(ad, {
    id: ad, ad: ad === 'konya' ? 'Konya' : 'Hatay', frameBorder: c, g: izd.G, y: izd.H, zMax: 4,
    attribution: ['© OpenStreetMap katkıda bulunanlar (ODbL)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    layer: { sea: de.path, ...water, motorway: drawClass(izd, hp, ['motorway'], 3), ana: drawClass(izd, hp, ['trunk', 'primary'], 3), secondary: drawClass(izd, hp, ['secondary'], 9) },
    label: placeLabel(izd, d.ked, ad === 'konya' ? ['Selçuklu', 'Meram', 'Karatay', 'Loras Dağı'] : ['Antakya', 'Samandağ', 'Altınözü', 'Musa Dağı']),
  })
}

const target = process.argv.slice(3)
const play = async (ad, f) => { if (!target.length || target.includes(ad)) await f() }
await play('turkey', turkey)
await play('bursa', bursa)
await play('konya', () => smallCity('konya', 3000))
await play('hatay', () => smallCity('hatay', 3000))
