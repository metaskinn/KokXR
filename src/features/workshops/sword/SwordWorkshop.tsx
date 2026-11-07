import { useEffect, useRef, useState } from 'react'
import { swordIntro, swordStageInfo, swordSources, swordPartNotes } from '../../../content/sword'
import { stages, firstGame, average, quality } from './engine/state'
import type { SwordScene, Command } from './engine/scene'
import { targets } from './engine/test'
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
  return <article className="sword-workshop" ref={root}>
    <header className="sword-title"><div>Ateşten biçime</div><div className="sword-tools">{xrSupport && <button disabled={!ready || error || xrOpen} onClick={vrAc}>{xrOpen ? 'VR açık' : "VR'da aç"}</button>}<button aria-pressed={sound} onClick={() => { setSound(!sound); scene.current?.sound(!sound) }}>{sound ? '♪ Ses açık' : '♪ Ses kapalı'}</button><button onClick={() => command('fromStart')}>Baştan başla</button><button onClick={() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void root.current?.requestFullscreen?.().catch(() => {}) }}>⛶ Tam ekran</button></div></header>
    <ol className="sword-stages" aria-label="Üretim aşamaları">{stages.map((name, i) => <li key={name} aria-current={i === stage ? 'step' : undefined} className={i < stage ? 'done' : ''}><span>{i < stage ? '✓' : `${i + 1}`}</span><span>{name}</span></li>)}</ol>
    <div className="sword-experience">
      <div className="sword-scene" ref={area} tabIndex={0} role="group" aria-label="Kılıç atölyesi sahnesi. Oklarla bölge seç, Enter ile vur, Boşluk ile körük veya bileme; test alanında Enter ile kes." />
      <div className="sword-scene-title"><h1>{stage === 0 ? 'Bir kıvılcımla başla.' : stages[stage]}</h1><span className="sword-live">{stage === 7 ? 'Test avlusu' : stage === 6 ? 'Ayrıntıları keşfet' : 'Çeliğe biçim ver'}</span></div>
      {!ready && !error && <div className="sword-loading" role="status"><span />Atölye hazırlanıyor…<small>Modeller ve malzemeler yükleniyor.</small></div>}
      {xrError && <p className="sword-xr-error" role="alert">VR oturumu başlatılamadı. Atölyeyi ekranda kullanmaya devam edebilirsin.</p>}
      {error && <div className="sword-loading" role="alert">Atölye görüntülenemedi.<small>Model yüklenemedi veya WebGL kullanılamıyor. Bağlantını ve tarayıcı desteğini kontrol edip sayfayı yenile.</small><button onClick={() => location.reload()}>Yeniden yükle</button></div>}
      <aside className={`sword-panel ${open ? '' : 'sword-panel-closed-state'}`}>
        <button className="sword-drawer" aria-expanded={open} onClick={() => setOpen(!open)}>{stages[stage]} · Kontroller {open ? '⌄' : '⌃'}</button>
        <div className="sword-panel-interior"><p className="sword-small">Adım {stage + 1} / 8</p><h2>{stage === 0 ? 'Ateş seni bekliyor.' : stages[stage]}</h2><p className="sword-instruction">{instructions[stage]}</p>
          <fieldset disabled={!ready || error || master} className="sword-actions">
            {stage === 0 && <button className="sword-main" onClick={() => command('al')}>Külçeyi al <span>↗</span></button>}
            {(stage === 1 || game.again) && <><button className="sword-main" {...hold('bellows')}>Körüğü basılı tut</button><button disabled={heat < 750} onClick={() => command('continue')}>Örse geç →</button></>}
            {(stage === 1 || stage === 2 || stage === 3) && <div className="sword-heat"><div><label htmlFor="sword-temperature">Çelik sıcaklığı <small>Oyun ölçeği</small></label><strong>{heat}°</strong></div><meter id="sword-temperature" min={20} max={1200} low={550} high={1150} optimum={830} value={heat} /><div className="sword-scale"><span>Soğuk</span><span>{stage === 3 ? '780–880 ideal' : '750–1150 ideal'}</span><span>Yanma</span></div></div>}
            {(stage === 2 || stage === 4) && <><div className="sword-regions" role="group" aria-label="Namlu bölgeleri">{game.regions.map((b, i) => <button key={i} aria-label={`Bölge ${i + 1}`} aria-pressed={selected === i} style={{ '--progress': `${(stage === 2 ? b.p : b.skin) * 100}%` } as React.CSSProperties} onClick={() => scene.current?.select(i)}>{i + 1}</button>)}</div><p className="sword-progress">{stage === 2 ? 'Biçim' : 'Bileme'} %{Math.round(average(game, stage === 2 ? 'p' : 'skin') * 100)} · Bölge {selected + 1}</p>{stage === 2 ? <><button onClick={() => command('strike')}>Seçili bölgeye vur ↧</button><button onClick={() => command('again')}>{game.again ? 'Ocakta ısınıyor…' : 'Yeniden ısıt'}</button></> : <button {...hold('wrist')}>Seçili bölgeyi bile · basılı tut</button>}</>}
            {stage === 3 && <><button className="sword-main" {...hold('water')}>Suya daldır · basılı tut</button><button {...hold('bellows')}>Su öncesi ısıt · basılı tut</button><progress aria-label="Su verme ilerlemesi" max="1.5" value={game.dip} /></>}
            {stage === 5 && <><p className="sword-progress">{game.attached} / 7 parça yerinde</p><button className="sword-main" onClick={() => command('clink')}>Sıradaki parçayı yerleştir</button></>}
            {stage === 6 && <><div className="sword-proximity"><button aria-label="Sola çevir" onClick={() => scene.current?.rotate(-.2)}>↶</button><button aria-label="Yakınlaştır" onClick={() => scene.current?.zoom(.85)}>＋</button><button aria-label="Uzaklaştır" onClick={() => scene.current?.zoom(1.15)}>−</button><button aria-label="Sağa çevir" onClick={() => scene.current?.rotate(.2)}>↷</button></div><button className="sword-main" onClick={() => command('continue')}>Test alanına geç →</button></>}
            {stage === 7 && <><div className="sword-targets">{targets.map((name, i) => <button key={name} aria-pressed={game.target === i} onClick={() => scene.current?.target(i)}>{name}{game.damages[i] > 0 && <small> · hasar %{Math.round(game.damages[i] * 100)}</small>}</button>)}</div><button className="sword-main" disabled={game.broke} onClick={() => command('cutOff')}>Kes ↗</button><button onClick={() => command('targets-renew')}>Hedefleri yenile</button></>}
          </fieldset>
          {stage >= 6 && <div className="sword-quality"><div><span>Eserinin kalitesi</span><strong>{quality(game)}<small>/100</small></strong></div>{[['Sertlik', game.hardness], ['Keskinlik', average(game, 'skin')], ['Biçim', game.form]].map(([name, v]) => <label key={name}>{name}<progress max="1" value={v} /></label>)}{game.crack_ && <p>⚠ Namluda çatlak var.</p>}{game.rosette && <p className="sword-rosette">✦ Kılıç Ustası</p>}{stage === 7 && <p>Kesim puanı: {game.score}/100</p>}</div>}
          <div className="sword-message" role="status" aria-live="polite">{game.message}</div>
          <div className="sword-source"><span>Atölye notu</span><p>{sourced.text}</p><small>Kaynak: {swordSources[sourced.source]}</small></div>
          <button disabled={!ready || error || master} className="sword-master" onClick={() => command('master')}>{master ? 'Usta çalışıyor…' : 'Ustaya bırak'} <span>↗</span></button><small className="sword-master-note">Bu adımı animasyonla, orta kalitede tamamla.</small>
        </div>
      </aside>
      <div className="sword-footer-label"><span>Ateş · çelik · ustalık</span><span>{stage === 6 ? 'Sürükle: çevir / Tekerlek: yaklaş' : stage === 7 ? 'Sürükle: kesim çiz' : 'Fare, dokunma veya klavye'}</span></div>
      {activeNote && stage === 6 && <section className="sword-piece-note" role="dialog" aria-label={activeNote.title}><button aria-label="Parça notunu kapat" onClick={() => setNote(null)}>×</button><h3>{activeNote.title}</h3><p>{activeNote.text}</p><small>Kaynak: {swordSources[activeNote.source]}</small></section>}
    </div>
    <footer className="sword-honesty"><div><span>Model hakkında</span><strong>{swordIntro.title}</strong><small>{swordIntro.position}</small></div><p>{swordIntro.honesty}</p></footer>
    <details className="sword-keyboard"><summary>Kaynaklar</summary>{Object.values(swordSources).map(k => <p key={k}>{k}</p>)}</details>
    <details className="sword-keyboard"><summary>Klavye ile çalış · kullanım kılavuzu</summary><p>Sahneye odaklan. ← → bölge seçer; Enter külçeyi alır, çekiçle vurur, parça yerleştirir veya keser. Boşluk körük, su verme ve bileme için basılı tutulur. İncelemede ← → çevirir, + / − yakınlaştırır. Aynı işlemler etiketli düğmelerle de kullanılabilir.</p></details>
  </article>
}
