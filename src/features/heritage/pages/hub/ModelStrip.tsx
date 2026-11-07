import { Link } from 'react-router-dom'
import type { Artifact } from '../../../../domain/artifact'
import { PUBLIC_BUILD } from '../../../../shared/config/publicBuild'
import UiIcon from '../../../../shared/ui/UiIcon'

/**
 * The artifacts that have a 3D scale model, shown before the list while no filter or search is active.
 * The still is a screenshot of the model scene; some models carry archive-photo textures, so the public build leaves it out.
 */
export default function ModelStrip({ artifacts, onOpen }: { artifacts: Artifact[]; onOpen: () => void }) {
  if (!artifacts.length) return null
  return <section className="model-strip" aria-labelledby="model-strip-title">
    <div className="model-strip-head">
      <div>
        <h2 id="model-strip-title">3B maketli eserler</h2>
        <p>{artifacts.length} yapının temsilî maketi var. Ekranda çevir, Meta Quest’te VR’da aç.</p>
      </div>
      <Link className="btn-ghost" to="/artifacts?maket=1">Hepsi</Link>
    </div>
    <ol>{artifacts.map((a) => <li key={a.id} className="model-card">
      <div className="still">{!PUBLIC_BUILD && <img src={`/images/${a.id}/model-still.jpg`} alt={`${a.name} maketinin ekran görüntüsü`} loading="lazy" width="992" height="561" />}</div>
      <div className="model-card-body">
        <h3><Link to={`/artifact/${a.id}`} onClick={onOpen}>{a.name}</Link></h3>
        <p className="position">{a.district}, {a.city}</p>
        <Link className="btn-ghost" to={`/places/${a.id}`} onClick={onOpen}><UiIcon name="cube" />Maketi incele</Link>
      </div>
    </li>)}</ol>
  </section>
}
