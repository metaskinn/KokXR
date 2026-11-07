// Sayfaya IWER'den sonra enjekte edilir: Quest 3 taklidi + yardımcılar. Sahneye yalnız window.__t (scratch kancası) ile bakar.
(() => {
  const d = new IWER.XRDevice(IWER.metaQuest3, { stereoEnabled: true })
  d.installRuntime({ forceInstall: true })
  const sim = window.__sim = { d, errors: [], events: [] }
  const t = () => window.__t
  sim.waitFrame = (n = 1, sure = 900000) => new Promise((solve, red) => {
    const head = t().frame, bit = performance.now() + sure
    const id = setInterval(() => {
      if (t().frame >= head + n) { clearInterval(id); solve(t().frame) }
      else if (performance.now() > bit) { clearInterval(id); red(new Error('kare bekleme zaman aşımı')) }
    }, 30)
  })
  sim.rig = () => {
    const p = t().camera.parent
    if (p) sim._rig = p
    return sim._rig
  }
  sim.menu = () => sim.rig().children.find((c) => c.renderOrder === 1000)
  sim.card = () => sim.rig().children.find((c) => c.renderOrder === 1001)
  sim.disk = () => sim.rig().children.find((c) => c.geometry?.type === 'CircleGeometry')
  const yuv = (v, n = 4) => Number(v.toFixed(n))
  sim.state = () => {
    const T = t(), { THREE, camera, renderer, scene, controls, layers } = T
    const rig = camera.parent ? sim.rig() : null
    const bd = camera.getWorldPosition(new THREE.Vector3()), f = camera.getWorldDirection(new THREE.Vector3())
    const s = {
      frame: T.frame, session: !!d.activeSession, presenting: renderer.xr.isPresenting, inside: T.inside, fragmented: T.fragmented, activeInfo: T.activeInfo, quality: T.quality,
      head: [bd.x, bd.y, bd.z].map((v) => yuv(v)), forward: [f.x, f.y, f.z].map((v) => yuv(v)), headLocal: camera.position.toArray().map((v) => yuv(v)),
      near: camera.near, far: camera.far, fov: yuv(camera.fov), aspect: yuv(camera.aspect), cameraScale: camera.scale.toArray().map((v) => yuv(v)), cameraParent: camera.parent ? camera.parent.type : null,
      back: scene.background?.isColor ? '#' + scene.background.getHexString() : scene.background === T.backdrop ? 'backdrop' : String(scene.background),
      surroundings: scene.environmentIntensity, hemi: T.hemi.intensity, innerLight: T.innerLights[0].intensity,
      layerY: layers.map((k) => yuv(k.group.position.y, 2)), canvas: [renderer.domElement.width, renderer.domElement.height],
      canvasParent: renderer.domElement.parentElement?.className || renderer.domElement.parentElement?.tagName, pixelRatio: renderer.getPixelRatio(), target: controls.target.toArray().map((v) => yuv(v)), sceneChild: scene.children.length, auto: controls.autoRotate,
    }
    if (rig) {
      const inner = rig.worldToLocal(new THREE.Vector3(0, 0, 0))
      Object.assign(s, {
        rigP: rig.position.toArray().map((v) => yuv(v)), rigRotY: yuv(rig.rotation.y), rigScale: yuv(rig.scale.x),
        modelLocal: [inner.x, inner.y, inner.z].map((v) => yuv(v)), menuOpen: sim.menu().visible, cardOpen: sim.card().visible, disk: sim.disk().visible,
        menuLocal: sim.menu().position.toArray().map((v) => yuv(v)), cardLocal: sim.card().position.toArray().map((v) => yuv(v)),
        collides: T.collides(bd.x, bd.z), inputs: d.activeSession ? [...d.activeSession.inputSources].map((k) => `${k.handedness}:${k.gamepad?.axes?.length}a/${k.gamepad?.buttons?.length}b`) : [],
      })
    }
    return s
  }
  sim.xrInfo = () => {
    const T = t(), x = T.renderer.xr, l = x.getBaseLayer()
    return { layer: l?.constructor?.name, fbNull: l?.framebuffer === null, features: d.activeSession?.enabledFeatures, space: x.getReferenceSpace()?.constructor?.name, gl: T.renderer.getContext().getParameter(T.renderer.getContext().VERSION), ua: navigator.userAgent }
  }
  sim.texPng = (which) => (which === 'menu' ? sim.menu() : sim.card()).material.map.image.toDataURL('image/png')
  sim.capture = () => new Promise((solve) => {
    t().capture = ({ w, h, p }) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const x = c.getContext('2d'), v = x.createImageData(w, h), s = w * 4
      for (let y = 0; y < h; y++) v.data.set(p.subarray((h - 1 - y) * s, (h - y) * s), y * s)
      x.putImageData(v, 0, 0)
      // İki gözün ayrı ayrı özeti: çizim gerçekten var mı, gözler farklı mı?
      const oz = (x0, x1) => { let top = 0, say = 0, cutOff = 0; for (let y = 0; y < h; y += 3) for (let i = x0; i < x1; i += 3) { const k = (y * w + i) * 4; const a = v.data[k], b = v.data[k + 1], g = v.data[k + 2]; top += a + b + g; say++; if (Math.abs(a - 26) + Math.abs(b - 43) + Math.abs(g - 37) > 40) cutOff++ } return { avg: Math.round(top / say / 3), backOuter: Number((cutOff / say).toFixed(3)) } }
      let diff = 0, say = 0
      for (let y = 0; y < h; y += 3) for (let i = 0; i < w / 2 - 1; i += 3) { const a = (y * w + i) * 4, b = (y * w + i + Math.floor(w / 2)) * 4; diff += Math.abs(v.data[a] - v.data[b]); say++ }
      solve({ w, h, left: oz(0, w >> 1), right: oz(w >> 1, w), eyeDiff: Number((diff / say).toFixed(2)), png: c.toDataURL('image/png') })
    }
  })
  // Kumandayı rig-yerel bir hedefe çevirir (rig yereli = local-floor uzayı).
  sim.titles = () => t().scene.children.flatMap((c) => c.children).filter((n) => n.userData.info)
  sim.title = (id) => sim.titles().find((n) => n.userData.info === id)
  // Görünen başlıklar: başın baktığı yöne en yakın olan önde.
  sim.visibleTitles = () => {
    const { THREE, camera } = t(), head = camera.getWorldPosition(new THREE.Vector3()), f = camera.getWorldDirection(new THREE.Vector3())
    return sim.titles().filter((n) => n.visible && n.parent.visible)
      .map((n) => ({ id: n.userData.info, dir: n.getWorldPosition(new THREE.Vector3()).sub(head).normalize().dot(f) }))
      .sort((a, b) => b.dir - a.dir).map((b) => b.id)
  }
  sim.aim = (target, el = 'right') => {
    const { THREE } = t(), k = d.controllers[el]
    const C = new THREE.Vector3(el === 'right' ? 0.15 : -0.15, 1.25, -0.1)
    // Baş döndüyse kumanda da başla gelsin: ışın panele öteki yandan girmesin.
    const y = new THREE.Vector3(...target).sub(C).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
    k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
  }
  sim.panelPoint = (panel, u, v) => {
    const { THREE } = t(), rig = sim.rig(), g = panel.geometry.parameters
    rig.updateWorldMatrix(true, true)
    const w = panel.localToWorld(new THREE.Vector3((u - 0.5) * g.width, (v - 0.5) * g.height, 0))
    const r = rig.worldToLocal(w)
    return [r.x, r.y, r.z]
  }
  sim.menuItemPoint = (i, n) => sim.panelPoint(sim.menu(), 0.5, 0.8 * (1 - (i + 0.5) / n))
  // Kod yoluyla aynı ışını yeniden hesaplar: tanılama, tıklamayı etkilemez.
  sim.rayDiagnose = (ei) => {
    const { THREE, renderer } = t(), sand = renderer.xr.getController(ei), r = new THREE.Raycaster()
    sand.updateWorldMatrix(true, false, true)
    r.setFromXRController(sand)
    const ad = [sim.menu(), sim.card()].filter((n) => n.visible)
    const h = r.intersectObjects(ad, false)[0]
    return h ? { obj: h.object === sim.menu() ? 'menu' : 'card', v: Number(h.uv.y.toFixed(3)), u: Number(h.uv.x.toFixed(3)) } : null
  }
  sim.head = (el, button, value) => d.controllers[el].updateButtonValue(button, value)
  sim.bar = (el, x, y) => d.controllers[el].updateAxes('thumbstick', x, y)
  sim.headYaw = (rad) => { d.quaternion.set(0, Math.sin(rad / 2), 0, Math.cos(rad / 2)) }
  sim.hillLink = (el, open) => { d.controllers[el].connected = open }
  sim.finish = () => d.activeSession.end()
})()
