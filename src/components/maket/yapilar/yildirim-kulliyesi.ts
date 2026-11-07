// Yıldırım Külliyesi temsilî maketi: cami içiyle, diğer yapılar dış kütle olarak.
// Kaynak ölçüler parça dosyalarının başında yazılıdır. Gerçek bir 3B tarama değildir.
import * as THREE from 'three'
import { Kova } from '../ulucamiParca'
import type { Maket } from '../ulucamiMaket'
import type { IcDurak, IcYurume } from '../ulucamiIc'
import { GOZ_Y, TABAN, cami } from './yildirim-kulliyesi-parcalar/cami'
import { darussifa, medrese, sadirvanKosku, site, turbe } from './yildirim-kulliyesi-parcalar/diger'
import { yildirimMalzemeleri } from './yildirim-kulliyesi-parcalar/ortak'

/** Yapılar kuzeye doğru uzanır; kaideye ortalamak için hepsi güneye kaydırılır. */
const OZ = 16
const KAIDE = 90

export const yapi = (): Maket => {
  const m = yildirimMalzemeleri()
  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()
  const yurume0 = cami(m, k, kCati, kKasnak, kKubbe)
  turbe(m, k, kCati, kKasnak, kKubbe)
  medrese(m, k, kCati, kKasnak, kKubbe)
  darussifa(m, k, kCati, kKasnak, kKubbe)
  sadirvanKosku(m, k, kKubbe, -2.2, -27)
  site(m, k, KAIDE, OZ)

  const kok = k.grup()
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  kok.add(catiGrup, kasnakGrup, kubbeGrup)
  // Tüm geometri kaideye ortalanır.
  for (const g of [kok, catiGrup, kasnakGrup, kubbeGrup]) {
    g.children.forEach((c) => { if (c instanceof THREE.Mesh) c.geometry.translate(0, 0, OZ) })
  }

  const kay = (z: number) => z + OZ
  const yurume: IcYurume = {
    ...yurume0,
    sinir: { ...yurume0.sinir, z0: kay(yurume0.sinir.z0), z1: kay(yurume0.sinir.z1) },
    kutular: yurume0.kutular.map((b) => ({ ...b, z0: kay(b.z0), z1: kay(b.z1) })),
    zeminler: yurume0.zeminler.map((b) => ({ ...b, z0: kay(b.z0), z1: kay(b.z1) })),
    gorusKesenler: yurume0.gorusKesenler.map((b) => ({ ...b, z0: kay(b.z0), z1: kay(b.z1) })),
    daireler: yurume0.daireler.map((d) => ({ ...d, z: kay(d.z) })),
  }

  const G = GOZ_Y
  const durak = (id: string, ad: string, x: number, y: number, z: number, bx: number, by: number, bz: number): IcDurak =>
    ({ id, ad, konum: [x, y, kay(z)], bak: [bx, by, kay(bz)] })
  const duraklar: IcDurak[] = [
    durak('harim', 'Harim', 0, G, -3.2, 0, 5, 12),
    durak('revak', 'Son cemaat yeri', 12.8, G + 0.5, -16.7, -10, 5.2, -16.7),
    durak('kubbe', 'Orta kubbe', 0, G, -1.2, 0, 21, -1.9),
    durak('eyvan', 'Doğu eyvanı', 8.6, G + 0.4, -4.6, 15.2, 4.5, -4.6),
    durak('tabhane', 'Tabhane', 9, G, 2.4, 12, TABAN + 2.2, 6.4),
    durak('mihrap', 'Mihrap', 0, G + 0.4, 8.5, 0, 6, 17.3),
    durak('minber', 'Minber', -2.1, G + 0.4, 12.4, -4.75, 3.8, 15.6),
    durak('mahfil', 'Mahfil', -4.2, G + 2.9, -6.9, 2.5, 5.4, 8),
  ]

  return {
    kok,
    katmanlar: [
      { grup: catiGrup, yukseklik: 22, ad: 'Çatılar' },
      { grup: kasnakGrup, yukseklik: 34, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 46, ad: 'Kubbeler' },
    ],
    duraklar,
    yurume,
    kamera: { konum: [66, 58, -128], hedef: [-3, 8, -8] },
    kaideYaricap: KAIDE,
    icIsiklar: [[0, 8.5, kay(-1.9)], [0, 8.5, kay(11.5)], [11.7, 6.5, kay(-4.6)], [-11.7, 6.5, kay(-4.6)]],
  }
}
