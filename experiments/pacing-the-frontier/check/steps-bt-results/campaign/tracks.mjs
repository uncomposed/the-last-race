// Print step-gap box shapes for campaign seeds (or arbitrary seeds): node tracks.mjs [seed ...] [--boxes JSON]
import {trackStats, GAME} from '../../steps-bt.mjs';
const args = process.argv.slice(2); let boxes = null; const seeds = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--boxes') boxes = JSON.parse(args[++i]); else seeds.push(+args[i]); }
const list = seeds.length ? seeds : GAME.CAMPAIGN.map(m => m.seed);
for (const s of list) {
  const T = trackStats({seed: s, steps: 1, boxes});
  console.log(`seed ${s} ${T.label} lean ${T.lean} finish ${T.finish} n ${T.n} nearMax ${T.nearMax} nowarn ${T.nowarn}`);
  for (const b of T.boxes) console.log(`  g${b.i} lv${b.lv} cap${b.cap} W${b.W} rise${b.rise}${b.sing ? ' SING' : ''}${b.inner ? ' inner' : ''} ${b.shape || ''} t${b.t} w${b.w} hNeedBot${b.hNeedBot} hNeed${b.hNeed} ${b.nearMax ? 'NEARMAX' : ''} ${b.nowarn ? 'NOWARN' : ''} odds${b.odds}`);
}
