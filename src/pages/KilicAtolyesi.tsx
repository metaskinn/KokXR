import { useEffect, useRef, useState } from 'react'
import { kilicTanitim, kilicAsamaBilgileri, kilicKaynaklari, kilicParcaNotlari } from '../data/kilic'
import { asamalar, ilkOyun, ortalama, kalite } from '../components/kilic/durum'
import type { KilicSahnesi, Komut } from '../components/kilic/sahne'
import { hedefler } from '../components/kilic/test'
import './kilic.css'
const yonergeler = ['Tezgâhtaki külçeyi seç. Ateşe ilk adımı at.', 'Körüğü basılı tut. Çeliğin rengini izle; 750–1150 aralığında örse geç.', 'Namlu boyunca tıkla veya sürükle. Her bölgeyi döverek çeliği uzat.', 'Isının 780–880 aralığına gelmesini bekle. Suya daldır düğmesini basılı tut.', 'Namlu boyunca sürükle. Her bölgeyi bile; aynı yerde fazla kalma.', 'Havada bekleyen parçaları sırayla seç. Her biri yerini bulsun.', 'Çevir, yakınlaş, ayrıntılara bak. Numaralardan parça notlarını aç.', 'Bir hedef seç. Sahnede hızlı bir kesim çizgisi çiz; kılıcını dene.']
export default function KilicAtolyesi() {
  const alan = useRef<HTMLDivElement>(null), kok = useRef<HTMLElement>(null), scene = useRef<KilicSahnesi | null>(null)
  const [oyun, setOyun] = useState(ilkOyun), [hazir, setHazir] = useState(false), [hata, setHata] = useState(false), [ses, setSes] = useState(true), [not, setNot] = useState<number | null>(null), [acik, setAcik] = useState(true), [xrDestek, setXrDestek] = useState(false), [xrAcik, setXrAcik] = useState(false), [xrHata, setXrHata] = useState(false)
  useEffect(() => {
    let iptal = false, yerel: KilicSahnesi | undefined
    import('../components/kilic/sahne').then(async ({ sahneOlustur }) => {
      if (iptal || !alan.current) return
      yerel = await sahneOlustur(alan.current, d => { if (!iptal) setOyun(d) }, () => { if (!iptal) setHata(true) }, id => { if (!iptal) setNot(id) }, a => { if (!iptal) setXrAcik(a) })
      if (iptal) { yerel.temizle(); return }
      scene.current = yerel; setHazir(true)
    }).catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true; yerel?.temizle(); scene.current = null }
  }, [])
  useEffect(() => {
    let iptal = false
    void (async () => {
      let destek = false
      try { destek = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { destek = false }
      if (!iptal) setXrDestek(destek)
    })()
    return () => { iptal = true }
  }, [])
  const { asama, secili, usta } = oyun, isi = Math.round(ortalama(oyun, 'isi')), aktifNot = not === null ? null : kilicParcaNotlari[not]
  const kaynakli = asama === 3 ? kilicAsamaBilgileri.su : asama >= 5 ? kilicAsamaBilgileri.kusanma : kilicAsamaBilgileri.kulce
  function vrAc() {
    setXrHata(false); setXrAcik(true)
    // Tarayıcı oturumu yalnız kullanıcı jesti içinde açar: bundan önce await olmamalı.
    scene.current?.xrBaslat().catch(() => { setXrAcik(false); setXrHata(true) })
  }
  function komut(ad: Komut) { scene.current?.komut(ad); if (ad === 'bastan') setNot(null) }
  const tut = (ad: 'koruk' | 'su' | 'bile') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); scene.current?.tut(ad, true) },
    onPointerUp: () => scene.current?.tut(ad, false), onPointerCancel: () => scene.current?.tut(ad, false), onLostPointerCapture: () => scene.current?.tut(ad, false),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); scene.current?.tut(ad, true) } },
    onKeyUp: (e: React.KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); scene.current?.tut(ad, false) } }, onBlur: () => scene.current?.tut(ad, false),
  })
  return <article className="kilic-atolyesi" ref={kok}>
    <header className="kilic-baslik"><div>Ateşten biçime</div><div className="kilic-araclar">{xrDestek && <button disabled={!hazir || hata || xrAcik} onClick={vrAc}>{xrAcik ? 'VR açık' : "VR'da aç"}</button>}<button aria-pressed={ses} onClick={() => { setSes(!ses); scene.current?.ses(!ses) }}>{ses ? '♪ Ses açık' : '♪ Ses kapalı'}</button><button onClick={() => komut('bastan')}>Baştan başla</button><button onClick={() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void kok.current?.requestFullscreen?.().catch(() => {}) }}>⛶ Tam ekran</button></div></header>
    <ol className="kilic-asamalar" aria-label="Üretim aşamaları">{asamalar.map((ad, i) => <li key={ad} aria-current={i === asama ? 'step' : undefined} className={i < asama ? 'tamam' : ''}><span>{i < asama ? '✓' : `${i + 1}`}</span><span>{ad}</span></li>)}</ol>
    <div className="kilic-deneyim">
      <div className="kilic-sahne" ref={alan} tabIndex={0} role="group" aria-label="Kılıç atölyesi sahnesi. Oklarla bölge seç, Enter ile vur, Boşluk ile körük veya bileme; test alanında Enter ile kes." />
      <div className="kilic-sahne-basligi"><h1>{asama === 0 ? 'Bir kıvılcımla başla.' : asamalar[asama]}</h1><span className="kilic-canli">{asama === 7 ? 'Test avlusu' : asama === 6 ? 'Ayrıntıları keşfet' : 'Çeliğe biçim ver'}</span></div>
      {!hazir && !hata && <div className="kilic-yukleme" role="status"><span />Atölye hazırlanıyor…<small>Modeller ve malzemeler yükleniyor.</small></div>}
      {xrHata && <p className="kilic-xr-hata" role="alert">VR oturumu başlatılamadı. Atölyeyi ekranda kullanmaya devam edebilirsin.</p>}
      {hata && <div className="kilic-yukleme" role="alert">Atölye görüntülenemedi.<small>Model yüklenemedi veya WebGL kullanılamıyor. Bağlantını ve tarayıcı desteğini kontrol edip sayfayı yenile.</small><button onClick={() => location.reload()}>Yeniden yükle</button></div>}
      <aside className={`kilic-panel ${acik ? '' : 'kilic-panel-kapali'}`}>
        <button className="kilic-cekmecesi" aria-expanded={acik} onClick={() => setAcik(!acik)}>{asamalar[asama]} · Kontroller {acik ? '⌄' : '⌃'}</button>
        <div className="kilic-panel-ic"><p className="kilic-kucuk">Adım {asama + 1} / 8</p><h2>{asama === 0 ? 'Ateş seni bekliyor.' : asamalar[asama]}</h2><p className="kilic-yonerge">{yonergeler[asama]}</p>
          <fieldset disabled={!hazir || hata || usta} className="kilic-eylemler">
            {asama === 0 && <button className="kilic-ana" onClick={() => komut('al')}>Külçeyi al <span>↗</span></button>}
            {(asama === 1 || oyun.yeniden) && <><button className="kilic-ana" {...tut('koruk')}>Körüğü basılı tut</button><button disabled={isi < 750} onClick={() => komut('devam')}>Örse geç →</button></>}
            {(asama === 1 || asama === 2 || asama === 3) && <div className="kilic-isi"><div><label htmlFor="kilic-sicaklik">Çelik sıcaklığı <small>Oyun ölçeği</small></label><strong>{isi}°</strong></div><meter id="kilic-sicaklik" min={20} max={1200} low={550} high={1150} optimum={830} value={isi} /><div className="kilic-olcek"><span>Soğuk</span><span>{asama === 3 ? '780–880 ideal' : '750–1150 ideal'}</span><span>Yanma</span></div></div>}
            {(asama === 2 || asama === 4) && <><div className="kilic-bolgeler" role="group" aria-label="Namlu bölgeleri">{oyun.bolgeler.map((b, i) => <button key={i} aria-label={`Bölge ${i + 1}`} aria-pressed={secili === i} style={{ '--ilerleme': `${(asama === 2 ? b.p : b.cilt) * 100}%` } as React.CSSProperties} onClick={() => scene.current?.sec(i)}>{i + 1}</button>)}</div><p className="kilic-ilerleme">{asama === 2 ? 'Biçim' : 'Bileme'} %{Math.round(ortalama(oyun, asama === 2 ? 'p' : 'cilt') * 100)} · Bölge {secili + 1}</p>{asama === 2 ? <><button onClick={() => komut('vur')}>Seçili bölgeye vur ↧</button><button onClick={() => komut('yeniden')}>{oyun.yeniden ? 'Ocakta ısınıyor…' : 'Yeniden ısıt'}</button></> : <button {...tut('bile')}>Seçili bölgeyi bile · basılı tut</button>}</>}
            {asama === 3 && <><button className="kilic-ana" {...tut('su')}>Suya daldır · basılı tut</button><button {...tut('koruk')}>Su öncesi ısıt · basılı tut</button><progress aria-label="Su verme ilerlemesi" max="1.5" value={oyun.daldirma} /></>}
            {asama === 5 && <><p className="kilic-ilerleme">{oyun.takilan} / 7 parça yerinde</p><button className="kilic-ana" onClick={() => komut('tak')}>Sıradaki parçayı yerleştir</button></>}
            {asama === 6 && <><div className="kilic-yakinlik"><button aria-label="Sola çevir" onClick={() => scene.current?.dondur(-.2)}>↶</button><button aria-label="Yakınlaştır" onClick={() => scene.current?.zoom(.85)}>＋</button><button aria-label="Uzaklaştır" onClick={() => scene.current?.zoom(1.15)}>−</button><button aria-label="Sağa çevir" onClick={() => scene.current?.dondur(.2)}>↷</button></div><button className="kilic-ana" onClick={() => komut('devam')}>Test alanına geç →</button></>}
            {asama === 7 && <><div className="kilic-hedefler">{hedefler.map((ad, i) => <button key={ad} aria-pressed={oyun.hedef === i} onClick={() => scene.current?.hedef(i)}>{ad}{oyun.hasarlar[i] > 0 && <small> · hasar %{Math.round(oyun.hasarlar[i] * 100)}</small>}</button>)}</div><button className="kilic-ana" disabled={oyun.kirildi} onClick={() => komut('kes')}>Kes ↗</button><button onClick={() => komut('hedefleri-yenile')}>Hedefleri yenile</button></>}
          </fieldset>
          {asama >= 6 && <div className="kilic-kalite"><div><span>Eserinin kalitesi</span><strong>{kalite(oyun)}<small>/100</small></strong></div>{[['Sertlik', oyun.sertlik], ['Keskinlik', ortalama(oyun, 'cilt')], ['Biçim', oyun.bicim]].map(([ad, v]) => <label key={ad}>{ad}<progress max="1" value={v} /></label>)}{oyun.catlak && <p>⚠ Namluda çatlak var.</p>}{oyun.rozet && <p className="kilic-rozet">✦ Kılıç Ustası</p>}{asama === 7 && <p>Kesim puanı: {oyun.puan}/100</p>}</div>}
          <div className="kilic-mesaj" role="status" aria-live="polite">{oyun.mesaj}</div>
          <div className="kilic-kaynak"><span>Atölye notu</span><p>{kaynakli.metin}</p><small>Kaynak: {kilicKaynaklari[kaynakli.kaynak]}</small></div>
          <button disabled={!hazir || hata || usta} className="kilic-usta" onClick={() => komut('usta')}>{usta ? 'Usta çalışıyor…' : 'Ustaya bırak'} <span>↗</span></button><small className="kilic-usta-not">Bu adımı animasyonla, orta kalitede tamamla.</small>
        </div>
      </aside>
      <div className="kilic-alt-etiket"><span>Ateş · çelik · ustalık</span><span>{asama === 6 ? 'Sürükle: çevir / Tekerlek: yaklaş' : asama === 7 ? 'Sürükle: kesim çiz' : 'Fare, dokunma veya klavye'}</span></div>
      {aktifNot && asama === 6 && <section className="kilic-parca-notu" role="dialog" aria-label={aktifNot.baslik}><button aria-label="Parça notunu kapat" onClick={() => setNot(null)}>×</button><h3>{aktifNot.baslik}</h3><p>{aktifNot.metin}</p><small>Kaynak: {kilicKaynaklari[aktifNot.kaynak]}</small></section>}
    </div>
    <footer className="kilic-durustluk"><div><span>Model hakkında</span><strong>{kilicTanitim.baslik}</strong><small>{kilicTanitim.konum}</small></div><p>{kilicTanitim.durustluk}</p></footer>
    <details className="kilic-klavye"><summary>Kaynaklar</summary>{Object.values(kilicKaynaklari).map(k => <p key={k}>{k}</p>)}</details>
    <details className="kilic-klavye"><summary>Klavye ile çalış · kullanım kılavuzu</summary><p>Sahneye odaklan. ← → bölge seçer; Enter külçeyi alır, çekiçle vurur, parça yerleştirir veya keser. Boşluk körük, su verme ve bileme için basılı tutulur. İncelemede ← → çevirir, + / − yakınlaştırır. Aynı işlemler etiketli düğmelerle de kullanılabilir.</p></details>
  </article>
}
