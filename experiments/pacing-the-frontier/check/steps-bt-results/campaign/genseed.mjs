// Seed re-pick candidates: node genseed.mjs slot from to shape(base|t,w) players start count [maxGaps] > spec.json
// shape t,w overrides every non-singularity box with {t,w}; base keeps the generated shapes.
import {GAME, trackStats} from '../../steps-bt.mjs';
const [slot, from, to, shape, players, start, count, maxG] = process.argv.slice(2);
const m = GAME.CAMPAIGN[+slot - 1], cands = [];
for (let s = +from; s <= +to; s++) {
  const T = trackStats({seed: s, steps: 1});
  if (maxG && T.n > +maxG) continue;
  let boxes = null;
  if (shape !== 'base') { const [t, w] = shape.split(',').map(Number); boxes = T.boxes.map(b => b.sing ? null : {t, w}); }
  cands.push({id: 's' + s, seed: s, tiers: m.tiers, boxes});
}
console.log(JSON.stringify({slot: +slot, cands, start: +start, count: +count, diff: 'medium', players: players.split(',')}));
