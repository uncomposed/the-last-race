// Scrape-only share per map (information, not a defect), by timing model. PF_PAGE=<page> node feasstats.mjs free|campaign <start> <count> <timings> <out.json>
// Classes from ../boxes/feas.mjs (speed / stop / scrape-only / infeasible), reference arrivals ../boxes/ref-cal.json.
import {writeFileSync, readFileSync} from 'node:fs';
import {classifyTrack} from '../boxes/feas.mjs';
import {GAME, campaignConfig} from '../boxes/bt.mjs';
const [mode, s0, cnt, tl, out] = process.argv.slice(2), timings = tl.split(',');
const REF = JSON.parse(readFileSync(new URL('../boxes/ref-cal.json', import.meta.url), 'utf8'));
const cfgs = mode === 'free' ? [...Array(+cnt).keys()].map(k => ({id: +s0 + k, seed: +s0 + k, roster: [], chill: 0}))
  : GAME.CAMPAIGN.map((m, i) => Object.assign(campaignConfig(i, 0, {steps: 1}), {id: 'map' + (i + 1), roster: []}));
const res = {};
for (const tm of timings) {
  const per = cfgs.map(c => { const b = classifyTrack(c, REF, {u0: tm}); const sc = b.filter(x => x.cls === 'scrape');
    return {id: c.id, n: b.length, speed: b.filter(x => x.cls === 'speed').length, stop: b.filter(x => x.cls === 'stop').length, scrape: sc.length, inf: b.filter(x => x.cls === 'infeasible').length, sing: (b.find(x => x.sing) || {}).cls || null}; });
  const N = per.reduce((a, r) => a + r.n, 0), S = k => per.reduce((a, r) => a + r[k], 0);
  res[tm] = {maps: per.length, boxes: N, pctSpeed: +(100 * S('speed') / N).toFixed(1), pctStop: +(100 * S('stop') / N).toFixed(1), pctScrape: +(100 * S('scrape') / N).toFixed(1), pctInf: +(100 * S('inf') / N).toFixed(1),
    scrapePerMap: +(S('scrape') / per.length).toFixed(2), mapsWithScrape: +(100 * per.filter(r => r.scrape > 0).length / per.length).toFixed(1), mapsWith2plus: +(100 * per.filter(r => r.scrape > 1).length / per.length).toFixed(1),
    singScrape: +(100 * per.filter(r => r.sing === 'scrape').length / per.filter(r => r.sing).length).toFixed(1), per: mode === 'campaign' ? per : undefined};
  console.log(mode, tm, JSON.stringify(Object.assign({}, res[tm], {per: undefined})));
}
writeFileSync(out, JSON.stringify(res));
