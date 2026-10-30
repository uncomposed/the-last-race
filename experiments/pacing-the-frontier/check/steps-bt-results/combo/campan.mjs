// per map: lesson (theme) probe win %, rank among 10 probes, best probe; base vs variant
import {readFileSync} from 'node:fs';
const L = f => readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse);
const A = L(process.argv[2]), B = L(process.argv[3]);
const tab = R => { const o = {}; for (const r of R) { const k = r.map; o[k] ||= {theme: r.theme.split(' ')[0], p: {}, ext: [0, 0], sr: []}; const q = (o[k].p[r.p] ||= [0, 0]); q[0] += r.win; q[1]++; o[k].ext[0] += r.ext; o[k].ext[1]++; if (r.p === o[k].theme) o[k].sr.push(r.sr0); } return o; };
const a = tab(A), b = tab(B), pc = x => (100 * x).toFixed(0);
const sum = m => { const ps = Object.entries(m.p).map(([p, [w, n]]) => [p, w / n, n]).sort((x, y) => y[1] - x[1]); const th = ps.find(x => x[0] === m.theme); const se = Math.sqrt(th[1] * (1 - th[1]) / th[2]);
  const sr = m.sr.sort((x, y) => x - y); return `lesson ${m.theme} ${pc(th[1])}±${pc(se)} rank ${ps.findIndex(x => x[0] === m.theme) + 1} best ${ps[0][0]} ${pc(ps[0][1])} 2nd ${ps[1][0]} ${pc(ps[1][1])} ext ${pc(m.ext[0] / m.ext[1])} srP75 ${sr[Math.floor(.75 * sr.length)]}`; };
for (const k of Object.keys(a)) console.log(`map ${k}\n  base: ${sum(a[k])}\n  var : ${sum(b[k])}`);
