import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Artifact } from '../../domain/artifact'

/** Location of one artifact: "yapi" = matched to a real OpenStreetMap feature, "ilce" = only the district is known (district centre). */
export interface ArtifactLocation { p: [number, number]; k: 'yapi' | 'mahalle' | 'ilce'; osm?: string; m?: string }
export type Locations = Record<string, ArtifactLocation>

export interface ModelPin { id: string; no: number; name: string; district: string; position: [number, number] }

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Popup body as DOM, so its links navigate inside the app instead of reloading the page. */
function popup(go: (to: string) => void, title: string, line: string, links: { to: string; label: string }[], list = false) {
  const box = document.createElement('div')
  box.className = 'hm-popup'
  const h = box.appendChild(document.createElement('strong'))
  h.textContent = title
  const p = box.appendChild(document.createElement('p'))
  p.textContent = line
  const parent = list ? box.appendChild(document.createElement('ul')) : box
  for (const l of links) {
    const a = (list ? parent.appendChild(document.createElement('li')) : box).appendChild(document.createElement('a'))
    a.href = l.to
    a.textContent = l.label
    a.addEventListener('click', (e) => { e.preventDefault(); go(l.to) })
  }
  return box
}

/**
 * The city's artifacts on an OpenStreetMap base map. Model buildings are numbered green hexagons (as in the list);
 * other artifacts are grey dots at their OSM position. Artifacts whose building could not be located are not given
 * a made-up point: they are counted on one dashed marker at their district centre.
 */
export default function HeritageMap({ city, artifacts, locations, models, highlight, setHighlight }: {
  city: string
  artifacts: Artifact[]
  locations: Locations
  models: ModelPin[]
  highlight: string | null
  setHighlight: (id: string | null) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const modelMarkers = useRef(new Map<string, L.Marker>())
  const navigate = useNavigate()
  const go = useRef(navigate)
  go.current = navigate
  const hover = useRef(setHighlight)
  hover.current = setHighlight
  const [count, setCount] = useState({ exact: 0, approx: 0, districts: 0, mahalle: 0 })

  useEffect(() => {
    const el = box.current
    if (!el) return
    const map = L.map(el, { zoomControl: true, scrollWheelZoom: true, wheelPxPerZoomLevel: 90, attributionControl: true, preferCanvas: true })
    map.attributionControl.setPrefix(false)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> katkıcıları',
    }).addTo(map)
    const nav = (to: string) => go.current(to)
    // A wide hit tolerance gives the small dots a touch target of about 44 px.
    const renderer = L.canvas({ tolerance: 16, padding: 0.5 })
    const dot = { radius: 6, weight: 1.5, color: '#ffffff', fillColor: css('--ink-2') || '#4b5652', fillOpacity: 1, renderer }
    const points: L.LatLngExpression[] = []
    const modelIds = new Set(models.map((m) => m.id))
    const byDistrict = new Map<string, { at: [number, number]; list: Artifact[] }>()
    const byMahalle = new Map<string, { at: [number, number]; name: string; list: Artifact[] }>()
    let exact = 0

    // An artifact added in the admin panel has no entry in the location file: its own marked point wins, otherwise its district centre.
    const districtCentre = new Map<string, [number, number]>()
    for (const a of artifacts) { const l = locations[a.id]; if (l?.k === 'ilce') districtCentre.set(`${a.city}|${a.district}`, l.p) }
    const locationOf = (a: Artifact): ArtifactLocation | undefined => a.location ? { p: [a.location.lng, a.location.lat], k: 'yapi' }
      : locations[a.id] ?? (districtCentre.has(`${a.city}|${a.district}`) ? { p: districtCentre.get(`${a.city}|${a.district}`)!, k: 'ilce' } : undefined)
    for (const a of artifacts) {
      if (modelIds.has(a.id)) continue
      const loc = locationOf(a)
      if (!loc) continue
      const ll: [number, number] = [loc.p[1], loc.p[0]]
      if (loc.k === 'ilce') {
        const d = byDistrict.get(a.district) ?? { at: ll, list: [] }
        d.list.push(a)
        byDistrict.set(a.district, d)
        continue
      }
      if (loc.k === 'mahalle') {
        const key = `${a.district}|${loc.p.join(',')}`
        const d = byMahalle.get(key) ?? { at: ll, name: loc.m ? `${loc.m}, ${a.district}` : a.district, list: [] }
        d.list.push(a)
        byMahalle.set(key, d)
        continue
      }
      exact++
      points.push(ll)
      L.circleMarker(ll, dot).addTo(map)
        .bindTooltip(a.name, { direction: 'top', offset: [0, -6] })
        .bindPopup(() => popup(nav, a.name, `${a.district}, ${a.city}`, [{ to: `/artifact/${a.id}`, label: 'Eser sayfası' }]))
    }

    // Neighbourhood level: the building is not on the map, only the mahalle named in its history text.
    const ring = { radius: 8, weight: 2, color: css('--ink-2') || '#4b5652', dashArray: '3 3', fillColor: '#ffffff', fillOpacity: 0.9, renderer }
    for (const d of byMahalle.values()) {
      points.push(d.at)
      const n = d.list.length
      L.circleMarker(d.at, ring).addTo(map)
        .bindTooltip(n > 1 ? `${d.name}: ${n} eser (yaklaşık)` : `${d.list[0].name} (yaklaşık)`, { direction: 'top', offset: [0, -8] })
        .bindPopup(() => popup(nav, d.name, 'Yaklaşık konum: binanın kendisi haritada bulunamadı; tarihçesinde geçen mahalle, köy ya da sokak gösteriliyor.',
          d.list.map((a) => ({ to: `/artifact/${a.id}`, label: a.name })), true))
    }

    for (const [district, d] of byDistrict) {
      points.push(d.at)
      const n = d.list.length
      const icon = L.divIcon({ className: 'hm-district', html: `<span>${n}</span>`, iconSize: [44, 44] })
      L.marker(d.at, { icon, keyboard: true, title: `${district}: konumu bulunamayan ${n} eser`, alt: `${district}: konumu bulunamayan ${n} eser` }).addTo(map)
        .bindPopup(() => popup(nav, district, `Bu ${n} eserin binası haritada bulunamadı; işaret yalnız ilçe merkezini gösterir.`,
          [{ to: `/artifacts?sehir=${encodeURIComponent(d.list[0].city)}&ilce=${encodeURIComponent(district)}`, label: `${district}'daki eserleri gör` }]))
    }

    modelMarkers.current.clear()
    for (const m of models) {
      const ll: [number, number] = [m.position[1], m.position[0]]
      points.push(ll)
      const icon = L.divIcon({ className: 'hm-model', html: `<span>${m.no}</span>`, iconSize: [44, 44] })
      const mk = L.marker(ll, { icon, keyboard: true, zIndexOffset: 1000, title: `${m.no}. ${m.name}, ${m.district}: maketi aç`, alt: `${m.no}. ${m.name}: maketi aç` }).addTo(map)
      mk.on('click', () => nav(`/places/${m.id}`))
      mk.on('keypress', (e) => { const k = (e.originalEvent as KeyboardEvent).key; if (k === 'Enter' || k === ' ') nav(`/places/${m.id}`) })
      mk.on('mouseover', () => hover.current(m.id))
      mk.on('mouseout', () => hover.current(null))
      mk.bindTooltip(m.name, { direction: 'top', offset: [0, -20] })
      modelMarkers.current.set(m.id, mk)
    }

    // With models, open on them (they sit close together in the centre and would overlap at province scale); zooming out shows the rest.
    const start = models.length ? models.map((m): [number, number] => [m.position[1], m.position[0]]) : points
    if (start.length) map.fitBounds(L.latLngBounds(start), { padding: [36, 36], maxZoom: 15 })
    else map.setView([39, 35], 6)
    setCount({ exact, approx: [...byDistrict.values()].reduce((t, d) => t + d.list.length, 0), districts: byDistrict.size, mahalle: [...byMahalle.values()].reduce((t, d) => t + d.list.length, 0) })
    const resize = new ResizeObserver(() => map.invalidateSize())
    resize.observe(el)
    return () => { resize.disconnect(); map.remove() }
  }, [city, artifacts, locations, models])

  useEffect(() => {
    for (const [id, mk] of modelMarkers.current) mk.getElement()?.toggleAttribute('data-highlight', id === highlight)
  }, [highlight])

  return <figure className="vr-map-wrapper hm">
    <div ref={box} className="vr-map hm-map" role="region" aria-label={`${city} eser haritası`} />
    <figcaption className="hm-legend">
      {models.length > 0 && <span><i className="hm-key-model" aria-hidden="true" />Maketi olan yapı ({models.length})</span>}
      <span><i className="hm-key-dot" aria-hidden="true" />Eser ({count.exact})</span>
      {count.mahalle > 0 && <span><i className="hm-key-mahalle" aria-hidden="true" />Yaklaşık konum: mahalle, köy ya da sokak ({count.mahalle})</span>}
      {count.approx > 0 && <span><i className="hm-key-district" aria-hidden="true" />Yalnız ilçesi bilinen eserler, ilçe merkezinde ({count.approx} eser, {count.districts} ilçe)</span>}
    </figcaption>
  </figure>
}
