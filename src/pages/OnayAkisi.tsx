import { useState } from 'react'
import DemoEtiketi from '../components/DemoEtiketi'
import './mokap.css'

type Durum = 'bekliyor' | 'onaylandi' | 'reddedildi'

const durumEtiketi: Record<Durum, string> = { bekliyor: 'Onay bekliyor', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi' }

// Yer tutucu öneriler: gerçek bir esere veya tarihsel bilgiye bağlı değildir.
const oneriler = [
  { id: 'a', baslik: 'Örnek öneri 1: Bilgi kartı düzeltmesi', metin: 'Yer tutucu metin: bir bilgi kartının yazımı için düzeltme önerisi.', oneren: 'Öğretmen (örnek)', inceleyen: 'Küratör (örnek)' },
  { id: 'b', baslik: 'Örnek öneri 2: Yeni test sorusu', metin: 'Yer tutucu metin: bir eserin testine eklenecek soru önerisi.', oneren: 'Öğretmen (örnek)', inceleyen: 'Akademisyen (örnek)' },
  { id: 'c', baslik: 'Örnek öneri 3: Görsel açıklaması', metin: 'Yer tutucu metin: bir fotoğrafın açıklaması için öneri.', oneren: 'Öğrenci (örnek)', inceleyen: 'Küratör (örnek)' },
]

export default function OnayAkisi() {
  const [durumlar, setDurumlar] = useState<Record<string, Durum>>({})
  const durumu = (id: string): Durum => durumlar[id] ?? 'bekliyor'
  const sayi = (d: Durum) => oneriler.filter((o) => durumu(o.id) === d).length
  // Seçili karara yeniden basmak öneriyi beklemeye döndürür; düğmeler yerinde kaldığı için odak kaybolmaz.
  const karar = (id: string, d: Durum) => setDurumlar({ ...durumlar, [id]: durumu(id) === d ? 'bekliyor' : d })

  return <section className="sayfa mokap" aria-labelledby="onay-basligi">
    <DemoEtiketi />
    <p className="ust-baslik">İÇERİK ONAY AKIŞI</p>
    <h1 id="onay-basligi">Öneriden karara</h1>
    <p className="mokap-not">Bu ekran yalnız akışı gösterir. Öneriler ve roller örnektir, kararlar sayfa yenilenince silinir. Uygulamadaki hiçbir içerik bu ekranla değişmez ve burada onaylanmış sayılmaz.</p>

    <div className="mokap-ozet">
      <p role="status">{durumEtiketi.bekliyor}: {sayi('bekliyor')} · {durumEtiketi.onaylandi}: {sayi('onaylandi')} · {durumEtiketi.reddedildi}: {sayi('reddedildi')}</p>
      <button type="button" className="mokap-ikincil-dugme" onClick={() => setDurumlar({})}>Örneği sıfırla</button>
    </div>

    <ul className="mokap-kartlar mokap-kartlar-uclu" aria-label="Örnek öneriler">{oneriler.map((o) => {
      const d = durumu(o.id)
      return <li className="mokap-kart" key={o.id}>
        <span className={`mokap-durum mokap-durum-${d}`}>{durumEtiketi[d]}</span>
        <h2>{o.baslik}</h2>
        <p>{o.metin}</p>
        <p className="mokap-ikincil">Öneren: {o.oneren}<br />İnceleyen: {o.inceleyen}</p>
        <div className="mokap-eylemler" role="group" aria-label={`${o.baslik} için karar`}>
          <button type="button" aria-pressed={d === 'onaylandi'} onClick={() => karar(o.id, 'onaylandi')}>Onayla</button>
          <button type="button" aria-pressed={d === 'reddedildi'} onClick={() => karar(o.id, 'reddedildi')}>Reddet</button>
        </div>
      </li>
    })}</ul>
  </section>
}
