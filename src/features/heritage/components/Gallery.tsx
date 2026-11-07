import { useEffect, useRef, useState } from 'react'
import type { Artifact, Image, Source } from '../../../domain/artifact'
import SourceLine from '../../../shared/ui/SourceLine'
import PhotoCredit from '../../../shared/ui/PhotoCredit'
import Section from '../../../shared/ui/Section'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'

function Fullscreen({ images, sources, selected, sec, close }: {
  images: Image[]; sources: Source[]; selected: number; sec: (index: number) => void; close: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const photoArea = useRef<HTMLDivElement>(null)
  const [proximity, setProximity] = useState(1)
  const [ratio, setRatio] = useState(4 / 3)
  const [areaSize, setAreaSize] = useState({ w: 800, h: 500 })
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    const window = dialog.current!
    window.showModal()
    document.body.style.overflow = 'hidden'
    const observer = new ResizeObserver(([entry]) => {
      setAreaSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(photoArea.current!)
    return () => {
      observer.disconnect()
      window.close()
      document.body.style.overflow = prevOverflow
      prevFocus?.focus()
    }
  }, [])
  const image = images[selected]
  const width = Math.min(areaSize.w, areaSize.h * ratio)
  function git(index: number) {
    setProximity(1)
    photoArea.current?.scrollTo(0, 0)
    sec((index + images.length) % images.length)
  }
  return <dialog className="full-screen" ref={dialog} aria-labelledby="full-screen-title" onCancel={(event) => { event.preventDefault(); close() }}
    onKeyDown={(event) => {
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && proximity === 1) {
        event.preventDefault()
        git(selected + (event.key === 'ArrowLeft' ? -1 : 1))
      }
      if (event.key === 'Tab') {
        const focusables = [...dialog.current!.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')]
        const first = focusables[0], last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }}>
    <div className="gallery-controls"><h2 id="full-screen-title">Fotoğrafı incele</h2><button autoFocus onClick={close}>Kapat (Esc)</button></div>
    <div className="photo-zoom" role="group" aria-label="Fotoğraf yakınlaştırma">
      <button disabled={proximity <= 1} onClick={() => setProximity((n) => Math.max(1, n - 0.5))}>Uzaklaştır</button>
      <span aria-live="polite">%{Math.round(proximity * 100)}</span>
      <button disabled={proximity >= 3} onClick={() => setProximity((n) => Math.min(3, n + 0.5))}>Yakınlaştır</button>
      <button onClick={() => { setProximity(1); photoArea.current?.scrollTo(0, 0) }}>Fotoğrafı sığdır</button>
    </div>
    <figure>
      <div className="full-screen-photo" ref={photoArea} tabIndex={0} role="region" aria-label="Fotoğraf ayrıntısı; yakınlaştırdıktan sonra kaydırarak incele">
        <div className="full-screen-canvas"><img src={image.file} alt={image.alt} onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} style={{ width: width * proximity, height: width / ratio * proximity }} /></div>
      </div>
      <figcaption aria-live="polite">{image.description && <p>{image.description}</p>}<p>Fotoğraf {selected + 1} / {images.length}</p></figcaption>
    </figure>
    <div className="gallery-controls"><button disabled={images.length < 2} onClick={() => git(selected - 1)}>← Önceki fotoğraf</button><button disabled={images.length < 2} onClick={() => git(selected + 1)}>Sonraki fotoğraf →</button></div>
    <p className="gallery-help">Ok tuşlarıyla fotoğraf değiştir. Yakınlaştırınca kaydırarak ayrıntıları incele.</p>
    {image.credit && <PhotoCredit text={image.credit} />}
    {sources.find((k) => k.id === image.sourceId)?.text !== image.credit && <SourceLine sources={sources} sourceId={image.sourceId} />}
  </dialog>
}

export default function Gallery({ artifact }: { artifact: Artifact }) {
  const [selected, setSelected] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [openPoint, setOpenPoint] = useState<string | null>(null)
  const [ratios, setRatios] = useState<Record<string, number>>({})
  const card = useRef<HTMLDivElement>(null)
  const thumbnails = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const scrolled = useRef(false)
  const point = artifact.hotspots.find((item) => item.id === openPoint && item.image === artifact.images[selected]?.file)
  useEffect(() => {
    if (point) card.current?.scrollIntoView({ block: 'nearest' })
  }, [point])
  useEffect(() => {
    const button = thumbnails.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const area = thumbnails.current
    if (!button || !area) return
    // Yalnız küçük resim şeridini kaydır; sayfanın dikey konumunu koru.
    const left = button.offsetLeft - area.offsetLeft
    if (left < area.scrollLeft) area.scrollLeft = left
    else if (left + button.offsetWidth > area.scrollLeft + area.clientWidth) area.scrollLeft = left + button.offsetWidth - area.clientWidth
  }, [selected])
  const image = artifact.images[selected]
  function sec(index: number) {
    if (!artifact.images.length) return
    setSelected((index + artifact.images.length) % artifact.images.length)
    setOpenPoint(null)
  }
  const ratio = image ? ratios[image.file] ?? 4 / 3 : 4 / 3
  return <>
    {!(PUBLIC_BUILD && !image) && <Section id="gallery-title" title="Fotoğraflar" className="photo-gallery" action={<div className="gallery-title-actions"><span className="gallery-counter" role="status">{image ? `${selected + 1} / ${artifact.images.length}` : '0 / 0'}</span>{image && <button className="secondary-button" onClick={() => setFullscreen(true)}>Fotoğrafı büyüt</button>}</div>}>
      {!image ? <p>Fotoğraflar hazırlanıyor.</p> : <>
        <figure>
          <div className="gallery-scene" tabIndex={0} role="group" aria-label="Fotoğraflar; sağ ve sol ok tuşlarıyla gezinebilirsin"
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.zoom')) return
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); sec(selected + (e.key === 'ArrowLeft' ? -1 : 1)) }
            }}
            onTouchStart={(e) => {
              scrolled.current = false
              touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
            }}
            onTouchMove={(e) => { if (e.touches.length !== 1) touch.current = null }}
            onTouchCancel={() => { touch.current = null }}
            onTouchEnd={(e) => {
              if (!touch.current || !e.changedTouches[0]) return
              const dx = e.changedTouches[0].clientX - touch.current.x, dy = e.changedTouches[0].clientY - touch.current.y
              touch.current = null
              if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                scrolled.current = true
                sec(selected + (dx < 0 ? 1 : -1))
              }
            }}>
            <div className="image-area" style={{ width: `min(100%, calc(var(--gallery-height) * ${ratio}))`, aspectRatio: String(ratio) }}>
              <button className="zoom" onClick={() => { if (scrolled.current) { scrolled.current = false; return }; setFullscreen(true) }} aria-label="Fotoğrafı tam ekran görüntüle"><img src={image.file} alt={image.alt} onLoad={(e) => { const imageEl = e.currentTarget; setRatios((old) => ({ ...old, [image.file]: imageEl.naturalWidth / imageEl.naturalHeight })) }} /></button>
              {artifact.hotspots.map((item, index) => item.image && item.image === image.file && <button
                key={item.id} className="info-point" style={{ left: `${item.x}%`, top: `${item.y}%` }}
                aria-label={`${index + 1}. ${item.title}`} aria-expanded={openPoint === item.id} aria-controls="photo-info-card"
                onClick={() => setOpenPoint(openPoint === item.id ? null : item.id)}>{index + 1}</button>)}
            </div>
          </div>
          <div className="gallery-nav" role="group" aria-label="Galeri gezinme">
            <button className="secondary-button" disabled={artifact.images.length < 2} onClick={() => sec(selected - 1)} aria-label="Önceki fotoğraf">← <span>Önceki</span></button>
            <div className="gallery-photo-name" aria-live="polite"><strong>{image.description || 'Eser fotoğrafı'}</strong><span>Fotoğraf {selected + 1} / {artifact.images.length}</span></div>
            <button className="secondary-button" disabled={artifact.images.length < 2} onClick={() => sec(selected + 1)} aria-label="Sonraki fotoğraf"><span>Sonraki</span> →</button>
          </div>
          <div className="small-images" ref={thumbnails} role="group" aria-label="Fotoğraf seçimi">
            {artifact.images.map((photo, index) => <button key={photo.file} aria-label={`${index + 1}. fotoğraf: ${photo.description || photo.alt}`} aria-pressed={selected === index} onClick={() => sec(index)}
              onKeyDown={(e) => {
                let fresh: number | undefined
                if (e.key === 'ArrowLeft') fresh = (index - 1 + artifact.images.length) % artifact.images.length
                if (e.key === 'ArrowRight') fresh = (index + 1) % artifact.images.length
                if (e.key === 'Home') fresh = 0
                if (e.key === 'End') fresh = artifact.images.length - 1
                if (fresh !== undefined) { e.preventDefault(); sec(fresh); thumbnails.current?.querySelectorAll<HTMLButtonElement>('button')[fresh]?.focus({ preventScroll: true }) }
              }}>
              <img src={photo.file} alt="" loading="lazy" /><span>{index + 1}</span>
            </button>)}
          </div>
          <p className="gallery-help">Oklarla veya küçük fotoğraflarla gezin. Telefonda yana kaydır; ayrıntıları büyütmek için fotoğrafa dokun.</p>
          <div id="photo-info-card" ref={card} aria-live="polite">
            {point && <div className="info-card"><h3>{point.title}</h3><p>{point.text}</p><SourceLine sources={artifact.sources} sourceId={point.sourceId} /></div>}
          </div>
          <figcaption>{image.credit && <PhotoCredit text={image.credit} />}{artifact.sources.find((k) => k.id === image.sourceId)?.text !== image.credit && <SourceLine sources={artifact.sources} sourceId={image.sourceId} />}</figcaption>
        </figure>
      </>}
    </Section>}
    <Section id="discover-title" title="Keşif noktaları">
      <p>{image ? 'Fotoğraflardaki numaralardan veya aşağıdaki listeden bir keşif noktası seç.' : 'Aşağıdaki listeden bir keşif noktası seç.'}</p>
      {artifact.hotspots.length === 0 && <p>Keşif noktaları hazırlanıyor.</p>}
      {artifact.hotspots.map((item, index) => <details key={item.id} open={openPoint === item.id} className="point-detail">
        <summary onClick={(event) => {
          event.preventDefault()
          const ac = openPoint !== item.id
          setOpenPoint(ac ? item.id : null)
          const imageIndex = artifact.images.findIndex((photo) => photo.file === item.image)
          if (ac && imageIndex >= 0) setSelected(imageIndex)
        }}>{index + 1}. {item.title}</summary>
        <div id={`point-${item.id}`}><p>{item.text}</p><SourceLine sources={artifact.sources} sourceId={item.sourceId} /></div>
      </details>)}
    </Section>
    {fullscreen && image && <Fullscreen images={artifact.images} sources={artifact.sources} selected={selected} sec={sec} close={() => setFullscreen(false)} />}
  </>
}
