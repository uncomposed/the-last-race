// node mech.mjs screen/sN.json id1,id2 : every probe's win, gap stops (mean, p75), all stops p75, scrapes, side, barrier crashes, dissolved
import {readFileSync} from 'node:fs';
const [f, ids] = process.argv.slice(2); const {results} = JSON.parse(readFileSync(f, 'utf8'));
for (const id of ids.split(',')) { const r = results.find(x => x.id === id); if (!r) continue; console.log(id, '|', r.track.boxes.join(' | '), '| mean/tier', r.probeMeanPerTier);
  for (const [p, v] of Object.entries(r.probes).sort((a, b) => b[1].win - a[1].win)) console.log('   ' + p.padEnd(9), v.win.toFixed(3), 'tiers', v.tiers.join('/'), 'sg', v.sgMean, 'sgP75', v.sgP75, 'srP75', v.srP75, 'scr', v.scr, 'side', v.side, 'bc', v.bc, 'falls', v.falls, 'diss', v.diss, 'ext', v.ext); }
