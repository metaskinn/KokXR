import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { getArtifacts, readContent, writeContent } from './data'
import type { Overlay } from './data'
import Admin from './pages/Admin'
import type { AdminProps } from './pages/Admin'
import ArtifactForm from './pages/ArtifactForm'
import Artifacts from './pages/Artifacts'
import ArtifactPage from './pages/ArtifactPage'
import NotFound from './pages/NotFound'
import VaseWorkshop from './pages/VaseWorkshop'
import TileWorkshop from './pages/TileWorkshop'
import SwordWorkshop from './pages/SwordWorkshop'
import Workshops from './pages/Workshops'
import VrArtifacts, { VrArtifact } from './pages/VrArtifacts'

function AdminFormRoute(props: AdminProps) {
  const { id } = useParams()
  const artifact = props.artifacts.find(e => e.id === id)
  if (id && !artifact) return <NotFound />
  return <ArtifactForm key={id ?? 'fresh'} {...props} artifact={artifact} />
}

export default function App() {
  const [content, setContent] = useState(readContent)
  const artifacts = getArtifacts(content.overlay)
  function saveContent(data: Overlay) { setContent(writeContent(data)) }
  const adminProps = { artifacts, overlay: content.overlay, save: saveContent }
  const { pathname } = useLocation()
  const prevRoute = useRef(pathname)
  useEffect(() => {
    if (prevRoute.current === pathname) return
    prevRoute.current = pathname
    window.scrollTo(0, 0)
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname])

  return <>
    <a className="skip" href="#main-content">Ana içeriğe geç</a>
    <header className="site-header"><div className="site-header-inner"><Link className="brand" to="/" aria-label="KökXR ana sayfa">Kök<span className="brand-xr">XR</span></Link><nav aria-label="Ana gezinme"><NavLink to="/artifacts">Eserler</NavLink><NavLink to="/vr">Mekanlar</NavLink><NavLink to="/workshop">Atölyeler</NavLink><NavLink className="admin-link" to="/admin">Yönetim</NavLink></nav></div></header>
    <main id="main-content" tabIndex={-1}>
      {content.warning && <p className="admin-note" role="alert">{content.warning}</p>}
      <Routes>
        <Route path="/" element={<Navigate to="/artifacts" replace />} />
        <Route path="/artifacts" element={<Artifacts artifacts={artifacts} />} />
        <Route path="/vr" element={<VrArtifacts artifacts={artifacts} />} />
        <Route path="/vr/:id" element={<VrArtifact artifacts={artifacts} />} />
        <Route path="/workshop" element={<Workshops />}>
          <Route index element={<Navigate to="vase" replace />} />
          <Route path="vase" element={<VaseWorkshop />} />
          <Route path="sword" element={<SwordWorkshop />} />
          <Route path="tile" element={<TileWorkshop />} />
        </Route>
        <Route path="/artifact/:id" element={<ArtifactPage artifacts={artifacts} />} />
        <Route path="/admin" element={<Admin {...adminProps} />} />
        <Route path="/admin/fresh" element={<AdminFormRoute {...adminProps} />} />
        <Route path="/admin/artifact/:id" element={<AdminFormRoute {...adminProps} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <footer className="site-footer"><div><Link className="brand" to="/">Kök<span className="brand-xr">XR</span></Link></div><p>Bursa’nın vakıf eserleri için dijital keşif prototipi.</p></footer>
  </>
}
