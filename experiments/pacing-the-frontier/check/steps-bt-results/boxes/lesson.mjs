// Lesson catalog and lesson-seed search for step-gap dailies.
//   node lesson.mjs scan  <kind> <offStart> <count> <out> [knobsJSON] [constsJSON] [pairs]   mean strategy-vs-foil gaps on a date block (calibration)
//   node lesson.mjs search <kind> <offStart> <count> <out> [knobsJSON] [constsJSON] [timing]  per-seed pass/fail (feasibility + lesson, cal and held noise)
// A seed is evaluated under the briefing kind's own twist (not the date's), all its lesson tiers, steps on, chill off.
// Player noise: probes get harness jitter z = noise id (pace +-0.05, weights +-5) and the rival/roll streams get NZ = noise id.
// Calibration noise ids 1..NC, held-out noise ids 101..100+NH. "Smart" (stop and build) is the tuning agent's box-competent probe (copy).
import {writeFileSync} from 'node:fs';
import {runRace, dailyConfig, GAME, trackStats} from './bt.mjs';
import {runBoxRace} from './boxprobe-copy.mjs';
import {classifyTrack} from './feas.mjs';
import {dailyDates} from './common.mjs';
import {readFileSync} from 'node:fs';

// kind -> twist name, lesson in plain words, strategy, foil, tiers (0 solo, 1 vs Steward, 2 vs Sprinter+Steward)
export const LESSONS = {
  barrier: {twist: 'Hard Lessons', strat: 'climber', foil: 'drafter', tiers: [1, 2],
    say: 'When nobody shares lessons, build your own height. Drafting behind a climber gets you nothing.'},
  strike: {twist: 'Only 2 Strikes', strat: 'runup', foil: 'bold', tiers: [0, 1, 2],
    say: 'With fewer strikes, slow down and build before each box. Diving in and scraping loses the run.'},
  race: {twist: 'Only 2 Strikes', strat: 'runup', foil: 'rush', tiers: [0, 1, 2],
    say: 'Cut safety to go faster and you get dissolved. The careful lab finishes.'},
  gap: {twist: 'Wider Gaps', strat: 'smart', foil: 'rush', tiers: [0, 1, 2],
    say: 'Wide gaps reward stopping to build height. Carrying speed in costs strikes.'},
  shadow: {twist: 'Rivals Copy You More', strat: 'follower', foil: 'rush', tiers: [1, 2],
    say: 'When rivals copy the leader, leading early feeds them. Let them lead, then pass.'},
  singularity: {twist: 'Wider Singularity', strat: 'climber', foil: 'rush', tiers: [0, 1, 2],
    say: 'Build for the last leap before you take it. Arriving fast and short ends the run.'},
};
export const NC = 6, NH = 6;
const twistKnobs = name => GAME.TWISTS[name] || {};
function race(seed, t, p, z, knobs, consts, tw) {
  const base = dailyConfig('2026-10-28', t, {steps: 1});  // roster and strikes only; seed, twist and knobs replaced below
  const c = Object.assign({}, base, {seed, knobs: Object.assign({}, twistKnobs(tw), knobs), consts, steps: 1, chill: 0});
  if (p.startsWith('smart')) return runBoxRace(Object.assign({}, c, {nz: z}), {mode: 'smart', base: p.split(':')[1] || null}).win;
  return runRace(Object.assign({}, c, {player: p, nz: z, jitter: z})).outcome === 'win' ? 1 : 0;
}
// paired per (tier, noise id) differences strat - foil
export function lessonGap(seed, L, ids, knobs, consts) {
  const d = [];
  for (const t of L.tiers) for (const z of ids) d.push(race(seed, t, L.strat, z, knobs, consts, L.twist) - race(seed, t, L.foil, z, knobs, consts, L.twist));
  const n = d.length, m = d.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(n - 1, 1));
  return {m, se: sd / Math.sqrt(n), n};
}
// feasibility filter on one track (classes under a timing model; near-max and no-warning from trackStats)
export const FILTER = {maxNearMaxShare: 0.2, maxNowarn: 1, maxStopBoxes: 3, maxScrapeOnly: 0};
let REF = null;
export function feasible(seed, knobs, consts, tw, timing) {
  REF = REF || JSON.parse(readFileSync(new URL('./ref-cal.json', import.meta.url), 'utf8'));
  const c = {seed, roster: [], chill: 0, knobs: Object.assign({}, twistKnobs(tw), knobs), consts};
  const b = classifyTrack(c, REF, {u0: timing}), ts = trackStats(Object.assign({}, c, {steps: 1}));
  const st = ts.boxes.filter(x => x.shape), nm = st.filter(x => x.nearMax).length;
  const r = {n: b.length, infeasible: b.filter(x => x.cls === 'infeasible').length, scrapeOnly: b.filter(x => x.cls === 'scrape').length,
    stopBoxes: b.filter(x => x.cls === 'stop' || x.cls === 'scrape').length, nearMaxShare: st.length ? nm / st.length : 0, nowarn: ts.nowarn};
  r.pass = r.infeasible === 0 && r.scrapeOnly <= FILTER.maxScrapeOnly && r.nearMaxShare <= FILTER.maxNearMaxShare && r.nowarn <= FILTER.maxNowarn && r.stopBoxes <= FILTER.maxStopBoxes;
  return r;
}
const range = (a, n) => [...Array(n).keys()].map(k => a + k);
function main() {
  const [mode, kind, s0, cnt, out, kj, cj, extra] = process.argv.slice(2);
  const knobs = JSON.parse(kj || '{}'), consts = JSON.parse(cj || '{}'), seeds = dailyDates(+s0, +cnt).map(ds => GAME.dailySeed(ds));
  if (mode === 'scan') {  // mean gap for candidate pairs over a block, calibration noise only
    const pairs = (extra || '').split(',').filter(Boolean).map(x => x.split('>'));
    const L0 = LESSONS[kind], res = {};
    for (const [s, f] of pairs.length ? pairs : [[L0.strat, L0.foil]]) {
      const L = Object.assign({}, L0, {strat: s, foil: f}); let sw = 0, n = 0, all = [];
      for (const seed of seeds) { const g = lessonGap(seed, L, range(1, 2), knobs, consts); all.push(g.m); }
      const m = all.reduce((a, b) => a + b, 0) / all.length, sd = Math.sqrt(all.reduce((a, b) => a + (b - m) ** 2, 0) / (all.length - 1));
      res[s + '>' + f] = {mean: +m.toFixed(3), se: +(sd / Math.sqrt(all.length)).toFixed(3), seeds: all.length};
    }
    writeFileSync(out, JSON.stringify({kind, knobs, consts, res}));
    console.log(kind, JSON.stringify(res));
    return;
  }
  // search: per seed, feasibility then the lesson on calibration noise ids, then on held-out noise ids
  const L = LESSONS[kind], timing = extra || 'u25', rows = [];
  for (const seed of seeds) {
    const f = feasible(seed, knobs, consts, L.twist, timing);
    const gc = lessonGap(seed, L, range(1, NC), knobs, consts);
    const passC = gc.m > 0 && gc.m >= 3 * gc.se && gc.se > 0 || (gc.m > 0 && gc.se === 0);
    let gh = null, passH = false;
    if (passC) { gh = lessonGap(seed, L, range(101, NH), knobs, consts); passH = gh.m > 0 && (gh.m >= 3 * gh.se || gh.se === 0); }
    rows.push({seed, feas: f, gc, gh, passC, passH, lesson: passC && passH, pass: f.pass && passC && passH});
  }
  const n = rows.length, sh = k => +(rows.filter(r => r[k]).length / n).toFixed(3);
  const sum = {kind, twist: L.twist, strat: L.strat, foil: L.foil, tiers: L.tiers, n, feasPass: +(rows.filter(r => r.feas.pass).length / n).toFixed(3), lessonCal: sh('passC'), lesson: sh('lesson'), pass: sh('pass'),
    meanGapCal: +(rows.reduce((a, r) => a + r.gc.m, 0) / n).toFixed(3)};
  writeFileSync(out, JSON.stringify({sum, knobs, consts, timing, rows}));
  console.log(JSON.stringify(sum));
}
if (process.argv[1] && process.argv[1].endsWith('lesson.mjs')) main();
