import { useState } from 'react'
import type { Eser, ZamanKaydi } from '../types/eser'
import KaynakSatiri from './KaynakSatiri'
import './ZamanKatmani.css'

const dolu = (deger: unknown) => typeof deger === 'string' && deger.trim() !== ''

// Yönetim ekranından yüklenen JSON bu alanı denetlemez; kaynağı çözülmeyen veya eksik kayıt gösterilmez.
function kaynakliKayitlar(eser: Eser): ZamanKaydi[] {
  if (!Array.isArray(eser.zamanKatmani)) return []
  return eser.zamanKatmani.filter((kayit) =>
    dolu(kayit?.donem) && dolu(kayit?.baslik) && dolu(kayit?.metin) &&
    eser.kaynaklar.some((kaynak) => kaynak.id === kayit.kaynakId && dolu(kaynak.metin)))
}

export default function ZamanKatmani({ eser }: { eser: Eser }) {
  const [sira, setSira] = useState(0)
  const kayitlar = kaynakliKayitlar(eser)
  if (kayitlar.length < 2) return null
  const kayit = kayitlar[sira] ?? kayitlar[0]
  const konum = `${sira + 1} / ${kayitlar.length}`

  return <section className="bolum zaman-katmani" aria-labelledby="zaman-katmani-basligi">
    <h2 id="zaman-katmani-basligi">Zaman Katmanı</h2>
    <p className="zaman-aciklama">Kaynaklı kayıtlarla dönemler arasında gez. Bu katman yazılı bilgiyi gösterir; yapının o dönemdeki görünümünü canlandırmaz.</p>
    <label className="zaman-etiket" htmlFor="zaman-kaydirici">Dönem seç</label>
    <input
      id="zaman-kaydirici"
      className="zaman-kaydirici"
      type="range"
      min={0}
      max={kayitlar.length - 1}
      step={1}
      value={sira}
      aria-valuetext={`${kayit.donem}: ${kayit.baslik} (${konum})`}
      onChange={(olay) => setSira(Number(olay.target.value))}
    />
    <div className="zaman-uclar" aria-hidden="true">
      <span>{kayitlar[0].donem}</span><span>{kayitlar[kayitlar.length - 1].donem}</span>
    </div>
    <div className="zaman-kart" aria-live="polite">
      <p className="zaman-donem">{kayit.donem} <span className="zaman-konum">· {konum}</span></p>
      <h3>{kayit.baslik}</h3>
      <p className="zaman-metin">{kayit.metin}</p>
      <KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={kayit.kaynakId} />
    </div>
  </section>
}
