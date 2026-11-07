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
assert.equal(Object.keys(NARRATION).length, 7, 'seven recordings')
console.log('Narration: nearest recorded spot, ignores unrecorded spots, silent when far, passed.')
