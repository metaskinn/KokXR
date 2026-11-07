import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import { parseOverlay, defaultIds } from '../../infrastructure/contentRepository'
import type { Overlay } from '../../infrastructure/contentRepository'

export interface AdminProps {
  artifacts: Artifact[]
  overlay: Overlay
  save: (data: Overlay) => void
}
export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function DemoNote() {
  return <p className="admin-note">Demo yönetim ekranı: değişiklikler yalnızca bu tarayıcıda saklanır.</p>
}
export default function AdminPage({ artifacts, overlay, save }: AdminProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  function apply(data: Overlay, result: string) {
    try { save(data); setMessage(result); setError('') }
    catch (e) { setError((e as Error).message); setMessage('') }
  }
  async function load(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = parseOverlay(JSON.parse(await file.text()))
      if (!window.confirm('Yüklenecek JSON mevcut üst katmanın tamamının yerini alacak. Devam edilsin mi?')) return
      apply(data, 'Üst katman yüklendi. Eserler güncellendi.')
    } catch (e) { setError(`JSON yüklenemedi: ${(e as Error).message}`); setMessage('') }
  }
  return <section className="page admin">
    <h1>İçerik yönetimi</h1><DemoNote />
    <p><Link to="/admin/new">Yeni eser ekle</Link></p>
    <p role="status">{message}</p>{error && <p role="alert" className="area-error">{error}</p>}
    <h2>Eserler</h2>
    <ul className="admin-list">{artifacts.map(artifact => {
      const defaultVal = defaultIds.includes(artifact.id)
      return <li key={artifact.id}>
        <h3>{artifact.name}</h3><p>{artifact.district} · {artifact.verification === 'verified' ? 'Kaynaklı bilgi' : 'Temsili içerik'}
          {' '}{!defaultVal ? <span className="label">Yeni</span> : Object.hasOwn(overlay, artifact.id) ? <span className="label">Değiştirildi</span> : null}</p>
        <div className="admin-actions">
          <Link to={`/admin/artifact/${artifact.id}`}>Düzenle<span className="sr-only">: {artifact.name}</span></Link>
          <Link to={`/artifact/${artifact.id}`}>Eseri aç<span className="sr-only">: {artifact.name}</span></Link>
          <button type="button" onClick={() => downloadJson(artifact, `${artifact.id}.json`)}>JSON olarak indir<span className="sr-only">: {artifact.name}</span></button>
          {defaultVal ? <button type="button" disabled={!Object.hasOwn(overlay, artifact.id)} onClick={() => {
            const fresh = { ...overlay }; delete fresh[artifact.id]; apply(fresh, `${artifact.name} varsayılana döndürüldü.`)
          }}>Varsayılana döndür<span className="sr-only">: {artifact.name}</span></button> : <button type="button" onClick={() => {
            if (!window.confirm(`${artifact.name} silinsin mi? Bu işlem bu tarayıcıdaki eseri kaldırır.`)) return
            const fresh = { ...overlay }; delete fresh[artifact.id]; apply(fresh, `${artifact.name} silindi.`)
          }}>Sil<span className="sr-only">: {artifact.name}</span></button>}
        </div>
      </li>
    })}</ul>
    <section className="section" aria-labelledby="transfer-title">
      <h2 id="transfer-title">Üst katmanı dışa / içe aktar</h2>
      <p>Tek eser indirmeleri kaynak JSON dosyalarıyla aynı biçimdedir. Kalıcı içerik için dosya repodaki eserler klasörüne eklenebilir. Üst katman dosyası ise yalnızca bu tarayıcıdaki ekleme ve değişiklikleri taşır.</p>
      <div className="admin-actions">
        <button type="button" onClick={() => downloadJson(overlay, 'kokxr-content.json')}>Tüm üst katmanı indir</button>
        <button type="button" onClick={() => {
          if (window.confirm('Tüm yerel içerik değişiklikleri ve yeni eserler silinsin mi? Varsayılan eserler korunur.')) apply({}, 'Üst katman sıfırlandı.')
        }}>Tüm üst katmanı sıfırla</button>
      </div>
      <label className="form-area file-picker" htmlFor="json-load">Üst katman JSON yükle
        <span>JSON dosyası seç</span>
        <input id="json-load" type="file" accept=".json,application/json" aria-describedby="load-help" onChange={load} />
      </label>
      <p id="load-help">Yükleme mevcut üst katmanın tamamının yerini alır ve onay ister. Önce yedek indirmeniz önerilir. Geçersiz dosyada mevcut içerik korunur.</p>
    </section>
  </section>
}
