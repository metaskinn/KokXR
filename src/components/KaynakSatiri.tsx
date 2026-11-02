import type { Kaynak } from '../types/eser'

export function kaynakMetni(kaynak: Kaynak) {
  return `${kaynak.metin}${kaynak.sayfa ? `, s. ${kaynak.sayfa}` : ''}`
}

export default function KaynakSatiri({ kaynaklar, kaynakId }: { kaynaklar: Kaynak[]; kaynakId: string }) {
  const kaynak = kaynaklar.find((item) => item.id === kaynakId)
  return <p className="kaynak">Kaynak: {kaynak ? kaynakMetni(kaynak) : 'Kaynak bilgisi bulunamadı.'}</p>
}
