import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { eserleriGetir, icerigiOku, icerigiYaz } from './data'
import type { UstKatman } from './data'
import Yonetim from './pages/Yonetim'
import type { YonetimProps } from './pages/Yonetim'
import EserFormu from './pages/EserFormu'
import AnaSayfa from './pages/AnaSayfa'
import EserSayfasi from './pages/EserSayfasi'
import Bulunamadi from './pages/Bulunamadi'
import VazoAtolyesi from './pages/VazoAtolyesi'
import Simge from './components/Simge'

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
  const eserler = eserleriGetir(icerik.ustKatman)
  function icerikKaydet(veri: UstKatman) { setIcerik(icerigiYaz(veri)) }
  const yonetimProps = { eserler, ustKatman: icerik.ustKatman, kaydet: icerikKaydet }
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
    <header className="ust-cubuk"><div className="ust-cubuk-ic"><Link className="marka" to="/" aria-label="KökXR ana sayfa"><span className="marka-simge"><Simge ad="isaret" /></span><span>Kök<span className="marka-xr">XR</span></span></Link><nav aria-label="Ana gezinme"><NavLink to="/" end>Keşfet</NavLink><NavLink to="/atolye/vazo">Vazo atölyesi</NavLink><NavLink className="yonetim-link" to="/yonetim">Yönetim</NavLink></nav></div></header>
    <main id="ana-icerik" tabIndex={-1}>
      {icerik.uyari && <p className="yonetim-notu" role="alert">{icerik.uyari}</p>}
      <Routes>
        <Route path="/" element={<AnaSayfa eserler={eserler} rozetler={rozetler} />} />
        <Route path="/atolye/vazo" element={<VazoAtolyesi />} />
        <Route path="/eser/:id" element={<EserSayfasi eserler={eserler} rozetKazan={rozetKazan} />} />
        <Route path="/yonetim" element={<Yonetim {...yonetimProps} />} />
        <Route path="/yonetim/yeni" element={<YonetimFormRotasi {...yonetimProps} />} />
        <Route path="/yonetim/eser/:id" element={<YonetimFormRotasi {...yonetimProps} />} />
        <Route path="*" element={<Bulunamadi />} />
      </Routes>
    </main>
    <footer className="alt-cubuk"><div><Link className="marka" to="/">Kök<span className="marka-xr">XR</span></Link><p>Geçmişle bugün arasında bir bağ.</p></div><p>Bursa’nın vakıf eserleri için dijital keşif prototipi.</p><Link to="/atolye/vazo">Atölyeye git <span aria-hidden="true">↗</span></Link></footer>
  </>
}
