import { useEffect, useRef } from 'react'
import UiIcon from '../../../shared/ui/UiIcon'
import './mobileAr.css'

export interface MobileArOverlayProps {
  phase: 'placing' | 'placed'
  fragmented: boolean
  /** Parçala / Birleştir toggle */
  onShatter(): void
  /** Yeniden yerleştir */
  onReplace(): void
  /** AR'dan çık */
  onExit(): void
}

/**
 * Phone AR controls, drawn inside the WebXR dom-overlay root (the integrator wraps this in createPortal).
 * The wrapper ignores pointer events, so only the buttons and cards take touches. Each interactive element
 * handles `beforexrselect` (preventDefault + stopPropagation), so a tap on it does not also place or select in the scene.
 */
export default function MobileArOverlay({ phase, fragmented, onShatter, onReplace, onExit }: MobileArOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const handler = (e: Event) => { e.preventDefault(); e.stopPropagation() }
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-xr-ui]'))
    for (const t of targets) t.addEventListener('beforexrselect', handler)
    return () => { for (const t of targets) t.removeEventListener('beforexrselect', handler) }
  }, [phase])

  if (phase === 'placing') {
    return (
      <div ref={ref} className="mar" data-phase="placing">
        <p className="mar-card mar-hint" role="status" data-xr-ui>
          Telefonu masaya ya da yere doğrult. Halka çıkınca ekrana dokun.
        </p>
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
      <p className="mar-card mar-gesture" data-xr-ui>İki parmakla büyüt, çevirerek döndür.</p>
      <div className="mar-bar">
        <button type="button" className="mar-btn mar-primary" onClick={onShatter} aria-pressed={fragmented} data-xr-ui>
          <UiIcon name="explode" /> {fragmented ? 'Birleştir' : 'Parçala'}
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
