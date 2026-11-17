// [[ai gen]] One race, one line per second: node reader/trace.mjs <map> <post> <seed> [every]
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), [key, post, seedS, everyS] = process.argv.slice(2);
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import('../../hidden-width/bt.mjs');
const seed = +seedS, every = +(everyS ?? 1), seg = PF.SEGS.find(s => s.key === key), idx = PF.SEGS.indexOf(seg) + 1;
configure({seed, steps: 1, roster: null, chill: 1, player: 'balanced', strikesYou: null, knobs: {}});
PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100; PF.segUse(idx, post); PF.newGame(seed, 'probe');
const G = PF.G(), me = G.labs[0]; let g = 0, lt = -1;
console.log('walls', G.barriers.map(b => `${b.x|0}:${b.h}`).join(' '), '| boxes', G.gaps.map(q => `${q.x|0}:${q.W|0}w${q.rise|0}r`).join(' '), '| finish', G.finish|0);
while (!G.over && g++ < 40000) { PF.step(1 / 60); const t = Math.floor(G.t / every);
  if (t !== lt) { lt = t; const r = l => `${l.name[0]} x${l.x|0} v${l.v|0} ${l.pts.map(Math.round).join('/')} c${l.cap|0}${l.strikes ? ' s' + l.strikes : ''}${l.out ? ' OUT' : ''}`;
    console.log(`t${G.t.toFixed(0)} ${me.cfR || ''} p${me.inp?.pace?.toFixed?.(2) ?? ''} | ` + G.labs.map(r).join(' | ')); } }
console.log('result', G.result?.type, G.result?.winner?.name, 't', G.t.toFixed(1));
