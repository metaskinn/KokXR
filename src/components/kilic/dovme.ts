import * as T from 'three'
import type { Bolge } from './durum'
const s = (p: number) => p * p * (3 - 2 * p)
// Bitmiş namluda ağzın yerel yüksekliği ve X konumu: bilemede taşa tam temas için (scripts/kilic_uret.py ile aynı biçim).
export function agizYerel(u: number) {
  let ga = .028 - .0065 * u
  if (u > .8) ga *= (1 - ((u - .8) / .2) ** 2.2) ** .9
  return { x: 1.06 * u, y: .07 * u ** 2.3 - ga }
}
export function namluHazirla(mesh: T.Mesh) {
  const g = mesh.geometry = mesh.geometry.clone()
  const pos = g.getAttribute('position'), norm = g.getAttribute('normal'), uv = g.getAttribute('uv1')
  if (!uv) throw new Error('Namlunun bölge verisi bulunamadı.')
  const son = Float32Array.from(pos.array), normal = Float32Array.from(norm.array)
  const isi = new T.BufferAttribute(new Float32Array(pos.count), 1), kabuk = isi.clone(), cilt = isi.clone()
  g.setAttribute('aIsi', isi); g.setAttribute('aKabuk', kabuk); g.setAttribute('aCilt', cilt)
  const eski = Array.from({ length: 12 }, () => ''), eskiP = Array<number>(12).fill(-1)
  const mat = (mesh.material as T.MeshStandardMaterial).clone(); mesh.material = mat
  mat.metalness = .85; mat.roughness = .48
  mat.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute float aIsi; attribute float aKabuk; attribute float aCilt; varying vec3 vIslem;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvIslem=vec3(aIsi,aKabuk,aCilt);')
    shader.fragmentShader = 'varying vec3 vIslem;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float noiseScale = .75 + .25*sin(vViewPosition.x*920.)*sin(vViewPosition.y*840.);
      diffuseColor.rgb *= mix(1., .14 * noiseScale, vIslem.y);`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + vIslem.y*.4 - vIslem.z*.35,.12,1.);')
    shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= 1.-vIslem.y*.7;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float heat = smoothstep(450.,1200.,vIslem.x);
      vec3 hot = mix(vec3(.55,.008,.001),vec3(1.,.18,.008),smoothstep(500.,850.,vIslem.x));
      hot=mix(hot,vec3(1.,.76,.3),smoothstep(850.,1150.,vIslem.x));
      totalEmissiveRadiance += hot*heat*3.;`)
  }
  const n = new T.Vector3(), nFinal = new T.Vector3()
  function guncelle(b: Bolge[]) {
    const degisen = b.map((v, i) => { const key = `${v.p.toFixed(4)},${v.isi.toFixed(0)},${v.kabuk.toFixed(3)},${v.cilt.toFixed(3)}`; const fark = eski[i] !== key; eski[i] = key; return fark })
    if (!degisen.some(Boolean)) return
    const len = b.map(v => T.MathUtils.lerp(.2 / 12, 1.06 / 12, s(v.p)))
    const birikim = [0]; len.forEach(l => birikim.push(birikim.at(-1)! + l))
    const forme = b.some((v, i) => v.p !== eskiP[i]); b.forEach((v, i) => { eskiP[i] = v.p })
    const av = s(b.reduce((a, v) => a + v.p, 0) / 12)
    for (let j = 0; j < pos.count; j++) {
      const u = T.MathUtils.clamp(uv.getX(j), 0, 1), a = 1 - uv.getY(j)
      const f = u * 11, i = Math.min(10, Math.floor(f)), t = f - i
      if (!forme && !degisen[i] && !degisen[i + 1]) continue
      if (forme) {
      const p = T.MathUtils.lerp(b[i].p, b[i + 1].p, t), sp = s(p)
      const ri = Math.min(11, Math.floor(u * 12)), rt = u * 12 - ri
      const x = birikim[ri] + len[ri] * rt, cf = .07 * u ** 2.3
      const egg = Math.sqrt(Math.max(1 - (2 * u - 1) ** 2, .02)) ** .75
      const by = Math.cos(2 * Math.PI * a) * .024 * egg, bz = Math.sin(2 * Math.PI * a) * .018 * egg
      const dent = Math.sin(u * 237 + a * 89) * .0012 * (1 - sp) * Math.min(1, p * 5)
      pos.setXYZ(j, x + (son[j * 3] - 1.06 * u) * sp, cf * av + T.MathUtils.lerp(by, son[j * 3 + 1] - cf, sp) + dent, T.MathUtils.lerp(bz, son[j * 3 + 2], sp) + dent)
      n.set(0, by / .024, bz / .018).normalize().lerp(nFinal.set(normal[j * 3], normal[j * 3 + 1], normal[j * 3 + 2]), sp).normalize()
      norm.setXYZ(j, n.x, n.y, n.z)
      }
      isi.setX(j, T.MathUtils.lerp(b[i].isi, b[i + 1].isi, t)); kabuk.setX(j, T.MathUtils.lerp(b[i].kabuk, b[i + 1].kabuk, t)); cilt.setX(j, T.MathUtils.lerp(b[i].cilt, b[i + 1].cilt, t))
    }
    isi.needsUpdate = kabuk.needsUpdate = cilt.needsUpdate = true
    if (forme) { pos.needsUpdate = norm.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere() }
  }
  return { guncelle, merkez: (b: Bolge[], i: number) => b.slice(0, i).reduce((a, v) => a + T.MathUtils.lerp(.2 / 12, 1.06 / 12, s(v.p)), 0) + T.MathUtils.lerp(.2 / 12, 1.06 / 12, s(b[i].p)) / 2, uzunluk: () => { g.computeBoundingBox(); return g.boundingBox!.max.x - g.boundingBox!.min.x } }
}
