import { useEffect, useRef, useState } from 'react'
import './restorasyon.css'
import type { Kaynak, RestorasyonGorevi } from '../types/eser'
import KaynakSatiri, { kaynakMetni } from './KaynakSatiri'
import { dondur as parcaDondur, karistir, parcaHucresi, tamamMi, yonler, yuvayaKoy as parcaKoy, type Parca } from './restorasyon/kurallar'
import type { RestorasyonXr } from './restorasyon/xr'

export default function Restorasyon({ gorev, kaynaklar, rozetKazan, rozetId }: {
  gorev: RestorasyonGorevi; kaynaklar: Kaynak[]; rozetKazan: (id: string) => boolean; rozetId: string
}) {
  const adet = gorev.sutun * gorev.satir
  const [parcalar, setParcalar] = useState<Parca[] | null>(null)
  const [secili, setSecili] = useState<number | null>(null)
  const [ipucu, setIpucu] = useState(true)
  const [hamle, setHamle] = useState(0)
  const [duyuru, setDuyuru] = useState('')
  const [xrDestek, setXrDestek] = useState(false)
  const [vr, setVr] = useState<'kapali' | 'aciliyor' | 'acik'>('kapali')
  const [vrHata, setVrHata] = useState('')
  const xrOturum = useRef<RestorasyonXr | null>(null)
  const sokuldu = useRef(false)

  const bitti = parcalar !== null && tamamMi(parcalar)

  useEffect(() => {
    let iptal = false
    const denetle = async () => {
      let destek = false
      try { destek = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { destek = false }
      if (iptal || !destek) return
      setXrDestek(true)
      // Üç boyutlu kod yalnız gözlüklü tarayıcıda, önceden iner: düğmeye basınca beklenmesin.
      void import('./restorasyon/xr').catch(() => {})
    }
    void denetle()
    return () => { iptal = true }
  }, [])

  useEffect(() => {
    sokuldu.current = false
    return () => {
      sokuldu.current = true
      xrOturum.current?.kapat()
    }
  }, [])

  async function vrBaslat() {
    setVrHata('')
    setVr('aciliyor')
    let oturum: XRSession | null = null
    try {
      // Kullanıcı jesti kaybolmasın: requestSession tıklamanın içinde, ilk await'ten önce gider.
      oturum = await navigator.xr!.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
      const { restorasyonXrAc } = await import('./restorasyon/xr')
      const kaynak = kaynaklar.find((item) => item.id === gorev.kaynakId)
      xrOturum.current = await restorasyonXrAc(oturum, {
        gorsel: gorev.gorsel, sutun: gorev.sutun, satir: gorev.satir, ipucu,
        metin: gorev.metin, not: gorev.not, kaynak: `Kaynak: ${kaynak ? kaynakMetni(kaynak) : 'Kaynak bilgisi bulunamadı.'}`,
        parcalar, hamle,
        rozetKazan: () => rozetKazan(rozetId),
        bitti: (son) => {
          xrOturum.current = null
          setVr('kapali')
          setSecili(null)
          // Hiç hamle yapılmadıysa sayfa girildiği gibi kalır; yapıldıysa onarım burada sürer.
          if (son) { setParcalar(son.parcalar); setHamle(son.hamle) }
          setDuyuru('VR oturumu kapandı.')
        },
      })
      if (sokuldu.current) { xrOturum.current.kapat(); return }
      setVr('acik')
    } catch {
      await oturum?.end().catch(() => {}) // Zaten kapanmış oturumda end() reddeder
      setVr('kapali')
      setVrHata('VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Bulmacayı bu ekranda oynamaya devam edebilirsin.')
    }
  }

  function guncelle(yeni: Parca[], mesaj: string) {
    setParcalar(yeni)
    setHamle((h) => h + 1)
    if (tamamMi(yeni)) {
      setSecili(null)
      rozetKazan(rozetId)
      setDuyuru('Tebrikler, pano onarıldı! Restoratör rozeti kazanıldı.')
    } else setDuyuru(mesaj)
  }

  function yuvayaKoy(yuva: number) {
    if (!parcalar || secili === null || bitti) return
    setSecili(null)
    guncelle(parcaKoy(parcalar, secili, yuva), `Parça ${yuva + 1}. yuvaya yerleştirildi.`)
  }

  function dondur() {
    if (!parcalar || secili === null) return
    const yeni = parcaDondur(parcalar, secili)
    guncelle(yeni, `Parça döndürüldü: ${yonler[yeni.find((p) => p.id === secili)!.donus]}.`)
  }

  function parcaGorunumu(p: Parca) {
    const { sutun, satir } = parcaHucresi(p.id, gorev.sutun)
    return {
      backgroundImage: `url(${gorev.gorsel})`,
      backgroundSize: `${gorev.sutun * 100}% ${gorev.satir * 100}%`,
      backgroundPosition: `${gorev.sutun > 1 ? (sutun / (gorev.sutun - 1)) * 100 : 0}% ${gorev.satir > 1 ? (satir / (gorev.satir - 1)) * 100 : 0}%`,
      transform: `rotate(${p.donus * 90}deg)`,
    }
  }

  function parcaDugmesi(p: Parca, konum: string) {
    return <button key={p.id} type="button" className={`parca${secili === p.id ? ' secili' : ''}`} style={parcaGorunumu(p)}
      aria-pressed={secili === p.id} disabled={bitti}
      aria-label={`Parça ${p.id + 1}, ${yonler[p.donus]}, ${konum}${secili === p.id ? ', seçili' : ''}`}
      onClick={() => setSecili(secili === p.id ? null : p.id)}
      onKeyDown={(e) => { if (e.key === 'r' || e.key === 'R') { e.preventDefault(); if (secili === p.id) dondur() } }} />
  }

  return <section className="bolum restorasyon" aria-labelledby="restorasyon-basligi">
    <h2 id="restorasyon-basligi">Restorasyon görevi</h2>
    <p>{gorev.baslik}</p>
    {xrDestek && <div className="restorasyon-vr">
      {vr === 'acik'
        ? <button type="button" onClick={() => xrOturum.current?.kapat()}>VR'dan çık</button>
        : <button type="button" disabled={vr === 'aciliyor'} onClick={() => void vrBaslat()}>VR'da onar</button>}
      {vrHata && <p role="alert">{vrHata}</p>}
    </div>}
    {vr === 'acik' ? <p role="status">Bulmaca VR gözlüğünde sürüyor.</p> : !parcalar ? <>
      <img className="restorasyon-onizleme" src={gorev.gorsel} alt={gorev.alt} />
      <button type="button" onClick={() => { setParcalar(karistir(adet)); setHamle(0); setDuyuru('Pano parçalandı. Bir parça seç, sonra yerleştireceğin yuvaya dokun.') }}>Panoyu parçala ve onar</button>
    </> : <>
      <p className="ipucu-metni">Bir parçaya dokunarak seç, sonra tahtada bir yuvaya dokun. Seçili parçayı "Döndür" düğmesiyle (veya R tuşuyla) çevir.</p>
      <div className="restorasyon-kontrol">
        <button type="button" onClick={dondur} disabled={secili === null || bitti}>⟳ Döndür</button>
        <label><input type="checkbox" checked={ipucu} onChange={(e) => setIpucu(e.target.checked)} /> İpucu görüntüsü</label>
        <button type="button" onClick={() => { setParcalar(karistir(adet)); setSecili(null); setHamle(0); setDuyuru('Pano yeniden parçalandı.') }}>Baştan başla</button>
        <span>Hamle: {hamle}</span>
      </div>
      <div className={`restorasyon-tahta${bitti ? ' tamam' : ''}`} role="group" aria-label="Onarım tahtası"
        style={{ gridTemplateColumns: `repeat(${gorev.sutun}, minmax(0, 1fr))`, backgroundImage: ipucu && !bitti ? `url(${gorev.gorsel})` : undefined }}>
        {Array.from({ length: adet }, (_, yuva) => {
          const p = parcalar.find((x) => x.yuva === yuva)
          return <div key={yuva} className="yuva">
            {p ? parcaDugmesi(p, `${yuva + 1}. yuvada`)
              : <button type="button" className="bos-yuva" disabled={secili === null} onClick={() => yuvayaKoy(yuva)} aria-label={`Boş yuva ${yuva + 1}`} />}
            {p && secili !== null && secili !== p.id && <button type="button" className="yuva-hedef" onClick={() => yuvayaKoy(yuva)} aria-label={`Seçili parçayı ${yuva + 1}. yuvaya koy (yer değiştir)`} />}
          </div>
        })}
      </div>
      {!bitti && <div className="parca-tepsisi" role="group" aria-label="Yerleştirilmemiş parçalar">
        {parcalar.filter((p) => p.yuva === null).map((p) => parcaDugmesi(p, 'tepside'))}
        {parcalar.every((p) => p.yuva !== null) && <p>Tüm parçalar tahtada. Yanlış duran ya da dönük parçaları düzelt.</p>}
      </div>}
      {bitti && <div className="yanit">
        <p><strong>★ Pano onarıldı! "Restoratör" rozeti kazandın ({hamle} hamle).</strong></p>
        <p>{gorev.metin}</p>
        <KaynakSatiri kaynaklar={kaynaklar} kaynakId={gorev.kaynakId} />
      </div>}
    </>}
    <p className="gorsel-not">{gorev.not}</p>
    <div className="gorunmez" aria-live="polite">{duyuru}</div>
  </section>
}
