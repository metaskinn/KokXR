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
  /** Turn buttons: -1 left, +1 right (one step per tap). */
  onTurn?(dir: -1 | 1): void
}

/**
 * Phone AR controls, drawn inside the WebXR dom-overlay root (the integrator wraps this in createPortal).
 * The wrapper ignores pointer events, so only the buttons and cards take touches. Each interactive element
 * handles `beforexrselect` (preventDefault + stopPropagation), so a tap on it does not also place or select in the scene.
 */
export default function MobileArOverlay({ phase, fragmented, onShatter, onReplace, onExit, onTurn }: MobileArOverlayProps) {
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
        <p className="mar-card mar-hint" role="status">
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
      <p className="mar-card mar-gesture">Tek parmakla sağa sola sürükle: döndür. İki parmakla: büyüt ya da kaydır.</p>
      <div className="mar-bottom">
      {onTurn && <div className="mar-turn">
        <button type="button" className="mar-btn mar-round" onClick={() => onTurn(-1)} aria-label="Sola döndür" data-xr-ui><UiIcon name="back" /></button>
        <button type="button" className="mar-btn mar-round" onClick={() => onTurn(1)} aria-label="Sağa döndür" data-xr-ui><UiIcon name="next" /></button>
      </div>}
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
    </div>
  )
}
