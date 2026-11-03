import * as T from 'three'
export function parcacikHavuzu(scene: T.Scene, az: boolean) {
  const n = az ? 65 : 420, positions = new Float32Array(n * 3), colors = positions.slice(), velocities = positions.slice(), life = new Float32Array(n), max = life.slice()
  positions.fill(-100)
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(positions, 3)); geo.setAttribute('color', new T.BufferAttribute(colors, 3))
  const mat = new T.PointsMaterial({ size: .026, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })
  const points = new T.Points(geo, mat); points.frustumCulled = false; scene.add(points)
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!, gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(235,239,237,.42)'); gradient.addColorStop(.35, 'rgba(200,216,218,.18)'); gradient.addColorStop(1, 'rgba(200,216,218,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64)
  const texture = new T.CanvasTexture(canvas)
  const steam = Array.from({ length: az ? 8 : 35 }, () => {
    const m = new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 })
    const o = new T.Sprite(m); o.visible = false; scene.add(o); return { o, life: 0, max: 1, vx: 0 }
  })
  function emet(p: T.Vector3, count = 35, buhar = false) {
    if (buhar) {
      for (let k = 0; k < Math.min(count, steam.length); k++) {
        const a = steam.find(v => v.life <= 0); if (!a) break
        a.o.position.copy(p).add(new T.Vector3((Math.random() - .5) * .7, .05, (Math.random() - .5) * .25)); a.life = a.max = 1 + Math.random(); a.vx = (Math.random() - .5) * .2; a.o.visible = true; a.o.scale.setScalar(.15)
      }
      return
    }
    for (let k = 0; k < (az ? count * .2 : count); k++) {
      const i = life.findIndex(v => v <= 0); if (i < 0) break
      life[i] = max[i] = .3 + Math.random() * .8
      positions.set(p.toArray(), i * 3); velocities.set([(Math.random() - .5) * 2.5, .6 + Math.random() * 2.8, (Math.random() - .5) * 2], i * 3)
    }
  }
  function update(dt: number) {
    for (let i = 0; i < n; i++) {
      if (life[i] <= 0) { positions[i * 3 + 1] = -100; continue }
      life[i] -= dt; velocities[i * 3 + 1] -= dt * 5
      for (let c = 0; c < 3; c++) positions[i * 3 + c] += velocities[i * 3 + c] * dt
      const t = Math.max(0, life[i] / max[i]); colors.set([t * 3, t * t * 1.5, t ** 4 * .3], i * 3)
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true
    for (const a of steam) if (a.life > 0) { a.life -= dt; a.o.position.y += dt * .55; a.o.position.x += a.vx * dt; a.o.scale.addScalar(dt * .65); a.o.material.opacity = Math.max(0, Math.sin(a.life / a.max * Math.PI)) * .7; a.o.visible = a.life > 0 }
  }
  return { emet, update, dispose: () => { geo.dispose(); mat.dispose(); texture.dispose(); scene.remove(points); steam.forEach(a => { a.o.material.dispose(); scene.remove(a.o) }) } }
}
