import { useOutletContext } from 'react-router-dom'
import type { Artifact } from '../../domain/artifact'
import type { Role } from '../../infrastructure/api'

export interface AdminContext { role: Role; logout: () => void; onPublished: () => void; artifacts: Artifact[]; pendingCount: number; refreshPending: () => void }
export const useAdmin = () => useOutletContext<AdminContext>()
