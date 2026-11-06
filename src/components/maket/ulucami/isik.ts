// Ulu Camii ışığı: ton eşleme, iç ve dış ortam, malzemelere işlenen hazır iç ışık alanı.
// Karakter fotoğraflardan: ic-mekan*.jpg ve sadirvan.jpg (yüksek anahtarlı, sıcak krem, düşük karşıtlık),
// kubbeler-icten.jpg (kubbe içleri kemerlerden koyu ve ten rengi), dis-gorunum.jpg (altın güneş, gümüş mavi kurşun).
// Şadırvan gözünden düşen gün ışığı ve köşe kararması gerçek zamanlı ışık değil; birkaç satır gölgelendirici
// hesabıdır, gölge haritası istemez, Quest'te de aynı biçimde çalışır.
import * as THREE from 'three'
import { DUVAR, GOZ_X, KASNAK_TABAN, SADIRVAN_SATIR, SADIRVAN_SUTUN, YX, YZ, gozOlcusu, px, pz } from '../ulucamiParca'
import type { UlucamiMalzemeleri } from '../ulucamiDokular'

const ZEMIN = 0.7
const AYAR = {
  dis: { pozlama: 1.06, ortam: 0.78, hemi: 0.58, parlama: 0.14, esik: 1.25 },
  ic: { pozlama: 1.08, ortam: 0.66, hemi: 0.34, parlama: 0.2, esik: 1.15, lamba: 28 },
}

/** Lamba ve gökyüzü parıltısı: yalnız Ulu Camii'nin kendi malzeme kopyasında değişir, doku ve çizim sayısı aynı kalır. */
export function uluIsikMalzemeleri(m: UlucamiMalzemeleri) {
  // Fotoğrafta ampuller küçük ve beyaz; hale, duvarı örtmeyecek kadar kısık.
  m.lamba.color.setRGB(3.4, 3, 2.35)
  m.lambaHale.color.setRGB(0.62, 0.52, 0.38)
  m.isikSutunu.color.setRGB(0.1, 0.1, 0.095)
  m.gok.color.setRGB(1.75, 1.9, 2)
}

/** Dış ortam: açık gök, sıcak ufuk, koyu zemin. Kurşun kubbeler fotoğraftaki gibi gök rengini yansıtır. */
function disOrtamKur(ortam: THREE.PMREMGenerator) {
  const sahne = new THREE.Scene()
  const geo = new THREE.SphereGeometry(50, 24, 16)
  const konum = geo.attributes.position, renkler = new Float32Array(konum.count * 3)
  const gok = new THREE.Color(0.62, 0.8, 1.05), ufuk = new THREE.Color(1.5, 1.28, 1), yer = new THREE.Color(0.3, 0.25, 0.2)
  const renk = new THREE.Color()
  for (let i = 0; i < konum.count; i++) {
    const y = konum.getY(i) / 50
    if (y >= 0) renk.copy(ufuk).lerp(gok, Math.pow(y, 0.55))
    else renk.copy(ufuk).lerp(yer, Math.min(1, -y * 5))
    renkler.set([renk.r, renk.g, renk.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(renkler, 3))
  const mal = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
  sahne.add(new THREE.Mesh(geo, mal))
  const doku = ortam.fromScene(sahne, 0.02, 0.5, 100).texture
  geo.dispose(); mal.dispose()
  return doku
}

/** İç ortam: krem duvar, gül zemin, aydınlık tavan, kubbe gözü. Avize noktaları kısık: su ve mermerde patlamasın. */
function icOrtamKur(ortam: THREE.PMREMGenerator) {
  const sahne = new THREE.Scene()
  const kutu = new THREE.BoxGeometry(70, 26, 56), kure = new THREE.SphereGeometry(1, 10, 6)
  const duvar = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.68, 0.52), side: THREE.BackSide })
  const tavan = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.98, 0.84, 0.66), side: THREE.BackSide })
  const zemin = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.42, 0.36), side: THREE.BackSide })
  const lamba = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 1.65) })
  const gun = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5.4, 5.8) })
  sahne.add(new THREE.Mesh(kutu, [duvar, duvar, tavan, zemin, duvar, duvar]))
  for (let x = -27.6; x <= 27.6; x += 13.8) for (let z = -20.6; z <= 20.6; z += 13.75) {
    const l = new THREE.Mesh(kure, lamba)
    l.position.set(x, 6, z)
    sahne.add(l)
  }
  const goz = new THREE.Mesh(kure, gun)
  goz.position.set(0, 12, -6.9)
  goz.scale.setScalar(3)
  sahne.add(goz)
  const doku = ortam.fromScene(sahne, 0.04, 0.5, 100).texture
  kutu.dispose(); kure.dispose(); [duvar, tavan, zemin, lamba, gun].forEach((m) => m.dispose())
  return doku
}

const sayi = (n: number) => n.toFixed(3)

/** Yapıya göre hesaplanan hazır ışık alanı. Zemin kendi temas gölgesini malzemeden alır; burada yalnız duvar ve tavan koyulur. */
function alanGlsl() {
  const sx = px(SADIRVAN_SUTUN + 0.5), sz = pz(SADIRVAN_SATIR + 0.5)
  const gozY = KASNAK_TABAN + gozOlcusu(SADIRVAN_SUTUN).kasnakH + 2.6
  return `{
    vec3 uluP = vUluKonum;
    float uluY = uluP.y - ${sayi(ZEMIN)};
    float uluDuvar = smoothstep(0.08, 0.5, uluY);
    vec2 uluMesafe = vec2(${sayi(YX - DUVAR)}, ${sayi(YZ - DUVAR)}) - abs(uluP.xz);
    float uluKose = smoothstep(0.0, ${sayi(GOZ_X * 0.8)}, uluMesafe.x) * smoothstep(0.0, ${sayi(GOZ_X * 0.8)}, uluMesafe.y);
    vec3 uluCarpan = vec3(mix(1.0, mix(0.82, 1.0, uluKose) * mix(0.84, 1.0, smoothstep(0.0, 4.5, uluY)), uluDuvar));
    uluCarpan *= mix(vec3(1.0), vec3(0.9, 0.84, 0.76), smoothstep(${sayi(KASNAK_TABAN)}, ${sayi(KASNAK_TABAN + 4)}, uluP.y));
    vec3 uluGoz = vec3(${sayi(sx)}, ${sayi(gozY)}, ${sayi(sz)}) - uluP;
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
function alaniIsle(kok: THREE.Object3D, uUluIc: { value: number }) {
  const glsl = alanGlsl(), islenen = new WeakSet<THREE.Material>()
  kok.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(m instanceof THREE.MeshStandardMaterial) || islenen.has(m)) continue
      islenen.add(m)
      const onceki = m.onBeforeCompile.bind(m), oncekiAnahtar = m.customProgramCacheKey.bind(m)
      m.onBeforeCompile = (s, r) => {
        onceki(s, r)
        s.uniforms.uUluIc = uUluIc
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
      m.customProgramCacheKey = () => `${oncekiAnahtar()}|uluIsik`
    }
  })
}

export interface UluIsikSahnesi {
  scene: THREE.Scene
  hemi: THREE.HemisphereLight
  parlama: { strength: number; threshold: number }
  icIsiklar: THREE.PointLight[]
}

export function uluIsikKur(renderer: THREE.WebGLRenderer, ortam: THREE.PMREMGenerator, kok: THREE.Object3D) {
  // Nötr ton eşleme: ACES'in krem duvarı griye, halıyı turuncuya çeken kaymasını yapmaz.
  renderer.toneMapping = THREE.NeutralToneMapping
  const uUluIc = { value: 0 }
  alaniIsle(kok, uUluIc)
  return {
    disOrtam: disOrtamKur(ortam),
    icOrtam: icOrtamKur(ortam),
    /** Dıştaki ana ışıklar: alçak altın güneş, gökten serin dolgu. */
    disIsik: (hemi: THREE.HemisphereLight, gunes: THREE.DirectionalLight) => {
      hemi.color.set('#e6edf2')
      hemi.groundColor.set('#6f6252')
      hemi.intensity = AYAR.dis.hemi
      gunes.color.set('#ffd8a4')
      gunes.intensity = 3.4
    },
    uygula: (ic: boolean, s: UluIsikSahnesi) => {
      const a = ic ? AYAR.ic : AYAR.dis
      uUluIc.value = ic ? 1 : 0
      renderer.toneMappingExposure = a.pozlama
      s.scene.environmentIntensity = a.ortam
      s.hemi.intensity = a.hemi
      s.parlama.strength = a.parlama
      s.parlama.threshold = a.esik
      if (ic) s.icIsiklar.forEach((l) => { l.intensity = AYAR.ic.lamba })
    },
  }
}
