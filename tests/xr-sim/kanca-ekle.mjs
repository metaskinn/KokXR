// Scratch kopyadaki maketSahnesi.ts'e salt-gözlem kancası ekler. Depoya dokunmaz.
import { readFileSync, writeFileSync } from 'node:fs'
const yol = process.argv[2]
let k = readFileSync(yol, 'utf8')
const isaret = '  const sahne: MaketSahnesi = {\n'
if (k.split(isaret).length !== 2) throw new Error('kanca yeri bulunamadı')
const kanca = `  // TEST KANCASI (yalnız scratch kopya)
  const __t: any = { THREE, renderer, scene, camera, controls, katmanlar, duraklar, yurume, artAlan, hemi, icIsiklar, xr, carpiyor, xrKarti, isaretler, kare: 0, yakala: null,
    get parcali() { return parcali }, get iceride() { return iceride }, get aktifBilgi() { return aktifBilgi }, get kalite() { return kalite } }
  ;(window as any).__t = __t
  const __render = renderer.render.bind(renderer)
  renderer.render = (s: THREE.Object3D, c: THREE.Camera) => {
    __render(s, c)
    __t.kare++
    if (__t.yakala && (renderer.xr.isPresenting || !renderer.getRenderTarget())) {
      const gl = renderer.getContext() as WebGL2RenderingContext
      const eski = gl.getParameter(gl.FRAMEBUFFER_BINDING)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, p = new Uint8Array(w * h * 4)
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p)
      gl.bindFramebuffer(gl.FRAMEBUFFER, eski)
      const yak = __t.yakala; __t.yakala = null
      yak({ w, h, p })
    }
  }

`
k = k.replace(isaret, kanca + isaret)
writeFileSync(yol, k)
