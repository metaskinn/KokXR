// Representative model of the Yıldırım Complex: the mosque with its interior, other buildings as exterior masses.
// Source dimensions are written at the top of the piece files. Not a real 3D scan.
import * as THREE from 'three'
import { Bucket } from '../uluMosquePiece'
import type { Model } from '../uluMosqueModel'
import type { InteriorStop, InteriorWalk } from '../uluMosqueInterior'
import { BAY_Y, BASE, mosque } from './yildirim-complex-pieces/mosque'
import { hospital, madrasa, fountainKiosk, site, tomb } from './yildirim-complex-pieces/other'
import { yildirimMaterials } from './yildirim-complex-pieces/common'

/** The buildings extend to the north; all are shifted south to center them on the base. */
const OZ = 16
const PEDESTAL = 90

export const building = (): Model => {
  const m = yildirimMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()
  const walking0 = mosque(m, k, kRoof, kDrum, kDome)
  tomb(m, k, kRoof, kDrum, kDome)
  madrasa(m, k, kRoof, kDrum, kDome)
  hospital(m, k, kRoof, kDrum, kDome)
  fountainKiosk(m, k, kDome, -2.2, -27)
  site(m, k, PEDESTAL, OZ)

  const root = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)
  // All geometry is centered on the base.
  for (const g of [root, roofGroup, drumGroup, domeGroup]) {
    g.children.forEach((c) => { if (c instanceof THREE.Mesh) c.geometry.translate(0, 0, OZ) })
  }

  const kay = (z: number) => z + OZ
  const walking: InteriorWalk = {
    ...walking0,
    limit: { ...walking0.limit, z0: kay(walking0.limit.z0), z1: kay(walking0.limit.z1) },
    boxes: walking0.boxes.map((b) => ({ ...b, z0: kay(b.z0), z1: kay(b.z1) })),
    floors: walking0.floors.map((b) => ({ ...b, z0: kay(b.z0), z1: kay(b.z1) })),
    viewBlockers: walking0.viewBlockers.map((b) => ({ ...b, z0: kay(b.z0), z1: kay(b.z1) })),
    circles: walking0.circles.map((d) => ({ ...d, z: kay(d.z) })),
  }

  const G = BAY_Y
  const stop = (id: string, ad: string, x: number, y: number, z: number, bx: number, by: number, bz: number): InteriorStop =>
    ({ id, ad, position: [x, y, kay(z)], look: [bx, by, kay(bz)] })
  const stops: InteriorStop[] = [
    stop('hall', 'Harim', 0, G, -3.2, 0, 5, 12),
    stop('portico', 'Son cemaat yeri', 12.8, G + 0.5, -16.7, -10, 5.2, -16.7),
    stop('dome', 'Orta kubbe', 0, G, -1.2, 0, 21, -1.9),
    stop('iwan', 'Doğu eyvanı', 8.6, G + 0.4, -4.6, 15.2, 4.5, -4.6),
    stop('tabhane', 'Tabhane', 9, G, 2.4, 12, BASE + 2.2, 6.4),
    stop('mihrab', 'Mihrap', 0, G + 0.4, 8.5, 0, 6, 17.3),
    stop('minbar', 'Minber', -2.1, G + 0.4, 12.4, -4.75, 3.8, 15.6),
    stop('mahfil', 'Mahfil', -4.2, G + 2.9, -6.9, 2.5, 5.4, 8),
  ]

  return {
    root,
    layers: [
      { group: roofGroup, height: 22, ad: 'Çatılar' },
      { group: drumGroup, height: 34, ad: 'Kasnaklar' },
      { group: domeGroup, height: 46, ad: 'Kubbeler' },
    ],
    stops,
    walking,
    camera: { position: [66, 58, -128], target: [-3, 8, -8] },
    pedestalRadius: PEDESTAL,
    innerLights: [[0, 8.5, kay(-1.9)], [0, 8.5, kay(11.5)], [11.7, 6.5, kay(-4.6)], [-11.7, 6.5, kay(-4.6)]],
  }
}
