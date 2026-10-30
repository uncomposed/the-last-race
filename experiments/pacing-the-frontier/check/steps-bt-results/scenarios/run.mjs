import {writeFileSync} from 'node:fs';
import {one, buildTrack, PLAYERS} from './scen.mjs';
import {SPECS, OPTS} from './specs.mjs';
const [names, N, out] = [process.argv[2].split(','), +process.argv[3], process.argv[4]];
const rows = [];
for (const nm of names) { const spec = SPECS[nm], sc = (T, X) => buildTrack(spec, T, X);
  for (let z = 0; z < N; z++) for (const p of PLAYERS) { const r = one(sc, p, z, OPTS[nm] || {}); r.scen = nm; rows.push(r); } }
writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); console.log(out, rows.length);
