import type { ReactNode } from 'react'

/** Page section with a level-2 heading. `id` is the heading's id, so `#id` links land on it. Sections do not collapse. */
export default function Section({ id, title, className = '', action, children }: {
  id: string; title: ReactNode; className?: string; action?: ReactNode; children: ReactNode
}) {
  return <section className={`section ${className}`.trim()} aria-labelledby={id}>
    {action ? <div className="section-title-row"><h2 id={id}>{title}</h2>{action}</div> : <h2 id={id}>{title}</h2>}
    {children}
  </section>
}
