// Details of the Ulu Camii model: doors, calligraphy plaques, pier inscriptions, Quran cabinets, mahfil, kürsü.
// The axis of the doors and the şadırvan, the mahfil's eight columns and the kürsü's form are from the Kültür Portalı text;
// plaque and pier inscriptions are perspective-corrected crops of archive photos (scripts/plaque_crop.py).
// Which face each plaque sits on is representative: the inscriptions are real but their positions are not one-to-one.
import * as THREE from 'three'
import { PUBLIC_BUILD } from '../../shared/config/publicBuild'
import { qiblaWall } from './ulu-mosque/mihrab'
import { kaabaShowcase, coverSideKiosk } from './ulu-mosque/inner-wall'
import { doorsMaterials, sideDoor } from './ulu-mosque/doors'
import type { UluMosqueMaterials } from './uluMosqueTextures'
import { woodKursu, buildCabinet, buildMahfil, marbleKursu, buildChest } from './ulu-mosque/minbar'
import { eastWestPlaques } from './ulu-mosque/piers'
import {
  WALL, Bucket, type Mat, FOUNTAIN_ROW, FOUNTAIN_COLUMN, LINE, COLUMN, YX, YZ,
  boxG, px, pz, place,
} from './uluMosquePiece'

const FLOOR = 0.7
const sx = px(FOUNTAIN_COLUMN + 0.5), sz = pz(FOUNTAIN_ROW + 0.5)
const MIHRAB_Z = YZ - WALL

export const MAHFIL = { x: sx, z: pz(2.5) - 1, wX: 3.1, wZ: 2.1 }
export const KURSU = { x: px(3) - 2.1, z: pz(3), r: 1.05 }

/** Door axes meeting at the şadırvan center: the east and west doors are aligned with the şadırvan in z. */
export const DOOR_Z = sz

type Add = (g: THREE.BufferGeometry, m: Mat) => void

/** Material carrying a photo-derived texture. Single-sided: seen from behind, the writing doesn't appear mirrored. */
function plaqueTextures() {
  const loader = new THREE.TextureLoader()
  const material = (name: string) => {
    if (PUBLIC_BUILD) return new THREE.MeshStandardMaterial({ color: '#c8b48a', roughness: 0.72, metalness: 0 })
    const t = loader.load(`/images/ulu-mosque/model/${name}.jpg`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.72, metalness: 0 })
  }
  return {
    piers: ['pier-1', 'pier-3', 'pier-5', 'pier-2', 'pier-6', 'pier-4'].map(material),
    gold: material('plaque-gold'),
    medallion: material('medallion'),
    small: material('plaque-small'),
  }
}

/** Framed wall plaque: its +z face looks into the room. */
function plaque(ext: Add, m: UluMosqueMaterials, texture: Mat, g: number, h: number, frameBorder: Mat = m.goldDark) {
  ext(boxG(g + 0.24, h + 0.24, 0.08).translate(0, 0, 0.04), frameBorder)
  ext(new THREE.PlaneGeometry(g, h).translate(0, 0, 0.09), texture)
}

export function uluMosqueDetails(m: UluMosqueMaterials, k: Bucket) {
  const d = plaqueTextures()
  const fromWall = (x: number, y: number, z: number, ry: number): Add => (g, mat) => {
    g.translate(0, y, 0)
    k.add(place(g, x, 0, z, ry), mat)
  }

  // --- Wall plaques (the south wall faces north, the east wall faces west, the west wall faces east) ---
  // Qibla wall: green plaque above the mihrab, oval medallions and panels beside it (according to the photos)
  qiblaWall(k, MIHRAB_Z, m)
  plaque(fromWall(10.2, 4.85, MIHRAB_Z - 0.02, Math.PI), m, d.piers[3], 2.4, 4.27, m.walnut)
  plaque(fromWall(px(3.5), 9.25, MIHRAB_Z - 0.02, Math.PI), m, d.gold, 3.1, 3.2)
  plaque(fromWall(px(3.5) + 3.4, 4.6, MIHRAB_Z - 0.02, Math.PI), m, d.small, 3.2, 1.7, m.wood)
  plaque(fromWall(-12.6, 4.6, MIHRAB_Z - 0.02, Math.PI), m, d.piers[0], 2.5, 4.81, m.walnut)
  plaque(fromWall(px(1.5) - 3.6, 4.7, MIHRAB_Z - 0.02, Math.PI), m, d.piers[4], 2.3, 4.6, m.walnut)
  plaque(fromWall(px(4.5), 4.7, MIHRAB_Z - 0.02, Math.PI), m, d.piers[2], 2.3, 4.6, m.walnut)
  plaque(fromWall(px(0.5), 4.7, MIHRAB_Z - 0.02, Math.PI), m, d.piers[1], 2.4, 4.6, m.walnut)
  eastWestPlaques(m, k)
  kaabaShowcase(k, m)
  coverSideKiosk(k, m)
  // Round medallions: circular so the corners of the crop don't show
  // Side wall medallions are added once below. In the north, instead of the arch springers,
  // use the blank wall between the window pairs.
  for (const x of [px(1.5), px(3.5)]) {
    const z = -YZ + WALL + 0.06, ry = 0
    const ext = fromWall(x, 9.6, z, ry)
    ext(new THREE.TorusGeometry(1.32, 0.09, 8, 40), m.goldDark)
    ext(new THREE.CircleGeometry(1.3, 40).translate(0, 0, 0.03), d.medallion)
  }

  // Medallions between the upper window pairs (ERD05018 and DJI_0339).
  // The writing is the existing reference texture; no other names are invented, the placement is representative.
  for (const side of [-1, 1]) for (const j of [0.5, 2.5, 3.5]) {
    const ext = fromWall(side * (YX - WALL - 0.04), 10.25, pz(j), -side * Math.PI / 2)
    ext(new THREE.CircleGeometry(1.04, 32), m.dark)
    ext(new THREE.TorusGeometry(1.05, 0.035, 5, 32).translate(0, 0, 0.025), m.goldDark)
    ext(new THREE.CircleGeometry(1, 32).translate(0, 0, 0.04), d.medallion)
  }

  // --- Doors: north interior, east and west (inside and outside) ---
  const K = doorsMaterials(m)
  sideDoor(fromWall(0, 0, -YZ + WALL, 0), m, K, FLOOR, true)
  for (const [x, inner, outer] of [[YX, -Math.PI / 2, Math.PI / 2], [-YX, Math.PI / 2, -Math.PI / 2]] as const) {
    const s = Math.sign(x)
    sideDoor(fromWall(x - s * WALL, 0, DOOR_Z, inner), m, K, FLOOR, true)
    sideDoor(fromWall(x, 0, DOOR_Z, outer), m, K, 0.72, false)
    // Outer steps
    for (let n = 0; n < 3; n++) {
      const der = (3 - n) * 0.75
      k.add(place(boxG(5.4 - n * 0.5, 0.24, der).translate(0, 0.12 + n * 0.24, der / 2 + 0.5), x, 0, DOOR_Z, outer), m.marble)
    }
  }

  // --- Cabinets, mahfil, kürsüs: ulu-mosque/minbar.ts ---
  for (let i = 1; i < COLUMN; i++) for (let j = 1; j < LINE; j++) {
    buildCabinet(m, k, px(i), pz(j), 0, FLOOR)
    buildCabinet(m, k, px(i), pz(j), Math.PI, FLOOR)
  }
  buildMahfil(m, k, { x: MAHFIL.x, z: MAHFIL.z, wZ: MAHFIL.wZ, floor: FLOOR })
  const { x: kursuX, z: kursuZ, r: kursuR } = KURSU
  // The north side of the upper wall is open: the entrance reached by the steps.
  marbleKursu(m, k, { x: kursuX, z: kursuZ, r: kursuR, floor: FLOOR, entrance: 1.1 })
  woodKursu(m, k, FLOOR)
  // Steps connecting to the pier
  for (let n = 0; n < 6; n++) {
    k.add(place(boxG(0.8, 0.34, 0.5), kursuX, FLOOR + 0.17 + n * 0.34, kursuZ - kursuR - 1.6 + n * 0.32), m.innerMarble)
    k.add(place(boxG(0.8, n * 0.34 + 0.02, 0.5), kursuX, FLOOR + (n * 0.34) / 2, kursuZ - kursuR - 1.6 + n * 0.32), m.marbleDark)
  }

  // --- Wooden chests (taps and spouts are in ulu-mosque/fountain.ts) ---
  for (const [x, z] of [[sx - 4.3, sz - 4.3], [sx + 4.3, sz - 4.3], [sx - 4.3, sz + 4.3], [sx + 4.3, sz + 4.3]]) buildChest(m, k, x, z, z < sz ? 1 : -1, FLOOR)
}
