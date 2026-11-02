// Bu modül yalnızca «Maketi eline al» sonrasında dinamik olarak yüklenir.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ulucamiMaketi } from './ulucamiMaket'

export interface MaketSahnesi {
  parcala: (acik: boolean) => void;
  otomatik: (acik: boolean) => void;
  sifirla: () => void;
  dondur: (yatay: number, dikey: number) => void;
  yakinlas: (oran: number) => void;
  temizle: () => void;
}

const modeller = { 'ulu-camii': ulucamiMaketi }
export function maketSahnesiOlustur(alan: HTMLElement, model: string, azHareket: boolean): MaketSahnesi {
  const olustur = modeller[model as keyof typeof modeller]
  if (!olustur) throw new Error(`Bilinmeyen maket: ${model}`)
  const canvas = document.createElement('canvas')
  if (!canvas.getContext('webgl2')) throw new Error('WebGL kullanılamıyor')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvas.setAttribute('aria-hidden', 'true')
  alan.append(canvas)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1d2f2a')
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 1000)
  const baslangic = new THREE.Vector3(95, 70, 110)
  camera.position.copy(baslangic)

  scene.add(new THREE.HemisphereLight('#fff6e6', '#30443c', 1.1))
  const gunes = new THREE.DirectionalLight('#fff1d6', 2.2)
  gunes.position.set(-60, 110, 70)
  gunes.castShadow = true
  gunes.shadow.mapSize.set(2048, 2048)
  Object.assign(gunes.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 300 })
  scene.add(gunes)

  const kaide = new THREE.Mesh(new THREE.CylinderGeometry(70, 72, 3, 64), new THREE.MeshStandardMaterial({ color: '#2b4139', roughness: 1 }))
  kaide.position.y = -1.5; kaide.receiveShadow = true
  scene.add(kaide)

  const { kok, cati } = olustur()
  scene.add(kok)

  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 10, 0)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 55
  controls.maxDistance = 260
  controls.maxPolarAngle = Math.PI / 2 - 0.05
  controls.autoRotate = !azHareket
  controls.autoRotateSpeed = 0.8
  controls.update()
  // Kullanıcı tutup çevirince otomatik dönüş durur, eser "elinde" kalır.
  controls.addEventListener('start', () => { controls.autoRotate = false; kameraHedef = null })

  const kuresel = new THREE.Spherical()
  let catiHedef = 0
  let kameraHedef: THREE.Vector3 | null = null
  let calisiyor = true
  const boyutla = () => {
    const { clientWidth: w, clientHeight: h } = alan
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(h, 1)
    // Dar ekranda maketin tamamı sığsın diye görüş açısı genişletilir.
    camera.fov = camera.aspect < 1 ? 62 : 40
    camera.updateProjectionMatrix()
  }
  const gozlemci = new ResizeObserver(boyutla)
  gozlemci.observe(alan)
  boyutla()

  renderer.setAnimationLoop(() => {
    if (!calisiyor) return
    const fark = catiHedef - cati.position.y
    cati.position.y = azHareket ? catiHedef : cati.position.y + fark * 0.08
    if (kameraHedef) {
      camera.position.lerp(kameraHedef, azHareket ? 1 : 0.08)
      if (camera.position.distanceTo(kameraHedef) < 0.5) kameraHedef = null
    }
    controls.update()
    renderer.render(scene, camera)
  })

  return {
    parcala: (acik) => {
      catiHedef = acik ? 42 : 0
      // İçerisi görünsün diye kamera yukarıdan bakan bir açıya alınır.
      if (acik) {
        kuresel.setFromVector3(camera.position.clone().sub(controls.target))
        if (kuresel.phi > 0.8) { kuresel.phi = 0.8; kameraHedef = controls.target.clone().add(new THREE.Vector3().setFromSpherical(kuresel)) }
      }
    },
    otomatik: (acik) => { controls.autoRotate = acik },
    sifirla: () => { camera.position.copy(baslangic); controls.target.set(0, 10, 0); controls.update() },
    dondur: (yatay, dikey) => {
      kuresel.setFromVector3(camera.position.clone().sub(controls.target))
      kuresel.theta += yatay
      kuresel.phi = THREE.MathUtils.clamp(kuresel.phi + dikey, 0.15, controls.maxPolarAngle)
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(kuresel))
      controls.update()
    },
    yakinlas: (oran) => {
      const yon = camera.position.clone().sub(controls.target)
      const uzaklik = THREE.MathUtils.clamp(yon.length() * oran, controls.minDistance, controls.maxDistance)
      camera.position.copy(controls.target).add(yon.setLength(uzaklik))
      controls.update()
    },
    temizle: () => {
      calisiyor = false
      renderer.setAnimationLoop(null)
      gozlemci.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose()
        }
      })
      renderer.dispose()
      canvas.remove()
    },
  }
}
