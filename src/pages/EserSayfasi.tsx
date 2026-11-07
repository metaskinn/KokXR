import { Link, useParams } from 'react-router-dom'
import type { Eser } from '../types/eser'
import EseriEleAl from '../components/EseriEleAl'
import Galeri from '../components/Galeri'
import Bolum from '../components/Bolum'
import KaynakSatiri, { kaynakMetni } from '../components/KaynakSatiri'
import Bulunamadi from './Bulunamadi'
import { ACIK_YAYIN } from '../data/acikYayin'

/** Fotoğraf öncelikli katalog düzeni: tam genişlik kapak, yapışkan künye ve bölüm listesi, okunur içerik sütunu. */
export default function EserSayfasi({ eserler }: { eserler: Eser[] }) {
  const { id } = useParams()
  const eser = eserler.find((item) => item.id === id)
  if (!eser) return <Bulunamadi />
  const kapak = ACIK_YAYIN ? undefined : eser.gorseller.find((g) => g.dosya === eser.kapakGorsel)
  const galeriVar = !ACIK_YAYIN && eser.gorseller.length > 0
  return <article className="eser-detay" key={eser.id}>
    <header className={`eser-kapak${kapak ? '' : ' eser-kapak-gorselsiz'}`}>
      {kapak && <img className="eser-kapak-gorsel" src={kapak.dosya} alt={kapak.alt} />}
      <div className="eser-kapak-ic">
        <Link className="eser-geri" to="/eserler">← Eserlere dön</Link>
        <div className="eser-kapak-metin">
          <p className="eser-kapak-konum">{eser.ilce}, {eser.sehir}</p>
          <h1>{eser.ad}</h1>
          <p className="eser-ozet">{eser.ozet}</p>
        </div>
      </div>
      {kapak?.kredi && <p className="eser-kapak-kredi">{kapak.kredi}</p>}
    </header>
    <div className="eser-govde">
      <aside className="eser-yan">
        <dl className="eser-kunye">
          <div><dt>Dönem</dt><dd>{eser.donem}</dd></div>
          <div><dt>Vakıf</dt><dd>{eser.vakif}</dd></div>
          <div><dt>Bilgi durumu</dt><dd>{eser.dogrulama === 'dogrulanmis' ? 'Kaynaklı bilgi' : 'Temsili içerik'}</dd></div>
        </dl>
        <nav className="bolum-gezinme" aria-label="Eser bölümleri">
          <p>Bu sayfada</p>
          <ul>
            {galeriVar && <li><a href="#galeri-basligi">Fotoğraflar <span>{eser.gorseller.length}</span></a></li>}
            <li><a href="#kesif-basligi">Keşif noktaları</a></li>
            {eser.maket && <li><a href="#maket-basligi">3B maket</a></li>}
            <li><a href="#tarihce-basligi">Tarihçe</a></li>
            <li><a href="#kaynaklar-basligi">Kaynaklar <span>{eser.kaynaklar.length}</span></a></li>
          </ul>
        </nav>
      </aside>
      <div className="eser-icerik">
        <Galeri eser={eser} />
        {eser.maket && <EseriEleAl maket={eser.maket} kaynaklar={eser.kaynaklar} ad={eser.ad} />}
        <Bolum id="tarihce-basligi" baslik="Tarihçe">
          <p className="tarihce">{eser.tarihce}</p>
          {eser.kaynaklar.filter((kaynak) => kaynak.id.endsWith('-tarihce')).map((kaynak) => <KaynakSatiri key={kaynak.id} kaynaklar={eser.kaynaklar} kaynakId={kaynak.id} />)}
        </Bolum>
        <Bolum id="kaynaklar-basligi" baslik="Kaynaklar">
          <ul className="kaynak-listesi">{eser.kaynaklar.map((kaynak) => <li key={kaynak.id}>{kaynakMetni(kaynak)}</li>)}</ul>
        </Bolum>
      </div>
    </div>
  </article>
}
