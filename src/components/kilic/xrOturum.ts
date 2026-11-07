// Kılıç atölyesi VR oturumu: rig, kumandalar, paneller. Oyun kurallarına yalnız KilicKopru üzerinden dokunur.
import * as T from 'three'
import { kumandaGirdisi, oluBolge } from '../maket/xrHareket'
import type { Oyun } from './durum'
import { parcalar } from './durum'
import type { Komut } from './sahne'
import { bilgiPaneli, BILGI_Y, kontrolPaneli, PANEL_METRE } from './xrPanel'
import { bileAdim, bilgiDurumu, CekicOlcer, duzlemX, istasyon, istasyonRig, panelDurumu, panelGeriGelsin, PANEL_G, PANEL_Y, PARCA_DOKUNMA, parcaOturur, SavurmaOlcer, savurmaKesimi } from './xrHesap'
import type { Kare, Kutu } from './xrHesap'

export type TutAd = 'koruk' | 'su' | 'bile'
export interface KilicKopru {
  oyun: () => Oyun; reheat: () => boolean
  komut: (ad: Komut) => void; tut: (ad: TutAd, v: boolean) => void
  bolgeSec: (i: number) => void; hedefSec: (i: number) => void; dondur: (a: number) => void
  bolgeBul: (ray: T.Ray) => number | null; bolgeNoktasi: (i: number, h: T.Vector3) => T.Vector3
  nesneNoktasi: (ad: 'yumurta' | 'koruk' | string, h: T.Vector3) => T.Vector3; hedefNoktasi: (i: number) => T.Vector3
  hedefKutu: (i: number) => Kutu; bileU: () => number; bileSur: (u: number) => void; tasZ: number
  kes: (k: { a: T.Vector3; b: T.Vector3; dx: number; dy: number; sure: number }) => void; izEkle: () => void; kesimSuruyor: () => boolean
  kilicKonum: (p: T.Vector3, q: T.Quaternion) => void
  /** Kuşanma: parçanın dünya matrisi, elde taşınması (null bırakır), kılıçtaki yeri, yerine uzaklığı ve oturtma. */
  parcaMatris: (ad: string) => T.Matrix4; parcaTasi: (ad: string, m: T.Matrix4 | null) => void
  parcaYeri: (ad: string, h: T.Vector3) => T.Vector3; parcaUzaklik: (ad: string) => number; parcaOturt: () => void
  zemin: (gorunur: boolean) => void
  /** Sahne kamera, gölge, efekt ve boyutu geri alır. */
  oturumBasladi: () => void; oturumBitti: () => void
  damga: (ad: string, deger: string) => void
}

const ISIN_BOY = 3, PANEL_UZAK = 1.25, PANEL_ALT = .12, CIZIM_ARALIK = .4
const YAKIN = { yumurta: .25, koruk: .5, su: .35, parca: .22, bolge: .16, hedef: .6 }
// Kabza ortası (kılıç yerel x = -.11) avuca oturur; namlu kumandanın önüne uzanır.
const KABZA = .11, NAMLU_ORTA = .6 + KABZA
const elTaban = (sol: boolean) => new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(
  new T.Vector3(0, 0, -1), new T.Vector3(0, sol ? -1 : 1, 0), new T.Vector3(sol ? -1 : 1, 0, 0)))
const EL_SAG = elTaban(false), EL_SOL = elTaban(true)

interface El {
  kumanda: T.XRTargetRaySpace; tutamak: T.XRGripSpace; isin: T.Line; nokta: T.Mesh
  kaynak: XRInputSource | null; tutulan: TutAd | null; bileX: number | null
  cekic: CekicOlcer; tetik: boolean; yan: boolean; birakilacak: boolean; ofset: T.Matrix4; olaylar: [string, (e: { data?: XRInputSource }) => void][]
}

export function xrOturumuKur(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera, k: KilicKopru) {
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  const rig = new T.Group()
  const panel = new T.Group(); rig.add(panel)
  const kontrol = kontrolPaneli(), bilgi = bilgiPaneli()
  const kontrolY = PANEL_METRE * PANEL_Y / PANEL_G, bilgiY = PANEL_METRE * BILGI_Y / PANEL_G
  kontrol.nesne.position.y = -bilgiY / 2; kontrol.nesne.renderOrder = 1000
  bilgi.nesne.position.y = kontrolY / 2 + .006; bilgi.nesne.renderOrder = 1000
  panel.add(kontrol.nesne, bilgi.nesne)
  // Işının üstündeki düğme: doku yeniden yüklenmesin diye ayrı saydam düzlem.
  const vurguMalzeme = new T.MeshBasicMaterial({ color: '#d6b183', transparent: true, opacity: .28, depthTest: false, depthWrite: false, toneMapped: false, fog: false })
  const vurgu = new T.Mesh(new T.PlaneGeometry(1, 1), vurguMalzeme); vurgu.renderOrder = 1001; vurgu.visible = false; kontrol.nesne.add(vurgu)

  const isinGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)])
  const isinMat = new T.LineBasicMaterial({ color: '#f6d6ad', transparent: true, opacity: .8, depthTest: false, depthWrite: false, toneMapped: false, fog: false })
  const noktaGeo = new T.SphereGeometry(.008, 8, 6), noktaMat = new T.MeshBasicMaterial({ color: '#fff2cf', depthTest: false, depthWrite: false, transparent: true, toneMapped: false, fog: false })
  const elGeo = new T.CylinderGeometry(.018, .024, .11, 10).rotateX(Math.PI / 2), elMat = new T.MeshStandardMaterial({ color: '#2a2f30', roughness: .7 })
  // Sıradaki hedefi gösteren küçük ışık; ince namluda ve küçük parçada gözle bulmayı kolaylaştırır.
  const isaretMat = new T.MeshBasicMaterial({ color: '#ffb35c', transparent: true, opacity: .9, depthTest: false, depthWrite: false, toneMapped: false, fog: false })
  const isaret = new T.Mesh(new T.SphereGeometry(.022, 12, 8), isaretMat); isaret.renderOrder = 990; isaret.visible = false; rig.add(isaret)

  const raycaster = new T.Raycaster()
  let oturum: XRSession | null = null, basliyor = false, pozHazir = false
  let not: number | null = null, yerlesBekliyor = true, panelYaw = 0, uzakSure = 0, cizimSure = 0, cizimAnahtar = '', bilgiAnahtar = '', aktif: El | null = null, stickDon = 0
  const savurma = new SavurmaOlcer()
  let parcaEl: El | null = null, parcaAd = ''
  const parcaM = new T.Matrix4()
  const tmp = new T.Vector3(), tmp2 = new T.Vector3(), tmpQ = new T.Quaternion(), yon = new T.Vector3(), basQ = new T.Euler(0, 0, 0, 'YXZ')

  const titret = (el: El | null, guc: number, ms: number) => {
    // Quest'te hapticActuators[0].pulse; tarayıcıda yoksa sessiz geçilir.
    const g = el?.kaynak?.gamepad as (Gamepad & { hapticActuators?: { pulse?: (g: number, ms: number) => Promise<boolean> }[] }) | undefined
    try { void g?.hapticActuators?.[0]?.pulse?.(guc, ms)?.catch?.(() => {}) } catch { /* desteklenmiyor */ }
  }
  const kilicEli = () => eller.find(e => e.kaynak?.handedness === 'right') ?? eller.find(e => e.kaynak)
  const eldeMi = () => k.oyun().asama === 7 && !k.oyun().usta
  // İki kumanda varken kılıç eli panel seçmez: savururken yanlışlıkla düğmeye basılmaz.
  const kilicEliMi = (el: El) => eldeMi() && el === kilicEli() && eller.filter(e => e.kaynak).length > 1

  const basYaw = () => { basQ.setFromQuaternion(xr.getCamera().quaternion); return basQ.y }
  const panelYerles = (offset = istasyon(k.oyun()).panel) => {
    const bas = xr.getCamera(), yaw = basYaw() + offset
    panel.position.set(bas.position.x - Math.sin(yaw) * PANEL_UZAK, bas.position.y - PANEL_ALT, bas.position.z - Math.cos(yaw) * PANEL_UZAK)
    panel.rotation.set(0, yaw, 0); panelYaw = yaw; uzakSure = 0; dugmeDamga()
  }
  const yerles = () => {
    const bas = xr.getCamera(), d = k.oyun(), r = istasyonRig(istasyon(d), { x: bas.position.x, y: bas.position.y, z: bas.position.z, yaw: basYaw() })
    rig.position.set(r.x, r.y, r.z); rig.rotation.set(0, r.rotY, 0)
    k.zemin(d.asama === 6)
    eller.forEach(el => el.cekic.sifirla())
    panelYerles(); yerlesBekliyor = false
  }
  // Masaüstünde ekran koordinatları data-* ile veriliyor; VR testi de düğmeleri buradan bulur.
  const dugmeDamga = () => {
    rig.updateWorldMatrix(true, true)
    k.damga('xrDugmeler', JSON.stringify(kontrol.kareler().map(q => {
      const p = kontrol.nesne.localToWorld(kareYerel(q, tmp2))
      return { id: q.id, pasif: !!q.dugme.pasif, p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)] }
    })))
    k.damga('xrRig', JSON.stringify([+rig.position.x.toFixed(3), +rig.position.y.toFixed(3), +rig.position.z.toFixed(3), +rig.rotation.y.toFixed(4)]))
  }
  const kareYerel = (q: Kare, h: T.Vector3) => h.set(((q.x + q.g / 2) / PANEL_G - .5) * PANEL_METRE, (.5 - (q.y + q.y2) / 2 / PANEL_Y) * kontrolY, .001)

  const panelCiz = (zorla = false) => {
    const d = k.oyun(), p = panelDurumu(d, { reheat: k.reheat(), not }), anahtar = JSON.stringify(p)
    if (zorla || anahtar !== cizimAnahtar) { cizimAnahtar = anahtar; kontrol.ciz(p); dugmeDamga() }
    const b = bilgiDurumu(d.asama, not)
    if (zorla || b.metin !== bilgiAnahtar) { bilgiAnahtar = b.metin; bilgi.ciz(b); k.damga('xrBilgi', `${b.baslik}|${b.kaynak}|${b.durustluk.length}`) }
  }

  const eylem = (id: string, el: El) => {
    if (id === 'cik') return bitir()
    const [tur, deger] = id.split(':')
    if (tur === 'komut') { k.komut(deger as Komut); if (deger === 'bastan') not = null; if (deger === 'tak') titret(el, .4, 40) }
    else if (tur === 'tut') { el.tutulan = deger as TutAd; k.tut(el.tutulan, true) }
    else if (tur === 'bolge') k.bolgeSec(Number(deger))
    else if (tur === 'hedef') k.hedefSec(Number(deger))
    else if (tur === 'not') not = deger === 'kapat' ? null : Number(deger)
    panelCiz()
  }

  // Panel dışına basış: aşamanın sahnedeki eylemi. Kurallar sahnenin komut/tut işlevlerindedir.
  const sahneEylem = (el: El) => {
    const d = k.oyun(), ray = raycaster.ray
    if (d.usta) return
    const yakin = (ad: string, sinir: number) => ray.distanceToPoint(k.nesneNoktasi(ad, tmp)) <= sinir
    if (d.asama === 0) { if (yakin('yumurta', YAKIN.yumurta)) k.komut('al') }
    else if (d.asama === 1 || d.yeniden) { if (yakin('koruk', YAKIN.koruk)) { el.tutulan = 'koruk'; k.tut('koruk', true) } }
    else if (d.asama === 2) {
      const b = k.bolgeBul(ray)
      if (b !== null) { el.cekic.tetikle(); k.bolgeSec(b); k.komut('vur') }
    }
    else if (d.asama === 3) { if (yakin('su', YAKIN.su)) { el.tutulan = 'su'; k.tut('su', true) } }
    else if (d.asama === 4) { el.tutulan = 'bile'; el.bileX = duzlemX(ray.origin, ray.direction, k.tasZ); k.tut('bile', true) }
    else if (d.asama === 5) parcaKavra(el)
    else if (d.asama === 7) {
      for (let i = 0; i < 3; i++) if (i !== d.hedef && ray.distanceToPoint(k.hedefNoktasi(i)) <= YAKIN.hedef) { k.hedefSec(i); break }
    }
  }

  // Kuşanma: parça tutulur, kılıçtaki yerine götürülür, yakınsa oturur. Sıra ve sayım sahnenin tak kuralındadır.
  const parcaKavra = (el: El) => {
    const d = k.oyun()
    if (parcaEl || d.asama !== 5 || d.usta || d.takilan >= parcalar.length) return
    const ad = parcalar[d.takilan]
    tazele(el); k.nesneNoktasi(ad, tmp)
    el.tutamak.updateWorldMatrix(true, false, true)
    const dokundu = el.tutamak.visible && el.tutamak.getWorldPosition(tmp2).distanceTo(tmp) <= PARCA_DOKUNMA
    if (!dokundu && raycaster.ray.distanceToPoint(tmp) > YAKIN.parca) return
    parcaEl = el; parcaAd = ad; aktif = el
    el.ofset.copy(el.kumanda.matrixWorld).invert().multiply(k.parcaMatris(ad))
    titret(el, .3, 30)
    parcaIzle()
  }
  const parcaIzle = () => {
    if (!parcaEl) return
    parcaEl.kumanda.updateWorldMatrix(true, false, true)
    k.parcaTasi(parcaAd, parcaM.multiplyMatrices(parcaEl.kumanda.matrixWorld, parcaEl.ofset))
  }
  const parcaIptal = () => { if (parcaEl) { parcaEl.birakilacak = false; k.parcaTasi(parcaAd, null); parcaEl = null } }
  const parcaBirak = () => {
    const el = parcaEl
    if (!el) return
    const oturdu = parcaOturur(k.parcaUzaklik(parcaAd))
    parcaIptal()
    if (oturdu) { k.parcaOturt(); k.oyun().mesaj = 'Parça yerine oturdu.'; titret(el, .7, 60) }
    else k.oyun().mesaj = 'Parça yerine yaklaşmadı. Yeniden dene.'
  }

  const tazele = (el: El) => {
    // select olayı kare döngüsünün dışında gelir; matrixAutoUpdate kapalı, zorlanmazsa rig değişimi yansımaz.
    el.kumanda.updateWorldMatrix(true, false, true)
    raycaster.setFromXRController(el.kumanda)
  }
  const panelIsabet = () => {
    kontrol.nesne.updateWorldMatrix(true, false); bilgi.nesne.updateWorldMatrix(true, false)
    return raycaster.intersectObjects([kontrol.nesne, bilgi.nesne], false)[0]
  }
  const basildi = (el: El) => {
    if (!oturum || !pozHazir) return
    aktif = el
    if (kilicEliMi(el)) return
    tazele(el)
    const h = panelIsabet()
    if (!h) return sahneEylem(el)
    if (h.object !== kontrol.nesne || !h.uv) return
    const q = kontrol.kare(h.uv.x, h.uv.y)
    if (q && !q.dugme.pasif) eylem(q.id, el)
  }
  const birakildi = (el: El) => { if (el.tutulan) k.tut(el.tutulan, false); el.tutulan = null; el.bileX = null }
  // Karar kare başında: kopan kumanda da önce selectend yollar, oturtma denemesi sayılmasın.
  const tusBirak = (el: El) => { if (!el.tetik && !el.yan && el === parcaEl) el.birakilacak = true }

  const eller: El[] = [0, 1].map(i => {
    const kumanda = xr.getController(i), tutamak = xr.getControllerGrip(i)
    const isin = new T.Line(isinGeo, isinMat); isin.renderOrder = 1002; isin.scale.z = ISIN_BOY; kumanda.add(isin)
    const nokta = new T.Mesh(noktaGeo, noktaMat); nokta.renderOrder = 1003; nokta.visible = false; kumanda.add(nokta)
    tutamak.add(new T.Mesh(elGeo, elMat))
    rig.add(kumanda, tutamak)
    const el: El = { kumanda, tutamak, isin, nokta, kaynak: null, tutulan: null, bileX: null, cekic: new CekicOlcer(), tetik: false, yan: false, birakilacak: false, ofset: new T.Matrix4(), olaylar: [] }
    const olaylar: [string, (e: { data?: XRInputSource }) => void][] = [
      ['selectstart', () => { el.tetik = true; el.birakilacak = false; if (el !== parcaEl) basildi(el) }], ['selectend', () => { el.tetik = false; birakildi(el); tusBirak(el) }],
      ['squeezestart', () => { el.yan = true; el.birakilacak = false; if (oturum && pozHazir) parcaKavra(el) }], ['squeezeend', () => { el.yan = false; tusBirak(el) }],
      ['connected', e => { el.cekic.sifirla(); el.kaynak = e.data ?? null }], ['disconnected', () => { if (el === parcaEl) parcaIptal(); el.tetik = el.yan = false; birakildi(el); el.cekic.sifirla(); el.kaynak = null }],
    ]
    for (const [ad, f] of olaylar) kumanda.addEventListener(ad as never, f as never)
    el.olaylar = olaylar
    return el
  })

  const gir = (yeni: XRSession) => {
    oturum = yeni
    rig.add(camera); scene.add(rig)
    camera.near = .05; camera.far = 70
    yerlesBekliyor = true
    k.oturumBasladi()
  }
  const geriAl = () => {
    camera.removeFromParent(); camera.scale.set(1, 1, 1)
    rig.removeFromParent()
    parcaIptal()
    eller.forEach(el => { birakildi(el); el.kaynak = null; el.cekic.sifirla(); el.tetik = el.yan = false })
    k.zemin(false)
    oturum = null; pozHazir = false; not = null; aktif = null; cizimAnahtar = bilgiAnahtar = ''
    savurma.sifirla(); isaret.visible = false; vurgu.visible = false
  }
  const oturumBitince = () => {
    if (!oturum) return // Yarım kalan açılışın kapanışı: sahneye dokunulmamıştı
    geriAl()
    k.oturumBitti()
  }
  xr.addEventListener('sessionend', oturumBitince)

  const bitir = () => { oturum?.end().catch(() => {}) } // Zaten kapanmış oturumda end() reddeder

  /** Işın, panel üstündeyse boyu kısalır ve üstündeki düğme vurgulanır. */
  const isinKare = () => {
    let vurgulu: Kare | null = null
    for (const el of eller) {
      const var_ = !!el.kaynak && !kilicEliMi(el) && el !== parcaEl
      el.isin.visible = var_
      if (!var_) { el.nokta.visible = false; continue }
      tazele(el)
      const h = panelIsabet()
      el.isin.scale.z = h ? h.distance : ISIN_BOY
      el.nokta.visible = !!h
      if (h) {
        el.nokta.position.set(0, 0, -h.distance)
        if (h.object === kontrol.nesne && h.uv) { const q = kontrol.kare(h.uv.x, h.uv.y); if (q && !q.dugme.pasif) vurgulu = q }
      }
    }
    vurgu.visible = !!vurgulu
    if (vurgulu) { const q: Kare = vurgulu; kareYerel(q, vurgu.position); vurgu.scale.set(q.g / PANEL_G * PANEL_METRE, (q.y2 - q.y) / PANEL_Y * kontrolY, 1) }
  }

  /** Aşamanın asıl nesnesini gösterir; ışın ona yakınsa büyür. Dövmede üzerindeki bölgeyi de hatırlar. */
  const isaretKare = () => {
    const d = k.oyun()
    let var_ = !d.usta, sinir = 0
    if (d.asama === 0) { k.nesneNoktasi('yumurta', tmp); sinir = YAKIN.yumurta }
    else if (d.asama === 1 || d.yeniden) { k.nesneNoktasi('koruk', tmp); sinir = YAKIN.koruk }
    else if (d.asama === 3) { k.nesneNoktasi('su', tmp); sinir = YAKIN.su }
    else if (d.asama === 5 && parcaEl) k.parcaYeri(parcaAd, tmp) // Taşınırken işaret kılıçtaki yeri gösterir.
    else if (d.asama === 5 && d.takilan < 7) { k.nesneNoktasi(parcalar[d.takilan], tmp); sinir = YAKIN.parca }
    else if (d.asama === 7) tmp.copy(k.hedefNoktasi(d.hedef))
    else if (d.asama === 2) {
      let b: number | null = null
      for (const el of eller) if (el.kaynak) { tazele(el); b = k.bolgeBul(raycaster.ray) ?? b }
      k.bolgeNoktasi(b ?? d.secili, tmp)
      isaret.scale.setScalar(b !== null ? 1.2 : .7)
    } else var_ = false
    isaret.visible = var_
    if (!var_) return
    if (d.asama !== 2) {
      let yakin = false
      for (const el of eller) if (el.kaynak && sinir > 0) { tazele(el); if (raycaster.ray.distanceToPoint(tmp) <= sinir) yakin = true }
      isaret.scale.setScalar(yakin ? 1.6 : 1)
    }
    rig.updateWorldMatrix(true, false)
    isaret.position.copy(rig.worldToLocal(tmp2.copy(tmp)))
    if (cizimSure === 0) k.damga('xrIsaret', JSON.stringify([+tmp.x.toFixed(3), +tmp.y.toFixed(3), +tmp.z.toFixed(3)]))
  }

  return {
    baslat: async () => {
      if (oturum || basliyor) return
      if (!navigator.xr) throw new Error('Bu tarayıcıda WebXR yok')
      basliyor = true
      const oran = renderer.getPixelRatio(), boyut = renderer.getSize(new T.Vector2())
      let yeni: XRSession | null = null
      try {
        yeni = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
        await xr.setSession(yeni)
        if (xr.getSession() !== yeni) throw new Error('VR oturumu açılırken kapandı')
      } catch (hata) {
        // setSession yarıda kaldıysa renderer boyutu bozulabilir; kapanınca eskisine döner.
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
    /** Render'dan önce, oyun durumu işlenmeden çağrılır. */
    kare: (dt: number) => {
      if (!oturum) return
      if (!pozHazir) {
        const fr = xr.getFrame(), uzay = xr.getReferenceSpace()
        if (!fr || !uzay || !fr.getViewerPose(uzay)) return
        pozHazir = true
        panelCiz(true)
      }
      if (yerlesBekliyor) yerles()
      const d = k.oyun()

      // Usta, panel veya baştan başlama sıradaki parçayı değiştirdiyse tutuş düşer.
      if (parcaEl && (d.asama !== 5 || d.usta || parcalar[d.takilan] !== parcaAd)) parcaIptal()
      if (parcaEl?.birakilacak) parcaBirak()
      parcaIzle()

      const u = panelGeriGelsin(basYaw(), panelYaw, uzakSure, dt)
      uzakSure = u.sure
      if (u.gelsin) panelYerles()

      cizimSure += dt
      if (cizimSure >= CIZIM_ARALIK) { cizimSure = 0; panelCiz() }

      isinKare()
      isaretKare()

      if (d.asama === 6) {
        const g = oluBolge(kumandaGirdisi(oturum.inputSources).sagX)
        if (g) { k.dondur(g * dt * 1.4); stickDon += g * dt * 1.4; k.damga('xrDonus', stickDon.toFixed(3)) }
      }

      // Bileme: tetik basılıyken ışının namlu yönündeki hareketi temas noktasını kaydırır.
      for (const el of eller) if (el.tutulan === 'bile') {
        tazele(el)
        const x = duzlemX(raycaster.ray.origin, raycaster.ray.direction, k.tasZ)
        if (x !== null && el.bileX !== null) k.bileSur(bileAdim(k.bileU(), x - el.bileX))
        el.bileX = x
      }

      // Dövme: yalnız takip edilen elin kendi yakın zamandaki namlu hedefi vurulur.
      for (const el of eller) {
        if (d.asama !== 2 || d.yeniden || d.usta || !el.kaynak || !el.tutamak.visible || !el.kumanda.visible) {
          el.cekic.sifirla(); continue
        }
        tazele(el)
        if (panelIsabet()) { el.cekic.sifirla(); continue }
        const bolge = k.bolgeBul(raycaster.ray)
        el.tutamak.updateWorldMatrix(true, false, true); el.tutamak.getWorldPosition(tmp)
        const vurulan = el.cekic.adim(tmp.y, dt, bolge)
        if (vurulan !== null) { aktif = el; k.bolgeSec(vurulan); k.komut('vur') }
      }

      // Test: kılıç elde; savrulan namlu noktasının yolu kesim çizgisi olur.
      if (eldeMi() && !k.kesimSuruyor() && !d.kirildi) {
        const el = kilicEli()
        if (el) {
          el.tutamak.updateWorldMatrix(true, false, true)
          el.tutamak.getWorldQuaternion(tmpQ)
          yon.set(0, 0, -1).applyQuaternion(tmpQ)
          el.tutamak.getWorldPosition(tmp2)
          const s = savurma.adim(tmp.copy(tmp2).addScaledVector(yon, NAMLU_ORTA), dt)
          if (savurma.suruyor) k.izEkle()
          if (s) {
            const c = savurmaKesimi(s, k.hedefKutu(d.hedef))
            aktif = el; titret(el, Math.min(1, .4 + Math.hypot(c.dx, c.dy) / c.sure * .3), 80)
            k.kes({ a: new T.Vector3(c.a.x, c.a.y, c.a.z), b: new T.Vector3(c.b.x, c.b.y, c.b.z), dx: c.dx, dy: c.dy, sure: c.sure })
          }
        }
      } else savurma.sifirla()
    },
    /** Kılıcı avuca oturtur; kesim düğmesi animasyonu sürerken çağrılmaz. */
    kilicYerlestir: () => {
      const el = kilicEli()
      if (!el || !el.tutamak.visible || !eldeMi()) return false
      el.tutamak.updateWorldMatrix(true, false, true)
      el.tutamak.getWorldQuaternion(tmpQ)
      el.tutamak.getWorldPosition(tmp)
      tmp2.set(0, 0, -KABZA).applyQuaternion(tmpQ).add(tmp)
      tmpQ.multiply(el.kaynak?.handedness === 'left' ? EL_SOL : EL_SAG)
      k.kilicKonum(tmp2, tmpQ)
      return true
    },
    asamaDegisti: () => {
      not = null; yerlesBekliyor = true; savurma.sifirla()
      eller.forEach(el => { el.cekic.sifirla(); el.tutulan = null; el.bileX = null }) // Sahne basılı işleri zaten bıraktı.
      if (pozHazir) panelCiz()
    },
    hedefDegisti: () => { yerlesBekliyor = true; savurma.sifirla() },
    titret: (guc: number, ms: number) => titret(aktif, guc, ms),
    bitir,
    temizle: () => {
      xr.removeEventListener('sessionend', oturumBitince)
      const acik = oturum
      // Sahne de kapanıyor: oturumBitti çağrılmaz, sonradan gelen sessionend de dinlenmez.
      if (acik) { geriAl(); acik.end().catch(() => {}) }
      for (const el of eller) {
        for (const [ad, f] of el.olaylar) el.kumanda.removeEventListener(ad as never, f as never)
        el.kumanda.removeFromParent(); el.tutamak.removeFromParent()
      }
      kontrol.dispose(); bilgi.dispose(); vurgu.geometry.dispose(); vurguMalzeme.dispose()
      isinGeo.dispose(); isinMat.dispose(); noktaGeo.dispose(); noktaMat.dispose(); elGeo.dispose(); elMat.dispose()
      isaret.geometry.dispose(); isaretMat.dispose()
    },
  }
}
