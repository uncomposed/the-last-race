import type { Actor, Scenario } from './types.js';
import { assertFinite, canonical, hash, integer, interpolate, sum } from './numeric.js';

const actors: Array<Omit<Actor, 'belief'>> = [
  { id: 'deepcent', name: 'DeepCent', cash: 90, compute: 4, capability: 2, product: 1, safety: 1, revenue: 8, influence: 1, receptivity: 0.4, switchingCost: 0.8, intelligence: 0.55, weights: { revenue: 1, capability: 1.2, safety: 1, mission: 1 }, lastRoutine: 'product' },
  { id: 'openbrain', name: 'OpenBrain', cash: 90, compute: 4, capability: 3, product: 1, safety: 1, revenue: 8, influence: 1, receptivity: 0.35, switchingCost: 0.6, intelligence: 0.5, weights: { revenue: 1, capability: 1.7, safety: 0.6, mission: 0.7 }, lastRoutine: 'lease' },
  { id: 'antropic', name: 'Reasonance', cash: 80, compute: 4, capability: 2, product: 1, safety: 2, revenue: 8, influence: 1, receptivity: 0.75, switchingCost: 0.7, intelligence: 0.5, weights: { revenue: 1, capability: 1, safety: 1.6, mission: 1.3 }, lastRoutine: 'safety' }
];
const fixture: Scenario = {
  id: 'core-12', version: 'synthetic-v1', modelVariant: 'independent-control-v1', title: 'The Last Race — core loop', horizon: 12,
  provenance: { kind: 'synthetic', note: 'Exploratory play fixture. Numbers are game conventions, not empirical estimates or forecasts. Actors begin in Q1 2025; later history is not actor knowledge.', sources: [] },
  grid: { id: 'control', label: 'Control effectiveness ceiling', support: Array.from({ length: 20 }, (_, i) => (i + 1) / 20), binEdges: [0, 0.2, 0.4, 0.6, 0.8, 1], prior: Array.from({ length: 20 }, () => 0.05) },
  actors, openingCashCost: 5, openingCompute: 4,
  costs: { trainSmall: 12, trainLarge: 24, ship: 14, secureUnit: 8, investigate: 6, lease: 5, product: 4, safety: 4 },
  riskTable: [[0, 0.01], [4, 0.04], [8, 0.12], [16, 0.3], [32, 0.6]]
};
export function validateScenario(scenario: Scenario): Scenario {
  canonical(scenario);
  integer(scenario.horizon, 'horizon');
  if (scenario.horizon < 1 || scenario.horizon > 28) throw new Error('Invalid horizon');
  const grid = scenario.grid;
  if (grid.support.length !== 20 || grid.prior.length !== 20 || grid.binEdges.length !== 6) throw new Error('Expected 20 grid points and five display bins');
  for (let i = 0; i < 20; i++) {
    assertFinite(grid.support[i]); assertFinite(grid.prior[i]);
    if (grid.support[i] < 0 || grid.support[i] > 1 || grid.prior[i] < 0 || (i > 0 && grid.support[i] <= grid.support[i - 1])) throw new Error('Invalid support or prior');
  }
  for (let i = 0; i < 6; i++) if (!Number.isFinite(grid.binEdges[i]) || (i > 0 && grid.binEdges[i] <= grid.binEdges[i - 1])) throw new Error('Invalid bin boundaries');
  if (grid.binEdges[0] > grid.support[0] || grid.binEdges[5] < grid.support[19] || sum(grid.prior) <= 0) throw new Error('Uncovered support or empty prior');
  const ids = new Set<string>();
  for (const actor of scenario.actors) {
    if (ids.has(actor.id) || !/^[a-z][a-z0-9-]*$/.test(actor.id)) throw new Error('Invalid actor ID');
    ids.add(actor.id);
    for (const key of ['cash', 'compute', 'capability', 'product', 'safety', 'revenue', 'influence'] as const) if (integer(actor[key], key) < 0) throw new Error('Negative actor resource');
    for (const value of [actor.receptivity, actor.intelligence]) if (assertFinite(value) < 0 || value > 1) throw new Error('Invalid trait');
    if (actor.switchingCost < 0) throw new Error('Invalid switching cost');
    for (const value of Object.values(actor.weights)) if (assertFinite(value) < 0) throw new Error('Invalid objective weight');
  }
  if (!ids.has('deepcent') || scenario.actors.length < 2) throw new Error('Missing company or rival');
  for (const value of [...Object.values(scenario.costs), scenario.openingCashCost, scenario.openingCompute]) if (integer(value) < 0) throw new Error('Invalid scenario cost');
  interpolate(scenario.riskTable, 0);
  for (const [, risk] of scenario.riskTable) if (risk < 0 || risk > 1) throw new Error('Invalid risk');
  if (scenario.campaign) {
    const config = scenario.campaign;
    if (config.strategicPrior.length !== 20 || config.strategicPrior.some(p => !Number.isFinite(p) || p < 0) || sum(config.strategicPrior) <= 0) throw new Error('Invalid strategic prior');
    if (!Number.isFinite(config.detectionMultiplier) || config.detectionMultiplier < 0 || config.detectionMultiplier > 1) throw new Error('Invalid detection multiplier');
    if (config.regions.length !== 12 || new Set(config.regions.map(r => r.id)).size !== 12) throw new Error('Expected twelve unique regions');
    for (const region of config.regions) {
      if (!/^[a-z][a-z0-9-]*$/.test(region.id) || !['us', 'china'].includes(region.jurisdiction)) throw new Error('Invalid region identity');
      for (const value of [region.power, region.cost, region.delay, region.upkeep]) if (integer(value) < 1) throw new Error('Invalid regional resource');
      if (assertFinite(region.hazard) < 0 || region.hazard > 1) throw new Error('Invalid regional hazard');
    }
    for (const value of [config.marketCap, config.frontier, config.dominanceGap, config.safeSafety, config.verificationThreshold, config.paradigmThreshold, config.slowdownQuarters]) if (integer(value) < 1) throw new Error('Invalid campaign threshold');
    const endings = ['safe-lead', 'multipolar-balance', 'coordinated-slowdown', 'winner-takes-all', 'loss-of-control', 'left-behind', 'failed-slowdown', 'verification-broken'];
    if (config.precedence.length !== 8 || new Set(config.precedence).size !== 8 || config.precedence.some(e => !endings.includes(e))) throw new Error('Ending coverage/precedence incomplete');
    if (!config.rumorPropensities.length || config.rumorPropensities.some(p => !Number.isFinite(p) || p < 0 || p > 1)) throw new Error('Invalid rumor distribution');
  }
  return scenario;
}
export function getScenario(id = 'core-12'): Scenario {
  if (id !== 'core-12' && id !== 'one-quarter' && !['full-28', 'full-28-skeptical', 'full-28-low-detection', 'business-28', 'lab-12'].includes(id)) throw new Error('Unknown scenario');
  const scenario = structuredClone(fixture);
  if (id === 'one-quarter') { scenario.id = id; scenario.horizon = 1; scenario.actors = scenario.actors.slice(0, 2); scenario.title = 'The Last Race — first quarter'; }
  if (id.startsWith('full-28') || id === 'business-28' || id === 'lab-12') {
    scenario.id = id; scenario.horizon = 28; scenario.version = 'synthetic-v2b'; scenario.modelVariant = 'independent-strategic-v1';
    scenario.title = 'The Last Race — complete headless campaign';
    scenario.actors.push(
      { ...structuredClone(actors[0]), id: 'metamind', name: 'Metamind', weights: { revenue: 1.5, capability: 1.1, safety: 0.7, mission: 0.6 } },
      { ...structuredClone(actors[0]), id: 'deepquest', name: 'DeepQuest', cash: 75, weights: { revenue: 0.9, capability: 1.5, safety: 0.8, mission: 0.8 } },
      { ...structuredClone(actors[0]), id: 'xspace', name: 'xSpace', cash: 110, weights: { revenue: 1.2, capability: 1.8, safety: 0.5, mission: 0.6 } },
    );
    scenario.campaign = {
      regions: [
        ['virginia', 'Virginia', 'us', 32, 18, 2, 2, 0.02], ['texas', 'Texas', 'us', 40, 14, 2, 3, 0.08],
        ['oregon', 'Oregon', 'us', 24, 20, 3, 1, 0.02], ['quebec', 'Quebec', 'us', 24, 18, 3, 1, 0.01],
        ['iceland', 'Iceland', 'us', 16, 22, 3, 1, 0.02], ['ireland', 'Ireland', 'us', 16, 24, 4, 2, 0.02],
        ['arizona', 'Arizona', 'us', 32, 16, 2, 3, 0.10], ['singapore', 'Singapore', 'us', 16, 26, 2, 3, 0.04],
        ['guizhou', 'Guizhou', 'china', 32, 14, 2, 2, 0.03], ['inner-mongolia', 'Inner Mongolia', 'china', 40, 12, 3, 3, 0.06],
        ['sichuan', 'Sichuan', 'china', 24, 16, 3, 1, 0.05], ['guangdong', 'Guangdong', 'china', 24, 20, 2, 2, 0.06],
      ].map(([id, name, jurisdiction, power, cost, delay, upkeep, hazard]) => ({ id, name, jurisdiction, power, cost, delay, upkeep, hazard })) as NonNullable<Scenario['campaign']>['regions'],
      strategicPrior: Array.from({ length: 20 }, () => 0.05), detectionMultiplier: 1, marketCap: 40, frontier: 24, dominanceGap: 14, safeSafety: 14, verificationThreshold: 4,
      paradigmThreshold: 30, slowdownQuarters: 4,
      precedence: ['loss-of-control', 'failed-slowdown', 'verification-broken', 'coordinated-slowdown', 'safe-lead', 'winner-takes-all', 'left-behind', 'multipolar-balance'],
      rumorPropensities: [0, 0.01, 0.02, 0.03, 0.05],
    };
  }
  if (id === 'full-28-skeptical') {
    scenario.grid.prior = scenario.grid.support.map((_, i) => (20 - i) / 210);
    scenario.modelVariant = 'independent-strategic-skeptical-prior-v1';
    scenario.provenance.note += ' Sensitivity fixture: pessimistic control prior; hidden world draws unchanged.';
  }
  if (id === 'full-28-low-detection') {
    scenario.campaign!.detectionMultiplier = 0.5;
    scenario.modelVariant = 'independent-strategic-low-detection-v1';
    scenario.provenance.note += ' Sensitivity fixture: half the baseline non-public action-signal detection probability.';
  }
  if (id === 'business-28' || id === 'lab-12') scenario.business = true;
  if (id === 'lab-12') { scenario.lab = true; scenario.horizon = 12; scenario.title = 'The Last Race — connected lab prototype'; scenario.version = 'synthetic-lab-v1'; scenario.modelVariant = 'task-deployment-v1'; }
  return validateScenario(scenario);
}
export function scenarioHash(scenario: Scenario): string { return hash(validateScenario(scenario)); }
