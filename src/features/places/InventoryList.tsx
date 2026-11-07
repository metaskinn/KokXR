import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import type { InventorySection } from '../../domain/inventory'
import { inventory, sectionLabels } from '../../content/inventory'

const PAGE = 60
const collator = new Intl.Collator('tr')
const districts = [...new Set(inventory.map((e) => e.district))].sort(collator.compare)
const sections = Object.keys(sectionLabels) as InventorySection[]

/** Lowercases with Turkish rules so "İznik" and "iznik" both match when searching. */
const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

/** Every foundation building from the printed inventory, filterable by district, kind and whether a 3D scale model exists. */
export default function InventoryList({ artifacts }: { artifacts: Artifact[] }) {
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('')
  const [section, setSection] = useState('')
  const [onlyModel, setOnlyModel] = useState(false)
  const [shown, setShown] = useState(PAGE)

  const hasModel = (artifactId?: string) => !!artifactId && artifacts.some((e) => e.id === artifactId && e.model)
  const results = useMemo(() => {
    const q = fold(query.trim())
    return inventory.filter((e) =>
      (!district || e.district === district) &&
      (!section || e.section === section) &&
      (!onlyModel || (e.hasScaleModel && hasModel(e.artifactId))) &&
      (!q || fold(`${e.name} ${e.group ?? ''}`).includes(q)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, district, section, onlyModel, artifacts])
  const withModel = inventory.filter((e) => e.hasScaleModel && hasModel(e.artifactId)).length
  const update = <T,>(set: (v: T) => void) => (v: T) => { set(v); setShown(PAGE) }

  return <section className="inventory" aria-label="Tüm vakıf eserleri">
    <h2>Tüm vakıf eserleri</h2>
    <p className="inventory-note">
      Liste, Vakıf Katılım'ın "Bursa Vakıf Eserleri" kitabının (3 cilt, 2026) içindekiler bölümünden alındı: {inventory.length} yapı.
      3B maketi yalnızca {withModel} yapının var; listedeki diğer yapılar için henüz maket yok.
    </p>
    <form className="inventory-filters" onSubmit={(e) => e.preventDefault()} role="search">
      <label>Ara
        <input type="search" value={query} onChange={(e) => update(setQuery)(e.target.value)} placeholder="Yapı veya külliye adı" />
      </label>
      <label>İlçe
        <select value={district} onChange={(e) => update(setDistrict)(e.target.value)}>
          <option value="">Tüm ilçeler</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label>Tür
        <select value={section} onChange={(e) => update(setSection)(e.target.value)}>
          <option value="">Tüm türler</option>
          {sections.map((s) => <option key={s} value={s}>{sectionLabels[s]}</option>)}
        </select>
      </label>
      <label className="inventory-check">
        <input type="checkbox" checked={onlyModel} onChange={(e) => update(setOnlyModel)(e.target.checked)} />
        Yalnız 3B maketi olanlar
      </label>
    </form>
    <p className="inventory-count" role="status">{results.length} yapı</p>
    {results.length > 0 ? <ul className="inventory-list">
      {results.slice(0, shown).map((e) => {
        const model = e.hasScaleModel && hasModel(e.artifactId)
        const meta = [e.district, sectionLabels[e.section], e.group].filter(Boolean).join(' · ')
        return <li key={e.id} data-model={model ? 'yes' : 'no'}>
          {model
            ? <Link to={`/places/${e.artifactId}`}><strong>{e.name}</strong><span>{meta}</span><em>3B maket var</em></Link>
            : <div><strong>{e.name}</strong><span>{meta}</span><em>3B maket yok</em></div>}
        </li>
      })}
    </ul> : <p>Bu filtrelere uyan yapı yok.</p>}
    {shown < results.length && <button type="button" className="inventory-more" onClick={() => setShown(shown + PAGE)}>
      Daha fazla göster ({results.length - shown} yapı daha)
    </button>}
  </section>
}
