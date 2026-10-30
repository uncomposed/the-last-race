// Patched generator, applied after the page's own generator (and setRises): a share q of the regular boxes become "long" boxes.
// kind 'low': rise lo..hi of cap, width wlo..whi x the stop-and-build fit (BOXFIT reference); everything after the box shifts by the width change.
function h32(a) { a = Math.imul(a ^ a >>> 16, 0x45d9f3b); a = Math.imul(a ^ a >>> 16, 0x45d9f3b); return ((a ^ a >>> 16) >>> 0) / 4294967296; }
export const CFG = {
  base: null,
  lowLong: {q: 0.25, kinds: [{rise: [0.4, 0.55], w: [1.4, 1.7]}]},
  midLong: {q: 0.25, kinds: [{rise: [0.65, 0.75], w: [1.2, 1.4]}]},
  mixLong: {q: 0.25, kinds: [{rise: [0.4, 0.55], w: [1.4, 1.7]}, {rise: [0.65, 0.75], w: [1.2, 1.4]}]},
  speedMid: {q: 0.25, kinds: [{rise: [0.65, 0.75], w: [1.2, 1.4]}, {rise: [0.4, 0.5], w: [0.85, 0.95], full: 1}]},
  mixLong35: {q: 0.35, kinds: [{rise: [0.4, 0.55], w: [1.4, 1.7]}, {rise: [0.65, 0.75], w: [1.2, 1.4]}]},
};
export function patch(cfg) {
  if (!cfg) return null;
  return (T, X) => {
    const C = X.C, K = X.K;
    T.gaps.forEach((g, i) => {
      if (g.sing || g.inner || !(g.rise > 0)) return;
      const r = k => h32((T.finish * 131 + i * 7919 + k * 104729) | 0);
      if (r(1) >= cfg.q) { g.long = 0; return; }
      const kd = cfg.kinds[Math.floor(r(2) * cfg.kinds.length)], cap = C.CAPS[i];
      const rise = Math.round(cap * (kd.rise[0] + (kd.rise[1] - kd.rise[0]) * r(3)));
      let lim = -60; for (const b of T.bars) if (b.x < g.x) lim = Math.max(lim, b.x + C.BW + 2);
      if (i > 0) lim = Math.max(lim, T.gaps[i - 1].x + T.gaps[i - 1].W + 10);
      const vrun = kd.full ? C.TOP0 + 0.85 * cap : Math.min(C.TOP0 + 0.85 * cap * K.stepV / 100, Math.sqrt(2 * C.ACC * Math.max(g.x - lim - 8, 0)));
      const W = Math.max(30, Math.round(X.boxFit(cap, rise, vrun) * (kd.w[0] + (kd.w[1] - kd.w[0]) * r(4)))), d = W - g.W;
      g.rise = rise; g.long = 1; g.nowarn = false;
      if (d) { for (const b of T.bars) if (b.x > g.x) b.x += d; for (let j = i + 1; j < T.gaps.length; j++) T.gaps[j].x += d; T.finish += d; T.x0 += d; g.W = W; }
    });
  };
}
