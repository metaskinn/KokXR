import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Eser } from '../types/eser'
import type { UstKatman } from '../data'
import { bulutVar, cikisYap, eserKaydet, girisYap, gorselYukle, oturumEposta } from '../data/bulut'

const VARSAYILAN_KREDI = 'Fotoğraf: Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi'

interface Props { eserler: Eser[]; ustKatman: UstKatman; kaydet: (veri: UstKatman) => void }

export default function BulutPaneli({ eserler, ustKatman, kaydet }: Props) {
  const [eposta, setEposta] = useState('')
  const [giris, setGiris] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')
  useEffect(() => { void oturumEposta().then(setGiris) }, [])
  if (!bulutVar) return <p className="yonetim-notu">Bulut bağlantısı kapalı: değişiklikler yalnızca bu tarayıcıda saklanır.</p>

  async function oturumAc(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault()
    const form = new FormData(olay.currentTarget)
    try { await girisYap(String(form.get('eposta')), String(form.get('sifre'))); setGiris(await oturumEposta()); setHata('') }
    catch (e) { setHata((e as Error).message) }
  }
  async function yukle(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault()
    const form = new FormData(olay.currentTarget)
    const dosya = form.get('dosya')
    const eser = eserler.find((e) => e.id === form.get('eser'))
    const alt = String(form.get('alt')).trim()
    const kredi = String(form.get('kredi')).trim()
    if (!eser || !(dosya instanceof File) || !dosya.size) return setHata('Eser ve görsel dosyası seçin.')
    if (!alt || !kredi) return setHata('Açıklama (alt metin) ve kredi satırı zorunludur.')
    try {
      await eserKaydet(eser)
      const adres = await gorselYukle(eser.id, dosya, alt, kredi)
      kaydet({ ...ustKatman, [eser.id]: { ...eser, gorseller: [...eser.gorseller, { dosya: adres, alt, kredi, kaynakId: eser.kaynaklar[0]?.id ?? '' }] } })
      setMesaj('Görsel yüklendi ve eserin galerisine eklendi.'); setHata(''); olay.currentTarget.reset()
    } catch (e) { setHata((e as Error).message); setMesaj('') }
  }

  return <section className="bolum" aria-labelledby="bulut-baslik">
    <h2 id="bulut-baslik">Bulut kaydı</h2>
    <p role="status">{mesaj}</p>{hata && <p role="alert" className="alan-hatasi">{hata}</p>}
    {!giris ? <form onSubmit={oturumAc}>
      <div className="form-alani"><label htmlFor="b-eposta">E-posta</label><input id="b-eposta" name="eposta" type="email" autoComplete="username" required value={eposta} onChange={(e) => setEposta(e.target.value)} /></div>
      <div className="form-alani"><label htmlFor="b-sifre">Parola</label><input id="b-sifre" name="sifre" type="password" autoComplete="current-password" required /></div>
      <button type="submit">Giriş yap</button>
    </form> : <>
      <p>Giriş yapıldı: {giris}. Kaydedilen eserler onay için bekletilir.</p>
      <button type="button" onClick={() => { void cikisYap().then(() => setGiris('')) }}>Çıkış yap</button>
      <form onSubmit={yukle}>
        <h3>Görsel yükle</h3>
        <div className="form-alani"><label htmlFor="g-eser">Eser</label>
          <select id="g-eser" name="eser" required>{eserler.map((e) => <option key={e.id} value={e.id}>{e.ad}</option>)}</select></div>
        <div className="form-alani"><label htmlFor="g-dosya">Görsel dosyası</label><input id="g-dosya" name="dosya" type="file" accept="image/*" required /></div>
        <div className="form-alani"><label htmlFor="g-alt">Açıklama (ekran okuyucu metni)</label><input id="g-alt" name="alt" required /></div>
        <div className="form-alani"><label htmlFor="g-kredi">Kredi satırı</label><input id="g-kredi" name="kredi" defaultValue={VARSAYILAN_KREDI} required /></div>
        <button type="submit">Yükle</button>
      </form>
    </>}
  </section>
}
