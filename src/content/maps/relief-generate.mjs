// Generates the relief images: hillshade + elevation tint from Terrain Tiles (terrarium) tiles.
// Usage: node src/content/maps/relief-generate.mjs <raw-data-folder>
// The frame is read from the JSON; the image fits the frame exactly in Web Mercator. Sea and neighbouring countries are covered by SVG on top.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const RAW = process.argv[2]
const OUTPUT = path.dirname(fileURLToPath(import.meta.url))
const UA = 'KokXR-hackathon-prototype/1.0 (one-off data extraction)'
const SETTING = {
  turkey: { z: 6, width: 640, quality: 0.25, vertical: 9, toneScale: 3200 },
  bursa: { z: 11, width: 680, quality: 0.27, vertical: 1, toneScale: 2600 },
  konya: { z: 10, width: 400, quality: 0.25, vertical: 1, toneScale: 2600 },
  hatay: { z: 10, width: 400, quality: 0.25, vertical: 1, toneScale: 2600 },
}
const mx = (lon) => (lon + 180) / 360
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2

async function mapSheet(z, x, y) {
  const file = path.join(RAW, `terrarium-${z}-${x}-${y}.png`)
  if (!fs.existsSync(file)) {
    const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, { headers: { 'User-Agent': UA } })
    if (!r.ok) throw new Error(`tile ${z}/${x}/${y}: ${r.status}`)
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  }
  return fs.readFileSync(file).toString('base64')
}

const browser = await chromium.launch({ channel: 'chromium', args: ['--no-sandbox'] })
const page = await browser.newPage()
for (const name of process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(SETTING)) {
  const a = SETTING[name], data = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${name}.json`), 'utf8')), c = data.frameBorder
  const n = 2 ** a.z
  const x0 = mx(c.west) * n, x1 = mx(c.east) * n, y0 = my(c.north) * n, y1 = my(c.south) * n
  const mapSheets = []
  for (let y = Math.floor(y0); y <= Math.floor(y1); y++) for (let x = Math.floor(x0); x <= Math.floor(x1); x++) mapSheets.push({ x, y, b64: await mapSheet(a.z, x, y) })
  const url = await page.evaluate(async ({ mapSheets, x0, x1, y0, y1, a, data }) => {
    const minX = Math.min(...mapSheets.map((p) => p.x)), minY = Math.min(...mapSheets.map((p) => p.y))
    const cols = Math.max(...mapSheets.map((p) => p.x)) - minX + 1, rows = Math.max(...mapSheets.map((p) => p.y)) - minY + 1
    const source = new OffscreenCanvas(cols * 256, rows * 256), srcCtx = source.getContext('2d', { willReadFrequently: true })
    for (const p of mapSheets) {
      const bit = await createImageBitmap(await (await fetch('data:image/png;base64,' + p.b64)).blob())
      srcCtx.drawImage(bit, (p.x - minX) * 256, (p.y - minY) * 256)
    }
    const hd = srcCtx.getImageData(0, 0, source.width, source.height).data, W = source.width, H = source.height
    const elevation = (x, y) => {
      const i = (Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))) * 4
      return hd[i] * 256 + hd[i + 1] + hd[i + 2] / 256 - 32768
    }
    const blin = (x, y) => {
      const x_ = Math.floor(x), y_ = Math.floor(y), u = x - x_, v = y - y_
      return (elevation(x_, y_) * (1 - u) + elevation(x_ + 1, y_) * u) * (1 - v) + (elevation(x_, y_ + 1) * (1 - u) + elevation(x_ + 1, y_ + 1) * u) * v
    }
    const width = a.width, height = Math.round((width * data.y) / data.g)
    const c = document.createElement('canvas'); c.width = width; c.height = height
    const k = c.getContext('2d'), im = k.createImageData(width, height)
    const stepX = ((x1 - x0) * 256) / width, stepY = ((y1 - y0) * 256) / height
    // Ground metres per output pixel (at the latitude of the frame centre)
    const lat = (data.frameBorder.south + data.frameBorder.north) / 2
    const meter = (((x1 - x0) / 2 ** a.z) * 40075016 * Math.cos((lat * Math.PI) / 180)) / width
    // Light from the northwest, per cartographic convention
    const lx = -0.5, ly = -0.5, lz = 0.707
    const base = [241, 236, 224], high = [199, 187, 160], forest = [216, 222, 196]
    for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
      const sx = (x0 - minX) * 256 + (i + 0.5) * stepX, sy = (y0 - minY) * 256 + (j + 0.5) * stepY
      const e = blin(sx, sy)
      const dzdx = (blin(sx + stepX, sy) - blin(sx - stepX, sy)) / (2 * meter) * a.vertical
      const dzdy = (blin(sx, sy + stepY) - blin(sx, sy - stepY)) / (2 * meter) * a.vertical
      const nl = Math.hypot(dzdx, dzdy, 1)
      const light = (-dzdx * lx - dzdy * ly + lz) / nl
      const shadow = Math.max(0.58, Math.min(1.1, 0.42 + 0.82 * light))
      const t = Math.max(0, Math.min(1, e / a.toneScale)), t1 = Math.min(1, t * 2.4), t2 = Math.max(0, t * 2.4 - 1) / 1.4
      const p = (j * width + i) * 4
      for (let b = 0; b < 3; b++) {
        const tone = (base[b] * (1 - t1) + forest[b] * t1) * (1 - t2) + high[b] * t2
        im.data[p + b] = Math.min(255, tone * shadow)
      }
      im.data[p + 3] = 255
    }
    k.putImageData(im, 0, 0)
    return c.toDataURL('image/webp', a.quality)
  }, { mapSheets, x0, x1, y0, y1, a, data })
  const b = Buffer.from(url.split(',')[1], 'base64')
  fs.writeFileSync(path.join(OUTPUT, `${name}-relief.webp`), b)
  console.log(name, mapSheets.length, 'mapSheet', b.length, 'byte')
}
await browser.close()
