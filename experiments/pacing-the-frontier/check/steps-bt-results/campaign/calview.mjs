import {readFileSync} from 'node:fs';
const [f, s, L, F] = process.argv.slice(2); const {results} = JSON.parse(readFileSync(f, 'utf8'));
for (const r of results.filter(x => s === '*' || x.id.startsWith('m' + s + '/'))) { const P = r.probes; const fo = F.split(',').map(x => [x, P[x].win]).sort((a, b) => b[1] - a[1])[0];
  const rank = Object.entries(P).filter(([p]) => !['climb0', 'rush1'].includes(p)).sort((a, b) => b[1].win - a[1].win);
  console.log(r.id.padEnd(40), L, P[L].win, '[' + P[L].tiers + '] foil', fo[0], fo[1], 'rank', rank.findIndex(x => x[0] === L) + 1, 'top', rank[0][0], rank[0][1].win, 'sgP75', P[L].sgP75, 'srP75', P[L].srP75, 'C0', P.climb0.win, 'mean/tier', r.probeMeanPerTier.join('/')); }
