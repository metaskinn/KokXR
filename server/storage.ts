import { Files } from 'files-sdk'
import { neon } from 'files-sdk/neon'

let client: Files | undefined

/** Private "uploads" bucket (Neon Object Storage); credentials come from the AWS_* variables neon deploy writes. */
export function bucket(): Files {
  client ??= new Files({ adapter: neon({ bucket: 'uploads' }) })
  return client
}

export const MEDIA_PREFIX = '/api/media/'
/** Bucket keys the API serves: images/<artifact-id>/<file>. No "..", no leading slash. */
export const MEDIA_KEY = /^images\/[a-z0-9]+(?:-[a-z0-9]+)*\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)?$/

/** Image type from the file's first bytes; the declared content type is not trusted. */
export function sniffImage(bytes: Uint8Array): { type: string; ext: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { type: 'image/png', ext: 'png' }
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return { type: 'image/webp', ext: 'webp' }
  return null
}
