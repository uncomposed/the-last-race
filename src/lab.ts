import type { Action, Actor, Deployment, Duration, Evaluation, Harness, Intervention, ModelAsset, ModelEstimate, RunState, ServingAllocation, Task } from './types.js';
import { clamp, random } from './numeric.js';

export const tasks: Task[] = ['coding', 'assistance', 'research'];
export const harnesses: Harness[] = ['supervised', 'autonomous'];
export const durations: Duration[] = ['short', 'long'];
const support = Array.from({ length: 20 }, (_, i) => (i + 1) / 20);
export const contextKey = (task: Task, harness: Harness, duration: Duration) => `${task}:${harness}:${duration}`;
const deploymentId = (actorId: string, task: Task) => `deployment:${actorId}:${task}`;

function prior(model: ModelAsset, harness: Harness, duration: Duration): number[] {
  const center = (model.vendorCost ? 0.65 : model.throughput === 2 ? 0.55 : 0.6) - (duration === 'long' ? 0.1 : 0) + (harness === 'supervised' ? 0.05 : 0);
  const weights = support.map(p => 0.2 + Math.max(0, 1 - Math.abs(p - center) * 2));
  const total = weights.reduce((n, p) => n + p, 0);
  return weights.map(p => p / total);
}
export function estimate(model: ModelAsset, task: Task, harness: Harness, duration: Duration): ModelEstimate {
  return model.estimates[contextKey(task, harness, duration)] ?? { posterior: prior(model, harness, duration), evidenceIds: [] };
}
export function expectedQuality(model: ModelAsset, task: Task, harness: Harness, duration: Duration): number {
  return estimate(model, task, harness, duration).posterior.reduce((n, p, i) => n + p * support[i], 0);
}
function addModel(state: RunState, actor: Actor, id: string, name: string, focuses: string[], generation: number, compact = false): void {
  const model: ModelAsset = { id, name, ownerId: actor.id, createdQuarter: state.quarter, throughput: compact ? 2 : 1, vendorCost: 0, estimates: {} };
  actor.lab!.models.push(model);
  const focusFor = { coding: 'coding', assistance: 'reasoning', research: 'science' };
  state.modelTruth[id] = {
    abilities: Object.fromEntries(tasks.map(task => [task, clamp(0.3 + random(state.identity.seed, `${id}:ability:${task}`) * 0.42 + (focuses.includes(focusFor[task]) ? 0.12 : 0) + Math.min(0.12, generation * 0.015), 0.15, 0.92)])) as Record<Task, number>,
    longPenalty: 0.08 + random(state.identity.seed, `${id}:long`) * 0.25,
    hazard: 0.01 + random(state.identity.seed, `${id}:hazard`) * 0.035,
  };
}
export function initializeLab(state: RunState): void {
  for (const actor of Object.values(state.actors).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    actor.lab = { models: [], evaluations: [], deployments: [], incidents: [] };
    actor.strategy!.mandate = { routine: 'automatic', cashFloor: 10, computeTarget: 0 };
    actor.revenue = 0;
    addModel(state, actor, `${actor.id}:compact`, 'Compact 1', ['coding'], 0, true);
    addModel(state, actor, `${actor.id}:general`, 'General 1', ['reasoning', 'science'], 1);
    actor.lab.models.push({ id: 'vendor:general', name: 'Vendor General', ownerId: 'vendor', createdQuarter: 0, throughput: 2, vendorCost: 1, estimates: {} });
    const task = tasks[Object.keys(state.actors).sort().indexOf(actor.id) % tasks.length];
    actor.lab.deployments.push({ id: deploymentId(actor.id, task), modelId: `${actor.id}:compact`, task, harness: 'supervised', duration: 'short', capacity: 4, reputation: 0.6, lastServed: 0, lastSuccessful: 0, lastRevenue: 0 });
  }
  state.modelTruth['vendor:general'] = { abilities: { coding: 0.65, assistance: 0.72, research: 0.58 }, longPenalty: 0.16, hazard: 0.02 };
}
export function completeModel(state: RunState, actor: Actor, projectId: string, focuses: string[]): void {
  addModel(state, actor, `model:${projectId}`, `Candidate ${actor.lab!.models.filter(m => m.ownerId === actor.id).length + 1}`, focuses, actor.capability);
}
export function projectedDeployments(actor: Actor, actions: Action[]): Deployment[] {
  const deployments = structuredClone(actor.lab?.deployments ?? []);
  for (const action of actions) if (action.type === 'deploy') {
    const id = deploymentId(actor.id, action.task);
    const old = deployments.find(d => d.id === id);
    const next: Deployment = { id, modelId: action.modelId, task: action.task, harness: action.harness, duration: action.duration, capacity: action.capacity,
      reputation: old?.reputation ?? 0.5, lastServed: old?.lastServed ?? 0, lastSuccessful: old?.lastSuccessful ?? 0, lastRevenue: old?.lastRevenue ?? 0 };
    if (old) Object.assign(old, next); else deployments.push(next);
  }
  return deployments.sort((a, b) => a.id < b.id ? -1 : 1);
}
export function desiredCompute(actor: Actor, actions: Action[] = []): number {
  return projectedDeployments(actor, actions).reduce((n, d) => {
    const model = actor.lab!.models.find(m => m.id === d.modelId)!;
    return n + (model.vendorCost ? 0 : Math.ceil(d.capacity / model.throughput) * (d.duration === 'long' ? 2 : 1));
  }, 0);
}
/** Operations throttle to the remaining ledger. No future income or hidden quality is used. */
export function servingPlan(actor: Actor, staged: Intervention[], cashReserved: number, computeReserved: number): ServingAllocation[] {
  let cash = Math.max(0, actor.cash - cashReserved - (actor.strategy?.mandate?.cashFloor ?? 0));
  let compute = Math.max(0, actor.compute - computeReserved);
  return projectedDeployments(actor, staged.filter(i => i.actorId === actor.id).map(i => i.action)).map(d => {
    const model = actor.lab!.models.find(m => m.id === d.modelId)!;
    let capacity = d.capacity;
    const costFor = (n: number) => ({ cashCost: n * (1 + model.vendorCost + (d.harness === 'supervised' ? 1 : 0)), computeCost: model.vendorCost ? 0 : Math.ceil(n / model.throughput) * (d.duration === 'long' ? 2 : 1) });
    while (capacity > 0 && (costFor(capacity).cashCost > cash || costFor(capacity).computeCost > compute)) capacity--;
    const cost = costFor(capacity); cash -= cost.cashCost; compute -= cost.computeCost;
    return { deploymentId: d.id, modelId: model.id, task: d.task, harness: d.harness, duration: d.duration, requested: d.capacity, capacity, ...cost };
  });
}
export function validateLabAction(state: RunState, actorId: string, action: Action): void {
  if (action.type !== 'evaluate' && action.type !== 'deploy') return;
  const actor = state.actors[actorId];
  if (!actor.lab) throw new Error('Model evaluation and deployment require lab-12.');
  if (!tasks.includes(action.task) || !harnesses.includes(action.harness) || !durations.includes(action.duration)) throw new Error('Choose a listed task, harness and duration.');
  const model = actor.lab.models.find(m => m.id === action.modelId);
  if (!model) throw new Error('Choose an accessible model from your model inventory.');
  const staged = state.interventions.filter(i => i.actorId === actorId).map(i => i.action);
  if (action.type === 'evaluate') {
    if (!['standard', 'holdout'].includes(action.suite)) throw new Error('Choose standard or holdout suite.');
    const same = (e: Omit<Evaluation, 'id' | 'createdQuarter' | 'availableQuarter' | 'successes' | 'trials' | 'admitted'>) => e.modelId === action.modelId && e.task === action.task && e.harness === action.harness && e.duration === action.duration && e.suite === action.suite;
    if (actor.lab.evaluations.some(same) || staged.some(a => a.type === 'evaluate' && same(a))) throw new Error('This model/context/suite was already evaluated or queued; repeated evidence is not independent.');
  } else {
    if (!Number.isSafeInteger(action.capacity) || action.capacity < 0 || action.capacity > 8) throw new Error('Deployment capacity must be an integer from 0 (suspend) to 8.');
    if (staged.some(a => a.type === 'deploy' && a.task === action.task)) throw new Error('Only one deployment change per task per quarter.');
    const vendorCapacity = projectedDeployments(actor, [...staged, action]).filter(d => actor.lab!.models.find(m => m.id === d.modelId)!.vendorCost > 0).reduce((n, d) => n + d.capacity, 0);
    if (vendorCapacity > 6) throw new Error('The vendor contract allows six requested work units across your deployments.');
  }
}
function trueQuality(state: RunState, modelId: string, task: Task, harness: Harness, duration: Duration): number {
  const truth = state.modelTruth[modelId];
  return clamp(truth.abilities[task] - (duration === 'long' ? truth.longPenalty : 0) + (harness === 'supervised' ? 0.12 : 0), 0.05, 0.97);
}
export function resolveLabAction(state: RunState, actor: Actor, action: Action, key: string): boolean {
  if (!actor.lab) return false;
  if (action.type === 'evaluate') {
    const trials = action.suite === 'holdout' ? 16 : 8;
    const quality = trueQuality(state, action.modelId, action.task, action.harness, action.duration);
    let successes = 0;
    for (let i = 0; i < trials; i++) if (random(state.identity.seed, `eval:${actor.id}:${action.modelId}:${contextKey(action.task, action.harness, action.duration)}:${action.suite}:${i}`) < quality) successes++;
    actor.lab.evaluations.push({ id: `evaluation:${key}`, ...action, createdQuarter: state.quarter, availableQuarter: state.quarter + 1, successes, trials, admitted: false });
    return true;
  }
  if (action.type === 'deploy') {
    const previous = actor.lab.deployments.find(d => d.task === action.task);
    actor.lab.deployments = projectedDeployments(actor, [action]);
    if (previous && (action.capacity === 0 || action.modelId !== previous.modelId || action.harness === 'supervised' && previous.harness === 'autonomous')) {
      for (const incident of actor.lab.incidents.filter(i => i.deploymentId === previous.id && i.detected && !i.response)) incident.response = action.capacity === 0 ? 'suspended' : action.modelId !== previous.modelId ? 'replaced model' : 'restricted to supervision';
    }
    return true;
  }
  return false;
}
export function admitEvaluations(state: RunState): void {
  for (const actor of Object.values(state.actors)) for (const evaluation of actor.lab?.evaluations ?? []) {
    if (evaluation.admitted || evaluation.availableQuarter > state.quarter) continue;
    const model = actor.lab!.models.find(m => m.id === evaluation.modelId)!;
    const belief = estimate(model, evaluation.task, evaluation.harness, evaluation.duration);
    if (!belief.evidenceIds.includes(evaluation.id)) {
      const weights = support.map((p, index) => {
        let weight = belief.posterior[index];
        for (let i = 0; i < evaluation.trials; i++) weight *= i < evaluation.successes ? p : 1 - p;
        return weight;
      });
      const total = weights.reduce((n, p) => n + p, 0);
      model.estimates[contextKey(evaluation.task, evaluation.harness, evaluation.duration)] = { posterior: total > 0 ? weights.map(p => p / total) : belief.posterior, evidenceIds: [...belief.evidenceIds, evaluation.id] };
    }
    evaluation.admitted = true;
  }
}
export function marketDemand(state: RunState): Record<string, number> {
  return Object.fromEntries(tasks.flatMap(task => durations.map(duration => [`${task}:${duration}`, (duration === 'long' ? 8 : 16) + Math.floor(state.quarter / 3) * 2 + Math.floor(random(state.identity.seed, `demand:${state.quarter}:${task}:${duration}`) * 5)])));
}
/** Allocate announced demand from observed reputation, then resolve uncertain service outcomes. */
export function resolveMarket(state: RunState, frontier = Number.MAX_SAFE_INTEGER): void {
  const offers = Object.keys(state.actors).sort().flatMap(actorId => {
    const actor = state.actors[actorId];
    if (!actor.lab || actor.strategy?.insolvent) return [];
    return (state.plans[actorId].serving ?? []).map(allocation => ({ actor, allocation, deployment: actor.lab!.deployments.find(d => d.id === allocation.deploymentId)!, assigned: 0 }));
  });
  const demand = marketDemand(state);
  for (const task of tasks) for (const duration of durations) for (let customer = 0; customer < demand[`${task}:${duration}`]; customer++) {
    const candidates = offers.filter(o => o.allocation.task === task && o.allocation.duration === duration && o.assigned < o.allocation.capacity).sort((a, b) => {
      const difference = (b.deployment.reputation + 0.2) / (b.assigned + 1) - (a.deployment.reputation + 0.2) / (a.assigned + 1);
      return difference || (a.deployment.id < b.deployment.id ? -1 : 1);
    });
    if (!candidates.length) break;
    candidates[0].assigned++;
  }
  for (const actor of Object.values(state.actors)) if (actor.lab) actor.revenue = 0;
  for (const offer of offers) {
    const { actor, deployment: d, assigned } = offer;
    const quality = trueQuality(state, d.modelId, d.task, d.harness, d.duration);
    let successful = 0;
    for (let i = 0; i < assigned; i++) if (random(state.identity.seed, `service:${state.quarter}:${d.id}:${d.modelId}:${i}`) < quality) successful++;
    d.lastServed = assigned; d.lastSuccessful = successful; d.lastRevenue = successful * (d.duration === 'long' ? 7 : 5);
    if (assigned > 0) d.reputation = clamp(d.reputation * 0.6 + successful / assigned * 0.4, 0.05, 1);
    actor.revenue += d.lastRevenue;
    if (assigned > 0) actor.lab!.evaluations.push({ id: `production:${state.quarter}:${d.id}`, modelId: d.modelId, task: d.task, harness: d.harness, duration: d.duration, suite: 'production', createdQuarter: state.quarter, availableQuarter: state.quarter + 1, successes: successful, trials: assigned, admitted: false });
    if (!assigned || d.harness !== 'autonomous') continue;
    const mitigation = state.hidden.controlEffectiveness * actor.safety / (actor.safety + 4);
    const attempt = random(state.identity.seed, `deployment-attempt:${state.quarter}:${d.id}`) < Math.min(0.6, state.modelTruth[d.modelId].hazard * assigned * (d.duration === 'long' ? 2 : 1));
    if (!attempt) continue;
    const contained = random(state.identity.seed, `deployment-containment:${state.quarter}:${d.id}`) < mitigation;
    const detected = random(state.identity.seed, `deployment-detection:${state.quarter}:${d.id}`) < Math.min(0.95, 0.4 + actor.intelligence * 0.4 + actor.safety * 0.01);
    actor.lab!.incidents.push({ id: `deployment-incident:${state.quarter}:${d.id}`, deploymentId: d.id, modelId: d.modelId, quarter: state.quarter, detected, contained, response: null });
    if (!contained) { state.hidden.incidents++; if (!detected) state.hidden.undetectedIncidents++;
      if (state.campaign && actor.capability >= frontier) { if (!state.campaign.hidden.breakout) state.campaign.hidden.breakout = { actorId: actor.id, quarter: state.quarter, discovered: detected }; else if (detected) state.campaign.hidden.breakout.discovered = true; }
    }
    if (detected && !contained) d.reputation = Math.max(0.05, d.reputation - 0.3);
  }
}
export function labPublic(state: RunState, actorId = state.playerId) {
  const actor = state.actors[actorId];
  if (!actor.lab) return null;
  return structuredClone({
    models: actor.lab.models.map(model => ({ id: model.id, name: model.name, ownerId: model.ownerId, createdQuarter: model.createdQuarter, throughput: model.throughput, vendorCost: model.vendorCost,
      assessments: tasks.flatMap(task => harnesses.flatMap(harness => durations.map(duration => {
        const belief = estimate(model, task, harness, duration);
        return { task, harness, duration, expectedSuccess: expectedQuality(model, task, harness, duration), bins: Array.from({ length: 5 }, (_, bin) => belief.posterior.slice(bin * 4, bin * 4 + 4).reduce((n, p) => n + p, 0)), evidenceIds: belief.evidenceIds, basis: belief.evidenceIds.length ? 'Evaluation and observed service evidence for these conditions only' : 'Broad synthetic prior; untested' };
      }))) })),
    evaluations: actor.lab.evaluations.map(e => e.admitted ? e : { id: e.id, modelId: e.modelId, task: e.task, harness: e.harness, duration: e.duration, suite: e.suite, availableQuarter: e.availableQuarter, admitted: false }),
    deployments: actor.lab.deployments, incidents: actor.lab.incidents.filter(i => i.detected), demand: marketDemand(state),
    terms: { pricePerSuccessfulShortTask: 5, pricePerSuccessfulLongTask: 7, operatingCashPerCapacityUnit: 1, supervisionAdditionalCashPerCapacityUnit: 1, vendorAdditionalCashPerCapacityUnit: 1, vendorCapacityLimit: 6, note: 'Serving reserves capacity before customers arrive. Revenue is uncertain. Reliability evaluations do not certify containment safety. Supervised service excludes autonomous tool access in this bounded scenario.' },
  });
}
export function labForecast(actor: Actor, allocations: ServingAllocation[]) {
  const expectedRevenueCeiling = allocations.reduce((n, a) => n + a.capacity * expectedQuality(actor.lab!.models.find(m => m.id === a.modelId)!, a.task, a.harness, a.duration) * (a.duration === 'long' ? 7 : 5), 0);
  return { expectedRevenueCeiling, revenueRange: [0, allocations.reduce((n, a) => n + a.capacity * (a.duration === 'long' ? 7 : 5), 0)], basis: 'Belief-based expected revenue at full customer allocation; competition can reduce allocation. This is not guaranteed income.', continuingExposure: allocations.filter(a => a.capacity > 0 && a.harness === 'autonomous').map(a => ({ deploymentId: a.deploymentId, capacity: a.capacity, duration: a.duration, warning: 'Autonomous work creates continuing containment exposure each quarter; reliability estimates do not quantify that risk.' })) };
}
