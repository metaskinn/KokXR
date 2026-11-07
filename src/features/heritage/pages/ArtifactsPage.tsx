import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Artifact } from '../../../domain/artifact'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'
import UiIcon from '../../../shared/ui/UiIcon'
import { FinderDesktop, FinderMobile, type Facets } from './hub/Finder'
import { collator, countBy, joinTr, locative, passes, sortResults, TYPE_LABELS, typeLabel, typesOf, type Filters } from './hub/hubData'
import ModelStrip from './hub/ModelStrip'
import { PAGE, useHubState, useScrollMemory, useSlashFocus } from './hub/useHubState'
import './artifacts.css'

export default function ArtifactsPage({ artifacts }: { artifacts: Artifact[] }) {
  const { filters, shown, update, clear } = useHubState()
  const searchRef = useRef<HTMLInputElement>(null)
  useSlashFocus(searchRef)

  // The field updates at once; the URL (and so the list) follows 150 ms after the last key, replacing the history entry.
  const [draft, setDraft] = useState(filters.q)
  useEffect(() => { setDraft(filters.q) }, [filters.q])
  useEffect(() => {
    if (draft === filters.q) return
    const t = window.setTimeout(() => update({ q: draft }, { replace: true }), 150)
    return () => window.clearTimeout(t)
  }, [draft, filters.q, update])

  const pick = (patch: Partial<Filters>) => update(patch)

  const typeKeys = useMemo(() => { const c = countBy(artifacts, typesOf); return TYPE_LABELS.map(([k]) => k).filter((k) => c.has(k)) }, [artifacts])
  const cityOrder = useMemo(() => [...countBy(artifacts, (a) => a.city)].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0])).map(([c]) => c), [artifacts])

  const { results, facets, allCities } = useMemo(() => {
    const results = sortResults(artifacts.filter((a) => passes(a, filters)), filters.q)
    const cityBase = artifacts.filter((a) => passes(a, filters, ['city', 'district']))
    const cityCounts = countBy(cityBase, (a) => a.city)
    const districtBase = countBy(artifacts.filter((a) => passes(a, filters, ['district'])), (a) => a.district)
    const districts = [...new Map(artifacts.filter((a) => !filters.city || a.city === filters.city).map((a) => [a.district, a.city]))]
      .map(([name, city]) => ({ name, city, count: districtBase.get(name) ?? 0 }))
      .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name))
    const typeCounts = countBy(artifacts.filter((a) => passes(a, filters, ['type'])), typesOf)
    const facets: Facets = {
      cities: cityOrder.map((c) => [c, cityCounts.get(c) ?? 0]),
      total: cityBase.length,
      districts,
      types: typeKeys.map((k) => [k, typeCounts.get(k) ?? 0] as [string, number]),
      modelCount: artifacts.filter((a) => passes(a, filters, ['model']) && a.model).length,
    }
    // How many results the same search gives without the city and district filters (for the empty state).
    const allCities = filters.city ? cityBase.length : 0
    return { results, facets, allCities }
  }, [artifacts, filters, cityOrder, typeKeys])

  const active = !!(filters.q.trim() || filters.city || filters.district || filters.type || filters.model)
  const modelArtifacts = useMemo(() => artifacts.filter((a) => a.model).sort((a, b) => collator.compare(a.name, b.name)), [artifacts])
  const visible = results.slice(0, shown)
  const remaining = results.length - visible.length
  const saveScroll = useScrollMemory(true)

  const cover = (artifact: Artifact) => artifact.images.find((g) => g.file === artifact.coverImage)
  // Cover credits mostly share a source; they are written once at the page end instead of repeating on every card.
  const credits = [...new Set(artifacts.map((e) => cover(e)?.credit).filter((k): k is string => !!k))]

  // A city without any scale model: say so plainly instead of a generic empty result (brief §10.2).
  const noModelHere = filters.model && !!filters.city && !filters.q.trim() && !filters.district && !filters.type
  const place = filters.district || filters.city
  const q = filters.q.trim()
  const countText = q ? `“${q}” için ${results.length} eser` : place ? `${locative(place)} ${results.length} eser` : `${results.length} eser`
  const chips: [string, Partial<Filters>][] = [
    ...(filters.city ? [[filters.city, { city: '', district: '' }] as [string, Partial<Filters>]] : []),
    ...(filters.district ? [[filters.district, { district: '' }] as [string, Partial<Filters>]] : []),
    ...(filters.type ? [[typeLabel(filters.type), { type: '' }] as [string, Partial<Filters>]] : []),
    ...(filters.model ? [['3B maketli', { model: false }] as [string, Partial<Filters>]] : []),
  ]

  return <section id="artifacts" className="artifacts-section" aria-labelledby="artifacts-title">
    <div className="section-title">
      <h1 id="artifacts-title">Eserler</h1>
      <p className="section-description">{locative(joinTr(cityOrder))}ki {artifacts.length} vakıf eseri.</p>
    </div>
    <div className="hub">
      <FinderDesktop filters={filters} facets={facets} pick={pick} />
      <div className="hub-results">
        <div className="finder">
          <form className="search-field" role="search" onSubmit={(e) => { e.preventDefault(); update({ q: draft }, { replace: true }) }}>
            <label htmlFor="artifact-search">Eser ara</label>
            <div className="search-box">
              <UiIcon name="search" />
              <input id="artifact-search" ref={searchRef} type="search" value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder="Eser veya ilçe adı yaz" autoComplete="off" enterKeyHint="search" />
              <kbd aria-hidden="true">/</kbd>
            </div>
          </form>
          <FinderMobile filters={filters} facets={facets} pick={pick} />
        </div>

        {!active && <ModelStrip artifacts={modelArtifacts} onOpen={saveScroll} />}

        <div className="result-head">
          <p className="result-count" role="status">{countText}</p>
          {active && <ul className="active-filters" aria-label="Etkin filtreler">
            {chips.map(([label, patch]) => <li key={label}>
              <button type="button" onClick={() => pick(patch)} aria-label={`${label} filtresini kaldır`}>{label}<UiIcon name="x" /></button>
            </li>)}
            <li><button type="button" className="btn-ghost clear-filters" onClick={() => { setDraft(''); clear() }}>Filtreleri temizle</button></li>
          </ul>}
        </div>

        {results.length === 0 ? noModelHere ? <div className="empty-state">
          <h2>{locative(filters.city)}ki yapıların henüz maketi yok</h2>
          <p>{locative(filters.city)} {artifacts.filter((a) => a.city === filters.city).length} eser sayfası var.</p>
          <div className="actions"><button type="button" onClick={() => pick({ model: false })}>{filters.city} eserlerini göster</button></div>
        </div> : <div className="empty-state">
          <h2>{q ? `“${q}” adında eser yok` : 'Bu filtrelerle eser yok'}</h2>
          <p>{q ? 'Yazımı kontrol et ya da bir filtreyi kaldır.' : 'Bir filtreyi kaldırarak yeniden dene.'}
            {allCities > 0 && <> Tüm şehirlerde {allCities} sonuç var.</>}</p>
          <div className="actions">
            {allCities > 0 && <button type="button" onClick={() => pick({ city: '', district: '' })}>Tüm şehirlerde göster</button>}
            <button type="button" className="btn-ghost" onClick={() => { setDraft(''); clear() }}>Filtreleri temizle</button>
          </div>
        </div> : <ul className="artifacts">{visible.map((artifact) => <li key={artifact.id}>
          <Link className="artifact-card" to={`/artifact/${artifact.id}`} onClick={saveScroll}>
            {!PUBLIC_BUILD && <div className="card-image">
              {artifact.coverImage && <img className="cover" src={artifact.coverImage} alt={cover(artifact)?.alt ?? artifact.name} loading="lazy" />}
            </div>}
            <div className="card-content">
              <h2>{artifact.name}</h2>
              <p className="position">{artifact.district}, {artifact.city}</p>
              <p className="card-summary">{artifact.summary}</p>
              {artifact.model && <span className="badge-model"><UiIcon name="cube" />3B maket · VR</span>}
            </div>
          </Link>
        </li>)}</ul>}

        {remaining > 0 && <div className="load-more">
          <button type="button" onClick={() => update({}, { replace: true, n: shown + PAGE })}>
            {remaining > PAGE ? `${PAGE} eser daha göster (kalan ${remaining})` : `Kalan ${remaining} eseri göster`}
          </button>
          <p>{visible.length} / {results.length} eser gösteriliyor</p>
        </div>}

        {!PUBLIC_BUILD && credits.length > 0 && <p className="photo-credit artifacts-credit">Kapak fotoğrafları: {credits.map((k) => k.replace(/^Fotoğraf:\s*/, '')).join('; ')}</p>}
      </div>
    </div>
  </section>
}

