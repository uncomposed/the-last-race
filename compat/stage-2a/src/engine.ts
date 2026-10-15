import type { Action, Actor, Command, CommandResult, Evidence, Intervention, ResponseAction, RunState, Scenario, Trace } from './types.js';
import { canonical, clamp, hash, interpolate, random, integer } from './numeric.js';
import { aggregateBins, effectiveMean, mean, recomputeBelief } from './beliefs.js';
import { getScenario, scenarioHash } from './scenario.js';
import { ENGINE_HASH, NUMERICAL_VERSION } from './identity.js';
import { actionCosts, chooseIntervention, makePlan, trainingBenefits } from './policy.js';

const clone = <T>(value: T): T => JSON.parse(canonical(value)) as T;
function scenarioFor(state: RunState): Scenario { return getScenario(state.identity.scenarioId); }
function trace(state: RunState, actorId: string, kind: string, summary: string, details: Record<string, unknown> = {}): void {
  const ordinal = state.traces.filter(item => item.actorId === actorId && item.kind === kind).length;
  state.traces.push({ id: `trace:${hash([actorId, kind, ordinal])}`, quarter: state.quarter, actorId, kind, summary, details });
}
function refreshPlan(state: RunState, actorId: string, scenario: Scenario): void {
  state.plans[actorId] = makePlan(state.actors[actorId], scenario, state.quarter, state.interventions, state.plans[actorId]);
}
function addEvidence(state: RunState, input: Omit<Evidence, 'id' | 'processed' | 'status'>): Evidence {
  const existing = state.evidence.find(item => item.observerId === input.observerId && item.independentKey === input.independentKey);
  if (existing) return existing;
  const item: Evidence = { ...input, id: `evidence:${hash([input.observerId, input.independentKey])}`, processed: false, status: input.detected ? 'pending' : 'undetected' };
  state.evidence.push(item);
  return item;
}
function study(state: RunState, scenario: Scenario, actor: Actor, key: string, availableQuarter: number, opening = false): void {
  const noise = (random(state.identity.seed, `study:${key}:measurement`) - 0.5) * 0.5;
  const measurement = clamp(state.hidden.controlEffectiveness + noise, 0, 1);
  addEvidence(state, { independentKey: key, quarter: state.quarter, availableQuarter, observerId: actor.id, sourceId: actor.id, topic: 'control',
    summary: opening ? 'Opening control audit: a noisy synthetic evaluation of containment effectiveness.' : 'Control study: a noisy synthetic evaluation of containment effectiveness.',
    likelihood: scenario.grid.support.map(support => 0.03 + clamp(1 - Math.abs(support - measurement) / 0.45, 0, 1)),
    credibility: 0.9, ambiguity: 0.2, receptivity: actor.receptivity, visibility: 'covert', detected: true, flagged: true });
}
function admitEvidence(state: RunState, scenario: Scenario): void {
  for (const actorId of Object.keys(state.actors).sort()) {
    const actor = state.actors[actorId];
    for (const item of state.evidence.filter(item => item.observerId === actorId && item.detected && !item.processed && item.availableQuarter <= state.quarter).sort((a, b) => a.id < b.id ? -1 : 1)) {
      item.processed = true;
      item.status = item.receptivity < 0.6 ? 'discounted' : 'noted';
    }
    actor.belief = recomputeBelief(scenario.grid, actor.belief, state.evidence.filter(item => item.observerId === actorId));
  }
}
function openQuarter(state: RunState, scenario: Scenario, first = false): void {
  state.movesUsed = 0;
  state.interventions = [];
  state.plans = {};
  for (const actorId of Object.keys(state.actors).sort()) {
    const actor = state.actors[actorId];
    actor.cash = Math.max(0, actor.cash - scenario.openingCashCost);
    actor.compute = scenario.openingCompute + (actor.lastRoutine === 'lease' && !first ? 4 : 0);
    if (actor.belief.override && state.quarter >= actor.belief.override.expiresQuarter) {
      actor.belief.override = null;
      trace(state, actorId, actorId === state.playerId ? 'visible-belief' : 'private-belief', 'The four-quarter conviction expired; policy now uses the current evidence-based posterior.');
    }
  }
  const projects = [...state.projects].sort((a, b) => a.id < b.id ? -1 : 1);
  state.projects = [];
  for (const project of projects) {
    if (project.createdQuarter < state.quarter) project.remaining -= 1;
    if (project.remaining === 0) {
      state.actors[project.actorId].capability += project.gain;
      if (project.focuses.includes('coding')) state.actors[project.actorId].revenue += 1;
      if (project.focuses.includes('science')) state.actors[project.actorId].safety += 1;
      trace(state, project.actorId, project.actorId === state.playerId ? 'visible-project' : 'private-project', `Training completed: capability increased by ${project.gain}.`, { projectId: project.id, gain: project.gain });
    } else state.projects.push(project);
  }
  const before: Record<string, string> = {};
  const newlyAdmitted: Record<string, Evidence[]> = {};
  for (const actorId of Object.keys(state.actors).sort()) {
    before[actorId] = makePlan(state.actors[actorId], scenario, state.quarter, []).items[0].choice;
    newlyAdmitted[actorId] = state.evidence.filter(item => item.observerId === actorId && item.detected && !item.processed && item.availableQuarter <= state.quarter);
  }
  admitEvidence(state, scenario);
  for (const actorId of Object.keys(state.actors).sort()) {
    refreshPlan(state, actorId, scenario);
    const changed = before[actorId] !== state.plans[actorId].items[0].choice;
    const consequentialIds: string[] = [];
    if (changed) for (const item of newlyAdmitted[actorId]) {
      if (item.likelihood.every(value => value === item.likelihood[0])) continue;
      const counterfactualBelief = recomputeBelief(scenario.grid, state.actors[actorId].belief, state.evidence.filter(observation => observation.observerId === actorId && observation.id !== item.id));
      const counterfactualActor = { ...state.actors[actorId], belief: counterfactualBelief };
      if (makePlan(counterfactualActor, scenario, state.quarter, []).items[0].choice !== state.plans[actorId].items[0].choice) {
        item.status = 'acted-on'; consequentialIds.push(item.id);
      }
    }
    if (newlyAdmitted[actorId].length > 0) trace(state, actorId, actorId === state.playerId ? 'visible-evidence' : 'private-evidence',
      changed ? `The admitted evidence batch changed the routine choice from ${before[actorId]} to ${state.plans[actorId].items[0].choice}; expected benefits overcame inertia. Individual acted-on labels require a leave-one-out choice change.` : `Evidence was interpreted, but the routine choice remained ${before[actorId]}; the policy still uses expected benefits and switching costs${state.actors[actorId].belief.override ? ' under your active conviction' : ''}.`,
      { evidenceIds: newlyAdmitted[actorId].map(item => item.id).sort(), consequentialEvidenceIds: consequentialIds.sort(), reason: state.plans[actorId].items[0].reason });
  }
}

export function createRun(seed: string, scenarioId = 'core-12'): RunState {
  if (typeof seed !== 'string' || seed.length === 0 || seed.length > 200) throw new Error('Seed must be a nonempty string of at most 200 characters.');
  const scenario = getScenario(scenarioId);
  const actors: Record<string, Actor> = {};
  for (const input of scenario.actors) actors[input.id] = { ...clone(input), belief: { prior: [...scenario.grid.prior], posterior: [...scenario.grid.prior], evidenceIds: [], override: null, diagnostics: [] } };
  const state: RunState = {
    formatVersion: 1, identity: { engineHash: ENGINE_HASH, scenarioHash: scenarioHash(scenario), numericalVersion: NUMERICAL_VERSION, modelVariant: scenario.modelVariant, seed, scenarioId },
    revision: 0, quarter: 0, phase: 'planning', playerId: scenario.actors[0].id, movesUsed: 0, actors, plans: {}, projects: [], interventions: [], evidence: [], traces: [],
    hidden: { controlEffectiveness: scenario.grid.support[Math.floor(random(seed, 'world:control:v1') * scenario.grid.support.length)], incidents: 0, undetectedIncidents: 0 },
    log: [], receipts: {}, report: null,
  };
  for (const actorId of Object.keys(actors).sort()) study(state, scenario, actors[actorId], `opening-audit:${actorId}`, 0, true);
  openQuarter(state, scenario, true);
  return state;
}

function validateAction(action: Action): void {
  if (!action || typeof action !== 'object') throw new Error('Action must be an object.');
  switch (action.type) {
    case 'train':
      if (!['small', 'large'].includes(action.scale) || !['pretraining', 'rl'].includes(action.method) || !Array.isArray(action.focuses) || action.focuses.length !== 2 || action.focuses[0] === action.focuses[1] || action.focuses.some(focus => !['reasoning', 'coding', 'science', 'agency'].includes(focus))) throw new Error('Train requires a scale, method, and two different valid focuses.');
      break;
    case 'ship': if (!['own', 'third-party'].includes(action.model)) throw new Error('Ship model must be own or third-party.'); break;
    case 'secure': if (action.amount !== 1 && action.amount !== 2) throw new Error('Secure amount must be 1 or 2.'); break;
    case 'investigate': if (action.topic !== 'control') throw new Error('Unknown investigation topic.'); break;
    default: throw new Error('Unknown action type.');
  }
}
function queueAction(state: RunState, scenario: Scenario, actorId: string, action: Action, forcedByEvidence?: string): void {
  validateAction(action);
  const cost = actionCosts(scenario, action);
  const actor = state.actors[actorId];
  let cash = cost.cashCost; let compute = cost.computeCost;
  for (const staged of state.interventions.filter(item => item.actorId === actorId)) { cash += staged.cashCost; compute += staged.computeCost; }
  if (cash > actor.cash || compute > actor.compute) throw new Error('Interventions exceed available cash or compute.');
  const item: Intervention = { id: `intervention:${actorId}:${state.quarter}:${state.interventions.filter(item => item.actorId === actorId).length}`, actorId, action: clone(action), ...cost };
  if (forcedByEvidence) item.forcedByEvidence = forcedByEvidence;
  state.interventions.push(item);
  refreshPlan(state, actorId, scenario);
}
function report(state: RunState, insolvent = false): void {
  const player = state.actors[state.playerId];
  const others = Object.keys(state.actors).sort().filter(id => id !== state.playerId).map(id => state.actors[id]);
  const leading = others.every(actor => player.capability >= actor.capability);
  state.report = { kind: insolvent ? 'insolvent' : 'prototype-horizon',
    labViability: insolvent ? 'The lab cannot pay its next opening upkeep.' : player.cash >= 30 ? 'Healthy cash reserve at the prototype horizon.' : 'Operating, with a thin cash reserve at the prototype horizon.',
    influence: `${player.influence} influence; ${leading ? 'at or ahead of rival capability' : 'behind at least one rival in capability'}.`,
    societalOutcome: state.hidden.incidents === 0 ? 'No successful synthetic containment failures occurred in this run.' : `${state.hidden.incidents} successful synthetic containment failures occurred; ${state.hidden.undetectedIncidents} were undetected at occurrence.`,
    caveat: 'Synthetic prototype horizon assessment. This is not a final ending family, a forecast, or certified safety. Hidden outcomes are revealed only in this terminal report.' };
}
function signal(state: RunState, scenario: Scenario, actorId: string, action: Action, key: string): void {
  if (action.type === 'investigate') return;
  const visibility = action.type === 'ship' ? 'public' : action.type === 'train' && action.scale === 'large' ? 'physical' : 'covert';
  for (const observerId of Object.keys(state.actors).sort()) {
    if (observerId === actorId) continue;
    const observer = state.actors[observerId];
    const probability = visibility === 'public' ? 1 : visibility === 'physical' ? clamp(0.35 + observer.intelligence * 0.4, 0, 1) : clamp(0.08 + observer.intelligence * 0.2, 0, 1);
    const detected = visibility === 'public' || random(state.identity.seed, `${key}:detect:${observerId}`) < probability;
    addEvidence(state, { independentKey: key, quarter: state.quarter, availableQuarter: state.quarter + 1, observerId, sourceId: actorId, topic: 'control',
      summary: action.type === 'ship' ? `${state.actors[actorId].name} publicly launched a ${action.model} model product.` : action.type === 'train' ? `${state.actors[actorId].name} showed a signal consistent with ${action.scale} training.` : `A covert signal suggests ${state.actors[actorId].name} increased security.`,
      likelihood: scenario.grid.support.map(() => 1), credibility: visibility === 'public' ? 1 : 0.6, ambiguity: visibility === 'public' ? 0 : 0.5, receptivity: observer.receptivity, visibility, detected, flagged: action.type === 'train' });
  }
}
function incident(state: RunState, scenario: Scenario, actor: Actor, action: Action, key: string): void {
  const actionRisk = interpolate(scenario.riskTable, actor.capability + (action.type === 'train' ? trainingBenefits(action).gain + trainingBenefits(action).exposure : 0));
  const mitigation = clamp(state.hidden.controlEffectiveness * actor.safety / (actor.safety + 4), 0, state.hidden.controlEffectiveness);
  const risk = actionRisk * (1 - mitigation);
  const attempt = random(state.identity.seed, `${key}:attempt`) < actionRisk;
  const success = attempt && random(state.identity.seed, `${key}:success`) < 1 - mitigation;
  const detected = attempt && random(state.identity.seed, `${key}:incident-detect`) < clamp(0.35 + actor.intelligence * 0.45 + actor.safety * 0.01, 0, 0.95);
  if (success) { state.hidden.incidents += 1; if (!detected) state.hidden.undetectedIncidents += 1; }
  trace(state, actor.id, 'private-incident', 'Synthetic attempt, containment and detection resolve through separate keyed draws.', { actionRisk, mitigation, risk, attempt, success, detected });
  if (!detected) return;
  const likelihood = scenario.grid.support.map(control => success ? 1 - control * actor.safety / (actor.safety + 4) : 0.03 + control * actor.safety / (actor.safety + 4));
  for (const observerId of Object.keys(state.actors).sort()) {
    addEvidence(state, { independentKey: `${key}:incident`, quarter: state.quarter, availableQuarter: state.quarter + 1, observerId, sourceId: actor.id, topic: 'control',
      summary: success ? `Detected containment failure at ${actor.name}.` : `Detected warning shot at ${actor.name}; the attempted escape was contained.`,
      likelihood, credibility: 0.95, ambiguity: 0.15, receptivity: state.actors[observerId].receptivity, visibility: 'public', detected: true, flagged: true });
  }
}
function resolveQuarter(state: RunState, scenario: Scenario): void {
  for (const actorId of Object.keys(state.actors).sort()) {
    if (actorId === state.playerId) continue;
    const actor = state.actors[actorId];
    for (let slot = 0; slot < 2; slot += 1) {
      const action = chooseIntervention(actor, scenario, state.quarter, state.interventions);
      if (!action) break;
      queueAction(state, scenario, actorId, action);
    }
  }
  for (const actorId of Object.keys(state.actors).sort()) {
    refreshPlan(state, actorId, scenario);
    const plan = state.plans[actorId];
    if (plan.conflicts.length > 0) throw new Error('Correct the resource conflict in the routine plan before ending the quarter.');
  }
  for (const actorId of Object.keys(state.actors).sort()) {
    const actor = state.actors[actorId];
    const plan = state.plans[actorId];
    actor.cash -= plan.cashCommitted;
    actor.compute -= plan.computeCommitted;
    const routine = plan.items[0].choice;
    actor.lastRoutine = routine;
    if (routine === 'product') { actor.product += 1; actor.revenue += 2; }
    if (routine === 'safety') actor.safety += 1;
    trace(state, actorId, actorId === state.playerId ? 'visible-resolution' : 'private-policy', `Routine ${routine} committed alongside interventions.`, { cashCost: plan.cashCommitted, computeCost: plan.computeCommitted });
  }
  for (const intervention of [...state.interventions].sort((a, b) => a.id < b.id ? -1 : 1)) {
    const actor = state.actors[intervention.actorId];
    const action = intervention.action;
    const key = `action:${state.quarter}:${intervention.id}`;
    if (action.type === 'train') {
      const gain = trainingBenefits(action).gain;
      state.projects.push({ id: `project:${intervention.id}`, actorId: actor.id, kind: 'train', createdQuarter: state.quarter, remaining: action.scale === 'large' ? 2 : 1, gain, focuses: [...action.focuses] });
      incident(state, scenario, actor, action, key);
    } else if (action.type === 'ship') {
      const gain = action.model === 'own' ? 3 + Math.floor(actor.capability / 3) : 3;
      actor.product += 2; actor.revenue += gain; actor.influence += action.model === 'own' ? 3 : 1;
      if (action.model === 'own') incident(state, scenario, actor, action, key);
    } else if (action.type === 'secure') actor.safety += action.amount * 2;
    else study(state, scenario, actor, key, state.quarter + 1);
    signal(state, scenario, actor.id, action, key);
    if (actor.id === state.playerId) trace(state, actor.id, 'visible-action', `${action.type} resolved${action.type === 'train' ? '; its project first progresses next quarter' : ''}.`, { action: clone(action), cashCost: intervention.cashCost, computeCost: intervention.computeCost });
  }
  for (const actorId of Object.keys(state.actors).sort()) {
    const actor = state.actors[actorId];
    actor.cash += actor.revenue;
    integer(actor.cash, 'cash'); integer(actor.compute, 'compute');
  }
  if (state.quarter + 1 >= scenario.horizon || state.actors[state.playerId].cash < scenario.openingCashCost) {
    state.phase = 'ended';
    report(state, state.actors[state.playerId].cash < scenario.openingCashCost);
    return;
  }
  state.quarter += 1;
  openQuarter(state, scenario);
}

export function execute(state: RunState, command: Command): CommandResult {
  const fail = (code: string, message: string): CommandResult => ({ ok: false, state, error: { code, message } });
  try {
    if (!command || typeof command !== 'object' || typeof command.actorId !== 'string' || typeof command.idempotencyKey !== 'string' || command.idempotencyKey.length === 0 || command.idempotencyKey.length > 200 || !Number.isSafeInteger(command.expectedRevision) || !command.payload || typeof command.payload !== 'object') return fail('INVALID_COMMAND', 'Commands require actorId, a nonempty idempotencyKey, expectedRevision and payload.');
    if (command.actorId !== state.playerId) return fail('ACTOR_NOT_AUTHORIZED', 'Only the player actor may issue commands.');
    const fingerprint = hash(command);
    const receiptKey = `receipt:${command.actorId}:${command.idempotencyKey}`;
    const receipt = state.receipts[receiptKey];
    if (receipt) return receipt.fingerprint === fingerprint ? { ok: true, state, data: { duplicate: true, acceptedRevision: receipt.revision, revision: state.revision } } : fail('IDEMPOTENCY_CONFLICT', 'This idempotency key was already used for a different command.');
    if (command.expectedRevision !== state.revision) return fail('STALE_REVISION', `Expected current revision ${state.revision}.`);
    if (state.phase !== 'planning') return fail('RUN_ENDED', 'The run has ended. Create a new run to play again.');
    const next = clone(state);
    const scenario = scenarioFor(next);
    const actor = next.actors[next.playerId];
    const payload = command.payload;
    if (payload.type !== 'end_turn' && next.movesUsed >= 3) return fail('MOVE_LIMIT', 'All three intervention slots are used this quarter.');
    switch (payload.type) {
      case 'take_action': queueAction(next, scenario, next.playerId, payload.action); break;
      case 'override_plan_item': {
        if (!['veto', 'lease', 'product', 'safety'].includes(payload.choice)) throw new Error('Invalid plan choice.');
        const item = next.plans[next.playerId].items.find(item => item.id === payload.itemId);
        if (!item) return fail('UNKNOWN_PLAN_ITEM', 'Choose an item from the current player plan.');
        item.choice = payload.choice === 'veto' ? 'hold' : payload.choice; item.overridden = true;
        refreshPlan(next, next.playerId, scenario);
        trace(next, actor.id, 'visible-plan', `You committed the routine choice to ${item.choice}; later plan revisions retain this choice.`);
        break;
      }
      case 'override_belief': {
        if (payload.topic !== 'control' || payload.conviction !== null && (typeof payload.conviction !== 'number' || !Number.isFinite(payload.conviction) || payload.conviction < 0 || payload.conviction > 1)) throw new Error('Conviction must be null or a finite number between 0 and 1 for control.');
        if (payload.conviction === null && actor.belief.override === null) throw new Error('No active conviction to end.');
        actor.belief.override = payload.conviction === null ? null : { topic: 'control', conviction: payload.conviction, startQuarter: next.quarter, expiresQuarter: next.quarter + 4 };
        refreshPlan(next, actor.id, scenario);
        trace(next, actor.id, 'visible-belief', payload.conviction === null ? 'Policy returned to the current evidence-based posterior.' : `Policy will use your ${(payload.conviction * 100).toFixed(1)}% conviction for four quarters. Evidence continues updating the underlying posterior.`);
        break;
      }
      case 'respond_to_evidence': {
        const item = next.evidence.find(item => item.id === payload.evidenceId && item.observerId === next.playerId && item.detected && item.processed && item.flagged);
        if (!item) return fail('EVIDENCE_NOT_RESPONDABLE', 'Choose a detected, processed, flagged item from your feed.');
        if (next.log.some(entry => entry.payload.type === 'respond_to_evidence' && entry.payload.evidenceId === item.id)) return fail('ALREADY_RESPONDED', 'This evidence already received a forced response.');
        if (!payload.response || !['secure', 'investigate'].includes(payload.response.type)) throw new Error('Respond requires a Secure or Investigate action.');
        item.receptivity = 1; item.status = 'acted-on';
        actor.belief = recomputeBelief(scenario.grid, actor.belief, next.evidence.filter(item => item.observerId === actor.id));
        queueAction(next, scenario, actor.id, payload.response as ResponseAction, item.id);
        if (next.plans[actor.id].conflicts.length > 0) throw new Error('The chosen response conflicts with your explicit routine plan; correct the plan first.');
        trace(next, actor.id, 'visible-response', 'Reassessed this observation at full receptivity, preserving ambiguity and credibility. The chosen response bypasses inertia and pays its normal costs.', { evidenceId: item.id, response: clone(payload.response) });
        break;
      }
      case 'end_turn': resolveQuarter(next, scenario); break;
      default: return fail('INVALID_COMMAND', 'Unknown command type.');
    }
    if (payload.type !== 'end_turn') {
      if (next.movesUsed === 2 && next.plans[next.playerId].conflicts.length > 0) return fail('FINAL_SLOT_CONFLICT', 'This would use your final slot while leaving a resource conflict. Use this slot to correct the routine plan, or choose a feasible intervention.');
      next.movesUsed += 1;
    }
    next.revision += 1;
    next.log.push(clone(command));
    next.receipts[receiptKey] = { fingerprint, revision: next.revision };
    canonical(next);
    return { ok: true, state: next, data: { duplicate: false, revision: next.revision, view: getView(next), plan: getPlan(next) } };
  } catch (error) {
    return fail('INVALID_OR_INFEASIBLE', error instanceof Error ? error.message : 'Invalid or infeasible command.');
  }
}

export function getView(state: RunState) {
  const scenario = scenarioFor(state); const actor = state.actors[state.playerId]; const plan = state.plans[state.playerId];
  return clone({ scenario: { id: scenario.id, title: scenario.title, horizon: scenario.horizon, provenance: scenario.provenance }, revision: state.revision,
    quarter: state.quarter, quarterLabel: `Q${state.quarter % 4 + 1} ${2025 + Math.floor(state.quarter / 4)}`, phase: state.phase, playerId: state.playerId,
    movesUsed: state.movesUsed, movesRemaining: state.phase === 'ended' ? 0 : 3 - state.movesUsed,
    player: { id: actor.id, name: actor.name, cash: actor.cash, compute: actor.compute, capability: actor.capability, product: actor.product, revenue: actor.revenue, safety: actor.safety, influence: actor.influence },
    resources: { availableCash: actor.cash, availableCompute: actor.compute, committedCash: state.phase === 'ended' ? 0 : plan.cashCommitted, committedCompute: state.phase === 'ended' ? 0 : plan.computeCommitted, remainingCash: actor.cash - (state.phase === 'ended' ? 0 : plan.cashCommitted), remainingCompute: actor.compute - (state.phase === 'ended' ? 0 : plan.computeCommitted), conflicts: state.phase === 'ended' ? [] : plan.conflicts },
    projects: state.projects.filter(item => item.actorId === state.playerId), interventions: state.interventions.filter(item => item.actorId === state.playerId), report: state.report });
}
export function getPlan(state: RunState) { return clone(state.plans[state.playerId]); }
export function getBeliefs(state: RunState) {
  const scenario = scenarioFor(state); const actor = state.actors[state.playerId]; const belief = actor.belief;
  return clone([{ topic: 'control', label: scenario.grid.label, support: scenario.grid.support, binEdges: scenario.grid.binEdges,
    priorBins: aggregateBins(scenario.grid, belief.prior), posteriorBins: aggregateBins(scenario.grid, belief.posterior), posterior: belief.posterior,
    evidenceMean: mean(scenario.grid, belief.posterior), effectiveMean: effectiveMean(scenario.grid, belief, state.quarter), override: belief.override,
    receptivity: actor.receptivity, switchingCost: actor.switchingCost, diagnostics: belief.diagnostics,
    explanation: 'Evidence updates probability mass on all 20 grid points by finite enumeration. Independence is between latent constants, not support points. Convictions affect policy, while the evidence posterior continues learning. Ambiguity and credibility still apply to Respond.' }]);
}
export function getFeed(state: RunState) {
  return clone(state.evidence.filter(item => item.observerId === state.playerId && item.detected && item.processed).map(item => ({
    id: item.id, quarter: item.quarter, sourceId: item.sourceId, topic: item.topic, summary: item.summary, visibility: item.visibility,
    credibility: item.credibility, ambiguity: item.ambiguity, receptivity: item.receptivity, status: item.status, flagged: item.flagged,
    canRespond: state.phase === 'planning' && item.flagged && !state.log.some(entry => entry.payload.type === 'respond_to_evidence' && entry.payload.evidenceId === item.id),
  })));
}
export function getRivals(state: RunState) {
  return Object.keys(state.actors).sort().filter(id => id !== state.playerId).map(id => ({ id, name: state.actors[id].name,
    observations: getFeed(state).filter(item => item.sourceId === id), explanation: 'Only detected evidence is available; rival resources, capability, beliefs, plans, and traits remain uncertain.' }));
}
export function listActions(state: RunState, requestedAction?: Action) {
  const scenario = scenarioFor(state); const actor = state.actors[state.playerId];
  if (requestedAction !== undefined) validateAction(requestedAction);
  const actions: Action[] = requestedAction !== undefined ? [clone(requestedAction)] : [
    { type: 'train', scale: 'small', method: 'pretraining', focuses: ['reasoning', 'coding'] }, { type: 'train', scale: 'large', method: 'rl', focuses: ['science', 'agency'] },
    { type: 'ship', model: 'own' }, { type: 'ship', model: 'third-party' }, { type: 'secure', amount: 1 }, { type: 'secure', amount: 2 }, { type: 'investigate', topic: 'control' },
  ];
  return actions.map(action => {
    const cost = actionCosts(scenario, action);
    const visibility = action.type === 'ship' ? 'public' : action.type === 'train' && action.scale === 'large' ? 'physical' : 'covert';
    const exposure = actor.capability + (action.type === 'train' ? trainingBenefits(action).gain + trainingBenefits(action).exposure : 0);
    const simulated: Intervention = { id: 'preview', actorId: actor.id, action, ...cost };
    const plan = makePlan(actor, scenario, state.quarter, [...state.interventions, simulated], state.plans[actor.id]);
    let expectedSafety = actor.safety + (plan.items[0].choice === 'safety' ? 1 : 0);
    for (const item of state.interventions.filter(item => item.actorId === actor.id)) if (item.action.type === 'secure') expectedSafety += item.action.amount * 2;
    const expectedRisk = action.type === 'train' || action.type === 'ship' && action.model === 'own'
      ? interpolate(scenario.riskTable, exposure) * (1 - effectiveMean(scenario.grid, actor.belief, state.quarter) * expectedSafety / (expectedSafety + 4)) : 0;
    return { action, ...cost, moveCost: 1, visibility, expectedContainmentRisk: expectedRisk, riskBasis: 'Uses your company conviction or posterior mean; true effectiveness remains hidden. Risk resolves in staged action order, so earlier Secure improves later Train or Ship mitigation.', feasible: state.phase === 'planning' && state.movesUsed < 3 && plan.conflicts.length === 0,
      conflicts: plan.conflicts, planChoice: plan.items[0].choice,
      detectionEstimates: Object.keys(state.actors).sort().filter(id => id !== actor.id).map(observerId => ({ observerId, probability: action.type === 'investigate' ? 0 : visibility === 'public' ? 1 : visibility === 'physical' ? 0.55 : 0.18, basis: 'Synthetic prior intelligence 0.5; actual observer traits remain hidden.' })),
      effect: action.type === 'train' ? `Delayed capability gain ${trainingBenefits(action).gain} after ${action.scale === 'large' ? 2 : 1} subsequent openings. Focus effects: reasoning +1 capability; coding +1 recurring revenue; science +1 safety; agency +2 capability and +4 risk-table exposure. RL adds +1 capability and +2 risk-table exposure. Current choice: +${trainingBenefits(action).revenue} revenue, +${trainingBenefits(action).safety} safety, +${trainingBenefits(action).exposure} exposure.` : action.type === 'ship' ? `Revenue and influence launch; ${action.model === 'own' ? 'uses current capability and creates containment exposure' : 'third-party harness has lower influence and no own-model containment exposure'}.` : action.type === 'secure' ? `Add ${action.amount * 2} safety; mitigation remains bounded by unknown control effectiveness.` : 'Generate a noisy control study; evidence enters the next plan.',
    };
  });
}
export function explain(state: RunState, id?: string) {
  const allowed = state.traces.filter(item => item.actorId === state.playerId && item.kind.startsWith('visible-'));
  if (id) {
    const item = allowed.find(item => item.id === id);
    if (item) return clone({ explanation: item });
    const evidence = getFeed(state).find(item => item.id === id);
    if (evidence) return clone({ evidence, mechanism: 'Detection admits the observation. Credibility, ambiguity and receptivity determine its likelihood contribution; the policy then evaluates expected benefits against costs and inertia. Respond replaces the original contribution.' });
    return { error: 'No player-visible explanation exists for that identifier.' };
  }
  return clone({ plan: getPlan(state), beliefs: getBeliefs(state), recent: allowed.slice(-10),
    riskModel: 'Action risk × (1 − mitigation). Mitigation is bounded by unknown control effectiveness; attempt, success and detection are separate. Undetected outcomes are withheld until the horizon report.' });
}
export function getRules(state: RunState) {
  const scenario = scenarioFor(state);
  return { title: 'The Last Race', scenario: scenario.id, horizon: scenario.horizon, model: scenario.provenance,
    movesPerQuarter: 3, moneyUnit: 'integer millions of synthetic credits', computeUnit: 'integer synthetic compute units',
    openingUpkeep: scenario.openingCashCost, openingCompute: scenario.openingCompute,
    commands: ['take_action', 'override_plan_item', 'override_belief', 'respond_to_evidence', 'end_turn'],
    beliefOverrideDuration: 4, rules: [
      'The company proposes one routine operation. Every intervention, plan override, belief replacement/removal and Respond uses one of three slots.',
      'All staged costs share one cash and compute ledger. Explicit plan choices persist, and resource conflicts block commitment. A final-slot command cannot leave a conflict; reserve that slot for correction.',
      'Small training finishes at the next opening; large training requires two subsequent openings. New resolution evidence informs the next plan.',
      'Four-quarter convictions change company policy while evidence continues updating underneath. Respond preserves convictions and replaces, rather than duplicates, evidence.',
      'Public signals are detected; covert and physical signals use keyed detection. Rival plans and hidden traits never enter player views.',
      'This prototype uses explicitly synthetic mechanisms and reports viability, influence and societal outcome separately. The owner fun gate remains required before Stage 2b.',
      'Wildcard proposal support is deferred to Stage 2b; this prototype cannot apply wildcard effects.',
    ] };
}
export function replay(state: RunState): RunState {
  const scenario = scenarioFor(state);
  if (state.formatVersion !== 1 || state.identity.engineHash !== ENGINE_HASH || state.identity.scenarioHash !== scenarioHash(scenario) || state.identity.numericalVersion !== NUMERICAL_VERSION || state.identity.modelVariant !== scenario.modelVariant) throw new Error('Incompatible replay identity. This artifact requires its matching engine and scenario versions.');
  let replayed = createRun(state.identity.seed, state.identity.scenarioId);
  for (const command of state.log) {
    const result = execute(replayed, command);
    if (!result.ok) throw new Error('Replay command log is invalid.');
    replayed = result.state;
  }
  if (canonical(replayed) !== canonical(state)) throw new Error('Replay verification failed: state does not match the committed command log.');
  return replayed;
}
export function saveRun(state: RunState): string { replay(state); return canonical(state); }
export function resumeRun(serialized: string): RunState {
  if (typeof serialized !== 'string' || serialized.length > 10_000_000) throw new Error('Invalid or oversized save artifact.');
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object' || !('formatVersion' in parsed) || !('identity' in parsed) || !('log' in parsed)) throw new Error('Invalid save artifact.');
  return replay(parsed as RunState);
}
