// Spoken guide in VR: when the head comes near a labelled spot that has a recording, it plays; it stops when walking away.
// Played through Web Audio: a plain <audio> started from the frame loop is blocked as autoplay in VR browsers, because no
// user gesture is active there. The context is unlocked once, inside the click that starts VR, and the recordings are
// decoded then, so later playback needs no gesture.
export const NARRATION: Record<string, string> = {
  door: '/sesler/kapi.mp3',
  fountain: '/sesler/sadirvan.mp3',
  minbar: '/sesler/minber.mp3',
  mihrab: '/sesler/mihrap.mp3',
  domes: '/sesler/kubbeler.mp3',
  calligraphy: '/sesler/hat.mp3',
  'kaaba-cover': '/sesler/kabe-ortusu.mp3',
}
export const NARRATION_RADIUS = 3.6 // metres on the floor plane, for spots that define no radius of their own
const RADIUS_SHARE = 0.75 // share of a spot's own radius within which its recording plays
const VOLUME = 0.95

/** Id of the nearest spot with a recording within reach of the head, or null. */
export function nearestNarrated(head: { x: number; z: number }, spots: { id: string; position: number[]; radius?: number }[]): string | null {
  let nearest: string | null = null, best = Infinity
  for (const { id, position, radius } of spots) {
    const d = Math.hypot(head.x - position[0], head.z - position[2])
    const limit = radius ? radius * RADIUS_SHARE : NARRATION_RADIUS
    if (NARRATION[id] && d <= limit && d < best) { best = d; nearest = id }
  }
  return nearest
}

export function createNarration() {
  let context: AudioContext | null = null
  let gain: GainNode | null = null
  const buffers = new Map<string, AudioBuffer>()
  let source: AudioBufferSourceNode | null = null
  let wanted: string | null = null

  const stopSource = () => {
    if (!source) return
    source.onended = null
    try { source.stop() } catch { /* already stopped */ }
    source.disconnect()
    source = null
  }
  const play = (id: string) => {
    const buffer = buffers.get(id)
    if (!context || !gain || !buffer || wanted !== id || source) return
    const next = context.createBufferSource()
    next.buffer = buffer
    next.connect(gain)
    next.onended = () => { if (source === next) source = null }
    source = next
    next.start()
  }
  const load = async (id: string) => {
    if (!context || buffers.has(id)) return
    try {
      const response = await fetch(NARRATION[id])
      buffers.set(id, await context.decodeAudioData(await response.arrayBuffer()))
      play(id) // the visitor may already be standing at the spot while it was still decoding
    } catch (error) {
      console.warn(`Narration ${id} could not be loaded`, error)
    }
  }

  return {
    /** Call synchronously from the click that starts VR (a user gesture): unlocks audio and starts decoding. */
    unlock() {
      if (context) { void context.resume(); return }
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      context = new Ctor()
      gain = context.createGain()
      gain.gain.value = VOLUME
      gain.connect(context.destination)
      void context.resume()
      Object.keys(NARRATION).forEach((id) => { void load(id) })
    },
    stop() {
      wanted = null
      stopSource()
    },
    /** Call every frame with the head position and the labelled spots. */
    update(head: { x: number; z: number }, spots: { id: string; position: number[]; radius?: number }[]) {
      const nearest = nearestNarrated(head, spots)
      if (nearest === wanted) return
      wanted = nearest
      stopSource()
      if (nearest) play(nearest)
    },
    dispose() {
      this.stop()
      void context?.close()
      context = null
      gain = null
      buffers.clear()
    },
  }
}
