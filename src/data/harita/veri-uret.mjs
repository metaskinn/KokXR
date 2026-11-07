// Harita verisini kaynaktan yeniden üretir. Uygulama çalışırken kullanılmaz; ağ yalnız bu betikte gerekir.
// Kullanım: node src/data/harita/veri-uret.mjs <ham-veri-klasörü>
// İner ve önbelleğe alınır: Natural Earth GeoJSON, tek seferlik OSM Overpass sorguları, Terrain Tiles yükseklik paftaları.
// OSM tile sunucusu kullanılmaz. Kabartma WebP'si Chromium tuvalinde (Playwright) üretilir.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HAM = process.argv[2]
if (!HAM) throw new Error('Ham veri klasörünü verin')
fs.mkdirSync(HAM, { recursive: true })
const CIKTI = path.dirname(fileURLToPath(import.meta.url))
const UA = 'KokXR-hackathon-prototip/1.0 (tek seferlik veri cikarimi)'
const uyu = (ms) => new Promise((c) => setTimeout(c, ms))

// ---- İndirme ----
async function onbellek(ad, uret) {
  const y = path.join(HAM, ad)
  if (fs.existsSync(y)) return fs.readFileSync(y)
  const v = await uret()
  fs.writeFileSync(y, v)
  return v
}
const NE = (ad) => onbellek(ad, async () => {
  const r = await fetch(`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/${ad}`, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${ad}: ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}).then((b) => JSON.parse(b))
const SUNUCULAR = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const overpass = (ad, q) => onbellek(ad, async () => {
  let son
  for (let tur = 0; tur < 4; tur++) for (const s of SUNUCULAR) {
    try {
      const r = await fetch(s, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(200000) })
      const t = await r.text()
      if (r.ok && t.startsWith('{') && !JSON.parse(t).remark?.includes('error')) return t
      son = `${s} ${r.status} ${t.slice(0, 120)}`
    } catch (e) { son = `${s} ${e}` }
    console.error('Overpass yeniden denenecek:', son)
    await uyu(20000)
  }
  throw new Error(`Overpass ${ad}: ${son}`)
}).then((b) => JSON.parse(b))

// ---- İzdüşüm ve geometri ----
const mx = (lon) => (lon + 180) / 360
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2
function izdusum(c, G) {
  const x0 = mx(c.bati), x1 = mx(c.dogu), y0 = my(c.kuzey), y1 = my(c.guney)
  const k = G / (x1 - x0), H = Math.round((y1 - y0) * k)
  return { G, H, p: ([lon, lat]) => [(mx(lon) - x0) * k, (my(lat) - y0) * k], x0, x1, y0, y1 }
}
function dp(pts, tol) {
  if (pts.length < 3) return pts
  const tut = new Uint8Array(pts.length); tut[0] = tut[pts.length - 1] = 1
  const yigin = [[0, pts.length - 1]]
  while (yigin.length) {
    const [a, b] = yigin.pop()
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
    if (enb > tol * tol) { tut[i] = 1; yigin.push([a, i], [i, b]) }
  }
  return pts.filter((_, i) => tut[i])
}
/** Çizgiyi dikdörtgene kırpar (Liang-Barsky); dışarı çıkınca parçalara böler. */
function cizgiKirp(pts, x0, y0, x1, y1) {
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
function halkaKirp(h, x0, y0, x1, y1) {
  const kes = (poly, ic, kesim) => {
    const o = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]
      if (ic(a)) { o.push(a); if (!ic(b)) o.push(kesim(a, b)) } else if (ic(b)) o.push(kesim(a, b))
    }
    return o
  }
  const dX = (v) => (a, b) => [v, a[1] + ((v - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]
  const dY = (v) => (a, b) => [a[0] + ((v - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), v]
  let p = h
  p = kes(p, (a) => a[0] >= x0, dX(x0)); if (!p.length) return p
  p = kes(p, (a) => a[0] <= x1, dX(x1)); if (!p.length) return p
  p = kes(p, (a) => a[1] >= y0, dY(y0)); if (!p.length) return p
  return kes(p, (a) => a[1] <= y1, dY(y1))
}
const alan = (h) => { let a = 0; for (let i = 0; i < h.length; i++) { const [x, y] = h[i], [u, v] = h[(i + 1) % h.length]; a += x * v - u * y } return a / 2 }
/** Tam sayı ızgarada göreli SVG yolu: mümkün olan en kısa metin. */
function yol(parcalar, kapali = false) {
  let s = ''
  for (const pts of parcalar) {
    let lx = Math.round(pts[0][0]), ly = Math.round(pts[0][1]), yaz = '', n = 0
    for (let i = 1; i < pts.length; i++) {
      const x = Math.round(pts[i][0]), y = Math.round(pts[i][1]), dx = x - lx, dy = y - ly
      if (!dx && !dy) continue
      yaz += (n ? (dx < 0 ? '' : ' ') : '') + dx + (dy < 0 ? '' : ' ') + dy
      lx = x; ly = y; n++
    }
    if (!n) continue
    s += `M${Math.round(pts[0][0])} ${Math.round(pts[0][1])}l${yaz}${kapali ? 'z' : ''}`
  }
  return s
}
/** Uç noktaları aynı çizgileri birleştirir: daha az M, daha az bayt, daha temiz sadeleştirme. */
function zincirle(cizgiler) {
  const anahtar = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`
  const uc = new Map()
  const ekle = (k, c) => { if (!uc.has(k)) uc.set(k, new Set()); uc.get(k).add(c) }
  const kume = new Set(cizgiler.map((c) => ({ p: c })))
  for (const c of kume) { ekle(anahtar(c.p[0]), c); ekle(anahtar(c.p.at(-1)), c) }
  const sil = (k, c) => uc.get(k)?.delete(c)
  const sonuc = []
  for (const c of kume) {
    if (c.bitti) continue
    c.bitti = true
    sil(anahtar(c.p[0]), c); sil(anahtar(c.p.at(-1)), c)
    let p = c.p
    for (let yon = 0; yon < 2; yon++) {
      for (;;) {
        const k = anahtar(p.at(-1)), adaylar = [...(uc.get(k) ?? [])]
        if (adaylar.length !== 1) break
        const d = adaylar[0]
        d.bitti = true
        sil(anahtar(d.p[0]), d); sil(anahtar(d.p.at(-1)), d)
        p = p.concat((anahtar(d.p[0]) === k ? d.p : [...d.p].reverse()).slice(1))
      }
      p = [...p].reverse()
    }
    sonuc.push(p)
  }
  return sonuc
}
const halkalar = (g) => g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : []
const cizgiler = (g) => g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
const yollar = (d) => d.elements.filter((e) => e.type === 'way' && e.geometry).map((e) => ({ t: e.tags ?? {}, p: e.geometry.map((n) => [n.lon, n.lat]) }))
const bb = (c) => `${c.guney},${c.bati},${c.kuzey},${c.dogu}`
function cizgiKatmani(izd, ham, tol) {
  const pay = 5
  const pr = ham.map((c) => c.map(izd.p))
  const krp = zincirle(pr).flatMap((c) => cizgiKirp(c, -pay, -pay, izd.G + pay, izd.H + pay))
  return yol(krp.map((c) => dp(c, tol)).filter((c) => c.length > 1))
}
function alanKatmani(izd, ham, tol, enAz = 0) {
  const pay = 5
  const krp = ham.map((h) => halkaKirp(h.map(izd.p), -pay, -pay, izd.G + pay, izd.H + pay)).filter((h) => h.length > 2)
  return yol(krp.map((h) => dp(h, tol)).filter((h) => h.length > 2 && Math.abs(alan(h)) >= enAz), true)
}
/**
 * OSM kıyı çizgisinden deniz alanı: kıyı yolları karada solda kalacak yönde çizilir, yani deniz sağdadır.
 * Çerçeveden çıkan zincir, saat yönünde çerçeve kenarını izleyerek sonraki girişe bağlanır.
 */
function denizAlani(izd, kiyi, tol) {
  const { G, H } = izd
  const parcalar = zincirle(kiyi.map((c) => c.map(izd.p))).flatMap((c) => cizgiKirp(c, 0, 0, G, H))
  // y aşağı bakan ekranda saat yönü: üst (soldan sağa), sağ, alt, sol
  const konum = ([x, y]) => {
    const e = 0.01
    if (Math.abs(y) < e) return x
    if (Math.abs(x - G) < e) return G + y
    if (Math.abs(y - H) < e) return G + H + (G - x)
    if (Math.abs(x) < e) return 2 * G + H + (H - y)
    return null
  }
  const koseler = [[G, 0, G], [G, H, G + H], [0, H, 2 * G + H], [0, 0, 2 * G + 2 * H]]
  const acik = parcalar.filter((c) => konum(c[0]) !== null && konum(c.at(-1)) !== null)
  const kapali = parcalar.filter((c) => !acik.includes(c) && Math.hypot(c[0][0] - c.at(-1)[0], c[0][1] - c.at(-1)[1]) < 1)
  const halka = []
  const kalan = new Set(acik)
  while (kalan.size) {
    const bas = kalan.values().next().value
    let p = [], akt = bas
    for (;;) {
      kalan.delete(akt)
      p = p.concat(dp(akt, tol))
      const cik = konum(akt.at(-1))
      let sonraki = null, enaz = Infinity
      for (const a of [bas, ...kalan]) {
        const d = (konum(a[0]) - cik + 2 * (G + H)) % (2 * (G + H))
        if (d < enaz) { enaz = d; sonraki = a }
      }
      const hedef = konum(sonraki[0])
      for (const [x, y, k] of [...koseler, ...koseler.map(([x, y, k]) => [x, y, k + 2 * (G + H)])]) {
        const u = hedef < cik ? hedef + 2 * (G + H) : hedef
        if (k > cik && k < u) p.push([x, y])
      }
      if (sonraki === bas) break
      akt = sonraki
    }
    halka.push(p)
  }
  return { yol: yol(halka, true) + yol(kapali.map((c) => dp(c, tol)), true), acik: acik.length, kapali: kapali.length, toplam: parcalar.length }
}

// ---- Haritalar ----
const CERCEVE = {
  turkiye: { bati: 25.2, dogu: 45.2, guney: 35.35, kuzey: 42.6 },
  bursa: { bati: 28.7, dogu: 29.42, guney: 40.03, kuzey: 40.44 },
  konya: { bati: 32.2, dogu: 32.78, guney: 37.7, kuzey: 38.06 },
  hatay: { bati: 35.86, dogu: 36.46, guney: 36.0, kuzey: 36.42 },
}
const yaz = (ad, v) => { const s = JSON.stringify(v); fs.writeFileSync(path.join(CIKTI, `${ad}.json`), s + '\n'); console.log(ad, s.length, Object.fromEntries(Object.entries(v.katman).map(([k, x]) => [k, x.length]))) }
const yuvarla = (izd, ad, lon, lat, tur, z) => { const [x, y] = izd.p([lon, lat]); return { ad, x: Math.round(x), y: Math.round(y), tur, ...(z ? { z } : {}) } }

async function turkiye() {
  const c = CERCEVE.turkiye, izd = izdusum(c, 2000)
  const [ulke, kara, il, gol, nehir, yer] = await Promise.all(['ne_10m_admin_0_countries.geojson', 'ne_10m_land.geojson', 'ne_10m_admin_1_states_provinces.geojson', 'ne_10m_lakes.geojson', 'ne_10m_rivers_lake_centerlines.geojson', 'ne_10m_populated_places_simple.geojson'].map(NE))
  const trYer = yer.features.filter((f) => f.properties.adm0_a3 === 'TUR')
  const sehirE = (ad, ara) => { const f = trYer.find((f) => ara.test(f.properties.name)); if (!f) { console.log('  etiket yok:', ad); return [] } return [yuvarla(izd, ad, ...f.geometry.coordinates, 'sehir')] }
  const tr = ulke.features.filter((f) => f.properties.ADM0_A3 === 'TUR').flatMap((f) => halkalar(f.geometry))
  // İller arası çizgi: iki ilin paylaştığı kenarlar bir kez yazılır.
  const iller = il.features.filter((f) => f.properties.adm0_a3 === 'TUR')
  const kenar = new Map()
  const an = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`
  for (const f of iller) for (const h of halkalar(f.geometry)) for (let i = 1; i < h.length; i++) {
    const a = an(h[i - 1]), b = an(h[i]), k = a < b ? a + '|' + b : b + '|' + a
    const e = kenar.get(k); if (e) e.n++; else kenar.set(k, { n: 1, p: [h[i - 1], h[i]] })
  }
  const icKenar = [...kenar.values()].filter((e) => e.n === 2).map((e) => e.p)
  const ozelIl = (ad) => iller.filter((f) => f.properties.name === ad).flatMap((f) => halkalar(f.geometry))
  for (const ad of ['Bursa', 'Konya', 'Hatay']) if (!ozelIl(ad).length) throw new Error(`İl yok: ${ad}`)
  const golH = gol.features.flatMap((f) => halkalar(f.geometry))
  const nehirC = nehir.features.filter((f) => (f.properties.scalerank ?? 9) <= 7).flatMap((f) => cizgiler(f.geometry))
  const G = izd.G, H = izd.H
  yaz('turkiye', {
    id: 'turkiye', ad: 'Türkiye', cerceve: c, g: G, y: H, zEnCok: 1,
    atif: ['Natural Earth (kamu malı)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    katman: {
      kara: `M0 0H${G}V${H}H0z` + alanKatmani(izd, kara.features.flatMap((f) => halkalar(f.geometry)), 1.1, 3),
      ulke: alanKatmani(izd, tr, 1.1, 3),
      il: cizgiKatmani(izd, icKenar, 2.4),
      gol: alanKatmani(izd, golH, 1, 6),
      nehir: cizgiKatmani(izd, nehirC, 2),
      ozel: alanKatmani(izd, ['Bursa', 'Konya', 'Hatay'].flatMap(ozelIl), 1.1, 3),
    },
    etiket: [
      ...[['İstanbul', /^Istanbul/], ['Ankara', /^Ankara/], ['İzmir', /zmir/], ['Antalya', /^Antalya/], ['Samsun', /^Samsun/], ['Trabzon', /^Trabzon/], ['Erzurum', /^Erzurum/], ['Diyarbakır', /^Diyarbak/], ['Van', /^Van$/]].flatMap(([a, r]) => sehirE(a, r)),
      yuvarla(izd, 'Karadeniz', 34.5, 42.25, 'deniz'), yuvarla(izd, 'Akdeniz', 31.6, 35.75, 'deniz'), yuvarla(izd, 'Ege Denizi', 26.25, 37.3, 'deniz'),
    ],
  })
}

async function sehir(ad, G, sinif, ozellik) {
  const c = CERCEVE[ad], izd = izdusum(c, G), b = bb(c)
  const hp = await overpass(`${ad}-yol.json`, `[out:json][timeout:180];way["highway"~"^(${sinif.join('|')})$"](${b});out geom;`)
  const ky = await overpass(`${ad}-kiyi.json`, `[out:json][timeout:120];way["natural"="coastline"](${c.guney - 0.2},${c.bati - 0.2},${c.kuzey + 0.2},${c.dogu + 0.2});out geom;`)
  const su = await overpass(`${ad}-su.json`, `[out:json][timeout:120];(way["natural"="water"](${b});rel["natural"="water"](${b});way["waterway"="river"](${b}););out geom;`)
  const ked = await overpass(`${ad}-yer.json`, `[out:json][timeout:60];(node["place"~"^(city|town)$"](${b});node["natural"="peak"]["name"](${b}););out tags center;`)
  return { c, izd, b, hp: yollar(hp), ky: yollar(ky), su, ked }
}
/** OSM yer düğümlerinden seçili etiketler; yükseklik OSM'de yazılıysa zirve adının altına eklenir. */
const yerEtiketi = (izd, ked, adlar) => adlar.map((ad) => {
  const e = ked.elements.find((n) => n.tags.name === ad)
  if (!e) throw new Error(`Yer yok: ${ad}`)
  const zirve = e.tags.natural === 'peak'
  return { ...yuvarla(izd, ad, e.lon, e.lat, zirve ? 'zirve' : 'sehir'), ...(zirve && e.tags.ele ? { alt: `${e.tags.ele} m` } : {}) }
})
function suKatmani(izd, su, tol, enAz) {
  const halka = []
  for (const e of su.elements) {
    if (e.type === 'way' && e.tags?.natural === 'water' && e.geometry) halka.push(e.geometry.map((n) => [n.lon, n.lat]))
    if (e.type === 'relation' && e.members) {
      const dis = e.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map((n) => [n.lon, n.lat]))
      halka.push(...zincirle(dis))
    }
  }
  const nehir = su.elements.filter((e) => e.type === 'way' && e.tags?.waterway && e.geometry).map((e) => e.geometry.map((n) => [n.lon, n.lat]))
  return { gol: alanKatmani(izd, halka, tol, enAz), nehir: cizgiKatmani(izd, nehir, tol * 1.5) }
}
const sinifCiz = (izd, hp, siniflar, tol, sinir) => cizgiKatmani(izd, hp.filter((w) => siniflar.includes(w.t.highway) && (!sinir || w.p.some(([lo, la]) => lo >= sinir.bati && lo <= sinir.dogu && la >= sinir.guney && la <= sinir.kuzey))).map((w) => w.p), tol)

async function bursa() {
  const d = await sehir('bursa', 5000, ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street', 'pedestrian'])
  const { izd, c, b, hp } = d
  const ray = await overpass('bursa-ray.json', `[out:json][timeout:120];way["railway"~"^(light_rail|subway|tram)$"](${b});out geom;`)
  const yap = await overpass('bursa-kent.json', `[out:json][timeout:180];way["landuse"~"^(residential|commercial|retail)$"](${b});out geom;`)
  const de = denizAlani(izd, d.ky.map((w) => w.p), 1.6)
  console.log('  kıyı', de.toplam, 'açık', de.acik, 'kapalı', de.kapali)
  const su = suKatmani(izd, d.su, 3, 250)
  const merkez = { bati: 28.97, dogu: 29.13, guney: 40.15, kuzey: 40.24 }, tarihi = { bati: 29.04, dogu: 29.087, guney: 40.176, kuzey: 40.194 }
  yaz('bursa', {
    id: 'bursa', ad: 'Bursa', cerceve: c, g: izd.G, y: izd.H, zEnCok: 12,
    atif: ['© OpenStreetMap katkıda bulunanlar (ODbL)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    katman: {
      deniz: de.yol, ...su,
      kent: alanKatmani(izd, yap.elements.filter((e) => e.geometry).map((e) => e.geometry.map((n) => [n.lon, n.lat])), 6, 1500),
      ray: cizgiKatmani(izd, yollar(ray).map((w) => w.p), 3),
      otoyol: sinifCiz(izd, hp, ['motorway'], 3),
      ana: sinifCiz(izd, hp, ['trunk', 'primary'], 3),
      ikincil: sinifCiz(izd, hp, ['secondary'], 6),
      ucuncul: sinifCiz(izd, hp, ['tertiary'], 3, merkez),
      sokak: sinifCiz(izd, hp, ['residential', 'unclassified', 'living_street', 'pedestrian'], 3, tarihi),
    },
    etiket: [...yerEtiketi(izd, d.ked, ['Mudanya', 'Gemlik', 'Nilüfer', 'Gürsu', 'Kestel', 'Uludağ']), yuvarla(izd, 'Marmara Denizi', 28.97, 40.415, 'deniz')],
  })
}

async function kucukSehir(ad, G) {
  const d = await sehir(ad, G, ['motorway', 'trunk', 'primary', 'secondary'])
  const { izd, c, hp } = d
  const de = d.ky.length ? denizAlani(izd, d.ky.map((w) => w.p), 1.5) : { yol: '' }
  const su = suKatmani(izd, d.su, 4, 500)
  yaz(ad, {
    id: ad, ad: ad === 'konya' ? 'Konya' : 'Hatay', cerceve: c, g: izd.G, y: izd.H, zEnCok: 4,
    atif: ['© OpenStreetMap katkıda bulunanlar (ODbL)', 'Kabartma: Terrain Tiles (SRTM, kaynak: AWS Open Data)'],
    katman: { deniz: de.yol, ...su, otoyol: sinifCiz(izd, hp, ['motorway'], 3), ana: sinifCiz(izd, hp, ['trunk', 'primary'], 3), ikincil: sinifCiz(izd, hp, ['secondary'], 9) },
    etiket: yerEtiketi(izd, d.ked, ad === 'konya' ? ['Selçuklu', 'Meram', 'Karatay', 'Loras Dağı'] : ['Antakya', 'Samandağ', 'Altınözü', 'Musa Dağı']),
  })
}

const hedef = process.argv.slice(3)
const cal = async (ad, f) => { if (!hedef.length || hedef.includes(ad)) await f() }
await cal('turkiye', turkiye)
await cal('bursa', bursa)
await cal('konya', () => kucukSehir('konya', 3000))
await cal('hatay', () => kucukSehir('hatay', 3000))
