import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Eser } from '../types/eser'
import { eserHatalari, eserId, kaynakliOlabilir, tekilId } from '../data/dogrulama'
import type { Hatalar } from '../data/dogrulama'
import type { YonetimProps } from './Yonetim'
import { DemoNotu, jsonIndir } from './Yonetim'

function bosEser(): Eser {
  return { id: '', ad: '', sehir: '', ilce: '', donem: '', vakif: '', ozet: '', tarihce: '', dogrulama: 'temsili', kapakGorsel: '', gorseller: [], bilgiNoktalari: [], kaynaklar: [],
    test: Array.from({ length: 3 }, () => ({ soru: '', secenekler: ['', '', '', ''], dogru: 0, aciklama: '', kaynakId: '' })) }
}
export default function EserFormu({ eser, eserler, ustKatman, kaydet }: YonetimProps & { eser?: Eser }) {
  const [taslak, setTaslak] = useState<Eser>(() => eser ? structuredClone(eser) : bosEser())
  const [hatalar, setHatalar] = useState<Hatalar>({})
  const [mesaj, setMesaj] = useState('')
  const [kayitHatasi, setKayitHatasi] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()
  const id = eser?.id ?? tekilId(eserId(taslak.ad), eserler.map(e => e.id))
  const kaynakli = kaynakliOlabilir(taslak)
  function guncelle(yama: Partial<Eser>) { setTaslak(t => ({ ...t, ...yama })); setMesaj('') }
  function hataNitelikleri(alan: string) {
    return { id: alan, 'aria-invalid': !!hatalar[alan], 'aria-describedby': hatalar[alan] ? `${alan}-hata` : undefined }
  }
  function alan(alanId: string, etiket: string, kontrol: ReactNode) {
    return <div className="form-alani" key={alanId}><label htmlFor={alanId}>{etiket}</label>{kontrol}
      {hatalar[alanId] && <p id={`${alanId}-hata`} className="alan-hatasi">{hatalar[alanId]}</p>}</div>
  }
  function metin(alanId: string, etiket: string, deger: string, degistir: (v: string) => void, uzun = false, gerekli = true) {
    const nitelikler = { ...hataNitelikleri(alanId), value: deger, required: gerekli, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => degistir(e.target.value) }
    return alan(alanId, etiket, uzun ? <textarea {...nitelikler} rows={4} /> : <input {...nitelikler} />)
  }
  function kaynakSec(alanId: string, deger: string, degistir: (v: string) => void) {
    return alan(alanId, 'Kaynak', <select {...hataNitelikleri(alanId)} value={deger} onChange={e => degistir(e.target.value)}>
      <option value="">Kaynak yok (temsili)</option>{taslak.kaynaklar.map((k, i) => <option key={k.id} value={k.id}>{i + 1}. {k.metin || 'Yeni kaynak'}</option>)}
    </select>)
  }
  function gorselSec(alanId: string, etiket: string, deger: string, degistir: (v: string) => void) {
    return alan(alanId, etiket, <select {...hataNitelikleri(alanId)} value={deger} onChange={e => degistir(e.target.value)}>
      <option value="">{alanId === 'kapakGorsel' ? 'Görsel seçin' : 'Görselsiz (yalnız keşif listesi)'}</option>{taslak.gorseller.map((g, i) => <option key={i} value={g.dosya}>{g.aciklama || g.alt || `Görsel ${i + 1}`}</option>)}
    </select>)
  }
  function dogrula(): Eser | undefined {
    const sonuc: Eser = { ...taslak, id, dogrulama: taslak.dogrulama === 'dogrulanmis' && kaynakli ? 'dogrulanmis' : 'temsili' }
    const hatalar = eserHatalari(sonuc)
    setHatalar(hatalar); setKayitHatasi('')
    if (Object.keys(hatalar).length) {
      setMesaj('')
      requestAnimationFrame(() => {
        const ilk = Array.from(form.current?.querySelectorAll<HTMLElement>('[aria-invalid="true"]') ?? [])[0]
        ilk?.focus()
      })
      return
    }
    return sonuc
  }
  function gonder(event: FormEvent) {
    event.preventDefault()
    const sonuc = dogrula()
    if (!sonuc) return
    try {
      kaydet({ ...ustKatman, [sonuc.id]: sonuc })
      setTaslak(sonuc)
      setMesaj('Eser kaydedildi. Ana sayfa ve eser sayfası güncellendi.')
      if (!eser) navigate(`/yonetim/eser/${sonuc.id}`, { replace: true })
    } catch (e) { setKayitHatasi((e as Error).message) }
  }
  return <section className="sayfa yonetim">
    <Link to="/yonetim">← Yönetim listesine dön</Link><h1>{eser ? 'Eseri düzenle' : 'Yeni eser ekle'}</h1><DemoNotu />
    <p>Zorunlu alanları doldurun. Görsel ve kaynak eklemek isteğe bağlıdır; eklenen kayıtların alanları zorunludur. Tarihsel bilgi ve görseller için kaynak ve kullanım iznini kontrol edin.</p>
    <form ref={form} noValidate onSubmit={gonder}>
      {Object.keys(hatalar).length > 0 && <div role="alert" className="hata-ozeti"><h2>Kayıt tamamlanamadı</h2><p>{Object.keys(hatalar).length} alanı kontrol edin. İlk hatalı alana odaklanıldı.</p><ul>{Object.entries(hatalar).map(([alan, mesaj]) => <li key={alan}><a href={`#${alan}`} onClick={e => { e.preventDefault(); document.getElementById(alan)?.focus() }}>{document.querySelector(`label[for="${alan}"]`)?.textContent ?? alan}: {mesaj}</a></li>)}</ul></div>}
      <p role="status">{mesaj}</p>{kayitHatasi && <p role="alert" className="alan-hatasi">{kayitHatasi}</p>}
      <fieldset className="form-bolumu"><legend>Eser bilgileri</legend>
        {(['ad', 'sehir', 'ilce', 'donem', 'vakif', 'ozet', 'tarihce'] as const).map((a, i) => metin(a, ['Ad', 'Şehir', 'İlçe', 'Dönem', 'Vakıf', 'Özet', 'Tarihçe'][i], taslak[a], v => guncelle({ [a]: v }), ['ozet', 'tarihce'].includes(a)))}
        <p className="kimlik">Eser kimliği: <strong>{id || 'Addan otomatik üretilecek'}</strong>. Kaydedildikten sonra değişmez.</p>
        <label className="form-alani" htmlFor="dogrulama">Doğrulama durumu
          <select id="dogrulama" value={kaynakli ? taslak.dogrulama : 'temsili'} aria-describedby="dogrulama-yardim" onChange={e => guncelle({ dogrulama: e.target.value as Eser['dogrulama'] })}>
            <option value="temsili">Temsili içerik</option><option value="dogrulanmis" disabled={!kaynakli}>Kaynaklı bilgi</option>
          </select>
        </label>
        <p id="dogrulama-yardim">Kaynaklı bilgi için en az bir dolu kaynak ve her test sorusu ile bilgi noktasında geçerli kaynak gerekir. {kaynakli ? 'Koşullar sağlandı; kaynaklı bilgi seçebilirsiniz.' : 'Koşullar sağlanmadığı için kayıt Temsili içerik olarak kalır.'}</p>
      </fieldset>
      <fieldset className="form-bolumu"><legend>Kaynaklar</legend>
        {taslak.kaynaklar.map((k, i) => <fieldset className="alt-form" key={k.id}><legend>Kaynak {i + 1}</legend>
          {metin(`kaynak-${i}-metin`, 'Kaynak metni', k.metin, v => guncelle({ kaynaklar: taslak.kaynaklar.map((x, j) => j === i ? { ...x, metin: v } : x) }), true)}
          {metin(`kaynak-${i}-sayfa`, 'Sayfa (isteğe bağlı)', k.sayfa ?? '', v => guncelle({ kaynaklar: taslak.kaynaklar.map((x, j) => j === i ? { ...x, sayfa: v } : x) }), false, false)}
          <button type="button" onClick={() => guncelle({ kaynaklar: taslak.kaynaklar.filter(x => x.id !== k.id), test: taslak.test.map(s => s.kaynakId === k.id ? { ...s, kaynakId: '' } : s), bilgiNoktalari: taslak.bilgiNoktalari.map(n => n.kaynakId === k.id ? { ...n, kaynakId: '' } : n), gorseller: taslak.gorseller.map(g => g.kaynakId === k.id ? { ...g, kaynakId: '' } : g) })}>Kaynak {i + 1} sil</button>
        </fieldset>)}
        <button type="button" onClick={() => guncelle({ kaynaklar: [...taslak.kaynaklar, { id: tekilId('kaynak', taslak.kaynaklar.map(k => k.id)), metin: '' }] })}>Kaynak ekle</button>
      </fieldset>
      <fieldset className="form-bolumu"><legend>Görseller</legend>
        <p>Yeni görsel için http/https URL kullanın. Mevcut görsellerin dosya yolu korunur. Dosya yüklenmez.</p>
        {taslak.gorseller.map((g, i) => {
          const degistir = (yama: Partial<typeof g>) => guncelle({ gorseller: taslak.gorseller.map((x, j) => j === i ? { ...x, ...yama } : x) })
          const mevcut = eser?.gorseller.some(x => x.dosya === g.dosya)
          return <fieldset className="alt-form" key={i}><legend>Görsel {i + 1}</legend>
            {alan(`gorsel-${i}-dosya`, 'Görsel URL / dosya yolu', <input {...hataNitelikleri(`gorsel-${i}-dosya`)} required readOnly={mevcut} value={g.dosya} onChange={e => {
              const dosya = e.target.value
              guncelle({ gorseller: taslak.gorseller.map((x, j) => j === i ? { ...x, dosya } : x), kapakGorsel: taslak.kapakGorsel === g.dosya ? dosya : taslak.kapakGorsel, bilgiNoktalari: taslak.bilgiNoktalari.map(n => n.gorsel === g.dosya ? { ...n, gorsel: dosya } : n) })
            }} />)}
            {metin(`gorsel-${i}-alt`, 'Alt metin', g.alt, v => degistir({ alt: v }))}
            {metin(`gorsel-${i}-aciklama`, 'Görsel açıklaması (isteğe bağlı)', g.aciklama ?? '', v => degistir({ aciklama: v }), false, false)}
            {metin(`gorsel-${i}-kredi`, 'Kredi satırı (isteğe bağlı)', g.kredi ?? '', v => degistir({ kredi: v }), false, false)}
            {kaynakSec(`gorsel-${i}-kaynakId`, g.kaynakId, v => degistir({ kaynakId: v }))}
          </fieldset>
        })}
        <button type="button" onClick={() => guncelle({ gorseller: [...taslak.gorseller, { dosya: '', alt: '', aciklama: '', kaynakId: '' }] })}>URL ile görsel ekle</button>
        {gorselSec('kapakGorsel', 'Kapak görseli', taslak.kapakGorsel, v => guncelle({ kapakGorsel: v }))}
      </fieldset>
      <fieldset className="form-bolumu"><legend>Bilgi noktaları</legend><p>Görselsiz noktalar yalnızca keşif listesinde gösterilir. Görsel seçilen noktaların konumu yüzde olarak belirtilir.</p>
        {taslak.bilgiNoktalari.map((n, i) => {
          const degistir = (yama: Partial<typeof n>) => guncelle({ bilgiNoktalari: taslak.bilgiNoktalari.map((x, j) => j === i ? { ...x, ...yama } : x) })
          return <fieldset className="alt-form" key={n.id}><legend>Bilgi noktası {i + 1}</legend>
            {metin(`nokta-${i}-baslik`, 'Başlık', n.baslik, v => degistir({ baslik: v }))}
            {metin(`nokta-${i}-metin`, 'Bilgi metni', n.metin, v => degistir({ metin: v }), true)}
            {kaynakSec(`nokta-${i}-kaynakId`, n.kaynakId, v => degistir({ kaynakId: v }))}
            {gorselSec(`nokta-${i}-gorsel`, 'Noktanın görseli', n.gorsel, v => degistir({ gorsel: v }))}
            <div className="koordinatlar">{(['x', 'y'] as const).map(a => alan(`nokta-${i}-${a}`, `${a.toUpperCase()} (%)`, <input {...hataNitelikleri(`nokta-${i}-${a}`)} type="number" min={0} max={100} step="any" required value={Number.isNaN(n[a]) ? '' : n[a]} onChange={e => degistir({ [a]: e.target.valueAsNumber })} />))}</div>
            <button type="button" onClick={() => guncelle({ bilgiNoktalari: taslak.bilgiNoktalari.filter(x => x.id !== n.id) })}>Bilgi noktası {i + 1} sil</button>
          </fieldset>
        })}
        <button type="button" onClick={() => guncelle({ bilgiNoktalari: [...taslak.bilgiNoktalari, { id: tekilId('nokta', taslak.bilgiNoktalari.map(n => n.id)), baslik: '', metin: '', kaynakId: '', gorsel: taslak.gorseller[0]?.dosya ?? '', x: 50, y: 50 }] })}>Bilgi noktası ekle</button>
      </fieldset>
      <fieldset className="form-bolumu"><legend>Test soruları (tam 3 soru)</legend>
        {taslak.test.map((s, i) => {
          const degistir = (yama: Partial<typeof s>) => guncelle({ test: taslak.test.map((x, j) => j === i ? { ...x, ...yama } : x) })
          return <fieldset className="alt-form" key={i}><legend>Soru {i + 1}</legend>
            {metin(`test-${i}-soru`, 'Soru metni', s.soru, v => degistir({ soru: v }))}
            {s.secenekler.map((v, j) => metin(`test-${i}-secenek-${j}`, `Seçenek ${j + 1}`, v, deger => degistir({ secenekler: s.secenekler.map((x, k) => k === j ? deger : x) })))}
            {alan(`test-${i}-dogru`, 'Doğru seçenek', <select {...hataNitelikleri(`test-${i}-dogru`)} value={s.dogru} onChange={e => degistir({ dogru: Number(e.target.value) })}>{s.secenekler.map((v, j) => <option key={j} value={j}>{j + 1}. {v || 'Boş seçenek'}</option>)}</select>)}
            {metin(`test-${i}-aciklama`, 'Cevap açıklaması', s.aciklama, v => degistir({ aciklama: v }), true)}
            {kaynakSec(`test-${i}-kaynakId`, s.kaynakId, v => degistir({ kaynakId: v }))}
          </fieldset>
        })}
      </fieldset>
      <div className="yonetim-eylemler form-sonu"><button type="submit">Kaydet</button><button type="button" onClick={() => { const sonuc = dogrula(); if (sonuc) jsonIndir(sonuc, `${sonuc.id}.json`) }}>JSON olarak indir</button><Link to="/yonetim">Listeye dön</Link></div>
    </form>
  </section>
}
