// node winrun.mjs <label> <cal|held> <knobsJSON> <constsJSON> <players> [twist 0|1] [dates filter file]  -> win-<label>-<block>.json
// players: probe names / custom (runRace) or smart, smart:<probe> (tuning agent's box-competent probe, copied). Daily configs, chill off, steps on.
import {readFileSync, writeFileSync} from 'node:fs';
import {runRace, dailyConfig} from './bt.mjs';
import {runBoxRace} from './boxprobe-copy.mjs';
import {dailyDates} from './common.mjs';
const [label, block, kj, cj, pl, tw, filt] = process.argv.slice(2);
const knobs = JSON.parse(kj || '{}'), consts = JSON.parse(cj || '{}'), players = (pl || 'custom').split(','), twist = tw === undefined ? 1 : +tw;
let dates = block === 'held' ? dailyDates(400, 400) : dailyDates(0, 200);
const swap = filt ? JSON.parse(readFileSync(filt, 'utf8')) : null;  // {date: seed} replaces the day's seed (seed filter)
const rows = [];
for (const ds of dates) for (let t = 0; t < 3; t++) {
  const c = dailyConfig(ds, t, {steps: 1}); if (!twist) c.knobs = {}; Object.assign(c.knobs, knobs); c.consts = consts;
  if (swap && swap[ds] !== undefined) c.seed = swap[ds];
  for (const p of players) {
    let win, rec = {};
    if (p.startsWith('smart')) { const r = runBoxRace(Object.assign({}, c, {steps: 1, chill: 0}), {mode: 'smart', base: p.split(':')[1] || null}); win = r.win; rec = {dis: r.dis, scr: r.scr, fall: r.fall}; }
    else { const r = runRace(Object.assign({}, c, {player: p})); win = r.outcome === 'win' ? 1 : 0; rec = {dis: r.labs[0].dissolved, scr: r.labs[0].scrapes, fall: r.labs[0].falls, stopRev: r.labs[0].stopRev}; }
    rows.push(Object.assign({ds, t, p, win, twist: c.twist}, rec));
  }
}
const sum = {};
for (const p of players) for (const t of [0, 1, 2, 'all']) {
  const R = rows.filter(r => r.p === p && (t === 'all' || r.t === t)), n = R.length, w = R.reduce((a, r) => a + r.win, 0) / n;
  const sr = R.filter(r => r.stopRev !== undefined).map(r => r.stopRev).sort((a, b) => a - b);
  sum[p + '.' + t] = {n, win: +w.toFixed(4), se: +Math.sqrt(w * (1 - w) / n).toFixed(4), scr: +(R.reduce((a, r) => a + r.scr, 0) / n).toFixed(3), fall: +(R.reduce((a, r) => a + r.fall, 0) / n).toFixed(3),
    srP75: sr.length ? sr[Math.floor(0.75 * sr.length)] : null, srMax: sr.length ? sr[sr.length - 1] : null};
}
writeFileSync('win-' + label + '-' + block + '.json', JSON.stringify({label, block, knobs, consts, twist, sum, rows}));
console.log(label, block, Object.entries(sum).filter(([k]) => k.endsWith('.all') || true).map(([k, v]) => k + ' ' + (100 * v.win).toFixed(1) + '±' + (100 * v.se).toFixed(1)).join('  '));
