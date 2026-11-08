import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import { vrCities } from '../../content/vrArtifacts'
import { PUBLIC_BUILD } from '../../shared/config/publicBuild'
import UiIcon from '../../shared/ui/UiIcon'
import './home.css'

/** Home page. Every number on it is counted from the artifact list; nothing is typed in by hand. */
export default function HomePage({ artifacts }: { artifacts: Artifact[] }) {
  const { cities, models } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of artifacts) counts.set(a.city, (counts.get(a.city) ?? 0) + 1)
    const known = vrCities.map((c) => c.name)
    const cities = [...counts].sort((a, b) => b[1] - a[1] || known.indexOf(a[0]) - known.indexOf(b[0]))
    return { cities, models: artifacts.filter((a) => a.model) }
  }, [artifacts])
  // The large still: Ulu Camii when it has a model, otherwise the first model in the list.
  const lead = models.find((a) => a.id === 'ulu-mosque') ?? models[0]
  const strip = models.filter((a) => a !== lead).slice(0, 4)
  const stills = !PUBLIC_BUILD && lead

  return <div className="home">
    <section className="home-intro" aria-labelledby="home-title" data-still={stills ? 'yes' : undefined}>
      <div className="home-intro-text">
        <h1 id="home-title">Bursa, Konya ve Hatay’ın vakıf eserleri</h1>
        <p className="home-lede">KökXR, Vakıf Katılım’ın envanter kitaplarındaki eserleri dijital olarak gezmen için yapılmış bir prototip.</p>
        {artifacts.length > 0 && <dl className="home-counts">
          <div><dt>Eser</dt><dd>{artifacts.length}</dd></div>
          <div><dt>Şehir</dt><dd>{cities.length}</dd></div>
          <div><dt>3B maket</dt><dd>{models.length}</dd></div>
        </dl>}
        <Link className="button btn-primary" to="/artifacts"><UiIcon name="arch" />Eserleri keşfet</Link>
      </div>
      {stills && <figure className="home-still">
        <Link to={`/places/${lead.id}`} aria-label={`${lead.name} maketini incele`}>
          <img src={`/images/${lead.id}/model-still.jpg`} alt="" width="992" height="561" />
        </Link>
        <figcaption>{lead.name} maketi, {lead.district}. Temsilî modelden ekran görüntüsü.</figcaption>
      </figure>}
    </section>

    <section className="home-way" aria-labelledby="way-artifacts">
      <h2 id="way-artifacts"><Link to="/artifacts">Eserler</Link></h2>
      <div className="home-way-body">
        <p>Eserleri ada, ilçeye ve türe göre ara; fotoğraflarına ve künyelerine bak.</p>
        {cities.length > 0 && <ul className="home-cities" aria-label="Şehre göre eserler">
          {cities.map(([city, n]) => <li key={city}>
            <Link className="button" to={`/artifacts?sehir=${encodeURIComponent(city)}`}>{city}<span className="home-city-count">{n} eser</span></Link>
          </li>)}
        </ul>}
      </div>
    </section>

    <section className="home-way" aria-labelledby="way-models">
      <h2 id="way-models"><Link to="/places">Maketler</Link></h2>
      <div className="home-way-body">
        <p>{models.length > 0
          ? `${models.length} yapının 3B maketini ekranda çevirebilir, içinde yürüyebilir, Meta Quest’te VR’da açabilirsin.`
          : 'Şu an 3B maketi olan eser yok.'}</p>
        <p className="home-note">Maketler temsilîdir; yapıların ölçülerek taranmış kopyası değildir.</p>
        {!PUBLIC_BUILD && strip.length > 0 && <ul className="home-strip">
          {strip.map((a) => <li key={a.id}>
            <Link to={`/places/${a.id}`}>
              <img src={`/images/${a.id}/model-still.jpg`} alt="" width="992" height="561" loading="lazy" />
              <span>{a.name}</span>
            </Link>
          </li>)}
        </ul>}
        <Link className="btn-ghost" to="/places"><UiIcon name="cube" />Bütün maketler</Link>
      </div>
    </section>

    <section className="home-way" aria-labelledby="way-workshops">
      <h2 id="way-workshops"><Link to="/workshops">Atölyeler</Link></h2>
      <div className="home-way-body">
        <p>Altı parçaya ayrılmış bir vazoyu yeniden birleştir ya da bir kılıcı külçeden başlayıp ısıtarak, dövüp su vererek kendin yap.</p>
        <div className="home-links">
          <Link className="btn-ghost" to="/workshops/vase"><UiIcon name="vase" />Vazo atölyesi</Link>
          <Link className="btn-ghost" to="/workshops/sword">Kılıç atölyesi</Link>
        </div>
      </div>
    </section>
  </div>
}
