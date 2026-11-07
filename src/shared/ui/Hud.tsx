import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react'
import UiIcon from './UiIcon'
import type { UiIconName } from './UiIcon'
import './stage-hud.css'

/** Pixels of the stage the HUD covers, per edge. A scene passes them to `setSafeInsets` so the model is never under the glass. */
export interface HudInsets { top: number; right: number; bottom: number; left: number }

const PHONE = '(max-width: 600px)'
const readStored = (key: string): boolean | null => {
  try {
    const v = localStorage.getItem(key)
    return v === 'true' ? true : v === 'false' ? false : null
  } catch { return null }
}

/** Open/closed state of a HUD. First visit: closed on phones, open on wider screens and on Quest; the choice is remembered per screen class. */
export function useHudOpen(key = 'kokxr-hud') {
  const phone = () => matchMedia(PHONE).matches && document.documentElement.dataset.xr !== 'yes'
  const storageKey = () => `${key}-${phone() ? 'phone' : 'wide'}`
  const [open, setOpenState] = useState(() => readStored(storageKey()) ?? !phone())
  useEffect(() => {
    const media = matchMedia(PHONE)
    const change = () => setOpenState(readStored(storageKey()) ?? !phone())
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const setOpen = useCallback((value: boolean) => {
    setOpenState(value)
    try { localStorage.setItem(storageKey(), String(value)) } catch { /* private window: keep it in memory only */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return [open, setOpen] as const
}

/** Measures what the HUD covers inside the stage and reports it; also sets `--hud-block` / `--hud-inline` on the stage for overlays (walking pad). */
export function useHudInsets(stage: RefObject<HTMLElement | null>, hud: RefObject<HTMLElement | null>, changed: (insets: HudInsets) => void, active = true) {
  useLayoutEffect(() => {
    const s = stage.current, h = hud.current
    if (!s || !active) return
    const GAP = 8
    const measure = () => {
      const hudBox = hud.current
      const insets: HudInsets = { top: 0, right: 0, bottom: 0, left: 0 }
      if (hudBox && hudBox.offsetParent) {
        const a = s.getBoundingClientRect(), b = hudBox.getBoundingClientRect()
        // A strip spanning most of the width covers the bottom; a narrow rail covers the right edge.
        if (b.width >= a.width * 0.5) insets.bottom = Math.max(0, a.bottom - b.top + GAP)
        else insets.right = Math.max(0, a.right - b.left + GAP)
      }
      s.style.setProperty('--hud-block', `${insets.bottom}px`)
      s.style.setProperty('--hud-inline', `${insets.right}px`)
      changed(insets)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(s)
    if (h) observer.observe(h)
    return () => observer.disconnect()
  }, [stage, hud, changed, active])
}

type HudButtonProps = ComponentPropsWithRef<'button'> & {
  icon: UiIconName
  /** Full label: visible in the open desktop panel and always the accessible name. */
  label: string
  /** Short label for the phone strip, the closed rail and Quest. Must be a word of `label`. */
  short?: string
}

/** HUD button: SVG icon and a visible text label; never a glyph on its own. */
export function HudButton({ icon, label, short, ...rest }: HudButtonProps) {
  return <button type="button" aria-label={short && short !== label ? label : undefined} {...rest}>
    <UiIcon name={icon} />
    {short && short !== label
      ? <><span className="hud-label-short">{short}</span><span className="hud-label-long">{label}</span></>
      : <span>{label}</span>}
  </button>
}

/**
 * Floating, translucent, collapsible control panel over a 3D stage (`.stage`).
 * Phone: bottom strip, `primary` + "Kontroller"; desktop: right rail; Quest: bottom centre, 56 px targets.
 * `children` are the secondary controls (`.hud-more`); `extra` is an always-visible row (e.g. interior stops).
 * `groupClassName` goes on the control groups only, not on the toggle (tests look for `.model-control button`).
 */
export default function Hud({ label, primary, children, extra, footer, open, setOpen, hudRef, groupClassName = '', className = '', id }: {
  label: string
  primary?: ReactNode
  children?: ReactNode
  extra?: ReactNode
  footer?: ReactNode
  open: boolean
  setOpen: (open: boolean) => void
  hudRef?: RefObject<HTMLDivElement | null>
  groupClassName?: string
  className?: string
  id: string
}) {
  return <div ref={hudRef} className={`hud glass ${className}`.trim()} role="toolbar" aria-label={label} data-open={String(open)}
    onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
    <div className="hud-main">
      <div className={`hud-actions ${groupClassName}`.trim()}>{primary}</div>
      {children && <button type="button" className="hud-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <UiIcon name="up" />
        <span className="hud-label-short">{open ? 'Gizle' : 'Kontroller'}</span>
        <span className="hud-label-long">{open ? 'Kontrolleri gizle' : 'Kontrolleri göster'}</span>
      </button>}
    </div>
    {extra && <div className={`hud-extra ${groupClassName}`.trim()}>{extra}</div>}
    {children && <div className={`hud-more ${groupClassName}`.trim()} id={id}>{children}</div>}
    {footer}
  </div>
}
