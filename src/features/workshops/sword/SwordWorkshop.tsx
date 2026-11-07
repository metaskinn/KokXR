import { useEffect, useRef, useState } from 'react'
import { swordIntro, swordStageInfo, swordSources, swordPartNotes } from '../../../content/sword'
import { stages, firstGame, average, quality } from './engine/state'
import type { SwordScene, Command } from './engine/scene'
import { targets } from './engine/test'
import UiIcon from '../../../shared/ui/UiIcon'
import '../../../shared/ui/stage-hud.css'
import { useHudOpen, useSafeInsets } from '../useStageHud'
import './sword.css'
const instructions = ['Tezgâhtaki külçeyi seç. Ateşe ilk adımı at.', 'Körüğü basılı tut. Çeliğin rengini izle; 750–1150 aralığında örse geç.', 'Namlu boyunca tıkla veya sürükle. Her bölgeyi döverek çeliği uzat.', 'Isının 780–880 aralığına gelmesini bekle. Suya daldır düğmesini basılı tut.', 'Namlu boyunca sürükle. Her bölgeyi bile; aynı yerde fazla kalma.', 'Havada bekleyen parçaları sırayla seç. Her biri yerini bulsun.', 'Çevir, yakınlaş, ayrıntılara bak. Numaralardan parça notlarını aç.', 'Bir hedef seç. Sahnede hızlı bir kesim çizgisi çiz; kılıcını dene.']
export default function SwordWorkshop() {
  const area = useRef<HTMLDivElement>(null), root = useRef<HTMLElement>(null), scene = useRef<SwordScene | null>(null)
  const [game, setGame] = useState(firstGame), [ready, setReady] = useState(false), [error, setError] = useState(false), [sound, setSound] = useState(true), [note, setNote] = useState<number | null>(null), [open, setOpen] = useState(true), [xrSupport, setXrSupport] = useState(false), [xrOpen, setXrOpen] = useState(false), [xrError, setXrError] = useState(false)
  useEffect(() => {
    let cancel = false, local: SwordScene | undefined
    import('./engine/scene').then(async ({ createScene }) => {
      if (cancel || !area.current) return
      local = await createScene(area.current, d => { if (!cancel) setGame(d) }, () => { if (!cancel) setError(true) }, id => { if (!cancel) setNote(id) }, a => { if (!cancel) setXrOpen(a) })
      if (cancel) { local.clear(); return }
      scene.current = local; setReady(true)
    }).catch(() => { if (!cancel) setError(true) })
    return () => { cancel = true; local?.clear(); scene.current = null }
  }, [])
  useEffect(() => {
    let cancel = false
    void (async () => {
      let support = false
      try { support = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { support = false }
      if (!cancel) setXrSupport(support)
    })()
    return () => { cancel = true }
  }, [])
  const { stage, selected, master } = game, heat = Math.round(average(game, 'heat')), activeNote = note === null ? null : swordPartNotes[note]
  const sourced = stage === 3 ? swordStageInfo.water : stage >= 5 ? swordStageInfo.equip : swordStageInfo.ingot
  const stageBox = useRef<HTMLDivElement>(null), hud = useRef<HTMLDivElement>(null), title = useRef<HTMLParagraphElement>(null)
  const [hudOpen, toggleHud] = useHudOpen()
  const heatShown = stage >= 1 && stage <= 3
  useSafeInsets(stageBox, hud, title, insets => scene.current?.setSafeInsets(insets), ready, `${hudOpen}-${stage}-${game.again}-${xrSupport}-${xrOpen}`)
  const busy = !ready || error || master
  function fullScreen() { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void root.current?.requestFullscreen?.().catch(() => {}) }
  function vrAc() {
    setXrError(false); setXrOpen(true)
    // The browser only opens the session inside a user gesture: no await before this.
    scene.current?.startXr().catch(() => { setXrOpen(false); setXrError(true) })
  }
  function command(name: Command) { scene.current?.command(name); if (name === 'fromStart') setNote(null) }
  const hold = (name: 'bellows' | 'water' | 'wrist') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); scene.current?.hold(name, true) },
    onPointerUp: () => scene.current?.hold(name, false), onPointerCancel: () => scene.current?.hold(name, false), onLostPointerCapture: () => scene.current?.hold(name, false),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); scene.current?.hold(name, true) } },
    onKeyUp: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); scene.current?.hold(name, false) } }, onBlur: () => scene.current?.hold(name, false),
  })
  // The stage's main action floats in the HUD; everything else stays in the panel beside (desktop) or below (phone) the scene.
  const main = stage === 0 ? <button type="button" className="hud-primary sword-main" disabled={busy} onClick={() => command('al')}><UiIcon name="next" /><span>Külçeyi al</span></button>
    : stage === 1 || game.again ? <button type="button" className="hud-primary sword-main" disabled={busy} {...hold('bellows')}><UiIcon name="up" /><span>Körüğü basılı tut</span></button>
    : stage === 3 ? <button type="button" className="hud-primary sword-main" disabled={busy} {...hold('water')}><UiIcon name="down" /><span>Suya daldır · basılı tut</span></button>
    : stage === 5 ? <button type="button" className="hud-primary sword-main" disabled={busy} onClick={() => command('clink')}><UiIcon name="check" /><span>Sıradaki parçayı yerleştir</span></button>
    : stage === 6 ? <button type="button" className="hud-primary sword-main" disabled={busy} onClick={() => command('continue')}><span>Test alanına geç →</span></button>
    : stage === 7 ? <button type="button" className="hud-primary sword-main" disabled={busy || game.broke} onClick={() => command('cutOff')}><UiIcon name="next" /><span>Kes</span></button>
    : null
  const anvil = (stage === 1 || game.again) && <button type="button" className="sword-next" disabled={busy || heat < 750} onClick={() => command('continue')}><span>Örse geç →</span></button>
  const vrButton = xrSupport && <button type="button" disabled={!ready || error || xrOpen} onClick={vrAc}><UiIcon name="vr" /><span>{xrOpen ? 'VR açık' : "VR'da aç"}</span></button>
  const soundButton = <button type="button" aria-pressed={sound} onClick={() => { setSound(!sound); scene.current?.sound(!sound) }}><UiIcon name={sound ? 'check' : 'x'} /><span>{sound ? 'Ses açık' : 'Ses kapalı'}</span></button>
  return <article className="page workshop sword-workshop" ref={root}>
    <header className="workshop-head">
      <h1>Kılıç atölyesi</h1>
      <p className="workshop-task">Külçeyi ısıt, döv, su ver ve bile; parçaları takıp kılıcını test alanında dene.</p>
    </header>
    <ol className="sword-stages" aria-label="Üretim aşamaları">{stages.map((name, i) => <li key={name} aria-current={i === stage ? 'step' : undefined} className={i < stage ? 'done' : ''}><span>{i < stage ? <UiIcon name="check" /> : `${i + 1}`}</span><span>{name}</span></li>)}</ol>
    <div className="workshop-layout sword-experience">
      <div className="workshop-scene">
        <div className="stage sword-stage" ref={stageBox}>
          <div className="sword-scene" ref={area} tabIndex={0} role="group" aria-label="Kılıç atölyesi sahnesi. Oklarla bölge seç, Enter ile vur, Boşluk ile körük veya bileme; test alanında Enter ile kes." />
          <p className="stage-title glass sword-scene-title" ref={title}><span>{stage + 1}. {stages[stage]}</span>{heatShown && <span className="sword-live"> · {heat}°</span>}</p>
          {!ready && !error && <div className="model-state glass sword-loading" role="status"><strong>Atölye hazırlanıyor…</strong><small>Modeller ve malzemeler yükleniyor.</small></div>}
          {xrError && <p className="model-state glass sword-xr-error" role="alert">VR oturumu başlatılamadı. Atölyeyi ekranda kullanmaya devam edebilirsin.</p>}
          {error && <div className="model-state glass sword-loading" role="alert" data-actions="">Atölye görüntülenemedi.<small>Model yüklenemedi veya WebGL kullanılamıyor. Bağlantını ve tarayıcı desteğini kontrol edip sayfayı yenile.</small><button type="button" onClick={() => location.reload()}>Yeniden yükle</button></div>}
          <div className="hud glass sword-hud" ref={hud} role="toolbar" aria-label="Atölye kontrolleri" data-open={String(hudOpen)} onPointerDown={e => e.stopPropagation()}>
            <div className="hud-main">
              {main}
              {anvil}
              <button type="button" className="hud-toggle" aria-expanded={hudOpen} aria-controls="sword-hud-more" onClick={toggleHud}><UiIcon name="up" /><span className="hud-label-short">Kontroller</span><span className="hud-label-long">Kontrolleri gizle</span></button>
            </div>
            <div className="hud-more" id="sword-hud-more">
              {vrButton}
              {soundButton}
              <button type="button" onClick={() => command('fromStart')}><UiIcon name="reset" /><span>Baştan başla</span></button>
              <button type="button" onClick={fullScreen}><UiIcon name="full" /><span>Tam ekran</span></button>
            </div>
            <div className="hud-rail">
              {vrButton}
              {soundButton}
              <button type="button" onClick={() => command('fromStart')} aria-label="Baştan başla"><UiIcon name="reset" /><span>Baştan</span></button>
              <button type="button" onClick={fullScreen}><UiIcon name="full" /><span>Tam ekran</span></button>
            </div>
            <p className="sword-keys">{stage === 6 ? 'Sürükle: çevir · Tekerlek: yaklaş' : stage === 7 ? 'Sürükle: kesim çiz' : 'Fare, dokunma veya klavye'}</p>
          </div>
          {activeNote && stage === 6 && <section className="model-info-card glass sword-piece-note" role="dialog" aria-label={activeNote.title}><button type="button" className="model-info-close" aria-label="Parça notunu kapat" onClick={() => setNote(null)}><UiIcon name="x" /></button><h3>{activeNote.title}</h3><p>{activeNote.text}</p><small className="source">Kaynak: {swordSources[activeNote.source]}</small></section>}
        </div>
      </div>
      <aside className={`workshop-panel sword-panel ${open ? '' : 'sword-panel-closed-state'}`} aria-label="Aşama paneli">
        <button type="button" className="sword-drawer" aria-expanded={open} onClick={() => setOpen(!open)}><span>Adım {stage + 1} / 8 · {stages[stage]}</span><UiIcon name={open ? 'up' : 'down'} /></button>
        <div className="sword-panel-interior"><p className="sword-small">Adım {stage + 1} / 8</p><h2>{stages[stage]}</h2><p className="sword-instruction">{instructions[stage]}</p>
          <fieldset disabled={busy} className="sword-actions">
            {(stage === 1 || stage === 2 || stage === 3) && <div className="sword-heat"><div><label htmlFor="sword-temperature">Çelik sıcaklığı <small>Oyun ölçeği</small></label><strong>{heat}°</strong></div><meter id="sword-temperature" min={20} max={1200} low={550} high={1150} optimum={830} value={heat} /><div className="sword-scale"><span>Soğuk</span><span>{stage === 3 ? '780–880 ideal' : '750–1150 ideal'}</span><span>Yanma</span></div></div>}
            {(stage === 2 || stage === 4) && <><div className="sword-regions" role="group" aria-label="Namlu bölgeleri">{game.regions.map((b, i) => <button type="button" key={i} aria-label={`Bölge ${i + 1}`} aria-pressed={selected === i} style={{ '--progress': `${(stage === 2 ? b.p : b.skin) * 100}%` } as React.CSSProperties} onClick={() => scene.current?.select(i)}>{i + 1}</button>)}</div><p className="sword-progress">{stage === 2 ? 'Biçim' : 'Bileme'} %{Math.round(average(game, stage === 2 ? 'p' : 'skin') * 100)} · Bölge {selected + 1}</p>{stage === 2 ? <><button type="button" onClick={() => command('strike')}>Seçili bölgeye vur</button><button type="button" onClick={() => command('again')}>{game.again ? 'Ocakta ısınıyor…' : 'Yeniden ısıt'}</button></> : <button type="button" {...hold('wrist')}>Seçili bölgeyi bile · basılı tut</button>}</>}
            {stage === 3 && <><button type="button" {...hold('bellows')}>Su öncesi ısıt · basılı tut</button><progress aria-label="Su verme ilerlemesi" max="1.5" value={game.dip} /></>}
            {stage === 5 && <p className="sword-progress">{game.attached} / 7 parça yerinde</p>}
            {stage === 6 && <div className="sword-proximity"><button type="button" onClick={() => scene.current?.rotate(-.2)}><UiIcon name="back" />Sola çevir</button><button type="button" onClick={() => scene.current?.rotate(.2)}>Sağa çevir<UiIcon name="next" /></button><button type="button" onClick={() => scene.current?.zoom(.85)}><UiIcon name="zoom" />Yakınlaştır</button><button type="button" onClick={() => scene.current?.zoom(1.15)}>Uzaklaştır</button></div>}
            {stage === 7 && <><div className="sword-targets">{targets.map((name, i) => <button type="button" key={name} aria-pressed={game.target === i} onClick={() => scene.current?.target(i)}>{name}{game.damages[i] > 0 && <small> · hasar %{Math.round(game.damages[i] * 100)}</small>}</button>)}</div><button type="button" onClick={() => command('targets-renew')}><UiIcon name="reset" />Hedefleri yenile</button></>}
          </fieldset>
          {stage >= 6 && <div className="sword-quality"><div><span>Eserinin kalitesi</span><strong>{quality(game)}<small>/100</small></strong></div>{[['Sertlik', game.hardness], ['Keskinlik', average(game, 'skin')], ['Biçim', game.form]].map(([name, v]) => <label key={name}>{name}<progress max="1" value={v} /></label>)}{game.crack_ && <p><UiIcon name="alert" /> Namluda çatlak var.</p>}{game.rosette && <p className="sword-rosette">Kılıç Ustası</p>}{stage === 7 && <p>Kesim puanı: {game.score}/100</p>}</div>}
          <div className="sword-message" role="status" aria-live="polite">{game.message}</div>
          <div className="sword-source"><span>Atölye notu</span><p>{sourced.text}</p><small>Kaynak: {swordSources[sourced.source]}</small></div>
          <button type="button" disabled={busy} className="sword-master btn-wide" onClick={() => command('master')}>{master ? 'Usta çalışıyor…' : 'Ustaya bırak'}</button><small className="sword-master-note">Bu adımı animasyonla, orta kalitede tamamla.</small>
        </div>
      </aside>
    </div>
    <footer className="sword-honesty"><div><span>Model hakkında</span><strong>{swordIntro.title}</strong><small>{swordIntro.position}</small></div><p>{swordIntro.honesty}</p></footer>
    <details className="sword-keyboard"><summary>Kaynaklar</summary>{Object.values(swordSources).map(k => <p key={k}>{k}</p>)}</details>
    <details className="sword-keyboard"><summary>Klavye ile çalış · kullanım kılavuzu</summary><p>Sahneye odaklan. ← → bölge seçer; Enter külçeyi alır, çekiçle vurur, parça yerleştirir veya keser. Boşluk körük, su verme ve bileme için basılı tutulur. İncelemede ← → çevirir, + / − yakınlaştırır. Aynı işlemler etiketli düğmelerle de kullanılabilir.</p></details>
  </article>
}
