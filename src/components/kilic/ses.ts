export type SesAdi = 'cekic' | 'su' | 'bileme' | 'kesim' | 'ting'
export function sesOlustur() {
  let ctx: AudioContext | undefined, master: GainNode | undefined, hum: GainNode | undefined, source: AudioBufferSourceNode | undefined, acik = true
  function baslat() {
    if (!ctx) {
      ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = acik ? .22 : 0; master.connect(ctx.destination)
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), a = buffer.getChannelData(0)
      for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1
      source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 190
      hum = ctx.createGain(); hum.gain.value = .13; source.connect(filter).connect(hum).connect(master); source.start()
    }
    if (ctx.state === 'suspended') void ctx.resume()
  }
  function cal(ad: SesAdi) {
    if (!acik) return
    baslat(); const c = ctx!, gain = c.createGain(), t = c.currentTime, dur = ad === 'su' ? 1.3 : ad === 'bileme' ? .2 : .35
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(ad === 'cekic' ? .7 : .3, t + .008); gain.gain.exponentialRampToValueAtTime(.0001, t + dur); gain.connect(master!)
    if (['su', 'bileme', 'kesim'].includes(ad)) {
      const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), a = buffer.getChannelData(0)
      for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1
      const n = c.createBufferSource(), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(ad === 'kesim' ? 400 : 2400, t); f.frequency.exponentialRampToValueAtTime(500, t + dur); n.buffer = buffer; n.connect(f).connect(gain); n.start(); n.onended = () => { n.disconnect(); f.disconnect(); gain.disconnect() }
    } else {
      for (const frequency of [ad === 'cekic' ? 230 : 1300, ad === 'cekic' ? 1340 : 2700]) {
        const o = c.createOscillator(); o.type = frequency < 300 ? 'square' : 'sine'; o.frequency.setValueAtTime(frequency, t); o.frequency.exponentialRampToValueAtTime(frequency * .7, t + dur); o.connect(gain); o.start(); o.stop(t + dur); o.onended = () => { o.disconnect(); gain.disconnect() }
      }
    }
  }
  return { baslat, cal, ac: (v: boolean) => { acik = v; if (master && ctx) master.gain.setTargetAtTime(v ? .22 : 0, ctx.currentTime, .03) }, koruk: (v: boolean) => { if (hum && ctx) hum.gain.setTargetAtTime(v ? .45 : .13, ctx.currentTime, .1) }, bekle: (v: boolean) => { if (ctx) { if (v) void ctx.suspend(); else if (acik) void ctx.resume() } }, dispose: () => { source?.stop(); source?.disconnect(); if (ctx) void ctx.close() } }
}
