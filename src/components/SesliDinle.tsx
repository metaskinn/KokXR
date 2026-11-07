import { useEffect, useState } from 'react'

// Tarayıcının kendi sesli okuyucusunu kullanır (yeni bağımlılık yok). Desteklenmiyorsa düğme gösterilmez.
export default function SesliDinle({ metin }: { metin: string }) {
  const destek = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [okuyor, setOkuyor] = useState(false)
  useEffect(() => () => { if (destek) window.speechSynthesis.cancel() }, [destek, metin])
  if (!destek) return null
  function degistir() {
    if (okuyor) { window.speechSynthesis.cancel(); setOkuyor(false); return }
    const soz = new SpeechSynthesisUtterance(metin)
    soz.lang = 'tr-TR'
    soz.onend = soz.onerror = () => setOkuyor(false)
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(soz); setOkuyor(true)
  }
  return <button type="button" className="sesli-dinle" aria-pressed={okuyor} onClick={degistir}>{okuyor ? 'Okumayı durdur' : 'Sesli dinle'}</button>
}
