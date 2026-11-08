import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../infrastructure/api'
import type { MediaRow } from '../../infrastructure/api'
import { when } from './AdminPage'

const nf = new Intl.NumberFormat('tr-TR')
const size = (b: number) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`

/** Files in the private bucket. Thumbnails load through /api/media (short-lived presigned URLs). */
export default function MediaPage() {
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MediaRow[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 300); return () => clearTimeout(t) }, [q])
  useEffect(() => {
    let live = true
    setBusy(true); setError('')
    api.media(query, 0).then((r) => { if (live) { setItems(r.items); setTotal(r.total) } }, (e) => live && setError((e as Error).message)).finally(() => live && setBusy(false))
    return () => { live = false }
  }, [query])
  async function more() {
    setBusy(true)
    try { const r = await api.media(query, items.length); setItems([...items, ...r.items]); setTotal(r.total) }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  return <section className="admin-page">
    <h1>Medya</h1>
    <p>Eser fotoğrafları Neon Object Storage’daki <strong>özel</strong> depoda durur; sitede yalnız süreli imzalı adresle gösterilir. Yeni görsel, eser formundaki “Bilgisayardan görsel yükle” ile eklenir ve künye/izin bilgisi ister.</p>
    <form className="admin-filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <div className="form-area"><label htmlFor="media-q">Dosya veya eser kimliği ara</label><input id="media-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ör. ulu-mosque" /></div>
    </form>
    {error && <p role="alert" className="area-error">{error}</p>}
    <p role="status">{total === null ? 'Yükleniyor…' : `${nf.format(total)} dosya${query ? ` (“${query}”)` : ''}`}</p>
    <ul className="media-grid">{items.map((m) => {
      const artifactId = m.artifact_id ?? ''
      return <li key={m.key}>
        <a href={`/api/media/${m.key}`} target="_blank" rel="noreferrer" className="media-thumb">
          <img src={`/api/media/${m.key}`} alt="" loading="lazy" />
        </a>
        <p className="media-name" title={m.key}>{m.key.split('/').pop()}</p>
        <p className="media-meta">{artifactId && <Link to={`/admin/artifact/${artifactId}`}>{artifactId}</Link>}<br />{size(m.size)} · {m.source === 'upload' ? 'panelden' : 'ilk aktarım'} · {when(m.uploaded_at)}</p>
      </li>
    })}</ul>
    {total !== null && items.length < total && <button type="button" disabled={busy} onClick={more}>{busy ? 'Yükleniyor…' : `${Math.min(48, total - items.length)} dosya daha göster`}</button>}
  </section>
}
