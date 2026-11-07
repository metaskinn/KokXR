// Bu modül yalnızca «Maketi eline al» sonrasında dinamik olarak yüklenir.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { lightDevice } from './uluMosqueFloor'
import { setupUluLight } from './ulu-mosque/light'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Source, ModelHotspot } from '../../types/artifact'
import { sourceText } from '../SourceLine'
import { uluMosqueModel, type Model as BuildingModel } from './uluMosqueModel'
import { PLAYER_RADIUS, viewBlocked, stopFloor, floorStep } from './walkingCollision'
import { setupXrSession } from './xrSession'

export interface ModelScene {
  shatter: (open: boolean) => void;
  auto: (open: boolean) => void;
  reset: () => void;
  rotate: (horizontal: number, vertical: number) => void;
  zoomIn: (ratio: number) => void;
  /** İç mekân durağına gider; `null` dışarı çıkarır. */
  interior: (stopId: string | null) => void;
  stops: { id: string; ad: string }[];
  /** İçeride yürüme ve bakış tuşları: w a s d, ok tuşları, PageUp/PageDown, Shift. */
  walkKey: (keyBtn: string, pressed: boolean) => void;
  walkRelease: () => void;
  closeInfo: () => void;
  /** VR oturumu açar; reddedilirse Promise reddedilir, sahne çalışmaya devam eder. */
  startXr: () => Promise<void>;
  clear: () => void;
}

export interface SceneOption {
  infos?: ModelHotspot[];
  sources?: Source[];
  /** Görünecek bilgi kartı değiştiğinde çağrılır. */
  infoChanged?: (id: string | null) => void;
  xrChanged?: (active: boolean) => void;
}

const WALK_SPEED = 5, RUN_SPEED = 9, TURN_SPEED = 1.7
const MARKER_VIEW = 32
const SLOW_FRAME_MS = 42

/** Yazılımsal çizimde görüntü işleme kullanılamayacak kadar yavaştır. */
function softwareRendering(renderer: THREE.WebGLRenderer) {
  const gl = renderer.getContext()
  const extension = gl.getExtension('WEBGL_debug_renderer_info')
  const ad = extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : ''
  return /swiftshader|llvmpipe|software/i.test(ad)
}

// Her yapı `yapilar/<eser-id>.ts` dosyasından `export const yapi` ile kaydolur; buraya elle eklenmez.
const buildingFiles = import.meta.glob<{ building: () => BuildingModel }>('./buildings/*.ts', { eager: true })
const models: Record<string, () => BuildingModel> = { 'ulu-mosque': uluMosqueModel }
for (const [path, file] of Object.entries(buildingFiles)) models[path.replace(/^.*\/|\.ts$/g, '')] = file.building
export function createModelScene(area: HTMLElement, model: string, smallMove: boolean, option: SceneOption = {}): ModelScene {
  const create = models[model]
  if (!create) throw new Error(`Bilinmeyen maket: ${model}`)
  const building = create()
  const canvas = document.createElement('canvas')
  if (!canvas.getContext('webgl2')) throw new Error('WebGL kullanılamıyor')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  canvas.setAttribute('aria-hidden', 'true')
  area.append(canvas)

  const threeScene = new THREE.Scene()
  // Stüdyo arka planı: ortada hafif aydınlık, kenarlara doğru koyulaşan yeşil
  const backdropCanvas = document.createElement('canvas')
  backdropCanvas.width = backdropCanvas.height = 512
  const drawBackdrop = backdropCanvas.getContext('2d')
  if (drawBackdrop) {
    const g = drawBackdrop.createRadialGradient(256, 230, 40, 256, 256, 380)
    g.addColorStop(0, '#31493f'); g.addColorStop(0.55, '#1a2b25'); g.addColorStop(1, '#0c1512')
    drawBackdrop.fillStyle = g
    drawBackdrop.fillRect(0, 0, 512, 512)
  }
  const backdrop = new THREE.CanvasTexture(backdropCanvas)
  backdrop.colorSpace = THREE.SRGBColorSpace
  threeScene.background = backdrop
  const environment = new THREE.PMREMGenerator(renderer)
  const uluLight = model === 'ulu-mosque' ? setupUluLight(renderer, environment, building.root) : null
  const room = uluLight ? null : new RoomEnvironment()
  const outerEnvTarget = room ? environment.fromScene(room, 0.04) : null
  room?.dispose()
  const envMap = uluLight?.outerEnv ?? outerEnvTarget!.texture
  threeScene.environment = envMap
  // İç mekân yansıması: krem duvarlar, gül zemin ve avize noktaları. Altın, mermer ve su bunları yansıtır.
  const interiorEnvScene = new THREE.Scene()
  const interiorEnvGeo = new THREE.SphereGeometry(1, 12, 8), interiorEnvBox = new THREE.BoxGeometry(70, 26, 56)
  const interiorEnvMat = [
    new THREE.MeshBasicMaterial({ color: '#b9a488', side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 7.4, 5.2) }),
  ]
  interiorEnvScene.add(new THREE.Mesh(interiorEnvBox, interiorEnvMat[0]))
  for (let x = -27.6; x <= 27.6; x += 13.8) for (let z = -20.6; z <= 20.6; z += 13.75) {
    const l = new THREE.Mesh(interiorEnvGeo, interiorEnvMat[1])
    l.position.set(x, 3, z)
    interiorEnvScene.add(l)
  }
  const interiorEnvTarget = uluLight ? null : environment.fromScene(interiorEnvScene, 0.03, 0.5, 100)
  const interiorEnv = uluLight?.interiorEnv ?? interiorEnvTarget!.texture
  environment.dispose()
  interiorEnvGeo.dispose(); interiorEnvBox.dispose(); interiorEnvMat.forEach((m) => m.dispose())
  threeScene.environmentIntensity = 0.42
  const camera = new THREE.PerspectiveCamera(40, 1, 4, 900)
  // Açılış kuzeyden: taç kapı, avlu köşkleri ve iki minare fotoğraftaki gibi önde görünür.
  const start_ = new THREE.Vector3(...(building.camera?.position ?? [-58, 40, -118]))
  const startTarget = new THREE.Vector3(...(building.camera?.target ?? [0, 14, -3]))
  camera.position.copy(start_)

  const hemi = new THREE.HemisphereLight('#ffeed8', '#39423a', 0.58)
  threeScene.add(hemi)
  const sun = new THREE.DirectionalLight('#ffdcaa', 3.7)
  sun.position.set(-85, 95, -80)
  sun.castShadow = true
  const touchscreen = matchMedia('(hover: none)').matches
  sun.shadow.mapSize.set(touchscreen ? 2048 : 4096, touchscreen ? 2048 : 4096)
  sun.shadow.radius = 3.5
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.35
  Object.assign(sun.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 10, far: 340 })
  threeScene.add(sun)
  uluLight?.outerLight(hemi, sun)

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(building.pedestalRadius ?? 70, (building.pedestalRadius ?? 70) + 1.5, 3, 96), new THREE.MeshStandardMaterial({ color: '#27221c', roughness: 0.65, metalness: 0.15 }))
  pedestal.position.y = -1.5; pedestal.receiveShadow = true
  threeScene.add(pedestal)

  const { root, layers, stops, walking } = building
  threeScene.add(root)

  // Bilgi noktası işaretleri: yapıların üstünde duran, sahneye bağlı düğmeler
  const markerLayer = document.createElement('div')
  markerLayer.className = 'model-markers'
  markerLayer.hidden = true
  area.append(markerLayer)
  const markers = (option.infos ?? []).map((info) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'model-marker'
    button.dataset.info = info.id
    button.setAttribute('aria-label', `${info.title} bilgisini aç`)
    const point = document.createElement('span')
    point.className = 'model-marker-point'
    point.textContent = 'i'
    const ad = document.createElement('span')
    ad.className = 'model-marker-ad'
    ad.textContent = info.title
    button.append(point, ad)
    button.addEventListener('click', () => { selectedInfo = info.id; closedInfo = null })
    markerLayer.append(button)
    return { info, button, position: new THREE.Vector3(info.position[0], info.position[1], info.position[2]) }
  })
  let activeInfo: string | null = null, nearInfo: string | null = null
  let selectedInfo: string | null = null, closedInfo: string | null = null
  const projection = new THREE.Vector3()
  const worldPos = new THREE.Vector3()
  // XR'da kamera rig'e bağlıdır; yerel konumu dünyadaki yeri vermez.
  const gazePos = () => renderer.xr.isPresenting ? camera.getWorldPosition(worldPos) : camera.position
  const xrCard = (id: string | null) => {
    const info = markers.find((i) => i.info.id === id)?.info
    if (!info) return null
    const source = option.sources?.find((k) => k.id === info.sourceId)
    return { title: info.title, text: info.text, source: `Kaynak: ${source ? sourceText(source) : 'Kaynak bilgisi bulunamadı.'}` }
  }

  const updateInfo = () => {
    let nearest: string | null = null, shortest = Infinity
    const gaze = gazePos()
    for (const { info, position } of markers) {
      const distance = Math.hypot(gaze.x - position.x, gaze.z - position.z)
      if (inside && distance < info.radius && distance < shortest) { nearest = info.id; shortest = distance }
    }
    if (nearest !== nearInfo) { nearInfo = nearest; closedInfo = null }
    if (!inside) { selectedInfo = null; closedInfo = null }
    // VR'da kart yalnız başlığa tıklanınca açılır; yakınlık masaüstünde geçerlidir.
    const toShow = selectedInfo ?? (!renderer.xr.isPresenting && nearInfo !== closedInfo ? nearInfo : null)
    if (toShow !== activeInfo) {
      activeInfo = toShow
      option.infoChanged?.(activeInfo)
      if (renderer.xr.isPresenting) xr.showInfo(xrCard(activeInfo))
    }
  }

  const positionMarkers = () => {
    if (!inside) return
    const w = area.clientWidth, h = area.clientHeight
    // Tavana bakarken yalnız başın üstündeki noktalar anlamlıdır; duvarların ötesi gösterilmez.
    const looksUp = controls.target.y - camera.position.y > 0.3
    for (const { info, button, position } of markers) {
      projection.copy(position).project(camera)
      const distance = camera.position.distanceTo(position)
      const horizontalDistance = Math.hypot(camera.position.x - position.x, camera.position.z - position.z)
      const visible = projection.z < 1 && Math.abs(projection.x) < 1.05 && Math.abs(projection.y) < 1.05 && distance < MARKER_VIEW &&
        // Altında durulan noktanın kartı zaten açıktır; işareti ekran köşesine yığılmasın.
        horizontalDistance > 4 && !(looksUp && horizontalDistance > 8) &&
        !walking.viewBlockers.some((k) => viewBlocked(camera.position.x, camera.position.z, position.x, position.z, k))
      button.hidden = !visible
      if (!visible) continue
      button.style.transform = `translate(${((projection.x + 1) / 2) * w}px, ${((1 - projection.y) / 2) * h}px) translate(-50%, -50%)`
      button.classList.toggle('active', activeInfo === info.id)
    }
  }

  // Yürüme: çarpışma kutuları oyuncu yarıçapı kadar şişirilmiş kabul edilir; eksen eksen denenerek duvar boyunca kayılır.
  const pressedKeys = new Set<string>()
  // Yürünen zeminin yüksekliği: merdiven ve platformda artar.
  let innerFloor = 0
  const takeStep = (x: number, z: number) => floorStep(walking, x, z, PLAYER_RADIUS, innerFloor)
  const eye = new THREE.Vector3()
  const walkDir = new THREE.Vector3(), gazeDir = new THREE.Spherical()
  const finishInteriorTransition = () => {
    if (!innerTarget) return
    // Geçişin ortası duvar/havuz içinde olabilir; hareket güvenli hedefte başlar.
    camera.position.copy(innerTarget.position)
    controls.target.copy(innerTarget.gaze)
    innerTarget = null
  }
  const updateWalk = (elapsedSec: number) => {
    const b = pressedKeys
    const turn = (b.has('ArrowLeft') ? 1 : 0) - (b.has('ArrowRight') ? 1 : 0)
    const slope = (b.has('PageDown') ? 1 : 0) - (b.has('PageUp') ? 1 : 0)
    const forward = (b.has('w') || b.has('ArrowUp') ? 1 : 0) - (b.has('s') || b.has('ArrowDown') ? 1 : 0)
    const side = (b.has('d') ? 1 : 0) - (b.has('a') ? 1 : 0)
    if (!turn && !slope && !forward && !side) return
    finishInteriorTransition()
    if (turn || slope) {
      gazeDir.setFromVector3(walkDir.copy(controls.target).sub(camera.position))
      gazeDir.theta += turn * TURN_SPEED * elapsedSec
      gazeDir.phi = THREE.MathUtils.clamp(gazeDir.phi + slope * TURN_SPEED * 0.7 * elapsedSec, 0.25, Math.PI - 0.25)
      controls.target.copy(camera.position).add(walkDir.setFromSpherical(gazeDir))
    }
    if (forward || side) {
      // Yön dizisi yatay düzleme indirgenir: yukarı bakarken de yerde yürünür.
      walkDir.copy(controls.target).sub(camera.position).setY(0)
      if (walkDir.lengthSq() < 1e-6) return
      walkDir.normalize()
      const path = (b.has('Shift') ? RUN_SPEED : WALK_SPEED) * elapsedSec / Math.hypot(forward, side)
      const dx = (walkDir.x * forward - walkDir.z * side) * path
      const dz = (walkDir.z * forward + walkDir.x * side) * path
      const oldX = camera.position.x, oldZ = camera.position.z
      // Düşük kare hızında koşarken de ince duvarlar ve basamaklar atlanmasın.
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12))
      for (let n = 0; n < steps; n++) {
        const newX = takeStep(camera.position.x + dx / steps, camera.position.z)
        if (newX !== null) { camera.position.x += dx / steps; innerFloor = newX }
        const newZ = takeStep(camera.position.x, camera.position.z + dz / steps)
        if (newZ !== null) { camera.position.z += dz / steps; innerFloor = newZ }
      }
      const dy = (walking.eyeY + innerFloor - camera.position.y) * Math.min(1, elapsedSec * 6)
      camera.position.y += dy
      controls.target.x += camera.position.x - oldX
      controls.target.y += dy
      controls.target.z += camera.position.z - oldZ
      if (camera.position.x !== oldX || camera.position.z !== oldZ) {
        selectedInfo = null
        area.dataset.position = `${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)}`
      }
    }
  }

  // İç aydınlatma yalnız içerideyken yanar: gölgesiz olduğu için dışarıdayken duvarlardan sızardı.
  const innerLights = (building.innerLights ?? [[-15, 8, -7], [15, 8, -7], [-8, 8, 12], [8, 8, 12]]).map(([x, y, z]) => {
    const light = new THREE.PointLight('#ffdcae', 0, 46, uluLight ? 1.3 : 2)
    light.position.set(x, y, z)
    Object.assign(light.shadow.camera, { near: 0.4, far: 46 })
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.radius = 4
    light.shadow.bias = -0.002
    light.shadow.normalBias = 0.06
    threeScene.add(light)
    return light
  })
  const outerHemi = hemi.intensity

  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(startTarget)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 40
  controls.maxDistance = 320
  controls.maxPolarAngle = Math.PI / 2 - 0.05
  controls.autoRotate = !smallMove
  controls.autoRotateSpeed = 0.8
  controls.update()
  // Kullanıcı tutup çevirince otomatik dönüş durur, eser "elinde" kalır.
  controls.addEventListener('start', () => { controls.autoRotate = false; cameraTarget = null; finishInteriorTransition() })

  const spherical = new THREE.Spherical()
  let fragmented = false
  let inside = false
  let interiorFov = 68
  let innerTarget: { position: THREE.Vector3; gaze: THREE.Vector3 } | null = null
  let cameraTarget: THREE.Vector3 | null = null
  let running = true
  let composerReady = false
  const resize = () => {
    if (renderer.xr.isPresenting) return
    const { clientWidth: w, clientHeight: h } = area
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(h, 1)
    // Dar ekranda maketin tamamı sığsın diye görüş açısı genişletilir.
    camera.fov = inside ? interiorFov : camera.aspect < 1 ? 62 : 40
    camera.updateProjectionMatrix()
    if (composerReady) {
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(w, h)
    }
  }
  // Görüntü işleme: ortam gölgesi (AO) ve hafif parlama, yumuşak kenar için çoklu örnekleme.
  // Kalite 0: hepsi · 1: AO kapalı · 2: görüntü işleme kapalı, düşük piksel oranı.
  const forceQuality = new URLSearchParams(location.search).get('quality')
  let quality = forceQuality === 'tall' ? 0 : softwareRendering(renderer) ? 2 : 0
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(threeScene, camera))
  const gtao = new GTAOPass(threeScene, camera, 1, 1)
  gtao.blendIntensity = 0.95
  gtao.updateGtaoMaterial({ radius: 5, distanceExponent: 1.3, thickness: 2, scale: 1.2, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 })
  composer.addPass(gtao)
  // Saydam ışık katmanları AO'nun derinlik geçişine girmez, yoksa etraflarında leke bırakır.
  const aoOuter: THREE.Object3D[] = []
  threeScene.traverse((o) => { if (o instanceof THREE.Mesh && (o.material as THREE.Material).blending === THREE.AdditiveBlending) aoOuter.push(o) })
  // Three bu iki yöntemi dışa açmıyor; yalnız görünürlük listesini genişletmek için sarılır.
  const aoInner = gtao as unknown as { _overrideVisibility(): void; _restoreVisibility(): void }
  const hideAo = aoInner._overrideVisibility.bind(gtao), showAo = aoInner._restoreVisibility.bind(gtao)
  aoInner._overrideVisibility = () => { hideAo(); aoOuter.forEach((o) => { o.visible = false }) }
  aoInner._restoreVisibility = () => { showAo(); aoOuter.forEach((o) => { o.visible = true }) }
  const glow = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.5, 1.2)
  composer.addPass(glow)
  composer.addPass(new OutputPass())
  const applyQuality = () => {
    gtao.enabled = quality === 0
    if (quality === 2) renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    area.dataset.quality = String(quality)
    resize()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(area)
  composerReady = true
  applyQuality()

  // Işık, ortam ve AO geçişi; kameraya dokunmaz, VR'daki iç görünüm de bunu kullanır.
  const interiorState = (inner: boolean) => {
    inside = inner
    // VR'da HTML görünmez, işaretler açılmaz.
    markerLayer.hidden = !inner || renderer.xr.isPresenting
    threeScene.environment = inner ? interiorEnv : envMap
    threeScene.environmentIntensity = inner ? 0.5 : 0.42
    hemi.intensity = inner ? 0.34 : outerHemi
    glow.strength = inner ? 0.12 : 0.18
    glow.threshold = inner ? 1.3 : 1.2
    // Gerçek paye ve kemer gölgeleri: bir kez çizilir; Quest, telefon ve yazılımsal çizimde kapalıdır.
    const innerShadow = inner && !lightDevice() && quality < 2
    if (innerLights[0]?.castShadow !== innerShadow) {
      innerLights.forEach((i) => { i.castShadow = innerShadow })
      renderer.shadowMap.needsUpdate = true
    }
    gtao.updateGtaoMaterial(inner
      ? { radius: 2.2, distanceExponent: 1.3, thickness: 1.2, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }
      : { radius: 5, distanceExponent: 1.3, thickness: 2, scale: 1.2, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
    innerLights.forEach((i) => { i.intensity = inner ? 18 : 0 })
    uluLight?.apply(inner, { scene: threeScene, hemi, glow, innerLights })
  }
  uluLight?.apply(false, { scene: threeScene, hemi, glow, innerLights })
  const closeInfo = () => {
    selectedInfo = null
    closedInfo = nearInfo
  }

  const xr = setupXrSession({
    renderer, scene: threeScene, camera, walking, stops, interiorState, closeInfo, layers,
    refreshShadow: () => { renderer.shadowMap.needsUpdate = true },
    titles: markers.map(({ info }) => info),
    selectInfo: (id) => { selectedInfo = selectedInfo === id ? null : id },
    setShatter: (open) => { fragmented = open },
    isFragmented: () => fragmented,
    sessionEnded: () => {
      // VR menüsünden parçalanmış kalmasın: sayfadaki düğme birleşik gösterir.
      fragmented = false
      controls.enabled = true
      camera.position.copy(start_)
      controls.target.copy(startTarget)
      camera.near = 4
      camera.far = 900
      controls.update()
      resize()
      option.xrChanged?.(false)
    },
  })

  let prevTime = performance.now()
  let frameCount = 0, measuredFrame = 0, slowFrame = 0
  renderer.setAnimationLoop(() => {
    if (!running) return
    const now = performance.now()
    const elapsedSec = Math.min((now - prevTime) / 1000, 0.5)
    prevTime = now
    if (renderer.xr.isPresenting) {
      // Katmanlar animasyonsuz gider: gölgeyi her karede yeniden çizmek VR'da pahalıdır. Birleştirme sırasında katmanlar oyunundur.
      if (!xr.inAssembly()) for (const { group, height } of layers) {
        const target = fragmented ? height : 0
        if (group.position.y !== target) { group.position.y = target; renderer.shadowMap.needsUpdate = true }
      }
      xr.frame(elapsedSec)
      updateInfo()
      renderer.render(threeScene, camera)
      return
    }
    // Uyarlamalı kalite: ısınma karelerinden sonra art arda yavaş kare görülürse efekt azaltılır.
    if (forceQuality !== 'tall' && quality < 2 && ++measuredFrame > 20) {
      slowFrame = elapsedSec * 1000 > SLOW_FRAME_MS ? slowFrame + 1 : Math.max(0, slowFrame - 1)
      if (slowFrame > 30) { quality++; slowFrame = 0; measuredFrame = 0; applyQuality() }
    }
    for (const { group, height } of layers) {
      const target = fragmented ? height : 0
      const newY = smallMove ? target : group.position.y + (target - group.position.y) * 0.08
      if (Math.abs(newY - group.position.y) > 0.002) renderer.shadowMap.needsUpdate = true
      group.position.y = newY
    }
    if (cameraTarget) {
      camera.position.lerp(cameraTarget, smallMove ? 1 : 0.08)
      if (camera.position.distanceTo(cameraTarget) < 0.5) cameraTarget = null
    }
    if (innerTarget) {
      const step = smallMove ? 1 : 1 - Math.exp(-elapsedSec * 4)
      camera.position.lerp(innerTarget.position, step)
      controls.target.lerp(innerTarget.gaze, step)
      if (camera.position.distanceTo(innerTarget.position) < 0.02) finishInteriorTransition()
    }
    if (inside) {
      // Adım sınırı: kare hızı düşse de tek adımda ince korkulukların içinden geçilmez.
      updateWalk(Math.min(elapsedSec, 0.1))
      eye.copy(camera.position)
      area.dataset.frame = String(++frameCount)
    }
    controls.update()
    if (inside) {
      // Sürüklerken kamera hedefin çevresinde değil kendi çevresinde döner: bakış değişir, göz yerinde kalır.
      const diff = camera.position.clone().sub(eye)
      camera.position.copy(eye)
      controls.target.sub(diff)
    }
    updateInfo()
    positionMarkers()
    if (quality < 2) composer.render(elapsedSec)
    else renderer.render(threeScene, camera)
  })

  const scene: ModelScene = {
    shatter: (open) => {
      fragmented = open
      // İçerisi ve katmanların tamamı görünsün diye kamera geriye ve yukarıya alınır.
      if (open) {
        spherical.setFromVector3(camera.position.clone().sub(controls.target))
        spherical.phi = Math.min(spherical.phi, 0.95)
        spherical.radius = Math.max(spherical.radius, 205)
        cameraTarget = controls.target.clone().add(new THREE.Vector3().setFromSpherical(spherical))
      }
    },
    auto: (open) => { controls.autoRotate = open },
    reset: () => {
      if (inside) return
      cameraTarget = null; camera.position.copy(start_); controls.target.copy(startTarget); controls.update()
    },
    rotate: (horizontal, vertical) => {
      spherical.setFromVector3(camera.position.clone().sub(controls.target))
      spherical.theta += horizontal
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + vertical, Math.max(0.15, controls.minPolarAngle), controls.maxPolarAngle)
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical))
      controls.update()
    },
    zoomIn: (ratio) => {
      if (inside) {
        interiorFov = THREE.MathUtils.clamp(interiorFov * ratio, 32, 85)
        camera.fov = interiorFov
        camera.updateProjectionMatrix()
        return
      }
      const dir = camera.position.clone().sub(controls.target)
      const distance = THREE.MathUtils.clamp(dir.length() * ratio, controls.minDistance, controls.maxDistance)
      camera.position.copy(controls.target).add(dir.setLength(distance))
      controls.update()
    },
    stops: stops.map(({ id, ad }) => ({ id, ad })),
    walkKey: (keyBtn, pressed) => { if (pressed) pressedKeys.add(keyBtn); else pressedKeys.delete(keyBtn) },
    walkRelease: () => pressedKeys.clear(),
    closeInfo,
    // Kullanıcı jesti kaybolmasın: requestSession'dan önce await yok.
    startXr: async () => {
      if (inside) scene.interior(null)
      fragmented = false
      cameraTarget = null
      await xr.start()
      // VR'da kamera rig yerelindedir: fare masaüstü koordinatıyla ezmesin.
      controls.enabled = false
      controls.autoRotate = false
      option.xrChanged?.(true)
    },
    interior: (stopId) => {
      const stop = stops.find((d) => d.id === stopId)
      const input = !!stop && !inside
      const output = !stop && inside
      // Yeni durak seçilince eski durağa süren kamera hareketi sona erer.
      innerTarget = null
      cameraTarget = null
      selectedInfo = null
      pressedKeys.clear()
      if (input) {
        interiorState(true)
        fragmented = false
        layers.forEach(({ group }) => { group.position.y = 0 })
        renderer.shadowMap.needsUpdate = true
        controls.autoRotate = false
        controls.enableZoom = false
        controls.minDistance = 0.3
        controls.maxDistance = 0.8
        controls.minPolarAngle = 0.02
        controls.maxPolarAngle = Math.PI - 0.02
        controls.rotateSpeed = 0.55
        camera.near = 0.15
        camera.far = 400
        interiorFov = 68
        camera.fov = interiorFov
        camera.updateProjectionMatrix()
        // Dıştaki dönüşün kalan ivmesi içeride bakışı kaydırmasın.
        controls.enableDamping = false
        controls.update()
        controls.enableDamping = true
      }
      if (stop) {
        const position = new THREE.Vector3(...stop.position)
        innerFloor = stopFloor(walking, stop.position)
        const dir = new THREE.Vector3(...stop.look).sub(position).normalize()
        const gaze = position.clone().add(dir.multiplyScalar(0.5))
        if (input) {
          camera.position.copy(position)
          controls.target.copy(gaze)
          innerTarget = null
        } else {
          innerTarget = { position, gaze }
        }
      }
      if (output) {
        interiorState(false)
        innerTarget = null
        controls.enableZoom = true
        controls.minDistance = 40
        controls.maxDistance = 320
        controls.minPolarAngle = 0
        controls.maxPolarAngle = Math.PI / 2 - 0.05
        controls.rotateSpeed = 1
        camera.near = 4
        camera.far = 900
        resize()
        camera.position.copy(start_)
        controls.target.copy(startTarget)
      }
      controls.update()
    },
    clear: () => {
      xr.finish()
      xr.clear()
      running = false
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      threeScene.traverse((o) => {
        if (o instanceof THREE.DirectionalLight || o instanceof THREE.PointLight || o instanceof THREE.SpotLight) o.shadow.dispose()
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
          geometries.add(o.geometry)
          if (o instanceof THREE.InstancedMesh) o.dispose()
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            materials.add(m)
            for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value)
          }
        }
      })
      geometries.forEach((g) => g.dispose())
      textures.forEach((d) => d.dispose())
      materials.forEach((m) => m.dispose())
      if (uluLight) uluLight.clear()
      else { outerEnvTarget?.dispose(); interiorEnvTarget?.dispose() }
      backdrop.dispose()
      gtao.dispose()
      glow.dispose()
      composer.dispose()
      target.dispose()
      renderer.dispose()
      markerLayer.remove()
      delete area.dataset.position
      delete area.dataset.frame
      delete area.dataset.quality
      canvas.remove()
    },
  }
  return scene
}
