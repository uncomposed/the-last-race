// The widest box cleared clean at height h and face speed v (the sim's own flight rule, as cpOut in maps.js), for auto-jump and hand jump.
//   node campaign/widths.mjs [--rise 10]
const argv = process.argv.slice(2), rise = +(argv[argv.indexOf('--rise') + 1] || 10);
const C = {JUMP: 34, BOXU: 0.25}, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const jumpDur = v => clamp(0.56 + 38 / Math.max(v, 20), 0.5, 1.6), arcY = u => C.JUMP * clamp(2.2 * Math.sin(Math.PI * u), 0, 1), sink = jd => 2.2 * C.JUMP * Math.PI / jd;
function out(v, h, w, auto) { const jd = jumpDur(v), u0 = auto ? Math.min(1, Math.max(0.3, 6 / v) / jd) : C.BOXU, a0 = h + arcY(u0), t = w / v, Ta = (1 - u0) * jd;
  const alt = a0 >= rise ? (t <= Ta ? h + arcY(u0 + t / jd) : h - sink(jd) * (t - Ta)) : a0 - sink(jd) * w / v; return alt >= rise ? 0 : alt > 0 ? 1 : 2; }
export function wc(h, v, auto = true) { let lo = 0, hi = 800; if (out(v, h, 1, auto)) return 0; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (out(v, h, m, auto) === 0) lo = m; else hi = m; } return Math.round(lo); }
if (import.meta.url === `file://${process.argv[1]}`) {
  const S = [30, 50, 60, 70, 90, 115], H = [20, 30, 40, 50, 70, 90, 115];
  for (const auto of [true, false]) { console.log(`\nclean width, rise ${rise}, ${auto ? 'auto-jump' : 'hand jump'}: rows height, columns speed meter (top speed)`);
    console.log('h\\S ' + S.map(s => `${s}(${(50 + 0.85 * s).toFixed(0)})`.padStart(9)).join(''));
    for (const h of H) console.log(String(h).padStart(4) + S.map(s => String(wc(h, 50 + 0.85 * s, auto)).padStart(9)).join('')); }
}
