// Bot-independent box feasibility. Imports the boxes copy of the harness (bt.mjs), so PF_PAGE=<patched page> runs a patched generator.
//
// Reference lab ("what a reasonable lab can have at that point of the race"): lab 0 played by a decent probe in STEPS-OFF races
// (pit gaps, same seeds and rosters), sampled the step before it reaches gap i's face: height pts[1], top speed TOP0+0.85*pts[2], speed v.
// Matched by gap index (the level), not by x: with steps on, box widths move everything after gap 0.
//
// Classes for one box (rise, W, level cap, runway = face minus the back limit a lab can reverse to, as backLimit in the page):
//   speed   at least half of the reference arrivals at that level clear it cleanly as they come (their h and v, jump peak at the face, u0 0.5)
//   stop    otherwise, a lab that stops and builds to its ceiling (h = cap, speed meter = cap) clears it cleanly with the run-up it can take
//           (v <= min(top, sqrt(2*ACC*runway)), best v in that range), jump peak at the face
//   scrape  otherwise, that stopped full lab at least reaches the far edge above the ground (a scrape, a strike)
//   infeasible  it falls even then
// u0 0.5 (peak at the face) is how bots press and what the "your jump now" bar assumes by hand; opts.u0 = 'best' searches it instead (sensitivity).
import {PF, PFX, K, C, GAME, configure, resetAll, dailyConfig} from './bt.mjs';

export const DECENT_DEFAULT = ['follower', 'twin', 'climber', 'runup'];

// timing models: 'peak' jump peak at the face (bots, and the "your jump now" bar by hand); 'chill' the auto-jump (0.3 s or 6 units before the face);
// 'window' (default) a press anywhere inside a window of at least WIN seconds clears it cleanly (a human with fair timing); 'best' perfect timing
export let WIN = 0.1; export function setWin(x) { WIN = x; }
export function outcome(v, h, w, r, u0) {
  const jd = PFX.jumpDur(v), a0 = h + PFX.arcY(u0);
  const alt = a0 >= r ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v;
  return alt >= r ? 0 : (alt > 0 ? 1 : 2);
}
function bestOutcome(v, h, w, r, mode) {
  const jd = PFX.jumpDur(v);
  if (mode === 'peak') return outcome(v, h, w, r, 0.5);
  if (/^u\d+$/.test(mode)) return outcome(v, h, w, r, +mode.slice(1) / 100);  // fixed timing, e.g. u25: 25% into the arc at the face
  if (mode === 'chill') return outcome(v, h, w, r, Math.min(1, Math.max(0.3, 6 / v) / jd));
  let b = 2, run = 0, best = 0;
  for (let k = 0; k <= 100; k++) { const o = outcome(v, h, w, r, k / 100); b = Math.min(b, o); if (o === 0) { run++; best = Math.max(best, run); } else run = 0; }
  if (mode === 'best') return b;
  return best * 0.01 * jd >= WIN ? 0 : (b === 2 ? 2 : 1);
}
// steps-off reference arrivals. cfgs: list of race configs ({seed, roster, knobs, chill, strikesYou}); players: probe names
export function collectRef(cfgs, players) {
  const ref = {};  // level -> [{h, top, v, p}]
  for (const c of cfgs) for (const p of players) {
    const kind = configure(Object.assign({}, c, {steps: 0, player: p}));
    PF.newGame(c.seed, kind, c.roster); const G = PF.G(), l = G.labs[0];
    let guard = 0;
    while (!G.over && guard++ < 20000) {
      const gi = l.gi, g = G.gaps[gi], s = {h: l.pts[1], top: C.TOP0 + 0.85 * l.pts[2], v: l.v, x: l.x};
      PF.step(1 / 30);
      if (g && s.x < g.x && (l.x >= g.x || l.gi > gi) && !g.inner) (ref[gi] = ref[gi] || []).push({h: s.h, top: s.top, v: s.v, p});
      if (l.out || l.done) break;
    }
    resetAll();
  }
  return ref;
}

// classify every box on one steps-on track. c: race config (seed, knobs, consts...). opts: {u0: 'window'|'peak'|'chill'|'best'}
export function classifyTrack(c, ref, opts = {}) {
  configure(Object.assign({}, c, {steps: 1, player: 'custom'}));
  PF.newGame(c.seed, 'custom', []);
  const G = PF.G(), T = G.world, out = [];
  for (let i = 0; i < G.gaps.length; i++) {
    const g = G.gaps[i]; if (!PFX.stepOn(g)) continue;
    const lv = g.inner ? T.n : i, cap = C.CAPS[lv];
    let lim = -60; for (const b of G.barriers) if (b.x < g.x) lim = Math.max(lim, b.x + C.BW + 2);
    if (i > 0) { const pg = G.gaps[i - 1]; lim = Math.max(lim, pg.x + pg.W + 10); }
    const runway = g.x - lim, top = C.TOP0 + 0.85 * cap, vmax = Math.min(top, Math.sqrt(2 * C.ACC * Math.max(runway - 8, 0)));
    const R = (ref[g.inner ? T.n : i] || ref[Math.min(i, Math.max(...Object.keys(ref).map(Number)))]) || [];
    let ok = 0; for (const s of R) if (bestOutcome(Math.max(s.v, 1), s.h, g.W, g.rise, opts.u0) === 0) ok++;
    const pSpeed = R.length ? ok / R.length : 0;
    let stopBest = 2, vClean = Infinity;
    for (const v of [...Array(Math.max(0, Math.floor(vmax) - 19)).keys()].map(k => k + 20).concat(vmax >= 20 ? [vmax] : [])) { const o = bestOutcome(v, cap, g.W, g.rise, opts.u0); if (o < stopBest) stopBest = o; if (o === 0 && v < vClean) vClean = v; }
    if (vmax < 20) stopBest = bestOutcome(Math.max(vmax, 1), cap, g.W, g.rise, opts.u0);
    const cls = pSpeed >= 0.5 ? 'speed' : (stopBest === 0 ? 'stop' : (stopBest === 1 ? 'scrape' : 'infeasible'));
    out.push({i, lv, cap, W: g.W, rise: g.rise, t: g.t, wd: g.wd, sing: !!g.sing, nowarn: !!g.nowarn, runway: Math.round(runway), vmax: Math.round(vmax),
      runupNeed: vClean === Infinity ? null : Math.round(vClean * vClean / (2 * C.ACC) + 8), pSpeed: Math.round(pSpeed * 1000) / 1000, cls});
  }
  resetAll();
  return out;
}
export const CLASSES = ['speed', 'stop', 'scrape', 'infeasible'];
export function tally(boxes) {
  const t = {n: boxes.length}; for (const k of CLASSES) t[k] = boxes.filter(b => b.cls === k).length; return t;
}
export {dailyConfig, GAME, K, C};
