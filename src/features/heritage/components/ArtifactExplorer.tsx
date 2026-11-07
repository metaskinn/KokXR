import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../../scale-models/model.css'
import type { Source, Model } from '../../../domain/artifact'
import type { ModelScene } from '../../scale-models/modelScene'
import SourceLine from '../../../shared/ui/SourceLine'
import Section from '../../../shared/ui/Section'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const WALK_KEYS = new Set(['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Shift'])
const keyName = (e: React.KeyboardEvent) => e.key.length === 1 ? e.key.toLowerCase() : e.key

/** Touch walking pad: the pushed direction is translated into the scene's keyboard walking. Drag the screen to look around. */
function WalkPad({ keyBtn }: { keyBtn: (key: string, pressed: boolean) => void }) {
  const RADIUS = 36, THRESHOLD = 0.3
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const pressed = useRef(new Set<string>())
  const apply = (fresh: Set<string>) => {
    for (const k of pressed.current) if (!fresh.has(k)) keyBtn(k, false)
    for (const k of fresh) if (!pressed.current.has(k)) keyBtn(k, true)
    pressed.current = fresh
  }
  const release = () => { apply(new Set()); setPosition({ x: 0, y: 0 }) }
  const motion = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2)
    const length = Math.hypot(x, y)
    if (length > RADIUS) { x *= RADIUS / length; y *= RADIUS / length }
    setPosition({ x, y })
    const fresh = new Set<string>()
    if (y < -RADIUS * THRESHOLD) fresh.add('w')
    if (y > RADIUS * THRESHOLD) fresh.add('s')
    if (x < -RADIUS * THRESHOLD) fresh.add('a')
    if (x > RADIUS * THRESHOLD) fresh.add('d')
    apply(fresh)
  }
  useEffect(() => () => { for (const k of pressed.current) keyBtn(k, false) }, [keyBtn])
  return <div className="model-walking-pad" role="img" aria-label="Yürüme kolu"
    onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); motion(e) }}
    onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) motion(e) }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
    <span style={{ transform: `translate(${position.x}px, ${position.y}px)` }} />
  </div>
}

export default function ArtifactExplorer({ model, sources, name, openNow = false }: { model: Model; sources: Source[]; name: string; openNow?: boolean }) {
  const [open, setOpen] = useState(openNow)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [fragmented, setFragmented] = useState(false)
  const [auto, setAuto] = useState(!reducedMotion())
  const [announcement, setAnnouncement] = useState('')
  const [stops, setStops] = useState<{ id: string; name: string }[]>([])
  const [stop, setStop] = useState<string | null>(null)
  const [infoId, setInfoId] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [infoOverflows, setInfoOverflows] = useState(false)
  const info = model.interiorInfos?.find((b) => b.id === infoId)
  const [xrSupport, setXrSupport] = useState(false)
  // Set while the session is starting and active: page buttons must not change the scene meanwhile.
  const [xrBusy, setXrBusy] = useState(false)
  const [xrError, setXrError] = useState(false)
  const ready = state === 'ready' && !xrBusy
  const [touchscreen] = useState(() => matchMedia('(pointer: coarse)').matches)
  const walkKey = useCallback((key: string, pressed: boolean) => scene.current?.walkKey(key, pressed), [])
  const infoText = useRef<HTMLParagraphElement>(null)
  const area = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const scene = useRef<ModelScene | null>(null)

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
    if (!open || !area.current) return
    let cancel = false
    import('../../scale-models/modelScene').then(({ createModelScene }) => {
      if (cancel || !area.current) return
      try {
        scene.current = createModelScene(area.current, model.model, reducedMotion(), {
          infos: model.interiorInfos,
          sources,
          infoChanged: setInfoId,
          xrChanged: (active) => {
            setXrBusy(active)
            // Starting a session turns auto-rotate off; the button should reflect that.
            if (active) setAuto(false)
          },
        })
        setStops(scene.current.stops)
        setState('ready')
      } catch { setState('error') }
    }).catch(() => !cancel && setState('error'))
    return () => { cancel = true; scene.current?.clear(); scene.current = null; setStop(null); setInfoId(null); setXrBusy(false); setXrError(false) }
  }, [open, model.model, model.interiorInfos, sources])

  // The card collapses whenever it changes; "Devamı" appears only if the text was actually truncated.
  useEffect(() => { setInfoOpen(false) }, [infoId])
  useLayoutEffect(() => {
    const el = infoText.current
    if (el && !infoOpen) setInfoOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [infoId, infoOpen])

  function keyBtn(e: React.KeyboardEvent) {
    const s = scene.current
    if (!s || xrBusy) return // In VR the camera is rig-local; the keyboard must not override it
    if (stop && WALK_KEYS.has(keyName(e))) {
      e.preventDefault()
      s.walkKey(keyName(e), true)
      return
    }
    const action: Record<string, () => void> = {
      ArrowLeft: () => s.rotate(-0.15, 0), ArrowRight: () => s.rotate(0.15, 0),
      ArrowUp: () => s.rotate(0, -0.1), ArrowDown: () => s.rotate(0, 0.1),
      '+': () => s.zoomIn(0.85), '=': () => s.zoomIn(0.85), '-': () => s.zoomIn(1.18),
    }
    if (action[e.key]) { e.preventDefault(); action[e.key](); setAuto(false); s.auto(false) }
  }

  function openVr() {
    const s = scene.current
    if (!s) return
    setXrError(false)
    setStop(null)
    setFragmented(false)
    setXrBusy(true)
    // Browsers start the session only within a user gesture: no await may come before this.
    s.startXr().catch(() => { setXrBusy(false); setXrError(true) })
  }

  function shatter() {
    setXrError(false)
    const fresh = !fragmented
    setFragmented(fresh)
    scene.current?.shatter(fresh)
    setAnnouncement(fresh ? 'Çatı ve kubbeler kaldırıldı; içerideki payeler ve şadırvan görünüyor.' : 'Çatı ve kubbeler yerine indi.')
  }

  function goToStop(id: string | null) {
    setXrError(false)
    setStop(id)
    scene.current?.interior(id)
    if (id) { setFragmented(false); setAuto(false) }
    else setAuto(false)
    const stopName = stops.find((d) => d.id === id)?.name
    setAnnouncement(stopName ? `İç mekân görünümü: ${stopName}. W, A, S, D veya yukarı ve aşağı ok ile yürü, sol ve sağ ok ile dön.` : 'Maketin dış görünümüne dönüldü.')
    // Focus moves to the scene so keys work immediately.
    if (id) area.current?.focus({ preventScroll: true })
  }

  function closeInfo() {
    scene.current?.closeInfo()
    area.current?.focus({ preventScroll: true })
  }

  return <Section id="model-title" title="Eseri eline al" className="artifact-explorer">
    <p className="label">{model.description}</p>
    {!open ? <button type="button" className="model-start" onClick={() => setOpen(true)}>{name} maketini eline al</button> : <>
      <div className="model-box" ref={box}>
        <div className="model-area" ref={area} tabIndex={0} role="application" onKeyDown={keyBtn}
          onKeyUp={(e) => { if (WALK_KEYS.has(keyName(e))) scene.current?.walkKey(keyName(e), false) }}
          onBlur={(e) => { if (!area.current?.contains(e.relatedTarget)) scene.current?.walkRelease() }}
          onPointerDown={() => { setXrError(false); if (stop) area.current?.focus({ preventScroll: true }) }}
          aria-label={stop
            ? `${name} iç mekânı. W, A, S, D veya yukarı ve aşağı ok ile yürü, sol ve sağ ok ile dön.`
            : `${name} 3B maketi. Ok tuşlarıyla döndür, artı ve eksi ile yakınlaştır.`}>
          {stop && touchscreen && !xrBusy && <WalkPad keyBtn={walkKey} />}
        </div>
        {stop && <p className="model-keys" aria-hidden="true"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>←</kbd><kbd>→</kbd> dön · <kbd>Shift</kbd> hızlan</p>}
        {info && <aside className="model-info-card" aria-live="polite">
          <button type="button" className="model-info-close" aria-label="Bilgiyi kapat" onClick={closeInfo}>×</button>
          <h3>{info.title}</h3>
          <p ref={infoText} id="model-info-text" className={infoOpen ? 'model-info-text open' : 'model-info-text'}>{info.text}</p>
          {infoOverflows && <button type="button" className="model-info-continue" aria-expanded={infoOpen} aria-controls="model-info-text" onClick={() => setInfoOpen(!infoOpen)}>{infoOpen ? 'Daha az' : 'Devamı'}</button>}
          <SourceLine sources={sources} sourceId={info.sourceId} />
        </aside>}
        {state === 'loading' && <p className="model-state">Maket hazırlanıyor…</p>}
        {state === 'error' && <p className="model-state">Bu cihazda 3B görüntüleme (WebGL) kullanılamıyor.</p>}
        {/* Does not block dragging the scene: the user can keep using the model. */}
        {xrError && <p className="model-state" aria-live="polite" style={{ pointerEvents: 'none', textAlign: 'center', padding: '1rem', textShadow: '0 1px 4px #000' }}>VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin.</p>}
        <div className="model-control">
          {stop ? <>
            <button type="button" onClick={() => goToStop(null)}>← Dışarı çık</button>
            {stops.map((d) => <button type="button" key={d.id} aria-pressed={stop === d.id} onClick={() => goToStop(d.id)}>{d.name}</button>)}
          </> : <>
            <button type="button" disabled={!ready || !stops.length} onClick={() => goToStop(stops[0]?.id ?? null)}>İçeri gir</button>
            {xrSupport && <button type="button" disabled={!ready} onClick={openVr}>VR'da aç</button>}
            <button type="button" onClick={shatter} aria-pressed={fragmented} disabled={!ready}>{fragmented ? '⤓ Birleştir' : '⤒ Parçala'}</button>
            <button type="button" aria-pressed={auto} disabled={!ready}
              onClick={() => { setAuto(!auto); scene.current?.auto(!auto) }}>⟳ Kendi kendine dönsün</button>
            <button type="button" disabled={!ready} onClick={() => scene.current?.reset()}>Görünümü sıfırla</button>
          </>}
          {document.fullscreenEnabled && <button type="button" onClick={() => document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen()}>Tam ekran</button>}
        </div>
      </div>
      <p className="hint-text">{stop
        ? touchscreen ? 'Alttaki kolla yürü, ekranı sürükleyerek etrafına bak. Bir yapıya yaklaşınca veya üstündeki işarete basınca bilgisi açılır.' : 'W, A, S, D veya ↑ ↓ ile yürü, ← → ile dön, PageUp/PageDown ile yukarı aşağı bak, Shift ile hızlan. Sürükleyerek de etrafına bakabilirsin. Bir yapıya yaklaşınca veya üstündeki işarete basınca bilgisi açılır. Levha ve paye yazıları arşiv fotoğraflarındandır, hangi yüzde durdukları temsilîdir.'
        : 'Fareyle veya parmağınla sürükleyerek çevir, tekerlek veya iki parmakla yakınlaştır. Klavyede: maketi seçip ok tuşları ile +/−.'}</p>
    </>}
    <ul className="model-info">
      {model.infos.map((b, i) => <li key={i}>{b.text}<SourceLine sources={sources} sourceId={b.sourceId} /></li>)}
    </ul>
    <div className="invisible" aria-live="polite">{announcement}</div>
  </Section>
}
