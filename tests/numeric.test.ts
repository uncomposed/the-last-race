import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateBins, effectiveMean, mean, normalize, recomputeBelief, updateGrid } from '../src/beliefs.js';
import { assertFinite, canonical, clamp, hash, integer, interpolate, random, sum } from '../src/numeric.js';
import { getScenario, scenarioHash, validateScenario } from '../src/scenario.js';
import type { BeliefState, Evidence } from '../src/types.js';

const grid = getScenario().grid;
const belief = (): BeliefState => ({ prior: [...grid.prior], posterior: [...grid.prior], evidenceIds: [], override: null, diagnostics: [] });
const observation = (overrides: Partial<Evidence> = {}): Evidence => ({ id: 'e1', independentKey: 'event-1', quarter: 1, availableQuarter: 2, observerId: 'deepcent', sourceId: 'eval', topic: 'control', summary: 'synthetic fixture', likelihood: grid.support.map(x => 1 - x), credibility: 0.8, ambiguity: 0.25, receptivity: 0.4, visibility: 'covert', detected: true, flagged: true, processed: true, status: 'discounted', ...overrides });
function near(actual: number, expected: number) { assert.ok(Math.abs(actual - expected) < 1e-14, `${actual} differs from ${expected}`); }

test('canonical JSON sorts keys, canonicalizes negative zero, and rejects unsafe values', () => {
  assert.equal(canonical({ z: -0, a: [true, null, 'x'] }), '{"a":[true,null,"x"],"z":0}');
  assert.equal(hash({ a: 1, b: 2 }), hash({ b: 2, a: 1 }));
  for (const value of [undefined, NaN, Infinity, -Infinity, 1n, () => 1, new Date(), [undefined], Array(1)]) assert.throws(() => canonical(value));
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
  assert.throws(() => canonical(cycle));
  const shared = { n: 1 }; assert.equal(canonical([shared, shared]), '[{"n":1},{"n":1}]');
});

test('ordered arithmetic and safe-integer boundaries are explicit', () => {
  assert.equal(sum([1e16, 1, -1e16]), 0);
  assert.equal(sum([1e16, -1e16, 1]), 1);
  assert.equal(integer(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
  assert.equal(Object.is(integer(-0), -0), false);
  for (const value of [0.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) assert.throws(() => integer(value));
  assert.throws(() => assertFinite(Infinity)); assert.throws(() => sum([Number.MAX_VALUE, Number.MAX_VALUE]));
  assert.equal(clamp(1, 1, 1), 1); assert.equal(clamp(-1, 0, 1), 0); assert.equal(clamp(2, 0, 1), 1);
  assert.throws(() => clamp(0, 2, 1)); assert.throws(() => clamp(NaN, 0, 1));
});

test('piecewise interpolation has deterministic knots and endpoint handling', () => {
  const table: Array<[number, number]> = [[0, 0], [4, 0.25], [8, 1]];
  assert.equal(interpolate(table, -1), 0); assert.equal(interpolate(table, 4), 0.25);
  assert.equal(interpolate(table, 6), 0.625); assert.equal(interpolate(table, 20), 1);
  assert.equal(interpolate([[1, 2]], 0), 2);
  for (const invalid of [[], [[0, 1], [0, 2]], [[1, 1], [0, 2]]] as Array<Array<[number, number]>>) assert.throws(() => interpolate(invalid, 0));
  assert.throws(() => interpolate(table, NaN));
});

test('keyed random draws are reproducible, order-independent and bounded', () => {
  const first = random('seed', 'event:a'); random('seed', 'event:b');
  assert.equal(random('seed', 'event:a'), first);
  assert.notEqual(first, random('other-seed', 'event:a'));
  for (let i = 0; i < 1000; i++) { const draw = random('fixture', `event:${i}`); assert.ok(draw >= 0 && draw < 1); }
});

test('20-point grid update independently enumerates every support point', () => {
  const likelihood = grid.support.map(x => 0.1 + x * 1.7);
  const result = updateGrid(grid.prior, likelihood, 0.8, 0.25, 0.4);
  const weighted = grid.prior.map((p, i) => p * (1 + 0.8 * (1 - 0.25) * 0.4 * (likelihood[i] - 1)));
  let total = 0; for (const weight of weighted) total += weight;
  result.probabilities.forEach((p, i) => near(p, weighted[i] / total));
  near(sum(result.probabilities), 1); assert.equal(result.incompatible, false);
  updateGrid(grid.prior, likelihood, 1, 0, 0).probabilities.forEach((p, i) => near(p, normalize(grid.prior).probabilities[i]));
  updateGrid(grid.prior, likelihood, 1, 1, 1).probabilities.forEach((p, i) => near(p, normalize(grid.prior).probabilities[i]));
});

test('zero likelihood retains prior and records incompatibility; malformed evidence rejects', () => {
  const prior = normalize(grid.support).probabilities;
  const result = updateGrid(prior, Array(20).fill(0), 1, 0, 1);
  assert.deepEqual(result.probabilities, normalize(prior).probabilities); assert.equal(result.incompatible, true);
  assert.throws(() => normalize([0, 0])); assert.throws(() => normalize([-1, 2]));
  assert.throws(() => normalize([0, 0], [1, -0.1]));
  for (const bad of [NaN, Infinity, -0.1, 1.1]) assert.throws(() => updateGrid(grid.prior, grid.prior, bad, 0, 1));
  assert.throws(() => updateGrid(grid.prior, [1], 1, 0, 1));
  assert.throws(() => updateGrid(grid.prior, Array(20).fill(-1), 1, 0, 1));
  const revised = recomputeBelief(grid, belief(), [observation({ likelihood: Array(20).fill(0), credibility: 1, ambiguity: 0, receptivity: 1 })]);
  assert.equal(revised.diagnostics.length, 1); assert.match(revised.diagnostics[0], /Incompatible observation e1/);
});

test('five contiguous bins aggregate mass and give boundary points one owner', () => {
  const uniform = aggregateBins(grid, grid.prior);
  uniform.forEach(p => near(p, 0.2)); near(sum(uniform), 1);
  for (const [point, bin] of [[0.2, 0], [0.4, 1], [0.6, 2], [0.8, 3], [1, 4]]) {
    const mass = grid.support.map(x => x === point ? 1 : 0);
    const bins = aggregateBins(grid, mass); assert.equal(bins[bin], 1); assert.equal(sum(bins), 1);
  }
  near(mean(grid, grid.prior), 0.525);
  assert.throws(() => aggregateBins(grid, [1]));
});

test('evidence dedup, detect and processing gates, replacement, and four-quarter conviction', () => {
  const e1 = observation();
  const base = recomputeBelief(grid, belief(), [e1]);
  const duplicates = recomputeBelief(grid, belief(), [observation({ id: 'repeat', independentKey: 'event-1', quarter: 2 }), e1, e1]);
  assert.deepEqual(duplicates, base);
  assert.deepEqual(recomputeBelief(grid, belief(), [observation({ detected: false }), observation({ id: 'e2', independentKey: 'event-2', processed: false })]).posterior, normalize(grid.prior).probabilities);
  const revised = recomputeBelief(grid, base, [observation({ receptivity: 1 })]);
  revised.posterior.forEach((p, i) => near(p, updateGrid(grid.prior, e1.likelihood, e1.credibility, e1.ambiguity, 1).probabilities[i]));
  assert.equal(revised.evidenceIds.length, 1);
  assert.notDeepEqual(revised.posterior, updateGrid(base.posterior, e1.likelihood, e1.credibility, e1.ambiguity, 1).probabilities);
  revised.override = { topic: 'control', conviction: 0.9, startQuarter: 2, expiresQuarter: 6 };
  for (const quarter of [2, 3, 4, 5]) assert.equal(effectiveMean(grid, revised, quarter), 0.9);
  near(effectiveMean(grid, revised, 1), mean(grid, revised.posterior));
  near(effectiveMean(grid, revised, 6), mean(grid, revised.posterior));
});

test('scenario records are validated, synthetic and cloned', () => {
  const a = getScenario(); const b = getScenario(); const initial = scenarioHash(b);
  a.actors[0].cash = 0; a.grid.prior[0] = 1; assert.equal(scenarioHash(b), initial);
  assert.equal(b.grid.support.length, 20); assert.equal(b.grid.binEdges.length, 6);
  assert.equal(b.provenance.kind, 'synthetic'); assert.equal(getScenario('one-quarter').horizon, 1);
  assert.throws(() => getScenario('not-a-scenario')); const malformed = structuredClone(b); malformed.costs.ship = 0.5;
  assert.throws(() => validateScenario(malformed));
});
