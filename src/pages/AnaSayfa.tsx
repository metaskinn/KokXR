import { Link } from 'react-router-dom'
import type { Eser } from '../types/eser'
import Simge from '../components/Simge'
import { kilicTanitim } from '../data/kilic'
import { ciniTanitim } from '../data/cini'
import './kilic.css'

export default function AnaSayfa({ eserler, rozetler }: { eserler: Eser[]; rozetler: string[] }) {
  const oneCikan = eserler.find((eser) => eser.id === 'ulu-camii') ?? eserler[0]
  return <>
    <section className="giris" aria-labelledby="sayfa-basligi">
      <div className="giris-metin">
        <p className="ust-baslik"><span className="durum-noktasi" /> BURSA’NIN DİJİTAL MİRASI</p>
        <h1 id="sayfa-basligi"><span className="sr-only">KökXR — </span>Geçmişe bak.<br /><em>Bir bağ kur.</em></h1>
        <p className="slogan">Dokunamadığın tarihe dokun.</p>
        <p className="giris-aciklama">Bursa’nın vakıf eserlerini yakından keşfet. Ayrıntılarda gez, hikâyelerini öğren, kendi restorasyonunu yap.</p>
        <div className="giris-eylemler">
          <a className="dugme" href="#eserler">Keşfetmeye başla <Simge ad="ok" /></a>
          <Link className="metin-baglanti" to="/atolye/vazo">Vazo atölyesini dene <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="giris-alt"><Simge ad="konum" /><span>Bursa, Türkiye</span><span className="ayirici" /> <span>{eserler.length} eser · sana ait bir keşif</span></div>
      </div>
      {oneCikan?.kapakGorsel && <figure className="giris-gorsel">
        <img src={oneCikan.kapakGorsel} alt={oneCikan.gorseller.find((g) => g.dosya === oneCikan.kapakGorsel)?.alt ?? oneCikan.ad} fetchPriority="high" />
        <span className="gorsel-etiketi"><Simge ad="konum" /> {oneCikan.ilce}, {oneCikan.sehir}</span>
        <figcaption><div><span>KEŞFİN BAŞLADIĞI YER</span><strong>{oneCikan.ad}</strong></div><Link to={`/eser/${oneCikan.id}`} aria-label={`${oneCikan.ad} eserini keşfet`}><Simge ad="ok" /></Link></figcaption>
        <span className="gorsel-kose" aria-hidden="true">K / XR</span>
      </figure>}
    </section>

    <section id="eserler" className="eserler-bolumu" aria-labelledby="eserler-basligi">
      <div className="bolum-basligi"><div><p className="ust-baslik">MİRASA YAKINDAN BAK</p><h2 id="eserler-basligi">Her eserin bir hikâyesi var.</h2></div><p className="bolum-aciklama">Bir eser seç.<br />Keşfine kendi hızında devam et.</p></div>
      <div className="eserler">{eserler.map((eser, index) => <Link className="eser-karti" to={`/eser/${eser.id}`} key={eser.id}>
        <div className="kart-gorsel">
          {eser.kapakGorsel && <img className="kapak" src={eser.kapakGorsel} alt={eser.gorseller.find((g) => g.dosya === eser.kapakGorsel)?.alt ?? eser.ad} loading="lazy" />}
          <span className="kart-numara">{String(index + 1).padStart(2, '0')}</span>
          {rozetler.includes(eser.id) && <span className="kart-rozet">★ Rozet kazanıldı</span>}
        </div>
        <div className="kart-icerik">
          <p className="konum"><Simge ad="konum" />{eser.sehir} · {eser.ilce}</p>
          <h3>{eser.ad}</h3>
          <p className="kart-ozet">{eser.ozet}</p>
          <div className="kart-alt"><span>{eser.tur ? 'Sanal gezinti' : 'Fotoğraf galerisi'} <span aria-hidden="true">·</span> {eser.test.length} soru</span><span className="kesfet">Keşfet <Simge ad="ok" /></span></div>
        </div>
      </Link>)}</div>
    </section>

    <section className="vazo-tanitim" aria-labelledby="vazo-tanitim-basligi">
      <div className="vazo-cizim" aria-hidden="true">
        <svg viewBox="0 0 260 240" fill="none"><ellipse cx="130" cy="215" rx="78" ry="9" fill="#122e29" opacity=".12" /><path d="M104 29h52l-9 37c-3 17 9 28 23 43 22 24 31 53 21 74-9 20-30 28-61 28s-52-8-61-28c-10-21-1-50 21-74 14-15 26-26 23-43l-9-37Z" fill="#4f8074" stroke="#234e43" strokeWidth="2" /><path d="M110 56h40M81 123c32 13 66 13 98 0M72 170c37 15 79 15 116 0" stroke="#e0c38e" strokeWidth="8" /><path d="m117 78 12 28-13 30 18 27-9 45M70 145l46-9M134 163l57-10M129 106l35-2" stroke="#f8f5ef" strokeWidth="2" /><ellipse cx="130" cy="29" rx="26" ry="5" fill="#183e35" stroke="#e0c38e" strokeWidth="3" /></svg>
        <span className="vazo-cizim-not">ÇEVİR · İNCELE · BİRLEŞTİR</span>
      </div>
      <div className="vazo-tanitim-metin"><p className="ust-baslik">SEYİRCİ KALMA, DENE</p><h2 id="vazo-tanitim-basligi">Biraz merak.<br />Biraz da senin dokunuşun.</h2><p>Vazoyu eline al, her açıdan incele. Sonra kırık parçaları tutup doğru yere sürükleyerek yeniden birleştir.</p><Link className="dugme" to="/atolye/vazo">Vazo atölyesine gir <Simge ad="ok" /></Link><span className="temsili-not">Temsili 3B model · Tarihî eser rekonstrüksiyonu değildir.</span></div>
    </section>

    <section className="vazo-tanitim kilic-ana-tanitim" aria-labelledby="kilic-tanitim-basligi">
      <div className="kilic-ana-cizim" aria-hidden="true"><svg viewBox="0 0 400 130"><defs><linearGradient id="kilic-celik"><stop stopColor="#535d61"/><stop offset=".45" stopColor="#f3f0da"/><stop offset=".65" stopColor="#8d9c9e"/><stop offset="1" stopColor="#d2d6ce"/></linearGradient></defs><path d="M90 65Q240 66 380 35Q345 97 90 88Z" fill="url(#kilic-celik)"/><path d="M95 70Q240 73 356 48" stroke="#b59055" strokeWidth="2" fill="none"/><path d="M85 43L94 43L99 109L88 109Z" fill="#bf9a64"/><path d="M85 65L22 61L12 70L18 88L87 87Z" fill="#e4d4af"/><g fill="#a6804c"><circle cx="30" cy="75" r="2"/><circle cx="45" cy="76" r="2"/><circle cx="60" cy="77" r="2"/><circle cx="75" cy="77" r="2"/></g></svg></div>
      <div className="vazo-tanitim-metin"><p className="ust-baslik">ATEŞTEN BİÇİME</p><h2 id="kilic-tanitim-basligi">{kilicTanitim.baslik}</h2><p>{kilicTanitim.ozet}</p><Link className="dugme" to="/atolye/kilic">Kılıç atölyesine gir <Simge ad="ok" /></Link><span className="temsili-not">{kilicTanitim.durustluk}</span></div>
    </section>
    <section className="vazo-tanitim" aria-labelledby="cini-tanitim-basligi">
      <div className="vazo-cizim" aria-hidden="true"><svg viewBox="0 0 200 200" width="190" height="190"><circle cx="100" cy="100" r="92" fill="#f5f0e2" stroke="#17202f" strokeWidth="2"/><circle cx="100" cy="100" r="86" fill="none" stroke="#123f96" strokeWidth="8"/>{[0, 60, 120, 180, 240, 300].map((a) => <g key={a} transform={`rotate(${a} 100 100)`}><path d="M100 68C86 62 82 44 88 28C91 35 94 40 96 41C97 34 99 28 100 23C101 28 103 34 104 41C106 40 109 35 112 28C118 44 114 62 100 68Z" fill="#c5301f" stroke="#17202f"/></g>)}<circle cx="100" cy="100" r="20" fill="#159fa8" stroke="#17202f"/></svg></div>
      <div className="vazo-tanitim-metin"><p className="ust-baslik">TOPRAKTAN RENGE</p><h2 id="cini-tanitim-basligi">{ciniTanitim.baslik}</h2><p>{ciniTanitim.ozet}</p><Link className="dugme" to="/atolye/cini">Çini atölyesine gir <Simge ad="ok" /></Link><span className="temsili-not">Temsilî model · Web ve VR</span></div>
    </section>

    <section className="nasil-calisir" aria-labelledby="nasil-basligi"><div className="bolum-basligi"><div><p className="ust-baslik">KENDİ ROTANI ÇİZ</p><h2 id="nasil-basligi">Merakla başla.</h2></div></div><ol>
      <li><span className="adim-simge"><Simge ad="kesfet" /></span><h3>Bir eser seç</h3><p>Fotoğraflar ve keşif noktalarıyla ayrıntılara yaklaş.</p></li>
      <li><span className="adim-simge"><Simge ad="katman" /></span><h3>Deneyerek keşfet</h3><p>Sanal gezintiye katıl veya vazo atölyesinde parçaları birleştir.</p></li>
      <li><span className="adim-simge"><Simge ad="kitap" /></span><h3>Öğrendiklerini sına</h3><p>Üç soruluk testi tamamla; tümünü doğru yanıtlayıp rozetini kazan.</p></li>
    </ol></section>
  </>
}
