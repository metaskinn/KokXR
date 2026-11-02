import { useEffect, useRef, useState } from 'react'
import './maket/maket.css'
import type { Kaynak, Maket } from '../types/eser'
import type { MaketSahnesi } from './maket/maketSahnesi'
import KaynakSatiri from './KaynakSatiri'

const azHareket = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export default function EseriEleAl({ maket, kaynaklar, ad }: { maket: Maket; kaynaklar: Kaynak[]; ad: string }) {
  const [acik, setAcik] = useState(false)
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [parcali, setParcali] = useState(false)
  const [otomatik, setOtomatik] = useState(!azHareket())
  const [duyuru, setDuyuru] = useState('')
  const alan = useRef<HTMLDivElement>(null)
  const kutu = useRef<HTMLDivElement>(null)
  const sahne = useRef<MaketSahnesi | null>(null)

  useEffect(() => {
    if (!acik || !alan.current) return
    let iptal = false
    import('./maket/maketSahnesi').then(({ maketSahnesiOlustur }) => {
      if (iptal || !alan.current) return
      try {
        sahne.current = maketSahnesiOlustur(alan.current, maket.model, azHareket())
        setDurum('hazir')
      } catch { setDurum('hata') }
    }).catch(() => !iptal && setDurum('hata'))
    return () => { iptal = true; sahne.current?.temizle(); sahne.current = null }
  }, [acik, maket.model])

  function tus(e: React.KeyboardEvent) {
    const s = sahne.current
    if (!s) return
    const eylem: Record<string, () => void> = {
      ArrowLeft: () => s.dondur(-0.15, 0), ArrowRight: () => s.dondur(0.15, 0),
      ArrowUp: () => s.dondur(0, -0.1), ArrowDown: () => s.dondur(0, 0.1),
      '+': () => s.yakinlas(0.85), '=': () => s.yakinlas(0.85), '-': () => s.yakinlas(1.18),
    }
    if (eylem[e.key]) { e.preventDefault(); eylem[e.key](); setOtomatik(false); s.otomatik(false) }
  }

  function parcala() {
    const yeni = !parcali
    setParcali(yeni)
    sahne.current?.parcala(yeni)
    setDuyuru(yeni ? 'Çatı ve kubbeler kaldırıldı; içerideki payeler ve şadırvan görünüyor.' : 'Çatı ve kubbeler yerine indi.')
  }

  return <section className="bolum eseri-ele-al" aria-labelledby="maket-basligi">
    <h2 id="maket-basligi">Eseri eline al</h2>
    <p className="etiket">{maket.aciklama}</p>
    {!acik ? <button type="button" className="maket-baslat" onClick={() => setAcik(true)}>{ad} maketini eline al</button> : <>
      <div className="maket-kutu" ref={kutu}>
        <div className="maket-alan" ref={alan} tabIndex={0} role="application" onKeyDown={tus}
          aria-label={`${ad} 3B maketi. Ok tuşlarıyla döndür, artı ve eksi ile yakınlaştır.`} />
        {durum === 'yukleniyor' && <p className="maket-durum">Maket hazırlanıyor…</p>}
        {durum === 'hata' && <p className="maket-durum">Bu cihazda 3B görüntüleme (WebGL) kullanılamıyor.</p>}
        <div className="maket-kontrol">
          <button type="button" onClick={parcala} aria-pressed={parcali} disabled={durum !== 'hazir'}>{parcali ? '⤓ Birleştir' : '⤒ Parçala'}</button>
          <button type="button" aria-pressed={otomatik} disabled={durum !== 'hazir'}
            onClick={() => { setOtomatik(!otomatik); sahne.current?.otomatik(!otomatik) }}>⟳ Kendi kendine dönsün</button>
          <button type="button" disabled={durum !== 'hazir'} onClick={() => sahne.current?.sifirla()}>Görünümü sıfırla</button>
          {document.fullscreenEnabled && <button type="button" onClick={() => document.fullscreenElement ? document.exitFullscreen() : kutu.current?.requestFullscreen()}>Tam ekran</button>}
        </div>
      </div>
      <p className="ipucu-metni">Fareyle veya parmağınla sürükleyerek çevir, tekerlek veya iki parmakla yakınlaştır. Klavyede: maketi seçip ok tuşları ile +/−.</p>
    </>}
    <ul className="maket-bilgi">
      {maket.bilgiler.map((b, i) => <li key={i}>{b.metin}<KaynakSatiri kaynaklar={kaynaklar} kaynakId={b.kaynakId} /></li>)}
    </ul>
    <div className="gorunmez" aria-live="polite">{duyuru}</div>
  </section>
}
