// Sword workshop VR session: rig, controllers, panels. Touches game rules only through SwordBridge.
import * as T from 'three'
import { controllerInput, deadZone } from '../../../../shared/xr/xrMotion'
import type { Game } from './state'
import { pieces } from './state'
import type { Command } from './scene'
import { infoPanel, INFO_Y, controlPanel, PANEL_METER } from './xrPanel'
import { wristStep, infoState, HammerMeter, planeX, station, stationRig, panelState, panelShouldReturn, PANEL_G, PANEL_Y, PIECE_TOUCH, pieceSnaps, SwingMeter, swingCut } from './xrCalc'
import type { Frame, Box } from './xrCalc'

export type HoldName = 'bellows' | 'water' | 'wrist'
export interface SwordBridge {
  game: () => Game; reheat: () => boolean
  command: (ad: Command) => void; hold: (ad: HoldName, v: boolean) => void
  selectRegion: (i: number) => void; selectTarget: (i: number) => void; rotate: (a: number) => void
  findRegion: (ray3: T.Ray) => number | null; regionPoint: (i: number, h: T.Vector3) => T.Vector3
  objPoint: (ad: 'eggShape' | 'bellows' | string, h: T.Vector3) => T.Vector3; targetPointAt: (i: number) => T.Vector3
  targetBox: (i: number) => Box; wristU: () => number; wristDrag: (u: number) => void; stoneZ: number
  cutOff: (k: { a: T.Vector3; b: T.Vector3; dx: number; dy: number; sure: number }) => void; addTrace: () => void; cutOngoing: () => boolean
  swordPos: (p: T.Vector3, q: T.Quaternion) => void
  /** Assembly: part world matrix, carrying in hand (null releases), its place on the sword, distance to it, and seating. */
  pieceMatrix: (ad: string) => T.Matrix4; movePiece: (ad: string, m: T.Matrix4 | null) => void
  piecePlace: (ad: string, h: T.Vector3) => T.Vector3; pieceDistance: (ad: string) => number; seatPiece: () => void
  floor: (visible: boolean) => void
  /** The scene restores camera, shadows, effects and size. */
  sessionStarted: () => void; sessionEnded: () => void
  stamp: (ad: string, value: string) => void
}

const RAY_LENGTH = 3, PANEL_FAR = 1.25, PANEL_BOTTOM = .12, DRAW_INTERVAL = .4
const NEAR = { eggShape: .25, bellows: .5, water: .35, piece: .22, region: .16, target: .6 }
// The middle of the grip (sword local x = -.11) sits in the palm; the blade extends in front of the controller.
const HILT = .11, BLADE_MID = .6 + HILT
const handBase = (left: boolean) => new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(
  new T.Vector3(0, 0, -1), new T.Vector3(0, left ? -1 : 1, 0), new T.Vector3(left ? -1 : 1, 0, 0)))
const HAND_RIGHT = handBase(false), HAND_LEFT = handBase(true)

interface El {
  controller: T.XRTargetRaySpace; grip: T.XRGripSpace; ray: T.Line; point: T.Mesh
  source: XRInputSource | null; held: HoldName | null; wristX: number | null
  hammer: HammerMeter; trigger: boolean; side: boolean; toRelease: boolean; offset: T.Matrix4; events: [string, (e: { data?: XRInputSource }) => void][]
}

export function setupXrSession(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera, k: SwordBridge) {
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  const rig = new T.Group()
  const panel = new T.Group(); rig.add(panel)
  const control = controlPanel(), info = infoPanel()
  const controlY = PANEL_METER * PANEL_Y / PANEL_G, infoY = PANEL_METER * INFO_Y / PANEL_G
  control.obj.position.y = -infoY / 2; control.obj.renderOrder = 1000
  info.obj.position.y = controlY / 2 + .006; info.obj.renderOrder = 1000
  panel.add(control.obj, info.obj)
  // Button under the ray: a separate transparent plane so the texture is not re-uploaded.
  const highlightMaterial = new T.MeshBasicMaterial({ color: '#d6b183', transparent: true, opacity: .28, depthTest: false, depthWrite: false, toneMapped: false, fog: false })
  const highlight = new T.Mesh(new T.PlaneGeometry(1, 1), highlightMaterial); highlight.renderOrder = 1001; highlight.visible = false; control.obj.add(highlight)

  const rayGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)])
  const rayMat = new T.LineBasicMaterial({ color: '#f6d6ad', transparent: true, opacity: .8, depthTest: false, depthWrite: false, toneMapped: false, fog: false })
  const pointGeo = new T.SphereGeometry(.008, 8, 6), pointMat = new T.MeshBasicMaterial({ color: '#fff2cf', depthTest: false, depthWrite: false, transparent: true, toneMapped: false, fog: false })
  const elGeo = new T.CylinderGeometry(.018, .024, .11, 10).rotateX(Math.PI / 2), elMat = new T.MeshStandardMaterial({ color: '#2a2f30', roughness: .7 })
  // Small light marking the next target; makes it easier to spot on the thin blade and small parts.
  const markerMat = new T.MeshBasicMaterial({ color: '#ffb35c', transparent: true, opacity: .9, depthTest: false, depthWrite: false, toneMapped: false, fog: false })
  const marker = new T.Mesh(new T.SphereGeometry(.022, 12, 8), markerMat); marker.renderOrder = 990; marker.visible = false; rig.add(marker)

  const raycaster = new T.Raycaster()
  let session: XRSession | null = null, starting = false, poseReady = false
  let note: number | null = null, awaitingSettle = true, panelYaw = 0, farDuration = 0, drawDuration = 0, drawKey = '', infoKey = '', active: El | null = null, stickTurn = 0
  const swingMotion = new SwingMeter()
  let pieceHand: El | null = null, pieceName = ''
  const pieceM = new T.Matrix4()
  const tmp = new T.Vector3(), tmp2 = new T.Vector3(), tmpQ = new T.Quaternion(), dir = new T.Vector3(), headQ = new T.Euler(0, 0, 0, 'YXZ')

  const vibrate = (el: El | null, power: number, ms: number) => {
    // hapticActuators[0].pulse on Quest; silently skipped if the browser lacks it.
    const g = el?.source?.gamepad as (Gamepad & { hapticActuators?: { pulse?: (g: number, ms: number) => Promise<boolean> }[] }) | undefined
    try { void g?.hapticActuators?.[0]?.pulse?.(power, ms)?.catch?.(() => {}) } catch { /* unsupported */ }
  }
  const swordHand = () => hands.find(e => e.source?.handedness === 'right') ?? hands.find(e => e.source)
  const inHand = () => k.game().stage === 7 && !k.game().master
  // With two controllers the sword hand does not select panels: no accidental button presses while swinging.
  const isSwordHand = (el: El) => inHand() && el === swordHand() && hands.filter(e => e.source).length > 1

  const headYaw = () => { headQ.setFromQuaternion(xr.getCamera().quaternion); return headQ.y }
  const placePanel = (offset = station(k.game()).panel) => {
    const head = xr.getCamera(), yaw = headYaw() + offset
    panel.position.set(head.position.x - Math.sin(yaw) * PANEL_FAR, head.position.y - PANEL_BOTTOM, head.position.z - Math.cos(yaw) * PANEL_FAR)
    panel.rotation.set(0, yaw, 0); panelYaw = yaw; farDuration = 0; buttonStamp()
  }
  const settle = () => {
    const head = xr.getCamera(), d = k.game(), r = stationRig(station(d), { x: head.position.x, y: head.position.y, z: head.position.z, yaw: headYaw() })
    rig.position.set(r.x, r.y, r.z); rig.rotation.set(0, r.rotY, 0)
    k.floor(d.stage === 6)
    hands.forEach(el => el.hammer.reset())
    placePanel(); awaitingSettle = false
  }
  // On desktop screen coordinates are exposed via data-*; the VR test also finds buttons here.
  const buttonStamp = () => {
    rig.updateWorldMatrix(true, true)
    k.stamp('xrButtons', JSON.stringify(control.squares().map(q => {
      const p = control.obj.localToWorld(frameLocal(q, tmp2))
      return { id: q.id, passive: !!q.button.passive, p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)] }
    })))
    k.stamp('xrRig', JSON.stringify([+rig.position.x.toFixed(3), +rig.position.y.toFixed(3), +rig.position.z.toFixed(3), +rig.rotation.y.toFixed(4)]))
  }
  const frameLocal = (q: Frame, h: T.Vector3) => h.set(((q.x + q.g / 2) / PANEL_G - .5) * PANEL_METER, (.5 - (q.y + q.y2) / 2 / PANEL_Y) * controlY, .001)

  const drawPanel = (force = false) => {
    const d = k.game(), p = panelState(d, { reheat: k.reheat(), not: note }), keyStr = JSON.stringify(p)
    if (force || keyStr !== drawKey) { drawKey = keyStr; control.draw(p); buttonStamp() }
    const b = infoState(d.stage, note)
    if (force || b.text !== infoKey) { infoKey = b.text; info.draw(b); k.stamp('xrInfo', `${b.title}|${b.source}|${b.honesty.length}`) }
  }

  const action = (id: string, el: El) => {
    if (id === 'exit') return finish()
    const [tour, value] = id.split(':')
    if (tour === 'command') { k.command(value as Command); if (value === 'fromStart') note = null; if (value === 'clink') vibrate(el, .4, 40) }
    else if (tour === 'hold') { el.held = value as HoldName; k.hold(el.held, true) }
    else if (tour === 'region') k.selectRegion(Number(value))
    else if (tour === 'target') k.selectTarget(Number(value))
    else if (tour === 'not') note = value === 'close' ? null : Number(value)
    drawPanel()
  }

  // Press outside the panel: the stage's scene action. Rules live in the scene's command/hold functions.
  const sceneAction = (el: El) => {
    const d = k.game(), ray3 = raycaster.ray
    if (d.master) return
    const near = (ad: string, limit: number) => ray3.distanceToPoint(k.objPoint(ad, tmp)) <= limit
    if (d.stage === 0) { if (near('eggShape', NEAR.eggShape)) k.command('al') }
    else if (d.stage === 1 || d.again) { if (near('bellows', NEAR.bellows)) { el.held = 'bellows'; k.hold('bellows', true) } }
    else if (d.stage === 2) {
      const b = k.findRegion(ray3)
      if (b !== null) { el.hammer.fireTrigger(); k.selectRegion(b); k.command('strike') }
    }
    else if (d.stage === 3) { if (near('water', NEAR.water)) { el.held = 'water'; k.hold('water', true) } }
    else if (d.stage === 4) { el.held = 'wrist'; el.wristX = planeX(ray3.origin, ray3.direction, k.stoneZ); k.hold('wrist', true) }
    else if (d.stage === 5) grabPiece(el)
    else if (d.stage === 7) {
      for (let i = 0; i < 3; i++) if (i !== d.target && ray3.distanceToPoint(k.targetPointAt(i)) <= NEAR.target) { k.selectTarget(i); break }
    }
  }

  // Assembly: the part is grabbed, carried to its place on the sword, and seats if close. Order and counting live in the scene's attach rule.
  const grabPiece = (el: El) => {
    const d = k.game()
    if (pieceHand || d.stage !== 5 || d.master || d.attached >= pieces.length) return
    const ad = pieces[d.attached]
    refresh(el); k.objPoint(ad, tmp)
    el.grip.updateWorldMatrix(true, false, true)
    const didTouch = el.grip.visible && el.grip.getWorldPosition(tmp2).distanceTo(tmp) <= PIECE_TOUCH
    if (!didTouch && raycaster.ray.distanceToPoint(tmp) > NEAR.piece) return
    pieceHand = el; pieceName = ad; active = el
    el.offset.copy(el.controller.matrixWorld).invert().multiply(k.pieceMatrix(ad))
    vibrate(el, .3, 30)
    trackPiece()
  }
  const trackPiece = () => {
    if (!pieceHand) return
    pieceHand.controller.updateWorldMatrix(true, false, true)
    k.movePiece(pieceName, pieceM.multiplyMatrices(pieceHand.controller.matrixWorld, pieceHand.offset))
  }
  const pieceCancel = () => { if (pieceHand) { pieceHand.toRelease = false; k.movePiece(pieceName, null); pieceHand = null } }
  const dropPiece = () => {
    const el = pieceHand
    if (!el) return
    const seated = pieceSnaps(k.pieceDistance(pieceName))
    pieceCancel()
    if (seated) { k.seatPiece(); k.game().message = 'Parça yerine oturdu.'; vibrate(el, .7, 60) }
    else k.game().message = 'Parça yerine yaklaşmadı. Yeniden dene.'
  }

  const refresh = (el: El) => {
    // The select event arrives outside the frame loop; matrixAutoUpdate is off, so rig changes do not apply unless forced.
    el.controller.updateWorldMatrix(true, false, true)
    raycaster.setFromXRController(el.controller)
  }
  const panelHit = () => {
    control.obj.updateWorldMatrix(true, false); info.obj.updateWorldMatrix(true, false)
    return raycaster.intersectObjects([control.obj, info.obj], false)[0]
  }
  const wasPressed = (el: El) => {
    if (!session || !poseReady) return
    active = el
    if (isSwordHand(el)) return
    refresh(el)
    const h = panelHit()
    if (!h) return sceneAction(el)
    if (h.object !== control.obj || !h.uv) return
    const q = control.frame(h.uv.x, h.uv.y)
    if (q && !q.button.passive) action(q.id, el)
  }
  const released = (el: El) => { if (el.held) k.hold(el.held, false); el.held = null; el.wristX = null }
  // Decided at frame start: a disconnecting controller also sends selectend first, which must not count as a seating attempt.
  const keyRelease = (el: El) => { if (!el.trigger && !el.side && el === pieceHand) el.toRelease = true }

  const hands: El[] = [0, 1].map(i => {
    const controller = xr.getController(i), grip = xr.getControllerGrip(i)
    const ray = new T.Line(rayGeo, rayMat); ray.renderOrder = 1002; ray.scale.z = RAY_LENGTH; controller.add(ray)
    const point = new T.Mesh(pointGeo, pointMat); point.renderOrder = 1003; point.visible = false; controller.add(point)
    grip.add(new T.Mesh(elGeo, elMat))
    rig.add(controller, grip)
    const el: El = { controller, grip, ray, point, source: null, held: null, wristX: null, hammer: new HammerMeter(), trigger: false, side: false, toRelease: false, offset: new T.Matrix4(), events: [] }
    const events: [string, (e: { data?: XRInputSource }) => void][] = [
      ['selectstart', () => { el.trigger = true; el.toRelease = false; if (el !== pieceHand) wasPressed(el) }], ['selectend', () => { el.trigger = false; released(el); keyRelease(el) }],
      ['squeezestart', () => { el.side = true; el.toRelease = false; if (session && poseReady) grabPiece(el) }], ['squeezeend', () => { el.side = false; keyRelease(el) }],
      ['connected', e => { el.hammer.reset(); el.source = e.data ?? null }], ['disconnected', () => { if (el === pieceHand) pieceCancel(); el.trigger = el.side = false; released(el); el.hammer.reset(); el.source = null }],
    ]
    for (const [ad, f] of events) controller.addEventListener(ad as never, f as never)
    el.events = events
    return el
  })

  const enter = (fresh: XRSession) => {
    session = fresh
    rig.add(camera); scene.add(rig)
    camera.near = .05; camera.far = 70
    awaitingSettle = true
    k.sessionStarted()
  }
  const undo = () => {
    camera.removeFromParent(); camera.scale.set(1, 1, 1)
    rig.removeFromParent()
    pieceCancel()
    hands.forEach(el => { released(el); el.source = null; el.hammer.reset(); el.trigger = el.side = false })
    k.floor(false)
    session = null; poseReady = false; note = null; active = null; drawKey = infoKey = ''
    swingMotion.reset(); marker.visible = false; highlight.visible = false
  }
  const onSessionEnd = () => {
    if (!session) return // Closing a half-finished start: the scene was not touched
    undo()
    k.sessionEnded()
  }
  xr.addEventListener('sessionend', onSessionEnd)

  const finish = () => { session?.end().catch(() => {}) } // end() rejects on an already closed session

  /** When the ray is over the panel it is shortened and the button under it is highlighted. */
  const rayFrame = () => {
    let highlighted: Frame | null = null
    for (const el of hands) {
      const var_ = !!el.source && !isSwordHand(el) && el !== pieceHand
      el.ray.visible = var_
      if (!var_) { el.point.visible = false; continue }
      refresh(el)
      const h = panelHit()
      el.ray.scale.z = h ? h.distance : RAY_LENGTH
      el.point.visible = !!h
      if (h) {
        el.point.position.set(0, 0, -h.distance)
        if (h.object === control.obj && h.uv) { const q = control.frame(h.uv.x, h.uv.y); if (q && !q.button.passive) highlighted = q }
      }
    }
    highlight.visible = !!highlighted
    if (highlighted) { const q: Frame = highlighted; frameLocal(q, highlight.position); highlight.scale.set(q.g / PANEL_G * PANEL_METER, (q.y2 - q.y) / PANEL_Y * controlY, 1) }
  }

  /** Marks the stage's main object; grows when the ray is near it. While forging it also remembers the region under it. */
  const markerFrame = () => {
    const d = k.game()
    let var_ = !d.master, limit = 0
    if (d.stage === 0) { k.objPoint('eggShape', tmp); limit = NEAR.eggShape }
    else if (d.stage === 1 || d.again) { k.objPoint('bellows', tmp); limit = NEAR.bellows }
    else if (d.stage === 3) { k.objPoint('water', tmp); limit = NEAR.water }
    else if (d.stage === 5 && pieceHand) k.piecePlace(pieceName, tmp) // While carrying, the marker shows the place on the sword.
    else if (d.stage === 5 && d.attached < 7) { k.objPoint(pieces[d.attached], tmp); limit = NEAR.piece }
    else if (d.stage === 7) tmp.copy(k.targetPointAt(d.target))
    else if (d.stage === 2) {
      let b: number | null = null
      for (const el of hands) if (el.source) { refresh(el); b = k.findRegion(raycaster.ray) ?? b }
      k.regionPoint(b ?? d.selected, tmp)
      marker.scale.setScalar(b !== null ? 1.2 : .7)
    } else var_ = false
    marker.visible = var_
    if (!var_) return
    if (d.stage !== 2) {
      let near = false
      for (const el of hands) if (el.source && limit > 0) { refresh(el); if (raycaster.ray.distanceToPoint(tmp) <= limit) near = true }
      marker.scale.setScalar(near ? 1.6 : 1)
    }
    rig.updateWorldMatrix(true, false)
    marker.position.copy(rig.worldToLocal(tmp2.copy(tmp)))
    if (drawDuration === 0) k.stamp('xrMarker', JSON.stringify([+tmp.x.toFixed(3), +tmp.y.toFixed(3), +tmp.z.toFixed(3)]))
  }

  return {
    start: async () => {
      if (session || starting) return
      if (!navigator.xr) throw new Error('WebXR not available in this browser')
      starting = true
      const ratio = renderer.getPixelRatio(), size = renderer.getSize(new T.Vector2())
      let fresh: XRSession | null = null
      try {
        fresh = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
        await xr.setSession(fresh)
        if (xr.getSession() !== fresh) throw new Error('VR session closed while opening')
      } catch (error) {
        // If setSession failed midway the renderer size may be broken; it is restored on close.
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
    /** Called before render, before the game state is processed. */
    frame: (dt: number) => {
      if (!session) return
      if (!poseReady) {
        const fr = xr.getFrame(), space = xr.getReferenceSpace()
        if (!fr || !space || !fr.getViewerPose(space)) return
        poseReady = true
        drawPanel(true)
      }
      if (awaitingSettle) settle()
      const d = k.game()

      // If the master, the panel or a restart changed the next part, the grip is dropped.
      if (pieceHand && (d.stage !== 5 || d.master || pieces[d.attached] !== pieceName)) pieceCancel()
      if (pieceHand?.toRelease) dropPiece()
      trackPiece()

      const u = panelShouldReturn(headYaw(), panelYaw, farDuration, dt)
      farDuration = u.sure
      if (u.shouldCome) placePanel()

      drawDuration += dt
      if (drawDuration >= DRAW_INTERVAL) { drawDuration = 0; drawPanel() }

      rayFrame()
      markerFrame()

      if (d.stage === 6) {
        const g = deadZone(controllerInput(session.inputSources).rightX)
        if (g) { k.rotate(g * dt * 1.4); stickTurn += g * dt * 1.4; k.stamp('xrTurn', stickTurn.toFixed(3)) }
      }

      // Grinding: while the trigger is held, the ray's motion along the blade moves the contact point.
      for (const el of hands) if (el.held === 'wrist') {
        refresh(el)
        const x = planeX(raycaster.ray.origin, raycaster.ray.direction, k.stoneZ)
        if (x !== null && el.wristX !== null) k.wristDrag(wristStep(k.wristU(), x - el.wristX))
        el.wristX = x
      }

      // Forging: only the tracked hand's own recent blade target is struck.
      for (const el of hands) {
        if (d.stage !== 2 || d.again || d.master || !el.source || !el.grip.visible || !el.controller.visible) {
          el.hammer.reset(); continue
        }
        refresh(el)
        if (panelHit()) { el.hammer.reset(); continue }
        const region = k.findRegion(raycaster.ray)
        el.grip.updateWorldMatrix(true, false, true); el.grip.getWorldPosition(tmp)
        const struck = el.hammer.step(tmp.y, dt, region)
        if (struck !== null) { active = el; k.selectRegion(struck); k.command('strike') }
      }

      // Test: sword in hand; the path of the swung blade point becomes the cut line.
      if (inHand() && !k.cutOngoing() && !d.broke) {
        const el = swordHand()
        if (el) {
          el.grip.updateWorldMatrix(true, false, true)
          el.grip.getWorldQuaternion(tmpQ)
          dir.set(0, 0, -1).applyQuaternion(tmpQ)
          el.grip.getWorldPosition(tmp2)
          const s = swingMotion.step(tmp.copy(tmp2).addScaledVector(dir, BLADE_MID), dt)
          if (swingMotion.ongoing) k.addTrace()
          if (s) {
            const c = swingCut(s, k.targetBox(d.target))
            active = el; vibrate(el, Math.min(1, .4 + Math.hypot(c.dx, c.dy) / c.sure * .3), 80)
            k.cutOff({ a: new T.Vector3(c.a.x, c.a.y, c.a.z), b: new T.Vector3(c.b.x, c.b.y, c.b.z), dx: c.dx, dy: c.dy, sure: c.sure })
          }
        }
      } else swingMotion.reset()
    },
    /** Seats the sword in the palm; not called while the cut-button animation runs. */
    placeSword: () => {
      const el = swordHand()
      if (!el || !el.grip.visible || !inHand()) return false
      el.grip.updateWorldMatrix(true, false, true)
      el.grip.getWorldQuaternion(tmpQ)
      el.grip.getWorldPosition(tmp)
      tmp2.set(0, 0, -HILT).applyQuaternion(tmpQ).add(tmp)
      tmpQ.multiply(el.source?.handedness === 'left' ? HAND_LEFT : HAND_RIGHT)
      k.swordPos(tmp2, tmpQ)
      return true
    },
    stageChanged: () => {
      note = null; awaitingSettle = true; swingMotion.reset()
      hands.forEach(el => { el.hammer.reset(); el.held = null; el.wristX = null }) // The scene already released held actions.
      if (poseReady) drawPanel()
    },
    targetChanged: () => { awaitingSettle = true; swingMotion.reset() },
    vibrate: (power: number, ms: number) => vibrate(active, power, ms),
    finish,
    clear: () => {
      xr.removeEventListener('sessionend', onSessionEnd)
      const open = session
      // The scene is closing too: sessionEnded is not called and a later sessionend is not listened to.
      if (open) { undo(); open.end().catch(() => {}) }
      for (const el of hands) {
        for (const [ad, f] of el.events) el.controller.removeEventListener(ad as never, f as never)
        el.controller.removeFromParent(); el.grip.removeFromParent()
      }
      control.dispose(); info.dispose(); highlight.geometry.dispose(); highlightMaterial.dispose()
      rayGeo.dispose(); rayMat.dispose(); pointGeo.dispose(); pointMat.dispose(); elGeo.dispose(); elMat.dispose()
      marker.geometry.dispose(); markerMat.dispose()
    },
  }
}
