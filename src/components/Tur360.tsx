import { useState } from 'react'
import type { Tur360 as Tur360Verisi } from '../types/eser'

// Üçüncü taraf oynatıcı, kullanıcı başlatana kadar yüklenmez.
export default function Tur360({ tur, ad }: { tur: Tur360Verisi; ad: string }) {
  const [acik, setAcik] = useState(false)
  return <section className="bolum" aria-labelledby="tur360-basligi">
    <h2 id="tur360-basligi">360° tur</h2>
    <p className="etiket">{tur.aciklama}</p>
    {acik
      ? <div className="tur360-cerceve">
          <iframe src={tur.embedUrl} title={`${ad} 360° tur (${tur.saglayici})`} allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking" allowFullScreen loading="lazy" />
        </div>
      : <button className="tur360-baslat" onClick={() => setAcik(true)}>360° turu başlat</button>}
    <p className="kaynak">360° görüntüler: <a href={tur.kaynakUrl} target="_blank" rel="noopener noreferrer">{tur.saglayici}</a></p>
    {acik && <p>Tur açılmıyorsa tarayıcının koruma kalkanı (ör. Brave Shields) engelliyor olabilir. <a href={tur.kaynakUrl} target="_blank" rel="noopener noreferrer">Turu {tur.saglayici} sitesinde yeni sekmede aç</a>.</p>}
  </section>
}
