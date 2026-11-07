import * as T from 'three'
export function particlePool(scene: T.Scene, az: boolean) {
  const n = az ? 90 : 700, positions = new Float32Array(n * 3), colors = positions.slice(), velocities = positions.slice(), life = new Float32Array(n), max = life.slice(), tip = new Uint8Array(n)
  positions.fill(-100)
  // VR: fewer live particles and a lower spawn rate; desktop values are unchanged.
  let limitN = n, ratio = 1
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(positions, 3)); geo.setAttribute('color', new T.BufferAttribute(colors, 3))
  const point = document.createElement('canvas'); point.width = point.height = 32
  const nc = point.getContext('2d')!, ng = nc.createRadialGradient(16, 16, 0, 16, 16, 16); ng.addColorStop(0, '#fff'); ng.addColorStop(.3, 'rgba(255,255,255,.65)'); ng.addColorStop(1, 'rgba(255,255,255,0)'); nc.fillStyle = ng; nc.fillRect(0, 0, 32, 32)
  const pointTex = new T.CanvasTexture(point)
  const mat = new T.PointsMaterial({ size: .022, map: pointTex, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })
  const points = new T.Points(geo, mat); points.frustumCulled = false; scene.add(points)
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!, gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(235,239,237,.42)'); gradient.addColorStop(.35, 'rgba(200,216,218,.18)'); gradient.addColorStop(1, 'rgba(200,216,218,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64)
  const texture = new T.CanvasTexture(canvas)
  const steam = Array.from({ length: az ? 8 : 35 }, () => {
    const m = new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 })
    const o = new T.Sprite(m); o.visible = false; scene.add(o); return { o, life: 0, max: 1, vx: 0 }
  })
  function emet(p: T.Vector3, count = 35, steamFx = false) {
    if (steamFx) {
      for (let k = 0; k < Math.min(Math.ceil(count * ratio), steam.length); k++) {
        const a = steam.find(v => v.life <= 0); if (!a) break
        a.o.position.copy(p).add(new T.Vector3((Math.random() - .5) * .7, .05, (Math.random() - .5) * .25)); a.life = a.max = 1 + Math.random(); a.vx = (Math.random() - .5) * .2; a.o.visible = true; a.o.scale.setScalar(.15)
      }
      return
    }
    for (let k = 0; k < (az ? count * .2 : count) * ratio; k++) {
      const i = life.findIndex(v => v <= 0); if (i < 0 || i >= limitN) break
      life[i] = max[i] = .3 + Math.random() * .8; tip[i] = 0
      positions.set(p.toArray(), i * 3); velocities.set([(Math.random() - .5) * 2.5, .6 + Math.random() * 2.8, (Math.random() - .5) * 2], i * 3)
    }
  }
  // Directional burst: grindstone spin direction, sideways fan of a hammer blow, water splash.
  function spray(p: T.Vector3, dir: T.Vector3, count: number, spread: number, speed: number, kind: 0 | 1 = 0) {
    for (let k = 0; k < (az ? Math.ceil(count * .25) : Math.ceil(count * ratio)); k++) {
      const i = life.findIndex(v => v <= 0); if (i < 0 || i >= limitN) break
      life[i] = max[i] = kind ? .25 + Math.random() * .3 : .18 + Math.random() * .55; tip[i] = kind
      const h = speed * (.45 + Math.random() * .8)
      positions.set(p.toArray(), i * 3)
      velocities.set([(dir.x + (Math.random() - .5) * spread) * h, (dir.y + (Math.random() - .5) * spread) * h, (dir.z + (Math.random() - .5) * spread) * h], i * 3)
    }
  }
  function update(dt: number) {
    for (let i = 0; i < n; i++) {
      if (life[i] <= 0) { positions[i * 3 + 1] = -100; continue }
      life[i] -= dt; velocities[i * 3 + 1] -= dt * 5
      for (let c = 0; c < 3; c++) positions[i * 3 + c] += velocities[i * 3 + c] * dt
      const t = Math.max(0, life[i] / max[i]); if (tip[i]) colors.set([.5 * t, .7 * t, .8 * t], i * 3); else colors.set([t * 3.4, t * t * 1.7, t ** 4 * .4], i * 3)
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true
    for (const a of steam) if (a.life > 0) { a.life -= dt; a.o.position.y += dt * .55; a.o.position.x += a.vx * dt; a.o.scale.addScalar(dt * .65); a.o.material.opacity = Math.max(0, Math.sin(a.life / a.max * Math.PI)) * .7; a.o.visible = a.life > 0 }
  }
  function decrease(v: boolean) { ratio = v ? .3 : 1; limitN = v ? Math.floor(n * .3) : n; geo.setDrawRange(0, limitN) }
  return { emet, spray, update, decrease, dispose: () => { geo.dispose(); mat.dispose(); texture.dispose(); pointTex.dispose(); scene.remove(points); steam.forEach(a => { a.o.material.dispose(); scene.remove(a.o) }) } }
}
