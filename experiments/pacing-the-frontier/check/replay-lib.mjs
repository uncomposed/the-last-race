// Shared by replay-check.mjs: loads the game's simulation from prototype.html, replays a recorded run at the live game's 1/60 s step,
// and drives a headless "player" through the same input path the page uses so a run can be recorded without a browser.
// Plain Node, no dependencies. The browser page check/replay-browser.html embeds this same replay code (see replay-check.mjs --html).
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const pagePath = join(here, '..', 'prototype.html');

// The simulation section, cut exactly as sim-check does: from `function $(id)` to `window.PF={`.
export function loadPage(path = pagePath) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const a = lines.findIndex(l => l.startsWith('function $(id)')), b = lines.findIndex(l => l.startsWith('window.PF={'));
  if (a < 0 || b < a) throw new Error('Could not find the simulation section in prototype.html');
  const sim = lines.slice(a, b + 1).join('\n');
  return {lines, sim, simHash: createHash('sha256').update(sim).digest('hex')};
}

// The daily constants and functions (pure, no DOM), cut the way the server's vendor script does.
export function dailyApi(lines) {
  const at = (pred, from = 0) => { const i = lines.findIndex((l, k) => k >= from && pred(l)); if (i < 0) throw new Error('daily section not found'); return i; };
  const c0 = at(l => l.startsWith('var BRIEFINGS=[')), c1 = at(l => l.startsWith('var DAILY_KEY='), c0);
  const f0 = at(l => l.startsWith('function dailySeed(')), f1 = at(l => l.startsWith('function dailyTwist('), f0);
  const text = lines.slice(c0, c1).join('\n') + '\n' + lines.slice(f0, f1 + 1).join('\n');
  return new Function(text + '\nreturn {dailySeed,dailyBrief,dailyTwist,DAILY_TIERS};')();
}

// Top-level names the replay and the driver read from the simulation. Each is optional.
const EXPOSE = ['dsin', 'dcos', 'dlog', 'dexp', 'K', 'DEF', 'C', 'heightOf', 'jumpDur', 'topSpeed', 'accOf', 'needSpeed', 'knowsGap', 'knowsBar', 'capped', 'backLimit', 'inSing'];
const TAIL = '\nreturn {PF: window.PF, get G() { return G; }, ' +
  EXPOSE.map(n => n + ': (typeof ' + n + " !== 'undefined' ? " + n + ' : undefined)').join(', ') + '};';

// A compiled simulation. fresh() gives a new instance with its own G, K and so on, so no state leaks between replays.
export function compileSim(simText) {
  const f = new Function('window', 'document', simText + TAIL);
  return () => { const ctx = f({}, null); return {ctx, PF: ctx.PF}; };
}

export class ReplayError extends Error {}

// replay(fresh, log) -> {type, won, t, x, ticks, chill}. It mirrors the live frame loop (prototype.html, frame()):
//   syncInput, ghRec, recTick, stepGame(1/60), recAfter.
//   - K starts at the sim's defaults (DEF), then the header's knob overrides; K.chill starts at the header's chill;
//   - the player's strike limit is the header's pstrikes; the rivals are the header's roster;
//   - before tick n, every logged input with tick n is applied to G.input. An `auto` input is also copied into K.chill, because the
//     sim reads the knob K.chill, not the input (the page's checkbox sets both at once);
//   - a `jump` input sets G.input.jump, a pulse the sim clears itself once the player's lab has used it.
// Pausing needs nothing: a paused game does not step.
export function replay(fresh, log) {
  const {ctx, PF} = fresh();
  const h = log.h, K = ctx.K, DEF = ctx.DEF;
  for (const k in DEF) K[k] = DEF[k];
  for (const k of Object.keys(h.knobs)) {
    if (k === 'chill' || !Object.hasOwn(DEF, k)) throw new ReplayError('Unknown knob ' + k);
    K[k] = h.knobs[k];
  }
  K.chill = h.chill ? 1 : 0;
  PF.setRoster(null);
  PF.setPlayerStrikes(h.pstrikes);
  PF.newGame(h.seed, h.human ? undefined : 'custom', h.roster.slice());
  const G = PF.G();
  const live = G.labs.filter(l => l.id > 0).map(l => l.kind);
  if (live.join() !== h.roster.join()) throw new ReplayError('The roster does not match the rivals this seed produces');
  const inputs = log.inputs, maxTicks = Math.ceil(ctx.C.TLIMIT * 60) + 120;
  let k = 0, n = 0, chillUsed = !!K.chill;
  while (!G.over) {
    if (n >= maxTicks) throw new ReplayError('The race did not end within the time limit');
    while (k < inputs.length && inputs[k][0] === n) {
      const [, f, v] = inputs[k++], I = G.input;
      if (f === 'pace') I.pace = v;
      else if (f === 'w') I.w = v.slice();
      else if (f === 'auto') { I.auto = !!v; K.chill = v ? 1 : 0; if (v) chillUsed = true; }
      else if (f === 'rev') I.rev = !!v;
      else if (f === 'fwd') I.fwd = !!v;
      else if (f === 'jump') I.jump = true;
    }
    PF.step(1 / 60);
    n++;
  }
  if (k < inputs.length) throw new ReplayError('The log has inputs after the race ended');
  const hm = G.labs[0], r = G.result || {type: 'none'};
  return {type: r.type, won: r.type === 'win' && r.winner === hm, t: Math.round(G.t * 1000) / 1000, x: Math.round(hm.x), ticks: n, chill: chillUsed || !!K.chill};
}

function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// recordDaily({fresh, daily, simHash, date, tier (0-based), chill (0|1 at Go), toggleChillAt (tick|null), player (script seed),
//              jumpSkill (0..1), mash (press jump on every tick near an obstacle), oldJumpLog (the page's old recTick, for a test)}) -> log
// It records the way the page's recStart / recTick / recAfter / recEnd do. The player is a seeded script that changes the controls the
// way the page's UI does: it edits `ui` between frames, the chill checkbox sets ui.auto and K.chill together, and a jump key sets
// G.input.jump directly (doJump). Each tick then runs, as in frame(): syncInput(); recTick(); stepGame(1/60); recAfter().
export function recordDaily(opts) {
  const {fresh, daily, simHash, date, tier} = opts;
  const {ctx, PF} = fresh();
  const K = ctx.K, DEF = ctx.DEF, C = ctx.C;
  // start(): dailyPrep -> campLock (every knob but chill back to DEF), PSTRIKES=null, then the day's twist
  for (const k in DEF) if (k !== 'chill') K[k] = DEF[k];
  K.chill = opts.chill ? 1 : 0;
  PF.setPlayerStrikes(null);
  const tw = daily.dailyTwist(daily.dailyBrief(date));
  for (const k in tw) K[k] = tw[k];
  PF.newGame(daily.dailySeed(date), undefined, daily.DAILY_TIERS[tier].roster.slice());
  const G = PF.G();
  const ui = {pace: 70, w: [25, 50, 25], auto: !!K.chill, rev: false, fwd: false};
  let chillUsed = !!K.chill;
  const ko = {};
  for (const k in K) if (k !== 'chill' && K[k] !== DEF[k]) ko[k] = K[k];
  const REC = {h: {v: 1, sim: simHash, seed: G.seed, mode: 'daily', date, tier, map: null,
    roster: G.labs.filter(l => l.id > 0).map(l => l.kind), knobs: ko, pstrikes: null, chill: K.chill, human: !!G.labs[0].human, dt: 1 / 60,
    fields: ['tick', 'field', 'value']}, inputs: [], tick: 0, last: null};
  const syncInput = () => { G.input.pace = ui.pace / 100; G.input.w = ui.w; G.input.auto = ui.auto; G.input.rev = ui.rev; G.input.fwd = ui.fwd; };
  const recTick = () => {
    const i = G.input, p = REC.last, n = REC.tick++, L = REC.inputs;
    if (!p || p.pace !== i.pace) L.push([n, 'pace', i.pace]);
    if (!p || p.w.join() !== i.w.join()) L.push([n, 'w', i.w.slice()]);
    if (!p || p.auto !== i.auto) L.push([n, 'auto', i.auto ? 1 : 0]);
    if (!p || p.rev !== i.rev) L.push([n, 'rev', i.rev ? 1 : 0]);
    if (!p || p.fwd !== i.fwd) L.push([n, 'fwd', i.fwd ? 1 : 0]);
    if (i.jump && !(p && p.jump)) L.push([n, 'jump', 1]);
    REC.last = {pace: i.pace, w: i.w.slice(), auto: i.auto, rev: i.rev, fwd: i.fwd, jump: i.jump};
  };
  // the page's recAfter; the old recTick (a test only) had no such step, so its `last.jump` stayed as the tick saw it
  const recAfter = () => { if (!opts.oldJumpLog && REC.last) REC.last.jump = G.input.jump; };
  syncInput();

  const rnd = mulberry32((opts.player ?? 1) >>> 0);
  const skill = opts.jumpSkill ?? 1;
  let nextPace = 0, fwdUntil = -1, cruise = 75;
  // the player's script, run between frames (here: before every tick)
  const act = (n) => {
    const l = G.labs[0];
    if (n >= nextPace) {
      cruise = 65 + Math.floor(rnd() * 31);
      if (rnd() < 0.3) { const a = 15 + Math.floor(rnd() * 20), b = 35 + Math.floor(rnd() * 30); ui.w = [a, b, 100 - a - b]; }
      if (rnd() < 0.1) fwdUntil = n + 20 + Math.floor(rnd() * 40);
      nextPace = n + 60 + Math.floor(rnd() * 180);
    }
    // a careful player, roughly the steward's rules: stop and build for a wall it cannot clear or a gap it cannot jump,
    // back up for a run-up, and speed up to clear a gap it can
    let pace = cruise, rev = false, stop = false;
    if (!l.out && !l.done && !ctx.inSing(l)) {
      const g = G.gaps[l.gi], b = G.barriers[l.bi], top = ctx.topSpeed(l), acc = ctx.accOf(l);
      const brake = l.v * l.v / (2 * C.DEC) + 40, reach = ctx.heightOf(l) + C.JUMP;
      if (b && ctx.knowsBar(l, l.bi) && b.x - l.x < brake && reach < b.h + 2) stop = true;
      if (g && g.crossedBy >= 0 && !l.stepDone[l.gi] && g.x - C.STEPD - l.x < brake && reach < g.stepH + 2) stop = true;
      if (g && !stop && ctx.knowsGap(l, l.gi)) {
        const gd = g.x - l.x, vreq = ctx.needSpeed(l, g) * 1.08, runUp = 2 * acc * Math.max(gd - 8, 0) * 0.9;
        const dNeed = vreq * vreq / (2 * acc * 0.9) + 10, room = l.x - ctx.backLimit(l);
        if (vreq <= top && vreq * vreq - l.v * l.v <= runUp) pace = Math.max(pace, Math.min(100, Math.ceil(100 * vreq / top) + 3));
        else if (vreq <= top && gd < dNeed && room > 6 && l.v < 1) rev = true;
        else if (l.v * l.v / (2 * C.DEC) < gd - 6) stop = true;
        else pace = 100;
      }
    }
    ui.pace = stop || rev ? 0 : pace;
    ui.rev = rev;
    ui.fwd = !stop && !rev && n < fwdUntil;
    if (opts.toggleChillAt === n) { ui.auto = !ui.auto; K.chill = ui.auto ? 1 : 0; if (K.chill) chillUsed = true; }
    // jump by hand like a fair player: at half a jump's duration before the next gap or barrier, with some timing error
    if (!l.out && !l.done && l.jt < 0 && l.v > 1) {
      const g = G.gaps[l.gi], b = G.barriers[l.bi];
      const half = 0.5 * ctx.jumpDur(l.v) * l.v * (1 + (1 - skill) * (rnd() - 0.5));
      const near = (x) => x - l.x > 0 && x - l.x <= half;
      if ((g && (near(g.x) || (g.crossedBy >= 0 && !l.stepDone[l.gi] && near(g.x - ctx.C.STEPD)))) || (b && near(b.x))) G.input.jump = true;
    }
    // a player who hammers the key (or whose key repeats): jump is pressed on every tick of the last second before an obstacle
    if (opts.mash && !l.out && !l.done) {
      const g = G.gaps[l.gi], b = G.barriers[l.bi], within = (x) => x - l.x > -20 && x - l.x < 60 + 0.5 * ctx.jumpDur(l.v) * l.v;
      if ((g && within(g.x)) || (b && within(b.x))) G.input.jump = true;
    }
  };

  const maxTicks = C.TLIMIT * 60 + 600;
  while (!G.over && REC.tick < maxTicks) {
    act(REC.tick);
    syncInput(); recTick(); PF.step(1 / 60); recAfter();
  }
  // recEnd()
  const hm = G.labs[0], r = G.result || {type: 'none'};
  REC.result = {type: r.type, won: r.type === 'win' && r.winner === hm, t: Math.round(G.t * 1000) / 1000, x: Math.round(hm.x), ticks: REC.tick,
    chill: !!(chillUsed || K.chill)};
  delete REC.last;
  return JSON.parse(JSON.stringify(REC)); // what the page stores: a JSON round trip, as localStorage does
}

// The result fields a replay must reproduce exactly.
export const RESULT_FIELDS = ['type', 'won', 't', 'x', 'ticks', 'chill'];
export function sameResult(a, b) { return RESULT_FIELDS.every(f => a[f] === b[f]); }
