// Tuning worker: runs one config over one block and writes compact per-race rows (for paired standard errors).
// node sweep.mjs '<config JSON>' out.json
// config: {mode:'free'|'campaign'|'daily', start, count, players?, chill?, knobs?, consts?, strikesYou? (campaign: player strikes; default from diff), diff?}
// Row fields (player = lab 0): win dis ext extOwn fall scr str sscr (scrape strikes = scrapes when strikeGap on) lastStrike (ended on last strike or dissolved)
//   aF aS (all labs falls, scrapes) nw (no-warning boxes on the map) nwMet nwFall nwScr (player meets/falls/scrapes a no-warning box) rwin (a rival won) sr (stop-or-reverse spots)
import {writeFileSync} from 'node:fs';
import {runRace, campaignConfig, dailyConfig, PROBES, GAME, K} from '../../steps-bt.mjs';
const cfg = JSON.parse(process.argv[2]), out = process.argv[3];
const players = cfg.players || (cfg.mode === 'free' ? ['custom', ...Object.keys(PROBES)] : Object.keys(PROBES));
const knobs = cfg.knobs || {}, consts = cfg.consts || {};
const rows = [];
function row(r, extra) {
  const p = r.labs[0], lim = r.strikesYou ?? knobs.strikes ?? K.strikes;
  rows.push(Object.assign({win: r.outcome === 'win' ? 1 : 0, dis: p.dissolved, ext: r.extinction ? 1 : 0, extOwn: p.extTriggered, fall: p.falls, scr: p.scrapes, str: p.strikes,
    lastStrike: (p.dissolved || p.strikes >= lim - 1) ? 1 : 0, disScr: p.dissolved && p.scrapes > 0 ? 1 : 0, disBarOnly: p.dissolved && p.scrapes === 0 ? 1 : 0,
    aF: r.labs.reduce((a, l) => a + l.falls, 0), aS: r.labs.reduce((a, l) => a + l.scrapes, 0), aDis: r.labs.slice(1).reduce((a, l) => a + l.dissolved, 0),
    nw: r.nNowarn, nwMet: p.nowarn.clean + p.nowarn.scrape + p.nowarn.fall, nwFall: p.nowarn.fall, nwScr: p.nowarn.scrape,
    rwin: r.type === 'win' && r.wid !== 0 ? 1 : 0, sr: p.stopRev, nG: r.nGaps, t: r.t}, extra));
}
if (cfg.mode === 'free') {
  for (let s = cfg.start; s < cfg.start + cfg.count; s++) for (const pl of players)
    row(runRace({seed: s, steps: cfg.steps ?? 1, roster: null, player: pl, chill: cfg.chill ?? 1, knobs, consts, strikesYou: cfg.strikesYou ?? undefined}), {s, pl});
} else if (cfg.mode === 'campaign') {
  const diff = cfg.diff || 'medium';
  for (let i = 0; i < GAME.CAMPAIGN.length; i++) for (let t = 0; t < 3; t++) for (let z = cfg.start; z < cfg.start + cfg.count; z++) for (const pl of players) {
    const c = campaignConfig(i, t, {diff, chill: cfg.chill ?? 0, steps: cfg.steps ?? 1, knobs, consts});
    if (cfg.strikesYou !== undefined) c.strikesYou = cfg.strikesYou;
    row(runRace(Object.assign({}, c, {player: pl, nz: z, jitter: z})), {s: z, m: i + 1, tier: t + 1, pl});
  }
} else if (cfg.mode === 'daily') {
  for (let k = cfg.start; k < cfg.start + cfg.count; k++) {
    const ds = new Date(Date.parse(GAME.BRIEFINGS[0].added + 'T00:00:00Z') + k * 864e5).toISOString().slice(0, 10);
    for (let t = 0; t < 3; t++) for (const pl of players) {
      const c = dailyConfig(ds, t, {chill: cfg.chill ?? 0, steps: cfg.steps ?? 1, knobs, consts});
      row(runRace(Object.assign({}, c, {player: pl})), {s: k, tier: t + 1, pl, tw: c.twist});
    }
  }
}
writeFileSync(out, JSON.stringify({cfg, rows}) + '\n');
console.log(out, rows.length);
