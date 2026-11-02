import { useEffect, useRef, useState } from 'react'
import type { Eser, Gorsel, Kaynak } from '../types/eser'
import KaynakSatiri from './KaynakSatiri'

function TamEkran({ gorseller, kaynaklar, secili, sec, kapat }: {
  gorseller: Gorsel[]; kaynaklar: Kaynak[]; secili: number; sec: (index: number) => void; kapat: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const oncekiOdak = document.activeElement as HTMLElement | null
    const oncekiTasma = document.body.style.overflow
    const pencere = dialog.current!
    pencere.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      pencere.close()
      document.body.style.overflow = oncekiTasma
      oncekiOdak?.focus()
    }
  }, [])
  const gorsel = gorseller[secili]
  return <dialog className="tam-ekran" ref={dialog} aria-labelledby="tam-ekran-basligi" onCancel={(event) => { event.preventDefault(); kapat() }}
    onKeyDown={(event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        sec((secili + (event.key === 'ArrowLeft' ? -1 : 1) + gorseller.length) % gorseller.length)
      }
      if (event.key === 'Tab') {
        const dugmeler = dialog.current!.querySelectorAll<HTMLButtonElement>('button')
        const ilk = dugmeler[0], son = dugmeler[dugmeler.length - 1]
        if (event.shiftKey && document.activeElement === ilk) { event.preventDefault(); son.focus() }
        else if (!event.shiftKey && document.activeElement === son) { event.preventDefault(); ilk.focus() }
      }
    }}>
    <div className="galeri-kontrolleri"><h2 id="tam-ekran-basligi">Fotoğrafı incele</h2><button autoFocus onClick={kapat}>Kapat (Esc)</button></div>
    <figure>
      <img src={gorsel.dosya} alt={gorsel.alt} />
      <figcaption aria-live="polite">{gorsel.aciklama && <p>{gorsel.aciklama}</p>}<p>Fotoğraf {secili + 1} / {gorseller.length}</p><KaynakSatiri kaynaklar={kaynaklar} kaynakId={gorsel.kaynakId} /></figcaption>
    </figure>
    <div className="galeri-kontrolleri"><button onClick={() => sec((secili - 1 + gorseller.length) % gorseller.length)}>← Önceki fotoğraf</button><button onClick={() => sec((secili + 1) % gorseller.length)}>Sonraki fotoğraf →</button></div>
  </dialog>
}

export default function Galeri({ eser }: { eser: Eser }) {
  const [secili, setSecili] = useState(0)
  const [tamEkran, setTamEkran] = useState(false)
  const [acikNokta, setAcikNokta] = useState<string | null>(null)
  const gorsel = eser.gorseller[secili]
  return <>
    <section className="bolum" aria-labelledby="galeri-basligi">
      <h2 id="galeri-basligi">Fotoğraf galerisi</h2>
      {!gorsel ? <p>Fotoğraflar hazırlanıyor.</p> : <>
        <figure>
          <div className="gorsel-alani">
            <button className="buyut" onClick={() => setTamEkran(true)} aria-label="Fotoğrafı tam ekran görüntüle"><img src={gorsel.dosya} alt={gorsel.alt} /></button>
            {eser.bilgiNoktalari.map((nokta, index) => nokta.gorsel && nokta.gorsel === gorsel.dosya && <button
              key={nokta.id} className="bilgi-noktasi" style={{ left: `${nokta.x}%`, top: `${nokta.y}%` }}
              aria-label={`${index + 1}. ${nokta.baslik}`} aria-expanded={acikNokta === nokta.id} aria-controls={`nokta-${nokta.id}`}
              onClick={() => {
                setAcikNokta(acikNokta === nokta.id ? null : nokta.id)
                document.getElementById(`nokta-${nokta.id}`)?.scrollIntoView({ block: 'nearest' })
              }}>{index + 1}</button>)}
          </div>
          <figcaption>{gorsel.aciklama && <p>{gorsel.aciklama}</p>}<KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={gorsel.kaynakId} /></figcaption>
        </figure>
        <p>Fotoğraf {secili + 1} / {eser.gorseller.length} · Büyütmek için fotoğrafa dokun.</p>
        <div className="kucuk-resimler" role="group" aria-label="Fotoğraf seçimi">
          {eser.gorseller.map((foto, index) => <button key={foto.dosya} aria-label={`${index + 1}. fotoğraf: ${foto.aciklama || foto.alt}`} aria-pressed={secili === index} onClick={() => setSecili(index)}>
            <img src={foto.dosya} alt={foto.alt} loading="lazy" /><span>{index + 1}</span>
          </button>)}
        </div>
      </>}
    </section>
    <section className="bolum" aria-labelledby="kesif-basligi">
      <h2 id="kesif-basligi">Keşif noktaları</h2>
      <p>Fotoğraflardaki numaralardan veya aşağıdaki listeden bir keşif noktası seç.</p>
      {eser.bilgiNoktalari.length === 0 && <p>Keşif noktaları hazırlanıyor.</p>}
      {eser.bilgiNoktalari.map((nokta, index) => <details key={nokta.id} open={acikNokta === nokta.id} className="nokta-detay">
        <summary onClick={(event) => {
          event.preventDefault()
          const ac = acikNokta !== nokta.id
          setAcikNokta(ac ? nokta.id : null)
          const gorselSirasi = eser.gorseller.findIndex((foto) => foto.dosya === nokta.gorsel)
          if (ac && gorselSirasi >= 0) setSecili(gorselSirasi)
        }}>{index + 1}. {nokta.baslik}</summary>
        <div id={`nokta-${nokta.id}`}><h3>{nokta.baslik}</h3><p>{nokta.metin}</p><KaynakSatiri kaynaklar={eser.kaynaklar} kaynakId={nokta.kaynakId} /></div>
      </details>)}
    </section>
    {tamEkran && gorsel && <TamEkran gorseller={eser.gorseller} kaynaklar={eser.kaynaklar} secili={secili} sec={setSecili} kapat={() => setTamEkran(false)} />}
  </>
}
