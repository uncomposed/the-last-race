// Bot check for lesson maps. For each map: "you" plays each posture over seeds start..start+n-1 (each seed is a variant), the rivals play
// theirs, and the map's claim is scored on the table. --grid reruns the claim at each rule knob's low and high value (RULES in
// lessons-sim.js), one knob at a time, and says where the claim breaks. Bot play only: it shows whether a map's outcome hangs on the choice
// and on which rules; it does not show that a person feels the lesson.
//   node build.mjs --only <lesson> && node check.mjs --only <lesson> [--map key] [--n 40] [--start 1] [--heldout] [--grid] [--out file]
//   --heldout  seeds 1001.. instead of 1.. (tune on 1..40, report on 1001..1040)
//   --rules share:70,odds:150  run everything under these rule values
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = A.page || (A.only ? join(HERE, A.only, 'page.html') : join(HERE, 'lessons.html'));
const {PF, configure, resetAll} = await import('../hidden-width/bt.mjs');
const N = +(A.n ?? 40), START = A.heldout ? 1001 : +(A.start ?? 1);
const BASE = {};
if (A.rules) for (const p of A.rules.split(',')) { const [k, v] = p.split(':'); if (!PF.RULES.some(r => r.key === k)) throw new Error('unknown rule ' + k); BASE[k] = +v; }
const pct = (a, n) => Math.round(100 * a / n);

function knobsFor(rules) { const o = {}; for (const r of PF.RULES) if (rules[r.key] !== undefined) o[r.k] = rules[r.key]; return o; }
// one posture, one rule set: outcome counts over the seed block
function row(idx, you, rules) {
  let win = 0, fall = 0, diss = 0, ext = 0, none = 0, rf = 0, tsum = 0;
  const notes = new Set();
  for (let seed = START; seed < START + N; seed++) {
    configure({seed, steps: 1, roster: null, chill: 0, player: 'balanced', strikesYou: null, knobs: knobsFor(rules)});
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(idx, you);
    PF.newGame(seed, 'probe');
    const G = PF.G();
    let guard = 0;
    while (!G.over && guard++ < 40000) PF.step(1 / 60);
    const me = G.labs.find(l => l.id === 0), r = G.result || {type: 'none'};
    notes.add(G.world.note);
    if (r.type === 'win' && r.winner === me) { win++; tsum += G.t; }
    if (r.type === 'all') ext++;
    if (r.type !== 'win' && r.type !== 'all') none++;
    if (me.dissolved) diss++; else if (me.fellAt !== undefined) fall++;
    rf += G.ev.filter(e => e.type === 'fall' && e.id !== 0).length;
  }
  PF.segUse(0);
  return {win: pct(win, N), fall: pct(fall, N), diss: pct(diss, N), ext: pct(ext, N), none: pct(none, N), rf: +(rf / N).toFixed(2), t: win ? +(tsum / win).toFixed(1) : null, variants: notes.size};
}
function table(idx, seg, rules) { const t = {}; for (const p of seg.postures || ['rush', 'build', 'wait']) t[p] = row(idx, p, rules); return t; }
// maxout (lessons-sim.js) is the simple strategy a player found: build height and speed while running, never look. Not part of any claim
const MAXOUT = 'maxout';
function score(seg, t) { try { return Math.round(seg.claim.score(t)); } catch (e) { return NaN; } }

const out = ['# Lesson maps: bot check', '', `[[ai gen]] Bot play only, seeds ${START} to ${START + N - 1}${A.rules ? ', rules ' + A.rules : ''}. "You" is a bot playing the row's posture; the rivals play their map postures. Status: verified (this script reproduces it), nothing human_validated.`, ''];
let fails = 0;
PF.SEGS.forEach((seg, i) => {
  if (A.map && seg.key !== A.map) return;
  const t = table(i + 1, seg, BASE), s = score(seg, t), mo = (seg.postures || []).includes(MAXOUT) ? t[MAXOUT] : row(i + 1, MAXOUT, BASE), ok = s >= seg.claim.need, vars = Math.max(...Object.values(t).map(x => x.variants));
  if (!ok) fails++;
  out.push(`## ${seg.key}: ${seg.title}`, '', `Claim: ${seg.claim.text}. Score ${s}, needs ${seg.claim.need}: **${ok ? 'holds' : 'fails'}**. Variants seen: ${vars}.`, '',
    '| You play | Win | Fall | Dissolved | Extinction | No winner | Rival falls | Win time |', '|---|---|---|---|---|---|---|---|');
  for (const [p, x] of Object.entries(t)) out.push(`| ${p} | ${x.win}% | ${x.fall}% | ${x.diss}% | ${x.ext}% | ${x.none}% | ${x.rf} | ${x.t === null ? '-' : x.t + ' s'} |`);
  if (!t[MAXOUT]) out.push(`| *maxout* | ${mo.win}% | ${mo.fall}% | ${mo.diss}% | ${mo.ext}% | ${mo.none}% | ${mo.rf} | ${mo.t === null ? '-' : mo.t + ' s'} |`);
  const best = Object.entries(t).filter(([p]) => p !== MAXOUT).sort((a, b) => b[1].win - a[1].win)[0];
  out.push('', `Max-out check: building height and speed while running, never looking, wins ${mo.win}%; the best posture above (${best[0]}) wins ${best[1].win}%. ` +
    (mo.win >= best[1].win ? '**Max-out does as well or better: the map does not need its lesson.**' : `The lesson beats max-out by ${best[1].win - mo.win} points.`));
  out.push('');
  if (A.grid) {
    const rowsG = [], breaks = [];
    let held = ok ? 1 : 0, total = 1;
    for (const r of PF.RULES.filter(r => !r.exp)) for (const v of [r.lo, r.hi]) {
      if (BASE[r.key] === v) continue;
      const rs = Object.assign({}, BASE, {[r.key]: v}), sg = score(seg, table(i + 1, seg, rs)), okg = sg >= seg.claim.need;
      total++; if (okg) held++; else breaks.push(`${r.key} ${v}`);
      rowsG.push(`| ${r.name} | ${v} (default ${r.def}) | ${sg} | ${okg ? 'holds' : '**breaks**'} |`);
    }
    out.push(`Rule grid: the claim holds in **${held} of ${total}** rule sets${breaks.length ? '; breaks at ' + breaks.join(', ') : ''}.`, '',
      '| Rule | Value | Score | Claim |', '|---|---|---|---|', ...rowsG, '');
  }
});
resetAll();
const txt = out.join('\n');
if (A.out) writeFileSync(A.out.startsWith('/') ? A.out : join(process.cwd(), A.out), txt + '\n');
console.log(txt);
if (fails) process.exitCode = 1;
