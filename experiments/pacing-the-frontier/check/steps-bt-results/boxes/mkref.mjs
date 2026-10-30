// reference arrivals (steps off, decent probes) on CALIBRATION blocks only: free 0-499, daily offsets 0-199 (all three tiers)
import {writeFileSync} from 'node:fs';
import {collectRef} from './feas.mjs';
import {DECENT, freeTrackCfgs, dailyDates} from './common.mjs';
import {dailyConfig} from './bt.mjs';
const cfgs = freeTrackCfgs(0, 500);
for (const ds of dailyDates(0, 200)) for (let t = 0; t < 3; t++) cfgs.push(dailyConfig(ds, t, {}));
const ref = collectRef(cfgs, DECENT);
writeFileSync('ref-cal.json', JSON.stringify(ref));
console.log(Object.entries(ref).map(([k, v]) => k + ':' + v.length).join(' '));
