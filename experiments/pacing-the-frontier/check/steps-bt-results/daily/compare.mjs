// node compare.mjs base.jsonl.gz other.jsonl.gz [twist filter]: paired other-minus-base win delta per twist x tier (mean over players,
// date-clustered SE) plus custom-bot and best-player levels. Files are relative to raw/.
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
const L = f => gunzipSync(readFileSync(new URL('./raw/' + f, import.meta.url))).toString().trim().split('\n').map(JSON.parse);
const [A, B] = [L(process.argv[2]), L(process.argv[3])], only = process.argv[4];
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1)); };
const w = r => r.o === 'win' ? 1 : 0, k = r => r.d + '|' + r.t + '|' + r.p, ia = new Map(A.map(r => [k(r), r]));
const TW = [...new Set(B.map(r => r.tw))].filter(t => !only || t === only).sort();
console.log('| Twist | Tier | base mean | other mean | Δ ± SE (pts) | custom base/other | best base/other | diss base/other | scrapes base/other |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const tw of TW) for (const t of [1, 2, 3]) {
  const Bs = B.filter(r => r.tw === tw && r.t === t), As = A.filter(r => r.tw === tw && r.t === t), byD = new Map();
  for (const b of Bs) { const a = ia.get(k(b)); if (!a) continue; (byD.get(b.d) || byD.set(b.d, []).get(b.d)).push(w(b) - w(a)); }
  const per = [...byD.values()].map(mean), d = mean(per), se = sd(per) / Math.sqrt(per.length);
  const best = R => Math.max(...[...new Set(R.map(r => r.p))].map(p => mean(R.filter(r => r.p === p).map(w))));
  const c = R => mean(R.filter(r => r.p === 'custom').map(w)), P = x => (100 * x).toFixed(0);
  console.log(`| ${tw} | ${t} | ${P(mean(As.map(w)))} | ${P(mean(Bs.map(w)))} | ${d >= 0 ? '+' : ''}${P(d)} ± ${P(se)}${Math.abs(d) >= 3 * se ? '' : '?'} | ${P(c(As))}/${P(c(Bs))} | ${P(best(As))}/${P(best(Bs))} | ${P(mean(As.map(r => r.o === 'dissolved' ? 1 : 0)))}/${P(mean(Bs.map(r => r.o === 'dissolved' ? 1 : 0)))} | ${mean(As.map(r => r.sc)).toFixed(2)}/${mean(Bs.map(r => r.sc)).toFixed(2)} |`);
}
