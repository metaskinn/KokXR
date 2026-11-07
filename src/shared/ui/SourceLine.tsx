import type { Source } from '../../domain/artifact'

export function sourceText(source: Source) {
  return `${source.text}${source.page ? `, s. ${source.page}` : ''}`
}

export default function SourceLine({ sources, sourceId }: { sources: Source[]; sourceId: string }) {
  const source = sources.find((item) => item.id === sourceId)
  return <p className="source">Kaynak: {source ? sourceText(source) : 'Kaynak bilgisi bulunamadı.'}</p>
}
