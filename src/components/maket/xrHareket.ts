// VR hareket hesapları; three ve DOM kullanmaz, Node testinde doğrudan çalışır.
export interface Duzlem { x: number; z: number }
export interface RigKonumu { x: number; y: number; z: number; rotY: number }
export interface KumandaKaynagi { handedness: string; gamepad?: { axes: readonly number[]; buttons: readonly { pressed: boolean }[] } }
export interface KumandaGirdisi { solX: number; solY: number; sagX: number; sagY: number; menu: boolean }

export const XR_YURUME_HIZI = 1.6 // m/sn
export const XR_DONUS_HIZI = Math.PI / 4 // rad/sn, çubuk tam itilince
export const MASA_Y = 0.9, MASA_UZAKLIK = 1.2
export const MASA_OLCEK_ILK = 100, MASA_OLCEK_MIN = 40, MASA_OLCEK_MAX = 200
const OLU_BOLGE = 0.2, EN_UZUN_DT = 0.1

/** Joystick kaymasını keser; kalan aralığı 0-1'e yayar, işareti korur. */
export function oluBolge(d: number): number {
  const m = Math.abs(d)
  if (m < OLU_BOLGE) return 0
  return Math.sign(d) * Math.min(1, (m - OLU_BOLGE) / (1 - OLU_BOLGE))
}

/** Yeni baş konumu. Ölü bölge burada uygulanır; çubuk ham verilir. cubuk.y < 0 ileridir (WebXR). Eksen eksen denenerek duvar boyunca kayılır. */
export function yurumeAdimi(bas: Duzlem, ileriYon: Duzlem, cubuk: { x: number; y: number }, dt: number, engel: (x: number, z: number) => boolean): Duzlem {
  const boy = Math.hypot(ileriYon.x, ileriYon.z)
  if (!boy) return { x: bas.x, z: bas.z } // tam yukarı veya aşağı bakarken yön belirsiz
  const ix = ileriYon.x / boy, iz = ileriYon.z / boy
  let sag = oluBolge(cubuk.x), ileri = -oluBolge(cubuk.y)
  const guc = Math.hypot(sag, ileri)
  if (guc > 1) { sag /= guc; ileri /= guc } // çapraz itiş daha hızlı olmasın
  const adim = XR_YURUME_HIZI * Math.min(dt, EN_UZUN_DT)
  const dx = (ix * ileri - iz * sag) * adim, dz = (iz * ileri + ix * sag) * adim
  let { x, z } = bas
  if (!engel(x + dx, z)) x += dx
  if (!engel(x, z + dz)) z += dz
  return { x, z }
}

/** Bu karede dönülecek açı: çubuğun itildiği kadar. Y çevresinde artı yön sola döndürür; sağa itiş sağa çevirsin diye işaret ters. */
export function yumusakDonus(sagX: number, dt: number): number {
  return -oluBolge(sagX) * XR_DONUS_HIZI * Math.min(dt, EN_UZUN_DT)
}

/** Rig `aci` kadar dönerken başın dünyadaki yeri sabit kalsın diye rig'in yeni x/z'si. */
export function basCevresindeDon(rig: Duzlem, bas: Duzlem, aci: number): Duzlem {
  const c = Math.cos(aci), s = Math.sin(aci), dx = rig.x - bas.x, dz = rig.z - bas.z
  return { x: dx * c + dz * s + bas.x, z: -dx * s + dz * c + bas.z }
}

/** Maket görünümü: dünya masa boyutunda görünsün diye rig `olcek` kat büyür, maket önde ve masa yüksekliğinde kalır. */
export function masaRig(aci: number, olcek: number): RigKonumu {
  const D = MASA_UZAKLIK * olcek
  return { x: D * Math.sin(aci), y: -MASA_Y * olcek, z: -D * Math.cos(aci), rotY: Math.PI - aci }
}

/** İç mekân durağı (1× ölçek): başı `konum`un x/z'sine getirir, bakışı `bak`a çevirir. `basYaw` başın rig içindeki yatay yönüdür. */
export function durakRig(konum: number[], bak: number[], basYerel: Duzlem, zeminY: number, basYaw = 0): RigKonumu {
  const rotY = Math.atan2(-(bak[0] - konum[0]), -(bak[2] - konum[2])) - basYaw
  const c = Math.cos(rotY), s = Math.sin(rotY)
  return { x: konum[0] - (basYerel.x * c + basYerel.z * s), y: zeminY, z: konum[2] - (-basYerel.x * s + basYerel.z * c), rotY }
}

/** Bilgi başlığı bu yatay uzaklıkların dışında gösterilmez: üstünde durulan başlık yüze yapışır, uzaktaki okunmaz. */
export const BASLIK_YAKIN = 1.5, BASLIK_UZAK = 32
const BASLIK_PAY = 0.5, BASLIK_INIS = 10

/** Bilgi başlığının yeri: başa dönük, uzaklıkla büyür ki okunsun. Yaklaştıkça göz hizasına iner, altında duran da nişan alabilsin; duvara gömülmesin diye başa doğru çekilir. */
export function baslikYeri(konum: number[], bas: { x: number; y: number; z: number }) {
  const dx = bas.x - konum[0], dz = bas.z - konum[2], yatay = Math.hypot(dx, dz)
  const y = bas.y + (konum[1] - bas.y) * Math.max(0.25, Math.min(1, yatay / BASLIK_INIS))
  const pay = yatay > BASLIK_PAY ? BASLIK_PAY / yatay : 0
  const olcek = Math.max(0.6, Math.min(2.4, Math.hypot(yatay, y - bas.y) / 5))
  return { x: konum[0] + dx * pay, y, z: konum[2] + dz * pay, rotY: Math.atan2(dx, dz), olcek, yatay }
}

/** (-π, π] aralığına indirir. */
function aciSar(a: number): number {
  const t = 2 * Math.PI, s = ((a % t) + t) % t
  return s > Math.PI ? s - t : s
}

/** Panelin başa göre yatay açısı: istenen yön diğer panelle örtüşürse diğerinin yanına kayar, ışın ikisine de ulaşır. Tam üst üste gelince `yon` karar verir (+1 sol). */
export function ortusmeyenAci(istenen: number, diger: number, ayrim: number, yon: 1 | -1): number {
  const fark = aciSar(istenen - diger)
  if (Math.abs(fark) >= ayrim) return istenen
  return diger + (fark === 0 ? yon : Math.sign(fark)) * ayrim
}

/** Quest'te çubuk axes[2], axes[3]; menü buttons[5] (B/Y). Çubuğu okunan tek kumanda varsa iki el de onu kullanır; yana itişi yalnız dönüştür, kaydırmaz. */
export function kumandaGirdisi(kaynaklar: Iterable<KumandaKaynagi>): KumandaGirdisi {
  const g: KumandaGirdisi = { solX: 0, solY: 0, sagX: 0, sagY: 0, menu: false }
  const cubuklu: KumandaKaynagi[] = []
  for (const k of kaynaklar) {
    if (k.gamepad?.buttons[5]?.pressed) g.menu = true
    if (k.gamepad && k.gamepad.axes.length >= 4) cubuklu.push(k)
  }
  for (const k of cubuklu) {
    const x = k.gamepad!.axes[2], y = k.gamepad!.axes[3]
    if (cubuklu.length === 1) g.solY = y
    else if (k.handedness === 'left') { g.solX = x; g.solY = y }
    if (cubuklu.length === 1 || k.handedness === 'right') { g.sagX = x; g.sagY = y }
  }
  return g
}
