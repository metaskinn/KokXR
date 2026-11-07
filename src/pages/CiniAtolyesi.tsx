import { useEffect, useRef, useState } from 'react'
import { ciniKaynaklari, ciniNotlari, ciniTanitim, ciniYonergeler } from '../data/cini'
import { asamalar, BISKUVI, eylemler, ilkOyun, kalite, renkler, SIR_FIRINI, TUTMA_SURESI, type Oyun } from '../components/cini/durum'
import type { CiniSahnesi, TutAd } from '../components/cini/sahne'
import './kilic.css'
import './cini.css'

export default function CiniAtolyesi() {
  const alan = useRef<HTMLDivElement>(null), sahne = useRef<CiniSahnesi | null>(null)
  const [oyun, setOyun] = useState<Oyun>(ilkOyun), [hazir, setHazir] = useState(false), [hata, setHata] = useState(false), [acik, setAcik] = useState(true)
  const [xrDestek, setXrDestek] = useState(false), [vr, setVr] = useState<'kapali' | 'aciliyor' | 'acik'>('kapali'), [vrHata, setVrHata] = useState('')

  useEffect(() => {
    let iptal = false
    const denetle = async () => {
      let destek = false
      try { destek = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { destek = false }
      if (!iptal) setXrDestek(destek)
    }
    void denetle()
    return () => { iptal = true }
  }, [])
  useEffect(() => {
    let iptal = false, yerel: CiniSahnesi | undefined
    import('../components/cini/sahne').then(({ sahneOlustur }) => {
      if (iptal || !alan.current) return
      yerel = sahneOlustur(alan.current, (d) => { if (!iptal) setOyun(d) }, () => { if (!iptal) setHata(true) })
      sahne.current = yerel; setHazir(true)
    }).catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true; yerel?.temizle(); sahne.current = null }
  }, [])
  useEffect(() => {
    const bitti = () => setVr('kapali')
    const r = alan.current
    r?.addEventListener('xrbitti', bitti)
    return () => r?.removeEventListener('xrbitti', bitti)
  }, [])

  const { asama, alt } = oyun, not = ciniNotlari[Math.min(asama, ciniNotlari.length - 1)], son = asama === 6
  const liste = eylemler(oyun), aralik = asama === 1 ? BISKUVI : SIR_FIRINI, kilitli = !hazir || hata || vr !== 'kapali'
  const tut = (ad: TutAd) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); sahne.current?.tut(ad, true) },
    onPointerUp: () => sahne.current?.tut(ad, false), onPointerCancel: () => sahne.current?.tut(ad, false), onLostPointerCapture: () => sahne.current?.tut(ad, false),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); sahne.current?.tut(ad, true) } },
    onKeyUp: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); sahne.current?.tut(ad, false) } },
    onBlur: () => sahne.current?.tut(ad, false),
  })
  function vrAc() {
    if (!sahne.current) return
    setVrHata(''); setVr('aciliyor')
    sahne.current.xrBaslat().then(() => setVr('acik')).catch(() => { setVr('kapali'); setVrHata('VR oturumu açılamadı. Atölyeye bu ekranda devam edebilirsin.') })
  }

  return <article className="kilic-atolyesi cini-atolyesi">
    <header className="kilic-baslik"><div>Çamurdan çiniye</div>
      <div className="kilic-araclar">{xrDestek && <button disabled={!hazir || hata || vr === 'aciliyor'} onClick={() => vr === 'acik' ? sahne.current?.xrBitir() : vrAc()}>{vr === 'acik' ? "VR'dan çık" : "VR'da aç"}</button>}</div></header>
    <ol className="kilic-asamalar" aria-label="Üretim aşamaları">{asamalar.map((ad, i) => <li key={ad} aria-current={i === asama ? 'step' : undefined} className={i < asama ? 'tamam' : ''}><span>{i < asama ? '✓' : `${i + 1}`}</span><span>{ad}</span></li>)}</ol>
    <div className="kilic-deneyim">
      <div className="kilic-sahne cini-sahne" ref={alan} tabIndex={0} role="group" aria-label="Çini atölyesi sahnesi. Basılı tutup sürükleyerek çalış; ustaya bırak düğmesi her adımı tamamlar." />
      <div className="kilic-sahne-basligi"><h1>{asama === 0 ? 'Bir avuç çamurla başla.' : asamalar[asama]}</h1></div>
      {!hazir && !hata && <div className="kilic-yukleme" role="status"><span />Atölye hazırlanıyor…</div>}
      {hata && <div className="kilic-yukleme" role="alert">Atölye görüntülenemedi.<small>WebGL kullanılamıyor olabilir. Tarayıcı desteğini kontrol edip sayfayı yenile.</small><button onClick={() => location.reload()}>Yeniden yükle</button></div>}
      <aside className={`kilic-panel ${acik ? '' : 'kilic-panel-kapali'}`}>
        <button className="kilic-cekmecesi" aria-expanded={acik} onClick={() => setAcik(!acik)}>{asamalar[asama]} · Kontroller {acik ? '⌄' : '⌃'}</button>
        <div className="kilic-panel-ic"><p className="kilic-kucuk">Adım {asama + 1} / 7</p><h2>{asamalar[asama]}</h2><p className="kilic-yonerge">{ciniYonergeler[asama]}</p>
          {vr !== 'kapali' && <p className="kilic-ilerleme">VR oturumu açık: atölye gözlükte sürüyor.</p>}
          {vrHata && <p role="alert" className="kilic-ilerleme">{vrHata}</p>}
          <fieldset disabled={kilitli} className="kilic-eylemler">
            {asama === 4 && <div className="cini-renkler" role="group" aria-label="Boya rengi">{renkler.map((r) => <button key={r.id} aria-pressed={oyun.renk === r.id} onClick={() => sahne.current?.komut(`renk:${r.id}`)}><i style={{ background: r.canli }} />{r.ad}</button>)}</div>}
            {liste.filter((e) => !e.id.startsWith('renk:')).map((e) => e.tur === 'tut'
              ? <button key={e.id} className="kilic-ana" {...tut(e.id as TutAd)}>{e.ad}</button>
              : <button key={e.id} className="kilic-ana" disabled={e.pasif} onClick={() => sahne.current?.komut(e.id)}>{e.ad}</button>)}
            {oyun.firinda && <div className="kilic-isi"><div><label htmlFor="cini-isi">Fırın sıcaklığı <small>{asama === 1 ? 'Oyun ölçeği' : 'Kaynak: 900-940°'}</small></label><strong>{Math.round(oyun.isi)}°</strong></div>
              <meter id="cini-isi" min={20} max={1100} low={aralik.min} high={aralik.max} optimum={(aralik.min + aralik.max) / 2} value={oyun.isi} />
              <div className="kilic-olcek"><span>20°</span><span>{aralik.min}–{aralik.max}°</span><span>1100°</span></div>
              <progress aria-label="Pişirim ilerlemesi" max={TUTMA_SURESI} value={oyun.tutma} /></div>}
            {asama === 2 && <progress aria-label="Kömürleme ilerlemesi" max={1} value={oyun.komurOran} />}
            {asama === 5 && alt === 2 && <progress aria-label="Soğuma" max={1} value={oyun.canli} />}
          </fieldset>
          {son && <div className="kilic-kalite"><div><span>Eserinin kalitesi</span><strong>{kalite(oyun)}<small>/100</small></strong></div></div>}
          <div className="kilic-mesaj" role="status" aria-live="polite">{oyun.mesaj}</div>
          <div className="kilic-kaynak"><span>Atölye notu</span><p>{not.metin}</p><small>Kaynak: {ciniKaynaklari[not.kaynak]}</small></div>
          {!son && <><button disabled={kilitli || (asama === 5 && alt === 2)} className="kilic-usta" onClick={() => sahne.current?.usta()}>Ustaya bırak <span>↗</span></button><small className="kilic-usta-not">Bu adımı orta kalitede tamamla.</small></>}
        </div>
      </aside>
      <div className="kilic-alt-etiket"><span>Toprak · ateş · sabır</span><span>{son ? 'Sürükle: çevir / Tekerlek: yaklaş' : 'Fare, dokunma veya VR kumandası'}</span></div>
    </div>
    <footer className="kilic-durustluk"><div><span>Model hakkında</span><strong>{ciniTanitim.baslik}</strong><small>Temsilî çini tabak</small></div><p>{ciniTanitim.durustluk}</p></footer>
    <details className="kilic-klavye"><summary>Kaynaklar</summary>{Object.values(ciniKaynaklari).map((k) => <p key={k}>{k}</p>)}</details>
    <details className="kilic-klavye"><summary>Klavye ile çalış</summary><p>Astar, sır ve ateş düğmeleri Boşluk veya Enter ile basılı tutulur. Sürükleme gerektiren adımları (şekil, kömürleme, tahrir, boyama) "Ustaya bırak" düğmesiyle tamamlayabilirsin.</p></details>
  </article>
}
