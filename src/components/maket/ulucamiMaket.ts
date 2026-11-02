// Ulu Camii temsili maketi. Plan ölçüleri ve kubbe/paye düzeni envanterden (s. 44, 46, 60, 63);
// yükseklikler, pencere ve kapı ayrıntıları temsilidir. Birim: metre. Kuzey = -z, kıble (güney) = +z.
import * as THREE from 'three'

const DOGU_BATI = 69, KUZEY_GUNEY = 55
const SUTUN = 5, SATIR = 4
const GOZ_X = DOGU_BATI / SUTUN, GOZ_Z = KUZEY_GUNEY / SATIR
const DUVAR_YUKSEKLIK = 13, DUVAR_KALINLIK = 2
const KUBBE_YARICAP = 5.5, KASNAK_YUKSEKLIK = 2.2
const SADIRVAN_SUTUN = 2, SADIRVAN_SATIR = 1

export interface Maket { kok: THREE.Group; cati: THREE.Group }

function malzeme(renk: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color: renk, roughness: 0.85, metalness: 0, ...extra })
}

export function ulucamiMaketi(): Maket {
  const tas = malzeme('#d9ccb1'), kursun = malzeme('#9ba6ad', { roughness: 0.5, metalness: 0.35 })
  const mermer = malzeme('#ece8df', { roughness: 0.6 }), tugla = malzeme('#a65a3d'), koyu = malzeme('#3b3027')
  const su = malzeme('#5aa3b8', { roughness: 0.2, metalness: 0.1 }), zemin = malzeme('#c9bfa9')

  const kok = new THREE.Group()
  const kutu = (g: number, y: number, d: number, m: THREE.Material, x: number, yy: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(g, y, d), m)
    mesh.position.set(x, yy, z); mesh.castShadow = true; mesh.receiveShadow = true
    return mesh
  }

  // Zemin döşemesi ve beden duvarları
  kok.add(kutu(DOGU_BATI, 0.4, KUZEY_GUNEY, zemin, 0, 0.2, 0))
  const yx = DOGU_BATI / 2, yz = KUZEY_GUNEY / 2, h = DUVAR_YUKSEKLIK
  kok.add(kutu(DOGU_BATI, h, DUVAR_KALINLIK, tas, 0, h / 2, -yz))
  kok.add(kutu(DOGU_BATI, h, DUVAR_KALINLIK, tas, 0, h / 2, yz))
  kok.add(kutu(DUVAR_KALINLIK, h, KUZEY_GUNEY, tas, -yx, h / 2, 0))
  kok.add(kutu(DUVAR_KALINLIK, h, KUZEY_GUNEY, tas, yx, h / 2, 0))

  // İki sıra pencere (temsili yerleşim)
  const pencere = (x: number, y: number, z: number, yanda: boolean) =>
    kok.add(kutu(yanda ? 0.3 : 1.6, 2.6, yanda ? 1.6 : 0.3, koyu, x, y, z))
  for (const satirY of [3.2, 8.6]) {
    for (let i = 0; i < SUTUN; i++) for (const k of [-0.25, 0.25]) {
      const x = -yx + GOZ_X * (i + 0.5 + k)
      pencere(x, satirY, -yz - DUVAR_KALINLIK / 2, false); pencere(x, satirY, yz + DUVAR_KALINLIK / 2, false)
    }
    for (let i = 0; i < SATIR; i++) for (const k of [-0.25, 0.25]) {
      const z = -yz + GOZ_Z * (i + 0.5 + k)
      pencere(-yx - DUVAR_KALINLIK / 2, satirY, z, true); pencere(yx + DUVAR_KALINLIK / 2, satirY, z, true)
    }
  }

  // Kuzey cephesinde taç kapı
  kok.add(kutu(8, 11, 1.6, mermer, 0, 5.5, -yz - 1.4))
  kok.add(kutu(3.4, 6, 0.4, koyu, 0, 3.4, -yz - 2.3))

  // On iki kare paye (iç kesişimler: 4 × 3)
  for (let i = 1; i < SUTUN; i++) for (let j = 1; j < SATIR; j++)
    kok.add(kutu(3, h, 3, mermer, -yx + GOZ_X * i, h / 2, -yz + GOZ_Z * j))

  // Şadırvan havuzu (açık kubbenin altında)
  const sx = -yx + GOZ_X * (SADIRVAN_SUTUN + 0.5), sz = -yz + GOZ_Z * (SADIRVAN_SATIR + 0.5)
  const havuz = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1, 16), mermer); havuz.position.set(sx, 0.9, sz); kok.add(havuz)
  const suYuzu = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.2, 16), su); suYuzu.position.set(sx, 1.35, sz); kok.add(suYuzu)
  const selsebil = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 3, 12), mermer); selsebil.position.set(sx, 2.4, sz); kok.add(selsebil)

  // Çatı: döşeme, kasnaklar, kubbeler, alemler — "Parçala" ile birlikte kalkar
  const cati = new THREE.Group()
  const doseme = new THREE.Shape()
  doseme.moveTo(-yx - 1, -yz - 1); doseme.lineTo(yx + 1, -yz - 1); doseme.lineTo(yx + 1, yz + 1); doseme.lineTo(-yx - 1, yz + 1)
  const delik = new THREE.Path(); delik.absarc(sx, -sz, 2.2, 0, Math.PI * 2, true); doseme.holes.push(delik)
  const catiDoseme = new THREE.Mesh(new THREE.ExtrudeGeometry(doseme, { depth: 1, bevelEnabled: false }), tas)
  catiDoseme.rotation.x = -Math.PI / 2; catiDoseme.position.y = h; catiDoseme.castShadow = true; catiDoseme.receiveShadow = true
  cati.add(catiDoseme)
  for (let i = 0; i < SUTUN; i++) for (let j = 0; j < SATIR; j++) {
    const x = -yx + GOZ_X * (i + 0.5), z = -yz + GOZ_Z * (j + 0.5)
    const acik = i === SADIRVAN_SUTUN && j === SADIRVAN_SATIR
    const kasnak = new THREE.Mesh(new THREE.CylinderGeometry(KUBBE_YARICAP + 0.4, KUBBE_YARICAP + 0.6, KASNAK_YUKSEKLIK, 8, 1, acik), tas)
    kasnak.position.set(x, h + 1 + KASNAK_YUKSEKLIK / 2, z); kasnak.castShadow = true; cati.add(kasnak)
    // Açık kubbe: tepesinde ışık ve hava için boşluk bırakılır
    const kubbe = new THREE.Mesh(new THREE.SphereGeometry(KUBBE_YARICAP, 32, 16, 0, Math.PI * 2, acik ? 0.32 : 0, Math.PI / 2 - (acik ? 0.32 : 0)), kursun)
    kubbe.material = acik ? kursun.clone() : kursun
    if (acik) (kubbe.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
    kubbe.position.set(x, h + 1 + KASNAK_YUKSEKLIK, z); kubbe.castShadow = true; cati.add(kubbe)
    if (!acik) {
      const alem = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.4, 8), malzeme('#c9a24a', { metalness: 0.6, roughness: 0.35 }))
      alem.position.set(x, h + 1 + KASNAK_YUKSEKLIK + KUBBE_YARICAP + 0.6, z); cati.add(alem)
    }
  }
  kok.add(cati)

  // Kuzey köşelerinde iki minare: mermer kaide ve küp, tuğla gövde, taş külah (yükseklikler temsilî)
  for (const x of [-yx - 3, yx + 3]) {
    const minare = new THREE.Group()
    minare.add(kutu(5, 12, 5, mermer, 0, 6, 0))
    const govde = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 26, 20), tugla); govde.position.y = 25; govde.castShadow = true; minare.add(govde)
    const serefe = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2, 1.6, 20), mermer); serefe.position.y = 33; minare.add(serefe)
    const kulah = new THREE.Mesh(new THREE.ConeGeometry(1.8, 7, 20), mermer); kulah.position.y = 41.5; minare.add(kulah)
    minare.position.set(x, 0, -yz + 3)
    kok.add(minare)
  }

  kok.traverse((o) => { if (o instanceof THREE.Mesh) o.receiveShadow = true })
  return { kok, cati }
}
