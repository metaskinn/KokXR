// Spoken guide in VR: when the head comes near a labelled spot that has a recording, it plays; it stops when walking away.
const NARRATION: Record<string, string> = {
  door: '/sesler/kapi.mp3',
  fountain: '/sesler/sadirvan.mp3',
  minbar: '/sesler/minber.mp3',
  mihrab: '/sesler/mihrap.mp3',
  domes: '/sesler/kubbeler.mp3',
  calligraphy: '/sesler/hat.mp3',
  'kaaba-cover': '/sesler/kabe-ortusu.mp3',
}
const NARRATION_RADIUS = 3.6 // metres on the floor plane

export function createNarration() {
  let audio: HTMLAudioElement | null = null
  let playing: string | null = null
  const stop = () => {
    audio?.pause()
    audio = null
    playing = null
  }
  return {
    stop,
    /** Call every frame with the head position and the labelled spots; plays the nearest one with a recording. */
    update(head: { x: number; z: number }, spots: { id: string; position: number[] }[]) {
      let nearest: string | null = null, best = NARRATION_RADIUS
      for (const { id, position } of spots) {
        const d = Math.hypot(head.x - position[0], head.z - position[2])
        if (NARRATION[id] && d <= best) { best = d; nearest = id }
      }
      if (nearest === playing) return
      stop()
      if (!nearest) return
      playing = nearest
      const next = new Audio(NARRATION[nearest])
      next.volume = 0.95
      next.onended = () => { if (audio === next) audio = null }
      audio = next
      next.play().catch(() => { if (audio === next) { audio = null; playing = null } })
    },
  }
}
