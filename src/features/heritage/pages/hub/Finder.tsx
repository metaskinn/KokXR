import { useState } from 'react'
import UiIcon from '../../../../shared/ui/UiIcon'
import { TYPE_LABELS, type Filters } from './hubData'

export interface Facets {
  cities: [string, number][]          // every city with its count under the other filters
  total: number                       // the "Tümü" count
  districts: { name: string; city: string; count: number }[]  // districts of the selected city (all when none), most first
  types: [string, number][]
  modelCount: number
}
type Pick = (patch: Partial<Filters>) => void

const DESKTOP_DISTRICTS = 8

export function FinderDesktop({ filters, facets, pick }: { filters: Filters; facets: Facets; pick: Pick }) {
  const [allDistricts, setAllDistricts] = useState(false)
  const top = facets.districts.slice(0, DESKTOP_DISTRICTS)
  const selected = facets.districts.find((d) => d.name === filters.district)
  const shortList = selected && !top.includes(selected) ? [...top, selected] : top
  const byCity = !filters.city && allDistricts
  const list = allDistricts ? facets.districts : shortList
  const groups = byCity
    ? facets.cities.map(([city]) => [city, [...list].filter((d) => d.city === city).sort((a, b) => a.name.localeCompare(b.name, 'tr'))] as const)
    : [['', list] as const]
  const opt = (name: string, checked: boolean, onChange: () => void, label: string, count?: number) =>
    <label className="opt" data-zero={count === 0 ? '' : undefined} key={label}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>{count !== undefined && <small>{count}</small>}
    </label>
  return <aside className="finder-desktop" aria-label="Filtreler">
    <fieldset><legend>3B maket / AR</legend>
      <label className="opt" data-zero={facets.modelCount === 0 ? '' : undefined}>
        <input type="checkbox" checked={filters.model} onChange={(e) => pick({ model: e.target.checked })} />
        <span>Yalnız maketli (AR dahil)</span><small>{facets.modelCount}</small>
      </label>
    </fieldset>
    <fieldset><legend>Şehir</legend>
      {opt('sehir-d', !filters.city, () => pick({ city: '', district: '' }), 'Tümü', facets.total)}
      {facets.cities.map(([city, n]) => opt('sehir-d', filters.city === city, () => pick({ city, district: '' }), city, n))}
    </fieldset>
    <fieldset><legend>İlçe</legend>
      {opt('ilce-d', !filters.district, () => pick({ district: '' }), 'Tüm ilçeler')}
      {groups.map(([city, items]) => <div key={city || 'all'} className="opt-group">
        {city && <p className="opt-group-title">{city}</p>}
        {items.map((d) => opt('ilce-d', filters.district === d.name, () => pick({ district: d.name, city: d.city }), d.name, d.count))}
      </div>)}
      {facets.districts.length > DESKTOP_DISTRICTS && <button type="button" className="btn-ghost opt-more" aria-expanded={allDistricts} onClick={() => setAllDistricts(!allDistricts)}>
        {allDistricts ? 'Daha az ilçe göster' : `Tüm ilçeler (${facets.districts.length})`}
      </button>}
    </fieldset>
    <fieldset><legend>Tür</legend>
      {opt('tur-d', !filters.type, () => pick({ type: '' }), 'Tüm türler')}
      {facets.types.map(([key, n]) => opt('tur-d', filters.type === key, () => pick({ type: key }), TYPE_LABELS.find(([k]) => k === key)![1], n))}
    </fieldset>
  </aside>
}

export function FinderMobile({ filters, facets, pick }: { filters: Filters; facets: Facets; pick: Pick }) {
  const cells: [string, string, number][] = [['', 'Tümü', facets.total], ...facets.cities.map(([c, n]) => [c, c, n] as [string, string, number])]
  const districtOptions = (items: Facets['districts']) => items.map((d) => <option key={d.name} value={d.name}>{d.name} ({d.count})</option>)
  return <div className="finder-mobile">
    <fieldset className="segment" role="radiogroup" aria-label="Şehir" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map(([value, label, n]) => <label key={label}>
        <input type="radio" name="sehir-m" checked={filters.city === value} onChange={() => pick({ city: value, district: '' })} aria-label={`${label}, ${n} eser`} />
        <strong aria-hidden="true">{label}</strong><small aria-hidden="true">{n}</small>
      </label>)}
    </fieldset>
    <div className="filter-row">
      <div className="select">
        <label className="sr-only" htmlFor="ilce-m">İlçe</label>
        <select id="ilce-m" value={filters.district} onChange={(e) => {
          const d = facets.districts.find((x) => x.name === e.target.value)
          pick({ district: e.target.value, ...(d ? { city: d.city } : {}) })
        }}>
          <option value="">İlçe</option>
          {filters.city
            ? districtOptions([...facets.districts].sort((a, b) => a.name.localeCompare(b.name, 'tr')))
            : facets.cities.map(([city]) => <optgroup key={city} label={city}>
              {districtOptions(facets.districts.filter((d) => d.city === city).sort((a, b) => a.name.localeCompare(b.name, 'tr')))}
            </optgroup>)}
        </select>
        <UiIcon name="down" />
      </div>
      <div className="select">
        <label className="sr-only" htmlFor="tur-m">Tür</label>
        <select id="tur-m" value={filters.type} onChange={(e) => pick({ type: e.target.value })}>
          <option value="">Tür</option>
          {facets.types.map(([key, n]) => <option key={key} value={key}>{TYPE_LABELS.find(([k]) => k === key)![1]} ({n})</option>)}
        </select>
        <UiIcon name="down" />
      </div>
      <button type="button" className="chip-toggle" aria-pressed={filters.model} onClick={() => pick({ model: !filters.model })}>
        <UiIcon name="cube" />3B maket / AR
      </button>
    </div>
  </div>
}
