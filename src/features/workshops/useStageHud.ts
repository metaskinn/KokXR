import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Safe rectangle insets in CSS pixels: the part of the stage that the HUD and the stage title cover. */
export interface SafeInsets { top: number; right: number; bottom: number; left: number }
export const noInsets: SafeInsets = { top: 0, right: 0, bottom: 0, left: 0 }

const KEY = 'kokxr-hud-open'
const phone = () => typeof matchMedia === 'function' && matchMedia('(max-width: 600px)').matches

/** Open/closed state of the stage HUD: closed on phones, open on desktop the first time; remembered when storage works. */
export function useHudOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(() => {
    try { const v = localStorage.getItem(KEY); if (v === '1' || v === '0') return v === '1' } catch { /* storage unavailable */ }
    return !phone()
  })
  const toggle = useCallback(() => setOpen((previous) => {
    try { localStorage.setItem(KEY, previous ? '0' : '1') } catch { /* storage unavailable */ }
    return !previous
  }), [])
  return [open, toggle]
}

/**
 * Measures how much of the stage the floating HUD (right rail or bottom strip) and the stage title cover,
 * and passes it to the scene so the camera frames the model in the remaining rectangle.
 */
export function useSafeInsets(stage: RefObject<HTMLElement | null>, hud: RefObject<HTMLElement | null>, title: RefObject<HTMLElement | null>, apply: (insets: SafeInsets) => void, ready: boolean, layoutKey: string) {
  const applyRef = useRef(apply)
  useEffect(() => { applyRef.current = apply })
  useEffect(() => {
    const box = stage.current
    if (!box || !ready) return
    const gap = 8
    let last = ''
    const measure = () => {
      const s = box.getBoundingClientRect()
      if (!s.width || !s.height) return
      const insets = { ...noInsets }
      const h = hud.current?.getBoundingClientRect()
      if (h && h.width && h.height) {
        // Right rail (desktop) when it sits in the upper right part; otherwise a bottom strip (phone, Quest).
        const rail = h.left - s.left > s.width * 0.4 && h.top - s.top < s.height * 0.4
        if (rail) insets.right = Math.max(0, s.right - h.left + gap)
        else insets.bottom = Math.max(0, s.bottom - h.top + gap)
      }
      const t = title.current?.getBoundingClientRect()
      if (t && t.height) insets.top = Math.max(0, t.bottom - s.top + gap)
      // Never leave the model less than half of the stage.
      insets.right = Math.min(insets.right, s.width * 0.5)
      insets.top = Math.min(insets.top, s.height * 0.25)
      insets.bottom = Math.min(insets.bottom, s.height * 0.4)
      const key = `${insets.top},${insets.right},${insets.bottom},${insets.left}`
      if (key === last) return
      last = key
      applyRef.current(insets)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    if (hud.current) observer.observe(hud.current)
    if (title.current) observer.observe(title.current)
    measure()
    return () => observer.disconnect()
  }, [ready, layoutKey, stage, hud, title])
}
