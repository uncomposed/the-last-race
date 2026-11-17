// [[ai gen]] Checks for the pattern generator (gen/maps.js). Plain Node, no install.   node gen/check.mjs [--page gen/page.html] [--seeds 200]
//   1. completeness: each of the 12 shipped maps, written as a block sequence (ex-<key>), lays exactly the shipped road for every seed: the same walls,
//      boxes (x, width, rise, odds, ceiling, cap, shown, shaded) and finish, and the same player and rivals.
//   2. every one of the 18 patterns has a block, and its one-block map (blk-<id>) loads and races to a finish.
//   3. the composer: a drawn map is the same every time for its seed, keeps the micro rule (no stretch longer than its limit without a wall or a
//      box, except a false calm), has an interruption in its second half and a hidden-information pattern, and races to a finish.
// This shows the generator can express the shipped maps and lays legal roads. It says nothing about whether a drawn map is fun.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1];
const L = readFileSync(resolve(A.page || 'gen/page.html'), 'utf8').split('\n');
const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
const EXTRA = 'window.GNX={GN:GN,gnDraw:gnDraw,gnAdd:gnAdd,rngMaker:rngMaker,SHIP:SHIP,GN_INTR:GN_INTR,GN_INFO:GN_INFO};';
const PF = new Function('window', 'document', L.slice(a, b).join('\n') + '\n' + EXTRA + '\n' + L[b] + '\nreturn window;')({}, null);
const W = PF, {GN, gnDraw, gnAdd, rngMaker, SHIP, GN_INTR, GN_INFO} = W.GNX, P = W.PF, NS = +(A.seeds || 200);
let fails = 0; const fail = m => { fails++; console.log('FAIL ' + m); };
const sorted = o => Array.isArray(o) ? o.map(sorted) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map(k => [k, sorted(o[k])])) : o;  /* key order is not part of the road */
const strip = t => JSON.stringify(sorted({bars: t.bars, gaps: t.gaps, finish: t.finish}));

// 1. completeness
for (const sm of SHIP) {
  const ex = P.SEGS.find(m => m.key === 'ex-' + sm.key); if (!ex) { fail('no block version of ' + sm.key); continue; }
  let bad = 0, first = null;
  for (let s = 1; s <= NS; s++) { const x = strip(sm.track(rngMaker(s))), y = strip(ex.track(rngMaker(s))); if (x !== y) { bad++; first = first || s; } }
  const labs = JSON.stringify([sm.P.you, sm.P.rivals]) === JSON.stringify([ex.P.you, ex.P.rivals]) && JSON.stringify(sm.rules || null) === JSON.stringify(ex.rules || null) && sm.strategy === ex.strategy;
  const blocks = ex.spec.blocks.map(b => b[0] + (GN[b[0]].n ? '(' + GN[b[0]].n + ')' : '')).join(' + ');
  console.log(`${sm.key.padEnd(14)} ${bad ? 'DIFFERS on ' + bad + ' of ' + NS + ' seeds (first ' + first + ')' : 'same road on all ' + NS + ' seeds'}${labs ? '' : ', LABS DIFFER'}   = ${blocks}`);
  if (bad || !labs) fail(sm.key + ' is not expressed exactly');
}

// a bot race on a map: every lab a fixed posture, as game/check.mjs does
const K0 = JSON.parse(JSON.stringify(P.K));
function race(key, seed) {
  for (const k in P.K) delete P.K[k]; Object.assign(P.K, K0); P.K.stepGaps = 1; P.K.chill = 1;
  const i = P.SEGS.findIndex(m => m.key === key); P.segUse(i + 1, 'build'); P.newGame(seed);
  const G = P.G(); let g = 0; while (!G.over && g++ < 60000) P.step(1 / 60);
  return G.result ? G.result.type : 'none';
}

// 2. blocks
const ids = Object.keys(GN).filter(id => GN[id].n > 0).sort((x, y) => GN[x].n - GN[y].n);
if (ids.length !== 18 || ids.some((id, i) => GN[id].n !== i + 1)) fail('expected patterns 1 to 18, got ' + ids.map(id => GN[id].n));
for (const id of ids) {
  const out = {}; for (let s = 1; s <= 6; s++) { const t = race('blk-' + id, s); out[t] = (out[t] || 0) + 1; }
  const done = (out.win || 0) + (out.all || 0) + (out.allout || 0);
  console.log(`block ${String(GN[id].n).padStart(2)} ${id.padEnd(8)} ${GN[id].name.padEnd(24)} ${JSON.stringify(out)}`);
  if (!done) fail('block ' + id + ': no race reached a finish');
}

// 3. the composer
let nd = 0, longest = 0;
for (let s = 1; s <= 60; s++) {
  const m = gnDraw(s), m2 = gnDraw(s), road = m.spec.blocks.map(b => b[0]).filter(id => !GN[id].rivals && id !== 'finish');
  if (JSON.stringify(m.spec) !== JSON.stringify(m2.spec) || strip(m.track(rngMaker(5))) !== strip(m2.track(rngMaker(5)))) fail('draw ' + s + ' is not the same twice');
  if (!road.slice(Math.floor(road.length / 2)).some(id => GN_INTR.includes(id))) fail('draw ' + s + ': no interruption in the second half (' + road + ')');
  if (!road.some(id => GN_INFO.includes(id))) fail('draw ' + s + ': no hidden information (' + road + ')');
  for (let k = 1; k <= 10; k++) {  // the micro rule, on the laid road
    const t = m.track(rngMaker(k)), ob = [...t.bars.map(o => ({x: o.x, e: o.x})), ...t.gaps.map(o => ({x: o.x, e: o.x + o.W, W: o.W}))].sort((p, q) => p.x - q.x);
    let prev = 0; for (const o of ob) { const gap = o.x - prev; const calm = m.spec.blocks.some(b => b[0] === 'calm') && t.gaps.some(g => g.x === o.x && gap > 900);
      if (!calm) longest = Math.max(longest, gap); if (!calm && gap > 600 + 200 + 1) fail(`draw ${s} seed ${k}: ${Math.round(gap)} without a wall or box at ${Math.round(prev)}`); prev = Math.max(prev, o.e); }
  }
  nd++;
}
// drawn maps race to a finish
const drawn = []; for (let s = 1; s <= 12; s++) drawn.push(gnAdd(gnDraw(s)));
for (const m of drawn) { const out = {}; for (let s = 1; s <= 4; s++) { const t = race(m.key, s); out[t] = (out[t] || 0) + 1; }
  if (!((out.win || 0) + (out.all || 0) + (out.allout || 0))) fail(m.key + ': no race reached a finish ' + JSON.stringify(out));
  console.log(`${m.key.padEnd(6)} ${m.track(rngMaker(1)).note.padEnd(80).slice(0, 80)} ${JSON.stringify(out)}`); }
console.log(`composer: ${nd} draws checked, longest stretch without a wall or box (outside a false calm, after run-ups) ${Math.round(longest)}`);
if (fails) { console.log(fails + ' failed'); process.exit(1); }
console.log('gen checks pass');
