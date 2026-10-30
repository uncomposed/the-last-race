// COPY of ../tuning/boxprobe.mjs (owned by the tuning agent), import repointed to ./bt.mjs so PF_PAGE can select the patched page. Do not edit here.
// Box-competent player probes for step gaps, plus the crawl-occluder tactic. Lab 0 runs a bot policy (the custom bot by default, or any
// harness PROBES entry) and an outside controller adjusts it after every PF.step. The page's sim is not edited; the controller only
// lowers lab 0's speed (braking, crawling) or, in `smart`, holds it at the forward key's acceleration and changes its meter split.
// The harness's runRace has no per-step hook, so these run through runBoxRace below, which configures a race exactly as the harness's
// campaignConfig / dailyConfig objects describe (K knobs, C constants, roster, player strikes, box overrides, rival-noise id) and returns
// a row with the same player fields as runRace's record (outcome, labs[0] scrapes/falls/strikes...) plus the rival totals.
//
// Modes (opts.mode):
//   none        the base policy alone (identity check: equals runRace for the same player)
//   crawl       slow to a crawl (speed 4, never still, so no barrier is left) 15-45 short of each box face, for up to 4 s, always.
//               This is "do not carry speed into a box": the bot then brakes, backs up and takes a measured run-up as it would from rest.
//   crawlOcc    the same, but only while a rival is behind within 150 (Cole's occluder: rivals behind cannot see the box past you)
//   crawlBar    crawlOcc at barriers instead of boxes; crawlBoth: at both
//   smart       plan each box: stop short and build (height if below the rise at the face, else top speed) until a clean clear at top speed is
//               predicted, stop far enough back for the run-up it needs, then floor it (never with a barrier in between, never while bouncing)
//
// import {runBoxRace, MODES} from './boxprobe.mjs'; runBoxRace({seed, roster, knobs, consts, strikesYou, boxes, nz, chill, steps}, {mode, base})
import {PF, PFX, K, C, PROBES} from './bt.mjs';
export const MODES = ['none', 'crawl', 'crawlOcc', 'crawlBar', 'crawlBoth', 'smart'];
const K0 = JSON.parse(JSON.stringify(K)), C0 = JSON.parse(JSON.stringify(C));
const CUSTOM = {pace: 0.75, w: [25, 50, 25], safe: true, pit: 1, pitPub: 1, bar: 1};
function setup(c, base) {
  for (const k in K) delete K[k]; Object.assign(K, JSON.parse(JSON.stringify(K0)), c.knobs || {}, {stepGaps: c.steps ?? 1, chill: c.chill ? 1 : 0});
  for (const k in C) delete C[k]; Object.assign(C, JSON.parse(JSON.stringify(C0)));
  for (const [k, v] of Object.entries(c.consts || {})) C[k] = Array.isArray(v) ? v.slice() : v;
  for (const k in PF.SKILL) delete PF.SKILL[k];
  PF.setRoster(null); PF.setPlayerStrikes(c.strikesYou ?? null); PF.setBoxes(c.boxes || null); globalThis.NZ = c.nz || 0;
  const s = base && PROBES[base] ? PROBES[base] : CUSTOM;
  PF.POL.probe = {pace: s.pace, jit: 0, pit: s.pit, pitPub: s.pitPub, bar: s.bar, safe: s.safe, w: s.w.slice()};
  PF.KINDS.probe = {name: 'Probe', col: 'a', w: s.w.map(x => x / 100)}; PF.SKILL.probe = 100;
  return s;
}
function restore() { for (const k in K) delete K[k]; Object.assign(K, JSON.parse(JSON.stringify(K0))); for (const k in C) delete C[k]; Object.assign(C, JSON.parse(JSON.stringify(C0))); delete PF.POL.probe; delete PF.KINDS.probe; for (const k in PF.SKILL) delete PF.SKILL[k]; PF.setPlayerStrikes(null); PF.setBoxes(null); globalThis.NZ = 0; }
const top = l => { const t = C.TOP0 + 0.85 * l.pts[2]; return l.capUntil > l.x ? Math.min(t, Math.sqrt(2 * C.DEC * (C.SIGHT0 + 4.4 * l.pts[0]))) : t; };  // the page's topSpeed with the crash/scrape cap
function width(G, g) { if (g.crossedBy < 0) return g.W; let f = -1e9; for (const m of G.labs) if (!m.out && m.x > f) f = m.x; return g.W / (1 + Math.min(100, Math.max(0, (f - g.x) / 5)) / K.stepL0); }
function clearAt(G, l, g, v) {  // the page's box flight (boxOutcome): 0 clean, 1 scrape, 2 fall; low = below the rise at the face
  const h = l.pts[1], w = width(G, g), jd = PFX.jumpDur(v), u0 = K.chill ? Math.min(1, Math.max(0.3, 6 / v) / jd) : 0.5, a0 = h + PFX.arcY(u0);
  const alt = a0 >= g.rise ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v;
  return {o: alt >= g.rise ? 0 : (alt > 0 ? 1 : 2), low: a0 < g.rise};
}
export function runBoxRace(c, {mode = 'crawl', base = null} = {}) {
  const s = setup(c, base), W0 = s.w.slice(), P0 = s.pace;
  PF.newGame(c.seed, 'probe', c.roster); const G = PF.G(), l = G.labs[0], pol = PF.POL.probe, hold = {};
  let guard = 0, holds = 0, crawlT = 0;
  const rest = () => { pol.w = W0.slice(); pol.safe = s.safe; l.basePace = P0; };
  while (!G.over && guard++ < 20000) {
    const v0 = l.v; PF.step(1 / 30);
    if (mode === 'none' || l.out || l.done || l.gx) continue;
    if (mode !== 'smart') {
      if (l.v <= 4) continue;
      const g = G.gaps[l.gi], b = G.barriers[l.bi], occ = mode !== 'crawl';
      if (occ && !G.labs.some(m => m !== l && !m.out && !m.done && m.x < l.x && l.x - m.x < 150)) continue;
      const tg = (mode === 'crawl' || mode === 'crawlOcc' || mode === 'crawlBoth') && g && PFX.stepOn(g) ? {k: 'g' + l.gi, d: g.x - l.x} : null;
      const tb = (mode === 'crawlBar' || mode === 'crawlBoth') && b ? {k: 'b' + l.bi, d: b.x - l.x} : null;
      for (const t of [tg, tb]) if (t && t.d > 15 && t.d < 45 && (hold[t.k] || 0) < 4) { l.v = 4; hold[t.k] = (hold[t.k] || 0) + 1 / 30; crawlT += 1 / 30; break; }
      continue;
    }
    // smart
    const g = G.gaps[l.gi];
    if (!g || !PFX.stepOn(g) || !(g.pub || l.seenG[l.gi])) { rest(); continue; }
    const d = g.x - l.x, h = hold[l.gi] || (hold[l.gi] = {t: 0, on: false, go: false});
    if (d <= 0) { rest(); continue; }
    const bb = G.barriers[l.bi], barBlock = (bb && bb.x < g.x) || l.bounce || l.crash > 0 || (PFX.towerOf(l, g) && g.stepH > l.pts[1] + C.JUMP - 4);
    if (h.go && barBlock) { rest(); continue; }
    if (h.go) { pol.safe = false; l.basePace = 1; pol.w = W0.slice(); l.v = Math.min(Math.max(top(l), 1), Math.max(l.v, v0 + C.ACC / 30)); continue; }
    const T = Math.max(top(l), 1), atTop = clearAt(G, l, g, T), full = l.pts[1] >= l.cap - 0.5 && l.pts[2] >= l.cap - 0.5;
    let vcl = Infinity; if (atTop.o === 0) { let lo = 1, hi = T; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (clearAt(G, l, g, m).o === 0) hi = m; else lo = m; } vcl = hi * 1.04; }
    const acc = C.ACC * 0.9, reach = Math.sqrt(v0 * v0 + 2 * acc * Math.max(d - 8, 0)), dNeed = Math.min(T, vcl === Infinity ? T : vcl) ** 2 / (2 * acc) + 15;
    if (vcl <= T && reach >= vcl) { h.go = true; h.on = false; continue; }
    if (h.t > 25 || (full && vcl === Infinity)) { h.go = true; h.on = false; continue; }
    const brake = v0 * v0 / (2 * C.DEC), room = d - dNeed;
    if (!h.on && brake > d - 12) { h.go = true; continue; }
    if (!h.on && brake < room - 15) { pol.w = W0.slice(); continue; }
    if (!h.on) { h.on = true; holds++; }
    h.t += 1 / 30; crawlT += 1 / 30;
    l.v = Math.max(0, Math.min(l.v, v0 - C.DEC / 30));
    pol.w = vcl === Infinity ? (atTop.low ? [5, 95, 0] : [5, 0, 95]) : [5, 30, 65];
    if (vcl <= T && l.v < 0.5) { h.go = true; h.on = false; }
  }
  rest();
  const res = G.result || {type: 'none'}, ext = G.ev.find(e => e.type === 'fall' && e.ext), R = G.labs.slice(1), sum = f => R.reduce((a, m) => a + f(m), 0);
  const out = {outcome: res.type === 'win' && res.winner === l ? 'win' : (l.dissolved ? 'dissolved' : (ext ? 'extinct' : 'lost')), type: res.type,
    win: res.type === 'win' && res.winner === l ? 1 : 0, dis: l.dissolved ? 1 : 0, ext: ext ? 1 : 0, extOwn: ext && ext.id === 0 ? 1 : 0, extByRival: ext && ext.id !== 0 ? 1 : 0,
    killedByRivalRoll: ext && ext.id !== 0 && !l.st.fl && !l.dissolved ? 1 : 0, fall: l.st.fl, scr: l.st.sc, str: l.strikes, bar: l.st.bc, rwin: res.type === 'win' && res.winner !== l ? 1 : 0,
    rivalStrikes: sum(m => m.strikes), rivalDis: sum(m => m.dissolved ? 1 : 0), rivalFalls: sum(m => m.st.fl), rivalBar: sum(m => m.st.bc), rivalScr: sum(m => m.st.sc),
    aF: G.labs.reduce((a, m) => a + m.st.fl, 0), nw: G.gaps.filter(g => g.nowarn).length, holds, crawlT: Math.round(crawlT * 10) / 10, t: Math.round(G.t * 10) / 10};
  restore();
  return out;
}
