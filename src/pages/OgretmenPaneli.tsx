import DemoEtiketi from '../components/DemoEtiketi'
import { eserleriGetir, icerigiOku } from '../data'
import './mokap.css'

// Uydurma örnek sınıf: 1 doğru, 0 yanlış; sıra eserin test sorularıyla aynıdır. Ortalama ve zorlanılan soru buradan hesaplanır.
const ornekSinif: { ad: string; yanitlar: Record<string, number[]> }[] = [
  { ad: 'Öğrenci 1', yanitlar: { 'ulu-camii': [1, 1, 1], 'muradiye-kulliyesi': [1, 0, 1] } },
  { ad: 'Öğrenci 2', yanitlar: { 'ulu-camii': [1, 1, 0], 'muradiye-kulliyesi': [1, 0, 1] } },
  { ad: 'Öğrenci 3', yanitlar: { 'ulu-camii': [1, 0, 0], 'muradiye-kulliyesi': [0, 0, 1] } },
  { ad: 'Öğrenci 4', yanitlar: { 'ulu-camii': [1, 1, 1], 'muradiye-kulliyesi': [1, 1, 1] } },
  { ad: 'Öğrenci 5', yanitlar: { 'ulu-camii': [0, 1, 0], 'muradiye-kulliyesi': [1, 0, 1] } },
  { ad: 'Öğrenci 6', yanitlar: { 'ulu-camii': [1, 1, 0], 'muradiye-kulliyesi': [1, 1, 1] } },
]

function rozetleriOku(): string[] {
  try {
    const veri: unknown = JSON.parse(localStorage.getItem('kokxr-rozetler') ?? '[]')
    return Array.isArray(veri) ? veri.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

const toplam = (dizi: number[]) => dizi.reduce((a, b) => a + b, 0)

export default function OgretmenPaneli() {
  const eserler = eserleriGetir(icerigiOku().ustKatman)
  const rozetler = rozetleriOku()
  const rozetliEserler = eserler.filter((e) => rozetler.includes(e.id) || rozetler.includes(`${e.id}:restorasyon`))
  const ornekEserler = eserler.filter((e) => ornekSinif[0].yanitlar[e.id])

  return <section className="sayfa mokap" aria-labelledby="panel-basligi">
    <DemoEtiketi />
    <p className="ust-baslik">ÖĞRETMEN PANELİ</p>
    <h1 id="panel-basligi">Sınıf görünümü</h1>
    <p className="mokap-giris">Öğretmenin test sonuçlarını nasıl göreceğini anlatan bir mokap. Sınıf bölümündeki öğrenciler ve yanıtlar uydurma örnektir; sınıf verisi toplanmıyor.</p>

    <section className="mokap-bolum" aria-labelledby="cihaz-basligi">
      <h2 id="cihaz-basligi">Bu cihaz</h2>
      <p className="mokap-bolum-not">Bu bölüm örnek değildir: bu tarayıcıda kayıtlı rozetleri gösterir. Uygulama yalnız kazanılan rozetleri saklar, tek tek test puanlarını saklamaz.</p>
      {rozetliEserler.length === 0
        ? <p className="mokap-not">Bu tarayıcıda kayıtlı rozet yok. Rozet, bir eserin testindeki üç soru da doğru yanıtlanınca veya restorasyon görevi tamamlanınca kaydedilir.</p>
        : <table className="mokap-tablo">
          <thead><tr><th scope="col">Eser</th><th scope="col">Test rozeti</th><th scope="col">Restorasyon rozeti</th></tr></thead>
          <tbody>{rozetliEserler.map((e) => <tr key={e.id}>
            <th scope="row">{e.ad}</th>
            <td>{rozetler.includes(e.id) ? '★ Kazanıldı (3 soruda 3 doğru)' : 'Kayıt yok'}</td>
            <td>{rozetler.includes(`${e.id}:restorasyon`) ? '★ Kazanıldı' : 'Kayıt yok'}</td>
          </tr>)}</tbody>
        </table>}
    </section>

    <section className="mokap-bolum" aria-labelledby="sinif-basligi">
      <h2 id="sinif-basligi">Örnek sınıf</h2>
      <p className="mokap-bolum-not">Uydurma veri: gerçek öğrenci, okul veya ölçüm değildir.</p>
      <table className="mokap-tablo">
        <caption>Öğrenci başına örnek test sonucu (3 soruda doğru sayısı)</caption>
        <thead><tr><th scope="col">Öğrenci</th>{ornekEserler.map((e) => <th scope="col" key={e.id}>{e.ad}</th>)}</tr></thead>
        <tbody>{ornekSinif.map((o) => <tr key={o.ad}>
          <th scope="row" className="mokap-tek-satir">{o.ad}</th>
          {ornekEserler.map((e) => <td key={e.id}>{toplam(o.yanitlar[e.id])} / 3</td>)}
        </tr>)}</tbody>
      </table>
    </section>

    <section className="mokap-bolum" aria-labelledby="eser-ozet-basligi">
      <h2 id="eser-ozet-basligi">Eser başına örnek özet</h2>
      <p className="mokap-bolum-not">Soru metinleri uygulamadaki testten alınır; sayılar yukarıdaki uydurma yanıtlardan hesaplanır.</p>
      <ul className="mokap-kartlar mokap-kartlar-ikili">{ornekEserler.map((e) => {
        const ortalama = toplam(ornekSinif.map((o) => toplam(o.yanitlar[e.id]))) / ornekSinif.length
        const yanlislar = e.test.map((_, i) => ornekSinif.filter((o) => o.yanitlar[e.id][i] === 0).length)
        const zorIndis = yanlislar.indexOf(Math.max(...yanlislar))
        return <li className="mokap-kart" key={e.id}>
          <h3>{e.ad}</h3>
          <p><span className="mokap-sayi">{ortalama.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / 3</span><br /><span className="mokap-ikincil">Örnek ortalama</span></p>
          <p><strong>Örnek veride zorlanılan soru:</strong> {e.test[zorIndis]?.soru}</p>
          <p className="mokap-ikincil">{ornekSinif.length} örnek öğrenciden {yanlislar[zorIndis]} tanesi yanlış yanıtladı.</p>
        </li>
      })}</ul>
    </section>
  </section>
}
