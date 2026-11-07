// VR session: rig, controllers, view transitions. Touches the scene itself only through XrOption.
import * as THREE from 'three'
import { TITLE_FAR, TITLE_NEAR, TABLE_SCALE_INITIAL, TABLE_SCALE_MAX, TABLE_SCALE_MIN, rotateAroundHead, titlePlace, stopRig, controllerInput, tableRig, deadZone, nonOverlapAngle, walkStep, type RigPose } from '../../shared/xr/xrMotion'
import { FLOOR_Y, type InteriorStop, type InteriorWalk } from './uluMosqueInterior'
import { snapTurn } from '../../shared/xr/xrSnapTurn'
import { createNarration } from './xrNarration'
import { setupModelAssembly } from './modelAssembleXr'
import type { ModelLayer } from './uluMosqueModel'
import { menuItems } from '../../shared/xr/xrText'
import { CARD_G, MENU_G, titlePanel, infoPanel, labelPanel, xrPanel } from '../../shared/xr/xrPanel'
import { PLAYER_RADIUS, viewBlocked, stopFloor, floorStep } from './walkingCollision'

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
  titles: { id: string; title: string; position: number[] }[];
  /** Clicking the open card's title again closes the card. */
  selectInfo: (id: string) => void;
  /** The scene restores camera, near/far, size and React state. */
  sessionEnded: () => void;
}

export interface XrSession {
  /** Rejects if refused, leaving no trace in the scene. */
  start(): Promise<void>;
  frame(dt: number): void;
  /** Closes the open session; otherwise does nothing. */
  finish(): void;
  showInfo(k: { title: string; text: string; source: string } | null): void;
  active(): boolean;
  /** Whether the assembly game owns the layers. */
  inAssembly(): boolean;
  clear(): void;
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

  // Comfort vignette: a dark ring around the view fades in while the stick walks, which reduces motion sickness.
  const vignette = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.4, 32),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
  )
  vignette.position.set(0, 0, -0.2)
  vignette.renderOrder = 1999
  vignette.frustumCulled = false
  vignette.visible = false
  camera.add(vignette)
  let transition: { t: number; is: () => void; wasDone: boolean } | null = null
  const doTransition = (is: () => void) => {
    if (transition) return
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
  label.obj.material.transparent = true
  label.obj.material.depthTest = false
  label.obj.material.depthWrite = false
  label.obj.renderOrder = 1003
  label.obj.frustumCulled = false
  label.obj.position.set(0, -0.38, -1.2)

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

  const applyRig = (r: RigPose) => {
    rig.position.set(r.x, r.y, r.z)
    rig.rotation.set(0, r.rotY, 0)
  }
  const applyTable = () => {
    rig.scale.setScalar(scale)
    applyRig(tableRig(angle, scale))
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

  const drawMenu = () => menu.draw(menuItems({ inside, fragmented: s.isFragmented(), inAssembly: assembly.inGame(), stops }))
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

  const action = (id: string) => {
    if (id === 'exit') return finish()
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
    if (id === 'assemble') {
      showMenu(false)
      doTransition(() => {
        s.setShatter(false)
        angle = 0
        scale = TABLE_SCALE_INITIAL
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

  const enter = (fresh: XRSession) => {
    session = fresh
    rig.add(camera)
    camera.add(label.obj)
    scene.add(rig)
    scene.add(titleGroup)
    prevBack = scene.background
    scene.background = new THREE.Color(BACKGROUND)
    // Near/far work in rig-local meters (the view matrix is divided by the rig scale): at 100×, near is 5 scene units.
    camera.near = 0.05
    camera.far = 900
    disk.visible = true
    applyTable()
  }

  const undo = () => {
    assembly.finish()
    label.obj.removeFromParent()
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
  let snapReady = true
  const onSessionEnd = () => {
    narration.stop()
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
    const moving = Math.abs(input.leftX) > 0.1 || Math.abs(input.leftY) > 0.1
    const vignetteMaterial = vignette.material as THREE.MeshBasicMaterial
    vignetteMaterial.opacity = moving ? Math.min(0.65, vignetteMaterial.opacity + dt * 4) : Math.max(0, vignetteMaterial.opacity - dt * 4)
    vignette.visible = vignetteMaterial.opacity > 0
    const fresh = walkStep(head, { x: forwardWorld.x, z: forwardWorld.z }, { x: input.leftX, y: input.leftY }, dt,
      (x, z) => floorStep(walking, x, z, PLAYER_RADIUS, innerFloor) === null)
    // On stairs and platforms the rig rises with the floor; since the slope is continuous, it doesn't jump.
    innerFloor = floorStep(walking, fresh.x, fresh.z, PLAYER_RADIUS, innerFloor) ?? innerFloor
    rig.position.y = (walking.baseY ?? FLOOR_Y) + innerFloor
    rig.position.x += fresh.x - head.x
    rig.position.z += fresh.z - head.z

    const turn = snapTurn(input.rightX, snapReady)
    snapReady = turn.ready
    const a = turn.angle
    if (a !== 0) {
      const r = rotateAroundHead({ x: rig.position.x, z: rig.position.z }, fresh, a)
      rig.position.x = r.x
      rig.position.z = r.z
      rig.rotation.y += a
    }
    narration.update(fresh, s.titles)
    updateTitles()
  }

  const tableFrame = (input: ReturnType<typeof controllerInput>, dt: number) => {
    const turn = deadZone(input.rightX), growth = deadZone(input.rightY)
    if (!turn && !growth) return
    angle += turn * dt * STICK_SPEED
    scale = THREE.MathUtils.clamp(scale * Math.exp(growth * dt * STICK_SPEED), TABLE_SCALE_MIN, TABLE_SCALE_MAX)
    applyTable()
  }

  return {
    start: async () => {
      if (session || starting) return
      if (!navigator.xr) throw new Error('WebXR is not available in this browser')
      starting = true
      const ratio = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2())
      let fresh: XRSession | null = null
      try {
        fresh = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
        // The scene may have closed while waiting for permission: don't leave the user in an empty session.
        if (closed) throw new Error('Scene closed')
        await xr.setSession(fresh)
        if (closed || xr.getSession() !== fresh) throw new Error('VR session closed while starting')
      } catch (error) {
        // If setSession was interrupted, the renderer size may be corrupted (it writes an empty pixel ratio on close); it's restored on close.
        if (fresh) {
          const restore = () => {
            xr.removeEventListener('sessionend', restore)
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
      enter(fresh)
    },
    frame: (dt) => {
      if (!session) return
      if (!poseReady) {
        const frame = xr.getFrame(), space = xr.getReferenceSpace()
        if (!frame || !space || !frame.getViewerPose(space)) return
        poseReady = true
        if (menuOpen) showMenu(true)
        if (pendingCard) {
          placeCard()
          card.show(pendingCard)
          pendingCard = null
        }
      }
      advanceTransition(Math.min(dt, MAX_DT))
      const input = controllerInput(session.inputSources)
      if (input.menu && !menuPressed && !transition) showMenu(!menuOpen)
      menuPressed = input.menu
      const step = Math.min(dt, MAX_DT)
      assembly.frame(step)
      if (inside) innerFrame(input, step)
      else if (!assembly.inGame()) tableFrame(input, step)
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
      titles.forEach((b) => b.dispose())
      disk.geometry.dispose()
      disk.material.dispose()
      camera.remove(vignette)
      vignette.geometry.dispose()
      ;(vignette.material as THREE.Material).dispose()
      darken.geometry.dispose()
      darken.material.dispose()
      rayGeometry.dispose()
      rayMaterial.dispose()
    },
  }
}
