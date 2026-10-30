// node gen.mjs name knobsJSON s0 n Z steps(1|0) out [players]
import {writeFileSync} from 'node:fs';
import {one, race, PLAYERS, PF} from './scen.mjs';
import {CFG, patch} from '../scenarios/genpatch.mjs';
const SC = process.env.CFG ? patch(CFG[process.env.CFG]) : null;
const [nm, kn, s0, n, Z, steps, out, pl] = process.argv.slice(2);
const KN = JSON.parse(kn), P = pl ? pl.split(',') : PLAYERS, rows = [];
for (let s = +s0; s < +s0 + +n; s++) for (let z = 0; z < +Z; z++) for (const p of P) {
  let r;
  if (+steps) r = one(SC, p, z, {seed0: s - z, knobs: KN});
  else { globalThis.SCEN = null; r = race({seed: s, steps: 0, roster: null, chill: 0, strikesYou: null, nz: z, jitter: z, knobs: KN}, p); }
  rows.push({nm, seed: s, z, p, win: r.win, ext: r.ext, dis: r.dis, t: r.t ?? r.time, bx: r.bx, rbx: r.rbx, arr: (r.arr || []).map(a => a && [a.h, a.m, a.v, a.cap])});
}
writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); console.log(out, rows.length);
