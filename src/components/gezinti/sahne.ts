// Bu modül yalnızca «Gezintiye başla» sonrasında dinamik olarak yüklenir.
import * as THREE from 'three'
import type { Durak } from '../../types/eser'

export interface Sahne {
  git: (durak: Durak) => Promise<void>;
  yon: (x: number, y: number) => void;
  temizle: () => void;
}

export function sahneOlustur(alan: HTMLElement, duraklar: Durak[], hata: () => void): Sahne {
  // Ön kontrol, desteklenmeyen tarayıcıda renderer hata günlüğünü de önler.
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl2', { alpha: false, antialias: true })
  if (!context) throw new Error('WebGL kullanılamıyor')
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#213c35')
  canvas.setAttribute('aria-hidden', 'true')
  alan.append(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20)
  camera.position.z = 2.5
  const segment = matchMedia('(max-width: 600px)').matches ? 120 : 200
  const geometry = new THREE.PlaneGeometry(1, 1, segment, segment)
  const loader = new THREE.TextureLoader()
  const textures = new Set<THREE.Texture>()
  const cache = new Map<string, Promise<THREE.Texture>>()
  const meshes = new Set<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>()
  let disposed = false
  let active: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | undefined
  let transition: { next: NonNullable<typeof active>; start: number; done: () => void } | undefined
  let frame = 0, lastFrame = 0, lastInput = 0
  let targetX = 0, targetY = 0, x = 0, y = 0
  let dragging = false, startX = 0, startY = 0
  const events = new AbortController()

  function texture(url: string, color = false) {
    const saved = cache.get(url)
    if (saved) return saved
    const promise = loader.loadAsync(url).then((value) => {
      if (disposed) { value.dispose(); throw new Error('Gezinti kapandı') }
      if (color) value.colorSpace = THREE.SRGBColorSpace
      value.minFilter = THREE.LinearFilter
      value.generateMipmaps = false
      textures.add(value)
      return value
    })
    cache.set(url, promise)
    return promise
  }

  function olcekle(mesh: NonNullable<typeof active>) {
    const aspect = mesh.userData.aspect as number
    const height = 2 * 2.5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    // Her en-boy oranında kameranın hareketi için kenar payı bırak.
    const scale = Math.max(height, height * camera.aspect / aspect) * 1.16
    mesh.scale.set(scale * aspect, scale, 1)
  }
  function resize() {
    const { width, height } = alan.getBoundingClientRect()
    if (!width || !height || disposed) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    meshes.forEach(olcekle)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(alan)
  function yon(nx: number, ny: number) {
    targetX = THREE.MathUtils.clamp(nx, -1, 1)
    targetY = THREE.MathUtils.clamp(ny, -1, 1)
    lastInput = performance.now()
  }
  alan.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return
    dragging = true; startX = event.clientX; startY = event.clientY
    alan.setPointerCapture(event.pointerId)
  }, { signal: events.signal })
  alan.addEventListener('pointermove', (event) => {
    const bounds = alan.getBoundingClientRect()
    if (event.pointerType === 'mouse') yon((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1)
    else if (dragging) yon((event.clientX - startX) / (bounds.width * 0.3), (event.clientY - startY) / (bounds.height * 0.3))
  }, { signal: events.signal })
  alan.addEventListener('pointerup', () => { dragging = false }, { signal: events.signal })
  alan.addEventListener('pointercancel', () => { dragging = false }, { signal: events.signal })
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); hata() }, { signal: events.signal })

  function kaldir(mesh: NonNullable<typeof active>) {
    scene.remove(mesh); mesh.material.dispose(); meshes.delete(mesh)
  }
  function animate(now: number) {
    if (disposed) return
    frame = requestAnimationFrame(animate)
    if (document.hidden) { lastFrame = now; return }
    const lerp = 1 - Math.exp(-Math.min((now - lastFrame) / 1000, 0.05) * 6)
    lastFrame = now
    const idle = now - lastInput > 4500
    x = THREE.MathUtils.lerp(x, idle ? Math.sin(now * 0.00018) * 0.3 : targetX, lerp)
    y = THREE.MathUtils.lerp(y, idle ? Math.cos(now * 0.00014) * 0.2 : targetY, lerp)
    let dolly = 0
    if (transition) {
      const t = Math.min((now - transition.start) / 600, 1)
      const smooth = t * t * (3 - 2 * t)
      dolly = Math.sin(t * Math.PI) * 0.16
      transition.next.material.uniforms.opacity.value = smooth
      if (t === 1) {
        if (active) kaldir(active)
        active = transition.next
        active.renderOrder = 0
        const done = transition.done
        transition = undefined
        done()
      }
    }
    camera.position.set(x * 0.065, -y * 0.05, 2.5 - dolly)
    camera.lookAt(x * 0.012, -y * 0.012, 0)
    renderer.render(scene, camera)
  }
  resize()
  frame = requestAnimationFrame(animate)

  async function git(durak: Durak) {
    const [photo, depth] = await Promise.all([texture(durak.gorsel, true), texture(durak.derinlik)])
    if (disposed) return
    const material = new THREE.ShaderMaterial({
      uniforms: { photo: { value: photo }, depth: { value: depth }, guc: { value: 0.055 }, opacity: { value: active ? 0 : 1 } },
      vertexShader: `uniform sampler2D depth; uniform float guc; varying vec2 vUv;
        void main() { vUv = uv; vec3 p = position;
          p.z = (texture2D(depth, uv).r - 0.5) * guc;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform sampler2D photo; uniform float opacity; varying vec2 vUv;
        void main() { gl_FragColor = vec4(texture2D(photo, vUv).rgb, opacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthTest: false, depthWrite: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    const image = photo.image as HTMLImageElement
    mesh.userData.aspect = image.width / image.height
    mesh.renderOrder = active ? 1 : 0
    meshes.add(mesh); olcekle(mesh); scene.add(mesh)
    if (active) await new Promise<void>((resolve) => { transition = { next: mesh, start: performance.now(), done: resolve } })
    else { active = mesh; renderer.render(scene, camera) }
    if (disposed) return
    // Yalnızca bağlı durakları önceden yükle; hataları gezinme sırasında ele al.
    for (const link of durak.baglantilar) {
      const next = duraklar.find((item) => item.id === link.hedef)
      if (next) void Promise.all([texture(next.gorsel, true), texture(next.derinlik)]).catch(() => {})
    }
  }
  return { git, yon, temizle() {
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect(); events.abort()
    transition?.done(); transition = undefined
    meshes.forEach((mesh) => mesh.material.dispose()); meshes.clear()
    geometry.dispose(); textures.forEach((value) => value.dispose()); textures.clear(); cache.clear()
    renderer.dispose(); renderer.forceContextLoss(); canvas.remove()
  } }
}
