// Yeşil Çelebi Mehmed Külliyesi temsili maketi. Kubbe ölçüleri, mekân dizilişi ve külliye yapılarının ölçüleri
// envanterden (Bursa II, s. 88-138); oranlar kitaptaki drone fotoğrafından (s. 85) yorumlanmıştır. Birim metre.
// Kuzey = -z, kıble (güney) = +z, doğu = +x. Yapıların birbirine uzaklığı maket içinde kısaltılmıştır.
import * as THREE from 'three'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import type { Model } from '../uluMosqueModel'
import { Bucket, boxG, place } from '../uluMosquePiece'
import { greenMaterials } from './yesil-complex-piece/textures'
import { mosqueExterior, XD, ZK } from './yesil-complex-piece/outer'
import { mosqueStops, mosqueInterior, mosqueWalkArea, IWAN_X, IWAN_Z, MIHRAB_Z, MID_Z } from './yesil-complex-piece/interior'
import { tree, courtyardFountain, greenImaret, greenMadrasa, greenTomb } from './yesil-complex-piece/complex'

const PEDESTAL = 88

export const building = (): Model => {
  const m = uluMosqueMaterials()
  const ym = greenMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()

  // --- Zemin: taş döşeli kaide, kuzey avlusu ve yeşil alanlar ---
  const courtyard = new THREE.CircleGeometry(PEDESTAL - 0.5, 96).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const ap = courtyard.attributes.position, au = courtyard.attributes.uv
  for (let i = 0; i < au.count; i++) au.setXY(i, ap.getX(i), ap.getZ(i))
  k.add(courtyard, m.paving)
  const grassArea = (x0: number, x1: number, z0: number, z1: number) =>
    k.add(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0.04, (z0 + z1) / 2), ym.grass)
  // Cephe önü bahçeler (s. 85): giriş yolunun iki yanında
  grassArea(-XD + 1, -5, ZK - 8, ZK - 0.3); grassArea(5, XD - 1, ZK - 8, ZK - 0.3)
  // Yeşil bant: yapılar arası
  grassArea(-36, -22, -30, 28); grassArea(22, 30, -28, 18); grassArea(-18, 22, 28, 34)
  grassArea(-34, -18, 36, 66); grassArea(26, 60, 40, 62)
  k.add(place(boxG(0.3, 0.4, 7.7), -5, 0.2, ZK - 4.1), m.marble)
  k.add(place(boxG(0.3, 0.4, 7.7), 5, 0.2, ZK - 4.1), m.marble)

  mosqueInterior(m, ym, k, kDrum, kDome)
  mosqueExterior(m, ym, k, kRoof, kDrum, kDome)

  // --- Külliye: güneyde türbe, batıda medrese, güneydoğuda imaret, kuzey avlusunda şadırvan (s. 110, 119, 123, 137) ---
  greenTomb(m, ym, k, kDrum, kDome, 3, 54)
  greenMadrasa(m, ym, k, kRoof, kDrum, kDome, -57, -9)
  greenImaret(m, ym, k, kRoof, kDome, 32, 24)
  courtyardFountain(m, ym, k, kDome, 0, -44)

  // Çınar ve selvi izlenimi (Evliya Çelebi'nin anlattığı çınarlı avlu, s. 113; konumlar temsilî)
  const trees: [number, number, number][] = [
    [-22, -46, 11], [24, -48, 12], [-28, -22, 10], [31, -26, 11], [44, -10, 10], [36, 6, 9],
    [-24, 36, 10], [26, 44, 9], [-30, 58, 9], [48, 58, 9],
  ]
  trees.forEach(([x, z, b], i) => tree(m, ym, k, x, z, b, i + 1))

  const root = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)
  return {
    root,
    layers: [
      { group: roofGroup, height: 22, ad: 'Çatı' },
      { group: drumGroup, height: 32, ad: 'Kasnaklar' },
      { group: domeGroup, height: 42, ad: 'Kubbeler' },
    ],
    stops: mosqueStops,
    walking: mosqueWalkArea(),
    camera: { position: [66, 50, -108], target: [0, 8, 2] },
    pedestalRadius: PEDESTAL,
    innerLights: [[0, 11, MID_Z], [0, 12, MIHRAB_Z - 2], [IWAN_X, 7, IWAN_Z], [-IWAN_X, 7, IWAN_Z]],
  }
}

