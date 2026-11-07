import type { Eser } from '../types/eser'
import type { UstKatman } from '../data'
import { onayBekleyenler } from '../data/onay'
import type { OnayDurumu, OnayHaritasi } from '../data/onay'
import './mokap.css'

const durumEtiketi: Record<OnayDurumu, string> = { beklemede: 'Onay bekliyor', onaylandi: 'Onaylandı, yayında', reddedildi: 'Reddedildi, yayında değil' }

interface Props { eserler: Eser[]; ustKatman: UstKatman; onay: OnayHaritasi; karar: (id: string, durum: OnayDurumu) => void }

export default function OnayAkisi({ eserler, ustKatman, onay, karar }: Props) {
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
  </section>
}
