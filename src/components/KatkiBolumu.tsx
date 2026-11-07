import { useState } from 'react'
import type { FormEvent } from 'react'
import { BASLIK_EN_FAZLA, METIN_EN_FAZLA, katkiHatasi } from '../data/katki'
import type { Katki } from '../data/katki'

interface Props { eserId: string; katkilar: Katki[]; ekle: (eserId: string, baslik: string, metin: string) => void }

export default function KatkiBolumu({ eserId, katkilar, ekle }: Props) {
  const [hata, setHata] = useState('')
  const [mesaj, setMesaj] = useState('')
  const onayli = katkilar.filter((k) => k.eserId === eserId && k.durum === 'onaylandi')
  function gonder(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault()
    const form = new FormData(olay.currentTarget)
    const baslik = String(form.get('baslik')), metin = String(form.get('metin'))
    const h = katkiHatasi(baslik, metin)
    if (h) { setHata(h); setMesaj(''); return }
    ekle(eserId, baslik, metin)
    olay.currentTarget.reset(); setHata(''); setMesaj('Katkınız alındı. Yönetici onayından sonra bu sayfada görünecek.')
  }
  return <section className="bolum" aria-labelledby="katki-basligi">
    <h2 id="katki-basligi">Topluluk katkıları</h2>
    {onayli.length === 0 ? <p>Bu eser için onaylanmış katkı yok.</p> : <ul className="katki-listesi">{onayli.map((k) => <li key={k.id}>
      <p className="katki-etiket">Topluluk katkısı · doğrulanmamış bilgi</p><h3>{k.baslik}</h3><p>{k.metin}</p></li>)}</ul>}
    <form onSubmit={gonder} noValidate>
      <h3>Bu yapıyla ilgili bir anın veya bilgin mi var?</h3>
      <p>Katkılar yayımlanmadan önce incelenir ve doğrulanmamış olarak etiketlenir. Ad, e-posta veya telefon yazmayın.</p>
      <div className="form-alani"><label htmlFor="katki-baslik">Başlık</label><input id="katki-baslik" name="baslik" maxLength={BASLIK_EN_FAZLA} required /></div>
      <div className="form-alani"><label htmlFor="katki-metin">Metin</label><textarea id="katki-metin" name="metin" rows={4} maxLength={METIN_EN_FAZLA} required /></div>
      {hata && <p role="alert" className="alan-hatasi">{hata}</p>}
      <p role="status">{mesaj}</p>
      <button type="submit">Katkıyı gönder</button>
    </form>
  </section>
}
