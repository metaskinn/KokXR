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
import { namluHazirla, agizYerel } from './dovme'
import { hedefleriKur, hedefDuzlemZ, hedefMerkez } from './hedefler'
import { kolay, araKes, SonumluVektor, kavisliYol, yayAdim } from './animasyon'
import { parcacikHavuzu } from './parcacik'
import { sesOlustur } from './ses'
import { kesimHesapla } from './test'
import { kilicParcaNotlari } from '../../data/kilic'
import { xrOturumuKur } from './xrOturum'
import { enYakinBolge, isinEksenX } from './xrHesap'
export type Komut = 'al' | 'devam' | 'yeniden' | 'usta' | 'vur' | 'tak' | 'kes' | 'hedefleri-yenile' | 'bastan'
export interface KilicSahnesi {
  komut: (ad: Komut) => void; tut: (ad: 'koruk' | 'su' | 'bile', v: boolean) => void
  sec: (id: number) => void; hedef: (id: number) => void; ses: (ac: boolean) => void
  zoom: (oran: number) => void; dondur: (x: number) => void; temizle: () => void
  /** Kullanıcı jesti kaybolmasın: requestSession'dan önce await yok. */
  xrBaslat: () => Promise<void>
}
export async function sahneOlustur(alan: HTMLElement, bildir: (d: Oyun) => void, hata: () => void, not: (id: number) => void, xrDegisti?: (aktif: boolean) => void): Promise<KilicSahnesi> {
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
  // Çekiç: tutma noktası başlangıç; sap -Z'ye uzanır, baş çeliğe yukarıdan iner. X ekseni çevresinde döner.
  const hammer = new T.Group(); hammer.position.set(0, .998, .24); scene.add(hammer)
  const cekicBas = mesh('Cekic_Bas'), cekicSap = mesh('Cekic_Sap'), cekicEl = new T.Group(); hammer.add(cekicEl)
  cekicEl.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, -1), new T.Vector3(-1, 0, 0)))
  cekicEl.add(cekicBas); cekicBas.position.set(0, .34, 0); cekicBas.quaternion.identity(); cekicEl.add(cekicSap); cekicSap.position.set(0, .34, 0); cekicSap.quaternion.identity()
  // Maşa: kılıcın sapını kavrar, kılıçla birlikte hareket eder.
  const tongs = new T.Group(); kilic.add(tongs); tongs.position.set(-.16, 0, 0); tongs.visible = false
  for (const ad of ['Masa_1', 'Masa_2']) { const m = mesh(ad); tongs.add(m); m.position.set(0, 0, 0); m.quaternion.identity() }
  const crackGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(.6, -.027, .006), new T.Vector3(.61, -.01, .006), new T.Vector3(.597, .002, .006), new T.Vector3(.62, .023, .006)])
  const crack = new T.Line(crackGeo, new T.LineBasicMaterial({ color: '#111111' })); kilic.add(crack)
  const stand = new T.Mesh(new T.CylinderGeometry(.8, .9, .08, 64), new T.MeshStandardMaterial({ color: '#182023', metalness: .45, roughness: .4 })); stand.scale.set(.65, 1, .65); stand.position.set(.35, 1.15, 0); stand.visible = false; stand.receiveShadow = true; scene.add(stand)
  const supports = new T.Group(); scene.add(supports)
  for (const x of [.13, .69]) { const pole = new T.Mesh(new T.CylinderGeometry(.006, .009, .42, 12), new T.MeshStandardMaterial({ color: '#a28152', metalness: .8, roughness: .28 })); pole.position.set(x, 1.38, -.015); supports.add(pole) }
  let d = ilkOyun(), disposed = false, lastStage = -1, lastReheat = false, korukTut = false, suTut = false, bileTut = false, dragging = false, selected = 0, lastHit = -10, publish = 0, masterTime = 0, masterTotal = 0, lastMasterStage = -1, gold = 0, lastTak = 0, takTime = 1, takIndi = true, reheatSu = false
  const CEKIC_DARBE = .25, CEKIC_TUR = .6, CEKIC_BEKLE = .55, TAS_X = 3.05, TAS_UST = 1.195, TAS_Z = -1.2
  const gorsel = d.bolgeler.map(b => ({ ...b })), ziplama = { x: 0, v: 0 }, sarsinti = { x: 0, v: 0 }
  let hammerTime = CEKIC_TUR, vurusBolgesi = 0, darbeOldu = true, bekleyenVurus = false, flas = 0, durma = 0, korukGuc = 0, korukFaz = 0, carkHiz = 0, temas = 0, bileU = .03, suIciydi = false
  // Dönen cismin ekseni Blender'da Z, glTF ağında Y'dir.
  const carkEksen = new T.Vector3(0, 1, 0).applyQuaternion(tas.getWorldQuaternion(new T.Quaternion())), carkYonu = carkEksen.z >= 0 ? 1 : -1
  const kivilcimYonu = new T.Vector3().crossVectors(carkEksen.clone().multiplyScalar(carkYonu), new T.Vector3(0, 1, 0)).x >= 0 ? 1 : -1
  let tasima: { a: T.Vector3; q: T.Quaternion; t: number; sure: number; kavis: number } | null = null
  let kesim: { t: number; a: T.Vector3; b: T.Vector3; dx: number; dy: number; sec: number; vuruldu: boolean; q0: T.Quaternion; p0: T.Vector3; z: number } | null = null, izBas: T.Vector3 | null = null
  const isitmaDurusu = new T.Euler().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 0, -1), new T.Vector3(-1, 0, 0), new T.Vector3(0, 1, 0)), 'XYZ')
  const kameraIz = new SonumluVektor(), hedefIz = new SonumluVektor(), kilicIz = new SonumluVektor(), hedefQ = new T.Quaternion()
  let transitionTime = 0, time = 0, last = performance.now(), slow = 0, tier = 0
  let down: { x: number; y: number; t: number } | null = null
  const cameraGoal = new T.Vector3(), targetGoal = new T.Vector3(), swordGoal = new T.Vector3(), swordRotation = new T.Euler()
  const hedefler = hedefleriKur(scene, mesh, az)
  const onizlemeGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), onizleme = new T.Line(onizlemeGeo, new T.LineBasicMaterial({ color: '#fff2cf', transparent: true, opacity: .65 })); onizleme.visible = false; scene.add(onizleme)
  // Savurma izi: namlunun geçtiği yüzey, hızla sönen ışık şeridi.
  const iz = (() => {
    const N = 22, konum = new Float32Array(N * 6), renk = new Float32Array(N * 6), geo = new T.BufferGeometry(), idx: number[] = []
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    geo.setAttribute('position', new T.BufferAttribute(konum, 3)); geo.setAttribute('color', new T.BufferAttribute(renk, 3)); geo.setIndex(idx); geo.setDrawRange(0, 0)
    const mat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false })
    const mesh2 = new T.Mesh(geo, mat); mesh2.frustumCulled = false; scene.add(mesh2)
    const kok = new T.Vector3(.28, 0, 0), uc = new T.Vector3(1.02, 0, 0), a = new T.Vector3(), b = new T.Vector3(); let say = 0, parlak = 0
    return {
      temizle() { say = 0; parlak = 0; geo.setDrawRange(0, 0) },
      ekle(k: T.Object3D) {
        k.updateMatrixWorld(true); a.copy(kok).applyMatrix4(k.matrixWorld); b.copy(uc).applyMatrix4(k.matrixWorld)
        if (say === N) { konum.copyWithin(0, 6); say-- }
        konum.set([a.x, a.y, a.z, b.x, b.y, b.z], say * 6); say++; parlak = 1
        geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, Math.max(0, say - 1) * 6)
      },
      guncelle(dt: number) {
        parlak = Math.max(0, parlak - dt * 3.8); if (parlak <= 0 && say) { say = 0; geo.setDrawRange(0, 0) }
        for (let i = 0; i < say; i++) { const g = (i / Math.max(1, say - 1)) ** 1.6 * parlak * .55; renk.set([g, g * .92, g * .74, g * .35, g * .32, g * .25], i * 6) }
        geo.attributes.color.needsUpdate = true
      },
      sil() { geo.dispose(); mat.dispose(); scene.remove(mesh2) },
    }
  })()
  function izGuncelle(dt: number) { iz.guncelle(dt) }
  const markers = kilicParcaNotlari.map((p, i) => {
    const b = document.createElement('button'); b.className = 'kilic-nokta'; b.textContent = String(i + 1); b.setAttribute('aria-label', `${i + 1}. ${p.baslik}`); const click = () => not(i); b.addEventListener('click', click); alan.append(b); return { b, p: new T.Vector3(...p.konum), click }
  })
  const action = document.createElement('button'); action.className = 'kilic-sahne-isaret'; alan.append(action)
  const ray = new T.Raycaster(), pointer = new T.Vector2()
  const emit = () => { if (!disposed && !renderer.xr.isPresenting) bildir({ ...d, bolgeler: d.bolgeler.map(b => ({ ...b })), sonuclar: [...d.sonuclar] }) }
  function resetTargets() { hedefler.sifirla(); d.sonuclar = []; d.hasarlar = [0, 0, 0] }
  function tasimaBaslat() {
    if (az) return
    const uz = kilic.position.distanceTo(swordGoal); if (uz < .2) return
    tasima = { a: kilic.position.clone(), q: kilic.quaternion.clone(), t: 0, sure: T.MathUtils.clamp(uz * .42, .7, 1.7), kavis: Math.min(.55, .12 + uz * .09) }
  }
  function stageView() {
    const a = d.asama, heating = a === 1 || d.yeniden || reheatSu
    controls.enabled = a === 6
    controls.enabled = a === 6
    swordRotation.set(-Math.PI / 2, 0, 0, 'XYZ')
    if (a === 0) { cameraGoal.set(5, 3, 2); targetGoal.set(1.7, 1, -2); swordGoal.set(2.8, .95, -2.5) }
    else if (heating) {
      // Ocağın ağzı öne bakar: çelik ağızdan içeri girer, maşa dışarıda kalır. Uzamış namluda uç arka duvara değmesin diye boyu kadar geri durur.
      const boy = deform.merkez(gorsel, 11) + (deform.merkez(gorsel, 11) - deform.merkez(gorsel, 10)) / 2
      cameraGoal.set(-.8, 2.05, .65); targetGoal.set(-2.25, 1.02, -1.75); swordGoal.set(-2.25, 1.03, -2.25 + boy); swordRotation.copy(isitmaDurusu)
    }
    else if (a === 2) { cameraGoal.set(.55, 1.55, 1.15); targetGoal.set(.05, .92, -.12); swordGoal.set(-deform.merkez(gorsel, selected), .9, -.1) }
    else if (a === 3) { const ic = suTut || d.daldirma > 0; cameraGoal.set(3.05, 1.55, 1.75); targetGoal.set(1.95, .5, .1); swordGoal.set(1.5, ic ? .45 : .78, .15); swordRotation.set(-Math.PI / 2, 0, ic ? -.25 : .03, 'ZYX') }
    else if (a === 4) {
      // Ağız, taşın üst noktasına oturur; sırt yukarıda, yüz hafif eğik.
      const u = sinir(bileU, .02, .985), k = agizYerel(u), k2 = agizYerel(Math.min(.995, u + .01)), egim = Math.atan2(k2.y - k.y, k2.x - k.x)
      const temasY = TAS_UST + (bileTut || d.usta ? -.0005 + (az ? 0 : (Math.random() - .5) * .0012) : .014)
      swordRotation.set(.2, 0, -egim)
      const yer = new T.Vector3(k.x, k.y, 0).applyEuler(swordRotation)
      swordGoal.set(TAS_X - yer.x, temasY - yer.y, TAS_Z - yer.z)
      cameraGoal.set(TAS_X + .42, 1.42, -.32); targetGoal.set(TAS_X - .06, 1.12, TAS_Z)
    }
    else if (a === 5) { cameraGoal.set(3.25, 2.4, -.3); targetGoal.set(2.85, 1, -2.45); swordGoal.set(2.45, 1.04, -2.45) }
    else if (a === 6) { cameraGoal.set(.5, 1.85, 2.05); targetGoal.set(.42, 1.62, 0); swordGoal.set(0, 1.62, 0); swordRotation.set(.18, swordRotation.y === 0 ? -.1 : swordRotation.y, .13); if (renderer.xr.isPresenting) xrIncelemeYeri() }
    else { const m = hedefMerkez[d.hedef], h = d.hedef; cameraGoal.set(m.x + .5, h === 1 ? 1.3 : 1.5, h === 2 ? 2.9 : h === 1 ? 2.05 : 2.5); targetGoal.set(m.x, h === 2 ? 1.2 : h === 1 ? .82 : 1.05, -.1); swordGoal.set(m.x - .85, h === 2 ? 1.05 : .9, .55); swordRotation.set(.25, -.25, .95) }
    atolye.visible = a !== 6; supports.visible = stand.visible = a === 6; rim.intensity = a === 6 ? 8 : 22; hammer.visible = a === 2 && !d.yeniden
    scene.environmentIntensity = a === 7 ? .9 : a === 6 ? .9 : .42
    hemi.intensity = a === 7 ? 2 : a === 6 ? .5 : 1.05; key.intensity = a === 7 ? 4 : a === 6 ? 1.5 : 3
    key.position.x = a === 7 ? 14 : 2; key.target.position.set(a === 7 ? 14 : 0, 0, 0); scene.add(key.target)
    ;(scene.fog as T.FogExp2).density = a === 7 ? .009 : .025
    scene.background = new T.Color(a === 7 ? '#879c9d' : a === 6 ? '#0d161a' : '#11191a')
  }
  // VR: kılıç namlu ortası çevresinde döner; ucu kullanıcıya doğru savrulmaz.
  function xrIncelemeYeri() { const r = swordRotation.y; swordGoal.set(.42 - .42 * Math.cos(r), 1.62, .42 * Math.sin(r)) }
  function doHit() {
    if (hammerTime < CEKIC_TUR || d.asama !== 2 || d.yeniden || d.usta) return
    hammerTime = 0; darbeOldu = false; bekleyenVurus = true; vurusBolgesi = selected; ses.baslat(); emit()
  }
  // Darbe anı: tıklamada değil çekiç çeliğe değdiğinde.
  function cekicDarbesi() {
    const vuruldu = bekleyenVurus; bekleyenVurus = false
    if (vuruldu) { const onceki = d.asama; vur(d, vurusBolgesi); if (onceki !== d.asama) stageView() }
    const sicak = d.bolgeler[vurusBolgesi].isi, n = sicak > 750 ? 46 : sicak > 550 ? 24 : 12, nokta = new T.Vector3(0, .925, -.1)
    particles.fiskir(nokta, new T.Vector3(.75, .55, .35), n / 2, 1.1, 3.1); particles.fiskir(nokta, new T.Vector3(-.75, .55, .35), n / 2, 1.1, 3.1)
    ses.cal('cekic'); xr.titret(sicak > 550 ? .9 : .5, 70); flas = sicak > 550 ? 1 : .35; ziplama.v = az ? 0 : .26
    if (!az) sarsinti.v = -.34
    if (vuruldu) emit()
  }
  const varsayilanKesimler: [T.Vector3, T.Vector3][] = [
    [new T.Vector3(11.62, 1.32, 0), new T.Vector3(12.38, 1.02, 0)],
    [new T.Vector3(13.92, 1.1, -.1), new T.Vector3(14.08, .45, -.1)],
    [new T.Vector3(15.5, 1.7, -.1), new T.Vector3(16.8, 1.1, -.1)],
  ]
  function cut(dx = .4, dy = .4, sec = .22, a?: T.Vector3, b?: T.Vector3) {
    if (d.asama !== 7 || d.usta || kesim || d.kirildi) return
    const [va, vb] = varsayilanKesimler[d.hedef]
    kesim = { t: 0, a: (a ?? va).clone(), b: (b ?? vb).clone(), dx, dy, sec, vuruldu: false, q0: kilic.quaternion.clone(), p0: kilic.position.clone(), z: hedefDuzlemZ[d.hedef] + .14 }
    iz.temizle(); ses.cal('kesim')
  }
  const K_HAZIRLIK = .16, K_SAVUR = .11, K_TAKIP = .2
  const namluOrta = new T.Vector3(.6, 0, 0), tmpQ = new T.Quaternion(), tmpV = new T.Vector3(), tmpV2 = new T.Vector3()
  function kesimKare(dt: number) {
    if (!kesim) return
    kesim.t += dt
    const k = kesim, v = tmpV.copy(k.b).sub(k.a), uz = v.length() || 1; v.divideScalar(uz)
    const aci = Math.atan2(v.x, -v.y), geri = tmpV2.copy(k.a).addScaledVector(v, -.28); geri.z = k.z
    const sonQ = (sapma: number) => tmpQ.setFromEuler(new T.Euler(0, .18, aci + sapma))
    let nokta: T.Vector3
    if (k.t < K_HAZIRLIK) {
      const s = kolay.dis(k.t / K_HAZIRLIK); nokta = geri.clone()
      kilic.quaternion.slerpQuaternions(k.q0, sonQ(.55), s)
      nokta.sub(namluOrta.clone().applyQuaternion(kilic.quaternion)); kilic.position.lerpVectors(k.p0, nokta, s)
    } else if (k.t < K_HAZIRLIK + K_SAVUR) {
      const s = kolay.ic((k.t - K_HAZIRLIK) / K_SAVUR); nokta = k.a.clone().addScaledVector(v, -.28 + (uz + .28) * s); nokta.z = k.z
      kilic.quaternion.copy(sonQ(.55 * (1 - s) - .25 * s))
      kilic.position.copy(nokta).sub(namluOrta.clone().applyQuaternion(kilic.quaternion))
      iz.ekle(kilic)
    } else if (k.t < K_HAZIRLIK + K_SAVUR + K_TAKIP) {
      const s = kolay.dis((k.t - K_HAZIRLIK - K_SAVUR) / K_TAKIP); nokta = k.b.clone().addScaledVector(v, .3 * s); nokta.z = k.z
      kilic.quaternion.copy(sonQ(-.25 - .3 * s))
      kilic.position.copy(nokta).sub(namluOrta.clone().applyQuaternion(kilic.quaternion))
      iz.ekle(kilic)
    } else { if (!k.vuruldu) { k.vuruldu = true; vurusUygula(k) } kesim = null; kilicIz.sifirla(); return }
    // Darbe zamana bağlıdır: düşük kare hızında savurma evresi atlansa da hasar uygulanır.
    if (!k.vuruldu && k.t >= K_HAZIRLIK + K_SAVUR * .75) { k.vuruldu = true; vurusUygula(k) }
  }
  function vurusUygula(k: Pick<NonNullable<typeof kesim>, 'a' | 'b' | 'dx' | 'dy' | 'sec'>) {
    const onceki = { puan: d.puan, rozet: d.rozet, kirildi: d.kirildi }
    const s = kesimHesapla(d, k.dx, k.dy, k.sec), r = hedefler.vur(d.hedef, k.a, k.b, s.guc)
    if (!r.isabet) { d.puan = onceki.puan; d.rozet = onceki.rozet; d.kirildi = onceki.kirildi; d.mesaj = r.mesaj; d.sonuclar[d.hedef] = r.mesaj; emit(); return }
    d.rozet = onceki.rozet || r.ayrildi && s.guc >= .7
    d.mesaj = s.kirildi ? s.mesaj : r.mesaj; d.sonuclar[d.hedef] = d.mesaj; d.hasarlar = hedefler.hasarlar()
    if (s.kirildi) namlu.visible = false
    particles.fiskir(r.nokta, new T.Vector3(.5, .5, .4), r.ses === 'ting' || s.kirildi ? 30 : 8, 1.2, 2.4)
    if (r.ses === 'ting') ses.cal('ting')
    durma = az ? 0 : r.ayrildi ? .09 : .05
    if (!az) sarsinti.v = r.ayrildi ? -.3 : -.14
    emit()
  }
  function komut(ad: Komut) {
    ses.baslat()
    if (ad === 'bastan') { resetTargets(); d = ilkOyun(); d.secili = selected = 0; lastTak = 0; namlu.visible = true; lastStage = -1; gold = 0; masterTime = 0; reheatSu = false; korukTut = suTut = bileTut = false; kesim = null; bileU = .03; gorsel.forEach(g => { g.p = 0 }); hammerTime = CEKIC_TUR }
    else if (ad === 'hedefleri-yenile') resetTargets()
    else if (d.usta) return
    else if (ad === 'usta') { d.usta = true; masterTime = 0; masterTotal = 2.8; lastMasterStage = d.asama; d.mesaj = 'Usta çalışıyor… Orta kaliteyle tamamlanıyor.' }
    else if (ad === 'al' && d.asama === 0) { ilerle(d) }
    else if (ad === 'devam') {
      if (d.asama === 1 && ortalama(d, 'isi') >= 750) ilerle(d)
      else if (d.yeniden && ortalama(d, 'isi') >= 750) d.yeniden = false
      else if (d.asama === 6) ilerle(d)
    }
    else if (ad === 'yeniden') { if (d.asama === 2) d.yeniden = true; if (d.asama === 3) reheatSu = !reheatSu }
    else if (ad === 'vur') doHit()
    else if (ad === 'tak' && d.asama === 5) tak(d)
    else if (ad === 'kes') cut()
    stageView(); emit()
  }
  action.addEventListener('click', actionClick)
  function actionClick() { if (d.asama === 0) komut('al'); else if (d.asama === 5) komut('tak') }
  function tut(ad: 'koruk' | 'su' | 'bile', v: boolean) {
    if (v) ses.baslat()
    if (ad === 'koruk') { korukTut = v; ses.koruk(v); if (d.asama === 3) reheatSu = v }
    if (ad === 'su') { suTut = v; if (v) reheatSu = false }
    if (ad === 'bile') bileTut = v
    stageView()
  }
  function raycast(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera)
    return ray.intersectObject(namlu, false)[0]
  }
  // Vuruş imlece ekranda en yakın namlu bölgesine gider; ince namluyu tam tutturmak gerekmez.
  function region(e: PointerEvent) {
    const rect = alan.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top
    let enIyi = -1, enAz = 120
    for (let i = 0; i < 12; i++) {
      const q = screen(kilic.localToWorld(new T.Vector3(deform.merkez(gorsel, i), 0, .006))), u = Math.hypot(q.x - x, q.y - y)
      if (u < enAz) { enAz = u; enIyi = i }
    }
    if (enIyi >= 0) { selected = enIyi; d.secili = selected }
  }
  function duzlemNoktasi(e: PointerEvent, z: number) {
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera)
    const n = ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), -z), new T.Vector3()); return n
  }
  function pointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button') || e.button !== 0) return
    ses.baslat(); alan.focus({ preventScroll: true }); down = { x: e.clientX, y: e.clientY, t: performance.now() }; dragging = true
    if (d.asama === 2 && !d.yeniden) { region(e); doHit() }
    if (d.asama === 4) tut('bile', true)
    if (d.asama === 1 || d.yeniden || reheatSu) tut('koruk', true)
    if (d.asama !== 6) alan.setPointerCapture(e.pointerId)
    if (d.asama === 0) { raycast(e); if (ray.intersectObject(yumurta).length) komut('al') }
    if (d.asama === 5) { raycast(e); const next = obj(parcalar[d.takilan]); if (ray.intersectObject(next).length) komut('tak') }
    if (d.asama === 7) { izBas = duzlemNoktasi(e, hedefDuzlemZ[d.hedef]) }
  }
  function pointerMove(e: PointerEvent) {
    if (dragging && d.asama === 2) region(e)
    // Bileme: namluyu tutmuş gibi sürükle; temas noktası namlu boyunca kayar.
    if (dragging && d.asama === 4) { bileU = sinir(bileU - e.movementX / Math.max(280, alan.clientWidth * .62)); selected = Math.min(11, Math.floor(bileU * 12)); d.secili = selected }
    if (dragging && d.asama === 7 && izBas) {
      const n = duzlemNoktasi(e, hedefDuzlemZ[d.hedef]); if (n) { const dizi = onizlemeGeo.getAttribute('position') as T.BufferAttribute; dizi.setXYZ(0, izBas.x, izBas.y, izBas.z + .2); dizi.setXYZ(1, n.x, n.y, n.z + .2); dizi.needsUpdate = true; onizleme.visible = true }
    }
    if (!dragging) { raycast(e); const hit = ray.intersectObjects([yumurta, ...(d.asama === 5 ? [obj(parcalar[Math.min(6, d.takilan)])] : [])])[0]; alan.style.cursor = hit ? 'pointer' : d.asama === 4 ? 'grab' : d.asama === 2 || d.asama === 7 ? 'crosshair' : 'grab'; (yumurta.material as T.MeshStandardMaterial).emissive.set(hit?.object === yumurta ? '#30220e' : '#000000') }
  }
  function pointerUp(e: PointerEvent) {
    onizleme.visible = false
    if (down && d.asama === 7 && dragging && izBas && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 15) {
      const son = duzlemNoktasi(e, hedefDuzlemZ[d.hedef]); if (son) cut((e.clientX - down.x) / alan.clientWidth, (e.clientY - down.y) / alan.clientHeight, (performance.now() - down.t) / 1000, izBas, son)
    }
    izBas = null; dragging = false; down = null; tut('koruk', false); tut('bile', false); if (alan.hasPointerCapture(e.pointerId)) alan.releasePointerCapture(e.pointerId)
  }
  function cancel() { dragging = false; down = null; izBas = null; onizleme.visible = false; korukTut = suTut = bileTut = false; ses.koruk(false) }
  function keydown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); selected = (selected + (e.key === 'ArrowLeft' ? 11 : 1)) % 12; d.secili = selected; bileU = (selected + .5) / 12; if (d.asama === 6) swordRotation.y += e.key === 'ArrowLeft' ? -.1 : .1; else stageView(); emit() }
    if (e.key === 'Enter') { e.preventDefault(); if (d.asama === 2) doHit(); else if (d.asama === 0) komut('al'); else if (d.asama === 5) komut('tak'); else if (d.asama === 7) cut() }
    if (e.code === 'Space') { e.preventDefault(); tut(d.asama === 3 && !reheatSu ? 'su' : d.asama === 4 ? 'bile' : 'koruk', true) }
    if (e.key === '+' || e.key === '-') camera.position.sub(controls.target).multiplyScalar(e.key === '+' ? .9 : 1.1).add(controls.target)
  }
  function keyup(e: KeyboardEvent) { if (e.code === 'Space') { e.preventDefault(); cancel() } }
  function contextLost(e: Event) { e.preventDefault(); cancel(); xr.bitir(); renderer.setAnimationLoop(null); ses.bekle(true); hata() }
  function visibility() { cancel(); if (renderer.xr.isPresenting) return; if (document.hidden) { renderer.setAnimationLoop(null); ses.bekle(true) } else { last = performance.now(); renderer.setAnimationLoop(frame); ses.bekle(false) } }
  alan.addEventListener('pointerdown', pointerDown); alan.addEventListener('pointermove', pointerMove); alan.addEventListener('pointerup', pointerUp); alan.addEventListener('pointercancel', cancel); alan.addEventListener('lostpointercapture', cancel); alan.addEventListener('keydown', keydown); alan.addEventListener('keyup', keyup); window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', visibility); renderer.domElement.addEventListener('webglcontextlost', contextLost)
  function size() { if (renderer.xr.isPresenting) return; const w = alan.clientWidth, h = alan.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); fxaa.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio())); camera.aspect = w / h; camera.setViewOffset(w, h, w > 700 ? 165 : 0, 0, w, h); camera.updateProjectionMatrix() }
  const observer = new ResizeObserver(size); alan.prepend(renderer.domElement); observer.observe(alan); size(); deform.guncelle(d.bolgeler); stageView(); camera.position.copy(cameraGoal); controls.target.copy(targetGoal); kilic.position.copy(swordGoal); kilic.rotation.copy(swordRotation); lastStage = 0
  function screen(p: T.Vector3) { const a = p.clone().project(camera); return { x: (a.x + 1) * alan.clientWidth / 2, y: (1 - a.y) * alan.clientHeight / 2, z: a.z } }
  function xrDamga() {
    alan.dataset.takilan = String(ekler.filter(o => o.visible).length); alan.dataset.ayrilan = String(hedefler.ayrilan()); alan.dataset.hasar = hedefler.hasarlar().map(v => v.toFixed(2)).join(','); alan.dataset.asama = String(d.asama); alan.dataset.bolgeler = d.bolgeler.map(b => b.p.toFixed(2)).join(','); alan.dataset.cekic = hammerTime >= CEKIC_TUR ? '1' : '0'
    alan.dataset.xrSahne = JSON.stringify({ isi: Math.round(ortalama(d, 'isi')), cilt: +ortalama(d, 'cilt').toFixed(3), daldirma: +d.daldirma.toFixed(2), secili: selected, bileU: +bileU.toFixed(3), hedef: d.hedef, puan: d.puan, mesaj: d.mesaj, usta: d.usta, y: +swordRotation.y.toFixed(3), kilic: kilic.position.toArray().map(v => +v.toFixed(3)), golge: key.castShadow, cizim: renderer.info.render.calls, ucgen: renderer.info.render.triangles, program: renderer.info.programs?.length ?? 0, doku: renderer.info.memory.textures, geo: renderer.info.memory.geometries })
  }
  // Parça düğümleri kılıçla aynı başlangıçtadır; asıl merkez geometridedir.
  const parcaMerkezi = new Map(parcalar.map(ad => { const b = new T.Box3(); obj(ad).traverse(c => { if (c instanceof T.Mesh) { c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox!) } }); return [ad, b.getCenter(new T.Vector3())] }))
  let xrParca: { ad: string; m: T.Matrix4 } | null = null, xrElleOturdu = false
  const kutuNokta = new T.Box3(), kutuMerkez = new T.Vector3(), yerelRay = new T.Ray(), tersMat = new T.Matrix4()
  const incelemeZemini = new T.Mesh(new T.CircleGeometry(3, 48).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#141b1c', roughness: .95 })); incelemeZemini.position.set(.42, 0, 0); incelemeZemini.visible = false; scene.add(incelemeZemini)
  const xr = xrOturumuKur(renderer, scene, camera, {
    oyun: () => d, reheat: () => reheatSu, komut, tut,
    bolgeSec: i => { selected = sinir(i, 0, 11); d.secili = selected; bileU = (selected + .5) / 12; stageView() },
    hedefSec: i => { d.hedef = sinir(i, 0, 2); xr.hedefDegisti(); stageView() },
    dondur: a => { swordRotation.y += a; xrIncelemeYeri() },
    bolgeBul: r => {
      kilic.updateWorldMatrix(true, false); yerelRay.copy(r).applyMatrix4(tersMat.copy(kilic.matrixWorld).invert())
      const merkezler = gorsel.map((_, i) => deform.merkez(gorsel, i)), boy = merkezler[11] + .05
      const h = isinEksenX(yerelRay.origin, yerelRay.direction, boy)
      return h.uzaklik <= .16 ? enYakinBolge(merkezler, h.x) : null
    },
    bolgeNoktasi: (i, h) => { kilic.localToWorld(h.set(deform.merkez(gorsel, i), 0, .006)); h.y += .045; return h },
    nesneNoktasi: (ad, h) => {
      const n = ad === 'yumurta' ? yumurta : ad === 'koruk' ? koruk : obj(ad)
      n.updateWorldMatrix(true, true); kutuNokta.setFromObject(n); kutuNokta.getCenter(kutuMerkez); return h.copy(kutuMerkez)
    },
    hedefNoktasi: i => hedefMerkez[i], hedefKutu: i => hedefler.kutu(i),
    bileU: () => bileU, bileSur: u => { bileU = u; selected = Math.min(11, Math.floor(bileU * 12)); d.secili = selected }, tasZ: TAS_Z,
    kes: c => {
      if (d.asama !== 7 || d.usta || kesim || d.kirildi) return
      ses.cal('kesim'); vurusUygula({ a: c.a, b: c.b, dx: c.dx, dy: c.dy, sec: c.sure })
    },
    izEkle: () => iz.ekle(kilic), kesimSuruyor: () => !!kesim,
    kilicKonum: (p, q) => { kilic.position.copy(p); kilic.quaternion.copy(q) },
    parcaMatris: ad => { const o = obj(ad); o.updateWorldMatrix(true, false); return o.matrixWorld },
    parcaTasi: (ad, m) => { xrParca = m ? { ad, m } : null; if (!m) { const o = obj(ad); o.quaternion.identity(); o.scale.set(1, 1, 1) } },
    parcaYeri: (ad, h) => kilic.localToWorld(h.copy(parcaMerkezi.get(ad)!)),
    parcaUzaklik: ad => xrParca ? kilic.localToWorld(kutuMerkez.copy(parcaMerkezi.get(ad)!)).distanceTo(parcaMerkezi.get(ad)!.clone().applyMatrix4(xrParca.m)) : Infinity,
    parcaOturt: () => { xrElleOturdu = true; komut('tak') },
    zemin: v => { incelemeZemini.visible = v },
    oturumBasladi: () => {
      cancel(); tasima = null; kameraIz.sifirla(); hedefIz.sifirla(); sarsinti.x = sarsinti.v = 0
      markers.forEach(({ b }) => { b.hidden = true }); action.hidden = true; onizleme.visible = false
      // Quest için: gölge haritası ve tepe ışığı kapanır, parçacık azalır. Bir kez gölgelendirici derlenir.
      key.castShadow = false; rim.visible = false; particles.azalt(true)
      alan.dataset.xr = '1'; stageView(); xrDamga(); xrDegisti?.(true)
    },
    oturumBitti: () => {
      cancel(); key.castShadow = true; rim.visible = true; particles.azalt(false)
      // Three.js near/far ve görüş açısını XR'dan kalan değerde bırakır.
      camera.fov = 42; camera.zoom = 1; camera.near = .025; camera.far = 70
      delete alan.dataset.xr
      stageView(); camera.position.copy(cameraGoal); camera.quaternion.identity(); controls.target.copy(targetGoal); kilic.position.copy(swordGoal); kilic.rotation.copy(swordRotation); tasima = null; kilicIz.sifirla(); kameraIz.sifirla(); hedefIz.sifirla()
      size(); controls.update(); last = performance.now(); slow = 0; emit(); xrDegisti?.(false)
    },
    damga: (ad, v) => { alan.dataset[ad] = v },
  })
  function frame() {
    const xrAcik = renderer.xr.isPresenting
    if (disposed || (document.hidden && !xrAcik)) return
    const now = performance.now(), raw = (now - last) / 1000, gercekDt = Math.min(.1, raw); last = now
    if (durma > 0) durma -= gercekDt
    const dt = durma > 0 ? gercekDt * .08 : gercekDt; time += dt; publish += gercekDt
    if (xrAcik) xr.kare(gercekDt)
    if (raw > .045) slow += raw; else slow = Math.max(0, slow - gercekDt * .5)
    if (!xrAcik && slow > 1.5 && tier < 2) { tier++; renderer.setPixelRatio(tier === 1 ? .85 : .65); composer.setPixelRatio(tier === 1 ? .85 : .65); bloom.enabled = tier < 2; slow = 0; size() }
    if (d.usta) {
      masterTime += Math.min(.5, raw)
      if (d.asama === 1 || d.yeniden) isit(d, dt * 3, true)
      if (d.asama === 2 && !d.yeniden) { d.bolgeler.forEach((b, i) => { b.isi = 900; b.p = Math.max(b.p, sinir(masterTime / masterTotal * 1.3 - i * .025)) }); selected = Math.min(11, Math.floor(masterTime / masterTotal * 12)); if (hammerTime >= CEKIC_TUR) hammerTime = 0 }
      if (d.asama === 3) { suTut = true; d.bolgeler.forEach(b => { b.isi = Math.max(30, 830 * (1 - masterTime / masterTotal)) }) }
      if (d.asama === 4) { bileU = sinir(masterTime / masterTotal); selected = Math.min(11, Math.floor(bileU * 12)); d.bolgeler[selected].cilt = .6; d.bolgeler[selected].kabuk = 0 }
      if (d.asama === 5) { const n = Math.min(7, Math.floor(masterTime / masterTotal * 8)); if (n !== d.takilan) d.takilan = n }
      if (masterTime >= masterTotal) { d.usta = false; if (lastMasterStage === 7) cut(); else ustaTamamla(d); suTut = false; reheatSu = false; masterTime = 0; emit() }
    } else if (d.asama === 1 || d.yeniden || reheatSu) isit(d, dt, korukTut)
    else if (d.asama === 2) { d.bolgeler.forEach(b => { b.isi = Math.max(20, b.isi - dt * 7) }); if (dragging && hammerTime >= CEKIC_TUR) doHit() }
    else if (d.asama === 3) { if (korukTut) isit(d, dt, true); else if (suTut) suVer(d, dt); else d.bolgeler.forEach(b => { b.isi = b.isi + Math.sign(835 - b.isi) * Math.min(Math.abs(835 - b.isi), dt * 80) }) }
    else if (d.asama === 4 && bileTut) { bile(d, selected, dt); if (time - lastHit > .12) { ses.cal('bileme'); lastHit = time } }
    if (lastStage !== d.asama || lastReheat !== d.yeniden) { transitionTime = 0; lastStage = d.asama; lastReheat = d.yeniden; cancel(); stageView(); tasimaBaslat(); emit(); xr.asamaDegisti() }
    if (d.asama === 2 || d.asama === 3 || d.asama === 4) stageView()
    transitionTime += dt

    // Gösterilen dövme ilerlemesi hedefine ezilir gibi kısa sürede ulaşır; çelik sıçrayarak uzamaz.
    for (let i = 0; i < 12; i++) { const b = d.bolgeler[i]; gorsel[i].p += (b.p - gorsel[i].p) * Math.min(1, dt * 16); if (Math.abs(b.p - gorsel[i].p) < .002) gorsel[i].p = b.p; gorsel[i].isi = b.isi; gorsel[i].kabuk = b.kabuk; gorsel[i].cilt = b.cilt }
    deform.guncelle(gorsel)

    // Kamera ve kılıç: sönümlü takip; uzak aşama geçişi yukarı kavisli taşımayla.
    if (!xrAcik && (d.asama !== 6 || transitionTime < 1.4)) { if (az) { camera.position.copy(cameraGoal); controls.target.copy(targetGoal) } else { kameraIz.takip(camera.position, cameraGoal, .5, dt); hedefIz.takip(controls.target, targetGoal, .42, dt) } }
    controls.enabled = d.asama === 6 && transitionTime >= 1.4
    hedefQ.setFromEuler(swordRotation)
    if (kesim) kesimKare(dt)
    else if (tasima) {
      tasima.t = Math.min(1, tasima.t + dt / tasima.sure); const k = az ? 1 : kolay.icDis(tasima.t)
      kavisliYol(kilic.position, tasima.a, swordGoal, k, tasima.kavis); kilic.quaternion.slerpQuaternions(tasima.q, hedefQ, k)
      if (tasima.t >= 1) { tasima = null; kilicIz.sifirla() }
    } else {
      if (az) kilic.position.copy(swordGoal); else kilicIz.takip(kilic.position, swordGoal, d.asama === 4 ? .045 : d.asama === 7 ? .22 : .1, dt)
      kilic.quaternion.slerp(hedefQ, az ? 1 : 1 - Math.exp(-dt * 11))
    }

    if (xrAcik && !kesim && xr.kilicYerlestir()) tasima = null

    // Çekiç: kalkış, hızlanan iniş, darbe, sekme, bekleme.
    hammerTime += dt
    const ht = hammerTime; let aci: number
    if (ht < .17) aci = T.MathUtils.lerp(CEKIC_BEKLE, 1.15, kolay.dis(ht / .17))
    else if (ht < CEKIC_DARBE) aci = T.MathUtils.lerp(1.15, 0, kolay.ic((ht - .17) / (CEKIC_DARBE - .17)))
    else if (ht < .36) aci = Math.sin((ht - CEKIC_DARBE) / (.36 - CEKIC_DARBE) * Math.PI * .5) * .34
    else aci = T.MathUtils.lerp(.34, CEKIC_BEKLE, kolay.icDis(araKes(ht, .36, CEKIC_TUR)))
    hammer.rotation.x = aci; hammer.position.x = (ht < CEKIC_DARBE ? .012 : 0)
    if (!darbeOldu && ht >= CEKIC_DARBE) { darbeOldu = true; if (d.asama === 2 && !d.yeniden) cekicDarbesi() }
    yayAdim(ziplama, 900, 26, dt)
    if (d.asama === 2 && !tasima) kilic.position.y += ziplama.x
    flas *= Math.exp(-dt * 16)

    // Kamera sarsıntısı: yay, tek darbede sönen.
    yayAdim(sarsinti, 1500, 32, gercekDt)
    if (!xrAcik) camera.position.y += sarsinti.x

    tongs.visible = d.asama >= 1 && d.asama <= 3
    yumurta.visible = d.asama === 0; kilic.visible = d.asama !== 0
    const heat = ortalama(d, 'isi'); bladeLight.position.copy(kilic.position).add(new T.Vector3(.2, .14, 0)); bladeLight.intensity = Math.max(0, (heat - 500) / 40) + flas * 7

    // Körük ve ateş birbirine bağlı, ani değişim yok.
    korukGuc += ((korukTut ? 1 : 0) - korukGuc) * Math.min(1, dt * 5)
    if (korukTut) korukFaz += dt * 7.5
    koruk.scale.y = 1 - .26 * korukGuc * (.5 - .5 * Math.cos(korukFaz))
    fire.intensity = (24 + Math.sin(time * 9) * 3 + Math.sin(time * 17) * 2) * (1 + korukGuc * .9)
    ;(kor.material as T.MeshStandardMaterial).emissiveIntensity = 1.7 + korukGuc * (2.3 + Math.sin(korukFaz) * .6)
    if (Math.random() < dt * (8 + korukGuc * 40)) particles.fiskir(new T.Vector3(-2.25 + (Math.random() - .5) * 1.1, .98, -2 + (Math.random() - .5) * .5), new T.Vector3(0, 1, 0), 1, .5, 1.5)

    // Bileme: taş yavaşça hızlanır, kıvılcım dönüş yönünde temas noktasından fışkırır.
    if (d.asama === 4) {
      const hedefHiz = bileTut || d.usta ? 16 : 2.5; carkHiz += (hedefHiz - carkHiz) * Math.min(1, dt * (bileTut ? 2.4 : .9))
      tas.rotateY(carkYonu * carkHiz * dt)
      const basma = bileTut || d.usta; temas += ((basma ? 1 : 0) - temas) * Math.min(1, dt * 14)
      if (basma && temas > .6) {
        const nokta = new T.Vector3(TAS_X, TAS_UST, TAS_Z)
        particles.fiskir(nokta, new T.Vector3(kivilcimYonu, .16, 0), az ? 1 : 7, .5, 4.6 + carkHiz * .12)
        bladeLight.position.copy(nokta); bladeLight.intensity = Math.max(bladeLight.intensity, 4 + Math.random() * 9)
        const b = d.bolgeler[selected]; b.isi = Math.min(b.isi, 700)
      }
    } else carkHiz = 0

    // Su verme: daldırınca sıçrama, namlu boyunca buhar.
    if (d.asama === 3 && (suTut || d.usta)) {
      if (!suIciydi) { suIciydi = true; ses.cal('su'); particles.fiskir(new T.Vector3(1.95, .42, .15), new T.Vector3(0, 1, 0), 60, 1.3, 2.2, 1) }
      const sicak = Math.max(0, ortalama(d, 'isi') - 100) / 700
      if (Math.random() < .55 * Math.min(1, sicak + .15)) particles.emet(new T.Vector3(1.48 + Math.random() * 1.0, .43, .15), 2, true)
    } else if (!suTut) suIciydi = false

    // Kuşanma: sıradaki parça yanında süzülür; takılınca kavisle gelip tık diye oturur.
    if (d.takilan !== lastTak) { takTime = xrElleOturdu ? .44 : 0; xrElleOturdu = false; lastTak = d.takilan; takIndi = false }
    takTime += dt
    if (!takIndi && takTime >= .44 && d.takilan > 0) { takIndi = true; ses.cal('ting'); const s = kilic.localToWorld(asillar.get(parcalar[d.takilan - 1])!.clone()); particles.fiskir(s, new T.Vector3(0, .6, 0), 12, 1.3, .9) }
    ekler.forEach(o => {
      const id = parcalar.indexOf(o.name), count = d.takilan, yer = asillar.get(o.name)!
      o.visible = d.asama >= 5 && (o.name === 'Namlu_Kakma' ? count >= 7 : o.name === 'Sap' ? true : id <= count)
      o.position.copy(yer); o.rotation.z = 0
      if (d.asama !== 5) return
      if (id === count) { o.position.y += .12 + Math.sin(time * 2.4) * .006; o.position.z += .14 }
      if (id === count - 1 && takTime < .44) {
        const k = az ? 1 : kolay.disGeri(takTime / .44)
        o.position.y += .12 * (1 - k); o.position.z += .14 * (1 - k)
        if (o.name.startsWith('Percin')) o.rotation.z = (1 - k) * 7
      }
      if (xrParca?.ad === o.name) tersMat.copy(kilic.matrixWorld).invert().multiply(xrParca.m).decompose(o.position, o.quaternion, o.scale)
    })
    gold = d.takilan >= 7 ? Math.min(1, gold + dt * .7) : 0; kakma.opacity = gold; crack.visible = d.catlak

    hedefler.guncelle(gercekDt, d.asama === 7)
    particles.update(dt); if (!xrAcik) controls.update(); scene.updateMatrixWorld(true)
    izGuncelle(dt)
    if (xrAcik) {
      // Efekt zinciri yok; HTML görünmez olduğundan ekran hesapları da yok.
      renderer.render(scene, camera)
      if (publish > .15) { publish = 0; xrDamga() }
      return
    }
    markers.forEach(({ b, p }) => { b.hidden = d.asama !== 6; if (!b.hidden) { const q = screen(kilic.localToWorld(p.clone())); b.style.left = `${q.x}px`; b.style.top = `${q.y - 18}px` } })
    action.hidden = !(d.asama === 0 || d.asama === 5 && d.takilan < 7)
    if (!action.hidden) { const nesne = d.asama === 0 ? yumurta : obj(parcalar[d.takilan]); const q = screen(nesne.getWorldPosition(new T.Vector3())); action.style.left = `${q.x}px`; action.style.top = `${q.y - 35}px`; action.textContent = d.asama === 0 ? '01 · Külçeyi al' : `${d.takilan + 1} · Parçayı yerleştir` }
    const hitPos = screen(kilic.localToWorld(new T.Vector3(deform.merkez(d.bolgeler, selected), 0, .006)))
    alan.dataset.vurusX = String(hitPos.x); alan.dataset.vurusY = String(hitPos.y)
    const hm = hedefMerkez[d.hedef], hq = screen(hm), hq2 = screen(new T.Vector3(hm.x + 1, hm.y, hm.z))
    alan.dataset.hedefX = String(hq.x); alan.dataset.hedefY = String(hq.y); alan.dataset.hedefOlcek = String(hq2.x - hq.x)
    alan.dataset.uzunluk = deform.uzunluk().toFixed(4); alan.dataset.takilan = String(ekler.filter(o => o.visible).length); alan.dataset.ayrilan = String(hedefler.ayrilan()); alan.dataset.hasar = hedefler.hasarlar().map(v => v.toFixed(2)).join(','); alan.dataset.asama = String(d.asama); alan.dataset.bolgeler = d.bolgeler.map(b => b.p.toFixed(2)).join(','); alan.dataset.cekic = hammerTime >= CEKIC_TUR ? '1' : '0'; alan.dataset.kalite = String(tier)
    bloom.strength = .18 + Math.max(0, heat - 500) / 2200
    composer.render(); if (publish > .15) { publish = 0; emit() }
  }
  collect(scene); renderer.setAnimationLoop(frame); emit()
  return { xrBaslat: async () => { ses.baslat(); await xr.baslat() }, komut, tut, sec: id => { selected = sinir(id, 0, 11); d.secili = selected; bileU = (selected + .5) / 12; stageView(); emit() }, hedef: id => { d.hedef = sinir(id, 0, 2); stageView(); emit() }, ses: v => { ses.ac(v) }, zoom: oran => { camera.position.sub(controls.target).multiplyScalar(oran).add(controls.target) }, dondur: x => { const v = camera.position.clone().sub(controls.target); v.applyAxisAngle(new T.Vector3(0, 1, 0), x); camera.position.copy(controls.target).add(v) }, temizle: () => {
    disposed = true; xr.temizle(); renderer.setAnimationLoop(null); cancel(); observer.disconnect(); controls.dispose(); ses.dispose(); particles.dispose(); hedefler.temizle(); iz.sil(); onizlemeGeo.dispose(); (onizleme.material as T.Material).dispose()
    alan.removeEventListener('pointerdown', pointerDown); alan.removeEventListener('pointermove', pointerMove); alan.removeEventListener('pointerup', pointerUp); alan.removeEventListener('pointercancel', cancel); alan.removeEventListener('lostpointercapture', cancel); alan.removeEventListener('keydown', keydown); alan.removeEventListener('keyup', keyup); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost)
    markers.forEach(({ b, click }) => { b.removeEventListener('click', click); b.remove() }); action.removeEventListener('click', actionClick); action.remove(); collect(scene); geometriler.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); env.dispose(); composer.passes.forEach(p => p.dispose()); composer.dispose(); renderer.dispose(); renderer.domElement.remove()
  } }
}
