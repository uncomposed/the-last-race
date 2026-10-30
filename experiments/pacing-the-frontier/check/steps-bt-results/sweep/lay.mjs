// node lay.mjs base other1 other2 ...  (raw/L-<name>.json from sweep.mjs --mode layout)
// layout preserved = same box widths and finish on a track (rises may differ). nearMax = boxes needing >=90% of cap at bot peak timing.
import {readFileSync} from 'node:fs';
const here = new URL('.', import.meta.url).pathname, ld = n => JSON.parse(readFileSync(here + 'raw/L-' + n + '.json', 'utf8'));
const [b, ...o] = process.argv.slice(2), B = ld(b);
for (const n of [b, ...o]) {
  const X = ld(n); let same = 0, boxes = 0, nm = 0, nw = 0, wch = 0, need = 0, campSame = 0;
  X.forEach((t, i) => { const s = t.finish === B[i].finish && t.g.every((g, j) => g[0] === B[i].g[j][0]); same += s; if (i < 9) campSame += s;
    boxes += t.n; nm += t.nearMax; nw += t.nowarn; t.g.forEach((g, j) => { if (g[0] !== B[i].g[j][0]) wch++; if (g[2] != null) need += g[2]; }); });
  console.log(n.padEnd(10), 'tracks same layout', same + '/' + X.length, '(campaign ' + campSame + '/9)', '| boxes width changed', wch, '| nearMax/box', (nm / boxes).toFixed(3), '| nowarn/box', (nw / boxes).toFixed(3), '| mean hNeed(best timing)', (need / boxes).toFixed(3));
}
