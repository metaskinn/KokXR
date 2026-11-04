import { useEffect, useRef, useState } from 'react'
import './maket/maket.css'
import type { Kaynak, Maket } from '../types/eser'
import type { MaketSahnesi } from './maket/maketSahnesi'
import KaynakSatiri from './KaynakSatiri'

const azHareket = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const YURUME_TUSLARI = new Set(['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Shift'])
const tusAdi = (e: React.KeyboardEvent) => e.key.length === 1 ? e.key.toLowerCase() : e.key

export default function EseriEleAl({ maket, kaynaklar, ad }: { maket: Maket; kaynaklar: Kaynak[]; ad: string }) {
  const [acik, setAcik] = useState(false)
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [parcali, setParcali] = useState(false)
  const [otomatik, setOtomatik] = useState(!azHareket())
  const [duyuru, setDuyuru] = useState('')
  const [duraklar, setDuraklar] = useState<{ id: string; ad: string }[]>([])
  const [durak, setDurak] = useState<string | null>(null)
  const [bilgiId, setBilgiId] = useState<string | null>(null)
  const bilgi = maket.icBilgiler?.find((b) => b.id === bilgiId)
  const [xrDestek, setXrDestek] = useState(false)
  // Oturum açılırken ve açıkken dolu: bu sırada sayfadaki düğmeler sahneyi değiştirmesin.
  const [xrMesgul, setXrMesgul] = useState(false)
  const [xrHata, setXrHata] = useState(false)
  const hazir = durum === 'hazir' && !xrMesgul
  const alan = useRef<HTMLDivElement>(null)
  const kutu = useRef<HTMLDivElement>(null)
  const sahne = useRef<MaketSahnesi | null>(null)

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
    if (!acik || !alan.current) return
    let iptal = false
    import('./maket/maketSahnesi').then(({ maketSahnesiOlustur }) => {
      if (iptal || !alan.current) return
      try {
        sahne.current = maketSahnesiOlustur(alan.current, maket.model, azHareket(), {
          bilgiler: maket.icBilgiler,
          kaynaklar,
          bilgiDegisti: setBilgiId,
          xrDegisti: (aktif) => {
            setXrMesgul(aktif)
            // Oturum açılınca otomatik dönüş kapanır; düğme de bunu göstersin.
            if (aktif) setOtomatik(false)
          },
        })
        setDuraklar(sahne.current.duraklar)
        setDurum('hazir')
      } catch { setDurum('hata') }
    }).catch(() => !iptal && setDurum('hata'))
    return () => { iptal = true; sahne.current?.temizle(); sahne.current = null; setDurak(null); setBilgiId(null); setXrMesgul(false); setXrHata(false) }
  }, [acik, maket.model, maket.icBilgiler, kaynaklar])

  function tus(e: React.KeyboardEvent) {
    const s = sahne.current
    if (!s) return
    if (durak && YURUME_TUSLARI.has(tusAdi(e))) {
      e.preventDefault()
      s.yuruTus(tusAdi(e), true)
      return
    }
    const eylem: Record<string, () => void> = {
      ArrowLeft: () => s.dondur(-0.15, 0), ArrowRight: () => s.dondur(0.15, 0),
      ArrowUp: () => s.dondur(0, -0.1), ArrowDown: () => s.dondur(0, 0.1),
      '+': () => s.yakinlas(0.85), '=': () => s.yakinlas(0.85), '-': () => s.yakinlas(1.18),
    }
    if (eylem[e.key]) { e.preventDefault(); eylem[e.key](); setOtomatik(false); s.otomatik(false) }
  }

  function vrAc() {
    const s = sahne.current
    if (!s) return
    setXrHata(false)
    setDurak(null)
    setParcali(false)
    setXrMesgul(true)
    // Tarayıcı oturumu yalnız kullanıcı jesti içinde açar: bundan önce await olmamalı.
    s.xrBaslat().catch(() => { setXrMesgul(false); setXrHata(true) })
  }

  function parcala() {
    setXrHata(false)
    const yeni = !parcali
    setParcali(yeni)
    sahne.current?.parcala(yeni)
    setDuyuru(yeni ? 'Çatı ve kubbeler kaldırıldı; içerideki payeler ve şadırvan görünüyor.' : 'Çatı ve kubbeler yerine indi.')
  }

  function duragaGit(id: string | null) {
    setXrHata(false)
    setDurak(id)
    sahne.current?.icMekan(id)
    if (id) { setParcali(false); setOtomatik(false) }
    else setOtomatik(false)
    const ad = duraklar.find((d) => d.id === id)?.ad
    setDuyuru(ad ? `İç mekân görünümü: ${ad}. W, A, S, D veya yukarı ve aşağı ok ile yürü, sol ve sağ ok ile dön.` : 'Maketin dış görünümüne dönüldü.')
    // Tuşlar hemen çalışsın diye odak sahneye alınır.
    if (id) alan.current?.focus({ preventScroll: true })
  }

  function bilgiKapat() {
    sahne.current?.bilgiKapat()
    alan.current?.focus({ preventScroll: true })
  }

  return <section className="bolum eseri-ele-al" aria-labelledby="maket-basligi">
    <h2 id="maket-basligi">Eseri eline al</h2>
    <p className="etiket">{maket.aciklama}</p>
    {!acik ? <button type="button" className="maket-baslat" onClick={() => setAcik(true)}>{ad} maketini eline al</button> : <>
      <div className="maket-kutu" ref={kutu}>
        <div className="maket-alan" ref={alan} tabIndex={0} role="application" onKeyDown={tus}
          onKeyUp={(e) => { if (YURUME_TUSLARI.has(tusAdi(e))) sahne.current?.yuruTus(tusAdi(e), false) }}
          onBlur={(e) => { if (!alan.current?.contains(e.relatedTarget)) sahne.current?.yuruBirak() }}
          onPointerDown={() => { setXrHata(false); if (durak) alan.current?.focus({ preventScroll: true }) }}
          aria-label={durak
            ? `${ad} iç mekânı. W, A, S, D veya yukarı ve aşağı ok ile yürü, sol ve sağ ok ile dön.`
            : `${ad} 3B maketi. Ok tuşlarıyla döndür, artı ve eksi ile yakınlaştır.`} />
        {durak && <p className="maket-tuslar" aria-hidden="true"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>←</kbd><kbd>→</kbd> dön · <kbd>Shift</kbd> hızlan</p>}
        {bilgi && <aside className="maket-bilgi-kart" aria-live="polite">
          <button type="button" className="maket-bilgi-kapat" aria-label="Bilgiyi kapat" onClick={bilgiKapat}>×</button>
          <h3>{bilgi.baslik}</h3>
          <p>{bilgi.metin}</p>
          <KaynakSatiri kaynaklar={kaynaklar} kaynakId={bilgi.kaynakId} />
        </aside>}
        {durum === 'yukleniyor' && <p className="maket-durum">Maket hazırlanıyor…</p>}
        {durum === 'hata' && <p className="maket-durum">Bu cihazda 3B görüntüleme (WebGL) kullanılamıyor.</p>}
        {/* Sahneyi sürüklemeyi engellemez: kullanıcı maketi kullanmayı sürdürebilir. */}
        {xrHata && <p className="maket-durum" aria-live="polite" style={{ pointerEvents: 'none', textAlign: 'center', padding: '1rem', textShadow: '0 1px 4px #000' }}>VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin.</p>}
        <div className="maket-kontrol">
          {durak ? <>
            <button type="button" onClick={() => duragaGit(null)}>← Dışarı çık</button>
            {duraklar.map((d) => <button type="button" key={d.id} aria-pressed={durak === d.id} onClick={() => duragaGit(d.id)}>{d.ad}</button>)}
          </> : <>
            <button type="button" disabled={!hazir || !duraklar.length} onClick={() => duragaGit(duraklar[0]?.id ?? null)}>İçeri gir</button>
            {xrDestek && <button type="button" disabled={!hazir} onClick={vrAc}>VR'da aç</button>}
            <button type="button" onClick={parcala} aria-pressed={parcali} disabled={!hazir}>{parcali ? '⤓ Birleştir' : '⤒ Parçala'}</button>
            <button type="button" aria-pressed={otomatik} disabled={!hazir}
              onClick={() => { setOtomatik(!otomatik); sahne.current?.otomatik(!otomatik) }}>⟳ Kendi kendine dönsün</button>
            <button type="button" disabled={!hazir} onClick={() => sahne.current?.sifirla()}>Görünümü sıfırla</button>
          </>}
          {document.fullscreenEnabled && <button type="button" onClick={() => document.fullscreenElement ? document.exitFullscreen() : kutu.current?.requestFullscreen()}>Tam ekran</button>}
        </div>
      </div>
      <p className="ipucu-metni">{durak
        ? 'W, A, S, D veya ↑ ↓ ile yürü, ← → ile dön, PageUp/PageDown ile yukarı aşağı bak, Shift ile hızlan. Sürükleyerek de etrafına bakabilirsin. Bir yapıya yaklaşınca veya üstündeki işarete basınca bilgisi açılır. Dokunmatik ekranda duraklar arası geç. Levha ve paye yazıları arşiv fotoğraflarındandır, hangi yüzde durdukları temsilîdir.'
        : 'Fareyle veya parmağınla sürükleyerek çevir, tekerlek veya iki parmakla yakınlaştır. Klavyede: maketi seçip ok tuşları ile +/−.'}</p>
    </>}
    <ul className="maket-bilgi">
      {maket.bilgiler.map((b, i) => <li key={i}>{b.metin}<KaynakSatiri kaynaklar={kaynaklar} kaynakId={b.kaynakId} /></li>)}
    </ul>
    <div className="gorunmez" aria-live="polite">{duyuru}</div>
  </section>
}
