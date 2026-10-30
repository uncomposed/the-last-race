// Campaign map evaluator for the step-gap re-pick (bot play only). Uses check/steps-bt.mjs (runRace, campaign semantics) with
// arbitrary seeds, rosters and box overrides, run on worker threads. Writes compact per-race rows to JSON.
//   node camp-eval.mjs --job JSON --out file.json [--workers 4]
// job: {cases:[{key, seed, tiers:[[roster],...], boxes:[{t,w}|null]|null}], start, count, diffs:['easy','medium','hard'],
//       players:[...], knobs:{}, consts:{}, strikesDelta:0, nzList:[...] (optional, replaces start/count); case.players overrides players}
// Each row: [key, tier(1-based), diff, nz, player, win, outcome-code, stopRev, scrapes, falls, strikes, dissolved, extinct(race), stops, stopRevGap, crashBar, sideScrapes]
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const HERE = fileURLToPath(import.meta.url);
const OC = {win: 0, dissolved: 1, extinct: 2, lost: 3};

async function work({job, nzs}) {
  const {runRace, GAME, PROBES} = await import('../../steps-bt.mjs');
  PROBES.climb0 = Object.assign({}, PROBES.climber, {bar: 0}); PROBES.rush1 = Object.assign({}, PROBES.rush, {bar: 1});
  const D = {easy: 0, medium: 1, hard: 2}, rows = [];
  for (const c of job.cases) for (let t = 0; t < c.tiers.length; t++) for (const diff of job.diffs) for (const z of nzs) for (const p of (c.players || job.players)) {
    const strikesYou = GAME.CAMP_DIFF[D[diff]].strikes + (job.strikesDelta || 0);
    const r = runRace({seed: c.seed, roster: c.tiers[t].slice(), steps: 1, chill: 0, strikesYou, knobs: job.knobs || {}, consts: job.consts || {},
      boxes: c.boxes || null, player: p, nz: z, jitter: z});
    const L = r.labs[0];
    rows.push([c.key, t + 1, diff, z, p, r.outcome === 'win' ? 1 : 0, OC[r.outcome], L.stopRev, L.scrapes, L.falls, L.strikes, L.dissolved, r.extinction ? 1 : 0, L.stops, L.stopRevGap, L.crashBar, L.sideScrapes]);
  }
  return rows;
}

if (isMainThread) {
  const a = {}; const av = process.argv.slice(2);
  for (let i = 0; i < av.length; i += 2) a[av[i].slice(2)] = av[i + 1];
  const job = JSON.parse(a.job), nW = +(a.workers || 4);
  const nzs = job.nzList ? job.nzList.slice() : []; if (!job.nzList) for (let z = job.start; z < job.start + job.count; z++) nzs.push(z);
  const chunks = Array.from({length: nW}, (_, k) => nzs.filter((_, i) => i % nW === k)).filter(c => c.length);
  const t0 = Date.now();
  const parts = await Promise.all(chunks.map(ch => new Promise((res, rej) => {
    const w = new Worker(HERE, {workerData: {job, nzs: ch}}); w.on('message', res); w.on('error', rej);
  })));
  const rows = parts.flat();
  writeFileSync(a.out, JSON.stringify({job, rows}) + '\n');
  console.log('rows ' + rows.length + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s -> ' + a.out);
} else {
  work(workerData).then(r => parentPort.postMessage(r));
}
