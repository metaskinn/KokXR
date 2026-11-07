// Ulu Camii ışığı: ton eşleme, iç ve dış ortam, malzemelere işlenen hazır iç ışık alanı.
// Karakter fotoğraflardan: ic-mekan*.jpg ve sadirvan.jpg (yüksek anahtarlı, sıcak krem, düşük karşıtlık),
// kubbeler-icten.jpg (kubbe içleri kemerlerden koyu ve ten rengi), dis-gorunum.jpg (altın güneş, gümüş mavi kurşun).
// Şadırvan gözünden düşen gün ışığı ve köşe kararması gerçek zamanlı ışık değil; birkaç satır gölgelendirici
// hesabıdır, gölge haritası istemez, Quest'te de aynı biçimde çalışır.
import * as THREE from 'three'
import { WALL, BAY_X, DRUM_BASE, FOUNTAIN_ROW, FOUNTAIN_COLUMN, YX, YZ, baySize, px, pz } from '../uluMosquePiece'
import type { UluMosqueMaterials } from '../uluMosqueTextures'

const FLOOR = 0.7
const SETTING = {
  outer: { exposure: 1.06, environment: 0.78, hemi: 0.58, glow: 0.14, threshold: 1.25 },
  inner: { exposure: 1.08, environment: 0.66, hemi: 0.34, glow: 0.12, threshold: 1.3, lamp: 28 },
}

/** Lamba ve gökyüzü parıltısı: yalnız Ulu Camii'nin kendi malzeme kopyasında değişir, doku ve çizim sayısı aynı kalır. */
export function uluLightMaterials(m: UluMosqueMaterials) {
  // Fotoğrafta ampuller küçük ve beyaz; hale, duvarı örtmeyecek kadar kısık.
  m.lamp.color.setRGB(3.4, 3, 2.35)
  m.lampHalo.color.setRGB(0.62, 0.52, 0.38)
  m.lightColumn.color.setRGB(0.1, 0.1, 0.095)
  m.sky.color.setRGB(1.75, 1.9, 2)
}

/** Dış ortam: açık gök, sıcak ufuk, koyu zemin. Kurşun kubbeler fotoğraftaki gibi gök rengini yansıtır. */
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

/** İç ortam: krem duvar, gül zemin, aydınlık tavan, kubbe gözü. Avize noktaları kısık: su ve mermerde patlamasın. */
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

/** Yapıya göre hesaplanan hazır ışık alanı. Zemin kendi temas gölgesini malzemeden alır; burada yalnız duvar ve tavan koyulur. */
function areaGlsl() {
  const sx = px(FOUNTAIN_COLUMN + 0.5), sz = pz(FOUNTAIN_ROW + 0.5)
  const eyeY = DRUM_BASE + baySize(FOUNTAIN_COLUMN).drumH + 2.6
  return `{
    vec3 uluP = vUluKonum;
    float uluY = uluP.y - ${number(FLOOR)};
    float uluDuvar = smoothstep(0.08, 0.5, uluY);
    vec2 uluMesafe = vec2(${number(YX - WALL)}, ${number(YZ - WALL)}) - abs(uluP.xz);
    float uluKose = smoothstep(0.0, ${number(BAY_X * 0.8)}, uluMesafe.x) * smoothstep(0.0, ${number(BAY_X * 0.8)}, uluMesafe.y);
    vec3 uluCarpan = vec3(mix(1.0, mix(0.82, 1.0, uluKose) * mix(0.84, 1.0, smoothstep(0.0, 4.5, uluY)), uluDuvar));
    uluCarpan *= mix(vec3(1.0), vec3(0.9, 0.84, 0.76), smoothstep(${number(DRUM_BASE)}, ${number(DRUM_BASE + 4)}, uluP.y));
    vec3 uluGoz = vec3(${number(sx)}, ${number(eyeY)}, ${number(sz)}) - uluP;
    float uluEksen = dot(uluGoz.xz, uluGoz.xz);
    float uluGun = exp(-uluEksen / 120.0) * (0.3 + 0.7 * max(dot(normal, normalize(uluGoz)), 0.0));
    uluCarpan = mix(vec3(1.0), uluCarpan, uUluIc);
    reflectedLight.directDiffuse *= uluCarpan;
    reflectedLight.indirectDiffuse *= uluCarpan;
    reflectedLight.indirectSpecular *= uluCarpan;
    reflectedLight.indirectDiffuse += material.diffuseColor * vec3(0.3, 0.32, 0.335) * uluGun * uUluIc;
    // Gölgesiz iç lambalar su ve cilalı mermerde patlayan benek bırakmasın; yansımayı ortam haritası verir.
    float uluBenek = mix(1.0, 0.22, uUluIc);
    reflectedLight.directSpecular *= uluBenek;
    #ifdef USE_CLEARCOAT
      clearcoatSpecularDirect *= uluBenek;
    #endif
  }`
}

/** Tüm malzemelere bir kez işlenir; dışarıdayken uUluIc 0'dır, yeniden derleme gerekmez. */
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
          .replace('#include <common>', '#include <common>\nvarying vec3 vUluKonum;')
          .replace('#include <project_vertex>', `#include <project_vertex>
            vec4 uluYer = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              uluYer = instanceMatrix * uluYer;
            #endif
            vUluKonum = (modelMatrix * uluYer).xyz;`)
        s.fragmentShader = s.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vUluKonum;\nuniform float uUluIc;')
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
  // Nötr ton eşleme: ACES'in krem duvarı griye, halıyı turuncuya çeken kaymasını yapmaz.
  renderer.toneMapping = THREE.NeutralToneMapping
  const uUluInner = { value: 0 }
  processArea(root, uUluInner)
  const outerTarget = setupOuterEnv(environment), innerTarget = setupInteriorEnv(environment)
  return {
    outerEnv: outerTarget.texture,
    interiorEnv: innerTarget.texture,
    clear: () => { outerTarget.dispose(); innerTarget.dispose() },
    /** Dıştaki ana ışıklar: alçak altın güneş, gökten serin dolgu. */
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
