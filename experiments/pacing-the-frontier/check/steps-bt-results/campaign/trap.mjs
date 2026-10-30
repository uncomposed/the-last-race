// Rough "sight trap" count (coordinator's request; the tuning agent builds the full classifier). For lab 0, at the first step a step-gap
// box becomes known (PF.knowsGap), it is a trap if the lab cannot brake before the box (v^2/(2*C.DEC) > distance to the box) and its
// height meter is below the rise (so it cannot clear by height without building first). Singularity counted separately.
// Wraps PF.step (read-only). Usage: node trap.mjs seed probes rosters(;-sep) nzStart count [boxesJSON] [strikes]
import {runRace, PF, PROBES} from '../../steps-bt.mjs';
PROBES.climb0 = Object.assign({}, PROBES.climber, {bar: 0}); PROBES.rush1 = Object.assign({}, PROBES.rush, {bar: 1});
export function trapRun(opts) {
  const step0 = PF.step, seen = new Set(), traps = {box: 0, sing: 0}; let known = 0;
  PF.step = dt => { step0(dt); const G = PF.G(), l = G.labs[0]; if (l.out || l.done) return;
    for (let i = 0; i < G.gaps.length; i++) { if (seen.has(i)) continue; const g = G.gaps[i]; if (!(g.rise > 0) || l.gi > i) { if (l.gi > i) seen.add(i); continue; }
      if (!PF.knowsGap(l, i)) continue; seen.add(i); known++;
      const d = g.x - l.x, brake = l.v * l.v / (2 * PF.C.DEC);
      if (brake > d && l.pts[1] < g.rise) traps[g.sing ? 'sing' : 'box']++; } };
  try { const r = runRace(opts); return {r, traps, known}; } finally { PF.step = step0; }
}
if (process.argv[1] && process.argv[1].endsWith('trap.mjs')) {
  const [seed, probes, rosters, z0, cnt, boxes, strikes] = process.argv.slice(2);
  for (const p of probes.split(',')) { let n = 0, tb = 0, ts = 0, any = 0, kn = 0;
    for (const ro of rosters.split(';')) for (let z = +z0; z < +z0 + +cnt; z++) {
      const {traps, known} = trapRun({seed: +seed, player: p, nz: z, jitter: z, roster: ro.split(','), steps: 1, chill: 0, strikesYou: +(strikes || 3), boxes: boxes && boxes !== 'null' ? JSON.parse(boxes) : null});
      n++; tb += traps.box; ts += traps.sing; kn += known; if (traps.box) any++; }
    console.log(`${p} races ${n} boxTraps/race ${(tb / n).toFixed(2)} racesWithBoxTrap ${(any / n).toFixed(2)} singTraps/race ${(ts / n).toFixed(2)} boxesMet/race ${(kn / n).toFixed(2)}`); }
}
