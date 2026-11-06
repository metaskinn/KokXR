import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Eser } from '../types/eser'
import EseriEleAl from '../components/EseriEleAl'
import Restorasyon from '../components/Restorasyon'
import Bulunamadi from './Bulunamadi'
import { KABARTMA, haritaNoktasi, haritaYukle, isaretleriAyir } from '../data/turkiyeHaritasi'
import type { HaritaKimlik, HaritaVerisi } from '../data/turkiyeHaritasi'
import { vrSehirler } from '../data/vrEserler'
import './vr.css'

/** Bu tarayıcı sürükleyici VR açabiliyor mu? Bilinmeden önce null. */
function useVrDestegi() {
  const [destek, setDestek] = useState<boolean | null>(null)
  useEffect(() => {
    let iptal = false
    void (async () => {
      let var_ = false
      try { var_ = !!(await navigator.xr?.isSessionSupported('immersive-vr')) } catch { var_ = false }
      if (!iptal) setDestek(var_)
    })()
    return () => { iptal = true }
  }, [])
  return destek
}

/** Haritayı tembel yükler; yenisi gelene dek eskisi ekranda kalır. */
function useHaritaVerisi(kimlik: HaritaKimlik) {
  const [durum, setDurum] = useState<{ veri: HaritaVerisi | null; hata: HaritaKimlik | null }>({ veri: null, hata: null })
  useEffect(() => {
    let iptal = false
    haritaYukle(kimlik).then(
      (veri) => { if (!iptal) setDurum({ veri, hata: null }) },
      () => { if (!iptal) setDurum((d) => ({ ...d, hata: kimlik })) },
    )
    return () => { iptal = true }
  }, [kimlik])
  return { veri: durum.veri?.id === kimlik ? durum.veri : null, onceki: durum.veri, hata: durum.hata === kimlik }
}

interface Isaret {
  id: string
  ad: string
  alt?: string
  konum: [number, number]
  etiket: string
  no?: number
  kapali?: boolean
  bag?: string
  secili?: boolean
  tikla?: () => void
}

const Katmanlar = ({ v }: { v: HaritaVerisi }) => {
  const k = v.katman
  return <>
    <rect className="k-kara" width={v.g} height={v.y} />
    <image href={KABARTMA[v.id]} width={v.g} height={v.y} preserveAspectRatio="none" />
    {k.ulke && <path className="k-komsu" fillRule="evenodd" d={`M0 0H${v.g}V${v.y}H0z${k.ulke}`} />}
    {k.park && <path className="k-park" d={k.park} />}
    {k.kent && <path className="k-kent" d={k.kent} />}
    {k.kara && <path className="k-deniz" fillRule="evenodd" d={k.kara} />}
    {k.deniz && <path className="k-deniz" d={k.deniz} />}
    {k.gol && <path className="k-gol" d={k.gol} />}
    {k.nehir && <path className="k-nehir" d={k.nehir} />}
    {k.il && <path className="k-il" d={k.il} />}
    {k.ozel && <path className="k-ozel" d={k.ozel} />}
    {k.ulke && <path className="k-ulke" d={k.ulke} />}
    {k.sokak && <path className="k-yol k-sokak" d={k.sokak} />}
    {k.ucuncul && <path className="k-yol k-ucuncul" d={k.ucuncul} />}
    {k.ikincil && <><path className="k-zarf k-ikincil-z" d={k.ikincil} /><path className="k-yol k-ikincil" d={k.ikincil} /></>}
    {k.ana && <><path className="k-zarf k-ana-z" d={k.ana} /><path className="k-yol k-ana" d={k.ana} /></>}
    {k.otoyol && <><path className="k-zarf k-otoyol-z" d={k.otoyol} /><path className="k-yol k-otoyol" d={k.otoyol} /></>}
    {k.ray && <path className="k-ray" d={k.ray} />}
  </>
}

function Harita({ veri, isaretler, vurgu, setVurgu, not }: {
  veri: HaritaVerisi
  isaretler: Isaret[]
  vurgu: string | null
  setVurgu: (id: string | null) => void
  not?: string
}) {
  const kutu = useRef<HTMLDivElement>(null)
  const [boyut, setBoyut] = useState({ w: 0, h: 0 })
  const [gorunum, setGorunum] = useState({ z: 1, cx: veri.g / 2, cy: veri.y / 2 })
  const zEnCok = veri.zEnCok
  const yakinlasir = zEnCok > 1

  useLayoutEffect(() => {
    const el = kutu.current
    if (!el) return
    const olc = () => setBoyut({ w: el.clientWidth, h: el.clientHeight })
    olc()
    const g = new ResizeObserver(olc)
    g.observe(el)
    return () => g.disconnect()
  }, [])

  const { w, h } = boyut
  const taban = w && h ? Math.max(w / veri.g, h / veri.y) : 1
  const sinirla = useCallback((g: { z: number; cx: number; cy: number }) => {
    const z = Math.max(1, Math.min(zEnCok, g.z)), s = taban * z
    const vw = w / s, vh = h / s
    return {
      z,
      cx: vw >= veri.g ? veri.g / 2 : Math.max(vw / 2, Math.min(veri.g - vw / 2, g.cx)),
      cy: vh >= veri.y ? veri.y / 2 : Math.max(vh / 2, Math.min(veri.y - vh / 2, g.cy)),
    }
  }, [taban, w, h, veri.g, veri.y, zEnCok])
  const { z, cx, cy } = sinirla(gorunum)
  const s = taban * z
  const vx = cx - w / s / 2, vy = cy - h / s / 2

  /** Ekrandaki (px, py) noktası yerinde kalacak biçimde yakınlaştırır. */
  const yakinlas = useCallback((carpan: number, px?: number, py?: number) => {
    setGorunum((onceki) => {
      const g = sinirla(onceki)
      const s0 = taban * g.z, zYeni = Math.max(1, Math.min(zEnCok, g.z * carpan)), s1 = taban * zYeni
      const ax = px ?? w / 2, ay = py ?? h / 2
      const dx = ax - w / 2, dy = ay - h / 2
      return sinirla({ z: zYeni, cx: g.cx + dx / s0 - dx / s1, cy: g.cy + dy / s0 - dy / s1 })
    })
  }, [sinirla, taban, w, h, zEnCok])

  // Tekerlek: yalnız harita gerçekten yakınlaşabiliyorsa sayfa kaydırmasını alır.
  useEffect(() => {
    const el = kutu.current
    if (!el || !yakinlasir) return
    const tekerlek = (e: WheelEvent) => {
      const icerde = e.deltaY < 0 ? z < zEnCok : z > 1
      if (!icerde) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      yakinlas(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', tekerlek, { passive: false })
    return () => el.removeEventListener('wheel', tekerlek)
  }, [yakinlas, yakinlasir, z, zEnCok])

  // Sürükleme ve iki parmakla yakınlaştırma. İşaret veya düğmede başlayan hareket kaydırma sayılmaz: tıklama bozulmaz.
  const parmaklar = useRef(new Map<number, { x: number; y: number }>())
  const basla = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('a, button') || !yakinlasir) return
    e.currentTarget.setPointerCapture(e.pointerId)
    parmaklar.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const surukle = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = parmaklar.current, onceki = p.get(e.pointerId)
    if (!onceki) return
    const yeni = { x: e.clientX, y: e.clientY }
    if (p.size === 2) {
      const diger = [...p.entries()].find(([k]) => k !== e.pointerId)![1]
      const d0 = Math.hypot(onceki.x - diger.x, onceki.y - diger.y), d1 = Math.hypot(yeni.x - diger.x, yeni.y - diger.y)
      const r = e.currentTarget.getBoundingClientRect()
      if (d0 > 0) yakinlas(d1 / d0, (yeni.x + diger.x) / 2 - r.left, (yeni.y + diger.y) / 2 - r.top)
    } else {
      setGorunum((g0) => { const g = sinirla(g0), k = taban * g.z; return sinirla({ ...g, cx: g.cx - (yeni.x - onceki.x) / k, cy: g.cy - (yeni.y - onceki.y) / k }) })
    }
    p.set(e.pointerId, yeni)
  }
  const birak = (e: ReactPointerEvent<HTMLDivElement>) => { parmaklar.current.delete(e.pointerId) }

  const katmanlar = useMemo(() => <Katmanlar v={veri} />, [veri])

  const gercek = useMemo(() => isaretler.map((i) => {
    const n = haritaNoktasi(veri, i.konum)
    return { x: (n.x - vx) * s, y: (n.y - vy) * s }
  }), [isaretler, veri, vx, vy, s])
  const yerler = useMemo(() => (w ? isaretleriAyir(gercek, w, h) : []), [gercek, w, h])

  const zDerece = z >= 4.5 ? 3 : z >= 1.7 ? 2 : 1
  // Yakınlaştır düğmesi, görünen işaretlerin ortasına yaklaşır: boş araziye değil yapılara gider.
  const gorunenler = gercek.filter((n) => n.x >= 0 && n.y >= 0 && n.x <= w && n.y <= h)
  const odakX = gorunenler.length ? gorunenler.reduce((t, n) => t + n.x, 0) / gorunenler.length : undefined
  const odakY = gorunenler.length ? gorunenler.reduce((t, n) => t + n.y, 0) / gorunenler.length : undefined
  // Dar ekranda ülke haritasındaki genel etiketler işaretlerle çakışır; işaret etiketleri yeter.
  const dar = veri.id === 'turkiye' && w < 520
  const yaziPx = (n: number) => n / s

  return <figure className="vr-harita-sarmal">
    <div ref={kutu} className="vr-harita" data-tur={veri.id === 'turkiye' ? 'ulke' : 'sehir'} data-z={zDerece} data-kayar={z > 1 ? 'evet' : 'hayir'} data-yakin={veri.id === 'turkiye' ? 'hayir' : 'evet'}
      style={{ aspectRatio: `${veri.g} / ${veri.y}` }}
      onPointerDown={basla} onPointerMove={surukle} onPointerUp={birak} onPointerCancel={birak}>
      {w > 0 && <svg viewBox={`${vx} ${vy} ${w / s} ${h / s}`} role="img" aria-label={`${veri.ad} haritası`}>
        {katmanlar}
        {veri.etiket.filter((e) => (!e.z || z >= e.z) && (!dar || e.ad === 'Karadeniz')).map((e) => <g key={e.ad} className={`e-${e.tur}`}>
          {e.tur === 'zirve' && <path d={`M${e.x - yaziPx(6)} ${e.y + yaziPx(5)}L${e.x} ${e.y - yaziPx(6)}L${e.x + yaziPx(6)} ${e.y + yaziPx(5)}z`} />}
          {e.tur === 'sehir' && <circle cx={e.x} cy={e.y} r={yaziPx(2.5)} />}
          <text x={e.x + (e.tur === 'deniz' ? 0 : yaziPx(8))} y={e.y + yaziPx(4)} fontSize={yaziPx(e.tur === 'deniz' ? 13 : 12)} strokeWidth={yaziPx(3)} textAnchor={e.tur === 'deniz' ? 'middle' : 'start'}>{e.ad}</text>
          {e.alt && <text x={e.x + yaziPx(8)} y={e.y + yaziPx(17)} fontSize={yaziPx(10.5)} strokeWidth={yaziPx(3)}>{e.alt}</text>}
        </g>)}
      </svg>}
      {w > 0 && <svg className="vr-bag" width={w} height={h} aria-hidden="true" focusable="false">
        {isaretler.map((i, n) => {
          const a = gercek[n], b = yerler[n]
          const gorunur = a.x >= 0 && a.y >= 0 && a.x <= w && a.y <= h
          if (!b || !gorunur) return null
          const kaydi = Math.hypot(a.x - b.x, a.y - b.y) > 4
          return <g key={i.id} data-vurgu={vurgu === i.id ? 'evet' : undefined}>
            {kaydi && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />}
            {kaydi && <circle cx={a.x} cy={a.y} r={3} />}
          </g>
        })}
      </svg>}
      {w > 0 && <div className="vr-isaretler" role="group" aria-label={`${veri.ad} haritasındaki işaretler`}>
        {isaretler.map((i, n) => {
          const b = yerler[n], a = gercek[n]
          if (!b) return null
          const kenarda = a.x < 0 || a.y < 0 || a.x > w || a.y > h
          const icerik = <>
            <span className="vr-isaret-nokta" aria-hidden="true">{i.no}</span>
            <span className="vr-isaret-ad" aria-hidden="true"><strong>{i.ad}</strong>{i.alt && <small>{i.alt}</small>}</span>
          </>
          const ortak = {
            className: `vr-isaret${i.no ? '' : ' vr-sehir'}`,
            style: { left: b.x, top: b.y },
            'data-vurgu': vurgu === i.id ? 'evet' : undefined,
            'data-yan': b.x + 180 > w ? 'sol' : 'sag',
            'data-kapali': i.kapali ? 'evet' : undefined,
            'data-kenarda': kenarda ? 'evet' : undefined,
            'aria-label': i.etiket,
            onMouseEnter: () => setVurgu(i.id),
            onMouseLeave: () => setVurgu(null),
            onFocus: () => setVurgu(i.id),
            onBlur: () => setVurgu(null),
          }
          return i.bag
            ? <Link key={i.id} to={i.bag} {...ortak}>{icerik}</Link>
            : <button key={i.id} type="button" aria-pressed={!!i.secili} onClick={i.tikla} {...ortak}>{icerik}</button>
        })}
      </div>}
      {not && <p className="vr-harita-not">{not}</p>}
      {yakinlasir && <div className="vr-yakinlik">
        <button type="button" aria-label="Yakınlaştır" disabled={z >= zEnCok} onClick={() => yakinlas(1.8, odakX, odakY)}>+</button>
        <button type="button" aria-label="Uzaklaştır" disabled={z <= 1} onClick={() => yakinlas(1 / 1.8)}>−</button>
      </div>}
    </div>
    <figcaption className="vr-atif">
      {veri.atif.map((a, i) => <span key={a}>{i > 0 && ' · '}{a.startsWith('©')
        ? <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{a}</a>
        : a}</span>)}
    </figcaption>
  </figure>
}

export default function VrEserler({ eserler }: { eserler: Eser[] }) {
  const [parametre, setParametre] = useSearchParams()
  const secili = vrSehirler.find((s) => s.ad === parametre.get('sehir'))
  const destek = useVrDestegi()
  const sec = (ad: string | null) => { setVurgu(null); setParametre(ad ? { sehir: ad } : {}) }
  const icerik = (eserId: string) => eserler.find((e) => e.id === eserId && (e.maket || e.restorasyon))
  const aciklama = (e: Eser) => e.maket ? 'Temsilî 3B maket: içinde yürü' : "Çini panosunu VR'da onar"
  const [vurgu, setVurgu] = useState<string | null>(null)
  const { veri, hata } = useHaritaVerisi(secili?.harita ?? 'turkiye')

  const adetler = (s: (typeof vrSehirler)[number]) => s.yapilar.filter((y) => icerik(y.eserId)).length
  const isaretler: Isaret[] = secili
    ? secili.yapilar.filter((y) => eserler.some((e) => e.id === y.eserId)).map((y, i) => ({
      id: y.eserId,
      ad: y.ad,
      alt: y.ilce,
      konum: y.konum,
      no: i + 1,
      kapali: !icerik(y.eserId),
      bag: `/eser/${y.eserId}`,
      etiket: `${y.ad}, ${y.ilce}: eser sayfasını aç`,
    }))
    : vrSehirler.map((s) => {
      const adet = adetler(s)
      const durum = adet ? `${adet} yapı VR'da açılıyor` : 'Henüz VR yok'
      return { id: s.ad, ad: s.ad, alt: adet ? `${adet} yapı` : 'Henüz VR yok', konum: s.konum, kapali: !adet, secili: false, tikla: () => sec(s.ad), etiket: `${s.ad}: ${durum}. Şehir haritasını aç` }
    })
  const liste = (id: string) => ({
    onMouseEnter: () => setVurgu(id),
    onMouseLeave: () => setVurgu(null),
    onFocus: () => setVurgu(id),
    onBlur: () => setVurgu(null),
    'data-vurgu': vurgu === id ? 'evet' : undefined,
  })

  return <article className="sayfa vr-eserler">
    <header className="vr-baslik">
      <h1>VR Eserler</h1>
      <p>Haritadan bir şehir seç, o şehirdeki yapıya gir.</p>
      {destek === false && <p className="vr-not">Bu tarayıcı VR açamıyor. Gözlükle girmek için bu sayfayı Meta Quest tarayıcısında aç; maketi burada ekranda da gezebilirsin.</p>}
    </header>
    <div className="vr-duzen">
      {veri
        ? <Harita key={veri.id} veri={veri} isaretler={isaretler} vurgu={vurgu} setVurgu={setVurgu}
          not={secili && !secili.yapilar.length ? `${secili.ad}: Henüz VR yok` : undefined} />
        : <div className="vr-harita-bos" role="status">{hata ? 'Harita yüklenemedi. Yandaki listeden devam edebilirsin.' : 'Harita yükleniyor…'}</div>}
      <section className="vr-panel" aria-live="polite" aria-label={secili ? `${secili.ad} yapıları` : 'Şehirler'}>
        {!secili ? <>
          <h2>Şehirler</h2>
          <ul className="vr-sehirler">{vrSehirler.map((s) => {
            const adet = adetler(s)
            return <li key={s.ad}><button type="button" onClick={() => sec(s.ad)} {...liste(s.ad)}>
              <strong>{s.ad}</strong><span>{adet ? `${adet} yapı VR'da açılıyor` : 'Henüz VR yok'}</span>
            </button></li>
          })}</ul>
        </> : <>
          <button type="button" className="vr-geri" onClick={() => sec(null)}>← Haritaya dön</button>
          <h2>{secili.ad}</h2>
          {secili.yapilar.length > 0 ? <ul className="vr-yapilar">{secili.yapilar.map((y, i) => {
            const e = icerik(y.eserId)
            const no = <b className="vr-no" aria-hidden="true">{i + 1}</b>
            return <li key={y.ad}>{e
              ? <Link to={`/vr/${y.eserId}`} {...liste(y.eserId)}>{no}<strong>{y.ad}</strong><span>{y.ilce} · {aciklama(e)}</span></Link>
              : <div className="vr-yapi-kapali" {...liste(y.eserId)}>{no}<strong>{y.ad}</strong><span>{y.ilce} · VR henüz yok</span></div>}</li>
          })}</ul> : <p>Bu şehirdeki yapılar için henüz VR içeriği yok.</p>}
          <p className="vr-yayin">Envanter: {secili.yayinlar.map((k, i) => <span key={k.adres}>{i > 0 && ', '}<a href={k.adres} target="_blank" rel="noreferrer">{k.ad}</a></span>)} (Vakıf Katılım)</p>
        </>}
      </section>
    </div>
  </article>
}

export function VrEser({ eserler, rozetKazan }: { eserler: Eser[]; rozetKazan: (id: string) => boolean }) {
  const { id } = useParams()
  const eser = eserler.find((e) => e.id === id)
  const destek = useVrDestegi()
  if (!eser || (!eser.maket && !eser.restorasyon)) return <Bulunamadi />
  return <article className="sayfa vr-eser" key={eser.id}>
    <Link to={`/vr?sehir=${encodeURIComponent(eser.sehir)}`}>← {eser.sehir} yapıları</Link>
    <header className="vr-baslik">
      <h1>{eser.ad}</h1>
      <p>{eser.sehir} · {eser.ilce}</p>
      {destek === false && <p className="vr-not">Bu tarayıcı VR açamıyor. Gözlükle girmek için bu sayfayı Meta Quest tarayıcısında aç.</p>}
      {destek && <p className="vr-not">Sahne yüklenince VR düğmesine bas. Tarayıcılar VR'ı yalnızca bir dokunuşla başlatır.</p>}
    </header>
    {eser.maket && <EseriEleAl maket={eser.maket} kaynaklar={eser.kaynaklar} ad={eser.ad} hemenAc />}
    {eser.restorasyon && <Restorasyon gorev={eser.restorasyon} kaynaklar={eser.kaynaklar} rozetKazan={rozetKazan} rozetId={`${eser.id}:restorasyon`} />}
  </article>
}
