// Trace one run of a campaign map: every 0.5 s, each lab's position, speed, meters and what it knows about its next box.
//   node campaign/trace.mjs --map cp-look --post cpRead --seed 1 [--chill 1]
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
process.env.PF_PAGE = join(HERE, 'page.html');
const {PF, configure} = await import("../../hidden-width/bt.mjs");
const seed = +(A.seed ?? 1), idx = PF.SEGS.findIndex(s => s.key === A.map) + 1;
if (A.patch) Object.assign(PF.SEGS[idx - 1].P, JSON.parse(A.patch));
configure({seed, steps: 1, roster: null, chill: +(A.chill ?? 1), player: 'balanced', strikesYou: null, knobs: {}});
PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
PF.segUse(idx, A.post || PF.SEGS[idx - 1].strategy); PF.newGame(seed, 'probe');
const G = PF.G(), CT = globalThis.CTRL; globalThis.CTRL = (l, GG) => { l.cpDbg = ''; const r = CT(l, GG); l.inp = r; return r; }; console.log(G.gaps.map(g => `box x${g.x} W${g.W} rise${g.rise}`).join(' | '), '| bars', G.barriers.map(b => b.x + ':' + b.h).join(' '), '| finish', G.finish ?? '');
let guard = 0, next = 0;
while (!G.over && guard++ < 40000) {
  PF.step(1 / 60);
  if (G.t >= next) { next += +(A.dt ?? 0.5);
    console.log(G.t.toFixed(1), G.labs.map(l => `${l.name} x${l.x.toFixed(0)} v${l.v.toFixed(0)} [${l.pts.map(p => p.toFixed(0))}]/${l.cap.toFixed(0)} gi${l.gi}${l.cpDbg ? ' ' + l.cpDbg : ''}${A.inp && l.inp ? ' in' + (l.inp.fwd ? 'F' : l.inp.pace.toFixed(2)) + (l.inp.rev ? 'R' : '') + (l.inp.jump ? 'J' : '') : (A.inp ? ' in-null' : '')}${l.out ? ' OUT' : ''}${l.done ? ' DONE' : ''}`).join(' || ')); }
}
console.log('result', G.result && G.result.type, G.result && G.result.winner && G.result.winner.name, G.log.slice(0, 8).map(e => e.msg).reverse().join(' / '));
