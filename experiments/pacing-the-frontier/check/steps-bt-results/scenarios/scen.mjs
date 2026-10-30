// Scenario tracks: hand-written step-gap tracks (or a patched generator) run through the auditor's race() on page-scen.html
// (= audit/page-timing.html, bots press 25% into the arc, plus one hook: globalThis.SCEN(T, H) after setRises rewrites the track).
//   import {run, buildTrack} from './scen.mjs'
// Track spec (build): {segs:[{L, bars:[h|frac], runup, rise (frac of cap), wf (width x stop-and-build fit) | W (abs), after}], stretch, sbars}
// The last seg is the singularity. Level of gap i = i, cap C.CAPS[i]. Barrier h > 3 is absolute, else a fraction of the generator's
// reference barrier (JUMP+HREF0+HREF1*s)*barScale/100.
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
process.env.PF_PAGE = join(HERE, 'page-scen.html');
const R = await import('../audit/race.mjs');
const H = await import('../audit/bt.mjs');
export const {PF, PFX, K, C} = H;
export const race = R.race;
// arrival log: lab 0's height, speed meter, speed and cap when it reaches each box face (wraps PF.step; read-only)
let ARR = [], FLAT = false;
const step0 = PF.step;
PF.step = function (dt) { const G = PF.G(), l = G.labs[0], had = !!l.gx; const r = step0(dt); if (FLAT && !l.out && !l.done && !l.bounce && !(l.crash > 0)) { const g = G.gaps[l.gi]; if (g && g.rise > 0 && g.x - l.x < 160 && g.x - l.x > -1) { const T = PFX.jumpDur && (C.TOP0 + 0.85 * l.pts[2]); const cs = l.capUntil > l.x ? Math.sqrt(2 * C.DEC * (C.SIGHT0 + 4.4 * l.pts[0])) : Infinity; l.v = Math.min(T, cs, Math.max(l.v, l.v + C.ACC * dt)); } } if (!had && l.gx && !ARR[l.gx.gi]) ARR[l.gx.gi] = {h: Math.round(l.pts[1]), m: Math.round(l.pts[2]), v: Math.round(l.gx.vf), cap: Math.round(l.cap), a0: Math.round(l.gx.alt), side: l.gx.side ? 1 : 0}; return r; };

export function buildTrack(spec, T, X) {
  const C = X.C, K = X.K, n = spec.segs.length;
  const gate = 175, bars = [{x: gate, h: C.JUMP + 18, pub: true, gate: true, seg: 0}], gaps = [];
  let x = gate + C.BW + 60;
  spec.segs.forEach((s, i) => {
    const cap = C.CAPS[i], hcap = cap + C.JUMP - 6, ref = (C.JUMP + C.HREF0 + C.HREF1 * i) * K.barScale / 100;
    const L = s.L ?? 200, bl = s.bars ?? [0.75, 0.85];
    bl.forEach((h, j) => { const bx = Math.round(x + (j + 0.5) / bl.length * L); bars.push({x: bx, h: Math.round(Math.min(h > 3 ? h : h * ref, hcap) * 10) / 10, pub: false, seg: i}); });
    if (s.barAt !== undefined) bars.push({x: Math.round(x + L + (s.runup ?? 170) - s.barAt), h: Math.min(s.barH > 3 ? s.barH : (s.barH ?? 0.9) * ref, hcap), pub: false, seg: i});
    bars.sort((a, b) => a.x - b.x);
    const gx = Math.round(x + L + (s.runup ?? 170));
    const rise = Math.round(Math.min((s.rise ?? 0.55) * cap, Math.min(C.RISEMAX * cap, cap + 0.5 * C.JUMP)));
    // stop-and-build reference fit: the widest box a lab at its ceiling clears at the run-up speed it gets from the back limit (as BOXFIT)
    let lim = -60; for (const b of bars) if (b.x < gx) lim = Math.max(lim, b.x + C.BW + 2);
    if (i > 0) lim = Math.max(lim, gaps[i - 1].x + gaps[i - 1].W + 10);
    const vrun = Math.min(C.TOP0 + 0.85 * cap * K.stepV / 100, Math.sqrt(2 * C.ACC * Math.max(gx - lim - 8, 0)));
    const fit = X.boxFit(cap, rise, vrun);
    const W = Math.max(30, Math.round(s.W ?? (s.wf ?? 0.8) * fit));
    gaps.push({x: gx, W, crossedBy: -1, stepH: 0, pub: false, sing: i === n - 1, rise, t: s.rise ?? 0.55, wd: 0.5, nowarn: !!s.nowarn, fit: Math.round(fit), vrun: Math.round(vrun)});
    x = gx + W + (s.after ?? 40);
  });
  const x0 = x, Lb = spec.stretch ?? 900, sb = spec.sbars ?? [0.8, 0.9, 0.8];
  sb.forEach((h, j) => { const ref = (C.JUMP + C.HREF0 + C.HREF1 * n) * K.barScale / 100; bars.push({x: Math.round(x0 + (j + 0.5) / sb.length * Lb), h: Math.round(Math.min(h * ref, C.CAPS[n] + C.JUMP - 6)), pub: false, seg: n}); });
  Object.assign(T, {gaps, bars, finish: Math.round(x0 + Lb + 50), n, sing: n - 1, x0, ni: 0, A: 0.1, sig: 'scenario', label: 'scenario', lean: 0});
}

export const PLAYERS = (process.env.PLAYERS ? process.env.PLAYERS.split(',') : null) || ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin', 'crawl', 'smart'];
// One race; returns race()'s row plus per-gap outcome letters for the player (C clean, S scrape, F fall, - not reached) and rival box tallies
export function one(scen, player, z, opts = {}) {
  globalThis.SCEN = scen; ARR = []; FLAT = player === 'flat'; if (FLAT) player = 'rush';
  const seed = (opts.seed0 ?? 5000) + z;
  const row = race({seed, steps: 1, roster: opts.roster ?? null, chill: 0, strikesYou: opts.strikesYou ?? null, nz: z, jitter: z, knobs: opts.knobs, consts: opts.consts}, player);
  const G = PF.G(), ng = G.gaps.length;
  const per = id => { const o = Array(ng).fill('-'); for (const e of G.ev) { if (e.id !== id || !e.gap) continue; const k = e.gap - 1;
    if (e.type === 'first' || e.type === 'cross') { if (o[k] === '-') o[k] = 'C'; } else if (e.type === 'scrape' || e.type === 'drop') o[k] = 'S'; else if (e.type === 'fall') o[k] = 'F'; } return o.join(''); };
  row.bx = per(0); row.rbx = G.labs.slice(1).map(l => per(l.id));
  row.W = G.gaps.map(g => g.W); row.rise = G.gaps.map(g => g.rise); row.cap = G.gaps.map((g, i) => C.CAPS[g.inner ? G.world.n : i]);
  row.arr = ARR.slice(); if (FLAT) row.p = 'flat'; FLAT = false; globalThis.SCEN = null;
  return row;
}
