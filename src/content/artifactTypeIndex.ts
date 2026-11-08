import type { Artifact } from '../domain/artifact'
import typeData from './artifact-types.json'

const generated = typeData as Record<string, string[]>

/** Types of an artifact: its own `types` (set in the admin form) first, then the generated list, else "Diğer". */
export function typesOf(a: Artifact): string[] {
  if (a.types?.length) return a.types
  return generated[a.id]?.length ? generated[a.id] : ['diger']
}
