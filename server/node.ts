import type { IncomingMessage, ServerResponse } from 'node:http'
import { handle } from './handlers.js'

const MAX_BODY = 4_400_000 // bytes; under Vercel's 4.5 MB function body limit (image uploads are base64 JSON)

async function readBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || 'null') : req.body // already parsed by the host
  if (req.method === 'GET' || req.method === 'HEAD') return null
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY) throw Object.assign(new Error('İstek çok büyük.'), { status: 413 })
    chunks.push(chunk as Buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) : null
}

/** Node adapter used by both the Vercel function (api/handler.ts) and the Vite dev server (vite.config.ts). */
export async function nodeHandler(req: IncomingMessage & { body?: unknown }, res: ServerResponse, path: string): Promise<void> {
  const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
    res.statusCode = status
    for (const [k, v] of Object.entries({ 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...headers })) res.setHeader(k, v)
    res.end(body === undefined ? '' : JSON.stringify(body))
  }
  try {
    const method = req.method ?? 'GET'
    // Writes must be JSON: a plain HTML form from another site cannot send this content type (CSRF guard next to SameSite=Strict).
    if (!['GET', 'HEAD'].includes(method) && !String(req.headers['content-type'] ?? '').startsWith('application/json')) return send(415, { error: 'İçerik türü application/json olmalı.' })
    // GET query parameters reach the handler as the body object.
    const body = method === 'GET' ? Object.fromEntries(new URL(req.url ?? '/', 'http://local').searchParams) : await readBody(req)
    const secure = req.headers['x-forwarded-proto'] === 'https'
    const out = await handle({ method, path, body, cookie: req.headers.cookie, secure })
    send(out.status, out.body, out.headers)
  } catch (e) {
    const status = (e as { status?: number }).status ?? (e instanceof SyntaxError ? 400 : 500)
    if (status === 500) console.error('[api]', e)
    send(status, { error: status === 400 ? 'Geçersiz JSON.' : status === 413 ? 'İstek çok büyük.' : 'Sunucu hatası.' })
  }
}
