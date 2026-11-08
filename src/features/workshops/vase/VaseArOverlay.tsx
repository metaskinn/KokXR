import { useEffect, useRef } from 'react'
import UiIcon from '../../../shared/ui/UiIcon'
import type { VaseMobileState } from './vaseXr'
import '../../scale-models/mobileAr/mobileAr.css'

export interface VaseArOverlayProps {
  state: VaseMobileState
  /** Vazoyu parçala / Yeniden başlat / Yeniden parçala */
  onAction(): void
  onReplace(): void
  onExit(): void
}

/**
 * Phone AR controls for the vase workshop, drawn inside the WebXR dom-overlay root (the page portals the root to body).
 * Same glass style as the scale models' MobileArOverlay; its texts follow the repair game instead of Parçala/Birleştir.
 * Buttons handle `beforexrselect`, so a tap on them neither places the turntable nor reaches the scene.
 */
export default function VaseArOverlay({ state, onAction, onReplace, onExit }: VaseArOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const handler = (e: Event) => { e.preventDefault(); e.stopPropagation() }
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-xr-ui]'))
    for (const t of targets) t.addEventListener('beforexrselect', handler)
    return () => { for (const t of targets) t.removeEventListener('beforexrselect', handler) }
  }, [state.placing])

  if (state.placing) {
    return (
      <div ref={ref} className="mar" data-phase="placing">
        <p className="mar-card mar-hint" role="status">Telefonu masaya doğrult. Halka çıkınca ekrana dokun.</p>
        <div className="mar-bar">
          <button type="button" className="mar-btn" onClick={onExit} data-xr-ui>
            <UiIcon name="exit" /> AR'dan çık
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="mar" data-phase="placed">
      <p className="mar-card mar-gesture" role="status">
        {state.phase === 'repair' && <><strong>{state.progress}</strong><br /></>}
        {state.hint}
      </p>
      <div className="mar-bar">
        <button type="button" className="mar-btn mar-primary" onClick={onAction} data-xr-ui>
          <UiIcon name="explode" /> {state.action}
        </button>
        <button type="button" className="mar-btn" onClick={onReplace} data-xr-ui>
          <UiIcon name="reset" /> Yeniden yerleştir
        </button>
        <button type="button" className="mar-btn" onClick={onExit} data-xr-ui>
          <UiIcon name="exit" /> AR'dan çık
        </button>
      </div>
    </div>
  )
}
