// Kabartma görsellerini üretir: Terrain Tiles (terrarium) paftalarından tepe gölgesi + yükseklik tonu.
// Kullanım: node src/data/harita/kabartma-uret.mjs <ham-veri-klasörü>
// Çerçeve JSON'dan okunur, görsel Web Mercator'da çerçeveye tam oturur. Deniz ve komşu ülke üstten SVG ile örtülür.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const HAM = process.argv[2]
const CIKTI = path.dirname(fileURLToPath(import.meta.url))
const UA = 'KokXR-hackathon-prototip/1.0 (tek seferlik veri cikarimi)'
const AYAR = {
  turkiye: { z: 6, en: 640, kalite: 0.25, dikey: 9, tonOlcek: 3200 },
  bursa: { z: 11, en: 680, kalite: 0.27, dikey: 1, tonOlcek: 2600 },
  konya: { z: 10, en: 400, kalite: 0.25, dikey: 1, tonOlcek: 2600 },
  hatay: { z: 10, en: 400, kalite: 0.25, dikey: 1, tonOlcek: 2600 },
}
const mx = (lon) => (lon + 180) / 360
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2

async function pafta(z, x, y) {
  const y1 = path.join(HAM, `terrarium-${z}-${x}-${y}.png`)
  if (!fs.existsSync(y1)) {
    const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, { headers: { 'User-Agent': UA } })
    if (!r.ok) throw new Error(`pafta ${z}/${x}/${y}: ${r.status}`)
    fs.writeFileSync(y1, Buffer.from(await r.arrayBuffer()))
  }
  return fs.readFileSync(y1).toString('base64')
}

const tarayici = await chromium.launch({ channel: 'chromium', args: ['--no-sandbox'] })
const sayfa = await tarayici.newPage()
for (const ad of process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(AYAR)) {
  const a = AYAR[ad], veri = JSON.parse(fs.readFileSync(path.join(CIKTI, `${ad}.json`), 'utf8')), c = veri.cerceve
  const n = 2 ** a.z
  const x0 = mx(c.bati) * n, x1 = mx(c.dogu) * n, y0 = my(c.kuzey) * n, y1 = my(c.guney) * n
  const paftalar = []
  for (let y = Math.floor(y0); y <= Math.floor(y1); y++) for (let x = Math.floor(x0); x <= Math.floor(x1); x++) paftalar.push({ x, y, b64: await pafta(a.z, x, y) })
  const url = await sayfa.evaluate(async ({ paftalar, x0, x1, y0, y1, a, veri }) => {
    const minX = Math.min(...paftalar.map((p) => p.x)), minY = Math.min(...paftalar.map((p) => p.y))
    const sutun = Math.max(...paftalar.map((p) => p.x)) - minX + 1, satir = Math.max(...paftalar.map((p) => p.y)) - minY + 1
    const kaynak = new OffscreenCanvas(sutun * 256, satir * 256), kk = kaynak.getContext('2d', { willReadFrequently: true })
    for (const p of paftalar) {
      const bit = await createImageBitmap(await (await fetch('data:image/png;base64,' + p.b64)).blob())
      kk.drawImage(bit, (p.x - minX) * 256, (p.y - minY) * 256)
    }
    const hd = kk.getImageData(0, 0, kaynak.width, kaynak.height).data, W = kaynak.width, H = kaynak.height
    const yuk = (x, y) => {
      const i = (Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))) * 4
      return hd[i] * 256 + hd[i + 1] + hd[i + 2] / 256 - 32768
    }
    const blin = (x, y) => {
      const x_ = Math.floor(x), y_ = Math.floor(y), u = x - x_, v = y - y_
      return (yuk(x_, y_) * (1 - u) + yuk(x_ + 1, y_) * u) * (1 - v) + (yuk(x_, y_ + 1) * (1 - u) + yuk(x_ + 1, y_ + 1) * u) * v
    }
    const en = a.en, boy = Math.round((en * veri.y) / veri.g)
    const c = document.createElement('canvas'); c.width = en; c.height = boy
    const k = c.getContext('2d'), im = k.createImageData(en, boy)
    const adimX = ((x1 - x0) * 256) / en, adimY = ((y1 - y0) * 256) / boy
    // Çıktı pikseli başına yer metresi (çerçeve ortasının enlemiyle)
    const lat = (veri.cerceve.guney + veri.cerceve.kuzey) / 2
    const metre = (((x1 - x0) / 2 ** a.z) * 40075016 * Math.cos((lat * Math.PI) / 180)) / en
    // Işık kuzeybatıdan, harita geleneği
    const lx = -0.5, ly = -0.5, lz = 0.707
    const taban = [241, 236, 224], yuksek = [199, 187, 160], orman = [216, 222, 196]
    for (let j = 0; j < boy; j++) for (let i = 0; i < en; i++) {
      const sx = (x0 - minX) * 256 + (i + 0.5) * adimX, sy = (y0 - minY) * 256 + (j + 0.5) * adimY
      const e = blin(sx, sy)
      const dzdx = (blin(sx + adimX, sy) - blin(sx - adimX, sy)) / (2 * metre) * a.dikey
      const dzdy = (blin(sx, sy + adimY) - blin(sx, sy - adimY)) / (2 * metre) * a.dikey
      const nl = Math.hypot(dzdx, dzdy, 1)
      const isik = (-dzdx * lx - dzdy * ly + lz) / nl
      const golge = Math.max(0.58, Math.min(1.1, 0.42 + 0.82 * isik))
      const t = Math.max(0, Math.min(1, e / a.tonOlcek)), t1 = Math.min(1, t * 2.4), t2 = Math.max(0, t * 2.4 - 1) / 1.4
      const p = (j * en + i) * 4
      for (let b = 0; b < 3; b++) {
        const ton = (taban[b] * (1 - t1) + orman[b] * t1) * (1 - t2) + yuksek[b] * t2
        im.data[p + b] = Math.min(255, ton * golge)
      }
      im.data[p + 3] = 255
    }
    k.putImageData(im, 0, 0)
    return c.toDataURL('image/webp', a.kalite)
  }, { paftalar, x0, x1, y0, y1, a, veri })
  const b = Buffer.from(url.split(',')[1], 'base64')
  fs.writeFileSync(path.join(CIKTI, `${ad}-kabartma.webp`), b)
  console.log(ad, paftalar.length, 'pafta', b.length, 'bayt')
}
await tarayici.close()
