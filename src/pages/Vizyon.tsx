import DemoEtiketi from '../components/DemoEtiketi'
import './mokap.css'

const senaryolar = [
  { kitle: '01 · OKULLAR', ad: 'KökMobil', hedef: 'VR gözlüklü mobil sınıfın köy okullarına gitmesi; öğrenmenin öğretmen paneli ve testle ölçülmesi.', bugun: 'Üç soruluk test çalışır. Öğretmen paneli örnek veriyle mokaptır, mobil sınıf uygulaması yoktur.' },
  { kitle: '02 · MÜZELER', ad: 'Dokunulabilir Müze', hedef: 'Eserin 1:1 dijital ikizini eline alıp çevirmek, büyütmek ve parçalarına ayırmak.', bugun: 'Temsilî maket ve vazo atölyesi vardır. Bunlar tarama değildir, 1:1 dijital ikiz de değildir.' },
  { kitle: '03 · VAKIFLAR / BAKANLIK', ad: 'Dijital Miras Kütüphanesi', hedef: '3D model, dönem ve hikâyenin tek arşivde toplanması; içeriğin akademisyen onayından geçmesi.', bugun: 'Prototipteki eserler kaynak bilgisiyle listelenir. Bu içerik için akademisyen onayı iddia edilmez.' },
]

const adimlar = [
  { ad: 'Tara', metin: 'Mekân bir kez taranır.' },
  { ad: 'İşle', metin: 'Tarama, 3D dijital ikize dönüştürülür.' },
  { ad: 'Yayımla', metin: 'Aynı içerik VR, AR ve web’de kullanılır.' },
]

export default function Vizyon() {
  return <section className="sayfa mokap" aria-labelledby="vizyon-basligi">
    <DemoEtiketi metin="Vizyon · henüz uygulanmadı" />
    <p className="ust-baslik">NEREYE GİDİYORUZ</p>
    <h1 id="vizyon-basligi">Tek içerik, her cihaz.</h1>
    <p className="mokap-giris">Aşağıdaki senaryolar projenin hedefidir; bu prototipte çalışan bir ürün değildir.</p>

    <ul className="mokap-kartlar mokap-kartlar-uclu" aria-label="Senaryolar">{senaryolar.map((s) => <li className="mokap-kart" key={s.ad}>
      <p className="mokap-ust">{s.kitle}</p>
      <h2>{s.ad}</h2>
      <p><strong>Hedef:</strong> {s.hedef}</p>
      <p className="mokap-ikincil"><strong>Bugün:</strong> {s.bugun}</p>
    </li>)}</ul>

    <section className="mokap-bolum" aria-labelledby="akis-basligi">
      <h2 id="akis-basligi">Tara → işle → yayımla</h2>
      <p className="mokap-not"><strong>Tarama verisi yok: Bu akış planlanan yöntemdir</strong></p>
      <ol className="mokap-akis">{adimlar.map((a) => <li key={a.ad}><h3>{a.ad}</h3><p>{a.metin}</p></li>)}</ol>
    </section>
  </section>
}
