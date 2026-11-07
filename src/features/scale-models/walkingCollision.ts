// Interior collision; uses neither three nor the DOM, runs directly in the Node test.
import type { InteriorWalk, Box } from './uluMosqueInterior.ts'

export const PLAYER_RADIUS = 0.45
/** Height that can be stepped up or down in one step: a larger difference behaves like a wall or a cliff. */
export const STEP_LIMIT = 0.55
const SIDE_SAMPLE = 0.2

/** Collision boxes and circles are treated as inflated by the player radius. */
export function collides(walking: InteriorWalk, x: number, z: number, r: number, h = 0): boolean {
  const { limit, boxes, circles } = walking
  if (x < limit.x0 + r || x > limit.x1 - r || z < limit.z0 + r || z > limit.z1 - r) return true
  if (limit.circle && Math.hypot(x - limit.circle.x, z - limit.circle.z) + r > limit.circle.r) return true
  for (const k of boxes) if ((k.top === undefined || h < k.top) && x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r) return true
  for (const d of circles) if ((d.top === undefined || h < d.top) && Math.hypot(x - d.x, z - d.z) < d.r + r) return true
  return false
}

/** Floor at this point for a player of height `h`; null if impassable. */
function findFloor(walking: InteriorWalk, x: number, z: number, h: number): number | null {
  let top = 0
  for (const a of walking.floors) {
    if (x < a.x0 || x > a.x1 || z < a.z0 || z > a.z1) continue
    const y = a.h0 + (a.h1 - a.h0) * ((z - a.z0) / (a.z1 - a.z0))
    if (y <= h + STEP_LIMIT) top = Math.max(top, y)
    else if (!a.underPassable) return null
  }
  return h - top > STEP_LIMIT ? null : top
}

/** New floor height if this point can be stepped onto, otherwise null. Side samples prevent falling off edges. */
export function floorStep(walking: InteriorWalk, x: number, z: number, r: number, h: number): number | null {
  const y = findFloor(walking, x, z, h)
  if (y === null || collides(walking, x, z, r, y)) return null
  for (const [a, b] of [[SIDE_SAMPLE, 0], [-SIDE_SAMPLE, 0], [0, SIDE_SAMPLE], [0, -SIDE_SAMPLE]]) {
    if (findFloor(walking, x + a, z + b, y) === null) return null
  }
  return y
}

/** Floor of a stop position from its eye height: a stop on the ground is 0, a stop on a structure is that structure's height. */
export function stopFloor(walking: InteriorWalk, position: number[]): number {
  return Math.max(0, findFloor(walking, position[0], position[2], position[1] - walking.eyeY) ?? 0)
}

/** Does the top-down line segment between two points intersect the box? */
export function viewBlocked(ax: number, az: number, bx: number, bz: number, k: Box) {
  let t0 = 0, t1 = 1
  for (const [p, q] of [[ax - bx, ax - k.x0], [bx - ax, k.x1 - ax], [az - bz, az - k.z0], [bz - az, k.z1 - az]]) {
    if (p === 0) { if (q < 0) return false; continue }
    const t = q / p
    if (p < 0) t0 = Math.max(t0, t)
    else t1 = Math.min(t1, t)
    if (t0 > t1) return false
  }
  return true
}
