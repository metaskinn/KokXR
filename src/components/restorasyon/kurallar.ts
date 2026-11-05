// Çini panosu bulmacasının kuralları ve VR yerleşim hesapları: masaüstü ve VR aynı işlevleri kullanır. three ve DOM kullanmaz, Node testinde doğrudan çalışır.
export interface Parca { id: number; yuva: number | null; donus: number }
export type Nokta = [number, number, number]

export const yonler = ['düz', '90° dönük', 'ters', '270° dönük']

/** Yuvasız, karışık sıralı ve hiçbiri düz olmayan parçalar. */
export function karistir(adet: number, rastgele: () => number = Math.random): Parca[] {
  const yuvasiz: Parca[] = Array.from({ length: adet }, (_, id) => ({ id, yuva: null, donus: 1 + Math.floor(rastgele() * 3) }))
  for (let i = yuvasiz.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [yuvasiz[i], yuvasiz[j]] = [yuvasiz[j], yuvasiz[i]]
  }
  return yuvasiz
}

export function tamamMi(parcalar: Parca[]) {
  return parcalar.every((p) => p.yuva === p.id && p.donus === 0)
}

/** Parçayı yuvaya koyar; yuvadaki başka parça taşınan parçanın eski yerine geçer. */
export function yuvayaKoy(parcalar: Parca[], id: number, yuva: number): Parca[] {
  const tasinan = parcalar.find((p) => p.id === id)!
  return parcalar.map((p) => p.id === id ? { ...p, yuva } : p.yuva === yuva ? { ...p, yuva: tasinan.yuva } : p)
}

/** Saat yönünde 90°. */
export function dondur(parcalar: Parca[], id: number): Parca[] {
  return parcalar.map((p) => p.id === id ? { ...p, donus: (p.donus + 1) % 4 } : p)
}

/** Parçanın görseldeki hücresi; satır 0 üsttür. */
export function parcaHucresi(id: number, sutun: number) {
  return { sutun: id % sutun, satir: Math.floor(id / sutun) }
}

// ---------- VR yerleşimi ----------

// Ölçüler metre ve başın ilk pozuna göredir: +x sağ, +y yukarı, -z ileri.
export const PANO_GENISLIK = 1
export const PANO_Y = -0.05, PANO_Z = -0.85
export const TEPSI_OLCEK = 0.6
const TEPSI_Y = -0.4, TEPSI_Z = -0.5, TEPSI_ARA = 0.7

/** Görsel oranı korunur: `oran` görselin genişlik/yükseklik oranıdır. */
export function hucreOlcusu(sutun: number, satir: number, oran: number) {
  return { en: PANO_GENISLIK / sutun, boy: PANO_GENISLIK / oran / satir }
}

/** Yuvanın pano düzlemindeki merkezi. */
export function yuvaMerkezi(yuva: number, sutun: number, satir: number, oran: number): [number, number] {
  const { en, boy } = hucreOlcusu(sutun, satir, oran), h = parcaHucresi(yuva, sutun)
  return [(h.sutun - (sutun - 1) / 2) * en, PANO_Y + ((satir - 1) / 2 - h.satir) * boy]
}

/** Tepsi panonun altında, ele yakın: `sira` parçanın karışık listedeki yeridir, boşalan yer kapanmaz. */
export function tepsiKonumu(sira: number, sutun: number, satir: number, oran: number): Nokta {
  const { en, boy } = hucreOlcusu(sutun, satir, oran), h = parcaHucresi(sira, sutun)
  return [(h.sutun - (sutun - 1) / 2) * en * TEPSI_ARA, TEPSI_Y - h.satir * boy * TEPSI_ARA, TEPSI_Z]
}

/** Parçanın UV dikdörtgeni; görselin üstü v=1'dir. */
export function parcaUv(id: number, sutun: number, satir: number) {
  const h = parcaHucresi(id, sutun)
  return { u0: h.sutun / sutun, u1: (h.sutun + 1) / sutun, v0: 1 - (h.satir + 1) / satir, v1: 1 - h.satir / satir }
}

/** Saat yönünde dönüşün z açısı: panoya bakana CSS `rotate` ile aynı görünür. */
export function donusAcisi(donus: number) {
  return -donus * Math.PI / 2
}

/** Baştan parçaya uzanan doğrunun pano düzlemini kestiği nokta: kullanıcı parçayı hangi yuvanın üstünde görüyorsa o. */
export function panoIzdusumu(bas: Nokta, parca: Nokta, panoZ: number = PANO_Z): [number, number] | null {
  const dz = parca[2] - bas[2]
  if (dz >= 0) return null // Parça başın arkasında veya yanında: panoya bakmıyor
  const t = (panoZ - bas[2]) / dz
  return [bas[0] + (parca[0] - bas[0]) * t, bas[1] + (parca[1] - bas[1]) * t]
}

/** Noktaya en yakın yuva. Nokta panonun bir hücreden daha dışındaysa `null`: parça eski yerine döner. */
export function enYakinYuva(x: number, y: number, sutun: number, satir: number, oran: number): number | null {
  const { en, boy } = hucreOlcusu(sutun, satir, oran)
  let enIyi: number | null = null, enKucuk = Infinity
  for (let yuva = 0; yuva < sutun * satir; yuva++) {
    const [mx, my] = yuvaMerkezi(yuva, sutun, satir, oran)
    const dx = Math.abs(x - mx), dy = Math.abs(y - my)
    if (dx > en || dy > boy) continue
    const uzaklik = Math.hypot(dx, dy)
    if (uzaklik < enKucuk) { enKucuk = uzaklik; enIyi = yuva }
  }
  return enIyi
}

/** VR durum panelinin metni. Sırası panelin iki düğmesiyle aynıdır. */
export const DURUM_DUGMELERI = [{ id: 'basla', ad: 'Baştan başla' }, { id: 'cik', ad: "VR'dan çık" }] as const

export function durumMetni(d: { parcalar: Parca[]; hamle: number; tutuyor: boolean; sonuc: string }) {
  const { parcalar, hamle, tutuyor, sonuc } = d
  const dugmeler = [...DURUM_DUGMELERI]
  if (tamamMi(parcalar)) return { baslik: 'Pano onarıldı!', ilerleme: '"Restoratör" rozeti kazandın', ipucu: `${hamle} hamlede tamamladın.`, dugmeler }
  const tahtada = parcalar.filter((p) => p.yuva !== null).length
  const ipucu = !tutuyor && tahtada === parcalar.length ? 'Yanlış duran ya da dönük parçaları düzelt.'
    : sonuc || (tutuyor ? 'Tetikle 90° döndür. Bırakınca en yakın yuvaya oturur.' : 'Parçayı yan tuşla (kavrama) tut, panoya götür, bırak.')
  return { baslik: 'Panoyu onar', ilerleme: `Tahtada ${tahtada}/${parcalar.length} · Hamle: ${hamle}`, ipucu, dugmeler }
}
