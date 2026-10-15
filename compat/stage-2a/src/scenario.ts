import type { Actor, Scenario } from './types.js';
import { assertFinite, canonical, hash, integer, interpolate, sum } from './numeric.js';

const actors: Array<Omit<Actor, 'belief'>> = [
  { id: 'deepcent', name: 'DeepCent', cash: 90, compute: 4, capability: 2, product: 1, safety: 1, revenue: 8, influence: 1, receptivity: 0.4, switchingCost: 0.8, intelligence: 0.55, weights: { revenue: 1, capability: 1.2, safety: 1, mission: 1 }, lastRoutine: 'product' },
  { id: 'openbrain', name: 'OpenBrain', cash: 90, compute: 4, capability: 3, product: 1, safety: 1, revenue: 8, influence: 1, receptivity: 0.35, switchingCost: 0.6, intelligence: 0.5, weights: { revenue: 1, capability: 1.7, safety: 0.6, mission: 0.7 }, lastRoutine: 'lease' },
  { id: 'antropic', name: 'Antropic', cash: 80, compute: 4, capability: 2, product: 1, safety: 2, revenue: 8, influence: 1, receptivity: 0.75, switchingCost: 0.7, intelligence: 0.5, weights: { revenue: 1, capability: 1, safety: 1.6, mission: 1.3 }, lastRoutine: 'safety' }
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
  return scenario;
}
export function getScenario(id = 'core-12'): Scenario {
  if (id !== 'core-12' && id !== 'one-quarter') throw new Error('Unknown scenario');
  const scenario = structuredClone(fixture);
  if (id === 'one-quarter') { scenario.id = id; scenario.horizon = 1; scenario.actors = scenario.actors.slice(0, 2); scenario.title = 'The Last Race — first quarter'; }
  return validateScenario(scenario);
}
export function scenarioHash(scenario: Scenario): string { return hash(validateScenario(scenario)); }
