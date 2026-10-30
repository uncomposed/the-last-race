// Per-gap outcomes for one seed: node pergap.mjs seed players(comma) roster(comma|;-separated tiers) nzStart count [strikes] [boxesJSON]
// For each probe and gap: reached, clean crosses, scrapes (side), falls; plus outcome counts.
import {runRace, PF} from '../../steps-bt.mjs';
const [seed, players, rosters, z0, cnt, strikes, boxes] = process.argv.slice(2);
const B = boxes ? JSON.parse(boxes) : null;
for (const p of players.split(',')) {
  const g = {}, oc = {};
  for (const ro of rosters.split(';')) for (let z = +z0; z < +z0 + +cnt; z++) {
    const r = runRace({seed: +seed, player: p, nz: z, jitter: z, roster: ro.split(','), steps: 1, chill: 0, strikesYou: +(strikes || 3), boxes: B});
    oc[r.detail] = (oc[r.detail] || 0) + 1;
    const G = PF.G();
    for (const e of G.ev) { if (e.id !== 0 || !e.gap) continue; const k = e.gap - 1; g[k] = g[k] || {cross: 0, scrape: 0, side: 0, fall: 0};
      if (e.type === 'first' || e.type === 'cross') g[k].cross++; if (e.type === 'scrape' || e.type === 'drop') { g[k].scrape++; if (e.side) g[k].side++; } if (e.type === 'fall') g[k].fall++; }
  }
  console.log(p, JSON.stringify(oc), Object.entries(g).map(([k, v]) => `g${k}:${v.cross}c/${v.scrape}s(${v.side}side)/${v.fall}f`).join(' '));
}
