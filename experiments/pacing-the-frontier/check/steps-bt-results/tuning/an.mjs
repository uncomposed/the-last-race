// Analyzer: node an.mjs base name1 name2 ...   (reads raw/<name>.json; deltas are paired on (seed, player, map, tier) against base)
import {readFileSync, existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const RAW = join(dirname(fileURLToPath(import.meta.url)), 'raw');
const load = n => { const f = join(RAW, n + '.json'); return JSON.parse(existsSync(f) ? readFileSync(f, 'utf8') : gunzipSync(readFileSync(f + '.gz')).toString()).rows; };
const key = r => [r.s, r.pl, r.m, r.tier].join('|');
const M = ['win', 'dis', 'ext', 'extOwn', 'fall', 'scr', 'lastStrike', 'disScr', 'disBarOnly', 'aF', 'nw', 'nwMet', 'nwFall', 'rwin', 'aDis'];
// clustered SE: rows sharing a seed (s) are one cluster
export function stat(rows, f) {
  const cl = new Map(); for (const r of rows) { const k = r.s + '|' + (r.m || 0); const c = cl.get(k) || [0, 0]; c[0] += f(r); c[1]++; cl.set(k, c); }
  const n = rows.length, mean = rows.reduce((a, r) => a + f(r), 0) / n, G = cl.size;
  let v = 0; for (const [s, m] of cl.values()) v += (s - m * mean) ** 2;
  return {mean, se: Math.sqrt(v * G / (G - 1)) / n};
}
export {load, key};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [base, ...names] = process.argv.slice(2), B = load(base), bmap = new Map(B.map(r => [key(r), r]));
  const fmt = (x, d = 3) => x.toFixed(d);
  const head = ['name', 'n', ...M, 'extPerFall'];
  console.log(head.join('\t'));
  for (const n of [base, ...names]) {
    const R = load(n), cells = [n, R.length];
    for (const m of M) {
      const s = stat(R, r => r[m]);
      if (n === base) cells.push(fmt(s.mean) + '±' + fmt(s.se));
      else { const P = R.filter(r => bmap.has(key(r))), d = stat(P, r => r[m] - bmap.get(key(r))[m]); cells.push(fmt(s.mean) + ' (' + (d.mean >= 0 ? '+' : '') + fmt(d.mean) + '±' + fmt(d.se) + ')'); }
    }
    const fa = R.reduce((a, r) => a + r.aF, 0), ex = R.reduce((a, r) => a + r.ext, 0); cells.push(fmt(ex / Math.max(fa, 1)) + ' of ' + fa);
    console.log(cells.join('\t'));
  }
}
