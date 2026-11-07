// One race, key moments only: every strike, fall, wall and first crossing, with each lab's state when you fell. node ship/why.mjs --map k --post p --seed n
import {dirname, join} from 'node:path'; import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1];
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import('../../hidden-width/bt.mjs');
const idx = PF.SEGS.findIndex(s => s.key === A.map) + 1;
configure({seed: +A.seed, steps: 1, roster: null, chill: 1, player: 'balanced', strikesYou: null, knobs: {}});
PF.KINDS.probe = {name: 'You', col: 'a', w: [.2, .5, .3]}; PF.SKILL.probe = 100;
PF.segUse(idx, A.post); PF.newGame(+A.seed, 'probe'); const G = PF.G(); let g = 0, seen = 0;
console.log(G.gaps.map(x => `${x.x}:${x.W}/${x.rise}`).join(' '), '| bars', G.barriers.slice(1).map(b => b.x + ':' + b.h).join(' '), '| end', Math.round(G.finish));
while (!G.over && g++ < 40000) { PF.step(1 / 60); const m = G.log; const n = m.length;
  if (n > seen) { for (const e of m.slice(0, n - seen).reverse()) if (/fell|strike|dissolve|first across|put up|Rolled/.test(e.msg)) console.log(G.t.toFixed(1), e.msg.slice(0, 90), '|', G.labs.map(l => `${l.name[0]} ${l.x | 0} v${l.v | 0} [${l.pts.map(p => p | 0)}]`).join(' ')); seen = n; } }
console.log('end', G.t.toFixed(1), G.result?.type, G.result?.winner?.name);
