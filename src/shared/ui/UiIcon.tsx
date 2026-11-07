import type { ReactNode } from 'react'

/** Line icons of the interface (24 px grid, drawn with the current text colour). Decorative: always next to visible text or inside a labelled control. */
export type UiIconName = 'arch' | 'cube' | 'vase' | 'search' | 'back' | 'next' | 'down' | 'up' | 'x' | 'check' | 'vr' | 'door' | 'exit' | 'explode' | 'orbit' | 'reset' | 'full' | 'sliders' | 'zoom' | 'alert'

const paths: Record<UiIconName, ReactNode> = {
  'arch': <><path d="M5 21V11.5C5 7.5 8.5 5 12 3c3.5 2 7 4.5 7 8.5V21" /><path d="M3.5 21h17" /><path d="M9 21v-6.5c0-1.8 1.4-3.2 3-4 1.6.8 3 2.2 3 4V21" /></>,
  'cube': <><path d="M12 2.8 20 7.3v9.4L12 21.2 4 16.7V7.3z" /><path d="M4 7.3 12 12l8-4.7" /><path d="M12 12v9.2" /></>,
  'vase': <><path d="M9 3h6" /><path d="M10 3v2.5c0 1.2-3.5 2.8-3.5 7.5 0 3.6 1.7 6 2.6 8h5.8c.9-2 2.6-4.4 2.6-8 0-4.7-3.5-6.3-3.5-7.5V3" /><path d="M7 12.5h10" /></>,
  'search': <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  'back': <><path d="M15 5 8 12l7 7" /></>,
  'next': <><path d="m9 5 7 7-7 7" /></>,
  'down': <><path d="m6 9 6 6 6-6" /></>,
  'up': <><path d="m6 15 6-6 6 6" /></>,
  'x': <><path d="M6 6l12 12M18 6 6 18" /></>,
  'check': <><path d="m4.5 12.5 5 5 10-11" /></>,
  'vr': <><path d="M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5H15l-2-2.5h-2L9 17H5.5A2.5 2.5 0 0 1 3 14.5z" /></>,
  'door': <><path d="M6 21V8c0-3 2.7-5 6-5s6 2 6 5v13" /><path d="M3.5 21h17" /><path d="M12 11v5" /></>,
  'exit': <><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h9" /></>,
  'explode': <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><rect x="14" y="14" width="6.5" height="6.5" rx="1" /></>,
  'orbit': <><ellipse cx="12" cy="12" rx="9.5" ry="4" /><circle cx="12" cy="12" r="2.2" /><path d="m19 5.5 2 1.5-2.2 1" /></>,
  'reset': <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4v4.5H9" /></>,
  'full': <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
  'sliders': <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  'zoom': <><path d="M4 9V4h5M20 15v5h-5" /><path d="m4 4 6 6M20 20l-6-6" /></>,
  'alert': <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.2v.3" /></>,
}

export default function UiIcon({ name, className = 'icon' }: { name: UiIconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
