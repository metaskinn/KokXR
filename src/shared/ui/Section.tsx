import { useEffect, useState, type ReactNode } from 'react'

/** Başlığı tıklanınca açılıp kapanan sayfa bölümü. İçerik kapalıyken de bağlı kalır; sahne ve galeri durumu korunur.
 *  Bölüme giden `#id` bağlantısı tıklanınca bölüm kendiliğinden açılır. */
export default function Section({ id, title, className = '', action, children }: {
  id: string; title: ReactNode; className?: string; action?: ReactNode; children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const isTarget = () => location.hash === `#${id}`
    const hashChanged = () => { if (isTarget()) setOpen(true) }
    const clicked = (e: MouseEvent) => { if ((e.target as Element | null)?.closest?.(`a[href="#${id}"]`)) setOpen(true) }
    if (isTarget()) setOpen(true)
    window.addEventListener('hashchange', hashChanged)
    document.addEventListener('click', clicked, true)
    return () => { window.removeEventListener('hashchange', hashChanged); document.removeEventListener('click', clicked, true) }
  }, [id])
  return <section className={`section collapsible-section ${className}`.trim()} aria-labelledby={id}>
    <div className="section-title-row">
      <h2 id={id}><button type="button" className="section-ac" aria-expanded={open} aria-controls={`${id}-content`} onClick={() => setOpen(!open)}><span>{title}</span><span className="section-ac-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span></button></h2>
      {open && action}
    </div>
    <div id={`${id}-content`} className="section-content" hidden={!open}>{children}</div>
  </section>
}
