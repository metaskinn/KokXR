// VR'da maket birleştirmenin saf hesapları: three ve DOM kullanmaz, Node testinde doğrudan çalışır.
// Sıra yalnız maketin üst üste oturma sırasıdır (katman listesi alttan üste); tarihî inşa sırası değildir.
export type Pointed = [number, number, number]
export interface Box { min: Pointed; max: Pointed }
export interface LayerCandidate { id: number; center: Pointed; radius: number }
export type ReleaseResult = 'seated' | 'row' | 'far'

/** Katman hedefe bu kadar yakınsa oturur. Sahne birimi: rig 100× iken cm. */
export const SEAT_THRESHOLD = 18
/** Katmanlar elden geniş, raf da kol boyundan uzak: el 1 cm giderse katman 2 cm gider. */
export const HAND_GAIN = 2
/** Işın menzili (sahne birimi). */
export const RAY_RANGE = 300

// Rig başlangıç açısında kullanıcının sağı sahnede -x yönüdür: raf maketin hemen sağındadır.
const RAF_X = -85, SHELF_BASE = 18, SHELF_GAP = 10

/** Raftaki yerler (katmanın evine göre kayma). En üst katman en alt rafa gelir: maketin kendi dizilişini ele vermesin. */
export function shelfLayout(boxes: Box[]): Pointed[] {
  const result: Pointed[] = []
  let base = SHELF_BASE
  for (let id = boxes.length - 1; id >= 0; id--) {
    const { min, max } = boxes[id]
    result[id] = [RAF_X - (min[0] + max[0]) / 2, base - min[1], -(min[2] + max[2]) / 2]
    base += max[1] - min[1] + SHELF_GAP
  }
  return result
}

/** Katmanlar geniştir, kumanda çoğu zaman birinin içinde kalır: önce nişan alınan, yoksa değilen katman. Aday yoksa `null`. */
export function selectLayer(start_: Pointed, dir: Pointed, candidates: LayerCandidate[], reach = RAY_RANGE): number | null {
  let touching: number | null = null, nearestTouch = 1
  let aimed: number | null = null, bestAim = 1
  for (const { id, center, radius } of candidates) {
    const f: Pointed = [center[0] - start_[0], center[1] - start_[1], center[2] - start_[2]]
    const distance = Math.hypot(...f)
    if (distance / radius < nearestTouch) { nearestTouch = distance / radius; touching = id }
    const t = f[0] * dir[0] + f[1] * dir[1] + f[2] * dir[2]
    if (t <= 0 || t > reach) continue
    const upright = Math.sqrt(Math.max(0, distance * distance - t * t))
    if (upright / radius < bestAim) { bestAim = upright / radius; aimed = id }
  }
  return aimed ?? touching
}

/** Tutulan katmanın yeni yeri: başladığı yer, artı elin aldığı yolun kazançlısı. */
export function carriedPlace(pieceStart: Pointed, handStart: Pointed, el: Pointed, gain = HAND_GAIN): Pointed {
  return [
    pieceStart[0] + (el[0] - handStart[0]) * gain,
    pieceStart[1] + (el[1] - handStart[1]) * gain,
    pieceStart[2] + (el[2] - handStart[2]) * gain,
  ]
}

/** `oturan`: yerine oturmuş katman sayısı, aynı zamanda sıradaki katmanın kimliği. Yakında değilse sıra sorulmaz. */
export function releaseResult(id: number, seatedOne: number, distance: number, threshold = SEAT_THRESHOLD): ReleaseResult {
  if (distance >= threshold) return 'far'
  return id === seatedOne ? 'seated' : 'row'
}

export interface AssemblyText { top: string; message: string; not: string }

const ORDER_NOTE = 'Sıra, maketin üst üste oturma sırasıdır; tarihî inşa sırası değildir.'

/** Durum panelinin metni. `son` son bırakma; yoksa ipucu yazar. */
export function assemblyText(seatedOne: number, names: string[], last?: { result: ReleaseResult; id: number }): AssemblyText {
  const progress = `${seatedOne}/${names.length} katman yerinde`
  if (seatedOne >= names.length) return { top: `Tamamlandı: ${progress}`, message: 'Maket birleşti.', not: ORDER_NOTE }
  const top = `Maketi birleştir: ${progress}`
  let message = 'Kavrama tuşuyla tut, yerine götür, bırak. Menü: B veya Y.'
  if (last?.result === 'seated') message = `${names[last.id]} yerine oturdu.`
  else if (last?.result === 'row') message = `Önce ${names[seatedOne]} oturmalı. Sıra alttan üste gider.`
  else if (last?.result === 'far') message = 'Yerine yaklaşmadı. Yeniden dene.'
  return { top, message, not: ORDER_NOTE }
}
