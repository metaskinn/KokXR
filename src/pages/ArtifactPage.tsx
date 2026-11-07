import { Link, useParams } from 'react-router-dom'
import type { Artifact } from '../types/artifact'
import ArtifactExplorer from '../components/ArtifactExplorer'
import Gallery from '../components/Gallery'
import Section from '../components/Section'
import SourceLine, { sourceText } from '../components/SourceLine'
import NotFound from './NotFound'
import { PUBLIC_BUILD } from '../data/openPublication'

/** Fotoğraf öncelikli katalog düzeni: tam genişlik kapak, yapışkan künye ve bölüm listesi, okunur içerik sütunu. */
export default function ArtifactPage({ artifacts }: { artifacts: Artifact[] }) {
  const { id } = useParams()
  const artifact = artifacts.find((item) => item.id === id)
  if (!artifact) return <NotFound />
  const cover = PUBLIC_BUILD ? undefined : artifact.images.find((g) => g.file === artifact.coverImage)
  const hasGallery = !PUBLIC_BUILD && artifact.images.length > 0
  return <article className="artifact-detail" key={artifact.id}>
    <header className={`artifact-cover${cover ? '' : ' artifact-cover-no-image'}`}>
      {cover && <img className="artifact-cover-image" src={cover.file} alt={cover.alt} />}
      <div className="artifact-cover-interior">
        <Link className="artifact-backward" to="/artifacts">← Eserlere dön</Link>
        <div className="artifact-cover-text">
          <p className="artifact-cover-position">{artifact.district}, {artifact.city}</p>
          <h1>{artifact.ad}</h1>
          <p className="artifact-summary">{artifact.summary}</p>
        </div>
      </div>
      {cover?.credit && <p className="artifact-cover-credit">{cover.credit}</p>}
    </header>
    <div className="artifact-body">
      <aside className="artifact-side">
        <dl className="artifact-tag">
          <div><dt>Dönem</dt><dd>{artifact.period}</dd></div>
          <div><dt>Vakıf</dt><dd>{artifact.endowment}</dd></div>
          <div><dt>Bilgi durumu</dt><dd>{artifact.verification === 'verified' ? 'Kaynaklı bilgi' : 'Temsili içerik'}</dd></div>
        </dl>
        <nav className="section-nav" aria-label="Eser bölümleri">
          <p>Bu sayfada</p>
          <ul>
            {hasGallery && <li><a href="#gallery-title">Fotoğraflar <span>{artifact.images.length}</span></a></li>}
            <li><a href="#discover-title">Keşif noktaları</a></li>
            {artifact.model && <li><a href="#model-title">3B maket</a></li>}
            <li><a href="#history-title">Tarihçe</a></li>
            <li><a href="#sources-title">Kaynaklar <span>{artifact.sources.length}</span></a></li>
          </ul>
        </nav>
      </aside>
      <div className="artifact-content">
        <Gallery artifact={artifact} />
        {artifact.model && <ArtifactExplorer model={artifact.model} sources={artifact.sources} ad={artifact.ad} />}
        <Section id="history-title" title="Tarihçe">
          <p className="history">{artifact.history}</p>
          {artifact.sources.filter((source) => source.id.endsWith('-history')).map((source) => <SourceLine key={source.id} sources={artifact.sources} sourceId={source.id} />)}
        </Section>
        <Section id="sources-title" title="Kaynaklar">
          <ul className="source-list">{artifact.sources.map((source) => <li key={source.id}>{sourceText(source)}</li>)}</ul>
        </Section>
      </div>
    </div>
  </article>
}
