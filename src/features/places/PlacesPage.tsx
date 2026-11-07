import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import ArtifactExplorer from '../heritage/components/ArtifactExplorer'
import NotFound from '../../shared/ui/NotFound'
import { RELIEF, mapPoint, loadMap, separateMarkers } from '../../content/turkeyMap'
import type { MapId, MapData } from '../../content/turkeyMap'
import { vrCities } from '../../content/vrArtifacts'
import InventoryList from './InventoryList'
import './places.css'

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

/** Lazy-loads the map; the previous one stays on screen until the new one arrives. */
function useMapData(identity: MapId) {
  const [state, setState] = useState<{ data: MapData | null; error: MapId | null }>({ data: null, error: null })
  useEffect(() => {
    let cancel = false
    loadMap(identity).then(
      (data) => { if (!cancel) setState({ data, error: null }) },
      () => { if (!cancel) setState((d) => ({ ...d, error: identity })) },
    )
    return () => { cancel = true }
  }, [identity])
  return { data: state.data?.id === identity ? state.data : null, previous: state.data, error: state.error === identity }
}

interface Marker {
  id: string
  name: string
  alt?: string
  position: [number, number]
  label: string
  no?: number
  closedState?: boolean
  to?: string
  selected?: boolean
  click?: () => void
}

const Layers = ({ v }: { v: MapData }) => {
  const k = v.layer
  return <>
    <rect className="k-land" width={v.g} height={v.y} />
    <image href={RELIEF[v.id]} width={v.g} height={v.y} preserveAspectRatio="none" />
    {k.country && <path className="k-neighbor" fillRule="evenodd" d={`M0 0H${v.g}V${v.y}H0z${k.country}`} />}
    {k.park && <path className="k-park" d={k.park} />}
    {k.town && <path className="k-town" d={k.town} />}
    {k.land && <path className="k-sea" fillRule="evenodd" d={k.land} />}
    {k.sea && <path className="k-sea" d={k.sea} />}
    {k.lake && <path className="k-lake" d={k.lake} />}
    {k.river && <path className="k-river" d={k.river} />}
    {k.province && <path className="k-province" d={k.province} />}
    {k.special && <path className="k-special" d={k.special} />}
    {k.country && <path className="k-country" d={k.country} />}
    {k.street && <path className="k-yol k-sokak" d={k.street} />}
    {k.tertiary && <path className="k-yol k-ucuncul" d={k.tertiary} />}
    {k.secondary && <><path className="k-zarf k-ikincil-z" d={k.secondary} /><path className="k-yol k-ikincil" d={k.secondary} /></>}
    {k.ana && <><path className="k-zarf k-ana-z" d={k.ana} /><path className="k-yol k-ana" d={k.ana} /></>}
    {k.motorway && <><path className="k-zarf k-otoyol-z" d={k.motorway} /><path className="k-yol k-otoyol" d={k.motorway} /></>}
    {k.ray && <path className="k-rail" d={k.ray} />}
  </>
}

function MapView({ data, markers, highlight, setHighlight, note }: {
  data: MapData
  markers: Marker[]
  highlight: string | null
  setHighlight: (id: string | null) => void
  note?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [viewMode, setView] = useState({ z: 1, cx: data.g / 2, cy: data.y / 2 })
  const zMax = data.zMax
  const zoomsIn = zMax > 1

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const g = new ResizeObserver(measure)
    g.observe(el)
    return () => g.disconnect()
  }, [])

  const { w, h } = size
  const base = w && h ? Math.max(w / data.g, h / data.y) : 1
  const clamp = useCallback((g: { z: number; cx: number; cy: number }) => {
    const z = Math.max(1, Math.min(zMax, g.z)), s = base * z
    const vw = w / s, vh = h / s
    return {
      z,
      cx: vw >= data.g ? data.g / 2 : Math.max(vw / 2, Math.min(data.g - vw / 2, g.cx)),
      cy: vh >= data.y ? data.y / 2 : Math.max(vh / 2, Math.min(data.y - vh / 2, g.cy)),
    }
  }, [base, w, h, data.g, data.y, zMax])
  const { z, cx, cy } = clamp(viewMode)
  const s = base * z
  const vx = cx - w / s / 2, vy = cy - h / s / 2

  /** Zooms so that the screen point (px, py) stays in place. */
  const zoomIn = useCallback((multiplier: number, px?: number, py?: number) => {
    setView((previous) => {
      const g = clamp(previous)
      const s0 = base * g.z, zNew = Math.max(1, Math.min(zMax, g.z * multiplier)), s1 = base * zNew
      const ax = px ?? w / 2, ay = py ?? h / 2
      const dx = ax - w / 2, dy = ay - h / 2
      return clamp({ z: zNew, cx: g.cx + dx / s0 - dx / s1, cy: g.cy + dy / s0 - dy / s1 })
    })
  }, [clamp, base, w, h, zMax])

  // Wheel: takes over page scrolling only if the map can actually zoom.
  useEffect(() => {
    const el = box.current
    if (!el || !zoomsIn) return
    const onWheel = (e: WheelEvent) => {
      const canZoom = e.deltaY < 0 ? z < zMax : z > 1
      if (!canZoom) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomIn(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomIn, zoomsIn, z, zMax])

  // Drag and pinch zoom. Gestures starting on a marker or button do not pan, so clicks keep working.
  const fingers = useRef(new Map<number, { x: number; y: number }>())
  const begin = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('a, button') || !zoomsIn) return
    e.currentTarget.setPointerCapture(e.pointerId)
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = fingers.current, previous = p.get(e.pointerId)
    if (!previous) return
    const fresh = { x: e.clientX, y: e.clientY }
    if (p.size === 2) {
      const other = [...p.entries()].find(([k]) => k !== e.pointerId)![1]
      const d0 = Math.hypot(previous.x - other.x, previous.y - other.y), d1 = Math.hypot(fresh.x - other.x, fresh.y - other.y)
      const r = e.currentTarget.getBoundingClientRect()
      if (d0 > 0) zoomIn(d1 / d0, (fresh.x + other.x) / 2 - r.left, (fresh.y + other.y) / 2 - r.top)
    } else {
      setView((g0) => { const g = clamp(g0), k = base * g.z; return clamp({ ...g, cx: g.cx - (fresh.x - previous.x) / k, cy: g.cy - (fresh.y - previous.y) / k }) })
    }
    p.set(e.pointerId, fresh)
  }
  const release = (e: ReactPointerEvent<HTMLDivElement>) => { fingers.current.delete(e.pointerId) }

  const layers = useMemo(() => <Layers v={data} />, [data])

  const real = useMemo(() => markers.map((i) => {
    const n = mapPoint(data, i.position)
    return { x: (n.x - vx) * s, y: (n.y - vy) * s }
  }), [markers, data, vx, vy, s])
  const places = useMemo(() => (w ? separateMarkers(real, w, h) : []), [real, w, h])

  const zDegree = z >= 4.5 ? 3 : z >= 1.7 ? 2 : 1
  // The zoom-in button zooms toward the centre of visible markers: toward buildings, not empty terrain.
  const visibleOnes = real.filter((n) => n.x >= 0 && n.y >= 0 && n.x <= w && n.y <= h)
  const focusX = visibleOnes.length ? visibleOnes.reduce((t, n) => t + n.x, 0) / visibleOnes.length : undefined
  const focusY = visibleOnes.length ? visibleOnes.reduce((t, n) => t + n.y, 0) / visibleOnes.length : undefined
  // On narrow screens the country map's general labels collide with markers; marker labels are enough.
  const narrow = data.id === 'turkey' && w < 520
  const textPx = (n: number) => n / s

  return <figure className="vr-map-wrapper">
    <div ref={box} className="vr-map" data-kind={data.id === 'turkey' ? 'country' : 'city'} data-z={zDegree} data-slider={z > 1 ? 'yes' : 'no'} data-near={data.id === 'turkey' ? 'no' : 'yes'}
      style={{ aspectRatio: `${data.g} / ${data.y}` }}
      onPointerDown={begin} onPointerMove={drag} onPointerUp={release} onPointerCancel={release}>
      {w > 0 && <svg viewBox={`${vx} ${vy} ${w / s} ${h / s}`} role="img" aria-label={`${data.name} haritası`}>
        {layers}
        {data.label.filter((e) => (!e.z || z >= e.z) && (!narrow || e.name === 'Karadeniz')).map((e) => <g key={e.name} className={`e-${e.kind}`}>
          {e.kind === 'peak' && <path d={`M${e.x - textPx(6)} ${e.y + textPx(5)}L${e.x} ${e.y - textPx(6)}L${e.x + textPx(6)} ${e.y + textPx(5)}z`} />}
          {e.kind === 'city' && <circle cx={e.x} cy={e.y} r={textPx(2.5)} />}
          <text x={e.x + (e.kind === 'sea' ? 0 : textPx(8))} y={e.y + textPx(4)} fontSize={textPx(e.kind === 'sea' ? 13 : 12)} strokeWidth={textPx(3)} textAnchor={e.kind === 'sea' ? 'middle' : 'start'}>{e.name}</text>
          {e.alt && <text x={e.x + textPx(8)} y={e.y + textPx(17)} fontSize={textPx(10.5)} strokeWidth={textPx(3)}>{e.alt}</text>}
        </g>)}
      </svg>}
      {w > 0 && <svg className="vr-link" width={w} height={h} aria-hidden="true" focusable="false">
        {markers.map((i, n) => {
          const a = real[n], b = places[n]
          const visible = a.x >= 0 && a.y >= 0 && a.x <= w && a.y <= h
          if (!b || !visible) return null
          const shifted = Math.hypot(a.x - b.x, a.y - b.y) > 4
          return <g key={i.id} data-highlight={highlight === i.id ? 'yes' : undefined}>
            {shifted && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />}
            {shifted && <circle cx={a.x} cy={a.y} r={3} />}
          </g>
        })}
      </svg>}
      {w > 0 && <div className="vr-markers" role="group" aria-label={`${data.name} haritasındaki işaretler`}>
        {markers.map((i, n) => {
          const b = places[n], a = real[n]
          if (!b) return null
          const atEdge = a.x < 0 || a.y < 0 || a.x > w || a.y > h
          const content = <>
            <span className="vr-marker-point" aria-hidden="true">{i.no}</span>
            <span className="vr-marker-name" aria-hidden="true"><strong>{i.name}</strong>{i.alt && <small>{i.alt}</small>}</span>
          </>
          const common = {
            className: `vr-marker${i.no ? '' : ' vr-city'}`,
            style: { left: b.x, top: b.y },
            'data-highlight': highlight === i.id ? 'yes' : undefined,
            'data-side': b.x + 180 > w ? 'left' : 'right',
            'data-closed-state': i.closedState ? 'yes' : undefined,
            'data-at-edge': atEdge ? 'yes' : undefined,
            'aria-label': i.label,
            onMouseEnter: () => setHighlight(i.id),
            onMouseLeave: () => setHighlight(null),
            onFocus: () => setHighlight(i.id),
            onBlur: () => setHighlight(null),
          }
          return i.to
            ? <Link key={i.id} to={i.to} {...common}>{content}</Link>
            : <button key={i.id} type="button" aria-pressed={!!i.selected} onClick={i.click} {...common}>{content}</button>
        })}
      </div>}
      {note && <p className="vr-map-note">{note}</p>}
      {zoomsIn && <div className="vr-proximity">
        <button type="button" aria-label="Yakınlaştır" disabled={z >= zMax} onClick={() => zoomIn(1.8, focusX, focusY)}>+</button>
        <button type="button" aria-label="Uzaklaştır" disabled={z <= 1} onClick={() => zoomIn(1 / 1.8)}>−</button>
      </div>}
    </div>
    <figcaption className="vr-attribution">
      {data.attribution.map((a, i) => <span key={a}>{i > 0 && ' · '}{a.startsWith('©')
        ? <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{a}</a>
        : a}</span>)}
    </figcaption>
  </figure>
}

export default function PlacesPage({ artifacts }: { artifacts: Artifact[] }) {
  const [param, setParam] = useSearchParams()
  const selected = vrCities.find((s) => s.name === param.get('city'))
  const support = useVrSupport()
  const choose = (city: string | null) => { setHighlight(null); setParam(city ? { city } : {}) }
  const content = (artifactId: string) => artifacts.find((e) => e.id === artifactId && e.model)
  const description = (e: Artifact) => e.model ? 'Temsilî 3B maket: içinde yürü' : "Çini panosunu VR'da onar"
  const [highlight, setHighlight] = useState<string | null>(null)
  const { data, error } = useMapData(selected?.map ?? 'turkey')

  const counts = (s: (typeof vrCities)[number]) => s.buildings.filter((y) => content(y.artifactId)).length
  const markers: Marker[] = selected
    ? selected.buildings.filter((y) => artifacts.some((e) => e.id === y.artifactId)).map((y, i) => ({
      id: y.artifactId,
      name: y.name,
      alt: y.district,
      position: y.position,
      no: i + 1,
      closedState: !content(y.artifactId),
      to: `/artifact/${y.artifactId}`,
      label: `${y.name}, ${y.district}: eser sayfasını aç`,
    }))
    : vrCities.map((s) => {
      const count = counts(s)
      const state = count ? `${count} yapı VR'da açılıyor` : 'Henüz VR yok'
      return { id: s.name, name: s.name, alt: count ? `${count} yapı` : 'Henüz VR yok', position: s.position, closedState: !count, selected: false, click: () => choose(s.name), label: `${s.name}: ${state}. Şehir haritasını aç` }
    })
  const list = (id: string) => ({
    onMouseEnter: () => setHighlight(id),
    onMouseLeave: () => setHighlight(null),
    onFocus: () => setHighlight(id),
    onBlur: () => setHighlight(null),
    'data-highlight': highlight === id ? 'yes' : undefined,
  })

  return <article className="sayfa vr-eserler">
    <header className="vr-title">
      <h1>Mekanlar</h1>
      <p>Haritadan bir şehir seç, o şehirdeki yapıya gir.</p>
      {support === false && <p className="vr-note">Bu tarayıcı VR açamıyor. Gözlükle girmek için bu sayfayı Meta Quest tarayıcısında aç; maketi burada ekranda da gezebilirsin.</p>}
    </header>
    <div className="vr-layout-of">
      {data
        ? <MapView key={data.id} data={data} markers={markers} highlight={highlight} setHighlight={setHighlight}
          note={selected && !selected.buildings.length ? `${selected.name}: Henüz VR yok` : undefined} />
        : <div className="vr-map-empty" role="status">{error ? 'Harita yüklenemedi. Yandaki listeden devam edebilirsin.' : 'Harita yükleniyor…'}</div>}
      <section className="vr-panel" aria-live="polite" aria-label={selected ? `${selected.name} yapıları` : 'Şehirler'}>
        {!selected ? <>
          <h2>Şehirler</h2>
          <ul className="vr-cities">{vrCities.map((s) => {
            const count = counts(s)
            return <li key={s.name}><button type="button" onClick={() => choose(s.name)} {...list(s.name)}>
              <strong>{s.name}</strong><span>{count ? `${count} yapı VR'da açılıyor` : 'Henüz VR yok'}</span>
            </button></li>
          })}</ul>
        </> : <>
          <button type="button" className="vr-backward" onClick={() => choose(null)}>← Haritaya dön</button>
          <h2>{selected.name}</h2>
          {selected.buildings.length > 0 ? <ul className="vr-buildings">{selected.buildings.map((y, i) => {
            const e = content(y.artifactId)
            const no = <b className="vr-no" aria-hidden="true">{i + 1}</b>
            return <li key={y.name}>{e
              ? <Link to={`/places/${y.artifactId}`} {...list(y.artifactId)}>{no}<strong>{y.name}</strong><span>{y.district} · {description(e)}</span></Link>
              : <div className="vr-building-closed-state" {...list(y.artifactId)}>{no}<strong>{y.name}</strong><span>{y.district} · VR henüz yok</span></div>}</li>
          })}</ul> : <p>Bu şehirdeki yapılar için henüz VR içeriği yok.</p>}
          <p className="vr-publication">Envanter: {selected.broadcasts.map((k, i) => <span key={k.address}>{i > 0 && ', '}<a href={k.address} target="_blank" rel="noreferrer">{k.name}</a></span>)} (Vakıf Katılım)</p>
        </>}
      </section>
    </div>
    <InventoryList artifacts={artifacts} />
  </article>
}

export function PlacePage({ artifacts }: { artifacts: Artifact[] }) {
  const { id } = useParams()
  const artifact = artifacts.find((e) => e.id === id)
  const support = useVrSupport()
  if (!artifact?.model) return <NotFound />
  return <article className="sayfa vr-eser" key={artifact.id}>
    <Link to={`/places?city=${encodeURIComponent(artifact.city)}`}>← {artifact.city} yapıları</Link>
    <header className="vr-title">
      <h1>{artifact.name}</h1>
      <p>{artifact.city} · {artifact.district}</p>
      {support === false && <p className="vr-note">Bu tarayıcı VR açamıyor. Gözlükle girmek için bu sayfayı Meta Quest tarayıcısında aç.</p>}
      {support && <p className="vr-note">Sahne yüklenince VR düğmesine bas. Tarayıcılar VR'ı yalnızca bir dokunuşla başlatır.</p>}
    </header>
    {artifact.model && <ArtifactExplorer model={artifact.model} sources={artifact.sources} name={artifact.name} openNow />}
  </article>
}
