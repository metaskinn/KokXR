import { Link } from 'react-router-dom'
import { eserleriGetir, icerigiOku } from '../data'
import './mokap.css'

export default function Kutuphane() {
  const eserler = eserleriGetir(icerigiOku().ustKatman)
  return <section className="sayfa mokap" aria-labelledby="kutuphane-basligi">
    <p className="ust-baslik">DİJİTAL MİRAS KÜTÜPHANESİ</p>
    <h1 id="kutuphane-basligi">Eserler</h1>
    <p className="mokap-giris">Uygulamadaki {eserler.length} eser; dönemi, kaynak sayısı ve maket durumuyla.</p>
    <ul className="mokap-liste">{eserler.map((e) => <li className="mokap-kart" key={e.id}>
      <p className="mokap-ikincil">{e.sehir} · {e.ilce}</p>
      <h2>{e.ad}</h2>
      <dl>
        <div><dt>Dönem</dt><dd>{e.donem}</dd></div>
        <div><dt>Kaynak sayısı</dt><dd>{e.kaynaklar.length}</dd></div>
        <div><dt>Maket</dt><dd>{e.maket ? 'Temsilî 3B maket' : 'Maket yok'}</dd></div>
      </dl>
      {e.maket && <details><summary>Maket notu</summary>{e.maket.aciklama}</details>}
      <Link to={`/eser/${e.id}`} aria-label={`${e.ad} eser sayfasına git`}>Eser sayfasına git →</Link>
    </li>)}</ul>
  </section>
}
