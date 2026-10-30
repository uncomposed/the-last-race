// Worker for boxprobe.mjs: node bpsweep.mjs '<cfg JSON>' out.json
// cfg: {mode: free|daily|campaign, start, count, chill?, steps?, knobs?, consts?, strikesYou?, diff?, notwist?, players: ['crawl', 'smart', 'none', 'crawl:scout', ...]}
import {writeFileSync} from 'node:fs';
import {runBoxRace} from './boxprobe.mjs';
import {campaignConfig, dailyConfig, GAME} from '../../steps-bt.mjs';
const cfg = JSON.parse(process.argv[2]), out = process.argv[3], rows = [];
const parse = p => { const [mode, base] = p.split(':'); return {mode, base: base || null}; };
for (const p of cfg.players) {
  const o = parse(p);
  if (cfg.mode === 'free') for (let s = cfg.start; s < cfg.start + cfg.count; s++)
    rows.push(Object.assign(runBoxRace({seed: s, roster: null, knobs: cfg.knobs, consts: cfg.consts, strikesYou: cfg.strikesYou, chill: cfg.chill ?? 1, steps: cfg.steps ?? 1}, o), {s, pl: p}));
  if (cfg.mode === 'daily') for (let k = cfg.start; k < cfg.start + cfg.count; k++) {
    const ds = new Date(Date.parse(GAME.BRIEFINGS[0].added + 'T00:00:00Z') + k * 864e5).toISOString().slice(0, 10);
    for (let t = 0; t < 3; t++) { const c = dailyConfig(ds, t, {chill: cfg.chill ?? 0, steps: cfg.steps ?? 1, knobs: cfg.knobs, consts: cfg.consts}); if (cfg.notwist) c.knobs = Object.assign({}, cfg.knobs || {});
      rows.push(Object.assign(runBoxRace(Object.assign({}, c, {chill: cfg.chill ?? 0, steps: cfg.steps ?? 1}), o), {s: k, tier: t + 1, tw: c.twist, pl: p})); }
  }
  if (cfg.mode === 'campaign') for (let i = 0; i < GAME.CAMPAIGN.length; i++) for (let t = 0; t < 3; t++) for (let z = cfg.start; z < cfg.start + cfg.count; z++) {
    const c = campaignConfig(i, t, {diff: cfg.diff || 'medium', chill: cfg.chill ?? 0, steps: cfg.steps ?? 1, knobs: cfg.knobs, consts: cfg.consts});
    if (cfg.strikesYou !== undefined) c.strikesYou = cfg.strikesYou;
    rows.push(Object.assign(runBoxRace(Object.assign({}, c, {nz: z, chill: cfg.chill ?? 0, steps: cfg.steps ?? 1}), o), {s: z, m: i + 1, tier: t + 1, pl: p}));
  }
}
writeFileSync(out, JSON.stringify({cfg, rows}) + '\n');
