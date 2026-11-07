// Çini atölyesinin VR oturumu: oyunu kumanda ışınıyla oynatır. Oyun kuralı burada yoktur; sahnedeki işaret yoluna bağlanır.
import * as THREE from 'three'
import type { Action, Game } from './state'
import type { HoldName } from './scene'

export interface XrContext {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; plate: THREE.Group
  game: () => Game; actions: () => Action[]; stageName: () => string; quality: () => number
  heatRange: () => { min: number; max: number }
  markerStart: (r: THREE.Ray) => void; walkMarkers: (r: THREE.Ray) => void; markerRelease: () => void
  command: (id: string) => void; hold: (ad: HoldName, open: boolean) => void; master: () => void
  hideTool: () => void; resize: () => void; plateRadius: number; restoreCamera: () => void
}
export interface TileXr { start: () => Promise<void>; finish: () => void; frame: () => void; active: () => boolean; isHeld: () => boolean; clear: () => void }

const G = 1024, Y = 900, METER = .66
const HEAD_Y = 300, LINE = 64, GAP = 8
const TEXT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
const LABEL = 'Temsilî çini · Oyun ölçeği'

/** Panel satırları: oyun eylemleri, ustaya bırak ve çıkış. */
export function panelItems(items: Action[], hasMaster: boolean): Action[] {
  return [...items, ...(hasMaster ? [{ id: 'master', ad: 'Ustaya bırak', tour: 'head' as const }] : []), { id: 'exit', ad: "VR'dan çık", tour: 'head' as const }]
}
/** `v` üst kenarda 1'dir. */
export function panelHit(v: number, count: number) {
  const py = (1 - v) * Y
  if (py < HEAD_Y) return -1
  const i = Math.floor((py - HEAD_Y) / (LINE + GAP))
  return i < count && (py - HEAD_Y) % (LINE + GAP) <= LINE ? i : -1
}

function wrapLine(c: CanvasRenderingContext2D, text: string, en: number) {
  const o: string[] = []; let s = ''
  for (const k of text.split(' ')) { const y = s ? `${s} ${k}` : k; if (c.measureText(y).width > en && s) { o.push(s); s = k } else s = y }
  if (s) o.push(s)
  return o
}

export function setupXr(b: XrContext): TileXr {
  const { renderer, scene, camera, plate } = b
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  const rig = new THREE.Group()
  rig.position.set(0, 0, .72)

  const el = document.createElement('canvas'); el.width = G; el.height = Y
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  const texture = new THREE.CanvasTexture(el); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8
  const panelG = new THREE.PlaneGeometry(METER, (METER * Y) / G)
  const panelM = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  const panel = new THREE.Mesh(panelG, panelM)
  panel.position.set(-.56, 1.26, .08); panel.rotation.y = .5

  let signature = '', items: Action[] = []
  const drawPanel = () => {
    const d = b.game(), list = panelItems(b.actions(), d.stage < 6 && !(d.stage === 5 && d.alt === 2))
    const fresh = JSON.stringify([d.stage, d.alt, d.message, Math.round(d.heat / 4), list.map((o) => [o.id, o.passive, o.selected]), d.inKiln, d.stage === 6 ? b.quality() : 0])
    if (fresh === signature) return
    signature = fresh; items = list
    c.fillStyle = '#f7f3e8'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#123f62'; c.fillRect(0, 0, G, 66)
    c.fillStyle = '#fff'; c.font = `700 32px ${TEXT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(LABEL, G / 2, 34)
    c.textAlign = 'left'; c.fillStyle = '#123f62'; c.font = `700 52px ${TEXT}`; c.fillText(`${d.stage + 1}/7 · ${b.stageName()}`, 40, 112)
    c.fillStyle = '#253a34'; c.font = `400 33px ${TEXT}`
    wrapLine(c, d.stage === 6 ? `${d.message} Kalite: ${b.quality()}/100` : d.message, G - 80).slice(0, 2).forEach((s, i) => c.fillText(s, 40, 176 + i * 42))
    if (d.inKiln) {
      const a = b.heatRange(), x = (v: number) => 40 + ((G - 80) * Math.min(v, 1100)) / 1100
      c.fillStyle = '#d9d2c1'; c.fillRect(40, 262, G - 80, 22)
      c.fillStyle = '#2f9e6a'; c.fillRect(x(a.min), 262, x(a.max) - x(a.min), 22)
      c.fillStyle = '#c5301f'; c.fillRect(x(d.heat) - 4, 254, 8, 38)
    }
    list.forEach((o, i) => {
      const yy = HEAD_Y + i * (LINE + GAP)
      c.fillStyle = o.passive ? '#d9d5c9' : o.selected ? '#d99a36' : o.id === 'exit' ? '#7b2c20' : '#1e4d5e'
      c.beginPath(); c.roundRect(40, yy, G - 80, LINE, 12); c.fill()
      c.fillStyle = o.passive ? '#857f70' : '#fff'; c.font = `600 34px ${TEXT}`; c.textAlign = 'center'; c.fillText(o.ad, G / 2, yy + LINE / 2 + 1); c.textAlign = 'left'
    })
    texture.needsUpdate = true
  }

  const rayG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)])
  const rayM = new THREE.LineBasicMaterial({ color: '#f7f3e8', toneMapped: false })
  const elG = new THREE.SphereGeometry(.018, 12, 8), elM = new THREE.MeshBasicMaterial({ color: '#f0e1bc', toneMapped: false })
  const raycaster = new THREE.Raycaster()
  let session: XRSession | null = null, closed = false, holder: THREE.Object3D | null = null
  const offset = new THREE.Matrix4(), m = new THREE.Matrix4(), position = new THREE.Vector3(), turn = new THREE.Quaternion(), scale = new THREE.Vector3()

  interface El { controller: THREE.XRTargetRaySpace; markers: boolean; heldName: HoldName | null; listen: [string, () => void][] }
  const ray = (k: THREE.Object3D) => { k.updateWorldMatrix(true, false); raycaster.setFromXRController(k as THREE.XRTargetRaySpace); return raycaster.ray }

  const head = (e: El) => {
    if (!session) return
    const r = ray(e.controller), h = raycaster.intersectObject(panel, false)[0]
    if (h?.uv) {
      const o = items[panelHit(h.uv.y, items.length)]
      if (!o || o.passive) return
      if (o.id === 'exit') { finish(); return }
      if (o.id === 'master') { b.master(); return }
      if (o.tour === 'hold') { e.heldName = o.id as HoldName; b.hold(e.heldName, true); return }
      b.command(o.id)
      return
    }
    e.markers = true
    b.markerStart(r)
  }
  const release = (e: El) => {
    if (e.heldName) { b.hold(e.heldName, false); e.heldName = null }
    if (e.markers) { e.markers = false; b.markerRelease() }
  }
  // İnceleme adımında yan tuş tabağı ele alır.
  const grab = (e: El) => {
    if (!session || b.game().stage !== 6 || holder) return
    holder = e.controller
    e.controller.updateWorldMatrix(true, false); plate.updateWorldMatrix(true, false)
    offset.copy(e.controller.matrixWorld).invert().multiply(plate.matrixWorld)
  }
  const shakeIt = (e: El) => { if (holder === e.controller) holder = null }

  const hands: El[] = [0, 1].map((i) => {
    const controller = xr.getController(i)
    controller.add(new THREE.Line(rayG, rayM), new THREE.Mesh(elG, elM))
    const e: El = { controller, markers: false, heldName: null, listen: [] }
    e.listen = [['selectstart', () => head(e)], ['selectend', () => release(e)], ['squeezestart', () => grab(e)], ['squeezeend', () => shakeIt(e)], ['disconnected', () => { release(e); shakeIt(e) }]]
    for (const [o, f] of e.listen) controller.addEventListener(o as 'selectstart', f)
    rig.add(controller)
    return e
  })

  const fallback = { near: 0, far: 0 }
  const enter = (fresh: XRSession) => {
    session = fresh
    fallback.near = camera.near; fallback.far = camera.far
    camera.near = .03; camera.far = 40
    rig.add(camera); scene.add(rig, panel)
    signature = ''
  }
  const undo = () => {
    hands.forEach(release)
    holder = null
    b.hideTool()
    camera.removeFromParent(); camera.scale.set(1, 1, 1)
    camera.near = fallback.near; camera.far = fallback.far
    rig.removeFromParent(); panel.removeFromParent()
    session = null
  }
  const ended = () => { if (!session) return; undo(); b.restoreCamera() }
  xr.addEventListener('sessionend', ended)
  const finish = () => { session?.end().catch(() => {}) }

  return {
    start: async () => {
      if (session) return
      if (!navigator.xr) throw new Error('Bu tarayıcıda WebXR yok')
      const fresh = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
      if (closed) { await fresh.end().catch(() => {}); throw new Error('Sahne kapandı') }
      await xr.setSession(fresh)
      xr.setFoveation(1)
      enter(fresh)
    },
    finish,
    active: () => session !== null,
    isHeld: () => holder !== null,
    frame: () => {
      drawPanel()
      for (const e of hands) {
        if (e.markers) b.walkMarkers(ray(e.controller))
        else if (e === hands[1] && !hands[0].markers && !e.heldName) {
          // Basılmadan da alet ışının ucunda görünür: nereye dokunacağın belli olsun.
          const r = ray(e.controller)
          if (!raycaster.intersectObject(panel, false)[0]) b.walkMarkers(r)
        }
      }
      if (holder) {
        holder.updateWorldMatrix(true, false)
        m.multiplyMatrices(holder.matrixWorld, offset).decompose(position, turn, scale)
        plate.position.copy(position); plate.quaternion.copy(turn)
      }
    },
    clear: () => {
      closed = true
      xr.removeEventListener('sessionend', ended)
      if (session) { const a = session; undo(); a.end().catch(() => {}) }
      for (const e of hands) { for (const [o, f] of e.listen) e.controller.removeEventListener(o as 'selectstart', f); e.controller.removeFromParent() }
      texture.dispose(); panelG.dispose(); panelM.dispose(); rayG.dispose(); rayM.dispose(); elG.dispose(); elM.dispose()
    },
  }
}
