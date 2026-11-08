import { useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import type { VaseState, VaseScene } from './vaseScene'
import type { VaseMobileState } from './vaseXr'
import { isMobileArBrowser } from '../../scale-models/mobileAr/detect'
import VaseArOverlay from './VaseArOverlay'
import { attachVaseTouch } from './vaseTouch'
import UiIcon from '../../../shared/ui/UiIcon'
import '../../../shared/ui/stage-hud.css'
import { useHudOpen, useSafeInsets } from '../useStageHud'
import './vase.css'

interface Game extends VaseState { turnMove: number; message: string }
const firstGame: Game = { repair: false, broke: false, session: 0, placed: [], selected: null, turnMove: 0, message: '' }

export default function VaseWorkshop() {
  const area = useRef<HTMLDivElement>(null)
  const scene = useRef<VaseScene | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [game, setGame] = useState<Game>(firstGame)
  const { repair, placed, selected, turnMove, message } = game
  const done = repair && placed.length === 6
  const [xrSupport, setXrSupport] = useState(false)
  const [vr, setVr] = useState<'closedState' | 'opening' | 'open'>('closedState')
  const [vrError, setVrError] = useState('')
  // AR (Quest 3 passthrough, Android Chrome): the same repair game in the real room.
  const [arSupport, setArSupport] = useState(false)
  const [xrKind, setXrKind] = useState<'vr' | 'ar'>('vr')
  const [vrSupport, setVrSupport] = useState(false)
  // Phone AR (Android Chrome): the WebXR dom-overlay root, shown only during the session, and its state from vaseXr.
  const [phone] = useState(isMobileArBrowser)
  const overlayRoot = useRef<HTMLDivElement>(null)
  const [overlayOn, setOverlayOn] = useState(false)
  const [mobileState, setMobileState] = useState<VaseMobileState | null>(null)
  const vrOpen = vr !== 'closedState'
  const locked = state !== 'ready' || vrOpen
  const stage = useRef<HTMLDivElement>(null), hud = useRef<HTMLDivElement>(null), title = useRef<HTMLParagraphElement>(null)
  const [hudOpen, toggleHud] = useHudOpen()
  useSafeInsets(stage, hud, title, (insets) => scene.current?.setSafeInsets(insets), state === 'ready', `${hudOpen}-${repair && !done}-${xrSupport}-${vr}`)

  useEffect(() => {
    let cancel = false
    const inspect = async () => {
      let support = false
      try { support = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { support = false }
      let arOk = false
      try { arOk = !!(await navigator.xr?.isSessionSupported('immersive-ar')) } catch { arOk = false }
      if (!cancel) { setXrSupport(support || arOk); setVrSupport(support); setArSupport(arOk) }
    }
    void inspect()
    return () => { cancel = true }
  }, [])

  useEffect(() => {
    let cancel = false
    let local: VaseScene | undefined
    import('./vaseScene').then(async ({ createVaseScene }) => {
      if (cancel || !area.current) return
      local = await createVaseScene(area.current, {
        select: (id) => { if (!cancel) setGame((previous) => ({ ...previous, selected: id })) },
        release: (id, seated) => {
          if (cancel) return
          setGame((previous) => {
            if (!previous.repair || previous.placed.includes(id)) return previous
            const fresh = seated ? [...previous.placed, id] : previous.placed
            return { ...previous, placed: fresh, selected: seated ? null : id, turnMove: previous.turnMove + 1,
              message: seated ? fresh.length === 6 ? 'Vazo onarıldı. Birleşim izlerini çevirip inceleyebilirsin.' : `Parça ${id + 1} yerine oturdu.` : 'Parça henüz yerine yaklaşmadı. Kırık kenarları ve desenin devamını takip ederek yeniden dene.' }
          })
        },
        error: () => { if (!cancel) setState('error') },
        xrEnded: () => {
          if (cancel) return
          setVr('closedState')
          setGame((previous) => ({ ...previous, selected: null, message: previous.placed.length === 6 ? 'VR oturumu kapandı. Onarılan vazoyu burada da inceleyebilirsin.' : previous.repair ? `VR oturumu kapandı. ${previous.placed.length}/6 parça yerinde; onarıma burada devam edebilirsin.` : 'VR oturumu kapandı.' }))
        },
        xrShatter: () => { if (!cancel) start() },
      })
      if (cancel) { local.clear(); return }
      scene.current = local
      setState('ready')
    }).catch(() => { if (!cancel) setState('error') })
    return () => { cancel = true; local?.clear(); scene.current = null }
  }, [])

  useEffect(() => { scene.current?.update(game) }, [game, state])

  // Phone AR touch on the overlay root only while the turntable is placed; detached on replace and on end.
  const placedOnPhone = !!mobileState && !mobileState.placing
  useEffect(() => {
    const root = overlayRoot.current
    if (!placedOnPhone || !root) return
    const control = () => scene.current?.mobileAr
    return attachVaseTouch(root, {
      start: (x, y) => control()?.touchStart(x, y) ?? false,
      move: (x, y) => control()?.touchMove(x, y),
      end: () => control()?.touchEnd(),
      cancel: () => control()?.touchCancel(),
      turn: (rad) => control()?.rotateBy(rad),
      scale: (factor) => control()?.scaleBy(factor),
    })
  }, [placedOnPhone])

  function start() {
    setGame((previous) => ({ ...firstGame, repair: true, broke: true, session: previous.session + 1,
      message: 'Parçaları kırık kenarlara ve desenin devamına göre birleştir. Doğru yere yakın bırakılan parça yerine oturur.' }))
  }

  function startVr(kind: 'vr' | 'ar' = 'vr') {
    if (!scene.current) return
    setXrKind(kind)
    setVrError('')
    setVr('opening')
    const root = kind === 'ar' && phone ? overlayRoot.current : null
    // The dom-overlay root must be laid out before requestSession. flushSync alone did not commit in time on the scale models
    // (the request saw display: none), so the style is also set directly; the state keeps React in step for hiding it later.
    if (root) {
      root.style.display = ''
      root.style.position = 'fixed'
      root.style.inset = '0'
      flushSync(() => setOverlayOn(true))
    }
    const onMobileState = (st: VaseMobileState | null) => {
      setMobileState(st)
      if (!st) setOverlayOn(false)
    }
    // Keep the user gesture: requestSession runs inside this call, without await.
    scene.current.startXr(kind, root ? { overlayRoot: root, onMobileState } : undefined).then(() => {
      setVr('open')
      // Enters VR with the vase as is: if traceless, shattering is on the panel; a partial repair continues.
      setGame((previous) => ({ ...previous, selected: null, message: kind === 'ar' ? 'Atölye AR\'da, gerçek odanda sürüyor.' : 'Atölye VR gözlüğünde sürüyor.' }))
    }).catch(() => {
      setOverlayOn(false)
      setMobileState(null)
      setVr('closedState')
      setVrError(kind === 'ar' ? 'AR oturumu açılamadı. Kamera ya da geçiş görüntüsü izni reddedilmiş olabilir. Atölyeyi bu ekranda kullanmaya devam edebilirsin.' : 'VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Atölyeyi bu ekranda kullanmaya devam edebilirsin.')
    })
  }

  const zoomIn = () => scene.current?.zoomIn(0.85), zoomOut = () => scene.current?.zoomIn(1.18), resetView = () => scene.current?.reset()
  const keys = (e: React.KeyboardEvent) => {
    if (vrOpen) return
    if (repair && selected !== null && !placed.includes(selected)) {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }
      if (moves[e.key]) { e.preventDefault(); scene.current?.dragPiece(...moves[e.key]); return }
      if (e.key === 'Enter') { e.preventDefault(); scene.current?.releasePiece(); return }
      if (e.key === 'Escape') { e.preventDefault(); scene.current?.cancel(); return }
    }
    const moves: Record<string, () => void> = {
      ArrowLeft: () => scene.current?.rotate(-0.15, 0), ArrowRight: () => scene.current?.rotate(0.15, 0),
      ArrowUp: () => scene.current?.rotate(0, -0.15), ArrowDown: () => scene.current?.rotate(0, 0.15),
      '+': zoomIn, '=': zoomIn, '-': zoomOut,
    }
    if (moves[e.key]) { e.preventDefault(); moves[e.key]() }
  }
  const vrButton = xrSupport && (vr === 'open'
    ? <button type="button" className="hud-primary" onClick={() => scene.current?.endXr()}><UiIcon name="exit" /><span>{xrKind === 'ar' ? "AR'dan çık" : "VR'dan çık"}</span></button>
    : <>
      {/* AR is the bright action where it exists (Quest 3, Android); VR stays next to it. */}
      {arSupport && <button type="button" className="hud-primary" disabled={state !== 'ready' || vr === 'opening'} onClick={() => startVr('ar')}><UiIcon name="cube" /><span>AR'da aç</span></button>}
      {vrSupport && <button type="button" className={arSupport ? undefined : 'hud-primary'} disabled={state !== 'ready' || vr === 'opening'} onClick={() => startVr('vr')}><UiIcon name="vr" /><span>VR'da aç</span></button>}
    </>)

  return <article className="page workshop vase-workshop">
    <header className="workshop-head">
      <h1>Vazo atölyesi</h1>
      <p className="workshop-task">Vazoyu çevir, ayrıntılarına yaklaş, sonra parçaları sürükleyerek birleştir.</p>
      <p className="workshop-note"><span className="label">Temsili 3B model</span> Bu vazo uygulama için tasarlandı; belirli bir tarihî eseri temsil etmez.</p>
    </header>
    <div className="workshop-layout vase-layout-of">
      <section className="workshop-scene" aria-labelledby="vase-inspect-title">
        <h2 id="vase-inspect-title" className="sr-only">{repair && !done ? 'Vazoyu birleştir' : 'Vazoyu incele'}</h2>
        <div className="stage vase-stage" ref={stage}>
          <div className="vase-scene" ref={area} tabIndex={0} role="group" aria-label="3B vazo atölyesi. Parçaları tutup birbirine ekle. Boş alandan görünümü döndür." onKeyDown={keys} />
          {repair && <p className="stage-title glass" ref={title}>{placed.length}/6 parça</p>}
          {state === 'loading' && <p className="model-state glass" role="status">Vazo hazırlanıyor…</p>}
          {state === 'error' && <p className="model-state glass" role="alert">3B model açılamadı. Bağlantını ve tarayıcının WebGL desteğini kontrol edip sayfayı yenile.</p>}
          <div className={`hud glass${xrSupport ? '' : ' hud-compact'}`} ref={hud} role="toolbar" aria-label="Görünüm kontrolleri" data-open={String(hudOpen)} onPointerDown={(e) => e.stopPropagation()}>
            <div className="hud-main">
              {vrButton}
              <button type="button" className="hud-toggle" aria-expanded={hudOpen} aria-controls="vase-hud-more" onClick={toggleHud}><UiIcon name="up" /><span className="hud-label-short">Kontroller</span><span className="hud-label-long">Kontrolleri gizle</span></button>
            </div>
            <div className="hud-more" id="vase-hud-more">
              <button type="button" disabled={locked} onClick={zoomIn}><UiIcon name="zoom" /><span>Yakınlaştır</span></button>
              <button type="button" disabled={locked} onClick={zoomOut}><span>Uzaklaştır</span></button>
              <button type="button" disabled={locked} onClick={resetView} aria-label="Görünümü sıfırla"><UiIcon name="reset" /><span className="hud-label-short">Sıfırla</span><span className="hud-label-long">Görünümü sıfırla</span></button>
            </div>
            <div className="hud-rail">
              <button type="button" disabled={locked} onClick={zoomIn}><UiIcon name="zoom" /><span>Yakınlaştır</span></button>
              <button type="button" disabled={locked} onClick={zoomOut}><span>Uzaklaştır</span></button>
              <button type="button" disabled={locked} onClick={resetView} aria-label="Görünümü sıfırla"><UiIcon name="reset" /><span>Sıfırla</span></button>
            </div>
          </div>
        </div>
        <p className="workshop-hint">{repair && !done ? 'Parçanın kendisini veya üzerindeki numarayı tutup taşı. Boş alandan sürükleyerek vazoyu döndür; tekerlekle yakınlaştır.' : 'Fare veya parmakla çevir; tekerlek veya iki parmakla yakınlaştır.'}</p>
      </section>
      <section className="workshop-panel vase-task" aria-labelledby="vase-repair-title">
        <h2 id="vase-repair-title">Vazoyu onar</h2>
        {!repair ? <>
          <p>Altı parça, tek bir vazo. Parçaları sahnede tutup doğru yere yaklaştır; bıraktığında yerine otursun.</p>
          <button type="button" className={xrSupport ? 'btn-wide' : 'btn-primary btn-wide'} disabled={locked} onClick={start}><UiIcon name="explode" />Vazoyu parçala ve onar</button>
        </> : <>
          <p className="vase-progress"><strong>{placed.length}/6 parça yerinde</strong> · Deneme: {turnMove}</p>
          <progress value={placed.length} max={6} aria-label="Vazo onarım ilerlemesi" />
          {done ? <p className="answer"><strong>Vazo onarıldı.</strong> Şimdi bütün ayrıntılarıyla inceleyebilirsin.</p> : <>
            <ol className="vase-steps"><li>Bir parçayı tut.</li><li>Kırık kenarlara ve desene göre yerine taşı.</li><li>Yerini bulduğunda bırak.</li></ol>
            <details className="vase-keyboard"><summary>Klavye ile birleştir</summary><p>Bir parça seç; ok tuşlarıyla taşı, Enter ile bırak. Escape parçayı geri alır.</p>
              <div className="vase-pieces" role="group" aria-label="Klavye için parça seçimi">{Array.from({ length: 6 }, (_, id) => !placed.includes(id) && <button type="button" key={id} disabled={vrOpen} aria-pressed={selected === id} onClick={() => { setGame({ ...game, selected: id }); area.current?.focus({ preventScroll: true }) }}>Parça {id + 1}</button>)}</div>
            </details>
          </>}
          <div className="vase-controls">
            <button type="button" disabled={locked} onClick={start}><UiIcon name="explode" />Yeniden parçala</button>
            <button type="button" disabled={locked} onClick={() => setGame(done ? { ...game, repair: false, selected: null, message: 'Onarılmış vazoyu birleşim izleriyle inceleyebilirsin.' } : { ...firstGame, session: game.session + 1, message: 'Onarım iptal edildi. Vazo başlangıç görünümüne döndü.' })}>{done ? <><UiIcon name="back" />İncelemeye dön</> : <><UiIcon name="x" />Onarımı iptal et</>}</button>
          </div>
        </>}
        {vrError && <p className="inline-error vase-vr-error" role="alert">{vrError}</p>}
        <p className="vase-message" role="status">{message}</p>
      </section>
    </div>
    {phone && createPortal(
      <div ref={overlayRoot} className="mar-root" style={overlayOn ? { position: 'fixed', inset: 0 } : { display: 'none' }}>
        {mobileState && <VaseArOverlay state={mobileState}
          onAction={() => scene.current?.mobileAr.action()}
          onReplace={() => scene.current?.mobileAr.replace()}
          onExit={() => scene.current?.mobileAr.exit()} />}
      </div>,
      document.body,
    )}
  </article>
}
