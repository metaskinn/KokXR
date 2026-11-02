import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { eserleriGetir } from './data'
import AnaSayfa from './pages/AnaSayfa'
import EserSayfasi from './pages/EserSayfasi'
import Bulunamadi from './pages/Bulunamadi'

const eserler = eserleriGetir()
const rozetAnahtari = 'kokxr-rozetler'
function rozetleriOku(): string[] {
  try {
    const veri: unknown = JSON.parse(localStorage.getItem(rozetAnahtari) ?? '[]')
    return Array.isArray(veri) ? veri.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

export default function App() {
  const [rozetler, setRozetler] = useState(rozetleriOku)
  const { pathname } = useLocation()
  useEffect(() => {
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
    <header className="ust-cubuk"><Link to="/" aria-label="KökXR ana sayfa">KökXR</Link></header>
    <main id="ana-icerik" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<AnaSayfa eserler={eserler} rozetler={rozetler} />} />
        <Route path="/eser/:id" element={<EserSayfasi eserler={eserler} rozetKazan={rozetKazan} />} />
        <Route path="*" element={<Bulunamadi />} />
      </Routes>
    </main>
  </>
}
