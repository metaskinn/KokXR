// II. Murad (Muradiye) Külliyesi temsilî maketi. Cami içiyle, diğer yapılar dış kütle olarak modellenir.
// Biçim ve ölçü kaynakları: Vakıf Eserleri Envanteri – Bursa, II. Murad Külliyesi (s. 111-160). Bu kaynakta plan çizimi yoktur;
// yerleşim s. 113'teki kuşbakışı fotoğraftan okunmuştur. Gerçek bir 3B tarama değildir.
import * as THREE from 'three'
import { Bucket } from '../uluMosquePiece'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import type { Model } from '../uluMosqueModel'
import { mosque, mosqueStops, mosqueWalk } from './muradiye-complex-pieces/mosque'
import { muradiyeMaterials } from './muradiye-complex-pieces/textures'
import { complex } from './muradiye-complex-pieces/complex'

/** Plan koordinatı (cami ortada) ile sahne koordinatı arası: külliye kaidenin ortasına oturur. */
const OX = 28, OZ = -13
const PEDESTAL = 92

export const building = (): Model => {
  const m = uluMosqueMaterials()
  const d = muradiyeMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()

  // Çimen: kaideyi örter (plan koordinatında merkezi kaymış daire); yollar kulliye.ts'te.
  const courtyard = new THREE.CircleGeometry(PEDESTAL, 96).rotateX(-Math.PI / 2).translate(-OX, 0.01, -OZ)
  const p = courtyard.attributes.position, uv = courtyard.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i))
  k.add(courtyard, d.lawn)

  mosque(m, d, k, kRoof, kDrum, kDome)
  complex(m, d, k, kRoof, kDrum, kDome)

  const root = k.group()
  const roofGroup = kRoof.group(), drumGroup = kDrum.group(), domeGroup = kDome.group()
  root.add(roofGroup, drumGroup, domeGroup)
  // Tüm geometri tek seferde sahne koordinatına alınır; katmanlar dokunulmadan kalır.
  root.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.translate(OX, 0, OZ) })

  return {
    root,
    layers: [
      { group: roofGroup, height: 14, ad: 'Çatılar' },
      { group: drumGroup, height: 24, ad: 'Kasnaklar' },
      { group: domeGroup, height: 36, ad: 'Kubbeler' },
    ],
    stops: mosqueStops(OX, OZ),
    walking: mosqueWalk(OX, OZ),
    camera: { position: [OX - 44, 54, OZ - 112], target: [OX - 16, 8, OZ + 8] },
    pedestalRadius: PEDESTAL,
    // Harim, avlu ve iki eyvan: tepeye yakın.
    innerLights: [[OX, 12, OZ + 11], [OX, 12, OZ - 1.6], [OX + 10, 8, OZ - 1.6], [OX - 10, 8, OZ - 1.6]],
  }
}

