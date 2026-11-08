// Vase repair in VR: grab a piece with the Quest controller, carry it to its place, seat it. Touches the vase scene only through VaseXrContext.
// The pure calculations in the top section are also used by the desktop scene; at runtime the file depends only on three, and the Node test imports it directly.
import * as THREE from 'three'
// AR helpers load only when AR starts (the Node test imports this file and needs only the pure functions above).
import type { ArPlacement } from '../../../shared/xr/arPlacement'
import type { createArLighting as ArLighting } from '../../../shared/xr/arLight'

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

/** AR: put the model so the turntable stands on a real surface at `spot` (device meters), still viewed from +z along the head's yaw.
 *  `scale` is model units per device meter (phone pinch changes it); the turntable bottom stays on the spot at any scale. */
export function vaseRigAt(spot: { x: number; y: number; z: number }, yaw: number, scale = METER) {
  const rotY = -yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: -scale * (spot.x * c + spot.z * s),
    y: -scale * spot.y + TURNTABLE_BOTTOM,
    z: -scale * (-spot.x * s + spot.z * c),
    rotY,
  }
}

/** Phone: the vase taken in hand rises this far off the stand (model units, i.e. cm). */
export const PHONE_VASE_LIFT = 6
/** Phone: radians per screen pixel when turning the vase in hand. */
export const PHONE_VASE_TURN = 0.01
/** Drag in pixels to [yaw about the vertical, pitch about the camera's right axis]; dragging down tips the top towards you. */
export function vaseTurnStep(dxPx: number, dyPx: number): [number, number] {
  return [Number.isFinite(dxPx) ? dxPx * PHONE_VASE_TURN : 0, Number.isFinite(dyPx) ? dyPx * PHONE_VASE_TURN : 0]
}
/** Yaw (about +y) of a turned object's local +z axis; used to set the vase back upright while keeping its heading. */
export function headingOf(forward: Pointed) {
  return Math.atan2(forward[0], forward[2])
}

/** Phone pinch range for the rig scale: the vase looks between 0.4× and 2× its table size. */
export const PHONE_SCALE_MIN = METER / 2
export const PHONE_SCALE_MAX = METER * 2.5
export function phoneScale(scale: number, factor: number) {
  if (!(factor > 0) || !Number.isFinite(factor)) return scale
  // A larger vase is a smaller rig scale (model units per meter).
  return Math.min(PHONE_SCALE_MAX, Math.max(PHONE_SCALE_MIN, scale / factor))
}

/** Phone seat check: on a touch screen depth cannot be controlled, so, as on desktop, a piece also seats when the target lies
 *  on the line of sight through the piece (distance from `target` to the eye→piece line), not only when it is near in 3D. */
export function phoneSeats(eye: Pointed, piece: Pointed, target: Pointed, threshold: number) {
  const d: Pointed = [piece[0] - eye[0], piece[1] - eye[1], piece[2] - eye[2]]
  const length = Math.hypot(...d)
  const direct = Math.hypot(piece[0] - target[0], piece[1] - target[1], piece[2] - target[2])
  if (snapsIn(direct, threshold)) return true
  if (!(length > 0)) return false
  const f: Pointed = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]
  const t = (f[0] * d[0] + f[1] * d[1] + f[2] * d[2]) / length
  if (t <= 0) return false
  return snapsIn(Math.sqrt(Math.max(0, f[0] ** 2 + f[1] ** 2 + f[2] ** 2 - t * t)), threshold)
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

/** `phone`: hints for touch (Android AR with the DOM overlay) instead of controller buttons. */
export function panelText(phase: VasePhase, placed: number, result: string, ar = false, phone = false) {
  const t = panelTextCore(phase, placed, result, phone)
  // In AR the exit says AR, and the turntable can be moved to another surface.
  return ar ? { ...t, buttons: [t.buttons[0], { id: 'replace' as PanelAction, name: 'Yeniden yerleştir' }, { id: 'exit' as PanelAction, name: "AR'dan çık" }] } : t
}
function panelTextCore(phase: VasePhase, placed: number, result: string, phone: boolean) {
  const exit = { id: 'exit' as PanelAction, name: "VR'dan çık" }
  if (phase === 'traceless') return {
    title: 'Vazoyu incele', progress: 'İzsiz vazo',
    hint: phone ? 'Vazoya dokunup sürükle: elinde çevir. Boş yerde sürükle: tabla döner. İki parmak: büyüt.' : 'Vazoyu tutup çevir. Hazır olunca parçala.',
    buttons: [{ id: 'shatter' as PanelAction, name: 'Vazoyu parçala' }, exit],
  }
  const progress = `${placed}/${PIECE_COUNT} parça yerinde`
  if (phase === 'done') return {
    title: 'Vazo onarıldı!', progress,
    hint: phone ? 'Vazoya dokunup sürükle: elinde çevir, onarım izlerini incele.' : 'Vazoyu tutup çevir, onarım izlerini incele.',
    buttons: [{ id: 'shatter' as PanelAction, name: 'Yeniden parçala' }, exit],
  }
  return {
    title: 'Vazoyu onar', progress,
    hint: result || (phone ? 'Parçaya dokun, sürükleyip yerine bırak. Vazoya dokunup sürükle: elinde çevir.' : 'Parçayı tetik veya yan tuşla tut, götür, bırak.'),
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

/** Phone AR state for the DOM overlay; `null` when no phone AR session is running. */
export interface VaseMobileState {
  /** Before the first tap: the turntable follows the ring. */
  placing: boolean
  phase: VasePhase
  progress: string
  hint: string
  /** Name of the shatter/restart button for this phase. */
  action: string
}

export interface VaseXrStartOption {
  /** Phone AR: the WebXR dom-overlay root. Phone mode is on only if the browser grants the overlay. */
  overlayRoot?: HTMLElement
  /** Phone AR: called when the overlay state changes, and with `null` when the session ends. */
  onMobileState?: (state: VaseMobileState | null) => void
}

/** Phone AR actions; each does nothing outside a phone AR session. Touch points are normalized device coordinates (-1..1, y up). */
export interface VaseMobileControl {
  /** The phase's shatter / restart button. */
  action(): void
  replace(): void
  exit(): void
  /** One finger down: grabs the free piece under the touch, else takes the vase in hand if the touch is on it.
   *  Returns false if neither (the drag then turns the turntable). */
  touchStart(x: number, y: number): boolean
  /** `dx`, `dy`: screen pixels since the last move (turn the vase in hand). */
  touchMove(x: number, y: number, dx?: number, dy?: number): void
  /** Finger lifted: the desktop/VR release path (seat check, messages). */
  touchEnd(): void
  /** Touch interrupted: the piece goes back without counting an attempt. */
  touchCancel(): void
  /** Turns the turntable about its axis (radians). Ignored while a piece is held. */
  rotateBy(rad: number): void
  /** The vase looks `factor` times larger, clamped. Ignored while a piece is held. */
  scaleBy(factor: number): void
}

export interface VaseXr {
  /** Goes to requestSession immediately when called: must be called inside a user gesture. Leaves no trace in the scene if rejected. */
  /** `ar`: the same repair game in the real room (passthrough on Quest 3, camera on Android); no floor, stand or background. */
  start: (mode?: 'vr' | 'ar', option?: VaseXrStartOption) => Promise<void>
  mobile: VaseMobileControl
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
  marker: THREE.Mesh
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

  /** Pieces on the holder: all of them on Quest (it only grabs a whole vase); on a phone mid-repair only the seated ones. */
  let standPieces: number[] = []
  const takeToStand = (carried: number[] = pieces.map((_, id) => id)) => {
    if (standOccupied) return
    standOccupied = true
    standPieces = carried
    scene.add(stand)
    stand.updateWorldMatrix(true, false)
    for (const n of b.wholeObjects) wholeHome.set(n, { position: n.position.clone(), turn: n.quaternion.clone() })
    for (const n of [...carried.map((id) => pieces[id]), ...b.wholeObjects]) stand.attach(n)
  }
  const removeFromStand = () => {
    if (!standOccupied) return
    standOccupied = false
    standSpinning = false
    stand.position.copy(standHome)
    stand.quaternion.identity()
    stand.updateWorldMatrix(true, false)
    for (const n of [...standPieces.map((id) => pieces[id]), ...b.wholeObjects]) scene.attach(n)
    for (const id of standPieces) { pieces[id].position.copy(targets[id].position); pieces[id].quaternion.copy(targets[id].quaternion) }
    standPieces = []
    vaseInHand = vaseReturning = false
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
    releasePiece(id, snapsIn(pieces[id].position.distanceTo(targets[id].position), XR_SEAT_THRESHOLD))
  }
  /** Shared by the controller and the phone touch: the desktop release path plus the panel/overlay message. */
  const releasePiece = (id: number, seated: boolean) => {
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
    if (mobile) {
      cancelTouch()
      phoneTurn = 0
    } else camera.add(hint.obj)
  }

  const text = () => panelText(b.phase(), b.placedCount(), result, ar)

  // ---------- Phone AR (dom-overlay) ----------
  // The DOM overlay replaces the head hint, label and panel; touches come from the overlay as screen points.
  let mobile = false
  let mobileListener: VaseXrStartOption['onMobileState'] | null = null
  let mobileDrawn = ''
  let restoreQuality: (() => void) | null = null
  const undoQuality = () => { restoreQuality?.(); restoreQuality = null }
  /** Set when two screen touches were down at once; cleared when every finger has lifted (two fingers never place). */
  let multiTouch = false
  const screenTouches = () => session ? Array.from(session.inputSources).filter((s) => s.targetRayMode === 'screen').length : 0
  const onInputSources = () => {
    const n = screenTouches()
    if (n > 1) multiTouch = true
    else if (n === 0) setTimeout(() => { multiTouch = false }, 0) // after the last finger's own select has been ignored
  }
  // Placed turntable: surface spot (device meters), view yaw, the user's turn and the rig scale (pinch).
  const phoneSpot = new THREE.Vector3()
  let phoneYaw = 0, phoneTurn = 0, phoneRigScale = METER
  const applyPhoneRig = () => {
    const r = vaseRigAt(phoneSpot, phoneYaw + phoneTurn, phoneRigScale)
    rig.position.set(r.x, r.y, r.z)
    rig.rotation.set(0, r.rotY, 0)
    rig.scale.setScalar(phoneRigScale)
    rig.updateWorldMatrix(false, true)
  }
  const touchPlane = new THREE.Plane(), touchPoint = new THREE.Vector3(), eye = new THREE.Vector3(), look = new THREE.Vector3()
  let touch: { id: number; offset: THREE.Vector3; x: number; y: number; moved: boolean } | null = null
  const touchRay = (x: number, y: number) => {
    camera.updateWorldMatrix(true, false)
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
  }
  // The vase in hand (phone): lifted off the stand and turned by the drag; on release it eases back upright.
  let vaseInHand = false, vaseReturning = false
  const vaseLifted = standHome.clone().add(new THREE.Vector3(0, PHONE_VASE_LIFT, 0))
  const turnAxis = new THREE.Vector3(), turnStep = new THREE.Quaternion(), upright = new THREE.Quaternion()
  const putVaseBack = () => {
    if (!vaseInHand) return
    vaseInHand = false
    // Keep the heading: it moves to the turntable (same view at this instant), and the vase returns to its stand frame.
    // The seated pieces then sit exactly on their targets again, so later seating still works.
    turnAxis.set(0, 0, 1).applyQuaternion(stand.quaternion)
    const heading = headingOf(turnAxis.toArray())
    upright.setFromAxisAngle(turnAxis.set(0, 1, 0), -heading)
    stand.quaternion.premultiply(upright)
    phoneTurn += heading
    applyPhoneRig()
    vaseReturning = true
  }
  const cancelTouch = () => {
    putVaseBack()
    const held = touch
    touch = null
    if (held) { b.gripCancel(held.id); b.select(null) }
  }
  /** Phone frame step: lifts the vase in hand, or eases it back down and upright, then off the holder. */
  const phoneVaseFrame = () => {
    if (vaseInHand) { stand.position.lerp(vaseLifted, 0.3); return }
    if (!vaseReturning) return
    stand.position.lerp(standHome, 0.2)
    stand.quaternion.slerp(upright.identity(), 0.2)
    if (stand.position.distanceTo(standHome) < 0.05 && stand.quaternion.angleTo(upright) < 0.002) {
      vaseReturning = false
      removeFromStand()
    }
  }
  const emitMobile = () => {
    if (!mobile || !mobileListener) return
    const t = panelText(b.phase(), b.placedCount(), result, true, true)
    const state: VaseMobileState = { placing: !settled, phase: b.phase(), progress: t.progress, hint: t.hint, action: t.buttons[0].name }
    const signature = JSON.stringify(state)
    if (signature === mobileDrawn) return
    mobileDrawn = signature
    mobileListener(state)
  }
  const mobileControl: VaseMobileControl = {
    action: () => { if (mobile && settled) { cancelTouch(); b.shatterRequest() } },
    replace: () => { if (mobile && settled) replace() },
    exit: () => { if (mobile) finish() },
    touchStart: (x, y) => {
      if (!mobile || !settled || touch || vaseInHand || !Number.isFinite(x) || !Number.isFinite(y)) return false
      touchRay(x, y)
      const origin = raycaster.ray.origin.toArray(), direction = raycaster.ray.direction.toArray(), reach = 4 * phoneRigScale
      // A free piece first; otherwise the vase body (the same sphere Quest grabs), in every phase once something stands on it.
      const list = candidates().filter((c) => c.id !== VASE)
      const id = selectPiece(origin, direction, list, reach)
      if (id === null) {
        const carried = pieces.map((_, n) => n).filter((n) => !b.isFree(n))
        if (b.phase() === 'repair' && !carried.length) return false
        if (selectPiece(origin, direction, [{ id: VASE, center: standHome.toArray(), radius: VASE_RADIUS }], reach) !== VASE) return false
        if (!vaseReturning) {
          // Pieces still gliding into place stop there: on the holder their target is in its frame.
          for (const n of carried) { b.gripStarted(n); pieces[n].position.copy(targets[n].position); pieces[n].quaternion.copy(targets[n].quaternion) }
          takeToStand(carried)
        }
        vaseReturning = false
        vaseInHand = true
        return true
      }
      // Like the desktop drag: the piece moves on a plane through it, facing the camera, keeping the grab offset.
      camera.getWorldDirection(look)
      touchPlane.setFromNormalAndCoplanarPoint(look, pieces[id].position)
      if (!raycaster.ray.intersectPlane(touchPlane, touchPoint)) return false
      b.gripStarted(id)
      b.select(id)
      touch = { id, offset: touchPoint.clone().sub(pieces[id].position), x, y, moved: false }
      return true
    },
    touchMove: (x, y, dx = 0, dy = 0) => {
      if (vaseInHand) {
        const [yaw, pitch] = vaseTurnStep(dx, dy)
        stand.quaternion.premultiply(turnStep.setFromAxisAngle(turnAxis.set(0, 1, 0), yaw))
        camera.updateWorldMatrix(true, false)
        turnAxis.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
        stand.quaternion.premultiply(turnStep.setFromAxisAngle(turnAxis, pitch)).normalize()
        return
      }
      if (!touch || !Number.isFinite(x) || !Number.isFinite(y)) return
      if (Math.hypot(x - touch.x, y - touch.y) > 0.02) touch.moved = true
      touchRay(x, y)
      if (raycaster.ray.intersectPlane(touchPlane, touchPoint)) pieces[touch.id].position.copy(touchPoint).sub(touch.offset)
    },
    touchEnd: () => {
      putVaseBack()
      const held = touch
      if (!held) return
      touch = null
      // A tap without a drag is not an attempt (as on desktop): the piece just goes back.
      if (!held.moved) { b.gripCancel(held.id); b.select(null); return }
      camera.getWorldPosition(eye)
      releasePiece(held.id, phoneSeats(eye.toArray(), pieces[held.id].position.toArray(), targets[held.id].position.toArray(), XR_SEAT_THRESHOLD))
    },
    touchCancel: cancelTouch,
    rotateBy: (rad) => {
      if (!mobile || !settled || touch || vaseInHand || !Number.isFinite(rad)) return
      phoneTurn += rad
      applyPhoneRig()
    },
    scaleBy: (factor) => {
      if (!mobile || !settled || touch || vaseInHand) return
      phoneRigScale = phoneScale(phoneRigScale, factor)
      applyPhoneRig()
    },
  }
  const panelAim = (el: El) => {
    setupRay(el)
    panel.obj.updateWorldMatrix(true, false)
    const hit = raycaster.intersectObject(panel.obj, false)[0]
    return hit?.uv ? panelButton(hit.uv.x, hit.uv.y, text().buttons.length) : null
  }

  const head = (el: El, kind: 'trigger' | 'side') => {
    // Phone: a screen tap only places (never with two fingers); after that the overlay and its touch handling do the work.
    if (session && mobile) {
      if (!settled && screenTouches() <= 1 && !multiTouch) placeNow = true
      return
    }
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
    if (mobile) return
    el[kind] = false
    if (!el.trigger && !el.side && el.held !== null) el.toRelease = true
  }

  const hands: El[] = [0, 1].map((i) => {
    const controller = xr.getController(i)
    const ray = new THREE.Line(rayGeometry, rayMaterial)
    const marker = new THREE.Mesh(handGeometry, handMaterial)
    controller.add(ray, marker)
    rig.add(controller)
    const el: El = { controller, ray, marker, trigger: false, side: false, held: null, toRelease: false, offset: new THREE.Matrix4(), listeners: [] }
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
  const culled: THREE.Object3D[] = []
  let arLight: ReturnType<typeof ArLighting> | null = null
  let arLightModule: typeof import('../../../shared/xr/arLight') | null = null
  if (typeof navigator !== 'undefined' && navigator.xr) void import('../../../shared/xr/arLight').then((m) => { arLightModule = m }, () => {})
  let shadow: { mesh: THREE.Mesh; dispose(): void } | null = null
  let prevBackground: THREE.Scene['background'] = null
  const prevClear = new THREE.Color()
  let prevAlpha = 1
  const enter = (fresh: XRSession, mode: 'vr' | 'ar', phone: boolean) => {
    session = fresh
    ar = mode === 'ar'
    mobile = ar && phone
    multiTouch = false
    mobileDrawn = ''
    touch = null
    phoneTurn = 0
    phoneRigScale = METER
    if (mobile) {
      fresh.addEventListener('inputsourceschange', onInputSources)
      // No rays or hand markers on a phone; the controllers still deliver the screen taps.
      for (const el of hands) el.controller.removeFromParent()
    }
    if (ar) {
      prevBackground = scene.background
      scene.background = null
      renderer.getClearColor(prevClear)
      prevAlpha = renderer.getClearAlpha()
      renderer.setClearColor(0x000000, 0)
      // Scaled rig: three's two-eye frustum can cull the vase when looking down from above; the scene is small, so no culling in AR.
      culled.length = 0
      scene.traverse((o) => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false } })
      placeNow = false
      if (!mobile) camera.add(hint.obj)
      void Promise.all([import('../../../shared/xr/arPlacement'), import('../../../shared/xr/arLight')]).then(async ([{ createArPlacement }, { createContactShadow, createArLighting }]) => {
        if (session !== fresh || !ar) return
        shadow ??= createContactShadow(XR_TABLE_RADIUS * 1.25)
        shadow.mesh.position.y = TURNTABLE_BOTTOM + 0.05
        scene.add(shadow.mesh)
        // Normally created before the session starts (see start()); this is the fallback if the helpers were not loaded yet.
        if (!arLight) { arLight = createArLighting(renderer, scene); arLight.start() }
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
    // Phone: the DOM overlay shows the label's place (the page), the hint and the panel instead.
    if (mobile) scene.add(rig)
    else {
      camera.add(label.obj)
      scene.add(rig, panel.obj)
    }
    if (!ar) scene.add(environment)
    drawn = ''
    result = ''
    emitMobile()
  }

  const undo = () => {
    cancelTouch()
    if (mobile) {
      mobileListener?.(null)
      session?.removeEventListener('inputsourceschange', onInputSources)
      for (const el of hands) rig.add(el.controller)
    }
    mobile = false
    mobileListener = null
    mobileDrawn = ''
    multiTouch = false
    phoneTurn = 0
    phoneRigScale = METER
    rig.scale.setScalar(METER)
    undoQuality()
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
      for (const o of culled) o.frustumCulled = true
      culled.length = 0
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
    mobile: mobileControl,
    start: async (mode = 'vr', option = {}) => {
      if (session || starting) return
      if (!navigator.xr) throw new Error('WebXR not available in this browser')
      const root = mode === 'ar' ? option.overlayRoot : undefined
      starting = true
      // Started without awaiting: no await may come before requestSession, or the browser loses the user gesture.
      const qualityModule = root ? import('../../scale-models/mobileAr/detect').catch(() => null) : null
      // three's XREstimatedLight only begins on the renderer's 'sessionstart', so it has to exist before setSession.
      // The helpers are preloaded below; creating them here is synchronous and keeps the user gesture.
      if (mode === 'ar' && arLightModule && !arLight) { arLight = arLightModule.createArLighting(renderer, scene); arLight.start() }
      const ratio = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2())
      let fresh: XRSession | null = null
      try {
        fresh = await navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', root
          ? { optionalFeatures: ['local-floor', 'hit-test', 'light-estimation', 'dom-overlay'], domOverlay: { root } }
          : { optionalFeatures: mode === 'ar' ? ['local-floor', 'hit-test', 'light-estimation'] : ['local-floor'] })
        // The scene may have closed while waiting for permission: do not leave the user in an empty session.
        if (closed) throw new Error('Scene closed')
        // Phone: the framebuffer scale only takes effect before setSession.
        const quality = qualityModule ? await qualityModule : null
        if (quality) restoreQuality = quality.applyMobileArQuality(renderer)
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
        if (!session) { arLight?.stop(); arLight = null }
        undoQuality()
        throw error
      } finally {
        starting = false
      }
      xr.setFoveation(1)
      // Phone mode needs the DOM overlay: without it the head panels stay, and a screen tap still reaches the panel buttons.
      const overlayGranted = !!root && !!(fresh as XRSession & { domOverlayState?: unknown }).domOverlayState
      if (overlayGranted) mobileListener = option.onMobileState ?? null
      else if (root) option.onMobileState?.(null)
      enter(fresh, mode, overlayGranted)
    },
    frame: () => {
      if (!session) return
      emitMobile()
      if (!settled && mobile) {
        // Phone: the turntable follows the ring (or waits in front of you) until a one-finger tap places it.
        const frame = xr.getFrame(), space = xr.getReferenceSpace()
        const pose = frame && space ? frame.getViewerPose(space) : null
        if (!pose) return
        const { position: p, orientation: q } = pose.transform
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w))
        phoneYaw = Math.atan2(-forward.x, -forward.z)
        const hit = placing && frame && space ? placing.update(frame, space) : null
        if (hit && placing) phoneSpot.copy(placing.reticle.position)
        else phoneSpot.set(p.x - Math.sin(phoneYaw) * VASE_DISTANCE, tableHeight(p.y) + TURNTABLE_BOTTOM / METER, p.z - Math.cos(phoneYaw) * VASE_DISTANCE)
        applyPhoneRig()
        if (!placeNow) return
        placeNow = false
        if (placing) placing.reticle.visible = false
        settled = true
        emitMobile()
        return
      }
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

      // Phone: no rays to aim with and no panel to draw; touches move the pieces directly and the overlay shows the text.
      if (mobile) { phoneVaseFrame(); return }

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
      // The scene puts the pieces back itself: a touch-held piece is just let go.
      touch = null
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
      undoQuality()
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
