// Ulu Camii maketinin ayrıntıları: kapılar, hat levhaları, paye yazıları, Kur'an dolapları, mahfil, kürsü.
// Kapıların ve şadırvanın ekseni, mahfilin sekiz sütunu ve kürsünün biçimi Kültür Portalı metninden;
// levha ve paye yazıları arşiv fotoğraflarının perspektifi düzeltilmiş kırpımlarıdır (scripts/levha_kirp.py).
// Levhaların hangi yüzde durduğu temsilîdir: yazılar gerçek ama konumları bire bir değildir.
import * as THREE from 'three'
import { ACIK_YAYIN } from '../../data/acikYayin'
import { kibleDuvari } from './ulucami/mihrap'
import { kabeVitrini } from './ulucami/icduvar'
import { kapilarMalzemeleri, yanKapi } from './ulucami/kapilar'
import type { UlucamiMalzemeleri } from './ulucamiDokular'
import { ahsapKursu, dolapYap, mahfilYap, mermerKursu, rahleYap, sandikYap } from './ulucami/minber'
import { doguBatiLevhalari } from './ulucami/payeler'
import {
  DUVAR, Kova, type Mal, SADIRVAN_SATIR, SADIRVAN_SUTUN, SATIR, SUTUN, YX, YZ,
  cikar, dikdortgen, dondurG, kemer, kutuG, px, pz, silindirG, yer,
} from './ulucamiParca'

const ZEMIN = 0.7
const sx = px(SADIRVAN_SUTUN + 0.5), sz = pz(SADIRVAN_SATIR + 0.5)
const MIHRAP_Z = YZ - DUVAR

export const MAHFIL = { x: sx, z: pz(2.5) - 1, enX: 3.1, enZ: 2.1 }
export const KURSU = { x: px(3) - 2.1, z: pz(3), r: 1.05 }

/** Şadırvan merkezinde birleşen kapı eksenleri: doğu ve batı kapıları şadırvanın z hizasındadır. */
export const KAPI_Z = sz

type Ekle = (g: THREE.BufferGeometry, m: Mal) => void

/** Fotoğraftan alınmış doku taşıyan malzeme. Tek yüzlüdür: arkadan bakınca yazı aynalanmış görünmez. */
function levhaDokulari() {
  const yukleyici = new THREE.TextureLoader()
  const malzeme = (ad: string) => {
    if (ACIK_YAYIN) return new THREE.MeshStandardMaterial({ color: '#c8b48a', roughness: 0.72, metalness: 0 })
    const t = yukleyici.load(`/gorseller/ulu-camii/maket/${ad}.jpg`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.72, metalness: 0 })
  }
  return {
    payeler: ['paye-1', 'paye-3', 'paye-5', 'paye-2', 'paye-6', 'paye-4'].map(malzeme),
    altin: malzeme('levha-altin'),
        madalyon: malzeme('madalyon'),
    kucuk: malzeme('levha-kucuk'),
  }
}

/** Çerçeveli duvar levhası: +z yüzü odaya bakar. */
function levha(ek: Ekle, m: UlucamiMalzemeleri, doku: Mal, g: number, h: number, cerceve: Mal = m.altinKoyu) {
  ek(kutuG(g + 0.24, h + 0.24, 0.08).translate(0, 0, 0.04), cerceve)
  ek(new THREE.PlaneGeometry(g, h).translate(0, 0, 0.09), doku)
}

export function ulucamiDetaylari(m: UlucamiMalzemeleri, k: Kova) {
  const d = levhaDokulari()
  const duvardan = (x: number, y: number, z: number, ry: number): Ekle => (g, mal) => {
    g.translate(0, y, 0)
    k.ekle(yer(g, x, 0, z, ry), mal)
  }

  // --- Duvar levhaları (güney duvarı kuzeye, doğu duvarı batıya, batı duvarı doğuya bakar) ---
  // Kıble duvarı: mihrabın üstünde yeşil levha, yanlarında oval madalyonlar ve panolar (fotoğraflara göre)
  kibleDuvari(k, MIHRAP_Z, m)
  levha(duvardan(10.2, 4.85, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[3], 2.4, 4.27, m.ceviz)
  levha(duvardan(px(3.5), 9.25, MIHRAP_Z - 0.02, Math.PI), m, d.altin, 3.1, 3.2)
  levha(duvardan(px(3.5) + 3.4, 4.6, MIHRAP_Z - 0.02, Math.PI), m, d.kucuk, 3.2, 1.7, m.ahsap)
  levha(duvardan(-12.6, 4.6, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[0], 2.5, 4.81, m.ceviz)
  levha(duvardan(px(1.5) - 3.6, 4.7, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[4], 2.3, 4.6, m.ceviz)
  levha(duvardan(px(4.5), 4.7, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[2], 2.3, 4.6, m.ceviz)
  levha(duvardan(px(0.5), 4.7, MIHRAP_Z - 0.02, Math.PI), m, d.payeler[1], 2.4, 4.6, m.ceviz)
  doguBatiLevhalari(m, k)
  kabeVitrini(k, m)
  // Yuvarlak madalyonlar: kırpımın köşeleri görünmesin diye daire biçiminde
  for (const [x, z, ry] of [[-YX + DUVAR + 0.03, pz(0.5), Math.PI / 2], [px(2.5) - 8, -YZ + DUVAR + 0.03, 0], [px(2.5) + 8, -YZ + DUVAR + 0.03, 0]]) {
    const ek = duvardan(x, 9.6, z, ry)
    ek(new THREE.TorusGeometry(1.32, 0.09, 8, 40), m.altinKoyu)
    ek(new THREE.CircleGeometry(1.3, 40).translate(0, 0, 0.03), d.madalyon)
  }

  // --- Kapılar: kuzey içi, doğu ve batı (içte ve dışta) ---
  const K = kapilarMalzemeleri(m)
  yanKapi(duvardan(0, 0, -YZ + DUVAR, 0), m, K, ZEMIN, true)
  for (const [x, ic, dis] of [[YX, -Math.PI / 2, Math.PI / 2], [-YX, Math.PI / 2, -Math.PI / 2]] as const) {
    const s = Math.sign(x)
    yanKapi(duvardan(x - s * DUVAR, 0, KAPI_Z, ic), m, K, ZEMIN, true)
    yanKapi(duvardan(x, 0, KAPI_Z, dis), m, K, 0.72, false)
    // Dış basamaklar
    for (let n = 0; n < 3; n++) {
      const der = (3 - n) * 0.75
      k.ekle(yer(kutuG(5.4 - n * 0.5, 0.24, der).translate(0, 0.12 + n * 0.24, der / 2 + 0.5), x, 0, KAPI_Z, dis), m.mermer)
    }
  }

  // --- Dolaplar, mahfil, kürsüler: ulucami/minber.ts ---
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++) {
    dolapYap(m, k, px(i), pz(j), 0, ZEMIN)
    dolapYap(m, k, px(i), pz(j), Math.PI, ZEMIN)
  }
  mahfilYap(m, k, { x: MAHFIL.x, z: MAHFIL.z, enZ: MAHFIL.enZ, zemin: ZEMIN })
  const { x: kuX, z: kuZ, r: kuR } = KURSU
  // Üst duvarın kuzeyi açık: basamaklardan çıkılan giriş.
  mermerKursu(m, k, { x: kuX, z: kuZ, r: kuR, zemin: ZEMIN, giris: 1.1 })
  ahsapKursu(m, k, ZEMIN)
  // Payeye bağlayan basamaklar
  for (let n = 0; n < 6; n++) {
    k.ekle(yer(kutuG(0.8, 0.34, 0.5), kuX, ZEMIN + 0.17 + n * 0.34, kuZ - kuR - 1.6 + n * 0.32), m.icMermer)
    k.ekle(yer(kutuG(0.8, n * 0.34 + 0.02, 0.5), kuX, ZEMIN + (n * 0.34) / 2, kuZ - kuR - 1.6 + n * 0.32), m.mermerKoyu)
  }

  // --- Ahşap sandıklar (musluk ve lüleler ulucami/sadirvan.ts'te) ---
  for (const [x, z] of [[sx - 4.3, sz - 4.3], [sx + 4.3, sz - 4.3], [sx - 4.3, sz + 4.3], [sx + 4.3, sz + 4.3]]) sandikYap(m, k, x, z, z < sz ? 1 : -1, ZEMIN)
}
