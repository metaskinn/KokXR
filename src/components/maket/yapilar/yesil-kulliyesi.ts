// Yeşil Çelebi Mehmed Külliyesi temsili maketi. Kubbe ölçüleri, mekân dizilişi ve külliye yapılarının ölçüleri
// envanterden (Bursa II, s. 88-138); oranlar kitaptaki drone fotoğrafından (s. 85) yorumlanmıştır. Birim metre.
// Kuzey = -z, kıble (güney) = +z, doğu = +x. Yapıların birbirine uzaklığı maket içinde kısaltılmıştır.
import * as THREE from 'three'
import { ulucamiMalzemeleri } from '../ulucamiDokular'
import type { Maket } from '../ulucamiMaket'
import { Kova, kutuG, yer } from '../ulucamiParca'
import { yesilMalzemeleri } from './yesil-kulliyesi-parca/dokular'
import { camiDisi, XD, ZK } from './yesil-kulliyesi-parca/dis'
import { camiDuraklari, camiIci, camiYurumeAlani, EYVAN_X, EYVAN_Z, MIHRAP_Z, ORTA_Z } from './yesil-kulliyesi-parca/ic'
import { agac, avluSadirvani, yesilImaret, yesilMedrese, yesilTurbe } from './yesil-kulliyesi-parca/kulliye'

const KAIDE = 88

export const yapi = (): Maket => {
  const m = ulucamiMalzemeleri()
  const ym = yesilMalzemeleri()
  const k = new Kova(), kCati = new Kova(), kKasnak = new Kova(), kKubbe = new Kova()

  // --- Zemin: taş döşeli kaide, kuzey avlusu ve yeşil alanlar ---
  const avlu = new THREE.CircleGeometry(KAIDE - 0.5, 96).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const ap = avlu.attributes.position, au = avlu.attributes.uv
  for (let i = 0; i < au.count; i++) au.setXY(i, ap.getX(i), ap.getZ(i))
  k.ekle(avlu, m.doseme)
  const cimAlan = (x0: number, x1: number, z0: number, z1: number) =>
    k.ekle(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0.04, (z0 + z1) / 2), ym.cim)
  // Cephe önü bahçeler (s. 85): giriş yolunun iki yanında
  cimAlan(-XD + 1, -5, ZK - 8, ZK - 0.3); cimAlan(5, XD - 1, ZK - 8, ZK - 0.3)
  // Yeşil bant: yapılar arası
  cimAlan(-36, -22, -30, 28); cimAlan(22, 30, -28, 18); cimAlan(-18, 22, 28, 34)
  cimAlan(-34, -18, 36, 66); cimAlan(26, 60, 40, 62)
  k.ekle(yer(kutuG(0.3, 0.4, 7.7), -5, 0.2, ZK - 4.1), m.mermer)
  k.ekle(yer(kutuG(0.3, 0.4, 7.7), 5, 0.2, ZK - 4.1), m.mermer)

  camiIci(m, ym, k, kKasnak, kKubbe)
  camiDisi(m, ym, k, kCati, kKasnak, kKubbe)

  // --- Külliye: güneyde türbe, batıda medrese, güneydoğuda imaret, kuzey avlusunda şadırvan (s. 110, 119, 123, 137) ---
  yesilTurbe(m, ym, k, kKasnak, kKubbe, 3, 54)
  yesilMedrese(m, ym, k, kCati, kKasnak, kKubbe, -57, -9)
  yesilImaret(m, ym, k, kCati, kKubbe, 32, 24)
  avluSadirvani(m, ym, k, kKubbe, 0, -44)

  // Çınar ve selvi izlenimi (Evliya Çelebi'nin anlattığı çınarlı avlu, s. 113; konumlar temsilî)
  const agaclar: [number, number, number][] = [
    [-22, -46, 11], [24, -48, 12], [-28, -22, 10], [31, -26, 11], [44, -10, 10], [36, 6, 9],
    [-24, 36, 10], [26, 44, 9], [-30, 58, 9], [48, 58, 9],
  ]
  agaclar.forEach(([x, z, b], i) => agac(m, ym, k, x, z, b, i + 1))

  const kok = k.grup()
  const catiGrup = kCati.grup(), kasnakGrup = kKasnak.grup(), kubbeGrup = kKubbe.grup()
  kok.add(catiGrup, kasnakGrup, kubbeGrup)
  return {
    kok,
    katmanlar: [
      { grup: catiGrup, yukseklik: 22, ad: 'Çatı' },
      { grup: kasnakGrup, yukseklik: 32, ad: 'Kasnaklar' },
      { grup: kubbeGrup, yukseklik: 42, ad: 'Kubbeler' },
    ],
    duraklar: camiDuraklari,
    yurume: camiYurumeAlani(),
    kamera: { konum: [66, 50, -108], hedef: [0, 8, 2] },
    kaideYaricap: KAIDE,
    icIsiklar: [[0, 11, ORTA_Z], [0, 12, MIHRAP_Z - 2], [EYVAN_X, 7, EYVAN_Z], [-EYVAN_X, 7, EYVAN_Z]],
  }
}

