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
