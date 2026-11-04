// VR oturumu: rig, kumandalar, görünüm geçişleri. Sahnenin kendisine yalnız XrSecenek üzerinden dokunur.
import * as THREE from 'three'
import { MASA_OLCEK_ILK, MASA_OLCEK_MAX, MASA_OLCEK_MIN, XR_DONUS, anlikDonus, basCevresindeDon, durakRig, kumandaGirdisi, masaRig, oluBolge, ortusmeyenAci, yurumeAdimi, type RigKonumu } from './xrHareket'
import { ZEMIN_Y, type IcDurak, type IcYurume } from './ulucamiIc'
import { menuOgeleri } from './xrMetin'
import { KART_G, MENU_G, bilgiPaneli, etiketPaneli, xrPaneli } from './xrPanel'
import { OYUNCU_YARICAP, carpiyor } from './yurumeCarpisma'

export interface XrSecenek {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  yurume: IcYurume; duraklar: IcDurak[];
  /** İç ışık ve ortam; kameraya dokunmaz. */
  icDurumu: (iceride: boolean) => void;
  /** Katmanlar anında hedefe gider. */
  parcalaAyarla: (acik: boolean) => void;
  parcaliMi: () => boolean;
  bilgiKapat: () => void;
  /** Sahne kamera, near/far, boyut ve React durumunu geri alır. */
  oturumBitti: () => void;
}

export interface XrOturum {
  /** Reddedilirse reddeder, sahnede iz bırakmaz. */
  baslat(): Promise<void>;
  kare(dt: number): void;
  /** Açık oturumu kapatır, yoksa bir şey yapmaz. */
  bitir(): void;
  bilgiGoster(k: { baslik: string; metin: string; kaynak: string } | null): void;
  aktif(): boolean;
  temizle(): void;
}

const ARKA_PLAN = '#1a2b25'
const DISK_YARICAP = 6
const ISIN_BOY = 1.5
const PANEL_UZAKLIK = 1.3
// Kart ve menü aynı anda açıksa yan yana durur: ışın öndekine takılıp arkadakini seçilemez bırakmasın.
const PANEL_AYRIM = (MENU_G / 2 + KART_G / 2 + 0.06) / PANEL_UZAKLIK
const CUBUK_HIZI = 1.2, EN_UZUN_DT = 0.1

export function xrOturumuKur(s: XrSecenek): XrOturum {
  const { renderer, scene, camera, yurume, duraklar } = s
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  // Rig 100× iken göz aralığı da 100× olur (WebXRManager kamera dünya matrisini rig ile çarpar), dünya masa boyutunda görünür.
  // Rig'in içi hep cihaz metresidir: disk, ışın ve paneller ölçekten bağımsız aynı boyutta kalır.
  const rig = new THREE.Group()
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(DISK_YARICAP, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#0f1a16' }),
  )
  rig.add(disk)

  const menu = xrPaneli()
  const kart = bilgiPaneli()
  // Paneller derinlik sınamasına girmez: duvar dibinde veya maketin önünde de okunur.
  for (const [panel, sira] of [[menu, 1000], [kart, 1001]] as const) {
    panel.nesne.material.transparent = true
    panel.nesne.material.depthTest = false
    panel.nesne.material.depthWrite = false
    panel.nesne.renderOrder = sira
    rig.add(panel.nesne)
  }
  menu.nesne.visible = false

  // Etiket başa bağlıdır: menü kapansa, kart önüne geçse veya baş dönse de görüş alanının altında kalır.
  const etiket = etiketPaneli()
  etiket.nesne.material.transparent = true
  etiket.nesne.material.depthTest = false
  etiket.nesne.material.depthWrite = false
  etiket.nesne.renderOrder = 1003
  etiket.nesne.frustumCulled = false
  etiket.nesne.position.set(0, -0.38, -1.2)

  const isinGeometri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -ISIN_BOY)])
  const isinMalzeme = new THREE.LineBasicMaterial({ color: '#f8f5ef', transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
  const raycaster = new THREE.Raycaster()

  let oturum: XRSession | null = null
  let basliyor = false
  let kapandi = false
  let oncekiArka: THREE.Scene['background'] = null
  let iceride = false
  let aci = 0, olcek = MASA_OLCEK_ILK
  let menuAcik = true, menuBasili = false, donusBasili = false
  // Baş pozu gelmeden paneller yerleştirilemez; ilk karelerde bekletilir.
  let pozHazir = false
  let bekleyenKart: { baslik: string; metin: string; kaynak: string } | null = null

  const rigUygula = (r: RigKonumu) => {
    rig.position.set(r.x, r.y, r.z)
    rig.rotation.set(0, r.rotY, 0)
  }
  const masaUygula = () => {
    rig.scale.setScalar(olcek)
    rigUygula(masaRig(aci, olcek))
  }

  // XR kamerası her karenin başında güncellenir; konumu rig içindeki (yerel) baş pozudur.
  const basYerel = () => xr.getCamera()
  const yatayIleri = new THREE.Vector3()
  /** Başın rig içindeki yatay yönü; artı yön sola. Tam yukarı veya aşağı bakarken 0. */
  const basYaw = () => {
    yatayIleri.set(0, 0, -1).applyQuaternion(basYerel().quaternion).setY(0)
    return yatayIleri.lengthSq() < 1e-6 ? 0 : Math.atan2(-yatayIleri.x, -yatayIleri.z)
  }
  /** Paneli başın önüne koyar; öteki panel açıksa onunla örtüşmeyecek yana kayar. */
  const paneliKoy = (nesne: THREE.Object3D, oteki: THREE.Object3D, yon: 1 | -1) => {
    const bas = basYerel().position
    const aci = oteki.visible
      ? ortusmeyenAci(basYaw(), Math.atan2(bas.x - oteki.position.x, bas.z - oteki.position.z), PANEL_AYRIM, yon)
      : basYaw()
    nesne.position.set(bas.x - Math.sin(aci) * PANEL_UZAKLIK, bas.y, bas.z - Math.cos(aci) * PANEL_UZAKLIK)
    nesne.rotation.set(0, aci, 0)
  }
  const kartiKoy = () => paneliKoy(kart.nesne, menu.nesne, -1)

  const menuCiz = () => menu.ciz(menuOgeleri({ iceride, parcali: s.parcaliMi(), duraklar }))
  const menuGoster = (acik: boolean) => {
    menuAcik = acik
    menu.nesne.visible = acik
    if (!acik) return
    paneliKoy(menu.nesne, kart.nesne, 1)
    menuCiz()
  }

  const gorunumDurak = (id: string) => {
    const durak = duraklar.find((d) => d.id === id)
    if (!durak) return
    if (!iceride) {
      iceride = true
      s.parcalaAyarla(false)
      s.icDurumu(true)
      disk.visible = false
      rig.scale.setScalar(1)
    }
    const { x, z } = basYerel().position
    rigUygula(durakRig(durak.konum, durak.bak, { x, z }, ZEMIN_Y, basYaw()))
  }
  const gorunumMaket = () => {
    if (iceride) {
      iceride = false
      s.icDurumu(false)
      disk.visible = true
    }
    masaUygula()
  }

  const bitir = () => { oturum?.end().catch(() => {}) } // Zaten kapanmış oturumda end() reddeder

  const eylem = (id: string) => {
    if (id === 'cik') return bitir()
    if (id === 'iceri') { if (duraklar[0]) gorunumDurak(duraklar[0].id) }
    else if (id === 'disari') gorunumMaket()
    else if (id === 'parcala') s.parcalaAyarla(!s.parcaliMi())
    else if (id.startsWith('durak:')) gorunumDurak(id.slice('durak:'.length))
    menuCiz()
  }

  const secildi = (kumanda: THREE.XRTargetRaySpace) => {
    if (!oturum) return
    // Raycaster görünmezliğe bakmaz; kapalı paneller aday olmamalı.
    const adaylar: THREE.Object3D[] = [menu.nesne, kart.nesne].filter((n) => n.visible)
    if (!adaylar.length) return
    // select olayı kare döngüsünün dışında gelir: dünya matrisleri elle tazelenir.
    kumanda.updateWorldMatrix(true, false, true) // matrixAutoUpdate kapalı; zorlanmazsa rig değişimi yansımaz
    adaylar.forEach((n) => n.updateWorldMatrix(true, false))
    raycaster.setFromXRController(kumanda)
    const isabet = raycaster.intersectObjects(adaylar, false)[0]
    if (!isabet) return
    if (isabet.object === kart.nesne) return s.bilgiKapat()
    const id = isabet.uv ? menu.isabet(isabet.uv.y) : null
    if (id) eylem(id)
  }

  const kumandalar = [0, 1].map((i) => {
    const kumanda = xr.getController(i)
    const isin = new THREE.Line(isinGeometri, isinMalzeme)
    isin.renderOrder = 1002
    kumanda.add(isin)
    rig.add(kumanda)
    const sec = () => secildi(kumanda)
    kumanda.addEventListener('select', sec)
    return { kumanda, sec }
  })

  const gir = (yeni: XRSession) => {
    oturum = yeni
    rig.add(camera)
    camera.add(etiket.nesne)
    scene.add(rig)
    oncekiArka = scene.background
    scene.background = new THREE.Color(ARKA_PLAN)
    // Near/far rig'in içindeki metreyle işler (görünüm matrisi rig ölçeğine bölünür): 100× iken near 5 sahne birimidir.
    camera.near = 0.05
    camera.far = 900
    disk.visible = true
    masaUygula()
  }

  const geriAl = () => {
    etiket.nesne.removeFromParent()
    camera.removeFromParent()
    camera.scale.set(1, 1, 1) // Rig'den ayrışırken kalan yuvarlama hatası
    rig.removeFromParent()
    scene.background = oncekiArka
    oncekiArka = null
    if (iceride) s.icDurumu(false)
    oturum = null
    iceride = false
    aci = 0
    olcek = MASA_OLCEK_ILK
    menuAcik = true
    menuBasili = false
    donusBasili = false
    pozHazir = false
    bekleyenKart = null
    menu.nesne.visible = false
    kart.gizle()
  }

  const oturumBitince = () => {
    if (!oturum) return // Yarım kalan açılışın kapanışı: sahneye dokunulmamıştı
    geriAl()
    s.oturumBitti()
  }
  xr.addEventListener('sessionend', oturumBitince)

  const basDunya = new THREE.Vector3(), ileriDunya = new THREE.Vector3()

  const icKare = (girdi: ReturnType<typeof kumandaGirdisi>, dt: number) => {
    // Rig bu kare içinde (durak seçimiyle) yer değiştirmiş olabilir; matris tazelenmeden okunmaz.
    camera.updateWorldMatrix(true, false)
    basDunya.setFromMatrixPosition(camera.matrixWorld)
    ileriDunya.set(0, 0, -1).transformDirection(camera.matrixWorld)
    const bas = { x: basDunya.x, z: basDunya.z }
    const yeni = yurumeAdimi(bas, { x: ileriDunya.x, z: ileriDunya.z }, { x: girdi.solX, y: girdi.solY }, dt,
      (x, z) => carpiyor(yurume, x, z, OYUNCU_YARICAP))
    rig.position.x += yeni.x - bas.x
    rig.position.z += yeni.z - bas.z

    const donus = anlikDonus(girdi.sagX, donusBasili)
    donusBasili = donus.basili
    if (donus.yon !== 0) {
      // Y çevresinde artı yön sola döndürür; sağa itince kullanıcı sağa dönsün diye işaret ters.
      const a = -donus.yon * XR_DONUS
      const r = basCevresindeDon({ x: rig.position.x, z: rig.position.z }, yeni, a)
      rig.position.x = r.x
      rig.position.z = r.z
      rig.rotation.y += a
    }
  }

  const masaKare = (girdi: ReturnType<typeof kumandaGirdisi>, dt: number) => {
    const donus = oluBolge(girdi.sagX), buyume = oluBolge(girdi.sagY)
    if (!donus && !buyume) return
    aci += donus * dt * CUBUK_HIZI
    olcek = THREE.MathUtils.clamp(olcek * Math.exp(buyume * dt * CUBUK_HIZI), MASA_OLCEK_MIN, MASA_OLCEK_MAX)
    masaUygula()
  }

  return {
    baslat: async () => {
      if (oturum || basliyor) return
      if (!navigator.xr) throw new Error('Bu tarayıcıda WebXR yok')
      basliyor = true
      const oran = renderer.getPixelRatio(), boyut = renderer.getSize(new THREE.Vector2())
      let yeni: XRSession | null = null
      try {
        yeni = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
        // İzin beklenirken sahne kapanmış olabilir: kullanıcı boş oturumda kalmasın.
        if (kapandi) throw new Error('Sahne kapandı')
        await xr.setSession(yeni)
        if (kapandi || xr.getSession() !== yeni) throw new Error('VR oturumu açılırken kapandı')
      } catch (hata) {
        // setSession yarıda kaldıysa renderer boyutu bozulabilir (kapanışta boş piksel oranı yazar); kapanınca eskisine döner.
        if (yeni) {
          const geriYukle = () => {
            xr.removeEventListener('sessionend', geriYukle)
            renderer.setPixelRatio(oran)
            renderer.setSize(boyut.x, boyut.y, false)
          }
          xr.addEventListener('sessionend', geriYukle)
          await yeni.end().catch(geriYukle)
        }
        throw hata
      } finally {
        basliyor = false
      }
      xr.setFoveation(1)
      gir(yeni)
    },
    kare: (dt) => {
      if (!oturum) return
      if (!pozHazir) {
        const kare = xr.getFrame(), uzay = xr.getReferenceSpace()
        if (!kare || !uzay || !kare.getViewerPose(uzay)) return
        pozHazir = true
        if (menuAcik) menuGoster(true)
        if (bekleyenKart) {
          kartiKoy()
          kart.goster(bekleyenKart)
          bekleyenKart = null
        }
      }
      const girdi = kumandaGirdisi(oturum.inputSources)
      if (girdi.menu && !menuBasili) menuGoster(!menuAcik)
      menuBasili = girdi.menu
      const adim = Math.min(dt, EN_UZUN_DT)
      if (iceride) icKare(girdi, adim)
      else masaKare(girdi, adim)
    },
    bitir,
    bilgiGoster: (k) => {
      if (!oturum) return
      if (!k) {
        bekleyenKart = null
        kart.gizle()
      } else if (pozHazir) {
        kartiKoy()
        kart.goster(k)
      } else {
        bekleyenKart = k
      }
    },
    aktif: () => oturum !== null,
    temizle: () => {
      kapandi = true
      xr.removeEventListener('sessionend', oturumBitince)
      const acik = oturum
      // Sahne de kapanıyor: oturumBitti çağrılmaz, sonradan gelen sessionend de dinlenmez.
      if (acik) {
        geriAl()
        acik.end().catch(() => {})
      }
      for (const { kumanda, sec } of kumandalar) {
        kumanda.removeEventListener('select', sec)
        kumanda.removeFromParent()
      }
      menu.dispose()
      kart.dispose()
      etiket.dispose()
      disk.geometry.dispose()
      disk.material.dispose()
      isinGeometri.dispose()
      isinMalzeme.dispose()
    },
  }
}
