import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { eserleriGetir, icerigiOku, icerigiYaz } from './data'
import type { UstKatman } from './data'
import Yonetim from './pages/Yonetim'
import type { YonetimProps } from './pages/Yonetim'
import EserFormu from './pages/EserFormu'
import Eserler from './pages/Eserler'
import EserSayfasi from './pages/EserSayfasi'
import Bulunamadi from './pages/Bulunamadi'
import VazoAtolyesi from './pages/VazoAtolyesi'
import CiniAtolyesi from './pages/CiniAtolyesi'
import KilicAtolyesi from './pages/KilicAtolyesi'
import Atolyeler from './pages/Atolyeler'
import VrEserler, { VrEser } from './pages/VrEserler'

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
  const { pathname } = useLocation()
  const oncekiRota = useRef(pathname)
  useEffect(() => {
    if (oncekiRota.current === pathname) return
    oncekiRota.current = pathname
    window.scrollTo(0, 0)
    document.getElementById('ana-icerik')?.focus({ preventScroll: true })
  }, [pathname])

  return <>
    <a className="atlama" href="#ana-icerik">Ana içeriğe geç</a>
    <header className="ust-cubuk"><div className="ust-cubuk-ic"><Link className="marka" to="/" aria-label="KökXR ana sayfa">Kök<span className="marka-xr">XR</span></Link><nav aria-label="Ana gezinme"><NavLink to="/eserler">Eserler</NavLink><NavLink to="/vr">Mekanlar</NavLink><NavLink to="/atolye">Atölyeler</NavLink><NavLink className="yonetim-link" to="/yonetim">Yönetim</NavLink></nav></div></header>
    <main id="ana-icerik" tabIndex={-1}>
      {icerik.uyari && <p className="yonetim-notu" role="alert">{icerik.uyari}</p>}
      <Routes>
        <Route path="/" element={<Navigate to="/eserler" replace />} />
        <Route path="/eserler" element={<Eserler eserler={eserler} />} />
        <Route path="/vr" element={<VrEserler eserler={eserler} />} />
        <Route path="/vr/:id" element={<VrEser eserler={eserler} />} />
        <Route path="/atolye" element={<Atolyeler />}>
          <Route index element={<Navigate to="vazo" replace />} />
          <Route path="vazo" element={<VazoAtolyesi />} />
          <Route path="kilic" element={<KilicAtolyesi />} />
          <Route path="cini" element={<CiniAtolyesi />} />
        </Route>
        <Route path="/eser/:id" element={<EserSayfasi eserler={eserler} />} />
        <Route path="/yonetim" element={<Yonetim {...yonetimProps} />} />
        <Route path="/yonetim/yeni" element={<YonetimFormRotasi {...yonetimProps} />} />
        <Route path="/yonetim/eser/:id" element={<YonetimFormRotasi {...yonetimProps} />} />
        <Route path="*" element={<Bulunamadi />} />
      </Routes>
    </main>
    <footer className="alt-cubuk"><div><Link className="marka" to="/">Kök<span className="marka-xr">XR</span></Link></div><p>Bursa’nın vakıf eserleri için dijital keşif prototipi.</p></footer>
  </>
}
