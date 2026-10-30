// Attribute lab 0's height and speed-meter gains by state: crash/scrape cap, spill, stopped (v<1), cruising. Also barScale sweep / no-barrier tracks.
import {one, buildTrack, PF, PLAYERS, K, C} from './scen.mjs';
import {SPECS} from '../scenarios/specs.mjs';
const players = (process.argv[2] || 'rush,gamble,climber,smart,bold').split(','), N = +(process.argv[3] || 6);
const variants = JSON.parse(process.argv[4] || '{"base":{}}');
let acc = null; const st = PF.step;
PF.step = function (dt) { const G = PF.G(), l = G.labs[0]; const h0 = l.pts[1], m0 = l.pts[2], capd = l.capUntil > l.x, v0 = l.v; const r = st(dt);
  if (acc && !l.out && !l.done) { const dh = l.pts[1] - h0, dm = l.pts[2] - m0; const k = dh > 2 ? 'spill' : capd ? 'capped' : Math.abs(v0) < 1 ? 'stopped' : v0 < 0 ? 'rev' : 'moving';
    acc[k] = acc[k] || [0, 0]; acc[k][0] += dh; acc[k][1] += dm; } return r; };
for (const [vn, v] of Object.entries(variants)) {
  const spec = SPECS[v.spec || 'base'];
  const sc = v.gen ? null : (T, X) => { buildTrack(spec, T, X); if (v.nobars) { T.bars = T.bars.filter(b => b.gate || b.x > T.gaps[T.gaps.length - 1].x); } };
  for (const p of players) { acc = {}; const fr = [], vs = [], out = {C: 0, S: 0, F: 0}; let win = 0;
    for (let z = 0; z < N; z++) { const r = one(sc, p, z, {knobs: v.knobs, seed0: v.gen ? 100 + z : undefined}); win += r.win ? 1 : 0;
      r.arr.forEach((a, i) => { if (a && a.cap) { fr.push(a.h / a.cap); vs.push(a.v); } }); for (const c of r.bx) if (out[c] !== undefined) out[c]++; }
    const mean = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '-';
    const src = Object.entries(acc).map(([k, [h, m]]) => `${k}:h${Math.round(h / N)}/m${Math.round(m / N)}`).join(' ');
    console.log(vn.padEnd(10), p.padEnd(8), 'hfrac', mean(fr), 'vface', mean(vs).slice(0, 5), 'CSF', out.C, out.S, out.F, 'win', win, '|', src); }
}
