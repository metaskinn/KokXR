import { useEffect, useState } from 'react'

const anahtar = 'kokxr-erisilebilirlik'
const boyutlar = [100, 112, 125, 150]
interface Ayar { boyut: number; kontrast: boolean }

function oku(): Ayar {
  try {
    const v = JSON.parse(localStorage.getItem(anahtar) ?? '{}') as Partial<Ayar>
    return { boyut: boyutlar.includes(v.boyut ?? 0) ? v.boyut! : 100, kontrast: v.kontrast === true }
  } catch { return { boyut: 100, kontrast: false } }
}

export default function ErisilebilirlikAraci() {
  const [ayar, setAyar] = useState(oku)
  useEffect(() => {
    document.documentElement.style.fontSize = ayar.boyut === 100 ? '' : `${ayar.boyut}%`
    if (ayar.kontrast) document.documentElement.dataset.kontrast = 'yuksek'; else delete document.documentElement.dataset.kontrast
    try { localStorage.setItem(anahtar, JSON.stringify(ayar)) } catch { /* depolama kapalıysa ayar yalnız bu oturumda geçerli */ }
  }, [ayar])
  const sira = boyutlar.indexOf(ayar.boyut)
  return <div className="erisilebilirlik-araci" role="group" aria-label="Görünüm ayarları">
    <button type="button" aria-label="Yazıyı küçült" disabled={sira === 0} onClick={() => setAyar({ ...ayar, boyut: boyutlar[sira - 1] })}>A−</button>
    <button type="button" aria-label="Yazıyı büyüt" disabled={sira === boyutlar.length - 1} onClick={() => setAyar({ ...ayar, boyut: boyutlar[sira + 1] })}>A+</button>
    <button type="button" aria-pressed={ayar.kontrast} onClick={() => setAyar({ ...ayar, kontrast: !ayar.kontrast })}>Yüksek kontrast</button>
  </div>
}
