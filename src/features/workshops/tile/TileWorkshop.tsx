import { useEffect, useRef, useState } from 'react'
import { tileSources, tileNotes, tileIntro, tileInstructions } from '../../../content/tile'
import { stages, BISQUE, actions, firstGame, quality, colors, GLAZE_KILN, HOLD_DURATION, type Game } from './engine/state'
import type { TileScene, HoldName } from './engine/scene'
import '../sword/sword.css'
import './tile.css'

export default function TileWorkshop() {
  const area = useRef<HTMLDivElement>(null), scene = useRef<TileScene | null>(null)
  const [game, setGame] = useState<Game>(firstGame), [ready, setReady] = useState(false), [error, setError] = useState(false), [open, setOpen] = useState(true)
  const [xrSupport, setXrSupport] = useState(false), [vr, setVr] = useState<'closedState' | 'opening' | 'open'>('closedState'), [vrError, setVrError] = useState('')

  useEffect(() => {
    let cancel = false
    const inspect = async () => {
      let support = false
      try { support = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { support = false }
      if (!cancel) setXrSupport(support)
    }
    void inspect()
    return () => { cancel = true }
  }, [])
  useEffect(() => {
    let cancel = false, local: TileScene | undefined
    import('./engine/scene').then(({ createScene }) => {
      if (cancel || !area.current) return
      local = createScene(area.current, (d) => { if (!cancel) setGame(d) }, () => { if (!cancel) setError(true) })
      scene.current = local; setReady(true)
    }).catch(() => { if (!cancel) setError(true) })
    return () => { cancel = true; local?.clear(); scene.current = null }
  }, [])
  useEffect(() => {
    const done = () => setVr('closedState')
    const r = area.current
    r?.addEventListener('xrended', done)
    return () => r?.removeEventListener('xrended', done)
  }, [])

  const { stage, alt: subStage } = game, note = tileNotes[Math.min(stage, tileNotes.length - 1)], last = stage === 6
  const list = actions(game), interval = stage === 1 ? BISQUE : GLAZE_KILN, locked = !ready || error || vr !== 'closedState'
  const hold = (name: HoldName) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); scene.current?.hold(name, true) },
    onPointerUp: () => scene.current?.hold(name, false), onPointerCancel: () => scene.current?.hold(name, false), onLostPointerCapture: () => scene.current?.hold(name, false),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); scene.current?.hold(name, true) } },
    onKeyUp: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); scene.current?.hold(name, false) } },
    onBlur: () => scene.current?.hold(name, false),
  })
  function vrAc() {
    if (!scene.current) return
    setVrError(''); setVr('opening')
    scene.current.startXr().then(() => setVr('open')).catch(() => { setVr('closedState'); setVrError('VR oturumu açılamadı. Atölyeye bu ekranda devam edebilirsin.') })
  }

  return <article className="sword-workshop tile-workshop">
    <header className="sword-title"><div>Çamurdan çiniye</div>
      <div className="sword-tools">{xrSupport && <button disabled={!ready || error || vr === 'opening'} onClick={() => vr === 'open' ? scene.current?.endXr() : vrAc()}>{vr === 'open' ? "VR'dan çık" : "VR'da aç"}</button>}</div></header>
    <ol className="sword-stages" aria-label="Üretim aşamaları">{stages.map((name, i) => <li key={name} aria-current={i === stage ? 'step' : undefined} className={i < stage ? 'done' : ''}><span>{i < stage ? '✓' : `${i + 1}`}</span><span>{name}</span></li>)}</ol>
    <div className="sword-experience">
      <div className="sword-scene tile-scene" ref={area} tabIndex={0} role="group" aria-label="Çini atölyesi sahnesi. Basılı tutup sürükleyerek çalış; ustaya bırak düğmesi her adımı tamamlar." />
      <div className="sword-scene-title"><h1>{stage === 0 ? 'Bir avuç çamurla başla.' : stages[stage]}</h1></div>
      {!ready && !error && <div className="sword-loading" role="status"><span />Atölye hazırlanıyor…</div>}
      {error && <div className="sword-loading" role="alert">Atölye görüntülenemedi.<small>WebGL kullanılamıyor olabilir. Tarayıcı desteğini kontrol edip sayfayı yenile.</small><button onClick={() => location.reload()}>Yeniden yükle</button></div>}
      <aside className={`sword-panel ${open ? '' : 'sword-panel-closed-state'}`}>
        <button className="sword-drawer" aria-expanded={open} onClick={() => setOpen(!open)}>{stages[stage]} · Kontroller {open ? '⌄' : '⌃'}</button>
        <div className="sword-panel-interior"><p className="sword-small">Adım {stage + 1} / 7</p><h2>{stages[stage]}</h2><p className="sword-instruction">{tileInstructions[stage]}</p>
          {vr !== 'closedState' && <p className="sword-progress">VR oturumu açık: atölye gözlükte sürüyor.</p>}
          {vrError && <p role="alert" className="sword-progress">{vrError}</p>}
          <fieldset disabled={locked} className="sword-actions">
            {stage === 4 && <div className="tile-colors" role="group" aria-label="Boya rengi">{colors.map((r) => <button key={r.id} aria-pressed={game.color === r.id} onClick={() => scene.current?.command(`color:${r.id}`)}><i style={{ background: r.live }} />{r.name}</button>)}</div>}
            {list.filter((e) => !e.id.startsWith('color:')).map((e) => e.kind === 'hold'
              ? <button key={e.id} className="sword-main" {...hold(e.id as HoldName)}>{e.name}</button>
              : <button key={e.id} className="sword-main" disabled={e.passive} onClick={() => scene.current?.command(e.id)}>{e.name}</button>)}
            {game.inKiln && <div className="sword-heat"><div><label htmlFor="tile-heat">Fırın sıcaklığı <small>{stage === 1 ? 'Oyun ölçeği' : 'Kaynak: 900-940°'}</small></label><strong>{Math.round(game.heat)}°</strong></div>
              <meter id="tile-heat" min={20} max={1100} low={interval.min} high={interval.max} optimum={(interval.min + interval.max) / 2} value={game.heat} />
              <div className="sword-scale"><span>20°</span><span>{interval.min}–{interval.max}°</span><span>1100°</span></div>
              <progress aria-label="Pişirim ilerlemesi" max={HOLD_DURATION} value={game.holding} /></div>}
            {stage === 2 && <progress aria-label="Kömürleme ilerlemesi" max={1} value={game.coalRatio} />}
            {stage === 5 && subStage === 2 && <progress aria-label="Soğuma" max={1} value={game.live} />}
          </fieldset>
          {last && <div className="sword-quality"><div><span>Eserinin kalitesi</span><strong>{quality(game)}<small>/100</small></strong></div></div>}
          <div className="sword-message" role="status" aria-live="polite">{game.message}</div>
          <div className="sword-source"><span>Atölye notu</span><p>{note.text}</p><small>Kaynak: {tileSources[note.source]}</small></div>
          {!last && <><button disabled={locked || (stage === 5 && subStage === 2)} className="sword-master" onClick={() => scene.current?.master()}>Ustaya bırak <span>↗</span></button><small className="sword-master-note">Bu adımı orta kalitede tamamla.</small></>}
        </div>
      </aside>
      <div className="sword-footer-label"><span>Toprak · ateş · sabır</span><span>{last ? 'Sürükle: çevir / Tekerlek: yaklaş' : 'Fare, dokunma veya VR kumandası'}</span></div>
    </div>
    <footer className="sword-honesty"><div><span>Model hakkında</span><strong>{tileIntro.title}</strong><small>Temsilî çini tabak</small></div><p>{tileIntro.honesty}</p></footer>
    <details className="sword-keyboard"><summary>Kaynaklar</summary>{Object.values(tileSources).map((k) => <p key={k}>{k}</p>)}</details>
    <details className="sword-keyboard"><summary>Klavye ile çalış</summary><p>Astar, sır ve ateş düğmeleri Boşluk veya Enter ile basılı tutulur. Sürükleme gerektiren adımları (şekil, kömürleme, tahrir, boyama) "Ustaya bırak" düğmesiyle tamamlayabilirsin.</p></details>
  </article>
}
