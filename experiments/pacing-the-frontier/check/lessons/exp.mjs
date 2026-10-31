// Rule experiments (2026-10-31). For one rule setting, on every map in all.html (the twelve segments and the lesson maps):
//   readiness  how often maxout reaches a box with height and speed both at the ceiling (the "max everything, then go" problem)
//   adversary  each simple play-to-win strategy in ADV (lessons-sim.js) plus maxout; the best of them is what a player who plays to win gets
//   lesson     the lesson map's own strategy (LESSON below), and its margin over the best adversary
// Bot play only.   node build.mjs --all && node exp.mjs [--rules brake:256,space:70] [--start 1] [--n 40] [--out file.json]
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = join(HERE, 'all.html');
const {PF, configure, resetAll} = await import('../hidden-width/bt.mjs');
const N = +(A.n ?? 40), START = +(A.start ?? 1);
const LESSON = {'close-footsteps': 'crMirror', 'close-wall': 'crPlant', 'close-spend': 'crSave', 'see-early-brake': 'seeearly', 'see-early-bravo': 'seeearly',
  'see-early-pack': 'seebreak', 'sr-landing': 'sr-pace', 'sr-odds': 'sr-look', 'sr-lastbox': 'sr-last', 'steward-minefield': 'steward-pack-steward'};
const knobs = {};
if (A.rules) for (const p of A.rules.split(',')) { const [k, v] = p.split(':'); const r = PF.RULES.find(r => r.key === k); if (!r) throw new Error('unknown rule ' + k); knobs[r.k] = +v; }

function run(idx, post, ready) {
  let win = 0;
  for (let seed = START; seed < START + N; seed++) {
    configure({seed, steps: 1, roster: null, chill: 0, player: 'balanced', strikesYou: null, knobs});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, post); PF.newGame(seed, 'probe');
    const G = PF.G(), me = G.labs.find(l => l.id === 0), seen = new Set();
    let guard = 0;
    while (!G.over && guard++ < 40000) {
      PF.step(1 / 60);
      if (ready && !me.out && !me.done) { const g = G.gaps[me.gi]; if (g && !seen.has(me.gi) && (me.gx || me.x >= g.x - 2)) { seen.add(me.gi); ready.n++; if (me.pts[1] >= me.cap - 0.5 && me.pts[2] >= me.cap - 0.5) ready.full++; } }
    }
    if (G.result && G.result.type === 'win' && G.result.winner === me) win++;
  }
  PF.segUse(0);
  return Math.round(100 * win / N);
}
const maps = [];
PF.SEGS.forEach((seg, i) => {
  if (A.map && seg.key !== A.map) return;
  const ready = {n: 0, full: 0}, adv = {};
  adv.maxout = run(i + 1, 'maxout', ready);
  for (const p of PF.ADV) if (p !== 'adv-hs-go') adv[p] = run(i + 1, p, null);
  const best = Object.entries(adv).sort((a, b) => b[1] - a[1])[0];
  const lp = LESSON[seg.key], lw = lp ? run(i + 1, lp, null) : null;
  maps.push({key: seg.key, title: seg.title, lesson: lp || null, ready: ready.n ? Math.round(100 * ready.full / ready.n) : null, boxes: ready.n,
    maxout: adv.maxout, best: best[0], bestWin: best[1], lessonWin: lw, margin: lw === null ? null : lw - best[1], adv});
  process.stderr.write('.');
});
resetAll();
const res = {rules: A.rules || 'default', start: START, n: N, maps};
if (A.out) writeFileSync(A.out, JSON.stringify(res));
else console.log(JSON.stringify(res, null, 1));
