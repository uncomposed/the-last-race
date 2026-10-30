// Summarise raw/*.jsonl.gz from run.mjs. node analyze.mjs > tables.md
// SEs: a single rate uses the binomial SE; a paired delta (same date, tier, player) uses the SD of the per-date differences / sqrt(n dates)
// (clustered by date when several players are pooled, since players on one date share the track).
import {gunzipSync} from 'node:zlib';
import {readFileSync, existsSync, writeFileSync} from 'node:fs';
const dir = new URL('./raw/', import.meta.url).pathname;
const load = f => existsSync(dir + f) ? gunzipSync(readFileSync(dir + f)).toString().trim().split('\n').map(JSON.parse) : null;
const TW = ['Hard Lessons', 'Only 2 Strikes', 'Wider Gaps', 'Rivals Copy You More', 'Wider Singularity'];
const PL = ['custom', 'runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin'];
const pct = x => (100 * x).toFixed(0), f1 = x => x.toFixed(1), f2 = x => x.toFixed(2);
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1)); };
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : 0; };
const win = r => r.o === 'win' ? 1 : 0;
function cell(rows) {
  const n = rows.length, w = mean(rows.map(win));
  return {n, win: w, se: Math.sqrt(w * (1 - w) / Math.max(n, 1)), dis: mean(rows.map(r => r.o === 'dissolved' ? 1 : 0)), ext: mean(rows.map(r => r.o === 'extinct' ? 1 : 0)),
    sc: mean(rows.map(r => r.sc)), fa: mean(rows.map(r => r.fa)), p50: q(rows.map(r => r.sr), 0.5), p75: q(rows.map(r => r.sr), 0.75), max: Math.max(0, ...rows.map(r => r.sr))};
}
const key = r => r.d + '|' + r.t + '|' + r.p;
function paired(A, B, filt, valFn = win) {  // B - A, clustered by date
  const ia = new Map(A.filter(filt).map(r => [key(r), r])), byD = new Map();
  for (const b of B.filter(filt)) { const a = ia.get(key(b)); if (!a) continue; const d = byD.get(b.d) || []; d.push(valFn(b) - valFn(a)); byD.set(b.d, d); }
  const per = [...byD.values()].map(mean);
  return {d: mean(per), se: sd(per) / Math.sqrt(Math.max(per.length, 1)), nd: per.length};
}
const sig = (x) => Math.abs(x.d) >= 3 * x.se ? '' : '?';
const fmtD = x => (x.d >= 0 ? '+' : '') + pct(x.d) + ' ± ' + pct(x.se) + sig(x);
const O = [], out = s => O.push(s);
const summary = {};

for (const blk of ['cal', 'held']) {
  const s0 = load(blk + '.ship.s0.jsonl.gz'), s1 = load(blk + '.ship.s1.jsonl.gz'), n0 = load(blk + '.none.s0.jsonl.gz'), n1 = load(blk + '.none.s1.jsonl.gz');
  if (!s0 || !s1) continue;
  summary[blk] = {};
  out(`\n## Block ${blk} (${blk === 'cal' ? 'offsets 0-199, calibration' : 'offsets 400-799, held out'})\n`);
  // best probe per twist x tier x steps, chosen on cal
  out('\n### Per twist x tier: mean over 11 players, custom bot, best player (steps off -> on). Deltas are paired, date-clustered, in points; ? = under 3 SE\n');
  out('| Twist | Tier | n dates | all-player win off | on | Δ | custom off | on | Δ | best off (who) | best on (who) |');
  out('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const tw of TW) for (const t of [1, 2, 3]) {
    const F = r => r.tw === tw && r.t === t;
    const a0 = s0.filter(F), a1 = s1.filter(F);
    const all = paired(s0, s1, F), cu = paired(s0, s1, r => F(r) && r.p === 'custom');
    const best = rows => { let b = null; for (const p of PL) { const c = cell(rows.filter(r => r.p === p)); if (!b || c.win > b.c.win) b = {p, c}; } return b; };
    const b0 = best(a0), b1 = best(a1), c0 = cell(a0.filter(r => r.p === 'custom')), c1 = cell(a1.filter(r => r.p === 'custom'));
    const nd = new Set(a0.map(r => r.d)).size;
    summary[blk][tw + '|' + t] = {b0, b1, all0: mean(a0.map(win)), all1: mean(a1.map(win)), all, cu};
    out(`| ${tw} | ${t} | ${nd} | ${pct(mean(a0.map(win)))} | ${pct(mean(a1.map(win)))} | ${fmtD(all)} | ${pct(c0.win)} | ${pct(c1.win)} | ${fmtD(cu)} | ${pct(b0.c.win)} ± ${pct(b0.c.se)} (${b0.p}) | ${pct(b1.c.win)} ± ${pct(b1.c.se)} (${b1.p}) |`);
  }
  if (blk === 'held' && summary.cal) {
    out('\n### Held-out verdict: player chosen on the calibration block, scored on held out (removes the max-of-11 bias)\n');
    out('| Twist | Tier | off: cal pick -> held win | on: cal pick -> held win | verdict (on) |');
    out('|---|---|---|---|---|');
    for (const tw of TW) for (const t of [1, 2, 3]) {
      const c = summary.cal[tw + '|' + t], F = r => r.tw === tw && r.t === t;
      const h0 = cell(s0.filter(r => F(r) && r.p === c.b0.p)), h1 = cell(s1.filter(r => F(r) && r.p === c.b1.p));
      const v = h1.win + 2 * h1.se < 0.15 ? 'NEAR-UNWINNABLE' : h1.win < 0.15 ? 'near-unwinnable (provisional)' : h1.win - 2 * h1.se > 0.85 ? 'TRIVIAL' : h1.win > 0.85 ? 'trivial (provisional)' : 'ok';
      summary.held[tw + '|' + t].pick = {p0: c.b0.p, h0, p1: c.b1.p, h1, v};
      out(`| ${tw} | ${t} | ${c.b0.p} ${pct(h0.win)} ± ${pct(h0.se)} | ${c.b1.p} ${pct(h1.win)} ± ${pct(h1.se)} | ${v} |`);
    }
  }
  if (n0 && n1) {
    out('\n### Does the twist still bite? twist minus no-twist, same dates, mean over 11 players (points; ? = under 3 SE)\n');
    out('| Twist | Tier | steps off | steps on |');
    out('|---|---|---|---|');
    for (const tw of TW) for (const t of [1, 2, 3]) {
      const F = r => r.tw === tw && r.t === t;
      out(`| ${tw} | ${t} | ${fmtD(paired(n0, s0, F))} | ${fmtD(paired(n1, s1, F))} |`);
    }
    out('\n(custom bot only)\n');
    out('| Twist | Tier | steps off | steps on |');
    out('|---|---|---|---|');
    for (const tw of TW) for (const t of [1, 2, 3]) {
      const F = r => r.tw === tw && r.t === t && r.p === 'custom';
      out(`| ${tw} | ${t} | ${fmtD(paired(n0, s0, F))} | ${fmtD(paired(n1, s1, F))} |`);
    }
  }
  if (blk === 'held') {
    out('\n### Held out, per twist x tier x player (steps off / on): win %, dissolved %, extinct %, scrapes, falls, stopRev p50/p75/max\n');
    out('| Twist | Tier | Player | win off | win on | Δ win (paired) | diss off/on | ext off/on | scrapes off/on | falls off/on | stopRev off p50/p75/max | on p50/p75/max |');
    out('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const tw of TW) for (const t of [1, 2, 3]) for (const p of PL) {
      const F = r => r.tw === tw && r.t === t && r.p === p, c0 = cell(s0.filter(F)), c1 = cell(s1.filter(F)), d = paired(s0, s1, F);
      out(`| ${tw} | ${t} | ${p} | ${pct(c0.win)} | ${pct(c1.win)} | ${fmtD(d)} | ${pct(c0.dis)}/${pct(c1.dis)} | ${pct(c0.ext)}/${pct(c1.ext)} | ${f2(c0.sc)}/${f2(c1.sc)} | ${f2(c0.fa)}/${f2(c1.fa)} | ${c0.p50}/${c0.p75}/${c0.max} | ${c1.p50}/${c1.p75}/${c1.max} |`);
    }
    out('\n### Held out, per twist x tier, all 11 players pooled: outcome mix and per-race player counts (steps off -> on)\n');
    out('| Twist | Tier | win | dissolved | extinct | scrapes | falls | stopRev p50/p75/max off | on |');
    out('|---|---|---|---|---|---|---|---|---|');
    for (const tw of TW) for (const t of [1, 2, 3]) {
      const F = r => r.tw === tw && r.t === t, c0 = cell(s0.filter(F)), c1 = cell(s1.filter(F));
      out(`| ${tw} | ${t} | ${pct(c0.win)} -> ${pct(c1.win)} | ${pct(c0.dis)} -> ${pct(c1.dis)} | ${pct(c0.ext)} -> ${pct(c1.ext)} | ${f2(c0.sc)} -> ${f2(c1.sc)} | ${f2(c0.fa)} -> ${f2(c1.fa)} | ${c0.p50}/${c0.p75}/${c0.max} | ${c1.p50}/${c1.p75}/${c1.max} |`);
    }
  }
}
// sensitivity: steps on minus off under each tuning, and the steps-on level, mean over players
const SV = ['ship', 'nowarn06', 'nowarn20', 'strikesM1', 'strikesP1', 'odds05', 'odds15'];
const held = {}; for (const v of SV) held[v] = {s0: load(`held.${v}.s0.jsonl.gz`) || load('held.ship.s0.jsonl.gz'), s1: load(`held.${v}.s1.jsonl.gz`)};
if (SV.every(v => held[v].s1)) {
  out('\n## Sensitivity (held out): steps-on win % (mean over 11 players) and on-minus-off delta, per variant. NOWARN only exists with steps on, so its off column is the shipped off run.\n');
  out('| Twist | Tier | ' + SV.join(' | ') + ' |');
  out('|---|---|' + SV.map(() => '---').join('|') + '|');
  for (const tw of TW) for (const t of [1, 2, 3]) {
    const F = r => r.tw === tw && r.t === t;
    out(`| ${tw} | ${t} | ` + SV.map(v => { const d = paired(held[v].s0, held[v].s1, F); return pct(mean(held[v].s1.filter(F).map(win))) + ' (' + fmtD(d) + ')'; }).join(' | ') + ' |');
  }
  out('\nBest player win % on steps on per variant (max over 11 in held out, biased up) and verdict flags\n');
  out('| Twist | Tier | ' + SV.join(' | ') + ' |');
  out('|---|---|' + SV.map(() => '---').join('|') + '|');
  for (const tw of TW) for (const t of [1, 2, 3]) {
    const F = r => r.tw === tw && r.t === t;
    out(`| ${tw} | ${t} | ` + SV.map(v => { let b = null; for (const p of PL) { const c = cell(held[v].s1.filter(r => F(r) && r.p === p)); if (!b || c.win > b.win) b = Object.assign(c, {p}); } return pct(b.win) + (b.win < 0.15 ? ' LOW' : b.win > 0.85 ? ' HIGH' : '') + ' ' + b.p; }).join(' | ') + ' |');
  }
}
console.log(O.join('\n'));
writeFileSync(new URL('./summary.json', import.meta.url), JSON.stringify(summary));
