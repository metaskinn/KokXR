import type { Artifact } from '../domain/artifact'
import { PUBLIC_BUILD } from '../shared/config/publicBuild'
import { artifactValid, maybeSourced } from '../domain/verification'

const artifactFiles = import.meta.glob<Artifact>('../content/artifacts/*.json', { eager: true, import: 'default' })
const withoutPhoto = (e: Artifact): Artifact => ({
  ...e, coverImage: '', images: [], tour: undefined,
  hotspots: e.hotspots.map((b) => ({ ...b, image: '' })),
  model: e.model && { ...e.model, description: e.model.description.replace(/Levha ve paye yazıları[^.]*\./, 'Levha ve paye yüzeyleri bu sürümde yazısız bırakılmıştır.') },
})
const defaults = Object.values(artifactFiles).map((e) => PUBLIC_BUILD ? withoutPhoto(e) : e)
const keyStr = 'kokxr-content'
export type Overlay = Record<string, Artifact>
export interface ContentState { overlay: Overlay; warning: string }
export const defaultIds = defaults.map(e => e.id)

export function getArtifacts(overlay: Overlay = {}): Artifact[] {
  return [...defaults.map(e => overlay[e.id] ?? e), ...Object.values(overlay).filter(e => !defaultIds.includes(e.id))]
}
export function parseOverlay(data: unknown): Overlay {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Üst katman, eser kimliklerini tam eser nesnelerine eşleyen bir JSON nesnesi olmalıdır.')
  const records = Object.entries(data)
  if (!records.every(([id, e]) => artifactValid(e) && e.id === id)) throw new Error('JSON içinde geçersiz eser var. Zorunlu alanları, üç soruyu, dört seçeneği ve görsel/kaynak bağlantılarını kontrol edin. Hiçbir kayıt yüklenmedi.')
  return Object.fromEntries(records.map(([id, e]) => {
    const artifact = e as Artifact
    return [id, { ...artifact, verification: artifact.verification === 'verified' && maybeSourced(artifact) ? 'verified' : 'illustrative' }]
  }))
}
export function readContent(): ContentState {
  try { return { overlay: parseOverlay(JSON.parse(localStorage.getItem(keyStr) ?? '{}')), warning: '' } }
  catch { return { overlay: {}, warning: 'Tarayıcıdaki içerik okunamadı veya geçersiz. Varsayılan eserler gösteriliyor. Yönetim ekranından geçerli JSON yükleyebilir ya da üst katmanı sıfırlayabilirsiniz.' } }
}
export function writeContent(overlay: Overlay): ContentState {
  const verified = parseOverlay(overlay)
  try {
    localStorage.setItem(keyStr, JSON.stringify(verified))
    return { overlay: verified, warning: '' }
  } catch { throw new Error('Değişiklikler tarayıcıya kaydedilemedi. Depolama iznini ve boş alanı kontrol edin; formdaki bilgiler korunuyor.') }
}
