// Held-out report for the picks (picks.json): node report.mjs > heldout/report.txt ; also writes heldout/summary.json
// Rows from camp-eval.mjs: [key, tier, diff, nz, player, win, oc, stopRev, scrapes, falls, strikes, dissolved, extinct, stops, stopRevGap, crashBar, sideScrapes]
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
const P = JSON.parse(readFileSync('picks.json', 'utf8'));
const load = f => existsSync('heldout/' + f + '.json') ? JSON.parse(readFileSync('heldout/' + f + '.json', 'utf8')).rows : null;
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : null; };
const r2 = x => Math.round(x * 100) / 100, PROBES = ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin'];
const wr = rs => rs.length ? rs.reduce((s, r) => s + r[5], 0) / rs.length : NaN;
function paired(rows, L, F) {  // lesson minus foil, paired by tier and noise id
  const idx = r => r[1] + '|' + r[3], lw = new Map(rows.filter(r => r[4] === L).map(r => [idx(r), r[5]]));
  const d = rows.filter(r => r[4] === F && lw.has(idx(r))).map(r => lw.get(idx(r)) - r[5]); const m = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1)), se = sd / Math.sqrt(d.length);
  return {foil: F, foilWin: r2(wr(rows.filter(r => r[4] === F))), diff: r2(m), se: r2(se), z: r2(m / se)};
}
function verdict(rows, p) {
  const L = p.lesson, lr = rows.filter(r => r[4] === L), n = lr.length, w = wr(lr);
  const foils = p.foils.map(f => paired(rows, L, f)).sort((a, b) => a.diff - b.diff);
  return {n, win: r2(w), se: r2(Math.sqrt(w * (1 - w) / n)), worst: foils[0], foils};
}
const main = load('main'), ladder = load('ladder'), plus1 = load('plus1'), sens = {nw06: load('nw06'), nw20: load('nw20'), strM1: load('strM1'), strP1: load('strP1')};
const S = {}; const out = [];
for (const p of P) {
  const key = 'm' + p.slot + ':' + p.seed, L = p.lesson, s = {slot: p.slot, seed: p.seed, lesson: L, foils: p.foils};
  const M = main.filter(r => r[0] === key && r[2] === 'medium'), Mh = M.filter(r => r[3] !== 0), M0 = M.filter(r => r[3] === 0);
  s.heldout = verdict(Mh, p); s.shipped = verdict(M0, p);
  const rank = PROBES.map(x => [x, wr(Mh.filter(r => r[4] === x))]).sort((a, b) => b[1] - a[1]);
  s.rank = rank.findIndex(x => x[0] === L) + 1; s.top = rank.slice(0, 3).map(([x, v]) => x + ' ' + r2(v)).join(', ');
  const lr = Mh.filter(r => r[4] === L), wins = lr.filter(r => r[5]);
  const qs = (a) => ({p50: q(a, 0.5), p75: q(a, 0.75), max: Math.max(...a)});
  s.stopRev = qs(lr.map(r => r[7])); s.stopRevGap = qs(lr.map(r => r[14])); s.winsStopRev = wins.length ? qs(wins.map(r => r[7])) : null;
  s.winsNoGapStop = r2(wins.filter(r => r[14] === 0).length / Math.max(1, wins.length));
  const m = f => r2(lr.reduce((a, r) => a + f(r), 0) / lr.length);
  Object.assign(s, {scrapes: m(r => r[8]), falls: m(r => r[9]), barrierCrashes: m(r => r[15]), dissolved: m(r => r[11]), extinct: m(r => r[12])});
  const allP = Mh.filter(r => PROBES.includes(r[4]));
  s.allProbes = {stopRev: qs(allP.map(r => r[7])), stopRevGap: qs(allP.map(r => r[14])), extinct: r2(allP.reduce((a, r) => a + r[12], 0) / allP.length), dissolved: r2(allP.reduce((a, r) => a + r[11], 0) / allP.length)};
  s.lessonPerTier = [1, 2, 3].map(t => r2(wr(lr.filter(r => r[1] === t))));
  s.probeMeanPerTier = [1, 2, 3].map(t => r2(wr(allP.filter(r => r[1] === t))));
  s.mechanism = {climber: r2(wr(Mh.filter(r => r[4] === 'climber'))), climb0: r2(wr(Mh.filter(r => r[4] === 'climb0'))), rush: r2(wr(Mh.filter(r => r[4] === 'rush'))), rush1: r2(wr(Mh.filter(r => r[4] === 'rush1')))};
  const lad = d => { const R = (d === 'medium' ? Mh : ladder.filter(r => r[0] === key && r[2] === d && r[3] !== 0)); return r2(wr(R.filter(r => r[4] === L))); };
  s.ladder = {easy: lad('easy'), medium: lad('medium'), hard: lad('hard')};
  if (plus1) { const R = plus1.filter(r => r[0] === key); s.plus1 = {};
    for (const d of ['easy', 'medium', 'hard']) { const x = R.filter(r => r[2] === d); const v = verdict(x, p); s.plus1[d] = {win: v.win, worst: v.worst.foil + ' ' + v.worst.foilWin, diff: v.worst.diff, se: v.worst.se, z: v.worst.z}; } }
  s.sens = {}; const base50 = M.filter(r => r[3] < 150); const b = verdict(base50, p); s.sens.base50 = {win: b.win, diff: b.worst.diff, se: b.worst.se, foil: b.worst.foil};
  for (const [k, R] of Object.entries(sens)) if (R) { const v = verdict(R.filter(r => r[0] === key), p); s.sens[k] = {win: v.win, diff: v.worst.diff, se: v.worst.se, foil: v.worst.foil}; }
  S['m' + p.slot] = s;
  out.push(`map ${p.slot} seed ${p.seed} lesson ${L}: held-out ${s.heldout.win}±${s.heldout.se} (n ${s.heldout.n}) worst foil ${s.heldout.worst.foil} ${s.heldout.worst.foilWin} diff ${s.heldout.worst.diff}±${s.heldout.worst.se} z ${s.heldout.worst.z}; rank ${s.rank} (top ${s.top})`);
  out.push(`   shipped noise 0: ${s.shipped.win} (n ${s.shipped.n}) worst foil ${s.shipped.worst.foil} ${s.shipped.worst.foilWin}`);
  out.push(`   stopRev ${JSON.stringify(s.stopRev)} gap-only ${JSON.stringify(s.stopRevGap)} wins ${JSON.stringify(s.winsStopRev)} winsNoGapStop ${s.winsNoGapStop}; scrapes ${s.scrapes} falls ${s.falls} barrierCrashes ${s.barrierCrashes} dissolved ${s.dissolved} extinct ${s.extinct}`);
  out.push(`   all probes: ${JSON.stringify(s.allProbes)}; lesson per tier ${s.lessonPerTier} probe mean per tier ${s.probeMeanPerTier}; mechanism ${JSON.stringify(s.mechanism)}`);
  out.push(`   ladder E/M/H ${s.ladder.easy}/${s.ladder.medium}/${s.ladder.hard}; +1 strike (5/4/3) ${s.plus1 ? ['easy', 'medium', 'hard'].map(d => s.plus1[d].win + ' (d ' + s.plus1[d].diff + '±' + s.plus1[d].se + ')').join(' / ') : '-'}`);
  out.push(`   sensitivity (noise 0,100-149, Medium; lesson win, diff vs worst foil): ${Object.entries(s.sens).map(([k, v]) => k + ' ' + v.win + ' d ' + v.diff + '±' + v.se + ' ' + v.foil).join('; ')}`);
}
writeFileSync('heldout/summary.json', JSON.stringify(S, null, 1));
console.log(out.join('\n'));
