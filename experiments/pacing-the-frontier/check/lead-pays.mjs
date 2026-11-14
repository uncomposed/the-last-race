// Does a lead carry to the finish? Bot races on the same seeds under different sharing and catch-up knobs.
// It backs rows 13 and 14 of CLAIMS.md. Plain Node, no dependencies, about 20 s per run. Bot play only.
//   node experiments/pacing-the-frontier/check/lead-pays.mjs                  held-out seeds 5001 to 5400
//   node experiments/pacing-the-frontier/check/lead-pays.mjs 1 400            another seed block
//   node experiments/pacing-the-frontier/check/lead-pays.mjs 5001 400 --dose  catch-up strength, step by step
//
// Rosters: "standard" is the Custom bot in lab 0 against the Sprinter, Steward and Gambler. A "mirror" roster gives all four
// labs one policy and split, so only the start order (lab 0 in front, then 12, 24 and 36 behind) and each lab's own draws differ.
// Columns: "won" and "ext" are the shares of races with a winner and with extinction. The next three are, among races with a
// winner, how often the winner was the lab first across gap 1, first to half the track's length, and first across the
// singularity gap. With four equal labs, chance is 25%. "lead changes" is how often the first lab across a gap differs from
// the first across the gap before it.
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const args = process.argv.slice(2), dose = args.includes('--dose'), nums = args.filter(x => /^\d+$/.test(x)).map(Number);
const S0 = nums[0] || 5001, N = nums[1] || 400;
const L = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'prototype.html'), 'utf8').split('\n');
const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
if (a < 0 || b < a) { console.error('Could not find the simulation section in prototype.html'); process.exit(1); }
const win = {};
new Function('window', 'document', L.slice(a, b + 1).join('\n'))(win, {getElementById: () => null});
const PF = win.PF, K = PF.K, POL0 = JSON.parse(JSON.stringify(PF.POL));

const OFF = 1e9; // a refill divisor this large leaves the catch-up multiplier at 1
const CONDS = dose ? [
  ['catch-up doubled (divisor 25)', {share: 40, refill: 25}],
  ['default (divisor 50)', {share: 40, refill: 50}],
  ['catch-up halved (divisor 100)', {share: 40, refill: 100}],
  ['catch-up quartered (divisor 200)', {share: 40, refill: 200}],
  ['catch-up off', {share: 40, refill: OFF}],
] : [
  ['default (share 40, catch-up on)', {share: 40, refill: 50}],
  ['no share, catch-up on', {share: 0, refill: 50}],
  ['share 40, catch-up off', {share: 40, refill: OFF}],
  ['neither', {share: 0, refill: OFF}],
  ['strong (share 100, catch-up doubled)', {share: 100, refill: 25}],
];
const ROSTERS = ['standard', 'mirror-steward', 'mirror-gambler'];

function setRoster(name) {
  for (const k of Object.keys(POL0)) PF.POL[k] = JSON.parse(JSON.stringify(POL0[k]));
  if (name === 'standard') return;
  const kind = name.split('-')[1], base = JSON.parse(JSON.stringify(POL0[kind]));
  base.jit = 0; base.w = PF.KINDS[kind].w.map(x => x * 100);
  for (const k of Object.keys(POL0)) PF.POL[k] = JSON.parse(JSON.stringify(base));
}

function race(seed) {
  PF.newGame(seed, 'custom');
  const G = PF.G(), half = 0.5 * G.finish;
  let firstHalf = -1, guard = 0;
  while (!G.over && guard < 20000) {  // the same loop as PF.run
    PF.step(1 / 30); guard++;
    if (firstHalf < 0) { let bx = -1e9; for (const l of G.labs) if (l.x >= half && l.x > bx) { bx = l.x; firstHalf = l.id; } }
  }
  const r = G.result || {type: 'none'}, firsts = G.gaps.filter(g => !g.inner).map(g => g.crossedBy);
  let changes = 0, pairs = 0;
  for (let i = 1; i < firsts.length; i++) if (firsts[i] >= 0 && firsts[i - 1] >= 0) { pairs++; if (firsts[i] !== firsts[i - 1]) changes++; }
  return {type: r.type, wid: r.winner ? r.winner.id : -1, firstGap: firsts[0], firstHalf, firstSing: G.gaps[G.sing].crossedBy, changes, pairs};
}

const pct = (x, n) => n ? (100 * x / n).toFixed(1).padStart(5) : '  n/a';
const se = (x, n) => n ? (100 * Math.sqrt((x / n) * (1 - x / n) / n)).toFixed(1) : 'n/a';
for (const ros of ROSTERS) {
  setRoster(ros);
  const rows = {};
  console.log('\n== roster: ' + ros + ', seeds ' + S0 + ' to ' + (S0 + N - 1) + ', chill on');
  console.log('condition                             | won  | ext  | winner led gap 1 | winner led at half | winner led singularity | lead changes');
  for (const [name, kv] of CONDS) {
    Object.assign(K, kv);
    let won = 0, ext = 0, g1 = 0, half = 0, sg = 0, ch = 0, pr = 0; rows[name] = [];
    for (let s = S0; s < S0 + N; s++) {
      const r = race(s); rows[name].push(r);
      if (r.type === 'all') ext++;
      if (r.wid >= 0) { won++; if (r.wid === r.firstGap) g1++; if (r.wid === r.firstHalf) half++; if (r.wid === r.firstSing) sg++; }
      ch += r.changes; pr += r.pairs;
    }
    console.log(name.padEnd(37) + ' | ' + pct(won, N) + '| ' + pct(ext, N) + '| ' + pct(g1, won) + ' ±' + se(g1, won) + '      | ' +
      pct(half, won) + ' ±' + se(half, won) + '        | ' + pct(sg, won) + ' ±' + se(sg, won) + '            | ' + (pr ? (ch / pr).toFixed(2) : 'n/a'));
  }
  // paired on seed: where both conditions had a winner, the change in "winner led at half" against the default row
  const def = CONDS.find(c => c[0].startsWith('default'))[0];
  for (const [name] of CONDS) {
    if (name === def) continue;
    let n = 0, sum = 0, sq = 0;
    for (let i = 0; i < N; i++) {
      const p = rows[def][i], o = rows[name][i]; if (p.wid < 0 || o.wid < 0) continue;
      const d = (o.wid === o.firstHalf ? 1 : 0) - (p.wid === p.firstHalf ? 1 : 0); n++; sum += d; sq += d * d;
    }
    const m = sum / n, sd = Math.sqrt((sq / n - m * m) / n);
    console.log('  paired, winner led at half: ' + name.padEnd(37) + ' minus default = ' + (100 * m).toFixed(1).padStart(5) + ' points, SE ' + (100 * sd).toFixed(1) + ' (n ' + n + ')');
  }
}
