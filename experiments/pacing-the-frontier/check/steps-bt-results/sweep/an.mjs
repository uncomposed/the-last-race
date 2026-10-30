// node an.mjs ref name1 name2 ...   (raw/<name>.jsonl). Lesson = the 10 probes. SEs clustered by map/tier/nz or date/tier or seed.
// Paired deltas (b minus ref) per unit over the 10 probes.
import {readFileSync, existsSync} from 'node:fs';
const PROBES = ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin'];
const here = new URL('.', import.meta.url).pathname;
const load = n => readFileSync(here + 'raw/' + n + '.jsonl', 'utf8').trim().split('\n').map(l => JSON.parse(l)).map(r => Object.assign(r, {u: r.map ? r.map + '/' + r.tier + '/' + r.nz : (r.date ? r.date + '/' + r.tier : '' + r.seed)}));
function cl(rows, f) { const by = new Map(); for (const r of rows) { const a = by.get(r.u) || [0, 0]; a[0] += f(r); a[1]++; by.set(r.u, a); }
  const m = [...by.values()].map(a => a[0] / a[1]), n = m.length, mu = m.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(m.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(n - 1, 1)); return {m: mu, se: sd / Math.sqrt(n)}; }
function pd(A, B, f) { const ka = new Map(A.filter(r => PROBES.includes(r.p)).map(r => [r.u + '|' + r.p, f(r)])), by = new Map();
  for (const r of B) { if (!PROBES.includes(r.p)) continue; const k = r.u + '|' + r.p; if (!ka.has(k)) continue; const x = by.get(r.u) || [0, 0]; x[0] += f(r) - ka.get(k); x[1]++; by.set(r.u, x); }
  const m = [...by.values()].map(x => x[0] / x[1]), n = m.length, mu = m.reduce((s, y) => s + y, 0) / n, sd = Math.sqrt(m.reduce((s, y) => s + (y - mu) ** 2, 0) / (n - 1)); return {m: mu, se: sd / Math.sqrt(n)}; }
const q = (a, f) => { a = a.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(f * a.length))]; };
const f1 = (o, k = 100, d = 1) => (k * o.m).toFixed(d) + '±' + (k * o.se).toFixed(d);
const [ref, ...names] = process.argv.slice(2), RA = existsSync(here + 'raw/' + ref + '.jsonl') ? load(ref) : null;
console.log('name'.padEnd(14), 'win', 'dWin', 'dis', 'dDis', 'ext/race', 'fall/race', 'dFall', 'scr/race', 'sr p50/p75/max >3%', 'crawl rank(of 11)/win', 'smart', 'best');
for (const n of [ref, ...names]) {
  const R = load(n), L = R.filter(r => PROBES.includes(r.p));
  const per = PROBES.concat(['crawl']).map(p => [p, cl(R.filter(r => r.p === p), r => r.win).m]).sort((a, b) => b[1] - a[1]);
  const rank = per.findIndex(x => x[0] === 'crawl') + 1, sr = L.map(r => r.sr0);
  const d = RA && n !== ref ? [pd(RA, R, r => r.win), pd(RA, R, r => r.dis), pd(RA, R, r => r.fall)] : null;
  console.log(n.padEnd(14), f1(cl(L, r => r.win)), d ? f1(d[0]) : '-', f1(cl(L, r => r.dis)), d ? f1(d[1]) : '-', f1(cl(L, r => r.ext)), f1(cl(L, r => r.fall), 1, 3), d ? f1(d[2], 1, 3) : '-',
    f1(cl(L, r => r.scr), 1, 2), [q(sr, .5), q(sr, .75), Math.max(...sr)].join('/') + ' ' + (100 * sr.filter(x => x > 3).length / sr.length).toFixed(1),
    rank + '/' + (100 * per[rank - 1][1]).toFixed(1), (100 * cl(R.filter(r => r.p === 'smart'), r => r.win).m).toFixed(1), per[0][0] + ' ' + (100 * per[0][1]).toFixed(1));
}
