import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const parcaAdlari = ['Alt gövde · sağ', 'Alt gövde · arka', 'Alt gövde · sol', 'Üst gövde · sağ', 'Üst gövde · arka', 'Üst gövde · sol']
export interface VazoDurumu { onarim: boolean; oturum: number; yerlesen: number[]; secili: number | null; ipucu: boolean }
export interface VazoSahnesi {
  guncelle: (durum: VazoDurumu) => void
  dondur: (yatay: number, dikey: number) => void
  yakinlas: (oran: number) => void
  parcayiKaydir: (x: number, y: number) => void
  parcayiBirak: () => void
  iptal: () => void
  sifirla: () => void
  temizle: () => void
}
interface Bildirimler { sec: (id: number | null) => void; birak: (id: number, oturdu: boolean) => void; hata: () => void }

export async function vazoSahnesiOlustur(alan: HTMLElement, bildir: Bildirimler): Promise<VazoSahnesi> {
  // .blend kaynağından dışa aktarılan altı fiziksel seramik parça; harici model/doku yok.
  const gltf = await new GLTFLoader().loadAsync('/modeller/vazo.glb')
  const geometriler = new Set<THREE.BufferGeometry>()
  const malzemeler = new Set<THREE.Material>()
  function kaynaklariTopla(root: THREE.Object3D) {
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      geometriler.add(o.geometry)
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) malzemeler.add(m)
    })
  }
  kaynaklariTopla(gltf.scene)
  const kaynaklariBirak = () => { geometriler.forEach((g) => g.dispose()); malzemeler.forEach((m) => m.dispose()) }
  const parcalar: THREE.Object3D[] = []
  gltf.scene.updateMatrixWorld(true)
  gltf.scene.traverse((o) => { if (Number.isInteger(o.userData.pieceId)) parcalar[o.userData.pieceId] = o })
  if (parcalar.length !== 6 || Array.from({ length: 6 }, (_, id) => parcalar[id]).some((p) => !p)) {
    kaynaklariBirak()
    throw new Error('Vazo modelinin altı ayrı parçası bulunamadı.')
  }
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true }) }
  catch (error) { kaynaklariBirak(); throw error }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.domElement.setAttribute('aria-hidden', 'true')
  alan.append(renderer.domElement)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#24352d')
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false
  controls.enableDamping = true
  controls.minDistance = 70
  controls.maxDistance = 240
  controls.maxPolarAngle = Math.PI * .8
  let durum: VazoDurumu = { onarim: false, oturum: 0, yerlesen: [], secili: null, ipucu: true }
  const sifirla = () => {
    camera.position.set(durum.onarim ? 0 : 63, durum.onarim ? 31 : 53, durum.onarim ? 156 : 108)
    controls.target.set(0, 23, 0)
    const damping = controls.enableDamping
    controls.enableDamping = false; controls.update(); controls.enableDamping = damping
  }
  sifirla()
  scene.add(new THREE.HemisphereLight('#fff8e9', '#627466', 2.6))
  const key = new THREE.DirectionalLight('#fff1db', 3.2)
  key.position.set(-40, 75, 70); scene.add(key)
  const fill = new THREE.DirectionalLight('#d1e7e0', 1.4)
  fill.position.set(50, 40, -55); scene.add(fill)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(66, 67, 1.5, 64), new THREE.MeshStandardMaterial({ color: '#35483c', roughness: .95 }))
  base.position.y = -2; scene.add(base)
  const hedefler = parcalar.map((p) => ({ position: p.getWorldPosition(new THREE.Vector3()), quaternion: p.getWorldQuaternion(new THREE.Quaternion()), scale: p.getWorldScale(new THREE.Vector3()) }))
  parcalar.forEach((p, id) => {
    p.removeFromParent()
    p.position.copy(hedefler[id].position); p.quaternion.copy(hedefler[id].quaternion); p.scale.copy(hedefler[id].scale)
    p.traverse((o) => {
      o.userData.pieceId = id
      if (!(o instanceof THREE.Mesh)) return
      // glTF malzemeleri parçalarda paylaşılabilir; seçili parça diğerlerini boyamasın.
      o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone()
    })
    scene.add(p)
  })
  const izler = parcalar.map((p) => {
    const ghost = p.clone(true)
    ghost.traverse((o) => {
      if (o instanceof THREE.Mesh) o.material = new THREE.MeshBasicMaterial({ color: '#e1d4ab', transparent: true, opacity: .09, depthWrite: false, side: THREE.DoubleSide })
    })
    scene.add(ghost)
    return ghost
  })
  const raflar = parcalar.map((_, id) => new THREE.Vector3(id < 3 ? -43 : 43, 9 + (id % 3) * 19, 14))
  const etiketler = parcalar.map((_, id) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'vazo-tutamac'
    button.dataset.parcaId = String(id)
    button.setAttribute('aria-label', `Parça ${id + 1}: tut ve sürükle`)
    button.innerHTML = `<span>${id + 1}</span>`
    button.addEventListener('click', () => { if (!durum.yerlesen.includes(id)) bildir.sec(id) })
    alan.append(button)
    return button
  })
  const hedefIsareti = document.createElement('span')
  hedefIsareti.className = 'vazo-hedef'
  hedefIsareti.setAttribute('aria-hidden', 'true')
  hedefIsareti.textContent = 'Buraya yaklaştır'
  alan.append(hedefIsareti)
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(), nokta = new THREE.Vector3()
  const hareketler = new Map<number, THREE.Vector3>()
  let drag: { id: number; pointer: number; offset: THREE.Vector3; x: number; y: number; tasindi: boolean } | null = null
  let kapandi = false
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches

  function ekran(v: THREE.Vector3) {
    const p = v.clone().project(camera)
    return new THREE.Vector2((p.x + 1) * alan.clientWidth / 2, (1 - p.y) * alan.clientHeight / 2)
  }
  function yakinMi(id: number) {
    const a = ekran(parcalar[id].position), b = ekran(hedefler[id].position)
    return a.distanceTo(b) < Math.max(20, Math.min(34, alan.clientWidth * .055))
  }
  function renkleriGuncelle() {
    parcalar.forEach((p, id) => {
      const secili = durum.secili === id && durum.onarim && !durum.yerlesen.includes(id)
      p.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
          if (material instanceof THREE.MeshStandardMaterial) material.emissive.set(secili ? '#352510' : '#000000')
        }
      })
      izler[id].visible = durum.onarim && !durum.yerlesen.includes(id) && (durum.ipucu || secili)
      izler[id].traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.material.opacity = secili ? .28 : .07
          o.material.color.set(secili ? '#e6ca8a' : '#e1d4ab')
        }
      })
      etiketler[id].hidden = !durum.onarim || durum.yerlesen.includes(id)
      etiketler[id].setAttribute('aria-pressed', String(secili))
    })
  }
  function captureBirak() {
    const onceki = drag
    drag = null
    controls.enabled = true
    alan.classList.remove('parca-surukleniyor')
    if (onceki && alan.hasPointerCapture(onceki.pointer)) alan.releasePointerCapture(onceki.pointer)
  }
  function iptal() {
    const id = drag?.id ?? durum.secili
    captureBirak()
    if (id !== null && !durum.yerlesen.includes(id)) hareketler.set(id, raflar[id].clone())
    bildir.sec(null)
  }
  const guncelle = (yeni: VazoDurumu) => {
    const bastan = yeni.oturum !== durum.oturum || yeni.onarim !== durum.onarim
    if (bastan) { captureBirak(); hareketler.clear() }
    const onceki = durum
    durum = yeni
    if (bastan) sifirla()
    parcalar.forEach((p, id) => {
      const yerde = !yeni.onarim || yeni.yerlesen.includes(id)
      if (bastan) {
        p.position.copy(yerde ? hedefler[id].position : raflar[id])
        p.quaternion.copy(hedefler[id].quaternion)
      } else if (yerde && !onceki.yerlesen.includes(id)) hareketler.set(id, hedefler[id].position.clone())
    })
    renkleriGuncelle()
  }
  function isin(clientX: number, clientY: number) {
    const rect = renderer.domElement.getBoundingClientRect()
    ray.setFromCamera(new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1), camera)
  }
  function birak(id: number) {
    if (durum.yerlesen.includes(id)) return
    const oturdu = yakinMi(id)
    hareketler.set(id, (oturdu ? hedefler[id].position : raflar[id]).clone())
    bildir.birak(id, oturdu)
  }
  const pointerDown = (e: PointerEvent) => {
    if (!durum.onarim || e.button !== 0) return
    if (drag) { e.stopPropagation(); return }
    const etiket = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-parca-id]')
    isin(e.clientX, e.clientY)
    const hit = ray.intersectObjects(parcalar.filter((_, id) => !durum.yerlesen.includes(id)), true)[0]
    const id: number | undefined = etiket ? Number(etiket.dataset.parcaId) : hit?.object.userData.pieceId
    if (id === undefined || durum.yerlesen.includes(id)) return
    e.stopPropagation(); e.preventDefault()
    // OrbitControls aynı tutuşu kamerayı döndürmek için kullanmasın.
    controls.enableDamping = false; controls.update(); controls.enableDamping = true
    controls.enabled = false
    // Tutuş derinliğini koru: perspektifte parça fareden uzaklaşmasın.
    // Doğru yere bırakınca eksik derinlik otomatik hizalanır.
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), parcalar[id].position)
    isin(e.clientX, e.clientY)
    if (!ray.ray.intersectPlane(plane, nokta)) { controls.enabled = true; return }
    hareketler.delete(id)
    drag = { id, pointer: e.pointerId, offset: nokta.clone().sub(parcalar[id].position), x: e.clientX, y: e.clientY, tasindi: false }
    alan.focus({ preventScroll: true })
    alan.setPointerCapture(e.pointerId)
    alan.classList.add('parca-surukleniyor')
    bildir.sec(id)
  }
  const pointerMove = (e: PointerEvent) => {
    if (!drag || drag.pointer !== e.pointerId) return
    e.stopPropagation(); e.preventDefault()
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.tasindi = true
    isin(e.clientX, e.clientY)
    if (ray.ray.intersectPlane(plane, nokta)) parcalar[drag.id].position.copy(nokta).sub(drag.offset)
  }
  const pointerUp = (e: PointerEvent) => {
    if (!drag || drag.pointer !== e.pointerId) return
    e.stopPropagation(); e.preventDefault()
    const { id, tasindi } = drag
    captureBirak()
    if (tasindi) birak(id)
  }
  const pointerCancel = (e: PointerEvent) => { if (drag?.pointer === e.pointerId) iptal() }
  const contextLost = (e: Event) => { e.preventDefault(); iptal(); bildir.hata() }
  alan.addEventListener('pointerdown', pointerDown, true)
  alan.addEventListener('pointermove', pointerMove, true)
  alan.addEventListener('pointerup', pointerUp, true)
  alan.addEventListener('pointercancel', pointerCancel, true)
  alan.addEventListener('lostpointercapture', pointerCancel, true)
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  const boyutla = () => {
    const w = alan.clientWidth, h = Math.max(alan.clientHeight, 1)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = camera.aspect < 1 ? 62 : 42
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(boyutla)
  observer.observe(alan); boyutla(); guncelle(durum)
  renderer.setAnimationLoop(() => {
    if (kapandi) return
    for (const [id, hedef] of hareketler) {
      parcalar[id].position.lerp(hedef, azHareket ? 1 : .2)
      if (parcalar[id].position.distanceTo(hedef) < .05) { parcalar[id].position.copy(hedef); hareketler.delete(id) }
    }
    if (!drag) controls.update()
    scene.updateMatrixWorld(true)
    etiketler.forEach((button, id) => {
      if (button.hidden) return
      const p = ekran(parcalar[id].position)
      button.style.left = `${p.x}px`; button.style.top = `${p.y}px`
    })
    const id = drag?.id ?? durum.secili
    hedefIsareti.hidden = !durum.onarim || id === null || durum.yerlesen.includes(id)
    if (!hedefIsareti.hidden && id !== null) {
      const p = ekran(hedefler[id].position)
      hedefIsareti.style.left = `${p.x}px`; hedefIsareti.style.top = `${p.y}px`
      hedefIsareti.dataset.hedefId = String(id)
      const uygun = yakinMi(id)
      hedefIsareti.classList.toggle('hazir', uygun)
      hedefIsareti.textContent = uygun ? 'Bırak, yerine otursun' : 'Buraya yaklaştır'
    }
    renderer.render(scene, camera)
  })
  kaynaklariTopla(scene)
  return {
    guncelle, sifirla, iptal,
    parcayiKaydir: (x, y) => {
      const id = durum.secili
      if (id === null || durum.yerlesen.includes(id) || drag) return
      hareketler.delete(id)
      const p = parcalar[id].position.clone().project(camera)
      p.x += x * 2 / alan.clientWidth; p.y -= y * 2 / alan.clientHeight
      parcalar[id].position.copy(p.unproject(camera))
    },
    parcayiBirak: () => { if (durum.secili !== null && !drag) birak(durum.secili) },
    dondur: (yatay, dikey) => {
      if (drag) return
      const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
      s.theta += yatay; s.phi = THREE.MathUtils.clamp(s.phi + dikey, .1, controls.maxPolarAngle)
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s)); controls.update()
    },
    yakinlas: (oran) => {
      if (drag) return
      const v = camera.position.clone().sub(controls.target)
      v.setLength(THREE.MathUtils.clamp(v.length() * oran, controls.minDistance, controls.maxDistance))
      camera.position.copy(controls.target).add(v); controls.update()
    },
    temizle: () => {
      kapandi = true; captureBirak(); renderer.setAnimationLoop(null)
      observer.disconnect(); controls.dispose()
      alan.removeEventListener('pointerdown', pointerDown, true)
      alan.removeEventListener('pointermove', pointerMove, true)
      alan.removeEventListener('pointerup', pointerUp, true)
      alan.removeEventListener('pointercancel', pointerCancel, true)
      alan.removeEventListener('lostpointercapture', pointerCancel, true)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      kaynaklariBirak(); renderer.dispose(); renderer.domElement.remove()
      etiketler.forEach((b) => b.remove()); hedefIsareti.remove()
    },
  }
}
