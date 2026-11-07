import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import { artifactErrors, artifactId, maybeSourced, uniqueId } from '../../domain/verification'
import type { Errors } from '../../domain/verification'
import type { AdminProps } from './AdminPage'
import { DemoNote, downloadJson } from './AdminPage'

function emptyArtifact(): Artifact {
  return { id: '', ad: '', city: '', district: '', period: '', endowment: '', summary: '', history: '', verification: 'illustrative', coverImage: '', images: [], hotspots: [], sources: [],
    test: Array.from({ length: 3 }, () => ({ question: '', options: ['', '', '', ''], correct: 0, description: '', sourceId: '' })) }
}
export default function ArtifactForm({ artifact, artifacts, overlay, save }: AdminProps & { artifact?: Artifact }) {
  const [draft, setDraft] = useState<Artifact>(() => artifact ? structuredClone(artifact) : emptyArtifact())
  const [errors, setErrors] = useState<Errors>({})
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()
  const id = artifact?.id ?? uniqueId(artifactId(draft.ad), artifacts.map(e => e.id))
  const sourced = maybeSourced(draft)
  function update(patch: Partial<Artifact>) { setDraft(t => ({ ...t, ...patch })); setMessage('') }
  function errorAttrs(area: string) {
    return { id: area, 'aria-invalid': !!errors[area], 'aria-describedby': errors[area] ? `${area}-error` : undefined }
  }
  function area(areaId: string, label: string, control: ReactNode) {
    return <div className="form-area" key={areaId}><label htmlFor={areaId}>{label}</label>{control}
      {errors[areaId] && <p id={`${areaId}-error`} className="area-error">{errors[areaId]}</p>}</div>
  }
  function text(areaId: string, label: string, value: string, toggle: (v: string) => void, long = false, requiredField = true) {
    const attrs = { ...errorAttrs(areaId), value: value, required: requiredField, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => toggle(e.target.value) }
    return area(areaId, label, long ? <textarea {...attrs} rows={4} /> : <input {...attrs} />)
  }
  function selectSource(areaId: string, value: string, toggle: (v: string) => void) {
    return area(areaId, 'Kaynak', <select {...errorAttrs(areaId)} value={value} onChange={e => toggle(e.target.value)}>
      <option value="">Kaynak yok (temsili)</option>{draft.sources.map((k, i) => <option key={k.id} value={k.id}>{i + 1}. {k.text || 'Yeni kaynak'}</option>)}
    </select>)
  }
  function selectImage(areaId: string, label: string, value: string, toggle: (v: string) => void) {
    return area(areaId, label, <select {...errorAttrs(areaId)} value={value} onChange={e => toggle(e.target.value)}>
      <option value="">{areaId === 'coverImage' ? 'Görsel seçin' : 'Görselsiz (yalnız keşif listesi)'}</option>{draft.images.map((g, i) => <option key={i} value={g.file}>{g.description || g.alt || `Görsel ${i + 1}`}</option>)}
    </select>)
  }
  function validate(): Artifact | undefined {
    const result: Artifact = { ...draft, id, verification: draft.verification === 'verified' && sourced ? 'verified' : 'illustrative' }
    const errors = artifactErrors(result)
    setErrors(errors); setSaveError('')
    if (Object.keys(errors).length) {
      setMessage('')
      requestAnimationFrame(() => {
        const first = Array.from(form.current?.querySelectorAll<HTMLElement>('[aria-invalid="true"]') ?? [])[0]
        first?.focus()
      })
      return
    }
    return result
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validate()
    if (!result) return
    try {
      save({ ...overlay, [result.id]: result })
      setDraft(result)
      setMessage('Eser kaydedildi. Ana sayfa ve eser sayfası güncellendi.')
      if (!artifact) navigate(`/admin/artifact/${result.id}`, { replace: true })
    } catch (e) { setSaveError((e as Error).message) }
  }
  return <section className="page admin">
    <Link to="/admin">← Yönetim listesine dön</Link><h1>{artifact ? 'Eseri düzenle' : 'Yeni eser ekle'}</h1><DemoNote />
    <p>Zorunlu alanları doldurun. Görsel ve kaynak eklemek isteğe bağlıdır; eklenen kayıtların alanları zorunludur. Tarihsel bilgi ve görseller için kaynak ve kullanım iznini kontrol edin.</p>
    <form ref={form} noValidate onSubmit={submit}>
      {Object.keys(errors).length > 0 && <div role="alert" className="error-summary"><h2>Kayıt tamamlanamadı</h2><p>{Object.keys(errors).length} alanı kontrol edin. İlk hatalı alana odaklanıldı.</p><ul>{Object.entries(errors).map(([area, message]) => <li key={area}><a href={`#${area}`} onClick={e => { e.preventDefault(); document.getElementById(area)?.focus() }}>{document.querySelector(`label[for="${area}"]`)?.textContent ?? area}: {message}</a></li>)}</ul></div>}
      <p role="status">{message}</p>{saveError && <p role="alert" className="area-error">{saveError}</p>}
      <fieldset className="form-section"><legend>Eser bilgileri</legend>
        {(['ad', 'city', 'district', 'period', 'endowment', 'summary', 'history'] as const).map((a, i) => text(a, ['Ad', 'Şehir', 'İlçe', 'Dönem', 'Vakıf', 'Özet', 'Tarihçe'][i], draft[a], v => update({ [a]: v }), ['summary', 'history'].includes(a)))}
        <p className="identity">Eser kimliği: <strong>{id || 'Addan otomatik üretilecek'}</strong>. Kaydedildikten sonra değişmez.</p>
        <label className="form-area" htmlFor="verification">Doğrulama durumu
          <select id="verification" value={sourced ? draft.verification : 'illustrative'} aria-describedby="verification-help" onChange={e => update({ verification: e.target.value as Artifact['verification'] })}>
            <option value="illustrative">Temsili içerik</option><option value="verified" disabled={!sourced}>Kaynaklı bilgi</option>
          </select>
        </label>
        <p id="verification-help">Kaynaklı bilgi için en az bir dolu kaynak ve her test sorusu ile bilgi noktasında geçerli kaynak gerekir. {sourced ? 'Koşullar sağlandı; kaynaklı bilgi seçebilirsiniz.' : 'Koşullar sağlanmadığı için kayıt Temsili içerik olarak kalır.'}</p>
      </fieldset>
      <fieldset className="form-section"><legend>Kaynaklar</legend>
        {draft.sources.map((k, i) => <fieldset className="sub-form" key={k.id}><legend>Kaynak {i + 1}</legend>
          {text(`source-${i}-text`, 'Kaynak metni', k.text, v => update({ sources: draft.sources.map((x, j) => j === i ? { ...x, text: v } : x) }), true)}
          {text(`source-${i}-page`, 'Sayfa (isteğe bağlı)', k.page ?? '', v => update({ sources: draft.sources.map((x, j) => j === i ? { ...x, page: v } : x) }), false, false)}
          <button type="button" onClick={() => update({ sources: draft.sources.filter(x => x.id !== k.id), test: draft.test.map(s => s.sourceId === k.id ? { ...s, sourceId: '' } : s), hotspots: draft.hotspots.map(n => n.sourceId === k.id ? { ...n, sourceId: '' } : n), images: draft.images.map(g => g.sourceId === k.id ? { ...g, sourceId: '' } : g) })}>Kaynak {i + 1} sil</button>
        </fieldset>)}
        <button type="button" onClick={() => update({ sources: [...draft.sources, { id: uniqueId('source', draft.sources.map(k => k.id)), text: '' }] })}>Kaynak ekle</button>
      </fieldset>
      <fieldset className="form-section"><legend>Görseller</legend>
        <p>Yeni görsel için http/https URL kullanın. Mevcut görsellerin dosya yolu korunur. Dosya yüklenmez.</p>
        {draft.images.map((g, i) => {
          const toggle = (patch: Partial<typeof g>) => update({ images: draft.images.map((x, j) => j === i ? { ...x, ...patch } : x) })
          const existing = artifact?.images.some(x => x.file === g.file)
          return <fieldset className="sub-form" key={i}><legend>Görsel {i + 1}</legend>
            {area(`image-${i}-file`, 'Görsel URL / dosya yolu', <input {...errorAttrs(`image-${i}-file`)} required readOnly={existing} value={g.file} onChange={e => {
              const file = e.target.value
              update({ images: draft.images.map((x, j) => j === i ? { ...x, file } : x), coverImage: draft.coverImage === g.file ? file : draft.coverImage, hotspots: draft.hotspots.map(n => n.image === g.file ? { ...n, image: file } : n) })
            }} />)}
            {text(`image-${i}-alt`, 'Alt metin', g.alt, v => toggle({ alt: v }))}
            {text(`image-${i}-description`, 'Görsel açıklaması (isteğe bağlı)', g.description ?? '', v => toggle({ description: v }), false, false)}
            {text(`image-${i}-credit`, 'Kredi satırı (isteğe bağlı)', g.credit ?? '', v => toggle({ credit: v }), false, false)}
            {selectSource(`image-${i}-source-id`, g.sourceId, v => toggle({ sourceId: v }))}
          </fieldset>
        })}
        <button type="button" onClick={() => update({ images: [...draft.images, { file: '', alt: '', description: '', sourceId: '' }] })}>URL ile görsel ekle</button>
        {selectImage('coverImage', 'Kapak görseli', draft.coverImage, v => update({ coverImage: v }))}
      </fieldset>
      <fieldset className="form-section"><legend>Bilgi noktaları</legend><p>Görselsiz noktalar yalnızca keşif listesinde gösterilir. Görsel seçilen noktaların konumu yüzde olarak belirtilir.</p>
        {draft.hotspots.map((n, i) => {
          const toggle = (patch: Partial<typeof n>) => update({ hotspots: draft.hotspots.map((x, j) => j === i ? { ...x, ...patch } : x) })
          return <fieldset className="sub-form" key={n.id}><legend>Bilgi noktası {i + 1}</legend>
            {text(`point-${i}-title`, 'Başlık', n.title, v => toggle({ title: v }))}
            {text(`point-${i}-text`, 'Bilgi metni', n.text, v => toggle({ text: v }), true)}
            {selectSource(`point-${i}-source-id`, n.sourceId, v => toggle({ sourceId: v }))}
            {selectImage(`point-${i}-image`, 'Noktanın görseli', n.image, v => toggle({ image: v }))}
            <div className="coordinates">{(['x', 'y'] as const).map(a => area(`point-${i}-${a}`, `${a.toUpperCase()} (%)`, <input {...errorAttrs(`point-${i}-${a}`)} type="number" min={0} max={100} step="any" required value={Number.isNaN(n[a]) ? '' : n[a]} onChange={e => toggle({ [a]: e.target.valueAsNumber })} />))}</div>
            <button type="button" onClick={() => update({ hotspots: draft.hotspots.filter(x => x.id !== n.id) })}>Bilgi noktası {i + 1} sil</button>
          </fieldset>
        })}
        <button type="button" onClick={() => update({ hotspots: [...draft.hotspots, { id: uniqueId('point', draft.hotspots.map(n => n.id)), title: '', text: '', sourceId: '', image: draft.images[0]?.file ?? '', x: 50, y: 50 }] })}>Bilgi noktası ekle</button>
      </fieldset>
      <fieldset className="form-section"><legend>Test soruları (tam 3 soru)</legend>
        {draft.test.map((s, i) => {
          const toggle = (patch: Partial<typeof s>) => update({ test: draft.test.map((x, j) => j === i ? { ...x, ...patch } : x) })
          return <fieldset className="sub-form" key={i}><legend>Soru {i + 1}</legend>
            {text(`test-${i}-question`, 'Soru metni', s.question, v => toggle({ question: v }))}
            {s.options.map((v, j) => text(`test-${i}-option-${j}`, `Seçenek ${j + 1}`, v, value => toggle({ options: s.options.map((x, k) => k === j ? value : x) })))}
            {area(`test-${i}-correct`, 'Doğru seçenek', <select {...errorAttrs(`test-${i}-correct`)} value={s.correct} onChange={e => toggle({ correct: Number(e.target.value) })}>{s.options.map((v, j) => <option key={j} value={j}>{j + 1}. {v || 'Boş seçenek'}</option>)}</select>)}
            {text(`test-${i}-description`, 'Cevap açıklaması', s.description, v => toggle({ description: v }), true)}
            {selectSource(`test-${i}-source-id`, s.sourceId, v => toggle({ sourceId: v }))}
          </fieldset>
        })}
      </fieldset>
      <div className="admin-actions form-end"><button type="submit">Kaydet</button><button type="button" onClick={() => { const result = validate(); if (result) downloadJson(result, `${result.id}.json`) }}>JSON olarak indir</button><Link to="/admin">Listeye dön</Link></div>
    </form>
  </section>
}
