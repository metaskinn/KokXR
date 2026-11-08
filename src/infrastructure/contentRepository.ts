import type { Artifact } from '../domain/artifact'
import { PUBLIC_BUILD } from '../shared/config/publicBuild'

// Bundled copy of the published content: shown at once and kept as the offline fallback.
// The live source is the database (GET /api/artifacts); App replaces this list when the API answers.
const artifactFiles = import.meta.glob<Artifact>('../content/artifacts/*.json', { eager: true, import: 'default' })

const withoutPhoto = (e: Artifact): Artifact => ({
  ...e, coverImage: '', images: [], tour: undefined,
  hotspots: e.hotspots.map((b) => ({ ...b, image: '' })),
  model: e.model && { ...e.model, description: e.model.description.replace(/Levha ve paye yazıları[^.]*\./, 'Levha ve paye yüzeyleri bu sürümde yazısız bırakılmıştır.') },
})

/** The public build never shows archive photos, whatever the source. */
export const forThisBuild = (list: Artifact[]): Artifact[] => PUBLIC_BUILD ? list.map(withoutPhoto) : list

/** Content from the API points its photos at the private bucket (/api/media/<key> → presigned URL). */
export const fromBucket = (list: Artifact[]): Artifact[] => JSON.parse(JSON.stringify(list).replaceAll('"/images/', '"/api/media/images/'))

export const bundledArtifacts: Artifact[] = forThisBuild(Object.values(artifactFiles))
