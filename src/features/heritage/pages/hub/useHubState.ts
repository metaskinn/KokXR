import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom'
import { noFilters, type Filters } from './hubData'

export const PAGE = 48

/** All list state lives in the URL: q, sehir, ilce, tur, maket=1, n (number of shown items). */
export function useHubState() {
  const [params, setParams] = useSearchParams()
  const filters: Filters = useMemo(() => ({
    q: params.get('q') ?? '',
    city: params.get('sehir') ?? '',
    district: params.get('ilce') ?? '',
    type: params.get('tur') ?? '',
    model: params.get('maket') === '1',
  }), [params])
  const shown = Math.max(PAGE, Number(params.get('n')) || PAGE)

  /** Filter changes open a new history entry; typing and "show more" replace the current one. */
  const update = useCallback((patch: Partial<Filters>, { replace = false, n }: { replace?: boolean; n?: number } = {}) => {
    setParams((prev) => {
      const cur: Filters = {
        q: prev.get('q') ?? '', city: prev.get('sehir') ?? '', district: prev.get('ilce') ?? '',
        type: prev.get('tur') ?? '', model: prev.get('maket') === '1',
      }
      const next = { ...cur, ...patch }
      const out = new URLSearchParams()
      if (next.q) out.set('q', next.q)
      if (next.city) out.set('sehir', next.city)
      if (next.district) out.set('ilce', next.district)
      if (next.type) out.set('tur', next.type)
      if (next.model) out.set('maket', '1')
      if (n && n > PAGE) out.set('n', String(n))
      return out
    }, { replace })
  }, [setParams])
  const clear = useCallback(() => update(noFilters), [update])
  return { filters, shown, update, clear }
}

const key = (loc: { pathname: string; search: string }) => `scroll:${loc.pathname}${loc.search}`

/** Saves the scroll position before an artifact opens and restores it when the user comes back (POP). */
export function useScrollMemory(ready: boolean) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const restored = useRef(false)
  const save = useCallback(() => {
    try { sessionStorage.setItem(key(location), String(Math.round(window.scrollY))) } catch { /* storage blocked: the page opens at the top */ }
  }, [location])
  useLayoutEffect(() => {
    if (restored.current || !ready) return
    restored.current = true
    if (navigationType !== 'POP') return
    let y: number | null = null
    try { const v = sessionStorage.getItem(key(location)); y = v === null ? null : Number(v) } catch { /* ignore */ }
    if (y !== null && Number.isFinite(y)) window.scrollTo(0, y)
  }, [ready, navigationType, location])
  return save
}

/** The "/" key focuses the search field unless the user is already typing somewhere. */
export function useSlashFocus(target: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      e.preventDefault()
      target.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target])
}
