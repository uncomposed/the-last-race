// One hand-written segment with one box of hidden width, three labs, three postures. Bot play only.
//   node hidden.mjs [--n 20] [--rise 0.7] [--wlo 0.6] [--whi 1.6] [--bars 0.4,0.5] [--L 300] [--fin 150] [--occlude 0] [--peek 1] [--out results.md]
//   [--trace z [--tracep build]]: print lab 0's state twice a second (to stderr) for width index z when slot 0 plays that posture
// Track: gate, two barriers, one box (rise = --rise of the level ceiling, width = wf x the stop-and-build fit, wf evenly spaced over
// --wlo..--whi across the n draws), then --fin of flat ground to the finish. No singularity. Every lab has the same cruise policy
// (pace 0.7, split 20/50/30 sight/height/speed, stops for barriers it cannot clear) until the box is its next obstacle; then its posture takes over:
//   rush   floor it: go now, whatever the width.
//   build  stop short (just outside the zone where standing leaves a barrier), build height until it can see the far edge (eye over the box top), creeping closer if it has to; then take the
//          run-up a clean cross needs (reversing for room if needed). Height at ceiling and still blind at the face: stand and look.
//          Width known and a fall certain even at the ceiling and top speed: refuse (stand to the time limit). A scrape at best: go.
//   wait   stop short (same spot) and build run-up speed; go only once a rival has crossed, scraped or fallen (the width is public then), or once
//          it can see the far edge itself. Nobody has gone after 15 s: behave like build.
// Each width runs with every rotation of postures over the three lab slots (3 races), so a posture's row sums 3n races.
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
process.env.PF_PAGE = join(HERE, 'page-hidden.html');
const H = await import('./bt.mjs');
const {PF, PFX, K, C, configure, resetAll} = H;
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
const N = +(A.n ?? 20), RISE = +(A.rise ?? 0.7), WLO = +(A.wlo ?? 0.6), WHI = +(A.whi ?? 1.6), OUT = A.out ?? join(HERE, 'results.md');
const BARS = (A.bars ?? '0.4,0.5').split(',').map(Number);
const SEGL = +(A.L ?? 300), FIN = +(A.fin ?? 150);
const PEEK = +(A.peek ?? 1);  // 1: a lab in the air sees box faces over a rival's head, and bots hop to peek (patch.mjs 8); 0: off
const OCC = +(A.occlude ?? 0);  // 1: labs ahead cast the sight shadow (the game's rule); 0: off, so every posture gets its own look at the box
const STANDOFF = () => C.STEPD + 120;  // where build and wait stop: just outside the zone where a standing lab leaves a barrier at the face  // flat ground from the box to the finish  // flat ground between the gate and the run-up to the box  // barrier heights before the box, as fractions of the generator's reference barrier
const POSTURES = ['rush', 'build', 'wait'];
const CRUISE = {pace: 0.7, jit: 0, pit: 1, pitPub: 1, bar: 1, safe: false, w: [20, 50, 30]};

// ---- track: one segment (adapted from scenarios/scen.mjs buildTrack), the box is not the singularity ----
function buildTrack(T, X, wf) {
  const C = X.C, K = X.K, cap = C.CAPS[0], hcap = cap + C.JUMP - 6, ref = (C.JUMP + C.HREF0 + C.HREF1 * 0) * K.barScale / 100;
  const gate = 175, bars = [{x: gate, h: C.JUMP + 18, pub: true, gate: true, seg: 0}];
  let x = gate + C.BW + 60; const L = SEGL, bl = BARS;
  bl.forEach((h, j) => { bars.push({x: Math.round(x + (j + 0.5) / bl.length * L), h: Math.round(Math.min(h * ref, hcap) * 10) / 10, pub: false, seg: 0}); });
  const runup = 170, gx = Math.round(x + L + runup);
  const rise = Math.round(Math.min(RISE * cap, Math.min(C.RISEMAX * cap, cap + 0.5 * C.JUMP)));
  let lim = -60; for (const b of bars) if (b.x < gx) lim = Math.max(lim, b.x + C.BW + 2);
  const vrun = Math.min(C.TOP0 + 0.85 * cap * K.stepV / 100, Math.sqrt(2 * C.ACC * Math.max(gx - lim - 8, 0)));
  const fit = X.boxFit(cap, rise, vrun), W = Math.max(30, Math.round(wf * fit));
  const gaps = [{x: gx, W, crossedBy: -1, stepH: 0, pub: false, sing: false, rise, t: RISE, wd: 0.5, nowarn: false, fit: Math.round(fit), vrun: Math.round(vrun)}];
  const x0 = gx + W + 40;
  Object.assign(T, {gaps, bars, finish: x0 + FIN, n: 1, sing: -1, x0, ni: 0, A: 0.1, sig: 'hidden', label: 'hidden-width', lean: 0});
}

// ---- shared physics views (as audit/race.mjs) ----
const capOn = l => l.capUntil > l.x && !(l.capT !== undefined && PF.G().t >= l.capT);
const topOf = l => { const t = C.TOP0 + 0.85 * l.pts[2]; return capOn(l) ? Math.min(t, Math.sqrt(2 * C.DEC * (C.SIGHT0 + 4.4 * l.pts[0]))) : t; };
function clearAt(G, l, g, v) {  // 0 clean, 1 scrape, 2 fall at speed v with the lab's height, press at BOXU (true width: only called once the width is known)
  const h = l.pts[1], w = PFX.gapWidth ? PFX.gapWidth(l, g) : g.W, jd = PFX.jumpDur(v), u0 = C.BOXU, a0 = h + PFX.arcY(u0);
  const alt = a0 >= g.rise ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v;
  return alt >= g.rise ? 0 : (alt > 0 ? 1 : 2);
}
function cleanSpeed(G, l, g, T0) {  // lowest speed that clears clean at the lab's height (searched up to T0, default the lab's top), or Infinity
  const T = Math.max(T0 ?? topOf(l), 1); if (clearAt(G, l, g, T) !== 0) return Infinity;
  let lo = 1, hi = T; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (clearAt(G, l, g, m) === 0) hi = m; else lo = m; } return hi * 1.04;
}
const ACC9 = () => C.ACC * 0.9;

// ---- postures: return an input or null (null: the page's own bot plan drives, e.g. at barriers) ----
const inp = (pace, w, extra) => Object.assign({pace, w, jump: false, auto: true, rev: false, fwd: false}, extra || {});
function boxIsNext(G, l) {
  const g = G.gaps[l.gi]; if (!g || !PFX.stepOn(g) || l.gx || l.out || l.done) return null;
  const b = G.barriers[l.bi]; if (b && b.x < g.x) return null;              // a barrier first: the bot plan handles it
  if (PFX.towerOf(l, g) && l.pts[1] + C.JUMP < g.stepH + 2) return null;    // a stopped lab's barrier it cannot clear: the bot plan handles it
  if (!(g.pub || l.seenG[l.gi])) return null;                                // not yet seen
  return g;
}
// plan once the width is known: go if the run-up from here reaches a clean speed; else build height if short; else make room or go
function planKnown(G, l, g, st) {
  // judged against what the ceiling allows (full height, full speed meter): the clean speed if there is one, else top speed for a scrape, else nothing.
  // A crash or scrape cap is temporary (it ends by distance or K.capSecs), so it never turns into a refusal.
  const d = g.x - l.x, T = Math.max(topOf(l), 1), TM = Math.max(C.TOP0 + 0.85 * l.cap, 1), atCap = l.pts[1] >= l.cap - 0.5;
  const reach = Math.sqrt(Math.max(l.v, 0) ** 2 + 2 * ACC9() * Math.max(d - 8, 0));
  const vcl = cleanSpeed(G, l, g, TM), target = vcl <= TM ? vcl : (clearAt(G, l, g, TM) === 1 ? TM : Infinity);
  if (target === Infinity) {
    if (!atCap) return inp(0, [0, 100, 0]);                                 // too short: build height and look again
    st.refused = true; return inp(0, [0, 0, 100]);                          // a fall even at full height and full speed: refuse
  }
  if (st.go) return inp(1, CRUISE.w, {fwd: true});
  if (target > T) {                                                         // the meter cannot give that speed yet: build max speed
    if (capOn(l)) { const vmax = Math.sqrt(2 * C.DEC * Math.max(d - 6, 1)); return inp(Math.min(0.3, vmax / T), [0, 0, 100]); }  // walk a cap off
    return inp(0, [0, 0, 100]);
  }
  if (reach >= target) { st.go = true; return inp(1, CRUISE.w, {fwd: true}); }
  const need = target ** 2 / (2 * ACC9()) + 15;                             // run-up room the target speed needs
  if (d < need && l.x > PFX.backLimit(l) + 2) return inp(0, [0, 0, 100], {rev: true});
  if (d < need && clearAt(G, l, g, Math.min(T, reach)) === 2) { st.refused = true; return inp(0, [0, 0, 100]); }  // no room and a fall from here: stand
  st.go = true; return inp(1, CRUISE.w, {fwd: true});
}
// stop short of the box, as far back as a full run-up needs, always able to stop
function holdShort(G, l, g, w, standoff) {
  const d = g.x - l.x, brake = l.v * l.v / (2 * C.DEC);
  if (d - brake > standoff + 10) return inp(CRUISE.pace, w);               // still room: cruise on
  return inp(0, w);                                                         // brake and stand
}
const POST = {
  rush(G, l, g, st) { return inp(1, CRUISE.w, {fwd: true}); },
  build(G, l, g, st) {
    if (st.go || PF.knowsWidth(l, l.gi)) return planKnown(G, l, g, st);
    const atCap = l.pts[1] >= l.cap - 0.5, d = g.x - l.x;
    if (!atCap) return holdShort(G, l, g, [0, 100, 0], STANDOFF());
    // at the ceiling and the far edge still hidden: creep forward, always able to stop, and look again
    if (d <= 8) return inp(0, [0, 100, 0]);                               // at the face, still blind (a rival's shadow, or a box taller than its eye): stand and look
    const vmax = Math.sqrt(2 * C.DEC * Math.max(d - 6, 1));
    return inp(Math.min(0.25, vmax / Math.max(topOf(l), 1)), [0, 100, 0]);
  },
  wait(G, l, g, st) {
    if (st.go || PF.knowsWidth(l, l.gi)) return planKnown(G, l, g, st);
    st.t = (st.t || 0) + 1 / 30;
    if (st.t > 15) return POST.build(G, l, g, st);
    return holdShort(G, l, g, [0, 0, 100], STANDOFF());
  },
};

// ---- one race ----
function race(z, wf, assign) {  // assign: posture per lab slot [lab0, lab1, lab2]
  const seed = 7000 + z;
  configure({seed, steps: 1, roster: ['steward', 'gambler'], chill: 0, player: 'balanced', strikesYou: null, knobs: {occlude: OCC, peek: PEEK}});
  for (const k of ['probe', 'steward', 'gambler']) { PF.POL[k] = Object.assign({}, CRUISE, {w: CRUISE.w.slice()}); PF.SKILL[k] = 100; }
  PF.KINDS.probe = {name: 'Probe', col: 'a', w: CRUISE.w.map(x => x / 100)};
  globalThis.SCEN = (T, X) => buildTrack(T, X, wf);
  PF.newGame(seed, 'probe', ['steward', 'gambler']);
  const G = PF.G(), st = G.labs.map(() => ({})), face = G.labs.map(() => null), saw = G.labs.map(() => null), hops = G.labs.map(() => 0), commit = G.labs.map(() => null), g = G.gaps[0];
  const slotOf = l => G.labs.indexOf(l);
  globalThis.CTRL = (l, GG) => { const gg = boxIsNext(GG, l); if (!gg) return null; const s = slotOf(l); return POST[assign[s]](GG, l, gg, st[s][l.gi] || (st[s][l.gi] = {})); };
  let guard = 0; const TR = A.trace !== undefined && +A.trace === z && assign[0] === (A.tracep || 'build');
  while (!G.over && guard++ < 20000) {
    PF.step(1 / 30);
    if (TR && guard % 15 === 0) { const l0 = G.labs[0], s0 = st[0][0] || {}; console.error('t', (G.t).toFixed(1), 'x', Math.round(l0.x), 'd', Math.round(g.x - l0.x), 'v', Math.round(l0.v), 'h', Math.round(l0.pts[1]), 'sp', Math.round(l0.pts[2]), 'knowsW', PF.knowsWidth(l0, 0), 'go', !!s0.go, 'ref', !!s0.refused, 'cap', capOn(l0), 'bl', Math.round(PFX.backLimit(l0)), 'gx', !!l0.gx, 'out', l0.out, 'bi', l0.bi, 'tower', PFX.towerOf(l0, g)); }
    for (const l of G.labs) { const s = slotOf(l); if (!commit[s] && !l.gx && !l.out && l.gi === 0 && l.v > 1 && g.x - l.x > 0 && l.v * l.v / (2 * C.DEC) >= g.x - l.x - 6) commit[s] = {knew: !!(l.wseen[0] || g.wpub), h: Math.round(l.pts[1]), v: Math.round(l.v), d: Math.round(g.x - l.x), t: Math.round(G.t * 10) / 10}; }
    for (const l of G.labs) { const s = slotOf(l); if (saw[s] === null && l.gi === 0 && l.seenG[0]) saw[s] = Math.round(g.x - l.x); if (l.jt >= 0 && l.jt < 1 / 30 + 1e-9 && l.gi === 0 && g.x - l.x > 120) hops[s]++; }
    for (const l of G.labs) if (l.gx && !face[slotOf(l)]) face[slotOf(l)] = {h: Math.round(l.pts[1]), v: Math.round(l.gx.vf), knew: !!(l.wseen[0] || g.wpub), t: Math.round(G.t * 10) / 10, side: !!l.gx.side};
  }
  globalThis.CTRL = null; globalThis.SCEN = null;
  const res = G.result || {type: 'none'}, ext = G.ev.some(e => e.type === 'fall' && e.ext);
  const rows = G.labs.map((l, s) => {
    const ev = G.ev.filter(e => e.id === l.id && e.gap === 1);
    const out = ev.some(e => e.type === 'fall') ? 'F' : ev.some(e => e.type === 'scrape' || e.type === 'drop') ? 'S' : ev.some(e => e.type === 'first' || e.type === 'cross') ? 'C' : '-';
    return {z, wf: Math.round(wf * 100) / 100, W: g.W, fit: g.fit, rise: g.rise, slot: s, post: assign[s], out, win: res.type === 'win' && res.winner === l ? 1 : 0,
      first: g.crossedBy === l.id ? 1 : 0, refused: st[s][0] && st[s][0].refused ? 1 : 0, face: face[s], saw: saw[s], hops: hops[s], commit: commit[s], barrier: G.ev.some(e => e.id === l.id && e.type === 'barrier') ? 1 : 0, dis: l.dissolved ? 1 : 0, ext: ext ? 1 : 0, t: Math.round(G.t * 10) / 10, result: res.type};
  });
  resetAll(); delete PF.POL.probe; delete PF.KINDS.probe;
  return rows;
}

// ---- run ----
const ROT = [['rush', 'build', 'wait'], ['build', 'wait', 'rush'], ['wait', 'rush', 'build']];
const all = []; const t0 = Date.now();
for (let z = 0; z < N; z++) { const wf = N === 1 ? WLO : WLO + (WHI - WLO) * z / (N - 1); for (const r of ROT) all.push(...race(z, wf, r)); }
const ms = ((Date.now() - t0) / (N * 3)).toFixed(0);

// ---- table ----
const pct = (a, n) => n ? Math.round(100 * a / n) : 0;
const sum = (rs, f) => rs.reduce((a, r) => a + f(r), 0);
const byPost = p => all.filter(r => r.post === p);
const L = [];
L.push(`# Hidden width: one box, three postures`);
L.push(``);
L.push(`[[ai gen]] ${new Date().toISOString().slice(0, 10)}. Bot play only, perfect hands, BOXU ${C.BOXU}. ${N} widths x 3 posture rotations = ${N * 3} races, ${ms} ms a race. Sight shadow ${OCC ? 'on' : 'off'}, jump peek ${PEEK ? 'on' : 'off'}. Segment length ${SEGL}, barriers before the box at ${BARS.join(' and ')} of the reference barrier. Box rise ${all[0].rise} (${RISE} of ceiling ${C.CAPS[0]}), stop-and-build fit ${all[0].fit}, widths ${all[0].W} to ${all[all.length - 1].W} (${WLO} to ${WHI} x fit). Page: page-hidden.html (see patch.mjs). Runner: hidden.mjs.`);
L.push(``);
L.push(`| Posture | Races | Clean | Scrape | Fall | Refused | Went blind | Height at face | Speed at face | Saw the box at | Hops | Left a barrier | First across | Won | Extinction (races) |`);
L.push(`|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
for (const p of POSTURES) {
  const rs = byPost(p), n = rs.length, f = rs.filter(r => r.face);
  L.push(`| ${p} | ${n} | ${pct(sum(rs, r => r.out === 'C'), n)}% | ${pct(sum(rs, r => r.out === 'S'), n)}% | ${pct(sum(rs, r => r.out === 'F'), n)}% | ${pct(sum(rs, r => r.refused), n)}% | ${pct(sum(f, r => (r.commit ? r.commit.knew : r.face.knew) ? 0 : 1), f.length)}% | ${f.length ? Math.round(sum(f, r => r.face.h) / f.length) : '-'} | ${f.length ? Math.round(sum(f, r => r.face.v) / f.length) : '-'} | ${(() => { const q = rs.filter(r => r.saw !== null); return q.length ? Math.round(sum(q, r => r.saw) / q.length) : '-'; })()} | ${(sum(rs, r => r.hops) / n).toFixed(1)} | ${pct(sum(rs, r => r.barrier), n)}% | ${pct(sum(rs, r => r.first), n)}% | ${pct(sum(rs, r => r.win), n)}% | ${pct(sum(rs, r => r.ext), n)}% |`);
}
L.push(``);
L.push(`"Refused": knew the width and stood to the time limit because a fall was certain even at the ceiling and top speed. "Went blind": passed the point where it could still stop short of the face (or reached the face from a standstill) without knowing the width. "Extinction" is the share of that posture's races in which anyone's fall ended the run.`);
L.push(``);
L.push(`## By width (wf = width / stop-and-build fit). Each cell: clean / scrape / fall counts over 3 races, then wins`);
L.push(``);
L.push(`| wf | W | ${POSTURES.join(' | ')} | extinct | time-outs |`);
L.push(`|---|---|${POSTURES.map(() => '---').join('|')}|---|---|`);
const zs = [...new Set(all.map(r => r.z))];
for (const z of zs) {
  const rs = all.filter(r => r.z === z), cells = POSTURES.map(p => { const q = rs.filter(r => r.post === p); return `${q.filter(r => r.out === 'C').length}/${q.filter(r => r.out === 'S').length}/${q.filter(r => r.out === 'F').length} w${sum(q, r => r.win)}`; });
  const races = [...new Set(rs.map(r => r.slot === 0 ? r : null).filter(Boolean))];
  L.push(`| ${rs[0].wf} | ${rs[0].W} | ${cells.join(' | ')} | ${races.filter(r => r.ext).length} | ${races.filter(r => r.result === 'timeout').length} |`);
}
L.push(``);
L.push(`## Not shown`);
L.push(`- Humans. Every lab here has perfect hands and presses at the clean point of the arc.`);
L.push(`- The bar. Nothing draws the hidden far edge; this is the sim rule only.`);
L.push(`- Barriers before the box are the same in every race, so arrival height varies only by posture and by the random bot draws of the seed.`);
L.push(`- While a lab is blocked by a tower it cannot clear, the page's own bot plan drives it, and that plan still reads the true width.`);
writeFileSync(OUT, L.join('\n') + '\n');
writeFileSync(OUT.replace(/\.md$/, '.jsonl'), all.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(L.slice(0, 12).join('\n'));
console.log('wrote', OUT);
