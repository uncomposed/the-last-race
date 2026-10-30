// node rank.mjs out.json lesson foil1,foil2 [top N] [--all]: candidates by lesson minus best foil
import {readFileSync} from 'node:fs';
const [f, lesson, foils, topN] = process.argv.slice(2);
const {results} = JSON.parse(readFileSync(f, 'utf8'));
const F = foils.split(',');
const rows = results.map(r => {
  const P = r.probes, L = P[lesson], bf = F.map(x => [x, P[x].win]).sort((a, b) => b[1] - a[1])[0];
  const rank = Object.entries(P).sort((a, b) => b[1].win - a[1].win), top = rank[0];
  return {r, L, bf, margin: L.win - bf[1], rankL: rank.findIndex(x => x[0] === lesson) + 1, top, rank};
}).sort((a, b) => b.margin - a.margin);
for (const x of rows.slice(0, +(topN || 15))) {
  console.log(`${x.r.id.padEnd(22)} ${lesson} ${x.L.win} [${x.L.tiers}] best foil ${x.bf[0]} ${x.bf[1]} m ${x.margin.toFixed(3)} rank ${x.rankL} top ${x.top[0]} ${x.top[1].win} | srP75 ${x.L.srP75} max ${x.L.srMax} scr ${x.L.scr} diss ${x.L.diss} ext ${x.L.ext} | mean/tier ${x.r.probeMeanPerTier} nm${x.r.track.nearMax} nw${x.r.track.nowarn}`);
  if (process.argv.includes('--all')) console.log('     ' + x.rank.map(([p, v]) => p + ' ' + v.win).join(', ') + '\n     ' + x.r.track.boxes.join(' | '));
}
