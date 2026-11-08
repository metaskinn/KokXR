import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { XR_TABLE_RADIUS, screenThreshold, vaseStage_, setupVaseXr, snapsIn } from './vaseXr'
import type { VaseMobileControl, VaseXrStartOption } from './vaseXr'

export const pieceNames = ['Alt gövde · sağ', 'Alt gövde · arka', 'Alt gövde · sol', 'Üst gövde · sağ', 'Üst gövde · arka', 'Üst gövde · sol']
export interface VaseState { repair: boolean; broke: boolean; session: number; placed: number[]; selected: number | null }
export interface VaseScene {
  update: (state: VaseState) => void
  rotate: (horizontal: number, vertical: number) => void
  zoomIn: (ratio: number) => void
  dragPiece: (x: number, y: number) => void
  releasePiece: () => void
  cancel: () => void
  reset: () => void
  /** Frames the vase inside the stage part that the HUD does not cover (CSS pixels from each edge). */
  setSafeInsets: (insets: { top: number; right: number; bottom: number; left: number }) => void
  /** Called inside a user gesture: no await before requestSession. */
  startXr: (mode?: 'vr' | 'ar', option?: VaseXrStartOption) => Promise<void>
  endXr: () => void
  /** Phone AR (dom-overlay) buttons and touch; does nothing outside a phone AR session. */
  mobileAr: VaseMobileControl
  clear: () => void
}
interface Notices { select: (id: number | null) => void; release: (id: number, seated: boolean) => void; error: () => void; xrEnded: () => void; xrShatter: () => void }

export async function createVaseScene(area: HTMLElement, notify: Notices): Promise<VaseScene> {
  // Six physical ceramic pieces exported from the .blend source; no external model/texture.
  const gltf = await new GLTFLoader().loadAsync('/models/vase.glb')
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  function collectSources(root: THREE.Object3D) {
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      geometries.add(o.geometry)
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m)
    })
  }
  collectSources(gltf.scene)
  const releaseSources = () => { geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()) }
  const pieces: THREE.Object3D[] = []
  let intact: THREE.Object3D | undefined
  let repairTraces: THREE.Object3D | undefined
  gltf.scene.updateMatrixWorld(true)
  gltf.scene.traverse((o) => {
    if (Number.isInteger(o.userData.pieceId)) pieces[o.userData.pieceId] = o
    if (o.userData.intact) intact = o
    if (o.userData.repairMarks) repairTraces = o
  })
  if (!intact || !repairTraces || pieces.length !== 6 || Array.from({ length: 6 }, (_, id) => pieces[id]).some((p) => !p)) {
    releaseSources()
    throw new Error('Vase intact body, broken pieces or repair traces not found.')
  }
  const intactView = intact
  const assemblyTraces = repairTraces
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true }) }
  catch (error) { releaseSources(); throw error }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.domElement.setAttribute('aria-hidden', 'true')
  area.append(renderer.domElement)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1b1f23')
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false
  controls.enableDamping = true
  controls.minDistance = 70
  controls.maxDistance = 240
  controls.maxPolarAngle = Math.PI * .8
  let state: VaseState = { repair: false, broke: false, session: 0, placed: [], selected: null }
  const reset = () => {
    camera.position.set(state.repair ? 0 : 63, state.repair ? 31 : 53, state.repair ? 156 : 108)
    controls.target.set(0, 23, 0)
    const damping = controls.enableDamping
    controls.enableDamping = false; controls.update(); controls.enableDamping = damping
  }
  reset()
  scene.add(new THREE.HemisphereLight('#fff8e9', '#627466', 2.6))
  const key = new THREE.DirectionalLight('#fff1db', 3.2)
  key.position.set(-40, 75, 70); scene.add(key)
  const fill = new THREE.DirectionalLight('#d1e7e0', 1.4)
  fill.position.set(50, 40, -55); scene.add(fill)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(66, 67, 1.5, 64), new THREE.MeshStandardMaterial({ color: '#35483c', roughness: .95 }))
  base.position.y = -2; scene.add(base)
  const targets = pieces.map((p) => ({ position: p.getWorldPosition(new THREE.Vector3()), quaternion: p.getWorldQuaternion(new THREE.Quaternion()), scale: p.getWorldScale(new THREE.Vector3()) }))
  pieces.forEach((p, id) => {
    p.removeFromParent()
    p.position.copy(targets[id].position); p.quaternion.copy(targets[id].quaternion); p.scale.copy(targets[id].scale)
    p.traverse((o) => {
      o.userData.pieceId = id
      if (!(o instanceof THREE.Mesh)) return
      // glTF materials may be shared between pieces; the selected piece must not tint the others.
      o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone()
    })
    scene.add(p)
  })
  scene.attach(intact)
  scene.attach(repairTraces)
  // Shows the overall form; does not change with the selected piece or mark its place.
  const silhouette = intact.clone(true)
  silhouette.name = 'Vase_General_Silhouette'
  silhouette.traverse((o) => {
    if (o instanceof THREE.Mesh) o.material = new THREE.MeshBasicMaterial({ color: '#ded4b9', transparent: true, opacity: .065, depthWrite: false, side: THREE.DoubleSide })
  })
  scene.add(silhouette)
  const desktopShelves = pieces.map((_, id) => new THREE.Vector3(id < 3 ? -43 : 43, 9 + (id % 3) * 19, 14))
  let shelves = desktopShelves
  const labels = pieces.map((_, id) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'vase-handle'
    button.dataset.pieceId = String(id)
    button.setAttribute('aria-label', `Parça ${id + 1}: tut ve sürükle`)
    button.innerHTML = `<span>${id + 1}</span>`
    button.addEventListener('click', () => { if (!state.placed.includes(id) && !renderer.xr.isPresenting) notify.select(id) })
    area.append(button)
    return button
  })
  const ray3 = new THREE.Raycaster(), plane = new THREE.Plane(), point = new THREE.Vector3()
  const moves = new Map<number, THREE.Vector3>()
  let drag: { id: number; pointer: number; offset: THREE.Vector3; x: number; y: number; moved: boolean } | null = null
  let closed = false
  let xrHighlight: number[] = []
  // Seating was reported but not yet reflected in game state: the VR controller must not grab again meanwhile.
  const seatedOnes = new Set<number>()
  const smallMove = matchMedia('(prefers-reduced-motion: reduce)').matches

  function screen(v: THREE.Vector3) {
    const p = v.clone().project(camera)
    return new THREE.Vector2((p.x + 1) * area.clientWidth / 2, (1 - p.y) * area.clientHeight / 2)
  }
  function isNear(id: number) {
    const a = screen(pieces[id].position), b = screen(targets[id].position)
    return snapsIn(a.distanceTo(b), screenThreshold(area.clientWidth))
  }
  function updateColors() {
    pieces.forEach((p, id) => {
      const selected = state.selected === id && state.repair && !state.placed.includes(id)
      p.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
          if (material instanceof THREE.MeshStandardMaterial) material.emissive.set(selected || xrHighlight.includes(id) ? '#352510' : '#000000')
        }
      })
      labels[id].hidden = !state.repair || state.placed.includes(id)
      labels[id].setAttribute('aria-pressed', String(selected))
    })
  }
  function releaseCapture() {
    const previous = drag
    drag = null
    controls.enabled = true
    area.classList.remove('piece-dragging')
    if (previous && area.hasPointerCapture(previous.pointer)) area.releasePointerCapture(previous.pointer)
  }
  function cancel() {
    const id = drag?.id ?? state.selected
    releaseCapture()
    if (id !== null && !state.placed.includes(id)) moves.set(id, shelves[id].clone())
    notify.select(null)
  }
  const update = (fresh: VaseState) => {
    const fromStart = fresh.session !== state.session || fresh.repair !== state.repair
    if (fromStart) {
      releaseCapture()
      // A vase left in hand or on the holder must not disturb the positions below.
      if (renderer.xr.isPresenting) xr.reset()
      moves.clear(); seatedOnes.clear()
    }
    const previous = state
    state = fresh
    const tracelessView = !fresh.broke && !fresh.repair
    intactView.visible = tracelessView
    assemblyTraces.visible = fresh.broke && fresh.placed.length === 6
    silhouette.visible = fresh.repair && fresh.placed.length < 6
    if (fromStart && !renderer.xr.isPresenting) { resize(); reset() }
    pieces.forEach((p, id) => {
      p.visible = !tracelessView
      const onGround = !fresh.repair || fresh.placed.includes(id)
      if (fromStart) {
        p.position.copy(onGround ? targets[id].position : shelves[id])
        p.quaternion.copy(targets[id].quaternion)
      } else if (onGround && !previous.placed.includes(id)) moves.set(id, targets[id].position.clone())
    })
    updateColors()
  }
  function ray(clientX: number, clientY: number) {
    const rect = renderer.domElement.getBoundingClientRect()
    ray3.setFromCamera(new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1), camera)
  }
  function release(id: number, seated = isNear(id)) {
    if (state.placed.includes(id)) return
    if (seated) seatedOnes.add(id)
    moves.set(id, (seated ? targets[id].position : shelves[id]).clone())
    notify.release(id, seated)
  }
  const pointerDown = (e: PointerEvent) => {
    if (!state.repair || e.button !== 0 || renderer.xr.isPresenting) return
    if (drag) { e.stopPropagation(); return }
    const label = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]')
    ray(e.clientX, e.clientY)
    const hit = ray3.intersectObjects(pieces.filter((_, id) => !state.placed.includes(id)), true)[0]
    const id: number | undefined = label ? Number(label.dataset.pieceId) : hit?.object.userData.pieceId
    if (id === undefined || state.placed.includes(id)) return
    e.stopPropagation(); e.preventDefault()
    // Keep OrbitControls from using the same grab to rotate the camera.
    controls.enableDamping = false; controls.update(); controls.enableDamping = true
    controls.enabled = false
    // Keep the grab depth: in perspective the piece must not drift away from the mouse.
    // Missing depth is aligned automatically when dropped in the right place.
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), pieces[id].position)
    ray(e.clientX, e.clientY)
    if (!ray3.ray.intersectPlane(plane, point)) { controls.enabled = true; return }
    moves.delete(id)
    drag = { id, pointer: e.pointerId, offset: point.clone().sub(pieces[id].position), x: e.clientX, y: e.clientY, moved: false }
    area.focus({ preventScroll: true })
    area.setPointerCapture(e.pointerId)
    area.classList.add('piece-dragging')
    notify.select(id)
  }
  const pointerMove = (e: PointerEvent) => {
    if (!drag || drag.pointer !== e.pointerId) return
    e.stopPropagation(); e.preventDefault()
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.moved = true
    ray(e.clientX, e.clientY)
    if (ray3.ray.intersectPlane(plane, point)) pieces[drag.id].position.copy(point).sub(drag.offset)
  }
  const pointerUp = (e: PointerEvent) => {
    if (!drag || drag.pointer !== e.pointerId) return
    e.stopPropagation(); e.preventDefault()
    const { id, moved } = drag
    releaseCapture()
    if (moved) release(id)
  }
  const pointerCancel = (e: PointerEvent) => { if (drag?.pointer === e.pointerId) cancel() }
  const contextLost = (e: Event) => { e.preventDefault(); cancel(); xr.finish(); notify.error() }
  area.addEventListener('pointerdown', pointerDown, true)
  area.addEventListener('pointermove', pointerMove, true)
  area.addEventListener('pointerup', pointerUp, true)
  area.addEventListener('pointercancel', pointerCancel, true)
  area.addEventListener('lostpointercapture', pointerCancel, true)
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  let safe = { top: 0, right: 0, bottom: 0, left: 0 }
  const resize = () => {
    if (renderer.xr.isPresenting) return
    const w = area.clientWidth, h = Math.max(area.clientHeight, 1)
    renderer.setSize(w, h, false)
    // The camera frames the safe rectangle; the canvas shows the rest around it (under the HUD).
    const sw = Math.max(1, w - safe.left - safe.right), sh = Math.max(1, h - safe.top - safe.bottom)
    camera.aspect = sw / sh
    camera.fov = camera.aspect < 1 ? 62 : 42
    // During repair the pieces wait on both sides: keep at least 56° horizontally so the shelves stay inside the safe rectangle.
    if (state.repair) camera.fov = Math.min(75, Math.max(camera.fov, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(28)) / camera.aspect))))
    area.dataset.fov = camera.fov.toFixed(3)
    if (safe.top || safe.right || safe.bottom || safe.left) camera.setViewOffset(sw, sh, -safe.left, -safe.top, w, h)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(area); resize(); update(state)
  const xr = setupVaseXr({
    renderer, scene, camera, pieces, targets,
    wholeObjects: [intactView, assemblyTraces],
    isFree: (id) => state.repair && !state.placed.includes(id) && !seatedOnes.has(id),
    isInspecting: () => (!state.repair || state.placed.length === pieces.length) && moves.size === 0,
    phase: () => vaseStage_(state.repair, state.placed.length),
    placedCount: () => state.placed.length,
    shatterRequest: notify.xrShatter,
    gripStarted: (id) => { moves.delete(id) },
    release,
    gripCancel: (id) => { moves.set(id, shelves[id].clone()) },
    select: notify.select,
    emphasize: (ids) => {
      if (ids.length === xrHighlight.length && ids.every((id, i) => id === xrHighlight[i])) return
      xrHighlight = ids
      updateColors()
    },
    xrMode: (open, newShelves) => {
      if (open) cancel()
      controls.enabled = !open
      shelves = open && newShelves ? newShelves.map((p) => new THREE.Vector3(...p)) : desktopShelves
      const turntable = open ? XR_TABLE_RADIUS / 66 : 1
      base.scale.set(turntable, 1, turntable)
      moves.clear()
      pieces.forEach((p, id) => {
        const onGround = state.placed.includes(id) || seatedOnes.has(id) || !state.repair
        p.position.copy(onGround ? targets[id].position : shelves[id])
        p.quaternion.copy(targets[id].quaternion)
      })
    },
    sessionEnded: () => {
      resize()
      reset()
      notify.xrEnded()
    },
  })
  renderer.setAnimationLoop(() => {
    if (closed) return
    for (const [id, target] of moves) {
      const piece = pieces[id]
      piece.position.lerp(target, smallMove ? 1 : .2)
      // On desktop pieces do not rotate; in VR they may have been rotated in hand.
      if (!piece.quaternion.equals(targets[id].quaternion)) piece.quaternion.slerp(targets[id].quaternion, smallMove ? 1 : .2)
      if (piece.position.distanceTo(target) < .05) { piece.position.copy(target); piece.quaternion.copy(targets[id].quaternion); moves.delete(id) }
    }
    if (renderer.xr.isPresenting) {
      xr.frame()
      renderer.render(scene, camera)
      return
    }
    if (!drag) controls.update()
    scene.updateMatrixWorld(true)
    labels.forEach((button, id) => {
      if (button.hidden) return
      const p = screen(pieces[id].position)
      button.style.left = `${p.x}px`; button.style.top = `${p.y}px`
    })
    renderer.render(scene, camera)
  })
  collectSources(scene)
  return {
    update, reset, cancel,
    setSafeInsets: (insets) => { safe = { ...insets }; area.dataset.safe = `${insets.top},${insets.right},${insets.bottom},${insets.left}`; resize() },
    startXr: (mode, option) => xr.start(mode, option),
    mobileAr: xr.mobile,
    endXr: () => xr.finish(),
    dragPiece: (x, y) => {
      const id = state.selected
      if (id === null || state.placed.includes(id) || drag) return
      moves.delete(id)
      const p = pieces[id].position.clone().project(camera)
      p.x += x * 2 / area.clientWidth; p.y -= y * 2 / area.clientHeight
      pieces[id].position.copy(p.unproject(camera))
    },
    releasePiece: () => { if (state.selected !== null && !drag) release(state.selected) },
    rotate: (horizontal, vertical) => {
      if (drag) return
      const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
      s.theta += horizontal; s.phi = THREE.MathUtils.clamp(s.phi + vertical, .1, controls.maxPolarAngle)
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s)); controls.update()
    },
    zoomIn: (ratio) => {
      if (drag) return
      const v = camera.position.clone().sub(controls.target)
      v.setLength(THREE.MathUtils.clamp(v.length() * ratio, controls.minDistance, controls.maxDistance))
      camera.position.copy(controls.target).add(v); controls.update()
    },
    clear: () => {
      xr.clear()
      closed = true; releaseCapture(); renderer.setAnimationLoop(null)
      observer.disconnect(); controls.dispose()
      area.removeEventListener('pointerdown', pointerDown, true)
      area.removeEventListener('pointermove', pointerMove, true)
      area.removeEventListener('pointerup', pointerUp, true)
      area.removeEventListener('pointercancel', pointerCancel, true)
      area.removeEventListener('lostpointercapture', pointerCancel, true)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      releaseSources(); renderer.dispose(); renderer.domElement.remove()
      labels.forEach((b) => b.remove())
    },
  }
}
