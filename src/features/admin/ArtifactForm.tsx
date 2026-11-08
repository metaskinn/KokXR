import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import { artifactErrors, artifactId, maybeSourced, uniqueId } from '../../domain/verification'
import type { Errors } from '../../domain/verification'
import { TYPE_LABELS } from '../../domain/artifactTypes'
import { typesOf } from '../../content/artifactTypeIndex'
import { downloadJson } from './AdminPage'
import { useAdmin } from './context'
import { api, ApiError, STATUS_LABELS } from '../../infrastructure/api'
import type { AdminRecord, Role } from '../../infrastructure/api'
import NotFound from '../../shared/ui/NotFound'

/** /admin/new and /admin/artifact/:id: signs in, loads the record (pending draft first), then shows the form. */
export function AdminFormRoute() {
  const { id } = useParams()
  const { role } = useAdmin()
  return <section className="admin-page admin">
    <Link to="/admin/eserler">← Eserler</Link><h1>{id ? 'Eseri düzenle' : 'Yeni eser ekle'}</h1>
    <FormLoader key={id ?? 'fresh'} id={id} role={role} />
  </section>
}

function FormLoader({ id, role }: { id?: string; role: Role }) {
  const [record, setRecord] = useState<AdminRecord | null | undefined>(undefined)
  const [ids, setIds] = useState<string[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (id) api.get(id).then(setRecord, (e) => { if (e instanceof ApiError && e.status === 404) setRecord(null); else setError((e as Error).message) })
    else api.list().then((rows) => setIds(rows.map((r) => r.id)), (e) => setError((e as Error).message))
  }, [id])
  if (error) return <p role="alert" className="area-error">{error}</p>
  if (id && record === null) return <NotFound />
  if (id ? !record : !ids) return <p role="status">Yükleniyor…</p>
  const artifact = record ? record.draft ?? record.published ?? undefined : undefined
  return <>
    {record && <p className="admin-note">Durum: <strong>{STATUS_LABELS[record.status]}</strong>
      {record.draft && record.published ? ' — bekleyen değişiklik gösteriliyor; onaylanana kadar sitede yayındaki sürüm görünür.' : ''}
      {record.status === 'rejected' && record.review_note ? ` Ret gerekçesi: ${record.review_note}` : ''}</p>}
    <ArtifactForm artifact={artifact} existingIds={ids ?? []} role={role} />
  </>
}

function emptyArtifact(): Artifact {
  return { id: '', name: '', city: '', district: '', period: '', endowment: '', summary: '', history: '', verification: 'illustrative', types: [], coverImage: '', images: [], hotspots: [], sources: [],
    test: Array.from({ length: 3 }, () => ({ question: '', options: ['', '', '', ''], correct: 0, description: '', sourceId: '' })) }
}
export default function ArtifactForm({ artifact, existingIds, role }: { artifact?: Artifact; existingIds: string[]; role: Role }) {
  const [draft, setDraft] = useState<Artifact>(() => artifact ? { ...structuredClone(artifact), types: typesOf(artifact) } : emptyArtifact())
  const [errors, setErrors] = useState<Errors>({})
  // After the first save of a new artifact the address changes; the confirmation travels in the navigation state.
  const [message, setMessage] = useState<string>((useLocation().state as { saved?: string } | null)?.saved ?? '')
  const [saveError, setSaveError] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()
  const [savedId, setSavedId] = useState(artifact?.id)
  const id = savedId ?? uniqueId(artifactId(draft.name), existingIds)
  const [busy, setBusy] = useState(false)
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
    if (!result.types?.length) errors.types = 'En az bir tür seçin.'
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
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!id) { setUploadMessage('Önce eserin adını girin; görsel eser kimliğinin altına kaydedilir.'); return }
    if (file.size > 3_000_000) { setUploadMessage('Görsel en fazla 3 MB olabilir.'); return }
    setUploading(true); setUploadMessage('')
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''))
        reader.onerror = () => reject(new Error('Dosya okunamadı.'))
        reader.readAsDataURL(file)
      })
      const { url } = await api.upload(id, data)
      update({ images: [...draft.images, { file: url, alt: '', description: '', credit: '', sourceId: '' }], coverImage: draft.coverImage || url })
      setUploadMessage(`${file.name} yüklendi. Alt metin ile künye ve izin bilgisini doldurun.`)
    } catch (e) { setUploadMessage(`Yüklenemedi: ${(e as Error).message}`) }
    finally { setUploading(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = validate()
    if (!result || busy) return
    setBusy(true)
    try {
      await api.save(result, !savedId)
      setDraft(result); setSavedId(result.id)
      const saved = role === 'curator' ? 'Kaydedildi. Yayımlamak için listeden onaylayın.' : 'Kaydedildi. Küratör onayından sonra sitede görünecek.'
      setMessage(saved)
      if (!savedId) navigate(`/admin/artifact/${result.id}`, { replace: true, state: { saved } })
    } catch (e) {
      const err = e as ApiError
      if (err.details) setErrors(err.details)
      setSaveError(err.message)
    } finally { setBusy(false) }
  }
  return <>
    <p>Zorunlu alanları doldurun. Görsel ve kaynak eklemek isteğe bağlıdır; eklenen kayıtların alanları zorunludur. Tarihsel bilgi ve görseller için kaynak ve kullanım iznini kontrol edin.</p>
    <form ref={form} noValidate onSubmit={submit}>
      {Object.keys(errors).length > 0 && <div role="alert" className="error-summary"><h2>Kayıt tamamlanamadı</h2><p>{Object.keys(errors).length} alanı kontrol edin. İlk hatalı alana odaklanıldı.</p><ul>{Object.entries(errors).map(([area, message]) => <li key={area}><a href={`#${area}`} onClick={e => { e.preventDefault(); document.getElementById(area)?.focus() }}>{document.querySelector(`label[for="${area}"]`)?.textContent ?? area}: {message}</a></li>)}</ul></div>}
      <p role="status">{message}</p>{saveError && <p role="alert" className="area-error">{saveError}</p>}
      <fieldset className="form-section"><legend>Eser bilgileri</legend>
        {(['name', 'city', 'district', 'period', 'endowment', 'summary', 'history'] as const).map((a, i) => text(a, ['Ad', 'Şehir', 'İlçe', 'Dönem', 'Vakıf', 'Özet', 'Tarihçe'][i], draft[a], v => update({ [a]: v }), ['summary', 'history'].includes(a)))}
        <fieldset className="sub-form" aria-describedby={errors.types ? 'types-error' : 'types-help'}><legend>Tür</legend>
          <p id="types-help">Eserler sayfasındaki tür filtresinde kullanılır. Birden fazla seçilebilir.</p>
          {TYPE_LABELS.map(([key, label], i) => <label key={key} className="form-check" htmlFor={i === 0 ? 'types' : `types-${key}`}>
            <input type="checkbox" id={i === 0 ? 'types' : `types-${key}`} aria-invalid={i === 0 && !!errors.types} checked={!!draft.types?.includes(key)}
              onChange={e => update({ types: e.target.checked ? TYPE_LABELS.map(([k]) => k).filter(k => k === key || draft.types?.includes(k)) : (draft.types ?? []).filter(k => k !== key) })} /> {label}
          </label>)}
          {errors.types && <p id="types-error" className="area-error">{errors.types}</p>}
        </fieldset>
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
        <p>Görseli bilgisayardan yükleyin (JPEG, PNG veya WebP, en fazla 3 MB; özel depoya kaydedilir) ya da http/https URL girin. Yüklenen görselde künye ve kullanım izni zorunludur. Mevcut görsellerin dosya yolu korunur.</p>
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
            {g.file.startsWith('/api/media/') && <img className="upload-preview" src={g.file} alt="" />}
            {text(`image-${i}-credit`, g.file.startsWith('/api/media/') ? 'Künye ve kullanım izni' : 'Kredi satırı (isteğe bağlı)', g.credit ?? '', v => toggle({ credit: v }), false, g.file.startsWith('/api/media/'))}
            {selectSource(`image-${i}-source-id`, g.sourceId, v => toggle({ sourceId: v }))}
          </fieldset>
        })}
        <div className="admin-actions">
          <label className="file-picker" htmlFor="image-upload">{uploading ? 'Yükleniyor…' : 'Bilgisayardan görsel yükle'}
            <input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} aria-describedby="image-upload-help" onChange={uploadImage} />
          </label>
          <button type="button" onClick={() => update({ images: [...draft.images, { file: '', alt: '', description: '', sourceId: '' }] })}>URL ile görsel ekle</button>
        </div>
        <p id="image-upload-help" role="status">{uploadMessage}</p>
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
      <div className="admin-actions form-end"><button type="submit" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button><button type="button" onClick={() => { const result = validate(); if (result) downloadJson(result, `${result.id}.json`) }}>JSON olarak indir</button><Link to="/admin">Listeye dön</Link></div>
    </form>
  </>
}
