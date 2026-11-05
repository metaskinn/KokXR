import { useEffect, useRef, useState } from 'react'
import type { Eser, Gorsel, Kaynak } from '../types/eser'
import KaynakSatiri from './KaynakSatiri'
import { ACIK_YAYIN } from '../data/acikYayin'

function TamEkran({ gorseller, kaynaklar, secili, sec, kapat }: {
  gorseller: Gorsel[]; kaynaklar: Kaynak[]; secili: number; sec: (index: number) => void; kapat: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const fotografAlani = useRef<HTMLDivElement>(null)
  const [yakinlik, setYakinlik] = useState(1)
  const [oran, setOran] = useState(4 / 3)
  const [alanBoyutu, setAlanBoyutu] = useState({ w: 800, h: 500 })
  useEffect(() => {
    const oncekiOdak = document.activeElement as HTMLElement | null
    const oncekiTasma = document.body.style.overflow
    const pencere = dialog.current!
    pencere.showModal()
    document.body.style.overflow = 'hidden'
    const observer = new ResizeObserver(([entry]) => {
      setAlanBoyutu({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(fotografAlani.current!)
    return () => {
      observer.disconnect()
      pencere.close()
      document.body.style.overflow = oncekiTasma
      oncekiOdak?.focus()
    }
  }, [])
  const gorsel = gorseller[secili]
  const genislik = Math.min(alanBoyutu.w, alanBoyutu.h * oran)
  function git(index: number) {
    setYakinlik(1)
    fotografAlani.current?.scrollTo(0, 0)
    sec((index + gorseller.length) % gorseller.length)
  }
  return <dialog className="tam-ekran" ref={dialog} aria-labelledby="tam-ekran-basligi" onCancel={(event) => { event.preventDefault(); kapat() }}
    onKeyDown={(event) => {
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && yakinlik === 1) {
        event.preventDefault()
        git(secili + (event.key === 'ArrowLeft' ? -1 : 1))
      }
      if (event.key === 'Tab') {
        const odaklar = [...dialog.current!.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')]
        const ilk = odaklar[0], son = odaklar[odaklar.length - 1]
        if (event.shiftKey && document.activeElement === ilk) { event.preventDefault(); son.focus() }
        else if (!event.shiftKey && document.activeElement === son) { event.preventDefault(); ilk.focus() }
      }
    }}>
    <div className="galeri-kontrolleri"><h2 id="tam-ekran-basligi">Fotoğrafı incele</h2><button autoFocus onClick={kapat}>Kapat (Esc)</button></div>
    <div className="fotograf-yakinlastirma" role="group" aria-label="Fotoğraf yakınlaştırma">
      <button disabled={yakinlik <= 1} onClick={() => setYakinlik((n) => Math.max(1, n - 0.5))}>Uzaklaştır</button>
      <span aria-live="polite">%{Math.round(yakinlik * 100)}</span>
      <button disabled={yakinlik >= 3} onClick={() => setYakinlik((n) => Math.min(3, n + 0.5))}>Yakınlaştır</button>
      <button onClick={() => { setYakinlik(1); fotografAlani.current?.scrollTo(0, 0) }}>Fotoğrafı sığdır</button>
    </div>
    <figure>
      <div className="tam-ekran-fotograf" ref={fotografAlani} tabIndex={0} role="region" aria-label="Fotoğraf ayrıntısı; yakınlaştırdıktan sonra kaydırarak incele">
        <div className="tam-ekran-tuval"><img src={gorsel.dosya} alt={gorsel.alt} onLoad={(e) => setOran(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} style={{ width: genislik * yakinlik, height: genislik / oran * yakinlik }} /></div>
      </div>
      <figcaption aria-live="polite">{gorsel.aciklama && <p>{gorsel.aciklama}</p>}<p>Fotoğraf {secili + 1} / {gorseller.length}</p></figcaption>
    </figure>
    <div className="galeri-kontrolleri"><button disabled={gorseller.length < 2} onClick={() => git(secili - 1)}>← Önceki fotoğraf</button><button disabled={gorseller.length < 2} onClick={() => git(secili + 1)}>Sonraki fotoğraf →</button></div>
    <p className="galeri-yardim">Ok tuşlarıyla fotoğraf değiştir. Yakınlaştırınca kaydırarak ayrıntıları incele.</p>
    <KaynakSatiri kaynaklar={kaynaklar} kaynakId={gorsel.kaynakId} />
  </dialog>
}

export default function Galeri({ eser }: { eser: Eser }) {
  const [secili, setSecili] = useState(0)
  const [tamEkran, setTamEkran] = useState(false)
  const [acikNokta, setAcikNokta] = useState<string | null>(null)
  const [oranlar, setOranlar] = useState<Record<string, number>>({})
  const kart = useRef<HTMLDivElement>(null)
  const kucukResimler = useRef<HTMLDivElement>(null)
  const dokunus = useRef<{ x: number; y: number } | null>(null)
  const kaydirildi = useRef(false)
  const nokta = eser.bilgiNoktalari.find((item) => item.id === acikNokta && item.gorsel === eser.gorseller[secili]?.dosya)
  useEffect(() => {
    if (nokta) kart.current?.scrollIntoView({ block: 'nearest' })
  }, [nokta])
  useEffect(() => {
    const dugme = kucukResimler.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const alan = kucukResimler.current
    if (!dugme || !alan) return
    // Yalnız küçük resim şeridini kaydır; sayfanın dikey konumunu koru.
    const sol = dugme.offsetLeft - alan.offsetLeft
    if (sol < alan.scrollLeft) alan.scrollLeft = sol
    else if (sol + dugme.offsetWidth > alan.scrollLeft + alan.clientWidth) alan.scrollLeft = sol + dugme.offsetWidth - alan.clientWidth
  }, [secili])
  const gorsel = eser.gorseller[secili]
  function sec(index: number) {
    if (!eser.gorseller.length) return
    setSecili((index + eser.gorseller.length) % eser.gorseller.length)
    setAcikNokta(null)
  }
  const oran = gorsel ? oranlar[gorsel.dosya] ?? 4 / 3 : 4 / 3
  return <>
    {!(ACIK_YAYIN && !gorsel) && <section className="bolum fotograf-galerisi" aria-labelledby="galeri-basligi">
      <div className="galeri-baslik-satiri"><div><p className="ust-baslik">AYRINTILARA YAKLAŞ</p><h2 id="galeri-basligi" className="sr-only">Fotoğraf galerisi</h2></div><div className="galeri-baslik-eylemler"><span className="galeri-sayac" role="status">{gorsel ? `${secili + 1} / ${eser.gorseller.length}` : '0 / 0'}</span>{gorsel && <button className="ikincil-dugme" onClick={() => setTamEkran(true)}>Fotoğrafı büyüt</button>}</div></div>
      {!gorsel ? <p>Fotoğraflar hazırlanıyor.</p> : <>
        <figure>
          <div className="galeri-sahne" tabIndex={0} role="group" aria-label="Fotoğraflar; sağ ve sol ok tuşlarıyla gezinebilirsin"
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.buyut')) return
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); sec(secili + (e.key === 'ArrowLeft' ? -1 : 1)) }
            }}
            onTouchStart={(e) => {
              kaydirildi.current = false
              dokunus.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
            }}
            onTouchMove={(e) => { if (e.touches.length !== 1) dokunus.current = null }}
            onTouchCancel={() => { dokunus.current = null }}
            onTouchEnd={(e) => {
              if (!dokunus.current || !e.changedTouches[0]) return
              const dx = e.changedTouches[0].clientX - dokunus.current.x, dy = e.changedTouches[0].clientY - dokunus.current.y
              dokunus.current = null
              if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                kaydirildi.current = true
                sec(secili + (dx < 0 ? 1 : -1))
              }
            }}>
            <div className="gorsel-alani" style={{ width: `min(100%, calc(var(--galeri-yukseklik) * ${oran}))`, aspectRatio: String(oran) }}>
              <button className="buyut" onClick={() => { if (kaydirildi.current) { kaydirildi.current = false; return }; setTamEkran(true) }} aria-label="Fotoğrafı tam ekran görüntüle"><img src={gorsel.dosya} alt={gorsel.alt} onLoad={(e) => { const image = e.currentTarget; setOranlar((eski) => ({ ...eski, [gorsel.dosya]: image.naturalWidth / image.naturalHeight })) }} /></button>
              {eser.bilgiNoktalari.map((item, index) => item.gorsel && item.gorsel === gorsel.dosya && <button
                key={item.id} className="bilgi-noktasi" style={{ left: `${item.x}%`, top: `${item.y}%` }}
                aria-label={`${index + 1}. ${item.baslik}`} aria-expanded={acikNokta === item.id} aria-controls="fotograf-bilgi-karti"
                onClick={() => setAcikNokta(acikNokta === item.id ? null : item.id)}>{index + 1}</button>)}
            </div>
          </div>
          <div className="galeri-gezinme" role="group" aria-label="Galeri gezinme">
            <button className="ikincil-dugme" disabled={eser.gorseller.length < 2} onClick={() => sec(secili - 1)} aria-label="Önceki fotoğraf">← <span>Önceki</span></button>
            <div className="galeri-fotograf-adi" aria-live="polite"><strong>{gorsel.aciklama || 'Eser fotoğrafı'}</strong><span>Fotoğraf {secili + 1} / {eser.gorseller.length}</span></div>
            <button className="ikincil-dugme" disabled={eser.gorseller.length < 2} onClick={() => sec(secili + 1)} aria-label="Sonraki fotoğraf"><span>Sonraki</span> →</button>
          </div>
          <div className="kucuk-resimler" ref={kucukResimler} role="group" aria-label="Fotoğraf seçimi">
            {eser.gorseller.map((foto, index) => <button key={foto.dosya} aria-label={`${index + 1}. fotoğraf: ${foto.aciklama || foto.alt}`} aria-pressed={secili === index} onClick={() => sec(index)}
              onKeyDown={(e) => {
                let yeni: number | undefined
                if (e.key === 'ArrowLeft') yeni = (index - 1 + eser.gorseller.length) % eser.gorseller.length
                if (e.key === 'ArrowRight') yeni = (index + 1) % eser.gorseller.length
                if (e.key === 'Home') yeni = 0
                if (e.key === 'End') yeni = eser.gorseller.length - 1
                if (yeni !== undefined) { e.preventDefault(); sec(yeni); kucukResimler.current?.querySelectorAll<HTMLButtonElement>('button')[yeni]?.focus({ preventScroll: true }) }
              }}>
              <img src={foto.dosya} alt="" loading="lazy" /><span>{index + 1}</span>
            </button>)}
          </div>
          <p className="galeri-yardim">Oklarla veya küçük fotoğraflarla gezin. Telefonda yana kaydır; ayrıntıları büyütmek için fotoğrafa dokun.</p>
          <div id="fotograf-bilgi-karti" ref={kart} aria-live="polite">
            {nokta && <div className="bilgi-karti"><h3>{nokta.baslik}</h3><p>{nokta.metin}</p><KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={nokta.kaynakId} /></div>}
          </div>
          <figcaption><KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={gorsel.kaynakId} /></figcaption>
        </figure>
      </>}
    </section>}
    <section className="bolum" aria-labelledby="kesif-basligi">
      <h2 id="kesif-basligi">Keşif noktaları</h2>
      <p>{gorsel ? 'Fotoğraflardaki numaralardan veya aşağıdaki listeden bir keşif noktası seç.' : 'Aşağıdaki listeden bir keşif noktası seç.'}</p>
      {eser.bilgiNoktalari.length === 0 && <p>Keşif noktaları hazırlanıyor.</p>}
      {eser.bilgiNoktalari.map((item, index) => <details key={item.id} open={acikNokta === item.id} className="nokta-detay">
        <summary onClick={(event) => {
          event.preventDefault()
          const ac = acikNokta !== item.id
          setAcikNokta(ac ? item.id : null)
          const gorselSirasi = eser.gorseller.findIndex((foto) => foto.dosya === item.gorsel)
          if (ac && gorselSirasi >= 0) setSecili(gorselSirasi)
        }}>{index + 1}. {item.baslik}</summary>
        <div id={`nokta-${item.id}`}><p>{item.metin}</p><KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={item.kaynakId} /></div>
      </details>)}
    </section>
    {tamEkran && gorsel && <TamEkran gorseller={eser.gorseller} kaynaklar={eser.kaynaklar} secili={secili} sec={sec} kapat={() => setTamEkran(false)} />}
  </>
}
