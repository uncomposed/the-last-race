// Does a run's recorded input reproduce the race under this simulation, bit for bit? Plain Node, no install: node ghost-check.mjs
// It loads the shipped page's own simulation and the page's own ghost.js, plays each map with seeded scripted players through the same input object the page uses,
// and replays the log in a fresh simulation, comparing a fingerprint of every lab at every step.
// Controls: the same log under a changed simulation or changed input must not match, the old way of logging jumps must be caught, and a run from another build or map must refuse.
// This shows replays agree under Node's V8 only. It says nothing about Safari: see the PR for that gap.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), L = readFileSync(join(HERE, 'game.html'), 'utf8').split('\n');
const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
if (a < 0 || b < a) throw new Error('simulation section not found');
const SIM = L.slice(a, b + 1).join('\n');
const GH = new Function(readFileSync(join(HERE, 'ghost.js'), 'utf8') + '\nreturn {ghNew,ghTick,ghAfter,ghEnd,ghPrint,ghRefuse,ghReplay,ghSame};')();
const fails = [], fail = m => { fails.push(m); console.log('FAIL ' + m); };
const compile = text => new Function('window', 'document', text + '\nreturn window.PF;');
const fresh = (text = SIM) => { const PF = compile(text)({}, null); const KSNAP = {...PF.K, stepGaps: 1, chill: 1}; return {K: PF.K, KSNAP, SEGS: PF.SEGS, segUse: PF.segUse, newGame: PF.newGame, step: PF.step, G: PF.G}; };
const rng = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// the build's stamp is the hash of this simulation, and every map is inside what it covers
const ID = createHash('sha256').update(SIM).digest('hex').slice(0, 16);
const stamp = L.join('\n').match(/var SIM_ID='([0-9a-f]*)'/);
if (!stamp || stamp[1] !== ID) fail('the page stamp ' + (stamp && stamp[1]) + ' is not the hash of its simulation ' + ID);

// a player as the page sees one: it edits the controls between frames, then each step runs syncInput, ghTick, step, ghAfter
function record(api, key, seed, style, oldJump) {
  const K = api.K; for (const k in api.KSNAP) K[k] = api.KSNAP[k]; K.chill = style.chill;
  api.segUse(api.SEGS.findIndex(m => m.key === key) + 1); api.newGame(seed);
  const G = api.G(), I = G.input, r = rng(style.player), ui = {pace: 70, w: [25, 50, 25], auto: !!K.chill, rev: false, fwd: false}, R = GH.ghNew(ID, key, G.seed, K.chill), trace = [];
  let next = 0, n = 0;
  const CTRL = globalThis.CTRL, post = api.SEGS.find(m => m.key === key).strategy, l = G.labs[0];
  while (!G.over && n < 60000) {
    if (style.bot) { // the map's own strategy, played through the player's controls: this is what reaches the finish
      const keep = l.post; l.post = post; const inp = !l.out && !l.done && CTRL(l, G); l.post = keep;
      if (inp) { ui.pace = inp.pace * 100; ui.w = inp.w; ui.rev = !!inp.rev; ui.fwd = !!inp.fwd; if (inp.jump) I.jump = true; }
    } else if (n >= next) {
      ui.pace = 5 * Math.floor(8 + r() * 13);
      if (r() < 0.5) { const s = Math.floor(r() * 60), h = Math.floor(r() * (100 - s)); ui.w = [s, h, 100 - s - h]; }
      ui.fwd = r() < 0.3; ui.rev = !ui.fwd && r() < 0.1;
      if (style.toggle && r() < 0.15) { ui.auto = !ui.auto; K.chill = ui.auto ? 1 : 0; }
      next = n + 30 + Math.floor(r() * 150);
    }
    if (style.mash ? r() < 0.5 : !style.bot && r() < 0.01) I.jump = true;
    I.pace = ui.pace / 100; I.w = ui.w; I.auto = ui.auto; I.rev = ui.rev; I.fwd = ui.fwd;
    GH.ghTick(R, I); api.step(1 / 60); if (!oldJump) GH.ghAfter(R, I); n++;
    if (n % 30 === 0) trace.push(GH.ghPrint(G));
  }
  GH.ghEnd(R, G); return {R, trace};
}
function replayTrace(api, R) { const t = []; const out = GH.ghReplay(api, R, (G, n) => { if (n % 30 === 0) t.push(GH.ghPrint(G)); }); return {out, t}; }

const EDITED = SIM.replace('var C={JUMP:34,', 'var C={JUMP:34.01,'); if (EDITED === SIM) throw new Error('the edit for the control found nothing');
const STYLES = [{name: 'the map strategy', chill: 1, player: 44, bot: 1}, {name: 'auto-jump on', chill: 1, player: 11}, {name: 'auto-jump off, hammering jump', chill: 0, player: 22, mash: 1}, {name: 'auto-jump switched mid-race', chill: 1, player: 33, toggle: 1}];
const keys = fresh().SEGS.map(m => m.key);
let races = 0, inputs = 0, ends = {}, changed = 0, tried = 0, simDiff = 0, oldCaught = 0;
for (const key of keys) for (let s = 0; s < 3; s++) for (const st of STYLES) {
  const seed = 5000 + s * 97 + keys.indexOf(key), style = {...st, player: st.player + s}, {R, trace} = record(fresh(), key, seed, style);
  const {out, t} = replayTrace(fresh(), R); races++; inputs += R.inp.length; ends[R.end.type] = (ends[R.end.type] || 0) + 1;
  if (!GH.ghSame(out, R)) fail(key + ' seed ' + seed + ' ' + st.name + ': replay ended ' + JSON.stringify(out) + ', run ended ' + JSON.stringify(R.end));
  const at = trace.findIndex((p, i) => p !== t[i]); if (at >= 0) fail(key + ' seed ' + seed + ' ' + st.name + ': drifted at ' + (at + 1) * 0.5 + ' s');
  if (GH.ghRefuse(JSON.parse(JSON.stringify(R)), ID, fresh().SEGS)) fail(key + ': a good run was refused after a JSON round trip');
  const back = GH.ghReplay(fresh(), JSON.parse(JSON.stringify(R))); if (!GH.ghSame(back, R)) fail(key + ': a JSON round trip changed the replay');
  if (st.bot) { // the controls need a race that runs: run the first five seconds at nine tenths of the pace, and change one number in the simulation by a little
    const X = JSON.parse(JSON.stringify(R)); for (const q of X.inp) if (q[0] < 300) q[1] *= 0.9; tried++;
    if (!GH.ghSame(GH.ghReplay(fresh(), X), R)) changed++;
    if (!GH.ghSame(GH.ghReplay(fresh(EDITED), R), R)) simDiff++;
  }
  if (st.mash && !GH.ghSame(GH.ghReplay(fresh(), record(fresh(), key, seed, style, true).R), R)) oldCaught++;
}
console.log(races + ' races on ' + keys.length + ' maps, ' + inputs + ' logged control changes, endings ' + JSON.stringify(ends));
console.log('a changed input was caught in ' + changed + ' of ' + tried + ', a changed simulation in ' + simDiff + ' of ' + tried + ', the old jump log in ' + oldCaught + ' of ' + (keys.length * 3));
if (changed < tried * 0.8) fail('changed inputs are not being noticed');
// a tiny edit need not change every race, which is why a ghost is refused on the build stamp and not only on a replay that differs
if (simDiff < tried / 2) fail('a changed simulation is not being noticed');
if (!oldCaught) fail('the old jump log was not caught, so this check cannot see that bug');

// refusals
const S = fresh().SEGS, {R} = record(fresh(), keys[0], 1, STYLES[0]), J = () => JSON.parse(JSON.stringify(R));
const want = (name, r, why) => { const got = GH.ghRefuse(r, ID, S); if (got !== why) fail('refusal "' + name + '": got "' + got + '"'); };
want('good run', J(), '');
want('older build', {...J(), sim: '0000000000000000'}, 'recorded on a different build');
want('map gone', {...J(), map: 'no-such-map'}, 'map not in this build');
want('not a run', {v: 2}, 'unknown format');
want('nothing', null, 'unknown format');
want('no ending', {...J(), end: null}, 'malformed');
want('inputs out of order', {...J(), inp: [[5, 1, 1, 1, 1, 1, 0, 0, 0], [3, 1, 1, 1, 1, 1, 0, 0, 0]]}, 'malformed');
want('input past the end', {...J(), inp: [[R.n, 1, 1, 1, 1, 1, 0, 0, 0]]}, 'malformed');

// the board's verifier: what the reference server accepts and refuses, on a daily run that won
const {verify} = await import('./lb-reference-server.mjs');
const date = '2026-11-07', dseed = (() => { let h = 2166136261; for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619); return h >>> 0; })();
let good = null, dkey = null;
for (const m of fresh().SEGS.filter(x => x.daily)) { const {R: r} = record(fresh(), m.key, dseed, STYLES[0]); if (r.end.won) { good = r; dkey = m.key; break; } }
if (!good) fail('no daily run won on the test date, so the verifier was not tested');
else {
  const G2 = () => JSON.parse(JSON.stringify(good)), says = (name, r, d, k, ok) => { const w = verify(r, d, k); if (!!w === ok) fail('verifier, ' + name + ': said "' + w + '"'); };
  says('a good run', G2(), date, dkey, true);
  says('a faked time', (() => { const r = G2(); r.end.t -= 5; return r; })(), date, dkey, false);
  says('a faked fingerprint', (() => { const r = G2(); r.end.print ^= 1; return r; })(), date, dkey, false);
  says('a changed input', (() => { const r = G2(); for (const q of r.inp) q[1] = Math.min(1, q[1] * 1.1); return r; })(), date, dkey, false);
  says('another date', G2(), '2026-11-08', dkey, false);
  says('an older build', {...G2(), sim: 'ffffffffffffffff'}, date, dkey, false);
  says('a loss posing as a win', {...G2(), end: {...good.end, won: false}}, date, dkey, false);
  console.log('verifier: accepts the real run on ' + dkey + ', refuses six fakes');
}
if (fails.length) { console.log(fails.length + ' failed'); process.exit(1); }
console.log('ghost replay checks pass');
