// Vase repair in VR: grab a piece with the Quest controller, carry it to its place, seat it. Touches the vase scene only through VaseXrContext.
// The pure calculations in the top section are also used by the desktop scene; at runtime the file depends only on three, and the Node test imports it directly.
import * as THREE from 'three'
// AR helpers load only when AR starts (the Node test imports this file and needs only the pure functions above).
import type { ArPlacement } from './arPlacement'
import type { createArLighting as ArLighting } from './arLight'

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

/** The turntable base's underside in model units (vaseScene: cylinder 1.5 high, centred at y = -2). */
export const TURNTABLE_BOTTOM = -2.75

/** AR: put the model so the turntable stands on a real surface at `spot` (device meters), still viewed from +z along the head's yaw. */
export function vaseRigAt(spot: { x: number; y: number; z: number }, yaw: number) {
  const rotY = -yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: -METER * (spot.x * c + spot.z * s),
    y: -METER * spot.y + TURNTABLE_BOTTOM,
    z: -METER * (-spot.x * s + spot.z * c),
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
// The drawn pills fill exactly these areas, so what the ray hits is what the user sees.
const BUTTON_V = { min: 0.1, max: 0.3 }
const BUTTON_U = [{ min: 0.055, max: 0.49 }, { min: 0.51, max: 0.945 }]
/** Button columns for `n` buttons (AR adds a third, "Yeniden yerleştir"); two buttons keep the original layout. */
const buttonSlots = (n: number) => n <= 2 ? BUTTON_U : Array.from({ length: n }, (_, i) => ({ min: 0.035 + i * (0.93 / n) + 0.005, max: 0.035 + (i + 1) * (0.93 / n) - 0.005 }))
/** Index of the button at panel point (u, v); `null` if there is none. */
export function panelButton(u: number, v: number, count = 2): number | null {
  if (v < BUTTON_V.min || v > BUTTON_V.max) return null
  const i = buttonSlots(count).findIndex((d) => u >= d.min && u <= d.max)
  return i < 0 ? null : i
}

export type PanelAction = 'shatter' | 'exit' | 'replace'

export function panelText(phase: VasePhase, placed: number, result: string, ar = false) {
  const t = panelTextCore(phase, placed, result)
  // In AR the exit says AR, and the turntable can be moved to another surface.
  return ar ? { ...t, buttons: [t.buttons[0], { id: 'replace' as PanelAction, name: 'Yeniden yerleştir' }, { id: 'exit' as PanelAction, name: "AR'dan çık" }] } : t
}
function panelTextCore(phase: VasePhase, placed: number, result: string) {
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
// In-headset UI: dark translucent glass over the room or the scene, one çini-green action.
const GLASS = 'rgba(17, 25, 23, 0.86)', GLASS_EDGE = 'rgba(255, 255, 255, 0.14)', GLASS_TOP = 'rgba(255, 255, 255, 0.26)'
const INK_ON_GLASS = '#eef2ef', SOFT = 'rgba(226, 234, 230, 0.74)', MUTED = '#9fc4b7'
const ACTION = '#12695a', ACTION_OVER = '#1b7f6d', TRACK = 'rgba(255, 255, 255, 0.13)', FILL = '#6fbfa6'
const RAY = '#d5e6df'
/** Canvas pixels per drawing unit: layouts are written at 1024 wide and rendered at twice that for a crisp texture. */
const DPR = 2

export function canvasPlane(width: number, height: number, realWidth: number) {
  const el = document.createElement('canvas')
  el.width = width * DPR
  el.height = height * DPR
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Canvas unavailable')
  c.setTransform(DPR, 0, 0, DPR, 0, 0)
  const texture = new THREE.CanvasTexture(el)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const geometry = new THREE.PlaneGeometry(realWidth, (realWidth * height) / width)
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, depthWrite: false })
  const obj = new THREE.Mesh(geometry, material)
  return { c, texture, obj, dispose: () => { texture.dispose(); material.dispose(); geometry.dispose() } }
}

/** Rounded glass sheet with a soft inner edge and a thin highlight along the top. */
function glass(c: CanvasRenderingContext2D, w: number, h: number, r: number, alpha = 1) {
  c.clearRect(0, 0, w, h)
  c.globalAlpha = alpha
  c.beginPath(); c.roundRect(0, 0, w, h, r)
  c.fillStyle = GLASS; c.fill()
  c.globalAlpha = 1
  c.beginPath(); c.roundRect(1.5, 1.5, w - 3, h - 3, r - 1.5)
  c.lineWidth = 1.5; c.strokeStyle = GLASS_EDGE; c.stroke()
  c.beginPath(); c.moveTo(r, 2.5); c.lineTo(w - r, 2.5)
  c.lineWidth = 1.5; c.strokeStyle = GLASS_TOP; c.stroke()
}

/** Splits `text` into at most `max` lines that fit `width`; the last line is squeezed by fillText if needed. */
function wrap(c: CanvasRenderingContext2D, text: string, width: number, max: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && c.measureText(next).width > width && lines.length < max - 1) { lines.push(line); line = word } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** Largest font size from `size` down to `min` at which every text in `texts` fits `width`; one size keeps a button row even. */
function fitAll(c: CanvasRenderingContext2D, texts: string[], width: number, weight: number, size: number, min: number) {
  for (; size > min; size -= 2) {
    c.font = `${weight} ${size}px ${TEXT}`
    if (texts.every((t) => c.measureText(t).width <= width)) return size
  }
  return min
}

/** Title, progress, hint and buttons matching `panelButton`. `realWidth` is in scene units. */
export function statePanel(realWidth = 64) {
  const G = 1024, Y = 512, PAD = 56
  const p = canvasPlane(G, Y, realWidth)
  const draw = ({ title, progress, hint, buttons }: { title: string; progress: string; hint: string; buttons: { name: string }[] }, over: number | null = null) => {
    const { c } = p
    glass(c, G, Y, 32)
    c.textBaseline = 'alphabetic'
    c.textAlign = 'left'

    // Progress sits to the right of the title; a fraction like "2/6" also draws a thin bar under both.
    c.font = `500 36px ${TEXT}`
    const progressWidth = Math.min(c.measureText(progress).width, 380)
    c.fillStyle = INK_ON_GLASS
    c.font = `700 54px ${TEXT}`
    c.fillText(title, PAD, 112, G - 2 * PAD - progressWidth - 32)
    c.textAlign = 'right'
    c.fillStyle = MUTED
    c.font = `500 36px ${TEXT}`
    c.fillText(progress, G - PAD, 110, 380)
    c.textAlign = 'left'
    const fraction = /(\d+)\s*\/\s*(\d+)/.exec(progress)
    const barY = 146
    c.beginPath(); c.roundRect(PAD, barY, G - 2 * PAD, 6, 3)
    c.fillStyle = TRACK; c.fill()
    if (fraction && +fraction[2] > 0) {
      const share = Math.min(1, +fraction[1] / +fraction[2])
      if (share > 0) {
        c.beginPath(); c.roundRect(PAD, barY, Math.max(6, (G - 2 * PAD) * share), 6, 3)
        c.fillStyle = FILL; c.fill()
      }
    }

    c.fillStyle = SOFT
    c.font = `400 38px ${TEXT}`
    wrap(c, hint, G - 2 * PAD, 2).forEach((line, i) => c.fillText(line, PAD, 218 + i * 50, G - 2 * PAD))

    const top = Y * (1 - BUTTON_V.max), height = Y * (BUTTON_V.max - BUTTON_V.min)
    const slots = buttonSlots(buttons.length)
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    const inner = G * (slots[0].max - slots[0].min) - (buttons.length > 2 ? 24 : 40)
    const size = fitAll(c, buttons.map((b) => b.name), inner, 600, buttons.length > 2 ? 38 : 42, 32)
    buttons.forEach(({ name }, i) => {
      const x = G * slots[i].min, width = G * (slots[i].max - slots[i].min)
      const hovered = over === i
      c.beginPath(); c.roundRect(x + 1.5, top + 1.5, width - 3, height - 3, (height - 3) / 2)
      if (i === 0) {
        c.fillStyle = hovered ? ACTION_OVER : ACTION; c.fill()
        c.lineWidth = hovered ? 3 : 1.5
        c.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.16)'
      } else {
        if (hovered) { c.fillStyle = 'rgba(255, 255, 255, 0.12)'; c.fill() }
        c.lineWidth = hovered ? 3 : 2
        c.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)'
      }
      c.stroke()
      c.fillStyle = INK_ON_GLASS
      c.font = `600 ${size}px ${TEXT}`
      c.fillText(name, x + width / 2, top + height / 2 + 2, inner)
    })
    p.texture.needsUpdate = true
  }
  return { obj: p.obj, draw, dispose: p.dispose }
}

function labelPanel() {
  const G = 1024, Y = 72
  const p = canvasPlane(G, Y, 0.6)
  const { c } = p
  c.font = `500 36px ${TEXT}`
  const width = Math.min(G, c.measureText(ILLUSTRATIVE_MODEL_LABEL).width + 64)
  c.translate((G - width) / 2, 0)
  glass(c, width, Y, Y / 2, 0.9)
  c.fillStyle = INK_ON_GLASS
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(ILLUSTRATIVE_MODEL_LABEL, width / 2, Y / 2 + 2, width - 48)
  p.texture.needsUpdate = true
  return { obj: p.obj, dispose: p.dispose }
}

/** AR placement hint, attached to the head until the turntable is placed. */
function placementHint() {
  const G = 1024, Y = 200
  const p = canvasPlane(G, Y, 0.62)
  const { c } = p
  glass(c, G, Y, 32)
  c.textAlign = 'center'
  c.textBaseline = 'alphabetic'
  c.fillStyle = INK_ON_GLASS
  c.font = `600 46px ${TEXT}`
  c.fillText('Masaya ya da yere bak.', G / 2, 88, G - 96)
  c.fillStyle = SOFT
  c.font = `400 38px ${TEXT}`
  c.fillText('Halka çıkınca tetiğe bas.', G / 2, 146, G - 96)
  p.texture.needsUpdate = true
  return p
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
  // AR placement hint, attached to the head until the turntable is placed (rig-local meters).
  const hint = placementHint()
  hint.obj.material.depthTest = false
  hint.obj.renderOrder = 1004
  hint.obj.frustumCulled = false
  hint.obj.position.set(0, -0.12, -1)

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -RAY_LENGTH)])
  const rayMaterial = new THREE.LineBasicMaterial({ color: RAY, toneMapped: false, transparent: true, opacity: 0.7 })
  const handGeometry = new THREE.SphereGeometry(0.015, 12, 8)
  const handMaterial = new THREE.MeshBasicMaterial({ color: INK_ON_GLASS, toneMapped: false })

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
  /** AR: back to placement; the turntable follows the ring again until the next press. */
  const replace = () => {
    for (const el of hands) breakGrip(el)
    settled = false
    placeNow = false
    camera.add(hint.obj)
  }

  const text = () => panelText(b.phase(), b.placedCount(), result, ar)
  const panelAim = (el: El) => {
    setupRay(el)
    panel.obj.updateWorldMatrix(true, false)
    const hit = raycaster.intersectObject(panel.obj, false)[0]
    return hit?.uv ? panelButton(hit.uv.x, hit.uv.y, text().buttons.length) : null
  }

  const head = (el: El, kind: 'trigger' | 'side') => {
    // AR before placement: the first press puts the turntable where the ring is (or in front of you if no surface was found).
    if (session && ar && !settled) { placeNow = true; return }
    if (!session || !settled) return
    el[kind] = true
    el.toRelease = false
    if (el.held !== null) return
    // A user aiming at a button does not want to grab a piece: the panel comes first.
    const button = kind === 'trigger' ? panelAim(el) : null
    if (button !== null) {
      const action = text().buttons[button].id
      if (action === 'exit') finish()
      else if (action === 'replace') replace()
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
  let placing: ArPlacement | null = null
  let placeNow = false
  let arLight: ReturnType<typeof ArLighting> | null = null
  let shadow: { mesh: THREE.Mesh; dispose(): void } | null = null
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
      placeNow = false
      camera.add(hint.obj)
      void Promise.all([import('./arPlacement'), import('./arLight')]).then(async ([{ createArPlacement }, { createContactShadow, createArLighting }]) => {
        if (session !== fresh || !ar) return
        shadow ??= createContactShadow(XR_TABLE_RADIUS * 1.25)
        shadow.mesh.position.y = TURNTABLE_BOTTOM + 0.05
        scene.add(shadow.mesh)
        arLight = createArLighting(renderer, scene)
        arLight.start()
        const p = await createArPlacement(fresh)
        if (session !== fresh || !ar) { p?.dispose(); return }
        placing = p
        if (p) rig.add(p.reticle)
      }).catch(() => { /* AR still works without placement and lighting: the turntable waits in front of the user */ })
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
      hint.obj.removeFromParent()
      placing?.reticle.removeFromParent()
      placing?.dispose()
      placing = null
      arLight?.stop()
      arLight = null
      shadow?.mesh.removeFromParent()
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
        fresh = await navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', { optionalFeatures: mode === 'ar' ? ['local-floor', 'hit-test', 'light-estimation'] : ['local-floor'] })
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
        const yaw = Math.atan2(-forward.x, -forward.z)
        let r = vaseRig({ x: p.x, y: p.y, z: p.z, yaw })
        if (ar) {
          // Until the press, the turntable follows the ring over real surfaces (a preview); with no surface it waits in front of you.
          const hit = placing && frame && space ? placing.update(frame, space) : null
          const spot = hit && placing ? placing.reticle.position : null
          if (spot) r = vaseRigAt({ x: spot.x, y: spot.y, z: spot.z }, yaw)
          rig.position.set(r.x, r.y, r.z)
          rig.rotation.set(0, r.rotY, 0)
          if (!placeNow) return
          placeNow = false
          hint.obj.removeFromParent()
          if (placing) placing.reticle.visible = false
          const tableY = spot ? spot.y + -TURNTABLE_BOTTOM / METER : tableHeight(p.y)
          rig.updateWorldMatrix(false, true)
          panel.obj.position.y = METER * (p.y - tableY) - 5
          settled = true
          return
        }
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
      hint.dispose()
      shadow?.dispose()
      for (const g of [floor.geometry, leg.geometry, rayGeometry, handGeometry]) g.dispose()
      for (const x of [floor.material, leg.material, rayMaterial, handMaterial]) x.dispose()
    },
  }
}
