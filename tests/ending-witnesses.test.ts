import test from 'node:test';
import assert from 'node:assert/strict';
import { runStrategy } from '../scripts/campaign-witnesses.js';
import { saveRun, resumeRun } from '../src/engine.js';
import { canonical } from '../src/numeric.js';
import { endingWitnesses } from '../scripts/ending-witnesses.js';
test('eight retained full-campaign command transcripts reach distinct endings and replay exactly',()=>{
 for(const witness of endingWitnesses) {
  const state=runStrategy(witness.seed,witness.strategy);
  assert.equal(state.report?.kind,witness.ending,`${witness.seed}/${witness.strategy}`);
  assert.equal(canonical(resumeRun(saveRun(state))),canonical(state));
 }
});
