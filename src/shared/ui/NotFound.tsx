import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UiIcon from './UiIcon'

/**
 * Not-found states. With `artifactSlug` (an unknown `/artifact/:id`) it offers a search prefilled from the address;
 * otherwise it links the three main areas.
 */
export default function NotFound({ artifactSlug }: { artifactSlug?: string }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(() => (artifactSlug ?? '').replace(/[-_]+/g, ' ').trim())
  if (artifactSlug === undefined) return <section className="state-block">
    <h1>Sayfa bulunamadı</h1>
    <p>Bu adreste bir sayfa yok. Şuradan devam edebilirsin:</p>
    <ul className="state-links">
      <li><Link to="/artifacts">Eserler</Link></li>
      <li><Link to="/places">Maketler</Link></li>
      <li><Link to="/workshops">Atölyeler</Link></li>
    </ul>
  </section>
  return <section className="state-block">
    <h1>Bu adreste eser yok</h1>
    <p>Adres yanlış yazılmış ya da eser kaldırılmış olabilir. Adı yazarak ara.</p>
    <form className="search-field not-found-search" role="search" onSubmit={(e) => {
      e.preventDefault()
      const q = query.trim()
      navigate(q ? `/artifacts?${new URLSearchParams({ q })}` : '/artifacts')
    }}>
      <label htmlFor="not-found-q">Eser ara</label>
      <div className="search-row">
        <div className="search-box"><UiIcon name="search" /><input id="not-found-q" name="q" type="search" enterKeyHint="search" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button type="submit">Ara</button>
      </div>
    </form>
    <p><Link className="link-back" to="/artifacts"><UiIcon name="back" />Eserlere dön</Link></p>
  </section>
}
