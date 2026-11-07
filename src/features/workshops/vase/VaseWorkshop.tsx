import { useEffect, useRef, useState } from 'react'
import type { VaseState, VaseScene } from './vaseScene'
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
  const vrOpen = vr !== 'closedState'
  const locked = state !== 'ready' || vrOpen

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
              message: seated ? fresh.length === 6 ? 'Vazo onarıldı! Birleşim izlerini çevirip inceleyebilirsin.' : `Parça ${id + 1} yerine oturdu.` : 'Parça henüz yerine yaklaşmadı. Kırık kenarları ve desenin devamını takip ederek yeniden dene.' }
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

  function start() {
    setGame((previous) => ({ ...firstGame, repair: true, broke: true, session: previous.session + 1,
      message: 'Parçaları kırık kenarlara ve desenin devamına göre birleştir. Doğru yere yakın bırakılan parça yerine oturur.' }))
  }

  function startVr() {
    if (!scene.current) return
    setVrError('')
    setVr('opening')
    // Keep the user gesture: requestSession runs inside this call, without await.
    scene.current.startXr().then(() => {
      setVr('open')
      // Enters VR with the vase as is: if traceless, shattering is on the panel; a partial repair continues.
      setGame((previous) => ({ ...previous, selected: null, message: 'Atölye VR gözlüğünde sürüyor.' }))
    }).catch(() => {
      setVr('closedState')
      setVrError('VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Atölyeyi bu ekranda kullanmaya devam edebilirsin.')
    })
  }

  return <article className="page vase-workshop">
    <header className="artifact-title">
      <h1>Bir parçadan bütüne.</h1>
      <p className="vase-entrance">Vazoyu çevir, ayrıntılarına yaklaş. Sonra parçaları elinle taşır gibi sürükleyerek birleştir.</p>
      <p className="vase-model-note"><span className="label">Temsili 3B model</span> Bu vazo uygulama için tasarlandı; belirli bir tarihî eseri temsil etmez.</p>
    </header>
    <div className="vase-layout-of">
      <section aria-labelledby="vase-inspect-title">
        <div className="vase-scene-title"><h2 id="vase-inspect-title">{repair && !done ? 'Tut. Sürükle. Birleştir.' : done ? 'Vazo yeniden bir bütün.' : 'Vazoyu incele'}</h2>{repair && <span>{placed.length}/6 parça</span>}</div>
        <div className="vase-scene" ref={area} tabIndex={0} role="group" aria-label="3B vazo atölyesi. Parçaları tutup birbirine ekle. Boş alandan görünümü döndür."
          onKeyDown={(e) => {
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
              '+': () => scene.current?.zoomIn(0.85), '=': () => scene.current?.zoomIn(0.85), '-': () => scene.current?.zoomIn(1.18),
            }
            if (moves[e.key]) { e.preventDefault(); moves[e.key]() }
          }} />
        {state === 'loading' && <p role="status">Vazo hazırlanıyor…</p>}
        {state === 'error' && <p role="alert">3B model açılamadı. Bağlantını ve tarayıcının WebGL desteğini kontrol edip sayfayı yenile.</p>}
        <div className="vase-controls">
          <button disabled={locked} onClick={() => scene.current?.zoomIn(0.85)}>Yakınlaştır</button>
          <button disabled={locked} onClick={() => scene.current?.zoomIn(1.18)}>Uzaklaştır</button>
          <button disabled={locked} onClick={() => scene.current?.reset()}>Görünümü sıfırla</button>
        </div>
        <p className="hint-text">{repair && !done ? 'Parçanın kendisini veya üzerindeki numarayı tutup taşı. Boş alandan sürükleyerek vazoyu döndür; tekerlekle yakınlaştır.' : 'Fare veya parmakla çevir; tekerlek veya iki parmakla yakınlaştır.'}</p>
      </section>
      <section className="vase-task" aria-labelledby="vase-repair-title">
        <p className="top-title">Senin dokunuşun</p>
        <h2 id="vase-repair-title">Vazoyu restore et</h2>
        {!repair ? <>
          <p>Altı parça, tek bir vazo. Parçaları sahnede tutup doğru yere yaklaştır; bıraktığında yerine otursun.</p>
          <button disabled={locked} onClick={start}>Vazoyu parçala ve onar</button>
        </> : <>
          <p><strong>{placed.length}/6 parça yerinde</strong> · Deneme: {turnMove}</p>
          <progress value={placed.length} max={6} aria-label="Vazo onarım ilerlemesi" />
          {done ? <p className="answer"><strong>Vazo onarıldı!</strong> Eline sağlık. Şimdi bütün ayrıntılarıyla inceleyebilirsin.</p> : <>
            <ol className="vase-steps"><li>Bir parçayı tut.</li><li>Kırık kenarlara ve desene göre yerine taşı.</li><li>Yerini bulduğunda bırak.</li></ol>
            <details className="vase-keyboard"><summary>Klavye ile birleştir</summary><p>Bir parça seç; ok tuşlarıyla taşı, Enter ile bırak. Escape parçayı geri alır.</p>
              <div className="vase-pieces" role="group" aria-label="Klavye için parça seçimi">{Array.from({ length: 6 }, (_, id) => !placed.includes(id) && <button key={id} disabled={vrOpen} aria-pressed={selected === id} onClick={() => { setGame({ ...game, selected: id }); area.current?.focus({ preventScroll: true }) }}>Parça {id + 1}</button>)}</div>
            </details>
          </>}
          <div className="vase-controls">
            <button disabled={locked} onClick={start}>Yeniden parçala</button>
            <button disabled={locked} onClick={() => setGame(done ? { ...game, repair: false, selected: null, message: 'Onarılmış vazoyu birleşim izleriyle inceleyebilirsin.' } : { ...firstGame, session: game.session + 1, message: 'Onarım iptal edildi. Vazo başlangıç görünümüne döndü.' })}>{done ? 'İncelemeye dön' : 'Onarımı iptal et'}</button>
          </div>
        </>}
        {xrSupport && <div className="vase-vr">
          {vr === 'open'
            ? <button onClick={() => scene.current?.endXr()}>VR'dan çık</button>
            : <button disabled={state !== 'ready' || vr === 'opening'} onClick={startVr}>VR'da aç</button>}
          {vrError && <p role="alert">{vrError}</p>}
        </div>}
        <p className="vase-message" role="status">{message}</p>
      </section>
    </div>
  </article>
}
