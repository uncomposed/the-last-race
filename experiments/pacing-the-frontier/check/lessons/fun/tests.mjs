// [[ai gen]] Quick tests for fun and for teaching race intuition (issue 36, step 1). Bots only, under human-lag keys (ship/hdnode.mjs, a Node port of
// ship/keydriver.js). A number here is a proxy, not evidence that a person enjoys a map.
//   node fun/tests.mjs --page reader/page.html --maps picket,elbows --start 1001 --n 40 [--json out.json]
// Per map:
//   a. micro: the map's lesson bot plays; every control change (split preset, pace quarter, floor, back) is logged, changes under 0.5 s apart merged.
//      gapMax = median over seeds of the longest stretch with no change (s); dpm = median changes per minute.
//   a2. gapWin, dpmWin: the same two numbers over every race the player won, whichever bot (lesson or POOL) was driving: the player who wins.
//   b. dom: the highest win share of any one generic bot in POOL (fixed postures, plus coleFollow and blind max-out).
//   c. intr: for the POOL bot that most often leads at half distance, the share of races it led at half and did not win; adapt = lesson win minus its win.
//   d. voi: median share of the lesson bot's control changes that come within 1 s after a box or wall first becomes known to it (seen or public).
//      (Tried first and dropped: win share with every box public, or with 40 free sight points. Both lowered the bots' wins: they are not built to use it.)
//   e. riv: share of races (all bots) where at least one rival is still racing at the end.
//   best: the POOL bot with the most wins (for f, variety across a set).
import {load, run} from '../ship/hdnode.mjs';
import {writeFileSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
export const POOL = ['maxout', 'coleFollow', 'sp-hs-eyes', 'sp-hs-slow', 'sp-hs-tail', 'sp-even-slow', 'sp-s-bold', 'sp-h-eyes'];
// keydriver.js CFG (browser driver's knobs per map) plus hdnode's Two Endings entry: [lesson, ant, mg, commit, ease, kick]
const CFG = {'three-strikes': ['spLate', 1, 1.1, 1], 'elbows': ['sp-s-bold', 1, 1.35, 0], 'steward': ['sp-even-slow', 1, 1.35, 0], 'takeoff': ['maxout', 1, 1.2, 0], 'red-box': ['spBait', 1, 1.2, 0], 'trailbreaker': ['sp-hs-tail', 1.5, 1.2, 1], 'only-box': ['spFirst', 1, 1, 1, [1650, 0.85]], 'ladder': ['sp-hs-bold', 1, 1.35, 0], 'second-order': ['spLook', 1, 1.2, 1], 'picket': ['sp-hs-tail', 1, 1, 0, null, 1], 'two-endings': ['finLead', 1.5, 1, 1]};
const GEN = {ant: 1, mg: 1.2, commit: 0, ease: null, kick: 0, brake: 8, ready: 1};
const hdFor = (key, post, lesson) => { const c = CFG[key]; return lesson && c ? {post, ant: c[1], mg: c[2], commit: c[3], ease: c[4] || null, kick: c[5] || 0, brake: 8, ready: 1} : {...GEN, post}; };
const PRE = [[100, 0, 0], [0, 100, 0], [0, 0, 100], [33, 33, 33], [50, 50, 0], [0, 50, 50], [50, 0, 50]];
const preset = w => { let b = 0, bs = -2; const n = Math.hypot(...w) || 1; PRE.forEach((p, i) => { const s = (p[0] * w[0] + p[1] * w[1] + p[2] * w[2]) / (n * Math.hypot(...p)); if (s > bs) { bs = s; b = i; } }); return b; };
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };

export function makeApi(page) {
  const api = load(resolve(page)), PF = api.PF, step0 = PF.step;
  let R = null;  // the instrumented race
  PF.step = function (dt) {
    const G = PF.G();
    if (R && R.G !== G) { R.G = G; R.known = 0; }
    if (R) { const me = G.labs[0], I = G.input;
      if (!me.out && !me.dissolved && !me.done) {
        const c = preset(I.w || [33, 33, 33]) + ':' + Math.min(3, Math.floor((I.pace || 0) * 4)) + ':' + (I.fwd ? 1 : 0) + (I.rev ? 1 : 0);
        if (c !== R.last) { if (R.last !== null && G.t - (R.dp[R.dp.length - 1] ?? -1) >= 0.5) R.dp.push(G.t); R.last = c; }
        R.tEnd = G.t;
        let k = 0; G.gaps.forEach((g, i) => { if (g.pub || (me.seenG && me.seenG[i])) k++; }); G.barriers.forEach((b, i) => { if (b.pub || (me.seenB && me.seenB[i])) k++; });
        if (k > R.known) { if (G.t > 0.5) R.rev.push(G.t); R.known = k; }
      }
      if (R.half === null) { let f = -1e9; for (const l of G.labs) if (!l.out && !l.dissolved) f = Math.max(f, l.x); if (f >= G.finish / 2) R.half = !me.out && !me.dissolved && me.x >= f - 1; }
    }
    return step0.call(this, dt);
  };
  api.race = (key, post, seed, o = {}) => {
    R = {G: null, dp: [], rev: [], known: 0, last: null, tEnd: 0, half: null};
    const r = run(api, key, o.P || null, hdFor(key, post, o.lesson), seed), G = R.G, riv = G.labs.filter(l => l.id !== 0);
    const pts = [0, ...R.dp, R.tEnd]; let gap = 0; for (let i = 1; i < pts.length; i++) gap = Math.max(gap, pts[i] - pts[i - 1]);
    const out = {post, won: r.won, type: r.type, gap, dpm: R.tEnd > 5 ? R.dp.length / (R.tEnd / 60) : 0, half: !!R.half, info: R.dp.length ? R.dp.filter(t => R.rev.some(v => t >= v && t - v <= 1)).length / R.dp.length : 0, rivAlive: riv.filter(l => !l.out && !l.dissolved).length, rivN: riv.length};
    R = null; return out;
  };
  return api;
}

export function testMap(api, key, start, n, LP = null, name = key) {
  const seg = api.PF.SEGS.find(s => s.key === key); if (!seg) throw new Error('no map ' + key);
  const lesson = seg.strategy || 'sp-hs-eyes', seeds = Array.from({length: n}, (_, i) => start + i), all = [];
  const go = (post, o) => seeds.map(s => { const r = api.race(key, post, s, {...o, P: LP}); all.push(r); return r; });
  const L = go(lesson, {lesson: true}), P = {};
  for (const p of POOL) P[p] = go(p, {});
  const win = rs => rs.filter(r => r.won).length / n, wins = Object.fromEntries(POOL.map(p => [p, win(P[p])]));
  const best = POOL.reduce((a, b) => wins[b] > wins[a] ? b : a), halfBest = POOL.reduce((a, b) => P[b].filter(r => r.half).length > P[a].filter(r => r.half).length ? b : a);
  const hb = P[halfBest], W = all.filter(r => r.won);  /* every won race, by whichever bot won it */
  return {key: name, map: key, lesson, n, start,
    gapMax: +med(L.map(r => r.gap)).toFixed(1), dpm: +med(L.map(r => r.dpm)).toFixed(1),
    gapWin: W.length ? +med(W.map(r => r.gap)).toFixed(1) : null, dpmWin: W.length ? +med(W.map(r => r.dpm)).toFixed(1) : null, nWin: W.length,
    dom: +Math.max(...Object.values(wins)).toFixed(2), best,
    intr: +(hb.filter(r => r.half && !r.won).length / n).toFixed(2), halfBest, adapt: +(win(L) - win(hb)).toFixed(2),
    voi: +med(L.map(r => r.info)).toFixed(2), lessonWin: +win(L).toFixed(2),
    riv: +(all.filter(r => r.rivN && r.rivAlive > 0).length / all.length).toFixed(2), wins,
    dpmBy: Object.fromEntries(POOL.map(p => [p, +med(P[p].map(r => r.dpm)).toFixed(1)])),  /* control for a2: each bot's own decision rate, all its races */
    winBy: W.reduce((o, r) => { const k = r.post === lesson && L.includes(r) ? 'lesson' : r.post; o[k] = (o[k] || 0) + 1; return o; }, {})};
}

if (process.argv[1] && process.argv[1].endsWith('tests.mjs')) {
  const api = makeApi(A.page || 'reader/page.html'), start = +(A.start ?? 1001), n = +(A.n ?? 40), res = [];
  // --gen gen-days.js [--every k]: race PR 38's baked days, each the shipped map's P with that day's numbers set ('gap.0' is P.gap[0])
  const jobs = (A.maps || '').split(',').filter(Boolean).map(k => [k, null, k]);
  if (A.gen) { const D = new Function(readFileSync(A.gen, 'utf8') + ';return GEN_DAYS;')(), ev = +(A.every ?? 1);
    Object.keys(D).sort().forEach((d, i) => { if (i % ev) return; const m = api.PF.SEGS.find(s => s.key === D[d].map), P = JSON.parse(JSON.stringify(m.P));
      for (const [path, v] of Object.entries(D[d].set)) { const ks = path.split('.'); let o = P; ks.slice(0, -1).forEach(k => { o = o[k]; }); o[ks[ks.length - 1]] = v; }
      jobs.push([D[d].map, P, 'gen:' + d + ':' + D[d].map]); }); }
  for (const [key, P, name] of jobs) {
    const t0 = Date.now(), r = testMap(api, key, start, n, P, name); res.push(r);
    console.log(`${name.padEnd(16)} gapMax ${String(r.gapMax).padStart(5)}s  dpm ${String(r.dpm).padStart(5)}  win: gap ${r.gapWin} dpm ${r.dpmWin}  dom ${r.dom} (${r.best})  intr ${r.intr} (${r.halfBest}) adapt ${r.adapt}  voi ${r.voi}  lesson ${r.lessonWin}  riv ${r.riv}  ${((Date.now() - t0) / 1000) | 0}s`);
  }
  if (A.json) writeFileSync(A.json, JSON.stringify(res, null, 1));
}
