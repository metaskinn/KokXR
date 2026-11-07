// I. Murad Hudâvendigâr Külliyesi temsilî maketi. Cami içiyle modellenir; imaret, hamam, türbe ve şadırvan dış kütledir.
// Birim metre. Kuzey = -z, kıble (güney) = +z, doğu = +x. Ölçüler: yapilar/hudavendigar-kulliyesi-parca/plan.ts.
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
      { group: top, height: 16, ad: 'Medrese katı' },
      { group: roof, height: 32, ad: 'Çatı' },
      { group: dome, height: 44, ad: 'Kubbe' },
    ],
    stops,
    walking: walkArea(),
    // Açılış kuzeydoğudan: iki katlı cephe ve minare fotoğraftaki gibi önde görünür.
    camera: { position: [66, 40, -92], target: [0, 9, -6] },
    pedestalRadius: PEDESTAL_R,
    innerLights: [[0, 11.5, SAD_Z], [0, 8.5, 12], [0, 5.5, -13.5], [0, 5, -20.7]],
  }
}
