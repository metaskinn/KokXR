// Kabartma görsellerini üretir: Terrain Tiles (terrarium) paftalarından tepe gölgesi + yükseklik tonu.
// Kullanım: node src/data/harita/kabartma-uret.mjs <ham-veri-klasörü>
// Çerçeve JSON'dan okunur, görsel Web Mercator'da çerçeveye tam oturur. Deniz ve komşu ülke üstten SVG ile örtülür.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const RAW = process.argv[2]
const OUTPUT = path.dirname(fileURLToPath(import.meta.url))
const UA = 'KokXR-hackathon-prototip/1.0 (tek seferlik veri cikarimi)'
const SETTING = {
  turkey: { z: 6, en: 640, quality: 0.25, vertical: 9, toneScale: 3200 },
  bursa: { z: 11, en: 680, quality: 0.27, vertical: 1, toneScale: 2600 },
  konya: { z: 10, en: 400, quality: 0.25, vertical: 1, toneScale: 2600 },
  hatay: { z: 10, en: 400, quality: 0.25, vertical: 1, toneScale: 2600 },
}
const mx = (lon) => (lon + 180) / 360
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2

async function mapSheet(z, x, y) {
  const y1 = path.join(RAW, `terrarium-${z}-${x}-${y}.png`)
  if (!fs.existsSync(y1)) {
    const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, { headers: { 'User-Agent': UA } })
    if (!r.ok) throw new Error(`pafta ${z}/${x}/${y}: ${r.status}`)
    fs.writeFileSync(y1, Buffer.from(await r.arrayBuffer()))
  }
  return fs.readFileSync(y1).toString('base64')
}

const browser = await chromium.launch({ channel: 'chromium', args: ['--no-sandbox'] })
const page = await browser.newPage()
for (const ad of process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(SETTING)) {
  const a = SETTING[ad], data = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${ad}.json`), 'utf8')), c = data.frameBorder
  const n = 2 ** a.z
  const x0 = mx(c.west) * n, x1 = mx(c.east) * n, y0 = my(c.north) * n, y1 = my(c.south) * n
  const mapSheets = []
  for (let y = Math.floor(y0); y <= Math.floor(y1); y++) for (let x = Math.floor(x0); x <= Math.floor(x1); x++) mapSheets.push({ x, y, b64: await mapSheet(a.z, x, y) })
  const url = await page.evaluate(async ({ mapSheets, x0, x1, y0, y1, a, data }) => {
    const minX = Math.min(...mapSheets.map((p) => p.x)), minY = Math.min(...mapSheets.map((p) => p.y))
    const column = Math.max(...mapSheets.map((p) => p.x)) - minX + 1, line = Math.max(...mapSheets.map((p) => p.y)) - minY + 1
    const source = new OffscreenCanvas(column * 256, line * 256), kk = source.getContext('2d', { willReadFrequently: true })
    for (const p of mapSheets) {
      const bit = await createImageBitmap(await (await fetch('data:image/png;base64,' + p.b64)).blob())
      kk.drawImage(bit, (p.x - minX) * 256, (p.y - minY) * 256)
    }
    const hd = kk.getImageData(0, 0, source.width, source.height).data, W = source.width, H = source.height
    const burden = (x, y) => {
      const i = (Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))) * 4
      return hd[i] * 256 + hd[i + 1] + hd[i + 2] / 256 - 32768
    }
    const blin = (x, y) => {
      const x_ = Math.floor(x), y_ = Math.floor(y), u = x - x_, v = y - y_
      return (burden(x_, y_) * (1 - u) + burden(x_ + 1, y_) * u) * (1 - v) + (burden(x_, y_ + 1) * (1 - u) + burden(x_ + 1, y_ + 1) * u) * v
    }
    const en = a.en, length = Math.round((en * data.y) / data.g)
    const c = document.createElement('canvas'); c.width = en; c.height = length
    const k = c.getContext('2d'), im = k.createImageData(en, length)
    const stepX = ((x1 - x0) * 256) / en, stepY = ((y1 - y0) * 256) / length
    // Çıktı pikseli başına yer metresi (çerçeve ortasının enlemiyle)
    const lat = (data.frameBorder.south + data.frameBorder.north) / 2
    const meter = (((x1 - x0) / 2 ** a.z) * 40075016 * Math.cos((lat * Math.PI) / 180)) / en
    // Işık kuzeybatıdan, harita geleneği
    const lx = -0.5, ly = -0.5, lz = 0.707
    const base = [241, 236, 224], tall = [199, 187, 160], forest = [216, 222, 196]
    for (let j = 0; j < length; j++) for (let i = 0; i < en; i++) {
      const sx = (x0 - minX) * 256 + (i + 0.5) * stepX, sy = (y0 - minY) * 256 + (j + 0.5) * stepY
      const e = blin(sx, sy)
      const dzdx = (blin(sx + stepX, sy) - blin(sx - stepX, sy)) / (2 * meter) * a.vertical
      const dzdy = (blin(sx, sy + stepY) - blin(sx, sy - stepY)) / (2 * meter) * a.vertical
      const nl = Math.hypot(dzdx, dzdy, 1)
      const light = (-dzdx * lx - dzdy * ly + lz) / nl
      const shadow = Math.max(0.58, Math.min(1.1, 0.42 + 0.82 * light))
      const t = Math.max(0, Math.min(1, e / a.toneScale)), t1 = Math.min(1, t * 2.4), t2 = Math.max(0, t * 2.4 - 1) / 1.4
      const p = (j * en + i) * 4
      for (let b = 0; b < 3; b++) {
        const tone = (base[b] * (1 - t1) + forest[b] * t1) * (1 - t2) + tall[b] * t2
        im.data[p + b] = Math.min(255, tone * shadow)
      }
      im.data[p + 3] = 255
    }
    k.putImageData(im, 0, 0)
    return c.toDataURL('image/webp', a.quality)
  }, { mapSheets, x0, x1, y0, y1, a, data })
  const b = Buffer.from(url.split(',')[1], 'base64')
  fs.writeFileSync(path.join(OUTPUT, `${ad}-relief.webp`), b)
  console.log(ad, mapSheets.length, 'mapSheet', b.length, 'byte')
}
await browser.close()
