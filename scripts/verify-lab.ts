import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { runLabStrategy, type LabStrategy } from './lab-witnesses.js';
import { saveRun, resumeRun } from '../src/engine.js';
import type { ReplayIdentity } from '../src/types.js';
import { canonical } from '../src/numeric.js';
const strategies: LabStrategy[] = ['product', 'frontier', 'integrator', 'cooperation'];
const rows = [];
let identity: ReplayIdentity | undefined;
for (const seed of ['discovery:5', 'lab-comparison:1', 'lab-comparison:2']) for (const strategy of strategies) {
  const state = runLabStrategy(seed, strategy); identity ??= state.identity;
  assert.equal(canonical(resumeRun(saveRun(state))), canonical(state));
  for (const actor of Object.values(state.actors)) assert.ok(actor.cash >= 0 && actor.compute >= 0);
  const actor = state.actors[state.playerId];
  rows.push({ seed, strategy, quarters: state.quarter + 1, ending: state.report!.kind, cash: actor.cash, revenue: actor.revenue, capability: actor.capability, safety: actor.safety, evaluations: actor.lab!.evaluations.filter(e => e.suite !== 'production').length, models: actor.lab!.models.length, deployments: actor.lab!.deployments, milestones: state.milestones, incidents: state.hidden.incidents, decisions: state.log.filter(c => c.payload.type === 'take_action').map(c => c.payload.type === 'take_action' ? c.payload.action.type : '') });
}
assert.ok(new Set(rows.map(r => JSON.stringify(r.decisions))).size > 1);
await writeFile('artifacts/lab-validation.json', JSON.stringify({ identity, scope: 'Twelve diagnostic runs: three matched seeds, four declared public-information policies. No human enjoyment, calibrated economics or robust strategy dominance is established. Endings and terminal metrics may occur at different horizons.', rows }, null, 2) + '\n');
console.log(JSON.stringify(rows.map(({ deployments, decisions, ...row }) => row), null, 2));
