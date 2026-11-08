// VR and AR session: rig, controllers, view transitions. Touches the scene itself only through XrOption.
// AR (passthrough on Quest, camera on Android) has only the table mode: the model stands on a real table or floor.
import * as THREE from 'three'
import { TITLE_FAR, TITLE_NEAR, TABLE_SCALE_INITIAL, arScale, arTableRig, TABLE_SCALE_MAX, TABLE_SCALE_MIN, rotateAroundHead, titlePlace, stopRig, controllerInput, tableRig, deadZone, nonOverlapAngle, walkStep, type RigPose } from '../../shared/xr/xrMotion'
import { FLOOR_Y, type InteriorStop, type InteriorWalk } from './uluMosqueInterior'
import { smoothTurn } from '../../shared/xr/xrSnapTurn'
import { createNarration } from './xrNarration'
import { setupModelAssembly } from './modelAssembleXr'
import type { ModelLayer } from './uluMosqueModel'
import { menuItems } from '../../shared/xr/xrText'
import { CARD_G, MENU_G, titlePanel, infoPanel, labelPanel, hintPanel, xrPanel } from '../../shared/xr/xrPanel'
// Types only: the AR helpers load with a dynamic import, so Node tests that import this file do not pull in three/examples.
import type { ArPlacement } from '../../shared/xr/arPlacement'
import type { createArLighting as ArLighting } from '../../shared/xr/arLight'
import { PLAYER_RADIUS, viewBlocked, stopFloor, floorStep } from './walkingCollision'
import { applyMobileArQuality } from './mobileAr/detect'

export interface XrOption {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  walking: InteriorWalk; stops: InteriorStop[];
  /** Interior light and environment; doesn't touch the camera. */
  interiorState: (inside: boolean) => void;
  /** Layers go to the target instantly. */
  setShatter: (open: boolean) => void;
  isFragmented: () => boolean;
  layers: ModelLayer[];
  refreshShadow: () => void;
  closeInfo: () => void;
  /** Titles standing in the interior scene that open the card when clicked. */
  titles: { id: string; title: string; position: number[]; radius?: number }[];
  /** The recordings describe Ulu Camii only: other buildings share spot ids such as `mihrab` and must stay silent. */
  narrated: boolean;
  /** Clicking the open card's title again closes the card. */
  selectInfo: (id: string) => void;
  /** The scene restores camera, near/far, size and React state. */
  sessionEnded: () => void;
  /** The whole model: AR measures it to size it for a table and to stand its underside on the surface. */
  root: THREE.Object3D;
  /** Virtual ground under the model (pedestal); hidden in AR so the real table shows. */
  ground?: THREE.Object3D;
}

export type XrMode = 'vr' | 'ar'

/** Phone AR state for the DOM overlay; `null` when no phone AR session is running. */
export interface MobileArState { phase: 'placing' | 'placed'; fragmented: boolean }

export interface XrStartOption {
  /** Phone AR: the WebXR dom-overlay root. Its presence turns on the phone mode (no head panels, no menu). */
  overlayRoot?: HTMLElement;
  /** Phone AR: called on every phase or shatter change, and with `null` when the session ends. */
  onMobileState?: (state: MobileArState | null) => void;
}

/** Phone AR actions; each does nothing outside a phone AR session. */
export interface MobileArControl {
  shatter(): void;
  /** Back to placement: the model follows the ring until the next screen tap. */
  replace(): void;
  exit(): void;
  /** The model looks `factor` times larger; clamped like the Quest stick. Only while placed. */
  scaleBy(factor: number): void;
  /** Adds to the same angle the Quest right stick turns. Only while placed. */
  rotateBy(rad: number): void;
}

export interface XrSession {
  /** Rejects if refused, leaving no trace in the scene. */
  start(mode?: XrMode, option?: XrStartOption): Promise<void>;
  frame(dt: number): void;
  /** Closes the open session; otherwise does nothing. */
  finish(): void;
  showInfo(k: { title: string; text: string; source: string } | null): void;
  active(): boolean;
  /** Whether the assembly game owns the layers. */
  inAssembly(): boolean;
  clear(): void;
  mobileAr: MobileArControl;
}

const BACKGROUND = '#1a2b25'
const DISK_RADIUS = 6
const RAY_LENGTH = 1.5
const PANEL_DISTANCE = 1.3
const CARD_BOTTOM = 0.24
// If the card and menu are open together they sit side by side: the ray must not catch the front one and leave the back one unselectable.
const PANEL_GAP = (MENU_G / 2 + CARD_G / 2 + 0.06) / PANEL_DISTANCE
const STICK_SPEED = 1.2, MAX_DT = 0.1
const TRANSITION_DECISION = 0.12, TRANSITION_URGENT = 0.2
const TITLE_COLOR = '#c9d4cf', TITLE_LIGHT = '#ffffff', TITLE_GROWTH = 1.12
// AR: stick scaling stays around the table size; with no surface found the model waits this far ahead, below the eyes (metres).
const AR_SCALE_MIN = 0.4, AR_SCALE_MAX = 2.5, AR_AHEAD = 1, AR_BELOW_EYES = 0.6
const AR_HINT = 'Masaya ya da yere bak. Halka çıkınca tetiğe bas.'

/** The model's box; objects marked `userData.noBounds` (e.g. a sky sphere seen only while walking) do not count. */
function modelBounds(root: THREE.Object3D): THREE.Box3 {
  root.updateWorldMatrix(true, true)
  const box = new THREE.Box3(), part = new THREE.Box3()
  const visit = (o: THREE.Object3D) => {
    if (o.userData.noBounds) return
    const geometry = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined
    if (geometry?.attributes?.position) {
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      box.union(part.copy(geometry.boundingBox!).applyMatrix4(o.matrixWorld))
    }
    o.children.forEach(visit)
  }
  visit(root)
  return box
}

export function setupXrSession(s: XrOption): XrSession {
  const { renderer, scene, camera, walking, stops } = s
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  // When the rig is 100×, eye separation is 100× too (WebXRManager multiplies the camera world matrix by the rig), so the world looks table-sized.
  // Inside the rig is always device meters: disc, ray and panels keep the same size regardless of scale.
  const rig = new THREE.Group()
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(DISK_RADIUS, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#0f1a16' }),
  )
  rig.add(disk)

  const menu = xrPanel()
  const card = infoPanel()
  // Panels skip the depth test: readable even against a wall or in front of the model.
  for (const [panel, row] of [[menu, 1000], [card, 1001]] as const) {
    panel.obj.material.transparent = true
    panel.obj.material.depthTest = false
    panel.obj.material.depthWrite = false
    panel.obj.renderOrder = row
    rig.add(panel.obj)
  }
  menu.obj.visible = false

  // View changes use a short fade: a single-frame jump in VR is both jarring and uncomfortable.
  const darken = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
  )
  darken.renderOrder = 2000
  darken.frustumCulled = false
  darken.visible = false
  rig.add(darken)

  // Comfort vignette: the edge of the view darkens softly while the stick walks, which reduces motion sickness.
  // The clear centre covers about 70 degrees and fades out towards the edge; the ring reaches past the headset's field of view,
  // so no bright band is left at the rim (the old hard 44-degree ring read as a "round window" on Quest).
  const vignetteShape = new THREE.RingGeometry(0.14, 1.2, 48, 6)
  {
    const pos = vignetteShape.attributes.position
    const alpha = new Float32Array(pos.count * 4)
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i))
      const t = Math.min(1, Math.max(0, (r - 0.14) / 0.16))
      alpha.set([0, 0, 0, t * t * (3 - 2 * t)], i * 4)
    }
    vignetteShape.setAttribute('color', new THREE.BufferAttribute(alpha, 4))
  }
  const vignette = new THREE.Mesh(
    vignetteShape,
    new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
  )
  vignette.position.set(0, 0, -0.2)
  vignette.renderOrder = 1999
  vignette.frustumCulled = false
  vignette.visible = false
  camera.add(vignette)
  let transition: { t: number; is: () => void; wasDone: boolean } | null = null
  const doTransition = (is: () => void) => {
    if (transition) return
    // AR: a black fade would hide the real room; the change happens at once.
    if (ar) return is()
    transition = { t: 0, is, wasDone: false }
    darken.visible = true
  }
  const advanceTransition = (dt: number) => {
    if (!transition) return
    transition.t += dt
    if (!transition.wasDone && transition.t >= TRANSITION_DECISION) {
      transition.wasDone = true
      transition.is()
    }
    darken.position.copy(headLocal().position)
    darken.material.opacity = transition.t < TRANSITION_DECISION ? transition.t / TRANSITION_DECISION : Math.max(0, 1 - (transition.t - TRANSITION_DECISION) / TRANSITION_URGENT)
    if (transition.t >= TRANSITION_DECISION + TRANSITION_URGENT) {
      transition = null
      darken.visible = false
    }
  }

  // The label is attached to the head: it stays at the bottom of the view even if the menu closes, the card covers it or the head turns.
  const label = labelPanel()
  const arLabel = labelPanel('Menü: Y / B · Sağ çubuk: döndür, büyüt')
  // AR placement hint: slightly above the centre of view, so the ring on the table below stays visible.
  const hint = hintPanel(AR_HINT)
  for (const [panel, y, z] of [[label, -0.38, -1.2], [arLabel, -0.38, -1.2], [hint, 0.14, -1.1]] as const) {
    panel.obj.material.transparent = true
    panel.obj.material.depthTest = false
    panel.obj.material.depthWrite = false
    panel.obj.renderOrder = 1003
    panel.obj.frustumCulled = false
    panel.obj.position.set(0, y, z)
  }

  // Titles are in the scene, not the rig, and take part in the depth test: those behind a wall are hidden.
  const titles = s.titles.map(({ id, title, position }) => ({ id, position, ...titlePanel(title) }))
  const titleGroup = new THREE.Group()
  titleGroup.visible = false
  titles.forEach((b) => {
    b.obj.userData.info = b.id
    titleGroup.add(b.obj)
  })

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -RAY_LENGTH)])
  const rayMaterial = new THREE.LineBasicMaterial({ color: '#f8f5ef', transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
  const raycaster = new THREE.Raycaster()

  let session: XRSession | null = null
  let starting = false
  let closed = false
  let prevBack: THREE.Scene['background'] = null
  let inside = false
  let angle = 0, scale = TABLE_SCALE_INITIAL
  let menuOpen = true, menuPressed = false
  // Panels can't be placed before the head pose arrives; they wait during the first frames.
  let poseReady = false
  let pendingCard: { title: string; text: string; source: string } | null = null

  // AR state. The anchor is the centre of the model's underside (model units); the spot is the real surface point (device metres).
  let ar = false
  let placed = false, placeNow = false
  // Phone AR: the DOM overlay replaces the head-attached hint, label and menu; a tap after placement does nothing.
  let mobile = false
  let mobileListener: XrStartOption['onMobileState'] | null = null
  let restoreQuality: (() => void) | null = null
  const undoQuality = () => { restoreQuality?.(); restoreQuality = null }
  const emitMobile = () => {
    if (mobile) mobileListener?.({ phase: placed ? 'placed' : 'placing', fragmented: s.isFragmented() })
  }
  const culled: THREE.Object3D[] = []
  let placing: ArPlacement | null = null
  let arLight: ReturnType<typeof ArLighting> | null = null
  let shadow: { mesh: THREE.Mesh; dispose(): void } | null = null
  let arBase = TABLE_SCALE_INITIAL, arYaw = 0, groundShown = true
  const arAnchor = new THREE.Vector3(), arSpot = new THREE.Vector3()
  const prevClear = new THREE.Color()
  let prevAlpha = 1

  const applyRig = (r: RigPose) => {
    rig.position.set(r.x, r.y, r.z)
    rig.rotation.set(0, r.rotY, 0)
  }
  const applyTable = () => {
    rig.scale.setScalar(scale)
    // AR: the model stays on the real spot; the stick turns it around its own centre and scales it in place.
    applyRig(ar ? arTableRig(arAnchor, arSpot, Math.PI - angle - arYaw, scale) : tableRig(angle, scale))
  }

  // The XR camera is updated at the start of each frame; its position is the (local) head pose inside the rig.
  const headLocal = () => xr.getCamera()
  const horizontalForward = new THREE.Vector3()
  /** Horizontal direction of the head inside the rig; positive is left. 0 when looking straight up or down. */
  const headYaw = () => {
    horizontalForward.set(0, 0, -1).applyQuaternion(headLocal().quaternion).setY(0)
    return horizontalForward.lengthSq() < 1e-6 ? 0 : Math.atan2(-horizontalForward.x, -horizontalForward.z)
  }
  /** Places the panel in front of the head; if the other panel is open, shifts aside so they don't overlap. */
  const placePanelAt = (obj: THREE.Object3D, another: THREE.Object3D, dir: 1 | -1) => {
    const head = headLocal().position
    const angle = another.visible
      ? nonOverlapAngle(headYaw(), Math.atan2(head.x - another.position.x, head.z - another.position.z), PANEL_GAP, dir)
      : headYaw()
    obj.position.set(head.x - Math.sin(angle) * PANEL_DISTANCE, head.y, head.z - Math.cos(angle) * PANEL_DISTANCE)
    obj.rotation.set(0, angle, 0)
  }
  // The card sits below the gaze: it doesn't cover the scene, the eye drops slightly to read.
  const placeCard = () => { placePanelAt(card.obj, menu.obj, -1); card.obj.position.y -= CARD_BOTTOM }

  const drawMenu = () => menu.draw(menuItems({ inside, fragmented: s.isFragmented(), inAssembly: assembly.inGame(), ar, stops }))
  const showMenu = (open: boolean) => {
    menuOpen = open
    menu.obj.visible = open
    if (!open) {
      // A card with no menu beside it moves to the center of view.
      if (card.obj.visible) placeCard()
      return
    }
    placePanelAt(menu.obj, card.obj, 1)
    drawMenu()
  }

  let innerFloor = 0
  const viewStop = (id: string) => {
    const stop = stops.find((d) => d.id === id)
    if (!stop) return
    if (!inside) {
      inside = true
      s.setShatter(false)
      s.interiorState(true)
      titleGroup.visible = true
      disk.visible = false
      rig.scale.setScalar(1)
    }
    const { x, z } = headLocal().position
    innerFloor = stopFloor(walking, stop.position)
    applyRig(stopRig(stop.position, stop.look, { x, z }, (walking.baseY ?? FLOOR_Y) + innerFloor, headYaw()))
  }
  const viewModel = () => {
    if (inside) {
      inside = false
      s.interiorState(false)
      titleGroup.visible = false
      resetRays()
      disk.visible = true
    }
    applyTable()
  }

  const finish = () => { session?.end().catch(() => {}) } // end() rejects on an already closed session

  /** AR: back to placement; the model follows the ring again until the next trigger press. */
  const replace = () => {
    placed = false
    placeNow = false
    s.closeInfo()
    showMenu(false)
    hint.obj.visible = true
    emitMobile()
  }

  const action = (id: string) => {
    if (id === 'exit') return finish()
    if (id === 'replace') return replace()
    // There is no 1:1 interior in AR: a real room cannot hold the building.
    if (ar && (id === 'inside' || id.startsWith('stop:') || id === 'outside')) return
    // Inside, the menu closes when a stop is selected: the view stays clear and the card opens straight ahead. Reopens with Y/B.
    if (id === 'inside' || id.startsWith('stop:')) {
      const target = id === 'inside' ? stops[0]?.id : id.slice('stop:'.length)
      if (!target) return
      s.closeInfo()
      showMenu(false)
      doTransition(() => viewStop(target))
      return
    }
    if (id === 'outside') {
      doTransition(() => {
        viewModel()
        showMenu(true)
      })
      return
    }
    // The model returns to its initial angle and scale: the shelf should be on the user's right, within reach.
    // A large complex starts smaller (VR), so the model and its shelf both fit in view and the hand travel stays as for Ulu Camii.
    if (id === 'assemble') {
      showMenu(false)
      doTransition(() => {
        s.setShatter(false)
        angle = 0
        scale = ar ? arBase : THREE.MathUtils.clamp(TABLE_SCALE_INITIAL * assembly.size(), TABLE_SCALE_MIN, TABLE_SCALE_MAX)
        applyTable()
        assembly.begin()
      })
      return
    }
    if (id === 'assembleFromStart') {
      assembly.begin()
      showMenu(false)
      return
    }
    if (id === 'assembleRelease') {
      doTransition(() => {
        assembly.finish()
        showMenu(true)
      })
      return
    }
    if (id === 'shatter') s.setShatter(!s.isFragmented())
    drawMenu()
  }

  /** Panels are tested first: since they skip the depth test, they always appear in front. */
  const findHit = (controller: THREE.XRTargetRaySpace) => {
    // The select event arrives outside the frame loop: world matrices are refreshed by hand.
    controller.updateWorldMatrix(true, false, true) // matrixAutoUpdate is off; unless forced, rig changes are not reflected
    raycaster.setFromXRController(controller)
    // Raycaster ignores visibility; hidden objects must not be candidates.
    const panels = [menu.obj, card.obj].filter((n) => n.visible)
    panels.forEach((n) => n.updateWorldMatrix(true, false))
    const panel = raycaster.intersectObjects(panels, false)[0]
    if (panel || !titleGroup.visible) return panel ?? null
    const candidates = titles.map((b) => b.obj).filter((n) => n.visible)
    candidates.forEach((n) => n.updateWorldMatrix(true, false))
    return raycaster.intersectObjects(candidates, false)[0] ?? null
  }

  const wasSelected = (controller: THREE.XRTargetRaySpace) => {
    if (!session || transition) return
    // AR placement: any trigger press (or screen tap on a phone) puts the model down where it is previewed.
    if (ar && !placed) { placeNow = true; return }
    // Phone: after placement a screen tap has no target (no rays, no menu); the overlay buttons do the work.
    if (mobile) return
    const hit = findHit(controller)
    if (!hit) return
    if (hit.object === card.obj) return s.closeInfo()
    const info: string | undefined = hit.object.userData.info
    if (info) return s.selectInfo(info)
    const id = hit.uv ? menu.hit(hit.uv.y) : null
    if (id) action(id)
  }

  const controllers = [0, 1].map((i) => {
    const controller = xr.getController(i)
    const ray = new THREE.Line(rayGeometry, rayMaterial)
    ray.renderOrder = 1002
    controller.add(ray)
    rig.add(controller)
    const select = () => wasSelected(controller)
    controller.addEventListener('select', select)
    return { controller, ray, select }
  })
  const resetRays = () => controllers.forEach(({ ray }) => { ray.scale.z = 1 })
  const assembly = setupModelAssembly({ scene, camera, layers: s.layers, controllers, refreshShadow: s.refreshShadow, completed: () => showMenu(true) })

  /** AR: sizes the model for a table and finds its underside. Measured on every start: layers or buildings may differ. */
  const measureForAr = () => {
    const box = modelBounds(s.root)
    if (box.isEmpty()) return null
    const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3())
    const extent = Math.max(size.x, size.z)
    arBase = arScale(extent)
    arAnchor.set(centre.x, box.min.y, centre.z)
    return extent
  }

  const enter = (fresh: XRSession, mode: XrMode, lighting: ReturnType<typeof ArLighting> | null, phone: boolean) => {
    session = fresh
    ar = mode === 'ar'
    mobile = ar && phone
    rig.add(camera)
    if (!mobile) camera.add(ar ? arLabel.obj : label.obj)
    scene.add(rig)
    scene.add(titleGroup)
    prevBack = scene.background
    // Near/far work in rig-local meters (the view matrix is divided by the rig scale): at 100×, near is 5 scene units.
    camera.near = ar ? 0.02 : 0.05
    camera.far = 900
    if (ar) {
      // The real room must show through: no background, transparent clear, no virtual floor or pedestal.
      scene.background = null
      renderer.getClearColor(prevClear)
      prevAlpha = renderer.getClearAlpha()
      renderer.setClearColor(0x000000, 0)
      disk.visible = false
      groundShown = s.ground?.visible ?? true
      if (s.ground) s.ground.visible = false
      // The rig is scaled hundreds of times in AR; three's combined two-eye frustum then culls parts of the model
      // when looking down from above. The model is one object on a table, so culling buys nothing here.
      culled.length = 0
      s.root.traverse((o) => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false } })
      const extent = measureForAr() ?? 1
      scale = arBase
      placed = false
      placeNow = false
      arSpot.set(0, 0, -AR_AHEAD)
      arYaw = 0
      if (!mobile) camera.add(hint.obj)
      hint.obj.visible = true
      arLight = lighting
      void Promise.all([import('../../shared/xr/arPlacement'), import('../../shared/xr/arLight')]).then(async ([{ createArPlacement }, { createContactShadow }]) => {
        if (session !== fresh || !ar) return
        shadow ??= createContactShadow((extent / 2) * 1.08)
        // Just above the underside so it does not flicker against the model's lowest face.
        shadow.mesh.position.set(arAnchor.x, arAnchor.y + 0.05, arAnchor.z)
        scene.add(shadow.mesh)
        const p = await createArPlacement(fresh)
        if (session !== fresh || !ar) { p?.dispose(); return }
        placing = p
        if (p) rig.add(p.reticle)
      }).catch(() => { /* AR still works without the ring: the model waits in front of the user until the trigger */ })
    } else {
      scene.background = new THREE.Color(BACKGROUND)
      disk.visible = true
    }
    applyTable()
    emitMobile()
  }

  /** AR placement frame: the model previews on the ring (or ahead of the user with no surface); the trigger press fixes it. */
  const arPreview = () => {
    const frame = xr.getFrame(), space = xr.getReferenceSpace()
    const hit = placing && frame && space ? placing.update(frame, space) : null
    const head = headLocal().position
    if (hit && placing) {
      arSpot.copy(placing.reticle.position)
      const dx = arSpot.x - head.x, dz = arSpot.z - head.z
      // Faces the user: the side seen first is the same as at the VR table.
      arYaw = Math.hypot(dx, dz) > 0.05 ? Math.atan2(-dx, -dz) : headYaw()
    } else {
      arYaw = headYaw()
      arSpot.set(head.x - Math.sin(arYaw) * AR_AHEAD, Math.max(0, head.y - AR_BELOW_EYES), head.z - Math.cos(arYaw) * AR_AHEAD)
    }
    applyTable()
    if (!placeNow) return
    placeNow = false
    placed = true
    if (placing) placing.reticle.visible = false
    hint.obj.visible = false
    if (mobile) emitMobile()
    else showMenu(true)
  }

  const undo = () => {
    assembly.finish()
    label.obj.removeFromParent()
    arLabel.obj.removeFromParent()
    hint.obj.removeFromParent()
    if (ar) {
      placing?.reticle.removeFromParent()
      placing?.dispose()
      placing = null
      arLight?.stop()
      arLight = null
      shadow?.mesh.removeFromParent()
      renderer.setClearColor(prevClear, prevAlpha)
      if (s.ground) s.ground.visible = groundShown
      for (const o of culled) o.frustumCulled = true
      culled.length = 0
      disk.visible = true
      ar = false
      placed = false
      placeNow = false
    }
    if (mobile) mobileListener?.(null)
    mobile = false
    mobileListener = null
    camera.removeFromParent()
    camera.scale.set(1, 1, 1) // Rounding error left over when detaching from the rig
    rig.removeFromParent()
    titleGroup.removeFromParent()
    titleGroup.visible = false
    resetRays()
    scene.background = prevBack
    prevBack = null
    if (inside) s.interiorState(false)
    session = null
    inside = false
    angle = 0
    scale = TABLE_SCALE_INITIAL
    menuOpen = true
    menuPressed = false
    poseReady = false
    pendingCard = null
    transition = null
    darken.visible = false
    menu.obj.visible = false
    card.hide()
  }

  const narration = createNarration()
  let turnSpeed = 0 // rad/s, eased (smooth turn)
  const onSessionEnd = () => {
    narration.stop()
    // Runs after three's own sessionend restore, so the original pixel ratio wins.
    undoQuality()
    if (!session) return // Closing a half-finished start: the scene was never touched
    undo()
    s.sessionEnded()
  }
  xr.addEventListener('sessionend', onSessionEnd)

  const headWorld = new THREE.Vector3(), forwardWorld = new THREE.Vector3()

  /** Turns titles towards the head; the title hit by the ray glows and the ray extends to it, so it's clear what is being aimed at. */
  const updateTitles = () => {
    camera.updateWorldMatrix(true, false)
    headWorld.setFromMatrixPosition(camera.matrixWorld)
    const { x, y, z } = headWorld
    for (const { obj, position } of titles) {
      const place = titlePlace(position, { x, y, z })
      obj.visible = place.horizontal > TITLE_NEAR && place.horizontal < TITLE_FAR &&
        !walking.viewBlockers.some((k) => viewBlocked(x, z, position[0], position[2], k))
      obj.position.set(place.x, place.y, place.z)
      obj.rotation.set(0, place.rotY, 0)
      obj.scale.setScalar(place.scale)
    }
    const touchingOne = new Set<THREE.Object3D>()
    for (const { controller, ray } of controllers) {
      const hit = controller.visible ? findHit(controller) : null
      const onTitle = !!hit?.object.userData.info
      if (onTitle) touchingOne.add(hit.object)
      ray.scale.z = onTitle ? hit.distance / RAY_LENGTH : 1
    }
    for (const { obj } of titles) {
      const glossy = touchingOne.has(obj)
      obj.material.color.set(glossy ? TITLE_LIGHT : TITLE_COLOR)
      if (glossy) obj.scale.multiplyScalar(TITLE_GROWTH)
    }
  }

  const innerFrame = (input: ReturnType<typeof controllerInput>, dt: number) => {
    // The rig may have moved within this frame (via stop selection); don't read the matrix without refreshing it.
    camera.updateWorldMatrix(true, false)
    headWorld.setFromMatrixPosition(camera.matrixWorld)
    forwardWorld.set(0, 0, -1).transformDirection(camera.matrixWorld)
    const head = { x: headWorld.x, z: headWorld.z }
    // If the head has ended up inside an obstacle (e.g. by leaning), step the rig out to the nearest free spot.
    if (floorStep(walking, head.x, head.z, PLAYER_RADIUS, innerFloor) === null) {
      for (let k = 0; k < 8; k++) {
        const ang = k * Math.PI / 4, tx = head.x + Math.cos(ang) * 0.35, tz = head.z + Math.sin(ang) * 0.35
        if (floorStep(walking, tx, tz, PLAYER_RADIUS, innerFloor) !== null) {
          rig.position.x += tx - head.x
          rig.position.z += tz - head.z
          head.x = tx
          head.z = tz
          break
        }
      }
    }
    // A worn stick drifts a little; only a deliberate push counts as walking.
    const moving = Math.hypot(input.leftX, input.leftY) > 0.25 || Math.abs(turnSpeed) > 0.3
    const vignetteMaterial = vignette.material as THREE.MeshBasicMaterial
    vignetteMaterial.opacity = moving ? Math.min(0.55, vignetteMaterial.opacity + dt * 3) : Math.max(0, vignetteMaterial.opacity - dt * 4)
    vignette.visible = vignetteMaterial.opacity > 0
    const fresh = walkStep(head, { x: forwardWorld.x, z: forwardWorld.z }, { x: input.leftX, y: input.leftY }, dt,
      (x, z) => floorStep(walking, x, z, PLAYER_RADIUS, innerFloor) === null)
    // On stairs and platforms the rig rises with the floor; since the slope is continuous, it doesn't jump.
    innerFloor = floorStep(walking, fresh.x, fresh.z, PLAYER_RADIUS, innerFloor) ?? innerFloor
    rig.position.y = (walking.baseY ?? FLOOR_Y) + innerFloor
    rig.position.x += fresh.x - head.x
    rig.position.z += fresh.z - head.z

    turnSpeed = smoothTurn(input.rightX, turnSpeed, dt)
    const a = turnSpeed * dt
    if (a !== 0) {
      const r = rotateAroundHead({ x: rig.position.x, z: rig.position.z }, fresh, a)
      rig.position.x = r.x
      rig.position.z = r.z
      rig.rotation.y += a
    }
    if (s.narrated) narration.update(fresh, s.titles)
    updateTitles()
  }

  /** During the assembly game only the size changes: turning would carry the shelf away from the user's right. */
  const tableFrame = (input: ReturnType<typeof controllerInput>, dt: number) => {
    const inGame = assembly.inGame()
    const turn = inGame ? 0 : deadZone(input.rightX), growth = deadZone(input.rightY)
    if (!turn && !growth) return
    angle += turn * dt * STICK_SPEED
    scale = ar
      ? THREE.MathUtils.clamp(scale * Math.exp(growth * dt * STICK_SPEED), arBase * AR_SCALE_MIN, arBase * AR_SCALE_MAX)
      : THREE.MathUtils.clamp(scale * Math.exp(growth * dt * STICK_SPEED), TABLE_SCALE_MIN, TABLE_SCALE_MAX)
    applyTable()
    // A carried layer stays in the hand: its carry start is taken again from the hand's new scene position.
    if (inGame) assembly.reanchor()
  }

  return {
    start: async (mode = 'vr', option = {}) => {
      if (session || starting) return
      const root = mode === 'ar' ? option.overlayRoot : undefined
      if (!navigator.xr) throw new Error('WebXR is not available in this browser')
      starting = true
      if (s.narrated && mode === 'vr') narration.unlock() // inside the click that starts VR, so the browser lets the guide play later
      const ratio = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2())
      // Started without awaiting: no await may come before requestSession, or the browser loses the user gesture.
      const lightModule = mode === 'ar' ? import('../../shared/xr/arLight').catch(() => null) : null
      let fresh: XRSession | null = null
      let lighting: ReturnType<typeof ArLighting> | null = null
      try {
        fresh = await navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', root
          ? { optionalFeatures: ['local-floor', 'hit-test', 'light-estimation', 'dom-overlay'], domOverlay: { root } }
          : { optionalFeatures: mode === 'ar' ? ['local-floor', 'hit-test', 'light-estimation'] : ['local-floor'] })
        // The scene may have closed while waiting for permission: don't leave the user in an empty session.
        if (closed) throw new Error('Scene closed')
        // Room lighting listens for the session start, so it must exist before setSession.
        const light = lightModule ? await lightModule : null
        if (light) {
          lighting = light.createArLighting(renderer, scene)
          lighting.start()
        }
        // Phone: the framebuffer scale only takes effect before setSession.
        if (root) restoreQuality = applyMobileArQuality(renderer)
        await xr.setSession(fresh)
        if (closed || xr.getSession() !== fresh) throw new Error('XR session closed while starting')
      } catch (error) {
        lighting?.stop()
        // If setSession was interrupted, the renderer size may be corrupted (it writes an empty pixel ratio on close); it's restored on close.
        if (fresh) {
          const restore = () => {
            xr.removeEventListener('sessionend', restore)
            undoQuality()
            renderer.setPixelRatio(ratio)
            renderer.setSize(size.x, size.y, false)
          }
          xr.addEventListener('sessionend', restore)
          await fresh.end().catch(restore)
        }
        undoQuality()
        throw error
      } finally {
        starting = false
      }
      xr.setFoveation(1)
      if (root) mobileListener = option.onMobileState ?? null
      enter(fresh, mode, lighting, !!root)
    },
    frame: (dt) => {
      if (!session) return
      if (!poseReady) {
        const frame = xr.getFrame(), space = xr.getReferenceSpace()
        if (!frame || !space || !frame.getViewerPose(space)) return
        poseReady = true
        // AR: the menu waits until the model is placed.
        if (menuOpen && !(ar && !placed) && !mobile) showMenu(true)
        if (pendingCard) {
          placeCard()
          card.show(pendingCard)
          pendingCard = null
        }
      }
      advanceTransition(Math.min(dt, MAX_DT))
      if (ar && !placed) arPreview()
      const input = controllerInput(session.inputSources)
      if (input.menu && !menuPressed && !transition && !(ar && !placed) && !mobile) showMenu(!menuOpen)
      menuPressed = input.menu
      const step = Math.min(dt, MAX_DT)
      assembly.frame(step)
      if (inside) innerFrame(input, step)
      else tableFrame(input, step)
    },
    finish,
    showInfo: (k) => {
      if (!session) return
      if (!k) {
        pendingCard = null
        card.hide()
      } else if (poseReady) {
        placeCard()
        card.show(k)
      } else {
        pendingCard = k
      }
    },
    active: () => session !== null,
    inAssembly: () => assembly.inGame(),
    clear: () => {
      closed = true
      xr.removeEventListener('sessionend', onSessionEnd)
      undoQuality()
      const open = session
      // The scene is closing too: sessionEnded is not called and a later sessionend is not listened to.
      if (open) {
        undo()
        open.end().catch(() => {})
      }
      assembly.clear()
      for (const { controller, select } of controllers) {
        controller.removeEventListener('select', select)
        controller.removeFromParent()
      }
      menu.dispose()
      card.dispose()
      label.dispose()
      arLabel.dispose()
      hint.dispose()
      shadow?.dispose()
      titles.forEach((b) => b.dispose())
      disk.geometry.dispose()
      disk.material.dispose()
      narration.dispose()
      camera.remove(vignette)
      vignette.geometry.dispose()
      ;(vignette.material as THREE.Material).dispose()
      darken.geometry.dispose()
      darken.material.dispose()
      rayGeometry.dispose()
      rayMaterial.dispose()
    },
    mobileAr: {
      shatter: () => {
        if (!mobile || !placed) return
        s.setShatter(!s.isFragmented())
        emitMobile()
      },
      replace: () => { if (mobile && placed) replace() },
      exit: () => { if (mobile) finish() },
      scaleBy: (factor) => {
        if (!mobile || !placed || !(factor > 0)) return
        // The rig scale is model units per metre: a larger model is a smaller rig scale.
        scale = THREE.MathUtils.clamp(scale / factor, arBase * AR_SCALE_MIN, arBase * AR_SCALE_MAX)
        applyTable()
      },
      rotateBy: (rad) => {
        if (!mobile || !placed || !Number.isFinite(rad)) return
        angle += rad
        applyTable()
      },
    },
  }
}
