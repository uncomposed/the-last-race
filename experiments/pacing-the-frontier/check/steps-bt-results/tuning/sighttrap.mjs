// Sight trap, occlusion and crawl-occluder instrument (free mode, steps on). Drives the page's sim directly (PF.newGame + PF.step) so it can look
// at every lab every step; the sim itself is untouched except in --crawl runs, where lab 0's speed is overwritten (see CRAWL below).
// node sighttrap.mjs START COUNT out.json [none|box|bar|both] [steps 1|0] [knobsJSON] [constsJSON]
// Per (lab, box) encounter, classified when the box first becomes known to the lab (public, remembered from view, or behind it):
//   free       could brake to a stop before the face (v^2/2DEC < d - 6, the page's own stop test)
//   committed  could not brake, but at the speed it can reach by the face and its current height the box is cleared clean
//   forced     could not brake and could not clear clean (split by predicted outcome: scrape or fall)
// Height cannot be built while running flat out, so "current height" is the reachable height; timing is the page's (chill auto-jump).
// occluded: the box was inside the lab's sight range earlier than it became known (so a shadow hid it); inTime: when it first came into range
// the lab could still have braked. occ0: lab 0's shadow was one of those hiding it.
import {writeFileSync} from 'node:fs';
import {PF, PFX, K, C, PROBES} from '../../steps-bt.mjs';
const [start, count] = process.argv.slice(2, 4).map(Number), out = process.argv[4], cmode = process.argv[5] || 'none', crawl = cmode !== 'none', STEPS = process.argv[6] === undefined ? 1 : +process.argv[6];
const kn = process.argv[7] ? JSON.parse(process.argv[7]) : {}, cn = process.argv[8] ? JSON.parse(process.argv[8]) : {};
const K0 = JSON.parse(JSON.stringify(K)), C0 = JSON.parse(JSON.stringify(C));
const players = crawl ? ['custom'] : ['custom', ...Object.keys(PROBES)];
function setup(pl) {
  for (const k in K) delete K[k]; Object.assign(K, JSON.parse(JSON.stringify(K0)), {stepGaps: STEPS, chill: 1}, kn);
  for (const k in C) delete C[k]; Object.assign(C, JSON.parse(JSON.stringify(C0)), cn);
  for (const k in PF.SKILL) delete PF.SKILL[k]; delete PF.POL.probe; delete PF.KINDS.probe;
  PF.setRoster(null); PF.setPlayerStrikes(null); PF.setBoxes(null); globalThis.NZ = 0;
  if (PROBES[pl]) { const s = PROBES[pl]; PF.POL.probe = {pace: s.pace, jit: 0, pit: s.pit, pitPub: s.pitPub, bar: s.bar, safe: s.safe, w: s.w.slice()}; PF.KINDS.probe = {name: 'Probe', col: 'a', w: s.w.map(x => x / 100)}; PF.SKILL.probe = 100; return 'probe'; }
  return pl;
}
const sight = l => C.SIGHT0 + 4.4 * l.pts[0], top = l => C.TOP0 + 0.85 * l.pts[2];
function shadowBy(G, l, d) {  // labs whose sight shadow covers distance d ahead of l (prototype.html shadows/inView)
  const sr = sight(l), eye = l.pts[1] + C.RW, by = [];
  for (const m of G.labs) { const db = m.x - l.x; if (m === l || m.out || m.done || db <= 0 || db >= sr) continue;
    const tp = m.pts[1] + C.RW, end = eye > tp ? db * eye / (eye - tp) : sr; if (end > db && d > db && d < Math.min(end, sr)) by.push(m.id); }
  return by;
}
function width(G, g) { if (g.crossedBy < 0) return g.W; let f = -1e9; for (const m of G.labs) if (!m.out && m.x > f) f = m.x; return g.W / (1 + Math.min(100, Math.max(0, (f - g.x) / 5)) / K.stepL0); }
function predict(G, l, g, d) {  // outcome at the face if it goes now at the best reachable speed with its height: 0 clean, 1 scrape, 2 fall
  const v = Math.max(1, Math.min(top(l), Math.sqrt(l.v * l.v + 2 * C.ACC * 0.9 * Math.max(d, 0)))), h = l.pts[1], w = width(G, g), jd = PFX.jumpDur(v);
  const u0 = K.chill ? Math.min(1, Math.max(0.3, 6 / v) / jd) : 0.5, a0 = h + PFX.arcY(u0);
  const alt = a0 >= g.rise ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v;
  return alt >= g.rise ? 0 : (alt > 0 ? 1 : 2);
}
const enc = [], races = [];
for (let s = start; s < start + count; s++) for (const pl of players) {
  const kind = setup(pl); PF.newGame(s, kind, null); const G = PF.G(), L = G.labs.length;
  const E = G.labs.map(() => G.gaps.map(() => null)), inRange = G.labs.map(() => G.gaps.map(() => null)), entry = G.labs.map(() => G.gaps.map(() => null));
  const hold = {}; let guard = 0, step = 0;
  while (!G.over && guard++ < 20000) {
    const gx0 = G.labs.map(l => l.gx);
    PF.step(1 / 30); step++;
    for (const l of G.labs) {
      if (l.out || l.done) continue;
      if (l.gx && !gx0[l.id] && !entry[l.id][l.gi]) entry[l.id][l.gi] = {side: l.gx.side ? 1 : 0, v: l.v, top: top(l), a0: l.gx.alt, rise: G.gaps[l.gi].rise};
      for (let i = l.gi; i < G.gaps.length; i++) {
        const g = G.gaps[i]; if (!PFX.stepOn(g)) { if (!STEPS) break; continue; }
        const d = g.x - l.x; if (d > sight(l) + 5 && !g.pub) break;
        if (d > 0 && d <= sight(l) && !inRange[l.id][i]) {
          const brake = l.v * l.v / (2 * C.DEC); inRange[l.id][i] = {step, canStop: brake < d - 6 ? 1 : 0, by: shadowBy(G, l, d)};
        }
        const known = g.pub || l.gi > i || !!l.seenG[i];
        if (known && !E[l.id][i]) {
          const brake = l.v * l.v / (2 * C.DEC), canStop = brake < d - 6, p = d > 0 ? predict(G, l, g, d) : 0, ir = inRange[l.id][i];
          const occ = ir && ir.step < step && ir.by.length > 0 ? 1 : 0;
          E[l.id][i] = {lab: l.id, kind: l.id === 0 ? pl : l.kind, sight: Math.round(sight(l)), d: Math.round(d), v: Math.round(l.v), brake: Math.round(brake),
            cls: canStop ? 'free' : (p === 0 ? 'committed' : 'forced'), pred: p, occ, inTime: occ && ir.canStop && !canStop ? 1 : 0, occ0: occ && ir.by.includes(0) ? 1 : 0,
            nowarn: g.nowarn ? 1 : 0, sing: g.sing ? 1 : 0, gap: i};
        }
      }
    }
    if (crawl) {  // CRAWL: lab 0 slows to a crawl (speed 4, never still, so it never leaves a box barrier) 15-45 short of the next box face (box mode) and/or
      // barrier (bar mode) while a rival that has not passed it is behind within 150, for up to 4 s per obstacle, then the custom bot drives again
      const l = G.labs[0];
      if (!l.out && !l.done && !l.gx && l.v > 4) {
        const g = G.gaps[l.gi], b = G.barriers[l.bi], behind = G.labs.some(m => m !== l && !m.out && !m.done && m.x < l.x && l.x - m.x < 150);
        const tg = (cmode !== 'bar' && g && PFX.stepOn(g)) ? {k: 'g' + l.gi, d: g.x - l.x} : null, tb = (cmode !== 'box' && b) ? {k: 'b' + l.bi, d: b.x - l.x} : null;
        for (const t of [tg, tb]) if (t && t.d > 15 && t.d < 45 && behind && (hold[t.k] || 0) < 4) { l.v = 4; hold[t.k] = (hold[t.k] || 0) + 1 / 30; G.cnt.crawl = (G.cnt.crawl || 0) + 1; break; }
      }
    }
  }
  const ext = G.ev.find(e => e.type === 'fall' && e.ext);
  for (const l of G.labs) for (let i = 0; i < G.gaps.length; i++) {
    const e = E[l.id][i]; if (!e) continue;
    const ev = G.ev.filter(x => x.id === l.id && x.gap === i + 1);
    const f = ev.find(x => x.type === 'fall'), sc = ev.find(x => x.type === 'scrape' || x.type === 'drop'), cr = ev.find(x => x.type === 'first' || x.type === 'cross');
    e.out = f ? (f.ext ? 'ext' : 'fall') : (sc ? 'scrape' : (cr ? 'clean' : 'none'));
    const en = entry[l.id][i]; e.side = en ? en.side : 0;
    if (f && en) { e.full = en.v >= 0.95 * en.top ? 1 : 0; e.short = en.a0 < en.rise ? 1 : 0; }
    e.s = s; e.pl = pl; enc.push(e);
  }
  races.push({s, pl, win: G.result && G.result.type === 'win' && G.result.winner.id === 0 ? 1 : 0, ext: ext ? 1 : 0, extBy: ext ? ext.id : -1, p0out: G.labs[0].out && !(ext && ext.id === 0) ? 1 : 0,
    p0fell: G.labs[0].st.fl, p0dis: G.labs[0].dissolved ? 1 : 0, rivalFalls: G.labs.slice(1).reduce((a, l) => a + l.st.fl, 0), crawlSteps: G.cnt.crawl || 0, rivalStrikes: G.labs.slice(1).reduce((a, l) => a + l.strikes, 0), rivalDis: G.labs.slice(1).reduce((a, l) => a + (l.dissolved ? 1 : 0), 0), rivalBarCrash: G.labs.slice(1).reduce((a, l) => a + l.st.bc, 0), rivalScr: G.labs.slice(1).reduce((a, l) => a + l.st.sc, 0), p0str: G.labs[0].strikes,
    p0killedByRival: ext && ext.id !== 0 && !G.labs[0].st.fl && !G.labs[0].dissolved ? 1 : 0});
}
for (const k in K) delete K[k]; Object.assign(K, K0);
writeFileSync(out, JSON.stringify({enc, races}) + '\n');
