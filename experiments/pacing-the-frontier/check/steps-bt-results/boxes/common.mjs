// shared seed blocks and configs for the boxes study
import {GAME, dailyConfig} from './bt.mjs';
export const DECENT = ['follower', 'scout', 'balanced', 'runup', 'climber', 'twin', 'custom'];
export function addDays(ds, n) { return new Date(Date.parse(ds + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
export const D0 = GAME.BRIEFINGS[0].added;
export function dailyDates(start, count) { const a = []; for (let k = 0; k < count; k++) a.push(addDays(D0, start + k)); return a; }
// one track per daily date (tier 1 config; the twist's knobs apply), plus overrides
export function dailyTrackCfgs(start, count, extra = {}) {
  return dailyDates(start, count).map(ds => { const c = dailyConfig(ds, 0, {}); c.knobs = Object.assign({}, c.knobs, extra.knobs || {}); c.consts = extra.consts; return c; });
}
export function freeTrackCfgs(start, count, extra = {}) { const a = []; for (let s = start; s < start + count; s++) a.push({seed: s, roster: null, chill: 0, knobs: extra.knobs, consts: extra.consts}); return a; }
// STEPTW='{"Wider Gaps":{"gapScale":110}}' replaces those twists' knobs (step-day twist values); dailyConfig and lesson.mjs read the same object
if (process.env.STEPTW) for (const [k, v] of Object.entries(JSON.parse(process.env.STEPTW))) { const o = GAME.TWISTS[k]; for (const x in o) delete o[x]; Object.assign(o, v); }
