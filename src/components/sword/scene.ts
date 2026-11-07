import * as T from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { firstGame, average, advance, heatUp, strike, wrist, giveWater, clink, masterComplete, pieces, limit } from './state'
import type { Game } from './state'
import { prepareBlade, mouthLocal } from './forging'
import { setupTargets, targetPlaneZ, targetCenter } from './targets'
import { easy, interrupt, DampedVector, curvedPath, bowStep } from './animation'
import { particlePool } from './particle'
import { createSound } from './sound'
import { computeCut } from './test'
import { swordPartNotes } from '../../data/sword'
import { setupXrSession } from './xrSession'
import { nearestRegion, rayAxisX } from './xrCalc'
export type Command = 'al' | 'continue' | 'again' | 'master' | 'strike' | 'clink' | 'cutOff' | 'targets-renew' | 'fromStart'
export interface SwordScene {
  command: (ad: Command) => void; hold: (ad: 'bellows' | 'water' | 'wrist', v: boolean) => void
  sec: (id: number) => void; target: (id: number) => void; sound: (ac: boolean) => void
  zoom: (ratio: number) => void; rotate: (x: number) => void; clear: () => void
  /** Kullanıcı jesti kaybolmasın: requestSession'dan önce await yok. */
  startXr: () => Promise<void>
}
export async function createScene(area: HTMLElement, notify: (d: Game) => void, error: () => void, not: (id: number) => void, xrChanged?: (active: boolean) => void): Promise<SwordScene> {
  const scene = new T.Scene(); scene.background = new T.Color('#11191a'); scene.fog = new T.FogExp2('#11191a', .025)
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.localClippingEnabled = true
  const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
  const software = debug && /swiftshader|llvmpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
  renderer.setPixelRatio(software ? .8 : Math.min(devicePixelRatio, 1.6)); renderer.domElement.setAttribute('aria-hidden', 'true')
  const geometries = new Set<T.BufferGeometry>(), mats = new Set<T.Material>(), textures = new Set<T.Texture>()
  const collect = (rootObj: T.Object3D) => rootObj.traverse(o => { if (o instanceof T.Mesh || o instanceof T.Line) { geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { mats.add(m); for (const v of Object.values(m)) if (v instanceof T.Texture) textures.add(v) } } })
  let models: Awaited<ReturnType<GLTFLoader['loadAsync']>>[]
  try {
    const result = await Promise.allSettled([new GLTFLoader().loadAsync('/models/sword.glb'), new GLTFLoader().loadAsync('/models/sword-workshop.glb')])
    if (result.some(v => v.status === 'rejected')) {
      result.forEach(v => { if (v.status === 'fulfilled') collect(v.value.scene) }); geometries.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      throw new Error('Atölye modelleri yüklenemedi.')
    }
    models = result.map(v => (v as PromiseFulfilledResult<Awaited<ReturnType<GLTFLoader['loadAsync']>>>).value)
  } catch (e) { renderer.dispose(); throw e }
  const [sword, workshop] = models.map(v => v.scene)
  scene.add(workshop, sword); collect(scene)
  const objVal = (name: string) => { const o = scene.getObjectByName(name); if (!o) throw new Error(`Model parçası eksik: ${name}`); return o }
  const mesh = (name: string) => { const o = scene.getObjectByName(name); if (!(o instanceof T.Mesh)) throw new Error(`Model parçası eksik: ${name}`); return o }
  const blade = mesh('Namlu'), deform = prepareBlade(blade), eggShape = mesh('Sword_Egg'), kor = mesh('Kor'), bellows = mesh('Bellows_Leather'), stone = mesh('Sharpen_Stone')
  const extras = ['Blade_Inlay', 'Balcak', 'Sap', 'Hilt_Left', 'Hilt_Right', ...pieces.slice(3)].map(objVal)
  const actuals = new Map(extras.map(o => [o.name, o.position.clone()]))
  extras.forEach(o => o.traverse(c => { if (c instanceof T.Mesh) c.material = (c.material as T.MeshStandardMaterial).clone() }))
  const inlay = mesh('Blade_Inlay').material as T.MeshStandardMaterial; inlay.transparent = true
  const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment(), env = pmrem.fromScene(room)
  scene.environment = env.texture; scene.environmentIntensity = .38; room.dispose(); pmrem.dispose()
  const hemi = new T.HemisphereLight('#bad6e5', '#3d2619', 1.05); scene.add(hemi)
  const key = new T.DirectionalLight('#d8e8ff', 3); key.position.set(2, 6, 4); key.castShadow = true; key.shadow.mapSize.set(software ? 512 : 1024, software ? 512 : 1024); key.shadow.camera.left = key.shadow.camera.bottom = -7; key.shadow.camera.right = key.shadow.camera.top = 7; key.shadow.normalBias = .018; scene.add(key)
  const fire = new T.PointLight('#ff681e', 65, 9, 2); fire.position.set(-2.25, 1.3, -1.8); scene.add(fire)
  const bladeLight = new T.PointLight('#ff7825', 0, 2.5); scene.add(bladeLight)
  const rim = new T.SpotLight('#f4d1a4', 22, 8, .6, .6); rim.position.set(1, 4, 1); rim.target = sword; scene.add(rim)
  workshop.traverse(o => { if (o instanceof T.Mesh) { o.receiveShadow = true; o.castShadow = !['Su', 'Kor'].includes(o.name) } }); sword.traverse(o => { if (o instanceof T.Mesh) o.castShadow = true })
  const camera = new T.PerspectiveCamera(42, 1, .025, 70)
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = .65; controls.maxDistance = 4
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new T.Vector2(800, 600), .3, .45, 1.15); composer.addPass(bloom); const fxaa = new ShaderPass(FXAAShader); composer.addPass(fxaa); composer.addPass(new OutputPass())
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches, particles = particlePool(scene, az), sound = createSound()
  // Çekiç: tutma noktası başlangıç; sap -Z'ye uzanır, baş çeliğe yukarıdan iner. X ekseni çevresinde döner.
  const hammer = new T.Group(); hammer.position.set(0, .998, .24); scene.add(hammer)
  const hammerHead = mesh('Hammer_Head'), hammerHandle = mesh('Hammer_Handle'), hammerHand = new T.Group(); hammer.add(hammerHand)
  hammerHand.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, -1), new T.Vector3(-1, 0, 0)))
  hammerHand.add(hammerHead); hammerHead.position.set(0, .34, 0); hammerHead.quaternion.identity(); hammerHand.add(hammerHandle); hammerHandle.position.set(0, .34, 0); hammerHandle.quaternion.identity()
  // Maşa: kılıcın sapını kavrar, kılıçla birlikte hareket eder.
  const tongs = new T.Group(); sword.add(tongs); tongs.position.set(-.16, 0, 0); tongs.visible = false
  for (const ad of ['Table_1', 'Table_2']) { const m = mesh(ad); tongs.add(m); m.position.set(0, 0, 0); m.quaternion.identity() }
  const crackGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(.6, -.027, .006), new T.Vector3(.61, -.01, .006), new T.Vector3(.597, .002, .006), new T.Vector3(.62, .023, .006)])
  const crack = new T.Line(crackGeo, new T.LineBasicMaterial({ color: '#111111' })); sword.add(crack)
  const stand = new T.Mesh(new T.CylinderGeometry(.8, .9, .08, 64), new T.MeshStandardMaterial({ color: '#182023', metalness: .45, roughness: .4 })); stand.scale.set(.65, 1, .65); stand.position.set(.35, 1.15, 0); stand.visible = false; stand.receiveShadow = true; scene.add(stand)
  const supports = new T.Group(); scene.add(supports)
  for (const x of [.13, .69]) { const pole = new T.Mesh(new T.CylinderGeometry(.006, .009, .42, 12), new T.MeshStandardMaterial({ color: '#a28152', metalness: .8, roughness: .28 })); pole.position.set(x, 1.38, -.015); supports.add(pole) }
  let d = firstGame(), disposed = false, lastStage = -1, lastReheat = false, holdBellows = false, holdWater = false, wristHold = false, dragging = false, selected = 0, lastHit = -10, publish = 0, masterTime = 0, masterTotal = 0, lastMasterStage = -1, gold = 0, lastClink = 0, clinkTime = 1, clinkLanded = true, reheatWater = false
  const HAMMER_BLOW = .25, HAMMER_TURN = .6, HAMMER_WAIT = .55, STONE_X = 3.05, STONE_TOP = 1.195, STONE_Z = -1.2
  const image = d.regions.map(b => ({ ...b })), bounce = { x: 0, v: 0 }, shake = { x: 0, v: 0 }
  let hammerTime = HAMMER_TURN, strikeZone = 0, impacted = true, pendingStrike = false, flash = 0, halt = 0, bellowsPower = 0, bellowsPhase = 0, wheelSpeed = 0, contact = 0, wristU = .03, wasInWater = false
  // Dönen cismin ekseni Blender'da Z, glTF ağında Y'dir.
  const wheelAxis = new T.Vector3(0, 1, 0).applyQuaternion(stone.getWorldQuaternion(new T.Quaternion())), wheelDir = wheelAxis.z >= 0 ? 1 : -1
  const sparkDir = new T.Vector3().crossVectors(wheelAxis.clone().multiplyScalar(wheelDir), new T.Vector3(0, 1, 0)).x >= 0 ? 1 : -1
  let carry: { a: T.Vector3; q: T.Quaternion; t: number; sure: number; bend: number } | null = null
  let cut: { t: number; a: T.Vector3; b: T.Vector3; dx: number; dy: number; sec: number; wasHit: boolean; q0: T.Quaternion; p0: T.Vector3; z: number } | null = null, traceStart: T.Vector3 | null = null
  const heatPause = new T.Euler().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 0, -1), new T.Vector3(-1, 0, 0), new T.Vector3(0, 1, 0)), 'XYZ')
  const cameraTrace = new DampedVector(), targetTrace = new DampedVector(), swordTrace = new DampedVector(), targetQ = new T.Quaternion()
  let transitionTime = 0, time = 0, lastVal = performance.now(), slow = 0, tier = 0
  let down: { x: number; y: number; t: number } | null = null
  const cameraGoal = new T.Vector3(), targetGoal = new T.Vector3(), swordGoal = new T.Vector3(), swordRotation = new T.Euler()
  const targets = setupTargets(scene, mesh, az)
  const previewGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), preview = new T.Line(previewGeo, new T.LineBasicMaterial({ color: '#fff2cf', transparent: true, opacity: .65 })); preview.visible = false; scene.add(preview)
  // Savurma izi: namlunun geçtiği yüzey, hızla sönen ışık şeridi.
  const iz = (() => {
    const N = 22, position = new Float32Array(N * 6), color = new Float32Array(N * 6), geo = new T.BufferGeometry(), idx: number[] = []
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    geo.setAttribute('position', new T.BufferAttribute(position, 3)); geo.setAttribute('color', new T.BufferAttribute(color, 3)); geo.setIndex(idx); geo.setDrawRange(0, 0)
    const mat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false })
    const mesh2 = new T.Mesh(geo, mat); mesh2.frustumCulled = false; scene.add(mesh2)
    const root = new T.Vector3(.28, 0, 0), tip = new T.Vector3(1.02, 0, 0), a = new T.Vector3(), b = new T.Vector3(); let say = 0, glossy = 0
    return {
      clear() { say = 0; glossy = 0; geo.setDrawRange(0, 0) },
      add(k: T.Object3D) {
        k.updateMatrixWorld(true); a.copy(root).applyMatrix4(k.matrixWorld); b.copy(tip).applyMatrix4(k.matrixWorld)
        if (say === N) { position.copyWithin(0, 6); say-- }
        position.set([a.x, a.y, a.z, b.x, b.y, b.z], say * 6); say++; glossy = 1
        geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, Math.max(0, say - 1) * 6)
      },
      update(dt: number) {
        glossy = Math.max(0, glossy - dt * 3.8); if (glossy <= 0 && say) { say = 0; geo.setDrawRange(0, 0) }
        for (let i = 0; i < say; i++) { const g = (i / Math.max(1, say - 1)) ** 1.6 * glossy * .55; color.set([g, g * .92, g * .74, g * .35, g * .32, g * .25], i * 6) }
        geo.attributes.color.needsUpdate = true
      },
      remove() { geo.dispose(); mat.dispose(); scene.remove(mesh2) },
    }
  })()
  function updateTrace(dt: number) { iz.update(dt) }
  const markers = swordPartNotes.map((p, i) => {
    const b = document.createElement('button'); b.className = 'sword-point'; b.textContent = String(i + 1); b.setAttribute('aria-label', `${i + 1}. ${p.title}`); const click = () => not(i); b.addEventListener('click', click); area.append(b); return { b, p: new T.Vector3(...p.position), click }
  })
  const action = document.createElement('button'); action.className = 'sword-scene-marker'; area.append(action)
  const ray = new T.Raycaster(), pointer = new T.Vector2()
  const emit = () => { if (!disposed && !renderer.xr.isPresenting) notify({ ...d, regions: d.regions.map(b => ({ ...b })), results: [...d.results] }) }
  function resetTargets() { targets.reset(); d.results = []; d.damages = [0, 0, 0] }
  function startCarry() {
    if (az) return
    const uz = sword.position.distanceTo(swordGoal); if (uz < .2) return
    carry = { a: sword.position.clone(), q: sword.quaternion.clone(), t: 0, sure: T.MathUtils.clamp(uz * .42, .7, 1.7), bend: Math.min(.55, .12 + uz * .09) }
  }
  function stageView() {
    const a = d.stage, heating = a === 1 || d.again || reheatWater
    controls.enabled = a === 6
    controls.enabled = a === 6
    swordRotation.set(-Math.PI / 2, 0, 0, 'XYZ')
    if (a === 0) { cameraGoal.set(5, 3, 2); targetGoal.set(1.7, 1, -2); swordGoal.set(2.8, .95, -2.5) }
    else if (heating) {
      // Ocağın ağzı öne bakar: çelik ağızdan içeri girer, maşa dışarıda kalır. Uzamış namluda uç arka duvara değmesin diye boyu kadar geri durur.
      const length = deform.center(image, 11) + (deform.center(image, 11) - deform.center(image, 10)) / 2
      cameraGoal.set(-.8, 2.05, .65); targetGoal.set(-2.25, 1.02, -1.75); swordGoal.set(-2.25, 1.03, -2.25 + length); swordRotation.copy(heatPause)
    }
    else if (a === 2) { cameraGoal.set(.55, 1.55, 1.15); targetGoal.set(.05, .92, -.12); swordGoal.set(-deform.center(image, selected), .9, -.1) }
    else if (a === 3) { const inner = holdWater || d.dip > 0; cameraGoal.set(3.05, 1.55, 1.75); targetGoal.set(1.95, .5, .1); swordGoal.set(1.5, inner ? .45 : .78, .15); swordRotation.set(-Math.PI / 2, 0, inner ? -.25 : .03, 'ZYX') }
    else if (a === 4) {
      // Ağız, taşın üst noktasına oturur; sırt yukarıda, yüz hafif eğik.
      const u = limit(wristU, .02, .985), k = mouthLocal(u), k2 = mouthLocal(Math.min(.995, u + .01)), slope = Math.atan2(k2.y - k.y, k2.x - k.x)
      const contactY = STONE_TOP + (wristHold || d.master ? -.0005 + (az ? 0 : (Math.random() - .5) * .0012) : .014)
      swordRotation.set(.2, 0, -slope)
      const place = new T.Vector3(k.x, k.y, 0).applyEuler(swordRotation)
      swordGoal.set(STONE_X - place.x, contactY - place.y, STONE_Z - place.z)
      cameraGoal.set(STONE_X + .42, 1.42, -.32); targetGoal.set(STONE_X - .06, 1.12, STONE_Z)
    }
    else if (a === 5) { cameraGoal.set(3.25, 2.4, -.3); targetGoal.set(2.85, 1, -2.45); swordGoal.set(2.45, 1.04, -2.45) }
    else if (a === 6) { cameraGoal.set(.5, 1.85, 2.05); targetGoal.set(.42, 1.62, 0); swordGoal.set(0, 1.62, 0); swordRotation.set(.18, swordRotation.y === 0 ? -.1 : swordRotation.y, .13); if (renderer.xr.isPresenting) xrInspectPlace() }
    else { const m = targetCenter[d.target], h = d.target; cameraGoal.set(m.x + .5, h === 1 ? 1.3 : 1.5, h === 2 ? 2.9 : h === 1 ? 2.05 : 2.5); targetGoal.set(m.x, h === 2 ? 1.2 : h === 1 ? .82 : 1.05, -.1); swordGoal.set(m.x - .85, h === 2 ? 1.05 : .9, .55); swordRotation.set(.25, -.25, .95) }
    workshop.visible = a !== 6; supports.visible = stand.visible = a === 6; rim.intensity = a === 6 ? 8 : 22; hammer.visible = a === 2 && !d.again
    scene.environmentIntensity = a === 7 ? .9 : a === 6 ? .9 : .42
    hemi.intensity = a === 7 ? 2 : a === 6 ? .5 : 1.05; key.intensity = a === 7 ? 4 : a === 6 ? 1.5 : 3
    key.position.x = a === 7 ? 14 : 2; key.target.position.set(a === 7 ? 14 : 0, 0, 0); scene.add(key.target)
    ;(scene.fog as T.FogExp2).density = a === 7 ? .009 : .025
    scene.background = new T.Color(a === 7 ? '#879c9d' : a === 6 ? '#0d161a' : '#11191a')
  }
  // VR: kılıç namlu ortası çevresinde döner; ucu kullanıcıya doğru savrulmaz.
  function xrInspectPlace() { const r = swordRotation.y; swordGoal.set(.42 - .42 * Math.cos(r), 1.62, .42 * Math.sin(r)) }
  function doHit() {
    if (hammerTime < HAMMER_TURN || d.stage !== 2 || d.again || d.master) return
    hammerTime = 0; impacted = false; pendingStrike = true; strikeZone = selected; sound.start(); emit()
  }
  // Darbe anı: tıklamada değil çekiç çeliğe değdiğinde.
  function hammerBlow() {
    const wasHit = pendingStrike; pendingStrike = false
    if (wasHit) { const previous = d.stage; strike(d, strikeZone); if (previous !== d.stage) stageView() }
    const hot = d.regions[strikeZone].heat, n = hot > 750 ? 46 : hot > 550 ? 24 : 12, point = new T.Vector3(0, .925, -.1)
    particles.spray(point, new T.Vector3(.75, .55, .35), n / 2, 1.1, 3.1); particles.spray(point, new T.Vector3(-.75, .55, .35), n / 2, 1.1, 3.1)
    sound.play('hammer'); xr.vibrate(hot > 550 ? .9 : .5, 70); flash = hot > 550 ? 1 : .35; bounce.v = az ? 0 : .26
    if (!az) shake.v = -.34
    if (wasHit) emit()
  }
  const defaultCuts: [T.Vector3, T.Vector3][] = [
    [new T.Vector3(11.62, 1.32, 0), new T.Vector3(12.38, 1.02, 0)],
    [new T.Vector3(13.92, 1.1, -.1), new T.Vector3(14.08, .45, -.1)],
    [new T.Vector3(15.5, 1.7, -.1), new T.Vector3(16.8, 1.1, -.1)],
  ]
  function cutObj(dx = .4, dy = .4, sec = .22, a?: T.Vector3, b?: T.Vector3) {
    if (d.stage !== 7 || d.master || cut || d.broke) return
    const [va, vb] = defaultCuts[d.target]
    cut = { t: 0, a: (a ?? va).clone(), b: (b ?? vb).clone(), dx, dy, sec, wasHit: false, q0: sword.quaternion.clone(), p0: sword.position.clone(), z: targetPlaneZ[d.target] + .14 }
    iz.clear(); sound.play('cut')
  }
  const K_PREP = .16, K_SWING = .11, K_FOLLOW = .2
  const bladeMid = new T.Vector3(.6, 0, 0), tmpQ = new T.Quaternion(), tmpV = new T.Vector3(), tmpV2 = new T.Vector3()
  function cutFrame(dt: number) {
    if (!cut) return
    cut.t += dt
    const k = cut, v = tmpV.copy(k.b).sub(k.a), uz = v.length() || 1; v.divideScalar(uz)
    const angle = Math.atan2(v.x, -v.y), backward = tmpV2.copy(k.a).addScaledVector(v, -.28); backward.z = k.z
    const lastQ = (deviation: number) => tmpQ.setFromEuler(new T.Euler(0, .18, angle + deviation))
    let point: T.Vector3
    if (k.t < K_PREP) {
      const s = easy.outer(k.t / K_PREP); point = backward.clone()
      sword.quaternion.slerpQuaternions(k.q0, lastQ(.55), s)
      point.sub(bladeMid.clone().applyQuaternion(sword.quaternion)); sword.position.lerpVectors(k.p0, point, s)
    } else if (k.t < K_PREP + K_SWING) {
      const s = easy.inner((k.t - K_PREP) / K_SWING); point = k.a.clone().addScaledVector(v, -.28 + (uz + .28) * s); point.z = k.z
      sword.quaternion.copy(lastQ(.55 * (1 - s) - .25 * s))
      sword.position.copy(point).sub(bladeMid.clone().applyQuaternion(sword.quaternion))
      iz.add(sword)
    } else if (k.t < K_PREP + K_SWING + K_FOLLOW) {
      const s = easy.outer((k.t - K_PREP - K_SWING) / K_FOLLOW); point = k.b.clone().addScaledVector(v, .3 * s); point.z = k.z
      sword.quaternion.copy(lastQ(-.25 - .3 * s))
      sword.position.copy(point).sub(bladeMid.clone().applyQuaternion(sword.quaternion))
      iz.add(sword)
    } else { if (!k.wasHit) { k.wasHit = true; applyStrike(k) } cut = null; swordTrace.reset(); return }
    // Darbe zamana bağlıdır: düşük kare hızında savurma evresi atlansa da hasar uygulanır.
    if (!k.wasHit && k.t >= K_PREP + K_SWING * .75) { k.wasHit = true; applyStrike(k) }
  }
  function applyStrike(k: Pick<NonNullable<typeof cut>, 'a' | 'b' | 'dx' | 'dy' | 'sec'>) {
    const previous = { score: d.score, rosette: d.rosette, broke: d.broke }
    const s = computeCut(d, k.dx, k.dy, k.sec), r = targets.strike(d.target, k.a, k.b, s.power)
    if (!r.hit) { d.score = previous.score; d.rosette = previous.rosette; d.broke = previous.broke; d.message = r.message; d.results[d.target] = r.message; emit(); return }
    d.rosette = previous.rosette || r.detached && s.power >= .7
    d.message = s.broke ? s.message : r.message; d.results[d.target] = d.message; d.damages = targets.damages()
    if (s.broke) blade.visible = false
    particles.spray(r.point, new T.Vector3(.5, .5, .4), r.sound === 'ting' || s.broke ? 30 : 8, 1.2, 2.4)
    if (r.sound === 'ting') sound.play('ting')
    halt = az ? 0 : r.detached ? .09 : .05
    if (!az) shake.v = r.detached ? -.3 : -.14
    emit()
  }
  function command(ad: Command) {
    sound.start()
    if (ad === 'fromStart') { resetTargets(); d = firstGame(); d.selected = selected = 0; lastClink = 0; blade.visible = true; lastStage = -1; gold = 0; masterTime = 0; reheatWater = false; holdBellows = holdWater = wristHold = false; cut = null; wristU = .03; image.forEach(g => { g.p = 0 }); hammerTime = HAMMER_TURN }
    else if (ad === 'targets-renew') resetTargets()
    else if (d.master) return
    else if (ad === 'master') { d.master = true; masterTime = 0; masterTotal = 2.8; lastMasterStage = d.stage; d.message = 'Usta çalışıyor… Orta kaliteyle tamamlanıyor.' }
    else if (ad === 'al' && d.stage === 0) { advance(d) }
    else if (ad === 'continue') {
      if (d.stage === 1 && average(d, 'heat') >= 750) advance(d)
      else if (d.again && average(d, 'heat') >= 750) d.again = false
      else if (d.stage === 6) advance(d)
    }
    else if (ad === 'again') { if (d.stage === 2) d.again = true; if (d.stage === 3) reheatWater = !reheatWater }
    else if (ad === 'strike') doHit()
    else if (ad === 'clink' && d.stage === 5) clink(d)
    else if (ad === 'cutOff') cutObj()
    stageView(); emit()
  }
  action.addEventListener('click', actionClick)
  function actionClick() { if (d.stage === 0) command('al'); else if (d.stage === 5) command('clink') }
  function hold(ad: 'bellows' | 'water' | 'wrist', v: boolean) {
    if (v) sound.start()
    if (ad === 'bellows') { holdBellows = v; sound.bellows(v); if (d.stage === 3) reheatWater = v }
    if (ad === 'water') { holdWater = v; if (v) reheatWater = false }
    if (ad === 'wrist') wristHold = v
    stageView()
  }
  function raycast(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera)
    return ray.intersectObject(blade, false)[0]
  }
  // Vuruş imlece ekranda en yakın namlu bölgesine gider; ince namluyu tam tutturmak gerekmez.
  function region(e: PointerEvent) {
    const rect = area.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top
    let best = -1, minW = 120
    for (let i = 0; i < 12; i++) {
      const q = screen(sword.localToWorld(new T.Vector3(deform.center(image, i), 0, .006))), u = Math.hypot(q.x - x, q.y - y)
      if (u < minW) { minW = u; best = i }
    }
    if (best >= 0) { selected = best; d.selected = selected }
  }
  function planePoint(e: PointerEvent, z: number) {
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera)
    const n = ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), -z), new T.Vector3()); return n
  }
  function pointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button') || e.button !== 0) return
    sound.start(); area.focus({ preventScroll: true }); down = { x: e.clientX, y: e.clientY, t: performance.now() }; dragging = true
    if (d.stage === 2 && !d.again) { region(e); doHit() }
    if (d.stage === 4) hold('wrist', true)
    if (d.stage === 1 || d.again || reheatWater) hold('bellows', true)
    if (d.stage !== 6) area.setPointerCapture(e.pointerId)
    if (d.stage === 0) { raycast(e); if (ray.intersectObject(eggShape).length) command('al') }
    if (d.stage === 5) { raycast(e); const next = objVal(pieces[d.attached]); if (ray.intersectObject(next).length) command('clink') }
    if (d.stage === 7) { traceStart = planePoint(e, targetPlaneZ[d.target]) }
  }
  function pointerMove(e: PointerEvent) {
    if (dragging && d.stage === 2) region(e)
    // Bileme: namluyu tutmuş gibi sürükle; temas noktası namlu boyunca kayar.
    if (dragging && d.stage === 4) { wristU = limit(wristU - e.movementX / Math.max(280, area.clientWidth * .62)); selected = Math.min(11, Math.floor(wristU * 12)); d.selected = selected }
    if (dragging && d.stage === 7 && traceStart) {
      const n = planePoint(e, targetPlaneZ[d.target]); if (n) { const array = previewGeo.getAttribute('position') as T.BufferAttribute; array.setXYZ(0, traceStart.x, traceStart.y, traceStart.z + .2); array.setXYZ(1, n.x, n.y, n.z + .2); array.needsUpdate = true; preview.visible = true }
    }
    if (!dragging) { raycast(e); const hit = ray.intersectObjects([eggShape, ...(d.stage === 5 ? [objVal(pieces[Math.min(6, d.attached)])] : [])])[0]; area.style.cursor = hit ? 'pointer' : d.stage === 4 ? 'grab' : d.stage === 2 || d.stage === 7 ? 'crosshair' : 'grab'; (eggShape.material as T.MeshStandardMaterial).emissive.set(hit?.object === eggShape ? '#30220e' : '#000000') }
  }
  function pointerUp(e: PointerEvent) {
    preview.visible = false
    if (down && d.stage === 7 && dragging && traceStart && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 15) {
      const last = planePoint(e, targetPlaneZ[d.target]); if (last) cutObj((e.clientX - down.x) / area.clientWidth, (e.clientY - down.y) / area.clientHeight, (performance.now() - down.t) / 1000, traceStart, last)
    }
    traceStart = null; dragging = false; down = null; hold('bellows', false); hold('wrist', false); if (area.hasPointerCapture(e.pointerId)) area.releasePointerCapture(e.pointerId)
  }
  function cancel() { dragging = false; down = null; traceStart = null; preview.visible = false; holdBellows = holdWater = wristHold = false; sound.bellows(false) }
  function keydown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); selected = (selected + (e.key === 'ArrowLeft' ? 11 : 1)) % 12; d.selected = selected; wristU = (selected + .5) / 12; if (d.stage === 6) swordRotation.y += e.key === 'ArrowLeft' ? -.1 : .1; else stageView(); emit() }
    if (e.key === 'Enter') { e.preventDefault(); if (d.stage === 2) doHit(); else if (d.stage === 0) command('al'); else if (d.stage === 5) command('clink'); else if (d.stage === 7) cutObj() }
    if (e.code === 'Space') { e.preventDefault(); hold(d.stage === 3 && !reheatWater ? 'water' : d.stage === 4 ? 'wrist' : 'bellows', true) }
    if (e.key === '+' || e.key === '-') camera.position.sub(controls.target).multiplyScalar(e.key === '+' ? .9 : 1.1).add(controls.target)
  }
  function keyup(e: KeyboardEvent) { if (e.code === 'Space') { e.preventDefault(); cancel() } }
  function contextLost(e: Event) { e.preventDefault(); cancel(); xr.finish(); renderer.setAnimationLoop(null); sound.wait(true); error() }
  function visibility() { cancel(); if (renderer.xr.isPresenting) return; if (document.hidden) { renderer.setAnimationLoop(null); sound.wait(true) } else { lastVal = performance.now(); renderer.setAnimationLoop(frame); sound.wait(false) } }
  area.addEventListener('pointerdown', pointerDown); area.addEventListener('pointermove', pointerMove); area.addEventListener('pointerup', pointerUp); area.addEventListener('pointercancel', cancel); area.addEventListener('lostpointercapture', cancel); area.addEventListener('keydown', keydown); area.addEventListener('keyup', keyup); window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', visibility); renderer.domElement.addEventListener('webglcontextlost', contextLost)
  function size() { if (renderer.xr.isPresenting) return; const w = area.clientWidth, h = area.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); fxaa.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio())); camera.aspect = w / h; camera.setViewOffset(w, h, w > 700 ? 165 : 0, 0, w, h); camera.updateProjectionMatrix() }
  const observer = new ResizeObserver(size); area.prepend(renderer.domElement); observer.observe(area); size(); deform.update(d.regions); stageView(); camera.position.copy(cameraGoal); controls.target.copy(targetGoal); sword.position.copy(swordGoal); sword.rotation.copy(swordRotation); lastStage = 0
  function screen(p: T.Vector3) { const a = p.clone().project(camera); return { x: (a.x + 1) * area.clientWidth / 2, y: (1 - a.y) * area.clientHeight / 2, z: a.z } }
  function xrStamp() {
    area.dataset.attached = String(extras.filter(o => o.visible).length); area.dataset.detachedOne = String(targets.detachedOne()); area.dataset.damage = targets.damages().map(v => v.toFixed(2)).join(','); area.dataset.stage = String(d.stage); area.dataset.regions = d.regions.map(b => b.p.toFixed(2)).join(','); area.dataset.hammer = hammerTime >= HAMMER_TURN ? '1' : '0'
    area.dataset.xrScene = JSON.stringify({ heat: Math.round(average(d, 'heat')), skin: +average(d, 'skin').toFixed(3), dip: +d.dip.toFixed(2), selected: selected, wristU: +wristU.toFixed(3), target: d.target, score: d.score, message: d.message, master: d.master, y: +swordRotation.y.toFixed(3), sword: sword.position.toArray().map(v => +v.toFixed(3)), shadow: key.castShadow, drawing: renderer.info.render.calls, triangle: renderer.info.render.triangles, program: renderer.info.programs?.length ?? 0, texture: renderer.info.memory.textures, geo: renderer.info.memory.geometries })
  }
  // Parça düğümleri kılıçla aynı başlangıçtadır; asıl merkez geometridedir.
  const pieceCenter = new Map(pieces.map(ad => { const b = new T.Box3(); objVal(ad).traverse(c => { if (c instanceof T.Mesh) { c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox!) } }); return [ad, b.getCenter(new T.Vector3())] }))
  let xrPiece: { ad: string; m: T.Matrix4 } | null = null, xrHandSeated = false
  const boxPoint = new T.Box3(), boxCenter = new T.Vector3(), localRay = new T.Ray(), inverseMat = new T.Matrix4()
  const inspectFloor = new T.Mesh(new T.CircleGeometry(3, 48).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#141b1c', roughness: .95 })); inspectFloor.position.set(.42, 0, 0); inspectFloor.visible = false; scene.add(inspectFloor)
  const xr = setupXrSession(renderer, scene, camera, {
    game: () => d, reheat: () => reheatWater, command, hold,
    selectRegion: i => { selected = limit(i, 0, 11); d.selected = selected; wristU = (selected + .5) / 12; stageView() },
    selectTarget: i => { d.target = limit(i, 0, 2); xr.targetChanged(); stageView() },
    rotate: a => { swordRotation.y += a; xrInspectPlace() },
    findRegion: r => {
      sword.updateWorldMatrix(true, false); localRay.copy(r).applyMatrix4(inverseMat.copy(sword.matrixWorld).invert())
      const centers = image.map((_, i) => deform.center(image, i)), length = centers[11] + .05
      const h = rayAxisX(localRay.origin, localRay.direction, length)
      return h.distance <= .16 ? nearestRegion(centers, h.x) : null
    },
    regionPoint: (i, h) => { sword.localToWorld(h.set(deform.center(image, i), 0, .006)); h.y += .045; return h },
    objPoint: (ad, h) => {
      if (ad === 'water') return h.set(1.95, .42, .15) // Daldırma ve su efektinin merkezi.
      const n = ad === 'eggShape' ? eggShape : ad === 'bellows' ? bellows : objVal(ad)
      n.updateWorldMatrix(true, true); boxPoint.setFromObject(n); boxPoint.getCenter(boxCenter); return h.copy(boxCenter)
    },
    targetPointAt: i => targetCenter[i], targetBox: i => targets.box(i),
    wristU: () => wristU, wristDrag: u => { wristU = u; selected = Math.min(11, Math.floor(wristU * 12)); d.selected = selected }, stoneZ: STONE_Z,
    cutOff: c => {
      if (d.stage !== 7 || d.master || cut || d.broke) return
      sound.play('cut'); applyStrike({ a: c.a, b: c.b, dx: c.dx, dy: c.dy, sec: c.sure })
    },
    addTrace: () => iz.add(sword), cutOngoing: () => !!cut,
    swordPos: (p, q) => { sword.position.copy(p); sword.quaternion.copy(q) },
    pieceMatrix: ad => { const o = objVal(ad); o.updateWorldMatrix(true, false); return o.matrixWorld },
    movePiece: (ad, m) => { xrPiece = m ? { ad, m } : null; if (!m) { const o = objVal(ad); o.quaternion.identity(); o.scale.set(1, 1, 1) } },
    piecePlace: (ad, h) => sword.localToWorld(h.copy(pieceCenter.get(ad)!)),
    pieceDistance: ad => xrPiece ? sword.localToWorld(boxCenter.copy(pieceCenter.get(ad)!)).distanceTo(pieceCenter.get(ad)!.clone().applyMatrix4(xrPiece.m)) : Infinity,
    seatPiece: () => { xrHandSeated = true; command('clink') },
    floor: v => { inspectFloor.visible = v },
    sessionStarted: () => {
      cancel(); carry = null; cameraTrace.reset(); targetTrace.reset(); shake.x = shake.v = 0
      markers.forEach(({ b }) => { b.hidden = true }); action.hidden = true; preview.visible = false
      // Quest için: gölge haritası ve tepe ışığı kapanır, parçacık azalır. Bir kez gölgelendirici derlenir.
      key.castShadow = false; rim.visible = false; particles.decrease(true)
      area.dataset.xr = '1'; stageView(); xrStamp(); xrChanged?.(true)
    },
    sessionEnded: () => {
      cancel(); key.castShadow = true; rim.visible = true; particles.decrease(false)
      // Three.js near/far ve görüş açısını XR'dan kalan değerde bırakır.
      camera.fov = 42; camera.zoom = 1; camera.near = .025; camera.far = 70
      delete area.dataset.xr
      stageView(); camera.position.copy(cameraGoal); camera.quaternion.identity(); controls.target.copy(targetGoal); sword.position.copy(swordGoal); sword.rotation.copy(swordRotation); carry = null; swordTrace.reset(); cameraTrace.reset(); targetTrace.reset()
      size(); controls.update(); lastVal = performance.now(); slow = 0; emit(); xrChanged?.(false)
    },
    stamp: (ad, v) => { area.dataset[ad] = v },
  })
  function frame() {
    const xrOpen = renderer.xr.isPresenting
    if (disposed || (document.hidden && !xrOpen)) return
    const now = performance.now(), raw = (now - lastVal) / 1000, realDt = Math.min(.1, raw); lastVal = now
    if (halt > 0) halt -= realDt
    const dt = halt > 0 ? realDt * .08 : realDt; time += dt; publish += realDt
    if (xrOpen) xr.frame(realDt)
    if (raw > .045) slow += raw; else slow = Math.max(0, slow - realDt * .5)
    if (!xrOpen && slow > 1.5 && tier < 2) { tier++; renderer.setPixelRatio(tier === 1 ? .85 : .65); composer.setPixelRatio(tier === 1 ? .85 : .65); bloom.enabled = tier < 2; slow = 0; size() }
    if (d.master) {
      masterTime += Math.min(.5, raw)
      if (d.stage === 1 || d.again) heatUp(d, dt * 3, true)
      if (d.stage === 2 && !d.again) { d.regions.forEach((b, i) => { b.heat = 900; b.p = Math.max(b.p, limit(masterTime / masterTotal * 1.3 - i * .025)) }); selected = Math.min(11, Math.floor(masterTime / masterTotal * 12)); if (hammerTime >= HAMMER_TURN) hammerTime = 0 }
      if (d.stage === 3) { holdWater = true; d.regions.forEach(b => { b.heat = Math.max(30, 830 * (1 - masterTime / masterTotal)) }) }
      if (d.stage === 4) { wristU = limit(masterTime / masterTotal); selected = Math.min(11, Math.floor(wristU * 12)); d.regions[selected].skin = .6; d.regions[selected].shell = 0 }
      if (d.stage === 5) { const n = Math.min(7, Math.floor(masterTime / masterTotal * 8)); if (n !== d.attached) d.attached = n }
      if (masterTime >= masterTotal) { d.master = false; if (lastMasterStage === 7) cutObj(); else masterComplete(d); holdWater = false; reheatWater = false; masterTime = 0; emit() }
    } else if (d.stage === 1 || d.again || reheatWater) heatUp(d, dt, holdBellows)
    else if (d.stage === 2) { d.regions.forEach(b => { b.heat = Math.max(20, b.heat - dt * 7) }); if (dragging && hammerTime >= HAMMER_TURN) doHit() }
    else if (d.stage === 3) { if (holdBellows) heatUp(d, dt, true); else if (holdWater) giveWater(d, dt); else d.regions.forEach(b => { b.heat = b.heat + Math.sign(835 - b.heat) * Math.min(Math.abs(835 - b.heat), dt * 80) }) }
    else if (d.stage === 4 && wristHold) { wrist(d, selected, dt); if (time - lastHit > .12) { sound.play('sharpen'); lastHit = time } }
    if (lastStage !== d.stage || lastReheat !== d.again) { transitionTime = 0; lastStage = d.stage; lastReheat = d.again; cancel(); stageView(); startCarry(); emit(); xr.stageChanged() }
    if (d.stage === 2 || d.stage === 3 || d.stage === 4) stageView()
    transitionTime += dt

    // Gösterilen dövme ilerlemesi hedefine ezilir gibi kısa sürede ulaşır; çelik sıçrayarak uzamaz.
    for (let i = 0; i < 12; i++) { const b = d.regions[i]; image[i].p += (b.p - image[i].p) * Math.min(1, dt * 16); if (Math.abs(b.p - image[i].p) < .002) image[i].p = b.p; image[i].heat = b.heat; image[i].shell = b.shell; image[i].skin = b.skin }
    deform.update(image)

    // Kamera ve kılıç: sönümlü takip; uzak aşama geçişi yukarı kavisli taşımayla.
    if (!xrOpen && (d.stage !== 6 || transitionTime < 1.4)) { if (az) { camera.position.copy(cameraGoal); controls.target.copy(targetGoal) } else { cameraTrace.follow(camera.position, cameraGoal, .5, dt); targetTrace.follow(controls.target, targetGoal, .42, dt) } }
    controls.enabled = d.stage === 6 && transitionTime >= 1.4
    targetQ.setFromEuler(swordRotation)
    if (cut) cutFrame(dt)
    else if (carry) {
      carry.t = Math.min(1, carry.t + dt / carry.sure); const k = az ? 1 : easy.innerOuter(carry.t)
      curvedPath(sword.position, carry.a, swordGoal, k, carry.bend); sword.quaternion.slerpQuaternions(carry.q, targetQ, k)
      if (carry.t >= 1) { carry = null; swordTrace.reset() }
    } else {
      if (az) sword.position.copy(swordGoal); else swordTrace.follow(sword.position, swordGoal, d.stage === 4 ? .045 : d.stage === 7 ? .22 : .1, dt)
      sword.quaternion.slerp(targetQ, az ? 1 : 1 - Math.exp(-dt * 11))
    }

    if (xrOpen && !cut && xr.placeSword()) carry = null

    // Çekiç: kalkış, hızlanan iniş, darbe, sekme, bekleme.
    hammerTime += dt
    const ht = hammerTime; let angle: number
    if (ht < .17) angle = T.MathUtils.lerp(HAMMER_WAIT, 1.15, easy.outer(ht / .17))
    else if (ht < HAMMER_BLOW) angle = T.MathUtils.lerp(1.15, 0, easy.inner((ht - .17) / (HAMMER_BLOW - .17)))
    else if (ht < .36) angle = Math.sin((ht - HAMMER_BLOW) / (.36 - HAMMER_BLOW) * Math.PI * .5) * .34
    else angle = T.MathUtils.lerp(.34, HAMMER_WAIT, easy.innerOuter(interrupt(ht, .36, HAMMER_TURN)))
    hammer.rotation.x = angle; hammer.position.x = (ht < HAMMER_BLOW ? .012 : 0)
    if (!impacted && ht >= HAMMER_BLOW) { impacted = true; if (d.stage === 2 && !d.again) hammerBlow() }
    bowStep(bounce, 900, 26, dt)
    if (d.stage === 2 && !carry) sword.position.y += bounce.x
    flash *= Math.exp(-dt * 16)

    // Kamera sarsıntısı: yay, tek darbede sönen.
    bowStep(shake, 1500, 32, realDt)
    if (!xrOpen) camera.position.y += shake.x

    tongs.visible = d.stage >= 1 && d.stage <= 3
    eggShape.visible = d.stage === 0; sword.visible = d.stage !== 0
    const heat = average(d, 'heat'); bladeLight.position.copy(sword.position).add(new T.Vector3(.2, .14, 0)); bladeLight.intensity = Math.max(0, (heat - 500) / 40) + flash * 7

    // Körük ve ateş birbirine bağlı, ani değişim yok.
    bellowsPower += ((holdBellows ? 1 : 0) - bellowsPower) * Math.min(1, dt * 5)
    if (holdBellows) bellowsPhase += dt * 7.5
    bellows.scale.y = 1 - .26 * bellowsPower * (.5 - .5 * Math.cos(bellowsPhase))
    fire.intensity = (24 + Math.sin(time * 9) * 3 + Math.sin(time * 17) * 2) * (1 + bellowsPower * .9)
    ;(kor.material as T.MeshStandardMaterial).emissiveIntensity = 1.7 + bellowsPower * (2.3 + Math.sin(bellowsPhase) * .6)
    if (Math.random() < dt * (8 + bellowsPower * 40)) particles.spray(new T.Vector3(-2.25 + (Math.random() - .5) * 1.1, .98, -2 + (Math.random() - .5) * .5), new T.Vector3(0, 1, 0), 1, .5, 1.5)

    // Bileme: taş yavaşça hızlanır, kıvılcım dönüş yönünde temas noktasından fışkırır.
    if (d.stage === 4) {
      const targetSpeed = wristHold || d.master ? 16 : 2.5; wheelSpeed += (targetSpeed - wheelSpeed) * Math.min(1, dt * (wristHold ? 2.4 : .9))
      stone.rotateY(wheelDir * wheelSpeed * dt)
      const pressing = wristHold || d.master; contact += ((pressing ? 1 : 0) - contact) * Math.min(1, dt * 14)
      if (pressing && contact > .6) {
        const point = new T.Vector3(STONE_X, STONE_TOP, STONE_Z)
        particles.spray(point, new T.Vector3(sparkDir, .16, 0), az ? 1 : 7, .5, 4.6 + wheelSpeed * .12)
        bladeLight.position.copy(point); bladeLight.intensity = Math.max(bladeLight.intensity, 4 + Math.random() * 9)
        const b = d.regions[selected]; b.heat = Math.min(b.heat, 700)
      }
    } else wheelSpeed = 0

    // Su verme: daldırınca sıçrama, namlu boyunca buhar.
    if (d.stage === 3 && (holdWater || d.master)) {
      if (!wasInWater) { wasInWater = true; sound.play('water'); particles.spray(new T.Vector3(1.95, .42, .15), new T.Vector3(0, 1, 0), 60, 1.3, 2.2, 1) }
      const hot = Math.max(0, average(d, 'heat') - 100) / 700
      if (Math.random() < .55 * Math.min(1, hot + .15)) particles.emet(new T.Vector3(1.48 + Math.random() * 1.0, .43, .15), 2, true)
    } else if (!holdWater) wasInWater = false

    // Kuşanma: sıradaki parça yanında süzülür; takılınca kavisle gelip tık diye oturur.
    if (d.attached !== lastClink) { clinkTime = xrHandSeated ? .44 : 0; xrHandSeated = false; lastClink = d.attached; clinkLanded = false }
    clinkTime += dt
    if (!clinkLanded && clinkTime >= .44 && d.attached > 0) { clinkLanded = true; sound.play('ting'); const s = sword.localToWorld(actuals.get(pieces[d.attached - 1])!.clone()); particles.spray(s, new T.Vector3(0, .6, 0), 12, 1.3, .9) }
    extras.forEach(o => {
      const id = pieces.indexOf(o.name), count = d.attached, place = actuals.get(o.name)!
      o.visible = d.stage >= 5 && (o.name === 'Blade_Inlay' ? count >= 7 : o.name === 'Sap' ? true : id <= count)
      o.position.copy(place); o.rotation.z = 0
      if (d.stage !== 5) return
      if (id === count) { o.position.y += .12 + Math.sin(time * 2.4) * .006; o.position.z += .14 }
      if (id === count - 1 && clinkTime < .44) {
        const k = az ? 1 : easy.outerBack(clinkTime / .44)
        o.position.y += .12 * (1 - k); o.position.z += .14 * (1 - k)
        if (o.name.startsWith('Percin')) o.rotation.z = (1 - k) * 7
      }
      if (xrPiece?.ad === o.name) inverseMat.copy(sword.matrixWorld).invert().multiply(xrPiece.m).decompose(o.position, o.quaternion, o.scale)
    })
    gold = d.attached >= 7 ? Math.min(1, gold + dt * .7) : 0; inlay.opacity = gold; crack.visible = d.crack_

    targets.update(realDt, d.stage === 7)
    particles.update(dt); if (!xrOpen) controls.update(); scene.updateMatrixWorld(true)
    updateTrace(dt)
    if (xrOpen) {
      // Efekt zinciri yok; HTML görünmez olduğundan ekran hesapları da yok.
      renderer.render(scene, camera)
      if (publish > .15) { publish = 0; xrStamp() }
      return
    }
    markers.forEach(({ b, p }) => { b.hidden = d.stage !== 6; if (!b.hidden) { const q = screen(sword.localToWorld(p.clone())); b.style.left = `${q.x}px`; b.style.top = `${q.y - 18}px` } })
    action.hidden = !(d.stage === 0 || d.stage === 5 && d.attached < 7)
    if (!action.hidden) { const obj = d.stage === 0 ? eggShape : objVal(pieces[d.attached]); const q = screen(obj.getWorldPosition(new T.Vector3())); action.style.left = `${q.x}px`; action.style.top = `${q.y - 35}px`; action.textContent = d.stage === 0 ? '01 · Külçeyi al' : `${d.attached + 1} · Parçayı yerleştir` }
    const hitPos = screen(sword.localToWorld(new T.Vector3(deform.center(d.regions, selected), 0, .006)))
    area.dataset.strikeX = String(hitPos.x); area.dataset.strikeY = String(hitPos.y)
    const hm = targetCenter[d.target], hq = screen(hm), hq2 = screen(new T.Vector3(hm.x + 1, hm.y, hm.z))
    area.dataset.targetX = String(hq.x); area.dataset.targetY = String(hq.y); area.dataset.targetScale = String(hq2.x - hq.x)
    area.dataset.lengthVal = deform.lengthVal().toFixed(4); area.dataset.attached = String(extras.filter(o => o.visible).length); area.dataset.detachedOne = String(targets.detachedOne()); area.dataset.damage = targets.damages().map(v => v.toFixed(2)).join(','); area.dataset.stage = String(d.stage); area.dataset.regions = d.regions.map(b => b.p.toFixed(2)).join(','); area.dataset.hammer = hammerTime >= HAMMER_TURN ? '1' : '0'; area.dataset.quality = String(tier)
    bloom.strength = .18 + Math.max(0, heat - 500) / 2200
    composer.render(); if (publish > .15) { publish = 0; emit() }
  }
  collect(scene); renderer.setAnimationLoop(frame); emit()
  return { startXr: async () => { sound.start(); await xr.start() }, command, hold, sec: id => { selected = limit(id, 0, 11); d.selected = selected; wristU = (selected + .5) / 12; stageView(); emit() }, target: id => { d.target = limit(id, 0, 2); stageView(); emit() }, sound: v => { sound.ac(v) }, zoom: ratio => { camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target) }, rotate: x => { const v = camera.position.clone().sub(controls.target); v.applyAxisAngle(new T.Vector3(0, 1, 0), x); camera.position.copy(controls.target).add(v) }, clear: () => {
    disposed = true; xr.clear(); renderer.setAnimationLoop(null); cancel(); observer.disconnect(); controls.dispose(); sound.dispose(); particles.dispose(); targets.clear(); iz.remove(); previewGeo.dispose(); (preview.material as T.Material).dispose()
    area.removeEventListener('pointerdown', pointerDown); area.removeEventListener('pointermove', pointerMove); area.removeEventListener('pointerup', pointerUp); area.removeEventListener('pointercancel', cancel); area.removeEventListener('lostpointercapture', cancel); area.removeEventListener('keydown', keydown); area.removeEventListener('keyup', keyup); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost)
    markers.forEach(({ b, click }) => { b.removeEventListener('click', click); b.remove() }); action.removeEventListener('click', actionClick); action.remove(); collect(scene); geometries.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); env.dispose(); composer.passes.forEach(p => p.dispose()); composer.dispose(); renderer.dispose(); renderer.domElement.remove()
  } }
}
