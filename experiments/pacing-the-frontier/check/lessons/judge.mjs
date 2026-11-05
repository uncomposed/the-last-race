// The judge (2026-10-31). A designer never grades its own map: this script does, on a seed block no designer tunes on.
// For each lesson map: "you" plays the map's lesson strategy and every adversary (maxout, the ADV pool in lessons-sim.js, and anything
// added in adversary/*.js), at the default rules and at each rule knob's low and high value (13 rule sets). A map passes when
//   1. at the default rules the lesson strategy wins at least MARGIN points more than the best adversary, and
//   2. it wins more than the best adversary in at least HOLD of the 13 rule sets.
// Bot play only. Passing means "worth Cole's time to play", nothing more.
//   node build.mjs --all && node judge.mjs [--map key | --only lesson] [--page file] [--start 9001] [--n 40] [--rules space:70] [--chill 1] [--out JUDGE.md]
// --chill 1: auto-jump, as the page starts (chill mode on). The default, 0, is jumping by hand, as every earlier check ran
// Seeds 9001..9040 are the judge's block: designers tune on 1..40 and may look at 1001..1040, never at these.
import {writeFileSync} from 'node:fs';
import {fork} from 'node:child_process';
import {cpus} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
const CHILL = +(A.chill ?? 0), N = +(A.n ?? 40), START = +(A.start ?? 9001), MARGIN = +(A.margin ?? 15), HOLD = +(A.hold ?? 10);
process.env.PF_PAGE = A.page ? (A.page.startsWith('/') ? A.page : join(process.cwd(), A.page)) : join(HERE, 'all.html');  // --page <lesson>/page.html: a designer's own build (node build.mjs --only <lesson>)
const {PF, configure, resetAll} = await import('../hidden-width/bt.mjs');
// lesson strategies of the maps built before maps carried their own `strategy` field
const LESSON = {'close-footsteps': 'crMirror', 'close-wall': 'crPlant', 'close-spend': 'crSave', 'see-early-brake': 'seeearly', 'see-early-bravo': 'seeearly',
  'see-early-pack': 'seebreak', 'sr-landing': 'sr-pace', 'sr-odds': 'sr-look', 'sr-lastbox': 'sr-last', 'steward-minefield': 'steward-pack-steward'};
const strategyOf = seg => seg.strategy || LESSON[seg.key] || null;
const BASE = {};
if (A.rules) for (const p of A.rules.split(',')) { const [k, v] = p.split(':'); if (!PF.RULES.some(r => r.key === k)) throw new Error('unknown rule ' + k); BASE[k] = +v; }
const knobsFor = rules => { const o = {}; for (const r of PF.RULES) if (rules[r.key] !== undefined) o[r.k] = rules[r.key]; return o; };
const ruleSets = [['default', BASE]];
for (const r of PF.RULES.filter(r => !r.exp)) for (const v of [r.lo, r.hi]) if (BASE[r.key] !== v) ruleSets.push([`${r.key} ${v}`, Object.assign({}, BASE, {[r.key]: v})]);

function winRate(idx, post, rules) {
  let win = 0;
  for (let seed = START; seed < START + N; seed++) {
    configure({seed, steps: 1, roster: null, chill: CHILL, player: 'balanced', strikesYou: null, knobs: knobsFor(rules)});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, post); PF.newGame(seed, 'probe');
    const G = PF.G();
    let guard = 0;
    while (!G.over && guard++ < 40000) PF.step(1 / 60);
    if (G.result && G.result.type === 'win' && G.result.winner === G.labs.find(l => l.id === 0)) win++;
  }
  PF.segUse(0);
  return Math.round(100 * win / N);
}
function judgeMap(key) {
  const idx = PF.SEGS.findIndex(s => s.key === key) + 1, seg = PF.SEGS[idx - 1], strat = strategyOf(seg);
  const pool = ['maxout', ...PF.ADV.filter(p => p !== 'adv-hs-go' && p !== strat)];
  // a map's own dial (lessons-sim.js DIALS) is not varied: the grid skips rule sets on its key
  const sets = ruleSets.filter(([name]) => !(seg.rules && seg.rules[name.split(' ')[0]] !== undefined)).map(([name, rules]) => {
    const lw = winRate(idx, strat, rules), adv = {};
    for (const p of pool) adv[p] = winRate(idx, p, rules);
    const [best, bw] = Object.entries(adv).sort((a, b) => b[1] - a[1])[0];
    return {name, lesson: lw, best, bestWin: bw, margin: lw - bw, adv};
  });
  const held = sets.filter(s => s.margin > 0).length, d = sets[0];
  return {key, title: seg.title, lesson: seg.lesson, strategy: strat, held, total: sets.length, pass: d.margin >= MARGIN && held >= HOLD, sets};
}

// a child process judges one map and sends back the result
if (A.child) { process.send(judgeMap(A.child)); process.exit(0); }

const keys = PF.SEGS.filter(s => strategyOf(s) && (!A.map || s.key === A.map) && (!A.only || s.dir === A.only)).map(s => s.key);
const pass = ['--start', START, '--n', N, '--chill', CHILL, ...(A.rules ? ['--rules', A.rules] : []), '--page', process.env.PF_PAGE].map(String);
const results = [];
await new Promise(done => {
  let next = 0, live = 0;
  const go = () => {
    if (next >= keys.length && !live) return done();
    while (live < Math.max(1, cpus().length - 1) && next < keys.length) {
      const key = keys[next++]; live++;
      const c = fork(fileURLToPath(import.meta.url), ['--child', key, ...pass]);
      c.on('message', r => { results.push(r); process.stderr.write(`${r.pass ? 'PASS' : 'fail'} ${key}\n`); });
      c.on('exit', () => { live--; go(); });
    }
  };
  go();
});
resetAll();
results.sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key));

const out = ['# The judge', '', `[[ai gen]] Bot play only, judge seeds ${START} to ${START + N - 1}, chill ${CHILL ? 'on (auto-jump)' : 'off (jump by hand)'}${A.rules ? ', rules ' + A.rules : ''}. A map passes when its lesson strategy beats the best of ${results[0] ? Object.keys(results[0].sets[0].adv).length : 0} adversaries by ${MARGIN} points at the default rules and beats the best adversary in at least ${HOLD} of 13 rule sets. Status: verified (this script reproduces it), nothing human_validated.`, '',
  '| Map | Lesson strategy wins | Best adversary | Margin | Rule sets held | Verdict |', '|---|---|---|---|---|---|'];
for (const r of results) { const d = r.sets[0]; out.push(`| ${r.title} (\`${r.key}\`) | ${d.lesson}% | ${d.best} ${d.bestWin}% | ${d.margin > 0 ? '+' : ''}${d.margin} | ${r.held} of ${r.total} | ${r.pass ? '**pass**' : 'fail'} |`); }
out.push('');
for (const r of results) {
  const lost = r.sets.filter(s => s.margin <= 0).map(s => `${s.name} (${s.best} ${s.bestWin}% vs ${s.lesson}%)`);
  out.push(`- \`${r.key}\`: ${lost.length ? 'loses or ties at ' + lost.join(', ') : 'beats every adversary in every rule set'}.`);
}
const txt = out.join('\n');
if (A.out) writeFileSync(A.out.startsWith('/') ? A.out : join(process.cwd(), A.out), txt + '\n');
if (A.json) writeFileSync(A.json, JSON.stringify(results));
console.log(txt);
