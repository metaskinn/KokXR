// Adds a read-only observation hook to the scenes in the scratch copy; shrinks the XR framebuffer for speed under software rendering. Does not touch the repo.
// Usage (from the scratch copy root): node hook-add.mjs
import { readFileSync, writeFileSync } from 'node:fs'

function toggle(path, marker, fresh) {
  const k = readFileSync(path, 'utf8')
  if (k.split(marker).length !== 2) throw new Error(`hook location not found: ${path}`)
  writeFileSync(path, k.replace(marker, () => fresh + marker))
}

const render = `  ;(window as any).__t = __t
  const __render = renderer.render.bind(renderer)
  renderer.render = (s: THREE.Object3D, c: THREE.Camera) => {
    __render(s, c)
    __t.frame++
    if (__t.capture && (renderer.xr.isPresenting || !renderer.getRenderTarget())) {
      const gl = renderer.getContext() as WebGL2RenderingContext
      const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, p = new Uint8Array(w * h * 4)
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p)
      gl.bindFramebuffer(gl.FRAMEBUFFER, previous)
      const callback = __t.capture; __t.capture = null
      callback({ w, h, p })
    }
  }

`

// NOTE: sim-page.js also reads __t.collides; the scene has no such function (pre-existing gap).
toggle('src/features/scale-models/modelScene.ts', '  const scene: ModelScene = {\n', `  // TEST HOOK (scratch copy only)
  const __t: any = { THREE, renderer, scene: threeScene, camera, controls, layers, stops, walking, backdrop, hemi, innerLights, xr, xrCard, markers, frame: 0, capture: null,
    get fragmented() { return fragmented }, get inside() { return inside }, get activeInfo() { return activeInfo }, get quality() { return quality } }
${render}`)
toggle('src/features/scale-models/modelScene.ts', '  const xr = setupXrSession({', '  renderer.xr.setFramebufferScaleFactor(0.2)\n')

toggle('src/features/workshops/vase/vaseScene.ts', '  renderer.setAnimationLoop(() => {\n', `  // TEST HOOK (scratch copy only)
  const __t: any = { THREE, renderer, scene, camera, controls, pieces, targets, desktopShelves, intactView, assemblyTraces, silhouette, base, xr, frame: 0, capture: null,
    get state() { return state }, get shelves() { return shelves }, get motion() { return moves.size } }
${render}`)
toggle('src/features/workshops/vase/vaseScene.ts', '  const xr = setupVaseXr({', '  renderer.xr.setFramebufferScaleFactor(0.2)\n')
