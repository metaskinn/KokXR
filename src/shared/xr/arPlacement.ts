// Finds horizontal AR surfaces with a viewer hit test and displays a smoothed placement reticle in meters.
import * as THREE from 'three'

export interface ArPlacement {
  /** Rig-local meters; hidden whenever there is no suitable hit. */
  reticle: THREE.Object3D
  /** Returns the latest surface hit in reference-space meters, without visual smoothing. */
  update(frame: XRFrame, refSpace: XRReferenceSpace): { x: number; y: number; z: number } | null
  dispose(): void
}

/** Returns null if hit testing is unavailable or setup fails. Never throws. */
export async function createArPlacement(session: XRSession): Promise<ArPlacement | null> {
  let source: XRHitTestSource | null = null
  const geometries: THREE.BufferGeometry[] = []
  let material: THREE.MeshBasicMaterial | null = null
  try {
    if (typeof session.requestHitTestSource !== 'function') return null
    const viewerSpace = await session.requestReferenceSpace('viewer')
    source = await session.requestHitTestSource({ space: viewerSpace }) ?? null
    if (!source) return null
    const hitSource = source

    const ring = new THREE.RingGeometry(0.108, 0.12, 64).rotateX(-Math.PI / 2)
    geometries.push(ring)
    const dot = new THREE.CircleGeometry(0.008, 24).rotateX(-Math.PI / 2)
    geometries.push(dot)
    material = new THREE.MeshBasicMaterial({
      color: '#f0e1bc',
      toneMapped: false,
      transparent: true,
      opacity: 0.9,
      depthTest: true,
      depthWrite: false,
    })
    const reticle = new THREE.Group()
    reticle.add(new THREE.Mesh(ring, material), new THREE.Mesh(dot, material))
    reticle.visible = false

    const orientation = new THREE.Quaternion()
    const up = new THREE.Vector3()
    const target = new THREE.Vector3()
    let initialized = false
    let disposed = false
    const reticleMaterial = material

    return {
      reticle,
      update(frame, refSpace) {
        reticle.visible = false
        if (disposed) return null
        for (const hit of frame.getHitTestResults(hitSource)) {
          const pose = hit.getPose(refSpace)
          if (!pose) continue
          const { position, orientation: q } = pose.transform
          orientation.set(q.x, q.y, q.z, q.w)
          up.set(0, 1, 0).applyQuaternion(orientation)
          if (!(up.y > 0.85)) continue

          target.set(position.x, position.y, position.z)
          if (initialized) reticle.position.lerp(target, 0.35)
          else reticle.position.copy(target)
          initialized = true
          reticle.quaternion.copy(orientation)
          reticle.scale.setScalar(1 + 0.06 * Math.sin(performance.now() * 0.003))
          reticle.visible = true
          return { x: position.x, y: position.y, z: position.z }
        }
        initialized = false
        return null
      },
      dispose() {
        if (disposed) return
        disposed = true
        reticle.visible = false
        try {
          hitSource.cancel()
        } finally {
          for (const geometry of geometries) geometry.dispose()
          reticleMaterial.dispose()
          reticle.removeFromParent()
        }
      },
    }
  } catch {
    // A denied feature or a session ending during setup leaves placement unavailable.
    try { source?.cancel() } catch { /* The session may already have ended. */ }
    for (const geometry of geometries) geometry.dispose()
    material?.dispose()
    return null
  }
}
