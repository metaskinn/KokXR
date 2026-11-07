import { Link } from 'react-router-dom'
import type { Eser } from '../types/eser'
import { ACIK_YAYIN } from '../data/acikYayin'

export default function Eserler({ eserler }: { eserler: Eser[] }) {
  const kapak = (eser: Eser) => eser.gorseller.find((g) => g.dosya === eser.kapakGorsel)
  // Kapak kredileri çoğunlukla aynı kaynaktan; her kartta tekrarlamak yerine sayfa sonunda bir kez yazılır.
  const krediler = [...new Set(eserler.map((e) => kapak(e)?.kredi).filter((k): k is string => !!k))]
  return <section id="eserler" className="eserler-bolumu" aria-labelledby="eserler-basligi">
    <div className="bolum-basligi"><div><h1 id="eserler-basligi">Eserler</h1><p className="bolum-aciklama">Bursa’daki {eserler.length} vakıf eseri. Birini seç; fotoğraflarına yakından bak, tarihçesini oku, varsa maketini eline al.</p></div></div>
    <ul className="eserler">{eserler.map((eser) => <li key={eser.id}>
      <Link className="eser-karti" to={`/eser/${eser.id}`}>
        {!ACIK_YAYIN && <div className="kart-gorsel">
          {eser.kapakGorsel && <img className="kapak" src={eser.kapakGorsel} alt={kapak(eser)?.alt ?? eser.ad} loading="lazy" />}
        </div>}
        <div className="kart-icerik">
          <h2>{eser.ad}</h2>
          <p className="konum">{eser.ilce}, {eser.sehir}</p>
          <p className="kart-ozet">{eser.ozet}</p>
          <ul className="kart-olanaklar" aria-label="Bu eserde">
            {eser.maket && <li>3B maket</li>}
            {!ACIK_YAYIN && eser.gorseller.length > 0 && <li className="hardal">{eser.gorseller.length} fotoğraf</li>}
            {eser.bilgiNoktalari.length > 0 && <li className="mercan">{eser.bilgiNoktalari.length} keşif noktası</li>}
          </ul>
        </div>
      </Link>
    </li>)}</ul>
    {!ACIK_YAYIN && krediler.length > 0 && <p className="foto-kredi eserler-kredi">Kapak fotoğrafları: {krediler.map((k) => k.replace(/^Fotoğraf:\s*/, '')).join('; ')}</p>}
  </section>
}
