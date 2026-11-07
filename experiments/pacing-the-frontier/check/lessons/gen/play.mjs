// [[ai gen]] Playtest lead's harness: race drawn maps with bots under human-lag keys and log what a player would feel.
//   node gen/play.mjs --draw 4,6 [--maps red-box,steward] --start 2001 --n 20 [--bots coleFollow,maxout] [--json out.json] [--road 1]
//   node gen/play.mjs --draw 4 --bots coleFollow --trace 2001 [--every 1]   one race, one line a second
// Per race (player = lab 0): won, end type, time; each strike and fall with how long before it the obstacle first became known to the player
// ("warn", seconds). A wall hit is tagged when, at the moment it became known, the lab could neither stop before it (0.4 s lag plus braking at
// 15.6) nor jump it: HIDDEN if it first showed up nearer than 85% of the lab's sight range (a shadow: more sight would not have helped), FAST if it
// showed up at sight range and the lab was simply going faster than its sight allows (a fair trade the player chose); the longest stretch stopped (dead time); rivals out and how; who won.
import {load, run} from '../ship/hdnode.mjs';
import {writeFileSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
const draws = (A.draw || '').split(',').filter(Boolean).map(Number), maps = (A.maps || '').split(',').filter(Boolean), start = +(A.start ?? 2001), n = +(A.n ?? 20);
const BOTS = (A.bots || 'coleFollow,maxout,sp-hs-eyes,sp-hs-slow,sp-hs-tail,sp-even-slow,sp-s-bold,sp-h-eyes').split(',');
const api = load(resolve(A.page || join(HERE, 'page.html')), draws.map(s => `gnAdd(gnDraw(${s}));`).join('')), PF = api.PF, step0 = PF.step;
const GEN = {ant: 1, mg: 1.2, commit: 0, ease: null, kick: 0, brake: 8, ready: 1};
let R = null;
PF.step = function (dt) {
  const G = PF.G();
  if (R) { if (R.G !== G) { R.G = G; R.kB = {}; R.kG = {}; R.sB = {}; R.stop = 0; R.stopMax = 0; R.vmax = 0; }
    const me = G.labs[0];
    if (!me.out && !me.done) {
      G.barriers.forEach((b, i) => { if (R.kB[i] === undefined && (b.pub || (me.seenB && me.seenB[i]))) { R.kB[i] = G.t; const v = Math.max(0, me.v), d = b.x - me.x; R.sB[i] = d > 0 && v * 0.4 + v * v / (2 * 15.6) > d && me.pts[1] + 34 < b.h ? (d < 0.85 * (80 + 4.4 * PF.K.sightX / 100 * me.pts[0]) ? ' HIDDEN' : ' FAST') : ''; } });
      G.gaps.forEach((g, i) => { if (R.kG[i] === undefined && (g.pub || (me.seenG && me.seenG[i]))) R.kG[i] = G.t; });
      if (Math.abs(me.v) < 2 && G.t > 1) { R.stop += dt; R.stopMax = Math.max(R.stopMax, R.stop); } else R.stop = 0;
    }
    if (A.trace && G.t >= (R.nt || 0)) { R.nt = (R.nt || 0) + +(A.every || 1);
      const nb = G.barriers.find(b => b.x > me.x), ng = G.gaps.find(g => g.x + g.W > me.x), I = G.input;
      console.log(`t${G.t.toFixed(1)} in ${Math.round((I.pace || 0) * 100)}${I.fwd ? 'F' : ''}${I.rev ? 'R' : ''} [${(I.w || []).map(Math.round)}] | ` + G.labs.map(l => `${l.name.slice(0, 4)} x${l.x | 0} v${l.v | 0} ${l.pts.map(Math.round).join('/')} c${l.cap | 0}${l.strikes ? ' s' + l.strikes : ''}${l.out ? ' OUT' : ''}`).join(' | ') + `  next wall ${nb ? (nb.x | 0) + ':' + nb.h : '-'} box ${ng ? (ng.x | 0) + ' w' + (ng.W | 0) + ' r' + (ng.rise | 0) : '-'}`); }
  }
  return step0.call(this, dt);
};
function race(key, post, seed) {
  R = {G: null};
  const r = run(api, key, null, {...GEN, post}, seed), G = R.G, me = G.labs[0];
  const mine = G.ev.filter(e => e.human || e.who === me.name);
  const inc = mine.filter(e => e.type === 'strike' || e.type === 'dissolved' || e.type === 'fall').map(e => {
    let warn = null, what = e.type;
    if (e.type === 'fall') { const k = e.gap - 1; warn = R.kG[k] !== undefined ? +(e.t - R.kG[k]).toFixed(1) : null; what = `fall box${e.gap} w${e.w} cov${e.cov}${e.ext ? ' WORLD' : ''}`; }
    else { let bi = -1, bd = 1e9; G.barriers.forEach((b, i) => { const d = Math.abs(b.x - e.x); if (d < bd) { bd = d; bi = i; } });
      let gi = -1, gd = 1e9; G.gaps.forEach((g, i) => { const d = Math.min(Math.abs(g.x - e.x), Math.abs(g.x + g.W - e.x)); if (d < gd) { gd = d; gi = i; } });
      if (bd < gd && bi >= 0) { warn = R.kB[bi] !== undefined ? +(e.t - R.kB[bi]).toFixed(1) : null; what = `${e.type} wall${bi + 1} h${G.barriers[bi].h}${R.sB[bi] || ''}`; }
      else if (gi >= 0) { warn = R.kG[gi] !== undefined ? +(e.t - R.kG[gi]).toFixed(1) : null; what = `${e.type} box${gi + 1} (scrape)`; } }
    return {what, t: e.t, warn};
  });
  const riv = G.labs.slice(1), rivOut = riv.filter(l => l.out || l.dissolved).map(l => l.name + (l.dissolved ? ':dis' : l.fellAt !== undefined ? ':fell' : ':out'));
    const rOut = riv.map(l => { const e = G.ev.find(q => q.who === l.name && (q.type === 'dissolved' || q.type === 'fall')); return l.out || l.dissolved ? (e ? e.t : G.t) : null; });
  const alone = r.type !== 'all' && riv.length && rOut.every(x => x !== null) ? +((G.t - Math.max(...rOut)) / Math.max(G.t, 1)).toFixed(2) : 0;
  const out = {key, post, seed, alone, won: r.won, type: r.type, t: r.t, winner: G.result && G.result.winner ? G.result.winner.name : (G.result ? G.result.type : '-'),
    inc, stopMax: +R.stopMax.toFixed(1), rivOut, rivN: riv.length, strikes: me.strikes || 0, presses: r.presses};
  R = null; return out;
}
function road(key) { const m = PF.SEGS.find(s => s.key === key); PF.segUse(PF.SEGS.indexOf(m) + 1); PF.newGame(start); const G = PF.G();
  const items = [...G.barriers.map(b => ({x: b.x, s: `W${b.h}${b.pub ? 'p' : ''}`})), ...G.gaps.map(g => ({x: g.x, s: `B[w${g.W | 0} r${g.rise | 0} ${g.odds ?? ''}%${g.shade ? ' shade' : ''}${g.pub ? ' pub' : ''} ->${g.capTo}]`}))].sort((a, b) => a.x - b.x);
  return `${key} ${m.spec ? m.spec.note : m.title}\n  hideFinish ${!!m.hideFinish}  finish ${G.finish | 0}  rivals ${m.P.rivals.map(q => q.name + '(' + q.post + ')@' + q.x).join(' ')}\n  ` + items.map(i => (i.x | 0) + ':' + i.s).join('  '); }
const res = [];
if (A.trace) { const r = race(draws.length ? 'gn-' + draws[0] : maps[0], BOTS[0], +A.trace); console.log(JSON.stringify(r)); process.exit(0); }
for (const key of [...draws.map(d => 'gn-' + d), ...maps]) {
  if (A.road) console.log(road(key));
  for (const b of BOTS) { const rs = []; for (let i = 0; i < n; i++) rs.push(race(key, b, start + i)); res.push(...rs);
    const w = rs.filter(x => x.won).length, fall = rs.filter(x => x.inc.some(q => q.what.startsWith('fall'))).length, world = rs.filter(x => x.type === 'all').length;
    const dis = rs.filter(x => x.inc.some(q => q.what.startsWith('dissolved'))).length, blind = rs.filter(x => x.inc.some(q => q.what.includes('HIDDEN'))).length;
    const allRivOut = rs.filter(x => x.rivN && x.rivOut.length === x.rivN).length, alone = (rs.reduce((a, x) => a + x.alone, 0) / n).toFixed(2), stop = rs.map(x => x.stopMax).sort((a, b) => a - b)[n >> 1];
    console.log(`  ${b.padEnd(13)} won ${String(w).padStart(2)}/${n}  fall ${fall} world ${world} dissolved ${dis}  hiddenHit ${blind}  allRivOut ${allRivOut} alone ${alone}  medStop ${stop}s  medT ${rs.map(x => x.t).sort((a, b) => a - b)[n >> 1]}  ${rs.map(x => x.won ? 'W' : x.type === 'all' ? 'E' : x.inc.some(q => q.what.startsWith('fall')) ? 'f' : x.inc.some(q => q.what.startsWith('dis')) ? 'd' : '.').join('')}`);
  }
}
if (A.json) writeFileSync(A.json, JSON.stringify(res, null, 1));
