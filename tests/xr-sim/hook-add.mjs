// Scratch kopyadaki sahnelere salt-gözlem kancası ekler; yazılımsal çizimde hız için XR çerçeve tamponunu küçültür. Depoya dokunmaz.
// Kullanım (scratch kopyanın kökünde): node kanca-ekle.mjs
import { readFileSync, writeFileSync } from 'node:fs'

function toggle(path, marker, fresh) {
  const k = readFileSync(path, 'utf8')
  if (k.split(marker).length !== 2) throw new Error(`kanca yeri bulunamadı: ${path}`)
  writeFileSync(path, k.replace(marker, () => fresh + marker))
}

const render = `  ;(window as any).__t = __t
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

toggle('src/components/model/modelScene.ts', '  const sahne: MaketSahnesi = {\n', `  // TEST KANCASI (yalnız scratch kopya)
  const __t: any = { THREE, renderer, scene, camera, controls, katmanlar, duraklar, yurume, artAlan, hemi, icIsiklar, xr, carpiyor, xrKarti, isaretler, kare: 0, yakala: null,
    get parcali() { return parcali }, get iceride() { return iceride }, get aktifBilgi() { return aktifBilgi }, get kalite() { return kalite } }
${render}`)
toggle('src/components/model/modelScene.ts', '  const xr = xrOturumuKur({', '  renderer.xr.setFramebufferScaleFactor(0.2)\n')

toggle('src/components/model/vaseScene.ts', '  renderer.setAnimationLoop(() => {\n', `  // TEST KANCASI (yalnız scratch kopya)
  const __t: any = { THREE, renderer, scene, camera, controls, parcalar, hedefler, masaustuRaflari, saglamGorunum, birlesimIzleri, siluet, base, xr, kare: 0, yakala: null,
    get durum() { return durum }, get raflar() { return raflar }, get hareket() { return hareketler.size } }
${render}`)
toggle('src/components/model/vaseScene.ts', '  const xr = vazoXrKur({', '  renderer.xr.setFramebufferScaleFactor(0.2)\n')

