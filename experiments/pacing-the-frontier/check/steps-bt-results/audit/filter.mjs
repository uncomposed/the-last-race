// Daily seed filter (boxes agent's rule) in strict and relaxed form, plus scrape-only stats per map.
// PF_PAGE=<page> STEPTW=<json> node filter.mjs <offStart> <count> <out.json>
// Candidate k: k=0 dailySeed(ds), k>=1 dailySeed(ds+'#'+k). Classes from ../boxes/feas.mjs classifyTrack at timing u25 (bar/bot press 25% into the arc),
// with sensitivity classes at 'peak' and 'window' for k=0. strict: no infeasible, no scrape-only, near-max share <= 0.2, <= 1 no-warning, <= 3 stop+scrape boxes.
// relaxed: the same but up to 1 scrape-only box (the singularity counts).
import {writeFileSync, readFileSync} from 'node:fs';
import {classifyTrack} from '../boxes/feas.mjs';
import {GAME, trackStats} from '../boxes/bt.mjs';
import {dailyDates} from '../boxes/common.mjs';
const [s0, cnt, out] = process.argv.slice(2);
const REF = JSON.parse(readFileSync(new URL('../boxes/ref-cal.json', import.meta.url), 'utf8'));
function judge(seed, tw, timing) {
  const c = {seed, roster: [], chill: 0, knobs: Object.assign({}, GAME.TWISTS[tw] || {}), consts: {}};
  const b = classifyTrack(c, REF, {u0: timing}), ts = trackStats(Object.assign({}, c, {steps: 1}));
  const st = ts.boxes.filter(x => x.shape), nm = st.filter(x => x.nearMax).length, sc = b.filter(x => x.cls === 'scrape');
  const r = {n: b.length, infeasible: b.filter(x => x.cls === 'infeasible').length, scrapeOnly: sc.length, singScrape: sc.some(x => x.sing) ? 1 : 0,
    stopBoxes: b.filter(x => x.cls === 'stop' || x.cls === 'scrape').length, nearMaxShare: st.length ? nm / st.length : 0, nowarn: ts.nowarn};
  const base = r.infeasible === 0 && r.nearMaxShare <= 0.2 && r.nowarn <= 1 && r.stopBoxes <= 3;
  r.strict = base && r.scrapeOnly === 0; r.relaxed = base && r.scrapeOnly <= 1;
  return r;
}
const rows = [];
for (const ds of dailyDates(+s0, +cnt)) {
  const tw = GAME.dailyBrief(ds).twist.name, row = {ds, tw, kStrict: null, kRelaxed: null};
  for (let k = 0; k < 30 && (row.kStrict === null || row.kRelaxed === null); k++) {
    const seed = GAME.dailySeed(k ? ds + '#' + k : ds), r = judge(seed, tw, 'u25');
    if (k === 0) { row.k0 = r; row.k0peak = judge(seed, tw, 'peak'); row.k0window = judge(seed, tw, 'window'); }
    if (r.strict && row.kStrict === null) { row.kStrict = k; row.seedStrict = seed; }
    if (r.relaxed && row.kRelaxed === null) { row.kRelaxed = k; row.seedRelaxed = seed; }
  }
  rows.push(row);
}
const sw = key => Object.fromEntries(rows.filter(r => r[key] !== undefined).map(r => [r.ds, r[key]]));
writeFileSync(out, JSON.stringify({rows}));
writeFileSync(out.replace('.json', '-swap-strict.json'), JSON.stringify(sw('seedStrict')));
writeFileSync(out.replace('.json', '-swap-relaxed.json'), JSON.stringify(sw('seedRelaxed')));
const n = rows.length, f = (p) => (100 * rows.filter(p).length / n).toFixed(1);
const tries = key => { const a = rows.map(r => r[key] === null ? 30 : r[key] + 1); return (a.reduce((x, y) => x + y, 0) / n).toFixed(2) + ' max ' + Math.max(...a); };
console.log(JSON.stringify({n, pass0Strict: f(r => r.kStrict === 0), pass0Relaxed: f(r => r.kRelaxed === 0), triesStrict: tries('kStrict'), triesRelaxed: tries('kRelaxed'),
  noneStrict: rows.filter(r => r.kStrict === null).length, noneRelaxed: rows.filter(r => r.kRelaxed === null).length}));
