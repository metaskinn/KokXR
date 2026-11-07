// Spoken guide: which recording plays where.
import assert from 'node:assert/strict'
import { nearestNarrated, NARRATION, NARRATION_RADIUS } from '../src/features/scale-models/xrNarration.ts'

const spots = [
  { id: 'mihrab', position: [0, 1, 0] },
  { id: 'minbar', position: [2, 1, 0] },
  { id: 'mahfil', position: [0.5, 1, 0] }, // labelled but has no recording
]
assert.equal(nearestNarrated({ x: 1.8, z: 0 }, spots), 'minbar', 'nearest spot with a recording wins')
assert.equal(nearestNarrated({ x: 0.5, z: 0 }, spots), 'mihrab', 'a spot without a recording is ignored even when closest')
assert.equal(nearestNarrated({ x: NARRATION_RADIUS + 5, z: 0 }, spots), null, 'far from every spot stays silent')
assert.equal(nearestNarrated({ x: 0, z: 0 }, []), null)
// A spot with its own radius plays within 75% of it: the fountain label sits 5.6 m from where one stands at it.
const far = [{ id: 'fountain', position: [0, 5.1, -6.9], radius: 9.5 }]
assert.equal(nearestNarrated({ x: 0, z: -12.5 }, far), 'fountain', 'fountain plays from its viewing spot')
assert.equal(nearestNarrated({ x: 0, z: -20 }, far), null, 'and not from beyond its radius')
assert.equal(Object.keys(NARRATION).length, 7, 'seven recordings')
console.log('Narration: nearest recorded spot, ignores unrecorded spots, silent when far, passed.')
