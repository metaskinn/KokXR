import type { Artifact } from '../src/domain/artifact.js'
import { artifactErrors, artifactValid, maybeSourced } from '../src/domain/verification.js'
import { clearCookie, roleForPassword, roleFromCookie, sessionCookie } from './auth.js'
import type { Role } from './auth.js'
import { sql } from './db.js'
import { randomUUID } from 'node:crypto'
import { bucket, MEDIA_KEY, MEDIA_PREFIX, sniffImage } from './storage.js'

export interface ApiRequest { method: string; path: string; body: unknown; cookie?: string; secure: boolean }
export interface ApiResponse { status: number; body?: unknown; headers?: Record<string, string> }

const json = (status: number, body: unknown, headers: Record<string, string> = {}): ApiResponse => ({ status, body, headers })
const fail = (status: number, error: string, details?: unknown) => json(status, { error, details })

/** Only these top-level fields are stored; anything else in a request body is dropped. */
const FIELDS = ['id', 'inventoryId', 'name', 'city', 'district', 'period', 'endowment', 'summary', 'history', 'verification', 'types',
  'coverImage', 'images', 'hotspots', 'test', 'sources', 'tour', 'tour360', 'restoration', 'model', 'timeLayer', 'location'] as const

/** Structural and content checks shared with the admin form (src/domain/verification.ts). */
export function cleanArtifact(input: unknown, id: string): { artifact?: Artifact; errors?: Record<string, string> } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { body: 'Eser nesnesi bekleniyor.' } }
  const picked = Object.fromEntries(FIELDS.filter((k) => k in input).map((k) => [k, (input as Record<string, unknown>)[k]]))
  if (picked.id !== id) return { errors: { id: 'Adresteki kimlik ile eser kimliği aynı olmalı.' } }
  if (!artifactValid(picked)) {
    // Field messages need the full structure; a partial body only gets the general message.
    let errors: Record<string, string> = {}
    try { errors = artifactErrors(picked as unknown as Artifact) } catch { /* structure incomplete */ }
    return { errors: Object.keys(errors).length ? errors : { body: 'Eser yapısı geçersiz.' } }
  }
  const artifact = picked as unknown as Artifact
  // "Kaynaklı bilgi" is only kept when every hotspot and question points to a filled source.
  return { artifact: { ...artifact, verification: artifact.verification === 'verified' && maybeSourced(artifact) ? 'verified' : 'illustrative' } }
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const can = (role: Role | null, need: Role) => role === 'curator' || (need === 'editor' && role === 'editor')

export async function handle(req: ApiRequest): Promise<ApiResponse> {
  const parts = req.path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean) // e.g. ['admin', 'artifacts', 'ulu-mosque', 'approve']
  const role = roleFromCookie(req.cookie)
  const db = sql()
  const route = `${req.method} /${parts.map((p, i) => (i === 2 && parts[0] === 'admin' ? ':id' : p)).join('/')}`

  // Public: an image from the private bucket, as a short-lived presigned redirect. Only keys recorded in the media table.
  if (req.method === 'GET' && parts[0] === 'media') {
    const key = parts.slice(1).map(decodeURIComponent).join('/')
    if (!MEDIA_KEY.test(key)) return fail(400, 'Geçersiz dosya anahtarı.')
    const [row] = await db`select 1 from media where key = ${key}`
    // Not migrated yet: fall back to the static copy shipped with the site.
    if (!row) return { status: 302, headers: { Location: `/${key}`, 'Cache-Control': 'no-store' } }
    const url = await bucket().url(key, { expiresIn: 3600 })
    return { status: 302, headers: { Location: url, 'Cache-Control': 'private, max-age=3000' } }
  }

  switch (route) {
    case 'GET /health': {
      await db`select 1`
      return json(200, { ok: true })
    }

    // Public: only approved content.
    case 'GET /artifacts': {
      const rows = await db`select published from artifacts where published is not null order by id` as { published: Artifact }[]
      return json(200, rows.map((r) => r.published), { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300' })
    }

    // Public: the printed inventory (reference data, edited only through the JSON files and npm run db:setup).
    case 'GET /inventory': {
      // select *: works before and after the migration that adds `city` (rows from before it are Bursa).
      const items = await db`select * from inventory order by id`
      const details = await db`select id, data from inventory_details` as { id: string; data: unknown }[]
      return json(200, {
        items: items.map((r) => ({ id: r.id, name: r.name, city: r.city ?? 'Bursa', district: r.district, section: r.section, volume: r.volume, ...(r.grp ? { group: r.grp } : {}), ...(r.artifact_id ? { artifactId: r.artifact_id } : {}), ...(r.group_head ? { groupHead: true } : {}), hasScaleModel: r.has_scale_model })),
        details: Object.fromEntries(details.map((d) => [d.id, d.data])),
      }, { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600' })
    }

    case 'GET /session': return json(200, { role })
    case 'POST /session': {
      const password = (req.body as { password?: unknown } | null)?.password
      const found = typeof password === 'string' && password.length <= 200 ? roleForPassword(password) : null
      if (!found) {
        await new Promise((r) => setTimeout(r, 600)) // slows down guessing
        return fail(401, 'Şifre hatalı.')
      }
      return json(200, { role: found }, { 'Set-Cookie': sessionCookie(found, req.secure) })
    }
    case 'DELETE /session': return json(200, { role: null }, { 'Set-Cookie': clearCookie(req.secure) })
  }

  if (parts[0] !== 'admin') return fail(404, 'Bulunamadı.')
  if (!role) return fail(401, 'Giriş gerekli.')
  const id = parts[2]
  if (id !== undefined && !ID.test(id)) return fail(400, 'Geçersiz eser kimliği.')

  switch (route) {
    case 'GET /admin/artifacts': {
      const rows = await db`
        select id, status, review_note, updated_at, updated_by, published is not null as live,
               coalesce(draft, published)->>'name' as name, coalesce(draft, published)->>'city' as city, coalesce(draft, published)->>'district' as district
        from artifacts order by (status = 'pending') desc, updated_at desc, id`
      return json(200, rows, { 'Cache-Control': 'no-store' })
    }
    // Image upload into the private bucket. Body: { artifactId, data (base64) }; at most 3 MB, JPEG/PNG/WebP by content.
    case 'POST /admin/uploads': {
      if (!can(role, 'editor')) return fail(403, 'Yetki yok.')
      const { artifactId, data } = (req.body ?? {}) as { artifactId?: unknown; data?: unknown }
      if (typeof artifactId !== 'string' || !ID.test(artifactId)) return fail(422, 'Önce eser adını girin; dosya eser kimliğinin altına kaydedilir.')
      if (typeof data !== 'string' || data.length > 4_100_000) return fail(413, 'Görsel en fazla 3 MB olabilir.')
      const bytes = Buffer.from(data, 'base64')
      if (!bytes.length || bytes.length > 3_000_000) return fail(413, 'Görsel en fazla 3 MB olabilir.')
      const kind = sniffImage(bytes)
      if (!kind) return fail(415, 'Yalnız JPEG, PNG veya WebP yüklenebilir.')
      const key = `images/${artifactId}/upload-${randomUUID()}.${kind.ext}`
      const out = await bucket().upload(key, bytes, { contentType: kind.type, cacheControl: 'private, max-age=86400' })
      await db.transaction([
        db`insert into media (key, artifact_id, size, content_type, etag, source) values (${key}, ${artifactId}, ${bytes.length}, ${kind.type}, ${out?.etag ?? null}, 'upload')`,
        db`insert into audit_log (artifact_id, action, actor, note) values (${artifactId}, 'upload', ${role}, ${key})`,
      ])
      return json(201, { key, url: `${MEDIA_PREFIX}${key}` })
    }
    case 'GET /admin/audit': {
      return json(200, await db`select artifact_id, action, actor, note, at from audit_log where action <> 'seed' order by at desc limit 200`, { 'Cache-Control': 'no-store' })
    }
    // Dashboard numbers that only the database knows (content statistics are computed in the browser from the published list).
    case 'GET /admin/stats': {
      const [[status], [media], [inventory], activity, pending] = await Promise.all([
        db`select count(*)::int as total,
                  count(*) filter (where status = 'published')::int as published,
                  count(*) filter (where status = 'pending')::int as pending,
                  count(*) filter (where status = 'rejected')::int as rejected,
                  count(*) filter (where published is null)::int as unpublished_new
           from artifacts`,
        db`select count(*)::int as files, coalesce(sum(size), 0)::bigint as bytes, count(*) filter (where source = 'upload')::int as uploads from media`,
        db`select count(*)::int as buildings, count(artifact_id)::int as linked, count(*) filter (where has_scale_model)::int as models,
                  (select count(*) from inventory_details)::int as with_facts from inventory`,
        db`select to_char(d, 'YYYY-MM-DD') as day, coalesce(n, 0)::int as n
           from generate_series(current_date - 13, current_date, interval '1 day') as d
           left join (select date_trunc('day', at)::date as day, count(*) as n from audit_log where action <> 'seed' and at >= current_date - 13 group by 1) a on a.day = d::date
           order by d`,
        db`select id, coalesce(draft, published)->>'name' as name, coalesce(draft, published)->>'city' as city, published is not null as live, updated_at, updated_by
           from artifacts where status = 'pending' order by updated_at limit 8`,
      ])
      return json(200, { status, media: { ...media, bytes: Number(media.bytes) }, inventory, activity, pending }, { 'Cache-Control': 'no-store' })
    }
    case 'GET /admin/media': {
      const params = (req.body ?? {}) as Record<string, string>
      const q = String(params.q ?? '').slice(0, 100), offset = Math.max(0, Math.min(1e6, Number(params.offset) || 0))
      const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
      const rows = await db`select key, artifact_id, size, content_type, source, uploaded_at, count(*) over ()::int as total
        from media where key ilike ${like} order by uploaded_at desc, key limit 48 offset ${offset}`
      return json(200, { total: rows[0]?.total ?? 0, items: rows.map(({ total: _t, ...r }) => r) }, { 'Cache-Control': 'no-store' })
    }
    case 'GET /admin/artifacts/:id': {
      const [row] = await db`select id, status, published, draft, review_note, updated_at from artifacts where id = ${id}`
      return row ? json(200, row, { 'Cache-Control': 'no-store' }) : fail(404, 'Eser yok.')
    }
    // Create or change: always stored as a draft that waits for a curator.
    case 'PUT /admin/artifacts/:id': {
      if (!can(role, 'editor')) return fail(403, 'Yetki yok.')
      const { artifact, errors } = cleanArtifact((req.body as { artifact?: unknown } | null)?.artifact, id)
      if (!artifact) return fail(422, 'Doğrulama başarısız.', errors)
      const value = JSON.stringify(artifact)
      if ((req.body as { create?: unknown }).create === true) {
        const [exists] = await db`select 1 from artifacts where id = ${id}`
        if (exists) return fail(409, 'Bu kimlikte bir eser zaten var. Adı değiştirin.')
      }
      await db.transaction([
        db`insert into artifacts (id, status, draft, updated_by) values (${id}, 'pending', ${value}::jsonb, ${role})
           on conflict (id) do update set status = 'pending', draft = excluded.draft, review_note = null, updated_by = excluded.updated_by, updated_at = now()`,
        db`insert into audit_log (artifact_id, action, actor) values (${id}, 'save', ${role})`,
      ])
      return json(200, { id, status: 'pending' })
    }
    case 'POST /admin/artifacts/:id/approve': {
      if (!can(role, 'curator')) return fail(403, 'Onay yalnız küratör içindir.')
      const [row] = await db`select draft from artifacts where id = ${id}` as { draft: Artifact | null }[]
      if (!row?.draft) return fail(409, 'Onaylanacak bekleyen değişiklik yok.')
      // Re-check on approval: the stored draft must still pass the current rules.
      if (!cleanArtifact(row.draft, id).artifact) return fail(422, 'Bekleyen kayıt güncel kurallara uymuyor; düzenleyip tekrar kaydedin.')
      await db.transaction([
        db`update artifacts set published = draft, draft = null, status = 'published', review_note = null, updated_by = ${role}, updated_at = now() where id = ${id}`,
        db`insert into audit_log (artifact_id, action, actor) values (${id}, 'approve', ${role})`,
      ])
      return json(200, { id, status: 'published' })
    }
    case 'POST /admin/artifacts/:id/reject': {
      if (!can(role, 'curator')) return fail(403, 'Reddetme yalnız küratör içindir.')
      const note = (req.body as { note?: unknown } | null)?.note
      if (typeof note !== 'string' || !note.trim() || note.length > 1000) return fail(422, 'Ret gerekçesi zorunludur (en fazla 1000 karakter).')
      const result = await db.transaction([
        db`update artifacts set status = 'rejected', review_note = ${note.trim()}, updated_by = ${role}, updated_at = now() where id = ${id} and draft is not null returning id`,
        db`insert into audit_log (artifact_id, action, actor, note) select ${id}, 'reject', ${role}, ${note.trim()} where exists (select 1 from artifacts where id = ${id} and draft is not null)`,
      ])
      return (result[0] as unknown[]).length ? json(200, { id, status: 'rejected' }) : fail(409, 'Reddedilecek bekleyen değişiklik yok.')
    }
    // Drop the waiting change; the published version (if any) stays live.
    case 'POST /admin/artifacts/:id/discard': {
      if (!can(role, 'editor')) return fail(403, 'Yetki yok.')
      await db.transaction([
        db`delete from artifacts where id = ${id} and published is null`,
        db`update artifacts set draft = null, status = 'published', review_note = null, updated_by = ${role}, updated_at = now() where id = ${id}`,
        db`insert into audit_log (artifact_id, action, actor) values (${id}, 'discard', ${role})`,
      ])
      return json(200, { id })
    }
    case 'DELETE /admin/artifacts/:id': {
      if (!can(role, 'curator')) return fail(403, 'Silme yalnız küratör içindir.')
      await db.transaction([
        db`delete from artifacts where id = ${id}`,
        db`insert into audit_log (artifact_id, action, actor) values (${id}, 'delete', ${role})`,
      ])
      return json(200, { id })
    }
  }
  return fail(404, 'Bulunamadı.')
}
