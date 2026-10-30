// node an.mjs file.jsonl ... : per-variant economy metrics
import {readFileSync} from 'node:fs';
const CLS = {fast: ['rush', 'bold', 'drafter'], build: ['smart', 'crawl', 'runup', 'climber'], careful: ['scout', 'balanced', 'follower', 'twin'], gamble: ['gamble']};
const cls = p => Object.keys(CLS).find(k => CLS[k].includes(p));
const f2 = x => (isFinite(x) ? x.toFixed(2) : '-'), pc = x => (100 * x).toFixed(0);
for (const file of process.argv.slice(2)) {
  const R = readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse), P = [...new Set(R.map(r => r.p))];
  const by = {}; for (const r of R) (by[r.p] ||= []).push(r);
  const line = [];
  for (const p of P) { const rs = by[p], hf = [], vf = [], o = {C: 0, S: 0, F: 0};
    for (const r of rs) { for (const a of r.arr) if (a && a[3]) { hf.push(a[0] / a[3]); vf.push(a[2]); } for (const c of r.bx || '') if (c in o) o[c]++; }
    const m = a => a.reduce((x, y) => x + y, 0) / a.length, n = o.C + o.S + o.F;
    line.push(`${p.padEnd(8)} h ${f2(m(hf))} v ${m(vf).toFixed(0).padStart(3)} CSF ${pc(o.C / n)}/${pc(o.S / n)}/${pc(o.F / n)} win ${pc(m(rs.map(r => r.win))).padStart(2)} dis ${pc(m(rs.map(r => r.dis ? 1 : 0)))}`); }
  // fast class box outcomes, class wins, per-seed best
  const fo = {C: 0, S: 0, F: 0}; for (const r of R) if (cls(r.p) === 'fast') for (const c of r.bx || '') if (c in fo) fo[c]++;
  const fn = fo.C + fo.S + fo.F, cw = {}; for (const r of R) { const k = cls(r.p); cw[k] ||= [0, 0]; cw[k][0] += r.win; cw[k][1]++; }
  const seeds = {}; for (const r of R) { const s = (seeds[r.seed] ||= {}); (s[r.p] ||= [0, 0]); s[r.p][0] += r.win; s[r.p][1]++; }
  const best = {}, bestC = {}; let agree = 0, ns = 0;
  for (const [s, o] of Object.entries(seeds)) { const ps = Object.keys(o), mx = Math.max(...ps.map(p => o[p][0])); if (mx === 0) continue; const top = ps.filter(p => o[p][0] === mx);
    for (const p of top) { best[p] = (best[p] || 0) + 1 / top.length; bestC[cls(p)] = (bestC[cls(p)] || 0) + 1 / top.length; } ns++; }
  // split-half: best probe in draws 0-2 vs 3-5
  const h = {}; for (const r of R) { const k = r.seed + (r.z < 3 ? 'a' : 'b'); (h[k] ||= {}); h[k][r.p] = (h[k][r.p] || 0) + r.win; }
  let ag = 0, na = 0; for (const s of Object.keys(seeds)) { const a = h[s + 'a'], b = h[s + 'b']; if (!a || !b) continue; const ba = Object.keys(a).sort((x, y) => a[y] - a[x])[0], bb = Object.keys(b).sort((x, y) => b[y] - b[x])[0]; if (a[ba] && b[bb]) { na++; if (cls(ba) === cls(bb)) ag++; } }
  const tot = Object.values(best).reduce((a, b) => a + b, 0), ent = Math.exp(-Object.values(best).reduce((a, b) => a + (b / tot) * Math.log(b / tot), 0));
  const ext = R.filter(r => r.z === 0 && r.p === P[0]); // one row per seed for ext? ext is per race; average over all
  console.log(`== ${file}  races ${R.length}  ext ${pc(R.reduce((a, r) => a + (r.ext ? 1 : 0), 0) / R.length)}%  lab0 dis ${pc(R.reduce((a, r) => a + (r.dis ? 1 : 0), 0) / R.length)}%`);
  console.log(`fast boxes C/S/F ${pc(fo.C / fn)}/${pc(fo.S / fn)}/${pc(fo.F / fn)}  class win% ` + Object.entries(cw).map(([k, [w, n]]) => `${k} ${pc(w / n)}`).join(' ') +
    `  best-class share ` + Object.entries(bestC).map(([k, v]) => `${k} ${pc(v / tot)}`).join(' ') + `  probes ever best ${Object.keys(best).length}  eff ${ent.toFixed(1)}  split-half class agree ${pc(ag / na)}%`);
  console.log(line.join('\n'));
}
