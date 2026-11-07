// Test area targets: cuts use real geometry, damage accumulates and is visible.
import * as T from 'three'
import { bowStep } from './animation'

const ROLL = { x: 12, z: 0, r: .075, bottom: .55, top: 1.6 }
const LOG = { x: 14, y: .74, z: -.1, half: .45, r: .11 }
const CLOTH = { x: 16.15, top: 1.95, z: -.1, width: .84, length: 1.3 }
export const targetPlaneZ = [ROLL.z, LOG.z, CLOTH.z]
export const targetCenter = [new T.Vector3(ROLL.x, 1.1, ROLL.z), new T.Vector3(LOG.x, LOG.y, LOG.z), new T.Vector3(CLOTH.x, 1.3, CLOTH.z)]

export interface StrikeResult { hit: boolean; detached: boolean; message: string; sound: 'cut' | 'ting'; point: T.Vector3 }
interface CrossSection { y: number; m: number }
interface Body { mesh: T.Mesh; v: T.Vector3; w: T.Vector3; axis: T.Vector3; half: number; r: number; dur: boolean }
interface Dent { x: number; angle: number; d: number }

const STRAW = new T.Color('#c9a95f'), FRESH_WOOD = new T.Color('#d8b98a'), CLOTH_COLOR = new T.Color('#8a2422')

function sectionTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d')!
  x.fillStyle = '#9c8344'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#5d4a20'; x.lineWidth = 1.4
  x.beginPath()
  for (let a = 0; a < 42; a += .08) { const r = a * 1.45; const px = 64 + Math.cos(a) * r, py = 64 + Math.sin(a) * r; if (a === 0) x.moveTo(px, py); else x.lineTo(px, py) }
  x.stroke()
  return new T.CanvasTexture(c)
}

function rollGeometry(bottom: CrossSection, top: CrossSection) {
  const cy = (bottom.y + top.y) / 2, S = 40, Z = 14, pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = []
  for (let j = 0; j <= Z; j++) for (let i = 0; i <= S; i++) {
    const a = i / S * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), ax = cx * ROLL.r
    const y = T.MathUtils.lerp(bottom.y + bottom.m * ax, top.y + top.m * ax, j / Z)
    pos.push(ax, y - cy, cz * ROLL.r); nor.push(cx, 0, cz); uv.push(y * 8, i / S * 3)
  }
  for (let j = 0; j < Z; j++) for (let i = 0; i < S; i++) {
    const a = j * (S + 1) + i, b = a + 1, c = a + S + 1, d = c + 1
    idx.push(a, c, b, b, c, d)
  }
  const sideCount = idx.length
  const cover = (k: CrossSection, dir: 1 | -1) => {
    const n = new T.Vector3(-k.m, 1, 0).normalize().multiplyScalar(dir), head = pos.length / 3
    pos.push(0, k.y - cy, 0); nor.push(n.x, n.y, n.z); uv.push(.5, .5)
    for (let i = 0; i <= S; i++) {
      const a = i / S * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), ax = cx * ROLL.r
      pos.push(ax, k.y + k.m * ax - cy, cz * ROLL.r); nor.push(n.x, n.y, n.z); uv.push(.5 + cx * .5, .5 + cz * .5)
    }
    for (let i = 1; i <= S; i++) { if (dir > 0) idx.push(head, head + i + 1, head + i); else idx.push(head, head + i, head + i + 1) }
  }
  cover(top, 1); cover(bottom, -1)
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx)
  g.addGroup(0, sideCount, 0); g.addGroup(sideCount, idx.length - sideCount, 1)
  return { g, center: new T.Vector3(ROLL.x, cy, ROLL.z) }
}

const logRadius = (x: number) => { const u = Math.abs(x - LOG.x) / LOG.half; return .105 + .010 * u * u }

function logGeometry(x0: number, x1: number, dents: Dent[], sectionCap: 0 | 1 | 2) {
  const cx = (x0 + x1) / 2, N = Math.max(14, Math.round((x1 - x0) * 230)), M = 96
  const pos: number[] = [], uv: number[] = [], color: number[] = [], idx: number[] = []
  // Wedge notch: a V of two slanted planes going d deep from the surface; flat-faced like an axe mark.
  const ringHalf = (x: number, a: number) => {
    const R = logRadius(x); let r = R
    for (const o of dents) {
      const cos = Math.cos(a - o.angle); if (cos <= .04) continue
      r = Math.min(r, (R - o.d + Math.abs(x - o.x) * 1.55) / cos)
    }
    return Math.max(.012, r)
  }
  for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) {
    const x = x0 + (x1 - x0) * i / N, a = j / M * Math.PI * 2, R = logRadius(x), r = ringHalf(x, a)
    pos.push(x - cx, Math.cos(a) * r, Math.sin(a) * r); uv.push(x * 2, j / M * 2)
    const crisp = T.MathUtils.smoothstep(R - r, .0015, .006), k = 1 + crisp * 2.1
    color.push(k, k * (1 - crisp * .06), k * (1 - crisp * .2))
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1
    idx.push(a, b, c, b, d, c)
  }
  const tip = (x: number, dir: 1 | -1, crisp: boolean) => {
    const head = pos.length / 3, k = crisp ? 2.4 : 1
    pos.push(x - cx, 0, 0); uv.push(0, 0); color.push(k, k, k)
    for (let j = 0; j <= M; j++) {
      const a = j / M * Math.PI * 2, r = ringHalf(x, a)
      pos.push(x - cx, Math.cos(a) * r, Math.sin(a) * r); uv.push(Math.cos(a) * .22, Math.sin(a) * .22); color.push(k, k, k)
    }
    for (let j = 1; j <= M; j++) { if (dir > 0) idx.push(head, head + j, head + j + 1); else idx.push(head, head + j + 1, head + j) }
  }
  tip(x0, -1, sectionCap === 1); tip(x1, 1, sectionCap === 2)
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(color, 3)); g.setIndex(idx)
  g.computeVertexNormals()
  return { g, center: new T.Vector3(cx, LOG.y, LOG.z) }
}

function intersects(a: T.Vector2, b: T.Vector2, c: T.Vector2, d: T.Vector2) {
  const y = (p: T.Vector2, q: T.Vector2, r: T.Vector2) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  return y(a, b, c) * y(a, b, d) < 0 && y(c, d, a) * y(c, d, b) < 0
}

export function setupTargets(scene: T.Scene, find: (name: string) => T.Mesh, smallMove: boolean) {
  // ---------------------------------------------------- debris: the tangible trace of damage
  const COUNT = smallMove ? 24 : 110
  const kiriMat = new T.MeshStandardMaterial({ roughness: .9 })
  const crumb = new T.InstancedMesh(new T.BoxGeometry(.018, .005, .03), kiriMat, COUNT)
  crumb.frustumCulled = false; crumb.castShadow = true; scene.add(crumb)
  const kirList = Array.from({ length: COUNT }, () => ({ p: new T.Vector3(0, -9, 0), v: new T.Vector3(), q: new T.Euler(), w: new T.Vector3(), life: 0, scale: 1 }))
  const m4 = new T.Matrix4(), qt = new T.Quaternion(), s3 = new T.Vector3()
  function sheet(p: T.Vector3, color: T.Color, n: number, dir: T.Vector3) {
    let count = smallMove ? Math.ceil(n * .25) : n
    for (let i = 0; i < COUNT && count > 0; i++) {
      const k = kirList[i]; if (k.life > 0) continue
      count--; k.p.copy(p); k.life = 2.2 + Math.random() * 1.2; k.scale = .5 + Math.random() * 1.1
      k.v.set(dir.x * (.4 + Math.random()) + (Math.random() - .5) * 1.1, 1 + Math.random() * 1.6, .35 + Math.random() * .9)
      k.w.set(Math.random() * 12 - 6, Math.random() * 12 - 6, Math.random() * 12 - 6)
      crumb.setColorAt(i, color.clone().multiplyScalar(.75 + Math.random() * .5))
    }
    if (crumb.instanceColor) crumb.instanceColor.needsUpdate = true
  }

  // ---------------------------------------------------- roll
  const rollOld = find('Straw_Roll'), post = find('Straw_Post'), rings = [0, 1, 2].map(i => find(`Straw_Link_${i}`))
  const strawMat = rollOld.material as T.MeshStandardMaterial
  const sectionTex = sectionTexture(), sectionMat = new T.MeshStandardMaterial({ map: sectionTex, color: '#a39a86', roughness: 1 })
  rollOld.visible = false
  const rollGroup = new T.Group(); rollGroup.position.set(ROLL.x, .1, ROLL.z); scene.add(rollGroup)
  const ringFirst = rings.map(h => { h.updateWorldMatrix(true, false); return h.matrixWorld.clone() })
  const postFirst = (post.updateWorldMatrix(true, false), post.matrixWorld.clone())
  let standing: T.Mesh | null = null, rollTop: CrossSection = { y: ROLL.top, m: 0 }
  const sway = { x: 0, v: 0 }
  const rollTraces: T.Mesh[] = []
  function placeRoll(top: CrossSection) {
    if (standing) { rollGroup.remove(standing); standing.geometry.dispose() }
    const { g, center } = rollGeometry({ y: ROLL.bottom, m: 0 }, top)
    standing = new T.Mesh(g, [strawMat, sectionMat]); standing.castShadow = standing.receiveShadow = true
    standing.position.copy(center).sub(rollGroup.position); rollGroup.add(standing); rollTop = top
  }

  // ---------------------------------------------------- log
  const logOld = find('Test_Log')
  const logMat = (logOld.material as T.MeshStandardMaterial).clone(); logMat.vertexColors = true
  logOld.visible = false
  let log: T.Mesh | null = null, dents: Dent[] = []
  function placeLog() {
    if (log) { scene.remove(log); log.geometry.dispose() }
    const { g, center } = logGeometry(LOG.x - LOG.half, LOG.x + LOG.half, dents, 0)
    log = new T.Mesh(g, logMat); log.castShadow = log.receiveShadow = true; log.position.copy(center); scene.add(log)
  }

  // ---------------------------------------------------- cloth: Verlet simulation
  const clothOld = find('Test_Cloth')
  const clothMat = (clothOld.material as T.MeshStandardMaterial).clone(); clothMat.side = T.DoubleSide
  clothOld.visible = false
  const NX = smallMove ? 18 : 30, NY = smallMove ? 24 : 40, ax = CLOTH.width / (NX - 1), ay = CLOTH.length / (NY - 1)
  const clothGeo = new T.BufferGeometry(), P = new Float32Array(NX * NY * 3), O = new Float32Array(NX * NY * 3)
  const uvK = new Float32Array(NX * NY * 2)
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { uvK[(j * NX + i) * 2] = i / (NX - 1) * 2; uvK[(j * NX + i) * 2 + 1] = 2 - j / (NY - 1) * 2 }
  clothGeo.setAttribute('position', new T.BufferAttribute(P, 3)); clothGeo.setAttribute('uv', new T.BufferAttribute(uvK, 2))
  const cloth = new T.Mesh(clothGeo, clothMat); cloth.castShadow = cloth.receiveShadow = true; cloth.frustumCulled = false; scene.add(cloth)
  let binds: { a: number; b: number; L: number; var: boolean }[] = [], clearFrame = new Uint8Array((NX - 1) * (NY - 1)), torn = 0, clothDetached = false
  const nk = (i: number, j: number) => j * NX + i
  const broken = new Set<number>(), bindKey = (a: number, b: number) => Math.min(a, b) * NX * NY + Math.max(a, b)
  function setupCloth() {
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = nk(i, j) * 3, x = CLOTH.x - CLOTH.width / 2 + i * ax, y = CLOTH.top - j * ay, z = CLOTH.z + Math.sin(i / 2.2 + j / 9) * .012 * (j / NY)
      P[k] = O[k] = x; P[k + 1] = O[k + 1] = y; P[k + 2] = O[k + 2] = z
    }
    binds = []
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      if (i < NX - 1) binds.push({ a: nk(i, j), b: nk(i + 1, j), L: ax, var: true })
      if (j < NY - 1) binds.push({ a: nk(i, j), b: nk(i, j + 1), L: ay, var: true })
      if (i < NX - 1 && j < NY - 1) binds.push({ a: nk(i, j), b: nk(i + 1, j + 1), L: Math.hypot(ax, ay), var: true })
    }
    clearFrame.fill(0); broken.clear(); torn = 0; clothDetached = false; clothIndex()
  }
  function clothIndex() {
    const idx: number[] = []
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      if (clearFrame[j * (NX - 1) + i]) continue
      const a = nk(i, j), b = nk(i + 1, j), c = nk(i, j + 1), d = nk(i + 1, j + 1)
      // Quads with a broken link are not drawn; otherwise triangle strips stretch between separated pieces.
      if (broken.has(bindKey(a, b)) || broken.has(bindKey(a, c)) || broken.has(bindKey(a, d)) || broken.has(bindKey(b, d)) || broken.has(bindKey(c, d))) continue
      idx.push(a, c, b, b, c, d)
    }
    clothGeo.setIndex(idx); clothGeo.computeVertexNormals()
  }
  function clothStep(dt: number) {
    const h = Math.min(dt, .025), wind = Math.sin(performance.now() * .0011) * .12
    for (let k = 0; k < NX * NY; k++) {
      if (k < NX) continue
      const i = k * 3
      for (let c = 0; c < 3; c++) {
        const v = (P[i + c] - O[i + c]) * .985
        O[i + c] = P[i + c]
        P[i + c] += v + (c === 1 ? -6.5 : c === 2 ? wind : 0) * h * h
      }
      if (P[i + 1] < .015) { P[i + 1] = .015; O[i] = P[i]; O[i + 2] = P[i + 2] }
    }
    for (let d = 0; d < 3; d++) for (const b of binds) {
      if (!b.var) continue
      const i = b.a * 3, j = b.b * 3, dx = P[j] - P[i], dy = P[j + 1] - P[i + 1], dz = P[j + 2] - P[i + 2]
      const u = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, f = (u - b.L) / u * .5
      const ai = b.a < NX ? 0 : 1, bi = b.b < NX ? 0 : 1, topV = ai + bi || 1
      const fa = f * 2 * ai / topV, fb = f * 2 * bi / topV
      P[i] += dx * fa; P[i + 1] += dy * fa; P[i + 2] += dz * fa
      P[j] -= dx * fb; P[j + 1] -= dy * fb; P[j + 2] -= dz * fb
    }
    clothGeo.attributes.position.needsUpdate = true; clothGeo.computeVertexNormals()
  }
  function clothLinkCheck() {
    const see = new Uint8Array(NX * NY), kom: number[][] = Array.from({ length: NX * NY }, () => [])
    for (const b of binds) if (b.var) { kom[b.a].push(b.b); kom[b.b].push(b.a) }
    const y: number[] = []; for (let i = 0; i < NX; i++) { see[i] = 1; y.push(i) }
    while (y.length) { for (const n of kom[y.pop()!]) if (!see[n]) { see[n] = 1; y.push(n) } }
    return see.some(v => !v)
  }

  // ---------------------------------------------------- falling pieces
  const falling: Body[] = []; let detachedOne = 0
  const up = new T.Vector3(0, 1, 0), a3 = new T.Vector3(), t3 = new T.Vector3()
  function dropDown(mesh: T.Mesh, axis: T.Vector3, half: number, r: number, v: T.Vector3, w: T.Vector3) {
    falling.push({ mesh, v, w, axis, half, r, dur: false }); detachedOne++
  }

  // ---------------------------------------------------- damage values (for the UI)
  const damage = [0, 0, 0]
  function reset() {
    falling.forEach(b => {
      if (b.mesh.children.length) b.mesh.children.slice().forEach(c => scene.attach(c))
      scene.remove(b.mesh); b.mesh.geometry.dispose()
    })
    falling.length = 0; detachedOne = 0; damage.fill(0)
    rollTraces.forEach(m => { rollGroup.remove(m); m.geometry.dispose(); (m.material as T.Material).dispose() }); rollTraces.length = 0
    rollGroup.rotation.set(0, 0, 0); rollGroup.updateMatrixWorld(true); sway.x = sway.v = 0
    rings.forEach((h, i) => { scene.attach(h); h.matrixWorld.copy(ringFirst[i]); h.matrixWorld.decompose(h.position, h.quaternion, h.scale); rollGroup.attach(h) })
    scene.attach(post); postFirst.decompose(post.position, post.quaternion, post.scale); rollGroup.attach(post)
    placeRoll({ y: ROLL.top, m: 0 })
    dents = []; placeLog(); setupCloth()
    kirList.forEach(k => { k.life = 0; k.p.set(0, -9, 0) })
  }
  reset()

  // ---------------------------------------------------- strikes
  function strikeRoll(a: T.Vector3, b: T.Vector3, power: number): StrikeResult {
    const dir = b.clone().sub(a), point = targetCenter[0].clone()
    const slope = T.MathUtils.clamp(dir.y / (Math.abs(dir.x) < 1e-3 ? 1e-3 * Math.sign(dir.x || 1) : dir.x), -1.1, 1.1)
    const kk = Math.abs(dir.x) < 1e-3 ? .5 : (ROLL.x - a.x) / dir.x
    const vertical = Math.abs(dir.x) < Math.abs(dir.y) * .12
    const yC = vertical ? (a.y + b.y) / 2 : a.y + dir.y * kk
    const topY = rollTop.y
    if ((!vertical && (kk < -.2 || kk > 1.2)) || yC < ROLL.bottom + .05 || yC > topY - .025) return { hit: false, detached: false, message: 'Hasır ruloyu ıskaladın. Kesim çizgisi rulodan geçmeli.', sound: 'cut', point }
    point.set(ROLL.x, yC, ROLL.z + ROLL.r)
    sway.v += -Math.sign(dir.x || 1) * (.6 + power * 1.1)
    sheet(point, STRAW, 18, dir.clone().normalize())
    if (power < .28) {
      const m = new T.Mesh(new T.TorusGeometry(ROLL.r + .0005, .004, 6, 32, Math.PI * .9), new T.MeshStandardMaterial({ color: '#3a2a10', roughness: 1 }))
      m.rotation.x = Math.PI / 2; m.rotation.y = -Math.atan(slope) * .9; m.rotation.z = Math.PI * .05
      m.position.set(ROLL.x, yC, ROLL.z).sub(rollGroup.position); rollGroup.add(m); rollTraces.push(m)
      damage[0] = Math.min(.45, damage[0] + .12)
      return { hit: true, detached: false, message: 'Hasırda sığ bir kesik açıldı; keskinlik ikiye bölmeye yetmedi. Yine vurabilirsin.', sound: 'cut', point }
    }
    const crossSection: CrossSection = { y: yC, m: slope }
    const { g, center } = rollGeometry(crossSection, rollTop)
    const piece = new T.Mesh(g, [strawMat, sectionMat]); piece.castShadow = piece.receiveShadow = true; piece.position.copy(center); scene.add(piece)
    // Links above the cut fall together with the upper piece.
    rings.forEach(h => { h.getWorldPosition(t3); if (h.parent === rollGroup && t3.y + .011 > yC + slope * 0) piece.attach(h) })
    const y2 = dir.clone().normalize()
    dropDown(piece, new T.Vector3(0, 1, 0), Math.max(.03, (rollTop.y - yC) / 2), ROLL.r, new T.Vector3(y2.x * (.35 + power * .9), .25 + power * .5, .15 + Math.random() * .2), new T.Vector3((Math.random() - .5) * 2, Math.random() - .5, -Math.sign(y2.x || 1) * (1.2 + power * 2.4)))
    placeRoll(crossSection)
    damage[0] = Math.min(1, 1 - (yC - ROLL.bottom) / (ROLL.top - ROLL.bottom) * .7)
    return { hit: true, detached: true, message: `Hasır rulo kesildi; üst parça düştü. Kalan boy %${Math.round((yC - ROLL.bottom) / (ROLL.top - ROLL.bottom) * 100)}.`, sound: 'cut', point }
  }

  function strikeLog(a: T.Vector3, b: T.Vector3, power: number): StrikeResult {
    const dir = b.clone().sub(a), point = targetCenter[1].clone()
    if (!log) return { hit: false, detached: false, message: 'Kütük zaten ikiye ayrıldı. Hedefleri yenile.', sound: 'cut', point }
    const kk = Math.abs(dir.y) < 1e-3 ? .5 : (LOG.y - a.y) / dir.y
    const xC = Math.abs(dir.y) < Math.abs(dir.x) * .15 ? (a.x + b.x) / 2 : a.x + dir.x * kk
    const isVertical = Math.abs(dir.y) >= Math.abs(dir.x) * .15
    if (xC < LOG.x - LOG.half - .03 || xC > LOG.x + LOG.half + .03 || (isVertical && (kk < -.35 || kk > 1.35))) return { hit: false, detached: false, message: 'Kütüğü ıskaladın. Kesim çizgisi kütükten geçmeli.', sound: 'cut', point }
    const x = T.MathUtils.clamp(xC, LOG.x - LOG.half + .03, LOG.x + LOG.half - .03)
    const angle = !isVertical ? Math.PI / 2 : dir.y < 0 ? .18 : Math.PI - .18
    const dd = .010 + power * power * .052
    const near = dents.find(o => Math.abs(o.x - x) < .045 && Math.abs(o.angle - angle) < 1.2)
    if (near) near.d += dd; else dents.push({ x, angle, d: dd })
    const o = near ?? dents[dents.length - 1]
    const surface = new T.Vector3(x, LOG.y + Math.cos(angle) * .1, LOG.z + Math.sin(angle) * .1)
    point.copy(surface); sheet(surface, FRESH_WOOD, 12 + Math.round(power * 18), dir.clone().normalize())
    damage[1] = Math.min(1, Math.max(damage[1], o.d / .17))
    if (o.d < .165) {
      placeLog()
      return { hit: true, detached: false, message: power < .3 ? `Sığ bir çentik: ${Math.round(o.d * 1000)} mm. Sert ağaç keskinliğini sınıyor.` : `Kütükte oyuk derinliği ${Math.round(o.d * 1000)} mm. Aynı yere vurmaya devam edersen ayrılır.`, sound: power < .3 ? 'ting' : 'cut', point }
    }
    // Deep enough: splits in two and falls off the stand.
    scene.remove(log); log.geometry.dispose(); log = null
    const left = logGeometry(LOG.x - LOG.half, x, dents, 2), right = logGeometry(x, LOG.x + LOG.half, dents, 1)
    for (const [p, yn] of [[left, -1], [right, 1]] as const) {
      const m = new T.Mesh(p.g, logMat); m.castShadow = m.receiveShadow = true; m.position.copy(p.center); scene.add(m)
      const uz = Math.abs(p.center.x - (yn < 0 ? LOG.x - LOG.half : LOG.x + LOG.half))
      dropDown(m, new T.Vector3(1, 0, 0), uz, LOG.r, new T.Vector3(yn * .25, -.1, .3 * Math.random()), new T.Vector3(0, 0, yn * (1.4 + Math.random())))
    }
    sheet(surface, FRESH_WOOD, 26, up)
    damage[1] = 1
    return { hit: true, detached: true, message: 'Kütük oyulan yerden ikiye ayrıldı!', sound: 'cut', point }
  }

  function strikeCloth(a: T.Vector3, b: T.Vector3, power: number): StrikeResult {
    const point = targetCenter[2].clone(), dir = b.clone().sub(a)
    const left = CLOTH.x - CLOTH.width / 2 - .03, right = CLOTH.x + CLOTH.width / 2 + .03
    // Clip the cut line to the cloth's rectangle.
    let t0 = 0, t1 = 1
    for (const [p, q] of [[-dir.x, a.x - left], [dir.x, right - a.x], [-dir.y, a.y - (CLOTH.top - CLOTH.length - .1)], [dir.y, CLOTH.top - a.y]]) {
      if (p === 0) { if (q < 0) t1 = -1; continue }
      const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r)
    }
    if (t0 >= t1) return { hit: false, detached: false, message: 'Kumaşı ıskaladın. Kesim çizgisi kumaştan geçmeli.', sound: 'cut', point }
    const mid = (t0 + t1) / 2; point.copy(a).addScaledVector(dir, mid); point.z = CLOTH.z
    // Every strike sways the cloth.
    for (let k = NX; k < NX * NY; k++) {
      const i = k * 3, u = Math.hypot(P[i] - point.x, P[i + 1] - point.y), e = Math.max(0, 1 - u / .55)
      if (e > 0) { O[i] -= dir.x * e * .012; O[i + 1] -= dir.y * e * .006; O[i + 2] -= (.018 + power * .02) * e }
    }
    sheet(point, CLOTH_COLOR, power < .3 ? 2 : 8, dir.clone().normalize())
    if (power < .3) return { hit: true, detached: false, message: 'Körelmiş ağız gevşek kumaşı kesemedi, sadece savurdu. Bileme keskinliği belirler.', sound: 'cut', point }
    const ratio = power >= .72 ? 1 : .18 + (power - .3) / .42 * .72, y = (t1 - t0) / 2 * ratio
    const a2 = new T.Vector2(a.x + dir.x * (mid - y), a.y + dir.y * (mid - y)), b2 = new T.Vector2(a.x + dir.x * (mid + y), a.y + dir.y * (mid + y))
    const p1 = new T.Vector2(), p2 = new T.Vector2()
    for (const c of binds) {
      if (!c.var) continue
      p1.set(P[c.a * 3], P[c.a * 3 + 1]); p2.set(P[c.b * 3], P[c.b * 3 + 1])
      if (intersects(a2, b2, p1, p2)) { c.var = false; broken.add(bindKey(c.a, c.b)) }
    }
    const uz = b2.distanceTo(a2)
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const k = nk(i, j) * 3, cx = P[k] + ax / 2, cy = P[k + 1] - ay / 2
      const dx = b2.x - a2.x, dy = b2.y - a2.y, l2 = dx * dx + dy * dy || 1e-6, tt = T.MathUtils.clamp(((cx - a2.x) * dx + (cy - a2.y) * dy) / l2, 0, 1)
      if (Math.hypot(cx - a2.x - dx * tt, cy - a2.y - dy * tt) < Math.min(ax, ay) * .62) clearFrame[j * (NX - 1) + i] = 1
    }
    torn += uz; damage[2] = Math.min(1, torn / 1.1); clothIndex()
    const detached = !clothDetached && clothLinkCheck()
    if (detached) { clothDetached = true; detachedOne++; damage[2] = 1 }
    return { hit: true, detached, message: detached ? 'Kumaş boydan boya kesildi; alt parça düştü.' : `Kumaşta ${Math.round(uz * 100)} cm yırtık açıldı.${power < .72 ? ' Daha keskin bir ağız daha uzun keser.' : ''}`, sound: 'cut', point }
  }

  return {
    strike: (target: number, a: T.Vector3, b: T.Vector3, power: number) => target === 0 ? strikeRoll(a, b, power) : target === 1 ? strikeLog(a, b, power) : strikeCloth(a, b, power),
    reset,
    detachedOne: () => detachedOne,
    damages: () => damage.slice(),
    // Rectangle that VR swings are snapped to; its top lowers as the roll is cut.
    box: (i: number) => i === 0 ? { minX: ROLL.x - ROLL.r, maxX: ROLL.x + ROLL.r, minY: ROLL.bottom + .06, maxY: Math.max(ROLL.bottom + .07, rollTop.y - .03), z: ROLL.z }
      : i === 1 ? { minX: LOG.x - LOG.half, maxX: LOG.x + LOG.half, minY: LOG.y - LOG.r, maxY: LOG.y + LOG.r, z: LOG.z }
      : { minX: CLOTH.x - CLOTH.width / 2, maxX: CLOTH.x + CLOTH.width / 2, minY: CLOTH.top - CLOTH.length, maxY: CLOTH.top, z: CLOTH.z },
    update(dt: number, active: boolean) {
      // The cloth is simulated only while in the test area.
      if (active) clothStep(dt)
      bowStep(sway, 90, 7, dt); rollGroup.rotation.z = sway.x * .12
      for (const b of falling) {
        if (b.dur) continue
        b.v.y -= 9.8 * dt; b.mesh.position.addScaledVector(b.v, dt)
        const u = b.w.length()
        if (u > 1e-3) b.mesh.quaternion.premultiply(qt.setFromAxisAngle(a3.copy(b.w).divideScalar(u), u * dt))
        a3.copy(b.axis).applyQuaternion(b.mesh.quaternion)
        const ay2 = Math.abs(a3.y), height = ay2 * b.half + b.r * Math.sqrt(Math.max(0, 1 - a3.y * a3.y))
        if (b.mesh.position.y < height) {
          b.mesh.position.y = height
          b.v.y = b.v.y < -.6 ? -b.v.y * .22 : 0
          b.v.x *= .9; b.v.z *= .9; b.w.multiplyScalar(.9)
          // A piece that touches the ground tips over.
          if (ay2 > .08) { t3.crossVectors(a3, up).multiplyScalar(-Math.sign(a3.y) * 13 * dt); if (t3.lengthSq() < 1e-7) t3.set(.1, 0, 0); b.w.add(t3) }
          if (b.v.lengthSq() < .004 && b.w.lengthSq() < .01 && ay2 < .1) { b.v.set(0, 0, 0); b.w.set(0, 0, 0); b.dur = true }
        }
      }
      for (let i = 0; i < COUNT; i++) {
        const k = kirList[i]
        if (k.life <= 0) { m4.makeScale(0, 0, 0); crumb.setMatrixAt(i, m4); continue }
        k.life -= dt; k.v.y -= 9.8 * dt; k.p.addScaledVector(k.v, dt)
        k.q.x += k.w.x * dt; k.q.y += k.w.y * dt; k.q.z += k.w.z * dt
        if (k.p.y < .012) { k.p.y = .012; k.v.set(k.v.x * .4, Math.abs(k.v.y) * .15, k.v.z * .4); k.w.multiplyScalar(.3) }
        const ol = k.scale * Math.min(1, k.life * 2)
        m4.compose(k.p, qt.setFromEuler(k.q), s3.set(ol, ol, ol)); crumb.setMatrixAt(i, m4)
      }
      crumb.instanceMatrix.needsUpdate = true
    },
    clear() {
      reset(); standing?.geometry.dispose(); log?.geometry.dispose(); clothGeo.dispose(); crumb.geometry.dispose(); kiriMat.dispose(); sectionTex.dispose(); sectionMat.dispose(); logMat.dispose(); clothMat.dispose()
      scene.remove(rollGroup, crumb, cloth); if (log) scene.remove(log)
    },
  }
}
