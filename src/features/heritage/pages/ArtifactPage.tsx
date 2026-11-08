import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Artifact } from '../../../domain/artifact'
import Gallery from '../components/Gallery'
import { inventoryLinks } from '../components/inventoryLinks'
import Section from '../../../shared/ui/Section'
import SourceLine, { SourceLink, sourceText } from '../../../shared/ui/SourceLine'
import NotFound from '../../../shared/ui/NotFound'
import UiIcon from '../../../shared/ui/UiIcon'
import './artifact.css'

/** History paragraphs shown before the "read more" disclosure, when there are more than VISIBLE + 1. */
const VISIBLE = 3

/** Highlights the section the reader is in (last section whose top has passed under the sticky bar). */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join(' ')
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = 44 + 24
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        const section = el?.closest('section') ?? el
        if (section && section.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return active
}

function firstSentence(text: string) {
  const match = text.match(/^.+?[.!?](?=\s|$)/)
  return match ? match[0] : text
}

/** Photo first, then the title block; the scale model lives on /places/:id and is only linked from here. */
export default function ArtifactPage({ artifacts }: { artifacts: Artifact[] }) {
  const { id } = useParams()
  const artifact = artifacts.find((item) => item.id === id)
  if (!artifact) return <NotFound artifactSlug={id ?? ''} />
  return <ArtifactDetail key={artifact.id} artifact={artifact} artifacts={artifacts} />
}

function ArtifactDetail({ artifact, artifacts }: { artifact: Artifact; artifacts: Artifact[] }) {
  const model = artifact.model
  const links = inventoryLinks(artifact, artifacts)
  const nav = [
    { id: 'fotograflar', long: 'Fotoğraflar', short: 'Fotoğraf' },
    ...(model ? [{ id: 'maket', long: 'Maket', short: 'Maket' }] : []),
    { id: 'tarihce', long: 'Tarihçe', short: 'Tarihçe' },
    { id: 'kaynaklar', long: 'Kaynaklar', short: 'Kaynak' },
  ]
  const active = useActiveSection(nav.map((n) => n.id))
  const paragraphs = artifact.history.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const folded = paragraphs.length > VISIBLE + 1
  const shown = folded ? paragraphs.slice(0, VISIBLE) : paragraphs
  const rest = folded ? paragraphs.slice(VISIBLE) : []
  const place = new URLSearchParams({ sehir: artifact.city, ilce: artifact.district })
  const groupModel = links.group?.artifact?.model

  const side = <aside className="artifact-side">
    <div className="artifact-head">
      <p className="position"><Link to={`/artifacts?${place}`}>{artifact.district}, {artifact.city}</Link></p>
      <h1>{artifact.name}</h1>
      <p className="artifact-summary">{artifact.summary}</p>
      {links.group?.artifact && <p className="group-link">
        <span>Bu yapı <Link to={`/artifact/${links.group.artifact.id}`}>{links.group.name}</Link> içinde.</span>
        {groupModel && <span>Külliyenin 3B maketi var.</span>}
      </p>}
    </div>
    {model && <div className="artifact-action">
      <Link className="button btn-primary btn-wide" to={`/places/${artifact.id}`}><UiIcon name="cube" />3B maketi incele</Link>
      <p>Temsilî maket. Ekranda çevirebilir, içine girebilirsin.</p>
    </div>}
    <dl className="artifact-tag">
      <div><dt>Dönem</dt><dd>{artifact.period}</dd></div>
      <div><dt>Vakıf</dt><dd>{artifact.endowment}</dd></div>
      {artifact.verification === 'illustrative' && <div><dt>Not</dt><dd>Temsili içerik</dd></div>}
    </dl>
    <nav className="section-nav" aria-label="Eser bölümleri">
      <p>Bu sayfada</p>
      <ul>{nav.map((n) => <li key={n.id}><a href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined}><span className="long">{n.long}</span><span className="short">{n.short}</span></a></li>)}</ul>
    </nav>
  </aside>

  // `.photo-gallery` is the browser tests' hook for the whole gallery; on a phone the layout wrapper has no box of its own.
  return <article className="artifact-detail photo-gallery">
    <Link className="link-back desktop-only" to="/artifacts"><UiIcon name="back" />Eserlere dön</Link>
    <Gallery artifact={artifact} side={side} />
    <div className="artifact-content">
      {model && <Section id="maket" title="3B maket">
        <div className="model-preview">
          <ModelStill id={artifact.id} name={artifact.name} />
          <div>
            <p>Maketi ekranda çevirebilir, parçalarına ayırabilir, içine girebilirsin. VR destekleyen tarayıcılarda (Meta Quest gibi) gözlükle de açılır.</p>
            <p className="honesty">{firstSentence(model.description)}</p>
            <p><Link className="button" to={`/places/${artifact.id}`}><UiIcon name="cube" />Maketi aç</Link></p>
          </div>
        </div>
      </Section>}
      <Section id="tarihce" title="Tarihçe" className="reading">
        <div className="history">
          {shown.map((p, i) => <p key={i}>{p}</p>)}
          {folded && <details className="more">
            <summary><UiIcon name="down" />Tarihçenin devamını oku ({rest.length} paragraf)</summary>
            {rest.map((p, i) => <p key={i}>{p}</p>)}
          </details>}
        </div>
        {artifact.sources.filter((source) => source.id.endsWith('-history')).map((source) => <SourceLine key={source.id} sources={artifact.sources} sourceId={source.id} />)}
      </Section>
      <Section id="kaynaklar" title="Kaynaklar" className="reading">
        <ol className="source-list">{artifact.sources.map((source) => <li key={source.id}>{sourceText(source)} <SourceLink source={source} /></li>)}</ol>
        {links.record && <p className="inventory-line">Envanter kaydı: {links.record}</p>}
        {links.siblings.length > 0 && <div className="same-complex">
          <h3>{links.isComplex ? 'Külliyedeki yapılar' : 'Aynı külliyede'}</h3>
          <ul>{links.siblings.map((a) => <li key={a.id}><Link to={`/artifact/${a.id}`}>{a.name}</Link></li>)}</ul>
          {links.more > 0 && <p>ve {links.more} yapı daha</p>}
        </div>}
      </Section>
    </div>
  </article>
}

/** Still image of the scale model; a neutral panel with a cube icon if the image is missing. */
function ModelStill({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false)
  return <div className={`still${failed ? ' still-missing' : ''}`}>
    {failed ? <UiIcon name="cube" /> : <img src={`/images/${id}/model-still.jpg`} alt={`${name} maketinin ekran görüntüsü`} loading="lazy" onError={() => setFailed(true)} />}
  </div>
}
