import type { Artifact } from './artifact'
import { TYPE_KEYS } from './artifactTypes.js'

export type Errors = Record<string, string>
/** Upper text lengths; the longest built-in values are well below these (history ~4500). Checked in the form and again on the server. */
export const LIMITS = { name: 160, city: 60, district: 80, period: 400, endowment: 400, summary: 800, history: 16000 } as const
export const maybeSourced = (artifact: Artifact) => artifact.sources.some(k => k.text.trim()) &&
  [...artifact.test, ...artifact.hotspots].every(n => artifact.sources.some(k => k.id === n.sourceId && k.text.trim()))

export function imageUrlValid(address: string): boolean {
  if (/^\/(?!\/)[^\s\\]*$/.test(address)) return true
  try { const url = new URL(address); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password }
  catch { return false }
}

export function artifactErrors(artifact: Artifact): Errors {
  const errors: Errors = {}
  const required = (id: string, value: string) => { if (!value.trim()) errors[id] = 'Bu alan zorunludur.' }
  for (const area of ['name', 'city', 'district', 'period', 'endowment', 'summary', 'history'] as const) required(area, artifact[area])
  for (const [area, max] of Object.entries(LIMITS)) { const v = artifact[area as keyof typeof LIMITS]; if (typeof v === 'string' && v.length > max) errors[area] = `En fazla ${max} karakter.` }
  const tooMany = (key: string, n: number, max: number) => { if (n > max) errors[key] = `En fazla ${max} kayıt eklenebilir.` }
  tooMany('sources', artifact.sources.length, 60); tooMany('images', artifact.images.length, 60); tooMany('hotspots', artifact.hotspots.length, 60)
  if (artifact.types !== undefined && (!artifact.types.length || artifact.types.some(t => !TYPE_KEYS.includes(t)))) errors.types = 'En az bir geçerli tür seçin.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artifact.id)) errors.name = 'Ad, geçerli bir eser kimliği üretmelidir.'
  const sourceIds = artifact.sources.map(k => k.id)
  artifact.sources.forEach((k, i) => {
    required(`source-${i}-text`, k.text)
    if (!k.id || sourceIds.indexOf(k.id) !== i) errors[`source-${i}-text`] = 'Kaynak kimliği boş veya tekrarlı.'
  })
  if (artifact.test.length !== 3) errors.test = 'Tam üç soru gereklidir.'
  artifact.test.forEach((s, i) => {
    required(`test-${i}-question`, s.question)
    required(`test-${i}-description`, s.description)
    if (s.options.length !== 4) errors[`test-${i}-question`] = 'Dört seçenek gereklidir.'
    s.options.forEach((v, j) => required(`test-${i}-option-${j}`, v))
    if (!Number.isInteger(s.correct) || s.correct < 0 || s.correct > 3) errors[`test-${i}-correct`] = 'Doğru seçeneği seçin.'
    if (s.sourceId && !sourceIds.includes(s.sourceId)) errors[`test-${i}-source-id`] = 'Geçerli bir kaynak seçin veya kaynağı kaldırın.'
  })
  artifact.images.forEach((g, i) => {
    if (!imageUrlValid(g.file)) errors[`image-${i}-file`] = 'Yerel /images/... yolu veya http/https URL girin.'
    if (artifact.images.findIndex(x => x.file === g.file) !== i) errors[`image-${i}-file`] = 'Bu görsel zaten eklenmiş.'
    required(`image-${i}-alt`, g.alt)
    // Uploaded photos must say whose they are and under which permission (photo licences are an open issue).
    if (g.file.startsWith('/api/media/') && !g.credit?.trim()) errors[`image-${i}-credit`] = 'Yüklenen görsel için künye ve kullanım izni zorunludur.'
    if (g.sourceId && !sourceIds.includes(g.sourceId)) errors[`image-${i}-source-id`] = 'Geçerli bir kaynak seçin veya kaynağı kaldırın.'
  })
  if ((artifact.images.length > 0 || artifact.coverImage) && !artifact.images.some(g => g.file === artifact.coverImage)) errors.coverImage = 'Galeriden bir kapak görseli seçin.'
  artifact.hotspots.forEach((n, i) => {
    required(`point-${i}-title`, n.title)
    required(`point-${i}-text`, n.text)
    if (!n.id || artifact.hotspots.findIndex(x => x.id === n.id) !== i) errors[`point-${i}-title`] = 'Bilgi noktası kimliği boş veya tekrarlı.'
    if (n.image && !artifact.images.some(g => g.file === n.image)) errors[`point-${i}-image`] = 'Galeriden bir görsel seçin.'
    for (const axis of ['x', 'y'] as const) if (!Number.isFinite(n[axis]) || n[axis] < 0 || n[axis] > 100) errors[`point-${i}-${axis}`] = '0 ile 100 arasında sayı girin.'
    if (n.sourceId && !sourceIds.includes(n.sourceId)) errors[`point-${i}-source-id`] = 'Geçerli bir kaynak seçin veya kaynağı kaldırın.'
  })
  return errors
}

// Objects from JSON are checked structurally and semantically before they reach React.
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const texts = (v: Record<string, unknown>, areas: string[]) => areas.every(a => typeof v[a] === 'string')
const list = (v: unknown, control: (n: Record<string, unknown>) => boolean): boolean => Array.isArray(v) && v.every(n => obj(n) && control(n))
const optionalText = (v: Record<string, unknown>, a: string) => v[a] === undefined || typeof v[a] === 'string'
export function artifactValid(v: unknown): v is Artifact {
  if (!obj(v) || !texts(v, ['id', 'name', 'city', 'district', 'period', 'endowment', 'summary', 'history', 'coverImage']) || !['illustrative', 'verified'].includes(String(v.verification))) return false
  if (v.types !== undefined && !(Array.isArray(v.types) && v.types.every(t => typeof t === 'string'))) return false
  if (!list(v.sources, n => texts(n, ['id', 'text']) && optionalText(n, 'page')) ||
    !list(v.images, n => texts(n, ['file', 'alt', 'sourceId']) && optionalText(n, 'description') && optionalText(n, 'credit')) ||
    !list(v.test, n => texts(n, ['question', 'description', 'sourceId']) && Array.isArray(n.options) && n.options.every(s => typeof s === 'string') && typeof n.correct === 'number') ||
    !list(v.hotspots, n => texts(n, ['id', 'image', 'title', 'text', 'sourceId']) && typeof n.x === 'number' && typeof n.y === 'number')) return false
  if (v.tour !== undefined && (!obj(v.tour) || !texts(v.tour, ['description']) || !optionalText(v.tour, 'start_') || !list(v.tour.stops, n => texts(n, ['id', 'title', 'image', 'depth', 'text']) && optionalText(n, 'sourceId') && list(n.links, b => texts(b, ['target', 'label']))))) return false
  if (v.tour360 !== undefined && (!obj(v.tour360) || !texts(v.tour360, ['provider', 'embedUrl', 'sourceUrl', 'description']) || !String(v.tour360.embedUrl).startsWith('https://') || !String(v.tour360.sourceUrl).startsWith('https://'))) return false
  return Object.keys(artifactErrors(v as unknown as Artifact)).length === 0
}

export function artifactId(name: string): string {
  return name.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
export function uniqueId(foundation: string, existing: string[]): string {
  let id = foundation, row = 2
  while (existing.includes(id)) id = `${foundation}-${row++}`
  return id
}
