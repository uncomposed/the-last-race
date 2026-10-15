import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRun, execute, replay, saveRun, resumeRun } from '../src/engine.js';
import { canonical, hash, sum } from '../src/numeric.js';
import { chooseIntervention } from '../src/policy.js';
import { getScenario } from '../src/scenario.js';
import type { Actor, Command, RunState } from '../src/types.js';

const policies: Array<{ id: string; weights: Actor['weights'] }> = [
  { id: 'capability-priority', weights: { revenue: 0.6, capability: 2.4, safety: 0.3, mission: 0.3 } },
  { id: 'control-priority', weights: { revenue: 0.4, capability: 0.5, safety: 2.5, mission: 1.8 } },
  { id: 'revenue-priority', weights: { revenue: 2.5, capability: 0.5, safety: 0.4, mission: 0.3 } },
];
const seeds = Array.from({ length: 24 }, (_, i) => `paired-synthetic:${i}`);
const metricNames = ['cash', 'capability', 'safety', 'influence', 'revenue', 'incidents', 'undetectedIncidents'] as const;
type Metrics = Record<typeof metricNames[number], number>;
type Row = { seed: string; policy: string; quarters: number; reportKind: string; metrics: Metrics; actionCounts: Record<string, number>; replayChecksum: string };
const rows: Row[] = [];
let identity: RunState['identity'] | undefined;
for (const seed of seeds) {
  for (const policy of policies) {
    let state = createRun(seed, 'full-28'); identity ??= state.identity;
    const scenario = getScenario(state.identity.scenarioId); const counts: Record<string, number> = {};
    const commit = (command: Command): boolean => {
      const result = execute(state, command);
      if (!result.ok) return false;
      state = result.state; return true;
    };
    while (state.phase === 'planning') {
      for (let move = 0; move < 3; move++) {
        // Strategic bots use the common policy scorer and their evidence-based actor belief.
        // Routine company operations keep the scenario's original company objectives.
        const actor = { ...state.actors[state.playerId], weights: policy.weights };
        const action = chooseIntervention(actor, scenario, state.quarter, state.interventions);
        if (!action) break;
        const request: Command = { actorId: state.playerId, expectedRevision: state.revision, idempotencyKey: `bot:${state.revision}`, payload: { type: 'take_action', action } };
        if (!commit(request)) break;
        const kind = action.type === 'train' ? `train:${action.scale}` : action.type;
        counts[kind] = (counts[kind] ?? 0) + 1;
      }
      assert.equal(commit({ actorId: state.playerId, expectedRevision: state.revision, idempotencyKey: `end:${state.revision}`, payload: { type: 'end_turn' } }), true, 'Simulation could not commit its shared resource ledger');
      for (const actor of Object.values(state.actors)) assert.ok(actor.cash >= 0 && actor.compute >= 0, 'Negative resources');
    }
    const saved = saveRun(state); assert.equal(canonical(resumeRun(saved)), canonical(state)); assert.equal(canonical(replay(state)), canonical(state));
    const player = state.actors[state.playerId];
    rows.push({ seed, policy: policy.id, quarters: state.quarter + 1, reportKind: state.report!.kind, metrics: { cash: player.cash, capability: player.capability, safety: player.safety, influence: player.influence, revenue: player.revenue, incidents: state.hidden.incidents, undetectedIncidents: state.hidden.undetectedIncidents }, actionCounts: counts, replayChecksum: hash(state) });
  }
}
function averages(selected: Row[]): Metrics {
  return Object.fromEntries(metricNames.map(name => [name, sum(selected.map(row => row.metrics[name])) / selected.length])) as Metrics;
}
const summaries = policies.map(policy => ({ policy: policy.id, objectives: policy.weights, means: averages(rows.filter(row => row.policy === policy.id)), horizonRuns: rows.filter(row => row.policy === policy.id && row.quarters === 28).length }));
const pairs = policies.flatMap((left, i) => policies.slice(i + 1).map(right => {
  const differences = seeds.map(seed => {
    const a = rows.find(row => row.seed === seed && row.policy === left.id)!; const b = rows.find(row => row.seed === seed && row.policy === right.id)!;
    return Object.fromEntries(metricNames.map(metric => [metric, a.metrics[metric] - b.metrics[metric]])) as Metrics;
  });
  return { difference: `${left.id} minus ${right.id}`, pairedMeans: Object.fromEntries(metricNames.map(metric => [metric, sum(differences.map(row => row[metric])) / differences.length])), pairedRange: Object.fromEntries(metricNames.map(metric => [metric, [Math.min(...differences.map(row => row[metric])), Math.max(...differences.map(row => row[metric]))]])) };
}));
assert.equal(new Set(rows.map(row => canonical(row.actionCounts))).size > 1, true, 'Policies did not produce distinct behavior');
const report = {
  reportVersion: 'paired-policy-v2b', identity, seedCount: seeds.length, policyCount: policies.length,
  metricDefinitions: { cash: 'Player integer millions of synthetic credits at terminal resolution.', capability: 'Player capability units; unfinished terminal projects do not count.', safety: 'Player safety investment units, not a certified safety probability.', influence: 'Player influence units.', revenue: 'Player recurring synthetic credits per quarter.', incidents: 'Total successful containment failures across all actors; societal output includes rival behavior.', undetectedIncidents: 'Total successful containment failures across all actors that were undetected at occurrence.' },
  assumptions: [
    'All quantities, risk curves, priors, actor traits and objectives are the labeled synthetic-v2b fixture; no empirical calibration is claimed.',
    'Each seed is used by every policy, preserving the same keyed hidden world and exogenous draws. Policy-dependent actions necessarily expose different events.',
    'Strategic bot candidates are scored by the same chooseIntervention/scoreOption machinery used by rivals, with the listed alternative objective weights. Routine company operations retain scenario company weights.',
    'Policies choose at most three affordable interventions per quarter. Bots do not impose convictions or force Respond, so this comparison isolates objective weights within the existing candidate set.',
    'Reported containment incidents use the terminal authoritative reveal. These are model outputs, not forecasts or real-world safety estimates.',
    'No equal win rates, preferred winner or aggregate victory scalar is imposed. Viability resources, capability, safety, influence and societal incidents are compared separately.',
  ],
  audit: {
    comparison: 'Three objective profiles over the identical ordered set of 24 seeds; full per-seed records and paired mean/range differences retained.',
    omissionChecks: ['28-quarter or mechanism-based early termination', 'nonnegative cash/compute for all actors', 'distinct realized policy action distributions', 'exact replay and save/resume for all 72 completed runs'],
    falsification: 'A replay mismatch, negative resource, inability to commit, identical policy behavior, or changed policy ranking under plausible fixture revisions requires investigation; this report does not establish robust policy dominance.',
    stoppingRule: 'Technical Stage 2b is not human acceptance. Stop for failed determinism, resource or knowledge boundaries. Separate campaign report covers prior/detection sensitivity and all eight endings; research calibration remains Stage 3.',
    priorFailureMode: 'Single-seed anecdotes and forced win-rate balancing can conceal tradeoffs; paired seeds and separate outcome axes expose them.',
  }, summaries, pairs, runs: rows,
};
await mkdir(resolve('artifacts'), { recursive: true }); await writeFile(resolve('artifacts/paired-policy-simulation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ seedCount: seeds.length, policies: summaries, pairedDifferences: pairs, artifact: 'artifacts/paired-policy-simulation.json' }, null, 2));
