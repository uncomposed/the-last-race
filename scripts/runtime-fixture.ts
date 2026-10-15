import { runStrategy } from './campaign-witnesses.js';
import { endingWitnesses } from './ending-witnesses.js';
import { aggregateBins, effectiveMean, recomputeBelief, updateGrid } from '../src/beliefs.js';
import { createRun, execute, explain, getBeliefs, getFeed, getPlan, getRivals, getRules, getView, getModels, getBrief, previewQuarter, listActions, replay, resumeRun, saveRun } from '../src/engine.js';
import { canonical, hash, integer, interpolate, random, sum } from '../src/numeric.js';
import { rankOptions, type PolicyOption } from '../src/policy.js';
import { getScenario } from '../src/scenario.js';
import type { Command, CommandPayload, RunState } from '../src/types.js';
import { getResearch, researchForAction } from '../src/research.js';

/** Browser-safe deterministic fixture; authoritative data here is verification-only. */
export function runtimeFixture() {
  const records: Array<{ label: string; canonical: string }> = [];
  const record = (label: string, value: unknown) => records.push({ label, canonical: canonical(value) });
  const scenario = getScenario();
  for (const quarter of [0, 1, 2, 27]) record(`research:${quarter}`, {
    index: getResearch(quarter), report: getResearch(quarter, 'agentic-misalignment'),
    preview: researchForAction(quarter, { type: 'ship', model: 'own' }),
  });
  record('numeric-boundaries', {
    ordered: [sum([1e16, 1, -1e16]), sum([1e16, -1e16, 1])], integer: integer(Number.MAX_SAFE_INTEGER),
    knots: [-1, 0, 4, 6, 8, 20].map(x => interpolate([[0, 0], [4, 0.25], [8, 1]], x)),
    keyed: Array.from({ length: 32 }, (_, i) => random('browser-fixture', `draw:${i}`)),
    canonical: canonical({ z: -0, a: 1 }),
    posterior: updateGrid(scenario.grid.prior, scenario.grid.support, 0.8, 0.25, 0.4),
    zeroLikelihood: updateGrid(scenario.grid.prior, Array(20).fill(0), 1, 0, 1),
    bins: aggregateBins(scenario.grid, scenario.grid.prior),
  });
  let tied = createRun('tie-fixture').actors.deepcent;
  const option = (id: string): PolicyOption => ({ id, cashCost: 0, computeCost: 0, revenue: 1, capability: 0, safety: 0, mission: 0, switchingCost: 0 });
  record('equal-policy-score-tie', rankOptions(tied, [option('z'), option('a'), option('m')]).map(x => x.id));
  for (const scenarioId of ['one-quarter', 'core-12']) {
    for (const seed of ['cross-runtime:0', 'cross-runtime:1', 'cross-runtime:boundary']) {
      let state: RunState = createRun(seed, scenarioId); let count = 0;
      record(`${scenarioId}:${seed}:creation`, state);
      const commit = (payload: CommandPayload, extra: Partial<Command> = {}) => {
        const command: Command = { actorId: state.playerId, idempotencyKey: `fixture:${count++}`, expectedRevision: state.revision, payload, ...extra };
        const result = execute(state, command);
        record(`${scenarioId}:${seed}:command:${count}`, { command, ok: result.ok, error: result.error ?? null, data: result.data ?? null, state: result.state });
        state = result.state;
        return { command, result };
      };
      const invalid = commit({ type: 'end_turn' }, { expectedRevision: -1 });
      if (invalid.result.ok) throw new Error('Stale command unexpectedly accepted');
      const first = commit({ type: 'override_belief', topic: 'control', conviction: 0.9 });
      const retry = execute(state, first.command); record(`${scenarioId}:${seed}:idempotent-retry`, retry);
      if (!retry.ok || canonical(retry.state) !== canonical(state)) throw new Error('Idempotent retry changed state');
      while (state.phase === 'planning' && state.quarter <= 12) {
        record(`${scenarioId}:${seed}:visible:${state.quarter}`, { view: getView(state), plan: getPlan(state), beliefs: getBeliefs(state), feed: getFeed(state), rivals: getRivals(state), actions: listActions(state), exactTrainPreview: listActions(state, { type: 'train', scale: 'small', method: 'rl', focuses: ['science', 'agency'] }), explanations: explain(state), rules: getRules(state) });
        const flagged = state.evidence.find(e => e.observerId === state.playerId && e.detected && e.processed && e.flagged && !state.log.some(c => c.payload.type === 'respond_to_evidence' && c.payload.evidenceId === e.id));
        if (flagged && state.movesUsed < 3) commit({ type: 'respond_to_evidence', evidenceId: flagged.id, response: { type: 'secure', amount: 1 } });
        if (state.quarter === 3 && state.movesUsed < 3) commit({ type: 'override_plan_item', itemId: state.plans[state.playerId].items[0].id, choice: 'lease' });
        if (state.movesUsed < 3) commit({ type: 'take_action', action: state.quarter % 2 ? { type: 'investigate', topic: 'control' } : { type: 'train', scale: 'small', method: 'rl', focuses: ['science', 'agency'] } });
        if (state.movesUsed < 3) commit({ type: 'take_action', action: { type: 'ship', model: 'third-party' } });
        if (state.plans[state.playerId].conflicts.length) {
          if (state.movesUsed >= 3) throw new Error('Fixture entered an uncorrectable resource conflict');
          commit({ type: 'override_plan_item', itemId: state.plans[state.playerId].items[0].id, choice: 'veto' });
        }
        const end = commit({ type: 'end_turn' }); if (!end.result.ok) throw new Error(`Fixture could not end quarter ${scenarioId}:${seed}:${state.quarter}: ${end.result.error?.message}`);
      }
      record(`${scenarioId}:${seed}:terminal-rejection`, execute(state, { actorId: state.playerId, idempotencyKey: 'terminal', expectedRevision: state.revision, payload: { type: 'end_turn' } }));
      const resumed = resumeRun(saveRun(state)); const replayed = replay(state);
      if (canonical(state) !== canonical(resumed) || canonical(state) !== canonical(replayed)) throw new Error('Save/resume or replay differs');
      record(`${scenarioId}:${seed}:final-state`, state); record(`${scenarioId}:${seed}:private-trace`, state.traces);
      record(`${scenarioId}:${seed}:effective-posterior`, { posterior: recomputeBelief(scenario.grid, state.actors[state.playerId].belief, state.evidence.filter(e => e.observerId === state.playerId)), mean: effectiveMean(scenario.grid, state.actors[state.playerId].belief, state.quarter) });
    }
  }
  for (const witness of endingWitnesses) {
    const final = runStrategy(witness.seed, witness.strategy);
    if (final.report?.kind !== witness.ending) throw new Error(`Ending witness changed: ${witness.ending}`);
    record(`campaign-ending:${witness.ending}`, final);
    // Retain every quarter transition of an actual 28-quarter run, including private traces.
    if (witness.ending === 'multipolar-balance') {
      let current = createRun(witness.seed, 'full-28');
      for (const command of final.log) {
        const result = execute(current, command); if (!result.ok) throw new Error('Campaign transition rejected'); current = result.state;
        if (command.payload.type === 'end_turn') record(`full-campaign:quarter:${current.quarter}:revision:${current.revision}`, current);
      }
    }
  }
  let purchase = createRun('owner-first', 'full-28');
  const purchaseCommand = (payload: CommandPayload) => {
    const result = execute(purchase, { actorId: purchase.playerId, expectedRevision: purchase.revision, idempotencyKey: `purchase:${purchase.revision}`, payload });
    if (!result.ok) throw new Error(result.error?.message); purchase = result.state;
    record(`purchase:revision:${purchase.revision}`, purchase);
  };
  purchaseCommand({ type: 'take_action', action: { type: 'train', scale: 'small', method: 'pretraining', focuses: ['reasoning', 'coding'] } });
  purchaseCommand({ type: 'take_action', action: { type: 'ship', model: 'own' } });
  purchaseCommand({ type: 'propose_wildcard', proposal: 'Compute purchase fixture', ruling: { effect: 'capacity', amount: 4, price: 12, delay: 0, duration: null, upkeep: 1, visibility: 'physical' } });
  const proposalId = purchase.campaign!.proposals[0].id;
  purchaseCommand({ type: 'decide_wildcard', proposalId, decision: 'accept', humanApproval: 'Synthetic human test approval' });
  purchaseCommand({ type: 'apply_wildcard', proposalId }); purchaseCommand({ type: 'end_turn' });
  purchaseCommand({ type: 'take_action', action: { type: 'build', regionId: 'texas', scale: 'small', power: 'clean', layout: 'distributed', concealment: 2 } });
  purchaseCommand({ type: 'take_action', action: { type: 'fund', source: 'external', amount: 40 } });
  purchaseCommand({ type: 'take_action', action: { type: 'announce', claim: 'slowdown', targetId: purchase.playerId, value: true } });
  purchaseCommand({ type: 'end_turn' });
  record('campaign-exact-resume', resumeRun(saveRun(purchase)));
  let lab = createRun('discovery:5', 'lab-12');
  const labCommit = (payload: CommandPayload) => {
    const result = execute(lab, { actorId: lab.playerId, expectedRevision: lab.revision, idempotencyKey: `lab:${lab.revision}`, payload });
    if (!result.ok) throw new Error(result.error?.message); lab = result.state;
    record(`lab:${lab.revision}`, { state: lab, models: getModels(lab), brief: getBrief(lab), preview: previewQuarter(lab) });
  };
  labCommit({ type: 'set_mandate', mandate: { routine: 'product', cashFloor: 10, computeTarget: 0 } });
  for (const modelId of ['deepcent:compact', 'deepcent:general']) labCommit({ type: 'take_action', action: { type: 'evaluate', modelId, task: 'coding', harness: 'supervised', duration: 'short', suite: 'standard' } });
  labCommit({ type: 'end_turn' });
  labCommit({ type: 'take_action', action: { type: 'deploy', modelId: 'deepcent:compact', task: 'coding', harness: 'autonomous', duration: 'long', capacity: 4 } });
  labCommit({ type: 'end_turn' });
  labCommit({ type: 'take_action', action: { type: 'deploy', modelId: 'deepcent:compact', task: 'coding', harness: 'supervised', duration: 'short', capacity: 4 } });
  while (lab.phase !== 'ended') labCommit({ type: lab.phase === 'milestone' ? 'continue_campaign' : 'end_turn' });
  record('lab-resume', resumeRun(saveRun(lab)));
  let business = createRun('campaign:0', 'business-28');
  while (business.phase === 'planning') {
    const result = execute(business, { actorId: business.playerId, expectedRevision: business.revision, idempotencyKey: `business:${business.revision}`, payload: { type: 'end_turn' } });
    if (!result.ok) throw new Error(result.error?.message); business = result.state;
  }
  if (business.phase !== 'milestone') throw new Error('Business milestone witness changed');
  record('business-milestone', { state: business, brief: getBrief(business), view: getView(business) });
  record('business-continue', execute(business, { actorId: business.playerId, expectedRevision: business.revision, idempotencyKey: 'continue', payload: { type: 'continue_campaign' } }));
  record('business-conclude', execute(business, { actorId: business.playerId, expectedRevision: business.revision, idempotencyKey: 'conclude', payload: { type: 'conclude_campaign' } }));
  return { fixtureVersion: 'transition-trace-v3-lab', records, checksum: hash(records) };
}
