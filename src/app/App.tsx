import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { bundledArtifacts, forThisBuild, fromBucket, withBundledModels } from '../infrastructure/contentRepository'
import { replaceInventory } from '../content/inventory'
import { api } from '../infrastructure/api'
import AdminLayout from '../features/admin/AdminLayout'
import ArtifactsAdminPage from '../features/admin/AdminPage'
import DashboardPage from '../features/admin/DashboardPage'
import MediaPage from '../features/admin/MediaPage'
import InventoryAdminPage from '../features/admin/InventoryAdminPage'
import AuditPage from '../features/admin/AuditPage'
import { AdminFormRoute } from '../features/admin/ArtifactForm'
import HomePage from '../features/home/HomePage'
import ArtifactsPage from '../features/heritage/pages/ArtifactsPage'
import ArtifactPage from '../features/heritage/pages/ArtifactPage'
import NotFound from '../shared/ui/NotFound'
import VaseWorkshop from '../features/workshops/vase/VaseWorkshop'
import SwordWorkshop from '../features/workshops/sword/SwordWorkshop'
import WorkshopsLayout from '../features/workshops/WorkshopsLayout'
import PlacesPage, { PlacePage } from '../features/places/PlacesPage'
import InventoryPage from '../features/places/InventoryPage'
import UiIcon from '../shared/ui/UiIcon'

export default function App() {
  // The bundled copy shows at once; the database's published list replaces it when the API answers (offline: bundled stays).
  const [artifacts, setArtifacts] = useState(bundledArtifacts)
  const refresh = useCallback(() => {
    // Inventory first, so the re-render caused by the new artifact list already sees the database inventory.
    void Promise.allSettled([api.inventory(), api.publishedArtifacts()]).then(([inv, list]) => {
      if (inv.status === 'fulfilled') replaceInventory(inv.value.items, inv.value.details)
      if (list.status === 'fulfilled' && Array.isArray(list.value) && list.value.length) setArtifacts(withBundledModels(forThisBuild(fromBucket(list.value))))
    })
  }, [])
  useEffect(refresh, [refresh])
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
  const area = pathname.startsWith('/places') ? 'places' : pathname.startsWith('/workshops') ? 'workshops' : pathname.startsWith('/artifact') ? 'artifacts' : ''
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
      <Routes>
        <Route path="/" element={<HomePage artifacts={artifacts} />} />
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
        <Route path="/admin" element={<AdminLayout artifacts={artifacts} onPublished={refresh} />}>
          <Route index element={<DashboardPage />} />
          <Route path="eserler" element={<ArtifactsAdminPage />} />
          <Route path="onay" element={<ArtifactsAdminPage queue />} />
          <Route path="medya" element={<MediaPage />} />
          <Route path="envanter" element={<InventoryAdminPage />} />
          <Route path="kayit" element={<AuditPage />} />
          <Route path="new" element={<AdminFormRoute />} />
          <Route path="artifact/:id" element={<AdminFormRoute />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <footer className="site-footer"><p>Bursa, Konya ve Hatay’daki vakıf eserleri için dijital keşif prototipi.</p></footer>
    <nav className="tabbar" aria-label="Ana gezinme">{tabs.map((t) => <Link key={t.key} to={t.to} aria-current={area === t.key ? 'page' : undefined}><UiIcon name={t.icon} /><span>{t.label}</span></Link>)}</nav>
  </>
}
