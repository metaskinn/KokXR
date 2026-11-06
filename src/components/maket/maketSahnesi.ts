// Bu modül yalnızca «Maketi eline al» sonrasında dinamik olarak yüklenir.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { hafifCihaz } from './ulucamiZemin'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Kaynak, MaketBilgiNoktasi } from '../../types/eser'
import { kaynakMetni } from '../KaynakSatiri'
import { ulucamiMaketi } from './ulucamiMaket'
import { OYUNCU_YARICAP, bakisKesiliyor, carpiyor as yurumeCarpiyor } from './yurumeCarpisma'
import { xrOturumuKur } from './xrOturum'

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
  /** VR oturumu açar; reddedilirse Promise reddedilir, sahne çalışmaya devam eder. */
  xrBaslat: () => Promise<void>;
  temizle: () => void;
}

export interface SahneSecenek {
  bilgiler?: MaketBilgiNoktasi[];
  kaynaklar?: Kaynak[];
  /** Görünecek bilgi kartı değiştiğinde çağrılır. */
  bilgiDegisti?: (id: string | null) => void;
  xrDegisti?: (aktif: boolean) => void;
}

const YURUME_HIZI = 5, KOSMA_HIZI = 9, DONUS_HIZI = 1.7
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
  renderer.toneMappingExposure = 1.06
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
  scene.environment = ortamHaritasi
  // İç mekân yansıması: krem duvarlar, gül zemin ve avize noktaları. Altın, mermer ve su bunları yansıtır.
  const icOrtamSahnesi = new THREE.Scene()
  const icOrtamGeo = new THREE.SphereGeometry(1, 12, 8), icOrtamKutu = new THREE.BoxGeometry(70, 26, 56)
  const icOrtamMal = [
    new THREE.MeshBasicMaterial({ color: '#b9a488', side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 7.4, 5.2) }),
  ]
  icOrtamSahnesi.add(new THREE.Mesh(icOrtamKutu, icOrtamMal[0]))
  for (let x = -27.6; x <= 27.6; x += 13.8) for (let z = -20.6; z <= 20.6; z += 13.75) {
    const l = new THREE.Mesh(icOrtamGeo, icOrtamMal[1])
    l.position.set(x, 3, z)
    icOrtamSahnesi.add(l)
  }
  const icOrtam = ortam.fromScene(icOrtamSahnesi, 0.03, 0.5, 100).texture
  ortam.dispose()
  icOrtamGeo.dispose(); icOrtamKutu.dispose(); icOrtamMal.forEach((m) => m.dispose())
  scene.environmentIntensity = 0.42
  const camera = new THREE.PerspectiveCamera(40, 1, 4, 900)
  // Açılış kuzeyden: taç kapı, avlu köşkleri ve iki minare fotoğraftaki gibi önde görünür.
  const baslangic = new THREE.Vector3(-58, 40, -118)
  const baslangicHedef = new THREE.Vector3(0, 14, -3)
  camera.position.copy(baslangic)

  const hemi = new THREE.HemisphereLight('#ffeed8', '#39423a', 0.58)
  scene.add(hemi)
  const gunes = new THREE.DirectionalLight('#ffdcaa', 3.7)
  gunes.position.set(-85, 95, -80)
  gunes.castShadow = true
  const dokunmatik = matchMedia('(hover: none)').matches
  gunes.shadow.mapSize.set(dokunmatik ? 2048 : 4096, dokunmatik ? 2048 : 4096)
  gunes.shadow.radius = 3.5
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
  const dunyaKonumu = new THREE.Vector3()
  // XR'da kamera rig'e bağlıdır; yerel konumu dünyadaki yeri vermez.
  const bakisKonumu = () => renderer.xr.isPresenting ? camera.getWorldPosition(dunyaKonumu) : camera.position
  const xrKarti = (id: string | null) => {
    const bilgi = isaretler.find((i) => i.bilgi.id === id)?.bilgi
    if (!bilgi) return null
    const kaynak = secenek.kaynaklar?.find((k) => k.id === bilgi.kaynakId)
    return { baslik: bilgi.baslik, metin: bilgi.metin, kaynak: `Kaynak: ${kaynak ? kaynakMetni(kaynak) : 'Kaynak bilgisi bulunamadı.'}` }
  }

  const bilgiGuncelle = () => {
    let enYakin: string | null = null, enKisa = Infinity
    const bakis = bakisKonumu()
    for (const { bilgi, konum } of isaretler) {
      const uzaklik = Math.hypot(bakis.x - konum.x, bakis.z - konum.z)
      if (iceride && uzaklik < bilgi.yaricap && uzaklik < enKisa) { enYakin = bilgi.id; enKisa = uzaklik }
    }
    if (enYakin !== yakinBilgi) { yakinBilgi = enYakin; kapatilanBilgi = null }
    if (!iceride) { secilenBilgi = null; kapatilanBilgi = null }
    // VR'da kart yalnız başlığa tıklanınca açılır; yakınlık masaüstünde geçerlidir.
    const gosterilecek = secilenBilgi ?? (!renderer.xr.isPresenting && yakinBilgi !== kapatilanBilgi ? yakinBilgi : null)
    if (gosterilecek !== aktifBilgi) {
      aktifBilgi = gosterilecek
      secenek.bilgiDegisti?.(aktifBilgi)
      if (renderer.xr.isPresenting) xr.bilgiGoster(xrKarti(aktifBilgi))
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
  const carpiyor = (x: number, z: number) => yurumeCarpiyor(yurume, x, z, OYUNCU_YARICAP)
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
    Object.assign(isik.shadow.camera, { near: 0.4, far: 46 })
    isik.shadow.mapSize.set(1024, 1024)
    isik.shadow.radius = 4
    isik.shadow.bias = -0.002
    isik.shadow.normalBias = 0.06
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
    if (renderer.xr.isPresenting) return
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
  // Saydam ışık katmanları AO'nun derinlik geçişine girmez, yoksa etraflarında leke bırakır.
  const aoDisi: THREE.Object3D[] = []
  scene.traverse((o) => { if (o instanceof THREE.Mesh && (o.material as THREE.Material).blending === THREE.AdditiveBlending) aoDisi.push(o) })
  // Three bu iki yöntemi dışa açmıyor; yalnız görünürlük listesini genişletmek için sarılır.
  const aoIc = gtao as unknown as { _overrideVisibility(): void; _restoreVisibility(): void }
  const aoGizle = aoIc._overrideVisibility.bind(gtao), aoGoster = aoIc._restoreVisibility.bind(gtao)
  aoIc._overrideVisibility = () => { aoGizle(); aoDisi.forEach((o) => { o.visible = false }) }
  aoIc._restoreVisibility = () => { aoGoster(); aoDisi.forEach((o) => { o.visible = true }) }
  const parlama = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.5, 1.2)
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

  // Işık, ortam ve AO geçişi; kameraya dokunmaz, VR'daki iç görünüm de bunu kullanır.
  const icDurumu = (ic: boolean) => {
    iceride = ic
    // VR'da HTML görünmez, işaretler açılmaz.
    isaretKatmani.hidden = !ic || renderer.xr.isPresenting
    scene.environment = ic ? icOrtam : ortamHaritasi
    scene.environmentIntensity = ic ? 0.5 : 0.42
    hemi.intensity = ic ? 0.34 : disHemi
    parlama.strength = ic ? 0.34 : 0.18
    parlama.threshold = ic ? 0.95 : 1.2
    // Gerçek paye ve kemer gölgeleri: bir kez çizilir; Quest, telefon ve yazılımsal çizimde kapalıdır.
    const icGolge = ic && !hafifCihaz() && kalite < 2
    if (icIsiklar[0].castShadow !== icGolge) {
      icIsiklar.forEach((i) => { i.castShadow = icGolge })
      renderer.shadowMap.needsUpdate = true
    }
    gtao.updateGtaoMaterial(ic
      ? { radius: 2.2, distanceExponent: 1.3, thickness: 1.2, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }
      : { radius: 5, distanceExponent: 1.3, thickness: 2, scale: 1.2, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
    icIsiklar.forEach((i) => { i.intensity = ic ? 32 : 0 })
  }
  const bilgiKapat = () => {
    secilenBilgi = null
    kapatilanBilgi = yakinBilgi
  }

  const xr = xrOturumuKur({
    renderer, scene, camera, yurume, duraklar, icDurumu, bilgiKapat, katmanlar,
    golgeYenile: () => { renderer.shadowMap.needsUpdate = true },
    basliklar: isaretler.map(({ bilgi }) => bilgi),
    bilgiSec: (id) => { secilenBilgi = secilenBilgi === id ? null : id },
    parcalaAyarla: (acik) => { parcali = acik },
    parcaliMi: () => parcali,
    oturumBitti: () => {
      // VR menüsünden parçalanmış kalmasın: sayfadaki düğme birleşik gösterir.
      parcali = false
      controls.enabled = true
      camera.position.copy(baslangic)
      controls.target.copy(baslangicHedef)
      camera.near = 4
      camera.far = 900
      controls.update()
      boyutla()
      secenek.xrDegisti?.(false)
    },
  })

  let oncekiZaman = performance.now()
  let kareSayisi = 0, olculenKare = 0, yavasKare = 0
  renderer.setAnimationLoop(() => {
    if (!calisiyor) return
    const simdi = performance.now()
    const gecenSn = Math.min((simdi - oncekiZaman) / 1000, 0.5)
    oncekiZaman = simdi
    if (renderer.xr.isPresenting) {
      // Katmanlar animasyonsuz gider: gölgeyi her karede yeniden çizmek VR'da pahalıdır. Birleştirme sırasında katmanlar oyunundur.
      if (!xr.birlesimde()) for (const { grup, yukseklik } of katmanlar) {
        const hedef = parcali ? yukseklik : 0
        if (grup.position.y !== hedef) { grup.position.y = hedef; renderer.shadowMap.needsUpdate = true }
      }
      xr.kare(gecenSn)
      bilgiGuncelle()
      renderer.render(scene, camera)
      return
    }
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

  const sahne: MaketSahnesi = {
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
    bilgiKapat,
    // Kullanıcı jesti kaybolmasın: requestSession'dan önce await yok.
    xrBaslat: async () => {
      if (iceride) sahne.icMekan(null)
      parcali = false
      kameraHedef = null
      await xr.baslat()
      // VR'da kamera rig yerelindedir: fare masaüstü koordinatıyla ezmesin.
      controls.enabled = false
      controls.autoRotate = false
      secenek.xrDegisti?.(true)
    },
    icMekan: (durakId) => {
      const durak = duraklar.find((d) => d.id === durakId)
      const girdi = !!durak && !iceride
      const cikti = !durak && iceride
      kameraHedef = null
      secilenBilgi = null
      basiliTuslar.clear()
      if (girdi) {
        icDurumu(true)
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
        icDurumu(false)
        icHedef = null
        controls.enableZoom = true
        controls.minDistance = 40
        controls.maxDistance = 320
        controls.minPolarAngle = 0
        controls.maxPolarAngle = Math.PI / 2 - 0.05
        controls.rotateSpeed = 1
        camera.near = 4
        camera.far = 900
        boyutla()
        camera.position.copy(baslangic)
        controls.target.copy(baslangicHedef)
      }
      controls.update()
    },
    temizle: () => {
      xr.bitir()
      xr.temizle()
      calisiyor = false
      renderer.setAnimationLoop(null)
      gozlemci.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            const dokulu = m as THREE.MeshStandardMaterial
            dokulu.map?.dispose(); dokulu.bumpMap?.dispose(); dokulu.normalMap?.dispose()
            m.dispose()
          }
        }
      })
      ortamHaritasi.dispose()
      icOrtam.dispose()
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
  return sahne
}
