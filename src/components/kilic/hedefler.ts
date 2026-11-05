// Test alanı hedefleri: kesim gerçek geometriyle yapılır, hasar birikir ve görünür.
import * as T from 'three'
import { yayAdim } from './animasyon'

const RULO = { x: 12, z: 0, r: .075, alt: .55, ust: 1.6 }
const KUTUK = { x: 14, y: .74, z: -.1, yari: .45, r: .11 }
const KUMAS = { x: 16.15, ust: 1.95, z: -.1, gen: .84, boy: 1.3 }
export const hedefDuzlemZ = [RULO.z, KUTUK.z, KUMAS.z]
export const hedefMerkez = [new T.Vector3(RULO.x, 1.1, RULO.z), new T.Vector3(KUTUK.x, KUTUK.y, KUTUK.z), new T.Vector3(KUMAS.x, 1.3, KUMAS.z)]

export interface VurusSonucu { isabet: boolean; ayrildi: boolean; mesaj: string; ses: 'kesim' | 'ting'; nokta: T.Vector3 }
interface Kesit { y: number; m: number }
interface Govde { mesh: T.Mesh; v: T.Vector3; w: T.Vector3; eksen: T.Vector3; yari: number; r: number; dur: boolean }
interface Oyuk { x: number; aci: number; d: number }

const SAMAN = new T.Color('#c9a95f'), TAZE_AGAC = new T.Color('#d8b98a'), KUMAS_RENK = new T.Color('#8a2422')

function kesitDokusu() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d')!
  x.fillStyle = '#9c8344'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#5d4a20'; x.lineWidth = 1.4
  x.beginPath()
  for (let a = 0; a < 42; a += .08) { const r = a * 1.45; const px = 64 + Math.cos(a) * r, py = 64 + Math.sin(a) * r; if (a === 0) x.moveTo(px, py); else x.lineTo(px, py) }
  x.stroke()
  return new T.CanvasTexture(c)
}

function ruloGeometri(alt: Kesit, ust: Kesit) {
  const cy = (alt.y + ust.y) / 2, S = 40, Z = 14, pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = []
  for (let j = 0; j <= Z; j++) for (let i = 0; i <= S; i++) {
    const a = i / S * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), ax = cx * RULO.r
    const y = T.MathUtils.lerp(alt.y + alt.m * ax, ust.y + ust.m * ax, j / Z)
    pos.push(ax, y - cy, cz * RULO.r); nor.push(cx, 0, cz); uv.push(y * 8, i / S * 3)
  }
  for (let j = 0; j < Z; j++) for (let i = 0; i < S; i++) {
    const a = j * (S + 1) + i, b = a + 1, c = a + S + 1, d = c + 1
    idx.push(a, c, b, b, c, d)
  }
  const yanSay = idx.length
  const kapak = (k: Kesit, yon: 1 | -1) => {
    const n = new T.Vector3(-k.m, 1, 0).normalize().multiplyScalar(yon), bas = pos.length / 3
    pos.push(0, k.y - cy, 0); nor.push(n.x, n.y, n.z); uv.push(.5, .5)
    for (let i = 0; i <= S; i++) {
      const a = i / S * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), ax = cx * RULO.r
      pos.push(ax, k.y + k.m * ax - cy, cz * RULO.r); nor.push(n.x, n.y, n.z); uv.push(.5 + cx * .5, .5 + cz * .5)
    }
    for (let i = 1; i <= S; i++) { if (yon > 0) idx.push(bas, bas + i + 1, bas + i); else idx.push(bas, bas + i, bas + i + 1) }
  }
  kapak(ust, 1); kapak(alt, -1)
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx)
  g.addGroup(0, yanSay, 0); g.addGroup(yanSay, idx.length - yanSay, 1)
  return { g, merkez: new T.Vector3(RULO.x, cy, RULO.z) }
}

const kutukYaricap = (x: number) => { const u = Math.abs(x - KUTUK.x) / KUTUK.yari; return .105 + .010 * u * u }

function kutukGeometri(x0: number, x1: number, oyuklar: Oyuk[], kesitKapak: 0 | 1 | 2) {
  const cx = (x0 + x1) / 2, N = Math.max(14, Math.round((x1 - x0) * 230)), M = 96
  const pos: number[] = [], uv: number[] = [], renk: number[] = [], idx: number[] = []
  // Kama kesik: yüzeyden d kadar içeri inen, iki eğik düzlemli V; balta izi gibi düz yüzlü.
  const halkaYari = (x: number, a: number) => {
    const R = kutukYaricap(x); let r = R
    for (const o of oyuklar) {
      const cos = Math.cos(a - o.aci); if (cos <= .04) continue
      r = Math.min(r, (R - o.d + Math.abs(x - o.x) * 1.55) / cos)
    }
    return Math.max(.012, r)
  }
  for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) {
    const x = x0 + (x1 - x0) * i / N, a = j / M * Math.PI * 2, R = kutukYaricap(x), r = halkaYari(x, a)
    pos.push(x - cx, Math.cos(a) * r, Math.sin(a) * r); uv.push(x * 2, j / M * 2)
    const taze = T.MathUtils.smoothstep(R - r, .0015, .006), k = 1 + taze * 2.1
    renk.push(k, k * (1 - taze * .06), k * (1 - taze * .2))
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1
    idx.push(a, b, c, b, d, c)
  }
  const uc = (x: number, yon: 1 | -1, taze: boolean) => {
    const bas = pos.length / 3, k = taze ? 2.4 : 1
    pos.push(x - cx, 0, 0); uv.push(0, 0); renk.push(k, k, k)
    for (let j = 0; j <= M; j++) {
      const a = j / M * Math.PI * 2, r = halkaYari(x, a)
      pos.push(x - cx, Math.cos(a) * r, Math.sin(a) * r); uv.push(Math.cos(a) * .22, Math.sin(a) * .22); renk.push(k, k, k)
    }
    for (let j = 1; j <= M; j++) { if (yon > 0) idx.push(bas, bas + j, bas + j + 1); else idx.push(bas, bas + j + 1, bas + j) }
  }
  uc(x0, -1, kesitKapak === 1); uc(x1, 1, kesitKapak === 2)
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(renk, 3)); g.setIndex(idx)
  g.computeVertexNormals()
  return { g, merkez: new T.Vector3(cx, KUTUK.y, KUTUK.z) }
}

function kesisir(a: T.Vector2, b: T.Vector2, c: T.Vector2, d: T.Vector2) {
  const y = (p: T.Vector2, q: T.Vector2, r: T.Vector2) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  return y(a, b, c) * y(a, b, d) < 0 && y(c, d, a) * y(c, d, b) < 0
}

export function hedefleriKur(scene: T.Scene, bul: (ad: string) => T.Mesh, azHareket: boolean) {
  // ---------------------------------------------------- kırıntılar: hasarın elle tutulur izi
  const ADET = azHareket ? 24 : 110
  const kiriMat = new T.MeshStandardMaterial({ roughness: .9 })
  const kirinti = new T.InstancedMesh(new T.BoxGeometry(.018, .005, .03), kiriMat, ADET)
  kirinti.frustumCulled = false; kirinti.castShadow = true; scene.add(kirinti)
  const kirList = Array.from({ length: ADET }, () => ({ p: new T.Vector3(0, -9, 0), v: new T.Vector3(), q: new T.Euler(), w: new T.Vector3(), omur: 0, olcek: 1 }))
  const m4 = new T.Matrix4(), qt = new T.Quaternion(), s3 = new T.Vector3()
  function sac(p: T.Vector3, renk: T.Color, n: number, yon: T.Vector3) {
    let adet = azHareket ? Math.ceil(n * .25) : n
    for (let i = 0; i < ADET && adet > 0; i++) {
      const k = kirList[i]; if (k.omur > 0) continue
      adet--; k.p.copy(p); k.omur = 2.2 + Math.random() * 1.2; k.olcek = .5 + Math.random() * 1.1
      k.v.set(yon.x * (.4 + Math.random()) + (Math.random() - .5) * 1.1, 1 + Math.random() * 1.6, .35 + Math.random() * .9)
      k.w.set(Math.random() * 12 - 6, Math.random() * 12 - 6, Math.random() * 12 - 6)
      kirinti.setColorAt(i, renk.clone().multiplyScalar(.75 + Math.random() * .5))
    }
    if (kirinti.instanceColor) kirinti.instanceColor.needsUpdate = true
  }

  // ---------------------------------------------------- rulo
  const ruloEski = bul('Hasir_Rulo'), direk = bul('Hasir_Direk'), halkalar = [0, 1, 2].map(i => bul(`Hasir_Bag_${i}`))
  const hasirMat = ruloEski.material as T.MeshStandardMaterial
  const kesitTex = kesitDokusu(), kesitMat = new T.MeshStandardMaterial({ map: kesitTex, color: '#a39a86', roughness: 1 })
  ruloEski.visible = false
  const ruloGrup = new T.Group(); ruloGrup.position.set(RULO.x, .1, RULO.z); scene.add(ruloGrup)
  const halkaIlk = halkalar.map(h => { h.updateWorldMatrix(true, false); return h.matrixWorld.clone() })
  const direkIlk = (direk.updateWorldMatrix(true, false), direk.matrixWorld.clone())
  let ayakta: T.Mesh | null = null, ruloUst: Kesit = { y: RULO.ust, m: 0 }
  const sallanma = { x: 0, v: 0 }
  const ruloIzler: T.Mesh[] = []
  function ruloKoy(ust: Kesit) {
    if (ayakta) { ruloGrup.remove(ayakta); ayakta.geometry.dispose() }
    const { g, merkez } = ruloGeometri({ y: RULO.alt, m: 0 }, ust)
    ayakta = new T.Mesh(g, [hasirMat, kesitMat]); ayakta.castShadow = ayakta.receiveShadow = true
    ayakta.position.copy(merkez).sub(ruloGrup.position); ruloGrup.add(ayakta); ruloUst = ust
  }

  // ---------------------------------------------------- kütük
  const kutukEski = bul('Test_Kutuk')
  const kutukMat = (kutukEski.material as T.MeshStandardMaterial).clone(); kutukMat.vertexColors = true
  kutukEski.visible = false
  let kutuk: T.Mesh | null = null, oyuklar: Oyuk[] = []
  function kutukKoy() {
    if (kutuk) { scene.remove(kutuk); kutuk.geometry.dispose() }
    const { g, merkez } = kutukGeometri(KUTUK.x - KUTUK.yari, KUTUK.x + KUTUK.yari, oyuklar, 0)
    kutuk = new T.Mesh(g, kutukMat); kutuk.castShadow = kutuk.receiveShadow = true; kutuk.position.copy(merkez); scene.add(kutuk)
  }

  // ---------------------------------------------------- kumaş: Verlet simülasyonu
  const kumasEski = bul('Test_Kumas')
  const kumasMat = (kumasEski.material as T.MeshStandardMaterial).clone(); kumasMat.side = T.DoubleSide
  kumasEski.visible = false
  const NX = azHareket ? 18 : 30, NY = azHareket ? 24 : 40, ax = KUMAS.gen / (NX - 1), ay = KUMAS.boy / (NY - 1)
  const kumasGeo = new T.BufferGeometry(), P = new Float32Array(NX * NY * 3), O = new Float32Array(NX * NY * 3)
  const uvK = new Float32Array(NX * NY * 2)
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { uvK[(j * NX + i) * 2] = i / (NX - 1) * 2; uvK[(j * NX + i) * 2 + 1] = 2 - j / (NY - 1) * 2 }
  kumasGeo.setAttribute('position', new T.BufferAttribute(P, 3)); kumasGeo.setAttribute('uv', new T.BufferAttribute(uvK, 2))
  const kumas = new T.Mesh(kumasGeo, kumasMat); kumas.castShadow = kumas.receiveShadow = true; kumas.frustumCulled = false; scene.add(kumas)
  let baglar: { a: number; b: number; L: number; var: boolean }[] = [], kareSil = new Uint8Array((NX - 1) * (NY - 1)), yirtik = 0, kumasAyrildi = false
  const nk = (i: number, j: number) => j * NX + i
  const kopuk = new Set<number>(), bagAnahtar = (a: number, b: number) => Math.min(a, b) * NX * NY + Math.max(a, b)
  function kumasKur() {
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = nk(i, j) * 3, x = KUMAS.x - KUMAS.gen / 2 + i * ax, y = KUMAS.ust - j * ay, z = KUMAS.z + Math.sin(i / 2.2 + j / 9) * .012 * (j / NY)
      P[k] = O[k] = x; P[k + 1] = O[k + 1] = y; P[k + 2] = O[k + 2] = z
    }
    baglar = []
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      if (i < NX - 1) baglar.push({ a: nk(i, j), b: nk(i + 1, j), L: ax, var: true })
      if (j < NY - 1) baglar.push({ a: nk(i, j), b: nk(i, j + 1), L: ay, var: true })
      if (i < NX - 1 && j < NY - 1) baglar.push({ a: nk(i, j), b: nk(i + 1, j + 1), L: Math.hypot(ax, ay), var: true })
    }
    kareSil.fill(0); kopuk.clear(); yirtik = 0; kumasAyrildi = false; kumasIndeks()
  }
  function kumasIndeks() {
    const idx: number[] = []
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      if (kareSil[j * (NX - 1) + i]) continue
      const a = nk(i, j), b = nk(i + 1, j), c = nk(i, j + 1), d = nk(i + 1, j + 1)
      // Kopan bağı olan kare çizilmez; yoksa ayrılan parçalar arasında üçgen şeritler uzar.
      if (kopuk.has(bagAnahtar(a, b)) || kopuk.has(bagAnahtar(a, c)) || kopuk.has(bagAnahtar(a, d)) || kopuk.has(bagAnahtar(b, d)) || kopuk.has(bagAnahtar(c, d))) continue
      idx.push(a, c, b, b, c, d)
    }
    kumasGeo.setIndex(idx); kumasGeo.computeVertexNormals()
  }
  function kumasAdim(dt: number) {
    const h = Math.min(dt, .025), ruzgar = Math.sin(performance.now() * .0011) * .12
    for (let k = 0; k < NX * NY; k++) {
      if (k < NX) continue
      const i = k * 3
      for (let c = 0; c < 3; c++) {
        const v = (P[i + c] - O[i + c]) * .985
        O[i + c] = P[i + c]
        P[i + c] += v + (c === 1 ? -6.5 : c === 2 ? ruzgar : 0) * h * h
      }
      if (P[i + 1] < .015) { P[i + 1] = .015; O[i] = P[i]; O[i + 2] = P[i + 2] }
    }
    for (let d = 0; d < 3; d++) for (const b of baglar) {
      if (!b.var) continue
      const i = b.a * 3, j = b.b * 3, dx = P[j] - P[i], dy = P[j + 1] - P[i + 1], dz = P[j + 2] - P[i + 2]
      const u = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, f = (u - b.L) / u * .5
      const ai = b.a < NX ? 0 : 1, bi = b.b < NX ? 0 : 1, top = ai + bi || 1
      const fa = f * 2 * ai / top, fb = f * 2 * bi / top
      P[i] += dx * fa; P[i + 1] += dy * fa; P[i + 2] += dz * fa
      P[j] -= dx * fb; P[j + 1] -= dy * fb; P[j + 2] -= dz * fb
    }
    kumasGeo.attributes.position.needsUpdate = true; kumasGeo.computeVertexNormals()
  }
  function kumasBaglantiKontrol() {
    const gor = new Uint8Array(NX * NY), kom: number[][] = Array.from({ length: NX * NY }, () => [])
    for (const b of baglar) if (b.var) { kom[b.a].push(b.b); kom[b.b].push(b.a) }
    const y: number[] = []; for (let i = 0; i < NX; i++) { gor[i] = 1; y.push(i) }
    while (y.length) { for (const n of kom[y.pop()!]) if (!gor[n]) { gor[n] = 1; y.push(n) } }
    return gor.some(v => !v)
  }

  // ---------------------------------------------------- düşen parçalar
  const dusenler: Govde[] = []; let ayrilan = 0
  const yukari = new T.Vector3(0, 1, 0), a3 = new T.Vector3(), t3 = new T.Vector3()
  function dusur(mesh: T.Mesh, eksen: T.Vector3, yari: number, r: number, v: T.Vector3, w: T.Vector3) {
    dusenler.push({ mesh, v, w, eksen, yari, r, dur: false }); ayrilan++
  }

  // ---------------------------------------------------- hasar değerleri (arayüz için)
  const hasar = [0, 0, 0]
  function sifirla() {
    dusenler.forEach(b => {
      if (b.mesh.children.length) b.mesh.children.slice().forEach(c => scene.attach(c))
      scene.remove(b.mesh); b.mesh.geometry.dispose()
    })
    dusenler.length = 0; ayrilan = 0; hasar.fill(0)
    ruloIzler.forEach(m => { ruloGrup.remove(m); m.geometry.dispose(); (m.material as T.Material).dispose() }); ruloIzler.length = 0
    ruloGrup.rotation.set(0, 0, 0); ruloGrup.updateMatrixWorld(true); sallanma.x = sallanma.v = 0
    halkalar.forEach((h, i) => { scene.attach(h); h.matrixWorld.copy(halkaIlk[i]); h.matrixWorld.decompose(h.position, h.quaternion, h.scale); ruloGrup.attach(h) })
    scene.attach(direk); direkIlk.decompose(direk.position, direk.quaternion, direk.scale); ruloGrup.attach(direk)
    ruloKoy({ y: RULO.ust, m: 0 })
    oyuklar = []; kutukKoy(); kumasKur()
    kirList.forEach(k => { k.omur = 0; k.p.set(0, -9, 0) })
  }
  sifirla()

  // ---------------------------------------------------- vuruşlar
  function ruloVur(a: T.Vector3, b: T.Vector3, guc: number): VurusSonucu {
    const yon = b.clone().sub(a), nokta = hedefMerkez[0].clone()
    const egim = T.MathUtils.clamp(yon.y / (Math.abs(yon.x) < 1e-3 ? 1e-3 * Math.sign(yon.x || 1) : yon.x), -1.1, 1.1)
    const kk = Math.abs(yon.x) < 1e-3 ? .5 : (RULO.x - a.x) / yon.x
    const dikey = Math.abs(yon.x) < Math.abs(yon.y) * .12
    const yC = dikey ? (a.y + b.y) / 2 : a.y + yon.y * kk
    const ustY = ruloUst.y
    if ((!dikey && (kk < -.2 || kk > 1.2)) || yC < RULO.alt + .05 || yC > ustY - .025) return { isabet: false, ayrildi: false, mesaj: 'Hasır ruloyu ıskaladın. Kesim çizgisi rulodan geçmeli.', ses: 'kesim', nokta }
    nokta.set(RULO.x, yC, RULO.z + RULO.r)
    sallanma.v += -Math.sign(yon.x || 1) * (.6 + guc * 1.1)
    sac(nokta, SAMAN, 18, yon.clone().normalize())
    if (guc < .28) {
      const m = new T.Mesh(new T.TorusGeometry(RULO.r + .0005, .004, 6, 32, Math.PI * .9), new T.MeshStandardMaterial({ color: '#3a2a10', roughness: 1 }))
      m.rotation.x = Math.PI / 2; m.rotation.y = -Math.atan(egim) * .9; m.rotation.z = Math.PI * .05
      m.position.set(RULO.x, yC, RULO.z).sub(ruloGrup.position); ruloGrup.add(m); ruloIzler.push(m)
      hasar[0] = Math.min(.45, hasar[0] + .12)
      return { isabet: true, ayrildi: false, mesaj: 'Hasırda sığ bir kesik açıldı; keskinlik ikiye bölmeye yetmedi. Yine vurabilirsin.', ses: 'kesim', nokta }
    }
    const kesit: Kesit = { y: yC, m: egim }
    const { g, merkez } = ruloGeometri(kesit, ruloUst)
    const parca = new T.Mesh(g, [hasirMat, kesitMat]); parca.castShadow = parca.receiveShadow = true; parca.position.copy(merkez); scene.add(parca)
    // Kesitin üstünde kalan bağlar üst parçayla birlikte düşer.
    halkalar.forEach(h => { h.getWorldPosition(t3); if (h.parent === ruloGrup && t3.y + .011 > yC + egim * 0) parca.attach(h) })
    const y2 = yon.clone().normalize()
    dusur(parca, new T.Vector3(0, 1, 0), Math.max(.03, (ruloUst.y - yC) / 2), RULO.r, new T.Vector3(y2.x * (.35 + guc * .9), .25 + guc * .5, .15 + Math.random() * .2), new T.Vector3((Math.random() - .5) * 2, Math.random() - .5, -Math.sign(y2.x || 1) * (1.2 + guc * 2.4)))
    ruloKoy(kesit)
    hasar[0] = Math.min(1, 1 - (yC - RULO.alt) / (RULO.ust - RULO.alt) * .7)
    return { isabet: true, ayrildi: true, mesaj: `Hasır rulo kesildi; üst parça düştü. Kalan boy %${Math.round((yC - RULO.alt) / (RULO.ust - RULO.alt) * 100)}.`, ses: 'kesim', nokta }
  }

  function kutukVur(a: T.Vector3, b: T.Vector3, guc: number): VurusSonucu {
    const yon = b.clone().sub(a), nokta = hedefMerkez[1].clone()
    if (!kutuk) return { isabet: false, ayrildi: false, mesaj: 'Kütük zaten ikiye ayrıldı. Hedefleri yenile.', ses: 'kesim', nokta }
    const kk = Math.abs(yon.y) < 1e-3 ? .5 : (KUTUK.y - a.y) / yon.y
    const xC = Math.abs(yon.y) < Math.abs(yon.x) * .15 ? (a.x + b.x) / 2 : a.x + yon.x * kk
    const dikeyMi = Math.abs(yon.y) >= Math.abs(yon.x) * .15
    if (xC < KUTUK.x - KUTUK.yari - .03 || xC > KUTUK.x + KUTUK.yari + .03 || (dikeyMi && (kk < -.35 || kk > 1.35))) return { isabet: false, ayrildi: false, mesaj: 'Kütüğü ıskaladın. Kesim çizgisi kütükten geçmeli.', ses: 'kesim', nokta }
    const x = T.MathUtils.clamp(xC, KUTUK.x - KUTUK.yari + .03, KUTUK.x + KUTUK.yari - .03)
    const aci = !dikeyMi ? Math.PI / 2 : yon.y < 0 ? .18 : Math.PI - .18
    const dd = .010 + guc * guc * .052
    const yakin = oyuklar.find(o => Math.abs(o.x - x) < .045 && Math.abs(o.aci - aci) < 1.2)
    if (yakin) yakin.d += dd; else oyuklar.push({ x, aci, d: dd })
    const o = yakin ?? oyuklar[oyuklar.length - 1]
    const yuzey = new T.Vector3(x, KUTUK.y + Math.cos(aci) * .1, KUTUK.z + Math.sin(aci) * .1)
    nokta.copy(yuzey); sac(yuzey, TAZE_AGAC, 12 + Math.round(guc * 18), yon.clone().normalize())
    hasar[1] = Math.min(1, Math.max(hasar[1], o.d / .17))
    if (o.d < .165) {
      kutukKoy()
      return { isabet: true, ayrildi: false, mesaj: guc < .3 ? `Sığ bir çentik: ${Math.round(o.d * 1000)} mm. Sert ağaç keskinliğini sınıyor.` : `Kütükte oyuk derinliği ${Math.round(o.d * 1000)} mm. Aynı yere vurmaya devam edersen ayrılır.`, ses: guc < .3 ? 'ting' : 'kesim', nokta }
    }
    // Yeterince derin: iki parçaya ayrılır ve sehpadan düşer.
    scene.remove(kutuk); kutuk.geometry.dispose(); kutuk = null
    const sol = kutukGeometri(KUTUK.x - KUTUK.yari, x, oyuklar, 2), sag = kutukGeometri(x, KUTUK.x + KUTUK.yari, oyuklar, 1)
    for (const [p, yn] of [[sol, -1], [sag, 1]] as const) {
      const m = new T.Mesh(p.g, kutukMat); m.castShadow = m.receiveShadow = true; m.position.copy(p.merkez); scene.add(m)
      const uz = Math.abs(p.merkez.x - (yn < 0 ? KUTUK.x - KUTUK.yari : KUTUK.x + KUTUK.yari))
      dusur(m, new T.Vector3(1, 0, 0), uz, KUTUK.r, new T.Vector3(yn * .25, -.1, .3 * Math.random()), new T.Vector3(0, 0, yn * (1.4 + Math.random())))
    }
    sac(yuzey, TAZE_AGAC, 26, yukari)
    hasar[1] = 1
    return { isabet: true, ayrildi: true, mesaj: 'Kütük oyulan yerden ikiye ayrıldı!', ses: 'kesim', nokta }
  }

  function kumasVur(a: T.Vector3, b: T.Vector3, guc: number): VurusSonucu {
    const nokta = hedefMerkez[2].clone(), yon = b.clone().sub(a)
    const sol = KUMAS.x - KUMAS.gen / 2 - .03, sag = KUMAS.x + KUMAS.gen / 2 + .03
    // Kesim çizgisini kumaşın dikdörtgenine kırp.
    let t0 = 0, t1 = 1
    for (const [p, q] of [[-yon.x, a.x - sol], [yon.x, sag - a.x], [-yon.y, a.y - (KUMAS.ust - KUMAS.boy - .1)], [yon.y, KUMAS.ust - a.y]]) {
      if (p === 0) { if (q < 0) t1 = -1; continue }
      const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r)
    }
    if (t0 >= t1) return { isabet: false, ayrildi: false, mesaj: 'Kumaşı ıskaladın. Kesim çizgisi kumaştan geçmeli.', ses: 'kesim', nokta }
    const orta = (t0 + t1) / 2; nokta.copy(a).addScaledVector(yon, orta); nokta.z = KUMAS.z
    // Her vuruş kumaşı sallar.
    for (let k = NX; k < NX * NY; k++) {
      const i = k * 3, u = Math.hypot(P[i] - nokta.x, P[i + 1] - nokta.y), e = Math.max(0, 1 - u / .55)
      if (e > 0) { O[i] -= yon.x * e * .012; O[i + 1] -= yon.y * e * .006; O[i + 2] -= (.018 + guc * .02) * e }
    }
    sac(nokta, KUMAS_RENK, guc < .3 ? 2 : 8, yon.clone().normalize())
    if (guc < .3) return { isabet: true, ayrildi: false, mesaj: 'Körelmiş ağız gevşek kumaşı kesemedi, sadece savurdu. Bileme keskinliği belirler.', ses: 'kesim', nokta }
    const oran = guc >= .72 ? 1 : .18 + (guc - .3) / .42 * .72, y = (t1 - t0) / 2 * oran
    const a2 = new T.Vector2(a.x + yon.x * (orta - y), a.y + yon.y * (orta - y)), b2 = new T.Vector2(a.x + yon.x * (orta + y), a.y + yon.y * (orta + y))
    const p1 = new T.Vector2(), p2 = new T.Vector2()
    for (const c of baglar) {
      if (!c.var) continue
      p1.set(P[c.a * 3], P[c.a * 3 + 1]); p2.set(P[c.b * 3], P[c.b * 3 + 1])
      if (kesisir(a2, b2, p1, p2)) { c.var = false; kopuk.add(bagAnahtar(c.a, c.b)) }
    }
    const uz = b2.distanceTo(a2)
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const k = nk(i, j) * 3, cx = P[k] + ax / 2, cy = P[k + 1] - ay / 2
      const dx = b2.x - a2.x, dy = b2.y - a2.y, l2 = dx * dx + dy * dy || 1e-6, tt = T.MathUtils.clamp(((cx - a2.x) * dx + (cy - a2.y) * dy) / l2, 0, 1)
      if (Math.hypot(cx - a2.x - dx * tt, cy - a2.y - dy * tt) < Math.min(ax, ay) * .62) kareSil[j * (NX - 1) + i] = 1
    }
    yirtik += uz; hasar[2] = Math.min(1, yirtik / 1.1); kumasIndeks()
    const ayrildi = !kumasAyrildi && kumasBaglantiKontrol()
    if (ayrildi) { kumasAyrildi = true; ayrilan++; hasar[2] = 1 }
    return { isabet: true, ayrildi, mesaj: ayrildi ? 'Kumaş boydan boya kesildi; alt parça düştü.' : `Kumaşta ${Math.round(uz * 100)} cm yırtık açıldı.${guc < .72 ? ' Daha keskin bir ağız daha uzun keser.' : ''}`, ses: 'kesim', nokta }
  }

  return {
    vur: (hedef: number, a: T.Vector3, b: T.Vector3, guc: number) => hedef === 0 ? ruloVur(a, b, guc) : hedef === 1 ? kutukVur(a, b, guc) : kumasVur(a, b, guc),
    sifirla,
    ayrilan: () => ayrilan,
    hasarlar: () => hasar.slice(),
    // VR savurmasının hedefe çekileceği dikdörtgen; rulo kesildikçe tepesi alçalır.
    kutu: (i: number) => i === 0 ? { minX: RULO.x - RULO.r, maxX: RULO.x + RULO.r, minY: RULO.alt + .06, maxY: Math.max(RULO.alt + .07, ruloUst.y - .03), z: RULO.z }
      : i === 1 ? { minX: KUTUK.x - KUTUK.yari, maxX: KUTUK.x + KUTUK.yari, minY: KUTUK.y - KUTUK.r, maxY: KUTUK.y + KUTUK.r, z: KUTUK.z }
      : { minX: KUMAS.x - KUMAS.gen / 2, maxX: KUMAS.x + KUMAS.gen / 2, minY: KUMAS.ust - KUMAS.boy, maxY: KUMAS.ust, z: KUMAS.z },
    guncelle(dt: number, aktif: boolean) {
      // Kumaş yalnız test alanındayken hesaplanır.
      if (aktif) kumasAdim(dt)
      yayAdim(sallanma, 90, 7, dt); ruloGrup.rotation.z = sallanma.x * .12
      for (const b of dusenler) {
        if (b.dur) continue
        b.v.y -= 9.8 * dt; b.mesh.position.addScaledVector(b.v, dt)
        const u = b.w.length()
        if (u > 1e-3) b.mesh.quaternion.premultiply(qt.setFromAxisAngle(a3.copy(b.w).divideScalar(u), u * dt))
        a3.copy(b.eksen).applyQuaternion(b.mesh.quaternion)
        const ay2 = Math.abs(a3.y), yukseklik = ay2 * b.yari + b.r * Math.sqrt(Math.max(0, 1 - a3.y * a3.y))
        if (b.mesh.position.y < yukseklik) {
          b.mesh.position.y = yukseklik
          b.v.y = b.v.y < -.6 ? -b.v.y * .22 : 0
          b.v.x *= .9; b.v.z *= .9; b.w.multiplyScalar(.9)
          // Yere değen parça yan yatar.
          if (ay2 > .08) { t3.crossVectors(a3, yukari).multiplyScalar(-Math.sign(a3.y) * 13 * dt); if (t3.lengthSq() < 1e-7) t3.set(.1, 0, 0); b.w.add(t3) }
          if (b.v.lengthSq() < .004 && b.w.lengthSq() < .01 && ay2 < .1) { b.v.set(0, 0, 0); b.w.set(0, 0, 0); b.dur = true }
        }
      }
      for (let i = 0; i < ADET; i++) {
        const k = kirList[i]
        if (k.omur <= 0) { m4.makeScale(0, 0, 0); kirinti.setMatrixAt(i, m4); continue }
        k.omur -= dt; k.v.y -= 9.8 * dt; k.p.addScaledVector(k.v, dt)
        k.q.x += k.w.x * dt; k.q.y += k.w.y * dt; k.q.z += k.w.z * dt
        if (k.p.y < .012) { k.p.y = .012; k.v.set(k.v.x * .4, Math.abs(k.v.y) * .15, k.v.z * .4); k.w.multiplyScalar(.3) }
        const ol = k.olcek * Math.min(1, k.omur * 2)
        m4.compose(k.p, qt.setFromEuler(k.q), s3.set(ol, ol, ol)); kirinti.setMatrixAt(i, m4)
      }
      kirinti.instanceMatrix.needsUpdate = true
    },
    temizle() {
      sifirla(); ayakta?.geometry.dispose(); kutuk?.geometry.dispose(); kumasGeo.dispose(); kirinti.geometry.dispose(); kiriMat.dispose(); kesitTex.dispose(); kesitMat.dispose(); kutukMat.dispose(); kumasMat.dispose()
      scene.remove(ruloGrup, kirinti, kumas); if (kutuk) scene.remove(kutuk)
    },
  }
}
