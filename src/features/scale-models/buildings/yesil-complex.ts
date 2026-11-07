// Representative model of the Yeşil Çelebi Mehmed Complex. Dome dimensions, spatial sequence and dimensions of the complex buildings
// from the inventory (Bursa II, pp. 88-138); proportions interpreted from the book's drone photo (p. 85). Units in meters.
// North = -z, qibla (south) = +z, east = +x. Distances between buildings are shortened within the model.
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

  // --- Ground: stone-paved base, north courtyard and green areas ---
  const courtyard = new THREE.CircleGeometry(PEDESTAL - 0.5, 96).rotateX(-Math.PI / 2).translate(0, 0.01, 0)
  const ap = courtyard.attributes.position, au = courtyard.attributes.uv
  for (let i = 0; i < au.count; i++) au.setXY(i, ap.getX(i), ap.getZ(i))
  k.add(courtyard, m.paving)
  const grassArea = (x0: number, x1: number, z0: number, z1: number) =>
    k.add(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0.04, (z0 + z1) / 2), ym.grass)
  // Gardens in front of the facade (p. 85): on both sides of the entrance path
  grassArea(-XD + 1, -5, ZK - 8, ZK - 0.3); grassArea(5, XD - 1, ZK - 8, ZK - 0.3)
  // Green strip: between buildings
  grassArea(-36, -22, -30, 28); grassArea(22, 30, -28, 18); grassArea(-18, 22, 28, 34)
  grassArea(-34, -18, 36, 66); grassArea(26, 60, 40, 62)
  k.add(place(boxG(0.3, 0.4, 7.7), -5, 0.2, ZK - 4.1), m.marble)
  k.add(place(boxG(0.3, 0.4, 7.7), 5, 0.2, ZK - 4.1), m.marble)

  mosqueInterior(m, ym, k, kDrum, kDome)
  mosqueExterior(m, ym, k, kRoof, kDrum, kDome)

  // --- Complex: tomb to the south, madrasa to the west, imaret to the southeast, şadırvan in the north courtyard (pp. 110, 119, 123, 137) ---
  greenTomb(m, ym, k, kDrum, kDome, 3, 54)
  greenMadrasa(m, ym, k, kRoof, kDrum, kDome, -57, -9)
  greenImaret(m, ym, k, kRoof, kDome, 32, 24)
  courtyardFountain(m, ym, k, kDome, 0, -44)

  // Impression of plane trees and cypresses (the plane-tree courtyard described by Evliya Çelebi, p. 113; positions are representative)
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
      { group: roofGroup, height: 22, name: 'Çatı' },
      { group: drumGroup, height: 32, name: 'Kasnaklar' },
      { group: domeGroup, height: 42, name: 'Kubbeler' },
    ],
    stops: mosqueStops,
    walking: mosqueWalkArea(),
    camera: { position: [66, 50, -108], target: [0, 8, 2] },
    pedestalRadius: PEDESTAL,
    innerLights: [[0, 11, MID_Z], [0, 12, MIHRAB_Z - 2], [IWAN_X, 7, IWAN_Z], [-IWAN_X, 7, IWAN_Z]],
  }
}

