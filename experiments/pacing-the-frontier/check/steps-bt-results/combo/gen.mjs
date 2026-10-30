// Copy of ../economy/gen.mjs that also keeps sr0 (stop-and-reverse count). CFG env = a name in ../scenarios/genpatch.mjs CFG, or JSON {q,kinds}.
// node gen.mjs name knobsJSON s0 n Z steps(1|0) out [players]
import {writeFileSync} from 'node:fs';
import {one, race, PLAYERS} from '../economy/scen.mjs';
import {CFG, patch} from '../scenarios/genpatch.mjs';
const cv = process.env.CFG, SC = cv ? patch(cv.startsWith('{') ? JSON.parse(cv) : CFG[cv]) : null;
const [nm, kn, s0, n, Z, steps, out, pl] = process.argv.slice(2);
const KN = JSON.parse(kn), P = pl ? pl.split(',') : PLAYERS, rows = [], t0 = Date.now();
for (let s = +s0; s < +s0 + +n; s++) for (let z = 0; z < +Z; z++) for (const p of P) {
  let r;
  if (+steps) r = one(SC, p, z, {seed0: s - z, knobs: KN});
  else { globalThis.SCEN = null; r = race({seed: s, steps: 0, roster: null, chill: 0, strikesYou: null, nz: z, jitter: z, knobs: KN}, p); }
  rows.push({nm, seed: s, z, p, win: r.win, ext: r.ext, dis: r.dis, t: r.t ?? r.time, sr0: r.sr0, bx: r.bx, rbx: r.rbx, arr: (r.arr || []).map(a => a && [a.h, a.m, a.v, a.cap])});
}
writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); console.log(out, rows.length, ((Date.now() - t0) / rows.length).toFixed(1), 'ms/race');
