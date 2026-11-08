import * as THREE from 'three'
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight.js'

/** Soft fake contact shadow under the turntable: radial alpha gradient disc, no shadow maps. Units: model units. */
export function createContactShadow(radius: number): { mesh: THREE.Mesh; dispose(): void } {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.45)')
    g.addColorStop(0.5, 'rgba(0,0,0,0.28)')
    g.addColorStop(0.8, 'rgba(0,0,0,0.08)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  const geometry = new THREE.CircleGeometry(radius, 48)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshBasicMaterial({ map: texture, color: 0x000000, transparent: true, depthWrite: false })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = -1
  return { mesh, dispose() { geometry.dispose(); material.dispose(); texture.dispose() } }
}

/** Room-matched lighting in AR via XREstimatedLight; no-op when unsupported. Never throws. */
export function createArLighting(renderer: THREE.WebGLRenderer, scene: THREE.Scene): { start(): void; stop(): void } {
  let xrLight: XREstimatedLight | null = null
  let saved: Array<{ light: THREE.Light; intensity: number }> = []
  let savedEnv: THREE.Texture | null = null
  let active = false

  const restore = () => {
    if (!active) return
    active = false
    for (const s of saved) s.light.intensity = s.intensity
    saved = []
    scene.environment = savedEnv
    savedEnv = null
    if (xrLight) scene.remove(xrLight)
  }
  const onStart = () => {
    if (!xrLight || active) return
    active = true
    saved = []
    scene.traverse((o) => {
      if (o instanceof THREE.HemisphereLight || o instanceof THREE.DirectionalLight) saved.push({ light: o, intensity: o.intensity })
    })
    for (const s of saved) s.light.intensity = s.intensity * 0.1
    scene.add(xrLight)
    savedEnv = scene.environment
    if (xrLight.environment) scene.environment = xrLight.environment
  }

  return {
    start() {
      try {
        if (xrLight) return
        xrLight = new XREstimatedLight(renderer)
        xrLight.addEventListener('estimationstart', onStart)
        xrLight.addEventListener('estimationend', restore)
      } catch {
        xrLight = null
      }
    },
    stop() {
      try {
        restore()
        if (xrLight) {
          xrLight.removeEventListener('estimationstart', onStart)
          xrLight.removeEventListener('estimationend', restore)
          xrLight.dispose()
        }
      } catch { /* ignore */ }
      xrLight = null
    },
  }
}
