import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import { api, ROLE_LABELS } from '../../infrastructure/api'
import type { Role } from '../../infrastructure/api'
import { SessionGate, useSession } from './AdminPage'
import './admin.css'

import type { AdminContext } from './context'

/** /admin/*: one sign-in for every admin page, a side menu, and the page in the main area. */
export default function AdminLayout({ artifacts, onPublished }: { artifacts: Artifact[]; onPublished: () => void }) {
  const [role, setRole] = useSession()
  return <div className="admin-shell">
    <SessionGate role={role} setRole={setRole}>{(r) => <Shell role={r} onLogout={() => setRole(null)} artifacts={artifacts} onPublished={onPublished} />}</SessionGate>
  </div>
}

function Shell({ role, onLogout, artifacts, onPublished }: { role: Role; onLogout: () => void; artifacts: Artifact[]; onPublished: () => void }) {
  const [pendingCount, setPendingCount] = useState(0)
  const { pathname } = useLocation()
  const refreshPending = () => { api.stats().then((s) => setPendingCount(s.status.pending), () => {}) }
  useEffect(refreshPending, [pathname])
  async function logout() { await api.logout().catch(() => {}); onLogout() }
  const links: [string, string, boolean?][] = [
    ['/admin', 'Genel bakış', true], ['/admin/eserler', 'Eserler'], ['/admin/onay', `Onay kuyruğu${pendingCount ? ` (${pendingCount})` : ''}`],
    ['/admin/medya', 'Medya'], ['/admin/envanter', 'Envanter'], ['/admin/kayit', 'İşlem kaydı'],
  ]
  return <div className="admin-frame">
    <aside className="admin-side" aria-label="Yönetim menüsü">
      <p className="admin-side-title">İçerik yönetimi</p>
      <nav><ul>{links.map(([to, label, end]) => <li key={to}><NavLink to={to} end={end}>{label}</NavLink></li>)}</ul></nav>
      <NavLink className="admin-new" to="/admin/new">+ Yeni eser</NavLink>
      <div className="admin-who"><p><strong>{ROLE_LABELS[role]}</strong><br /><small>{role === 'curator' ? 'Onaylar, reddeder, siler' : 'Ekler ve düzenler; onay gerekir'}</small></p>
        <button type="button" onClick={logout}>Çıkış</button></div>
    </aside>
    <div className="admin-main"><Outlet context={{ role, logout, onPublished, artifacts, pendingCount, refreshPending } satisfies AdminContext} /></div>
  </div>
}
