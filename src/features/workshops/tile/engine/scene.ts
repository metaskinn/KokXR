// Tile workshop scene: desktop mouse/touch and VR controller enter the game through the same "pointer" path.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { findRegion, tulip, type N } from './pattern'
import { paperTexture, createSurface } from './texture'
import { stages, applySlip, paint, finishPaint, actions, kiln, firstGame, quality, withCoal, pickColor, shapeUp, pourGlaze, cool, drawOutline, masterComplete, BISQUE, GLAZE_KILN, type Game, type ColorId } from './state'
import { setupXr, type XrContext } from './xr'

const R = .16
const PLATE_Y = .94
export type HoldName = 'primer' | 'glaze' | 'fire'
export interface TileScene {
  command: (id: string) => void
  hold: (ad: HoldName, open: boolean) => void
  master: () => void
  startXr: () => Promise<void>
  endXr: () => void
  clear: () => void
}

function canvas(g: number, y: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const e = document.createElement('canvas'); e.width = g; e.height = y
  const c = e.getContext('2d', { willReadFrequently: true }) // Software canvas: its content survives even if the GPU context is lost
  if (!c) throw new Error('Canvas unavailable')
  draw(c)
  const d = new THREE.CanvasTexture(e); d.colorSpace = THREE.SRGBColorSpace; d.anisotropy = 8
  if (repeat) { d.wrapS = d.wrapT = THREE.RepeatWrapping; d.repeat.set(...repeat) }
  return d
}
function speck(c: CanvasRenderingContext2D, g: number, y: number, count: number, colors: string[], wB: number, alpha: number) {
  let s = 777
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < count; i++) { c.fillStyle = colors[Math.floor(r() * colors.length)]; c.globalAlpha = alpha * r(); c.fillRect(r() * g, r() * y, 1 + r() * wB, 1 + r() * wB) }
  c.globalAlpha = 1
}
const plasterTex = () => canvas(512, 512, (c) => { c.fillStyle = '#c9b89b'; c.fillRect(0, 0, 512, 512); speck(c, 512, 512, 7000, ['#b3a182', '#dccdb2', '#a59274'], 7, .3) }, [3, 2])
const plankTex = () => canvas(1024, 256, (c) => {
  c.fillStyle = '#6a4629'; c.fillRect(0, 0, 1024, 256)
  for (let i = 0; i < 180; i++) { c.strokeStyle = i % 3 ? '#54351e' : '#80583a'; c.globalAlpha = .28; c.lineWidth = 1 + (i % 3); const y = (i * 37) % 256; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(300, y + 7, 700, y - 7, 1024, y + 3); c.stroke() }
  c.globalAlpha = 1
})
const brick = (repeat: [number, number]) => canvas(512, 512, (c) => {
  c.fillStyle = '#42352d'; c.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { c.fillStyle = ['#9a4d30', '#a65a38', '#8a4329', '#b0653f'][(x * 3 + y * 5 + 8) % 4]; c.fillRect(x * 128 + (y % 2 ? 64 : 0) + 3, y * 64 + 3, 122, 58) }
  speck(c, 512, 512, 3000, ['#5b2c1a', '#c98a60'], 4, .2)
}, repeat)
const floorTex = () => canvas(512, 512, (c) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = ['#7c5a44', '#6f4f3a', '#85634b'][(x * 2 + y) % 3]; c.fillRect(x * 128, y * 128, 128, 128); c.strokeStyle = '#3d2c20'; c.lineWidth = 4; c.strokeRect(x * 128, y * 128, 128, 128) }
  speck(c, 512, 512, 4000, ['#4a3526', '#9b7a60'], 5, .22)
}, [5, 5])
/** Wall band: decorative tiles generated from the tulip shape. Atmosphere only. */
const tileSquareTex = () => canvas(256, 256, (c) => {
  c.fillStyle = '#f1ecdf'; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = '#123f96'; c.lineWidth = 6; c.strokeRect(5, 5, 246, 246)
  c.fillStyle = '#159fa8'; c.beginPath(); tulip.forEach(([x, y], i) => { const X = 128 + x * 150, Y = 215 - y * 215; if (i) c.lineTo(X, Y); else c.moveTo(X, Y) }); c.fill()
  c.fillStyle = '#c5301f'; c.beginPath(); c.arc(128, 150, 13, 0, 7); c.fill()
}, [14, 1])

function plateProfile(b: number) {
  const clay: N[] = [[0, .088], [.02, .086], [.04, .078], [.056, .062], [.067, .042], [.073, .024], [.075, .012], [.07, .004], [.04, 0], [.0001, 0]]
  const dish: N[] = [[0, .012], [.09, .012], [.125, .016], [.15, .03], [.16, .042], [.163, .038], [.15, .022], [.125, .007], [.075, 0], [.0001, 0]]
  const points = clay.map(([x, y], i) => new THREE.Vector2(x + (dish[i][0] - x) * b, y + (dish[i][1] - y) * b))
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p.x, p.y, 0)), false, 'centripetal').getPoints(42).map((p) => new THREE.Vector2(Math.max(p.x, .0001), p.y))
}
function plateGeometry(b: number) {
  const g = new THREE.LatheGeometry(plateProfile(b), 96)
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * R), .5 + p.getZ(i) / (2 * R))
  uv.needsUpdate = true
  g.computeVertexNormals()
  return g
}

export function createScene(area: HTMLElement, publish: (d: Game) => void, error: () => void): TileScene {
  let d = firstGame()
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  area.prepend(renderer.domElement)

  const threeScene = new THREE.Scene()
  threeScene.background = new THREE.Color('#1c1511')
  const pmrem = new THREE.PMREMGenerator(renderer)
  let surroundings = pmrem.fromScene(new RoomEnvironment(), .04)
  threeScene.environment = surroundings.texture
  threeScene.environmentIntensity = .42
  const camera = new THREE.PerspectiveCamera(42, 1, .03, 40)

  const sun = new THREE.DirectionalLight('#ffe6c4', 2.1)
  sun.position.set(-1.6, 2.8, 1.6); sun.target.position.set(0, .9, 0)
  sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536)
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: .5, far: 7 })
  sun.shadow.bias = -.0006
  threeScene.add(sun, sun.target, new THREE.HemisphereLight('#f4e1c2', '#3a281c', .55))

  const textures: THREE.Texture[] = [], geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const std = (o: THREE.MeshStandardMaterialParameters) => { const m = new THREE.MeshStandardMaterial(o); materials.push(m); if (o.map) textures.push(o.map); return m }
  const ext = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = threeScene, shadow = true) => {
    geometries.push(g); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o
  }

  // Room
  const floor = ext(new THREE.PlaneGeometry(7, 7), std({ map: floorTex(), roughness: .9 }), 0, 0, 0, threeScene, false); floor.rotation.x = -Math.PI / 2
  const plaster = std({ map: plasterTex(), roughness: .95 })
  ext(new THREE.PlaneGeometry(7, 3.4), plaster, 0, 1.7, -1.75, threeScene, false)
  const leftWall = ext(new THREE.PlaneGeometry(7, 3.4), plaster, -2.3, 1.7, 0, threeScene, false); leftWall.rotation.y = Math.PI / 2
  const rightWall = ext(new THREE.PlaneGeometry(7, 3.4), plaster, 2.3, 1.7, 0, threeScene, false); rightWall.rotation.y = -Math.PI / 2
  const ceiling = ext(new THREE.PlaneGeometry(7, 7), std({ color: '#4a3425', roughness: .95 }), 0, 3.4, 0, threeScene, false); ceiling.rotation.x = Math.PI / 2
  ext(new THREE.PlaneGeometry(7, .36), std({ map: tileSquareTex(), roughness: .25, metalness: .05 }), 0, 1.25, -1.74, threeScene, false)

  // Workbench and wheel
  const plank = std({ map: plankTex(), roughness: .72 })
  ext(new THREE.BoxGeometry(1.7, .06, .95), plank, 0, .86, -.05)
  for (const [x, z] of [[-.78, -.45], [.78, -.45], [-.78, .35], [.78, .35]]) ext(new THREE.BoxGeometry(.07, .84, .07), plank, x, .42, z)
  const iron = std({ color: '#3a3a38', roughness: .55, metalness: .7 })
  ext(new THREE.CylinderGeometry(.13, .18, .03, 40), iron, 0, .905, 0)
  const wheel = ext(new THREE.CylinderGeometry(.2, .2, .018, 56), std({ color: '#8c6a4d', roughness: .78 }), 0, .93, 0)
  const stroke = ext(new THREE.BoxGeometry(.36, .002, .012), std({ color: '#51392a', roughness: .9 }), 0, .01, 0, wheel, false); stroke.castShadow = false

  // Shelf, drying and finished vessels
  const raf = ext(new THREE.BoxGeometry(2.3, .05, .3), plank, -.6, 1.72, -1.58)
  raf.receiveShadow = true
  const container = (x: number, r: number, h: number, color: string, glossy: boolean) => {
    const pr = [[0, 0], [r * .55, 0], [r, h * .34], [r * .72, h * .68], [r * .36, h * .82], [r * .46, h], [r * .4, h]].map(([a, b]) => new THREE.Vector2(a + .0001, b))
    ext(new THREE.LatheGeometry(pr, 28), std({ color: color, roughness: glossy ? .18 : .9, side: THREE.DoubleSide }), x, 1.745, -1.58)
  }
  container(-1.4, .1, .27, '#c7a483', false); container(-1.05, .08, .22, '#c7a483', false); container(-.7, .11, .3, '#e9e2d0', false); container(-.3, .09, .26, '#159fa8', true); container(.1, .1, .28, '#123f96', true)

  // Paint pots (colors match the game)
  ;['#123f96', '#159fa8', '#1f7d4d', '#c5301f'].forEach((r, i) => {
    ext(new THREE.CylinderGeometry(.038, .032, .045, 22), std({ color: '#d9d1bd', roughness: .6 }), -.62 + i * .1, .912, .22)
    ext(new THREE.CylinderGeometry(.031, .031, .002, 22), std({ color: r, roughness: .9 }), -.62 + i * .1, .935, .22, threeScene, false)
  })

  // Kiln: brick body, arched mouth, fire inside.
  const kilnGroup = new THREE.Group()
  kilnGroup.position.set(1.32, .38, -1.02); kilnGroup.rotation.y = -.55
  threeScene.add(kilnGroup)
  const shape = new THREE.Shape(); shape.moveTo(-.65, 0); shape.lineTo(.65, 0); shape.lineTo(.65, 1.25); shape.absarc(0, 1.25, .65, 0, Math.PI); shape.lineTo(-.65, 0)
  const mouth = new THREE.Path(); mouth.moveTo(-.3, .5); mouth.lineTo(.3, .5); mouth.lineTo(.3, .86); mouth.absarc(0, .86, .3, 0, Math.PI); mouth.lineTo(-.3, .5)
  shape.holes.push(mouth)
  const gv = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: false }); gv.scale(1, 1, 1)
  const uvScale = gv.attributes.uv; for (let i = 0; i < uvScale.count; i++) uvScale.setXY(i, uvScale.getX(i) * .9, uvScale.getY(i) * .9)
  ext(gv, std({ map: brick([3, 3]), roughness: .92 }), 0, 0, .42, kilnGroup)
  const side = std({ map: brick([2.5, 2.5]), roughness: .95 })
  ext(new THREE.BoxGeometry(1.5, .38, 1.02), side, 0, -.19, 0, kilnGroup)
  ext(new THREE.BoxGeometry(1.3, 1.25, .84), std({ color: '#2a1c15', roughness: 1, side: THREE.BackSide }), 0, .625, 0, kilnGroup, false)
  ext(new THREE.BoxGeometry(.06, 1.25, .84), side, -.68, .625, 0, kilnGroup); ext(new THREE.BoxGeometry(.06, 1.25, .84), side, .68, .625, 0, kilnGroup)
  ext(new THREE.CylinderGeometry(.68, .68, .84, 32, 1, false, Math.PI / 2, Math.PI), side, 0, 1.25, 0, kilnGroup).rotation.x = Math.PI / 2
  const shelfKiln = ext(new THREE.BoxGeometry(.56, .03, .6), std({ color: '#54483e', roughness: .9 }), 0, .55, .12, kilnGroup, false); shelfKiln.castShadow = false
  const fireTex = canvas(256, 256, (c) => { const g = c.createRadialGradient(128, 170, 8, 128, 150, 128); g.addColorStop(0, '#fff2c0'); g.addColorStop(.35, '#ff9a33'); g.addColorStop(.75, 'rgba(180,40,10,.55)'); g.addColorStop(1, 'rgba(60,8,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256) })
  const fireM = new THREE.MeshBasicMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })
  textures.push(fireTex); materials.push(fireM)
  const flames = Array.from({ length: 7 }, (_, i) => { const o = ext(new THREE.PlaneGeometry(.42, .5), fireM, -.2 + (i % 4) * .13, .68, -.12 + i * .02, kilnGroup, false); o.castShadow = false; return o })
  const fireLight = new THREE.PointLight('#ff8a3a', 0, 3.2, 1.6); fireLight.position.set(0, .8, .5); kilnGroup.add(fireLight)
  const kilnPoint = new THREE.Vector3(0, .72, .2)

  // Plate
  const surface = createSurface(renderer.capabilities.getMaxAnisotropy())
  const plateM = new THREE.MeshPhysicalMaterial({ map: surface.texture, roughness: .86, metalness: 0, clearcoat: 0, clearcoatRoughness: .22, specularIntensity: .55, side: THREE.DoubleSide })
  materials.push(plateM)
  const plate = new THREE.Group(), spinning = new THREE.Group()
  plate.add(spinning); threeScene.add(plate)
  plate.position.set(0, PLATE_Y, 0)
  let drawnForm = -1
  const plateMesh = new THREE.Mesh(plateGeometry(0), plateM)
  plateMesh.castShadow = plateMesh.receiveShadow = true
  spinning.add(plateMesh)
  const surfaceY = () => plateGeometryY(d.form)
  function plateGeometryY(b: number) { return .03 * (1 - b) + .013 * b }

  // Pouncing paper
  const paperD = paperTexture(); textures.push(paperD)
  const paper = ext(new THREE.CircleGeometry(R * 1.04, 64), new THREE.MeshBasicMaterial({ map: paperD, transparent: true, depthWrite: false, toneMapped: false }), 0, .02, 0, plate, false)
  paper.rotation.x = -Math.PI / 2
  // The disc's UVs are aligned with the canvas.
  { const g = paper.geometry, p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * R * 1.04), .5 - p.getY(i) / (2 * R * 1.04)) }
  materials.push(paper.material as THREE.Material)

  // Tools: stay where the pointer goes.
  const brushGroup = new THREE.Group(); threeScene.add(brushGroup); brushGroup.visible = false
  ext(new THREE.CylinderGeometry(.0045, .0035, .17, 10), std({ color: '#7a4f2d', roughness: .6 }), 0, .1, 0, brushGroup)
  const brushTip = ext(new THREE.ConeGeometry(.0065, .026, 10), std({ color: '#1b2230', roughness: .8 }), 0, .012, 0, brushGroup); brushTip.rotation.x = Math.PI
  const pouch = ext(new THREE.SphereGeometry(.034, 18, 12), std({ color: '#2b2622', roughness: 1 }), 0, 0, 0, threeScene); pouch.visible = false; pouch.scale.y = .72
  const flow = ext(new THREE.CylinderGeometry(.008, .012, .44, 12), std({ color: '#f7f3e8', roughness: .4 }), 0, 1.2, 0, threeScene, false); flow.visible = false

  // State
  const held: Record<HoldName, boolean> = { primer: false, glaze: false, fire: false }
  const ray3 = new THREE.Ray(), inverse = new THREE.Matrix4(), local = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const unitPoint = (r: THREE.Ray): N | null => {
    plate.updateWorldMatrix(true, true)
    inverse.copy(plate.matrixWorld).invert()
    ray3.copy(r).applyMatrix4(inverse)
    plane.constant = -surfaceY()
    const h = ray3.intersectPlane(plane, local)
    return h ? [h.x / R, h.z / R] : null
  }
  let pressed = false, lastN: N | null = null, lastT = 0
  const showTool = (n: N | null) => {
    const a = d.stage, brushed = a === 3 || a === 4
    brushGroup.visible = brushed && !!n && Math.hypot(n[0], n[1]) < 1.2
    pouch.visible = a === 2 && !!n && Math.hypot(n[0], n[1]) < 1.25
    if (!n) return
    plate.localToWorld(local.set(n[0] * R, surfaceY() + (pressed ? .002 : .016), n[1] * R))
    if (brushGroup.visible) { brushGroup.position.copy(local); brushGroup.quaternion.copy(plate.quaternion); brushGroup.rotateZ(-.32); brushGroup.rotateX(.2) }
    if (pouch.visible) pouch.position.copy(local).add(new THREE.Vector3(0, .026, 0))
  }
  const brushColor = () => (brushTip.material as THREE.MeshStandardMaterial).color.set(d.stage === 4 ? { cobalt: '#123f96', turquoiseLight: '#159fa8', green: '#1f7d4d', red: '#c5301f' }[d.color] : '#1b2230')
  const apply = (n: N, first: boolean) => {
    const a = d.stage, t = performance.now()
    if (a === 0) { if (lastN && !first) shapeUp(d, Math.hypot(n[0] - lastN[0], n[1] - lastN[1]), Math.max((t - lastT) / 1000, 1 / 60)) }
    else if (a === 2) withCoal(d, n)
    else if (a === 3) {
      // A fast brush must not skip points between events.
      const step = lastN && !first ? Math.ceil(Math.hypot(n[0] - lastN[0], n[1] - lastN[1]) / .025) : 1
      for (let i = 1; i <= step; i++) drawOutline(d, lastN && !first ? [lastN[0] + ((n[0] - lastN[0]) * i) / step, lastN[1] + ((n[1] - lastN[1]) * i) / step] : n)
    } else if (a === 4) paint(d, findRegion(n))
    lastN = n; lastT = t
  }
  const markerStart = (r: THREE.Ray) => { const n = unitPoint(r); pressed = true; lastN = null; if (n) apply(n, true); showTool(n) }
  const walkMarkers = (r: THREE.Ray) => { const n = unitPoint(r); if (pressed && n) apply(n, false); showTool(n) }
  const markerRelease = () => { pressed = false; lastN = null }

  const command = (id: string) => {
    if (id.startsWith('color:')) { pickColor(d, id.slice(5) as ColorId); brushColor() }
    else if (id === 'paintdone') finishPaint(d)
    else if (id === 'fromStart') { d = firstGame(); plateM.roughness = .86; plateM.clearcoat = 0; spinning.rotation.y = 0; drawnForm = -1 }
    renew(true)
  }
  const hold = (ad: HoldName, open: boolean) => { held[ad] = open }
  const master = () => { masterComplete(d); renew(true) }

  // Desktop input
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enabled = false; controls.enableDamping = true; controls.minDistance = .25; controls.maxDistance = 1.3
  const pointer = new THREE.Raycaster(), ndc = new THREE.Vector2()
  const mouseRay = (e: PointerEvent) => {
    const b = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    pointer.setFromCamera(ndc, camera)
    return pointer.ray
  }
  const down = (e: PointerEvent) => { if (d.stage === 6 || e.button !== 0 || xr.active()) return; renderer.domElement.setPointerCapture(e.pointerId); markerStart(mouseRay(e)) }
  const roam = (e: PointerEvent) => { if (d.stage === 6 || xr.active()) return; walkMarkers(mouseRay(e)) }
  const up = () => markerRelease()
  const canvasEl3 = renderer.domElement
  canvasEl3.addEventListener('pointerdown', down); canvasEl3.addEventListener('pointermove', roam); canvasEl3.addEventListener('pointerup', up); canvasEl3.addEventListener('pointercancel', up)
  // The context may drop briefly and come back (some browsers do this on startup): no error is shown right away.
  let lossCounter = 0
  const lost = (e: Event) => { e.preventDefault(); renderer.setAnimationLoop(null); lossCounter = window.setTimeout(error, 3000) }
  const arrived = () => {
    clearTimeout(lossCounter)
    // The environment map is a render target; its content is lost with the context.
    surroundings.dispose(); surroundings = pmrem.fromScene(new RoomEnvironment(), .04); threeScene.environment = surroundings.texture
    previous = performance.now(); renderer.setAnimationLoop(frame)
  }
  canvasEl3.addEventListener('webglcontextlost', lost); canvasEl3.addEventListener('webglcontextrestored', arrived)

  function resize() {
    if (renderer.xr.isPresenting) return
    const w = area.clientWidth, h = Math.max(area.clientHeight, 1)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    if (w > 700) camera.setViewOffset(w, h, 165, 0, w, h); else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }
  const watcher = new ResizeObserver(resize); watcher.observe(area); resize()

  // Pose targets
  const targetK = new THREE.Vector3(), targetB = new THREE.Vector3(), targetP = new THREE.Vector3(), targetQ = new THREE.Quaternion(), targetE = new THREE.Euler()
  let targetO = 1
  const cameraTargetOf = () => {
    const a = d.stage
    if (d.inKiln) { kilnGroup.localToWorld(targetB.copy(kilnPoint)); targetK.set(.12, 1.32, .5); return }
    if (a === 2 || a === 3 || a === 4) { targetK.set(0, 1.5, .25); targetB.set(0, .945, .02); return }
    if (a === 6) { targetK.set(0, 1.28, .62); targetB.set(0, 1.13, 0); return }
    if (a === 0) { targetK.set(0, 1.3, .8); targetB.set(0, .97, -.02); return }
    targetK.set(0, 1.32, .72); targetB.set(0, .97, -.02)
  }
  const plateTarget = () => {
    const a = d.stage, vr = xr.active(), table = a >= 1 && a <= 5 && !d.inKiln
    targetO = vr && a > 0 ? 1.5 : 1
    if (d.inKiln) { kilnGroup.localToWorld(targetP.copy(kilnPoint)); targetQ.setFromEuler(targetE.set(.95, kilnGroup.rotation.y, 0, 'YXZ')); targetO = 1; return }
    if (a === 6) { targetP.set(0, vr ? 1.38 : 1.13, vr ? -.05 : 0); targetQ.setFromEuler(targetE.set(vr ? 1.15 : .95, 0, 0)); return }
    if (vr && table) { targetP.set(0, 1.2, -.02); targetQ.setFromEuler(targetE.set(.85, 0, 0)); return }
    targetP.set(0, PLATE_Y, 0); targetQ.identity()
  }

  let lastBroadcast = 0, previous = performance.now(), time = 0
  const renew = (immediate = false) => {
    surface.draw(d)
    if (d.form !== drawnForm) {
      drawnForm = d.form
      plateMesh.geometry.dispose(); plateMesh.geometry = plateGeometry(d.form)
    }
    const t = performance.now()
    if (immediate || t - lastBroadcast > 120) {
      lastBroadcast = t
      publish({ ...d, paints: [...d.paints] })
      const b = canvasEl3.getBoundingClientRect(), n = plate.localToWorld(new THREE.Vector3(0, surfaceY(), 0)).project(camera), x = plate.localToWorld(new THREE.Vector3(R, surfaceY(), 0)).project(camera), z = plate.localToWorld(new THREE.Vector3(0, surfaceY(), R)).project(camera)
      const ext = (v: THREE.Vector3) => [((v.x + 1) / 2) * b.width, ((1 - v.y) / 2) * b.height].map((q) => q.toFixed(1)).join(',')
      Object.assign(area.dataset, { stage: String(d.stage), alt: String(d.alt), iz: `${d.iz}/${d.traceIndex}`, heat: d.heat.toFixed(0), quality: String(quality(d)), plateCenter: ext(n), plateX: ext(x), plateZ: ext(z), xr: String(xr.active()) })
    }
  }

  const xrContext: XrContext = {
    renderer, scene: threeScene, camera, plate,
    game: () => d, actions: () => actions(d), stageName: () => stages[d.stage], quality: () => quality(d),
    heatRange: () => (d.stage === 1 ? BISQUE : GLAZE_KILN),
    markerStart, walkMarkers, markerRelease, command, hold, master,
    hideTool: () => { brushGroup.visible = false; pouch.visible = false },
    resize, plateRadius: R,
    restoreCamera: () => { resize(); area.dispatchEvent(new Event('xrended')) },
  }
  const xr = setupXr(xrContext)

  const frame = () => {
    const now = performance.now(), dt = Math.min(.1, (now - previous) / 1000)
    previous = now; time += dt
    if (held.primer) applySlip(d, dt)
    if (held.glaze) pourGlaze(d, dt)
    if (d.inKiln) kiln(d, dt, held.fire); else if (held.fire) held.fire = false
    cool(d, dt)

    // Wheel: spins while shaping and while applying liquid.
    const isSpinning = d.stage === 0 || held.primer || held.glaze
    if (isSpinning) { wheel.rotation.y += dt * 6; spinning.rotation.y += dt * 6 }
    else if (d.stage >= 1 && d.stage <= 5) spinning.rotation.y = 0
    flow.visible = held.primer || held.glaze
    if (flow.visible) { plate.getWorldPosition(flow.position); flow.position.y += .24; (flow.material as THREE.MeshStandardMaterial).color.set(d.stage === 1 ? '#f4eedd' : '#fbfaf3') }
    paper.visible = d.stage === 2
    if (paper.visible) paper.position.y = surfaceY() + .004
    if (d.stage !== 2) pouch.visible = false
    if (d.stage !== 3 && d.stage !== 4) brushGroup.visible = false

    // Surface material: from matte bisque to vitrified glaze.
    plateM.roughness = d.live > 0 ? .86 + (.3 - .86) * d.live : d.primer > 0 ? .78 : .62
    plateM.clearcoat = d.live * .55
    const hot = d.inKiln ? Math.max(0, (d.heat - 300) / 700) : 0
    plateM.emissive.setRGB(hot * .9, hot * .28, hot * .05)
    plateM.emissiveIntensity = hot * .55

    // Fire
    const power = d.inKiln ? Math.min(1, (d.heat - 20) / 880) : 0
    fireM.opacity += (power * (.72 + Math.sin(time * 13) * .1) - fireM.opacity) * Math.min(1, dt * 6)
    fireLight.intensity = fireM.opacity * 5.5
    flames.forEach((o, i) => { o.scale.y = .78 + Math.sin(time * (7 + i) + i) * .22; o.position.x = -.2 + (i % 4) * .13 + Math.sin(time * 3 + i) * .015 })

    plateTarget()
    const k = Math.min(1, dt * 3.6)
    if (!xr.isHeld()) {
      plate.position.lerp(targetP, k); plate.quaternion.slerp(targetQ, k)
      const o = plate.scale.x + (targetO - plate.scale.x) * k; plate.scale.setScalar(o)
    }
    if (d.stage === 6 && !xr.isHeld() && !pressed) spinning.rotation.y += dt * .25

    if (xr.active()) xr.frame()
    else {
      cameraTargetOf()
      controls.enabled = d.stage === 6
      if (d.stage === 6) { controls.target.lerp(targetB, k); controls.update() }
      else { camera.position.lerp(targetK, k); controls.target.lerp(targetB, k); camera.lookAt(controls.target) }
    }
    renew()
    renderer.render(threeScene, camera)
  }
  camera.position.set(0, 1.3, .8); controls.target.set(0, .97, -.02)
  renew(true)
  renderer.setAnimationLoop(frame)

  return {
    command, hold, master,
    startXr: () => xr.start(),
    endXr: () => xr.finish(),
    clear: () => {
      renderer.setAnimationLoop(null)
      xr.clear(); watcher.disconnect(); controls.dispose()
      canvasEl3.removeEventListener('pointerdown', down); canvasEl3.removeEventListener('pointermove', roam); canvasEl3.removeEventListener('pointerup', up); canvasEl3.removeEventListener('pointercancel', up); canvasEl3.removeEventListener('webglcontextlost', lost); canvasEl3.removeEventListener('webglcontextrestored', arrived); clearTimeout(lossCounter)
      surface.dispose(); plateMesh.geometry.dispose(); surroundings.dispose(); pmrem.dispose()
      geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); textures.forEach((t) => t.dispose())
      renderer.dispose(); canvasEl3.remove()
    },
  }
}
