// Build a refine spec: node refine.mjs slot "seed:shape seed:shape ..." start count [diff] > spec.json ; shape = base | t,w (all non-sing boxes) | JSON array
import {GAME, trackStats} from '../../steps-bt.mjs';
const [slot, list, start, count, diff] = process.argv.slice(2); const m = GAME.CAMPAIGN[+slot - 1], cands = [];
for (const item of list.trim().split(/\s+/)) { const k = item.indexOf(':'), s = +item.slice(0, k), sh = item.slice(k + 1); let boxes = null;
  if (sh.startsWith('[')) boxes = JSON.parse(sh); else if (sh !== 'base') { const [t, w] = sh.split(',').map(Number); boxes = trackStats({seed: s, steps: 1}).boxes.map(b => b.sing ? null : {t, w}); }
  cands.push({id: s + ':' + (sh.length > 20 ? 'custom' : sh), seed: s, tiers: m.tiers, boxes}); }
console.log(JSON.stringify({slot: +slot, cands, start: +start, count: +count, diff: diff || 'medium', players: ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin', 'climb0', 'rush1']}));
