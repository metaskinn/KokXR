import type { Eser } from '../types/eser'
import type { UstKatman } from '../data'
import { onayBekleyenler } from '../data/onay'
import type { OnayDurumu, OnayHaritasi } from '../data/onay'
import type { Katki, KatkiDurumu } from '../data/katki'
import './mokap.css'

const durumEtiketi: Record<OnayDurumu, string> = { beklemede: 'Onay bekliyor', onaylandi: 'Onaylandı, yayında', reddedildi: 'Reddedildi, yayında değil' }

interface Props { eserler: Eser[]; ustKatman: UstKatman; onay: OnayHaritasi; karar: (id: string, durum: OnayDurumu) => void; katkilar: Katki[]; katkiKarari: (id: string, durum: KatkiDurumu) => void }

export default function OnayAkisi({ eserler, ustKatman, onay, karar, katkilar, katkiKarari }: Props) {
  const idler = onayBekleyenler(ustKatman)
  const durumu = (id: string): OnayDurumu => onay[id] ?? 'beklemede'
  const sayi = (d: OnayDurumu) => idler.filter((id) => durumu(id) === d).length
  return <section className="sayfa mokap" aria-labelledby="onay-basligi">
    <p className="ust-baslik">İÇERİK ONAY AKIŞI</p>
    <h1 id="onay-basligi">Öneriden yayına</h1>
    <p className="mokap-not">Yönetim ekranından eklenen yeni eserler önce beklemede kalır; yalnız onaylananlar ana sayfada ve eser sayfalarında yayınlanır. Kararlar bu tarayıcıda saklanır; bulut bağlantısı varsa kayıtlı eserlerin durumu da güncellenir.</p>
    <div className="mokap-ozet">
      <p role="status">{durumEtiketi.beklemede}: {sayi('beklemede')} · Onaylandı: {sayi('onaylandi')} · Reddedildi: {sayi('reddedildi')}</p>
    </div>
    {idler.length === 0 ? <p>Onay bekleyen eser yok. Yönetim ekranından yeni eser ekleyebilirsiniz.</p> :
      <ul className="mokap-kartlar mokap-kartlar-uclu" aria-label="Onay bekleyen eserler">{idler.map((id) => {
        const eser = eserler.find((e) => e.id === id)
        const d = durumu(id)
        return <li className="mokap-kart" key={id}>
          <span className={`mokap-durum mokap-durum-${d === 'beklemede' ? 'bekliyor' : d}`}>{durumEtiketi[d]}</span>
          <h2>{eser?.ad ?? id}</h2>
          <p>{eser ? `${eser.sehir} · ${eser.ilce}` : ''}</p>
          <div className="mokap-eylemler" role="group" aria-label={`${eser?.ad ?? id} için karar`}>
            <button type="button" aria-pressed={d === 'onaylandi'} onClick={() => karar(id, d === 'onaylandi' ? 'beklemede' : 'onaylandi')}>Onayla</button>
            <button type="button" aria-pressed={d === 'reddedildi'} onClick={() => karar(id, d === 'reddedildi' ? 'beklemede' : 'reddedildi')}>Reddet</button>
          </div>
        </li>
      })}</ul>}
    <h2>Topluluk katkıları</h2>
    {katkilar.length === 0 ? <p>Bekleyen katkı yok. Eser sayfalarındaki "Topluluk katkıları" formundan gelen metinler burada onay bekler.</p> :
      <ul className="mokap-kartlar mokap-kartlar-uclu" aria-label="Topluluk katkıları">{katkilar.map((k) => {
        const eser = eserler.find((e) => e.id === k.eserId)
        return <li className="mokap-kart" key={k.id}>
          <span className={`mokap-durum mokap-durum-${k.durum === 'beklemede' ? 'bekliyor' : k.durum}`}>{durumEtiketi[k.durum]}</span>
          <h3>{k.baslik}</h3><p>{k.metin}</p><p className="mokap-ikincil">Eser: {eser?.ad ?? k.eserId}</p>
          <div className="mokap-eylemler" role="group" aria-label={`${k.baslik} katkısı için karar`}>
            <button type="button" aria-pressed={k.durum === 'onaylandi'} onClick={() => katkiKarari(k.id, k.durum === 'onaylandi' ? 'beklemede' : 'onaylandi')}>Onayla</button>
            <button type="button" aria-pressed={k.durum === 'reddedildi'} onClick={() => katkiKarari(k.id, k.durum === 'reddedildi' ? 'beklemede' : 'reddedildi')}>Reddet</button>
          </div>
        </li>
      })}</ul>}
  </section>
}
