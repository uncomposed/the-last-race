// node feasrun.mjs <label> <block: cal|held> [knobsJSON] [constsJSON] [u0: window|peak|chill|best]  -> feas-<label>-<block>.json, prints a summary line
import {readFileSync, writeFileSync} from 'node:fs';
import {classifyTrack, tally, CLASSES} from './feas.mjs';
import {trackStats} from './bt.mjs';
import {dailyTrackCfgs, freeTrackCfgs} from './common.mjs';
const [label, block, kj, cj, u0] = process.argv.slice(2);
const knobs = kj ? JSON.parse(kj) : {}, consts = cj ? JSON.parse(cj) : {};
const ref = JSON.parse(readFileSync('ref-cal.json', 'utf8'));
const cfgs = block === 'held' ? [...freeTrackCfgs(3000, 1000, {knobs, consts}), ...dailyTrackCfgs(400, 400, {knobs, consts})]
                              : [...freeTrackCfgs(0, 1000, {knobs, consts}), ...dailyTrackCfgs(0, 200, {knobs, consts})];
const all = [], tracks = [];
for (const c of cfgs) {
  const b = classifyTrack(c, ref, {u0: u0 || 'window'}), ts = trackStats(Object.assign({}, c, {steps: 1}));
  b.forEach((x, k) => { const s = ts.boxes.find(y => y.i === x.i); x.hNeedBot = s ? s.hNeedBot : null; x.nearMax = s ? !!s.nearMax : false; x.shape = s ? s.shape : null; });
  all.push(...b); tracks.push({seed: c.seed, date: c.date || null, boxes: b});
}
const by = f => { const o = {}; for (const x of all) { const k = f(x); (o[k] = o[k] || []).push(x); } return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, tally(v)])); };
const trackBad = tracks.filter(t => t.boxes.some(b => b.cls === 'infeasible')).length, trackScr = tracks.filter(t => t.boxes.some(b => b.cls === 'scrape')).length;
const sum = {label, block, knobs, consts, u0: u0 || 'window', tracks: tracks.length, all: tally(all), nearMax: all.filter(b => b.nearMax).length, nowarn: all.filter(b => b.nowarn).length,
  tracksWithInfeasible: trackBad, tracksWithScrapeOnly: trackScr, byLevel: by(b => b.lv), byShape: by(b => b.shape), sing: tally(all.filter(b => b.sing)), nonSing: tally(all.filter(b => !b.sing)),
  meanW: +(all.reduce((a, b) => a + b.W, 0) / all.length).toFixed(1)};
writeFileSync('feas-' + label + '-' + block + '.json', JSON.stringify(Object.assign({}, sum, {tracksRows: tracks})));
const pc = (k, t = sum.all) => (100 * t[k] / t.n).toFixed(1);
console.log(label, block, 'n', sum.all.n, CLASSES.map(k => k + ' ' + pc(k)).join(' '), '| nonSing', CLASSES.map(k => pc(k, sum.nonSing)).join('/'), '| sing', CLASSES.map(k => pc(k, sum.sing)).join('/'), '| nearMax', (100 * sum.nearMax / sum.all.n).toFixed(1), 'tracks w/ scrape-only', trackScr, 'w/ infeasible', trackBad, 'meanW', sum.meanW);
