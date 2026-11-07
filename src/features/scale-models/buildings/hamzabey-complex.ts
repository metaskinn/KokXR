// Representative model of the Hamzabey Complex. Units in meters; north -z, qibla (south) +z, east +x.
// Sourced dimensions: middle dome 8.10 m diameter, springing of the arch between the two domes 1.75 m above the sofa, middle piers project 80 cm (Envanter, pp. 180-183).
// Plan layout (inverted T, tabhanes, portico, tomb positions) proportioned from the vertical bird's-eye photo on Drive; heights and remaining dimensions are representative.
// Calligraphy is not imitated. North facade and interior interpreted from photos.
import * as THREE from 'three'
import type { Model } from '../uluMosqueModel'
import { uluMosqueMaterials } from '../uluMosqueTextures'
import type { InteriorStop, Box, FloorArea } from '../uluMosqueInterior'
import { Bucket, subtract, rect, rotateG, flatShadow, arch, boxG, cylinderG, uvFit, place, type Mat } from '../uluMosquePiece'
import { hamzabeyMaterials } from './hamzabey-complex-piece/textures'

/** The whole building is shifted by this much so the plan center lands at the scene center (the base is centered on the y axis). */
const OX = 5, OZ = 14.5
const PEDESTAL_R = 36
const F = 1, PLATFORM = 1.6, BAY = 1.7
const BAND_BOTTOM = 8.8
const MIHRAB_Z = 9.4, QIBLA_Z = 13.45
const IWAN_X = 8.05, IWAN_Z = 0.1
const HAMZA = { x: -21.8, z: -19.7 }, FAMILY = { x: -14.9, z: -7.7 }, MUSTAFA = { x: -7.7, z: -38.5 }, MINARET = { x: 13.85, z: -7.6 }
const MINBAR = { x: -2.9, length: 5.2, en: 1.9, apex: 2.9, z0: 8.1, s0: 0.75, s1: 4.05, h1: 2.55 }

type Open =
  | { tip: 'alt' | 'top'; u: number; F: number }
  | { tip: 'arch'; u: number; y0: number; g: number; flat: number; kH: number; stroke?: boolean }

export const building = (): Model => {
  const u = uluMosqueMaterials()
  const m = hamzabeyMaterials()
  const k = new Bucket(), kRoof = new Bucket(), kDrum = new Bucket(), kDome = new Bucket()
  const box = (g: number, h: number, d: number, mat: Mat, x: number, y: number, z: number, kv = k) => kv.add(place(boxG(g, h, d), x, y, z), mat)
  /** Slight emissive on plaster so interiors of buildings without point lights (portico, tombs) do not go dark. */
  let plasterActive: Mat = m.plaster

  /** Arch strip: from `z` to `z+d` in local z. */
  const ring = (cx: number, y0: number, gOuter: number, flatOuter: number, kOuter: number, gInner: number, flatInner: number, kInner: number, d: number, z: number, y0Inner = y0) => {
    // A single closed strip instead of a hole: when base edges coincided, triangulation left a thin line in the opening.
    const oD = gOuter / 2, oI = gInner / 2, s = new THREE.Shape()
    s.moveTo(cx - oD, y0)
    s.lineTo(cx - oD, y0 + flatOuter)
    s.quadraticCurveTo(cx - oD, y0 + flatOuter + kOuter * 0.55, cx, y0 + flatOuter + kOuter)
    s.quadraticCurveTo(cx + oD, y0 + flatOuter + kOuter * 0.55, cx + oD, y0 + flatOuter)
    s.lineTo(cx + oD, y0)
    s.lineTo(cx + oI, y0Inner)
    s.lineTo(cx + oI, y0Inner + flatInner)
    s.quadraticCurveTo(cx + oI, y0Inner + flatInner + kInner * 0.55, cx, y0Inner + flatInner + kInner)
    s.quadraticCurveTo(cx - oI, y0Inner + flatInner + kInner * 0.55, cx - oI, y0Inner + flatInner)
    s.lineTo(cx - oI, y0Inner)
    s.closePath()
    return subtract(s, d, z)
  }

  /** Saw-tooth row: on the local z=d surface, along L. */
  const saw = (L: number, y: number, x: number, z: number, ry: number, d: number, step = 0.34, kv = k) => {
    const n = Math.floor(L / step)
    for (let i = 0; i < n; i++) {
      const g = new THREE.BoxGeometry(0.2, 0.2, 0.14).rotateZ(Math.PI / 4).translate(-L / 2 + (i + 0.5) * step, y, d + 0.02)
      kv.add(place(g, x, 0, z, ry), m.brick)
    }
  }

  /**
   * Wall: local z=0 inner face, z=t outer face. Inner half plaster, outer half `outer` material.
   * Behind window openings there are two opaque planes: bright glass facing in, grille or plaster screen facing out.
   */
  const wall = (L: number, y0: number, y1: number, x: number, z: number, ry: number, t: number, outer: Mat, open: Open[]) => {
    const a = rect(-L / 2, y0, L / 2, y1), b = rect(-L / 2, y0, L / 2, y1), c = rect(-L / 2, y0, L / 2, y1)
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z, ry), mat)
    for (const p of open) {
      if (p.tip === 'arch') {
        for (const s of [a, b, c]) s.holes.push(arch(new THREE.Path(), p.u, p.y0, p.g, p.flat, p.kH))
        if (p.stroke) {
          ext(ring(p.u, p.y0, p.g + 0.14, p.flat, p.kH + 0.1, p.g + 0.02, p.flat, p.kH + 0.01, 0.015, -0.015), m.stroke)
          ext(ring(p.u, p.y0, p.g + 0.14, p.flat, p.kH + 0.1, p.g + 0.02, p.flat, p.kH + 0.01, 0.015, t), m.stroke)
        }
        continue
      }
      if (p.tip === 'alt') {
        // Light-colored arched niche and rectangular window inside; outside, rectangular window with marble lintel and brick relieving arch.
        const pf = p.F, W = 1.2, y00 = pf + 0.75, y11 = pf + 2.25
        a.holes.push(arch(new THREE.Path(), p.u, pf + 0.25, 1.9, 2.25, 0.95))
        b.holes.push(rect(p.u - W / 2, y00, p.u + W / 2, y11) as unknown as THREE.Path)
        c.holes.push(rect(p.u - W / 2, y00, p.u + W / 2, y11) as unknown as THREE.Path)
        const window = uvFit(new THREE.ShapeGeometry(rect(-W / 2, y00, W / 2, y11)))
        ext(window.rotateY(Math.PI).translate(p.u, 0, t / 2 - 0.01), m.window)
        ext(uvFit(new THREE.ShapeGeometry(rect(-W / 2, y00, W / 2, y11))).translate(p.u, 0, t / 2 + 0.01), m.balustrade)
        // Inside: niche outline, plaster ornament in the arched area, trim
        ext(ring(p.u, pf + 0.25, 2.02, 2.25, 1.03, 1.9, 2.25, 0.95, 0.015, -0.015), m.stroke)
        ext(new THREE.PlaneGeometry(1.25, 0.62).rotateY(Math.PI).translate(p.u, y11 + 0.42, 0.19), m.malakari)
        ext(boxG(W + 0.26, 0.08, 0.28).translate(p.u, y00 - 0.03, 0.12), u.marble)
        // Outside
        ext(boxG(W + 0.3, 0.2, 0.1).translate(p.u, y11 + 0.1, t + 0.03), u.marble)
        ext(boxG(W + 0.3, 0.14, 0.14).translate(p.u, y00 - 0.05, t + 0.03), u.marble)
        for (const s of [-1, 1]) ext(boxG(0.14, y11 - y00, 0.1).translate(p.u + s * (W / 2 + 0.07), (y00 + y11) / 2, t + 0.03), u.marble)
        ext(ring(p.u, y11 + 0.2, W + 0.72, 0.01, 0.82, W + 0.1, 0.01, 0.52, 0.06, t), m.brick)
      } else {
        const pf = p.F, y00 = pf + 3.55, flat = 1.15, kH = 0.62, g = 0.98
        for (const s of [a, b, c]) s.holes.push(arch(new THREE.Path(), p.u, y00, g, flat, kH))
        const shape = () => uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, y00, g, flat, kH), 8))
        ext(shape().rotateY(Math.PI).translate(p.u, 0, t / 2 - 0.01), m.stainedGlass)
        ext(shape().translate(p.u, 0, t / 2 + 0.01), m.lattice)
        // Inside: arched frame around the window
        ext(ring(p.u, y00 - 0.26, g + 0.72, flat + 0.16, kH + 0.3, g + 0.58, flat + 0.16, kH + 0.22, 0.015, -0.015), m.stroke)
        ext(boxG(g + 0.6, 0.03, 0.03).translate(p.u, y00 - 0.25, -0.015), m.stroke)
        ext(boxG(g + 0.22, 0.07, 0.2).translate(p.u, y00 - 0.03, 0.1), u.marble)
        // Outside: brick arch ring and marble sill
        ext(ring(p.u, y00, g + 0.5, flat, kH + 0.26, g, flat, kH, 0.06, t), m.brick)
        ext(boxG(g + 0.34, 0.1, 0.14).translate(p.u, y00 - 0.05, t + 0.03), u.marble)
      }
    }
    ext(subtract(a, 0.2), plasterActive)
    ext(subtract(b, t / 2 - 0.2, 0.2), plasterActive)
    ext(subtract(c, t / 2, t / 2), outer)
  }

  // Surface: shortcuts for building walls in world coordinates
  /** `inner` z is the inner face; if `dir` is +1 the outer face is on the +z side. */
  const wallX = (inner: number, dir: 1 | -1, x0: number, x1: number, y1: number, t: number, outer: Mat, open: Open[], y0 = 0) => {
    const xc = (x0 + x1) / 2
    wall(x1 - x0, y0, y1, xc, inner, dir > 0 ? 0 : Math.PI, t, outer, open.map((a) => ({ ...a, u: dir > 0 ? a.u - xc : xc - a.u })))
  }
  const wallZ = (inner: number, dir: 1 | -1, z0: number, z1: number, y1: number, t: number, outer: Mat, open: Open[], y0 = 0) => {
    const zc = (z0 + z1) / 2
    wall(z1 - z0, y0, y1, inner, zc, dir > 0 ? Math.PI / 2 : -Math.PI / 2, t, outer, open.map((a) => ({ ...a, u: dir > 0 ? zc - a.u : a.u - zc })))
  }

  /** Triangle list; UV in meters. */
  const faces = (position: number[], uv?: number[]) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    else {
      const uvs: number[] = []
      for (let i = 0; i < position.length; i += 3) uvs.push(position[i] + position[i + 2], position[i + 1])
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }
    g.computeVertexNormals()
    return g
  }

  /** Lead cover sloping to four sides: base rectangle and an inset top. */
  const hipRoofTop = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, inner: number, kv = kRoof) => {
    const a = [x0, z0], b = [x1, z0], c = [x1, z1], d = [x0, z1]
    const A = [x0 + inner, z0 + inner], B = [x1 - inner, z0 + inner], C = [x1 - inner, z1 - inner], D = [x0 + inner, z1 - inner]
    const p: number[] = []
    const quad = (s: number[], t: number[], T: number[], S: number[], yt: number) => p.push(s[0], y0, s[1], t[0], y0, t[1], T[0], yt, T[1], s[0], y0, s[1], T[0], yt, T[1], S[0], yt, S[1])
    quad(a, b, B, A, y1); quad(b, c, C, B, y1); quad(c, d, D, C, y1); quad(d, a, A, D, y1)
    p.push(A[0], y1, A[1], B[0], y1, B[1], C[0], y1, C[1], A[0], y1, A[1], C[0], y1, C[1], D[0], y1, D[1])
    kv.add(faces(p), u.lead)
  }

  /** Outer ribbed dome and finial. */
  const domeOuter = (x: number, y: number, z: number, r: number, h: number, finial = 1) => {
    const profile: [number, number][] = [[r + 0.28, -0.2], [r + 0.06, 0.02]]
    for (let t = 1; t <= 14; t++) {
      const a = (t / 14) * Math.PI / 2
      profile.push([r * Math.pow(Math.cos(a), 0.9), h * Math.pow(Math.sin(a), 1.05)])
    }
    const SEAM = 36, PIECE = 4
    const g = rotateG(profile, SEAM * PIECE, [1, 1])
    const p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const rr = Math.hypot(p.getX(i), p.getZ(i))
      if (rr < 0.2 || Math.round(uv.getX(i) * SEAM * PIECE) % PIECE !== 0) continue
      const o = 1 + 0.05 / rr
      p.setX(i, p.getX(i) * o); p.setZ(i, p.getZ(i) * o)
    }
    g.computeVertexNormals()
    kDome.add(place(g, x, y, z), m.domeOuter)
    kDome.add(place(rotateG([[0.16 * finial, 0], [0.05 * finial, 0.14], [0.14 * finial, 0.3], [0.05 * finial, 0.48], [0.1 * finial, 0.62], [0.02, 1 * finial], [0, 1.1 * finial]], 8), x, y + h - 0.06, z), u.bronze)
  }

  /** Inner dome; if `boss`, a rosette with planar UV sits at its apex. */
  const domeInner = (x: number, y: number, z: number, r: number, h: number, boss: boolean, mat: Mat = m.domeInner) => {
    const profile: [number, number][] = []
    const LAST = boss ? 11 : 16
    for (let t = 0; t <= LAST; t++) {
      const a = (t / 16) * Math.PI / 2
      profile.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)])
    }
    kDome.add(place(rotateG(profile, 48, [1, 1]), x, y, z), mat)
    if (!boss) return
    const [rs, ys] = profile[profile.length - 1]
    const cap: [number, number][] = [[rs, ys]]
    for (let t = LAST + 1; t <= 16; t++) {
      const a = (t / 16) * Math.PI / 2
      cap.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)])
    }
    const g = rotateG(cap, 40, [1, 1])
    const p = g.attributes.position, uv = g.attributes.uv
    // In the photo the rosette is in the middle of a white ground: the UV edge falls slightly outside the rosette.
    for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (rs * 2.02), 0.5 + p.getZ(i) / (rs * 2.02))
    kDome.add(place(g, x, y, z), m.boss)
  }

  /** From a square mouth to a circle: regular pendentive surface. */
  const pendentive = (cx: number, cz: number, hx: number, hz: number, y0: number, y1: number, R: number, kv = kRoof, mat: Mat = m.plaster) => {
    const SEG = 48, ROW = 5
    const position: number[] = [], uv: number[] = [], index: number[] = []
    for (let s = 0; s <= ROW; s++) {
      const t = s / ROW, e = Math.pow(t, 0.72)
      for (let a = 0; a <= SEG; a++) {
        const theta = (a / SEG) * Math.PI * 2, dx = Math.sin(theta), dz = Math.cos(theta)
        const far = Math.min(Math.abs(dx) > 1e-4 ? hx / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-4 ? hz / Math.abs(dz) : Infinity)
        const r = THREE.MathUtils.lerp(far, R, e)
        position.push(cx + dx * r, THREE.MathUtils.lerp(y0, y1, t), cz + dz * r)
        uv.push(a / SEG, t)
      }
    }
    for (let s = 0; s < ROW; s++) for (let a = 0; a < SEG; a++) {
      const p = s * (SEG + 1) + a, q = p + SEG + 1
      index.push(p, q, p + 1, p + 1, q, q + 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(index)
    g.computeVertexNormals()
    kv.add(g, mat)
  }

  /** Turkish-triangle belt: square → octagon → sixteen-gon, faceted faces and painted outlines. */
  const triangleBelt = (cx: number, cz: number, h: number, y0: number, y1: number, R: number) => {
    const inFrame = (a: number): [number, number] => {
      const dx = Math.sin(a), dz = Math.cos(a)
      const scale = Math.min(Math.abs(dx) > 1e-4 ? h / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-4 ? h / Math.abs(dz) : Infinity)
      return [cx + dx * scale, cz + dz * scale]
    }
    const circle = (a: number, r: number): [number, number] => [cx + Math.sin(a) * r, cz + Math.cos(a) * r]
    const ym = y0 + (y1 - y0) * 0.55
    const p: number[] = [], uv: number[] = []
    const triangle = (a: number[], b: number[], c: number[]) => { p.push(...a, ...b, ...c); uv.push(0, 0, 1, 0, 0.5, 1) }
    const n = (xz: [number, number], y: number) => [xz[0], y, xz[1]]
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2, am = (a0 + a1) / 2
      // Lower row: upright and inverted triangles
      triangle(n(inFrame(a0), y0), n(inFrame(a1), y0), n(circle(am, R * 1.0), ym))
      const a2 = ((i + 1.5) / 16) * Math.PI * 2
      triangle(n(circle(am, R), ym), n(circle(a2, R), ym), n(inFrame(a1), y0))
      // Upper row
      triangle(n(circle(am, R), ym), n(circle(a2, R), ym), n(circle(a1, R), y1))
      triangle(n(circle(a0, R), y1), n(circle(a1, R), y1), n(circle(am, R), ym))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    kRoof.add(g, m.triangle)
  }

  /** Muqarnas cluster hanging from a corner: rows widening from bottom to top. */
  const muqarnasCorner = (cx: number, cz: number, h: number, y0: number, row: number, scale: number) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const inner = new THREE.Vector2(-sx, -sz).normalize(), side = new THREE.Vector2(sz, -sx).normalize()
      for (let r = 0; r < row; r++) {
        const count = 1 + r * 2
        const d = (0.42 + r * 0.52) * scale
        for (let i = 0; i < count; i++) {
          const o = (i - (count - 1) / 2) * 0.5 * scale
          const x = cx + sx * h + inner.x * d + side.x * o, z = cz + sz * h + inner.y * d + side.y * o, y = y0 + r * 0.62 * scale
          const cell = new THREE.SphereGeometry(0.24 * scale, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.5, 1)
          kRoof.add(place(cell, x, y, z), m.plaster)
        }
      }
    }
  }

  const octagon = (rt: number, rb: number, y0: number, y1: number, kv: Bucket, mat: Mat, x: number, z: number, open = true) => {
    kv.add(place(flatShadow(cylinderG(rt, rb, y1 - y0, 8, open).rotateY(Math.PI / 8)), x, (y0 + y1) / 2, z), mat)
  }

  /** Octagonal outer drum: arched grilles on the faces, saw-tooth and lead skirt on top. */
  const outerDrum = (x: number, z: number, A: number, y0: number, y1: number, faces8: number[], pG: number, pH: number) => {
    const R = A / Math.cos(Math.PI / 8)
    octagon(R, R, y0, y1, kDrum, m.brick, x, z)
    octagon(R + 0.08, R + 0.08, y0, y0 + 0.16, kDrum, u.marble, x, z)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4, L = 2 * A * Math.tan(Math.PI / 8)
      saw(L, y1 - 0.18, x, z, a, A, 0.34, kDrum)
      if (!faces8.includes(n)) continue
      const yp = y0 + (y1 - y0 - pH - 0.4 * pG) / 2
      kDrum.add(place(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, yp, pG, pH, 0.5 * pG), 8).translate(0, 0, A + 0.05), x, 0, z, a), m.lattice)
      kDrum.add(place(ring(0, yp - 0.04, pG + 0.34, pH, 0.5 * pG + 0.2, pG, pH, 0.5 * pG, 0.05, A, yp), x, 0, z, a), u.marble)
    }
    octagon(R - 0.2, R + 0.32, y1, y1 + 0.42, kDrum, u.lead, x, z)
  }

  // ---------------------------------------------------------------- GROUND
  const hoop = new THREE.CircleGeometry(PEDESTAL_R, 72).rotateX(-Math.PI / 2).translate(-OX, 0.01, -OZ)
  const hoopP = hoop.attributes.position, hoopUV = hoop.attributes.uv
  for (let i = 0; i < hoopP.count; i++) hoopUV.setXY(i, hoopP.getX(i), hoopP.getZ(i))
  k.add(hoop, u.paving)
  const grassArea = (x0: number, z0: number, x1: number, z1: number) => {
    const g = new THREE.ShapeGeometry(rect(x0, -z1, x1, -z0)).rotateX(-Math.PI / 2).translate(0, 0.03, 0)
    k.add(g, m.grass)
  }
  grassArea(-30, -14, -18, -1); grassArea(-31, -40, -22, -27); grassArea(-18, -33, -6, -28)
  grassArea(7.5, -2, 24, 12); grassArea(-19, -2.5, -12.5, 14); grassArea(0, -44, 9, -33)

  // ---------------------------------------------------------------- LATE-COMERS' PORTICO (REVAK)
  // Five bays; the middle bay is taller and the two middle piers project 80 cm forward (inventory). Piers marble-clad, arches brick, lower base rough stone (photo).
  const PORTICO_D = -10.4, PORTICO_I = -9.5, PORTICO_X = 12.2
  const MID_D = PORTICO_D - 0.8
  const sideArch: [number, number][] = [[4.85, 3.7], [9.45, 3.7]]
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 3 : -PORTICO_X, x1 = s > 0 ? PORTICO_X : -3
    const shape = rect(x0, 0, x1, 8.3)
    for (const [cx, g] of sideArch) shape.holes.push(arch(new THREE.Path(), s * cx, 1, g, 3.6, 1.9))
    k.add(subtract(shape, PORTICO_I - PORTICO_D, PORTICO_D), m.weave)
    for (const [cx, g] of sideArch) {
      // Arch ring, plastered inner soffit, back face plaster
      k.add(ring(s * cx, 4.6, g + 0.7, 0.01, 2.25, g, 0.01, 1.9, 0.08, PORTICO_D - 0.06), m.brick)
      k.add(ring(s * cx, 1, g, 3.6, 1.9, g - 0.04, 3.6, 1.87, PORTICO_I - PORTICO_D, PORTICO_D), m.plasterBright)
    }
    const back = rect(x0, 1, x1, 8.3)
    for (const [cx, g] of sideArch) back.holes.push(arch(new THREE.Path(), s * cx, 1, g, 3.6, 1.9))
    k.add(subtract(back, 0.02, PORTICO_I), m.plasterBright)
    // Marble-clad piers
    for (const ax of [7.15, 11.75]) box(0.92 + 0.08, 3.6, 1, u.marble, s * ax, F + 1.8, (PORTICO_D + PORTICO_I) / 2)
    // Low marble railing between the piers
    for (const [cx, g] of sideArch) box(g, 1, 0.34, u.marble, s * cx, F + 0.5, PORTICO_D + 0.3)
    // Eave
    box(PORTICO_X - 3 + 0.5, 0.14, 0.34, u.marble, s * (PORTICO_X + 3 + 0.25) / 2, 8.25, PORTICO_D - 0.02)
    saw(PORTICO_X - 3, 8.02, s * (PORTICO_X + 3) / 2, PORTICO_D, Math.PI, 0)
    saw(PORTICO_X - 3, 7.76, s * (PORTICO_X + 3) / 2, PORTICO_D, Math.PI, 0)
  }
  // Middle bay: projecting block, tall arch, its own eave
  const midShape = rect(-3, 0, 3, 9.8)
  midShape.holes.push(arch(new THREE.Path(), 0, 1, 4.2, 3.7, 2.6))
  k.add(subtract(midShape, PORTICO_I - MID_D, MID_D), m.weave)
  k.add(ring(0, 4.7, 4.9, 0.01, 2.95, 4.2, 0.01, 2.6, 0.08, MID_D - 0.06), m.brick)
  k.add(ring(0, 1, 4.2, 3.7, 2.6, 4.16, 3.7, 2.57, PORTICO_I - MID_D, MID_D), m.plasterBright)
  for (const s of [-1, 1]) box(0.98, 3.7, PORTICO_I - MID_D + 0.08, u.marble, s * 2.5, F + 1.85, (MID_D + PORTICO_I) / 2)
  box(6.5, 0.14, 0.34, u.marble, 0, 9.75, MID_D - 0.02)
  saw(6, 9.52, 0, MID_D, Math.PI, 0)
  saw(6, 9.26, 0, MID_D, Math.PI, 0)
  for (const s of [-1, 1]) {
    saw(6.1, 9.52, s * 3, -8.15, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0)
    box(0.34, 0.14, 6.4, u.marble, s * 3.1, 9.75, -8.15)
  }
  // Steps, base and portico floor
  for (const [z0, z1] of [[MID_D - 1.4, MID_D]] as const) {
    for (let i = 0; i < 5; i++) {
      const d = (z1 - z0) * (5 - i) / 5
      box(4.2, 0.2, d, u.marble, 0, 0.1 + i * 0.2, z1 - d / 2)
    }
  }
  for (const s of [-1, 1]) {
    box(PORTICO_X - 3 + 0.25, 1, 0.85, u.stone, s * (PORTICO_X + 3) / 2 + s * 0.1, 0.5, PORTICO_D + 0.4)
    box(PORTICO_X - 3 + 0.25, 0.36, 0.6, u.stone, s * (PORTICO_X + 3) / 2 + s * 0.1, 0.18, PORTICO_D - 0.25)
    box(0.98, 1.02, PORTICO_I - MID_D + 0.08, u.stone, s * 2.5, 0.5, (MID_D + PORTICO_I) / 2)
  }
  box(PORTICO_X * 2 - 1.8, F, 5.4, u.stone, 0, F / 2, -7.4)
  box(PORTICO_X * 2 - 1.8, 0.02, 5.8, u.paving, 0, F + 0.01, -7.6)
  box(4.2, F, 1.7, u.stone, 0, F / 2, MID_D + 0.85)
  box(4.2, 0.02, 1.7, u.paving, 0, F + 0.01, MID_D + 0.85)

  // Portico end walls and arches between bays
  for (const s of [-1, 1] as const) {
    plasterActive = m.plasterBright
    wallZ(s * 11.3, s, -10.4, -5.1, 8.3, 0.9, m.weave, [])
    plasterActive = m.plaster
    for (const ax of [3, 7.15]) {
      const b = rect(-2.2, 4.5, 2.2, s * ax === 3 ? 8 : 8)
      b.holes.push(arch(new THREE.Path(), 0, 4.5, 3.7, 0.05, 1.8))
      k.add(place(subtract(b, 0.5, -0.25), s * ax, 0, -7.3, Math.PI / 2), m.plasterBright)
    }
  }

  // Portico ceiling and small domes (the north-facing middle bay is taller)
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 3 : -11.3, x1 = s > 0 ? 11.3 : -3
    const p = rect(x0, 5.1, x1, 9.5)
    for (const cx of [4.85, 9.45]) p.holes.push(new THREE.Path().absarc(s * cx, 7.3, 1.95, 0, Math.PI * 2, true))
    kRoof.add(new THREE.ShapeGeometry(p, 20).rotateX(Math.PI / 2).translate(0, 7, 0), m.plasterBright)
    for (const cx of [4.85, 9.45]) domeInner(s * cx, 7, -7.3, 1.95, 1.5, false, m.domeInnerBright)
  }
  {
    const p = rect(-3, 5.1, 3, 11.2)
    p.holes.push(new THREE.Path().absarc(0, 8.15, 2.5, 0, Math.PI * 2, true))
    kRoof.add(new THREE.ShapeGeometry(p, 24).rotateX(Math.PI / 2).translate(0, 7.45, 0), m.plasterBright)
    domeInner(0, 7.45, -8.15, 2.5, 2.05, false, m.domeInnerBright)
  }

  // Portico roof: lead-clad sloped cover on both sides, tall domed bay in the middle (photo)
  hipRoofTop(3, PORTICO_X + 0.42, PORTICO_D - 0.4, -4.8, 8.32, 9.5, 1.5)
  hipRoofTop(-PORTICO_X - 0.42, -3, PORTICO_D - 0.4, -4.8, 8.32, 9.5, 1.5)
  hipRoofTop(-3.45, 3.45, MID_D - 0.42, -4.9, 9.82, 10.5, 0.55)
  box(0.3, 1.7, 6.1, m.weave, -3.15, 8.95, -8.05)
  box(0.3, 1.7, 6.1, m.weave, 3.15, 8.95, -8.05)
  domeOuter(0, 10.42, -8.05, 2.65, 2.4, 0.85)

  // ---------------------------------------------------------------- MAIN BODY (inverted T)
  const K_BOTTOM = (a: number, F2: number): Open => ({ tip: 'alt', u: a, F: F2 })
  const K_TOP = (a: number, F2: number): Open => ({ tip: 'top', u: a, F: F2 })
  // Prayer hall north wall: plastered toward the portico and the sofa, main portal in the middle
  wallX(-4.05, -1, -11.75, 11.75, 9, 1.05, m.plasterBright, [{ tip: 'arch', u: 0, y0: F, g: 1.9, flat: 2.5, kH: 0.95 }])
  // Large arch between the sofa and the area in front of the mihrab: springing 1.75 m above the sofa (inventory)
  wallX(4.05, 1, -4.95, 4.95, 9, 1.3, m.plaster, [{ tip: 'arch', u: 0, y0: F, g: 6.8, flat: 1.75, kH: 5.95, stroke: true }])
  // Arches between the sofa and the iwans
  for (const s of [-1, 1] as const) {
    wallZ(s * 4.05, s, -5.1, 4.05, 9, 1.2, m.plaster, [{ tip: 'arch', u: -0.25, y0: F, g: 6.2, flat: 2.2, kH: 4.3, stroke: true }])
    // Iwan outer wall: two windows each, one above the other
    wallZ(s * 10.85, s, -5.1, 3.8, 7.9, 0.9, m.weave, [K_BOTTOM(-2, F), K_BOTTOM(0.95, F), K_TOP(-2, F), K_TOP(0.95, F)])
    // Iwan south wall
    wallX(2.9, 1, s > 0 ? 5.25 : -11.75, s > 0 ? 11.75 : -5.25, 7.9, 0.9, m.weave, s > 0 ? [K_BOTTOM(IWAN_X, F), K_TOP(IWAN_X, F)] : [K_TOP(-9.6, F)])
    // Side walls in front of the mihrab: two windows each, one above the other (inventory: six each)
    wallZ(s * 4.05, s, 3.8, 14.35, 9.2, 0.9, m.weave, [K_BOTTOM(MIHRAB_Z - 2.2, PLATFORM), K_BOTTOM(MIHRAB_Z + 2.2, PLATFORM), K_TOP(MIHRAB_Z - 2.2, PLATFORM), K_TOP(MIHRAB_Z + 2.2, PLATFORM)])
  }
  // Qibla wall
  wallX(QIBLA_Z, 1, -4.95, 4.95, 9.2, 0.9, m.weave, [K_BOTTOM(-3, PLATFORM), K_BOTTOM(3, PLATFORM), K_TOP(-2.5, PLATFORM), K_TOP(2.5, PLATFORM)])

  // Eave and saw-tooth rows (under the eave, inventory)
  const eave = (L: number, x: number, z: number, ry: number, y: number) => {
    k.add(place(boxG(L + 0.5, 0.14, 0.34).translate(0, y, 0.1), x, 0, z, ry), u.marble)
    saw(L, y - 0.24, x, z, ry, 0)
    saw(L, y - 0.5, x, z, ry, 0)
  }
  for (const s of [-1, 1]) {
    eave(8.9, s * 11.75, -0.65, s > 0 ? Math.PI / 2 : -Math.PI / 2, 7.95)
    eave(6.5, s * 8.5, 3.8, 0, 7.95)
    eave(10.55, s * 4.95, 9.1, s > 0 ? Math.PI / 2 : -Math.PI / 2, 9.2)
  }
  eave(9.9, 0, 14.35, 0, 9.2)

  // Floors: carpet in the sofa and iwans, raised wood-faced platform in front of the mihrab
  const carpetTop = (g: number, d: number, x: number, z: number, y: number, h = 0.04) => box(g, h, d, m.carpet, x, y - h / 2, z)
  box(21.8, F - 0.02, 7.1, u.stone, 0, F / 2 - 0.01, -0.5)
  carpetTop(8.1, 8.2, 0, 0, F + 0.02)
  for (const s of [-1, 1]) carpetTop(6.9, 7, s * 7.4, -0.55, F + 0.02)
  k.add(new THREE.PlaneGeometry(6.6, 6.6).rotateX(-Math.PI / 2).translate(0, F + 0.035, -0.2), m.roseCarpet)
  const PZ0 = 4.1, PZ1 = QIBLA_Z
  box(8.1, PLATFORM, PZ1 - PZ0, u.stone, 0, PLATFORM / 2, (PZ0 + PZ1) / 2)
  carpetTop(8.1, PZ1 - PZ0, 0, (PZ0 + PZ1) / 2, PLATFORM + 0.02)
  // Platform front face: wooden panel and three-part frame
  box(6.8, PLATFORM - F, 0.05, m.walnutLight, 0, (PLATFORM + F) / 2, PZ0 - 0.02)
  box(6.84, 0.06, 0.09, m.walnut, 0, PLATFORM - 0.02, PZ0 - 0.03)
  for (const cx of [-2.6, 2.6]) box(1.5, 0.34, 0.02, m.walnut, cx, F + 0.28, PZ0 - 0.06)
  for (const [z1, h] of [[PZ0 - 0.5, 0.3], [PZ0 - 1, 0.15]] as const) {
    box(2.4, h, 0.5, m.walnutLight, 0, F + h / 2, z1 + 0.25)
    carpetTop(2.4, 0.5, 0, z1 + 0.25, F + h + 0.012, 0.02)
  }

  // Ceiling: central sofa — flat pendentives, muqarnas corners, sixteen-sided drum, dome
  pendentive(0, 0, 4.05, 4.05, BAND_BOTTOM, 10.7, 4.05)
  muqarnasCorner(0, 0, 4.05, BAND_BOTTOM + 0.15, 3, 1.1)
  kDrum.add(place(cylinderG(4.05, 4.05, 1, 36, true), 0, 11.2, 0), m.plaster)
  // Six windows and twelve niches in the drum (inventory)
  for (let n = 0; n < 18; n++) {
    const a = (n / 18) * Math.PI * 2 + Math.PI / 18
    const pen = n % 3 === 0
    const s = arch(new THREE.Shape(), 0, 10.82, 0.5, 0.42, 0.28)
    const g = (pen ? uvFit(new THREE.ShapeGeometry(s, 6)) : new THREE.ShapeGeometry(s, 6)).translate(0, 0, -4.02)
    g.rotateY(a)
    g.translate(0, 0, 0)
    kDrum.add(g, pen ? m.stainedGlass : m.niche)
  }
  domeInner(0, 11.7, 0, 4.05, 3.95, true)

  // Ceiling: in front of the mihrab — Turkish-triangle belt, three windows, dome
  triangleBelt(0, MIHRAB_Z, 4.05, BAND_BOTTOM, 11, 4.05)
  kDrum.add(place(cylinderG(4.05, 4.05, 0.7, 36, true), 0, 11.35, MIHRAB_Z), m.plaster)
  domeInner(0, 11.7, MIHRAB_Z, 4.05, 3.95, false)
  for (const a of [Math.PI / 2, -Math.PI / 2, 0]) {
    const sk = () => arch(new THREE.Shape(), 0, 9.2, 0.82, 0.8, 0.5)
    kRoof.add(uvFit(new THREE.ShapeGeometry(sk(), 8)).rotateY(Math.PI).translate(0, 0, 3.98).rotateY(a).translate(0, 0, MIHRAB_Z), m.stainedGlass)
    const frameBorder = arch(new THREE.Shape(), 0, 9.05, 1.28, 0.95, 0.75)
    frameBorder.holes.push(arch(new THREE.Path(), 0, 9.2, 0.82, 0.8, 0.5))
    kRoof.add(subtract(frameBorder, 0.03, 3.95).rotateY(a).translate(0, 0, MIHRAB_Z), m.plaster)
  }
  // Molding between the wall and the belt
  for (const s of [-1, 1]) {
    box(0.14, 0.1, 8.1, m.stroke, s * 4.0, BAND_BOTTOM, MIHRAB_Z)
    box(8.1, 0.1, 0.14, m.stroke, 0, BAND_BOTTOM, MIHRAB_Z + s * 4.0)
  }

  // Ceiling: iwans — dome and a barrel vault to the north (inventory). Muqarnas pendentives on the west, large almond belt on the east.
  for (const s of [-1, 1]) {
    const cx = s * IWAN_X
    pendentive(cx, IWAN_Z, 2.8, 2.8, 7.2, 8.4, 2.8)
    if (s < 0) muqarnasCorner(cx, IWAN_Z, 2.8, 7.32, 2, 0.8)
    kDrum.add(place(cylinderG(2.8, 2.8, 0.4, 28, true), cx, 8.6, IWAN_Z), m.plaster)
    if (s > 0) for (let n = 0; n < 16; n++) {
      const a = (n / 16) * Math.PI * 2
      const g = new THREE.SphereGeometry(0.2, 6, 4).scale(1, 0.75, 0.3).translate(0, 8.6, -2.73).rotateY(a).translate(cx, 0, IWAN_Z)
      kDrum.add(g, m.plaster)
    }
    domeInner(cx, 8.8, IWAN_Z, 2.8, 2.6, false)
    // Vault: the strip north of the dome
    const tone = new THREE.CylinderGeometry(2.8, 2.8, 1.4, 20, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(cx, 7.2, -3.4)
    tone.scale(1, 1, 1)
    kRoof.add(tone, m.plaster)
    // Outside: lead cover sloping to four sides and dome
    hipRoofTop(s > 0 ? 5.1 : -11.95, s > 0 ? 11.95 : -5.1, -5, 4, 7.98, 9.15, 0.55)
    domeOuter(cx, 9, IWAN_Z, 3.05, 3, 0.8)
  }

  // Outside: main body roof slab, octagonal drums, domes
  const plate = rect(-5.1, -14.5, 5.1, 5.2)
  for (const cz of [0, MIHRAB_Z]) plate.holes.push(new THREE.Path().absarc(0, -cz, 4.8, 0, Math.PI * 2, true))
  kRoof.add(subtract(plate, 0.16).rotateX(-Math.PI / 2).translate(0, 9.15, 0), u.lead)
  outerDrum(0, 0, 4.92, 9.3, 11.75, [1, 2, 3, 5, 6, 7], 0.56, 0.72)
  outerDrum(0, MIHRAB_Z, 4.92, 9.3, 11.75, [2, 0, 6], 0.56, 0.72)
  domeOuter(0, 11.95, 0, 4.72, 4.45, 1.1)
  domeOuter(0, 11.95, MIHRAB_Z, 4.72, 4.45, 1.1)

  // Door surround and inscription (the inscription panel in the photo)
  {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, -5.1, Math.PI), mat)
    ext(ring(0, F, 2.7, 2.65, 1.25, 1.9, 2.5, 0.95, 0.12, 0), u.marble)
    const inscriptionG = new THREE.PlaneGeometry(2.4, 2.4 * (347 / 1024)).translate(0, 5.42, 0.05)
    ext(boxG(2.6, 1, 0.05).translate(0, 5.42, 0.01), u.marble)
    ext(inscriptionG, m.inscription)
    // Open walnut door leaves: inside the frame, do not block the passage
    for (const s of [-1, 1]) ext(boxG(0.07, 2.6, 0.84).translate(s * 0.92, F + 1.3, -0.55), m.walnut)
  }
  // Interior: springing molding of the large arch and plaster line of the iwan arch
  for (const s of [-1, 1]) {
    box(0.66, 0.06, 1.34, m.stroke, s * 3.74, F + 1.77, 4.7)
    box(1.24, 0.06, 0.82, m.stroke, s * 4.65, F + 2.22, -3.7)
    box(1.24, 0.06, 1.25, m.stroke, s * 4.65, F + 2.22, 3.4)
  }

  // Mihrabiyes on the inner faces of the middle bay piers (inventory p. 180)
  for (const s of [-1, 1]) {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, s * 2.0, 0, (MID_D + PORTICO_I) / 2, s > 0 ? -Math.PI / 2 : Math.PI / 2), mat)
    ext(ring(0, F + 0.5, 0.86, 1.5, 0.5, 0.62, 1.42, 0.4, 0.05, 0), m.stroke)
    ext(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, F + 0.5, 0.62, 1.42, 0.4), 8).translate(0, 0, 0.01), u.marbleDark)
  }
  // Wall sconces (photo): small iron arm and a lit lamp
  const sconce = (x: number, y: number, z: number, ry: number) => {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z, ry), mat)
    ext(boxG(0.02, 0.02, 0.26).translate(0, y + 0.1, -0.13), u.bronze)
    ext(cylinderG(0.03, 0.07, 0.08, 8).translate(0, y + 0.06, -0.26), u.bronze)
    ext(new THREE.SphereGeometry(0.075, 8, 6).translate(0, y - 0.03, -0.26), u.lamp)
  }
  for (const s of [-1, 1]) {
    for (const z of [MIHRAB_Z - 2.9, MIHRAB_Z, MIHRAB_Z + 2.9]) sconce(s * 4.05, 5.3, z, s > 0 ? Math.PI / 2 : -Math.PI / 2)
    sconce(s * 10.85, 4.2, -0.5, s > 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  sconce(-1.9, 5.1, QIBLA_Z, 0); sconce(1.9, 5.1, QIBLA_Z, 0)

  // ---------------------------------------------------------------- MIHRAB
  {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 0, 0, QIBLA_Z, Math.PI), mat)
    const G = 3, T = 6.95, NG = 1.5, NH = 3.2, D = 0.55
    const block = rect(-G / 2, PLATFORM, G / 2, T)
    block.holes.push(rect(-NG / 2, PLATFORM, NG / 2, PLATFORM + NH) as unknown as THREE.Path)
    ext(subtract(block, D), m.plaster)
    ext(boxG(NG, NH, 0.05).translate(0, PLATFORM + NH / 2, 0.03), m.plaster)
    const band = (x0: number, y0: number, x1: number, y1: number) => {
      const s = rect(x0, y0, x1, y1), b = 0.2
      s.holes.push(rect(x0 + b, y0 + b, x1 - b, y1 - b) as unknown as THREE.Path)
      ext(subtract(s, 0.03, D), m.mihrabBandOf)
    }
    band(-G / 2 + 0.02, PLATFORM + 0.05, G / 2 - 0.02, T - 0.05)
    band(-NG / 2 - 0.26, PLATFORM + 0.03, NG / 2 + 0.26, PLATFORM + NH + 0.95)
    // Blank upper panel
    ext(boxG(NG, 0.42, 0.04).translate(0, PLATFORM + NH + 0.5, D + 0.02), m.walnut)
    ext(boxG(NG - 0.1, 0.32, 0.05).translate(0, PLATFORM + NH + 0.5, D + 0.02), m.medallion)
    // Six rows of muqarnas above the niche (inventory)
    const TIER = 6, SH = 0.33
    for (let i = 0; i < TIER; i++) {
      const o = 1 - i / TIER
      const g = (NG - 0.05) * o + 0.12, y = PLATFORM + NH - TIER * SH + i * SH, dr = 0.1 + 0.44 * (1 - o)
      const n = Math.max(1, Math.round(g / 0.27))
      ext(boxG(g, SH * 0.9, dr).translate(0, y + SH / 2, dr / 2 + 0.03), m.plaster)
      for (let j = 0; j < n; j++) {
        const x = -g / 2 + (j + 0.5) * (g / n)
        const h = new THREE.SphereGeometry((g / n) * 0.48, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, SH * 1.9 / (g / n), 0.55)
        ext(h.translate(x, y + 0.04, dr + 0.03), m.plaster)
      }
    }
  }

  // ---------------------------------------------------------------- MINBAR (wooden, red fabric kiosk door)
  {
    const { length: LENGTH, en: EN, apex: TOP, z0, x } = MINBAR
    const ext = (g: THREE.BufferGeometry, mat: Mat) => { g.rotateY(-Math.PI / 2); g.translate(x, 0, z0); k.add(g, mat) }
    const side = new THREE.Shape()
    side.moveTo(0.7, PLATFORM); side.lineTo(LENGTH, PLATFORM); side.lineTo(LENGTH, PLATFORM + TOP + 0.5); side.lineTo(LENGTH - 1.15, PLATFORM + TOP + 0.5)
    side.lineTo(1.5, PLATFORM + 0.9); side.lineTo(0.7, PLATFORM + 0.9); side.closePath()
    for (const s of [-1, 1]) ext(subtract(side, 0.14, s * (EN / 2) - 0.07), m.walnut)
    const edge = new THREE.Shape()
    edge.moveTo(1.5, PLATFORM + 0.9); edge.lineTo(LENGTH - 1.15, PLATFORM + TOP + 0.5); edge.lineTo(LENGTH - 1.15, PLATFORM + TOP + 0.7); edge.lineTo(1.5, PLATFORM + 1.1); edge.closePath()
    for (const s of [-1, 1]) ext(subtract(edge, 0.2, s * (EN / 2) - 0.1), m.walnutLight)
    const STEP = 9, ramp = (s: number) => (MINBAR.h1 * (s - MINBAR.s0)) / (MINBAR.s1 - MINBAR.s0)
    for (let i = 0; i < STEP; i++) {
      const s = MINBAR.s0 + ((i + 0.5) / STEP) * (MINBAR.s1 - MINBAR.s0), h = Math.max(0.05, ramp(s))
      ext(boxG((MINBAR.s1 - MINBAR.s0) / STEP + 0.02, h, EN - 0.28).translate(s, PLATFORM + h / 2, 0), m.red)
    }
    const kioskS = LENGTH - 0.6
    ext(boxG(1.15, 2.1, EN).translate(kioskS, PLATFORM + TOP + 0.5 + 1.05, 0), m.walnut)
    ext(boxG(0.05, 1.5, EN - 0.5).translate(kioskS - 0.6, PLATFORM + TOP + 1.45, 0), m.red)
    ext(boxG(1.2, 0.12, EN + 0.06).translate(kioskS, PLATFORM + TOP + 2.66, 0), m.walnutLight)
    ext(flatShadow(cylinderG(0.05, EN * 0.7, 2, 8).scale(0.72, 1, 1)).translate(kioskS, PLATFORM + TOP + 3.72, 0), m.walnut)
    ext(rotateG([[0.08, 0], [0.03, 0.18], [0.1, 0.36], [0.03, 0.54], [0.02, 0.95], [0, 1]], 8).translate(kioskS, PLATFORM + TOP + 4.68, 0), u.gold)
    for (const s of [-1, 1]) ext(boxG(0.7, 3.2, 0.4).translate(0.35, PLATFORM + 1.6, s * (EN / 2 - 0.1)), m.walnut)
    ext(boxG(0.7, 0.6, EN + 0.2).translate(0.35, PLATFORM + 2.95, 0), m.walnut)
    ext(boxG(0.02, 0.42, EN - 0.1).translate(-0.01, PLATFORM + 2.95, 0), m.red)
    ext(boxG(0.74, 0.1, EN + 0.26).translate(0.35, PLATFORM + 3.3, 0), m.walnutLight)
  }

  // ---------------------------------------------------------------- IWAN MIHRABS
  {
    // South wall of the west iwan: half-cylindrical niche, pointed lunette, curtain depiction, malakâri (inventory)
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, -7.1, 0, 2.9, Math.PI), mat)
    const shape = arch(new THREE.Shape(), 0, F, 2.2, 3.1, 1.5)
    shape.holes.push(arch(new THREE.Path(), 0, F + 0.1, 1.15, 2.2, 0.8))
    ext(subtract(shape, 0.2), m.plaster)
    ext(ring(0, F, 2.3, 3.1, 1.56, 2.2, 3.1, 1.5, 0.21, 0), m.stroke)
    ext(new THREE.PlaneGeometry(1.15, 3).translate(0, F + 1.5, 0.02), m.curtain)
    ext(new THREE.PlaneGeometry(1.5, 0.75).translate(0, F + 3.95, 0.205), m.malakari)
    // East iwan: plain niche thought to have possibly been a hearth previously
    const extD = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, 5.9, 0, 2.9, Math.PI), mat)
    const sD = arch(new THREE.Shape(), 0, F, 1.5, 1.9, 0.9)
    sD.holes.push(arch(new THREE.Path(), 0, F + 0.04, 0.9, 1.5, 0.6))
    extD(subtract(sD, 0.16), m.plaster)
    extD(new THREE.PlaneGeometry(0.9, 2.1).translate(0, F + 1.05, 0.015), m.plaster)
  }

  // Octagonal panels: blank, on the upper wall in front of the mihrab (interpreted from the photo layout)
  const plaque = (x: number, y: number, z: number, ry: number) => {
    const g = new THREE.CircleGeometry(0.46, 8).rotateZ(Math.PI / 8)
    k.add(place(g.translate(0, 0, 0), x, y, z, ry), m.medallion)
    k.add(place(new THREE.RingGeometry(0.44, 0.5, 8).rotateZ(Math.PI / 8), x, y, z, ry), u.gold)
  }
  plaque(-1.1, 7.75, QIBLA_Z - 0.03, Math.PI); plaque(1.1, 7.75, QIBLA_Z - 0.03, Math.PI)
  for (const s of [-1, 1]) for (const z of [MIHRAB_Z - 3.9 + 0.6, MIHRAB_Z, MIHRAB_Z + 3.3]) plaque(s * 4.02, 7.9, z, s > 0 ? -Math.PI / 2 : Math.PI / 2)

  // ---------------------------------------------------------------- MINARET (base brick and cut stone, shaft brick, single balcony, two rows of tiles under the balcony: inventory)
  {
    const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, MINARET.x, 0, MINARET.z), mat)
    ext(flatShadow(cylinderG(1.8, 1.8, 7.3, 12).rotateY(Math.PI / 12).translate(0, 3.65, 0)), m.weave)
    ext(flatShadow(cylinderG(1.86, 1.86, 0.14, 12).rotateY(Math.PI / 12).translate(0, 7.3, 0)), u.marble)
    ext(flatShadow(cylinderG(1.3, 1.8, 1.3, 12).rotateY(Math.PI / 12).translate(0, 8, 0)), m.brick)
    ext(rotateG([[1.3, 8.6], [1.14, 20]], 20), m.brick)
    for (const y of [12, 16]) ext(cylinderG(1.27, 1.27, 0.08, 20, true).translate(0, y, 0), u.stone)
    for (const [y, t] of [[18.9, 0.34], [19.4, 0.3]]) ext(cylinderG(1.2, 1.2, t, 20, true).translate(0, y, 0), m.tile)
    ext(rotateG([[1.14, 19.9], [1.3, 20.2], [1.7, 20.6], [1.75, 20.75]], 20), u.stone)
    for (let a = 0; a < 20; a++) ext(boxG(0.54, 0.95, 0.05).translate(0, 21.2, 1.72).rotateY((a * Math.PI * 2) / 20), u.marble)
    ext(cylinderG(1.76, 1.76, 0.08, 20, true).translate(0, 21.68, 0), u.marble)
    ext(cylinderG(1.74, 1.74, 0.05, 20).translate(0, 20.8, 0), u.stone)
    ext(rotateG([[0.95, 20.7], [0.88, 24.2]], 18), m.brick)
    ext(rotateG([[0.88, 24.1], [1.14, 24.4], [1.1, 24.6], [0.03, 28.7], [0, 28.7]], 18), u.lead)
    ext(rotateG([[0.1, 28.5], [0.03, 28.7], [0.08, 28.9], [0.02, 29.3], [0, 29.35]], 6), u.bronze)
  }

  // ---------------------------------------------------------------- TOMBS
  /** Solid sarcophagus: cover with a pentagonal section. */
  const cenotaph = (x: number, z: number, en: number, length: number, h: number, y0: number, mat: Mat, ry = 0) => {
    const s = new THREE.Shape()
    s.moveTo(-en / 2, 0); s.lineTo(en / 2, 0); s.lineTo(en / 2, h * 0.55); s.lineTo(0, h); s.lineTo(-en / 2, h * 0.55); s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false }).translate(0, 0, -length / 2)
    if (ry) g.rotateY(ry)
    k.add(g.translate(x, y0, z), mat)
    const bs = new THREE.Shape()
    bs.moveTo(-en / 2 - 0.02, 0); bs.lineTo(en / 2 + 0.02, 0); bs.lineTo(en / 2 + 0.02, h * 0.6); bs.lineTo(0, h * 1.1); bs.lineTo(-en / 2 - 0.02, h * 0.6); bs.closePath()
    const cover = new THREE.ShapeGeometry(bs).translate(0, 0, length / 2 + 0.01)
    if (ry) cover.rotateY(ry)
    k.add(cover.translate(x, y0, z), mat)
  }

  // Hamza Bey Türbesi: octagonal, tall octagonal drum, narrow iwan on the east, thirteen sarcophagi (inventory pp. 184-185)
  {
    const { x, z } = HAMZA
    const A = 3.7, T = 1, UPPER = 6.3, L = 2 * (A + T) * Math.tan(Math.PI / 8)
    plasterActive = m.plasterBright
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      const wx = x + Math.sin(a) * A, wz = z + Math.cos(a) * A
      const open: Open[] = []
      // n=0 south (mihrab), n=2 east (door); windows on the remaining six faces
      if (n === 2) open.push({ tip: 'arch', u: 0, y0: 0.05, g: 1.5, flat: 2.1, kH: 0.75 })
      else if (n !== 0) open.push({ tip: 'alt', u: 0, F: 0.05 })
      wall(L, 0, UPPER, wx, wz, a, T, m.weave, open)
      saw(L, UPPER - 0.16, wx, wz, a, T)
      saw(L, UPPER - 0.4, wx, wz, a, T)
      k.add(place(boxG(L + 0.2, 0.12, 0.3).translate(0, UPPER + 0.02, T + 0.12), wx, 0, wz, a), u.marble)
    }
    plasterActive = m.plaster
    // Floor, sarcophagi
    k.add(place(flatShadow(cylinderG(A + 0.2, A + 0.2, 0.06, 8).rotateY(Math.PI / 8)), x, 0.03, z), m.pavingBrick)
    // Layout representative: front of the door empty, Hamza Bey in the middle, six sarcophagi each to the north and south (thirteen in total: inventory)
    box(2.2, 0.5, 2.4, m.walnut, x - 0.6, 0.32, z)
    cenotaph(x - 0.6, z, 0.95, 2, 0.9, 0.56, m.cenotaph)
    for (const s of [-1, 1]) {
      box(4.3, 0.4, 1.5, m.walnut, x - 0.25, 0.26, z + s * 2.62)
      for (let i = 0; i < 6; i++) cenotaph(x - 2.05 + i * 0.72, z + s * 2.62, 0.58, 1.25, 0.66, 0.46, m.cenotaph)
    }
    // Mihrab: with muqarnas, on the south face
    const extM = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, x, 0, z + A, Math.PI), mat)
    const mh = arch(new THREE.Shape(), 0, 0.06, 1.85, 2.5, 0.9)
    mh.holes.push(arch(new THREE.Path(), 0, 0.06, 1.15, 1.9, 0.5))
    extM(subtract(mh, 0.2), m.plasterBright)
    for (let i = 0; i < 3; i++) extM(boxG(1.1 - i * 0.3, 0.24, 0.1 + i * 0.08).translate(0, 2.1 + i * 0.24, 0.1), m.plasterBright)
    // Drum: tall octagon outside, eight plaster-grilled windows inside (inventory)
    const AK = 3.95, Y0 = 6.35, Y1 = 9.35, AIC = 3.4
    const ROUT = (A + T + 0.22) / Math.cos(Math.PI / 8)
    kRoof.add(place(flatShadow(cylinderG(AK / Math.cos(Math.PI / 8) + 0.06, ROUT, 0.75, 8, true).rotateY(Math.PI / 8)), x, UPPER + 0.47, z), u.lead)
    outerDrum(x, z, AK, Y0 + 0.25, Y1, [0, 1, 2, 3, 4, 5, 6, 7], 0.75, 1.05)
    const inner = AIC / Math.cos(Math.PI / 8)
    kDrum.add(place(flatShadow(cylinderG(inner, inner, Y1 - UPPER + 0.1, 8, true).rotateY(Math.PI / 8)), x, (Y1 + UPPER - 0.1) / 2, z), m.plasterBright)
    const ringInner = new THREE.RingGeometry(inner - 0.05, (A + 0.1) / Math.cos(Math.PI / 8), 8).rotateZ(Math.PI / 8).rotateX(Math.PI / 2).translate(x, UPPER - 0.1, z)
    kDrum.add(ringInner, m.plasterBright)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4
      const s = arch(new THREE.Shape(), 0, 7.2, 0.82, 1, 0.5)
      kDrum.add(uvFit(new THREE.ShapeGeometry(s, 8)).rotateY(Math.PI).translate(0, 0, AIC - 0.03).rotateY(a).translate(x, 0, z), m.stainedGlass)
    }
    domeInner(x, Y1, z, AIC + 0.05, 3.2, false, m.domeInnerBright)
    domeOuter(x, Y1 + 0.2, z, 3.65, 3.4, 0.9)
    // Narrow iwan of the east door: arched, lead-covered, projecting outward
    const ex = x + A + T
    for (const s of [-1, 1]) {
      box(1.5, 4.5, 0.5, m.weave, ex + 0.75, 2.25, z + s * 1.05)
      for (let i = 0; i < 2; i++) box(1.53, 0.14, 0.53, u.marble, ex + 0.75, 0.07 + i * 4.36, z + s * 1.05)
    }
    const on = rect(-1.3, 0, 1.3, 4.5)
    on.holes.push(arch(new THREE.Path(), 0, 0, 1.6, 2.15, 1))
    k.add(place(subtract(on, 0.3, 1.5), ex, 0, z, Math.PI / 2), m.weave)
    k.add(place(ring(0, 2.15, 2.2, 0.01, 1.3, 1.6, 0.01, 1, 0.05, 1.8), ex, 0, z, Math.PI / 2), m.brick)
    box(1.5, 0.12, 1.6, m.plaster, ex + 0.75, 4.3, z)
    hipRoofTop(ex - 0.1, ex + 2.05, z - 1.55, z + 1.55, 4.5, 5.1, 0.45)
  }

  // Hamza Bey Ailesi Türbesi: square, dome without drum, door on the north with marble-framed windows on both sides, zigzag brick upper facade, three sarcophagi (inventory pp. 186-187)
  {
    const { x, z } = FAMILY
    const A = 1.9, T = 0.8, UPPER = 6.6, F2 = 0.05
    plasterActive = m.plasterBright
    // North wall
    wallX(z - A, -1, x - A - T, x + A + T, UPPER, T, m.weave, [{ tip: 'arch', u: x, y0: F2, g: 1.4, flat: 2.1, kH: 0.75 }, K_BOTTOM(x - 1.55, F2 + 0.05), K_BOTTOM(x + 1.55, F2 + 0.05)])
    wallX(z + A, 1, x - A - T, x + A + T, UPPER, T, m.weave, [K_BOTTOM(x - 0.9, F2), K_BOTTOM(x + 0.9, F2)])
    wallZ(x + A, 1, z - A - T, z + A + T, UPPER, T, m.weave, [K_BOTTOM(z, F2)])
    wallZ(x - A, -1, z - A - T, z + A + T, UPPER, T, m.weave, [K_BOTTOM(z - 0.9, F2), K_BOTTOM(z + 0.9, F2)])
    plasterActive = m.plaster
    const face = A + T
    const plaqueZ = (L: number, wx: number, wz: number, ry: number) => {
      const p = rect(-L / 2, 3.55, L / 2, UPPER - 0.32)
      p.holes.push(arch(new THREE.Path(), 0, 4.4, 0.85, 0.75, 0.42))
      k.add(place(subtract(p, 0.03, 0), wx, 0, wz, ry), m.zigzagOf)
      const sk = () => uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 4.4, 0.85, 0.75, 0.42), 8))
      k.add(place(sk().translate(0, 0, 0.01), wx, 0, wz, ry), m.lattice)
      k.add(place(ring(0, 4.28, 1.3, 0.8, 0.65, 0.85, 0.75, 0.42, 0.05, 0.02, 4.4), wx, 0, wz, ry), m.brick)
      saw(L, UPPER - 0.2, wx, wz, ry, 0)
      k.add(place(boxG(L + 0.3, 0.12, 0.3).translate(0, UPPER, 0.1), wx, 0, wz, ry), u.marble)
    }
    plaqueZ(face * 2, x, z - face, Math.PI); plaqueZ(face * 2, x, z + face, 0); plaqueZ(face * 2, x + face, z, Math.PI / 2); plaqueZ(face * 2, x - face, z, -Math.PI / 2)
    // Floor, ceiling, sarcophagi
    box(A * 2 + 0.4, 0.06, A * 2 + 0.4, m.pavingBrick, x, 0.03, z)
    box(2.6, 0.5, 1.7, m.walnut, x, 0.31, z + 0.9)
    for (const o of [-0.85, 0, 0.85]) cenotaph(x + o, z + 0.9, 0.62, 1.5, 0.62, 0.56, m.brocade)
    pendentive(x, z, A, A, 5.2, 6.5, A, kRoof, m.plasterBright)
    domeInner(x, 6.5, z, A, 1.9, false, m.domeInnerBright)
    hipRoofTop(x - face - 0.28, x + face + 0.28, z - face - 0.28, z + face + 0.28, 6.62, 7.3, 0.55)
    domeOuter(x, 7.2, z, 2.55, 1.85, 0.75)
  }

  // Kara Mustafa Paşa Türbesi: square, octagonal drum, dome (inventory pp. 188-189); modeled here as an exterior mass.
  {
    const { x, z } = MUSTAFA
    const H = 4.1, Y = 6.9
    k.add(place(subtract(rect(-H, 0, H, Y), H * 2, -H), x, 0, z), m.weave)
    for (const [wx, wz, ry] of [[x, z + H, 0], [x, z - H, Math.PI], [x + H, z, Math.PI / 2], [x - H, z, -Math.PI / 2]] as const) {
      const ext = (g: THREE.BufferGeometry, mat: Mat) => k.add(place(g, wx, 0, wz, ry), mat)
      saw(H * 2, Y - 0.2, wx, wz, ry, 0)
      saw(H * 2, Y - 0.44, wx, wz, ry, 0)
      ext(boxG(H * 2 + 0.3, 0.12, 0.3).translate(0, Y, 0.1), u.marble)
      for (const o of [-2.4, 2.4]) {
        if (ry === 0) continue
        ext(new THREE.ShapeGeometry(rect(o - 0.6, 1, o + 0.6, 2.7)).translate(0, 0, 0.02), m.balustrade)
        ext(boxG(1.46, 0.16, 0.1).translate(o, 2.78, 0.05), u.marble)
      }
      for (const o of [-2.4, 0, 2.4]) {
        ext(uvFit(new THREE.ShapeGeometry(arch(new THREE.Shape(), o, 3.6, 0.95, 1.1, 0.55), 8)).translate(0, 0, 0.02), m.lattice)
        ext(ring(o, 3.6, 1.45, 1.1, 0.8, 0.95, 1.1, 0.55, 0.05, 0.02), m.brick)
      }
    }
    // Lead-covered arched entrance on the south (photo); the door is closed
    const ex = z + H
    for (const s of [-1, 1]) box(0.5, 4.6, 2, m.weave, x + s * 1.45, 2.3, ex + 1)
    const on = rect(-1.7, 0, 1.7, 4.6)
    on.holes.push(arch(new THREE.Path(), 0, 0, 2.2, 2.2, 1.2))
    k.add(place(subtract(on, 0.3, 0), x, 0, ex + 1.7), m.weave)
    k.add(place(ring(0, 2.2, 2.9, 0.01, 1.55, 2.2, 0.01, 1.2, 0.06, 0.3), x, 0, ex + 1.7), m.brick)
    box(1.5, 2.6, 0.08, m.walnut, x, 1.3, ex + 0.04)
    hipRoofTop(x - 1.95, x + 1.95, ex - 0.1, ex + 2.25, 4.6, 5.3, 0.5)
    // Annex on the east (photo, inventory "ekleme")
    box(1.7, 4.2, 4.4, m.weave, x + H + 0.85, 2.1, z - 0.2)
    hipRoofTop(x + H - 0.05, x + H + 1.9, z - 2.6, z + 2.2, 4.2, 4.7, 0.3)
    // Roof: lead chamfers at the corners, octagonal drum, dome
    hipRoofTop(x - H - 0.28, x + H + 0.28, z - H - 0.28, z + H + 0.28, Y + 0.02, Y + 0.85, 0.75)
    outerDrum(x, z, 3.55, Y + 0.72, 9.7, [0, 2, 4, 6], 0.7, 0.8)
    domeOuter(x, 9.92, z, 3.42, 3.2, 0.85)
  }

  // Octagonal kiosk in the courtyard: interpreted only from the bird's-eye photo, not named in the source.
  {
    const x = -0.4, z = -25, R = 3.1
    octagon(R + 0.3, R + 0.3, 0, 0.2, k, u.marble, x, z, false)
    for (let n = 0; n < 8; n++) {
      const a = Math.PI / 8 + (n * Math.PI) / 4
      k.add(place(cylinderG(0.09, 0.11, 2.8, 8), x + Math.sin(a) * R, 1.6, z + Math.cos(a) * R), u.bronze)
    }
    octagon(R + 0.05, R + 0.05, 3, 3.3, k, u.lead, x, z, false)
    k.add(place(flatShadow(cylinderG(0.5, R + 0.4, 1.3, 8).rotateY(Math.PI / 8)), x, 3.95, z), u.dark)
  }

  // ---------------------------------------------------------------- TREES (positions from the bird's-eye photo, heights representative)
  const crowns = (x: number, z: number, r: number, y: number, mat: Mat, seed: number) => {
    for (let i = 0; i < 4; i++) {
      const a = seed + i * 1.9, d = i === 0 ? 0 : r * 0.55
      const g = new THREE.IcosahedronGeometry(i === 0 ? r : r * 0.62, 3)
      const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
      for (let v = 0; v < p.count; v++) {
        const vx = p.getX(v), vy = p.getY(v), vz = p.getZ(v)
        const o = 1 + 0.12 * Math.sin(vx * 1.7 + seed) * Math.cos(vz * 1.5) + 0.09 * Math.sin(vy * 2.6 + seed * 2) + 0.05 * Math.sin((vx + vz) * 5 + vy * 4)
        // Soft shading: the normal stays the sphere normal.
        n.setXYZ(v, vx, vy, vz)
        p.setXYZ(v, vx * o, vy * o * 0.82, vz * o)
        uv.setXY(v, vx + vy, vz + vy)
      }
      n.needsUpdate = true
      g.normalizeNormals()
      k.add(place(g, x + Math.sin(a) * d, y + (i === 0 ? 0 : -r * 0.2), z + Math.cos(a) * d), mat)
    }
    k.add(place(cylinderG(r * 0.09, r * 0.14, y, 8), x, y / 2, z), m.body)
  }
  crowns(16.5, -25.5, 5.2, 10, m.leafYellow, 1)
  crowns(-10.5, -19.5, 3.8, 8, m.leafYellow, 2)
  crowns(19, -5, 3.6, 7, m.leafGreen, 3)
  crowns(-26, -33.5, 3.4, 7, m.leafGreen, 4)
  crowns(-15, -29, 3.3, 7, m.leafGreen, 5)
  const cypress = (x: number, z: number, length: number) => {
    const p: [number, number][] = [[0.15, 1.5], [1.2, 2.1], [1.7, length * 0.2], [1.95, length * 0.33], [1.85, length * 0.47], [1.55, length * 0.61], [1.15, length * 0.75], [0.72, length * 0.87], [0.3, length * 0.96], [0, length]]
    const g = rotateG(p, 18)
    k.add(place(g, x, 0, z), u.cypress)
    k.add(place(cylinderG(0.2, 0.3, 2.2, 8), x, 1.1, z), m.body)
  }
  cypress(-23, -3, 15); cypress(9.5, 8.5, 14); cypress(-9, 11, 13); cypress(6, -43, 14)
  const trees: { x: number; z: number; r: number }[] = [
    { x: 16.5, z: -25.5, r: 0.55 }, { x: -10.5, z: -19.5, r: 0.4 }, { x: 19, z: -5, r: 0.4 }, { x: -26, z: -33.5, r: 0.4 }, { x: -15, z: -29, r: 0.4 },
    { x: -23, z: -3, r: 0.3 }, { x: 9.5, z: 8.5, r: 0.3 }, { x: -9, z: 11, r: 0.3 }, { x: 6, z: -43, r: 0.3 },
  ]

  // ---------------------------------------------------------------- WALKING
  const k1 = (x0: number, x1: number, z0: number, z1: number, top?: number): Box => ({ x0: x0 + OX, x1: x1 + OX, z0: z0 + OZ, z1: z1 + OZ, top })
  const mainWalls: Box[] = [
    // Portico front line: only the middle bay is open
    k1(-PORTICO_X, -2.1, PORTICO_D - 0.2, PORTICO_I), k1(2.1, PORTICO_X, PORTICO_D - 0.2, PORTICO_I),
    k1(-3, -2.1, MID_D, PORTICO_I), k1(2.1, 3, MID_D, PORTICO_I),
    // Portico ends
    k1(-PORTICO_X, -11.3, PORTICO_D, -5.1), k1(11.3, PORTICO_X, PORTICO_D, -5.1),
    // Prayer hall north wall, door in the middle
    k1(-11.75, -0.95, -5.1, -4.05), k1(0.95, 11.75, -5.1, -4.05),
    // Piers of the sofa-iwan arches
    ...[-1, 1].flatMap((s) => {
      const b = (a: number, c: number) => (s > 0 ? [a, c] : [-c, -a]) as [number, number]
      return [
        k1(...b(4.05, 5.25), -4.05, -3.35), k1(...b(4.05, 5.25), 2.85, 4.05),
        k1(...b(10.85, 11.75), -5.1, 3.8),
        k1(...b(5.25, 11.75), 2.9, 3.8),
        k1(...b(3.4, 4.05), 4.05, 5.35),
        k1(...b(4.05, 4.95), 3.8, 14.35),
      ]
    }),
    k1(-4.95, 4.95, QIBLA_Z, 14.35),
  ]
  const detail: Box[] = [
    // The platform edge beside the steps is caught by the step limit; only visible obstacles here
    k1(-1.55, 1.55, QIBLA_Z - 0.55, QIBLA_Z),
    k1(-4.05, -1.95, QIBLA_Z - 0.2, QIBLA_Z),
    // Iwan mihrab niches
    k1(-8.2, -6, 2.7, 2.9),
    k1(5.15, 6.65, 2.74, 2.9),
  ]
  // Minbar: as in Ulu Camii, side walls, door frame and kiosk are obstacles, the stair between them
  const MY = MINBAR.en / 2
  const mk = (a: number, b: number, c: number, d: number) => k1(MINBAR.x + a, MINBAR.x + b, MINBAR.z0 + c, MINBAR.z0 + d)
  const minbarBoxes = [mk(-MY - 0.07, -MY + 0.07, 0.7, MINBAR.length), mk(MY - 0.07, MY + 0.07, 0.7, MINBAR.length), mk(-MY - 0.1, -0.65, 0, 0.7), mk(0.65, MY + 0.1, 0, 0.7), mk(-MY, MY, MINBAR.s1, MINBAR.length)]

  // Tombs
  const tombBoxes: Box[] = []
  {
    const { x, z } = HAMZA, A = 3.7, T = 1, mid = A + T / 2, length = T + 0.1
    const L = 2 * (A + T) * Math.tan(Math.PI / 8)
    for (let n = 0; n < 8; n++) {
      const a = (n * Math.PI) / 4, dx = Math.sin(a), dz = Math.cos(a), ux = Math.cos(a), uz = -Math.sin(a)
      for (let t = -L / 2; t <= L / 2 + 0.01; t += L / 8) {
        // Boxes are empty along the door axis: the remaining opening is passable with the player radius.
        if (n === 2 && Math.abs(t) < 1.3) continue
        const px = x + dx * mid + ux * t, pz = z + dz * mid + uz * t
        tombBoxes.push(k1(px - length / 2, px + length / 2, pz - length / 2, pz + length / 2))
      }
    }
    // Iwan sides, sarcophagi
    const ex = x + A + T
    for (const s of [-1, 1]) tombBoxes.push(k1(ex, ex + 1.5, z + s * 1.05 - 0.25, z + s * 1.05 + 0.25))
    tombBoxes.push(k1(x - 1.7, x + 0.5, z - 1.2, z + 1.2), k1(x - 2.4, x + 1.9, z + 1.87, z + 3.37), k1(x - 2.4, x + 1.9, z - 3.37, z - 1.87))
  }
  {
    const { x, z } = FAMILY, A = 1.9, T = 0.8
    tombBoxes.push(
      k1(x - A - T, x - 0.7, z - A - T, z - A), k1(x + 0.7, x + A + T, z - A - T, z - A),
      k1(x - A - T, x + A + T, z + A, z + A + T), k1(x - A - T, x - A, z - A, z + A), k1(x + A, x + A + T, z - A, z + A),
      k1(x - 1.3, x + 1.3, z + 0.05, z + 1.75),
    )
  }
  {
    const { x, z } = MUSTAFA, H = 4.1
    tombBoxes.push(k1(x - H, x + H + 1.7, z - H, z + H), k1(x - 1.7, x + 1.7, z + H, z + H + 2))
  }
  const kioskBox = k1(-3.5, 2.7, -27.8, -22.2)
  const minaretBox = k1(MINARET.x - 1.8, MINARET.x + 1.8, MINARET.z - 1.8, MINARET.z + 1.8)

  const LIMIT_X = 27, LIMIT_Z = 30, CORNER_X = 20, CORNER_Z = 24
  const pedestalCorners: Box[] = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    pedestalCorners.push({ x0: sx > 0 ? CORNER_X : -LIMIT_X - 1, x1: sx > 0 ? LIMIT_X + 1 : -CORNER_X, z0: sz > 0 ? CORNER_Z : -LIMIT_Z - 1, z1: sz > 0 ? LIMIT_Z + 1 : -CORNER_Z })
  }

  const z1 = (x0: number, x1: number, z0: number, z2: number, h0: number, h1: number): FloorArea => ({ x0: x0 + OX, x1: x1 + OX, z0: z0 + OZ, z1: z2 + OZ, h0, h1 })
  const floors: FloorArea[] = [
    // Exterior stairs and portico
    z1(-2.1, 2.1, MID_D - 1.4, MID_D, 0, F),
    z1(-2.1, 2.1, MID_D, PORTICO_D, F, F),
    z1(-11.3, 11.3, PORTICO_D, -4.05, F, F),
    // Sofa, iwans
    z1(-11, 11, -4.05, 2.9, F, F),
    z1(-4.05, 4.05, 2.9, 4.1, F, F),
    // Two steps up to the area in front of the mihrab and the raised sofa
    z1(-1.2, 1.2, 3.1, 4.1, F, PLATFORM),
    z1(-4.05, 4.05, 4.1, QIBLA_Z, PLATFORM, PLATFORM),
    // Minbar stairs
    z1(MINBAR.x - MY, MINBAR.x + MY, MINBAR.z0 + MINBAR.s0, MINBAR.z0 + MINBAR.s1, PLATFORM, PLATFORM + MINBAR.h1),
  ]

  // ---------------------------------------------------------------- LAYERS
  const root = k.group()
  const roof = kRoof.group(), drum = kDrum.group(), dome = kDome.group()
  root.add(roof, drum, dome)
  root.position.set(OX, 0, OZ)

  const d = (id: string, ad: string, x: number, h: number, z: number, bx: number, by: number, bz: number): InteriorStop =>
    ({ id, ad, position: [x + OX, BAY + h, z + OZ], look: [bx + OX, by, bz + OZ] })
  const minbarS = 3.6
  const minbarH = PLATFORM + (MINBAR.h1 * (minbarS - MINBAR.s0)) / (MINBAR.s1 - MINBAR.s0)
  const stops: InteriorStop[] = [
    d('portico', 'Son cemaat yeri', 7.5, F, -7.6, -4, 4.2, -5.3),
    d('door', 'Cümle kapısı', 0, F, -10, 0, 3.3, -5.1),
    d('sofa', 'Orta sofa', 0, F, -3, 0, 4.6, 13.4),
    d('mihrab', 'Mihrap', 0, PLATFORM, 7.5, 0, 4.2, QIBLA_Z),
    d('minbar', 'Minbere çık', MINBAR.x, minbarH, MINBAR.z0 + minbarS, 4, 3, 4),
    d('west-iwan', 'Batı eyvanı', -8.3, F, -2.4, -7.1, 3, 2.9),
    d('east-iwan', 'Doğu eyvanı', 7.5, F, -2.8, 7, 3.2, 2.9),
    d('dome', 'Orta kubbe', 1.5, F, -0.8, 0, 16, 0),
    d('courtyard', 'Avlu', 0, 0, -20.8, 0, 5, -8),
    d('hamza-tomb', 'Hamza Bey Türbesi', HAMZA.x + 2.7, 0, HAMZA.z, HAMZA.x - 3, 1.6, HAMZA.z),
    d('family-tomb', 'Aile Türbesi', FAMILY.x, 0, FAMILY.z - 1.3, FAMILY.x, 1, FAMILY.z + 1.9),
  ]

  return {
    root,
    layers: [
      { group: roof, height: 16, ad: 'Çatılar' },
      { group: drum, height: 26, ad: 'Kasnaklar' },
      { group: dome, height: 36, ad: 'Kubbeler' },
    ],
    stops,
    walking: {
      limit: { x0: -LIMIT_X, x1: LIMIT_X, z0: -LIMIT_Z, z1: LIMIT_Z, circle: { x: 0, z: 0, r: PEDESTAL_R * Math.cos(Math.PI / 72) } },
      boxes: [...mainWalls, ...detail, ...minbarBoxes, ...tombBoxes, kioskBox, minaretBox, ...pedestalCorners],
      circles: trees.map((a) => ({ x: a.x + OX, z: a.z + OZ, r: a.r })),
      floors,
      viewBlockers: [...mainWalls, ...tombBoxes, kioskBox, minaretBox],
      eyeY: BAY,
      baseY: 0,
    },
    camera: { position: [22, 31, -72], target: [2, 6, 2] },
    pedestalRadius: PEDESTAL_R + 1,
    innerLights: [[OX, 8.2, OZ], [OX, 8.6, MIHRAB_Z + OZ], [OX - IWAN_X, 6.2, OZ], [OX + IWAN_X, 6.2, OZ]],
  }
}
