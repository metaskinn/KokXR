import * as T from 'three'
import type { Region } from './state'
const s = (p: number) => p * p * (3 - 2 * p)
// Local height and X position of the edge on the finished blade: for full stone contact while grinding (same shape as scripts/sword_generate.py).
export function mouthLocal(u: number) {
  let ga = .028 - .0065 * u
  if (u > .8) ga *= (1 - ((u - .8) / .2) ** 2.2) ** .9
  return { x: 1.06 * u, y: .07 * u ** 2.3 - ga }
}
export function prepareBlade(mesh: T.Mesh) {
  const g = mesh.geometry = mesh.geometry.clone()
  const pos = g.getAttribute('position'), norm = g.getAttribute('normal'), uv = g.getAttribute('uv1')
  if (!uv) throw new Error('Blade region data not found.')
  const last = Float32Array.from(pos.array), normal = Float32Array.from(norm.array)
  const heat = new T.BufferAttribute(new Float32Array(pos.count), 1), shell = heat.clone(), skin = heat.clone()
  g.setAttribute('aHeat', heat); g.setAttribute('aShell', shell); g.setAttribute('aSkin', skin)
  const old = Array.from({ length: 12 }, () => ''), oldP = Array<number>(12).fill(-1)
  const mat = (mesh.material as T.MeshStandardMaterial).clone(); mesh.material = mat
  mat.metalness = .85; mat.roughness = .48
  mat.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute float aHeat; attribute float aShell; attribute float aSkin; varying vec3 vProcess;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvProcess=vec3(aHeat,aShell,aSkin);')
    shader.fragmentShader = 'varying vec3 vProcess;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float noiseScale = .75 + .25*sin(vViewPosition.x*920.)*sin(vViewPosition.y*840.);
      diffuseColor.rgb *= mix(1., .14 * noiseScale, vProcess.y);`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + vProcess.y*.4 - vProcess.z*.35,.12,1.);')
    shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= 1.-vProcess.y*.7;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float heat = smoothstep(450.,1200.,vProcess.x);
      vec3 hot = mix(vec3(.55,.008,.001),vec3(1.,.18,.008),smoothstep(500.,850.,vProcess.x));
      hot=mix(hot,vec3(1.,.76,.3),smoothstep(850.,1150.,vProcess.x));
      totalEmissiveRadiance += hot*heat*3.;`)
  }
  const n = new T.Vector3(), nFinal = new T.Vector3()
  function update(b: Region[]) {
    const changed = b.map((v, i) => { const key = `${v.p.toFixed(4)},${v.heat.toFixed(0)},${v.shell.toFixed(3)},${v.skin.toFixed(3)}`; const diff = old[i] !== key; old[i] = key; return diff })
    if (!changed.some(Boolean)) return
    const len = b.map(v => T.MathUtils.lerp(.2 / 12, 1.06 / 12, s(v.p)))
    const accumulation = [0]; len.forEach(l => accumulation.push(accumulation.at(-1)! + l))
    const toForm = b.some((v, i) => v.p !== oldP[i]); b.forEach((v, i) => { oldP[i] = v.p })
    const av = s(b.reduce((a, v) => a + v.p, 0) / 12)
    for (let j = 0; j < pos.count; j++) {
      const u = T.MathUtils.clamp(uv.getX(j), 0, 1), a = 1 - uv.getY(j)
      const f = u * 11, i = Math.min(10, Math.floor(f)), t = f - i
      if (!toForm && !changed[i] && !changed[i + 1]) continue
      if (toForm) {
      const p = T.MathUtils.lerp(b[i].p, b[i + 1].p, t), sp = s(p)
      const ri = Math.min(11, Math.floor(u * 12)), rt = u * 12 - ri
      const x = accumulation[ri] + len[ri] * rt, cf = .07 * u ** 2.3
      const egg = Math.sqrt(Math.max(1 - (2 * u - 1) ** 2, .02)) ** .75
      const by = Math.cos(2 * Math.PI * a) * .024 * egg, bz = Math.sin(2 * Math.PI * a) * .018 * egg
      const dent = Math.sin(u * 237 + a * 89) * .0012 * (1 - sp) * Math.min(1, p * 5)
      pos.setXYZ(j, x + (last[j * 3] - 1.06 * u) * sp, cf * av + T.MathUtils.lerp(by, last[j * 3 + 1] - cf, sp) + dent, T.MathUtils.lerp(bz, last[j * 3 + 2], sp) + dent)
      n.set(0, by / .024, bz / .018).normalize().lerp(nFinal.set(normal[j * 3], normal[j * 3 + 1], normal[j * 3 + 2]), sp).normalize()
      norm.setXYZ(j, n.x, n.y, n.z)
      }
      heat.setX(j, T.MathUtils.lerp(b[i].heat, b[i + 1].heat, t)); shell.setX(j, T.MathUtils.lerp(b[i].shell, b[i + 1].shell, t)); skin.setX(j, T.MathUtils.lerp(b[i].skin, b[i + 1].skin, t))
    }
    heat.needsUpdate = shell.needsUpdate = skin.needsUpdate = true
    if (toForm) { pos.needsUpdate = norm.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere() }
  }
  return { update, center: (b: Region[], i: number) => b.slice(0, i).reduce((a, v) => a + T.MathUtils.lerp(.2 / 12, 1.06 / 12, s(v.p)), 0) + T.MathUtils.lerp(.2 / 12, 1.06 / 12, s(b[i].p)) / 2, lengthVal: () => { g.computeBoundingBox(); return g.boundingBox!.max.x - g.boundingBox!.min.x } }
}
