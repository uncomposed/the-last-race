// Summarise camp-eval.mjs output: node analyze.mjs file.json [--diff medium] [--keys m1:1823,...] [--json]
// Per case: every probe's pooled win rate (all tiers), the lesson vs its foils (paired by tier and noise id, SE of the mean difference),
// rank, and the lesson's stopRev p50/p75/max, scrapes, falls, dissolution, extinction, per-tier wins and the probe mean per tier.
import {readFileSync} from 'node:fs';
export const LESSONS = {  // slot -> lesson probe and foils (judgement; see campaign.md)
  1: {lesson: 'follower', foils: ['runup', 'rush']},
  2: {lesson: 'climber', foils: ['balanced', 'rush', 'gamble']},
  3: {lesson: 'gamble', foils: ['climber', 'balanced']},
  4: {lesson: 'scout', foils: ['climber', 'rush']},
  5: {lesson: 'balanced', foils: ['scout', 'climber', 'rush']},
  6: {lesson: 'bold', foils: ['climber', 'balanced']},
  7: {lesson: 'rush', foils: ['climber', 'balanced', 'follower']},
  8: {lesson: 'follower', foils: ['bold', 'rush']},
  9: {lesson: 'climber', foils: ['balanced', 'rush']},
};
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : null; };
const r3 = x => Math.round(x * 1000) / 1000;
export function summarise(rows, {diff = 'medium', lessonFor = k => LESSONS[+k.slice(1).split(':')[0]]} = {}) {
  const out = {};
  const keys = [...new Set(rows.map(r => r[0]))];
  for (const key of keys) {
    const R = rows.filter(r => r[0] === key && r[2] === diff);
    if (!R.length) continue;
    const players = [...new Set(R.map(r => r[4]))], tiers = [...new Set(R.map(r => r[1]))].sort();
    const by = {}; for (const p of players) by[p] = R.filter(r => r[4] === p);
    const wr = p => by[p].reduce((s, r) => s + r[5], 0) / by[p].length;
    const ranked = players.map(p => [p, wr(p)]).sort((a, b) => b[1] - a[1]);
    const L = lessonFor(key) || {lesson: ranked[0][0], foils: []};
    const res = {n: by[L.lesson] ? by[L.lesson].length : 0, ranking: ranked.map(([p, w]) => p + ' ' + r3(w)).join(', ')};
    if (by[L.lesson]) {
      const lr = by[L.lesson], idx = r => r[1] + '|' + r[3];
      const lw = new Map(lr.map(r => [idx(r), r[5]]));
      const foil = L.foils.filter(f => by[f]).map(f => {
        const d = by[f].map(r => lw.get(idx(r)) - r[5]), m = d.reduce((s, x) => s + x, 0) / d.length;
        const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1));
        return {foil: f, foilWin: r3(wr(f)), diff: r3(m), se: r3(sd / Math.sqrt(d.length)), z: r3(m / (sd / Math.sqrt(d.length)))};
      }).sort((a, b) => a.diff - b.diff);
      const n = lr.length, m = f => r3(lr.reduce((s, r) => s + f(r), 0) / n), sr = lr.map(r => r[7]), wins = lr.filter(r => r[5]);
      Object.assign(res, {lesson: L.lesson, win: r3(wr(L.lesson)), se: r3(Math.sqrt(wr(L.lesson) * (1 - wr(L.lesson)) / n)),
        rank: ranked.findIndex(x => x[0] === L.lesson) + 1, top: ranked[0][0], worstFoil: foil[0] || null, foils: foil,
        stopRev: {p50: q(sr, 0.5), p75: q(sr, 0.75), max: Math.max(...sr), winP50: wins.length ? q(wins.map(r => r[7]), 0.5) : null, winP75: wins.length ? q(wins.map(r => r[7]), 0.75) : null, winsNoStop: r3(wins.filter(r => r[7] === 0).length / Math.max(1, wins.length))},
        scrapes: m(r => r[8]), falls: m(r => r[9]), strikes: m(r => r[10]), dissolved: m(r => r[11]), extinct: m(r => r[12]),
        perTier: tiers.map(t => { const x = lr.filter(r => r[1] === t); return r3(x.reduce((s, r) => s + r[5], 0) / x.length); }),
        probeMeanPerTier: tiers.map(t => { const x = R.filter(r => r[1] === t); return r3(x.reduce((s, r) => s + r[5], 0) / x.length); })});
    }
    // all-probe stopRev (map design rule) and race-level extinction
    const all = R.map(r => r[7]);
    res.allProbes = {stopRevP50: q(all, 0.5), stopRevP75: q(all, 0.75), stopRevMax: Math.max(...all), extinct: r3(R.reduce((s, r) => s + r[12], 0) / R.length), dissolved: r3(R.reduce((s, r) => s + r[11], 0) / R.length)};
    out[key] = res;
  }
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('analyze.mjs')) {
  const a = process.argv.slice(2), f = a[0], diff = a.includes('--diff') ? a[a.indexOf('--diff') + 1] : 'medium';
  const {rows} = JSON.parse(readFileSync(f, 'utf8'));
  const S = summarise(rows, {diff});
  if (a.includes('--json')) { console.log(JSON.stringify(S, null, 1)); }
  else for (const [k, s] of Object.entries(S)) {
    console.log(`${k} [${diff}] ${s.lesson} ${s.win}±${s.se} rank ${s.rank} (top ${s.top}) tiers ${s.perTier} | worst foil ${s.worstFoil ? s.worstFoil.foil + ' ' + s.worstFoil.foilWin + ' d ' + s.worstFoil.diff + '±' + s.worstFoil.se + ' z ' + s.worstFoil.z : '-'}`);
    console.log(`   stopRev ${JSON.stringify(s.stopRev)} scr ${s.scrapes} falls ${s.falls} diss ${s.dissolved} ext ${s.extinct} | all probes ${JSON.stringify(s.allProbes)} probeMean/tier ${s.probeMeanPerTier}`);
    console.log(`   ${s.ranking}`);
  }
}
