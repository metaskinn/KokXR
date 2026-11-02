import { Link, Route, Routes, useParams } from 'react-router-dom'
import { eserleriGetir } from './data'

const eserler = eserleriGetir()

function AnaSayfa() {
  return (
    <>
      <section className="giris" aria-labelledby="sayfa-basligi">
        <p className="ust-baslik">Bursa’nın vakıf eserleri</p>
        <h1 id="sayfa-basligi">KökXR</h1>
        <p className="slogan">Dokunamadığın tarihe dokun.</p>
        <p>Bursa'daki vakıf eserlerini keşfet.</p>
      </section>
      <section aria-labelledby="eserler-basligi">
        <h2 id="eserler-basligi">Keşfedeceğin eserler</h2>
        <div className="eserler">
          {eserler.map((eser) => (
            <Link className="eser-karti" to={`/eser/${eser.id}`} key={eser.id}>
              <p className="konum">{eser.sehir} · {eser.ilce}</p>
              <h3>{eser.ad}</h3>
              <p>{eser.ozet}</p>
              <span className="kesfet">Eseri keşfet <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

function Bulunamadi() {
  return (
    <section className="sayfa">
      <h1>Sayfa bulunamadı</h1>
      <Link to="/">Ana sayfaya dön</Link>
    </section>
  )
}

function EserSayfasi() {
  const { id } = useParams()
  const eser = eserler.find((eser) => eser.id === id)

  if (!eser) return <Bulunamadi />

  return (
    <section className="sayfa">
      <Link to="/">← Ana sayfaya dön</Link>
      <h1>{eser.ad}</h1>
      <p>{eser.ozet}</p>
      <p className="hazirlaniyor">Yakında: galeri, bilgi paneli, test</p>
    </section>
  )
}

export default function App() {
  return (
    <>
      <a className="atlama" href="#ana-icerik">Ana içeriğe geç</a>
      <header className="ust-cubuk">
        <Link to="/" aria-label="KökXR ana sayfa">KökXR</Link>
      </header>
      <main id="ana-icerik" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<AnaSayfa />} />
          <Route path="/eser/:id" element={<EserSayfasi />} />
          <Route path="*" element={<Bulunamadi />} />
        </Routes>
      </main>
    </>
  )
}
