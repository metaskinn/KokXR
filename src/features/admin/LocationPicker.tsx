import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Locations } from '../places/HeritageMap'

type Point = { lng: number; lat: number }

/**
 * Small map in the admin form: a click (or Enter on the focused map) marks the building, the marker can be dragged.
 * It opens on the other artifacts of the same district so the editor sees the neighbourhood, not the whole country.
 */
export default function LocationPicker({ value, onChange, near, label }: {
  value?: Point
  onChange: (p: Point | undefined) => void
  /** Ids of artifacts in the same district (or city), used to centre the map. */
  near: string[]
  label: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const change = useRef(onChange)
  change.current = onChange
  const [locations, setLocations] = useState<Locations | null>(null)

  useEffect(() => {
    let cancel = false
    import('../../content/artifact-locations.json').then((m) => { if (!cancel) setLocations(m.default as unknown as Locations) }, () => { if (!cancel) setLocations({}) })
    return () => { cancel = true }
  }, [])

  useEffect(() => {
    const el = box.current
    if (!el || !locations) return
    const map = L.map(el, { scrollWheelZoom: true, attributionControl: true })
    map.attributionControl.setPrefix(false)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> katkıcıları' }).addTo(map)
    const icon = L.divIcon({ className: 'lp-pin', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28] })
    const place = (p: Point) => {
      if (!marker.current) {
        marker.current = L.marker([p.lat, p.lng], { icon, draggable: true, keyboard: true, title: 'Yapının konumu (sürükleyebilirsin)' }).addTo(map)
        marker.current.on('dragend', () => { const ll = marker.current!.getLatLng(); change.current({ lng: +ll.lng.toFixed(6), lat: +ll.lat.toFixed(6) }) })
      } else marker.current.setLatLng([p.lat, p.lng])
    }
    map.on('click', (e: L.LeafletMouseEvent) => { const p = { lng: +e.latlng.lng.toFixed(6), lat: +e.latlng.lat.toFixed(6) }; place(p); change.current(p) })
    const points = near.map((id) => locations[id]?.p).filter((p): p is [number, number] => !!p).map(([lng, lat]) => L.latLng(lat, lng))
    if (value) { place(value); map.setView([value.lat, value.lng], 17) }
    else if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 16 })
    else map.setView([39, 35], 6)
    mapRef.current = map
    const resize = new ResizeObserver(() => map.invalidateSize())
    resize.observe(el)
    return () => { resize.disconnect(); map.remove(); mapRef.current = null; marker.current = null }
    // The map is built once per district; later value changes move the marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, near.join(',')])

  useEffect(() => {
    if (!value && marker.current) { marker.current.remove(); marker.current = null }
    else if (value && marker.current) marker.current.setLatLng([value.lat, value.lng])
  }, [value])

  return <div className="lp">
    <div ref={box} className="lp-map" role="application" aria-label={label} />
    <div className="lp-row">
      <p role="status">{value ? `Seçilen konum: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Konum seçilmedi: eser haritada ilçe merkezinde "yaklaşık" olarak görünür.'}</p>
      {value && <button type="button" className="btn-ghost" onClick={() => onChange(undefined)}>Konumu kaldır</button>}
    </div>
  </div>
}
