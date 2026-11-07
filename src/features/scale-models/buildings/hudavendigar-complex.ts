// Representative model of the I. Murad Hudâvendigâr Complex. The mosque is modeled with its interior; the imaret, hamam, tomb and şadırvan are exterior masses.
// Units in meters. North = -z, qibla (south) = +z, east = +x. Dimensions: buildings/hudavendigar-complex-piece/plan.ts.
import type { Model } from '../uluMosqueModel'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import { Bucket } from '../uluMosquePiece'
import { setupMosque } from './hudavendigar-complex-piece/mosque'
import { PEDESTAL_R, setupSurroundings } from './hudavendigar-complex-piece/surroundings'
import { complexMaterials } from './hudavendigar-complex-piece/textures'
import { SAD_Z, stops, walkArea } from './hudavendigar-complex-piece/plan'

export const building = (): Model => {
  const m = uluMosqueMaterials()
  const x = complexMaterials(m)
  const k = new Bucket(), kTop = new Bucket(), kRoof = new Bucket(), kDome = new Bucket()
  setupSurroundings(m, x, k)
  setupMosque(m, x, k, kTop, kRoof, kDome)
  const root = k.group()
  const top = kTop.group(), roof = kRoof.group(), dome = kDome.group()
  root.add(top, roof, dome)
  return {
    root,
    layers: [
      { group: top, height: 16, name: 'Medrese katı' },
      { group: roof, height: 32, name: 'Çatı' },
      { group: dome, height: 44, name: 'Kubbe' },
    ],
    stops,
    walking: walkArea(),
    // Opening view from the northeast: the two-storey facade and minaret appear in front, as in the photo.
    camera: { position: [66, 40, -92], target: [0, 9, -6] },
    pedestalRadius: PEDESTAL_R,
    innerLights: [[0, 11.5, SAD_Z], [0, 8.5, 12], [0, 5.5, -13.5], [0, 5, -20.7]],
  }
}
