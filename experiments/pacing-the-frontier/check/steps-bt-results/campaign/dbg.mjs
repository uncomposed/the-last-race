// node dbg.mjs seed player nz roster(comma) [strikes] [boxesJSON]: print a race's events and log lines
import {runRace, PF} from '../../steps-bt.mjs';
const [seed, player, nz, roster, strikes, boxes] = process.argv.slice(2);
const r = runRace({seed: +seed, player, nz: +nz, jitter: +nz, roster: roster.split(','), steps: 1, chill: 0, strikesYou: +(strikes || 3), boxes: boxes ? JSON.parse(boxes) : null});
console.log(r.outcome, r.detail, r.type, r.winner, 't', r.t);
for (const l of r.labs) console.log(' ', l.kind, 'x', l.x, 'gi', l.gi, 'str', l.strikes, 'scr', l.scrapes, 'side', l.sideScrapes, 'falls', l.falls, 'diss', l.dissolved, 'bc', l.crashBar, 'tc', l.crashTower, 'stopRev', l.stopRev, 'stops', l.stops);
