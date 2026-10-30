// crashTower investigation: steps races with the page's own sim and logs every encounter between a lab and a barrier a stopped lab left (a "tower" in step mode).
// usage: node tower-probe.mjs START COUNT CHILL [out.json]
import {writeFileSync} from 'node:fs';
import {PF, PFX, K, C} from '../../steps-bt.mjs';
const [start, count, chill] = process.argv.slice(2, 5).map(Number), out = process.argv[5];
const K0 = JSON.parse(JSON.stringify(K));
const agg = {races: 0, installs: 0, encounters: 0, byKind: {}, reachMinusS: [], crashes: 0, stopsAtTower: 0, labsBehindAtInstall: 0, installsWithLabBehind: 0, examples: [], atInstall: [], atInstallCap: [], firstSight: []};
for (let s = start; s < start + count; s++) {
  Object.assign(K, K0, {stepGaps: 1, chill});
  PF.newGame(s, 'custom', null); const G = PF.G(); agg.races++;
  const seen = new Set(), tc0 = G.labs.map(l => l.st.tc), nInst = {};
  let guard = 0;
  while (!G.over && guard++ < 20000) {
    const before = G.gaps.map(g => g.stepH || 0);
    PF.step(1 / 30);
    G.gaps.forEach((g, k) => { if ((g.stepH || 0) > before[k]) { agg.installs++; const behind = G.labs.filter(m => !m.out && m.x < PFX.stepX(g) && !m.stepDone[k]); agg.labsBehindAtInstall += behind.length; for (const m of behind) { const d=Math.round(m.pts[1]+C.JUMP-g.stepH); agg.atInstall.push(d); agg.atInstallCap.push(Math.round(m.cap+C.JUMP-g.stepH)); } if (behind.length) agg.installsWithLabBehind++; } });
    for (const l of G.labs) {
      if (l.out || l.done) continue;
      const g = G.gaps[l.gi]; if (!g || !PFX.stepOn(g) || !PFX.towerOf(l, g)) continue;
      const sd = PFX.stepX(g) - l.x, key = l.id + ':' + l.gi;
      if (sd < 400 && !seen.has(key+'f')) { seen.add(key+'f'); agg.firstSight.push(Math.round(l.pts[1] + C.JUMP - g.stepH)); }
      if (sd < 60 && !seen.has(key)) {
        seen.add(key); agg.encounters++;
        const r = l.pts[1] + C.JUMP - g.stepH; agg.reachMinusS.push(Math.round(r));
        const k = agg.byKind[l.kind] = agg.byKind[l.kind] || {n: 0, short: 0}; k.n++; if (r < 0) k.short++;
        if (agg.examples.length < 12) agg.examples.push({seed: s, lab: l.kind, gap: l.gi + 1, h: Math.round(l.pts[1]), S: g.stepH, rise: g.rise, v: Math.round(l.v)});
      }
    }
  }
  G.labs.forEach((l, i) => { agg.crashes += l.st.tc - tc0[i]; });
}
Object.assign(K, K0);
const r = agg.reachMinusS.slice().sort((a, b) => a - b), q = f => r.length ? r[Math.floor(f * (r.length - 1))] : null;
const qs = a => { a = a.slice().sort((x, y) => x - y); const f = p => a.length ? a[Math.floor(p * (a.length - 1))] : null; return {n: a.length, min: a[0], p10: f(0.1), p50: f(0.5), short: a.filter(x => x < 0).length}; };
const sum = {atInstall: qs(agg.atInstall), atInstallCap: qs(agg.atInstallCap), firstSight: qs(agg.firstSight), races: agg.races, chill, installs: agg.installs, installsWithLabBehind: agg.installsWithLabBehind, labsBehindAtInstall: agg.labsBehindAtInstall,
  encounters: agg.encounters, crashes: agg.crashes, byKind: agg.byKind, reachMinusS: {min: r[0], p10: q(0.1), p50: q(0.5), p90: q(0.9), short: r.filter(x => x < 0).length}, examples: agg.examples};
console.log(JSON.stringify(sum, null, 1));
if (out) writeFileSync(out, JSON.stringify(sum) + '\n');
