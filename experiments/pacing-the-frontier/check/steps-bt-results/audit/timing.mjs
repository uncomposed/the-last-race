// Sanity check of the timing claim in the page's own functions (arcY, jumpDur, sinkRate, flightAlt, as loaded from PF_PAGE).
// 1) the arc's flat top; 2) on real boxes (free seeds 5000-5199, this page's generator), a lab at its ceiling at full speed and at half speed:
//    the clean press window in u0 (fraction of the jump elapsed at the face) and in ms, and whether u0 = 0.5 (peak) and 0.25 (BOXU) are inside it.
import {PF, PFX, C, K, configure, resetAll} from './bt.mjs';
const u15 = Math.asin(1 / 2.2) / Math.PI;
console.log('flat top of arcY: u in [' + u15.toFixed(3) + ', ' + (1 - u15).toFixed(3) + '], JUMP ' + C.JUMP + '; arcY(0.25)=' + PFX.arcY(0.25).toFixed(1) + ' arcY(0.1)=' + PFX.arcY(0.1).toFixed(1));
const out = (v, h, w, r, u0) => { const jd = PFX.jumpDur(v), a0 = h + PFX.arcY(u0); const alt = a0 >= r ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v; return alt >= r ? 0 : (alt > 0 ? 1 : 2); };
const st = {};
for (let s = 5000; s < 5200; s++) {
  configure({seed: s, steps: 1, roster: [], player: 'custom', chill: 0}); PF.newGame(s, 'custom', []); const G = PF.G(), T = G.world;
  for (let i = 0; i < G.gaps.length; i++) { const g = G.gaps[i]; if (!PFX.stepOn(g)) continue; const cap = C.CAPS[g.inner ? T.n : i];
    for (const [lab, v] of [['full', C.TOP0 + 0.85 * cap], ['half', 0.5 * (C.TOP0 + 0.85 * cap)]]) {
      const jd = PFX.jumpDur(v); let n = 0, lo = null, hi = null;
      for (let k = 0; k <= 200; k++) { const u = k / 200; if (out(v, cap, g.W, g.rise, u) === 0) { n++; if (lo === null) lo = u; hi = u; } }
      const e = st[lab] = st[lab] || {boxes: 0, any: 0, at50: 0, at25: 0, winMs: [], lo: [], hi: []};
      e.boxes++; if (n) { e.any++; e.winMs.push(n / 201 * jd * 1000); e.lo.push(lo); e.hi.push(hi); }
      if (out(v, cap, g.W, g.rise, 0.5) === 0) e.at50++; if (out(v, cap, g.W, g.rise, 0.25) === 0) e.at25++;
    } }
  resetAll();
}
const med = a => { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; }, q = (a, f) => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(f * a.length)]; };
for (const [k, e] of Object.entries(st)) console.log(k + ' speed, lab at ceiling: boxes ' + e.boxes + ', clean possible ' + (100 * e.any / e.boxes).toFixed(1) + '%, clean at u0 .5 ' + (100 * e.at50 / e.boxes).toFixed(1) + '%, at .25 ' + (100 * e.at25 / e.boxes).toFixed(1) +
  '%; clean window median ' + med(e.winMs).toFixed(0) + ' ms (p10 ' + q(e.winMs, 0.1).toFixed(0) + '), window u0 median [' + med(e.lo).toFixed(3) + ', ' + med(e.hi).toFixed(3) + ']');
