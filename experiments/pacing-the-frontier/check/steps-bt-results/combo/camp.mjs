// Campaign lesson probes, steps off, Medium, chill off: node camp.mjs name knobsJSON z0 nz out
import {writeFileSync} from 'node:fs';
import {race} from '../economy/scen.mjs';
const H = await import('../audit/bt.mjs');
const {GAME, campaignConfig} = H;
const [nm, kn, z0, nz, out] = process.argv.slice(2), KN = JSON.parse(kn), rows = [];
const P = ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin'];
globalThis.SCEN = null;
for (let i = 0; i < GAME.CAMPAIGN.length; i++) for (let t = 0; t < 3; t++) for (let z = +z0; z < +z0 + +nz; z++) {
  const c = campaignConfig(i, t, {diff: 'medium', chill: 0, steps: 0, knobs: KN});
  for (const p of P) { const r = race(Object.assign(c, {nz: z, jitter: z}), p); rows.push({nm, map: i + 1, tier: t + 1, z, p, win: r.win, ext: r.ext, dis: r.dis, sr0: r.sr0, theme: GAME.CAMPAIGN[i].theme}); }
}
writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); console.log(out, rows.length);
