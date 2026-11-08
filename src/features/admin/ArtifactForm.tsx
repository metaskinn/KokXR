import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
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
import type { AdminRecord, AdminRow, Role } from '../../infrastructure/api'
import NotFound from '../../shared/ui/NotFound'

const LocationPicker = lazy(() => import('./LocationPicker'))

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
  const [rows, setRows] = useState<AdminRow[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (id) api.get(id).then(setRecord, (e) => { if (e instanceof ApiError && e.status === 404) setRecord(null); else setError((e as Error).message) })
    // The list feeds the city/district choices and the duplicate warning, for new and existing records alike.
    api.list().then(setRows, (e) => setError((e as Error).message))
  }, [id])
  if (error) return <p role="alert" className="area-error">{error}</p>
  if (id && record === null) return <NotFound />
  if ((id && !record) || !rows) return <p role="status">Yükleniyor…</p>
  const artifact = record ? record.draft ?? record.published ?? undefined : undefined
  return <>
    {record && <p className="admin-note">Durum: <strong>{STATUS_LABELS[record.status]}</strong>
      {record.draft && record.published ? ' — bekleyen değişiklik gösteriliyor; onaylanana kadar sitede yayındaki sürüm görünür.' : ''}
      {record.status === 'rejected' && record.review_note ? ` Ret gerekçesi: ${record.review_note}` : ''}</p>}
    <ArtifactForm artifact={artifact} rows={rows} role={role} />
  </>
}

function emptyArtifact(): Artifact {
  return { id: '', name: '', city: '', district: '', period: '', endowment: '', summary: '', history: '', verification: 'illustrative', types: [], coverImage: '', images: [], hotspots: [], sources: [],
    test: Array.from({ length: 3 }, () => ({ question: '', options: ['', '', '', ''], correct: 0, description: '', sourceId: '' })) }
}
/** Steps of the form; every field id maps to one of them, so an error can open its step. */
const STEPS = ['Temel bilgiler', 'Kaynaklar', 'Görseller', 'Bilgi noktaları', 'Test soruları', 'Önizleme'] as const
const stepOf = (area: string) => /^source-/.test(area) ? 1 : /^(image-|coverImage|images)/.test(area) ? 2 : /^(point-|hotspots)/.test(area) ? 3 : /^test/.test(area) ? 4 : 0
const NEW = '__yeni__'
const draftKey = (id?: string) => `kokxr-admin-taslak:${id ?? 'yeni'}`
const readDraft = (key: string): Artifact | null => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as Artifact : null } catch { return null } }
const plain = (v: string) => artifactId(v).replace(/-(camii|cami|mescidi|turbesi|hamami|hani|medresesi|cesmesi|kulliyesi)$/, '')

export default function ArtifactForm({ artifact, rows, role }: { artifact?: Artifact; rows: AdminRow[]; role: Role }) {
  const existingIds = useMemo(() => rows.map((r) => r.id), [rows])
  const [draft, setDraft] = useState<Artifact>(() => artifact ? { ...structuredClone(artifact), types: typesOf(artifact) } : emptyArtifact())
  const [step, setStep] = useState(0)
  const [dirty, setDirty] = useState(false)
  // A draft left in this browser (closed tab, lost connection) is offered back instead of being silently dropped.
  const [stored, setStored] = useState<Artifact | null>(() => readDraft(draftKey(artifact?.id)))
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
  function update(patch: Partial<Artifact>) { setDraft(t => ({ ...t, ...patch })); setMessage(''); setDirty(true) }
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(() => { try { localStorage.setItem(draftKey(artifact?.id), JSON.stringify(draft)) } catch { /* storage full or blocked: the form still works */ } }, 600)
    return () => clearTimeout(t)
  }, [draft, dirty, artifact?.id])
  const forgetDraft = () => { try { localStorage.removeItem(draftKey(artifact?.id)) } catch { /* ignore */ } setStored(null) }

  // City and district come from the existing records, so the filters and the map do not split on spelling ("bursa", "Bursa ").
  const cities = useMemo(() => [...new Set(rows.map((r) => r.city))].sort((a, b) => a.localeCompare(b, 'tr')), [rows])
  const districts = useMemo(() => [...new Set(rows.filter((r) => r.city === draft.city).map((r) => r.district))].sort((a, b) => a.localeCompare(b, 'tr')), [rows, draft.city])
  const [newCity, setNewCity] = useState(() => !!artifact && !cities.includes(artifact.city))
  const [newDistrict, setNewDistrict] = useState(() => !!artifact && !rows.some((r) => r.city === artifact.city && r.district === artifact.district))
  const near = useMemo(() => {
    const same = rows.filter((r) => r.city === draft.city && r.district === draft.district && r.id !== artifact?.id)
    return (same.length ? same : rows.filter((r) => r.city === draft.city)).map((r) => r.id)
  }, [rows, draft.city, draft.district, artifact?.id])
  // Same building under a slightly different name ("Ulu Camii" vs "Bursa Ulu Camii"): compare the names without the type word and the city.
  const duplicates = useMemo(() => {
    const words = (name: string, city: string) => plain(name).split('-').filter((w) => w && w !== artifactId(city))
    const mine = words(draft.name, draft.city)
    if (mine.join('').length < 3) return []
    return rows.filter((r) => {
      if (r.id === artifact?.id || (draft.city && r.city !== draft.city)) return false
      const theirs = words(r.name, r.city)
      return mine.join('-') === theirs.join('-') || (mine.length > 0 && mine.every((w) => theirs.includes(w)) && theirs.length - mine.length <= 1)
    })
  }, [rows, draft.name, draft.city, artifact?.id])
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
      setStep(Math.min(...Object.keys(errors).map(stepOf)))
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
      setDraft(result); setSavedId(result.id); setDirty(false); forgetDraft()
      const saved = role === 'curator' ? 'Kaydedildi. Yayımlamak için listeden onaylayın.' : 'Kaydedildi. Küratör onayından sonra sitede görünecek.'
      setMessage(saved)
      if (!savedId) navigate(`/admin/artifact/${result.id}`, { replace: true, state: { saved } })
    } catch (e) {
      const err = e as ApiError
      if (err.details) setErrors(err.details)
      setSaveError(err.message)
    } finally { setBusy(false) }
  }
  const errorCount = (n: number) => Object.keys(errors).filter((k) => stepOf(k) === n).length
  // What each step still needs; shown in the step bar so nothing is hidden behind "Kaydet".
  const done = [
    !!(draft.name.trim() && draft.city.trim() && draft.district.trim() && draft.period.trim() && draft.endowment.trim() && draft.summary.trim() && draft.history.trim() && draft.types?.length),
    draft.sources.some((k) => k.text.trim()),
    draft.images.length > 0 && !!draft.coverImage,
    draft.hotspots.length > 0,
    draft.test.every((t) => t.question.trim() && t.options.every((o) => o.trim()) && t.description.trim()),
    false,
  ]
  const checks = [
    { ok: draft.sources.some((k) => k.text.trim()), text: 'En az bir dolu kaynak' },
    { ok: draft.test.every((t) => draft.sources.some((k) => k.id === t.sourceId && k.text.trim())), text: 'Her test sorusu bir kaynağa bağlı' },
    { ok: draft.hotspots.every((n) => draft.sources.some((k) => k.id === n.sourceId && k.text.trim())), text: 'Her bilgi noktası bir kaynağa bağlı' },
  ]
  const cover = draft.images.find((g) => g.file === draft.coverImage)
  const citySelect = area('city', 'Şehir', newCity
    ? <span className="combo"><input {...errorAttrs('city')} required value={draft.city} placeholder="Yeni şehrin adı (ör. İzmir)" onChange={(e) => update({ city: e.target.value, district: '' })} />
      <button type="button" className="btn-ghost" onClick={() => { setNewCity(false); update({ city: '', district: '' }) }}>Listeden seç</button></span>
    : <select {...errorAttrs('city')} required value={draft.city} onChange={(e) => { if (e.target.value === NEW) { setNewCity(true); setNewDistrict(true); update({ city: '', district: '' }) } else { setNewDistrict(false); update({ city: e.target.value, district: '' }) } }}>
      <option value="">Şehir seçin</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}<option value={NEW}>+ Yeni şehir ekle…</option>
    </select>)
  const districtSelect = area('district', 'İlçe', newDistrict || newCity
    ? <span className="combo"><input {...errorAttrs('district')} required value={draft.district} placeholder="İlçenin adı" onChange={(e) => update({ district: e.target.value })} />
      {!newCity && <button type="button" className="btn-ghost" onClick={() => { setNewDistrict(false); update({ district: '' }) }}>Listeden seç</button>}</span>
    : <select {...errorAttrs('district')} required value={draft.district} disabled={!draft.city} onChange={(e) => { if (e.target.value === NEW) { setNewDistrict(true); update({ district: '' }) } else update({ district: e.target.value }) }}>
      <option value="">{draft.city ? 'İlçe seçin' : 'Önce şehri seçin'}</option>{districts.map((d) => <option key={d} value={d}>{d}</option>)}<option value={NEW}>+ Yeni ilçe ekle…</option>
    </select>)

  return <>
    <p>Altı adımda doldurun; adımlar arasında serbestçe geçebilirsiniz. Yazdıklarınız bu tarayıcıda taslak olarak saklanır. Tarihsel bilgi ve görseller için kaynak ve kullanım iznini kontrol edin.</p>
    {stored && !dirty && JSON.stringify(stored) !== JSON.stringify(draft) && <div className="admin-note draft-note" role="status">
      <p><strong>Kaydedilmemiş bir taslak bulundu</strong>{stored.name ? ` (${stored.name})` : ''}. Kaldığınız yerden devam etmek ister misiniz?</p>
      <div className="admin-actions"><button type="button" className="btn-primary" onClick={() => { setDraft(stored); setDirty(true); setStored(null) }}>Taslağı geri yükle</button>
        <button type="button" className="btn-ghost" onClick={forgetDraft}>Taslağı sil</button></div>
    </div>}
    <nav className="steps" aria-label="Form adımları"><ol>
      {STEPS.map((name, n) => <li key={name}><button type="button" aria-current={step === n ? 'step' : undefined} onClick={() => setStep(n)} data-state={errorCount(n) ? 'error' : done[n] ? 'done' : undefined}>
        <span className="step-no" aria-hidden="true">{errorCount(n) ? '!' : done[n] ? '✓' : n + 1}</span>{name}
        {errorCount(n) > 0 && <span className="invisible"> ({errorCount(n)} hata)</span>}
      </button></li>)}
    </ol></nav>
    <form ref={form} noValidate onSubmit={submit}>
      {Object.keys(errors).length > 0 && <div role="alert" className="error-summary"><h2>Kayıt tamamlanamadı</h2><p>{Object.keys(errors).length} alanı kontrol edin. İlk hatalı alanın adımı açıldı.</p><ul>{Object.entries(errors).map(([area, message]) => <li key={area}><a href={`#${area}`} onClick={e => { e.preventDefault(); setStep(stepOf(area)); requestAnimationFrame(() => document.getElementById(area)?.focus()) }}>{STEPS[stepOf(area)]} · {document.querySelector(`label[for="${area}"]`)?.textContent ?? area}: {message}</a></li>)}</ul></div>}
      <p role="status">{message}</p>{saveError && <p role="alert" className="area-error">{saveError}</p>}

      <fieldset className="form-section" hidden={step !== 0}><legend>Temel bilgiler</legend>
        {text('name', 'Ad', draft.name, v => update({ name: v }))}
        {duplicates.length > 0 && <div className="admin-note warn" role="status"><p><strong>Benzer adlı {duplicates.length === 1 ? 'bir eser' : `${duplicates.length} eser`} zaten var.</strong> Aynı yapıysa yeni kayıt açmak yerine onu düzenleyin:</p>
          <ul>{duplicates.slice(0, 5).map((r) => <li key={r.id}><Link to={`/admin/artifact/${r.id}`}>{r.name}</Link> · {r.district}, {r.city}</li>)}</ul></div>}
        <div className="form-row">{citySelect}{districtSelect}</div>
        {newCity && <p className="help">Yeni şehir eklemek için ayrı bir kurulum gerekmez: kayıt onaylanınca şehir, Eserler sayfasındaki filtrede ve Maketler haritasında kendiliğinden görünür.</p>}
        {text('period', 'Dönem', draft.period, v => update({ period: v }))}
        {text('endowment', 'Vakıf', draft.endowment, v => update({ endowment: v }))}
        {text('summary', 'Özet', draft.summary, v => update({ summary: v }), true)}
        {text('history', 'Tarihçe', draft.history, v => update({ history: v }), true)}
        <fieldset className="sub-form type-picker" aria-describedby={errors.types ? 'types-error' : 'types-help'}><legend>Tür</legend>
          <p id="types-help">Eserler sayfasındaki tür filtresinde kullanılır. Birden fazla seçilebilir.</p>
          <div className="check-grid">{TYPE_LABELS.map(([key, label], i) => <label key={key} className="form-check" htmlFor={i === 0 ? 'types' : `types-${key}`}>
            <input type="checkbox" id={i === 0 ? 'types' : `types-${key}`} aria-invalid={i === 0 && !!errors.types} checked={!!draft.types?.includes(key)}
              onChange={e => update({ types: e.target.checked ? TYPE_LABELS.map(([k]) => k).filter(k => k === key || draft.types?.includes(k)) : (draft.types ?? []).filter(k => k !== key) })} /> <span>{label}</span>
          </label>)}</div>
          {errors.types && <p id="types-error" className="area-error">{errors.types}</p>}
        </fieldset>
        <fieldset className="sub-form" aria-describedby={errors.location ? 'location-error' : undefined}><legend>Haritadaki konum (isteğe bağlı)</legend>
          <p>Haritaya tıklayarak yapının yerini işaretleyin; işareti sürükleyerek düzeltebilirsiniz. Konum, Maketler sayfasındaki haritada kullanılır.</p>
          {step === 0 && <Suspense fallback={<p role="status">Harita yükleniyor…</p>}>
            <LocationPicker value={draft.location} onChange={(p) => update({ location: p })} near={near} label={`${draft.name || 'Eser'} için konum seçme haritası`} />
          </Suspense>}
          {errors.location && <p id="location-error" className="area-error">{errors.location}</p>}
        </fieldset>
        <p className="identity">Eser kimliği: <strong>{id || 'Addan otomatik üretilecek'}</strong>. Kaydedildikten sonra değişmez.</p>
      </fieldset>

      <fieldset className="form-section" hidden={step !== 1}><legend>Kaynaklar</legend>
        <div className="verify-box">
          <p><strong>Doğrulama durumu: {sourced && draft.verification === 'verified' ? 'Kaynaklı bilgi' : 'Temsilî içerik'}</strong></p>
          <ul className="checklist">{checks.map((c) => <li key={c.text} data-ok={c.ok ? 'yes' : 'no'}><span aria-hidden="true">{c.ok ? '✓' : '○'}</span> {c.text}<span className="invisible">{c.ok ? ': tamam' : ': eksik'}</span></li>)}</ul>
          <label className="form-check" htmlFor="verification"><input type="checkbox" id="verification" disabled={!sourced} checked={sourced && draft.verification === 'verified'} onChange={(e) => update({ verification: e.target.checked ? 'verified' : 'illustrative' })} /> <span>Kaynaklı bilgi olarak işaretle</span></label>
          <p className="help" id="verification-help">{sourced ? 'Koşullar sağlandı. İşaretlenirse eser sayfasında "Kaynaklı bilgi" olarak gösterilir.' : 'Koşullar tamamlanmadan kayıt "Temsilî içerik" olarak kalır; kesin bilgi gibi sunulmaz.'}</p>
        </div>
        {draft.sources.map((k, i) => <fieldset className="sub-form" key={k.id}><legend>Kaynak {i + 1}</legend>
          {text(`source-${i}-text`, 'Kaynak metni', k.text, v => update({ sources: draft.sources.map((x, j) => j === i ? { ...x, text: v } : x) }), true)}
          {text(`source-${i}-page`, 'Sayfa (isteğe bağlı)', k.page ?? '', v => update({ sources: draft.sources.map((x, j) => j === i ? { ...x, page: v } : x) }), false, false)}
          <button type="button" onClick={() => update({ sources: draft.sources.filter(x => x.id !== k.id), test: draft.test.map(s => s.sourceId === k.id ? { ...s, sourceId: '' } : s), hotspots: draft.hotspots.map(n => n.sourceId === k.id ? { ...n, sourceId: '' } : n), images: draft.images.map(g => g.sourceId === k.id ? { ...g, sourceId: '' } : g) })}>Kaynak {i + 1} sil</button>
        </fieldset>)}
        <button type="button" onClick={() => update({ sources: [...draft.sources, { id: uniqueId('source', draft.sources.map(k => k.id)), text: '' }] })}>Kaynak ekle</button>
      </fieldset>

      <fieldset className="form-section" hidden={step !== 2}><legend>Görseller</legend>
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

      <fieldset className="form-section" hidden={step !== 3}><legend>Bilgi noktaları</legend><p>Görselsiz noktalar yalnızca keşif listesinde gösterilir. Görsel seçilen noktaların konumu yüzde olarak belirtilir.</p>
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

      <fieldset className="form-section" hidden={step !== 4}><legend>Test soruları (tam 3 soru)</legend>
        {draft.test.map((s, i) => {
          const toggle = (patch: Partial<typeof s>) => update({ test: draft.test.map((x, j) => j === i ? { ...x, ...patch } : x) })
          return <details className="sub-form test-q" key={i} open={i === 0 || Object.keys(errors).some(k => k.startsWith(`test-${i}-`))}><summary>Soru {i + 1}{s.question ? `: ${s.question}` : ''}</summary>
            {text(`test-${i}-question`, 'Soru metni', s.question, v => toggle({ question: v }))}
            {s.options.map((v, j) => text(`test-${i}-option-${j}`, `Seçenek ${j + 1}`, v, value => toggle({ options: s.options.map((x, k) => k === j ? value : x) })))}
            {area(`test-${i}-correct`, 'Doğru seçenek', <select {...errorAttrs(`test-${i}-correct`)} value={s.correct} onChange={e => toggle({ correct: Number(e.target.value) })}>{s.options.map((v, j) => <option key={j} value={j}>{j + 1}. {v || 'Boş seçenek'}</option>)}</select>)}
            {text(`test-${i}-description`, 'Cevap açıklaması', s.description, v => toggle({ description: v }), true)}
            {selectSource(`test-${i}-source-id`, s.sourceId, v => toggle({ sourceId: v }))}
          </details>
        })}
      </fieldset>

      <section className="form-section preview" hidden={step !== 5} aria-labelledby="preview-title">
        <h2 id="preview-title">Önizleme</h2>
        <p className="help">Eser sayfasının özeti böyle görünecek. {role === 'curator' ? 'Kaydedince onay listesine düşer.' : 'Kaydedince küratör onayına gider; onaylanana kadar sitede görünmez.'}</p>
        <article className="preview-card">
          {cover ? <img src={cover.file} alt={cover.alt} /> : <div className="preview-empty">Kapak görseli yok</div>}
          <div>
            <p className="preview-meta">{[draft.district, draft.city].filter(Boolean).join(', ') || 'Konum yazılmadı'} · {draft.period || 'Dönem yazılmadı'}</p>
            <h3>{draft.name || 'Adsız eser'}</h3>
            <p className="badge" data-kind={sourced && draft.verification === 'verified' ? 'verified' : 'illustrative'}>{sourced && draft.verification === 'verified' ? 'Kaynaklı bilgi' : 'Temsilî içerik'}</p>
            <p>{draft.summary || 'Özet yazılmadı.'}</p>
            <dl className="preview-facts">
              <div><dt>Vakıf</dt><dd>{draft.endowment || '—'}</dd></div>
              <div><dt>Tür</dt><dd>{TYPE_LABELS.filter(([k]) => draft.types?.includes(k)).map(([, l]) => l).join(', ') || '—'}</dd></div>
              <div><dt>Haritada</dt><dd>{draft.location ? 'İşaretlenen konumda' : 'İlçe merkezinde (yaklaşık)'}</dd></div>
              <div><dt>İçerik</dt><dd>{draft.images.length} görsel · {draft.sources.length} kaynak · {draft.hotspots.length} bilgi noktası · 3 soru</dd></div>
            </dl>
            {draft.history && <details><summary>Tarihçe</summary><p className="preview-history">{draft.history}</p></details>}
            {draft.sources.some((k) => k.text.trim()) && <><h4>Kaynaklar</h4><ol>{draft.sources.filter((k) => k.text.trim()).map((k) => <li key={k.id}>{k.text}{k.page ? `, s. ${k.page}` : ''}</li>)}</ol></>}
          </div>
        </article>
      </section>

      <div className="admin-actions form-end form-bar">
        <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← Önceki</button>
        {step < STEPS.length - 1 && <button type="button" onClick={() => setStep(step + 1)}>Sonraki: {STEPS[step + 1]} →</button>}
        <span className="bar-gap" />
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        <button type="button" className="btn-ghost small" onClick={() => { const result = validate(); if (result) downloadJson(result, `${result.id}.json`) }}>JSON indir</button>
      </div>
    </form>
  </>
}
