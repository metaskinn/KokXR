import type { Artifact } from '../domain/artifact'
import type { InventoryDetails, InventoryItem } from '../domain/inventory'

export type Role = 'editor' | 'curator'
export type Status = 'pending' | 'published' | 'rejected'

export interface AdminRow { id: string; name: string; city: string; district: string; status: Status; live: boolean; review_note: string | null; updated_at: string; updated_by: string | null }
export interface AdminRecord { id: string; status: Status; published: Artifact | null; draft: Artifact | null; review_note: string | null; updated_at: string }
export interface AuditRow { artifact_id: string; action: string; actor: string; note: string | null; at: string }

export interface Stats {
  status: { total: number; published: number; pending: number; rejected: number; unpublished_new: number }
  media: { files: number; bytes: number; uploads: number }
  inventory: { buildings: number; linked: number; models: number; with_facts: number }
  activity: { day: string; n: number }[]
  pending: { id: string; name: string; city: string; live: boolean; updated_at: string; updated_by: string | null }[]
}
export interface MediaRow { key: string; artifact_id: string | null; size: number; content_type: string; source: 'repo' | 'upload'; uploaded_at: string }

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) { super(message) }
}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/${path}`, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined || (init.method && init.method !== 'GET') ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : init.method && init.method !== 'GET' ? '{}' : undefined,
    })
  } catch { throw new ApiError(0, 'Sunucuya ulaşılamadı. Bağlantıyı kontrol edin.') }
  // Without the API (static preview, offline build) the host answers with the HTML page instead of JSON.
  if (!res.headers.get('content-type')?.includes('application/json')) throw new ApiError(0, 'Sunucu API’si bu ortamda yok.')
  const data = await res.json().catch(() => null) as ({ error?: string; details?: Record<string, string> } & T) | null
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Sunucu hatası (${res.status}).`, data?.details)
  return data as T
}

export const api = {
  publishedArtifacts: () => call<Artifact[]>('artifacts'),
  inventory: () => call<{ items: InventoryItem[]; details: Record<string, InventoryDetails> }>('inventory'),
  /** Image into the private bucket; returns the /api/media/... address to store in the artifact. */
  upload: (artifactId: string, data: string) => call<{ key: string; url: string }>('admin/uploads', { method: 'POST', body: { artifactId, data } }),
  session: () => call<{ role: Role | null }>('session'),
  login: (password: string) => call<{ role: Role }>('session', { method: 'POST', body: { password } }),
  logout: () => call<{ role: null }>('session', { method: 'DELETE' }),
  list: () => call<AdminRow[]>('admin/artifacts'),
  get: (id: string) => call<AdminRecord>(`admin/artifacts/${encodeURIComponent(id)}`),
  /** create = true refuses to overwrite an existing id (409). */
  save: (artifact: Artifact, create = false) => call<{ id: string; status: Status }>(`admin/artifacts/${encodeURIComponent(artifact.id)}`, { method: 'PUT', body: { artifact, create } }),
  approve: (id: string) => call<{ id: string }>(`admin/artifacts/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  reject: (id: string, note: string) => call<{ id: string }>(`admin/artifacts/${encodeURIComponent(id)}/reject`, { method: 'POST', body: { note } }),
  discard: (id: string) => call<{ id: string }>(`admin/artifacts/${encodeURIComponent(id)}/discard`, { method: 'POST' }),
  remove: (id: string) => call<{ id: string }>(`admin/artifacts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  audit: () => call<AuditRow[]>('admin/audit'),
  stats: () => call<Stats>('admin/stats'),
  media: (q: string, offset: number) => call<{ total: number; items: MediaRow[] }>(`admin/media?${new URLSearchParams({ q, offset: String(offset) })}`),
}

export const STATUS_LABELS: Record<Status, string> = { pending: 'Onay bekliyor', published: 'Yayında', rejected: 'Reddedildi' }
export const ROLE_LABELS: Record<Role, string> = { editor: 'Editör', curator: 'Küratör' }
