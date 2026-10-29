// Checks that the race simulation in prototype.html still gives the recorded results.
// Plain Node, no dependencies. Usage:
//   node experiments/pacing-the-frontier/check/sim-check.mjs          check against reference.json
//   node experiments/pacing-the-frontier/check/sim-check.mjs --write  record new results (commit them with the change)
// If the simulation section is byte-identical to the one recorded, the replay is skipped: UI-only changes cost nothing.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const page = join(here, '..', 'prototype.html');
const refPath = join(here, 'reference.json');
const write = process.argv.includes('--write');

// The simulation is the part of the page from `function $(id)` to `window.PF={`; it touches no DOM.
const lines = readFileSync(page, 'utf8').split('\n');
const a = lines.findIndex(l => l.startsWith('function $(id)'));
const b = lines.findIndex(l => l.startsWith('window.PF={'));
if (a < 0 || b < a) { console.error('Could not find the simulation section in prototype.html'); process.exit(1); }
const sim = lines.slice(a, b + 1).join('\n');
const simHash = createHash('sha256').update(sim).digest('hex');

// Determinism rules for the simulation, so a server can replay a run to the last bit in any browser. Math.min, max, abs, floor, ceil,
// round, trunc, sign, sqrt, imul and PI give the same result in every engine. Math.sin, cos, log, exp, pow and the rest may differ in
// the last bit between engines (Safari is not V8), so the simulation uses its own dsin, dcos, dlog and dexp. Clocks and random
// numbers would make a replay differ from the race outright.
const EXACT_MATH = new Set(['min', 'max', 'abs', 'floor', 'ceil', 'round', 'trunc', 'sign', 'sqrt', 'imul', 'fround', 'clz32', 'PI']);
const banned = new Set(), code = sim.replace(/\/\*[\s\S]*?\*\//g, ''); // block comments may name the banned functions
for (const m of code.matchAll(/\bMath\.([A-Za-z0-9_]+)/g)) if (!EXACT_MATH.has(m[1])) banned.add('Math.' + m[1]);
for (const m of code.matchAll(/\b(Date\.|performance\.|crypto\.)/g)) banned.add(m[1].slice(0, -1));
if (/\*\*/.test(code)) banned.add('the ** operator');
if (banned.size) {
  console.error('The simulation section uses ' + [...banned].join(', ') + ', which can differ between engines or runs. Use the exact Math functions or dsin, dcos, dlog and dexp.');
  process.exit(1);
}

// The page carries its own simulation hash (SIM_HASH, outside the simulation section) for the input log's header.
const hashRe = /^var SIM_HASH='([0-9a-f]*)';$/m;
const pageText = readFileSync(page, 'utf8'), hm = hashRe.exec(pageText);
if (!hm) { console.error("Could not find `var SIM_HASH='...';` in prototype.html"); process.exit(1); }
if (hm[1] !== simHash) {
  if (!write) { console.error('SIM_HASH in prototype.html is stale (the simulation section hashes to ' + simHash.slice(0, 12) + '...). Run sim-check with --write and commit the page.'); process.exit(1); }
  writeFileSync(page, pageText.replace(hashRe, "var SIM_HASH='" + simHash + "';"));
  console.log('Updated SIM_HASH in prototype.html.');
}

let ref = null;
try { ref = JSON.parse(readFileSync(refPath, 'utf8')); } catch { /* no reference yet */ }
if (!write && ref && ref.simHash === simHash) {
  console.log('Simulation unchanged since the reference was recorded; replay skipped.');
  process.exit(0);
}

const PF = new Function('window', 'document', sim + '\nreturn window.PF;')({}, null);
// Free play at the defaults, chill on and off, plus one campaign roster; full run() output is hashed per seed.
const cases = [
  {name: 'chill on', chill: 1, roster: null},
  {name: 'chill off', chill: 0, roster: null},
  {name: 'steward alone', chill: 1, roster: ['steward']},
];
const SEEDS = 100;
const chill0 = PF.K.chill;
const results = {};
for (const c of cases) {
  PF.K.chill = c.chill;
  results[c.name] = [];
  for (let s = 1; s <= SEEDS; s++) {
    const r = PF.run(s, 'custom', c.roster);
    results[c.name].push(createHash('sha256').update(JSON.stringify(r)).digest('hex').slice(0, 16));
  }
}
PF.K.chill = chill0;

if (write) {
  writeFileSync(refPath, JSON.stringify({simHash, seeds: SEEDS, results}, null, 1) + '\n');
  console.log('Recorded results for ' + cases.length * SEEDS + ' games in reference.json.');
  process.exit(0);
}
if (!ref) { console.error('No reference.json; run with --write and commit it.'); process.exit(1); }

let diffs = 0;
for (const c of cases) {
  (ref.results[c.name] || []).forEach((h, i) => {
    if (results[c.name][i] !== h) { diffs++; if (diffs <= 20) console.log('changed: ' + c.name + ', seed ' + (i + 1)); }
  });
}
if (diffs) {
  console.error(diffs + ' of ' + cases.length * SEEDS + ' games changed. If the change is intended, run with --write and commit reference.json.');
  process.exit(1);
}
console.log('The simulation code changed but all ' + cases.length * SEEDS + ' games match; run with --write to record the new code.');
