// Tek giriş noktası: sunumdaki akış (eseri incele → geçmişini gör → görevi tamamla) mevcut bileşenlerle adım adım.
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Eser } from '../types/eser'
import EseriEleAl from '../components/EseriEleAl'
import KaynakSatiri from '../components/KaynakSatiri'
import Simge from '../components/Simge'
import Test from '../components/Test'
import ZamanKatmani from '../components/ZamanKatmani'
import VazoAtolyesi from './VazoAtolyesi'
import './yolculuk.css'

const ADIMLAR = [
  { kisa: 'Eline al', aciklama: 'Temsilî maketi çevir, parçalarına ayır, sonra içeri girip yürü.' },
  { kisa: 'Zamanda yürü', aciklama: 'Yapının geçmişini kaynaklı bilgilerle izle.' },
  { kisa: 'Onar', aciklama: 'Kırık parçaları tutup doğru yere yerleştirerek vazoyu birleştir.' },
  { kisa: 'Sına', aciklama: 'Üç soruyu yanıtla; tümü doğruysa rozetini kazan.' },
]

function adimOku(deger: string | null) {
  const n = Number(deger)
  return Number.isInteger(n) && n >= 1 && n <= ADIMLAR.length ? n : 1
}

export default function Yolculuk({ eserler, rozetKazan }: { eserler: Eser[]; rozetKazan: (id: string) => boolean }) {
  const [parametre] = useSearchParams()
  const no = adimOku(parametre.get('adim'))
  const adim = ADIMLAR[no - 1]
  const baslik = useRef<HTMLHeadingElement>(null)
  const ilkKare = useRef(true)
  const eser = eserler.find((e) => e.id === 'ulu-camii') ?? eserler.find((e) => e.maket)
  const gorevEseri = eserler.find((e) => e.restorasyon)

  useEffect(() => {
    document.title = `${adim.kisa} · Yolculuk · KökXR`
    // İlk açılışta odağı rota değişimi taşır; adım değişince ekran okuyucu yeni başlığı duysun.
    if (ilkKare.current) ilkKare.current = false
    else {
      window.scrollTo(0, 0)
      baslik.current?.focus({ preventScroll: true })
    }
  }, [no, adim.kisa])
  useEffect(() => () => { document.title = 'KökXR' }, [])

  if (!eser) return <article className="sayfa"><Link to="/">← Ana sayfaya dön</Link><h1>Yolculuk</h1><p>Yolculuk için maketi olan bir eser bulunamadı.</p></article>

  return <article className="sayfa yolculuk">
    <Link to="/">← Ana sayfaya dön</Link>
    <header className="yolculuk-baslik">
      <p className="ust-baslik">ELİNE AL · ZAMANDA YÜRÜ · HİKÂYEYİ YAŞA</p>
      <h1>{eser.ad} yolculuğu</h1>
    </header>

    <nav aria-label="Yolculuk adımları">
      <ol className="yolculuk-adimlar">
        {ADIMLAR.map((a, i) => <li key={a.kisa}>
          <Link to={`?adim=${i + 1}`} aria-current={i + 1 === no ? 'step' : undefined}>
            <span className="yolculuk-no" aria-hidden="true">{i + 1}</span>
            <span><span className="sr-only">{i + 1}. adım: </span>{a.kisa}</span>
          </Link>
        </li>)}
      </ol>
    </nav>

    <header className="yolculuk-adim-baslik">
      <h2 ref={baslik} tabIndex={-1}>Adım {no} / {ADIMLAR.length}: {adim.kisa}</h2>
      <p>{adim.aciklama}</p>
    </header>

    {no === 1 && <>
      {eser.maket && <EseriEleAl maket={eser.maket} kaynaklar={eser.kaynaklar} ad={eser.ad} />}
      <p className="yolculuk-not"><strong>VR gözlüğün mü var?</strong> Bu sayfayı Meta Quest tarayıcısında aç ve maketi başlat; <q>VR'da aç</q> düğmesi yalnız VR destekleyen tarayıcıda görünür.</p>
    </>}

    {no === 2 && <>
      <ZamanKatmani eser={eser} />
      <section className="bolum" aria-labelledby="yolculuk-tarihce">
        <h3 id="yolculuk-tarihce">Tarihçe</h3>
        <p className="tarihce">{eser.tarihce}</p>
        {eser.kaynaklar.filter((k) => k.id.endsWith('-tarihce')).map((k) => <KaynakSatiri key={k.id} kaynaklar={eser.kaynaklar} kaynakId={k.id} />)}
      </section>
    </>}

    {no === 3 && <>
      <VazoAtolyesi gomulu />
      {gorevEseri && <p className="yolculuk-not">Gerçek bir eserle devam etmek ister misin? <Link to={`/eser/${gorevEseri.id}`}>{gorevEseri.ad} sayfasındaki çini görevine git</Link></p>}
    </>}

    {no === 4 && <Test eser={eser} rozetKazan={rozetKazan} />}

    <nav className="yolculuk-gecis" aria-label="Önceki ve sonraki adım">
      {no > 1 && <Link className="metin-baglanti" to={`?adim=${no - 1}`}>← Önceki: {ADIMLAR[no - 2].kisa}</Link>}
      {no < ADIMLAR.length
        ? <Link className="dugme" to={`?adim=${no + 1}`}>Sonraki: {ADIMLAR[no].kisa} <Simge ad="ok" /></Link>
        : <Link className="dugme" to={`/eser/${eser.id}`}>{eser.ad} sayfasının tamamını gör <Simge ad="ok" /></Link>}
    </nav>
  </article>
}
