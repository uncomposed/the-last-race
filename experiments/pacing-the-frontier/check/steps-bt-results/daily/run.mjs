// Daily step-gap backtest driver (bot play only). Uses check/steps-bt.mjs (runRace, dailyConfig, GAME, PROBES) unchanged.
//   node run.mjs --start <day offset> --count N --steps 0|1 --variant name [--players a,b] [--chill 0|1] [--harness path] --out file.jsonl.gz
// One row per race: d (day offset), tw (twist), t (tier 1..3), p (player), o (outcome), sc/fa/sr/st/dis/ext.
// Variants: 'ship' = the date's twist as shipped; 'none' = no twist (all twist knobs at DEF); sensitivity and candidate variants below.
import {gzipSync} from 'node:zlib';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const a = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) a[av[i].slice(2)] = av[i + 1];
const H = await import(pathToFileURL(a.harness || new URL('../../steps-bt.mjs', import.meta.url).pathname).href);
const {runRace, dailyConfig, GAME, PROBES, K} = H;
const DEF = {barScale: 140, spill: 33, gapScale: 100, shareRiv: 0, airH: 15, strikes: 3, singGap: 100};
for (const k in DEF) if (K[k] !== DEF[k]) throw new Error('default drifted: ' + k);

// variant -> function(twistName, twistKnobs) => {knobs, consts}
const scaleOdds = f => ({p1: 4 * f, pstep: 10 * f, singOdds: 30 * f});
const V = {
  ship: () => ({}),
  none: () => ({knobs: DEF}),
  nowarn06: () => ({consts: {NOWARN: 0.06}}), nowarn20: () => ({consts: {NOWARN: 0.2}}),
  strikesM1: tw => ({knobs: {strikes: (tw.strikes || 3) - 1}}), strikesP1: tw => ({knobs: {strikes: (tw.strikes || 3) + 1}}),
  odds05: () => ({knobs: scaleOdds(0.5)}), odds15: () => ({knobs: scaleOdds(1.5)}),
};
// candidate step-gap adjustments: name -> {twist: overrides applied only on that twist's dates (others ship)}
const CAND = JSON.parse(a.cand || '{}');
// --base JSON: K knobs for every date (under the twist); --basec JSON: C constants for every date
const BASE = JSON.parse(a.base || '{}'), BASEC = JSON.parse(a.basec || '{}');
const vname = a.variant || 'ship';
const players = (a.players || ['custom', ...Object.keys(PROBES)].join(',')).split(',');
const steps = +a.steps, chill = a.chill !== undefined ? +a.chill : 0;
const addDays = (ds, n) => new Date(Date.parse(ds + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const d0 = GAME.BRIEFINGS[0].added;
const out = [];
for (let d = +a.start; d < +a.start + +a.count; d++) {
  const ds = addDays(d0, d), twName = GAME.dailyBrief(ds).twist.name, tw = GAME.TWISTS[twName] || {};
  let ov;
  if (vname === 'cand') ov = {knobs: Object.assign({}, BASE, tw, CAND[twName] || {}), consts: BASEC};
  else { if (!V[vname]) throw new Error('unknown variant ' + vname); ov = V[vname](tw); }
  for (let t = 0; t < 3; t++) for (const p of players) {
    const cfg = dailyConfig(ds, t, {chill, steps, knobs: ov.knobs, consts: ov.consts});
    const r = runRace(Object.assign({}, cfg, {player: p, dt: 1 / 30, jitter: null})), L = r.labs[0];
    out.push({d, tw: twName, t: t + 1, p, o: r.outcome, det: r.detail, sc: L.scrapes, fa: L.falls, sr: L.stopRev, st: L.strikes, dis: L.dissolved, ext: r.extinction ? 1 : 0, ct: L.crashTower});
  }
}
writeFileSync(a.out, gzipSync(out.map(x => JSON.stringify(x)).join('\n') + '\n'));
console.log(vname, 'steps', steps, 'start', a.start, 'count', a.count, 'rows', out.length, '->', a.out);
