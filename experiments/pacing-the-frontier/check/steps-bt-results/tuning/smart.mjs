// "Box-smart" player probe: can a player who plays boxes by the design rules (stop and build before a box it cannot clear cleanly, then go)
// recover the win rate? Lab 0 runs the custom bot's policy (pace 0.75, w 25/50/25, careful, stops for every blockade) as a probe, plus an outside
// controller applied after each PF.step: when its next box is known and, even at its full top speed, it would not clear it cleanly
// (the page's own flight model; chill: the auto-jump, chill off: peak at the face as bots press), it brakes to a stop short of the face
// (only if it still can) and invests in what is short (height if it is below the rise at the face, else top speed) until a clean clear
// at top speed is predicted, its meters are at the ceiling, or 25 s pass. Then the bot drives again (it backs up for a run-up as usual).
// Stopping leaves a barrier, as the page does for any stop. Speed is overwritten only while braking (never above what the bot chose).
// node smart.mjs '<cfg JSON>' out.json   cfg: {mode: free|daily|campaign, start, count, chill?, players?: ['smart','custom'], knobs?, consts?, strikesYou?, diff?}
import {writeFileSync} from 'node:fs';
import {PF, PFX, K, C, campaignConfig, dailyConfig, GAME} from '../../steps-bt.mjs';
const cfg = JSON.parse(process.argv[2]), out = process.argv[3], players = cfg.players || ['smart', 'custom'];
const K0 = JSON.parse(JSON.stringify(K)), C0 = JSON.parse(JSON.stringify(C)), W0 = [25, 50, 25];
function setup(c, pl) {
  for (const k in K) delete K[k]; Object.assign(K, JSON.parse(JSON.stringify(K0)), c.knobs || {}, {stepGaps: c.steps ?? 1, chill: c.chill ? 1 : 0});
  for (const k in C) delete C[k]; Object.assign(C, JSON.parse(JSON.stringify(C0)), c.consts || {});
  for (const k in PF.SKILL) delete PF.SKILL[k];
  PF.setRoster(null); PF.setPlayerStrikes(c.strikesYou ?? null); PF.setBoxes(c.boxes || null); globalThis.NZ = c.nz || 0;
  PF.POL.probe = {pace: 0.75, jit: 0, pit: 1, pitPub: 1, bar: 1, safe: true, w: W0.slice()}; PF.KINDS.probe = {name: 'Probe', col: 'a', w: [0.25, 0.5, 0.25]}; PF.SKILL.probe = 100;
  return pl === 'custom' ? 'custom' : 'probe';
}
const top = l => { const t = C.TOP0 + 0.85 * l.pts[2]; return l.capUntil > l.x ? Math.min(t, Math.sqrt(2 * C.DEC * (C.SIGHT0 + 4.4 * l.pts[0]))) : t; };  // the page's topSpeed with the crash/scrape cap
function width(G, g) { if (g.crossedBy < 0) return g.W; let f = -1e9; for (const m of G.labs) if (!m.out && m.x > f) f = m.x; return g.W / (1 + Math.min(100, Math.max(0, (f - g.x) / 5)) / K.stepL0); }
function clearAt(G, l, g, v) {  // 0 clean, 1 scrape, 2 fall; also whether it is below the rise at the face
  const h = l.pts[1], w = width(G, g), jd = PFX.jumpDur(v), u0 = K.chill ? Math.min(1, Math.max(0.3, 6 / v) / jd) : 0.5, a0 = h + PFX.arcY(u0);
  const alt = a0 >= g.rise ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v;
  return {o: alt >= g.rise ? 0 : (alt > 0 ? 1 : 2), low: a0 < g.rise};
}
const rows = [];
function race(c, pl, extra) {
  const kind = setup(c, pl); PF.newGame(c.seed, kind, c.roster); const G = PF.G(), l = G.labs[0], hold = {}; let guard = 0, holds = 0, holdT = 0;
  const pol = PF.POL.probe, rest = () => { pol.w = W0.slice(); pol.safe = true; l.basePace = 0.75; };
  while (!G.over && guard++ < 20000) {
    const v0 = l.v; PF.step(1 / 30);
    if (pl !== 'smart' || l.out || l.done) continue;  // 'probe' = the same policy with no controller (identity check)
    if (l.gx) { continue; }
    const g = G.gaps[l.gi];
    if (!g || !PFX.stepOn(g) || !(g.pub || l.seenG[l.gi])) { rest(); continue; }
    const d = g.x - l.x, h = hold[l.gi] || (hold[l.gi] = {t: 0, on: false, go: false, stopAt: 0});
    if (d <= 0) { rest(); continue; }
    const bb = G.barriers[l.bi], barBlock = (bb && bb.x < g.x) || l.bounce || l.crash > 0 || (PFX.towerOf(l, g) && g.stepH > l.pts[1] + C.JUMP - 4);  // a barrier before the box it cannot jump: the bot handles it
    if (h.go && barBlock) { rest(); continue; }
    if (h.go) { pol.safe = false; l.basePace = 1; pol.w = W0.slice(); l.v = Math.min(Math.max(top(l), 1), Math.max(l.v, v0 + C.ACC / 30)); continue; }  // committed run: floor it into the box (as a player holding forward; the bot's own too-short-box brake is overridden)
    const T = Math.max(top(l), 1), atTop = clearAt(G, l, g, T), full = l.pts[1] >= l.cap - 0.5 && l.pts[2] >= l.cap - 0.5;
    let vcl = Infinity; if (atTop.o === 0) { let lo = 1, hi = T; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (clearAt(G, l, g, m).o === 0) hi = m; else lo = m; } vcl = hi * 1.04; }
    const acc = C.ACC * 0.9, reach = Math.sqrt(v0 * v0 + 2 * acc * Math.max(d - 8, 0)), dNeed = Math.min(T, vcl === Infinity ? T : vcl) ** 2 / (2 * acc) + 15;
    if (vcl <= T && reach >= vcl) { h.go = true; h.on = false; pol.safe = false; l.basePace = 1; pol.w = W0.slice(); continue; }
    if (h.t > 25 || (full && vcl === Infinity)) { h.go = true; h.on = false; continue; }  // nothing more to build: go anyway
    // must stand still first: to build (vcl = Infinity) or to get a run-up (vcl > reach). Stop dNeed short of the face if there is still room.
    const brake = v0 * v0 / (2 * C.DEC), room = d - dNeed;
    if (!h.on && brake > d - 12) { h.go = true; continue; }  // too late to stop
    if (!h.on && brake < room - 15) { pol.w = W0.slice(); continue; }  // keep running until it is time to brake
    if (!h.on) { h.on = true; holds++; }
    h.t += 1 / 30; holdT += 1 / 30;
    l.v = Math.max(0, Math.min(l.v, v0 - C.DEC / 30));
    pol.w = vcl === Infinity ? (atTop.low ? [5, 95, 0] : [5, 0, 95]) : [5, 30, 65];
    if (vcl <= T && l.v < 0.5) { h.go = true; h.on = false; }  // standing with enough run-up for a clean jump: go
  }
  rest();
  const p = l, res = G.result || {type: 'none'}, ext = G.ev.find(e => e.type === 'fall' && e.ext);
  rows.push(Object.assign({pl, win: res.type === 'win' && res.winner === p ? 1 : 0, dis: p.dissolved ? 1 : 0, ext: ext ? 1 : 0, extOwn: ext && ext.id === 0 ? 1 : 0, fall: p.st.fl, scr: p.st.sc,
    diag: G.ev.filter(e => e.id === 0 && (e.type === 'scrape' || e.type === 'drop' || e.type === 'fall')).map(e => ({ty: e.type, gap: e.gap, sing: !!(e.sing || e.inner), held: !!(hold[e.gap - 1] && hold[e.gap - 1].t > 0), go: !!(hold[e.gap - 1] && hold[e.gap - 1].go), t: hold[e.gap - 1] ? Math.round(hold[e.gap - 1].t) : 0, side: !!e.side})),
    str: p.strikes, bar: p.st.bc, timeout: res.type === 'timeout' ? 1 : 0, solo: G.labs.length === 1 ? 1 : 0, rwin: res.type === 'win' && res.winner !== p ? 1 : 0, holds, holdT: Math.round(holdT * 10) / 10, t: Math.round(G.t)}, extra));
}
if (cfg.mode === 'free') for (let s = cfg.start; s < cfg.start + cfg.count; s++) for (const pl of players) race(Object.assign({seed: s, roster: null}, cfg), pl, {s});
if (cfg.mode === 'daily') for (let k = cfg.start; k < cfg.start + cfg.count; k++) {
  const ds = new Date(Date.parse(GAME.BRIEFINGS[0].added + 'T00:00:00Z') + k * 864e5).toISOString().slice(0, 10);
  for (let t = 0; t < 3; t++) for (const pl of players) { const c = dailyConfig(ds, t, {chill: cfg.chill ?? 0, steps: 1, knobs: cfg.knobs, consts: cfg.consts}); c.knobs = Object.assign({}, c.knobs); if (cfg.notwist) c.knobs = Object.assign({}, cfg.knobs || {}); race(Object.assign({}, c, {chill: cfg.chill ?? 0}), pl, {s: k, tier: t + 1, tw: c.twist}); }
}
if (cfg.mode === 'campaign') for (let i = 0; i < GAME.CAMPAIGN.length; i++) for (let t = 0; t < 3; t++) for (let z = cfg.start; z < cfg.start + cfg.count; z++) for (const pl of players) {
  const c = campaignConfig(i, t, {diff: cfg.diff || 'medium', chill: cfg.chill ?? 0, steps: 1, knobs: cfg.knobs, consts: cfg.consts});
  if (cfg.strikesYou !== undefined) c.strikesYou = cfg.strikesYou;
  race(Object.assign({}, c, {nz: z, chill: cfg.chill ?? 0}), pl, {s: z, m: i + 1, tier: t + 1});
}
for (const k in K) delete K[k]; Object.assign(K, K0);
writeFileSync(out, JSON.stringify({cfg, rows}) + '\n');
const by = {}; for (const r of rows) { const b = by[r.pl] = by[r.pl] || {n: 0, win: 0, dis: 0, scr: 0, fall: 0, ext: 0, holds: 0, timeout: 0}; b.n++; for (const k of ['win', 'dis', 'scr', 'fall', 'ext', 'holds', 'timeout']) b[k] += r[k]; }
for (const [k, b] of Object.entries(by)) console.log(k, b.n, ['win', 'dis', 'scr', 'fall', 'ext', 'holds', 'timeout'].map(x => x + ' ' + (b[x] / b.n).toFixed(3)).join(' '));
