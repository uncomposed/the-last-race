// Design a segment where looking is the way to win (2026-11-02, second version, with the four terms in terms.mjs). No races are run:
// every time below is a closed form, from rest, for one lab on its own; the rivals' timing and who can see what are constraints on top.
// The segment: one box, a narrow and a wide variant (half the seeds each), one rival ahead of you that floors it while cruising.
//   rival  sees whether the box is wide before you catch it; narrow: keeps flooring it; wide: stops, buys the speed it needs, backs up, goes
//   you    look: floor it, but slow so you can still stop once you learn the width; narrow: keep going; wide: stop, buy what it needs, go
//          rush: floor it, never look. blind: buy what the wide box needs without looking (the cheapest mix of height and speed, bought from
//          the start, when speed pays back best). fill: fill height and speed (max-out)
// Looking is the way to win when it beats the rival in both variants and blind, fill and rush each lose a variant.
//   node design.mjs            the chosen design;   node design.mjs --search   solve for designs
import {C, K, top} from './segmath.mjs';
import {landW, speedFor, backUp, floorRun, brake, runIn, knowAt, eyeOf, shadowEnd} from './terms.mjs';
const free = T => K.invest * T / (2 * C.ACC);   // points a lab buys for nothing while it speeds up from rest without flooring it
const atTop = (L, T) => L / T + T / (2 * C.ACC); // floored (or buying only the free points) from rest over L

// what a lab standing `d0` before the face buys to land width W, as the bots do it: height first (no run-up needed), then speed; then it backs
// up for the run-up the face speed needs. Points, the face speed, and the time from standing
function buy(W, R, H, S, cap, mode, d0) {
  for (let h = H; h <= cap; h += 0.5) {
    const v = speedFor(W, h, R, top(S), mode); if (v === Infinity) continue;
    const P = h - H, r = runIn(d0, v); return {P, v, t: P / K.invest + r.t, h, s: S};
  }
  for (let s = S; s <= cap; s += 0.5) {
    const v = speedFor(W, cap, R, top(s), mode); if (v === Infinity) continue;
    const P = cap - H + s - S, r = runIn(d0, v); return {P, v, t: P / K.invest + r.t, h: cap, s};
  }
  return null;
}

export function evaluate(d) {
  const {L, R, Wn, Ww, after, cap = 70, mode = 'auto'} = d, [ys, yh, yS] = d.you, [rs, rh, rS] = d.rival.pts, x0 = d.rival.x;
  const T = top(yS), Tr = top(rS), end = L + Ww + after, endN = L + Wn + after, o = {ok: false, why: []};
  // who knows when. With two variants, seeing more than the narrow width without the far edge means wide, so both learn at knowAt(.., Wn)
  const ky = knowAt(ys, yh, R, Wn), kr = knowAt(rs, rh, R, Wn);
  const xr = t => x0 + (t <= Tr / C.ACC ? C.ACC * t * t / 2 : Tr * t - Tr * Tr / (2 * C.ACC)), xy = t => t <= T / C.ACC ? C.ACC * t * t / 2 : T * t - T * T / (2 * C.ACC);
  let tc = Infinity; for (let t = 0; t < 30; t += 0.01) if (xy(t) >= xr(t)) { tc = t; break; }
  const xc = xy(tc), trk = (() => { for (let t = 0; t < 30; t += 0.01) if (xr(t) >= L - kr) return t; return Infinity; })();
  o.know = {you: Math.round(ky), rival: Math.round(kr), catchAt: Math.round(xc)};
  if (!(T > Tr)) o.why.push('you are not faster than the rival');
  if (!(trk < tc)) o.why.push('you catch the rival before it sees the width (your shadow then hides the box from it)');
  // you must be past the rival before you need to see, or see over it
  if (xc > L - ky) { const e = eyeOf(yh), db = xr(0) - 0; if (shadowEnd(e, rh + 18, 50) < ky + Wn + 50) {} else o.why.push('the rival hides the box from you when you need to see it'); }
  if (kr < Tr * Tr / (2 * C.DEC) + 10) o.why.push('the rival learns the width too late to stop');
  // the rival
  const rN = (endN - x0) / Tr + Tr / (2 * C.ACC);
  const rb = buy(Ww, R, rh, rS, cap, mode, 10), rBrake = brake(Tr, 0, Tr);
  const rW = rb ? (L - 10 - rBrake.d - x0) / Tr + Tr / (2 * C.ACC) + rBrake.t + Math.max(0, rb.P - rBrake.P) / K.invest + runIn(10, rb.v).t + floorRun(Ww + after, rb.v, top(rb.s)).t : Infinity;
  if (rW === Infinity) o.why.push('the rival cannot cross the wide box');
  // you: look. Slow to the speed you can stop from once you learn the width (10 short of the face; backing up gives the run-up)
  const uk = Math.min(T, Math.sqrt(2 * C.DEC * Math.max(ky - 10, 0)));
  if (uk < 10) o.why.push('you see the width too late');
  const bk = brake(T, uk, T), lead = L - ky - bk.d;  // brake from top speed to uk, reaching uk as you learn the width
  const tToKnow = atTop(lead, T) + bk.t;
  const lookN = tToKnow + floorRun(ky + Wn + after, uk, T).t;
  const yb = buy(Ww, R, yh, yS, cap, mode, 10), b2 = brake(uk, 0, T);
  const lookW = yb ? tToKnow + b2.t + Math.max(0, yb.P - bk.P - b2.P) / K.invest + runIn(10, yb.v).t + floorRun(Ww + after, yb.v, top(yb.s)).t : Infinity;
  // blind: the cheapest mix that lands the wide box at full speed, bought from the start (speed bought first pays back over the whole road)
  let blindN = Infinity;
  for (let h = yh; h <= cap; h++) for (let s = yS; s <= cap; s++) if (landW(top(s), h, R, mode) >= Ww) { const P = h - yh + s - yS, Tb = top(s); blindN = Math.min(blindN, endN / Tb + Math.max(P, free(Tb)) / K.invest); break; }
  const fillN = endN / top(cap) + Math.max(2 * cap - yh - yS, free(top(cap))) / K.invest;
  // rush: free points go to height while speeding up; does it land the wide box?
  const rushLandsW = landW(T, Math.min(cap, yh + free(T)), R, mode) >= Ww, rushLandsN = landW(T, yh, R, mode) >= Wn;
  if (!rushLandsN) o.why.push('the narrow box is not free');
  Object.assign(o, {rN, rW, lookN, lookW, blindN, fillN, rushN: atTop(endN, T), rushLandsW, uk: Math.round(uk), youNeed: yb && yb.P, rivalNeed: rb && rb.P});
  if (!(lookN < rN)) o.why.push('looking loses the narrow box to the rival');
  if (!(lookW < rW)) o.why.push('looking loses the wide box to the rival');
  if (!(blindN > rN)) o.why.push('blind prep for the wide box beats the rival on the narrow one');
  if (!(fillN > rN)) o.why.push('filling everything beats the rival on the narrow box');
  if (rushLandsW) o.why.push('rushing lands the wide box');
  o.margin = Math.min(rN - lookN, rW - lookW, blindN - rN, fillN - rN);
  o.ok = !o.why.length;
  return o;
}

export const DESIGN = {key: 'look-pays', title: 'Measure Twice', L: 600, R: 10, Wn: 55, Ww: 95, after: 80, mode: 'auto',
  you: [45, 20, 60], rival: {x: 50, pts: [70, 50, 30]}};

function search() {
  const out = [];
  for (const L of [600, 800, 1000]) for (const R of [10, 20, 30]) for (const Ww of [90, 95, 100]) for (const after of [40, 80])
  for (const ys of [30, 45, 60]) for (const yh of [20, 35, 50]) for (const yS of [50, 60, 70])
  for (const x of [50, 150, 250, 350]) for (const rs of [50, 70]) for (const rh of [50, 70]) for (const rS of [0, 15, 30]) {
    const d = {L, R, Wn: 55, Ww, after, mode: 'auto', you: [ys, yh, yS], rival: {x, pts: [rs, rh, rS]}}, o = evaluate(d);
    if (o.ok) out.push({...d, you: d.you.join('/'), rival: `${x} ${d.rival.pts.join('/')}`, margin: +o.margin.toFixed(2), lookN: +o.lookN.toFixed(1), rN: +o.rN.toFixed(1), lookW: +o.lookW.toFixed(1), rW: +o.rW.toFixed(1), blindN: +o.blindN.toFixed(1), need: o.youNeed});
  }
  console.log(out.length + ' designs pass'); console.table(out.sort((a, b) => b.margin - a.margin).slice(0, 15));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--search')) search();
  else { const o = evaluate(DESIGN), f = x => x === Infinity ? 'never' : x.toFixed(1) + ' s'; console.log(JSON.stringify(o.know), 'you slow to', o.uk);
    console.log(`narrow: rival ${f(o.rN)}, look ${f(o.lookN)}, rush ${f(o.rushN)}, blind ${f(o.blindN)}, fill ${f(o.fillN)}`);
    console.log(`wide: rival ${f(o.rW)} (needs ${o.rivalNeed}), look ${f(o.lookW)} (needs ${o.youNeed}), rush ${o.rushLandsW ? 'lands' : 'falls'}`);
    console.log(o.ok ? `Looking is the way to win, by ${o.margin.toFixed(1)} s at the closest.` : 'Not yet: ' + o.why.join('; ')); }
}
