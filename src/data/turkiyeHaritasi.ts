// VR Eserler haritasının veri modeli ve yükleyicisi. Geometri `harita/*.json`, kabartma `harita/*-kabartma.webp`:
// ikisi de repoya gömülüdür, internet istemez ve yalnız gereken harita açılınca yüklenir. Kaynak ve lisans: harita/KAYNAK.md
import kabartmaTurkiye from './harita/turkiye-kabartma.webp'
import kabartmaBursa from './harita/bursa-kabartma.webp'
import kabartmaKonya from './harita/konya-kabartma.webp'
import kabartmaHatay from './harita/hatay-kabartma.webp'

export type HaritaKimlik = 'turkiye' | 'bursa' | 'konya' | 'hatay'

export interface HaritaEtiket { ad: string; x: number; y: number; tur: string; z?: number; alt?: string }
export interface HaritaVerisi {
  id: HaritaKimlik
  ad: string
  cerceve: { bati: number; dogu: number; guney: number; kuzey: number }
  g: number
  y: number
  zEnCok: number
  atif: string[]
  katman: Record<string, string>
  etiket: HaritaEtiket[]
}

const YUKLEYICI: Record<HaritaKimlik, () => Promise<{ default: unknown }>> = {
  turkiye: () => import('./harita/turkiye.json'),
  bursa: () => import('./harita/bursa.json'),
  konya: () => import('./harita/konya.json'),
  hatay: () => import('./harita/hatay.json'),
}

export const KABARTMA: Record<HaritaKimlik, string> = { turkiye: kabartmaTurkiye, bursa: kabartmaBursa, konya: kabartmaKonya, hatay: kabartmaHatay }

export const haritaYukle = async (k: HaritaKimlik) => (await YUKLEYICI[k]()).default as HaritaVerisi

const mx = (lon: number) => (lon + 180) / 360
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2

/** Boylam/enlemi harita birimine çevirir (Web Mercator, veriyle aynı izdüşüm). */
export function haritaNoktasi(v: HaritaVerisi, [lon, lat]: [number, number]) {
  const c = v.cerceve, k = v.g / (mx(c.dogu) - mx(c.bati))
  return { x: (mx(lon) - mx(c.bati)) * k, y: (my(lat) - my(c.kuzey)) * k }
}

/**
 * Birbirine binen işaretleri, dokunma hedefleri çakışmayacak kadar ayırır ve çerçevede tutar.
 * Yapının gerçek yeri ayrıca noktayla gösterilir; işaret kaydıysa çizgiyle bağlanır.
 */
export function isaretleriAyir(noktalar: { x: number; y: number }[], g: number, y: number, aralik = 46, pay = 24) {
  const s = noktalar.map((n) => ({ x: n.x, y: n.y }))
  // Sıkışık öbek önce merkezinden açılır: işaretler birbirine göre yönünü korur (doğudaki yapı doğuda kalır).
  const grup = s.map((_, i) => i)
  const kok = (i: number): number => (grup[i] === i ? i : (grup[i] = kok(grup[i])))
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (Math.hypot(s[i].x - s[j].x, s[i].y - s[j].y) < aralik) grup[kok(i)] = kok(j)
  for (const r of new Set(s.map((_, i) => kok(i)))) {
    const uye = s.filter((_, i) => kok(i) === r)
    if (uye.length < 2) continue
    const ox = uye.reduce((t, n) => t + n.x, 0) / uye.length, oy = uye.reduce((t, n) => t + n.y, 0) / uye.length
    const yaricap = Math.max(...uye.map((n) => Math.hypot(n.x - ox, n.y - oy)), 1)
    const k = Math.max(1, Math.min(5, (aralik * Math.sqrt(uye.length) * 0.75) / yaricap))
    for (const n of uye) { n.x = ox + (n.x - ox) * k; n.y = oy + (n.y - oy) * k }
  }
  const sinirla = (n: { x: number; y: number }) => {
    n.x = Math.max(pay, Math.min(g - pay, n.x))
    n.y = Math.max(pay, Math.min(y - pay, n.y))
    // Sağ üstteki yakınlaştırma düğmelerinin altına girmesin.
    if (n.x > g - 76 && n.y < 150) n.y = 150
  }
  s.forEach(sinirla)
  for (let tur = 0; tur < 80; tur++) {
    let kaydi = false
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      let dx = s[j].x - s[i].x, dy = s[j].y - s[i].y, d = Math.hypot(dx, dy)
      if (d >= aralik) continue
      if (d < 0.01) { const a = (i + j) * 2.399963; dx = Math.cos(a); dy = Math.sin(a); d = 1 }
      const it = (aralik - d) / 2 + 0.2
      s[i].x -= (dx / d) * it; s[i].y -= (dy / d) * it
      s[j].x += (dx / d) * it; s[j].y += (dy / d) * it
      kaydi = true
    }
    s.forEach(sinirla)
    if (!kaydi) break
  }
  return s
}
