// node bpan.mjs BPNAME [PLAINNAME]  -> per player table for a boxprobe run; with PLAINNAME, the best lesson probe there (by win rate) and paired deltas against it
import {load, stat, key} from './an.mjs';
const [bn, pn] = process.argv.slice(2), B = load(bn);
const f = (x, d = 3) => x.toFixed(d), cols = ['win', 'dis', 'scr', 'bar', 'str', 'fall', 'ext', 'extByRival', 'killedByRivalRoll', 'rivalStrikes', 'rivalDis', 'rivalFalls', 'crawlT'];
console.log(['player', 'n', ...cols].join('\t'));
const pls = [...new Set(B.map(r => r.pl))];
for (const p of pls) { const R = B.filter(r => r.pl === p); console.log([p, R.length, ...cols.map(c => { const s = stat(R, r => r[c]); return c === 'win' ? f(s.mean) + '±' + f(s.se) : f(s.mean, 2); })].join('\t')); }
if (pn) {
  const P = load(pn), probes = [...new Set(P.map(r => r.pl))].map(p => ({p, R: P.filter(r => r.pl === p)})).map(o => Object.assign(o, {w: stat(o.R, r => r.win).mean})).sort((a, b) => b.w - a.w);
  console.log('lesson probes by win:', probes.map(o => o.p + ' ' + f(o.w)).join(', '));
  const best = probes[0], bm = new Map(best.R.map(r => [[r.s, r.m, r.tier].join('|'), r]));
  for (const p of pls) { const R = B.filter(r => r.pl === p && bm.has([r.s, r.m, r.tier].join('|'))), d = stat(R, r => r.win - bm.get([r.s, r.m, r.tier].join('|')).win); console.log('  ' + p + ' minus best probe (' + best.p + '): ' + (d.mean >= 0 ? '+' : '') + f(d.mean) + ' ± ' + f(d.se) + (Math.abs(d.mean) < 3 * d.se ? ' (under 3 SE)' : '')); }
}
