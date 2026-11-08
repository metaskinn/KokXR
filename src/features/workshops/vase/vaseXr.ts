// Vase repair in VR: grab a piece with the Quest controller, carry it to its place, seat it. Touches the vase scene only through VaseXrContext.
// The pure calculations in the top section are also used by the desktop scene; at runtime the file depends only on three, and the Node test imports it directly.
import * as THREE from 'three'

export const ILLUSTRATIVE_MODEL_LABEL = 'Temsilî model · Tarihî eser değildir'
export const PIECE_COUNT = 6

/** Rig scale: one device meter is 100 model units. The vase model is 44 units and appears 44 cm in VR. */
export const METER = 100
/** A piece seats if its center is this close to the target (model units, i.e. cm). */
export const XR_SEAT_THRESHOLD = 9
/** The desktop turntable is 66 units; in VR it is shrunk so the user does not end up inside it. */
export const XR_TABLE_RADIUS = 50
const VASE_DISTANCE = 0.7

export type Pointed = [number, number, number]

export function snapsIn(distance: number, threshold: number) {
  return distance < threshold
}

/** On desktop proximity is measured on screen: the pixel threshold is 20–34 depending on area width. */
export function screenThreshold(width: number) {
  return Math.max(20, Math.min(34, width * 0.055))
}

/** Turntable height in device space (meters): reachable both standing and seated. */
export function tableHeight(headY: number) {
  return Math.min(0.85, Math.max(0.55, headY - 0.85))
}

/** Put the model origin in front of the head at table height, with the user viewing the vase from the desktop repair angle (from +z). */
export function vaseRig(head: { x: number; y: number; z: number; yaw: number }) {
  const localX = head.x - Math.sin(head.yaw) * VASE_DISTANCE
  const localZ = head.z - Math.cos(head.yaw) * VASE_DISTANCE
  const rotY = -head.yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: -METER * (localX * c + localZ * s),
    y: -METER * tableHeight(head.y),
    z: -METER * (-localX * s + localZ * c),
    rotY,
  }
}

// Degrees: +z faces the user. No piece directly in front, so the vase is not blocked. Piece order is shuffled so neighboring pieces do not land in neighboring slots.
const SHELF_ANGLES = [-35, 150, 95, 35, -95, -150]
const SHELF_RADIUS = 35

/** In VR the pieces sit around the vase, on the turntable. `bottomShares`: distance from the center to the bottom of the piece. */
export function xrShelfLayout(bottomShares: number[], turntableY: number): Pointed[] {
  return bottomShares.map((alt, id) => {
    const a = (SHELF_ANGLES[id % SHELF_ANGLES.length] * Math.PI) / 180
    return [Math.sin(a) * SHELF_RADIUS, turntableY + alt, Math.cos(a) * SHELF_RADIUS]
  })
}

export interface PieceCandidate { id: number; center: Pointed; radius: number }

/** First the piece the controller touches, otherwise the piece the ray passes most centrally through. `null` if there is no candidate. */
export function selectPiece(start_: Pointed, dir: Pointed, candidates: PieceCandidate[], reach: number): number | null {
  let touching: number | null = null, nearestTouch = 1
  let aimed: number | null = null, bestAim = 1
  for (const { id, center, radius } of candidates) {
    const f: Pointed = [center[0] - start_[0], center[1] - start_[1], center[2] - start_[2]]
    const distance = Math.hypot(...f)
    if (distance / radius < nearestTouch) { nearestTouch = distance / radius; touching = id }
    const t = f[0] * dir[0] + f[1] * dir[1] + f[2] * dir[2]
    if (t <= 0 || t > reach) continue
    const upright = Math.sqrt(Math.max(0, distance * distance - t * t))
    if (upright / radius < bestAim) { bestAim = upright / radius; aimed = id }
  }
  return touching ?? aimed
}

export type VasePhase = 'traceless' | 'repair' | 'done'

/** A repaired vase counts as done even if the desktop switched back to inspection: its traces are permanent. */
export function vaseStage_(repair: boolean, placed: number): VasePhase {
  if (placed >= PIECE_COUNT) return 'done'
  return repair ? 'repair' : 'traceless'
}

// Two side-by-side buttons in the panel's bottom row. uv.y 1 is the top edge.
const BUTTON_V = { min: 0.07, max: 0.31 }
const BUTTON_U = [{ min: 0.05, max: 0.48 }, { min: 0.52, max: 0.95 }]
/** Index of the button at panel point (u, v); `null` if there is none. */
export function panelButton(u: number, v: number): number | null {
  if (v < BUTTON_V.min || v > BUTTON_V.max) return null
  const i = BUTTON_U.findIndex((d) => u >= d.min && u <= d.max)
  return i < 0 ? null : i
}

export type PanelAction = 'shatter' | 'exit'

export function panelText(phase: VasePhase, placed: number, result: string) {
  const exit = { id: 'exit' as PanelAction, name: "VR'dan çık" }
  if (phase === 'traceless') return {
    title: 'Vazoyu incele', progress: 'İzsiz vazo',
    hint: 'Vazoyu tutup çevir. Hazır olunca parçala.',
    buttons: [{ id: 'shatter' as PanelAction, name: 'Vazoyu parçala' }, exit],
  }
  const progress = `${placed}/${PIECE_COUNT} parça yerinde`
  if (phase === 'done') return {
    title: 'Vazo onarıldı!', progress,
    hint: 'Vazoyu tutup çevir, onarım izlerini incele.',
    buttons: [{ id: 'shatter' as PanelAction, name: 'Yeniden parçala' }, exit],
  }
  return {
    title: 'Vazoyu onar', progress,
    hint: result || 'Parçayı tetik veya yan tuşla tut, götür, bırak.',
    buttons: [{ id: 'shatter' as PanelAction, name: 'Yeniden başlat' }, exit],
  }
}

// ---------- Session ----------

export interface VaseXrContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  pieces: THREE.Object3D[]
  targets: { position: THREE.Vector3; quaternion: THREE.Quaternion }[]
  /** Objects carried with the vase while the pieces are in place (traceless body, repair traces). */
  wholeObjects: THREE.Object3D[]
  /** Is this a grabbable piece that has not seated yet? */
  isFree: (id: number) => boolean
  /** Can the whole vase be turned in hand: traceless, or repair finished and animation stopped. */
  isInspecting: () => boolean
  phase: () => VasePhase
  placedCount: () => number
  /** From the panel: the desktop shatter flow. The resulting state comes back through `reset`. */
  shatterRequest: () => void
  gripStarted: (id: number) => void
  /** The desktop release path: animation and game state go through the same place. */
  release: (id: number, seated: boolean) => void
  /** Returns to the shelf without counting a game attempt (controller disconnected, session closed). */
  gripCancel: (id: number) => void
  select: (id: number | null) => void
  emphasize: (ids: number[]) => void
  /** VR layout and locks; `false` returns to the desktop view. */
  xrMode: (open: boolean, shelves?: Pointed[]) => void
  sessionEnded: () => void
}

export interface VaseXr {
  /** Goes to requestSession immediately when called: must be called inside a user gesture. Leaves no trace in the scene if rejected. */
  /** `ar`: the same repair game in the real room (passthrough on Quest 3, camera on Android); no floor, stand or background. */
  start: (mode?: 'vr' | 'ar') => Promise<void>
  frame: () => void
  finish: () => void
  active: () => boolean
  /** On game restart: releases grips, takes the vase off the holder. Piece positions belong to the scene. */
  reset: () => void
  clear: () => void
}

const RAY_LENGTH = 1.5
const VASE_CENTER_Y = 22
const VASE_RADIUS = 22
// The vase is pulled to the hand so it does not swing like a lever when grabbed and turned from afar. Device meters.
const VASE_HAND_DISTANCE = 0.25
const TURNTABLE_TOP = -1.25
const TEXT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const FLOOR = '#f8f5ef', CAM = '#244e40', TEXT_ = '#253a34', BRONZE = '#8e6236', WHITE = '#ffffff'

export function canvasPlane(width: number, height: number, realWidth: number) {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Canvas unavailable')
  const texture = new THREE.CanvasTexture(el)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const geometry = new THREE.PlaneGeometry(realWidth, (realWidth * height) / width)
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, depthWrite: false })
  const obj = new THREE.Mesh(geometry, material)
  return { c, texture, obj, dispose: () => { texture.dispose(); material.dispose(); geometry.dispose() } }
}

/** Title, progress, hint and two buttons matching `panelButton`. `realWidth` is in scene units. */
export function statePanel(realWidth = 64) {
  const G = 1024, Y = 512
  const p = canvasPlane(G, Y, realWidth)
  const draw = ({ title, progress, hint, buttons }: { title: string; progress: string; hint: string; buttons: { name: string }[] }, over: number | null) => {
    const { c } = p
    c.fillStyle = FLOOR
    c.fillRect(0, 0, G, Y)
    c.fillStyle = BRONZE
    c.fillRect(0, 0, G, 100)
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillStyle = WHITE
    c.font = `700 56px ${TEXT}`
    c.fillText(title, G / 2, 50, G - 80)
    c.fillStyle = CAM
    c.font = `700 52px ${TEXT}`
    c.fillText(progress, G / 2, 165, G - 80)
    c.fillStyle = TEXT_
    c.font = `400 38px ${TEXT}`
    c.fillText(hint, G / 2, 250, G - 60)
    const top = Y * (1 - BUTTON_V.max), length = Y * (BUTTON_V.max - BUTTON_V.min)
    buttons.forEach(({ name }, i) => {
      const x = G * BUTTON_U[i].min, en = G * (BUTTON_U[i].max - BUTTON_U[i].min)
      c.beginPath()
      c.roundRect(x, top, en, length, 16)
      c.fillStyle = over === i ? BRONZE : CAM
      c.fill()
      c.fillStyle = WHITE
      c.font = `600 48px ${TEXT}`
      c.fillText(name, x + en / 2, top + length / 2, en - 30)
    })
    p.texture.needsUpdate = true
  }
  return { obj: p.obj, draw, dispose: p.dispose }
}

function labelPanel() {
  const G = 1024, Y = 72
  const p = canvasPlane(G, Y, 0.6)
  p.c.fillStyle = BRONZE
  p.c.fillRect(0, 0, G, Y)
  p.c.fillStyle = WHITE
  p.c.font = `700 40px ${TEXT}`
  p.c.textAlign = 'center'
  p.c.textBaseline = 'middle'
  p.c.fillText(ILLUSTRATIVE_MODEL_LABEL, G / 2, Y / 2, G - 80)
  p.texture.needsUpdate = true
  return { obj: p.obj, dispose: p.dispose }
}

interface El {
  controller: THREE.XRTargetRaySpace
  ray: THREE.Line
  trigger: boolean
  side: boolean
  /** Piece id, VASE for the whole vase. */
  held: number | null
  /** Button released, decided at frame start: a disconnecting controller also sends a lone selectend first, then `disconnected`. */
  toRelease: boolean
  offset: THREE.Matrix4
  listeners: [string, () => void][]
}
const VASE = -1

export function setupVaseXr(b: VaseXrContext): VaseXr {
  const { renderer, scene, camera, pieces, targets } = b
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  // Because of the rig scale, scene sizes are model units while rig-internal ones (controller, ray, head) are meters.
  const rig = new THREE.Group()
  rig.scale.setScalar(METER)

  const environment = new THREE.Group()
  const floor = new THREE.Mesh(new THREE.CircleGeometry(250, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1b2a23', roughness: 1 }))
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(9, 15, 1, 32).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: '#2c3d32', roughness: .95 }))
  leg.position.y = TURNTABLE_TOP - 1.5
  environment.add(floor, leg)

  const panel = statePanel()
  panel.obj.position.z = -40 // Height set once the head pose arrives
  const label = labelPanel()
  label.obj.material.depthTest = false
  label.obj.renderOrder = 1003
  label.obj.frustumCulled = false
  label.obj.position.set(0, -0.38, -1.2)

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -RAY_LENGTH)])
  const rayMaterial = new THREE.LineBasicMaterial({ color: '#f8f5ef', toneMapped: false })
  const handGeometry = new THREE.SphereGeometry(0.015, 12, 8)
  const handMaterial = new THREE.MeshBasicMaterial({ color: '#f0e1bc', toneMapped: false })

  // Bottom shares and bounding spheres are measured with the pieces in their target pose; the center is the piece's local origin.
  const box = new THREE.Box3()
  const bottomShares: number[] = []
  const radii: number[] = []
  const measure = () => {
    if (bottomShares.length) return
    pieces.forEach((p, id) => {
      const position = p.position.clone(), turn = p.quaternion.clone()
      p.position.copy(targets[id].position)
      p.quaternion.copy(targets[id].quaternion)
      p.updateWorldMatrix(true, true)
      box.setFromObject(p)
      bottomShares[id] = targets[id].position.y - box.min.y
      radii[id] = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z) / 2
      p.position.copy(position)
      p.quaternion.copy(turn)
      p.updateWorldMatrix(true, true)
    })
  }

  // When the whole vase is grabbed, pieces, traces and the caption move with this holder.
  const stand = new THREE.Group()
  const standHome = new THREE.Vector3(0, VASE_CENTER_Y, 0)
  stand.position.copy(standHome)
  let standOccupied = false, standSpinning = false

  let session: XRSession | null = null
  let starting = false, closed = false, settled = false
  let drawn = '', result = ''

  const raycaster = new THREE.Raycaster()
  const m = new THREE.Matrix4(), position = new THREE.Vector3(), turn = new THREE.Quaternion(), scale = new THREE.Vector3()
  const fallback = { near: 0, far: 0 }
  const wholeHome = new Map<THREE.Object3D, { position: THREE.Vector3; turn: THREE.Quaternion }>()

  const isHeld = (id: number) => hands.some((e) => e.held === id)
  const candidates = (): PieceCandidate[] => {
    if (b.isInspecting()) return isHeld(VASE) ? [] : [{ id: VASE, center: stand.position.toArray(), radius: VASE_RADIUS }]
    const list: PieceCandidate[] = []
    pieces.forEach((p, id) => {
      if (b.isFree(id) && !isHeld(id)) list.push({ id, center: p.position.toArray(), radius: radii[id] })
    })
    return list
  }
  const setupRay = (el: El) => {
    el.controller.updateWorldMatrix(true, false, true)
    raycaster.setFromXRController(el.controller)
  }
  const handCandidate = (el: El) => {
    setupRay(el)
    return selectPiece(raycaster.ray.origin.toArray(), raycaster.ray.direction.toArray(), candidates(), RAY_LENGTH * METER)
  }

  const takeToStand = () => {
    if (standOccupied) return
    standOccupied = true
    scene.add(stand)
    stand.updateWorldMatrix(true, false)
    for (const n of b.wholeObjects) wholeHome.set(n, { position: n.position.clone(), turn: n.quaternion.clone() })
    for (const n of [...pieces, ...b.wholeObjects]) stand.attach(n)
  }
  const removeFromStand = () => {
    if (!standOccupied) return
    standOccupied = false
    standSpinning = false
    stand.position.copy(standHome)
    stand.quaternion.identity()
    stand.updateWorldMatrix(true, false)
    for (const n of [...pieces, ...b.wholeObjects]) scene.attach(n)
    pieces.forEach((p, id) => { p.position.copy(targets[id].position); p.quaternion.copy(targets[id].quaternion) })
    for (const [n, ev] of wholeHome) { n.position.copy(ev.position); n.quaternion.copy(ev.turn) }
    stand.removeFromParent()
  }

  const hold = (el: El, id: number) => {
    el.held = id
    el.ray.visible = false
    el.controller.updateWorldMatrix(true, false, true)
    if (id === VASE) {
      takeToStand()
      standSpinning = false
      el.controller.matrixWorld.decompose(position, turn, scale) // The world matrix carries the rig scale
      turn.invert().multiply(stand.quaternion)
      el.offset.compose(position.set(0, 0, -VASE_HAND_DISTANCE), turn, scale.setScalar(1 / METER))
      return
    }
    b.gripStarted(id)
    b.select(id)
    pieces[id].updateWorldMatrix(true, false)
    el.offset.copy(el.controller.matrixWorld).invert().multiply(pieces[id].matrixWorld)
  }

  const release = (el: El) => {
    const id = el.held
    el.held = null
    el.toRelease = false
    el.ray.visible = true
    if (id === null) return
    if (id === VASE) { standSpinning = true; return }
    const seated = snapsIn(pieces[id].position.distanceTo(targets[id].position), XR_SEAT_THRESHOLD)
    b.release(id, seated)
    result = seated ? `Parça ${id + 1} yerine oturdu.` : 'Henüz yerine yaklaşmadı. Yeniden dene.'
    b.select(null)
  }
  const breakGrip = (el: El) => {
    const id = el.held
    el.held = null
    el.toRelease = false
    el.ray.visible = true
    el.trigger = el.side = false
    if (id === null) return
    if (id === VASE) standSpinning = true
    else { b.gripCancel(id); b.select(null) }
  }

  const finish = () => { session?.end().catch(() => {}) } // end() rejects on an already closed session

  const text = () => panelText(b.phase(), b.placedCount(), result)
  const panelAim = (el: El) => {
    setupRay(el)
    panel.obj.updateWorldMatrix(true, false)
    const hit = raycaster.intersectObject(panel.obj, false)[0]
    return hit?.uv ? panelButton(hit.uv.x, hit.uv.y) : null
  }

  const head = (el: El, kind: 'trigger' | 'side') => {
    if (!session || !settled) return
    el[kind] = true
    el.toRelease = false
    if (el.held !== null) return
    // A user aiming at a button does not want to grab a piece: the panel comes first.
    const button = kind === 'trigger' ? panelAim(el) : null
    if (button !== null) {
      if (text().buttons[button].id === 'exit') finish()
      else b.shatterRequest()
      return
    }
    const id = handCandidate(el)
    if (id !== null) hold(el, id)
  }
  const lift = (el: El, kind: 'trigger' | 'side') => {
    el[kind] = false
    if (!el.trigger && !el.side && el.held !== null) el.toRelease = true
  }

  const hands: El[] = [0, 1].map((i) => {
    const controller = xr.getController(i)
    const ray = new THREE.Line(rayGeometry, rayMaterial)
    controller.add(ray, new THREE.Mesh(handGeometry, handMaterial))
    rig.add(controller)
    const el: El = { controller, ray, trigger: false, side: false, held: null, toRelease: false, offset: new THREE.Matrix4(), listeners: [] }
    el.listeners = [
      ['selectstart', () => head(el, 'trigger')], ['selectend', () => lift(el, 'trigger')],
      ['squeezestart', () => head(el, 'side')], ['squeezeend', () => lift(el, 'side')],
      ['disconnected', () => breakGrip(el)],
    ]
    for (const [event, f] of el.listeners) controller.addEventListener(event as 'selectstart', f)
    return el
  })

  // AR: the virtual floor, stand and dark background would hide the real room; they come back when the session ends.
  let ar = false
  let prevBackground: THREE.Scene['background'] = null
  const prevClear = new THREE.Color()
  let prevAlpha = 1
  const enter = (fresh: XRSession, mode: 'vr' | 'ar') => {
    session = fresh
    ar = mode === 'ar'
    if (ar) {
      prevBackground = scene.background
      scene.background = null
      renderer.getClearColor(prevClear)
      prevAlpha = renderer.getClearAlpha()
      renderer.setClearColor(0x000000, 0)
    }
    measure()
    b.xrMode(true, xrShelfLayout(bottomShares, TURNTABLE_TOP))
    fallback.near = camera.near
    fallback.far = camera.far
    // Near/far work in the rig's internal meters.
    camera.near = 0.05
    camera.far = 30
    rig.add(camera)
    camera.add(label.obj)
    scene.add(rig, panel.obj)
    if (!ar) scene.add(environment)
    drawn = ''
    result = ''
  }

  const undo = () => {
    for (const el of hands) breakGrip(el)
    removeFromStand()
    label.obj.removeFromParent()
    camera.removeFromParent()
    camera.scale.set(1, 1, 1) // Rounding error left over from decomposing out of the rig
    camera.near = fallback.near
    camera.far = fallback.far
    rig.removeFromParent()
    rig.position.set(0, 0, 0)
    rig.rotation.set(0, 0, 0)
    environment.removeFromParent()
    panel.obj.removeFromParent()
    if (ar) {
      scene.background = prevBackground
      renderer.setClearColor(prevClear, prevAlpha)
      ar = false
    }
    session = null
    settled = false
    b.emphasize([])
    b.xrMode(false)
  }
  const onSessionEnd = () => {
    if (!session) return // Closing a half-finished start: the scene was not touched
    undo()
    b.sessionEnded()
  }
  xr.addEventListener('sessionend', onSessionEnd)

  const watch = (el: El) => {
    el.controller.updateWorldMatrix(true, false, true)
    m.multiplyMatrices(el.controller.matrixWorld, el.offset).decompose(position, turn, scale)
    if (el.held === VASE) {
      stand.position.lerp(position, 0.35)
      stand.quaternion.slerp(turn, 0.35)
    } else if (el.held !== null) {
      pieces[el.held].position.copy(position)
      pieces[el.held].quaternion.copy(turn)
    }
  }

  return {
    start: async (mode = 'vr') => {
      if (session || starting) return
      if (!navigator.xr) throw new Error('WebXR not available in this browser')
      starting = true
      const ratio = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2())
      let fresh: XRSession | null = null
      try {
        fresh = await navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', { optionalFeatures: ['local-floor'] })
        // The scene may have closed while waiting for permission: do not leave the user in an empty session.
        if (closed) throw new Error('Scene closed')
        await xr.setSession(fresh)
        if (closed || xr.getSession() !== fresh) throw new Error('VR session closed while opening')
      } catch (error) {
        if (fresh) {
          // If setSession failed midway, closing may break the renderer size.
          const restore = () => {
            xr.removeEventListener('sessionend', restore)
            if (closed) return
            renderer.setPixelRatio(ratio)
            renderer.setSize(size.x, size.y, false)
          }
          xr.addEventListener('sessionend', restore)
          await fresh.end().catch(restore)
        }
        throw error
      } finally {
        starting = false
      }
      xr.setFoveation(1)
      enter(fresh, mode)
    },
    frame: () => {
      if (!session) return
      if (!settled) {
        // Until the head pose arrives, where "in front" of the vase is cannot be known.
        const frame = xr.getFrame(), space = xr.getReferenceSpace()
        const pose = frame && space ? frame.getViewerPose(space) : null
        if (!pose) return
        const { position: p, orientation: q } = pose.transform
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w))
        const r = vaseRig({ x: p.x, y: p.y, z: p.z, yaw: Math.atan2(-forward.x, -forward.z) })
        rig.position.set(r.x, r.y, r.z)
        rig.rotation.set(0, r.rotY, 0)
        // The stand reaches from the floor to the turntable; the floor is set at rig height.
        floor.position.y = r.y
        leg.scale.y = leg.position.y - r.y
        rig.updateWorldMatrix(false, true)
        // Panel slightly below eye level: visible looking straight ahead both standing and seated.
        panel.obj.position.y = METER * (p.y - tableHeight(p.y)) - 5
        settled = true
      }

      for (const el of hands) if (el.toRelease) release(el)

      const highlight: number[] = []
      let over: number | null = null
      for (const el of hands) {
        if (el.held !== null) { watch(el); continue }
        if (!el.controller.visible) continue
        const button = panelAim(el)
        if (button !== null) { over = button; continue }
        const id = handCandidate(el)
        if (id !== null && id !== VASE) highlight.push(id)
      }
      b.emphasize(highlight)

      if (standSpinning) {
        stand.position.lerp(standHome, 0.2)
        stand.quaternion.slerp(new THREE.Quaternion(), 0.2)
        if (stand.position.distanceTo(standHome) < 0.05) {
          stand.position.copy(standHome)
          stand.quaternion.identity()
          standSpinning = false
        }
      }

      const writing = text(), signature = JSON.stringify([writing, over])
      if (signature !== drawn) { drawn = signature; panel.draw(writing, over) }
    },
    finish,
    active: () => session !== null,
    reset: () => {
      for (const el of hands) breakGrip(el)
      removeFromStand()
      result = ''
    },
    clear: () => {
      closed = true
      xr.removeEventListener('sessionend', onSessionEnd)
      const open = session
      // The scene is closing too: sessionEnded is not called and a later sessionend is not listened to.
      if (open) {
        undo()
        open.end().catch(() => {})
      }
      for (const el of hands) {
        for (const [event, f] of el.listeners) el.controller.removeEventListener(event as 'selectstart', f)
        el.controller.removeFromParent()
      }
      panel.dispose()
      label.dispose()
      for (const g of [floor.geometry, leg.geometry, rayGeometry, handGeometry]) g.dispose()
      for (const x of [floor.material, leg.material, rayMaterial, handMaterial]) x.dispose()
    },
  }
}
