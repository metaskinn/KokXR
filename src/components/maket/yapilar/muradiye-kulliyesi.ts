// II. Murad (Muradiye) Külliyesi temsilî maketi. Cami içiyle, diğer yapılar dış kütle olarak modellenir.
// Biçim ve ölçü kaynakları: Vakıf Eserleri Envanteri – Bursa, II. Murad Külliyesi (s. 111-160). Bu kaynakta plan çizimi yoktur;
// yerleşim s. 113'teki kuşbakışı fotoğraftan okunmuştur. Gerçek bir 3B tarama değildir.
import * as THREE from 'three'
import { Kova, kutuG, yer } from '../ulucamiParca'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import type { Maket } from '../ulucamiMaket'
import { cami, camiDuraklari, camiYurumesi } from './muradiye-kulliyesi-parcalar/cami'
import { muradiyeMalzemeleri } from './muradiye-kulliyesi-parcalar/dokular'
import { kulliye } from './muradiye-kulliyesi-parcalar/kulliye'

/** Plan koordinatı (cami ortada) ile sahne koordinatı arası: külliye kaidenin ortasına oturur. */
const OX = 28, OZ = -13
const KAIDE = 92

export const yapi = (): Maket => {
  const m = ulucamiMalzemeleri()
  const d = muradiyeMalzemeleri()
  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()

  // Avlu döşemesi: kaideyi örter (plan koordinatında merkezi kaymış daire).
  const avlu = new THREE.CircleGeometry(KAIDE, 96).rotateX(-Math.PI / 2).translate(-OX, 0.01, -OZ)
  const p = avlu.attributes.position, uv = avlu.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.ekle(avlu, m.doseme)
  k.ekle(yer(kutuG(0.01, 0.01, 0.01), -OX, -1, -OZ), m.doseme)

  cami(m, d, k, kCati, kKasnak, kKubbe)
  kulliye(m, d, k, kCati, kKasnak, kKubbe)

  const kok = k.grup()
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  kok.add(catiGrup, kasnakGrup, kubbeGrup)
  // Tüm geometri tek seferde sahne koordinatına alınır; katmanlar dokunulmadan kalır.
  kok.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.translate(OX, 0, OZ) })

  return {
    kok,
    katmanlar: [
      { grup: catiGrup, yukseklik: 14, ad: 'Çatılar' },
      { grup: kasnakGrup, yukseklik: 24, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 36, ad: 'Kubbeler' },
    ],
    duraklar: camiDuraklari(OX, OZ),
    yurume: camiYurumesi(OX, OZ),
    kamera: { konum: [OX + 62, 58, OZ - 118], hedef: [OX - 8, 8, OZ + 6] },
    kaideYaricap: KAIDE,
    // Harim, avlu ve iki eyvan: tepeye yakın.
    icIsiklar: [[OX, 12, OZ + 11], [OX, 12, OZ - 1.6], [OX + 10, 8, OZ - 1.6], [OX - 10, 8, OZ - 1.6]],
  }
}

