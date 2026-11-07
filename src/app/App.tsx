import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { getArtifacts, readContent, writeContent } from '../infrastructure/contentRepository'
import type { Overlay } from '../infrastructure/contentRepository'
import AdminPage from '../features/admin/AdminPage'
import type { AdminProps } from '../features/admin/AdminPage'
import ArtifactForm from '../features/admin/ArtifactForm'
import ArtifactsPage from '../features/heritage/pages/ArtifactsPage'
import ArtifactPage from '../features/heritage/pages/ArtifactPage'
import NotFound from '../shared/ui/NotFound'
import VaseWorkshop from '../features/workshops/vase/VaseWorkshop'
import SwordWorkshop from '../features/workshops/sword/SwordWorkshop'
import WorkshopsLayout from '../features/workshops/WorkshopsLayout'
import PlacesPage, { PlacePage } from '../features/places/PlacesPage'
import InventoryPage from '../features/places/InventoryPage'

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
    <header className="site-header"><div className="site-header-inner"><Link className="brand" to="/" aria-label="KökXR ana sayfa">Kök<span className="brand-xr">XR</span></Link><nav aria-label="Ana gezinme"><NavLink to="/artifacts">Eserler</NavLink><NavLink to="/places">Mekanlar</NavLink><NavLink to="/workshops">Atölyeler</NavLink></nav></div></header>
    <main id="main-content" tabIndex={-1}>
      {content.warning && <p className="admin-note" role="alert">{content.warning}</p>}
      <Routes>
        <Route path="/" element={<Navigate to="/artifacts" replace />} />
        <Route path="/artifacts" element={<ArtifactsPage artifacts={artifacts} />} />
        <Route path="/places" element={<PlacesPage artifacts={artifacts} />} />
        <Route path="/places/yapi/:id" element={<InventoryPage artifacts={artifacts} />} />
        <Route path="/places/:id" element={<PlacePage artifacts={artifacts} />} />
        <Route path="/workshops" element={<WorkshopsLayout />}>
          <Route index element={<Navigate to="vase" replace />} />
          <Route path="vase" element={<VaseWorkshop />} />
          <Route path="sword" element={<SwordWorkshop />} />
        </Route>
        <Route path="/artifact/:id" element={<ArtifactPage artifacts={artifacts} />} />
        <Route path="/admin" element={<AdminPage {...adminProps} />} />
        <Route path="/admin/new" element={<AdminFormRoute {...adminProps} />} />
        <Route path="/admin/artifact/:id" element={<AdminFormRoute {...adminProps} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <footer className="site-footer"><div><Link className="brand" to="/">Kök<span className="brand-xr">XR</span></Link></div><p>Bursa’nın vakıf eserleri için dijital keşif prototipi.</p></footer>
  </>
}
