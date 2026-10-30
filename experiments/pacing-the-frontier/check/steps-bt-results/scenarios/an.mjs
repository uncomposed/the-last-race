import {readFileSync} from 'node:fs';
const rows = process.argv.slice(2).flatMap(f => readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse));
const FEAT = {mixedSpill10: [0, 1, 2], longSing: [3], singShortRun: [3], pairClose: [2, 3], mixed: [0, 1, 2], base: [2]};
const by = {}; for (const r of rows) ((by[r.scen] ??= {})[r.p] ??= []).push(r);
const pc = x => (100 * x).toFixed(0).padStart(3);
for (const [s, P] of Object.entries(by)) {
  const fe = FEAT[s] || [2]; console.log('\n== ' + s + '  feature box ' + fe.map(i => i + 1).join(',') + '  W ' + Object.values(P)[0][0].W.join(',') + ' rise ' + Object.values(P)[0][0].rise.join(','));
  const lines = [];
  for (const [p, R] of Object.entries(P)) {
    const n = R.length, m = f => R.reduce((a, r) => a + f(r), 0) / n;
    const oc = {C: 0, S: 0, F: 0, '-': 0}; for (const r of R) for (const i of fe) oc[r.bx[i]]++;
    const tot = oc.C + oc.S + oc.F || 1;
    const rv = {C: 0, S: 0, F: 0}; for (const r of R) for (const b of r.rbx) for (const i of fe) if (b[i] in rv) rv[b[i]]++;
    lines.push([m(r => r.win), `${p.padEnd(9)} win${pc(m(r => r.win))} ext${pc(m(r => r.ext))} dis${pc(m(r => r.dis))} | feat C${pc(oc.C / tot)} S${pc(oc.S / tot)} F${pc(oc.F / tot)} reach${pc(tot / (n * fe.length))} | stopRev ${m(r => r.sr0).toFixed(2)} scr ${m(r => r.scr).toFixed(2)} t ${m(r => r.t).toFixed(0)} | rivals C${rv.C} S${rv.S} F${rv.F}`]);
  }
  lines.sort((a, b) => b[0] - a[0]); for (const l of lines) console.log(l[1]);
}
