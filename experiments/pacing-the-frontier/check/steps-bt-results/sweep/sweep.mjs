// Sweep runner: audit/race.mjs's race() on audit/page-timing.html (BOXU 0.25, today's generator) with K/C overrides.
//   node sweep.mjs --mode campaign|daily|free --start N --count M --steps 0|1 [--chill 0|1] [--knobs JSON] [--consts JSON] --out f.jsonl
//   node sweep.mjs --mode layout [--knobs JSON] [--consts JSON] --out f.json   (gap x/W/rise per campaign map + free seeds 0-99, steps on)
import {writeFileSync} from 'node:fs';
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
const here = new URL('.', import.meta.url).pathname;
process.env.PF_PAGE = here + '../audit/page-timing.html';
process.argv[1] = 'sweep-host';  // keep race.mjs's CLI block from running
const H = await import('../audit/bt.mjs');
const {race} = await import('../audit/race.mjs');
const {PF, GAME, campaignConfig, dailyConfig, trackStats} = H;
const knobs = A.knobs ? JSON.parse(A.knobs) : {}, consts = A.consts ? JSON.parse(A.consts) : {};
const mode = A.mode, start = +A.start, count = +A.count, steps = +(A.steps ?? 1), chill = +(A.chill ?? 0);
const players = (A.players || 'runup,climber,gamble,scout,balanced,bold,rush,drafter,follower,twin,crawl,smart').split(',');
const rows = [], t0 = Date.now();
const emit = (cfg, extra) => { for (const p of players) rows.push(Object.assign(race(cfg, p), extra)); };
function addDays(ds, n) { return new Date(Date.parse(ds + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
if (mode === 'campaign') {
  for (let i = 0; i < GAME.CAMPAIGN.length; i++) for (let t = 0; t < 3; t++) for (let z = start; z < start + count; z++) {
    const c = campaignConfig(i, t, {diff: 'medium', chill, steps, knobs, consts});
    emit(Object.assign(c, {nz: z, jitter: z}), {map: i + 1, tier: t + 1});
  }
} else if (mode === 'daily') {
  const d0 = GAME.BRIEFINGS[0].added;
  for (let k = 0; k < count; k++) { const ds = addDays(d0, start + k);
    for (let t = 0; t < 3; t++) { const c = dailyConfig(ds, t, {chill, steps, knobs, consts}); emit(c, {date: ds, tier: t + 1, twist: c.twist}); } }
} else if (mode === 'free') {
  for (let s = start; s < start + count; s++) emit({seed: s, steps, roster: null, chill, strikesYou: null, knobs, consts}, {});
} else if (mode === 'layout') {
  const out = [];
  for (let i = 0; i < GAME.CAMPAIGN.length; i++) { const c = campaignConfig(i, 0, {diff: 'medium', steps: 1, knobs, consts});
    const s = trackStats(c); out.push({id: 'map' + (i + 1), finish: s.finish, nearMax: s.nearMax, n: s.boxes.filter(b => b.shape).length, nowarn: s.nowarn, g: s.boxes.map(b => [b.W, b.rise, b.hNeed])}); }
  for (let s = 0; s < 100; s++) { const r = trackStats({seed: s, steps: 1, knobs, consts});
    out.push({id: 'free' + s, finish: r.finish, nearMax: r.nearMax, n: r.boxes.filter(b => b.shape).length, nowarn: r.nowarn, g: r.boxes.map(b => [b.W, b.rise, b.hNeed])}); }
  writeFileSync(A.out, JSON.stringify(out)); console.log(A.out, 'layout'); process.exit(0);
} else throw new Error('mode');
writeFileSync(A.out, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(A.out, rows.length, 'races', ((Date.now() - t0) / 1000).toFixed(0), 's');
