// node an.mjs file.jsonl ... : target metrics with seed-clustered SEs (economy class definitions)
import {readFileSync} from 'node:fs';
const CLS = {fast: ['rush', 'bold', 'drafter'], build: ['smart', 'crawl', 'runup', 'climber'], careful: ['scout', 'balanced', 'follower', 'twin'], gamble: ['gamble']};
const LESSON = ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin'];
const cls = p => Object.keys(CLS).find(k => CLS[k].includes(p));
// mean and SE clustered by seed: per-seed (num, den) ratio estimator
function cl(R, num, den = () => 1) { const s = {}; for (const r of R) { const o = (s[r.seed] ||= [0, 0]); o[0] += num(r); o[1] += den(r); }
  const v = Object.values(s), N = v.reduce((a, x) => a + x[0], 0), D = v.reduce((a, x) => a + x[1], 0), m = N / D, k = v.length;
  const se = Math.sqrt(v.reduce((a, [n, d]) => a + (n - m * d) ** 2, 0) / (k * (k - 1))) / (D / k); return [m, se]; }
const f = ([m, se]) => `${(100 * m).toFixed(1)}±${(100 * se).toFixed(1)}`;
const cnt = (s, c) => [...(s || '')].filter(x => x === c).length, nb = s => [...(s || '')].filter(x => 'CSF'.includes(x)).length;
for (const file of process.argv.slice(2)) {
  const R = readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
  const F = R.filter(r => cls(r.p) === 'fast'), out = [`== ${file} races ${R.length}`];
  out.push(`ext ${f(cl(R, r => r.ext))}  lab0 dis ${f(cl(R, r => r.dis))}`);
  if (R[0].bx !== undefined && nb(R[0].bx)) out.push(`fast boxes C ${f(cl(F, r => cnt(r.bx, 'C'), r => nb(r.bx)))} S ${f(cl(F, r => cnt(r.bx, 'S'), r => nb(r.bx)))} F ${f(cl(F, r => cnt(r.bx, 'F'), r => nb(r.bx)))}`);
  out.push('class win ' + Object.keys(CLS).map(k => `${k} ${f(cl(R, r => cls(r.p) === k ? r.win : 0, r => cls(r.p) === k ? 1 : 0))}`).join('  '));
  const fh = [], fv = []; for (const r of R) if (['rush', 'bold'].includes(r.p)) for (const a of r.arr || []) if (a && a[3]) { fh.push(a[0] / a[3]); fv.push(a[2]); }
  if (fh.length) out.push(`h rush+bold ${(fh.reduce((a, b) => a + b, 0) / fh.length).toFixed(2)}  v ${(fv.reduce((a, b) => a + b, 0) / fv.length).toFixed(0)}`);
  const sr = R.filter(r => LESSON.includes(r.p) && r.sr0 !== undefined).map(r => r.sr0).sort((a, b) => a - b);
  if (sr.length) { const q = x => sr[Math.min(sr.length - 1, Math.floor(x * sr.length))]; out.push(`lesson stopRev p50/p75/p90/max ${q(.5)}/${q(.75)}/${q(.9)}/${sr[sr.length - 1]}  >3: ${(100 * sr.filter(x => x > 3).length / sr.length).toFixed(1)}%`); }
  out.push('probe win ' + [...new Set(R.map(r => r.p))].map(p => `${p} ${(100 * cl(R.filter(r => r.p === p), r => r.win)[0]).toFixed(0)}`).join(' '));
  console.log(out.join('\n'));
}
