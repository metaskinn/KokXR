import { Link } from 'react-router-dom'
import type { Eser } from '../types/eser'

export default function AnaSayfa({ eserler, rozetler }: { eserler: Eser[]; rozetler: string[] }) {
  return <>
    <section className="giris" aria-labelledby="sayfa-basligi">
      <p className="ust-baslik">Bursa’nın vakıf eserleri</p>
      <h1 id="sayfa-basligi">KökXR</h1>
      <p className="slogan">Dokunamadığın tarihe dokun.</p>
      <p>Bursa'daki vakıf eserlerini keşfet.</p>
    </section>
    <section aria-labelledby="eserler-basligi">
      <h2 id="eserler-basligi">Keşfedeceğin eserler</h2>
      <div className="eserler">{eserler.map((eser) => <Link className="eser-karti" to={`/eser/${eser.id}`} key={eser.id}>
        {eser.kapakGorsel && <img className="kapak" src={eser.kapakGorsel} alt={eser.gorseller.find((gorsel) => gorsel.dosya === eser.kapakGorsel)?.alt ?? eser.ad} />}
        <div className="kart-icerik">
          <p className="konum">{eser.sehir} · {eser.ilce}</p>
          <h3>{eser.ad}</h3>
          {rozetler.includes(eser.id) && <p className="etiket">★ Rozet kazanıldı</p>}
          <p>{eser.ozet}</p>
          <span className="kesfet">Eseri keşfet <span aria-hidden="true">→</span></span>
        </div>
      </Link>)}</div>
    </section>
  </>
}
