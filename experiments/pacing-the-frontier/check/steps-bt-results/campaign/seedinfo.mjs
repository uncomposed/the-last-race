// Static facts for seeds a..b with step gaps on: gaps, barriers (count, tall ones), nowarn, nearMax, finish, label. -> JSON lines
import {trackStats, PF, GAME} from '../../steps-bt.mjs';
const [a, b] = process.argv.slice(2).map(Number); const out = [];
for (let s = a; s <= b; s++) { const T = trackStats({seed: s, steps: 1}); const G = PF.G();
  out.push({s, n: T.n, nb: G.barriers.length, tallB: G.barriers.filter(x => x.h > 150).length, nowarn: T.nowarn, nearMax: T.nearMax, fin: T.finish, lean: T.lean,
    shapes: T.boxes.filter(x => x.shape && !x.sing).map(x => x.shape[0] + (x.shape.includes('narrow') ? 'n' : 'w')).join('') }); }
console.log(JSON.stringify(out));
