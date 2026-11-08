import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { inventory, inventoryDetails, sectionLabels } from '../../content/inventory'
import { fold } from './AdminPage'
import { useAdmin } from './context'

const PAGE = 50

/** The printed inventory as stored in the database (read-only: it is reference data from the book). */
export default function InventoryAdminPage() {
  const { artifacts } = useAdmin()
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const ids = useMemo(() => new Set(artifacts.map((a) => a.id)), [artifacts])
  const rows = useMemo(() => inventory.filter((e) => !q.trim() || fold(`${e.name} ${e.district} ${e.group ?? ''}`).includes(fold(q.trim()))), [q])
  return <section className="admin-page">
    <h1>Envanter</h1>
    <p>“Bursa Vakıf Eserleri” basılı envanterindeki {inventory.length} yapı. Bu liste kitaptan alınmış başvuru verisidir; panelden değiştirilmez, eser sayfaları ise <Link to="/admin/eserler">Eserler</Link>’den yönetilir.</p>
    <form className="admin-filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <div className="form-area"><label htmlFor="inv-q">Yapı, ilçe veya külliye ara</label><input id="inv-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} /></div>
    </form>
    <p role="status">{rows.length} yapı</p>
    <div className="table-wrap"><table className="data-table">
      <thead><tr><th scope="col">Yapı</th><th scope="col">İlçe</th><th scope="col">Bölüm</th><th scope="col">Cilt</th><th scope="col">Eser sayfası</th><th scope="col">Kaynak</th></tr></thead>
      <tbody>{rows.slice(0, shown).map((e) => {
        const d = inventoryDetails[e.id]
        const page = e.artifactId && ids.has(e.artifactId) ? e.artifactId : undefined
        return <tr key={e.id}>
          <th scope="row">{e.name}{e.group && <><br /><small>{e.group}</small></>}</th>
          <td>{e.district}</td><td>{sectionLabels[e.section]}</td><td className="num">{e.volume}</td>
          <td>{page ? <Link to={`/admin/artifact/${page}`}>{page}</Link> : <span className="chip chip-warn">Yok</span>}</td>
          <td><small>{d?.source ?? '—'}</small></td>
        </tr>
      })}</tbody>
    </table></div>
    {rows.length > shown && <button type="button" onClick={() => setShown(shown + PAGE)}>{Math.min(PAGE, rows.length - shown)} yapı daha göster</button>}
  </section>
}
