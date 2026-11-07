// Guard rails for the ship maps: bots only, never a target. node build.mjs --only campaign+ship && node ship/bench.mjs [--map key] [--start 1001] [--n 40] [--top 8] [--posts a,b]
// [[ai gen]] Prints, per map, each bot's win share, its own fall and dissolved shares, world-ended share, how often a rival was dissolved, mean winning time, and how many distinct finish times the seeds gave.
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import('../../hidden-width/bt.mjs');
const N = +(A.n ?? 40), START = +(A.start ?? 1001), TOP = +(A.top ?? 8);
function run(idx, post) {
  const o = {win: 0, you: 0, dis: 0, ext: 0, riv: 0, str: 0, t: 0, times: new Set()};
  for (let seed = START; seed < START + N; seed++) {
    configure({seed, steps: 1, roster: null, chill: 1, player: 'balanced', strikesYou: null, knobs: {}});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, post); PF.newGame(seed, 'probe');
    const G = PF.G(), me = G.labs.find(l => l.id === 0); let guard = 0;
    while (!G.over && guard++ < 40000) PF.step(1 / 60);
    if (G.result?.type === 'win' && G.result.winner === me) { o.win++; o.t += G.t; }
    if (me.fellAt !== undefined) o.you++;
    if (me.dissolved) o.dis++;
    if (G.result?.type === 'all') o.ext++;
    if (G.labs.some(l => l.id !== 0 && l.dissolved)) o.riv++;
    o.str += me.strikes; o.times.add(Math.round(G.t * 4));
  }
  const pc = x => Math.round(100 * x / N);
  return {win: pc(o.win), fall: pc(o.you), dis: pc(o.dis), ext: pc(o.ext), riv: pc(o.riv), str: +(o.str / N).toFixed(1), t: o.win ? +(o.t / o.win).toFixed(1) : null, vary: o.times.size};
}
const POOL = A.posts ? A.posts.split(',') : ['sp-hs-eyes', 'sp-hs-bold', 'sp-hs-slow', 'sp-hs-tail', 'sp-hs-scrape', 'sp-s-scrape', 'sp-h-eyes', 'sp-h-bold', 'sp-h-tail', 'sp-s-eyes', 'sp-s-bold', 'sp-s-tail', 'sp-v-eyes', 'sp-v-bold', 'sp-v60-eyes', 'sp-v60-bold', 'sp-vh-eyes', 'sp-vs-eyes', 'sp-vs-bold', 'sp-even-eyes', 'sp-even-slow', 'maxout', 'rush'];
for (const seg of PF.SEGS.filter(s => (s.act || s.daily) && (!A.map || A.map.split(',').includes(s.key)))) {
  const idx = PF.SEGS.indexOf(seg) + 1;
  const list = [...new Set([...POOL, seg.strategy].filter(Boolean))];
  const rows = list.map(p => [p, run(idx, p)]).sort((a, b) => b[1].win - a[1].win || (a[1].t ?? 999) - (b[1].t ?? 999));
  console.log(`\n${seg.key} seeds ${START}-${START + N - 1}  lesson ${seg.strategy}`);
  for (const [p, r] of rows.slice(0, TOP)) console.log('  ' + p.padEnd(14), `win ${String(r.win).padStart(3)}  fall ${String(r.fall).padStart(3)}  dissolved ${String(r.dis).padStart(3)}  world ${String(r.ext).padStart(3)}  rivDis ${String(r.riv).padStart(3)}  strikes ${r.str}  t ${r.t}  vary ${r.vary}`);
  for (const k of ['sp-hs-eyes', 'sp-hs-slow']) { const e = rows.find(x => x[0] === k); if (e && rows.indexOf(e) >= TOP) console.log('  ' + k.padEnd(14), `win ${e[1].win}  fall ${e[1].fall} dissolved ${e[1].dis} world ${e[1].ext} strikes ${e[1].str} t ${e[1].t}`); }
}
