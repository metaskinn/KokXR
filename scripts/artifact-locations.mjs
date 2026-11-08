// Builds src/content/artifact-locations.json: a map point for every artifact, from OpenStreetMap only.
//   { "<artifactId>": { "p": [lng, lat], "k": "yapi" | "ilce", "osm"?: "way/123" } }
// "yapi": matched to a named OSM feature inside the artifact's own district (or a vrArtifacts position).
// "ilce": no safe match (none, or ambiguous), so the point is the district's admin_centre/label node.
// Matching is strict on purpose: a wrong building is worse than an honest district point.
//
// Usage:
//   GEO_CACHE=<dir> node scripts/artifact-locations.mjs           # offline, reads cached Overpass responses
//   GEO_CACHE=<dir> node scripts/artifact-locations.mjs --fetch   # fills missing cache entries from Overpass
//   add --report to print every accepted match (artifact name vs OSM name) and the rejected ambiguous ones.
//   add --city=Bursa (comma-separated) to handle only those cities; the output then holds only their entries.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const FETCH = process.argv.includes('--fetch')
const REPORT = process.argv.includes('--report')
const CITIES = process.argv.find((a) => a.startsWith('--city='))?.slice(7).split(',')
const CACHE = process.env.GEO_CACHE || join(tmpdir(), 'kokxr-geo-cache')
const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const UA = 'KokXR-prototype/1.0'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- Overpass with cache ----------
// Parallel calls start on different servers (`first`); each server gets at most one request every 2 s.
const lastRequest = new Map()
async function overpass(key, query, first = 0) {
  const file = join(CACHE, `${key}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'))
  if (!FETCH) throw new Error(`cache missing: ${file} (run with --fetch)`)
  mkdirSync(CACHE, { recursive: true })
  for (let attempt = 0; attempt < 8; attempt++) {
    const server = SERVERS[(first + attempt) % SERVERS.length]
    const wait = 2000 - (Date.now() - (lastRequest.get(server) || 0))
    if (wait > 0) await sleep(wait)
    lastRequest.set(server, Date.now())
    try {
      const res = await fetch(server, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(240000),
      })
      const text = await res.text()
      if (res.ok && text.trimStart().startsWith('{')) {
        const json = JSON.parse(text)
        if (json.remark && /runtime error|timed out/i.test(json.remark)) throw new Error(json.remark)
        writeFileSync(file, text)
        return json
      }
      if (res.status === 400) throw Object.assign(new Error(`bad query ${key}: ${text.slice(0, 400)}`), { fatal: true })
      console.error(`  ${server} -> ${res.status}, retrying`)
    } catch (e) {
      if (e.fatal) throw e
      console.error(`  ${server} -> ${e.message}, retrying`)
    }
    await sleep(5000 * 2 ** Math.min(attempt, 4))
  }
  throw new Error(`Overpass failed for ${key}`)
}

// ---------- Text normalisation ----------
const fold = (s) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[âà]/g, 'a').replace(/[îı]/g, 'i').replace(/[ûü]/g, 'u').replace(/ö/g, 'o')
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/[̀-ͯ]/g, '')
const tokenize = (s) => fold(s).replace(/[’'`]/g, '').split(/[^a-z0-9]+/).filter(Boolean)

// Type words (folded) -> canonical type.
const TYPE_WORDS = [
  ['cami', /^(camii?|camisi|cami?i|camileri|mosque)$/],
  ['mescit', /^(mescidi?|mescit|namazgah|namazgahi)$/],
  ['turbe', /^(turbesi|turbe|turbeleri|turbeler|kumbeti|kumbet|kabri|mezari|makami|makam|maqam)$/],
  ['hazire', /^(haziresi|hazire|mezarligi|mezarlik)$/],
  ['kulliye', /^(kulliyesi|kulliye)$/],
  ['medrese', /^(medresesi|medrese|darulhadis|darulkurra)$/],
  ['mektep', /^(mektebi|mektep|sibyan)$/],
  ['kutuphane', /^(kutuphanesi|kutuphane)$/],
  ['han', /^(hani|han|kervansarayi|kervansaray)$/],
  ['bedesten', /^(bedesteni|bedesten|arastasi|arasta)$/],
  ['carsi', /^(carsisi|carsi)$/],
  ['hamam', /^(hamami|hamam|hamamlari)$/],
  ['cesme', /^(cesmesi|cesme|sebili|sebil|sadirvani|sadirvan)$/],
  ['kopru', /^(koprusu|kopru)$/],
  ['tekke', /^(tekkesi|tekke|zaviyesi|zaviye|dergahi|dergah|hanikahi|hankah)$/],
  ['imaret', /^(imareti|imaret)$/],
  ['minare', /^(minaresi|minare)$/],
  ['kilise', /^(kilisesi|kilise|church)$/],
]
const typeOf = (tok) => TYPE_WORDS.find(([, re]) => re.test(tok))?.[0]
// For an artifact type, which OSM types may stand for the same place.
const COMPAT = {
  cami: ['cami', 'mescit', 'kulliye'],
  mescit: ['mescit', 'cami'],
  kulliye: ['kulliye', 'cami'],
  turbe: ['turbe'],
  hazire: ['hazire'],
  tekke: ['tekke', 'turbe', 'cami', 'mescit'],
  medrese: ['medrese'],
  mektep: ['mektep'],
  kutuphane: ['kutuphane'],
  han: ['han'],
  bedesten: ['bedesten'],
  carsi: ['carsi'],
  hamam: ['hamam'],
  cesme: ['cesme'],
  kopru: ['kopru'],
  imaret: ['imaret'],
  minare: ['minare', 'cami', 'mescit'],
  kilise: ['kilise'],
}
// Words that carry no identity: dropped from both sides.
const STOP = new Set([
  've', 'ile', 'koyu', 'koy', 'beldesi', 'mahallesi', 'mah', 'tarihi', 'bursa', 'konya', 'hatay',
  'i', 'ii', 'iii', 'iv', 'v', 'the', 'of', 'eski', 'yikik', 'kalintisi', 'harabesi', 'ruins',
])
// Words that are too common to identify a building on their own.
const GENERIC = new Set(['ulu', 'yeni', 'merkez', 'buyuk', 'kucuk', 'carsi', 'cuma', 'kale', 'yukari', 'asagi', 'orta', 'koy'])

// Turkish spelling variants: final d/t, b/p, c/ç already folded; murad/murat, mehmed/mehmet.
const stem = (t) => t.replace(/d$/, 't').replace(/b$/, 'p').replace(/g$/, 'k')
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
const same = (a, b) => a === b || stem(a) === stem(b) || (a.length >= 6 && b.length >= 6 && lev(a, b) <= 1)

// Splits a name into { types, core } after removing district/city words.
function analyse(name, districtTokens) {
  const types = new Set()
  const core = []
  for (const tok of tokenize(name)) {
    const t = typeOf(tok)
    if (t) types.add(t)
    else if (!STOP.has(tok) && !districtTokens.has(tok)) core.push(tok)
  }
  return { types, core }
}

// OSM type from tags when the name does not say it.
function osmTagTypes(tags) {
  const out = new Set()
  if (tags.amenity === 'place_of_worship') {
    if (tags.religion === 'christian') out.add('kilise')
    else if (tags.religion === 'muslim' || /^(mosque)$/.test(tags.building || '')) out.add('cami')
  }
  if (tags.building === 'mosque') out.add('cami')
  if (/^(church|chapel|cathedral)$/.test(tags.building || '')) out.add('kilise')
  if (tags.historic === 'tomb' || tags.tomb) out.add('turbe')
  if (tags.amenity === 'public_bath') out.add('hamam')
  if (/^(fountain|drinking_water)$/.test(tags.amenity || '')) out.add('cesme')
  if (tags.amenity === 'madrasa') out.add('medrese')
  if (tags.amenity === 'grave_yard' || tags.landuse === 'cemetery') out.add('hazire')
  if (tags.man_made === 'bridge' || tags.bridge) out.add('kopru')
  if (tags.historic === 'caravanserai') out.add('han')
  return out
}

const dist = (a, b) => {
  const k = Math.PI / 180
  const x = (b[0] - a[0]) * k * Math.cos(((a[1] + b[1]) / 2) * k)
  const y = (b[1] - a[1]) * k
  return Math.sqrt(x * x + y * y) * 6371000
}
const round = (v) => Math.round(v * 1e5) / 1e5

// ---------- Inputs ----------
const ARTDIR = 'src/content/artifacts'
const artifacts = readdirSync(ARTDIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(ARTDIR, f), 'utf8')))
  .filter((a) => !CITIES || CITIES.includes(a.city))

const vrSource = readFileSync('src/content/vrArtifacts.ts', 'utf8')
const vr = new Map()
for (const m of vrSource.matchAll(/artifactId:\s*'([^']+)',\s*position:\s*\[([\d.]+),\s*([\d.]+)\]/g))
  vr.set(m[1], [Number(m[2]), Number(m[3])])

// ---------- Fetch districts and features ----------
// Two requests per province, sent in parallel to different servers: district boundaries
// (with geometry and admin_centre/label members) and every candidate feature in the province.
// Each feature is then placed in its district locally by point-in-polygon.
const PROVINCE_DISTRICTS = {}
for (const a of artifacts) (PROVINCE_DISTRICTS[a.city] ||= new Set()).add(a.district)

// Even-odd ray casting over every member way segment (outer and inner rings together).
function inside(pt, segments) {
  let c = false
  for (const [a, b] of segments)
    if (a.lat > pt[1] !== b.lat > pt[1] && pt[0] < ((b.lon - a.lon) * (pt[1] - a.lat)) / (b.lat - a.lat) + a.lon) c = !c
  return c
}

const districtInfo = new Map() // "city|district" -> { relId, centre, elements, name }
const missingCentre = []
for (const [city, districts] of Object.entries(PROVINCE_DISTRICTS)) {
  const province = `area["name"="${city}"]["admin_level"="4"]["boundary"="administrative"]->.p;`
  const [bounds, all] = await Promise.all([
    overpass(
      `bounds-${fold(city)}`,
      `[out:json][timeout:180];
${province}
rel(area.p)["boundary"="administrative"]["admin_level"="6"];
out geom;`,
      0,
    ),
    overpass(
      `features-${fold(city)}-all`,
      `[out:json][timeout:180];
${province}
(
  nwr(area.p)["amenity"="place_of_worship"]["name"];
  nwr(area.p)["building"~"^(mosque|church|chapel|cathedral|religious|shrine)$"]["name"];
  nwr(area.p)["historic"]["name"];
  nwr(area.p)["amenity"~"^(fountain|public_bath|drinking_water|madrasa|marketplace|grave_yard)$"]["name"];
  nwr(area.p)["tourism"~"^(attraction|museum)$"]["name"];
  nwr(area.p)["name"~"Türbe|Hamam|Han|Medrese|Çeşme|Tekke|Zaviye|İmaret|Kümbet|Köprü|Bedesten|Kervansaray|Sebil|Mescit|Mescid|Cami|Kilise|Dergâh|Dergah|Makam|Hazire|Külliye|Arasta|Mektep|Kütüphane",i];
  node(area.p)["place"~"^(neighbourhood|suburb|quarter|village|town|hamlet)$"];
);
out center tags;`,
      1,
    ),
  ])
  const rels = bounds.elements.filter((e) => e.type === 'relation')
  const segs = new Map()
  for (const r of rels) {
    const s = []
    for (const m of r.members || [])
      if (m.type === 'way' && m.geometry && m.role !== 'subarea')
        for (let i = 1; i < m.geometry.length; i++) s.push([m.geometry[i - 1], m.geometry[i]])
    segs.set(r.id, s)
  }
  const posOf = (e) => (e.lat != null ? [e.lon, e.lat] : e.center ? [e.center.lon, e.center.lat] : null)
  const byRel = new Map(rels.map((r) => [r.id, []]))
  for (const e of all.elements) {
    const p = posOf(e)
    if (!p) continue
    const r = rels.find((r) => inside(p, segs.get(r.id)))
    if (r) byRel.get(r.id).push(e)
  }
  for (const district of districts) {
    const named = rels.filter((r) => r.tags.name?.toLocaleLowerCase('tr') === district.toLocaleLowerCase('tr'))
    if (named.length > 1) console.error(`  warning: ${named.length} relations named ${district}: ${named.map((r) => r.id)}`)
    const rel = named[0]
    if (!rel) {
      missingCentre.push(`${city}/${district} (no relation)`)
      continue
    }
    const member = (role) => rel.members.find((m) => m.type === 'node' && m.role === role && m.lat != null)
    const c = member('admin_centre') || member('label')
    const centre = c ? [c.lon, c.lat] : null
    if (!centre) missingCentre.push(`${city}/${district}`)
    else if (!inside(centre, segs.get(rel.id))) console.error(`  warning: centre of ${district} outside its polygon`)
    districtInfo.set(`${city}|${district}`, { relId: rel.id, centre, elements: byRel.get(rel.id), name: district })
  }
}

// ---------- Matching ----------
const MAHALLE_RE = /([A-ZÇĞİÖŞÜ][\wçğıöşüâîû]+(?:\s[A-ZÇĞİÖŞÜ][\wçğıöşüâîû]+)?)\s(?:Mahallesi|Mah\.|Köyü|Beldesi|semti)/g

function prepareDistrict(info) {
  const dTokens = new Set(tokenize(info.name))
  const places = []
  const feats = []
  for (const e of info.elements) {
    const tags = e.tags || {}
    const pos = e.type === 'node' ? (e.lat != null ? [e.lon, e.lat] : null) : e.center ? [e.center.lon, e.center.lat] : null
    if (tags.place && !tags.amenity && !tags.historic) {
      if (e.lat != null) places.push({ name: tokenize(tags.name || '').join(' '), pos: [e.lon, e.lat] })
      continue
    }
    if (!pos || !tags.name) continue
    const names = [tags.name, tags['name:tr'], tags.alt_name, tags.old_name, tags.official_name].filter(Boolean)
    const variants = names.flatMap((n) => n.split(/\s*[;/]\s*/)).map((n) => {
      const a = analyse(n, dTokens)
      for (const t of osmTagTypes(tags)) a.types.add(t)
      return a
    })
    const addr = tokenize([tags['addr:suburb'], tags['addr:neighbourhood'], tags['addr:quarter'], tags['addr:village']].filter(Boolean).join(' '))
    feats.push({ id: `${e.type}/${e.id}`, type: e.type, name: tags.name, tags, pos, variants, addr })
  }
  return { dTokens, places, feats }
}

// Variant names of an artifact: full name, name without parentheses, the parenthetical as an alternative.
function artifactVariants(a, dTokens) {
  const raw = [a.name]
  const paren = a.name.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/)
  if (paren) {
    raw.push(`${paren[1]} ${paren[3]}`)
    const lastWord = paren[3] || ''
    raw.push(`${paren[2]} ${lastWord}`)
  }
  for (const part of a.name.split(/\s+[–—/-]\s+|\s*\/\s*/)) if (part !== a.name) raw.push(part)
  const seen = new Set()
  return raw
    .map((n) => ({ text: n, ...analyse(n.replace(/[()]/g, ' '), dTokens) }))
    // "X Camii ve Haziresi": try the first (main) type alone before all types.
    .flatMap((v) => (v.types.size > 1 ? [{ ...v, types: new Set([[...v.types][0]]) }, v] : [v]))
    .filter((v) => {
      const k = [...v.types].sort().join() + '|' + v.core.join(' ')
      if (seen.has(k) || !v.types.size || !v.core.length) return false
      seen.add(k)
      return true
    })
}

// How well an artifact variant fits an OSM name variant: 2 exact core, 1 explained superset, 0 no.
function fit(av, ov, artText) {
  const compatible = [...av.types].some((t) => COMPAT[t].some((o) => ov.types.has(o)))
  if (!compatible) return 0
  if (!ov.core.length) return 0
  const used = new Set()
  for (const t of av.core) {
    const i = ov.core.findIndex((o, k) => !used.has(k) && same(t, o))
    if (i < 0) return 0
    used.add(i)
  }
  const extra = ov.core.filter((_, k) => !used.has(k))
  if (!extra.length) return 2
  // Extra OSM words must be explained by the artifact's own text (e.g. the village or mahalle name).
  const explained = extra.every((x) => artText.some((w) => same(w, x)))
  const onlyGeneric = av.core.every((t) => GENERIC.has(t))
  return explained && !onlyGeneric ? 1 : 0
}

const out = {}
const accepted = []
const ambiguous = []
const prepared = new Map()
for (const a of artifacts) {
  const key = `${a.city}|${a.district}`
  const info = districtInfo.get(key)
  if (vr.has(a.id)) {
    out[a.id] = { p: vr.get(a.id).map(round), k: 'yapi' }
    continue
  }
  if (!info) throw new Error(`no district data for ${key}`)
  if (!prepared.has(key)) prepared.set(key, prepareDistrict(info))
  const { dTokens, places, feats } = prepared.get(key)
  const text = `${a.name} ${a.summary || ''} ${a.history || ''}`
  const artText = tokenize(text)
  const fallback = () => {
    if (!info.centre) throw new Error(`no centre for ${key}`)
    out[a.id] = { p: info.centre.map(round), k: 'ilce' }
  }

  let best = null
  for (const [vi, av] of artifactVariants(a, dTokens).entries()) {
    const cands = []
    for (const f of feats) {
      const score = Math.max(...f.variants.map((ov) => fit(av, ov, artText)))
      if (score) cands.push({ f, score })
    }
    if (!cands.length) continue
    const top = Math.max(...cands.map((c) => c.score))
    let pool = cands.filter((c) => c.score === top).map((c) => c.f)
    // One building often appears as several OSM objects (node + way, mosque + minaret): merge those within 150 m.
    const clusters = []
    for (const f of pool) {
      const c = clusters.find((cl) => cl.some((g) => dist(g.pos, f.pos) < 150))
      if (c) c.push(f)
      else clusters.push([f])
    }
    let chosen = null
    if (clusters.length === 1) chosen = clusters[0]
    else {
      // Use the mahalle / village named in the artifact's text.
      const mahalles = [...text.matchAll(MAHALLE_RE)].map((m) => tokenize(m[1]).join(' '))
      const byAddr = clusters.filter((cl) => cl.some((f) => mahalles.some((m) => m && f.addr.join(' ').includes(m))))
      if (byAddr.length === 1) chosen = byAddr[0]
      else {
        const anchors = places.filter((p) => mahalles.includes(p.name)).map((p) => p.pos)
        if (anchors.length) {
          const d = clusters.map((cl) => Math.min(...anchors.flatMap((p) => cl.map((f) => dist(p, f.pos)))))
          const order = d.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0])
          if (order[0][0] < 1500 && order[1][0] > 3 * order[0][0]) chosen = clusters[order[0][1]]
        }
      }
      if (!chosen) {
        ambiguous.push({ a, cands: clusters.map((cl) => cl[0]) })
        best = 'ambiguous'
        break
      }
    }
    // Prefer a way/relation (the building outline) over a node inside the same cluster.
    const pick = chosen.find((f) => f.type !== 'node') || chosen[0]
    best = { f: pick, variant: vi, score: top }
    break
  }
  if (best && best !== 'ambiguous') {
    out[a.id] = { p: best.f.pos.map(round), k: 'yapi', osm: best.f.id }
    accepted.push({ a, f: best.f, score: best.score })
  } else fallback()
}

// Every artifact must have an entry and sit in its own district's data.
for (const a of artifacts) if (!out[a.id]) throw new Error(`missing ${a.id}`)
const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]))
writeFileSync('src/content/artifact-locations.json', JSON.stringify(sorted, null, 1) + '\n')

const stats = {}
for (const a of artifacts) {
  const s = (stats[a.city] ||= { yapi: 0, ilce: 0 })
  s[out[a.id].k]++
}
console.log('written', Object.keys(sorted).length, 'entries', stats)
console.log('ambiguous rejected:', ambiguous.length, 'vr:', vr.size)
if (missingCentre.length) console.log('districts without centre:', missingCentre.join(', '))
if (REPORT) {
  for (const { a, f, score } of accepted)
    console.log(`OK ${score} | ${a.district} | ${a.name}  =>  ${f.name} [${f.id}] ${f.tags.amenity || f.tags.historic || f.tags.building || ''}`)
  for (const { a, cands } of ambiguous)
    console.log(`AMB | ${a.district} | ${a.name}  =>  ${cands.map((c) => `${c.name} [${c.id}]`).join(' ; ')}`)
}
