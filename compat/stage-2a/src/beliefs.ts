import type { BeliefState, Evidence, Grid } from './types.js';
import { assertFinite, sum } from './numeric.js';

function probability(value: number, name: string): void {
  assertFinite(value, name);
  if (value < 0 || value > 1) throw new Error(`${name} must be in [0, 1]`);
}
export function normalize(weights: number[], fallback?: number[]): { probabilities: number[]; incompatible: boolean } {
  if (!weights.length) throw new Error('Empty distribution');
  for (const weight of weights) if (assertFinite(weight) < 0) throw new Error('Negative weight');
  const total = sum(weights);
  if (total === 0) {
    if (!fallback || fallback.length !== weights.length || sum(fallback) <= 0) throw new Error('Zero mass requires a valid prior');
    return { probabilities: normalize(fallback).probabilities, incompatible: true };
  }
  return { probabilities: weights.map(weight => assertFinite(weight / total)), incompatible: false };
}
export function updateGrid(prior: number[], likelihood: number[], credibility: number, ambiguity: number, receptivity: number) {
  if (prior.length !== likelihood.length) throw new Error('Likelihood grid size mismatch');
  probability(credibility, 'credibility'); probability(ambiguity, 'ambiguity'); probability(receptivity, 'receptivity');
  const normalized = normalize(prior).probabilities;
  const admitted = credibility * (1 - ambiguity) * receptivity;
  const weights = normalized.map((p, i) => {
    const likelihoodValue = assertFinite(likelihood[i]);
    if (likelihoodValue < 0) throw new Error('Negative likelihood');
    return p * (1 + admitted * (likelihoodValue - 1));
  });
  return normalize(weights, normalized);
}
export function aggregateBins(grid: Grid, posterior: number[]): number[] {
  if (posterior.length !== grid.support.length || grid.binEdges.length !== 6) throw new Error('Invalid display grid');
  const normalized = normalize(posterior).probabilities;
  const bins = [0, 0, 0, 0, 0];
  for (let i = 0; i < grid.support.length; i++) {
    const point = grid.support[i];
    let bin = 0;
    while (bin < 4 && point > grid.binEdges[bin + 1]) bin++;
    if (point < grid.binEdges[0] || point > grid.binEdges[5]) throw new Error('Support outside display bins');
    bins[bin] += normalized[i];
  }
  return bins;
}
export function mean(grid: Grid, posterior: number[]): number {
  if (posterior.length !== grid.support.length) throw new Error('Posterior grid size mismatch');
  return sum(normalize(posterior).probabilities.map((p, i) => p * grid.support[i]));
}
export function effectiveMean(grid: Grid, belief: BeliefState, quarter: number): number {
  if (belief.override && quarter >= belief.override.startQuarter && quarter < belief.override.expiresQuarter) return belief.override.conviction;
  return mean(grid, belief.posterior);
}
export function recomputeBelief(grid: Grid, belief: BeliefState, evidence: Evidence[]): BeliefState {
  let posterior = normalize(belief.prior).probabilities;
  const ids: string[] = []; const seen = new Set<string>(); const diagnostics: string[] = [];
  const ordered = evidence.filter(e => e.detected && e.processed && e.topic === grid.id)
    .sort((a, b) => a.quarter - b.quarter || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const item of ordered) {
    if (seen.has(item.independentKey)) continue;
    seen.add(item.independentKey);
    const result = updateGrid(posterior, item.likelihood, item.credibility, item.ambiguity, item.receptivity);
    posterior = result.probabilities; ids.push(item.id);
    if (result.incompatible) diagnostics.push(`Incompatible observation ${item.id}: retained prior mass.`);
  }
  return { prior: [...belief.prior], posterior, evidenceIds: ids, override: belief.override ? { ...belief.override } : null, diagnostics };
}
