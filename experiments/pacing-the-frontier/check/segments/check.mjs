// Sanity check for the twelve segments, bot play only: for each segment, the player's slot plays rush, build or wait (the rivals play their
// segment postures), over seeds start..start+n-1 (each seed is a variant). One small table per segment. This shows whether the posture
// changes the outcome on a segment; it does not show that a person feels the dilemma.
//   node build.mjs && node check.mjs [--n 40] [--start 1] [--seg 3] [--out results.md]
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
process.env.PF_PAGE = join(HERE, 'segments.html');
const {PF, configure, resetAll} = await import('../hidden-width/bt.mjs');
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
const N = +(A.n ?? 40), START = +(A.start ?? 1), ONLY = A.seg ? +A.seg : 0;
const YOU = ['rush', 'build', 'wait'];
const pct = (a, n) => Math.round(100 * a / n) + '%';
const out = ['# Segments: bot check', '', `[[ai gen]] Bot play only, seeds ${START} to ${START + N - 1} (each seed is a variant). "You" is a bot playing the row's posture; the rivals play their segment postures. Status: verified (this script reproduces it), nothing human_validated.`, ''];
for (let s = 1; s <= PF.SEGS.length; s++) {
  if (ONLY && s !== ONLY) continue;
  const seg = PF.SEGS[s - 1];
  out.push(`## ${s}. ${seg.title}`, '', '| You play | You win | You fall | You dissolved | Extinction | No winner | Rival falls | Your time |', '|---|---|---|---|---|---|---|---|');
  for (const you of YOU.concat(seg.extra || [])) {
    let win = 0, fell = 0, diss = 0, ext = 0, none = 0, rf = 0, tsum = 0;
    for (let seed = START; seed < START + N; seed++) {
      configure({seed, steps: 1, roster: null, chill: 0, player: 'balanced', strikesYou: null});
      PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
      PF.segUse(s, you);
      PF.newGame(seed, 'probe');
      const G = PF.G();
      while (!G.over) PF.step(1 / 60);
      const me = G.labs.find(l => l.id === 0), r = G.result;
      if (r.type === 'win' && r.winner === me) { win++; tsum += G.t; }
      if (r.type === 'all') ext++;
      if (r.type === 'timeout' || r.type === 'allout') none++;
      if (me.dissolved) diss++; else if (me.fellAt !== undefined) fell++;
      rf += G.ev.filter(e => e.type === 'fall' && e.id !== 0).length;
    }
    out.push(`| ${you} | ${pct(win, N)} | ${pct(fell, N)} | ${pct(diss, N)} | ${pct(ext, N)} | ${pct(none, N)} | ${(rf / N).toFixed(2)} | ${win ? (tsum / win).toFixed(1) + ' s' : '-'} |`);
  }
  out.push('');
  PF.segUse(0);
}
resetAll();
const txt = out.join('\n');
if (A.out) writeFileSync(join(HERE, A.out), txt + '\n');
console.log(txt);
