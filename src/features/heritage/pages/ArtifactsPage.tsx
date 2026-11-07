import { Link } from 'react-router-dom'
import type { Artifact } from '../../../domain/artifact'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'

export default function ArtifactsPage({ artifacts }: { artifacts: Artifact[] }) {
  const cover = (artifact: Artifact) => artifact.images.find((g) => g.file === artifact.coverImage)
  // Kapak kredileri çoğunlukla aynı kaynaktan; her kartta tekrarlamak yerine sayfa sonunda bir kez yazılır.
  const credits = [...new Set(artifacts.map((e) => cover(e)?.credit).filter((k): k is string => !!k))]
  return <section id="artifacts" className="artifacts-section" aria-labelledby="artifacts-title">
    <div className="section-title"><div><h1 id="artifacts-title">Eserler</h1><p className="section-description">Bursa’daki {artifacts.length} vakıf eseri. Birini seç; fotoğraflarına yakından bak, tarihçesini oku, varsa maketini eline al.</p></div></div>
    <ul className="artifacts">{artifacts.map((artifact) => <li key={artifact.id}>
      <Link className="artifact-card" to={`/artifact/${artifact.id}`}>
        {!PUBLIC_BUILD && <div className="card-image">
          {artifact.coverImage && <img className="cover" src={artifact.coverImage} alt={cover(artifact)?.alt ?? artifact.ad} loading="lazy" />}
        </div>}
        <div className="card-content">
          <h2>{artifact.ad}</h2>
          <p className="position">{artifact.district}, {artifact.city}</p>
          <p className="card-summary">{artifact.summary}</p>
          <ul className="card-features" aria-label="Bu eserde">
            {artifact.model && <li>3B maket</li>}
            {!PUBLIC_BUILD && artifact.images.length > 0 && <li className="mustard">{artifact.images.length} fotoğraf</li>}
            {artifact.hotspots.length > 0 && <li className="coral">{artifact.hotspots.length} keşif noktası</li>}
          </ul>
        </div>
      </Link>
    </li>)}</ul>
    {!PUBLIC_BUILD && credits.length > 0 && <p className="photo-credit artifacts-credit">Kapak fotoğrafları: {credits.map((k) => k.replace(/^Fotoğraf:\s*/, '')).join('; ')}</p>}
  </section>
}
