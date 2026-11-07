import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import BulutPaneli from './BulutPaneli'
import type { YonetimProps } from '../pages/Yonetim'
import { bulutHazir } from '../data/bulut'

// Bulut kurulu ve erişilebilirse yönetim giriş ister; değilse yerel kayıtla açık kalır (demo kırılmaz).
export default function YonetimKapisi({ children, ...props }: YonetimProps & { children: ReactNode }) {
  const [durum, setDurum] = useState<'bakiliyor' | 'serbest' | 'giris'>('bakiliyor')
  const [hazir, setHazir] = useState(false)
  useEffect(() => { void bulutHazir().then((h) => { setHazir(h); if (!h) setDurum('serbest') }) }, [])
  const girisDegisti = useCallback((eposta: string) => setDurum(eposta ? 'serbest' : 'giris'), [])
  if (durum === 'bakiliyor' && !hazir) return <section className="sayfa yonetim"><h1>İçerik yönetimi</h1><p role="status">Bağlantı denetleniyor…</p></section>
  if (durum === 'serbest') return <>{children}</>
  return <section className="sayfa yonetim"><h1>Yönetim girişi</h1><p>Eser eklemek ve düzenlemek için giriş yapın.</p><BulutPaneli {...props} girisDegisti={girisDegisti} /></section>
}
