import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Eser } from '../types/eser'
import EseriEleAl from '../components/EseriEleAl'
import Restorasyon from '../components/Restorasyon'
import Bulunamadi from './Bulunamadi'
import { HARITA_G, HARITA_Y, TURKIYE_YOLU, haritaKonumu } from '../data/turkiyeHaritasi'
import { vrSehirler } from '../data/vrEserler'
import './vr.css'

const YAKINLIK = 3.4

/** Bu tarayıcı sürükleyici VR açabiliyor mu? Bilinmeden önce null. */
function useVrDestegi() {
  const [destek, setDestek] = useState<boolean | null>(null)
  useEffect(() => {
    let iptal = false
    void (async () => {
      let var_ = false
      try { var_ = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { var_ = false }
      if (!iptal) setDestek(var_)
    })()
    return () => { iptal = true }
  }, [])
  return destek
}

export default function VrEserler() {
  const [parametre, setParametre] = useSearchParams()
  const secili = vrSehirler.find((s) => s.ad === parametre.get('sehir'))
  const destek = useVrDestegi()
  const odak = secili && haritaKonumu(...secili.konum)
  const sec = (ad: string | null) => setParametre(ad ? { sehir: ad } : {})

  return <article className="sayfa vr-eserler">
    <header className="vr-baslik">
      <h1>VR Eserler</h1>
      <p>Haritadan bir şehir seç, o şehirdeki yapıya gir.</p>
      {destek === false && <p className="vr-not">Bu tarayıcı VR açamıyor. Gözlükle girmek için bu sayfayı Meta Quest tarayıcısında aç; maketi burada ekranda da gezebilirsin.</p>}
    </header>
    <div className="vr-duzen">
      <div className="vr-harita" data-yakin={secili ? 'evet' : 'hayir'}>
        <div className="vr-harita-ic" style={{
          aspectRatio: `${HARITA_G} / ${HARITA_Y}`,
          transform: odak ? `scale(${YAKINLIK}) translate(${50 - odak.x}%, ${50 - odak.y}%)` : undefined,
          ['--olcek' as string]: odak ? YAKINLIK : 1,
        }}>
          <svg viewBox={`0 0 ${HARITA_G} ${HARITA_Y}`} role="img" aria-label="Türkiye haritası">
            <path d={TURKIYE_YOLU} />
          </svg>
          {vrSehirler.map((s) => {
            const { x, y } = haritaKonumu(...s.konum)
            return <button key={s.ad} type="button" className="vr-sehir" style={{ left: `${x}%`, top: `${y}%` }}
              aria-pressed={secili?.ad === s.ad} onClick={() => sec(secili?.ad === s.ad ? null : s.ad)}>
              <span className="vr-sehir-nokta" /><span className="vr-sehir-ad">{s.ad}</span>
            </button>
          })}
        </div>
      </div>
      <section className="vr-panel" aria-live="polite" aria-label={secili ? `${secili.ad} yapıları` : 'Şehirler'}>
        {!secili ? <>
          <h2>Şehirler</h2>
          <ul className="vr-sehirler">{vrSehirler.map((s) => {
            const adet = s.yapilar.filter((y) => y.eserId).length
            return <li key={s.ad}><button type="button" onClick={() => sec(s.ad)}>
              <strong>{s.ad}</strong><span>{adet ? `${adet} yapı VR'da açılıyor` : 'Henüz VR yok'}</span>
            </button></li>
          })}</ul>
        </> : <>
          <button type="button" className="vr-geri" onClick={() => sec(null)}>← Haritaya dön</button>
          <h2>{secili.ad}</h2>
          {secili.yapilar.length > 0 ? <ul className="vr-yapilar">{secili.yapilar.map((y) => <li key={y.ad}>
            {y.eserId
              ? <Link to={`/vr/${y.eserId}`}><strong>{y.ad}</strong><span>{y.ilce} · {y.acilan}</span></Link>
              : <div className="vr-yapi-kapali"><strong>{y.ad}</strong><span>{y.ilce} · VR henüz yok</span></div>}
          </li>)}</ul> : <p>Bu şehirdeki yapılar için henüz VR içeriği yok.</p>}
          <p className="vr-yayin">Envanter: {secili.yayinlar.map((k, i) => <span key={k.adres}>{i > 0 && ', '}<a href={k.adres} target="_blank" rel="noreferrer">{k.ad}</a></span>)} (Vakıf Katılım)</p>
        </>}
      </section>
    </div>
  </article>
}

export function VrEser({ eserler, rozetKazan }: { eserler: Eser[]; rozetKazan: (id: string) => boolean }) {
  const { id } = useParams()
  const eser = eserler.find((e) => e.id === id)
  const destek = useVrDestegi()
  if (!eser || (!eser.maket && !eser.restorasyon)) return <Bulunamadi />
  return <article className="sayfa vr-eser" key={eser.id}>
    <Link to={`/vr?sehir=${encodeURIComponent(eser.sehir)}`}>← {eser.sehir} yapıları</Link>
    <header className="vr-baslik">
      <h1>{eser.ad}</h1>
      <p>{eser.sehir} · {eser.ilce}</p>
      {destek === false && <p className="vr-not">Bu tarayıcı VR açamıyor. Gözlükle girmek için bu sayfayı Meta Quest tarayıcısında aç.</p>}
      {destek && <p className="vr-not">Sahne yüklenince VR düğmesine bas. Tarayıcılar VR'ı yalnızca bir dokunuşla başlatır.</p>}
    </header>
    {eser.maket
      ? <EseriEleAl maket={eser.maket} kaynaklar={eser.kaynaklar} ad={eser.ad} hemenAc />
      : eser.restorasyon && <Restorasyon gorev={eser.restorasyon} kaynaklar={eser.kaynaklar} rozetKazan={rozetKazan} rozetId={`${eser.id}:restorasyon`} />}
  </article>
}
