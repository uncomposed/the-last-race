import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, execute, getModels, getView, getPlan, getBrief, getFinalReveal, listActions, previewQuarter, saveRun, resumeRun, getBeliefs, getFeed, getRivals, getRules, explain } from '../src/engine.js';
import { expectedQuality, resolveMarket, resolveLabAction, admitEvaluations, labPublic } from '../src/lab.js';
import { getScenario } from '../src/scenario.js';
import { chooseIntervention, makePlan, rankOptions, routineOptions } from '../src/policy.js';
import { campaignQuarterEnd, strategicEvidence, validateCampaignAction } from '../src/campaign.js';
import { canonical } from '../src/numeric.js';
import type { Action, CommandPayload, RunState } from '../src/types.js';

function commit(s: RunState, payload: CommandPayload): RunState {
  const result = execute(s, { actorId: s.playerId, expectedRevision: s.revision, idempotencyKey: `lab-test:${s.revision}`, payload });
  assert.equal(result.ok, true, result.error?.message); return result.state;
}
const evaluate = (modelId: string, task: 'coding' | 'research' = 'coding'): Action => ({ type: 'evaluate', modelId, task, harness: 'supervised', duration: 'short', suite: 'standard' });
const deploy = (modelId: string, capacity = 4): Action => ({ type: 'deploy', modelId, task: 'coding', harness: 'supervised', duration: 'short', capacity });

test('stable models, delayed evaluation evidence and task-specific selection survive replay', () => {
  let s = createRun('discovery:5', 'lab-12');
  const initial = structuredClone(s); const [compact, general] = s.actors.deepcent.lab!.models;
  assert.ok(expectedQuality(general, 'coding', 'supervised', 'short') > expectedQuality(compact, 'coding', 'supervised', 'short'));
  s = commit(s, { type: 'take_action', action: evaluate(compact.id) });
  s = commit(s, { type: 'take_action', action: evaluate(general.id) });
  assert.equal(s.movesUsed, 2);
  s = commit(s, { type: 'end_turn' });
  let models = s.actors.deepcent.lab!.models;
  assert.ok(expectedQuality(models[0], 'coding', 'supervised', 'short') > expectedQuality(models[1], 'coding', 'supervised', 'short'));
  assert.deepEqual(s.modelTruth[compact.id], initial.modelTruth[compact.id]);
  assert.deepEqual(s.modelTruth[general.id], initial.modelTruth[general.id]);
  const before = canonical(s);
  const repeated = execute(s, { actorId: s.playerId, expectedRevision: s.revision, idempotencyKey: 'repeat-suite', payload: { type: 'take_action', action: evaluate(compact.id) } });
  assert.equal(repeated.ok, false); assert.match(repeated.error!.message, /already evaluated/); assert.equal(canonical(repeated.state), before);
  s = commit(s, { type: 'take_action', action: evaluate(compact.id, 'research') });
  s = commit(s, { type: 'take_action', action: evaluate(general.id, 'research') });
  s = commit(s, { type: 'end_turn' }); models = s.actors.deepcent.lab!.models;
  assert.ok(expectedQuality(models[1], 'research', 'supervised', 'short') > expectedQuality(models[0], 'research', 'supervised', 'short'));
  // Omission: absent evaluation, the prior preference is still the opposite.
  assert.ok(expectedQuality(initial.actors.deepcent.lab!.models[1], 'coding', 'supervised', 'short') > expectedQuality(initial.actors.deepcent.lab!.models[0], 'coding', 'supervised', 'short'));
  s = commit(s, { type: 'take_action', action: deploy(compact.id) });
  s = commit(s, { type: 'end_turn' });
  assert.equal(s.actors.deepcent.lab!.deployments.find(d => d.task === 'coding')!.modelId, compact.id);
  assert.deepEqual(resumeRun(saveRun(s)), s);
});

test('pending results and latent model properties cannot alter any permitted view or preview', () => {
  const state = createRun('secrecy', 'lab-12'); const other = structuredClone(state);
  resolveLabAction(state, state.actors.deepcent, evaluate('deepcent:compact'), 'pending');
  resolveLabAction(other, other.actors.deepcent, evaluate('deepcent:compact'), 'pending');
  other.actors.deepcent.lab!.evaluations[0].successes = 999;
  other.modelTruth['deepcent:compact'].abilities.coding = 0.001;
  other.modelTruth['deepcent:general'].hazard = 0.99;
  other.actors.openbrain.cash = 9999;
  other.actors.openbrain.lab!.models[0].estimates = {};
  other.hidden.controlEffectiveness = 0;
  for (const selector of [getView, getModels, getBrief, getPlan, getBeliefs, getFeed, getRivals, getRules, listActions, previewQuarter, explain, getFinalReveal]) assert.deepEqual(selector(other), selector(state), selector.name);
  assert.equal('successes' in labPublic(state)!.evaluations[0], false);
  assert.deepEqual(listActions(state, deploy('deepcent:compact')), listActions(other, deploy('deepcent:compact')));
});

test('serving shares the strategic ledger, throttles honestly and produces no guaranteed income', () => {
  let s = createRun('allocation', 'lab-12'); const original = getPlan(s).serving![0];
  assert.equal(original.capacity, 4); assert.equal(original.computeCost, 2);
  s = commit(s, { type: 'take_action', action: { type: 'train', scale: 'small', method: 'pretraining', focuses: ['coding', 'science'] } });
  const plan = getPlan(s); assert.ok(plan.serving![0].capacity < original.capacity); assert.ok(plan.computeCommitted <= s.actors.deepcent.compute);
  const forecast = previewQuarter(s); assert.equal(forecast.projectedClosingCash, null); assert.ok(forecast.serviceForecast!.revenueRange[0] === 0);
  const cash = s.actors.deepcent.cash; const spend = plan.cashCommitted;
  s = commit(s, { type: 'end_turn' });
  assert.equal(s.actors.deepcent.cash, cash - spend + s.actors.deepcent.revenue - getScenario('lab-12').openingCashCost);
  assert.equal(s.actors.deepcent.lab!.models.length, 4);
  assert.equal(s.actors.deepcent.safety, forecast.projectedSafety, 'science focus must not become a free safety increment in lab mode');
  assert.ok(s.modelTruth[s.actors.deepcent.lab!.models.at(-1)!.id]);
});

test('vendor limits, recurring fees, model access and deployment suspension are enforced', () => {
  let s = createRun('vendor', 'lab-12');
  assert.throws(() => listActions(s, deploy('openbrain:compact')), /accessible model/);
  assert.throws(() => listActions(s, deploy('vendor:general', 8)), /six requested/);
  s = commit(s, { type: 'take_action', action: deploy('vendor:general', 6) });
  const vendor = getPlan(s).serving!.find(a => a.modelId === 'vendor:general')!;
  assert.equal(vendor.computeCost, 0); assert.equal(vendor.cashCost, 18);
  s = commit(s, { type: 'end_turn' });
  assert.equal(getPlan(s).serving!.find(a => a.modelId === 'vendor:general')!.cashCost, 18);
  s = commit(s, { type: 'take_action', action: deploy('vendor:general', 0) });
  assert.equal(getPlan(s).serving!.find(a => a.modelId === 'vendor:general')!.cashCost, 0);
});

test('shared demand creates competition and cannot exceed funded service capacity', () => {
  const base = createRun('market', 'lab-12');
  for (const actor of Object.values(base.actors)) {
    actor.lab!.deployments = [{ id: `deployment:${actor.id}:coding`, modelId: `${actor.id}:compact`, task: 'coding', harness: 'supervised', duration: 'short', capacity: 8, reputation: 0.6, lastServed: 0, lastSuccessful: 0, lastRevenue: 0 }];
    actor.compute = 20;
    base.plans[actor.id] = makePlan(actor, getScenario('lab-12'), 0, []);
  }
  const solo = structuredClone(base);
  for (const id of Object.keys(solo.actors).filter(id => id !== solo.playerId)) solo.plans[id].serving = [];
  resolveMarket(base); resolveMarket(solo);
  assert.ok(base.actors.deepcent.lab!.deployments[0].lastServed < solo.actors.deepcent.lab!.deployments[0].lastServed);
  for (const actor of Object.values(base.actors)) assert.ok(actor.lab!.deployments[0].lastServed <= base.plans[actor.id].serving![0].capacity);
});

test('ongoing autonomous deployment incidents allow suspension, restriction or replacement', () => {
  // Controlled mechanism fixture: high hazard and ineffective containment, not a campaign balance estimate.
  let witness: RunState | undefined;
  for (let i = 0; i < 30; i++) {
    const s = createRun(`incident:${i}`, 'lab-12'); const actor = s.actors.deepcent;
    resolveLabAction(s, actor, { ...deploy('deepcent:compact', 8), harness: 'autonomous' } as Action, 'deploy');
    actor.compute = 20; s.hidden.controlEffectiveness = 0; s.modelTruth['deepcent:compact'].hazard = 1;
    s.plans.deepcent = makePlan(actor, getScenario('lab-12'), 0, []); resolveMarket(s);
    if (actor.lab!.incidents.some(e => e.detected && !e.contained)) { witness = s; break; }
  }
  assert.ok(witness);
  for (const response of [deploy('deepcent:compact', 0), deploy('deepcent:compact', 4), deploy('deepcent:general', 4)]) {
    const s = structuredClone(witness); resolveLabAction(s, s.actors.deepcent, response, 'response');
    assert.ok(s.actors.deepcent.lab!.incidents.find(e => e.detected && !e.contained)!.response);
  }
  assert.equal(witness.actors.deepcent.lab!.incidents.find(e => e.detected && !e.contained)!.response, null);
});

test('rival candidates skip exhausted funds and full regions; surplus compute removes lease preference', () => {
  const s = createRun('repair', 'full-28'); const scenario = getScenario('full-28'); const actor = s.actors.metamind;
  actor.cash = 20; actor.strategy!.parentBudget = 0;
  const selected = chooseIntervention(actor, scenario, 0, [], a => { try { validateCampaignAction(s, scenario, actor.id, a); return true; } catch { return false; } });
  assert.notDeepEqual(selected, { type: 'fund', source: 'parent', amount: 20 });
  actor.cash = 100; actor.weights = { revenue: 0, capability: 10, safety: 0, mission: 0 };
  actor.strategy!.assets = [{ id: 'full', regionId: 'texas', capacity: 40, upkeep: 1, availableQuarter: 0, expiresQuarter: null, power: 'grid', layout: 'concentrated' }];
  const feasible = (a: Action) => { try { validateCampaignAction(s, scenario, actor.id, a); return true; } catch { return false; } };
  assert.throws(() => validateCampaignAction(s, scenario, actor.id, { type: 'build', regionId: 'texas', scale: 'small', power: 'grid', layout: 'distributed' }), /allocation/);
  const fallback = chooseIntervention(actor, scenario, 0, [], feasible);
  assert.ok(fallback); assert.notEqual(fallback.type, 'build'); assert.equal(feasible(fallback), true);
  const player = s.actors.deepcent;
  assert.equal(rankOptions(player, routineOptions(player, scenario, 0))[0].id, 'lease');
  player.compute = 20;
  assert.notEqual(makePlan(player, scenario, 0, []).items[0].choice, 'lease');
});

test('standing mandate persists without more moves and zero-gain launches warn before spending', () => {
  let s = createRun('mandate', 'full-28');
  s = commit(s, { type: 'set_mandate', mandate: { routine: 'product', cashFloor: 10, computeTarget: 0 } });
  assert.equal(s.movesUsed, 1);
  for (let i = 0; i < 3; i++) { s = commit(s, { type: 'end_turn' }); assert.equal(s.movesUsed, 0); assert.equal(getPlan(s).items[0].choice, 'product'); }
  s.actors.deepcent.strategy!.lastLaunchCapability = s.actors.deepcent.capability;
  const preview = listActions(s, { type: 'ship', model: 'own' })[0];
  assert.equal(preview.marginalRecurringRevenue, 0); assert.match(preview.warning!, /no recurring revenue/);
});

test('allowed construction does not contradict a slowdown, observed covered training does', () => {
  for (const activity of ['build', 'train'] as const) {
    const s = createRun('pledge', 'full-28'); const scenario = getScenario('full-28');
    s.campaign!.claims.push({ id: 'claim', speakerId: 'openbrain', targetId: 'openbrain', claim: 'slowdown', value: true, quarter: 0, settlesQuarter: 2, settled: false });
    s.quarter = 2;
    strategicEvidence(s, scenario, 'deepcent', 'openbrain', 'openbrain', 'racing', 0.95, 'observed', 'Observed activity', 'physical', true, 0, 1, activity);
    campaignQuarterEnd(s, scenario);
    if (activity === 'build') assert.equal(s.campaign!.trust['deepcent:openbrain'], undefined);
    else assert.ok(s.campaign!.trust['deepcent:openbrain'] < 0.5);
  }
});

test('business political milestones seal hidden outcomes and continue exactly once', () => {
  let s = createRun('campaign:0', 'business-28');
  while (s.phase === 'planning') s = commit(s, { type: 'end_turn' });
  assert.equal(s.phase, 'milestone'); assert.equal(s.report, null); assert.equal(s.pendingMilestone, 'coordinated-slowdown');
  assert.ok('error' in getFinalReveal(s));
  const restored = resumeRun(saveRun(s)); assert.deepEqual(restored, s);
  const quarter = s.quarter; const cash = s.actors.deepcent.cash;
  const command = { actorId: s.playerId, expectedRevision: s.revision, idempotencyKey: 'continue-once', payload: { type: 'continue_campaign' as const } };
  const continued = execute(s, command); assert.equal(continued.ok, true); assert.equal(continued.state.quarter, quarter + 1);
  assert.ok(continued.state.actors.deepcent.cash <= cash); assert.deepEqual(execute(continued.state, command).state, continued.state);
  assert.equal(continued.state.report, null); assert.ok('error' in getFinalReveal(continued.state));
  const concluded = commit(restored, { type: 'conclude_campaign' }); assert.equal(concluded.phase, 'ended'); assert.ok('hidden' in getFinalReveal(concluded));
});

test('late training contradicts an active pledge without repeated absence farming credibility', () => {
  const s = createRun('late-pledge', 'full-28'); const scenario = getScenario('full-28');
  s.campaign!.claims.push({ id: 'claim', speakerId: 'openbrain', targetId: 'openbrain', claim: 'slowdown', value: true, quarter: 0, settlesQuarter: 2, settled: false });
  s.quarter = 2;
  strategicEvidence(s, scenario, 'deepcent', 'openbrain', 'openbrain', 'racing', 0.1, 'absence-test', 'No training observed', 'covert', true, 0.5, 0.8, 'monitored-absence');
  campaignQuarterEnd(s, scenario);
  const supported = s.campaign!.trust['deepcent:openbrain']; assert.ok(supported > 0.5);
  campaignQuarterEnd(s, scenario); assert.equal(s.campaign!.trust['deepcent:openbrain'], supported);
  s.quarter = 3;
  strategicEvidence(s, scenario, 'deepcent', 'openbrain', 'openbrain', 'racing', 0.95, 'late-train', 'Training observed', 'physical', true, 0, 1, 'train');
  campaignQuarterEnd(s, scenario); assert.ok(s.campaign!.trust['deepcent:openbrain'] < supported);
});

test('paid evaluation can mislead without changing the underlying model, and zero work earns no service revenue', () => {
  let misleading = false;
  for (let i = 0; i < 30; i++) {
    const s = createRun(`misleading:${i}`, 'lab-12'); const actor = s.actors.deepcent;
    for (const model of actor.lab!.models.slice(0, 2)) resolveLabAction(s, actor, evaluate(model.id), model.id);
    s.quarter = 1; admitEvaluations(s);
    const [a, b] = actor.lab!.models;
    const observed = expectedQuality(a, 'coding', 'supervised', 'short') - expectedQuality(b, 'coding', 'supervised', 'short');
    const truth = s.modelTruth[a.id].abilities.coding - s.modelTruth[b.id].abilities.coding;
    if (observed * truth < 0) { misleading = true; break; }
  }
  assert.equal(misleading, true, 'Retain a counterexample to treating evaluations as an oracle');
  const s = createRun('no-work', 'lab-12'); for (const id of Object.keys(s.actors)) s.plans[id].serving = [];
  resolveMarket(s); for (const actor of Object.values(s.actors)) assert.equal(actor.revenue, 0);
});

test('a queued workload expansion changes the next-quarter capacity plan before commitment', () => {
  let s = createRun('lease-forecast', 'lab-12');
  assert.notEqual(getPlan(s).items[0].choice, 'lease');
  s = commit(s, { type: 'take_action', action: { type: 'deploy', modelId: 'deepcent:compact', task: 'coding', harness: 'supervised', duration: 'long', capacity: 8 } });
  assert.equal(getPlan(s).items[0].choice, 'lease');
  assert.ok(getPlan(s).serving!.some(a => a.capacity < a.requested));
  const supervised = listActions(createRun('cost-comparison', 'lab-12'), deploy('deepcent:compact'))[0];
  const autonomous = listActions(createRun('cost-comparison', 'lab-12'), { ...deploy('deepcent:compact'), harness: 'autonomous' } as Action)[0];
  assert.ok(supervised.serving!.reduce((n,a) => n + a.cashCost,0) > autonomous.serving!.reduce((n,a) => n + a.cashCost,0));
  assert.ok(autonomous.serviceForecast!.continuingExposure.length > 0);
});

test('continuation delivers a long-lived asset purchased before a political milestone', () => {
  let s = createRun('campaign:0', 'business-28');
  while (s.phase === 'planning') {
    if (s.quarter === 3) s = commit(s, { type: 'take_action', action: { type: 'build', regionId: 'ireland', scale: 'small', power: 'clean', layout: 'distributed' } });
    s = commit(s, { type: 'end_turn' });
  }
  assert.equal(s.phase, 'milestone');
  const pending = s.projects.find(p => p.actorId === s.playerId && p.kind === 'build');
  assert.ok(pending && pending.kind === 'build');
  const delivery = pending.asset.availableQuarter;
  s = commit(s, { type: 'continue_campaign' });
  while (s.quarter < delivery && s.phase !== 'ended') s = commit(s, { type: s.phase === 'milestone' ? 'continue_campaign' : 'end_turn' });
  assert.equal(s.quarter, delivery);
  assert.ok(s.actors.deepcent.strategy!.assets.some(a => a.id === pending.asset.id));
  assert.deepEqual(resumeRun(saveRun(s)), s);
});
