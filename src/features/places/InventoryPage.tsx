import { Navigate, useParams } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import NotFound from '../../shared/ui/NotFound'
import { inventory } from '../../content/inventory'

/** Old inventory address (/places/yapi/:id). Every inventory row has an artifact page, so the address always redirects to it. */
export default function InventoryPage({ artifacts }: { artifacts: Artifact[] }) {
  const { id } = useParams()
  const item = inventory.find((e) => e.id === id)
  const full = item && (artifacts.find((a) => a.id === item.artifactId) ?? artifacts.find((a) => a.inventoryId === item.id))
  if (!full) return <NotFound />
  return <Navigate to={`/artifact/${full.id}`} replace />
}
