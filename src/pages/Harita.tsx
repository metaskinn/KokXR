import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Eser } from '../types/eser'
import { vrSehirler } from '../data/vrEserler'
import { rotalar } from '../data/rotalar'

// Harita yalnız doğrulanmış koordinatı olan eserleri (eser.konum) işaretler; yoksa şehir düzeyinde işaret ve liste gösterilir.
export default function Harita({ eserler }: { eserler: Eser[] }) {
  const kap = useRef<HTMLDivElement>(null)
  const [rotaId, setRotaId] = useState('')
  const rota = rotalar.find((r) => r.id === rotaId)
  const rotaEserleri = rota ? rota.eserIdleri.map((id) => eserler.find((e) => e.id === id)).filter((e): e is Eser => !!e) : []
  const konumlu = eserler.filter((e) => e.konum)
  const sehirler = [...new Set(eserler.map((e) => e.sehir))]
  useEffect(() => {
    if (!kap.current) return
    const harita = L.map(kap.current, { scrollWheelZoom: false }).setView([39.0, 35.0], 6)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap katkıcıları' }).addTo(harita)
    const noktalar: L.LatLngTuple[] = []
    for (const ad of sehirler) {
      const s = vrSehirler.find((v) => v.ad === ad)
      if (!s) continue
      const nokta: L.LatLngTuple = [s.konum[1], s.konum[0]]
      noktalar.push(nokta)
      L.circleMarker(nokta, { radius: 9, color: '#254132', fillColor: '#305240', fillOpacity: 0.85 }).addTo(harita)
        .bindPopup(`${ad}: ${eserler.filter((e) => e.sehir === ad).length} eser`)
    }
    for (const e of konumlu) {
      const nokta: L.LatLngTuple = [e.konum!.enlem, e.konum!.boylam]
      noktalar.push(nokta)
      L.circleMarker(nokta, { radius: 6, color: '#8e6236', fillColor: '#8e6236', fillOpacity: 0.9 }).addTo(harita).bindPopup(e.ad)
    }
    if (rota) {
      const cizgi = rotaEserleri.filter((e) => e.konum).map((e): L.LatLngTuple => [e.konum!.enlem, e.konum!.boylam])
      if (cizgi.length > 1) L.polyline(cizgi, { color: '#8e6236', weight: 4 }).addTo(harita)
    }
    if (noktalar.length > 1) harita.fitBounds(L.latLngBounds(noktalar).pad(0.3), { maxZoom: 9 })
    else if (noktalar.length === 1) harita.setView(noktalar[0], 9)
    return () => { harita.remove() }
  }, [eserler, rotaId])
  return <section className="sayfa" aria-labelledby="harita-basligi">
    <p className="ust-baslik">HARİTA VE ROTALAR</p>
    <h1 id="harita-basligi">Eserleri haritada bul</h1>
    <p>Şehir işaretleri eser sayısını gösterir. Eser işareti yalnız konumu kaynağıyla doğrulanmış eserlerde çıkar; şu an {konumlu.length} eserin doğrulanmış konumu var. Harita çevrimiçi karo gerektirir; bağlantı yoksa aşağıdaki liste kullanılabilir.</p>
    <div ref={kap} className="harita-alani" role="region" aria-label="Eser haritası" />
    <h2>Hazır rotalar</h2>
    <div className="eser-filtre" role="group" aria-label="Rota seç">
      <button type="button" aria-pressed={!rotaId} onClick={() => setRotaId('')}>Rota yok</button>
      {rotalar.map((r) => <button type="button" key={r.id} aria-pressed={rotaId === r.id} onClick={() => setRotaId(r.id)}>{r.ad}</button>)}
    </div>
    {rota && <><p>{rota.aciklama}</p>
      <ol className="rota-listesi">{rotaEserleri.map((e) => <li key={e.id}><Link to={`/eser/${e.id}`}>{e.ad}</Link> <span>{e.ilce}{e.yapiTuru ? ` · ${e.yapiTuru}` : ''}</span></li>)}</ol></>}
    <h2>Tüm eserler</h2>
    <ul className="rota-listesi">{eserler.map((e) => <li key={e.id}><Link to={`/eser/${e.id}`}>{e.ad}</Link> <span>{e.sehir} · {e.ilce}</span></li>)}</ul>
  </section>
}
