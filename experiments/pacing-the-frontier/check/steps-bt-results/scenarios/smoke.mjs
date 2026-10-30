import {one, buildTrack, PLAYERS} from './scen.mjs';
const spec = {segs: [{}, {}, {}, {rise: 0.9, wf: 0.9}]};
const scen = (T, X) => buildTrack(spec, T, X);
const t0 = Date.now();
for (const p of PLAYERS) { const r = one(scen, p, 1); console.log(p.padEnd(9), r.out, r.bx, r.rbx.join(' '), 'sr', r.sr0, 'W', r.W.join(','), 'rise', r.rise.join(','), 't', r.t); }
console.log((Date.now() - t0) / PLAYERS.length, 'ms/race');
