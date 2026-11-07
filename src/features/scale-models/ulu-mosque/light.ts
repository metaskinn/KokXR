// Ulu Camii lighting: tone mapping, interior and exterior environment, a precomputed interior light field baked into materials.
// Character from photos: ic-mekan*.jpg and sadirvan.jpg (high-key, warm cream, low contrast),
// kubbeler-icten.jpg (dome interiors darker than the arches and skin-toned), dis-gorunum.jpg (golden sun, silver-blue lead).
// The daylight falling from the şadırvan bay and the corner darkening are not real-time lights; they are a few lines of shader
// math, need no shadow map, and work the same way on Quest.
import * as THREE from 'three'
import { WALL, BAY_X, DRUM_BASE, FOUNTAIN_ROW, FOUNTAIN_COLUMN, YX, YZ, baySize, px, pz } from '../uluMosquePiece'
import type { UluMosqueMaterials } from '../uluMosqueTextures'

const FLOOR = 0.7
const SETTING = {
  outer: { exposure: 1.06, environment: 0.78, hemi: 0.58, glow: 0.14, threshold: 1.25 },
  inner: { exposure: 1.08, environment: 0.66, hemi: 0.34, glow: 0.12, threshold: 1.3, lamp: 28 },
}

/** Lamp and sky glow: changes only on Ulu Camii's own material copies; texture and draw call counts stay the same. */
export function uluLightMaterials(m: UluMosqueMaterials) {
  // In the photo the bulbs are small and white; the halo is dim enough not to cover the wall.
  m.lamp.color.setRGB(3.4, 3, 2.35)
  m.lampHalo.color.setRGB(0.62, 0.52, 0.38)
  m.lightColumn.color.setRGB(0.1, 0.1, 0.095)
  m.sky.color.setRGB(1.75, 1.9, 2)
}

/** Exterior environment: clear sky, warm horizon, dark ground. The lead domes reflect the sky color, as in the photo. */
function setupOuterEnv(environment: THREE.PMREMGenerator) {
  const scene = new THREE.Scene()
  const geo = new THREE.SphereGeometry(50, 24, 16)
  const position = geo.attributes.position, colors = new Float32Array(position.count * 3)
  const sky = new THREE.Color(0.62, 0.8, 1.05), horizon = new THREE.Color(1.5, 1.28, 1), place = new THREE.Color(0.3, 0.25, 0.2)
  const color = new THREE.Color()
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / 50
    if (y >= 0) color.copy(horizon).lerp(sky, Math.pow(y, 0.55))
    else color.copy(horizon).lerp(place, Math.min(1, -y * 5))
    colors.set([color.r, color.g, color.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
  scene.add(new THREE.Mesh(geo, mat))
  const texture = environment.fromScene(scene, 0.02, 0.5, 100)
  geo.dispose(); mat.dispose()
  return texture
}

/** Interior environment: cream wall, rose floor, bright ceiling, dome oculus. Chandelier points are dim so they don't blow out on water and marble. */
function setupInteriorEnv(environment: THREE.PMREMGenerator) {
  const scene = new THREE.Scene()
  const box = new THREE.BoxGeometry(70, 26, 56), sphere = new THREE.SphereGeometry(1, 10, 6)
  const wall = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.68, 0.52), side: THREE.BackSide })
  const ceiling = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.98, 0.84, 0.66), side: THREE.BackSide })
  const floor = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.42, 0.36), side: THREE.BackSide })
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 1.65) })
  const day = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5.4, 5.8) })
  scene.add(new THREE.Mesh(box, [wall, wall, ceiling, floor, wall, wall]))
  for (let x = -27.6; x <= 27.6; x += 13.8) for (let z = -20.6; z <= 20.6; z += 13.75) {
    const l = new THREE.Mesh(sphere, lamp)
    l.position.set(x, 6, z)
    scene.add(l)
  }
  const eye = new THREE.Mesh(sphere, day)
  eye.position.set(0, 12, -6.9)
  eye.scale.setScalar(3)
  scene.add(eye)
  const texture = environment.fromScene(scene, 0.04, 0.5, 100)
  box.dispose(); sphere.dispose(); [wall, ceiling, floor, lamp, day].forEach((m) => m.dispose())
  return texture
}

const number = (n: number) => n.toFixed(3)

/** Precomputed light field based on the building. The floor gets its own contact shadow from its material; only walls and ceiling are darkened here. */
function areaGlsl() {
  const sx = px(FOUNTAIN_COLUMN + 0.5), sz = pz(FOUNTAIN_ROW + 0.5)
  const eyeY = DRUM_BASE + baySize(FOUNTAIN_COLUMN).drumH + 2.6
  return `{
    vec3 uluP = vUluPos;
    float uluY = uluP.y - ${number(FLOOR)};
    float uluWall = smoothstep(0.08, 0.5, uluY);
    vec2 uluDist = vec2(${number(YX - WALL)}, ${number(YZ - WALL)}) - abs(uluP.xz);
    float uluCorner = smoothstep(0.0, ${number(BAY_X * 0.8)}, uluDist.x) * smoothstep(0.0, ${number(BAY_X * 0.8)}, uluDist.y);
    vec3 uluFactor = vec3(mix(1.0, mix(0.82, 1.0, uluCorner) * mix(0.84, 1.0, smoothstep(0.0, 4.5, uluY)), uluWall));
    uluFactor *= mix(vec3(1.0), vec3(0.9, 0.84, 0.76), smoothstep(${number(DRUM_BASE)}, ${number(DRUM_BASE + 4)}, uluP.y));
    vec3 uluEye = vec3(${number(sx)}, ${number(eyeY)}, ${number(sz)}) - uluP;
    float uluAxisDist = dot(uluEye.xz, uluEye.xz);
    float uluDay = exp(-uluAxisDist / 120.0) * (0.3 + 0.7 * max(dot(normal, normalize(uluEye)), 0.0));
    uluFactor = mix(vec3(1.0), uluFactor, uUluInner);
    reflectedLight.directDiffuse *= uluFactor;
    reflectedLight.indirectDiffuse *= uluFactor;
    reflectedLight.indirectSpecular *= uluFactor;
    reflectedLight.indirectDiffuse += material.diffuseColor * vec3(0.3, 0.32, 0.335) * uluDay * uUluInner;
    // Shadowless interior lamps must not leave blown-out specks on water and polished marble; the environment map provides reflections.
    float uluSpeck = mix(1.0, 0.22, uUluInner);
    reflectedLight.directSpecular *= uluSpeck;
    #ifdef USE_CLEARCOAT
      clearcoatSpecularDirect *= uluSpeck;
    #endif
  }`
}

/** Applied once to all materials; uUluInner is 0 while outside, no recompilation needed. */
function processArea(root: THREE.Object3D, uUluInner: { value: number }) {
  const glsl = areaGlsl(), processed = new WeakSet<THREE.Material>()
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(m instanceof THREE.MeshStandardMaterial) || processed.has(m)) continue
      processed.add(m)
      const previous = m.onBeforeCompile.bind(m), prevKey = m.customProgramCacheKey.bind(m)
      m.onBeforeCompile = (s, r) => {
        previous(s, r)
        s.uniforms.uUluInner = uUluInner
        s.vertexShader = s.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vUluPos;')
          .replace('#include <project_vertex>', `#include <project_vertex>
            vec4 uluLocal = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              uluLocal = instanceMatrix * uluLocal;
            #endif
            vUluPos = (modelMatrix * uluLocal).xyz;`)
        s.fragmentShader = s.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vUluPos;\nuniform float uUluInner;')
          .replace('#include <aomap_fragment>', `${glsl}\n#include <aomap_fragment>`)
      }
      m.customProgramCacheKey = () => `${prevKey()}|uluLight`
    }
  })
}

export interface UluLightScene {
  scene: THREE.Scene
  hemi: THREE.HemisphereLight
  glow: { strength: number; threshold: number }
  innerLights: THREE.PointLight[]
}

export function setupUluLight(renderer: THREE.WebGLRenderer, environment: THREE.PMREMGenerator, root: THREE.Object3D) {
  // Neutral tone mapping: avoids ACES's shift that pulls the cream wall towards grey and the carpet towards orange.
  renderer.toneMapping = THREE.NeutralToneMapping
  const uUluInner = { value: 0 }
  processArea(root, uUluInner)
  const outerTarget = setupOuterEnv(environment), innerTarget = setupInteriorEnv(environment)
  return {
    outerEnv: outerTarget.texture,
    interiorEnv: innerTarget.texture,
    clear: () => { outerTarget.dispose(); innerTarget.dispose() },
    /** Main exterior lights: low golden sun, cool fill from the sky. */
    outerLight: (hemi: THREE.HemisphereLight, sun: THREE.DirectionalLight) => {
      hemi.color.set('#e6edf2')
      hemi.groundColor.set('#6f6252')
      hemi.intensity = SETTING.outer.hemi
      sun.color.set('#ffd8a4')
      sun.intensity = 3.4
    },
    apply: (inner: boolean, s: UluLightScene) => {
      const a = inner ? SETTING.inner : SETTING.outer
      uUluInner.value = inner ? 1 : 0
      renderer.toneMappingExposure = a.exposure
      s.scene.environmentIntensity = a.environment
      s.hemi.intensity = a.hemi
      s.glow.strength = a.glow
      s.glow.threshold = a.threshold
      if (inner) s.innerLights.forEach((l) => { l.intensity = SETTING.inner.lamp })
    },
  }
}
