// Çini panosu bulmacası VR'da. Oturum başına kurulur, kapanınca hepsi atılır: sayfadaki masaüstü bulmacasına yalnız `bitti` üzerinden dokunur.
// Bu dosya three'ye bağlıdır; eser sayfası ağırlaşmasın diye dinamik içe aktarılır.
import * as THREE from 'three'
import { durumPaneli, panelDugmesi, parcaSec, type ParcaAdayi } from '../maket/vazoXr'
import { bilgiPaneli } from '../maket/xrPanel'
import {
  DURUM_DUGMELERI, PANO_GENISLIK, PANO_Y, PANO_Z, TEPSI_OLCEK,
  donusAcisi, dondur, durumMetni, enYakinYuva, hucreOlcusu, karistir, panoIzdusumu, parcaUv, tamamMi, tepsiKonumu, yonler, yuvaMerkezi, yuvayaKoy,
  type Nokta, type Parca,
} from './kurallar'

export interface RestorasyonXrSecenek {
  gorsel: string; sutun: number; satir: number
  /** Masaüstündeki "İpucu görüntüsü" seçimi. */
  ipucu: boolean
  metin: string; kaynak: string; not: string
  /** Sürmekte olan masaüstü onarımı; yoksa veya bittiyse yeni pano karılır. */
  parcalar: Parca[] | null
  hamle: number
  rozetKazan: () => void
  /** Oturum kapandı. Hiç hamle yapılmadıysa `null`. */
  bitti: (son: { parcalar: Parca[]; hamle: number } | null) => void
}
export interface RestorasyonXr { kapat: () => void }

interface El {
  kumanda: THREE.XRTargetRaySpace
  isin: THREE.Line
  tutulan: number | null
  /** Parçanın kumanda yerelindeki yeri: ışınla uzaktan tutulan da bilekle yönlendirilir. */
  ofset: THREE.Vector3
  /** Tuş bırakıldı, karar kare başında: kopan kumanda da önce squeezeend yollar, sonra `disconnected`. */
  birakilacak: boolean
  dinleyiciler: [string, () => void][]
}

const ISIN_BOY = 1.5
const PANEL_G = 0.7, PANEL_UZAK = 1, PANEL_ACI = (55 * Math.PI) / 180
const YUVA_PAY = 0.006, VURGU_PAY = 0.008 // Pano yüzeyinden öne, z çakışmasın
const ARKA = '#1b2a23', CERCEVE = '#8e6236', CIZGI = '#e9efe5', VURGU = '#f2c14e'

export async function restorasyonXrAc(oturum: XRSession, s: RestorasyonXrSecenek): Promise<RestorasyonXr> {
  const { sutun, satir } = s
  const adet = sutun * satir
  let bitmis = false
  oturum.addEventListener('end', () => { bitmis = true }, { once: true })

  const doku = await new THREE.TextureLoader().loadAsync(s.gorsel)
  doku.colorSpace = THREE.SRGBColorSpace
  doku.anisotropy = 8
  const oran = doku.image.width / doku.image.height
  const { en, boy } = hucreOlcusu(sutun, satir, oran)
  const panoBoy = PANO_GENISLIK / oran

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local-floor')

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(ARKA)
  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 50)

  // Her şey cihaz metresi. `alan` başın ilk pozuna oturur; içindeki ölçüler kurallar.ts'den.
  const alan = new THREE.Group()
  alan.visible = false
  const zemin = new THREE.Mesh(new THREE.CircleGeometry(6, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2c3d32' }))
  scene.add(alan, zemin)

  const cerceve = new THREE.Mesh(new THREE.PlaneGeometry(PANO_GENISLIK + 0.06, panoBoy + 0.06), new THREE.MeshBasicMaterial({ color: CERCEVE, toneMapped: false }))
  cerceve.position.set(0, PANO_Y, PANO_Z - 0.002)
  // Masaüstü gibi: ipucu görüntüsü koyulaştırılmış, kapalıysa düz zemin.
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(PANO_GENISLIK, panoBoy), new THREE.MeshBasicMaterial({ color: s.ipucu ? '#4a4f4c' : '#213c35', map: s.ipucu ? doku : null, toneMapped: false }))
  pano.position.set(0, PANO_Y, PANO_Z)
  const cizgiNoktalari: number[] = []
  for (let i = 0; i <= sutun; i++) { const x = -PANO_GENISLIK / 2 + i * en; cizgiNoktalari.push(x, -panoBoy / 2, 0, x, panoBoy / 2, 0) }
  for (let i = 0; i <= satir; i++) { const y = -panoBoy / 2 + i * boy; cizgiNoktalari.push(-PANO_GENISLIK / 2, y, 0, PANO_GENISLIK / 2, y, 0) }
  const cizgiler = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(cizgiNoktalari, 3)), new THREE.LineBasicMaterial({ color: CIZGI, toneMapped: false }))
  cizgiler.position.set(0, PANO_Y, PANO_Z + 0.001)
  alan.add(cerceve, pano, cizgiler)

  const parcaGeometri = (id: number) => {
    const g = new THREE.PlaneGeometry(en, boy), { u0, u1, v0, v1 } = parcaUv(id, sutun, satir)
    g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2))
    return g
  }
  const secimMalzeme = new THREE.MeshBasicMaterial({ color: VURGU, toneMapped: false })
  const secimGeometri = new THREE.PlaneGeometry(en * 1.1, boy * 1.1)
  const secimler: THREE.Mesh[] = []
  const meshler = Array.from({ length: adet }, (_, id) => {
    const m = new THREE.Mesh(parcaGeometri(id), new THREE.MeshBasicMaterial({ map: doku, toneMapped: false }))
    const secim = new THREE.Mesh(secimGeometri, secimMalzeme)
    secim.position.z = -0.001
    secim.visible = false
    m.add(secim)
    secimler[id] = secim
    alan.add(m)
    return m
  })

  const hedefVurgular = [0, 1].map(() => {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(en, boy), new THREE.MeshBasicMaterial({ color: VURGU, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }))
    v.visible = false
    alan.add(v)
    return v
  })

  // Bilgi solda, okumak için dönülür. Durum ve düğmeler panonun üstünde, başa eğik: ilk bakışta görünsün.
  const bilgi = bilgiPaneli()
  bilgi.goster({ baslik: 'Restorasyon görevi', metin: s.metin, kaynak: `${s.kaynak} · ${s.not}` })
  bilgi.nesne.scale.setScalar(PANEL_G)
  bilgi.nesne.position.set(-Math.sin(PANEL_ACI) * PANEL_UZAK, PANO_Y, -Math.cos(PANEL_ACI) * PANEL_UZAK)
  bilgi.nesne.rotation.y = PANEL_ACI
  const durum = durumPaneli(PANEL_G)
  const durumY = PANO_Y + panoBoy / 2 + PANEL_G / 4 + 0.06
  durum.nesne.position.set(0, durumY, PANO_Z)
  durum.nesne.rotation.x = Math.atan2(durumY, -PANO_Z)
  alan.add(bilgi.nesne, durum.nesne)

  // ---------- Oyun ----------
  const devam = s.parcalar && !tamamMi(s.parcalar) ? s.parcalar : null
  let parcalar = devam ?? karistir(adet)
  let hamle = devam ? s.hamle : 0
  let bitis = false, degisti = false, yerlesti = false, kapandi = false
  let sonuc = '', cizilen = ''

  const raycaster = new THREE.Raycaster()
  const v = new THREE.Vector3()

  const dizil = () => {
    parcalar.forEach((p, sira) => {
      const m = meshler[p.id]
      m.rotation.z = donusAcisi(p.donus)
      if (eller.some((e) => e.tutulan === p.id)) return
      if (p.yuva === null) {
        m.position.set(...tepsiKonumu(sira, sutun, satir, oran))
        m.scale.setScalar(TEPSI_OLCEK)
      } else {
        const [x, y] = yuvaMerkezi(p.yuva, sutun, satir, oran)
        m.position.set(x, y, PANO_Z + YUVA_PAY)
        m.scale.setScalar(1)
      }
    })
  }
  const yerel = (nesne: THREE.Object3D): Nokta => {
    alan.updateWorldMatrix(true, false)
    return alan.worldToLocal(nesne.getWorldPosition(v)).toArray() as Nokta
  }
  /** Tutulan parça bırakılsa oturacağı yuva. */
  const hedefYuva = (id: number) => {
    const iz = panoIzdusumu(yerel(camera), meshler[id].position.toArray() as Nokta)
    return iz && enYakinYuva(iz[0], iz[1], sutun, satir, oran)
  }

  const bitisDenetle = () => {
    if (bitis || !tamamMi(parcalar) || eller.some((e) => e.tutulan !== null)) return
    bitis = true
    s.rozetKazan()
  }
  const birak = (el: El) => {
    const id = el.tutulan
    el.birakilacak = false
    if (id === null) return
    const yuva = hedefYuva(id)
    el.tutulan = null
    el.isin.visible = true
    if (yuva !== null) {
      parcalar = yuvayaKoy(parcalar, id, yuva)
      hamle++
      degisti = true
      sonuc = `Parça ${yuva + 1}. yuvaya yerleştirildi.`
    } else sonuc = 'Panoya yaklaştırıp bırak.'
    dizil()
    bitisDenetle()
  }
  /** Oyun hamlesi saymadan eski yerine döndürür (kumanda koptu, oturum kapandı, pano yeniden karıldı). */
  const tutusuKopar = (el: El) => {
    el.birakilacak = false
    el.isin.visible = true
    if (el.tutulan === null) return
    el.tutulan = null
    dizil()
    bitisDenetle()
  }

  const elAdayi = (el: El) => {
    isinKur(el)
    if (bitis) return null
    const liste: ParcaAdayi[] = []
    for (const { id } of parcalar) {
      if (eller.some((e) => e.tutulan === id)) continue
      const m = meshler[id]
      liste.push({ id, merkez: m.getWorldPosition(v).toArray(), yaricap: (Math.max(en, boy) / 2) * 1.15 * m.scale.x })
    }
    return parcaSec(raycaster.ray.origin.toArray(), raycaster.ray.direction.toArray(), liste, ISIN_BOY)
  }
  const isinKur = (el: El) => {
    el.kumanda.updateWorldMatrix(true, false)
    raycaster.setFromXRController(el.kumanda)
  }
  const panelNisani = (el: El) => {
    isinKur(el)
    durum.nesne.updateWorldMatrix(true, false)
    const isabet = raycaster.intersectObject(durum.nesne, false)[0]
    return isabet?.uv ? panelDugmesi(isabet.uv.x, isabet.uv.y) : null
  }

  const kapat = () => { oturum.end().catch(() => {}) } // Zaten kapanmış oturumda end() reddeder

  const yenidenKar = () => {
    for (const el of eller) tutusuKopar(el)
    parcalar = karistir(adet)
    hamle = 0
    bitis = false
    degisti = true
    sonuc = ''
    dizil()
  }

  const yanBasti = (el: El) => {
    el.birakilacak = false
    if (!yerlesti || el.tutulan !== null) return
    const id = elAdayi(el)
    if (id === null) return
    el.tutulan = id
    el.isin.visible = false
    sonuc = ''
    const m = meshler[id]
    el.ofset.copy(el.kumanda.worldToLocal(m.getWorldPosition(v)))
    m.scale.setScalar(1)
  }
  const tetikBasti = (el: El) => {
    if (!yerlesti) return
    if (el.tutulan !== null) {
      parcalar = dondur(parcalar, el.tutulan)
      hamle++
      degisti = true
      const id = el.tutulan
      sonuc = `Parça döndürüldü: ${yonler[parcalar.find((p) => p.id === id)!.donus]}.`
      dizil()
      return
    }
    const dugme = panelNisani(el)
    if (dugme !== null) {
      if (DURUM_DUGMELERI[dugme].id === 'cik') kapat()
      else yenidenKar()
      return
    }
    if (elAdayi(el) !== null) sonuc = 'Parçayı tutmak için yan tuşa (kavrama) bas.'
  }

  const isinGeometri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -ISIN_BOY)])
  const isinMalzeme = new THREE.LineBasicMaterial({ color: '#f8f5ef', toneMapped: false })
  const elGeometri = new THREE.SphereGeometry(0.015, 12, 8)
  const elMalzeme = new THREE.MeshBasicMaterial({ color: '#f0e1bc', toneMapped: false })
  const eller: El[] = [0, 1].map((i) => {
    const kumanda = renderer.xr.getController(i)
    const isin = new THREE.Line(isinGeometri, isinMalzeme)
    kumanda.add(isin, new THREE.Mesh(elGeometri, elMalzeme))
    scene.add(kumanda)
    const el: El = { kumanda, isin, tutulan: null, ofset: new THREE.Vector3(), birakilacak: false, dinleyiciler: [] }
    el.dinleyiciler = [
      ['squeezestart', () => yanBasti(el)], ['squeezeend', () => { if (el.tutulan !== null) el.birakilacak = true }],
      ['selectstart', () => tetikBasti(el)],
      ['disconnected', () => tutusuKopar(el)],
    ]
    for (const [olay, f] of el.dinleyiciler) kumanda.addEventListener(olay as 'selectstart', f)
    return el
  })
  dizil()

  const temizle = () => {
    if (kapandi) return
    kapandi = true
    renderer.setAnimationLoop(null)
    renderer.xr.removeEventListener('sessionend', oturumBitti)
    for (const el of eller) for (const [olay, f] of el.dinleyiciler) el.kumanda.removeEventListener(olay as 'selectstart', f)
    scene.traverse((n) => {
      const nesne = n as THREE.Mesh
      nesne.geometry?.dispose()
      ;(nesne.material as THREE.Material | undefined)?.dispose()
    })
    bilgi.dispose()
    durum.dispose()
    doku.dispose()
    renderer.dispose()
  }
  const oturumBitti = () => {
    temizle()
    s.bitti(degisti ? { parcalar, hamle } : null)
  }

  const yerles = () => {
    // Baş pozu gelmeden önün neresi olduğu bilinemez.
    const kare = renderer.xr.getFrame(), uzay = renderer.xr.getReferenceSpace()
    const poz = kare && uzay ? kare.getViewerPose(uzay) : null
    if (!poz) return
    const { position: p, orientation: q } = poz.transform
    const ileri = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w))
    alan.position.set(p.x, p.y, p.z)
    alan.rotation.y = Math.atan2(-ileri.x, -ileri.z)
    alan.updateWorldMatrix(true, true)
    zemin.position.set(p.x, 0, p.z)
    alan.visible = true
    yerlesti = true
  }

  const kare = () => {
    if (!yerlesti) yerles()
    for (const el of eller) if (el.birakilacak) birak(el)

    for (const secim of secimler) secim.visible = false
    let uzerinde: number | null = null
    eller.forEach((el, i) => {
      const vurgu = hedefVurgular[i]
      vurgu.visible = false
      if (el.tutulan !== null) {
        const m = meshler[el.tutulan]
        el.kumanda.updateWorldMatrix(true, false)
        alan.updateWorldMatrix(true, false)
        m.position.copy(alan.worldToLocal(el.kumanda.localToWorld(v.copy(el.ofset))))
        secimler[el.tutulan].visible = true
        const yuva = hedefYuva(el.tutulan)
        if (yuva !== null) {
          const [x, y] = yuvaMerkezi(yuva, sutun, satir, oran)
          vurgu.position.set(x, y, PANO_Z + VURGU_PAY)
          vurgu.visible = true
        }
        return
      }
      if (!yerlesti || !el.kumanda.visible) return
      const dugme = panelNisani(el)
      if (dugme !== null) { uzerinde = dugme; return }
      const id = elAdayi(el)
      if (id !== null) secimler[id].visible = true
    })

    const yazi = durumMetni({ parcalar, hamle, tutuyor: eller.some((e) => e.tutulan !== null), sonuc })
    const imza = JSON.stringify([yazi, uzerinde])
    if (imza !== cizilen) { cizilen = imza; durum.ciz(yazi, uzerinde) }

    renderer.render(scene, camera)
  }

  try {
    await renderer.xr.setSession(oturum)
    if (bitmis) throw new Error('VR oturumu açılırken kapandı')
  } catch (hata) {
    temizle()
    throw hata
  }
  renderer.xr.addEventListener('sessionend', oturumBitti)
  renderer.xr.setFoveation(1)
  renderer.setAnimationLoop(kare)
  return { kapat }
}
