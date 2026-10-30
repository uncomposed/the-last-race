// Candidate box sets for one slot: node gen.mjs slot [start count] > spec.json   (families: base, uniform grid x sing, random lean)
import {GAME, trackStats} from '../../steps-bt.mjs';
const slot = +process.argv[2], start = +(process.argv[3] || 1), count = +(process.argv[4] || 12);
const m = GAME.CAMPAIGN[slot - 1], T = trackStats({seed: m.seed, steps: 1});
const nG = T.boxes.length, singI = T.boxes.findIndex(b => b.sing);
function rng(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const r2 = x => Math.round(x * 100) / 100;
const cands = [{id: 'base', seed: m.seed, tiers: m.tiers, boxes: null}];
const SING = [null, {t: 0.85, w: 0.75}];
for (const [si, sg] of SING.entries()) {
  for (const t of [0.2, 0.4, 0.6, 0.8, 1]) for (const w of [0, 0.25, 0.5, 0.75])
    cands.push({id: `u${t}-${w}-s${si}`, seed: m.seed, tiers: m.tiers, boxes: T.boxes.map((b, i) => i === singI ? sg : {t, w})});
  if (si) cands.push({id: 'base-s1', seed: m.seed, tiers: m.tiers, boxes: T.boxes.map((b, i) => i === singI ? sg : null)});
}
const R = rng(slot * 1000 + 7);
for (let k = 0; k < 30; k++) {
  const lean = 2 * R() - 1, e = Math.exp(2.4 * lean), sg = SING[k % 2];
  cands.push({id: `r${k}-L${r2(lean)}-s${k % 2}`, seed: m.seed, tiers: m.tiers, boxes: T.boxes.map((b, i) => { if (i === singI) return sg; const a = R(), c = R(); return {t: r2(Math.pow(a, e)), w: r2(Math.pow(c, 1 / e))}; })});
}
console.log(JSON.stringify({slot, cands, start, count, diff: 'medium', players: ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin', 'climb0', 'rush1']}));
