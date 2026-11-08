import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import ArtifactExplorer from '../heritage/components/ArtifactExplorer'
import NotFound from '../../shared/ui/NotFound'
import type { Locations, ModelPin } from './HeritageMap'
import { vrCities } from '../../content/vrArtifacts'
import UiIcon from '../../shared/ui/UiIcon'
import './places.css'
import './maketler.css'

// Leaflet and the location data load only when the Maketler page opens.
const HeritageMap = lazy(() => import('./HeritageMap'))

function useLocations() {
  const [state, setState] = useState<{ data: Locations | null; error: boolean }>({ data: null, error: false })
  useEffect(() => {
    let cancel = false
    import('../../content/artifact-locations.json').then(
      (m) => { if (!cancel) setState({ data: m.default as unknown as Locations, error: false }) },
      () => { if (!cancel) setState({ data: null, error: true }) },
    )
    return () => { cancel = true }
  }, [])
  return state
}

/** Can this browser open immersive VR? null until known. */
function useVrSupport() {
  const [support, setSupport] = useState<boolean | null>(null)
  useEffect(() => {
    let cancel = false
    void (async () => {
      let supported = false
      try { supported = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { supported = false }
      if (!cancel) setSupport(supported)
    })()
    return () => { cancel = true }
  }, [])
  return support
}

export default function PlacesPage({ artifacts }: { artifacts: Artifact[] }) {
  const [param, setParam] = useSearchParams()
  // The list is the first thing on the page: without ?city= the first city that has models is shown.
  const withModel = (artifactId: string) => artifacts.find((e) => e.id === artifactId && e.model)
  const modelCount = (s: (typeof vrCities)[number]) => s.buildings.filter((y) => withModel(y.artifactId)).length
  const selected = vrCities.find((s) => s.name === param.get('city')) ?? vrCities.find((s) => modelCount(s) > 0) ?? vrCities[0]
  const support = useVrSupport()
  const [highlight, setHighlight] = useState<string | null>(null)
  const choose = (city: string) => { setHighlight(null); setParam({ city }, { replace: true }) }
  const { data, error } = useLocations()
  const total = artifacts.filter((e) => e.model).length
  const pagesIn = (city: string) => artifacts.filter((e) => e.city === city).length

  const buildings = selected.buildings.map((y) => ({ y, artifact: withModel(y.artifactId) })).filter((b): b is { y: typeof b.y; artifact: Artifact } => !!b.artifact)
  const cityArtifacts = useMemo(() => artifacts.filter((e) => e.city === selected.name), [artifacts, selected.name])
  const pins: ModelPin[] = useMemo(() => buildings.map(({ y, artifact }, i) => ({ id: y.artifactId, no: i + 1, name: artifact.name, district: y.district, position: y.position })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artifacts, selected.name])
  const rowEvents = (id: string) => ({
    onMouseEnter: () => setHighlight(id),
    onMouseLeave: () => setHighlight(null),
    onFocus: () => setHighlight(id),
    onBlur: () => setHighlight(null),
  })

  return <article className="sayfa vr-eserler">
    <header className="vr-title">
      <h1>Maketler</h1>
      <p>{total} yapının temsilî 3B maketi var. Ekranda çevirebilir, içinde yürüyebilir, Meta Quest'te VR'da açabilirsin.</p>
      {support === false && <p className="vr-note">Bu tarayıcı VR açamıyor. VR için bu sayfayı Meta Quest tarayıcısında aç.</p>}
    </header>
    <fieldset className="segment city-segment" style={{ gridTemplateColumns: `repeat(${vrCities.length}, minmax(0, 1fr))` }}>
      <legend className="invisible">Şehir</legend>
      {vrCities.map((s) => <label key={s.name}>
        <input type="radio" name="city" value={s.name} checked={s === selected} onChange={() => choose(s.name)} />
        <strong>{s.name}</strong><small>{modelCount(s)} maket</small>
      </label>)}
    </fieldset>
    <div className="vr-layout-of">
      <section className="vr-panel" aria-live="polite" aria-labelledby="vr-panel-title">
        <h2 id="vr-panel-title" className="invisible">{selected.name} maketleri</h2>
        {buildings.length > 0 ? <ol className="vr-buildings">{buildings.map(({ y, artifact }, i) =>
          <li key={y.artifactId} data-highlight={highlight === y.artifactId ? 'yes' : undefined}>
            <span className="vr-no" aria-hidden="true">{i + 1}</span>
            <Link to={`/places/${y.artifactId}`} {...rowEvents(y.artifactId)} data-highlight={highlight === y.artifactId ? 'yes' : undefined}>{artifact.name}</Link>
            <p className="position">{y.district}</p>
            <Link className="btn-ghost" to={`/artifact/${y.artifactId}`} aria-label={`${artifact.name}: eser sayfası`}>Eser sayfası</Link>
          </li>)}</ol>
          : <div className="vr-map-empty">
            <h2>{selected.name}'daki yapıların henüz maketi yok</h2>
            <p>{selected.name}'da {pagesIn(selected.name)} eser sayfası var; fotoğraflarına ve tarihçelerine bakabilirsin.</p>
            <Link className="button" to={`/artifacts?sehir=${encodeURIComponent(selected.name)}`}>{selected.name}'daki eserleri gör</Link>
          </div>}
        {selected.broadcasts.length > 0 && <p className="vr-publication">Envanter: {selected.broadcasts.map((k, i) => <span key={k.address}>{i > 0 && ', '}<a href={k.address} target="_blank" rel="noreferrer">{k.name}</a></span>)} (Vakıf Katılım)</p>}
      </section>
      {data
        ? <Suspense fallback={<div className="vr-map-loading" role="status">Harita yükleniyor…</div>}>
          <HeritageMap city={selected.name} artifacts={cityArtifacts} locations={data} models={pins} highlight={highlight} setHighlight={setHighlight} />
        </Suspense>
        : error
          ? <div className="inline-error" role="alert"><UiIcon name="alert" /><p><strong>Harita yüklenemedi.</strong> Listeden devam edebilirsin.</p></div>
          : <div className="vr-map-loading" role="status">Harita yükleniyor…</div>}
    </div>
  </article>
}

export function PlacePage({ artifacts }: { artifacts: Artifact[] }) {
  const { id } = useParams()
  const artifact = artifacts.find((e) => e.id === id)
  const support = useVrSupport()
  if (!artifact?.model) return <NotFound />
  return <article className="sayfa model-page" key={artifact.id}>
    <div className="model-page-top">
      <Link className="link-back" to={`/artifact/${artifact.id}`}><UiIcon name="back" />{artifact.name}</Link>
      <Link className="btn-ghost" to={`/artifact/${artifact.id}`}>Fotoğraflar ve tarihçe</Link>
    </div>
    <header className="vr-title">
      <h1>{artifact.name}</h1>
      <p>{artifact.district}, {artifact.city}</p>
      {support === false && <p className="vr-note">Bu tarayıcı VR açamıyor. VR için bu sayfayı Meta Quest tarayıcısında aç.</p>}
    </header>
    <ArtifactExplorer model={artifact.model} sources={artifact.sources} name={artifact.name} artifactId={artifact.id} openNow />
  </article>
}
