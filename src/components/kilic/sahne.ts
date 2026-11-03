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
import { ilkOyun, ortalama, ilerle, isit, vur, bile, suVer, tak, ustaTamamla, parcalar, sinir } from './durum'
import type { Oyun } from './durum'
import { namluHazirla } from './dovme'
import { parcacikHavuzu } from './parcacik'
import { sesOlustur } from './ses'
import { kesimHesapla } from './test'
import { kilicParcaNotlari } from '../../data/kilic'
export type Komut = 'al' | 'devam' | 'yeniden' | 'usta' | 'vur' | 'tak' | 'kes' | 'hedefleri-yenile' | 'bastan'
export interface KilicSahnesi {
  komut: (ad: Komut) => void; tut: (ad: 'koruk' | 'su' | 'bile', v: boolean) => void
  sec: (id: number) => void; hedef: (id: number) => void; ses: (ac: boolean) => void
  zoom: (oran: number) => void; dondur: (x: number) => void; temizle: () => void
}
export async function sahneOlustur(alan: HTMLElement, bildir: (d: Oyun) => void, hata: () => void, not: (id: number) => void): Promise<KilicSahnesi> {
  const scene = new T.Scene(); scene.background = new T.Color('#11191a'); scene.fog = new T.FogExp2('#11191a', .025)
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.localClippingEnabled = true
  const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
  const software = debug && /swiftshader|llvmpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
  renderer.setPixelRatio(software ? .8 : Math.min(devicePixelRatio, 1.6)); renderer.domElement.setAttribute('aria-hidden', 'true')
  const geometriler = new Set<T.BufferGeometry>(), mats = new Set<T.Material>(), textures = new Set<T.Texture>()
  const collect = (root: T.Object3D) => root.traverse(o => { if (o instanceof T.Mesh || o instanceof T.Line) { geometriler.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { mats.add(m); for (const v of Object.values(m)) if (v instanceof T.Texture) textures.add(v) } } })
  let modeller: Awaited<ReturnType<GLTFLoader['loadAsync']>>[]
  try {
    const sonuc = await Promise.allSettled([new GLTFLoader().loadAsync('/modeller/kilic.glb'), new GLTFLoader().loadAsync('/modeller/kilic-atolye.glb')])
    if (sonuc.some(v => v.status === 'rejected')) {
      sonuc.forEach(v => { if (v.status === 'fulfilled') collect(v.value.scene) }); geometriler.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      throw new Error('Atölye modelleri yüklenemedi.')
    }
    modeller = sonuc.map(v => (v as PromiseFulfilledResult<Awaited<ReturnType<GLTFLoader['loadAsync']>>>).value)
  } catch (e) { renderer.dispose(); throw e }
  const [kilic, atolye] = modeller.map(v => v.scene)
  scene.add(atolye, kilic); collect(scene)
  const obj = (name: string) => { const o = scene.getObjectByName(name); if (!o) throw new Error(`Model parçası eksik: ${name}`); return o }
  const mesh = (name: string) => { const o = scene.getObjectByName(name); if (!(o instanceof T.Mesh)) throw new Error(`Model parçası eksik: ${name}`); return o }
  const namlu = mesh('Namlu'), deform = namluHazirla(namlu), yumurta = mesh('Kilic_Yumurtasi'), kor = mesh('Kor'), koruk = mesh('Koruk_Deri'), tas = mesh('Bileme_Tasi')
  const ekler = ['Namlu_Kakma', 'Balcak', 'Sap', 'Kabza_Sol', 'Kabza_Sag', ...parcalar.slice(3)].map(obj)
  const asillar = new Map(ekler.map(o => [o.name, o.position.clone()]))
  ekler.forEach(o => o.traverse(c => { if (c instanceof T.Mesh) c.material = (c.material as T.MeshStandardMaterial).clone() }))
  const kakma = mesh('Namlu_Kakma').material as T.MeshStandardMaterial; kakma.transparent = true
  const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment(), env = pmrem.fromScene(room)
  scene.environment = env.texture; scene.environmentIntensity = .38; room.dispose(); pmrem.dispose()
  const hemi = new T.HemisphereLight('#bad6e5', '#3d2619', 1.05); scene.add(hemi)
  const key = new T.DirectionalLight('#d8e8ff', 3); key.position.set(2, 6, 4); key.castShadow = true; key.shadow.mapSize.set(software ? 512 : 1024, software ? 512 : 1024); key.shadow.camera.left = key.shadow.camera.bottom = -7; key.shadow.camera.right = key.shadow.camera.top = 7; key.shadow.normalBias = .018; scene.add(key)
  const fire = new T.PointLight('#ff681e', 65, 9, 2); fire.position.set(-2.25, 1.3, -1.8); scene.add(fire)
  const bladeLight = new T.PointLight('#ff7825', 0, 2.5); scene.add(bladeLight)
  const rim = new T.SpotLight('#f4d1a4', 22, 8, .6, .6); rim.position.set(1, 4, 1); rim.target = kilic; scene.add(rim)
  atolye.traverse(o => { if (o instanceof T.Mesh) { o.receiveShadow = true; o.castShadow = !['Su', 'Kor'].includes(o.name) } }); kilic.traverse(o => { if (o instanceof T.Mesh) o.castShadow = true })
  const camera = new T.PerspectiveCamera(42, 1, .025, 70)
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = .65; controls.maxDistance = 4
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new T.Vector2(800, 600), .3, .45, 1.15); composer.addPass(bloom); const fxaa = new ShaderPass(FXAAShader); composer.addPass(fxaa); composer.addPass(new OutputPass())
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches, particles = parcacikHavuzu(scene, az), ses = sesOlustur()
  const hammer = new T.Group(); hammer.position.set(0, 1.32, -.1); scene.add(hammer); scene.updateMatrixWorld(true); hammer.attach(mesh('Cekic_Bas')); hammer.attach(mesh('Cekic_Sap'))
  const tongs = new T.Group(); scene.add(tongs); tongs.attach(mesh('Masa_1')); tongs.attach(mesh('Masa_2')); tongs.visible = false
  const tongsStart = tongs.position.clone()
  const crackGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(.6, -.027, .006), new T.Vector3(.61, -.01, .006), new T.Vector3(.597, .002, .006), new T.Vector3(.62, .023, .006)])
  const crack = new T.Line(crackGeo, new T.LineBasicMaterial({ color: '#111111' })); kilic.add(crack)
  const stand = new T.Mesh(new T.CylinderGeometry(.8, .9, .08, 64), new T.MeshStandardMaterial({ color: '#182023', metalness: .45, roughness: .4 })); stand.scale.set(.65, 1, .65); stand.position.set(.35, 1.15, 0); stand.visible = false; stand.receiveShadow = true; scene.add(stand)
  const supports = new T.Group(); scene.add(supports)
  for (const x of [.13, .69]) { const pole = new T.Mesh(new T.CylinderGeometry(.006, .009, .42, 12), new T.MeshStandardMaterial({ color: '#a28152', metalness: .8, roughness: .28 })); pole.position.set(x, 1.38, -.015); supports.add(pole) }
  let d = ilkOyun(), disposed = false, lastStage = -1, lastReheat = false, korukTut = false, suTut = false, bileTut = false, dragging = false, selected = 0, lastHit = -10, hammerTime = 1, shake = 0, publish = 0, masterTime = 0, masterTotal = 0, lastMasterStage = -1, gold = 0, lastTak = 0, takTime = 1, reheatSu = false
  let transitionTime = 0, time = 0, last = performance.now(), slow = 0, tier = 0, cutTime = 2, cutStart = new T.Vector3(), cutEnd = new T.Vector3()
  let down: { x: number; y: number; t: number } | null = null
  const cameraGoal = new T.Vector3(), targetGoal = new T.Vector3(), swordGoal = new T.Vector3(), swordRotation = new T.Euler()
  const targetNames = ['Hasir_Rulo', 'Test_Kutuk', 'Test_Kumas']
  const broken: { o: T.Mesh; velocity: T.Vector3; age: number; localPlane?: T.Plane }[] = []
  const clippingOriginals = new Set<T.Mesh>()
  const marks = new T.Group(); scene.add(marks)
  const trailGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), trailMat = new T.LineBasicMaterial({ color: '#fff2cf', transparent: true, opacity: 0 }), trail = new T.Line(trailGeo, trailMat); scene.add(trail)
  const markers = kilicParcaNotlari.map((p, i) => {
    const b = document.createElement('button'); b.className = 'kilic-nokta'; b.textContent = String(i + 1); b.setAttribute('aria-label', `${i + 1}. ${p.baslik}`); const click = () => not(i); b.addEventListener('click', click); alan.append(b); return { b, p: new T.Vector3(...p.konum), click }
  })
  const action = document.createElement('button'); action.className = 'kilic-sahne-isaret'; alan.append(action)
  const ray = new T.Raycaster(), pointer = new T.Vector2()
  const emit = () => { if (!disposed) bildir({ ...d, bolgeler: d.bolgeler.map(b => ({ ...b })), sonuclar: [...d.sonuclar] }) }
  function resetTargets() {
    broken.forEach(b => { scene.remove(b.o); (b.o.material as T.Material).dispose() }); broken.length = 0
    clippingOriginals.forEach(o => { const m = o.material as T.MeshStandardMaterial; m.clippingPlanes = null; m.needsUpdate = true }); clippingOriginals.clear()
    marks.children.slice().forEach(o => { if (o instanceof T.Mesh) { o.geometry.dispose(); (o.material as T.Material).dispose() } marks.remove(o) }); d.sonuclar = []
  }
  function stageView() {
    const a = d.asama, heating = a === 1 || d.yeniden || reheatSu
    controls.enabled = a === 6
    swordRotation.set(-Math.PI / 2, 0, 0)
    if (a === 0) { cameraGoal.set(5, 3, 2); targetGoal.set(1.7, 1, -2); swordGoal.set(2.8, .95, -2.5) }
    else if (heating) { cameraGoal.set(-.8, 2.05, .65); targetGoal.set(-2.35, 1.02, -1.9); swordGoal.set(-2.7, 1.01, -2) }
    else if (a === 2) { cameraGoal.set(.55, 1.65, 1.25); targetGoal.set(.05, .92, -.12); swordGoal.set(-deform.merkez(d.bolgeler, selected), .9, -.1) }
    else if (a === 3) { cameraGoal.set(3.4, 2.25, 2.2); targetGoal.set(1.95, .62, .1); swordGoal.set(1.42, suTut || d.daldirma > 0 ? .39 : 1, .15) }
    else if (a === 4) { cameraGoal.set(3.8, 2, .7); targetGoal.set(3.05, 1.03, -1.15); swordGoal.set(3.05 - deform.merkez(d.bolgeler, selected), 1.16, -1.2) }
    else if (a === 5) { cameraGoal.set(3.25, 2.4, -.3); targetGoal.set(2.85, 1, -2.45); swordGoal.set(2.45, 1.04, -2.45) }
    else if (a === 6) { cameraGoal.set(.5, 1.85, 2.05); targetGoal.set(.42, 1.62, 0); swordGoal.set(0, 1.62, 0); swordRotation.set(.18, -.1, .13) }
    else { const x = [12, 14, 16.15][d.hedef]; cameraGoal.set(x + .8, 2.1, 3); targetGoal.set(x, 1, 0); swordGoal.set(x - .75, .85, .9); swordRotation.set(.1, 0, -.55) }
    atolye.visible = a !== 6; supports.visible = stand.visible = a === 6; rim.intensity = a === 6 ? 8 : 22; hammer.visible = a === 2 && !d.yeniden
    scene.environmentIntensity = a === 7 ? .9 : a === 6 ? .9 : .42
    hemi.intensity = a === 7 ? 2 : a === 6 ? .5 : 1.05; key.intensity = a === 7 ? 4 : a === 6 ? 1.5 : 3
    key.position.x = a === 7 ? 14 : 2; key.target.position.set(a === 7 ? 14 : 0, 0, 0); scene.add(key.target)
    ;(scene.fog as T.FogExp2).density = a === 7 ? .009 : .025
    scene.background = new T.Color(a === 7 ? '#879c9d' : a === 6 ? '#0d161a' : '#11191a')
  }
  function doHit() {
    if (time - lastHit < .16 || d.asama !== 2 || d.yeniden || d.usta) return
    lastHit = time; hammerTime = 0; vur(d, selected); particles.emet(new T.Vector3(0, .94, -.1), 48); ses.cal('cekic'); shake = az ? 0 : .022; deform.guncelle(d.bolgeler); stageView(); emit()
  }
  function cut(dx = 1, dy = 0, sec = .25) {
    if (d.asama !== 7 || d.usta || cutTime < .5 || d.kirildi) return
    const result = kesimHesapla(d, dx, dy, sec), target = mesh(targetNames[d.hedef]); cutTime = 0
    const center = target.getWorldPosition(new T.Vector3()); if (d.hedef === 0) center.y = 1.1; if (d.hedef === 2) center.y = 1.15
    const v = new T.Vector3(dx, -dy, 0).normalize().multiplyScalar(.75); cutStart.copy(center).sub(v); cutEnd.copy(center).add(v)
    if (result.kesildi && !clippingOriginals.has(target)) {
      const plane = new T.Plane(new T.Vector3(0, -1, 0), center.y)
      target.material = (target.material as T.MeshStandardMaterial).clone(); const material = target.material as T.MeshStandardMaterial; material.clippingPlanes = [plane]; material.clipShadows = true; clippingOriginals.add(target); collect(target)
      const clone = target.clone(); clone.material = material.clone(); (clone.material as T.MeshStandardMaterial).clippingPlanes = [plane.clone().negate()]; scene.add(clone); clone.updateMatrixWorld(true); const localPlane = plane.clone().negate().applyMatrix4(clone.matrixWorld.clone().invert()); broken.push({ o: clone, velocity: new T.Vector3(.65, .5, .4), age: 0, localPlane }); collect(clone)
    } else if (d.hedef === 1) {
      const scar = new T.Mesh(new T.BoxGeometry(.45, .008 + result.derinlik * .04, .012), new T.MeshStandardMaterial({ color: '#24150e', roughness: 1 })); scar.position.copy(center); scar.position.z += .185; scar.rotation.z = Math.atan2(-dy, dx); marks.add(scar)
    }
    if (d.hedef === 2 && !result.kesildi) target.rotation.x = .2
    if (result.kirildi) { const chip = namlu.clone(); chip.material = (namlu.material as T.Material).clone(); kilic.updateMatrixWorld(true); chip.applyMatrix4(namlu.matrixWorld); chip.scale.x *= .4; scene.add(chip); broken.push({ o: chip, velocity: new T.Vector3(.4, .8, .2), age: 0 }); namlu.visible = false; collect(chip) }
    particles.emet(center, result.kesildi ? 12 : 35); ses.cal(result.kesildi ? 'kesim' : 'ting'); emit()
  }
  function komut(ad: Komut) {
    ses.baslat()
    if (ad === 'bastan') { resetTargets(); d = ilkOyun(); d.secili = selected = 0; cutTime = 2; lastTak = 0; namlu.visible = true; lastStage = -1; gold = 0; masterTime = 0; reheatSu = false; korukTut = suTut = bileTut = false }
    else if (ad === 'hedefleri-yenile') resetTargets()
    else if (d.usta) return
    else if (ad === 'usta') { d.usta = true; masterTime = 0; masterTotal = 2.8; lastMasterStage = d.asama; d.mesaj = 'Usta çalışıyor… Orta kaliteyle tamamlanıyor.' }
    else if (ad === 'al' && d.asama === 0) { ilerle(d); tongs.visible = true; tongs.position.copy(tongsStart) }
    else if (ad === 'devam') {
      if (d.asama === 1 && ortalama(d, 'isi') >= 750) ilerle(d)
      else if (d.yeniden && ortalama(d, 'isi') >= 750) d.yeniden = false
      else if (d.asama === 6) ilerle(d)
    }
    else if (ad === 'yeniden') { if (d.asama === 2) d.yeniden = true; if (d.asama === 3) reheatSu = !reheatSu }
    else if (ad === 'vur') doHit()
    else if (ad === 'tak' && d.asama === 5) { tak(d); takTime = 0; ses.cal('ting') }
    else if (ad === 'kes') cut()
    stageView(); emit()
  }
  action.addEventListener('click', actionClick)
  function actionClick() { if (d.asama === 0) komut('al'); else if (d.asama === 5) komut('tak') }
  function tut(ad: 'koruk' | 'su' | 'bile', v: boolean) {
    if (v) ses.baslat()
    if (ad === 'koruk') { korukTut = v; ses.koruk(v); if (d.asama === 3) reheatSu = v }
    if (ad === 'su') { suTut = v; if (v) { reheatSu = false; ses.cal('su'); particles.emet(new T.Vector3(1.95, .46, .15), 25, true) } }
    if (ad === 'bile') bileTut = v
    stageView()
  }
  function raycast(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera)
    return ray.intersectObject(namlu, false)[0]
  }
  function region(e: PointerEvent) {
    const hit = raycast(e)
    if (hit) { selected = sinir(Math.floor((hit.uv1?.x ?? 0) * 12), 0, 11) }
    else {
      const rect = alan.getBoundingClientRect(); selected = sinir(Math.floor((e.clientX - rect.left) / (rect.width - (rect.width > 700 ? 340 : 0)) * 12), 0, 11)
    }
    d.secili = selected
  }
  function pointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button') || e.button !== 0) return
    ses.baslat(); alan.focus({ preventScroll: true }); down = { x: e.clientX, y: e.clientY, t: performance.now() }; dragging = true
    if (d.asama === 2 && !d.yeniden) { region(e); doHit() }
    if (d.asama === 4) { region(e); tut('bile', true) }
    if (d.asama === 1 || d.yeniden || reheatSu) tut('koruk', true)
    if (d.asama !== 6) alan.setPointerCapture(e.pointerId)
    if (d.asama === 0) { raycast(e); if (ray.intersectObject(yumurta).length) komut('al') }
    if (d.asama === 5) { raycast(e); const next = obj(parcalar[d.takilan]); if (ray.intersectObject(next).length) komut('tak') }
  }
  function pointerMove(e: PointerEvent) {
    if (dragging && d.asama === 2) { region(e); doHit() }
    if (dragging && d.asama === 4) region(e)
    if (!dragging) { raycast(e); const hit = ray.intersectObjects([yumurta, ...(d.asama === 5 ? [obj(parcalar[Math.min(6, d.takilan)])] : [])])[0]; alan.style.cursor = hit || d.asama === 2 || d.asama === 4 || d.asama === 7 ? 'crosshair' : 'grab'; (yumurta.material as T.MeshStandardMaterial).emissive.set(hit?.object === yumurta ? '#30220e' : '#000000') }
  }
  function pointerUp(e: PointerEvent) {
    if (down && d.asama === 7 && dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 15) cut((e.clientX - down.x) / alan.clientWidth, (e.clientY - down.y) / alan.clientHeight, (performance.now() - down.t) / 1000)
    dragging = false; down = null; tut('koruk', false); tut('bile', false); if (alan.hasPointerCapture(e.pointerId)) alan.releasePointerCapture(e.pointerId)
  }
  function cancel() { dragging = false; down = null; korukTut = suTut = bileTut = false; ses.koruk(false) }
  function keydown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); selected = (selected + (e.key === 'ArrowLeft' ? 11 : 1)) % 12; d.secili = selected; if (d.asama === 6) kilic.rotation.y += e.key === 'ArrowLeft' ? -.1 : .1; else stageView(); emit() }
    if (e.key === 'Enter') { e.preventDefault(); if (d.asama === 2) doHit(); else if (d.asama === 0) komut('al'); else if (d.asama === 5) komut('tak'); else if (d.asama === 7) cut() }
    if (e.code === 'Space') { e.preventDefault(); tut(d.asama === 3 && !reheatSu ? 'su' : d.asama === 4 ? 'bile' : 'koruk', true) }
    if (e.key === '+' || e.key === '-') camera.position.sub(controls.target).multiplyScalar(e.key === '+' ? .9 : 1.1).add(controls.target)
  }
  function keyup(e: KeyboardEvent) { if (e.code === 'Space') { e.preventDefault(); cancel() } }
  function contextLost(e: Event) { e.preventDefault(); cancel(); renderer.setAnimationLoop(null); ses.bekle(true); hata() }
  function visibility() { cancel(); if (document.hidden) { renderer.setAnimationLoop(null); ses.bekle(true) } else { last = performance.now(); renderer.setAnimationLoop(frame); ses.bekle(false) } }
  alan.addEventListener('pointerdown', pointerDown); alan.addEventListener('pointermove', pointerMove); alan.addEventListener('pointerup', pointerUp); alan.addEventListener('pointercancel', cancel); alan.addEventListener('lostpointercapture', cancel); alan.addEventListener('keydown', keydown); alan.addEventListener('keyup', keyup); window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', visibility); renderer.domElement.addEventListener('webglcontextlost', contextLost)
  function size() { const w = alan.clientWidth, h = alan.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); fxaa.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio())); camera.aspect = w / h; camera.setViewOffset(w, h, w > 700 ? 165 : 0, 0, w, h); camera.updateProjectionMatrix() }
  const observer = new ResizeObserver(size); alan.prepend(renderer.domElement); observer.observe(alan); size(); deform.guncelle(d.bolgeler); stageView(); camera.position.copy(cameraGoal); controls.target.copy(targetGoal); kilic.position.copy(swordGoal); kilic.rotation.copy(swordRotation)
  function screen(p: T.Vector3) { const a = p.clone().project(camera); return { x: (a.x + 1) * alan.clientWidth / 2, y: (1 - a.y) * alan.clientHeight / 2, z: a.z } }
  function frame() {
    if (disposed || document.hidden) return
    const now = performance.now(), raw = (now - last) / 1000, dt = Math.min(.15, raw); last = now; time += dt; publish += dt
    if (raw > .045) slow += raw; else slow = Math.max(0, slow - dt * .5)
    if (slow > 1.5 && tier < 2) { tier++; renderer.setPixelRatio(tier === 1 ? .85 : .65); composer.setPixelRatio(tier === 1 ? .85 : .65); bloom.enabled = tier < 2; slow = 0; size() }
    if (d.usta) {
      masterTime += Math.min(.5, raw)
      if (d.asama === 1 || d.yeniden) isit(d, dt * 3, true)
      if (d.asama === 2 && !d.yeniden) { d.bolgeler.forEach((b, i) => { b.isi = 900; b.p = Math.max(b.p, sinir(masterTime / masterTotal * 1.3 - i * .025)) }); if (time - lastHit > .2) { lastHit = time; hammerTime = 0; particles.emet(new T.Vector3(0, .94, -.1), 16); ses.cal('cekic') } }
      if (d.asama === 3) { suTut = true; d.bolgeler.forEach(b => { b.isi = Math.max(30, 830 * (1 - masterTime / masterTotal)) }); if (Math.random() < .3) particles.emet(new T.Vector3(1.95, .45, .15), 3, true) }
      if (d.asama === 4) { selected = Math.min(11, Math.floor(masterTime / masterTotal * 12)); d.bolgeler[selected].cilt = .6; particles.emet(new T.Vector3(3.05, 1.16, -1.2), 3) }
      if (d.asama === 5) { const n = Math.min(7, Math.floor(masterTime / masterTotal * 8)); if (n !== d.takilan) { d.takilan = n; takTime = 0 } }
      if (masterTime >= masterTotal) { d.usta = false; if (lastMasterStage === 7) cut(); else ustaTamamla(d); suTut = false; reheatSu = false; masterTime = 0; emit() }
    } else if (d.asama === 1 || d.yeniden || reheatSu) isit(d, dt, korukTut)
    else if (d.asama === 2) d.bolgeler.forEach(b => { b.isi = Math.max(20, b.isi - dt * 7) })
    else if (d.asama === 3) { if (korukTut) isit(d, dt, true); else if (suTut) { suVer(d, dt); if (Math.random() < .3) particles.emet(new T.Vector3(1.95, .45, .15), 3, true) } else d.bolgeler.forEach(b => { b.isi = b.isi + Math.sign(835 - b.isi) * Math.min(Math.abs(835 - b.isi), dt * 80) }) }
    else if (d.asama === 4 && bileTut) { bile(d, selected, dt); particles.emet(new T.Vector3(3.05, 1.16, -1.2), 5); if (time - lastHit > .15) { ses.cal('bileme'); lastHit = time } }
    if (lastStage !== d.asama || lastReheat !== d.yeniden) { transitionTime = 0; lastStage = d.asama; lastReheat = d.yeniden; cancel(); stageView(); emit() }
    if (d.asama === 2 || d.asama === 4 || d.asama === 3) stageView()
    deform.guncelle(d.bolgeler)
    const blend = az ? 1 : 1 - Math.exp(-dt * 4)
    transitionTime += dt
    if (d.asama !== 6 || transitionTime < 1.2) { camera.position.lerp(cameraGoal, blend); controls.target.lerp(targetGoal, blend) }
    controls.enabled = d.asama === 6 && transitionTime >= 1.2
    kilic.position.lerp(swordGoal, blend)
    if (d.asama !== 6 || transitionTime < 1.2) { kilic.rotation.x = T.MathUtils.lerp(kilic.rotation.x, swordRotation.x, blend); kilic.rotation.z = T.MathUtils.lerp(kilic.rotation.z, swordRotation.z, blend); kilic.rotation.y = T.MathUtils.lerp(kilic.rotation.y, swordRotation.y, blend) }
    hammerTime += dt; const swing = hammerTime < .42 ? Math.sin(hammerTime / .42 * Math.PI) : 0; hammer.rotation.z = -.35 * (1 - swing); hammer.position.y = 1.32 + .32 * (1 - swing)
    shake *= .8; if (shake) camera.position.x += Math.sin(time * 120) * shake
    tongs.visible = d.asama === 1 && time > .1; if (tongs.visible) { tongs.position.lerp(new T.Vector3(kilic.position.x + 2.1, .15, kilic.position.z + 1.4), blend) }
    yumurta.visible = d.asama === 0; kilic.visible = d.asama !== 0
    const heat = ortalama(d, 'isi'); bladeLight.position.copy(kilic.position).add(new T.Vector3(.2, .14, 0)); bladeLight.intensity = Math.max(0, (heat - 500) / 40)
    fire.intensity = (24 + Math.sin(time * 9) * 3 + Math.sin(time * 17) * 2) * (korukTut ? 1.8 : 1)
    ;(kor.material as T.MeshStandardMaterial).emissiveIntensity = korukTut ? 4 : 1.8
    koruk.scale.y = korukTut ? .76 + Math.sin(time * 12) * .2 : 1
    if (d.asama === 4) tas.rotation.z += dt * 9
    if (Math.random() < dt * 12) particles.emet(new T.Vector3(-2.25 + (Math.random() - .5) * .9, 1, -2), 1)
    if (d.takilan !== lastTak) { takTime = 0; lastTak = d.takilan } takTime += dt
    ekler.forEach(o => {
      const id = parcalar.indexOf(o.name), count = d.takilan
      o.visible = d.asama >= 5 && (o.name === 'Namlu_Kakma' ? count >= 7 : o.name === 'Sap' ? true : id < count || id === count)
      o.position.copy(asillar.get(o.name)!)
      if (d.asama === 5 && id === count) { o.position.y += .15; o.position.z += .1 }
      if (id === count - 1 && takTime < .6) o.position.z += .15 * (1 - takTime / .6)
    })
    gold = d.takilan >= 7 ? Math.min(1, gold + dt * 1.2) : 0; kakma.opacity = gold; crack.visible = d.catlak
    cutTime += dt
    if (cutTime < .65) { const t = cutTime / .65; kilic.position.copy(cutStart).lerp(cutEnd, t); kilic.position.z += .35; kilic.rotation.z = Math.atan2(cutEnd.y - cutStart.y, cutEnd.x - cutStart.x) - .5; trailGeo.setFromPoints([cutStart, cutStart.clone().lerp(cutEnd, t)]); trailMat.opacity = Math.sin(t * Math.PI) }
    else trailMat.opacity = 0
    broken.forEach(b => {
      if (b.age >= 3) return
      b.age += dt; b.velocity.y -= dt * 3; b.o.position.addScaledVector(b.velocity, dt); b.o.rotation.z -= dt * .8; b.o.updateMatrixWorld(true)
      if (b.localPlane) {
        const plane = (b.o.material as T.MeshStandardMaterial).clippingPlanes![0]
        plane.copy(b.localPlane).applyMatrix4(b.o.matrixWorld)
        const vertices = b.o.geometry.getAttribute('position'), v = new T.Vector3(); let bottom = Infinity
        for (let i = 0; i < vertices.count; i++) { v.fromBufferAttribute(vertices, i); if (b.localPlane.distanceToPoint(v) >= -.001) bottom = Math.min(bottom, v.applyMatrix4(b.o.matrixWorld).y) }
        if (bottom < .04) { b.o.position.y += .04 - bottom; b.velocity.set(0, 0, 0); b.age = 3; b.o.updateMatrixWorld(true); plane.copy(b.localPlane).applyMatrix4(b.o.matrixWorld) }
      } else if (b.o.position.y < .18) { b.o.position.y = .18; b.velocity.set(0, 0, 0); b.age = 3 }
    })
    const cloth = mesh('Test_Kumas'); if (!clippingOriginals.has(cloth)) cloth.rotation.x *= .97
    particles.update(dt); controls.update(); scene.updateMatrixWorld(true)
    markers.forEach(({ b, p }) => { b.hidden = d.asama !== 6; if (!b.hidden) { const q = screen(kilic.localToWorld(p.clone())); b.style.left = `${q.x}px`; b.style.top = `${q.y - 18}px` } })
    action.hidden = !(d.asama === 0 || d.asama === 5 && d.takilan < 7)
    if (!action.hidden) { const nesne = d.asama === 0 ? yumurta : obj(parcalar[d.takilan]); const q = screen(nesne.getWorldPosition(new T.Vector3())); action.style.left = `${q.x}px`; action.style.top = `${q.y - 35}px`; action.textContent = d.asama === 0 ? '01 · Külçeyi al' : `${d.takilan + 1} · Parçayı yerleştir` }
    const hitPos = screen(kilic.localToWorld(new T.Vector3(deform.merkez(d.bolgeler, selected), 0, .006)))
    alan.dataset.vurusX = String(hitPos.x); alan.dataset.vurusY = String(hitPos.y)
    alan.dataset.uzunluk = deform.uzunluk().toFixed(4); alan.dataset.takilan = String(ekler.filter(o => o.visible).length); alan.dataset.ayrilan = String(broken.length); alan.dataset.asama = String(d.asama); alan.dataset.kalite = String(tier)
    bloom.strength = .18 + Math.max(0, heat - 500) / 2200
    composer.render(); if (publish > .15) { publish = 0; emit() }
  }
  collect(scene); renderer.setAnimationLoop(frame); emit()
  return { komut, tut, sec: id => { selected = sinir(id, 0, 11); d.secili = selected; stageView(); emit() }, hedef: id => { d.hedef = sinir(id, 0, 2); stageView(); emit() }, ses: v => { ses.ac(v) }, zoom: oran => { camera.position.sub(controls.target).multiplyScalar(oran).add(controls.target) }, dondur: x => { const v = camera.position.clone().sub(controls.target); v.applyAxisAngle(new T.Vector3(0, 1, 0), x); camera.position.copy(controls.target).add(v) }, temizle: () => {
    disposed = true; renderer.setAnimationLoop(null); cancel(); observer.disconnect(); controls.dispose(); ses.dispose(); particles.dispose(); resetTargets()
    alan.removeEventListener('pointerdown', pointerDown); alan.removeEventListener('pointermove', pointerMove); alan.removeEventListener('pointerup', pointerUp); alan.removeEventListener('pointercancel', cancel); alan.removeEventListener('lostpointercapture', cancel); alan.removeEventListener('keydown', keydown); alan.removeEventListener('keyup', keyup); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost)
    markers.forEach(({ b, click }) => { b.removeEventListener('click', click); b.remove() }); action.removeEventListener('click', actionClick); action.remove(); collect(scene); geometriler.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); env.dispose(); composer.passes.forEach(p => p.dispose()); composer.dispose(); renderer.dispose(); renderer.domElement.remove()
  } }
}
