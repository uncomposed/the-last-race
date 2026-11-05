// Try other numbers for one campaign map: the lesson strategy against the adversary pool (default rules, a small seed block) for each
// setting. Settings are JSON patches merged into the map's P.
//   node campaign/sweep.mjs --map cp-look --grid '[{"rivals":[{"x":50,"pts":[70,50,40]}]},{"gap":400}]' [--n 20] [--start 1] [--chill 1] [--pool top]
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import('../../hidden-width/bt.mjs');
const N = +(A.n ?? 20), START = +(A.start ?? 1), CHILL = +(A.chill ?? 1), knobs = {};
if (A.rules) for (const p of A.rules.split(',')) { const [k, v] = p.split(':'); knobs[PF.RULES.find(r => r.key === k).k] = +v; }
export function run(idx, post) {
  let win = 0, fall = 0, t = 0;
  for (let seed = START; seed < START + N; seed++) {
    configure({seed, steps: 1, roster: null, chill: CHILL, player: 'balanced', strikesYou: null, knobs});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, post); PF.newGame(seed, 'probe');
    const G = PF.G(), you = G.labs.find(l => l.id === 0); let guard = 0;
    while (!G.over && guard++ < 40000) PF.step(1 / 60);
    if (G.result && G.result.type === 'win' && G.result.winner === you) { win++; t += G.t; }
    if (you.fellAt !== undefined) fall++;
  }
  return {win: Math.round(100 * win / N), fall: Math.round(100 * fall / N), t: win ? +(t / win).toFixed(1) : null};
}
const seg = PF.SEGS.find(s => s.key === A.map), idx = PF.SEGS.indexOf(seg) + 1, base = JSON.parse(JSON.stringify(seg.P));
const pool = ['maxout', ...PF.ADV.filter(p => p !== 'adv-hs-go' && p !== seg.strategy)];
for (const patch of JSON.parse(A.grid || '[{}]')) {
  seg.P = Object.assign(JSON.parse(JSON.stringify(base)), patch);
  const me = run(idx, seg.strategy), rows = pool.map(p => [p, run(idx, p)]).sort((a, b) => b[1].win - a[1].win);
  console.log(`${JSON.stringify(patch)}  ${seg.strategy} ${me.win}% (fall ${me.fall}%, ${me.t}s) | ` + rows.slice(0, 4).map(([p, r]) => `${p} ${r.win}% ${r.t}s`).join(', ') + ` | margin ${me.win - rows[0][1].win}`);
}
seg.P = base;
