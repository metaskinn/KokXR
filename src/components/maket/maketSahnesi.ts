// Bu modül yalnızca «Maketi eline al» sonrasında dinamik olarak yüklenir.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { MaketBilgiNoktasi } from '../../types/eser'
import { ulucamiMaketi } from './ulucamiMaket'
import type { Kutu } from './ulucamiIc'

/** İki nokta arasındaki kuşbakışı doğru parçası kutuyu kesiyor mu? */
function bakisKesiliyor(ax: number, az: number, bx: number, bz: number, k: Kutu) {
  let t0 = 0, t1 = 1
  for (const [p, q] of [[ax - bx, ax - k.x0], [bx - ax, k.x1 - ax], [az - bz, az - k.z0], [bz - az, k.z1 - az]]) {
    if (p === 0) { if (q < 0) return false; continue }
    const t = q / p
    if (p < 0) t0 = Math.max(t0, t)
    else t1 = Math.min(t1, t)
    if (t0 > t1) return false
  }
  return true
}

export interface MaketSahnesi {
  parcala: (acik: boolean) => void;
  otomatik: (acik: boolean) => void;
  sifirla: () => void;
  dondur: (yatay: number, dikey: number) => void;
  yakinlas: (oran: number) => void;
  /** İç mekân durağına gider; `null` dışarı çıkarır. */
  icMekan: (durakId: string | null) => void;
  duraklar: { id: string; ad: string }[];
  /** İçeride yürüme ve bakış tuşları: w a s d, ok tuşları, PageUp/PageDown, Shift. */
  yuruTus: (tus: string, basili: boolean) => void;
  yuruBirak: () => void;
  bilgiKapat: () => void;
  temizle: () => void;
}

export interface SahneSecenek {
  bilgiler?: MaketBilgiNoktasi[];
  /** Görünecek bilgi kartı değiştiğinde çağrılır. */
  bilgiDegisti?: (id: string | null) => void;
}

const YURUME_HIZI = 5, KOSMA_HIZI = 9, DONUS_HIZI = 1.7, OYUNCU_YARICAP = 0.45
const ISARET_GORUS = 32
const YAVAS_KARE_MS = 42

/** Yazılımsal çizimde görüntü işleme kullanılamayacak kadar yavaştır. */
function yazilimsalCizim(renderer: THREE.WebGLRenderer) {
  const gl = renderer.getContext()
  const uzanti = gl.getExtension('WEBGL_debug_renderer_info')
  const ad = uzanti ? String(gl.getParameter(uzanti.UNMASKED_RENDERER_WEBGL)) : ''
  return /swiftshader|llvmpipe|software/i.test(ad)
}

const modeller = { 'ulu-camii': ulucamiMaketi }
export function maketSahnesiOlustur(alan: HTMLElement, model: string, azHareket: boolean, secenek: SahneSecenek = {}): MaketSahnesi {
  const olustur = modeller[model as keyof typeof modeller]
  if (!olustur) throw new Error(`Bilinmeyen maket: ${model}`)
  const canvas = document.createElement('canvas')
  if (!canvas.getContext('webgl2')) throw new Error('WebGL kullanılamıyor')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  canvas.setAttribute('aria-hidden', 'true')
  alan.append(canvas)

  const scene = new THREE.Scene()
  // Stüdyo arka planı: ortada hafif aydınlık, kenarlara doğru koyulaşan yeşil
  const artAlanTuval = document.createElement('canvas')
  artAlanTuval.width = artAlanTuval.height = 512
  const artAlanCiz = artAlanTuval.getContext('2d')
  if (artAlanCiz) {
    const g = artAlanCiz.createRadialGradient(256, 230, 40, 256, 256, 380)
    g.addColorStop(0, '#31493f'); g.addColorStop(0.55, '#1a2b25'); g.addColorStop(1, '#0c1512')
    artAlanCiz.fillStyle = g
    artAlanCiz.fillRect(0, 0, 512, 512)
  }
  const artAlan = new THREE.CanvasTexture(artAlanTuval)
  artAlan.colorSpace = THREE.SRGBColorSpace
  scene.background = artAlan
  const ortam = new THREE.PMREMGenerator(renderer)
  const ortamHaritasi = ortam.fromScene(new RoomEnvironment(), 0.04).texture
  ortam.dispose()
  scene.environment = ortamHaritasi
  scene.environmentIntensity = 0.42
  const camera = new THREE.PerspectiveCamera(40, 1, 4, 900)
  // Açılış kuzeyden: taç kapı, avlu köşkleri ve iki minare fotoğraftaki gibi önde görünür.
  const baslangic = new THREE.Vector3(-58, 40, -118)
  const baslangicHedef = new THREE.Vector3(0, 14, -3)
  camera.position.copy(baslangic)

  const hemi = new THREE.HemisphereLight('#fff1dc', '#3a4438', 0.75)
  scene.add(hemi)
  const gunes = new THREE.DirectionalLight('#ffe2b8', 3)
  gunes.position.set(-85, 95, -80)
  gunes.castShadow = true
  const dokunmatik = matchMedia('(hover: none)').matches
  gunes.shadow.mapSize.set(dokunmatik ? 2048 : 4096, dokunmatik ? 2048 : 4096)
  gunes.shadow.radius = 2.5
  gunes.shadow.bias = -0.0004
  gunes.shadow.normalBias = 0.35
  Object.assign(gunes.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 10, far: 340 })
  scene.add(gunes)

  const kaide = new THREE.Mesh(new THREE.CylinderGeometry(70, 71.5, 3, 96), new THREE.MeshStandardMaterial({ color: '#27221c', roughness: 0.65, metalness: 0.15 }))
  kaide.position.y = -1.5; kaide.receiveShadow = true
  scene.add(kaide)

  const { kok, katmanlar, duraklar, yurume } = olustur()
  scene.add(kok)

  // Bilgi noktası işaretleri: yapıların üstünde duran, sahneye bağlı düğmeler
  const isaretKatmani = document.createElement('div')
  isaretKatmani.className = 'maket-isaretler'
  isaretKatmani.hidden = true
  alan.append(isaretKatmani)
  const isaretler = (secenek.bilgiler ?? []).map((bilgi) => {
    const dugme = document.createElement('button')
    dugme.type = 'button'
    dugme.className = 'maket-isaret'
    dugme.dataset.bilgi = bilgi.id
    dugme.setAttribute('aria-label', `${bilgi.baslik} bilgisini aç`)
    const nokta = document.createElement('span')
    nokta.className = 'maket-isaret-nokta'
    nokta.textContent = 'i'
    const ad = document.createElement('span')
    ad.className = 'maket-isaret-ad'
    ad.textContent = bilgi.baslik
    dugme.append(nokta, ad)
    dugme.addEventListener('click', () => { secilenBilgi = bilgi.id; kapatilanBilgi = null })
    isaretKatmani.append(dugme)
    return { bilgi, dugme, konum: new THREE.Vector3(bilgi.konum[0], bilgi.konum[1], bilgi.konum[2]) }
  })
  let aktifBilgi: string | null = null, yakinBilgi: string | null = null
  let secilenBilgi: string | null = null, kapatilanBilgi: string | null = null
  const izdusum = new THREE.Vector3()

  const bilgiGuncelle = () => {
    let enYakin: string | null = null, enKisa = Infinity
    for (const { bilgi, konum } of isaretler) {
      const uzaklik = Math.hypot(camera.position.x - konum.x, camera.position.z - konum.z)
      if (iceride && uzaklik < bilgi.yaricap && uzaklik < enKisa) { enYakin = bilgi.id; enKisa = uzaklik }
    }
    if (enYakin !== yakinBilgi) { yakinBilgi = enYakin; kapatilanBilgi = null }
    if (!iceride) { secilenBilgi = null; kapatilanBilgi = null }
    const gosterilecek = secilenBilgi ?? (yakinBilgi !== kapatilanBilgi ? yakinBilgi : null)
    if (gosterilecek !== aktifBilgi) {
      aktifBilgi = gosterilecek
      secenek.bilgiDegisti?.(aktifBilgi)
    }
  }

  const isaretleriKonumla = () => {
    if (!iceride) return
    const w = alan.clientWidth, h = alan.clientHeight
    // Tavana bakarken yalnız başın üstündeki noktalar anlamlıdır; duvarların ötesi gösterilmez.
    const yukariBakiyor = controls.target.y - camera.position.y > 0.3
    for (const { bilgi, dugme, konum } of isaretler) {
      izdusum.copy(konum).project(camera)
      const uzaklik = camera.position.distanceTo(konum)
      const yatayUzaklik = Math.hypot(camera.position.x - konum.x, camera.position.z - konum.z)
      const gorunur = izdusum.z < 1 && Math.abs(izdusum.x) < 1.05 && Math.abs(izdusum.y) < 1.05 && uzaklik < ISARET_GORUS &&
        // Altında durulan noktanın kartı zaten açıktır; işareti ekran köşesine yığılmasın.
        yatayUzaklik > 4 && !(yukariBakiyor && yatayUzaklik > 8) &&
        !yurume.gorusKesenler.some((k) => bakisKesiliyor(camera.position.x, camera.position.z, konum.x, konum.z, k))
      dugme.hidden = !gorunur
      if (!gorunur) continue
      dugme.style.transform = `translate(${((izdusum.x + 1) / 2) * w}px, ${((1 - izdusum.y) / 2) * h}px) translate(-50%, -50%)`
      dugme.classList.toggle('aktif', aktifBilgi === bilgi.id)
    }
  }

  // Yürüme: çarpışma kutuları oyuncu yarıçapı kadar şişirilmiş kabul edilir; eksen eksen denenerek duvar boyunca kayılır.
  const basiliTuslar = new Set<string>()
  const carpiyor = (x: number, z: number) => {
    const { sinir, kutular, daireler } = yurume, r = OYUNCU_YARICAP
    if (x < sinir.x0 + r || x > sinir.x1 - r || z < sinir.z0 + r || z > sinir.z1 - r) return true
    for (const k of kutular) if (x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r) return true
    for (const d of daireler) if (Math.hypot(x - d.x, z - d.z) < d.r + r) return true
    return false
  }
  const goz = new THREE.Vector3()
  const yuruYon = new THREE.Vector3(), bakisYon = new THREE.Spherical()
  const yuruGuncelle = (gecenSn: number) => {
    const b = basiliTuslar
    const donus = (b.has('ArrowLeft') ? 1 : 0) - (b.has('ArrowRight') ? 1 : 0)
    const egim = (b.has('PageDown') ? 1 : 0) - (b.has('PageUp') ? 1 : 0)
    const ileri = (b.has('w') || b.has('ArrowUp') ? 1 : 0) - (b.has('s') || b.has('ArrowDown') ? 1 : 0)
    const yan = (b.has('d') ? 1 : 0) - (b.has('a') ? 1 : 0)
    if (!donus && !egim && !ileri && !yan) return
    icHedef = null
    if (donus || egim) {
      bakisYon.setFromVector3(yuruYon.copy(controls.target).sub(camera.position))
      bakisYon.theta += donus * DONUS_HIZI * gecenSn
      bakisYon.phi = THREE.MathUtils.clamp(bakisYon.phi + egim * DONUS_HIZI * 0.7 * gecenSn, 0.25, Math.PI - 0.25)
      controls.target.copy(camera.position).add(yuruYon.setFromSpherical(bakisYon))
    }
    if (ileri || yan) {
      // Yön dizisi yatay düzleme indirgenir: yukarı bakarken de yerde yürünür.
      yuruYon.copy(controls.target).sub(camera.position).setY(0)
      if (yuruYon.lengthSq() < 1e-6) return
      yuruYon.normalize()
      const yol = (b.has('Shift') ? KOSMA_HIZI : YURUME_HIZI) * gecenSn / Math.hypot(ileri, yan)
      const dx = (yuruYon.x * ileri - yuruYon.z * yan) * yol
      const dz = (yuruYon.z * ileri + yuruYon.x * yan) * yol
      const eskiX = camera.position.x, eskiZ = camera.position.z
      if (!carpiyor(eskiX + dx, eskiZ)) camera.position.x += dx
      if (!carpiyor(camera.position.x, eskiZ + dz)) camera.position.z += dz
      const dy = (yurume.gozY - camera.position.y) * Math.min(1, gecenSn * 4)
      camera.position.y += dy
      controls.target.x += camera.position.x - eskiX
      controls.target.y += dy
      controls.target.z += camera.position.z - eskiZ
      if (camera.position.x !== eskiX || camera.position.z !== eskiZ) {
        secilenBilgi = null
        alan.dataset.konum = `${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)}`
      }
    }
  }

  // İç aydınlatma yalnız içerideyken yanar: gölgesiz olduğu için dışarıdayken duvarlardan sızardı.
  const icIsiklar = [[-15, 8, -7], [15, 8, -7], [-8, 8, 12], [8, 8, 12]].map(([x, y, z]) => {
    const isik = new THREE.PointLight('#ffdcae', 0, 46, 1.3)
    isik.position.set(x, y, z)
    scene.add(isik)
    return isik
  })
  const disHemi = hemi.intensity

  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(baslangicHedef)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 40
  controls.maxDistance = 320
  controls.maxPolarAngle = Math.PI / 2 - 0.05
  controls.autoRotate = !azHareket
  controls.autoRotateSpeed = 0.8
  controls.update()
  // Kullanıcı tutup çevirince otomatik dönüş durur, eser "elinde" kalır.
  controls.addEventListener('start', () => { controls.autoRotate = false; kameraHedef = null; icHedef = null })

  const kuresel = new THREE.Spherical()
  let parcali = false
  let iceride = false
  let icGorusAcisi = 68
  let icHedef: { konum: THREE.Vector3; bakis: THREE.Vector3 } | null = null
  let kameraHedef: THREE.Vector3 | null = null
  let calisiyor = true
  let composerHazir = false
  const boyutla = () => {
    const { clientWidth: w, clientHeight: h } = alan
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(h, 1)
    // Dar ekranda maketin tamamı sığsın diye görüş açısı genişletilir.
    camera.fov = iceride ? icGorusAcisi : camera.aspect < 1 ? 62 : 40
    camera.updateProjectionMatrix()
    if (composerHazir) {
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(w, h)
    }
  }
  // Görüntü işleme: ortam gölgesi (AO) ve hafif parlama, yumuşak kenar için çoklu örnekleme.
  // Kalite 0: hepsi · 1: AO kapalı · 2: görüntü işleme kapalı, düşük piksel oranı.
  const kaliteZorla = new URLSearchParams(location.search).get('kalite')
  let kalite = kaliteZorla === 'yuksek' ? 0 : yazilimsalCizim(renderer) ? 2 : 0
  const hedef = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, hedef)
  composer.addPass(new RenderPass(scene, camera))
  const gtao = new GTAOPass(scene, camera, 1, 1)
  gtao.blendIntensity = 0.95
  gtao.updateGtaoMaterial({ radius: 5, distanceExponent: 1.3, thickness: 2, scale: 1.2, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 })
  composer.addPass(gtao)
  const parlama = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.14, 0.45, 1.3)
  composer.addPass(parlama)
  composer.addPass(new OutputPass())
  const kaliteUygula = () => {
    gtao.enabled = kalite === 0
    if (kalite === 2) renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    alan.dataset.kalite = String(kalite)
    boyutla()
  }
  const gozlemci = new ResizeObserver(boyutla)
  gozlemci.observe(alan)
  composerHazir = true
  kaliteUygula()

  let oncekiZaman = performance.now()
  let kareSayisi = 0, olculenKare = 0, yavasKare = 0
  renderer.setAnimationLoop(() => {
    if (!calisiyor) return
    const simdi = performance.now()
    const gecenSn = Math.min((simdi - oncekiZaman) / 1000, 0.5)
    oncekiZaman = simdi
    // Uyarlamalı kalite: ısınma karelerinden sonra art arda yavaş kare görülürse efekt azaltılır.
    if (kaliteZorla !== 'yuksek' && kalite < 2 && ++olculenKare > 20) {
      yavasKare = gecenSn * 1000 > YAVAS_KARE_MS ? yavasKare + 1 : Math.max(0, yavasKare - 1)
      if (yavasKare > 30) { kalite++; yavasKare = 0; olculenKare = 0; kaliteUygula() }
    }
    for (const { grup, yukseklik } of katmanlar) {
      const hedef = parcali ? yukseklik : 0
      const yeniY = azHareket ? hedef : grup.position.y + (hedef - grup.position.y) * 0.08
      if (Math.abs(yeniY - grup.position.y) > 0.002) renderer.shadowMap.needsUpdate = true
      grup.position.y = yeniY
    }
    if (kameraHedef) {
      camera.position.lerp(kameraHedef, azHareket ? 1 : 0.08)
      if (camera.position.distanceTo(kameraHedef) < 0.5) kameraHedef = null
    }
    if (icHedef) {
      const adim = azHareket ? 1 : 1 - Math.exp(-gecenSn * 4)
      camera.position.lerp(icHedef.konum, adim)
      controls.target.lerp(icHedef.bakis, adim)
      if (camera.position.distanceTo(icHedef.konum) < 0.02) icHedef = null
    }
    if (iceride) {
      // Adım sınırı: kare hızı düşse de tek adımda ince korkulukların içinden geçilmez.
      yuruGuncelle(Math.min(gecenSn, 0.1))
      goz.copy(camera.position)
      alan.dataset.kare = String(++kareSayisi)
    }
    controls.update()
    if (iceride) {
      // Sürüklerken kamera hedefin çevresinde değil kendi çevresinde döner: bakış değişir, göz yerinde kalır.
      const fark = camera.position.clone().sub(goz)
      camera.position.copy(goz)
      controls.target.sub(fark)
    }
    bilgiGuncelle()
    isaretleriKonumla()
    if (kalite < 2) composer.render(gecenSn)
    else renderer.render(scene, camera)
  })

  return {
    parcala: (acik) => {
      parcali = acik
      // İçerisi ve katmanların tamamı görünsün diye kamera geriye ve yukarıya alınır.
      if (acik) {
        kuresel.setFromVector3(camera.position.clone().sub(controls.target))
        kuresel.phi = Math.min(kuresel.phi, 0.95)
        kuresel.radius = Math.max(kuresel.radius, 205)
        kameraHedef = controls.target.clone().add(new THREE.Vector3().setFromSpherical(kuresel))
      }
    },
    otomatik: (acik) => { controls.autoRotate = acik },
    sifirla: () => {
      if (iceride) return
      kameraHedef = null; camera.position.copy(baslangic); controls.target.copy(baslangicHedef); controls.update()
    },
    dondur: (yatay, dikey) => {
      kuresel.setFromVector3(camera.position.clone().sub(controls.target))
      kuresel.theta += yatay
      kuresel.phi = THREE.MathUtils.clamp(kuresel.phi + dikey, Math.max(0.15, controls.minPolarAngle), controls.maxPolarAngle)
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(kuresel))
      controls.update()
    },
    yakinlas: (oran) => {
      if (iceride) {
        icGorusAcisi = THREE.MathUtils.clamp(icGorusAcisi * oran, 32, 85)
        camera.fov = icGorusAcisi
        camera.updateProjectionMatrix()
        return
      }
      const yon = camera.position.clone().sub(controls.target)
      const uzaklik = THREE.MathUtils.clamp(yon.length() * oran, controls.minDistance, controls.maxDistance)
      camera.position.copy(controls.target).add(yon.setLength(uzaklik))
      controls.update()
    },
    duraklar: duraklar.map(({ id, ad }) => ({ id, ad })),
    yuruTus: (tus, basili) => { if (basili) basiliTuslar.add(tus); else basiliTuslar.delete(tus) },
    yuruBirak: () => basiliTuslar.clear(),
    bilgiKapat: () => {
      secilenBilgi = null
      kapatilanBilgi = yakinBilgi
    },
    icMekan: (durakId) => {
      const durak = duraklar.find((d) => d.id === durakId)
      const girdi = !!durak && !iceride
      const cikti = !durak && iceride
      kameraHedef = null
      secilenBilgi = null
      basiliTuslar.clear()
      if (girdi) {
        iceride = true
        isaretKatmani.hidden = false
        parcali = false
        katmanlar.forEach(({ grup }) => { grup.position.y = 0 })
        renderer.shadowMap.needsUpdate = true
        controls.autoRotate = false
        controls.enableZoom = false
        controls.minDistance = 0.3
        controls.maxDistance = 0.8
        controls.minPolarAngle = 0.02
        controls.maxPolarAngle = Math.PI - 0.02
        controls.rotateSpeed = 0.55
        camera.near = 0.15
        camera.far = 400
        scene.environmentIntensity = 0.28
        hemi.intensity = 0.5
        gtao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.3, thickness: 1.2, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
        icIsiklar.forEach((i) => { i.intensity = 40 })
        icGorusAcisi = 68
        camera.fov = icGorusAcisi
        camera.updateProjectionMatrix()
        // Dıştaki dönüşün kalan ivmesi içeride bakışı kaydırmasın.
        controls.enableDamping = false
        controls.update()
        controls.enableDamping = true
      }
      if (durak) {
        const konum = new THREE.Vector3(...durak.konum)
        const yon = new THREE.Vector3(...durak.bak).sub(konum).normalize()
        const bakis = konum.clone().add(yon.multiplyScalar(0.5))
        if (girdi) {
          camera.position.copy(konum)
          controls.target.copy(bakis)
          icHedef = null
        } else {
          icHedef = { konum, bakis }
        }
      }
      if (cikti) {
        iceride = false
        isaretKatmani.hidden = true
        icHedef = null
        controls.enableZoom = true
        controls.minDistance = 40
        controls.maxDistance = 320
        controls.minPolarAngle = 0
        controls.maxPolarAngle = Math.PI / 2 - 0.05
        controls.rotateSpeed = 1
        camera.near = 4
        camera.far = 900
        scene.environmentIntensity = 0.42
        hemi.intensity = disHemi
        gtao.updateGtaoMaterial({ radius: 5, distanceExponent: 1.3, thickness: 2, scale: 1.2, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
        icIsiklar.forEach((i) => { i.intensity = 0 })
        boyutla()
        camera.position.copy(baslangic)
        controls.target.copy(baslangicHedef)
      }
      controls.update()
    },
    temizle: () => {
      calisiyor = false
      renderer.setAnimationLoop(null)
      gozlemci.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            const dokulu = m as THREE.MeshStandardMaterial
            dokulu.map?.dispose(); dokulu.bumpMap?.dispose()
            m.dispose()
          }
        }
      })
      ortamHaritasi.dispose()
      artAlan.dispose()
      gtao.dispose()
      parlama.dispose()
      composer.dispose()
      hedef.dispose()
      renderer.dispose()
      isaretKatmani.remove()
      delete alan.dataset.konum
      delete alan.dataset.kare
      delete alan.dataset.kalite
      canvas.remove()
    },
  }
}
