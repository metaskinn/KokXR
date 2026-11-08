import { createHmac, timingSafeEqual } from 'node:crypto'

/** editor: adds and edits (changes wait for approval). curator: also approves, rejects and deletes. */
export type Role = 'editor' | 'curator'

const COOKIE = 'kokxr_session'
const MAX_AGE = 8 * 60 * 60 // seconds

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET is missing or shorter than 32 characters.')
  return s
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Which role a password belongs to; passwords come only from environment variables. */
export function roleForPassword(password: string): Role | null {
  const curator = process.env.ADMIN_PASSWORD, editor = process.env.EDITOR_PASSWORD
  if (curator && sameText(password, curator)) return 'curator'
  if (editor && sameText(password, editor)) return 'editor'
  return null
}

/** Stateless signed session: "role.expiry.signature". */
export function sessionCookie(role: Role, secure: boolean): string {
  const payload = `${role}.${Math.floor(Date.now() / 1000) + MAX_AGE}`
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${secure ? '; Secure' : ''}`
}

export function clearCookie(secure: boolean): string {
  return `${COOKIE}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`
}

export function roleFromCookie(header: string | undefined): Role | null {
  const raw = header?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  if (!raw) return null
  const [role, expiry, signature] = raw.split('.')
  if (!role || !expiry || !signature || (role !== 'editor' && role !== 'curator')) return null
  if (!sameText(signature, sign(`${role}.${expiry}`))) return null
  if (Number(expiry) < Date.now() / 1000) return null
  return role
}
