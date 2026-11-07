import { Link, useParams } from 'react-router-dom'
import NotFound from '../../shared/ui/NotFound'
import { inventory, inventoryDetails, sectionLabels } from '../../content/inventory'

/** Page for one building of the printed inventory. Shows only what the book states; there is no 3D model or photo until data exists. */
export default function InventoryPage() {
  const { id } = useParams()
  const item = inventory.find((e) => e.id === id)
  if (!item) return <NotFound />
  const d = inventoryDetails[item.id]
  const facts = d ? ([['Yaptıran', d.builder], ['Tarih', d.date], ['Mimar', d.architect], ['Konum', d.location]] as const).filter(([, v]) => v) : []
  return <article className="sayfa inventory-page">
    <Link to="/places">← Tüm mekânlar</Link>
    <header>
      <h1>{item.name}</h1>
      <p>{[item.district, sectionLabels[item.section], item.group].filter(Boolean).join(' · ')}</p>
    </header>
    {d ? <section aria-label="Bilgi">
      <p>{d.summary}</p>
      {facts.length > 0 && <dl className="inventory-facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
      <small>Kaynak: Bursa Vakıf Eserleri, {d.source}</small>
    </section> : <p>Bu yapı için kitaptan alınmış bilgi henüz eklenmedi.</p>}
    <ul className="inventory-missing">
      <li>3B maket: yok</li>
      <li>Fotoğraf: henüz eklenmedi</li>
    </ul>
  </article>
}
