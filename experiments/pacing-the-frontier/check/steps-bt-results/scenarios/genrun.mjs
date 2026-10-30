import {writeFileSync} from 'node:fs';
import {one, PLAYERS, PF} from './scen.mjs';
import {CFG, patch} from './genpatch.mjs';
const [cfgs, s0, n, Z, out] = [process.argv[2].split(","), +process.argv[3], +process.argv[4], +process.argv[5], process.argv[6]], KN = process.argv[7] ? JSON.parse(process.argv[7]) : undefined;
const rows = [];
for (const c of cfgs) { const sc = patch(CFG[c]);
  for (let s = s0; s < s0 + n; s++) for (let z = 0; z < Z; z++) for (const p of PLAYERS) {
    const r = one(sc, p, z, {seed0: s - z, knobs: KN}); const G = PF.G();
    rows.push({cfg: c + (KN ? "+" + Object.keys(KN).join("") : ""), seed: s, z, p, win: r.win, ext: r.ext, dis: r.dis, sr0: r.sr0, bx: r.bx, rbx: r.rbx, long: G.gaps.map(g => g.long ? 1 : 0), sing: G.gaps.map(g => g.sing ? 1 : (g.inner ? 2 : 0)), W: r.W, rise: r.rise, nw: G.gaps.map(g => g.nowarn ? 1 : 0)}); } }
writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); console.log(out, rows.length);
