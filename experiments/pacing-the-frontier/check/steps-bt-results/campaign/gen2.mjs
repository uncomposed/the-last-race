// Mixed-edit candidates for one slot: single-box edits from the generated track, plus random per-box mixes of a few shapes (null = keep).
//   node gen2.mjs slot [start count nRandom] > spec.json
import {GAME, trackStats} from '../../steps-bt.mjs';
const slot = +process.argv[2], start = +(process.argv[3] || 1), count = +(process.argv[4] || 12), nR = +(process.argv[5] || 50);
const m = GAME.CAMPAIGN[slot - 1], T = trackStats({seed: m.seed, steps: 1});
const OPT = {TN: {t: 0.9, w: 0.05}, MN: {t: 0.6, w: 0.1}, LN: {t: 0.25, w: 0.1}, MID: {t: 0.5, w: 0.4}, LW: {t: 0.15, w: 0.8}};
const names = Object.keys(OPT), idx = T.boxes.map((b, i) => b.sing ? -1 : i).filter(i => i >= 0);
function rng(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mk = sel => T.boxes.map((b, i) => sel[i] ? OPT[sel[i]] : null), cands = [];
for (const i of idx) for (const n of names) cands.push({id: `e${i}${n}`, seed: m.seed, tiers: m.tiers, boxes: mk({[i]: n})});
const R = rng(slot * 7919 + 3);
for (let k = 0; k < nR; k++) { const sel = {}, tag = []; for (const i of idx) { const x = R(); if (x < 0.3) { tag.push('-'); continue; } const n = names[Math.floor(R() * names.length)]; sel[i] = n; tag.push(n); }
  cands.push({id: `x${k}:${tag.join('.')}`, seed: m.seed, tiers: m.tiers, boxes: mk(sel)}); }
console.log(JSON.stringify({slot, cands, start, count, diff: 'medium', players: ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin', 'climb0', 'rush1']}));
