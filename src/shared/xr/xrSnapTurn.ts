// Snap turn: the rig turns in fixed steps instead of smoothly, which avoids motion sickness for many users.
export const XR_SNAP_ANGLE = Math.PI / 4 // 45 degrees per flick
const SNAP_THRESHOLD = 0.65, SNAP_RESET = 0.25

/** Angle to turn this frame. A flick past the threshold turns once; the stick must return near the centre before it can turn again. */
export function snapTurn(rightX: number, ready: boolean): { angle: number; ready: boolean } {
  if (Math.abs(rightX) < SNAP_RESET) return { angle: 0, ready: true }
  if (ready && Math.abs(rightX) >= SNAP_THRESHOLD) return { angle: rightX > 0 ? -XR_SNAP_ANGLE : XR_SNAP_ANGLE, ready: false }
  return { angle: 0, ready }
}

// Smooth turn: the rig turns continuously while the stick is held. Speed grows with the push and eases in and out,
// so a turn never starts or stops in one frame. The comfort vignette is shown while turning.
export const XR_TURN_SPEED = Math.PI / 2 // 90 degrees per second at full push
const TURN_DEAD_ZONE = 0.2, TURN_EASE = 8 // 1/s: how fast the speed follows the stick

/** Turn speed for this frame (rad/s, positive = left). `speed` is last frame's value. */
export function smoothTurn(rightX: number, speed: number, dt: number): number {
  const push = Math.abs(rightX) < TURN_DEAD_ZONE ? 0 : (Math.abs(rightX) - TURN_DEAD_ZONE) / (1 - TURN_DEAD_ZONE)
  const target = -Math.sign(rightX) * push * push * XR_TURN_SPEED
  const next = speed + (target - speed) * Math.min(1, dt * TURN_EASE)
  return Math.abs(next) < 1e-3 && target === 0 ? 0 : next
}
