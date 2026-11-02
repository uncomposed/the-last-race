// Segment math (2026-11-02): closed-form budget and box equations from the sim in check/hidden-width/page-hidden.html (same K and C as
// the lesson pages). No races are run. For each segment: how many points you can invest and still reach the box when the first rival
// gets across (the budget), how many points each width variant needs, how many filling height and speed needs, and so the regime.
// See SEGMENT-MATH.md.
//   node segmath.mjs              the ten round 2 lesson maps, as a table
//   node segmath.mjs --verify     check the closed forms against the sim's own flight function
import {MAPS} from './maps.mjs';

export const C = {JUMP: 34, ACC: 40, DEC: 15.6, TOP0: 50, SIGHT0: 80, BOXU: 0.25, CAPS: [70, 90, 115, 145, 180, 220, 260, 300]};
export const K = {invest: 14, refill: 50, stepL0: 25};

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const top = S => C.TOP0 + 0.85 * S;
export const jumpDur = v => clamp(0.56 + 38 / Math.max(v, 20), 0.5, 1.6);
const SINK = 2.2 * C.JUMP * Math.PI;  // sink rate is SINK / jumpDur
// how far a jump at speed v carries over a box (v x jump time), 0.56 v + 38 in the usual speed range
export const carry = v => v * jumpDur(v);

// widest box of rise R a lab of height H jumps clean at speed v (jump pressed with the arc a quarter done at the face, by hand)
export function cleanW(v, H, R) {
  const m = R - H;
  if (m > C.JUMP) return 0;  // below the rise even at the top of the jump: in through the side
  const f = m <= 0 ? 1 - C.BOXU - m / SINK : 1 - C.BOXU - Math.asin(m / (2.2 * C.JUMP)) / Math.PI;
  return carry(v) * f;
}
// widest box it lands on at all (a scrape, not a fall)
export function landW(v, H, R) {
  if (H + C.JUMP < R) return carry(v) * (H + C.JUMP) / SINK;
  return carry(v) * (1 - C.BOXU + H / SINK);
}
// the full lab's clean reach at a ceiling: what segBox's f multiplies
export const reach = (cap, R) => cleanW(top(cap), cap, R);

// fewest points (height + speed) that clear width W, from (H0, S0), at full run-up speed; kind 'clean' or 'land'
export function need(W, R, H0, S0, cap, kind = 'clean') {
  const fn = kind === 'clean' ? cleanW : landW;
  let best = Infinity;
  for (let H = H0; H <= cap + 1e-9; H += 0.25) {
    if (fn(top(cap), H, R) < W) continue;
    let lo = S0, hi = cap;
    if (fn(top(lo), H, R) >= W) { best = Math.min(best, H - H0); break; }
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fn(top(m), H, R) >= W) hi = m; else lo = m; }
    best = Math.min(best, H - H0 + hi - S0);
  }
  return best;
}

// time to cover L from a standing start, cruising at speed u, ending at speed u (end: 'cruise') or at rest (end: 'stop')
function travel(L, u, end) {
  const da = u * u / (2 * C.ACC), dd = end === 'stop' ? u * u / (2 * C.DEC) : 0;
  if (L <= da + dd) { const v = Math.sqrt(2 * L / (1 / C.ACC + (end === 'stop' ? 1 / C.DEC : 0))); return v / C.ACC + (end === 'stop' ? v / C.DEC : 0); }
  return u / C.ACC + (end === 'stop' ? u / C.DEC : 0) + (L - da - dd) / u;
}
// floor it from speed u over L: time and the speed at the end (no investing while floored)
function floor(L, u, T) {
  const dt = (T * T - u * u) / (2 * C.ACC);
  if (L <= dt) { const v = Math.sqrt(u * u + 2 * C.ACC * L); return {t: (v - u) / C.ACC, v}; }
  return {t: (T - u) / C.ACC + (L - dt) / T, v: T};
}
// the budget identity: a lab invests K.invest x M x (1 - v/top) per second, so over any trip of L in time t it invests
// K.invest x M x (t - L/top), whatever its speed did on the way (floored stretches excepted: they invest nothing)
export const budget = (t, L, S, M = 1) => K.invest * M * (t - L / top(S));
const bonus = gap => Math.min(3, 1 + Math.max(gap, 0) / 5 / K.refill);  // refill: labs behind the leader build faster

// one rival at one box: when it reaches the face, its state, and whether it gets across. post:
//   go    cruise; floor it once the box face is in sight; jump at whatever speed and state it has
//   dash  cruise; floor it from 250 out
//   stop  cruise; stand `s` short (or at a line), learn the width, build what a clean cross needs (or as much as it can), run up, jump
function rival(r, box, W, cap) {
  const L = box.x - r.x, T = top(r.pts[2]), u = r.pace * T, M = bonus(-r.x), wsum = r.w[0] + r.w[1] + r.w[2];
  const grow = (pts, P) => pts.map((p, i) => Math.min(cap, p + P * r.w[i] / wsum));
  if (r.post === 'go' || r.post === 'dash') {
    const fl = r.post === 'dash' ? 250 : Math.min(L, C.SIGHT0 + 4.4 * r.pts[0]);
    const t1 = travel(L - fl, u, 'cruise'), pts = grow(r.pts, budget(t1, L - fl, r.pts[2], M));
    const f = floor(fl, u, top(pts[2]));
    const v = f.v, H = pts[1];
    return {t: t1 + f.t, v, out: W <= cleanW(v, H, box.R) ? 'clean' : W <= landW(v, H, box.R) ? 'scrape' : 'fall', after: top(pts[2])};
  }
  const s = r.s ?? 180, t1 = travel(L - s, u, 'stop'), pts = grow(r.pts, budget(t1, L - s, r.pts[2], M));
  let P = need(W, box.R, pts[1], pts[2], cap), out = 'clean';
  if (P === Infinity) { P = need(W, box.R, pts[1], pts[2], cap, 'land'); out = P === Infinity ? 'fall' : 'scrape'; }
  if (P === Infinity) P = (cap - pts[1]) + (cap - pts[2]);
  const run = floor(s, 0, top(cap)).t;  // the run-up, taken as reaching the ceiling's top speed
  return {t: t1 + P / (K.invest * M) + run, out, built: P, after: top(Math.min(cap, pts[2] + P / 2))};
}

// one segment (a lab's start, one box, its width variants, the rivals, and `after`: how far past the box's far edge the segment ends,
// at the finish or the next obstacle). The race clock is the first rival that gets across and reaches the end: to beat it there you must cross the
// box by tAllow, which gives your budget. Need is the fewest points that keep you out of the box (a scrape at worst); needClean is the
// fewest that clear it clean. Regime: 1 your budget fills height and speed; 2 it covers the widest variant's need, so no looking is
// needed; 3 it covers this variant's need but not the widest's, so only a lab that knows the width is both safe and on time;
// 4 it does not cover this variant's need.
export function segment(m, bi = 0) {
  const box = m.boxes[bi], cap = box.cap ?? C.CAPS[0], [, H0, S0] = m.you.pts, L = box.x - (m.you.x ?? 0);
  const fill = (cap - H0) + (cap - S0);
  const rows = box.variants.map(vr => {
    const W = vr.W ?? Math.round(vr.f * reach(cap, box.R)), end = W + (box.after ?? m.after);
    const rivals = m.rivals.map(r => vr.rx && vr.rx[r.name] !== undefined ? {...r, x: vr.rx[r.name]} : r);
    const rv = rivals.map(r => { const o = rival(r, box, W, cap); return {name: r.name, ...o, tEnd: o.t + end / o.after}; });
    const first = rv.filter(x => x.out !== 'fall').sort((a, b) => a.tEnd - b.tEnd)[0];
    const nd = need(W, box.R, H0, S0, cap, 'land'), ndc = need(W, box.R, H0, S0, cap);
    const tAllow = first ? first.tEnd - end / top(Math.min(cap, S0 + nd / 2)) : Infinity;
    return {W, p: vr.p, rv, first: first ? first.name : null, tEnd: first ? first.tEnd : null, B: first ? budget(tAllow, L, S0) : Infinity, need: nd, needClean: ndc};
  });
  const worst = Math.max(...rows.map(x => x.need));
  for (const x of rows) x.regime = x.B >= fill ? 1 : x.B >= worst ? 2 : x.B >= x.need ? 3 : 4;
  return {key: m.key, title: m.title, cap, fill, worst, rows};
}

const pct = x => (x * 100).toFixed(0) + '%';
const num = x => x === Infinity ? 'none' : x === null ? '-' : Math.round(x);
function table() {
  const out = ['| Map | Variant (chance) | Width | First rival to the end (s) | Your budget | Need (clean) | Fill | Regime |', '|---|---|---|---|---|---|---|---|'];
  const sum = [];
  for (const m of MAPS) {
    const s = segment(m, m.box ?? 0);
    for (const r of s.rows) out.push(`| ${s.title} | ${r.p[1]} (${pct(r.p[0])}) | ${r.W} | ${r.first ?? 'nobody'}${r.tEnd ? ' ' + r.tEnd.toFixed(1) : ''} | ${num(r.B)} | ${num(r.need)} (${num(r.needClean)}) | ${s.fill} | ${r.regime} |`);
    const reg = {};
    for (const r of s.rows) reg[r.regime] = (reg[r.regime] || 0) + r.p[0];
    // seconds of slack the race leaves you (budget / build rate), against the window that would make looking pay: more slack than the
    // narrowest variant needs, less than the widest needs
    const slack = s.rows.map(r => r.B / K.invest), lo = Math.min(...s.rows.map(r => r.need)) / K.invest, hi = s.worst / K.invest;
    const sl = slack.every(x => x === Infinity) ? 'unlimited (no rival gets across)' : `${Math.min(...slack).toFixed(1)} to ${Math.max(...slack).toFixed(1)} s`;
    sum.push({key: m.key, title: m.title, regime: Object.entries(reg).map(([k, v]) => `${k} (${pct(v)})`).join(', '),
      window: `slack ${sl}; looking pays with ${lo.toFixed(1)} to ${hi.toFixed(1)} s`});
  }
  return {md: out.join('\n'), sum};
}

function verify() {
  // the sim's flight rule (page-hidden.html flightAlt), integrated by bisection, against the closed forms
  const arcY = u => C.JUMP * clamp(2.2 * Math.sin(Math.PI * u), 0, 1);
  const alt = (v, h, w) => { const jd = jumpDur(v), t = w / v, Ta = (1 - C.BOXU) * jd; return t <= Ta ? h + arcY(C.BOXU + t / jd) : h - SINK / jd * (t - Ta); };
  const side = (v, h, w) => h + C.JUMP - SINK / jumpDur(v) * w / v;  // in through the side: sinks from the jump's top
  const widest = (v, h, R, ok) => { let lo = 0, hi = 3000; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (ok(v, h, m, R)) lo = m; else hi = m; } return lo; };
  let worst = 0;
  for (const S of [0, 20, 40, 70, 90, 145]) for (const H of [0, 10, 30, 50, 70, 90]) for (const R of [20, 40, 56, 70, 90]) {
    const v = top(S), above = H + C.JUMP >= R;
    const c = cleanW(v, H, R), cs = above ? widest(v, H, R, (v, h, w, R) => alt(v, h, w) >= R) : 0;
    const l = landW(v, H, R), ls = widest(v, H, R, (v, h, w) => (above ? alt(v, h, w) : side(v, h, w)) > 0);
    worst = Math.max(worst, Math.abs(c - cs), Math.abs(l - ls));
  }
  console.log(`closed forms vs the sim's flight rule over 180 cases: largest difference ${worst.toFixed(3)} track units`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--verify')) verify();
  else { const t = table(); console.log(t.md); console.log(); for (const s of t.sum) console.log(`${s.key}: regime ${s.regime}; ${s.window}`); }
}
