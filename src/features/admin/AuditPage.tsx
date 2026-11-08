import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ROLE_LABELS } from '../../infrastructure/api'
import type { AuditRow, Role } from '../../infrastructure/api'
import { ACTIONS, when } from './AdminPage'

/** Last 200 writes: who (role), what, which artifact, the rejection note. */
export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [action, setAction] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api.audit().then(setRows, (e) => setError((e as Error).message)) }, [])
  const shown = useMemo(() => (rows ?? []).filter((r) => !action || r.action === action), [rows, action])
  return <section className="admin-page">
    <h1>İşlem kaydı</h1>
    <p>Her kaydetme, onay, ret, geri alma, silme ve görsel yükleme buraya yazılır; kayıt değiştirilemez.</p>
    <form className="admin-filters" onSubmit={(e) => e.preventDefault()}>
      <div className="form-area"><label htmlFor="audit-action">İşlem</label>
        <select id="audit-action" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">Tümü</option>{Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></div>
    </form>
    {error && <p role="alert" className="area-error">{error}</p>}
    {rows === null ? <p role="status">Yükleniyor…</p> : !shown.length ? <p>Kayıt yok.</p> : <div className="table-wrap"><table className="data-table">
      <thead><tr><th scope="col">Zaman</th><th scope="col">Kim</th><th scope="col">İşlem</th><th scope="col">Eser</th><th scope="col">Not</th></tr></thead>
      <tbody>{shown.map((r, i) => <tr key={i}>
        <td>{when(r.at)}</td><td>{ROLE_LABELS[r.actor as Role] ?? r.actor}</td><td>{ACTIONS[r.action] ?? r.action}</td>
        <td><Link to={`/admin/artifact/${r.artifact_id}`}>{r.artifact_id}</Link></td><td><small>{r.note ?? ''}</small></td>
      </tr>)}</tbody>
    </table></div>}
  </section>
}
