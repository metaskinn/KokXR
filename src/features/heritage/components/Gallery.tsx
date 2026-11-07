import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Artifact, Image, Source } from '../../../domain/artifact'
import SourceLine from '../../../shared/ui/SourceLine'
import PhotoCredit from '../../../shared/ui/PhotoCredit'
import UiIcon from '../../../shared/ui/UiIcon'
import { PUBLIC_BUILD } from '../../../shared/config/publicBuild'

/** Marker positions in pixels: kept inside the photo, and pushed apart where they would overlap at this size. */
export function placeMarkers(points: { x: number; y: number }[], width: number, height: number, size: number) {
  const r = size / 2, min = size + 4
  const out = points.map((p) => ({ x: p.x / 100 * width, y: p.y / 100 * height }))
  const clamp = () => out.forEach((p) => { p.x = Math.min(Math.max(p.x, r), width - r); p.y = Math.min(Math.max(p.y, r), height - r) })
  clamp()
  for (let round = 0; round < 30; round++) {
    let moved = false
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j]
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
      if (d >= min) continue
      if (d < 0.01) { dx = 0; dy = 1; d = 1 }
      const push = (min - d) / 2 + 0.5
      a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push
      moved = true
    }
    clamp()
    if (!moved) break
  }
  return out
}

/** Touch target of a discovery marker (the hexagon drawn inside is smaller). */
const MARKER = 44

function Fullscreen({ images, sources, selected, select, close }: {
  images: Image[]; sources: Source[]; selected: number; select: (index: number) => void; close: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const photoArea = useRef<HTMLDivElement>(null)
  const [proximity, setProximity] = useState(1)
  const [ratio, setRatio] = useState(4 / 3)
  const [areaSize, setAreaSize] = useState({ w: 800, h: 500 })
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    const dlg = dialog.current!
    dlg.showModal()
    document.body.style.overflow = 'hidden'
    const observer = new ResizeObserver(([entry]) => {
      setAreaSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(photoArea.current!)
    return () => {
      observer.disconnect()
      dlg.close()
      document.body.style.overflow = prevOverflow
      prevFocus?.focus()
    }
  }, [])
  const image = images[selected]
  const width = Math.min(areaSize.w, areaSize.h * ratio)
  function go(index: number) {
    setProximity(1)
    photoArea.current?.scrollTo(0, 0)
    select((index + images.length) % images.length)
  }
  return <dialog className="full-screen" ref={dialog} aria-labelledby="full-screen-title" onCancel={(event) => { event.preventDefault(); close() }}
    onKeyDown={(event) => {
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && proximity === 1) {
        event.preventDefault()
        go(selected + (event.key === 'ArrowLeft' ? -1 : 1))
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
    <div className="gallery-controls"><button disabled={images.length < 2} onClick={() => go(selected - 1)}>← Önceki fotoğraf</button><button disabled={images.length < 2} onClick={() => go(selected + 1)}>Sonraki fotoğraf →</button></div>
    <p className="gallery-help">Ok tuşlarıyla fotoğraf değiştir. Yakınlaştırınca kaydırarak ayrıntıları incele.</p>
    {image.credit && <PhotoCredit text={image.credit} />}
    {sources.find((k) => k.id === image.sourceId)?.text !== image.credit && <SourceLine sources={sources} sourceId={image.sourceId} />}
  </dialog>
}

/**
 * Photo, discovery markers and their card, laid out with the artifact's title column (`side`) between the main photo and the
 * thumbnails/point lists, so on a phone the order is photo → title → thumbnails. Tapping the photo does not zoom (markers sit on it);
 * zoom is the "Fotoğrafı büyüt" button or a double tap.
 */
export default function Gallery({ artifact, side }: { artifact: Artifact; side: ReactNode }) {
  const [selected, setSelected] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [openPoint, setOpenPoint] = useState<string | null>(null)
  const [ratios, setRatios] = useState<Record<string, number>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const card = useRef<HTMLDivElement>(null)
  const thumbnails = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const observer = useRef<ResizeObserver | null>(null)
  // Measure the photo area whenever it is mounted or resized; marker placement needs its pixel size.
  const area = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!el) return
    observer.current = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    observer.current.observe(el)
  }, [])
  const images = PUBLIC_BUILD ? [] : artifact.images
  const image = images[selected]
  const point = artifact.hotspots.find((item) => item.id === openPoint)
  useEffect(() => {
    if (point) card.current?.scrollIntoView({ block: 'nearest' })
  }, [point])
  useEffect(() => {
    const button = thumbnails.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const strip = thumbnails.current
    if (!button || !strip) return
    // Scroll only the thumbnail strip; keep the page's vertical position.
    const left = button.offsetLeft - strip.offsetLeft
    if (left < strip.scrollLeft) strip.scrollLeft = left
    else if (left + button.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left + button.offsetWidth - strip.clientWidth
  }, [selected])
  function select(index: number) {
    if (!images.length) return
    setSelected((index + images.length) % images.length)
    setOpenPoint(null)
  }
  /** Opens a point's card, switching to the photo it sits on; tapping the open point again closes it. */
  function togglePoint(id: string) {
    if (openPoint === id) { setOpenPoint(null); return }
    const item = artifact.hotspots.find((h) => h.id === id)
    const photo = images.findIndex((p) => p.file === item?.image)
    if (photo >= 0 && photo !== selected) setSelected(photo)
    setOpenPoint(id)
  }
  const many = images.length > 1
  const ratio = image ? ratios[image.file] ?? 4 / 3 : 4 / 3
  const numbered = artifact.hotspots.map((item, index) => ({ item, index }))
  const here = image ? numbered.filter(({ item }) => item.image === image.file) : []
  const elsewhere = numbered.filter(({ item }) => !image || item.image !== image.file)
  const places = box.w && !failed[image?.file ?? ''] ? placeMarkers(here.map(({ item }) => item), box.w, box.h, MARKER) : null
  const photoNo = (file: string) => images.findIndex((p) => p.file === file) + 1

  const infoCard = point && <div className="info-card">
    <div className="info-card-head">
      <span className="hex-no" aria-hidden="true">{artifact.hotspots.indexOf(point) + 1}</span>
      <h3>{point.title}</h3>
      <button type="button" className="btn-ghost" onClick={() => setOpenPoint(null)}><UiIcon name="x" />Kapat</button>
    </div>
    <p>{point.text}</p>
    <SourceLine sources={artifact.sources} sourceId={point.sourceId} />
  </div>

  const pointButton = ({ item, index }: { item: (typeof numbered)[number]['item']; index: number }, other: boolean) =>
    <li key={item.id}><button type="button" className={other ? 'btn-ghost' : undefined} aria-expanded={openPoint === item.id} aria-controls="photo-info-card" onClick={() => togglePoint(item.id)}>
      <span className="hex-no" aria-hidden="true">{index + 1}</span>{item.title}{other && photoNo(item.image) > 0 && <small>fotoğraf {photoNo(item.image)}</small>}
    </button></li>

  const pointLists = artifact.hotspots.length > 0 && <div className="gallery-points">
    {here.length > 0 && <><p>Bu fotoğraftaki noktalar</p><ul>{here.map((p) => pointButton(p, false))}</ul></>}
    {elsewhere.length > 0 && <><p className={here.length ? 'elsewhere-t' : undefined}>{image ? 'Öteki fotoğraflarda' : 'Keşif noktaları'}</p><ul className="elsewhere">{elsewhere.map((p) => pointButton(p, true))}</ul></>}
  </div>

  if (!image) {
    // Public build without photos: the points stay readable as a list.
    return <div className="artifact-layout">
      <section className="gallery-main" id="fotograflar" aria-label="Keşif noktaları">
        <div id="photo-info-card" ref={card} aria-live="polite">{infoCard}</div>
      </section>
      {side}
      <div className="gallery-more">{pointLists}</div>
    </div>
  }

  const missing = failed[image.file]
  return <div className="artifact-layout">
    <section className="gallery-main" id="fotograflar" aria-label="Fotoğraflar">
      <figure>
        <div className="gallery-scene" tabIndex={0} role="group" aria-label={many ? 'Fotoğraflar; sağ ve sol ok tuşlarıyla gezinebilirsin' : 'Fotoğraf'}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.zoom')) return
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); select(selected + (e.key === 'ArrowLeft' ? -1 : 1)) }
          }}
          onTouchStart={(e) => { touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null }}
          onTouchMove={(e) => { if (e.touches.length !== 1) touch.current = null }}
          onTouchCancel={() => { touch.current = null }}
          onTouchEnd={(e) => {
            const start = touch.current, end = e.changedTouches[0]
            touch.current = null
            if (!start || !end) return
            const dx = end.clientX - start.x, dy = end.clientY - start.y
            if (many && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) { lastTap.current = null; select(selected + (dx < 0 ? 1 : -1)); return }
            if (Math.hypot(dx, dy) > 10 || (e.target as HTMLElement).closest('.info-point')) { lastTap.current = null; return }
            // Double tap on the photo opens the zoom view; a single tap does nothing.
            const prev = lastTap.current, now = e.timeStamp
            if (prev && now - prev.t < 350 && Math.hypot(end.clientX - prev.x, end.clientY - prev.y) < 40) {
              lastTap.current = null
              e.preventDefault()
              if (!missing) setFullscreen(true)
            } else lastTap.current = { t: now, x: end.clientX, y: end.clientY }
          }}>
          {missing
            ? <div className="photo-missing"><div><strong>Fotoğraf yüklenemedi.</strong><br />Bağlantını kontrol edip sayfayı yenile.{artifact.hotspots.length > 0 && ' Keşif noktaları aşağıdaki listede.'}<br /><span className="sr-only">{image.alt}</span></div></div>
            : <div className="image-area" ref={area} style={{ width: `min(100%, calc(var(--gallery-height) * ${ratio}))`, aspectRatio: String(ratio) }}>
              <div className="zoom" onDoubleClick={() => setFullscreen(true)}>
                <img src={image.file} alt={image.alt} fetchPriority={selected === 0 ? 'high' : undefined}
                  onLoad={(e) => { const el = e.currentTarget; setRatios((old) => ({ ...old, [image.file]: el.naturalWidth / el.naturalHeight })) }}
                  onError={() => setFailed((old) => ({ ...old, [image.file]: true }))} />
              </div>
              {here.map(({ item, index }, k) => <button
                key={item.id} type="button" className="info-point"
                // Percent of the photo, so the marker keeps its place when the photo is resized.
                style={places ? { left: `${places[k].x / box.w * 100}%`, top: `${places[k].y / box.h * 100}%` } : { left: `${item.x}%`, top: `${item.y}%` }}
                aria-label={`${index + 1}. ${item.title}`} aria-expanded={openPoint === item.id} aria-controls="photo-info-card"
                onClick={() => togglePoint(item.id)}>{index + 1}</button>)}
            </div>}
        </div>
        <div id="photo-info-card" ref={card} aria-live="polite">{infoCard}</div>
        <div className={`gallery-nav${many ? '' : ' single'}`} role="group" aria-label="Galeri gezinme">
          {many && <button type="button" onClick={() => select(selected - 1)} aria-label="Önceki fotoğraf"><UiIcon name="back" /></button>}
          <div className="gallery-photo-name" aria-live="polite"><strong>{image.description || 'Eser fotoğrafı'}</strong>{many && <span>Fotoğraf {selected + 1} / {images.length}</span>}</div>
          {many && <button type="button" onClick={() => select(selected + 1)} aria-label="Sonraki fotoğraf"><UiIcon name="next" /></button>}
        </div>
        <figcaption>{image.credit && <PhotoCredit text={image.credit} />}{artifact.sources.find((k) => k.id === image.sourceId)?.text !== image.credit && <SourceLine sources={artifact.sources} sourceId={image.sourceId} />}</figcaption>
      </figure>
    </section>
    {side}
    <div className="gallery-more">
      {many && <div className="small-images" ref={thumbnails} role="group" aria-label="Fotoğraf seçimi">
        {images.map((photo, index) => <button key={photo.file} type="button" aria-label={`${index + 1}. fotoğraf: ${photo.description || photo.alt}`} aria-pressed={selected === index} onClick={() => select(index)}
          onKeyDown={(e) => {
            let fresh: number | undefined
            if (e.key === 'ArrowLeft') fresh = (index - 1 + images.length) % images.length
            if (e.key === 'ArrowRight') fresh = (index + 1) % images.length
            if (e.key === 'Home') fresh = 0
            if (e.key === 'End') fresh = images.length - 1
            if (fresh !== undefined) { e.preventDefault(); select(fresh); thumbnails.current?.querySelectorAll<HTMLButtonElement>('button')[fresh]?.focus({ preventScroll: true }) }
          }}>
          <img src={photo.file} alt="" loading="lazy" />
        </button>)}
      </div>}
      {!missing && <div className="gallery-tools"><button type="button" className="btn-ghost" onClick={() => setFullscreen(true)}><UiIcon name="zoom" />Fotoğrafı büyüt</button></div>}
      {pointLists}
    </div>
    {fullscreen && <Fullscreen images={images} sources={artifact.sources} selected={selected} select={select} close={() => setFullscreen(false)} />}
  </div>
}
