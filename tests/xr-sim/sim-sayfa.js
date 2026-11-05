// Sayfaya IWER'den sonra enjekte edilir: Quest 3 taklidi + yardımcılar. Sahneye yalnız window.__t (scratch kancası) ile bakar.
(() => {
  const d = new IWER.XRDevice(IWER.metaQuest3, { stereoEnabled: true })
  d.installRuntime({ forceInstall: true })
  const sim = window.__sim = { d, hatalar: [], olaylar: [] }
  const t = () => window.__t
  sim.kareBekle = (n = 1, sure = 900000) => new Promise((coz, red) => {
    const bas = t().kare, bit = performance.now() + sure
    const id = setInterval(() => {
      if (t().kare >= bas + n) { clearInterval(id); coz(t().kare) }
      else if (performance.now() > bit) { clearInterval(id); red(new Error('kare bekleme zaman aşımı')) }
    }, 30)
  })
  sim.rig = () => {
    const p = t().camera.parent
    if (p) sim._rig = p
    return sim._rig
  }
  sim.menu = () => sim.rig().children.find((c) => c.renderOrder === 1000)
  sim.kart = () => sim.rig().children.find((c) => c.renderOrder === 1001)
  sim.disk = () => sim.rig().children.find((c) => c.geometry?.type === 'CircleGeometry')
  const yuv = (v, n = 4) => Number(v.toFixed(n))
  sim.durum = () => {
    const T = t(), { THREE, camera, renderer, scene, controls, katmanlar } = T
    const rig = camera.parent ? sim.rig() : null
    const bd = camera.getWorldPosition(new THREE.Vector3()), f = camera.getWorldDirection(new THREE.Vector3())
    const s = {
      kare: T.kare, oturum: !!d.activeSession, sunuyor: renderer.xr.isPresenting, iceride: T.iceride, parcali: T.parcali, aktifBilgi: T.aktifBilgi, kalite: T.kalite,
      bas: [bd.x, bd.y, bd.z].map((v) => yuv(v)), ileri: [f.x, f.y, f.z].map((v) => yuv(v)), basYerel: camera.position.toArray().map((v) => yuv(v)),
      near: camera.near, far: camera.far, fov: yuv(camera.fov), aspect: yuv(camera.aspect), kameraOlcek: camera.scale.toArray().map((v) => yuv(v)), kameraEbeveyn: camera.parent ? camera.parent.type : null,
      arka: scene.background?.isColor ? '#' + scene.background.getHexString() : scene.background === T.artAlan ? 'artAlan' : String(scene.background),
      cevre: scene.environmentIntensity, hemi: T.hemi.intensity, icIsik: T.icIsiklar[0].intensity,
      katmanY: katmanlar.map((k) => yuv(k.grup.position.y, 2)), canvas: [renderer.domElement.width, renderer.domElement.height],
      canvasEbeveyn: renderer.domElement.parentElement?.className || renderer.domElement.parentElement?.tagName, pikselOran: renderer.getPixelRatio(), hedef: controls.target.toArray().map((v) => yuv(v)), sahneCocuk: scene.children.length, otomatik: controls.autoRotate,
    }
    if (rig) {
      const ic = rig.worldToLocal(new THREE.Vector3(0, 0, 0))
      Object.assign(s, {
        rigP: rig.position.toArray().map((v) => yuv(v)), rigRotY: yuv(rig.rotation.y), rigOlcek: yuv(rig.scale.x),
        maketYerel: [ic.x, ic.y, ic.z].map((v) => yuv(v)), menuAcik: sim.menu().visible, kartAcik: sim.kart().visible, disk: sim.disk().visible,
        menuYerel: sim.menu().position.toArray().map((v) => yuv(v)), kartYerel: sim.kart().position.toArray().map((v) => yuv(v)),
        carpiyor: T.carpiyor(bd.x, bd.z), girdiler: d.activeSession ? [...d.activeSession.inputSources].map((k) => `${k.handedness}:${k.gamepad?.axes?.length}a/${k.gamepad?.buttons?.length}b`) : [],
      })
    }
    return s
  }
  sim.xrBilgi = () => {
    const T = t(), x = T.renderer.xr, l = x.getBaseLayer()
    return { katman: l?.constructor?.name, fbNull: l?.framebuffer === null, ozellikler: d.activeSession?.enabledFeatures, uzay: x.getReferenceSpace()?.constructor?.name, gl: T.renderer.getContext().getParameter(T.renderer.getContext().VERSION), ua: navigator.userAgent }
  }
  sim.dokuPng = (hangi) => (hangi === 'menu' ? sim.menu() : sim.kart()).material.map.image.toDataURL('image/png')
  sim.yakala = () => new Promise((coz) => {
    t().yakala = ({ w, h, p }) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const x = c.getContext('2d'), v = x.createImageData(w, h), s = w * 4
      for (let y = 0; y < h; y++) v.data.set(p.subarray((h - 1 - y) * s, (h - y) * s), y * s)
      x.putImageData(v, 0, 0)
      // İki gözün ayrı ayrı özeti: çizim gerçekten var mı, gözler farklı mı?
      const oz = (x0, x1) => { let top = 0, say = 0, kes = 0; for (let y = 0; y < h; y += 3) for (let i = x0; i < x1; i += 3) { const k = (y * w + i) * 4; const a = v.data[k], b = v.data[k + 1], g = v.data[k + 2]; top += a + b + g; say++; if (Math.abs(a - 26) + Math.abs(b - 43) + Math.abs(g - 37) > 40) kes++ } return { ort: Math.round(top / say / 3), arkaDisi: Number((kes / say).toFixed(3)) } }
      let fark = 0, say = 0
      for (let y = 0; y < h; y += 3) for (let i = 0; i < w / 2 - 1; i += 3) { const a = (y * w + i) * 4, b = (y * w + i + Math.floor(w / 2)) * 4; fark += Math.abs(v.data[a] - v.data[b]); say++ }
      coz({ w, h, sol: oz(0, w >> 1), sag: oz(w >> 1, w), gozFarki: Number((fark / say).toFixed(2)), png: c.toDataURL('image/png') })
    }
  })
  // Kumandayı rig-yerel bir hedefe çevirir (rig yereli = local-floor uzayı).
  sim.basliklar = () => t().scene.children.flatMap((c) => c.children).filter((n) => n.userData.bilgi)
  sim.baslik = (id) => sim.basliklar().find((n) => n.userData.bilgi === id)
  // Görünen başlıklar: başın baktığı yöne en yakın olan önde.
  sim.gorunenBasliklar = () => {
    const { THREE, camera } = t(), bas = camera.getWorldPosition(new THREE.Vector3()), f = camera.getWorldDirection(new THREE.Vector3())
    return sim.basliklar().filter((n) => n.visible && n.parent.visible)
      .map((n) => ({ id: n.userData.bilgi, yon: n.getWorldPosition(new THREE.Vector3()).sub(bas).normalize().dot(f) }))
      .sort((a, b) => b.yon - a.yon).map((b) => b.id)
  }
  sim.nisanla = (hedef, el = 'right') => {
    const { THREE } = t(), k = d.controllers[el]
    const C = new THREE.Vector3(el === 'right' ? 0.15 : -0.15, 1.25, -0.1)
    // Baş döndüyse kumanda da başla gelsin: ışın panele öteki yandan girmesin.
    const y = new THREE.Vector3(...hedef).sub(C).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), y)
    k.position.set(C.x, C.y, C.z); k.quaternion.set(q.x, q.y, q.z, q.w)
  }
  sim.panelNoktasi = (panel, u, v) => {
    const { THREE } = t(), rig = sim.rig(), g = panel.geometry.parameters
    rig.updateWorldMatrix(true, true)
    const w = panel.localToWorld(new THREE.Vector3((u - 0.5) * g.width, (v - 0.5) * g.height, 0))
    const r = rig.worldToLocal(w)
    return [r.x, r.y, r.z]
  }
  sim.menuOgeNoktasi = (i, n) => sim.panelNoktasi(sim.menu(), 0.5, 0.8 * (1 - (i + 0.5) / n))
  // Kod yoluyla aynı ışını yeniden hesaplar: tanılama, tıklamayı etkilemez.
  sim.isinTani = (ei) => {
    const { THREE, renderer } = t(), kum = renderer.xr.getController(ei), r = new THREE.Raycaster()
    kum.updateWorldMatrix(true, false, true)
    r.setFromXRController(kum)
    const ad = [sim.menu(), sim.kart()].filter((n) => n.visible)
    const h = r.intersectObjects(ad, false)[0]
    return h ? { nesne: h.object === sim.menu() ? 'menu' : 'kart', v: Number(h.uv.y.toFixed(3)), u: Number(h.uv.x.toFixed(3)) } : null
  }
  sim.bas = (el, dugme, deger) => d.controllers[el].updateButtonValue(dugme, deger)
  sim.cubuk = (el, x, y) => d.controllers[el].updateAxes('thumbstick', x, y)
  sim.basYaw = (rad) => { d.quaternion.set(0, Math.sin(rad / 2), 0, Math.cos(rad / 2)) }
  sim.dagBaglanti = (el, acik) => { d.controllers[el].connected = acik }
  sim.bitir = () => d.activeSession.end()
})()
