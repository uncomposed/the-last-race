import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveMean, mean, recomputeBelief } from '../src/beliefs.js';
import { createRun, execute, explain, getBeliefs, getFeed, getPlan, getRivals, getRules, getView, listActions, replay, resumeRun, saveRun } from '../src/engine.js';
import { canonical } from '../src/numeric.js';
import { rankOptions, scoreOption, type PolicyOption } from '../src/policy.js';
import { getScenario } from '../src/scenario.js';
import type { Command, CommandPayload, RunState } from '../src/types.js';

function command(state: RunState, payload: CommandPayload, overrides: Partial<Command> = {}): Command {
  return { actorId: state.playerId, expectedRevision: state.revision, idempotencyKey: `test:${state.revision}`, payload, ...overrides };
}
function accept(state: RunState, payload: CommandPayload): RunState {
  const original = canonical(state); const result = execute(state, command(state, payload));
  assert.equal(result.ok, true, result.error?.message); assert.equal(canonical(state), original, 'input state mutated');
  assert.equal(result.state.revision, state.revision + 1); return result.state;
}
function reject(state: RunState, request: Command): string {
  const original = canonical(state); const result = execute(state, request);
  assert.equal(result.ok, false); assert.equal(canonical(state), original); assert.equal(canonical(result.state), original);
  assert.ok(result.error); return result.error.code;
}
const train = { type: 'train', scale: 'small', method: 'pretraining', focuses: ['reasoning', 'coding'] } as const;
const mutableTrain = () => ({ ...train, focuses: ['reasoning', 'coding'] as ['reasoning', 'coding'] });

test('Q1 creation applies upkeep, initial audit, synthetic provenance and a delegated plan', () => {
  const state = createRun('creation'); const scenario = getScenario();
  assert.equal(state.quarter, 0); assert.equal(getView(state).quarterLabel, 'Q1 2025');
  assert.equal(state.actors[state.playerId].cash, scenario.actors[0].cash - scenario.openingCashCost);
  assert.equal(state.actors[state.playerId].compute, scenario.openingCompute);
  assert.equal(getPlan(state).items.length, 1); assert.ok(getFeed(state).some(e => e.flagged && e.status === 'discounted'));
  assert.equal(getView(state).scenario.provenance.kind, 'synthetic'); assert.equal(getRules(state).movesPerQuarter, 3);
  assert.throws(() => createRun('')); assert.throws(() => createRun('x', 'unknown'));
});

test('invalid, stale and unauthorized commands reject atomically; identical retries precede revision checks', () => {
  const state = createRun('atomic');
  assert.equal(reject(state, command(state, { type: 'end_turn' }, { actorId: 'openbrain' })), 'ACTOR_NOT_AUTHORIZED');
  assert.equal(reject(state, command(state, { type: 'end_turn' }, { expectedRevision: -1 })), 'STALE_REVISION');
  reject(state, command(state, { type: 'override_belief', topic: 'control', conviction: NaN }));
  reject(state, command(state, { type: 'take_action', action: { type: 'secure', amount: 9 } } as unknown as CommandPayload));
  reject(state, command(state, { type: 'take_action', action: { ...mutableTrain(), focuses: ['coding', 'coding'] } } as unknown as CommandPayload));
  const request = command(state, { type: 'override_belief', topic: 'control', conviction: 0.5 });
  const accepted = execute(state, request); assert.equal(accepted.ok, true);
  const retry = execute(accepted.state, request); assert.equal(retry.ok, true); assert.equal(retry.data?.duplicate, true);
  assert.equal(canonical(retry.state), canonical(accepted.state)); assert.equal(retry.state.log.length, 1);
  assert.equal(reject(accepted.state, { ...request, payload: { type: 'override_belief', topic: 'control', conviction: 0.6 } }), 'IDEMPOTENCY_CONFLICT');
});

test('actions, plan overrides and conviction changes all share three intervention slots', () => {
  let state = createRun('slots');
  state = accept(state, { type: 'override_belief', topic: 'control', conviction: 0.9 });
  state = accept(state, { type: 'override_plan_item', itemId: getPlan(state).items[0].id, choice: 'veto' });
  state = accept(state, { type: 'take_action', action: { type: 'investigate', topic: 'control' } });
  assert.equal(state.movesUsed, 3); assert.equal(getView(state).movesRemaining, 0);
  assert.equal(reject(state, command(state, { type: 'override_belief', topic: 'control', conviction: null })), 'MOVE_LIMIT');
  state = accept(state, { type: 'end_turn' }); assert.equal(state.movesUsed, 0);
  state = accept(state, { type: 'override_belief', topic: 'control', conviction: 0.8 }); assert.equal(state.movesUsed, 1);
  state = accept(state, { type: 'override_belief', topic: 'control', conviction: null }); assert.equal(state.movesUsed, 2);
  assert.equal(state.actors[state.playerId].belief.override, null);
});

test('routine and interventions spend one shared ledger and cannot trap explicit plans', () => {
  let state = createRun('ledger'); const cash = state.actors[state.playerId].cash;
  state = accept(state, { type: 'override_plan_item', itemId: getPlan(state).items[0].id, choice: 'product' });
  state = accept(state, { type: 'take_action', action: mutableTrain() });
  assert.equal(getPlan(state).items[0].choice, 'product'); assert.equal(getPlan(state).computeCommitted, 4);
  assert.equal(state.actors[state.playerId].cash, cash, 'staging spent cash early');
  reject(state, command(state, { type: 'take_action', action: { type: 'secure', amount: 1 } }));
  const evidenceId = getFeed(state).find(e => e.canRespond)!.id;
  reject(state, command(state, { type: 'respond_to_evidence', evidenceId, response: { type: 'secure', amount: 1 } }));
  const committed = getPlan(state).cashCommitted;
  const revenueAfter = state.actors[state.playerId].revenue + 2 + 1; // routine product plus delayed coding completion
  const next = accept(state, { type: 'end_turn' });
  // Coding project first completes at next opening, after the previous quarter revenue payment.
  assert.equal(next.actors[state.playerId].cash, cash - committed + (revenueAfter - 1) - getScenario().openingCashCost);
  assert.ok(next.actors[state.playerId].compute >= 0);
  assert.equal(next.actors[state.playerId].product, state.actors[state.playerId].product + 1);
});

test('new training waits for subsequent openings; large training needs two', () => {
  let state = createRun('delayed'); const capability = state.actors[state.playerId].capability;
  state = accept(state, { type: 'take_action', action: mutableTrain() });
  assert.equal(state.actors[state.playerId].capability, capability); assert.equal(state.projects.length, 0);
  state = accept(state, { type: 'end_turn' }); assert.ok(state.actors[state.playerId].capability > capability);
  assert.equal(state.projects.filter(p => p.actorId === state.playerId).length, 0);
  // Establish a temporary lease so the six-unit large training is feasible next quarter.
  state = accept(state, { type: 'override_plan_item', itemId: getPlan(state).items[0].id, choice: 'lease' });
  state = accept(state, { type: 'end_turn' });
  const before = state.actors[state.playerId].capability;
  state = accept(state, { type: 'take_action', action: { type: 'train', scale: 'large', method: 'rl', focuses: ['science', 'agency'] } });
  state = accept(state, { type: 'end_turn' });
  assert.equal(state.actors[state.playerId].capability, before);
  assert.equal(state.projects.find(p => p.actorId === state.playerId)?.remaining, 1);
  state = accept(state, { type: 'end_turn' }); assert.ok(state.actors[state.playerId].capability > before);
  let terminal = createRun('delayed-terminal', 'one-quarter'); terminal = accept(terminal, { type: 'take_action', action: mutableTrain() });
  terminal = accept(terminal, { type: 'end_turn' });
  assert.equal(terminal.actors[terminal.playerId].capability, capability); assert.equal(terminal.projects.find(p => p.actorId === terminal.playerId)?.remaining, 1);
});

test('Respond replaces the admitted contribution, preserves conviction, pays costs and uses one move', () => {
  let state = createRun('respond');
  state = accept(state, { type: 'override_belief', topic: 'control', conviction: 0.95 });
  const evidence = state.evidence.find(e => e.observerId === state.playerId && e.detected && e.processed && e.flagged)!;
  const oldBelief = structuredClone(state.actors[state.playerId].belief); const oldEvidence = structuredClone(state.evidence);
  state = accept(state, { type: 'respond_to_evidence', evidenceId: evidence.id, response: { type: 'secure', amount: 1 } });
  assert.equal(state.movesUsed, 2); assert.deepEqual(state.actors[state.playerId].belief.override, oldBelief.override);
  const item = state.evidence.find(e => e.id === evidence.id)!;
  assert.equal(item.receptivity, 1); assert.equal(item.status, 'acted-on');
  assert.equal(item.ambiguity, evidence.ambiguity); assert.equal(item.credibility, evidence.credibility);
  oldEvidence.find(e => e.id === evidence.id)!.receptivity = 1;
  const expected = recomputeBelief(getScenario().grid, oldBelief, oldEvidence.filter(e => e.observerId === state.playerId));
  assert.deepEqual(state.actors[state.playerId].belief.posterior, expected.posterior);
  assert.deepEqual(state.actors[state.playerId].belief.evidenceIds, oldBelief.evidenceIds);
  assert.equal(state.interventions[0].cashCost, getScenario().costs.secureUnit);
  assert.equal(state.interventions[0].forcedByEvidence, evidence.id);
  assert.equal(reject(state, command(state, { type: 'respond_to_evidence', evidenceId: evidence.id, response: { type: 'secure', amount: 1 } })), 'ALREADY_RESPONDED');
});

test('conviction lasts current plus three quarters while underlying posterior learns', () => {
  let state = createRun('expiry'); const grid = getScenario().grid;
  state = accept(state, { type: 'override_belief', topic: 'control', conviction: 0.95 });
  const initialPosterior = canonical(state.actors[state.playerId].belief.posterior);
  for (let quarter = 0; quarter < 4; quarter++) {
    assert.equal(state.quarter, quarter); assert.equal(effectiveMean(grid, state.actors[state.playerId].belief, quarter), 0.95);
    state = accept(state, { type: 'take_action', action: { type: 'investigate', topic: 'control' } });
    state = accept(state, { type: 'end_turn' });
  }
  assert.equal(state.quarter, 4); assert.equal(state.actors[state.playerId].belief.override, null);
  assert.notEqual(canonical(state.actors[state.playerId].belief.posterior), initialPosterior);
  assert.equal(effectiveMean(grid, state.actors[state.playerId].belief, 4), mean(grid, state.actors[state.playerId].belief.posterior));
});

test('public selectors, explanations, errors and previews respect private knowledge', () => {
  const state = createRun('privacy'); const alternative = structuredClone(state);
  alternative.hidden.controlEffectiveness = 0.987654321; alternative.hidden.incidents = 6789;
  alternative.actors.openbrain.intelligence = 0.987; alternative.actors.openbrain.cash = 9876;
  alternative.actors.openbrain.belief.posterior = getScenario().grid.support.map(() => 0.05);
  alternative.plans.openbrain.items[0].reason = 'PRIVATE_PLAN_SENTINEL';
  alternative.traces.push({ id: 'private-sentinel', actorId: 'openbrain', quarter: 0, kind: 'private-policy', summary: 'PRIVATE_TRACE_SENTINEL', details: { secret: 'PRIVATE_DETAILS' } });
  alternative.evidence.push({ ...alternative.evidence[0], id: 'undetected-sentinel', observerId: alternative.playerId, detected: false, summary: 'PRIVATE_EVIDENCE_SENTINEL', independentKey: 'sentinel' });
  const selectors = [getView, getPlan, getBeliefs, getFeed, getRivals, listActions, explain, getRules];
  for (const selector of selectors) assert.equal(canonical(selector(state)), canonical(selector(alternative)), selector.name);
  assert.deepEqual(explain(alternative, 'private-sentinel'), explain(alternative, 'missing'));
  assert.equal(reject(alternative, command(alternative, { type: 'respond_to_evidence', evidenceId: 'undetected-sentinel', response: { type: 'secure', amount: 1 } })), 'EVIDENCE_NOT_RESPONDABLE');
  for (const action of listActions(state)) {
    if (action.visibility === 'public') assert.ok(action.detectionEstimates.every(e => e.probability === 1));
    assert.ok(action.detectionEstimates.every(e => e.probability >= 0 && e.probability <= 1));
  }
  const view = getView(state); view.player.cash = 0; assert.notEqual(state.actors[state.playerId].cash, 0);
});

test('observations wait until next opening; public signals detect and covert signals may be missed', () => {
  let sawUndetected = false;
  for (let n = 0; n < 8; n++) {
    let state = createRun(`gates:${n}`);
    state = accept(state, { type: 'take_action', action: { type: 'ship', model: 'third-party' } });
    state = accept(state, { type: 'end_turn' });
    assert.ok(state.evidence.filter(e => e.visibility === 'public').every(e => e.detected));
    assert.ok(getFeed(state).every(e => state.evidence.find(x => x.id === e.id)!.availableQuarter <= state.quarter));
    sawUndetected ||= state.evidence.some(e => !e.detected);
  }
  assert.equal(sawUndetected, true, 'missed covert path was not exercised by bounded seeds');
});

test('stable score ties use IDs; policy does not read hidden truth', () => {
  const actor = createRun('ties').actors.deepcent;
  const option = (id: string): PolicyOption => ({ id, cashCost: 1, computeCost: 0, revenue: 1, capability: 0, safety: 0, mission: 0, switchingCost: 0 });
  assert.equal(scoreOption(actor, option('z')), scoreOption(actor, option('a')));
  assert.deepEqual(rankOptions(actor, [option('z'), option('m'), option('a')]).map(o => o.id), ['a', 'm', 'z']);
});

test('horizon is terminal, rejected mutations do not corrupt replay, and save identity fails closed', () => {
  let state = createRun('terminal', 'one-quarter'); state = accept(state, { type: 'end_turn' });
  assert.equal(state.phase, 'ended'); assert.equal(state.report?.kind, 'prototype-horizon');
  assert.equal(getView(state).resources.committedCash, 0); assert.equal(getView(state).movesRemaining, 0);
  assert.equal(reject(state, command(state, { type: 'end_turn' })), 'RUN_ENDED');
  const saved = saveRun(state); assert.equal(canonical(resumeRun(saved)), canonical(state)); assert.equal(canonical(replay(state)), canonical(state));
  const incompatible = JSON.parse(saved); incompatible.identity.numericalVersion = 'unknown'; assert.throws(() => resumeRun(JSON.stringify(incompatible)));
  const corrupt = JSON.parse(saved); corrupt.actors.deepcent.cash += 1; assert.throws(() => resumeRun(JSON.stringify(corrupt)));
  assert.throws(() => resumeRun('{bad')); assert.throws(() => resumeRun('{}'));
});

test('same seed and commands replay an entire core horizon identically', () => {
  let state = createRun('full-replay');
  while (state.phase === 'planning') {
    state = accept(state, { type: 'take_action', action: { type: 'ship', model: 'third-party' } });
    state = accept(state, { type: 'end_turn' });
    assert.equal(canonical(resumeRun(saveRun(state))), canonical(state));
  }
  assert.equal(state.quarter, 11); assert.equal(state.report?.kind, 'prototype-horizon');
  assert.equal(canonical(replay(state)), canonical(state));
});

test('observable identifiers do not reveal counts of private evidence or traces', () => {
  let baseline = createRun('identifier-boundary'); let withPrivate = structuredClone(baseline);
  withPrivate.evidence.unshift({ ...withPrivate.evidence[0], id: 'hidden-added-evidence', observerId: 'openbrain', independentKey: 'unobserved-extra', detected: false, processed: false, status: 'undetected' });
  withPrivate.traces.unshift({ id: 'hidden-added-trace', actorId: 'openbrain', quarter: 0, kind: 'private-incident', summary: 'hidden extra', details: {} });
  for (const payload of [{ type: 'take_action', action: { type: 'investigate', topic: 'control' } }, { type: 'end_turn' }] as CommandPayload[]) {
    baseline = accept(baseline, payload); withPrivate = accept(withPrivate, payload);
  }
  assert.equal(canonical(getFeed(baseline)), canonical(getFeed(withPrivate)));
  assert.equal(canonical(explain(baseline)), canonical(explain(withPrivate)));
  assert.equal(canonical(getBeliefs(baseline)), canonical(getBeliefs(withPrivate)));
});

test('exact Train previews honor method/focus tradeoffs and prior-based risk, including earlier Secure', () => {
  let state = createRun('exact-preview');
  const action = { type: 'train', scale: 'small', method: 'rl', focuses: ['science', 'agency'] } as const;
  const requested = { ...action, focuses: ['science', 'agency'] as ['science', 'agency'] };
  const [preview] = listActions(state, requested);
  assert.deepEqual(preview.action, requested); assert.equal(listActions(state, requested).length, 1);
  assert.equal(preview.cashCost, 12); assert.equal(preview.computeCost, 3); assert.match(preview.effect, /gain 6/);
  const basic = listActions(state, mutableTrain())[0]; assert.ok(preview.expectedContainmentRisk! > basic.expectedContainmentRisk!);
  const hiddenChanged = structuredClone(state); hiddenChanged.hidden.controlEffectiveness = 1;
  assert.deepEqual(listActions(hiddenChanged, requested), listActions(state, requested));
  state = accept(state, { type: 'take_action', action: { type: 'secure', amount: 1 } });
  assert.ok(listActions(state, requested)[0].expectedContainmentRisk! < preview.expectedContainmentRisk!);
  assert.throws(() => listActions(state, { ...requested, focuses: ['science', 'science'] } as unknown as typeof requested));
  state = accept(state, { type: 'take_action', action: requested });
  const capability = state.actors[state.playerId].capability;
  state = accept(state, { type: 'end_turn' }); assert.equal(state.actors[state.playerId].capability - capability, 6);
});
