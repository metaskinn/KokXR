// VR locomotion calculations; no three or DOM, so they run directly in Node tests.
export interface Plane { x: number; z: number }
export interface RigPose { x: number; y: number; z: number; rotY: number }
export interface ControllerSource { handedness: string; gamepad?: { axes: readonly number[]; buttons: readonly { pressed: boolean }[] } }
export interface ControllerInput { leftX: number; leftY: number; rightX: number; rightY: number; menu: boolean }

export const XR_WALK_SPEED = 1.6 // m/s
export const XR_TURN_SPEED = Math.PI / 4 // rad/s, with the stick fully pushed
export const TABLE_Y = 0.9, TABLE_DISTANCE = 1.2
export const TABLE_SCALE_INITIAL = 100, TABLE_SCALE_MIN = 40, TABLE_SCALE_MAX = 200
const DEAD_ZONE = 0.2, MAX_DT = 0.1

/** Cuts joystick drift; rescales the remaining range to 0-1 and keeps the sign. */
export function deadZone(d: number): number {
  const m = Math.abs(d)
  if (m < DEAD_ZONE) return 0
  return Math.sign(d) * Math.min(1, (m - DEAD_ZONE) / (1 - DEAD_ZONE))
}

/** New head position. The dead zone is applied here; the stick is passed raw. stick.y < 0 is forward (WebXR). Each axis is tried separately so movement slides along walls. */
export function walkStep(head: Plane, forwardDir: Plane, stick: { x: number; y: number }, dt: number, obstacle: (x: number, z: number) => boolean): Plane {
  const length = Math.hypot(forwardDir.x, forwardDir.z)
  if (!length) return { x: head.x, z: head.z } // direction is undefined when looking straight up or down
  const ix = forwardDir.x / length, iz = forwardDir.z / length
  let right = deadZone(stick.x), forward = -deadZone(stick.y)
  const power = Math.hypot(right, forward)
  if (power > 1) { right /= power; forward /= power } // diagonal push must not be faster
  const step = XR_WALK_SPEED * Math.min(dt, MAX_DT)
  const dx = (ix * forward - iz * right) * step, dz = (iz * forward + ix * right) * step
  let { x, z } = head
  if (!obstacle(x + dx, z)) x += dx
  if (!obstacle(x, z + dz)) z += dz
  return { x, z }
}

/** Angle to turn this frame, proportional to stick push. Positive rotation about Y turns left, so the sign is flipped to make a right push turn right. */
export function smoothTurn(rightX: number, dt: number): number {
  return -deadZone(rightX) * XR_TURN_SPEED * Math.min(dt, MAX_DT)
}

/** The rig's new x/z so the head stays fixed in the world while the rig rotates by `angle`. */
export function rotateAroundHead(rig: Plane, head: Plane, angle: number): Plane {
  const c = Math.cos(angle), s = Math.sin(angle), dx = rig.x - head.x, dz = rig.z - head.z
  return { x: dx * c + dz * s + head.x, z: -dx * s + dz * c + head.z }
}

/** Tabletop view: the rig grows `scale` times so the world looks table-sized; the model stays in front at table height. */
export function tableRig(angle: number, scale: number): RigPose {
  const D = TABLE_DISTANCE * scale
  return { x: D * Math.sin(angle), y: -TABLE_Y * scale, z: -D * Math.cos(angle), rotY: Math.PI - angle }
}

/** Interior stop (1× scale): moves the head to the x/z of `position` and turns the view toward `look`. `headYaw` is the head's horizontal heading within the rig. */
export function stopRig(position: number[], look: number[], headLocal: Plane, floorY: number, headYaw = 0): RigPose {
  const rotY = Math.atan2(-(look[0] - position[0]), -(look[2] - position[2])) - headYaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return { x: position[0] - (headLocal.x * c + headLocal.z * s), y: floorY, z: position[2] - (-headLocal.x * s + headLocal.z * c), rotY }
}

/** Info titles are hidden outside these horizontal distances: one you stand on would stick to your face, a distant one is unreadable. */
export const TITLE_NEAR = 1.5, TITLE_FAR = 32
const TITLE_MARGIN = 0.5, TITLE_DROP = 10

/** Info title placement: faces the head and grows with distance to stay readable. It drops to eye level as you approach so someone standing below can still aim at it; it is pulled toward the head so it does not sink into walls. */
export function titlePlace(position: number[], head: { x: number; y: number; z: number }) {
  const dx = head.x - position[0], dz = head.z - position[2], horizontal = Math.hypot(dx, dz)
  const y = head.y + (position[1] - head.y) * Math.max(0.25, Math.min(1, horizontal / TITLE_DROP))
  const pull = horizontal > TITLE_MARGIN ? TITLE_MARGIN / horizontal : 0
  const scale = Math.max(0.6, Math.min(2.4, Math.hypot(horizontal, y - head.y) / 5))
  return { x: position[0] + dx * pull, y, z: position[2] + dz * pull, rotY: Math.atan2(dx, dz), scale, horizontal }
}

/** Wraps into the range (-π, π]. */
function wrapAngle(a: number): number {
  const t = 2 * Math.PI, s = ((a % t) + t) % t
  return s > Math.PI ? s - t : s
}

/** Panel's horizontal angle relative to the head: if the requested direction overlaps the other panel, it shifts beside it so the ray reaches both. On exact overlap `dir` decides (+1 is left). */
export function nonOverlapAngle(requested: number, other: number, separation: number, dir: 1 | -1): number {
  const diff = wrapAngle(requested - other)
  if (Math.abs(diff) >= separation) return requested
  return other + (diff === 0 ? dir : Math.sign(diff)) * separation
}

/** On Quest the stick is axes[2], axes[3]; menu is buttons[5] (B/Y). If only one controller has a readable stick, both hands use it; its sideways push only turns, it does not strafe. */
export function controllerInput(sources: Iterable<ControllerSource>): ControllerInput {
  const g: ControllerInput = { leftX: 0, leftY: 0, rightX: 0, rightY: 0, menu: false }
  const sticks: ControllerSource[] = []
  for (const k of sources) {
    if (k.gamepad?.buttons[5]?.pressed) g.menu = true
    if (k.gamepad && k.gamepad.axes.length >= 4) sticks.push(k)
  }
  for (const k of sticks) {
    const x = k.gamepad!.axes[2], y = k.gamepad!.axes[3]
    if (sticks.length === 1) g.leftY = y
    else if (k.handedness === 'left') { g.leftX = x; g.leftY = y }
    if (sticks.length === 1 || k.handedness === 'right') { g.rightX = x; g.rightY = y }
  }
  return g
}
