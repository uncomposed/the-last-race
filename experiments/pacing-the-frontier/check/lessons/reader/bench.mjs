// [[ai gen]] Bench for reader research: any LESSONS map by key, any postures. node build.mjs --only campaign+ship+reader && node reader/bench.mjs --map a,b --posts p,q [--start 9501] [--n 40] [--lag 1]
// --lag 1: lab 0 decides every 250-400 ms and its answer arrives 250-400 ms later, pace rounded to 5%, split snapped to the seven number-key presets (as ship/keydriver.js, without the page).
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import('../../hidden-width/bt.mjs');
const N = +(A.n ?? 40), START = +(A.start ?? 9501), LAG = A.lag === '1';
const PRE = [[100,0,0],[0,100,0],[0,0,100],[33,33,33],[50,50,0],[0,50,50],[50,0,50]];
const near = w => { let b = PRE[0], bs = -2; const n = Math.hypot(...w) || 1; for (const p of PRE) { const s = (p[0]*w[0]+p[1]*w[1]+p[2]*w[2]) / (n*Math.hypot(...p)); if (s > bs) { bs = s; b = p; } } return b; };
export function run(key, post, start = START, n = N, lag = LAG) {
  const seg = PF.SEGS.find(s => s.key === key); if (!seg) throw new Error('no map ' + key);
  const idx = PF.SEGS.indexOf(seg) + 1, o = {win: 0, fell: 0, dis: 0, world: 0, t: 0, out: []};
  for (let seed = start; seed < start + n; seed++) {
    configure({seed, steps: 1, roster: null, chill: 1, player: 'balanced', strikesYou: null, knobs: {}});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, post); PF.newGame(seed, 'probe');
    const G = PF.G(), me = G.labs.find(l => l.id === 0); let g = 0;
    const SGC = PF.SGC, SGP = PF.SGP, rc = SGC[post], rp = SGP[post];
    if (lag) { let s = seed * 7 + 1; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; let nextD = 0.3, Q = [], cur = null;
      const lagged = (l, f) => { if (G.t >= nextD) { const c = f(); if (c) Q.push({t: G.t + 0.25 + r() * 0.15, c: {...c, pace: c.fwd || c.pace >= 0.95 ? 1 : Math.round(c.pace * 20) / 20, w: c.w ? near(c.w) : c.w}}); nextD = G.t + 0.25 + r() * 0.15; }
        while (Q.length && Q[0].t <= G.t) { const q = Q.shift().c; cur = {...q, jumpOnce: !!q.jump}; }
        if (!cur) return {pace: 0, w: [33, 33, 33], jump: false, auto: true, rev: false, fwd: false}; const out = {...cur, jump: cur.jumpOnce}; delete out.jumpOnce; cur.jumpOnce = false; return out; };
      if (rc) SGC[post] = l => l.id === 0 ? lagged(l, () => rc(l)) : rc(l);
      if (rp) SGP[post] = (l, gg, st) => l.id === 0 ? lagged(l, () => rp(l, gg, st)) : rp(l, gg, st); }
    try { while (!G.over && g++ < 40000) PF.step(1 / 60); } finally { if (rc) SGC[post] = rc; if (rp) SGP[post] = rp; }
    const won = G.result?.type === 'win' && G.result.winner === me;
    if (won) { o.win++; o.t += G.t; } if (me.fellAt !== undefined) o.fell++; if (me.dissolved) o.dis++; if (G.result?.type === 'all') o.world++;
    o.out.push(won ? 'W' : (G.result?.type || '?')[0]);
  }
  const pc = x => Math.round(100 * x / n);
  return {win: pc(o.win), fall: pc(o.fell), dis: pc(o.dis), world: pc(o.world), t: o.win ? +(o.t / o.win).toFixed(1) : null, seq: o.out.join('')};
}
if (A.map) for (const key of A.map.split(',')) { const seg = PF.SEGS.find(s => s.key === key);
  const posts = A.posts ? A.posts.split(',').map(p => p === 'lesson' ? seg.strategy : p) : [seg.strategy, 'coleFollow', 'sp-hs-tail', 'sp-hs-eyes', 'sp-hs-slow', 'maxout'];
  console.log(`\n${key} seeds ${START}-${START + N - 1}${LAG ? ' lag' : ''}  lesson ${seg.strategy}`);
  for (const p of [...new Set(posts)]) { const r = run(key, p); console.log('  ' + p.padEnd(14), `win ${String(r.win).padStart(3)}  fall ${String(r.fall).padStart(3)}  dissolved ${String(r.dis).padStart(3)}  world ${String(r.world).padStart(3)}  t ${r.t}`); } }
