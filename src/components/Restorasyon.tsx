import { useState } from 'react'
import './restorasyon.css'
import type { Kaynak, RestorasyonGorevi } from '../types/eser'
import KaynakSatiri from './KaynakSatiri'

interface Parca { id: number; yuva: number | null; donus: number }

function karistir(adet: number): Parca[] {
  const yuvasiz = Array.from({ length: adet }, (_, id) => ({ id, yuva: null, donus: 1 + Math.floor(Math.random() * 3) }))
  for (let i = yuvasiz.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [yuvasiz[i], yuvasiz[j]] = [yuvasiz[j], yuvasiz[i]]
  }
  return yuvasiz
}

const yonler = ['düz', '90° dönük', 'ters', '270° dönük']

export default function Restorasyon({ gorev, kaynaklar, rozetKazan, rozetId }: {
  gorev: RestorasyonGorevi; kaynaklar: Kaynak[]; rozetKazan: (id: string) => boolean; rozetId: string
}) {
  const adet = gorev.sutun * gorev.satir
  const [parcalar, setParcalar] = useState<Parca[] | null>(null)
  const [secili, setSecili] = useState<number | null>(null)
  const [ipucu, setIpucu] = useState(true)
  const [hamle, setHamle] = useState(0)
  const [duyuru, setDuyuru] = useState('')

  const bitti = parcalar !== null && parcalar.every((p) => p.yuva === p.id && p.donus === 0)

  function guncelle(yeni: Parca[], mesaj: string) {
    setParcalar(yeni)
    setHamle((h) => h + 1)
    if (yeni.every((p) => p.yuva === p.id && p.donus === 0)) {
      setSecili(null)
      rozetKazan(rozetId)
      setDuyuru('Tebrikler, pano onarıldı! Restoratör rozeti kazanıldı.')
    } else setDuyuru(mesaj)
  }

  function yuvayaKoy(yuva: number) {
    if (!parcalar || secili === null || bitti) return
    const yeni = parcalar.map((p) => ({ ...p }))
    const tasinan = yeni.find((p) => p.id === secili)!
    const oradaki = yeni.find((p) => p.yuva === yuva)
    if (oradaki && oradaki.id !== tasinan.id) oradaki.yuva = tasinan.yuva
    tasinan.yuva = yuva
    setSecili(null)
    guncelle(yeni, `Parça ${yuva + 1}. yuvaya yerleştirildi.`)
  }

  function dondur() {
    if (!parcalar || secili === null) return
    const yeni = parcalar.map((p) => p.id === secili ? { ...p, donus: (p.donus + 1) % 4 } : p)
    guncelle(yeni, `Parça döndürüldü: ${yonler[yeni.find((p) => p.id === secili)!.donus]}.`)
  }

  function parcaGorunumu(p: Parca) {
    const sutun = p.id % gorev.sutun, satir = Math.floor(p.id / gorev.sutun)
    return {
      backgroundImage: `url(${gorev.gorsel})`,
      backgroundSize: `${gorev.sutun * 100}% ${gorev.satir * 100}%`,
      backgroundPosition: `${gorev.sutun > 1 ? (sutun / (gorev.sutun - 1)) * 100 : 0}% ${gorev.satir > 1 ? (satir / (gorev.satir - 1)) * 100 : 0}%`,
      transform: `rotate(${p.donus * 90}deg)`,
    }
  }

  function parcaDugmesi(p: Parca, konum: string) {
    return <button key={p.id} type="button" className={`parca${secili === p.id ? ' secili' : ''}`} style={parcaGorunumu(p)}
      aria-pressed={secili === p.id} disabled={bitti}
      aria-label={`Parça ${p.id + 1}, ${yonler[p.donus]}, ${konum}${secili === p.id ? ', seçili' : ''}`}
      onClick={() => setSecili(secili === p.id ? null : p.id)}
      onKeyDown={(e) => { if (e.key === 'r' || e.key === 'R') { e.preventDefault(); if (secili === p.id) dondur() } }} />
  }

  return <section className="bolum restorasyon" aria-labelledby="restorasyon-basligi">
    <h2 id="restorasyon-basligi">Restorasyon görevi</h2>
    <p>{gorev.baslik}</p>
    {!parcalar ? <>
      <img className="restorasyon-onizleme" src={gorev.gorsel} alt={gorev.alt} />
      <button type="button" onClick={() => { setParcalar(karistir(adet)); setHamle(0); setDuyuru('Pano parçalandı. Bir parça seç, sonra yerleştireceğin yuvaya dokun.') }}>Panoyu parçala ve onar</button>
    </> : <>
      <p className="ipucu-metni">Bir parçaya dokunarak seç, sonra tahtada bir yuvaya dokun. Seçili parçayı "Döndür" düğmesiyle (veya R tuşuyla) çevir.</p>
      <div className="restorasyon-kontrol">
        <button type="button" onClick={dondur} disabled={secili === null || bitti}>⟳ Döndür</button>
        <label><input type="checkbox" checked={ipucu} onChange={(e) => setIpucu(e.target.checked)} /> İpucu görüntüsü</label>
        <button type="button" onClick={() => { setParcalar(karistir(adet)); setSecili(null); setHamle(0); setDuyuru('Pano yeniden parçalandı.') }}>Baştan başla</button>
        <span>Hamle: {hamle}</span>
      </div>
      <div className={`restorasyon-tahta${bitti ? ' tamam' : ''}`} role="group" aria-label="Onarım tahtası"
        style={{ gridTemplateColumns: `repeat(${gorev.sutun}, minmax(0, 1fr))`, backgroundImage: ipucu && !bitti ? `url(${gorev.gorsel})` : undefined }}>
        {Array.from({ length: adet }, (_, yuva) => {
          const p = parcalar.find((x) => x.yuva === yuva)
          return <div key={yuva} className="yuva">
            {p ? parcaDugmesi(p, `${yuva + 1}. yuvada`)
              : <button type="button" className="bos-yuva" disabled={secili === null} onClick={() => yuvayaKoy(yuva)} aria-label={`Boş yuva ${yuva + 1}`} />}
            {p && secili !== null && secili !== p.id && <button type="button" className="yuva-hedef" onClick={() => yuvayaKoy(yuva)} aria-label={`Seçili parçayı ${yuva + 1}. yuvaya koy (yer değiştir)`} />}
          </div>
        })}
      </div>
      {!bitti && <div className="parca-tepsisi" role="group" aria-label="Yerleştirilmemiş parçalar">
        {parcalar.filter((p) => p.yuva === null).map((p) => parcaDugmesi(p, 'tepside'))}
        {parcalar.every((p) => p.yuva !== null) && <p>Tüm parçalar tahtada. Yanlış duran ya da dönük parçaları düzelt.</p>}
      </div>}
      {bitti && <div className="yanit">
        <p><strong>★ Pano onarıldı! "Restoratör" rozeti kazandın ({hamle} hamle).</strong></p>
        <p>{gorev.metin}</p>
        <KaynakSatiri kaynaklar={kaynaklar} kaynakId={gorev.kaynakId} />
      </div>}
    </>}
    <p className="gorsel-not">{gorev.not}</p>
    <div className="gorunmez" aria-live="polite">{duyuru}</div>
  </section>
}
