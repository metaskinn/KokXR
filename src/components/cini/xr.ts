// Çini atölyesinin VR oturumu: oyunu kumanda ışınıyla oynatır. Oyun kuralı burada yoktur; sahnedeki işaret yoluna bağlanır.
import * as THREE from 'three'
import type { Eylem, Oyun } from './durum'
import type { TutAd } from './sahne'

export interface XrBaglam {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; plaka: THREE.Group
  oyun: () => Oyun; eylemler: () => Eylem[]; asamaAdi: () => string; kalite: () => number
  isiAraligi: () => { min: number; max: number }
  isaretBas: (r: THREE.Ray) => void; isaretGez: (r: THREE.Ray) => void; isaretBirak: () => void
  komut: (id: string) => void; tut: (ad: TutAd, acik: boolean) => void; usta: () => void
  aracGizle: () => void; boyutla: () => void; plakaYaricap: number; kameraGeriYukle: () => void
}
export interface CiniXr { baslat: () => Promise<void>; bitir: () => void; kare: () => void; aktif: () => boolean; tutuluyor: () => boolean; temizle: () => void }

const G = 1024, Y = 900, METRE = .66
const BAS_Y = 300, SATIR = 64, BOSLUK = 8
const YAZI = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
const ETIKET = 'Temsilî çini · Oyun ölçeği'

/** Panel satırları: oyun eylemleri, ustaya bırak ve çıkış. */
export function panelOgeleri(ogeler: Eylem[], ustaVar: boolean): Eylem[] {
  return [...ogeler, ...(ustaVar ? [{ id: 'usta', ad: 'Ustaya bırak', tur: 'bas' as const }] : []), { id: 'cik', ad: "VR'dan çık", tur: 'bas' as const }]
}
/** `v` üst kenarda 1'dir. */
export function panelIsabet(v: number, adet: number) {
  const py = (1 - v) * Y
  if (py < BAS_Y) return -1
  const i = Math.floor((py - BAS_Y) / (SATIR + BOSLUK))
  return i < adet && (py - BAS_Y) % (SATIR + BOSLUK) <= SATIR ? i : -1
}

function satirKir(c: CanvasRenderingContext2D, metin: string, en: number) {
  const o: string[] = []; let s = ''
  for (const k of metin.split(' ')) { const y = s ? `${s} ${k}` : k; if (c.measureText(y).width > en && s) { o.push(s); s = k } else s = y }
  if (s) o.push(s)
  return o
}

export function xrKur(b: XrBaglam): CiniXr {
  const { renderer, scene, camera, plaka } = b
  const xr = renderer.xr
  xr.enabled = true
  xr.setReferenceSpaceType('local-floor')

  const rig = new THREE.Group()
  rig.position.set(0, 0, .72)

  const el = document.createElement('canvas'); el.width = G; el.height = Y
  const c = el.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Tuval kullanılamıyor')
  const doku = new THREE.CanvasTexture(el); doku.colorSpace = THREE.SRGBColorSpace; doku.anisotropy = 8
  const panelG = new THREE.PlaneGeometry(METRE, (METRE * Y) / G)
  const panelM = new THREE.MeshBasicMaterial({ map: doku, toneMapped: false })
  const panel = new THREE.Mesh(panelG, panelM)
  panel.position.set(-.56, 1.26, .08); panel.rotation.y = .5

  let imza = '', ogeler: Eylem[] = []
  const panelCiz = () => {
    const d = b.oyun(), liste = panelOgeleri(b.eylemler(), d.asama < 6 && !(d.asama === 5 && d.alt === 2))
    const yeni = JSON.stringify([d.asama, d.alt, d.mesaj, Math.round(d.isi / 4), liste.map((o) => [o.id, o.pasif, o.secili]), d.firinda, d.asama === 6 ? b.kalite() : 0])
    if (yeni === imza) return
    imza = yeni; ogeler = liste
    c.fillStyle = '#f7f3e8'; c.fillRect(0, 0, G, Y)
    c.fillStyle = '#123f62'; c.fillRect(0, 0, G, 66)
    c.fillStyle = '#fff'; c.font = `700 32px ${YAZI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ETIKET, G / 2, 34)
    c.textAlign = 'left'; c.fillStyle = '#123f62'; c.font = `700 52px ${YAZI}`; c.fillText(`${d.asama + 1}/7 · ${b.asamaAdi()}`, 40, 112)
    c.fillStyle = '#253a34'; c.font = `400 33px ${YAZI}`
    satirKir(c, d.asama === 6 ? `${d.mesaj} Kalite: ${b.kalite()}/100` : d.mesaj, G - 80).slice(0, 2).forEach((s, i) => c.fillText(s, 40, 176 + i * 42))
    if (d.firinda) {
      const a = b.isiAraligi(), x = (v: number) => 40 + ((G - 80) * Math.min(v, 1100)) / 1100
      c.fillStyle = '#d9d2c1'; c.fillRect(40, 262, G - 80, 22)
      c.fillStyle = '#2f9e6a'; c.fillRect(x(a.min), 262, x(a.max) - x(a.min), 22)
      c.fillStyle = '#c5301f'; c.fillRect(x(d.isi) - 4, 254, 8, 38)
    }
    liste.forEach((o, i) => {
      const yy = BAS_Y + i * (SATIR + BOSLUK)
      c.fillStyle = o.pasif ? '#d9d5c9' : o.secili ? '#d99a36' : o.id === 'cik' ? '#7b2c20' : '#1e4d5e'
      c.beginPath(); c.roundRect(40, yy, G - 80, SATIR, 12); c.fill()
      c.fillStyle = o.pasif ? '#857f70' : '#fff'; c.font = `600 34px ${YAZI}`; c.textAlign = 'center'; c.fillText(o.ad, G / 2, yy + SATIR / 2 + 1); c.textAlign = 'left'
    })
    doku.needsUpdate = true
  }

  const isinG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)])
  const isinM = new THREE.LineBasicMaterial({ color: '#f7f3e8', toneMapped: false })
  const elG = new THREE.SphereGeometry(.018, 12, 8), elM = new THREE.MeshBasicMaterial({ color: '#f0e1bc', toneMapped: false })
  const raycaster = new THREE.Raycaster()
  let oturum: XRSession | null = null, kapandi = false, tutan: THREE.Object3D | null = null
  const ofset = new THREE.Matrix4(), m = new THREE.Matrix4(), konum = new THREE.Vector3(), donus = new THREE.Quaternion(), olcek = new THREE.Vector3()

  interface El { kumanda: THREE.XRTargetRaySpace; isaretler: boolean; tutulanAd: TutAd | null; dinle: [string, () => void][] }
  const isin = (k: THREE.Object3D) => { k.updateWorldMatrix(true, false); raycaster.setFromXRController(k as THREE.XRTargetRaySpace); return raycaster.ray }

  const bas = (e: El) => {
    if (!oturum) return
    const r = isin(e.kumanda), h = raycaster.intersectObject(panel, false)[0]
    if (h?.uv) {
      const o = ogeler[panelIsabet(h.uv.y, ogeler.length)]
      if (!o || o.pasif) return
      if (o.id === 'cik') { bitir(); return }
      if (o.id === 'usta') { b.usta(); return }
      if (o.tur === 'tut') { e.tutulanAd = o.id as TutAd; b.tut(e.tutulanAd, true); return }
      b.komut(o.id)
      return
    }
    e.isaretler = true
    b.isaretBas(r)
  }
  const birak = (e: El) => {
    if (e.tutulanAd) { b.tut(e.tutulanAd, false); e.tutulanAd = null }
    if (e.isaretler) { e.isaretler = false; b.isaretBirak() }
  }
  // İnceleme adımında yan tuş tabağı ele alır.
  const kavra = (e: El) => {
    if (!oturum || b.oyun().asama !== 6 || tutan) return
    tutan = e.kumanda
    e.kumanda.updateWorldMatrix(true, false); plaka.updateWorldMatrix(true, false)
    ofset.copy(e.kumanda.matrixWorld).invert().multiply(plaka.matrixWorld)
  }
  const salla = (e: El) => { if (tutan === e.kumanda) tutan = null }

  const eller: El[] = [0, 1].map((i) => {
    const kumanda = xr.getController(i)
    kumanda.add(new THREE.Line(isinG, isinM), new THREE.Mesh(elG, elM))
    const e: El = { kumanda, isaretler: false, tutulanAd: null, dinle: [] }
    e.dinle = [['selectstart', () => bas(e)], ['selectend', () => birak(e)], ['squeezestart', () => kavra(e)], ['squeezeend', () => salla(e)], ['disconnected', () => { birak(e); salla(e) }]]
    for (const [o, f] of e.dinle) kumanda.addEventListener(o as 'selectstart', f)
    rig.add(kumanda)
    return e
  })

  const yedek = { near: 0, far: 0 }
  const gir = (yeni: XRSession) => {
    oturum = yeni
    yedek.near = camera.near; yedek.far = camera.far
    camera.near = .03; camera.far = 40
    rig.add(camera); scene.add(rig, panel)
    imza = ''
  }
  const geriAl = () => {
    eller.forEach(birak)
    tutan = null
    b.aracGizle()
    camera.removeFromParent(); camera.scale.set(1, 1, 1)
    camera.near = yedek.near; camera.far = yedek.far
    rig.removeFromParent(); panel.removeFromParent()
    oturum = null
  }
  const sonlandi = () => { if (!oturum) return; geriAl(); b.kameraGeriYukle() }
  xr.addEventListener('sessionend', sonlandi)
  const bitir = () => { oturum?.end().catch(() => {}) }

  return {
    baslat: async () => {
      if (oturum) return
      if (!navigator.xr) throw new Error('Bu tarayıcıda WebXR yok')
      const yeni = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
      if (kapandi) { await yeni.end().catch(() => {}); throw new Error('Sahne kapandı') }
      await xr.setSession(yeni)
      xr.setFoveation(1)
      gir(yeni)
    },
    bitir,
    aktif: () => oturum !== null,
    tutuluyor: () => tutan !== null,
    kare: () => {
      panelCiz()
      for (const e of eller) {
        if (e.isaretler) b.isaretGez(isin(e.kumanda))
        else if (e === eller[1] && !eller[0].isaretler && !e.tutulanAd) {
          // Basılmadan da alet ışının ucunda görünür: nereye dokunacağın belli olsun.
          const r = isin(e.kumanda)
          if (!raycaster.intersectObject(panel, false)[0]) b.isaretGez(r)
        }
      }
      if (tutan) {
        tutan.updateWorldMatrix(true, false)
        m.multiplyMatrices(tutan.matrixWorld, ofset).decompose(konum, donus, olcek)
        plaka.position.copy(konum); plaka.quaternion.copy(donus)
      }
    },
    temizle: () => {
      kapandi = true
      xr.removeEventListener('sessionend', sonlandi)
      if (oturum) { const a = oturum; geriAl(); a.end().catch(() => {}) }
      for (const e of eller) { for (const [o, f] of e.dinle) e.kumanda.removeEventListener(o as 'selectstart', f); e.kumanda.removeFromParent() }
      doku.dispose(); panelG.dispose(); panelM.dispose(); isinG.dispose(); isinM.dispose(); elG.dispose(); elM.dispose()
    },
  }
}
