// Snap turn: the rig turns in fixed steps instead of smoothly, which avoids motion sickness for many users.
export const XR_SNAP_ANGLE = Math.PI / 4 // 45 degrees per flick
const SNAP_THRESHOLD = 0.65, SNAP_RESET = 0.25

/** Angle to turn this frame. A flick past the threshold turns once; the stick must return near the centre before it can turn again. */
export function snapTurn(rightX: number, ready: boolean): { angle: number; ready: boolean } {
  if (Math.abs(rightX) < SNAP_RESET) return { angle: 0, ready: true }
  if (ready && Math.abs(rightX) >= SNAP_THRESHOLD) return { angle: rightX > 0 ? -XR_SNAP_ANGLE : XR_SNAP_ANGLE, ready: false }
  return { angle: 0, ready }
}
