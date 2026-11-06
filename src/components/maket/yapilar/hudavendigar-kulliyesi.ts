// I. Murad Hudâvendigâr Külliyesi temsilî maketi. Cami içiyle modellenir; imaret, hamam, türbe ve şadırvan dış kütledir.
// Birim metre. Kuzey = -z, kıble (güney) = +z, doğu = +x. Ölçüler: yapilar/hudavendigar-kulliyesi-parca/plan.ts.
import type { Maket } from '../ulucamiMaket'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import { Kova } from '../ulucamiParca'
import { camiKur } from './hudavendigar-kulliyesi-parca/cami'
import { KAIDE_R, cevreKur } from './hudavendigar-kulliyesi-parca/cevre'
import { kulliyeMalzemeleri } from './hudavendigar-kulliyesi-parca/dokular'
import { SAD_Z, duraklar, yurumeAlani } from './hudavendigar-kulliyesi-parca/plan'

export const yapi = (): Maket => {
  const m = ulucamiMalzemeleri()
  const x = kulliyeMalzemeleri(m)
  const k = new Kova(), kUst = new Kova(), kCati = new Kova(), kKubbe = new Kova()
  cevreKur(m, x, k)
  camiKur(m, x, k, kUst, kCati, kKubbe)
  const kok = k.grup()
  const ust = kUst.grup(), cati = kCati.grup(), kubbe = kKubbe.grup()
  kok.add(ust, cati, kubbe)
  return {
    kok,
    katmanlar: [
      { grup: ust, yukseklik: 16, ad: 'Medrese katı' },
      { grup: cati, yukseklik: 32, ad: 'Çatı' },
      { grup: kubbe, yukseklik: 44, ad: 'Kubbe' },
    ],
    duraklar,
    yurume: yurumeAlani(),
    // Açılış kuzeydoğudan: iki katlı cephe ve minare fotoğraftaki gibi önde görünür.
    kamera: { konum: [66, 40, -92], hedef: [0, 9, -6] },
    kaideYaricap: KAIDE_R,
    icIsiklar: [[0, 11.5, SAD_Z], [0, 8.5, 12], [0, 5.5, -13.5], [0, 5, -20.7]],
  }
}
