// The four terms segmath.mjs left out (2026-11-02, after Measure Twice failed the judge). Each is a closed form taken from the sim's own
// code (check/lessons/<lesson>/page.html), and `node terms.mjs` checks each against that code run step by step.
//   1. jump mode   auto-jump fires 0.3 s before the face; by hand (a well-timed press) the arc is a quarter done there
//   2. backing up  a lab may always back up for a run-up (a stopped lab's guard does not stop it), at 40, reaching that speed at the braking rate
//   3. the ledger  a lab's time over a stretch is the distance at its top speed plus the points it bought over the build rate, plus what
//                  flooring it (which buys nothing) costs. Buying speed raises top speed, so speed bought early pays itself back
//   4. shadows     a lab ahead hides the road from a lab behind that is no taller; a taller one sees past it only from far enough out
import {C, K, top, jumpDur, carry} from './segmath.mjs';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const SINK = 2.2 * C.JUMP * Math.PI, REV = 40, RW = 18, SEEANG = 0.15;
const arcY = u => C.JUMP * clamp(2.2 * Math.sin(Math.PI * u), 0, 1);

// 1. how far into its arc a lab is at the face: auto-jump (the page's chill mode) or by hand
export const u0 = (v, mode) => mode === 'auto' ? Math.min(1, Math.max(0.3, 6 / Math.max(v, 1)) / jumpDur(v)) : C.BOXU;
export function cleanW(v, H, R, mode = 'hand') {
  const u = u0(v, mode), a0 = H + arcY(u);
  if (a0 < R) return 0;
  const m = R - H, uEnd = m <= 0 ? 1 : 1 - Math.asin(m / (2.2 * C.JUMP)) / Math.PI;  // where the arc comes back down to the rise
  return m <= 0 ? carry(v) * (1 - u - m / SINK) : carry(v) * Math.max(0, uEnd - u);
}
export function landW(v, H, R, mode = 'hand') {
  const u = u0(v, mode), a0 = H + arcY(u);
  if (a0 < R) return carry(v) * a0 / SINK;  // in through the side, sinking from where it is
  return carry(v) * (1 - u + H / SINK);
}
// the speed at the face that lands (or clears) width W at height H; Infinity if even top speed `T` will not
export function speedFor(W, H, R, T, mode, kind = 'land') {
  const f = kind === 'land' ? landW : cleanW;
  if (f(T, H, R, mode) < W) return Infinity;
  let lo = 1, hi = T; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m, H, R, mode) >= W) hi = m; else lo = m; }
  return hi;  // land width rises with speed over the range that matters (checked in verify)
}

// 2. time to back up from standing to standing `x` further back (reverse speeds up at the braking rate, stops at the acceleration rate)
export function backUp(x) {
  if (x <= 0) return 0;
  const da = REV * REV / (2 * C.DEC), db = REV * REV / (2 * C.ACC);
  if (x <= da + db) { const v = Math.sqrt(x / (1 / (2 * C.DEC) + 1 / (2 * C.ACC))); return v / C.DEC + v / C.ACC; }
  return REV / C.DEC + REV / C.ACC + (x - da - db) / REV;
}
// floor it from speed u over L to top T (no investing): time, and speed at the end
export function floorRun(L, u, T) {
  const dt = (T * T - u * u) / (2 * C.ACC);
  if (L <= dt) { const v = Math.sqrt(u * u + 2 * C.ACC * L); return {t: (v - u) / C.ACC, v}; }
  return {t: (T - u) / C.ACC + (L - dt) / T, v: T};
}
// brake from u to w over the distance it takes; time, distance, and points bought on the way (14 x M x the integral of 1 - v/T)
export function brake(u, w, T, M = 1) { const t = (u - w) / C.DEC, d = (u * u - w * w) / (2 * C.DEC); return {t, d, P: K.invest * M * (t - d / T)}; }
// stand at d0 before the face, back up for a run-up that reaches speed vNeed at the face (the bots plan at 90% of acceleration),
// then run in: total time from standing until the face, and the run-up length
export function runIn(d0, vNeed) {
  const s = Math.max(d0, vNeed * vNeed / (2 * 0.9 * C.ACC) + 15);
  return {t: backUp(s - d0) + floorRun(s, 0, vNeed / 0.999).t, s};
}

// 3. the ledger. Speed bought before a stretch D saves D x (1/top before - 1/top after); a speed point costs 1/(14 M) s. It pays back when
// D > top^2 / (0.85 x 14 x M): the road left is longer than that
export const paybackRoad = (T, M = 1) => T * T / (0.85 * K.invest * M);

// 4. shadows (the sim's shadows()): a lab behind, with eye height `eye`, a lab `db` ahead whose top is `topA`: the road from db out to the
// returned distance is hidden (Infinity: everything past db)
export const shadowEnd = (eye, topA, db) => eye > topA ? db * eye / (eye - topA) : Infinity;
export const eyeOf = H => H + RW;
// how far before the face a lab first sees past width w (with two variants, seeing past the narrow width without the far edge means wide)
export const knowAt = (sight, H, R, w) => { const e = eyeOf(H); return e <= R ? -Infinity : Math.min((e - R) / SEEANG, C.SIGHT0 + 4.4 * sight) - w; };

// ---- checks against the sim's code ----
function verify() {
  const flightAltJ = (v, h, w, u, jd) => { const t = w / v, Ta = (1 - u) * jd; return t <= Ta ? h + arcY(u + t / jd) : h - SINK / jd * (t - Ta); };
  const simW = (v, H, R, mode, kind) => {  // the sim's box rule (boxOutcome), bisected for the widest width
    const jd = jumpDur(v), u = u0(v, mode), a0 = H + arcY(u);
    const ok = w => { const alt = a0 >= R ? flightAltJ(v, H, w, u, jd) : a0 - SINK / jd * w / v; return kind === 'land' ? alt > 0 : alt >= R; };
    if (!ok(0)) return 0; let lo = 0, hi = 1000; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } return lo;
  };
  let worst = 0;
  for (const mode of ['hand', 'auto']) for (const v of [40, 60, 80, 100, 110, 140]) for (const H of [0, 20, 40, 70]) for (const R of [10, 20, 30, 50]) {
    worst = Math.max(worst, Math.abs(simW(v, H, R, mode, 'land') - landW(v, H, R, mode)), Math.abs(simW(v, H, R, mode, 'clean') - cleanW(v, H, R, mode)));
  }
  console.log(`1. box widths, both jump modes, 192 cases: worst error ${worst.toFixed(4)}`);
  for (const v of [60, 110]) console.log(`   at speed ${v}, height 70, rise 20: lands ${landW(v, 70, 20).toFixed(1)} by hand, ${landW(v, 70, 20, 'auto').toFixed(1)} on auto-jump`);
  // 2. backing up, stepped as stepLab does (target -REV; v above target slows at DEC, below speeds up at ACC)
  let e2 = 0;
  for (const x of [20, 60, 100, 200]) {
    let v = 0, p = 0, t = 0, dt = 1 / 600, stop = false;
    while (true) { const tgt = !stop && p > -x + v * v / (2 * C.ACC) ? -REV : 0; if (tgt === 0) stop = true; v = v < tgt ? Math.min(tgt, v + C.ACC * dt) : Math.max(tgt, v - C.DEC * dt); p += v * dt; t += dt; if (stop && v >= 0) break; }
    e2 = Math.max(e2, Math.abs(t - backUp(x)));
  }
  console.log(`2. backing up 20 to 200: worst error ${e2.toFixed(3)} s`);
  // 3. the ledger: a lab stepped at pace 0.7 investing in speed only, from rest, over 900: time vs distance at top + points / 14
  let x = 0, v = 0, S = 30, t = 0, P = 0, Pw = 0, ix = 0; const dt = 1 / 600;
  while (x < 900) { const T = top(S), r = clamp(1 - v / T, 0, 1); v = Math.min(0.7 * T, v + C.ACC * dt); const dP = r * K.invest * dt; if (S < 70) { S = Math.min(70, S + dP); P += dP; } else Pw += dP; ix += v * dt / T; x += v * dt; t += dt; }
  console.log(`3. ledger, pace 0.7 buying speed from rest over 900: stepped ${t.toFixed(3)} s; distance at top ${ix.toFixed(3)} + (${P.toFixed(1)} points bought + ${Pw.toFixed(1)} wasted at the ceiling) / 14 = ${(ix + (P + Pw) / 14).toFixed(3)} s`);
  console.log(`   speed pays back over more road than: ${[75.5, 92.5, 109.5].map(T => `${Math.round(paybackRoad(T))} at top ${T}`).join(', ')}`);
  console.log('4. shadows: same formula as the sim (shadows()); checked in the judge runs, not here');
}
if (import.meta.url === `file://${process.argv[1]}`) verify();
