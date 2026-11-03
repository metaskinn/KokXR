import { useEffect, useRef, useState } from 'react'
import type { Durak, Kaynak, Tur } from '../types/eser'
import type { Sahne } from './gezinti/sahne'
import KaynakSatiri from './KaynakSatiri'

type EğimIzni = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }

export default function SanalGezinti({ tur, kaynaklar }: { tur: Tur; kaynaklar: Kaynak[] }) {
  const ilk = tur.duraklar.find((item) => item.id === tur.baslangic) ?? tur.duraklar[0]
  const [durak, setDurak] = useState(ilk)
  const [basladi, setBasladi] = useState(false)
  const [ziyaretler, setZiyaretler] = useState(() => new Set(ilk ? [ilk.id] : []))
  const [azalt, setAzalt] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [yedek, setYedek] = useState(false)
  const [hazir, setHazir] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  const [egim, setEgim] = useState(false)
  const [bildirim, setBildirim] = useState('')
  const [tamEkran, setTamEkran] = useState(false)
  const [fotografModu, setFotografModu] = useState(false)
  const alan = useRef<HTMLDivElement>(null)
  const bolum = useRef<HTMLElement>(null)
  const baslik = useRef<HTMLHeadingElement>(null)
  const sahne = useRef<Sahne | null>(null)
  const kilit = useRef(false)
  const gecerliDurak = useRef(durak)
  const aktif = useRef(true)
  const sabit = azalt || yedek || fotografModu

  useEffect(() => {
    aktif.current = true
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setAzalt(media.matches)
    media.addEventListener('change', change)
    const fullscreen = () => setTamEkran(document.fullscreenElement === bolum.current)
    document.addEventListener('fullscreenchange', fullscreen)
    return () => { aktif.current = false; media.removeEventListener('change', change); document.removeEventListener('fullscreenchange', fullscreen) }
  }, [])

  useEffect(() => {
    if (!basladi || sabit || !alan.current || !gecerliDurak.current) return
    let iptal = false
    let yerel: Sahne | undefined
    setHazir(false); setMesgul(true); kilit.current = true
    void import('./gezinti/sahne').then(async ({ sahneOlustur }) => {
      if (iptal) return
      yerel = sahneOlustur(alan.current!, tur.duraklar, () => { if (!iptal) setYedek(true) })
      sahne.current = yerel
      await yerel.git(gecerliDurak.current)
      if (!iptal) setHazir(true)
    }).catch(() => { if (!iptal) setYedek(true) }).finally(() => {
      if (!iptal) { kilit.current = false; setMesgul(false) }
    })
    return () => {
      iptal = true; yerel?.temizle(); sahne.current = null
      kilit.current = false; setMesgul(false); setHazir(false)
    }
  }, [basladi, sabit, tur])

  useEffect(() => {
    if (!egim || sabit) return
    let origin: { beta: number; gamma: number } | undefined
    const hareket = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return
      origin ??= { beta: event.beta, gamma: event.gamma }
      sahne.current?.yon((event.gamma - origin.gamma) / 18, (event.beta - origin.beta) / 18)
    }
    window.addEventListener('deviceorientation', hareket)
    return () => window.removeEventListener('deviceorientation', hareket)
  }, [egim, sabit])

  useEffect(() => {
    // Kalkmış bir yön düğmesinin odağını kaybetme; sonraki Tab yeni bağlantılara ulaşır.
    if (basladi && document.activeElement === document.body) baslik.current?.focus({ preventScroll: true })
  }, [durak, basladi])

  async function git(hedef: Durak) {
    if (kilit.current || hedef.id === durak?.id) return
    kilit.current = true; setMesgul(true)
    if (sahne.current && !sabit) {
      try { await sahne.current.git(hedef) }
      catch { if (aktif.current) setYedek(true) }
    }
    if (!aktif.current) return
    gecerliDurak.current = hedef
    setDurak(hedef)
    setZiyaretler((onceki) => new Set([...onceki, hedef.id]))
    kilit.current = false; setMesgul(false)
  }
  async function egimiAc() {
    try {
      const permission = (DeviceOrientationEvent as EğimIzni).requestPermission
      if (permission && await permission.call(DeviceOrientationEvent) !== 'granted') {
        setBildirim('Telefon eğimi izni verilmedi. Dokunarak gezinebilirsin.'); return
      }
      setEgim(true); setBildirim('Telefon eğimi açık. Hareket sensörü veri sağladığında görüş değişir.')
    } catch { setBildirim('Telefon eğimi kullanılamıyor. Dokunarak gezinebilirsin.') }
  }

  if (!durak) return null
  return <section ref={bolum} className="bolum sanal-gezinti" aria-labelledby="gezinti-basligi">
    <div className="gezinti-ust"><h2 id="gezinti-basligi">Sanal gezinti</h2>
      {basladi && document.fullscreenEnabled && <button onClick={async () => {
        try {
          if (document.fullscreenElement === bolum.current) await document.exitFullscreen()
          else await bolum.current?.requestFullscreen()
        } catch { setBildirim('Tam ekran açılamadı. Gezintiye bu ekranda devam edebilirsin.') }
      }}>{tamEkran ? 'Tam ekrandan çık' : 'Tam ekran'}</button>}
    </div>
    <p className="gezinti-aciklama">{tur.aciklama}</p>
    <h3 ref={baslik} tabIndex={-1} className="gezinti-durak-basligi" aria-live="polite" aria-atomic="true">{durak.baslik}</h3>
    <div className="gezinti-sahne">
      <img className="gezinti-fotograf" src={durak.gorsel} alt={`${durak.baslik} — sanal gezinti durağı`} />
      <div ref={alan} className={`gezinti-canvas ${hazir && !sabit ? 'hazir' : ''}`} aria-hidden="true" />
      {!basladi && <div className="gezinti-baslat"><button onClick={() => setBasladi(true)}>Gezintiye başla <span aria-hidden="true">→</span></button></div>}
    </div>
      {basladi && <>
        <div className="gezinti-yonler" role="group" aria-label="Bağlı duraklara git">
          {durak.baglantilar.map((link) => {
            const hedef = tur.duraklar.find((item) => item.id === link.hedef)
            return hedef && <button key={link.hedef} aria-disabled={mesgul} onClick={() => void git(hedef)}><span aria-hidden="true">→ </span>{link.etiket}</button>
          })}
        </div>
      </>}
    {basladi && !azalt && !yedek && <button className="ikincil-dugme" aria-pressed={fotografModu} onClick={() => setFotografModu(!fotografModu)}>{fotografModu ? 'Derinlik etkisine dön' : 'Fotoğrafın tamamını göster'}</button>}
    {basladi && <p className="gezinti-yardim">{sabit ? 'Fotoğraf modu: hareket etkisi kapalı; duraklar arasında gezinmeye devam edebilirsin.' : 'Görüşü değiştirmek için fareyi hareket ettir veya fotoğrafta parmağınla sürükle.'}</p>}
    <div className="gezinti-bilgi" aria-busy={mesgul}>
      <p>{durak.metin}</p>
      {durak.kaynakId && <KaynakSatiri kaynaklar={kaynaklar} kaynakId={durak.kaynakId} />}
      {basladi && <>
        <nav className="gezinti-duraklar" aria-label="Gezinti durakları">
          <p><strong>Duraklar</strong> · {ziyaretler.size} / {tur.duraklar.length} ziyaret edildi</p>
          <ol>{tur.duraklar.map((item) => <li key={item.id}><button aria-current={item.id === durak.id ? 'step' : undefined} aria-disabled={mesgul} onClick={() => void git(item)}>
            {ziyaretler.has(item.id) && <span aria-label="Ziyaret edildi">✓ </span>}{item.baslik}
          </button></li>)}</ol>
        </nav>
        {!sabit && typeof DeviceOrientationEvent !== 'undefined' && <button aria-pressed={egim} onClick={() => egim ? setEgim(false) : void egimiAc()}>{egim ? 'Telefon eğimini kapat' : 'Telefon eğimini etkinleştir'}</button>}
      </>}
      <p role="status">{bildirim || (mesgul ? 'Durak hazırlanıyor…' : '')}</p>
    </div>
  </section>
}
