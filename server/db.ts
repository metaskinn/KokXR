import { neon } from '@neondatabase/serverless'
import type { NeonQueryFunction } from '@neondatabase/serverless'

type Sql = NeonQueryFunction<false, false>
let client: Sql | undefined

/** Neon HTTP driver: one-shot queries suit stateless serverless functions. Uses the pooled DATABASE_URL. */
export function sql(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set.')
    client = neon(url)
  }
  return client
}
