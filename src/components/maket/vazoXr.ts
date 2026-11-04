// VR'da vazo onarımı: Quest kumandasıyla parçayı tut, yerine götür, oturt. Vazo sahnesine yalnız VazoXrBaglam üzerinden dokunur.
// Üst bölümdeki saf hesapları masaüstü sahnesi de kullanır; dosya çalışma anında yalnız three'ye bağlıdır, Node testi doğrudan içe aktarır.
import * as THREE from 'three'

export const TEMSILI_MODEL_ETIKET = 'Temsilî model · Tarihî eser değildir'
export const ALT_YAZI = 'Örnek yazı · Tarihî kitabe değildir'
export const PARCA_SAYISI = 6

/** Rig ölçeği: bir cihaz metresi 100 model birimi. Vazo modeli 44 birim, VR'da 44 cm görünür. */
export const METRE = 100
/** Parça merkezi hedefe bu kadar yakınsa oturur (model birimi, yani cm). */
export const XR_OTURMA_ESIGI = 9
/** Masaüstü tablası 66 birimdir; VR'da kullanıcı tablanın içinde kalmasın diye küçülür. */
export const XR_TABLA_YARICAP = 50
const VAZO_UZAKLIK = 0.7

export type Uclu = [number, number, number]

export function yerineOturur(uzaklik: number, esik: number) {
  return uzaklik < esik
}

/** Masaüstünde yakınlık ekranda ölçülür: piksel eşiği alan genişliğine göre 20–34. */
export function ekranEsigi(genislik: number) {
  return Math.max(20, Math.min(34, genislik * 0.055))
}

/** Tablanın cihaz yüksekliği (metre): ayakta ve oturarak erişilebilsin. */
export function masaYuksekligi(basY: number) {
  return Math.min(0.85, Math.max(0.55, basY - 0.85))
}

/** Model başlangıcı başın önünde masa yüksekliğine gelsin, kullanıcı vazoya masaüstündeki onarım açısıyla (+z'den) baksın. */
export function vazoRigi(bas: { x: number; y: number; z: number; yaw: number }) {
  const yerelX = bas.x - Math.sin(bas.yaw) * VAZO_UZAKLIK
  const yerelZ = bas.z - Math.cos(bas.yaw) * VAZO_UZAKLIK
  const rotY = -bas.yaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return {
    x: -METRE * (yerelX * c + yerelZ * s),
    y: -METRE * masaYuksekligi(bas.y),
    z: -METRE * (-yerelX * s + yerelZ * c),
    rotY,
  }
}

// Derece: +z kullanıcıya bakar. Tam önde parça yok: vazoyu kapatmasın. Parça sırası karışık: komşu parçalar komşu yuvaya düşmesin.
const RAF_ACILARI = [-35, 150, 95, 35, -95, -150]
const RAF_YARICAP = 35

/** VR'da parçalar vazonun çevresinde, tablanın üstünde. `altPaylari`: merkezden parçanın altına uzaklık. */
export function xrRafDizilimi(altPaylari: number[], tablaY: number): Uclu[] {
  return altPaylari.map((alt, id) => {
    const a = (RAF_ACILARI[id % RAF_ACILARI.length] * Math.PI) / 180
    return [Math.sin(a) * RAF_YARICAP, tablaY + alt, Math.cos(a) * RAF_YARICAP]
  })
}

export interface ParcaAdayi { id: number; merkez: Uclu; yaricap: number }

/** Önce kumandanın değdiği parça, yoksa ışının en ortadan geçtiği parça. Aday yoksa `null`. */
export function parcaSec(baslangic: Uclu, yon: Uclu, adaylar: ParcaAdayi[], menzil: number): number | null {
  let dokunan: number | null = null, enDokunus = 1
  let nisanlanan: number | null = null, enNisan = 1
  for (const { id, merkez, yaricap } of adaylar) {
    const f: Uclu = [merkez[0] - baslangic[0], merkez[1] - baslangic[1], merkez[2] - baslangic[2]]
    const uzaklik = Math.hypot(...f)
    if (uzaklik / yaricap < enDokunus) { enDokunus = uzaklik / yaricap; dokunan = id }
    const t = f[0] * yon[0] + f[1] * yon[1] + f[2] * yon[2]
    if (t <= 0 || t > menzil) continue
    const dik = Math.sqrt(Math.max(0, uzaklik * uzaklik - t * t))
    if (dik / yaricap < enNisan) { enNisan = dik / yaricap; nisanlanan = id }
  }
  return dokunan ?? nisanlanan
}

const DUGME = { uMin: 0.28, uMax: 0.72, vMin: 0.07, vMax: 0.31 }
/** Durum panelindeki `VR'dan çık` düğmesi. uv.y 1 üst kenardır. */
export function cikisDugmesineMi(u: number, v: number) {
  return u >= DUGME.uMin && u <= DUGME.uMax && v >= DUGME.vMin && v <= DUGME.vMax
}

export function panelMetni(yerlesen: number, sonuc: string) {
  const bitti = yerlesen >= PARCA_SAYISI
  return {
    baslik: bitti ? 'Vazo onarıldı!' : 'Vazoyu onar',
    ilerleme: `${yerlesen}/${PARCA_SAYISI} parça yerinde`,
    ipucu: bitti ? 'Vazoyu tutup çevir, altındaki örnek yazıyı oku.' : sonuc || 'Parçayı tetik veya yan tuşla tut, götür, bırak.',
  }
}

// ---------- Oturum ----------

export interface VazoXrBaglam {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  parcalar: THREE.Object3D[]
  hedefler: { position: THREE.Vector3; quaternion: THREE.Quaternion }[]
  /** Parçalar yerindeyken vazoyla birlikte taşınan nesneler (onarım izleri, alt yazı). */
  butunNesneleri: THREE.Object3D[]
  /** Tutulabilir, henüz oturmamış parça mı? */
  serbestMi: (id: number) => boolean
  /** Bütün parçalar oturdu ve oturma animasyonu bitti mi? */
  tamamMi: () => boolean
  yerlesenSayisi: () => number
  tutusBasladi: (id: number) => void
  /** Masaüstündeki bırakma yolu: animasyon ve oyun durumu aynı yerden gider. */
  birak: (id: number, oturdu: boolean) => void
  /** Oyun denemesi saymadan rafa döndürür (kumanda koptu, oturum kapandı). */
  tutusIptal: (id: number) => void
  sec: (id: number | null) => void
  vurgula: (idler: number[]) => void
  /** VR dizilimi ve kilitleri; `false` masaüstü görünümüne döndürür. */
  xrModu: (acik: boolean, raflar?: Uclu[]) => void
  oturumBitti: () => void
}

export interface VazoXr {
  /** Çağrıldığı anda requestSession'a gider: kullanıcı jesti içinde çağrılmalı. Reddedilirse sahnede iz bırakmaz. */
  baslat: () => Promise<void>
  kare: () => void
  bitir: () => void
  aktif: () => boolean
  temizle: () => void
}

const ISIN_BOY = 1.5
const VAZO_MERKEZ_Y = 22
const VAZO_YARICAP = 22
// Vazo ele çekilir: uzaktan tutulup çevrilince kaldıraçla savrulmasın. Cihaz metresi.
const VAZO_EL_UZAKLIK = 0.25
const TABLA_UST = -1.25
const YAZI = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const ZEMIN = '#f8f5ef', CAM = '#244e40', METIN = '#253a34', BRONZ = '#8e6236', BEYAZ = '#ffffff'

function tuvalDuzlemi(genislik: number, yukseklik: number, gercekGenislik: number) {
  const el = document.createElement('canvas')
  el.width = genislik
  el.height = yukseklik
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  const doku = new THREE.CanvasTexture(el)
  doku.colorSpace = THREE.SRGBColorSpace
  doku.anisotropy = 8
  const geometri = new THREE.PlaneGeometry(gercekGenislik, (gercekGenislik * yukseklik) / genislik)
  const malzeme = new THREE.MeshBasicMaterial({ map: doku, toneMapped: false, transparent: true, depthWrite: false })
  const nesne = new THREE.Mesh(geometri, malzeme)
  return { c, doku, nesne, dispose: () => { doku.dispose(); malzeme.dispose(); geometri.dispose() } }
}

function durumPaneli() {
  const G = 1024, Y = 512
  const p = tuvalDuzlemi(G, Y, 64)
  const ciz = (yerlesen: number, sonuc: string) => {
    const { baslik, ilerleme, ipucu } = panelMetni(yerlesen, sonuc)
    const { c } = p
    c.fillStyle = ZEMIN
    c.fillRect(0, 0, G, Y)
    c.fillStyle = BRONZ
    c.fillRect(0, 0, G, 100)
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillStyle = BEYAZ
    c.font = `700 56px ${YAZI}`
    c.fillText(baslik, G / 2, 50, G - 80)
    c.fillStyle = CAM
    c.font = `700 52px ${YAZI}`
    c.fillText(ilerleme, G / 2, 165, G - 80)
    c.fillStyle = METIN
    c.font = `400 38px ${YAZI}`
    c.fillText(ipucu, G / 2, 250, G - 60)
    const x = G * DUGME.uMin, en = G * (DUGME.uMax - DUGME.uMin), ust = Y * (1 - DUGME.vMax), boy = Y * (DUGME.vMax - DUGME.vMin)
    c.beginPath()
    c.roundRect(x, ust, en, boy, 16)
    c.fillStyle = CAM
    c.fill()
    c.fillStyle = BEYAZ
    c.font = `600 48px ${YAZI}`
    c.fillText("VR'dan çık", G / 2, ust + boy / 2, en - 30)
    p.doku.needsUpdate = true
  }
  return { nesne: p.nesne, ciz, dispose: p.dispose }
}

function etiketPaneli() {
  const G = 1024, Y = 72
  const p = tuvalDuzlemi(G, Y, 0.6)
  p.c.fillStyle = BRONZ
  p.c.fillRect(0, 0, G, Y)
  p.c.fillStyle = BEYAZ
  p.c.font = `700 40px ${YAZI}`
  p.c.textAlign = 'center'
  p.c.textBaseline = 'middle'
  p.c.fillText(TEMSILI_MODEL_ETIKET, G / 2, Y / 2, G - 80)
  p.doku.needsUpdate = true
  return { nesne: p.nesne, dispose: p.dispose }
}

interface El {
  kumanda: THREE.XRTargetRaySpace
  isin: THREE.Line
  tetik: boolean
  yan: boolean
  /** Parça kimliği, bütün vazo için VAZO. */
  tutulan: number | null
  ofset: THREE.Matrix4
  dinleyiciler: [string, () => void][]
}
const VAZO = -1

export function vazoXrKur(b: VazoXrBaglam): VazoXr {
  const { renderer, scene, camera, parcalar, hedefler } = b
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  // Rig ölçeği yüzünden sahne ölçüleri model birimi, rig içi (kumanda, ışın, baş) metredir.
  const rig = new THREE.Group()
  rig.scale.setScalar(METRE)

  const ortam = new THREE.Group()
  const zemin = new THREE.Mesh(new THREE.CircleGeometry(250, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1b2a23', roughness: 1 }))
  const ayak = new THREE.Mesh(new THREE.CylinderGeometry(9, 15, 1, 32).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: '#2c3d32', roughness: .95 }))
  ayak.position.y = TABLA_UST - 1.5
  ortam.add(zemin, ayak)

  const panel = durumPaneli()
  panel.nesne.position.set(0, 80, -40)
  const etiket = etiketPaneli()
  etiket.nesne.material.depthTest = false
  etiket.nesne.renderOrder = 1003
  etiket.nesne.frustumCulled = false
  etiket.nesne.position.set(0, -0.38, -1.2)

  const isinGeometri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -ISIN_BOY)])
  const isinMalzeme = new THREE.LineBasicMaterial({ color: '#f8f5ef', toneMapped: false })
  const elGeometri = new THREE.SphereGeometry(0.015, 12, 8)
  const elMalzeme = new THREE.MeshBasicMaterial({ color: '#f0e1bc', toneMapped: false })

  // Parçalar hedef duruşundayken alt paylar ve sınır küreleri ölçülür; merkez parçanın yerel başlangıcıdır.
  const kutu = new THREE.Box3()
  const altPaylari: number[] = []
  const yaricaplar: number[] = []
  const olc = () => {
    if (altPaylari.length) return
    parcalar.forEach((p, id) => {
      const konum = p.position.clone(), donus = p.quaternion.clone()
      p.position.copy(hedefler[id].position)
      p.quaternion.copy(hedefler[id].quaternion)
      p.updateWorldMatrix(true, true)
      kutu.setFromObject(p)
      altPaylari[id] = hedefler[id].position.y - kutu.min.y
      yaricaplar[id] = Math.max(kutu.max.x - kutu.min.x, kutu.max.y - kutu.min.y, kutu.max.z - kutu.min.z) / 2
      p.position.copy(konum)
      p.quaternion.copy(donus)
      p.updateWorldMatrix(true, true)
    })
  }

  // Bütün vazo tutulunca parçalar, izler ve alt yazı bu dayanakla birlikte gider.
  const dayanak = new THREE.Group()
  const dayanakEv = new THREE.Vector3(0, VAZO_MERKEZ_Y, 0)
  dayanak.position.copy(dayanakEv)
  let dayanakDolu = false, dayanakDonuyor = false

  let oturum: XRSession | null = null
  let basliyor = false, kapandi = false, yerlesti = false
  let cizilen = '', sonuc = ''

  const raycaster = new THREE.Raycaster()
  const m = new THREE.Matrix4(), konum = new THREE.Vector3(), donus = new THREE.Quaternion(), olcek = new THREE.Vector3()
  const yedek = { near: 0, far: 0 }

  const tutuluyor = (id: number) => eller.some((e) => e.tutulan === id)
  const adaylar = (): ParcaAdayi[] => {
    if (b.tamamMi()) return tutuluyor(VAZO) ? [] : [{ id: VAZO, merkez: dayanak.position.toArray(), yaricap: VAZO_YARICAP }]
    const liste: ParcaAdayi[] = []
    parcalar.forEach((p, id) => {
      if (b.serbestMi(id) && !tutuluyor(id)) liste.push({ id, merkez: p.position.toArray(), yaricap: yaricaplar[id] })
    })
    return liste
  }
  const isinKur = (el: El) => {
    el.kumanda.updateWorldMatrix(true, false, true)
    raycaster.setFromXRController(el.kumanda)
  }
  const elAdayi = (el: El) => {
    isinKur(el)
    return parcaSec(raycaster.ray.origin.toArray(), raycaster.ray.direction.toArray(), adaylar(), ISIN_BOY * METRE)
  }

  const dayanagaAl = () => {
    if (dayanakDolu) return
    dayanakDolu = true
    scene.add(dayanak)
    dayanak.updateWorldMatrix(true, false)
    for (const n of [...parcalar, ...b.butunNesneleri]) dayanak.attach(n)
  }
  const dayanaktanCikar = () => {
    if (!dayanakDolu) return
    dayanakDolu = false
    dayanakDonuyor = false
    dayanak.position.copy(dayanakEv)
    dayanak.quaternion.identity()
    dayanak.updateWorldMatrix(true, false)
    for (const n of [...parcalar, ...b.butunNesneleri]) scene.attach(n)
    parcalar.forEach((p, id) => { p.position.copy(hedefler[id].position); p.quaternion.copy(hedefler[id].quaternion) })
    for (const n of b.butunNesneleri) { n.position.set(0, 0, 0); n.quaternion.identity() }
    dayanak.removeFromParent()
  }

  const tut = (el: El, id: number) => {
    el.tutulan = id
    el.isin.visible = false
    el.kumanda.updateWorldMatrix(true, false, true)
    if (id === VAZO) {
      dayanagaAl()
      dayanakDonuyor = false
      el.kumanda.matrixWorld.decompose(konum, donus, olcek) // Dünya matrisi rig ölçeğini taşır
      donus.invert().multiply(dayanak.quaternion)
      el.ofset.compose(konum.set(0, 0, -VAZO_EL_UZAKLIK), donus, olcek.setScalar(1 / METRE))
      return
    }
    b.tutusBasladi(id)
    b.sec(id)
    parcalar[id].updateWorldMatrix(true, false)
    el.ofset.copy(el.kumanda.matrixWorld).invert().multiply(parcalar[id].matrixWorld)
  }

  const birak = (el: El) => {
    const id = el.tutulan
    el.tutulan = null
    el.isin.visible = true
    if (id === null) return
    if (id === VAZO) { dayanakDonuyor = true; return }
    const oturdu = yerineOturur(parcalar[id].position.distanceTo(hedefler[id].position), XR_OTURMA_ESIGI)
    b.birak(id, oturdu)
    sonuc = oturdu ? `Parça ${id + 1} yerine oturdu.` : 'Henüz yerine yaklaşmadı. Yeniden dene.'
    b.sec(null)
  }
  const tutusuKopar = (el: El) => {
    const id = el.tutulan
    el.tutulan = null
    el.isin.visible = true
    el.tetik = el.yan = false
    if (id === null) return
    if (id === VAZO) dayanakDonuyor = true
    else { b.tutusIptal(id); b.sec(null) }
  }

  const bitir = () => { oturum?.end().catch(() => {}) } // Zaten kapanmış oturumda end() reddeder

  const panelDene = (el: El) => {
    isinKur(el)
    panel.nesne.updateWorldMatrix(true, false)
    const isabet = raycaster.intersectObject(panel.nesne, false)[0]
    if (isabet?.uv && cikisDugmesineMi(isabet.uv.x, isabet.uv.y)) bitir()
  }

  const bas = (el: El, tur: 'tetik' | 'yan') => {
    if (!oturum || !yerlesti) return
    el[tur] = true
    if (el.tutulan !== null) return
    const id = elAdayi(el)
    if (id !== null) tut(el, id)
    else if (tur === 'tetik') panelDene(el)
  }
  const kaldir = (el: El, tur: 'tetik' | 'yan') => {
    el[tur] = false
    if (!el.tetik && !el.yan && el.tutulan !== null) birak(el)
  }

  const eller: El[] = [0, 1].map((i) => {
    const kumanda = xr.getController(i)
    const isin = new THREE.Line(isinGeometri, isinMalzeme)
    kumanda.add(isin, new THREE.Mesh(elGeometri, elMalzeme))
    rig.add(kumanda)
    const el: El = { kumanda, isin, tetik: false, yan: false, tutulan: null, ofset: new THREE.Matrix4(), dinleyiciler: [] }
    el.dinleyiciler = [
      ['selectstart', () => bas(el, 'tetik')], ['selectend', () => kaldir(el, 'tetik')],
      ['squeezestart', () => bas(el, 'yan')], ['squeezeend', () => kaldir(el, 'yan')],
      ['disconnected', () => tutusuKopar(el)],
    ]
    for (const [olay, f] of el.dinleyiciler) kumanda.addEventListener(olay as 'selectstart', f)
    return el
  })

  const gir = (yeni: XRSession) => {
    oturum = yeni
    olc()
    b.xrModu(true, xrRafDizilimi(altPaylari, TABLA_UST))
    yedek.near = camera.near
    yedek.far = camera.far
    // Near/far rig'in içindeki metreyle işler.
    camera.near = 0.05
    camera.far = 30
    rig.add(camera)
    camera.add(etiket.nesne)
    scene.add(rig, ortam, panel.nesne)
    cizilen = ''
    sonuc = ''
  }

  const geriAl = () => {
    for (const el of eller) tutusuKopar(el)
    dayanaktanCikar()
    etiket.nesne.removeFromParent()
    camera.removeFromParent()
    camera.scale.set(1, 1, 1) // Rig'den ayrışırken kalan yuvarlama hatası
    camera.near = yedek.near
    camera.far = yedek.far
    rig.removeFromParent()
    rig.position.set(0, 0, 0)
    rig.rotation.set(0, 0, 0)
    ortam.removeFromParent()
    panel.nesne.removeFromParent()
    oturum = null
    yerlesti = false
    b.vurgula([])
    b.xrModu(false)
  }
  const oturumBitince = () => {
    if (!oturum) return // Yarım kalan açılışın kapanışı: sahneye dokunulmamıştı
    geriAl()
    b.oturumBitti()
  }
  xr.addEventListener('sessionend', oturumBitince)

  const izle = (el: El) => {
    el.kumanda.updateWorldMatrix(true, false, true)
    m.multiplyMatrices(el.kumanda.matrixWorld, el.ofset).decompose(konum, donus, olcek)
    if (el.tutulan === VAZO) {
      dayanak.position.lerp(konum, 0.35)
      dayanak.quaternion.slerp(donus, 0.35)
    } else if (el.tutulan !== null) {
      parcalar[el.tutulan].position.copy(konum)
      parcalar[el.tutulan].quaternion.copy(donus)
    }
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
        if (yeni) {
          // setSession yarıda kaldıysa kapanış renderer boyutunu bozabilir.
          const geriYukle = () => {
            xr.removeEventListener('sessionend', geriYukle)
            if (kapandi) return
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
    kare: () => {
      if (!oturum) return
      if (!yerlesti) {
        // Baş pozu gelmeden vazonun önde olacağı yer bilinemez.
        const kare = xr.getFrame(), uzay = xr.getReferenceSpace()
        const poz = kare && uzay ? kare.getViewerPose(uzay) : null
        if (!poz) return
        const { position: p, orientation: q } = poz.transform
        const ileri = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w))
        const r = vazoRigi({ x: p.x, y: p.y, z: p.z, yaw: Math.atan2(-ileri.x, -ileri.z) })
        rig.position.set(r.x, r.y, r.z)
        rig.rotation.set(0, r.rotY, 0)
        // Ayak yerden tablaya uzanır; zemin rig yüksekliğine gelir.
        zemin.position.y = r.y
        ayak.scale.y = ayak.position.y - r.y
        rig.updateWorldMatrix(false, true)
        yerlesti = true
      }

      const vurgu: number[] = []
      for (const el of eller) {
        if (el.tutulan !== null) { izle(el); continue }
        if (!el.kumanda.visible) continue
        const id = elAdayi(el)
        if (id !== null && id !== VAZO) vurgu.push(id)
      }
      b.vurgula(vurgu)

      if (dayanakDonuyor) {
        dayanak.position.lerp(dayanakEv, 0.2)
        dayanak.quaternion.slerp(new THREE.Quaternion(), 0.2)
        if (dayanak.position.distanceTo(dayanakEv) < 0.05) {
          dayanak.position.copy(dayanakEv)
          dayanak.quaternion.identity()
          dayanakDonuyor = false
        }
      }

      const n = b.yerlesenSayisi(), imza = `${n}|${sonuc}`
      if (imza !== cizilen) { cizilen = imza; panel.ciz(n, sonuc) }
    },
    bitir,
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
      for (const el of eller) {
        for (const [olay, f] of el.dinleyiciler) el.kumanda.removeEventListener(olay as 'selectstart', f)
        el.kumanda.removeFromParent()
      }
      panel.dispose()
      etiket.dispose()
      for (const g of [zemin.geometry, ayak.geometry, isinGeometri, elGeometri]) g.dispose()
      for (const x of [zemin.material, ayak.material, isinMalzeme, elMalzeme]) x.dispose()
    },
  }
}
