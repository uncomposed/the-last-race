// Checks that a recorded run replays to exactly the same result at the live game's 1/60 s step, which is what a leaderboard server
// relies on to verify a time. Plain Node, no dependencies. Usage:
//   node experiments/pacing-the-frontier/check/replay-check.mjs           run the checks
//   node experiments/pacing-the-frontier/check/replay-check.mjs --write   record new reference runs (commit replay-reference.json)
//   node experiments/pacing-the-frontier/check/replay-check.mjs --html    also write check/replay-browser.html (see below)
// It checks:
//   (a) the reference runs in replay-reference.json, recorded once, still replay to their stored results, exactly;
//   (b) runs recorded fresh now (chill off and on, chill switched mid-race, a player who hammers the jump key) replay exactly;
//   (c) the negative control: logging jumps the old way (recTick without recAfter) is caught on the hammering player;
//   (d) the deterministic dsin, dcos, dlog and dexp stay within 1e-12 of Math's;
//   (e) the logs carry the simulation hash in their header.
// This is Node against Node: it proves the recorder and the replayer agree, not that another browser computes the same race. For that,
// --html writes replay-browser.html, a single page that carries the simulation and the reference runs and replays them in whatever
// browser opens it, showing each finish time. Compare its output across Safari, Chrome and Firefox and Node.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadPage, dailyApi, compileSim, recordDaily, replay, sameResult, ReplayError, RESULT_FIELDS} from './replay-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const refPath = join(here, 'replay-reference.json');
const htmlPath = join(here, 'replay-browser.html');
const write = process.argv.includes('--write'), html = process.argv.includes('--html');
const t0 = Date.now();

const {lines, sim, simHash} = loadPage();
const fresh = compileSim(sim), daily = dailyApi(lines);
let fails = 0;
function check(ok, msg) { if (!ok) { fails++; console.log('FAIL ' + msg); } }

// the runs to record: dates across the schedule, all three tiers, chill off and on, one mid-race chill switch, two hammering players
const SPEC = [];
for (const [i, date] of ['2026-10-01', '2026-10-09', '2026-10-17', '2026-10-28', '2026-11-05', '2026-11-20'].entries()) {
  for (const tier of [0, 1, 2]) SPEC.push({date, tier, chill: (i + tier) % 2, player: 11 + i * 3 + tier});
}
SPEC.push({date: '2026-10-28', tier: 1, chill: 0, toggleChillAt: 700, player: 41}, {date: '2026-11-05', tier: 2, chill: 1, toggleChillAt: 500, player: 42});
SPEC.push({date: '2026-10-09', tier: 0, chill: 0, mash: true, player: 51}, {date: '2026-10-28', tier: 2, chill: 0, mash: true, player: 52});

if (write) {
  const runs = SPEC.map(o => recordDaily({fresh, daily, simHash, ...o}));
  writeFileSync(refPath, JSON.stringify({simHash, runs}) + '\n');
  console.log('Recorded ' + runs.length + ' runs (' + runs.filter(r => r.result.won).length + ' wins) in replay-reference.json.');
}

// (a) the stored reference runs
let ref = null;
if (existsSync(refPath)) ref = JSON.parse(readFileSync(refPath, 'utf8'));
check(!!ref && ref.runs.length >= 20, '(a) replay-reference.json is missing or has fewer than 20 runs; run with --write and commit it');
if (ref) {
  ref.runs.forEach((log, i) => {
    let r = null;
    try { r = replay(fresh, log); } catch (e) { if (!(e instanceof ReplayError)) throw e; check(false, '(a) reference run ' + i + ' cannot be replayed: ' + e.message); return; }
    check(sameResult(r, log.result), '(a) reference run ' + i + ' (' + log.h.date + ' tier ' + (log.h.tier + 1) + ') replayed to ' + JSON.stringify(r) + ', stored ' + JSON.stringify(log.result) +
      '. If the simulation changed on purpose, run with --write and commit the new reference');
  });
  check(ref.runs.some(r => r.result.won), '(a) no reference run is a win');
  check(ref.runs.some(r => r.h.chill) && ref.runs.some(r => !r.h.chill), '(a) the reference needs both chill off and chill on');
  if (ref.simHash !== simHash && !write) console.log('note: the reference was recorded on an older simulation, and its runs still replay identically.');
}

// (b) fresh runs replay exactly, and their headers name this simulation
let fresh_n = 0, hammer = 0, hammerOld = 0;
for (const o of SPEC) {
  const log = recordDaily({fresh, daily, simHash, ...o});
  fresh_n++;
  let r = null; try { r = replay(fresh, log); } catch (e) { check(false, '(b) a fresh run (' + JSON.stringify(o) + ') cannot be replayed: ' + e.message); continue; }
  check(sameResult(r, log.result), '(b) a fresh run (' + JSON.stringify(o) + ') replayed to ' + JSON.stringify(r) + ', recorded ' + JSON.stringify(log.result));
  check(log.h.sim === simHash, '(e) a log header lacks the simulation hash');
  // (c) the same hammering player with the old jump logging must NOT replay
  if (o.mash) {
    hammer++;
    const old = recordDaily({fresh, daily, simHash, ...o, oldJumpLog: true});
    let ro = null; try { ro = replay(fresh, old); } catch (e) { ro = null; }
    if (!ro || !sameResult(ro, old.result)) hammerOld++;
  }
}
check(hammer > 0 && hammerOld === hammer, '(c) the old jump logging should fail on every hammering run, but failed on ' + hammerOld + ' of ' + hammer + ': this check no longer proves anything');

// (d) the deterministic maths against Math
{
  const {ctx} = fresh();
  let rng = 12345; const R = () => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; };
  const worst = {sin: 0, cos: 0, log: 0, exp: 0};
  for (let i = 0; i < 20000; i++) {
    const x = (R() - 0.5) * 200, u = Math.max(R(), 1e-9), e = -R() * 40;
    worst.sin = Math.max(worst.sin, Math.abs(ctx.dsin(x) - Math.sin(x)));
    worst.cos = Math.max(worst.cos, Math.abs(ctx.dcos(x) - Math.cos(x)));
    worst.log = Math.max(worst.log, Math.abs(ctx.dlog(u) - Math.log(u)));
    worst.exp = Math.max(worst.exp, Math.abs(ctx.dexp(e) - Math.exp(e)) / Math.exp(e));
  }
  for (const k in worst) check(worst[k] < 1e-12, '(d) d' + k + ' is off by ' + worst[k] + ' from Math.' + k);
  check(ctx.dlog(1) === 0 && ctx.dexp(0) === 1 && ctx.dsin(0) === 0, '(d) d-functions are wrong at their exact points');
}

if (html) writeHtml();
if (fails) { console.error(fails + ' failed.'); process.exit(1); }
console.log('Replay check passed: ' + (ref ? ref.runs.length : 0) + ' reference runs and ' + fresh_n + ' fresh runs replay exactly; ' + hammerOld + ' of ' + hammer +
  ' hammering runs caught with the old jump logging (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s).');

// A single page with the simulation and the reference runs inside. Open it in a browser: it replays every run and shows each finish.
function writeHtml() {
  const lib = readFileSync(join(here, 'replay-lib.mjs'), 'utf8');
  const cut = (name) => { const i = lib.indexOf(name); let d = 0, j = lib.indexOf('{', i); for (; j < lib.length; j++) { if (lib[j] === '{') d++; if (lib[j] === '}' && --d === 0) break; } return lib.slice(i, j + 1); };
  const exposeLine = lib.split('\n').find(l => l.startsWith('const EXPOSE'));
  const tailBlock = lib.slice(lib.indexOf('const TAIL'), lib.indexOf('// A compiled simulation'));
  const body = [exposeLine, tailBlock, cut('export function compileSim'), cut('export class ReplayError'), cut('export function replay'),
    'const RESULT_FIELDS = ' + JSON.stringify(RESULT_FIELDS) + ';', cut('export function sameResult')].join('\n').replace(/export /g, '');
  const data = {simHash, sim, runs: ref.runs};
  const page = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Replay check</title>
<style>body{font:15px/1.4 system-ui,sans-serif;margin:16px;max-width:46em}pre{white-space:pre-wrap;word-break:break-all;background:#f3f3f3;padding:8px;border-radius:6px}
.ok{color:#0b5fa5;font-weight:600}.bad{color:#b45309;font-weight:600}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}pre{background:#222}.ok{color:#6cb4ee}.bad{color:#f0a040}}</style>
<h1>Replay check</h1>
<p>Replays ${ref.runs.length} recorded runs at 1/60 s in this browser and compares each result with the stored one. Every line says <b>OK</b> or <b>DIFFERENT</b>, never colour alone.</p>
<p id="verdict">Running...</p><pre id="env"></pre><pre id="out"></pre>
<script>
${body}
const DATA = ${JSON.stringify(data).replace(/<\//g, '<\\/')};
function run() {
  const fresh = compileSim(DATA.sim), out = [], sig = [];
  let bad = 0;
  DATA.runs.forEach((log, i) => {
    let r, note = 'OK';
    try { r = replay(fresh, log); if (!sameResult(r, log.result)) { bad++; note = 'DIFFERENT (stored t=' + log.result.t + ' x=' + log.result.x + ' ticks=' + log.result.ticks + ')'; } }
    catch (e) { bad++; r = {t: '-', x: '-', ticks: '-', type: 'error'}; note = 'DIFFERENT (' + e.message + ')'; }
    sig.push(r.type + ':' + r.t + ':' + r.x + ':' + r.ticks);
    out.push((i + 1 + '').padStart(2) + '. ' + log.h.date + ' tier ' + (log.h.tier + 1) + (log.h.chill ? ' chill' : '      ') + '  ' + r.type + ' t=' + r.t + ' x=' + r.x + ' ticks=' + r.ticks + '  ' + note);
  });
  document.getElementById('verdict').innerHTML = bad ? '<span class="bad">' + bad + ' of ' + DATA.runs.length + ' runs are DIFFERENT in this browser.</span>' : '<span class="ok">All ' + DATA.runs.length + ' runs replay exactly (OK) in this browser.</span>';
  document.getElementById('env').textContent = navigator.userAgent + '\\nsimulation ' + DATA.simHash;
  document.getElementById('out').textContent = out.join('\\n') + '\\n\\nfinish list (compare across browsers):\\n' + sig.join('\\n');
}
try { run(); } catch (e) { document.getElementById('verdict').textContent = 'Could not run: ' + e.message; }
</script>
`;
  writeFileSync(htmlPath, page);
  console.log('Wrote check/replay-browser.html (' + Math.round(page.length / 1024) + ' KB).');
}
