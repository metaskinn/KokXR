import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Eser } from '../types/eser'
import { ustKatmaniCoz, varsayilanIdler } from '../data'
import type { UstKatman } from '../data'

export interface YonetimProps {
  eserler: Eser[]
  ustKatman: UstKatman
  kaydet: (veri: UstKatman) => void
}
export function jsonIndir(veri: unknown, ad: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(veri, null, 2) + '\n'], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = ad; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function DemoNotu() {
  return <p className="yonetim-notu">Demo yönetim ekranı: değişiklikler yalnızca bu tarayıcıda saklanır.</p>
}
export default function Yonetim({ eserler, ustKatman, kaydet }: YonetimProps) {
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')
  function uygula(veri: UstKatman, sonuc: string) {
    try { kaydet(veri); setMesaj(sonuc); setHata('') }
    catch (e) { setHata((e as Error).message); setMesaj('') }
  }
  async function yukle(event: ChangeEvent<HTMLInputElement>) {
    const dosya = event.target.files?.[0]
    event.target.value = ''
    if (!dosya) return
    try {
      const veri = ustKatmaniCoz(JSON.parse(await dosya.text()))
      if (!window.confirm('Yüklenecek JSON mevcut üst katmanın tamamının yerini alacak. Devam edilsin mi?')) return
      uygula(veri, 'Üst katman yüklendi. Eserler güncellendi.')
    } catch (e) { setHata(`JSON yüklenemedi: ${(e as Error).message}`); setMesaj('') }
  }
  return <section className="sayfa yonetim">
    <h1>İçerik yönetimi</h1><DemoNotu />
    <p><Link to="/yonetim/yeni">Yeni eser ekle</Link></p>
    <p role="status">{mesaj}</p>{hata && <p role="alert" className="alan-hatasi">{hata}</p>}
    <h2>Eserler</h2>
    <ul className="yonetim-listesi">{eserler.map(eser => {
      const varsayilan = varsayilanIdler.includes(eser.id)
      return <li key={eser.id}>
        <h3>{eser.ad}</h3><p>{eser.ilce} · {eser.dogrulama === 'dogrulanmis' ? 'Kaynaklı bilgi' : 'Temsili içerik'}
          {' '}{!varsayilan ? <span className="etiket">Yeni</span> : Object.hasOwn(ustKatman, eser.id) ? <span className="etiket">Değiştirildi</span> : null}</p>
        <div className="yonetim-eylemler">
          <Link to={`/yonetim/eser/${eser.id}`}>Düzenle<span className="sr-only">: {eser.ad}</span></Link>
          <Link to={`/eser/${eser.id}`}>Eseri aç<span className="sr-only">: {eser.ad}</span></Link>
          <button type="button" onClick={() => jsonIndir(eser, `${eser.id}.json`)}>JSON olarak indir<span className="sr-only">: {eser.ad}</span></button>
          {varsayilan ? <button type="button" disabled={!Object.hasOwn(ustKatman, eser.id)} onClick={() => {
            const yeni = { ...ustKatman }; delete yeni[eser.id]; uygula(yeni, `${eser.ad} varsayılana döndürüldü.`)
          }}>Varsayılana döndür<span className="sr-only">: {eser.ad}</span></button> : <button type="button" onClick={() => {
            if (!window.confirm(`${eser.ad} silinsin mi? Bu işlem bu tarayıcıdaki eseri kaldırır.`)) return
            const yeni = { ...ustKatman }; delete yeni[eser.id]; uygula(yeni, `${eser.ad} silindi.`)
          }}>Sil<span className="sr-only">: {eser.ad}</span></button>}
        </div>
      </li>
    })}</ul>
    <section className="bolum" aria-labelledby="aktar-baslik">
      <h2 id="aktar-baslik">Üst katmanı dışa / içe aktar</h2>
      <p>Tek eser indirmeleri kaynak JSON dosyalarıyla aynı biçimdedir. Kalıcı içerik için dosya repodaki eserler klasörüne eklenebilir. Üst katman dosyası ise yalnızca bu tarayıcıdaki ekleme ve değişiklikleri taşır.</p>
      <div className="yonetim-eylemler">
        <button type="button" onClick={() => jsonIndir(ustKatman, 'kokxr-icerik.json')}>Tüm üst katmanı indir</button>
        <button type="button" onClick={() => {
          if (window.confirm('Tüm yerel içerik değişiklikleri ve yeni eserler silinsin mi? Varsayılan eserler korunur.')) uygula({}, 'Üst katman sıfırlandı.')
        }}>Tüm üst katmanı sıfırla</button>
      </div>
      <label className="form-alani dosya-secici" htmlFor="json-yukle">Üst katman JSON yükle
        <span>JSON dosyası seç</span>
        <input id="json-yukle" type="file" accept=".json,application/json" aria-describedby="yukle-yardim" onChange={yukle} />
      </label>
      <p id="yukle-yardim">Yükleme mevcut üst katmanın tamamının yerini alır ve onay ister. Önce yedek indirmeniz önerilir. Geçersiz dosyada mevcut içerik korunur.</p>
    </section>
  </section>
}
