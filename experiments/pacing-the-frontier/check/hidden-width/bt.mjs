// Step-gap backtest harness: runs the DOM-free simulation of prototype.html in Node (no dependencies) and scores races and tracks.
// Bot play only. Importable (runRace, trackStats, campaignRaces, dailyRaces, freeRaces, ...) and a CLI:
//   node check/steps-bt.mjs --mode free|campaign|daily --start N --count M [--steps 0|1] [--diff easy|medium|hard]
//        [--players custom,runup,...] [--chill 0|1] [--roster steward,gambler|none] [--floor 0.9] [--set key=value ...]
//        [--boxes JSON] [--map 1,7] [--tiers 1,2,3] [--jitter 0|1] [--dt 30|60] [--rows] [--out file.json]
// --start/--count are mandatory (held-out discipline: calibrate on one block, report on another):
//   free      seeds start .. start+count-1
//   campaign  rival-noise ids start .. (0 is the shipped draws; the nine maps' seeds are fixed). --start 0 --count 1 = what a player faces
//   daily     dates: --start YYYY-MM-DD, or an integer = days after BRIEFINGS[0].added; count consecutive days
// Everything game-side is read from prototype.html at load: the sim section (`function $(id)` .. `window.PF={`), CAMPAIGN, CAMP_DIFF,
// CAMP_STEPS, BRIEFINGS, TWISTS, DAILY_TIERS and the daily seed / briefing functions. Only the probe strategies are defined here (below).
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const PAGE = process.env.PF_PAGE || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'prototype.html');  // boxes copy: PF_PAGE picks a patched page
const SRC = readFileSync(PAGE, 'utf8');
const LINES = SRC.split('\n');

// ---------- source extraction ----------
function balancedFrom(i) {  // from index i (an opening bracket) to its matching close, skipping strings and comments
  let d = 0, q = null;
  for (let j = i; j < SRC.length; j++) {
    const c = SRC[j];
    if (q) { if (c === '\\') { j++; } else if (c === q) { q = null; } continue; }
    if (c === "'" || c === '"') { q = c; continue; }
    if (c === '/' && SRC[j + 1] === '*') { j = SRC.indexOf('*/', j) + 1; continue; }
    if (c === '{' || c === '[') d++;
    if ((c === '}' || c === ']') && --d === 0) return j;
  }
  throw new Error('unbalanced at ' + i);
}
function varDecl(name) {
  const m = new RegExp('^var ' + name + '=', 'm').exec(SRC);
  if (!m) throw new Error('var ' + name + ' not found in prototype.html');
  const s = m.index + m[0].length;
  return 'var ' + name + '=' + SRC.slice(s, balancedFrom(s) + 1) + ';';
}
function fnDecl(name) {
  const i = SRC.search(new RegExp('^function ' + name + '\\(', 'm'));
  if (i < 0) throw new Error('function ' + name + ' not found');
  return SRC.slice(i, balancedFrom(SRC.indexOf('{', i)) + 1);
}
const A = LINES.findIndex(l => l.startsWith('function $(id)')), B = LINES.findIndex(l => l.startsWith('window.PF={'));
if (A < 0 || B < A) throw new Error('simulation section not found');
let SIM = LINES.slice(A, B + 1).join('\n');
// Hook 1 (as in the campaign lesson scripts): globalThis.NZ xors the rival-bot and roll streams; NZ=0 is the game exactly.
const RB = 'rb=rngMaker((seed^0x9E3779B9)>>>0),rr=rngMaker((seed^0x85EBCA6B)>>>0)';
// Hook 2: events also carry the lab id (two labs can share a name when the player is a bot kind). Events never feed back into the race.
const EVH = 'o.who=l.name; o.kind=l.kind;';
for (const h of [RB, EVH]) if (!SIM.includes(h)) throw new Error('hook point missing: ' + h);
SIM = SIM.replace(RB, 'rb=rngMaker((seed^0x9E3779B9^Math.imul(globalThis.NZ||0,0x27D4EB2F))>>>0),rr=rngMaker((seed^0x85EBCA6B^Math.imul(globalThis.NZ||0,0x165667B1))>>>0)')
  .replace(EVH, EVH + ' o.id=l.id;');
const W = new Function('window', 'document', SIM +
  '\nwindow.PFX={riseOf:riseOf,cleanW:cleanW,flightAlt:flightAlt,arcY:arcY,jumpDur:jumpDur,sinkRate:sinkRate,stepX:stepX,towerOf:towerOf,stepOn:stepOn,gapOdds:gapOdds,oddsAt:oddsAt,gapWidth:gapWidth,backLimit:backLimit};' +
  '\nreturn window;')({}, null);
export const PF = W.PF, PFX = W.PFX, K = PF.K, C = PF.C;
const K0 = JSON.parse(JSON.stringify(K)), C0 = JSON.parse(JSON.stringify(C));  // the page's defaults (DEF and C as loaded)

const GAME = new Function(['CAMPAIGN', 'CAMP_DIFF', 'BRIEFINGS', 'TWISTS', 'DAILY_TIERS'].map(varDecl).join('\n') + '\n' +
  ['dailySeed', 'dailyDayNum', 'dailyPool', 'dailyBrief', 'dailyTwist'].map(fnDecl).join('\n') +
  '\nreturn {CAMPAIGN,CAMP_DIFF,BRIEFINGS,TWISTS,DAILY_TIERS,dailySeed,dailyDayNum,dailyBrief,dailyTwist};')();
const cs = /^var CAMP_STEPS=(\w+);/m.exec(SRC);
GAME.CAMP_STEPS = cs ? (cs[1] === 'true' || cs[1] === '1') : false;
export {GAME};

// ---------- players ----------
// Probe strategies: the campaign lesson probes (commit bea8919, experiments/pacing-the-frontier/check/lesson/strats.json, the 8 below
// in its order) plus the Slipstream follower and its self-scouting twin (check/lesson/follow.mjs). A probe drives lab 0 as a bot with
// policy {pace, w (sight/height/speed %), safe, pit, pitPub, bar} and perfect hands (SKILL.probe = 100). No probe sets `side` (the
// step-gap risk-taker odds), so a probe enters a box through the side only when its blockade roll says go.
// Jitter (optional, integer z): pace +-0.05 and each weight +-5 before renormalising, drawn from rng(seed*7919 + z*104729 + index).
export const PROBES = {
  runup: {pace: 0.4, w: [25, 53, 22], safe: true, pit: 0.5, pitPub: 0.5, bar: 0.4},
  climber: {pace: 0.72, w: [8, 83, 9], safe: true, pit: 0.7, pitPub: 0.7, bar: 0.6},
  gamble: {pace: 0.53, w: [32, 32, 36], safe: false, pit: 0.8, pitPub: 0.8, bar: 0.9},
  scout: {pace: 0.71, w: [50, 37, 13], safe: true, pit: 1, pitPub: 1, bar: 0.8},
  balanced: {pace: 0.52, w: [15, 44, 41], safe: true, pit: 1, pitPub: 1, bar: 0.9},
  bold: {pace: 0.86, w: [17, 42, 42], safe: false, pit: 0.2, pitPub: 0.2, bar: 0.7},
  rush: {pace: 0.93, w: [3, 35, 62], safe: false, pit: 0.9, pitPub: 0.9, bar: 0},
  drafter: {pace: 0.87, w: [54, 42, 5], safe: false, pit: 0.3, pitPub: 0.3, bar: 1},
  follower: {pace: 0.5, w: [5, 57, 38], safe: true, pit: 1, pitPub: 1, bar: 1},
  twin: {pace: 0.5, w: [50, 30, 20], safe: true, pit: 1, pitPub: 1, bar: 1},
};
const PNAMES = Object.keys(PROBES);
export const BOT_KINDS = ['custom', 'sprinter', 'steward', 'gambler'];
const JP = 0.05, JW = 5;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function setProbe(name, seed, z) {
  const s = PROBES[name];
  let pace = s.pace, w = s.w.slice();
  if (z !== null && z !== undefined) {
    const r = rng((seed * 7919 + z * 104729 + PNAMES.indexOf(name)) >>> 0);
    pace = Math.min(1, Math.max(0.2, pace + (r() * 2 - 1) * JP));
    w = w.map(x => Math.max(1, x + (r() * 2 - 1) * JW)); const t = w.reduce((a, b) => a + b, 0); w = w.map(x => x / t * 100);
  }
  PF.POL.probe = {pace, jit: 0, pit: s.pit, pitPub: s.pitPub, bar: s.bar, safe: s.safe, w};
  PF.KINDS.probe = {name: 'Probe', col: 'a', w: [w[0] / 100, w[1] / 100, w[2] / 100]};
  PF.SKILL.probe = 100;
}

// ---------- configuration (everything restored before every race) ----------
export function resetAll() {
  for (const k in K) delete K[k]; Object.assign(K, JSON.parse(JSON.stringify(K0)));
  for (const k in C) delete C[k]; Object.assign(C, JSON.parse(JSON.stringify(C0)));
  for (const k in PF.SKILL) delete PF.SKILL[k];
  delete PF.POL.probe; delete PF.KINDS.probe;
  PF.setRoster(null); PF.setPlayerStrikes(null); PF.setBoxes(null); globalThis.NZ = 0;
}
// opts: {seed, steps, roster, player, chill, strikesYou, knobs:{K overrides}, consts:{C overrides}, floor, boxes:[{t,w}|null], nz, jitter}
export function configure(o) {
  resetAll();
  Object.assign(K, o.knobs || {});
  if (o.steps !== undefined && o.steps !== null) K.stepGaps = o.steps ? 1 : 0;
  if (o.chill !== undefined && o.chill !== null) K.chill = o.chill ? 1 : 0;
  for (const [k, v] of Object.entries(o.consts || {})) C[k] = Array.isArray(v) ? v.slice() : v;
  if (o.floor !== undefined && o.floor !== null) C.RISEFLOOR = o.floor;
  PF.setPlayerStrikes(o.strikesYou === undefined ? null : o.strikesYou);
  PF.setBoxes(o.boxes || null);
  globalThis.NZ = o.nz || 0;
  let kind = o.player || 'custom';
  if (kind.startsWith('probe:')) kind = kind.slice(6);
  if (PROBES[kind]) { setProbe(kind, o.seed, o.jitter); kind = 'probe'; }
  else if (!PF.KINDS[kind] || kind === 'human') throw new Error('unknown player ' + o.player + ' (probes: ' + PNAMES.join(',') + '; bots: ' + BOT_KINDS.join(',') + ')');
  return kind;
}

// ---------- races ----------
function nearestObstacle(G, l) {  // the blockade or gap the lab is facing: key 'b<i>' or 'g<i>'
  const b = G.barriers[l.bi], g = G.gaps[l.gi];
  const db = b ? b.x - l.x : Infinity, dg = g ? (PFX.towerOf(l, g) ? PFX.stepX(g) : g.x) - l.x : Infinity;
  if (db === Infinity && dg === Infinity) return 'end';
  return db <= dg ? 'b' + l.bi : 'g' + l.gi;
}
// One race, stepped exactly like PF.run (newGame, then stepGame(dt) until over, at most 20000 steps), with read-only instrumentation.
// Returns a compact record; opts.raw adds PF.run's own output object (for equivalence checks).
export function runRace(opts) {
  const o = Object.assign({seed: 1, steps: null, roster: null, player: 'custom', chill: null, strikesYou: null, dt: 1 / 30}, opts);
  const t0 = process.hrtime.bigint();
  const kind = configure(o);
  PF.newGame(o.seed, kind, o.roster);
  const G = PF.G();
  const tr = G.labs.map(() => ({moved: false, resting: false, revving: false, stops: 0, reverses: 0, keys: new Set()}));
  let guard = 0;
  while (!G.over && guard < 20000) {
    PF.step(o.dt); guard++;
    for (let i = 0; i < G.labs.length; i++) {
      const l = G.labs[i], s = tr[i];
      if (l.out || l.done) continue;
      if (l.v > 1) s.moved = true;
      const rest = s.moved && l.still >= 0.3, rev = l.v < -0.5 && !l.bounce;
      if (rest && !s.resting) { s.stops++; s.keys.add(nearestObstacle(G, l)); }
      if (rev && !s.revving) { s.reverses++; s.keys.add(nearestObstacle(G, l)); }
      s.resting = rest; s.revving = rev;
    }
  }
  const res = G.result || {type: 'none'};
  const nowarn = G.gaps.map(g => !!g.nowarn), extEv = G.ev.filter(e => e.type === 'fall' && e.ext);
  const labs = G.labs.map((l, i) => {
    const E = G.ev.filter(e => e.id === l.id), gp = e => e.gap - 1;
    const crossed = E.filter(e => e.type === 'first' || e.type === 'cross').map(gp);
    const scr = E.filter(e => e.type === 'scrape' || e.type === 'drop'), fl = E.filter(e => e.type === 'fall');
    const scrG = new Set(scr.map(gp)), clean = crossed.filter(k => !scrG.has(k));
    const keys = [...tr[i].keys];
    return {id: l.id, kind: l.kind, out: l.out ? 1 : 0, dissolved: l.dissolved ? 1 : 0, done: l.done ? 1 : 0, x: Math.round(l.x), gi: l.gi,
      strikes: l.strikes, scrapes: scr.length, sideScrapes: scr.filter(e => e.side).length, falls: fl.length,
      extRolls: fl.length, extTriggered: fl.filter(e => e.ext).length,
      crashBar: l.st.bc, crashTower: l.st.tc,  // with steps on, crashTower counts bounces off barriers a stopped lab left before a box
      barriersLeft: E.filter(e => e.type === 'barrier').length, clean: clean.length,
      nowarn: {clean: clean.filter(k => nowarn[k]).length, scrape: scr.filter(e => nowarn[gp(e)]).length, fall: fl.filter(e => nowarn[gp(e)]).length},
      stops: tr[i].stops, reverses: tr[i].reverses, stopRev: keys.length, stopRevGap: keys.filter(k => k[0] === 'g').length, maxStill: Math.round(l.maxStill * 10) / 10};
  });
  const p = G.labs[0];
  let outcome, detail;
  if (res.type === 'win' && res.winner === p) { outcome = 'win'; detail = 'win'; }
  else if (p.dissolved) { outcome = 'dissolved'; detail = 'dissolved'; }
  else if (labs[0].extTriggered) { outcome = 'extinct'; detail = 'extinct-own'; }
  else if (labs[0].falls) { outcome = 'lost'; detail = 'fell'; }
  else if (res.type === 'all') { outcome = 'extinct'; detail = 'extinct-other'; }
  else { outcome = 'lost'; detail = res.type === 'win' ? 'rival-won' : res.type; }
  const rec = {seed: o.seed, nz: o.nz || 0, steps: K.stepGaps, player: o.player || 'custom', roster: G.labs.slice(1).map(l => l.kind), chill: K.chill,
    strikesYou: o.strikesYou === undefined ? null : o.strikesYou, type: res.type, winner: res.winner ? res.winner.kind + (res.winner.id === 0 ? '*' : '') : null,
    wid: res.winner ? res.winner.id : -1, outcome, detail, t: Math.round(G.t * 1000) / 1000, finishT: res.type === 'win' ? Math.round(G.t * 1000) / 1000 : null,
    level: G.level, nGaps: G.gaps.length, nNowarn: nowarn.filter(Boolean).length,
    extinction: extEv.length ? {gap: extEv[0].gap, by: extEv[0].id, sing: !!extEv[0].sing, inner: !!extEv[0].inner, roll: extEv[0].roll, odds: extEv[0].odds} : null,
    sideEntries: G.cnt.side, labs, ms: Number(process.hrtime.bigint() - t0) / 1e6};
  if (o.raw) {  // PF.run's return value, built from the same state
    let nb = 0, ng = 0; for (const b of G.barriers) if (b.pub) nb++; for (const g of G.gaps) if (g.pub) ng++;
    rec.raw = {type: res.type, winner: res.winner ? res.winner.kind + (res.winner.id === 0 ? '*' : '') : null, wid: res.winner ? res.winner.id : -1, t: G.t,
      outs: G.labs.map(l => l.out ? 1 : 0), dis: G.labs.map(l => l.dissolved ? 1 : 0), strikes: G.labs.map(l => l.strikes), level: G.level, labs: G.labs.map(l => Math.round(l.x)),
      gi: G.labs.map(l => l.gi), st: G.labs.map(l => l.st), still: G.labs.map(l => l.maxStill),
      world: {shape: G.world.shape, sig: G.world.sig, A: G.world.A, n: G.world.n, finish: G.finish}, pub: {b: nb, nb: G.barriers.length, g: ng, ng: G.gaps.length}};
  }
  resetAll();
  return rec;
}

// ---------- static track stats ----------
// Near-max. cap = the level's ceiling C.CAPS[level] (level = gap index; inner gaps of the singularity stretch use level n): the most
// height (and speed) any lab can hold when it reaches the box. hNeed* = the least height meter that crosses the box cleanly (above the
// rise at the face and at the far edge), as a fraction of cap, over the full generated width (a box another lab crossed narrows for later
// labs, as gapWidth does):
//   hNeedBot   speed meter full (v = TOP0 + 0.85*cap), jump peak at the face (u0 = 0.5: how bots press and how cleanW fits widths)
//   hNeed      same speed, best jump timing (u0 searched 0..1 by 0.005)
//   hNeedChill same speed, the chill auto-jump (started max(0.3 s, 6 units) before the face)
//   hNeedRef   the generator's reference speed (TOP0 + 0.85*cap*K.stepV/100), u0 = 0.5; widths are fitted here, so most boxes sit near 1
// nearMax: hNeedBot >= NEAR_MAX (0.9, --nearmax): even with full speed and a well-timed jump the box needs 90% of the ceiling's height.
export let NEAR_MAX = 0.9;
export function setNearMax(x) { NEAR_MAX = x; }
function hNeedAt(v, W, rise, u0, jd) { return rise - Math.min(PFX.arcY(u0), PFX.flightAlt(v, 0, W, u0)); }
function boxNeed(cap, W, rise) {
  const v = C.TOP0 + 0.85 * cap, jd = PFX.jumpDur(v);
  let best = Infinity; for (let u = 0; u <= 1.0001; u += 0.005) best = Math.min(best, hNeedAt(v, W, rise, Math.min(u, 1), jd));
  const uc = Math.min(1, Math.max(0.3, 6 / v) / jd), vr = C.TOP0 + 0.85 * cap * K.stepV / 100;
  return {v, best, bot: hNeedAt(v, W, rise, 0.5, jd), chill: hNeedAt(v, W, rise, uc, jd), ref: hNeedAt(vr, W, rise, 0.5, PFX.jumpDur(vr))};
}
export function shapeClass(g) {
  if (g.sing) return 'singularity';
  if (g.nowarn) return 'nowarn-low-wide';
  const tall = g.t >= 0.5, wide = g.wd >= 0.5;
  return tall ? (wide ? 'tall-wide' : 'tall-narrow') : (wide ? 'low-wide' : 'low-narrow');
}
export function trackStats(opts) {
  const o = Object.assign({seed: 1, steps: 1}, opts);
  configure(Object.assign({}, o, {player: 'custom'}));
  PF.newGame(o.seed, 'custom', []);
  const G = PF.G(), T = G.world, r3 = x => Math.round(x * 1000) / 1000;
  const boxes = G.gaps.map((g, i) => {
    const lv = g.inner ? T.n : i, cap = C.CAPS[lv], b = {i, lv, cap, W: g.W, rise: g.rise || 0, sing: !!g.sing, inner: !!g.inner};
    if (!PFX.stepOn(g)) return b;
    const n = boxNeed(cap, g.W, g.rise), pre = PFX.riseOf(T, i, g, g.t);
    Object.assign(b, {t: r3(g.t), w: r3(g.wd), shape: shapeClass(g), nowarn: !!g.nowarn, floor: C.RISEFLOOR > 0 && !g.sing && !g.nowarn,
      floorRaised: g.rise > pre, risePerW: r3(g.rise / g.W), riseOfReach: r3(g.rise / (cap + C.JUMP)),
      hNeed: r3(n.best / cap), hNeedBot: r3(n.bot / cap), hNeedChill: r3(n.chill / cap), hNeedRef: r3(n.ref / cap), nearMax: n.bot >= NEAR_MAX * cap, nearMaxRef: n.ref >= NEAR_MAX * cap,
      odds: Math.round(PFX.gapOdds(i))});
    return b;
  });
  const st = boxes.filter(b => b.shape);
  const out = {seed: o.seed, steps: K.stepGaps, floor: C.RISEFLOOR, label: T.label, lean: T.lean === undefined ? null : r3(T.lean), finish: G.finish, n: boxes.length,
    nearMax: st.filter(b => b.nearMax).length, nearMaxRef: st.filter(b => b.nearMaxRef).length, nowarn: st.filter(b => b.nowarn).length, boxes};
  resetAll();
  return out;
}

// ---------- modes ----------
export const DIFFS = {easy: 0, medium: 1, hard: 2};
const ROSTERS = {S: ['steward'], SG: ['steward', 'gambler'], SP: ['sprinter', 'steward'], ALL: ['sprinter', 'steward', 'gambler']};
// Campaign race i (0-based map), tier t (0-based): campLock + campApplyDiff in the page. Knobs = DEF except chill, steps only if
// CAMP_STEPS and the map has steps:1 (steps:1|0 here forces it), BOXOV = map.boxes when steps are on, the player's strikes =
// CAMP_DIFF[diff].strikes, Medium whenever chill is on. C is not reset by the page (C.RISEFLOOR stays the page's).
export function campaignConfig(i, t, {diff = 'medium', chill = 0, steps = null, boxes, knobs, consts, floor} = {}) {
  const m = GAME.CAMPAIGN[i], st = steps === null ? (GAME.CAMP_STEPS && m.steps ? 1 : 0) : steps;
  const d = chill ? 1 : DIFFS[diff];
  return {seed: m.seed, roster: m.tiers[t].slice(), steps: st, chill, strikesYou: GAME.CAMP_DIFF[d].strikes, knobs, consts, floor,
    boxes: st ? (boxes !== undefined ? boxes : (m.boxes || null)) : null, map: i + 1, tier: t + 1, name: m.name};
}
// Daily date ds, tier t: dailyPrep in the page. Knobs = DEF except chill, then the day's twist; player strikes null (K.strikes);
// roster DAILY_TIERS[t] ([] = solo); seed dailySeed(ds). The page never turns step gaps on for a daily; steps here does.
export function dailyConfig(ds, t, {chill = 0, steps = 0, knobs, consts, floor, boxes = null} = {}) {
  const b = GAME.dailyBrief(ds), tw = GAME.dailyTwist(b);
  return {seed: GAME.dailySeed(ds), roster: GAME.DAILY_TIERS[t].roster.slice(), steps, chill, strikesYou: null,
    knobs: Object.assign({}, tw, knobs || {}), consts, floor, boxes, date: ds, tier: t + 1, twist: b.twist.name};
}
function addDays(ds, n) { return new Date(Date.parse(ds + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }

// ---------- CLI ----------
function parseArgs(argv) {
  const a = {set: []};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]; if (!k.startsWith('--')) continue;
    const name = k.slice(2), v = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : '1';
    if (name === 'set') a.set.push(v); else a[name] = v;
  }
  return a;
}
// --set key=value: a K knob (p1, singOdds, ...) or a C constant (NOWARN, RISEFLOOR, ...; C.CAPS takes JSON); prefix K. or C. to force
function parseSets(list) {
  const knobs = {}, consts = {};
  for (const s of list) {
    const m = /^(?:(K|C)\.)?([A-Za-z0-9_]+)=(.*)$/.exec(s); if (!m) throw new Error('bad --set ' + s);
    const [, ns, key, raw] = m, v = /^[\[{]/.test(raw) ? JSON.parse(raw) : Number(raw);
    const where = ns || (key in K0 ? 'K' : (key in C0 ? 'C' : null));
    if (!where) throw new Error('--set ' + key + ': not a K knob or C constant');
    (where === 'K' ? knobs : consts)[key] = v;
  }
  return {knobs, consts};
}
function summarize(rows) {
  const n = rows.length, P = rows.map(r => r.labs[0]), sum = (a, f) => a.reduce((s, x) => s + f(x), 0), m = x => Math.round(x / Math.max(n, 1) * 1000) / 1000;
  const oc = {win: 0, dissolved: 0, extinct: 0, lost: 0}; for (const r of rows) oc[r.outcome]++;
  const all = rows.flatMap(r => r.labs), sr = P.map(p => p.stopRev).sort((a, b) => a - b), q = f => sr.length ? sr[Math.min(sr.length - 1, Math.floor(f * sr.length))] : null;
  return {races: n, outcomes: oc, winRate: m(oc.win), extinctionRate: m(rows.filter(r => r.extinction).length),
    player: {scrapes: m(sum(P, p => p.scrapes)), falls: m(sum(P, p => p.falls)), strikes: m(sum(P, p => p.strikes)), crashTower: m(sum(P, p => p.crashTower)),
      clean: m(sum(P, p => p.clean)), stopRev: m(sum(P, p => p.stopRev)), stopRevGap: m(sum(P, p => p.stopRevGap)), stopRevP50: q(0.5), stopRevP75: q(0.75), stopRevMax: sr.length ? sr[sr.length - 1] : null,
      nowarnScrape: sum(P, p => p.nowarn.scrape), nowarnFall: sum(P, p => p.nowarn.fall), nowarnClean: sum(P, p => p.nowarn.clean)},
    allLabsPerRace: {scrapes: m(sum(all, p => p.scrapes)), sideScrapes: m(sum(all, p => p.sideScrapes)), falls: m(sum(all, p => p.falls)), strikes: m(sum(all, p => p.strikes)),
      crashTower: m(sum(all, p => p.crashTower)), barriersLeft: m(sum(all, p => p.barriersLeft)), stops: m(sum(all, p => p.stops)), reverses: m(sum(all, p => p.reverses)),
      dissolved: m(sum(all, p => p.dissolved))},
    msPerRace: Math.round(sum(rows, r => r.ms) / Math.max(n, 1) * 100) / 100};
}
function main() {
  const a = parseArgs(process.argv.slice(2));
  const mode = a.mode || 'free';
  if (a.start === undefined || a.count === undefined) { console.error('--start and --count are required (held-out blocks: calibrate on one, report on another)'); process.exit(2); }
  const count = +a.count, {knobs, consts} = parseSets(a.set);
  if (a.nearmax) setNearMax(+a.nearmax);
  const floor = a.floor !== undefined ? +a.floor : undefined, boxes = a.boxes ? JSON.parse(a.boxes) : undefined;
  const dt = a.dt ? 1 / +a.dt : 1 / 30;
  const players = (a.players || (mode === 'campaign' ? PNAMES.join(',') : 'custom')).split(',');
  const chill = a.chill !== undefined ? +a.chill : (mode === 'free' ? 1 : 0);
  const jitter = a.jitter !== undefined ? +a.jitter : (mode === 'campaign' ? 1 : 0);
  const rows = [], groups = {}, tracks = [];
  const push = (key, rec, extra) => { Object.assign(rec, extra); rows.push(rec); (groups[key] = groups[key] || []).push(rec); };
  if (mode === 'free') {
    const start = +a.start, steps = a.steps !== undefined ? +a.steps : 0;
    const roster = a.roster ? (a.roster === 'none' ? [] : (ROSTERS[a.roster] || a.roster.split(','))) : null;
    for (let s = start; s < start + count; s++) {
      for (const p of players) push(p, runRace({seed: s, steps, roster, player: p, chill, knobs, consts, floor, boxes, dt, jitter: jitter ? 0 : null}), {});
      if (steps) tracks.push(trackStats({seed: s, steps, knobs, consts, floor, boxes}));
    }
  } else if (mode === 'campaign') {
    const maps = a.map ? a.map.split(',').map(x => +x - 1) : GAME.CAMPAIGN.map((_, i) => i), tiers = a.tiers ? a.tiers.split(',').map(x => +x - 1) : [0, 1, 2];
    const steps = a.steps !== undefined ? +a.steps : null, diff = a.diff || 'medium';
    for (const i of maps) {
      let cfg0 = null;
      for (const t of tiers) for (let z = +a.start; z < +a.start + count; z++) for (const p of players) {
        const cfg = campaignConfig(i, t, {diff, chill, steps, boxes, knobs, consts, floor}); cfg0 = cfg;
        push('map' + (i + 1) + '.' + p, runRace(Object.assign({}, cfg, {player: p, nz: z, jitter: jitter ? z : null, dt})), {map: i + 1, tier: t + 1});
      }
      if (cfg0 && cfg0.steps) tracks.push(Object.assign({map: i + 1}, trackStats(cfg0)));
    }
  } else if (mode === 'daily') {
    const d0 = /^\d+$/.test(a.start) ? addDays(GAME.BRIEFINGS[0].added, +a.start) : a.start, steps = a.steps !== undefined ? +a.steps : 0;
    const tiers = a.tiers ? a.tiers.split(',').map(x => +x - 1) : [0, 1, 2];
    for (let k = 0; k < count; k++) {
      const ds = addDays(d0, k); let cfg0 = null;
      for (const t of tiers) for (const p of players) {
        const cfg = dailyConfig(ds, t, {chill, steps, knobs, consts, floor, boxes: boxes || null}); cfg0 = cfg;
        push('tier' + (t + 1) + '.' + p, runRace(Object.assign({}, cfg, {player: p, dt, jitter: jitter ? 0 : null})), {date: ds, tier: t + 1, twist: cfg.twist});
      }
      if (steps) tracks.push(Object.assign({date: ds}, trackStats(cfg0)));
    }
  } else { console.error('unknown --mode ' + mode); process.exit(2); }
  const boxN = tracks.reduce((s, t) => s + t.n, 0), shapes = {};
  for (const t of tracks) for (const b of t.boxes) if (b.shape) shapes[b.shape] = (shapes[b.shape] || 0) + 1;
  const trackSum = tracks.length ? {tracks: tracks.length, boxes: boxN, nearMax: tracks.reduce((s, t) => s + t.nearMax, 0), nearMaxRef: tracks.reduce((s, t) => s + t.nearMaxRef, 0), nowarn: tracks.reduce((s, t) => s + t.nowarn, 0),
    floorRaised: tracks.reduce((s, t) => s + t.boxes.filter(b => b.floorRaised).length, 0), shapes, nearMaxThreshold: NEAR_MAX} : null;
  const summary = {args: a, mode, players, chill, jitter, dt, knobs, consts, floor: floor === undefined ? C0.RISEFLOOR : floor, defaults: {p1: K0.p1, pstep: K0.pstep, singOdds: K0.singOdds, NOWARN: C0.NOWARN, RISEFLOOR: C0.RISEFLOOR},
    all: summarize(rows), groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, summarize(v)])), tracks: trackSum};
  if (a.out) {
    const out = Object.assign({}, summary);
    if (a.rows) { out.rows = rows; out.trackRows = tracks; }
    writeFileSync(a.out, JSON.stringify(out) + '\n');
  }
  const s = summary.all;
  console.log(mode + ' start ' + a.start + ' count ' + count + ', players ' + players.join(',') + ', chill ' + chill + ': ' + s.races + ' races, ' + s.msPerRace + ' ms/race');
  console.log('  player outcomes ' + JSON.stringify(s.outcomes) + ', extinction ' + s.extinctionRate);
  console.log('  player per race ' + JSON.stringify(s.player));
  console.log('  all labs per race ' + JSON.stringify(s.allLabsPerRace));
  if (trackSum) console.log('  tracks ' + JSON.stringify(trackSum));
  if (a.out) console.log('  wrote ' + a.out);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
