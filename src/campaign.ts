import type { Action, Actor, Asset, BeliefState, CampaignState, Ending, Evidence, Grid, RunState, Scenario, WildcardRuling } from './types.js';
import { clamp, hash, random } from './numeric.js';
import { effectiveMean, mean, recomputeBelief } from './beliefs.js';
import { validateLabAction } from './lab.js';
import { rankOptions, scoreOption, type PolicyOption } from './policy.js';

export const strategicTopics = ['racing', 'capability', 'safety', 'credibility'] as const;
export function gridFor(scenario: Scenario, topic: Grid['id']): Grid { return { ...scenario.grid, id: topic, label: topic, prior: topic === 'control' ? scenario.grid.prior : scenario.campaign!.strategicPrior }; }
export function prior(scenario: Scenario, topic: Grid['id'] = 'control'): BeliefState { const distribution = gridFor(scenario, topic).prior; return { prior: [...distribution], posterior: [...distribution], evidenceIds: [], override: null, diagnostics: [] }; }
export function initializeCampaign(state: RunState, scenario: Scenario): void {
  if (!scenario.campaign) return;
  for (const actor of Object.values(state.actors)) {
    actor.strategy = { assets: [], obligations: [], beliefs: {}, insolvent: false, parentBudget: 80, racingPressure: 0.525, expectedRivalCapability: 21, expectedRivalSafety: 10.5, pledgeUntil: -1, lastLaunchCapability: -1, launches: 0 };
    for (const id of Object.keys(state.actors).sort()) if (id !== actor.id) for (const topic of strategicTopics) actor.strategy.beliefs[`${id}:${topic}`] = prior(scenario, topic);
  }
  state.campaign = {
    governments: (['us', 'china'] as const).map((id, index) => ({ id, name: id === 'us' ? 'United States Council' : 'China Council', budget: 24, monitoring: 0, stance: 'growth',
      policy: { ...structuredClone(state.actors[scenario.actors[index].id]), id: `government-${id}`, weights: { revenue: 1, capability: 0.3, safety: 2, mission: 1.8 } } })),
    proposals: [], wildcardUsed: false, claims: [], trust: {}, monitoring: [],
    treaty: { establishedQuarter: null, members: [], quietQuarters: 0, defections: [] },
    verification: { establishedQuarter: null, coverage: 0, invalidatedBy: null }, pendingEffects: [],
    hidden: { rumorPropensity: scenario.campaign.rumorPropensities[Math.floor(random(state.identity.seed, 'rumor-propensity') * scenario.campaign.rumorPropensities.length)], breakout: null },
  };
}
export function addObservation(state: RunState, input: Omit<Evidence, 'id' | 'processed' | 'status'>): void {
  if (state.evidence.some(e => e.observerId === input.observerId && e.independentKey === input.independentKey)) return;
  state.evidence.push({ ...input, id: `evidence:${hash([input.observerId, input.independentKey])}`, processed: false, status: input.detected ? 'pending' : 'undetected' });
}
export function strategicEvidence(state: RunState, scenario: Scenario, observerId: string, sourceId: string, targetId: string, topic: Grid['id'], value: number, key: string, summary: string, visibility: Evidence['visibility'], detected: boolean, ambiguity = 0.35, credibility = 0.75, activity?: Evidence['activity']): void {
  addObservation(state, { independentKey: key, quarter: state.quarter, availableQuarter: state.quarter + 1, observerId, sourceId, targetId, topic, summary,
    likelihood: scenario.grid.support.map(point => 0.05 + clamp(1 - Math.abs(point - value), 0, 1)), credibility, ambiguity,
    receptivity: state.actors[observerId].receptivity, visibility, detected, flagged: topic !== 'credibility', ...(activity ? { activity } : {}) });
}
export function updateStrategicBeliefs(state: RunState, scenario: Scenario, actor: Actor): void {
  if (!actor.strategy) return;
  const relevant = state.evidence.filter(e => e.observerId === actor.id);
  for (const key of Object.keys(actor.strategy.beliefs).sort()) {
    const split = key.lastIndexOf(':'); const targetId = key.slice(0, split); const topic = key.slice(split + 1) as Grid['id'];
    const belief = actor.strategy.beliefs[key];
    if (belief.override && state.quarter >= belief.override.expiresQuarter) belief.override = null;
    actor.strategy.beliefs[key] = recomputeBelief(gridFor(scenario, topic), belief, relevant.filter(e => e.targetId === targetId));
  }
  const expected = (topic: Grid['id']) => {
    let total = 0; let count = 0;
    for (const key of Object.keys(actor.strategy!.beliefs).sort()) if (key.endsWith(`:${topic}`)) { total += effectiveMean(gridFor(scenario, topic), actor.strategy!.beliefs[key], state.quarter); count++; }
    return count ? total / count : 0.525;
  };
  actor.strategy.racingPressure = expected('racing'); actor.strategy.expectedRivalCapability = expected('capability') * 40; actor.strategy.expectedRivalSafety = expected('safety') * 20;
}
export function visibilityOf(action: Action): Evidence['visibility'] {
  if (action.type === 'wildcard') return action.ruling.visibility;
  if (action.type === 'ship' || action.type === 'deploy' || action.type === 'fund' || action.type === 'announce') return 'public';
  if (action.type === 'build' || action.type === 'train' && action.scale === 'large') return 'physical';
  return 'covert';
}
export function detectionProbability(action: Action, intelligence: number, multiplier = 1): number {
  if (action.type === 'investigate' || action.type === 'evaluate') return 0;
  const visibility = visibilityOf(action);
  const concealment = 'concealment' in action ? action.concealment ?? 0 : 0;
  return visibility === 'public' ? 1 : clamp((visibility === 'physical' ? 0.35 + intelligence * 0.4 : 0.08 + intelligence * 0.2) * (1 - concealment * 0.3) * multiplier, 0, 1);
}
export function campaignSignal(state: RunState, scenario: Scenario, actor: Actor, action: Action, key: string): void {
  if (!state.campaign || action.type === 'investigate' || action.type === 'evaluate' || action.type === 'announce') return;
  const visibility = visibilityOf(action);
  for (const observerId of Object.keys(state.actors).sort()) {
    if (observerId === actor.id) continue;
    const detected = random(state.identity.seed, `${key}:detect:${observerId}`) < detectionProbability(action, state.actors[observerId].intelligence, scenario.campaign!.detectionMultiplier);
    const topic = action.type === 'secure' ? 'safety' : action.type === 'ship' ? 'capability' : 'racing';
    const value = topic === 'safety' ? clamp(actor.safety / 20, 0, 1) : topic === 'capability' ? clamp(actor.capability / 40, 0, 1) : action.type === 'train' ? 0.95 : 0.65;
    strategicEvidence(state, scenario, observerId, actor.id, actor.id, topic, value, key, `${actor.name}: ${visibility === 'public' ? 'public' : 'possible'} ${action.type} activity.`, visibility, detected, 0.35, 0.75, action.type);
    if (action.type === 'train') strategicEvidence(state, scenario, observerId, actor.id, actor.id, 'capability', clamp((actor.capability + 4) / 40, 0, 1), `${key}:capability`, `${actor.name}: training signal suggests increased capability.`, visibility, detected, 0.6);
  }
}
export function validateCampaignAction(state: RunState, scenario: Scenario, actorId: string, action: Action): void {
  validateLabAction(state, actorId, action);
  if (scenario.lab && action.type === 'ship') throw new Error('In lab-12, use deploy with a model, task, harness, duration and capacity.');
  if (!scenario.campaign || !state.campaign) {
    if (['build', 'fund', 'announce', 'wildcard'].includes(action.type) || 'concealment' in action && action.concealment || action.type === 'investigate' && action.topic !== 'control') throw new Error('This action requires the full-28 scenario.');
    return;
  }
  const actor = state.actors[actorId];
  if (actor.strategy?.insolvent) throw new Error('An insolvent company cannot commit new work.');
  if ('concealment' in action && action.concealment !== undefined && ![0, 1, 2].includes(action.concealment)) throw new Error('Concealment must be 0, 1 or 2.');
  if (action.type === 'build') {
    const region = scenario.campaign.regions.find(r => r.id === action.regionId);
    if (!region) throw new Error('Choose a listed region ID.');
    const capacity = action.scale === 'large' ? 8 : 4;
    // Regional power quota is per company; rival private reservations cannot leak through feasibility errors.
    const used = (actor.strategy?.assets ?? []).filter(a => a.regionId === region.id).reduce((n, a) => n + a.capacity, 0)
      + state.projects.filter(p => p.actorId === actorId && p.kind === 'build' && p.asset.regionId === region.id).reduce((n, p) => n + (p.kind === 'build' ? p.asset.capacity : 0), 0)
      + state.interventions.filter(i => i.actorId === actorId && i.action.type === 'build' && i.action.regionId === region.id).reduce((n, i) => n + (i.action.type === 'build' && i.action.scale === 'large' ? 8 : 4), 0);
    if (used + capacity > region.power) throw new Error('Build exceeds this company’s regional power allocation.');
  }
  if (action.type === 'fund') {
    if (action.source === 'parent') {
      const reserved = state.interventions.filter(i => i.actorId === actorId && i.action.type === 'fund' && i.action.source === 'parent').reduce((n, i) => n + (i.action.type === 'fund' ? i.action.amount : 0), 0);
      if (reserved + action.amount > actor.strategy!.parentBudget) throw new Error('Parent funding budget is exhausted.');
    }
    const priorBorrowing = actor.strategy!.obligations.length + state.interventions.filter(i => i.actorId === actorId && i.action.type === 'fund').length;
    if (priorBorrowing >= 4) throw new Error('Maximum four outstanding funding obligations.');
  }
  if (action.type === 'announce' && !state.actors[action.targetId]) throw new Error('Announcement requires a company target.');
  if (action.type === 'announce' && action.claim === 'slowdown' && action.targetId !== actorId) throw new Error('Only self-targeted slowdown commitments are binding.');
  if (action.type === 'investigate' && action.topic !== 'control' && (!action.targetId || !state.actors[action.targetId] || action.targetId === actorId)) throw new Error('Strategic investigations require a rival target.');
}
export function assetFor(scenario: Scenario, action: Extract<Action, { type: 'build' }>, id: string, quarter: number, state?: RunState): Asset {
  const region = scenario.campaign!.regions.find(r => r.id === action.regionId)!;
  return { id, regionId: region.id, capacity: action.scale === 'large' ? 8 : 4,
    upkeep: region.upkeep * (action.scale === 'large' ? 2 : 1), power: action.power, layout: action.layout,
    availableQuarter: quarter + region.delay + (state?.campaign?.governments.find(g => g.id === region.jurisdiction)?.stance === 'verify' ? 1 : 0) + (action.power === 'clean' ? 1 : 0) + (action.layout === 'distributed' ? 1 : 0), expiresQuarter: null };
}
export function validateRuling(ruling: WildcardRuling): void {
  if (!ruling || Object.keys(ruling).sort().join(',') !== 'amount,delay,duration,effect,price,upkeep,visibility') throw new Error('Ruling must contain exactly effect, amount, price, delay, duration, upkeep and visibility.');
  if (!['capacity', 'cash', 'safety'].includes(ruling.effect) || !['public', 'physical', 'covert'].includes(ruling.visibility)) throw new Error('Unsupported typed wildcard effect or visibility.');
  for (const field of ['amount', 'price', 'delay', 'upkeep'] as const) if (!Number.isSafeInteger(ruling[field]) || ruling[field] < 0) throw new Error('Ruling quantities must be nonnegative safe integers.');
  if (ruling.amount < 1 || ruling.amount > (ruling.effect === 'cash' ? 40 : 8) || ruling.price > 100 || ruling.upkeep > 10 || ruling.delay > 4) throw new Error('Ruling exceeds local effect bounds.');
  if (ruling.duration !== null && (!Number.isInteger(ruling.duration) || ruling.duration < 1 || ruling.duration > 28)) throw new Error('Duration must be null (permanent) or 1–28 quarters.');
  if (ruling.effect !== 'capacity' && (ruling.duration !== null || ruling.upkeep !== 0)) throw new Error('Only capacity rulings support duration or upkeep.');
  if (ruling.price < ruling.amount * (ruling.effect === 'cash' ? 1 : 3)) throw new Error('Price is below the bounded local ruling floor.');
}
function applyEffect(state: RunState, actorId: string, ruling: WildcardRuling, id: string): void {
  const actor = state.actors[actorId];
  if (ruling.effect === 'cash') actor.cash += ruling.amount;
  else if (ruling.effect === 'safety') actor.safety += ruling.amount;
  else {
    actor.strategy!.assets.push({ id, regionId: 'local-purchase', capacity: ruling.amount, upkeep: ruling.upkeep, power: 'grid', layout: 'distributed', availableQuarter: state.quarter, expiresQuarter: ruling.duration === null ? null : state.quarter + ruling.duration });
  }
}
export function campaignOpening(state: RunState, scenario: Scenario): void {
  if (!state.campaign) return;
  for (const actor of Object.values(state.actors)) {
    actor.strategy!.assets = actor.strategy!.assets.filter(a => a.expiresQuarter === null || a.expiresQuarter > state.quarter);
    actor.strategy!.obligations = actor.strategy!.obligations.filter(o => o.endQuarter > state.quarter);
  }
  const ready = state.campaign.pendingEffects.filter(e => e.availableQuarter <= state.quarter);
  state.campaign.pendingEffects = state.campaign.pendingEffects.filter(e => e.availableQuarter > state.quarter);
  for (const effect of ready) applyEffect(state, effect.actorId, effect.ruling, effect.id);
}
export function operatingCost(actor: Actor, quarter: number): number {
  let cost = 0;
  for (const asset of actor.strategy?.assets ?? []) if (asset.availableQuarter <= quarter && (asset.expiresQuarter === null || asset.expiresQuarter > quarter)) cost += asset.upkeep;
  for (const obligation of actor.strategy?.obligations ?? []) if (obligation.startQuarter <= quarter && obligation.endQuarter > quarter) cost += obligation.payment;
  return cost;
}
export function computeCapacity(state: RunState, scenario: Scenario, actor: Actor): number {
  if (actor.strategy?.insolvent) return 0;
  let capacity = scenario.openingCompute + (state.quarter > 0 && actor.lastRoutine === 'lease' ? 4 : 0);
  for (const asset of actor.strategy?.assets ?? []) {
    const region = scenario.campaign?.regions.find(r => r.id === asset.regionId);
    const hazard = (region?.hazard ?? 0) * (asset.power === 'clean' ? 0.5 : 1) * (asset.layout === 'distributed' ? 0.5 : 1);
    const outage = random(state.identity.seed, `outage:${state.quarter}:${actor.id}:${asset.id}`) < hazard;
    capacity += outage ? Math.floor(asset.capacity / 2) : asset.capacity;
  }
  return capacity;
}
export function resolveCampaignAction(state: RunState, scenario: Scenario, actor: Actor, action: Action, key: string): boolean {
  const campaign = state.campaign;
  if (!campaign) return false;
  if (action.type === 'build') {
    const asset = assetFor(scenario, action, key, state.quarter, state);
    state.projects.push({ id: `project:${key}`, actorId: actor.id, kind: 'build', createdQuarter: state.quarter, remaining: asset.availableQuarter - state.quarter, asset });
  } else if (action.type === 'fund') {
    actor.cash += action.amount;
    if (action.source === 'parent') actor.strategy!.parentBudget -= action.amount;
    actor.strategy!.obligations.push({ id: key, source: action.source, payment: action.source === 'external' ? action.amount / 10 + 1 : action.amount / 20, startQuarter: state.quarter + 1, endQuarter: state.quarter + 9 });
    actor.influence = Math.max(0, actor.influence - (action.source === 'external' ? 2 : 1));
  } else if (action.type === 'wildcard') {
    if (action.ruling.delay === 0) applyEffect(state, actor.id, action.ruling, key);
    else campaign.pendingEffects.push({ id: key, actorId: actor.id, ruling: action.ruling, availableQuarter: state.quarter + action.ruling.delay });
  } else if (action.type === 'announce') {
    const claimKey = `${actor.id}:${action.targetId}:${action.claim}:${action.value}`;
    // Repetition of the same claim is one evidence source throughout the run.
    if (!campaign.claims.some(c => `${c.speakerId}:${c.targetId}:${c.claim}:${c.value}` === claimKey)) {
      const claim = { id: key, speakerId: actor.id, targetId: action.targetId, claim: action.claim, value: action.value, quarter: state.quarter, settlesQuarter: state.quarter + 2, settled: false };
      campaign.claims.push(claim);
      for (const observerId of Object.keys(state.actors).sort()) if (observerId !== actor.id) {
        const trust = campaign.trust[`${observerId}:${actor.id}`] ?? 0.5;
        strategicEvidence(state, scenario, observerId, actor.id, action.targetId, action.claim === 'safety' ? 'safety' : 'racing', action.claim === 'slowdown' ? (action.value ? 0.05 : 0.95) : (action.value ? 0.95 : 0.05), `claim:${claimKey}`, `${actor.name} claims ${action.claim}=${action.value} about ${state.actors[action.targetId].name}.`, 'public', true, 0.3, trust);
      }
    }
    if (action.claim === 'slowdown') {
      const recorded = campaign.claims.find(c => `${c.speakerId}:${c.targetId}:${c.claim}:${c.value}` === claimKey)!;
      if (action.value) { recorded.terms ??= []; recorded.terms.push({ startQuarter: state.quarter, endQuarter: state.quarter + 4 }); recorded.settled = false; }
      if (!action.value && actor.strategy!.pledgeUntil > state.quarter && campaign.treaty.members.includes(actor.id) && !campaign.treaty.defections.some(d => d.actorId === actor.id)) campaign.treaty.defections.push({ actorId: actor.id, quarter: state.quarter, startCapability: actor.capability, consequential: false });
      actor.strategy!.pledgeUntil = action.value ? state.quarter + 4 : -1;
    }
  } else if (action.type === 'investigate' && action.topic !== 'control') {
    const target = state.actors[action.targetId!];
    const value = action.topic === 'capability' ? clamp(target.capability / 40, 0, 1) : action.topic === 'safety' ? clamp(target.safety / 20, 0, 1) : action.topic === 'credibility' ? campaign.trust[`${actor.id}:${target.id}`] ?? 0.5 : (target.strategy!.pledgeUntil > state.quarter ? 0.1 : 0.9);
    strategicEvidence(state, scenario, actor.id, target.id, target.id, action.topic, clamp(value + (random(state.identity.seed, `${key}:study`) - 0.5) * 0.3, 0, 1), key, `Investigation of ${target.name}: ${action.topic} assessment.`, 'covert', true, 0.15, 0.9);
    campaign.monitoring.push({ observerId: actor.id, targetId: target.id, quarter: state.quarter + 1 });
  } else return false;
  return true;
}
export function launchGain(actor: Actor, scenario: Scenario, action: Extract<Action, { type: 'ship' }>): number {
  const base = action.model === 'own' ? 3 + Math.floor(actor.capability / 3) : 3;
  if (!scenario.campaign || !actor.strategy) return base;
  const innovation = action.model === 'own' ? Math.max(0, actor.capability - actor.strategy.lastLaunchCapability) : actor.strategy.launches === 0 ? 3 : 1;
  return Math.max(0, Math.min(base, innovation, scenario.campaign.marketCap - actor.revenue));
}
export function registerTraining(state: RunState, scenario: Scenario, actor: Actor, action: Extract<Action, { type: 'train' }>): void {
  if (!state.campaign) return;
  const treaty = state.campaign.treaty;
  if (treaty.establishedQuarter !== null && treaty.members.includes(actor.id) && actor.strategy!.pledgeUntil > state.quarter && !treaty.defections.some(d => d.actorId === actor.id)) treaty.defections.push({ actorId: actor.id, quarter: state.quarter, startCapability: actor.capability, consequential: false });
}
export function completeParadigm(state: RunState, actorId: string, createdQuarter: number): void {
  const verification = state.campaign?.verification;
  if (verification && verification.establishedQuarter !== null && verification.establishedQuarter <= createdQuarter) {
    verification.coverage = 0; verification.invalidatedBy = actorId;
  }
}
export function campaignQuarterEnd(state: RunState, scenario: Scenario): void {
  const c = state.campaign; const config = scenario.campaign;
  if (!c || !config) return;
  const ids = Object.keys(state.actors).sort();
  for (const observerId of ids) {
    // Exactly one independent rumor opportunity per observer-quarter, regardless of hidden actions.
    if (random(state.identity.seed, `rumor:${observerId}:${state.quarter}`) < c.hidden.rumorPropensity) {
      const candidates = ids.filter(id => id !== observerId); const target = candidates[Math.floor(random(state.identity.seed, `rumor-target:${observerId}:${state.quarter}`) * candidates.length)];
      strategicEvidence(state, scenario, observerId, 'rumor', target, 'racing', 0.95, `rumor:${state.quarter}`, `Uncorroborated rumor of racing at ${state.actors[target].name}.`, 'covert', true, 0.85, 0.3);
    }
  }
  for (const opportunity of c.monitoring.filter(m => m.quarter === state.quarter)) {
    const detectedTraining = state.evidence.some(e => e.observerId === opportunity.observerId && e.targetId === opportunity.targetId && e.quarter === state.quarter && e.detected && e.activity === 'train');
    if (!detectedTraining) strategicEvidence(state, scenario, opportunity.observerId, opportunity.targetId, opportunity.targetId, 'racing', 0.1, `absence:${state.quarter}:${opportunity.targetId}`, `Scheduled monitoring of ${state.actors[opportunity.targetId].name} found no training signal; covert activity may have been missed.`, 'covert', true, 0.75, 0.8, 'monitored-absence');
  }
  for (const claim of c.claims.filter(claim => !claim.settled && claim.settlesQuarter <= state.quarter)) {
    const terms = claim.terms ?? [{ startQuarter: claim.quarter, endQuarter: claim.quarter + 4 }];
    claim.settled = claim.claim !== 'slowdown' || terms.every(t => state.quarter >= t.endQuarter - 1);
    for (const observerId of ids.filter(id => id !== claim.speakerId)) {
      const evidence = state.evidence.filter(e => e.observerId === observerId && e.targetId === claim.targetId && e.detected && e.quarter >= claim.quarter && (claim.claim !== 'slowdown' || terms.some(t => e.quarter >= t.startQuarter && e.quarter < t.endQuarter)) && e.sourceId !== 'rumor' && !e.independentKey.startsWith('claim:'));
      const supporting = evidence.filter(e => claim.claim === 'slowdown' ? e.topic === 'racing' && (e.activity === 'train' || e.activity === 'monitored-absence') : claim.claim === 'safety' ? e.topic === 'safety' : e.topic === 'racing');
      if (!supporting.length) continue;
      const observedHigh = supporting.some(e => e.likelihood[19] > e.likelihood[0]);
      const agrees = claim.claim === 'slowdown' ? observedHigh !== claim.value : observedHigh === claim.value;
      const verdict = agrees ? 'supported' : 'contradicted';
      claim.verdicts ??= {};
      if (claim.verdicts[observerId] === verdict) continue;
      claim.verdicts[observerId] = verdict;
      const trustKey = `${observerId}:${claim.speakerId}`;
      c.trust[trustKey] = clamp((c.trust[trustKey] ?? 0.5) + (agrees ? 0.15 : -0.25), 0.05, 0.95);
      strategicEvidence(state, scenario, observerId, claim.speakerId, claim.speakerId, 'credibility', agrees ? 0.95 : 0.05, `verification:${claim.id}:${verdict}`, `Observed evidence ${agrees ? 'corroborated' : 'contradicted'} ${state.actors[claim.speakerId].name}’s earlier claim.`, 'public', true, 0.2, 0.9);
    }
  }
  for (const government of c.governments) {
    // Governments receive only detected public observations; use the same score/rank machinery.
    const visible = state.evidence.filter(e => e.visibility === 'public' && e.detected && e.topic === 'control');
    government.policy.belief = recomputeBelief(scenario.grid, government.policy.belief, visible.map(e => ({ ...e, processed: true, receptivity: government.policy.receptivity })));
    const concern = 1 - effectiveMean(scenario.grid, government.policy.belief, state.quarter);
    const options: PolicyOption[] = [
      { id: 'growth', cashCost: 0, computeCost: 0, revenue: 2, capability: 1, safety: 0, mission: 0, switchingCost: government.stance === 'growth' ? 0 : 0.8 },
      { id: 'verify', cashCost: 4, computeCost: 0, revenue: 0, capability: 0, safety: concern * 4, mission: concern * 3, switchingCost: government.stance === 'verify' ? 0 : 0.8 },
    ];
    const choice = rankOptions(government.policy, options).find(o => o.cashCost <= government.budget)!;
    government.stance = choice.id as 'growth' | 'verify'; government.budget += 3 - choice.cashCost;
    government.monitoring = clamp(government.monitoring + (choice.id === 'verify' ? 1 : -1), 0, 4);
    if (choice.id === 'verify') for (const observerId of ids) for (const targetId of ids.filter(id => id !== observerId)) c.monitoring.push({ observerId, targetId, quarter: state.quarter + 1 });
    state.traces.push({ id: `government:${government.id}:${state.quarter}`, quarter: state.quarter, actorId: state.playerId, kind: 'visible-government', summary: `${government.name} chose ${choice.id}; public evidence and its objectives yielded score ${scoreOption(government.policy, choice).toFixed(2)}.`, details: { monitoring: government.monitoring } });
  }
  c.monitoring = c.monitoring.filter(m => m.quarter > state.quarter).filter((m, i, all) => all.findIndex(x => x.observerId === m.observerId && x.targetId === m.targetId && x.quarter === m.quarter) === i);
  const members = ids.filter(id => state.actors[id].strategy!.pledgeUntil > state.quarter);
  if (c.treaty.establishedQuarter === null && members.length >= 3 && c.governments.every(g => g.monitoring >= 1)) { c.treaty.establishedQuarter = state.quarter; c.treaty.members = members; }
  if (c.treaty.establishedQuarter !== null) {
    c.treaty.members = [...new Set([...c.treaty.members, ...members])].sort();
    for (const d of c.treaty.defections) if (state.actors[d.actorId].capability >= d.startCapability + 4) d.consequential = true;
    const currentMembers = c.treaty.members.filter(id => state.actors[id].strategy!.pledgeUntil > state.quarter);
    const frontier = Math.max(...Object.values(state.actors).map(a => a.capability));
    const frontierParticipates = Object.values(state.actors).filter(a => a.capability >= frontier - 8).every(a => currentMembers.includes(a.id));
    if (currentMembers.length >= 3 && frontierParticipates && !c.treaty.defections.length) c.treaty.quietQuarters++; else c.treaty.quietQuarters = 0;
  }
  if (c.verification.establishedQuarter === null && c.governments.reduce((n, g) => n + g.monitoring, 0) >= config.verificationThreshold) { c.verification.establishedQuarter = state.quarter; c.verification.coverage = 1; }
  // Undetected breakouts are eventually discovered through a separate observation pathway.
  if (c.hidden.breakout && state.quarter >= c.hidden.breakout.quarter + 2) c.hidden.breakout.discovered = true;
}
export function endingCandidates(state: RunState, scenario: Scenario): Ending[] {
  const c = state.campaign, config = scenario.campaign;
  if (!c || !config) return [];
  const player = state.actors[state.playerId]; const others = Object.values(state.actors).filter(a => a.id !== player.id);
  const leader = [...Object.values(state.actors)].sort((a, b) => b.capability - a.capability || (a.id < b.id ? -1 : 1))[0];
  const gap = player.capability - Math.max(...others.map(a => a.capability));
  const horizon = state.quarter + 1 >= scenario.horizon;
  const conditions: Record<Ending, boolean> = {
    'loss-of-control': !!c.hidden.breakout && (c.hidden.breakout.discovered || horizon),
    'failed-slowdown': c.treaty.establishedQuarter !== null && c.treaty.defections.some(d => d.consequential),
    'verification-broken': c.verification.establishedQuarter !== null && c.verification.invalidatedBy !== null && c.verification.coverage === 0,
    'coordinated-slowdown': c.treaty.quietQuarters >= config.slowdownQuarters && Object.values(state.actors).filter(a => a.capability >= leader.capability - 8).every(a => c.treaty.members.includes(a.id) && a.strategy!.pledgeUntil > state.quarter),
    'safe-lead': horizon && gap >= 0 && player.capability >= config.frontier && player.safety >= config.safeSafety && !c.hidden.breakout && mean(scenario.grid, player.belief.posterior) >= 0.65,
    'winner-takes-all': horizon && leader.capability >= config.frontier && leader.capability - Math.max(...Object.values(state.actors).filter(a => a.id !== leader.id).map(a => a.capability)) >= config.dominanceGap,
    'left-behind': horizon && gap <= -config.dominanceGap || player.cash < nextOpeningCost(state, scenario, player),
    'multipolar-balance': horizon,
  };
  return config.precedence.filter(ending => conditions[ending]);
}
export function campaignPublic(state: RunState, scenario: Scenario) {
  const c = state.campaign;
  if (!c) return null;
  const actor = state.actors[state.playerId];
  return structuredClone({ regions: scenario.campaign!.regions, assets: actor.strategy!.assets, insolvent: actor.strategy!.insolvent, remainingParentBudget: actor.strategy!.parentBudget, obligations: actor.strategy!.obligations,
    mandate: actor.strategy!.mandate ?? { routine: 'automatic', cashFloor: 0, computeTarget: 6 },
    campaignMode: scenario.business ? 'business: political milestones offer continuation' : 'scored: declared endings conclude the run',
    nextOpeningOperatingCost: nextOpeningCost(state, scenario, actor), governments: c.governments.map(g => ({ id: g.id, name: g.name, budget: g.budget, monitoring: g.monitoring, stance: g.stance })),
    wildcardUsed: c.wildcardUsed, proposals: c.proposals, pendingEffects: c.pendingEffects.filter(e => e.actorId === actor.id),
    treaty: { establishedQuarter: c.treaty.establishedQuarter, members: c.treaty.members },
    verification: c.verification, claims: c.claims.map(({ settled, verdicts, ...claim }) => claim),
    derivedTimeline: { quartersToFrontierAtOneSmallTrainingPerQuarter: Math.max(0, Math.ceil((scenario.campaign!.frontier - actor.capability) / 4)), explanation: 'Conditional capability extrapolation from one reasoning-focused small training per quarter; ignores financing, control, competition and delays beyond one quarter. Not a forecast.' },
    policyBeliefs: { racingPressure: actor.strategy!.racingPressure, expectedRivalCapability: actor.strategy!.expectedRivalCapability, expectedRivalSafety: actor.strategy!.expectedRivalSafety },
  });
}

export function nextOpeningCost(state: RunState, scenario: Scenario, actor: Actor): number {
  let total = scenario.openingCashCost + operatingCost(actor, state.quarter + 1);
  for (const p of state.projects) if (p.actorId === actor.id && p.kind === 'build' && p.remaining <= 1) total += p.asset.upkeep;
  for (const e of state.campaign?.pendingEffects ?? []) if (e.actorId === actor.id && e.availableQuarter === state.quarter + 1 && e.ruling.effect === 'capacity') total += e.ruling.upkeep;
  return total;
}

export function internalLeak(state: RunState, scenario: Scenario, key: string): void {
  if (!state.campaign) return;
  for (const observerId of Object.keys(state.actors).sort()) if (observerId !== state.playerId) {
    // Internal actions create no physical/public signal. This independent leak opportunity is required.
    const leaked = random(state.identity.seed, `internal-leak:${key}:${observerId}`) < 0.04;
    strategicEvidence(state, scenario, observerId, state.playerId, state.playerId, 'racing', 0.5, `leak:${key}`, 'A possible internal management intervention leaked; its strategic meaning is ambiguous.', 'covert', leaked, 0.9, 0.4);
  }
}

export function applyOpeningCosts(state: RunState, scenario: Scenario, actor: Actor): void {
  if (actor.strategy?.insolvent) return;
  const required = scenario.openingCashCost + operatingCost(actor, state.quarter);
  if (actor.strategy && actor.cash < required) {
    actor.strategy.insolvent = true;
    actor.revenue = 0; actor.compute = 0;
    for (const observerId of Object.keys(state.actors).sort()) if (observerId !== actor.id) {
      strategicEvidence(state, scenario, observerId, actor.id, actor.id, 'racing', 0.05, `insolvency:${actor.id}`, `${actor.name} publicly suspended operations after failing to meet obligations.`, 'public', true, 0, 1);
    }
    return;
  }
  actor.cash = Math.max(0, actor.cash - required);
}
