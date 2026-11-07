// [[ai gen]] The scripted key player (keydriver.js) without a browser: same decision timing, same lag, same keys, applied to the page's controls the way
// the page's key handlers do (Arrow Up/Down move pace 5 at a time, Right/Left held set floor/back, 1-7 set a split preset, Space jumps), then syncInput, then a step.
// It loads the simulation section of the built page, so it races exactly what ships. Not a person, and not evidence of fun.
// Differences from the browser run: each race starts the pace bar at 70 (the browser keeps the last race's), and the frame loop's out-watch is not run.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));

// extra: research code (strategies) run inside the simulation just before window.PF, for the checks only; the stamp stays the shipped section's
export function load(page = join(HERE, '..', '..', 'game', 'game.html'), extra = '') {
  const L = readFileSync(page, 'utf8').split('\n');
  const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
  if (a < 0 || b < a) throw new Error('simulation section not found');
  const SIM = L.slice(a, b + 1).join('\n'), RUN = extra ? L.slice(a, b).join('\n') + '\n' + extra + '\n' + L[b] : SIM;
  const PF = new Function('window', 'document', RUN + '\nwindow.PF.top=topSpeed;return window.PF;')({}, null);
  return {PF, KSNAP: {...PF.K, stepGaps: 1, chill: 1}, id: createHash('sha256').update(SIM).digest('hex').slice(0, 16)};
}

const PRE = {Digit1: [100, 0, 0], Digit2: [0, 100, 0], Digit3: [0, 0, 100], Digit4: [33, 33, 33], Digit5: [50, 50, 0], Digit6: [0, 50, 50], Digit7: [50, 0, 50]};
const TSET = {Digit1: [100, 0, 0], Digit2: [0, 100, 0], Digit3: [0, 0, 100], Digit4: [100 / 3, 100 / 3, 100 / 3], Digit5: [50, 50, 0], Digit6: [0, 50, 50], Digit7: [50, 0, 50]};
function near(w) { let b = null, bs = -1; const n = Math.hypot(w[0], w[1], w[2]) || 1; for (const c in PRE) { const p = PRE[c], s = (p[0] * w[0] + p[1] * w[1] + p[2] * w[2]) / (n * Math.hypot(p[0], p[1], p[2])); if (s > bs) { bs = s; b = c; } } return b; }
function rng(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// the browser driver's per-map knobs (keydriver.js CFG): [strategy, ant, mg, commit, ease, kick]
export const CFG = {'elbows': ['sp-s-bold', 1, 1.35, 0], 'ladder': ['sp-hs-bold', 1, 1.35, 0], 'two-endings': ['finLead', 1.5, 1, 1]};  // Two Endings had no entry: these won most on the tune block 1001-1040, of ant 0/1/1.5 x mg 1/1.2/1.35 x commit 0/1
export function knobs(key, post) { const c = CFG[key]; return {post: post || c[0], ant: c[1], mg: c[2], commit: c[3], ease: c[4] || null, kick: c[5] || 0, brake: 8, ready: 1}; }

// one race. P replaces the map's numbers for this race only. HD: knobs(). Returns how it ended for the player.
export function run(api, key, P, HD, seed, lagSeed) {
  const {PF, KSNAP} = api, K = PF.K;
  for (const k in KSNAP) K[k] = KSNAP[k]; K.chill = 1;
  const m = PF.SEGS.find(s => s.key === key), keepP = m.P;
  if (P) m.P = P;
  try {
    PF.segUse(PF.SEGS.indexOf(m) + 1); PF.newGame(seed);
    const G = PF.G(), me = G.labs[0], I = G.input, r = rng(lagSeed === undefined ? seed * 7 + 1 : lagSeed), post = HD.post;
    const ui = {pace: 70, w: [25, 50, 25], auto: true, rev: false, fwd: false}, held = {};
    let nextD = 0.3, Q = [], cur = null, nextP = 0, split = null, g = 0, presses = 0;
    const press = c => { presses++; if (c === 'Space') I.jump = true; else if (c === 'ArrowUp') ui.pace = Math.min(100, ui.pace + 5); else if (c === 'ArrowDown') ui.pace = Math.max(0, ui.pace - 5); else if (TSET[c]) ui.w = TSET[c].slice(); };
    const hold = (c, on) => { if (!!held[c] !== on) { held[c] = on; presses++; if (c === 'ArrowRight') ui.fwd = on; if (c === 'ArrowLeft') ui.rev = on; } };
    const ctrl = () => { const o = me.post; me.post = post; const c = globalThis.CTRL(me, 1); me.post = o; return c; };
    if (HD.ready) {  // a person sets the bar and the split on the ready card, before Go: the arrow and number keys work there
      const c0 = ctrl(); if (c0) { ui.pace = c0.fwd ? 100 : Math.round(c0.pace * 20) * 5; if (c0.w) { split = near(c0.w); ui.w = TSET[split].slice(); } }
    }
    while (!G.over && g++ < 40000) {
      if (G.t >= nextD) {
        const ox = me.x, gg = G.gaps[me.gi], ow = gg && gg.W; if (gg && HD.mg) gg.W = ow * HD.mg;
        let c = ctrl();
        const sst = () => me.sst && me.sst.s && me.sst.s[me.gi], st0 = sst();
        const ahead = () => Math.min(me.x + me.v * HD.ant, Math.max(me.x, Math.min(G.barriers[me.bi] ? G.barriers[me.bi].x - 2 : 1e9, gg ? gg.x - 2 : 1e9)));
        if (HD.commit && !(st0 && st0.go) && HD.ant) { me.x = ahead(); c = ctrl(); me.x = ox; const st1 = sst(); if (st1 && st1.go) { st1.go = false; c = {pace: 0, w: c.w}; } }
        else if (!HD.commit && HD.ant) { me.x = ahead(); c = ctrl(); me.x = ox; }
        me.x = ox; if (gg && HD.mg) gg.W = ow;
        if (c && HD.ease && me.x > HD.ease[0] && gg && !(me.seenG && me.seenG[me.gi]) && (c.pace > HD.ease[1] || c.fwd)) c = {pace: HD.ease[1], w: c.w};
        if (c && HD.kick && !c.rev && G.barriers.length && me.x > G.barriers[G.barriers.length - 1].x && G.gaps.every(q => q.x < me.x)) c = {pace: 1, w: c.w, fwd: true};
        if (c) Q.push({t: G.t + (HD.lag !== undefined ? HD.lag : 0.25 + r() * 0.15), c: {pace: c.pace, w: c.w, fwd: !!c.fwd, rev: !!c.rev, jump: !!c.jump}});
        nextD = G.t + (HD.samp !== undefined ? HD.samp : 0.25 + r() * 0.15);
      }
      while (Q.length && Q[0].t <= G.t) { cur = Q.shift().c; if (cur.jump) press('Space'); }
      if (cur) {
        const fl = cur.fwd || cur.pace >= 0.95; hold('ArrowRight', fl);
        const br = HD.brake && !cur.rev && !fl && me.v > 3 && cur.pace * Math.max(PF.top(me), 1) < me.v - HD.brake; hold('ArrowLeft', cur.rev || br);
        if (cur.w) { const d = near(cur.w); if (d !== split) { split = d; press(d); } }
        if (G.t >= nextP && !fl && !cur.rev) { const tgt = Math.round(cur.pace * 20) * 5; if (tgt > ui.pace + 2) { press('ArrowUp'); nextP = G.t + 1 / 20; } else if (tgt < ui.pace - 2) { press('ArrowDown'); nextP = G.t + 1 / 20; } }
      }
      I.pace = ui.pace / 100; I.w = ui.w; I.auto = ui.auto; I.rev = ui.rev; I.fwd = ui.fwd;
      PF.step(1 / 60);
    }
    return {seed, type: G.over && G.result ? G.result.type : 'running', won: !!(G.over && G.result && G.result.type === 'win' && G.result.winner === me), t: +G.t.toFixed(1), fell: me.fellAt !== undefined, dis: !!me.dissolved, presses};
  } finally { m.P = keepP; }
}
export function batch(api, key, P, HD, a, n) { const o = []; for (let i = 0; i < n; i++) o.push(run(api, key, P, HD, a + i)); return {won: o.filter(x => x.won).length, n, fell: o.filter(x => x.fell).length, world: o.filter(x => x.type === 'all').length, runs: o}; }

if (process.argv[1] === fileURLToPath(import.meta.url)) {  // node hdnode.mjs elbows 9301 40 [strategy]
  const [key, a = '9301', n = '40', post] = process.argv.slice(2), api = load(), t0 = Date.now();
  const b = batch(api, key, null, knobs(key, post), +a, +n);
  console.log(key, post || CFG[key][0], 'won', b.won, 'of', n, 'fell', b.fell, 'world ends', b.world, ((Date.now() - t0) / n | 0) + ' ms a race');
  console.log(b.runs.map(r => (r.won ? 'W' : r.type === 'all' ? 'E' : r.fell ? 'f' : '.')).join(''));
}
