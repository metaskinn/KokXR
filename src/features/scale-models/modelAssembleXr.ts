// VR'da maket birleştirme: kavrama tuşuyla katmanı tut, yerine götür, oturt. Rig ve menü xrOturum'undur; burası yalnız katmanları taşır.
import * as THREE from 'three'
import { releaseResult, assemblyText, selectLayer, shelfLayout, carriedPlace, type ReleaseResult, type LayerCandidate, type Box, type Pointed } from './modelAssembleLogic'
import type { ModelLayer } from './uluMosqueModel'
import { titlePanel, assemblyPanel } from '../../shared/xr/xrPanel'

export interface AssemblyContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  layers: ModelLayer[]
  controllers: { controller: THREE.XRTargetRaySpace; ray: THREE.Line }[]
  refreshShadow: () => void
  /** Son katman da oturdu; katmanlar evindedir, menü normale dönebilir. */
  completed: () => void
}

export interface ModelAssembly {
  /** Katmanları rafa dizer; oyun açıksa baştan başlatır. */
  begin: () => void
  /** Katmanlar eve döner, panel kalkar. Oyun kapalıysa katmanlara dokunmaz. */
  finish: () => void
  /** Katmanlar oyunun elinde mi: sahnenin parçalama döngüsü ve rig çubuğu dokunmasın. */
  inGame: () => boolean
  frame: (dt: number) => void
  clear: () => void
}

interface El {
  controller: THREE.XRTargetRaySpace
  ray: THREE.Line
  held: number | null
  /** Tuş bırakıldı, karar kare başında: kopan kumanda da önce tek başına squeezeend yollar, sonra `disconnected`. */
  toRelease: boolean
  handStart: Pointed
  pieceStart: Pointed
  listeners: [string, () => void][]
}

const NAME_SCALE = 30, NAME_HALF = 18 // Rig içi metre panel; sahne biriminde 36 genişlik
const NAME_COLOR = '#c9d4cf', NAME_LIGHT = '#ffffff', NAME_GROWTH = 1.12
const BOX_COLOR: Record<ReleaseResult, string> = { far: '#f0e1bc', row: '#e0683c', seated: '#5fd08a' }
const SEAT_SPEED = 12, STOP_THRESHOLD = 0.05
const DONE_DURATION = 4 // sn; tamamlandı mesajı kendiliğinden kalkar

export function setupModelAssembly(b: AssemblyContext): ModelAssembly {
  const { scene, camera, layers } = b
  const names = layers.map((k) => k.ad)
  const raycaster = new THREE.Raycaster()
  const place = new THREE.Vector3()

  const panel = assemblyPanel()
  panel.obj.material.transparent = true
  panel.obj.material.depthTest = false
  panel.obj.material.depthWrite = false
  panel.obj.renderOrder = 1003
  panel.obj.frustumCulled = false
  panel.obj.position.set(0, -0.295, -1.2)

  const namePanels = names.map((ad) => titlePanel(ad))

  // Tutulan katmanın evini gösterir: renk, bırakılsa ne olacağını söyler.
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const targetGeometry = new THREE.EdgesGeometry(boxGeometry)
  boxGeometry.dispose()
  const targetMaterial = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
  const targetBox = new THREE.LineSegments(targetGeometry, targetMaterial)
  targetBox.renderOrder = 999
  targetBox.visible = false

  let game = false, ending = false
  let seatedOne = 0, doneRemaining = 0
  let boxes: Box[] = [], centers: Pointed[] = [], radii: number[] = [], shelves: Pointed[] = []
  /** Eline değil, kendi yerine süzülen katmanlar. */
  const floating = new Map<number, THREE.Vector3>()

  const measure = () => {
    if (boxes.length) return
    const box = new THREE.Box3()
    boxes = layers.map(({ group }) => {
      // Parçalanmış bırakılmış olabilir: ev ölçüsü konumdan bağımsız.
      box.setFromObject(group).translate(place.copy(group.position).negate())
      return { min: box.min.toArray(), max: box.max.toArray() }
    })
    centers = boxes.map(({ min, max }) => [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2])
    radii = boxes.map(({ min, max }) => Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2)
    shelves = shelfLayout(boxes)
    namePanels.forEach(({ obj }, id) => {
      // Rafta kullanıcıya bakan kenarın makete yakın ucunda, görüşe en yakın yerde. Rig başlangıç açısında kullanıcı -z yönündedir.
      obj.position.set(boxes[id].max[0] - NAME_HALF, centers[id][1], boxes[id].min[2] - 2)
      obj.rotation.y = Math.PI
      obj.scale.setScalar(NAME_SCALE)
    })
  }

  const handPlace = (el: El): Pointed => {
    el.controller.updateWorldMatrix(true, false, true) // matrixAutoUpdate kapalı; zorlanmazsa rig değişimi yansımaz
    return place.setFromMatrixPosition(el.controller.matrixWorld).toArray()
  }
  const isHeld = (id: number) => hands.some((e) => e.held === id)
  const candidates = (): LayerCandidate[] => {
    const list: LayerCandidate[] = []
    layers.forEach(({ group }, id) => {
      if (id < seatedOne || isHeld(id)) return // Oturanlar artık tutulmaz
      const p = group.position, m = centers[id]
      list.push({ id, center: [m[0] + p.x, m[1] + p.y, m[2] + p.z], radius: radii[id] })
    })
    return list
  }
  const handCandidate = (el: El) => {
    el.controller.updateWorldMatrix(true, false, true)
    raycaster.setFromXRController(el.controller)
    return selectLayer(raycaster.ray.origin.toArray(), raycaster.ray.direction.toArray(), candidates())
  }

  const draw = (last?: { result: ReleaseResult; id: number }) => panel.draw(assemblyText(seatedOne, names, last))

  const releaseHand = (el: El) => {
    el.held = null
    el.toRelease = false
    el.ray.visible = true
    if (hands.every((e) => e.held === null)) targetBox.visible = false
  }
  const toShelf = (id: number) => floating.set(id, new THREE.Vector3(...shelves[id]))

  const head = (el: El) => {
    if (!game || ending) return
    el.toRelease = false
    if (el.held !== null) return
    const id = handCandidate(el)
    if (id === null) return
    floating.delete(id)
    el.held = id
    el.ray.visible = false
    el.handStart = handPlace(el)
    el.pieceStart = layers[id].group.position.toArray()
    const { min, max } = boxes[id]
    targetBox.position.set(centers[id][0], centers[id][1], centers[id][2])
    targetBox.scale.set(max[0] - min[0], max[1] - min[1], max[2] - min[2])
    targetBox.userData.id = id
    targetBox.visible = true
  }
  const lift = (el: El) => {
    if (el.held !== null) el.toRelease = true
  }
  const release = (el: El) => {
    const id = el.held
    if (id === null) return
    releaseHand(el)
    const result = releaseResult(id, seatedOne, layers[id].group.position.length())
    if (result === 'seated') {
      seatedOne++
      floating.set(id, new THREE.Vector3())
      namePanels[id].obj.visible = false
      if (seatedOne >= layers.length) ending = true
    } else {
      toShelf(id)
    }
    draw({ result, id })
  }
  /** Oyun denemesi saymadan rafa döndürür: kumanda koptu. */
  const breakGrip = (el: El) => {
    const id = el.held
    releaseHand(el)
    if (id !== null) toShelf(id)
  }

  const hands: El[] = b.controllers.map(({ controller, ray }) => {
    const el: El = { controller, ray, held: null, toRelease: false, handStart: [0, 0, 0], pieceStart: [0, 0, 0], listeners: [] }
    el.listeners = [['squeezestart', () => head(el)], ['squeezeend', () => lift(el)], ['disconnected', () => breakGrip(el)]]
    for (const [event, f] of el.listeners) controller.addEventListener(event as 'squeezestart', f)
    return el
  })

  const removeNames = () => namePanels.forEach(({ obj }) => obj.removeFromParent())
  const closeGame = () => {
    game = false
    ending = false
    floating.clear()
    for (const el of hands) releaseHand(el)
    targetBox.removeFromParent()
    removeNames()
    b.refreshShadow()
  }

  const finish = () => {
    doneRemaining = 0
    panel.obj.removeFromParent()
    if (!game) return
    closeGame()
    layers.forEach(({ group }) => group.position.set(0, 0, 0))
  }

  return {
    begin: () => {
      measure()
      doneRemaining = 0
      game = true
      ending = false
      seatedOne = 0
      floating.clear()
      for (const el of hands) releaseHand(el)
      layers.forEach(({ group }, id) => {
        group.position.set(...shelves[id])
        namePanels[id].obj.visible = true
        namePanels[id].obj.material.color.set(NAME_COLOR)
        group.add(namePanels[id].obj)
      })
      scene.add(targetBox)
      camera.add(panel.obj)
      draw()
      b.refreshShadow()
    },
    finish,
    inGame: () => game,
    frame: (dt) => {
      if (doneRemaining > 0) {
        doneRemaining -= dt
        if (doneRemaining <= 0) panel.obj.removeFromParent()
      }
      if (!game) return
      for (const el of hands) if (el.toRelease) release(el)

      const aimPoint = new Set<number>()
      for (const el of hands) {
        if (el.held !== null) {
          const y = carriedPlace(el.pieceStart, el.handStart, handPlace(el))
          layers[el.held].group.position.set(...y)
          if (targetBox.userData.id === el.held) targetMaterial.color.set(BOX_COLOR[releaseResult(el.held, seatedOne, Math.hypot(...y))])
        } else if (el.controller.visible) {
          const id = handCandidate(el)
          if (id !== null) aimPoint.add(id)
        }
      }
      namePanels.forEach(({ obj }, id) => {
        const glossy = aimPoint.has(id)
        obj.material.color.set(glossy ? NAME_LIGHT : NAME_COLOR)
        obj.scale.setScalar(glossy ? NAME_SCALE * NAME_GROWTH : NAME_SCALE)
      })

      const ratio = 1 - Math.exp(-dt * SEAT_SPEED)
      for (const [id, target] of floating) {
        const { position: p } = layers[id].group
        p.lerp(target, ratio)
        if (p.distanceTo(target) < STOP_THRESHOLD) {
          p.copy(target)
          floating.delete(id)
          b.refreshShadow()
        }
      }

      if (ending && !floating.size) {
        closeGame()
        doneRemaining = DONE_DURATION
        b.completed()
      }
    },
    clear: () => {
      finish()
      for (const el of hands) {
        for (const [event, f] of el.listeners) el.controller.removeEventListener(event as 'squeezestart', f)
      }
      panel.dispose()
      namePanels.forEach((p) => p.dispose())
      targetGeometry.dispose()
      targetMaterial.dispose()
    },
  }
}
