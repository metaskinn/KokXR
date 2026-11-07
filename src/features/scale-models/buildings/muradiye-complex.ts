// Representative model of the II. Murad (Muradiye) Complex. The mosque is modeled with its interior; other buildings as exterior masses.
// Form and dimension sources: Vakıf Eserleri Envanteri – Bursa, II. Murad Külliyesi (pp. 111-160). This source has no plan drawing;
// the layout is read from the bird's-eye photo on p. 113. Not a real 3D scan.
import * as THREE from 'three'
import { Bucket } from '../uluMosquePiece'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import type { Model } from '../uluMosqueModel'
import { mosque, mosqueStops, mosqueWalk } from './muradiye-complex-pieces/mosque'
import { muradiyeMaterials } from './muradiye-complex-pieces/textures'
import { complex } from './muradiye-complex-pieces/complex'

/** Between plan coordinates (mosque at center) and scene coordinates: the complex sits at the center of the base. */
const OX = 28, OZ = -13
const PEDESTAL = 92

export const building = (): Model => {
  const m = uluMosqueMaterials()
  const d = muradiyeMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()

  // Grass: covers the base (circle with shifted center in plan coordinates); paths are in complex.ts.
  const courtyard = new THREE.CircleGeometry(PEDESTAL, 96).rotateX(-Math.PI / 2).translate(-OX, 0.01, -OZ)
  const p = courtyard.attributes.position, uv = courtyard.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.add(courtyard, d.lawn)

  mosque(m, d, k, kRoof, kDrum, kDome)
  complex(m, d, k, kRoof, kDrum, kDome)

  const root = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)
  // All geometry is moved to scene coordinates at once; layers stay untouched.
  root.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.translate(OX, 0, OZ) })

  return {
    root,
    layers: [
      { group: roofGroup, height: 14, name: 'Çatılar' },
      { group: drumGroup, height: 24, name: 'Kasnaklar' },
      { group: domeGroup, height: 36, name: 'Kubbeler' },
    ],
    stops: mosqueStops(OX, OZ),
    walking: mosqueWalk(OX, OZ),
    camera: { position: [OX - 44, 54, OZ - 112], target: [OX - 16, 8, OZ + 8] },
    pedestalRadius: PEDESTAL,
    // Prayer hall, courtyard and the two iwans: close to the top.
    innerLights: [[OX, 12, OZ + 11], [OX, 12, OZ - 1.6], [OX + 10, 8, OZ - 1.6], [OX - 10, 8, OZ - 1.6]],
  }
}

