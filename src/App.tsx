import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { eserleriGetir, icerigiOku, icerigiYaz } from './data'
import type { UstKatman } from './data'
import { bulutVar, durumDegistir, eserleriOku, eserKaydet, eserSil } from './data/bulut'
import { katkilariOku, katkilariYaz, yeniKatki } from './data/katki'
import type { KatkiDurumu } from './data/katki'
import { onayiOku, onayiYaz, yayinKatmani } from './data/onay'
import type { OnayDurumu } from './data/onay'
import { ustKatmaniCoz } from './data'
import Yonetim from './pages/Yonetim'
import type { YonetimProps } from './pages/Yonetim'
import EserFormu from './pages/EserFormu'
import AnaSayfa from './pages/AnaSayfa'
import EserSayfasi from './pages/EserSayfasi'
import Bulunamadi from './pages/Bulunamadi'
import VazoAtolyesi from './pages/VazoAtolyesi'
import CiniAtolyesi from './pages/CiniAtolyesi'
import KilicAtolyesi from './pages/KilicAtolyesi'
import Yolculuk from './pages/Yolculuk'
import OgretmenPaneli from './pages/OgretmenPaneli'
import Vizyon from './pages/Vizyon'
import Kutuphane from './pages/Kutuphane'
import OnayAkisi from './pages/OnayAkisi'
import VrEserler, { VrEser } from './pages/VrEserler'
import Simge from './components/Simge'
import YonetimKapisi from './components/YonetimKapisi'
import ErisilebilirlikAraci from './components/ErisilebilirlikAraci'

const rozetAnahtari = 'kokxr-rozetler'
function rozetleriOku(): string[] {
  try {
    const veri: unknown = JSON.parse(localStorage.getItem(rozetAnahtari) ?? '[]')
    return Array.isArray(veri) ? veri.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

function YonetimFormRotasi(props: YonetimProps) {
  const { id } = useParams()
  const eser = props.eserler.find(e => e.id === id)
  if (id && !eser) return <Bulunamadi />
  return <EserFormu key={id ?? 'yeni'} {...props} eser={eser} />
}

export default function App() {
  const [icerik, setIcerik] = useState(icerigiOku)
  const [bulutKatmani, setBulutKatmani] = useState<UstKatman>({})
  // Buluttaki onaylı eserler yerel değişikliklerin altında kalır; bulut yoksa veya erişilemezse yerel içerik çalışır.
  useEffect(() => {
    if (!bulutVar) return
    eserleriOku().then((liste) => setBulutKatmani(ustKatmaniCoz(Object.fromEntries(liste.map((b) => [b.eser.id, b.eser]))))).catch(() => {})
  }, [])
  const [onay, setOnay] = useState(onayiOku)
  const [katkilar, setKatkilar] = useState(katkilariOku)
  function katkiEkle(eserId: string, baslik: string, metin: string) {
    const yeni = [...katkilar, yeniKatki(eserId, baslik, metin)]
    setKatkilar(yeni); katkilariYaz(yeni)
  }
  function katkiKarari(id: string, durum: KatkiDurumu) {
    const yeni = katkilar.map((k) => k.id === id ? { ...k, durum } : k)
    setKatkilar(yeni); katkilariYaz(yeni)
  }
  const yonetimEserleri = eserleriGetir({ ...bulutKatmani, ...icerik.ustKatman })
  const eserler = eserleriGetir({ ...bulutKatmani, ...yayinKatmani(icerik.ustKatman, onay) })
  function onayKarari(id: string, durum: OnayDurumu) {
    const yeni = { ...onay, [id]: durum }
    setOnay(yeni); onayiYaz(yeni)
    if (bulutVar) durumDegistir(id, durum).catch(() => {})
  }
  function icerikKaydet(veri: UstKatman) {
    const onceki = icerik.ustKatman
    setIcerik(icerigiYaz(veri))
    if (!bulutVar) return
    // Oturum yoksa bulut yazması sessizce atlanır; yerel kayıt zaten yapıldı.
    for (const [id, e] of Object.entries(veri)) if (JSON.stringify(onceki[id]) !== JSON.stringify(e)) eserKaydet(e).catch(() => {})
    for (const id of Object.keys(onceki)) if (!(id in veri)) eserSil(id).catch(() => {})
  }
  const yonetimProps = { eserler: yonetimEserleri, ustKatman: icerik.ustKatman, kaydet: icerikKaydet }
  const [rozetler, setRozetler] = useState(rozetleriOku)
  const { pathname } = useLocation()
  const oncekiRota = useRef(pathname)
  useEffect(() => {
    if (oncekiRota.current === pathname) return
    oncekiRota.current = pathname
    window.scrollTo(0, 0)
    document.getElementById('ana-icerik')?.focus({ preventScroll: true })
  }, [pathname])

  function rozetKazan(id: string) {
    const yeniRozetler = [...new Set([...rozetler, ...rozetleriOku(), id])]
    setRozetler(yeniRozetler)
    try { localStorage.setItem(rozetAnahtari, JSON.stringify(yeniRozetler)); return true }
    catch { return false }
  }

  return <>
    <a className="atlama" href="#ana-icerik">Ana içeriğe geç</a>
    <header className="ust-cubuk"><div className="ust-cubuk-ic"><Link className="marka" to="/" aria-label="KökXR ana sayfa"><span className="marka-simge"><Simge ad="isaret" /></span><span>Kök<span className="marka-xr">XR</span></span></Link><nav aria-label="Ana gezinme"><NavLink to="/" end>Keşfet</NavLink><NavLink to="/yolculuk">Yolculuk</NavLink><span className="nav-grup" role="group" aria-label="Deneyimler"><span className="nav-grup-ad" aria-hidden="true">Deneyimler</span><NavLink to="/vr">VR Eserler</NavLink><NavLink to="/atolye/vazo">Vazo atölyesi</NavLink><NavLink to="/atolye/kilic">Kılıç atölyesi</NavLink><NavLink to="/atolye/cini">Çini atölyesi</NavLink><NavLink to="/ogretmen">Öğretmen</NavLink></span><NavLink className="yonetim-link" to="/yonetim">Yönetim</NavLink></nav><ErisilebilirlikAraci /></div></header>
    <main id="ana-icerik" tabIndex={-1}>
      {icerik.uyari && <p className="yonetim-notu" role="alert">{icerik.uyari}</p>}
      <Routes>
        <Route path="/" element={<AnaSayfa eserler={eserler} rozetler={rozetler} />} />
        <Route path="/yolculuk" element={<Yolculuk eserler={eserler} rozetKazan={rozetKazan} />} />
        <Route path="/ogretmen" element={<OgretmenPaneli />} />
        <Route path="/vizyon" element={<Vizyon />} />
        <Route path="/kutuphane" element={<Kutuphane />} />
        <Route path="/onay" element={<OnayAkisi eserler={yonetimEserleri} ustKatman={icerik.ustKatman} onay={onay} karar={onayKarari} katkilar={katkilar} katkiKarari={katkiKarari} />} />
        <Route path="/vr" element={<VrEserler eserler={eserler} />} />
        <Route path="/vr/:id" element={<VrEser eserler={eserler} rozetKazan={rozetKazan} />} />
        <Route path="/atolye/kilic" element={<KilicAtolyesi />} />
        <Route path="/atolye/vazo" element={<VazoAtolyesi />} />
        <Route path="/atolye/cini" element={<CiniAtolyesi />} />
        <Route path="/eser/:id" element={<EserSayfasi eserler={eserler} rozetKazan={rozetKazan} katkilar={katkilar} katkiEkle={katkiEkle} />} />
        <Route path="/yonetim" element={<YonetimKapisi {...yonetimProps}><Yonetim {...yonetimProps} /></YonetimKapisi>} />
        <Route path="/yonetim/yeni" element={<YonetimKapisi {...yonetimProps}><YonetimFormRotasi {...yonetimProps} /></YonetimKapisi>} />
        <Route path="/yonetim/eser/:id" element={<YonetimKapisi {...yonetimProps}><YonetimFormRotasi {...yonetimProps} /></YonetimKapisi>} />
        <Route path="*" element={<Bulunamadi />} />
      </Routes>
    </main>
    <footer className="alt-cubuk"><div><Link className="marka" to="/">Kök<span className="marka-xr">XR</span></Link><p>Geçmişle bugün arasında bir bağ.</p></div><p>Bursa’nın vakıf eserleri için dijital keşif prototipi.</p><nav className="alt-gezinme" aria-label="Diğer sayfalar"><Link to="/kutuphane">Kütüphane</Link><Link to="/vizyon">Vizyon</Link><Link to="/onay">Onay akışı</Link></nav></footer>
  </>
}
