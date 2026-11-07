import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigationType, useParams } from 'react-router-dom'
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
import UiIcon from '../shared/ui/UiIcon'

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
  const navigationType = useNavigationType()
  const prevRoute = useRef(pathname)
  useEffect(() => {
    if (prevRoute.current === pathname) return
    prevRoute.current = pathname
    // Back/forward keeps the page's own scroll restoration (the artifact list restores its position itself).
    if (navigationType !== 'POP') window.scrollTo(0, 0)
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname, navigationType])
  // Meta Quest and other WebXR browsers get larger targets (tokens.css :root[data-xr='yes']).
  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } }).xr
    xr?.isSessionSupported('immersive-vr').then((ok) => { if (ok) document.documentElement.dataset.xr = 'yes' }, () => {})
  }, [])

  // Each top-level area is active for its own sub pages too (an artifact page belongs to Eserler).
  const area = pathname.startsWith('/places') ? 'places' : pathname.startsWith('/workshops') ? 'workshops' : pathname.startsWith('/artifact') || pathname === '/' ? 'artifacts' : ''
  const back = /^\/artifact\//.test(pathname) ? { to: '/artifacts', label: 'Eserler' }
    : /^\/places\/.+/.test(pathname) ? { to: '/places', label: 'Maketler' } : null
  const tabs = [
    { to: '/artifacts', key: 'artifacts', label: 'Eserler', icon: 'arch' },
    { to: '/places', key: 'places', label: 'Maketler', icon: 'cube' },
    { to: '/workshops', key: 'workshops', label: 'Atölyeler', icon: 'vase' },
  ] as const

  return <>
    <a className="skip" href="#main-content">Ana içeriğe geç</a>
    <header className="site-header" data-sub={back ? 'yes' : undefined}><div className="site-header-inner">
      {back && <Link className="link-back topbar-back" to={back.to}><UiIcon name="back" />{back.label}</Link>}
      <Link className="brand" to="/" aria-label="KökXR ana sayfa">Kök<span className="brand-xr">XR</span></Link>
      <nav aria-label="Ana gezinme">{tabs.map((t) => <Link key={t.key} to={t.to} aria-current={area === t.key ? 'page' : undefined}>{t.label}</Link>)}</nav>
    </div></header>
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
    <footer className="site-footer"><p>Bursa, Konya ve Hatay’daki vakıf eserleri için dijital keşif prototipi.</p></footer>
    <nav className="tabbar" aria-label="Ana gezinme">{tabs.map((t) => <Link key={t.key} to={t.to} aria-current={area === t.key ? 'page' : undefined}><UiIcon name={t.icon} /><span>{t.label}</span></Link>)}</nav>
  </>
}
