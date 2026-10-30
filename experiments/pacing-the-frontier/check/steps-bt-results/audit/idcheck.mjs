// Identity checks: race.mjs probe races == harness runRace; crawl/smart == tuning runBoxRace (original page only, where C.BOXU is unset)
import {race} from './race.mjs';
import {runRace, campaignConfig, dailyConfig} from './bt.mjs';
const bp = process.env.PF_PAGE ? null : await import('../tuning/boxprobe.mjs');
let n = 0, bad = 0;
const cfgs = [];
for (let s = 7000; s < 7015; s++) cfgs.push({seed: s, steps: 1, roster: null, chill: 1, strikesYou: null});
for (let s = 7000; s < 7010; s++) cfgs.push({seed: s, steps: 1, roster: null, chill: 0, strikesYou: 4});
for (const i of [0, 4, 8]) cfgs.push(Object.assign(campaignConfig(i, 1, {steps: 1}), {nz: 777, jitter: 777}));
cfgs.push(dailyConfig('2027-06-01', 0, {steps: 1}), dailyConfig('2027-06-02', 2, {steps: 0}));
for (const c of cfgs) {
  for (const p of ['runup', 'gamble', 'follower']) {
    const a = race(c, p), b = runRace(Object.assign({}, c, {player: p})); n++;
    if (a.out !== b.outcome || a.scr !== b.labs[0].scrapes || a.sr0 !== b.labs[0].stopRev || a.fall !== b.labs[0].falls) { bad++; console.log('MISMATCH', p, c.seed, a.out, b.outcome, a.scr, b.labs[0].scrapes, a.sr0, b.labs[0].stopRev); }
  }
  if (bp) for (const [p, o] of [['crawl', {mode: 'crawl', base: 'gamble'}], ['smart', {mode: 'smart', base: null}]]) {
    const a = race(Object.assign({}, c, {jitter: null}), p), b = bp.runBoxRace(Object.assign({}, c, {steps: c.steps ?? 1}), o); n++;
    if (a.win !== b.win || a.scr !== b.scr || a.fall !== b.fall || a.dis !== b.dis) { bad++; console.log('MISMATCH', p, c.seed, a, b); }
  }
}
console.log((process.env.PF_PAGE || 'original page'), n, 'checks', bad, 'mismatches');
