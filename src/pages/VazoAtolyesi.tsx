import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { VazoDurumu, VazoSahnesi } from '../components/maket/vazoSahnesi'
import './vazo.css'

interface Oyun extends VazoDurumu { hamle: number; mesaj: string }
const ilkOyun: Oyun = { onarim: false, kirildi: false, oturum: 0, yerlesen: [], secili: null, hamle: 0, mesaj: '' }

/** `gomulu`: başka bir sayfanın içinde; sayfa başlığı ve geri bağlantısı o sayfanındır. */
export default function VazoAtolyesi({ gomulu = false }: { gomulu?: boolean }) {
  const alan = useRef<HTMLDivElement>(null)
  const sahne = useRef<VazoSahnesi | null>(null)
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [oyun, setOyun] = useState<Oyun>(ilkOyun)
  const { onarim, yerlesen, secili, hamle, mesaj } = oyun
  const bitti = onarim && yerlesen.length === 6
  const [xrDestek, setXrDestek] = useState(false)
  const [vr, setVr] = useState<'kapali' | 'aciliyor' | 'acik'>('kapali')
  const [vrHata, setVrHata] = useState('')
  const vrAcik = vr !== 'kapali'
  const kilitli = durum !== 'hazir' || vrAcik

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
    let iptal = false
    let yerel: VazoSahnesi | undefined
    import('../components/maket/vazoSahnesi').then(async ({ vazoSahnesiOlustur }) => {
      if (iptal || !alan.current) return
      yerel = await vazoSahnesiOlustur(alan.current, {
        sec: (id) => { if (!iptal) setOyun((onceki) => ({ ...onceki, secili: id })) },
        birak: (id, oturdu) => {
          if (iptal) return
          setOyun((onceki) => {
            if (!onceki.onarim || onceki.yerlesen.includes(id)) return onceki
            const yeni = oturdu ? [...onceki.yerlesen, id] : onceki.yerlesen
            return { ...onceki, yerlesen: yeni, secili: oturdu ? null : id, hamle: onceki.hamle + 1,
              mesaj: oturdu ? yeni.length === 6 ? 'Vazo onarıldı! Birleşim izlerini çevirip inceleyebilirsin.' : `Parça ${id + 1} yerine oturdu.` : 'Parça henüz yerine yaklaşmadı. Kırık kenarları ve desenin devamını takip ederek yeniden dene.' }
          })
        },
        hata: () => { if (!iptal) setDurum('hata') },
        xrBitti: () => {
          if (iptal) return
          setVr('kapali')
          setOyun((onceki) => ({ ...onceki, secili: null, mesaj: onceki.yerlesen.length === 6 ? 'VR oturumu kapandı. Onarılan vazoyu burada da inceleyebilirsin.' : `VR oturumu kapandı. ${onceki.yerlesen.length}/6 parça yerinde; onarıma burada devam edebilirsin.` }))
        },
      })
      if (iptal) { yerel.temizle(); return }
      sahne.current = yerel
      setDurum('hazir')
    }).catch(() => { if (!iptal) setDurum('hata') })
    return () => { iptal = true; yerel?.temizle(); sahne.current = null }
  }, [])

  useEffect(() => { sahne.current?.guncelle(oyun) }, [oyun, durum])

  function baslat() {
    setOyun((onceki) => ({ ...ilkOyun, onarim: true, kirildi: true, oturum: onceki.oturum + 1,
      mesaj: 'Parçaları kırık kenarlara ve desenin devamına göre birleştir. Doğru yere yakın bırakılan parça yerine oturur.' }))
  }

  function vrBaslat() {
    if (!sahne.current) return
    setVrHata('')
    setVr('aciliyor')
    // Kullanıcı jesti kaybolmasın: requestSession bu çağrının içinde, await'siz gider.
    sahne.current.xrBaslat().then(() => {
      setVr('acik')
      // Yarım onarım VR'da sürer; başka her durumda yeni onarım başlar.
      setOyun((onceki) => onceki.onarim && onceki.yerlesen.length < 6
        ? { ...onceki, secili: null, mesaj: 'Onarım VR gözlüğünde sürüyor.' }
        : { ...ilkOyun, onarim: true, kirildi: true, oturum: onceki.oturum + 1, mesaj: 'Onarım VR gözlüğünde sürüyor.' })
    }).catch(() => {
      setVr('kapali')
      setVrHata('VR oturumu açılamadı. İzin reddedilmiş veya gözlük bağlı olmayabilir. Onarıma bu ekranda devam edebilirsin.')
    })
  }

  return <article className="sayfa vazo-atolyesi">
    {!gomulu && <Link to="/">← Ana sayfaya dön</Link>}
    <header className="eser-baslik">
      {!gomulu && <>
        <p className="ust-baslik">RESTORASYON ATÖLYESİ</p>
        <h1>Bir parçadan bütüne.</h1>
        <p className="vazo-giris">Vazoyu çevir, ayrıntılarına yaklaş. Sonra parçaları elinle taşır gibi sürükleyerek birleştir.</p>
      </>}
      <p className="etiket">Temsili 3B model</p>
      <p className="vazo-model-notu">Bu vazo uygulama için tasarlandı; belirli bir tarihî eseri temsil etmez.</p>
    </header>
    <div className="vazo-duzen">
      <section aria-labelledby="vazo-incele-basligi">
        <div className="vazo-sahne-baslik"><h2 id="vazo-incele-basligi">{onarim && !bitti ? 'Tut. Sürükle. Birleştir.' : bitti ? 'Vazo yeniden bir bütün.' : 'Vazoyu incele'}</h2>{onarim && <span>{yerlesen.length}/6 parça</span>}</div>
        <div className="vazo-sahne" ref={alan} tabIndex={0} role="group" aria-label="3B vazo atölyesi. Parçaları tutup birbirine ekle. Boş alandan görünümü döndür."
          onKeyDown={(e) => {
            if (vrAcik) return
            if (onarim && secili !== null && !yerlesen.includes(secili)) {
              const hareketler: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }
              if (hareketler[e.key]) { e.preventDefault(); sahne.current?.parcayiKaydir(...hareketler[e.key]); return }
              if (e.key === 'Enter') { e.preventDefault(); sahne.current?.parcayiBirak(); return }
              if (e.key === 'Escape') { e.preventDefault(); sahne.current?.iptal(); return }
            }
            const hareketler: Record<string, () => void> = {
              ArrowLeft: () => sahne.current?.dondur(-0.15, 0), ArrowRight: () => sahne.current?.dondur(0.15, 0),
              ArrowUp: () => sahne.current?.dondur(0, -0.15), ArrowDown: () => sahne.current?.dondur(0, 0.15),
              '+': () => sahne.current?.yakinlas(0.85), '=': () => sahne.current?.yakinlas(0.85), '-': () => sahne.current?.yakinlas(1.18),
            }
            if (hareketler[e.key]) { e.preventDefault(); hareketler[e.key]() }
          }} />
        {durum === 'yukleniyor' && <p role="status">Vazo hazırlanıyor…</p>}
        {durum === 'hata' && <p role="alert">3B model açılamadı. Bağlantını ve tarayıcının WebGL desteğini kontrol edip sayfayı yenile.</p>}
        <div className="vazo-kontroller">
          <button disabled={kilitli} onClick={() => sahne.current?.yakinlas(0.85)}>Yakınlaştır</button>
          <button disabled={kilitli} onClick={() => sahne.current?.yakinlas(1.18)}>Uzaklaştır</button>
          <button disabled={kilitli} onClick={() => sahne.current?.sifirla()}>Görünümü sıfırla</button>
        </div>
        <p className="ipucu-metni">{onarim && !bitti ? 'Parçanın kendisini veya üzerindeki numarayı tutup taşı. Boş alandan sürükleyerek vazoyu döndür; tekerlekle yakınlaştır.' : 'Fare veya parmakla çevir; tekerlek veya iki parmakla yakınlaştır.'}</p>
      </section>
      <section className="vazo-gorev" aria-labelledby="vazo-onar-basligi">
        <p className="ust-baslik">SENİN DOKUNUŞUN</p>
        <h2 id="vazo-onar-basligi">Vazoyu restore et</h2>
        {!onarim ? <>
          <p>Altı parça, tek bir vazo. Parçaları sahnede tutup doğru yere yaklaştır; bıraktığında yerine otursun.</p>
          <button disabled={kilitli} onClick={baslat}>Vazoyu parçala ve onar</button>
        </> : <>
          <p><strong>{yerlesen.length}/6 parça yerinde</strong> · Deneme: {hamle}</p>
          <progress value={yerlesen.length} max={6} aria-label="Vazo onarım ilerlemesi" />
          {bitti ? <p className="yanit"><strong>Vazo onarıldı!</strong> Eline sağlık. Şimdi bütün ayrıntılarıyla inceleyebilirsin.</p> : <>
            <ol className="vazo-adimlar"><li>Bir parçayı tut.</li><li>Kırık kenarlara ve desene göre yerine taşı.</li><li>Yerini bulduğunda bırak.</li></ol>
            <details className="vazo-klavye"><summary>Klavye ile birleştir</summary><p>Bir parça seç; ok tuşlarıyla taşı, Enter ile bırak. Escape parçayı geri alır.</p>
              <div className="vazo-parcalar" role="group" aria-label="Klavye için parça seçimi">{Array.from({ length: 6 }, (_, id) => !yerlesen.includes(id) && <button key={id} disabled={vrAcik} aria-pressed={secili === id} onClick={() => { setOyun({ ...oyun, secili: id }); alan.current?.focus({ preventScroll: true }) }}>Parça {id + 1}</button>)}</div>
            </details>
          </>}
          <div className="vazo-kontroller">
            <button disabled={kilitli} onClick={baslat}>Yeniden parçala</button>
            <button disabled={kilitli} onClick={() => setOyun(bitti ? { ...oyun, onarim: false, secili: null, mesaj: 'Onarılmış vazoyu birleşim izleriyle inceleyebilirsin.' } : { ...ilkOyun, oturum: oyun.oturum + 1, mesaj: 'Onarım iptal edildi. Vazo başlangıç görünümüne döndü.' })}>{bitti ? 'İncelemeye dön' : 'Onarımı iptal et'}</button>
          </div>
        </>}
        {xrDestek && <div className="vazo-vr">
          {vr === 'acik'
            ? <button onClick={() => sahne.current?.xrBitir()}>VR'dan çık</button>
            : <button disabled={durum !== 'hazir' || vr === 'aciliyor'} onClick={vrBaslat}>VR'da onar</button>}
          {vrHata && <p role="alert">{vrHata}</p>}
        </div>}
        <p className="vazo-mesaj" role="status">{mesaj}</p>
      </section>
    </div>
  </article>
}
