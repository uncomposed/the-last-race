import type { Action, Actor, Intervention, Plan, PlanItem, RoutineChoice, Scenario } from './types.js';
import { effectiveMean } from './beliefs.js';
import { interpolate } from './numeric.js';

export interface PolicyOption {
  id: string;
  cashCost: number;
  computeCost: number;
  revenue: number;
  capability: number;
  safety: number;
  mission: number;
  switchingCost: number;
}

/** Every actor scores expected benefits using its beliefs, never the hidden constant. */
export function scoreOption(actor: Actor, option: PolicyOption): number {
  let score = option.revenue * actor.weights.revenue;
  score += option.capability * actor.weights.capability;
  score += option.safety * actor.weights.safety;
  score += option.mission * actor.weights.mission;
  score -= option.cashCost * 0.16;
  score -= option.computeCost * 0.25;
  score -= option.switchingCost;
  return score;
}

export function rankOptions(actor: Actor, options: PolicyOption[]): PolicyOption[] {
  return [...options].sort((a, b) => {
    const difference = scoreOption(actor, b) - scoreOption(actor, a);
    return difference !== 0 ? difference : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function trainingBenefits(action: Extract<Action, { type: 'train' }>): { gain: number; revenue: number; safety: number; exposure: number } {
  const has = (focus: string) => action.focuses.some(value => value === focus);
  return { gain: (action.scale === 'large' ? 5 : 3) + (action.method === 'rl' ? 1 : 0) + (has('reasoning') ? 1 : 0) + (has('agency') ? 2 : 0),
    revenue: has('coding') ? 1 : 0, safety: has('science') ? 1 : 0,
    exposure: (action.method === 'rl' ? 2 : 0) + (has('agency') ? 4 : 0) };
}

export function actionCosts(scenario: Scenario, action: Action): { cashCost: number; computeCost: number } {
  const concealmentCost = ('concealment' in action ? action.concealment ?? 0 : 0) * 4;
  switch (action.type) {
    case 'train': return { cashCost: (action.scale === 'small' ? scenario.costs.trainSmall : scenario.costs.trainLarge) + concealmentCost, computeCost: action.scale === 'small' ? 3 : 6 };
    case 'ship': return { cashCost: scenario.costs.ship, computeCost: action.model === 'own' ? 1 : 0 };
    case 'secure': return { cashCost: scenario.costs.secureUnit * action.amount + concealmentCost, computeCost: action.amount };
    case 'build': {
      const region = scenario.campaign?.regions.find(r => r.id === action.regionId);
      if (!region) throw new Error('Unknown region.');
      return { cashCost: region.cost * (action.scale === 'large' ? 2 : 1) + (action.power === 'clean' ? 4 : 0) + (action.layout === 'distributed' ? 4 : 0) + concealmentCost, computeCost: 0 };
    }
    case 'fund': return { cashCost: 0, computeCost: 0 };
    case 'announce': return { cashCost: 1, computeCost: 0 };
    case 'wildcard': return { cashCost: action.ruling.price, computeCost: 0 };
    case 'investigate': return { cashCost: scenario.costs.investigate, computeCost: 1 };
  }
}

export function routineOptions(actor: Actor, scenario: Scenario, quarter: number): PolicyOption[] {
  const control = effectiveMean(scenario.grid, actor.belief, quarter);
  if (actor.strategy?.insolvent) return [{ id: 'hold', cashCost: 0, computeCost: 0, revenue: 0, capability: 0, safety: 0, mission: 0, switchingCost: 0 }];
  const switchCost = (choice: RoutineChoice) => actor.lastRoutine === choice ? 0 : actor.switchingCost;
  return [
    { id: 'hold', cashCost: 0, computeCost: 0, revenue: 0, capability: 0, safety: 0, mission: 0, switchingCost: switchCost('hold') },
    { id: 'lease', cashCost: scenario.costs.lease, computeCost: 0, revenue: 1, capability: 2 + actor.capability * 0.08 + (actor.strategy ? (actor.strategy.racingPressure - 0.525) * 15 : 0), safety: 0, mission: 0, switchingCost: switchCost('lease') },
    { id: 'product', cashCost: scenario.costs.product, computeCost: 1, revenue: scenario.campaign ? Math.min(2, Math.max(0, scenario.campaign.marketCap - actor.revenue)) : 2 + actor.capability * 0.2, capability: 0, safety: 0, mission: 0.3, switchingCost: switchCost('product') },
    { id: 'safety', cashCost: scenario.costs.safety, computeCost: 1, revenue: 0, capability: 0, safety: (1 - control) * (3 + actor.capability * 0.2) / (1 + actor.safety * 0.2) + (actor.strategy ? Math.max(0, 10 - actor.strategy.expectedRivalSafety) * 0.2 : 0), mission: (1 - control) * 1.5, switchingCost: switchCost('safety') },
  ];
}

export function makePlan(actor: Actor, scenario: Scenario, quarter: number, interventions: Intervention[], previous?: Plan): Plan {
  let cashCommitted = 0;
  let computeCommitted = 0;
  for (const intervention of interventions.filter(item => item.actorId === actor.id)) {
    cashCommitted += intervention.cashCost;
    computeCommitted += intervention.computeCost;
  }
  const options = routineOptions(actor, scenario, quarter);
  const explicit = previous?.quarter === quarter ? previous.items.find(item => item.overridden) : undefined;
  const choice = explicit
    ? options.find(item => item.id === explicit.choice)!
    : rankOptions(actor, options).find(item => item.cashCost + cashCommitted <= actor.cash && item.computeCost + computeCommitted <= actor.compute) ?? options[0];
  cashCommitted += choice.cashCost;
  computeCommitted += choice.computeCost;
  const control = effectiveMean(scenario.grid, actor.belief, quarter);
  const alternative = rankOptions(actor, options).find(option => option.id !== choice.id && option.cashCost + cashCommitted - choice.cashCost <= actor.cash && option.computeCost + computeCommitted - choice.computeCost <= actor.compute);
  const comparison = ` Selected score ${scoreOption(actor, choice).toFixed(2)}${alternative ? `; best other feasible option ${alternative.id} scores ${scoreOption(actor, alternative).toFixed(2)} (cash ${alternative.cashCost}, compute ${alternative.computeCost})` : '; no other feasible option'}.`;
  const item: PlanItem = {
    id: `routine:${actor.id}:${quarter}`, choice: choice.id as RoutineChoice,
    cashCost: choice.cashCost, computeCost: choice.computeCost, score: scoreOption(actor, choice),
    reason: `${explicit ? 'Your explicit choice is retained. ' : ''}${choice.id === 'hold' ? 'Preserve resources' : choice.id === 'lease' ? 'Lease 4 compute units for next quarter' : choice.id === 'product' ? 'Improve routine product revenue by 2 credits per quarter' : 'Increase baseline safety by 1'}; policy expects ${(control * 100).toFixed(1)}% control effectiveness. Changing routine has a ${actor.switchingCost} switching cost.${comparison}`,
    overridden: !!explicit,
  };
  const conflicts: string[] = [];
  if (cashCommitted > actor.cash) conflicts.push(`Cash commitment ${cashCommitted} exceeds available ${actor.cash}.`);
  if (computeCommitted > actor.compute) conflicts.push(`Compute commitment ${computeCommitted} exceeds available ${actor.compute}.`);
  return { actorId: actor.id, quarter, items: [item], cashCommitted, computeCommitted, conflicts,
    explanation: `Rival racing expectation ${actor.strategy ? (actor.strategy.racingPressure * 100).toFixed(1) + '% affects leasing priority. ' : 'is not modeled in this fixture. '}` + 'One routine decision is delegated. Interventions and this item share the same cash and compute ledger. Leasing adds capacity only at the next opening; routine product work never counts as a strategic launch.' };
}

export function chooseIntervention(actor: Actor, scenario: Scenario, quarter: number, staged: Intervention[]): Action | null {
  if (actor.strategy?.insolvent) return null;
  const control = effectiveMean(scenario.grid, actor.belief, quarter);
  const actions: Action[] = [
    { type: 'train', scale: 'small', method: 'pretraining', focuses: ['reasoning', 'coding'] },
    { type: 'train', scale: 'large', method: 'rl', focuses: ['science', 'agency'] },
    { type: 'ship', model: 'own' }, { type: 'secure', amount: 1 }, { type: 'investigate', topic: 'control' },
  ];
  if (scenario.campaign && actor.strategy) {
    actions.push({ type: 'build', regionId: actor.id === 'deepquest' ? 'guizhou' : 'texas', scale: 'small', power: 'grid', layout: 'distributed' },
      { type: 'fund', source: 'parent', amount: 20 },
      { type: 'announce', claim: 'slowdown', targetId: actor.id, value: true });
  }
  const options = actions.map((action, index): PolicyOption => {
    const cost = actionCosts(scenario, action);
    const capabilityExposure = actor.capability + (action.type === 'train' ? trainingBenefits(action).gain + trainingBenefits(action).exposure : 0);
    const expectedRisk = action.type === 'train' || action.type === 'ship' && action.model === 'own'
      ? interpolate(scenario.riskTable, capabilityExposure) * (1 - control * actor.safety / (actor.safety + 4)) : 0;
    return { id: `action:${index}`, ...cost,
      revenue: action.type === 'ship' ? (actor.strategy && scenario.campaign ? Math.max(0, Math.min(3 + actor.capability * 0.3, actor.capability - actor.strategy.lastLaunchCapability, scenario.campaign.marketCap - actor.revenue)) : 3 + actor.capability * 0.3) : action.type === 'fund' ? (actor.cash < 30 ? 8 : 0) : 0,
      capability: action.type === 'train' ? trainingBenefits(action).gain * (actor.strategy ? 0.6 + actor.strategy.racingPressure : 1) : action.type === 'build' ? (actor.strategy!.assets.length < 2 && actor.cash > 35 ? 6 : 0) : 0,
      safety: action.type === 'secure' ? (1 - control) * (5 + actor.capability * 0.3) / (1 + actor.safety * 0.15) : -expectedRisk * 12,
      mission: action.type === 'announce' ? (actor.strategy!.pledgeUntil > quarter + 1 ? 0 : (1 - control) * 8) : action.type === 'investigate' ? (1 - control) * 2 : action.type === 'secure' ? (1 - control) * 2 : -expectedRisk * 8,
      switchingCost: actor.switchingCost * 0.3 };
  });
  let cash = 0; let compute = 0;
  for (const item of staged.filter(item => item.actorId === actor.id)) { cash += item.cashCost; compute += item.computeCost; }
  const best = rankOptions(actor, options).find(option => {
    const action = actions[Number(option.id.slice(7))];
    if (action.type === 'fund' && (actor.strategy!.obligations.length >= 4 || staged.some(i => i.actorId === actor.id && i.action.type === 'fund'))) return false;
    if (action.type === 'build' && (actor.strategy!.assets.length >= 2 || staged.some(i => i.actorId === actor.id && i.action.type === 'build'))) return false;
    if (action.type === 'announce' && staged.some(i => i.actorId === actor.id && i.action.type === 'announce')) return false;
    if (action.type === 'train' && actor.strategy && actor.strategy.pledgeUntil > quarter && actor.strategy.racingPressure < 0.6) return false;
    return option.cashCost + cash <= actor.cash && option.computeCost + compute <= actor.compute;
  });
  if (!best || scoreOption(actor, best) <= 0) return null;
  return actions[Number(best.id.slice(7))];
}
