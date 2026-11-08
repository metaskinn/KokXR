import type { Source } from '../../domain/artifact'
import { sourceLinkInfo } from '../../content/inventoryBooks'

export function sourceText(source: Source) {
  return `${source.text}${source.page ? `, s. ${source.page}` : ''}`
}

/** "Kitapta aç" (book PDF at the cited page) or "Kaynağa git" (the source's own address); nothing without a link. */
export function SourceLink({ source }: { source: Source }) {
  const link = sourceLinkInfo(source)
  if (!link) return null
  return <a className="source-link" href={link.href} target="_blank" rel="noreferrer">
    {link.kind === 'book' && <span className="file-mark" aria-hidden="true">PDF</span>}
    {link.kind === 'book' ? `Kitapta aç${link.page ? `, s. ${link.page}` : ''}` : 'Kaynağa git'}
    <span className="invisible"> ({link.kind === 'book' ? 'PDF, ' : ''}yeni sekmede açılır)</span>
  </a>
}

export default function SourceLine({ sources, sourceId }: { sources: Source[]; sourceId: string }) {
  const source = sources.find((item) => item.id === sourceId)
  return <p className="source">Kaynak: {source ? sourceText(source) : 'Kaynak bilgisi bulunamadı.'}</p>
}
