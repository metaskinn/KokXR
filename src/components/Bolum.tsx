import { useEffect, useState, type ReactNode } from 'react'

/** Başlığı tıklanınca açılıp kapanan sayfa bölümü. İçerik kapalıyken de bağlı kalır; sahne ve galeri durumu korunur.
 *  Bölüme giden `#id` bağlantısı tıklanınca bölüm kendiliğinden açılır. */
export default function Bolum({ id, baslik, className = '', eylem, children }: {
  id: string; baslik: ReactNode; className?: string; eylem?: ReactNode; children: ReactNode
}) {
  const [acik, setAcik] = useState(true)
  useEffect(() => {
    const hedefMi = () => location.hash === `#${id}`
    const hashDegisti = () => { if (hedefMi()) setAcik(true) }
    const tiklandi = (e: MouseEvent) => { if ((e.target as Element | null)?.closest?.(`a[href="#${id}"]`)) setAcik(true) }
    if (hedefMi()) setAcik(true)
    window.addEventListener('hashchange', hashDegisti)
    document.addEventListener('click', tiklandi, true)
    return () => { window.removeEventListener('hashchange', hashDegisti); document.removeEventListener('click', tiklandi, true) }
  }, [id])
  return <section className={`bolum acilir-bolum ${className}`.trim()} aria-labelledby={id}>
    <div className="bolum-baslik-satiri">
      <h2 id={id}><button type="button" className="bolum-ac" aria-expanded={acik} aria-controls={`${id}-icerik`} onClick={() => setAcik(!acik)}><span>{baslik}</span><span className="bolum-ac-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span></button></h2>
      {acik && eylem}
    </div>
    <div id={`${id}-icerik`} className="bolum-icerik" hidden={!acik}>{children}</div>
  </section>
}
