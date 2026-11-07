// VR hareket hesapları; three ve DOM kullanmaz, Node testinde doğrudan çalışır.
export interface Plane { x: number; z: number }
export interface RigPose { x: number; y: number; z: number; rotY: number }
export interface ControllerSource { handedness: string; gamepad?: { axes: readonly number[]; buttons: readonly { pressed: boolean }[] } }
export interface ControllerInput { leftX: number; leftY: number; rightX: number; rightY: number; menu: boolean }

export const XR_WALK_SPEED = 1.6 // m/sn
export const XR_TURN_SPEED = Math.PI / 4 // rad/sn, çubuk tam itilince
export const TABLE_Y = 0.9, TABLE_DISTANCE = 1.2
export const TABLE_SCALE_INITIAL = 100, TABLE_SCALE_MIN = 40, TABLE_SCALE_MAX = 200
const DEAD_ZONE = 0.2, MAX_DT = 0.1

/** Joystick kaymasını keser; kalan aralığı 0-1'e yayar, işareti korur. */
export function deadZone(d: number): number {
  const m = Math.abs(d)
  if (m < DEAD_ZONE) return 0
  return Math.sign(d) * Math.min(1, (m - DEAD_ZONE) / (1 - DEAD_ZONE))
}

/** Yeni baş konumu. Ölü bölge burada uygulanır; çubuk ham verilir. cubuk.y < 0 ileridir (WebXR). Eksen eksen denenerek duvar boyunca kayılır. */
export function walkStep(head: Plane, forwardDir: Plane, bar: { x: number; y: number }, dt: number, obstacle: (x: number, z: number) => boolean): Plane {
  const length = Math.hypot(forwardDir.x, forwardDir.z)
  if (!length) return { x: head.x, z: head.z } // tam yukarı veya aşağı bakarken yön belirsiz
  const ix = forwardDir.x / length, iz = forwardDir.z / length
  let right = deadZone(bar.x), forward = -deadZone(bar.y)
  const power = Math.hypot(right, forward)
  if (power > 1) { right /= power; forward /= power } // çapraz itiş daha hızlı olmasın
  const step = XR_WALK_SPEED * Math.min(dt, MAX_DT)
  const dx = (ix * forward - iz * right) * step, dz = (iz * forward + ix * right) * step
  let { x, z } = head
  if (!obstacle(x + dx, z)) x += dx
  if (!obstacle(x, z + dz)) z += dz
  return { x, z }
}

/** Bu karede dönülecek açı: çubuğun itildiği kadar. Y çevresinde artı yön sola döndürür; sağa itiş sağa çevirsin diye işaret ters. */
export function smoothTurn(rightX: number, dt: number): number {
  return -deadZone(rightX) * XR_TURN_SPEED * Math.min(dt, MAX_DT)
}

/** Rig `aci` kadar dönerken başın dünyadaki yeri sabit kalsın diye rig'in yeni x/z'si. */
export function rotateAroundHead(rig: Plane, head: Plane, angle: number): Plane {
  const c = Math.cos(angle), s = Math.sin(angle), dx = rig.x - head.x, dz = rig.z - head.z
  return { x: dx * c + dz * s + head.x, z: -dx * s + dz * c + head.z }
}

/** Maket görünümü: dünya masa boyutunda görünsün diye rig `olcek` kat büyür, maket önde ve masa yüksekliğinde kalır. */
export function tableRig(angle: number, scale: number): RigPose {
  const D = TABLE_DISTANCE * scale
  return { x: D * Math.sin(angle), y: -TABLE_Y * scale, z: -D * Math.cos(angle), rotY: Math.PI - angle }
}

/** İç mekân durağı (1× ölçek): başı `konum`un x/z'sine getirir, bakışı `bak`a çevirir. `basYaw` başın rig içindeki yatay yönüdür. */
export function stopRig(position: number[], look: number[], headLocal: Plane, floorY: number, headYaw = 0): RigPose {
  const rotY = Math.atan2(-(look[0] - position[0]), -(look[2] - position[2])) - headYaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return { x: position[0] - (headLocal.x * c + headLocal.z * s), y: floorY, z: position[2] - (-headLocal.x * s + headLocal.z * c), rotY }
}

/** Bilgi başlığı bu yatay uzaklıkların dışında gösterilmez: üstünde durulan başlık yüze yapışır, uzaktaki okunmaz. */
export const TITLE_NEAR = 1.5, TITLE_FAR = 32
const TITLE_MARGIN = 0.5, TITLE_DROP = 10

/** Bilgi başlığının yeri: başa dönük, uzaklıkla büyür ki okunsun. Yaklaştıkça göz hizasına iner, altında duran da nişan alabilsin; duvara gömülmesin diye başa doğru çekilir. */
export function titlePlace(position: number[], head: { x: number; y: number; z: number }) {
  const dx = head.x - position[0], dz = head.z - position[2], horizontal = Math.hypot(dx, dz)
  const y = head.y + (position[1] - head.y) * Math.max(0.25, Math.min(1, horizontal / TITLE_DROP))
  const share = horizontal > TITLE_MARGIN ? TITLE_MARGIN / horizontal : 0
  const scale = Math.max(0.6, Math.min(2.4, Math.hypot(horizontal, y - head.y) / 5))
  return { x: position[0] + dx * share, y, z: position[2] + dz * share, rotY: Math.atan2(dx, dz), scale, horizontal }
}

/** (-π, π] aralığına indirir. */
function wrapAngle(a: number): number {
  const t = 2 * Math.PI, s = ((a % t) + t) % t
  return s > Math.PI ? s - t : s
}

/** Panelin başa göre yatay açısı: istenen yön diğer panelle örtüşürse diğerinin yanına kayar, ışın ikisine de ulaşır. Tam üst üste gelince `yon` karar verir (+1 sol). */
export function nonOverlapAngle(requested: number, other: number, separation: number, dir: 1 | -1): number {
  const diff = wrapAngle(requested - other)
  if (Math.abs(diff) >= separation) return requested
  return other + (diff === 0 ? dir : Math.sign(diff)) * separation
}

/** Quest'te çubuk axes[2], axes[3]; menü buttons[5] (B/Y). Çubuğu okunan tek kumanda varsa iki el de onu kullanır; yana itişi yalnız dönüştür, kaydırmaz. */
export function controllerInput(sources: Iterable<ControllerSource>): ControllerInput {
  const g: ControllerInput = { leftX: 0, leftY: 0, rightX: 0, rightY: 0, menu: false }
  const barred: ControllerSource[] = []
  for (const k of sources) {
    if (k.gamepad?.buttons[5]?.pressed) g.menu = true
    if (k.gamepad && k.gamepad.axes.length >= 4) barred.push(k)
  }
  for (const k of barred) {
    const x = k.gamepad!.axes[2], y = k.gamepad!.axes[3]
    if (barred.length === 1) g.leftY = y
    else if (k.handedness === 'left') { g.leftX = x; g.leftY = y }
    if (barred.length === 1 || k.handedness === 'right') { g.rightX = x; g.rightY = y }
  }
  return g
}
