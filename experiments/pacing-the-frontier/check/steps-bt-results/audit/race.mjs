// Auditor's unified runner. One step loop per race (PF.newGame + PF.step(1/30), as runRace) with read-only instrumentation, plus the tuning
// agent's crawl / smart controllers (copied from ../tuning/boxprobe.mjs; smart's flight check uses C.BOXU when the page has it, else 0.5).
// Page: --page <file> (sets PF_PAGE before the harness copy ./bt.mjs loads). Output: one JSON row per race (--out file.jsonl).
//   node race.mjs --page P --mode free|campaign|daily --start N --count M --steps 0|1 --plus 0|1 [--players a,b] [--chill 0|1]
//                 [--swap swap.json] [--steptw JSON] [--maps 1,2] --out file.jsonl
// players: the 10 harness probes by name, 'crawl' (crawl at every box, gamble base, no jitter), 'smart' (stop and build, custom base)
// --plus 1: the player gets one strike more than the rivals' base (campaign: CAMP_DIFF Medium + 1; free/daily: K.strikes after the twist + 1)
import {writeFileSync} from 'node:fs';
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
if (A.page) process.env.PF_PAGE = new URL(A.page, 'file://' + process.cwd() + '/').pathname;
if (A.steptw) process.env.STEPTW = A.steptw;
const H = await import('./bt.mjs');
const {PF, PFX, K, C, PROBES, GAME, configure, resetAll, campaignConfig, dailyConfig} = H;
if (process.env.STEPTW) for (const [k, v] of Object.entries(JSON.parse(process.env.STEPTW))) { const o = GAME.TWISTS[k]; for (const x in o) delete o[x]; Object.assign(o, v); }

const CUSTOM = {pace: 0.75, w: [25, 50, 25], safe: true, pit: 1, pitPub: 1, bar: 1};
const top = l => { const t = C.TOP0 + 0.85 * l.pts[2]; return l.capUntil > l.x ? Math.min(t, Math.sqrt(2 * C.DEC * (C.SIGHT0 + 4.4 * l.pts[0]))) : t; };
const topRaw = l => C.TOP0 + 0.85 * l.pts[2];
const sight = l => C.SIGHT0 + 4.4 * l.pts[0];
const U0 = v => { const jd = PFX.jumpDur(v); return K.chill ? Math.min(1, Math.max(0.3, 6 / v) / jd) : (C.BOXU ?? 0.5); };
function width(G, g) { if (g.crossedBy < 0) return g.W; let f = -1e9; for (const m of G.labs) if (!m.out && m.x > f) f = m.x; return g.W / (1 + Math.min(100, Math.max(0, (f - g.x) / 5)) / K.stepL0); }
function clearAt(G, l, g, v) {
  const h = l.pts[1], w = width(G, g), jd = PFX.jumpDur(v), u0 = U0(v), a0 = h + PFX.arcY(u0);
  const alt = a0 >= g.rise ? PFX.flightAlt(v, h, w, u0) : a0 - PFX.sinkRate(jd) * w / v;
  return {o: alt >= g.rise ? 0 : (alt > 0 ? 1 : 2), low: a0 < g.rise};
}
function nearestObstacle(G, l) {
  const b = G.barriers[l.bi], g = G.gaps[l.gi];
  const db = b ? b.x - l.x : Infinity, dg = g ? (PFX.towerOf(l, g) ? PFX.stepX(g) : g.x) - l.x : Infinity;
  if (db === Infinity && dg === Infinity) return 'end';
  return db <= dg ? 'b' + l.bi : 'g' + l.gi;
}
// sight trap (as ../tuning/sighttrap.mjs): when a box first becomes known to a lab: free (can brake), committed (can't brake, clears clean), forced
function predict(G, l, g, d) {
  const v = Math.max(1, Math.min(topRaw(l), Math.sqrt(l.v * l.v + 2 * C.ACC * 0.9 * Math.max(d, 0)))), h = l.pts[1];
  return clearAt(G, l, g, v).o;
}

export function race(cfg, player) {
  const base = player === 'crawl' ? 'gamble' : (player === 'smart' ? 'gamble' : player);
  configure(Object.assign({}, cfg, {player: base, jitter: (player === 'crawl' || player === 'smart') ? null : (cfg.jitter ?? null)}));
  let S = PROBES[base];
  if (player === 'smart') { S = CUSTOM; PF.POL.probe = {pace: S.pace, jit: 0, pit: S.pit, pitPub: S.pitPub, bar: S.bar, safe: S.safe, w: S.w.slice()}; PF.KINDS.probe = {name: 'Probe', col: 'a', w: S.w.map(x => x / 100)}; }
  PF.newGame(cfg.seed, 'probe', cfg.roster);
  const G = PF.G(), l = G.labs[0], pol = PF.POL.probe, W0 = pol.w.slice(), P0 = pol.pace, hold = {};
  const tr = G.labs.map(() => ({moved: false, resting: false, revving: false, keys: new Set()}));
  const known = G.labs.map(() => new Uint8Array(G.gaps.length)), enc = {n: 0, forced: 0, n0: 0, forced0: 0};
  const rest = () => { pol.w = W0.slice(); pol.safe = S.safe; l.basePace = P0; };
  let guard = 0;
  while (!G.over && guard++ < 20000) {
    const v0 = l.v; PF.step(1 / 30);
    for (let i = 0; i < G.labs.length; i++) {  // stop-and-reverse (as runRace) and sight-trap encounters
      const m = G.labs[i], s = tr[i];
      if (m.out || m.done) continue;
      if (m.v > 1) s.moved = true;
      const rs = s.moved && m.still >= 0.3, rv = m.v < -0.5 && !m.bounce;
      if (rs && !s.resting) s.keys.add(nearestObstacle(G, m));
      if (rv && !s.revving) s.keys.add(nearestObstacle(G, m));
      s.resting = rs; s.revving = rv;
      if (!K.stepGaps) continue;
      for (let j = m.gi; j < G.gaps.length; j++) {
        const g = G.gaps[j]; if (!PFX.stepOn(g)) continue;
        const d = g.x - m.x; if (d > sight(m) + 5 && !g.pub) break;
        if (known[i][j]) continue;
        if (g.pub || m.gi > j || m.seenG[j]) {
          known[i][j] = 1; const canStop = m.v * m.v / (2 * C.DEC) < d - 6, forced = !canStop && d > 0 && predict(G, m, g, d) !== 0;
          enc.n++; if (forced) enc.forced++; if (i === 0) { enc.n0++; if (forced) enc.forced0++; }
        }
      }
    }
    if (player !== 'crawl' && player !== 'smart') continue;
    if (l.out || l.done || l.gx) continue;
    if (player === 'crawl') {
      if (l.v <= 4) continue;
      const g = G.gaps[l.gi];
      if (g && PFX.stepOn(g)) { const k = 'g' + l.gi, d = g.x - l.x; if (d > 15 && d < 45 && (hold[k] || 0) < 4) { l.v = 4; hold[k] = (hold[k] || 0) + 1 / 30; } }
      continue;
    }
    const g = G.gaps[l.gi];  // smart (copied)
    if (!g || !PFX.stepOn(g) || !(g.pub || l.seenG[l.gi])) { rest(); continue; }
    const d = g.x - l.x, h = hold[l.gi] || (hold[l.gi] = {t: 0, on: false, go: false});
    if (d <= 0) { rest(); continue; }
    const bb = G.barriers[l.bi], barBlock = (bb && bb.x < g.x) || l.bounce || l.crash > 0 || (PFX.towerOf(l, g) && g.stepH > l.pts[1] + C.JUMP - 4);
    if (h.go && barBlock) { rest(); continue; }
    if (h.go) { pol.safe = false; l.basePace = 1; pol.w = W0.slice(); l.v = Math.min(Math.max(top(l), 1), Math.max(l.v, v0 + C.ACC / 30)); continue; }
    const T = Math.max(top(l), 1), atTop = clearAt(G, l, g, T), full = l.pts[1] >= l.cap - 0.5 && l.pts[2] >= l.cap - 0.5;
    let vcl = Infinity; if (atTop.o === 0) { let lo = 1, hi = T; for (let i = 0; i < 20; i++) { const mm = (lo + hi) / 2; if (clearAt(G, l, g, mm).o === 0) hi = mm; else lo = mm; } vcl = hi * 1.04; }
    const acc = C.ACC * 0.9, reach = Math.sqrt(v0 * v0 + 2 * acc * Math.max(d - 8, 0)), dNeed = Math.min(T, vcl === Infinity ? T : vcl) ** 2 / (2 * acc) + 15;
    if (vcl <= T && reach >= vcl) { h.go = true; h.on = false; continue; }
    if (h.t > 25 || (full && vcl === Infinity)) { h.go = true; h.on = false; continue; }
    const brake = v0 * v0 / (2 * C.DEC), room = d - dNeed;
    if (!h.on && brake > d - 12) { h.go = true; continue; }
    if (!h.on && brake < room - 15) { pol.w = W0.slice(); continue; }
    if (!h.on) { h.on = true; }
    h.t += 1 / 30;
    l.v = Math.max(0, Math.min(l.v, v0 - C.DEC / 30));
    pol.w = vcl === Infinity ? (atTop.low ? [5, 95, 0] : [5, 0, 95]) : [5, 30, 65];
    if (vcl <= T && l.v < 0.5) { h.go = true; h.on = false; }
  }
  const res = G.result || {type: 'none'}, extEv = G.ev.filter(e => e.type === 'fall' && e.ext);
  const P = G.ev.filter(e => e.id === 0), pf = P.filter(e => e.type === 'fall').length, pext = P.filter(e => e.type === 'fall' && e.ext).length;
  let outcome;
  if (res.type === 'win' && res.winner === l) outcome = 'win'; else if (l.dissolved) outcome = 'dissolved';
  else if (pext) outcome = 'extinct'; else if (pf) outcome = 'lost'; else if (res.type === 'all') outcome = 'extinct'; else outcome = 'lost';
  const sr = tr.map(t => t.keys.size);
  const row = {seed: cfg.seed, nz: cfg.nz || 0, p: player, out: outcome, win: outcome === 'win' ? 1 : 0, dis: l.dissolved ? 1 : 0,
    scr: P.filter(e => e.type === 'scrape' || e.type === 'drop').length, fall: pf, allFalls: G.ev.filter(e => e.type === 'fall').length, ext: extEv.length ? 1 : 0,
    str: l.strikes, sr0: sr[0], srBotMax: Math.max(0, ...sr.slice(1)), rivDis: G.labs.slice(1).filter(m => m.dissolved).length,
    enc: enc.n, forced: enc.forced, enc0: enc.n0, forced0: enc.forced0, nGaps: G.gaps.length, t: Math.round(G.t * 10) / 10};
  resetAll();
  return row;
}

function addDays(ds, n) { return new Date(Date.parse(ds + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
if (process.argv[1] && process.argv[1].endsWith('race.mjs')) {
  const mode = A.mode, start = +A.start, count = +A.count, steps = +(A.steps ?? 1), plus = +(A.plus ?? 0);
  const players = (A.players || [...Object.keys(PROBES), 'crawl', 'smart'].join(',')).split(',');
  const swap = A.swap ? JSON.parse((await import('node:fs')).readFileSync(A.swap, 'utf8')) : null;
  const rows = [], t0 = Date.now();
  const emit = (cfg, extra) => { for (const p of players) rows.push(Object.assign(race(cfg, p), extra)); };
  if (mode === 'free') {
    const chill = +(A.chill ?? 1);
    for (let s = start; s < start + count; s++) emit({seed: s, steps, roster: null, chill, strikesYou: plus ? K.strikes + plus : null}, {});
  } else if (mode === 'campaign') {
    const maps = A.maps ? A.maps.split(',').map(x => +x - 1) : GAME.CAMPAIGN.map((_, i) => i);
    for (const i of maps) for (let t = 0; t < 3; t++) for (let z = start; z < start + count; z++) {
      const c = campaignConfig(i, t, {diff: 'medium', chill: +(A.chill ?? 0), steps});
      if (plus) c.strikesYou += plus;
      emit(Object.assign(c, {nz: z, jitter: z}), {map: i + 1, tier: t + 1});
    }
  } else if (mode === 'daily') {
    const d0 = GAME.BRIEFINGS[0].added;
    for (let k = 0; k < count; k++) {
      const ds = addDays(d0, start + k);
      for (let t = 0; t < 3; t++) {
        const c = dailyConfig(ds, t, {chill: +(A.chill ?? 0), steps});
        if (swap && swap[ds] !== undefined) c.seed = swap[ds];
        if (plus) c.strikesYou = (c.knobs.strikes ?? K.strikes) + plus;
        emit(c, {date: ds, tier: t + 1, twist: c.twist});
      }
    }
  } else throw new Error('mode');
  writeFileSync(A.out, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  console.log(A.out, rows.length, 'races', ((Date.now() - t0) / rows.length).toFixed(1), 'ms/race');
}
