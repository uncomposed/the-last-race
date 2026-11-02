// Quick check for campaign maps while designing: the lesson strategy against the judge's adversary pool, default rules only, a small seed
// block. Not the judge (that is judge.mjs, on its own seeds and all 13 rule sets).
//   node build.mjs --only campaign && node campaign/quick.mjs [--map key] [--start 1] [--n 20] [--chill 1] [--rules spill:40]
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import('../../hidden-width/bt.mjs');
const N = +(A.n ?? 20), START = +(A.start ?? 1), CHILL = +(A.chill ?? 1), knobs = {};
if (A.rules) for (const p of A.rules.split(',')) { const [k, v] = p.split(':'); const r = PF.RULES.find(r => r.key === k); knobs[r.k] = +v; }
function run(idx, post) {
  let win = 0, fall = 0, ext = 0, t = 0;
  for (let seed = START; seed < START + N; seed++) {
    configure({seed, steps: 1, roster: null, chill: CHILL, player: 'balanced', strikesYou: null, knobs});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, post); PF.newGame(seed, 'probe');
    const G = PF.G(), you = G.labs.find(l => l.id === 0); let guard = 0;
    while (!G.over && guard++ < 40000) PF.step(1 / 60);
    if (G.result && G.result.type === 'win' && G.result.winner === you) { win++; t += G.t; }
    if (you.fellAt !== undefined) fall++;
    if (G.result && G.result.type !== 'win') ext++;
  }
  return {win: Math.round(100 * win / N), fall: Math.round(100 * fall / N), ext: Math.round(100 * ext / N), t: win ? +(t / win).toFixed(1) : null};
}
for (const seg of PF.SEGS.filter(s => !A.map || s.key === A.map)) {
  const idx = PF.SEGS.indexOf(seg) + 1, strat = seg.strategy, pool = ['maxout', ...PF.ADV.filter(p => p !== 'adv-hs-go' && p !== strat)];
  const me = run(idx, strat), rows = pool.map(p => [p, run(idx, p)]).sort((a, b) => b[1].win - a[1].win);
  console.log(`\n${seg.key} (${seg.title}): ${strat} wins ${me.win}% (falls ${me.fall}%, no winner ${me.ext}%, ${me.t}s). Best: ` +
    rows.slice(0, 6).map(([p, r]) => `${p} ${r.win}%`).join(', ') + ` | margin ${me.win - rows[0][1].win}`);
  if (A.all) for (const [p, r] of rows) console.log('  ', p.padEnd(16), r);
}
