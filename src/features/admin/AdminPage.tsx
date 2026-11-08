import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, ROLE_LABELS, STATUS_LABELS } from '../../infrastructure/api'
import type { AdminRow, Role, Status } from '../../infrastructure/api'
import { useAdmin } from './context'

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const PAGE = 50
export const ACTIONS: Record<string, string> = { save: 'kaydetti', approve: 'onayladı', reject: 'reddetti', discard: 'değişikliği geri aldı', delete: 'sildi', upload: 'için görsel yükledi' }
export const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
export const when = (iso: string) => new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })

/** Session state shared by the list and the form: undefined = checking, null = signed out, 'offline' = no API here. */
export function useSession() {
  const [role, setRole] = useState<Role | null | 'offline' | undefined>(undefined)
  useEffect(() => {
    api.session().then((s) => setRole(s.role), (e) => setRole(e instanceof ApiError && e.status === 0 ? 'offline' : null))
  }, [])
  return [role, setRole] as const
}

export function SessionGate({ role, setRole, children }: { role: ReturnType<typeof useSession>[0]; setRole: (r: Role | null) => void; children: (role: Role) => React.ReactNode }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (role === undefined) return <p role="status">Oturum kontrol ediliyor…</p>
  if (role === 'offline') return <p className="admin-note" role="alert">Yönetim sunucusuna bu ortamdan ulaşılamıyor. İçerik yönetimi için uygulamayı sunucuyla çalıştırın (<code>npm run dev</code> veya Vercel sürümü).</p>
  if (role) return <>{children(role)}</>
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try { setRole((await api.login(password)).role); setPassword('') }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }
  return <form className="admin-login" onSubmit={submit} aria-describedby="login-help">
    <h2>Giriş</h2>
    <p id="login-help">Editörler eser ekler ve düzenler; değişiklikler küratör onayından sonra yayımlanır.</p>
    <div className="form-area"><label htmlFor="admin-password">Şifre</label>
      <input id="admin-password" type="password" autoComplete="current-password" required maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} />
      {error && <p id="login-error" className="area-error" role="alert">{error}</p>}
    </div>
    <button type="submit" disabled={busy || !password}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
  </form>
}

/** /admin/eserler and /admin/onay (the same list, starting on "Onay bekliyor"). */
export default function ArtifactsAdminPage({ queue = false }: { queue?: boolean }) {
  const { role, logout, onPublished, refreshPending } = useAdmin()
  return <section className="admin-page">
    <h1>{queue ? 'Onay kuyruğu' : 'Eserler'}</h1>
    {queue && <p>{role === 'curator' ? 'Editörlerin kayıtları burada bekler. Onaylanan kayıt hemen yayımlanır; reddedilen kayıt gerekçesiyle editöre döner.' : 'Kayıtlarınız küratör onayını burada bekler.'}</p>}
    <AdminList key={queue ? 'queue' : 'all'} role={role} onLogout={logout} onPublished={() => { onPublished(); refreshPending() }} preset={queue ? 'pending' : ''} />
  </section>
}

function AdminList({ role, onLogout, onPublished, preset }: { role: Role; onLogout: () => void; onPublished: () => void; preset: Status | '' }) {
  const [rows, setRows] = useState<AdminRow[] | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<Status | ''>(preset)
  const [shown, setShown] = useState(PAGE)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const curator = role === 'curator'

  const load = useCallback(async () => {
    try { setRows(await api.list()) }
    catch (e) { setError((e as Error).message); if (e instanceof ApiError && e.status === 401) onLogout() }
  }, [onLogout])
  useEffect(() => { void load() }, [load])

  async function run(action: () => Promise<unknown>, done: string, published = false) {
    setError(''); setMessage('')
    try { await action(); setMessage(done); await load(); onPublished(); void published }
    catch (e) { setError((e as Error).message) }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, published: 0, rejected: 0 }
    for (const r of rows ?? []) c[r.status]++
    return c
  }, [rows])
  const filtered = useMemo(() => (rows ?? []).filter((r) => (!status || r.status === status) && (!q.trim() || fold(`${r.name} ${r.city} ${r.district}`).includes(fold(q.trim())))), [rows, q, status])

  return <>
    <p role="status">{message}</p>{error && <p role="alert" className="area-error">{error}</p>}

    <form className="admin-filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <div className="form-area"><label htmlFor="admin-q">Ara</label><input id="admin-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} /></div>
      <div className="form-area"><label htmlFor="admin-status">Durum</label>
        <select id="admin-status" value={status} onChange={(e) => { setStatus(e.target.value as Status | ''); setShown(PAGE) }}>
          <option value="">Tümü ({rows?.length ?? 0})</option>
          {(Object.keys(STATUS_LABELS) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]} ({counts[s]})</option>)}
        </select></div>
    </form>
    {rows === null ? <p role="status">Yükleniyor…</p> : !filtered.length ? <p>Bu filtrelere uyan kayıt yok.</p> : <>
      <p>{filtered.length} kayıt</p>
      <ul className="admin-list">{filtered.slice(0, shown).map((r) => <li key={r.id}>
        <h3>{r.name}</h3>
        <p>{r.district}, {r.city} · <span className={`label status-${r.status}`}>{STATUS_LABELS[r.status]}</span>
          {r.status !== 'published' && r.live && <> · yayındaki sürüm görünmeye devam ediyor</>}
          {' '}· {when(r.updated_at)}{r.updated_by && r.updated_by !== 'seed' ? ` (${ROLE_LABELS[r.updated_by as Role] ?? r.updated_by})` : ''}</p>
        {r.status === 'rejected' && r.review_note && <p className="review-note">Ret gerekçesi: {r.review_note}</p>}
        <div className="admin-actions">
          <Link to={`/admin/artifact/${r.id}`}>Düzenle<span className="sr-only">: {r.name}</span></Link>
          {r.live && <Link to={`/artifact/${r.id}`}>Eseri aç<span className="sr-only">: {r.name}</span></Link>}
          {curator && r.status === 'pending' && <button type="button" onClick={() => run(() => api.approve(r.id), `${r.name} onaylandı ve yayımlandı.`, true)}>Onayla<span className="sr-only">: {r.name}</span></button>}
          {curator && r.status === 'pending' && rejecting !== r.id && <button type="button" onClick={() => { setRejecting(r.id); setNote('') }}>Reddet<span className="sr-only">: {r.name}</span></button>}
          {r.status !== 'published' && <button type="button" onClick={() => run(() => api.discard(r.id), r.live ? `${r.name}: bekleyen değişiklik geri alındı.` : `${r.name}: yayımlanmamış kayıt kaldırıldı.`)}>Değişikliği geri al<span className="sr-only">: {r.name}</span></button>}
          {curator && (deleting === r.id
            ? <><button type="button" className="danger" onClick={() => { setDeleting(null); void run(() => api.remove(r.id), `${r.name} silindi.`, true) }}>Silmeyi onayla<span className="sr-only">: {r.name}</span></button><button type="button" onClick={() => setDeleting(null)}>Vazgeç</button></>
            : <button type="button" onClick={() => setDeleting(r.id)}>Sil<span className="sr-only">: {r.name}</span></button>)}
        </div>
        {rejecting === r.id && <form className="reject-form" onSubmit={(e) => { e.preventDefault(); setRejecting(null); void run(() => api.reject(r.id, note), `${r.name} reddedildi.`) }}>
          <div className="form-area"><label htmlFor={`note-${r.id}`}>Ret gerekçesi (editöre gösterilir)</label>
            <textarea id={`note-${r.id}`} required maxLength={1000} rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="admin-actions"><button type="submit" disabled={!note.trim()}>Reddet</button><button type="button" onClick={() => setRejecting(null)}>Vazgeç</button></div>
        </form>}
      </li>)}</ul>
      {filtered.length > shown && <button type="button" onClick={() => setShown(shown + PAGE)}>{Math.min(PAGE, filtered.length - shown)} kayıt daha göster</button>}
    </>}

  </>
}
