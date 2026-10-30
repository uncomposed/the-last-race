import {readFileSync} from 'node:fs';
const rows = process.argv.slice(2).flatMap(f => readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse));
const by = {}; for (const r of rows) (by[r.cfg] ??= []).push(r);
for (const [c, R] of Object.entries(by)) {
  const seeds = {}; for (const r of R) ((seeds[r.seed] ??= {})[r.p] ??= []).push(r);
  const best = {}, wr = {}, n = {}; let noWin = 0;
  for (const S of Object.values(seeds)) {
    let m = -1, ws = []; for (const [p, A] of Object.entries(S)) { const w = A.reduce((a, r) => a + r.win, 0); wr[p] = (wr[p] || 0) + w; n[p] = (n[p] || 0) + A.length; if (w > m) { m = w; ws = [p]; } else if (w === m) ws.push(p); }
    if (m === 0) { noWin++; continue; } for (const p of ws) best[p] = (best[p] || 0) + 1 / ws.length;
  }
  const tot = Object.values(best).reduce((a, b) => a + b, 0), sh = Object.entries(best).sort((a, b) => b[1] - a[1]);
  const H = -sh.reduce((a, [, v]) => a + v / tot * Math.log(v / tot), 0);
  const fast = {short: {C: 0, S: 0, F: 0}, long: {C: 0, S: 0, F: 0}}, all = {short: {C: 0, S: 0, F: 0}, long: {C: 0, S: 0, F: 0}};
  for (const r of R) r.bx.split('').forEach((o, i) => { if (r.sing[i] || !(o in fast.short)) return; const k = r.long[i] ? 'long' : 'short'; if (r.p === 'rush' || r.p === 'bold') fast[k][o]++; all[k][o]++; });
  const f = o => { const t = o.C + o.S + o.F || 1; return `C${(100 * o.C / t).toFixed(0)} S${(100 * o.S / t).toFixed(0)} F${(100 * o.F / t).toFixed(0)} (n${t})`; };
  const ext = R.reduce((a, r) => a + r.ext, 0) / R.length, longShare = (() => { let l = 0, t = 0; for (const r of R) if (r.p === 'rush' && r.z === 0) r.long.forEach((x, i) => { if (!r.sing[i]) { t++; l += x; } }); return l / t; })();
  console.log(`\n== ${c}: seeds ${Object.keys(seeds).length}, long share ${(100 * longShare).toFixed(0)}%, ext/race ${(100 * ext).toFixed(0)}%, seeds nobody-probe-won ${noWin}`);
  console.log(`   per-seed best: distinct ${sh.length}, top ${sh[0][0]} ${(100 * sh[0][1] / tot).toFixed(0)}%, effective N ${Math.exp(H).toFixed(2)} :: ` + sh.map(([p, v]) => p + ' ' + (100 * v / tot).toFixed(0)).join(', '));
  console.log('   win rate: ' + Object.keys(wr).sort((a, b) => wr[b] / n[b] - wr[a] / n[a]).map(p => p + ' ' + (100 * wr[p] / n[p]).toFixed(0)).join(', '));
  console.log(`   fast (rush+bold) boxes: short ${f(fast.short)} | long ${f(fast.long)}   all probes: short ${f(all.short)} | long ${f(all.long)}`);
}
// class level: per-seed best class, split-half agreement (z0 vs z1), class win by long-box count
const CL = {rush: 'fast', bold: 'fast', drafter: 'fast', gamble: 'gamble', crawl: 'build', smart: 'build', runup: 'careful', balanced: 'careful', follower: 'careful', twin: 'careful', scout: 'careful', climber: 'careful'};
const CN = {fast: 3, gamble: 1, build: 2, careful: 6};
for (const [c, R] of Object.entries(by)) {
  const seeds = {}; for (const r of R) (seeds[r.seed] ??= []).push(r);
  const bestOf = A => { const w = {}; for (const r of A) w[CL[r.p]] = (w[CL[r.p]] || 0) + r.win / CN[CL[r.p]]; const m = Math.max(...Object.values(w)); if (m === 0) return null; const ks = Object.keys(w).filter(k => w[k] === m); return ks.length === 1 ? ks[0] : null; };
  const bc = {}; let agree = 0, both = 0; const m0 = {}, m1 = {};
  const byLong = {}; 
  for (const A of Object.values(seeds)) {
    const b = bestOf(A); if (b) bc[b] = (bc[b] || 0) + 1;
    const b0 = bestOf(A.filter(r => r.z === 0)), b1 = bestOf(A.filter(r => r.z === 1));
    if (b0 && b1) { both++; if (b0 === b1) agree++; m0[b0] = (m0[b0] || 0) + 1; m1[b1] = (m1[b1] || 0) + 1; }
    const nl = A[0].long.reduce((a, x) => a + x, 0), k = nl === 0 ? '0' : (nl === 1 ? '1' : '2+');
    for (const r of A) { const o = ((byLong[k] ??= {})[CL[r.p]] ??= [0, 0]); o[0] += r.win; o[1]++; }
  }
  const chance = Object.keys(m0).reduce((a, k) => a + (m0[k] / both) * ((m1[k] || 0) / both), 0);
  const tb = Object.values(bc).reduce((a, b) => a + b, 0);
  console.log(`\n## ${c} classes: best-class share ` + Object.entries(bc).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (100 * v / tb).toFixed(0)).join(', ') + ` (decided ${tb})` +
    ` | split-half agree ${(100 * agree / both).toFixed(0)}% vs chance ${(100 * chance).toFixed(0)}% (n${both})`);
  for (const k of ['0', '1', '2+']) if (byLong[k]) console.log(`   seeds with ${k} long boxes: ` + Object.entries(byLong[k]).map(([cl, [w, n]]) => cl + ' ' + (100 * w / n).toFixed(0) + '%').join(', ') + ` (races ${Object.values(byLong[k]).reduce((a, x) => a + x[1], 0)})`);
}
