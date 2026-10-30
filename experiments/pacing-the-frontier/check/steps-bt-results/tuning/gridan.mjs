// node gridan.mjs g1|g2|held  -> compact tables for the grids
import {load, stat} from './an.mjs';
import {existsSync} from 'node:fs';
const f = (s, d = 3) => s.mean.toFixed(d) + '±' + s.se.toFixed(d), pct = s => (100 * s.mean).toFixed(1) + '±' + (100 * s.se).toFixed(1);
const which = process.argv[2];
function plainRow(n) {
  const R = load(n), pls = [...new Set(R.map(r => r.pl))], wins = pls.map(p => [p, stat(R.filter(r => r.pl === p), r => r.win).mean]).sort((a, b) => b[1] - a[1]);
  const fa = R.reduce((a, r) => a + r.aF, 0), ex = R.reduce((a, r) => a + r.ext, 0);
  return {n: R.length, win: pct(stat(R, r => r.win)), best: wins[0][0] + ' ' + (100 * wins[0][1]).toFixed(1), dis: pct(stat(R, r => r.dis)), ext: pct(stat(R, r => r.ext)), perFall: (100 * ex / Math.max(fa, 1)).toFixed(0) + '% of ' + fa,
    fall: pct(stat(R, r => r.fall)), nwFall: pct(stat(R, r => r.nwFall)), nwMet: stat(R, r => r.nwMet).mean.toFixed(2), nw: stat(R, r => r.nw).mean.toFixed(2), aDis: stat(R, r => r.aDis).mean.toFixed(2),
    disScr: pct(stat(R, r => r.disScr)), last: pct(stat(R, r => r.lastStrike)), scr: stat(R, r => r.scr).mean.toFixed(2)};
}
function bpRow(n) { const R = load(n), o = {}; for (const p of [...new Set(R.map(r => r.pl))]) { const S = R.filter(r => r.pl === p); o[p] = pct(stat(S, r => r.win)) + ' (dis ' + (100 * stat(S, r => r.dis).mean).toFixed(0) + '%)'; } return o; }
if (which === 'g1') {
  console.log('cell\tmeanWin\tbest\tplayerDis\text/race\text/fall\tplayerFall\tnwFall\tnwBoxes\tnwMet\trivalDis');
  for (const k of [3, 5]) for (const nw of ['06', '12', '20']) for (const o of ['o', 'h']) { const n = `g1-k${k}-nw${nw}-${o}`, r = plainRow(n); console.log([n, r.win, r.best, r.dis, r.ext, r.perFall, r.fall, r.nwFall, r.nw, r.nwMet, r.aDis].join('\t')); }
  for (const k of [3, 4, 5]) { const n = k === 3 ? 'bp-f1' : 'bp-f1-k' + k; if (existsSync(new URL('raw/' + n + '.json', import.meta.url))) console.log(n, JSON.stringify(bpRow(n))); }
}
if (which === 'g2') {
  console.log('cell\tmeanWin\tbest\tplayerDis\tscrapes\tdisWithScrape\tonLastStrike\text\trivalDis');
  for (const n of ['c-cal-off', 'c-cal-on', 'g2-k3-p2', 'g2-k3-p3', 'g2-k3-p4', 'g2-k3-p5', 'g2-k3-p6', 'g2-k5-p3', 'g2-k5-p4', 'g2-k5-p5', 'g2-k5-p6']) { const r = plainRow(n); console.log([n, r.win, r.best, r.dis, r.scr, r.disScr, r.last, r.ext, r.aDis].join('\t')); }
  for (const n of ['g2-k3-p2', 'g2-k3-p3', 'g2-k3-p4', 'g2-k3-p5', 'g2-k3-p6', 'g2-k5-p3', 'g2-k5-p4', 'g2-k5-p5', 'g2-k5-p6']) console.log('bp-' + n, JSON.stringify(bpRow('bp-' + n)));
}
if (which === 'rows') for (const n of process.argv.slice(3)) { const r = plainRow(n); console.log(n, JSON.stringify(r)); }
if (which === 'bp') for (const n of process.argv.slice(3)) console.log(n, JSON.stringify(bpRow(n)));
