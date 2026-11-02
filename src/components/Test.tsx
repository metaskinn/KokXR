import { useRef, useState } from 'react'
import type { Eser } from '../types/eser'
import KaynakSatiri from './KaynakSatiri'

export default function Test({ eser, rozetKazan }: { eser: Eser; rozetKazan: (id: string) => boolean }) {
  const [sira, setSira] = useState(0)
  const [cevaplar, setCevaplar] = useState<number[]>([])
  const [bitti, setBitti] = useState(false)
  const [kaydedildi, setKaydedildi] = useState(true)
  const baslik = useRef<HTMLHeadingElement>(null)
  const soru = eser.test[sira]
  const cevap = cevaplar[sira]
  const dogruSayisi = cevaplar.filter((yanit, index) => yanit === eser.test[index].dogru).length

  function ilerle() {
    if (sira + 1 < eser.test.length) setSira(sira + 1)
    else {
      setBitti(true)
      if (eser.test.length === 3 && dogruSayisi === 3) setKaydedildi(rozetKazan(eser.id))
    }
    baslik.current?.focus()
  }

  return (
    <section className="bolum test" aria-labelledby="test-basligi">
      <h2 id="test-basligi" tabIndex={-1} ref={baslik}>Bilgini sına</h2>
      {eser.test.length === 0 ? <p>Sorular hazırlanıyor.</p> : bitti ? (
        <div role="status">
          <h3>{eser.test.length} sorudan {dogruSayisi} doğru</h3>
          {eser.test.length === 3 && dogruSayisi === 3 && <p>★ Rozet kazanıldı!{!kaydedildi && ' Rozet bu oturumda kullanılabilir; tarayıcıya kaydedilemedi.'}</p>}
          <button onClick={() => { setSira(0); setCevaplar([]); setBitti(false); baslik.current?.focus() }}>Tekrar dene</button>
        </div>
      ) : (
        <>
          <p>Soru {sira + 1} / {eser.test.length}</p>
          <fieldset>
            <legend>{soru.soru}</legend>
            {soru.secenekler.map((secenek, index) => (
              <label className={`secenek ${cevap === index ? 'secili' : ''}`} key={index}>
                <input type="radio" name={`soru-${eser.id}-${sira}`} checked={cevap === index} disabled={cevap !== undefined && cevap !== index}
                  onChange={() => { if (cevap === undefined) setCevaplar([...cevaplar, index]) }} />
                <span>{secenek}</span>
              </label>
            ))}
          </fieldset>
          <div aria-live="polite" aria-atomic="true">
            {cevap !== undefined && <div className="yanit">
              <p><strong>{cevap === soru.dogru ? '✓ Doğru cevap!' : '✗ Yanlış cevap.'}</strong></p>
              {cevap !== soru.dogru && <p>Doğru cevap: {soru.secenekler[soru.dogru]}</p>}
              <p>{soru.aciklama}</p>
              <KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={soru.kaynakId} />
            </div>}
          </div>
          {cevap !== undefined && <button onClick={ilerle}>{sira + 1 === eser.test.length ? 'Sonucu gör' : 'Sonraki soru'}</button>}
        </>
      )}
    </section>
  )
}
