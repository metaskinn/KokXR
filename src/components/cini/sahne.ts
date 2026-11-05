// Çini atölyesi sahnesi: masaüstü fare/dokunma ve VR kumandası aynı "işaret" yolundan oyuna girer.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { bolgeBul, lale, type N } from './desen'
import { kagitDokusu, yuzeyOlustur } from './doku'
import { asamalar, astarSur, boya, boyaBitir, eylemler, firin, ilkOyun, kalite, komurle, renkSec, sekillendir, sirDok, sogut, tahrirCiz, ustaTamamla, BISKUVI, SIR_FIRINI, type Oyun, type RenkId } from './durum'
import { xrKur, type XrBaglam } from './xr'

const R = .16
const PLAKA_Y = .94
export type TutAd = 'astar' | 'sir' | 'ates'
export interface CiniSahnesi {
  komut: (id: string) => void
  tut: (ad: TutAd, acik: boolean) => void
  usta: () => void
  xrBaslat: () => Promise<void>
  xrBitir: () => void
  temizle: () => void
}

function tuval(g: number, y: number, ciz: (c: CanvasRenderingContext2D) => void, tekrar?: [number, number]) {
  const e = document.createElement('canvas'); e.width = g; e.height = y
  const c = e.getContext('2d', { willReadFrequently: true }) // Yazılımsal tuval: GPU bağlamı düşse de içeriği silinmez
  if (!c) throw new Error('Tuval kullanılamıyor')
  ciz(c)
  const d = new THREE.CanvasTexture(e); d.colorSpace = THREE.SRGBColorSpace; d.anisotropy = 8
  if (tekrar) { d.wrapS = d.wrapT = THREE.RepeatWrapping; d.repeat.set(...tekrar) }
  return d
}
function benek(c: CanvasRenderingContext2D, g: number, y: number, adet: number, renkler: string[], enB: number, alfa: number) {
  let s = 777
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < adet; i++) { c.fillStyle = renkler[Math.floor(r() * renkler.length)]; c.globalAlpha = alfa * r(); c.fillRect(r() * g, r() * y, 1 + r() * enB, 1 + r() * enB) }
  c.globalAlpha = 1
}
const sivaDoku = () => tuval(512, 512, (c) => { c.fillStyle = '#c9b89b'; c.fillRect(0, 0, 512, 512); benek(c, 512, 512, 7000, ['#b3a182', '#dccdb2', '#a59274'], 7, .3) }, [3, 2])
const tahtaDoku = () => tuval(1024, 256, (c) => {
  c.fillStyle = '#6a4629'; c.fillRect(0, 0, 1024, 256)
  for (let i = 0; i < 180; i++) { c.strokeStyle = i % 3 ? '#54351e' : '#80583a'; c.globalAlpha = .28; c.lineWidth = 1 + (i % 3); const y = (i * 37) % 256; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(300, y + 7, 700, y - 7, 1024, y + 3); c.stroke() }
  c.globalAlpha = 1
})
const tugla = (tekrar: [number, number]) => tuval(512, 512, (c) => {
  c.fillStyle = '#42352d'; c.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { c.fillStyle = ['#9a4d30', '#a65a38', '#8a4329', '#b0653f'][(x * 3 + y * 5 + 8) % 4]; c.fillRect(x * 128 + (y % 2 ? 64 : 0) + 3, y * 64 + 3, 122, 58) }
  benek(c, 512, 512, 3000, ['#5b2c1a', '#c98a60'], 4, .2)
}, tekrar)
const zeminDoku = () => tuval(512, 512, (c) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = ['#7c5a44', '#6f4f3a', '#85634b'][(x * 2 + y) % 3]; c.fillRect(x * 128, y * 128, 128, 128); c.strokeStyle = '#3d2c20'; c.lineWidth = 4; c.strokeRect(x * 128, y * 128, 128, 128) }
  benek(c, 512, 512, 4000, ['#4a3526', '#9b7a60'], 5, .22)
}, [5, 5])
/** Duvar şeridi: lale biçiminden üretilmiş dekor karoları. Yalnız atmosfer içindir. */
const karoDoku = () => tuval(256, 256, (c) => {
  c.fillStyle = '#f1ecdf'; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = '#123f96'; c.lineWidth = 6; c.strokeRect(5, 5, 246, 246)
  c.fillStyle = '#159fa8'; c.beginPath(); lale.forEach(([x, y], i) => { const X = 128 + x * 150, Y = 215 - y * 215; if (i) c.lineTo(X, Y); else c.moveTo(X, Y) }); c.fill()
  c.fillStyle = '#c5301f'; c.beginPath(); c.arc(128, 150, 13, 0, 7); c.fill()
}, [14, 1])

function plakaProfili(b: number) {
  const camur: N[] = [[0, .088], [.02, .086], [.04, .078], [.056, .062], [.067, .042], [.073, .024], [.075, .012], [.07, .004], [.04, 0], [.0001, 0]]
  const tabak: N[] = [[0, .012], [.09, .012], [.125, .016], [.15, .03], [.16, .042], [.163, .038], [.15, .022], [.125, .007], [.075, 0], [.0001, 0]]
  const noktalar = camur.map(([x, y], i) => new THREE.Vector2(x + (tabak[i][0] - x) * b, y + (tabak[i][1] - y) * b))
  return new THREE.CatmullRomCurve3(noktalar.map((p) => new THREE.Vector3(p.x, p.y, 0)), false, 'centripetal').getPoints(42).map((p) => new THREE.Vector2(Math.max(p.x, .0001), p.y))
}
function plakaGeometrisi(b: number) {
  const g = new THREE.LatheGeometry(plakaProfili(b), 96)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * R), .5 + p.getZ(i) / (2 * R))
  uv.needsUpdate = true
  g.computeVertexNormals()
  return g
}

export function sahneOlustur(alan: HTMLElement, yayinla: (d: Oyun) => void, hata: () => void): CiniSahnesi {
  let d = ilkOyun()
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  alan.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1c1511')
  const pmrem = new THREE.PMREMGenerator(renderer)
  let cevre = pmrem.fromScene(new RoomEnvironment(), .04)
  scene.environment = cevre.texture
  scene.environmentIntensity = .42
  const camera = new THREE.PerspectiveCamera(42, 1, .03, 40)

  const gunes = new THREE.DirectionalLight('#ffe6c4', 2.1)
  gunes.position.set(-1.6, 2.8, 1.6); gunes.target.position.set(0, .9, 0)
  gunes.castShadow = true; gunes.shadow.mapSize.set(1536, 1536)
  Object.assign(gunes.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: .5, far: 7 })
  gunes.shadow.bias = -.0006
  scene.add(gunes, gunes.target, new THREE.HemisphereLight('#f4e1c2', '#3a281c', .55))

  const dokular: THREE.Texture[] = [], geometriler: THREE.BufferGeometry[] = [], malzemeler: THREE.Material[] = []
  const std = (o: THREE.MeshStandardMaterialParameters) => { const m = new THREE.MeshStandardMaterial(o); malzemeler.push(m); if (o.map) dokular.push(o.map); return m }
  const ek = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, ebeveyn: THREE.Object3D = scene, golge = true) => {
    geometriler.push(g); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = golge; o.receiveShadow = true; ebeveyn.add(o); return o
  }

  // Oda
  const zemin = ek(new THREE.PlaneGeometry(7, 7), std({ map: zeminDoku(), roughness: .9 }), 0, 0, 0, scene, false); zemin.rotation.x = -Math.PI / 2
  const siva = std({ map: sivaDoku(), roughness: .95 })
  ek(new THREE.PlaneGeometry(7, 3.4), siva, 0, 1.7, -1.75, scene, false)
  const solDuvar = ek(new THREE.PlaneGeometry(7, 3.4), siva, -2.3, 1.7, 0, scene, false); solDuvar.rotation.y = Math.PI / 2
  const sagDuvar = ek(new THREE.PlaneGeometry(7, 3.4), siva, 2.3, 1.7, 0, scene, false); sagDuvar.rotation.y = -Math.PI / 2
  const tavan = ek(new THREE.PlaneGeometry(7, 7), std({ color: '#4a3425', roughness: .95 }), 0, 3.4, 0, scene, false); tavan.rotation.x = Math.PI / 2
  ek(new THREE.PlaneGeometry(7, .36), std({ map: karoDoku(), roughness: .25, metalness: .05 }), 0, 1.25, -1.74, scene, false)

  // Tezgâh ve çark
  const tahta = std({ map: tahtaDoku(), roughness: .72 })
  ek(new THREE.BoxGeometry(1.7, .06, .95), tahta, 0, .86, -.05)
  for (const [x, z] of [[-.78, -.45], [.78, -.45], [-.78, .35], [.78, .35]]) ek(new THREE.BoxGeometry(.07, .84, .07), tahta, x, .42, z)
  const demir = std({ color: '#3a3a38', roughness: .55, metalness: .7 })
  ek(new THREE.CylinderGeometry(.13, .18, .03, 40), demir, 0, .905, 0)
  const cark = ek(new THREE.CylinderGeometry(.2, .2, .018, 56), std({ color: '#8c6a4d', roughness: .78 }), 0, .93, 0)
  const cizgi = ek(new THREE.BoxGeometry(.36, .002, .012), std({ color: '#51392a', roughness: .9 }), 0, .01, 0, cark, false); cizgi.castShadow = false

  // Raf, kurumakta olan ve bitmiş kaplar
  const raf = ek(new THREE.BoxGeometry(2.3, .05, .3), tahta, -.6, 1.72, -1.58)
  raf.receiveShadow = true
  const kap = (x: number, r: number, h: number, renk: string, parlak: boolean) => {
    const pr = [[0, 0], [r * .55, 0], [r, h * .34], [r * .72, h * .68], [r * .36, h * .82], [r * .46, h], [r * .4, h]].map(([a, b]) => new THREE.Vector2(a + .0001, b))
    ek(new THREE.LatheGeometry(pr, 28), std({ color: renk, roughness: parlak ? .18 : .9, side: THREE.DoubleSide }), x, 1.745, -1.58)
  }
  kap(-1.4, .1, .27, '#c7a483', false); kap(-1.05, .08, .22, '#c7a483', false); kap(-.7, .11, .3, '#e9e2d0', false); kap(-.3, .09, .26, '#159fa8', true); kap(.1, .1, .28, '#123f96', true)

  // Boya kapları (renkler oyundakiyle aynı)
  ;['#123f96', '#159fa8', '#1f7d4d', '#c5301f'].forEach((r, i) => {
    ek(new THREE.CylinderGeometry(.038, .032, .045, 22), std({ color: '#d9d1bd', roughness: .6 }), -.62 + i * .1, .912, .22)
    ek(new THREE.CylinderGeometry(.031, .031, .002, 22), std({ color: r, roughness: .9 }), -.62 + i * .1, .935, .22, scene, false)
  })

  // Fırın: tuğla gövde, kemerli ağız, içte ateş.
  const firinGrup = new THREE.Group()
  firinGrup.position.set(1.32, .38, -1.02); firinGrup.rotation.y = -.55
  scene.add(firinGrup)
  const sekil = new THREE.Shape(); sekil.moveTo(-.65, 0); sekil.lineTo(.65, 0); sekil.lineTo(.65, 1.25); sekil.absarc(0, 1.25, .65, 0, Math.PI); sekil.lineTo(-.65, 0)
  const agiz = new THREE.Path(); agiz.moveTo(-.3, .5); agiz.lineTo(.3, .5); agiz.lineTo(.3, .86); agiz.absarc(0, .86, .3, 0, Math.PI); agiz.lineTo(-.3, .5)
  sekil.holes.push(agiz)
  const gv = new THREE.ExtrudeGeometry(sekil, { depth: .12, bevelEnabled: false }); gv.scale(1, 1, 1)
  const uvOlc = gv.attributes.uv; for (let i = 0; i < uvOlc.count; i++) uvOlc.setXY(i, uvOlc.getX(i) * .9, uvOlc.getY(i) * .9)
  ek(gv, std({ map: tugla([3, 3]), roughness: .92 }), 0, 0, .42, firinGrup)
  const yan = std({ map: tugla([2.5, 2.5]), roughness: .95 })
  ek(new THREE.BoxGeometry(1.5, .38, 1.02), yan, 0, -.19, 0, firinGrup)
  ek(new THREE.BoxGeometry(1.3, 1.25, .84), std({ color: '#2a1c15', roughness: 1, side: THREE.BackSide }), 0, .625, 0, firinGrup, false)
  ek(new THREE.BoxGeometry(.06, 1.25, .84), yan, -.68, .625, 0, firinGrup); ek(new THREE.BoxGeometry(.06, 1.25, .84), yan, .68, .625, 0, firinGrup)
  ek(new THREE.CylinderGeometry(.68, .68, .84, 32, 1, false, Math.PI / 2, Math.PI), yan, 0, 1.25, 0, firinGrup).rotation.x = Math.PI / 2
  const rafFirin = ek(new THREE.BoxGeometry(.56, .03, .6), std({ color: '#54483e', roughness: .9 }), 0, .55, .12, firinGrup, false); rafFirin.castShadow = false
  const atesDoku = tuval(256, 256, (c) => { const g = c.createRadialGradient(128, 170, 8, 128, 150, 128); g.addColorStop(0, '#fff2c0'); g.addColorStop(.35, '#ff9a33'); g.addColorStop(.75, 'rgba(180,40,10,.55)'); g.addColorStop(1, 'rgba(60,8,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256) })
  const atesM = new THREE.MeshBasicMaterial({ map: atesDoku, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })
  dokular.push(atesDoku); malzemeler.push(atesM)
  const alevler = Array.from({ length: 7 }, (_, i) => { const o = ek(new THREE.PlaneGeometry(.42, .5), atesM, -.2 + (i % 4) * .13, .68, -.12 + i * .02, firinGrup, false); o.castShadow = false; return o })
  const atesIsik = new THREE.PointLight('#ff8a3a', 0, 3.2, 1.6); atesIsik.position.set(0, .8, .5); firinGrup.add(atesIsik)
  const firinNoktasi = new THREE.Vector3(0, .72, .2)

  // Tabak
  const yuzey = yuzeyOlustur(renderer.capabilities.getMaxAnisotropy())
  const plakaM = new THREE.MeshPhysicalMaterial({ map: yuzey.doku, roughness: .86, metalness: 0, clearcoat: 0, clearcoatRoughness: .22, specularIntensity: .55, side: THREE.DoubleSide })
  malzemeler.push(plakaM)
  const plaka = new THREE.Group(), donen = new THREE.Group()
  plaka.add(donen); scene.add(plaka)
  plaka.position.set(0, PLAKA_Y, 0)
  let cizilenBicim = -1
  const plakaMesh = new THREE.Mesh(plakaGeometrisi(0), plakaM)
  plakaMesh.castShadow = plakaMesh.receiveShadow = true
  donen.add(plakaMesh)
  const yuzeyY = () => plakaGeometrisiY(d.bicim)
  function plakaGeometrisiY(b: number) { return .03 * (1 - b) + .013 * b }

  // Kömür kâğıdı
  const kagitD = kagitDokusu(); dokular.push(kagitD)
  const kagit = ek(new THREE.CircleGeometry(R * 1.04, 64), new THREE.MeshBasicMaterial({ map: kagitD, transparent: true, depthWrite: false, toneMapped: false }), 0, .02, 0, plaka, false)
  kagit.rotation.x = -Math.PI / 2
  // Dairenin UV'si tuvalle aynı hizaya alınır.
  { const g = kagit.geometry, p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * R * 1.04), .5 - p.getY(i) / (2 * R * 1.04)) }
  malzemeler.push(kagit.material as THREE.Material)

  // Aletler: işaretin gittiği yerde durur.
  const fircaGrup = new THREE.Group(); scene.add(fircaGrup); fircaGrup.visible = false
  ek(new THREE.CylinderGeometry(.0045, .0035, .17, 10), std({ color: '#7a4f2d', roughness: .6 }), 0, .1, 0, fircaGrup)
  const fircaUc = ek(new THREE.ConeGeometry(.0065, .026, 10), std({ color: '#1b2230', roughness: .8 }), 0, .012, 0, fircaGrup); fircaUc.rotation.x = Math.PI
  const kese = ek(new THREE.SphereGeometry(.034, 18, 12), std({ color: '#2b2622', roughness: 1 }), 0, 0, 0, scene); kese.visible = false; kese.scale.y = .72
  const akis = ek(new THREE.CylinderGeometry(.008, .012, .44, 12), std({ color: '#f7f3e8', roughness: .4 }), 0, 1.2, 0, scene, false); akis.visible = false

  // Durum
  const tutulan: Record<TutAd, boolean> = { astar: false, sir: false, ates: false }
  const ray = new THREE.Ray(), ters = new THREE.Matrix4(), yerel = new THREE.Vector3(), duzlem = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const birimNokta = (r: THREE.Ray): N | null => {
    plaka.updateWorldMatrix(true, true)
    ters.copy(plaka.matrixWorld).invert()
    ray.copy(r).applyMatrix4(ters)
    duzlem.constant = -yuzeyY()
    const h = ray.intersectPlane(duzlem, yerel)
    return h ? [h.x / R, h.z / R] : null
  }
  let basili = false, sonN: N | null = null, sonT = 0
  const aracGoster = (n: N | null) => {
    const a = d.asama, fircali = a === 3 || a === 4
    fircaGrup.visible = fircali && !!n && Math.hypot(n[0], n[1]) < 1.2
    kese.visible = a === 2 && !!n && Math.hypot(n[0], n[1]) < 1.25
    if (!n) return
    plaka.localToWorld(yerel.set(n[0] * R, yuzeyY() + (basili ? .002 : .016), n[1] * R))
    if (fircaGrup.visible) { fircaGrup.position.copy(yerel); fircaGrup.quaternion.copy(plaka.quaternion); fircaGrup.rotateZ(-.32); fircaGrup.rotateX(.2) }
    if (kese.visible) kese.position.copy(yerel).add(new THREE.Vector3(0, .026, 0))
  }
  const fircaRengi = () => (fircaUc.material as THREE.MeshStandardMaterial).color.set(d.asama === 4 ? { kobalt: '#123f96', turkuaz: '#159fa8', yesil: '#1f7d4d', kirmizi: '#c5301f' }[d.renk] : '#1b2230')
  const uygula = (n: N, ilk: boolean) => {
    const a = d.asama, t = performance.now()
    if (a === 0) { if (sonN && !ilk) sekillendir(d, Math.hypot(n[0] - sonN[0], n[1] - sonN[1]), Math.max((t - sonT) / 1000, 1 / 60)) }
    else if (a === 2) komurle(d, n)
    else if (a === 3) {
      // Hızlı fırça olaylar arasında kalan noktaları atlamasın.
      const adim = sonN && !ilk ? Math.ceil(Math.hypot(n[0] - sonN[0], n[1] - sonN[1]) / .025) : 1
      for (let i = 1; i <= adim; i++) tahrirCiz(d, sonN && !ilk ? [sonN[0] + ((n[0] - sonN[0]) * i) / adim, sonN[1] + ((n[1] - sonN[1]) * i) / adim] : n)
    } else if (a === 4) boya(d, bolgeBul(n))
    sonN = n; sonT = t
  }
  const isaretBas = (r: THREE.Ray) => { const n = birimNokta(r); basili = true; sonN = null; if (n) uygula(n, true); aracGoster(n) }
  const isaretGez = (r: THREE.Ray) => { const n = birimNokta(r); if (basili && n) uygula(n, false); aracGoster(n) }
  const isaretBirak = () => { basili = false; sonN = null }

  const komut = (id: string) => {
    if (id.startsWith('renk:')) { renkSec(d, id.slice(5) as RenkId); fircaRengi() }
    else if (id === 'boyabitti') boyaBitir(d)
    else if (id === 'bastan') { d = ilkOyun(); plakaM.roughness = .86; plakaM.clearcoat = 0; donen.rotation.y = 0; cizilenBicim = -1 }
    yenile(true)
  }
  const tut = (ad: TutAd, acik: boolean) => { tutulan[ad] = acik }
  const usta = () => { ustaTamamla(d); yenile(true) }

  // Masaüstü girişi
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enabled = false; controls.enableDamping = true; controls.minDistance = .25; controls.maxDistance = 1.3
  const isaretci = new THREE.Raycaster(), ndc = new THREE.Vector2()
  const fareRay = (e: PointerEvent) => {
    const b = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    isaretci.setFromCamera(ndc, camera)
    return isaretci.ray
  }
  const asagi = (e: PointerEvent) => { if (d.asama === 6 || e.button !== 0 || xr.aktif()) return; renderer.domElement.setPointerCapture(e.pointerId); isaretBas(fareRay(e)) }
  const gez = (e: PointerEvent) => { if (d.asama === 6 || xr.aktif()) return; isaretGez(fareRay(e)) }
  const yukari = () => isaretBirak()
  const canvas = renderer.domElement
  canvas.addEventListener('pointerdown', asagi); canvas.addEventListener('pointermove', gez); canvas.addEventListener('pointerup', yukari); canvas.addEventListener('pointercancel', yukari)
  // Bağlam kısa süreliğine düşüp geri gelebilir (bazı tarayıcılar açılışta böyle yapar): hemen hata gösterilmez.
  let kayipSayac = 0
  const kayip = (e: Event) => { e.preventDefault(); renderer.setAnimationLoop(null); kayipSayac = window.setTimeout(hata, 3000) }
  const geldi = () => {
    clearTimeout(kayipSayac)
    // Çevre haritası bir çizim hedefidir, içeriği bağlamla kaybolur.
    cevre.dispose(); cevre = pmrem.fromScene(new RoomEnvironment(), .04); scene.environment = cevre.texture
    onceki = performance.now(); renderer.setAnimationLoop(kare)
  }
  canvas.addEventListener('webglcontextlost', kayip); canvas.addEventListener('webglcontextrestored', geldi)

  function boyutla() {
    if (renderer.xr.isPresenting) return
    const w = alan.clientWidth, h = Math.max(alan.clientHeight, 1)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    if (w > 700) camera.setViewOffset(w, h, 165, 0, w, h); else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }
  const izleyici = new ResizeObserver(boyutla); izleyici.observe(alan); boyutla()

  // Poz hedefleri
  const hedefK = new THREE.Vector3(), hedefB = new THREE.Vector3(), hedefP = new THREE.Vector3(), hedefQ = new THREE.Quaternion(), hedefE = new THREE.Euler()
  let hedefO = 1
  const kameraHedefi = () => {
    const a = d.asama
    if (d.firinda) { firinGrup.localToWorld(hedefB.copy(firinNoktasi)); hedefK.set(.12, 1.32, .5); return }
    if (a === 2 || a === 3 || a === 4) { hedefK.set(0, 1.5, .25); hedefB.set(0, .945, .02); return }
    if (a === 6) { hedefK.set(0, 1.28, .62); hedefB.set(0, 1.13, 0); return }
    if (a === 0) { hedefK.set(0, 1.3, .8); hedefB.set(0, .97, -.02); return }
    hedefK.set(0, 1.32, .72); hedefB.set(0, .97, -.02)
  }
  const plakaHedefi = () => {
    const a = d.asama, vr = xr.aktif(), masa = a >= 1 && a <= 5 && !d.firinda
    hedefO = vr && a > 0 ? 1.5 : 1
    if (d.firinda) { firinGrup.localToWorld(hedefP.copy(firinNoktasi)); hedefQ.setFromEuler(hedefE.set(.95, firinGrup.rotation.y, 0, 'YXZ')); hedefO = 1; return }
    if (a === 6) { hedefP.set(0, vr ? 1.38 : 1.13, vr ? -.05 : 0); hedefQ.setFromEuler(hedefE.set(vr ? 1.15 : .95, 0, 0)); return }
    if (vr && masa) { hedefP.set(0, 1.2, -.02); hedefQ.setFromEuler(hedefE.set(.85, 0, 0)); return }
    hedefP.set(0, PLAKA_Y, 0); hedefQ.identity()
  }

  let sonYayin = 0, onceki = performance.now(), zaman = 0
  const yenile = (hemen = false) => {
    yuzey.ciz(d)
    if (d.bicim !== cizilenBicim) {
      cizilenBicim = d.bicim
      plakaMesh.geometry.dispose(); plakaMesh.geometry = plakaGeometrisi(d.bicim)
    }
    const t = performance.now()
    if (hemen || t - sonYayin > 120) {
      sonYayin = t
      yayinla({ ...d, boyalar: [...d.boyalar] })
      const b = canvas.getBoundingClientRect(), n = plaka.localToWorld(new THREE.Vector3(0, yuzeyY(), 0)).project(camera), x = plaka.localToWorld(new THREE.Vector3(R, yuzeyY(), 0)).project(camera), z = plaka.localToWorld(new THREE.Vector3(0, yuzeyY(), R)).project(camera)
      const ek = (v: THREE.Vector3) => [((v.x + 1) / 2) * b.width, ((1 - v.y) / 2) * b.height].map((q) => q.toFixed(1)).join(',')
      Object.assign(alan.dataset, { asama: String(d.asama), alt: String(d.alt), iz: `${d.iz}/${d.izSira}`, isi: d.isi.toFixed(0), kalite: String(kalite(d)), plakaMerkez: ek(n), plakaX: ek(x), plakaZ: ek(z), xr: String(xr.aktif()) })
    }
  }

  const xrBaglam: XrBaglam = {
    renderer, scene, camera, plaka,
    oyun: () => d, eylemler: () => eylemler(d), asamaAdi: () => asamalar[d.asama], kalite: () => kalite(d),
    isiAraligi: () => (d.asama === 1 ? BISKUVI : SIR_FIRINI),
    isaretBas, isaretGez, isaretBirak, komut, tut, usta,
    aracGizle: () => { fircaGrup.visible = false; kese.visible = false },
    boyutla, plakaYaricap: R,
    kameraGeriYukle: () => { boyutla(); alan.dispatchEvent(new Event('xrbitti')) },
  }
  const xr = xrKur(xrBaglam)

  const kare = () => {
    const simdi = performance.now(), dt = Math.min(.1, (simdi - onceki) / 1000)
    onceki = simdi; zaman += dt
    if (tutulan.astar) astarSur(d, dt)
    if (tutulan.sir) sirDok(d, dt)
    if (d.firinda) firin(d, dt, tutulan.ates); else if (tutulan.ates) tutulan.ates = false
    sogut(d, dt)

    // Çark: şekil verilirken ve sıvı sürülürken döner.
    const donuyor = d.asama === 0 || tutulan.astar || tutulan.sir
    if (donuyor) { cark.rotation.y += dt * 6; donen.rotation.y += dt * 6 }
    else if (d.asama >= 1 && d.asama <= 5) donen.rotation.y = 0
    akis.visible = tutulan.astar || tutulan.sir
    if (akis.visible) { plaka.getWorldPosition(akis.position); akis.position.y += .24; (akis.material as THREE.MeshStandardMaterial).color.set(d.asama === 1 ? '#f4eedd' : '#fbfaf3') }
    kagit.visible = d.asama === 2
    if (kagit.visible) kagit.position.y = yuzeyY() + .004
    if (d.asama !== 2) kese.visible = false
    if (d.asama !== 3 && d.asama !== 4) fircaGrup.visible = false

    // Yüzey malzemesi: mat bisküviden camlaşan sıra.
    plakaM.roughness = d.canli > 0 ? .86 + (.3 - .86) * d.canli : d.astar > 0 ? .78 : .62
    plakaM.clearcoat = d.canli * .55
    const sicak = d.firinda ? Math.max(0, (d.isi - 300) / 700) : 0
    plakaM.emissive.setRGB(sicak * .9, sicak * .28, sicak * .05)
    plakaM.emissiveIntensity = sicak * .55

    // Ateş
    const guc = d.firinda ? Math.min(1, (d.isi - 20) / 880) : 0
    atesM.opacity += (guc * (.72 + Math.sin(zaman * 13) * .1) - atesM.opacity) * Math.min(1, dt * 6)
    atesIsik.intensity = atesM.opacity * 5.5
    alevler.forEach((o, i) => { o.scale.y = .78 + Math.sin(zaman * (7 + i) + i) * .22; o.position.x = -.2 + (i % 4) * .13 + Math.sin(zaman * 3 + i) * .015 })

    plakaHedefi()
    const k = Math.min(1, dt * 3.6)
    if (!xr.tutuluyor()) {
      plaka.position.lerp(hedefP, k); plaka.quaternion.slerp(hedefQ, k)
      const o = plaka.scale.x + (hedefO - plaka.scale.x) * k; plaka.scale.setScalar(o)
    }
    if (d.asama === 6 && !xr.tutuluyor() && !basili) donen.rotation.y += dt * .25

    if (xr.aktif()) xr.kare()
    else {
      kameraHedefi()
      controls.enabled = d.asama === 6
      if (d.asama === 6) { controls.target.lerp(hedefB, k); controls.update() }
      else { camera.position.lerp(hedefK, k); controls.target.lerp(hedefB, k); camera.lookAt(controls.target) }
    }
    yenile()
    renderer.render(scene, camera)
  }
  camera.position.set(0, 1.3, .8); controls.target.set(0, .97, -.02)
  yenile(true)
  renderer.setAnimationLoop(kare)

  return {
    komut, tut, usta,
    xrBaslat: () => xr.baslat(),
    xrBitir: () => xr.bitir(),
    temizle: () => {
      renderer.setAnimationLoop(null)
      xr.temizle(); izleyici.disconnect(); controls.dispose()
      canvas.removeEventListener('pointerdown', asagi); canvas.removeEventListener('pointermove', gez); canvas.removeEventListener('pointerup', yukari); canvas.removeEventListener('pointercancel', yukari); canvas.removeEventListener('webglcontextlost', kayip); canvas.removeEventListener('webglcontextrestored', geldi); clearTimeout(kayipSayac)
      yuzey.dispose(); plakaMesh.geometry.dispose(); cevre.dispose(); pmrem.dispose()
      geometriler.forEach((g) => g.dispose()); malzemeler.forEach((m) => m.dispose()); dokular.forEach((t) => t.dispose())
      renderer.dispose(); canvas.remove()
    },
  }
}
