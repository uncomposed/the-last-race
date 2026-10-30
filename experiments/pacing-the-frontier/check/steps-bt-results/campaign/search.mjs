// Screen box-override (or seed) candidates for one campaign slot on calibration noise (bot play only).
//   node search.mjs --spec spec.json --out out.json [--workers 5]
// spec: {cands:[{id, seed, tiers:[[roster]x3], boxes}], start, count, diff, players, knobs, consts, strikesDelta}
// Output per candidate: per probe {win, wins per tier, stopRev mean/p75, scrapes, falls, dissolved, extinct}, probe mean per tier, track stats.
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import {writeFileSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const HERE = fileURLToPath(import.meta.url);
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const r3 = x => Math.round(x * 1000) / 1000;

async function evalCand(c, spec) {
  const {runRace, GAME, trackStats, PROBES} = await import('../../steps-bt.mjs');
  // mechanism probes (not lesson probes): the climber and rush with their box/barrier stop odds swapped
  PROBES.climb0 = Object.assign({}, PROBES.climber, {bar: 0}); PROBES.rush1 = Object.assign({}, PROBES.rush, {bar: 1});
  const D = {easy: 0, medium: 1, hard: 2}, diff = spec.diff || 'medium';
  const strikesYou = GAME.CAMP_DIFF[D[diff]].strikes + (spec.strikesDelta || 0);
  const res = {id: c.id, seed: c.seed, boxes: c.boxes, tiers: c.tiers, probes: {}, probeMeanPerTier: []};
  const tierW = c.tiers.map(() => []);
  for (const p of spec.players) {
    const rows = [];
    for (let t = 0; t < c.tiers.length; t++) for (let z = spec.start; z < spec.start + spec.count; z++) {
      const r = runRace({seed: c.seed, roster: c.tiers[t].slice(), steps: 1, chill: 0, strikesYou, knobs: spec.knobs || {}, consts: spec.consts || {},
        boxes: c.boxes || null, player: p, nz: z, jitter: z});
      const L = r.labs[0]; rows.push({t, win: r.outcome === 'win' ? 1 : 0, sr: L.stopRev, sg: L.stopRevGap, bc: L.crashBar, side: L.sideScrapes, scr: L.scrapes, f: L.falls, d: L.dissolved, x: r.extinction ? 1 : 0});
      tierW[t].push(r.outcome === 'win' ? 1 : 0);
    }
    const n = rows.length, m = f => r3(rows.reduce((s, r) => s + f(r), 0) / n);
    res.probes[p] = {win: m(r => r.win), tiers: c.tiers.map((_, t) => r3(rows.filter(r => r.t === t).reduce((s, r) => s + r.win, 0) / spec.count)),
      srMean: m(r => r.sr), sgMean: m(r => r.sg), sgP75: q(rows.map(r => r.sg), 0.75), bc: m(r => r.bc), side: m(r => r.side), srP75: q(rows.map(r => r.sr), 0.75), srMax: Math.max(...rows.map(r => r.sr)), scr: m(r => r.scr), falls: m(r => r.f), diss: m(r => r.d), ext: m(r => r.x),
      winSrP75: rows.some(r => r.win) ? q(rows.filter(r => r.win).map(r => r.sr), 0.75) : null};
  }
  res.probeMeanPerTier = tierW.map(a => r3(a.reduce((s, x) => s + x, 0) / a.length));
  const T = trackStats({seed: c.seed, steps: 1, boxes: c.boxes || null, knobs: spec.knobs || {}, consts: spec.consts || {}});
  res.track = {label: T.label, n: T.n, nearMax: T.nearMax, nowarn: T.nowarn, boxes: T.boxes.map(b => b.shape ? `${b.shape}${b.nowarn ? '!' : ''} r${b.rise}/W${b.W} hb${b.hNeedBot}` : `flat W${b.W}`)};
  return res;
}
if (isMainThread) {
  const a = {}; const av = process.argv.slice(2);
  for (let i = 0; i < av.length; i += 2) a[av[i].slice(2)] = av[i + 1];
  const spec = JSON.parse(readFileSync(a.spec, 'utf8')), nW = +(a.workers || 5);
  const t0 = Date.now(); let next = 0; const out = [];
  await Promise.all(Array.from({length: nW}, () => new Promise((res, rej) => {
    const w = new Worker(HERE, {workerData: {spec}});
    const feed = () => { if (next < spec.cands.length) w.postMessage(spec.cands[next++]); else { w.terminate(); res(); } };
    w.on('message', m => { out.push(m); feed(); }); w.on('error', rej); feed();
  })));
  out.sort((x, y) => String(x.id).localeCompare(String(y.id), undefined, {numeric: true}));
  writeFileSync(a.out, JSON.stringify({spec: Object.assign({}, spec, {cands: undefined}), results: out}) + '\n');
  console.log(out.length + ' candidates in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s -> ' + a.out);
} else {
  parentPort.on('message', async c => parentPort.postMessage(await evalCand(c, workerData.spec)));
}
