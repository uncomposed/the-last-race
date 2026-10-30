// Daily seed filter: node filter.mjs <label> <offStart> <count> <knobsJSON> <constsJSON> <timing>  -> filter-<label>.json and swap-<label>.json {date: seed}
// Candidate k of date ds: k = 0 is dailySeed(ds) (today's rule), k >= 1 is dailySeed(ds + '#' + k). The first candidate that passes is the day's seed.
import {writeFileSync} from 'node:fs';
import {feasible, FILTER} from './lesson.mjs';
import {GAME} from './bt.mjs';
import {dailyDates} from './common.mjs';
const [label, s0, cnt, kj, cj, timing] = process.argv.slice(2);
const knobs = JSON.parse(kj), consts = JSON.parse(cj), rows = [], swap = {}, fails = {};
for (const ds of dailyDates(+s0, +cnt)) {
  const tw = GAME.dailyBrief(ds).twist.name; let k = 0, f;
  for (; k < 30; k++) { const seed = GAME.dailySeed(k ? ds + '#' + k : ds); f = feasible(seed, knobs, consts, tw, timing); if (k === 0) for (const [why, bad] of Object.entries({infeasible: f.infeasible > 0, scrapeOnly: f.scrapeOnly > FILTER.maxScrapeOnly, nearMax: f.nearMaxShare > FILTER.maxNearMaxShare, nowarn: f.nowarn > FILTER.maxNowarn, stopBoxes: f.stopBoxes > FILTER.maxStopBoxes})) if (bad) fails[why] = (fails[why] || 0) + 1; if (f.pass) { swap[ds] = seed; break; } }
  rows.push({ds, tw, k, pass0: k === 0});
}
const n = rows.length, byTw = {};
for (const r of rows) { const b = byTw[r.tw] = byTw[r.tw] || {n: 0, pass0: 0, tries: 0}; b.n++; b.pass0 += r.pass0 ? 1 : 0; b.tries += r.k + 1; }
const sum = {label, FILTER, timing, n, pass0: +(rows.filter(r => r.pass0).length / n).toFixed(3), meanTries: +(rows.reduce((a, r) => a + r.k + 1, 0) / n).toFixed(2), maxTries: Math.max(...rows.map(r => r.k + 1)), failReasonsAtK0: fails, byTwist: byTw};
writeFileSync('filter-' + label + '.json', JSON.stringify({sum, rows})); writeFileSync('swap-' + label + '.json', JSON.stringify(swap));
console.log(JSON.stringify(sum));
