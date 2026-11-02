// Design a segment where looking is the way to win (2026-11-02), from the equations in segmath.mjs. No races are run.
// For a candidate (where you start, one box with a narrow and a wide variant, one rival who plans when it can see), it times three
// strategies of yours to the end of the segment in each variant, and the rival:
//   look   cruise no faster than you can stop once the wide box's far edge shows; narrow: floor it; wide: stop, build what it needs, go
//   brace  never look: always stop and build what the wide box needs, then go
// and the budget test from segmath.mjs for the cheapest blind prep, building while running: it loses a variant whose budget is short of the
// widest variant's need (and max-out, which fills everything, loses any variant whose budget is short of the fill)
//   rush   never look, never build: floor it
// Looking is the way to win when look beats the rival in both variants, and brace and rush each lose one.
//   node design.mjs
import {C, K, top, need, knowAt, brakeDist, reach, segment, landW} from './segmath.mjs';

function travel(L, u, end) {  // as in segmath.mjs
  const da = u * u / (2 * C.ACC), dd = end === 'stop' ? u * u / (2 * C.DEC) : 0;
  if (L <= da + dd) { const v = Math.sqrt(2 * L / (1 / C.ACC + (end === 'stop' ? 1 / C.DEC : 0))); return v / C.ACC + (end === 'stop' ? v / C.DEC : 0); }
  return u / C.ACC + (end === 'stop' ? u / C.DEC : 0) + (L - da - dd) / u;
}
function floorT(L, u, T) { const dt = (T * T - u * u) / (2 * C.ACC); if (L <= dt) { const v = Math.sqrt(u * u + 2 * C.ACC * L); return (v - u) / C.ACC; } return (T - u) / C.ACC + (L - dt) / T; }

// the fewest points that land you across width W when you start from a standstill s before the face: height first is free of run-up,
// speed only helps as far as the run-up lets you reach it (the sim's acceleration is 40, the bots plan at 90% of it)
export function standNeed(W, R, H0, S0, cap, s) {
  let best = Infinity;
  for (let H = H0; H <= cap; H += 0.5) for (let S = S0; S <= cap; S += 0.5) {
    const v = Math.min(top(S), Math.sqrt(2 * 0.9 * C.ACC * Math.max(s - 8, 0)));
    if (landW(v, H, R) >= W * 1.02) { best = Math.min(best, H - H0 + S - S0); break; }
  }
  return best;
}
// your time to the end of the segment for each strategy (see the top of this file)
export function you(m, W, Ww, how) {
  const box = m.boxes[0], cap = box.cap ?? C.CAPS[0], [, H0, S0] = m.you.pts, L = box.x, end = W + m.after, T0 = top(S0);
  const free = need(W, box.R, H0, S0, cap, 'land') === 0;
  // brake from u to stand s before the face, build what width w needs from there, run up, cross, run to the end
  const stopBuild = (u, w, s) => {
    const t1 = travel(L - s, u, 'stop'), P1 = K.invest * (t1 - (L - s) / T0);
    const P = standNeed(w, box.R, H0, S0, cap, s); if (P === Infinity) return Infinity;
    const S = Math.min(cap, S0 + P), vf = Math.min(top(S), Math.sqrt(2 * C.ACC * s));
    return t1 + Math.max(0, P - P1) / K.invest + vf / C.ACC + (end - Math.max(0, s - vf * vf / (2 * C.ACC))) / Math.max(vf, 1);
  };
  const best = f => Math.min(...[40, 60, 80, 100, 130, 160, 200].map(f));
  if (how === 'rush') return free ? floorT(L, 0, T0) + end / T0 : Infinity;
  if (how === 'brace') return best(s => stopBuild(T0, Ww, s));
  // look: cruise no faster than you can stop from, s before the face, once the wide box's far edge shows
  return best(s => {
    const u = Math.min(T0, Math.sqrt(2 * C.DEC * Math.max(knowAt(m.you.pts, box.R, Ww) - s, 0)));
    if (u < 5) return Infinity;
    if (free) { const kn = Math.max(knowAt(m.you.pts, box.R, W), 0); return travel(L - kn, u, 'cruise') + floorT(kn, u, T0) + end / T0; }
    return stopBuild(u, W, s);
  });
}

export function report(m) {
  const box = m.boxes[0], cap = box.cap ?? C.CAPS[0], [n, w] = box.variants.map(v => v.W ?? Math.round(v.f * reach(cap, box.R)));
  const seg = segment(m), rows = [];
  for (const [i, W] of [n, w].entries()) {
    const r = seg.rows[i], riv = r.rv[0];
    rows.push({variant: i ? 'wide' : 'narrow', W, rival: riv.tEnd, rivalOut: riv.out, look: you(m, W, w, 'look'), brace: you(m, W, w, 'brace'), rush: you(m, W, w, 'rush'), regime: r.regime, need: r.need, B: r.B});
  }
  // blind prep (build while running for the widest box, or fill everything) loses when some variant's budget is short of it
  const lookWins = rows.every(r => r.look < r.rival || r.rivalOut === 'fall'), blindLoses = rows.some(r => r.B < seg.worst), rushLoses = rows.some(r => r.rush === Infinity || r.rush > r.rival);
  return {rows, fill: seg.fill, worst: seg.worst, ok: lookWins && blindLoses && rushLoses, know: [n, w].map(W => Math.round(knowAt(m.you.pts, box.R, W))), stopFrom: Math.round(brakeDist(top(m.you.pts[2])))};
}

// The candidate: see SEGMENT-MATH.md, "Designing a segment"
export const LOOK = {key: 'look-pays', title: 'Measure Twice', after: 80,
  you: {pts: [70, 70, 30]},
  boxes: [{x: 700, R: 20, variants: [{p: [0.5, 'narrow'], f: 0.65}, {p: [0.5, 'wide'], f: 1.05}]}],
  rivals: [{name: 'Rival', x: 350, pts: [50, 40, 0], pace: 0.8, w: [100, 0, 0], post: 'plan'}]};

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = report(LOOK), f = x => x === Infinity ? 'falls' : x.toFixed(1) + ' s';
  console.log(`you see the far edge at ${r.know[0]} (narrow) and ${r.know[1]} (wide) before the face; at top speed you need ${r.stopFrom} to stop`);
  console.log(`blind prep for the wide box needs ${Math.round(r.worst)} points; filling everything needs ${r.fill}`);
  console.log('| Variant | Width | Regime | Budget | Need | Rival | look | brace | rush |\n|---|---|---|---|---|---|---|---|---|');
  for (const x of r.rows) console.log(`| ${x.variant} | ${x.W} | ${x.regime} | ${Math.round(x.B)} | ${Math.round(x.need)} | ${f(x.rival)} (${x.rivalOut}) | ${f(x.look)} | ${f(x.brace)} | ${f(x.rush)} |`);
  console.log(r.ok ? 'Looking is the way to win: look beats the rival in both variants; blind prep (budget < ' + r.worst + ' somewhere) and rush each lose one.' : 'Not yet: looking is not the way to win.');
}
