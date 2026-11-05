// VR'da maket birleştirme: kavrama tuşuyla katmanı tut, yerine götür, oturt. Rig ve menü xrOturum'undur; burası yalnız katmanları taşır.
import * as THREE from 'three'
import { birakmaSonucu, birlesimMetni, katmanSec, rafDizilimi, tasinanYer, type BirakmaSonucu, type KatmanAdayi, type Kutu, type Uclu } from './maketBirlestirMantik'
import type { MaketKatmani } from './ulucamiMaket'
import { baslikPaneli, birlesimPaneli } from './xrPanel'

export interface BirlestirBaglam {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  katmanlar: MaketKatmani[]
  kumandalar: { kumanda: THREE.XRTargetRaySpace; isin: THREE.Line }[]
  golgeYenile: () => void
  /** Son katman da oturdu; katmanlar evindedir, menü normale dönebilir. */
  tamamlandi: () => void
}

export interface MaketBirlestir {
  /** Katmanları rafa dizer; oyun açıksa baştan başlatır. */
  basla: () => void
  /** Katmanlar eve döner, panel kalkar. Oyun kapalıysa katmanlara dokunmaz. */
  bitir: () => void
  /** Katmanlar oyunun elinde mi: sahnenin parçalama döngüsü ve rig çubuğu dokunmasın. */
  oyunda: () => boolean
  kare: (dt: number) => void
  temizle: () => void
}

interface El {
  kumanda: THREE.XRTargetRaySpace
  isin: THREE.Line
  tutulan: number | null
  /** Tuş bırakıldı, karar kare başında: kopan kumanda da önce tek başına squeezeend yollar, sonra `disconnected`. */
  birakilacak: boolean
  elBas: Uclu
  parcaBas: Uclu
  dinleyiciler: [string, () => void][]
}

const AD_OLCEK = 30, AD_YARIM = 18 // Rig içi metre panel; sahne biriminde 36 genişlik
const AD_RENK = '#c9d4cf', AD_ISIK = '#ffffff', AD_BUYUME = 1.12
const KUTU_RENK: Record<BirakmaSonucu, string> = { uzak: '#f0e1bc', sira: '#e0683c', oturdu: '#5fd08a' }
const OTURMA_HIZI = 12, DURMA_ESIGI = 0.05
const TAMAM_SURE = 4 // sn; tamamlandı mesajı kendiliğinden kalkar

export function maketBirlestirKur(b: BirlestirBaglam): MaketBirlestir {
  const { scene, camera, katmanlar } = b
  const adlar = katmanlar.map((k) => k.ad)
  const raycaster = new THREE.Raycaster()
  const yer = new THREE.Vector3()

  const panel = birlesimPaneli()
  panel.nesne.material.transparent = true
  panel.nesne.material.depthTest = false
  panel.nesne.material.depthWrite = false
  panel.nesne.renderOrder = 1003
  panel.nesne.frustumCulled = false
  panel.nesne.position.set(0, -0.295, -1.2)

  const adPanelleri = adlar.map((ad) => baslikPaneli(ad))

  // Tutulan katmanın evini gösterir: renk, bırakılsa ne olacağını söyler.
  const kutuGeometri = new THREE.BoxGeometry(1, 1, 1)
  const hedefGeometri = new THREE.EdgesGeometry(kutuGeometri)
  kutuGeometri.dispose()
  const hedefMalzeme = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
  const hedefKutu = new THREE.LineSegments(hedefGeometri, hedefMalzeme)
  hedefKutu.renderOrder = 999
  hedefKutu.visible = false

  let oyun = false, bitiyor = false
  let oturan = 0, tamamKalan = 0
  let kutular: Kutu[] = [], merkezler: Uclu[] = [], yaricaplar: number[] = [], raflar: Uclu[] = []
  /** Eline değil, kendi yerine süzülen katmanlar. */
  const suzulen = new Map<number, THREE.Vector3>()

  const olc = () => {
    if (kutular.length) return
    const kutu = new THREE.Box3()
    kutular = katmanlar.map(({ grup }) => {
      // Parçalanmış bırakılmış olabilir: ev ölçüsü konumdan bağımsız.
      kutu.setFromObject(grup).translate(yer.copy(grup.position).negate())
      return { min: kutu.min.toArray(), max: kutu.max.toArray() }
    })
    merkezler = kutular.map(({ min, max }) => [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2])
    yaricaplar = kutular.map(({ min, max }) => Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2)
    raflar = rafDizilimi(kutular)
    adPanelleri.forEach(({ nesne }, id) => {
      // Rafta kullanıcıya bakan kenarın makete yakın ucunda, görüşe en yakın yerde. Rig başlangıç açısında kullanıcı -z yönündedir.
      nesne.position.set(kutular[id].max[0] - AD_YARIM, merkezler[id][1], kutular[id].min[2] - 2)
      nesne.rotation.y = Math.PI
      nesne.scale.setScalar(AD_OLCEK)
    })
  }

  const elYeri = (el: El): Uclu => {
    el.kumanda.updateWorldMatrix(true, false, true) // matrixAutoUpdate kapalı; zorlanmazsa rig değişimi yansımaz
    return yer.setFromMatrixPosition(el.kumanda.matrixWorld).toArray()
  }
  const tutuluyor = (id: number) => eller.some((e) => e.tutulan === id)
  const adaylar = (): KatmanAdayi[] => {
    const liste: KatmanAdayi[] = []
    katmanlar.forEach(({ grup }, id) => {
      if (id < oturan || tutuluyor(id)) return // Oturanlar artık tutulmaz
      const p = grup.position, m = merkezler[id]
      liste.push({ id, merkez: [m[0] + p.x, m[1] + p.y, m[2] + p.z], yaricap: yaricaplar[id] })
    })
    return liste
  }
  const elAdayi = (el: El) => {
    el.kumanda.updateWorldMatrix(true, false, true)
    raycaster.setFromXRController(el.kumanda)
    return katmanSec(raycaster.ray.origin.toArray(), raycaster.ray.direction.toArray(), adaylar())
  }

  const ciz = (son?: { sonuc: BirakmaSonucu; id: number }) => panel.ciz(birlesimMetni(oturan, adlar, son))

  const birakEl = (el: El) => {
    el.tutulan = null
    el.birakilacak = false
    el.isin.visible = true
    if (eller.every((e) => e.tutulan === null)) hedefKutu.visible = false
  }
  const rafa = (id: number) => suzulen.set(id, new THREE.Vector3(...raflar[id]))

  const bas = (el: El) => {
    if (!oyun || bitiyor) return
    el.birakilacak = false
    if (el.tutulan !== null) return
    const id = elAdayi(el)
    if (id === null) return
    suzulen.delete(id)
    el.tutulan = id
    el.isin.visible = false
    el.elBas = elYeri(el)
    el.parcaBas = katmanlar[id].grup.position.toArray()
    const { min, max } = kutular[id]
    hedefKutu.position.set(merkezler[id][0], merkezler[id][1], merkezler[id][2])
    hedefKutu.scale.set(max[0] - min[0], max[1] - min[1], max[2] - min[2])
    hedefKutu.userData.id = id
    hedefKutu.visible = true
  }
  const kaldir = (el: El) => {
    if (el.tutulan !== null) el.birakilacak = true
  }
  const birak = (el: El) => {
    const id = el.tutulan
    if (id === null) return
    birakEl(el)
    const sonuc = birakmaSonucu(id, oturan, katmanlar[id].grup.position.length())
    if (sonuc === 'oturdu') {
      oturan++
      suzulen.set(id, new THREE.Vector3())
      adPanelleri[id].nesne.visible = false
      if (oturan >= katmanlar.length) bitiyor = true
    } else {
      rafa(id)
    }
    ciz({ sonuc, id })
  }
  /** Oyun denemesi saymadan rafa döndürür: kumanda koptu. */
  const tutusuKopar = (el: El) => {
    const id = el.tutulan
    birakEl(el)
    if (id !== null) rafa(id)
  }

  const eller: El[] = b.kumandalar.map(({ kumanda, isin }) => {
    const el: El = { kumanda, isin, tutulan: null, birakilacak: false, elBas: [0, 0, 0], parcaBas: [0, 0, 0], dinleyiciler: [] }
    el.dinleyiciler = [['squeezestart', () => bas(el)], ['squeezeend', () => kaldir(el)], ['disconnected', () => tutusuKopar(el)]]
    for (const [olay, f] of el.dinleyiciler) kumanda.addEventListener(olay as 'squeezestart', f)
    return el
  })

  const adlariKaldir = () => adPanelleri.forEach(({ nesne }) => nesne.removeFromParent())
  const oyunuKapat = () => {
    oyun = false
    bitiyor = false
    suzulen.clear()
    for (const el of eller) birakEl(el)
    hedefKutu.removeFromParent()
    adlariKaldir()
    b.golgeYenile()
  }

  const bitir = () => {
    tamamKalan = 0
    panel.nesne.removeFromParent()
    if (!oyun) return
    oyunuKapat()
    katmanlar.forEach(({ grup }) => grup.position.set(0, 0, 0))
  }

  return {
    basla: () => {
      olc()
      tamamKalan = 0
      oyun = true
      bitiyor = false
      oturan = 0
      suzulen.clear()
      for (const el of eller) birakEl(el)
      katmanlar.forEach(({ grup }, id) => {
        grup.position.set(...raflar[id])
        adPanelleri[id].nesne.visible = true
        adPanelleri[id].nesne.material.color.set(AD_RENK)
        grup.add(adPanelleri[id].nesne)
      })
      scene.add(hedefKutu)
      camera.add(panel.nesne)
      ciz()
      b.golgeYenile()
    },
    bitir,
    oyunda: () => oyun,
    kare: (dt) => {
      if (tamamKalan > 0) {
        tamamKalan -= dt
        if (tamamKalan <= 0) panel.nesne.removeFromParent()
      }
      if (!oyun) return
      for (const el of eller) if (el.birakilacak) birak(el)

      const nisan = new Set<number>()
      for (const el of eller) {
        if (el.tutulan !== null) {
          const y = tasinanYer(el.parcaBas, el.elBas, elYeri(el))
          katmanlar[el.tutulan].grup.position.set(...y)
          if (hedefKutu.userData.id === el.tutulan) hedefMalzeme.color.set(KUTU_RENK[birakmaSonucu(el.tutulan, oturan, Math.hypot(...y))])
        } else if (el.kumanda.visible) {
          const id = elAdayi(el)
          if (id !== null) nisan.add(id)
        }
      }
      adPanelleri.forEach(({ nesne }, id) => {
        const parlak = nisan.has(id)
        nesne.material.color.set(parlak ? AD_ISIK : AD_RENK)
        nesne.scale.setScalar(parlak ? AD_OLCEK * AD_BUYUME : AD_OLCEK)
      })

      const oran = 1 - Math.exp(-dt * OTURMA_HIZI)
      for (const [id, hedef] of suzulen) {
        const { position: p } = katmanlar[id].grup
        p.lerp(hedef, oran)
        if (p.distanceTo(hedef) < DURMA_ESIGI) {
          p.copy(hedef)
          suzulen.delete(id)
          b.golgeYenile()
        }
      }

      if (bitiyor && !suzulen.size) {
        oyunuKapat()
        tamamKalan = TAMAM_SURE
        b.tamamlandi()
      }
    },
    temizle: () => {
      bitir()
      for (const el of eller) {
        for (const [olay, f] of el.dinleyiciler) el.kumanda.removeEventListener(olay as 'squeezestart', f)
      }
      panel.dispose()
      adPanelleri.forEach((p) => p.dispose())
      hedefGeometri.dispose()
      hedefMalzeme.dispose()
    },
  }
}
