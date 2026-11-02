import { Link, useParams } from 'react-router-dom'
import type { Eser } from '../types/eser'
import SanalGezinti from '../components/SanalGezinti'
import Tur360 from '../components/Tur360'
import Restorasyon from '../components/Restorasyon'
import Galeri from '../components/Galeri'
import Test from '../components/Test'
import KaynakSatiri, { kaynakMetni } from '../components/KaynakSatiri'
import Bulunamadi from './Bulunamadi'

export default function EserSayfasi({ eserler, rozetKazan }: { eserler: Eser[]; rozetKazan: (id: string) => boolean }) {
  const { id } = useParams()
  const eser = eserler.find((item) => item.id === id)
  if (!eser) return <Bulunamadi />
  return <article className="sayfa" key={eser.id}>
    <Link to="/">← Ana sayfaya dön</Link>
    <header className="eser-baslik">
      <h1>{eser.ad}</h1>
      <p className="konum">{eser.sehir} · {eser.ilce}</p>
      <dl><div><dt>Dönem</dt><dd>{eser.donem}</dd></div><div><dt>Vakıf</dt><dd>{eser.vakif}</dd></div></dl>
      <p className="etiket">{eser.dogrulama === 'dogrulanmis' ? 'Kaynaklı bilgi' : 'Temsili içerik'}</p>
      <p>{eser.ozet}</p>
    </header>
    {eser.tur360 && <Tur360 tur={eser.tur360} ad={eser.ad} />}
    {eser.tur && <SanalGezinti tur={eser.tur} kaynaklar={eser.kaynaklar} />}
    <Galeri eser={eser} />
    <section className="bolum" aria-labelledby="tarihce-basligi">
      <h2 id="tarihce-basligi">Tarihçe</h2><p className="tarihce">{eser.tarihce}</p>
      {eser.kaynaklar.filter((kaynak) => kaynak.id.endsWith('-tarihce')).map((kaynak) => <KaynakSatiri key={kaynak.id} kaynaklar={eser.kaynaklar} kaynakId={kaynak.id} />)}
    </section>
    {eser.restorasyon && <Restorasyon gorev={eser.restorasyon} kaynaklar={eser.kaynaklar} rozetKazan={rozetKazan} rozetId={`${eser.id}:restorasyon`} />}
    <Test eser={eser} rozetKazan={rozetKazan} />
    <section className="bolum" aria-labelledby="kaynaklar-basligi">
      <h2 id="kaynaklar-basligi">Kaynaklar</h2>
      <ul className="kaynak-listesi">{eser.kaynaklar.map((kaynak) => <li key={kaynak.id}>{kaynakMetni(kaynak)}</li>)}</ul>
    </section>
  </article>
}
